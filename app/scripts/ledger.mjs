// ledger.mjs — who reached the price while nobody was looking.
//
// who.mjs answers "who was here in the last 24 hours", because the zone
// refuses a range wider than one day. For two months I read that limit as "the
// zone forgets after a day". It does not. Asked one day at a time it answers
// for days up to 4 weeks 3 days old: in full for roughly the last three weeks,
// and as a one-in-ten sample before that (the row's count reads 10).
//
// What that misreading cost, found 2026-11-15: no wake ran on 5 or 6 November,
// and a visitor in South Africa made a book and a free cover and was shown the
// $19 box on the 5th. Nobody saw it. The two unpaid checkouts of 26 October and
// 1 November were logged as two events; they were one person, six visits in
// ten days. A 24-hour window read every three hours shows none of that.
//
// So: a local ledger. Every run fills in each day since the last run, for both
// sites, and prints what is new. A wake after an outage sees everyone it
// missed, and a count "since <date>" is a line count, not an archaeology.
//
// What it keeps is narrow on purpose, the same rule as who.mjs: only the
// signals a page fires when someone ran the app (made a file, was shown a
// price, pressed pay, arrived by a ?ref= link), and requests for the one short
// address that only a video clip shows. Never page loads, never a dump
// of everyone who touched the site. The ledger holds addresses, because a
// return visit is only visible by address; it lives in .search/, which git
// does not track. Nothing printed here belongs in plan/ or actual/ with the
// address still on it.
//
// Usage: node scripts/ledger.mjs            fill in since the last run, print what is new
//        node scripts/ledger.mjs --all      print every row that is not mine
//        node scripts/ledger.mjs --since 2026-10-20   summary from that day on
//        node scripts/ledger.mjs --trail <ip>         every ledger row for one address
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

export const HOSTS = {
  pp: "puzzlepress.bananafest-destiny.com",
  tp: "tracepress.bananafest-destiny.com",
};

// The signals worth a line. `price` marks the ones that mean "this person saw
// or acted on a price"; the rest say the app was used or how they arrived.
export const SIGNALS = {
  pp: {
    made: "made a book", coverpay: "made a free cover, shown the $19 box", pay: "opened the $19 box", checkout: "pressed Buy (sent to Stripe)",
    unlock: "opened the box to enter a purchase email", ref: "arrived by a ?ref= link",
  },
  tp: {
    made: "made a workbook", namemade: "made a name sheet", papermade: "made paper", cardsmade: "made cards",
    covermade: "made a cover", coverpay: "made a cover, shown the $19 box", pay: "opened the $19 box", classpay: "class list, shown the $19 box", cardspay: "cards, shown the $19 box",
    checkout: "pressed Buy (sent to Stripe)", unlock: "opened the box to enter a purchase email", verified: "a purchase email was accepted",
    pack: "opened a holiday pack page ($3.50)", packbuy: "pressed Buy on a pack", packgot: "downloaded a paid pack", ref: "arrived by a ?ref= link",
  },
};
// Plain addresses worth a line: a request, not a beacon. /trace (2026-11-16)
// is in no page, nav or sitemap; it exists so a video clip can show an address
// short enough to type, and public/_redirects on Trace Press sends it on to
// the tracing worksheet generator with ?ref=trace. So whoever asks for it read
// it on a clip, or is a robot guessing. The `ref` row the same minute from the
// same address, which only a browser running the page sends, tells them apart.
// Puzzle Press has three, one for each calculator the clips are shot on
// (public/_redirects there, ?ref=clip).
const spellings = (name) => [`/${name}`, `/${name}/`, `/${name[0].toUpperCase()}${name.slice(1)}`, `/${name.toUpperCase()}`];
const routesFor = (...names) => Object.fromEntries(names.flatMap((n) => spellings(n).map((p) => [p, n])));
export const ROUTES = {
  pp: routesFor("spine", "royalty", "margin"),
  tp: routesFor("trace"),
};
export const ROUTE_SIGNALS = {
  trace: "asked for /trace, the short address a clip shows",
  spine: "asked for /spine, the short address a clip shows",
  royalty: "asked for /royalty, the short address a clip shows",
  margin: "asked for /margin, the short address a clip shows",
};
export const pathsOf = (site) => [...Object.keys(SIGNALS[site]).map((s) => `/px/${s}.gif`), ...Object.keys(ROUTES[site])];
export const signalOf = (site, path) => ROUTES[site][path] ?? path.replace(/^\/px\//, "").replace(/\.gif$/, "");
export const meaningOf = (site, signal) => SIGNALS[site]?.[signal] ?? ROUTE_SIGNALS[signal] ?? "";

export const PRICE = {
  // Puzzle Press fires nothing when a purchase email is accepted; a sale there
  // is read from Stripe, never from here.
  pp: ["coverpay", "pay", "checkout"],
  tp: ["coverpay", "pay", "classpay", "cardspay", "checkout", "verified", "pack", "packbuy", "packgot"],
};

// The first run reaches back as far as the zone will answer, sampled days and
// all: what is not copied today is gone tomorrow.
export const FIRST_RUN_DAYS = 30;
const DAY = 86400e3;
// `count` is the zone's estimate of events in that minute; `si` is the sample
// interval it was estimated from. si 1 means every request was kept; si 10
// means one in ten was, so nine in ten visitors of that day left no row.
const COLS = ["day", "time", "site", "signal", "ip", "country", "count", "si", "mine", "ua"];

export const keyOf = (r) => [r.day, r.time, r.site, r.signal, r.ip].join("|");

export const parseLedger = (text) => {
  const rows = [];
  let covered = null;
  for (const line of text.split("\n")) {
    if (!line) continue;
    if (line.startsWith("#covered ")) { covered = line.slice(9).trim(); continue; }
    if (line.startsWith("#") || line.startsWith("day\t")) continue;
    const f = line.split("\t");
    rows.push(Object.fromEntries(COLS.map((c, i) => [c, c === "count" || c === "si" ? Number(f[i]) : f[i] ?? ""])));
  }
  return { rows, covered };
};

export const formatLedger = (rows, covered) =>
  [`#covered ${covered}`, COLS.join("\t"), ...rows.map((r) => COLS.map((c) => String(r[c] ?? "").replace(/[\t\n]/g, " ")).join("\t"))].join("\n") + "\n";

// Merge fetched rows into the ledger. A day that is fetched twice (the last
// covered day always is, because it was incomplete when first read) must not
// double its rows, and a row first seen at full detail must not be replaced by
// the same row read later from the one-in-ten sample.
export const merge = (old, fetched) => {
  const seen = new Map(old.map((r) => [keyOf(r), r]));
  const added = [];
  for (const r of fetched) {
    if (seen.has(keyOf(r))) continue;
    seen.set(keyOf(r), r);
    added.push(r);
  }
  const all = [...seen.values()].sort((a, b) => (a.day + a.time + a.site).localeCompare(b.day + b.time + b.site));
  return { all, added };
};

// The UTC days to fetch: from the day the ledger was last covered through (it
// was only part-read then) up to today.
export const daysToFetch = (covered, now, firstRunDays = FIRST_RUN_DAYS) => {
  const today = Math.floor(now / DAY) * DAY;
  let from = covered ? Math.floor(Date.parse(covered) / DAY) * DAY : today - firstRunDays * DAY;
  // Never ask for a day the zone would refuse (older than 4 weeks 3 days).
  from = Math.max(from, today - 30 * DAY);
  const out = [];
  for (let t = from; t <= today; t += DAY) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
};

export const mineTest = (ips) => {
  const prefixes = ips.filter((ip) => ip.includes(":")).map((ip) => ip.split(":").slice(0, 4).join(":") + ":");
  return (ip) => ips.includes(ip) || prefixes.some((p) => ip.startsWith(p));
};

// Distinct addresses per price signal, not mine, from a day on. An address
// counted here is one that reached a price, which is the number every "has
// this offer been tested" question needs.
export const summarize = (rows, since = "0000-00-00") => {
  const out = {};
  for (const site of Object.keys(PRICE)) {
    out[site] = {};
    for (const sig of PRICE[site]) {
      const hit = rows.filter((r) => r.site === site && r.signal === sig && r.mine !== "1" && !robotOf(r.ua) && r.day >= since);
      out[site][sig] = { addresses: new Set(hit.map((r) => r.ip)).size, events: hit.length, sampled: hit.some((r) => r.si > 1) };
    }
  }
  return out;
};

// A robot that runs JavaScript fires every signal a person does, and says so
// in its user agent. Google's inspection tool (what runs when the boss presses
// "Request indexing") opened a holiday pack twice on 2 November; without this
// it reads as two shoppers.
export const robotOf = (ua) =>
  (ua.match(/\(compatible; ([^;)/]+)/) || ua.match(/(Googlebot|bingbot|Applebot|meta-externalagent|facebookexternalhit|HeadlessChrome|[A-Za-z-]+[Bb]ot)\b/) || [])[1] ?? null;

const shortUa = (ua) => {
  const bot = robotOf(ua);
  if (bot) return `ROBOT (${bot})`;
  const os = /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Macintosh/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "?";
  const br = /HeadlessChrome/.test(ua) ? "HeadlessChrome" : /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : ua.slice(0, 20);
  return `${os} ${br}`;
};

// Group rows by address and print each as a short trail.
export const describe = (rows) => {
  const by = new Map();
  for (const r of rows) (by.get(r.ip) ?? by.set(r.ip, []).get(r.ip)).push(r);
  const lines = [];
  for (const [ip, rs] of by) {
    lines.push(`${ip}  ${rs[0].country}  ${shortUa(rs[0].ua)}${rs[0].mine === "1" ? "  [MINE]" : ""}`);
    for (const r of rs) lines.push(`    ${r.day} ${r.time}Z  ${r.site}  ${r.signal.padEnd(10)} ${meaningOf(r.site, r.signal)}${r.count > 1 && !(r.si > 1) ? `  x${r.count}` : ""}${r.si > 1 ? `  (one-in-${Math.round(r.si)} sample)` : ""}`);
  }
  return lines;
};

// ---------------------------------------------------------------- network --

const main = async () => {
  const argv = process.argv.slice(2);
  const arg = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
  const root = new URL("../../", import.meta.url);
  const creds = readFileSync(new URL(".git-credentials", root), "utf8");
  const CF = (creds.match(/^CLOUDFLARE_API_TOKEN=(.*)$/m) || [])[1]?.trim();
  const ZONE = "4169ea6b92a0920d72f9ebc5f7653e9d";
  const dir = new URL(".search/ledger/", root);
  const file = new URL("px.tsv", dir);
  mkdirSync(dir, { recursive: true });
  const { rows: old, covered } = existsSync(file) ? parseLedger(readFileSync(file, "utf8")) : { rows: [], covered: null };

  if (arg("--trail")) {
    console.log(describe(old.filter((r) => r.ip === arg("--trail"))).join("\n") || "no ledger row for that address");
    return;
  }

  const traceIp = (flag) =>
    new Promise((res) =>
      execFile("curl", ["-s", flag, "--max-time", "10", `https://${HOSTS.pp}/cdn-cgi/trace`],
        (err, out) => res(err ? null : (String(out).match(/^ip=(.*)$/m) || [])[1]?.trim() || null)));
  const nowIps = (await Promise.all([traceIp("-4"), traceIp("-6")])).filter(Boolean);
  if (!nowIps.length) console.log("WARNING: could not learn this machine's address; my own test runs will not be marked.");
  const isMine = mineTest(nowIps);

  const now = Date.now();
  const fetched = [];
  for (const day of daysToFetch(covered, now)) {
    for (const [site, host] of Object.entries(HOSTS)) {
      const paths = pathsOf(site).map((p) => `"${p}"`).join(",");
      const query = `{viewer{zones(filter:{zoneTag:"${ZONE}"}){httpRequestsAdaptiveGroups(limit:2000,orderBy:[datetimeMinute_ASC],filter:{datetime_geq:"${day}T00:00:00Z",datetime_leq:"${day}T23:59:59Z",clientRequestHTTPHost:"${host}",clientRequestPath_in:[${paths}]}){count avg{sampleInterval} dimensions{datetimeMinute clientIP clientRequestPath clientCountryName userAgent}}}}}`;
      const r = await fetch("https://api.cloudflare.com/client/v4/graphql", {
        method: "POST",
        headers: { authorization: `Bearer ${CF}`, "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const d = await r.json();
      if (d.errors) {
        // A refused day must stop the run: writing "covered through now" over a
        // hole is exactly the silent zero this file exists to end.
        throw new Error(`${day} ${site}: ${d.errors.map((e) => e.message).join("; ")}`);
      }
      for (const g of d.data.viewer.zones[0].httpRequestsAdaptiveGroups) {
        const x = g.dimensions;
        fetched.push({
          day, time: x.datetimeMinute.slice(11, 16), site,
          signal: signalOf(site, x.clientRequestPath),
          ip: x.clientIP, country: x.clientCountryName, count: g.count, si: Math.round(g.avg.sampleInterval * 100) / 100,
          mine: isMine(x.clientIP) ? "1" : "0", ua: x.userAgent.slice(0, 240),
        });
      }
    }
  }

  const { all, added } = merge(old, fetched);
  writeFileSync(file, formatLedger(all, new Date(now).toISOString().replace(/\.\d+Z$/, "Z")));

  const show = argv.includes("--all") ? all.filter((r) => r.mine !== "1") : added.filter((r) => r.mine !== "1");
  const mineAdded = added.filter((r) => r.mine === "1").length;
  console.log(`Ledger: ${all.length} rows, ${all[0]?.day ?? "-"} to ${all.at(-1)?.day ?? "-"}. Last covered ${covered ?? "never (first run)"}; now covered to ${new Date(now).toISOString().slice(0, 16)}Z.`);
  console.log(`${argv.includes("--all") ? "Every row not mine" : "New since the last run"}: ${show.length} rows from ${new Set(show.map((r) => r.ip)).size} addresses${argv.includes("--all") ? "" : ` (plus ${mineAdded} of my own)`}.\n`);
  if (show.length) console.log(describe(show).join("\n") + "\n");

  const since = arg("--since") ?? all[0]?.day ?? "0000-00-00";
  const s = summarize(all, since);
  console.log(`Reached a price since ${since} (addresses that are not mine / events):`);
  for (const site of Object.keys(s)) {
    console.log(`  ${site}: ` + Object.entries(s[site]).map(([k, v]) => `${k} ${v.addresses}/${v.events}${v.sampled ? "~" : ""}`).join("   "));
  }
  console.log(`\nAn address is not a person until RDAP says whose it is (who.mjs does that for the last day; for older rows: curl -sL https://rdap.org/ip/<address>).`);
  console.log(`Rows older than about three weeks come from a one-in-ten sample: a day that old with no row is not a day with no visitor.`);
};

// Importing this file must not run it (sample.mjs taught that on 2026-10-19).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();

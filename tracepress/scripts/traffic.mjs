// Trace Press traffic: who ran the page, how far down the funnel they got,
// where they came from, and whether anyone paid. It's separate from Puzzle
// Press's app/scripts/traffic.mjs, which is built around that site's history.
// The data is the same kind:
//   - the zone log (about a day kept): /px/ beacon hits on this host, counted
//     by distinct address. A beacon only fires from a running page, so a
//     crawler fetching HTML never counts. My own tests are excluded by
//     user agent (trace-press-test/*, puzzle-press-test/*, HeadlessChrome).
//   - Cloudflare Web Analytics (account-wide, 7 days): referrer, landing
//     path and device for requestHost tracepress.*. The page carries the
//     Puzzle Press beacon token; the host is what separates the two.
//   - Stripe: checkout sessions on the Trace Press Payment Link only. The
//     account is shared, and emails aren't printed.
//
// Usage: node scripts/traffic.mjs [hoursBack] [--ips]
//   --ips lists the addresses behind each beacon, to check with
//   `npm run who -- --trail <ip>` in app/ before calling one a person.
import { readFileSync } from "node:fs";
import { execFile } from "node:child_process";

const args = process.argv.slice(2);
const hours = Number(args.find((a) => /^\d+(\.\d+)?$/.test(a)) || 24); // 1.5 is 1.5 hours, not the default
const showIps = args.includes("--ips");
// The keys live in the parent build repo's .git-credentials; in a standalone
// clone, set them in the environment instead.
let creds = "";
try { creds = readFileSync(new URL("../../.git-credentials", import.meta.url), "utf8"); } catch {}
const get = (k) => process.env[k] || (creds.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim();
const CF = get("CLOUDFLARE_API_TOKEN");
const ACCOUNT = get("CLOUDFLARE_ACCOUNT_ID");
const STRIPE = get("STRIPE_KEY");
const ZONE = "4169ea6b92a0920d72f9ebc5f7653e9d"; // bananafest-destiny.com, as in app/scripts/traffic.mjs
const HOST = "tracepress.bananafest-destiny.com";
const PAY_LINK_ID = "plink_1UL3wZRo6ix1hE5vuzRD7tSY";
const MINE = /trace-press-test|puzzle-press-test|HeadlessChrome/;

// This network: the addresses this machine holds now, and for IPv6 its whole
// /64, because privacy extensions rotate the last 64 bits (app/scripts/traffic.mjs
// learned that on 09-14). Same line as the boss's own browser, so a beacon from
// here is never a customer. 10-02: a /tracing-worksheet-generator "visitor" was this.
const traceIp = (flag) => new Promise((res) => execFile("curl", ["-s", flag, "--max-time", "10", "https://tracepress.bananafest-destiny.com/cdn-cgi/trace"],
  (err, out) => res(err ? null : (String(out).match(/^ip=(.*)$/m) || [])[1]?.trim() || null)));
const HERE = [...new Set((await Promise.all([traceIp("-4"), traceIp("-6")])).filter(Boolean))]
  .map((ip) => (ip.includes(":") ? ip.split(":").slice(0, 4).join(":") + ":" : ip));
const fromHere = (ip = "") => HERE.some((p) => (p.endsWith(":") ? ip.startsWith(p) : ip === p));
// Robots that run the page's JavaScript fire the beacons too, and name
// themselves: on 2026-10-02 Meta's crawler (meta-externalagent) and Applebot
// were 60 of 69 "visitors" on Puzzle Press in a day (app/scripts/who.mjs).
const BOT_UA = /bot\b|bot\/|crawler|spider|externalagent|externalhit/i;
// Meta's link-preview renderer does not name itself. When a link is shared on
// Facebook it runs the page from Meta's own range, 2a03:2880::/32, as plain
// Chrome (Windows Chrome 74, or "Android 10; K"), in the same minute that
// facebookexternalhit fetches the page. On 2026-10-19/20 it was every
// "m.facebook.com" and "www.facebook.com" referral in the 7-day web analytics,
// and the 2a03:2880 address under "ran the page". A person reading Facebook comes
// from their own ISP, not from Meta's network, so this range is never a reader.
const META = /^2a03:2880:/i;
// The funnel, in order. Each is a real file in public/px/.
const RUNGS = [
  ["ref", "opened any page from a ?ref= link we handed out"],
  ["ran", "ran the page"],
  ["touched", "changed a control"],
  ["cursive", "picked Cursive"],
  ["pager", "paged through the preview"],
  ["download", "pressed Download"],
  ["made", "got a PDF"],
  ["cover", "pressed Download cover"],
  ["covermade", "got a cover"],
  ["listing", "copied the listing description"],
  ["keyword", "copied a keyword"],
  ["paper", "ran /handwriting-paper"],
  ["papertouched", "changed a paper control"],
  ["paperdownload", "pressed Download paper"],
  ["papermade", "got a paper PDF"],
  ["name", "ran /name-tracing"],
  ["words", "ran /tracing-worksheet-generator"],
  ["nametouched", "typed a name or words, or changed a control (any name/words page)"],
  ["cursivename", "ran /cursive-name-tracing"],
  ["namecursive", "picked Cursive on a name/words sheet"],
  ["namedownload", "pressed Download name/words sheet"],
  ["namemade", "got a name/words sheet"],
  ["classpay", "typed a class list (shown the price)"],
  ["cards", "ran /sight-word-flash-cards"],
  ["cardstouched", "changed a flash card control"],
  ["cardspairs", "ticked Matching game (each word twice)"],
  ["cardsbacks", "ticked Coloured backs"],
  ["cardspay", "picked Your own words (shown the price)"],
  ["cardsdownload", "pressed Download flash cards"],
  ["cardsmade", "got flash cards"],
  ["game", "ran /sight-word-matching-game"],
  ["gameflip", "turned a card in the game"],
  ["gamewon", "finished a game"],
  ["gamefull", "put the game full screen"],
  ["gameown", "typed their own words into the game"],
  ["gamelink", "copied a game link"],
  ["gameshared", "opened a game link with someone's words"],
  ["gamenote", "printed take-home notes with a game code"],
  ["gamepics", "picked the word-and-picture game"],
  ["gameholiday", "picked the Thanksgiving game"],
  ["cvc", "ran /cvc-worksheets"],
  ["cvctouched", "changed the CVC line size"],
  ["cvcdownload", "pressed Download CVC sheets"],
  ["cvcmade", "got CVC sheets"],
  ["count", "ran /count-and-trace-worksheets"],
  ["counttouched", "changed the count line size"],
  ["countdownload", "pressed Download count sheets"],
  ["countmade", "got count sheets"],
  ["pdf", "clicked a free sample PDF link (any page)"],
  ["pack", "opened a holiday page that offers the $3.50 pack"],
  ["packbuy", "pressed the pack's buy button"],
  ["packgot", "typed their email and got the pack"],
  ["packfail", "typed an email and were refused the pack (no payment found, or an error)"],
  ["failed", "hit an error making any PDF"],
  ["coverpay", "shown the price after a free cover (opens by itself)"],
  ["pay", "opened the pay dialog"],
  ["checkout", "clicked through to Stripe"],
  ["verified", "unlocked"],
];
const iso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, "Z");
const since = iso(Date.now() - hours * 3600e3);

async function graphql(query) {
  const r = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { authorization: `Bearer ${CF}`, "content-type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const d = await r.json();
  if (d.errors) throw new Error(d.errors.map((e) => e.message).join("; "));
  return d.data;
}

console.log(`Trace Press, last ${hours}h (since ${since})`);

try {
  const z = await graphql(`query { viewer { zones(filter: {zoneTag: "${ZONE}"}) {
    httpRequestsAdaptiveGroups(limit: 5000, filter: {datetime_geq: "${since}", clientRequestHTTPHost: "${HOST}", clientRequestPath_like: "/px/%"}) {
      count dimensions { clientIP userAgent clientRequestPath }
    } } } }`);
  const rows = z.viewer.zones[0].httpRequestsAdaptiveGroups;
  const byRung = new Map();
  let tests = 0;
  const robots = new Set();
  for (const { dimensions: d } of rows) {
    if (MINE.test(d.userAgent || "") || fromHere(d.clientIP)) { tests++; continue; }
    if (BOT_UA.test(d.userAgent || "") || META.test(d.clientIP || "")) { robots.add(d.clientIP); continue; }
    const name = d.clientRequestPath.replace(/^\/px\/|\.gif$/g, "");
    if (!byRung.has(name)) byRung.set(name, new Set());
    byRung.get(name).add(d.clientIP);
  }
  console.log(`\n  Funnel (distinct addresses; ${tests} beacon rows from my own tests or this network and ${robots.size} robot addresses left out):`);
  for (const [name, label] of RUNGS) {
    const ips = byRung.get(name) ?? new Set();
    console.log(`    ${String(ips.size).padStart(4)}  ${label}${showIps && ips.size ? `  — ${[...ips].join(", ")}` : ""}`);
  }
  const unknown = [...byRung.keys()].filter((k) => !RUNGS.some(([n]) => n === k));
  if (unknown.length) console.log(`    (unlisted beacon paths: ${unknown.join(", ")})`);
} catch (e) {
  console.log(`\n  (zone log unavailable: ${e.message.slice(0, 100)})`);
}

// The sample PDFs are fetched, not run, so no beacon: a crawler counts the
// same as a person here. Read the user agents (--ips) before calling it people.
try {
  const z = await graphql(`query { viewer { zones(filter: {zoneTag: "${ZONE}"}) {
    httpRequestsAdaptiveGroups(limit: 2000, filter: {datetime_geq: "${since}", clientRequestHTTPHost: "${HOST}", clientRequestPath_like: "/samples/%"}) {
      count dimensions { clientIP userAgent clientRequestPath }
    } } } }`);
  const rows = z.viewer.zones[0].httpRequestsAdaptiveGroups.filter((r) => !MINE.test(r.dimensions.userAgent || ""));
  const byFile = new Map();
  for (const { dimensions: d } of rows) {
    if (!byFile.has(d.clientRequestPath)) byFile.set(d.clientRequestPath, new Map());
    byFile.get(d.clientRequestPath).set(d.clientIP, d.userAgent);
  }
  console.log(`\n  Sample PDFs fetched (distinct addresses, crawlers included):${byFile.size ? "" : " none"}`);
  for (const [path, ips] of byFile) {
    console.log(`    ${String(ips.size).padStart(4)}  ${path}`);
    if (showIps) for (const [ip, ua] of ips) console.log(`          ${ip}  ${(ua || "").slice(0, 90)}`);
  }
} catch (e) {
  console.log(`\n  (sample log unavailable: ${e.message.slice(0, 100)})`);
}

try {
  const rumSince = iso(Date.now() - 7 * 86400e3);
  const r = await graphql(`query { viewer { accounts(filter: {accountTag: "${ACCOUNT}"}) {
    rumPageloadEventsAdaptiveGroups(limit: 500, filter: {datetime_geq: "${rumSince}", bot: 0, requestHost: "${HOST}"}) {
      count avg { sampleInterval } dimensions { datetimeMinute requestPath refererHost deviceType countryName }
    } } } }`);
  const rows = r.viewer.accounts[0].rumPageloadEventsAdaptiveGroups;
  // Match each facebook.com row to the zone log: Meta's renderer runs the same
  // path in the same minute from 2a03:2880. On 2026-10-21 all 11 facebook
  // loads of the week matched; none was a person.
  const fb = rows.filter((x) => /facebook\.com$/.test(x.dimensions.refererHost || ""));
  const fbSplit = { meta: 0, other: 0, old: 0 };
  const fbOther = [];
  for (const x of fb) {
    const t = Date.parse(x.dimensions.datetimeMinute);
    try {
      const z = await graphql(`query { viewer { zones(filter: {zoneTag: "${ZONE}"}) {
        httpRequestsAdaptiveGroups(limit: 100, filter: {datetime_geq: "${iso(t - 60e3)}", datetime_lt: "${iso(t + 120e3)}", clientRequestHTTPHost: "${HOST}", clientRequestPath: "${x.dimensions.requestPath}"}) {
          count dimensions { clientIP userAgent } } } } }`);
      const hits = z.viewer.zones[0].httpRequestsAdaptiveGroups.filter((h) => !BOT_UA.test(h.dimensions.userAgent || ""));
      if (hits.length && hits.every((h) => META.test(h.dimensions.clientIP || ""))) fbSplit.meta += x.count;
      else {
        fbSplit.other += x.count;
        fbOther.push(`${x.dimensions.datetimeMinute.slice(5, 16)}Z ${x.dimensions.requestPath} ${x.dimensions.deviceType} ${x.dimensions.countryName}  ${[...new Set(hits.filter((h) => !META.test(h.dimensions.clientIP || "")).map((h) => h.dimensions.clientIP))].join(" ") || "(no zone row)"}`);
      }
    } catch { fbSplit.old += x.count; }
  }
  const total = rows.reduce((a, x) => a + x.count, 0);
  const tally = (pick) => {
    const m = new Map();
    for (const x of rows) m.set(pick(x.dimensions) || "(none)", (m.get(pick(x.dimensions) || "(none)") ?? 0) + x.count);
    return [...m].sort((a, b) => b[1] - a[1]);
  };
  console.log(`\n  Last 7 days by the page beacon: ${total} page loads (Cloudflare's bot filter; my headless tests are NOT excluded here)`);
  if (rows.some((x) => (x.avg?.sampleInterval ?? 1) !== 1)) console.log("    (SAMPLED: estimates, not counts. Run again.)");
  console.log("    Referred by:");
  for (const [h, n] of tally((d) => d.refererHost).slice(0, 10)) console.log(`      ${String(n).padStart(4)}  ${h === "(none)" ? "(no referer: typed, bookmarked, or opened in an app)" : h}`);
  if (fb.length) console.log(`    facebook.com, matched to the zone log by path and minute: ${fbSplit.meta} Meta's link-preview renderer (2a03:2880, not a person), ${fbSplit.other} from elsewhere (look before calling it a person), ${fbSplit.old} older than the zone log keeps`);
  if (showIps) for (const line of fbOther) console.log(`      ${line}`);
  console.log(`    Landed on: ${tally((d) => d.requestPath).slice(0, 6).map(([k, n]) => `${k} ${n}`).join(", ")}`);
  console.log(`    Device: ${tally((d) => d.deviceType).map(([k, n]) => `${k} ${n}`).join(", ")}`);
} catch (e) {
  console.log(`\n  (web analytics unavailable: ${e.message.slice(0, 100)})`);
}

try {
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions?payment_link=${PAY_LINK_ID}&limit=100`, {
    headers: { authorization: `Bearer ${STRIPE}` },
  });
  const j = await res.json();
  if (j.error) throw new Error(j.error.message);
  const paid = j.data.filter((s) => s.payment_status === "paid");
  console.log(`\n  Stripe, Trace Press link, all time: ${j.data.length} checkout session(s), ${paid.length} paid${j.has_more ? " (more than 100; first page only)" : ""}`);
  for (const s of j.data.slice(0, 10)) {
    console.log(`    ${iso(s.created * 1000)}  ${s.status}/${s.payment_status}  ${(s.amount_total / 100).toFixed(2)} ${s.currency.toUpperCase()}  ${s.client_reference_id ?? "(untagged)"}`);
  }
} catch (e) {
  console.log(`\n  (Stripe unavailable: ${e.message.slice(0, 100)})`);
}

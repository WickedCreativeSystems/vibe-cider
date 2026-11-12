// /compare by UTC hour: who fetched the page, who ran it (fired /px/compare),
// and who pressed through (/px/compareclick), with each address's owner.
//
// Written for 2026-10-23, when /compare goes out in a newsletter. Newsletter
// clicks often carry no referrer, so the hour is the signal. A mail service
// checking a link fetches the page and fires the beacon, just like a reader:
// on 10-22 at 13:14Z two Google addresses did exactly that, minutes after the
// table was emailed. So every address that ran the page is named by RDAP, and
// a hosting or mail network (Google, Microsoft, Amazon…) is shown as such,
// not counted as a person.
//
// Usage: node scripts/compare-hourly.mjs [hours, max 23.5]
import { readFileSync } from "node:fs";
import { execFile } from "node:child_process";

const hours = Math.min(Number(process.argv[2] || 23.5), 23.5);
const creds = readFileSync(new URL("../../.git-credentials", import.meta.url), "utf8");
const CF = (creds.match(/^CLOUDFLARE_API_TOKEN=(.*)$/m) || [])[1]?.trim();
const ACCOUNT = (creds.match(/^CLOUDFLARE_ACCOUNT_ID=(.*)$/m) || [])[1]?.trim();
const ZONE = "4169ea6b92a0920d72f9ebc5f7653e9d";
const since = new Date(Date.now() - hours * 3600e3).toISOString().replace(/\.\d+Z$/, "Z");

const r = await fetch("https://api.cloudflare.com/client/v4/graphql", {
  method: "POST",
  headers: { authorization: `Bearer ${CF}`, "content-type": "application/json" },
  body: JSON.stringify({ query: `query { viewer { zones(filter: {zoneTag: "${ZONE}"}) {
    httpRequestsAdaptiveGroups(limit: 5000, filter: {datetime_geq: "${since}", clientRequestHTTPHost_like: "%puzzle%", OR: [{clientRequestPath: "/compare"}, {clientRequestPath_like: "/px/compare%"}]}, orderBy: [datetimeMinute_ASC]) {
      count dimensions { datetimeMinute clientIP clientRequestPath userAgent } } } } }` }),
});
const d = await r.json();
if (d.errors) throw new Error(d.errors.map((e) => e.message).join("; "));
const rows = d.data.viewer.zones[0].httpRequestsAdaptiveGroups;

// This machine: asked at run time, never written down here. The IPv4 address
// as it is now, and for IPv6 the /64, because the last 64 bits rotate daily.
const traceIp = (flag) =>
  new Promise((res) =>
    execFile("curl", ["-s", flag, "--max-time", "10", "https://puzzlepress.bananafest-destiny.com/cdn-cgi/trace"],
      (err, out) => res(err ? null : (String(out).match(/^ip=(.*)$/m) || [])[1]?.trim() || null)));
const nowIps = (await Promise.all([traceIp("-4"), traceIp("-6")])).filter(Boolean);
const myPrefixes = nowIps.filter((ip) => ip.includes(":")).map((ip) => ip.split(":").slice(0, 4).join(":") + ":");
const mine = (ip) => nowIps.includes(ip) || myPrefixes.some((p) => ip.startsWith(p));
const namesItself = (ua) => /bot|crawl|spider|slurp|preview|facebookexternalhit|curl|python|node|go-http|headless/i.test(ua);
const NETWORK = /google|microsoft|amazon|aws|cloudflare|tencent|alibaba|huawei|hwcsnet|oracle|digitalocean|linode|akamai|ovh|hetzner|proofpoint|mimecast|barracuda|yahoo|apple/i;

const owners = new Map();
const owner = async (ip) => {
  if (!owners.has(ip)) {
    try {
      const j = await (await fetch(`https://rdap.org/ip/${ip}`, { headers: { accept: "application/rdap+json", "user-agent": "curl/8.5.0" } })).json();
      const ent = (j.entities || []).flatMap((e) => (e.vcardArray?.[1] || []).filter((v) => v[0] === "fn").map((v) => v[3]));
      owners.set(ip, [j.name, ...ent].filter(Boolean).join(" / ") || "?");
    } catch { owners.set(ip, "?"); }
  }
  return owners.get(ip);
};

// 404s are counted over the whole day the zone log keeps, whatever the window,
// and an IPv6 address by its /64: on 10-23 at 09:13Z the same Magticom feed
// reader came back from a new address in the same /64 with no 404s of its own,
// and was counted as a person.
const weekSince = new Date(Date.now() - 7 * 24 * 3600e3).toISOString().replace(/\.\d+Z$/, "Z");
const net = (ip) => (ip.includes(":") ? ip.split(":").slice(0, 4).join(":") + "::/64" : ip);

// An address that hunts for /rss, /feed and the like piles up 404s; who.mjs
// calls 5+ a scanner, and so does this. On 10-22 a Magticom (Georgia) address
// ran /compare, "pressed" and then read the zoo's feed: a feed reader, not a
// newsletter reader. Its network came back 10-23 09:13Z on a new address, and
// by 13Z its 404s were older than a day, so the look-back is the zone log's week.
const nf = await (await fetch("https://api.cloudflare.com/client/v4/graphql", {
  method: "POST",
  headers: { authorization: `Bearer ${CF}`, "content-type": "application/json" },
  body: JSON.stringify({ query: `query { viewer { zones(filter: {zoneTag: "${ZONE}"}) {
    httpRequestsAdaptiveGroups(limit: 5000, filter: {datetime_geq: "${weekSince}", clientRequestHTTPHost_like: "%puzzle%", edgeResponseStatus: 404}) {
      count dimensions { clientIP } } } } }` }),
})).json();
const notFound = new Map();
for (const g of nf.data?.viewer.zones[0].httpRequestsAdaptiveGroups || []) notFound.set(net(g.dimensions.clientIP), (notFound.get(net(g.dimensions.clientIP)) || 0) + g.count);
const scanner = (ip) => (notFound.get(net(ip)) || 0) >= 5;

const H = new Map();
for (const { datetimeMinute: m, clientIP: ip, clientRequestPath: p, userAgent: ua } of rows.map((x) => x.dimensions)) {
  if (mine(ip)) continue;
  const h = m.slice(0, 13) + "Z";
  const e = H.get(h) || { fetched: new Set(), ran: new Map(), clicked: new Set(), robots: new Set() };
  if (namesItself(ua)) e.robots.add(ip);
  else if (p === "/compare") e.fetched.add(ip);
  else if (p.startsWith("/px/compareclick")) e.clicked.add(ip);
  else if (!e.ran.has(ip)) e.ran.set(ip, m.slice(11, 16));
  H.set(h, e);
}

console.log(`/compare by UTC hour since ${since}, this machine left out`);
console.log(`hour           fetched  ran it  people  pressed  robots`);
for (const [h, e] of H) {
  const ran = await Promise.all([...e.ran].map(async ([ip, t]) => [ip, t, await owner(ip)]));
  const people = ran.filter(([ip, , o]) => !NETWORK.test(o) && !scanner(ip));
  console.log(`${h} ${String(e.fetched.size).padStart(8)} ${String(ran.length).padStart(7)} ${String(people.length).padStart(7)} ${String([...e.clicked].filter((ip) => people.some(([p]) => p === ip)).length).padStart(8)} ${String(e.robots.size).padStart(7)}`);
  for (const [ip, t, o] of ran) console.log(`    ${t}Z  ${ip.padEnd(40)} ${o}${NETWORK.test(o) ? "   (network, not counted)" : scanner(ip) ? `   (scanner, ${notFound.get(net(ip))} 404s from its network this week, not counted)` : ""}${e.clicked.has(ip) ? "   PRESSED" : ""}`);
}

// Where the /compare loads came from, by hour, from Cloudflare's Web Analytics
// beacon (account-scoped; the zone log has no referrer on this plan). A
// newsletter platform's click-tracking host shows up here when it passes a
// referrer; "(none)" is the usual answer for a mail app. This machine can't be
// left out here, since the beacon carries no address: a run of tests shows as
// "(none)" too, so read it against the people column above.
try {
  const rum = await (await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { authorization: `Bearer ${CF}`, "content-type": "application/json" },
    body: JSON.stringify({ query: `query { viewer { accounts(filter: {accountTag: "${ACCOUNT}"}) {
      rumPageloadEventsAdaptiveGroups(limit: 1000, filter: {datetime_geq: "${since}", bot: 0, requestPath: "/compare"}) {
        count dimensions { datetimeHour requestHost refererHost deviceType } } } } }` }),
  })).json();
  if (rum.errors) throw new Error(rum.errors.map((e) => e.message).join("; "));
  const loads = rum.data.viewer.accounts[0].rumPageloadEventsAdaptiveGroups.filter((g) => /puzzle/.test(g.dimensions.requestHost || ""));
  console.log(`\n/compare page loads by referrer (Web Analytics beacon, Cloudflare's bot filter)`);
  if (!loads.length) console.log("    none");
  for (const { count, dimensions: d } of loads.sort((a, b) => a.dimensions.datetimeHour.localeCompare(b.dimensions.datetimeHour)))
    console.log(`    ${d.datetimeHour.slice(0, 13)}Z  ${String(count).padStart(3)}  ${(d.refererHost || "(none)").padEnd(36)} ${d.deviceType || ""}`);
} catch (e) {
  console.log(`\n(referrers unavailable: ${String(e.message).slice(0, 100)})`);
}

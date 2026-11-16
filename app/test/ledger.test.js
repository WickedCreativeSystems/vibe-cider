// The ledger's network half cannot be tested here; its bookkeeping can, and the
// bookkeeping is where a silent double-count or a silent hole would come from.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLedger, formatLedger, merge, daysToFetch, mineTest, summarize, robotOf, describe, SIGNALS, PRICE, ROUTES, ROUTE_SIGNALS, pathsOf, signalOf } from "../scripts/ledger.mjs";

const row = (o = {}) => ({ day: "2026-11-05", time: "11:08", site: "pp", signal: "coverpay", ip: "192.0.2.7", country: "ZA", count: 1, si: 1, mine: "0", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/154.0.0.0 Safari/537.36", ...o });

test("importing the ledger script does not run it", () => {
  // If it ran, this file would have needed the network and a credentials file
  // before the first assertion.
  assert.equal(typeof merge, "function");
});

test("a ledger survives being written and read back", () => {
  const rows = [row(), row({ day: "2026-11-15", ip: "198.51.100.9", country: "NG", si: 10, count: 10 })];
  const back = parseLedger(formatLedger(rows, "2026-11-15T21:18:00Z"));
  assert.equal(back.covered, "2026-11-15T21:18:00Z");
  assert.deepEqual(back.rows, rows);
});

test("a tab in a user agent cannot shift the columns", () => {
  const back = parseLedger(formatLedger([row({ ua: "bad\tagent\nhere" })], "2026-11-15T00:00:00Z"));
  assert.equal(back.rows.length, 1);
  assert.equal(back.rows[0].ua, "bad agent here");
});

test("fetching a day twice does not double its rows", () => {
  const first = merge([], [row(), row({ time: "10:37", signal: "made" })]);
  assert.equal(first.added.length, 2);
  const again = merge(first.all, [row(), row({ time: "10:37", signal: "made" }), row({ time: "11:56", signal: "made" })]);
  assert.equal(again.added.length, 1);
  assert.equal(again.all.length, 3);
});

test("a row kept at full detail is not replaced by its later sampled copy", () => {
  const { all } = merge([row()], [row({ count: 10, si: 10 })]);
  assert.equal(all.length, 1);
  assert.equal(all[0].si, 1);
});

test("rows come out in time order whatever order they went in", () => {
  const { all } = merge([row({ day: "2026-11-15" })], [row({ day: "2026-10-26", time: "15:04" }), row({ day: "2026-10-26", time: "14:57", signal: "pay" })]);
  assert.deepEqual(all.map((r) => r.day + " " + r.time), ["2026-10-26 14:57", "2026-10-26 15:04", "2026-11-15 11:08"]);
});

test("the first run reaches back as far as the zone answers, and no further", () => {
  const now = Date.parse("2026-11-15T21:18:00Z");
  const days = daysToFetch(null, now);
  assert.equal(days[0], "2026-10-16");
  assert.equal(days.at(-1), "2026-11-15");
  assert.equal(days.length, 31);
});

test("a later run starts on the day it last covered, because that day was only part-read", () => {
  const now = Date.parse("2026-11-18T03:07:00Z");
  assert.deepEqual(daysToFetch("2026-11-15T21:18:00Z", now), ["2026-11-15", "2026-11-16", "2026-11-17", "2026-11-18"]);
});

test("after a gap longer than the zone remembers, it asks only for what the zone will give", () => {
  const now = Date.parse("2026-12-31T00:00:00Z");
  const days = daysToFetch("2026-11-15T21:18:00Z", now);
  assert.equal(days[0], "2026-12-01");
  assert.equal(days.at(-1), "2026-12-31");
});

test("my own machine is marked by address and by its whole IPv6 /64", () => {
  const isMine = mineTest(["203.0.113.5", "2001:db8:1:2:aaaa:bbbb:cccc:dddd"]);
  assert.equal(isMine("203.0.113.5"), true);
  assert.equal(isMine("2001:db8:1:2:1111:2222:3333:4444"), true);
  assert.equal(isMine("2001:db8:1:3:1111:2222:3333:4444"), false);
  assert.equal(isMine("203.0.113.6"), false);
});

test("a robot that names itself is named, and a person's browser is not", () => {
  assert.equal(robotOf("Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) Chrome/153.0 Mobile Safari/537.36 (compatible; Google-InspectionTool/1.0)"), "Google-InspectionTool");
  assert.equal(robotOf("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"), "bingbot");
  assert.equal(robotOf("Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/140.0.0.0 Safari/537.36"), "HeadlessChrome");
  assert.equal(robotOf(row().ua), null);
  assert.equal(robotOf("Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 Version/18.7 Mobile/15E148 Safari/604.1"), null);
});

test("the count of who reached a price leaves out me, robots, and days before the date asked", () => {
  const rows = [
    row(),                                                        // counted
    row({ day: "2026-11-15", ip: "198.51.100.9" }),               // counted
    row({ day: "2026-11-13", ip: "203.0.113.5", mine: "1" }),     // my test run
    row({ day: "2026-11-02", ip: "192.0.2.60", ua: "Chrome/153 (compatible; Google-InspectionTool/1.0)" }),
    row({ day: "2026-10-18", ip: "192.0.2.99" }),                 // before the date
    row({ day: "2026-10-26", time: "15:04", signal: "checkout", ip: "192.0.2.50" }),
    row({ day: "2026-11-01", time: "02:26", signal: "checkout", ip: "192.0.2.50" }), // the same person again
  ];
  const s = summarize(rows, "2026-10-20");
  assert.deepEqual(s.pp.coverpay, { addresses: 2, events: 2, sampled: false });
  assert.deepEqual(s.pp.checkout, { addresses: 1, events: 2, sampled: false });
  assert.deepEqual(s.pp.pay, { addresses: 0, events: 0, sampled: false });
});

test("a count that rests on a sampled day says so", () => {
  const s = summarize([row({ day: "2026-10-21", count: 10, si: 10 })], "2026-10-20");
  assert.equal(s.pp.coverpay.sampled, true);
});

test("two visits from one address read as one trail", () => {
  const lines = describe([row({ day: "2026-10-26", time: "15:04", signal: "checkout" }), row({ day: "2026-11-01", time: "02:26", signal: "checkout" })]);
  assert.equal(lines.filter((l) => !l.startsWith("    ")).length, 1);
  assert.equal(lines.filter((l) => l.includes("sent to Stripe")).length, 2);
});

test("every price signal is a signal the ledger fetches", () => {
  for (const site of Object.keys(PRICE)) for (const sig of PRICE[site]) assert.ok(SIGNALS[site][sig], `${site} ${sig}`);
});

test("every signal the ledger fetches is one a page really fires", async () => {
  // A name typed here that no page sends would read as "nobody did that" for
  // ever. Derived from the page sources, not from a list kept beside this one.
  const { readFileSync, readdirSync, existsSync } = await import("node:fs");
  // The public copy of this folder ships without the Trace Press sources.
  const fired = (dir) => !existsSync(new URL(dir, import.meta.url)) ? null : readdirSync(new URL(dir, import.meta.url)).filter((f) => f.endsWith(".js"))
    .map((f) => readFileSync(new URL(dir + f, import.meta.url), "utf8")).join("\n");
  const src = { pp: fired("../src/ui/"), tp: fired("../../tracepress/src/ui/") };
  for (const site of Object.keys(SIGNALS)) for (const sig of Object.keys(SIGNALS[site])) {
    if (src[site] === null) continue;
    assert.ok(src[site].includes(`"${sig}"`), `${site}: no page source mentions "${sig}"`);
  }
});

// /trace, 2026-11-16: the address a clip shows. It is a request, not a beacon,
// so it is asked for by its own path and must come back as its own signal.
test("the ledger asks the zone for the short clip address as well as the beacons", () => {
  const paths = pathsOf("tp");
  for (const p of ["/trace", "/trace/", "/Trace", "/px/ref.gif", "/px/made.gif"]) assert.ok(paths.includes(p), p);
  for (const p of ["/spine", "/royalty/", "/Margin", "/SPINE", "/px/coverpay.gif"]) assert.ok(pathsOf("pp").includes(p), p);
  assert.equal(signalOf("pp", "/Royalty"), "royalty");
  assert.equal(signalOf("pp", "/margin/"), "margin");
  assert.equal(signalOf("tp", "/trace"), "trace");
  assert.equal(signalOf("tp", "/Trace"), "trace");
  assert.equal(signalOf("tp", "/px/coverpay.gif"), "coverpay");
  assert.equal(signalOf("pp", "/px/made.gif"), "made");
});

test("a request for the short address prints with what it means, and is never a price", () => {
  const lines = describe([row({ site: "tp", signal: "trace" }), row({ site: "tp", signal: "ref", time: "12:01" })]);
  assert.ok(lines.some((l) => l.includes("the short address a clip shows")));
  assert.ok(lines.some((l) => l.includes("arrived by a ?ref= link")));
  for (const site of Object.keys(ROUTES)) for (const sig of Object.values(ROUTES[site])) {
    assert.ok(ROUTE_SIGNALS[sig], sig);
    assert.ok(!SIGNALS[site][sig], `${sig} is also a beacon name on ${site}`);
    assert.ok(!PRICE[site].includes(sig));
  }
});

test("every short address the ledger watches is one the site really redirects", async () => {
  // Derived from each site's redirect file, so a rule that is renamed or
  // removed there cannot leave the ledger watching a path that answers 404
  // for ever, and a rule added there cannot go unwatched.
  const { readFileSync, existsSync } = await import("node:fs");
  const files = { pp: "../public/_redirects", tp: "../../tracepress/public/_redirects" };
  for (const [site, rel] of Object.entries(files)) {
    const file = new URL(rel, import.meta.url);
    if (!existsSync(file)) { assert.equal(site, "tp", "Puzzle Press has lost its _redirects"); continue; } // the public copy ships without Trace Press
    const rules = readFileSync(file, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")).map((l) => l.split(/\s+/));
    for (const path of Object.keys(ROUTES[site])) assert.ok(rules.some((r) => r[0] === path && r[2] === "301"), `${site}: ${path} is not a 301 in _redirects`);
    for (const [from, to] of rules) {
      assert.ok(ROUTES[site][from], `${site}: _redirects sends ${from} on, and the ledger does not watch it`);
      assert.match(to, /[?&]ref=/, `${site}: ${from} carries no ?ref=, so a person cannot be told from a fetch`);
    }
  }
});

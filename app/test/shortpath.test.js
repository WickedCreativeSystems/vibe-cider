// /spine, /royalty and /margin are the addresses a video clip can show. A
// clip viewer types what is on the card and arrives with no referrer, so for
// two months nobody could say whether a clip had ever sent anyone: a visit to
// /spine-calculator typed off a clip looked like any other. A short address
// that exists nowhere but on a clip is its own attribution (the Trace Press
// /trace of 2026-11-16 is the same idea). public/_redirects sends each one on
// with ?ref=clip. This file holds the rules and what keeps them harmless.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";

const pub = new URL("../public/", import.meta.url);
const HOST = "https://puzzlepress.bananafest-destiny.com";
const WANT = { "/spine": "/spine-calculator", "/royalty": "/royalty-calculator", "/margin": "/margin-calculator" };

const rules = readFileSync(new URL("_redirects", pub), "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"))
  .map((l) => l.split(/\s+/));

test("each short address is a permanent redirect to its calculator", () => {
  for (const [short, long] of Object.entries(WANT)) {
    const cap = "/" + short[1].toUpperCase() + short.slice(2);
    for (const from of [short, short + "/", cap, short.toUpperCase()]) {
      const rule = rules.find((r) => r[0] === from);
      assert.ok(rule, `no rule for ${from}`);
      assert.equal(rule[1].split("?")[0], long, from);
      assert.equal(rule[2], "301", from);
    }
  }
});

test("every redirect lands on a page that exists", () => {
  for (const [from, to] of rules) {
    assert.ok(existsSync(new URL(`.${to.split("?")[0]}.html`, pub)), `${from} goes to ${to}, which is not a page`);
  }
});

// The page fires /px/ref.gif only when the address has ?ref=<name> and the
// name survives source.js's clean(). Fetching is not running: a robot that
// asks for /spine gets the 301 and nothing more.
test("every redirect carries a ?ref= the page will count", () => {
  for (const [from, to] of rules) {
    const ref = new URLSearchParams(to.split("?")[1] ?? "").get("ref");
    assert.match(ref ?? "", /^[a-z0-9_]{1,40}$/, `${from} goes to ${to}`);
  }
});

test("every page a redirect lands on loads the script that fires the ref beacon", () => {
  for (const to of new Set(rules.map((r) => r[1].split("?")[0]))) {
    const html = readFileSync(new URL(`.${to}.html`, pub), "utf8");
    assert.ok(html.includes('src="/js/first-touch.js"'), `${to} does not load first-touch.js`);
  }
});

test("no file or folder sits where a short address is", () => {
  const names = new Set(readdirSync(pub));
  for (const [from] of rules) {
    const name = from.replace(/^\/|\/$/g, "");
    assert.ok(!names.has(name) && !names.has(name + ".html"), `${name} exists in public/`);
  }
});

test("a short address is in no sitemap, nav or page link", () => {
  const xml = readFileSync(new URL("sitemap.xml", pub), "utf8");
  const shorts = Object.keys(WANT).map((s) => s.slice(1)).join("|");
  assert.ok(!new RegExp(`/(${shorts})/?</loc>`, "i").test(xml), "the sitemap lists a short address");
  const link = new RegExp(`href="(${HOST})?/(${shorts})/?["?#]`, "i");
  for (const f of readdirSync(pub).filter((f) => f.endsWith(".html"))) {
    assert.ok(!link.test(readFileSync(new URL(f, pub), "utf8")), `${f} links to a short address`);
  }
});

test("each calculator's canonical address is still the long path", () => {
  for (const long of Object.values(WANT)) {
    const html = readFileSync(new URL(`.${long}.html`, pub), "utf8");
    assert.ok(html.includes(`<link rel="canonical" href="${HOST}${long}">`), long);
  }
});

// /trace is the address a video clip can show: the full path to the tracing
// worksheet generator does not fit on a clip's top bar or end card, so until
// 2026-11-16 a clip showed only the host and a viewer who typed it landed on
// the home page. public/_redirects sends /trace on. This file holds that rule
// and the things that keep it harmless: the long path stays the only one a
// crawler is told about, and the arrival is counted.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";

const pub = new URL("../public/", import.meta.url);
const TARGET = "/tracing-worksheet-generator";

const rules = readFileSync(new URL("_redirects", pub), "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"))
  .map((l) => l.split(/\s+/));

test("/trace is a permanent redirect to the tracing worksheet generator", () => {
  for (const from of ["/trace", "/trace/", "/Trace", "/TRACE"]) {
    const rule = rules.find((r) => r[0] === from);
    assert.ok(rule, `no rule for ${from}`);
    assert.equal(rule[1].split("?")[0], TARGET, from);
    assert.equal(rule[2], "301", from);
  }
});

test("every redirect lands on a page that exists", () => {
  for (const [from, to] of rules) {
    assert.ok(existsSync(new URL(`.${to.split("?")[0]}.html`, pub)), `${from} goes to ${to}, which is not a page`);
  }
});

// The page fires /px/ref.gif only when the address has ?ref=<name> and the
// name survives source.js's clean(). A robot that fetches /trace gets the 301
// and nothing more; a person's browser follows it and runs the page.
test("the redirect carries a ?ref= the page will count", () => {
  for (const [from, to] of rules) {
    const ref = new URLSearchParams(to.split("?")[1] ?? "").get("ref");
    assert.match(ref ?? "", /^[a-z0-9_]{1,40}$/, `${from} goes to ${to}`);
  }
});

test("no file sits where the short path is", () => {
  for (const name of ["trace", "trace.html", "Trace", "Trace.html"]) assert.ok(!existsSync(new URL(name, pub)), name);
});

test("the short path is in no sitemap, nav or page link", () => {
  const xml = readFileSync(new URL("sitemap.xml", pub), "utf8");
  assert.ok(!/\/trace\/?<\/loc>/i.test(xml), "the sitemap lists /trace");
  for (const f of readdirSync(pub).filter((f) => f.endsWith(".html"))) {
    const html = readFileSync(new URL(f, pub), "utf8");
    assert.ok(!/href="(https:\/\/tracepress\.bananafest-destiny\.com)?\/trace\/?["?#]/i.test(html), `${f} links to /trace`);
  }
});

test("the generator's canonical address is still the long path", () => {
  const html = readFileSync(new URL(`.${TARGET}.html`, pub), "utf8");
  assert.ok(html.includes(`<link rel="canonical" href="https://tracepress.bananafest-destiny.com${TARGET}">`));
});

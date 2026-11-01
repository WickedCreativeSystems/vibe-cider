// /api/pack: the $3.50 Thanksgiving pack, sold on its own Payment Link and
// handed out by the Worker from KV. The two links must not cross: a $19
// receipt is not a pack, and a pack receipt is not the $19 unlock.
import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.js";

const session = (id, email, link) => ({ id, payment_status: "paid", payment_link: link, customer_details: { email } });

function stub(sessions) {
  globalThis.fetch = async (url) => {
    const u = new URL(url);
    const email = u.searchParams.get("customer_details[email]");
    const link = u.searchParams.get("payment_link");
    const data = sessions.filter((s) => (email ? s.customer_details.email === email : !link || s.payment_link === link));
    return Response.json({ data, has_more: false });
  };
}

const env = {
  STRIPE_KEY: "rk_test",
  PAY_LINK_ID: "plink_BOOK",
  PACK_LINK_ID: "plink_PACK",
  CHRISTMAS_PACK_LINK_ID: "plink_XMAS",
  PACKS: { get: async (key, type) => (type === "arrayBuffer" && key.endsWith("-tracing-and-matching-pack") ? new TextEncoder().encode(`%PDF-1.7 ${key}`).buffer : null) },
};
const post = (path, body, e = env) => worker.fetch(new Request(`https://x${path}`, { method: "POST", body: JSON.stringify(body) }), e);

test("a pack payment downloads the pack PDF", async () => {
  stub([session("cs_1", "parent@example.com", "plink_PACK")]);
  const res = await post("/api/pack", { email: "Parent@Example.com", pack: "thanksgiving" });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "application/pdf");
  assert.match(res.headers.get("content-disposition"), /attachment; filename="thanksgiving-tracing-and-matching-pack\.pdf"/);
  assert.equal(new TextDecoder().decode(await res.arrayBuffer()), "%PDF-1.7 thanksgiving-tracing-and-matching-pack");
});

test("a $19 receipt does not download the pack", async () => {
  stub([session("cs_2", "seller@example.com", "plink_BOOK")]);
  const res = await post("/api/pack", { email: "seller@example.com", pack: "thanksgiving" });
  assert.equal(res.status, 404);
  assert.equal((await res.json()).ok, false);
});

test("a pack receipt does not unlock the book maker", async () => {
  stub([session("cs_3", "parent@example.com", "plink_PACK")]);
  const res = await post("/api/verify", { email: "parent@example.com" });
  assert.equal(res.status, 404);
});

test("the $19 unlock still answers as before", async () => {
  stub([session("cs_4", "seller@example.com", "plink_BOOK")]);
  const res = await post("/api/verify", { email: "seller@example.com" });
  assert.deepEqual(await res.json(), { ok: true, email: "seller@example.com", token: "stripe:cs_4" });
});

test("with no pack link configured, nothing downloads", async () => {
  stub([session("cs_5", "parent@example.com", "plink_PACK")]);
  const { PACK_LINK_ID, ...noLink } = env;
  const res = await post("/api/pack", { email: "parent@example.com", pack: "thanksgiving" }, noLink);
  assert.equal(res.status, 503);
});

test("an unknown pack name, or a prototype key, is refused before Stripe is asked", async () => {
  let asked = false;
  globalThis.fetch = async () => { asked = true; return Response.json({ data: [], has_more: false }); };
  for (const pack of ["easter", "constructor", "__proto__", ""]) {
    const res = await post("/api/pack", { email: "parent@example.com", pack });
    assert.equal(res.status, 404, pack);
  }
  assert.equal(asked, false);
});

test("paid but the file is missing: says so and names the support address", async () => {
  stub([session("cs_6", "parent@example.com", "plink_PACK")]);
  const res = await post("/api/pack", { email: "parent@example.com", pack: "thanksgiving" }, { ...env, PACKS: { get: async () => null } });
  assert.equal(res.status, 503);
  assert.match((await res.json()).error, /support@/);
});

test("config.js names both links, empty when unset", async () => {
  const res = await worker.fetch(new Request("https://x/config.js"), { PAY_URL: "https://buy.stripe.com/a", PACK_URL: "" });
  const body = await res.text();
  assert.match(body, /TRACE_PRESS_PAY_URL = "https:\/\/buy\.stripe\.com\/a"/);
  assert.match(body, /TRACE_PRESS_PACK_URL = ""/);
});

test("the Christmas pack downloads only with a Christmas pack payment", async () => {
  stub([session("cs_7", "parent@example.com", "plink_XMAS")]);
  const res = await post("/api/pack", { email: "parent@example.com", pack: "christmas" });
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-disposition"), /christmas-tracing-and-matching-pack\.pdf/);
  assert.equal(new TextDecoder().decode(await res.arrayBuffer()), "%PDF-1.7 christmas-tracing-and-matching-pack");
  const other = await post("/api/pack", { email: "parent@example.com", pack: "thanksgiving" });
  assert.equal(other.status, 404);
});

test("a Thanksgiving pack receipt does not download the Christmas pack", async () => {
  stub([session("cs_8", "parent@example.com", "plink_PACK")]);
  const res = await post("/api/pack", { email: "parent@example.com", pack: "christmas" });
  assert.equal(res.status, 404);
});

test("config.js lists each pack's link, empty until it is set", async () => {
  const res = await worker.fetch(new Request("https://x/config.js"), { PACK_URL: "https://buy.stripe.com/t" });
  assert.match(await res.text(), /TRACE_PRESS_PACKS = \{"thanksgiving":"https:\/\/buy\.stripe\.com\/t","christmas":""\}/);
});

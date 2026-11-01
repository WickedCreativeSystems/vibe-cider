// Cloudflare Worker for Trace Press: static site + two small routes.
//
//   GET  /config.js     -> window.TRACE_PRESS_PAY_URL from env (empty = no Buy button)
//   POST /api/verify    -> { email } -> is there a paid Stripe Checkout Session
//                          for it, made through the Trace Press Payment Link?
//   POST /api/pack      -> { email, pack } -> the same check against a pack's
//                          own Payment Link; paid -> the pack PDF itself
//   everything else     -> static assets from public/
//
// Env: PAY_URL and PAY_LINK_ID (vars: the Payment Link and its plink_ id),
// PACK_URL and PACK_LINK_ID (the same pair for the $3.50 Thanksgiving pack),
// CHRISTMAS_PACK_URL and CHRISTMAS_PACK_LINK_ID (the Christmas pack's pair),
// PACKS (a KV namespace holding the pack PDFs: they are paid files, so they
// are never in public/ or the repo, and only this route reads them),
// STRIPE_KEY (secret; the same restricted, read-only key Puzzle Press uses).
//
// /api/verify is Puzzle Press's, copied rather than imported: the two apps
// share a Stripe account and nothing else, and a change made for one must not
// reach the other's paying customers unasked. The link check is what keeps
// the products apart: a Puzzle Press receipt does not unlock Trace Press, and
// a Trace Press receipt does not unlock Puzzle Press (each Worker accepts only
// its own PAY_LINK_ID).

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/config.js") {
      const body = `window.TRACE_PRESS_PAY_URL = ${JSON.stringify(env.PAY_URL || "")};\nwindow.TRACE_PRESS_PACK_URL = ${JSON.stringify(env.PACK_URL || "")};\nwindow.TRACE_PRESS_PACKS = ${JSON.stringify(Object.fromEntries(Object.entries(PACKS).map(([k, p]) => [k, env[p.url] || ""])))};\n`;
      return new Response(body, {
        headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "no-store" },
      });
    }

    if (url.pathname === "/api/verify") {
      if (request.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
      return verify(request, env);
    }

    if (url.pathname === "/api/pack") {
      if (request.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
      return pack(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

async function verify(request, env) {
  const found = await findPaid(request, env, env.PAY_LINK_ID);
  if (found instanceof Response) return found;
  return json({ ok: true, email: found.email, token: `stripe:${found.paid.id}` });
}

// Packs sold on their own Payment Link each. Only a payment through that
// pack's link hands out its file, so a $19 receipt does not download a pack and a pack
// receipt does not unlock the book maker (verify checks PAY_LINK_ID only).
const PACKS = {
  thanksgiving: { key: "thanksgiving-tracing-and-matching-pack", file: "thanksgiving-tracing-and-matching-pack.pdf", url: "PACK_URL", link: "PACK_LINK_ID" },
  christmas: { key: "christmas-tracing-and-matching-pack", file: "christmas-tracing-and-matching-pack.pdf", url: "CHRISTMAS_PACK_URL", link: "CHRISTMAS_PACK_LINK_ID" },
};

async function pack(request, env) {
  let name = "";
  try {
    name = String((await request.clone().json()).pack || "");
  } catch {
    return json({ ok: false, error: "Bad request." }, 400);
  }
  const p = Object.hasOwn(PACKS, name) ? PACKS[name] : null;
  if (!p) return json({ ok: false, error: "No such pack." }, 404);
  const found = await findPaid(request, env, env[p.link]);
  if (found instanceof Response) return found;
  const pdf = env.PACKS ? await env.PACKS.get(p.key, "arrayBuffer") : null;
  if (!pdf) return json({ ok: false, error: "Your payment is there, but the file could not be fetched. Email support@bananafest-destiny.com and we will send it." }, 503);
  return new Response(pdf, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${p.file}"`,
      "cache-control": "no-store",
    },
  });
}

// Is there a paid session through `link` for the email in the request body?
// Returns { email, paid } or an error Response.
async function findPaid(request, env, link) {
  if (!env.STRIPE_KEY) return json({ ok: false, error: "Checkout is not set up yet." }, 503);

  // Ten tries a minute per address. A buyer fixing a typo needs three; a script
  // wants thousands, and every one of them spends Stripe read calls on an
  // endpoint that needs no credentials to reach. The message has to be its own
  // thing: telling somebody who has genuinely paid "no payment found" because
  // they pressed the button too often is the worst answer available.
  //
  // It is deliberately loose, and it measures looser still. Against production
  // on 2026-09-14, fourteen sequential curls were all served and thirty in
  // parallel came back 23 served / 7 throttled — Cloudflare counts per colo and
  // documents this as best-effort. So it is a brake on a runaway script, not a
  // gate, and that is the right trade here: the failure I care about is the
  // Stripe key hitting its own rate limit on launch day, and the failure I
  // refuse to cause is a real buyer being turned away on their fourth try.
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  if (env.VERIFY_LIMIT) {
    const { success } = await env.VERIFY_LIMIT.limit({ key: ip });
    if (!success) {
      return json(
        {
          ok: false,
          error: "Too many tries in a row. Wait a minute and press the button again — nothing is wrong with your payment.",
        },
        429,
      );
    }
  }

  let typed = "";
  try {
    const body = await request.json();
    typed = String(body.email || "").trim();
  } catch {
    return json({ ok: false, error: "Bad request." }, 400);
  }
  const email = typed.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return json({ ok: false, error: "That does not look like an email address." }, 400);
  }

  const headers = { authorization: `Bearer ${env.STRIPE_KEY}` };
  // Stripe's address, overridable, and the override is the whole reason the
  // success path can be tested at all. Until this existed, the only way to make
  // this function return `ok: true` was for somebody to actually pay $19, so it
  // never had: a hundred test calls, every one of them an address with no
  // payment behind it, every one taking the 404 branch. The branch that hands
  // out licences had never run. STRIPE_API is not set in production and there
  // is no code path that sets it from a request — it is a binding, so only
  // somebody who can deploy the Worker can point it anywhere.
  const api = env.STRIPE_API || "https://api.stripe.com";
  // The Stripe account takes payments for Puzzle Press, for Trace Press, and
  // (found 2026-09-27) a $59/month subscription for another product entirely.
  // Only a payment through this product's own Payment Link is a licence, and
  // isPaidFor checks it on every session. Stripe also filters by link, but it
  // refuses payment_link together with customer_details ("You may only specify
  // one of these parameters", checked live 2026-09-27), so only the scan can
  // ask for it. With no link configured, refuse rather than accept all.
  if (!link) return json({ ok: false, error: "Unlocking is not available right now. Email support@bananafest-destiny.com and we will sort it out." }, 503);
  const sessions = async (params, startingAfter = null) => {
    const q = new URLSearchParams({ status: "complete", limit: "100", ...params });
    if (!("customer_details[email]" in params)) q.set("payment_link", link);
    if (startingAfter) q.set("starting_after", startingAfter);
    const res = await fetch(`${api}/v1/checkout/sessions?${q}`, { headers });
    if (!res.ok) throw new Error("stripe");
    const body = await res.json();
    return { data: body.data || [], hasMore: Boolean(body.has_more) };
  };
  const isPaidFor = (s) =>
    s.payment_status === "paid" && s.payment_link === link && ((s.customer_details || {}).email || "").toLowerCase() === email;

  let paid = null;
  let ranOut = false;
  try {
    // Exact filter first, as typed and lowercased — one call, and enough for
    // anyone who types their email the way they typed it at checkout.
    for (const candidate of [...new Set([typed, email])]) {
      const { data } = await sessions({ "customer_details[email]": candidate });
      paid = data.find(isPaidFor);
      if (paid) break;
    }
    // Stripe's filter is exact, so John@Gmail.com at checkout and
    // john@gmail.com here would otherwise be "no payment found". Fall back to
    // a case-insensitive scan of completed sessions, newest first, PAGED —
    // one page of 100 would quietly stop finding older buyers as soon as
    // there are more than a hundred sales. MAX_SCAN_PAGES keeps this inside
    // a Worker's subrequest budget (50 per request on the free plan); at 100
    // sessions a page that reaches 2,000 payments back.
    //
    // What it costs, measured against production 2026-09-13: an email with no
    // payment behind it — the worst case, because it can never short-circuit —
    // came back in 0.33 seconds, three times running. The account is nearly
    // empty, so the scan stops after one page. It grows one Stripe round trip
    // per hundred completed sessions, so the day this becomes slow is the day
    // there are a thousand sales, and that day can afford a better index.
    const MAX_SCAN_PAGES = 20;
    if (!paid) {
      let after = null;
      for (let page = 0; page < MAX_SCAN_PAGES; page++) {
        const { data, hasMore } = await sessions({}, after);
        paid = data.find(isPaidFor);
        if (paid || !hasMore || data.length === 0) break;
        after = data[data.length - 1].id;
        // Every page but the last was full and had no match; if we hit the cap
        // with more still to come, say so rather than implying they never paid.
        if (page === MAX_SCAN_PAGES - 1) ranOut = true;
      }
    }
  } catch {
    return json({ ok: false, error: "Could not reach the payment provider. Try again in a minute." }, 502);
  }

  if (!paid) {
    return json(
      {
        ok: false,
        error: ranOut
          ? "We could not find that payment automatically. Email support@bananafest-destiny.com with the email on your Stripe receipt and we will find it and sort it out by hand."
          // The ordinary way this fails is a buyer typing a different address
          // from the one Stripe has — a work address, a typo, the account
          // their card is under. Without a way out, somebody who has already
          // paid $19 is left at a dead end that says no, so this message ends
          // where the other one does.
          : "No completed payment found for that email. Use the exact email on your Stripe receipt — if that still does not work, email support@bananafest-destiny.com and we will find it and sort it out by hand.",
      },
      404,
    );
  }
  return { email, paid };
}

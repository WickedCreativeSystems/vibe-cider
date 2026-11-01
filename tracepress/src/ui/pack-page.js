// The $3.50 pack offer on a holiday worksheet page. Hidden until the Worker's
// config.js names the pack's Payment Link. After paying, Stripe sends the
// buyer back with ?pack=1, and the email they paid with downloads the PDF
// from /api/pack (the Worker checks the payment, then streams the file).
import { px } from "./px.js";
import { payHref } from "./source.js";

const box = document.getElementById("pack");
const PACK_URL = window.TRACE_PRESS_PACK_URL || "";

if (box && PACK_URL) {
  const name = box.dataset.pack;
  const buy = box.querySelector(".buybtn");
  const form = box.querySelector("form");
  const email = form.querySelector("input[type=email]");
  const note = box.querySelector(".packnote");
  buy.href = payHref(PACK_URL);
  box.hidden = false;
  px("pack");
  buy.addEventListener("click", (e) => { if (e.isTrusted) px("packbuy", { keep: true }); });

  if (new URLSearchParams(location.search).get("pack") === "1") {
    note.textContent = "Thank you. Enter the email you paid with to download the pack.";
    form.scrollIntoView({ block: "center" });
    email.focus({ preventScroll: true });
  } else if (location.hash === "#pack") {
    // The box was hidden when the browser tried the #pack jump.
    box.scrollIntoView();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button");
    btn.disabled = true;
    note.textContent = "Checking your payment…";
    try {
      const res = await fetch("/api/pack", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.value, pack: name }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong. Try again in a minute.");
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = box.dataset.file;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      px("packgot");
      note.textContent = "Downloading. Keep the file: this page will send it again whenever you enter the same email.";
    } catch (err) {
      px("packfail");
      note.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });
}

// The matching game on screen: the same sets, letters and coloured backs as
// the printed game cards (pdf/cards.js), for a child to play with a finger or
// a mouse. Turn two cards; a pair stays up, two different words turn back.
// Each card is read aloud as it turns, if the browser has a voice. Free, no
// licence: nothing here is printed.
import { planCards, cardsInk, cleanWords, LISTS, PICTURE_SET, OWN_BACK } from "../pdf/cards.js";
import { pictureFor } from "../pdf/pictures.js";
import { px } from "./px.js";
import { PRICE_LABEL } from "./license.js";
import qrcode from "qrcode-generator";

const $ = (id) => document.getElementById(id);
const el = { sets: $("sets"), size: $("size"), speak: $("speak"), speakRow: $("speakRow"), board: $("board"), score: $("score"), won: $("won"), wonText: $("wonText"), again: $("again"), print: $("print"), full: $("full"), game: $("game"), ownRow: $("ownRow"), own: $("own"), copy: $("copy"), ownNote: $("ownNote"), home: $("home"), notes: $("notes") };
const css = ([r, g, b]) => `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
const BOLD = 1.6;
const CROP = 6; // points off each edge of the printed card: the screen card is all card, no margin to cut in
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Each word as an SVG image, cut from the printed sheet: the card's strokes
// as one path per run of segments, so a card is a few dozen elements, not a
// thousand. The joint dots the PDF draws are the path's round joins here.
function wordImages(words) {
  const plan = planCards({ sheet: "letter-game", words, tag: "" });
  const page = plan.pages[0];
  const shapes = cardsInk(plan, page, { licensed: true }).filter((s) => !(s.kind === "line" && s.dash) && s.kind !== "text");
  const out = new Map();
  for (const card of page.cards) {
    const inside = (x, y) => x >= card.x && x < card.x + card.w && y >= card.y && y < card.y + card.h;
    const X = (x) => (x - card.x).toFixed(1), Y = (y) => (card.y + card.h - y).toFixed(1);
    let d = "", end = null, width = 1, color = [0, 0, 0];
    const dots = [];
    for (const s of shapes) {
      if (s.kind === "line" && inside(s.x1, s.y1)) {
        if (!end || end[0] !== s.x1 || end[1] !== s.y1) d += `M${X(s.x1)} ${Y(s.y1)}`;
        d += `L${X(s.x2)} ${Y(s.y2)}`;
        end = [s.x2, s.y2]; width = s.width; color = s.color;
      } else if (s.kind === "dot" && inside(s.x, s.y)) dots.push(s);
    }
    const marks = dots.filter((s) => s.r > width / 2 + 0.01).map((s) => `<circle cx="${X(s.x)}" cy="${Y(s.y)}" r="${(s.r * BOLD).toFixed(1)}" fill="${css(s.color)}"/>`).join("");
    // A screen is read from further off than a card on the table: a bolder line.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${CROP} ${CROP} ${card.w - 2 * CROP} ${card.h - 2 * CROP}"><path d="${d}" fill="none" stroke="${css(color)}" stroke-width="${width * BOLD}" stroke-linecap="round" stroke-linejoin="round"/>${marks}</svg>`;
    out.set(card.word, `data:image/svg+xml,${encodeURIComponent(svg)}`);
  }
  return out;
}

// The browser's own voice, if it has one. A voice on the device is picked
// over one the browser fetches, when both are offered.
const voiceOk = "speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function";
let voice = null;
function pickVoice() {
  const en = speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
  voice = en.find((v) => v.localService && /^en[-_]US/i.test(v.lang)) ?? en.find((v) => v.localService) ?? en[0] ?? null;
}
if (voiceOk) { pickVoice(); speechSynthesis.addEventListener?.("voiceschanged", pickVoice); } else el.speakRow.hidden = true;
function say(word) {
  if (!voiceOk || !el.speak.checked) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? "en-US";
    u.rate = 0.85;
    speechSynthesis.speak(u);
  } catch {}
}

// Word and picture: each pair is the word on one card and its picture on the
// other, so a child reads the word to find it. Short vowel words with a clear
// outline picture (pdf/pictures.js); the picture is drawn in the word's ink.
// Thanksgiving and Christmas are the same game on the 20 words of each holiday
// tracing page, kept all year like the worksheets (the $3.50 packs end on
// the day, through config.js).
const PIC_SETS = {
  pictures: { label: "Word and picture", words: PICTURE_SET.words, back: PICTURE_SET.back, px: "gamepics" },
  thanksgiving: { label: "Thanksgiving", words: "mug cake bowl home bread wheat maple glass apple acorn carrot cherry candle teapot pepper cookie feather pumpkin seedling mushroom".split(" "), back: [0.8, 0.4, 0.1], px: "gameholiday" },
  christmas: { label: "Christmas", words: "mug ball star gift bell sock home book candy train robot cookie candle sleigh snowman reindeer ornament lollipop snowflake gingerbread".split(" "), back: [0.75, 0.12, 0.12], px: "gameholiday" },
};
// A holiday game's printed copy is that holiday's $3.50 pack, offered only
// while the Worker's config.js names the pack's link.
const PACK_LINES = { thanksgiving: "orange", christmas: "red" };
const PACK_URLS = window.TRACE_PRESS_PACKS || {};
const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
for (const [k, p] of Object.entries(PIC_SETS)) if (p.until && today > p.until) delete PIC_SETS[k];
const isPics = (s) => s in PIC_SETS;
const picImage = (word) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-5 -5 34 34" fill="none" stroke="#222" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${pictureFor(word).map((d) => `<path d="${d}"/>`).join("")}</svg>`)}`;

const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// "Your words": a teacher's own list, up to the biggest game, played free on
// screen (printing them is the licence). The words ride in the address, so
// the game can be sent home or to the class as a link.
const OWN = "own", OWN_MAX = 8;
let set = "short-a", pairs = 6, ownWords = [];
let deck = [], pic = [], up = [], found = 0, turns = 0, busy = false, nodes = [], inPlay = 6;

function layout() {
  const n = inPlay * 2;
  const narrow = innerWidth < 560;
  const cols = n <= 4 ? 2 : n === 6 || (n === 12 && narrow) ? 3 : 4;
  el.board.style.setProperty("--cols", cols);
  el.board.style.setProperty("--rows", Math.ceil(n / cols));
}

function score() {
  el.score.textContent = `Pairs found: ${found} of ${inPlay} · Turns: ${turns}`;
}

function readOwn() {
  const seen = new Set();
  ownWords = cleanWords(el.own.value).filter((w) => !seen.has(w.toLowerCase()) && seen.add(w.toLowerCase())).slice(0, OWN_MAX);
}

// The address says what's on the board, so a copied link opens the same game.
function remember() {
  const q = new URLSearchParams();
  if (set !== OWN) q.set("set", set);
  q.set("pairs", pairs);
  // Commas left bare: a shorter address makes a smaller code on the note home.
  const words = set === OWN && ownWords.length ? `words=${ownWords.map(encodeURIComponent).join(",")}&` : "";
  history.replaceState(null, "", `${location.pathname}?${words}${q}`);
}

function deal() {
  const own = set === OWN;
  el.ownRow.hidden = !own;
  remember();
  // The card maker has no holiday lists; a holiday game's printed copy is its pack.
  const holiday = Object.hasOwn(PACK_LINES, set);
  el.print.parentElement.hidden = holiday;
  const packline = $("packline");
  packline.hidden = !(holiday && PACK_URLS[set]);
  if (!packline.hidden) {
    const name = PIC_SETS[set].label;
    packline.innerHTML = `To play on the table instead, the <a href="/${set}-tracing-worksheets#pack">${name} pack</a> has these 20 words as four printed matching games with ${PACK_LINES[set]} backs, plus flash cards and tracing worksheets: one PDF, $3.50.`;
  }
  el.print.href = own ? `/sight-word-flash-cards?list=own&sheet=letter-game&pairs=1&backs=1${ownWords.length ? `&words=${encodeURIComponent(ownWords.join(","))}` : ""}` : `/sight-word-flash-cards?list=${set}&sheet=letter-game&pairs=1&backs=1`;
  for (const b of el.sets.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.set === set));
  if (own && ownWords.length < 2) {
    el.ownNote.textContent = "Type at least two words to make a game.";
    el.board.replaceChildren(); el.won.hidden = true; el.score.textContent = "";
    deck = []; nodes = [];
    return;
  }
  inPlay = Math.min(pairs, own ? ownWords.length : pairs);
  if (own) el.ownNote.textContent = `${ownWords.length > inPlay ? `Your ${ownWords.length} words: ${ownWords.join(", ")}. Each game picks ${inPlay} of them.` : `${inPlay} pairs: ${ownWords.join(", ")}.`} Playing them here is free; printing your own words as cards comes with the ${PRICE_LABEL} Trace Press licence.`;
  const words = shuffle([...(own ? ownWords : isPics(set) ? PIC_SETS[set].words : LISTS[set].words)]).slice(0, inPlay);
  const img = wordImages(words);
  const cards = shuffle(words.flatMap((w) => [[w, false], [w, isPics(set)]]));
  deck = cards.map((c) => c[0]);
  pic = cards.map((c) => c[1]);
  up = []; found = 0; turns = 0; busy = false;
  el.won.hidden = true;
  el.board.style.setProperty("--back", css(own ? OWN_BACK : isPics(set) ? PIC_SETS[set].back : LISTS[set].back));
  nodes = deck.map((word, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "card";
    b.setAttribute("aria-label", `Card ${i + 1}, face down`);
    b.innerHTML = `<span class="inner"><span class="back"></span><span class="face"><img alt="" draggable="false"></span></span>`;
    b.querySelector("img").src = pic[i] ? picImage(word) : img.get(word);
    b.addEventListener("click", (e) => turn(i, e));
    return b;
  });
  el.board.replaceChildren(...nodes);
  layout();
  score();
}

function show(i, on) {
  nodes[i].classList.toggle("up", on);
  nodes[i].setAttribute("aria-label", on ? `Card ${i + 1}: ${pic[i] ? `picture of ${/^[aeiou]/i.test(deck[i]) ? "an" : "a"} ${deck[i]}` : deck[i]}` : `Card ${i + 1}, face down`);
}

function turn(i, e) {
  const b = nodes[i];
  if (busy || b.classList.contains("up")) return;
  if (e.isTrusted) px("gameflip");
  // The board is sized to fit the screen; bring all of it into view on the first turn.
  if (!turns && !up.length && el.board.getBoundingClientRect().bottom > innerHeight) el.board.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "end" });
  show(i, true);
  say(deck[i]);
  up.push(i);
  if (up.length < 2) return;
  turns++;
  const [a, c] = up;
  up = [];
  if (deck[a] === deck[c]) {
    found++;
    for (const k of [a, c]) { nodes[k].classList.add("got"); nodes[k].disabled = true; }
    score();
    if (found === inPlay) setTimeout(win, reduced ? 0 : 700);
    return;
  }
  score();
  busy = true;
  setTimeout(() => { show(a, false); show(c, false); busy = false; }, 1300);
}

function win() {
  px("gamewon");
  el.wonText.textContent = `You found all ${inPlay} pairs in ${turns} turns!`;
  el.won.hidden = false;
  say(`Well done! ${inPlay} pairs.`);
  el.won.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
  el.again.focus({ preventScroll: true });
}

for (const [key, l] of Object.entries(LISTS)) {
  const b = document.createElement("button");
  b.type = "button";
  b.dataset.set = key;
  b.textContent = l.label;
  b.style.setProperty("--chip", css(l.back));
  b.addEventListener("click", () => { set = key; deal(); });
  el.sets.append(b);
}
for (const [key, p] of Object.entries(PIC_SETS)) {
  const b = document.createElement("button");
  b.type = "button";
  b.dataset.set = key;
  b.textContent = p.label;
  b.style.setProperty("--chip", css(p.back));
  b.addEventListener("click", (e) => { if (e.isTrusted) px(p.px); set = key; deal(); });
  el.sets.append(b);
}
{
  const b = document.createElement("button");
  b.type = "button";
  b.dataset.set = OWN;
  b.textContent = "Your words";
  b.style.setProperty("--chip", css(OWN_BACK));
  b.addEventListener("click", () => { set = OWN; deal(); if (!ownWords.length) el.own.focus(); });
  el.sets.append(b);
}
// A new game on each finished word, not on each letter.
el.own.addEventListener("change", (e) => {
  readOwn();
  if (e.isTrusted && ownWords.length >= 2) px("gameown");
  deal();
});
// A note to send home: the words, and a code a phone camera opens this game
// from. Four to a sheet, cut in quarters; the screen never shows them.
el.home.addEventListener("click", (e) => {
  if (ownWords.length < 2) return void el.own.focus();
  if (e.isTrusted) px("gamenote");
  const qr = qrcode(0, "M");
  qr.addData(location.href);
  qr.make();
  const svg = qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
  const esc = (s) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  const note = `<div class="homenote"><h2>This week's words</h2><div class="w">${ownWords.map(esc).join(" &middot; ")}</div>${svg}<p>Point a phone camera at the square to play a matching game with these words. Free, no sign-up.</p><p class="u">${esc(location.href)}</p></div>`;
  el.notes.innerHTML = note.repeat(4);
  document.body.classList.add("printing");
  addEventListener("afterprint", () => document.body.classList.remove("printing"), { once: true });
  print();
});
el.copy.addEventListener("click", async (e) => {
  if (e.isTrusted) px("gamelink");
  try { await navigator.clipboard.writeText(location.href); el.copy.textContent = "Link copied"; }
  catch { prompt("Copy this link:", location.href); }
  setTimeout(() => { el.copy.textContent = "Copy link"; }, 2500);
});
el.size.addEventListener("change", () => { pairs = Number(el.size.value); deal(); });
el.again.addEventListener("click", deal);
addEventListener("resize", layout);

// Full screen, for the board at the front of the room. Phones that can't put
// a part of the page full screen (iPhone Safari) don't get the button.
if (document.fullscreenEnabled && el.game.requestFullscreen) {
  el.full.hidden = false;
  el.full.addEventListener("click", (e) => {
    if (document.fullscreenElement) return void document.exitFullscreen();
    if (e.isTrusted) px("gamefull");
    el.game.requestFullscreen().catch(() => {});
  });
  document.addEventListener("fullscreenchange", () => {
    el.full.textContent = document.fullscreenElement ? "Exit full screen" : "Full screen";
  });
}

px("game");
const q = new URLSearchParams(location.search);
if (q.get("set") in LISTS || isPics(q.get("set"))) set = q.get("set");
if (q.get("words")) {
  el.own.value = q.get("words").split(",").join(", ");
  readOwn();
  if (ownWords.length) { set = OWN; px("gameshared"); }
}
if (["4", "6", "8"].includes(q.get("pairs"))) { pairs = Number(q.get("pairs")); el.size.value = q.get("pairs"); }
deal();

// Raw portrait footage for the house channel: the matching game's Christmas
// set (20 holiday words), where each pair is a word card and its picture card. It opens
// on a finished board (the docent's retention lead), then Play again deals a
// new game, played through with one miss. Cards are turned by the page's own
// click handler, so no tap ring is drawn in the product frame.
//
//   cd app && FFMPEG=/path/to/ffmpeg node ../tracepress/scripts/footage-game-christmas.mjs
//     → tracepress/public/media/sight-word-matching-game-christmas.mp4 (the .json beside it is hand-written)
import { shoot } from "../../app/scripts/footage-lib.mjs";

const SITE = "https://tracepress.bananafest-destiny.com";
const outDir = new URL("../public/media/", import.meta.url).pathname;

const card = (page, i) => page.locator("#board .card").nth(i);
// The word on a face-up card, from its label: "Card 3: fish" or
// "Card 3: picture of a fish".
const wordOn = async (page, i) => (await card(page, i).getAttribute("aria-label")).replace(/^Card \d+: (picture of an? )?/, "");
const turn = (page, i) => page.evaluate((k) => document.querySelectorAll("#board .card")[k].click(), i);

// Play the way a child with a good memory would: turn a card you haven't
// seen; if you've seen its match, turn that; if not, turn another new one.
// Misses turn back, and every card seen is remembered.
async function play(page, wait, { flip = 900, miss = 1700, hit = 1100 } = {}) {
  const n = await page.locator("#board .card").count();
  const seen = new Map(); // word → index of a card seen and not yet matched
  const fresh = [...Array(n).keys()];
  const done = new Set();
  const pairUp = async (a, b) => { await turn(page, a); await wait(flip); await turn(page, b); await wait(hit); done.add(a); done.add(b); };
  while (done.size < n) {
    const a = fresh.shift();
    if (a === undefined) break;
    if (done.has(a)) continue;
    await turn(page, a); await wait(flip);
    const wa = await wordOn(page, a);
    if (seen.has(wa)) { const j = seen.get(wa); seen.delete(wa); await turn(page, j); await wait(hit); done.add(a); done.add(j); continue; }
    const b = fresh.shift();
    await turn(page, b); await wait(flip);
    const wb = await wordOn(page, b);
    if (wa === wb) { await wait(hit - flip > 0 ? hit - flip : 0); done.add(a); done.add(b); continue; }
    seen.set(wa, a);
    await wait(miss);
    if (seen.has(wb)) { const j = seen.get(wb); seen.delete(wb); await pairUp(b, j); }
    else seen.set(wb, b);
  }
}

await shoot("sight-word-matching-game-christmas", async ({ page, wait, start }) => {
  await page.goto(`${SITE}/sight-word-matching-game?set=christmas&pairs=6`, { waitUntil: "networkidle" });
  await page.evaluate(() => { const s = document.getElementById("speak"); if (s) s.checked = false; });
  // The $3.50 pack line under the board is hidden for the shot: the channel
  // shows the free game, not a price. Disclosed in the .json notes.
  await page.addStyleTag({ content: "#packline { display: none !important; }" });
  await play(page, async (ms) => page.waitForTimeout(ms), { flip: 60, miss: 1450, hit: 60 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.getElementById("board").scrollIntoView({ block: "start" }));
  await wait(500);
  await start();
  await wait(3800);

  // A new deal, played through.
  await page.evaluate(() => document.getElementById("again").click());
  await wait(1200);
  await page.evaluate(() => document.getElementById("board").scrollIntoView({ block: "start" }));
  await wait(1000);
  await play(page, wait);
  await wait(1500);
  await page.evaluate(() => document.getElementById("board").scrollIntoView({ block: "start" }));
  await wait(800);
}, { outDir });

// The 1200 × 630 share image (og:image). Takes a real page out of the site's
// own preview, which is drawn from the same shapes as the PDF, and sets it
// beside the headline. So the card shows what the book prints.
//
// Each free worksheet page gets its own card too (public/img/card-*.png), with
// its headline beside the page it gives away, from public/img/ (previews.mjs).
// Shared on Facebook or Pinterest, the link then shows the worksheet itself.
//
// Run: node scripts/social-card.mjs [baseUrl]  (writes public/social-card.png
// and public/img/card-*.png)
// ONLY=slug,slug redraws just those page cards (no home card, no game board),
// so a wording fix on one card does not rewrite every PNG.

import { readFileSync } from "node:fs";
import * as playwright from "playwright";
const base = process.argv[2] || "https://tracepress.bananafest-destiny.com";
const only = process.env.ONLY ? new Set(process.env.ONLY.split(",")) : null;
const browser = await playwright.chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, userAgent: "trace-press-test/card" });
  if (!only) {
  await page.goto(`${base}/`);
  await page.waitForSelector("#preview svg");
  const svg = await page.$eval("#preview svg", (s) => s.outerHTML);
  await page.setContent(`<!doctype html><html><head><style>
    html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #234e3a; font-family: "Liberation Sans", Arial, sans-serif; }
    .text { position: absolute; left: 64px; top: 70px; width: 600px; color: #fff; }
    .brand { font-size: 30px; font-weight: 700; opacity: 0.85; }
    h1 { font-size: 60px; line-height: 1.08; margin: 26px 0 26px; }
    p { font-size: 27px; line-height: 1.35; margin: 0; opacity: 0.92; }
    .page { position: absolute; right: 70px; top: 40px; width: 420px; transform: rotate(2deg); box-shadow: 0 12px 40px rgba(0,0,0,0.35); }
    .page svg { display: block; width: 100%; height: auto; }
  </style></head><body>
    <div class="text"><div class="brand">Trace Press</div>
      <h1>A–Z letter tracing workbooks for Amazon KDP</h1>
      <p>Stroke-order arrows, numbered start dots, KDP margins. Made in your browser.</p></div>
    <div class="page">${svg}</div>
  </body></html>`);
  await page.screenshot({ path: new URL("../public/social-card.png", import.meta.url).pathname });
  console.log("wrote public/social-card.png");

  // The on-screen game has no printed page to show: a finished board from the
  // live page stands in, played by its own click handler (untrusted clicks,
  // so no gameflip; the load beacon is answered here and never reaches the log).
  const game = await browser.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2, userAgent: "trace-press-test/card" });
  await game.route("**/px/**", (r) => r.fulfill({ status: 204, body: "" }));
  await game.route("https://static.cloudflareinsights.com/**", (r) => r.abort());
  await game.goto(`${base}/sight-word-matching-game?set=short-a&pairs=6`, { waitUntil: "networkidle" });
  await game.evaluate(() => {
    const cards = [...document.querySelectorAll("#board .card")];
    const by = new Map();
    cards.forEach((b) => { const k = b.querySelector("img").src; by.set(k, [...(by.get(k) ?? []), b]); });
    for (const [a, b] of by.values()) { a.click(); b.click(); }
  });
  await game.waitForTimeout(1200);
  await game.locator("#board").screenshot({ path: new URL("../public/img/sight-word-matching-game-board.png", import.meta.url).pathname });
  await game.close();
  }

  const CARDS = [
    ["letter-tracing", "letter-tracing-worksheet-a", "Free letter tracing worksheets, A to Z", "26 pages, capital and lowercase, with start dots and stroke arrows."],
    ["number-tracing", "number-tracing-worksheet-3", "Free number tracing worksheets, 0 to 9", "A page per digit, with start dots and stroke arrows."],
    ["tracing-lines", "tracing-lines-worksheet-zigzag-wave", "Free tracing lines worksheets", "Lines, slants, zigzags, waves, circles and crosses, before A."],
    ["shape-tracing-worksheets", "shape-tracing-worksheet-star", "Free shape tracing worksheets", "Square, triangle, rectangle, diamond, star and heart, one a page."],
    ["cursive-letter-tracing", "cursive-letter-tracing-worksheet-b", "Free cursive letter tracing worksheets", "26 pages, A to Z, capital and lowercase cursive to trace."],
    ["alphabet-tracing-worksheets-with-pictures", "alphabet-tracing-worksheet-apple", "Free alphabet tracing worksheets with pictures", "26 pages, A is for apple to Z is for zeppelin, each with a picture to colour."],
    ["number-tracing-worksheets-with-pictures", "number-tracing-worksheet-5-stars", "Free number tracing worksheets with pictures", "0 to 9: trace each number, count its stars and colour them in."],
    ["uppercase-letter-tracing", "uppercase-letter-tracing-worksheet-a", "Free uppercase letter tracing worksheets", "26 pages, A to Z, one capital a page, with start dots and stroke arrows."],
    ["lowercase-letter-tracing", "lowercase-letter-tracing-worksheet-a", "Free lowercase letter tracing worksheets", "26 pages, a to z, one letter a page, with start dots and stroke arrows."],
    ["cursive-name-tracing", "cursive-name-tracing-worksheet-maya", "Free cursive name tracing worksheet", "Type a name, print it in joined cursive to trace."],
    ["name-tracing", "name-tracing-worksheet-maya", "Free name tracing worksheet generator", "Type a name, print a page: start dots, stroke arrows, rows to trace."],
    ["tracing-worksheet-generator", "tracing-worksheet-cat-sun-dog", "Free tracing worksheet generator", "Type words, print a page on handwriting lines, with start dots and arrows."],
    ["this-book-belongs-to-page", "this-book-belongs-to-page", "Free “This book belongs to” page", "A name page for the front of a children’s book, in six KDP trim sizes."],
    ["preschool-tracing-worksheets", "preschool-tracing-worksheet-a", "Free preschool tracing worksheets", "Lines, shapes, capital letters A to Z and numbers 0 to 9, on big lines."],
    ["tracing-book-cover-size", "tracing-book-cover-sample", "Tracing book cover size for KDP", "Cover width, height and spine for 26 to 78 pages, six trims.", "Checked against KDP’s calculator"],
    ["tracing-font-for-kdp", "letter-tracing-worksheet-a", "Tracing fonts and KDP", "Print letters drawn as pencil strokes: no dotted font to license.", "For KDP sellers"],
    ["christmas-tracing-worksheets", "christmas-tracing-worksheet-snowman", "Free Christmas tracing worksheets", "Twenty Christmas words to trace, each with a picture to colour."],
    ["halloween-tracing-worksheets", "halloween-tracing-worksheet-bat", "Free Halloween tracing worksheets", "Twenty Halloween words to trace, each with a picture to colour."],
    ["thanksgiving-tracing-worksheets", "thanksgiving-tracing-worksheet-pumpkin", "Free Thanksgiving tracing worksheets", "Twenty Thanksgiving words to trace, each with a picture to colour."],
    ["picture-word-tracing-worksheets", "picture-word-tracing-worksheet-fish", "Word tracing worksheets with pictures", "Twenty first words to trace, each with a picture to colour."],
    ["transportation-tracing-worksheets", "transportation-tracing-worksheet-tractor", "Transportation tracing worksheets", "Twenty vehicle words to trace, car to helicopter, each with a picture to colour."],
    ["sight-word-matching-game", "sight-word-matching-game-board", "Free sight word matching game", "Children tap two cards to find a pair: short vowel and Dolch sight words.", "Plays on screen · no sign-up"],
    ["animal-tracing-worksheets", "animal-tracing-worksheet-rabbit", "Animal tracing worksheets", "Twenty animal words to trace, cat to butterfly, each with a picture to colour."],
    ["food-tracing-worksheets", "food-tracing-worksheet-banana", "Food tracing worksheets", "Twenty food words to trace, egg to broccoli, each with a picture to colour."],
    ["days-of-the-week-tracing-worksheets", "days-of-the-week-tracing-worksheet-wednesday", "Days of the week and months tracing worksheets", "Sunday to Saturday and January to December, a page each, to trace."],
    ["color-words-tracing-worksheets", "color-words-tracing-worksheet-yellow", "Color words tracing worksheets", "Red to gray, eleven color words, a page each, to trace."],
    ["number-words-tracing-worksheets", "number-words-tracing-worksheet-thirteen", "Number words tracing worksheets", "One to twenty, spelled out, a page each, to trace."],
    ["handwriting-practice-sheets-for-adults", "handwriting-practice-sheet-for-adults-g", "Free handwriting practice sheets for adults", "A to Z and 0 to 9 on smaller lines, to trace and copy."],
    ["cursive-practice-sheets-for-adults", "cursive-practice-sheet-for-adults-m", "Free cursive practice sheets for adults", "A to Z in cursive on smaller lines, solid then grey to trace."],
    ["cursive-alphabet-chart", "cursive-alphabet-chart", "Free cursive alphabet chart", "A to Z, capital and lowercase, and 0 to 9, on one printable page."],
    ["alphabet-chart", "alphabet-chart", "Free printable alphabet chart", "A to Z, capital and lowercase, and 0 to 9, in print on one page."],
    ["cursive-handwriting-workbook", "cursive-handwriting-workbook-word", "Cursive handwriting workbook for KDP", "A to Z, 0 to 9 and words in joined cursive, with its cover."],
    ["sight-word-tracing-workbook", "sight-word-tracing-worksheet", "Sight word tracing workbook for KDP", "The Dolch lists, a page per word, with start dots and arrows."],
    ["sight-word-flash-cards", "sight-word-flash-cards-3x5", "Free sight word flash cards", "Dolch pre-primer and primer words on 3 × 5 cards, four to a sheet with cut lines."],
    ["cvc-worksheets", "cvc-word-worksheet", "Free CVC word worksheets", "15 words with pictures: write each sound in a box, then trace the word."],
    ["count-and-trace-worksheets", "count-and-trace-worksheet", "Free count and trace worksheets, 1 to 10", "Count the dots in a ten frame, then trace the number."],
    ["kindergarten-worksheets", "count-and-trace-worksheet", "Free kindergarten worksheets", "Class name sheets, sight word cards, CVC words, count and trace."],
  ];
  for (const [slug, img, title, line, pill = "Printable PDF · no sign-up"] of CARDS) {
    if (only && !only.has(slug)) continue;
    const src = `data:image/png;base64,${readFileSync(new URL(`../public/img/${img}.png`, import.meta.url)).toString("base64")}`;
    await page.setContent(`<!doctype html><html><head><style>
      html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #234e3a; font-family: "Liberation Sans", Arial, sans-serif; }
      .text { position: absolute; left: 64px; top: 70px; width: 620px; color: #fff; }
      .brand { font-size: 30px; font-weight: 700; opacity: 0.85; }
      h1 { font-size: 58px; line-height: 1.08; margin: 26px 0 26px; }
      p { font-size: 27px; line-height: 1.35; margin: 0; opacity: 0.92; }
      .free { margin-top: 30px; display: inline-block; background: #fff; color: #234e3a; font-size: 26px; font-weight: 700; padding: 10px 18px; border-radius: 10px; }
      img { position: absolute; right: 70px; top: 36px; width: 420px; transform: rotate(2deg); box-shadow: 0 12px 40px rgba(0,0,0,0.35); background: #fff; }
    </style></head><body>
      <div class="text"><div class="brand">Trace Press</div><h1>${title}</h1><p>${line}</p><div class="free">${pill}</div></div>
      <img src="${src}">
    </body></html>`);
    await page.screenshot({ path: new URL(`../public/img/card-${slug}.png`, import.meta.url).pathname });
    console.log(`wrote public/img/card-${slug}.png`);
  }
} finally {
  await browser.close();
}

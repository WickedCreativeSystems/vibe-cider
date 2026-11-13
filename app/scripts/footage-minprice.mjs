// Raw portrait footage for the house channel: the lowest list price of a short
// colour picture book. On the live royalty calculator an 8.5×11 premium colour
// paperback of 24 pages prints for $4.20; at $6, $7 and $8 "You keep" is
// below zero, and at $8.40 it is $0.00. KDP's rule (read 2026-11-13): under
// $9.99 the royalty rate is 50%, and the minimum list price is the printing
// cost divided by that rate, so $4.20 / 0.5 = $8.40. KDP will not accept less.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-minprice.mjs
//     → public/media/kdp-lowest-list-price-picture-book.mp4 (the .json beside it is hand-written)
import { shoot } from "./footage-lib.mjs";

await shoot("kdp-lowest-list-price-picture-book", async ({ page, wait, typeInto, start }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/royalty-calculator", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "8.5x11");
  await page.selectOption("#ink", "premiumColor");
  await page.fill("#pages", "24");
  await page.dispatchEvent("#pages", "input");
  await page.fill("#list", "6.00");
  await page.dispatchEvent("#list", "input");
  // One fixed frame for the whole clip, set from its bottom edge: it ends just
  // above the "Make this book free" button, so no box is cut in half down
  // there (the docent's caption does not cover the bottom rows). Top to
  // bottom: the Ink menu, the list price, the printing cost, "You keep" and
  // the sum line. The docent's 78px bar (video pixels, 26 CSS px) covers the
  // Page count label at the very top. Every price here keeps nothing, so the
  // "if you sell a hundred" line never appears and the layout never moves.
  const frame = () => page.evaluate(() => scrollTo({ top: document.querySelector(".make-here").getBoundingClientRect().top + scrollY - 640 - 6, behavior: "instant" }));
  await page.evaluate(() => document.activeElement?.blur());
  await frame();
  await wait(500);
  await start();
  await wait(3400);

  for (const [price, hold] of [["7.00", 3000], ["8.00", 3000], ["8.40", 4600]]) {
    await typeInto("#list", price);
    await page.evaluate(() => document.activeElement?.blur());
    await frame();
    await wait(hold);
  }
});

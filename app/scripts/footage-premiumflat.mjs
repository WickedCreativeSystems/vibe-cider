// Raw portrait footage for the house channel: the flat printing price of a
// short colour book. On the live royalty calculator an 8.5×11 premium colour
// paperback costs $4.20 to print at 24, 32 and 40 pages, and $4.36 at 42.
// KDP's Amazon.com rates for large trim: 24-40 pages a flat $4.20, 42-828
// pages $1.00 + $0.08 a page (read 2026-11-12).
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-premiumflat.mjs
//     → public/media/kdp-picture-book-printing-cost-flat-to-40-pages.mp4 (the .json beside it is hand-written)
import { shoot } from "./footage-lib.mjs";

await shoot("kdp-picture-book-printing-cost-flat-to-40-pages", async ({ page, wait, typeInto, start }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/royalty-calculator", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "8.5x11");
  await page.selectOption("#ink", "premiumColor");
  await page.fill("#list", "12.99");
  await page.dispatchEvent("#list", "input");
  await page.fill("#pages", "24");
  await page.dispatchEvent("#pages", "input");
  // One fixed frame for the whole clip. The docent draws a 78px bar (video
  // pixels, so 26 CSS px) over the top: the Page count label sits 30 CSS px
  // down, 90px in the video. Under it the Ink menu, the list price, the
  // printing cost with its line ("Large trim · flat rate up to 40 pages")
  // and "You keep". The Trim menu (8.5 × 11) is just above the frame.
  const frame = () => page.evaluate(() => scrollTo({ top: document.querySelector('label[for="pages"]').getBoundingClientRect().top + scrollY - 30, behavior: "instant" }));
  await page.evaluate(() => document.activeElement?.blur());
  await frame();
  await wait(500);
  await start();
  await wait(3400);

  for (const [pages, hold] of [["32", 3000], ["40", 3400], ["42", 4400]]) {
    await typeInto("#pages", pages);
    await page.evaluate(() => document.activeElement?.blur());
    await frame();
    await wait(hold);
  }
});

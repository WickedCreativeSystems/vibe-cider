// Raw portrait footage for the house channel: standard colour against premium
// colour. On the live royalty calculator a 6×9, 100-page book at $12.99 costs
// $3.55 to print and keeps $4.24 a copy in standard colour; in premium colour
// it costs $7.50 and keeps $0.29. KDP's Amazon.com rates: $1.00 + $0.0255 a
// page for standard, $1.00 + $0.065 a page for premium (read 2026-11-12).
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-colourink.mjs
//     → public/media/kdp-standard-vs-premium-colour-cost.mp4 (the .json beside it is hand-written)
import { shoot } from "./footage-lib.mjs";

await shoot("kdp-standard-vs-premium-colour-cost", async ({ page, wait, tap, start }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/royalty-calculator", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "6x9");
  await page.fill("#pages", "100");
  await page.dispatchEvent("#pages", "input");
  await page.fill("#list", "12.99");
  await page.dispatchEvent("#list", "input");
  await page.selectOption("#ink", "standardColor");
  // One fixed frame for the whole clip. The docent draws a 78px bar (video
  // pixels, so 26 CSS px) over the top: the Page count label sits 30 CSS px
  // down, 90px in the video. Under it the Ink menu, the list price, the
  // printing cost with its sum (1.00 + 100 × rate) and "You keep".
  const frame = () => page.evaluate(() => scrollTo({ top: document.querySelector('label[for="pages"]').getBoundingClientRect().top + scrollY - 30, behavior: "instant" }));
  await page.evaluate(() => document.activeElement?.blur());
  await frame();
  await wait(500);
  await start();
  await wait(3400);

  for (const [ink, hold] of [["premiumColor", 3800], ["standardColor", 3200]]) {
    await tap("#ink");
    await page.selectOption("#ink", ink);
    await frame();
    await wait(hold);
  }
});

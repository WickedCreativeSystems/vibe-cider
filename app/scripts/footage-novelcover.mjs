// Raw portrait footage for the house channel: the cover file for a novel. On
// the live spine calculator a 300-page paperback on cream paper has a 0.750"
// spine at either trim; the full cover is 12.000" × 8.750" at 5.5 × 8.5 and
// 11.000" × 8.250" at 5 × 8. KDP's own cover calculator gives the same
// figures (asked 2026-11-12).
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-novelcover.mjs
//     → public/media/kdp-novel-cover-size-300-pages-cream.mp4 (the .json beside it is hand-written)
import { shoot } from "./footage-lib.mjs";

await shoot("kdp-novel-cover-size-300-pages-cream", async ({ page, wait, tap, start }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/spine-calculator", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "5.5x8.5");
  await page.selectOption("#paper", "cream");
  await page.fill("#pages", "300");
  await page.dispatchEvent("#pages", "input");
  // One fixed frame for the whole clip. The docent draws a 78px bar (video
  // pixels, so 26 CSS px) over the top: the Trim size label sits 30 CSS px
  // down, 90px in the video. Under it the page count, the paper, the spine
  // width and the full cover size.
  const frame = () => page.evaluate(() => scrollTo({ top: document.querySelector('label[for="trim"]').getBoundingClientRect().top + scrollY - 30, behavior: "instant" }));
  await page.evaluate(() => document.activeElement?.blur());
  await frame();
  await wait(500);
  await start();
  await wait(3600);

  for (const [trim, hold] of [["5x8", 4000], ["5.5x8.5", 4200]]) {
    await tap("#trim");
    await page.selectOption("#trim", trim);
    await page.evaluate(() => document.activeElement?.blur());
    await frame();
    await wait(hold);
  }
});

// Raw portrait footage for the house channel: the cover file is only right
// for one page count. On the live spine calculator a 6 × 9 paperback on white
// paper has a 0.270" spine and a 12.520" × 9.250" full cover at 120 pages,
// 0.338" and 12.588" at 150, and 0.450" and 12.700" at 200. KDP's own cover
// calculator gives the same three covers (asked 2026-11-14).
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-coverpages.mjs
//     → public/media/kdp-cover-size-changes-with-page-count.mp4 (the .json beside it is hand-written)
import { shoot } from "./footage-lib.mjs";

await shoot("kdp-cover-size-changes-with-page-count", async ({ page, wait, typeInto, start }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/spine-calculator", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "6x9");
  await page.selectOption("#paper", "white");
  await page.fill("#pages", "120");
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

  for (const [pages, hold] of [["150", 3800], ["200", 4400]]) {
    await typeInto("#pages", pages);
    await page.evaluate(() => document.activeElement?.blur());
    await frame();
    await wait(hold);
  }
});

// Raw portrait footage for the house channel: the cover file for a colour
// picture book. On the live spine calculator an 8.5 × 8.5 paperback in premium
// colour has a 0.056" spine and a 17.306" × 8.750" full cover at 24 pages, and
// a 0.075" spine and a 17.325" × 8.750" cover at 32. KDP's own cover
// calculator gives the same four figures (asked 2026-11-12).
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-picturebook.mjs
//     → public/media/kdp-picture-book-cover-size-8-5-square.mp4 (the .json beside it is hand-written)
import { shoot } from "./footage-lib.mjs";

await shoot("kdp-picture-book-cover-size-8-5-square", async ({ page, wait, typeInto, start }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/spine-calculator", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "custom");
  for (const id of ["#customW", "#customH"]) { await page.fill(id, "8.5"); await page.dispatchEvent(id, "input"); }
  await page.selectOption("#paper", "premiumColor");
  await page.fill("#pages", "24");
  await page.dispatchEvent("#pages", "input");
  // One fixed frame for the whole clip. The docent draws a 78px bar (video
  // pixels, so 26 CSS px) over the top: the Trim size label sits 30 CSS px
  // down, 90px in the video. Under it the custom size, the page count, the
  // paper, the spine width and the full cover size (ends near 625 of 640).
  const frame = () => page.evaluate(() => scrollTo({ top: document.querySelector('label[for="trim"]').getBoundingClientRect().top + scrollY - 30, behavior: "instant" }));
  await page.evaluate(() => document.activeElement?.blur());
  await frame();
  await wait(500);
  await start();
  await wait(3400);

  for (const [pages, hold] of [["32", 3800], ["24", 3200]]) {
    await typeInto("#pages", pages);
    await frame();
    await wait(hold);
  }
});

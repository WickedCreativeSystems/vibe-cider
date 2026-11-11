// Raw portrait footage for the house channel: the live margin calculator on a
// phone-sized screen showing the interior PDF page size KDP wants once bleed
// is on. 6×9 becomes 6.125 × 9.25, 8.5×11 becomes 8.625 × 11.25, and a custom
// 8.25 × 8.25 becomes 8.375 × 8.5: an eighth wider, a quarter taller, every time.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-bleed.mjs
//     → public/media/kdp-interior-page-size-with-bleed.mp4 (the .json beside it is hand-written)
import { shoot } from "./footage-lib.mjs";

await shoot("kdp-interior-page-size-with-bleed", async ({ page, wait, tap, typeInto, start }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/margin-calculator", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "6x9");
  await page.fill("#pages", "120");
  await page.dispatchEvent("#pages", "input");
  // Trim, page count, the bleed box and the PDF page size card in one screen.
  await page.evaluate(() => { const a = document.querySelector("#trim").getBoundingClientRect(); scrollTo(0, scrollY + a.top - 40); });
  await start();
  await wait(2200);

  await tap("#bleed");
  await wait(3000);

  await tap("#trim");
  await page.selectOption("#trim", "8.5x11");
  await wait(2800);

  await tap("#trim");
  await page.selectOption("#trim", "custom");
  await wait(600);
  await typeInto("#customW", "8.25");
  await page.dispatchEvent("#customW", "input");
  await typeInto("#customH", "8.25");
  await page.dispatchEvent("#customH", "input");
  await wait(2600);
});

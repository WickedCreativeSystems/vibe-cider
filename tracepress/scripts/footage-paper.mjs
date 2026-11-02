// Raw portrait footage for the house channel: the live free handwriting paper
// page on a phone-sized screen. An 8.5" x 11" page with the line size stepped
// down from 1" to 0.45": 5, 7, 9, then 12 writing lines a page. Then the PDF.
// Capture is shared with Puzzle Press (app/scripts/footage-lib.mjs).
//
//   cd app && FFMPEG=/path/to/ffmpeg node ../tracepress/scripts/footage-paper.mjs
//     → tracepress/public/media/handwriting-paper-line-sizes.mp4 (the .json beside it is hand-written)
import { shoot } from "../../app/scripts/footage-lib.mjs";

const outDir = new URL("../public/media/", import.meta.url).pathname;
await shoot("handwriting-paper-line-sizes", async ({ page, wait, scrollTo, download, start, png, show }) => {
  await page.goto("https://tracepress.bananafest-destiny.com/handwriting-paper", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "8.5x11");
  await page.selectOption("#age", "1");
  await page.dispatchEvent("#age", "change");
  await page.waitForSelector("#preview *");
  await scrollTo("#age", "start");
  await start();
  await wait(2000);
  for (const inches of ["1", "0.75", "0.6", "0.45"]) {
    await scrollTo("#age", "start");
    await page.selectOption("#age", inches);
    await page.dispatchEvent("#age", "change");
    await wait(900);
    await scrollTo("#preview", "center");
    await wait(3600);
  }
  await scrollTo("#download", "center");
  const pdf = await download("#download", "paper.pdf");
  await wait(1200);
  await show(png(pdf, 1, 150), 3600);
}, { outDir });

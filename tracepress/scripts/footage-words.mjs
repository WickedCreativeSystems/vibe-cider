// Raw portrait footage for the house channel: the live free tracing
// worksheet generator on a phone-sized screen, the sheet preview and the
// "Words to trace" box in one frame. The box starts with three words; type
// one word the page has a picture for (rabbit) and the sheet redraws with the
// word large, start dots and arrows, dotted rows, and an outline of a rabbit
// to colour. Then download the PDF and show the page it
// made, rendered from the file itself. Print letters only: the name tracing
// clip of 17 October already shows the cursive switch.
//
//   cd app && FFMPEG=/path/to/ffmpeg node ../tracepress/scripts/footage-words.mjs
//     → tracepress/public/media/tracing-worksheet-any-word.mp4 (the .json beside it is hand-written)
import { shoot } from "../../app/scripts/footage-lib.mjs";

const outDir = new URL("../public/media/", import.meta.url).pathname;
await shoot("tracing-worksheet-any-word", async ({ page, wait, tap, typeInto, scrollTo, download, start, png, show }) => {
  await page.goto("https://tracepress.bananafest-destiny.com/tracing-worksheet-generator", { waitUntil: "networkidle" });
  await page.waitForSelector("#preview *");
  // On a phone the sheet preview sits above the "Words to trace" box. One
  // frame holds both: the preview's top edge 46 CSS px down (the docent's top
  // bar covers the first 78 video px = 26 CSS px) and the box under it, so
  // the sheet is seen redrawing as the word is typed. At 46 the bottom edge
  // falls just under the Line size menu, not through its help text.
  await page.evaluate(() => {
    const p = document.querySelector("#preview");
    window.scrollTo({ top: p.getBoundingClientRect().top + scrollY - 46, behavior: "instant" });
  });
  await wait(600);
  await start();
  await wait(2200);

  await typeInto("#name", "rabbit");
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await wait(4200);
  // The button 555 CSS px down: the "Downloaded" line and the end of the card
  // are in shot, and the page's own "cat sun dog" example under it is not.
  await page.evaluate(() => {
    const b = document.querySelector("#download");
    window.scrollTo({ top: b.getBoundingClientRect().bottom + scrollY - 555, behavior: "smooth" });
  });
  await wait(1000);
  const pdf = await download("#download", "words.pdf");
  await wait(1200);
  await show(png(pdf, 1, 150), 4200, 94);
}, { outDir });

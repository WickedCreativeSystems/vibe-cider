// Raw portrait footage for the house channel: how big the spine text on a KDP
// paperback can be. KDP allows spine text from 80 pages, but on a 6x9 cream
// book the spine safe area at 80 pages holds type of about 4.5pt at most; 100
// pages holds about 8pt and 150 about 16pt. Each beat types the page count on
// the live spine calculator, then scrolls down to its spine-text answer.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-spinetype.mjs
//     → public/media/kdp-spine-text-size-by-pages.mp4 (the .json beside it is hand-written)
import { shoot } from "./footage-lib.mjs";

await shoot("kdp-spine-text-size-by-pages", async ({ page, wait, typeInto, scrollTo, start }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/spine-calculator", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "6x9");
  await page.selectOption("#paper", "cream");
  await page.fill("#pages", "60");
  await page.dispatchEvent("#pages", "input");
  await page.evaluate(() => { const a = document.querySelector("#pages").getBoundingClientRect(); scrollTo(0, scrollY + a.top - 200); });
  await start();
  await wait(700);
  for (const n of ["80", "100", "150"]) {
    await scrollTo("#pages", "center");
    await typeInto("#pages", n);
    await scrollTo("#spineText", "center");
    await wait(1900);
  }
});

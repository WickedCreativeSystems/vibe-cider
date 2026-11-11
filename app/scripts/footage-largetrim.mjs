// Raw portrait footage for the house channel: on the live royalty calculator,
// a 200-page black-ink book at $9.99 keeps $2.59 a copy at 6×9 and $1.59 at
// 7×10 or 8.5×11, because KDP prints "large trim" (wider than 6.12" or taller
// than 9") at $0.017 a page instead of $0.012 on Amazon.com.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-largetrim.mjs
//     → public/media/kdp-large-trim-costs-a-dollar.mp4 (the .json beside it is hand-written)
import { shoot } from "./footage-lib.mjs";

await shoot("kdp-large-trim-costs-a-dollar", async ({ page, wait, tap, scrollTo, start }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/royalty-calculator", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "6x9");
  await page.selectOption("#ink", "black");
  await page.fill("#pages", "200");
  await page.dispatchEvent("#pages", "input");
  await page.fill("#list", "9.99");
  await page.dispatchEvent("#list", "input");
  await scrollTo(".calc");
  await start();
  await wait(1200);
  await scrollTo("#earn", "center");
  await wait(3000);

  for (const [trim, hold] of [["7x10", 3200], ["8.5x11", 3400], ["6x9", 2600]]) {
    await scrollTo(".calc");
    await wait(300);
    await tap("#trim");
    await page.selectOption("#trim", trim);
    await wait(700);
    await scrollTo("#earn", "center");
    await wait(hold);
  }
});

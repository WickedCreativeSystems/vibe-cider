// Raw portrait footage for the house channel: on the live royalty calculator,
// a 200-page black-ink book at $9.99 keeps $2.59 a copy at 6×9 and $1.59 at
// 7×10 or 8.5×11, because KDP prints "large trim" (wider than 6.12" or taller
// than 9") at $0.017 a page instead of $0.012 on Amazon.com.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-largetrim.mjs
//     → public/media/kdp-large-trim-costs-a-dollar.mp4 (the .json beside it is hand-written)
import { shoot } from "./footage-lib.mjs";

await shoot("kdp-large-trim-costs-a-dollar", async ({ page, wait, tap, start }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/royalty-calculator", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "6x9");
  await page.selectOption("#ink", "black");
  await page.fill("#pages", "200");
  await page.dispatchEvent("#pages", "input");
  await page.fill("#list", "9.99");
  await page.dispatchEvent("#list", "input");
  // One fixed frame for the whole clip: the Trim size menu at the top, the
  // printing cost in the middle and "You keep" at the bottom (616 of the 640 px).
  const frame = () => page.evaluate(() => scrollTo({ top: document.getElementById("trim").getBoundingClientRect().top + scrollY - 40, behavior: "instant" }));
  await frame();
  await wait(500);
  await start();
  await wait(3200);

  for (const [trim, hold] of [["7x10", 3600], ["8.5x11", 3600], ["6x9", 3200]]) {
    await tap("#trim");
    await page.selectOption("#trim", trim);
    await frame();
    await wait(hold);
  }
});

// Raw portrait footage for the house channel: on the live royalty calculator,
// a 6×9, 100-page black-ink book keeps $2.69 a copy at $9.98 and $3.69 at
// $9.99, because KDP's royalty rate steps from 50% to 60% at $9.99 on Amazon.com.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-onecent.mjs
//     → public/media/kdp-one-cent-price-9-98-vs-9-99.mp4 (the .json beside it is hand-written)
import { shoot } from "./footage-lib.mjs";

await shoot("kdp-one-cent-price-9-98-vs-9-99", async ({ page, wait, typeInto, scrollTo, start }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/royalty-calculator", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "6x9");
  await page.selectOption("#ink", "black");
  await page.fill("#pages", "100");
  await page.dispatchEvent("#pages", "input");
  await page.fill("#list", "9.98");
  await page.dispatchEvent("#list", "input");
  await scrollTo(".calc");
  await start();
  await wait(1400);

  for (const [price, hold] of [["9.98", 3400], ["9.99", 3400], ["9.98", 2400], ["9.99", 3000]]) {
    await scrollTo(".calc");
    await wait(300);
    await typeInto("#list", price);
    await scrollTo("#earn", "center");
    await wait(hold);
  }
});

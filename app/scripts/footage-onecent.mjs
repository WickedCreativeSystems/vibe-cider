// Raw portrait footage for the house channel: on the live royalty calculator,
// a 6×9, 100-page black-ink book keeps $2.69 a copy at $9.98 and $3.69 at
// $9.99, because KDP's royalty rate steps from 50% to 60% at $9.99 on Amazon.com.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-onecent.mjs
//     → public/media/kdp-one-cent-price-9-98-vs-9-99.mp4 (the .json beside it is hand-written)
import { shoot } from "./footage-lib.mjs";

await shoot("kdp-one-cent-price-9-98-vs-9-99", async ({ page, wait, typeInto, start }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/royalty-calculator", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "6x9");
  await page.selectOption("#ink", "black");
  await page.fill("#pages", "100");
  await page.dispatchEvent("#pages", "input");
  await page.fill("#list", "9.98");
  await page.dispatchEvent("#list", "input");
  // One fixed frame for the whole clip: the List price box at the top, then
  // the printing cost, "You keep" and the sum with the 0.5 or 0.6 in it.
  const frame = () => page.evaluate(() => scrollTo({ top: document.getElementById("list").getBoundingClientRect().top + scrollY - 50, behavior: "instant" }));
  await frame();
  await wait(500);
  await start();
  await wait(3200);

  for (const [price, hold] of [["9.99", 3800], ["9.98", 3000], ["9.99", 3400]]) {
    await typeInto("#list", price);
    await frame();
    await wait(hold);
  }
});

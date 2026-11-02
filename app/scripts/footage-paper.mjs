// Raw portrait footage for the house channel: the live spine calculator on a
// phone-sized screen, one 300-page 6×9 paperback switched between white,
// groundwood and cream paper. Same pages, three spines, three cover widths.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-paper.mjs
//     → public/media/kdp-spine-white-groundwood-cream.mp4 (the .json beside it is hand-written)
import { shoot } from "./footage-lib.mjs";

await shoot("kdp-spine-white-groundwood-cream", async ({ page, wait, scrollTo, start }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/spine-calculator", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "6x9");
  await page.selectOption("#paper", "white");
  await page.fill("#pages", "300");
  await page.dispatchEvent("#pages", "input");
  await scrollTo("#pages", "start");
  await start();
  await wait(3000);
  // 300 × 0.002252" = 0.676" white; × 0.00235" = 0.705" groundwood; × 0.0025" = 0.750" cream.
  for (const paper of ["white", "groundwood", "cream"]) {
    await scrollTo("#pages", "start");
    await page.selectOption("#paper", paper);
    await page.dispatchEvent("#paper", "change");
    await wait(1200);
    await scrollTo("#spine", "center");
    await wait(3500);
    await scrollTo("#sum", "center");
    await wait(3500);
  }
  // KDP's own warning about switching paper on a finished cover.
  await page.evaluate(() => [...document.querySelectorAll("p")].find((p) => p.textContent.startsWith("KDP's help pages don't give a thickness for groundwood")).scrollIntoView({ behavior: "smooth", block: "center" }));
  await wait(9000);
});

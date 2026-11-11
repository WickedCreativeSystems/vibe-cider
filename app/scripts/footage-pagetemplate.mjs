// Raw portrait footage for the house channel: the live margin calculator on a
// phone-sized screen hands out its two interior page templates for a 6×9,
// 320-page book, one PNG for odd pages and one for even, each shown from the
// file itself. The gutter (0.625" at 320 pages) is on the left of the odd page
// and the right of the even page.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-pagetemplate.mjs
//     → public/media/kdp-interior-page-template-odd-even.mp4 (the .json beside it is hand-written)
import { readFileSync } from "node:fs";
import { shoot } from "./footage-lib.mjs";

const HEAD = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>
  html,body{margin:0;height:100%;background:#e9edf3}
  #box{position:fixed;inset:0;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:3px}
  img{background:#fff;box-shadow:0 8px 24px rgba(20,30,50,.22)}</style>`;

await shoot("kdp-interior-page-template-odd-even", async ({ page, wait, typeInto, scrollTo, download, start }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/margin-calculator", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "6x9");
  await page.fill("#pages", "120");
  await page.dispatchEvent("#pages", "input");
  await page.evaluate(() => { const a = document.querySelector("#trim").getBoundingClientRect(); scrollTo(0, scrollY + a.top - 40); });
  await start();
  await wait(1200);
  await typeInto("#pages", "320");
  await page.dispatchEvent("#pages", "input");
  await wait(1200);

  // The drawn facing pages and the two template buttons in one screen.
  await page.evaluate(() => { const a = document.querySelector("#diagram").getBoundingClientRect(); scrollTo({ top: scrollY + a.top - 20, behavior: "smooth" }); });
  await wait(2600);
  const odd = `data:image/png;base64,${readFileSync(await download("#tplOdd", "odd.png")).toString("base64")}`;
  await wait(900);
  const even = `data:image/png;base64,${readFileSync(await download("#tplEven", "even.png")).toString("base64")}`;
  await wait(900);

  // The odd-page file, whole, then closer on what is written on it.
  await page.setContent(`${HEAD}<div id="box"><img id="i" src="${odd}" style="position:absolute;width:324px;left:18px;top:77px"></div>`);
  await wait(2600);
  await page.evaluate(() => document.getElementById("i").animate(
    [{ width: "324px", left: "18px", top: "77px" }, { width: "540px", left: "-107px", top: "-45px" }],
    { duration: 900, easing: "ease-in-out", fill: "forwards" }));
  await wait(4200);

  // The even-page file, whole.
  await page.setContent(`${HEAD}<div id="box"><img src="${even}" style="width:324px"></div>`);
  await wait(2800);

  // Both files side by side, even on the left, the way they face in an open book.
  await page.setContent(`${HEAD}<div id="box"><img src="${even}" style="width:172px"><img src="${odd}" style="width:172px"></div>`);
  await wait(3400);
});

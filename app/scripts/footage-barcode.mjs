// Raw portrait footage for the house channel: where KDP's barcode goes. The
// live spine calculator's barcode line, then the 300 DPI cover template it
// downloads (6x9, 120 pages, white), zooming from the whole back cover into
// the 2" x 1.2" box in its lower right, 0.25" in from the trim.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-barcode.mjs
//     → public/media/kdp-barcode-box-back-cover.mp4 (the .json beside it is hand-written)
import { readFileSync } from "node:fs";
import { shoot } from "./footage-lib.mjs";

await shoot("kdp-barcode-box-back-cover", async ({ page, wait, typeInto, scrollTo, download, start }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/spine-calculator", { waitUntil: "networkidle" });
  await page.selectOption("#trim", "6x9");
  await page.selectOption("#paper", "white");
  await page.fill("#pages", "120");
  await page.dispatchEvent("#pages", "input");
  await page.evaluate(() => { const a = document.querySelector("#barcode").getBoundingClientRect(); scrollTo(0, scrollY + a.top - 320); });
  await start();
  await wait(2600);
  await scrollTo("#tplBtn", "center");
  await wait(500);
  const png = await download("#tplBtn", "template.png");
  const src = `data:image/png;base64,${readFileSync(png).toString("base64")}`;
  // Back cover = 0.125" bleed + 6" panel; barcode box right edge 0.25" in from
  // the spine-side trim, bottom 0.25" up from the bottom trim. 300 px per inch.
  const D = 300, back = { x: (0.125 + 3) * D, y: (0.125 + 4.5) * D };
  const box = { x: (0.125 + 6 - 0.25 - 1) * D, y: (0.125 + 9 - 0.25 - 0.6) * D };
  await page.setContent(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>
    html,body{margin:0;height:100%;background:#e9edf3}#c{position:fixed;inset:0;overflow:hidden}
    img{position:absolute;left:0;top:0;transform-origin:0 0;max-width:none;box-shadow:0 8px 24px rgba(20,30,50,.22)}</style><div id="c"><img src="${src}"></div>`);
  await page.evaluate(({ back, box, D }) => {
    const img = document.querySelector("img");
    const at = (p, s) => `translate(${innerWidth / 2 - p.x * s}px, ${innerHeight / 2 - p.y * s}px) scale(${s})`;
    const sA = (innerWidth - 16) / (6.25 * D), sB = (innerWidth - 24) / (2.4 * D);
    img.style.transform = at(back, sA);
    setTimeout(() => img.animate([{ transform: at(back, sA) }, { transform: at(box, sB) }], { duration: 3200, easing: "ease-in-out", fill: "forwards" }), 2200);
  }, { back, box, D });
  await wait(2200 + 3200 + 3000);
});

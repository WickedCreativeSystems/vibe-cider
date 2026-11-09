// Raw portrait footage for the house channel: the free "This book belongs to"
// page, then three of its PDFs (fetched from the live site, rendered from the
// files themselves) at widths in proportion to their trims: 8.5x11, 6x9, 5x8.
//
//   cd app && FFMPEG=/path/to/ffmpeg node ../tracepress/scripts/footage-belongs.mjs
//     → tracepress/public/media/this-book-belongs-to-page.mp4 (the .json beside it is hand-written)
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { shoot } from "../../app/scripts/footage-lib.mjs";

const outDir = new URL("../public/media/", import.meta.url).pathname;
const BASE = "https://tracepress.bananafest-destiny.com/samples/this-book-belongs-to-page-";
const dir = mkdtempSync(join(tmpdir(), "belongs-"));
const trims = [["8.5x11", 94], ["6x9", 66], ["5x8", 55]];
for (const [t] of trims) writeFileSync(join(dir, `${t}.pdf`), Buffer.from(await (await fetch(`${BASE}${t}.pdf`)).arrayBuffer()));

await shoot("this-book-belongs-to-page", async ({ page, wait, tap, start, png, show }) => {
  await page.goto("https://tracepress.bananafest-destiny.com/this-book-belongs-to-page", { waitUntil: "networkidle" });
  const pages = trims.map(([t, w]) => [png(join(dir, `${t}.pdf`), 1, 150), w]);
  await start();
  await wait(2400);
  await page.locator("a.cta").first().evaluate((a) => a.removeAttribute("target"));
  await page.route(`${BASE}**`, (r) => r.fulfill({ status: 204, body: "" }));
  await tap("a.cta");
  await wait(400);
  for (const [src, w] of pages) await show(src, 2600, w);
}, { outDir });

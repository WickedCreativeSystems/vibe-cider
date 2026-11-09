// Raw portrait footage for the house channel: the free number tracing page,
// then four pages of its 0-9 PDF (fetched from the live site, rendered from
// the file itself): 0, 3, 5, 8.
//
//   cd app && FFMPEG=/path/to/ffmpeg node ../tracepress/scripts/footage-numbers.mjs
//     → tracepress/public/media/number-tracing-0-9.mp4 (the .json beside it is hand-written)
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { shoot } from "../../app/scripts/footage-lib.mjs";

const outDir = new URL("../public/media/", import.meta.url).pathname;
const PDF = "https://tracepress.bananafest-destiny.com/samples/number-tracing-worksheets-0-9.pdf";
const file = join(mkdtempSync(join(tmpdir(), "num-")), "num.pdf");
writeFileSync(file, Buffer.from(await (await fetch(PDF)).arrayBuffer()));

await shoot("number-tracing-0-9", async ({ page, wait, tap, start, png, show }) => {
  await page.goto("https://tracepress.bananafest-destiny.com/number-tracing", { waitUntil: "networkidle" });
  const pages = [1, 4, 6, 9].map((n) => png(file, n, 150));
  await start();
  await wait(2400);
  await page.locator("a.cta").first().evaluate((a) => a.removeAttribute("target"));
  await page.route(PDF, (r) => r.fulfill({ status: 204, body: "" }));
  await tap("a.cta");
  await wait(400);
  for (const src of pages) await show(src, 2200, 94);
}, { outDir });

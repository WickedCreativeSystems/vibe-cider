// Raw portrait footage for the house channel: the free pre-writing tracing
// lines page, then the four worksheets of its PDF (fetched from the live
// site, rendered from the file itself): straight lines, slants, zigzags and
// waves, circles and crosses.
//
//   cd app && FFMPEG=/path/to/ffmpeg node ../tracepress/scripts/footage-lines.mjs
//     → tracepress/public/media/tracing-lines-pre-writing.mp4 (the .json beside it is hand-written)
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { shoot } from "../../app/scripts/footage-lib.mjs";

const outDir = new URL("../public/media/", import.meta.url).pathname;
const PDF = "https://tracepress.bananafest-destiny.com/samples/tracing-lines-worksheets.pdf";
const file = join(mkdtempSync(join(tmpdir(), "lines-")), "lines.pdf");
writeFileSync(file, Buffer.from(await (await fetch(PDF)).arrayBuffer()));

await shoot("tracing-lines-pre-writing", async ({ page, wait, tap, start, png, show }) => {
  await page.goto("https://tracepress.bananafest-destiny.com/tracing-lines", { waitUntil: "networkidle" });
  const pages = [1, 2, 3, 4].map((n) => png(file, n, 150));
  await start();
  await wait(2400);
  await page.locator("a.cta").first().evaluate((a) => a.removeAttribute("target"));
  await page.route(PDF, (r) => r.fulfill({ status: 204, body: "" }));
  await tap("a.cta");
  await wait(400);
  for (const src of pages) await show(src, 2300, 94);
}, { outDir });

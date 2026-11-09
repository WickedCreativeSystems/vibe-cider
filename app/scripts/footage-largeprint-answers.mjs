// Raw portrait footage for the house channel: a large print word search book
// keeps its answers large print. The live large-print generator page, then
// from its live 20-puzzle sample PDF (rendered from the file itself): puzzle 1,
// then puzzle 1's answer grid, which has a whole 8.5x11 page to itself, then
// puzzle 2's.
//
//   FFMPEG=/path/to/ffmpeg node scripts/footage-largeprint-answers.mjs
//     → public/media/large-print-word-search-answers.mp4 (the .json beside it is hand-written)
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { shoot } from "./footage-lib.mjs";

const PDF = "https://puzzlepress.bananafest-destiny.com/samples/sample-large-print-8.5x11.pdf";
const file = join(mkdtempSync(join(tmpdir(), "lp-")), "lp.pdf");
writeFileSync(file, Buffer.from(await (await fetch(PDF)).arrayBuffer()));

await shoot("large-print-word-search-answers", async ({ page, wait, start, png, show }) => {
  await page.goto("https://puzzlepress.bananafest-destiny.com/large-print-word-search-generator", { waitUntil: "networkidle" });
  const pages = [[3, 2800], [24, 3000], [25, 2200]].map(([n, hold]) => [png(file, n, 150), hold]);
  await start();
  await wait(2400);
  for (const [src, hold] of pages) await show(src, hold, 96);
});

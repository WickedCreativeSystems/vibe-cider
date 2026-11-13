// The files for a real run through KDP's Print Previewer (forboss/
// 2026-11-13-kdp-previewer-test.md): one book and its cover, made by the same
// renderBook/renderCover a paying customer's browser runs, with licensed: true
// and nothing stamped on afterwards. Unlike scripts/sample.mjs there is no
// promo page, no link and no sample metadata: this is the file a buyer uploads.
//
// The book is the "Large print" preset at 8.5 x 11 with 100 puzzles, long
// enough for spine text (KDP: 79 pages and up), so the previewer sees the
// spine too.
//
// Run: node scripts/kdp-preview-files.mjs   (writes ../forboss/files/kdp-previewer/)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { generateBook } from "../src/generator/book.js";
import { THEMES } from "../src/generator/wordlists.js";
import { renderBook } from "../src/pdf/render.js";
import { renderCover } from "../src/pdf/cover.js";

const fonts = {
  regular: readFileSync(new URL("../public/fonts/LiberationSans-Regular.ttf", import.meta.url)),
  bold: readFileSync(new URL("../public/fonts/LiberationSans-Bold.ttf", import.meta.url)),
  display: readFileSync(new URL("../public/fonts/LilitaOne-Regular.ttf", import.meta.url)),
};
const out = new URL("../../forboss/files/kdp-previewer/", import.meta.url);
mkdirSync(out, { recursive: true });

export const BOOK = {
  title: "Large Print Garden Word Search",
  subtitle: "100 easy puzzles with solutions",
  author: "Puzzle Press",
  trim: "8.5x11",
  paper: "white",
  count: 100,
};

const seed = "kdp-previewer-2026-11-13";
const book = generateBook({
  pools: [THEMES.garden, THEMES.birds, THEMES.flowers, THEMES.farm, THEMES.weather, THEMES.kitchen],
  count: BOOK.count, wordsPerPuzzle: 14, difficulty: "easy", trim: BOOK.trim, seed,
});
const interior = await renderBook(book, { title: BOOK.title, subtitle: BOOK.subtitle, author: BOOK.author, trim: BOOK.trim, licensed: true, largePrint: true, fonts });
const pageCount = (await PDFDocument.load(interior)).getPageCount();
writeFileSync(new URL("puzzle-press-interior-8.5x11.pdf", out), interior);

const cover = await renderCover({
  title: BOOK.title, subtitle: BOOK.subtitle, author: BOOK.author, trim: BOOK.trim, paper: BOOK.paper,
  pageCount, puzzleCount: BOOK.count, samplePuzzle: book.puzzles[0], backPuzzle: book.puzzles[1],
  seed, largePrint: true, licensed: true, fonts,
});
writeFileSync(new URL("puzzle-press-cover-8.5x11.pdf", out), cover);
const c = (await PDFDocument.load(cover)).getPage(0).getSize();
console.log(`interior: ${pageCount} pages, ${interior.length} bytes; warnings: ${JSON.stringify(book.warnings)}`);
console.log(`cover: ${(c.width / 72).toFixed(3)} x ${(c.height / 72).toFixed(3)} in, ${cover.length} bytes`);

// The files for a real run through KDP's Print Previewer (forboss/
// 2026-11-13-kdp-previewer-test.md): one workbook and its cover, made by the
// same renderBook/renderCover a licensed buyer's browser runs. Unlike
// scripts/sample.mjs nothing is added afterwards: no footer line, no links,
// no sample metadata, no PREVIEW mark.
//
// The book is the generator with everything on: lines and shapes, A to Z in
// both cases, numbers. 8.5 x 11, white paper.
//
// Run: node scripts/kdp-preview-files.mjs   (writes ../forboss/files/kdp-previewer/)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { renderBook } from "../src/pdf/book.js";
import { renderCover } from "../src/pdf/cover.js";
import { cursiveWidth } from "../src/pdf/cursive.js";

const fonts = {
  bold: readFileSync(new URL("../fonts/LiberationSans-Bold.ttf", import.meta.url)),
  regular: readFileSync(new URL("../fonts/LiberationSans-Regular.ttf", import.meta.url)),
  cursive: readFileSync(new URL("../public/fonts/PlaywriteUSTrad.ttf", import.meta.url)),
};
const cursiveFont = fontkit.create(fonts.cursive);
const measure = (text, unit) => cursiveWidth(cursiveFont, text, unit);
const out = new URL("../../forboss/files/kdp-previewer/", import.meta.url);
mkdirSync(out, { recursive: true });

export const BOOK = {
  title: "My First Letter Tracing Book",
  subtitle: "Trace A to Z and 0 to 9 with stroke arrows and numbered start dots",
  author: "Trace Press",
  trim: "8.5x11",
  paper: "white",
};

const opts = { trim: BOOK.trim, guideIn: 0.75, words: [], numbers: true, lines: true, shapes: true, cases: "both", script: "print", measure, abc: false, licensed: true };
const interior = await renderBook(opts, fonts);
const pageCount = (await PDFDocument.load(interior)).getPageCount();
writeFileSync(new URL("trace-press-interior-8.5x11.pdf", out), interior);

const cover = await renderCover({ title: BOOK.title, subtitle: BOOK.subtitle, author: BOOK.author, trim: BOOK.trim, pageCount, paper: BOOK.paper, licensed: true }, fonts);
writeFileSync(new URL("trace-press-cover-8.5x11.pdf", out), cover);
const c = (await PDFDocument.load(cover)).getPage(0).getSize();
console.log(`interior: ${pageCount} pages, ${interior.length} bytes`);
console.log(`cover: ${(c.width / 72).toFixed(3)} x ${(c.height / 72).toFixed(3)} in, ${cover.length} bytes`);

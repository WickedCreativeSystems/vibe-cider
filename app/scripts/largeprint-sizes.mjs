// The letter sizes a large-print word search book really prints, read as the
// renderer draws them (the size handed to drawText for every grid letter), not
// worked out from the page width. The figures on /large-print-word-search-generator,
// its description and its share card come from this script.
//
//   node scripts/largeprint-sizes.mjs                 ten puzzles from every built-in theme, at
//                                                     Easy, Medium and Hard, with the preset the
//                                                     Large print checkbox sets (8.5 x 11, 14 words,
//                                                     automatic grid), then Medium at 6 x 9 with 15
//   node scripts/largeprint-sizes.mjs 80 kansas,idaho the same for 80 puzzles from two themes (a book
//                                                     past 150 pages has a wider inside margin)
//
// Why it exists: on 2026-09-27 the page was given "18-27pt, median 22" from the
// page width divided by the grid (it left out the 9pt the grid is inset on each
// side, and the pages where a long word bank shortens the grid). The real PDF
// was about 0.7pt smaller at every size, and the generator has since moved the
// middle grid from 16 squares to 17. Read 2026-11-17: 16 to 26pt, median 20 at
// Medium. Run this again before quoting a size anywhere.
import { readFileSync } from "node:fs";
import { PDFPage } from "pdf-lib";
import { generateBook } from "../src/generator/book.js";
import { THEMES } from "../src/generator/wordlists.js";
import { renderBook } from "../src/pdf/render.js";

const fonts = {
  regular: readFileSync(new URL("../public/fonts/LiberationSans-Regular.ttf", import.meta.url)),
  bold: readFileSync(new URL("../public/fonts/LiberationSans-Bold.ttf", import.meta.url)),
};
const count = Number(process.argv[2]) || 10;
const ids = process.argv[3] ? process.argv[3].split(",") : Object.keys(THEMES);
for (const id of ids) if (!THEMES[id]) throw new Error(`no theme called ${id}`);

const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

async function measure(difficulty, trim) {
  const largePrint = trim === "8.5x11";
  const rows = [];
  for (const id of ids) {
    const draws = [];
    const pages = new Map();
    const orig = PDFPage.prototype.drawText;
    PDFPage.prototype.drawText = function (text, o = {}) {
      if (!pages.has(this)) pages.set(this, pages.size + 1);
      draws.push({ text: String(text), size: o.size ?? 24, page: pages.get(this) });
      return orig.call(this, text, o);
    };
    try {
      const book = generateBook({ pools: [THEMES[id]], count, wordsPerPuzzle: largePrint ? 14 : 15, difficulty, trim, seed: "book" });
      await renderBook(book, { title: "Large Print Word Search", subtitle: "", author: "An Author", trim, licensed: true, largePrint, fonts });
      // A puzzle page is the only kind that draws single capital letters, one
      // for each square; the first book.puzzles.length of them are the puzzles
      // (the answer pages come after).
      const byPage = new Map();
      for (const d of draws) {
        if (!/^[A-Z]$/.test(d.text)) continue;
        if (!byPage.has(d.page)) byPage.set(d.page, []);
        byPage.get(d.page).push(d.size);
      }
      const grids = [...byPage.entries()].sort((a, b) => a[0] - b[0]).slice(0, book.puzzles.length);
      grids.forEach(([, sizes], i) => {
        const n = book.puzzles[i].size;
        if (sizes.length !== n * n || new Set(sizes).size !== 1) throw new Error(`${id} puzzle ${i + 1}: not one size for ${n}x${n} letters`);
        rows.push({ id, pt: sizes[0], n });
      });
    } finally {
      PDFPage.prototype.drawText = orig;
    }
  }
  const pts = rows.map((r) => r.pt);
  const ns = rows.map((r) => r.n);
  const lo = rows.reduce((a, b) => (a.pt <= b.pt ? a : b));
  const hi = rows.reduce((a, b) => (a.pt >= b.pt ? a : b));
  console.log(
    `${difficulty.padEnd(6)} ${trim.padEnd(6)} ${rows.length} puzzles: letters ${Math.min(...pts).toFixed(2)} to ${Math.max(...pts).toFixed(2)}pt, median ${median(pts).toFixed(2)}; ` +
      `${Math.min(...ns)} to ${Math.max(...ns)} squares across, median ${median(ns)}; under 16pt: ${pts.filter((p) => p < 16).length}; ` +
      `smallest ${lo.id}, largest ${hi.id}`,
  );
  return rows;
}

console.log(`${ids.length} themes, ${count} puzzles from each`);
const all = [];
for (const d of ["easy", "medium", "hard"]) all.push(...(await measure(d, "8.5x11")));
const pts = all.map((r) => r.pt).sort((a, b) => a - b);
const ns = all.map((r) => r.n);
const at = (q) => pts[Math.min(pts.length - 1, Math.floor(q * pts.length))];
console.log(
  `all three grades, ${all.length} puzzles: letters ${pts[0].toFixed(2)} to ${pts.at(-1).toFixed(2)}pt; ${Math.min(...ns)} to ${Math.max(...ns)} squares across; ` +
    `nine in ten between ${at(0.05).toFixed(1)} and ${at(0.95).toFixed(1)}pt; under 16pt: ${pts.filter((p) => p < 16).length}`,
);
await measure("medium", "6x9");

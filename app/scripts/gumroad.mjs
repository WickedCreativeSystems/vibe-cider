// Free, publishable interiors for Gumroad $0 listings (boss, 2026-11-02:
// "Yes, I'll open one"). KDP sellers search "free word search KDP interior"
// and Gumroad's $0+ listings answer it; this site sits at position 30–90.
//
// These are not the public samples. A sample says "Sample book, made free
// with Puzzle Press" and "Copyright © Puzzle Press, all rights reserved" on
// its first two pages, which nobody may publish. These carry no author, no
// stamp and no promo page: the file is the book. The way back to the tool
// lives in the listing text and in START-HERE.txt beside the PDF.
//
// Writes to forboss/files/gumroad/ (git-ignored). Run: node scripts/gumroad.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { generateBook } from "../src/generator/book.js";
import { THEMES } from "../src/generator/wordlists.js";
import { renderBook } from "../src/pdf/render.js";
import { generateSudokuBook } from "../src/generator/sudoku.js";
import { generateMazeBook } from "../src/generator/maze.js";
import { generateCrissCrossBook } from "../src/generator/crisscross.js";
import { generateCrosswordBook } from "../src/generator/crossword.js";
import { CLUES } from "../src/generator/clues.js";

const fonts = {
  regular: readFileSync(new URL("../public/fonts/LiberationSans-Regular.ttf", import.meta.url)),
  bold: readFileSync(new URL("../public/fonts/LiberationSans-Bold.ttf", import.meta.url)),
};
const out = new URL("../../forboss/files/gumroad/", import.meta.url);
mkdirSync(out, { recursive: true });
// The same files are served from the site at /free/<name>.pdf (linked from
// the README and the home page). A PDF's Title is its Google headline, so it
// says what the file is for a searcher, under 70 characters.
const site = new URL("../public/free/", import.meta.url);
mkdirSync(site, { recursive: true });

const SEARCH_TITLE = {
  "word-search-100-6x9": "Free KDP word search interior: 100 puzzles, 6x9, publish it",
  "large-print-word-search-100-8.5x11": "Free large print word search KDP interior: 100 puzzles, 8.5x11",
  "sudoku-100-6x9": "Free sudoku KDP interior: 100 puzzles, easy to expert, 6x9",
  "mazes-100-6x9": "Free maze book KDP interior: 100 mazes, easy to expert, 6x9",
  "criss-cross-50-6x9": "Free criss-cross puzzle KDP interior: 50 fill-in puzzles, 6x9",
  "crosswords-50-6x9": "Free crossword KDP interior: 50 garden crosswords, 6x9",
};
const BOOKS = [
  ["word-search-100-6x9", "Garden & Kitchen Word Search", "100 puzzles with solutions", "6x9", false,
    () => generateBook({ pools: [THEMES.garden, THEMES.kitchen], count: 100, wordsPerPuzzle: 16, difficulty: "medium", seed: "gumroad-ws-1" })],
  ["large-print-word-search-100-8.5x11", "Large Print Garden Word Search", "100 puzzles with solutions", "8.5x11", true,
    () => generateBook({ pools: [THEMES.garden, THEMES.birds], count: 100, wordsPerPuzzle: 14, difficulty: "easy", trim: "8.5x11", seed: "gumroad-lp-1" })],
  ["sudoku-100-6x9", "Sudoku for Sunday", "100 puzzles, easy to expert", "6x9", false,
    () => generateSudokuBook({ count: 100, difficulty: "graded", seed: "gumroad-sudoku-1" })],
  ["mazes-100-6x9", "Mazes for Rainy Days", "100 mazes, easy to expert", "6x9", false,
    () => generateMazeBook({ count: 100, difficulty: "graded", seed: "gumroad-maze-1" })],
  ["criss-cross-50-6x9", "Halloween Fill-In Puzzles", "50 criss-cross puzzles, easy to expert", "6x9", false,
    () => generateCrissCrossBook({ pools: [THEMES.halloween], count: 50, difficulty: "graded", seed: "gumroad-crisscross-1" })],
  ["crosswords-50-6x9", "Garden Crosswords", "50 themed crosswords, easy to expert", "6x9", false,
    () => generateCrosswordBook({ pools: [THEMES.garden], builtinClues: CLUES, count: 50, difficulty: "graded", seed: "gumroad-crossword-1" })],
];

for (const [file, title, subtitle, trim, largePrint, make] of BOOKS) {
  const book = make();
  const doc = await PDFDocument.load(await renderBook(book, { title, subtitle, author: "", trim, licensed: true, largePrint, fonts }));
  doc.setTitle(SEARCH_TITLE[file]);
  doc.setSubject("Free to publish and sell. Made with Puzzle Press: https://puzzlepress.bananafest-destiny.com/");
  const bytes = await doc.save();
  writeFileSync(new URL(`${file}.pdf`, out), bytes);
  writeFileSync(new URL(`${file}.pdf`, site), bytes);
  console.log(file, book.puzzles.length, "puzzles", bytes.length, "bytes", book.warnings?.length ? book.warnings : "");
}

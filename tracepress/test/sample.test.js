// The public samples (scripts/sample.mjs) as committed: a search-result title
// that fits, the free tier's marks still on them, and a way back to the site
// from every page. Link annotations are read through pdf-lib, not by grepping
// the file's bytes (compressed object streams hide them from a grep).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PDFDocument, PDFName } from "pdf-lib";

const SITE = "https://tracepress.bananafest-destiny.com/";
const path = (f) => fileURLToPath(new URL(`../public/samples/${f}`, import.meta.url));
const BOOK = path("letter-tracing-workbook-sample-8.5x11.pdf");
const COVER = path("letter-tracing-cover-sample-8.5x11.pdf");
const SIGHT = path("sight-word-tracing-workbook-sample-8.5x11.pdf");
const NUMBERS = path("number-tracing-worksheets-0-9.pdf");
const LINES = path("tracing-lines-worksheets.pdf");
const SHAPES = path("shape-tracing-worksheets.pdf");
const PRESCHOOL = path("preschool-tracing-worksheets.pdf");

function links(doc, page) {
  const annots = page.node.lookup(PDFName.of("Annots"));
  if (!annots) return [];
  return annots.asArray().map((r) => doc.context.lookup(r)).map((a) => ({
    rect: a.lookup(PDFName.of("Rect")).asArray().map((n) => n.asNumber()),
    uri: a.lookup(PDFName.of("A")).lookup(PDFName.of("URI")).decodeText(),
  }));
}

test("the sample book: titled for search, free marks on, a link on every page", async () => {
  const doc = await PDFDocument.load(readFileSync(BOOK));
  assert.ok(doc.getTitle().length <= 70 && /Letter Tracing/.test(doc.getTitle()), doc.getTitle());
  assert.equal(doc.getPageCount(), 27);
  for (let i = 0; i < 27; i++) {
    const l = links(doc, doc.getPage(i));
    assert.ok(l.some((x) => x.uri === SITE), `page ${i + 1} has no link to the site`);
  }
  const { width, height } = doc.getPage(26).getSize();
  const last = links(doc, doc.getPage(26))[0].rect;
  assert.deepEqual(last, [0, 0, width, height], "the last page is one big link");
  const text = execFileSync("pdftotext", ["-f", "1", "-l", "1", BOOK, "-"], { encoding: "utf8" });
  assert.match(text, /Made with Trace Press, free preview/);
});

test("the sample cover: one sheet, PREVIEW on it, and a link", async () => {
  const doc = await PDFDocument.load(readFileSync(COVER));
  assert.ok(doc.getTitle().length <= 70 && /Cover/.test(doc.getTitle()), doc.getTitle());
  assert.equal(doc.getPageCount(), 1);
  const { width, height } = doc.getPage(0).getSize();
  assert.ok(links(doc, doc.getPage(0)).some((x) => x.uri === SITE && x.rect[0] <= 0 && x.rect[1] <= 0 && x.rect[2] >= width && x.rect[3] >= height), "the whole cover sheet is the link");
  assert.match(execFileSync("pdftotext", [COVER, "-"], { encoding: "utf8" }), /PREVIEW/);
});

test("the sight word sample: A to Z, then the 40 pre-primer words, a link on every page", async () => {
  const doc = await PDFDocument.load(readFileSync(SIGHT));
  assert.ok(doc.getTitle().length <= 70 && /Sight Word/.test(doc.getTitle()), doc.getTitle());
  assert.equal(doc.getPageCount(), 67);
  for (let i = 0; i < 67; i++) assert.ok(links(doc, doc.getPage(i)).some((x) => x.uri === SITE), `page ${i + 1} has no link to the site`);
  const page = (n) => execFileSync("pdftotext", ["-f", String(n), "-l", String(n), SIGHT, "-"], { encoding: "utf8" });
  assert.match(page(66), /Made with Trace Press, free preview/);
  assert.match(page(67), /Made with Trace Press/);
});

test("the number worksheets: 0 to 9 only, one page each, a link on every page", async () => {
  const doc = await PDFDocument.load(readFileSync(NUMBERS));
  assert.ok(doc.getTitle().length <= 70 && /Number Tracing/.test(doc.getTitle()), doc.getTitle());
  assert.equal(doc.getPageCount(), 11);
  for (let i = 0; i < 11; i++) assert.ok(links(doc, doc.getPage(i)).some((x) => x.uri === SITE), `page ${i + 1} has no link to the site`);
  const page = (n) => execFileSync("pdftotext", ["-f", String(n), "-l", String(n), NUMBERS, "-"], { encoding: "utf8" });
  for (let n = 1; n <= 10; n++) assert.match(page(n), /Made with Trace Press, free preview/);
  assert.match(page(11), /Made with Trace Press/);
});

test("the tracing lines worksheets: the four line pages only, a link on every page", async () => {
  const doc = await PDFDocument.load(readFileSync(LINES));
  assert.ok(doc.getTitle().length <= 70 && /Tracing Lines/.test(doc.getTitle()), doc.getTitle());
  assert.equal(doc.getPageCount(), 5);
  for (let i = 0; i < 5; i++) assert.ok(links(doc, doc.getPage(i)).some((x) => x.uri === SITE), `page ${i + 1} has no link to the site`);
  const page = (n) => execFileSync("pdftotext", ["-f", String(n), "-l", String(n), LINES, "-"], { encoding: "utf8" });
  for (let n = 1; n <= 4; n++) assert.match(page(n), /Made with Trace Press, free preview/);
  assert.match(page(5), /Made with Trace Press/);
});

test("the shape tracing worksheets: the six shape pages only, a link on every page", async () => {
  const doc = await PDFDocument.load(readFileSync(SHAPES));
  assert.ok(doc.getTitle().length <= 70 && /Shape Tracing/.test(doc.getTitle()), doc.getTitle());
  assert.equal(doc.getPageCount(), 7);
  for (let i = 0; i < 7; i++) assert.ok(links(doc, doc.getPage(i)).some((x) => x.uri === SITE), `page ${i + 1} has no link to the site`);
  const page = (n) => execFileSync("pdftotext", ["-f", String(n), "-l", String(n), SHAPES, "-"], { encoding: "utf8" });
  for (let n = 1; n <= 6; n++) assert.match(page(n), /Made with Trace Press, free preview/);
  assert.match(page(7), /Made with Trace Press/);
});

// The free "This book belongs to" pages: one per KDP trim, exactly that size,
// one page, and nothing on it but the words and the line, since a seller puts
// it into their own book.
test("the 'this book belongs to' pages: every trim, exact size, no marks", async () => {
  const { TRIMS, PT } = await import("../src/pdf/kdp.js");
  for (const [trim, t] of Object.entries(TRIMS)) {
    const f = path(`this-book-belongs-to-page-${trim}.pdf`);
    const doc = await PDFDocument.load(readFileSync(f));
    assert.equal(doc.getPageCount(), 1, trim);
    assert.ok(doc.getTitle().length <= 70 && doc.getTitle().includes(trim), doc.getTitle());
    const { width, height } = doc.getPage(0).getSize();
    assert.deepEqual([width, height], [t.w * PT, t.h * PT], trim);
    const text = execFileSync("pdftotext", [f, "-"], { encoding: "utf8" }).trim();
    assert.equal(text, "This book belongs to", `${trim}: ${text}`);
    assert.deepEqual(links(doc, doc.getPage(0)), [], `${trim} has a link`);
  }
});

test("the name tracing example: one page for Maya, titled for search, the footer line", async () => {
  const f = path("name-tracing-worksheet-maya.pdf");
  const doc = await PDFDocument.load(readFileSync(f));
  assert.ok(doc.getTitle().length <= 70 && /Name Tracing/.test(doc.getTitle()), doc.getTitle());
  assert.equal(doc.getPageCount(), 1);
  assert.match(execFileSync("pdftotext", [f, "-"], { encoding: "utf8" }), /tracepress\.bananafest-destiny\.com/);
});

test("the preschool worksheets: lines, shapes, A to Z, 0 to 9, a link on every page", async () => {
  const doc = await PDFDocument.load(readFileSync(PRESCHOOL));
  assert.ok(doc.getTitle().length <= 70 && /Preschool/.test(doc.getTitle()) && /Shapes/.test(doc.getTitle()), doc.getTitle());
  assert.equal(doc.getPageCount(), 47);
  for (let i = 0; i < 47; i++) assert.ok(links(doc, doc.getPage(i)).some((x) => x.uri === SITE), `page ${i + 1} has no link to the site`);
  const html = readFileSync(new URL("../public/preschool-tracing-worksheets.html", import.meta.url), "utf8");
  assert.match(html, /\(PDF, 46 worksheets\)/);
  assert.match(html, /Pages 37 to 46: the numbers/);
});

// The kindergarten sheets' samples: what each page downloads at its defaults,
// the free footer line on every page, and that line a link.
for (const [file, title, pages, footer] of [
  ["cvc-word-worksheets.pdf", /CVC Word Worksheets/, 3, /Free worksheet from tracepress/],
  ["count-and-trace-worksheets-1-10.pdf", /Count and Trace Worksheets 1–10/, 2, /Free worksheet from tracepress/],
  ["sight-word-flash-cards-pre-primer-3x5.pdf", /Pre-Primer Sight Word Flash Cards/, 10, /Free sight word cards from tracepress/],
]) {
  test(`${file}: titled for search, ${pages} pages, the footer line a link on each`, async () => {
    const doc = await PDFDocument.load(readFileSync(path(file)));
    assert.ok(doc.getTitle().length <= 70 && title.test(doc.getTitle()), doc.getTitle());
    assert.equal(doc.getPageCount(), pages);
    for (let i = 0; i < pages; i++) {
      assert.ok(links(doc, doc.getPage(i)).some((x) => x.uri === SITE), `page ${i + 1} has no link to the site`);
      assert.match(execFileSync("pdftotext", ["-f", String(i + 1), "-l", String(i + 1), path(file), "-"], { encoding: "utf8" }), footer);
    }
  });
}

// The matching game sample: five sets, each two sheets of fronts (footer
// linked) and each front followed by its back, which carries no text but the
// set name, so a face-down card gives nothing away.
test("short-vowel-matching-cards.pdf: 20 pages, fronts linked, backs plain", async () => {
  const file = "short-vowel-matching-cards.pdf";
  const doc = await PDFDocument.load(readFileSync(path(file)));
  assert.ok(doc.getTitle().length <= 70 && /Short Vowel Matching Cards/.test(doc.getTitle()), doc.getTitle());
  assert.equal(doc.getPageCount(), 20);
  for (let i = 0; i < 20; i++) {
    const text = execFileSync("pdftotext", ["-f", String(i + 1), "-l", String(i + 1), path(file), "-"], { encoding: "utf8" });
    const set = `Short ${"aeiou"[Math.floor(i / 4)]}`;
    if (i % 2 === 0) {
      assert.ok(links(doc, doc.getPage(i)).some((x) => x.uri === SITE), `page ${i + 1} has no link to the site`);
      assert.match(text, /Free sight word cards from tracepress/);
    } else {
      assert.equal(links(doc, doc.getPage(i)).length, 0, `back page ${i + 1} has a link`);
      assert.deepEqual([...new Set(text.split(/\s*\n\s*/).filter(Boolean))], [set], `back page ${i + 1}`);
    }
  }
});

// The sight word game: the 40 pre-primer words, six pairs a sheet, so seven
// sheets, the last with four pairs; each front linked, each back plain.
test("sight-word-matching-game-pre-primer.pdf: 14 pages, fronts linked, backs plain", async () => {
  const file = "sight-word-matching-game-pre-primer.pdf";
  const doc = await PDFDocument.load(readFileSync(path(file)));
  assert.ok(doc.getTitle().length <= 70 && /Sight Word Matching Game/.test(doc.getTitle()), doc.getTitle());
  assert.equal(doc.getPageCount(), 14);
  for (let i = 0; i < 14; i++) {
    const text = execFileSync("pdftotext", ["-f", String(i + 1), "-l", String(i + 1), path(file), "-"], { encoding: "utf8" });
    const front = i % 2 === 0;
    assert.equal(links(doc, doc.getPage(i)).some((x) => x.uri === SITE), front, `page ${i + 1}`);
    assert.equal(/Free sight word cards from tracepress/.test(text), front, `page ${i + 1}`);
  }
});

// A key used twice in SAMPLES keeps only the second, and the first file is
// silently never written again: `numbers` was both the 0–9 worksheets and the
// number words from 10-05 to 10-27. Read from the source, since importing
// sample.mjs runs it.
test("every SAMPLES key in scripts/sample.mjs is used once", () => {
  const src = readFileSync(new URL("../scripts/sample.mjs", import.meta.url), "utf8");
  const block = src.slice(src.indexOf("export const SAMPLES = {"), src.indexOf("\n};", src.indexOf("export const SAMPLES = {")));
  const keys = [...block.matchAll(/^ {2}(\w+): \{$/gm)].map((m) => m[1]);
  assert.ok(keys.length >= 25, `${keys.length}`);
  assert.deepEqual(keys.filter((k, i) => keys.indexOf(k) !== i), []);
});

test("the holiday worksheets end on the matching game with the same words", async () => {
  for (const set of ["christmas", "thanksgiving"]) {
    const f = path(`${set}-tracing-worksheets.pdf`);
    const doc = await PDFDocument.load(readFileSync(f));
    assert.equal(doc.getPageCount(), 21);
    for (let i = 0; i < 20; i++) assert.ok(links(doc, doc.getPage(i)).some((x) => x.uri === SITE), `${set} page ${i + 1} has no link to the site`);
    const { width, height } = doc.getPage(20).getSize();
    assert.deepEqual(links(doc, doc.getPage(20)), [{ rect: [0, 0, width, height], uri: `${SITE}sight-word-matching-game?set=${set}` }]);
    assert.match(execFileSync("pdftotext", ["-f", "21", "-l", "21", f, "-"], { encoding: "utf8" }), /free matching game/);
  }
});

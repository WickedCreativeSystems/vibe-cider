// The public sample book and cover (linked from the landing page and the
// guide), exactly as the free tier makes them: footer line on every page,
// PREVIEW on the cover. Nothing mocked up.
//
// Two things are added here and only here, never in book.js or cover.js,
// which also render buyers' paid books and must stay unbranded:
//   - Document metadata. Google indexes PDFs and uses the file's Title as the
//     result headline (about 70 characters shown) and its Subject in the
//     snippet. book.js sets Title to the buyer's own title; on a sample that
//     would tell a searcher nothing. (Learned on Puzzle Press, where the
//     samples are the asset strangers open most: app/scripts/sample.mjs.)
//   - Links. A PDF opened from a search result, or detached from the tab on a
//     phone, has no way back to the site. So the free footer line on every
//     page becomes a link, the book ends with a whole-page link, and the
//     whole cover sheet is a link.
//
// Run: npm run sample (writes public/samples/)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { PDFDocument, PDFName, PDFString, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { renderBook, planBook, renderName, renderSheets, renderCards } from "../src/pdf/book.js";
import { planCvc, planCount, sheetInk } from "../src/pdf/sheets.js";
import { planCards, cardsInk, LISTS, PICTURE_SET } from "../src/pdf/cards.js";
import { renderCover } from "../src/pdf/cover.js";
import { pageInk } from "../src/pdf/ink.js";
import { TRIMS } from "../src/pdf/kdp.js";
import { drawLetterPage } from "../src/pdf/draw.js";
import { cursiveWidth } from "../src/pdf/cursive.js";
import { cursiveChart, printChart } from "../src/pdf/chart.js";

const SITE = "https://tracepress.bananafest-destiny.com/";
const TRIM = "8.5x11";
const GUIDE_IN = 0.75;
const fonts = {
  bold: readFileSync(new URL("../fonts/LiberationSans-Bold.ttf", import.meta.url)),
  regular: readFileSync(new URL("../fonts/LiberationSans-Regular.ttf", import.meta.url)),
  cursive: readFileSync(new URL("../public/fonts/PlaywriteUSTrad.ttf", import.meta.url)),
};
const cursiveFont = fontkit.create(fonts.cursive);
const measure = (text, unit) => cursiveWidth(cursiveFont, text, unit);
const out = new URL("../public/samples/", import.meta.url);
mkdirSync(out, { recursive: true });

export const SAMPLES = {
  book: {
    file: "letter-tracing-workbook-sample-8.5x11.pdf",
    title: "Free A–Z Letter Tracing Workbook PDF (Sample Book) · Trace Press",
    subject: "A 26-page A to Z handwriting workbook, capital and lowercase: stroke-order arrows, numbered start dots, dotted letters to trace on four-line guides. 8.5 x 11, laid out to Amazon KDP's rules. Made free with Trace Press.",
  },
  cover: {
    file: "letter-tracing-cover-sample-8.5x11.pdf",
    title: "Letter Tracing Book Cover for KDP, 8.5x11 (Free Sample) · Trace Press",
    subject: "A full-wrap paperback cover (back, spine, front) sized by KDP's formula for a 26-page 8.5 x 11 letter tracing book. Made free with Trace Press; free covers carry a PREVIEW mark.",
  },
  sightWords: {
    file: "sight-word-tracing-workbook-sample-8.5x11.pdf",
    title: "Free Sight Word Tracing Workbook PDF, Dolch Pre-Primer · Trace Press",
    subject: "A 66-page handwriting workbook: A to Z, then one page for each of the 40 Dolch pre-primer sight words, with stroke-order arrows, numbered start dots and dotted words to trace on four-line guides. 8.5 x 11, laid out to Amazon KDP's rules. Made free with Trace Press.",
  },
  numbers: {
    file: "number-tracing-worksheets-0-9.pdf",
    title: "Free Number Tracing Worksheets 0–9, Printable PDF · Trace Press",
    subject: "Ten printable number tracing pages, 0 to 9: each digit large with a numbered start dot and stroke-order arrows, then rows of dotted digits to trace on four-line guides with 1-inch lines for ages 4 to 5. 8.5 x 11. Made free with Trace Press.",
  },
  lines: {
    file: "tracing-lines-worksheets.pdf",
    title: "Free Tracing Lines Worksheets, Pre-Writing Printable PDF · Trace Press",
    subject: "Four printable pre-writing pages: down and across lines, slants, zigzags and waves, circles and crosses, each with numbered start dots and direction arrows, then rows to trace on four-line guides with 1-inch lines for ages 4 to 5. 8.5 x 11. Made free with Trace Press.",
  },
  shapes: {
    file: "shape-tracing-worksheets.pdf",
    title: "Free Shape Tracing Worksheets, Printable PDF · Trace Press",
    subject: "Six printable shape tracing pages: square, triangle, rectangle, diamond, star and heart, each large with a numbered start dot and direction arrows, then rows to trace on four-line guides with 1-inch lines for ages 4 to 5. 8.5 x 11. Made free with Trace Press.",
  },
  abc: {
    file: "alphabet-tracing-worksheets-with-pictures.pdf",
    title: "Free Alphabet Tracing Worksheets with Pictures, A–Z (PDF)",
    subject: "26 printable alphabet tracing pages, A is for apple to Z is for zeppelin: each letter large with numbered start dots and stroke-order arrows, a picture to colour with its word, then rows of dotted letters to trace on four-line guides with 1-inch lines for ages 4 to 5. 8.5 x 11. Made free with Trace Press.",
  },
  counting: {
    file: "number-tracing-worksheets-with-pictures.pdf",
    title: "Free Number Tracing Worksheets with Pictures, 0–9 (PDF)",
    subject: "Ten printable number tracing pages, 0 to 9: each digit large with a numbered start dot and stroke-order arrows, stars to count and colour on pages 1 to 9 with the number word, then rows of dotted digits to trace on four-line guides with 1-inch lines for ages 4 to 5. 8.5 x 11. Made free with Trace Press.",
  },
  upper: {
    file: "uppercase-letter-tracing-worksheets.pdf",
    title: "Free Uppercase Letter Tracing Worksheets A–Z, PDF · Trace Press",
    subject: "26 printable capital letter tracing pages, A to Z: each letter large with numbered start dots and stroke-order arrows, then rows of dotted capitals to trace on four-line guides with 1-inch lines for ages 4 to 5. 8.5 x 11. Made free with Trace Press.",
  },
  lower: {
    file: "lowercase-letter-tracing-worksheets.pdf",
    title: "Free Lowercase Letter Tracing Worksheets a–z, PDF · Trace Press",
    subject: "26 printable lowercase letter tracing pages, a to z: each letter large with numbered start dots and stroke-order arrows, then rows of dotted letters to trace on four-line guides with 1-inch lines for ages 4 to 5. 8.5 x 11. Made free with Trace Press.",
  },
  cursiveAdult: {
    file: "cursive-practice-sheets-for-adults.pdf",
    title: "Free Cursive Practice Sheets for Adults, A–Z (PDF) · Trace Press",
    subject: "26 printable cursive handwriting practice pages for adults and older students: each capital and lowercase letter in solid cursive, then rows in grey to trace, on 0.45-inch four-line guides. 8.5 x 11. Made free with Trace Press.",
  },
  printAdult: {
    file: "handwriting-practice-sheets-for-adults.pdf",
    title: "Free Handwriting Practice Sheets for Adults, A–Z, 0–9 (PDF)",
    subject: "36 printable handwriting practice pages for adults and older students: each letter A to Z, capital and lowercase, and each number 0 to 9, to trace on 0.45-inch four-line guides. 8.5 x 11. Made free with Trace Press.",
  },
  preschool: {
    file: "preschool-tracing-worksheets.pdf",
    title: "Free Preschool Tracing Worksheets: Lines, Shapes, A–Z, 0–9 (PDF)",
    subject: "46 printable preschool tracing worksheets on big 1-inch lines: 4 pages of pre-writing lines, 6 shapes, the capital letters A to Z, and the numbers 0 to 9, each with a start dot and arrows. 8.5 x 11. Made free with Trace Press.",
  },
  halloween: {
    file: "halloween-tracing-worksheets.pdf",
    title: "Free Halloween Tracing Worksheets: 20 Words to Trace (PDF)",
    subject: "20 printable Halloween word tracing worksheets: bat, moon, ghost, pumpkin, spider and more, each with a picture to colour, numbered start dots, stroke-order arrows and dotted rows to trace on four-line guides. 8.5 x 11. Made free with Trace Press.",
  },
  thanksgiving: {
    file: "thanksgiving-tracing-worksheets.pdf",
    title: "Free Thanksgiving Tracing Worksheets: 20 Words to Trace (PDF)",
    subject: "20 printable Thanksgiving word tracing worksheets: cake, bread, apple, pumpkin, feather and more, each with a picture to colour, numbered start dots, stroke-order arrows and dotted rows to trace on four-line guides. 8.5 x 11. Made free with Trace Press.",
  },
  pictureWords: {
    file: "picture-word-tracing-worksheets.pdf",
    title: "Word Tracing Worksheets with Pictures: 20 First Words (Free PDF)",
    subject: "20 printable first-word tracing worksheets: cat, dog, sun, fish, ball, apple and more, each with a picture to colour, numbered start dots, stroke-order arrows and dotted rows to trace on four-line guides. 8.5 x 11. Made free with Trace Press.",
  },
  transportation: {
    file: "transportation-tracing-worksheets.pdf",
    title: "Free Transportation Tracing Worksheets: 20 Vehicle Words (PDF)",
    subject: "20 printable transportation word tracing worksheets: car, bus, train, tractor, firetruck, helicopter and more, each with a picture to colour, numbered start dots, stroke-order arrows and dotted rows to trace on four-line guides. 8.5 x 11. Made free with Trace Press.",
  },
  animals: {
    file: "animal-tracing-worksheets.pdf",
    title: "Free Animal Tracing Worksheets: 20 Animal Words to Trace (PDF)",
    subject: "20 printable animal word tracing worksheets: cat, dog, fish, rabbit, turtle, butterfly and more, each with a picture to colour, numbered start dots, stroke-order arrows and dotted rows to trace on four-line guides. 8.5 x 11. Made free with Trace Press.",
  },
  food: {
    file: "food-tracing-worksheets.pdf",
    title: "Free Food Tracing Worksheets: 20 Food Words to Trace (PDF)",
    subject: "20 printable food word tracing worksheets: egg, apple, pizza, banana, carrot, broccoli and more, each with a picture to colour, numbered start dots, stroke-order arrows and dotted rows to trace on four-line guides. 8.5 x 11. Made free with Trace Press.",
  },
  colors: {
    file: "color-words-tracing-worksheets.pdf",
    title: "Free Color Words Tracing Worksheets: 11 Colors (PDF)",
    subject: "11 printable color word tracing worksheets: red, orange, yellow, green, blue, purple, pink, brown, black, white and gray, each with numbered start dots, stroke-order arrows and dotted rows to trace on four-line guides. 8.5 x 11. Made free with Trace Press.",
  },
  numberWords: {
    file: "number-words-tracing-worksheets.pdf",
    title: "Free Number Words Tracing Worksheets: One to Twenty (PDF)",
    subject: "20 printable number word tracing worksheets: one to twenty spelled out, each with numbered start dots, stroke-order arrows and dotted rows to trace on four-line guides. 8.5 x 11. Made free with Trace Press.",
  },
  days: {
    file: "days-of-the-week-tracing-worksheets.pdf",
    title: "Free Days of the Week and Months Tracing Worksheets (PDF)",
    subject: "19 printable tracing worksheets: the seven days of the week, Sunday to Saturday, and the twelve months, January to December, each with a capital first letter, numbered start dots, stroke-order arrows and dotted rows to trace on four-line guides. 8.5 x 11. Made free with Trace Press.",
  },
  christmas: {
    file: "christmas-tracing-worksheets.pdf",
    title: "Free Christmas Tracing Worksheets: 20 Words to Trace (PDF)",
    subject: "20 printable Christmas word tracing worksheets: star, bell, snowman, reindeer, gingerbread and more, each with a picture to colour, numbered start dots, stroke-order arrows and dotted rows to trace on four-line guides. 8.5 x 11. Made free with Trace Press.",
  },
  cursiveBook: {
    file: "cursive-handwriting-workbook-sample-8.5x11.pdf",
    title: "Free Cursive Handwriting Workbook PDF, A–Z, 0–9, Words · Trace Press",
    subject: "A 76-page cursive handwriting workbook: A to Z, 0 to 9 and the 40 Dolch pre-primer sight words in joined cursive, solid once, then grey rows to trace on four-line guides. 8.5 x 11, laid out to Amazon KDP's rules. Made free with Trace Press.",
  },
  cursive: {
    file: "cursive-letter-tracing-worksheets.pdf",
    title: "Free Cursive Letter Tracing Worksheets A–Z, PDF · Trace Press",
    subject: "26 printable cursive alphabet tracing pages, A to Z: the capital and lowercase letter in solid cursive, rows of grey cursive letters to trace on four-line handwriting guides, then rows to write alone. 8.5 x 11. Made free with Trace Press.",
  },
};

// "This book belongs to" pages, one PDF per KDP trim, for /this-book-belongs-to-page.
// Free and unmarked, like the handwriting paper: a seller drops the page into
// their own interior, so a footer would make it useless. The brand is in the
// file's metadata only.
export const BELONGS_FILE = (trim) => `this-book-belongs-to-page-${trim}.pdf`;
const belongsSample = (trim) => ({
  file: BELONGS_FILE(trim),
  title: `Free This Book Belongs To Page, ${trim} PDF for KDP · Trace Press`,
  subject: `A printable "This book belongs to" page for a children's book, with a large handwriting line for the child's name. ${trim} inches, inside Amazon KDP's margins, no bleed, no marks. Made free with Trace Press.`,
});

// The pre-primer list, read from the button on /sight-word-tracing-workbook
// rather than typed out a second time, so the sample and the page that links
// it cannot disagree.
const sightPage = readFileSync(new URL("../public/sight-word-tracing-workbook.html", import.meta.url), "utf8");
export const PRE_PRIMER = decodeURIComponent(sightPage.match(/href="\/\?words=([^"#]+)#tool">Open Trace Press with the 40 pre-primer words/)[1]).split(",");
if (PRE_PRIMER.length !== 40) throw new Error(`pre-primer list has ${PRE_PRIMER.length} words, expected 40`);
const KEYWORDS = ["letter tracing", "handwriting workbook", "alphabet tracing", "KDP", "printable", "PDF", "Trace Press"];

function link(doc, page, rect, uri = SITE) {
  const annot = doc.context.obj({ Type: "Annot", Subtype: "Link", Rect: rect, Border: [0, 0, 0], A: { Type: "Action", S: "URI", URI: PDFString.of(uri) } });
  const ref = doc.context.register(annot);
  const existing = page.node.lookup(PDFName.of("Annots"));
  if (existing) existing.push(ref);
  else page.node.set(PDFName.of("Annots"), doc.context.obj([ref]));
}

function meta(doc, { title, subject }) {
  if (title.length > 70) throw new Error(`title is ${title.length} characters: ${title}`);
  doc.setTitle(title);
  doc.setSubject(subject);
  doc.setKeywords(KEYWORDS);
  doc.setAuthor("Trace Press");
  doc.setCreator(`Trace Press — ${SITE}`);
  doc.setProducer(`Trace Press — ${SITE}`);
}

// A book, with a link on every footer and a closing page that is one link.
// `from` keeps only the pages from that index on (the number worksheets are
// the digit pages of a book with numbers on, without A–Z in front), and `to`
// stops before that index (the line worksheets are the four pages before A).
async function book(sample, { words = [], numbers = false, lines = false, shapes = false, cases = "both", guideIn = GUIDE_IN, from = 0, to, script = "print", abc = false, game } = {}) {
  const opts = { trim: TRIM, guideIn, words, numbers, lines, shapes, cases, script, measure, abc };
  let doc = await PDFDocument.load(await renderBook(opts, fonts));
  if (from || to) {
    const whole = doc;
    doc = await PDFDocument.create();
    for (const p of await doc.copyPages(whole, whole.getPageIndices().slice(from, to))) doc.addPage(p);
  }
  doc.registerFontkit(fontkit);
  meta(doc, sample);
  const regular = await doc.embedFont(fonts.regular, { subset: true });
  const bold = await doc.embedFont(fonts.bold, { subset: true });
  const { geom } = planBook(opts);
  const pages = planBook(opts).pages.slice(from, to);
  pages.forEach((layout, i) => {
    const f = pageInk(layout, { cursive: cursiveFont }).find((s) => s.kind === "text" && /Trace Press/.test(s.text));
    if (!f) throw new Error(`page ${i + 1}: no footer line to link`);
    const half = regular.widthOfTextAtSize(f.text, f.size) / 2 + 4;
    link(doc, doc.getPage(i), [f.x - half, f.y - 4, f.x + half, f.y + f.size + 2]);
  });
  const w = geom.width, h = geom.height, cx = w / 2;
  const page = doc.addPage([w, h]);
  const line = (t, font, size, y, color) => page.drawText(t, { x: cx - font.widthOfTextAtSize(t, size) / 2, y, size, font, color });
  if (game) {
    // A holiday set is printed for a class, so its last page is the free
    // matching game with the same 20 words, not the KDP workbook.
    line("Made with Trace Press", bold, 24, h / 2 + 60, rgb(0.1, 0.1, 0.1));
    line(`Play the same 20 ${game} words as a free matching game:`, regular, 13, h / 2 + 26, rgb(0.35, 0.35, 0.35));
    line("word to picture, on a phone, a tablet or the class board.", regular, 13, h / 2 + 8, rgb(0.35, 0.35, 0.35));
    line("tracepress.bananafest-destiny.com/sight-word-matching-game", bold, 14, h / 2 - 22, rgb(0.137, 0.306, 0.227));
    line("Tap anywhere on this page to play.", regular, 11, h / 2 - 50, rgb(0.5, 0.5, 0.5));
    link(doc, page, [0, 0, w, h], `${SITE}sight-word-matching-game?set=${game.toLowerCase()}`);
  } else {
    line("Made with Trace Press", bold, 24, h / 2 + 60, rgb(0.1, 0.1, 0.1));
    line("Make your own A–Z tracing workbook and its cover for Amazon KDP,", regular, 13, h / 2 + 26, rgb(0.35, 0.35, 0.35));
    line("in your browser. Free to try.", regular, 13, h / 2 + 8, rgb(0.35, 0.35, 0.35));
    line("tracepress.bananafest-destiny.com", bold, 16, h / 2 - 22, rgb(0.137, 0.306, 0.227));
    line("Tap anywhere on this page to make your own.", regular, 11, h / 2 - 50, rgb(0.5, 0.5, 0.5));
    link(doc, page, [0, 0, w, h]);
  }
  const bytes = await doc.save();
  writeFileSync(new URL(sample.file, out), bytes);
  console.log(`wrote public/samples/${sample.file}: ${pages.length} book pages + 1, ${bytes.length} bytes`);
}
await book(SAMPLES.book);
await book(SAMPLES.sightWords, { words: PRE_PRIMER });
await book(SAMPLES.numbers, { numbers: true, guideIn: 1, from: 26 });
await book(SAMPLES.lines, { lines: true, guideIn: 1, to: 4 });
await book(SAMPLES.shapes, { shapes: true, guideIn: 1, to: 6 });
await book(SAMPLES.upper, { cases: "upper", guideIn: 1 });
await book(SAMPLES.abc, { abc: true, guideIn: 1 });
await book(SAMPLES.counting, { numbers: true, abc: true, guideIn: 1, from: 26 });
await book(SAMPLES.lower, { cases: "lower", guideIn: 1 });
await book(SAMPLES.cursive, { script: "cursive", guideIn: 1 });
await book(SAMPLES.cursiveAdult, { script: "cursive", guideIn: 0.45 });
await book(SAMPLES.printAdult, { guideIn: 0.45, numbers: true });
await book(SAMPLES.preschool, { guideIn: 1, lines: true, shapes: true, cases: "upper", numbers: true });
// Holiday words are read from the button on each holiday page, like PRE_PRIMER.
const holidayWords = (slug, label, count = 20) => {
  const page = readFileSync(new URL(`../public/${slug}-tracing-worksheets.html`, import.meta.url), "utf8");
  const words = decodeURIComponent(page.match(new RegExp(`href="/\\?words=([^"#]+)(?:#[^"]*)?">Make an? ${label} tracing book`))[1]).split(",");
  if (words.length !== count) throw new Error(`${slug} list has ${words.length} words, expected ${count}`);
  return words;
};
await book(SAMPLES.halloween, { words: holidayWords("halloween", "Halloween"), from: 26 });
await book(SAMPLES.thanksgiving, { words: holidayWords("thanksgiving", "Thanksgiving"), from: 26, game: "Thanksgiving" });
await book(SAMPLES.christmas, { words: holidayWords("christmas", "Christmas"), from: 26, game: "Christmas" });
await book(SAMPLES.pictureWords, { words: holidayWords("picture-word", "picture word"), from: 26 });
await book(SAMPLES.transportation, { words: holidayWords("transportation", "transportation"), from: 26 });
await book(SAMPLES.animals, { words: holidayWords("animal", "animal"), from: 26 });
await book(SAMPLES.food, { words: holidayWords("food", "food"), from: 26 });
await book(SAMPLES.days, { words: holidayWords("days-of-the-week", "days and months", 19), from: 26 });
await book(SAMPLES.colors, { words: holidayWords("color-words", "color words", 11), from: 26 });
await book(SAMPLES.numberWords, { words: holidayWords("number-words", "number words", 20), from: 26 });
await book(SAMPLES.cursiveBook, { script: "cursive", numbers: true, words: PRE_PRIMER });

// The cover, sized for that book. The whole sheet is the link (2026-10-05).
// It used to be only the free cover's back-panel note, a 3 x 0.75 inch box at
// the barcode margin, on a sheet a phone shows whole at a fraction of its
// size; on Puzzle Press, phones that opened a sample cover that day never
// reached the site. Nobody writes on a cover, so a stray tap costs nothing.
// The worksheet pages keep their footer-line links, so a tap made while
// tracing on a tablet does not open a browser.
{
  const pageCount = planBook({ trim: TRIM, guideIn: GUIDE_IN }).pages.length;
  const opts = { title: "My First Letter Tracing Book", subtitle: "Trace A to Z with stroke arrows and numbered start dots", author: "Trace Press", trim: TRIM, pageCount, paper: "white" };
  const doc = await PDFDocument.load(await renderCover(opts, fonts));
  meta(doc, SAMPLES.cover);
  const { width, height } = doc.getPage(0).getSize();
  link(doc, doc.getPage(0), [0, 0, width, height]);
  const bytes = await doc.save();
  writeFileSync(new URL(SAMPLES.cover.file, out), bytes);
  console.log(`wrote public/samples/${SAMPLES.cover.file}: ${bytes.length} bytes`);
}

for (const trim of Object.keys(TRIMS)) {
  const sample = belongsSample(trim);
  const { geom, pages } = planBook({ trim, guideIn: 1, belongs: true });
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  meta(doc, sample);
  const embedded = { bold: await doc.embedFont(fonts.bold, { subset: true }), regular: await doc.embedFont(fonts.regular, { subset: true }) };
  drawLetterPage(doc.addPage([geom.width, geom.height]), pages[0], embedded, { licensed: true });
  const bytes = await doc.save();
  writeFileSync(new URL(sample.file, out), bytes);
  console.log(`wrote public/samples/${sample.file}: ${bytes.length} bytes`);
}

// An example name sheet, for the picture on /name-tracing (previews.mjs).
// Exactly what the page makes for "Maya" at its default settings.
{
  const sample = {
    file: "name-tracing-worksheet-maya.pdf",
    title: "Free Name Tracing Worksheet, Example for Maya (PDF) · Trace Press",
    subject: "A one-page name tracing worksheet: the name large with numbered start dots and stroke-order arrows, rows of the name in dotted letters to trace, then blank four-line guides. 8.5 x 11. Make one for any name, free, with Trace Press.",
  };
  const doc = await PDFDocument.load(await renderName({ name: "Maya", trim: TRIM, guideIn: GUIDE_IN }, fonts));
  meta(doc, sample);
  const bytes = await doc.save();
  writeFileSync(new URL(sample.file, out), bytes);
  console.log(`wrote public/samples/${sample.file}: ${bytes.length} bytes`);
}

// The same in cursive, for /cursive-name-tracing.
{
  const sample = {
    file: "cursive-name-tracing-worksheet-maya.pdf",
    title: "Free Cursive Name Tracing Worksheet, Example for Maya (PDF)",
    subject: "A one-page cursive name tracing worksheet: the name in solid joined cursive, rows of it in light grey to trace over on four-line handwriting guides, then blank lines. 8.5 x 11. Make one for any name, free, with Trace Press.",
  };
  const doc = await PDFDocument.load(await renderName({ name: "Maya", trim: TRIM, guideIn: GUIDE_IN, script: "cursive" }, fonts));
  meta(doc, sample);
  const bytes = await doc.save();
  writeFileSync(new URL(sample.file, out), bytes);
  console.log(`wrote public/samples/${sample.file}: ${bytes.length} bytes`);
}

// The same for /tracing-worksheet-generator, at its default words.
{
  const sample = {
    file: "tracing-worksheet-cat-sun-dog.pdf",
    title: "Free Tracing Worksheet with Lines and Arrows, cat sun dog (PDF)",
    subject: "A one-page word tracing worksheet: the words large with numbered start dots and stroke-order arrows, rows of dotted letters to trace on four-line handwriting guides, then blank lines. 8.5 x 11. Make one for any words, free, with Trace Press.",
  };
  const doc = await PDFDocument.load(await renderName({ name: "cat sun dog", trim: TRIM, guideIn: GUIDE_IN }, fonts));
  meta(doc, sample);
  const bytes = await doc.save();
  writeFileSync(new URL(sample.file, out), bytes);
  console.log(`wrote public/samples/${sample.file}: ${bytes.length} bytes`);
}

// The cursive alphabet chart, for /cursive-alphabet-chart: one page, A–Z and
// 0–9, with the free footer line as a link.
{
  const sample = {
    file: "cursive-alphabet-chart.pdf",
    title: "Free Printable Cursive Alphabet Chart, A–Z and 0–9 (PDF)",
    subject: "A one-page cursive alphabet chart: every capital and lowercase letter, A to Z, and the numbers 0 to 9 in traditional American cursive on four-line handwriting guides. 8.5 x 11. Free from Trace Press.",
  };
  const { geom } = planBook({ trim: TRIM, guideIn: GUIDE_IN });
  const layout = cursiveChart({ geom, measure });
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  meta(doc, sample);
  const embedded = { bold: await doc.embedFont(fonts.bold, { subset: true }), regular: await doc.embedFont(fonts.regular, { subset: true }) };
  const page = doc.addPage([geom.width, geom.height]);
  drawLetterPage(page, layout, embedded, { cursive: cursiveFont });
  const f = pageInk(layout, { cursive: cursiveFont }).find((s) => s.kind === "text" && /Trace Press/.test(s.text));
  const half = embedded.regular.widthOfTextAtSize(f.text, f.size) / 2 + 4;
  link(doc, page, [f.x - half, f.y - 4, f.x + half, f.y + f.size + 2]);
  const bytes = await doc.save();
  writeFileSync(new URL(sample.file, out), bytes);
  console.log(`wrote public/samples/${sample.file}: ${bytes.length} bytes`);
}

// The print alphabet chart, for /alphabet-chart: the same page in the print
// letters of the tracing pages, solid, with the free footer line as a link.
{
  const sample = {
    file: "alphabet-chart.pdf",
    title: "Free Printable Alphabet Chart, A–Z and 0–9 (PDF)",
    subject: "A one-page print alphabet chart: every capital and lowercase letter, A to Z, and the numbers 0 to 9 in solid print letters on four-line handwriting guides. 8.5 x 11. Free from Trace Press.",
  };
  const { geom } = planBook({ trim: TRIM, guideIn: GUIDE_IN });
  const layout = printChart({ geom });
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  meta(doc, sample);
  const embedded = { bold: await doc.embedFont(fonts.bold, { subset: true }), regular: await doc.embedFont(fonts.regular, { subset: true }) };
  const page = doc.addPage([geom.width, geom.height]);
  drawLetterPage(page, layout, embedded);
  const f = pageInk(layout).find((s) => s.kind === "text" && /Trace Press/.test(s.text));
  const half = embedded.regular.widthOfTextAtSize(f.text, f.size) / 2 + 4;
  link(doc, page, [f.x - half, f.y - 4, f.x + half, f.y + f.size + 2]);
  const bytes = await doc.save();
  writeFileSync(new URL(sample.file, out), bytes);
  console.log(`wrote public/samples/${sample.file}: ${bytes.length} bytes`);
}

// The kindergarten sheets, for /cvc-worksheets, /count-and-trace-worksheets
// and /sight-word-flash-cards: exactly what each page downloads at its
// defaults (US Letter, 0.75" lines, the pre-primer cards four to a sheet),
// with the free footer line on every page as a link. Those pages make the
// PDF in the browser, so until these existed the sitemap had no file for
// them, and Bing reads the sample PDFs far more than the pages (2026-10-27).
async function sheets(sample, render, plans, ink) {
  const doc = await PDFDocument.load(await render());
  doc.registerFontkit(fontkit);
  meta(doc, sample);
  const regular = await doc.embedFont(fonts.regular, { subset: true });
  plans.forEach((page, i) => {
    const f = ink(page).find((s) => s.kind === "text" && /tracepress/.test(s.text));
    if (!f) throw new Error(`${sample.file} page ${i + 1}: no footer line to link`);
    const half = regular.widthOfTextAtSize(f.text, f.size) / 2 + 4;
    link(doc, doc.getPage(i), [f.x - half, f.y - 4, f.x + half, f.y + f.size + 2]);
  });
  if (doc.getPageCount() !== plans.length) throw new Error(`${sample.file}: ${doc.getPageCount()} pages, planned ${plans.length}`);
  const bytes = await doc.save();
  writeFileSync(new URL(sample.file, out), bytes);
  console.log(`wrote public/samples/${sample.file}: ${plans.length} pages, ${bytes.length} bytes`);
}
{
  const opts = { kind: "cvc", guideIn: 0.75, paper: "letter" };
  await sheets({
    file: "cvc-word-worksheets.pdf",
    title: "Free CVC Word Worksheets with Pictures, Printable PDF · Trace Press",
    subject: "Three printable CVC word worksheets, 15 short-vowel words five to a page (bat, cat, bed, pig, dog, bug, sun and more): a picture to say, three boxes for the sounds, then the word in dots to trace on four-line guides. US Letter. Free from Trace Press.",
  }, () => renderSheets(opts, fonts), planCvc(opts).pages, (p) => sheetInk(p));
}
{
  const opts = { kind: "count", guideIn: 0.75, paper: "letter" };
  await sheets({
    file: "count-and-trace-worksheets-1-10.pdf",
    title: "Free Count and Trace Worksheets 1–10, Ten Frames (PDF) · Trace Press",
    subject: "Two printable counting worksheets, 1 to 10, five to a page: a ten frame with that many dots to count, then the number in dots to trace on four-line guides, with a numbered start dot and arrows on the first copy. US Letter. Free from Trace Press.",
  }, () => renderSheets(opts, fonts), planCount(opts).pages, (p) => sheetInk(p));
}
{
  const opts = { sheet: "letter-3x5", words: LISTS["pre-primer"].words, trace: false, tag: LISTS["pre-primer"].label };
  const plan = planCards(opts);
  await sheets({
    file: "sight-word-flash-cards-pre-primer-3x5.pdf",
    title: "Free Dolch Pre-Primer Sight Word Flash Cards, 3x5 (PDF) · Trace Press",
    subject: "The 40 Dolch pre-primer sight words as printable flash cards, one word to a card in large school print letters, four 3 x 5 inch cards to a US Letter sheet with dashed lines to cut along. 10 sheets. Free from Trace Press.",
  }, () => renderCards(opts, fonts), plan.pages, (p) => cardsInk(plan, p));
}
// The matching games: each word twice, 2.5" cards twelve to a sheet, each
// sheet followed by its set's coloured back. Fronts carry the footer link;
// backs are plain colour, so a face-down card gives nothing away.
async function matching(sample, keys) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  meta(doc, sample);
  const regular = await doc.embedFont(fonts.regular, { subset: true });
  for (const key of keys) {
    const pictures = key === "pictures";
    const l = pictures ? PICTURE_SET : LISTS[key];
    const opts = { sheet: "letter-game", words: l.words, trace: false, tag: l.label, pairs: true, back: l.back, pictures };
    const plan = planCards(opts);
    const src = await PDFDocument.load(await renderCards(opts, fonts));
    for (const [i, p] of (await doc.copyPages(src, src.getPageIndices())).entries()) {
      doc.addPage(p);
      if (plan.pages[i].back) continue;
      const f = cardsInk(plan, plan.pages[i]).find((x) => x.kind === "text" && /tracepress/.test(x.text));
      if (!f) throw new Error(`${sample.file} ${key} page ${i + 1}: no footer line to link`);
      const half = regular.widthOfTextAtSize(f.text, f.size) / 2 + 4;
      link(doc, p, [f.x - half, f.y - 4, f.x + half, f.y + f.size + 2]);
    }
  }
  const bytes = await doc.save();
  writeFileSync(new URL(sample.file, out), bytes);
  console.log(`wrote public/samples/${sample.file}: ${doc.getPageCount()} pages, ${bytes.length} bytes`);
}
// Every short vowel set: ten sheets, twenty pages.
await matching({
  file: "short-vowel-matching-cards.pdf",
  title: "Free Short Vowel Matching Cards, CVC Memory Game (PDF) · Trace Press",
  subject: "A short vowel matching game: short a, e, i, o and u, twelve CVC words each (cat, bed, pig, dog, bug and more), every word on two 2.5 inch cards, twelve cards to a US Letter sheet. Each sheet is followed by a coloured back for double-sided printing. Free from Trace Press.",
}, ["short-a", "short-e", "short-i", "short-o", "short-u"]);
// The 40 pre-primer words, six pairs a sheet: seven sheets, fourteen pages.
// A teacher's own sight word sets were games of this shape (2026-10-28).
await matching({
  file: "sight-word-matching-game-pre-primer.pdf",
  title: "Free Sight Word Matching Game, Dolch Pre-Primer (PDF) · Trace Press",
  subject: "A sight word matching game: the 40 Dolch pre-primer words (a, and, the, see, said and more), every word on two 2.5 inch cards, twelve cards to a US Letter sheet. Each sheet is followed by a coloured back for double-sided printing. Free from Trace Press.",
}, ["pre-primer"]);
// Word and picture: each word's pair is its picture. 29 words, five sheets.
await matching({
  file: "word-picture-matching-cards.pdf",
  title: "Free Word and Picture Matching Cards, CVC (PDF) · Trace Press",
  subject: "A word to picture matching game: 29 short vowel words (cat, bed, pig, dog, sun and more), each on one 2.5 inch card with its outline picture on another, twelve cards to a US Letter sheet. Each sheet is followed by a coloured back for double-sided printing. Free from Trace Press.",
}, ["pictures"]);

// The Etsy-only packs: one print-ready PDF each, bigger than any free PDF on
// the site, and clean (licensed: no footer line, no link). Sold as a digital
// download, so nothing in the file sends a buyer off Etsy: no web address.
//
//   node scripts/etsy-pack.mjs  → ../etsy/<pack>.pdf (git-ignored: a paid file
//   must not sit in the public repo or on the site)
import { mkdirSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { renderBook, renderCards } from "../src/pdf/book.js";
import { drawShapes } from "../src/pdf/draw.js";
import { pictureFor } from "../src/pdf/pictures.js";
import { PT } from "../src/pdf/kdp.js";

const fonts = {
  bold: readFileSync(new URL("../fonts/LiberationSans-Bold.ttf", import.meta.url)),
  regular: readFileSync(new URL("../fonts/LiberationSans-Regular.ttf", import.meta.url)),
};
const out = new URL("../../etsy/", import.meta.url);
mkdirSync(out, { recursive: true });

// The 20 words of /thanksgiving-tracing-worksheets, in the same order.
const THANKSGIVING = "mug cake bowl home bread wheat maple glass apple acorn carrot cherry candle teapot pepper cookie feather pumpkin seedling mushroom".split(" ");
const ORANGE = [0.8, 0.4, 0.1];
// The 20 words of /christmas-tracing-worksheets, in the same order as its sample.
const CHRISTMAS = "mug ball star gift bell sock home book candy train robot cookie candle sleigh snowman reindeer ornament lollipop snowflake gingerbread".split(" ");
const RED = [0.75, 0.12, 0.12];

async function pack({ file, title, words, back, sections, cover }) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(title);
  doc.setAuthor("Trace Press");
  doc.setCreator("Trace Press");
  doc.setProducer("Trace Press");
  const bold = await doc.embedFont(fonts.bold, { subset: true });
  const regular = await doc.embedFont(fonts.regular, { subset: true });

  // Page 1: what is in the pack and how to print it.
  const W = 8.5 * PT, H = 11 * PT, cx = W / 2;
  const p = doc.addPage([W, H]);
  const ink = rgb(0.1, 0.1, 0.1), soft = rgb(0.35, 0.35, 0.35), accent = rgb(...(cover.color || ORANGE));
  const centre = (t, font, size, y, color = ink) => p.drawText(t, { x: cx - font.widthOfTextAtSize(t, size) / 2, y, size, font, color });
  centre(cover.title, bold, 30, H - 110, accent);
  centre(cover.sub, regular, 15, H - 140, soft);
  // A row of the pack's own pictures, as drawn on its pages.
  const pics = cover.pictures, size = 64, gap = 22;
  const rowW = pics.length * size + (pics.length - 1) * gap;
  drawShapes(p, pics.map((w, i) => ({ kind: "outline", paths: pictureFor(w), x: cx - rowW / 2 + i * (size + gap), y: H - 180, scale: size / 24, width: 2.2, color: [0.2, 0.2, 0.2] })), { bold, regular });
  let y = H - 310;
  centre("What is inside", bold, 18, y);
  y -= 34;
  let page = 2;
  for (const s of sections) {
    const range = s.pages === 1 ? `page ${page}` : `pages ${page}–${page + s.pages - 1}`;
    p.drawText(s.name, { x: 90, y, size: 14, font: bold, color: ink });
    p.drawText(range, { x: W - 90 - regular.widthOfTextAtSize(range, 12), y, size: 12, font: regular, color: soft });
    y -= 19;
    for (const line of s.about) { p.drawText(line, { x: 90, y, size: 11.5, font: regular, color: soft }); y -= 16; }
    y -= 14;
    page += s.pages;
  }
  y -= 6;
  centre("How to print", bold, 18, y);
  y -= 30;
  for (const line of cover.print) { p.drawText("•  " + line, { x: 90, y, size: 11.5, font: regular, color: soft }); y -= 18; }
  centre(cover.licence, regular, 10, 60, soft);

  for (const s of sections) {
    const src = await PDFDocument.load(await s.render());
    const n = src.getPageCount();
    if (n !== s.pages) throw new Error(`${s.name}: ${n} pages, expected ${s.pages}`);
    for (const pg of await doc.copyPages(src, src.getPageIndices())) doc.addPage(pg);
  }
  const bytes = await doc.save();
  writeFileSync(new URL(file, out), bytes);
  console.log(`wrote etsy/${file}: ${doc.getPageCount()} pages, ${(bytes.length / 1024 / 1024).toFixed(1)} MB`);
}

// Matching cards, six pairs to a sheet. 20 words do not split into sixes, so
// the fourth game is the last six words: every sheet is a full game of 12.
function holiday({ slug, label, words, back, backName, pictures, first, last }) {
  const games = [0, 6, 12, 14].map((i) => words.slice(i, i + 6));
  return pack({
    file: `${slug}-tracing-and-matching-pack.pdf`,
    title: `${label} Tracing and Matching Pack`,
    sections: [
      {
        name: "20 tracing worksheets", pages: 20,
        about: [`One ${label} word a page, from ${first} to ${last}: a picture to colour,`, "numbered start dots, stroke arrows, then dotted rows to trace."],
        render: async () => {
          const whole = await PDFDocument.load(await renderBook({ trim: "8.5x11", guideIn: 0.75, words, licensed: true }, fonts));
          const doc = await PDFDocument.create();
          for (const pg of await doc.copyPages(whole, whole.getPageIndices().slice(26))) doc.addPage(pg);
          return doc.save();
        },
      },
      {
        name: "20 picture flash cards", pages: 5,
        about: ["Each word under its picture on a 3 x 5 inch card,", "four to a sheet, with lines to cut along."],
        render: () => renderCards({ sheet: "letter-3x5", words, pictures: true, tag: label, licensed: true }, fonts),
      },
      {
        name: "4 word-to-picture matching games", pages: 8,
        about: ["Twelve 2.5 inch cards a sheet: six words and their six pictures.", `Each sheet is followed by ${backName} back for double-sided printing.`],
        render: async () => {
          const doc = await PDFDocument.create();
          for (const g of games) {
            const src = await PDFDocument.load(await renderCards({ sheet: "letter-game", words: g, pairs: true, pictures: true, back, tag: label, licensed: true }, fonts));
            for (const pg of await doc.copyPages(src, src.getPageIndices())) doc.addPage(pg);
          }
          return doc.save();
        },
      },
    ],
    cover: {
      title: `${label} Tracing and Matching`,
      sub: "20 words to trace, read and match · 34 pages · US Letter",
      color: back,
      pictures,
      print: [
        "Print at 100% (Actual size), not Fit to page, so the cards measure true.",
        "Matching games: print each sheet and the page after it double-sided,",
        `    flipping on the long edge, so every card has ${backName} back.`,
        "Or print the fronts only, on card stock, and play face down.",
      ],
      licence: "For use in your own home or classroom. Please do not resell or share the file.",
    },
  });
}

const only = process.argv[2];
if (!only || only === "thanksgiving") await holiday({ slug: "thanksgiving", label: "Thanksgiving", words: THANKSGIVING, back: ORANGE, backName: "an orange", pictures: ["pumpkin", "acorn", "apple", "feather", "teapot"], first: "mug", last: "mushroom" });
if (!only || only === "christmas") await holiday({ slug: "christmas", label: "Christmas", words: CHRISTMAS, back: RED, backName: "a red", pictures: ["star", "gift", "bell", "snowman", "reindeer"], first: "mug", last: "gingerbread" });

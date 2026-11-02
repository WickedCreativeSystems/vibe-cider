// Put the six free interiors from scripts/gumroad.mjs on Gumroad as $0+
// products. Endpoints read from Gumroad's open source (antiwork/gumroad,
// config/routes.rb and app/controllers/api/v2/, 2026-11-02):
//   POST /v2/files/presign → PUT parts to S3 → POST /v2/files/complete → file_url
//   POST /v2/direct_uploads (blob) → PUT → signed_id → POST /v2/products/:id/covers
//   POST /v2/products {name, description, price, customizable_price, tags, files}
//
// Token: GUMROAD_TOKEN in the git-ignored .git-credentials (Settings →
// Advanced → application → Generate access token; default scopes include
// edit_products). Never printed.
//
// Dry run by default. `node scripts/gumroad-publish.mjs --go` creates them.
// Create once only: a second --go makes duplicates. Products already made
// are listed first with GET /v2/products, and any name that exists is skipped.
import { readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";

const GO = process.argv.includes("--go");
const DIR = new URL("../../forboss/files/gumroad/", import.meta.url);
const API = "https://api.gumroad.com/v2";
const SITE = "https://puzzlepress.bananafest-destiny.com";
const TAGS = ["kdp", "kdp interior", "low content book", "puzzle book", "amazon kdp"];

const note = (head, ref, path = "/") =>
  `${head} Publish it, sell it, change it: no royalty and no credit needed. Fonts are embedded and margins are set for the page count.\n\n` +
  `Want your own words, title or puzzle count, and a matching cover with the spine sized for you? Made with Puzzle Press, free in your browser: ${SITE}${path}?ref=${ref}`;

const LISTINGS = [
  ["word-search-100-6x9", "Free KDP Word Search Interior: 100 Puzzles, 6x9, with Solutions", "word search", "gumroad_ws", "/",
    "A complete, ready-to-upload word search book interior for Amazon KDP: 100 puzzles of 16 garden and kitchen words each, solutions at the back, 124 pages, 6x9 inches."],
  ["large-print-word-search-100-8.5x11", "Free Large Print Word Search KDP Interior: 100 Puzzles, 8.5x11", "large print", "gumroad_lp", "/large-print-word-search-generator",
    "100 large print word search puzzles on garden and bird words, for older readers. Big letters on 8.5x11 pages, solutions at the back, 208 pages, ready to upload to Amazon KDP."],
  ["sudoku-100-6x9", "Free Sudoku KDP Interior: 100 Puzzles, Easy to Expert, 6x9", "sudoku", "gumroad_sudoku", "/sudoku-book-generator",
    "100 sudoku puzzles graded from easy to expert, every one with a single solution, solutions at the back. 124 pages, 6x9 inches, ready to upload to Amazon KDP."],
  ["mazes-100-6x9", "Free Maze Book KDP Interior: 100 Mazes, Easy to Expert, 6x9", "maze book", "gumroad_maze", "/maze-book-generator",
    "100 mazes from easy to expert, with the solved path for each at the back. 124 pages, 6x9 inches, ready to upload to Amazon KDP."],
  ["criss-cross-50-6x9", "Free Criss-Cross (Fill-In) Puzzle KDP Interior: 50 Halloween Puzzles, 6x9", "fill in puzzles", "gumroad_cc", "/criss-cross-book-generator",
    "50 Halloween criss-cross (fill-in) puzzles from easy to expert, with solutions. 66 pages, 6x9 inches, ready to upload to Amazon KDP."],
  ["crosswords-50-6x9", "Free Crossword KDP Interior: 50 Garden Crosswords, 6x9", "crossword", "gumroad_xw", "/crossword-book-generator",
    "50 themed garden crosswords with written clues, easy to expert, solutions at the back. 66 pages, 6x9 inches, ready to upload to Amazon KDP."],
];

const token = (() => {
  try {
    const line = readFileSync(new URL("../../.git-credentials", import.meta.url), "utf8").split("\n").find((l) => l.startsWith("GUMROAD_TOKEN="));
    return line ? line.slice("GUMROAD_TOKEN=".length).trim() : "";
  } catch { return ""; }
})();

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) throw new Error(`${method} ${path}: ${res.status} ${json.message || ""}`);
  return json;
}

async function uploadFile(name, type) {
  const bytes = readFileSync(new URL(name, DIR));
  const p = await api("POST", "/files/presign", { filename: name, file_size: bytes.length });
  const size = Math.ceil(bytes.length / p.parts.length);
  const parts = [];
  for (const part of p.parts) {
    const i = part.part_number - 1;
    const r = await fetch(part.presigned_url, { method: "PUT", body: bytes.subarray(i * size, (i + 1) * size) });
    if (!r.ok) throw new Error(`S3 part ${part.part_number}: ${r.status}`);
    parts.push({ part_number: part.part_number, etag: r.headers.get("etag") });
  }
  const done = await api("POST", "/files/complete", { upload_id: p.upload_id, key: p.key, parts });
  return { url: done.file_url, display_name: name.replace(/\.[^.]+$/, ""), extension: name.split(".").pop().toUpperCase() };
}

async function uploadCover(productId, name) {
  const bytes = readFileSync(new URL(name, DIR));
  const checksum = createHash("md5").update(bytes).digest("base64");
  const b = await api("POST", "/direct_uploads", { blob: { filename: name, byte_size: bytes.length, checksum, content_type: "image/png" } });
  const r = await fetch(b.direct_upload.url, { method: "PUT", headers: b.direct_upload.headers, body: bytes });
  if (!r.ok) throw new Error(`cover upload: ${r.status}`);
  await api("POST", `/products/${productId}/covers`, { signed_blob_id: b.signed_id });
}

for (const [file] of LISTINGS) for (const f of [`${file}.pdf`, `${file}.png`, "START-HERE.txt"]) statSync(new URL(f, DIR)); // all present, or throw

if (!GO) {
  for (const [file, name, tag, ref, path, head] of LISTINGS) console.log(`${name}\n  files: ${file}.pdf, START-HERE.txt; cover ${file}.png; tags ${[...TAGS, tag].join(", ")}\n  ${note(head, ref, path).slice(-90)}\n`);
  console.log(token ? "token found — run with --go to create" : "no GUMROAD_TOKEN in .git-credentials yet");
  process.exit(0);
}
if (!token) throw new Error("no GUMROAD_TOKEN in .git-credentials");

const existing = new Set((await api("GET", "/products")).products.map((p) => p.name));
for (const [file, name, tag, ref, path, head] of LISTINGS) {
  if (existing.has(name)) { console.log("exists, skipped:", name); continue; }
  const files = [await uploadFile(`${file}.pdf`), await uploadFile("START-HERE.txt")];
  const { product } = await api("POST", "/products", {
    name, description: note(head, ref, path).replace(/\n/g, "<br>"), price: 0, customizable_price: true,
    tags: [...TAGS, tag], files,
  });
  await uploadCover(product.id, `${file}.png`);
  console.log("created:", name, product.short_url, product.published ? "published" : "NOT published yet");
}

// KDP cover geometry. Deliberately free of pdf-lib and every other heavy
// import, so pages that only need the arithmetic — the spine calculator —
// can use the same numbers as the renderer without shipping a PDF engine.
//
// From KDP's "Create a Paperback Cover" help page:
//   spine width  = page count x per-page paper thickness (nothing is added)
//   cover width  = bleed + back width + spine + front width + bleed
//   cover height = bleed + trim height + bleed
//   bleed        = 0.125" on every outside edge
//   spine text   = from 80 pages. The help page says "at least 79" and
//                  "more than 79" in different places, Cover Creator says
//                  80, and a book KDP counted at 79 pages was refused spine
//                  text in October 2026 (KDP Community), so 80.

import { PT, TRIMS } from "./kdp.js";

export const BLEED_IN = 0.125;
export const SPINE_TEXT_MIN_PAGES = 80;
// KDP's cover calculator: "Spine Safe Area" is the spine less 0.0625" at each
// fold. Our spine type is Liberation Sans Bold, whose ascender-to-descender box
// is 1.117 em; below 6pt it is not worth printing. So from 80 pages KDP allows
// spine text, but it only fits once the spine is about 0.249" — 100 pages on
// cream, 111 on white.
export const SPINE_FOLD_IN = 0.0625;
// How far inside KDP's spine safe area our spine text stays. KDP: "at least
// 0.0625" (1.6 mm) of space between the text and the edge of the spine". Laid
// out on exactly that, the descenders of a "g" or "y" measured 0.0624"-0.0634"
// from the fold at 1200 DPI (2026-09-26): on the line. The interior keeps
// SAFETY_IN (1/32") clear; on a spine every 1/64" costs about six pages of
// books that get spine text at all, so the spine keeps 1/64" — about 19 pixels
// at 1200 DPI, well clear of a pixel-exact check.
export const SPINE_SAFETY_IN = 1 / 64;
export const SPINE_TEXT_IN = SPINE_FOLD_IN + SPINE_SAFETY_IN;
export const SPINE_TYPE_MIN_PT = 6;
export const SPINE_TYPE_BOX_EM = 1.1171875;

// Not a number KDP publishes; it is the clear area their own downloadable
// cover templates reserve in the lower right of the back cover.
export const BARCODE_IN = { w: 2, h: 1.2, margin: 0.25 };

export const PAPER = {
  white: { label: "Black & white on white paper", thickness: 0.002252 },
  cream: { label: "Black & white on cream paper", thickness: 0.0025 },
  // Not on KDP's help pages. Their cover calculator returns 0.235" of spine
  // at 100 pages and 1.946" at 828 (checked 2026-09-24): 0.00235 a page.
  groundwood: { label: "Black & white on groundwood paper", thickness: 0.00235 },
  premiumColor: { label: "Premium colour", thickness: 0.002347 },
  standardColor: { label: "Standard colour", thickness: 0.002252 },
};

export function spineWidthInches(pageCount, paper = "cream") {
  const t = (PAPER[paper] ?? PAPER.cream).thickness;
  return pageCount * t;
}

// KDP's "Create a Paperback Cover" page (G201953020, re-read 2026-11-09):
// "Text should be at least 7-point font so it's large enough for customers to
// read." Spine text is allowed from 80 pages but cannot reach 7pt until the
// safe area is 7pt x SPINE_TYPE_BOX_EM tall.
export const KDP_COVER_TYPE_MIN_PT = 7;

// The largest spine type, to the half point, that fits KDP's spine safe area.
export function spineMaxPt(pageCount, paper = "cream") {
  const safe = spineWidthInches(pageCount, paper) - 2 * SPINE_FOLD_IN;
  return Math.max(0, Math.floor((safe * PT) / SPINE_TYPE_BOX_EM * 2) / 2);
}

// The fewest pages (from SPINE_TEXT_MIN_PAGES) whose spine holds type of pt.
export function pagesForSpinePt(pt, paper = "cream") {
  let n = SPINE_TEXT_MIN_PAGES;
  while (spineMaxPt(n, paper) < pt && n < 828) n++;
  return n;
}

// trim is a TRIMS key, or a custom { w, h } in inches (the spine calculator's
// "Custom size", see customTrim in kdp.js).
export function coverGeometry({ trim = "6x9", pageCount = 24, paper = "cream" }) {
  const t = typeof trim === "object" ? trim : TRIMS[trim] ?? TRIMS["6x9"];
  const spineIn = spineWidthInches(pageCount, paper);
  const widthIn = BLEED_IN + t.w + spineIn + t.w + BLEED_IN;
  const heightIn = BLEED_IN + t.h + BLEED_IN;
  return {
    width: widthIn * PT,
    height: heightIn * PT,
    spine: spineIn * PT,
    bleed: BLEED_IN * PT,
    trim: t,
    pageCount,
    paper,
    spineTextAllowed: pageCount >= SPINE_TEXT_MIN_PAGES,
    spineTextFits: pageCount >= SPINE_TEXT_MIN_PAGES &&
      (spineIn - 2 * SPINE_TEXT_IN) * PT >= SPINE_TYPE_MIN_PT * SPINE_TYPE_BOX_EM,
    backX: BLEED_IN * PT,
    spineX: (BLEED_IN + t.w) * PT,
    frontX: (BLEED_IN + t.w + spineIn) * PT,
    panelW: t.w * PT,
    panelH: t.h * PT,
    panelY: BLEED_IN * PT,
  };
}

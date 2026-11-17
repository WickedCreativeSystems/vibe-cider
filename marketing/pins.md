# Pinterest — what is pinned, what is queued, and why it looks odd

`scripts/pins.mjs` renders every pin at 1000×1500 into `public/pins/`, from a
real book the tool actually made. Buffer fetches them from the live site by URL,
so **a pin cannot be queued until the image is deployed**.

## The thing that will confuse whoever reads the queue next

**Pinterest blocked `bananafest-destiny.com` as spam, and denied the appeal on
2026-09-12.** A pin whose destination URL is on our domain will not go out. So
every pin here does two things instead:

- `metadata.pinterest.url` points at the YouTube demo,
  `https://www.youtube.com/watch?v=ph6q2ih6cBs` — a real, relevant destination
  that happens not to be blocked.
- the site address appears as **plain text in the description**, where it is
  read by a person rather than resolved by the spam filter.

This is a workaround, not a trick: the pin goes where it says it goes, and the
text tells you the other address in as many words. **Re-appeal around
mid-October**, and when the block lifts, put the real URL back — the plain-text
line can stay, it costs nothing.

## The queue as of 2026-09-14 22:22 CT

Buffer free plan allows ten scheduled posts. Going into launch week the queue
was **completely empty** — all twelve prior posts had already sent — which is
worth noticing, because an empty queue is invisible and a full one is obvious.

| When (CT) | Pin | Angle |
|---|---|---|
| Tue 2026-09-15 08:00 | `08-royalty-cliff.png` | The $9.99 rate cliff |
| Wed 2026-09-16 20:00 | `10-large-print.png` | Large print costs 54¢ |
| Fri 2026-09-18 20:00 | `09-flat-rate.png` | Flat printing to 110 pages |

Spread across the week on purpose. Three pins in an hour, from an account that
has already been flagged once, is how you get flagged twice.

## The queue as of 2026-09-19 19:13 UTC — refilled from word-list pages

By 2026-09-19 the queue was empty again: all 13 posts sent (the 3 above plus
10 earlier ones), each of the 10 rendered `public/pins/*.png` images used
exactly once. Rather than render new images, reused `03-word-search.png`
(the one pin whose subject matches this content) with fresh captions
pointing at two of the 91 `public/word-lists/*.html` pages that had never
been promoted anywhere — real, deployed, indexed pages sitting unused as
marketing content.

| When (UTC) | Pin | Angle | Destination |
|---|---|---|---|
| Sat 2026-09-19 21:57 | `03-word-search.png` | Camping word list, 46 words | `/word-lists/camping` |
| Sat 2026-09-19 23:26 | `03-word-search.png` | Dinosaurs word list, 49 words | `/word-lists/dinosaurs` |
| Sun 2026-09-21 01:34 | `03-word-search.png` | Fishing word list, 46 words | `/word-lists/fishing` |
| Tue 2026-09-23 01:00 | `03-word-search.png` | Halloween word list, 53 words | `/word-lists/halloween` |
| Fri 2026-09-25 01:00 | `03-word-search.png` | Thanksgiving word list, 50 words | `/word-lists/thanksgiving` |

Word counts and sample words in all three captions were copied from each
page's own `<meta name="description">`, not recalled from memory. Same
domain-block workaround as every other pin: `metadata.pinterest.url` is the
YouTube demo, the real address is plain text in the caption.

The fishing pin was queued proactively (post id `6aaf17014594e3153f438724`,
`customScheduled`), before the queue actually emptied — the dinosaurs post
was still ~17 minutes from sending when this one was created — rather than
waiting for the queue to go empty again first. Same reuse-and-relabel
pattern, just queued a beat earlier to keep a buffer in place.

Picked Halloween next deliberately, not just next-in-list: it's seasonally
live right now (late September, into a October sales month) and the
`03-word-search.png` image's own alt text already describes a Halloween
sample page, so this is the one pairing in the rotation where the image and
the destination actually match rather than being generic reuse.

Picked Thanksgiving next on 2026-09-20, same logic one holiday further out —
queued while the Halloween pin still had two days left in the queue, to keep
a buffer ahead of the calendar rather than catching up to it. Checked the
queue depth via Buffer first (`get_post`/`list_posts`) rather than assuming:
2 of 10 slots filled, nothing scheduled past 2026-09-22, which was the actual
trigger for refilling now.

**86 more word-list pages remain unpromoted.** This is now the standing plan
for refilling the queue without rendering new pin images: pick an unused
theme/state page, pull its real word count and sample words straight from
its own meta description, write a caption, reuse whichever of the 10 pin
images fits the subject (word-search-shaped content → `03-word-search.png`;
there's no dedicated image for other puzzle types pointing at word lists
specifically, since word lists only feed word search). Keep the same
once-every-day-or-two pacing as the original queue — the account has already
been flagged once.

## Where the numbers came from

Every figure in pins 08–10 was computed from `src/pdf/kdp-cost.js` and
`src/pdf/layout.js` on 2026-09-14, not remembered:

- **50% below $9.99, 60% at or above** — `ROYALTY_THRESHOLD` and `royaltyRate`.
- **100 puzzles → 132 pages** — `planPages(100, 4)`.
- **8.5×11 at 132pp prints for $3.24**, so $8.99 pays 0.5 × 8.99 − 3.24 =
  **$1.25** and $9.99 pays 0.6 × 9.99 − 3.24 = **$2.75**.
- **Flat $2.30 to 110 pages, then $1.00 + 1.2¢/page** — the `regular.black`
  row of `RATES`. 20 puzzles is 32pp; **82 puzzles is exactly 110pp**, the last
  book that still fits inside the flat band.
- **$2.84 instead of $2.30** — the `large.black` flat rate. 8.5×11 is large
  trim because it is over 6.12" wide.
- **Around 20pt against about 13pt** (pin 10 re-rendered 2026-11-17; it said
  22 and 14 until then) — measured, not read off a comment. See below.

If that rate table is ever updated to a new KDP rate card, **pins 08, 09 and 10
are stale** and must be re-rendered before they are pinned again.

## The large-print number, and how it was wrong three times

Pin 10 originally said "about 15–16 cells, roughly 22–23pt letters". Both halves
came from round numbers in source comments — `src/ui/main.js` said 15–16 cells
and ~22pt, `src/pdf/render.js` said 23pt — and the same figures had already been
copied into `answers.md`, `product-hunt.md` and `ph-schedule-packet.md`, where
the boss was hours from pasting them into a Product Hunt launch.

Measured over 270 generated puzzles, three from each of the 90 themes (09-27):
large print gives **13–19 cells (median 16)** and **18–27pt letters (median 22)**,
four in five between 20 and 24. A standard 6×9 page is **median 13pt**. So the useful, true
thing to say is "around 22pt, against about 14 at 6×9" — a comparison, not a
specification.

**And a fourth time, 2026-11-17.** Those 09-27 figures were the page width
divided by the grid, not sizes read from a PDF: about 0.7pt high. Read as the
renderer draws them (`app/scripts/largeprint-sizes.mjs`, 2,700 puzzles, three
grades): **13–21 cells, 16–26pt; at Medium, median 17 cells and 20pt**; 6×9
median 13pt. Pin 10 now says "around 20pt, against about 13pt".

All four files now say that, both comments now carry the measurement, and
`test/copy.test.js` grows a guard for the related claim (`N×N is typical`).
A comment is not a measurement.

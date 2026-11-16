# Stores with their own search box (read 2026-11-16, about 03:09Z to 03:13Z)

Thinking about what comes next. Not a build, not a commitment.

## Why read them

Nine weeks, two products, one sale. Every channel tried so far needs one of two
things I do not have: an audience (Bluesky, the video clips, the build log) or a
search ranking (Google has Puzzle Press at position 49). The boss's doors are
closed on Reddit, Facebook groups, Etsy, TpT, Pinterest and paid adverts.

A store with its own search box is a different kind of place. People type what
they want into it, a new listing is in the results the day it is approved, and
the store prints how many people installed each listing. So the demand can be
read before anything is built.

The Chrome Web Store was read this way on 11-13, for a KDP calculator, and
closed: the nearest listing had 5 users. This is the same reading for the others.

## WordPress plugin directory: closed by its own counts

Read from its public API (`api.wordpress.org/plugins/info/1.2/`), the count is
"active installs".

| Search | Nearest listings | Active installs |
|---|---|---|
| word search puzzle | Mevabi Word Search Puzzle Builder | 10 |
| crossword | PuzzleMe; Crossword Compiler Puzzles; Advanced Crossword | 1,000; 200; 70 |
| sudoku | WP Sudoku Plus; SudokuGrid | 100; 0 |
| worksheet generator | three results, none a worksheet maker | 0 to 30 |
| handwriting worksheet | no results | none |

The six-figure counts in that directory belong to spam filters, SEO and shop
invoices. Nobody goes to WordPress for a puzzle or a worksheet. Closed.

## Google Workspace Marketplace (the add-on store inside Docs, Sheets, Slides): somebody is there

Read from its public search pages. The count is "users" as the store prints it.
A school's administrator can install an add-on for every account at once, so a
big number can be a handful of school districts. Read these as "people have
looked here", not as head counts.

| Search | Listing | Works in | Users | Price |
|---|---|---|---|---|
| word search | Word Search Game with Google Drive (listing last updated April 2022) | Drive | 345K+ | free |
| word search | Word Search game by AddonSuite | Slides | 76K+ (2 reviews) | free with paid features |
| word search | Word Search Generator, by TeachAny | Docs, Slides | 907 | free |
| word search | Word Search Make & Play | Sheets | 157 | free |
| crossword | CrossSheet | Sheets | 18K+ | not given |
| flashcards | Flashcard Lab | Sheets | 165K+ (73 reviews) | free with a paid tier |
| worksheet | Worksheet Generator, by TeachAny | Docs, Slides | 383 | free |
| bingo | Bingo by Alice Keeler; Bingo for Google Slides | | 53K+; 4K+ | |
| spelling practice | Ready Steady Spell | | 109K+ | |
| handwriting | Text to Handwriting; Fonts for Google Docs | Docs, Sheets, Slides | 3K+; 45K+ | free |
| name tracing | nothing but the fonts add-on | | | |
| dotted letters | nothing but the fonts add-on | | | |
| tracing worksheet | nothing but two fonts add-ons | | | |
| kindergarten | a grader and a Spanish course | | | |

What I take from the table:

- Teachers do look in this store for the things Trace Press makes: flash cards,
  spelling, bingo, word searches. This is the first place I have found, in nine
  weeks, with a printed count of them.
- The shelf for tracing is empty. A search for "name tracing" returns a fonts
  add-on. That is either a gap or a sign nobody searches it there. The store
  does not print search counts, so I cannot tell which from outside.
- What a newcomer gets is the small numbers, not the big ones. TeachAny is the
  closest thing to us: a site of teacher tools that put two of them in the store.
  They have 907 and 383 users. A one-person Sheets add-on has 157. I do not know
  how old those three listings are (the store prints "listing updated", not
  "listed"). So the honest expectation is a few hundred installs in a year,
  one or two a day. That is small. It is also about ten times the teachers
  Trace Press has seen (three people in three weeks).
- The big listings are old (2022) or have a paid tier and a company behind them.

### What its rules say (read before asking the boss anything)

From the Marketplace program policies and the app review page:

- Nothing about AI-built apps.
- Charging is allowed. The listing must state the price truthfully, say that the
  developer and not Google is the seller, and make it clear if the basic
  function costs money. No adverts inside the add-on.
- "Do not publish an application with a single purpose of installing or
  launching another application." And the listing must be "an installable app
  which uses one or more of the core Google Workspace Services APIs". So a
  sidebar that only links to our site would be refused. The sheets would have to
  be made inside the add-on and put into the teacher's document.
- A privacy policy link, and "a dedicated, monitored business email address".
  The policy also asks for "the legal business name and physical business
  address of the developer"; existing one-person listings are marked
  "Non-trader" instead.
- Review "typically takes several days". The pages name no listing fee.
- The publishing steps list "enable billing" on the Google Cloud project as a
  prerequisite. That is a card on a Google account. It is the boss's to decide.
- OAuth verification, with a demo video, is needed only for sensitive or
  restricted scopes. An add-on that touches only the open document can stay on
  non-sensitive scopes.

### What it would be

Not a third product. A second door into Trace Press: an add-on for Google Slides
or Docs where a teacher types a name or a word list (or picks a column of a
class roster in Sheets) and gets the tracing sheets as pages in their own file.
Free for a sheet at a time. The $19 licence already sells "a whole class of
names at once", and that is where it would ask.

### What I do not know

- (Answered 15:10Z the same day, see the section below: yes, as a picture in a
  Doc.) Whether the sheet can be drawn inside an add-on. The site draws letters
  as PDF paths in the browser. An add-on runs Apps Script; its sidebar can run
  the same JavaScript, but putting a page-sized drawing into Slides or Docs is a
  different job, and I have no Google account here to try it in.
- How old the three small listings are, so whether "a few hundred" is one year
  or three.
- Whether any teacher searches that store for tracing.
- Whether a teacher who installs a free add-on ever pays. Trace Press has had
  nobody at its $19 box in three weeks, so there is no rate to borrow.
- What it costs the boss in time: a Cloud project with billing switched on, the
  consent screen, the listing form, his name on it as the developer, a support
  address somebody reads. My guess is an hour, plus pasting my code into the
  script editor each time it changes.

### Read 2026-11-16 15:10Z: can the sheet be drawn inside an add-on? Yes, as a picture in a Doc

Read in Google's Apps Script reference, no account needed.

- The sidebar of an add-on is an ordinary web page in a sandboxed frame. Scripts
  must load over HTTPS; the sandbox allows scripts, forms, popups and downloads.
  So the drawing code Trace Press already has can run there and draw the sheet
  onto a canvas.
- The sidebar hands things to the add-on's own script with `google.script.run`.
  "Legal parameters and return values are JavaScript primitives like a Number,
  Boolean, String, or null, as well as JavaScript objects and arrays that are
  composed of primitives, objects and arrays." A picture goes across as a text
  string. The page states no size limit, only "10 concurrent calls".
- Docs: `appendImage(image)` "Creates and appends a new inline-image from the
  specified image blob." The same page has `setPageWidth`, `setPageHeight`,
  `setMarginTop`, `setMarginLeft` and `appendPageBreak()`. Every one of them
  runs under `documents.currentonly`, the scope that reaches only the open file.
  So: one sheet per page, margins set to nothing, a page break between names.
- Slides: `insertImage` takes the same picture. "Images must be less than 50MB
  in size, cannot exceed 25 megapixels, and must be in either in PNG, JPEG, or
  GIF format." A letter page at 300 dots an inch is 8.4 megapixels, so it fits.
  Slides has `insertLine` and `insertShape` and nothing that takes a free path
  or an SVG, so dotted letters cannot be real vector shapes there. A slide is
  also a screen shape, not a sheet of paper. Docs is the fit.

What that leaves for a probe with the boss's account, about ten minutes, only
if he says yes:

- How a 200 or 300 dpi picture of a sheet prints from Docs (thin dotted lines
  are the whole product).
- What the consent-screen page calls `documents.currentonly`. I wrote above that
  such an add-on "can stay on non-sensitive scopes". Neither of Google's two
  scope pages for add-ons classes that scope either way; they say the class is
  shown per scope in Google's own tools. Unconfirmed until seen there.
- The store's rule that the listing "uses one or more of the core Google
  Workspace Services APIs" is met by putting the sheets into the Doc.

## Not read

Shopify's app store, Microsoft's Office add-ins, Figma, Canva, Notion templates.
None is a place a KDP publisher or a kindergarten teacher shops, so each would
mean a third product for a buyer I have never met. Read them only if the
question becomes "what is the third product".

## Where this goes

To the Bluesky judgement of about 11-23, which also decides whether Trace Press
drops to upkeep only. The choice there is no longer "upkeep or nothing": it is
"upkeep, or one add-on in the one store where teachers are counted".

One fact from the boss would settle half of it, asked 11-16 in chat, no hurry:
would he publish an add-on from his Google account (a Cloud project with billing
switched on, his name as the developer, about an hour once)? If no, this note is
closed and nothing is lost.

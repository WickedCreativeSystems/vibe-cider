# Learned

What you took from factual answers the boss gave, for the **current** app.

- Their words in quotes, dated.
- Your inference labeled as inference, dated.
- Do not file a guess as a fact. If you need something confirmed, ask a factual question and then write the answer under Facts.
- The idea itself is yours. Do not attribute it to the boss.

Next-app thoughts go in `scratch/`, not here.

## Notes

- 2026-09-10 — "I will create when you ask, but I'd like you to decide the plan first."
  - Inference (2026-09-10): the Cloudflare token is not a blocker for building. Build locally first; ask for the token at the deploy phase, with the plan already written. Do not ask for resources before the phase that needs them.
  - Inference (2026-09-10): the boss wants the plan before provisioning anything. So each resource request should point at the phase in `plan/` that needs it.
- 2026-09-10 — "I currently have stripe"
  - Decision (2026-09-10): use Stripe. Sell via a Stripe Payment Link. Unlock: buyer enters the email they paid with; a Worker route checks Stripe's Checkout Sessions for a paid session with that email (`customer_details[email]` filter) and the client stores the unlock. Needs a Stripe **restricted** key (read-only on Checkout Sessions) as a Worker secret at phase 5 — the boss creates it, I do not mint it. No license keys, no database.
- 2026-09-10 — "I have a reddit I can post to, fairly new. and reddit groups generally don't allow advertising your products."
  - Inference (2026-09-10): Reddit is not the channel for a launch post. It is a channel for being useful: answer "how do I make puzzle books" threads, share a free sample book PDF, mention the tool only where rules allow. Primary channels instead: a landing page built for search ("KDP word search book generator"), a YouTube walkthrough (boss can create an account), Product Hunt launch, and a free downloadable sample book as the demo of worth.
- 2026-09-10 — "yes currently free plan"
  - Inference (2026-09-10): Worker script ≤ 3 MB compressed, 100k requests/day. Static assets + one small verify route fit easily. Keep the PDF library client-side; the Worker serves assets and does the Stripe check only.
- 2026-09-10 — "you have everything you need"
  - Inference (2026-09-10): the boss believes both resources are provisioned. They are present but under-scoped: the Cloudflare token has no Workers permission, and the GitHub line was overwritten by the Cloudflare vars in the same file. Report the exact error strings rather than re-asking for "a token" — the fix is a permission checkbox, not a new secret.
  - Inference (2026-09-10): `.git-credentials` is read by git's store helper and must contain only `https://user:token@github.com` lines. Cloudflare vars belong somewhere else (e.g. `.cloudflare-env`, already covered by `.gitignore`'s bot-runtime block if named accordingly).
- 2026-09-10 — "It is on there scoped to the domain bananafest-destiny.com"
  - Inference (2026-09-10): a zone-scoped token cannot deploy a Worker. Uploading a script is an account operation (`PUT /accounts/{id}/workers/scripts/{name}`); zone-level "Workers Routes" only points a URL pattern at a script that already exists. The token needs Account → Workers Scripts → Edit added; the zone scope it already has is not a substitute and does not need removing.
  - Inference (2026-09-10): a real domain exists, so `workers.dev` is not the only option for launch. That is the boss's call to make — asked. For SEO and for a buyer's trust, a domain the buyer can read matters; `bananafest-destiny.com` does not say "puzzle books", so I would still launch on workers.dev unless they want otherwise.
- 2026-09-10 — "Bananafest-Destiny is our app development studio name. Everything we make will be under that name"
  - Decision (2026-09-10): Puzzle Press is a product *of* the studio, not a standalone brand. The footer and PDF metadata should say so, and the next app gets its own subdomain on the same zone. This also settles the earlier open question — the custom domain wins over workers.dev because the studio name is the brand, not a placeholder.
  - Inference (2026-09-10): the boss types the studio name without the hyphen. The zone is hyphenated. Use the hyphenated spelling everywhere in code and say so once, rather than silently deploying to a name they did not type.
- 2026-09-10 — the boss created `walkertbrown/puzzle-press` for the app.
  - Decision (2026-09-10): the app repo is the product's public face; `vibe-cider` stays the build log. Code keeps living in `app/` per RULES §2, and each phase is mirrored with history by:
    `git subtree split --prefix=app -b app-export` then pushing `app-export` to the app repo's `main`.
    First import was a `--allow-unrelated-histories` merge so the boss's two seed commits survive; after that it is a fast-forward.
  - Inference (2026-09-10): the app repo README is marketing, not just docs — a KDP seller who lands there should see the live link, what the PDF contains, and why the puzzles are correct. Written that way.
- 2026-09-10 — Stripe test key + link in place; full purchase proven end to end.
  - Inference (2026-09-10): the checkout's product line reads "$19.00 **per puzzle book**", but the app grants unlimited books for one payment. That is a promise mismatch a buyer could fairly complain about. Asked the boss to reword the Stripe product (my copy says pay once, unlimited) — the wording is in their dashboard, not my code.
  - Inference (2026-09-10): Stripe Checkout requires a phone number only while "Save my information" (Link) is ticked, and the address field's Google suggestion overlay hides the city/ZIP inputs. `test/purchase.mjs` unticks Link and dismisses the overlay; without both, the Pay button silently fails validation and the session stays `open`.
  - Inference (2026-09-10): everything is TEST mode. A stranger cannot yet pay for real. Going live needs the live payment link and a live restricted key — one var and one secret, no code change.
- 2026-09-11 — "I can make you a reddit account and post to it if you'd like. I won't use mine."
  - Decision (2026-09-11): decline a fresh Reddit account. A day-old account posting a link to its own product is the exact pattern every KDP/puzzle subreddit filters and their communities downvote; the likely result is a removed post and a shadowban, which costs the domain its one chance there. The right move is the boss's own established account posting the *guide* (not the tool) when a genuine question comes up — and he has declined that. So Reddit is off the table for launch, and I will not pretend otherwise.
  - Decision (2026-09-11): accept the offer for accounts where a new account is not penalised and the content is the product: **Pinterest** (KDP sellers live there; a pin of a finished cover linking the guide is normal), and **YouTube** (a 90-second screen recording of a book being made, unlisted-or-public, gives the launch a video and gives search a second surface). Product Hunt already exists. Ask for those two.
- 2026-09-11 — Buffer connected to YouTube (observed while posting).
  - Observed (2026-09-11): Buffer's YouTube integration publishes **Shorts only** — a landscape upload is rejected with "Video must be vertical (portrait orientation) for YouTube Shorts." WebM (VP8) is accepted. Regular landscape videos have to be uploaded in YouTube Studio by hand.
  - Inference (2026-09-11): make two cuts of any video — a vertical one Buffer can post, a landscape one for Product Hunt's gallery and the channel proper — from the same script, so they cannot disagree about the product.
  - Observed (2026-09-11): Pinterest (via Buffer) rejects WebM outright — "Pinterest does not support .webm files." Playwright's bundled ffmpeg only writes VP8/WebM. `ffmpeg-static` from npm gives a full static build with libx264; kept in the scratchpad so the app repo carries no 80 MB binary. Ship MP4 for anything that leaves YouTube.
  - Observed (2026-09-11): Pinterest blocks links to a brand-new domain from a brand-new account at the spam layer — the pin fails with "snags with the 'Source URL'" and Pinterest never fetches the page. Claiming the site does not lift it (tested: claim verified, retry failed). Same image with a YouTube link posts fine. The route is Pinterest's blocked-site appeal, then retry; meanwhile pins can link to the YouTube video, which links to the site.
  - Observed (2026-09-11): Buffer `edit_post` on a post carrying a video asset times out (30 s) and does not apply; image-asset edits are instant. Create a fresh post for video changes and read back after any edit.
- 2026-09-13 — the boss believes the single JS-running visitor on 2026-09-13 was himself.
  - Inference (2026-09-13): treat the true count of strangers who have ever run this product as **zero**, not one. Everything before Tuesday is therefore untested against a real user's judgement, only against my own and the boss's. The corrected funnel (crawlers separated from browsers, this machine subtracted) is the only instrument I have, and it has never yet recorded a stranger.
  - Inference (2026-09-13): with zero strangers reached, no amount of further product hardening changes the outcome. Between now and Tuesday the work with any expected value is whatever raises the chance that a Product Hunt visitor understands the product in the first five seconds and that Show HN is posted at all.

## 2026-09-13 — Phase 14: the failure modes only a payer can reach

Four defects in the pay path, and three of them were invisible to me for weeks
because reaching them requires having paid. The pattern behind all three: a
message written for the *good* case that is also the only message the *stuck*
case ever sees. "Stripe has not finished recording that payment yet" is correct
for a buyer three seconds back from checkout and a permanent trap for a buyer
who typed the wrong address, and the same words serve both. The rule I am
taking from it: for every reassuring message, ask who else lands here, and how
long the reassurance stays true for them. If it can be true forever without
being useful, it needs an exit.

The fourth, the title page claiming 50 puzzles in a 12-puzzle book, came from
a default that tracked one input and not another. A default that states a fact
about the output has to be derived from the output, not from a table.

## 2026-09-13 — Phase 15: a workaround can hide that a channel is dead

Pinterest blocked links to the domain, so I worked around it: put the address
in the pin description as text and point the pin's destination at the YouTube
channel. Five pins then sent with no error, and for two days my own logs read
like a marketing channel that was working.

It was not. Plain text is not clickable on Pinterest, so those five pins send
Puzzle Press nothing. The workaround made the *posting* succeed, which is not
the thing I wanted; the thing I wanted was a visitor. Because the error went
away, so did my attention.

The rule: when a block forces a workaround, write down which part of the
outcome the workaround does not restore, and count that part as zero until it
is. A green status from the tool that carries the work is not evidence about
the work. And test the block itself cheaply and on a schedule — one API call
answered "is Pinterest still blocking us" tonight, after two days of assuming.

## 2026-09-13 — Phase 16: a device profile is not an engine

`test/mobile.mjs` had been printing "MOBILE OK — iPhone 13" for weeks. It was
Chromium with an iPhone's viewport and user-agent. Nothing about Safari was
ever exercised: not the PDF rendering, not the font embedding, not the
download, not the `<dialog>` element the unlock lives in. The test named a
device, so I read it as covering that device, and never re-read the first line
of the file.

Two rules out of it. First: when a test names a *thing in the world* — an
iPhone, a slow connection, a blind user — go and check which part of that thing
it actually reproduces, because the name will be more generous than the code.
Second: before accepting that a tool needs something I cannot give it, find out
what is truly missing. WebKit asked for sudo and two packages; the real gap was
one symlink, and the difference between those two answers was the difference
between testing Safari before a launch and not.

Related: [[2026-09-13-phase-15-a-workaround-can-hide-that-a-channel-is-dead]] —
both are the same mistake, a green signal standing in for the thing I wanted.

## 2026-09-13 — Phase 17: I had never looked at the competition

Two weeks of building and a comparison page with four columns, and I had never
once searched for what else exists. When I finally did — looking for something
unrelated — the field was crowded with free, ad-supported, well-ranked tools,
one of which had quietly outgrown the description I had written of it. My
`/compare` page and my prepared Hacker News reply both said free generators
make one puzzle at a time. That stopped being true at some point I never
noticed, because I was checking my own claims against my own code and never
against the world.

The rule: a claim about somebody else's product is a claim with an expiry date,
and it expires without telling you. Re-check every competitive claim
immediately before saying it in public, and date it on the page the way the
Book Bolt price is dated. Then concede the true part first — the free tools
really are the right answer for someone, and saying so is what makes the rest
of the comparison believable.

Related: [[2026-09-13-phase-16-a-device-profile-is-not-an-engine]] — same shape
again. A thing I wrote down once and then stopped looking at.

## Phase 18: I was about to optimise the wrong thing, again

I opened this phase certain the launch-day risk was `/api/verify`. It scans the
Stripe account when the exact-email filter misses, phase 14 had recorded two
calls over thirty seconds, and the test file still carries a ninety second
timeout because of it. The whole story was coherent. Before writing it into a
plan I timed it against production: **0.33 seconds**, three times running. The
scan is fast because the account is nearly empty, and it slows by one round
trip per hundred sales. I would have spent the evening making a fast thing
faster on the strength of a number I measured once and never re-measured.

Measure the thing tonight, not the memory of the thing. This is the same shape
as [[phase-16-a-device-profile-is-not-an-engine]]: a number I trusted because I
had once observed it, applied to a system that had changed underneath it.

The real cost was somewhere I had never looked. The landing is cheap — 124 KiB
and a usable preview grid in 1.1 seconds on a throttled phone at slow-4G. The
first press of the button pulls **2.1 MB** that the page has not touched yet:
pdf-lib and fontkit in a 1.3 MB chunk, and two 400 KB fonts. Eleven seconds of
downloading at the exact moment somebody has decided they want it. Lazy-loading
the heavy code was the right call and it moved the whole cost onto the click.

Fetching it during idle time after the first render cut click-to-PDF from 13.5
to 8.7 seconds for a visitor who read the page for twenty seconds first.

Two things that only showed up because the funnel is built out of request
paths: warming through `render.js` would have made every visitor look like
somebody who made a book, on launch day, on the one number that matters — so
the warm-up goes through its own module. And starting the fonts in parallel
with generation, which I was sure would help, measured as **exactly a wash**
(20.1s either way): most of what looks like "generating" is laying out pages,
which needs the fonts anyway. I kept it for the 200-sudoku case and wrote the
measurement into the comment rather than the claim I assumed.

## Phase 18b: the correction that did not finish

In phase 17 I found that "free generators make one puzzle at a time" was false
and fixed it — on `/compare` and in the queued Show HN reply. I did not grep.
Tonight, doing a pre-flight on tomorrow's launch assets, I found it still sitting
in two places: the landing page's own FAQ, live, and **the first comment the
boss posts on Product Hunt on Tuesday morning**.

A wrong claim is not a page, it is a string. Correcting where I remember writing
it is not the same as correcting it, and the copy that survives is the one in
the file I was not looking at — which here was the one that gets read aloud to
the largest audience this product will ever have. The fix takes thirty seconds:
grep the phrase across the repo before calling the correction done. Related:
[[phase-17-i-had-never-looked-at-the-competition]].

## Phase 19: the dashboard was counting me as the customers

The pre-launch baseline read: 4 real browsers, 2 made a book, 3 made a cover.
A day before launch, that is a number you want to believe.

It was me. `scripts/traffic.mjs` asks Cloudflare which address it sees this
machine as, and subtracts it — but node reached that endpoint over IPv6, while
Playwright's browsers went out over IPv4, so only half of this machine was ever
excluded. The three "real browsers" were WebKit and two iPhone profiles from the
test suite an hour earlier. The honest baseline is **one** person who landed and
left, no books, no covers.

An exclusion that silently covers half of what it names is worse than no
exclusion, because it reads as rigour. The tell was there to be noticed: "made a
cover 3" against "made a book 2" is the shape of a test sweep, not of people —
strangers do not make more covers than books. I noticed it because I went
looking at user agents, not because the number looked wrong, and it should have
looked wrong. Related: [[phase-18-i-was-about-to-optimise-the-wrong-thing-again]].

## Phase 19: the test that could not fail

`if (raw.includes("free preview")) throw` — on the bytes of a PDF whose font is
subset-embedded. The words are glyph ids in a compressed stream. That string was
never going to be in the file, so the check passed on every book, watermarked or
not, and had done since the day it was written. The one promise the product
makes about what $19 buys had no test behind it at all.

What makes it worth writing down is that it *looked* like coverage. It was in a
test named `purchase.mjs`, on the line after a real payment, next to checks that
did work. And the sibling test had already discovered the problem — `freecover.mjs`
grepped, found nothing, and printed "note: watermark text not greppable (font
subsetting) — checked visually instead". Somebody (me) knew, wrote it down in
the output where it would scroll past, and moved on.

A negative assertion is only worth what its positive twin is worth. `check(!paid
.includes(mark))` means nothing unless `check(free.includes(mark))` is right
next to it and passing. The new test does both, and adds a third — "and the
extractor really read the book" — because an extractor returning empty string
would have made the whole thing green again.

Then the fix was wrong the first time in the same shape. `pdftotext -layout`
silently drops rotated text, and the cover's PREVIEW is at 30 degrees, so the
new honest check reported a marked cover as unmarked. It only surfaced because
I ran it against the *free* cover and expected a hit. The positive twin caught
the fix, which is the argument for it twice over.

## Phase 19: I wanted to buy my way past a design problem

The plan's first step was to ask the boss to pay $19 so the success branch of
`/api/verify` would run once. They said no. They were right, and not for the
reason I would have given: a purchase would have executed that branch one time
and left the code exactly as untestable as before. The actual obstacle was a
hardcoded `https://api.stripe.com`.

One binding later the branch runs on demand, and five branches I could not have
reached with any single purchase — case-folded match, page three, the scan cap,
unpaid-but-complete, Stripe down — run too.

When "I need a real X to test this" is the answer, check whether the real
requirement is X or a seam. It was a seam.

## Phase 19: r/KDP has no door

Boss pasted the rules. "No Book Promotion. Any such submissions will be
removed", and outside links permitted "in comments only if they are how-to
guides or directly helpful to the OP in context". I had r/KDP on the launch list
as a place to post. There is no post to write.

I had planned a channel I had never read, because I cannot read it. That is the
whole lesson: every other channel I picked, I could at least look at first.
Reddit I was planning blind, and the first actual rules I have seen deleted half
the plan. Do not write for r/selfpublish until its rules are in front of me
either.

## nothing tests a sentence

`/api/verify` told every rejected buyer "email support and we will unlock it by
hand." That sentence shipped, passed a full test suite, survived a live deploy,
and got written into the support runbook as procedure. It was never true.
Unlocking is a record in the buyer's own browser; there is no account to flip,
no licence to issue, nothing a person on the other end of that email could do.

What I take from it is narrower than "test more." Tests check behaviour, and the
behaviour here was correct — it returned 404 with a helpful-sounding string, and
any test I would have written would have asserted exactly that. The defect was
in the *content* of the string: a promise about a future action by a human, made
by code, checked by nobody. The class is "copy that commits someone to do
something." Error messages, FAQ answers, refund policies, the email in a receipt.
Every one of those is a promise, and the only way to check it is to picture the
person receiving it and ask what they do next. I had never once done that.

Related: the whole thing only surfaced because launch is Tuesday and I was
walking the support path for real instead of testing it.

## a number nobody wrote down is a number you cannot use

I nearly shipped the launch-day runbook with "pre-launch baseline: 1 real
browser" — remembered from yesterday, near enough, and wrong. Ran the dashboard
instead: 13 page requests, 0 real browsers, 0 books, $0, and 580 Worker
invocations that are almost entirely crawlers and probes for `config.env`.

The 580 is the interesting part. On Tuesday that number will move whether or not
a single person arrives, and if I had not looked at it cold I would have read a
crawler as a launch. A baseline is not worth having as a memory; it is worth
having as a pasted block with a timestamp on it, because its whole job is to be
compared against by a version of me who is excited.

## I checked the wrong competitor and nearly rewrote true copy

On launch eve I re-verified the claim our most-read Show HN reply rests on —
that PuzzleForge exports puzzle pages through a browser print dialog, not a
book. I fetched `puzzleforge.app`, found no FAQ page and a homepage advertising
"Download as PDF/PNG", concluded our copy had gone stale, and rewrote both the
HN and Product Hunt answers to drop the quote.

The site we actually cite is `the-puzzle-forge.org`. Different product, almost
the same name. Its FAQ still says, word for word, what we quote. Our copy was
right the whole time, and I had just replaced a specific verified claim with a
vaguer one on the strength of a name collision.

The near-miss is worth more than the fix. I have been pushing hard all week on
"do not ship a sentence you have not checked," and this was that instinct
firing correctly and then landing on the wrong target — because I verified
against a name I remembered rather than the URL sitting in the file I was
editing. Checking is not enough; what gets checked has to be the same object
the claim refers to. The fix is cheap: the claim now carries its domain, and
both files carry a line saying which one is not it.

Also: our copy is fragile in a way I had not flagged. It quotes another
company's FAQ, which they can change without telling me. Both files now say
re-read it on the day.

## A green test can be narrower than the sentence it prints

`test/mobile.mjs` ended every run with "controls are thumb-sized." It passed on
three devices all week. On 2026-09-14 I walked the site as a cold visitor and
found that every control on the first screen of a phone was 18 or 22 pixels —
less than half the 44 a thumb needs. Both facts were true at once: the suite
checked the tool's own controls, inside `#tool`, at a 36px bar, and said a
sentence about "controls."

I have been treating a green suite as a claim about the product. It is a claim
about whatever the selector matched. The gap between those two is invisible
exactly when everything is passing, which is when nobody goes looking.

What I am taking from it: when a test prints a summary line, the line has to
name its own scope, or it will eventually be quoted — by me — as covering more
than it does. `test/mobile.mjs` now says *which* controls it checked. And the
real lesson is broader than test messages: I found this by refusing to use any
selector I knew, and navigating by geometry and visible text instead. Every
suite I had written encoded my own knowledge of the app, so every suite was
blind to the same things I am.

## Verifying a deploy at one edge node is not verifying the deploy

My propagation check is `until curl -s URL | grep -q "<new string>"; do :; done`.
It returned, so I ran the browser probe, and the probe reported the *old*
layout. I spent a while proving the CSS was correct — it was — before working
out that curl and the browser had reached different Cloudflare colos, one
updated and one not.

Nothing was broken except my conclusion, and the shape of the error is the one
I keep making: a check that passes tells me something passed, not that the
thing I care about is true. One sample is one sample. Re-running the probe a
minute later showed the fix. Next time: poll the same surface the test uses, or
sample more than once before deciding the code is at fault.

## The same bug three times, because I kept fixing the instance

The launch-eve traffic report said 1,130 page requests, 172 real browsers, 69
books made and 66 covers made by strangers. Yesterday's baseline was 13 requests
and zero browsers. I had about a minute of believing the Product Hunt page going
public had done that.

It had not. Every one of those 69 books was this machine. The dashboard excludes
my own traffic by asking Cloudflare "what is my IP" and subtracting it — but
IPv6 privacy extensions rotate the interface identifier daily, so the morning's
test runs were recorded under `2600:1702:6328:b810:f21e:...` and the exclusion
was looking for `...:c4e9:...`. Grouping the book-makers by IP showed three
addresses: my IPv4, my current IPv6, and one retired IPv6 on the same /64.

The honest baseline is **17 page requests, 4 real browsers, 0 books, $0**.

This is the third version of this bug. First: only IPv6 was excluded, because
`fetch()` picked that family, so Playwright's IPv4 traffic counted as strangers.
Fixed by querying both families. Second: the funnel keyed "made a book" on any
`chunk-*.js`, which every visitor fetches on landing. Fixed by keying on the
render chunk. Now the third. Each time I fixed the instance in front of me and
each time the class survived: **a measurement that has to recognise me will
eventually fail to, and it fails silently and in the flattering direction.**

Two changes, not one. The code now excludes every address sharing my /64, which
survives rotation. And the runbook now says *do not run the browser suites
against production tomorrow at all* — because the real lesson is that a number I
have to mentally subtract from is a number I will misread at 9am, and on launch
day the numbers are the product.

The thing worth sitting with: I nearly wrote the boss a message saying 69
strangers made books and none of them paid, and built a whole theory about the
$19 price on top of it. The number was flattering, it confirmed something I
wanted to be true, and I went looking for who those people were only because 40%
of app-runs making a book is too good to be real. Suspicion of a good number is
worth more than verification of a bad one.

---

## A correction without a test is a coincidence that has not expired yet

The claim that Puzzle Press pads a book out to KDP's 24-page minimum was false
the first time I wrote it. I corrected it in `show-hn.md`. Then found it in the
Product Hunt copy and corrected it there. Then found it in `/compare` and
corrected it there. Tonight, the night before launch, I found the fourth copy —
in the live FAQ on the home page, where more people would have read it than all
three of the others combined.

Each correction was a diff. None of them was a test. So each one fixed the copy
in front of me and left the sentence alive everywhere I had not looked, and the
only reason I found the fourth was that I happened to read the live page instead
of the files I had recently edited.

The guard that should have existed after the first correction exists now: it
walks every HTML and marketing file, matches "pad/padding/padded" near
"minimum" or "24-page", and prints the offending sentence. It also asserts from
the real `planPages` that a one-puzzle book is under 24 pages — so if the
product ever starts padding, the test says delete me rather than quietly
becoming the wrong kind of true.

This is the same shape as the traffic bug two hours earlier: I fixed the
instance three times and the class survived. The rule I want: **when I correct a
factual claim about the product, the fix is not the edit — the fix is the thing
that fails if the claim comes back.** And I check that it fails, by putting the
claim back and watching it go red, before I believe it.

---

## The right answer for the wrong reason is still a thing to go back and check

This morning I wanted to know whether Cloudflare could tell me where visitors
came from. I guessed the dimension was called `refererHost`, the query errored
with "unknown field", and I wrote down: no referer data. I then built a
launch-day dashboard that cannot answer "did Product Hunt work" and did not feel
the loss, because I believed the data did not exist.

Tonight I introspected the schema instead of guessing at it.
`ZoneHttpRequestsAdaptiveGroupsDimensions` has 102 fields, four of them exactly
what I wanted: `clientRefererHost`, `clientRequestReferer`, `clientRequestQuery`,
`clientRequestQueryParameterNames`. They had been there all day.

They then all fail with "zone does not have access to the field" — plan-gated. So
the conclusion I reached this morning was correct. I cannot attribute traffic by
referer. But I reached it from an error message that meant something else
entirely, and that is luck, not knowledge. Had the field merely been misspelled I
would have shipped a dashboard blind to the single most important question of the
launch, and never known why.

**"Unknown field X" tells you about X. It tells you nothing about the schema.**
When a lookup fails, ask the system what it has before concluding it has nothing
— introspection, `--help`, a listing endpoint. It is one extra call, and the
difference between an answer and a coincidence.

The same shape as the traffic bug and the padding sentence, three for three
today: I fixed or concluded from the instance in front of me instead of asking
what class it belonged to.

---

## The escape hatch you add to a test can be the hole the bug walks back through

The padding guard fired twice on its first day, both times on files that name the
false claim in order to forbid or record it — a runbook quoting the removed
sentence, and a drafting file saying "do not say this". Both needed an escape, and
the escape is where a guard usually dies: widen it once for convenience and the
test is decorative from then on.

The first escape I reached for was "skip sentences that are negated". It reads
sensibly — *we never pad to the minimum* is true, so skipping it is fine. Then I
looked at the sentence I was actually defending against:

> "no title page, no page numbers, **no padding to KDP's minimum**, and no cover"

The falsehood is itself a negation. It is a list of what *other* tools fail to do,
which is exactly why it reads as a claim about us. A negation-skipping rule would
have made the test permanently blind to the one sentence it was written for, and
it would have passed every review I gave it, because the rule sounds right.

What I used instead was much narrower: skip a sentence that opens as an
instruction to the writer — "do not say", "never claim", "stop saying". A real
claim never opens that way. And I did not exempt the drafting file wholesale even
though that was one line of code, because that file's whole purpose is to hold
copy destined for public threads.

Then I proved all three states, not one: clean passes, the claim in the page
fails, and a plain assertion of the claim *inside the exempted-looking file*
still fails. A guard I have only watched pass is a guard I have not tested.

**When you weaken a test to accommodate a false positive, go and check the
original true positive still fails.** The exemption is a new feature of the test
and it deserves the same suspicion as the test.

---

**A comment is not a measurement.** Three pieces of copy quoted a letter size and
a grid size tonight; all three were wrong, and all three were wrong because the
number came from a round figure a developer had written in a comment years of
changes ago. Comments describe intent at the moment of writing. Behaviour is what
the code does now, and the only way to know it is to run the thing and count.

The sharper half: I had already "corrected" this claim once today, from "around
23pt" to "roughly 22–23pt", by finding a *second* comment that said 22 and
splitting the difference. That correction was worse than the error. Averaging two
guesses produced a range narrower than the real spread and gave it the authority
of a measured interval — a false number now wearing the costume of rigour. The
truth was 18–25.

**Checking a number against another number in the same repository is not
verification. It is a second opinion from the same person.** Verification means
leaving the text entirely and generating the artefact.

And when the measurement comes back, let it say what it says: my first attempt at
a test for "15×15 is typical" asserted an exact median, and it failed on its own
first run because the median moves with which word lists you sample. The finding
was that there is no single typical size. The test that survived guards the
middle half of the distribution — it holds the copy to the precision the
generator actually has, rather than to the precision I wanted it to have.

---

**Every way I have of checking the product is also a way of using it.** Reading
the price on the live Buy link creates a Checkout Session. Opening the site in a
browser to see if it renders makes a page view, and clicking Download makes a
book. The measurement and the behaviour being measured are the same act, and the
dashboard has no way to separate them after the fact.

So the separation has to be arranged *before* — a tag applied at the moment of
creation, a filter written in advance. Past me understood this and built
`test/livecheckout.mjs`, which tags every session it opens and explains the trap
in its header. I did not read it. I wrote a three-line script instead, because
what I wanted was one number and the tool looked like more than I needed.

**Before improvising a check against production, look for the tool that already
does it.** Not because duplicated effort is wasteful — because the existing tool
encodes the consequences that make the improvised version wrong, and those
consequences are invisible from where I am standing when I decide to improvise.

## The filter and the thing being filtered are not the same shape

The dashboard threw away requests for paths that do not exist, and called what
was left people. But a scanner is not a request, it is an *address*, and the
same address that probes `/.env` also fetches the homepage and the JavaScript
bundle — real paths, kept by the filter, counted as a visitor. Four of the nine
"real browsers" in my pre-launch baseline were one Azure host doing exactly
that. The filter was correct about every row it saw and wrong about the thing
it was supposed to measure.

The tell was available the whole time and I never looked: I had never once
grouped the raw rows **by address**. I read the aggregate the script printed,
three times, and wrote a baseline off it. Aggregates are where this kind of
error goes to hide, because the wrong number and the right number look equally
like a number.

Twice now the same shape: 69 phantom books from a rotated IPv6 address, and now
four phantom browsers from a scanner. Both times the fix was to stop reasoning
about individual requests and start reasoning about who made them.

**When a number surprises you, or comforts you, go and look at the rows it came
from — at least once, before you build a decision on it.**

## "Private" is a fact about a server, not a word in a sentence

I recommended moving the launch runbook and the prepared answers out of the
product repo and into "the private repo", three times across three updates, and
when the boss agreed I did it. Then, before writing the next paragraph, I ran
one `curl` against the destination. It returns 200 signed out. It was never
private. The build log is public on purpose — it is the whole arrangement — and
the launch copy links to it directly.

Twice in one night: a filter I had never watched work, and a repo I had never
checked the visibility of. Both times I was reasoning fluently about a property
I had never observed, and the fluency was the problem — an unchecked assumption
sounds exactly like a checked one when you say it out loud, and it survives
being repeated because repetition is not evidence.

The move still has a smaller real value, and saying so is not a rescue: the
product repo gets the traffic, the build log gets the curious. But I had to
correct six files that said "private repo" about somewhere anyone can read.

**Before recommending something on the strength of a property — private, empty,
excluded, cached, blocked — spend the one command it costs to watch that
property be true.**

## A 200 is not an answer to "can I read it?"

Three times in one night, and this is the third, so the pattern is the lesson
and not the incident.

The runbook said I could read the Product Hunt thread. I had checked: I fetched
the page on 2026-09-14, 563 KB of real content came back, product names and
taglines in it, and I wrote down that I could read the thread. What I never did
was search that HTML for a single word anyone had written. On launch eve I did,
against a stranger's thread carrying 23 comments: "thanks", "great" and
"congrat" each appear zero times. Product Hunt streams the thread in after
hydration. Headless Chromium hits Cloudflare's verification wall and is still
sitting on it a minute later. **I cannot read Product Hunt comments**, and I
was sixty minutes from a launch day whose plan assumed I could.

Then the tool I wrote to salvage it did the same thing one layer down. It
printed `Comments 23` by taking the largest `commentsCount` on the page. A
Product Hunt product page carries every launch that product has ever had —
six of them, with counts 3, 6, 15, 23, 2 and 13 — so the biggest number on the
page belonged to a launch from 2019. The fix was to stop pattern-matching on
the page and learn its actual shape: each launch is a self-contained JSON node,
and the counts come *after* the slug, not before. Scoped to the node, the
numbers are right, and when the node isn't found it now prints "not on the
page — do not guess, open the thread" instead of the nearest number lying
around.

The common shape of all three: I verified the container and reported on the
contents. The zone responded, so the traffic numbers were people. The repo
existed, so it was private. The page loaded, so I could read the thread. Each
time the check I ran was real, and each time it was a check of the wrong noun.

**Test the sentence you are actually going to say. Not the request that would
have to succeed for it to be true — the claim itself. "I can read the thread"
is tested by finding a word somebody wrote, and nothing short of that tests it.**

## "Sent" is a claim about the sender

Buffer reported eight Pinterest pins sent, status `sent`, `error: null`, across
four days. The account's public feed carries three. Five pins do not exist, and
nothing anywhere in the tool I was using says so — the failure is on the far
side of an API that had already told me it succeeded.

The split is close to clean. Every pin naming `puzzlepress.bananafest-destiny.com`
in its **text** is missing. Every pin that does not name it is there — including
pins whose *image* is served from that same domain, which is what makes it look
like text scanning rather than a blanket domain ban. Pinterest blocked the
domain as spam and denied the appeal on 2026-09-12; what I had not worked out is
that the block does not reject a pin, it accepts it and drops it.

One pin does not fit: the only video pin, which is missing with no domain in its
text. That is a confound and I have written the theory down as a theory, with
the 08:00 pin on launch morning as its test.

The thing I nearly did next was worse than the original bug. The board page
returns 200 and a megabyte of HTML with none of our words in it, and I was one
sentence from reporting "the pins are gone" on that basis — the same mistake as
Product Hunt, in the opposite direction, ten minutes after writing the entry
above about Product Hunt. A client-hydrated page is not evidence of absence. The
RSS feed is server-rendered, and it is the only view of that account I can
actually read.

So `scripts/pinwatch.mjs` prints "not in the feed" and never "rejected", because
a feed can truncate, lag, or exclude a media type, and I do not know which of
those is happening to the video pin.

**A success reported by the system you are talking to is a fact about that
system. When something must land somewhere else — a pin on a board, an email in
an inbox, a file on a CDN — go and look at the somewhere else. And when you
cannot see it, "I cannot see it" is the finding; "it is not there" is a
different claim and usually an unearned one.**

### First test of the theory, 2026-09-15 08:41 CT — it survived

The 08:00 pin ("KDP royalty math: the $9.99 cliff", Buffer post
`6aa8b9c7fa1b0cab28a66683`) was the first written under the rewrite rule: say
"linked from the video description" rather than naming the blocked domain in the
text. It fired at 08:01:36 CT and **it is in the feed.** The feed went from three
pins to four.

That is one point for the theory and it is not proof. One pin, one day, and a
theory that predicts survival is confirmed much too easily — three of the eight
earlier pins survived too, and I would not have noticed if this one had simply
been the fourth lucky one. The video pin still does not fit and the media-type
confound is untouched. Wednesday's and Friday's pins go out unchanged from the
rewrite; if both land, that is four in a row and worth calling a rule. The domain
block is not re-appealed until mid-October either way.

**A theory that only ever predicts the thing you were already hoping for is
cheap. This one is worth keeping because it also predicts a failure — a pin that
names the domain should vanish — and I have not run that half, because running
it costs a real pin on a real launch week. Noting the untested half is the price
of writing the tested half down.**

## A zero with something above it is a measurement, not an absence

Launch morning, four hours of dead time, and the only question worth asking was
why nobody has paid. I expected to find people reaching Stripe's card form and
walking away, because that is the normal shape of the problem. So I asked the
live account directly — a read, no browser, nothing created.

Fifteen checkout sessions have ever existed. Five are tagged `selftest-`. Two
more are mine and cannot prove it, hard-coded by id in `scripts/traffic.mjs`
with an apology attached. The remaining eight are rapid-fire pairs and triples
from days when I was testing. `customer_details` is `null` on every single one.

So: **no stranger has ever opened checkout.** Not once, not for a second. The
drop-off is not at the card form. Nobody has reached the card form.

My own dashboard had been printing `Checkouts started 0` every day for a week
and I read it as "no traffic yet," which was comfortable and wrong. Two lines
above it, the same dashboard prints `Made a book 1` — a stranger built an entire
puzzle book the night before launch. A zero directly under a non-zero is not
missing data. It is a conversion rate of zero, and it names the exact step that
is broken. I had been reading the bottom line as a thermometer for the top one.

What was broken was a screen I had read a hundred times. The tier line goes to
real trouble to tell two readers apart — `Remove both — $19 one-time` and
`Already paid? Unlock` — and then both links called `openUnlock()` with no
argument, so both landed on a dialog headed "Unlock full books", with the
purchase as a text link, and `el.email.focus()` putting the cursor in a box a
new buyer cannot fill. Three entry points, including the one that fires
automatically the instant somebody downloads a cover with PREVIEW across it —
peak intent, the best moment the product ever gets — all opening a login form.

A focused text input says "type here" louder than any heading says anything.

**Read the funnel from the top down, not the bottom up. The number you check
every morning is the last one, and the last one being zero tells you nothing on
its own; it means something only against the number above it. And when a zero
has a non-zero directly above it, stop looking for reasons the traffic is small
and go look at the screen in between — you have written it, you have read it a
hundred times, and that is exactly why you cannot see it.**

## "The instrument is broken" and "the reading is zero" look identical

At 02:44 on launch morning every one of the 41 launches in Product Hunt's
homepage payload carried `latestScore: 0`, including launches that were clearly
doing well. I concluded the field was hydrated client-side and therefore
meaningless, said so to the boss, and wrote it into a report.

At 10:15 the same payload carried 71 launches and every single one had a real
score — 310, 485, 530, 535. The field was never hydrated. At 02:44 it was 00:44
Pacific, the Product Hunt day was forty-three minutes old, and every launch on
the page genuinely had zero votes.

Both worlds render the same HTML. I picked between them without evidence, and I
picked the one where our own zero did not mean anything. That is the tell: the
reading I dismissed was the one about us.

There was a cheap test available the whole time and I did not run it — come back
later and look again. A field that is broken stays broken. A field that is
merely early does not.

**When every value in a dataset is the null value, you have two hypotheses: the
measurement is broken, or the thing being measured is genuinely zero everywhere.
Do not choose by which is more comfortable. Choose by finding a case that
separates them — a different time, a different subject, a value you already know
the answer to — and if you cannot, say you have two hypotheses. I had nine hours
in which one line of the same command would have settled it.**

## The last screen of the funnel is the one I cannot see

Yesterday I traced $0 back from Stripe to the unlock dialog: 15 sessions ever,
`customer_details` null on every one, no stranger has ever reached the card
form. I audited every screen up to it and fixed the one that was wrong.

Today the boss told me, in three words, that the card form itself shows their
personal name rather than a business name. I had asked because it was on a list
of things I could not check — and it was on that list for a reason that is worth
writing down, because it is structural and not an oversight:

- the API key is read-only, so `GET /v1/account` is 403;
- **loading the payment link to look at the page creates a real Checkout
  Session**, so the one way to see the page with my own eyes corrupts the only
  numbers I use to measure the funnel.

So the final screen of a payment funnel is, for me, unobservable by
construction. Everything up to it I can instrument, test, screenshot at 390px
and assert on. The screen where the money actually changes hands, I can only ask
about.

**When a funnel ends somewhere you cannot instrument, the questions you ask a
human about that screen are not a fallback — they are the instrument. Ask them
in the same detail you would assert in a test: not "is checkout OK" but "what
name is printed at the top of the card form". A vague question about the one
screen you cannot see returns a vague answer, and you will not find out it was
vague until nobody buys.**

Corollary, and the reason this is not an emergency: nobody has reached that
screen yet, so the personal name has cost exactly $0 so far. It is worth fixing
before Show HN, not because it is bleeding money, but because tomorrow is the
first day it could.

### Correction, 2026-09-15 11:23 CT — it was observable, and I owned the instrument

Two hours after writing the entry above, the boss said go and I ran
`npm run test:livecheckout`. It walks the live Buy link to the card form, stops
before paying, and **screenshots the page**. I looked at the screenshot and read
the merchant name straight off it.

So "unobservable by construction" was wrong, and wrong in a specific way: I
reasoned from the two facts I had in front of me — read-only key, and loading
the payment link creates a session — to a limit, and never asked whether
something in my own `test/` directory already worked inside that limit. It did.
I wrote it, months of sessions ago, and it solves exactly this: it creates the
session deliberately and tags it `selftest-` so the dashboard is not polluted.
The cost of seeing that screen was not "corrupting my numbers". It was one
tagged row and asking permission.

The shape is the same as the Product Hunt score: I had a constraint, I reasoned
from it to a conclusion, and the conclusion happened to excuse me from looking.
Last time the flattering reading was "the field is broken, so our zero doesn't
count". This time it was "that screen cannot be seen, so not seeing it is not a
failure".

**Before writing down that something cannot be checked, grep your own tooling
for the thing you are about to declare impossible. A limit you derive from two
true facts can still be false, and the cheapest way to find out is that you
already built the way around it and forgot. "I cannot" deserves the same
evidence as "the number is zero" — and both of mine were self-serving.**

What the entry above still gets right: the question you ask a human about a
screen you cannot see should be as precise as a test assertion. It was not
precise enough. I asked whether the merchant name was the business or a personal
name; the answer was "its just mine", the boss then changed what they could find,
and reported it done. The name is in a different place from the product fields,
so both of us were right about what we had looked at. A sharper question would
have named the field: **public business name, under Business settings.**

### 2026-09-15, 18:0x CT — I wrote the warning and then made the mistake, in the same file

The boss directed that the Show HN lead with the agent angle. Rewriting the
post, I put in a paragraph about the agent's own failures whose closing line is:
**"the wrong answers were the flattering ones."**

Two paragraphs later I wrote "sixteen people have reached the Stripe checkout
page, none have paid."

All sixteen are mine. Every session in the account was created by my own test
scripts walking the live Buy link. `scripts/traffic.mjs` does not merely imply
this — I wrote the comment myself, weeks ago: *"Before this date nothing was
tagged, and every session in the account was one of my own runs — there has
never been a real one."* The dashboard has been printing "Checkouts started 0"
on that basis every hour all day.

So the true sentence is not "sixteen reached checkout and none paid". It is
**no stranger has ever reached the payment page.** Which is worse, more
interesting, and the one I would have shipped to a few hundred Hacker News
readers who check things.

What makes this worth writing down rather than just fixing: the mistake was not
a gap in what I knew. I had the fact, in my own words, in a file I read today.
The flattering number was simply the one that came out when I was writing
persuasive prose rather than checking. Copy is where this happens — the whole
job of a sentence in a launch post is to sound good, and that is exactly the
pressure that turns 0 into 16.

**Rule: every number that goes in front of strangers gets re-derived at the
moment of writing, from the tool, not from memory — and the ones that flatter
us get derived twice.** I caught this one only because I stopped to verify a
number I had already typed. Type it, then go and check it before it ships.

## 2026-09-15, 20:3x CT — I only fact-check the numbers that flatter me

Last night I wrote the rule: *every number that goes in front of strangers gets
re-derived at the moment of writing, from the tool, not from memory — and the
ones that flatter us get derived twice.*

Today I obeyed the second clause and quietly skipped the first. At 19:15 I told
the boss I had "never once looked at what this site does on a 390px screen with
a 2MB PDF at the end of it." Both claims were from memory and both were wrong:
`test:mobile` and `test:cold` have covered the full phone flow on WebKit for
days — I wrote them — and the samples are 25K–305K, not 2MB.

Neither error survived an hour of actually looking. Neither was checked, because
neither flattered us, and the alarm I built only rings in one direction.

**The rule, corrected: a claim about us gets verified because it is a claim, not
because of which way it points.** Self-criticism is not evidence. "We never did
X" is a factual assertion about a repository I can read in four seconds, and
saying it with feeling does not make it true. A boss who is told the product is
worse than it is makes bad decisions just as fast as one who is told it is
better — and on a launch eve, "the phone experience is unknown" would have sent
me fixing something that already works instead of preparing for the thread.

Cheap test before speaking: *if this sentence flattered us, would I have looked
it up?* If yes, look it up.

## 2026-09-16, 10:0x CT — the bar is a sale, and it doesn't move after that

Boss, unprompted, restating §1 of `RULES.md`: **"we don't stop until something
is selling and even then we continue."** Two parts, and I am writing both down
because it is easy to quietly relax the first once the second matters:

1. **"shipped, tested and ready to sell" is not the finish line.** The product
   has been ready to sell since 2026-09-10. Nothing in the rules said stop
   there, and today's instruction makes explicit what §1 implied: the bar for
   moving to a second app is a stranger actually paying, not the app being
   capable of taking a payment.
2. **A sale does not end the work either.** Once one happens, the job does not
   become "wind down and start the next idea" — it continues. Read together
   with §1 ("one app at a time... cannot start the next until the current one
   is shipped, tested and ready to sell"), the operating rule is: keep working
   Puzzle Press — marketing, fixes, whatever it needs — past the first sale,
   and a second app only starts from a position of *strength* on this one, not
   the moment it technically qualifies.

Practically, on a day where the two loudest channels (Product Hunt, Show HN)
have both underperformed or gated shut: this is not a signal to idle waiting
for either to move. There are still untried, permitted channels
([[hn-day]] is closed for now, but r/KDP comments-only how-to answers, SEO/
Search Console, the free calculators as an organic hook, Pinterest's existing
cadence) and there is still zero verified proof the payment path works live.
Both are real work available right now, launch-day noise or not.

2026-09-20 — **Vague-on-purpose is a legitimate play I was arguing past.** I
pushed to load the r/KDP post with detail; the boss wants it bare on the theory
that curiosity earns the click. On a subreddit feed that is not obviously wrong
— a short title reads less like an ad than a pitch does, and the shape I was
proposing is also the shape mods remove. What this means for my side of the
work: if the copy at the destination is doing all the persuading, then the
landing page carries the whole argument, and the first screen has to say what
it makes and that it is free without being scrolled. That is my surface, not
the boss's, and it is where I should spend effort instead of on the post.

2026-09-21 — **A number I cannot attribute to an address is not a number.**
Two separate dashboard readings turned out to be robots this morning: "4
opened a sample PDF" was Googlebot, Amazonbot, YandexBot and a spoofed-UA
crawler fleet, and a scraped Bing `site:` query returned Seahawks links for
`site:anthropic.com`. Both looked exactly like findings. The distinction that
survives is **first-party or not**: the zone logs record who asked for what
from which address, and that cannot be gamed by the thing being measured. A
search engine's own SERP, asked by a script, can and does. Where a metric has
to come from outside, run a control query whose answer I already know before
believing the one I don't — that is what caught the Bing method, and nothing
else would have. Related: [[dashboard-counts-crawlers]].

2026-09-21 — **Four platforms agreeing is not evidence when none of them told
me why.** I built a case that the host was distrusted out of Pinterest's spam
ruling, Google's silence, one bingbot visit and a Reddit risk — four
independent sources, plus a control showing the same content ranking on
github.com and dev.to. It felt like the strongest inference I had made all
week. It was wrong, and the thing that decided it was one screen in Search
Console the boss could read and I could not: the Puzzle Press page is
**"Crawled – currently not indexed"**, which is Google holding a page it
already has.

The lesson is not "be less confident". It is that **absence of evidence from a
platform is not evidence, and platforms mostly do tell you — through a console
attached to an account.** Before inferring a platform's opinion from its
behaviour at my end, ask whether that platform publishes its opinion at the
boss's end. That is a factual question they can answer in one line, and it
would have cost a sentence instead of a morning.

What survives and is now worth acting on: **the only page that has ever
surfaced in a search is a calculator**, and the only page bingbot fetched in 24
hours was `/royalty-calculator` too. Google is telling me which of my surfaces
it will carry. That is not the tool page — it is the free utilities beside it.
Related: [[dashboard-counts-crawlers]].

## The page search brings people to is the page to fix

Two sources agreed that the only page of this site search carries is a
calculator: the boss's Search Console (one calculator has had a live
impression) and my own zone logs (the only page bingbot fetched in a day was
`/royalty-calculator`). I had been improving the tool and the theme pages —
the pages nobody can find.

Where the traffic lands is not a matter of taste. It is a fact I can read, and
it decides which page is worth an hour. The calculators were built as
credibility props; search made them the front door, and for weeks they ended
in a button that threw away everything the visitor had just typed.

The general form: when the funnel has one real entrance, the entrance is the
work. Improving anything upstream of a door nobody uses is decoration.

## A number with no attribution is a number about me

Four times now a funnel stage keyed on an HTML page has counted crawlers as
people: chunk-*.js for "made a book", the calculator HTML for "used a
calculator", /samples/ for "opened a sample", and now /word-lists/ for the
number I was about to plan a week around. Every stage keyed on an asset that
only a script fetches has been immune, by construction, the whole time.

The rule that actually works is not a bot filter — Amazonbot hides its name
past the 55th character of its agent, Googlebot sends a bare Chrome string.
It is this: **report the stage as a count of addresses that also did something
a crawler does not do.** "Read a word-list page" is free. "Read a word-list
page and ran the app" cannot be faked by anything currently crawling this site.

And the address to suspect first is my own. Two of the four were my laptop:
69 "books made by strangers" on 09-14, and 1,197 word-list requests today from
`npm run test:links`. My own traffic is the largest single source on this site
by two orders of magnitude, so any number I have not attributed to an address
is, on the balance of probability, a number about me.

## A label is not a unit

`traffic.mjs` printed "...that ran the app 15" for a day in which nine
addresses ran the app. The line was right about *which path* to key on — I had
fixed that four separate times — and wrong about what it was adding up. It
summed requests and called them people.

Four times I found this bug by asking "is this URL reachable by a crawler?"
That question has an answer and I kept getting it right. The question I never
asked was "what is one of these?" — and one `hits()` is one request, so a
visitor who reloads is a crowd.

So the check is two questions now, not one. **What does a stage count, and what
is one of them?** A funnel is denominated in people or it is not a funnel.

## The filters that protect the number can be the thing destroying it

Two separate defects on the same day, both of them exclusions doing too much
work quietly.

`who.mjs` asked Cloudflare for 500 rows grouped by address × path × status ×
agent, ordered by count descending. My own machine puts thousands of requests
across dozens of paths and six user-agents at the top of that list, so the
strangers — one page, one request, once — were in the tail, and the tail fell
off the end. It reported 52 addresses on a day with 391. A cap that silently
truncates is worse than a query that fails, because a short list looks like a
quiet day. **Any capped query must say when it hit the cap.**

And the scanner rule — 3+ 404s means a probe — was excluding a real iPhone
from the funnel, because iOS Safari asks for `/favicon.ico`,
`/apple-touch-icon.png` and `/apple-touch-icon-precomposed.png` on its own.
That is exactly three, and the site served none of them. The rule was written
to catch things hunting for leaked `.env` files and it was catching the most
engaged visitor of the day.

Both of these made the site look emptier than it is, which is the dangerous
direction: it argued for "nobody is coming, get more traffic" when the
evidence available says people arrive, stay, and do not click Download.

The general shape: **I check what my measurements include and not what they
throw away.** Every exclusion is a claim about somebody, and it should be as
suspect as the number it protects. When an exclusion fires, look at who it hit.

## Measuring what the browser fetched is not measuring what a person did

Five times now I have fixed a funnel stage by changing *which file* it keys on:
chunk-*.js counted landings as books, the calculator HTML counted crawlers as
users, render.js counted clicks as books, the word-list count summed requests
instead of addresses. Each fix was right and each one left the same underlying
limitation in place, which I never once named: every stage of that funnel is a
*side effect*. A file the browser happened to fetch, that I then interpret as
an act.

Side effects are wonderful when they are free and honest — no script, no
cookie, nothing to maintain — and they run out exactly where the interesting
questions start. "Did not bounce" was an idle-timer prefetch: it fires whether
the visitor scrolled, typed, pressed something, or put the phone down. So when
the dashboard finally said "7 people stayed, 0 downloaded", the honest answer
to *why* was that I had no instrument pointed anywhere near it. Not a bug. A
thing I never built.

The fix was small — eight empty 1x1 GIFs, the path as the whole message — and
the reason I had avoided it for weeks was a rule I had never examined: "no
beacon" felt like part of the privacy promise. It is not. The promise is that
nothing you *type* leaves your browser. A content-free path tells me that
somebody pressed a button and tells me nothing whatsoever about who they are
or what they wrote. Conflating those two cost me the ability to see my own
funnel, and the way to know the difference is to write the distinction into the
test: closed path set, GET, no body, no key=value pairs. Now the promise is
enforced instead of merely felt, and adding a *parameter* to a beacon fails the
build.

Two practical things fell out of it that generalise:

**A beacon that 404s is worse than no beacon.** It would have landed in my own
scanner rule — the one that files an address asking for things that do not
exist as an attacker — and every visitor would have been excluded from their
own funnel by the instrument built to measure them.

**Verify the arrival, not the departure.** Playwright's request event fires
when a request is *issued*. The handoff beacon fires on a click that navigates
away, and an outgoing document's <img> request is cancelled — so the test would
have passed green on a beacon that never reached the edge. I checked
Cloudflare's own log instead, and only then knew that keepalive had worked.

## I fix the page I am looking at, and never the pages I am not

Three times now the same defect: the button is nowhere near the moment that
earns it.

    phone thumb bar      Download was 5.4 screens below the hero CTA
    #previewDownload     Download was 3.64 screens below the preview
    calculator handoff   "Make a book free" was 4.4-5.4 screens below the answer

The first two I found, understood, and fixed properly — measured in screens,
written up, tested. Then I went back to the generator and left the three
calculator pages exactly as they were, for days, while simultaneously writing
in this log that the calculators are the only pages search has ever carried
here and filming a video whose entire subject is that handoff. I believed the
calculators were the front door and never once opened it myself on a phone.

The pattern is not "buttons drift downward". It is that I diagnose on the page
I happen to be working on and never ask *where else is this true*. A fix that
is really a class of fix needs a sweep, and the sweep is the cheap part — three
`getBoundingClientRect` calls in a loop found all of it in under a minute.

And the reason it reached 4.4 screens was not a decision. It was an article
growing above a button, one paragraph at a time, with nothing watching. So the
fix is not only the new button; it is the assertion next to it — every
calculator, 390px viewport, door within two screens, thumb-sized, still
carrying the book in its href. Placement that matters has to be a test, or it
decays back to wherever the prose pushes it.

## An error message names the call that failed, not the reason it failed

`wrangler pages deploy` returned `Authentication error [code: 10000]`, so I
diagnosed an authentication problem. I even did supporting work: proved the
token still read `/accounts`, proved the analytics GraphQL query still ran,
concluded the one thing it had lost was Pages, and asked the boss to fix it.
They did. It changed nothing, because the site is not a Pages project. It is a
Worker with static assets, `wrangler deploy`, written in `app/wrangler.jsonc`
since 18 September. Cloudflare returns "Authentication error" rather than "no
such project" on purpose — it will not confirm a resource you have no right to
see — so the error I trusted was structurally incapable of telling me what was
actually wrong.

**Why:** everything I checked afterwards was a check on the *hypothesis I had
already adopted*. Two confirmations that the token worked elsewhere felt like
investigation; they only narrowed a possibility I had invented. Not once did I
test the premise that a Pages project existed. It did not.

**How to apply:** when a command fails against infrastructure, the first check
is that the thing I am addressing exists and is the thing I think it is — list
it, don't infer it from the error. And an error's category word is the server's
summary for its own convenience, not a diagnosis. Never escalate an
infrastructure failure to the boss on the strength of one.

## After a context break, read the config before running the command it configures

The deploy command I ran was reconstructed from memory across a compaction
boundary, and memory had it wrong. `app/wrangler.jsonc` had the right answer in
it the whole time. Nothing I did that hour was expensive except the four
seconds I did not spend reading a file I knew existed.

**Why:** a summary preserves what I concluded, not what I verified. Commands,
paths, flags and names are exactly the class of detail that survives compaction
as plausible rather than as true — and a plausible command fails in ways that
look like the world's fault rather than mine. [[an-error-message-names-the-call-that-failed]]

**How to apply:** the first time I run any deploy, publish or push after a
context break, open the config or the script that defines it first. Treat every
remembered invocation as a guess until a file on disk agrees with it.

## A test that moves the page by jumping cannot test what a person sees

`test/thumbbar.mjs` passed green for a day on a feature that was invisible to
every human who visited the site. It moved the page with hash links and
`scrollIntoViewIfNeeded`. A person moves the page continuously.

That difference is not cosmetic when anything on the page reacts to position.
An IntersectionObserver fires on a crossing, so whatever you read inside the
callback is sampled at the crossing moment and nowhere else. Jump, and that
moment is your destination. Scroll, and it is the entry edge, four screens
earlier. The condition I wrote was true at the destination and false at the
edge, so the test and the bug agreed with each other perfectly.

The rule I am taking: if a behaviour depends on where the page is, the test has
to arrive there the way a person would, at least once, before any jump. Jumping
is fine for getting to a place cheaply; it is not evidence that the place works.

And the reason this went a whole day: a green test reads as evidence, so I
stopped looking. I had measured the button's *position* twice without ever
loading the page and looking at it. Screenshot the thing.

## "Blocked on the boss" is a claim I have to test before I make it

Twice on 2026-09-21 I filed something as needing the boss when it did not. The
deploy was not blocked on a token permission — there was no Pages project,
because the site is a Worker, and I never checked. The YouTube domain was not
blocked on a pinned comment — every description already carries the URL three
or four times as clickable links, and I never opened one.

Both had the same shape: I reasoned about the obstacle instead of looking at
it, and reasoning produced a plausible obstacle that happened not to exist. The
cost is not just my time. The boss edited a token for nothing, and a request to
them is the most expensive thing I can spend.

Rule: before writing "blocked on the boss", open the actual artifact — the
config file, the live page, the published post — and confirm the obstacle is
there. If I cannot point at it, it is a hypothesis, not a blocker.

## A rate with a denominator under ten is not a finding

The funnel says 7 of 8 people who stayed never scrolled to the tool. That is
the number I have been optimising against, and one person either way moves it
from 12% to 25%. Every conversion rate on this dashboard has n under ten.

I can keep improving the page indefinitely and never be able to tell whether
any of it worked, because the measurement cannot resolve the effect. When the
denominator is that small the honest move is to stop tuning and go get traffic,
then read the funnel when it can answer. Measuring the distribution took five
minutes and changed what I should work on; measuring the funnel again would
have changed nothing.

## Build the instrument before you interpret the number

"61 word-list visits, 0 click-throughs" looked like an intent problem for a
day. I shipped a JavaScript beacon to make it falsifiable, and the answer came
back 0 of 68 — every visit was a crawler. Nobody was ever there to have intent.

The number was not wrong; it was measuring something other than what I read it
as. "Requests not carrying 'bot' in the user-agent" and "people" are different
quantities, and the gap between them is the whole finding.

So: before reasoning about why a number is low, ask what the number would have
to be counting for the reasoning to hold, and check that it counts that. If it
does not, the cheapest next move is usually to build the measurement, not to
theorise harder about the one you have. The beacon took twenty minutes and
retired a whole day of speculation.

## The channel list is two items long, and I should stop pretending otherwise

2026-09-23. I had been carrying six possible ways to reach a buyer. The boss
answered three questions in one message and the list collapsed:

- Reddit — **closed.** The post drew abuse at the boss personally.
- Paid — **closed.** No budget, and the condition attached ("something that
  unlocks sales with 100% certainty") describes nothing that exists.
- Pinterest — **suspended**, appeal not yet permitted.
- YouTube — 28 views, 0 clicks, and I had already ruled no more Shorts until
  one earns a `/go/` click.

What is left is search, and the build log. That is the whole list, and both are
mine alone: no account to be granted, no budget, no permission.

The useful consequence is that it settles a question I kept re-opening. Every
time the funnel showed ten people a week I was tempted to go back to the press
and tune it. Two channels means the tuning has no traffic to act on and will
not for weeks. The work that matters is the work that makes search find the
estate, and the work that makes the log worth finding — and I have now fixed
two real defects in the first (stale `lastmod`, ninety pages linking to each
other zero times) that were invisible while I was theorising about buttons.

The second thing this message contains is not a channel fact at all. **A KDP
community cursed out the boss for mentioning this product.** That is the most
direct audience reaction this app has ever produced — more direct than any
number on the dashboard — and I do not yet know whether it was "no self-promo
here" or "tools like yours are why Amazon is full of junk". Those point at
opposite positioning. I asked rather than guessed, because getting this wrong
means writing marketing aimed at people who resent the thing I am selling.

**2026-09-24 — Search is not a channel yet, measured.** Four impressions in two
weeks at average position 30.8, across 100+ indexed URLs. Too few to separate
"ranks low" from "no demand" — position 31 alone suppresses impressions. But it
settles the practical question: the product site's own search presence will not
deliver a stranger on any timescale I control. Effort goes to the assets that
already rank (the build log on dev.to, the two GitHub READMEs) and to making each
post something a KDP seller would search for. No more on-site search work until
impressions move on their own. Next useful fact: the Queries/Pages tabs — which
four searches, which pages.

## Not building: a finding has to change the plan, not just the log

2026-09-25. On dev.to a reader (mythex) put it this way: "A finding like 'stop building state pages' has to change the plan the generator reads, not just the log it writes." Git shows the order of events. All 50 state word lists shipped on 09-18 between 11:44 and 13:23 CT. The note that five competitors already rank for these phrases was written on 09-23. I knew the competitors existed from 09-13 and still never checked what ranked for a page's title before building it. No word list has been added since 09-18.

So this list is read before any page-building work. It overrides a day's plan until a measurement listed here says otherwise.

- **No new word-list, state, theme or type page.** The shape is already covered by established sites. For three exact state titles, page one was dedicated puzzle sites with per-state URLs (boss, dev.to reply, 2026-09-25). Lift this only when Search Console shows a query that points at a page I haven't built.
- **Before building any page for search:** search its exact title first. If page one is dedicated sites, don't build it.
- **The Search Console query rows are the only evidence of what Google will rank for us.** Read them before choosing any search work.

## The first customer came from Google search

2026-09-29. The first sale ($19 + tax, 03:08Z) was a stranger (the boss says not them or anyone they know) on a Mac in Chrome. Browser analytics (Cloudflare RUM, account-scoped) record the Mac's first page load at 02:44Z with referrer **www.google.com**, on `/`. In the same minute, a phone on the same home connection running the Facebook app fetched the favicon and social card while facebookexternalhit fetched `/`. The most likely reading is that the buyer pasted the link into Facebook or Messenger themselves. I first wrote that they "came through Facebook", and the boss then asked where Puzzle Press is on Facebook. It isn't anywhere I know of; a web search finds no post. **Read the referrer in RUM before naming a channel.** The request log has no referrer column, and a same-minute fetch by a social crawler is not an arrival. Search is the channel that has now made money: the Search Console query rows would say which search it was.

- **Split a trail by user agent before reading it as one device.** At first I read the Facebook app's user agent as the device that made the book, and nearly built an in-app-browser warning for a problem this visitor never had.
- **One person reached the price with a finished book in hand, and paid** (03:08Z on 09-29, 9 minutes after the free cover's price dialog). I reported "left at the price" a minute before the sale because I read the beacons and never Stripe. **The money check comes before every report**: Stripe checkout sessions on `PAY_LINK_ID`. The cover → price step works as built. Don't touch it.
- **Put the date on every HH:MM.** who.mjs's trail prints bare times. I read 02:44 as the night before when it was twenty minutes old, and then asked the boss about the wrong evening.
- **"No data" on queries beside 4 impressions on a page is Google's privacy
  filter, not an empty room.** Search Console leaves out queries too rare to
  show, and in a 24-hour view nearly all of ours are rare. Ask for the 28-day or
  3-month view of the Queries tab, filtered to the page, before reading the
  queries as missing. Search Console's day runs on Pacific time, so convert
  before matching it to a UTC event: the 02:44Z sale is 7:44 PM on 9/28 there.
- **Three months, filtered to the page, still showed no queries.** So we won't
  learn our search words from Search Console at this volume, and I should stop
  asking the boss for them. The page-level numbers are what's readable:
  impressions, clicks and position per page. Judge the spine table and the
  snippet on those from about 10-06, and don't build pages to match a query
  guess nobody can check.

## Trace Press gets its own folder: shared history, separate blast radius

The boss agreed to `tracepress/` (2026-09-29). What I take from it:

- **One repo** means the build log, the dev.to pipeline and the zoo mirror
  cover both apps without new accounts.
- **A separate package** means a Trace Press deploy or test can't break the
  app that is earning. Code shared with Puzzle Press is copied, not imported.
  When I fix a bug in a copied piece, I check the other copy in the same
  commit and write down that I did.
- **Building can start:** the scaffold, the stroke-order glyph table, and
  the renderer and its print-rule tests are all local work.
- **Still waiting:** deploying needs the domain, and selling needs the
  Payment Link. I don't guess either. Until the boss answers, the unlock stays
  pointed at nothing.

## 2026-09-30: the first buyer came back on a second machine

- **What happened:** three and a half hours after paying, someone came
  back on a different computer (Linux, Cloudflare WARP). They toured the
  site: word lists, the type pages, the spine calculator, the guide and
  the generator. Then they pressed "Already paid? Unlock", and it worked.
  The boss says it wasn't them. Only the paying email passes the check,
  so this was the buyer.
- **What that tells me:** the unlock-by-email design did its job with no
  help. A paying customer uses Puzzle Press on more than one machine and
  reads the free pages after buying, not only before.
- **Taken:** don't ask the boss whether they did something that needs
  information only the buyer has. Check what the action requires first;
  here the verify status alone answered it.
- 2026-09-30 — "it shows both" (zoo) and "already submitted" (Trace Press sitemap in Search Console).
  - Decision (2026-09-30): leave `now.md` as it is. The boss is content with how the zoo shows the two apps. Trace Press reaches the zoo through the log and commit titles. My log entries carry the tracepress links, because loglinks requires them and the log is published verbatim.
  - Decision (2026-09-30): Search Console has the Trace Press sitemap. Stop asking about it. The next thing to read is Trace Press impressions in Search Console, around 10-07, the same way /spine-calculator was read, and only if the boss offers a screenshot. IndexNow already covers Bing and Yandex.
- 2026-10-01 — "The repo for trace press is your call."
  - Decision: **yes, public**. The Puzzle Press GitHub README is one of only two outside sources that have ever sent a real person (09-26), and Trace Press has no outside source yet. The boss has already said public is fine for both existing repos (09-15).
  - Prepared: `tracepress/` now stands on its own. It has its own Playwright dev dependency, and `traffic.mjs` reads keys from the environment when the parent credentials file is absent. `git subtree split --prefix=tracepress -b tracepress-export` gives 33 commits. A scan of every added line found no key patterns and no token-shaped strings. A fresh clone passes `npm ci`, the 57 unit tests and the 109 live browser checks.
  - Blocked on one resource: I can't create a GitHub repository. The token was scoped to `puzzle-press` when the boss made that repo, and I don't extract it. So the boss creates the empty public repo and gives the token write access, as on 09-10. Then I push `tracepress-export` to its `main`.
  - Also taken: "already submitted" (09-30) answered the Request indexing ask too. Stop listing it as pending.
- 2026-10-02 — Search Console access, my own (`.search/search.mjs`).
  - Taken: stop asking the boss for Search Console numbers or screenshots. Read them myself, and check `inspect` before claiming a page is or isn't in Google.
  - Taken: most Trace Press pages are not "not indexed", they are **unknown** — Google last read the sitemap when it had 20 URLs. So the fix was a resubmit, and from now on: resubmit the sitemap once on a day it changes (cap 5/day), not after every page.
  - Taken: Puzzle Press's guide and three type generators are "crawled - currently not indexed". The tool's README says resubmitting does not fix that; better content and inbound links do. So any Puzzle Press search work goes to those pages' substance, not to pings.
  - Taken: the spine calculator's 09-26 spike (47 impressions) fell to ~5/day. The 09-29 snippet rewrite is judged against ~5/day, not against the spike; read with `query` around 10-06.
  - Taken: the 09-28 buyer arrived from Google but shows as no click in Search Console. Data runs ~2 days behind and hides rare queries; don't build a story on one missing click.
  - Re-check ~10-03/04: `sitemaps` for the Trace Press read, then `inspect` the 10-01/10-02 pages.
- 2026-10-02 05:10Z — from my own Search Console reads.
  - Taken: internal link count doesn't decide indexing here. The PP pages with 103 inbound links are crawled-not-indexed, while /compare (5) is indexed. Don't answer "not indexed" with more nav links.
  - Taken (lead, unproven): the only indexed type generator shares the least text with its siblings (23% vs 29–42%). Unique per-type substance is the next lever for PP, if any.
  - Taken: Google fetches a resubmitted sitemap within seconds. "Unknown to Google" pages are a stale-sitemap problem, fixed the same day.

- 2026-10-02: Trace Press is public at github.com/walkertbrown/trace-press.
  - Taken: re-split (`git subtree split --prefix=tracepress -b tracepress-export`) and push after Trace Press commits, as `app-export` is for Puzzle Press. The traffic script finds this network at run time, so no home address is in the history.
  - Taken: the Puzzle Press README is the only external source that has sent a human (09-26). The Trace Press repo is the same kind of door, so its README should stay current with the site.

- 2026-10-05 23:20Z — from my own Search Console sweep (inspect, all 35 Trace Press pages) and the zone logs.
  - Taken: the 10-02 line "unknown to Google is a stale-sitemap problem, fixed the same day" was wrong. Google read a 62-URL sitemap today at 20:24Z, and 28 of 35 pages are still unknown. Only / and /name-tracing are indexed; /handwriting-paper, /cursive-name-tracing and /transportation-tracing-worksheets are crawled, not indexed.
  - Taken: nothing is blocking Google. In 7 days Googlebot made 97 requests to Trace Press: 42 for robots.txt, 16 for the sitemap and 8 for sitemap pages, and 96 got a 200. On Puzzle Press it fetched 10 sitemap pages. Google keeps re-reading the sitemap and choosing not to crawl. That is low demand for a new host, not a fault. `crawlers.mjs` now prints this split and the status codes for every engine.
  - Taken: so new Trace Press pages are paused. 66 URLs with 8 page fetches a week means another page waits in the same queue, and many pages made from one template can count against a new host. The next blocks go to what raises demand: links from places that are already crawled, and the substance of the pages Google did crawl and turn down.
  - Re-check ~10-12: re-run `inspect` on all 35 pages. If the 10-05 pages are still unknown while older ones moved, that is the queue, not the pages.

- 2026-10-16 — from KDP's own "KDP Community Guidelines" help page (fetched 11:08Z), and a read of the dev.to account.
  - Taken: a KDP Community login is for answering questions, not for announcing the apps. The guidelines allow "External website links that are relevant, helpful, or provide an example for discussion related to the discussion topic". They forbid "Advertisements or solicitations for external web sites, contests, paid service offerings" and "requests for Community members to be your potential customers". So the free spine, margin and royalty calculators can go in a reply to a cover, margin or printing-cost question. A link to a $19 generator is an advertisement.
  - Taken: the dev.to account has 24 posts and 4 reactions in total, and none of them are on the KDP posts. The log reaches developers, not KDP sellers. It is a record, not a channel to plan sales around.
  - Taken: r/KDP's sidebar names Facebook as the place to promote, and the boss has never been asked whether they can bridge Facebook groups. That is the platform question still open.

- 2026-10-16 15:10Z — from reading the KDP Community forum. It is public: no login is needed to read it, only to post. It is a Salesforce site, so read it with Playwright, not curl.
  - Taken: the forum's regulars ("Top Contributor") answer cover and margin questions at length. A rejected-cover thread ("insufficient gutter margin", 320 pages) has 27 answers and 243 views.
  - Taken: a member who announced a formatting tool they'd built ("I ended up building my own tool", 61 answers, 900 views) was met with "Begin by linking to your book… It kind of just sounds like you didn't know how to use Word." A tool announcement there draws scrutiny, not users. The only fitting use of a login is the one already set: answer the question asked, and link a free calculator only where it is the answer.

## 2026-10-16 17:45Z — The YouTube channel is shared; post Shorts on the day
- The Buffer account that now holds Bananafest Destiny belongs to more than one project, and its 10 scheduled slots are theirs. Queueing ten Shorts ahead would push their posts out.
- "Share now" doesn't take a scheduled slot. So Shorts go out one a day at posting time: `node app/scripts/buffer-share.mjs --post` reads the next one from plan/buffer-youtube-queue.json and records the YouTube link.
- The first went out 10-16 17:38Z: yfHmCXUL3tQ, the alphabet chart Short, public on the channel (checked through oEmbed).

- 2026-10-16 23:00Z — from reading the KDP Community Formatting topic after the boss approved posting there.
  - Taken: the forum is a source of facts as well as a channel. A member's book counted at 79 pages was refused spine text, and KDP's help pages say 79 in some places and 80 in others, so both apps now say 80. Read a forum's rejections before quoting a KDP help page as the rule.
  - Taken: draft replies go in the day's plan with the thread link, for the boss to paste. Nothing is posted without them.

- 2026-10-17 19:10Z: from the two KDP Community replies that cleared moderation.
  - Seen: both went public about 09Z. The word-search answer names Puzzle Press and $19. The 24-page answer gives the cover sizes and then "I made a free spine and cover size calculator…" with the link. About 18:30Z, two regulars responded. On the 24-page thread Michael Quarles wrote "This is a spam post with a link to an offsite product. Beware." (2 likes). On the word-search thread Walk-in the woods wrote "Flagged." The 24-page asker wrote "All good, all figured out" before that, so the answer itself helped.
  - Taken: on KDP Community, putting the answer first and saying "I made it" does not stop a link to your own tool reading as spam. A free tool and a paid one were flagged the same way. The regulars watch new accounts that link offsite.
  - Taken: this is the boss's KDP login, so flags land on their account. My recommendation is that further replies carry no link at all. I gave that recommendation; whether to keep posting is the boss's call.
  - Measured: in 12h, 1 person ran the spine calculator, and RUM shows no kdpcommunity.com referrer. So the replies brought at most one visitor, against two public spam calls.

## 2026-10-18 — The docent pulls the clips itself

The zone log shows a curl sweep that checks every keeper's host for `/media/index.json` in the same minute. It ran at 2026-10-17 21:11Z, when ours did not exist yet, and again at 2026-10-18 07:18Z, when it found the Puzzle Press index and downloaded every clip it listed. Publishing a clip therefore means adding the mp4 and json, rebuilding the index and deploying. Nobody has to pass a link along. A sweep that came after the deploy is the only evidence the docent has a clip; my own checks come from the same address.

- 2026-10-18 19:15Z: from the KDP Community word-search thread, read logged out.
  - What happened: a Community Moderator locked the three-year-old thread, which had been quiet for three months before our 10-16 reply. The note says the thread "is older and may contain outdated information". Our reply, visible and flagged on 10-17, is gone from all 39 answers.
  - Taken: on KDP Community, reviving an old thread with a product reply gets the thread locked and the reply removed. Answer only fresh questions, and still without a link.
- 2026-10-26 ~17:55Z: from the boss, on a Teachers Pay Teachers store.
  - What happened: asked whether to open a TpT seller account for the new kindergarten sheets, he said "Let's stick with the app for now".
  - Taken: TpT stays a place to read what teachers buy, not a place to sell. Teachers reach the sheets through search and the Trace Press pages, so the free pages have to be found on Google and Bing, and the $19 licence has to be worth it inside the app: own words on cards, a whole class of names, no footer.

2026-10-31 — Etsy, for Trace Press. The boss has an Etsy account and will pay its fees: $0.20 a listing, 6.5% transaction, 3% + $0.25 processing (US), and any setup fee shown at signup. What goes on sale is my call. Etsy is a marketplace people already search, which is the one thing both apps lack. So it's three Etsy-only packs, each with more pages in one file than the free site gives, so no buyer pays for something they could have had free in the same form. Judged four weeks after the listings go live, by Market-Nana's 10-21 test: under 30 views in total closes Etsy, 150 or more with no sale fails the packs, 3 sales passes. I make the files, pictures and listing text. The boss opens the shop and uploads from a forboss/ walkthrough.

2026-11-12 — Medium, read before asking for an account (the Tes lesson). Closed, nothing sent to the boss.
  - What its own help pages say (all four edited 2026-11-11, read through the help centre's article feed because the web pages refuse a script): "Medium is for human storytelling, not AI generated writing." Its distribution guidelines list what keeps a story out of General Distribution, and three items on the list are us: "AI-generated content", "Sponsored content, content marketing, PR pieces", and "Stories that have a primary point of gathering signups/traffic, selling something". Such a story gets Network Distribution: the writer's followers only. A new account has none. Its SEO page says a new account's stories are held out of Google until the account is trusted, and that it discourages people "solely leveraging Medium for search engine optimization". The Medium Rules forbid "posting content ... automatically, systematically, or programmatically", so every post would be the boss pasting by hand. Linking your own product is allowed; that was never the obstacle.
  - What search shows: across four searches for the questions our pages answer (spine width and cover size, making a word search book for KDP, puzzle generators), one result in about fifty was on medium.com. The rest were tool makers' own sites and one affiliate blog.
  - Taken: Medium would show our writing to nobody and its rules name our kind of post three times. Don't ask for an account. The same reading comes first for any other writing platform.

2026-11-13 — Chrome Web Store, read before asking for a developer account. Closed, nothing sent to the boss.
  - What its rules say: nothing bars an AI-built extension. It bars one "with a single purpose of installing or launching another app, theme, webpage, or extension", so ours would have to do the sums inside the extension itself.
  - What its own counts say: the extension closest to ours, an offline KDP royalty and printing-cost calculator, has 5 users. A KDP cover-template overlay has 26. The KDP extensions with installs do keyword research (about 60,000) or fill in the upload form (2,000 to 3,000).
  - Taken: KDP authors do not look in the Chrome store for a calculator. A calculator extension would be a week of work for five users. Don't build it, don't ask for the account.

2026-11-13 — KDP's AI question, and what our own pages said about who wrote the words.
  - What happened: I went to tell publishers how KDP's AI-content question applies to a Puzzle Press book and found our own pages calling the built-in crossword clues "hand-written" (the landing page, the crossword page's search description, llms.txt, one queued Bluesky post) and the 90 word lists "hand-picked" (all 90 list pages). An AI wrote both. A publisher who believed "hand-written" would answer No to KDP, and KDP's rule says AI-written text has to be declared "even if you applied substantial edits afterwards".
  - Taken: a claim about who made something is a fact a buyer acts on, the same as a margin. "By hand" was my shorthand for "one at a time, not from a template", and it read as "by a person". Say who made it. Both guides now quote KDP's rule and say what in our books an AI wrote.
  - Also found: no file of ours had ever been through KDP's Print Previewer, the one check every customer's file meets. Only a KDP login can run it, so the files and the steps are with the boss.

2026-11-14 — Likes on Bluesky: who gives them, and what a feed is.
  - What happened: one printable seller in the homeschooling feed gets up to 88 likes a post, another gets none, we get none. I read the 119 accounts behind the likes. 54 are authors, the rest mostly artists and shops; none mentions homeschooling, preschool or kindergarten. The seller reposts 105 other accounts about 300 times a day and 57 of them like it back. In the #EduSky feed, a post with a picture does no better than one with a link card (107 posts against 56, about half of each with no likes); likes follow the follower count (under 100 followers: 32 of 46 posts with none).
  - Taken: likes on a seller's post say who the seller trades reposts with, not who buys. Don't copy a format because its posts are liked; look at the likers first. For our account the count that means something is a visit with `ref=bsky`, and there has been one.
  - Also found: the CVC post was missing from two feeds. My first guess (the feed wants the word in the sentence, not a tag) was wrong when counted: 23 of 27 tag-only posts taken, 51 of 59 with the word. The real cause was the feed-building service dropping about half of all matching posts for eight hours (8 of 22 against 89 of 89 the rest of the time). A feed is somebody else's machine; a post can miss it for no reason of its own. Count before rewording.

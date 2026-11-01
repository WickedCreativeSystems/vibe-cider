# Facts

Only factual answers the boss has given in conversation. Date it. Use their words. Do not invent a resource, a customer, a number, or an answer they did not give.

They will not help with the idea. Do not file their silence as approval of a product.

When they answer something, append it here, then say so in the conversation.

## Current app

**Puzzle Press** — chosen 2026-09-10. A browser-side generator that turns a word list into a print-ready, KDP-spec word-search puzzle book PDF (puzzles + solution pages, correct trim size, margins, bleed). Free tier is limited and watermarked; one-time payment unlocks full books. Target buyer: people who publish low-content books on Amazon KDP.

The idea is mine. The boss did not suggest it.

## Second app

- 2026-09-29 — Boss, after the first Puzzle Press sale: "So you made your first sale.... That means you have been promoted.... You must now develop and market and sell a second app. Then you will manager 2 apps."

**Trace Press** (working name) — chosen 2026-09-29.
- **What it is:** a browser-side generator that turns a word set (alphabet, numbers, sight words, a child's name, a custom list) into a complete print-ready KDP handwriting workbook. That means tracing pages in print and cursive, the correct trim, margins and bleed, and a full-wrap cover.
- **Pricing:** the free tier is limited and watermarked; a one-time payment unlocks full books.
- **Target buyers:** KDP low-content publishers, plus parents and teachers who want a personalised tracing book.
- **The reasoning** and the candidates I dropped are in `scratch/second-app.md`.

The idea is mine. The boss did not suggest it. Puzzle Press stays live and keeps being run alongside it.

- **2026-09-29, where the code lives:** the boss: "Tracepress/ Is fine". Trace Press code lives in `tracepress/` at the repo root, next to `app/`. That folder is the current app folder for the second app. It is its own package, with its own Worker and its own tests, and it does not import from `app/`.

- **2026-09-29, the domain:** I asked whether it's `tracepress.bananafest-destiny.com`, with the success URL `https://tracepress.bananafest-destiny.com/?paid=1`. The boss: "yes that is perfect". It's in the same zone, under the same Cloudflare token.
- **2026-09-29, the Stripe product:** the boss is setting it up. I recommended the name "Trace Press Unlimited", the description "Unlimited print-ready KDP handwriting workbooks — no watermark, one-time payment", the image `tracepress/brand/stripe-product.png`, and $19 one-time. These match the Puzzle Press product, which is named "Puzzle Press Unlimited".

- **2026-09-29, the Payment Link:** the boss sent `https://buy.stripe.com/bJe14p0IKcKV2gzblBeIw01` with the ID `plink_1UL3wZRo6ix1hE5vuzRD7tSY`. I read it through the API (without opening the buy page). It's live and active. The product is "Trace Press Unlimited" with the recommended description and one image. The price is $19.00 USD, one time. After payment it redirects to `https://tracepress.bananafest-destiny.com/?paid=1`. Automatic tax is on, billing address is auto, and promo codes are off. All of these match the Puzzle Press link. This ID becomes the Trace Press Worker's `PAY_LINK_ID`.
- **2026-09-29, test mode:** the boss said "That was all live stuff from stripe, just so you know". So Trace Press has no test-mode Payment Link. Any purchase through its link is real money. The unlock path is tested against a stubbed Stripe (`tracepress/test/verify.test.js`) and a local Worker, never by paying.

Still not answered (asked 2026-09-29): how the logs split. Until the boss says otherwise, the logs use one plan and one actual file per day, with a section per app.

## Given

- 2026-09-10 — Cloudflare token: asked whether a workers.dev account and the "cider" token exist now. Answer: "I will create when you ask, but I'd like you to decide the plan first."
- 2026-09-10 — GitHub push credentials (`.git-credentials` missing): "I will get that for you."
- 2026-09-10 — Payments: "I currently have stripe, why do you prefer one of the others?"
- 2026-09-10 — Marketing platforms: "I can create an account for whatever. I have a reddit I can post to, fairly new. and reddit groups generally don't allow advertising your products."
- 2026-09-10 — Cloudflare plan: "yes currently free plan"
- 2026-09-10 — "you have everything you need" (re: GitHub push credentials and the Cloudflare token).
  - Observed, same day: `/home/walker/vibe-cider/.git-credentials` contained a GitHub line `https://walkertbrown:github_pat_…@github.com`. Git authenticated with it but the push was refused: `remote: Permission to walkertbrown/vibe-cider.git denied to walkertbrown` (HTTP 403) — the token lacks Contents/write.
  - Observed, minutes later: that GitHub line is gone; the file now holds only `CLOUDFLARE_API_TOKEN=cfat_…` and `CLOUDFLARE_ACCOUNT_IS=<account-id>`. Git has no credential to read at all.
  - Cloudflare token is a valid account-owned token for "Walkertbrown@gmail.com's Account" (9e429253…) but has no Workers permission: `/accounts` returns success, every `/accounts/<id>/workers/*` endpoint returns error 10000 "Authentication error", and `wrangler deploy` exits 1 without uploading.
- 2026-09-10 — Cloudflare token scope: "It is on there scoped to the domain bananafest-destiny.com"
  - Verified: the token lists exactly one zone — `bananafest-destiny.com` (4169ea6b…), status active, plan "Free Website". Zone endpoints succeed (`dns_records`, `workers/routes`, `settings/ssl` all return success:true). Account-level Workers endpoints still return 10000 "Authentication error".
  - Fact recorded: this job's Cloudflare account owns the domain **bananafest-destiny.com**.
- 2026-09-10 — Studio name and domain: "We will use puzzlepress.bananafestdestiny.com.... Bananafest-Destiny is our app development studio name. Everything we make will be under that name"
  - Note: the registered zone is **bananafest-destiny.com** (hyphenated). `bananafestdestiny.com` (no hyphen) has no DNS and is not in this Cloudflare account. Deployed to the hyphenated spelling: `puzzlepress.bananafest-destiny.com`.
- 2026-09-10 — Tokens updated: Cloudflare token now has account Workers permission (`/workers/scripts` returns success). GitHub line restored to `.git-credentials`, but `git push` still fails: `remote: Permission to walkertbrown/vibe-cider.git denied to walkertbrown` (403).
- 2026-09-10 — "I made you your own puzzlepress repo" → `walkertbrown/puzzle-press` (public, default branch `main`, seeded with a README).
  - Verified: the GitHub token can **write** to `walkertbrown/puzzle-press` but still **not** to `walkertbrown/vibe-cider` (403 `Permission to walkertbrown/vibe-cider.git denied to walkertbrown`). The token appears scoped to the app repo only.
- 2026-09-10 — "ok I put in the key": `STRIPE_KEY=rk_test_…` (restricted, TEST mode) and `PAY_URL=https://buy.stripe.com/test_6oU8wR4Z026hf3lgFVeIw00` added to `.git-credentials`.
  - Verified: key reads Checkout Sessions (200). Set as a Worker secret with `wrangler secret put STRIPE_KEY` — it is not in the repo.
  - Verified: the payment link's success URL is already `https://puzzlepress.bananafest-destiny.com/?paid=1`, and the product reads "Puzzle Press — Puzzle Book created for you! — $19.00 per puzzle book". Stripe account display name on checkout: "Walker Brown".
  - Verified by a real test-mode purchase (`cs_test_a1feUnfz7vGt5E`, complete, paid, $19.00 USD): buyer paid, was redirected back, unlocked with the purchase email, downloaded a 30-puzzle/38-page book with no watermark, and the unlock survived a reload.
- 2026-09-10 — Support address: "you can give them support@bananafest-destiny.com", then "Also support@bananafest-destiny.com totally works" with a screenshot showing a message from a different Gmail account arriving in the inbox, mailed-by porkbun-email.com.
  - My own delivery test was inconclusive because I sent it from the same mailbox the alias forwards to, and Gmail does not deliver you a copy of your own message. The boss's test used a different sender, which is the correct way to check a forward. Address published on the site.
- 2026-09-11 — Boss: "I'm not buying one." (Will not make a live $19 test purchase.)
- 2026-09-11 — Boss: "I'll take care of console." (Search Console indexing requests.)
- 2026-09-11 — Boss: "I can make you a reddit account and post to it if you'd like. I won't use mine. I can make you whatever accounts."
- 2026-09-11 — Boss created accounts and connected them to Buffer (MCP): Pinterest business account `bananafestdestiny` (five boards, named as I suggested) and YouTube channel `Bananafest Destiny`. Buffer free plan: 3 channels, 10 scheduled posts. Buffer account timezone America/Chicago. "I can make you whatever accounts."
- 2026-09-11 — Boss, on queuing the five Pinterest pins and the YouTube Short from Buffer: "do it." Queued.
- 2026-09-11 — Boss uploaded the landscape video to the Bananafest Destiny YouTube channel: https://youtu.be/ph6q2ih6cBs (verified public via oEmbed; title as I supplied; channel handle @BananafestDestinyDev).
- 2026-09-11 — Boss claimed `puzzlepress.bananafest-destiny.com` on the Pinterest account (sent me `<meta name="p:domain_verify" content="69a0b4d0…">`; "it just said success and then unclaim. So we should be good"). Verified by Pinterest at 3:28pm CT.
- 2026-09-11 — Boss, on Search Console indexing for the guide and the three type pages, and the Pinterest blocked-site appeal: "THose things are both already taken care of."
  - 2026-09-12 — Correction from the boss on the Pinterest appeal: "how do I file the appeal. I never did." Search Console stands; the appeal is not filed as of 2026-09-12.
- 2026-09-12 — Boss, creating a pin by hand on pinterest.com with the link `https://puzzlepress.bananafest-destiny.com/`: Pinterest shows "Sorry! We blocked this link because it may lead to spam." (screenshot). Filing the appeal under "A Pin from my website is blocked for Spam".
- 2026-09-12 — Pinterest spam-block appeal: "submitted" (boss, ~1am CT).
- 2026-09-12 — Boss sent a screenshot of bookbolt.io/pricing/ (taken ~1:30am CT): **Pro** "$0.66/day · *$19.99/mo, billed annually" (struck-through $0.79/day), "For your first published books", includes "Puzzle, crossword & sudoku creation tools", "Cover & interior designer (Book Bolt Studio)", "1,000 monthly AI credits"; **Premium** "$0.99/day · *$29.99/mo, billed annually" (struck-through $1.18/day), "Everything in Pro, plus 4,000 monthly AI credits…"; both "Start My Free Trial — Full access for 3 days · cancel in two clicks". Month-to-month prices not shown in the screenshot.
- 2026-09-12 — Boss: "Pinterest denied the site" (the spam-block appeal for puzzlepress.bananafest-destiny.com was refused).

- 2026-09-13 — on the dashboard showing one real (JavaScript-running) visitor
  in 24 hours: "that was probably me as well."
- 2026-09-13 — Asked whether "Successful payments" is switched on under Stripe's
  customer emails on the live account, boss: "it is." So a live buyer does get a
  Stripe receipt, and the address on that receipt is the one the unlock expects.

2026-09-13 — Reddit. Boss has an account and can hand it over: **u/wubbydubbybubby22**.
Their words: "I have never really used the account, but it is old." So: aged, but
effectively no posting history. Karma and cake day not yet known — asked.
Boss then sent the profile numbers: **23 karma, 22 contributions, 6 years old,
0 followers, 0 gold, active in 4 communities.** Six years clears every
account-age filter. 23 karma clears the low minimums (10) and fails the higher
ones (50, 100).
Boss then created a Reddit-only password for that account and sent it, because I
had asked whether they could hand me the login. Not recorded here and not stored
anywhere on disk. It is unusable from this machine in any case: reddit.com
returns 403 to every request from here — curl with a browser user-agent, the
public `about.json` and `rules.json` endpoints, and the fetch tool alike. I
cannot read a subreddit, check the account, or verify a rule. Reddit is a
channel I can write for and never see.

2026-09-13 — r/KDP rules, pasted by the boss (I cannot reach Reddit to read them
myself). Two that decide everything:
- **Rule 1, "No Book Promotion."** "r/KDP no longer allows book promotions. Any
  such submissions will be removed." The sidebar then names where to promote
  instead: Facebook, Instagram, YouTube, Pinterest, TikTok, Amazon Ads, Google
  Ads, Pinterest Ads, Facebook Ads.
- **Rule 2, "No Amazon Product Links."** No Amazon book links of any kind.
  "Links outside the Amazon ecosystem are allowed **in comments only** if they
  are how-to guides or directly helpful to the OP in context."
Moderators listed: u/Awkward_Blueberry_48, u/FirefighterLocal7592,
u/Fun-Attitude-2546, u/ricardofayet. The last of those is Reedsy's — the sidebar
links Reedsy's KDP guide as the resource, which says who is watching for
self-promotion.
So r/KDP has no post shaped like a launch. The only thing that is permitted
there is a comment on somebody else's question, and a link only when it is a
how-to and answers what they actually asked.

2026-09-14 — Product Hunt launch scheduled, link pasted by the boss:
https://www.producthunt.com/products/puzzle-press/puzzle-press/prelaunch
That prelaunch URL is 404 to anyone signed out — it is the boss's editing view.
The public page is **https://www.producthunt.com/products/puzzle-press** (200,
readable by me unauthenticated), and the discussion forum path is `/p/puzzle-press`.

Read out of that page's own HTML, not a summary of it:
- **Post id 1250478, `createdAt` 2026-09-15T00:01:00-07:00** — scheduled
  correctly for 12:01am PT Tuesday, which is 2:01am CT.
- `og:description` is our description, exactly as written.
- Eight images uploaded (7 PNG + 1 GIF on ph-files.imgix.net), which matches the
  thumbnail plus the seven gallery files.
- **`og:title` and `<title>` read "Puzzle Press: Print-ready word search books
  for Amazon KDP".** The tagline field says *word search*, not *puzzle*. Flagged
  to the boss the same morning; the packet's tagline is "Print-ready puzzle books
  for Amazon KDP".

2026-09-14 19:55 — the boss pasted the launch URL:
**https://www.producthunt.com/products/puzzle-press?launch=puzzle-press**

Verified from the page's own HTML, unauthenticated, from this machine:
- `/posts/puzzle-press` **404s.** Product Hunt no longer uses the `/posts/<slug>`
  form I had guessed at in the runbook; a launch lives at the product page with
  a `?launch=` parameter. The guessed URL in `launch-day.md` was wrong.
- The tagline is now **"Print-ready puzzle books for Amazon KDP"** in `<title>`,
  `og:title` and the embedded JSON. The boss's fix landed; the "word search"
  version recorded above is gone.
- `firstPost` is id **1250478**, `createdAt` **2026-09-15T00:01:00-07:00**.
- `"latestLaunch":null` and `"postsCount":0` — which is what an unlaunched
  product looks like. **This is the tell for "has it gone live yet":** after
  2:01am CT `latestLaunch` becomes non-null and `postsCount` becomes 1. One
  cheap check, no login, no hammering.
- `discussionForum` id 738670 at `/p/puzzle-press`, with no threads yet.
- Outbound website link is `https://puzzlepress.bananafest-destiny.com/?ref=producthunt`.
- This machine's IP is **no longer bot-challenged** by Product Hunt — the block
  from this morning's 401-request loop has expired. 200, 225KB of real HTML.

2026-09-14 — Cloudflare zone analytics cannot attribute traffic by referer on
this plan. `clientRefererHost`, `clientRequestReferer`, `clientRequestQuery` and
`clientRequestQueryParameterNames` all exist in the schema (introspected
`ZoneHttpRequestsAdaptiveGroupsDimensions`, 102 dimensions) and all four return
"zone ... does not have access to the field". Readable dimensions are
`clientRequestPath`, `clientIP`, `userAgent`, `clientCountryName`. So the
`?ref=producthunt` on the outbound link is invisible to me, and Product Hunt
traffic is identifiable only by timing.

2026-09-15 00:5x — **Both repositories are public, and the boss confirms that is
intended.** Checked signed-out: `github.com/walkertbrown/puzzle-press` 200,
`github.com/walkertbrown/vibe-cider` 200, and
`raw.githubusercontent.com/walkertbrown/vibe-cider/main/marketing/launch-day.md`
200. Asked whether the build log should be made private now that `marketing/`
lives in it — the launch runbook, the prepared answers, the Pinterest
spam-block note. Answer: **"public is fine."**

So nothing written anywhere in either repository is unpublished. `marketing/`
stays where it is and the split is about what belongs where, not secrecy. Do not
propose privatising either repo again, and do not write anything into them on
the assumption a stranger will not read it.

2026-09-15 — **The Stripe checkout page shows the boss's personal name, not a
business name.** Asked whether the merchant display name on the card form reads
Bananafest Destiny or a personal name. Answer: **"its just mine."**

I cannot see this myself and cannot fix it: the key is `rk_live_…` and read-only,
`GET /v1/account` returns 403 (needs `connected_account_read`), and loading the
payment link to look at the page would create a real Checkout Session. The
statement descriptor is already "PuzzlePress" — that part is right; it is the
public business name on the account that is the personal one.

2026-09-15 11:1x — **The single Product Hunt comment is the boss's own maker
comment**, posted in the first minutes per §8 of `ph-schedule-packet.md`. Asked
because the count read 1 and I had read 0. Answer: **"that's what the comment
is. it is mine."**

So the thread has had no comment from a stranger all day. `ACCOUNTED = 1` in
`app/scripts/phwatch.mjs` now carries this, and the script says "nothing unread"
below 2 and names the number above it. Raise the constant when a comment is
pasted.

2026-09-15 11:23 CT — **The business name change did not take.** The boss said
Stripe was done; the product half was (image renders, description reads
"Unlimited print-ready KDP puzzle books — no watermark, one-time payment", price
$19.00, no sandbox badge). The name half was not. `npm run test:livecheckout`
screenshots the live card form, and the personal name appears three times on it:

    Walker Brown                     (top left, beside the icon)
    Pay Walker Brown                 (the heading, above $19.00)
    ...provided by Walker Brown      (the terms line under the Pay button)

The field is the account's **public business name**, not anything on the product
or the payment link. Stripe falls back to the individual's name when the account
has no business name set.

Also visible on that page, and not previously known: checkout is **Link-first**.
The right panel is Link-branded, the card fields sit behind a "Card" accordion,
and the footer says "Sold through Link".

2026-09-15 11:3x — **The Stripe public business name is the boss's own name, and
always has been.** Told, after I reported the card form reading "Pay Walker
Brown" three times: *"the business public detail is and has always been my
name."* So that field is not unset and did not fail to save — it is set to their
name, which is why checkout says what it says.

Do not report this as a bug again. If it is ever to change it is the boss's
decision and not a defect, and the field is Settings -> Business -> Public
details -> Public business name.

2026-09-16 — Boss pasted a Cloudflare Web Analytics beacon snippet with a
token (`<token>`) and said "Use this for cloudflare
analytics." Added to all 44 public HTML pages (the two generator scripts,
`scripts/type-pages.mjs` and `scripts/word-list-pages.mjs`, plus the 6
hand-written pages), rebuilt, deployed. Verified live on the homepage and a
sample theme page. This is Cloudflare's separate client-side Web Analytics
product — cookieless, no PII, pageview/referrer/country only — distinct from
the zone-level GraphQL analytics already used in `scripts/traffic.mjs`, which
cannot see referrers on this plan. This finally makes "was that visitor from
Product Hunt" answerable instead of inferred from timing.

2026-09-16 09:4x CT — **No prior Hacker News account.** Asked whether the
account used to attempt the Show HN post is old or new (HN's own gate blocked
the post, citing "users who aren't yet familiar with the site"). Answer:
**"I didn't have one before."** So there is no older, more-established account
to fall back on — Show HN via this route is blocked until the account has some
genuine history on it. `marketing/show-hn.md` corrected; it previously said
any account, including new ones, could post.

2026-09-16 — **Live outreach to a self-publishing service, boss-initiated.**
Someone from Kingswell Press (kingswellpress.com — paid editing/cover-design/
formatting/distribution service for indie authors, unrelated to a prior book
project of the boss's, contact number (469) 457-9494) had been texting the
boss unprompted. Boss doesn't know how they got the number or the original
reason for contact. Rather than ignore it, the boss asked them directly by
text whether they work with anyone selling puzzle books on KDP, then pitched
Puzzle Press by name and link (puzzlepress.bananafest-destiny.com), asking
"any suggestions on who to talk to about it? Or perhaps it is something that
y'all would be interested in?" Their replies so far read as generic/possibly
templated ("Yes, puzzle books are a popular category for self-publishing,
including on KDP" / "We can also support you with the design, formatting,
publishing,"). Outcome not yet known — this is a live, in-progress lead, not
a closed fact. Log the resolution here once there's a real answer from them.

2026-09-20 — **dev.to/bananafestdestiny provenance resolved, no boss input
needed.** Flagged 2026-09-19 as an unexplained blog found while researching
indexing, rather than assumed. Checked via WebFetch: the profile page itself
displays "Walker Brown Profile" — display name Walker Brown, handle
`@bananafestdestiny`, joined 2026-09-16, 5 posts, all specifically about this
project's launch. This is the boss's own build-in-public writing under the
studio brand — publicly verifiable, not something that needed asking.

2026-09-20 — **r/KDP post is live, and the boss wants it left vague.** Posted
from u/HeadroomDevs: title "PuzzlePress", body "New puzzle generator!!!" and a
bare link. 22 views / 1 upvote / 0 comments at three minutes old. I proposed
editing the body or adding a substantive first comment (what it makes, that it
is free, the spine-width angle from `marketing/reddit-kdp.md`) on the grounds
that a reader is given no reason to click. Boss declined: **"No I want to keep
it vague, maybe it will get a click."** Settled decision — their account, their
voice. Do not re-raise it, and do not propose rewrites of this post. The draft
in `marketing/reddit-kdp.md` stays on the shelf unless the boss asks for it.

2026-09-21 — **Search Console: the domain is not the problem, and indexing is
in progress.** I concluded from four platforms' behaviour that the host was
being distrusted and asked whether a dedicated domain was available. Boss, who
has the Search Console the conclusion needed: **"the domain is fine, get over
it. the only page according to console thats appeared in a search was one of
your calculators. For puzzlepress it says crawled not indexed, that means its
coming"**.

Two facts I did not have:
- **One of the calculator pages has appeared in a live search.** That is the
  site's first confirmed organic impression.
- **The Puzzle Press page's Search Console status is "Crawled – currently not
  indexed."** Google has the page and is holding it, not failing to reach it.

Settled: do not raise the domain again, and do not propose moving or
re-registering it.

2026-09-21 (later) — **The crawl is an hour old.** Boss sent the Search Console
URL-inspection panel for the Puzzle Press page: *Crawled successfully on Sep 21,
2026, 1:20:32 AM. Crawled as Googlebot smartphone. Crawl allowed? Yes. Page
fetch: Successful. Indexing allowed? Yes.* Their read: **"it means that it was
just crawled an hour ago and give it time to index"**.

Nothing is blocking. Nothing is broken. "Crawled – currently not indexed" one
hour after the crawl is the normal waiting state, not a verdict. Do not treat
the absent index entry as a defect, do not re-submit, do not go looking for a
cause. Give it time.

2026-09-23 — **A direct competitor exists and predates this app. No boss input
needed; established by public record.** Found while checking what a stranger
sees on searching for this product. `puzzlebindery.com` does the same job on the
same business model: complete KDP interior plus a full-wrap cover with the spine
width taken from the page count, generated entirely in the browser, free to
build with a watermarked proof, one-time payment to remove it, 30-day refund, no
account. Verisign RDAP gives its registration as **2026-08-09**, a month before
Puzzle Press was chosen on 2026-09-10. Independent convergence on the same
design, and they were first.

Quoted from their own page, fetched 2026-09-23: **$49 once** at launch, "going
up to $79 when the launch ends"; nine puzzle types (word search, maze, sudoku,
crossword, fill-in, codeword, cryptogram, word scramble, number search); 13 KDP
trims plus A4 and Letter; 88 themes; series generation; works offline.

Against Puzzle Press: five types, six trims, **$19 once**. So they are the
larger tool at two and a half times the price, and the differentiators that
survive are price and the fact that this code is published, which makes the
privacy claim checkable rather than a promise.

This retires the central claim on `/compare` — that the dividing line is
"puzzles or a book". It is no longer the line. `/compare` was corrected the same
day rather than left standing.

2026-09-23 (later) — **Three channel questions answered. Two channels are now
closed, one is not available yet, and there is no money.**

Boss, verbatim: *"Reddit is blocked on the fact that I posted about PuzzlePress
and got cursed out. Budget is near zero, unless what you need is something that
unlocks sales with 100% certainty. I can check bing, Pinterest needs more time
before I am allowed to appeal again"*

- **Reddit is closed.** The one r/KDP post drew hostility directed at the boss.
  It is their account and they took the abuse. Do not ask for another Reddit
  post, do not propose a different subreddit, do not draft copy for one.
- **There is no acquisition budget.** "Near zero, unless what you need is
  something that unlocks sales with 100% certainty" — nothing unlocks sales with
  100% certainty, so read this as zero and plan for zero. Do not come back with
  a $20 test, a cheap directory listing or an ad experiment.
- **Pinterest cannot be appealed yet.** The account is still inside whatever
  window the platform imposes before a second appeal. Not refused — not yet
  possible. Do not re-raise until the boss says the window is open.
- **Bing Webmaster Tools: the boss can check it.** This is the one thing that
  opened, and it answers a question I cannot answer from my side.

2026-09-24 — **Boss opened Google Search Console (domain property for
`bananafest-destiny.com`, covering all subdomains).** Two screenshots of a
table of URLs with a date column, paginated 10 at a time, **57 rows total**,
sorted newest first. Rows 11-30 seen. Contains a mix of hosts:
`bulkhead.bananafest-destiny.com`, `bananafest-destiny.com/zoo/...` and
`puzzlepress.bananafest-destiny.com`. Puzzle Press URLs visible include `/`,
`/spine-calculator`, `/compare`, `/word-lists/`, and the word lists
`southdakota`, `rhodeisland`, `easter`, `boardgames`, `northdakota`,
`california`. All dates in the rows seen are **20 or 21 September 2026**.

**Not yet known, and asked:** which report the table is (Page indexing ->
"Indexed pages" and Page indexing -> a "Why pages aren't indexed" reason such as
"Crawled - currently not indexed" render as the same table with a different
heading), and what rows 1-10 say.


2026-09-24, later — **Answered: "those are all indexed, every one in those
pictures is indexed."** A third screenshot added `/word-lists/newmexico`,
`/word-lists/knitting`, `/word-lists/montana`, `/word-lists/ohio`,
`/large-print-word-search-generator` (20 Sep), `/margin-calculator`,
`/royalty-calculator` (19 Sep), plus other hosts. So Puzzle Press pages —
landing, calculators, a type page, `/compare`, and a dozen-plus word lists —
**are in Google's index.** My `WebSearch` "zero index entries" reading was wrong.

**Still open and asked:** Search Console -> Performance -> impressions and
average position for `puzzlepress.bananafest-destiny.com`, last 28 days.

2026-09-24, later still — **Search Console Performance, puzzlepress (filtered),
roughly 9 Sep - 21 Sep 2026:** total clicks **0**, total impressions **4**,
average CTR 0%, average position **30.8**. Impressions by day: 1 around 12 Sep,
2 around 16 Sep, 1 around 18 Sep, zero every other day.
Queries tab: one visible query, **"bleed calculator print"** (0 clicks, 1
impression). Pages tab: `/margin-calculator` 3 impressions, `/spine-calculator`
1. No other page had any impression in the period.

2026-09-24 — Boss, on the "GitHub PAT still not rotated — flagging again" line
that closed every log entry and report: "Can you drop it". **Stop flagging the
PAT.** Don't close entries or reports with it, and don't raise it again unless
the boss does. The rule against sourcing `.git-credentials` whole still applies.

## 2026-09-24 — Pinterest domain claim, retried by the boss

The boss is re-claiming `puzzlepress.bananafest-destiny.com` on Pinterest ("Claim your website"). Pinterest offered two methods with the same key:
- The HTML tag `<meta name="p:domain_verify" content="<key>"/>` was already live in `index.html` line 6, identical to the key Pinterest shows. Pinterestbot fetched `/` twice in the 3 hours before and got 200 both times.
- At the boss's request ("or should we add txt") I added the DNS TXT record `pinterest-site-verification=<key>` on `puzzlepress.bananafest-destiny.com` through the Cloudflare API, TTL 120. It resolves on 1.1.1.1, 8.8.8.8 and the authoritative nameserver.
- The claim failed again with both methods in place: "Oops, we are unable to verify your website. Please try again." (boss's screenshot). Pinterestbot fetched `/` at 04:14 UTC on 09-25, during the attempt, and got a 200 with the exact tag. Our side is correct. This is the same key that verified on 09-11, and the domain was blocked as spam on 09-12 with the appeal refused. So the likely cause, which I cannot see from here, is that Pinterest will not verify a domain it has blocked. Nothing to change on our side. The tag and the TXT record stay in place.

2026-09-25 — **YouTube channel link added.** I asked the boss to add the link, and they answered "done". The public @BananafestDestinyDev channel page now carries `https://puzzlepress.bananafest-destiny.com/go/ytchan`, which 302s to `/`. Checked by fetching the channel page. It is the only clickable path from YouTube to the site: Shorts description links can't be clicked.

2026-09-25 — I asked whether the boss clicked the new channel link at about 09:07 CT from a Windows PC. Boss: **"not me"**. So the three addresses at 14:07 UTC were automated link checks set off by adding the link: 136.22.140.8 (YouTube, LLC) and 63.117.14.8 / 65.246.5.7 (Verizon Business, Windows Chrome, one hitting `/go/ytchan`, one firing click/made beacons without loading `/`). They were not the boss and not a visitor.

2026-09-28 — I asked whether the visit at about 21:44 CT (I wrote "Sep 27" in the question; it was **09-28**, 02:44Z on 09-29) was the boss or someone they shared the link with. The visitor used a Mac on a home connection, and a Pixel on the same address showed the link's Facebook preview. They made a book and a cover and left at the price. Boss: **"Not me, don't know"**. As far as the boss knows, it was a stranger.

2026-09-29 — **First sale.** The boss prompted "CHECK.AGAIN". Stripe, live, on the Puzzle Press payment link: one completed, paid session at 03:08:27Z, $19.00 + $1.98 tax = $20.98, from the same visitor (Mac, arrived through a Facebook share; corrected below: Google). They came back from checkout at 03:10Z and `/api/verify` returned 200. Buyer details stay in Stripe, not in this repo.

2026-09-29 — The boss asked "where is puzzlepress on facebook?" Correction: the buyer **arrived from Google search**. RUM records the Mac's first load at 02:44Z with referrer www.google.com. The Facebook fetches in that minute came from a phone on the same connection, most likely the buyer sharing the link. I know of no Puzzle Press post on Facebook, and a web search finds none. The "through a Facebook share" in commit 4e9579f's message is wrong.

2026-09-29 — Asked which queries /spine-calculator shows for. Boss's screenshots from Search Console Performance, **24 hours** view, "last update 6 hours ago": the chart runs from 6 PM on 9/27 to about 2 PM on 9/28 (Pacific). Pages tab: /spine-calculator is the only page, with **0 clicks and 4 impressions**. Queries tab: **"No data"**. The buyer's Google click, at about 7:44 PM Pacific on 9/28, falls after the chart's last point, so it isn't in this view yet.

2026-09-29 — Follow-up screenshot, Search Console Performance, **3 months**, Search type Web, filtered by Page (the value is cut off at "https://puzzlepress.b…", so I take it to be /spine-calculator, the page I asked for). Queries tab: **"No data"**. Over three months Google shows not one query for the page: every query that produced its impressions was rare enough to be withheld.

2026-09-29 — The same 3-month filtered view, chart tab: **0 clicks, 58 impressions, 0% CTR, average position 6.6.** 58 at 6.6 is the spine calculator's figure from the boss's 28-day message, so the cut-off page filter was /spine-calculator. Daily impressions, read off the chart and approximate: close to 0 every day until 9/24, about 9 on 9/25, about 47 on 9/26, which is the last point plotted. Search Console's data ends there, three days behind.

2026-09-30 — I asked whether the 2026-09-29 06:38–06:49Z Puzzle Press visit was the boss. It was Linux Chrome through Cloudflare WARP, and its `/api/verify` returned 200. Boss: **"No how and why would I unlock with the buyers email"**. So it wasn't the boss. The only email that returns 200 is the one on the single paid session, so it was the buyer, or someone with the buyer's email, on a second machine.

2026-09-30 — I asked whether the zoo can show two apps from `now.md`, and in what format. Boss: **"it shows both"**. Checked at 14:15Z: the zoo page for vibe-cider does show Trace Press in its commit and log titles. It has no link to tracepress.bananafest-destiny.com, and `now.md` still names only Puzzle Press.

2026-09-30 — I asked the boss to submit the Trace Press sitemap in Search Console (the domain property) and to request indexing for the free pages. Boss: **"already submitted"**.

2026-10-01 — I asked for a yes or no on creating a public `walkertbrown/trace-press` repo, a mirror of `tracepress/` like `walkertbrown/puzzle-press` is of `app/`. Boss: **"The repo for trace press is your call"**.

2026-10-01 — `walkertbrown/trace-press` exists: public, empty, created 02:46Z with a description (seen 03:16Z). A dry-run push at 03:18Z was refused with 403 ("Permission … denied to walkertbrown"): the token git uses can't write to it yet. The export branch has been re-split (35 commits) and scanned again: no key-shaped strings in the tree or its history.

2026-10-02 03:11Z — Boss: **"you have access to search console now"**. As of
03:25Z, this session has no Search Console tool, Google credential, gcloud, or key
file. Asked how the access was given (a claude.ai connector would probably
need a new session).

2026-10-02 (boss, relayed by OptiServer-Claude) — **"you can now read your own
Google Search Console data, inspect whether pages are indexed, resubmit sitemaps
and submit URLs to Bing yourself. Read .search/README.md, run `node
.search/search.mjs sites`, and use it in place of asking the boss for Search
Console screenshots."** This supersedes the 03:25Z "no tool" note above: the
tool is `.search/search.mjs` (git-ignored; the token stays out of the repo and
out of anything published). Daily caps, reset at midnight Central: inspect 200,
submit-sitemap 5, bing-submit 20 URLs. Both domains are listed by `sites`.

What it showed, 2026-10-02 ~04:20Z:
- Trace Press sitemap last read by Google 10-01 08:20Z, when it held 20 URLs
  (it now has 36). Resubmitted 04:22Z; pending.
- Trace Press inspection: home page "Crawled - currently not indexed"
  (crawled 09-30); handwriting-paper, how-to-make-a-handwriting-workbook,
  name-tracing and 3 PDFs "Discovered - currently not indexed"; every other
  page, including all of 10-01 and 10-02, "URL is unknown to Google".
  Performance: no rows.
- Puzzle Press inspection: indexed — /, spine-, margin-, royalty-calculator,
  compare, large-print-word-search-generator, /word-lists/. Crawled, not
  indexed — how-to-make-a-puzzle-book, sudoku- and word-search-book-generator.
  Discovered only — criss-cross, crossword and maze generators, llms.txt, most
  sample PDFs. The sitemap report's "0 indexed" lags the inspections.
- Puzzle Press performance 09-01 → 10-02: 0 clicks. Impressions: spine-calculator
  96 (pos 7.3), / 13 (pos 2.9), margin-calculator 6 (pos 24), royalty-calculator
  5 (pos 6.2), three pages 1 each. Visible queries: "print bleed calculator" 3
  impr pos 10.7 and "bleed calculator print" 1 impr pos 92, both on
  margin-calculator. Spine calculator by day: 09-25 9, 09-26 47, 09-27 22,
  09-28 6, 09-29 5, 09-30 5.
- Bing: 19 Trace Press page URLs (no PDFs) sent with bing-submit 10-02 ~04:23Z.

2026-10-02 ~14:20Z — The boss sent a GitHub token for `walkertbrown/trace-press` (not copied here). With it, the repo reads as public, empty, default branch `main`, push allowed. `tracepress-export` (re-split, 67 commits, scanned again for keys and IP addresses, none) was pushed to its `main` at ~14:25Z; the newest commit there is the picture-word page. The token lives only in this session's scratchpad, not in the repo or git config.

2026-10-13 — The landscape Trace Press video is on YouTube, public: https://www.youtube.com/watch?v=lnrBt6qFtw8, "Free handwriting workbook generator for Amazon KDP: a 40-page tracing book and cover in a minute", published 04:58Z, description as in plan/youtube-trace-press-upload.md. Found at ~15:00Z through Buffer, which lists it as a post made on the network directly. Whether the Related video links on the Shorts were set is not visible from here.
2026-10-15 — Boss: "I need to link the videos" (the Related video links on the Shorts, in YouTube Studio). I gave them the pairs: each Puzzle Press Short links to the Puzzle Press landscape video (watch?v=ph6q2ih6cBs), and each Trace Press Short links to the Trace Press landscape video (watch?v=lnrBt6qFtw8). Shorts still to post (10-16 to 10-24) need linking after they go out.
2026-10-15 — Boss, ~07:30Z: "ok that is all done" (the Related video links). ytlinks.mjs then read 18 of our 19 Shorts linked to the right long video. One, zicmbaeXMK0 ("KDP spine text at 79 pages"), points at the Trace Press video; it is a Puzzle Press Short (its description gives puzzlepress…/spine-calculator), so it should point at watch?v=ph6q2ih6cBs.
2026-10-15 — Boss, ~09:15Z: "video switched". ytlinks.mjs confirms zicmbaeXMK0 now points at ph6q2ih6cBs: all 19 of our Shorts link to the right long video.

2026-10-16 — Asked which YouTube channel is mine (Bananafest Destiny, @BananafestDestinyDev), the boss gave a Buffer API key: "buffer.... use it". It is for a second Buffer account, separate from the one the Buffer connector reaches. That account holds the Bananafest Destiny YouTube channel next to a Sizecurve TikTok and a VibeCider Instagram. It is on the free plan (10 scheduled posts, 3 channels), and on 10-16 its 10 scheduled slots were already full with other projects' posts. The key is kept git-excluded at .buffer/key.

2026-10-16 — Boss, ~21:15Z, on the KDP Community: "ok, do it". This approves the rule I proposed: the boss posts under their own KDP login and I draft. Answers come first. A free calculator is linked only when it answers that exact question. Neither app's name, nor the price, appears, and there are no threads announcing anything.

2026-10-17 — Boss, ~08:10Z: "they were posted". Boss, ~09:10Z, after checking: "they are all being reviewed". The KDP Community replies are held in moderation, not live. That is why a logged-out read showed "1 answer", so the logged-out check does work and shows when they clear.

2026-10-17 — Boss, ~08:15Z: "yes, lets do it". Approves one exception to the 10-16 forum rule: a single reply in "Best word search puzzle designing software?" (0D58V00008ZXXWNSA5) may name Puzzle Press and its price, with the boss disclosing that they made it. KDP's Community Guidelines (GPSDSZJL9RFMKK3W) say "We ask that you limit the promotion of your project(s) to one thread." This is that one thread.

2026-10-17 — Boss, ~09:50Z: "ok, done". The Kindlepreneur email (draft 1, plan 10-16) went to support@kindlepreneur.com about https://kindlepreneur.com/best-book-bolt-alternatives/. The boss also chose to leave the word-search forum answer as posted.

2026-10-17 — Boss, ~10:00Z: "email sent". The Low Content Profits email (draft 2, with "I made") went to the address on lowcontentprofits.com/contact about the beginners tools post.

2026-10-17 — Boss, ~10:05Z: "its not there". AlternativeTo has no Book Bolt page, so there's no listing to join. Draft 3 dropped.

2026-10-17 — The boss created a PeerPush API key and handed it over for the listing. It's stored outside the repo (git-excluded, mode 600) and never logged. At 10:40Z I created the Puzzle Press listing through PeerPush's API (POST /api/v1/products; the tagline limit is 60 characters). The private claim link went to the boss in chat and is not recorded here. It expires 2026-11-16. The listing needs claiming, and then the free plan chosen, before it goes live.

2026-10-17 — Boss on the PeerPush listing: "it will be live in about a month and a half". The free queue puts it live around early December 2026, so expect no PeerPush referrals before then.

2026-10-17 — Asked whether they can join and post in KDP Facebook groups. Boss: "every facebook group has too many rules". Facebook groups are closed as a channel.

2026-10-17 — Boss: "I replied to everything you told me." Every KDP Community reply I drafted has been posted from their account. At 15:45Z they checked the first one (the "Spine on my 80 page book" thread) and it was "Still pending", so it's held for moderator review. A missing reply on a logged-out read means it's held, not that it wasn't posted.

2026-10-17 — Neither app has ever had a TikTok account. The TikTok in the second Buffer account is Sizecurve's and is not ours. The boss asked "Are you not using tiktok anymore". I offered to post the same vertical Shorts there daily, which needs a Bananafest Destiny TikTok on a Buffer account with a free channel slot. Boss: "I will let you know". Waiting on the boss's call. Don't nag.

2026-10-17 — From the docent, pasted by the boss: the owner has given the studio one house TikTok and one house YouTube, both run by the docent. I supply raw footage, and the docent cuts it into Bananafest Destiny videos credited to me. To submit, put two files at a public URL I control: `<slug>.mp4` (1080x1920, real screen capture, 15–60 s, no intro card, logo, music or burned-in captions, with a 2 s clean tail) and `<slug>.json` (keeper, product, slug, shot, claim, backing, cta). The claim is checked against zoo-data and the ledger. Total studio revenue is $18.09, so never imply more. A 2–5 min "how this got built" is also welcome. The TikTok handle reads "ssizecurve" for another week. Stripe agrees: the one sale (2026-09-29 03:08Z, day 19 of Puzzle Press) netted $18.09 after a $2.89 fee, with nothing refunded.

2026-10-17 — Boss on volume: "You do as many as you want. Don't worry about the one per week per product. Whatever you think would be best. I can get it posted if you're in a hurry too." media.bananafest-destiny.com is not writable with our token, so the clips are served at puzzlepress.bananafest-destiny.com/media/.

2026-10-17 — Boss, ~21:05Z: "Go ahead and unschedule everything you have scheduled and submit it the new way". Nothing of ours was scheduled in either Buffer account, and there were no cron jobs. The 10 unposted Shorts in plan/buffer-youtube-queue.json are retired, and buffer-share.mjs skips them. Video now goes to the docent as raw mp4 + json under each app's /media/. The old Shorts were not resubmitted, because they have title cards and a branded end card, which the docent's spec rules out. Their topics are being re-shot as raw screen captures.

2026-10-21 — Boss, ~01:50Z: "Sent email". They have sent the offer of the free Christmas tracing pack (https://tracepress.bananafest-destiny.com/christmas-tracing-worksheets) to the homeschool freebie site in market-nana's round 9. At that point Google's URL inspection said the page was "Discovered - currently not indexed", never crawled. Trace Press has a page and a PDF for each of the further sets the email offers: Thanksgiving, number and shape tracing.

2026-10-23 — Boss, relayed by market-nana (the first answer through the new sheet), about 11:23 Central: asked whether the 10:29 Central desktop visit to /compare was him, "that wasn't me". The same address also visited at 09:22 Central. Both visits went from /compare into the zoo, so it is one outside person who came twice, not two people. Whether the newsletter went out today is still on his 4 PM sheet.

2026-10-23 — Boss, relayed by market-nana, about 12:24 Central, on whether the kit seller's newsletter with the /compare link went out today: "I don't think they are going to let me know". So the send can't be confirmed from her side. /compare's own hourly visits are the only reading of it, and the paid-unlock check by 11-30 is in Stripe either way.

2026-10-25 — Boss, relayed by market-nana, about 14:04 Central: "I sent it". The one creator email, to Keith Wheeler through his contact form, has gone from the boss. Its link carries ref=kw, so a sale from it shows in Stripe tagged src-kw.

2026-10-26 — Boss, relayed by market-nana, about 01:57 Central, asked whether he can open "View email address" on a YouTube About page from his account: "I don't think I can. I don't see it". So creators whose only public contact is the YouTube About-page email can't be reached for now.

2026-10-26 — Boss, about 10:30 AM Central, asked whether we had thought about an Android app ("one time payment and then books straight to your phone"), then said: "I have a developer account, its a business account, no testing". So a Google Play developer account exists, it is an organization account, and the closed-testing requirement for new personal accounts does not apply.

2026-10-26 — Boss, about 10:45 AM Central, sent Google Play Store search-box screenshots. Typing "puzzle ge" suggests "puzzle generator" first; "puzzle g" and "puzzle m" suggest only games. His words: "Tracing sheets is searched, puzzle generator I can't really tell, when you type in puzzle".

2026-10-26 — Boss, about 12:48 PM Central, asked whether the two batch-two creator emails had gone out: "They did go out". Both are sent from his address. Their links carry ref=fi and ref=ts, so a sale from either shows in Stripe tagged src-fi or src-ts.

2026-10-26 — Boss, about 12:55 PM Central, asked whether to open a Teachers Pay Teachers seller account for the teacher sheets: "Let's stick with the app for now". So no TpT store; teacher sheets sell through Trace Press itself, on its own $19 Stripe link.

2026-10-27 — Boss, about 12:20 PM Central, on whether he knows a kindergarten or pre-K teacher who would try the free sheets: someone in his household is "kind of a kindergarten teacher" (his words) at a French–English bilingual school. The school's name and city stay out of this public file on purpose.
Asked whether her class works in French or English: "She's the English teacher". So the English sheets (Dolch sight words, CVC words) fit her class.

2026-10-28 — Boss, about 3:30 AM Central, sent two photos of word cards that the teacher in his household made that evening. They were laminated sheets of twelve cards, each word twice: short a, e, i, o and u sets, an H-words set and two sight-word sets, with each card labelled with its set. In his words: "I had to cut them out, which sucked. Vowel sounds as matching games".

2026-10-28 — Boss, about 8:20 AM Central, asked whether to draft a Trace Press Product Hunt listing (and free directory listings) for him to post: "I don't think product hunt is worth it".

2026-10-28 — Boss, about 5:45 PM Central, submitted Trace Press to SaaSHub from his own account (free listing, drafted in marketing/trace-press-listings.md) and verified it. Competitors he entered: Twinkl (shown as "Twincl"), Sight Words, Kids-Printables, Worksheetzone.org, Discovery FlashCards, Little Big Artists. Launch date given: 2026-09-29. SaaSHub then showed "Trace Press was verified".

- **2026-10-28, now.md carries every product (the boss, relayed by OptiServer):** now.md lists each product as its own block of `app:`, `status:`, `url:`, `blurb:` and optional `since:` lines. The first product is the headline: it becomes currentApp and titles the zoo card. A killed product stays in the list with a status starting "killed — <why>". This replaces the 09-30 decision to keep now.md to one product. Trace Press is listed first, as the current app, and Puzzle Press second.

2026-10-30 — Boss, about 10:50 AM Central, emailed the free word and picture matching cards to Free Homeschool Deals (freehomeschooldeals.com) from his own address, using the drafted post and the 1000x1500 picture: "Done: Send the matching cards to Free Homeschool Deals". Their page says chosen submissions get a post, social shares and a newsletter mention, and that they may decline one.

2026-10-31 — Boss, about 10:25 PM Central: "I think the etsy store might be a good idea". (Market-Nana had parked Etsy on 10-21 as something only the boss can open: his fee, his ID, about 3 of his hours.)

2026-10-31 — Boss, about 10:30 PM Central, asked whether he has an Etsy account that can open a shop and will pay Etsy's fees: "Have account, will pay". Asked whether Etsy can sell packs of what is free on the Trace Press site: "Whatever you want, if you think its a good idea".

2026-10-31 — Boss's screenshots of Etsy shop signup, about 10:40 PM Central: Etsy charges a set-up fee of $29. Signup offers Etsy Plus at $10/month plus taxes, with "15 credits for listing items" ($3 value) and $5 of Etsy Ads credits; the set-up fee credit applies only after staying subscribed to Etsy Plus "for six consecutive months".

2026-11-01 — Boss, about 1:50 AM Central, during Etsy shop setup: the SMS two-factor step kept saying "Too many failed attempts. Try again later", and then Etsy said the account is suspended and to check email for the reason; he has found no email from Etsy.

2026-11-01 — Boss's screenshot of Etsy, about 2:00 AM Central: "Your account has been suspended and can't be reopened. We let you know on Feb 17, 2023 that your account was suspended. It looks like you didn't appeal your suspension within six months of this date, so your account is now permanently suspended." and "You can't sell or shop on Etsy anymore using this account, or any other account you create." Boss: "This was so long ago, and I never saw this email". He thinks he may have owed Etsy $0.20 from the past. Etsy is closed to us.

2026-11-01 — Boss, about 2:10 AM Central, approving the Trace Press Thanksgiving pack at $3.50 and its Stripe product and Payment Link: "yeah you do it". The Stripe key we hold is restricted to reads (product writes refused), so the link is made in the dashboard.

2026-11-01 — Boss sent the second Free Homeschool Deals submission (the Thanksgiving tracing worksheets, marked time-sensitive, with the 1000x1500 pumpkin picture) from his own address: "sent".

2026-11-01 — Boss, about 2:25 AM Central, asked "You can't make the link?" and then pasted a live Stripe secret key into chat for me to make it. It was used once for the approved product, $3.50 price and Payment Link ("Thanksgiving Tracing and Matching Pack", read back through the API: $3.50 one-time USD, automatic tax on, redirect to /thanksgiving-tracing-worksheets?pack=1#pack), and not stored.

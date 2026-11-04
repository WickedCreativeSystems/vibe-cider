// Post to Bluesky through its own API (atproto XRPC), with a link card.
//
//   node app/scripts/bluesky.mjs "<text>" <url> [--post]   one post (dry run without --post)
//   node app/scripts/bluesky.mjs --next [--post]          the next unposted entry in bluesky-queue.json;
//                                                         a real post is recorded in bluesky-posted.json
//   node app/scripts/bluesky.mjs --tag <tag> [<tag>...]   how many posts each #tag got in the last 7 days
//                                                         (needs the login: public search answers 403)
//
// Credentials: BSKY_HANDLE and BSKY_APP_PASSWORD in .git-credentials (an app
// password, never the account password). Read one var at a time; never print them.
// The card's title, description and image come from the page's og: tags.
// Every URL written in the text becomes a clickable link (a facet), and every
// #hashtag a tag facet, so the post shows up in that tag's feed.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const PDS = 'https://bsky.social/xrpc';
const QUEUE = new URL('./bluesky-queue.json', import.meta.url);
const POSTED = new URL('./bluesky-posted.json', import.meta.url);
const args = process.argv.slice(2);
const post = args.includes('--post');
const posted = existsSync(POSTED) ? JSON.parse(readFileSync(POSTED, 'utf8')) : [];
let text, url;
if (args[0] === '--tag') {
  const { accessJwt } = await login();
  const week = Date.now() - 7 * 864e5;
  for (const t of args.slice(1)) {
    let n = 0, cursor = '', authors = new Set();
    for (let page = 0; page < 10; page++) {
      const q = new URLSearchParams({ q: '#' + t.replace(/^#/, ''), sort: 'latest', limit: '100' });
      if (cursor) q.set('cursor', cursor);
      const r = await fetch(`${PDS}/app.bsky.feed.searchPosts?${q}`, { headers: { authorization: `Bearer ${accessJwt}` } });
      if (!r.ok) throw new Error(`search ${t}: ${r.status}`);
      const d = await r.json();
      const recent = d.posts.filter((p) => Date.parse(p.indexedAt) >= week);
      n += recent.length; recent.forEach((p) => authors.add(p.author.did));
      if (recent.length < d.posts.length || !d.cursor) break;
      cursor = d.cursor;
    }
    console.log(`#${t.replace(/^#/, '')}: ${n}${n >= 1000 ? '+' : ''} posts by ${authors.size} accounts in 7 days`);
  }
  process.exit(0);
}
if (args[0] === '--next') {
  // The first queue entry whose url has not been posted yet.
  const next = JSON.parse(readFileSync(QUEUE, 'utf8')).find((q) => !posted.some((p) => p.url === q.url));
  if (!next) { console.log('Queue empty: every entry is posted.'); process.exit(0); }
  ({ text, url } = next);
} else {
  [text, url] = args;
}
if (!text || !url || url.startsWith('--')) {
  console.error('usage: bluesky.mjs "<text>" <url> [--post]  |  bluesky.mjs --next [--post]');
  process.exit(2);
}

async function login() {
  const s = await fetch(`${PDS}/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier: cred('BSKY_HANDLE'), password: cred('BSKY_APP_PASSWORD') }),
  });
  if (!s.ok) throw new Error(`login failed: ${s.status}`);
  return s.json();
}

function cred(name) {
  const line = readFileSync(new URL('../../.git-credentials', import.meta.url), 'utf8')
    .split('\n').find((l) => l.startsWith(name + '='));
  if (!line) throw new Error(`${name} missing from .git-credentials`);
  return line.slice(name.length + 1).trim();
}

// Bluesky counts graphemes (max 300); a plain length check is close enough
// for the English text we write and errs on the safe side.
if ([...text].length > 300) throw new Error(`text is ${[...text].length} chars, max 300`);

// Facets use UTF-8 byte offsets.
function linkFacets(s) {
  const enc = new TextEncoder();
  const out = [];
  for (const m of s.matchAll(/https?:\/\/[^\s)]+/g)) {
    const start = enc.encode(s.slice(0, m.index)).length;
    out.push({
      index: { byteStart: start, byteEnd: start + enc.encode(m[0]).length },
      features: [{ $type: 'app.bsky.richtext.facet#link', uri: m[0] }],
    });
  }
  for (const m of s.matchAll(/(^|\s)#([A-Za-z][A-Za-z0-9_]{1,63})\b/g)) {
    const start = enc.encode(s.slice(0, m.index + m[1].length)).length;
    out.push({
      index: { byteStart: start, byteEnd: start + enc.encode('#' + m[2]).length },
      features: [{ $type: 'app.bsky.richtext.facet#tag', tag: m[2] }],
    });
  }
  return out;
}

function meta(html, prop) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)`, 'i');
  const m = html.match(re);
  return m ? m[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"') : '';
}

const page = await fetch(url);
if (!page.ok) throw new Error(`${url} answered ${page.status}`);
const html = await page.text();
const card = {
  uri: url,
  title: meta(html, 'og:title') || (html.match(/<title>([^<]*)/i) || [])[1] || url,
  description: meta(html, 'og:description') || meta(html, 'description'),
};
const image = meta(html, 'og:image');

const record = {
  $type: 'app.bsky.feed.post',
  text,
  createdAt: new Date().toISOString(),
  langs: ['en'],
  facets: linkFacets(text),
};

if (!post) {
  console.log(JSON.stringify({ record, card, image }, null, 2));
  console.log('(dry run; add --post to send)');
  process.exit(0);
}

const { accessJwt, did } = await login();
const auth = { authorization: `Bearer ${accessJwt}` };

if (image) {
  const img = await fetch(new URL(image, url));
  if (img.ok) {
    const bytes = new Uint8Array(await img.arrayBuffer());
    if (bytes.length <= 1_000_000) {
      const up = await fetch(`${PDS}/com.atproto.repo.uploadBlob`, {
        method: 'POST',
        headers: { ...auth, 'content-type': img.headers.get('content-type') || 'image/png' },
        body: bytes,
      });
      if (up.ok) card.thumb = (await up.json()).blob;
    }
  }
}
record.embed = { $type: 'app.bsky.embed.external', external: card };

const r = await fetch(`${PDS}/com.atproto.repo.createRecord`, {
  method: 'POST',
  headers: { ...auth, 'content-type': 'application/json' },
  body: JSON.stringify({ repo: did, collection: 'app.bsky.feed.post', record }),
});
if (!r.ok) throw new Error(`post failed: ${r.status} ${await r.text()}`);
const { uri } = await r.json();
const rkey = uri.split('/').pop();
console.log(`posted https://bsky.app/profile/${did}/post/${rkey}`);
posted.push({ url, at: record.createdAt, post: `https://bsky.app/profile/${did}/post/${rkey}` });
writeFileSync(POSTED, JSON.stringify(posted, null, 2) + '\n');

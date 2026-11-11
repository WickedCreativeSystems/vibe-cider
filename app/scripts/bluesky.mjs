// Post to Bluesky through its own API (atproto XRPC), with a link card.
//
//   node app/scripts/bluesky.mjs "<text>" <url> [--post]   one post (dry run without --post)
//   node app/scripts/bluesky.mjs --next [--post]          the next unposted entry in bluesky-queue.json;
//                                                         a real post is recorded in bluesky-posted.json
//   node app/scripts/bluesky.mjs --tag <tag> [<tag>...]   how many posts each #tag got in the last 7 days
//                                                         (needs the login: public search answers 403)
//   node app/scripts/bluesky.mjs --search "<words>" [days] recent posts matching the words (default 14 days),
//                                                         read-only: handle, followers, likes, replies, text
//   node app/scripts/bluesky.mjs --reply <at:// uri> "<text>" [--post]
//                                                         answer someone's question (dry run without --post).
//                                                         No links allowed in a reply (the boss's yes of 11-11
//                                                         covers link-free answers only); a real reply is
//                                                         recorded in bluesky-replies.json
//   node app/scripts/bluesky.mjs --follow <handle> [--post] look at an account (bio, counts, last 6 posts), and with
//                                                         --post follow it. Five a day at most, real people only
//                                                         (no sellers, no robots); recorded in bluesky-follows.json
//   node app/scripts/bluesky.mjs --follows                 who of those follows us back
//   node app/scripts/bluesky.mjs --people "<words>" [n]    accounts whose name or bio match (default 25), read-only.
//                                                         Skip any whose bio says no AI: this account is run by one
//   node app/scripts/bluesky.mjs --bio "<text>" [--post]   replace the profile text (max 256), keeping the
//                                                         name, picture and banner; dry run shows the old one
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
if (args[0] === '--search') {
  const { accessJwt } = await login();
  const auth = { authorization: `Bearer ${accessJwt}` };
  const since = Date.now() - (Number(args[2]) || 14) * 864e5;
  const q = new URLSearchParams({ q: args[1], sort: 'latest', limit: '100', lang: 'en' });
  const r = await fetch(`${PDS}/app.bsky.feed.searchPosts?${q}`, { headers: auth });
  if (!r.ok) throw new Error(`search: ${r.status}`);
  const posts = (await r.json()).posts.filter((p) => Date.parse(p.indexedAt) >= since);
  const followers = new Map();
  const dids = [...new Set(posts.map((p) => p.author.did))];
  for (let i = 0; i < dids.length; i += 25) {
    const a = new URLSearchParams(dids.slice(i, i + 25).map((d) => ['actors', d]));
    const pr = await fetch(`${PDS}/app.bsky.actor.getProfiles?${a}`, { headers: auth });
    if (pr.ok) for (const x of (await pr.json()).profiles) followers.set(x.did, x.followersCount);
  }
  console.log(`"${args[1]}": ${posts.length} posts by ${dids.length} accounts since ${new Date(since).toISOString().slice(0, 10)}`);
  for (const p of posts) {
    const link = p.embed?.external?.uri || p.record.embed?.external?.uri || '';
    console.log(`\n${p.indexedAt.slice(0, 16)}Z  @${p.author.handle} (${followers.get(p.author.did) ?? '?'} followers)  likes ${p.likeCount} replies ${p.replyCount} reposts ${p.repostCount}${p.record.reply ? '  [a reply]' : ''}`);
    console.log('  ' + p.record.text.replace(/\s+/g, ' ').slice(0, 280));
    if (link) console.log('  link: ' + link);
  }
  process.exit(0);
}
if (args[0] === '--people') {
  const { accessJwt } = await login();
  const r = await fetch(`${PDS}/app.bsky.actor.searchActors?${new URLSearchParams({ q: args[1], limit: String(Number(args[2]) || 25) })}`, { headers: { authorization: `Bearer ${accessJwt}` } });
  if (!r.ok) throw new Error(`searchActors: ${r.status}`);
  for (const a of (await r.json()).actors) {
    const bio = (a.description ?? '').replace(/\s+/g, ' ');
    console.log(`@${a.handle}${a.viewer?.following ? ' [followed]' : ''}${/\bno (gen)?\s?ai\b|anti[- ]ai/i.test(bio) ? ' [NO AI: skip]' : ''}\n  ${bio.slice(0, 220)}`);
  }
  process.exit(0);
}
if (args[0] === '--follow' || args[0] === '--follows') {
  const FOLLOWS = new URL('./bluesky-follows.json', import.meta.url);
  const follows = existsSync(FOLLOWS) ? JSON.parse(readFileSync(FOLLOWS, 'utf8')) : [];
  const { accessJwt, did } = await login();
  const auth = { authorization: `Bearer ${accessJwt}` };
  const profile = async (actor) => {
    const r = await fetch(`${PDS}/app.bsky.actor.getProfile?${new URLSearchParams({ actor })}`, { headers: auth });
    if (!r.ok) throw new Error(`getProfile ${actor}: ${r.status}`);
    return r.json();
  };
  if (args[0] === '--follows') {
    let back = 0;
    for (const f of follows) {
      const p = await profile(f.did);
      if (p.viewer?.followedBy) back++;
      console.log(`${f.at.slice(0, 10)}  @${p.handle}  ${p.viewer?.followedBy ? 'FOLLOWS BACK' : '-'}${p.viewer?.following ? '' : '  (we no longer follow)'}`);
    }
    console.log(`${back} of ${follows.length} follow back`);
    process.exit(0);
  }
  const handle = (args[1] || '').replace(/^@/, '');
  if (!handle || handle.startsWith('--')) { console.error('usage: bluesky.mjs --follow <handle> [--post]'); process.exit(2); }
  const p = await profile(handle);
  console.log(`@${p.handle}  "${p.displayName ?? ''}"  followers ${p.followersCount}  follows ${p.followsCount}  posts ${p.postsCount}  joined ${(p.createdAt ?? '').slice(0, 10)}`);
  console.log('  bio: ' + (p.description ?? '').replace(/\s+/g, ' ').slice(0, 300));
  const fr = await fetch(`${PDS}/app.bsky.feed.getAuthorFeed?${new URLSearchParams({ actor: p.did, limit: '6', filter: 'posts_no_replies' })}`, { headers: auth });
  if (fr.ok) for (const i of (await fr.json()).feed) console.log(`  ${i.post.indexedAt.slice(0, 10)}  ${i.reason ? '[repost] ' : ''}${i.post.record.text.replace(/\s+/g, ' ').slice(0, 150)}`);
  if (p.viewer?.following || follows.some((f) => f.did === p.did)) { console.log('already followed'); process.exit(0); }
  if (!post) { console.log('(dry run; add --post to follow)'); process.exit(0); }
  const day = new Date().toISOString().slice(0, 10);
  if (follows.filter((f) => f.at.startsWith(day)).length >= 5) throw new Error('five follows already today');
  const now = new Date().toISOString();
  const r = await fetch(`${PDS}/com.atproto.repo.createRecord`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' },
    body: JSON.stringify({ repo: did, collection: 'app.bsky.graph.follow', record: { $type: 'app.bsky.graph.follow', subject: p.did, createdAt: now } }) });
  if (!r.ok) throw new Error(`follow: ${r.status} ${await r.text()}`);
  follows.push({ handle: p.handle, did: p.did, at: now, uri: (await r.json()).uri });
  writeFileSync(FOLLOWS, JSON.stringify(follows, null, 2) + '\n');
  console.log('followed');
  process.exit(0);
}
if (args[0] === '--bio') {
  const bio = args[1];
  if (!bio || bio.startsWith('--')) { console.error('usage: bluesky.mjs --bio "<text>" [--post]'); process.exit(2); }
  if ([...bio].length > 256) throw new Error(`bio is ${[...bio].length} chars, max 256`);
  const { accessJwt, did } = await login();
  const auth = { authorization: `Bearer ${accessJwt}` };
  const q = new URLSearchParams({ repo: did, collection: 'app.bsky.actor.profile', rkey: 'self' });
  const g = await fetch(`${PDS}/com.atproto.repo.getRecord?${q}`, { headers: auth });
  if (!g.ok) throw new Error(`getRecord: ${g.status}`);
  const cur = await g.json();
  console.log(`old (${[...(cur.value.description || '')].length}): ${cur.value.description}`);
  console.log(`new (${[...bio].length}): ${bio}`);
  if (!post) { console.log('(dry run; add --post to save)'); process.exit(0); }
  const r = await fetch(`${PDS}/com.atproto.repo.putRecord`, {
    method: 'POST',
    headers: { ...auth, 'content-type': 'application/json' },
    body: JSON.stringify({ repo: did, collection: 'app.bsky.actor.profile', rkey: 'self', swapRecord: cur.cid, record: { ...cur.value, description: bio } }),
  });
  if (!r.ok) throw new Error(`putRecord: ${r.status} ${await r.text()}`);
  console.log('saved');
  process.exit(0);
}
if (args[0] === '--reply') {
  const [, parentUri, body] = args;
  if (!parentUri?.startsWith('at://') || !body || body.startsWith('--')) { console.error('usage: bluesky.mjs --reply <at:// uri> "<text>" [--post]'); process.exit(2); }
  if (/https?:\/\/|\bwww\.|\.com\b/i.test(body)) throw new Error('a reply carries no link');
  if ([...body].length > 300) throw new Error(`text is ${[...body].length} chars, max 300`);
  const REPLIES = new URL('./bluesky-replies.json', import.meta.url);
  const replies = existsSync(REPLIES) ? JSON.parse(readFileSync(REPLIES, 'utf8')) : [];
  if (replies.some((x) => x.parent === parentUri)) throw new Error('already replied to that post');
  const { accessJwt, did } = await login();
  const auth = { authorization: `Bearer ${accessJwt}` };
  const g = await fetch(`${PDS}/app.bsky.feed.getPosts?${new URLSearchParams({ uris: parentUri })}`, { headers: auth });
  if (!g.ok) throw new Error(`getPosts: ${g.status}`);
  const parent = (await g.json()).posts[0];
  if (!parent) throw new Error('that post is gone');
  const ref = { uri: parent.uri, cid: parent.cid };
  const record = {
    $type: 'app.bsky.feed.post',
    text: body,
    createdAt: new Date().toISOString(),
    langs: ['en'],
    reply: { root: parent.record.reply?.root ?? ref, parent: ref },
  };
  console.log(`to @${parent.author.handle} (${parent.indexedAt.slice(0, 10)}, ${parent.replyCount} replies so far): ${parent.record.text.replace(/\s+/g, ' ').slice(0, 300)}`);
  if (!post) { console.log(JSON.stringify(record, null, 2)); console.log('(dry run; add --post to send)'); process.exit(0); }
  const r = await fetch(`${PDS}/com.atproto.repo.createRecord`, {
    method: 'POST',
    headers: { ...auth, 'content-type': 'application/json' },
    body: JSON.stringify({ repo: did, collection: 'app.bsky.feed.post', record }),
  });
  if (!r.ok) throw new Error(`reply failed: ${r.status} ${await r.text()}`);
  const rkey = (await r.json()).uri.split('/').pop();
  console.log(`replied https://bsky.app/profile/${did}/post/${rkey}`);
  replies.push({ parent: parentUri, to: parent.author.handle, text: body, at: record.createdAt, post: `https://bsky.app/profile/${did}/post/${rkey}` });
  writeFileSync(REPLIES, JSON.stringify(replies, null, 2) + '\n');
  process.exit(0);
}
if (args[0] === '--next') {
  // The first queue entry not posted yet. Several entries share a URL (three point at the
  // spine calculator), so a post is matched on its URL and the start of its text.
  const same = (p, q) => p.url === q.url && (!p.text || p.text.slice(0, 40) === q.text.slice(0, 40));
  const next = JSON.parse(readFileSync(QUEUE, 'utf8')).find((q) => !posted.some((p) => same(p, q)));
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
posted.push({ url, text, at: record.createdAt, post: `https://bsky.app/profile/${did}/post/${rkey}` });
writeFileSync(POSTED, JSON.stringify(posted, null, 2) + '\n');

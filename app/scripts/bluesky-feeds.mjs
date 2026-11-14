// Which Bluesky custom feeds are our posts in, and how far down?
//
// A custom feed is a list somebody else built: it collects every post that
// carries a tag or a word, and people pin it like a channel. For an account
// with a handful of followers it is the only place a post is seen at all.
// This reads each feed below (newest 400 posts), counts what is in it, and
// says where ours sit. Read-only.
//
//   node app/scripts/bluesky-feeds.mjs
//
// The list was made on 2026-11-14 from Bluesky's own feed search, largest
// first by likes on the feed. "rule" is the maker's own description.
// Feeds left out on purpose: "Authors and Writers" (its rule says no AI, and
// this account is run by one), and the feeds that take posts only from an
// approved list of members.
import { readFileSync } from 'node:fs';

const PDS = 'https://bsky.social/xrpc';
const FEEDS = [
  { name: '#EduSky (teachers, 750 likes)', rule: '#EduSky, then its own filter', uri: 'at://did:plc:l72uci4styb4jucsgcrrj5ap/app.bsky.feed.generator/aaao5dzfm36u4' },
  { name: 'Homeschooling (28 likes)', rule: 'the word homeschool or homeschooling', uri: 'at://did:plc:xenbfv5wf6xharo6epphpyek/app.bsky.feed.generator/aaac5fkshuz4s' },
  { name: 'EduLib (24 likes)', rule: '#EduSky #UKEd #TeacherSky and librarian tags', uri: 'at://did:plc:5amsebbtpuqieuxuqadmmvcv/app.bsky.feed.generator/edulib' },
  { name: 'Writing Community (authors, 2,202 likes)', rule: '#writingcommunity #writerscommunity #writer #writers', uri: 'at://did:plc:abv47bjgzjgoh3yrygwoi36x/app.bsky.feed.generator/aaai4f7awwzkc' },
  { name: 'Authors & Writing (286 likes)', rule: 'words: authors, indie, self pub, published, cover reveal, #publishing, #author', uri: 'at://did:plc:k3opcqfbnpsly7bz754tfnmq/app.bsky.feed.generator/aaaml37qfteu4' },
  { name: 'Indie Authors (205 likes)', rule: 'words: self publish, indie, writing', uri: 'at://did:plc:lyrmsmhhg7vzz4ghj44y5xzq/app.bsky.feed.generator/430f904df091' },
];

const s = await fetch(`${PDS}/com.atproto.server.createSession`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ identifier: cred('BSKY_HANDLE'), password: cred('BSKY_APP_PASSWORD') }),
});
if (!s.ok) throw new Error(`login failed: ${s.status}`);
const { accessJwt, did } = await s.json();

for (const f of FEEDS) {
  const posts = [];
  let cursor = '', err = '';
  for (let page = 0; page < 4; page++) {
    const q = new URLSearchParams({ feed: f.uri, limit: '100' });
    if (cursor) q.set('cursor', cursor);
    const r = await fetch(`${PDS}/app.bsky.feed.getFeed?${q}`, { headers: { authorization: `Bearer ${accessJwt}` } });
    if (!r.ok) { err = `could not be read (${r.status})`; break; }
    const d = await r.json();
    posts.push(...d.feed.map((x) => x.post));
    cursor = d.cursor;
    if (!cursor || !d.feed.length) break;
  }
  console.log(`\n${f.name}: takes ${f.rule}`);
  if (err) { console.log(`  ${err}`); continue; }
  const age = (p) => (Date.now() - Date.parse(p.record.createdAt)) / 36e5;
  const day = posts.filter((p) => age(p) < 24);
  const oldest = Math.max(...posts.map(age));
  console.log(`  ${posts.length} posts read, the oldest ${oldest < 48 ? oldest.toFixed(0) + ' hours' : (oldest / 24).toFixed(0) + ' days'} old; ${day.length} from the last 24 hours, by ${new Set(day.map((p) => p.author.did)).size} accounts`);
  const ours = posts.map((p, i) => ({ p, i })).filter((x) => x.p.author.did === did);
  if (!ours.length) console.log('  ours: none');
  for (const { p, i } of ours) {
    console.log(`  ours: ${p.record.createdAt.slice(0, 16)}Z, ${i + 1} from the top, ${p.likeCount || 0} likes: ${p.record.text.slice(0, 60).replace(/\s+/g, ' ')}`);
  }
}

function cred(name) {
  const line = readFileSync(new URL('../../.git-credentials', import.meta.url), 'utf8')
    .split('\n').find((l) => l.startsWith(name + '='));
  if (!line) throw new Error(`${name} missing from .git-credentials`);
  return line.slice(name.length + 1).trim();
}

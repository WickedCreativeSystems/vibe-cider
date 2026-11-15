// Read-only: who posted in the two teacher feeds (#EduSky, Homeschooling) in the last N hours, with bio,
// follower counts and two of their posts, leaving out accounts we already follow or name to skip.
// For choosing the day's follows by eye; it follows nobody. Look at each one with
// `node scripts/bluesky.mjs --follow <handle>` before adding --post.
//   node scripts/bluesky-who.mjs [hours=30] [skip,handles,comma,separated]
import { readFileSync } from 'node:fs';
const hours = Number(process.argv[2] || 30);
const skip = new Set((process.argv[3] || '').split(',').filter(Boolean));
const cred = (name) => {
  const line = readFileSync(new URL('../../.git-credentials', import.meta.url), 'utf8').split('\n').find((l) => l.startsWith(name + '='));
  if (!line) throw new Error(name + ' missing');
  return line.slice(name.length + 1).trim();
};
const PDS = 'https://bsky.social/xrpc';
const s = await (await fetch(`${PDS}/com.atproto.server.createSession`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ identifier: cred('BSKY_HANDLE'), password: cred('BSKY_APP_PASSWORD') }) })).json();
const H = { authorization: `Bearer ${s.accessJwt}` };
const FEEDS = {
  edusky: 'at://did:plc:l72uci4styb4jucsgcrrj5ap/app.bsky.feed.generator/aaao5dzfm36u4',
  homeschooling: 'at://did:plc:xenbfv5wf6xharo6epphpyek/app.bsky.feed.generator/aaac5fkshuz4s',
};
const followed = new Set(JSON.parse(readFileSync(new URL('./bluesky-follows.json', import.meta.url), 'utf8')).map((f) => f.handle));
const since = Date.now() - hours * 36e5;
const by = {};
for (const [name, uri] of Object.entries(FEEDS)) {
  let cursor;
  for (let i = 0; i < 3; i++) {
    const r = await fetch(`${PDS}/app.bsky.feed.getFeed?feed=${encodeURIComponent(uri)}&limit=100${cursor ? '&cursor=' + encodeURIComponent(cursor) : ''}`, { headers: H });
    if (!r.ok) { console.log(name, 'getFeed', r.status); break; }
    const j = await r.json();
    for (const f of j.feed || []) {
      const p = f.post; if (f.reason) continue;
      if (Date.parse(p.indexedAt) < since) continue;
      const a = (by[p.author.did] ??= { handle: p.author.handle, feeds: new Set(), posts: [] });
      a.feeds.add(name); a.posts.push({ t: p.record.text.replace(/\s+/g, ' ').slice(0, 170), likes: p.likeCount, link: !!p.embed?.external });
    }
    cursor = j.cursor; if (!cursor) break;
  }
}
const dids = Object.keys(by).filter((d) => !followed.has(by[d].handle) && !skip.has(by[d].handle.replace('.bsky.social', '')) && !skip.has(by[d].handle));
for (let i = 0; i < dids.length; i += 25) {
  const q = dids.slice(i, i + 25).map((d) => 'actors=' + encodeURIComponent(d)).join('&');
  const j = await (await fetch(`${PDS}/app.bsky.actor.getProfiles?${q}`, { headers: H })).json();
  for (const p of j.profiles || []) Object.assign(by[p.did], { bio: (p.description || '').replace(/\s+/g, ' '), followers: p.followersCount, follows: p.followsCount, nposts: p.postsCount, following: !!p.viewer?.following, followsUs: !!p.viewer?.followedBy });
}
const rows = dids.map((d) => by[d]).filter((a) => !a.following).sort((a, b) => a.posts.length - b.posts.length);
console.log(rows.length, 'accounts not followed, posted in the last', hours, 'hours');
for (const a of rows) {
  const noai = /\bno (gen)?\s?ai\b|anti[- ]ai|ai[- ]free/i.test(a.bio || '') ? ' [NO AI: skip]' : '';
  console.log(`\n@${a.handle}${noai}  followers ${a.followers} follows ${a.follows} posts ${a.nposts}  in: ${[...a.feeds].join('+')}  (${a.posts.length} here, ${a.posts.filter((p) => p.link).length} with a link card)`);
  console.log('  bio:', (a.bio || '').slice(0, 200));
  for (const p of a.posts.slice(0, 2)) console.log('  -', p.t);
}

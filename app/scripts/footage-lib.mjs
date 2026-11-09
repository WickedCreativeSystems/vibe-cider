// Shared capture for the house-channel footage (scripts/footage-*.mjs): a
// phone-sized Chromium on the live site, recorded from its own screencast at
// 3× device pixels and written as 1080×1920 H.264. No captions, no logo, no
// music: the docent adds those. Playwright's bundled ffmpeg only writes VP8,
// so FFMPEG must point at one with libx264.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

// outDir: the public/media/ folder of the app the clip is for (Puzzle Press by default).
export async function shoot(slug, script, { outDir = new URL("../public/media/", import.meta.url).pathname } = {}) {
  const FFMPEG = process.env.FFMPEG;
  if (!FFMPEG) throw new Error("set FFMPEG to an ffmpeg with libx264");
  const tmp = mkdtempSync(join(tmpdir(), "footage-"));
  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
    acceptDownloads: true,
  });
  // Not a visitor: keep the recording off Web Analytics and the funnel beacons.
  await ctx.route("https://static.cloudflareinsights.com/**", (r) => r.abort());
  await ctx.route("**/px/**", (r) => r.fulfill({ status: 204, body: "" }));
  const page = await ctx.newPage();
  const wait = (ms) => page.waitForTimeout(ms);

  // Chrome sends a frame only when the screen changes, each with its own
  // timestamp; the concat list turns them back into real time.
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", async (f) => {
    const file = join(tmp, `f${String(frames.length).padStart(5, "0")}.jpg`);
    writeFileSync(file, Buffer.from(f.data, "base64"));
    frames.push({ file, t: f.metadata.timestamp });
    await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });

  // A finger has no pointer, so show where it lands.
  const ring = () => page.addStyleTag({ content: `#__tap{position:fixed;z-index:99999;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;
    background:rgba(29,53,87,.28);border:2px solid rgba(29,53,87,.7);pointer-events:none;opacity:0;transition:opacity .15s}` });
  const tap = async (sel) => {
    const el = page.locator(sel).first();
    await el.scrollIntoViewIfNeeded();
    const b = await el.boundingBox();
    await page.evaluate(([x, y]) => {
      let r = document.getElementById("__tap");
      if (!r) { r = document.createElement("div"); r.id = "__tap"; document.body.appendChild(r); }
      r.style.left = x + "px"; r.style.top = y + "px"; r.style.opacity = "1";
      setTimeout(() => (r.style.opacity = "0"), 450);
    }, [b.x + Math.min(b.width / 2, 40), b.y + b.height / 2]);
    await wait(250);
    await el.tap();
  };
  const typeInto = async (sel, text) => {
    await tap(sel);
    await page.fill(sel, "");
    await page.locator(sel).pressSequentially(text, { delay: 60 });
    await wait(250);
  };
  const scrollTo = async (sel, block = "start") => {
    await page.evaluate(([q, b]) => document.querySelector(q).scrollIntoView({ behavior: "smooth", block: b }), [sel, block]);
    await wait(1000);
  };
  const download = async (sel, name) => {
    const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 180000 }), tap(sel)]);
    const f = join(tmp, name);
    await dl.saveAs(f);
    return f;
  };
  const start = async () => { await ring(); await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 1080, maxHeight: 1920 }); };
  // A page of a PDF this run made, rendered from the file itself.
  const png = (file, n, dpi) => {
    const prefix = join(tmp, `pg${n}x${dpi}`);
    execFileSync("pdftoppm", ["-r", String(dpi), "-f", String(n), "-l", String(n), "-png", file, prefix]);
    for (const f of [`${prefix}-${String(n).padStart(2, "0")}.png`, `${prefix}-${n}.png`, `${prefix}-${String(n).padStart(3, "0")}.png`]) {
      try { return `data:image/png;base64,${readFileSync(f).toString("base64")}`; } catch {}
    }
    throw new Error("no page image");
  };
  const show = async (src, hold, maxW = 90) => {
    await page.setContent(`<!doctype html><meta name="viewport" content="width=device-width"><style>
      html,body{margin:0;height:100%;background:#e9edf3;display:flex;align-items:center;justify-content:center}
      img{max-width:${maxW}%;max-height:86%;background:#fff;box-shadow:0 8px 24px rgba(20,30,50,.22)}</style><img src="${src}">`);
    await wait(hold);
  };

  await script({ page, wait, tap, typeInto, scrollTo, download, start, png, show });
  await wait(2200); // clean tail for the end card
  await cdp.send("Page.stopScreencast");
  const end = Date.now() / 1000;

  // Frames → constant 30 fps H.264, with a silent stereo track so every
  // platform treats it as an ordinary video.
  // Chrome can hand two frames over a few ms out of order (11-09); a negative
  // duration makes ffmpeg reject the whole list.
  frames.sort((a, b) => a.t - b.t);
  const list = frames.map((f, i) => `file '${f.file}'\nduration ${Math.max(0, (frames[i + 1]?.t ?? end) - f.t).toFixed(3)}`).join("\n")
    + `\nfile '${frames.at(-1).file}'\n`;
  writeFileSync(join(tmp, "list.txt"), list);
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", join(tmp, "list.txt"),
    "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
    "-vf", "fps=30,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0xe9edf3,format=yuv420p",
    "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-c:a", "aac", "-b:a", "96k", "-shortest", "-movflags", "+faststart",
    join(outDir, `${slug}.mp4`)]);
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
  console.log(`wrote ${join(outDir, slug)}.mp4 from ${frames.length} frames, ${(end - frames[0].t).toFixed(1)} s`);
}

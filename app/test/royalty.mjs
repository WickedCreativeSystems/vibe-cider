// The royalty page, and the royalty line inside the tool, must agree with
// each other and with KDP's published rates.
import { chromium } from "playwright";
const base = process.argv[2] || "https://puzzlepress.bananafest-destiny.com";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
await p.route("https://static.cloudflareinsights.com/**", (route) => route.abort());
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));

await p.goto(`${base}/royalty-calculator`, { waitUntil: "networkidle" });
await p.waitForFunction(() => document.getElementById("printing").textContent !== "—");

const cases = [
  // KDP's own worked example.
  { trim: "6x9", pages: "300", ink: "black", list: "16.99", printing: "$4.60", earn: "$5.59" },
  { trim: "6x9", pages: "100", ink: "black", list: "9.99", printing: "$2.30", earn: "$3.69" },
  { trim: "8.5x11", pages: "100", ink: "black", list: "12.99", printing: "$2.84", earn: "$4.95" },
  { trim: "8.5x11", pages: "200", ink: "black", list: "12.99", printing: "$4.40", earn: "$3.39" },
];
for (const c of cases) {
  await p.selectOption("#trim", c.trim);
  await p.selectOption("#ink", c.ink);
  await p.fill("#pages", c.pages);
  await p.fill("#list", c.list);
  await p.waitForTimeout(200);
  const printing = (await p.textContent("#printing")).trim();
  const earn = (await p.textContent("#earn")).trim();
  console.log(`${c.trim} ${c.pages}p @ ${c.list}: prints ${printing}, keeps ${earn}`);
  if (printing !== c.printing) throw new Error(`printing ${printing} != ${c.printing}`);
  if (earn !== c.earn) throw new Error(`royalty ${earn} != ${c.earn}`);
}

// Priced below cost must warn, not quietly show a negative.
await p.fill("#list", "3.99");
await p.waitForTimeout(200);
if (await p.isHidden("#warn")) throw new Error("a book priced below cost should warn");
console.log("below-cost warning:", (await p.textContent("#warn")).slice(0, 80));

// One cent under the minimum: the shortfall is half a cent and shows as $0.00,
// and it must still warn. KDP's floor for this book is $4.20 / 0.5 = $8.40.
await p.selectOption("#trim", "8.5x11");
await p.selectOption("#ink", "premiumColor");
await p.fill("#pages", "24");
await p.fill("#list", "8.39");
await p.waitForTimeout(200);
if (await p.isHidden("#warn")) throw new Error("$8.39 is under the $8.40 minimum and should warn");
const cent = await p.textContent("#warn");
if (!cent.includes("$8.40") || cent.includes("loses $0.00")) throw new Error(`one-cent warning reads wrong: ${cent}`);
console.log("one-cent-under warning:", cent);
await p.fill("#list", "8.40");
await p.waitForTimeout(200);
if (!(await p.isHidden("#warn"))) throw new Error("$8.40 is the minimum and should not warn");

// A combination KDP will not print.
await p.selectOption("#ink", "standardColor");
await p.fill("#pages", "50");
await p.waitForTimeout(200);
console.log("unprintable combo:", (await p.textContent("#warn")).slice(0, 70));

// And the same numbers inside the tool.
await p.goto(base, { waitUntil: "networkidle" });
await p.waitForSelector(".grid div");
await p.evaluate(() => localStorage.setItem("puzzlepress.license", JSON.stringify({ email: "t@e.com", token: "d", verifiedAt: Date.now() })));
await p.reload({ waitUntil: "networkidle" });
await p.waitForSelector(".grid div");
await p.selectOption("#trim", "6x9");
await p.fill("#count", "100");
await p.fill("#list", "9.99");
await p.waitForTimeout(900);
const meta = await p.textContent("#meta");
const money = await p.textContent("#moneyNote");
console.log("tool meta :", meta);
console.log("tool money:", money);
const pages = Number(meta.match(/(\d+) pages/)[1]);
// 120 pages, regular trim, black -> 1.00 + 120*0.012 = 2.44
const expected = pages <= 110 ? 2.3 : Math.round((1 + pages * 0.012) * 100) / 100;
if (!money.includes(`$${expected.toFixed(2)}`)) {
  throw new Error(`tool quotes a different printing cost than the rate table: ${money}, expected $${expected.toFixed(2)} for ${pages} pages`);
}
console.log("page errors:", errs.length ? errs : "none");
await b.close();
console.log("ROYALTY OK");

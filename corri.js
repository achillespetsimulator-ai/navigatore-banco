const { chromium } = require('playwright'); const fs = require('fs');
const [, , esp, quanti, shard, tot, seme] = process.argv;
(async () => {
  const t = await (await fetch('https://tranco-list.eu/api/lists/date/latest')).json();
  const csv = await (await fetch('https://tranco-list.eu/download/' + t.list_id + '/5000')).text();
  const l = csv.split('\n').map((x) => x.trim().split(',')[1]).filter(Boolean);
  let a = +seme; const rng = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let q = Math.imul(a ^ a >>> 15, 1 | a); q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; };
  for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; }
  const miei = l.slice(0, +quanti).filter((_, i) => i % +tot === +shard);
  const fn = require('./esperimenti/' + esp + '.js');
  const b = await chromium.launch({ headless: false });
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (i < miei.length) {
      const d = miei[i++], ctx = await b.newContext({ viewport: { width: 1280, height: 713 } }), p = await ctx.newPage(), t0 = Date.now(); let r;
      try { r = await Promise.race([fn(p, d), new Promise((_, n) => setTimeout(() => n(new Error('tempo')), 90000))]); } catch (e) { r = { err: String(e.message).slice(0, 80) }; }
      out.push(Object.assign({ d, ms: Date.now() - t0 }, r));
      await ctx.close().catch(() => {});
    }
  }));
  fs.writeFileSync('ris-' + shard + '.json', JSON.stringify(out)); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });

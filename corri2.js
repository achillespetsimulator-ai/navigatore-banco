// Prende la sua parte di siti e li misura, 8 alla volta. Salva a intervalli: se scade il tempo il lavoro fatto resta.
const { chromium } = require('playwright'); const fs = require('fs'); const zlib = require('zlib');
const misura = require('./misura.js');
const [, , shard, tot, nStr, semeS, listaId] = process.argv;
const MAX_MS = (+process.env.MAX_MIN || 150) * 60000, inizio = Date.now();
const rngDa = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let q = Math.imul(a ^ a >>> 15, 1 | a); q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; };
const mescola = (v, rng) => { for (let i = v.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [v[i], v[j]] = [v[j], v[i]]; } return v; };
const pool = async () => {
  const leggi = (f, g) => fs.readFileSync(f, 'utf8').split('\n').map((x) => x.trim()).filter(Boolean).map((d) => ({ d, g }));
  const csv = await (await fetch('https://tranco-list.eu/download/' + listaId + '/1000000')).text();
  const dom = csv.split('\n').map((x) => x.trim().split(',')[1]).filter(Boolean), rng = rngDa(+semeS), n = +nStr;
  const fette = [['top', 0, 10000], ['medio', 10000, 100000], ['coda', 100000, 1000000]];
  const tutti = leggi('miei.txt', 'miei').concat(leggi('nicchia.txt', 'nicchia'));
  for (const [g, a, b] of fette) for (const d of mescola(dom.slice(a, b), rng).slice(0, n)) tutti.push({ d, g });
  const visti = new Set(), unici = tutti.filter((x) => !visti.has(x.d) && visti.add(x.d));
  return mescola(unici, rngDa(+semeS + 1));
};
(async () => {
  const lista = await pool();
  const miei = lista.filter((_, i) => i % +tot === +shard);
  console.log('siti', lista.length, 'miei', miei.length);
  let b = null, avvio = null;
  const browser = async () => { if (b && b.isConnected()) return b; if (!avvio) avvio = chromium.launch({ headless: false, args: ['--disable-dev-shm-usage'] }).then((x) => { b = x; avvio = null; return x; }); return avvio; };
  const out = []; let i = 0;
  const salva = () => fs.writeFileSync('ris-' + shard + '.json.gz', zlib.gzipSync(JSON.stringify(out)));
  const timer = setInterval(salva, 60000);
  await Promise.all(Array.from({ length: +process.env.PAGINE || 8 }, async () => {
    while (i < miei.length && Date.now() - inizio < MAX_MS) {
      const x = miei[i++], t0 = Date.now(); let r, ctx;
      try {
        const br = await browser(); ctx = await br.newContext({ viewport: { width: 1280, height: 713 }, acceptDownloads: false }); const p = await ctx.newPage();
        r = await Promise.race([misura(p, ctx, x.d, x.g), new Promise((_, n) => setTimeout(() => n(new Error('tempo')), 110000))]);
      } catch (e) { r = { d: x.d, g: x.g, err: String(e.message).slice(0, 70) }; }
      r.ms = Date.now() - t0; out.push(r);
      if (ctx) await Promise.race([ctx.close().catch(() => {}), new Promise((k) => setTimeout(k, 5000))]);
    }
  }));
  clearInterval(timer); salva(); console.log('fatti', out.length, 'su', miei.length); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });

// Analisi con le regole fissate prima di vedere i dati. Sceglie i parametri su metà dei siti, riporta sull'altra metà.
const fs = require('fs'), zlib = require('zlib');
const dir = process.argv[2] || 'arte', uscita = process.argv[3] || 'report.json';
let S = []; for (const f of fs.readdirSync(dir)) if (f.endsWith('.gz')) S = S.concat(JSON.parse(zlib.gunzipSync(fs.readFileSync(dir + '/' + f))));
// un sito può aver cambiato il modo in cui la sua pagina trasforma le liste in testo (librerie vecchie): i suoi dati arrivano rovinati e si scartano, contandoli
const evOk = (v) => Array.isArray(v) && v.every((e) => Array.isArray(e) && typeof e[0] === 'number');
let rovinati = 0; for (const s of S) { if (s.err) continue; if (!Array.isArray(s.az)) s.az = []; if ((s.vai && (!evOk(s.vai.ev) || !Array.isArray(s.vai.req))) || s.az.some((x) => !evOk(x.ev) || !Array.isArray(x.req))) { s.err = 'dati rovinati dalla pagina'; rovinati++; } }
const hash = (d) => [...d].reduce((a, c) => (a * 33 + c.charCodeAt(0)) | 0, 5381);
const q = (v, p) => { if (!v.length) return null; const b = v.slice().sort((x, y) => x - y); return b[Math.floor((b.length - 1) * p)]; };
const quant = (v) => ({ n: v.length, p25: q(v, .25), p50: q(v, .5), p75: q(v, .75), p90: q(v, .9), p95: q(v, .95), p99: q(v, .99), max: q(v, 1) });
const ok = S.filter((s) => !s.err && s.stato && s.stato < 400 && s.k && s.k.tot >= 3);
const R = { siti: S.length, utilizzabili: ok.length, datiRovinati: rovinati, perGruppo: {} };
for (const g of ['miei', 'nicchia', 'top', 'medio', 'coda']) { const a = S.filter((s) => s.g === g), b = ok.filter((s) => s.g === g); R.perGruppo[g] = { siti: a.length, utilizzabili: b.length, errori: a.filter((s) => s.err).length, bloccati: a.filter((s) => s.stato >= 400).length, azioni: b.reduce((x, s) => x + s.az.length, 0) }; }
const errori = {}; for (const s of S) if (s.err) { const k = s.err.replace(/https?:\S+/g, '').slice(0, 40); errori[k] = (errori[k] || 0) + 1; } R.errori = Object.entries(errori).sort((a, b) => b[1] - a[1]).slice(0, 12);
const stati = {}; for (const s of S) if (s.stato >= 400) stati[s.stato] = (stati[s.stato] || 0) + 1; R.statiErrore = stati;
// raggiungibilità del clic
const som = { tot: 0, centro: 0, etichetta: 0, griglia: 0, nessuno: 0 }; for (const s of ok) for (const k in som) som[k] += s.k[k] || 0; R.clic = som;
R.sitiConCoperti = { oltre20: ok.filter((s) => s.k.nessuno / s.k.tot > .2).length, zero: ok.filter((s) => !s.k.nessuno).length };
// costi di lettura e pagine
R.axMs = quant(ok.filter((s) => s.axMs != null).map((s) => s.axMs)); R.axComandi = quant(ok.filter((s) => s.axN != null).map((s) => s.axN)); R.nodi = quant(ok.map((s) => s.nodi)); R.maxOpzioni = quant(ok.filter((s) => s.select).map((s) => s.maxOpzioni));
R.iframe = { conIframe: ok.filter((s) => s.iframe > 0).length, canvasGrande: ok.filter((s) => s.canvas >= .15).length, conSelect: ok.filter((s) => s.select > 0).length };
// stabilità degli elementi
const st = {}; let nst = 0; for (const s of ok) if (s.stab) { nst++; for (const k in s.stab) st[k] = (st[k] || 0) + s.stab[k]; } R.stabilita12s = { siti: nst, conta: st, sitiSenzaCambi: ok.filter((s) => s.stab && Object.keys(s.stab).every((k) => k === 'uguale' || !s.stab[k])).length };
// apertura pagina
const v = ok.filter((s) => s.vai && s.vai.ev.length);
const lenA = (s, T) => { let l = 0; for (const e of s.vai.ev) if (e[0] <= T) l = e[1]; return l; };
const repVai = (s, ini, Wd, Wp, cap) => { const ev = s.vai.ev.map((e) => e[0]).filter((t) => t >= ini).sort((a, b) => a - b); let last = ini, i = 0, c = false; for (let t = ini; t <= ini + cap; t += 20) { while (i < ev.length && ev[i] <= t) { last = ev[i++]; c = true; } for (const [a, b] of s.vai.req) if (a <= t && (b === 0 || b > t) && t - a < 5000) { last = t; break; } if (t - last >= (c ? Wd : Wp)) return t; } return ini + cap; };
const valVai = (f) => { const x = v.map((s) => { const T = f(s), fin = s.vai.len || lenA(s, 8000); return { ms: T, q: fin > 0 ? Math.min(1, lenA(s, T) / fin) : 1, vuota: lenA(s, T) === 0 && fin > 0 }; }); return { n: x.length, media: Math.round(x.reduce((a, y) => a + y.ms, 0) / x.length), p50: q(x.map((y) => y.ms), .5), p90: q(x.map((y) => y.ms), .9), sotto80: +(100 * x.filter((y) => y.q < .8).length / x.length).toFixed(1), vuote: +(100 * x.filter((y) => y.vuota).length / x.length).toFixed(1) }; };
R.vai = { loadDopoDCL: quant(v.filter((s) => s.vai.load).map((s) => s.vai.load)), oggi: valVai((s) => repVai(s, 0, 450, 450, 4000)) };
for (const [Wd, Wp, cap] of [[100, 450, 2000], [100, 800, 2000], [200, 800, 3500], [100, 800, 5000]]) R.vai[Wd + '/' + Wp + '/' + cap] = valVai((s) => repVai(s, 0, Wd, Wp, cap));
for (const M of [2000, 4000, 8000]) R.vai['load max ' + M + ', poi 100/800/2000'] = valVai((s) => repVai(s, Math.min(s.vai.load || M, M), 100, 800, 2000));
// azioni
const az = []; for (const s of ok) for (const a of s.az) if (a.fatto) { const ev = a.ev.map((e) => e[0]), dopo = ev.filter((t) => t >= 0).sort((x, y) => x - y), idle = ev.filter((t) => t < 0), b = idle.length / 3000; let somma = 0; const rI = a.req.filter((x) => x[0] < 0); for (const [x, y] of rI) somma += Math.max(0, Math.min(y || 0, 0) - Math.max(x, -3000)); const aIdle = Math.round(somma / 3000); const stato0 = a.k === 'scrivi' || a.k === 'select' || a.k === 'check' || (a.k === 'scorri' && a.sc.some((t) => t >= 0 && t <= 300)); az.push({ s, a, g: s.g, k: a.k, d: s.d, dopo, b, aIdle, req: a.req.filter((x) => x[0] >= -50), mut: a.mut.filter((t) => t >= 0), anim: a.anim.filter((t) => t >= 0).sort((x, y) => x - y), stato0, meta: Math.abs(hash(s.d)) % 2 }); }
const conta = {}; for (const x of az) { const c = conta[x.k] = conta[x.k] || { n: 0, nuovaPagina: 0, nuovaScheda: 0, finestraSito: 0, scaricamento: 0, stessaPagina: 0, conEffetto: 0, senzaEffetto: 0, soloDOM: 0 }; c.n++; if (x.a.nd) c.nuovaPagina++; if (x.a.pop) c.nuovaScheda++; if (x.a.dia.length) c.finestraSito++; if (x.a.dl) c.scaricamento++; }
const effetto = (p, T1, T2) => { const n = p.dopo.filter((t) => t > T1 && t <= T2).length, att = p.b * (T2 - T1); return p.b === 0 ? n > 0 : n > att + 2 * Math.sqrt(att); };
const P = az.filter((x) => !x.a.nd && !x.a.pop && !x.a.dia.length);
const primi = {}; for (const x of P) { const c = conta[x.k]; c.stessaPagina++; if (effetto(x, -1, 5000)) { c.conEffetto++; (primi[x.k] = primi[x.k] || []).push(x.dopo[0]); } else { c.senzaEffetto++; if (x.mut.length) c.soloDOM++; } }
R.tipiAzione = conta; R.primoEffetto = {}; for (const k in primi) R.primoEffetto[k] = quant(primi[k]); R.primoEffettoTutti = quant(Object.values(primi).flat()); R.primoEffettoPerGruppo = {}; for (const g of ['miei', 'nicchia', 'top', 'medio', 'coda']) R.primoEffettoPerGruppo[g] = quant(P.filter((x) => x.g === g && effetto(x, -1, 5000)).map((x) => x.dopo[0]));
R.finestraSitoMs = quant(az.flatMap((x) => x.a.dia)); R.animazioni = { azioniConAnimazione: P.filter((x) => x.anim.length).length, fine: quant(P.filter((x) => x.anim.length).map((x) => x.anim[x.anim.length - 1])) };
const cv = az.filter((x) => x.k === 'canvas'); R.canvas = { n: cv.length, schermoCambia: cv.filter((x) => x.a.shots && x.a.shots.length).length, ultimo: quant(cv.filter((x) => x.a.shots && x.a.shots.length).map((x) => x.a.shots[x.a.shots.length - 1])) };
const reqAtt = (p, t, soglia) => { let ap = 0; for (const [s, e] of p.req) if (s <= t && (e === 0 || e > t) && t - s < 5000) ap++; return ap > soglia; };
const sim = (p, Wd, Wp, cap, fam) => { if (fam.Wp0) { const m = p.mut.some((t) => t <= fam.Wp0), rq = p.req.some(([s]) => s <= fam.Wp0); if (!m && !rq && !p.dopo.some((t) => t <= fam.Wp0) && !p.stato0) return { r: fam.Wp0, t: false }; } let last = 0, i = 0, j = 0, c = p.stato0; for (let t = 0; t <= cap; t += 20) { while (i < p.dopo.length && p.dopo[i] <= t) { const e = p.dopo[i++]; let conta = true; if (fam.fondo && p.b > 0) { const n = p.dopo.filter((x) => x > e - 500 && x <= e).length, att = p.b * 500; conta = n > att + 2 * Math.sqrt(att); } if (conta) { last = e; c = true; } } if (fam.anim) while (j < p.anim.length && p.anim[j] <= t) last = Math.max(last, p.anim[j++]); if (!fam.noReq && reqAtt(p, t, fam.fondo ? p.aIdle : 0)) last = t; if (t - last >= (c ? Wd : Wp)) return { r: t, t: false }; } return { r: cap, t: true }; };
const valuta = (L, Wd, Wp, cap, fam, Tv) => { let som = 0, fn = 0, te = 0, par = 0; for (const p of L) { const s = sim(p, Wd, Wp, cap, fam); som += s.r; if (s.t) te++; if (effetto(p, -1, s.r)) { if (effetto(p, s.r, 5000)) par++; } else if (effetto(p, s.r, 5000)) fn++; } const n = L.length || 1, m = som / n; return { n: L.length, media: Math.round(m), falsiNiente: fn, pctFalsi: +(100 * fn / n).toFixed(2), tetto: te, pctTetto: +(100 * te / n).toFixed(1), parziali: par, pctParziali: +(100 * par / n).toFixed(1), costo: Math.round(m + Tv * fn / n) }; };
const A = P.filter((x) => x.meta === 1), B = P.filter((x) => x.meta === 0);
R.campioni = { azioni: az.length, stessaPagina: P.length, A: A.length, B: B.length };
const griglia = []; for (const Wd of [50, 100, 150, 200, 300, 450]) for (const Wp of [300, 450, 600, 800, 1000, 1500]) for (const cap of [2000, 3500, 5000]) griglia.push([Wd, Wp, cap]);
const FAM = { semplice: {}, fondo: { fondo: true }, senzaRichieste: { noReq: true }, conAnimazioni: { anim: true }, reazione100: { Wp0: 100 }, reazione200: { Wp0: 200 }, reazione300: { Wp0: 300 } };
R.oggiSuB = {}; R.scelte = {}; const memo = new Map();
for (const T of [5000, 10000, 20000]) { R.oggiSuB['T' + T / 1000] = valuta(B, 450, 450, 3500, {}, T); R.scelte['T' + T / 1000] = {}; for (const [nome, fam] of Object.entries(FAM)) { let top = null; for (const g of griglia) { const ch = nome + g.join('/'); const v0 = memo.get(ch) || valuta(A, g[0], g[1], g[2], fam, 0); memo.set(ch, v0); const v = Object.assign({}, v0, { costo: Math.round(v0.media + T * v0.falsiNiente / (v0.n || 1)) }); if (!top || v.costo < top.v.costo) top = { g, v }; } R.scelte['T' + T / 1000][nome] = { scelta: top.g.join('/'), suA: top.v, suB: valuta(B, top.g[0], top.g[1], top.g[2], fam, T) }; } }
// la superficie: quanto conta il numero preciso (su B, famiglia semplice, tetto 2000)
R.superficie = {}; for (const Wd of [50, 100, 150, 200, 300, 450]) for (const Wp of [300, 450, 600, 800, 1000, 1500]) R.superficie[Wd + '/' + Wp] = valuta(B, Wd, Wp, 2000, {}, 10000).costo;
// regola candidata su B, per tipo e per gruppo, con intervallo (ricampionando i siti)
const scelta = (R.scelte.T10.semplice.scelta).split('/').map(Number);
R.candidata = { parametri: scelta.join('/') };
const perSito = new Map(); for (const x of B) { if (!perSito.has(x.d)) perSito.set(x.d, []); perSito.get(x.d).push(x); }
const siti = [...perSito.keys()]; let s0 = 12345; const rn = () => { s0 = (s0 * 1103515245 + 12345) & 0x7fffffff; return s0 / 0x7fffffff; };
const boot = (Wd, Wp, cap) => { const res = []; for (let b = 0; b < 200; b++) { const L = []; for (let i = 0; i < siti.length; i++) L.push(...perSito.get(siti[Math.floor(rn() * siti.length)])); res.push(valuta(L, Wd, Wp, cap, {}, 10000)); } return { costo95: [q(res.map((x) => x.costo), .025), q(res.map((x) => x.costo), .975)], falsi95: [q(res.map((x) => x.pctFalsi), .025), q(res.map((x) => x.pctFalsi), .975)], media95: [q(res.map((x) => x.media), .025), q(res.map((x) => x.media), .975)] }; };
R.candidata.intervalli = boot(scelta[0], scelta[1], scelta[2]); R.oggiIntervalli = boot(450, 450, 3500);
R.perTipo = {}; for (const k of new Set(B.map((x) => x.k))) { const L = B.filter((x) => x.k === k); R.perTipo[k] = { oggi: valuta(L, 450, 450, 3500, {}, 10000), candidata: valuta(L, scelta[0], scelta[1], scelta[2], {}, 10000) }; }
R.perGruppoB = {}; for (const g of ['miei', 'nicchia', 'top', 'medio', 'coda']) { const L = B.filter((x) => x.g === g); R.perGruppoB[g] = { oggi: valuta(L, 450, 450, 3500, {}, 10000), candidata: valuta(L, scelta[0], scelta[1], scelta[2], {}, 10000) }; }
R.fondoPagineMobili = { n: P.filter((x) => x.b > 0).length, semplice: valuta(P.filter((x) => x.b > 0), scelta[0], scelta[1], scelta[2], {}, 10000), fondo: valuta(P.filter((x) => x.b > 0), scelta[0], scelta[1], scelta[2], { fondo: true }, 10000) };
fs.writeFileSync(uscita, JSON.stringify(R, null, 1)); console.log('report', Object.keys(R).length, 'siti', S.length, 'azioni', az.length);

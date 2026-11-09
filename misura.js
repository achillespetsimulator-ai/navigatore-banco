// Misura un sito: apertura, azioni diverse scelte a caso, tutto con i tempi relativi all'azione.
const crypto = require('crypto');
const attendi = (ms) => new Promise((k) => setTimeout(k, ms));
const lim = (pr, ms) => Promise.race([pr, new Promise((_, n) => setTimeout(() => n(new Error('tempo')), ms))]);
const rngDa = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let q = Math.imul(a ^ a >>> 15, 1 | a); q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; };
const IDLE = 3000, DOPO = 5000;

const DIARIO = () => {
  if (window.__o) return;
  const o = window.__o = { doc: Math.random(), ev: [], mut: [], anim: [], sc: [] };
  let prec = null, tp = 0, tm = 0;
  const fai = () => { tm = 0; const t = document.body ? document.body.innerText : ''; if (t !== prec) { prec = t; if (o.ev.length < 4000) o.ev.push([tp, t.length]); } tp = 0; };
  new MutationObserver(() => { const n = Date.now(); if (o.mut.length < 4000 && (!o.mut.length || n - o.mut[o.mut.length - 1] >= 20)) o.mut.push(n); if (!tp) tp = n; if (!tm) tm = setTimeout(fai, 30); }).observe(document, { subtree: true, childList: true, characterData: true, attributes: true });
  for (const e of ['transitionend', 'animationend', 'transitioncancel', 'animationcancel']) addEventListener(e, () => { if (o.anim.length < 1000) o.anim.push(Date.now()); }, true);
  addEventListener('scroll', () => { if (o.sc.length < 1000) o.sc.push(Date.now()); }, true);
};

const SONDA = () => {
  const colpito = (x, y) => { let e = document.elementFromPoint(x, y); while (e && e.shadowRoot) { const i = e.shadowRoot.elementFromPoint(x, y); if (!i || i === e) break; e = i; } return e; };
  const su = (e) => e.assignedSlot || e.parentElement || (e.parentNode && e.parentNode.host) || null;
  const dentro = (x, y) => { for (let z = y; z; z = su(z)) if (z === x) return true; return false; };
  const vw = innerWidth, vh = innerHeight, k = { tot: 0, centro: 0, etichetta: 0, griglia: 0, nessuno: 0 };
  for (const el of document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=checkbox],[role=tab],[role=menuitem],[contenteditable=true]')) {
    if (el.checkVisibility && !el.checkVisibility({ checkVisibilityCSS: true })) continue;
    const ok = (r) => r.width >= 1 && r.height >= 1 && r.right > 0 && r.bottom > 0 && r.left < vw && r.top < vh;
    const rr = [...el.getClientRects()].filter(ok); if (!rr.length) continue;
    k.tot++;
    const et = [...(el.labels || [])], giusto = (h) => !!h && (dentro(el, h) || et.some((l) => dentro(l, h)));
    const ca = (r, px, py) => { const l = Math.max(r.left, 0), t = Math.max(r.top, 0), d = Math.min(r.right, vw), b = Math.min(r.bottom, vh); return giusto(colpito(Math.floor(l + (d - l) * px), Math.floor(t + (b - t) * py))); };
    if (rr.some((r) => ca(r, .5, .5))) { k.centro++; continue; }
    const rl = et.flatMap((l) => [...l.getClientRects()]).filter(ok);
    if (rl.some((r) => ca(r, .5, .5))) { k.etichetta++; continue; }
    let g = false;
    for (const r of rr.concat(rl)) { for (let i = 1; i <= 4 && !g; i++) for (let j = 1; j <= 4 && !g; j++) if (ca(r, i / 5, j / 5)) g = true; if (g) break; }
    k[g ? 'griglia' : 'nessuno']++;
  }
  let canvas = 0; for (const c of document.querySelectorAll('canvas')) { const q = c.getBoundingClientRect(); canvas = Math.max(canvas, Math.max(0, Math.min(q.right, vw) - Math.max(q.left, 0)) * Math.max(0, Math.min(q.bottom, vh) - Math.max(q.top, 0)) / (vw * vh)); }
  return { k, canvas: +canvas.toFixed(2), nodi: document.querySelectorAll('*').length, iframe: document.querySelectorAll('iframe').length, select: document.querySelectorAll('select').length, maxOpzioni: Math.max(0, ...[...document.querySelectorAll('select')].map((s) => s.options.length)) };
};

const SCEGLI = ([k, seme]) => {
  let a = seme; const rng = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let q = Math.imul(a ^ a >>> 15, 1 | a); q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; };
  const vw = innerWidth, vh = innerHeight, NO = /accedi|login|log in|sign|buy|acquista|cart|carrello|delete|elimina|iscri|subscri|abbona|accett|accept|rifiut|reject|agree|paga|pay|cookie|consent|close|chiudi|skip|salta|download|scarica|log out|esci|remove|rimuovi|conferma|confirm|send|invia|submit|order|checkout/i;
  const SEL = { ctrl: 'button,[role=button],[role=tab],[role=menuitem],summary,[aria-expanded],[aria-haspopup]', link: 'a[href]', check: 'input[type=checkbox],input[type=radio],[role=checkbox],[role=switch]', scrivi: 'input[type=text],input[type=search],input:not([type]),textarea,[contenteditable=true]', canvas: 'canvas' }[k];
  const c = [];
  for (const e of document.querySelectorAll(SEL)) {
    if (e.disabled || (e.type === 'submit' && e.form)) continue;
    if (k === 'ctrl' && e.matches('a[href]') && !e.matches('[aria-haspopup],[aria-expanded]')) continue;
    if (k === 'link' && e.matches('[aria-haspopup],[aria-expanded]')) continue;
    const q = e.getBoundingClientRect(), l = Math.max(q.left, 0), t = Math.max(q.top, 0), r = Math.min(q.right, vw), b = Math.min(q.bottom, vh);
    if (r - l < 6 || b - t < 6) continue;
    if (k === 'canvas' && (r - l) * (b - t) / (vw * vh) < .15) continue;
    const x = (l + r) / 2, y = (t + b) / 2, h = document.elementFromPoint(x, y);
    if (!h || !(e === h || e.contains(h) || (e.labels && [...e.labels].some((z) => z.contains(h))))) continue;
    const n = (e.getAttribute('aria-label') || e.innerText || e.placeholder || '').trim().replace(/\s+/g, ' ').slice(0, 30);
    if (k !== 'canvas' && NO.test(n + ' ' + (e.name || '') + ' ' + (e.id || ''))) continue;
    if ((k === 'ctrl' || k === 'link') && !n) continue;
    c.push({ x, y, n });
  }
  return c.length ? c[Math.floor(rng() * c.length)] : null;
};

const foto = async (s) => { const { nodes } = await lim(s.send('Accessibility.getFullAXTree'), 15000); const R = new Set(['button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'option', 'combobox', 'textbox', 'searchbox', 'slider', 'spinbutton', 'treeitem']), m = new Map(); for (const n of nodes) { if (n.ignored || !n.role || !R.has(n.role.value) || n.backendDOMNodeId == null) continue; const p = {}; for (const x of n.properties || []) p[x.name] = x.value && x.value.value; m.set(n.backendDOMNodeId, [n.role.value, (n.name && n.name.value) || '', p.url || '', [p.checked, p.pressed, p.expanded, p.selected].join('|')]); } return m; };
const stabilita = (A, B) => { const k = { uguale: 0, cifre: 0, parole: 0, ruolo: 0, indirizzo: 0, stato: 0, ricreato: 0, sparito: 0 }, nuovi = new Map(); for (const [id, v] of B) if (!A.has(id)) { const q = v.slice(0, 3).join('|'); nuovi.set(q, (nuovi.get(q) || 0) + 1); } for (const [id, a] of A) { const b = B.get(id); let c; if (!b) { const q = a.slice(0, 3).join('|'); if (nuovi.get(q)) { nuovi.set(q, nuovi.get(q) - 1); c = 'ricreato'; } else c = 'sparito'; } else if (a[0] !== b[0]) c = 'ruolo'; else if (a[1] !== b[1]) c = a[1].replace(/\d+/g, '#') === b[1].replace(/\d+/g, '#') ? 'cifre' : 'parole'; else if (a[2] !== b[2]) c = 'indirizzo'; else if (a[3] !== b[3]) c = 'stato'; else c = 'uguale'; k[c]++; } return k; };

module.exports = async (p, ctx, d, g, base) => {
  const seme = [...d].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 7), rng = rngDa(seme), R = { d, g, az: [] };
  const req = [], aperte = new Map(), dia = [], dl = []; let pop = 0;
  p.on('request', (q) => { if (!['document', 'xhr', 'fetch'].includes(q.resourceType())) return; const x = [Date.now(), 0]; aperte.set(q, x); req.push(x); });
  const fine = (q) => { const x = aperte.get(q); if (x) { x[1] = Date.now(); aperte.delete(q); } };
  p.on('requestfinished', fine); p.on('requestfailed', fine);
  p.on('dialog', (x) => { dia.push(Date.now()); x.dismiss().catch(() => {}); });
  p.on('download', () => dl.push(Date.now()));
  p.on('popup', (x) => { pop++; x.close().catch(() => {}); });
  const s = await ctx.newCDPSession(p);
  await s.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(() => {});
  await p.addInitScript(DIARIO);
  const T0 = Date.now();
  const risp = await p.goto((base || 'https://') + d + (base ? '' : '/'), { waitUntil: 'domcontentloaded', timeout: 20000 });
  const dcl = Date.now(); R.stato = risp ? risp.status() : 0; R.msDCL = dcl - T0;
  let tLoad = 0; p.waitForLoadState('load', { timeout: 15000 }).then(() => { tLoad = Date.now(); }, () => {});
  await attendi(8000);
  const rel = (v, t0) => v.map((x) => x - t0);
  const leggi = (t0, da, a) => lim(p.evaluate(([t0, da, a]) => { const o = window.__o || { doc: 0, ev: [], mut: [], anim: [], sc: [] }, f = (v) => v.filter((t) => t >= t0 + da && t <= t0 + a).map((t) => t - t0); return JSON.stringify({ doc: o.doc, ev: o.ev.filter((e) => e[0] >= t0 + da && e[0] <= t0 + a).map((e) => [e[0] - t0, e[1]]), mut: f(o.mut), anim: f(o.anim), sc: f(o.sc), len: document.body ? document.body.innerText.length : 0 }); }, [t0, da, a]), 8000).then(JSON.parse);
  const v = await leggi(dcl, -2000, 8000);
  R.vai = { ev: v.ev, mut: v.mut.length, req: req.map((x) => [x[0] - dcl, x[1] ? x[1] - dcl : 0]).filter((x) => x[0] < 8000), load: tLoad ? tLoad - dcl : 0, len: v.len };
  Object.assign(R, await lim(p.evaluate(SONDA), 8000).catch(() => ({})));
  const t1 = Date.now(); let A = null;
  try { A = await foto(s); R.axMs = Date.now() - t1; R.axN = A.size; } catch (e) {}
  if (A && rng() < .25) { await attendi(12000); try { R.stab = stabilita(A, await foto(s)); } catch (e) {} }
  const tipi = ['scorri', 'ctrl', 'ctrl', 'check', 'select', 'scrivi', 'canvas'];
  for (let i = tipi.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [tipi[i], tipi[j]] = [tipi[j], tipi[i]]; }
  const piano = (R.canvas >= .15 ? ['canvas'] : []).concat(tipi.filter((x) => x !== 'canvas').slice(0, 4)).concat(['link']);
  for (const k of piano) {
    let c = null, h = null;
    if (k === 'scorri') c = { x: 640, y: 356, n: '' };
    else if (k === 'select') { h = await lim(p.evaluateHandle(([seme]) => { const v = [...document.querySelectorAll('select')].filter((s) => { const q = s.getBoundingClientRect(); return !s.disabled && s.options.length >= 2 && q.width > 5 && q.height > 5 && q.top >= 0 && q.bottom <= innerHeight; }); return v.length ? v[Math.abs(seme) % v.length] : null; }, [seme]), 5000).catch(() => null); if (!h || !h.asElement()) continue; }
    else { c = await lim(p.evaluate(SCEGLI, [k, seme + R.az.length]), 5000).catch(() => null); if (!c) continue; }
    await attendi(IDLE);
    const u = await lim(p.evaluate(() => (window.__o || {}).doc), 5000).catch(() => null), pop0 = pop;
    const shots = [];
    const sha = async () => crypto.createHash('sha1').update(await lim(p.screenshot({ type: 'jpeg', quality: 30 }), 4000)).digest('hex').slice(0, 10);
    const base0 = k === 'canvas' ? await sha().catch(() => '') : '';
    const t0 = Date.now();
    let fatto = true;
    try {
      if (k === 'scorri') { await p.mouse.move(640, 356); await p.mouse.wheel(0, 600); }
      else if (k === 'select') { const n = await h.evaluate((s) => s.options.length), idx = await h.evaluate((s) => s.selectedIndex); await h.selectOption({ index: (idx + 1 + Math.floor(rng() * (n - 1))) % n }, { timeout: 3000 }); }
      else { await p.mouse.click(c.x, c.y); if (k === 'scrivi') await p.keyboard.type('ab', { delay: 20 }); }
    } catch (e) { fatto = false; }
    if (k === 'canvas') { let prev = base0; for (const dt of [300, 800, 1500, 3000]) { await attendi(Math.max(0, t0 + dt - Date.now())); const x = await sha().catch(() => prev); if (x !== prev) shots.push(dt); prev = x; } }
    await attendi(Math.max(0, t0 + DOPO - Date.now()));
    const o = await leggi(t0, -IDLE, DOPO).catch(() => ({ doc: 0, ev: [], mut: [], anim: [], sc: [] }));
    const r = { k, fatto, nd: u !== null && o.doc !== u, pop: pop > pop0, dia: dia.filter((t) => t >= t0).map((t) => t - t0), dl: dl.filter((t) => t >= t0).length, ev: o.ev, mut: o.mut, anim: o.anim, sc: o.sc, req: req.filter((x) => x[0] >= t0 - IDLE && x[0] <= t0 + DOPO).map((x) => [x[0] - t0, x[1] ? x[1] - t0 : 0]) };
    if (k === 'canvas') r.shots = shots;
    R.az.push(r);
    if (r.nd) break;
    await p.keyboard.press('Escape').catch(() => {});
  }
  return R;
};

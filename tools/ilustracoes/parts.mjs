// Peças desenhadas da família visual “Da Horta e do Forno”.
// Cada função devolve SVG em coordenadas locais; as cenas posicionam-nas com transform.
import { C, f, smooth, poly, line, rng, add, mul, lerp, volume, hatched } from './lib.mjs';
import { readFileSync } from 'node:fs';

const MARCA = JSON.parse(readFileSync(new URL('./marca-simplificada.json', import.meta.url)));

const stroke = (w = 3, c = C.ink) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const T = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s * 1000) / 1000})` : ''}`;
export const place = (svg, x, y, s = 1, r = 0) => `<g transform="${T(x, y, s, r)}">${svg}</g>`;

/** Forma com sombra própria: base escura + área iluminada deslocada para a esquerda (luz lateral). */
function shaded(ctx, pts, dark, lit, shift = [-14, -8], k = 0.86) {
  const d = smooth(pts);
  const litD = smooth(pts.map(([x, y]) => [x * k + shift[0], y * k + shift[1]]));
  return { d, svg: `<path d="${d}" fill="${dark}"/><g clip-path="url(#${ctx.clip(d)})"><path d="${litD}" fill="${lit}"/></g>` };
}

function specks(r, n, area, rad = [0.8, 2.2], color = C.ivory, op = 0.85) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const x = area[0] + r() * area[2];
    const y = area[1] + r() * area[3];
    const s = rad[0] + r() * (rad[1] - rad[0]);
    d += `M${f(x - s)} ${f(y)}a${f(s)} ${f(s * 0.8)} 0 1 0 ${f(2 * s)} 0a${f(s)} ${f(s * 0.8)} 0 1 0 ${f(-2 * s)} 0Z`;
  }
  return `<path d="${d}" fill="${color}" opacity="${op}"/>`;
}

/* ───────────── PÃO DE FERMENTAÇÃO LENTA (crosta aberta, orelha) ───────────── */
export function loaf(ctx, { detail = true, seed = 11 } = {}) {
  const r = rng(seed);
  const pts = [[-110, 0], [-113, -40], [-94, -88], [-52, -118], [0, -128], [54, -120], [96, -90], [115, -42], [110, -2], [62, 10], [0, 13], [-62, 10]];
  const { d, svg } = shaded(ctx, pts, C.crustDark, C.terra);
  let s = svg;
  const cid = ctx.clip(d);
  if (detail) {
    // anéis de farinha do cesto de fermentação, do lado da luz
    s += `<g clip-path="url(#${cid})" opacity="0.5">` +
      [64, 80, 96, 112].map((rr) => `<path d="M${f(-rr * 0.94)} ${f(-30 - rr * 0.34)}A${rr} ${rr * 0.72} 0 0 1 ${f(-rr * 0.2)} ${f(-40 - rr * 0.7)}" ${stroke(2.2, C.ivory)}/>`).join('') + '</g>';
    s += `<g clip-path="url(#${cid})">${specks(r, 46, [-100, -120, 120, 70])}</g>`;
    s += volume(ctx, d, { cx: -46, cy: -24, steps: [0.93, 0.86, 0.79, 0.72], width: 1.5, box: [-115, -130, 232, 146], from: 0.45 });
  }
  // incisão aberta (miolo) e orelha levantada
  const cut = 'M-82 -82C-42 -122 34 -128 88 -76C44 -94 -26 -98 -82 -82Z';
  s += `<path d="${cut}" fill="${C.crumb}"/>`;
  if (detail) {
    s += `<g clip-path="url(#${ctx.clip(cut)})"><path d="M-70 -92C-28 -122 34 -124 80 -84" ${stroke(9, C.ink)} opacity="0.28"/>${specks(rng(seed + 4), 22, [-60, -112, 130, 26], [0.6, 1.6], C.ink, 0.35)}</g>`;
  }
  s += `<path d="${cut}" fill="none" stroke="${C.ink}" stroke-width="1.8"/>`;
  s += `<path d="M-85 -84C-44 -134 40 -142 92 -78C84 -88 64 -108 46 -116C8 -132 -44 -124 -85 -84Z" fill="${C.crustDark}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
  s += `<path d="M-62 -108C-22 -128 30 -132 68 -110" ${stroke(2, C.terra)}/>`;
  s += `<path d="${d}" ${stroke(detail ? 3.2 : 5)}/>`;
  return s;
}

/* ───────────── BROA DE MILHO (baixa, crosta gretada, enfarinhada) ───────────── */
export function broa(ctx, { detail = true, seed = 21 } = {}) {
  const r = rng(seed);
  const pts = [[-100, 0], [-102, -24], [-86, -54], [-48, -73], [0, -79], [48, -74], [86, -56], [103, -26], [100, -1], [52, 8], [0, 10], [-52, 8]];
  const { d, svg } = shaded(ctx, pts, C.broaDark, C.broa, [-10, -6], 0.88);
  let s = svg;
  const cid = ctx.clip(d);
  // farinha: manchas largas e pontos, mais densa do lado da luz
  let patches = '';
  for (let i = 0; i < (detail ? 9 : 5); i++) {
    const x = -80 + r() * 140, y = -70 + r() * 50, rx = 14 + r() * 22, ry = 6 + r() * 8;
    patches += `M${f(x - rx)} ${f(y)}a${f(rx)} ${f(ry)} ${f(r() * 20 - 10)} 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0Z`;
  }
  s += `<g clip-path="url(#${cid})"><path d="${patches}" fill="${C.ivory}" opacity="0.55"/>${specks(r, detail ? 120 : 40, [-98, -80, 190, 76], [0.7, 2.4], C.ivory, 0.9)}</g>`;
  // gretas irregulares da crosta
  let cracks = '';
  for (let i = 0; i < (detail ? 13 : 7); i++) {
    let x = -78 + r() * 150, y = -66 + r() * 52;
    let a = (r() - 0.5) * 1.2 + (r() < 0.5 ? 0 : Math.PI);
    cracks += `M${f(x)} ${f(y)}`;
    const segs = 2 + Math.floor(r() * 3);
    for (let j = 0; j < segs; j++) {
      const len = 6 + r() * 12;
      a += (r() - 0.5) * 1.6;
      x += Math.cos(a) * len; y += Math.sin(a) * len * 0.55;
      cracks += `L${f(x)} ${f(y)}`;
      if (detail && r() < 0.35) cracks += `M${f(x)} ${f(y)}l${f((r() - 0.5) * 14)} ${f(-4 - r() * 6)}M${f(x)} ${f(y)}`;
    }
  }
  s += `<g clip-path="url(#${cid})"><path d="${cracks}" ${stroke(detail ? 3.4 : 4.4, C.broaDark)}/><path d="${cracks}" ${stroke(detail ? 1.1 : 1.6, C.ink)} opacity="0.85"/></g>`;
  if (detail) s += volume(ctx, d, { cx: -40, cy: -20, steps: [0.94, 0.88, 0.82], width: 1.4, box: [-104, -80, 208, 92], from: 0.5 });
  s += `<path d="${d}" ${stroke(detail ? 3.2 : 5)}/>`;
  return s;
}

/** Fatia de broa com miolo, para a ilustração de produto. */
export function broaSlice(ctx) {
  const d = 'M-46 0C-50 -28 -30 -52 0 -56C30 -54 50 -30 48 0C24 6 -24 6 -46 0Z';
  let s = `<path d="${d}" fill="${C.broaDark}" stroke="${C.ink}" stroke-width="2.6"/>`;
  const inner = 'M-38 -2C-40 -24 -24 -44 0 -47C24 -45 40 -26 39 -2C18 3 -18 3 -38 -2Z';
  s += `<path d="${inner}" fill="#EBCB8F"/>`;
  s += `<g clip-path="url(#${ctx.clip(inner)})">${specks(rng(5), 40, [-40, -48, 80, 48], [0.6, 1.6], C.terra, 0.7)}${specks(rng(6), 18, [-40, -48, 80, 48], [0.5, 1.1], C.ink, 0.4)}</g>`;
  s += `<path d="${inner}" ${stroke(1.4)}/>`;
  return s;
}

/* ───────────── SACO DE PAPEL DOBRADO com o pão ───────────── */
export function bagWithLoaf(ctx, { detail = true } = {}) {
  let s = '';
  // parede interior do saco, atrás do pão
  s += `<path d="${poly([[-117, -186], [-72, -212], [166, -208], [123, -186]])}" fill="${C.paperShade}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += place(loaf(ctx, { detail }), 10, -128, 0.93);
  // face da frente
  const front = poly([[-118, 0], [-114, -150], [120, -150], [124, 0]]);
  s += `<path d="${front}" fill="${C.ivory}"/>`;
  if (detail) {
    s += `<g opacity="0.4">${['M-84 -140L-70 -16', 'M-20 -146L-30 -40', 'M60 -146L74 -60', 'M-118 -40L-80 -6', 'M100 -20L118 -60'].map((p) => `<path d="${p}" ${stroke(1.2)}/>`).join('')}</g>`;
    s += `<path d="${front}" fill="url(#${ctx.hatch(80, 7, 0.9)})" opacity="0.18"/>`;
  }
  s += `<path d="${front}" ${stroke(3)}/>`;
  // fole lateral
  const side = poly([[124, 0], [120, -150], [162, -168], [168, -14]]);
  s += `<path d="${side}" fill="${C.paperShade}"/>`;
  if (detail) s += hatched(ctx, side, { angle: 20, gap: 5, width: 1, opacity: 0.35 });
  s += `<path d="${side}" ${stroke(3)}/><path d="M120 -150L144 -118L162 -168M144 -118L146 -6" ${stroke(1.5)}/>`;
  // dobra superior (punho virado para fora, com o corte serrilhado em baixo)
  const zig = (x0, y0, x1, y1, n) => {
    const p = [];
    for (let i = 0; i <= n; i++) p.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n + (i % 2 ? 3.5 : -1)]);
    return p;
  };
  const cuff = [[-117, -186], [123, -186], ...zig(127, -148, -121, -148, 24)];
  s += `<path d="${poly([[-121, -148], [127, -148], [126, -138], [-120, -138]])}" fill="${C.ink}" opacity="0.16"/>`;
  s += `<path d="${poly(cuff)}" fill="${C.ivory}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  const cuffSide = [[123, -186], [166, -208], ...zig(171, -170, 127, -148, 5)];
  s += `<path d="${poly(cuffSide)}" fill="${C.paperShade}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  if (detail) s += `<path d="M-100 -176L96 -177" ${stroke(1.1)} opacity="0.35"/>`;
  return s;
}

/* ───────────── FOLHAS (couve) ───────────── */
function leafShape(L, W, r) {
  const N = 16, right = [], left = [];
  const ph1 = r() * 6, ph2 = r() * 6;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const prof = t < 0.1 ? 0.08 : Math.pow(Math.sin((Math.PI * (t - 0.1)) / 0.94), 0.62) * (1 - 0.1 * t);
    const hw = (W / 2) * Math.max(prof, 0.06);
    right.push([hw * (1 + 0.07 * Math.sin(t * 28 + ph1)), -L * t]);
    left.push([-hw * (1 + 0.07 * Math.sin(t * 27 + ph2)), -L * t]);
  }
  right[N] = [W * 0.04, -L * 0.995];
  left[N] = [-W * 0.04, -L * 0.995];
  const pts = [...right, ...left.reverse()];
  const hwAt = (t) => (W / 2) * Math.pow(Math.max(0, Math.sin((Math.PI * (t - 0.1)) / 0.94)), 0.62);
  return { d: smooth(pts), hwAt };
}

export function leaf(ctx, { L = 220, W = 100, style = 'solid', seed = 1, detail = true, bend = 0 }) {
  const r = rng(seed);
  const { d, hwAt } = leafShape(L, W, r);
  const veinColor = style === 'solid' ? C.cream : C.ink;
  let s = '';
  if (style === 'solid') s += `<path d="${d}" fill="${C.ink}"/>`;
  else if (style === 'mid') s += `<path d="${d}" fill="${C.leafLight}"/>`;
  else s += `<path d="${d}" fill="${C.ivory}"/>`;
  if (detail && style !== 'solid') s += volume(ctx, d, { cx: -W * 0.35, cy: -L * 0.5, steps: [0.9, 0.8], width: 1.4, box: [-W / 2, -L, W, L], from: 0.55, opacity: style === 'mid' ? 0.0 : 0.7 });
  if (style === 'mid') s += `<g clip-path="url(#${ctx.clip(d)})"><path d="M0 0L${W} 0L${W} ${-L}L${f(bend)} ${-L}Z" fill="${C.ink}" opacity="0.45"/></g>`;
  // nervura central (afunilada) e secundárias
  const mid = [];
  for (let i = 0; i <= 8; i++) {
    const t = (i / 8) * 0.92;
    mid.push([bend * t * t, -L * t]);
  }
  const wBase = W * 0.075;
  const ribL = mid.map(([x, y], i) => [x - (wBase * (1 - i / 8) + 0.6), y]);
  const ribR = mid.map(([x, y], i) => [x + (wBase * (1 - i / 8) + 0.6), y]).reverse();
  s += `<path d="${smooth([...ribL, ...ribR], true)}" fill="${veinColor}"/>`;
  if (detail) {
    let v = '';
    for (const k of [0.22, 0.36, 0.5, 0.64, 0.77]) {
      for (const side of [-1, 1]) {
        const y0 = -L * k, x0 = bend * k * k;
        const hw = hwAt(k + 0.12) * 0.86;
        v += `M${f(x0)} ${f(y0)}Q${f(x0 + side * hw * 0.45)} ${f(y0 - L * 0.03)} ${f(x0 + side * hw)} ${f(y0 - L * 0.13)}`;
        v += `M${f(x0 + side * hw * 0.5)} ${f(y0 - L * 0.05)}q${f(side * hw * 0.12)} ${f(-L * 0.05)} ${f(side * hw * 0.32)} ${f(-L * 0.04)}`;
      }
    }
    s += `<path d="${v}" ${stroke(Math.max(1.1, W * 0.018), veinColor)}/>`;
  }
  s += `<path d="${d}" ${stroke(detail ? 2.6 : 4)}/>`;
  return s;
}

/* ───────────── COUVE PORTUGUESA ───────────── */
export function couve(ctx, { detail = true, seed = 31, s: k = 1 } = {}) {
  const leaves = [
    { a: -66, L: 196, W: 104, style: 'solid', x: -10 },
    { a: 62, L: 200, W: 108, style: 'solid', x: 10 },
    { a: -32, L: 236, W: 118, style: 'mid', x: -6 },
    { a: 26, L: 240, W: 118, style: 'solid', x: 6 },
    { a: -4, L: 250, W: 112, style: 'open', x: 0 },
    { a: -48, L: 168, W: 98, style: 'open', x: -8 },
    { a: 44, L: 170, W: 100, style: 'mid', x: 8 },
    { a: -14, L: 118, W: 74, style: 'open', x: -3 },
    { a: 16, L: 112, W: 70, style: 'open', x: 3 },
  ];
  let s = '';
  leaves.forEach((lf, i) => {
    s += place(leaf(ctx, { L: lf.L * k, W: lf.W * k, style: lf.style, seed: seed + i * 7, detail, bend: lf.a * 0.25 }), lf.x * k, 0, 1, lf.a);
  });
  return s;
}

/* ───────────── CENOURAS COM RAMA ───────────── */
export function rama(ctx, { len = 150, spread = 26, stems = 4, seed = 41, detail = true, angle = 0 }) {
  const r = rng(seed);
  let stemsD = '', leafD = '', leafD2 = '';
  for (let i = 0; i < stems; i++) {
    const a = ((-90 + angle + (stems === 1 ? 0 : -spread + (2 * spread * i) / (stems - 1)) + (r() - 0.5) * 8) * Math.PI) / 180;
    const L = len * (0.82 + r() * 0.3);
    const end = [Math.cos(a) * L, Math.sin(a) * L];
    const bendA = a + (r() - 0.5) * 0.5;
    const ctrl = [Math.cos(bendA) * L * 0.55, Math.sin(bendA) * L * 0.55];
    stemsD += `M0 0Q${f(ctrl[0])} ${f(ctrl[1])} ${f(end[0])} ${f(end[1])}`;
    const Q = (t) => [2 * (1 - t) * t * ctrl[0] + t * t * end[0], 2 * (1 - t) * t * ctrl[1] + t * t * end[1]];
    const nLeaf = detail ? 7 : 4;
    for (let j = 0; j < nLeaf; j++) {
      const t = 0.3 + (0.7 * j) / (nLeaf - 1);
      const p = Q(t), p2 = Q(Math.min(1, t + 0.02));
      const dir = Math.atan2(p2[1] - p[1], p2[0] - p[0]);
      const size = (detail ? 19 : 20) * (1.15 - t * 0.6);
      for (const side of [-1, 1]) {
        if (t > 0.97 && side === 1) continue;
        const la = dir + side * 0.95;
        const tip = add(p, [Math.cos(la) * size, Math.sin(la) * size]);
        const nrm = [Math.cos(la + Math.PI / 2) * size * 0.32, Math.sin(la + Math.PI / 2) * size * 0.32];
        const m1 = add(lerp(p, tip, 0.5), nrm), m2 = add(lerp(p, tip, 0.5), mul(nrm, -1));
        const lobe = `M${f(p[0])} ${f(p[1])}Q${f(m1[0])} ${f(m1[1])} ${f(tip[0])} ${f(tip[1])}Q${f(m2[0])} ${f(m2[1])} ${f(p[0])} ${f(p[1])}Z`;
        // pequenos lóbulos laterais para a folha recortada da cenoura
        const t2 = lerp(p, tip, 0.55);
        const la2 = la + side * 0.7;
        const tip2 = add(t2, [Math.cos(la2) * size * 0.45, Math.sin(la2) * size * 0.45]);
        const lobe2 = `M${f(t2[0])} ${f(t2[1])}L${f(tip2[0])} ${f(tip2[1])}`;
        if ((i + j) % 3 === 0) leafD2 += lobe; else leafD += lobe;
        if (detail) stemsD += lobe2;
      }
      if (t > 0.97) {
        const tip = add(p, [Math.cos(dir) * size * 1.1, Math.sin(dir) * size * 1.1]);
        leafD += `M${f(p[0])} ${f(p[1])}L${f(tip[0])} ${f(tip[1])}`;
      }
    }
  }
  return `<path d="${stemsD}" ${stroke(detail ? 2 : 3, C.ink)}/><path d="${leafD2}" fill="${C.leafLight}" stroke="${C.ink}" stroke-width="1"/><path d="${leafD}" fill="${C.ink}" stroke="${C.ink}" stroke-width="0.8"/>`;
}

export function carrotRoot(ctx, { L = 160, W = 34, bend = 6, detail = true, seed = 51 }) {
  const pts = [[-W / 2, 2], [-W * 0.47, L * 0.18], [-W * 0.37, L * 0.45], [-W * 0.21 + bend * 0.4, L * 0.72], [-W * 0.06 + bend * 0.85, L * 0.93], [bend, L], [W * 0.07 + bend * 0.85, L * 0.93], [W * 0.22 + bend * 0.4, L * 0.72], [W * 0.38, L * 0.45], [W * 0.47, L * 0.18], [W / 2, 2], [W * 0.3, -W * 0.1], [0, -W * 0.14], [-W * 0.3, -W * 0.1]];
  const { d, svg } = shaded(ctx, pts, '#9C5A40', C.terra, [-W * 0.18, 0], 0.88);
  let s = svg;
  if (detail) {
    const r = rng(seed);
    let rings = '';
    for (const t of [0.12, 0.22, 0.32, 0.43, 0.53, 0.63, 0.73, 0.83]) {
      const hw = (W / 2) * (1 - t * 0.78);
      const y = L * t;
      const x0 = -hw * (0.1 + r() * 0.5), x1 = hw * (0.55 + r() * 0.35);
      rings += `M${f(x0 + bend * t * t)} ${f(y)}q${f((x1 - x0) / 2)} ${f(3)} ${f(x1 - x0)} ${f(-1)}`;
    }
    s += `<path d="${rings}" ${stroke(1.3)} opacity="0.65"/>`;
    s += `<path d="M${f(-W * 0.28)} ${f(L * 0.08)}Q${f(-W * 0.3)} ${f(L * 0.35)} ${f(-W * 0.14)} ${f(L * 0.6)}" ${stroke(2.2, C.ivory)} opacity="0.7"/>`;
  }
  s += `<path d="${d}" ${stroke(detail ? 2.6 : 4)}/>`;
  // colo verde da rama
  s += `<path d="M${f(-W * 0.22)} ${f(-W * 0.08)}Q0 ${f(-W * 0.32)} ${f(W * 0.22)} ${f(-W * 0.08)}" fill="${C.ink}"/>`;
  return s;
}

/** Molho de cenouras atado, com rama. Origem: ponto do atilho. */
export function carrotBunch(ctx, { n = 5, detail = true, seed = 61, ramaLen = 160, rootL = 150, tie = true, spread = 9, stems = 3, gapX = 16, ramaSpread = 20 } = {}) {
  const r = rng(seed);
  let ramas = '', roots = '';
  for (let i = 0; i < n; i++) {
    const a = -spread + (2 * spread * i) / Math.max(1, n - 1) + (r() - 0.5) * 4;
    const x = (i - (n - 1) / 2) * gapX;
    const L = rootL * (0.85 + r() * 0.25);
    ramas += place(rama(ctx, { len: ramaLen * (0.85 + r() * 0.3), spread: ramaSpread, stems: detail ? stems : 2, seed: seed + i * 13, detail, angle: -a * 0.8 }), x * 0.4, 0);
    roots += place(carrotRoot(ctx, { L, W: 30 + r() * 8, bend: (r() - 0.5) * 16, detail, seed: seed + i * 5 }), x, 6, 1, a);
  }
  let s = ramas + roots;
  if (tie) s += `<path d="M-30 -2Q0 8 30 -2" ${stroke(4, C.terra)}/><path d="M-30 -2Q0 8 30 -2" ${stroke(1.2, C.ink)} transform="translate(0 -3)"/><path d="M-30 4Q0 14 30 4" ${stroke(1.2, C.ink)}/>`;
  return s;
}

/* ───────────── TOMATE ───────────── */
export function tomato(ctx, { r: R = 30, detail = true, seed = 71 } = {}) {
  const pts = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const rr = R * (1 + 0.05 * Math.sin(a * 5 + seed));
    pts.push([Math.cos(a) * rr * 1.08, Math.sin(a) * rr * 0.92]);
  }
  const { d, svg } = shaded(ctx, pts, '#9C5A40', C.terra, [-R * 0.18, -R * 0.14], 0.82);
  let s = svg;
  if (detail) s += `<path d="M${f(-R * 0.55)} ${f(-R * 0.25)}q${f(R * 0.1)} ${f(-R * 0.35)} ${f(R * 0.45)} ${f(-R * 0.45)}" ${stroke(R * 0.11, C.ivory)} opacity="0.75"/>`;
  s += `<path d="${d}" ${stroke(detail ? 2.4 : 3.4)}/>`;
  const sep = [];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
    sep.push(`M0 ${f(-R * 0.86)}l${f(Math.cos(a) * R * 0.42)} ${f(Math.sin(a) * R * 0.26)}`);
  }
  s += `<path d="${sep.join('')}" ${stroke(R * 0.13)}/><path d="M0 ${f(-R * 0.86)}l3 ${f(-R * 0.3)}" ${stroke(R * 0.1)}/>`;
  return s;
}

/* ───────────── RÓTULO DA CAIXA (marca) ───────────── */
export function brandLabel({ w = 240, h = 74, detail = true } = {}) {
  let s = `<rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${w}" height="${h}" rx="${f(h * 0.22)}" fill="${C.ivory}" stroke="${C.ink}" stroke-width="2.2"/>`;
  if (!detail) return s + `<path d="M${f(-w * 0.3)} -6h${f(w * 0.5)}M${f(-w * 0.3)} 10h${f(w * 0.4)}" ${stroke(6)}/>`;
  const symH = h * 0.74, sk = symH / 321;
  const lineH = h * 0.3, lk = lineH / 52;
  const symW = 422 * sk;
  const total = symW + 8 + 297 * lk;
  const x0 = -total / 2;
  s += `<g transform="translate(${f(x0)} ${f(-symH / 2)}) scale(${f(sk * 1000) / 1000}) translate(-74 -9)"><path d="${MARCA.symT}" fill="${C.terra}" fill-rule="evenodd"/><path d="${MARCA.symG}" fill="${C.ink}" fill-rule="evenodd"/></g>`;
  const tx = x0 + symW + 8;
  s += `<g transform="translate(${f(tx)} ${f(-lineH - 1)}) scale(${f(lk * 1000) / 1000}) translate(-14 -331)"><path d="${MARCA.l1}" fill="${C.ink}" fill-rule="evenodd"/></g>`;
  s += `<g transform="translate(${f(tx)} ${f(2)}) scale(${f(lk * 1000) / 1000}) translate(-320 -331)"><path d="${MARCA.l2}" fill="${C.ink}" fill-rule="evenodd"/></g>`;
  return s;
}

/* ───────────── CAIXA DE CARTÃO KRAFT (três quartos, vista de cima) ───────────── */
export function box(ctx, { O, u, v, w, detail = true, label = true, flaps = true }) {
  const P = (a, b, c) => [O[0] + u[0] * a + w[0] * b + v[0] * c, O[1] + u[1] * a + w[1] * b + v[1] * c];
  const FLb = P(0, 0, 0), FRb = P(1, 0, 0), BRb = P(1, 1, 0);
  const FLt = P(0, 0, 1), FRt = P(1, 0, 1), BRt = P(1, 1, 1), BLt = P(0, 1, 1), BLb = P(0, 1, 0);
  const sw = detail ? 3 : 4.5;
  let back = '', front = '';
  // aba de trás, de pé e inclinada para trás
  if (flaps) {
    const lift = [w[0] * 0.18, -Math.abs(v[1]) * 0.62];
    const fb = poly([BLt, BRt, add(BRt, lift), add(BLt, add(lift, [-6, 2]))]);
    back += `<path d="${fb}" fill="${C.kraftLight}" stroke="${C.ink}" stroke-width="${sw}" stroke-linejoin="round"/>`;
    if (detail) back += `<path d="${line([lerp(BLt, BRt, 0.04), lerp(BLt, BRt, 0.96)])}" ${stroke(1.2)} opacity="0.5" transform="translate(${f(lift[0] * 0.08)} ${f(lift[1] * 0.08)})"/>`;
  }
  // paredes interiores
  const innerBack = poly([BLt, BRt, BRb, BLb]);
  const innerLeft = poly([FLt, BLt, BLb, FLb]);
  back += `<path d="${innerBack}" fill="${C.kraftLight}" stroke="${C.ink}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  back += `<path d="${innerLeft}" fill="${C.kraftDark}" stroke="${C.ink}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  if (detail) back += hatched(ctx, innerLeft, { angle: -30, gap: 5, opacity: 0.35 });
  // face da frente
  const faceF = poly([FLt, FRt, FRb, FLb]);
  front += `<path d="${faceF}" fill="${C.kraft}"/>`;
  if (detail) {
    // fibras do cartão
    let fib = '';
    const r = rng(9);
    for (let i = 0; i < 18; i++) {
      const a = 0.05 + r() * 0.8, c = 0.1 + r() * 0.8, len = 0.05 + r() * 0.12;
      fib += `M${f(P(a, 0, c)[0])} ${f(P(a, 0, c)[1])}L${f(P(a + len, 0, c)[0])} ${f(P(a + len, 0, c)[1])}`;
    }
    front += `<path d="${fib}" ${stroke(1, C.kraftDark)} opacity="0.9"/>`;
    front += `<path d="${line([P(0.015, 0, 0.93), P(0.985, 0, 0.93)])}" ${stroke(1.4, C.ivory)} opacity="0.7"/>`;
  }
  front += `<path d="${faceF}" ${stroke(sw)}/>`;
  // face direita (na sombra)
  const faceR = poly([FRt, BRt, BRb, FRb]);
  front += `<path d="${faceR}" fill="${C.kraftDark}"/>`;
  if (detail) front += hatched(ctx, faceR, { angle: 70, gap: 5.5, width: 1.2, opacity: 0.45 });
  front += `<path d="${faceR}" ${stroke(sw)}/>`;
  // abas laterais abertas, viradas para fora e para baixo
  if (flaps) {
    const ul = Math.hypot(u[0], u[1]);
    const out = (k, sign) => [sign * (u[0] / ul) * k, sign * (u[1] / ul) * k + k * 0.62];
    const lo = out(58, -1), ro = out(54, 1);
    const left = poly([FLt, BLt, add(BLt, add(lo, [6, -4])), add(FLt, lo)]);
    const right = poly([FRt, BRt, add(BRt, add(ro, [-4, -2])), add(FRt, ro)]);
    front += `<path d="${right}" fill="${C.kraftLight}" stroke="${C.ink}" stroke-width="${sw}" stroke-linejoin="round"/>`;
    if (detail) front += hatched(ctx, right, { angle: 70, gap: 6, width: 1, opacity: 0.3 });
    front += `<path d="${left}" fill="${C.kraftLight}" stroke="${C.ink}" stroke-width="${sw}" stroke-linejoin="round"/>`;
    if (detail) front += `<path d="${line([lerp(FLt, BLt, 0.04), lerp(FLt, BLt, 0.96)])}" ${stroke(1.2)} opacity="0.5" transform="translate(${f(lo[0] * 0.15)} ${f(lo[1] * 0.15)})"/>`;
  }
  // rótulo na face da frente (sistema de coordenadas da própria face)
  if (label) {
    const ul = Math.hypot(u[0], u[1]), vl = Math.hypot(v[0], v[1]);
    const a = u[0] / ul, b = u[1] / ul, c = -v[0] / vl, d = -v[1] / vl;
    const e = P(0.5, 0, 0.52);
    const lw = Math.min(250, ul * 0.6), lh = Math.min(78, vl * 0.56);
    front += `<g transform="matrix(${f(a * 1000) / 1000} ${f(b * 1000) / 1000} ${f(c * 1000) / 1000} ${f(d * 1000) / 1000} ${f(e[0])} ${f(e[1])})">${brandLabel({ w: lw, h: lh, detail })}</g>`;
  }
  return { back, front, pts: { FLb, FRb, BRb, FLt, FRt, BRt, BLt, BLb }, P };
}

/* ───────────── FORNO A LENHA (fragmento de arco) ───────────── */
export function ovenArch(ctx, { r = 120, detail = true, flame = true, dome = true }) {
  let s = '';
  const R2 = r * 1.34, R3 = r * 2.05;
  if (dome) {
    s += `<path d="M${f(-R3)} 0A${f(R3)} ${f(R3 * 0.92)} 0 0 1 ${f(R3)} 0Z" fill="${C.cream}" stroke="${C.ink}" stroke-width="3.2"/>`;
    if (detail) {
      let courses = '';
      for (let i = 1; i < 6; i++) {
        const rr = R2 + ((R3 - R2) * i) / 6;
        courses += `M${f(-rr)} 0A${f(rr)} ${f(rr * (0.92 + (1 - i / 6) * 0.04))} 0 0 1 ${f(rr)} 0`;
      }
      s += `<path d="${courses}" ${stroke(2)} opacity="0.75"/>`;
      let joints = '';
      for (let i = 0; i < 6; i++) {
        const r0 = R2 + ((R3 - R2) * i) / 6, r1 = R2 + ((R3 - R2) * (i + 1)) / 6;
        const n = 7 + i * 2;
        for (let j = 1; j < n; j++) {
          const a = Math.PI + (Math.PI * (j + (i % 2) * 0.5)) / n;
          if (a >= Math.PI * 2) continue;
          joints += `M${f(Math.cos(a) * r0)} ${f(Math.sin(a) * r0 * 0.93)}L${f(Math.cos(a) * r1)} ${f(Math.sin(a) * r1 * 0.93)}`;
        }
      }
      s += `<path d="${joints}" ${stroke(1.6)} opacity="0.55"/>`;
      s += `<g opacity="0.5">${volume(ctx, `M${f(-R3)} 0A${f(R3)} ${f(R3 * 0.92)} 0 0 1 ${f(R3)} 0Z`, { cx: -R3 * 0.3, cy: -R3 * 0.4, steps: [0.95, 0.9], width: 1.6, box: [-R3, -R3, 2 * R3, R3], from: 0.6 })}</g>`;
    }
  }
  // boca escura
  s += `<path d="M${f(-r)} 0A${f(r)} ${f(r)} 0 0 1 ${f(r)} 0Z" fill="${C.ink}"/>`;
  // aduelas de tijolo
  const n = 11;
  let bricks = '';
  for (let i = 0; i < n; i++) {
    const g = 0.022;
    const a0 = Math.PI + (Math.PI * i) / n + g, a1 = Math.PI + (Math.PI * (i + 1)) / n - g;
    const ri = r * 1.02, ro = R2;
    const p = [[Math.cos(a0) * ri, Math.sin(a0) * ri], [Math.cos(a0) * ro, Math.sin(a0) * ro], [Math.cos(a1) * ro, Math.sin(a1) * ro], [Math.cos(a1) * ri, Math.sin(a1) * ri]];
    bricks += `M${f(p[0][0])} ${f(p[0][1])}L${f(p[1][0])} ${f(p[1][1])}A${f(ro)} ${f(ro)} 0 0 1 ${f(p[2][0])} ${f(p[2][1])}L${f(p[3][0])} ${f(p[3][1])}A${f(ri)} ${f(ri)} 0 0 0 ${f(p[0][0])} ${f(p[0][1])}Z`;
  }
  s += `<path d="M${f(-R2 - 3)} 0A${f(R2 + 3)} ${f(R2 + 3)} 0 0 1 ${f(R2 + 3)} 0L${f(r)} 0A${f(r)} ${f(r)} 0 0 0 ${f(-r)} 0Z" fill="${C.ink}"/>`;
  s += `<path d="${bricks}" fill="${C.terra}"/>`;
  if (detail) s += `<path d="${bricks}" fill="url(#${ctx.hatch(0, 6, 1, C.crustDark)})" opacity="0.3"/>`;
  // lenha e chama
  if (flame) {
    const lr = r * 0.62;
    s += `<g transform="translate(0 ${f(-r * 0.08)})">`;
    s += `<path d="M${f(-lr * 0.7)} 0L${f(lr * 0.55)} ${f(-lr * 0.22)}" ${stroke(r * 0.12, C.ivory)}/><path d="M${f(-lr * 0.7)} 0L${f(lr * 0.55)} ${f(-lr * 0.22)}" ${stroke(1.6)} opacity="0.6"/>`;
    s += `<path d="M${f(-lr * 0.5)} ${f(-lr * 0.2)}L${f(lr * 0.75)} ${f(-lr * 0.02)}" ${stroke(r * 0.12, C.ivory)}/><ellipse cx="${f(lr * 0.75)}" cy="${f(-lr * 0.02)}" rx="${f(r * 0.05)}" ry="${f(r * 0.06)}" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.4"/>`;
    const fh = r * 0.62, fw = r * 0.34;
    s += `<path d="M${f(-fw)} ${f(-lr * 0.2)}C${f(-fw * 1.2)} ${f(-fh * 0.5)} ${f(-fw * 0.3)} ${f(-fh * 0.6)} ${f(-fw * 0.2)} ${f(-fh)}C${f(fw * 0.1)} ${f(-fh * 0.7)} ${f(fw * 0.35)} ${f(-fh * 0.82)} ${f(fw * 0.5)} ${f(-fh * 0.95)}C${f(fw * 0.7)} ${f(-fh * 0.6)} ${f(fw * 1.2)} ${f(-fh * 0.5)} ${f(fw)} ${f(-lr * 0.2)}Z" fill="${C.terra}"/>`;
    s += `<path d="M${f(-fw * 0.3)} ${f(-lr * 0.24)}C${f(-fw * 0.5)} ${f(-fh * 0.45)} ${f(-fw * 0.1)} ${f(-fh * 0.5)} ${f(0)} ${f(-fh * 0.7)}C${f(fw * 0.2)} ${f(-fh * 0.5)} ${f(fw * 0.5)} ${f(-fh * 0.42)} ${f(fw * 0.3)} ${f(-lr * 0.24)}Z" fill="${C.ink}" opacity="0.55"/>`;
    s += '</g>';
  }
  // soleira
  s += `<rect x="${f(-R2 - 10)}" y="0" width="${f(2 * R2 + 20)}" height="${f(r * 0.16)}" rx="3" fill="${C.ivory}" stroke="${C.ink}" stroke-width="3"/>`;
  return s;
}

/* ───────────── PANO DE LINHO DOBRADO ───────────── */
export function linen(ctx, { detail = true } = {}) {
  // pano dobrado em quatro, pousado em perspetiva; riscas junto às pontas
  const A = [0, 0], B = [200, -18], Cc = [236, 44], D = [30, 70];
  const P = (s, t) => lerp(lerp(A, B, s), lerp(D, Cc, s), t);
  let s = '';
  const body = smooth([A, P(0.5, -0.02), [B[0] - 3, B[1] + 1], [B[0] + 2, B[1] + 5], P(1.01, 0.5), [Cc[0] - 2, Cc[1] - 4], [Cc[0] - 5, Cc[1] + 1], P(0.5, 1.03), [D[0] + 4, D[1] - 1], [D[0] - 2, D[1] - 5], P(-0.01, 0.5), [A[0] + 2, A[1] + 4]], true, 0.6);
  // espessura das dobras
  s += `<path d="${poly([D, Cc, add(Cc, [0, 7]), add(D, [0, 7])])}" fill="${C.paperShade}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
  s += `<path d="M${f(D[0])} ${f(D[1] + 3.5)}L${f(Cc[0])} ${f(Cc[1] + 3.5)}" ${stroke(1)} opacity="0.5"/>`;
  s += `<path d="${body}" fill="${C.ivory}"/>`;
  if (detail) s += `<g clip-path="url(#${ctx.clip(body)})" opacity="0.13"><path d="${body}" fill="url(#${ctx.hatch(-5, 3.5, 0.7)})"/><path d="${body}" fill="url(#${ctx.hatch(80, 3.5, 0.7)})"/></g>`;
  const band = (s0, w, color) => `<path d="${poly([P(s0, 0), P(s0 + w, 0), P(s0 + w, 1), P(s0, 1)])}" fill="${color}"/>`;
  s += band(0.1, 0.06, C.ink) + band(0.19, 0.018, C.ink) + band(0.235, 0.03, C.terra);
  s += band(0.84, 0.06, C.ink) + band(0.79, 0.018, C.ink);
  s += `<path d="${line([P(0.5, 0), P(0.5, 1)])}" ${stroke(1.2)} opacity="0.4"/>`;
  s += `<path d="${body}" ${stroke(2.4)}/>`;
  if (detail) {
    let fr = '';
    for (let i = 1; i < 10; i++) {
      const p = P(1, i / 10);
      fr += `M${f(p[0])} ${f(p[1])}l8 1`;
    }
    s += `<path d="${fr}" ${stroke(1.3)}/>`;
  }
  return s;
}

export function crumbs(seed = 81, n = 3, spread = [0, 0, 120, 30]) {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = spread[0] + r() * spread[2], y = spread[1] + r() * spread[3];
    const k = 4 + r() * 4;
    const pts = [];
    for (let j = 0; j < 6; j++) {
      const a = (j / 6) * Math.PI * 2 + r();
      pts.push([x + Math.cos(a) * k * (0.7 + r() * 0.5), y + Math.sin(a) * k * 0.7 * (0.7 + r() * 0.5)]);
    }
    s += `<path d="${smooth(pts)}" fill="${i % 2 ? C.crustDark : C.crumb}" stroke="${C.ink}" stroke-width="1.6"/>`;
  }
  return s;
}

/* ───────────── AZULEJOS (banda de parede) ───────────── */
export function tiles(ctx, { x, y, w, h, size = 46 }) {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.ivory}"/>`;
  let g = '', m = '';
  for (let i = 0; i <= Math.ceil(w / size); i++) g += `M${f(x + i * size)} ${y}v${h}`;
  for (let j = 0; j <= Math.ceil(h / size); j++) g += `M${x} ${f(y + j * size)}h${w}`;
  for (let i = 0; i <= Math.ceil(w / size); i++) {
    for (let j = 0; j <= Math.ceil(h / size); j++) {
      const cx = x + i * size, cy = y + j * size;
      m += `M${f(cx - size * 0.26)} ${f(cy)}a${f(size * 0.26)} ${f(size * 0.26)} 0 1 0 ${f(size * 0.52)} 0a${f(size * 0.26)} ${f(size * 0.26)} 0 1 0 ${f(-size * 0.52)} 0Z`;
      const mx = cx + size / 2, my = cy + size / 2, q = size * 0.13;
      m += `M${f(mx)} ${f(my - q * 1.6)}q${f(q)} ${f(q * 1.6)} 0 ${f(q * 3.2)}q${f(-q)} ${f(-q * 1.6)} 0 ${f(-q * 3.2)}ZM${f(mx - q * 1.6)} ${f(my)}q${f(q * 1.6)} ${f(-q)} ${f(q * 3.2)} 0q${f(-q * 1.6)} ${f(q)} ${f(-q * 3.2)} 0Z`;
    }
  }
  const cid = ctx.clip(`M${x} ${y}h${w}v${h}h${-w}Z`);
  s += `<g clip-path="url(#${cid})"><path d="${m}" fill="none" stroke="${C.ink}" stroke-width="1.5" opacity="0.5"/><path d="${g}" ${stroke(1.4)} opacity="0.55"/></g>`;
  return s;
}

/* ───────────── MÃO A SEGURAR (punho) ───────────── */
export function fist(ctx, { detail = true, sleeve = true, armLen = 300, armAngle = -40, taper = 16 } = {}) {
  let s = '';
  const a = (armAngle * Math.PI) / 180;
  const dir = [Math.cos(a), Math.sin(a)];
  const nrm = [-dir[1], dir[0]];
  const w0 = [56, -26], w1 = [70, 22];
  const far0 = add(w0, add(mul(dir, armLen), mul(nrm, -taper))), far1 = add(w1, add(mul(dir, armLen), mul(nrm, 8 + taper)));
  const arm = poly([w0, far0, far1, w1]);
  s += `<path d="${arm}" fill="${C.ivory}"/>`;
  if (detail) {
    let hl = '';
    for (let i = 1; i <= 4; i++) {
      const t = i / 5;
      const p0 = lerp(w1, far1, 0.1), p1 = lerp(w1, far1, 0.9);
      hl += `M${f(p0[0] - nrm[0] * i * 4.5)} ${f(p0[1] - nrm[1] * i * 4.5)}L${f(p1[0] - nrm[0] * i * 4.5)} ${f(p1[1] - nrm[1] * i * 4.5)}`;
      void t;
    }
    s += `<g clip-path="url(#${ctx.clip(arm)})"><path d="${hl}" ${stroke(1.3)} opacity="0.55"/></g>`;
  }
  s += `<path d="${line([w0, far0])}" ${stroke(3)}/><path d="${line([w1, far1])}" ${stroke(3)}/>`;
  if (sleeve) {
    const s0 = lerp(w0, far0, 0.55), s1 = lerp(w1, far1, 0.55);
    const s2 = lerp(w0, far0, 0.78), s3 = lerp(w1, far1, 0.78);
    const sl = poly([add(s0, mul(nrm, -8)), add(s2, mul(nrm, -10)), add(s3, mul(nrm, 12)), add(s1, mul(nrm, 10))]);
    s += `<path d="${sl}" fill="${C.ink}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
    const m0 = lerp(s0, s2, 0.35), m1 = lerp(s1, s3, 0.35);
    s += `<path d="${line([add(m0, mul(nrm, -6)), add(m1, mul(nrm, 8))])}" ${stroke(1.6, C.cream)}/>`;
    const m2 = lerp(s0, s2, 0.7), m3 = lerp(s1, s3, 0.7);
    s += `<path d="${line([add(m2, mul(nrm, -6)), add(m3, mul(nrm, 8))])}" ${stroke(1.2, C.cream)} opacity="0.8"/>`;
  }
  // dorso/palma
  const palm = smooth([[6, -40], [40, -46], [66, -30], [80, 0], [72, 30], [44, 44], [12, 40], [4, 0]]);
  s += `<path d="${palm}" fill="${C.ivory}"/>`;
  if (detail) s += volume(ctx, palm, { cx: 20, cy: -10, steps: [0.88, 0.76], width: 1.4, box: [0, -50, 84, 98], dir: 'down', from: 0.4 });
  s += `<path d="${palm}" ${stroke(3)}/>`;
  // dedos enrolados à volta do molho
  for (let i = 0; i < 4; i++) {
    const y = -30 + i * 19;
    const len = i === 3 ? 52 : 64;
    const fd = smooth([[30, y - 8], [-len + 34, y - 9.5], [-len + 26, y - 4], [-len + 25, y + 4], [-len + 32, y + 9], [30, y + 9]]);
    s += `<path d="${fd}" fill="${C.ivory}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
    if (detail) s += `<path d="M${f(-len + 50)} ${f(y - 6)}q-3 6 0 12M${f(-6)} ${f(y - 7)}q-3 7 0 14" ${stroke(1.3)} opacity="0.7"/>`;
  }
  // polegar por cima
  const th = smooth([[44, -48], [12, -52], [-20, -44], [-30, -34], [-22, -26], [10, -30], [38, -24]]);
  s += `<path d="${th}" fill="${C.ivory}" stroke="${C.ink}" stroke-width="2.8" stroke-linejoin="round"/>`;
  s += `<path d="${smooth([[-24, -42], [-14, -46], [-8, -38], [-16, -32], [-26, -34]])}" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.6"/>`;
  if (detail) s += `<path d="M6 -46q4 7 0 14" ${stroke(1.3)} opacity="0.7"/>`;
  return s;
}

/* ───────────── PÁ DE MADEIRA ───────────── */
export function peel(ctx, { detail = true, len = 420, angle = 32 } = {}) {
  let s = '';
  const a = (angle * Math.PI) / 180;
  const dir = [Math.cos(a), Math.sin(a)], nrm = [-dir[1], dir[0]];
  const h0 = [96, 0];
  const h1 = add(h0, mul(dir, len));
  const hw = 9;
  const handle = poly([add(h0, mul(nrm, -hw)), add(h1, mul(nrm, -hw)), add(h1, mul(nrm, hw)), add(h0, mul(nrm, hw))]);
  s += `<path d="${handle}" fill="${C.kraft}"/>`;
  if (detail) s += `<path d="${line([add(h0, mul(nrm, -3)), add(h1, mul(nrm, -3))])}${line([add(h0, mul(nrm, 4)), add(h1, mul(nrm, 4))])}" ${stroke(1)} opacity="0.5"/>`;
  s += `<path d="${handle}" ${stroke(2.8)}/>`;
  const blade = smooth([[-120, -22], [-60, -34], [40, -30], [100, -12], [104, 6], [44, 26], [-60, 30], [-124, 16]]);
  s += `<path d="${blade}" fill="${C.kraft}"/>`;
  if (detail) {
    s += `<g clip-path="url(#${ctx.clip(blade)})"><path d="M-130 -12C-40 -24 40 -22 110 -6M-130 2C-40 -8 40 -6 110 6M-130 14C-40 8 40 10 110 18" ${stroke(1.1, C.kraftDark)}/></g>`;
    s += hatched(ctx, 'M-124 16L-60 30L44 26L104 6L100 14L44 34L-60 38L-124 22Z', { angle: 60, gap: 4, opacity: 0.6 });
  }
  s += `<path d="${blade}" ${stroke(3)}/>`;
  s += `<path d="M-124 16L-124 22L-60 38L44 34L104 14L104 6" ${stroke(2.6)}/>`;
  return s;
}

/* ───────────── ICONES de 24 px (traço) ───────────── */
export const ICONS = {
  cesto: '<path d="M3.5 10.5h17l-1.6 9.1a1.5 1.5 0 0 1-1.5 1.2H6.6a1.5 1.5 0 0 1-1.5-1.2z"/><path d="M3.5 10.5 6 7.2M20.5 10.5 18 7.2"/><path d="M7.2 10.4c.2-3.1 2.2-5.1 4.8-5.1s4.6 2 4.8 5.1"/><path d="M9.6 6.2c.6.9 1.4 1.4 2.4 1.4s1.8-.5 2.4-1.4"/><path d="M8.5 14.3h7"/>',
  horta: '<path d="M2.8 20.2c3.6-2.6 14.8-2.6 18.4 0"/><path d="M5 16.6c3-1.8 11-1.8 14 0"/><path d="M12 15.6V9.8"/><path d="M12 11.2C10.9 8 8.3 6.6 5.2 6.9c.3 3 2.6 4.8 6.8 4.3z"/><path d="M12 9.6c.9-3.4 3.6-5.1 6.9-4.7-.2 3.3-2.7 5.2-6.9 4.7z"/>',
  forno: '<path d="M3 19.5h18"/><path d="M4.6 19.5V15a7.4 7.4 0 0 1 14.8 0v4.5"/><path d="M8.6 19.5v-3.2a3.4 3.4 0 0 1 6.8 0v3.2"/><path d="M10 3.2h4M10.6 3.2v4.5h2.8V3.2"/><path d="M12 15.2c-.9.8-1.2 1.6-.6 2.5.4.6 1.4.6 1.8-.1.4-.8-.1-1.7-1.2-2.4z"/>',
};

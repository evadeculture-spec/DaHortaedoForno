// Ilustrações de produto: uma por artigo, cores naturais dos alimentos, traço de gravura da marca.
// Cada desenho ocupa um quadro de 600 × 450 com fundo transparente (o cartão dá o creme).
import { C, f, smooth, poly, line, rng, add, mul, lerp, volume, hatched } from './lib.mjs';
import * as P from './parts.mjs';

export const S = (w = 2.6, c = C.ink) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const g = P.place;
const bbox = (pts) => {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};
export const oval = (cx, cy, rx, ry, n = 18, wob = 0, seed = 1) => {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; const k = 1 + (r() - 0.5) * wob; return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]; });
};
const lobado = (cx, cy, rx, ry, nl, amp, n = 48, fase = 0) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; const k = 1 + amp * Math.cos(nl * a + fase); return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]; });
function pontos(seed, n, area, rad, cor, op = 1, alongar = 1) {
  const r = rng(seed); let d = '';
  for (let i = 0; i < n; i++) {
    const x = area[0] + r() * area[2], y = area[1] + r() * area[3], s = rad[0] + r() * (rad[1] - rad[0]);
    d += `M${f(x - s * alongar)} ${f(y)}a${f(s * alongar)} ${f(s)} 0 1 0 ${f(2 * s * alongar)} 0a${f(s * alongar)} ${f(s)} 0 1 0 ${f(-2 * s * alongar)} 0Z`;
  }
  return `<path d="${d}" fill="${cor}" opacity="${op}"/>`;
}
let semSombras = false;
/** Desenha sem sombras de contacto (para compor naturezas-mortas e caixas). */
export function semSombra(fn) { semSombras = true; try { return fn(); } finally { semSombras = false; } }
export const sombra = (ctx, cx, cy, rx, ry = rx * 0.11) => semSombras ? '' : hatched(ctx, `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0Z`, { angle: 45, gap: 5, width: 1.2, opacity: 0.38 });

/** Corpo com volume: base escura, zona iluminada (luz da esquerda), brilho, linhas de volume e contorno. */
export function corpo(ctx, pts, cor, escura, { k = 0.86, sh = [-0.1, -0.09], brilho = 0.45, w = 2.6, hachura = true, extra = '' } = {}) {
  const d = smooth(pts);
  const [x0, y0, x1, y1] = bbox(pts);
  const cw = x1 - x0, ch = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const lit = smooth(pts.map(([x, y]) => [cx + (x - cx) * k + sh[0] * cw, cy + (y - cy) * k + sh[1] * ch]));
  let s = `<path d="${d}" fill="${escura}"/><g clip-path="url(#${ctx.clip(d)})"><path d="${lit}" fill="${cor}"/>${extra}`;
  if (brilho) s += `<ellipse cx="${f(cx - cw * 0.22)}" cy="${f(cy - ch * 0.24)}" rx="${f(cw * 0.11)}" ry="${f(ch * 0.07)}" fill="${C.ivory}" opacity="${brilho}" transform="rotate(-35 ${f(cx - cw * 0.22)} ${f(cy - ch * 0.24)})"/>`;
  s += '</g>';
  if (hachura) s += volume(ctx, d, { cx: cx - cw * 0.22, cy: cy - ch * 0.2, steps: [0.95, 0.89], width: 1.3, box: [x0, y0, cw, ch], from: 0.55, opacity: 0.55 });
  return s + `<path d="${d}" ${S(w)}/>`;
}
const clipDe = (ctx, pts) => ctx.clip(smooth(pts));

/* ───────── frutos ───────── */
function folha(x, y, L, W, ang, cor = '#4E7A35') {
  const pts = [[0, 0], [W * 0.5, -L * 0.25], [W * 0.45, -L * 0.7], [0, -L], [-W * 0.45, -L * 0.7], [-W * 0.5, -L * 0.25]];
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)})"><path d="${smooth(pts)}" fill="${cor}" stroke="${C.ink}" stroke-width="2"/><path d="M0 -2Q${f(W * 0.08)} ${f(-L * 0.5)} 0 ${f(-L * 0.92)}" ${S(1.4, C.cream)} opacity="0.8"/></g>`;
}
const pe = (x, y, L = 22, ang = 10) => `<path d="M${f(x)} ${f(y)}q${f(Math.sin(ang * Math.PI / 180) * L * 0.6)} ${f(-L * 0.5)} ${f(Math.sin(ang * Math.PI / 180) * L)} ${f(-L)}" ${S(4.5, '#5A4128')}/>`;

export function fruta(ctx, tipo, x, y, r, seed = 1) {
  let s = '';
  if (tipo === 'maca') {
    const pts = oval(x, y, r * 1.06, r * 0.94, 20, 0.05, seed).map(([px, py]) => [px, py + (Math.abs(px - x) < r * 0.25 && py < y ? r * 0.08 : 0)]);
    const cid = clipDe(ctx, pts);
    s += corpo(ctx, pts, '#D2CB6C', '#8F8B3B', { extra: `<g clip-path="url(#${cid})"><ellipse cx="${f(x + r * 0.45)}" cy="${f(y)}" rx="${f(r * 0.75)}" ry="${f(r)}" fill="#C2553E" opacity="0.55"/>${Array.from({ length: 7 }, (_, i) => `<path d="M${f(x + r * (0.05 + i * 0.13))} ${f(y - r * 0.8)}q${f(r * 0.1)} ${f(r * 0.8)} 0 ${f(r * 1.6)}" ${S(1.4, '#A8402E')} opacity="0.45"/>`).join('')}</g>` });
    s += pe(x, y - r * 0.82, r * 0.4, 12);
  } else if (tipo === 'pera') {
    const H = r * 2.4, W = r * 1.7;
    const pts = [[0, -H], [W * 0.11, -H * 0.96], [W * 0.18, -H * 0.84], [W * 0.21, -H * 0.66], [W * 0.34, -H * 0.48], [W * 0.5, -H * 0.27], [W * 0.47, -H * 0.08], [W * 0.27, 0.01 * H], [0, 0.03 * H], [-W * 0.27, 0.01 * H], [-W * 0.47, -H * 0.08], [-W * 0.5, -H * 0.27], [-W * 0.34, -H * 0.48], [-W * 0.21, -H * 0.66], [-W * 0.18, -H * 0.84], [-W * 0.11, -H * 0.96]].map(([a, b]) => [x + a, y + b]);
    const cid = clipDe(ctx, pts);
    s += corpo(ctx, pts, '#D3CB70', '#968D3E', { extra: `<g clip-path="url(#${cid})"><ellipse cx="${f(x)}" cy="${f(y - H * 0.92)}" rx="${f(W * 0.3)}" ry="${f(H * 0.16)}" fill="#A57A44" opacity="0.7"/>${pontos(seed + 3, 40, [x - W * 0.45, y - H * 0.95, W * 0.9, H * 0.9], [0.8, 1.8], '#946A3A', 0.6)}</g>` });
    s += pe(x, y - H + 2, r * 0.5, 18);
  } else if (tipo === 'laranja' || tipo === 'clementina') {
    const cl = tipo === 'clementina';
    const pts = oval(x, y, r, r * (cl ? 0.84 : 0.97), 22, 0.03, seed);
    const cid = clipDe(ctx, pts);
    s += corpo(ctx, pts, cl ? '#EF9330' : '#E6892B', cl ? '#B95F1A' : '#AE5E18', { extra: `<g clip-path="url(#${cid})">${pontos(seed + 1, cl ? 40 : 60, [x - r, y - r, 2 * r, 2 * r], [0.7, 1.5], '#9A4F12', 0.35)}</g>` });
    s += `<path d="M${f(x - 5)} ${f(y - r * (cl ? 0.82 : 0.95))}l5 -4 5 4" ${S(2.2, '#4E6B2E')}/>`;
  } else if (tipo === 'limao') {
    const pts = oval(x, y, r * 1.12, r * 0.84, 20, 0.02, seed);
    pts[0] = [x + r * 1.32, y]; pts[10] = [x - r * 1.32, y];
    const cid = clipDe(ctx, pts);
    s += corpo(ctx, pts, '#EDCF52', '#B5952B', { extra: `<g clip-path="url(#${cid})">${pontos(seed + 2, 50, [x - r * 1.2, y - r, 2.4 * r, 2 * r], [0.7, 1.4], '#9C7E1E', 0.35)}</g>` });
  } else if (tipo === 'roma') {
    const pts = oval(x, y, r, r * 0.96, 20, 0.04, seed);
    s += corpo(ctx, pts, '#AE3D35', '#6B201C', { brilho: 0.35 });
    s += `<path d="M${f(x - r * 0.28)} ${f(y - r * 0.86)}l${f(r * 0.05)} ${f(-r * 0.36)} ${f(r * 0.1)} ${f(r * 0.22)} ${f(r * 0.08)} ${f(-r * 0.3)} ${f(r * 0.09)} ${f(r * 0.3)} ${f(r * 0.1)} ${f(-r * 0.22)} ${f(r * 0.06)} ${f(r * 0.36)}Z" fill="#8E2E28" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
  } else if (tipo === 'diospiro') {
    const pts = lobado(x, y, r, r * 0.86, 4, 0.045, 32, Math.PI / 4);
    s += corpo(ctx, pts, '#EA842E', '#AF531A', { brilho: 0.5 });
    s += `<g transform="translate(${f(x)} ${f(y - r * 0.8)})">${[0, 90, 180, 270].map((a) => `<path d="M0 0C${f(r * 0.12)} -4 ${f(r * 0.32)} 0 ${f(r * 0.36)} 6C${f(r * 0.2)} 10 ${f(r * 0.1)} 8 0 0Z" fill="#6E5A33" stroke="${C.ink}" stroke-width="1.6" transform="rotate(${a - 10}) scale(1 0.55)"/>`).join('')}<rect x="-4" y="-12" width="8" height="12" rx="3" fill="#5A4128" stroke="${C.ink}" stroke-width="1.6"/></g>`;
  } else if (tipo === 'kiwi') {
    const pts = oval(x, y, r * 1.12, r * 0.84, 20, 0.04, seed);
    const cid = clipDe(ctx, pts);
    let pelos = ''; const rr = rng(seed + 9);
    for (let i = 0; i < 90; i++) { const px = x - r + rr() * 2 * r, py = y - r * 0.8 + rr() * 1.6 * r; pelos += `M${f(px)} ${f(py)}l${f(1 + rr() * 2)} ${f(1 + rr() * 2)}`; }
    s += corpo(ctx, pts, '#8E6E48', '#5D452F', { brilho: 0.2, extra: `<g clip-path="url(#${cid})"><path d="${pelos}" ${S(1, '#D8C29A')} opacity="0.7"/></g>` });
  } else if (tipo === 'marmelo') {
    const pts = lobado(x, y, r * 1.02, r * 0.95, 5, 0.06, 36, seed).map(([px, py], i) => [px + Math.sin(i * 1.7 + seed) * r * 0.03, py]);
    const cid = clipDe(ctx, pts);
    s += corpo(ctx, pts, '#DCC257', '#A2892E', { extra: `<g clip-path="url(#${cid})">${pontos(seed + 4, 70, [x - r, y - r, 2 * r, 2 * r], [0.6, 1.3], C.ivory, 0.55)}</g>` });
    s += `<path d="M${f(x - 7)} ${f(y + r * 0.8)}l7 -6 7 6" ${S(2.4, '#5A4128')}/>` + pe(x, y - r * 0.86, r * 0.3, -10);
  } else if (tipo === 'ameixa') {
    const pts = oval(x, y, r * 0.95, r, 20, 0.03, seed);
    s += corpo(ctx, pts, '#5E2D52', '#371832', { brilho: 0.25, extra: `<path d="M${f(x + r * 0.1)} ${f(y - r)}q${f(-r * 0.25)} ${f(r)} ${f(r * 0.05)} ${f(2 * r)}" ${S(1.6, C.ink)} opacity="0.6"/>` });
    s += pe(x + r * 0.08, y - r * 0.95, r * 0.35, 8);
  } else if (tipo === 'figo') {
    const pts = [[0, -r * 1.25], [r * 0.25, -r * 1.05], [r * 0.75, -r * 0.45], [r * 0.85, r * 0.15], [r * 0.5, r * 0.6], [0, r * 0.72], [-r * 0.5, r * 0.6], [-r * 0.85, r * 0.15], [-r * 0.75, -r * 0.45], [-r * 0.25, -r * 1.05]].map(([a, b]) => [x + a, y + b]);
    s += corpo(ctx, pts, '#5F2E4A', '#3A1A2E', { brilho: 0.25 });
  } else if (tipo === 'tomate-cb') {
    const pts = lobado(x, y, r * 1.08, r * 0.78, 7, 0.07, 56, 0.4);
    const cid = clipDe(ctx, pts);
    let gomos = '';
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + 0.4 + Math.PI / 7; gomos += `M${f(x)} ${f(y - r * 0.55)}Q${f(x + Math.cos(a) * r * 0.6)} ${f(y - r * 0.4 + Math.sin(a) * r * 0.3)} ${f(x + Math.cos(a) * r * 1.05)} ${f(y + Math.sin(a) * r * 0.7)}`; }
    s += corpo(ctx, pts, '#CC4430', '#8A281C', { brilho: 0.5, extra: `<g clip-path="url(#${cid})"><path d="${gomos}" ${S(1.6, '#7A2216')} opacity="0.55"/></g>` });
    s += `<g transform="translate(${f(x)} ${f(y - r * 0.6)})">${[0, 72, 144, 216, 288].map((a) => `<path d="M0 0L${f(r * 0.32)} -3L${f(r * 0.1)} 3Z" fill="#4E7A35" stroke="${C.ink}" stroke-width="1.4" transform="rotate(${a}) scale(1 0.6)"/>`).join('')}<path d="M0 0l2 -10" ${S(4, '#4E7A35')}/></g>`;
  }
  return s;
}
/** Metade cortada (romã, kiwi, laranja, limão, figo) */
function metade(ctx, tipo, x, y, r) {
  const casca = { roma: '#8E2E28', kiwi: '#6E5238', laranja: '#D07A22', limao: '#D2B23A', figo: '#4A2238' }[tipo];
  let s = `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * 0.62)}" fill="${casca}" stroke="${C.ink}" stroke-width="2.6"/>`;
  const ri = r * 0.88;
  if (tipo === 'roma') {
    s += `<ellipse cx="${f(x)}" cy="${f(y - 2)}" rx="${f(ri)}" ry="${f(ri * 0.6)}" fill="#F1E2C8"/>`;
    let b = ''; const rr = rng(4);
    for (let i = 0; i < 70; i++) { const a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * 0.92; const px = x + Math.cos(a) * ri * d, py = y - 2 + Math.sin(a) * ri * 0.6 * d; b += `M${f(px - 5)} ${f(py)}a5 4 0 1 0 10 0a5 4 0 1 0 -10 0Z`; }
    s += `<path d="${b}" fill="#D0404E" stroke="#7A1E26" stroke-width="0.8"/>` + pontos(5, 30, [x - ri * 0.8, y - ri * 0.5, ri * 1.6, ri], [0.8, 1.4], C.ivory, 0.8);
  } else if (tipo === 'kiwi') {
    s += `<ellipse cx="${f(x)}" cy="${f(y - 2)}" rx="${f(ri)}" ry="${f(ri * 0.6)}" fill="#A7BF4E"/><ellipse cx="${f(x)}" cy="${f(y - 2)}" rx="${f(ri * 0.32)}" ry="${f(ri * 0.2)}" fill="#EDEFD0"/>`;
    let sem = '';
    for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; sem += `M${f(x + Math.cos(a) * ri * 0.45)} ${f(y - 2 + Math.sin(a) * ri * 0.27)}l${f(Math.cos(a) * 3)} ${f(Math.sin(a) * 2)}`; }
    s += `<path d="${sem}" ${S(2.6, '#1E1A14')}/>` + `<g opacity="0.35">${Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return `<path d="M${f(x + Math.cos(a) * ri * 0.34)} ${f(y - 2 + Math.sin(a) * ri * 0.21)}L${f(x + Math.cos(a) * ri * 0.9)} ${f(y - 2 + Math.sin(a) * ri * 0.55)}" ${S(1.2, C.ivory)}/>`; }).join('')}</g>`;
  } else if (tipo === 'laranja' || tipo === 'limao') {
    const pol = tipo === 'laranja' ? '#F2A23A' : '#F2DC6E';
    s += `<ellipse cx="${f(x)}" cy="${f(y - 2)}" rx="${f(ri)}" ry="${f(ri * 0.6)}" fill="#FBF3DD"/>`;
    for (let i = 0; i < 10; i++) { const a0 = (i / 10) * Math.PI * 2 + 0.08, a1 = ((i + 1) / 10) * Math.PI * 2 - 0.08; s += `<path d="M${f(x)} ${f(y - 2)}L${f(x + Math.cos(a0) * ri * 0.9)} ${f(y - 2 + Math.sin(a0) * ri * 0.54)}A${f(ri * 0.9)} ${f(ri * 0.54)} 0 0 1 ${f(x + Math.cos(a1) * ri * 0.9)} ${f(y - 2 + Math.sin(a1) * ri * 0.54)}Z" fill="${pol}"/>`; }
  } else if (tipo === 'figo') {
    s += `<ellipse cx="${f(x)}" cy="${f(y - 2)}" rx="${f(ri)}" ry="${f(ri * 0.6)}" fill="#E7C7A4"/><ellipse cx="${f(x)}" cy="${f(y - 2)}" rx="${f(ri * 0.72)}" ry="${f(ri * 0.42)}" fill="#C2425A"/>` + pontos(6, 40, [x - ri * 0.6, y - ri * 0.35, ri * 1.2, ri * 0.6], [0.8, 1.5], '#F4D7A8', 0.9);
  }
  return s + `<ellipse cx="${f(x)}" cy="${f(y - 2)}" rx="${f(ri)}" ry="${f(ri * 0.6)}" ${S(1.4)} opacity="0.6"/>`;
}

/* ───────── aromáticas: molho deitado ───────── */
function folhaErva(tipo, p, a, k, r) {
  const t = (x, y) => [p[0] + Math.cos(a) * x - Math.sin(a) * y, p[1] + Math.sin(a) * x + Math.cos(a) * y];
  const pp = (pts) => smooth(pts.map(([x, y]) => t(x, y)));
  const s = k;
  switch (tipo) {
    case 'coentro': return [0, 1, 2].map((i) => { const b = (i - 1) * 0.7; return pp([[0, 0], [Math.cos(b) * 10 * s - Math.sin(b) * 7 * s, Math.sin(b) * 10 * s + Math.cos(b) * 7 * s], [Math.cos(b) * 20 * s, Math.sin(b) * 20 * s], [Math.cos(b) * 10 * s + Math.sin(b) * 7 * s, Math.sin(b) * 10 * s - Math.cos(b) * 7 * s]]); }).join('');
    case 'salsa': return pp(lobado(14 * s, 0, 12 * s, 10 * s, 7, 0.28, 28, r() * 6));
    case 'hortela': return pp([[0, 0], [10 * s, -9 * s], [24 * s, -8 * s], [32 * s, 0], [24 * s, 8 * s], [10 * s, 9 * s]]);
    case 'manjericao': return pp([[0, 0], [10 * s, -12 * s], [28 * s, -12 * s], [40 * s, 0], [28 * s, 12 * s], [10 * s, 12 * s]]);
    case 'salva': return pp([[0, 0], [12 * s, -8 * s], [36 * s, -7 * s], [44 * s, 0], [36 * s, 7 * s], [12 * s, 8 * s]]);
    case 'lucia': return pp([[0, 0], [16 * s, -4 * s], [44 * s, -2 * s], [52 * s, 0], [44 * s, 2 * s], [16 * s, 4 * s]]);
    case 'tomilho': return pp([[0, 0], [3 * s, -2.5 * s], [7 * s, -2 * s], [9 * s, 0], [7 * s, 2 * s], [3 * s, 2.5 * s]]);
    case 'oregaos': return pp([[0, 0], [4 * s, -4 * s], [9 * s, -4 * s], [11 * s, 0], [9 * s, 4 * s], [4 * s, 4 * s]]);
    case 'alecrim': { const [x0, y0] = t(0, 0), [x1, y1] = t(15 * s, 0); return `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`; }
    default: return '';
  }
}
export function molho(ctx, tipo, { seed = 1, tie = true, len = 330, stems = 7, ox = 120, oy = 320 } = {}) {
  const cores = { coentro: ['#5D8C40', '#3E6A2C'], salsa: ['#447431', '#2E5222'], hortela: ['#62944D', '#3F6E35'], alecrim: ['#3F5E40', '#2E4630'], tomilho: ['#6E8A58', '#4F6A40'], oregaos: ['#86895A', '#676A40'], manjericao: ['#3F8C38', '#2C6A28'], salva: ['#93A48A', '#6F8268'], lucia: ['#6F9C50', '#4E7A38'] }[tipo];
  const caule = { alecrim: '#5A5A38', tomilho: '#6A5A3A', oregaos: '#8A7A55', salva: '#7A8A6E' }[tipo] || '#6E9450';
  const r = rng(seed);
  let caules = '', folhas1 = '', folhas2 = '', flores = '';
  for (let i = 0; i < stems; i++) {
    const ang = -0.62 + (i / (stems - 1)) * 0.75 + (r() - 0.5) * 0.1;
    const L = len * (0.78 + r() * 0.3);
    const end = [ox + Math.cos(ang) * L, oy + Math.sin(ang) * L];
    const ctrl = [ox + Math.cos(ang - 0.08) * L * 0.5, oy + Math.sin(ang - 0.08) * L * 0.5];
    caules += `M${f(ox - 30)} ${f(oy + 6 - i)}L${f(ox)} ${f(oy)}Q${f(ctrl[0])} ${f(ctrl[1])} ${f(end[0])} ${f(end[1])}`;
    const Q = (t) => [(1 - t) * (1 - t) * ox + 2 * (1 - t) * t * ctrl[0] + t * t * end[0], (1 - t) * (1 - t) * oy + 2 * (1 - t) * t * ctrl[1] + t * t * end[1]];
    const passo = { alecrim: 0.035, tomilho: 0.05, oregaos: 0.06, lucia: 0.16, salva: 0.13, manjericao: 0.14, hortela: 0.13, coentro: 0.12, salsa: 0.1 }[tipo];
    for (let t = 0.32; t <= 1.001; t += passo) {
      const p0 = Q(t), p1 = Q(Math.min(1, t + 0.01));
      const dir = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      const k = tipo === 'alecrim' || tipo === 'tomilho' ? 1 : 0.75 + (1 - t) * 0.5;
      const lados = tipo === 'lucia' ? [-1.05, 0, 1.05] : [-1, 1];
      lados.forEach((ld, j) => {
        const a = dir + (tipo === 'lucia' ? ld : ld * (tipo === 'alecrim' ? 0.9 : 0.85));
        const dd = folhaErva(tipo, p0, a, k, r);
        if ((i + j + Math.round(t * 10)) % 3 === 0) folhas2 += dd; else folhas1 += dd;
      });
    }
    if (tipo === 'oregaos') { const pe2 = Q(1); flores += pontos(seed + i, 14, [pe2[0] - 10, pe2[1] - 10, 20, 20], [2, 3.4], '#E2CDB8', 1); }
    if (tipo === 'manjericao' || tipo === 'hortela') folhas1 += folhaErva(tipo, Q(1), Math.atan2(end[1] - ctrl[1], end[0] - ctrl[0]), 0.7, r);
  }
  const lw = tipo === 'alecrim' ? 'stroke-width="3.6" stroke-linecap="round"' : 'stroke-width="1.3"';
  const fill = (cor) => (tipo === 'alecrim' ? `fill="none" stroke="${cor}" ${lw}` : `fill="${cor}" stroke="${C.ink}" ${lw}`);
  let s = `<path d="${caules}" ${S(tipo === 'alecrim' || tipo === 'tomilho' || tipo === 'oregaos' ? 2.4 : 3, caule)}/><path d="${caules}" ${S(0.9)} opacity="0.5"/>`;
  s += `<path d="${folhas2}" ${fill(cores[1])}/><path d="${folhas1}" ${fill(cores[0])}/>`;
  if (tipo === 'alecrim') s += `<path d="${folhas1}" fill="none" stroke="${C.ink}" stroke-width="0.8" opacity="0.6"/>`;
  if (tipo === 'salva') s += `<path d="${folhas1}" fill="url(#${ctx.hatch(30, 3, 0.6, C.ivory)})" opacity="0.4"/>`;
  if (tipo === 'manjericao') s += `<path d="${folhas1}" fill="url(#${ctx.hatch(-20, 7, 1.4, C.ivory)})" opacity="0.25"/>`;
  s += flores;
  if (tie) s += `<path d="M${f(ox - 6)} ${f(oy - 16)}q-8 16 4 30M${f(ox + 2)} ${f(oy - 16)}q-8 16 4 30" ${S(4, C.terra)}/><path d="M${f(ox - 2)} ${f(oy + 12)}q-14 18 -24 20M${f(ox - 2)} ${f(oy + 12)}q4 20 -2 30" ${S(2, C.terra)}/>`;
  return s;
}

/* ───────── pães ───────── */
function pao(ctx, tipo, x, y, k = 1, seed = 1) {
  let s = '';
  if (tipo === 'centeio') {
    const pts = [[-200, 0], [-205, -30], [-170, -70], [-90, -92], [0, -98], [90, -92], [170, -70], [205, -30], [200, 0], [100, 8], [0, 10], [-100, 8]].map(([a, b]) => [x + a * k, y + b * k]);
    const cid = clipDe(ctx, pts);
    let cortes = '';
    for (let i = 0; i < 4; i++) { const cx = x + (-120 + i * 80) * k, cy = y - 70 * k; cortes += `<path d="M${f(cx - 26 * k)} ${f(cy + 18 * k)}C${f(cx - 10 * k)} ${f(cy - 4 * k)} ${f(cx + 10 * k)} ${f(cy - 14 * k)} ${f(cx + 30 * k)} ${f(cy - 20 * k)}C${f(cx + 12 * k)} ${f(cy - 4 * k)} ${f(cx - 6 * k)} ${f(cy + 8 * k)} ${f(cx - 26 * k)} ${f(cy + 18 * k)}Z" fill="#B88458" stroke="${C.ink}" stroke-width="1.4"/>`; }
    s += corpo(ctx, pts, '#7C5337', '#4B3121', { brilho: 0.15, extra: `<g clip-path="url(#${cid})">${pontos(seed, 160, [x - 200 * k, y - 100 * k, 400 * k, 80 * k], [0.8, 2.4], C.ivory, 0.75)}${cortes}</g>` });
  } else if (tipo === 'mistura') {
    const pts = oval(x, y - 80 * k, 150 * k, 92 * k, 22, 0.02, seed).map(([a, b]) => [a, Math.min(b, y)]);
    const cid = clipDe(ctx, pts);
    const cruz = `<path d="M${f(x - 90 * k)} ${f(y - 120 * k)}C${f(x - 40 * k)} ${f(y - 150 * k)} ${f(x + 40 * k)} ${f(y - 148 * k)} ${f(x + 92 * k)} ${f(y - 118 * k)}C${f(x + 40 * k)} ${f(y - 132 * k)} ${f(x - 40 * k)} ${f(y - 134 * k)} ${f(x - 90 * k)} ${f(y - 120 * k)}Z" fill="#EFD3A0" stroke="${C.ink}" stroke-width="1.6"/><path d="M${f(x - 8 * k)} ${f(y - 168 * k)}C${f(x - 22 * k)} ${f(y - 130 * k)} ${f(x - 18 * k)} ${f(y - 90 * k)} ${f(x - 4 * k)} ${f(y - 60 * k)}C${f(x + 4 * k)} ${f(y - 90 * k)} ${f(x + 8 * k)} ${f(y - 130 * k)} ${f(x - 8 * k)} ${f(y - 168 * k)}Z" fill="#EFD3A0" stroke="${C.ink}" stroke-width="1.6"/>`;
    s += corpo(ctx, pts, '#D6A46D', '#A47042', { brilho: 0.3, extra: `<g clip-path="url(#${cid})">${pontos(seed, 60, [x - 120 * k, y - 170 * k, 160 * k, 80 * k], [0.8, 2], C.ivory, 0.8)}${cruz}</g>` });
  } else if (tipo === 'sementes') {
    const pts = [[-170, 0], [-172, -70], [-160, -118], [-100, -142], [0, -148], [100, -142], [160, -118], [172, -70], [170, 0]].map(([a, b]) => [x + a * k, y + b * k]);
    const cid = clipDe(ctx, pts);
    const sem = pontos(seed, 90, [x - 165 * k, y - 148 * k, 330 * k, 70 * k], [2, 3.4], '#F2E7C8', 1, 1.8) + pontos(seed + 1, 70, [x - 165 * k, y - 148 * k, 330 * k, 70 * k], [1.6, 2.6], '#4A3022', 1, 1.6) + pontos(seed + 2, 40, [x - 165 * k, y - 148 * k, 330 * k, 70 * k], [2.4, 3.6], '#8E8E7A', 1, 2);
    s += corpo(ctx, pts, '#BC8654', '#875A33', { brilho: 0.2, extra: `<g clip-path="url(#${cid})">${sem}<path d="M${f(x - 170 * k)} ${f(y - 72 * k)}H${f(x + 170 * k)}" ${S(1.6)} opacity="0.5"/></g>` });
  } else if (tipo === 'carcaca') {
    const pts = oval(x, y - 34 * k, 72 * k, 38 * k, 18, 0.03, seed).map(([a, b]) => [a, Math.min(b, y)]);
    const cid = clipDe(ctx, pts);
    s += corpo(ctx, pts, '#DCA660', '#A6723A', { brilho: 0.35, extra: `<g clip-path="url(#${cid})"><path d="M${f(x - 50 * k)} ${f(y - 44 * k)}C${f(x - 20 * k)} ${f(y - 66 * k)} ${f(x + 20 * k)} ${f(y - 66 * k)} ${f(x + 52 * k)} ${f(y - 44 * k)}C${f(x + 20 * k)} ${f(y - 54 * k)} ${f(x - 20 * k)} ${f(y - 54 * k)} ${f(x - 50 * k)} ${f(y - 44 * k)}Z" fill="#F2D59C" stroke="${C.ink}" stroke-width="1.6"/></g>` });
  } else if (tipo === 'alfarroba') {
    const pts = oval(x, y - 70 * k, 140 * k, 80 * k, 22, 0.03, seed).map(([a, b]) => [a, Math.min(b, y)]);
    const cid = clipDe(ctx, pts);
    s += corpo(ctx, pts, '#5E3D2B', '#382218', { brilho: 0.15, extra: `<g clip-path="url(#${cid})">${pontos(seed, 80, [x - 120 * k, y - 150 * k, 200 * k, 60 * k], [0.8, 2.2], C.ivory, 0.75)}<path d="M${f(x - 80 * k)} ${f(y - 110 * k)}l40 12 30 -14 36 10" ${S(3, '#2A1810')}/></g>` });
  } else if (tipo === 'fogaca') {
    const pts = oval(x, y - 50 * k, 150 * k, 60 * k, 22, 0.02, seed).map(([a, b]) => [a, Math.min(b, y)]);
    s += corpo(ctx, pts, '#D48F44', '#9C5E24', { brilho: 0.3 });
    [[-60, -98], [60, -98], [-30, -118], [30, -118]].forEach(([a, b], i) => {
      const tp = [[-22, 0], [-24, -40], [-14, -56], [0, -60], [14, -56], [24, -40], [22, 0], [0, 6]].map(([u, v]) => [x + (a + u) * k, y + (b + v) * k]);
      s += corpo(ctx, tp, i < 2 ? '#D99549' : '#E0A055', '#A06228', { brilho: 0.35, hachura: false, w: 2.2 });
    });
    s += pontos(seed + 5, 70, [x - 130 * k, y - 170 * k, 260 * k, 120 * k], [1, 2], C.ivory, 0.95);
  } else if (tipo === 'regueifa') {
    let lob = '';
    const nL = 14;
    for (let i = 0; i < nL; i++) {
      const a = (i / nL) * Math.PI * 2 + Math.PI / 2;
      const cx = x + Math.cos(a) * 150 * k, cy = y - 70 * k + Math.sin(a) * 62 * k;
      lob += `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f((a * 180) / Math.PI + 60)})">${corpo(ctx, oval(0, 0, 46 * k, 26 * k, 16, 0.02, i), '#BE6E34', '#7C4019', { brilho: 0.55, hachura: false, w: 2 })}</g>`;
    }
    // ordem: a metade de trás primeiro
    s += `<ellipse cx="${f(x)}" cy="${f(y - 70 * k)}" rx="${f(100 * k)}" ry="${f(32 * k)}" fill="none"/>` + lob;
  }
  return s;
}

/* ───────── despensa: sacos, frascos, garrafas ───────── */
function saco(ctx, x, y, w, h, conteudo, seed = 1) {
  const L = x - w / 2, R = x + w / 2, T = y - h;
  let s = '';
  // abertura com o conteúdo à vista
  s += `<path d="M${f(L + 4)} ${f(T + 6)}C${f(L + w * 0.3)} ${f(T - 18)} ${f(R - w * 0.3)} ${f(T - 18)} ${f(R - 4)} ${f(T + 6)}L${f(R - 4)} ${f(T + 26)}L${f(L + 4)} ${f(T + 26)}Z" fill="${C.kraftDark}" stroke="${C.ink}" stroke-width="2.2"/>`;
  s += conteudo(L + 6, T - 46, w - 12, 64, seed);
  const face = poly([[L, T + 20], [R, T + 20], [R + 6, y], [L - 6, y]]);
  s += `<path d="${face}" fill="${C.kraft}"/>` + hatched(ctx, face, { angle: 80, gap: 7, width: 1, opacity: 0.18 });
  s += `<path d="M${f(L + w * 0.22)} ${f(T + 30)}L${f(L + w * 0.18)} ${f(y - 8)}M${f(R - w * 0.15)} ${f(T + 34)}L${f(R - w * 0.12)} ${f(y - 14)}" ${S(1.2)} opacity="0.35"/>`;
  s += `<path d="${face}" ${S(2.6)}/>`;
  // dobra virada para fora
  s += `<path d="${poly([[L - 4, T + 4], [R + 4, T + 4], [R + 6, T + 30], [L - 6, T + 30]])}" fill="${C.kraftLight}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<rect x="${f(x - w * 0.28)}" y="${f(T + 54)}" width="${f(w * 0.56)}" height="${f(h * 0.3)}" rx="6" fill="${C.ivory}" stroke="${C.ink}" stroke-width="1.8"/><path d="M${f(x - w * 0.18)} ${f(T + 54 + h * 0.12)}h${f(w * 0.36)}M${f(x - w * 0.12)} ${f(T + 54 + h * 0.2)}h${f(w * 0.24)}" ${S(2.4)}/>`;
  return s;
}
const graos = (tipo) => (x, y, w, h, seed) => {
  const r = rng(seed); let s = '';
  if (tipo === 'milho') return `<path d="M${f(x)} ${f(y + h)}C${f(x + w * 0.2)} ${f(y - 10)} ${f(x + w * 0.7)} ${f(y - 14)} ${f(x + w)} ${f(y + h)}Z" fill="#E9C459" stroke="${C.ink}" stroke-width="2"/>` + pontos(seed, 80, [x + 10, y + 4, w - 20, h - 8], [0.6, 1.4], '#B8902A', 0.7);
  const n = { grao: 46, frade: 70, manteiga: 26, arroz: 320 }[tipo];
  const cx = x + w / 2, base = y + h;
  const lista = [];
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1;
    const topo = base - h * (1 - u * u);
    lista.push([cx + u * w * 0.47, topo + r() * (base - topo)]);
  }
  lista.sort((a, b2) => a[1] - b2[1]).forEach(([px, py]) => { s += graoUm(tipo, px, py, r); });
  return s;
};
function graoUm(tipo, px, py, r) {
  if (tipo === 'grao') return `<g transform="translate(${f(px)} ${f(py)})"><circle r="9" fill="#DDBB86" stroke="${C.ink}" stroke-width="1.4"/><path d="M-3 -8q4 3 2 7" ${S(1.2)} opacity="0.6"/><circle cx="-3" cy="-3" r="2.4" fill="${C.ivory}" opacity="0.6"/></g>`;
  if (tipo === 'frade') return `<g transform="translate(${f(px)} ${f(py)}) rotate(${f(r() * 180)})"><ellipse rx="8" ry="5.5" fill="#EFE6D0" stroke="${C.ink}" stroke-width="1.2"/><ellipse cx="1" rx="2.6" ry="1.8" fill="#1E1A14"/></g>`;
  if (tipo === 'manteiga') return `<g transform="translate(${f(px)} ${f(py)}) rotate(${f(r() * 180)})"><ellipse rx="15" ry="9" fill="#F2ECDB" stroke="${C.ink}" stroke-width="1.4"/><path d="M-9 -1q9 -4 18 0" ${S(1)} opacity="0.4"/></g>`;
  if (tipo === 'arroz') return `<ellipse cx="${f(px)}" cy="${f(py)}" rx="3.6" ry="1.6" transform="rotate(${f(r() * 180)} ${f(px)} ${f(py)})" fill="#F7F3E8" stroke="${C.ink}" stroke-width="0.7"/>`;
  return '';
}
function espalhar(tipo, cx, cy, w, n, seed) { const r = rng(seed); let s = ''; for (let i = 0; i < n; i++) s += graoUm(tipo, cx + (r() - 0.5) * w, cy + (r() - 0.5) * 18, r); return s; }

function frasco(ctx, x, y, w, h, { cor, escura, tampa = 'pano', textura = '', nivel = 0.86, vidro = true, rotulo = true }) {
  const L = x - w / 2, T = y - h;
  const corpoD = `M${f(L)} ${f(T + 26)}Q${f(L)} ${f(T + 14)} ${f(L + 10)} ${f(T + 12)}H${f(L + w - 10)}Q${f(L + w)} ${f(T + 14)} ${f(L + w)} ${f(T + 26)}V${f(y - 10)}Q${f(L + w)} ${f(y)} ${f(L + w - 10)} ${f(y)}H${f(L + 10)}Q${f(L)} ${f(y)} ${f(L)} ${f(y - 10)}Z`;
  const cid = ctx.clip(corpoD);
  const topo = y - (h - 26) * nivel;
  let s = `<path d="${corpoD}" fill="#EEF0E6" opacity="0.6"/>`;
  s += `<g clip-path="url(#${cid})"><rect x="${f(L)}" y="${f(topo)}" width="${f(w)}" height="${f(y - topo)}" fill="${cor}"/><rect x="${f(L + w * 0.6)}" y="${f(topo)}" width="${f(w * 0.4)}" height="${f(y - topo)}" fill="${escura}" opacity="0.55"/>${textura}
    ${vidro ? `<rect x="${f(L + w * 0.12)}" y="${f(T + 30)}" width="${f(w * 0.08)}" height="${f(h * 0.62)}" rx="4" fill="${C.ivory}" opacity="0.55"/>` : ''}</g>`;
  s += `<path d="${corpoD}" ${S(2.6)}/>`;
  if (rotulo) s += `<rect x="${f(L + w * 0.14)}" y="${f(T + h * 0.42)}" width="${f(w * 0.72)}" height="${f(h * 0.3)}" rx="4" fill="${C.ivory}" stroke="${C.ink}" stroke-width="1.8"/><path d="M${f(L + w * 0.26)} ${f(T + h * 0.52)}h${f(w * 0.48)}M${f(L + w * 0.32)} ${f(T + h * 0.62)}h${f(w * 0.36)}" ${S(2.2)}/><circle cx="${f(x)}" cy="${f(T + h * 0.465)}" r="3" fill="${C.terra}"/>`;
  if (tampa === 'pano') {
    const pano = `M${f(L - 10)} ${f(T + 30)}Q${f(x)} ${f(T + 44)} ${f(L + w + 10)} ${f(T + 30)}L${f(L + w - 4)} ${f(T + 4)}Q${f(x)} ${f(T - 14)} ${f(L + 4)} ${f(T + 4)}Z`;
    s += `<path d="${pano}" fill="${C.ivory}"/><g clip-path="url(#${ctx.clip(pano)})"><path d="${Array.from({ length: 12 }, (_, i) => `M${f(L - 10 + i * (w + 20) / 11)} ${f(T - 20)}v70`).join('')}" ${S(3, C.terra)} opacity="0.6"/><path d="${Array.from({ length: 4 }, (_, i) => `M${f(L - 20)} ${f(T - 4 + i * 11)}h${f(w + 40)}`).join('')}" ${S(3, C.terra)} opacity="0.6"/></g><path d="${pano}" ${S(2.4)}/>`;
    s += `<path d="M${f(L - 2)} ${f(T + 26)}Q${f(x)} ${f(T + 36)} ${f(L + w + 2)} ${f(T + 26)}" ${S(3.4, C.kraftDark)}/><path d="M${f(L + w)} ${f(T + 26)}q10 10 4 22M${f(L + w)} ${f(T + 26)}q16 4 18 16" ${S(2, C.kraftDark)}/>`;
  } else if (tampa === 'metal') {
    s += `<rect x="${f(L + 4)}" y="${f(T - 4)}" width="${f(w - 8)}" height="20" rx="4" fill="#4A5A4C" stroke="${C.ink}" stroke-width="2.4"/><path d="${Array.from({ length: 12 }, (_, i) => `M${f(L + 10 + i * (w - 20) / 11)} ${f(T - 1)}v14`).join('')}" ${S(1.2, C.cream)} opacity="0.6"/>`;
  }
  return s;
}

function garrafa(ctx, x, y) {
  const pts = [[-52, 0], [-56, -12], [-56, -190], [-50, -212], [-22, -238], [-17, -262], [-17, -300], [17, -300], [17, -262], [22, -238], [50, -212], [56, -190], [56, -12], [52, 0]].map(([a, b]) => [x + a, y + b]);
  const d = poly(pts);
  const cid = ctx.clip(d);
  let s = `<path d="${d}" fill="#2E4A2A"/><g clip-path="url(#${cid})"><rect x="${f(x - 56)}" y="${f(y - 214)}" width="112" height="214" fill="#6E7A2E" opacity="0.55"/><rect x="${f(x - 42)}" y="${f(y - 250)}" width="12" height="236" rx="6" fill="${C.ivory}" opacity="0.4"/></g><path d="${d}" ${S(2.6)}/>`;
  s += `<rect x="${f(x - 19)}" y="${f(y - 324)}" width="38" height="28" rx="5" fill="#C9A27A" stroke="${C.ink}" stroke-width="2.2"/>`;
  s += `<rect x="${f(x - 46)}" y="${f(y - 168)}" width="92" height="104" rx="6" fill="${C.ivory}" stroke="${C.ink}" stroke-width="2"/><path d="M${f(x - 30)} ${f(y - 112)}h60M${f(x - 22)} ${f(y - 96)}h44" ${S(2.4)}/><path d="M${f(x - 46)} ${f(y - 152)}h92" ${S(5, C.terra)}/><circle cx="${f(x)}" cy="${f(y - 132)}" r="9" fill="none" stroke="${C.ink}" stroke-width="2"/>`;
  return s;
}

/* ───────── queijos, ovos, manteiga ───────── */
function cilindro(ctx, x, y, rx, ry, h, topo, lado, escuro, { textura = '', w = 2.6 } = {}) {
  const ladoD = `M${f(x - rx)} ${f(y - h)}V${f(y)}A${f(rx)} ${f(ry)} 0 0 0 ${f(x + rx)} ${f(y)}V${f(y - h)}Z`;
  const cid = ctx.clip(ladoD);
  let s = `<path d="${ladoD}" fill="${lado}"/><g clip-path="url(#${cid})"><rect x="${f(x + rx * 0.2)}" y="${f(y - h)}" width="${f(rx)}" height="${f(h + ry)}" fill="${escuro}" opacity="0.5"/>${textura}</g><path d="${ladoD}" ${S(w)}/>`;
  s += `<ellipse cx="${f(x)}" cy="${f(y - h)}" rx="${f(rx)}" ry="${f(ry)}" fill="${topo}" stroke="${C.ink}" stroke-width="${w}"/>`;
  return s;
}
function ovo(ctx, x, y, r, cor, escura, ang = 0, malhas = 0, seed = 1) {
  const pts = [[0, -r * 1.3], [r * 0.6, -r * 1.05], [r * 0.95, -r * 0.3], [r * 0.85, r * 0.45], [r * 0.4, r * 0.85], [0, r * 0.95], [-r * 0.4, r * 0.85], [-r * 0.85, r * 0.45], [-r * 0.95, -r * 0.3], [-r * 0.6, -r * 1.05]];
  const cid = ctx.clip(smooth(pts));
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${ang})">${corpo(ctx, pts, cor, escura, { brilho: 0.6, hachura: false, w: 2.2, extra: malhas ? `<g clip-path="url(#${cid})">${pontos(seed, malhas, [-r, -r * 1.3, 2 * r, 2.3 * r], [1, 3.2], '#5A3A22', 0.85)}</g>` : '' })}</g>`;
}
function caixaOvos(ctx, x, y, cols, rows, cell, corOvo, escura, malhas = 0, rOvo = cell * 0.36) {
  const W = cols * cell, H = rows * cell * 0.55;
  const L = x - W / 2;
  let s = '';
  // tampa aberta atrás
  s += `<path d="${poly([[L - 6, y - H - 8], [L + W + 6, y - H - 8], [L + W - 10, y - H - 96], [L + 10, y - H - 96]])}" fill="#CEC3AA" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<path d="M${f(L + 30)} ${f(y - H - 60)}h${f(W - 60)}" ${S(1.4)} opacity="0.5"/>`;
  s += `<path d="${poly([[L - 8, y - H - 6], [L + W + 8, y - H - 6], [L + W + 2, y + 8], [L - 2, y + 8]])}" fill="#D7CCB2" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const cx = L + cell * (i + 0.5), cy = y - H + cell * 0.55 * (j + 0.5);
    s += `<ellipse cx="${f(cx)}" cy="${f(cy + 4)}" rx="${f(cell * 0.42)}" ry="${f(cell * 0.2)}" fill="#BFB295" stroke="${C.ink}" stroke-width="1.4"/>`;
    s += ovo(ctx, cx, cy - rOvo * 0.4, rOvo, corOvo, escura, (i + j) % 2 ? 8 : -6, malhas, i * 7 + j);
  }
  s += `<path d="${poly([[L - 2, y + 8], [L + W + 2, y + 8], [L + W - 6, y + 30], [L + 6, y + 30]])}" fill="#C6BA9E" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  return s;
}

/* ───────── desenhos dos 72 artigos ───────── */
const K = (cx, cy, rx) => (ctx) => sombra(ctx, cx, cy, rx);
export const DESENHOS = {
  // HORTÍCOLAS
  'cenouras-com-rama': (ctx) => sombra(ctx, 330, 372, 210) + g(P.carrotBunch(ctx, { n: 5, seed: 64, ramaLen: 200, rootL: 190, spread: 14, stems: 3, gapX: 24 }), 240, 300, 1, -70),
  'couve-portuguesa': (ctx) => sombra(ctx, 300, 392, 170) + g(P.couve(ctx, { seed: 35 }), 300, 392, 1.22),
  'tomate-coracao-de-boi': (ctx) => {
    let s = sombra(ctx, 300, 388, 230);
    s += `<path d="${poly([[90, 300], [510, 300], [490, 392], [110, 392]])}" fill="${C.kraft}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
    s += fruta(ctx, 'tomate-cb', 200, 286, 70, 1) + fruta(ctx, 'tomate-cb', 380, 280, 74, 2) + fruta(ctx, 'tomate-cb', 290, 318, 78, 3);
    s += `<path d="${poly([[80, 330], [520, 330], [500, 396], [100, 396]])}" fill="${C.kraftLight}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/><path d="M110 360H490" ${S(1.2)} opacity="0.4"/>`;
    return s;
  },
  'abobora-manteiga': (ctx) => {
    let s = sombra(ctx, 300, 384, 210);
    const pts = [[0, -270], [16, -262], [26, -230], [30, -170], [44, -120], [84, -80], [100, -30], [86, 0], [40, 14], [0, 16], [-40, 14], [-86, 0], [-100, -30], [-84, -80], [-44, -120], [-30, -170], [-26, -230], [-16, -262]].map(([a, b]) => [250 + a, 370 + b]);
    s += corpo(ctx, pts, '#E7BA74', '#B5854A', { brilho: 0.4 });
    s += `<rect x="242" y="84" width="16" height="26" rx="4" fill="#7A6040" stroke="${C.ink}" stroke-width="2.2"/>`;
    // rodela cortada do bojo
    s += `<ellipse cx="410" cy="350" rx="92" ry="44" fill="#D9AE6A" stroke="${C.ink}" stroke-width="2.6"/><ellipse cx="410" cy="344" rx="84" ry="38" fill="#EE9C3C"/><ellipse cx="410" cy="344" rx="42" ry="18" fill="#F3C676" stroke="${C.ink}" stroke-width="1.4"/>`;
    s += [[-22, -4], [-8, 2], [8, -6], [22, 2], [0, 8], [14, 8], [-14, 8]].map(([a, b]) => `<ellipse cx="${410 + a}" cy="${344 + b}" rx="5" ry="3" fill="${C.ivory}" stroke="${C.ink}" stroke-width="1"/>`).join('');
    return s + `<ellipse cx="410" cy="344" rx="84" ry="38" ${S(1.6)}/>`;
  },
  'alho-frances': (ctx) => {
    let s = sombra(ctx, 300, 372, 240);
    [[0, 18], [26, -22]].forEach(([dx, dy], i) => {
      let h = `<g transform="translate(${300 + dx} ${300 + dy}) rotate(-14)">`;
      h += `<path d="M-250 -6q-14 -10 -26 -4M-250 2q-18 2 -28 10M-250 8q-10 10 -20 20" ${S(1.6, '#8A7A55')}/>`;
      const fuste = smooth([[-250, -15], [-30, -17], [20, -15], [20, 15], [-30, 17], [-250, 15], [-258, 0]]);
      h += `<path d="${fuste}" fill="#F2EEDC"/><g clip-path="url(#${ctx.clip(fuste)})"><rect x="-60" y="-20" width="90" height="40" fill="#C9D79A" opacity="0.8"/><rect x="-250" y="4" width="280" height="12" fill="#D7D2BB" opacity="0.7"/></g><path d="${fuste}" ${S(2.4)}/><path d="M-240 -6H0M-240 6H0" ${S(1)} opacity="0.35"/>`;
      [[-0.32, '#5E8546'], [0.28, '#3C5E33'], [-0.1, '#4A7038'], [0.12, '#6B9050']].forEach(([a, cor]) => {
        h += `<g transform="rotate(${f(a * 57)} 10 0)"><path d="M10 -12C80 -22 160 -20 230 -6C160 -4 80 0 10 12Z" fill="${cor}" stroke="${C.ink}" stroke-width="2"/><path d="M14 0C90 -6 160 -8 226 -6" ${S(1.2, C.cream)} opacity="0.6"/></g>`;
      });
      s += h + '</g>';
      void i;
    });
    return s;
  },
  'batata-vermelha': (ctx) => {
    let s = sombra(ctx, 300, 382, 230);
    const saco = smooth([[150, 380], [130, 260], [160, 150], [300, 128], [440, 150], [470, 260], [450, 380], [300, 392]]);
    s += `<path d="${saco}" fill="#C7A775"/><g clip-path="url(#${ctx.clip(saco)})"><path d="${saco}" fill="url(#${ctx.hatch(45, 6, 1.4, '#8E6E40')})" opacity="0.6"/><path d="${saco}" fill="url(#${ctx.hatch(-45, 6, 1.4, '#8E6E40')})" opacity="0.6"/></g><path d="${saco}" ${S(2.6)}/>`;
    s += `<path d="M160 160C240 120 360 120 440 160C420 186 180 186 160 160Z" fill="#9C7E50" stroke="${C.ink}" stroke-width="2.4"/>`;
    const r = rng(8);
    [[220, 168], [270, 158], [330, 160], [380, 170], [300, 176]].forEach(([x, y], i) => { s += corpo(ctx, oval(x, y, 34, 24, 16, 0.12, i), '#AE4C41', '#6E2E28', { brilho: 0.4, hachura: false, w: 2.2 }); });
    [[150, 360, 46, 32], [250, 372, 40, 28], [420, 362, 44, 30], [500, 378, 34, 24]].forEach(([x, y, a, b], i) => {
      s += corpo(ctx, oval(x, y, a, b, 16, 0.14, 20 + i), '#AE4C41', '#6E2E28', { brilho: 0.4, w: 2.4 }) + pontos(30 + i, 5, [x - a * 0.6, y - b * 0.6, a * 1.2, b * 1.2], [1.4, 2.4], '#5A2620', 0.9);
    });
    void r;
    return s;
  },
  beterraba: (ctx) => {
    let s = sombra(ctx, 300, 382, 220);
    // folhas
    [[-40, 230, -40], [0, 250, -8], [40, 230, 22], [70, 200, 48], [-80, 200, -62]].forEach(([dx, L, a], i) => {
      s += `<g transform="translate(${300 + dx * 0.3} 260) rotate(${a})"><path d="M0 0V${f(-L * 0.35)}" ${S(6, '#9B2B48')}/><g transform="translate(0 ${f(-L * 0.3)})">${P.leaf(ctx, { L: L * 0.75, W: 96, style: i % 2 ? 'solid' : 'mid', seed: 40 + i })}</g></g>`;
    });
    [[230, 330, 54], [370, 334, 58], [300, 300, 52]].forEach(([x, y, r], i) => {
      s += `<path d="M${x} ${y + r * 0.8}q${i * 6 - 6} 40 ${i * 10 - 2} 64" ${S(3, '#6E2443')}/>`;
      s += corpo(ctx, oval(x, y, r, r * 0.92, 18, 0.06, i), '#76284A', '#43142A', { brilho: 0.35 });
      s += `<path d="M${x - r * 0.5} ${y + r * 0.2}q${r * 0.5} 10 ${r} 0M${x - r * 0.4} ${y + r * 0.5}q${r * 0.4} 8 ${r * 0.8} 0" ${S(1.2, '#C47A92')} opacity="0.6"/>`;
    });
    return s + `<path d="M276 270q24 14 48 0" ${S(5, C.terra)}/>`;
  },
  espinafres: (ctx) => {
    let s = sombra(ctx, 320, 380, 220);
    [-58, -36, -16, 4, 22, 42, 60, -48, 30].forEach((a, i) => {
      s += `<g transform="translate(200 330) rotate(${a + 80})"><path d="M0 0V-70" ${S(5, '#7EA25A')}/><g transform="translate(0 -60)">${P.leaf(ctx, { L: 150 + (i % 3) * 18, W: 100, style: 'mid', seed: 60 + i, bend: (i % 2 ? 1 : -1) * 10 })}</g></g>`;
    });
    return s + `<path d="M186 314q16 -8 26 10q-12 18 -28 8" ${S(5, C.terra)}/>`;
  },
  curgete: (ctx) => {
    let s = sombra(ctx, 300, 380, 240);
    [[300, 300, -12], [310, 344, 6]].forEach(([x, y, a], i) => {
      const pts = [[-220, 0], [-212, -26], [-160, -40], [0, -44], [170, -38], [214, -22], [222, 0], [214, 22], [170, 38], [0, 44], [-160, 40], [-212, 26]];
      const cid = ctx.clip(smooth(pts));
      s += `<g transform="translate(${x} ${y}) rotate(${a})">${corpo(ctx, pts, '#4A7339', '#2C4A24', { brilho: 0.35, extra: `<g clip-path="url(#${cid})">${pontos(70 + i, 80, [-210, -40, 420, 80], [1, 2.2], '#B5C88A', 0.75, 1.8)}<path d="M-200 -14H200M-200 12H200" ${S(1.4, '#9BB370')} opacity="0.5"/></g>` })}
        <path d="M222 -10l26 -4 4 14 -4 14 -26 -4Z" fill="#9AB06A" stroke="${C.ink}" stroke-width="2"/><ellipse cx="-222" cy="0" rx="6" ry="10" fill="#6E8A4E" stroke="${C.ink}" stroke-width="1.6"/></g>`;
    });
    return s;
  },
  // FRUTA
  'maca-bravo-de-esmolfe': (ctx) => sombra(ctx, 300, 380, 220) + fruta(ctx, 'maca', 200, 300, 62, 1) + fruta(ctx, 'maca', 330, 290, 66, 2) + fruta(ctx, 'maca', 260, 336, 58, 3) + fruta(ctx, 'maca', 410, 336, 56, 4) + folha(360, 236, 70, 34, 30),
  'pera-rocha': (ctx) => sombra(ctx, 300, 382, 210) + fruta(ctx, 'pera', 200, 378, 70, 1) + fruta(ctx, 'pera', 400, 380, 68, 2) + fruta(ctx, 'pera', 300, 392, 74, 3),
  laranja: (ctx) => sombra(ctx, 300, 382, 230) + fruta(ctx, 'laranja', 200, 300, 74, 1) + fruta(ctx, 'laranja', 360, 290, 78, 2) + folha(372, 214, 80, 40, 28, '#3E6A2C') + fruta(ctx, 'laranja', 280, 336, 70, 3) + metade(ctx, 'laranja', 450, 352, 66),
  clementina: (ctx) => sombra(ctx, 300, 380, 220) + folha(250, 236, 70, 36, -30, '#3E6A2C') + folha(270, 236, 66, 32, 12, '#4E7A35') + fruta(ctx, 'clementina', 190, 320, 56, 1) + fruta(ctx, 'clementina', 300, 300, 60, 2) + fruta(ctx, 'clementina', 410, 324, 56, 3) + fruta(ctx, 'clementina', 250, 352, 52, 4) + fruta(ctx, 'clementina', 360, 354, 54, 5),
  limao: (ctx) => sombra(ctx, 300, 380, 220) + fruta(ctx, 'limao', 220, 300, 58, 1) + fruta(ctx, 'limao', 360, 300, 60, 2) + fruta(ctx, 'limao', 280, 346, 56, 3) + metade(ctx, 'limao', 440, 352, 56) + folha(300, 254, 60, 30, 40, '#3E6A2C'),
  roma: (ctx) => sombra(ctx, 300, 382, 220) + fruta(ctx, 'roma', 240, 300, 96, 1) + metade(ctx, 'roma', 410, 350, 92),
  diospiro: (ctx) => sombra(ctx, 300, 380, 230) + fruta(ctx, 'diospiro', 200, 316, 64, 1) + fruta(ctx, 'diospiro', 340, 300, 68, 2) + fruta(ctx, 'diospiro', 270, 348, 60, 3) + fruta(ctx, 'diospiro', 430, 344, 58, 4),
  kiwi: (ctx) => sombra(ctx, 300, 380, 220) + fruta(ctx, 'kiwi', 210, 300, 64, 1) + fruta(ctx, 'kiwi', 340, 304, 62, 2) + fruta(ctx, 'kiwi', 270, 346, 60, 3) + metade(ctx, 'kiwi', 430, 352, 66),
  marmelo: (ctx) => sombra(ctx, 300, 380, 230) + folha(390, 226, 90, 46, 36, '#5E7A40') + fruta(ctx, 'marmelo', 210, 304, 76, 1) + fruta(ctx, 'marmelo', 370, 300, 80, 2) + fruta(ctx, 'marmelo', 290, 344, 70, 3),
  // ERVAS
  coentros: (ctx) => sombra(ctx, 300, 378, 230) + molho(ctx, 'coentro', { seed: 1 }),
  'salsa-frisada': (ctx) => sombra(ctx, 300, 378, 230) + molho(ctx, 'salsa', { seed: 2 }),
  hortela: (ctx) => sombra(ctx, 300, 378, 230) + molho(ctx, 'hortela', { seed: 3, stems: 6 }),
  alecrim: (ctx) => sombra(ctx, 300, 378, 230) + molho(ctx, 'alecrim', { seed: 4, stems: 6 }),
  tomilho: (ctx) => sombra(ctx, 300, 378, 230) + molho(ctx, 'tomilho', { seed: 5, stems: 9 }),
  oregaos: (ctx) => sombra(ctx, 300, 378, 230) + molho(ctx, 'oregaos', { seed: 6, stems: 7 }),
  manjericao: (ctx) => sombra(ctx, 300, 378, 230) + molho(ctx, 'manjericao', { seed: 7, stems: 5 }),
  salva: (ctx) => sombra(ctx, 300, 378, 230) + molho(ctx, 'salva', { seed: 8, stems: 5 }),
  'lucia-lima': (ctx) => sombra(ctx, 300, 378, 230) + molho(ctx, 'lucia', { seed: 9, stems: 5 }),
  // PADARIA
  'pao-fermentacao-lenta': (ctx) => sombra(ctx, 320, 352, 190) + g(P.loaf(ctx, { seed: 11 }), 300, 344, 1.6),
  'broa-de-milho': (ctx) => sombra(ctx, 300, 352, 200) + g(P.broa(ctx, { seed: 21 }), 262, 344, 1.62) + g(P.broaSlice(ctx), 468, 352, 1.15, 8),
  'pao-de-centeio': (ctx) => sombra(ctx, 300, 362, 220) + pao(ctx, 'centeio', 300, 352, 1.05, 3),
  'pao-de-mistura': (ctx) => sombra(ctx, 300, 364, 180) + pao(ctx, 'mistura', 300, 356, 1.25, 4),
  'pao-de-sementes': (ctx) => {
    let s = sombra(ctx, 300, 368, 220) + pao(ctx, 'sementes', 270, 352, 1, 5);
    s += `<g transform="translate(440 360) rotate(8)"><path d="M-46 0V-120Q-46 -150 -10 -152Q40 -150 44 -120V0Z" fill="#E9D0A2" stroke="${C.ink}" stroke-width="2.4"/><path d="M-46 0V-120Q-46 -150 -10 -152Q40 -150 44 -120V0" ${S(6, '#9A6A3E')} opacity="0.9"/>${pontos(9, 30, [-40, -140, 80, 130], [0.8, 1.8], '#B88E5E', 0.7)}${pontos(10, 10, [-40, -140, 80, 130], [1.5, 2.6], '#4A3022', 0.9, 1.6)}</g>`;
    return s;
  },
  'carcacas-de-trigo': (ctx) => sombra(ctx, 300, 372, 220) + pao(ctx, 'carcaca', 220, 300, 1, 1) + pao(ctx, 'carcaca', 380, 300, 1, 2) + pao(ctx, 'carcaca', 300, 352, 1.05, 3) + pao(ctx, 'carcaca', 450, 360, 0.95, 4),
  'pao-de-alfarroba': (ctx) => {
    let s = sombra(ctx, 300, 366, 220) + pao(ctx, 'alfarroba', 260, 358, 1.15, 6);
    [[430, 340, -12], [450, 372, 6]].forEach(([x, y, a]) => { s += `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-80 0C-60 -18 40 -24 84 -10C90 -2 86 6 80 8C40 2 -40 10 -80 8Z" fill="#3E2418" stroke="${C.ink}" stroke-width="2.2"/><path d="M-60 -4q10 -4 20 0t20 0 20 0 20 0 20 0" ${S(1.2, '#8A5A3A')}/></g>`; });
    return s;
  },
  fogaca: (ctx) => sombra(ctx, 300, 364, 190) + pao(ctx, 'fogaca', 300, 356, 1.1, 7),
  regueifa: (ctx) => sombra(ctx, 300, 372, 220) + pao(ctx, 'regueifa', 300, 352, 1.15, 8),
  // MERCEARIA
  'azeite-virgem-extra': (ctx) => {
    let s = sombra(ctx, 300, 382, 220) + garrafa(ctx, 240, 380);
    s += `<ellipse cx="410" cy="360" rx="86" ry="26" fill="#E7DCC6" stroke="${C.ink}" stroke-width="2.6"/><ellipse cx="410" cy="356" rx="62" ry="16" fill="#C7B24A" stroke="${C.ink}" stroke-width="1.6"/><ellipse cx="392" cy="352" rx="18" ry="5" fill="${C.ivory}" opacity="0.6"/>`;
    s += [[456, 336, '#4A4A30'], [474, 350, '#6E7A2E'], [440, 350, '#2E2A2A']].map(([x, y, c]) => `<ellipse cx="${x}" cy="${y}" rx="14" ry="10" fill="${c}" stroke="${C.ink}" stroke-width="1.6"/><ellipse cx="${x - 4}" cy="${y - 3}" rx="3" ry="2" fill="${C.ivory}" opacity="0.6"/>`).join('');
    s += `<path d="M330 300q40 -30 90 -22" ${S(2.4, '#6E6A44')}/>` + [[350, 288, -60], [376, 280, -40], [400, 278, -70], [362, 300, 30], [390, 290, 40]].map(([x, y, a]) => `<path d="M0 0c6 -6 20 -6 30 0c-10 6 -24 6 -30 0z" fill="#8E9A6E" stroke="${C.ink}" stroke-width="1.2" transform="translate(${x} ${y}) rotate(${a})"/>`).join('');
    return s;
  },
  'mel-multifloral': (ctx) => {
    let s = sombra(ctx, 300, 384, 200) + frasco(ctx, 270, 380, 190, 250, { cor: '#D9922B', escura: '#A9661A', tampa: 'pano', nivel: 0.93 });
    s += `<g transform="translate(420 300) rotate(28)"><rect x="-6" y="-150" width="12" height="150" rx="6" fill="#B98A5A" stroke="${C.ink}" stroke-width="2"/><g transform="translate(0 0)">${[0, 1, 2, 3].map((i) => `<ellipse cx="0" cy="${-6 + i * 12}" rx="${18 - i * 2}" ry="7" fill="#C99A64" stroke="${C.ink}" stroke-width="1.6"/>`).join('')}</g><path d="M0 40q4 18 -2 34" ${S(5, '#D9922B')}/></g>`;
    return s;
  },
  'grao-de-bico-seco': (ctx) => sombra(ctx, 300, 384, 220) + saco(ctx, 270, 380, 230, 210, graos('grao'), 3) + espalhar('grao', 450, 372, 110, 14, 4),
  'feijao-frade': (ctx) => sombra(ctx, 300, 384, 220) + saco(ctx, 270, 380, 230, 210, graos('frade'), 5) + espalhar('frade', 450, 372, 110, 18, 6),
  'feijao-manteiga': (ctx) => sombra(ctx, 300, 384, 220) + saco(ctx, 270, 380, 230, 210, graos('manteiga'), 7) + espalhar('manteiga', 450, 370, 120, 8, 8),
  'arroz-carolino': (ctx) => sombra(ctx, 300, 384, 220) + saco(ctx, 270, 380, 230, 220, graos('arroz'), 9) + espalhar('arroz', 450, 374, 130, 90, 10),
  'farinha-de-milho': (ctx) => {
    let s = sombra(ctx, 300, 384, 220) + saco(ctx, 260, 380, 230, 210, graos('milho'), 11);
    s += `<g transform="translate(450 352) rotate(-18)"><path d="M-60 -14C-60 -40 30 -44 40 -16L40 14C30 30 -60 30 -60 14Z" fill="#B98A5A" stroke="${C.ink}" stroke-width="2.4"/><path d="M-56 -10C-40 -30 20 -30 36 -12" fill="#E9C459" stroke="${C.ink}" stroke-width="1.6"/><rect x="40" y="-7" width="70" height="14" rx="7" fill="#B98A5A" stroke="${C.ink}" stroke-width="2.2"/></g>`;
    return s;
  },
  'amendoa-com-pele': (ctx) => {
    let s = sombra(ctx, 300, 378, 220);
    const r = rng(12);
    for (let i = 0; i < 34; i++) {
      const x = 300 + (r() - 0.5) * 340 * (1 - i / 60), y = 360 - Math.pow(r(), 0.7) * 140 * (1 - Math.abs(x - 300) / 220);
      s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r() * 360)})">${corpo(ctx, [[0, -22], [9, -12], [11, 4], [6, 16], [0, 19], [-6, 16], [-11, 4], [-9, -12]], '#A06E46', '#6B472C', { brilho: 0.25, hachura: false, w: 1.6 })}<path d="M-4 -12q2 12 0 22M3 -12q2 12 0 22" ${S(0.8)} opacity="0.5"/></g>`;
    }
    return s;
  },
  'nozes-em-casca': (ctx) => {
    let s = sombra(ctx, 300, 378, 220);
    const r = rng(13);
    [[210, 330], [290, 310], [370, 330], [250, 356], [330, 360], [410, 362], [170, 362], [300, 270]].forEach(([x, y], i) => {
      s += `<g transform="translate(${x} ${y}) rotate(${f(r() * 40 - 20)})">${corpo(ctx, lobado(0, 0, 40, 36, 9, 0.05, 30, i), '#BC955F', '#84653E', { brilho: 0.3, hachura: false, w: 2.2 })}<path d="M0 -36V36" ${S(2)}/><path d="M-26 -14q8 6 0 14q-8 8 2 16M18 -18q-8 8 2 14q8 10 -2 18" ${S(1.2)} opacity="0.55"/></g>`;
    });
    s += `<g transform="translate(470 356)"><ellipse rx="44" ry="28" fill="#84653E" stroke="${C.ink}" stroke-width="2.2"/><path d="M-30 -4c6 -16 22 -18 30 -4c8 -14 24 -12 30 4c-4 14 -20 18 -30 6c-10 12 -26 8 -30 -6z" fill="#D7B67E" stroke="${C.ink}" stroke-width="1.6"/></g>`;
    return s;
  },
  // CONSERVAS E DOCES
  'doce-de-abobora': (ctx) => sombra(ctx, 300, 384, 200) + frasco(ctx, 260, 380, 180, 230, { cor: '#E3892E', escura: '#B55F18', textura: Array.from({ length: 14 }, (_, i) => `<path d="M${180 + i * 12} 220q10 60 -4 150" ${S(1.6, '#F5B860')} opacity="0.7"/>`).join('') }) + `<path d="M380 360h120l-10 18h-100z" fill="#E7DCC6" stroke="${C.ink}" stroke-width="2"/><g transform="translate(440 346)">${corpo(ctx, [[-50, 0], [-40, -30], [40, -34], [52, 0]], '#EE9C3C', '#C27420', { brilho: 0.3, hachura: false, w: 2.2 })}</g>`,
  'compota-de-figo': (ctx) => sombra(ctx, 300, 384, 210) + frasco(ctx, 250, 380, 180, 230, { cor: '#5A2638', escura: '#33121F', textura: pontos(14, 80, [160, 160, 180, 220], [0.8, 1.6], '#E6C08A', 0.8) }) + fruta(ctx, 'figo', 410, 316, 52, 1) + metade(ctx, 'figo', 470, 360, 46),
  marmelada: (ctx) => {
    let s = sombra(ctx, 300, 382, 230);
    s += `<path d="${poly([[90, 370], [500, 370], [520, 390], [80, 392]])}" fill="${C.ivory}" stroke="${C.ink}" stroke-width="2"/>`;
    s += `<path d="${poly([[130, 240], [370, 230], [430, 262], [190, 274]])}" fill="#C65E36" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
    s += `<path d="${poly([[190, 274], [430, 262], [430, 352], [190, 366]])}" fill="#A6472A" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/><path d="${poly([[130, 240], [190, 274], [190, 366], [130, 330]])}" fill="#8A3820" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
    s += hatched(ctx, poly([[130, 240], [190, 274], [190, 366], [130, 330]]), { angle: 80, gap: 5, opacity: 0.4 }) + `<rect x="200" y="290" width="120" height="8" rx="4" fill="${C.ivory}" opacity="0.4"/>`;
    s += `<g transform="translate(470 372) rotate(-10)"><path d="M-40 0L-30 -70L22 -74L30 -4Z" fill="#B44F2E" stroke="${C.ink}" stroke-width="2.4"/><path d="M-30 -70L22 -74L28 -84L-24 -80Z" fill="#CF6A40" stroke="${C.ink}" stroke-width="2"/></g>`;
    return s;
  },
  'doce-de-tomate': (ctx) => sombra(ctx, 300, 384, 210) + frasco(ctx, 250, 380, 180, 230, { cor: '#C9522E', escura: '#8F3218', textura: pontos(15, 30, [160, 170, 180, 200], [2, 4], '#E07A4A', 0.6) }) + fruta(ctx, 'tomate-cb', 430, 336, 52, 4),
  'compota-de-ameixa': (ctx) => sombra(ctx, 300, 384, 210) + frasco(ctx, 250, 380, 180, 230, { cor: '#4E2244', escura: '#2E1028', textura: pontos(16, 18, [160, 170, 180, 200], [4, 8], '#7A3A62', 0.6) }) + fruta(ctx, 'ameixa', 420, 330, 46, 1) + fruta(ctx, 'ameixa', 470, 352, 40, 2),
  'pera-em-calda': (ctx) => {
    let tex = '';
    [[230, 240, -20], [280, 300, 15], [226, 336, -10], [282, 200, 20]].forEach(([x, y, a]) => { tex += `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 -40C14 -38 18 -20 26 0C34 24 18 38 0 38C-18 38 -34 24 -26 0C-18 -20 -14 -38 0 -40Z" fill="#EDE3A6" stroke="${C.ink}" stroke-width="1.6"/><ellipse cx="0" cy="12" rx="9" ry="12" fill="#D8C67A"/></g>`; });
    return sombra(ctx, 300, 384, 200) + frasco(ctx, 255, 380, 170, 290, { cor: '#D9B455', escura: '#B08A2E', tampa: 'metal', textura: tex, rotulo: false }) + `<g transform="translate(420 366) rotate(-20)"><rect x="-60" y="-8" width="120" height="16" rx="8" fill="#8A5A3A" stroke="${C.ink}" stroke-width="2"/><path d="M-56 -2h112" ${S(1.2, '#C9946A')}/></g>`;
  },
  'tomate-seco-em-azeite': (ctx) => {
    const r = rng(18); let tex = '';
    for (let i = 0; i < 14; i++) { const x = 190 + r() * 130, y = 190 + r() * 180; tex += `<path d="${smooth(oval(x, y, 18 + r() * 8, 10 + r() * 6, 10, 0.4, i))}" fill="#9A3222" stroke="${C.ink}" stroke-width="1.2" transform="rotate(${f(r() * 90)} ${f(x)} ${f(y)})"/>`; }
    tex += `<path d="M200 300q40 -40 60 -100M290 360q-10 -60 20 -140" ${S(2.4, '#4E6B2E')}/>`;
    return sombra(ctx, 300, 384, 200) + frasco(ctx, 255, 380, 170, 250, { cor: '#CDAE3E', escura: '#9C8424', tampa: 'metal', textura: tex, nivel: 0.95 }) + `<g transform="translate(420 350)"><path d="M-30 20c-10 -30 30 -50 50 -30c20 20 -10 50 -50 30z" fill="#9A3222" stroke="${C.ink}" stroke-width="2"/></g>`;
  },
  'pepino-em-conserva': (ctx) => {
    let tex = '';
    [190, 222, 254, 286, 318].forEach((x, i) => { tex += `<g transform="translate(${x} ${300 - (i % 2) * 20}) rotate(${(i % 2 ? 6 : -4)})">${corpo(ctx, [[0, -80], [14, -64], [16, 40], [0, 66], [-16, 40], [-14, -64]], '#6B8A3A', '#43602A', { brilho: 0.3, hachura: false, w: 1.6 })}${pontos(40 + i, 8, [-12, -70, 24, 120], [1, 2], '#3A5222', 0.8)}</g>`; });
    tex += `<path d="M200 180q20 30 10 60M300 170q-20 40 0 70" ${S(1.6, '#5E7A40')}/>` + pontos(19, 20, [180, 320, 150, 40], [1.6, 2.6], '#D9B84A', 1);
    return sombra(ctx, 300, 384, 200) + frasco(ctx, 255, 380, 180, 260, { cor: '#DCD8A6', escura: '#B8B37A', tampa: 'metal', textura: tex, rotulo: false }) + `<g transform="translate(430 340)">${corpo(ctx, [[-50, -6], [-36, -18], [40, -16], [52, -4], [40, 10], [-36, 12]], '#6B8A3A', '#43602A', { brilho: 0.3, hachura: false, w: 2 })}</g>`;
  },
  'pasta-de-azeitona': (ctx) => sombra(ctx, 300, 382, 200) + frasco(ctx, 250, 380, 190, 150, { cor: '#3E392A', escura: '#24211A', tampa: 'metal', textura: pontos(20, 40, [160, 260, 180, 120], [1, 3], '#6A6248', 0.6) }) + [[400, 360, '#2A2626'], [440, 350, '#3E3A2A'], [470, 366, '#6E7A2E'], [420, 330, '#2A2626']].map(([x, y, c]) => `<ellipse cx="${x}" cy="${y}" rx="22" ry="15" fill="${c}" stroke="${C.ink}" stroke-width="2"/><ellipse cx="${x - 7}" cy="${y - 5}" rx="5" ry="3" fill="${C.ivory}" opacity="0.6"/>`).join(''),
  // OVOS E LACTICÍNIOS
  'ovos-de-galinha': (ctx) => sombra(ctx, 300, 392, 220) + caixaOvos(ctx, 300, 330, 3, 2, 110, '#D9A87C', '#A6764C'),
  'ovos-de-codorniz': (ctx) => sombra(ctx, 300, 392, 230) + caixaOvos(ctx, 300, 330, 6, 3, 64, '#ECE2CE', '#B9AD92', 14, 21),
  'queijo-fresco-de-vaca': (ctx) => {
    let s = sombra(ctx, 300, 384, 200) + `<ellipse cx="300" cy="360" rx="190" ry="40" fill="#E7DCC6" stroke="${C.ink}" stroke-width="2.6"/>`;
    s += cilindro(ctx, 300, 346, 120, 36, 110, '#FBF8F0', '#F1ECDD', '#D9D2BE', { textura: `<path d="${Array.from({ length: 24 }, (_, i) => `M${180 + i * 10} 236v120`).join('')}" ${S(1, '#C9C0A8')}/>` });
    return s + `<ellipse cx="270" cy="232" rx="40" ry="10" fill="${C.ivory}" opacity="0.8"/>`;
  },
  'queijo-de-cabra-curado': (ctx) => {
    let s = sombra(ctx, 300, 384, 210);
    s += cilindro(ctx, 260, 360, 140, 44, 110, '#E6DFCB', '#DCD3BA', '#B8AE92', { textura: pontos(21, 80, [120, 240, 280, 160], [1.4, 3.6], '#A49A82', 0.5) });
    s += `<path d="M260 250L400 250A140 44 0 0 1 380 272Z" fill="#F7F2E2"/>`;
    s += `<g transform="translate(450 370)"><path d="M-70 0L60 -20L60 -90L-70 -70Z" fill="#F7F2E2" stroke="${C.ink}" stroke-width="2.4"/><path d="M-70 -70L60 -90L40 -104L-80 -84Z" fill="#DCD3BA" stroke="${C.ink}" stroke-width="2.4"/>${pontos(22, 10, [-60, -66, 110, 56], [1.6, 3], '#E2D9BF', 1)}</g>`;
    return s;
  },
  'queijo-de-ovelha-amanteigado': (ctx) => {
    let s = sombra(ctx, 300, 386, 220);
    s += cilindro(ctx, 280, 370, 170, 54, 80, '#F2E2AE', '#E8D18E', '#C7AC66', { textura: `<rect x="110" y="300" width="340" height="40" fill="${C.ivory}" opacity="0.9"/><path d="M110 306h340M110 334h340" ${S(1.2)} opacity="0.5"/>` });
    s += `<ellipse cx="280" cy="290" rx="128" ry="38" fill="#F6E5AE" stroke="${C.ink}" stroke-width="2"/><path d="M200 290q40 -20 80 0t80 -4" ${S(2.2, '#E6C778')}/><ellipse cx="250" cy="282" rx="30" ry="8" fill="${C.ivory}" opacity="0.7"/>`;
    s += `<g transform="translate(470 256) rotate(-12)"><ellipse rx="70" ry="22" fill="#E8D18E" stroke="${C.ink}" stroke-width="2.4"/><ellipse rx="54" ry="14" fill="#F6E5AE"/></g>`;
    s += `<g transform="translate(330 290) rotate(-40)"><ellipse cx="0" cy="0" rx="18" ry="11" fill="#D9D6CC" stroke="${C.ink}" stroke-width="2"/><rect x="14" y="-4" width="110" height="8" rx="4" fill="#D9D6CC" stroke="${C.ink}" stroke-width="2"/></g>`;
    return s;
  },
  requeijao: (ctx) => {
    let s = sombra(ctx, 300, 384, 190);
    let vime = '';
    for (let j = 0; j < 7; j++) for (let i = 0; i < 18; i++) vime += `<ellipse cx="${180 + i * 14 + (j % 2) * 7}" cy="${260 + j * 15}" rx="6" ry="5" fill="none" stroke="#8A6A3A" stroke-width="1.6"/>`;
    s += cilindro(ctx, 300, 362, 130, 40, 110, '#FBF8EE', '#C9A56A', '#8E6E3E', { textura: vime });
    s += `<path d="M180 252C200 210 400 210 420 252" fill="#FBF8EE" stroke="${C.ink}" stroke-width="2.2"/>` + pontos(23, 60, [190, 226, 220, 40], [1.4, 3], '#E6E0CE', 1);
    return s;
  },
  'iogurte-natural': (ctx) => sombra(ctx, 300, 384, 170) + frasco(ctx, 300, 380, 200, 210, { cor: '#FBFAF4', escura: '#E6E2D2', tampa: 'pano' }),
  'iogurte-de-ovelha': (ctx) => sombra(ctx, 300, 384, 170) + frasco(ctx, 290, 380, 200, 190, { cor: '#F8F1DC', escura: '#E2D6B6', tampa: 'nenhuma', nivel: 0.82 }) + `<g transform="translate(330 200) rotate(24)"><rect x="-7" y="-130" width="14" height="150" rx="7" fill="#B98A5A" stroke="${C.ink}" stroke-width="2"/><ellipse cx="0" cy="24" rx="16" ry="22" fill="#B98A5A" stroke="${C.ink}" stroke-width="2"/></g>`,
  'manteiga-com-sal': (ctx) => {
    let s = sombra(ctx, 300, 384, 220);
    s += `<path d="${poly([[80, 360], [300, 300], [530, 340], [320, 410]])}" fill="${C.ivory}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/><path d="M190 330l200 50M300 300l20 110" ${S(1.2)} opacity="0.35"/>`;
    s += `<path d="${poly([[170, 300], [330, 270], [420, 300], [260, 334]])}" fill="#F6E19A" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="${poly([[170, 300], [260, 334], [260, 380], [170, 344]])}" fill="#E8CC72" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="${poly([[260, 334], [420, 300], [420, 344], [260, 380]])}" fill="#DDBD5E" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
    s += `<g transform="translate(470 348)"><path d="${poly([[-20, -30], [20, -36], [24, 4], [-16, 10]])}" fill="#F6E19A" stroke="${C.ink}" stroke-width="2"/></g>` + pontos(24, 14, [190, 278, 200, 30], [1, 2], C.ivory, 0.9);
    return s;
  },
};

/* ───────── cabazes compostos: caixa com miniaturas dos artigos ───────── */
export function caixaCom(ctx, ids, { detail = true, label = true } = {}) {
  const bx = P.box(ctx, { O: [120, 390], u: [330, 34], v: [0, -96], w: [140, -78], detail, label });
  const n = ids.length;
  const tras = ids.slice(0, Math.ceil(n / 2)), frente = ids.slice(Math.ceil(n / 2));
  let s = sombra(ctx, 320, 404, 250) + bx.back;
  const fila = (lista, y, k, x0, x1) => lista.map((id, i) => {
    const x = lista.length === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (lista.length - 1);
    return g(DESENHOS[id](ctx), x - 300 * k, y - 360 * k, k);
  }).join('');
  s += fila(tras, 268, 0.4, 230, 440) + fila(frente, 318, 0.42, 170, 400);
  return s + bx.front;
}

// Utilitários partilhados pelo gerador de ilustrações.
// Paleta, caminhos suaves, sementes aleatórias reprodutíveis e “definições” SVG (clips, máscaras, texturas).

export const C = {
  ink: '#243E2B',        // verde-floresta: contornos e tinta principal
  terra: '#BC7958',      // terracota: tijolo, chama, crosta, raízes
  cream: '#F4F0E4',      // creme: papel / fundo das ilustrações
  ivory: '#FFFCF5',      // marfim: luzes
  // Retículas e sobreposições das duas tintas sobre o papel claro
  kraft: '#D6B899',
  kraftDark: '#BC9B7C',
  kraftLight: '#E8D4BC',
  crustDark: '#93593F',
  crumb: '#F3E4CC',
  broa: '#D9A87E',
  broaDark: '#B98159',
  leafLight: '#4C6652',
  soil: '#CFA185',
  soilDark: '#A87458',
  paperShade: '#E9E0CC',
  stone: '#EDE6D5',
  stoneDark: '#DDD3BD',
};

export const f = (n) => (Math.round(n * 10) / 10).toString();

/** Caminho suave (Catmull-Rom → Bézier cúbica) através de pontos. */
export function smooth(pts, closed = true, t = 1) {
  const n = pts.length;
  const get = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * t, p1[1] + ((p2[1] - p0[1]) / 6) * t];
    const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * t, p2[1] - ((p3[1] - p1[1]) / 6) * t];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}

export const poly = (pts) => 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z';
export const line = (pts) => 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L');

/** Gerador pseudo-aleatório com semente (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const mul = (a, k) => [a[0] * k, a[1] * k];
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Contexto de um ficheiro SVG: acumula <defs> com ids únicos. */
export class Ctx {
  constructor(prefix) {
    this.prefix = prefix;
    this.n = 0;
    this.defs = [];
  }
  id(k = 'i') {
    this.n += 1;
    return `${this.prefix}-${k}${this.n}`;
  }
  /** Guarda um caminho em <defs> (uma vez) e devolve o id, para ser reutilizado com <use>. */
  shape(d) {
    this.shapes = this.shapes || new Map();
    if (this.shapes.has(d)) return this.shapes.get(d);
    const id = this.id('p');
    this.defs.push(`<path id="${id}" d="${d}"/>`);
    this.shapes.set(d, id);
    return id;
  }
  clip(d) {
    this.clips = this.clips || new Map();
    if (this.clips.has(d)) return this.clips.get(d);
    const id = this.id('c');
    this.defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
    this.clips.set(d, id);
    return id;
  }
  /** Máscara em degradê para que os traços de volume se dissolvam do lado da luz. */
  fade(x, y, w, h, dir = 'right', from = 0, to = 1) {
    const id = this.id('m');
    const g = this.id('g');
    const v = { right: 'x1="0" y1="0" x2="1" y2="0"', left: 'x1="1" y1="0" x2="0" y2="0"', down: 'x1="0" y1="0" x2="0" y2="1"', up: 'x1="0" y1="1" x2="0" y2="0"' }[dir];
    this.defs.push(
      `<linearGradient id="${g}" ${v}><stop offset="${from}" stop-color="#fff" stop-opacity="0"/><stop offset="${to}" stop-color="#fff" stop-opacity="1"/></linearGradient>` +
        `<mask id="${id}" maskUnits="userSpaceOnUse" x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"><rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="url(#${g})"/></mask>`
    );
    return id;
  }
  /** Tracejado diagonal de sombra (retícula de linhas). */
  hatch(angle = 45, gap = 6, width = 1.2, color = C.ink) {
    const id = this.id('h');
    this.defs.push(
      `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${gap}" height="${gap}" patternTransform="rotate(${angle})"><line x1="0" y1="0" x2="0" y2="${gap}" stroke="${color}" stroke-width="${width}"/></pattern>`
    );
    return id;
  }
  /** Textura de impressão: contorno de tinta ligeiramente irregular + grão subtil
   *  aplicado só onde há desenho (nunca fora da imagem). */
  textures(grain = 0.3) {
    const ink = `${this.prefix}-tinta`;
    this.defs.push(
      `<filter id="${ink}" x="-2%" y="-2%" width="104%" height="104%" color-interpolation-filters="sRGB">` +
        `<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n"/>` +
        `<feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="d"/>` +
        `<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" result="g"/>` +
        `<feColorMatrix in="g" values="0 0 0 0 0.14  0 0 0 0 0.24  0 0 0 0 0.17  0 0 0 -1.6 0.9" result="gc"/>` +
        `<feComposite in="gc" in2="d" operator="in" result="gm"/>` +
        `<feComponentTransfer in="gm" result="gs"><feFuncA type="linear" slope="${grain}"/></feComponentTransfer>` +
        `<feMerge><feMergeNode in="d"/><feMergeNode in="gs"/></feMerge></filter>`
    );
    return { ink };
  }
  render() {
    return this.defs.length ? `<defs>${this.defs.join('')}</defs>` : '';
  }
}

/** Linhas interiores que acompanham o volume: cópias reduzidas do contorno, recortadas pela forma
 *  e esbatidas do lado da luz. */
export function volume(ctx, d, { cx, cy, steps = [0.9, 0.8, 0.7], width = 1.6, color = C.ink, opacity = 0.75, box, dir = 'right', from = 0.35, to = 0.95 }) {
  const pid = ctx.shape(d);
  const cid = ctx.id('c');
  ctx.defs.push(`<clipPath id="${cid}"><use href="#${pid}"/></clipPath>`);
  const mid = box ? ctx.fade(box[0], box[1], box[2], box[3], dir, from, to) : null;
  const w = width * 0.72;
  const lines = steps
    .map((k) => `<use href="#${pid}" transform="translate(${f(cx)} ${f(cy)}) scale(${k}) translate(${f(-cx)} ${f(-cy)})" stroke-width="${f(w / k)}"/>`)
    .join('');
  return `<g clip-path="url(#${cid})" opacity="${f(opacity * 0.8)}" fill="none" stroke="${color}" stroke-linecap="round"${mid ? ` mask="url(#${mid})"` : ''}>${lines}</g>`;
}

/** Sombra rendada (forma preenchida com tracejado). */
export function hatched(ctx, d, { angle = 45, gap = 6, width = 1.2, opacity = 0.55, color = C.ink } = {}) {
  const h = ctx.hatch(angle, gap, width, color);
  return `<path d="${d}" fill="url(#${h})" opacity="${opacity}"/>`;
}

export function svgDoc({ w, h, vb, title, body, ctx, decorative = false }) {
  const viewBox = vb || `0 0 ${w} ${h}`;
  const a11y = decorative ? 'aria-hidden="true"' : `role="img" aria-labelledby="t"`;
  const t = decorative ? '' : `<title id="t">${title}</title>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}" ${a11y}>${t}${ctx.render()}${body}</svg>\n`;
}

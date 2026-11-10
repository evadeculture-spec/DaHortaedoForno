// Cenas da loja: banca panorâmica, naturezas-mortas, coleção, produtos, vinhetas, pratos e cabaz.
import { writeFileSync, mkdirSync } from 'node:fs';
import { C, Ctx, f, poly, smooth, line, svgDoc, hatched, rng, lerp } from './lib.mjs';
import * as P from './parts.mjs';
import { DESENHOS, S, sombra, semSombra, corpo, oval, fruta, caixaCom, molho } from './produtos.mjs';
import { PRODUTOS, PRODUTORES, RECEITAS } from '../../js/dados/catalogo.js';

const g = P.place;
const ILU = new URL('../../assets/ilustracoes/', import.meta.url);
const PROD = new URL('../../assets/produtos/', import.meta.url);
mkdirSync(PROD, { recursive: true });
const escrever = (base, nome, svg) => { writeFileSync(new URL(nome, base), svg); return svg.length; };
const tinta = (ctx, body) => { const t = ctx.textures(0.28); return `<g filter="url(#${t.ink})">${body}</g>`; };
/** Coloca um desenho de produto (quadro 600×450, base em ~(300,360)) com a base em (x, y). */
const item = (ctx, id, x, y, k) => g(DESENHOS[id](ctx), x - 300 * k, y - 360 * k, k);
const itens = (ctx, lista) => semSombra(() => lista.map(([id, x, y, k]) => item(ctx, id, x, y, k)).join(''));

/* ═════════ produtos (72) ═════════ */
export function produtos(cabazScene) {
  let total = 0;
  for (const p of PRODUTOS) {
    const ctx = new Ctx('p' + p.id.replace(/[^a-z]/g, '').slice(0, 10));
    let body;
    if (p.id === 'cabaz-pao-e-horta') {
      body = g(cabazScene(ctx, { withSetting: false, contents: p.id === 'cabaz-da-horta' ? 'horta' : 'misto' }), 0, 0, 1);
      const vb = p.id === 'cabaz-da-horta' ? '40 230 880 660' : '40 200 880 660';
      total += escrever(PROD, p.id + '.svg', svgDoc({ w: 600, h: 450, vb, title: p.alt, ctx, body: tinta(ctx, sombra(ctx, 520, 700, 340, 30) + body) }));
      continue;
    }
    body = p.composicao ? caixaCom(ctx, p.composicao.map(([id]) => id)) : DESENHOS[p.id](ctx);
    total += escrever(PROD, p.id + '.svg', svgDoc({ w: 600, h: 450, title: p.alt, ctx, body: tinta(ctx, body) }));
  }
  console.log(`produtos: ${PRODUTOS.length} ficheiros, ${(total / 1024).toFixed(0)} KB`);
}

/* ═════════ naturezas-mortas das bancas e coleção (640×400, recortadas sobre creme) ═════════ */
const COMPOSICOES = {
  horticolas: [['couve-portuguesa', 340, 300, 0.58], ['abobora-manteiga', 200, 350, 0.62], ['beterraba', 470, 380, 0.5], ['cenouras-com-rama', 330, 392, 0.56]],
  fruta: [['pera-rocha', 230, 316, 0.62], ['laranja', 420, 322, 0.58], ['roma', 320, 380, 0.56], ['maca-bravo-de-esmolfe', 170, 392, 0.5]],
  'ervas-aromaticas': [['alecrim', 330, 300, 0.7], ['manjericao', 300, 352, 0.66], ['coentros', 360, 400, 0.66]],
  padaria: [['pao-de-centeio', 360, 300, 0.6], ['pao-fermentacao-lenta', 230, 340, 0.62], ['broa-de-milho', 410, 392, 0.58], ['carcacas-de-trigo', 170, 398, 0.46]],
  mercearia: [['azeite-virgem-extra', 230, 360, 0.62], ['mel-multifloral', 400, 360, 0.56], ['grao-de-bico-seco', 300, 404, 0.5]],
  'conservas-e-doces': [['compota-de-figo', 230, 360, 0.6], ['pepino-em-conserva', 390, 350, 0.56], ['marmelada', 320, 404, 0.56]],
  'ovos-e-lacticinios': [['ovos-de-galinha', 230, 340, 0.6], ['queijo-de-cabra-curado', 420, 360, 0.56], ['manteiga-com-sal', 300, 410, 0.5]],
};
export function naturezas(cabazScene) {
  for (const [id, lista] of Object.entries(COMPOSICOES)) {
    const ctx = new Ctx('nm' + id.slice(0, 6));
    const body = sombra(ctx, 320, 384, 250, 18) + itens(ctx, lista);
    escrever(ILU, `banca-${id}.svg`, svgDoc({ w: 640, h: 400, vb: '50 140 540 338', title: '', decorative: true, ctx, body: tinta(ctx, body) }));
  }
  const ctx = new Ctx('nmcab');
  escrever(ILU, 'banca-cabazes.svg', svgDoc({ w: 640, h: 400, vb: '60 200 860 540', title: '', decorative: true, ctx, body: tinta(ctx, sombra(ctx, 520, 700, 340, 30) + cabazScene(ctx, { withSetting: false, contents: 'misto' })) }));
  const co = new Ctx('outono');
  const lista = [['abobora-manteiga', 220, 330, 0.62], ['marmelo', 420, 316, 0.5], ['roma', 330, 378, 0.52], ['diospiro', 470, 392, 0.46], ['nozes-em-casca', 170, 400, 0.44]];
  escrever(ILU, 'colecao-outono.svg', svgDoc({ w: 640, h: 400, vb: '50 140 540 338', title: 'Abóbora-manteiga, romã aberta, dióspiros, marmelos e nozes.', ctx: co, body: tinta(co, sombra(co, 320, 390, 250, 18) + itens(co, lista)) }));
  console.log('naturezas-mortas: 8 bancas + coleção de outono');
}

/* ═════════ caixas rasas de madeira ═════════ */
function caixote(ctx, x, y, w, h, d, conteudo) {
  const FL = [x, y], FR = [x + w, y + w * 0.06], BR = [x + w + d * 0.8, y + w * 0.06 - d * 0.5], BL = [x + d * 0.8, y - d * 0.5];
  const sub = (p, k) => [p[0], p[1] - k];
  let s = `<path d="${poly([sub(BL, h), sub(BR, h), BR, BL])}" fill="#C79A63" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<path d="${poly([sub(FL, h), sub(BL, h), BL, FL])}" fill="#A87C48" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += conteudo;
  s += `<path d="${poly([sub(FL, h), sub(FR, h), FR, FL])}" fill="#D3A86E" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  s += `<path d="${line([lerp(sub(FL, h), FL, 0.5), lerp(sub(FR, h), FR, 0.5)])}" ${S(5, '#8E6436')} opacity="0.9"/><path d="${line([lerp(sub(FL, h), FL, 0.5), lerp(sub(FR, h), FR, 0.5)])}" ${S(1.2)}/>`;
  s += `<path d="${poly([sub(FR, h), sub(BR, h), BR, FR])}" fill="#A87C48" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
  s += hatched(ctx, poly([sub(FR, h), sub(BR, h), BR, FR]), { angle: 70, gap: 5, opacity: 0.4 });
  return s;
}

/* ═════════ A. banca panorâmica (1400×760): o forno é o protagonista, a banca fica à frente ═════════ */
export function panorama() {
  const ctx = new Ctx('banca');
  let s = '';
  // plano de fundo: parede, azulejos, arco do forno e prateleiras
  s += P.tiles(ctx, { x: 1090, y: 312, w: 320, h: 138, size: 46 });
  s += `<path d="M1090 312H1400" ${S(2)}/>`;
  s += g(P.ovenArch(ctx, { r: 188 }), 760, 448, 1);
  // prateleiras de madeira à esquerda
  const tabua = (y) => `<path d="${poly([[30, y], [410, y], [420, y + 16], [24, y + 16]])}" fill="#B98A57" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="M40 ${y + 8}H404" ${S(1.2, '#7E5A30')} opacity="0.7"/><path d="M60 ${y + 16}v26l18 -26M380 ${y + 16}v26l-18 -26" ${S(3, '#7E5A30')}/>`;
  s += tabua(290) + tabua(440);
  s += semSombra(() => [['pao-de-centeio', 130, 288, 0.36], ['pao-fermentacao-lenta', 250, 286, 0.34], ['pao-de-mistura', 350, 288, 0.32], ['regueifa', 120, 438, 0.32], ['pao-de-alfarroba', 230, 438, 0.32], ['fogaca', 330, 438, 0.3]].map(([id, x, y, k]) => item(ctx, id, x, y, k)).join(''));
  // bancada de pedra (tudo o que está pousado nela desce 120 px em relação ao desenho original)
  s += '<g transform="translate(0 120)">';
  const mid = ctx.id('fs'), gid = ctx.id('fg');
  ctx.defs.push(`<linearGradient id="${gid}" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.07" stop-color="#fff"/><stop offset="1" stop-color="#fff"/></linearGradient><mask id="${mid}" maskUnits="userSpaceOnUse" x="0" y="380" width="1400" height="260"><rect x="0" y="380" width="1400" height="260" fill="url(#${gid})"/></mask>`);
  s += `<g mask="url(#${mid})"><path d="M0 392H1400V600H0Z" fill="${C.stone}"/><path d="M0 600H1400V632H0Z" fill="${C.stoneDark}"/><path d="M0 392H1400M0 600H1400M0 632H1400" ${S(2.6)}/>${hatched(ctx, 'M0 600H1400V632H0Z', { angle: 90, gap: 5, opacity: 0.25 })}</g>`;
  s += `<path d="M80 450C200 480 300 470 380 520M900 580C1000 560 1100 570 1200 540" ${S(1, C.ink)} opacity="0.25"/>`;
  // plano médio: broa cortada, caixas de fruta, cenouras, couve, caixa kraft
  s += sombra(ctx, 220, 560, 170, 16) + semSombra(() => item(ctx, 'broa-de-milho', 210, 560, 0.62));
  const frutasA = semSombra(() => [['pera', 540, 452, 30], ['pera', 600, 448, 32], ['pera', 660, 452, 30], ['pera', 570, 474, 31], ['pera', 632, 476, 32]].map(([t, x, y, r], i) => fruta(ctx, t, x, y + r * 1.9, r * 0.75, i + 1)).join(''));
  const frutasB = semSombra(() => [['laranja', 770, 452, 30], ['laranja', 830, 448, 31], ['clementina', 890, 456, 27], ['laranja', 800, 482, 31], ['clementina', 862, 486, 27], ['roma', 920, 482, 28]].map(([t, x, y, r], i) => fruta(ctx, t, x, y, r, i + 3)).join(''));
  s += sombra(ctx, 640, 548, 150, 14) + caixote(ctx, 500, 534, 230, 52, 120, frutasA);
  s += sombra(ctx, 860, 556, 150, 14) + caixote(ctx, 730, 540, 230, 52, 120, frutasB);
  s += semSombra(() => g(P.couve(ctx, { seed: 38 }), 1000, 470, 0.62, 18));
  const bx = P.box(ctx, { O: [1010, 590], u: [300, 32], v: [0, -96], w: [120, -80] });
  s += hatched(ctx, poly([bx.pts.FRb, bx.pts.BRb, [1400, 540], [1330, 630]]), { angle: 45, gap: 5, opacity: 0.45 });
  s += bx.back + g(P.bagWithLoaf(ctx), 1150, 540, 0.6) + bx.front;
  s += semSombra(() => g(P.carrotBunch(ctx, { n: 4, seed: 61, ramaLen: 150, rootL: 120, spread: 10, stems: 3 }), 560, 584, 0.82, -88));
  // primeiro plano: pano, pá enfarinhada, migalhas, uma pera solta
  s += g(P.linen(ctx), 40, 590, 1.05, -4);
  s += g(P.peel(ctx, { len: 300, angle: 8 }), 300, 618, 0.8, -4) + `<g opacity="0.85">${[[250, 612], [262, 606], [276, 616], [292, 610], [240, 620]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${C.ivory}"/>`).join('')}</g>`;
  s += P.crumbs(83, 4, [380, 600, 160, 20]);
  s += semSombra(() => fruta(ctx, 'pera', 960, 616, 28, 9));
  s += '</g>';
  const body = tinta(ctx, s);
  const n = escrever(ILU, 'banca-mercado.svg', svgDoc({ w: 1400, h: 760, title: 'Banca de mercado: prateleiras com pães, broa cortada, caixas de peras e laranjas, cenouras, couve e a caixa kraft da marca, com o arco do forno ao fundo.', ctx, body }));
  console.log('banca panorâmica', (n / 1024).toFixed(0), 'KB');
}

/* ═════════ D. cabaz em três estados e camadas do configurador (900×640) ═════════ */
const GEO = { O: [110, 548], u: [520, 52], v: [0, -150], w: [170, -140] };
export function cabazEstados() {
  const fazer = (nome, conteudo, { fundo = true, frente = true, chao = true, extra = '' } = {}) => {
    const ctx = new Ctx(nome.replace(/[^a-z]/g, '').slice(0, 8));
    const bx = P.box(ctx, { ...GEO });
    let s = chao ? hatched(ctx, poly([bx.pts.FRb, bx.pts.BRb, [900, 470], [780, 620]]), { angle: 45, gap: 5, opacity: 0.45 }) : '';
    if (fundo) s += bx.back;
    s += conteudo(ctx);
    if (frente) s += bx.front;
    s += extra;
    escrever(ILU, nome + '.svg', svgDoc({ w: 900, h: 640, title: '', decorative: true, ctx, body: tinta(ctx, s) }));
  };
  fazer('cabaz-vazio', () => '');
  fazer('cabaz-composicao', (ctx) => itens(ctx, [['pao-fermentacao-lenta', 330, 372, 0.46], ['cenouras-com-rama', 520, 404, 0.46], ['ovos-de-galinha', 270, 462, 0.42], ['compota-de-figo', 600, 462, 0.4]]),
    { extra: '' });
  fazer('cabaz-completo', (ctx) => itens(ctx, [['pao-fermentacao-lenta', 300, 360, 0.44], ['couve-portuguesa', 520, 336, 0.4], ['laranja', 680, 392, 0.36], ['cenouras-com-rama', 420, 416, 0.42], ['azeite-virgem-extra', 220, 452, 0.34], ['ovos-de-galinha', 480, 474, 0.38], ['compota-de-figo', 640, 474, 0.34], ['queijo-de-cabra-curado', 340, 486, 0.34]]));
  fazer('caixa-fundo', () => '', { frente: false });
  fazer('caixa-frente', () => '', { fundo: false, chao: false });
  console.log('cabaz: vazio, composição, completo + camadas');
}

/* ═════════ C. vinhetas dos produtores (800×600) ═════════ */
const fundo = () => `<rect width="800" height="600" fill="${C.cream}"/>`;
const mesa = (ctx, y = 440) => `<path d="M-10 ${y}H810V610H-10Z" fill="#C9A16A"/><path d="${[0, 1, 2, 3].map((i) => `M-10 ${y + 40 + i * 42}H810`).join('')}" ${S(1.4, '#8E6436')} opacity="0.7"/>` + hatched(ctx, `M-10 ${y}H810V610H-10Z`, { angle: 4, gap: 9, width: 1, opacity: 0.25 }) + `<path d="M-10 ${y}H810" ${S(3)}/>`;
const colinas = (ctx) => `<path d="M-10 230C140 180 280 200 400 176C520 152 660 190 810 170V330H-10Z" fill="${C.paperShade}" stroke="${C.ink}" stroke-width="1.8"/>` + `<path d="${Array.from({ length: 12 }, (_, i) => { const x = 20 + i * 68; const y = 214 - Math.sin(i) * 12; return `M${x} ${y}a26 22 0 1 1 52 0a26 22 0 1 1 -52 0Z`; }).join('')}" fill="${C.ink}" opacity="0.85"/>`;
export function vinhetas() {
  const V = {
    'pomar-da-encosta': (ctx) => {
      let s = fundo() + colinas(ctx) + mesa(ctx, 470);
      s += `<path d="M-20 120C140 110 260 150 380 140C460 132 520 110 600 96" ${S(14, '#6E5236')}/><path d="M-20 120C140 110 260 150 380 140" ${S(2)}/>`;
      [[80, 118, -30], [160, 126, 40], [240, 136, -50], [320, 140, 30], [420, 132, -40], [500, 118, 20], [560, 104, -30]].forEach(([x, y, a]) => { s += `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0C14 -10 40 -12 60 0C40 12 14 10 0 0Z" fill="#4E7A35" stroke="${C.ink}" stroke-width="1.8"/></g>`; });
      s += semSombra(() => fruta(ctx, 'pera', 200, 260, 40, 1) + fruta(ctx, 'pera', 300, 270, 42, 2));
      s += `<path d="M200 128v34M300 138v32" ${S(3, '#5A4128')}/>`;
      s += g(P.fist(ctx, { armAngle: -30, armLen: 380 }), 440, 250, 1.05);
      s += semSombra(() => fruta(ctx, 'pera', 430, 300, 40, 3));
      s += caixote(ctx, 260, 560, 300, 70, 120, semSombra(() => [[300, 500], [350, 494], [400, 498], [450, 492], [500, 500]].map(([x, y], i) => fruta(ctx, 'pera', x, y + 28, 24, i + 4)).join('')));
      return s;
    },
    'ervas-da-courela': (ctx) => {
      let s = fundo() + `<path d="M-10 230H810V330H-10Z" fill="#C9A87A"/>` + Array.from({ length: 5 }, (_, i) => `<path d="M-10 ${244 + i * 18}H810" ${S(1.2)} opacity="0.4"/>`).join('') + `<path d="${Array.from({ length: 30 }, (_, i) => `M${10 + i * 27} ${236}q6 -20 14 0`).join('')}" fill="#4E7A35"/>` + mesa(ctx, 330);
      s += semSombra(() => g(molho(ctx, 'coentro', { seed: 3, len: 380, stems: 8, ox: 0, oy: 0 }), 230, 470, 1.1, -6));
      s += `<g transform="translate(210 380) scale(-1 1)">${P.fist(ctx, { armAngle: -70, armLen: 320 })}</g>` + g(P.fist(ctx, { armAngle: -60, armLen: 320 }), 290, 400, 1);
      s += `<path d="M230 430C260 440 300 460 330 520M250 440q-60 30 -40 90" ${S(4, C.terra)}/>`;
      return s;
    },
    'celeiro-da-varzea': (ctx) => {
      let s = fundo();
      [[90, 380, 130], [230, 360, 150], [380, 380, 130]].forEach(([x, y, w]) => { const d = smooth([[x - w / 2, y], [x - w / 2 - 10, y - 160], [x - w / 4, y - 200], [x + w / 4, y - 204], [x + w / 2 + 10, y - 160], [x + w / 2, y], [x, y + 10]]); s += `<path d="${d}" fill="#C7A775"/>` + `<g clip-path="url(#${ctx.clip(d)})"><path d="${d}" fill="url(#${ctx.hatch(45, 6, 1.2, '#8E6E40')})" opacity="0.5"/></g><path d="${d}" ${S(2.4)}/>`; });
      s += mesa(ctx, 420);
      s += semSombra(() => DESENHOS['grao-de-bico-seco'](ctx)).replace(/^/, `<g transform="translate(330 140) scale(0.9)">`) + '</g>';
      s += `<g transform="translate(560 170) rotate(-28)"><path d="M-70 -20C-70 -50 40 -54 50 -20L50 20C40 40 -70 40 -70 20Z" fill="#B98A5A" stroke="${C.ink}" stroke-width="2.6"/><rect x="50" y="-8" width="120" height="16" rx="8" fill="#B98A5A" stroke="${C.ink}" stroke-width="2.4"/></g>`;
      s += g(P.fist(ctx, { armAngle: -20, armLen: 300 }), 700, 120, 0.9, 62);
      s += Array.from({ length: 9 }, (_, i) => `<circle cx="${500 - i * 6}" cy="${230 + i * 14}" r="8" fill="#DDBB86" stroke="${C.ink}" stroke-width="1.4"/>`).join('');
      return s;
    },
    'lagar-do-freixo': (ctx) => {
      let s = fundo();
      for (let j = 0; j < 7; j++) for (let i = 0; i < 6; i++) s += `<path d="${smooth(oval(60 + i * 140 + (j % 2) * 70, 40 + j * 58, 62, 24, 12, 0.2, i + j * 6))}" fill="${j % 2 ? '#E2D8C2' : '#D9CEB6'}" stroke="${C.ink}" stroke-width="1.6"/>`;
      s += `<path d="M180 140H440V200H180Z" fill="#BDB29A" stroke="${C.ink}" stroke-width="2.6"/><path d="M380 170h120l20 14h-130z" fill="#A49A82" stroke="${C.ink}" stroke-width="2.4"/>`;
      s += `<path d="M512 186C520 240 512 300 514 370" ${S(10, '#B9A23A')}/><path d="M512 186C520 240 512 300 514 370" ${S(3, '#E3D27A')} opacity="0.8"/>`;
      s += `<path d="M-10 470H810V610H-10Z" fill="${C.stone}"/><path d="M-10 470H810" ${S(3)}/>`;
      s += g(semSombra(() => DESENHOS['azeite-virgem-extra'](ctx)), 240, 105, 1.05);
      s += `<g transform="translate(150 470)"><path d="M-100 0C-110 -60 110 -60 100 0C80 30 -80 30 -100 0Z" fill="#B98A57" stroke="${C.ink}" stroke-width="2.4"/>${[[-50, -30], [-20, -40], [10, -36], [40, -30], [-35, -18], [25, -16], [0, -24]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="16" ry="11" fill="${i % 3 ? '#3E3A2A' : '#6E7A2E'}" stroke="${C.ink}" stroke-width="1.6"/>`).join('')}</g>`;
      return s;
    },
    'cozinha-da-fonte': (ctx) => {
      let s = fundo() + P.tiles(ctx, { x: 0, y: 0, w: 800, h: 300, size: 52 }) + `<path d="M0 300H800" ${S(2.4)}/>` + mesa(ctx, 420);
      s += `<g transform="translate(220 400)"><path d="M-170 -150H170L150 10C140 30 -140 30 -150 10Z" fill="#B76A3E" stroke="${C.ink}" stroke-width="2.8"/><ellipse cx="0" cy="-150" rx="170" ry="36" fill="#7A2E2A" stroke="${C.ink}" stroke-width="2.8"/><ellipse cx="0" cy="-150" rx="150" ry="28" fill="#5A2638"/>${hatched(ctx, 'M60 -150H170L150 10C140 30 80 30 60 20Z', { angle: 80, gap: 5, opacity: 0.4 })}<path d="M-170 -140q-40 0 -50 20M170 -140q40 0 50 20" ${S(8, '#8E4E2C')}/></g>`;
      s += g(semSombra(() => DESENHOS['compota-de-figo'](ctx)), 400, 90, 0.9);
      s += `<g transform="translate(470 170) rotate(30)"><ellipse rx="40" ry="24" fill="#C9C2B0" stroke="${C.ink}" stroke-width="2.4"/><rect x="34" y="-6" width="200" height="12" rx="6" fill="#C9C2B0" stroke="${C.ink}" stroke-width="2.2"/></g><path d="M500 196q4 20 -8 46" ${S(9, '#5A2638')}/>`;
      s += g(P.fist(ctx, { armAngle: -10, armLen: 300 }), 690, 230, 0.85, 120);
      return s;
    },
    'queijaria-da-serra': (ctx) => {
      let s = fundo() + `<path d="M-10 230L140 120L260 190L420 70L560 170L700 110L810 160V330H-10Z" fill="${C.paperShade}" stroke="${C.ink}" stroke-width="1.8"/><path d="M380 100l40 -30 40 30-20 4-20 -12-20 12z" fill="${C.ivory}"/>` + mesa(ctx, 400);
      let furos = '';
      for (let j = 0; j < 4; j++) for (let i = 0; i < 9; i++) furos += `<circle cx="${290 + i * 24 + (j % 2) * 12}" cy="${330 + j * 22}" r="4" fill="${C.ink}" opacity="0.7"/>`;
      s += `<path d="M380 470q0 30 -4 60M420 474q4 24 0 50" ${S(2, '#E8E6D6')}/>`;
      s += `<path d="M270 300V440A130 40 0 0 0 530 440V300Z" fill="#E7E1CF" stroke="${C.ink}" stroke-width="2.8"/>${furos}<ellipse cx="400" cy="300" rx="130" ry="40" fill="#FBF9F1" stroke="${C.ink}" stroke-width="2.8"/>`;
      s += `<g transform="translate(330 250) scale(-1 1)">${P.fist(ctx, { armAngle: -70, armLen: 300 })}</g>` + g(P.fist(ctx, { armAngle: -70, armLen: 300 }), 470, 250, 1);
      return s;
    },
    'quinta-do-outeiro': (ctx) => {
      let s = fundo() + colinas(ctx) + mesa(ctx, 430);
      let palha = '';
      const r = rng(4);
      for (let i = 0; i < 70; i++) { const a = r() * Math.PI, x = 300 + Math.cos(a) * (150 + r() * 30), y = 470 - Math.sin(a) * 40 + r() * 20; palha += `M${f(x)} ${f(y)}q${f((r() - 0.5) * 40)} ${f(-10 - r() * 10)} ${f((r() - 0.5) * 60)} ${f(-r() * 8)}`; }
      s += `<ellipse cx="300" cy="470" rx="190" ry="60" fill="#D9BE7A" stroke="${C.ink}" stroke-width="2.6"/><path d="${palha}" ${S(2, '#A8873E')}/>`;
      [[240, 456], [300, 446], [360, 458]].forEach(([x, y], i) => { s += `<g transform="translate(${x} ${y}) rotate(${i * 12 - 10})">${corpo(ctx, [[0, -40], [18, -32], [28, -8], [26, 14], [12, 26], [0, 28], [-12, 26], [-26, 14], [-28, -8], [-18, -32]], '#D9A87C', '#A6764C', { hachura: false, w: 2.2 })}</g>`; });
      s += g(P.fist(ctx, { armAngle: -40, armLen: 340 }), 470, 330, 1);
      s += `<g transform="translate(470 330) rotate(12)">${corpo(ctx, [[0, -40], [18, -32], [28, -8], [26, 14], [12, 26], [0, 28], [-12, 26], [-26, 14], [-28, -8], [-18, -32]], '#D9A87C', '#A6764C', { hachura: false, w: 2.2 })}</g>`;
      s += `<g transform="translate(650 470)"><path d="M-100 -60H100L84 20H-84Z" fill="#B98A57" stroke="${C.ink}" stroke-width="2.6"/><path d="${Array.from({ length: 8 }, (_, i) => `M${-96 + i * 26} -60L${-80 + i * 22} 20`).join('')}" ${S(1.4, '#7E5A30')}/><path d="M-90 -60C-90 -170 90 -170 90 -60" ${S(8, '#8E6436')}/></g>`;
      return s;
    },
  };
  for (const [id, fn] of Object.entries(V)) {
    const ctx = new Ctx('v' + id.replace(/[^a-z]/g, '').slice(0, 8));
    const pr = PRODUTORES.find((x) => x.id === id);
    escrever(ILU, `produtor-${id}.svg`, svgDoc({ w: 800, h: 600, title: pr.acao, ctx, body: tinta(ctx, fn(ctx)) }));
  }
  console.log('vinhetas: 7 produtores novos');
}

/* ═════════ F. pratos das receitas (900×640) ═════════ */
function tigela(ctx, x, y, rx, ry, conteudo, cor = '#F1EDE0', aro = C.ink) {
  const face = `M${x - rx} ${y}A${rx} ${ry} 0 0 0 ${x + rx} ${y}L${x + rx * 0.62} ${y + ry * 2.1}A${rx * 0.62} ${ry * 0.5} 0 0 1 ${x - rx * 0.62} ${y + ry * 2.1}Z`;
  let s = `<ellipse cx="${x}" cy="${y + ry * 2.15}" rx="${rx * 0.9}" ry="${ry * 0.6}" fill="${C.ink}" opacity="0.12"/>`;
  s += `<path d="${face}" fill="${cor}" stroke="${C.ink}" stroke-width="2.8"/>` + hatched(ctx, `M${x + rx * 0.2} ${y + ry}L${x + rx} ${y}L${x + rx * 0.62} ${y + ry * 2.1}Z`, { angle: 70, gap: 5, opacity: 0.35 });
  s += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${cor}" stroke="${aro}" stroke-width="2.8"/>`;
  const dentro = `M${x - rx * 0.9} ${y}A${rx * 0.9} ${ry * 0.86} 0 1 0 ${x + rx * 0.9} ${y}A${rx * 0.9} ${ry * 0.86} 0 1 0 ${x - rx * 0.9} ${y}Z`;
  return s + `<g clip-path="url(#${ctx.clip(dentro)})">${conteudo}</g><path d="${dentro}" ${S(1.6)}/>`;
}
const tabuaMesa = (ctx) => `<rect width="900" height="640" fill="${C.cream}"/><path d="M0 120H900V640H0Z" fill="#C9A16A"/>` + `<path d="${Array.from({ length: 6 }, (_, i) => `M0 ${170 + i * 86}H900`).join('')}" ${S(1.4, '#8E6436')} opacity="0.6"/>` + hatched(ctx, 'M0 120H900V640H0Z', { angle: 3, gap: 10, width: 1, opacity: 0.2 }) + `<path d="M0 120H900" ${S(2.4)}/>`;
const pano = (x, y) => `<g transform="translate(${x} ${y}) rotate(-8)"><rect x="0" y="0" width="300" height="200" rx="6" fill="${C.ivory}" stroke="${C.ink}" stroke-width="2.4"/><path d="M0 26H300M0 36H300M0 170H300M0 180H300" ${S(4, C.terra)} opacity="0.8"/></g>`;
export function receitas() {
  const R = {
    'sopa-de-abobora-e-alho-frances': (ctx) => {
      let s = tabuaMesa(ctx) + pano(80, 320);
      const sopa = `<rect x="200" y="200" width="500" height="200" fill="#EE9A3A"/><path d="M330 300c40 -30 90 10 140 -10s80 20 110 0" ${S(5, '#C7B24A')}/>` + [[360, 270], [420, 300], [500, 280], [460, 330], [380, 320]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="18" ry="10" fill="#E2E6B8" stroke="#6E8A4E" stroke-width="3"/>`).join('');
      s += tigela(ctx, 450, 290, 230, 90, sopa, '#F3EFE2');
      s += `<g transform="translate(700 470) rotate(-14)"><ellipse rx="44" ry="20" fill="#D9D6CC" stroke="${C.ink}" stroke-width="2.4"/><rect x="38" y="-6" width="160" height="12" rx="6" fill="#D9D6CC" stroke="${C.ink}" stroke-width="2.2"/></g>`;
      s += g(semSombra(() => P.broaSlice(ctx)), 190, 520, 1.6, -10);
      return s;
    },
    'acorda-de-coentros-com-ovo': (ctx) => {
      let s = tabuaMesa(ctx);
      const r = rng(3);
      let pao = '';
      for (let i = 0; i < 16; i++) pao += `<path d="${smooth(oval(270 + r() * 360, 220 + r() * 160, 26 + r() * 14, 16 + r() * 8, 9, 0.4, i))}" fill="#E7CC98" stroke="${C.ink}" stroke-width="1.4"/>`;
      let folhas = '';
      for (let i = 0; i < 26; i++) { const x = 260 + r() * 380, y = 210 + r() * 170; folhas += `<path d="M${f(x)} ${f(y)}c6 -8 14 -8 18 0c-6 8 -14 8 -18 0z" fill="#4F7A3A" stroke="${C.ink}" stroke-width="1"/>`; }
      const ovoE = (x, y) => `<path d="${smooth(oval(x, y, 48, 38, 14, 0.18, x))}" fill="#FBF8F0" stroke="${C.ink}" stroke-width="2"/><ellipse cx="${x + 4}" cy="${y - 2}" rx="20" ry="16" fill="#F2B23E"/><path d="${smooth(oval(x + 2, y - 6, 30, 22, 12, 0.2, x + 1))}" fill="#FBF8F0" opacity="0.72"/><ellipse cx="${x - 10}" cy="${y - 14}" rx="10" ry="5" fill="${C.ivory}"/>`;
      s += tigela(ctx, 450, 290, 240, 96, `<rect x="200" y="190" width="500" height="220" fill="#C7C08A"/>${pao}${ovoE(390, 280)}${ovoE(520, 300)}${folhas}`, '#B5643A');
      s += `<g transform="translate(150 520)">${[0, 1, 2].map((i) => `<ellipse cx="${i * 30}" cy="${i % 2 * 6}" rx="18" ry="22" fill="#F2EEDC" stroke="${C.ink}" stroke-width="2"/>`).join('')}</g>`;
      return s;
    },
    'salada-de-grao-tomate-e-salsa': (ctx) => {
      let s = tabuaMesa(ctx) + pano(560, 380);
      const r = rng(5);
      let c = `<rect x="200" y="190" width="500" height="220" fill="#EFE6CF"/>`;
      for (let i = 0; i < 70; i++) c += `<circle cx="${f(220 + r() * 460)}" cy="${f(205 + r() * 190)}" r="11" fill="#DDBB86" stroke="${C.ink}" stroke-width="1.2"/>`;
      for (let i = 0; i < 22; i++) { const x = 240 + r() * 420, y = 210 + r() * 170; c += `<rect x="${f(x)}" y="${f(y)}" width="24" height="20" rx="4" fill="#CC4430" stroke="${C.ink}" stroke-width="1.2" transform="rotate(${f(r() * 40)} ${f(x)} ${f(y)})"/>`; }
      for (let i = 0; i < 40; i++) c += `<circle cx="${f(220 + r() * 460)}" cy="${f(205 + r() * 190)}" r="4" fill="#3F6E2E"/>`;
      for (let i = 0; i < 8; i++) { const x = 260 + r() * 380, y = 220 + r() * 150; c += `<path d="M${f(x)} ${f(y)}q20 -12 40 0" ${S(4, '#B88AB0')}/>`; }
      s += tigela(ctx, 450, 290, 250, 96, c, '#F3EFE2');
      s += semSombra(() => fruta(ctx, 'limao', 150, 540, 40, 2));
      return s;
    },
    'torrada-de-queijo-de-cabra-e-compota-de-figo': (ctx) => {
      let s = tabuaMesa(ctx) + `<g transform="translate(450 360) rotate(-6)"><path d="M-330 -150H300Q330 -150 330 -120V150Q330 180 300 180H-330Q-360 180 -360 150V-120Q-360 -150 -330 -150Z" fill="#B98A57" stroke="${C.ink}" stroke-width="2.8"/><path d="M-340 -100H310M-340 -20H310M-340 60H310M-340 140H310" ${S(1.2, '#7E5A30')} opacity="0.5"/><rect x="330" y="-30" width="80" height="40" rx="20" fill="#B98A57" stroke="${C.ink}" stroke-width="2.6"/></g>`;
      [[-140, 0, -8], [150, 20, 6]].forEach(([dx, dy, a], i) => {
        const r = rng(i + 7);
        let top = '';
        for (let k = 0; k < 9; k++) top += `<path d="${smooth(oval(-80 + r() * 160, -60 + r() * 120, 18, 12, 8, 0.4, k))}" fill="#F6F1E2" stroke="${C.ink}" stroke-width="1.4"/>`;
        for (let k = 0; k < 6; k++) top += `<path d="${smooth(oval(-70 + r() * 140, -50 + r() * 100, 16, 11, 8, 0.4, k + 20))}" fill="#5A2638" stroke="${C.ink}" stroke-width="1.2"/>`;
        for (let k = 0; k < 4; k++) top += `<path d="${smooth(oval(-70 + r() * 140, -50 + r() * 100, 13, 9, 8, 0.4, k + 40))}" fill="#C9A06A" stroke="${C.ink}" stroke-width="1.2"/>`;
        s += `<g transform="translate(${450 + dx} ${340 + dy}) rotate(${a})"><path d="M-120 -100Q-110 -130 -60 -126H60Q120 -130 124 -96V100Q120 120 90 120H-96Q-122 120 -120 96Z" fill="#6E4A33" stroke="${C.ink}" stroke-width="2.6"/><path d="M-108 -92Q-100 -114 -56 -112H58Q108 -114 110 -88V90Q106 106 84 106H-90Q-110 106 -108 86Z" fill="#9A6B4A"/>${top}</g>`;
      });
      return s + `<path d="M380 260q30 30 0 60q-20 20 10 50" ${S(4, '#E0A43A')} opacity="0.9"/>`;
    },
    'maca-assada-com-mel-e-nozes': (ctx) => {
      let s = tabuaMesa(ctx);
      s += `<ellipse cx="450" cy="380" rx="330" ry="150" fill="#A85A34" stroke="${C.ink}" stroke-width="3"/><ellipse cx="450" cy="370" rx="300" ry="128" fill="#7E3E22"/><ellipse cx="450" cy="380" rx="280" ry="110" fill="#C88A3A" opacity="0.8"/>`;
      [[320, 350], [460, 320], [590, 360], [440, 420]].forEach(([x, y], i) => {
        s += semSombra(() => `<g>${corpo(ctx, oval(x, y, 74, 64, 22, 0.14, i), '#C98A3E', '#8A5320', { brilho: 0.6 })}</g>`);
        s += `<path d="M${x - 40} ${y - 10}q20 -14 40 0M${x - 30} ${y + 16}q24 -10 50 2" ${S(1.6, '#6E3E18')} opacity="0.6"/><path d="${smooth(oval(x + 2, y - 54, 26, 14, 10, 0.4, i + 9))}" fill="#C9A06A" stroke="${C.ink}" stroke-width="1.6"/><path d="M${x} ${y - 60}l2 -14" ${S(4, '#5A4128')}/>`;
      });
      s += `<path d="M300 300c60 40 200 40 300 0" ${S(5, '#E9B44A')} opacity="0.7"/><g transform="translate(720 520) rotate(-20)"><rect x="-80" y="-10" width="160" height="20" rx="10" fill="#8A5A3A" stroke="${C.ink}" stroke-width="2"/></g>`;
      return s;
    },
    'tiborna-de-azeite-e-alecrim': (ctx) => {
      let s = tabuaMesa(ctx) + `<g transform="translate(450 370) rotate(4)"><rect x="-360" y="-160" width="700" height="320" rx="28" fill="#B98A57" stroke="${C.ink}" stroke-width="2.8"/><path d="M-350 -80H330M-350 0H330M-350 80H330" ${S(1.2, '#7E5A30')} opacity="0.5"/></g>`;
      [[-200, -10, -8], [10, 10, 4], [220, -6, -4]].forEach(([dx, dy, a], i) => {
        s += `<g transform="translate(${450 + dx} ${360 + dy}) rotate(${a})"><path d="${smooth([[-100, 70], [-110, -20], [-80, -90], [0, -110], [80, -90], [110, -20], [100, 70], [0, 84]])}" fill="#8A5A30" stroke="${C.ink}" stroke-width="2.6"/><path d="${smooth([[-86, 58], [-94, -16], [-70, -76], [0, -94], [70, -76], [94, -16], [86, 58], [0, 70]])}" fill="#D9A462"/><path d="M-70 -40l140 30M-74 0l150 30M-60 40l130 24" ${S(5, '#6E4224')} opacity="0.8"/><path d="${smooth(oval(0, 0, 70, 46, 14, 0.4, i))}" fill="#C7B24A" opacity="0.55"/><ellipse cx="-20" cy="-20" rx="20" ry="8" fill="${C.ivory}" opacity="0.6"/></g>`;
      });
      s += semSombra(() => g(molho(ctx, 'alecrim', { seed: 9, len: 220, stems: 3, ox: 0, oy: 0, tie: false }), 130, 560, 0.9, -20));
      return s;
    },
  };
  for (const r of RECEITAS) {
    const ctx = new Ctx('r' + r.id.replace(/[^a-z]/g, '').slice(0, 8));
    escrever(ILU, `receita-${r.id}.svg`, svgDoc({ w: 900, h: 640, title: r.alt, ctx, body: tinta(ctx, R[r.id](ctx)) }));
  }
  console.log('pratos: 6 receitas');
}

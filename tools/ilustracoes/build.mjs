// Gera todas as ilustrações SVG em assets/ilustracoes/.
// Uso: node tools/ilustracoes/build.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { C, Ctx, f, poly, smooth, line, svgDoc, hatched, lerp, add, rng } from './lib.mjs';
import { loaf, broa, broaSlice, bagWithLoaf, couve, carrotBunch, carrotRoot, rama, tomato, box, ovenArch, linen, crumbs, tiles, fist, peel, leaf, place } from './parts.mjs';

const OUT = new URL('../../assets/ilustracoes/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const write = (name, svg) => {
  writeFileSync(new URL(name, OUT), svg);
  console.log(name.padEnd(34), (svg.length / 1024).toFixed(1) + ' KB');
};

/** Envolve a cena com a textura de impressão (tinta irregular + grão subtil). */
function printed(ctx, body, vb, grain = 0.3) {
  const tx = ctx.textures(grain);
  return `<g filter="url(#${tx.ink})">${body}</g>`;
}

/** Plano esbatido nas pontas horizontais para se fundir com o papel da página. */
function fadeSides(ctx, x, y, w, h, edge = 0.12) {
  const id = ctx.id('fs'), g = ctx.id('fg');
  ctx.defs.push(`<linearGradient id="${g}" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${edge}" stop-color="#fff"/><stop offset="${1 - edge}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="${id}" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${g})"/></mask>`);
  return id;
}

/* ═════════════ A. ILUSTRAÇÃO PRINCIPAL — o cabaz aberto ═════════════ */
function cabazScene(ctx, { withSetting = true, detail = true, contents = 'misto' } = {}) {
  let s = '';
  const bx = box(ctx, { O: [220, 668], u: [410, 48], v: [0, -120], w: [190, -104], detail });
  if (withSetting) {
    // parede de azulejo e forno a lenha ao fundo
    const m = fadeSides(ctx, 0, 300, 700, 180, 0.2);
    s += `<g mask="url(#${m})">${tiles(ctx, { x: 0, y: 330, w: 700, h: 140, size: 46 })}<path d="M0 330H700" ${'fill="none" stroke="' + C.ink + '" stroke-width="2.4"'}/></g>`;
    s += `<rect x="640" y="400" width="400" height="80" fill="${C.cream}"/>`;
    s += `<g>${hatched(ctx, 'M640 420H1000V470H640Z', { angle: 0, gap: 7, width: 1.2, opacity: 0.35 })}</g>`;
    s += place(ovenArch(ctx, { r: 118, detail }), 880, 402);
    // bancada de pedra lioz
    const m2 = fadeSides(ctx, 0, 460, 1000, 330, 0.1);
    let counter = `<path d="M0 470H1000V752H0Z" fill="${C.stone}"/>`;
    counter += `<path d="M0 752H1000V780H0Z" fill="${C.stoneDark}"/>`;
    counter += `<path d="M0 470H1000M0 752H1000M0 780H1000" fill="none" stroke="${C.ink}" stroke-width="2.6"/>`;
    counter += `<path d="M60 520C160 560 260 540 330 600M720 740C800 700 880 720 960 690M520 760C560 770 600 766 640 772" fill="none" stroke="${C.ink}" stroke-width="1" opacity="0.28"/>`;
    counter += hatched(ctx, 'M0 752H1000V780H0Z', { angle: 90, gap: 5, width: 1, opacity: 0.25 });
    s += `<g mask="url(#${m2})">${counter}</g>`;
    // sombra própria da caixa na bancada (luz da esquerda)
    const { FRb, BRb } = bx.pts;
    s += hatched(ctx, poly([FRb, BRb, [905, 626], [742, 742]]), { angle: 45, gap: 5, width: 1.3, opacity: 0.55 });
    s += place(linen(ctx, { detail }), 60, 662, 1, -6);
    s += crumbs(81, 3, [360, 726, 140, 22]);
    s += crumbs(82, 2, [90, 742, 60, 10]);
  }
  s += bx.back;
  if (contents === 'misto') {
    s += place(couve(ctx, { detail, seed: 31 }), 708, 520, 0.92);
    s += place(bagWithLoaf(ctx, { detail }), 452, 556, 0.95);
    s += place(broa(ctx, { detail }), 532, 606, 0.98);
  } else {
    s += place(couve(ctx, { detail, seed: 33 }), 640, 520, 0.95);
    s += place(tomato(ctx, { r: 30, detail }), 470, 552, 1);
    s += place(tomato(ctx, { r: 26, detail, seed: 72 }), 528, 572, 1);
    s += place(leaf(ctx, { L: 150, W: 58, style: 'solid', seed: 3, detail, bend: 10 }), 420, 548, 1, -24);
  }
  s += bx.front;
  s += place(carrotBunch(ctx, { n: 4, detail, seed: 61, ramaLen: 200, rootL: 150, spread: 7, stems: 4 }), 300, 520, 1, -80);
  return s;
}

function hero() {
  const ctx = new Ctx('hero');
  const vb = [0, 240, 1000, 550];
  const body = cabazScene(ctx, { withSetting: true });
  write('cabaz-hero.svg', svgDoc({ w: vb[2], h: vb[3], vb: vb.join(' '), title: 'Ilustração: cabaz de cartão kraft aberto numa bancada de pedra, com um pão de fermentação lenta num saco de papel, uma broa de milho, uma couve e cenouras com rama; ao fundo, azulejos e a boca de um forno a lenha com uma pequena chama.', ctx, body: printed(ctx, body, vb) }));
}

/* ═════════════ Ilustrações de produto (mesma sessão: luz da esquerda, papel creme, escala comum) ═════════════ */
function productDoc(name, title, draw, vb = [0, 0, 600, 450]) {
  const ctx = new Ctx(name.replace(/\W/g, ''));
  const [x, y, w, h] = vb;
  let body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.cream}"/>`;
  body += draw(ctx);
  write(`produto-${name}.svg`, svgDoc({ w: 600, h: 450, vb: vb.join(' '), title, ctx, body: printed(ctx, body, vb, 0.18) }));
}
const groundShadow = (ctx, cx, cy, rx, ry) => hatched(ctx, `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`, { angle: 45, gap: 5, width: 1.2, opacity: 0.4 });

function products() {
  productDoc('pao-fermentacao-lenta', 'Pão de fermentação lenta: pão redondo de crosta escura, com uma incisão aberta e a orelha levantada.', (ctx) =>
    groundShadow(ctx, 320, 352, 190, 22) + place(loaf(ctx, { seed: 11 }), 300, 344, 1.6));
  productDoc('broa-de-milho', 'Broa de milho: pão redondo e baixo, de crosta gretada e enfarinhada, com uma fatia de miolo amarelo.', (ctx) =>
    groundShadow(ctx, 300, 352, 200, 22) + place(broa(ctx, { seed: 21 }), 262, 344, 1.62) + place(broaSlice(ctx), 468, 352, 1.15, 8));
  productDoc('cenouras-com-rama', 'Cenouras com rama: molho de cinco cenouras atado com fio, com a rama verde inteira.', (ctx) =>
    groundShadow(ctx, 330, 360, 210, 18) + place(carrotBunch(ctx, { n: 5, seed: 64, ramaLen: 200, rootL: 190, spread: 14, stems: 3, gapX: 24 }), 240, 290, 1, -70));
  productDoc('couve-portuguesa', 'Couve portuguesa: couve de folhas largas e arredondadas, com nervuras claras e grossas.', (ctx) =>
    groundShadow(ctx, 300, 392, 170, 20) + place(couve(ctx, { seed: 35 }), 300, 392, 1.22));
  const cab = (contents, seed) => (ctx) => {
    const r = groundShadow(ctx, 520, 700, 340, 34);
    return r + cabazScene(ctx, { withSetting: false, contents });
  };
  productDoc('cabaz-da-horta', 'Cabaz da horta: caixa de cartão com a marca, com couve, tomates e cenouras com rama.', cab('horta'), [40, 230, 880, 660]);
  productDoc('cabaz-pao-e-horta', 'Cabaz de pão e horta: caixa de cartão com a marca, com pão num saco de papel, broa, couve e cenouras com rama.', cab('misto'), [40, 200, 880, 660]);
}

/* ═════════════ C. Estudo do cabaz misto (conteúdos separados) ═════════════ */
function study() {
  const ctx = new Ctx('estudo');
  const vb = [0, -80, 1000, 780];
  let s = '';
  const bx = box(ctx, { O: [318, 646], u: [380, 38], v: [0, -96], w: [160, -86] });
  s += hatched(ctx, poly([bx.pts.FRb, bx.pts.BRb, [920, 572], [770, 690]]), { angle: 45, gap: 5, width: 1.2, opacity: 0.45 });
  s += bx.back;
  // papel de embrulho amarrotado dentro da caixa
  s += `<path d="M360 560C420 520 480 540 520 512C580 520 640 500 700 540C690 560 640 576 560 580C480 584 400 584 360 560Z" fill="${C.ivory}" stroke="${C.ink}" stroke-width="2.4"/><path d="M400 556L430 534M470 548L500 524M560 552L600 522M640 556L668 536" fill="none" stroke="${C.ink}" stroke-width="1.2" opacity="0.5"/>`;
  s += bx.front;
  // guias tracejadas de cada grupo para o interior da caixa
  const guide = (x0, y0, x1, y1) => `<path d="M${x0} ${y0}C${x0} ${(y0 + y1) / 2} ${x1} ${(y0 + y1) / 2 - 20} ${x1} ${y1}" fill="none" stroke="${C.ink}" stroke-width="1.6" stroke-dasharray="2 7" stroke-linecap="round"/><path d="M${x1 - 6} ${y1 - 9}L${x1} ${y1}L${x1 + 6} ${y1 - 9}" fill="none" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += guide(200, 330, 430, 520) + guide(500, 318, 530, 508) + guide(800, 352, 640, 520);
  // sombras projetadas no papel (objetos suspensos)
  s += groundShadow(ctx, 200, 344, 120, 10) + groundShadow(ctx, 500, 330, 112, 9) + groundShadow(ctx, 800, 360, 150, 10);
  // 1. pão de fermentação lenta
  s += place(loaf(ctx, { seed: 12 }), 196, 318, 1.04);
  // 2. broa de milho
  s += place(broa(ctx, { seed: 22 }), 500, 306, 1.08);
  // 3. hortícolas da semana
  s += place(couve(ctx, { seed: 37 }), 846, 330, 0.62);
  s += place(carrotBunch(ctx, { n: 3, seed: 66, ramaLen: 120, rootL: 120, spread: 8, stems: 3 }), 720, 250, 0.9, -62);
  s += place(tomato(ctx, { r: 26 }), 780, 330, 1);
  s += place(tomato(ctx, { r: 22, seed: 73 }), 742, 338, 1);
  // separadores entre a padaria e a horta
  s += `<path d="M640 120V380" fill="none" stroke="${C.ink}" stroke-width="1.4" stroke-dasharray="1 8" stroke-linecap="round" opacity="0.6"/>`;
  write('cabaz-estudo.svg', svgDoc({ w: 1000, h: 780, vb: vb.join(' '), title: 'Estudo do cabaz de pão e horta: em cima, separados, um pão de fermentação lenta, uma broa de milho e hortícolas da semana (couve, cenouras e tomate); por baixo, a caixa de cartão onde entram.', ctx, body: printed(ctx, s, vb) }));
}

/* ═════════════ B. Vinhetas de origem ═════════════ */
function hortaVignette() {
  const ctx = new Ctx('horta');
  const vb = [0, 0, 800, 600];
  let s = `<rect width="800" height="600" fill="${C.cream}"/>`;
  // horizonte: sebe de árvores e colina suave
  let trees = 'M-10 150';
  const tr = rng(17);
  for (let x = -10; x < 820; ) {
    const w = 26 + tr() * 40, h = 10 + tr() * 22;
    trees += `q${f(w / 2)} ${f(-h * 2)} ${f(w)} 0`;
    x += w;
  }
  trees += 'V160H-10Z';
  s += `<path d="M-10 128C160 96 300 104 420 118C540 132 660 108 810 112V160H-10Z" fill="${C.paperShade}" stroke="${C.ink}" stroke-width="1.6"/>`;
  s += `<path d="${trees}" fill="${C.ink}" opacity="0.9"/>`;
  s += `<path d="M0 150C200 138 500 134 800 146" fill="none" stroke="${C.ink}" stroke-width="2"/>`;
  const VP = [560, 146];
  for (let i = -6; i <= 9; i++) {
    const x = i * 110;
    const d = `M${VP[0]} ${VP[1]}Q${(VP[0] + x) / 2 + 40} ${(VP[1] + 600) / 2} ${x} 620`;
    s += `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${1.2 + Math.abs(i - 2) * 0.12}" opacity="0.7"/>`;
  }
  // rebentos alinhados nos camalhões
  let tufts = '';
  for (let i = -5; i <= 8; i++) {
    for (let k = 1; k < 9; k++) {
      const t = k / 9;
      const x0 = i * 110 + 55;
      const x = VP[0] + (x0 - VP[0]) * t * t, y = VP[1] + (600 - VP[1]) * t * t;
      if (y > 430) continue;
      const sz = 3 + t * t * 18;
      tufts += `M${f(x)} ${f(y)}q${f(-sz * 0.6)} ${f(-sz * 0.4)} ${f(-sz * 0.8)} ${f(-sz)}q${f(sz * 0.6)} ${f(sz * 0.1)} ${f(sz * 0.8)} ${f(sz)}q${f(sz * 0.1)} ${f(-sz * 0.7)} ${f(sz * 0.7)} ${f(-sz * 0.9)}q${f(-sz * 0.1)} ${f(sz * 0.6)} ${f(-sz * 0.7)} ${f(sz * 0.9)}Z`;
    }
  }
  s += `<path d="${tufts}" fill="${C.ink}" opacity="0.8"/>`;
  // camalhão em primeiro plano, com torrões e linhas de lavra
  const mound = 'M-10 470C120 440 260 452 360 446C460 440 600 430 810 452V610H-10Z';
  s += `<path d="${mound}" fill="${C.soil}"/>`;
  s += hatched(ctx, mound, { angle: 20, gap: 6, width: 1.2, opacity: 0.3 });
  s += `<path d="M-10 500C150 480 300 492 420 486C560 480 680 474 810 488M-10 540C170 524 320 534 460 528C600 524 700 520 810 530M-10 580C200 566 380 574 520 570C640 566 740 566 810 570" fill="none" stroke="${C.ink}" stroke-width="1.4" opacity="0.45"/>`;
  s += crumbs(92, 8, [20, 480, 220, 100]) + crumbs(93, 8, [560, 470, 220, 110]);
  s += `<path d="M-10 470C120 440 260 452 360 446C460 440 600 430 810 452" fill="none" stroke="${C.ink}" stroke-width="3"/>`;
  // cenouras a sair da terra (as pontas ficam escondidas pela terra da frente)
  s += place(carrotBunch(ctx, { n: 4, seed: 68, ramaLen: 300, rootL: 150, spread: 12, stems: 3, tie: false, gapX: 20, ramaSpread: 12 }), 392, 372, 1, 0);
  const hole = 'M250 500C300 470 340 488 380 474C430 470 470 492 540 482C560 520 520 560 400 566C300 566 240 540 250 500Z';
  s += `<path d="${hole}" fill="${C.soilDark}" stroke="${C.ink}" stroke-width="2.6"/>`;
  s += hatched(ctx, hole, { angle: -30, gap: 5, width: 1.2, opacity: 0.45 });
  s += crumbs(91, 7, [300, 440, 200, 40]);
  // torrões a cair
  s += `<g fill="${C.soilDark}" stroke="${C.ink}" stroke-width="1.4"><circle cx="350" cy="430" r="5"/><circle cx="438" cy="452" r="4"/><circle cx="420" cy="418" r="3"/></g>`;
  // duas mãos, vindas de cima, a puxar o molho
  s += place(fist(ctx, { armAngle: -52, armLen: 300, taper: 18 }), 400, 252, 1.08);
  s += `<g transform="translate(386 338) scale(-1.04 1.04)">${fist(ctx, { armAngle: -64, armLen: 320, taper: 18 })}</g>`;
  write('produtor-horta-da-ribeira.svg', svgDoc({ w: 800, h: 600, vb: vb.join(' '), title: 'Horta da Ribeira: duas mãos puxam um molho de cenouras com rama para fora de um sulco de terra; ao fundo, os camalhões da horta.', ctx, body: printed(ctx, s, vb) }));
}

function padariaVignette() {
  const ctx = new Ctx('padaria');
  const vb = [0, 0, 800, 600];
  let s = `<rect width="800" height="600" fill="${C.cream}"/>`;
  // parede de pedra caiada
  let blocks = '';
  for (let j = 0; j < 8; j++) for (let i = 0; i < 9; i++) blocks += `M${i * 110 + (j % 2) * 55 - 40} ${j * 52}h96v40h-96Z`;
  s += `<path d="${blocks}" fill="none" stroke="${C.ink}" stroke-width="1.3" opacity="0.35"/>`;
  s += place(ovenArch(ctx, { r: 196, flame: false, dome: true }), 390, 400);
  // brasas ao fundo da boca
  s += `<g fill="${C.terra}"><path d="M250 392C270 360 300 372 320 352C340 372 360 360 372 392Z"/><path d="M420 392C436 368 456 376 470 356C486 374 506 366 520 392Z" opacity="0.85"/></g>`;
  s += `<path d="M300 352C296 330 310 316 306 296C324 312 330 336 322 352Z" fill="${C.terra}"/><path d="M470 356C468 340 478 326 474 312C488 326 492 344 486 356Z" fill="${C.terra}"/>`;
  s += `<g fill="${C.cream}" opacity="0.8"><circle cx="286" cy="384" r="2.5"/><circle cx="452" cy="386" r="2"/><circle cx="352" cy="380" r="2"/></g>`;
  // soleira de granito
  s += `<path d="M-10 432H810V610H-10Z" fill="${C.stone}"/>` + hatched(ctx, 'M-10 432H810V610H-10Z', { angle: 0, gap: 7, width: 1, opacity: 0.25 });
  s += `<path d="M-10 432H810" fill="none" stroke="${C.ink}" stroke-width="3"/>`;
  s += specks(ctx, 60);
  // pá de madeira a puxar a broa pela boca do forno
  s += place(peel(ctx, { len: 520, angle: 28 }), 360, 418, 1);
  s += place(broa(ctx, { seed: 24 }), 352, 412, 0.92);
  // calor a subir
  s += `<path d="M300 300c-8 -14 8 -22 0 -36M352 292c-8 -14 8 -22 0 -36M404 300c-8 -14 8 -22 0 -36" fill="none" stroke="${C.cream}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>`;
  // mão no cabo
  s += place(fist(ctx, { armAngle: -32, armLen: 300, sleeve: true }), 690, 548, 0.95, 62);
  // farinha caída na soleira
  s += crumbs(95, 4, [520, 450, 120, 30]);
  write('produtor-padaria-do-largo.svg', svgDoc({ w: 800, h: 600, vb: vb.join(' '), title: 'Padaria do Largo: uma pá de madeira puxa uma broa pela boca de um forno a lenha, com brasas ao fundo.', ctx, body: printed(ctx, s, vb) }));
}
function specks(ctx, n) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const x = (i * 137) % 800, y = 440 + ((i * 53) % 150);
    d += `M${x} ${y}h2`;
  }
  return `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linecap="round" opacity="0.35"/>`;
}

/* ═════════════ D. Miniaturas e estado vazio ═════════════ */
function minis() {
  for (const [name, contents] of [['cabaz-miniatura', 'misto']]) {
    const ctx = new Ctx(name.replace(/\W/g, ''));
    const vb = [70, 190, 840, 630];
    const body = `<rect x="70" y="190" width="840" height="630" fill="${C.cream}"/>` + cabazScene(ctx, { withSetting: false, detail: false, contents });
    write(`${name}.svg`, svgDoc({ w: 160, h: 120, vb: vb.join(' '), title: contents === 'misto' ? 'Miniatura do cabaz de pão e horta' : 'Miniatura do cabaz da horta', ctx, body }));
  }
}

import { produtos, naturezas, panorama, cabazEstados, vinhetas, receitas } from './cenas.mjs';
study();
hortaVignette();
padariaVignette();
minis();
produtos(cabazScene);
naturezas(cabazScene);
panorama();
cabazEstados();
vinhetas();
receitas();

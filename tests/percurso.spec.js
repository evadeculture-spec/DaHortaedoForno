// Percurso de cliente (brief, secção 10). Uso: node tests/percurso.spec.js [url]
// Requer Playwright (já instalado no ambiente) e um servidor estático na raiz do projeto.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const URL = process.argv[2] || 'http://localhost:8765/';
const OUT = process.env.SHOTS || null;
const passos = [];
const ok = (msg) => { passos.push(msg); console.log('  ✓ ' + msg); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const page = await ctx.newPage();
  const erros = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) erros.push(m.text()); });
  page.on('pageerror', (e) => erros.push(e.message));
  const visiveis = () => page.$$eval('[data-grelha] > li:not([hidden]) .card__open', (els) => els.map((e) => e.textContent.trim()));
  const contador = () => page.textContent('.site-header [data-contador]');
  const shot = async (nome) => { if (OUT) { await page.waitForTimeout(450); await page.screenshot({ path: `${OUT}/${nome}.png` }); } };

  console.log('1. Telemóvel (390 px): entrar por “Explorar o mercado”');
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.click('.hero >> text=Explorar o mercado');
  await page.waitForTimeout(800);
  const topo = await page.$eval('#mercado-titulo', (h) => h.getBoundingClientRect().top);
  assert.ok(topo >= 0 && topo < 200, 'título do mercado visível no topo: ' + topo);
  ok('“Hoje no mercado” chega ao topo do ecrã');

  console.log('2. Filtrar “Do forno” e adicionar dois pães');
  await page.click('.chip:has-text("Do forno")');
  assert.deepEqual(await visiveis(), ['Pão de fermentação lenta', 'Broa de milho']);
  const scrollAntes = await page.evaluate(() => window.scrollY);
  const add = page.locator('[data-adicionar="pao-fermentacao-lenta"]');
  await add.click();
  assert.equal((await add.textContent()).trim().startsWith('Adicionado'), true);
  await add.click();
  assert.equal(await contador(), '2');
  assert.equal(await page.evaluate(() => window.scrollY), scrollAntes, 'a página não saltou');
  assert.ok(await page.isChecked('input[value="forno"]'), 'o filtro mantém-se');
  await page.waitForTimeout(150);
  assert.match(await page.textContent('[data-anuncio]'), /Adicionado ao cesto/);
  await shot('02-adicionado');
  ok('2 pães no cesto, confirmação no botão, contador 2, sem salto nem perda de filtro');

  console.log('3. “Cabazes” → ficha do cabaz misto → adicionar 1');
  await page.click('.chip:has-text("Cabazes")');
  assert.deepEqual(await visiveis(), ['Cabaz da horta', 'Cabaz de pão e horta']);
  await page.click('.card__open:has-text("Cabaz de pão e horta")');
  await page.waitForSelector('#ficha[open]');
  assert.equal(await page.textContent('#estudo-titulo'), 'Dentro deste cabaz');
  const itens = await page.$$eval('.study__list .study__item b', (b) => b.map((x) => x.textContent));
  assert.deepEqual(itens, ['Pão de fermentação lenta', 'Broa de milho', 'Hortícolas da semana']);
  const prods = await page.textContent('.ficha__origin');
  assert.ok(prods.includes('Horta da Ribeira') && prods.includes('Padaria do Largo'));
  await shot('03-ficha-cabaz');
  // a barra de compra fica acessível na base do ecrã
  const barra = await page.$eval('.ficha__buy', (b) => { const r = b.getBoundingClientRect(); return { bottom: r.bottom, h: innerHeight }; });
  assert.ok(barra.bottom <= barra.h + 1, 'barra de compra visível na base');
  await page.click('[data-adicionar-ficha]');
  assert.match(await page.textContent('[data-confirmacao]'), /Tens 1 no cesto/);
  ok('ficha mostra conteúdo e os dois produtores; 1 cabaz adicionado');

  console.log('4. Confirmar 3 unidades e subtotal 30,60 €');
  await page.keyboard.press('Escape');
  assert.equal(await contador(), '3');
  await page.click('.site-header [data-abrir-cesto]');
  await page.waitForSelector('#cesto[open]');
  assert.equal((await page.textContent('.cart-total__value')).replace(/\s/g, ' '), '30,60 €');
  await shot('04-cesto');
  ok('contador 3 e subtotal 30,60 €');

  console.log('5. Atualizar a página: cesto preservado');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await contador(), '3');
  await page.click('.site-header [data-abrir-cesto]');
  assert.equal((await page.textContent('.cart-total__value')).replace(/\s/g, ' '), '30,60 €');
  ok('após atualizar: 3 unidades, 30,60 €');

  console.log('6. Reduzir os pães para 1 → 25,80 €');
  await page.click('[aria-label="Menos uma unidade de Pão de fermentação lenta"]');
  assert.equal((await page.textContent('.cart-total__value')).replace(/\s/g, ' '), '25,80 €');
  assert.equal(await contador(), '2');
  ok('subtotal 25,80 €');

  console.log('7. Rever, voltar a editar, concluir');
  await page.click('[data-rever]');
  assert.equal(await page.textContent('#cesto-titulo'), 'Rever encomenda');
  assert.equal(await page.$$eval('.review-list li', (l) => l.length), 2);
  await shot('07-revisao');
  await page.click('[data-voltar-cesto]');
  assert.equal(await page.$$eval('.cart-item', (l) => l.length), 2);
  await page.click('[data-rever]');
  await page.click('[data-concluir]');
  assert.equal(await page.textContent('[data-msg-final]'), 'Demonstração concluída. Não foi efetuada qualquer cobrança ou encomenda.');
  assert.equal(await contador(), '0');
  assert.equal(await page.evaluate(() => localStorage.getItem('dhf-cesto-v1')), '{}');
  await shot('07-concluido');
  await page.click('[data-ir-mercado]');
  await page.click('.site-header [data-abrir-cesto]');
  assert.equal((await page.textContent('.cart-empty p')).trim(), 'O teu cesto ainda está vazio');
  await page.keyboard.press('Escape');
  ok('mensagem final legível, cesto vazio após concluir');

  console.log('8. “Ver produtos” da Padaria do Largo');
  await page.click('[data-ver-produtor="padaria-do-largo"]');
  await page.waitForTimeout(600);
  assert.deepEqual(await visiveis(), ['Pão de fermentação lenta', 'Broa de milho', 'Cabaz de pão e horta']);
  assert.equal(await page.isVisible('[data-filtro-produtor]'), true);
  await page.click('.chip:has-text("Da horta")');
  assert.equal(await page.isVisible('[data-vazio]'), true, 'combinação vazia oferece “Limpar filtros”');
  await page.click('[data-limpar-filtros]');
  assert.equal((await visiveis()).length, 6);
  await page.click('[data-ver-produtor="horta-da-ribeira"]');
  await page.waitForTimeout(600);
  assert.deepEqual(await visiveis(), ['Cenouras com rama', 'Couve portuguesa', 'Cabaz da horta', 'Cabaz de pão e horta']);
  await page.click('[data-remover-produtor]');
  assert.equal((await visiveis()).length, 6);
  assert.equal(await page.isVisible('[data-filtro-produtor]'), false);
  ok('filtro de produtor (cabaz misto em ambos), vazio com “Limpar filtros”, remoção do filtro');

  console.log('10. Teclado: menu, ficha e cesto');
  const kb = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await kb.goto(URL, { waitUntil: 'networkidle' });
  const foco = () => kb.evaluate(() => { const a = document.activeElement; return (a.getAttribute('aria-label') || a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40); });
  const focoVisivel = () => kb.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2; });
  await kb.focus('.nav__toggle');
  await kb.keyboard.press('Enter');
  assert.equal(await kb.getAttribute('.nav__toggle', 'aria-expanded'), 'true');
  assert.equal(await foco(), 'Mercado');
  assert.ok(await focoVisivel(), 'foco visível no menu');
  await kb.keyboard.press('Escape');
  assert.equal(await kb.getAttribute('.nav__toggle', 'aria-expanded'), 'false');
  assert.equal(await kb.evaluate(() => document.activeElement.classList.contains('nav__toggle')), true);
  await kb.keyboard.press('Enter');
  await kb.keyboard.press('Tab');
  assert.equal(await foco(), 'Produtores');
  await kb.keyboard.press('Enter');
  await kb.waitForTimeout(700);
  assert.equal(await kb.getAttribute('.nav__toggle', 'aria-expanded'), 'false');
  assert.ok((await kb.$eval('#produtores-titulo', (h) => h.getBoundingClientRect().top)) < 200, 'menu leva a Produtores');
  // ficha por teclado
  await kb.focus('.card__open >> text=Broa de milho');
  await kb.keyboard.press('Enter');
  await kb.waitForSelector('#ficha[open]');
  await kb.keyboard.press('Tab');
  assert.ok(await focoVisivel(), 'foco visível na ficha');
  await kb.keyboard.press('Escape');
  assert.equal(await foco(), 'Broa de milho');
  // cesto por teclado
  await kb.focus('.site-header [data-abrir-cesto]');
  await kb.keyboard.press('Enter');
  await kb.waitForSelector('#cesto[open]');
  await kb.keyboard.press('Tab');
  assert.ok(await focoVisivel(), 'foco visível no cesto');
  await kb.keyboard.press('Escape');
  assert.equal(await kb.evaluate(() => document.activeElement.matches('.site-header [data-abrir-cesto]')), true);
  ok('menu abre/fecha e navega; Escape devolve o foco ao cartão e ao botão do cesto; foco visível');

  console.log('Imagem em falta: alternativa visual');
  const fb = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await fb.route('**/produto-broa-de-milho.svg', (r) => r.abort());
  await fb.goto(URL, { waitUntil: 'networkidle' });
  await fb.$eval('[data-id="broa-de-milho"]', (el) => el.scrollIntoView());
  await fb.waitForTimeout(500);
  assert.equal(await fb.isVisible('[data-id="broa-de-milho"] .img-fallback'), true);
  if (OUT) await fb.$eval('[data-id="broa-de-milho"]', (el) => el.scrollIntoView({ block: 'center' })).then(() => fb.screenshot({ path: `${OUT}/imagem-em-falta.png` }));
  ok('cartão mostra alternativa ilustrada quando a imagem falha');

  const semFalhaImagem = erros.filter((e) => !/ERR_FAILED|Failed to load resource/.test(e));
  assert.deepEqual(semFalhaImagem, [], 'sem erros de consola');
  ok('sem erros na consola');
  await browser.close();
  console.log(`\n${passos.length} verificações passaram.`);
})().catch((e) => { console.error('\n✗ FALHOU:', e.message); process.exit(1); });

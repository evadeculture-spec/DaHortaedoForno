// Verificações funcionais da loja (22 pontos do brief V3 + percursos de demonstração).
// Uso: node tests/percurso.spec.cjs [url]   — requer Playwright e o servidor local (npm start).
const { chromium, devices } = require('playwright');
const assert = require('node:assert/strict');

const BASE = (process.argv[2] || 'http://localhost:8080/').replace(/\/$/, '');
const OUT = process.env.SHOTS || null;
let n = 0;
const ok = (m) => { n += 1; console.log(`  ✓ ${String(n).padStart(2, '0')} ${m}`); };
const euros = (t) => t.replace(/\s/g, ' ').trim();
const IPAD_H = { viewport: { width: 1180, height: 820 }, hasTouch: true, userAgent: devices['iPad Pro 11'].userAgent };
const BANCAS = ['horticolas', 'fruta', 'ervas-aromaticas', 'padaria', 'mercearia', 'conservas-e-doces', 'ovos-e-lacticinios', 'cabazes'];

(async () => {
  const browser = await chromium.launch();
  const erros = [];
  const nova = async (opts = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => erros.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) erros.push(m.text()); });
    return p;
  };
  const ir = (p, r) => p.goto(BASE + r, { waitUntil: 'networkidle' });
  const contador = (p) => p.textContent('[data-num-cesto]');
  const subtotal = async (p) => euros(await p.textContent('[data-subtotal]'));
  const nomes = (p) => p.$$eval('[data-grelha] .cartao__nome', (a) => a.map((x) => x.textContent));

  /* 1 */
  let p = await nova(IPAD_H);
  await ir(p, '/');
  assert.equal((await p.textContent('h1')).replace(/\s+/g, ' ').trim(), 'Da terra e do forno, para a tua mesa.');
  const topoBalcao = await p.$eval('.balcao .rapido__nome', (e) => e.getBoundingClientRect().top);
  assert.ok(topoBalcao < 820, 'produtos compráveis no primeiro ecrã do iPad: ' + topoBalcao);
  ok(`homepage abre; no iPad horizontal o primeiro produto comprável está a ${Math.round(topoBalcao)} px`);

  /* 2, 3 */
  await p.tap('[data-sub="mega-mercado"]');
  assert.equal(await p.$$eval('#mega-mercado .mega__link', (a) => a.length), 8);
  if (OUT) await p.screenshot({ path: `${OUT}/megamenu-ipad.png` });
  await p.tap('#mega-mercado >> text=Padaria');
  await p.waitForURL('**/mercado/padaria');
  assert.equal(await p.textContent('h1'), 'Padaria');
  const d = await nova();
  for (const b of BANCAS) { await ir(d, '/mercado/' + b); assert.equal((await nomes(d)).length, 9, b); }
  ok('megamenu por toque com as 8 bancas; cada banca abre com 9 artigos');
  await ir(d, '/mercado');
  while (await d.isVisible('[data-mais]')) await d.click('[data-mais]');
  const todos = await nomes(d);
  assert.equal(todos.length, 72); assert.equal(new Set(todos).size, 72);
  assert.match(d.url(), /mostrar=72/);
  ok('72 artigos distintos no mercado (“Mostrar mais” fica no URL)');

  /* 4 + regresso à posição */
  const broa = p.locator('.cartao__nome a', { hasText: 'Broa de milho' });
  await broa.scrollIntoViewIfNeeded();
  await p.evaluate(() => window.scrollBy(0, 120));
  const y = await p.evaluate(() => window.scrollY);
  await broa.tap();
  await p.waitForURL('**/produto/broa-de-milho');
  assert.equal(await p.textContent('h1'), 'Broa de milho');
  assert.match(await p.textContent('.dobras'), /Glúten/);
  await p.click('.miniatura--pormenor');
  assert.equal(await p.getAttribute('[data-palco]', 'data-vista'), 'pormenor');
  await p.goBack();
  await p.waitForURL('**/mercado/padaria');
  await p.waitForTimeout(300);
  assert.ok(Math.abs((await p.evaluate(() => window.scrollY)) - y) < 30, 'posição recuperada');
  ok('ficha de produto com galeria e alergénios; voltar recupera a posição na banca');

  /* 5 */
  await ir(p, '/');
  await p.fill('#pesquisa-topo', 'pao');
  await p.waitForSelector('#pesquisa-topo-lista [role="option"]');
  assert.ok((await p.textContent('#pesquisa-topo-lista')).includes('Pão de fermentação lenta'));
  await p.press('#pesquisa-topo', 'Enter');
  await p.waitForURL('**/pesquisa?q=pao');
  assert.ok((await nomes(p)).includes('Pão de fermentação lenta'));
  await p.fill('#pesquisa-topo', 'grao');
  await p.press('#pesquisa-topo', 'Enter');
  await p.waitForURL('**/pesquisa?q=grao');
  assert.equal((await nomes(p))[0], 'Grão-de-bico seco');
  await ir(p, '/pesquisa?q=lenha');
  assert.ok((await nomes(p)).length >= 9, 'pesquisa por palavras da descrição e atributos');
  await p.click('[data-limpar-pesquisa]');
  assert.equal(await p.inputValue('#pesquisa-topo'), '');
  await ir(p, '/pesquisa?q=xyzzy');
  assert.match(await p.textContent('[data-vazio]'), /Não encontrámos «xyzzy»/);
  assert.equal(await p.$$eval('[data-vazio] .chip-link', (a) => a.length), 8);
  ok('pesquisa sem acentos (pao, grao), por descrição, limpar, e estado sem resultados com as 8 bancas');

  /* 6, 7 */
  await ir(d, '/mercado');
  await d.click('.filtros-lateral label:has-text("Só o que há agora")');
  assert.match(await d.textContent('[data-n]'), /^68 artigos/);
  await d.click('.filtros-lateral label:has-text("Forno a lenha")');
  assert.equal((await nomes(d)).length, 9);
  await d.selectOption('[data-ordem]', 'preco-asc');
  const precos = await d.$$eval('[data-grelha] .preco', (a) => a.map((x) => parseFloat(x.textContent.replace(',', '.'))));
  assert.deepEqual(precos, [...precos].sort((a, b) => a - b));
  const url = d.url();
  assert.match(url, /disponivel=1/); assert.match(url, /atributo=Forno/); assert.match(url, /ordem=preco-asc/);
  const d2 = await nova();
  await d2.goto(url, { waitUntil: 'networkidle' });
  assert.deepEqual(await nomes(d2), await nomes(d));
  await d2.context().close();
  await d.click('.chip-ativo:has-text("Forno a lenha")');
  assert.match(await d.textContent('[data-n]'), /^68 artigos/);
  await d.click('.ativos__lista [data-limpar]');
  assert.match(await d.textContent('[data-n]'), /^72 artigos/);
  await d.selectOption('[data-ordem]', 'nome');
  const porNome = await nomes(d);
  assert.deepEqual(porNome, [...porNome].sort(new Intl.Collator('pt').compare));
  ok('filtros de disponibilidade e atributos aplicam, removem e limpam; ordenação por preço e nome; URL reproduz a seleção');

  /* 8–12 */
  await d.evaluate(() => localStorage.clear());
  await ir(d, '/produto/pao-fermentacao-lenta');
  await d.click('[data-q="1"]');
  assert.match(await d.textContent('[data-resumo]'), /2 pães de 750 g \(1,5 kg no total\)/);
  await d.click('[data-add-ficha]');
  await ir(d, '/produto/cabaz-pao-e-horta');
  assert.ok(await d.isVisible('#dentro-titulo'));
  await d.click('[data-add-ficha]');
  assert.equal(await contador(d), '3');
  await d.click('.cab__cesto');
  assert.equal(await subtotal(d), '30,60 €');
  await d.click('[aria-label="Menos uma unidade de Pão de fermentação lenta"]');
  assert.equal(await subtotal(d), '25,80 €');
  await d.keyboard.press('Escape');
  await d.reload({ waitUntil: 'networkidle' });
  assert.equal(await contador(d), '2');
  await d.click('.cab__cesto');
  await d.click('.linha:has-text("Pão de fermentação lenta") [data-l="remover"]');
  assert.equal(await subtotal(d), '21,00 €');
  await d.click('.linha [data-l="remover"]');
  assert.match(await d.textContent('.cesto-vazio'), /O teu cesto ainda está vazio/);
  await d.keyboard.press('Escape');
  await ir(d, '/produto/tomate-coracao-de-boi');
  assert.equal(await d.$('[data-add-ficha]'), null);
  assert.match(await d.textContent('.ficha__indisponivel'), /Volta em junho/);
  ok('cesto: adicionar (30,60 €), reduzir (25,80 €), persistir, remover até vazio; artigo fora de época não se compra');

  /* 13 */
  await ir(d, '/favoritos');
  assert.match(await d.textContent('.vazio'), /Ainda não tens favoritos/);
  await ir(d, '/mercado/fruta');
  await d.click('[data-produto="pera-rocha"] [data-acao="fav"]');
  assert.equal(await d.textContent('[data-num-fav]'), '1');
  await d.reload({ waitUntil: 'networkidle' });
  await ir(d, '/favoritos');
  assert.deepEqual(await d.$$eval('.cartao__nome', (a) => a.map((x) => x.textContent)), ['Pera-rocha']);
  ok('favoritos: estado vazio, guardar, sobreviver à atualização');

  /* 14, 15 */
  await ir(d, '/cabazes/compor?partida=vazio');
  assert.ok(await d.isDisabled('.compor__resumo [data-adicionar]'), 'cabaz vazio não se encomenda');
  await d.click('[data-banca="padaria"]');
  await d.click('.linha-p:has-text("Pão de fermentação lenta") .btn-juntar');
  await d.click('.linha-p:has-text("Broa de milho") .btn-juntar');
  await d.click('[data-banca="horticolas"]');
  await d.click('.linha-p:has-text("Cenouras com rama") .btn-juntar');
  assert.equal(await d.$('.linha-p:has-text("Tomate coração-de-boi") .btn-juntar'), null);
  assert.equal(euros(await d.textContent('.compor__resumo [data-total]')), '10,60 €');
  await d.click('.compor__resumo [data-guardar]');
  await d.fill('[data-confirmar] input[name="nome"]', 'O meu cabaz de sábado');
  await d.click('[data-confirmar] button[type="submit"]');
  assert.match(await d.textContent('.compor__resumo [data-estado]'), /Guardada/);
  assert.equal(await contador(d), '0', 'guardar não põe no cesto');
  await d.click('.compor__resumo [data-adicionar]');
  assert.equal(await contador(d), '1');
  await d.click('.cab__cesto');
  assert.equal(await subtotal(d), '10,60 €');
  await d.click('.linha__editar');
  await d.waitForURL(/\/cabazes\/compor/);
  await d.click('.compor__resumo [aria-label="Tirar da caixa: Broa de milho"]');
  assert.equal(euros(await d.textContent('.compor__resumo [data-total]')), '7,00 €');
  assert.equal(await d.evaluate(() => JSON.parse(localStorage.getItem('dhf-cesto-v2')).linhas[0].itens.length), 3, 'o cesto só muda depois de confirmar');
  await d.click('.compor__resumo [data-atualizar]');
  await d.click('[data-confirmar] [data-res="sim"]');
  await d.click('.cab__cesto');
  assert.equal(await subtotal(d), '7,00 €');
  assert.equal(await d.$$eval('.linha--grupo', (l) => l.length), 1);
  ok('configurador: 10,60 € guardado e no cesto; editado para 7,00 € no mesmo grupo, só após confirmar');

  /* encomenda */
  await d.click('[data-rever]');
  await d.waitForURL('**/encomenda');
  const txt = await d.textContent('[data-encomenda]');
  assert.match(txt, /Cabazes compostos/); assert.match(txt, /Entrega ou recolha/); assert.match(txt, /Por definir/); assert.match(txt, /Demonstração de conceito/);
  assert.equal(euros(await d.textContent('[data-total-final]')), '7,00 €');
  if (OUT) await d.screenshot({ path: `${OUT}/encomenda.png` });
  await d.click('[data-concluir]');
  assert.equal(await d.textContent('[data-msg-final]'), 'Demonstração concluída. Não foi efetuada qualquer cobrança ou encomenda.');
  assert.equal(await contador(d), '0');
  await ir(d, '/cabazes/guardados');
  assert.equal(await d.$$eval('.guardado', (l) => l.length), 1);
  assert.equal(await d.textContent('[data-num-fav]'), '1');
  await ir(d, '/encomenda');
  assert.match(await d.textContent('.vazio'), /Não há nada para rever/);
  ok('encomenda em página própria, sem portes inventados; concluir limpa só o cesto; estado vazio da encomenda');

  /* 16, 17 */
  await ir(d, '/receitas');
  assert.equal(await d.$$eval('.receita-cartao', (a) => a.length), 6);
  await d.click('.receita-cartao:has-text("Torrada de queijo de cabra")');
  await d.waitForURL('**/receitas/torrada-de-queijo-de-cabra-e-compota-de-figo');
  await d.click('.ingr:has-text("pão de centeio") .ingr__rotulo');
  await d.click('.ingr:has-text("compota de figo") .ingr__rotulo');
  assert.match(await d.textContent('[data-add-receita]'), /2 artigos ao cesto · 8,10/);
  await d.click('[data-add-receita]');
  await d.click('.cab__cesto');
  assert.equal(await subtotal(d), '8,10 €');
  await d.keyboard.press('Escape');
  await ir(d, '/receitas/salada-de-grao-tomate-e-salsa');
  assert.match(await d.textContent('.ingr-lista'), /fora de época/);
  await ir(d, '/produtores');
  assert.equal(await d.$$eval('.produtor-cartao', (a) => a.length), 9);
  await d.click('.segmento:has-text("Queijaria")');
  assert.equal(await d.textContent('[data-n]'), '1 produtor');
  await d.click('.produtor-cartao:visible');
  await d.waitForURL('**/produtores/queijaria-da-serra');
  assert.equal(await d.$$eval('.perfil .grelha--catalogo .cartao', (a) => a.length), 7);
  ok('receitas: dois ingredientes = 8,10 €, ingrediente fora de época assinalado; produtores: filtro por atividade e perfil com os seus artigos');

  /* conta, apoio */
  await ir(d, '/conta');
  assert.match(await d.textContent('[data-cartoes]'), /Favoritos/);
  await ir(d, '/ajuda'); assert.equal(await d.textContent('h1'), 'Ajuda');
  await ir(d, '/legal'); assert.match(await d.textContent('.prosa'), /dhf-cesto-v2/);
  ok('a minha área, ajuda e privacidade abrem com conteúdo');

  /* 19 */
  for (const r of ['/mercado/padaria?preco=2-5', '/produto/broa-de-milho', '/produtores/queijaria-da-serra', '/receitas/tiborna-de-azeite-e-alecrim', '/cabazes/guardados', '/encomenda']) {
    await ir(d, r); await d.reload({ waitUntil: 'networkidle' });
    assert.notEqual(await d.textContent('h1'), 'Esta banca não existe', r);
  }
  await ir(d, '/produto/nao-existe');
  assert.equal(await d.textContent('h1'), 'Esta banca não existe');
  const f = await nova();
  await f.route('**/assets/produtos/broa-de-milho.svg', (r) => r.abort());
  await ir(f, '/mercado/padaria');
  await f.waitForSelector('[data-produto="broa-de-milho"] .img-falha');
  await f.context().close();
  ok('links diretos após atualizar, página não encontrada e alternativa visual quando uma imagem falha');

  /* 20 */
  const rotas = ['/', '/mercado', '/mercado/fruta', '/produto/queijo-de-cabra-curado', '/produto/cabaz-pao-e-horta', '/cabazes', '/cabazes/compor?partida=semana', '/produtores', '/produtores/padaria-do-largo', '/receitas/sopa-de-abobora-e-alho-frances', '/encomenda', '/conta', '/ajuda'];
  for (const w of [320, 375, 390, 430, 768, 1024, 1440]) {
    const r = await nova({ viewport: { width: w, height: 800 } });
    for (const rota of rotas) {
      await ir(r, rota);
      const sw = await r.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(sw <= w, `deslocação horizontal a ${w}px em ${rota}: ${sw}`);
    }
    await r.context().close();
  }
  ok(`sem deslocação horizontal em 7 larguras × ${rotas.length} páginas (320 a 1440 px)`);

  /* 21 */
  const m = await nova({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await ir(m, '/');
  await m.click('[data-abrir-menu]');
  await m.click('[data-nivel="mercado"]');
  assert.match(await m.textContent('.painel__trilho'), /Menu › Mercado/);
  await m.keyboard.press('Escape');
  assert.equal(await m.textContent('#painel-menu-titulo'), 'Menu');
  await m.click('[data-nivel="mercado"]');
  await m.click('.painel__link:has-text("Fruta")');
  await m.waitForURL('**/mercado/fruta');
  assert.equal(await m.isVisible('[data-painel-menu]'), false);
  await m.click('[data-abrir-filtros]');
  assert.match(await m.textContent('[data-aplicar]'), /Mostrar 9 resultados/);
  await m.keyboard.press('Escape');
  await m.goBack();
  await m.waitForURL(BASE + '/');
  if (OUT) await m.screenshot({ path: `${OUT}/telemovel-inicio.png` });
  await ir(d, '/');
  await d.focus('[data-sub="mega-mercado"]');
  await d.keyboard.press('Enter');
  assert.ok(await d.isVisible('#mega-mercado'));
  await d.keyboard.press('Tab');
  assert.equal(await d.evaluate(() => document.activeElement.textContent.includes('Hortícolas')), true);
  assert.equal(await d.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2; }), true, 'foco visível');
  await d.keyboard.press('Escape');
  assert.equal(await d.evaluate(() => document.activeElement.dataset.sub), 'mega-mercado');
  await d.focus('.cab__cesto');
  await d.keyboard.press('Enter');
  await d.keyboard.press('Escape');
  assert.equal(await d.evaluate(() => document.activeElement.classList.contains('cab__cesto')), true);
  ok('teclado: megamenu (Enter, Tab, Escape, foco visível e devolvido), cesto; telemóvel: menu por níveis e filtros em painel');

  /* 22 */
  assert.deepEqual([...new Set(erros)], [], 'sem erros de JavaScript');
  ok('sem erros de execução');
  await browser.close();
  console.log(`\n${n} grupos de verificação passaram.`);
})().catch(async (e) => { console.error('\n✗ FALHOU:', e.message); process.exit(1); });

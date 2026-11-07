// Verificação do catálogo (corre como build na Netlify e em `npm run verificar`).
// Falha o processo se algum destino estiver quebrado.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BANCAS, PRODUTORES, PRODUTOS, RECEITAS, COLECOES, PARTIDAS } from '../js/dados/catalogo.js';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const erros = [];
const ok = [];
const verificar = (cond, msg) => (cond ? ok.push(msg) : erros.push(msg));
const prod = new Map(PRODUTOS.map((p) => [p.id, p]));
const prods = new Set(PRODUTORES.map((p) => p.id));
const rec = new Set(RECEITAS.map((r) => r.id));
const ficheiro = (rel) => existsSync(raiz + rel);

verificar(PRODUTOS.length === 72, `72 produtos (há ${PRODUTOS.length})`);
verificar(prod.size === PRODUTOS.length, 'ids de produto únicos');
verificar(new Set(PRODUTOS.map((p) => p.nome)).size === PRODUTOS.length, 'nomes de produto únicos');
verificar(BANCAS.length === 8, `8 bancas (há ${BANCAS.length})`);
for (const b of BANCAS) {
  const n = PRODUTOS.filter((p) => p.banca === b.id).length;
  verificar(n === 9, `banca ${b.id} com 9 artigos (tem ${n})`);
  verificar(ficheiro(`assets/ilustracoes/banca-${b.id}.svg`), `imagem da banca ${b.id}`);
}
for (const p of PRODUTOS) {
  verificar(/^[a-z0-9-]+$/.test(p.id), `id legível ${p.id}`);
  verificar(BANCAS.some((b) => b.id === p.banca), `${p.id}: banca existe`);
  verificar(Number.isInteger(p.preco) && p.preco > 0 && p.preco < 100000, `${p.id}: preço válido em cêntimos`);
  verificar(p.produtores.length > 0 && p.produtores.every((x) => prods.has(x)), `${p.id}: produtores existem`);
  verificar(Array.isArray(p.u) && p.u[0] && p.u[1], `${p.id}: unidade de venda`);
  verificar(p.descricao && p.descricao.length > 30, `${p.id}: descrição própria`);
  verificar(p.alt && p.alt.length > 10, `${p.id}: texto alternativo`);
  verificar(ficheiro(`assets/produtos/${p.id}.svg`), `${p.id}: imagem existe`);
  if (p.par) verificar(p.par.produto ? prod.has(p.par.produto) : rec.has(p.par.receita), `${p.id}: relação editorial válida`);
  (p.colecoes || []).forEach((c) => verificar(COLECOES.some((x) => x.id === c), `${p.id}: coleção ${c} existe`));
  if (p.banca === 'cabazes') {
    verificar(Array.isArray(p.composicao) && p.composicao.length > 0, `${p.id}: cabaz com conteúdo explícito`);
    for (const [id, q] of p.composicao || []) verificar(prod.has(id) && prod.get(id).banca !== 'cabazes' && Number.isInteger(q) && q > 0, `${p.id}: contém ${id}`);
    const soma = (p.composicao || []).reduce((s, [id, q]) => s + prod.get(id).preco * q, 0);
    verificar(soma >= p.preco, `${p.id}: preço do cabaz (${p.preco}) não excede os artigos em separado (${soma})`);
  }
}
const descr = new Set(PRODUTOS.map((p) => p.descricao));
verificar(descr.size === PRODUTOS.length, 'descrições diferentes para cada produto');
const imgs = new Set(PRODUTOS.map((p) => p.id));
verificar(imgs.size === 72, 'uma imagem própria por produto');
// os seis artigos do primeiro protótipo
const originais = { 'pao-fermentacao-lenta': [480, '750 g'], 'broa-de-milho': [360, '500 g'], 'cenouras-com-rama': [220, '500 g'], 'couve-portuguesa': [180], 'cabaz-da-horta': [1650], 'cabaz-pao-e-horta': [2100] };
for (const [id, [preco, med]] of Object.entries(originais)) verificar(prod.get(id)?.preco === preco && (!med || prod.get(id).u[2] === med), `original preservado: ${id}`);
const pe = prod.get('cabaz-pao-e-horta');
verificar(pe.produtores.join() === 'horta-da-ribeira,padaria-do-largo', 'cabaz de pão e horta pertence aos dois produtores originais');
verificar(pe.composicao.some(([id]) => id === 'pao-fermentacao-lenta') && pe.composicao.some(([id]) => id === 'broa-de-milho'), 'cabaz de pão e horta tem pão e broa');
for (const pr of PRODUTORES) {
  verificar(PRODUTOS.some((p) => p.produtores.includes(pr.id)), `produtor ${pr.id} tem artigos`);
  verificar(ficheiro(`assets/ilustracoes/produtor-${pr.id}.svg`), `imagem do produtor ${pr.id}`);
}
verificar(RECEITAS.length === 6, '6 receitas');
for (const r of RECEITAS) {
  verificar(ficheiro(`assets/ilustracoes/receita-${r.id}.svg`), `imagem da receita ${r.id}`);
  verificar(r.porcoes > 0 && r.tempo > 0 && r.passos.length > 0, `${r.id}: porções, tempo e preparação`);
  for (const i of r.ingredientes) if (i.produto) verificar(prod.has(i.produto) && prod.get(i.produto).banca !== 'cabazes' && Number.isInteger(i.compra) && i.compra > 0, `${r.id}: ingrediente ${i.produto}`);
  if (r.acompanha) verificar(prod.has(r.acompanha), `${r.id}: acompanhamento existe`);
}
for (const pt of PARTIDAS) for (const [id, q] of pt.itens) verificar(prod.has(id) && prod.get(id).banca !== 'cabazes' && q > 0, `partida ${pt.id}: ${id}`);
for (const c of COLECOES) verificar(ficheiro(c.imagem), `imagem da coleção ${c.id}`);
for (const f of ['assets/ilustracoes/banca-mercado.svg', 'assets/ilustracoes/cabaz-vazio.svg', 'assets/ilustracoes/cabaz-composicao.svg', 'assets/ilustracoes/cabaz-completo.svg', 'assets/ilustracoes/caixa-fundo.svg', 'assets/ilustracoes/caixa-frente.svg', 'assets/ilustracoes/cabaz-miniatura.svg', 'assets/ilustracoes/cabaz-estudo.svg']) verificar(ficheiro(f), `recurso ${f}`);

console.log(`Catálogo: ${ok.length} verificações passaram.`);
if (erros.length) {
  console.error(`\n${erros.length} problemas:\n- ` + erros.join('\n- '));
  process.exit(1);
}
console.log('72 produtos únicos, 8 bancas × 9 artigos, preços em cêntimos, produtores, receitas, cabazes e imagens sem destinos quebrados.');

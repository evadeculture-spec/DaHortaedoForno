// Índices derivados do catálogo, formatação e pesquisa. Única fonte de preços: PRODUTOS[].preco.
import { BANCAS, PRODUTORES, PRODUTOS, RECEITAS, COLECOES, PARTIDAS, GRUPOS_MERCADO, MES_DO_MERCADO } from '../dados/catalogo.js';

export { BANCAS, PRODUTORES, PRODUTOS, RECEITAS, COLECOES, PARTIDAS, GRUPOS_MERCADO, MES_DO_MERCADO };

export const produto = new Map(PRODUTOS.map((p) => [p.id, p]));
export const banca = new Map(BANCAS.map((b) => [b.id, b]));
export const produtor = new Map(PRODUTORES.map((p) => [p.id, p]));
export const receita = new Map(RECEITAS.map((r) => [r.id, r]));
export const colecao = new Map(COLECOES.map((c) => [c.id, c]));
export const produtosDaBanca = (id) => PRODUTOS.filter((p) => p.banca === id);
export const produtosDoProdutor = (id) => PRODUTOS.filter((p) => p.produtores.includes(id));
export const imagemProduto = (id) => `assets/produtos/${id}.svg`;
export const imagemBanca = (id) => `assets/ilustracoes/banca-${id}.svg`;
export const imagemProdutor = (id) => `assets/ilustracoes/produtor-${id}.svg`;
export const imagemReceita = (id) => `assets/ilustracoes/receita-${id}.svg`;
export const ehCabaz = (id) => produto.get(id)?.banca === 'cabazes';

/* ---------- época e disponibilidade (calculadas a partir de `epoca` e do mês do mercado) ---------- */
export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
/** “Junho a outubro” → [6, 10]; “Todo o ano” → null */
export function mesesDe(epoca) {
  const r = /^(\p{L}+) a (\p{L}+)/u.exec(epoca || '');
  if (!r) return null;
  const a = MESES.indexOf(r[1].toLowerCase()) + 1, b = MESES.indexOf(r[2].toLowerCase()) + 1;
  return a && b ? [a, b] : null;
}
const dentro = ([a, b], m) => (a <= b ? m >= a && m <= b : m >= a || m <= b);
/** { estado: 'disponivel' | 'fim' | 'fora', rotulo, nota } */
export function disponibilidade(p) {
  const m = mesesDe(p.epoca);
  if (!m) return { estado: 'disponivel', rotulo: 'Disponível', nota: p.epoca ? p.epoca : '' };
  if (!dentro(m, MES_DO_MERCADO)) return { estado: 'fora', rotulo: 'Fora de época', nota: `Volta em ${MESES[m[0] - 1]}` };
  if (m[1] === MES_DO_MERCADO) return { estado: 'fim', rotulo: 'Fim de época', nota: `Última colheita em ${MESES[m[1] - 1]}` };
  return { estado: 'disponivel', rotulo: 'Da época', nota: `Época: ${p.epoca.toLowerCase()}` };
}
export const disponivel = (id) => disponibilidade(produto.get(id)).estado !== 'fora';
export const daEpoca = (p) => !!mesesDe(p.epoca) && disponivel(p.id);
/** Atributos do produto: os da ficha e “Da época”, quando se aplica. */
export const etiquetas = (p) => [...(daEpoca(p) ? ['Da época'] : []), ...(p.etiquetas || [])];
export const TODAS_ETIQUETAS = ['Da época', ...new Set(PRODUTOS.flatMap((p) => p.etiquetas || []))];

/* ---------- dinheiro e quantidades ---------- */
const moeda = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
export const euros = (c) => moeda.format(Math.round(c) / 100);
export const preco = (id) => produto.get(id).preco;
/** soma de [[id, qtd], …] em cêntimos */
export const somaItens = (itens) => itens.reduce((s, [id, q]) => s + preco(id) * q, 0);
export const contaItens = (itens) => itens.reduce((s, [, q]) => s + q, 0);

const num = (v) => String(Math.round(v * 100) / 100).replace('.', ',');
/** “500 g” → {v: 500, un: 'g', aprox: false}; “c. 1,2 kg” → aprox */
function medida(m) {
  const r = /^(c\. )?(\d+(?:,\d+)?) (g|kg|ml|l)$/.exec(m || '');
  if (!r) return null;
  let v = parseFloat(r[2].replace(',', '.'));
  let un = r[3];
  if (un === 'kg') { v *= 1000; un = 'g'; }
  if (un === 'l') { v *= 1000; un = 'ml'; }
  return { v, un, aprox: !!r[1] };
}
function total(m, n) {
  const md = medida(m);
  if (!md) return '';
  const v = md.v * n;
  const txt = md.un === 'g' ? (v >= 1000 ? `${num(v / 1000)} kg` : `${num(v)} g`) : v >= 1000 ? `${num(v / 1000)} l` : `${num(v)} ml`;
  return (md.aprox ? 'c. ' : '') + txt;
}
/** “1 molho de 500 g”, “2 molhos de 500 g”, “1 couve (c. 1 kg)”, “3 cabazes” */
export function unidades(p, n = 1) {
  const [s, pl, m, lig = 'de'] = p.u;
  const nome = n === 1 ? s : pl;
  if (!m) return `${n} ${nome}`;
  return lig === '(' ? `${n} ${nome} (${m})` : `${n} ${nome} de ${m}`;
}
/** Total físico quando há mais de uma unidade: “1 kg no total” */
export function totalFisico(p, n) {
  if (n < 2 || !p.u[2]) return '';
  const t = total(p.u[2], n);
  return t ? `${t} no total` : '';
}
/** Formato curto do cartão: “Molho de 500 g”, “Unidade (c. 1 kg)”, “Cabaz com 6 artigos” */
export function formato(p) {
  if (p.composicao) return `Cabaz com ${contaItens(p.composicao)} artigos`;
  const [s, , m, lig = 'de'] = p.u;
  if (!m) return 'Unidade';
  if (lig === '(') return `Unidade (${m})`;
  return `${s[0].toUpperCase()}${s.slice(1)} de ${m}`;
}
export const nomesProdutores = (p) => p.produtores.map((id) => produtor.get(id).nome);

/* ---------- pesquisa (sem acentos, por produto, banca e produtor) ---------- */
export const normalizar = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[-–—/.,;:()«»"']/g, ' ').replace(/\s+/g, ' ').trim();
const SINONIMOS = { padaria: 'pao paes', 'ovos-e-lacticinios': 'leite queijo', 'ervas-aromaticas': 'erva ervas tempero', fruta: 'frutas', horticolas: 'legumes verduras horta', mercearia: 'despensa', 'conservas-e-doces': 'doce compota frasco', cabazes: 'cabaz caixa' };
const VAZIAS = new Set(['para', 'com', 'que', 'uma', 'dos', 'das', 'por', 'mais', 'como', 'sem', 'num', 'numa', 'aos', 'nas', 'nos', 'ate']);
const indice = PRODUTOS.map((p) => {
  const b = banca.get(p.banca);
  const nome = normalizar(p.nome);
  const resto = normalizar([b.nome, SINONIMOS[p.banca] || '', ...nomesProdutores(p), ...(p.etiquetas || [])].join(' '));
  const desc = normalizar(`${p.descricao} ${p.ingredientes || ''}`).split(' ').filter((w) => w.length > 3 && !VAZIAS.has(w));
  return { p, nome, palavrasNome: nome.split(' '), palavras: (nome + ' ' + resto).split(' '), desc };
});
const prefixo = (palavras, t) => palavras.some((w) => w.startsWith(t));

/** Devolve produtos ordenados por relevância: nome, depois banca/produtor/atributos, depois descrição. */
export function pesquisarProdutos(q) {
  const termos = normalizar(q).split(' ').filter(Boolean);
  if (!termos.length) return [];
  const res = [];
  for (const e of indice) {
    let pont = 0, falhou = false;
    for (const t of termos) {
      if (e.palavrasNome[0].startsWith(t)) pont += 8;
      else if (prefixo(e.palavrasNome, t)) pont += 6;
      else if (prefixo(e.palavras, t)) pont += 3;
      else if (t.length > 3 && prefixo(e.desc, t)) pont += 1;
      else { falhou = true; break; }
    }
    if (falhou) continue;
    if (e.p.banca === 'cabazes') pont -= 1;
    res.push([pont, e.p]);
  }
  return res.sort((a, b) => b[0] - a[0] || a[1].nome.localeCompare(b[1].nome, 'pt')).map(([, p]) => p);
}
export function pesquisarBancas(q) {
  const t = normalizar(q).split(' ').filter(Boolean);
  if (!t.length) return [];
  return BANCAS.filter((b) => { const w = normalizar(b.nome + ' ' + (SINONIMOS[b.id] || '')).split(' '); return t.every((x) => prefixo(w, x)); });
}
export function pesquisarProdutores(q) {
  const t = normalizar(q).split(' ').filter(Boolean);
  if (!t.length) return [];
  return PRODUTORES.filter((p) => { const w = normalizar(`${p.nome} ${p.atividadeNome} ${p.regiao}`).split(' '); return t.every((x) => prefixo(w, x)); });
}

// Estado da loja: cesto (artigos e cabazes compostos), favoritos e composições guardadas.
// Guardado no navegador quando possível; migra o cesto do primeiro protótipo (dhf-cesto-v1).
import { produto, preco, somaItens, ehCabaz, disponivel } from './catalogo.js';

const K = { cesto: 'dhf-cesto-v2', antigo: 'dhf-cesto-v1', fav: 'dhf-favoritos-v1', comp: 'dhf-composicoes-v1', rascunho: 'dhf-rascunho-v1' };
export const MAX = 20;

const ler = (k, padrao) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; }
};
const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento: vive só nesta visita */ } };
const remover = (k) => { try { localStorage.removeItem(k); } catch (e) { /* idem */ } };
const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const itensValidos = (itens) => (Array.isArray(itens) ? itens : [])
  .filter((x) => Array.isArray(x) && produto.has(x[0]) && !ehCabaz(x[0]) && disponivel(x[0]) && Number.isInteger(x[1]) && x[1] > 0)
  .map(([id, q]) => [id, Math.min(q, MAX)]);

function carregarCesto() {
  const v2 = ler(K.cesto, null);
  if (v2 && Array.isArray(v2.linhas)) {
    return v2.linhas.filter((l) => (l.tipo === 'produto' ? produto.has(l.id) && disponivel(l.id) && l.qtd > 0 : l.tipo === 'composicao' && itensValidos(l.itens).length))
      .map((l) => (l.tipo === 'produto' ? { tipo: 'produto', id: l.id, qtd: Math.min(l.qtd | 0, MAX) } : { ...l, itens: itensValidos(l.itens), qtd: Math.min(Math.max(1, l.qtd | 0), MAX) }));
  }
  // migração simples do protótipo anterior: {id: quantidade}
  const v1 = ler(K.antigo, null);
  if (v1 && typeof v1 === 'object') {
    const linhas = Object.entries(v1).filter(([id, q]) => produto.has(id) && disponivel(id) && Number.isInteger(q) && q > 0).map(([id, q]) => ({ tipo: 'produto', id, qtd: Math.min(q, MAX) }));
    gravar(K.cesto, { linhas });
    remover(K.antigo);
    return linhas;
  }
  return [];
}

const s = {
  linhas: carregarCesto(),
  favoritos: ler(K.fav, []).filter((id) => produto.has(id)),
  composicoes: ler(K.comp, []).filter((c) => c && c.cid && itensValidos(c.itens).length).map((c) => ({ ...c, itens: itensValidos(c.itens) })),
};

const ouvintes = new Set();
export const ouvir = (fn) => { ouvintes.add(fn); return () => ouvintes.delete(fn); };
function mudou(o) {
  if (o.cesto) gravar(K.cesto, { linhas: s.linhas });
  if (o.fav) gravar(K.fav, s.favoritos);
  if (o.comp) gravar(K.comp, s.composicoes);
  ouvintes.forEach((fn) => fn(o));
}
window.addEventListener('storage', (e) => {
  if (e.key === K.cesto) { s.linhas = carregarCesto(); ouvintes.forEach((fn) => fn({ cesto: true })); }
  if (e.key === K.fav) { s.favoritos = ler(K.fav, []); ouvintes.forEach((fn) => fn({ fav: true })); }
  if (e.key === K.comp) { s.composicoes = ler(K.comp, []); ouvintes.forEach((fn) => fn({ comp: true })); }
});

/* ---------- cesto ---------- */
export const linhas = () => s.linhas;
export const qtdProduto = (id) => s.linhas.find((l) => l.tipo === 'produto' && l.id === id)?.qtd || 0;
/** Unidades no ícone do cesto: artigos avulsos + cabazes (o conteúdo de um cabaz não volta a contar). */
export const unidades = () => s.linhas.reduce((n, l) => n + l.qtd, 0);
export const precoLinha = (l) => (l.tipo === 'produto' ? preco(l.id) : somaItens(l.itens)) * l.qtd;
export const subtotal = () => s.linhas.reduce((t, l) => t + precoLinha(l), 0);
export const grupo = (gid) => s.linhas.find((l) => l.tipo === 'composicao' && l.gid === gid);

export function definirProduto(id, qtd) {
  qtd = disponivel(id) ? Math.max(0, Math.min(MAX, qtd | 0)) : 0;
  const i = s.linhas.findIndex((l) => l.tipo === 'produto' && l.id === id);
  if (i < 0 && qtd > 0) s.linhas.push({ tipo: 'produto', id, qtd });
  else if (i >= 0 && qtd === 0) s.linhas.splice(i, 1);
  else if (i >= 0) s.linhas[i].qtd = qtd;
  mudou({ cesto: true, id });
  return qtd;
}
export const adicionarProduto = (id, n = 1) => definirProduto(id, qtdProduto(id) + n);
/** Adiciona vários produtos numa só ação (receitas). */
export function adicionarVarios(pares) {
  for (const [id, n] of pares) {
    if (!disponivel(id)) continue;
    const l = s.linhas.find((x) => x.tipo === 'produto' && x.id === id);
    if (l) l.qtd = Math.min(MAX, l.qtd + n);
    else s.linhas.push({ tipo: 'produto', id, qtd: Math.min(MAX, n) });
  }
  mudou({ cesto: true });
}
export function adicionarComposicao({ nome, itens, cid = null }) {
  const gid = uid('g');
  s.linhas.push({ tipo: 'composicao', gid, nome: nome || 'O meu cabaz', itens: itensValidos(itens), qtd: 1, cid });
  mudou({ cesto: true, gid });
  return gid;
}
export function substituirComposicao(gid, { nome, itens }) {
  const g = grupo(gid);
  if (!g) return false;
  g.itens = itensValidos(itens);
  if (nome) g.nome = nome;
  mudou({ cesto: true, gid });
  return true;
}
export function definirGrupo(gid, qtd) {
  const i = s.linhas.findIndex((l) => l.gid === gid);
  if (i < 0) return;
  qtd = Math.max(0, Math.min(MAX, qtd | 0));
  if (qtd === 0) s.linhas.splice(i, 1);
  else s.linhas[i].qtd = qtd;
  mudou({ cesto: true, gid });
}
export function limparCesto() {
  s.linhas = [];
  mudou({ cesto: true });
}

export function apagarTudo() {
  s.linhas = []; s.favoritos = []; s.composicoes = [];
  remover(K.rascunho);
  mudou({ cesto: true, fav: true, comp: true });
}

/* ---------- favoritos ---------- */
export const favoritos = () => s.favoritos;
export const ehFavorito = (id) => s.favoritos.includes(id);
export function alternarFavorito(id) {
  if (ehFavorito(id)) s.favoritos = s.favoritos.filter((x) => x !== id);
  else s.favoritos = [...s.favoritos, id];
  mudou({ fav: true, id });
  return ehFavorito(id);
}

/* ---------- composições guardadas (cada uma com id próprio, mesmo com nomes iguais) ---------- */
export const composicoes = () => s.composicoes;
export const composicao = (cid) => s.composicoes.find((c) => c.cid === cid);
export function guardarComposicao({ nome, itens, cid = null }) {
  const agora = new Date().toISOString();
  const limpos = itensValidos(itens);
  const existente = cid && composicao(cid);
  if (existente) Object.assign(existente, { nome, itens: limpos, atualizada: agora });
  else { cid = uid('c'); s.composicoes.unshift({ cid, nome, itens: limpos, criada: agora, atualizada: agora }); }
  mudou({ comp: true, cid });
  return cid;
}
export function apagarComposicao(cid) {
  s.composicoes = s.composicoes.filter((c) => c.cid !== cid);
  mudou({ comp: true });
}

/* ---------- rascunho do configurador (sobrevive a uma atualização da página) ---------- */
export const lerRascunho = () => ler(K.rascunho, null);
export const gravarRascunho = (r) => gravar(K.rascunho, r);
export const apagarRascunho = () => remover(K.rascunho);

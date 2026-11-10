// Componentes partilhados: escape, ícones, imagens, cartão de produto, controlo de compra, anúncios.
import { href } from '../router.js';
import * as C from '../loja/catalogo.js';
import * as E from '../loja/estado.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const L = (caminho) => esc(href(caminho));
export const icone = (id, cls = '') => `<svg class="icon ${cls}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

/** Imagem com dimensões reservadas; diferida por omissão. */
export function img(src, alt, w, h, { cls = '', prioridade = false } = {}) {
  const carga = prioridade ? 'fetchpriority="high"' : 'loading="lazy"';
  return `<img class="ske ${cls}" src="${esc(src)}" alt="${esc(alt)}" width="${w}" height="${h}" ${carga} decoding="async" data-protegida>`;
}
/** Alternativa visual quando uma imagem falha (fica a forma e o nome). */
export function protegerImagens(raiz = document) {
  $$('img[data-protegida]', raiz).forEach((im) => {
    im.removeAttribute('data-protegida');
    const falhar = () => {
      const caixa = im.parentElement;
      if (!caixa || caixa.querySelector('.img-falha')) return;
      caixa.classList.add('tem-falha');
      im.setAttribute('aria-hidden', 'true');
      caixa.insertAdjacentHTML('beforeend', `<span class="img-falha" role="img" aria-label="${esc(im.alt || 'Imagem indisponível')}">${icone('cesto')}<span aria-hidden="true">${esc(im.alt ? im.alt.split(',')[0] : '')}</span></span>`);
    };
    const pronta = () => im.classList.add('is-ok');
    im.addEventListener('error', () => { pronta(); falhar(); }, { once: true });
    im.addEventListener('load', pronta, { once: true });
    if (im.complete) { pronta(); if (im.naturalWidth === 0 && im.getAttribute('src')) falhar(); }
  });
}

/* ---------- anúncios e confirmação discreta ---------- */
let tAnuncio;
export function anunciar(texto) {
  const r = $('[data-anuncio]');
  clearTimeout(tAnuncio);
  r.textContent = '';
  tAnuncio = setTimeout(() => { r.textContent = texto; }, 50);
}
let tToast;
export function confirmar(html, { acao = true } = {}) {
  const t = $('[data-toast]');
  t.innerHTML = `<p>${icone('visto')}<span>${html}</span>${acao ? `<button type="button" class="toast__acao" data-abrir-cesto>Ver cesto</button>` : ''}</p>`;
  t.hidden = false;
  t.classList.remove('is-saindo');
  clearTimeout(tToast);
  tToast = setTimeout(() => { t.classList.add('is-saindo'); setTimeout(() => { t.hidden = true; }, 250); }, 3600);
}
export function darPeso() {
  $$('[data-cesto-botao]').forEach((b) => {
    b.classList.remove('is-pesado');
    void b.offsetWidth;
    b.classList.add('is-pesado');
  });
}

/* ---------- controlo de compra: “Adicionar” que passa a seletor de quantidade ---------- */
export function selo(p, { sempre = false } = {}) {
  const d = C.disponibilidade(p);
  if (d.estado === 'disponivel' && !sempre) return '';
  const cls = d.estado === 'fim' ? ' selo--fim' : d.estado === 'fora' ? ' selo--fora' : '';
  return `<span class="selo${cls}">${esc(d.estado === 'fora' && sempre ? `${d.rotulo} · ${d.nota.toLowerCase()}` : d.rotulo)}</span>`;
}
export function controloCompra(p, { rotulo = 'Adicionar' } = {}) {
  if (!C.disponivel(p.id)) return `<span class="indisponivel">Indisponível</span>`;
  const q = E.qtdProduto(p.id);
  const nome = esc(p.nome);
  if (!q) return `<button type="button" class="btn-add" data-acao="add" data-id="${p.id}">${icone('mais')}<span>${rotulo}</span><span class="sr-only"> ${nome} ao cesto</span></button>`;
  return `<div class="passo" role="group" aria-label="${nome} no cesto">
    <button type="button" class="passo__btn" data-acao="menos" data-id="${p.id}" aria-label="${q === 1 ? 'Retirar' : 'Menos uma unidade de'} ${nome}">${icone(q === 1 ? 'remover' : 'menos')}</button>
    <span class="passo__n"><span aria-hidden="true">${q}</span><span class="sr-only">${q} no cesto</span></span>
    <button type="button" class="passo__btn" data-acao="mais" data-id="${p.id}" aria-label="Mais uma unidade de ${nome}"${q >= E.MAX ? ' disabled' : ''}>${icone('mais')}</button>
  </div>`;
}
export function botaoFavorito(p, cls = 'fav') {
  const on = E.ehFavorito(p.id);
  return `<button type="button" class="${cls}" data-acao="fav" data-id="${p.id}" aria-pressed="${on}">${icone(on ? 'coracao-cheio' : 'coracao')}<span class="sr-only">Guardar ${esc(p.nome)} nos favoritos</span></button>`;
}

/** Cartão de produto da grelha comercial. */
export function cartao(p, { prioridade = false, cabecalho = 'h3' } = {}) {
  const prods = C.nomesProdutores(p).join(' e ');
  const s = selo(p);
  return `<article class="cartao${C.disponivel(p.id) ? '' : ' is-fora'}" data-produto="${p.id}">
    <div class="cartao__media">${img(C.imagemProduto(p.id), p.alt, 600, 450, { prioridade })}${s ? `<span class="cartao__selo">${s}</span>` : ''}</div>
    <div class="cartao__corpo">
      <p class="cartao__produtor">${esc(prods)}</p>
      <${cabecalho} class="cartao__nome"><a href="${L('/produto/' + p.id)}">${esc(p.nome)}</a></${cabecalho}>
      <p class="cartao__formato">${esc(C.formato(p))}${C.disponivel(p.id) ? '' : ` · ${esc(C.disponibilidade(p).nota.toLowerCase())}`}</p>
      <div class="cartao__compra"><p class="preco">${C.euros(p.preco)}</p><div class="cartao__acao" data-compra="${p.id}">${controloCompra(p)}</div></div>
    </div>
    <div class="cartao__fav" data-fav-de="${p.id}">${botaoFavorito(p)}</div>
  </article>`;
}

/** Atualiza controlos de compra e favoritos visíveis após uma mudança de estado. */
export function atualizarControlos(raiz = document) {
  $$('[data-compra]', raiz).forEach((el) => {
    const p = C.produto.get(el.dataset.compra);
    const rot = el.dataset.rotulo || 'Adicionar';
    const html = controloCompra(p, { rotulo: rot });
    if (el.innerHTML !== html) el.innerHTML = html;
  });
  $$('[data-fav-de]', raiz).forEach((el) => {
    const p = C.produto.get(el.dataset.favDe);
    const cls = el.dataset.favCls || 'fav';
    el.innerHTML = botaoFavorito(p, cls);
  });
}

/** Liga os cliques de compra e favoritos dentro de uma raiz (delegação). */
export function ligarCompras(raiz) {
  raiz.addEventListener('click', (e) => {
    const b = e.target.closest('[data-acao]');
    if (!b || !raiz.contains(b)) return;
    const id = b.dataset.id;
    const p = C.produto.get(id);
    if (!p) return;
    const acao = b.dataset.acao;
    if (acao === 'fav') {
      const on = E.alternarFavorito(id);
      anunciar(on ? `${p.nome} guardado nos favoritos.` : `${p.nome} retirado dos favoritos.`);
      const novo = raiz.querySelector(`[data-fav-de="${id}"] button`) || document.querySelector(`[data-fav-de="${id}"] button`);
      novo?.focus();
      if (on) novo?.classList.add('is-pop');
      return;
    }
    if (!['add', 'mais', 'menos'].includes(acao)) return;
    const caixa = b.closest('[data-compra]');
    const antes = E.qtdProduto(id);
    const depois = acao === 'menos' ? E.definirProduto(id, antes - 1) : E.adicionarProduto(id, 1);
    if (depois > antes) {
      darPeso();
      if (acao === 'add') confirmar(`Adicionado: <strong>${esc(p.nome)}</strong> · ${esc(C.unidades(p, 1))}`);
      anunciar(`${p.nome}: ${C.unidades(p, depois)} no cesto. Total no cesto: ${E.unidades()} ${E.unidades() === 1 ? 'unidade' : 'unidades'}.`);
    } else if (depois < antes) {
      anunciar(depois ? `${p.nome}: ${C.unidades(p, depois)} no cesto.` : `${p.nome} retirado do cesto.`);
    }
    // devolve o foco ao controlo equivalente depois de redesenhar
    const alvo = caixa && (depois === 0 ? caixa.querySelector('[data-acao="add"]') : caixa.querySelector(`[data-acao="${acao === 'menos' ? 'menos' : 'mais'}"]`) || caixa.querySelector('[data-acao="mais"]'));
    alvo?.focus();
  });
}

/** Linha de compra rápida (balcão da página inicial). */
export function rapido(p) {
  return `<li class="rapido" data-produto="${p.id}">
    <span class="rapido__img">${img(C.imagemProduto(p.id), '', 600, 450, { prioridade: true })}</span>
    <span class="rapido__txt"><a class="rapido__nome" href="${L('/produto/' + p.id)}">${esc(p.nome)}</a><span class="rapido__meta"><strong>${C.euros(p.preco)}</strong> · ${esc(C.formato(p))}</span></span>
    <span class="rapido__acao" data-compra="${p.id}">${controloCompra(p)}</span>
  </li>`;
}

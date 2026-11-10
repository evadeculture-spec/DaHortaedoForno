// Cabeçalho: pesquisa com sugestões, megamenu “Mercado”, menu “Cabazes”, painel móvel por níveis, rodapé.
import * as C from '../loja/catalogo.js';
import * as E from '../loja/estado.js';
import { navegar, href } from '../router.js';
import { esc, L, icone, $, $$ } from './comum.js';

/* ───────── pesquisa (combobox) ───────── */
export function criarPesquisa(contentor, id, aoEscolher = () => {}) {
  contentor.innerHTML = `<form class="pesquisa" role="search" action="${L('/pesquisa')}" data-form-pesquisa>
    <label class="sr-only" for="${id}">Pesquisar no mercado</label>
    <span class="pesquisa__icone" aria-hidden="true">${icone('lupa')}</span>
    <input id="${id}" class="pesquisa__campo" type="search" name="q" autocomplete="off" spellcheck="false" enterkeyhint="search"
      placeholder="Pesquisar pão, fruta, produtores…" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-lista">
    <button class="pesquisa__limpar" type="button" data-limpar-pesquisa hidden>${icone('fechar')}<span class="sr-only">Limpar pesquisa</span></button>
    <button class="pesquisa__ir" type="submit"><span class="sr-only">Pesquisar</span>${icone('seta-dir')}</button>
    <div class="sugestoes" id="${id}-lista" role="listbox" aria-label="Sugestões de pesquisa" hidden></div>
  </form>`;
  const form = $('form', contentor), campo = $('input', contentor), lista = $('.sugestoes', contentor);
  let ops = [], ativa = -1;
  const fechar = () => { lista.hidden = true; campo.setAttribute('aria-expanded', 'false'); campo.removeAttribute('aria-activedescendant'); ativa = -1; };
  const ir = (destino) => { fechar(); campo.blur(); aoEscolher(); navegar(destino); };
  function marcar(i) {
    ativa = i;
    ops.forEach((o, k) => o.setAttribute('aria-selected', String(k === i)));
    if (i >= 0) { campo.setAttribute('aria-activedescendant', ops[i].id); ops[i].scrollIntoView({ block: 'nearest' }); } else campo.removeAttribute('aria-activedescendant');
  }
  function sugerir() {
    const q = campo.value.trim();
    if (q.length < 2) return fechar();
    const prods = C.pesquisarProdutos(q).slice(0, 6), bancas = C.pesquisarBancas(q).slice(0, 3), prs = C.pesquisarProdutores(q).slice(0, 3);
    let i = 0;
    const op = (destino, html) => `<div class="sug" role="option" id="${id}-op${i++}" aria-selected="false" data-destino="${esc(destino)}">${html}</div>`;
    const grupo = (t, itens) => (itens.length ? `<div class="sug__grupo" role="group" aria-label="${t}"><p class="sug__titulo" aria-hidden="true">${t}</p>${itens.join('')}</div>` : '');
    lista.innerHTML =
      grupo('Produtos', prods.map((p) => op('/produto/' + p.id, `<img src="${C.imagemProduto(p.id)}" alt="" width="48" height="36" loading="lazy"><span class="sug__txt"><strong>${esc(p.nome)}</strong><span>${esc(C.banca.get(p.banca).nome)} · ${esc(C.formato(p))}</span></span><span class="sug__preco">${C.euros(p.preco)}</span>`))) +
      grupo('Bancas', bancas.map((b) => op('/mercado/' + b.id, `<span class="sug__icone">${icone(b.icone)}</span><span class="sug__txt"><strong>${esc(b.nome)}</strong><span>${C.produtosDaBanca(b.id).length} artigos</span></span>`))) +
      grupo('Produtores', prs.map((p) => op('/produtores/' + p.id, `<span class="sug__icone">${icone('pin')}</span><span class="sug__txt"><strong>${esc(p.nome)}</strong><span>${esc(p.atividadeNome)} · ${esc(p.regiao)}</span></span>`))) +
      `<div class="sug__grupo" role="group" aria-label="Todos os resultados">${op('/pesquisa?q=' + encodeURIComponent(q), `<span class="sug__icone">${icone('lupa')}</span><span class="sug__txt"><strong>${prods.length || bancas.length || prs.length ? 'Ver todos os resultados' : 'Sem sugestões'} para «${esc(q)}»</strong><span>${prods.length || bancas.length || prs.length ? 'Abre a página de resultados com filtros' : 'Abre a pesquisa para experimentar outra palavra'}</span></span>`)}</div>`;
    ops = $$('[role="option"]', lista);
    lista.hidden = false;
    campo.setAttribute('aria-expanded', 'true');
    marcar(-1);
  }
  const limpar = $('[data-limpar-pesquisa]', contentor);
  const verLimpar = () => { limpar.hidden = !campo.value; };
  limpar.addEventListener('click', () => { campo.value = ''; verLimpar(); fechar(); campo.focus(); });
  campo.addEventListener('input', () => { verLimpar(); sugerir(); });
  campo.addEventListener('focus', () => { if (campo.value.trim().length >= 2) sugerir(); });
  campo.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (lista.hidden) sugerir();
      if (!ops.length) return;
      e.preventDefault();
      marcar(e.key === 'ArrowDown' ? (ativa + 1) % ops.length : (ativa - 1 + ops.length) % ops.length);
    } else if (e.key === 'Enter' && ativa >= 0 && !lista.hidden) {
      e.preventDefault();
      ir(ops[ativa].dataset.destino);
    } else if (e.key === 'Escape' && !lista.hidden) {
      e.preventDefault(); e.stopPropagation(); fechar();
    }
  });
  lista.addEventListener('mousedown', (e) => e.preventDefault()); // não perde o foco antes do clique
  lista.addEventListener('click', (e) => { const o = e.target.closest('[role="option"]'); if (o) ir(o.dataset.destino); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = campo.value.trim();
    ir(q ? `/pesquisa?q=${encodeURIComponent(q)}` : '/mercado');
  });
  campo.addEventListener('blur', () => setTimeout(() => { if (!contentor.contains(document.activeElement)) fechar(); }, 120));
  return { campo, definir: (v) => { campo.value = v || ''; verLimpar(); } };
}

/* ───────── navegação principal ───────── */
const n = (id) => C.produtosDaBanca(id).length;
function megaHTML() {
  const col = C.colecao.get('outono');
  const nCol = C.PRODUTOS.filter((p) => (p.colecoes || []).includes('outono')).length;
  const coluna = (g) => `<div class="mega__col"><p class="mega__titulo">${esc(g.nome)}</p><ul>${C.BANCAS.filter((b) => b.grupo === g.id).map((b) => `<li><a class="mega__link" href="${L('/mercado/' + b.id)}">${icone(b.icone)}<span>${esc(b.nome)}</span><span class="mega__n">${n(b.id)}</span></a></li>`).join('')}
    ${g.id === 'levar' ? `<li><a class="mega__todos" href="${L('/mercado')}">Ver todo o mercado<span class="mega__n">${C.PRODUTOS.length}</span>${icone('seta-dir')}</a></li>` : ''}</ul></div>`;
  return `<div class="mega__in wrap">${C.GRUPOS_MERCADO.map(coluna).join('')}
    <a class="mega__destaque" href="${L('/mercado?colecao=outono')}"><img src="${col.imagem}" alt="${esc(col.alt)}" width="640" height="400" loading="lazy"><span class="mega__destaque-txt"><strong>${esc(col.nome)}</strong><span>${esc(col.resumo)}</span><span class="mega__destaque-n">${nCol} artigos ${icone('seta-dir')}</span></span></a></div>`;
}
function cabazesHTML() {
  const k = E.composicoes().length;
  return `<ul class="submenu__lista">
    <li><a class="submenu__link" href="${L('/cabazes')}">${icone('caixa')}<span><strong>Cabazes prontos</strong><span>${n('cabazes')} caixas com conteúdo indicado e preço fechado</span></span></a></li>
    <li><a class="submenu__link" href="${L('/cabazes/compor')}">${icone('editar')}<span><strong>Compor o meu cabaz</strong><span>Escolhes artigo a artigo; pagas a soma</span></span></a></li>
    <li><a class="submenu__link" href="${L('/cabazes/guardados')}">${icone('guardar')}<span><strong>Cabazes guardados</strong><span data-n-guardados>${k ? `${k} ${k === 1 ? 'composição' : 'composições'}` : 'Nenhum ainda'}</span></span></a></li>
  </ul>`;
}
export function desenharNav() {
  const nav = $('[data-nav]');
  nav.innerHTML = `<div class="wrap"><ul class="nav">
    <li class="nav__item"><button type="button" class="nav__btn" aria-expanded="false" aria-controls="mega-mercado" data-sub="mega-mercado" data-secao="mercado">Mercado${icone('chevron-baixo')}</button>
      <div class="mega" id="mega-mercado" hidden>${megaHTML()}</div></li>
    <li class="nav__item nav__item--rel"><button type="button" class="nav__btn" aria-expanded="false" aria-controls="menu-cabazes" data-sub="menu-cabazes" data-secao="cabazes">Cabazes${icone('chevron-baixo')}</button>
      <div class="submenu" id="menu-cabazes" hidden>${cabazesHTML()}</div></li>
    <li><a class="nav__link" href="${L('/produtores')}" data-secao="produtores">Produtores</a></li>
    <li><a class="nav__link" href="${L('/receitas')}" data-secao="receitas">Receitas</a></li>
    <li><a class="nav__link" href="${L('/a-marca')}" data-secao="a-marca">A marca</a></li>
  </ul></div>`;
  let aberto = null;
  const fechar = (devolver) => {
    if (!aberto) return;
    const b = $(`[data-sub="${aberto}"]`, nav);
    $('#' + aberto).hidden = true;
    b.setAttribute('aria-expanded', 'false');
    if (devolver) b.focus();
    aberto = null;
  };
  nav.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sub]');
    if (b) {
      const id = b.dataset.sub;
      const era = aberto === id;
      fechar(false);
      if (!era) {
        if (id === 'menu-cabazes') $('#menu-cabazes').innerHTML = cabazesHTML();
        $('#' + id).hidden = false; b.setAttribute('aria-expanded', 'true'); aberto = id;
      }
      return;
    }
    if (e.target.closest('a')) fechar(false);
  });
  document.addEventListener('click', (e) => { if (aberto && !nav.contains(e.target)) fechar(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && aberto) { e.preventDefault(); fechar(true); } });
  nav.addEventListener('focusout', (e) => { if (aberto && e.relatedTarget && !nav.contains(e.relatedTarget)) fechar(false); });
  return { fechar: () => fechar(false) };
}
export function marcarSecao(caminho) {
  const s = caminho.split('/')[1] || '';
  const sec = s === 'produto' || s === 'pesquisa' ? 'mercado' : s;
  $$('[data-secao]').forEach((el) => { if (el.dataset.secao === sec) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current'); });
}

/* ───────── painel móvel com níveis ───────── */
export function iniciarPainel() {
  const d = $('[data-painel-menu]');
  const btn = $('[data-abrir-menu]');
  let nivel = 'raiz';
  const item = (destino, conteudo) => `<li><a class="painel__link" href="${L(destino)}">${conteudo}</a></li>`;
  function desenhar() {
    const voltar = nivel !== 'raiz' ? `<button type="button" class="painel__voltar" data-nivel="raiz">${icone('chevron-esq')}Menu</button>` : '';
    const trilho = nivel === 'raiz' ? 'Menu' : nivel === 'mercado' ? 'Menu › Mercado' : 'Menu › Cabazes';
    let corpo = '';
    if (nivel === 'raiz') {
      corpo = `<ul class="painel__lista">
        <li><button type="button" class="painel__link" data-nivel="mercado">${icone('cesto')}<span>Mercado</span><span class="painel__n">${C.BANCAS.length} bancas</span>${icone('chevron-dir')}</button></li>
        <li><button type="button" class="painel__link" data-nivel="cabazes">${icone('caixa')}<span>Cabazes</span>${icone('chevron-dir')}</button></li>
        ${item('/produtores', `${icone('pin')}<span>Produtores</span>`)}${item('/receitas', `${icone('relogio')}<span>Receitas</span>`)}${item('/a-marca', `${icone('forno')}<span>A marca</span>`)}
        ${item('/favoritos', `${icone('coracao')}<span>Favoritos</span><span class="painel__n">${E.favoritos().length}</span>`)}
        ${item('/conta', `${icone('pessoa')}<span>A minha área</span>`)}${item('/ajuda', `${icone('visto')}<span>Ajuda</span>`)}
      </ul>`;
    } else if (nivel === 'mercado') {
      corpo = C.GRUPOS_MERCADO.map((g) => `<p class="painel__grupo">${esc(g.nome)}</p><ul class="painel__lista">${C.BANCAS.filter((b) => b.grupo === g.id).map((b) => item('/mercado/' + b.id, `${icone(b.icone)}<span>${esc(b.nome)}</span><span class="painel__n">${n(b.id)}</span>`)).join('')}</ul>`).join('') +
        `<ul class="painel__lista painel__lista--fim">${item('/mercado', `<strong>Ver todo o mercado</strong><span class="painel__n">${C.PRODUTOS.length}</span>`)}${item('/mercado?colecao=outono', `<span>${esc(C.colecao.get('outono').nome)}</span>`)}</ul>`;
    } else {
      corpo = `<ul class="painel__lista">${item('/cabazes', `${icone('caixa')}<span><strong>Cabazes prontos</strong><small>Conteúdo indicado, preço fechado</small></span>`)}${item('/cabazes/compor', `${icone('editar')}<span><strong>Compor o meu cabaz</strong><small>Escolhes artigo a artigo</small></span>`)}${item('/cabazes/guardados', `${icone('guardar')}<span><strong>Cabazes guardados</strong><small>${E.composicoes().length} neste navegador</small></span>`)}</ul>`;
    }
    d.innerHTML = `<div class="painel__cab"><div><p class="painel__trilho">${trilho}</p><h2 class="painel__titulo" id="painel-menu-titulo" tabindex="-1">${nivel === 'raiz' ? 'Menu' : nivel === 'mercado' ? 'Mercado' : 'Cabazes'}</h2></div><button type="button" class="icone-btn" data-fechar>${icone('fechar')}<span class="sr-only">Fechar menu</span></button></div>
      ${voltar ? `<div class="painel__nav">${voltar}</div>` : ''}<nav class="painel__corpo" aria-label="Menu">${corpo}</nav>`;
  }
  btn.addEventListener('click', () => { nivel = 'raiz'; desenhar(); d.showModal(); btn.setAttribute('aria-expanded', 'true'); $('#painel-menu-titulo', d).focus(); });
  d.addEventListener('close', () => { btn.setAttribute('aria-expanded', 'false'); if (!d.dataset.semRetorno) btn.focus(); delete d.dataset.semRetorno; });
  d.addEventListener('click', (e) => {
    if (e.target === d || e.target.closest('[data-fechar]')) return d.close();
    const b = e.target.closest('[data-nivel]');
    if (b) {
      const de = nivel;
      nivel = b.dataset.nivel; desenhar();
      (nivel === 'raiz' ? $(`[data-nivel="${de}"]`, d) : $('#painel-menu-titulo', d)).focus();
      return;
    }
    if (e.target.closest('a[href]')) { d.dataset.semRetorno = '1'; d.close(); }
  });
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nivel !== 'raiz') { e.preventDefault(); const de = nivel; nivel = 'raiz'; desenhar(); $(`[data-nivel="${de}"]`, d).focus(); }
  });
}

/* ───────── pesquisa no telemóvel ───────── */
export function iniciarPesquisaMovel() {
  const d = $('[data-painel-pesquisa]');
  const btn = $('[data-abrir-pesquisa]');
  d.innerHTML = `<div class="painel__cab"><h2 class="painel__titulo">Pesquisar</h2><button type="button" class="icone-btn" data-fechar>${icone('fechar')}<span class="sr-only">Fechar pesquisa</span></button></div><div class="painel__corpo" data-pm></div>`;
  const ps = criarPesquisa($('[data-pm]', d), 'pesquisa-movel', () => { d.dataset.semRetorno = '1'; d.close(); });
  btn.addEventListener('click', () => { d.showModal(); ps.campo.focus(); });
  d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-fechar]')) d.close(); });
  d.addEventListener('close', () => { if (!d.dataset.semRetorno) btn.focus(); delete d.dataset.semRetorno; });
  return ps;
}

/* ───────── cabeçalho compacto ao descer a página (sem deslocação controlada por JS) ───────── */
export function compactarAoDescer() {
  const cab = $('[data-cab]');
  const sentinela = document.createElement('div');
  sentinela.className = 'sentinela';
  sentinela.setAttribute('aria-hidden', 'true');
  document.body.prepend(sentinela);
  new IntersectionObserver(([e]) => cab.classList.toggle('is-compacto', !e.isIntersecting)).observe(sentinela);
}

/* ───────── rodapé ───────── */
export function desenharRodape() {
  const li = (h, t) => `<li><a href="${L(h)}">${esc(t)}</a></li>`;
  $('[data-rodape]').innerHTML = `<div class="wrap rodape__in">
    <div class="rodape__marca"><img src="assets/brand/logotipo-vertical-negativo.svg" width="553" height="379" alt="Da Horta e do Forno" loading="lazy"><p>Da terra e do forno, para a tua mesa.</p></div>
    <nav class="rodape__nav" aria-label="Rodapé">
      <div><h2 class="rodape__titulo">Comprar</h2><ul>${li('/mercado', 'Mercado')}${li('/cabazes', 'Cabazes prontos')}${li('/cabazes/compor', 'Compor o meu cabaz')}${li('/mercado?atributo=' + encodeURIComponent('Da época'), 'Da época')}<li><button type="button" data-abrir-cesto>Cesto</button></li></ul></div>
      <div><h2 class="rodape__titulo">Descobrir</h2><ul>${li('/produtores', 'Produtores')}${li('/receitas', 'Receitas')}${li('/mercado?colecao=outono', 'A banca de outono')}${li('/a-marca', 'A marca')}</ul></div>
      <div><h2 class="rodape__titulo">A minha área</h2><ul>${li('/conta', 'Resumo')}${li('/favoritos', 'Favoritos')}${li('/cabazes/guardados', 'Cabazes guardados')}${li('/encomenda', 'Rever encomenda')}</ul></div>
      <div><h2 class="rodape__titulo">Apoio e legal</h2><ul>${li('/ajuda', 'Ajuda')}${li('/legal', 'Privacidade e termos')}</ul></div>
    </nav>
    <div class="rodape__base"><p>Demonstração de conceito. Produtos, produtores, preços e disponibilidades são ilustrativos. Não há pagamentos, encomendas nem recolha de dados pessoais.</p>
      <p>Contactos, apoio ao cliente e redes sociais ainda não existem: este protótipo não tem canais de atendimento.</p></div>
  </div>`;
}

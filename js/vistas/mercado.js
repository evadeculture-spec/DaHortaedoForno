// Catálogo: /mercado, /mercado/:banca, /pesquisa?q= — filtros, ordenação e paginação no URL.
import * as C from '../loja/catalogo.js';
import { esc, L, icone, img, cartao, $, $$, protegerImagens } from '../ui/comum.js';
import { atualizarParams, navegar } from '../router.js';

const PASSO = 24;
const PRECOS = [
  { id: '', nome: 'Qualquer preço' },
  { id: '0-2', nome: 'Até 2 €', min: 0, max: 200 },
  { id: '2-5', nome: '2 € a 5 €', min: 200, max: 500 },
  { id: '5-10', nome: '5 € a 10 €', min: 500, max: 1000 },
  { id: '10-', nome: 'Mais de 10 €', min: 1000, max: Infinity },
];
const ORDENS = [
  { id: 'relevancia', nome: 'Relevância' },
  { id: 'nome', nome: 'Nome (A–Z)' },
  { id: 'preco-asc', nome: 'Preço crescente' },
  { id: 'preco-desc', nome: 'Preço decrescente' },
];
const lista = (v) => (v ? v.split(',').filter(Boolean) : []);

function lerEstado(params, bancaFixa) {
  return {
    q: (params.get('q') || '').trim(),
    bancas: bancaFixa ? [bancaFixa] : lista(params.get('banca')).filter((b) => C.banca.has(b)),
    produtores: lista(params.get('produtor')).filter((p) => C.produtor.has(p)),
    preco: PRECOS.some((x) => x.id === params.get('preco')) ? params.get('preco') : '',
    ordem: ORDENS.some((x) => x.id === params.get('ordem')) ? params.get('ordem') : 'relevancia',
    colecao: C.colecao.has(params.get('colecao')) ? params.get('colecao') : '',
    mostrar: Math.max(PASSO, parseInt(params.get('mostrar') || PASSO, 10) || PASSO),
  };
}
function paramsDe(e, bancaFixa) {
  const p = new URLSearchParams();
  if (e.q) p.set('q', e.q);
  if (!bancaFixa && e.bancas.length) p.set('banca', e.bancas.join(','));
  if (e.produtores.length) p.set('produtor', e.produtores.join(','));
  if (e.preco) p.set('preco', e.preco);
  if (e.colecao) p.set('colecao', e.colecao);
  if (e.ordem !== 'relevancia') p.set('ordem', e.ordem);
  if (e.mostrar > PASSO) p.set('mostrar', e.mostrar);
  return p;
}
/** Conjunto base (pesquisa, banca, coleção) antes dos filtros de produtor e preço. */
function base(e) {
  let res = e.q ? C.pesquisarProdutos(e.q) : C.PRODUTOS.slice();
  if (e.bancas.length) res = res.filter((p) => e.bancas.includes(p.banca));
  if (e.colecao) res = res.filter((p) => (p.colecoes || []).includes(e.colecao));
  return res;
}
function filtrar(e) {
  let res = base(e);
  if (e.produtores.length) res = res.filter((p) => p.produtores.some((x) => e.produtores.includes(x)));
  const f = PRECOS.find((x) => x.id === e.preco);
  if (f && f.id) res = res.filter((p) => p.preco >= f.min && p.preco < f.max);
  const col = new Intl.Collator('pt');
  if (e.ordem === 'nome') res.sort((a, b) => col.compare(a.nome, b.nome));
  if (e.ordem === 'preco-asc') res.sort((a, b) => a.preco - b.preco || col.compare(a.nome, b.nome));
  if (e.ordem === 'preco-desc') res.sort((a, b) => b.preco - a.preco || col.compare(a.nome, b.nome));
  return res;
}
const nFiltros = (e, fixa) => (fixa ? 0 : e.bancas.length) + e.produtores.length + (e.preco ? 1 : 0) + (e.colecao ? 1 : 0);
const artigos = (n) => (n === 1 ? '1 artigo' : `${n} artigos`);

function formFiltros(e, fixa, sufixo) {
  // produtores relevantes para o conjunto atual (sem os filtros de produtor/preço)
  const prods = [...new Set(base({ ...e, produtores: [], preco: '' }).flatMap((p) => p.produtores))].map((id) => C.produtor.get(id)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
  return `<form class="filtros-form" data-form-filtros onsubmit="return false">
    ${fixa ? `<div class="filtros__grupo"><p class="filtros__titulo">Banca</p><p class="filtros__fixa">${esc(C.banca.get(fixa).nome)} · <a href="${L('/mercado')}">ver todas</a></p></div>` : `
    <fieldset class="filtros__grupo"><legend class="filtros__titulo">Banca</legend>
      ${C.BANCAS.map((b) => `<label class="opcao"><input type="checkbox" name="banca" value="${b.id}"${e.bancas.includes(b.id) ? ' checked' : ''}><span class="opcao__caixa" aria-hidden="true">${icone('visto')}</span><span>${esc(b.nome)}</span></label>`).join('')}
    </fieldset>`}
    <fieldset class="filtros__grupo"><legend class="filtros__titulo">Produtor</legend>
      ${prods.map((pr) => `<label class="opcao"><input type="checkbox" name="produtor" value="${pr.id}"${e.produtores.includes(pr.id) ? ' checked' : ''}><span class="opcao__caixa" aria-hidden="true">${icone('visto')}</span><span>${esc(pr.nome)}</span></label>`).join('')}
    </fieldset>
    <fieldset class="filtros__grupo"><legend class="filtros__titulo">Preço</legend>
      ${PRECOS.map((x) => `<label class="opcao opcao--radio"><input type="radio" name="preco${sufixo}" value="${x.id}"${e.preco === x.id ? ' checked' : ''}><span class="opcao__caixa" aria-hidden="true"></span><span>${esc(x.nome)}</span></label>`).join('')}
    </fieldset>
  </form>`;
}

export function mercado({ params, banca: bancaFixa = null, modo = 'mercado' }) {
  if (bancaFixa && !C.banca.has(bancaFixa)) return null;
  const e = lerEstado(params, bancaFixa);
  const b = bancaFixa && C.banca.get(bancaFixa);
  const col = e.colecao && C.colecao.get(e.colecao);
  const pesquisa = modo === 'pesquisa';
  const titulo = pesquisa ? (e.q ? `Pesquisa: ${e.q}` : 'Pesquisa') : b ? b.nome : col ? col.nome : 'Mercado';
  const trilho = [['Início', '/'], ...(b || col || pesquisa ? [['Mercado', '/mercado']] : []), [pesquisa ? 'Pesquisa' : titulo, null]];

  let cab;
  if (pesquisa) {
    cab = `<div class="catalogo__cab catalogo__cab--pesquisa">
      <h1 class="pagina-titulo">${e.q ? `Resultados para «${esc(e.q)}»` : 'Pesquisar no mercado'}</h1>
      <form class="pesquisa-pagina" role="search" data-form-pesquisa-pagina>
        <label class="sr-only" for="q-pagina">Termo de pesquisa</label>
        <input id="q-pagina" type="search" name="q" value="${esc(e.q)}" placeholder="Pesquisar pão, fruta, produtores…" autocomplete="off">
        <button class="btn btn--primario" type="submit">${icone('lupa')}Pesquisar</button>
      </form>
    </div>`;
  } else if (b) {
    const prods = [...new Set(C.produtosDaBanca(b.id).flatMap((p) => p.produtores))].map((id) => C.produtor.get(id));
    cab = `<div class="catalogo__cab catalogo__cab--banca">
      <div class="catalogo__cab-img">${img(C.imagemBanca(b.id), '', 640, 400, { prioridade: true })}</div>
      <div><p class="sobretitulo">${icone(b.icone)}Banca ${String(C.BANCAS.indexOf(b) + 1).padStart(2, '0')} de 08</p>
      <h1 class="pagina-titulo">${esc(b.nome)}</h1><p class="catalogo__resumo">${esc(b.resumo)}</p>
      <p class="catalogo__produtores">De ${prods.map((p) => `<a href="${L('/produtores/' + p.id)}">${esc(p.nome)}</a>`).join(', ').replace(/, ([^,]*)$/, ' e $1')}</p></div>
    </div>`;
  } else if (col) {
    cab = `<div class="catalogo__cab catalogo__cab--banca">
      <div class="catalogo__cab-img">${img(col.imagem, col.alt, 640, 400, { prioridade: true })}</div>
      <div><p class="sobretitulo">Seleção</p><h1 class="pagina-titulo">${esc(col.nome)}</h1><p class="catalogo__resumo">${esc(col.resumo)}</p></div>
    </div>`;
  } else {
    cab = `<div class="catalogo__cab"><h1 class="pagina-titulo">Mercado</h1><p class="catalogo__resumo">${C.PRODUTOS.length} artigos em ${C.BANCAS.length} bancas, de ${C.PRODUTORES.length} produtores. Filtra por banca, produtor ou preço.</p>
      <ul class="bancas-chips">${C.BANCAS.map((x) => `<li><a class="chip-link" href="${L('/mercado/' + x.id)}">${icone(x.icone)}${esc(x.nome)}</a></li>`).join('')}</ul></div>`;
  }

  const html = `<div class="wrap catalogo" data-catalogo>
    <nav class="trilho" aria-label="Percurso"><ol>${trilho.map(([t, h]) => (h ? `<li><a href="${L(h)}">${esc(t)}</a></li>` : `<li aria-current="page">${esc(t)}</li>`)).join('')}</ol></nav>
    ${cab}
    <div class="catalogo__corpo">
      <aside class="filtros-lateral" aria-label="Filtros"><h2 class="sr-only">Filtros</h2><div data-filtros-lateral>${formFiltros(e, bancaFixa, '-l')}</div></aside>
      <div class="catalogo__resultados">
        <div class="barra">
          <p class="barra__n" data-n aria-live="polite"></p>
          <div class="barra__acoes">
            <button class="btn btn--linha btn--peq barra__filtros" type="button" data-abrir-filtros aria-haspopup="dialog">${icone('filtro')}<span data-txt-filtros>Filtros</span></button>
            <label class="ordenar"><span>Ordenar</span><select data-ordem>${ORDENS.map((o) => `<option value="${o.id}"${o.id === e.ordem ? ' selected' : ''}>${o.nome}</option>`).join('')}</select></label>
          </div>
        </div>
        <div class="ativos" data-ativos></div>
        <ul class="grelha grelha--catalogo" data-grelha></ul>
        <div class="vazio" data-vazio hidden></div>
        <div class="mais" data-mais-caixa hidden><p data-mais-txt></p><button class="btn btn--linha" type="button" data-mais>Mostrar mais</button></div>
      </div>
    </div>
    <dialog class="painel painel--dir painel-filtros" aria-labelledby="filtros-dlg-titulo" data-filtros-dialogo>
      <div class="painel__cab"><h2 id="filtros-dlg-titulo" class="painel__titulo">Filtros</h2><button class="icone-btn" type="button" data-fechar>${icone('fechar')}<span class="sr-only">Fechar filtros</span></button></div>
      <div class="painel__corpo" data-filtros-movel>${formFiltros(e, bancaFixa, '-m')}</div>
      <div class="painel__base"><button class="btn btn--linha" type="button" data-limpar>Limpar</button><button class="btn btn--primario" type="button" data-aplicar></button></div>
    </dialog>
  </div>`;

  function montar(raiz) {
    const grelha = $('[data-grelha]', raiz);
    const dlg = $('[data-filtros-dialogo]', raiz);
    let ultimoN = 0;

    function desenhar({ manterGrelha = false, focarNovo = -1 } = {}) {
      const res = filtrar(e);
      const visiveis = res.slice(0, e.mostrar);
      ultimoN = res.length;
      if (!manterGrelha) {
        grelha.innerHTML = visiveis.map((p, i) => `<li>${cartao(p, { prioridade: i < 4 })}</li>`).join('');
      } else {
        const atuais = grelha.children.length;
        grelha.insertAdjacentHTML('beforeend', visiveis.slice(atuais).map((p) => `<li>${cartao(p)}</li>`).join(''));
      }
      protegerImagens(grelha);
      const contexto = e.q ? ` para «${e.q}»` : '';
      $('[data-n]', raiz).textContent = res.length ? `${artigos(res.length)}${contexto}` : `Nenhum artigo${contexto}`;
      const nf = nFiltros(e, bancaFixa);
      $('[data-txt-filtros]', raiz).textContent = nf ? `Filtros (${nf})` : 'Filtros';
      $('[data-aplicar]', raiz).textContent = res.length === 1 ? 'Mostrar 1 resultado' : `Mostrar ${res.length} resultados`;
      // chips de filtros ativos
      const chips = [];
      if (!bancaFixa) e.bancas.forEach((id) => chips.push(['banca', id, C.banca.get(id).nome]));
      e.produtores.forEach((id) => chips.push(['produtor', id, C.produtor.get(id).nome]));
      if (e.preco) chips.push(['preco', e.preco, PRECOS.find((x) => x.id === e.preco).nome]);
      if (e.colecao) chips.push(['colecao', e.colecao, C.colecao.get(e.colecao).nome]);
      $('[data-ativos]', raiz).innerHTML = chips.length ? `<ul class="ativos__lista" aria-label="Filtros ativos">${chips.map(([k, v, t]) => `<li><button type="button" class="chip-ativo" data-remover="${k}" data-valor="${esc(v)}">${esc(t)}${icone('fechar')}<span class="sr-only">: remover filtro</span></button></li>`).join('')}<li><button type="button" class="ligacao-btn" data-limpar>Limpar filtros</button></li></ul>` : '';
      // vazio
      const vazio = $('[data-vazio]', raiz);
      vazio.hidden = res.length > 0;
      if (!res.length) {
        vazio.innerHTML = e.q && !base({ ...e, produtores: [], preco: '' }).length
          ? `<h2 class="vazio__titulo">Não encontrámos «${esc(e.q)}»</h2><p>Experimenta outra palavra no campo de pesquisa, ou começa por uma banca:</p>
             <ul class="bancas-chips">${C.BANCAS.map((x) => `<li><a class="chip-link" href="${L('/mercado/' + x.id)}">${icone(x.icone)}${esc(x.nome)}</a></li>`).join('')}</ul>`
          : `<h2 class="vazio__titulo">Nenhum artigo com estes filtros</h2><p>Retira um filtro ou limpa todos para voltar a ver a seleção completa.</p><button class="btn btn--linha" type="button" data-limpar>Limpar filtros</button>`;
      }
      const caixa = $('[data-mais-caixa]', raiz);
      caixa.hidden = res.length <= e.mostrar;
      $('[data-mais-txt]', raiz).textContent = `A mostrar ${Math.min(e.mostrar, res.length)} de ${res.length}`;
      if (focarNovo >= 0) grelha.children[focarNovo]?.querySelector('.cartao__nome a')?.focus();
    }
    const gravar = () => atualizarParams(paramsDe(e, bancaFixa));
    function sincronizarForms() {
      $$('[data-form-filtros]', raiz).forEach((f) => {
        $$('input[name="banca"]', f).forEach((i) => { i.checked = e.bancas.includes(i.value); });
        $$('input[name="produtor"]', f).forEach((i) => { i.checked = e.produtores.includes(i.value); });
        $$('input[type="radio"]', f).forEach((i) => { i.checked = i.value === e.preco; });
      });
    }
    function mudar() { e.mostrar = PASSO; gravar(); sincronizarForms(); desenhar(); }

    raiz.addEventListener('change', (ev) => {
      const t = ev.target;
      if (t.matches('[data-ordem]')) { e.ordem = t.value; gravar(); desenhar(); return; }
      if (!t.closest('[data-form-filtros]')) return;
      if (t.name === 'banca') e.bancas = $$('input[name="banca"]:checked', t.form).map((i) => i.value);
      if (t.name === 'produtor') e.produtores = $$('input[name="produtor"]:checked', t.form).map((i) => i.value);
      if (t.type === 'radio') e.preco = t.value;
      mudar();
    });
    raiz.addEventListener('click', (ev) => {
      const t = ev.target.closest('button');
      if (!t) return;
      if (t.matches('[data-remover]')) {
        const k = t.dataset.remover, v = t.dataset.valor;
        if (k === 'banca') e.bancas = e.bancas.filter((x) => x !== v);
        if (k === 'produtor') e.produtores = e.produtores.filter((x) => x !== v);
        if (k === 'preco') e.preco = '';
        if (k === 'colecao') e.colecao = '';
        mudar();
        ($('[data-ativos] button', raiz) || $('[data-n]', raiz)).focus?.();
      } else if (t.matches('[data-limpar]')) {
        if (!bancaFixa) e.bancas = [];
        e.produtores = []; e.preco = ''; e.colecao = '';
        mudar();
        if (!dlg.open) $('[data-ordem]', raiz).focus();
      } else if (t.matches('[data-mais]')) {
        const antes = grelha.children.length;
        e.mostrar += PASSO; gravar(); desenhar({ manterGrelha: true, focarNovo: antes });
      } else if (t.matches('[data-abrir-filtros]')) {
        dlg.showModal();
      } else if (t.matches('[data-aplicar]') || t.matches('[data-fechar]')) {
        dlg.close();
      }
    });
    dlg.addEventListener('close', () => $('[data-abrir-filtros]', raiz).focus());
    dlg.addEventListener('click', (ev) => { if (ev.target === dlg) dlg.close(); });
    const fp = $('[data-form-pesquisa-pagina]', raiz);
    fp?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const q = fp.q.value.trim();
      navegar(q ? `/pesquisa?q=${encodeURIComponent(q)}` : '/mercado');
    });
    desenhar();
    void ultimoN;
  }
  return { titulo: `${titulo} — Da Horta e do Forno`, html, montar, classe: 'pg-catalogo', pesquisa: e.q };
}

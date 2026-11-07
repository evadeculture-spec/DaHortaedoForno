/* Da Horta e do Forno — mercado de demonstração (sem dependências) */
(function () {
  'use strict';

  const { produtos, produtores, categorias } = window.DHF;
  const porId = new Map(produtos.map((p) => [p.id, p]));
  const CHAVE = 'dhf-cesto-v1';
  const MAX = 20;
  const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- utilitários ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (id, cls = '') => `<svg class="icon ${cls}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
  const moeda = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
  const euros = (centimos) => moeda.format(centimos / 100);
  const peso = (g) => (g >= 1000 ? `${String(g / 1000).replace('.', ',')} kg` : `${g} g`);
  const iconeCategoria = { horta: 'horta', forno: 'forno', cabazes: 'cesto' };

  /** “1 pão de 750 g”, “2 molhos de 500 g”, “3 couves” */
  function unidades(p, n) {
    const u = p.unidade;
    const nome = n === 1 ? u.singular : u.plural;
    return u.gramas ? `${n} ${nome} de ${peso(u.gramas)}` : `${n} ${nome}`;
  }
  /** Descrição de UMA unidade para o cesto: “pão de 750 g”, “1 unidade”, “1 cabaz”. */
  const unidadeCurta = (p) => (p.unidade.gramas ? `${p.unidade.singular} de ${peso(p.unidade.gramas)}` : p.quantidade);
  const nomesProdutores = (p) => p.produtores.map((id) => produtores[id].nome).join(' e ');

  /* ---------- cesto (cêntimos, guardado no navegador quando possível) ---------- */
  function lerCesto() {
    try {
      const bruto = JSON.parse(window.localStorage.getItem(CHAVE) || '{}');
      const limpo = {};
      for (const [id, q] of Object.entries(bruto)) {
        if (porId.has(id) && Number.isInteger(q) && q > 0) limpo[id] = Math.min(q, MAX);
      }
      return limpo;
    } catch (e) {
      return {};
    }
  }
  function gravarCesto() {
    try { window.localStorage.setItem(CHAVE, JSON.stringify(cesto)); } catch (e) { /* armazenamento indisponível: o cesto vive só nesta visita */ }
  }
  let cesto = lerCesto();
  const totalUnidades = () => Object.values(cesto).reduce((a, b) => a + b, 0);
  const subtotal = () => Object.entries(cesto).reduce((s, [id, q]) => s + porId.get(id).precoCentimos * q, 0);
  const artigos = (n) => (n === 1 ? '1 artigo' : `${n} artigos`);

  function definirQuantidade(id, q) {
    q = Math.max(0, Math.min(MAX, q | 0));
    if (q === 0) delete cesto[id];
    else cesto[id] = q;
    gravarCesto();
    atualizarContagens();
  }

  /* ---------- anúncios para leitores de ecrã (sem mover o foco) ---------- */
  const regiaoAnuncio = $('[data-anuncio]');
  let anuncioTimer;
  function anunciar(texto) {
    clearTimeout(anuncioTimer);
    regiaoAnuncio.textContent = '';
    anuncioTimer = setTimeout(() => { regiaoAnuncio.textContent = texto; }, 60);
  }

  /* ---------- imagens: alternativa visual quando falham ---------- */
  function protegerImagem(img, p) {
    const caixa = img.parentElement;
    const falhar = () => {
      if (caixa.classList.contains('is-missing')) return;
      caixa.classList.add('is-missing');
      img.setAttribute('aria-hidden', 'true');
      caixa.insertAdjacentHTML('beforeend', `<span class="img-fallback" role="img" aria-label="${esc(p.alt || p.nome)}">${icon(iconeCategoria[p.categoria] || 'cesto')}<span aria-hidden="true">${esc(p.nome)}</span></span>`);
    };
    img.addEventListener('error', falhar);
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) falhar();
  }

  /* ---------- contador do cabeçalho e gesto de assinatura ---------- */
  const botaoCestoTopo = $('.site-header [data-abrir-cesto]');
  function atualizarContagens() {
    const n = totalUnidades();
    $$('[data-contador]').forEach((el) => { el.textContent = n; });
    for (const li of grelha.children) {
      const q = cesto[li.dataset.id] || 0;
      const badge = $('.card__incart', li);
      badge.hidden = q === 0;
      $('[data-incart]', badge).textContent = `${q} no cesto`;
    }
  }
  function darPeso() {
    botaoCestoTopo.classList.remove('is-bumped');
    void botaoCestoTopo.offsetWidth; // reinicia a animação
    botaoCestoTopo.classList.add('is-bumped');
    clearTimeout(darPeso.t);
    darPeso.t = setTimeout(() => botaoCestoTopo.classList.remove('is-bumped'), 700);
  }

  function adicionar(id, n) {
    const p = porId.get(id);
    const antes = cesto[id] || 0;
    const depois = Math.min(MAX, antes + n);
    if (depois === antes) {
      anunciar(`Já tens a quantidade máxima de ${p.nome} no cesto (${MAX}).`);
      return depois;
    }
    definirQuantidade(id, depois);
    darPeso();
    anunciar(`Adicionado ao cesto: ${unidades(p, depois - antes)} — ${p.nome}. Tens ${depois} deste produto e ${artigos(totalUnidades())} no cesto.`);
    return depois;
  }

  /* ---------- mercado: filtros e cartões ---------- */
  const grelha = $('[data-grelha]');
  const filtrosEl = $('[data-filtros]');
  const resultadoEl = $('[data-resultado]');
  const vazioEl = $('[data-vazio]');
  const filtroProdutorEl = $('[data-filtro-produtor]');
  const estado = { categoria: 'todos', produtor: null };

  filtrosEl.innerHTML = categorias
    .map((c) => `<label class="chip"><input type="radio" name="categoria" value="${c.id}"${c.id === estado.categoria ? ' checked' : ''}><span>${c.icone ? icon(c.icone, 'chip__icon') : ''}${icon('visto', 'chip__check')}${esc(c.nome)}</span></label>`)
    .join('');

  function cartaoHTML(p) {
    const icones = p.produtores.map((id) => icon(produtores[id].tipo)).join('');
    return `<li data-id="${p.id}">
      <article class="card" aria-labelledby="t-${p.id}">
        <div class="card__media" data-abrir="${p.id}">
          <img src="${esc(p.imagem)}" alt="${esc(p.alt)}" width="600" height="450" loading="lazy" decoding="async">
          <span class="card__incart" hidden>${icon('visto')}<span data-incart></span></span>
        </div>
        <div class="card__body">
          <p class="card__origin"><span class="card__origin-icons">${icones}</span><span>${esc(nomesProdutores(p))}</span></p>
          <h3 class="card__title" id="t-${p.id}"><button class="card__open" type="button" data-abrir="${p.id}" aria-haspopup="dialog">${esc(p.nome)}</button></h3>
          <p class="card__qty">${esc(p.quantidade)}</p>
          <div class="card__buy">
            <p class="card__price">${euros(p.precoCentimos)}</p>
            <button class="btn-add" type="button" data-adicionar="${p.id}">${icon('mais', 'icon--mais')}${icon('visto', 'icon--visto')}<span class="btn-add__label">Adicionar</span><span class="sr-only"> ${esc(p.nome)} ao cesto</span></button>
          </div>
        </div>
      </article>
    </li>`;
  }
  grelha.innerHTML = produtos.map(cartaoHTML).join('');
  $$('img', grelha).forEach((img) => protegerImagem(img, porId.get(img.closest('li').dataset.id)));

  function aplicarFiltros() {
    let visiveis = 0;
    for (const li of grelha.children) {
      const p = porId.get(li.dataset.id);
      const ok = (estado.categoria === 'todos' || p.categoria === estado.categoria) && (!estado.produtor || p.produtores.includes(estado.produtor));
      li.hidden = !ok;
      if (ok) visiveis += 1;
    }
    const pr = estado.produtor ? produtores[estado.produtor] : null;
    const cat = categorias.find((c) => c.id === estado.categoria);
    let txt = visiveis === 1 ? '1 produto' : `${visiveis} produtos`;
    if (visiveis === 0) txt = 'Nenhum produto';
    if (estado.categoria !== 'todos') txt += ` em “${cat.nome}”`;
    if (pr) txt += ` · ${pr.nome}`;
    resultadoEl.textContent = txt;
    vazioEl.hidden = visiveis !== 0;
    filtroProdutorEl.hidden = !pr;
    if (pr) $('[data-filtro-produtor-nome]').textContent = pr.nome;
    $$('input[name="categoria"]', filtrosEl).forEach((r) => { r.checked = r.value === estado.categoria; });
  }

  filtrosEl.addEventListener('change', (e) => {
    if (e.target.name !== 'categoria') return;
    estado.categoria = e.target.value;
    aplicarFiltros();
  });
  const focarCategoria = () => $('input[name="categoria"]:checked', filtrosEl).focus();
  $('[data-remover-produtor]').addEventListener('click', () => {
    estado.produtor = null;
    aplicarFiltros();
    focarCategoria();
  });
  $('[data-limpar-filtros]').addEventListener('click', () => {
    estado.produtor = null;
    estado.categoria = 'todos';
    aplicarFiltros();
    focarCategoria();
  });
  $$('[data-ver-produtor]').forEach((a) => a.addEventListener('click', () => {
    // a ligação segue para #mercado; aqui apenas se ativa o filtro do produtor
    estado.produtor = a.dataset.verProdutor;
    estado.categoria = 'todos';
    aplicarFiltros();
  }));

  const temporizadores = new WeakMap();
  grelha.addEventListener('click', (e) => {
    const add = e.target.closest('[data-adicionar]');
    if (add) {
      adicionar(add.dataset.adicionar, 1);
      add.classList.add('is-added');
      $('.btn-add__label', add).textContent = 'Adicionado';
      clearTimeout(temporizadores.get(add));
      temporizadores.set(add, setTimeout(() => {
        add.classList.remove('is-added');
        $('.btn-add__label', add).textContent = 'Adicionar';
      }, 1800));
      return;
    }
    const abrir = e.target.closest('[data-abrir]');
    if (abrir) {
      const li = abrir.closest('li');
      abrirFicha(abrir.dataset.abrir, $('.card__open', li));
    }
  });

  /* ---------- diálogos: foco devolvido a quem os abriu ---------- */
  const origemFoco = new WeakMap();
  function abrirDialogo(dlg, origem) {
    origemFoco.set(dlg, origem || document.activeElement);
    dlg.showModal();
  }
  function prepararDialogo(dlg) {
    dlg.addEventListener('close', () => {
      const alvo = origemFoco.get(dlg);
      if (dlg.dataset.semRetorno) { delete dlg.dataset.semRetorno; return; }
      if (alvo && alvo.isConnected) alvo.focus({ preventScroll: true });
    });
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.close(); // clique no fundo escurecido
      if (e.target.closest('[data-fechar]')) dlg.close();
    });
  }

  /* ---------- ficha de produto ---------- */
  const ficha = $('#ficha');
  const fichaPainel = $('[data-ficha]');
  prepararDialogo(ficha);

  function estudoHTML(p) {
    const pins = p.conteudo
      .map((c, i) => {
        const pr = produtores[c.produtor];
        return `<li class="study__pin" style="left:${c.pos.x}%;top:${c.pos.y}%"><span class="study__num study__num--solo">${i + 1}</span><span class="study__chip"><span class="study__num">${i + 1}</span><strong>${esc(c.nome)}</strong><span class="study__chip-origin">${icon(pr.tipo)}${esc(pr.nome)}</span></span></li>`;
      })
      .join('');
    const lista = p.conteudo
      .map((c, i) => {
        const pr = produtores[c.produtor];
        return `<li class="study__item"><span class="study__num" aria-hidden="true">${i + 1}</span><div><p><b>${esc(c.nome)}</b> ${esc(c.detalhe)}</p><small>${icon(pr.tipo)}${esc(pr.nome)}</small></div></li>`;
      })
      .join('');
    return `<section class="study" aria-labelledby="estudo-titulo">
      <h3 class="study__title" id="estudo-titulo">Dentro deste cabaz</h3>
      <figure class="study__fig">
        <img src="${esc(p.estudo)}" width="1000" height="780" alt="Estudo do cabaz: em cima, separados, o pão de fermentação lenta, a broa de milho e os hortícolas da semana; em baixo, a caixa onde entram.">
        <ol class="study__pins" aria-hidden="true">${pins}</ol>
      </figure>
      <ol class="study__list">${lista}</ol>
    </section>`;
  }

  function fichaHTML(p) {
    const origem = p.produtores.map((id) => `<span>${icon(produtores[id].tipo)}${esc(produtores[id].nome)}</span>`).join('');
    const media = p.estudo
      ? estudoHTML(p)
      : `<figure><div class="ficha__img"><img src="${esc(p.imagem)}" width="600" height="450" alt="${esc(p.alt)}"></div></figure>`;
    const conteudo = p.conteudo && !p.estudo
      ? `<section class="ficha__contents" aria-labelledby="ficha-conteudo"><h3 id="ficha-conteudo">Dentro deste cabaz</h3><ul>${p.conteudo
          .map((c) => `<li><b>${esc(c.nome)}</b>: ${esc(c.detalhe)}<br><small class="ficha__origin"><span>${icon(produtores[c.produtor].tipo)}${esc(produtores[c.produtor].nome)}</span></small></li>`)
          .join('')}</ul></section>`
      : '';
    const locais = p.produtores.map((id) => `${produtores[id].nome} (${produtores[id].local})`).join(' e ');
    return `<button class="icon-btn sheet__close" type="button" data-fechar>${icon('fechar')}<span class="sr-only">Fechar ficha</span></button>
      <div class="ficha">
        <div class="ficha__head">
          <p class="ficha__origin">${origem}</p>
          <h2 class="ficha__title" id="ficha-titulo">${esc(p.nome)}</h2>
        </div>
        <div class="ficha__media">${media}</div>
        <div class="ficha__body">
          <p class="ficha__desc">${esc(p.descricao)}</p>
          ${conteudo}
          <dl class="facts">
            <div><dt>Cada unidade</dt><dd>${esc(unidades(p, 1))}</dd></div>
            <div><dt>Preço</dt><dd>${euros(p.precoCentimos)} por ${esc(p.unidade.singular)}</dd></div>
            <div><dt>Origem</dt><dd>${esc(locais)}</dd></div>
          </dl>
        </div>
        <div class="ficha__buy">
          <div class="buy-line">
            <p class="ficha__summary" data-resumo aria-live="polite"></p>
            <p class="buy-total"><span class="buy-total__value" data-total></span></p>
          </div>
          <div class="buy-row">
            <div class="qty" role="group" aria-label="Quantidade a adicionar">
              <button class="qty__btn" type="button" data-menos aria-label="Menos uma unidade">${icon('menos')}</button>
              <input class="qty__input" type="number" inputmode="numeric" min="1" max="${MAX}" step="1" value="1" aria-label="Quantidade (unidades)" data-qtd>
              <button class="qty__btn" type="button" data-mais aria-label="Mais uma unidade">${icon('mais')}</button>
            </div>
            <button class="btn btn--primary ficha__add" type="button" data-adicionar-ficha>${icon('mais')}<span>Adicionar<span class="ficha__add-extra"> ao cesto</span></span></button>
          </div>
          <p class="ficha__confirm" data-confirmacao></p>
        </div>
      </div>`;
  }

  function abrirFicha(id, origem) {
    const p = porId.get(id);
    fichaPainel.innerHTML = fichaHTML(p);
    $$('img', fichaPainel).forEach((img) => protegerImagem(img, p));
    const input = $('[data-qtd]', fichaPainel);
    const menos = $('[data-menos]', fichaPainel);
    const mais = $('[data-mais]', fichaPainel);
    let q = 1;
    const atualizar = () => {
      input.value = q;
      menos.disabled = q <= 1;
      mais.disabled = q >= MAX;
      const total = euros(p.precoCentimos * q);
      const extra = p.unidade.gramas && q > 1 ? ` — ${peso(p.unidade.gramas * q)} no total` : '';
      $('[data-resumo]', fichaPainel).innerHTML = `Vais levar <strong>${esc(unidades(p, q))}</strong>${extra}.`;
      $('[data-total]', fichaPainel).textContent = total;
    };
    menos.addEventListener('click', () => { q = Math.max(1, q - 1); atualizar(); if (menos.disabled) mais.focus(); });
    mais.addEventListener('click', () => { q = Math.min(MAX, q + 1); atualizar(); if (mais.disabled) menos.focus(); });
    input.addEventListener('change', () => {
      const v = parseInt(input.value, 10);
      q = Number.isFinite(v) ? Math.max(1, Math.min(MAX, v)) : 1;
      atualizar();
    });
    $('[data-adicionar-ficha]', fichaPainel).addEventListener('click', () => {
      const tens = adicionar(p.id, q);
      $('[data-confirmacao]', fichaPainel).innerHTML = `${icon('visto')}<span>Adicionado. Tens ${tens} no cesto.</span><button class="link-btn" type="button" data-ver-cesto>Ver cesto</button>`;
      $('[data-ver-cesto]', fichaPainel).addEventListener('click', () => {
        const volta = origemFoco.get(ficha);
        ficha.dataset.semRetorno = '1';
        ficha.close();
        abrirCesto(volta);
      });
    });
    atualizar();
    abrirDialogo(ficha, origem);
    fichaPainel.scrollTop = 0;
  }

  /* ---------- cesto, revisão e conclusão ---------- */
  const dlgCesto = $('#cesto');
  const corpo = $('[data-cesto-corpo]');
  const base = $('[data-cesto-base]');
  const tituloCesto = $('#cesto-titulo');
  let vista = 'cesto';
  prepararDialogo(dlgCesto);
  dlgCesto.addEventListener('close', () => { vista = 'cesto'; });

  function miniatura(p) {
    return `<div class="cart-item__thumb"><img src="${esc(p.miniatura || p.imagem)}" width="160" height="120" alt="" loading="lazy"></div>`;
  }

  function renderCesto() {
    const ids = Object.keys(cesto);
    if (vista === 'concluido') {
      tituloCesto.textContent = 'Demonstração concluída';
      corpo.innerHTML = `<div class="cart-done"><span class="cart-done__mark">${icon('visto')}</span><p tabindex="-1" data-msg-final>Demonstração concluída. Não foi efetuada qualquer cobrança ou encomenda.</p></div>`;
      base.innerHTML = `<div class="cart-actions"><button class="btn btn--primary btn--block" type="button" data-ir-mercado>Voltar ao mercado</button></div>`;
      return;
    }
    if (!ids.length) {
      vista = 'cesto';
      tituloCesto.textContent = 'O teu cesto';
      corpo.innerHTML = `<div class="cart-empty"><img src="assets/ilustracoes/cesto-vazio.svg" width="440" height="260" alt=""><p>O teu cesto ainda está vazio</p><button class="btn btn--primary" type="button" data-ir-mercado>Explorar o mercado</button></div>`;
      base.innerHTML = '';
      return;
    }
    const n = totalUnidades();
    const totalHTML = (rotulo) => `<div class="cart-total"><p class="cart-total__label">${rotulo}<small>${artigos(n)}</small></p><p class="cart-total__value">${euros(subtotal())}</p></div>`;
    if (vista === 'revisao') {
      tituloCesto.textContent = 'Rever encomenda';
      corpo.innerHTML = `<h3 class="review__title" tabindex="-1" data-titulo-vista>Resumo</h3>
        <p class="review__note">Confirma os artigos e as quantidades. Nesta demonstração não pedimos conta, morada nem pagamento.</p>
        <ul class="review-list">${ids
          .map((id) => {
            const p = porId.get(id), q = cesto[id];
            return `<li><span class="review-list__qty">${q}×</span><span class="review-list__name">${esc(p.nome)}<small>${esc(unidades(p, q))} · ${euros(p.precoCentimos)} cada</small></span><span class="review-list__total">${euros(p.precoCentimos * q)}</span></li>`;
          })
          .join('')}</ul>`;
      base.innerHTML = `${totalHTML('Total')}<div class="cart-actions"><button class="btn btn--primary btn--block" type="button" data-concluir>${icon('visto')}Concluir demonstração</button><button class="btn btn--ghost btn--block" type="button" data-voltar-cesto>${icon('seta-esq')}Voltar ao cesto para editar</button></div>`;
      return;
    }
    tituloCesto.textContent = 'O teu cesto';
    corpo.innerHTML = `<ul class="cart-list">${ids
      .map((id) => {
        const p = porId.get(id), q = cesto[id];
        return `<li class="cart-item" data-id="${id}">
          ${miniatura(p)}
          <div><p class="cart-item__name">${esc(p.nome)}</p><p class="cart-item__meta">${esc(unidadeCurta(p))} · ${euros(p.precoCentimos)} cada</p></div>
          <div class="cart-item__controls">
            <div class="qty qty--sm" role="group" aria-label="Quantidade de ${esc(p.nome)}">
              <button class="qty__btn" type="button" data-acao="menos" aria-label="Menos uma unidade de ${esc(p.nome)}"${q <= 1 ? ' disabled' : ''}>${icon('menos')}</button>
              <span class="qty__value" aria-hidden="true">${q}</span>
              <span class="sr-only">${q} ${q === 1 ? 'unidade' : 'unidades'}</span>
              <button class="qty__btn" type="button" data-acao="mais" aria-label="Mais uma unidade de ${esc(p.nome)}"${q >= MAX ? ' disabled' : ''}>${icon('mais')}</button>
            </div>
            <button class="cart-item__remove" type="button" data-acao="remover">${icon('remover')}Remover<span class="sr-only"> ${esc(p.nome)}</span></button>
            <p class="cart-item__line">${euros(p.precoCentimos * q)}</p>
          </div>
        </li>`;
      })
      .join('')}</ul>`;
    $$('.cart-item__thumb img', corpo).forEach((img) => protegerImagem(img, porId.get(img.closest('[data-id]').dataset.id)));
    base.innerHTML = `${totalHTML('Subtotal')}<div class="cart-actions"><button class="btn btn--primary btn--block" type="button" data-rever>Rever encomenda${icon('seta-dir')}</button></div>`;
  }

  function abrirCesto(origem) {
    vista = 'cesto';
    renderCesto();
    abrirDialogo(dlgCesto, origem);
    corpo.scrollTop = 0;
  }
  $$('[data-abrir-cesto]').forEach((b) => b.addEventListener('click', () => abrirCesto(b)));

  function irParaMercado() {
    dlgCesto.dataset.semRetorno = '1';
    dlgCesto.close();
    const titulo = $('#mercado-titulo');
    titulo.scrollIntoView({ behavior: reduzMovimento.matches ? 'auto' : 'smooth', block: 'start' });
    titulo.focus({ preventScroll: true });
  }

  dlgCesto.addEventListener('click', (e) => {
    const alvo = e.target.closest('button');
    if (!alvo) return;
    if (alvo.hasAttribute('data-ir-mercado')) return irParaMercado();
    if (alvo.hasAttribute('data-rever')) {
      vista = 'revisao';
      renderCesto();
      return $('[data-titulo-vista]', corpo).focus();
    }
    if (alvo.hasAttribute('data-voltar-cesto')) {
      vista = 'cesto';
      renderCesto();
      return tituloCesto.focus();
    }
    if (alvo.hasAttribute('data-concluir')) {
      cesto = {};
      gravarCesto();
      atualizarContagens();
      vista = 'concluido';
      renderCesto();
      $('[data-msg-final]', corpo).focus();
      return anunciar('Demonstração concluída. Não foi efetuada qualquer cobrança ou encomenda.');
    }
    const acao = alvo.dataset.acao;
    if (!acao) return;
    const item = alvo.closest('.cart-item');
    const id = item.dataset.id;
    const p = porId.get(id);
    const ordem = Object.keys(cesto);
    const pos = ordem.indexOf(id);
    if (acao === 'mais') definirQuantidade(id, (cesto[id] || 0) + 1);
    if (acao === 'menos') definirQuantidade(id, (cesto[id] || 0) - 1);
    if (acao === 'remover') definirQuantidade(id, 0);
    renderCesto();
    if (acao === 'remover') {
      anunciar(`${p.nome} removido do cesto. Subtotal ${euros(subtotal())}.`);
      const restantes = Object.keys(cesto);
      const seguinte = restantes[Math.min(pos, restantes.length - 1)];
      const foco = seguinte ? $(`.cart-item[data-id="${seguinte}"] [data-acao="remover"]`, corpo) : $('[data-ir-mercado]', corpo);
      (foco || tituloCesto).focus();
    } else {
      anunciar(`${p.nome}: ${cesto[id]} ${cesto[id] === 1 ? 'unidade' : 'unidades'}. Subtotal ${euros(subtotal())}.`);
      const novo = $(`.cart-item[data-id="${id}"]`, corpo);
      let foco = $(`[data-acao="${acao}"]`, novo);
      if (foco.disabled) foco = $(`[data-acao="${acao === 'mais' ? 'menos' : 'mais'}"]`, novo);
      foco.focus();
    }
  });

  /* ---------- menu do telemóvel ---------- */
  const nav = $('.nav');
  const toggle = $('.nav__toggle');
  const definirMenu = (aberto, focar) => {
    nav.classList.toggle('is-open', aberto);
    toggle.setAttribute('aria-expanded', String(aberto));
    if (aberto && focar) $('.nav__link', nav).focus();
  };
  toggle.addEventListener('click', () => definirMenu(toggle.getAttribute('aria-expanded') !== 'true', true));
  $$('.nav__link', nav).forEach((a) => a.addEventListener('click', () => definirMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      definirMenu(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) definirMenu(false);
  });
  window.matchMedia('(min-width: 860px)').addEventListener('change', (m) => { if (m.matches) definirMenu(false); });

  /* ---------- outra aba alterou o cesto ---------- */
  window.addEventListener('storage', (e) => {
    if (e.key !== CHAVE) return;
    cesto = lerCesto();
    atualizarContagens();
    if (dlgCesto.open && vista === 'cesto') renderCesto();
  });

  aplicarFiltros();
  atualizarContagens();
})();

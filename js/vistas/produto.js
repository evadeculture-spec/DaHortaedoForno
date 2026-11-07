// Ficha de produto: /produto/:id
import * as C from '../loja/catalogo.js';
import * as E from '../loja/estado.js';
import { esc, L, icone, img, cartao, $, botaoFavorito, anunciar, confirmar, darPeso } from '../ui/comum.js';

export function produto({ id }) {
  const p = C.produto.get(id);
  if (!p) return null;
  const b = C.banca.get(p.banca);
  const prods = p.produtores.map((x) => C.produtor.get(x));
  const ehCabaz = !!p.composicao;
  const dados = [
    ['Unidade de venda', C.unidades(p, 1)],
    ['Preço', `${C.euros(p.preco)} por ${p.u[0]}`],
    p.epoca && ['Época', p.epoca],
    p.ingredientes && ['Ingredientes', p.ingredientes],
    p.conservacao && ['Conservação', p.conservacao],
  ].filter(Boolean);

  let dentro = '';
  if (ehCabaz) {
    const sep = C.somaItens(p.composicao);
    dentro = `<section class="dentro" aria-labelledby="dentro-titulo">
      <h2 id="dentro-titulo" class="secao-titulo">Dentro deste cabaz</h2>
      ${p.estudo ? `<figure class="dentro__estudo">${img('assets/ilustracoes/cabaz-estudo.svg', 'Estudo do cabaz: em cima, separados, o pão de fermentação lenta, a broa de milho e os hortícolas; em baixo, a caixa onde entram.', 1000, 780)}</figure>` : ''}
      <ul class="dentro__lista">${p.composicao.map(([pid, q]) => {
        const x = C.produto.get(pid);
        const pr = C.produtor.get(x.produtores[0]);
        return `<li class="dentro__item"><span class="dentro__img">${img(C.imagemProduto(pid), '', 600, 450)}</span>
          <span class="dentro__txt"><a href="${L('/produto/' + pid)}">${esc(x.nome)}</a><span>${esc(C.unidades(x, q))}</span><span class="dentro__origem">${esc(pr.nome)}</span></span></li>`;
      }).join('')}</ul>
      <p class="dentro__nota">${p.composicao.length} artigos. Comprados em separado custariam <strong>${C.euros(sep)}</strong>; neste cabaz custam ${C.euros(p.preco)}. Queres mudar alguma coisa? <a href="${L('/cabazes/compor?a-partir=' + p.id)}">Compor um cabaz a partir deste</a>.</p>
    </section>`;
  }

  let par = '';
  if (p.par?.produto) {
    const x = C.produto.get(p.par.produto);
    par = `<section class="par" aria-labelledby="par-titulo"><h2 id="par-titulo" class="par__titulo">Fica bem com</h2>
      <div class="par__corpo"><p class="par__nota">${esc(p.par.nota)}</p><div class="par__cartao">${cartao(x, { cabecalho: 'h3' })}</div></div></section>`;
  } else if (p.par?.receita) {
    const r = C.receita.get(p.par.receita);
    par = `<section class="par" aria-labelledby="par-titulo"><h2 id="par-titulo" class="par__titulo">Na mesa</h2>
      <div class="par__corpo"><p class="par__nota">${esc(p.par.nota)}</p>
      <a class="receita-mini" href="${L('/receitas/' + r.id)}"><span class="receita-mini__img">${img(C.imagemReceita(r.id), '', 900, 640)}</span><span class="receita-mini__txt"><strong>${esc(r.nome)}</strong><span>${icone('relogio')}${r.tempo} min · ${r.porcoes} pessoas</span></span></a></div></section>`;
  }

  const mais = C.produtosDaBanca(p.banca).filter((x) => x.id !== p.id).slice(0, 4);
  const html = `<div class="wrap ficha-pg">
    <nav class="trilho" aria-label="Percurso"><ol><li><a href="${L('/')}">Início</a></li><li><a href="${L('/mercado')}">Mercado</a></li><li><a href="${L('/mercado/' + b.id)}">${esc(b.nome)}</a></li><li aria-current="page">${esc(p.nome)}</li></ol></nav>
    <div class="ficha">
      <div class="ficha__media"><div class="ficha__img">${img(C.imagemProduto(p.id), p.alt, 600, 450, { prioridade: true })}</div>
        <div class="ficha__fav" data-fav-de="${p.id}" data-fav-cls="fav fav--grande">${botaoFavorito(p, 'fav fav--grande')}</div></div>
      <div class="ficha__info">
        <p class="sobretitulo"><a href="${L('/mercado/' + b.id)}">${icone(b.icone)}${esc(b.nome)}</a></p>
        <h1 class="pagina-titulo ficha__titulo">${esc(p.nome)}</h1>
        <p class="ficha__produtor">${ehCabaz ? 'Com artigos de' : 'De'} ${prods.map((x) => `<a href="${L('/produtores/' + x.id)}">${esc(x.nome)}</a>`).join(' e ')}${prods.length === 1 ? ` · ${esc(prods[0].regiao)}` : ''}</p>
        <p class="ficha__preco"><span class="preco preco--grande">${C.euros(p.preco)}</span><span class="ficha__unidade">por ${esc(C.unidades(p, 1).replace(/^1 /, ''))}</span></p>
        <p class="ficha__desc">${esc(p.descricao)}</p>
        <div class="ficha__compra">
          <div class="qtd" role="group" aria-label="Quantidade a adicionar">
            <button type="button" class="qtd__btn" data-q="-1" aria-label="Menos uma unidade">${icone('menos')}</button>
            <input class="qtd__campo" type="number" inputmode="numeric" min="1" max="${E.MAX}" value="1" aria-label="Unidades a adicionar" data-qtd>
            <button type="button" class="qtd__btn" data-q="1" aria-label="Mais uma unidade">${icone('mais')}</button>
          </div>
          <button type="button" class="btn btn--primario ficha__add" data-add-ficha>${icone('cesto')}<span>Adicionar ao cesto</span></button>
        </div>
        <p class="ficha__resumo" data-resumo aria-live="polite"></p>
        <p class="ficha__nocesto" data-nocesto></p>
        <dl class="dados">${dados.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      </div>
    </div>
    ${dentro}
    ${par}
    <section class="produtor-bloco" aria-labelledby="pb-titulo">
      <h2 id="pb-titulo" class="sr-only">${prods.length > 1 ? 'Os produtores' : 'O produtor'}</h2>
      ${prods.map((x) => `<article class="produtor-bloco__item"><span class="produtor-bloco__img">${img(C.imagemProdutor(x.id), x.acao, 800, 600)}</span>
        <div><p class="sobretitulo">${esc(x.atividadeNome)} · ${esc(x.regiao)}</p><h3 class="produtor-bloco__nome">${esc(x.nome)}</h3><p>${esc(x.apresentacao)}</p>
        <a class="ligacao" href="${L('/produtores/' + x.id)}">Ver perfil e os ${C.produtosDoProdutor(x.id).length} artigos${icone('seta-dir')}</a></div></article>`).join('')}
    </section>
    <section class="mais-banca" aria-labelledby="mb-titulo">
      <div class="secao-cab"><h2 id="mb-titulo" class="secao-titulo">Mais da banca ${esc(b.nome.toLowerCase())}</h2><a class="ligacao" href="${L('/mercado/' + b.id)}">Ver os ${C.produtosDaBanca(b.id).length}${icone('seta-dir')}</a></div>
      <ul class="grelha grelha--4">${mais.map((x) => `<li>${cartao(x)}</li>`).join('')}</ul>
    </section>
  </div>`;

  function montar(raiz) {
    const campo = $('[data-qtd]', raiz);
    let q = 1;
    const atualizar = () => {
      campo.value = q;
      $('[data-q="-1"]', raiz).disabled = q <= 1;
      $('[data-q="1"]', raiz).disabled = q >= E.MAX;
      const t = C.totalFisico(p, q);
      $('[data-resumo]', raiz).innerHTML = `Vais adicionar <strong>${esc(C.unidades(p, q))}</strong>${t ? ` (${esc(t)})` : ''} · <strong class="preco-txt">${C.euros(p.preco * q)}</strong>`;
      const n = E.qtdProduto(p.id);
      $('[data-nocesto]', raiz).innerHTML = n ? `${icone('visto')}Já tens ${esc(C.unidades(p, n))} no cesto. <button type="button" class="ligacao-btn" data-abrir-cesto>Ver cesto</button>` : '';
    };
    raiz.addEventListener('click', (e) => {
      const b = e.target.closest('[data-q]');
      if (b) { q = Math.max(1, Math.min(E.MAX, q + Number(b.dataset.q))); atualizar(); if (b.disabled) campo.focus(); }
      if (e.target.closest('[data-add-ficha]')) {
        const antes = E.qtdProduto(p.id);
        const depois = E.adicionarProduto(p.id, q);
        if (depois > antes) {
          darPeso();
          confirmar(`Adicionado: <strong>${esc(C.unidades(p, depois - antes))}</strong> · ${esc(p.nome)}`);
          anunciar(`Adicionado ao cesto: ${C.unidades(p, depois - antes)}, ${p.nome}. Tens ${C.unidades(p, depois)} no cesto.`);
        } else anunciar(`Já tens a quantidade máxima de ${p.nome} no cesto.`);
        atualizar();
      }
    });
    campo.addEventListener('change', () => { const v = parseInt(campo.value, 10); q = Number.isFinite(v) ? Math.max(1, Math.min(E.MAX, v)) : 1; atualizar(); });
    const off = E.ouvir((o) => { if (o.cesto) atualizar(); });
    atualizar();
    return off;
  }
  return { titulo: `${p.nome} — Da Horta e do Forno`, html, montar, classe: 'pg-produto' };
}

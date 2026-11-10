// Ficha de produto: /produto/:id
import * as C from '../loja/catalogo.js';
import * as E from '../loja/estado.js';
import { esc, L, icone, img, cartao, $, $$, botaoFavorito, selo, anunciar, confirmar, darPeso } from '../ui/comum.js';

export function produto({ id }) {
  const p = C.produto.get(id);
  if (!p) return null;
  const b = C.banca.get(p.banca);
  const prods = p.produtores.map((x) => C.produtor.get(x));
  const ehCabaz = !!p.composicao;
  const disp = C.disponibilidade(p);
  const podeComprar = disp.estado !== 'fora';
  const tags = C.etiquetas(p);

  // Galeria: o artigo, um pormenor ampliado e a origem (quem o faz) ou o estudo do cabaz
  const vistas = [
    { id: 'produto', nome: 'Artigo', src: C.imagemProduto(p.id), alt: p.alt },
    { id: 'pormenor', nome: 'Pormenor', src: C.imagemProduto(p.id), alt: `Pormenor ampliado: ${p.alt}` },
    p.estudo
      ? { id: 'origem', nome: 'O que leva', src: 'assets/ilustracoes/cabaz-estudo.svg', alt: 'Estudo do cabaz: o pão, a broa e os hortícolas separados, por cima da caixa onde entram.' }
      : { id: 'origem', nome: prods[0].nome, src: C.imagemProdutor(prods[0].id), alt: prods[0].acao },
  ];

  const dobras = [
    (p.ingredientes || p.alergenios.length || ehCabaz) && ['Ingredientes e alergénios',
      `${p.ingredientes ? `<p>${esc(p.ingredientes)}</p>` : ehCabaz ? '<p>Vê os ingredientes na ficha de cada artigo deste cabaz.</p>' : ''}
       <p><strong>Alergénios:</strong> ${p.alergenios.length ? esc(p.alergenios.join(', ')) + '.' : 'nenhum dos alergénios de declaração obrigatória.'}</p>
       <p><small>Informação ilustrativa, para demonstração.</small></p>`],
    p.conservacao && ['Conservação', `<p>${esc(p.conservacao)}</p>`],
    ['Época e origem', `<dl class="dados">
        ${p.epoca ? `<div><dt>Época</dt><dd>${esc(p.epoca)}</dd></div>` : ''}
        <div><dt>Disponibilidade</dt><dd>${esc(disp.rotulo)}${disp.estado !== 'disponivel' ? ` · ${esc(disp.nota.toLowerCase())}` : ''}</dd></div>
        <div><dt>Origem</dt><dd>${esc(p.origem)} (região ilustrativa)</dd></div>
        <div><dt>${prods.length > 1 ? 'Produtores' : 'Produtor'}</dt><dd>${esc(C.nomesProdutores(p).join(', '))}</dd></div></dl>`],
  ].filter(Boolean);

  let dentro = '';
  if (ehCabaz) {
    const sep = C.somaItens(p.composicao);
    dentro = `<section class="dentro" aria-labelledby="dentro-titulo">
      <div class="cab-secao"><p class="sobretitulo sobretitulo--regua">Conteúdo</p><h2 id="dentro-titulo">Dentro deste cabaz</h2></div>
      <ul class="dentro__lista">${p.composicao.map(([pid, q]) => {
        const x = C.produto.get(pid);
        return `<li class="dentro__item"><span class="dentro__img">${img(C.imagemProduto(pid), '', 600, 450)}</span>
          <span class="dentro__txt"><a href="${L('/produto/' + pid)}">${esc(x.nome)}</a><span>${esc(C.unidades(x, q))}</span><span class="dentro__origem">${esc(C.produtor.get(x.produtores[0]).nome)}</span></span></li>`;
      }).join('')}</ul>
      <p class="dentro__nota">${C.contaItens(p.composicao)} artigos. Comprados em separado custariam <strong>${C.euros(sep)}</strong>; neste cabaz custam ${C.euros(p.preco)}. Queres mudar alguma coisa? <a href="${L('/cabazes/compor?a-partir=' + p.id)}">Compor um cabaz a partir deste</a>.</p>
    </section>`;
  }

  let par = '';
  if (p.par?.produto) {
    const x = C.produto.get(p.par.produto);
    par = `<section class="par" aria-labelledby="par-titulo"><div><p class="sobretitulo sobretitulo--regua" id="par-titulo">Fica bem com</p><p class="par__nota">${esc(p.par.nota)}</p></div><div class="par__cartao">${cartao(x, { cabecalho: 'h3' })}</div></section>`;
  } else if (p.par?.receita) {
    const r = C.receita.get(p.par.receita);
    par = `<section class="par" aria-labelledby="par-titulo"><div><p class="sobretitulo sobretitulo--regua" id="par-titulo">Na mesa</p><p class="par__nota">${esc(p.par.nota)}</p></div>
      <a class="receita-mini" href="${L('/receitas/' + r.id)}"><span class="receita-mini__img">${img(C.imagemReceita(r.id), '', 900, 640)}</span><span class="receita-mini__txt"><strong>${esc(r.nome)}</strong><span>${icone('relogio')}${r.tempo} min · ${r.porcoes} pessoas</span></span></a></section>`;
  }

  const mais = C.produtosDaBanca(p.banca).filter((x) => x.id !== p.id && C.disponivel(x.id)).slice(0, 4);
  const html = `<div class="wrap ficha-pg">
    <nav class="trilho" aria-label="Percurso"><ol><li><a href="${L('/')}">Início</a></li><li><a href="${L('/mercado')}">Mercado</a></li><li><a href="${L('/mercado/' + b.id)}">${esc(b.nome)}</a></li><li aria-current="page">${esc(p.nome)}</li></ol></nav>
    <div class="ficha">
      <div class="galeria">
        <div class="galeria__palco" data-palco data-vista="produto">
          ${img(vistas[0].src, vistas[0].alt, 600, 450, { prioridade: true })}
          <span class="galeria__legenda" data-legenda>${esc(vistas[0].nome)}</span>
          <div class="galeria__fav" data-fav-de="${p.id}" data-fav-cls="fav fav--grande">${botaoFavorito(p, 'fav fav--grande')}</div>
        </div>
        <div class="galeria__miniaturas" role="group" aria-label="Imagens do artigo">
          ${vistas.map((v, i) => `<button type="button" class="miniatura miniatura--${v.id}" data-vista="${v.id}" aria-pressed="${i === 0}"><img src="${esc(v.src)}" alt="" width="84" height="63" loading="lazy"><span class="sr-only">${esc(v.nome)}</span></button>`).join('')}
        </div>
      </div>
      <div class="ficha__info">
        <p class="sobretitulo"><a href="${L('/mercado/' + b.id)}">${icone(b.icone)}${esc(b.nome)}</a></p>
        <h1 class="pagina-titulo ficha__titulo">${esc(p.nome)}</h1>
        <p class="ficha__produtor">${ehCabaz ? 'Com artigos de' : 'De'} ${prods.map((x) => `<a href="${L('/produtores/' + x.id)}">${esc(x.nome)}</a>`).join(', ').replace(/, ([^,]*)$/, ' e $1')}${prods.length === 1 ? ` · ${esc(prods[0].regiao)}` : ''}</p>
        <p class="ficha__linha-preco"><span class="preco preco--grande">${C.euros(p.preco)}</span><span class="ficha__unidade">por ${esc(C.unidades(p, 1).replace(/^1 /, ''))}</span></p>
        <p class="ficha__etiquetas">${selo(p, { sempre: true })}${tags.filter((t) => t !== 'Da época').map((t) => `<a class="selo selo--liso" href="${L('/mercado?atributo=' + encodeURIComponent(t))}">${esc(t)}</a>`).join('')}</p>
        <p class="ficha__desc">${esc(p.descricao)}</p>
        ${podeComprar ? `<div class="ficha__compra">
          <div class="qtd" role="group" aria-label="Quantidade a adicionar">
            <button type="button" class="qtd__btn" data-q="-1" aria-label="Menos uma unidade">${icone('menos')}</button>
            <input class="qtd__campo" type="number" inputmode="numeric" min="1" max="${E.MAX}" value="1" aria-label="Unidades a adicionar" data-qtd>
            <button type="button" class="qtd__btn" data-q="1" aria-label="Mais uma unidade">${icone('mais')}</button>
          </div>
          <button type="button" class="btn btn--primario ficha__add" data-add-ficha>${icone('cesto')}<span>Adicionar ao cesto</span><span class="ficha__add-preco" data-add-preco></span></button>
        </div>
        <p class="ficha__resumo" data-resumo aria-live="polite"></p>
        <p class="ficha__nocesto" data-nocesto></p>` : `<div class="ficha__indisponivel"><strong>Fora de época</strong><p>${esc(disp.nota)}. Podes guardá-lo nos favoritos para o encontrares depressa quando voltar à banca.</p></div>`}
        <div class="dobras">${dobras.map(([t, c], i) => `<details class="dobra"${i === 0 ? ' open' : ''}><summary>${esc(t)}${icone('chevron-baixo')}</summary><div class="dobra__corpo">${c}</div></details>`).join('')}</div>
      </div>
    </div>
    ${dentro}
    ${par}
    <section class="produtor-bloco" aria-labelledby="pb-titulo">
      <div class="cab-secao"><p class="sobretitulo sobretitulo--regua">Quem produz</p><h2 id="pb-titulo">${prods.length > 1 ? 'Os produtores' : 'O produtor'}</h2></div>
      ${prods.map((x) => `<article class="produtor-bloco__item"><figure class="gravura"><span class="gravura__img">${img(C.imagemProdutor(x.id), x.acao, 800, 600)}</span></figure>
        <div><p class="sobretitulo">${esc(x.atividadeNome)} · ${esc(x.regiao)}</p><h3 class="produtor-bloco__nome">${esc(x.nome)}</h3><p>${esc(x.apresentacao)}</p>
        <a class="ligacao" href="${L('/produtores/' + x.id)}">Perfil e ${C.produtosDoProdutor(x.id).length} artigos${icone('seta-dir')}</a></div></article>`).join('')}
    </section>
    <section class="mais-banca" aria-labelledby="mb-titulo">
      <div class="cab-secao"><p class="sobretitulo sobretitulo--regua">Na mesma banca</p><h2 id="mb-titulo">Mais de ${esc(b.nome.toLowerCase())}</h2><a class="ligacao" href="${L('/mercado/' + b.id)}">Ver os ${C.produtosDaBanca(b.id).length}${icone('seta-dir')}</a></div>
      <ul class="grelha grelha--4" style="margin-top:var(--e-5)">${mais.map((x) => `<li>${cartao(x)}</li>`).join('')}</ul>
    </section>
  </div>`;

  function montar(raiz) {
    // galeria
    const palco = $('[data-palco]', raiz), foto = $('img', palco);
    raiz.addEventListener('click', (e) => {
      const m = e.target.closest('.miniatura');
      if (!m) return;
      const v = vistas.find((x) => x.id === m.dataset.vista);
      $$('.miniatura', raiz).forEach((x) => x.setAttribute('aria-pressed', String(x === m)));
      palco.dataset.vista = v.id;
      if (foto.getAttribute('src') !== v.src) foto.src = v.src;
      foto.alt = v.alt;
      $('[data-legenda]', raiz).textContent = v.nome;
    });
    if (!podeComprar) return undefined;
    const campo = $('[data-qtd]', raiz);
    let q = 1;
    const atualizar = () => {
      campo.value = q;
      $('[data-q="-1"]', raiz).disabled = q <= 1;
      $('[data-q="1"]', raiz).disabled = q >= E.MAX;
      const t = C.totalFisico(p, q);
      $('[data-resumo]', raiz).innerHTML = `Vais adicionar <strong>${esc(C.unidades(p, q))}</strong>${t ? ` (${esc(t)})` : ''} · <strong class="preco-txt">${C.euros(p.preco * q)}</strong>`;
      $('[data-add-preco]', raiz).textContent = `· ${C.euros(p.preco * q)}`;
      const n = E.qtdProduto(p.id);
      $('[data-nocesto]', raiz).innerHTML = n ? `${icone('visto')}Já tens ${esc(C.unidades(p, n))} no cesto. <button type="button" class="ligacao-btn" data-abrir-cesto>Ver cesto</button>` : '';
    };
    raiz.addEventListener('click', (e) => {
      const bq = e.target.closest('[data-q]');
      if (bq) { q = Math.max(1, Math.min(E.MAX, q + Number(bq.dataset.q))); atualizar(); if (bq.disabled) campo.focus(); }
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

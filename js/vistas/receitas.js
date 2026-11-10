// Receitas: /receitas e /receitas/:id — ingredientes ligados ao mercado, compra só do que falta.
import * as C from '../loja/catalogo.js';
import * as E from '../loja/estado.js';
import { esc, L, icone, img, $, $$, anunciar, confirmar, darPeso } from '../ui/comum.js';

export function receitas() {
  const html = `<div class="wrap receitas-pg">
    <nav class="trilho" aria-label="Percurso"><ol><li><a href="${L('/')}">Início</a></li><li aria-current="page">Receitas</li></ol></nav>
    <h1 class="pagina-titulo">Da banca para a mesa</h1>
    <p class="pagina-lead">Seis receitas curtas com o que há no mercado. Em cada uma, escolhes só os ingredientes que te faltam.</p>
    <ul class="receitas-lista">${C.RECEITAS.map((r, i) => `<li><a class="receita-cartao" href="${L('/receitas/' + r.id)}">
      <span class="receita-cartao__img">${img(C.imagemReceita(r.id), '', 900, 640, { prioridade: i < 2 })}</span>
      <span class="receita-cartao__txt"><strong>${esc(r.nome)}</strong><span class="receita-cartao__meta">${icone('relogio')}${r.tempo} min · ${icone('pessoas')}${r.porcoes} pessoas · ${r.ingredientes.filter((x) => x.produto).length} ingredientes no mercado</span></span></a></li>`).join('')}</ul>
  </div>`;
  return { titulo: 'Receitas — Da Horta e do Forno', html, classe: 'pg-receitas' };
}

export function receita({ id }) {
  const r = C.receita.get(id);
  if (!r) return null;
  const html = `<div class="wrap receita-pg">
    <nav class="trilho" aria-label="Percurso"><ol><li><a href="${L('/')}">Início</a></li><li><a href="${L('/receitas')}">Receitas</a></li><li aria-current="page">${esc(r.nome)}</li></ol></nav>
    <div class="receita__cab">
      <figure class="receita__img">${img(C.imagemReceita(r.id), r.alt, 900, 640, { prioridade: true })}</figure>
      <div class="receita__intro">
        <p class="sobretitulo">Receita</p>
        <h1 class="pagina-titulo">${esc(r.nome)}</h1>
        <p class="mesa__meta"><span>${icone('relogio')}${r.tempo} min</span><span>${icone('pessoas')}${r.porcoes} pessoas</span></p>
        <p class="receita__resumo">${esc(r.resumo)}</p>
        ${r.nota ? `<p class="receita__nota">${esc(r.nota)}</p>` : ''}
      </div>
    </div>
    <div class="receita__corpo">
      <section class="ingredientes" aria-labelledby="ingr-titulo">
        <h2 id="ingr-titulo" class="secao-titulo secao-titulo--solto">Ingredientes <span class="ingredientes__porcoes">para ${r.porcoes} pessoas</span></h2>
        <p class="ingredientes__ajuda">Marca só o que te falta. No cesto entra a embalagem indicada (por exemplo, uma garrafa de azeite), não a quantidade da receita.</p>
        <ul class="ingr-lista">${r.ingredientes.map((ig, i) => {
          if (!ig.produto) return `<li class="ingr ingr--casa"><span class="ingr__marca" aria-hidden="true"></span><span class="ingr__txt"><span class="ingr__receita">${esc(ig.texto)}</span><span class="ingr__compra">Não se vende no mercado</span></span></li>`;
          const p = C.produto.get(ig.produto);
          if (!C.disponivel(p.id)) return `<li class="ingr ingr--casa"><span class="ingr__marca" aria-hidden="true"></span><span class="ingr__txt"><span class="ingr__receita">${esc(ig.texto)}</span><span class="ingr__compra"><a href="${L('/produto/' + p.id)}">${esc(p.nome)}</a>: fora de época · ${esc(C.disponibilidade(p).nota.toLowerCase())}</span></span></li>`;
          return `<li class="ingr"><label class="ingr__rotulo"><input type="checkbox" data-ingr="${i}"><span class="ingr__marca" aria-hidden="true">${icone('visto')}</span>
            <span class="ingr__txt"><span class="ingr__receita">${esc(ig.texto)}</span>
            <span class="ingr__compra">No cesto: ${esc(C.unidades(p, ig.compra))} · ${esc(p.nome)} · <strong class="preco-txt">${C.euros(p.preco * ig.compra)}</strong></span></span></label>
            <a class="ingr__ver" href="${L('/produto/' + p.id)}">Ver<span class="sr-only"> ${esc(p.nome)}</span></a></li>`;
        }).join('')}</ul>
        <div class="ingredientes__acoes">
          <button type="button" class="ligacao-btn" data-todos>Selecionar todos os do mercado</button>
          <p class="ingredientes__total" data-total aria-live="polite"></p>
          <button type="button" class="btn btn--primario" data-add-receita disabled>Adicionar ao cesto</button>
        </div>
      </section>
      <section class="preparacao" aria-labelledby="prep-titulo">
        <h2 id="prep-titulo" class="secao-titulo secao-titulo--solto">Preparação</h2>
        <ol class="passos">${r.passos.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
        ${r.acompanha ? `<p class="receita__acomp">Para acompanhar: <a href="${L('/produto/' + r.acompanha)}">${esc(C.produto.get(r.acompanha).nome)}</a>.</p>` : ''}
      </section>
    </div>
    <section class="outras" aria-labelledby="outras-titulo"><h2 id="outras-titulo" class="secao-titulo">Outras receitas</h2>
      <ul class="receitas-lista receitas-lista--peq">${C.RECEITAS.filter((x) => x.id !== id).slice(0, 3).map((x) => `<li><a class="receita-cartao" href="${L('/receitas/' + x.id)}"><span class="receita-cartao__img">${img(C.imagemReceita(x.id), '', 900, 640)}</span><span class="receita-cartao__txt"><strong>${esc(x.nome)}</strong><span class="receita-cartao__meta">${icone('relogio')}${x.tempo} min</span></span></a></li>`).join('')}</ul></section>
  </div>`;

  function montar(raiz) {
    const caixas = $$('[data-ingr]', raiz);
    const botao = $('[data-add-receita]', raiz);
    const escolhidos = () => {
      const m = new Map();
      caixas.filter((c) => c.checked).forEach((c) => { const ig = r.ingredientes[c.dataset.ingr]; m.set(ig.produto, (m.get(ig.produto) || 0) + ig.compra); });
      return [...m.entries()];
    };
    const atualizar = () => {
      const sel = escolhidos();
      const n = sel.reduce((s, [, q]) => s + q, 0);
      const total = C.somaItens(sel);
      $('[data-total]', raiz).innerHTML = n ? `${n} ${n === 1 ? 'artigo' : 'artigos'} · <strong class="preco-txt">${C.euros(total)}</strong>` : 'Nenhum ingrediente marcado';
      botao.disabled = !n;
      botao.textContent = n ? `Adicionar ${n === 1 ? '1 artigo' : n + ' artigos'} ao cesto · ${C.euros(total)}` : 'Adicionar ao cesto';
    };
    raiz.addEventListener('change', (e) => { if (e.target.matches('[data-ingr]')) atualizar(); });
    $('[data-todos]', raiz).addEventListener('click', () => { const todos = caixas.every((c) => c.checked); caixas.forEach((c) => { c.checked = !todos; }); atualizar(); });
    botao.addEventListener('click', () => {
      const sel = escolhidos();
      if (!sel.length) return;
      E.adicionarVarios(sel);
      darPeso();
      const n = sel.reduce((s, [, q]) => s + q, 0);
      confirmar(`${n === 1 ? '1 artigo adicionado' : `${n} artigos adicionados`} da receita · ${C.euros(C.somaItens(sel))}`);
      anunciar(`Adicionados ao cesto: ${sel.map(([pid, q]) => `${C.unidades(C.produto.get(pid), q)} de ${C.produto.get(pid).nome}`).join(', ')}.`);
      caixas.forEach((c) => { c.checked = false; });
      atualizar();
    });
    atualizar();
  }
  return { titulo: `${r.nome} — Receitas — Da Horta e do Forno`, html, montar, classe: 'pg-receita' };
}

// Cabazes (/cabazes, /cabazes/guardados), favoritos, a marca e página não encontrada.
import * as C from '../loja/catalogo.js';
import * as E from '../loja/estado.js';
import { esc, L, icone, img, cartao, $, anunciar, confirmar, darPeso, protegerImagens } from '../ui/comum.js';
import { pedirConfirmacao } from '../ui/dialogos.js';

const trilho = (itens) => `<nav class="trilho" aria-label="Percurso"><ol>${itens.map(([t, h]) => (h ? `<li><a href="${L(h)}">${esc(t)}</a></li>` : `<li aria-current="page">${esc(t)}</li>`)).join('')}</ol></nav>`;

export function cabazes() {
  const prontos = C.produtosDaBanca('cabazes');
  const n = E.composicoes().length;
  const html = `<div class="wrap cabazes-pg">
    ${trilho([['Início', '/'], ['Cabazes', null]])}
    <h1 class="pagina-titulo">Cabazes</h1>
    <ul class="tres-caminhos">
      <li><a class="caminho" href="#prontos" data-ancora="prontos">${img('assets/ilustracoes/cabaz-completo.svg', '', 900, 640)}<strong>Cabazes prontos</strong><span>${prontos.length} caixas com conteúdo indicado e preço fechado.</span></a></li>
      <li><a class="caminho" href="${L('/cabazes/compor')}">${img('assets/ilustracoes/cabaz-composicao.svg', '', 900, 640)}<strong>Compor o meu cabaz</strong><span>Escolhes artigo a artigo; o preço é a soma do que escolheres.</span></a></li>
      <li><a class="caminho" href="${L('/cabazes/guardados')}">${img('assets/ilustracoes/cabaz-vazio.svg', '', 900, 640)}<strong>Cabazes guardados</strong><span>${n ? `${n} ${n === 1 ? 'composição guardada' : 'composições guardadas'} neste navegador.` : 'As composições que guardares ficam aqui.'}</span></a></li>
    </ul>
    <section id="prontos" aria-labelledby="prontos-titulo" tabindex="-1">
      <div class="secao-cab"><h2 id="prontos-titulo" class="secao-titulo">Cabazes prontos</h2></div>
      <ul class="grelha grelha--catalogo">${prontos.map((p, i) => `<li>${cartao(p, { prioridade: i < 3 })}</li>`).join('')}</ul>
    </section>
  </div>`;
  function montar(raiz) {
    raiz.querySelector('[data-ancora]').addEventListener('click', (e) => {
      e.preventDefault();
      const s = raiz.querySelector('#prontos');
      s.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      s.focus({ preventScroll: true });
    });
  }
  return { titulo: 'Cabazes — Da Horta e do Forno', html, montar, classe: 'pg-cabazes' };
}

const data = (iso) => new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

export function guardados() {
  const html = `<div class="wrap guardados-pg">
    ${trilho([['Início', '/'], ['Cabazes', '/cabazes'], ['Cabazes guardados', null]])}
    <h1 class="pagina-titulo">Cabazes guardados</h1>
    <p class="pagina-lead">Composições guardadas neste navegador. Guardar não as põe no cesto: abre-as para editar ou adiciona-as quando quiseres.</p>
    <div data-lista></div>
  </div>`;
  function montar(raiz) {
    const desenhar = () => {
      const lista = E.composicoes();
      $('[data-lista]', raiz).innerHTML = !lista.length
        ? `<div class="vazio vazio--grande">${img('assets/ilustracoes/cabaz-vazio.svg', '', 900, 640)}<h2 class="vazio__titulo">Ainda não guardaste nenhuma composição</h2><p>No configurador, usa “Guardar composição” para a reabrir mais tarde.</p><a class="btn btn--primario" href="${L('/cabazes/compor')}">Compor o meu cabaz</a></div>`
        : `<ul class="guardados">${lista.map((c) => `<li class="guardado" data-cid="${c.cid}">
            <div class="guardado__miniaturas" aria-hidden="true">${c.itens.slice(0, 5).map(([id]) => `<span>${img(C.imagemProduto(id), '', 600, 450)}</span>`).join('')}</div>
            <div class="guardado__txt"><h2 class="guardado__nome">${esc(c.nome)}</h2>
              <p class="guardado__meta">${C.contaItens(c.itens)} artigos · <strong class="preco-txt">${C.euros(C.somaItens(c.itens))}</strong> · guardado a ${esc(data(c.atualizada))}</p>
              <p class="guardado__itens">${c.itens.map(([id, q]) => `${q > 1 ? q + ' × ' : ''}${esc(C.produto.get(id).nome)}`).join(', ')}</p></div>
            <div class="guardado__acoes">
              <a class="btn btn--linha btn--peq" href="${L('/cabazes/compor?composicao=' + c.cid)}">${icone('editar')}Abrir e editar</a>
              <button type="button" class="btn btn--primario btn--peq" data-add>${icone('cesto')}Adicionar ao cesto</button>
              <button type="button" class="ligacao-btn" data-apagar>Apagar<span class="sr-only"> ${esc(c.nome)}</span></button>
            </div></li>`).join('')}</ul>`;
      protegerImagens(raiz);
    };
    raiz.addEventListener('click', async (e) => {
      const li = e.target.closest('[data-cid]');
      if (!li) return;
      const c = E.composicao(li.dataset.cid);
      if (e.target.closest('[data-add]')) {
        E.adicionarComposicao({ nome: c.nome, itens: c.itens, cid: c.cid });
        darPeso();
        confirmar(`Cabaz «${esc(c.nome)}» adicionado · ${C.euros(C.somaItens(c.itens))}`);
        anunciar(`Cabaz ${c.nome} adicionado ao cesto.`);
      }
      if (e.target.closest('[data-apagar]')) {
        const ok = await pedirConfirmacao({ titulo: `Apagar «${c.nome}»?`, texto: 'A composição deixa de estar guardada. Se já estiver no cesto, continua lá.', sim: 'Apagar composição', nao: 'Manter' });
        if (ok) { E.apagarComposicao(c.cid); desenhar(); anunciar('Composição apagada.'); $('h1', raiz).focus(); }
      }
    });
    desenhar();
  }
  return { titulo: 'Cabazes guardados — Da Horta e do Forno', html, montar, classe: 'pg-guardados' };
}

export function favoritos() {
  const html = `<div class="wrap favoritos-pg">
    ${trilho([['Início', '/'], ['Favoritos', null]])}
    <h1 class="pagina-titulo">Favoritos</h1>
    <p class="pagina-lead">Guardados neste navegador, sem conta.</p>
    <div data-lista></div>
  </div>`;
  function montar(raiz) {
    const desenhar = () => {
      const ids = E.favoritos();
      $('[data-lista]', raiz).innerHTML = !ids.length
        ? `<div class="vazio vazio--grande"><h2 class="vazio__titulo">Ainda não tens favoritos</h2><p>Toca no coração de um artigo para o guardar aqui. Começa por uma banca:</p>
           <ul class="bancas-chips">${C.BANCAS.map((b) => `<li><a class="chip-link" href="${L('/mercado/' + b.id)}">${icone(b.icone)}${esc(b.nome)}</a></li>`).join('')}</ul></div>`
        : `<p class="favoritos__n">${ids.length} ${ids.length === 1 ? 'artigo' : 'artigos'}</p><ul class="grelha grelha--catalogo">${ids.map((id) => `<li>${cartao(C.produto.get(id))}</li>`).join('')}</ul>`;
      protegerImagens(raiz);
    };
    desenhar();
    return E.ouvir((o) => {
      if (!o.fav) return;
      const foco = document.activeElement;
      const tinhaFoco = raiz.contains(foco);
      desenhar();
      if (tinhaFoco) $('h1', raiz).focus();
    });
  }
  return { titulo: 'Favoritos — Da Horta e do Forno', html, montar, classe: 'pg-favoritos' };
}

export function marca() {
  const html = `<div class="wrap marca-pg">
    ${trilho([['Início', '/'], ['A marca', null]])}
    <div class="marca-pg__cab">
      <img class="marca-pg__logo" src="assets/brand/logotipo-vertical.svg" width="553" height="379" alt="Logótipo Da Horta e do Forno: forno a lenha com chaminé e arco de tijolo, sobre a horta com cenouras, couve e tomateiro.">
      <div><h1 class="pagina-titulo">Um mercado com forno ao fundo</h1>
      <p class="pagina-lead">Da Horta e do Forno junta numa só banca o que vem da terra e o que sai do forno: hortícolas, fruta, aromáticas, pão, despensa, conservas, ovos e queijos de pequenos produtores portugueses.</p></div>
    </div>
    <div class="marca-pg__colunas">
      <section><h2 class="secao-titulo secao-titulo--solto">Como funciona</h2>
        <p>Cada produtor tem uma banca. Podes comprar artigo a artigo, levar um cabaz pronto com conteúdo indicado, ou compor o teu cabaz e guardá-lo para outra semana.</p>
        <p>Nesta demonstração a recolha e a entrega são simuladas: escolhes a modalidade na revisão da encomenda, vês o custo antes de concluir, e nada é cobrado.</p></section>
      <section><h2 class="secao-titulo secao-titulo--solto">A identidade</h2>
        <p>O símbolo é um forno a lenha com a horta à frente. A paleta tem quatro cores: verde-floresta para o texto e as ações, creme e marfim para o papel, terracota para o tijolo, a chama e a crosta.</p>
        <ul class="paleta" aria-label="Paleta">
          <li><span style="background:#243E2B"></span>Verde-floresta <code>#243E2B</code></li>
          <li><span style="background:#F4F0E4"></span>Creme <code>#F4F0E4</code></li>
          <li><span style="background:#FFFCF5"></span>Marfim <code>#FFFCF5</code></li>
          <li><span style="background:#BC7958"></span>Terracota <code>#BC7958</code></li>
        </ul>
        <p>As cenas editoriais são gravuras a duas tintas; os produtos são desenhados com as suas cores naturais para se escolherem pelo aspeto.</p></section>
    </div>
    <p class="aviso">${icone('visto')}Demonstração de conceito. Produtos, produtores, regiões, preços, disponibilidades e modalidades de recolha são ilustrativos. Não há pagamentos, encomendas nem recolha de dados pessoais.</p>
  </div>`;
  return { titulo: 'A marca — Da Horta e do Forno', html, classe: 'pg-marca' };
}

export function naoEncontrado() {
  const html = `<div class="wrap nao-encontrado">
    <h1 class="pagina-titulo">Esta banca não existe</h1>
    <p class="pagina-lead">O endereço pode estar incompleto ou o artigo pode ter mudado de nome.</p>
    <p><a class="btn btn--primario" href="${L('/mercado')}">Ir para o mercado</a> <a class="btn btn--linha" href="${L('/')}">Página inicial</a></p>
  </div>`;
  return { titulo: 'Página não encontrada — Da Horta e do Forno', html, classe: 'pg-404' };
}

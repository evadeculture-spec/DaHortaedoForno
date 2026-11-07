import * as C from '../loja/catalogo.js';
import { esc, L, icone, img, cartao } from '../ui/comum.js';

const HOJE = ['pao-fermentacao-lenta', 'abobora-manteiga', 'pera-rocha', 'cenouras-com-rama', 'ovos-de-galinha', 'cabaz-pao-e-horta'];
// Etiquetas da banca, ancoradas em objetos da ilustração (posição em % da imagem)
const ETIQUETAS = [
  { txt: 'Ver padaria', destino: '/mercado/padaria', x: 15, y: 30, icone: 'forno' },
  { txt: 'Fruta da época', destino: '/mercado/fruta', x: 46, y: 47, icone: 'fruta' },
  { txt: 'Compor cabaz', destino: '/cabazes/compor', x: 80, y: 33, icone: 'caixa' },
];

export function inicio() {
  const exemplo = C.PARTIDAS.find((p) => p.id === 'semana');
  const totalEx = C.somaItens(exemplo.itens);
  const r = C.receita.get('sopa-de-abobora-e-alho-frances');
  const noMercado = r.ingredientes.filter((i) => i.produto).length;
  const destaque = ['horta-da-ribeira', 'padaria-do-largo'].map((id) => C.produtor.get(id));

  const html = `
  <section class="abertura" aria-labelledby="abertura-titulo">
    <div class="abertura__in wrap">
      <div class="abertura__texto">
        <h1 id="abertura-titulo" class="abertura__titulo">Da terra e do forno, para a tua mesa.</h1>
        <p class="abertura__lead">Pão de fornada, hortícolas da época e cabazes de pequenos produtores portugueses.</p>
        <div class="abertura__acoes">
          <a class="btn btn--primario" href="${L('/mercado')}">Explorar o mercado${icone('seta-dir')}</a>
          <a class="btn btn--linha" href="${L('/cabazes/compor')}">Compor o meu cabaz</a>
        </div>
      </div>
      <figure class="banca">
        <div class="banca__cena">
          <img class="banca__img" src="assets/ilustracoes/banca-mercado.svg" width="1400" height="640" fetchpriority="high" decoding="async"
            alt="Ilustração de uma banca de mercado vista de cima: à esquerda pães em prateleiras de madeira e uma broa cortada; ao centro caixas rasas de fruta, cenouras com rama e couves; à direita a caixa kraft da marca aberta com o saco de pão; ao fundo o arco de tijolo do forno.">
          <ul class="banca__etiquetas" aria-label="Atalhos da banca">
            ${ETIQUETAS.map((e) => `<li style="--x:${e.x}%;--y:${e.y}%"><a class="etiqueta" href="${L(e.destino)}"><span class="etiqueta__ponto" aria-hidden="true"></span>${esc(e.txt)}</a></li>`).join('')}
          </ul>
        </div>
        <ul class="banca__atalhos" aria-label="Atalhos da banca">
          ${ETIQUETAS.map((e) => `<li><a class="atalho" href="${L(e.destino)}">${icone(e.icone)}<span>${esc(e.txt)}</span>${icone('chevron-dir', 'atalho__seta')}</a></li>`).join('')}
        </ul>
      </figure>
    </div>
  </section>

  <section class="hoje" aria-labelledby="hoje-titulo">
    <div class="wrap">
      <div class="secao-cab">
        <h2 id="hoje-titulo" class="secao-titulo">Hoje no mercado</h2>
        <a class="ligacao" href="${L('/mercado')}">Ver os ${C.PRODUTOS.length} artigos${icone('seta-dir')}</a>
      </div>
      <ul class="grelha grelha--hoje">${HOJE.map((id, i) => `<li>${cartao(C.produto.get(id), { prioridade: i < 4 })}</li>`).join('')}</ul>
    </div>
  </section>

  <section class="bancas" aria-labelledby="bancas-titulo">
    <div class="wrap">
      <div class="secao-cab">
        <h2 id="bancas-titulo" class="secao-titulo">As oito bancas</h2>
        <p class="secao-nota">${C.PRODUTOS.length} artigos de ${C.PRODUTORES.length} produtores</p>
      </div>
      <ol class="indice-bancas">
        ${C.BANCAS.map((b, i) => {
          const n = C.produtosDaBanca(b.id).length;
          return `<li class="indice-bancas__item">
            <a class="banca-idx" href="${L('/mercado/' + b.id)}">
              <span class="banca-idx__img">${img(C.imagemBanca(b.id), '', 640, 400)}</span>
              <span class="banca-idx__linha"><span class="banca-idx__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span class="banca-idx__nome">${esc(b.nome)}</span><span class="banca-idx__pontos" aria-hidden="true"></span><span class="banca-idx__n">${n} artigos</span></span>
              <span class="banca-idx__resumo">${esc(b.resumo)}</span>
            </a>
          </li>`;
        }).join('')}
      </ol>
    </div>
  </section>

  <section class="compor-faixa" aria-labelledby="compor-titulo">
    <div class="wrap compor-faixa__in">
      <div class="compor-faixa__img">${img('assets/ilustracoes/cabaz-composicao.svg', 'Caixa kraft aberta a meio da composição, com pão, cenouras, ovos e um frasco já lá dentro e espaço para mais.', 900, 640)}</div>
      <div class="compor-faixa__texto">
        <p class="sobretitulo">${icone('caixa')}O configurador</p>
        <h2 id="compor-titulo" class="secao-titulo secao-titulo--solto">Compor o meu cabaz</h2>
        <p class="compor-faixa__lead">Escolhes artigo a artigo, em qualquer banca. O preço do cabaz é a soma do que lá puseres: começa em 0,00 € e não há taxa de caixa nem mínimo nesta demonstração.</p>
        <div class="exemplo" aria-labelledby="exemplo-titulo">
          <p class="exemplo__titulo" id="exemplo-titulo">Exemplo: “${esc(exemplo.nome)}”</p>
          <ul class="exemplo__lista">${exemplo.itens.map(([id, q]) => { const p = C.produto.get(id); return `<li><span>${q > 1 ? q + ' × ' : ''}${esc(p.nome)}</span><span class="preco-txt">${C.euros(p.preco * q)}</span></li>`; }).join('')}</ul>
          <p class="exemplo__total"><span>${C.contaItens(exemplo.itens)} artigos</span><strong>${C.euros(totalEx)}</strong></p>
        </div>
        <div class="compor-faixa__acoes">
          <a class="btn btn--primario" href="${L('/cabazes/compor?partida=semana')}">Abrir e editar este exemplo</a>
          <a class="btn btn--linha" href="${L('/cabazes/compor?partida=vazio')}">Começar vazio</a>
        </div>
      </div>
    </div>
  </section>

  <section class="cultiva" aria-labelledby="cultiva-titulo">
    <div class="wrap">
      <h2 id="cultiva-titulo" class="secao-titulo">Quem cultiva e quem amassa</h2>
      <div class="cultiva__lista">
        ${destaque.map((pr, i) => `
        <article class="cultiva__peca${i ? ' cultiva__peca--inv' : ''}" aria-labelledby="cult-${pr.id}">
          <figure class="cultiva__img">${img(C.imagemProdutor(pr.id), pr.acao, 800, 600)}</figure>
          <div class="cultiva__texto">
            <p class="sobretitulo">${icone(pr.atividade === 'padaria' ? 'forno' : 'horta')}${esc(pr.atividadeNome)} · ${esc(pr.regiao)}</p>
            <h3 id="cult-${pr.id}" class="cultiva__nome">${esc(pr.nome)}</h3>
            <p class="cultiva__apres">${esc(pr.apresentacao)}</p>
            <p class="cultiva__produtos">${C.produtosDoProdutor(pr.id).filter((p) => p.banca !== 'cabazes').slice(0, 4).map((p) => `<a href="${L('/produto/' + p.id)}">${esc(p.nome)}</a>`).join(' · ')}</p>
            <a class="ligacao" href="${L('/produtores/' + pr.id)}">Conhecer ${esc(pr.nome)} e os seus ${C.produtosDoProdutor(pr.id).length} artigos${icone('seta-dir')}</a>
          </div>
        </article>`).join('')}
      </div>
      <a class="btn btn--linha" href="${L('/produtores')}">Ver os ${C.PRODUTORES.length} produtores</a>
    </div>
  </section>

  <section class="mesa" aria-labelledby="mesa-titulo">
    <div class="wrap mesa__in">
      <figure class="mesa__img">${img(C.imagemReceita(r.id), r.alt, 900, 640)}</figure>
      <div class="mesa__texto">
        <p class="sobretitulo">Da banca para a mesa</p>
        <h2 id="mesa-titulo" class="secao-titulo secao-titulo--solto">${esc(r.nome)}</h2>
        <p class="mesa__meta"><span>${icone('relogio')}${r.tempo} min</span><span>${icone('pessoas')}${r.porcoes} pessoas</span><span>${icone('cesto')}${noMercado} ingredientes no mercado</span></p>
        <p class="mesa__resumo">${esc(r.resumo)}</p>
        <ul class="mesa__ingr">${r.ingredientes.filter((i) => i.produto).map((i) => `<li><a href="${L('/produto/' + i.produto)}">${esc(C.produto.get(i.produto).nome)}</a></li>`).join('')}</ul>
        <div class="mesa__acoes">
          <a class="btn btn--primario" href="${L('/receitas/' + r.id)}">Ver receita e ingredientes</a>
          <a class="ligacao" href="${L('/receitas')}">Todas as receitas${icone('seta-dir')}</a>
        </div>
      </div>
    </div>
  </section>`;
  return { titulo: 'Da Horta e do Forno — Mercado', html, classe: 'pg-inicio' };
}

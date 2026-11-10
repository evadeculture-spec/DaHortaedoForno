import * as C from '../loja/catalogo.js';
import { esc, L, icone, img, cartao, rapido } from '../ui/comum.js';

// Balcão: o essencial do dia, comprável logo no primeiro ecrã
const BALCAO = ['pao-fermentacao-lenta', 'broa-de-milho', 'ovos-de-galinha', 'cabaz-pao-e-horta'];
// Seleção sazonal (todos com época que inclui o mês do mercado)
const EPOCA = ['abobora-manteiga', 'pera-rocha', 'alho-frances', 'roma', 'couve-portuguesa', 'maca-bravo-de-esmolfe', 'diospiro', 'nozes-em-casca'];
// Etiquetas da banca, ancoradas em objetos da ilustração (posição em % da imagem)
const ETIQUETAS = [
  { txt: 'Ver padaria', destino: '/mercado/padaria', x: 15, y: 46, icone: 'forno' },
  { txt: 'Fruta da época', destino: '/mercado/fruta', x: 51, y: 71, icone: 'fruta' },
  { txt: 'Compor cabaz', destino: '/cabazes/compor', x: 85, y: 63, icone: 'caixa' },
];
const VALORES = [
  ['Qualidade', 'Cada artigo tem ficha própria: unidade de venda, ingredientes, conservação e alergénios. Sabe-se sempre o que se leva.'],
  ['Proximidade', 'Cada produto mostra quem o faz e de onde vem. Do perfil do produtor chega-se a tudo o que ele vende.'],
  ['Tradição', 'Pão de forno a lenha, broa de milho, marmelada de corte, queijo com cardo: receitas de sempre, feitas como sempre.'],
  ['Frescura', 'Os frescos seguem a época. O que não é do mês aparece como fora de época, com o mês em que volta.'],
  ['Respeito pelos produtores', 'O preço é o da banca de quem produz. Um cabaz composto custa a soma dos artigos, sem taxas acrescentadas.'],
];

export function inicio() {
  const mes = C.MESES[C.MES_DO_MERCADO - 1];
  const exemplo = C.PARTIDAS.find((p) => p.id === 'semana');
  const [r, ...outras] = ['sopa-de-abobora-e-alho-frances', 'maca-assada-com-mel-e-nozes', 'torrada-de-queijo-de-cabra-e-compota-de-figo', 'tiborna-de-azeite-e-alecrim'].map((id) => C.receita.get(id));
  const destaque = ['horta-da-ribeira', 'padaria-do-largo'].map((id) => C.produtor.get(id));
  const nEpoca = C.PRODUTOS.filter(C.daEpoca).length;

  const html = `
  <section class="abertura" aria-labelledby="abertura-titulo">
    <div class="abertura__in wrap">
      <div class="abertura__texto">
        <p class="sobretitulo sobretitulo--regua">Mercado de ${mes}</p>
        <h1 id="abertura-titulo" class="abertura__titulo">Da terra e do forno, <em>para a tua mesa.</em></h1>
        <p class="abertura__lead">Sabores autênticos, produtos frescos e receitas de tradição. Descobre o melhor da nossa terra, escolhido com cuidado para chegar à tua mesa.</p>
        <div class="abertura__acoes">
          <a class="btn btn--primario" href="${L('/mercado')}">Explorar o mercado${icone('seta-dir')}</a>
          <a class="btn btn--linha" href="${L('/cabazes/compor')}">Compor o meu cabaz</a>
        </div>
        <ul class="abertura__factos">
          <li><a href="${L('/mercado')}"><strong>${C.PRODUTOS.length}</strong><span>artigos</span></a></li>
          <li><a href="#bancas" data-ancora="bancas"><strong>${C.BANCAS.length}</strong><span>bancas</span></a></li>
          <li><a href="${L('/produtores')}"><strong>${C.PRODUTORES.length}</strong><span>produtores</span></a></li>
        </ul>
      </div>
      <figure class="banca">
        <div class="banca__cena">
          <img class="banca__img" src="assets/ilustracoes/banca-mercado.svg" width="1400" height="760" fetchpriority="high" decoding="async"
            alt="Ilustração de uma banca de mercado com um forno a lenha ao centro: à esquerda, pães em prateleiras de madeira e uma broa cortada; ao centro, caixas de peras e laranjas, cenouras com rama e couve; à direita, a caixa kraft da marca aberta com o saco de pão.">
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

  <section class="balcao" aria-labelledby="balcao-titulo">
    <div class="wrap"><div class="balcao__in">
      <div class="balcao__titulo"><h2 id="balcao-titulo">Hoje no balcão</h2><a class="ligacao" href="${L('/mercado')}">Ver tudo${icone('seta-dir')}</a></div>
      <ul class="balcao__lista">${BALCAO.map((id) => rapido(C.produto.get(id))).join('')}</ul>
    </div></div>
  </section>

  <section class="bancas" id="bancas" aria-labelledby="bancas-titulo" tabindex="-1">
    <div class="wrap">
      <div class="cab-secao">
        <p class="sobretitulo sobretitulo--regua">O mercado</p>
        <h2 id="bancas-titulo">Oito bancas, <em>uma arcada.</em></h2>
        <p class="cab-secao__lead">Cada banca tem os seus produtores e nove artigos. Entra pela que te apetecer.</p>
        <a class="ligacao" href="${L('/mercado')}">Ver os ${C.PRODUTOS.length} artigos${icone('seta-dir')}</a>
      </div>
      <ol class="arcada">
        ${C.BANCAS.map((b, i) => `<li>
          <a class="arco-banca" href="${L('/mercado/' + b.id)}">
            <span class="arco" data-tinta="${b.id}"><span class="arco__vao">${img(C.imagemBanca(b.id), '', 640, 400)}</span></span>
            <span class="arco-banca__linha"><span class="arco-banca__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span class="arco-banca__nome">${esc(b.nome)}</span><span class="arco-banca__n">${C.produtosDaBanca(b.id).length} artigos</span></span>
            <span class="arco-banca__resumo">${esc(b.resumo)}</span>
          </a></li>`).join('')}
      </ol>
    </div>
  </section>

  <section class="epoca" aria-labelledby="epoca-titulo">
    <div class="wrap">
      <div class="cab-secao">
        <p class="sobretitulo sobretitulo--regua">Da época</p>
        <h2 id="epoca-titulo">O que a terra dá <em>em ${mes}.</em></h2>
        <p class="cab-secao__lead">Abóbora, romã, dióspiro, as primeiras nozes. ${nEpoca} artigos estão agora na sua época.</p>
        <a class="ligacao" href="${L('/mercado?atributo=' + encodeURIComponent('Da época'))}">Ver tudo o que é da época${icone('seta-dir')}</a>
      </div>
      <ul class="grelha grelha--epoca">${EPOCA.map((id) => `<li>${cartao(C.produto.get(id))}</li>`).join('')}</ul>
    </div>
  </section>

  <section class="compor-faixa" aria-labelledby="compor-titulo">
    <div class="wrap compor-faixa__in">
      <div class="compor-faixa__img">${img('assets/ilustracoes/cabaz-composicao.svg', 'Caixa kraft aberta a meio da composição, com pão, cenouras, ovos e um frasco de compota já lá dentro.', 900, 640)}</div>
      <div class="compor-faixa__texto">
        <p class="sobretitulo sobretitulo--regua">O configurador</p>
        <div class="cab-secao"><h2 id="compor-titulo">Compor <em>o meu cabaz.</em></h2></div>
        <p class="compor-faixa__lead">Uma caixa vazia e o mercado inteiro à frente. Escolhes artigo a artigo, em qualquer banca, e vês a caixa a encher.</p>
        <ol class="quatro-passos">
          <li><strong>Escolher</strong><span>um ponto de partida</span></li>
          <li><strong>Compor</strong><span>banca a banca</span></li>
          <li><strong>Acompanhar</strong><span>a caixa e o total</span></li>
          <li><strong>Finalizar</strong><span>guardar ou levar</span></li>
        </ol>
        <p class="compor-faixa__preco">O preço é a soma dos artigos: começa em <strong>0,00 €</strong>. O exemplo «${esc(exemplo.nome)}» leva ${C.contaItens(exemplo.itens)} artigos e fica em <strong>${C.euros(C.somaItens(exemplo.itens))}</strong>.</p>
        <div class="compor-faixa__acoes">
          <a class="btn btn--primario" href="${L('/cabazes/compor?partida=vazio')}">Começar um cabaz</a>
          <a class="btn btn--linha" href="${L('/cabazes/compor?partida=semana')}">Abrir o exemplo</a>
        </div>
      </div>
    </div>
  </section>

  <section class="cultiva" aria-labelledby="cultiva-titulo">
    <div class="wrap">
      <div class="cab-secao">
        <p class="sobretitulo sobretitulo--regua">Conhece quem produz</p>
        <h2 id="cultiva-titulo">Quem cultiva <em>e quem amassa.</em></h2>
        <p class="cab-secao__lead">Nove produtores de demonstração, cada um com a sua banca. Os perfis e as regiões são ilustrativos.</p>
        <a class="ligacao" href="${L('/produtores')}">Ver os ${C.PRODUTORES.length} produtores${icone('seta-dir')}</a>
      </div>
      <div class="cultiva__lista">
        ${destaque.map((pr, i) => `
        <article class="cultiva__peca${i ? ' cultiva__peca--inv' : ''}" aria-labelledby="cult-${pr.id}">
          <figure class="gravura"><span class="gravura__img">${img(C.imagemProdutor(pr.id), pr.acao, 800, 600)}</span><figcaption><span>${esc(pr.nome)}</span><span>${esc(pr.regiao)}</span></figcaption></figure>
          <div class="cultiva__texto">
            <p class="sobretitulo">${icone(pr.atividade === 'padaria' ? 'forno' : 'horta')}${esc(pr.atividadeNome)} · ${esc(pr.regiao)}</p>
            <h3 id="cult-${pr.id}" class="cultiva__nome">${esc(pr.nome)}</h3>
            <p class="cultiva__apres">${esc(pr.apresentacao)}</p>
            <p class="cultiva__produtos">${C.produtosDoProdutor(pr.id).filter((p) => p.banca !== 'cabazes').slice(0, 4).map((p) => `<a href="${L('/produto/' + p.id)}">${esc(p.nome)}</a>`).join(' · ')}</p>
            <a class="ligacao" href="${L('/produtores/' + pr.id)}">Perfil e ${C.produtosDoProdutor(pr.id).length} artigos${icone('seta-dir')}</a>
          </div>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="mesa" aria-labelledby="mesa-titulo">
    <div class="wrap">
      <div class="cab-secao">
        <p class="sobretitulo sobretitulo--regua">Receitas e inspiração</p>
        <h2 id="mesa-titulo">Da banca <em>para a mesa.</em></h2>
        <p class="cab-secao__lead">Receitas curtas com o que há no mercado. Em cada uma, levas só os ingredientes que te faltam.</p>
        <a class="ligacao" href="${L('/receitas')}">Todas as receitas${icone('seta-dir')}</a>
      </div>
      <div class="mesa__in">
        <article class="mesa__destaque">
          <figure class="gravura"><span class="gravura__img">${img(C.imagemReceita(r.id), r.alt, 900, 640)}</span></figure>
          <div>
            <h3><a href="${L('/receitas/' + r.id)}">${esc(r.nome)}</a></h3>
            <p class="mesa__meta"><span>${icone('relogio')}${r.tempo} min</span><span>${icone('pessoas')}${r.porcoes} pessoas</span><span>${icone('cesto')}${r.ingredientes.filter((i) => i.produto).length} ingredientes no mercado</span></p>
            <p class="mesa__resumo">${esc(r.resumo)}</p>
            <ul class="mesa__ingr">${r.ingredientes.filter((i) => i.produto).map((i) => `<li><a href="${L('/produto/' + i.produto)}">${esc(C.produto.get(i.produto).nome)}</a></li>`).join('')}</ul>
            <div class="mesa__acoes"><a class="btn btn--primario" href="${L('/receitas/' + r.id)}">Ver receita e ingredientes</a></div>
          </div>
        </article>
        <ul class="mesa__outras">${outras.map((x) => `<li><a class="receita-linha" href="${L('/receitas/' + x.id)}">${img(C.imagemReceita(x.id), '', 900, 640)}<span><strong>${esc(x.nome)}</strong><span>${icone('relogio')}${x.tempo} min · ${x.porcoes} pessoas</span></span></a></li>`).join('')}</ul>
      </div>
    </div>
  </section>

  <section class="compromisso" aria-labelledby="compromisso-titulo">
    <div class="wrap">
      <div class="compromisso__cab">
        <p class="sobretitulo sobretitulo--regua">O nosso compromisso</p>
        <h2 id="compromisso-titulo">Cinco coisas que se veem em cada banca.</h2>
        <p>Não são selos nem certificados. São regras de funcionamento da loja, que podes verificar em qualquer ficha de produto.</p>
      </div>
      <ul class="valores">${VALORES.map(([t, d]) => `<li><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('')}</ul>
      <p class="compromisso__nota">Demonstração de conceito: produtos, produtores e preços são ilustrativos.</p>
    </div>
  </section>`;

  function montar(raiz) {
    raiz.querySelector('[data-ancora="bancas"]').addEventListener('click', (e) => {
      e.preventDefault();
      const s = raiz.querySelector('#bancas');
      s.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      s.focus({ preventScroll: true });
    });
  }
  return { titulo: 'Da Horta e do Forno — Mercado', html, montar, classe: 'pg-inicio' };
}

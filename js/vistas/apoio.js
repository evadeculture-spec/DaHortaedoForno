// Encomenda (revisão em página própria), a minha área, ajuda e informação legal da demonstração.
import * as C from '../loja/catalogo.js';
import * as E from '../loja/estado.js';
import { navegar } from '../router.js';
import { esc, L, icone, img, $, anunciar, protegerImagens } from '../ui/comum.js';
import { pedirConfirmacao } from '../ui/dialogos.js';

const trilho = (itens) => `<nav class="trilho" aria-label="Percurso"><ol>${itens.map(([t, h]) => (h ? `<li><a href="${L(h)}">${esc(t)}</a></li>` : `<li aria-current="page">${esc(t)}</li>`)).join('')}</ol></nav>`;
const AVISO = 'Demonstração de conceito. Produtos, produtores, preços e disponibilidades são ilustrativos. Ao concluir não é feita qualquer cobrança nem encomenda, e não são pedidos dados pessoais.';

/* ───────── /encomenda ───────── */
export function encomenda() {
  const html = `<div class="wrap encomenda" data-encomenda>
    ${trilho([['Início', '/'], ['Encomenda', null]])}
    <h1 class="pagina-titulo" data-titulo>Rever encomenda</h1>
    <ol class="etapas" aria-label="Etapas" data-etapas></ol>
    <div data-corpo></div>
  </div>`;
  function montar(raiz) {
    let concluida = false;
    const etapas = (n) => ['Cesto', 'Revisão', 'Conclusão'].map((t, i) => `<li class="${i < n ? 'is-feita' : ''}"${i === n ? ' aria-current="step"' : ''}><b>${i < n ? '✓' : i + 1}</b>${t}</li>`).join('');
    function desenhar() {
      const ls = E.linhas();
      const corpo = $('[data-corpo]', raiz);
      if (concluida) {
        $('[data-titulo]', raiz).textContent = 'Demonstração concluída';
        $('[data-etapas]', raiz).innerHTML = etapas(2);
        corpo.innerHTML = `<div class="encomenda__fim"><span class="cesto-fim__marca">${icone('visto')}</span>
          <p class="encomenda__msg" tabindex="-1" data-msg-final>Demonstração concluída. Não foi efetuada qualquer cobrança ou encomenda.</p>
          <p>O cesto foi esvaziado. Os favoritos e os cabazes guardados continuam neste navegador.</p>
          <p><a class="btn btn--primario" href="${L('/mercado')}">Voltar ao mercado</a> <a class="btn btn--linha" href="${L('/conta')}">A minha área</a></p></div>`;
        return;
      }
      $('[data-etapas]', raiz).innerHTML = etapas(1);
      if (!ls.length) {
        corpo.innerHTML = `<div class="vazio vazio--grande" style="margin-top:var(--e-6)">${img('assets/ilustracoes/cabaz-vazio.svg', '', 900, 640)}<h2 class="vazio__titulo">Não há nada para rever</h2><p>O cesto está vazio. Escolhe alguns artigos ou compõe um cabaz.</p><p><a class="btn btn--primario" href="${L('/mercado')}">Explorar o mercado</a> <a class="btn btn--linha" href="${L('/cabazes/compor')}">Compor o meu cabaz</a></p></div>`;
        protegerImagens(corpo);
        return;
      }
      const prods = ls.filter((l) => l.tipo === 'produto');
      const grupos = ls.filter((l) => l.tipo === 'composicao');
      const avulsos = prods.filter((l) => !C.ehCabaz(l.id)), prontos = prods.filter((l) => C.ehCabaz(l.id));
      const linP = (l) => { const p = C.produto.get(l.id); return `<li class="enc-linha"><span class="enc-linha__img">${img(C.imagemProduto(p.id), '', 600, 450)}</span><span><span class="enc-linha__nome">${l.qtd} × ${esc(p.nome)}</span><small>${esc(C.unidades(p, l.qtd))} · ${C.euros(p.preco)} cada${p.composicao ? ` · ${p.composicao.map(([id]) => esc(C.produto.get(id).nome)).join(', ')}` : ''}</small></span><span class="enc-linha__total preco-txt">${C.euros(E.precoLinha(l))}</span></li>`; };
      const linG = (l) => `<li class="enc-linha"><span class="enc-linha__img">${img('assets/ilustracoes/cabaz-miniatura.svg', '', 160, 120)}</span><span><span class="enc-linha__nome">${l.qtd} × ${esc(l.nome)}</span><small>Cabaz composto: ${l.itens.map(([id, q]) => `${q > 1 ? q + ' × ' : ''}${esc(C.produto.get(id).nome)}`).join(', ')}</small></span><span class="enc-linha__total preco-txt">${C.euros(E.precoLinha(l))}</span></li>`;
      const sec = (t, arr, fn) => (arr.length ? `<h2 class="encomenda__sec">${t}</h2><ul class="enc-lista">${arr.map(fn).join('')}</ul>` : '');
      const n = E.unidades();
      corpo.innerHTML = `<div class="encomenda__corpo">
        <div>${sec('Produtos', avulsos, linP)}${sec('Cabazes prontos', prontos, linP)}${sec('Cabazes compostos', grupos, linG)}
          <p style="margin-top:var(--e-4)"><button type="button" class="ligacao-btn" data-abrir-cesto>${icone('seta-esq')} Voltar ao cesto para editar</button></p></div>
        <aside class="encomenda__lado" aria-labelledby="resumo-enc"><div class="quadro">
          <h2 id="resumo-enc">Resumo</h2>
          <dl class="totais">
            <div><dt>Subtotal (${n} ${n === 1 ? 'unidade' : 'unidades'})</dt><dd class="preco-txt">${C.euros(E.subtotal())}</dd></div>
            <div><dt>Entrega ou recolha</dt><dd>Por definir</dd></div>
            <div class="totais__total"><dt>Total dos artigos</dt><dd class="preco-txt" data-total-final>${C.euros(E.subtotal())}</dd></div>
          </dl>
          <p class="aviso">${icone('visto')}<span>${AVISO} A entrega e os seus custos não fazem parte desta demonstração.</span></p>
          <div class="gaveta__acoes"><button type="button" class="btn btn--primario btn--bloco" data-concluir>${icone('visto')}Concluir demonstração</button></div>
        </div></aside></div>`;
      protegerImagens(corpo);
    }
    raiz.addEventListener('click', (e) => {
      if (!e.target.closest('[data-concluir]')) return;
      concluida = true;
      E.limparCesto();
      desenhar();
      $('[data-msg-final]', raiz).focus();
      anunciar('Demonstração concluída. Não foi efetuada qualquer cobrança ou encomenda.');
      window.scrollTo(0, 0);
    });
    desenhar();
    return E.ouvir((o) => { if (o.cesto && !concluida) desenhar(); });
  }
  return { titulo: 'Rever encomenda — Da Horta e do Forno', html, montar, classe: 'pg-encomenda' };
}

/* ───────── /conta ───────── */
export function conta() {
  const html = `<div class="wrap texto-pg">
    ${trilho([['Início', '/'], ['A minha área', null]])}
    <h1 class="pagina-titulo">A minha área</h1>
    <p class="pagina-lead">Nesta demonstração não há contas nem palavras-passe. O que guardas fica só neste navegador, e é aqui que o encontras.</p>
    <div class="conta__cartoes" data-cartoes></div>
    <div class="conta__limpar"><h2 class="secao-titulo secao-titulo--solto" style="font-size:var(--t-h4)">Apagar o que está guardado</h2>
      <p>Remove deste navegador o cesto, os favoritos, os cabazes guardados e o rascunho do configurador.</p>
      <button type="button" class="btn btn--linha" data-apagar-tudo>${icone('remover')}Apagar os meus dados locais</button>
      <p role="status" data-estado></p></div>
  </div>`;
  function montar(raiz) {
    const desenhar = () => {
      const f = E.favoritos().length, c = E.composicoes().length, n = E.unidades();
      $('[data-cartoes]', raiz).innerHTML = `
        <a class="conta-cartao" href="${L('/favoritos')}"><span class="conta-cartao__n">${f}</span><strong>Favoritos</strong><span>${f ? 'Artigos que guardaste com o coração.' : 'Toca no coração de um artigo para o guardar.'}</span></a>
        <a class="conta-cartao" href="${L('/cabazes/guardados')}"><span class="conta-cartao__n">${c}</span><strong>Cabazes guardados</strong><span>${c ? 'Composições prontas a reabrir ou a pôr no cesto.' : 'Guarda uma composição no configurador.'}</span></a>
        <button type="button" class="conta-cartao" data-abrir-cesto><span class="conta-cartao__n">${n}</span><strong>No cesto</strong><span>${n ? `Subtotal de ${C.euros(E.subtotal())}.` : 'O cesto está vazio.'}</span></button>`;
    };
    raiz.addEventListener('click', async (e) => {
      if (!e.target.closest('[data-apagar-tudo]')) return;
      const ok = await pedirConfirmacao({ titulo: 'Apagar os dados locais?', texto: 'O cesto, os favoritos e os cabazes guardados deixam de existir neste navegador. Não é possível recuperá-los.', sim: 'Apagar tudo', nao: 'Manter' });
      if (!ok) return;
      E.apagarTudo();
      desenhar();
      $('[data-estado]', raiz).textContent = 'Dados locais apagados.';
    });
    desenhar();
    return E.ouvir(desenhar);
  }
  return { titulo: 'A minha área — Da Horta e do Forno', html, montar, classe: 'pg-conta' };
}

/* ───────── /ajuda e /legal ───────── */
function paginaTexto({ titulo, lead, caminho, seccoes }) {
  const html = `<div class="wrap texto-pg">
    ${trilho([['Início', '/'], [titulo, null]])}
    <h1 class="pagina-titulo">${esc(titulo)}</h1>
    <p class="pagina-lead">${esc(lead)}</p>
    <div class="texto-pg__corpo">
      <nav class="texto-pg__indice" aria-label="Nesta página"><ul>${seccoes.map(([id, t]) => `<li><a href="#${id}" data-ancora="${id}">${esc(t)}</a></li>`).join('')}</ul></nav>
      <div class="prosa">${seccoes.map(([id, t, corpo]) => `<section aria-labelledby="${id}"><h2 id="${id}" tabindex="-1">${esc(t)}</h2>${corpo}</section>`).join('')}</div>
    </div></div>`;
  function montar(raiz) {
    raiz.addEventListener('click', (e) => {
      const a = e.target.closest('[data-ancora]');
      if (!a) return;
      e.preventDefault();
      const alvo = raiz.querySelector('#' + a.dataset.ancora);
      alvo.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      alvo.focus({ preventScroll: true });
    });
    void caminho; void navegar;
  }
  return { titulo: `${titulo} — Da Horta e do Forno`, html, montar, classe: 'pg-texto' };
}

export const ajuda = () => paginaTexto({
  titulo: 'Ajuda', caminho: '/ajuda',
  lead: 'Como funciona esta demonstração do mercado, do primeiro artigo à revisão da encomenda.',
  seccoes: [
    ['comprar', 'Como comprar', `<p>Há três maneiras de encher o cesto:</p><ul>
      <li><strong>Artigo a artigo.</strong> Pesquisa ou entra numa das <a href="${L('/mercado')}">oito bancas</a> e usa “Adicionar”. Depois de adicionado, o botão passa a mostrar a quantidade.</li>
      <li><strong>Cabaz pronto.</strong> Nove <a href="${L('/cabazes')}">caixas com conteúdo indicado</a> e preço fechado.</li>
      <li><strong>Cabaz composto.</strong> No <a href="${L('/cabazes/compor')}">configurador</a> escolhes os artigos; o preço é a soma do que lá puseres.</li></ul>`],
    ['unidades', 'Unidades e quantidades', '<p>Cada artigo tem uma unidade de venda: um pão de 750 g, um molho de 500 g, uma caixa de 6 ovos. A quantidade no cesto conta unidades de venda. Dois molhos de 500 g são 1 kg de cenouras, e a ficha mostra essa conta antes de adicionares.</p>'],
    ['epoca', 'Época e disponibilidade', `<p>O mercado de demonstração decorre em ${C.MESES[C.MES_DO_MERCADO - 1]}. Os frescos fora da sua época continuam com ficha, mas não se podem comprar e mostram o mês em que voltam. “Fim de época” assinala o último mês de colheita.</p>`],
    ['cabazes', 'Guardar um cabaz e pô-lo no cesto', '<p>São duas ações diferentes. “Guardar composição” fica só com a lista, para a reabrires noutra altura. “Adicionar ao cesto” põe o cabaz na encomenda. Se editares um cabaz que já está no cesto, ele só muda depois de confirmares.</p>'],
    ['encomenda', 'Encomenda, entrega e pagamento', '<p>A revisão mostra os artigos, os cabazes e o total. Esta demonstração não tem pagamentos, entregas nem recolhas, e por isso não mostra portes nem prazos. “Concluir demonstração” esvazia o cesto e nada mais.</p>'],
    ['contactos', 'Contactos', '<p>Este protótipo não tem canais de apoio ao cliente nem redes sociais. Quando a loja abrir, os contactos aparecem aqui e no rodapé.</p>'],
  ],
});

export const legal = () => paginaTexto({
  titulo: 'Privacidade e termos', caminho: '/legal',
  lead: 'O que este protótipo guarda, onde, e o que não faz.',
  seccoes: [
    ['dados', 'Dados guardados', `<p>O site não pede nome, e-mail, morada nem dados de pagamento, e não envia o que fazes para nenhum servidor. Guarda apenas, no armazenamento local do teu navegador:</p><ul>
      <li>o cesto (<code>dhf-cesto-v2</code>);</li><li>os favoritos (<code>dhf-favoritos-v1</code>);</li><li>os cabazes guardados (<code>dhf-composicoes-v1</code>);</li><li>o rascunho do configurador (<code>dhf-rascunho-v1</code>).</li></ul>
      <p>Podes apagar tudo em <a href="${L('/conta')}">A minha área</a>. Não são usados cookies nem ferramentas de medição.</p>`],
    ['demonstracao', 'Natureza da demonstração', '<p>Da Horta e do Forno é, nesta fase, uma demonstração de conceito. Os produtos, produtores, regiões, preços, épocas, ingredientes, alergénios e disponibilidades são ilustrativos e não constituem uma oferta comercial. Nenhuma encomenda é registada e nenhum valor é cobrado.</p>'],
    ['imagens', 'Imagens e marca', '<p>As ilustrações de produtos, bancas, produtores e receitas foram desenhadas para este projeto. O logótipo e a paleta seguem a identidade aprovada da marca. As fontes Spectral e DM Sans são usadas sob a licença SIL Open Font.</p>'],
  ],
});

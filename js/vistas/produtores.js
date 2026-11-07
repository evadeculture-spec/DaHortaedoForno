// Diretório de produtores (/produtores?atividade=) e perfil (/produtores/:id)
import * as C from '../loja/catalogo.js';
import { esc, L, icone, img, cartao, $$ } from '../ui/comum.js';
import { atualizarParams } from '../router.js';

const ATIVIDADES = [...new Map(C.PRODUTORES.map((p) => [p.atividade, p.atividadeNome])).entries()];

export function produtores({ params }) {
  let ativ = params.get('atividade') || '';
  if (!ATIVIDADES.some(([a]) => a === ativ)) ativ = '';
  const html = `<div class="wrap diretorio">
    <nav class="trilho" aria-label="Percurso"><ol><li><a href="${L('/')}">Início</a></li><li aria-current="page">Produtores</li></ol></nav>
    <h1 class="pagina-titulo">Quem cultiva, amassa e apura</h1>
    <p class="pagina-lead">${C.PRODUTORES.length} produtores fictícios, cada um com a sua banca no mercado. Filtra por atividade para ver quem faz o quê.</p>
    <fieldset class="segmentos"><legend class="sr-only">Filtrar por atividade</legend>
      <label class="segmento"><input type="radio" name="atividade" value=""${!ativ ? ' checked' : ''}><span>${icone('visto', 'segmento__visto')}Todos</span></label>
      ${ATIVIDADES.map(([a, n]) => `<label class="segmento"><input type="radio" name="atividade" value="${a}"${ativ === a ? ' checked' : ''}><span>${icone('visto', 'segmento__visto')}${esc(n)}</span></label>`).join('')}
    </fieldset>
    <p class="diretorio__n" aria-live="polite" data-n></p>
    <ul class="diretorio__lista">
      ${C.PRODUTORES.map((p) => {
        const n = C.produtosDoProdutor(p.id).length;
        return `<li data-ativ="${p.atividade}"><a class="produtor-cartao" href="${L('/produtores/' + p.id)}">
          <span class="produtor-cartao__img">${img(C.imagemProdutor(p.id), '', 800, 600)}</span>
          <span class="produtor-cartao__txt"><span class="sobretitulo">${esc(p.atividadeNome)} · ${icone('pin')}${esc(p.regiao)}</span>
          <strong class="produtor-cartao__nome">${esc(p.nome)}</strong><span class="produtor-cartao__n">${n} ${n === 1 ? 'artigo' : 'artigos'}</span></span></a></li>`;
      }).join('')}
    </ul>
  </div>`;
  function montar(raiz) {
    const aplicar = () => {
      let n = 0;
      $$('.diretorio__lista > li', raiz).forEach((li) => { const ok = !ativ || li.dataset.ativ === ativ; li.hidden = !ok; if (ok) n++; });
      raiz.querySelector('[data-n]').textContent = n === 1 ? '1 produtor' : `${n} produtores`;
    };
    raiz.addEventListener('change', (e) => {
      if (e.target.name !== 'atividade') return;
      ativ = e.target.value;
      const p = new URLSearchParams(); if (ativ) p.set('atividade', ativ);
      atualizarParams(p);
      aplicar();
    });
    aplicar();
  }
  return { titulo: 'Produtores — Da Horta e do Forno', html, montar, classe: 'pg-produtores' };
}

export function perfil({ id }) {
  const p = C.produtor.get(id);
  if (!p) return null;
  const seus = C.produtosDoProdutor(id);
  const proprios = seus.filter((x) => x.banca !== 'cabazes');
  const cabazes = seus.filter((x) => x.banca === 'cabazes');
  const outros = C.PRODUTOS.filter((x) => x.banca === 'cabazes' && !x.produtores.includes(id) && x.composicao.some(([pid]) => C.produto.get(pid).produtores.includes(id)));
  const bancas = [...new Set(proprios.map((x) => C.banca.get(x.banca).nome))];
  const html = `<div class="perfil">
    <div class="wrap">
      <nav class="trilho" aria-label="Percurso"><ol><li><a href="${L('/')}">Início</a></li><li><a href="${L('/produtores')}">Produtores</a></li><li aria-current="page">${esc(p.nome)}</li></ol></nav>
      <div class="perfil__cab">
        <figure class="perfil__img">${img(C.imagemProdutor(id), p.acao, 800, 600, { prioridade: true })}</figure>
        <div class="perfil__texto">
          <p class="sobretitulo">${esc(p.atividadeNome)} · ${icone('pin')}${esc(p.regiao)} (região ilustrativa)</p>
          <h1 class="pagina-titulo">${esc(p.nome)}</h1>
          <p class="perfil__apres">${esc(p.apresentacao)}</p>
          <dl class="dados dados--linha"><div><dt>Artigos no mercado</dt><dd>${proprios.length}</dd></div><div><dt>Bancas</dt><dd>${esc(bancas.join(', '))}</dd></div>${cabazes.length + outros.length ? `<div><dt>Entra em</dt><dd>${cabazes.length + outros.length} cabazes</dd></div>` : ''}</dl>
        </div>
      </div>
      <section aria-labelledby="perfil-artigos">
        <div class="secao-cab"><h2 id="perfil-artigos" class="secao-titulo">Os artigos de ${esc(p.nome)}</h2></div>
        <ul class="grelha grelha--catalogo">${proprios.map((x, i) => `<li>${cartao(x, { prioridade: i < 3 })}</li>`).join('')}</ul>
      </section>
      ${cabazes.length + outros.length ? `<section aria-labelledby="perfil-cabazes" class="perfil__cabazes">
        <div class="secao-cab"><h2 id="perfil-cabazes" class="secao-titulo">Nos cabazes</h2></div>
        <ul class="grelha grelha--4">${[...cabazes, ...outros].map((x) => `<li>${cartao(x)}</li>`).join('')}</ul></section>` : ''}
    </div>
  </div>`;
  return { titulo: `${p.nome} — Da Horta e do Forno`, html, classe: 'pg-perfil' };
}

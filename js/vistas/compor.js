// Configurador “Compor o meu cabaz”: /cabazes/compor?partida=|composicao=|editar=|a-partir=
import * as C from '../loja/catalogo.js';
import * as E from '../loja/estado.js';
import { esc, L, icone, img, $, $$, anunciar, confirmar, darPeso, protegerImagens } from '../ui/comum.js';
import { pedirConfirmacao, pedirNome } from '../ui/dialogos.js';
import { atualizarParams } from '../router.js';

const BANCAS_LOJA = C.BANCAS.filter((b) => b.id !== 'cabazes'); // sem cabazes dentro de cabazes
const NOME_PADRAO = 'O meu cabaz';

export function compor({ params }) {
  // ---------- estado inicial a partir do URL ou do rascunho ----------
  let s = { nome: NOME_PADRAO, itens: [], cid: null, gid: null, partida: null };
  let aviso = '';
  const ra = E.lerRascunho();
  if (params.get('editar')) {
    const g = E.grupo(params.get('editar'));
    if (g) s = { nome: g.nome, itens: g.itens.map((x) => [...x]), cid: g.cid || null, gid: g.gid, partida: null };
    else aviso = 'Esse cabaz já não está no cesto. Podes compor um novo.';
  } else if (params.get('composicao')) {
    const c = E.composicao(params.get('composicao'));
    if (c) s = { nome: c.nome, itens: c.itens.map((x) => [...x]), cid: c.cid, gid: null, partida: null };
    else aviso = 'Essa composição já não está guardada.';
  } else if (params.get('a-partir') && C.produto.get(params.get('a-partir'))?.composicao) {
    const p = C.produto.get(params.get('a-partir'));
    s = { nome: `${p.nome} (à minha maneira)`, itens: p.composicao.map((x) => [...x]), cid: null, gid: null, partida: null };
  } else if (params.get('partida') && C.PARTIDAS.some((x) => x.id === params.get('partida'))) {
    const pt = C.PARTIDAS.find((x) => x.id === params.get('partida'));
    s = { nome: pt.id === 'vazio' ? NOME_PADRAO : pt.nome, itens: pt.itens.map((x) => [...x]), cid: null, gid: null, partida: pt.id };
  } else if (ra && Array.isArray(ra.itens)) {
    s = { nome: ra.nome || NOME_PADRAO, itens: ra.itens.filter(([id]) => C.produto.has(id)), cid: ra.cid && E.composicao(ra.cid) ? ra.cid : null, gid: ra.gid && E.grupo(ra.gid) ? ra.gid : null, partida: ra.partida || null };
  }
  let bancaAtiva = BANCAS_LOJA[0].id;

  const html = `<div class="wrap compor-pg" data-compor>
    <nav class="trilho" aria-label="Percurso"><ol><li><a href="${L('/')}">Início</a></li><li><a href="${L('/cabazes')}">Cabazes</a></li><li aria-current="page">Compor o meu cabaz</li></ol></nav>
    <div class="compor__cab">
      <h1 class="pagina-titulo">Compor o meu cabaz</h1>
      <p class="pagina-lead">Junta artigos de qualquer banca. O preço da caixa é a soma dos artigos que lá estão.</p>
      ${aviso ? `<p class="aviso">${esc(aviso)}</p>` : ''}
      <p class="aviso aviso--edicao" data-aviso-edicao hidden></p>
    </div>
    <section class="partidas" aria-labelledby="partidas-titulo">
      <h2 id="partidas-titulo" class="partidas__titulo">1. Ponto de partida</h2>
      <ul class="partidas__lista">${C.PARTIDAS.map((pt) => `<li><button type="button" class="partida" data-partida="${pt.id}" aria-pressed="false">
        <span class="partida__marca" aria-hidden="true">${icone('visto')}</span><strong>${esc(pt.nome)}</strong><span>${esc(pt.resumo)}</span>
        <span class="partida__n">${pt.itens.length ? `${C.contaItens(pt.itens)} artigos · ${C.euros(C.somaItens(pt.itens))}` : '0 artigos · 0,00 €'}</span></button></li>`).join('')}</ul>
    </section>
    <div class="compor__corpo">
      <section class="compor__loja" aria-labelledby="loja-titulo">
        <h2 id="loja-titulo" class="partidas__titulo">2. Escolhe nas bancas</h2>
        <div class="separadores" role="tablist" aria-label="Bancas">${BANCAS_LOJA.map((b) => `<button type="button" role="tab" id="sep-${b.id}" class="separador" aria-controls="painel-banca" data-banca="${b.id}">${icone(b.icone)}<span>${esc(b.nome)}</span><span class="separador__n" data-n-banca="${b.id}"></span></button>`).join('')}</div>
        <div class="painel-banca" id="painel-banca" role="tabpanel" tabindex="0" data-painel></div>
      </section>
      <aside class="compor__resumo" aria-labelledby="resumo-titulo-l"><div class="resumo" data-resumo="l"></div></aside>
    </div>
    <div class="barra-cabaz" data-barra><button type="button" class="barra-cabaz__btn" data-abrir-resumo aria-haspopup="dialog"><span class="barra-cabaz__caixa" aria-hidden="true">${icone('caixa')}</span><span data-barra-txt></span><span class="barra-cabaz__ver">Ver a caixa${icone('chevron-dir')}</span></button></div>
    <dialog class="painel painel--baixo" aria-labelledby="resumo-titulo-m" data-resumo-dialogo><div class="resumo" data-resumo="m"></div></dialog>
  </div>`;

  function montar(raiz) {
    const painel = $('[data-painel]', raiz);
    const dlg = $('[data-resumo-dialogo]', raiz);
    const qtd = (id) => s.itens.find(([x]) => x === id)?.[1] || 0;
    const total = () => C.somaItens(s.itens);
    const n = () => C.contaItens(s.itens);
    const gravar = () => E.gravarRascunho({ nome: s.nome, itens: s.itens, cid: s.cid, gid: s.gid, partida: s.partida });
    if ([...params.keys()].length) atualizarParams(new URLSearchParams()); // o rascunho passa a guardar o trabalho

    function definir(id, q) {
      q = Math.max(0, Math.min(E.MAX, q));
      const i = s.itens.findIndex(([x]) => x === id);
      if (i < 0 && q) s.itens.push([id, q]);
      else if (i >= 0 && !q) s.itens.splice(i, 1);
      else if (i >= 0) s.itens[i][1] = q;
      gravar();
    }
    function linhaProduto(p) {
      const q = qtd(p.id);
      const nome = esc(p.nome);
      return `<li class="linha-p${q ? ' is-na-caixa' : ''}">
        <span class="linha-p__img">${img(C.imagemProduto(p.id), '', 600, 450)}</span>
        <span class="linha-p__txt"><strong>${nome}</strong><span>${esc(C.formato(p))} · ${esc(C.nomesProdutores(p).join(', '))}</span></span>
        <span class="linha-p__preco preco-txt">${C.euros(p.preco)}</span>
        <span class="linha-p__acao" data-linha="${p.id}">${q
          ? `<span class="passo" role="group" aria-label="${nome} na caixa"><button type="button" class="passo__btn" data-c="-1" data-id="${p.id}" aria-label="${q === 1 ? 'Tirar da caixa:' : 'Menos uma unidade de'} ${nome}">${icone(q === 1 ? 'remover' : 'menos')}</button><span class="passo__n"><span aria-hidden="true">${q}</span><span class="sr-only">${q} na caixa</span></span><button type="button" class="passo__btn" data-c="1" data-id="${p.id}" aria-label="Mais uma unidade de ${nome}"${q >= E.MAX ? ' disabled' : ''}>${icone('mais')}</button></span>`
          : `<button type="button" class="btn-juntar" data-c="1" data-id="${p.id}">${icone('mais')}Juntar<span class="sr-only"> ${nome} à caixa</span></button>`}</span>
      </li>`;
    }
    function desenharBanca() {
      $$('[data-banca]', raiz).forEach((b) => { const on = b.dataset.banca === bancaAtiva; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
      painel.setAttribute('aria-labelledby', 'sep-' + bancaAtiva);
      painel.innerHTML = `<ul class="linhas-p">${C.produtosDaBanca(bancaAtiva).map(linhaProduto).join('')}</ul>`;
      protegerImagens(painel);
    }
    function caixaViva(suf) {
      const itens = s.itens.flatMap(([id, q]) => Array.from({ length: Math.min(q, 3) }, () => id));
      const vis = itens.slice(0, 24);
      const tam = itens.length <= 3 ? 30 : itens.length <= 6 ? 24 : itens.length <= 10 ? 20 : itens.length <= 16 ? 16 : 13;
      return `<div class="caixa-viva" style="--tam:${tam}%">
        <img class="caixa-viva__fundo" src="assets/ilustracoes/caixa-fundo.svg" width="900" height="640" alt="">
        <div class="caixa-viva__itens">${vis.map((id, i) => `<img src="${C.imagemProduto(id)}" alt="" width="600" height="450" style="--i:${i}" loading="lazy">`).join('')}</div>
        <img class="caixa-viva__frente" src="assets/ilustracoes/caixa-frente.svg" width="900" height="640" alt="">
        ${!itens.length ? '<p class="caixa-viva__vazia">A caixa está vazia</p>' : ''}
        ${itens.length > 24 ? `<p class="caixa-viva__mais">+${itens.length - 24}</p>` : ''}
      </div>`;
    }
    function resumo(suf) {
      const vazio = !s.itens.length;
      const g = s.gid && E.grupo(s.gid);
      const mudou = g && JSON.stringify(g.itens) !== JSON.stringify(s.itens);
      return `${suf === 'm' ? `<div class="painel__cab"><h2 class="painel__titulo" id="resumo-titulo-${suf}" tabindex="-1">A tua caixa</h2><button type="button" class="icone-btn" data-fechar-resumo>${icone('fechar')}<span class="sr-only">Fechar resumo</span></button></div>` : `<h2 class="resumo__titulo" id="resumo-titulo-${suf}" tabindex="-1">3. A tua caixa</h2>`}
        <div class="resumo__corpo">
          ${caixaViva(suf)}
          <label class="campo campo--compacto"><span class="campo__rotulo">Nome</span><input class="campo__entrada" data-nome value="${esc(s.nome)}" maxlength="60" autocomplete="off"></label>
          ${vazio ? '<p class="resumo__vazio">Junta pelo menos um artigo para poderes encomendar ou guardar.</p>' : `<ul class="resumo__lista">${s.itens.map(([id, q]) => {
            const p = C.produto.get(id);
            return `<li><span class="resumo__img">${img(C.imagemProduto(id), '', 600, 450)}</span><span class="resumo__nome">${q} × ${esc(p.nome)}<small>${esc(C.unidades(p, q))}</small></span>
              <span class="resumo__qtd"><button type="button" class="mini-btn" data-c="-1" data-id="${id}" aria-label="${q === 1 ? 'Tirar da caixa:' : 'Menos uma unidade de'} ${esc(p.nome)}">${icone(q === 1 ? 'remover' : 'menos')}</button><button type="button" class="mini-btn" data-c="1" data-id="${id}" aria-label="Mais uma unidade de ${esc(p.nome)}"${q >= E.MAX ? ' disabled' : ''}>${icone('mais')}</button></span>
              <span class="resumo__preco preco-txt">${C.euros(p.preco * q)}</span></li>`;
          }).join('')}</ul>`}
          <p class="resumo__total"><span>${n()} ${n() === 1 ? 'artigo' : 'artigos'}</span><strong data-total>${C.euros(total())}</strong></p>
          <p class="resumo__nota">Soma dos preços dos artigos. Sem taxa de caixa nesta demonstração.</p>
        </div>
        <div class="resumo__acoes">
          ${g ? `<button type="button" class="btn btn--primario btn--bloco" data-atualizar${vazio || !mudou ? ' disabled' : ''}>${icone('cesto')}Atualizar cabaz no cesto</button>
                 <button type="button" class="btn btn--linha btn--bloco" data-adicionar-novo${vazio ? ' disabled' : ''}>Adicionar como novo cabaz</button>`
              : `<button type="button" class="btn btn--primario btn--bloco" data-adicionar${vazio ? ' disabled' : ''}>${icone('cesto')}Adicionar ao cesto · ${C.euros(total())}</button>`}
          <button type="button" class="btn btn--linha btn--bloco" data-guardar${vazio ? ' disabled' : ''}>${icone('guardar')}${s.cid ? 'Guardar alterações…' : 'Guardar composição…'}</button>
          ${!vazio ? '<button type="button" class="ligacao-btn" data-esvaziar>Esvaziar a caixa</button>' : ''}
        </div>
        <p class="resumo__estado" data-estado role="status"></p>`;
    }
    function desenharResumo() {
      $$('[data-resumo]', raiz).forEach((el) => {
        const foco = document.activeElement;
        const chave = el.contains(foco) ? (foco.matches('[data-nome]') ? 'nome' : foco.dataset.c && `${foco.dataset.c}|${foco.dataset.id}`) || [...foco.attributes].find((a) => a.name.startsWith('data-'))?.name : null;
        el.innerHTML = resumo(el.dataset.resumo);
        protegerImagens(el);
        if (chave) {
          const alvo = chave === 'nome' ? $('[data-nome]', el) : chave.includes('|') ? $(`[data-c="${chave.split('|')[0]}"][data-id="${chave.split('|')[1]}"]`, el) || $(`[data-id="${chave.split('|')[1]}"]`, el) : $(`[${chave}]`, el);
          (alvo && !alvo.disabled ? alvo : $('.resumo__titulo, .painel__titulo', el))?.focus();
        }
      });
      const g = s.gid && E.grupo(s.gid);
      const av = $('[data-aviso-edicao]', raiz);
      av.hidden = !g;
      if (g) av.innerHTML = `${icone('editar')}A editar «${esc(g.nome)}», que está no cesto por ${C.euros(C.somaItens(g.itens))}. As alterações só passam para o cesto quando confirmares.`;
      $$('[data-partida]', raiz).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.partida === s.partida)));
      BANCAS_LOJA.forEach((b) => { const k = C.contaItens(s.itens.filter(([id]) => C.produto.get(id).banca === b.id)); $(`[data-n-banca="${b.id}"]`, raiz).textContent = k ? k : ''; });
      $('[data-barra-txt]', raiz).innerHTML = `<strong>${n()} ${n() === 1 ? 'artigo' : 'artigos'}</strong> · <strong class="preco-txt">${C.euros(total())}</strong>`;
    }
    function tudo() { desenharBanca(); desenharResumo(); }
    function mudarQtd(id, delta, origem) {
      const antes = qtd(id);
      definir(id, antes + delta);
      const p = C.produto.get(id);
      const depois = qtd(id);
      // redesenha só a linha da banca e o resumo, mantendo o foco
      const caixa = $(`[data-linha="${id}"]`, painel);
      if (caixa) {
        const li = caixa.closest('li');
        li.outerHTML = linhaProduto(p);
        protegerImagens(painel);
      }
      desenharResumo();
      if (origem === 'painel') {
        const nova = $(`[data-linha="${id}"]`, painel);
        const alvo = depois === 0 ? $('.btn-juntar', nova) : $(`[data-c="${delta < 0 ? -1 : 1}"]`, nova) || $('[data-c="1"]', nova);
        alvo?.focus();
      }
      anunciar(depois ? `${p.nome}: ${depois} na caixa. Total ${C.euros(total())}.` : `${p.nome} saiu da caixa. Total ${C.euros(total())}.`);
    }
    async function escolherPartida(id) {
      const pt = C.PARTIDAS.find((x) => x.id === id);
      if (s.itens.length && !(await pedirConfirmacao({ titulo: `Começar por «${pt.nome}»?`, texto: `A caixa atual (${n()} artigos, ${C.euros(total())}) é substituída. As composições guardadas e o cesto não mudam.`, sim: 'Substituir a caixa', nao: 'Manter a atual' }))) return;
      s = { nome: pt.id === 'vazio' ? NOME_PADRAO : pt.nome, itens: pt.itens.map((x) => [...x]), cid: null, gid: null, partida: pt.id };
      gravar(); tudo();
      anunciar(`${pt.nome}: ${n()} artigos, ${C.euros(total())}.`);
      $(`[data-partida="${id}"]`, raiz).focus();
    }
    const estado = (txt) => $$('[data-estado]', raiz).forEach((el) => { el.innerHTML = txt; });

    raiz.addEventListener('click', async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.partida) return escolherPartida(b.dataset.partida);
      if (b.dataset.banca) { bancaAtiva = b.dataset.banca; desenharBanca(); return; }
      if (b.dataset.c) return mudarQtd(b.dataset.id, Number(b.dataset.c), b.closest('[data-painel]') ? 'painel' : 'resumo');
      if (b.matches('[data-abrir-resumo]')) { dlg.showModal(); return; }
      if (b.matches('[data-fechar-resumo]')) { dlg.close(); return; }
      if (b.matches('[data-esvaziar]')) {
        if (await pedirConfirmacao({ titulo: 'Esvaziar a caixa?', texto: 'Os artigos saem da composição. O cesto e as composições guardadas não mudam.', sim: 'Esvaziar', nao: 'Cancelar' })) {
          s.itens = []; s.partida = null; gravar(); tudo(); anunciar('Caixa vazia.');
        }
        return;
      }
      if (b.matches('[data-guardar]')) {
        if (!s.itens.length) return;
        const existente = s.cid && E.composicao(s.cid);
        const r = await pedirNome({ titulo: existente ? 'Guardar alterações' : 'Guardar composição', nome: s.nome === NOME_PADRAO && !existente ? 'O meu cabaz de sábado' : s.nome, existente: existente?.nome });
        if (!r) return;
        s.nome = r.nome;
        s.cid = E.guardarComposicao({ nome: s.nome, itens: s.itens, cid: existente && r.modo === 'atualizar' ? s.cid : null });
        gravar(); desenharResumo();
        estado(`${icone('visto')}Guardada como «${esc(s.nome)}». Está em <a href="${L('/cabazes/guardados')}">Cabazes guardados</a>; o cesto não mudou.`);
        anunciar(`Composição ${s.nome} guardada. O cesto não mudou.`);
        return;
      }
      if (b.matches('[data-adicionar]') || b.matches('[data-adicionar-novo]')) {
        if (!s.itens.length) return;
        s.gid = E.adicionarComposicao({ nome: s.nome, itens: s.itens, cid: s.cid });
        gravar(); desenharResumo(); darPeso();
        confirmar(`Cabaz «${esc(s.nome)}» adicionado · ${C.euros(total())}`);
        estado(`${icone('visto')}No cesto por ${C.euros(total())}. Se mudares a caixa, podes atualizar o mesmo cabaz.`);
        anunciar(`Cabaz ${s.nome} adicionado ao cesto por ${C.euros(total())}.`);
        return;
      }
      if (b.matches('[data-atualizar]')) {
        const g = E.grupo(s.gid);
        if (!g || !s.itens.length) return;
        const ok = await pedirConfirmacao({ titulo: `Atualizar «${g.nome}» no cesto?`, texto: `O cabaz que está no cesto passa de <strong>${C.euros(C.somaItens(g.itens))}</strong> para <strong>${C.euros(total())}</strong>, com ${n()} artigos. Não é criado um cabaz novo.`, sim: 'Atualizar o cesto', nao: 'Continuar a editar' });
        if (!ok) return;
        E.substituirComposicao(s.gid, { nome: s.nome, itens: s.itens });
        desenharResumo();
        estado(`${icone('visto')}Cabaz atualizado no cesto: ${C.euros(total())}.`);
        anunciar(`Cabaz ${s.nome} atualizado no cesto: ${C.euros(total())}.`);
      }
    });
    raiz.addEventListener('input', (e) => {
      if (!e.target.matches('[data-nome]')) return;
      s.nome = e.target.value.trim() || NOME_PADRAO;
      gravar();
      $$('[data-nome]', raiz).forEach((i) => { if (i !== e.target) i.value = e.target.value; });
    });
    // separadores: setas esquerda/direita
    $('.separadores', raiz).addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const ids = BANCAS_LOJA.map((b) => b.id);
      let i = ids.indexOf(bancaAtiva);
      i = e.key === 'Home' ? 0 : e.key === 'End' ? ids.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length;
      bancaAtiva = ids[i]; desenharBanca(); $(`[data-banca="${bancaAtiva}"]`, raiz).focus();
    });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => $('[data-abrir-resumo]', raiz).focus());
    const off = E.ouvir((o) => { if (o.cesto) desenharResumo(); });
    gravar();
    tudo();
    return off;
  }
  return { titulo: 'Compor o meu cabaz — Da Horta e do Forno', html, montar, classe: 'pg-compor' };
}

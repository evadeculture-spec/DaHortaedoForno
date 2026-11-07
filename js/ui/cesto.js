// Gaveta do cesto: artigos e cabazes compostos, revisão com recolha simulada e conclusão da demonstração.
import * as C from '../loja/catalogo.js';
import * as E from '../loja/estado.js';
import { navegar } from '../router.js';
import { esc, L, icone, img, $, $$, anunciar, protegerImagens } from './comum.js';

const RECOLHAS = [
  { id: 'banca', nome: 'Recolher na banca', detalhe: 'Mercado do Largo, sábado, 9h–13h', custo: 0 },
  { id: 'casa', nome: 'Entrega em casa', detalhe: 'Num raio de 15 km, sábado à tarde', custo: 390 },
];

let vista = 'cesto';
let recolha = 'banca';
let abertos = new Set();
let origem = null;
const dlg = () => $('[data-gaveta-cesto]');

export function abrirCesto(de) {
  origem = de || document.activeElement;
  vista = 'cesto';
  desenhar();
  const d = dlg();
  if (!d.open) d.showModal();
  $('#cesto-titulo', d).focus();
}
export function iniciarCesto() {
  const d = dlg();
  d.addEventListener('close', () => {
    if (vista === 'concluido') vista = 'cesto';
    if (d.dataset.semRetorno) { delete d.dataset.semRetorno; return; }
    if (origem?.isConnected) origem.focus({ preventScroll: true });
  });
  d.addEventListener('click', (e) => {
    if (e.target === d) return d.close();
    const b = e.target.closest('button, a');
    if (!b) return;
    if (b.matches('[data-fechar]')) return d.close();
    if (b.matches('a[href]')) { d.dataset.semRetorno = '1'; d.close(); return; } // o router trata a navegação
    if (b.matches('[data-ir-mercado]')) { d.dataset.semRetorno = '1'; d.close(); navegar('/mercado'); return; }
    if (b.matches('[data-rever]')) { vista = 'revisao'; desenhar(); return $('[data-titulo-vista]', d).focus(); }
    if (b.matches('[data-voltar]')) { vista = 'cesto'; desenhar(); return $('#cesto-titulo', d).focus(); }
    if (b.matches('[data-concluir]')) {
      E.limparCesto();
      vista = 'concluido';
      desenhar();
      $('[data-msg-final]', d).focus();
      return anunciar('Demonstração concluída. Não foi efetuada qualquer cobrança ou encomenda.');
    }
    if (b.matches('[data-expandir]')) {
      const g = b.dataset.expandir;
      abertos.has(g) ? abertos.delete(g) : abertos.add(g);
      desenhar();
      return $(`[data-expandir="${g}"]`, d).focus();
    }
    const acao = b.dataset.l;
    if (!acao) return;
    const li = b.closest('[data-chave]');
    const chave = li.dataset.chave;
    const [tipo, id] = chave.split(':');
    const ordem = E.linhas().map((l) => (l.tipo === 'produto' ? 'p:' + l.id : 'g:' + l.gid));
    const pos = ordem.indexOf(chave);
    if (tipo === 'p') {
      const q = E.qtdProduto(id);
      E.definirProduto(id, acao === 'mais' ? q + 1 : acao === 'menos' ? q - 1 : 0);
      const p = C.produto.get(id);
      anunciar(E.qtdProduto(id) ? `${p.nome}: ${C.unidades(p, E.qtdProduto(id))}. Subtotal ${C.euros(E.subtotal())}.` : `${p.nome} retirado. Subtotal ${C.euros(E.subtotal())}.`);
    } else {
      const g = E.grupo(id);
      E.definirGrupo(id, acao === 'mais' ? g.qtd + 1 : acao === 'menos' ? g.qtd - 1 : 0);
      anunciar(E.grupo(id) ? `${g.nome}: ${E.grupo(id).qtd} ${E.grupo(id).qtd === 1 ? 'cabaz' : 'cabazes'}. Subtotal ${C.euros(E.subtotal())}.` : `${g.nome} retirado. Subtotal ${C.euros(E.subtotal())}.`);
    }
    // foco: o mesmo controlo, ou o seguinte artigo se a linha desapareceu
    const novo = $(`[data-chave="${chave}"]`, d);
    if (novo) {
      let alvo = $(`[data-l="${acao}"]`, novo);
      if (!alvo || alvo.disabled) alvo = $('[data-l="mais"]', novo);
      alvo?.focus();
    } else {
      const resto = $$('[data-chave]', d);
      (resto[Math.min(pos, resto.length - 1)]?.querySelector('[data-l="remover"]') || $('[data-ir-mercado]', d) || $('#cesto-titulo', d)).focus();
    }
  });
  d.addEventListener('change', (e) => {
    if (e.target.name === 'recolha') { recolha = e.target.value; desenhar(); $(`input[value="${recolha}"]`, d).focus(); }
  });
  E.ouvir((o) => { if (o.cesto && d.open && vista !== 'concluido') desenhar(); });
}

function linhaHTML(l) {
  if (l.tipo === 'produto') {
    const p = C.produto.get(l.id);
    return `<li class="linha" data-chave="p:${p.id}">
      <span class="linha__img">${img(C.imagemProduto(p.id), '', 600, 450)}</span>
      <div class="linha__txt"><a class="linha__nome" href="${L('/produto/' + p.id)}">${esc(p.nome)}</a><span class="linha__meta">${esc(C.unidades(p, 1).replace(/^1 /, ''))} · ${C.euros(p.preco)} cada</span></div>
      <div class="linha__ctrl">
        <span class="passo passo--peq" role="group" aria-label="Quantidade de ${esc(p.nome)}"><button type="button" class="passo__btn" data-l="menos" aria-label="Menos uma unidade de ${esc(p.nome)}"${l.qtd <= 1 ? ' disabled' : ''}>${icone('menos')}</button><span class="passo__n"><span aria-hidden="true">${l.qtd}</span><span class="sr-only">${esc(C.unidades(p, l.qtd))}</span></span><button type="button" class="passo__btn" data-l="mais" aria-label="Mais uma unidade de ${esc(p.nome)}"${l.qtd >= E.MAX ? ' disabled' : ''}>${icone('mais')}</button></span>
        <button type="button" class="linha__remover" data-l="remover">${icone('remover')}Remover<span class="sr-only"> ${esc(p.nome)}</span></button>
        <span class="linha__total preco-txt">${C.euros(E.precoLinha(l))}</span>
      </div></li>`;
  }
  const aberto = abertos.has(l.gid);
  const unit = C.somaItens(l.itens);
  return `<li class="linha linha--grupo" data-chave="g:${l.gid}">
    <span class="linha__img linha__img--caixa">${img('assets/ilustracoes/cabaz-miniatura.svg', '', 160, 120)}</span>
    <div class="linha__txt"><span class="linha__nome">${esc(l.nome)}</span><span class="linha__meta">Cabaz composto · ${C.contaItens(l.itens)} artigos · ${C.euros(unit)} cada</span>
      <button type="button" class="linha__expandir" data-expandir="${l.gid}" aria-expanded="${aberto}" aria-controls="conteudo-${l.gid}">${icone(aberto ? 'chevron-baixo' : 'chevron-dir')}${aberto ? 'Esconder conteúdo' : 'Ver conteúdo'}</button>
      <ul class="linha__conteudo" id="conteudo-${l.gid}"${aberto ? '' : ' hidden'}>${l.itens.map(([id, q]) => { const p = C.produto.get(id); return `<li><span>${q} × ${esc(p.nome)} <small>(${esc(C.unidades(p, q))})</small></span><span class="preco-txt">${C.euros(p.preco * q)}</span></li>`; }).join('')}</ul>
    </div>
    <div class="linha__ctrl">
      <span class="passo passo--peq" role="group" aria-label="Quantidade de ${esc(l.nome)}"><button type="button" class="passo__btn" data-l="menos" aria-label="Menos um cabaz ${esc(l.nome)}"${l.qtd <= 1 ? ' disabled' : ''}>${icone('menos')}</button><span class="passo__n"><span aria-hidden="true">${l.qtd}</span><span class="sr-only">${l.qtd} ${l.qtd === 1 ? 'cabaz' : 'cabazes'}</span></span><button type="button" class="passo__btn" data-l="mais" aria-label="Mais um cabaz ${esc(l.nome)}"${l.qtd >= E.MAX ? ' disabled' : ''}>${icone('mais')}</button></span>
      <a class="linha__editar" href="${L('/cabazes/compor?editar=' + l.gid)}">${icone('editar')}Editar<span class="sr-only"> ${esc(l.nome)}</span></a>
      <button type="button" class="linha__remover" data-l="remover">${icone('remover')}Remover<span class="sr-only"> ${esc(l.nome)}</span></button>
      <span class="linha__total preco-txt">${C.euros(E.precoLinha(l))}</span>
    </div></li>`;
}

function desenhar() {
  const d = dlg();
  const ls = E.linhas();
  const n = E.unidades();
  const titulo = vista === 'revisao' ? 'Rever encomenda' : vista === 'concluido' ? 'Demonstração concluída' : 'O teu cesto';
  let corpo = '', base = '';
  if (vista === 'concluido') {
    corpo = `<div class="cesto-fim"><span class="cesto-fim__marca">${icone('visto')}</span><p class="cesto-fim__msg" tabindex="-1" data-msg-final>Demonstração concluída. Não foi efetuada qualquer cobrança ou encomenda.</p><p class="cesto-fim__nota">O cesto foi esvaziado. Os favoritos e os cabazes guardados continuam guardados.</p></div>`;
    base = `<button type="button" class="btn btn--primario btn--bloco" data-ir-mercado>Voltar ao mercado</button>`;
  } else if (!ls.length) {
    vista = 'cesto';
    corpo = `<div class="cesto-vazio">${img('assets/ilustracoes/cabaz-vazio.svg', '', 900, 640)}<p>O teu cesto ainda está vazio</p><button type="button" class="btn btn--primario" data-ir-mercado>Explorar o mercado</button><a class="ligacao" href="${L('/cabazes/compor')}">Compor o meu cabaz${icone('seta-dir')}</a></div>`;
  } else if (vista === 'revisao') {
    const prods = ls.filter((l) => l.tipo === 'produto');
    const grupos = ls.filter((l) => l.tipo === 'composicao');
    const prontos = prods.filter((l) => C.ehCabaz(l.id));
    const avulsos = prods.filter((l) => !C.ehCabaz(l.id));
    const r = RECOLHAS.find((x) => x.id === recolha);
    const sec = (t, arr, fn) => (arr.length ? `<h4 class="revisao__sec">${t}</h4><ul class="revisao__lista">${arr.map(fn).join('')}</ul>` : '');
    const linP = (l) => { const p = C.produto.get(l.id); return `<li><span class="revisao__q">${l.qtd}×</span><span>${esc(p.nome)}<small>${esc(C.unidades(p, l.qtd))} · ${C.euros(p.preco)} cada</small></span><span class="preco-txt">${C.euros(E.precoLinha(l))}</span></li>`; };
    const linG = (l) => `<li><span class="revisao__q">${l.qtd}×</span><span>${esc(l.nome)}<small>Cabaz composto: ${l.itens.map(([id, q]) => `${q > 1 ? q + ' × ' : ''}${esc(C.produto.get(id).nome)}`).join(', ')}</small></span><span class="preco-txt">${C.euros(E.precoLinha(l))}</span></li>`;
    corpo = `<h3 class="revisao__titulo" tabindex="-1" data-titulo-vista>Resumo da encomenda</h3>
      ${sec('Produtos', avulsos, linP)}${sec('Cabazes prontos', prontos, linP)}${sec('Cabazes compostos', grupos, linG)}
      <fieldset class="recolha"><legend class="revisao__sec">Recolha (simulada)</legend>
        ${RECOLHAS.map((x) => `<label class="opcao opcao--radio opcao--bloco"><input type="radio" name="recolha" value="${x.id}"${x.id === recolha ? ' checked' : ''}><span class="opcao__caixa" aria-hidden="true"></span><span><strong>${esc(x.nome)}</strong> · ${x.custo ? C.euros(x.custo) : 'sem custo'}<small>${esc(x.detalhe)}. Simulação: não é pedida morada nem outros dados.</small></span></label>`).join('')}
      </fieldset>
      <p class="aviso">${icone('visto')}Demonstração de conceito. Produtos, produtores, preços, disponibilidades e recolha são ilustrativos. Ao concluir não é feita qualquer cobrança nem encomenda.</p>`;
    base = `<dl class="totais"><div><dt>Subtotal (${n} ${n === 1 ? 'unidade' : 'unidades'})</dt><dd class="preco-txt">${C.euros(E.subtotal())}</dd></div><div><dt>${esc(r.nome)} (simulado)</dt><dd class="preco-txt">${r.custo ? C.euros(r.custo) : '0,00 €'}</dd></div><div class="totais__total"><dt>Total</dt><dd class="preco-txt" data-total-final>${C.euros(E.subtotal() + r.custo)}</dd></div></dl>
      <div class="gaveta__acoes"><button type="button" class="btn btn--primario btn--bloco" data-concluir>${icone('visto')}Concluir demonstração</button><button type="button" class="btn btn--linha btn--bloco" data-voltar>${icone('seta-esq')}Voltar ao cesto para editar</button></div>`;
  } else {
    corpo = `<ul class="linhas">${ls.map(linhaHTML).join('')}</ul>`;
    base = `<dl class="totais"><div class="totais__total"><dt>Subtotal <small>${n} ${n === 1 ? 'unidade' : 'unidades'}</small></dt><dd class="preco-txt" data-subtotal>${C.euros(E.subtotal())}</dd></div></dl>
      <div class="gaveta__acoes"><button type="button" class="btn btn--primario btn--bloco" data-rever>Rever encomenda${icone('seta-dir')}</button></div>`;
  }
  d.innerHTML = `<div class="gaveta__painel">
    <div class="painel__cab"><h2 class="painel__titulo" id="cesto-titulo" tabindex="-1">${titulo}</h2><button type="button" class="icone-btn" data-fechar>${icone('fechar')}<span class="sr-only">Fechar cesto</span></button></div>
    <div class="painel__corpo gaveta__corpo">${corpo}</div>
    ${base ? `<div class="painel__base gaveta__base">${base}</div>` : ''}
  </div>`;
  protegerImagens(d);
}

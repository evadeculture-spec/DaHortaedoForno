// Diálogos modais acessíveis: confirmação e pedido de nome. Devolvem o foco a quem os abriu.
import { esc, icone } from './comum.js';

const dlg = () => document.querySelector('[data-confirmar]');

function abrir(html, focar) {
  const d = dlg();
  const origem = document.activeElement;
  d.innerHTML = html;
  return new Promise((resolver) => {
    const fim = (v) => { d.close(); resolver(v); };
    d.onclose = () => { if (origem?.isConnected) origem.focus({ preventScroll: true }); resolver(null); };
    d.onclick = (e) => { if (e.target === d) fim(null); const b = e.target.closest('[data-res]'); if (b) fim(b.dataset.res); };
    d.onsubmit = (e) => { e.preventDefault(); fim(new FormData(e.target)); };
    d.showModal();
    (focar && d.querySelector(focar))?.focus();
  });
}

export async function pedirConfirmacao({ titulo, texto, sim = 'Confirmar', nao = 'Cancelar' }) {
  const r = await abrir(`<div class="confirmar__caixa">
    <h2 id="confirmar-titulo" class="confirmar__titulo">${esc(titulo)}</h2>
    ${texto ? `<p class="confirmar__texto">${texto}</p>` : ''}
    <div class="confirmar__acoes"><button type="button" class="btn btn--linha" data-res="nao">${esc(nao)}</button><button type="button" class="btn btn--primario" data-res="sim">${esc(sim)}</button></div>
  </div>`, '[data-res="sim"]');
  return r === 'sim';
}

/** Pede um nome; se houver composição guardada, deixa escolher entre atualizar e guardar como nova. */
export async function pedirNome({ titulo, nome, existente = null }) {
  const r = await abrir(`<form class="confirmar__caixa" method="dialog">
    <h2 id="confirmar-titulo" class="confirmar__titulo">${esc(titulo)}</h2>
    <label class="campo"><span class="campo__rotulo">Nome da composição</span>
      <input class="campo__entrada" name="nome" value="${esc(nome)}" maxlength="60" required autocomplete="off" placeholder="O meu cabaz de sábado"></label>
    ${existente ? `<fieldset class="campo"><legend class="campo__rotulo">Como guardar</legend>
      <label class="opcao opcao--radio"><input type="radio" name="modo" value="atualizar" checked><span class="opcao__caixa" aria-hidden="true"></span><span>Atualizar «${esc(existente)}»</span></label>
      <label class="opcao opcao--radio"><input type="radio" name="modo" value="nova"><span class="opcao__caixa" aria-hidden="true"></span><span>Guardar como nova composição</span></label></fieldset>` : ''}
    <div class="confirmar__acoes"><button type="button" class="btn btn--linha" data-res="">Cancelar</button><button type="submit" class="btn btn--primario">${icone('guardar')}Guardar</button></div>
  </form>`, 'input[name="nome"]');
  if (!r || typeof r === 'string') return null;
  const n = String(r.get('nome') || '').trim();
  return n ? { nome: n, modo: r.get('modo') || 'nova' } : null;
}

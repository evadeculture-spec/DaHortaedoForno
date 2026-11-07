// Router com caminhos legíveis (History API). Num artefacto sem reescrita de URLs usa “#/caminho”.
export const MODO = document.documentElement.dataset.router === 'hash' || location.protocol === 'file:' ? 'hash' : 'history';

const rotas = [];
export const rota = (padrao, vista) => {
  const nomes = [];
  const re = new RegExp('^' + padrao.replace(/:([a-z]+)/g, (_, n) => { nomes.push(n); return '([^/]+)'; }) + '/?$');
  rotas.push({ re, nomes, vista });
};

export function atual() {
  const bruto = MODO === 'hash' ? (location.hash.slice(1) || '/') : location.pathname + location.search;
  const [caminho, qs = ''] = bruto.split('?');
  return { caminho: decodeURI(caminho) || '/', params: new URLSearchParams(qs), completo: bruto };
}
export const href = (c) => (MODO === 'hash' ? '#' + c : c);

let aoMudar = () => {};
export const iniciar = (fn) => {
  aoMudar = fn;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.addEventListener('popstate', () => aoMudar({ voltar: true }));
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || a.target || a.hasAttribute('download')) return;
    const h = a.getAttribute('href');
    const interno = MODO === 'hash' ? h.startsWith('#/') : h.startsWith('/') && !h.startsWith('//');
    if (!interno) return;
    e.preventDefault();
    navegar(MODO === 'hash' ? h.slice(1) : h);
  });
  aoMudar({ inicial: true });
};

/** Guarda a posição da página atual no histórico (para regressar ao mesmo ponto). */
export function guardarPosicao(extra = {}) {
  const estado = { ...(history.state || {}), scroll: window.scrollY, ...extra };
  history.replaceState(estado, '', location.href);
}
export function navegar(caminho, { substituir = false, manterPosicao = false } = {}) {
  if (!substituir) guardarPosicao();
  const url = href(caminho);
  if (substituir) history.replaceState({ ...(manterPosicao ? history.state : {}) }, '', url);
  else history.pushState({}, '', url);
  aoMudar({ substituir, manterPosicao });
}
/** Atualiza a query string sem criar nova entrada no histórico (filtros, ordenação). */
export function atualizarParams(params) {
  const { caminho } = atual();
  const qs = params.toString();
  const url = href(caminho + (qs ? '?' + qs : ''));
  history.replaceState({ ...(history.state || {}) }, '', url);
}

export function resolver(caminho) {
  for (const r of rotas) {
    const m = r.re.exec(caminho);
    if (m) return { vista: r.vista, args: Object.fromEntries(r.nomes.map((n, i) => [n, decodeURIComponent(m[i + 1])])) };
  }
  return null;
}

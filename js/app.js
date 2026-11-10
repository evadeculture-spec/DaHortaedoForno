// Arranque da loja: rotas, cabeçalho, cesto, contadores e restauro de posição.
import * as E from './loja/estado.js';
import { rota, resolver, iniciar, atual, MODO, href } from './router.js';
import { $, $$, protegerImagens, ligarCompras, atualizarControlos, anunciar } from './ui/comum.js';
import { criarPesquisa, desenharNav, marcarSecao, iniciarPainel, iniciarPesquisaMovel, compactarAoDescer, desenharRodape } from './ui/cabecalho.js';
import { abrirCesto, iniciarCesto } from './ui/cesto.js';
import { inicio } from './vistas/inicio.js';
import { mercado } from './vistas/mercado.js';
import { produto } from './vistas/produto.js';
import { produtores, perfil } from './vistas/produtores.js';
import { receitas, receita } from './vistas/receitas.js';
import { compor } from './vistas/compor.js';
import { cabazes, guardados, favoritos, marca, naoEncontrado } from './vistas/paginas.js';
import { encomenda, conta, ajuda, legal } from './vistas/apoio.js';

rota('/', inicio);
rota('/mercado', (a) => mercado(a));
rota('/mercado/:banca', (a) => mercado({ ...a, banca: a.banca }));
rota('/pesquisa', (a) => mercado({ ...a, modo: 'pesquisa' }));
rota('/produto/:id', produto);
rota('/cabazes', cabazes);
rota('/cabazes/compor', compor);
rota('/cabazes/guardados', guardados);
rota('/produtores', produtores);
rota('/produtores/:id', perfil);
rota('/receitas', receitas);
rota('/receitas/:id', receita);
rota('/favoritos', favoritos);
rota('/a-marca', marca);
rota('/encomenda', encomenda);
rota('/conta', conta);
rota('/ajuda', ajuda);
rota('/legal', legal);

const app = $('[data-app]');
let limpar = null;

// No modo artefacto (sem reescrita de URLs) as ligações absolutas do esqueleto passam a “#/…”
if (MODO === 'hash') $$('a[href^="/"]').forEach((a) => a.setAttribute('href', href(a.getAttribute('href'))));

const pesquisaTopo = criarPesquisa($('[data-pesquisa-topo]'), 'pesquisa-topo');
const pesquisaMovel = iniciarPesquisaMovel();
const nav = desenharNav();
iniciarPainel();
iniciarCesto();
desenharRodape();
compactarAoDescer();
ligarCompras(document.body);

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-abrir-cesto]');
  if (b) { e.preventDefault(); abrirCesto(b); }
});
$('[data-salto]').addEventListener('click', (e) => { e.preventDefault(); app.focus(); app.scrollIntoView(); });

function contadores() {
  const n = E.unidades();
  $$('[data-num-cesto]').forEach((el) => { el.textContent = n; });
  const f = E.favoritos().length;
  $$('[data-num-fav]').forEach((el) => { el.textContent = f; el.hidden = !f; });
  $('[data-cesto-botao]').setAttribute('aria-label', `Cesto, ${n} ${n === 1 ? 'unidade' : 'unidades'}`);
}
E.ouvir(() => { contadores(); atualizarControlos(document); });

function render(o = {}) {
  const { caminho, params } = atual();
  nav.fechar();
  for (const d of $$('dialog[open]')) { if (!d.matches('[data-gaveta-cesto]')) { d.dataset.semRetorno = '1'; d.close(); } }
  const r = resolver(caminho);
  let v = r && r.vista({ ...r.args, params });
  if (!v) v = naoEncontrado();
  if (typeof limpar === 'function') limpar();
  limpar = null;
  app.className = 'app ' + (v.classe || '');
  app.innerHTML = v.html;
  if (!o.inicial && !o.manterPosicao) { void app.offsetWidth; app.classList.add('is-a-entrar'); }
  document.title = v.titulo;
  protegerImagens(app);
  limpar = v.montar ? v.montar(app) : null;
  marcarSecao(caminho);
  const q = caminho === '/pesquisa' ? params.get('q') || '' : '';
  pesquisaTopo.definir(q);
  pesquisaMovel.definir(q);
  // posição: ao voltar, recupera o ponto onde se estava; numa página nova, começa no topo
  const y = history.state && typeof history.state.scroll === 'number' ? history.state.scroll : 0;
  if (o.voltar || o.inicial) requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, o.voltar ? y : 0)));
  else if (!o.manterPosicao) window.scrollTo(0, 0);
  if (!o.inicial && !o.manterPosicao) {
    const h1 = $('h1', app);
    if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    anunciar(v.titulo.split(' — ')[0]);
  }
}

contadores();
iniciar(render);

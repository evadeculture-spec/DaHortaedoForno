# Da Horta e do Forno — landing page e mercado de demonstração

Landing page com marketplace integrado para um mercado português de hortícolas, pão de forno e cabazes de pequenos produtores. É um site estático (HTML, CSS e JavaScript sem dependências) e corre inteiramente no navegador.

## Abrir a pré-visualização

```bash
python3 -m http.server 8080      # ou: npm start
# abrir http://localhost:8080
```

Também funciona ao abrir `index.html` diretamente no navegador. Ainda assim, um servidor local é mais fiável para as fontes e para o cesto guardado.

## Onde editar

| O quê | Onde |
| --- | --- |
| Produtos, preços (em cêntimos), quantidades, descrições e conteúdo dos cabazes | `js/catalogo.js` |
| Produtores (nome, tipo, local) e categorias dos filtros | `js/catalogo.js` |
| Textos da página (abertura, produtores, rodapé) | `index.html` |
| Cores, tipografia e espaçamentos da identidade | `:root` em `css/estilos.css` |
| Logótipo (vetorizado a partir da prancha oficial) | `assets/brand/` |
| Ilustrações (hero, estudo do cabaz, vinhetas, produtos, miniaturas, cesto vazio) | `assets/ilustracoes/`, geradas por `tools/ilustracoes/` |
| Ícones de 24 px (cesto, horta, forno e controlos) | sprite `<svg>` no início de `index.html` |

### Ilustrações

As ilustrações são SVG originais, desenhados por código. Cada peça (pão, broa, couve, cenouras, caixa kraft, forno, pano, mãos, pá) é desenhada uma só vez em `tools/ilustracoes/parts.mjs` e depois composta nas cenas de `tools/ilustracoes/build.mjs`. Por isso o mesmo cabaz aparece em três escalas: abertura, estudo da ficha e miniatura do cesto. Para regenerar depois de uma alteração:

```bash
node tools/ilustracoes/build.mjs   # ou: npm run ilustracoes
```

A paleta das ilustrações está em `tools/ilustracoes/lib.mjs` (`C`). O rótulo da caixa usa uma versão simplificada da marca, guardada em `tools/ilustracoes/marca-simplificada.json`.

## Verificação automática do percurso

`tests/percurso.spec.js` percorre o percurso do cliente a 390 px:

1. Explorar o mercado.
2. Filtrar por “Do forno” e adicionar 2 pães.
3. Abrir a ficha do cabaz misto e adicionar 1.
4. Confirmar 3 unidades e 30,60 €.
5. Atualizar a página e confirmar que o cesto se mantém.
6. Reduzir para 25,80 €.
7. Rever, voltar a editar e concluir; o cesto fica vazio.
8. Usar os filtros de produtor, incluindo “Limpar filtros”.
9. Navegar só com o teclado (menu, ficha e cesto, com devolução do foco).
10. Simular uma imagem em falta e confirmar a alternativa visual.

```bash
npm start &                 # servidor em http://localhost:8080
npm test                    # requer Playwright (npm install)
```

## Notas

- Demonstração de conceito. Produtos, produtores e preços são ilustrativos. Não há conta, morada, pagamento nem encomenda.
- O cesto é guardado em `localStorage` (`dhf-cesto-v1`) quando o navegador o permite.
- As fontes Spectral e DM Sans estão em `assets/fontes/` (licença SIL OFL). As alternativas locais são Georgia e as fontes do sistema.

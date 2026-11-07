# Da Horta e do Forno — mercado de demonstração

Loja de demonstração de um mercado português: 72 artigos em 8 bancas, 9 produtores, cabazes prontos, o configurador "Compor o meu cabaz", receitas com compra de ingredientes, favoritos e cesto com revisão da encomenda.

O site é estático: HTML, CSS e módulos ES, sem dependências. Os dados são locais e ilustrativos, e nada é cobrado nem encomendado.

## Ver

- **Publicado:** https://dahortaedoforno.netlify.app. A Netlify publica a partir deste branch; o build só valida o catálogo.
- **Localmente:** corre `npm start` e abre http://localhost:8080. O servidor (`tools/servidor.mjs`) reproduz a regra SPA da Netlify, por isso os links diretos e a atualização de páginas internas funcionam como no alojamento.

Rotas legíveis disponíveis:

- `/mercado` e `/mercado/<banca>`
- `/pesquisa?q=`
- `/produto/<id>`
- `/cabazes`, `/cabazes/compor` e `/cabazes/guardados`
- `/produtores` e `/produtores/<id>`
- `/receitas` e `/receitas/<id>`
- `/favoritos` e `/a-marca`

A pesquisa, os filtros, a ordenação e o "Mostrar mais" ficam guardados no URL.

## Onde editar

| O quê | Onde |
| --- | --- |
| Produtos, preços (em cêntimos), unidades, produtores, bancas, coleções, cabazes, pontos de partida do configurador e receitas | `js/dados/catalogo.js` |
| Cores, tipografia e espaçamentos da identidade | `:root` em `css/estilos.css` |
| Logótipo (vetorizado a partir da prancha oficial) | `assets/brand/` |
| Ilustrações de produto (uma por id) | geradas em `assets/produtos/<id>.svg`; desenho em `tools/ilustracoes/produtos.mjs` (`DESENHOS`) |
| Banca panorâmica, naturezas-mortas, coleção, vinhetas, pratos, cabaz em três estados | geradas em `assets/ilustracoes/`; desenho em `tools/ilustracoes/cenas.mjs` |
| Peças base (pão, broa, couve, cenouras, caixa kraft, forno, mãos, pá) | `tools/ilustracoes/parts.mjs` |

Depois de mudar desenhos ou dados, corre:

```bash
npm run build      # regenera as ilustrações e valida o catálogo
```

`npm run verificar` confirma, entre outras coisas:

- 72 produtos únicos, em 8 bancas de 9 artigos;
- preços válidos;
- produtores existentes;
- relações editoriais e ingredientes de receitas sem destinos quebrados;
- imagens presentes;
- cabazes com conteúdo explícito e sem custarem mais do que os artigos em separado.

## Estado guardado no navegador

| Chave | Conteúdo |
| --- | --- |
| `dhf-cesto-v2` | Artigos avulsos e cabazes compostos como grupos, cada um com os seus artigos. O cesto `dhf-cesto-v1` do primeiro protótipo é migrado automaticamente. |
| `dhf-favoritos-v1` | Favoritos. |
| `dhf-composicoes-v1` | Composições guardadas. Cada uma tem id próprio, mesmo que duas tenham o mesmo nome. |
| `dhf-rascunho-v1` | O configurador em curso. |

Concluir a demonstração limpa só o cesto.

## Testes

```bash
npm start &
npm test           # tests/percurso.spec.cjs (requer Playwright)
```

O teste percorre os cenários do brief:

- **A.** Megamenu por toque no iPad, Padaria, broa e regresso à mesma posição.
- **B.** "pao" e "grao", com filtros reproduzidos pelo URL.
- **C.** 30,60 € → 25,80 €.
- **D.** Configurador: 10,60 € → 7,00 € no mesmo grupo.
- **E.** Favoritos e composições sobrevivem à conclusão.
- **F.** Dois ingredientes de uma receita.
- **Também:** links diretos após atualizar a página, painel móvel e teclado.

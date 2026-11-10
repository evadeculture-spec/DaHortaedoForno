# Da Horta e do Forno — mercado de demonstração

Loja de demonstração de um mercado português: 72 artigos em 8 bancas, 9 produtores, cabazes prontos, o configurador "Compor o meu cabaz", receitas com compra de ingredientes, favoritos, cesto e revisão da encomenda em página própria.

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
- `/encomenda` (revisão e conclusão da demonstração)
- `/conta`, `/ajuda` e `/legal`

A pesquisa, os filtros (banca, produtor, disponibilidade, atributos, preço), a ordenação e o "Mostrar mais" ficam guardados no URL.

## Disponibilidade por época

O mercado de demonstração decorre no mês definido em `MES_DO_MERCADO` (`js/dados/catalogo.js`, 11 = novembro). A disponibilidade dos frescos é calculada a partir do campo `epoca` de cada produto:

- dentro da época: "Da época";
- no último mês da época: "Fim de época";
- fora da época: "Fora de época", com o mês em que volta. Estes artigos mantêm a ficha, mas não se podem comprar nem pôr num cabaz.

O verificador do catálogo garante que nenhum cabaz pronto nem ponto de partida do configurador contém artigos fora de época.

## Onde editar

| O quê | Onde |
| --- | --- |
| Produtos, preços (em cêntimos), unidades, produtores, bancas, coleções, cabazes, pontos de partida do configurador e receitas | `js/dados/catalogo.js` |
| Cores, escala tipográfica, espaçamentos, raios e durações (tokens) | `:root` em `css/estilos.css` |
| Alergénios e atributos dos produtos | `ALERGENIOS` e `ETIQUETAS` em `js/dados/catalogo.js` |
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

O teste cobre 16 grupos de verificação:

- homepage e primeiro ecrã no iPad horizontal;
- megamenu por toque e as 8 bancas com 9 artigos cada;
- os 72 artigos no mercado;
- ficha com galeria e alergénios, e regresso à mesma posição;
- pesquisa sem acentos, por descrição, limpar e estado sem resultados;
- filtros, ordenação e reprodução pelo URL;
- cesto (30,60 € → 25,80 €, persistência, remoção) e artigo fora de época;
- favoritos;
- configurador (10,60 € → 7,00 € no mesmo grupo);
- encomenda e conclusão;
- receitas e produtores;
- a minha área, ajuda e privacidade;
- links diretos, página não encontrada e imagem em falta;
- ausência de deslocação horizontal em 7 larguras (320 a 1440 px) e 13 páginas;
- teclado e painel móvel;
- ausência de erros de execução.

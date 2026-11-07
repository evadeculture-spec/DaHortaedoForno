/*
 * Catálogo de demonstração — Da Horta e do Forno
 * ------------------------------------------------
 * Edite aqui produtos, preços, produtores e imagens. Os preços estão em cêntimos
 * (480 = 4,80 €) para que as contas do cesto sejam sempre exatas.
 *
 * Campos de cada produto:
 *   id            identificador único (usado no cesto guardado no navegador)
 *   nome          nome apresentado
 *   categoria     'horta' | 'forno' | 'cabazes'
 *   produtores    lista de ids de produtores (ver DHF.produtores)
 *   quantidade    texto curto da quantidade de venda, mostrado no cartão
 *   unidade       { singular, plural, gramas } — descreve UMA unidade comprada
 *   precoCentimos preço de uma unidade, em cêntimos
 *   imagem / alt  ilustração do produto e texto alternativo
 *   miniatura     (opcional) imagem simplificada para o cesto
 *   descricao     uma ou duas frases
 *   conteudo      (cabazes) o que vem dentro; 'pos' posiciona a legenda no estudo ilustrado (%)
 *   estudo        (opcional) ilustração do estudo do cabaz, mostrada na ficha
 */
window.DHF = window.DHF || {};

DHF.produtores = {
  'horta-da-ribeira': {
    nome: 'Horta da Ribeira',
    tipo: 'horta',
    local: 'Beira Baixa',
  },
  'padaria-do-largo': {
    nome: 'Padaria do Largo',
    tipo: 'forno',
    local: 'Forno a lenha',
  },
};

DHF.categorias = [
  { id: 'todos', nome: 'Todos' },
  { id: 'horta', nome: 'Da horta', icone: 'horta' },
  { id: 'forno', nome: 'Do forno', icone: 'forno' },
  { id: 'cabazes', nome: 'Cabazes', icone: 'cesto' },
];

DHF.produtos = [
  {
    id: 'pao-fermentacao-lenta',
    nome: 'Pão de fermentação lenta',
    categoria: 'forno',
    produtores: ['padaria-do-largo'],
    quantidade: '750 g',
    unidade: { singular: 'pão', plural: 'pães', gramas: 750 },
    precoCentimos: 480,
    imagem: 'assets/ilustracoes/produto-pao-fermentacao-lenta.svg',
    alt: 'Pão redondo de crosta escura, com uma incisão aberta e a orelha levantada.',
    descricao: 'Massa fermentada devagar e cozida no forno a lenha. Crosta escura e estaladiça, miolo húmido e aberto.',
  },
  {
    id: 'broa-de-milho',
    nome: 'Broa de milho',
    categoria: 'forno',
    produtores: ['padaria-do-largo'],
    quantidade: '500 g',
    unidade: { singular: 'broa', plural: 'broas', gramas: 500 },
    precoCentimos: 360,
    imagem: 'assets/ilustracoes/produto-broa-de-milho.svg',
    alt: 'Broa baixa e redonda, de crosta gretada e enfarinhada, ao lado de uma fatia de miolo amarelo.',
    descricao: 'Broa baixa de farinha de milho, com crosta gretada e miolo amarelo e denso. Acompanha bem uma sopa.',
  },
  {
    id: 'cenouras-com-rama',
    nome: 'Cenouras com rama',
    categoria: 'horta',
    produtores: ['horta-da-ribeira'],
    quantidade: 'molho de 500 g',
    unidade: { singular: 'molho', plural: 'molhos', gramas: 500 },
    precoCentimos: 220,
    imagem: 'assets/ilustracoes/produto-cenouras-com-rama.svg',
    alt: 'Molho de cenouras atado com fio, com a rama verde inteira.',
    descricao: 'Cenouras arrancadas à mão e atadas em molho com a rama. A rama também se aproveita, em sopa ou salteada.',
  },
  {
    id: 'couve-portuguesa',
    nome: 'Couve portuguesa',
    categoria: 'horta',
    produtores: ['horta-da-ribeira'],
    quantidade: '1 unidade',
    unidade: { singular: 'couve', plural: 'couves', gramas: null },
    precoCentimos: 180,
    imagem: 'assets/ilustracoes/produto-couve-portuguesa.svg',
    alt: 'Couve de folhas largas e arredondadas, com nervuras claras e grossas.',
    descricao: 'Couve de folha larga e nervura branca e grossa. Boa para cozer com batata, para o cozido ou para saltear.',
  },
  {
    id: 'cabaz-da-horta',
    nome: 'Cabaz da horta',
    categoria: 'cabazes',
    produtores: ['horta-da-ribeira'],
    quantidade: '1 cabaz',
    unidade: { singular: 'cabaz', plural: 'cabazes', gramas: null },
    precoCentimos: 1650,
    imagem: 'assets/ilustracoes/produto-cabaz-da-horta.svg',
    miniatura: 'assets/ilustracoes/cabaz-horta-miniatura.svg',
    alt: 'Caixa de cartão com a marca, com couve, tomates e cenouras com rama.',
    descricao: 'Uma caixa com hortícolas da época escolhidos pela Horta da Ribeira. A composição muda com a colheita de cada semana.',
    conteudo: [
      { nome: 'Hortícolas da semana', detalhe: 'couve, cenouras com rama, tomate e o que a horta der', produtor: 'horta-da-ribeira' },
    ],
  },
  {
    id: 'cabaz-pao-e-horta',
    nome: 'Cabaz de pão e horta',
    categoria: 'cabazes',
    produtores: ['horta-da-ribeira', 'padaria-do-largo'],
    quantidade: '1 cabaz',
    unidade: { singular: 'cabaz', plural: 'cabazes', gramas: null },
    precoCentimos: 2100,
    imagem: 'assets/ilustracoes/produto-cabaz-pao-e-horta.svg',
    miniatura: 'assets/ilustracoes/cabaz-miniatura.svg',
    estudo: 'assets/ilustracoes/cabaz-estudo.svg',
    alt: 'Caixa de cartão com a marca, com pão num saco de papel, broa, couve e cenouras com rama.',
    descricao: 'O pão e a broa da Padaria do Largo juntam-se aos hortícolas da semana da Horta da Ribeira, numa só caixa.',
    conteudo: [
      { nome: 'Pão de fermentação lenta', detalhe: '1 pão de 750 g', produtor: 'padaria-do-largo', pos: { x: 19.6, y: 3 } },
      { nome: 'Broa de milho', detalhe: '1 broa de 500 g', produtor: 'padaria-do-largo', pos: { x: 50, y: 6 } },
      { nome: 'Hortícolas da semana', detalhe: 'couve, cenouras e tomate, conforme a colheita', produtor: 'horta-da-ribeira', pos: { x: 81, y: 3 } },
    ],
  },
];

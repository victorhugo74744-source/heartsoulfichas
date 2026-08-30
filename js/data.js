// Combina os arquivos de dados por domínio (js/data/races.js, traits.js,
// backgrounds.js) em window.HEARTSOUL_DATA, mantendo o mesmo formato que
// js/editor.js e js/view.js já esperam. Dividido em Ago/2026 porque o
// arquivo único tinha passado de 2000 linhas e ficava difícil de navegar
// e revisar no diff — ver js/data/*.js para o conteúdo de fato.
//
// Ordem de carregamento exigida nas páginas (ver ficha-editor.html e
// ficha-view.html): os 3 arquivos de js/data/ ANTES deste.
window.HEARTSOUL_DATA = {
  races: window.HEARTSOUL_RACES,
  traits: window.HEARTSOUL_TRAITS,
  backgrounds: window.HEARTSOUL_BACKGROUNDS
};

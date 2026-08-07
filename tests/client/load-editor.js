'use strict';

// Sobe js/editor-core.js + js/editor-build.js dentro de um sandbox de VM
// (sem jsdom, sem navegador) só pra conseguir chamar as funções puras de
// "leitura de texto de traço" (parseAttrBonusesFromText, traitElementsFound
// etc.) fora do navegador, em node --test.
//
// Por quê fazer isso em vez de simplesmente `require(...)`: esses arquivos
// são scripts globais de navegador (sem module.exports, sem CommonJS —
// carregados via <script src> em ficha-editor.html) e têm, no fim de
// editor-build.js, algumas linhas de nível superior tipo
// `document.getElementById('traitSearch').addEventListener(...)` que rodam
// assim que o arquivo carrega. Pra isso não estourar em Node (que não tem
// `document`), a gente fornece um `document`/`window` bem mínimos — o
// suficiente pra essas linhas não quebrarem, sem precisar de uma dependência
// de DOM completa (jsdom) só pra testar regex.
//
// As funções que a gente realmente testa (parseAttrBonusesFromText,
// traitElementsFound, traitHasTestBonus, normalizeSearchText,
// parseTraitSkillFromText, traitGrantedAttrs) são funções puras — não tocam
// em `document` nem em `state` — então funcionam normalmente uma vez que o
// arquivo carregou sem erro.

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fakeElement() {
  const el = {
    addEventListener() {},
    removeEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
    appendChild() {},
    insertAdjacentHTML() {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    style: {},
    dataset: {},
    options: [],
    value: '',
    textContent: '',
    innerHTML: '',
  };
  return el;
}

function loadEditorSandbox() {
  const sandbox = {
    window: {},
    document: {
      getElementById: () => fakeElement(),
      querySelectorAll: () => [],
      querySelector: () => null,
      createElement: () => fakeElement(),
      addEventListener() {},
    },
    console,
  };
  vm.createContext(sandbox);

  const root = path.resolve(__dirname, '../../js');
  for (const file of ['editor-core.js', 'editor-build.js']) {
    const code = fs.readFileSync(path.join(root, file), 'utf8');
    vm.runInContext(code, sandbox, { filename: file });
  }
  return sandbox;
}

module.exports = { loadEditorSandbox };

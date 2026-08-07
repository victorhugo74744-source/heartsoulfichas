'use strict';

// Lê js/data/traits.js e devolve o catálogo real (window.HEARTSOUL_TRAITS)
// como objeto JS. O arquivo é `window.HEARTSOUL_TRAITS = {...};` — em vez de
// executar o arquivo, extrai só o literal do objeto e faz JSON.parse (mais
// simples e mais seguro que rodar o arquivo numa VM só pra pegar um dado
// estático).

const fs = require('node:fs');
const path = require('node:path');

function loadTraitsCatalog() {
  const file = path.resolve(__dirname, '../../js/data/traits.js');
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/window\.HEARTSOUL_TRAITS\s*=\s*(\{[\s\S]*\});/);
  if (!m) throw new Error('Não achei "window.HEARTSOUL_TRAITS = {...};" em js/data/traits.js');
  return JSON.parse(m[1]);
}

// Achata o catálogo (6 categorias) numa lista única de {cat, name, cost, desc}.
function allTraits() {
  const catalog = loadTraitsCatalog();
  const out = [];
  for (const cat of Object.keys(catalog)) {
    for (const it of catalog[cat].items) {
      out.push({ cat, ...it });
    }
  }
  return out;
}

module.exports = { loadTraitsCatalog, allTraits };

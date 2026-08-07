'use strict';

// Testa o parser "melhor esforço" que lê o texto livre de um traço (o
// `desc`) e converte padrões como "+2 Vontade" em bônus automático de
// atributo, ou "Perícia: Furtividade." em perícia concedida (ver comentário
// em js/editor-core.js, seção "BÔNUS DE ATRIBUTO VINDOS DE TRAÇOS").
//
// Como o texto dos traços é escrito à mão (não estruturado), esse parser é
// só regex — e um traço novo escrito com um fraseado levemente diferente
// ("+2 em Força" em vez de "+2 Força", ou um atributo digitado em
// minúsculo) pode passar batido sem ninguém perceber, porque a ficha
// simplesmente não aplica o bônus, sem erro nenhum aparecer. Este arquivo
// tem dois tipos de teste:
//
//   1) Unitários — casos pontuais do parser (isolados, com texto inventado).
//   2) "Canário" contra o catálogo real (`js/data/traits.js`, 227 traços) —
//      varre TODO traço já cadastrado atrás de qualquer "+N PalavraComMaiúscula"
//      e confere que ou (a) é um dos 6 atributos e o parser realmente pegou,
//      ou (b) é um termo de jogo conhecido que não é atributo (Defesa,
//      Esquiva, PV, etc. — já mapeado na lista abaixo). Se um traço futuro
//      introduzir um "+N Palavra" que não é nem um atributo reconhecido nem
//      está na lista de exceções, o teste 2 quebra e aponta o traço exato —
//      é o alarme que a leva de traços de hoje (Escuridão/Raio/Luz/Vento/
//      Água) não tinha.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEditorSandbox } = require('./load-editor');
const { allTraits } = require('./load-traits-data');

const sandbox = loadEditorSandbox();
const { parseAttrBonusesFromText, parseTraitSkillFromText, traitElementsFound,
  traitHasTestBonus, normalizeSearchText, traitGrantedAttrs } = sandbox;

// As funções acima rodam dentro de uma VM (outro "realm" do V8) — o objeto/
// array que elas devolvem tem um Object.prototype/Array.prototype diferente
// do deste arquivo. assert.deepEqual (versão /strict) percebe essa
// diferença de realm e falha com "same structure but are not
// reference-equal" mesmo quando o conteúdo é idêntico. `plain()` clona o
// valor pra dentro deste realm antes de comparar.
function plain(v) { return JSON.parse(JSON.stringify(v)); }

const ATTR_NAMES = ['Força', 'Foco', 'Vontade', 'Intelecto', 'Destreza', 'Constituição'];

test('parseAttrBonusesFromText — casos unitários', async (t) => {
  await t.test('um único bônus', () => {
    assert.deepEqual(plain(parseAttrBonusesFromText('+2 Vontade.')), { vontade: 2 });
  });

  await t.test('vários bônus na mesma descrição', () => {
    assert.deepEqual(
      plain(parseAttrBonusesFromText('+1 Destreza e +2 Constituição contra frio.')),
      { destreza: 1, constituicao: 2 }
    );
  });

  await t.test('mesmo atributo mencionado duas vezes soma', () => {
    // não existe caso assim no catálogo hoje, mas traitAttrBonuses() soma
    // vários textos (raça + antecedente + traços), então a função de um
    // texto só também precisa somar corretamente se o padrão aparecer 2x.
    assert.deepEqual(plain(parseAttrBonusesFromText('+1 Foco. Depois, +1 Foco de novo.')), { foco: 2 });
  });

  await t.test('sem nenhum bônus de atributo', () => {
    assert.deepEqual(plain(parseAttrBonusesFromText('Você enxerga no escuro até 18 metros.')), {});
  });

  await t.test('texto vazio ou nulo não quebra', () => {
    assert.deepEqual(plain(parseAttrBonusesFromText('')), {});
    assert.deepEqual(plain(parseAttrBonusesFromText(null)), {});
    assert.deepEqual(plain(parseAttrBonusesFromText(undefined)), {});
  });

  await t.test('bônus de dois dígitos', () => {
    assert.deepEqual(plain(parseAttrBonusesFromText('+12 Intelecto (efeito de teste).')), { intelecto: 12 });
  });

  await t.test('NÃO confunde "+N de dano/Deslocamento/Esquiva" com atributo', () => {
    // esses padrões existem de verdade no catálogo (ex.: "+1d4 de dano
    // Elétrico", "+1 Deslocamento base", "+3 em sua Esquiva ou Parry") e
    // não devem virar bônus de atributo.
    assert.deepEqual(plain(parseAttrBonusesFromText('+1 Deslocamento base.')), {});
    assert.deepEqual(plain(parseAttrBonusesFromText('+3 em sua Esquiva ou Parry naquele teste.')), {});
    assert.deepEqual(plain(parseAttrBonusesFromText('Seus ataques causam +1d4 de dano Elétrico.')), {});
  });

  await t.test('é sensível a maiúscula/minúscula (comportamento atual, documentado)', () => {
    // Isso é o comportamento ATUAL do parser (regex sem /i) — este teste
    // documenta a limitação, não afirma que é o ideal. Se algum dia o
    // parser passar a aceitar minúsculo, é só atualizar este teste.
    assert.deepEqual(plain(parseAttrBonusesFromText('+2 vontade (minúsculo).')), {});
  });
});

test('traitGrantedAttrs — lista as chaves de atributo concedidas por um traço', () => {
  assert.deepEqual(plain(traitGrantedAttrs('+1 Destreza, +2 em testes de Esquiva.')), ['destreza']);
  assert.deepEqual(plain(traitGrantedAttrs('Nenhum bônus aqui.')), []);
});

test('parseTraitSkillFromText — perícia concedida por traço', async (t) => {
  await t.test('padrão "Perícia: Nome."', () => {
    assert.equal(parseTraitSkillFromText('Você é ágil. Perícia: Furtividade.'), 'Furtividade');
  });

  await t.test('padrão "Perícia sugerida: Nome."', () => {
    assert.equal(parseTraitSkillFromText('Perícia sugerida: Intuição.'), 'Intuição');
  });

  await t.test('com alternativas ("ou"), fica só com a primeira', () => {
    assert.equal(parseTraitSkillFromText('Perícia: Etiqueta ou Persuasão.'), 'Etiqueta');
  });

  await t.test('sem menção a perícia retorna null', () => {
    assert.equal(parseTraitSkillFromText('+2 Vontade, nada de perícia aqui.'), null);
  });

  await t.test('texto vazio não quebra', () => {
    assert.equal(parseTraitSkillFromText(''), null);
    assert.equal(parseTraitSkillFromText(null), null);
  });
});

test('traitElementsFound — detecção de elemento pelo texto', async (t) => {
  const cases = [
    ['Seus ataques causam dano de fogo adicional.', ['fogo']],
    ['Resistência a dano Gélido e a Congelamento.', ['gelo']],
    ['Dano Elétrico ao tocar, como um raio.', ['raio']],
    ['Um jato de Ácido corrosivo.', ['acido']],
    ['Imunidade a venenos e toxinas.', ['veneno']],
    ['Você se funde às sombras e às trevas.', ['sombra']],
    ['Emite luz constante.', ['luz']],
    ['Uma lâmina de vento cortante.', ['vento']],
    // "Água" e "Ácido" começam com letra acentuada — o \b nativo do JS não
    // reconhece isso como fronteira de palavra, então `\bágua\b` nunca
    // batia com nada (bug real, corrigido em js/editor-build.js depois que
    // este teste apontou). Cobre as duas formas de apóstrofo (reto e
    // tipográfico) porque nenhuma das duas deveria fazer diferença.
    ['Você respira debaixo d\u2019água.', ['agua']],
    ['Você respira debaixo d\'água normalmente.', ['agua']],
    ['ÁGUA em maiúsculas no início da frase.', ['agua']],
  ];
  for (const [desc, expected] of cases) {
    await t.test(JSON.stringify(desc), () => {
      assert.deepEqual(plain(traitElementsFound(desc)).sort(), expected.sort());
    });
  }

  await t.test('sem elemento nenhum', () => {
    assert.deepEqual(plain(traitElementsFound('Você é bom de conversa.')), []);
  });

  await t.test('texto vazio não quebra', () => {
    assert.deepEqual(plain(traitElementsFound('')), []);
  });
});

test('traitHasTestBonus — bônus "em testes de X"', () => {
  assert.equal(traitHasTestBonus('+2 em testes de Furtividade.'), true);
  assert.equal(traitHasTestBonus('+2 Vontade, sem menção a teste.'), false);
});

test('normalizeSearchText — busca ignora acento e caixa', () => {
  assert.equal(normalizeSearchText('Água'), 'agua');
  assert.equal(normalizeSearchText('Elétrico'), 'eletrico');
  assert.equal(normalizeSearchText('AMALDIÇOADO'), 'amaldicoado');
  assert.equal(normalizeSearchText(''), '');
  assert.equal(normalizeSearchText(null), '');
});

// ================= CANÁRIO CONTRA O CATÁLOGO REAL =================
// Termos de jogo conhecidos que aparecem como "+N Palavra" no catálogo de
// hoje mas NÃO são um dos 6 atributos — o parser deve mesmo ignorá-los.
// Gerado varrendo js/data/traits.js (ver conversa de atualização deste
// arquivo); se um traço novo introduzir outro termo do tipo, adicione-o
// aqui SÓ depois de confirmar que realmente não deveria ser um bônus de
// atributo — senão é bug no traço (fraseado diferente do esperado) ou uma
// lacuna real no parser, não algo pra silenciar.
const KNOWN_NON_ATTR_WORDS = new Set([
  'Defesa', 'Deslocamento', 'Esquiva', 'Furtividade', 'Iniciativa', 'Intimidação', 'PV',
]);

test('catálogo real: todo "+N Palavra" é um atributo reconhecido ou um termo já mapeado', () => {
  const traits = allTraits();
  assert.ok(traits.length >= 200, `catálogo com poucos traços (${traits.length}) — carregou certo?`);

  // Regex ampla e independente da lista de atributos do parser: pega
  // QUALQUER "+N PalavraComMaiúscula", pra servir de detector de fraseado
  // novo (não usa ATTR_NAME_TO_KEY, que é interno ao parser e não fica
  // exposto — ver comentário no topo do arquivo).
  const broad = /\+(\d+)\s*([A-ZÀ-Ú][\wÀ-ÿ]*)/g;
  const unrecognized = [];

  for (const trait of traits) {
    const desc = trait.desc || '';
    const parsed = parseAttrBonusesFromText(desc);
    let m;
    broad.lastIndex = 0;
    while ((m = broad.exec(desc))) {
      const word = m[2];
      if (ATTR_NAMES.includes(word)) {
        // é um atributo de verdade — confere que o parser realmente pegou.
        const key = { 'Força': 'forca', 'Foco': 'foco', 'Vontade': 'vontade', 'Intelecto': 'intelecto',
          'Destreza': 'destreza', 'Constituição': 'constituicao' }[word];
        if (!(key in parsed)) {
          unrecognized.push(`"${trait.name}" (${trait.cat}): "+${m[1]} ${word}" é um atributo mas o parser não pegou — desc: ${desc}`);
        }
        continue;
      }
      if (!KNOWN_NON_ATTR_WORDS.has(word)) {
        unrecognized.push(`"${trait.name}" (${trait.cat}): padrão novo "+${m[1]} ${word}" não é atributo reconhecido nem está em KNOWN_NON_ATTR_WORDS — confira se é um atributo com fraseado diferente (bug) ou adicione à lista de exceções.`);
      }
    }
  }

  assert.deepEqual(unrecognized, []);
});

test('catálogo real: nenhum atributo aparece escrito em minúsculo (o parser não pegaria)', () => {
  const traits = allTraits();
  const attrsLower = ATTR_NAMES.map(a => a.toLowerCase());
  const ciPattern = new RegExp('\\+(\\d+)\\s*(' + ATTR_NAMES.join('|') + ')\\b', 'gi');
  const offenders = [];
  for (const trait of traits) {
    const desc = trait.desc || '';
    let m;
    ciPattern.lastIndex = 0;
    while ((m = ciPattern.exec(desc))) {
      if (!ATTR_NAMES.includes(m[2])) {
        offenders.push(`"${trait.name}" (${trait.cat}): "+${m[1]} ${m[2]}" — atributo com capitalização diferente do esperado.`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});

// editor-core.js — parte de js/editor.js, dividido em Ago/2026 porque o arquivo
// único tinha passado de 1900 linhas. Constantes do sistema, estado (`state`) da ficha em edição, sistema de XP e cálculo de bônus de atributo/perícia vindos de traços.
// Carregado como script global comum (sem módulos ES) — ver ordem exigida
// em ficha-editor.html. Funções e variáveis aqui são globais e usadas
// livremente pelos outros arquivos editor-*.js.

const DATA = window.HEARTSOUL_DATA;
const ATTR_KEYS = [
  ['forca', 'Força'], ['foco', 'Foco'], ['vontade', 'Vontade'],
  ['intelecto', 'Intelecto'], ['destreza', 'Destreza'], ['constituicao', 'Constituição']
];
// Bases da criação de personagem (Nível 1). Esses valores escalam com o nível,
// seguindo o "Sistema de Níveis" do livro de regras:
//  - Pontos de Status (atributo): +3 por nível
//  - Ponto de Perícia: +1 por nível
//  - Traço: não cresce por nível — só via fusão/Pontos de Inspiração
const ATTR_POOL_BASE = 16;
const SKILL_POOL_BASE = 6;
const TRAIT_POOL_BASE = 6;
const ATTR_PER_LEVEL = 3;
const SKILL_PER_LEVEL = 1;
// Proporção de conversão do livro: 3 Pontos de Inspiração viram 1 Ponto de Traço.
const INSPIRATION_PER_TRAIT_POINT = 3;

const TRAIT_CATS = [
  ['physical_benign', 'benign'],
  ['physical_malign', 'malign'],
  ['mental_benign', 'benign'],
  ['mental_malign', 'malign'],
  ['special_benign', 'benign'],
  ['special_malign', 'malign'],
];

// Custo, em Pontos de Traço, para comprar um traço opcional extra da própria
// raça (além dos 2 gratuitos escolhidos no passo 4).
const RACE_TRAIT_BUY_COST = 2;

const BODY_PARTS = [
  ['cabeca', 'Cabeça'], ['tronco', 'Tronco'],
  ['braco_esq', 'Braço Esquerdo'], ['braco_dir', 'Braço Direito'],
  ['perna_esq', 'Perna Esquerda'], ['perna_dir', 'Perna Direita']
];
// Valores-base do HP de cada parte do corpo (livro de regras): soma-se a
// Constituição total do personagem a cada um destes valores-base.
const BODY_PART_BASE_HP = {
  cabeca: 14, tronco: 18, braco_esq: 10, braco_dir: 10, perna_esq: 12, perna_dir: 12
};
// Exceção: Fadas têm o HP reduzido pela metade, conforme o próprio traço
// racial (Essência Feérica / "HP Reduzido") descrito no livro de regras.
const FAIRY_BODY_PART_BASE_HP = {
  cabeca: 6, tronco: 9, braco_esq: 5, braco_dir: 5, perna_esq: 6, perna_dir: 6
};
function bodyPartBaseHp(key) {
  const table = (state.raceId === 'raca-fada') ? FAIRY_BODY_PART_BASE_HP : BODY_PART_BASE_HP;
  return table[key];
}
function hpMaxForPart(key) {
  const bonus = (state.resources && state.resources.hpDieBonus) || 0;
  return bodyPartBaseHp(key) + attrTotalValue('constituicao') + bonus;
}

// ================= DADOS DE NÍVEL (HP, Estamina, Energia) =================
// Toda vez que o personagem sobe de nível, libera 1 rolagem de dado para
// cada recurso (HP, Estamina, Energia). O valor rolado se SOMA ao máximo já
// calculado pelas fórmulas normais. O dado de HP soma o mesmo valor rolado
// em TODAS as partes do corpo ao mesmo tempo. O dado de Estamina/Energia é
// sempre 1d10. O dado de HP começa em 1d6 e pode ser trocado pelo próprio
// jogador nas Mudanças de Classe (níveis 4, 8, 12, 16, 20).
const HP_DICE_MILESTONES = [4, 8, 12, 16, 20];
function currentHpDieSides() {
  const ms = (state.resources && state.resources.hpDieMilestones) || {};
  for (let i = HP_DICE_MILESTONES.length - 1; i >= 0; i--) {
    const lvl = HP_DICE_MILESTONES[i];
    if (charLevel() >= lvl && ms[lvl]) return ms[lvl];
  }
  return 6;
}
// Quantas rolagens de nível ainda estão pendentes para um recurso: 1 por
// nível ganho acima do nível 1, menos as que já foram roladas.
function pendingLevelRolls(rollsDone) {
  return Math.max(0, (charLevel() - 1) - (rollsDone || 0));
}

function emptyResources() {
  return {
    hp: {
      cabeca: { max: 0, cur: 0 }, tronco: { max: 0, cur: 0 },
      braco_esq: { max: 0, cur: 0 }, braco_dir: { max: 0, cur: 0 },
      perna_esq: { max: 0, cur: 0 }, perna_dir: { max: 0, cur: 0 }
    },
    // estaminaDie/vigorDie guardam o resultado do dado rolado na criação da
    // ficha (1d15 para Estamina, 1d12 para Energia). Enquanto for null, a
    // ficha ainda não rolou (fichas criadas antes desta atualização também
    // ficam com null e continuam usando o valor manual antigo). rolls conta
    // quantas vezes o jogador já rolou/re-rolou (máximo 2, só na criação).
    estaminaMax: 0, estaminaCur: 0, estaminaDie: null, estaminaRolls: 0,
    vigorMax: 0, vigorCur: 0, vigorDie: null, vigorRolls: 0,
    sanityCur: null, // null = ainda não ajustada manualmente, usa o máximo calculado
    // Bônus acumulado das rolagens de dado por nível (HP: 1d6, trocável nas
    // mudanças de classe; Estamina/Energia: sempre 1d10). *DieRolls conta
    // quantas vezes o jogador já rolou o dado de nível daquele recurso.
    hpDieBonus: 0, hpDieRolls: 0, hpDieMilestones: { 4: null, 8: null, 12: null, 16: null, 20: null },
    estaminaLevelBonus: 0, estaminaLevelRolls: 0,
    vigorLevelBonus: 0, vigorLevelRolls: 0,
    // Economia: moedas metálicas do sistema (Bronze < Prata < Ouro < Platina),
    // cada uma valendo 10 vezes a de nível imediatamente inferior.
    economy: { bronze: 0, prata: 0, ouro: 0, platina: 0 }
  };
}

let state = {
  characterName: '', energyType: '', level: 1, hand: 'Destro',
  height: '', age: null, currentClass: '', xp: 0,
  attributes: { forca: 1, foco: 1, vontade: 1, intelecto: 1, destreza: 1, constituicao: 1 },
  attrManualBonus: { forca: 0, foco: 0, vontade: 0, intelecto: 0, destreza: 0, constituicao: 0 },
  skills: [],
  raceId: '', raceOptionalChosen: [], raceTraitsBought: [], raceVariantChosen: null,
  // "loadedRaceId" é a raça que a ficha já tinha ao ser aberta, e
  // "raceFixedTraitOverride" guarda o texto do Traço Fixo se ele tiver sido
  // editado pelo Mestre (painel de traços em ficha-view.html) e não bater
  // mais com o texto padrão do catálogo da raça. Sem isso, salvar a ficha
  // por aqui (o assistente de criação) apagaria a edição do Mestre, porque
  // "saveSheet" sempre escreveria de volta o texto original da raça — ver
  // uso logo abaixo e em saveSheet/loadExistingSheet.
  loadedRaceId: null, raceFixedTraitOverride: null,
  // Mesma ideia acima, só que para as duas listas de traço racial (os 2
  // opcionais escolhidos de graça e os comprados com Pontos de Traço), que
  // são guardadas como arrays de texto solto — não dá pra usar um único
  // valor de "override" porque são várias linhas. Em vez disso, guardamos o
  // array exatamente como veio salvo ("...Loaded") e um flag por lista
  // dizendo se o jogador mexeu nos checkboxes desta sessão de edição. Se não
  // mexeu, o texto salvo (que pode ter sido evoluído/fundido pelo Mestre) é
  // preservado tal como está; se mexeu, aí sim recalcula a partir dos
  // índices marcados — ver currentRaceOptionalTexts/currentRaceBoughtTexts.
  raceOptionalTraitsLoaded: null, raceTraitsBoughtLoaded: null,
  raceOptionalTouched: false, raceBoughtTouched: false,
  backgroundId: '', backgroundSkills: [], // até 2 perícias extras concedidas pelo antecedente
  extraTraits: [], // {cat, name, cost, desc}
  abilities: [], // {name, cost, actionType, desc} — habilidades criadas pelo jogador; cost é texto livre
  techniques: [], // {name, cost, actionType, desc} — técnicas criadas a partir de habilidades/traços/raça/energia; cost é texto livre
  resources: emptyResources(),
  inspirationPoints: 0, traitBonusFromInspiration: 0,
  history: '', appearanceImage: '', inventoryItems: [{ name: '', weight: 0, qty: 1 }], notes: [''],
  folderId: '', folderName: '', masterId: null
};

// ================= BÔNUS DE ATRIBUTO VINDOS DE TRAÇOS =================
// Faz uma leitura automática (melhor esforço) do texto dos traços para achar
// padrões como "+2 Força" e somar esse valor ao atributo correspondente.
// Como o texto é livre, casos ambíguos (ex.: "+2 Destreza OU +2 Constituição,
// escolha") podem ser lidos errado — por isso existe também o campo de
// "Ajuste manual" em cada atributo, pra o jogador corrigir na mão.
const ATTR_NAME_TO_KEY = {
  'Força': 'forca', 'Foco': 'foco', 'Vontade': 'vontade',
  'Intelecto': 'intelecto', 'Destreza': 'destreza', 'Constituição': 'constituicao'
};
function parseAttrBonusesFromText(text) {
  const bonuses = {};
  if (!text) return bonuses;
  const re = /\+(\d+)\s*(Força|Foco|Vontade|Intelecto|Destreza|Constituição)\b/g;
  let m;
  while ((m = re.exec(text))) {
    const key = ATTR_NAME_TO_KEY[m[2]];
    bonuses[key] = (bonuses[key] || 0) + parseInt(m[1]);
  }
  return bonuses;
}
// Ver comentário de "raceOptionalTraitsLoaded" acima: usa o texto salvo tal
// como está (preservando evolução/fusão feita pelo Mestre) enquanto o
// jogador não mexer nos checkboxes de traço racial desta ficha nesta sessão
// de edição; a raça precisa também continuar sendo a mesma que foi carregada.
function currentRaceOptionalTexts(race) {
  if (!state.raceOptionalTouched && state.raceId === state.loadedRaceId && state.raceOptionalTraitsLoaded) {
    return state.raceOptionalTraitsLoaded;
  }
  return (state.raceOptionalChosen || []).map(i => race.optionalTraits[i]).filter(Boolean);
}
function currentRaceBoughtTexts(race) {
  if (!state.raceBoughtTouched && state.raceId === state.loadedRaceId && state.raceTraitsBoughtLoaded) {
    return state.raceTraitsBoughtLoaded;
  }
  return (state.raceTraitsBought || []).map(i => race.optionalTraits[i]).filter(Boolean);
}
// Junta todos os textos de traço relevantes da ficha (Traço Fixo da raça,
// traços raciais opcionais/comprados, variante de raça, antecedente e
// traços adicionais). Extraído de traitAttrBonuses() pra ser reaproveitado
// também pelo cálculo de bônus de Energia (Mana/Fé/Aura) — ver
// traitEnergyBonus() logo abaixo.
function traitTextsList() {
  const texts = [];
  if (state.raceId) {
    const race = DATA.races.find(r => r.id === state.raceId);
    if (race) {
      const raceOverrideActive = state.raceId === state.loadedRaceId && state.raceFixedTraitOverride;
      texts.push(raceOverrideActive ? state.raceFixedTraitOverride : race.fixedTrait);
      currentRaceOptionalTexts(race).forEach(t => texts.push(t));
      currentRaceBoughtTexts(race).forEach(t => texts.push(t));
      if (race.variantChoice && state.raceVariantChosen !== null && state.raceVariantChosen !== undefined) {
        const v = race.variantChoice.options[state.raceVariantChosen];
        if (v) texts.push(`${v.name}: ${v.desc}`);
      }
    }
  }
  if (state.backgroundId) {
    const bg = DATA.backgrounds.find(b => b.id === state.backgroundId);
    if (bg && bg.atributos) texts.push(bg.atributos);
  }
  state.extraTraits.forEach(t => texts.push(t.desc));
  return texts;
}
function traitAttrBonuses() {
  const texts = traitTextsList();
  const total = { forca: 0, foco: 0, vontade: 0, intelecto: 0, destreza: 0, constituicao: 0 };
  texts.map(parseAttrBonusesFromText).forEach(b => {
    Object.keys(b).forEach(k => { total[k] += b[k]; });
  });
  return total;
}
function attrTotalValue(k) {
  const bonuses = traitAttrBonuses();
  const manual = (state.attrManualBonus && state.attrManualBonus[k]) || 0;
  return state.attributes[k] + (bonuses[k] || 0) + manual;
}

// ================= BÔNUS DE ENERGIA (RESERVATÓRIO DE CLASSE) VINDOS DE TRAÇOS =================
// Mesma leitura "melhor esforço" usada acima para atributos, agora pro
// reservatório de Energia (Mana, Fé ou Aura, conforme a energia escolhida
// na etapa 1). Três padrões de texto cobertos, vistos nos traços raciais
// já cadastrados:
//  - Nomeando a energia específica — "+2 pontos de Mana adicionais",
//    "+3 pontos de Fé adicionais [ao reservatório]" — só conta se a energia
//    escolhida da ficha (state.energyType) for essa mesma. Como o próprio
//    traço já é condicionado a essa energia no texto ("Se a classe for
//    Crença (Fé): ..."), bastar checar o nome basta pra não aplicar bônus
//    de Fé em quem escolheu Mana, por exemplo.
//  - "Coringa", sem nomear energia — "+2 pontos adicionais da energia de
//    sua classe" (Draconato) — conta sempre, seja qual for a energia.
//  - Percentual — "Reservatório Ampliado: [...] é 50% maior" (Fada) —
//    aplicado depois de tudo (dado + atributo + bônus fixo), como o
//    próprio texto do traço descreve.
function parseEnergyBonusFromText(text, energyType) {
  let flat = 0, percent = 0;
  if (!text || !energyType) return { flat, percent };
  const namedRe = /\+(\d+)\s*pontos?\s+de\s+(Mana|Fé|Aura)\s+adicionais/gi;
  let m;
  while ((m = namedRe.exec(text))) {
    if (m[2].toLowerCase() === energyType.toLowerCase()) flat += parseInt(m[1], 10);
  }
  const anyRe = /\+(\d+)\s*pontos?\s+adicionais\s+da\s+energia\s+de\s+sua\s+classe/gi;
  while ((m = anyRe.exec(text))) flat += parseInt(m[1], 10);
  const pctMatch = text.match(/reservat[oó]rio\s+de\s+energia\s+de\s+classe[^.]*?(\d+)%\s+maior/i);
  if (pctMatch) percent += parseInt(pctMatch[1], 10);
  return { flat, percent };
}
function traitEnergyBonus() {
  const total = { flat: 0, percent: 0 };
  traitTextsList().forEach(t => {
    const b = parseEnergyBonusFromText(t, state.energyType);
    total.flat += b.flat;
    total.percent += b.percent;
  });
  return total;
}

// ================= PERÍCIA VINDA DE TRAÇO =================
// Mesma lógica de "melhor esforço" acima, mas pra achar o padrão
// "Perícia: Nome." ou "Perícia sugerida: Nome." no texto do traço. Quando
// o texto lista alternativas ("Etiqueta ou Persuasão"), fica só com a
// primeira — o jogador pode ajustar na mão trocando a perícia na lista.
function parseTraitSkillFromText(text) {
  if (!text) return null;
  const m = text.match(/Perícia(?:\s+sugerida)?:\s*([^.]+)\./i);
  if (!m) return null;
  const raw = m[1].split(/\s+ou\s+/i)[0].trim();
  return raw || null;
}

let editingSheetId = null;

function charLevel() { return state.level || 1; }

// ================= SISTEMA DE EXPERIÊNCIA (XP) =================
// Fórmula do livro de regras: 800 × Nível atual. Ao atingir a marca, o
// personagem sobe de nível imediatamente, o contador de XP é zerado e
// qualquer excedente é descartado (não é aproveitado para o próximo nível).
function xpNeededForLevel(level) { return 800 * level; }
function updateXpHint() {
  const info = document.getElementById('xpNeededInfo');
  if (!info) return;
  const L = charLevel();
  if (L >= 20) {
    info.textContent = 'Nível máximo (20) atingido — não é necessário mais XP.';
  } else {
    info.textContent = `Necessário para o próximo nível: ${xpNeededForLevel(L)} XP. Ao atingir esse valor, o nível sobe automaticamente e o XP excedente é descartado.`;
  }
}
// Aplica a subida de nível automática ao ler o XP atual do campo. Como o
// excedente é descartado (não carrega para o próximo nível), o laço abaixo
// só chega a subir mais de um nível se o valor digitado já for suficiente
// para o nível seguinte também.
function applyXpLevelUp() {
  let leveledUp = false;
  while (charLevel() < 20 && (state.xp || 0) >= xpNeededForLevel(charLevel())) {
    state.level = charLevel() + 1;
    state.xp = 0;
    leveledUp = true;
  }
  if (leveledUp) {
    const levelInput = document.getElementById('fLevel');
    const xpInput = document.getElementById('fXP');
    if (levelInput) levelInput.value = state.level;
    if (xpInput) xpInput.value = state.xp;
    updateAttrPoolDisplay();
    updateSkillPoolDisplay();
    renderSkills();
    // Subir de nível libera rolagens pendentes do dado de vida/estamina/energia.
    renderResources();
  }
  updateXpHint();
}
function initXPUI() {
  const xpInput = document.getElementById('fXP');
  if (!xpInput) return;
  xpInput.addEventListener('input', () => {
    state.xp = Math.max(0, parseInt(xpInput.value) || 0);
    applyXpLevelUp();
  });
  updateXpHint();
}

// ---- Limites que escalam com o nível ----
function attrPoolMax() { return ATTR_POOL_BASE + ATTR_PER_LEVEL * (charLevel() - 1); }
function skillPoolMax() { return SKILL_POOL_BASE + SKILL_PER_LEVEL * (charLevel() - 1); }
// Limite máximo de bônus que UMA perícia pode ter, conforme a tabela de progressão do livro.
function skillCapPerSkill() {
  const L = charLevel();
  if (L >= 20) return 7;
  if (L >= 15) return 6;
  if (L >= 10) return 5;
  if (L >= 5) return 4;
  return 3;
}
function traitPoolMax() { return TRAIT_POOL_BASE + (state.traitBonusFromInspiration || 0); }

function attrPoolSpent() {
  return ATTR_KEYS.reduce((sum, [k]) => sum + (state.attributes[k] - 1), 0);
}
function attrMod(v) { return Math.floor(v / 2); }

// ================= MECÂNICA DE PESO (Livro de Regras — "Mão Principal e Peso") =================
// Capacidade de Carga = 15 + modificador de Constituição (atributo total, já
// com bônus de traço/antecedente e ajuste manual, igual ao usado no HP).
function carryCapacity() {
  return 15 + attrMod(attrTotalValue('constituicao'));
}
// Soma peso × quantidade de cada item do inventário (itens sem nome ainda
// contam pro total, já que o jogador pode estar só ajustando o peso antes
// de nomear o item).
function inventoryTotalWeight() {
  return (state.inventoryItems || []).reduce((sum, it) => {
    const w = parseFloat(it && it.weight) || 0;
    const q = parseInt(it && it.qty, 10);
    return sum + w * (isNaN(q) ? 1 : q);
  }, 0);
}
// Faixas de penalidade do livro de regras:
//  - Carga Pesada: 50% a 99% da capacidade → -2 em testes físicos.
//  - Carga Máxima: exatamente 100% da capacidade → -5 em testes físicos, -2m de deslocamento.
//  - Sobrecarga: acima da capacidade → -5 adicional de -2 por ponto excedente (acumulativo),
//    deslocamento pela metade, sem correr ou esquivar. O livro só recomenda até 5 pontos
//    de sobrecarga; acima disso fica a critério do mestre.
function weightStatus(total, capacity) {
  const cap = capacity > 0 ? capacity : 1;
  if (total > cap) {
    const excess = total - cap;
    return {
      key: 'sobrecarga', label: 'Sobrecarga',
      penalty: -5 - 2 * excess,
      note: `Deslocamento reduzido à metade; não pode correr ou esquivar. ${excess} ponto(s) de peso excedente(s)${excess > 5 ? ' — acima do limite de +5 recomendado pelo livro de regras (a critério do mestre).' : '.'}`
    };
  }
  if (total === cap) {
    return { key: 'maxima', label: 'Carga Máxima', penalty: -5, note: 'Deslocamento reduzido em 2 metros.' };
  }
  if (total >= cap * 0.5) {
    return { key: 'pesada', label: 'Carga Pesada', penalty: -2, note: '' };
  }
  return { key: 'normal', label: 'Normal', penalty: 0, note: '' };
}

// Perícias vindas de Antecedente ou de Traço já entram com 1 ponto grátis,
// que não é descontado da Reserva de Perícia (esse "chão" gratuito é o que
// skillFreePoints() devolve; só o que passa disso conta como gasto). Se a
// mesma perícia vier das DUAS origens ao mesmo tempo (Traço + Antecedente),
// os pontos grátis se somam (1+1=2) — mas o teto por perícia (skillCapPerSkill)
// continua valendo normalmente por cima disso.
function skillFreePoints(s) {
  if (s.fromBackground && s.fromTrait) return 2;
  return (s.fromBackground || s.fromTrait) ? 1 : 0;
}
function skillPoolSpent() {
  return state.skills.reduce((sum, s) => sum + Math.max(0, s.points - skillFreePoints(s)), 0);
}

function traitPoolSpent() {
  const extraCost = state.extraTraits.reduce((sum, t) => sum + t.cost, 0);
  const raceCost = (state.raceTraitsBought || []).length * RACE_TRAIT_BUY_COST;
  return extraCost + raceCost;
}
function hasMalignTrait() {
  return state.extraTraits.some(t => t.cat.endsWith('_malign'));
}


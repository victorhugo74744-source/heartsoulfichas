const DATA = window.HEARTSOUL_DATA;
const ATTR_KEYS = [
['forca', 'Força'], ['foco', 'Foco'], ['vontade', 'Vontade'],
['intelecto', 'Intelecto'], ['destreza', 'Destreza'], ['constituicao', 'Constituição']
];
const ATTR_POOL_BASE = 16;
const SKILL_POOL_BASE = 6;
const TRAIT_POOL_BASE = 6;
const ATTR_PER_LEVEL = 3;
const SKILL_PER_LEVEL = 1;
const INSPIRATION_PER_TRAIT_POINT = 3;
const TRAIT_CATS = [
['physical_benign', 'benign'],
['physical_malign', 'malign'],
['mental_benign', 'benign'],
['mental_malign', 'malign'],
['special_benign', 'benign'],
['special_malign', 'malign'],
];
const RACE_TRAIT_BUY_COST = 2;
const BODY_PARTS = [
['cabeca', 'Cabeça'], ['tronco', 'Tronco'],
['braco_esq', 'Braço Esquerdo'], ['braco_dir', 'Braço Direito'],
['perna_esq', 'Perna Esquerda'], ['perna_dir', 'Perna Direita']
];
const BODY_PART_BASE_HP = {
cabeca: 14, tronco: 18, braco_esq: 10, braco_dir: 10, perna_esq: 12, perna_dir: 12
};
const FAIRY_BODY_PART_BASE_HP = {
cabeca: 6, tronco: 9, braco_esq: 5, braco_dir: 5, perna_esq: 6, perna_dir: 6
};
const DC_BODY_PART_BASE_HP = {
cabeca: 12, tronco: 16, braco_esq: 10, braco_dir: 10, perna_esq: 14, perna_dir: 14
};
function bodyPartBaseHp(key) {
if (typeof isDeadlyCardsActive === 'function' && isDeadlyCardsActive()) return DC_BODY_PART_BASE_HP[key];
const table = (state.raceId === 'raca-fada') ? FAIRY_BODY_PART_BASE_HP : BODY_PART_BASE_HP;
return table[key];
}
function hpMaxForPart(key) {
const bonus = (state.resources && state.resources.hpDieBonus) || 0;
if (typeof isDeadlyCardsActive === 'function' && isDeadlyCardsActive()) {
return bodyPartBaseHp(key) + attrMod(attrTotalValue('constituicao')) + bonus;
}
return bodyPartBaseHp(key) + attrTotalValue('constituicao') + bonus;
}
const HP_DICE_MILESTONES = [4, 8, 12, 16, 20];
function currentHpDieSides() {
const ms = (state.resources && state.resources.hpDieMilestones) || {};
for (let i = HP_DICE_MILESTONES.length - 1; i >= 0; i--) {
const lvl = HP_DICE_MILESTONES[i];
if (charLevel() >= lvl && ms[lvl]) return ms[lvl];
}
return 6;
}
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
armor: {
cabeca: { max: 0, cur: 0 }, tronco: { max: 0, cur: 0 },
braco_esq: { max: 0, cur: 0 }, braco_dir: { max: 0, cur: 0 },
perna_esq: { max: 0, cur: 0 }, perna_dir: { max: 0, cur: 0 }
},
estaminaMax: 0, estaminaCur: 0, estaminaDie: null, estaminaRolls: 0,
vigorMax: 0, vigorCur: 0, vigorDie: null, vigorRolls: 0,
sanityCur: null,
hpDieBonus: 0, hpDieRolls: 0, hpDieMilestones: { 4: null, 8: null, 12: null, 16: null, 20: null },
estaminaLevelBonus: 0, estaminaLevelRolls: 0,
vigorLevelBonus: 0, vigorLevelRolls: 0,
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
loadedRaceId: null, raceFixedTraitOverride: null,
raceOptionalTraitsLoaded: null, raceTraitsBoughtLoaded: null,
raceOptionalTouched: false, raceBoughtTouched: false,
backgroundId: '', backgroundSkills: [],
extraTraits: [],
abilities: [],
techniques: [],
resources: emptyResources(),
inspirationPoints: 0, traitBonusFromInspiration: 0,
history: '', appearanceImage: '', inventoryItems: [{ name: '', weight: 0, qty: 1 }], notes: [''],
folderId: '', folderName: '', masterId: null, loadedFolderId: '',
complementos: {}
};
const ATTR_NAME_TO_KEY = {
'Força': 'forca', 'Foco': 'foco', 'Vontade': 'vontade',
'Intelecto': 'intelecto', 'Destreza': 'destreza', 'Constituição': 'constituicao'
};
// "+N em todos os atributos, exceto X (e Y)": soma N em cada um dos 6 atributos, menos nos citados como exceção.
// Aceita "exceto", "com exceção de/do/da/dos", "menos" e "salvo"; sem exceção, vale para os 6.
const ATTR_ALL_KEYS = ['forca', 'foco', 'vontade', 'intelecto', 'destreza', 'constituicao'];
const ATTR_ANY_NAME = 'For[cç]a|Foco|Vontade|Intelecto|Destreza|Constitui[cç][aã]o';
const ATTR_ALL_RE_SRC = '\\+(\\d+)\\s*(?:em\\s+|a\\s+|para\\s+)?todos\\s+(?:os\\s+)?atributos(?![\\p{L}])'
+ '(?:\\s*[,(]?\\s*(?:exceto|com\\s+exce[cç][aã]o\\s+d[eoa]s?|menos|salvo)\\s+((?:' + ATTR_ANY_NAME + ')'
+ '(?:(?:\\s*,\\s*(?:e\\s+|ou\\s+)?|\\s+e\\s+|\\s+ou\\s+)(?:' + ATTR_ANY_NAME + '))*))?';
function attrKeyFromAnyName(name) {
const n = String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
return ATTR_ALL_KEYS.includes(n) ? n : null;
}
function addAllAttrBonuses(text, bonuses) {
const re = new RegExp(ATTR_ALL_RE_SRC, 'giu');
let m;
while ((m = re.exec(text))) {
const excluded = new Set();
if (m[2]) {
(m[2].match(new RegExp(ATTR_ANY_NAME, 'giu')) || []).forEach(n => {
const k = attrKeyFromAnyName(n);
if (k) excluded.add(k);
});
}
ATTR_ALL_KEYS.forEach(k => {
if (!excluded.has(k)) bonuses[k] = (bonuses[k] || 0) + parseInt(m[1]);
});
}
}
function parseAttrBonusesFromText(text) {
const bonuses = {};
if (!text) return bonuses;
const re = /\+(\d+)\s*(Força|Foco|Vontade|Intelecto|Destreza|Constituição)\b/g;
let m;
while ((m = re.exec(text))) {
const key = ATTR_NAME_TO_KEY[m[2]];
bonuses[key] = (bonuses[key] || 0) + parseInt(m[1]);
}
addAllAttrBonuses(text, bonuses);
return bonuses;
}
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
function parseTraitSkillFromText(text) {
if (!text) return null;
const m = text.match(/Perícia(?:\s+sugerida)?:\s*([^.]+)\./i);
if (!m) return null;
const raw = m[1].split(/\s+ou\s+/i)[0].trim();
return raw || null;
}
let editingSheetId = null;
function charLevel() { return state.level || 1; }
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
function attrPoolMax() {
if (typeof isDeadlyCardsActive === 'function' && isDeadlyCardsActive()) return dcCaps().attr;
return ATTR_POOL_BASE + ATTR_PER_LEVEL * (charLevel() - 1);
}
function skillPoolMax() {
if (typeof isDeadlyCardsActive === 'function' && isDeadlyCardsActive()) return dcCaps().skill;
return SKILL_POOL_BASE + SKILL_PER_LEVEL * (charLevel() - 1);
}
function skillCapPerSkill() {
const L = charLevel();
if (L >= 20) return 7;
if (L >= 15) return 6;
if (L >= 10) return 5;
if (L >= 5) return 4;
return 3;
}
function traitPoolMax() {
if (typeof isDeadlyCardsActive === 'function' && isDeadlyCardsActive()) return dcCaps().trait;
return TRAIT_POOL_BASE + (state.traitBonusFromInspiration || 0);
}
function attrPoolSpent() {
return ATTR_KEYS.reduce((sum, [k]) => sum + (state.attributes[k] - 1), 0);
}
function attrMod(v) { return Math.floor(v / 2); }
// Traço que dobra a capacidade de carga (ex.: "Capacidade de carga é dobrada."): a frase precisa citar a capacidade de carga
// e "dobra/dobrada/dobro/duplica". Aplica uma vez, sobre o valor final (15 + mod. de Constituição), então os limites de
// Carga Pesada / Máxima / Sobrecarga acompanham.
function textDoublesCarry(text) {
if (!text) return false;
return String(text).split(/[.!?]+\s+/).some(s => /(?:capacidade\s+de\s+carg(?:a|ar)|peso\s+que\s+(?:voc[êe]\s+)?(?:pode|consegue)\s+carregar)/i.test(s) && /\bdobr\w*|\bdupl\w*/i.test(s));
}
function carryCapacityMultiplier() {
return traitTextsList().some(textDoublesCarry) ? 2 : 1;
}
// Traço que dá "+N de Constituição" só para a capacidade de carga (ex.: "Capacidade de carga como se tivesse +2 adicionais de
// Constituição."): entra na conta de 15 + mod. de Constituição, mas NÃO altera o atributo (HP etc.). Aceita também o texto antigo
// "…de Força", já salvo em fichas antigas.
function textCarryConBonus(text) {
if (!text) return 0;
let bonus = 0;
String(text).split(/[.!?]+\s+/).forEach(s => {
if (!/capacidade\s+de\s+carg(?:a|ar)/i.test(s)) return;
const m = s.match(/\+(\d+)\s+(?:adicionais?\s+)?(?:de\s+)?(?:Constitui[çc][ãa]o|For[çc]a)\b/i);
if (m) bonus += parseInt(m[1], 10);
});
return bonus;
}
function carryConBonus() {
return traitTextsList().reduce((sum, t) => sum + textCarryConBonus(t), 0);
}
// Mochila: item de inventário marcado como "Mochila" e "Equipada" soma o seu bônus (backpackBonus) direto à capacidade de carga.
// O bônus é somado DEPOIS da multiplicação por traço (não dobra junto), e só vale enquanto a mochila estiver equipada.
function backpackBonusTotal(items) {
return (items || []).reduce((sum, it) => (it && it.backpack && it.backpackEquipped) ? sum + Math.max(0, parseFloat(it.backpackBonus) || 0) : sum, 0);
}
function carryCapacityNote() {
const parts = [];
const b = carryConBonus();
if (b) parts.push('Constituição +' + b + ' por traço');
if (carryCapacityMultiplier() > 1) parts.push('dobrada por traço');
const bp = backpackBonusTotal(state.inventoryItems);
if (bp) parts.push('Mochila +' + bp);
return parts.length ? ' · ' + parts.join(' · ') : '';
}
function carryCapacity() {
return (15 + attrMod(attrTotalValue('constituicao') + carryConBonus())) * carryCapacityMultiplier() + backpackBonusTotal(state.inventoryItems);
}
function inventoryTotalWeight() {
return (state.inventoryItems || []).reduce((sum, it) => {
const w = parseFloat(it && it.weight) || 0;
const q = parseInt(it && it.qty, 10);
return sum + w * (isNaN(q) ? 1 : q);
}, 0);
}
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

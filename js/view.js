const DATA_V = window.HEARTSOUL_DATA;
const ATTR_LABELS_V = { forca: 'Força', foco: 'Foco', vontade: 'Vontade', intelecto: 'Intelecto', destreza: 'Destreza', constituicao: 'Constituição' };
const BODY_PARTS_V = [
['cabeca', 'Cabeça'], ['tronco', 'Tronco'],
['braco_esq', 'Braço Esquerdo'], ['braco_dir', 'Braço Direito'],
['perna_esq', 'Perna Esquerda'], ['perna_dir', 'Perna Direita']
];
const ATTR_NAME_TO_KEY_V = {
'Força': 'forca', 'Foco': 'foco', 'Vontade': 'vontade',
'Intelecto': 'intelecto', 'Destreza': 'destreza', 'Constituição': 'constituicao'
};
function attrModV(v) { return Math.floor(v / 2); }
const COIN_TYPES_V = [
['bronze', 'Bronze'], ['prata', 'Prata'], ['ouro', 'Ouro'], ['platina', 'Platina']
];
function economyTotalInBronzeV(eco) {
return (eco.bronze || 0) + (eco.prata || 0) * 10 + (eco.ouro || 0) * 100 + (eco.platina || 0) * 1000;
}
function abilityCostLabelV(a) {
if (a.costAmount && a.costType) return `${a.costAmount} ${a.costType}`;
return a.costLegacyText || a.cost || '';
}
// "+N em todos os atributos, exceto X (e Y)": soma N em cada um dos 6 atributos, menos nos citados como exceção.
// Aceita "exceto", "com exceção de/do/da/dos", "menos" e "salvo"; sem exceção, vale para os 6.
const ATTR_ALL_KEYSV = ['forca', 'foco', 'vontade', 'intelecto', 'destreza', 'constituicao'];
const ATTR_ANY_NAMEV = 'For[cç]a|Foco|Vontade|Intelecto|Destreza|Constitui[cç][aã]o';
const ATTR_ALL_RE_SRCV = '\\+(\\d+)\\s*(?:em\\s+|a\\s+|para\\s+)?todos\\s+(?:os\\s+)?atributos(?![\\p{L}])'
+ '(?:\\s*[,(]?\\s*(?:exceto|com\\s+exce[cç][aã]o\\s+d[eoa]s?|menos|salvo)\\s+((?:' + ATTR_ANY_NAMEV + ')'
+ '(?:(?:\\s*,\\s*(?:e\\s+|ou\\s+)?|\\s+e\\s+|\\s+ou\\s+)(?:' + ATTR_ANY_NAMEV + '))*))?';
function attrKeyFromAnyNameV(name) {
const n = String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
return ATTR_ALL_KEYSV.includes(n) ? n : null;
}
function addAllAttrBonusesV(text, bonuses) {
const re = new RegExp(ATTR_ALL_RE_SRCV, 'giu');
let m;
while ((m = re.exec(text))) {
const excluded = new Set();
if (m[2]) {
(m[2].match(new RegExp(ATTR_ANY_NAMEV, 'giu')) || []).forEach(n => {
const k = attrKeyFromAnyNameV(n);
if (k) excluded.add(k);
});
}
ATTR_ALL_KEYSV.forEach(k => {
if (!excluded.has(k)) bonuses[k] = (bonuses[k] || 0) + parseInt(m[1]);
});
}
}
function parseAttrBonusesFromTextV(text) {
const bonuses = {};
if (!text) return bonuses;
const re = /\+(\d+)\s*(Força|Foco|Vontade|Intelecto|Destreza|Constituição)\b/g;
let m;
while ((m = re.exec(text))) {
const key = ATTR_NAME_TO_KEY_V[m[2]];
bonuses[key] = (bonuses[key] || 0) + parseInt(m[1]);
}
addAllAttrBonusesV(text, bonuses);
return bonuses;
}
function traitTextsV(s) {
const texts = [];
if (s.raceFixedTrait) texts.push(s.raceFixedTrait);
if (s.raceVariantTrait) texts.push(s.raceVariantTrait);
(s.raceOptionalTraits || []).forEach(t => texts.push(t));
(s.raceTraitsBought || []).forEach(t => texts.push(t));
let bgAtributos = s.backgroundAtributos;
if (!bgAtributos && s.backgroundId) {
const bgFallback = DATA_V.backgrounds.find(b => b.id === s.backgroundId);
bgAtributos = bgFallback && bgFallback.atributos;
}
if (bgAtributos) texts.push(bgAtributos);
(s.extraTraits || []).forEach(t => texts.push(t.desc));
return texts;
}
function traitAttrBonusesV(s) {
const texts = traitTextsV(s);
const total = { forca: 0, foco: 0, vontade: 0, intelecto: 0, destreza: 0, constituicao: 0 };
texts.map(parseAttrBonusesFromTextV).forEach(b => {
Object.keys(b).forEach(k => { total[k] += b[k]; });
});
return total;
}
function resourceBarHtml(cur, max, variant) {
const ratio = max > 0 ? Math.max(0, Math.min(1, cur / max)) : 0;
const state = ratio <= 0.25 ? 'crit' : (ratio <= 0.5 ? 'low' : (variant || ''));
return `<div class="resource-bar ${state}"><div class="rb-fill" style="width:${Math.round(ratio * 100)}%;"></div></div>`;
}
function resourceLineHtml(cur, max) {
return `<div class="resource-row">${cur} / ${max}</div>${resourceBarHtml(cur, max)}`;
}
function renderLineListView(items) {
const cleaned = (items || []).map(s => (s || '').trim()).filter(Boolean);
if (!cleaned.length) return '<p class="hint" style="margin:0;">Nada registrado ainda.</p>';
return `<div class="sheet-line-list">${cleaned.map(v => `<div class="li">${escapeHtml(v)}</div>`).join('')}</div>`;
}
function ensureInventoryItemShapeV(it) {
if (typeof it === 'string') return { name: it, weight: 0, qty: 1, consumable: false, effectType: '', effectValue: '', effectDesc: '', armor: false, armorEquipped: false, armorParts: {}, backpack: false, backpackEquipped: false, backpackBonus: 0, description: '', image: '' };
return {
name: (it && it.name) || '',
weight: (it && it.weight !== undefined && it.weight !== null) ? it.weight : 0,
qty: (it && it.qty !== undefined && it.qty !== null) ? it.qty : 1,
consumable: !!(it && it.consumable),
effectType: (it && it.effectType) || '',
effectValue: (it && it.effectValue) || '',
effectDesc: (it && it.effectDesc) || '',
armor: !!(it && it.armor),
armorEquipped: !!(it && it.armorEquipped),
armorParts: Object.assign({ cabeca: 0, tronco: 0, braco_esq: 0, braco_dir: 0, perna_esq: 0, perna_dir: 0 }, (it && it.armorParts) || {}),
backpack: !!(it && it.backpack),
backpackEquipped: !!(it && it.backpackEquipped),
backpackBonus: Math.max(0, parseFloat(it && it.backpackBonus) || 0),
description: (it && it.description) || '',
image: (it && it.image) || ''
};
}
const ARMOR_PARTS_LABELS_V = { cabeca: 'Cabeça', tronco: 'Tronco', braco_esq: 'Braço Esq.', braco_dir: 'Braço Dir.', perna_esq: 'Perna Esq.', perna_dir: 'Perna Dir.' };
function armorPartsSummaryV(armorParts) {
return Object.keys(ARMOR_PARTS_LABELS_V)
.filter(k => (armorParts[k] || 0) > 0)
.map(k => `${ARMOR_PARTS_LABELS_V[k]} +${armorParts[k]}`)
.join(', ');
}
const CONSUMABLE_EFFECT_LABELS_V = { cura: '💚 Cura', dano: '⚔️ Dano', buff: '✨ Buff', debuff: '☠️ Debuff', estamina: '🏃 Recuperar Estamina', energia: '⚡ Recuperar Energia' };
// Traço que dobra a capacidade de carga — mesma regra do editor (textDoublesCarry em editor-core.js).
function textDoublesCarryV(text) {
if (!text) return false;
return String(text).split(/[.!?]+\s+/).some(s => /(?:capacidade\s+de\s+carg(?:a|ar)|peso\s+que\s+(?:voc[êe]\s+)?(?:pode|consegue)\s+carregar)/i.test(s) && /\bdobr\w*|\bdupl\w*/i.test(s));
}
function carryMultiplierV(s) { return s && traitTextsV(s).some(textDoublesCarryV) ? 2 : 1; }
// Traço que dá "+N de Constituição" só para a capacidade de carga (ex.: "Capacidade de carga como se tivesse +2 adicionais de
// Constituição."): entra na conta de 15 + mod. de Constituição, mas NÃO altera o atributo (HP etc.). Aceita também o texto antigo
// "…de Força", já salvo em fichas antigas.
function textCarryConBonusV(text) {
if (!text) return 0;
let bonus = 0;
String(text).split(/[.!?]+\s+/).forEach(s => {
if (!/capacidade\s+de\s+carg(?:a|ar)/i.test(s)) return;
const m = s.match(/\+(\d+)\s+(?:adicionais?\s+)?(?:de\s+)?(?:Constitui[çc][ãa]o|For[çc]a)\b/i);
if (m) bonus += parseInt(m[1], 10);
});
return bonus;
}
function carryConBonusV(s) { return s ? traitTextsV(s).reduce((sum, t) => sum + textCarryConBonusV(t), 0) : 0; }
function carryNoteV(s) {
const parts = [];
const b = carryConBonusV(s);
if (b) parts.push('Constituição +' + b + ' por traço');
if (carryMultiplierV(s) > 1) parts.push('dobrada por traço');
const bp = s ? backpackBonusTotalV(s.inventoryItems) : 0;
if (bp) parts.push('Mochila +' + bp);
return parts.length ? ' · ' + parts.join(' · ') : '';
}
// Mochila equipada soma o bônus dela à capacidade (depois do multiplicador de traço) — mesma regra do editor (backpackBonusTotal).
function backpackBonusTotalV(items) {
return (items || []).reduce((sum, it) => (it && it.backpack && it.backpackEquipped) ? sum + Math.max(0, parseFloat(it.backpackBonus) || 0) : sum, 0);
}
function carryCapacityV(constTotal, s) { return (15 + attrModV(constTotal + carryConBonusV(s))) * carryMultiplierV(s) + (s ? backpackBonusTotalV(s.inventoryItems) : 0); }
function inventoryTotalWeightV(items) {
return items.reduce((sum, it) => {
const w = parseFloat(it.weight) || 0;
const q = parseInt(it.qty, 10);
return sum + w * (isNaN(q) ? 1 : q);
}, 0);
}
function weightStatusV(total, capacity) {
const cap = capacity > 0 ? capacity : 1;
if (total > cap) {
const excess = total - cap;
return {
key: 'sobrecarga', label: 'Sobrecarga',
penalty: -5 - 2 * excess,
note: `Deslocamento reduzido à metade; não pode correr ou esquivar. ${excess} ponto(s) de peso excedente(s)${excess > 5 ? ' — acima do limite de +5 recomendado pelo livro de regras (a critério do mestre).' : '.'}`
};
}
if (total === cap) return { key: 'maxima', label: 'Carga Máxima', penalty: -5, note: 'Deslocamento reduzido em 2 metros.' };
if (total >= cap * 0.5) return { key: 'pesada', label: 'Carga Pesada', penalty: -2, note: '' };
return { key: 'normal', label: 'Normal', penalty: 0, note: '' };
}
function renderInventoryView(rawItems, constTotal, sheet) {
const items = (rawItems || []).map(ensureInventoryItemShapeV).filter(it => it.name.trim());
const capacity = carryCapacityV(constTotal, sheet);
const capNote = carryNoteV(sheet);
const total = inventoryTotalWeightV(items);
const st = weightStatusV(total, capacity);
const tagClass = st.key === 'normal' ? 'benign' : (st.key === 'pesada' ? 'info' : 'malign');
const listHtml = items.length
? `<div class="inv-card-list">${items.map(it => `
<article class="inv-card${it.armor ? ' is-armor' : (it.backpack ? ' is-backpack' : (it.consumable ? ' is-consumable' : ''))}">
<div class="inv-card-head">
${it.image ? `<img src="${it.image}" alt="Imagem de ${escapeHtml(it.name)}" class="inv-card-thumb">` : `<span class="inv-card-icon">${it.armor ? '🛡️' : (it.backpack ? '🎒' : (it.consumable ? '🧪' : '📦'))}</span>`}
<div class="inv-card-name">${escapeHtml(it.name)}</div>
<span class="inv-card-qty" title="Quantidade">×${it.qty}</span>
</div>
${it.consumable ? `
<div class="inv-card-tags"><span class="effect-tag ${escapeHtml(it.effectType || '')}">${CONSUMABLE_EFFECT_LABELS_V[it.effectType] || '🧪 Consumível'}</span></div>
${(it.effectValue || it.effectDesc) ? `<span class="item-effect-detail">${it.effectValue ? escapeHtml(it.effectValue) : ''}${it.effectValue && it.effectDesc ? ' · ' : ''}${it.effectDesc ? escapeHtml(it.effectDesc) : ''}</span>` : ''}
` : ''}${it.armor ? `
<div class="inv-card-tags"><span class="effect-tag armor">🛡️ Armadura${it.armorEquipped ? ' (equipada)' : ' (guardada)'}</span></div>
${armorPartsSummaryV(it.armorParts) ? `<span class="item-effect-detail">${escapeHtml(armorPartsSummaryV(it.armorParts))}</span>` : ''}
` : ''}${it.backpack ? `
<div class="inv-card-tags"><span class="effect-tag backpack">🎒 Mochila${it.backpackEquipped ? ' (equipada)' : ' (guardada)'}</span></div>
${it.backpackBonus ? `<span class="item-effect-detail">+${escapeHtml(String(it.backpackBonus))} de capacidade de carga</span>` : ''}
` : ''}
${it.description ? `<p class="inv-card-desc">${escapeHtml(it.description)}</p>` : ''}
<div class="inv-card-foot">
<span>Peso un. <b>${it.weight}</b></span>
<span>Subtotal <b>${Math.round(it.weight * it.qty * 100) / 100}</b></span>
</div>
</article>`).join('')}</div>`
: '<p class="hint" style="margin:0;">Nada registrado ainda.</p>';
return `
${listHtml}
<div class="weight-summary" style="margin-top:10px;">
<div class="weight-summary-row">
<span>Peso total: <b style="color:var(--gold);">${total}</b> / ${capacity} (Capacidade de Carga${capNote})</span>
<span class="tag ${tagClass}">${st.label}</span>
</div>
${st.penalty ? `<p class="hint" style="margin:6px 0 0;">${st.penalty} em todos os testes físicos (Força, Destreza e Constituição)${st.note ? ' · ' + st.note : ''}</p>` : ''}
</div>`;
}
let masterFixedTraitDraft = null;
let masterTraitDraft = null;
let masterRaceOptDraft = null;
let masterRaceBoughtDraft = null;
function newMasterTrait() {
return { cat: 'mestre_benign', name: '', cost: 0, desc: '' };
}
function masterStringListHtml(list, kind) {
if (!list.length) return '<p class="hint" style="margin:0 0 10px;">Nenhum traço aqui ainda.</p>';
return list.map((val, i) => `
<div class="master-trait-row-string">
<div class="mtrs-head">
<span class="mtrs-index">Traço ${i + 1}</span>
<button type="button" class="btn danger small" data-mstr-remove="${kind}:${i}" style="width:auto;">Remover</button>
</div>
<textarea data-mstr="${kind}:${i}" placeholder="Nome: Descrição do traço racial" style="min-height:70px;">${escapeHtml(val)}</textarea>
</div>`).join('');
}
function masterTraitEditorHtml(s) {
if (masterFixedTraitDraft === null) masterFixedTraitDraft = s.raceFixedTrait || '';
if (!masterTraitDraft) masterTraitDraft = (s.extraTraits || []).map(t => Object.assign({}, t));
if (!masterRaceOptDraft) masterRaceOptDraft = (s.raceOptionalTraits || []).slice();
if (!masterRaceBoughtDraft) masterRaceBoughtDraft = (s.raceTraitsBought || []).slice();
const rows = masterTraitDraft.map((t, i) => `
<div class="master-trait-row ${(t.cat || '').endsWith('_malign') ? 'malign' : 'benign'}" data-trait-row="${i}">
<div class="field-row">
<div class="field">
<label>Nome do traço</label>
<input type="text" data-mt-name="${i}" value="${escapeHtml(t.name || '')}" placeholder="Nome do traço">
</div>
<div class="field">
<label>Custo (Pts. de Traço)</label>
<input type="number" min="0" data-mt-cost="${i}" value="${t.cost || 0}">
</div>
</div>
<div class="field">
<label>Descrição</label>
<textarea data-mt-desc="${i}" placeholder='Descrição do traço — use algo como "+2 Força" para dar bônus automático de atributo'>${escapeHtml(t.desc || '')}</textarea>
</div>
<div class="field-row" style="align-items:end;">
<div class="field" style="margin-bottom:0;">
<label>Natureza</label>
<select data-mt-cat="${i}">
<option value="benign" ${!(t.cat || '').endsWith('_malign') ? 'selected' : ''}>Benigno</option>
<option value="malign" ${(t.cat || '').endsWith('_malign') ? 'selected' : ''}>Maligno</option>
</select>
</div>
<button type="button" class="btn danger small" data-mt-remove="${i}" style="width:auto; margin-bottom:2px;">Remover traço</button>
</div>
</div>`).join('');
return `
<div class="panel master-trait-editor">
<h2>Editar Traços (Mestre)</h2>
<p class="hint" style="margin-top:-10px;">Visível e editável apenas pelo Mestre. Use quando um traço evoluir ou se fundir com outro durante o RPG — os bônus de atributo do personagem são recalculados sozinhos a partir do texto de cada traço.</p>
<div class="master-trait-group">
<div class="sheet-section-title">Traço Fixo da Raça</div>
<div class="field" style="margin-bottom:0;">
<textarea id="masterFixedTraitInput" style="min-height:100px;">${escapeHtml(masterFixedTraitDraft)}</textarea>
</div>
</div>
<div class="master-trait-group">
<div class="sheet-section-title">Traços Raciais Opcionais (escolhidos na criação)</div>
<div id="masterRaceOptRows">${masterStringListHtml(masterRaceOptDraft, 'opt')}</div>
<button type="button" class="btn secondary small" id="masterAddRaceOptBtn" style="width:auto;">+ Adicionar traço opcional</button>
</div>
<div class="master-trait-group">
<div class="sheet-section-title">Traços Raciais Extras (comprados com Pontos de Traço)</div>
<div id="masterRaceBoughtRows">${masterStringListHtml(masterRaceBoughtDraft, 'bought')}</div>
<button type="button" class="btn secondary small" id="masterAddRaceBoughtBtn" style="width:auto;">+ Adicionar traço comprado</button>
</div>
<div class="master-trait-group">
<div class="sheet-section-title">Traços Adicionais</div>
<div id="masterTraitRows">${rows || '<p class="hint" style="margin:0 0 12px;">Nenhum traço adicional ainda.</p>'}</div>
<button type="button" class="btn secondary small" id="masterAddTraitBtn" style="width:auto;">+ Adicionar traço</button>
</div>
<div class="master-trait-actions">
<button type="button" class="btn small" id="masterSaveTraitsBtn" style="width:auto;">Salvar Traços</button>
<span id="masterTraitsMsg" style="font-size:13px; color:var(--benign);"></span>
</div>
</div>`;
}
function rerenderMasterTraitEditor(s, sheetId, onSaved) {
const container = document.querySelector('.master-trait-editor');
if (!container) return;
container.outerHTML = masterTraitEditorHtml(s);
wireMasterTraitEditor(s, sheetId, onSaved);
}
function wireMasterTraitEditor(s, sheetId, onSaved) {
const fixedInput = document.getElementById('masterFixedTraitInput');
fixedInput.addEventListener('input', () => { masterFixedTraitDraft = fixedInput.value; });
function wireStringList(containerId, draftGetter) {
const listBox = document.getElementById(containerId);
if (!listBox) return;
listBox.querySelectorAll('[data-mstr]').forEach(ta => {
ta.addEventListener('input', () => {
const i = parseInt(ta.dataset.mstr.split(':')[1]);
draftGetter()[i] = ta.value;
});
});
listBox.querySelectorAll('[data-mstr-remove]').forEach(btn => {
btn.addEventListener('click', () => {
const i = parseInt(btn.dataset.mstrRemove.split(':')[1]);
draftGetter().splice(i, 1);
rerenderMasterTraitEditor(s, sheetId, onSaved);
});
});
}
wireStringList('masterRaceOptRows', () => masterRaceOptDraft);
wireStringList('masterRaceBoughtRows', () => masterRaceBoughtDraft);
document.getElementById('masterAddRaceOptBtn').addEventListener('click', () => {
masterRaceOptDraft.push('');
rerenderMasterTraitEditor(s, sheetId, onSaved);
});
document.getElementById('masterAddRaceBoughtBtn').addEventListener('click', () => {
masterRaceBoughtDraft.push('');
rerenderMasterTraitEditor(s, sheetId, onSaved);
});
const box = document.getElementById('masterTraitRows');
box.querySelectorAll('[data-mt-name]').forEach(inp => {
inp.addEventListener('input', () => { masterTraitDraft[parseInt(inp.dataset.mtName)].name = inp.value; });
});
box.querySelectorAll('[data-mt-cost]').forEach(inp => {
inp.addEventListener('input', () => { masterTraitDraft[parseInt(inp.dataset.mtCost)].cost = parseInt(inp.value) || 0; });
});
box.querySelectorAll('[data-mt-desc]').forEach(ta => {
ta.addEventListener('input', () => { masterTraitDraft[parseInt(ta.dataset.mtDesc)].desc = ta.value; });
});
box.querySelectorAll('[data-mt-cat]').forEach(sel => {
sel.addEventListener('change', () => {
const i = parseInt(sel.dataset.mtCat);
const base = (masterTraitDraft[i].cat || 'mestre_benign').replace(/_(benign|malign)$/, '');
masterTraitDraft[i].cat = `${base}_${sel.value}`;
const row = sel.closest('.master-trait-row');
if (row) {
row.classList.toggle('benign', sel.value === 'benign');
row.classList.toggle('malign', sel.value === 'malign');
}
});
});
box.querySelectorAll('[data-mt-remove]').forEach(btn => {
btn.addEventListener('click', () => {
masterTraitDraft.splice(parseInt(btn.dataset.mtRemove), 1);
rerenderMasterTraitEditor(s, sheetId, onSaved);
});
});
document.getElementById('masterAddTraitBtn').addEventListener('click', () => {
masterTraitDraft.push(newMasterTrait());
rerenderMasterTraitEditor(s, sheetId, onSaved);
});
document.getElementById('masterSaveTraitsBtn').addEventListener('click', async () => {
const msg = document.getElementById('masterTraitsMsg');
const btn = document.getElementById('masterSaveTraitsBtn');
const fixedTraitVal = fixedInput.value.trim();
const cleanedTraits = masterTraitDraft
.map(t => ({ cat: t.cat || 'mestre_benign', name: (t.name || '').trim(), cost: parseInt(t.cost) || 0, desc: (t.desc || '').trim() }))
.filter(t => t.name || t.desc);
const cleanedRaceOpt = masterRaceOptDraft.map(t => t.trim()).filter(Boolean);
const cleanedRaceBought = masterRaceBoughtDraft.map(t => t.trim()).filter(Boolean);
btn.disabled = true;
msg.style.color = 'var(--benign)';
msg.textContent = 'Salvando…';
try {
await db.collection('sheets').doc(sheetId).update({
raceFixedTrait: fixedTraitVal,
extraTraits: cleanedTraits,
raceOptionalTraits: cleanedRaceOpt,
raceTraitsBought: cleanedRaceBought
});
s.raceFixedTrait = fixedTraitVal;
s.extraTraits = cleanedTraits;
s.raceOptionalTraits = cleanedRaceOpt;
s.raceTraitsBought = cleanedRaceBought;
masterFixedTraitDraft = fixedTraitVal;
masterTraitDraft = cleanedTraits.map(t => Object.assign({}, t));
masterRaceOptDraft = cleanedRaceOpt.slice();
masterRaceBoughtDraft = cleanedRaceBought.slice();
msg.textContent = 'Traços salvos — atributos recalculados.';
setTimeout(() => { const m = document.getElementById('masterTraitsMsg'); if (m) m.textContent = ''; }, 3500);
onSaved && onSaved(s);
} catch (err) {
msg.style.color = 'var(--seal-bright)';
msg.textContent = 'Erro ao salvar: ' + err.message;
} finally {
btn.disabled = false;
}
});
}
function renderSheet(s, ownerProfile, canManage, sheetId, isMaster, activeTab) {
const el = document.getElementById('content');
const traitBonuses = traitAttrBonusesV(s);
const manualBonus = s.attrManualBonus || {};
const constTotalV = (s.attributes.constituicao || 0) + (traitBonuses.constituicao || 0) + (manualBonus.constituicao || 0);
const attrHtml = Object.entries(ATTR_LABELS_V).map(([k, label]) => {
const base = s.attributes[k];
const tb = traitBonuses[k] || 0;
const mb = manualBonus[k] || 0;
const total = base + tb + mb;
const mod = attrModV(total);
const bonusNote = (tb || mb) ? `<div class="hint" style="margin:2px 0 0; font-size:11px;">base ${base}${tb ? ` +${tb} bônus` : ''}${mb ? ` ${mb >= 0 ? '+' + mb : mb} ajuste` : ''}</div>` : '';
return `<div class="sum-attr"><div class="sa-name">${label}</div><div class="sa-val">${total}</div><div class="hint" style="margin:0;">${mod >= 0 ? '+' : ''}${mod}</div>${bonusNote}</div>`;
}).join('');
const bgSkillsHtml = (s.backgroundSkills || []).length
? `<div class="sheet-section-title">Perícias Extras (Antecedente)</div>
<div class="extra-skills-row">${s.backgroundSkills.map(n => `<span class="extra-skill-chip">${escapeHtml(n)}</span>`).join('')}</div>`
: '';
const skillsHtml = (s.skills || []).length
? s.skills.map(sk => `<div class="sheet-item"><div class="si-head"><span class="si-name">${escapeHtml(sk.name)}</span><span class="si-meta">+${sk.points}</span></div></div>`).join('')
: '<p class="hint" style="margin:0;">Nenhuma perícia registrada.</p>';
const raceTraitCardHtml = (t) => {
const { name, desc } = raceTraitNameDesc(t);
return `<div class="sheet-item race"><div class="si-head"><span class="si-name">${escapeHtml(name)}</span></div>${desc ? formatTraitBody(desc) : ''}</div>`;
};
const raceOptHtml = (s.raceOptionalTraits || []).map(raceTraitCardHtml).join('');
const raceBoughtHtml = (s.raceTraitsBought || []).map(raceTraitCardHtml).join('');
const traitsHtml = (s.extraTraits || []).length
? s.extraTraits.map(t => {
const malign = t.cat.endsWith('_malign');
return `<div class="sheet-item ${malign ? 'malign' : 'benign'}"><div class="si-head"><span class="si-name">${escapeHtml(t.name)}</span><span class="tag ${malign ? 'malign' : 'benign'}">${malign ? 'Maligno' : 'Benigno'}</span></div><div class="si-desc">${escapeHtml(t.desc)}</div></div>`;
}).join('')
: '<p class="hint" style="margin:0;">Nenhum traço adicional.</p>';
const traitLimit = 6 + (s.traitBonusFromInspiration || 0);
const abilitiesHtml = (s.abilities || []).length
? s.abilities.map(a => `<div class="sheet-item"><div class="si-head"><span class="si-name">${escapeHtml(a.name)}</span>${a.actionType ? `<span class="atype">${escapeHtml(a.actionType)}</span>` : ''}${abilityCostLabelV(a) ? `<span class="si-meta">${escapeHtml(abilityCostLabelV(a))}</span>` : ''}</div>${a.desc ? `<div class="si-desc">${escapeHtml(a.desc)}</div>` : ''}</div>`).join('')
: '<p class="hint" style="margin:0;">Nenhuma habilidade registrada.</p>';
const techniqueCostLabelV = (t) => t.cost || (t.costAmount && t.costType ? `${t.costAmount} ${t.costType}` : '');
const techniquesHtml = (s.techniques || []).length
? s.techniques.map(t => `<div class="sheet-item"><div class="si-head"><span class="si-name">${escapeHtml(t.name)}</span>${t.actionType ? `<span class="atype">${escapeHtml(t.actionType)}</span>` : ''}${techniqueCostLabelV(t) ? `<span class="si-meta">${escapeHtml(techniqueCostLabelV(t))}</span>` : ''}</div>${t.desc ? `<div class="si-desc">${escapeHtml(t.desc)}</div>` : ''}</div>`).join('')
: '<p class="hint" style="margin:0;">Nenhuma técnica registrada.</p>';
const res = s.resources || {};
const hp = res.hp || {};
if (hp.bracos && !hp.braco_esq && !hp.braco_dir) {
hp.braco_esq = hp.braco_dir = { max: hp.bracos.max, cur: hp.bracos.cur };
}
if (hp.pernas && !hp.perna_esq && !hp.perna_dir) {
hp.perna_esq = hp.perna_dir = { max: hp.pernas.max, cur: hp.pernas.cur };
}
const hpHtml = BODY_PARTS_V.map(([k, label]) => {
const part = hp[k] || { max: 0, cur: 0 };
return `<div class="sum-attr"><div class="sa-name">${label}</div><div class="sa-val" style="font-size:15px;">${part.cur}/${part.max}</div>${resourceBarHtml(part.cur, part.max)}</div>`;
}).join('');
const armorRes = res.armor || {};
const armorPartsWithGear = BODY_PARTS_V.filter(([k]) => armorRes[k] && armorRes[k].max > 0);
const armorHtml = armorPartsWithGear.map(([k, label]) => {
const part = armorRes[k] || { max: 0, cur: 0 };
const broken = part.cur <= 0;
return `<div class="sum-attr"><div class="sa-name">${label}</div><div class="sa-val" style="font-size:15px; ${broken ? 'color:var(--malign);' : 'color:var(--steel);'}">${part.cur}/${part.max}${broken ? ' ⚠' : ''}</div>${resourceBarHtml(part.cur, part.max, 'steel')}</div>`;
}).join('');
const econ = res.economy || { bronze: 0, prata: 0, ouro: 0, platina: 0 };
const sanityMaxV = 10 + attrModV((s.attributes.vontade || 0) + (traitBonuses.vontade || 0) + (manualBonus.vontade || 0));
const sanityCurV = (res.sanityCur === null || res.sanityCur === undefined) ? sanityMaxV : res.sanityCur;
const sheetSideHtml = `
<div class="sheet-portrait">
${s.appearanceImage
? `<img src="${escapeHtml(s.appearanceImage)}" alt="Aparência de ${escapeHtml(s.characterName || 'personagem')}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'no-img',textContent:'👤'}));">`
: `<div class="no-img">👤</div>`}
</div>
<div class="panel">
<h2>Recursos</h2>
<div class="sheet-section-title" style="margin-top:0;">HP por partes do corpo</div>
<div class="sheet-summary-grid">${hpHtml}</div>
${armorPartsWithGear.length ? `
<div class="sheet-section-title">🛡️ HP de Armadura</div>
<div class="sheet-summary-grid">${armorHtml}</div>` : ''}
<div class="sheet-section-title">Sanidade</div>
${resourceLineHtml(sanityCurV, sanityMaxV)}
<div class="sheet-section-title">Estamina</div>
${resourceLineHtml(res.estaminaCur || 0, res.estaminaMax || 0)}
<div class="sheet-section-title">${escapeHtml(s.dcActive ? (s.energyType || 'Porcentagem') : 'Energia')}</div>
${resourceLineHtml(res.vigorCur || 0, res.vigorMax || 0)}
<div class="sheet-section-title">Economia</div>
<div class="sheet-summary-grid">${COIN_TYPES_V.map(([k, label]) => `<div class="sum-attr"><div class="sa-name">${label}</div><div class="sa-val" style="font-size:15px;">${(econ[k] || 0)}</div></div>`).join('')}</div>
<p class="hint" style="margin:8px 0 0;">Total equivalente: ${economyTotalInBronzeV(econ)} Bronzes.</p>
</div>
<div class="panel">
<h2>Atributos</h2>
<div class="sheet-summary-grid">${attrHtml}</div>
</div>
`;
// Complementos de campanha (js/complementos.js) — só existe algo aqui se
// o Mestre cadastrou complemento(s) na pasta em que esta ficha estava
// quando foi salva; a função já devolve '' nesse caso.
const complementosHtml = renderComplementosView(s);
const sheetMainHtml = `
<div class="panel" id="sec-pericias">
<h2>Perícias</h2>
${bgSkillsHtml}
<div class="sheet-item-list">${skillsHtml}</div>
</div>
<div class="panel" id="sec-habilidades">
<h2>Habilidades e Técnicas</h2>
<div class="sheet-item-list">${abilitiesHtml}</div>
<div class="sheet-section-title">Técnicas</div>
<div class="sheet-item-list">${techniquesHtml}</div>
</div>
<div class="panel" id="sec-raca">
<h2>Raça — ${escapeHtml(s.raceName)}</h2>
<div class="sheet-section-title">Traço Fixo</div>
${(() => {
const { name: fixedName, desc: fixedBody } = raceTraitNameDesc(s.raceFixedTrait);
return `<div class="sheet-item-list"><div class="sheet-item race"><div class="si-head"><span class="si-name">${escapeHtml(fixedName)}</span></div>${fixedBody ? formatTraitBody(fixedBody) : ''}</div></div>`;
})()}
${s.raceVariantTrait ? `<div class="sheet-section-title">Variação</div><p class="sheet-list">${escapeHtml(s.raceVariantTrait)}</p>` : ''}
<div class="sheet-section-title">Traços Opcionais Escolhidos</div>
<div class="sheet-item-list">${raceOptHtml}</div>
${raceBoughtHtml ? `<div class="sheet-section-title">Traços Extras Comprados (Pontos de Traço)</div><div class="sheet-item-list">${raceBoughtHtml}</div>` : ''}
</div>
<div class="panel" id="sec-tracos">
<h2>Traços Adicionais</h2>
<p class="hint" style="margin:-4px 0 12px;">Pontos de Inspiração: <b style="color:var(--gold)">${s.inspirationPoints || 0}</b> · Limite de traço atual: <b style="color:var(--gold)">${traitLimit}</b> (3 Inspiração = 1 Ponto de Traço)</p>
<div class="sheet-item-list">${traitsHtml}</div>
</div>
${s.backgroundName ? `<div class="panel" id="sec-antecedente">
<h2>Antecedente — ${escapeHtml(s.backgroundName)}</h2>
${(() => {
const bgFallback = (!s.backgroundDesc && s.backgroundId) ? DATA_V.backgrounds.find(b => b.id === s.backgroundId) : null;
const desc = s.backgroundDesc || (bgFallback && bgFallback.desc) || '';
const atributos = s.backgroundAtributos || (bgFallback && bgFallback.atributos) || '';
return `${desc ? `<p class="sheet-list">${escapeHtml(desc)}</p>` : ''}${atributos ? `<p class="sheet-list"><b style="color:var(--gold)">Atributos:</b> ${escapeHtml(atributos)}</p>` : ''}`;
})()}
</div>` : ''}
${(s.history || (s.inventoryItems && s.inventoryItems.length) || (s.notes && s.notes.length)) ? `<div class="panel" id="sec-detalhes">
<h2>Detalhes</h2>
${s.history ? `<div class="sheet-section-title" style="margin-top:0;">História</div><p class="sheet-list" style="white-space:pre-wrap;">${escapeHtml(s.history)}</p>` : ''}
<div class="sheet-section-title" style="${s.history ? '' : 'margin-top:0;'}">Inventário</div>
${renderInventoryView(s.inventoryItems, constTotalV, s)}
<div class="sheet-section-title">Anotações</div>
${renderLineListView(s.notes)}
</div>` : ''}
${complementosHtml ? `<div class="panel" id="sec-complementos">
<h2>Complementos</h2>
${complementosHtml}
</div>` : ''}
`;
// ---- Navegação rápida entre as seções da coluna principal ----
// A coluna lateral (Retrato/Recursos/Atributos) já fica fixa na tela; isso
// dá o mesmo tipo de atalho pro que sobra (Perícias, Habilidades, Raça,
// Traços, e Antecedente/Detalhes quando existem) — sem precisar rolar a
// ficha inteira pra achar uma seção. Mesmo tratamento visual do .tab-btn
// usado nas abas Jogador/Mestre logo acima, só que em pílulas horizontais
// que grudam no topo da coluna principal (ver .sheet-quicknav em
// style.css) porque aqui são vários links, não 2 estados exclusivos.
const quickNavItems = [
['sec-pericias', 'Perícias'],
['sec-habilidades', 'Habilidades'],
['sec-raca', 'Raça'],
['sec-tracos', 'Traços'],
...(s.backgroundName ? [['sec-antecedente', 'Antecedente']] : []),
...((s.history || (s.inventoryItems && s.inventoryItems.length) || (s.notes && s.notes.length)) ? [['sec-detalhes', 'Detalhes']] : []),
...(complementosHtml ? [['sec-complementos', 'Complementos']] : []),
];
const sheetQuickNavHtml = `
<nav class="sheet-quicknav" id="sheetQuickNav">
${quickNavItems.map(([id, label]) => `<a href="#${id}" data-target="${id}">${label}</a>`).join('')}
</nav>
`;
const playerTabHtml = `
<div class="sheet-layout">
<div class="sheet-side">${sheetSideHtml}</div>
<div class="sheet-main">${sheetQuickNavHtml}${sheetMainHtml}</div>
</div>
`;
const masterTabHtml = `
<div class="panel master-notes-box">
<h2>Anotações do Mestre</h2>
<p class="hint" style="margin-top:-10px;">Visível apenas para o Mestre. Use para segredos, ganchos de história ou lembretes sobre este personagem.</p>
<textarea id="masterNotesInput" placeholder="Anotações privadas sobre este personagem...">${escapeHtml(s.masterNotes || '')}</textarea>
<button class="btn secondary small" id="saveMasterNotesBtn" style="width:auto; margin-top:10px;">Salvar Anotações</button>
<span id="masterNotesMsg" style="margin-left:10px; font-size:13px; color:var(--benign);"></span>
</div>
${masterTraitEditorHtml(s)}
${s.dcActive && typeof dcMasterPanelHtml === 'function' ? dcMasterPanelHtml(s) : ''}
`;
el.innerHTML = `
<div class="page-head">
<div class="eyebrow">${s.dcActive
? `${escapeHtml(DC_LEVELS[Number.isInteger(s.corruptionLevel) ? s.corruptionLevel : 0])} · Nível ${s.level} · ${escapeHtml(s.energyType || 'Porcentagem')}${s.currentClass ? ` · Carta: ${escapeHtml(s.currentClass)}` : ''}`
: `${escapeHtml(s.raceName)} · Nível ${s.level} · ${escapeHtml(s.energyType || '')}${s.currentClass ? ` · ${escapeHtml(s.currentClass)}` : ''}`
}</div>
<h1>${escapeHtml(s.characterName)}</h1>
<p>${s.height ? `Altura: <b style="color:var(--gold)">${escapeHtml(s.height)}</b>` : ''}${s.height && (s.age !== null && s.age !== undefined) ? ' · ' : ''}${(s.age !== null && s.age !== undefined) ? `Idade: <b style="color:var(--gold)">${escapeHtml(String(s.age))}</b>` : ''}${(s.height || (s.age !== null && s.age !== undefined)) ? ' · ' : ''}XP: <b style="color:var(--gold)">${s.xp || 0} / ${s.level >= 20 ? '—' : (800 * (s.level || 1))}</b></p>
${ownerProfile ? `<p>Jogador: <b style="color:var(--gold)">${escapeHtml(ownerProfile.name)}</b></p>` : ''}
${s.folderName ? `<p>Campanha: <b style="color:var(--gold)">${escapeHtml(s.folderName)}</b></p>` : ''}
</div>
${canManage ? `<div style="margin-bottom:20px; display:flex; gap:10px; flex-wrap:wrap;">
<a href="ficha-editor.html?id=${sheetId}" class="btn secondary small" style="width:auto;">Editar</a>
<button class="btn danger small" id="deleteBtn" style="width:auto;">Excluir ficha</button>
</div>` : ''}
${isMaster ? `<div class="tabs">
<button type="button" class="tab-btn ${activeTab === 'mestre' ? '' : 'active'}" data-tab="jogador">Jogador</button>
<button type="button" class="tab-btn ${activeTab === 'mestre' ? 'active' : ''}" data-tab="mestre">Mestre</button>
</div>` : ''}
<div id="tabJogador" style="${activeTab === 'mestre' ? 'display:none;' : ''}">${playerTabHtml}</div>
${isMaster ? `<div id="tabMestre" style="${activeTab === 'mestre' ? '' : 'display:none;'}">${masterTabHtml}</div>` : ''}
`;
if (isMaster) {
const tabBtns = el.querySelectorAll('.tab-btn');
tabBtns.forEach(btn => {
btn.addEventListener('click', () => {
tabBtns.forEach(b => b.classList.remove('active'));
btn.classList.add('active');
document.getElementById('tabJogador').style.display = btn.dataset.tab === 'jogador' ? '' : 'none';
document.getElementById('tabMestre').style.display = btn.dataset.tab === 'mestre' ? '' : 'none';
});
});
document.getElementById('saveMasterNotesBtn').addEventListener('click', async () => {
const val = document.getElementById('masterNotesInput').value;
const msg = document.getElementById('masterNotesMsg');
try {
await db.collection('sheets').doc(sheetId).update({ masterNotes: val });
msg.textContent = 'Salvo.';
setTimeout(() => { msg.textContent = ''; }, 2500);
} catch (err) {
msg.style.color = 'var(--seal-bright)';
msg.textContent = 'Erro ao salvar: ' + err.message;
}
});
wireMasterTraitEditor(s, sheetId, (updatedS) => {
// Redesenha a ficha inteira (os totais de atributo na aba Jogador
// dependem do texto dos traços) mas mantém a aba Mestre aberta, já
// que foi de lá que a ação de salvar partiu.
renderSheet(updatedS, ownerProfile, canManage, sheetId, isMaster, 'mestre');
});
if (s.dcActive && typeof wireDcMasterPanel === 'function') {
wireDcMasterPanel(s, sheetId, (updatedS) => {
renderSheet(updatedS, ownerProfile, canManage, sheetId, isMaster, 'mestre');
});
}
}
if (canManage) {
document.getElementById('deleteBtn').addEventListener('click', async () => {
if (!confirm('Tem certeza que quer excluir esta ficha? Essa ação não pode ser desfeita.')) return;
await db.collection('sheets').doc(sheetId).delete();
location.href = document.body.dataset.backTo || 'minhas-fichas.html';
});
}
wireSheetQuickNav();
}
// Handler de scroll do menu de navegação rápida da Ficha (view) — guardado
// aqui pra poder tirar o "ouvinte" antigo antes de recriar a cada render
// (renderSheet roda de novo, por ex., depois que o Mestre salva uma
// anotação), evitando empilhar vários ouvintes de scroll pra mesma página.
let sheetQuickNavScrollHandler = null;
function wireSheetQuickNav() {
if (sheetQuickNavScrollHandler) {
window.removeEventListener('scroll', sheetQuickNavScrollHandler);
window.removeEventListener('resize', sheetQuickNavScrollHandler);
sheetQuickNavScrollHandler = null;
}
const nav = document.getElementById('sheetQuickNav');
if (!nav) return; // não existe na aba Mestre, só na aba Jogador
const links = Array.from(nav.querySelectorAll('a'));
const sections = links
.map(a => document.getElementById(a.dataset.target))
.filter(Boolean);
if (!sections.length) return;
sheetQuickNavScrollHandler = function onScroll() {
const y = window.scrollY + 130;
let current = sections[0];
sections.forEach(sec => { if (sec.offsetTop <= y) current = sec; });
links.forEach(a => a.classList.toggle('active', a.dataset.target === current.id));
};
window.addEventListener('scroll', sheetQuickNavScrollHandler, { passive: true });
window.addEventListener('resize', sheetQuickNavScrollHandler);
sheetQuickNavScrollHandler();
}
guardPage(null, async (user, profile) => {
renderTopbar(profile);
const params = new URLSearchParams(location.search);
const id = params.get('id');
const content = document.getElementById('content');
if (!id) { content.innerHTML = '<div class="error-msg">Ficha não especificada.</div>'; return; }
try {
const doc = await db.collection('sheets').doc(id).get();
if (!doc.exists) { content.innerHTML = '<div class="error-msg">Ficha não encontrada.</div>'; return; }
const s = doc.data();
const isOwner = s.ownerId === user.uid;
const isMaster = profile.role === 'master';
if (!isOwner && !isMaster) {
content.innerHTML = '<div class="error-msg">Você não tem permissão para ver esta ficha.</div>';
return;
}
document.body.dataset.backTo = isMaster && !isOwner ? 'master.html' : 'minhas-fichas.html';
let ownerProfile = null;
if (isMaster) ownerProfile = await getUserProfile(s.ownerId);
renderSheet(s, ownerProfile, true, id, isMaster);
} catch (err) {
if (err && err.code === 'permission-denied') {
content.innerHTML = '<div class="error-msg">Você não tem permissão para ver esta ficha.</div>';
return;
}
content.innerHTML = `<div class="error-msg">Erro ao carregar ficha: ${escapeHtml(err.message)}</div>`;
}
});

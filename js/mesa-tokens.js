function sheetSectionHtml() {
if (mySheets.length === 0) {
return `<p class="tc-meta">Você ainda não tem nenhuma ficha criada. <a href="ficha-editor.html" target="_blank" rel="noopener">Criar ficha</a></p>`;
}
return `
<div class="field">
<select id="sheetSelect">
${mySheets.map(s => `<option value="${s.id}">${escapeHtml(s.characterName || 'Sem nome')}</option>`).join('')}
</select>
</div>
<div class="my-color-row">
<button type="button" class="color-swatch" id="myColorSwatch" style="background:${myColor};" title="Sua cor na mesa"></button>
<span>Sua cor na mesa (aura e contorno da ficha)</span>
</div>
<button class="btn small" id="enterBoardBtn" style="width:auto;">Entrar na mesa com esta ficha</button>
<button class="btn secondary small" id="viewSheetBtn" style="width:auto; margin-top:8px;">📜 Ver ficha</button>
<button class="btn secondary small hidden" id="leaveBoardBtn" style="width:auto; margin-top:8px;">Sair da mesa</button>
<div class="error-msg hidden" id="enterErr"></div>
<div id="myResourcesBox"></div>
<div id="myInventoryBox"></div>`;
}
function wireSheetSection() {
if (mySheets.length === 0) return;
document.getElementById('enterBoardBtn').addEventListener('click', () => enterBoardAsSheet(document.getElementById('sheetSelect').value));
document.getElementById('leaveBoardBtn').addEventListener('click', leaveBoard);
document.getElementById('viewSheetBtn').addEventListener('click', () => openSheetModal(document.getElementById('sheetSelect').value));
document.getElementById('myColorSwatch').addEventListener('click', (e) => {
openColorWheel(e.currentTarget, myColor, async (hex) => {
myColor = hex;
setStoredColor(curUser.uid, hex);
e.currentTarget.style.background = hex;
if (liveTokens[curUser.uid]) {
try { await db.collection('tables').doc(curTable.id).collection('tokens').doc(curUser.uid).update({ color: hex }); }
catch (err) { console.error('Erro ao atualizar cor:', err); }
}
});
});
}
function propSectionHtml() {
return `
<p class="tc-meta">Objetos soltos no mapa (montaria, baú, carroça...) que qualquer jogador presente pode colocar e depois mover, girar e redimensionar à vontade.</p>
<div class="field">
<input type="text" id="propName" placeholder="Nome (ex.: Cavalo, Baú, Carroça)">
</div>
<div class="field">
<input type="file" id="propImage" accept="image/*">
</div>
<button class="btn secondary small" id="addPropBtn" style="width:auto;">📦 Adicionar prop à mesa</button>
<div class="error-msg hidden" id="propErr"></div>`;
}
function wirePropSection() {
const btn = document.getElementById('addPropBtn');
if (btn) btn.addEventListener('click', addPropToken);
}
async function addPropToken() {
const nameEl = document.getElementById('propName');
const fileEl = document.getElementById('propImage');
const errEl = document.getElementById('propErr');
const name = nameEl.value.trim() || 'Prop';
try {
let image = '';
if (fileEl.files && fileEl.files[0]) image = await fileToResizedDataUrl(fileEl.files[0], 240);
await db.collection('tables').doc(curTable.id).collection('tokens').add({
ownerId: curUser.uid, name, image, prop: true, color: '#8f7a4c',
sceneId: curTable.activeSceneId,
x: snapAxisToGrid(0.5, baseMapW, boardCellPx), y: snapAxisToGrid(0.5, baseMapH, boardCellPx),
updatedAt: firebase.firestore.FieldValue.serverTimestamp()
});
nameEl.value = ''; fileEl.value = '';
errEl.classList.add('hidden');
} catch (err) {
errEl.textContent = 'Erro ao adicionar: ' + err.message;
errEl.classList.remove('hidden');
}
}
function renderMyTokenPanel() {
const panel = document.getElementById('myTokenPanel');
if (isTableOwner()) {
panel.innerHTML = `
<h4>➕ Colocar tokens na mesa</h4>
${subPanelHtml('subAddNpc', '👹', 'NPC avulso rápido', `
<div class="field">
<input type="text" id="npcName" placeholder="Nome (ex.: Lobo Sombrio)">
</div>
<div class="field">
<input type="file" id="npcImage" accept="image/*">
</div>
<div class="my-color-row">
<button type="button" class="color-swatch" id="npcColorSwatch" style="background:${npcColor};" title="Cor deste token"></button>
<span>Cor do token (aura e contorno)</span>
</div>
<button class="btn small" id="addNpcBtn" style="width:auto;">Adicionar à mesa</button>
<div class="error-msg hidden" id="npcErr"></div>
`, true)}
${subPanelHtml('subNpcLib', '📚', 'Biblioteca de NPCs/Monstros', `<div id="npcLibraryPanel"></div>`, false)}
${subPanelHtml('subMySheet', '🧙', mySheets.length ? 'Entrar com sua ficha' : 'Sua ficha', sheetSectionHtml(), false)}
${subPanelHtml('subProps', '📦', 'Montarias / Props', propSectionHtml(), false)}`;
document.getElementById('addNpcBtn').addEventListener('click', addNpcToken);
document.getElementById('npcColorSwatch').addEventListener('click', (e) => {
openColorWheel(e.currentTarget, npcColor, (hex) => {
npcColor = hex;
e.currentTarget.style.background = hex;
});
});
initNpcLibraryPanel('npcLibraryPanel', { uid: curUser.uid, allowAddToTable: true, onAddToTable: addNpcFromTemplate });
wireSheetSection();
wirePropSection();
return;
}
panel.innerHTML = `
<h4>🎭 Entrar na mesa</h4>
${subPanelHtml('subMySheet', '🧙', 'Se transformar em ficha', sheetSectionHtml(), true)}
${subPanelHtml('subProps', '📦', 'Montarias / Props', propSectionHtml(), false)}`;
wireSheetSection();
wirePropSection();
}
function updateMyTokenUiState(hasToken) {
const enterBtn = document.getElementById('enterBoardBtn');
const leaveBtn = document.getElementById('leaveBoardBtn');
if (!enterBtn || !leaveBtn) return;
enterBtn.textContent = hasToken ? 'Atualizar aparência na mesa' : 'Entrar na mesa com esta ficha';
leaveBtn.classList.toggle('hidden', !hasToken);
}
function myResourceRowHtml(resKey, label, cur, max) {
cur = cur || 0; max = max || 0;
return `
<div class="resource-row">
<span class="res-label">${escapeHtml(label)}</span>
<button type="button" data-res-delta="${resKey}" data-delta="-1" title="Gastar 1 de ${escapeHtml(label)}">−</button>
<input type="number" data-res-cur="${resKey}" value="${cur}" title="${escapeHtml(label)} atual">
<span class="res-sep">/</span>
<input type="number" data-res-max="${resKey}" value="${max}" title="${escapeHtml(label)} máxima">
<button type="button" data-res-delta="${resKey}" data-delta="1" title="Recuperar 1 de ${escapeHtml(label)}">+</button>
</div>`;
}
function renderMyResourcesBox() {
const box = document.getElementById('myResourcesBox');
if (!box) return;
const tok = liveTokens[curUser.uid];
const sheet = (tok && tok.sheetId) ? mySheets.find(s => s.id === tok.sheetId) : null;
if (!sheet) { box.innerHTML = ''; return; }
const res = sheet.resources || {};
const energyLabel = sheet.dcActive ? (sheet.energyType || 'Porcentagem') : (sheet.energyType ? `Energia (${sheet.energyType})` : 'Energia');
box.innerHTML = `
<div class="my-resources-box">
<h4>Seus recursos</h4>
${myResourceRowHtml('estamina', 'Estamina', res.estaminaCur, res.estaminaMax)}
${myResourceRowHtml('vigor', energyLabel, res.vigorCur, res.vigorMax)}
</div>`;
box.querySelectorAll('[data-res-delta]').forEach(b => {
b.addEventListener('click', () => adjustMyResource(sheet.id, b.dataset.resDelta, parseInt(b.dataset.delta, 10)));
});
box.querySelectorAll('[data-res-cur]').forEach(inp => {
inp.addEventListener('click', (e) => e.stopPropagation());
inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') inp.blur(); });
inp.addEventListener('change', () => setMyResourceField(sheet.id, inp.dataset.resCur + 'Cur', inp.value));
});
box.querySelectorAll('[data-res-max]').forEach(inp => {
inp.addEventListener('click', (e) => e.stopPropagation());
inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') inp.blur(); });
inp.addEventListener('change', () => setMyResourceField(sheet.id, inp.dataset.resMax + 'Max', inp.value));
});
}
function adjustMyResource(sheetId, resKey, delta) {
const sheet = mySheets.find(s => s.id === sheetId); if (!sheet) return;
const res = sheet.resources || {};
const curField = resKey + 'Cur';
const max = res[resKey + 'Max'] || 0;
const next = Math.max(0, Math.min(max, (res[curField] || 0) + delta));
setMyResourceField(sheetId, curField, next);
}
async function setMyResourceField(sheetId, field, rawValue) {
const sheet = mySheets.find(s => s.id === sheetId); if (!sheet) return;
const value = parseInt(rawValue, 10);
if (isNaN(value) || value < 0) { renderMyResourcesBox(); return; }
sheet.resources = sheet.resources || {};
sheet.resources[field] = value;
const payload = { ['resources.' + field]: value, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
if (field.endsWith('Max')) {
const curKey = field.slice(0, -3) + 'Cur';
if ((sheet.resources[curKey] || 0) > value) {
sheet.resources[curKey] = value;
payload['resources.' + curKey] = value;
}
}
renderMyResourcesBox();
try {
await db.collection('sheets').doc(sheetId).update(payload);
} catch (err) {
console.error('Erro ao atualizar recursos da ficha:', err);
}
}
const ATTR_NAME_TO_KEY_QUICK = {
'Força': 'forca', 'Foco': 'foco', 'Vontade': 'vontade',
'Intelecto': 'intelecto', 'Destreza': 'destreza', 'Constituição': 'constituicao'
};
function parseAttrBonusesFromTextQuick(text) {
const bonuses = {};
if (!text) return bonuses;
const re = /\+(\d+)\s*(Força|Foco|Vontade|Intelecto|Destreza|Constituição)\b/g;
let m;
while ((m = re.exec(text))) {
const key = ATTR_NAME_TO_KEY_QUICK[m[2]];
bonuses[key] = (bonuses[key] || 0) + parseInt(m[1]);
}
return bonuses;
}
function traitAttrBonusesQuick(sheet) {
const texts = [];
if (sheet.raceFixedTrait) texts.push(sheet.raceFixedTrait);
if (sheet.raceVariantTrait) texts.push(sheet.raceVariantTrait);
(sheet.raceOptionalTraits || []).forEach(t => texts.push(t));
(sheet.raceTraitsBought || []).forEach(t => texts.push(t));
if (sheet.backgroundAtributos) texts.push(sheet.backgroundAtributos);
(sheet.extraTraits || []).forEach(t => texts.push(t && t.desc));
const total = { forca: 0, foco: 0, vontade: 0, intelecto: 0, destreza: 0, constituicao: 0 };
texts.map(parseAttrBonusesFromTextQuick).forEach(b => {
Object.keys(b).forEach(k => { total[k] += b[k]; });
});
return total;
}
function attrModQuick(v) { return Math.floor(v / 2); }
function carryCapacityQuick(sheet) {
const attrs = sheet.attributes || {};
const traitBonus = traitAttrBonusesQuick(sheet).constituicao || 0;
const manual = (sheet.attrManualBonus && sheet.attrManualBonus.constituicao) || 0;
return 15 + attrModQuick((attrs.constituicao || 0) + traitBonus + manual);
}
function ensureInventoryItemShapeQuick(it) {
if (typeof it === 'string') return { name: it, weight: 0, qty: 1, consumable: false, effectType: '', effectValue: '', effectDesc: '', armor: false, armorEquipped: false, armorParts: {} };
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
armorParts: Object.assign({ cabeca: 0, tronco: 0, braco_esq: 0, braco_dir: 0, perna_esq: 0, perna_dir: 0 }, (it && it.armorParts) || {})
};
}
const CONSUMABLE_EFFECT_LABELS_Q = { cura: '💚 Cura', dano: '⚔️ Dano', buff: '✨ Buff', debuff: '☠️ Debuff', estamina: '🏃 Recuperar Estamina', energia: '⚡ Recuperar Energia' };
const ARMOR_PARTS_LIST_Q = [
['cabeca', '🪖 Cabeça'], ['tronco', '🎽 Tronco'],
['braco_esq', '💪 Braço Esq.'], ['braco_dir', '💪 Braço Dir.'],
['perna_esq', '🥾 Perna Esq.'], ['perna_dir', '🥾 Perna Dir.']
];
function recalcArmorResourcesQuick(sheet) {
if (!sheet.resources) sheet.resources = {};
if (!sheet.resources.armor) sheet.resources.armor = defaultTokenArmor();
const totals = { cabeca: 0, tronco: 0, braco_esq: 0, braco_dir: 0, perna_esq: 0, perna_dir: 0 };
(sheet.inventoryItems || []).forEach(it => {
if (!it || !it.armor || !it.armorEquipped) return;
ARMOR_PARTS_LIST_Q.forEach(([k]) => { totals[k] += parseInt((it.armorParts || {})[k], 10) || 0; });
});
const armor = sheet.resources.armor;
ARMOR_PARTS_LIST_Q.forEach(([k]) => {
const cur = armor[k];
if (!cur || cur.max !== totals[k]) armor[k] = { max: totals[k], cur: totals[k] };
});
return armor;
}
function inventoryTotalWeightQuick(items) {
return items.reduce((sum, it) => {
const w = parseFloat(it.weight) || 0;
const q = parseInt(it.qty, 10);
return sum + w * (isNaN(q) ? 1 : q);
}, 0);
}
function weightStatusQuick(total, capacity) {
const cap = capacity > 0 ? capacity : 1;
if (total > cap) {
const excess = total - cap;
return { key: 'sobrecarga', label: 'Sobrecarga', penalty: -5 - 2 * excess };
}
if (total === cap) return { key: 'maxima', label: 'Carga Máxima', penalty: -5 };
if (total >= cap * 0.5) return { key: 'pesada', label: 'Carga Pesada', penalty: -2 };
return { key: 'normal', label: 'Normal', penalty: 0 };
}
function renderMyInventoryBox() {
const box = document.getElementById('myInventoryBox');
if (!box) return;
const tok = liveTokens[curUser.uid];
const sheet = (tok && tok.sheetId) ? mySheets.find(s => s.id === tok.sheetId) : null;
if (!sheet) { box.innerHTML = ''; return; }
if (box.contains(document.activeElement)) return;
const items = (sheet.inventoryItems || []).map(ensureInventoryItemShapeQuick);
if (!items.length) items.push({ name: '', weight: 0, qty: 1, consumable: false, effectType: '', effectValue: '', effectDesc: '', armor: false, armorEquipped: false, armorParts: {} });
const capacity = carryCapacityQuick(sheet);
const total = inventoryTotalWeightQuick(items);
const st = weightStatusQuick(total, capacity);
const tagClass = st.key === 'normal' ? 'benign' : (st.key === 'pesada' ? 'info' : 'malign');
const armorSource = (tok && tok.armor) ? tok.armor : (sheet.resources && sheet.resources.armor) || {};
const armorPartsShown = ARMOR_PARTS_LIST_Q.filter(([k]) => armorSource[k] && armorSource[k].max > 0);
box.innerHTML = `
<div class="my-resources-box my-inventory-box">
<h4>Seu inventário</h4>
${armorPartsShown.length ? `
<div class="armor-status-box">
<div class="tc-meta" style="margin-bottom:6px;">🛡️ HP de Armadura</div>
${armorPartsShown.map(([k, label]) => {
const p = armorSource[k] || { max: 0, cur: 0 };
const broken = p.cur <= 0;
const pct = p.max ? Math.max(0, Math.min(100, (p.cur / p.max) * 100)) : 0;
return `<div class="armor-part-row${broken ? ' is-broken' : ''}">
<div class="apr-top">
<span class="apr-name">${label}</span>
<span class="apr-value">${p.cur}<span class="apr-max"> / ${p.max}</span>${broken ? ' · quebrada' : ''}</span>
</div>
<div class="durability-gauge"><span class="durability-gauge-fill" style="width:${pct}%;"></span></div>
${p.cur < p.max ? `<button type="button" class="btn secondary small apr-repair" data-mi-armor-repair="${k}" title="Restaura o HP de Armadura desta parte ao máximo">🔧 Consertar</button>` : ''}
</div>`;
}).join('')}
</div>` : ''}
${items.map((it, i) => `
<div class="inventory-item-block">
<div class="inventory-item">
<input type="text" class="inv-name" data-mi-name="${i}" placeholder="Nome do item" value="${escapeHtml(it.name)}">
<input type="number" class="inv-weight" data-mi-weight="${i}" placeholder="Peso" min="0" step="0.5" value="${it.weight}">
<input type="number" class="inv-qty" data-mi-qty="${i}" placeholder="Qtd" min="0" step="1" value="${it.qty}">
<button type="button" class="skill-remove" data-mi-remove="${i}" ${items.length <= 1 ? 'style="visibility:hidden;"' : ''}>✕</button>
</div>
<div class="item-type-row">
<label class="item-type-chip"><input type="checkbox" data-mi-consumable="${i}" ${it.consumable ? 'checked' : ''} ${it.armor ? 'disabled title="Um item Armadura não pode ser Consumível"' : ''}> 🧪 Consumível</label>
<label class="item-type-chip armor"><input type="checkbox" data-mi-armor="${i}" ${it.armor ? 'checked' : ''} ${it.consumable ? 'disabled title="Um item Consumível não pode ser Armadura"' : ''}> 🛡️ Armadura</label>
</div>
${it.consumable ? `
<div class="item-detail inv-effect-fields">
<select data-mi-effect-type="${i}">
<option value="">Tipo de efeito…</option>
<option value="cura" ${it.effectType === 'cura' ? 'selected' : ''}>💚 Cura</option>
<option value="dano" ${it.effectType === 'dano' ? 'selected' : ''}>⚔️ Dano</option>
<option value="buff" ${it.effectType === 'buff' ? 'selected' : ''}>✨ Buff</option>
<option value="debuff" ${it.effectType === 'debuff' ? 'selected' : ''}>☠️ Debuff</option>
<option value="estamina" ${it.effectType === 'estamina' ? 'selected' : ''}>🏃 Recuperar Estamina</option>
<option value="energia" ${it.effectType === 'energia' ? 'selected' : ''}>⚡ Recuperar Energia</option>
</select>
<input type="text" class="inv-effect-value" data-mi-effect-value="${i}" placeholder="Dado (ex.: 1d8+2)" value="${escapeHtml(it.effectValue)}" title="Opcional — notação de dado (ex.: 1d8+2). Deixe em branco se o efeito não tem número pra rolar.">
<input type="text" class="inv-effect-desc" data-mi-effect-desc="${i}" placeholder="Descrição do efeito" value="${escapeHtml(it.effectDesc)}">
<div class="inv-use-row">
<span class="tc-meta">${CONSUMABLE_EFFECT_LABELS_Q[it.effectType] || ''}</span>
<button type="button" class="inv-use-btn" data-mi-use="${i}" ${it.qty > 0 ? '' : 'disabled'} title="Usa 1 unidade: rola o dado do efeito (se houver) e anuncia na mesa para todo mundo ver">Usar</button>
</div>
</div>` : ''}
${it.armor ? `
<div class="item-detail inv-armor-fields">
<label class="item-equip-toggle"><input type="checkbox" data-mi-armor-equipped="${i}" ${it.armorEquipped ? 'checked' : ''}> <span>Equipada agora</span></label>
<div class="inv-armor-parts-grid">
${ARMOR_PARTS_LIST_Q.map(([k, label]) => `
<label class="inv-armor-part">
<span class="iap-label">${label}</span>
<input type="number" min="0" step="1" class="inv-armor-part-input" data-mi-armor-part="${i}" data-part="${k}" value="${(it.armorParts && it.armorParts[k]) || 0}">
</label>`).join('')}
</div>
</div>` : ''}
</div>`).join('')}
<button type="button" class="btn secondary small line-list-add" data-mi-add style="width:auto;">+ Adicionar item</button>
<div class="weight-summary-row" style="margin-top:8px;">
<span>Peso: <b style="color:var(--gold);">${total}</b> / ${capacity}</span>
<span class="tag ${tagClass}">${st.label}</span>
</div>
<div class="weight-gauge"><span class="weight-gauge-fill ${tagClass}" style="width:${capacity > 0 ? Math.max(0, Math.min(100, (total / capacity) * 100)) : 0}%;"></span></div>
</div>`;
const commit = () => setMyInventoryItems(sheet.id, items);
box.querySelectorAll('[data-mi-name]').forEach(inp => {
inp.addEventListener('click', (e) => e.stopPropagation());
inp.addEventListener('change', () => { items[parseInt(inp.dataset.miName)].name = inp.value; commit(); });
});
box.querySelectorAll('[data-mi-weight]').forEach(inp => {
inp.addEventListener('click', (e) => e.stopPropagation());
inp.addEventListener('change', () => { items[parseInt(inp.dataset.miWeight)].weight = parseFloat(inp.value) || 0; commit(); });
});
box.querySelectorAll('[data-mi-qty]').forEach(inp => {
inp.addEventListener('click', (e) => e.stopPropagation());
inp.addEventListener('change', () => { items[parseInt(inp.dataset.miQty)].qty = parseInt(inp.value, 10) || 0; commit(); });
});
box.querySelectorAll('[data-mi-consumable]').forEach(inp => {
inp.addEventListener('click', (e) => e.stopPropagation());
inp.addEventListener('change', () => { items[parseInt(inp.dataset.miConsumable)].consumable = inp.checked; commit(); });
});
box.querySelectorAll('[data-mi-effect-type]').forEach(sel => {
sel.addEventListener('click', (e) => e.stopPropagation());
sel.addEventListener('change', () => { items[parseInt(sel.dataset.miEffectType)].effectType = sel.value; commit(); });
});
box.querySelectorAll('[data-mi-effect-value]').forEach(inp => {
inp.addEventListener('click', (e) => e.stopPropagation());
inp.addEventListener('change', () => { items[parseInt(inp.dataset.miEffectValue)].effectValue = inp.value; commit(); });
});
box.querySelectorAll('[data-mi-effect-desc]').forEach(inp => {
inp.addEventListener('click', (e) => e.stopPropagation());
inp.addEventListener('change', () => { items[parseInt(inp.dataset.miEffectDesc)].effectDesc = inp.value; commit(); });
});
box.querySelectorAll('[data-mi-remove]').forEach(btn => {
btn.addEventListener('click', () => {
if (items.length <= 1) return;
items.splice(parseInt(btn.dataset.miRemove), 1);
commit();
});
});
box.querySelectorAll('[data-mi-use]').forEach(btn => {
btn.addEventListener('click', (e) => { e.stopPropagation(); useConsumableItem(sheet.id, items, parseInt(btn.dataset.miUse)); });
});
box.querySelectorAll('[data-mi-armor]').forEach(inp => {
inp.addEventListener('click', (e) => e.stopPropagation());
inp.addEventListener('change', () => { items[parseInt(inp.dataset.miArmor)].armor = inp.checked; commit(); });
});
box.querySelectorAll('[data-mi-armor-equipped]').forEach(inp => {
inp.addEventListener('click', (e) => e.stopPropagation());
inp.addEventListener('change', () => { items[parseInt(inp.dataset.miArmorEquipped)].armorEquipped = inp.checked; commit(); });
});
box.querySelectorAll('[data-mi-armor-part]').forEach(inp => {
inp.addEventListener('click', (e) => e.stopPropagation());
inp.addEventListener('change', () => {
const it = items[parseInt(inp.dataset.miArmorPart)];
if (!it.armorParts) it.armorParts = {};
it.armorParts[inp.dataset.part] = parseInt(inp.value, 10) || 0;
commit();
});
});
box.querySelectorAll('[data-mi-armor-repair]').forEach(btn => {
btn.addEventListener('click', (e) => { e.stopPropagation(); repairMyArmorPart(sheet.id, btn.dataset.miArmorRepair); });
});
const addBtn = box.querySelector('[data-mi-add]');
if (addBtn) addBtn.addEventListener('click', () => {
items.push({ name: '', weight: 0, qty: 1, consumable: false, effectType: '', effectValue: '', effectDesc: '', armor: false, armorEquipped: false, armorParts: {} });
commit();
});
}
// Conserta (restaura ao máximo) o HP de Armadura de UMA parte do corpo —
// botão "🔧 Consertar" do status de armadura, acima da lista de itens.
// Atualiza tanto a ficha (resources.armor, pra persistir fora da mesa)
// quanto o token ao vivo (se o jogador já estiver numa mesa), do mesmo
// jeito que o dano/cura em combate faz o caminho inverso.
async function repairMyArmorPart(sheetId, partKey) {
const sheet = mySheets.find(s => s.id === sheetId); if (!sheet) return;
if (!sheet.resources) sheet.resources = {};
const armor = Object.assign({}, defaultTokenArmor(), sheet.resources.armor || {});
const part = Object.assign({ max: 0, cur: 0 }, armor[partKey] || {});
part.cur = part.max;
armor[partKey] = part;
sheet.resources.armor = armor;
renderMyInventoryBox();
try {
await syncTokenArmorToSheet(sheetId, armor);
const tok = liveTokens[curUser.uid];
if (tok && tok.sheetId === sheetId) {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(curUser.uid)
.update({ armor, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
}
} catch (err) {
console.error('Erro ao consertar armadura:', err);
}
}
// Usar 1 unidade de um item consumível: se ele tiver um dado/valor de
// efeito (ex.: "1d8+2"), rola usando o mesmo motor da mesa e posta o
// resultado no histórico de rolagens (mesmo efeito visual/balão de
// qualquer outra rolagem da mesa); sem dado (comum em Buff/Debuff, cujo
// efeito é só descrito em texto), posta um aviso no chat geral em vez
// disso. De qualquer forma, desconta 1 da quantidade do item na ficha.
// Não aplica o efeito automaticamente em nenhum recurso — cura/dano/buff/
// debuff/estamina/energia continuam a critério do Mestre/jogador, que pode
// aplicar o resultado manualmente (cura/dano pelo painel de Dados, 🎯
// Aplicar em um alvo; estamina/energia digitando o valor rolado direto no
// campo "atual" do recurso na ficha, já que esses recursos não têm partes
// do corpo pra escolher).
async function useConsumableItem(sheetId, items, idx) {
const it = items[idx]; if (!it || !it.consumable || it.qty <= 0) return;
const effectLabel = CONSUMABLE_EFFECT_LABELS_Q[it.effectType] || '🧪 Efeito';
const byName = (liveTokens[curUser.uid] && liveTokens[curUser.uid].name) || (curProfile ? curProfile.name : 'Alguém');
const itemLabel = it.name.trim() || 'item';
try {
if (it.effectValue && it.effectValue.trim()) {
const result = parseTableRollCommand(it.effectValue);
if (result.error) {
alert(`Dado/valor inválido no efeito de "${itemLabel}": ${result.error}`);
return;
}
await db.collection('tables').doc(curTable.id).collection('rolls').add({
by: curUser.uid,
byName,
label: `🧪 ${itemLabel} — ${effectLabel}`,
detail: result.detail + (it.effectDesc ? ` · ${it.effectDesc}` : ''),
total: result.total,
isNat20: !!result.isNat20,
isNat1: !!result.isNat1,
hidden: false,
applyAction: null,
applyTargetName: null,
applyParts: null,
createdAt: firebase.firestore.FieldValue.serverTimestamp()
});
} else {
await db.collection('tables').doc(curTable.id).collection('chatMessages').add({
tableId: curTable.id,
fromUserId: curUser.uid,
fromName: byName,
type: 'general',
content: `🧪 usou ${itemLabel} (${effectLabel})${it.effectDesc ? `: ${it.effectDesc}` : ''}`,
timestamp: firebase.firestore.FieldValue.serverTimestamp()
});
}
} catch (err) {
console.error('Erro ao usar consumível:', err);
return;
}
it.qty = Math.max(0, it.qty - 1);
setMyInventoryItems(sheetId, items);
}
// Grava o array inteiro de volta no documento — diferente de resources
// (campos soltos que dá pra atualizar um a um com notação de ponto),
// inventoryItems é um array, então qualquer alteração exige regravar a
// lista completa.
async function setMyInventoryItems(sheetId, items) {
const sheet = mySheets.find(s => s.id === sheetId); if (!sheet) return;
const cleaned = items.map(ensureInventoryItemShapeQuick).filter(it => it.name.trim() || it.weight || it.qty !== 1);
sheet.inventoryItems = cleaned;
// Reflete na hora qualquer mudança de equipamento (marcar/desmarcar
// Armadura ou Equipada, editar o HP de Armadura de uma parte) no HP de
// Armadura da ficha — mesmo recálculo do editor (ver recalcArmorResources).
const armor = recalcArmorResourcesQuick(sheet);
renderMyInventoryBox();
try {
await db.collection('sheets').doc(sheetId)
.update({ inventoryItems: cleaned, 'resources.armor': armor, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
// Se o jogador já estiver na mesa, o token acompanha na hora — sem
// isto, o novo HP de Armadura só apareceria da próxima vez que ele
// entrasse na mesa de novo.
const tok = liveTokens[curUser.uid];
if (tok && tok.sheetId === sheetId) {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(curUser.uid)
.update({ armor, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
}
} catch (err) {
console.error('Erro ao atualizar inventário da ficha:', err);
}
}
async function enterBoardAsSheet(sheetId) {
const sheet = mySheets.find(s => s.id === sheetId);
const errEl = document.getElementById('enterErr');
if (!sheet) return;
try {
const ref = db.collection('tables').doc(curTable.id).collection('tokens').doc(curUser.uid);
const existing = await ref.get();
const tokenData = {
ownerId: curUser.uid,
sheetId: sheet.id,
name: sheet.characterName || curProfile.name || 'Personagem',
image: sheet.appearanceImage || curProfile.avatarImage || '',
color: myColor,
x: existing.exists ? existing.data().x : snapAxisToGrid(0.5, baseMapW, boardCellPx),
y: existing.exists ? existing.data().y : snapAxisToGrid(0.5, baseMapH, boardCellPx),
updatedAt: firebase.firestore.FieldValue.serverTimestamp()
};
// Só define o HP e a visão inicial na primeira vez que este token é
// criado — se já existir (ex.: "Atualizar aparência"), o HP e a visão
// já ajustados na sessão são preservados. Fichas de jogador nascem com
// visão ligada (revelam a névoa ao redor de si) — ver DEFAULT_VISION_RADIUS_CELLS.
if (!existing.exists) {
tokenData.hp = hpFromSheetResources(sheet.resources);
tokenData.armor = armorFromSheetResources(sheet.resources);
tokenData.visionOn = true;
tokenData.visionRadius = DEFAULT_VISION_RADIUS_CELLS;
tokenData.visionMode = '360';
tokenData.visionConeDeg = DEFAULT_VISION_CONE_DEG;
}
await ref.set(tokenData, { merge: true });
// Registra esta mesa como "ativa" no perfil do jogador — é assim que
// js/editor.js sabe, na próxima vez que a ficha for salva, para quais
// mesas empurrar a aparência/nome atualizados automaticamente.
db.collection('users').doc(curUser.uid).update({
activeTables: firebase.firestore.FieldValue.arrayUnion(curTable.id)
}).catch(err => console.warn('Não foi possível registrar a mesa como ativa:', err));
errEl.classList.add('hidden');
} catch (err) {
errEl.textContent = 'Erro ao entrar na mesa: ' + err.message;
errEl.classList.remove('hidden');
}
}
async function leaveBoard() {
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(curUser.uid).delete();
db.collection('users').doc(curUser.uid).update({
activeTables: firebase.firestore.FieldValue.arrayRemove(curTable.id)
}).catch(() => {});
} catch (err) {
alert('Erro ao sair da mesa: ' + err.message);
}
}
async function addNpcToken() {
const nameEl = document.getElementById('npcName');
const fileEl = document.getElementById('npcImage');
const errEl = document.getElementById('npcErr');
const name = nameEl.value.trim() || 'NPC';
try {
let image = '';
if (fileEl.files && fileEl.files[0]) image = await fileToResizedDataUrl(fileEl.files[0], 240);
await db.collection('tables').doc(curTable.id).collection('tokens').add({
ownerId: curUser.uid, name, image, npc: true, color: npcColor, sceneId: curTable.activeSceneId,
x: snapAxisToGrid(0.5, baseMapW, boardCellPx), y: snapAxisToGrid(0.5, baseMapH, boardCellPx),
hp: defaultTokenHp(),
armor: defaultTokenArmor(),
// NPCs nascem sem visão (não revelam névoa) — o Mestre liga manualmente
// (👁 na lista de tokens) quando fizer sentido, ex.: um familiar/aliado.
visionOn: false, visionRadius: DEFAULT_VISION_RADIUS_CELLS,
updatedAt: firebase.firestore.FieldValue.serverTimestamp()
});
npcColor = pickDefaultColor(name + Date.now()); // próximo NPC nasce com outra cor, pra distinguir na mesa
const swatch = document.getElementById('npcColorSwatch');
if (swatch) swatch.style.background = npcColor;
nameEl.value = ''; fileEl.value = '';
errEl.classList.add('hidden');
} catch (err) {
errEl.textContent = 'Erro ao adicionar: ' + err.message;
errEl.classList.remove('hidden');
}
}
// Coloca na cena atual um token a partir de um NPC salvo na Biblioteca
// (js/npc-library.js) — mesmo formato de addNpcToken acima, só que o
// HP por parte, a cor e a visão já vêm prontos do template em vez de
// serem preenchidos toda vez no formulário rápido.
async function addNpcFromTemplate(template) {
try {
const hp = {};
BODY_PARTS_TABLE.forEach(([k]) => {
const max = (template.hp && template.hp[k]) || 0;
hp[k] = { max, cur: max };
});
await db.collection('tables').doc(curTable.id).collection('tokens').add({
ownerId: curUser.uid, name: template.name || 'NPC', image: template.image || '',
npc: true, color: template.color || pickDefaultColor((template.name || 'npc') + Date.now()),
sceneId: curTable.activeSceneId,
x: snapAxisToGrid(0.5, baseMapW, boardCellPx), y: snapAxisToGrid(0.5, baseMapH, boardCellPx),
hp,
armor: defaultTokenArmor(),
visionOn: !!template.visionOn, visionRadius: template.visionRadius || DEFAULT_VISION_RADIUS_CELLS,
updatedAt: firebase.firestore.FieldValue.serverTimestamp()
});
} catch (err) {
alert('Erro ao adicionar da biblioteca: ' + err.message);
}
}
// -------------------------------------------------------------- TOKENS --
let liveTokens = {}; // id -> data (cache local do último snapshot)
// Token "inspecionado" (clique num token que não é o seu, pra só olhar —
// diferente de selectedTokenId, que abre as alças de girar/redimensionar e
// só existe pra quem pode mexer no token). Mostra HP por parte do corpo
// (em %, sem os números brutos) e as condições/status que o alvo está
// sofrendo, num painel próprio sobre o mapa — ver renderTokenInspectPanel.
let inspectedTokenId = null;
let hpEditExpanded = new Set(); // ids de token com o mini-editor de HP aberto na lista
let tokenToolsExpanded = new Set(); // ids de token com os botões de ação abertos na lista (clicou em cima)
// Qual grupo de ferramentas (Vida/Aparência/Visão/Movimento/Estado) está
// aberto por token, na lista "Fichas na mesa" — id do token -> chave do
// grupo. Só um grupo por vez fica visível (abas), pra lista não virar uma
// parede de ícones quando o jogador clica pra abrir as ferramentas de um
// token; ausência de entrada = nenhum grupo aberto ainda (só as abas).
let tokenActiveGroup = new Map();
// ---- Busca, ordenação e agrupamento da lista "Fichas na mesa" ----
let tokenListSearch = ''; // texto digitado na busca por nome
let tokenListSort = 'default'; // 'default' | 'name' | 'hp' | 'init'
let tokenGroupCollapsed = new Set(); // chaves de categoria ('players'/'npcs'/'props') recolhidas
let tokenListEventsBound = false; // liga os listeners delegados do painel só uma vez
let tlSearchDebounceTimer = null;
const TOKEN_LIST_CATEGORIES = [
['players', '🧑', 'Jogadores'],
['npcs', '👹', 'NPCs/Monstros'],
['props', '📦', 'Props/Montarias'],
];
// Condições/status rápidos sugeridos no campo de adicionar (o Mestre/dono
// também pode digitar qualquer texto livre — isto é só um datalist).
const QUICK_TOKEN_CONDITIONS = ['Envenenado', 'Atordoado', 'Caído', 'Inconsciente', 'Amedrontado', 'Agarrado', 'Concentrando', 'Sangrando'];
// Fichas de jogador acompanham o grupo em qualquer cena; já NPCs/monstros
// avulsos (token.npc === true) e props/montarias (token.prop === true) só
// aparecem na cena em que foram criados — assim, monstros (ou uma carroça
// deixada) de uma masmorra não "vazam" pra cena da taverna, por exemplo.
// NPCs antigos (de antes deste recurso, sem sceneId salvo) continuam
// aparecendo em qualquer cena, pra não sumir nada de mesas já em uso.
function isTokenInActiveScene(tok) {
if ((!tok.npc && !tok.prop) || !tok.sceneId) return true;
return tok.sceneId === (curTable && curTable.activeSceneId);
}
// Invisibilidade "de Mestre" (👻, ver toggleTokenInvisible): esconde o
// token do mapa e da lista lateral pra qualquer jogador que NÃO seja o
// dono dele nem o Mestre — mesmo que a área onde ele está já esteja
// revelada pela névoa de guerra. Diferente da névoa (automática, por linha
// de visão), esta é sempre manual. O dono do token e o Mestre continuam
// enxergando o token normalmente (ver renderAllTokens, que deixa ele meio
// transparente pra quem pode vê-lo assim mesmo — dá pra saber que "sumiu"
// pros outros sem perder de vista o próprio personagem).
function isTokenVisibleToViewer(tok) {
return !tok.invisible || isTableOwner() || tok.ownerId === curUser.uid;
}
// Compara dois tokens ignorando x/y/updatedAt — usado por listenTokens pra
// decidir se uma atualização do Firestore é "só posição" (arrasto, próprio
// ou de outra pessoa) ou uma mudança de verdade (HP, nome, cor, criação,
// remoção...). JSON.stringify é comparação por valor (não por referência),
// necessário porque o Firestore sempre devolve objetos novos a cada
// snapshot mesmo quando o conteúdo não mudou nada.
function tokenSigIgnoringPosition(t) {
const c = Object.assign({}, t);
delete c.x; delete c.y; delete c.updatedAt;
return JSON.stringify(c);
}
function listenTokens() {
tokenUnsub = db.collection('tables').doc(curTable.id).collection('tokens')
.onSnapshot(snap => {
const prevTokens = liveTokens;
const next = {};
// "Estrutural" = token novo/removido, ou algum campo além de x/y mudou
// de verdade (não só a posição ao vivo do arrasto) — só esse caso
// precisa do recálculo pesado completo (lista de fichas, inventário,
// painel de inspeção, névoa em modo "redesenha tudo"...). Ver
// renderTokenPositionsOnly logo abaixo pro caminho leve.
let structural = snap.size !== Object.keys(prevTokens).length;
snap.forEach(d => {
const data = { id: d.id, ...d.data() };
next[d.id] = data;
if (structural) return; // já sabemos que vai ser o caminho completo; só monta o `next`
const prev = prevTokens[d.id];
if (!prev || tokenSigIgnoringPosition(prev) !== tokenSigIgnoringPosition(data)) structural = true;
});
liveTokens = next;
// Durante o arrasto (próprio ou de qualquer outro jogador conectado),
// o Firestore manda várias atualizações de x/y por segundo (ver
// broadcastLiveTokenPosition) — recalcular a lista de fichas inteira,
// os painéis de recursos/inventário e forçar um redesenho COMPLETO da
// névoa a cada uma dessas atualizações (como o renderAllTokens
// completo sempre fazia) pesa muito e é o principal motivo de o
// movimento parecer "engasgado" com a mesa cheia de tokens. Quando
// nada além da posição mudou, só reposiciona os tokens na tela e deixa
// a névoa se virar com o caminho incremental de sempre (que já sabe
// recalcular só quem de fato se moveu) — bem mais barato.
if (structural) {
renderAllTokens();
} else {
renderTokenPositionsOnly();
}
}, err => console.error('Erro ao sincronizar tokens:', err));
}
// Caminho leve chamado pelo listenTokens quando um snapshot do Firestore só
// trouxe posição nova pra tokens que já existiam (arrasto ao vivo, próprio
// ou de outra pessoa) — reposiciona token e aura na tela e atualiza as
// alças de seleção, sem recriar elementos, refazer a lista de fichas nem
// forçar redesenho completo da névoa. Ver renderAllTokens pro caminho
// completo (criação/remoção/qualquer outro campo mudando).
function renderTokenPositionsOnly() {
const surface = document.getElementById('boardSurface');
if (!surface) return;
const w = baseMapW, h = baseMapH;
Object.values(liveTokens).forEach(tok => {
if (tok.id === draggingTokenId || tok.id === handleDraggingTokenId) return; // não sobrescreve o próprio arrasto em andamento
if (!isTokenInActiveScene(tok) || !isTokenVisibleToViewer(tok)) return;
const el = tokenElCache[tok.id];
if (!el) return; // sem elemento em cache ainda (não deveria acontecer aqui) — o próximo renderAllTokens completo resolve
el.style.left = (tok.x * w) + 'px';
el.style.top = (tok.y * h) + 'px';
const auraEl = tokenAuraElCache[tok.id];
if (auraEl) {
auraEl.style.left = (tok.x * w) + 'px';
auraEl.style.top = (tok.y * h) + 'px';
}
});
updateSelectionHandles();
scheduleVisionRecompute(); // caminho incremental de sempre: só recalcula quem de fato se moveu
}
function renderAllTokens() {
const surface = document.getElementById('boardSurface');
if (!surface) return;
// Remove tokens que não existem mais (ou que pertencem a outra cena, ou
// que o Mestre acabou de tornar invisível pra você).
surface.querySelectorAll('.token').forEach(el => {
const t = liveTokens[el.dataset.id];
if (!t || !isTokenInActiveScene(t) || !isTokenVisibleToViewer(t)) { el.remove(); delete tokenElCache[el.dataset.id]; }
});
surface.querySelectorAll('.token-aura').forEach(el => {
const t = liveTokens[el.dataset.auraId];
if (!t || !isTokenInActiveScene(t) || !isTokenVisibleToViewer(t)) { el.remove(); delete tokenAuraElCache[el.dataset.auraId]; }
});
// Se o token que você tinha selecionado (alças de girar/redimensionar
// abertas) sumiu, trocou de cena ou acabou de ficar invisível pra você,
// solta a seleção — senão as alças ficariam "penduradas" sem token
// embaixo, ou (pior) continuariam mexendo num token que você não devia
// nem conseguir ver mais.
if (selectedTokenId) {
const st = liveTokens[selectedTokenId];
if (!st || !isTokenInActiveScene(st) || !isTokenVisibleToViewer(st)) {
if (inspectedTokenId === selectedTokenId) inspectedTokenId = null;
selectedTokenId = null;
if (typeof updateToolToolbarActive === 'function') updateToolToolbarActive();
}
}
// Mesma limpeza pra seleção múltipla: token removido/mudou de cena/ficou
// invisível pra você não pode continuar "marcado" num grupo que não dá
// mais pra mover de verdade.
if (multiSelectedIds.size) {
multiSelectedIds.forEach(id => {
const st = liveTokens[id];
if (!st || !isTokenInActiveScene(st) || !isTokenVisibleToViewer(st)) multiSelectedIds.delete(id);
});
}
if (typeof updateTokenListBulkBar === 'function') updateTokenListBulkBar();
// O board-surface agora sempre fica no tamanho "natural" (sem zoom) — quem
// escala tudo (mapa, grade e tokens) é o transform aplicado nele. Por isso
// aqui usamos as medidas cruas do mapa e da célula, sem multiplicar pelo
// zoom: o token acompanha o zoom de graça, por ser filho do surface.
const w = baseMapW;
const h = baseMapH;
Object.values(liveTokens).forEach(tok => {
if (tok.id === draggingTokenId) return; // não sobrescreve enquanto o próprio usuário arrasta
if (tok.id === handleDraggingTokenId) return; // idem, enquanto arrasta a alça de girar/redimensionar
if (!isTokenInActiveScene(tok)) return; // NPC pertence a outra cena: não aparece no mapa agora
if (!isTokenVisibleToViewer(tok)) return; // invisível pra você (só o Mestre vê) — não chega nem a criar o elemento
// Tamanho por token: célula da grade × o multiplicador próprio do token
// (ferramenta de redimensionar, na lista lateral) — assim uma criatura
// "grande" pode ocupar mais de uma célula sem mudar o zoom de ninguém.
const tokenPx = Math.max(8, Math.round(boardCellPx * (tok.scale || 1)));
let el = surface.querySelector(`.token[data-id="${tok.id}"]`);
if (!el) {
el = document.createElement('div');
el.className = 'token';
el.dataset.id = tok.id;
surface.appendChild(el);
attachTokenDragHandlers(el, tok.id);
}
tokenElCache[tok.id] = el;
el.classList.toggle('mine', tok.ownerId === curUser.uid);
el.classList.toggle('active-turn', !!activeInitiativeId && tok.id === activeInitiativeId);
el.classList.toggle('multi-selected', multiSelectedIds.has(tok.id));
// Só chega a marcar esta classe pra quem pode ver o token mesmo estando
// invisível (dono do token ou Mestre — quem mais nem gera o elemento,
// ver isTokenVisibleToViewer acima) — deixa ele meio transparente (ver
// CSS), pra dar a pista visual de que aquele token some pros outros,
// sem precisar abrir a lista.
el.classList.toggle('token-invisible-to-players', !!tok.invisible);
el.style.width = tokenPx + 'px';
el.style.height = tokenPx + 'px';
el.style.marginLeft = (-tokenPx / 2) + 'px';
el.style.marginTop = (-tokenPx / 2) + 'px';
el.style.left = (tok.x * w) + 'px';
el.style.top = (tok.y * h) + 'px';
// Camada (trazer para frente / enviar para trás, na lista lateral):
// cada token guarda um "z" próprio; a base 1000 garante que qualquer
// token sempre fique acima do mapa/desenhos/névoa, só concorrendo em
// ordem entre si.
el.style.zIndex = String(1000 + (tok.z || 0));
// A cor escolhida na roda cromática (se houver) vence o contorno padrão
// dourado/verde — é ela que faz o token "ser" da cor do usuário.
el.style.borderColor = tok.color || '';
// Aura: círculo colorido por trás do token, com raio em nº de casas da
// grade (tok.auraRadius) — igual à ferramenta de luz/visão do Owlbear.
let auraEl = surface.querySelector(`.token-aura[data-aura-id="${tok.id}"]`);
if (tok.auraOn && tok.auraRadius) {
const auraPx = tokenPx + Math.round(tok.auraRadius * 2 * boardCellPx);
if (!auraEl) {
auraEl = document.createElement('div');
auraEl.className = 'token-aura';
auraEl.dataset.auraId = tok.id;
surface.appendChild(auraEl);
}
tokenAuraElCache[tok.id] = auraEl;
const auraColor = tok.color || '#c9a15c';
auraEl.style.width = auraPx + 'px';
auraEl.style.height = auraPx + 'px';
auraEl.style.marginLeft = (-auraPx / 2) + 'px';
auraEl.style.marginTop = (-auraPx / 2) + 'px';
auraEl.style.left = (tok.x * w) + 'px';
auraEl.style.top = (tok.y * h) + 'px';
auraEl.style.background = `radial-gradient(circle, ${hexToRgba(auraColor, 0.20)} 55%, ${hexToRgba(auraColor, 0.32)} 88%, ${hexToRgba(auraColor, 0)} 100%)`;
auraEl.style.border = `1px solid ${hexToRgba(auraColor, 0.55)}`;
} else if (auraEl) {
auraEl.remove();
delete tokenAuraElCache[tok.id];
}
// Só refaz o HTML interno (imagem/nome/HP) quando algo além da posição
// muda. Com o movimento em tempo real (acima), a posição agora é
// atualizada várias vezes por segundo enquanto um token é arrastado —
// se recriássemos a tag <img> a cada uma dessas atualizações, a
// imagem piscaria continuamente pros outros jogadores vendo o token se
// mover. x/y ficam de fora de propósito desta "assinatura".
const rot = tok.rot || 0;
const sig = JSON.stringify([tok.image || '', tok.name || '', rot, tok.hp || null, !!tok.prop]);
if (el.dataset.sig !== sig) {
el.dataset.sig = sig;
el.innerHTML = tok.image
? `<img src="${escapeHtml(tok.image)}" alt="" style="transform:rotate(${rot}deg);">`
: `<div class="token-ph" style="transform:rotate(${rot}deg);">${tok.prop ? '📦' : '👤'}</div>`;
el.innerHTML += `<span class="token-label">${escapeHtml(tok.name || '')}</span>`;
}
});
renderTokenListPanel();
renderDiceTargetOptions();
updateSelectionHandles();
renderTokenInspectPanel();
renderMyResourcesBox();
renderMyInventoryBox();
// A lista de tokens (ou algum campo deles, como visão/alcance/HP) pode
// ter mudado — mais seguro forçar recálculo completo aqui em vez de
// tentar adivinhar se foi só posição (o caminho "dirty-rect" rápido é
// só pra o arrasto contínuo, tratado fora de renderAllTokens).
visionFullRedrawNeeded = true;
scheduleVisionRecompute(); // token(s) podem ter se movido/mudado — recalcula a névoa revelada
if (!isTableOwner()) {
updateMyTokenUiState(!!liveTokens[curUser.uid]);
}
}
function tlNormalize(s) {
return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
// Categoria de um token pra fins de agrupamento visual na lista (não mexe
// em nada além da apresentação — as mesmas regras de permissão/visibilidade
// de antes continuam valendo).
function tokenListCategory(t) {
if (t.prop) return 'props';
if (t.npc) return 'npcs';
return 'players';
}
// HP em fração (0 a 1) somando todas as partes do corpo — usado só pra
// ordenar por "mais ferido primeiro". Tokens sem HP definido (sumMax=0)
// vão pro fim da lista (valor >1 não é um HP real, só um marcador de "por
// último" que nunca fica antes de um token com HP de verdade).
function tokenHpFraction(t) {
const hp = t.hp || {};
const sumCur = BODY_PARTS_TABLE.reduce((a, [k]) => a + ((hp[k] && hp[k].cur) || 0), 0);
const sumMax = BODY_PARTS_TABLE.reduce((a, [k]) => a + ((hp[k] && hp[k].max) || 0), 0);
if (!sumMax) return 2;
return sumCur / sumMax;
}
function sortTokenList(list) {
const arr = list.slice();
if (tokenListSort === 'name') {
arr.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
} else if (tokenListSort === 'hp') {
arr.sort((a, b) => tokenHpFraction(a) - tokenHpFraction(b));
} else if (tokenListSort === 'init') {
arr.sort((a, b) => {
const ai = liveInitiative[a.id], bi = liveInitiative[b.id];
if (ai && bi) return (bi.value || 0) - (ai.value || 0);
if (ai) return -1;
if (bi) return 1;
return 0;
});
}
return arr;
}
function renderTokenListPanel() {
const body = document.getElementById('tokenListBody');
bindTokenListPanelEvents();
const canManage = isTableOwner();
// Jogadores não veem NPCs/monstros na lista de fichas da mesa — só o Mestre
// controla e enxerga os NPCs; jogadores só veem as fichas de personagem.
// Tokens marcados como invisíveis (👻, só o Mestre alterna) também somem
// da lista de quem não é dono nem Mestre — mas o próprio dono continua
// vendo (e controlando) o token normalmente, só sabendo que ele está
// invisível pros outros.
let tokens = Object.values(liveTokens).filter(t => canManage || (!t.npc && (!t.invisible || t.ownerId === curUser.uid)));
const totalBeforeSearch = tokens.length;
const search = tokenListSearch.trim();
if (search) {
const q = tlNormalize(search);
tokens = tokens.filter(t => tlNormalize(t.name || '').includes(q));
}
if (totalBeforeSearch === 0) { body.innerHTML = `<span class="tc-meta">Nenhum token ainda.</span>`; return; }
if (tokens.length === 0) { body.innerHTML = `<span class="tc-meta">Nenhum resultado para "${escapeHtml(search)}".</span>`; return; }
// Agrupa em Jogadores / NPCs / Props, cada categoria só aparece se tiver
// pelo menos 1 token (depois do filtro de busca) — evita cabeçalhos vazios.
const buckets = { players: [], npcs: [], props: [] };
tokens.forEach(t => buckets[tokenListCategory(t)].push(t));
body.innerHTML = TOKEN_LIST_CATEGORIES.map(([catKey, icon, label]) => {
const list = sortTokenList(buckets[catKey]);
if (!list.length) return '';
const collapsed = tokenGroupCollapsed.has(catKey);
const rowsHtml = list.map(t => tokenRowHtml(t, canManage)).join('');
return `
<div class="tl-group ${collapsed ? 'collapsed' : ''}" data-tl-group="${catKey}">
<div class="tl-group-head" data-tl-group-toggle="${catKey}">
<span>${icon} ${label}</span>
<span class="tl-group-count">${list.length}</span>
</div>
<div class="tl-group-body">${rowsHtml}</div>
</div>`;
}).join('') + `<datalist id="condQuickList">${QUICK_TOKEN_CONDITIONS.map(c => `<option value="${escapeHtml(c)}">`).join('')}</datalist>`;
}
function tokenRowHtml(t, canManage) {
// Cada jogador gira/redimensiona o próprio token; o Mestre pode mexer
// em qualquer um; um prop/montaria (t.prop) é livre pra qualquer um.
const canEdit = canManage || t.ownerId === curUser.uid || t.prop === true;
const condEditable = canEdit && !t.prop; // condições/status não existem em props
const elsewhere = t.npc && t.sceneId && t.sceneId !== curTable.activeSceneId;
const hp = t.hp || {};
const armor = t.armor || {};
const sumCur = BODY_PARTS_TABLE.reduce((a, [k]) => a + ((hp[k] && hp[k].cur) || 0), 0);
const sumMax = BODY_PARTS_TABLE.reduce((a, [k]) => a + ((hp[k] && hp[k].max) || 0), 0);
const expanded = hpEditExpanded.has(t.id);
const toolsOpen = tokenToolsExpanded.has(t.id);
// Quais grupos de ferramentas existem para este token (mesmas condições
// de antes) — vira uma aba cada, em vez de tudo despejado de uma vez.
const hasVida = !t.prop && (sumMax || (canEdit && !elsewhere) || (canManage && t.sheetId));
const hasAparencia = canEdit && !elsewhere;
const hasVisao = canEdit && !elsewhere && !t.prop;
const hasMovimento = canEdit && !elsewhere;
// "Estado" agora também é onde qualquer dono (não só o Mestre) marca
// condições/status no próprio token — antes só existia pra Mestre
// (remover/invisível) e dono de prop.
const hasEstado = canManage || (t.prop && t.ownerId === curUser.uid) || condEditable;
const groupDefs = [
hasVida && ['vida', '❤', 'Vida'],
hasAparencia && ['aparencia', '🎨', 'Aparência'],
hasVisao && ['visao', '👁', 'Visão'],
hasMovimento && ['movimento', '🧭', 'Movimento'],
hasEstado && ['estado', '⚙', 'Estado'],
].filter(Boolean);
// Só um grupo por vez fica aberto; se o salvo não existe mais pra este
// token (ex.: perdeu permissão), cai pro primeiro disponível.
let activeGroup = tokenActiveGroup.get(t.id);
if (!groupDefs.some(([key]) => key === activeGroup)) activeGroup = null;
// O total de HP (essa "❤ cur/max") só aparece pra quem pode editar o
// token — o próprio dono ou o Mestre. Um jogador olhando a ficha de
// OUTRO jogador na lista não vê mais o número; se quiser saber como o
// alvo está, usa o painel "🎯 Inspecionar" no mapa (clique no token),
// que mostra só a % de desgaste por parte do corpo, não o valor bruto.
const miniHp = (!t.prop && sumMax && canEdit) ? `<span class="tr-mini-hp" title="HP total (soma das partes)">❤ ${sumCur}/${sumMax}</span>` : '';
// Posição na iniciativa (se este token estiver na lista de combate) —
// dá pra ver de relance sem precisar abrir o painel "⚔️ Iniciativa" à parte.
const initEntry = liveInitiative[t.id];
const initBadge = initEntry
? `<span class="tl-init-badge" title="Posição na iniciativa">⚔ ${initEntry.value || 0}${t.id === activeInitiativeId ? ' ▶' : ''}</span>`
: '';
const conditions = Array.isArray(t.conditions) ? t.conditions : [];
const condRow = conditions.length ? `
<div class="tr-cond-row">
${conditions.map(c => `<span class="tr-cond-chip">${escapeHtml(c)}${condEditable ? `<button class="cond-x" data-cond-remove="${t.id}" data-cond-value="${escapeHtml(c)}" title="Remover condição">×</button>` : ''}</span>`).join('')}
</div>` : '';
return `
<div class="token-row ${elsewhere ? 'token-row-elsewhere' : ''}" data-token-row="${t.id}">
<div class="tr-header">
<span class="${t.sheetId ? 'tr-name' : ''}" ${t.sheetId ? `data-view-sheet="${t.sheetId}"` : ''}>${escapeHtml(t.name || 'Token')}${t.prop ? ' <span class="tc-meta">(prop)</span>' : ''}${elsewhere ? ' <span class="tc-meta">(outra cena)</span>' : ''}${t.invisible ? ' <span class="tc-meta">(invisível p/ jogadores)</span>' : ''}</span>
<span class="tr-badges">${initBadge}${miniHp}</span>
</div>
${condRow}
<div class="tr-tools ${toolsOpen ? '' : 'hidden'}">
${elsewhere && canManage ? `<button class="tr-quick-btn" data-bring-scene="${t.id}" title="Trazer este NPC para a cena atual">📥 trazer</button>` : ''}
${groupDefs.length ? `
<div class="tr-tabs">
${groupDefs.map(([key, icon, label]) => `<button type="button" class="tr-tab ${activeGroup === key ? 'tr-tab-active' : ''}" data-tool-tab="${key}" data-token-tab="${t.id}" title="${label}">${icon} ${label}</button>`).join('')}
</div>` : ''}
${activeGroup === 'vida' ? `
<div class="tr-group">
${canEdit && !elsewhere ? `<button data-hp-toggle="${t.id}" title="Ver/editar HP por parte">${expanded ? '❤︎ fechar HP' : '❤ Ver/editar HP'}</button>` : ''}
${canEdit && !elsewhere ? `
<span class="tr-hp-quick">
<input type="number" min="0" class="hp-quick-input" data-hp-quick="${t.id}" placeholder="HP" title="Define esta vida (máxima e atual) em todas as 6 partes do corpo de uma vez, sem precisar editar parte por parte — ideal pra configurar um NPC rápido">
<button data-hp-quick-apply="${t.id}" title="Aplicar este HP a todas as partes do corpo deste token">❤ definir tudo</button>
</span>` : ''}
${canManage && t.sheetId ? `
<span class="tr-xp-add">
<input type="number" class="xp-add-input" data-xp-input="${t.id}" placeholder="± XP" title="Quantidade de XP para dar (ou tirar, com número negativo)">
<button data-xp-add="${t.id}" title="Adicionar XP à ficha deste jogador">🌟 XP</button>
</span>` : ''}
</div>` : ''}
${activeGroup === 'aparencia' ? `
<div class="tr-group">
<button data-tcolor="${t.id}" style="background:${t.color || '#c9a15c'}; width:14px; height:14px; border-radius:50%; padding:0; border:1px solid var(--hairline-soft);" title="Cor do token"></button>
${!t.prop ? `
<button data-aura-toggle="${t.id}" title="${t.auraOn ? 'Desligar aura' : 'Ligar aura'}">${t.auraOn ? '💡' : '🕯'}</button>
${t.auraOn ? `
<button data-aura-delta="${t.id}" data-delta="-0.5" title="Diminuir aura">−</button>
<input type="number" class="aura-radius-input" data-aura-input="${t.id}" value="${t.auraRadius || 2}" min="0.5" step="0.5" title="Raio da aura (em quadrados)">
<button data-aura-delta="${t.id}" data-delta="0.5" title="Aumentar aura">+</button>
` : ''}` : ''}
</div>` : ''}
${activeGroup === 'visao' ? `
<div class="tr-group">
<button data-vision-toggle="${t.id}" title="${tokenHasVision(t) ? 'Desligar visão (para de revelar a névoa)' : 'Ligar visão (revela a névoa ao redor, bloqueada por paredes)'}">${tokenHasVision(t) ? '👁' : '🙈'}</button>
${tokenHasVision(t) ? `
<button data-vision-delta="${t.id}" data-delta="-1" title="Diminuir alcance de visão">−</button>
<input type="number" class="aura-radius-input" data-vision-input="${t.id}" value="${t.visionRadius || DEFAULT_VISION_RADIUS_CELLS}" min="1" step="1" title="Alcance de visão (em casas da grade), com luz ambiente ou dentro de uma fonte de luz (🔥)">
<button data-vision-delta="${t.id}" data-delta="1" title="Aumentar alcance de visão">+</button>
<button data-vision-mode="${t.id}" title="${t.visionMode === 'cone' ? 'Visão em cone, na direção que o token está virado (use ⟲⟳ ou a alça de girar para mudar) — clique para voltar a 360°' : 'Visão em 360° — clique para restringir a um cone na direção que o token estiver virado (⟲⟳ ou a alça de girar)'}">${t.visionMode === 'cone' ? '🔦' : '🌐'}</button>
${t.visionMode === 'cone' ? `
<button data-cone-delta="${t.id}" data-delta="-10" title="Estreitar o cone de visão">‹</button>
<input type="number" class="aura-radius-input" data-cone-input="${t.id}" value="${t.visionConeDeg || DEFAULT_VISION_CONE_DEG}" min="10" max="359" step="5" title="Abertura do cone de visão, em graus">
<button data-cone-delta="${t.id}" data-delta="10" title="Alargar o cone de visão">›</button>
` : ''}
<span class="tr-dark-vision" title="Visão no escuro (infravisão): alcance, em casas, que este token ainda enxerga numa cena com 'Escuridão real' (🌑) ligada e fora de qualquer fonte de luz. 0 = cego no escuro, só enxergando bem pertinho de si.">
🌑<input type="number" class="aura-radius-input" data-dark-input="${t.id}" value="${t.darkRadius || 0}" min="0" step="0.5">
</span>
` : ''}
</div>` : ''}
${activeGroup === 'movimento' ? `
<div class="tr-group">
<button data-rotate="${t.id}" data-delta="-15" title="Girar à esquerda">⟲</button>
<button data-rotate="${t.id}" data-delta="15" title="Girar à direita">⟳</button>
${!t.prop ? `<button data-cursor-follow="${t.id}" class="${cursorFollowTokenIds.has(t.id) ? 'cursor-follow-on' : ''}" title="${cursorFollowTokenIds.has(t.id) ? 'Desligar: o token para de girar sozinho' : 'Ligar: o token gira sozinho apontando para onde o cursor estiver sobre o mapa'}">🧭 ${cursorFollowTokenIds.has(t.id) ? 'Seguindo cursor' : 'Seguir cursor'}</button>` : ''}
<button data-scale="${t.id}" data-delta="-0.25" title="Diminuir">−</button>
<button data-scale="${t.id}" data-delta="0.25" title="Aumentar">+</button>
<button data-tofront="${t.id}" title="Trazer para frente (fica por cima dos outros tokens)">⬆︎</button>
<button data-toback="${t.id}" title="Enviar para trás (fica por baixo dos outros tokens)">⬇︎</button>
</div>` : ''}
${activeGroup === 'estado' ? `
<div class="tr-group">
${canManage ? `<button data-invisible-toggle="${t.id}" class="${t.invisible ? 'token-invisible-on' : ''}" title="${t.invisible ? 'Tornar visível de novo para os jogadores' : 'Tornar invisível: só o Mestre e o dono do token continuam vendo (meio transparente); os outros jogadores deixam de ver'}">${t.invisible ? '🫥 Invisível' : '👻 Tornar invisível'}</button>` : ''}
${condEditable ? `
<span class="tr-cond-add">
<input type="text" list="condQuickList" class="cond-add-input" data-cond-input="${t.id}" placeholder="+ condição" maxlength="24" title="Digite ou escolha uma condição/status (ex.: Envenenado, Atordoado…)">
<button data-cond-add="${t.id}" title="Adicionar condição">+</button>
</span>` : ''}
${canManage ? `<button data-remove="${t.id}">remover</button>` : ''}
</div>` : ''}
</div>
</div>
${expanded && canEdit && !elsewhere ? `
<div class="token-hp-edit">
${BODY_PARTS_TABLE.map(([k, label]) => {
const part = hp[k] || { max: 0, cur: 0 };
return `<span class="hp-part">${label}:
<input type="number" data-hp-cur="${t.id}" data-part="${k}" value="${part.cur}" title="HP atual — ${label}">
/ <input type="number" data-hp-max="${t.id}" data-part="${k}" value="${part.max}" title="HP máximo — ${label}">
</span>`;
}).join('')}
</div>
<div class="token-hp-edit token-armor-edit">
${BODY_PARTS_TABLE.map(([k, label]) => {
const part = armor[k] || { max: 0, cur: 0 };
return `<span class="hp-part">🛡️ ${label}:
<input type="number" min="0" data-armor-cur="${t.id}" data-part="${k}" value="${part.cur}" title="HP de Armadura atual — ${label}">
/ <input type="number" min="0" data-armor-max="${t.id}" data-part="${k}" value="${part.max}" title="HP de Armadura máximo — ${label} (normalmente vem sozinho dos itens de armadura equipados; editar aqui é só pra ajuste manual de NPC)">
</span>`;
}).join('')}
</div>` : ''}`;
}
// Todos os cliques/mudanças da lista "Fichas na mesa" passam por listeners
// únicos aqui (delegação de eventos), em vez de recriar um listener por
// botão/campo a cada renderTokenListPanel(). Numa mesa com muitos tokens
// (ou com atualizações frequentes vindas do Firestore), religar dezenas de
// listeners a cada snapshot tinha um custo real; delegar pro container fixo
// (#tokenListBody, que nunca é recriado, só seu innerHTML muda) resolve
// isso de vez — os listeners são ligados 1 única vez, chamada com guarda
// (tokenListEventsBound) logo no início de renderTokenListPanel().
function bindTokenListPanelEvents() {
if (tokenListEventsBound) return;
const body = document.getElementById('tokenListBody');
if (!body) return;
tokenListEventsBound = true;
body.addEventListener('click', (e) => {
const groupHead = e.target.closest('[data-tl-group-toggle]');
if (groupHead) {
const key = groupHead.dataset.tlGroupToggle;
if (tokenGroupCollapsed.has(key)) tokenGroupCollapsed.delete(key); else tokenGroupCollapsed.add(key);
renderTokenListPanel();
return;
}
const tab = e.target.closest('[data-tool-tab]');
if (tab) {
const id = tab.dataset.tokenTab;
const key = tab.dataset.toolTab;
tokenActiveGroup.set(id, tokenActiveGroup.get(id) === key ? null : key);
renderTokenListPanel();
return;
}
const bring = e.target.closest('[data-bring-scene]');
if (bring) {
db.collection('tables').doc(curTable.id).collection('tokens').doc(bring.dataset.bringScene)
.update({ sceneId: curTable.activeSceneId }).catch(err => console.error('Erro ao trazer NPC:', err));
return;
}
const viewSheet = e.target.closest('[data-view-sheet]');
if (viewSheet) { openSheetModal(viewSheet.dataset.viewSheet); return; }
const colorBtn = e.target.closest('[data-tcolor]');
if (colorBtn) {
const id = colorBtn.dataset.tcolor;
const t = liveTokens[id];
openColorWheel(colorBtn, (t && t.color) || '#c9a15c', async (hex) => {
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(id).update({ color: hex });
if (id === curUser.uid) {
myColor = hex; setStoredColor(curUser.uid, hex);
const sw = document.getElementById('myColorSwatch');
if (sw) sw.style.background = hex;
}
} catch (err) { console.error('Erro ao mudar cor do token:', err); }
});
return;
}
const auraToggle = e.target.closest('[data-aura-toggle]');
if (auraToggle) { toggleTokenAura(auraToggle.dataset.auraToggle); return; }
const auraDelta = e.target.closest('[data-aura-delta]');
if (auraDelta) { adjustTokenAuraRadius(auraDelta.dataset.auraDelta, parseFloat(auraDelta.dataset.delta)); return; }
const visionToggle = e.target.closest('[data-vision-toggle]');
if (visionToggle) { toggleTokenVision(visionToggle.dataset.visionToggle); return; }
const visionDelta = e.target.closest('[data-vision-delta]');
if (visionDelta) { adjustTokenVisionRadius(visionDelta.dataset.visionDelta, parseFloat(visionDelta.dataset.delta)); return; }
const visionMode = e.target.closest('[data-vision-mode]');
if (visionMode) { toggleTokenVisionMode(visionMode.dataset.visionMode); return; }
const coneDelta = e.target.closest('[data-cone-delta]');
if (coneDelta) { adjustTokenVisionCone(coneDelta.dataset.coneDelta, parseFloat(coneDelta.dataset.delta)); return; }
const rotate = e.target.closest('[data-rotate]');
if (rotate) { rotateToken(rotate.dataset.rotate, parseFloat(rotate.dataset.delta)); return; }
const cursorFollow = e.target.closest('[data-cursor-follow]');
if (cursorFollow) { toggleTokenCursorFollow(cursorFollow.dataset.cursorFollow); return; }
const scale = e.target.closest('[data-scale]');
if (scale) { scaleToken(scale.dataset.scale, parseFloat(scale.dataset.delta)); return; }
const toFront = e.target.closest('[data-tofront]');
if (toFront) { bringTokenToFront(toFront.dataset.tofront); return; }
const toBack = e.target.closest('[data-toback]');
if (toBack) { sendTokenToBack(toBack.dataset.toback); return; }
const remove = e.target.closest('[data-remove]');
if (remove) {
if (isTableOwner()) db.collection('tables').doc(curTable.id).collection('tokens').doc(remove.dataset.remove).delete();
return;
}
const invisToggle = e.target.closest('[data-invisible-toggle]');
if (invisToggle) {
if (isTableOwner()) toggleTokenInvisible(invisToggle.dataset.invisibleToggle);
return;
}
const xpAdd = e.target.closest('[data-xp-add]');
if (xpAdd) {
const id = xpAdd.dataset.xpAdd;
const input = body.querySelector(`[data-xp-input="${id}"]`);
if (input) addXpToToken(id, input);
return;
}
const hpToggle = e.target.closest('[data-hp-toggle]');
if (hpToggle) {
const id = hpToggle.dataset.hpToggle;
if (hpEditExpanded.has(id)) hpEditExpanded.delete(id); else hpEditExpanded.add(id);
renderTokenListPanel();
return;
}
const hpQuickApply = e.target.closest('[data-hp-quick-apply]');
if (hpQuickApply) {
const id = hpQuickApply.dataset.hpQuickApply;
const input = body.querySelector(`[data-hp-quick="${id}"]`);
if (input) setTokenHpAllParts(id, input.value);
return;
}
const condAdd = e.target.closest('[data-cond-add]');
if (condAdd) {
const id = condAdd.dataset.condAdd;
const input = body.querySelector(`[data-cond-input="${id}"]`);
if (input) { addTokenCondition(id, input.value); input.value = ''; }
return;
}
const condRemove = e.target.closest('[data-cond-remove]');
if (condRemove) { removeTokenCondition(condRemove.dataset.condRemove, condRemove.dataset.condValue); return; }
// Os botões de ação (girar, HP, cor, visão etc.) ficam escondidos até o
// jogador clicar em cima da ficha na lista — evita uma lista poluída de
// botões quando há várias fichas na mesa. Clicar de novo esconde. Clicar
// em algo que já tem ação própria (nome, botão, campo) não deve também
// abrir/fechar as ferramentas — só o "corpo" da linha (chega aqui por
// último de propósito: nenhum dos casos acima "consumiu" o clique).
const row = e.target.closest('[data-token-row]');
if (row && !e.target.closest('.tr-name, button, input, select')) {
const id = row.dataset.tokenRow;
if (tokenToolsExpanded.has(id)) tokenToolsExpanded.delete(id); else tokenToolsExpanded.add(id);
renderTokenListPanel();
}
});
// Campos numéricos/texto: Enter confirma (tira o foco ou dispara a ação),
// sem precisar de um listener por campo — e sem precisar mais de
// stopPropagation no click (o handler de click acima já ignora cliques
// dentro de "button, input, select" antes de tratar como clique na linha).
body.addEventListener('keydown', (e) => {
if (e.key !== 'Enter') return;
if (e.target.matches('[data-xp-input]')) { e.preventDefault(); addXpToToken(e.target.dataset.xpInput, e.target); return; }
if (e.target.matches('[data-cond-input]')) { e.preventDefault(); addTokenCondition(e.target.dataset.condInput, e.target.value); e.target.value = ''; return; }
if (e.target.matches('[data-hp-quick]')) { e.preventDefault(); setTokenHpAllParts(e.target.dataset.hpQuick, e.target.value); return; }
if (e.target.matches('input')) e.target.blur();
});
body.addEventListener('change', (e) => {
const t = e.target;
if (t.matches('[data-aura-input]')) return setTokenAuraRadius(t.dataset.auraInput, parseFloat(t.value));
if (t.matches('[data-vision-input]')) return setTokenVisionRadius(t.dataset.visionInput, parseFloat(t.value));
if (t.matches('[data-dark-input]')) return setTokenDarkRadius(t.dataset.darkInput, parseFloat(t.value));
if (t.matches('[data-cone-input]')) return setTokenVisionCone(t.dataset.coneInput, parseFloat(t.value));
if (t.matches('[data-hp-cur]')) return setTokenHpPart(t.dataset.hpCur, t.dataset.part, 'cur', t.value);
if (t.matches('[data-hp-max]')) return setTokenHpPart(t.dataset.hpMax, t.dataset.part, 'max', t.value);
if (t.matches('[data-armor-cur]')) return setTokenArmorPart(t.dataset.armorCur, t.dataset.part, 'cur', t.value);
if (t.matches('[data-armor-max]')) return setTokenArmorPart(t.dataset.armorMax, t.dataset.part, 'max', t.value);
});
}
// Adiciona (ou tira, se digitar valor negativo) um marcador de condição/
// status (ex.: "Envenenado") ao token — visível pra todo mundo que já
// enxerga o token na lista, editável só por quem pode editar o token.
async function addTokenCondition(tokenId, rawLabel) {
const label = (rawLabel || '').trim().slice(0, 24);
if (!label) return;
const tok = liveTokens[tokenId]; if (!tok) return;
if ((tok.conditions || []).includes(label)) return;
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId)
.update({ conditions: firebase.firestore.FieldValue.arrayUnion(label) });
} catch (err) { console.error('Erro ao adicionar condição:', err); }
}
async function removeTokenCondition(tokenId, label) {
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId)
.update({ conditions: firebase.firestore.FieldValue.arrayRemove(label) });
} catch (err) { console.error('Erro ao remover condição:', err); }
}
// Edição manual de uma única parte do HP de um token, direto na lista
// lateral — útil para corrigir um valor ou configurar o HP inicial de um
// NPC avulso (que não tem ficha própria pra puxar os valores automaticamente).
// Atalho pra não precisar editar as 6 partes do corpo uma a uma: define de
// uma vez max=cur=valor em todas elas — pensado pra configurar rapidamente
// o HP de um NPC avulso (que sempre nasce com o valor padrão genérico).
async function setTokenHpAllParts(tokenId, rawValue) {
const tok = liveTokens[tokenId]; if (!tok) return;
const value = parseInt(rawValue, 10);
if (isNaN(value) || value < 0) return;
const hp = {};
BODY_PARTS_TABLE.forEach(([k]) => { hp[k] = { max: value, cur: value }; });
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId)
.update({ hp, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
if (tok.sheetId) await syncTokenHpToSheet(tok.sheetId, hp);
} catch (err) {
console.error('Erro ao definir HP do token:', err);
}
renderTokenListPanel();
}
// ---------- HP em lote para vários tokens marcados (ferramenta 🔲) --------
// Resolve o caso que mais demora na mesa: configurar HP de vários NPCs
// iguais (ex.: 5 goblins) um por um. Com a ferramenta de seleção múltipla,
// o Mestre marca todos e aplica o mesmo HP a todos de uma vez, num único
// commit no Firestore (em vez de N updates separados).
let tokenListBulkHpEventsBound = false;
function bindTokenListBulkBarEvents() {
if (tokenListBulkHpEventsBound) return;
const bar = document.getElementById('tokenListBulkHp');
if (!bar) return;
tokenListBulkHpEventsBound = true;
const input = document.getElementById('tokenListBulkHpInput');
const applyBtn = document.getElementById('tokenListBulkHpApply');
applyBtn.addEventListener('click', () => { applyHpToSelectedTokens(input.value); });
input.addEventListener('keydown', (e) => {
if (e.key === 'Enter') { e.preventDefault(); applyHpToSelectedTokens(input.value); }
});
}
// Mostra/esconde a barra e atualiza a contagem — chamado sempre que a
// seleção múltipla muda (junto de renderAllTokens, que já roda nesses
// momentos) ou a lista de tokens é re-renderizada.
function updateTokenListBulkBar() {
bindTokenListBulkBarEvents();
const bar = document.getElementById('tokenListBulkHp');
if (!bar) return;
const count = (typeof multiSelectedIds !== 'undefined') ? multiSelectedIds.size : 0;
const eligible = count > 1 && Object.values(liveTokens).some(t => multiSelectedIds.has(t.id) && !t.prop && canDragToken(t));
bar.classList.toggle('hidden', !eligible);
if (eligible) {
const countEl = document.getElementById('tokenListBulkHpCount');
if (countEl) countEl.textContent = `🔲 ${count} tokens marcados —`;
}
}
async function applyHpToSelectedTokens(rawValue) {
const value = parseInt(rawValue, 10);
if (isNaN(value) || value < 0) return;
const hp = {};
BODY_PARTS_TABLE.forEach(([k]) => { hp[k] = { max: value, cur: value }; });
const targets = Array.from(multiSelectedIds)
.map(id => liveTokens[id])
.filter(t => t && !t.prop && canDragToken(t));
if (!targets.length) return;
try {
const batch = db.batch();
targets.forEach(t => {
const ref = db.collection('tables').doc(curTable.id).collection('tokens').doc(t.id);
batch.update(ref, { hp, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
});
await batch.commit();
// Fichas de jogador vinculadas também recebem o HP novo, um doc por vez
// (mesmo caminho usado pela edição individual — não dá pra ir em lote
// porque cada ficha é uma coleção diferente).
const sheetIds = targets.filter(t => t.sheetId).map(t => t.sheetId);
for (const sheetId of sheetIds) await syncTokenHpToSheet(sheetId, hp);
} catch (err) {
console.error('Erro ao aplicar HP em lote:', err);
}
}
async function setTokenHpPart(tokenId, partKey, field, rawValue) {
const tok = liveTokens[tokenId]; if (!tok) return;
const value = parseInt(rawValue, 10);
if (isNaN(value) || value < 0) { renderTokenListPanel(); return; }
const hp = Object.assign({}, defaultTokenHp(), tok.hp || {});
const part = Object.assign({ max: 0, cur: 0 }, hp[partKey] || {});
part[field] = value;
if (field === 'max' && part.cur > value) part.cur = value; // não deixa o atual passar do novo máximo
hp[partKey] = part;
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId)
.update({ hp, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
if (tok.sheetId) await syncTokenHpToSheet(tok.sheetId, hp);
} catch (err) {
console.error('Erro ao editar HP do token:', err);
renderTokenListPanel();
}
}
// Mesmos moldes de setTokenHpPart acima, para o HP de Armadura — usado pelo
// mini-editor "🛡️" da lista de tokens (ajuste manual, ex.: armar um NPC à
// mão) e também serve de "consertar": bastar subir o "atual" de volta ao
// máximo já conserta a armadura daquela parte.
async function setTokenArmorPart(tokenId, partKey, field, rawValue) {
const tok = liveTokens[tokenId]; if (!tok) return;
const value = parseInt(rawValue, 10);
if (isNaN(value) || value < 0) { renderTokenListPanel(); return; }
const armor = Object.assign({}, defaultTokenArmor(), tok.armor || {});
const part = Object.assign({ max: 0, cur: 0 }, armor[partKey] || {});
part[field] = value;
if (field === 'max' && part.cur > value) part.cur = value; // não deixa o atual passar do novo máximo
armor[partKey] = part;
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId)
.update({ armor, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
if (tok.sheetId) await syncTokenArmorToSheet(tok.sheetId, armor);
} catch (err) {
console.error('Erro ao editar HP de Armadura do token:', err);
renderTokenListPanel();
}
}
// Dá (ou tira, com número negativo) XP à ficha de um jogador direto pela
// lista de tokens da mesa, sem o Mestre precisar abrir a ficha dele. Usa
// incremento atômico (FieldValue.increment) e não lê a ficha antes de
// escrever — assim funciona mesmo quando essa ficha não está numa
// pasta/campanha deste Mestre (Mesa e pasta são conceitos independentes
// no sistema; ver a exceção correspondente em firestore.rules, nos mesmos
// moldes da já existente para "resources.hp"). O jogador vê o efeito
// (inclusive uma possível subida de nível) na próxima vez que abrir a
// própria ficha.
async function addXpToToken(tokenId, input) {
const tok = liveTokens[tokenId]; if (!tok || !tok.sheetId) return;
const amount = parseInt(input.value, 10);
if (!amount) { input.focus(); return; }
input.disabled = true;
try {
await db.collection('sheets').doc(tok.sheetId).update({
xp: firebase.firestore.FieldValue.increment(amount),
updatedAt: firebase.firestore.FieldValue.serverTimestamp()
});
input.value = '';
flashXpFeedback(tokenId, amount);
} catch (err) {
console.error('Erro ao adicionar XP:', err);
alert('Erro ao dar XP: ' + err.message);
} finally {
input.disabled = false;
}
}
// Feedback visual rápido e discreto no próprio botão (some sozinho) — a
// lista de tokens já se redesenha com frequência (a cada atualização de
// qualquer token na mesa), então não vale a pena guardar esse estado.
function flashXpFeedback(tokenId, amount) {
const btn = document.querySelector(`[data-xp-add="${tokenId}"]`);
if (!btn) return;
const prev = btn.textContent;
btn.textContent = amount > 0 ? `✓ +${amount} XP` : `✓ ${amount} XP`;
setTimeout(() => { if (btn.isConnected) btn.textContent = prev; }, 1600);
}
async function toggleTokenAura(tokenId) {
const tok = liveTokens[tokenId]; if (!tok) return;
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId)
.update({ auraOn: !tok.auraOn, auraRadius: tok.auraRadius || 2 });
} catch (err) { console.error('Erro ao alternar aura:', err); }
}
// Invisibilidade "de Mestre": ao contrário da névoa de guerra (que some e
// volta sozinha conforme os tokens com visão se movem), este é um
// interruptor manual, só do Mestre — o token some do mapa e da lista pra
// todo mundo, MENOS o próprio dono e o Mestre, que continuam vendo (só que
// meio transparente, ver classe token-invisible-to-players no CSS), até o
// Mestre religar. Serve pra emboscadas, um NPC disfarçado, ou o efeito de
// um personagem que ficou invisível no jogo. isTokenVisibleToViewer() (ver
// mais acima) é quem lê esta flag na hora de desenhar tokens; a lista de
// tokens filtra por ela também (ver renderTokenListPanel).
async function toggleTokenInvisible(tokenId) {
const tok = liveTokens[tokenId]; if (!tok) return;
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId)
.update({ invisible: !tok.invisible });
} catch (err) { console.error('Erro ao alternar invisibilidade do token:', err); }
}
async function adjustTokenAuraRadius(tokenId, delta) {
const tok = liveTokens[tokenId]; if (!tok) return;
const r = Math.max(0.5, Math.round(((tok.auraRadius || 2) + delta) * 10) / 10);
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId).update({ auraRadius: r });
} catch (err) { console.error('Erro ao ajustar raio da aura:', err); }
}
async function setTokenAuraRadius(tokenId, value) {
const tok = liveTokens[tokenId]; if (!tok) return;
if (isNaN(value)) { renderTokenListPanel(); return; } // valor inválido: repinta com o valor salvo
const r = Math.max(0.5, Math.round(value * 10) / 10);
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId).update({ auraRadius: r });
} catch (err) { console.error('Erro ao definir raio da aura:', err); }
}
async function toggleTokenVision(tokenId) {
const tok = liveTokens[tokenId]; if (!tok) return;
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId)
.update({ visionOn: !tokenHasVision(tok), visionRadius: tok.visionRadius || DEFAULT_VISION_RADIUS_CELLS });
} catch (err) { console.error('Erro ao alternar visão:', err); }
}
async function adjustTokenVisionRadius(tokenId, delta) {
const tok = liveTokens[tokenId]; if (!tok) return;
const r = Math.max(1, Math.round((tok.visionRadius || DEFAULT_VISION_RADIUS_CELLS) + delta));
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId).update({ visionRadius: r });
} catch (err) { console.error('Erro ao ajustar alcance de visão:', err); }
}
async function setTokenVisionRadius(tokenId, value) {
const tok = liveTokens[tokenId]; if (!tok) return;
if (isNaN(value)) { renderTokenListPanel(); return; } // valor inválido: repinta com o valor salvo
const r = Math.max(1, Math.round(value));
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId).update({ visionRadius: r });
} catch (err) { console.error('Erro ao definir alcance de visão:', err); }
}
// Visão no escuro / infravisão: alcance (em casas) que este token ainda
// enxerga fora de qualquer luz, numa cena marcada como "Escuridão real"
// (🌑) — ver DARK_SELF_RADIUS_CELLS e sceneIsDark em recomputeAndRenderVision.
// 0 é um valor válido (token sem infravisão nenhuma).
async function setTokenDarkRadius(tokenId, value) {
const tok = liveTokens[tokenId]; if (!tok) return;
if (isNaN(value)) { renderTokenListPanel(); return; }
const r = Math.max(0, Math.round(value * 2) / 2);
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId).update({ darkRadius: r });
} catch (err) { console.error('Erro ao definir visão no escuro:', err); }
}
async function toggleTokenVisionMode(tokenId) {
const tok = liveTokens[tokenId]; if (!tok) return;
const mode = tok.visionMode === 'cone' ? '360' : 'cone';
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId)
.update({ visionMode: mode, visionConeDeg: tok.visionConeDeg || DEFAULT_VISION_CONE_DEG });
} catch (err) { console.error('Erro ao alternar modo de visão:', err); }
}
async function adjustTokenVisionCone(tokenId, delta) {
const tok = liveTokens[tokenId]; if (!tok) return;
const deg = Math.min(359, Math.max(10, Math.round((tok.visionConeDeg || DEFAULT_VISION_CONE_DEG) + delta)));
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId).update({ visionConeDeg: deg });
} catch (err) { console.error('Erro ao ajustar o cone de visão:', err); }
}
async function setTokenVisionCone(tokenId, value) {
const tok = liveTokens[tokenId]; if (!tok) return;
const deg = Math.min(359, Math.max(10, Math.round(isFinite(value) ? value : DEFAULT_VISION_CONE_DEG)));
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId).update({ visionConeDeg: deg });
} catch (err) { console.error('Erro ao definir o cone de visão:', err); }
}
async function rotateToken(tokenId, delta) {
const tok = liveTokens[tokenId]; if (!tok) return;
const rot = ((tok.rot || 0) + delta + 360) % 360;
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId).update({ rot });
} catch (err) { console.error('Erro ao girar token:', err); }
}
// -------------------------------------------------- GIRAR SEGUINDO O CURSOR --
// Modo opcional, desligado por padrão e por token: enquanto ligado, o token
// aponta sozinho pra onde o mouse/dedo estiver sobre o mapa, sem precisar
// arrastar a alça de girar toda hora — útil pra mirar rápido antes de um
// ataque, por ex. É um estado só desta aba/sessão (não fica salvo no
// token nem sincronizado com outros jogadores) — cada um liga só nos
// próprios tokens (o Mestre, em qualquer um), e recarregar a página desliga
// de novo. Pode ser desligado a qualquer momento clicando de novo no botão.
let cursorFollowTokenIds = new Set();
function toggleTokenCursorFollow(tokenId) {
if (cursorFollowTokenIds.has(tokenId)) cursorFollowTokenIds.delete(tokenId);
else cursorFollowTokenIds.add(tokenId);
renderTokenListPanel();
if (typeof updateToolToolbarActive === 'function') updateToolToolbarActive();
}
// Mesmo alternador de cima, mas mirando o token selecionado no mapa (as
// alças de girar/redimensionar abertas nele) em vez de pedir o id — é o que
// o botão/atalho "T" da barra de Ferramentas usa, pra travar/destravar o
// giro no cursor sem precisar abrir a lista de tokens na lateral e achar o
// botão 🧭 lá dentro.
function toggleCursorFollowForSelectedToken() {
if (!selectedTokenId) return;
const tok = liveTokens[selectedTokenId];
if (!tok) return;
const canEdit = isTableOwner() || (curUser && tok.ownerId === curUser.uid);
if (!canEdit) return;
toggleTokenCursorFollow(selectedTokenId);
}
// Mesma ideia de throttle do broadcastLiveTokenPosition (ver mais abaixo):
// o cursor pode gerar dezenas de eventos por segundo, mas o Firestore não
// precisa de mais que ~11 escritas/seg pra parecer fluido (a transição CSS
// de rotate cobre o resto).
const LIVE_ROT_INTERVAL_MS = 90;
let liveRotLastSent = {}; // tokenId -> timestamp (ms) do último envio
let liveRotPending = {};  // tokenId -> ângulo mais recente ainda não enviado
let liveRotTimer = {};    // tokenId -> setTimeout agendado pra mandar o "pending"
function broadcastLiveTokenRotation(tokenId, rot) {
liveRotPending[tokenId] = rot;
const now = performance.now();
const last = liveRotLastSent[tokenId] || 0;
if (now - last >= LIVE_ROT_INTERVAL_MS) {
flushLiveTokenRotation(tokenId);
} else if (!liveRotTimer[tokenId]) {
liveRotTimer[tokenId] = setTimeout(() => flushLiveTokenRotation(tokenId), LIVE_ROT_INTERVAL_MS - (now - last));
}
}
function flushLiveTokenRotation(tokenId) {
if (liveRotTimer[tokenId]) { clearTimeout(liveRotTimer[tokenId]); liveRotTimer[tokenId] = null; }
const rot = liveRotPending[tokenId];
if (rot == null) return;
liveRotPending[tokenId] = null;
liveRotLastSent[tokenId] = performance.now();
db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId)
.update({ rot })
.catch(err => console.warn('Erro ao transmitir giro ao vivo do token:', err));
}
// Cancela qualquer giro "ao vivo" ainda pendente pra este token — chamado
// assim que o arrasto da alça termina, pra um envio atrasado do throttle
// não sobrescrever por engano o ângulo final logo depois dele ser salvo
// (mesma ideia de cancelLiveTokenPosition, ver mais abaixo).
function cancelLiveTokenRotation(tokenId) {
if (liveRotTimer[tokenId]) { clearTimeout(liveRotTimer[tokenId]); liveRotTimer[tokenId] = null; }
liveRotPending[tokenId] = null;
}
// Chamado a cada movimento do ponteiro sobre o tabuleiro (ver
// initCursorFollowTracking, ligado uma vez em mesa-init.js) — gira, em
// tempo real, todo token com o modo "seguir cursor" ligado.
function handleCursorFollowPointerMove(ev) {
if (cursorFollowTokenIds.size === 0) return;
const surface = document.getElementById('boardSurface');
if (!surface) return;
const rect = surface.getBoundingClientRect();
const canManage = isTableOwner();
cursorFollowTokenIds.forEach(tokenId => {
// Se o token estiver sendo arrastado (posição) ou com a alça de
// girar/redimensionar em uso, o modo automático fica pausado pra não
// brigar com esse outro gesto.
if (tokenId === draggingTokenId || tokenId === handleDraggingTokenId) return;
const tok = liveTokens[tokenId];
if (!tok) { cursorFollowTokenIds.delete(tokenId); return; } // token removido: desliga sozinho
const canEdit = canManage || tok.ownerId === curUser.uid;
if (!canEdit) { cursorFollowTokenIds.delete(tokenId); return; } // perdeu permissão: desliga sozinho
const cx = rect.left + tok.x * rect.width;
const cy = rect.top + tok.y * rect.height;
let angle = Math.atan2(ev.clientX - cx, -(ev.clientY - cy)) * 180 / Math.PI;
if (angle < 0) angle += 360;
applyLiveTokenVisual(tokenId, { rot: angle });
if (selectedTokenId === tokenId) updateSelectionHandles({ rot: angle });
if (tok.visionMode === 'cone') {
liveDragRotations[tokenId] = angle;
scheduleVisionRecompute();
}
broadcastLiveTokenRotation(tokenId, angle);
});
}
// Liga o acompanhamento do cursor — chamado uma só vez, no carregamento da
// página (ver mesa-init.js). O #boardWrap continua sendo o mesmo elemento
// entre trocas de cena/mapa, então um único listener já cobre a mesa
// inteira, sem precisar religar a cada renderBoardBackground.
function initCursorFollowTracking() {
const wrap = document.getElementById('boardWrap');
if (!wrap) return;
wrap.addEventListener('pointermove', handleCursorFollowPointerMove);
}
async function scaleToken(tokenId, delta) {
const tok = liveTokens[tokenId]; if (!tok) return;
const scale = Math.max(0.5, Math.round(((tok.scale || 1) + delta) * 100) / 100);
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId).update({ scale });
} catch (err) { console.error('Erro ao redimensionar token:', err); }
}
// Camada dos tokens (estilo Owlbear): cada token guarda um "z" próprio,
// só relevante quando dois tokens se sobrepõem no mapa (ex.: uma criatura
// grande cobrindo outra menor) — "trazer para frente" fica acima de todo
// mundo, "enviar para trás" fica abaixo de todo mundo.
async function bringTokenToFront(tokenId) {
const tok = liveTokens[tokenId]; if (!tok) return;
const maxZ = Object.values(liveTokens).reduce((m, t) => Math.max(m, t.z || 0), 0);
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId).update({ z: maxZ + 1 });
} catch (err) { console.error('Erro ao trazer token para frente:', err); }
}
async function sendTokenToBack(tokenId) {
const tok = liveTokens[tokenId]; if (!tok) return;
const minZ = Object.values(liveTokens).reduce((m, t) => Math.min(m, t.z || 0), 0);
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId).update({ z: minZ - 1 });
} catch (err) { console.error('Erro ao enviar token para trás:', err); }
}
// ------------------------------------------------------------ INICIATIVA --
// Rastreador de turnos. Antes era exclusivo do Mestre: só ele adicionava
// tokens e digitava o valor de cada um. Agora:
//   · cada jogador entra na própria iniciativa e rola o d20 direto daqui
//     (ou digita o valor, se preferir rolar com dado de verdade na mesa);
//   · o Mestre adiciona cada monstro manualmente (nome livre + modificador)
//     e rola por ele — um por um ou todos os que ainda estão sem valor;
//   · a rolagem aparece pra mesa inteira (balão sobre o tabuleiro +
//     histórico de dados), porque passa pela mesma coleção de rolagens.
// Entradas ligadas a um token usam o id do próprio token como id do
// documento — é isso que faz o selo ⚔ aparecer na lista "Fichas na mesa" e
// o contorno de "turno atual" no mapa. Monstros avulsos (sem token) ganham
// um id gerado.
function sortedInitiativeList() {
return Object.values(liveInitiative).sort((a, b) => {
const diff = (b.value || 0) - (a.value || 0);
if (diff) return diff;
// Empate: ordem alfabética só pra lista não ficar dançando a cada
// repintada (a ordem de Object.values não é estável entre snapshots).
return String(a.name || '').localeCompare(String(b.name || ''));
});
}
function initiativeRef() {
return db.collection('tables').doc(curTable.id).collection('initiative');
}
// Quem pode mexer numa entrada: o Mestre em qualquer uma; o jogador só na
// dele (campo "by" = uid de quem entrou na iniciativa). Entradas antigas,
// criadas antes deste campo existir, ficam só com o Mestre.
function canEditInitiativeEntry(e) {
return isTableOwner() || !!(e && curUser && e.by === curUser.uid);
}
function listenInitiative() {
initiativeUnsub = initiativeRef()
.onSnapshot(snap => {
liveInitiative = {};
activeInitiativeId = null;
initiativeRound = 1;
snap.forEach(d => {
if (d.id === '_active') {
activeInitiativeId = d.data().activeId || null;
initiativeRound = d.data().round || 1;
return;
}
liveInitiative[d.id] = { id: d.id, ...d.data() };
});
renderInitiativePanel();
renderAllTokens(); // atualiza o contorno de "turno atual" sobre os tokens
}, err => console.error('Erro ao sincronizar iniciativa:', err));
}
// Tokens que a pessoa logada pode colocar na iniciativa como "seu": os da
// cena atual que pertencem a ela (props ficam de fora — mesa/barril não
// rola iniciativa).
function myInitiativeCandidates() {
return Object.values(liveTokens)
.filter(t => isTokenInActiveScene(t) && !t.prop && curUser && t.ownerId === curUser.uid)
.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
}
async function addAllTokensToInitiative() {
const batch = db.batch();
let any = false;
Object.values(liveTokens).forEach(t => {
if (liveInitiative[t.id]) return;
if (!isTokenInActiveScene(t)) return; // NPC de outra cena: não faz parte deste combate
if (t.prop) return;                   // montaria/cenário não entra em combate
any = true;
batch.set(initiativeRef().doc(t.id), {
name: t.name || 'Token',
value: 0,
mod: 0,
// "by" = o dono do token, não quem clicou: assim o jogador consegue
// rolar a própria iniciativa mesmo quando foi o Mestre que montou a
// lista inteira de uma vez.
by: t.ownerId || (curUser && curUser.uid) || null,
tokenId: t.id,
kind: t.npc ? 'npc' : 'player'
});
});
if (!any) return;
try { await batch.commit(); } catch (err) { alert('Erro ao adicionar à iniciativa: ' + err.message); }
}
// Entra (ou atualiza) na iniciativa com um token próprio ou só com um nome.
async function upsertInitiativeEntry(opts) {
const id = opts.id || opts.tokenId || ('m_' + Math.random().toString(36).slice(2, 9));
const data = {
name: (opts.name || 'Sem nome').slice(0, 40),
by: (curUser && curUser.uid) || null,
tokenId: opts.tokenId || null,
kind: opts.kind || 'npc'
};
if (opts.mod !== undefined) data.mod = Math.max(-20, Math.min(20, Math.round(Number(opts.mod) || 0)));
if (opts.value !== undefined) data.value = Math.max(-99, Math.min(99, Math.round(Number(opts.value) || 0)));
if (opts.detail !== undefined) data.detail = opts.detail;
if (data.value === undefined && !liveInitiative[id]) data.value = 0;
try {
await initiativeRef().doc(id).set(data, { merge: true });
return id;
} catch (err) {
alert('Erro ao entrar na iniciativa: ' + err.message);
return null;
}
}
async function setInitiativeValue(id, value) {
const e = liveInitiative[id];
if (!canEditInitiativeEntry(e)) return;
const v = Math.max(-99, Math.min(99, Math.round(Number(value) || 0)));
try {
// detail:null limpa o rastro da rolagem anterior — o valor agora foi
// digitado à mão, então mostrar "d20[7] +2" ao lado seria mentira.
await initiativeRef().doc(id).set({ value: v, detail: null }, { merge: true });
} catch (err) { console.error('Erro ao ajustar iniciativa:', err); }
}
async function setInitiativeMod(id, mod) {
const e = liveInitiative[id];
if (!canEditInitiativeEntry(e)) return;
const m = Math.max(-20, Math.min(20, Math.round(Number(mod) || 0)));
try {
await initiativeRef().doc(id).set({ mod: m }, { merge: true });
} catch (err) { console.error('Erro ao ajustar modificador de iniciativa:', err); }
}
// Rola d20 + modificador para uma entrada: grava o valor na lista E publica
// a rolagem na mesa (balão + histórico), pra ninguém precisar acreditar no
// número de palavra.
async function rollInitiativeForEntry(id) {
const e = liveInitiative[id];
if (!e || !canEditInitiativeEntry(e)) return;
const res = rollInitiativeDice(e.mod || 0);
if (!res || res.error) return;
try {
await initiativeRef().doc(id).set({
value: res.total,
detail: res.detail
}, { merge: true });
} catch (err) {
alert('Erro ao registrar a iniciativa: ' + err.message);
return;
}
publishTableRoll(res, { label: `⚔ Iniciativa · ${e.name || 'Token'}` });
}
// Conveniência do Mestre: rola de uma vez por todos os que ainda estão
// zerados — numa cena com oito goblins, clicar 🎲 oito vezes é só trabalho.
async function rollMissingInitiatives() {
if (!isTableOwner()) return;
const pending = sortedInitiativeList().filter(e => !e.value);
if (!pending.length) return;
for (const e of pending) {
await rollInitiativeForEntry(e.id);
}
}
async function removeInitiativeEntry(id) {
const e = liveInitiative[id];
if (!canEditInitiativeEntry(e)) return;
try {
await initiativeRef().doc(id).delete();
if (activeInitiativeId === id && isTableOwner()) {
await initiativeRef().doc('_active').set({ activeId: null, round: initiativeRound || 1 });
}
} catch (err) { console.error('Erro ao remover da iniciativa:', err); }
}
async function clearInitiative() {
if (!isTableOwner()) return;
if (!confirm('Limpar toda a lista de iniciativa?')) return;
try {
const snap = await initiativeRef().get();
const batch = db.batch();
snap.forEach(d => batch.delete(d.ref));
await batch.commit();
} catch (err) { alert('Erro ao limpar iniciativa: ' + err.message); }
}
async function nextInitiativeTurn() {
if (!isTableOwner()) return;
const list = sortedInitiativeList();
if (!list.length) return;
const idx = list.findIndex(e => e.id === activeInitiativeId);
const nextIdx = (idx + 1) % list.length;
// Voltou pro começo da ordem = rodada nova. (Sem entrada ativa ainda, o
// primeiro clique começa a rodada 1 em vez de pular pra 2.)
const round = (idx >= 0 && nextIdx <= idx) ? (initiativeRound || 1) + 1 : (initiativeRound || 1);
try {
await initiativeRef().doc('_active').set({ activeId: list[nextIdx].id, round });
} catch (err) { console.error('Erro ao avançar turno:', err); }
}
async function resetInitiativeRounds() {
if (!isTableOwner()) return;
try {
await initiativeRef().doc('_active').set({ activeId: null, round: 1 });
} catch (err) { console.error('Erro ao reiniciar as rodadas:', err); }
}
// Atalho do painel de Dados: rola a SUA iniciativa sem precisar abrir o
// painel ⚔️. Reaproveita a entrada que você já tem (mantendo o modificador
// que estiver salvo lá); se ainda não estiver na ordem, entra com o seu
// primeiro token da cena — ou com o seu nome, se você não tiver token.
async function rollMyInitiativeQuick() {
const mine = Object.values(liveInitiative).find(e => curUser && e.by === curUser.uid && e.kind !== 'npc');
let id = mine ? mine.id : null;
if (!id) {
const tok = myInitiativeCandidates()[0] || null;
const name = tok ? (tok.name || 'Token') : (curProfile ? curProfile.name : 'Jogador');
id = await upsertInitiativeEntry({ tokenId: tok ? tok.id : null, name, mod: 0, kind: 'player' });
if (!id) return;
if (!liveInitiative[id]) liveInitiative[id] = { id, name, mod: 0, by: curUser.uid, kind: 'player' };
}
await rollInitiativeForEntry(id);
expandSidePanel('initiativePanel');
}
// O painel inteiro é redesenhado a cada snapshot da iniciativa (e um
// snapshot chega justamente quando alguém adiciona/rola algo). Sem guardar
// o que estava digitado, o Mestre perderia o nome do monstro no meio da
// digitação assim que outro jogador rolasse. Estes rascunhos vivem fora do
// DOM e são reaplicados na repintada; o foco também é devolvido ao campo
// que estava em uso.
let initDraft = { npcName: '', npcMod: '0', mineMod: null, mineValue: '' };
function renderInitiativePanel() {
const panel = document.getElementById('initiativePanel');
if (!panel) return;
const focusedId = (document.activeElement && panel.contains(document.activeElement))
? document.activeElement.id : null;
const isMaster = isTableOwner();
const list = sortedInitiativeList();
const myCandidates = myInitiativeCandidates();
// Entrada que já é "minha" na lista (pra o box de cima virar "atualizar"
// em vez de criar uma segunda entrada pra mesma pessoa).
const myEntry = list.find(e => curUser && e.by === curUser.uid && e.kind !== 'npc');
const rowsHtml = list.length
? list.map((e, i) => {
const mine = canEditInitiativeEntry(e);
const active = e.id === activeInitiativeId;
return `
<div class="init-row${active ? ' init-active' : ''}${e.kind === 'npc' ? ' is-npc' : ''}">
<span class="init-pos">${active ? '▶' : i + 1}</span>
<div class="init-ident">
<span class="init-name">${escapeHtml(e.name || 'Token')}</span>
${e.detail ? `<span class="init-detail">${escapeHtml(e.detail)}</span>` : ''}
</div>
<span class="init-val${active ? ' is-active' : ''}">${e.value || 0}</span>
${mine ? `
<div class="init-row-tools">
<input type="number" class="init-value" id="initVal_${e.id}" data-init-value="${e.id}" value="${e.value || 0}"
title="Valor da iniciativa (digite se rolou com dado de verdade)">
<button class="init-icon-btn" data-init-roll="${e.id}" title="Rolar d20 ${(e.mod || 0) >= 0 ? '+' : ''}${e.mod || 0} por esta entrada">🎲</button>
<button class="init-icon-btn danger" data-init-remove="${e.id}" title="Remover da iniciativa">✕</button>
</div>` : ''}
</div>`;
}).join('')
: `<div class="init-empty">Ninguém na iniciativa ainda.${isMaster ? ' Adicione os monstros abaixo e peça pros jogadores rolarem.' : ' Role a sua acima para entrar na ordem.'}</div>`;
// Caixa "sua iniciativa" — aparece pra qualquer pessoa da mesa (o Mestre
// também pode ter um personagem em campo).
const mineHtml = `
<div class="init-mine">
<div class="init-mine-label">${myEntry ? 'Sua iniciativa' : 'Entrar na iniciativa'}</div>
<div class="init-mine-row">
${myCandidates.length
? `<select id="initMineTarget" title="Com qual personagem você entra na ordem">
${myCandidates.map(t => `<option value="${t.id}"${myEntry && myEntry.tokenId === t.id ? ' selected' : ''}>${escapeHtml(t.name || 'Token')}</option>`).join('')}
</select>`
: `<input type="text" id="initMineName" maxlength="40" placeholder="Seu personagem"
value="${escapeHtml(myEntry ? (myEntry.name || '') : (curProfile ? curProfile.name : ''))}">`}
<input type="number" id="initMineMod" class="init-mod-input" value="${initDraft.mineMod !== null ? escapeHtml(initDraft.mineMod) : (myEntry ? (myEntry.mod || 0) : 0)}"
title="Modificador somado ao d20 (Destreza, traços etc.)">
<button class="btn small" id="initMineRollBtn" type="button" title="Rola d20 + modificador e entra na ordem">🎲 Rolar</button>
</div>
<div class="init-mine-row">
<input type="number" id="initMineValue" value="${escapeHtml(initDraft.mineValue)}" placeholder="ou digite o valor"
title="Use se você rolou com um dado de verdade na mesa">
<button class="btn secondary small" id="initMineSetBtn" type="button">Usar valor</button>
</div>
</div>`;
const masterHtml = isMaster ? `
<div class="init-master">
<div class="init-mine-label">Adicionar monstro</div>
<div class="init-mine-row">
<input type="text" id="initNpcName" maxlength="40" value="${escapeHtml(initDraft.npcName)}" placeholder="Nome (ex.: Goblin 1)">
<input type="number" id="initNpcMod" class="init-mod-input" value="${escapeHtml(initDraft.npcMod)}" title="Modificador de iniciativa deste monstro">
<button class="btn secondary small" id="initNpcAddBtn" type="button" title="Só adiciona à lista, sem rolar">+</button>
<button class="btn small" id="initNpcRollBtn" type="button" title="Adiciona e já rola a iniciativa dele">🎲</button>
</div>
<div class="init-master-actions">
<button class="btn-link" id="initAddAllBtn" title="Traz todos os tokens da cena atual para a lista, sem valor">+ Tokens da cena</button>
<button class="btn-link" id="initRollMissingBtn" title="Rola de uma vez por todos que ainda estão em 0">🎲 Rolar os que faltam</button>
<button class="btn-link" id="initClearBtn">Limpar</button>
</div>
</div>` : '';
panel.innerHTML = `
<h4>⚔️ Iniciativa</h4>
<div class="init-round-bar">
<span class="init-round">Rodada ${initiativeRound || 1}</span>
${isMaster ? `
<div class="init-round-tools">
<button class="btn small" id="initNextBtn" type="button">Próximo ▶</button>
<button class="btn-link" id="initResetRoundBtn" title="Volta para a rodada 1 sem apagar a lista">↺</button>
</div>` : ''}
</div>
${mineHtml}
<div id="initiativeBody" class="init-list">${rowsHtml}</div>
${masterHtml}`;
// --- Caixa "sua iniciativa" ---
const mineTargetEl = document.getElementById('initMineTarget');
const mineNameEl = document.getElementById('initMineName');
const mineModEl = document.getElementById('initMineMod');
function myEntryOpts() {
const tokenId = mineTargetEl ? mineTargetEl.value : null;
const tok = tokenId ? liveTokens[tokenId] : null;
return {
id: tokenId || (myEntry && !myEntry.tokenId ? myEntry.id : null),
tokenId: tokenId || null,
name: tok ? (tok.name || 'Token') : ((mineNameEl && mineNameEl.value.trim()) || (curProfile ? curProfile.name : 'Jogador')),
mod: mineModEl ? mineModEl.value : 0,
kind: 'player'
};
}
const mineRollBtn = document.getElementById('initMineRollBtn');
if (mineRollBtn) mineRollBtn.addEventListener('click', async () => {
const id = await upsertInitiativeEntry(myEntryOpts());
if (!id) return;
// A entrada pode ter acabado de ser criada e o snapshot ainda não ter
// voltado — garante que rollInitiativeForEntry encontre algo pra rolar.
if (!liveInitiative[id]) {
liveInitiative[id] = { id, name: myEntryOpts().name, mod: Number(mineModEl ? mineModEl.value : 0) || 0, by: curUser.uid };
}
await rollInitiativeForEntry(id);
});
const mineSetBtn = document.getElementById('initMineSetBtn');
if (mineSetBtn) mineSetBtn.addEventListener('click', async () => {
const valEl = document.getElementById('initMineValue');
if (!valEl || valEl.value === '') return;
const opts = myEntryOpts();
opts.value = valEl.value;
opts.detail = null;
await upsertInitiativeEntry(opts);
valEl.value = '';
initDraft.mineValue = '';
});
if (mineModEl && myEntry) {
mineModEl.addEventListener('change', () => setInitiativeMod(myEntry.id, mineModEl.value));
}
// Rascunhos: guarda o que está sendo digitado pra sobreviver à próxima
// repintada do painel.
if (mineModEl) mineModEl.addEventListener('input', () => { initDraft.mineMod = mineModEl.value; });
const mineValEl = document.getElementById('initMineValue');
if (mineValEl) mineValEl.addEventListener('input', () => { initDraft.mineValue = mineValEl.value; });
// --- Linhas da lista ---
panel.querySelectorAll('[data-init-value]').forEach(inp => {
inp.addEventListener('change', () => setInitiativeValue(inp.dataset.initValue, inp.value));
});
panel.querySelectorAll('[data-init-roll]').forEach(b => {
b.addEventListener('click', () => rollInitiativeForEntry(b.dataset.initRoll));
});
panel.querySelectorAll('[data-init-remove]').forEach(b => {
b.addEventListener('click', () => removeInitiativeEntry(b.dataset.initRemove));
});
// --- Ferramentas do Mestre ---
if (isMaster) {
document.getElementById('initNextBtn').addEventListener('click', nextInitiativeTurn);
document.getElementById('initResetRoundBtn').addEventListener('click', resetInitiativeRounds);
document.getElementById('initAddAllBtn').addEventListener('click', addAllTokensToInitiative);
document.getElementById('initRollMissingBtn').addEventListener('click', rollMissingInitiatives);
document.getElementById('initClearBtn').addEventListener('click', clearInitiative);
const npcNameEl = document.getElementById('initNpcName');
const npcModEl = document.getElementById('initNpcMod');
const addNpc = async (alsoRoll) => {
const name = (npcNameEl.value || '').trim();
if (!name) { npcNameEl.focus(); return; }
const mod = npcModEl.value;
const id = await upsertInitiativeEntry({ name, mod, kind: 'npc' });
if (!id) return;
if (alsoRoll) {
if (!liveInitiative[id]) liveInitiative[id] = { id, name, mod: Number(mod) || 0, by: curUser.uid };
await rollInitiativeForEntry(id);
}
// Numera sozinho pra sequência de monstros iguais: "Goblin 1" vira
// "Goblin 2" no próximo, sem redigitar o nome inteiro. Vai pro
// rascunho (e não só pro input) porque este painel é redesenhado
// assim que o snapshot da entrada nova chegar.
const m = name.match(/^(.*?)(\d+)$/);
initDraft.npcName = m ? `${m[1]}${Number(m[2]) + 1}` : name;
initDraft.npcMod = String(mod);
npcNameEl.value = initDraft.npcName;
npcNameEl.select();
};
document.getElementById('initNpcAddBtn').addEventListener('click', () => addNpc(false));
document.getElementById('initNpcRollBtn').addEventListener('click', () => addNpc(true));
npcNameEl.addEventListener('keydown', (ev) => {
if (ev.key === 'Enter') { ev.preventDefault(); addNpc(true); }
});
npcNameEl.addEventListener('input', () => { initDraft.npcName = npcNameEl.value; });
npcModEl.addEventListener('input', () => { initDraft.npcMod = npcModEl.value; });
}
// Devolve o foco pro campo que estava em uso antes da repintada (ex.: o
// Mestre cadastrando "Goblin 3" enquanto um jogador rola a iniciativa).
if (focusedId) {
const again = document.getElementById(focusedId);
if (again) {
again.focus();
if (again.select) again.select();
}
}
}
// -------------------------------------------------------- VER FICHA (modal) --
function openSheetModal(sheetId) {
if (!sheetId) return;
document.getElementById('sheetModalFrame').src = `ficha-view.html?id=${encodeURIComponent(sheetId)}`;
document.getElementById('sheetModalOverlay').classList.add('open');
}
function closeSheetModal() {
document.getElementById('sheetModalOverlay').classList.remove('open');
document.getElementById('sheetModalFrame').src = 'about:blank';
}
// Encaixa uma coordenada normalizada (0..1) no centro da célula de grade
// mais próxima, no eixo indicado. cellScreen é o tamanho da célula na tela
// (já com zoom aplicado); axisPx é a largura ou altura da mesa na tela.
function snapAxisToGrid(value, axisPx, cellScreen) {
if (!cellScreen) return value;
const px = value * axisPx;
const snappedPx = Math.floor(px / cellScreen) * cellScreen + cellScreen / 2;
return Math.min(1, Math.max(0, snappedPx / axisPx));
}
// -------------------------------------- MOVIMENTO EM TEMPO REAL (arrasto) --
// Antigamente o Firestore só era atualizado quando o jogador SOLTAVA o
// token — então, pra qualquer outra pessoa na mesa, o token "teleportava"
// direto pra posição final, sem mostrar o caminho percorrido. Aqui, durante
// o próprio arrasto, mandamos a posição em intervalos curtos (throttle),
// além da escrita final de sempre — assim todo mundo vê o token deslizando
// pelo mapa ao vivo, sem precisar encaixar numa casa da grade pra "existir"
// visualmente pros outros, igual ao Owlbear Rodeo. A posição transmitida
// aqui é sempre a bruta (sem encaixe de grade); o encaixe final continua
// acontecendo só ao soltar, como já era.
// Cada atualização troca só x/y (sem tocar em updatedAt nem em outros
// campos), pra manter o custo de escrita no Firestore o menor possível — o
// intervalo padrão (~11 atualizações/seg) já basta pra parecer fluido
// graças à transição CSS de left/top que os tokens já tinham (.token, em
// mesa.html). A transição (.12s) é um pouco mais longa que o intervalo
// (.09s) de propósito: absorve a variação natural de tempo entre um pacote
// e outro (rede, thread principal ocupada etc.) sem dar aquele
// "engasgadinho" de pausar esperando o próximo pacote chegar bem na hora.
// Se a mesa tiver muitos jogadores movendo token ao mesmo tempo e isso
// pesar na cota do Firestore, aumentar LIVE_MOVE_INTERVAL_MS é o primeiro
// ajuste a tentar (só lembrar de também ajustar a transição CSS junto, pra
// manter essa folga).
const LIVE_MOVE_INTERVAL_MS = 90;
let liveMoveLastSent = {}; // tokenId -> timestamp (ms) do último envio
let liveMovePending = {};  // tokenId -> {x,y} mais recente ainda não enviado
let liveMoveTimer = {};    // tokenId -> setTimeout agendado pra mandar o "pending"
function broadcastLiveTokenPosition(tokenId, x, y) {
liveMovePending[tokenId] = { x, y };
const now = performance.now();
const last = liveMoveLastSent[tokenId] || 0;
if (now - last >= LIVE_MOVE_INTERVAL_MS) {
flushLiveTokenPosition(tokenId);
} else if (!liveMoveTimer[tokenId]) {
liveMoveTimer[tokenId] = setTimeout(() => flushLiveTokenPosition(tokenId), LIVE_MOVE_INTERVAL_MS - (now - last));
}
}
function flushLiveTokenPosition(tokenId) {
if (liveMoveTimer[tokenId]) { clearTimeout(liveMoveTimer[tokenId]); liveMoveTimer[tokenId] = null; }
const pos = liveMovePending[tokenId];
if (!pos) return;
liveMovePending[tokenId] = null;
liveMoveLastSent[tokenId] = performance.now();
db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId)
.update({ x: pos.x, y: pos.y })
.catch(err => console.warn('Erro ao transmitir posição ao vivo do token:', err));
}
// Cancela qualquer atualização "ao vivo" ainda pendente pra este token —
// chamado assim que o arrasto termina, pra um envio atrasado do throttle
// não sobrescrever por engano a posição final (já encaixada na grade) logo
// depois dela ser salva.
function cancelLiveTokenPosition(tokenId) {
if (liveMoveTimer[tokenId]) { clearTimeout(liveMoveTimer[tokenId]); liveMoveTimer[tokenId] = null; }
liveMovePending[tokenId] = null;
}
// Quem pode arrastar/mexer neste token: o dono, o Mestre da mesa, ou
// qualquer pessoa presente quando é um prop/montaria (tok.prop === true) —
// props nascem soltos, sem dono de verdade, pra qualquer jogador colocar e
// mexer à vontade (ver addPropToken).
// Apaga de vez um ou mais tokens (Mestre only — mesma regra do botão 🗑️ na
// lista de tokens, só que dá pra acionar em lote pelo teclado depois de
// marcar vários com a ferramenta 🔲 Seleção múltipla ou Ctrl/Cmd+A). Não
// precisa limpar selectedTokenId/multiSelectedIds na mão: assim que o
// Firestore confirmar a remoção, o snapshot já cai em renderAllTokens, que
// solta sozinho qualquer seleção apontando pra um token que sumiu (ver
// comentário lá dentro).
function deleteTokensById(ids) {
if (!ids || !ids.length || !isTableOwner()) return;
Promise.all(ids.map(id =>
db.collection('tables').doc(curTable.id).collection('tokens').doc(id).delete()
)).catch(err => console.error('Erro ao apagar token(s):', err));
}
function canDragToken(tok) {
return !!(tok && (isTableOwner() || tok.ownerId === curUser.uid || tok.prop === true));
}
// Movimentação fina por teclado: com um token selecionado (alças abertas,
// ferramenta "Mover") ou um grupo marcado (ferramenta 🔲 Seleção múltipla),
// as setas do teclado deslocam ele(s) sem precisar do mouse — útil pra
// ajustes finos de posição em cima da grade. Passo pequeno (1/4 de casa)
// por padrão; segurar Shift desloca uma casa inteira de uma vez (o mesmo
// "salto" do encaixe na grade). Com um único token, ainda respeita paredes/
// portas fechadas (ver movementBlockedByWalls) — com um grupo, assim como no
// arrasto múltiplo do mouse, a colisão não é checada por membro. Devolve
// false quando não havia nada pra mover (o chamador então não deve "engolir"
// a tecla, deixando o navegador tratar a seta normalmente).
function nudgeSelectedTokens(dxCells, dyCells) {
const ids = (boardTool === 'select' && multiSelectedIds.size)
? Array.from(multiSelectedIds).filter(id => canDragToken(liveTokens[id]))
: (selectedTokenId && canDragToken(liveTokens[selectedTokenId]) ? [selectedTokenId] : []);
if (!ids.length) return false;
const dxN = (dxCells * boardCellPx) / baseMapW;
const dyN = (dyCells * boardCellPx) / baseMapH;
const updates = [];
ids.forEach(id => {
const t = liveTokens[id];
if (!t) return;
let x = Math.min(1, Math.max(0, t.x + dxN));
let y = Math.min(1, Math.max(0, t.y + dyN));
if (ids.length === 1 && typeof movementBlockedByWalls === 'function'
&& movementBlockedByWalls(t.x, t.y, x, y)) {
x = t.x; y = t.y;
}
if (x !== t.x || y !== t.y) updates.push({ id, x, y });
});
if (!updates.length) return true; // havia seleção; só não se moveu (ex.: parede bem em cima)
updates.forEach(u => broadcastLiveTokenPosition(u.id, u.x, u.y));
scheduleVisionRecompute();
Promise.all(updates.map(u =>
db.collection('tables').doc(curTable.id).collection('tokens').doc(u.id)
.update({ x: u.x, y: u.y, updatedAt: firebase.firestore.FieldValue.serverTimestamp() })
)).then(() => {
if (selectedTokenId && updates.some(u => u.id === selectedTokenId)) updateSelectionHandles();
}).catch(err => console.error('Erro ao mover token com o teclado:', err));
return true;
}
// Painel "🎯 Inspecionar" — aberto ao clicar num token que não é seu (ver
// o listener de 'click' em attachTokenDragHandlers). Mostra só o que um
// jogador mirando um alvo precisa ver: o desgaste de cada parte do corpo
// (em %, nunca o HP bruto) e as condições/status que ele está sofrendo no
// momento — nada de editar nada por aqui. Recalculado a cada renderização
// de tokens, então acompanha dano/cura e condições em tempo real; se o
// token inspecionado sumir (removido, trocou de cena, ficou invisível pra
// quem está olhando), o painel fecha sozinho.
function renderTokenInspectPanel() {
const panel = document.getElementById('tokenInspectPanel');
if (!panel) return;
const tok = inspectedTokenId ? liveTokens[inspectedTokenId] : null;
if (!tok || !isTokenInActiveScene(tok) || !isTokenVisibleToViewer(tok)) {
inspectedTokenId = null;
panel.classList.add('hidden');
panel.innerHTML = '';
return;
}
const parts = tokenPartsHpPercent(tok);
const armorParts = tokenPartsArmorPercent(tok);
const hasAnyHp = parts.some(p => p.pct !== null);
const hasAnyArmor = armorParts.some(p => p.pct !== null);
const conditions = Array.isArray(tok.conditions) ? tok.conditions : [];
panel.classList.remove('hidden');
panel.innerHTML = `
<div class="tip-head">
<span class="tip-name">${escapeHtml(tok.name || 'Alvo')}</span>
<button type="button" class="tip-close" data-tip-close title="Fechar">×</button>
</div>
${hasAnyHp ? `
<div class="tip-parts">
${parts.map(p => p.pct === null ? '' : `
<div class="tip-part">
<span class="tip-part-label">${p.label}</span>
<span class="tip-part-bar" title="${p.pct}%"><span class="tip-part-fill" style="width:${p.pct}%; background:${hpFractionColor(p.pct)};"></span></span>
<span class="tip-part-pct">${p.pct}%</span>
</div>`).join('')}
</div>` : `<div class="tip-empty">Sem HP configurado.</div>`}
${hasAnyArmor ? `
<div class="tip-parts tip-armor-parts">
${armorParts.map(p => p.pct === null ? '' : `
<div class="tip-part">
<span class="tip-part-label">🛡️ ${p.label}</span>
<span class="tip-part-bar" title="${p.pct}%"><span class="tip-part-fill" style="width:${p.pct}%; background:${p.broken ? '#c9564f' : hpFractionColor(p.pct)};"></span></span>
<span class="tip-part-pct">${p.broken ? 'quebrada' : p.pct + '%'}</span>
</div>`).join('')}
</div>` : ''}
${conditions.length ? `
<div class="tip-conds">
${conditions.map(c => `<span class="tip-cond-chip">${escapeHtml(c)}</span>`).join('')}
</div>` : ''}`;
const closeBtn = panel.querySelector('[data-tip-close]');
if (closeBtn) closeBtn.addEventListener('click', () => { inspectedTokenId = null; renderTokenInspectPanel(); });
}
// O painel fica dentro do board-wrap, que tem uma pilha de listeners de
// 'pointerdown' pra cada ferramenta (régua, desenho, porta, sala, template,
// pan/seleção — ver attachBoardInteractionHandlers e os attach*Handlers em
// mesa-tools.js). Sem isto, um clique no × (ou em qualquer parte do painel)
// borbulha pra esses listeners: o handler de pan, por exemplo, captura o
// ponteiro no wrap (wrap.setPointerCapture), o que faz o clique no botão
// nunca "fechar o ciclo" nele — o × parecia não fazer nada. Bloqueando a
// propagação aqui, nenhuma ferramenta do mapa por baixo do painel chega a
// ver o clique. Só precisa ser feito uma vez (o painel é sempre o mesmo
// elemento; só o innerHTML muda a cada renderização).
function attachTokenInspectPanelGuard() {
const panel = document.getElementById('tokenInspectPanel');
if (!panel || panel._guardAttached) return;
panel._guardAttached = true;
['pointerdown', 'pointerup', 'click', 'dblclick', 'contextmenu', 'wheel'].forEach(evt => {
panel.addEventListener(evt, (e) => e.stopPropagation());
});
}
function attachTokenDragHandlers(el, tokenId) {
// Clique num token que a pessoa NÃO pode arrastar (não é dono nem
// Mestre) — o pointerdown abaixo devolve cedo pra esses casos (deixa o
// evento passar pro pan do mapa por baixo), então é aqui, num listener
// de 'click' separado, que vira "mirar pra inspecionar": abre um
// painel só de leitura com HP por parte (em %) e condições/status do
// alvo. Tokens que a própria pessoa controla continuam abrindo as
// alças de girar/redimensionar de sempre (ver pointerup mais abaixo),
// sem passar por aqui.
el.addEventListener('click', (e) => {
if (boardTool !== 'pan' && boardTool !== 'select') return;
const tok = liveTokens[tokenId];
if (!tok || canDragToken(tok)) return;
e.stopPropagation();
inspectedTokenId = (inspectedTokenId === tokenId) ? null : tokenId;
renderTokenInspectPanel();
});
el.addEventListener('pointerdown', (e) => {
// Só arrasta o token quando a ferramenta ativa é "Mover" (padrão) ou
// "Seleção múltipla" — com régua/marcar/áreas/desenho/névoa ativas, o
// clique deve passar direto pro mapa por baixo (ver os "return" cedo
// nesses handlers em attachRulerHandlers/attachTemplateHandlers/etc.),
// senão não dava pra desenhar uma área ou medir distância bem em cima
// de um token sem primeiro arrastá-lo pro lado e devolver depois.
if (boardTool !== 'pan' && boardTool !== 'select') return;
const tok = liveTokens[tokenId];
if (!canDragToken(tok)) return;
e.preventDefault();
e.stopPropagation(); // não deixa o pointerdown "vazar" pro pan do mapa (board-wrap)
const isSelectMode = boardTool === 'select';
const surface = document.getElementById('boardSurface');
// localW/localH: tamanho natural do surface (sem zoom) — é nesse espaço
// que left/top do token são interpretados, já que o zoom é só visual
// (aplicado via transform no elemento pai).
const localW = surface.offsetWidth || baseMapW;
const localH = surface.offsetHeight || baseMapH;
// Grupo de tokens que serão movidos juntos: com a ferramenta de
// seleção múltipla ativa e este token fazendo parte de uma seleção com
// mais de 1 integrante, o arrasto move todos os selecionados que a
// pessoa realmente pode mexer, de uma vez, preservando a formação
// relativa entre eles — senão é só este token mesmo, como sempre.
const groupIds = (isSelectMode && multiSelectedIds.has(tokenId) && multiSelectedIds.size > 1)
? Array.from(multiSelectedIds).filter(id => canDragToken(liveTokens[id]))
: [tokenId];
draggingTokenId = tokenId;
el.classList.add('dragging');
el.setPointerCapture(e.pointerId);
const startClientX = e.clientX, startClientY = e.clientY;
// Um membro por token do grupo: elemento, aura (se tiver) e posição
// inicial — usados pra aplicar o mesmo delta de movimento a todos.
const members = groupIds.map(id => {
const t = liveTokens[id];
if (!t) return null;
const memberEl = id === tokenId ? el : tokenElCache[id];
if (!memberEl) return null;
const memberAuraEl = surface.querySelector(`.token-aura[data-aura-id="${id}"]`);
memberEl.classList.add('dragging');
if (memberAuraEl) memberAuraEl.classList.add('dragging');
return { id, el: memberEl, auraEl: memberAuraEl, startX: t.x, startY: t.y };
}).filter(Boolean);
const isGroupDrag = members.length > 1;
// O ponteiro pode disparar 'pointermove' bem mais rápido que a taxa de
// repintura da tela (mouse/caneta de alta taxa de amostragem) — em vez
// de escrever no DOM (e ler getBoundingClientRect, que força um
// recálculo de layout) a cada evento bruto, guarda só a posição mais
// recente e aplica no máximo uma vez por frame via requestAnimationFrame.
// O retângulo do tabuleiro também só é medido uma vez, no início do
// arrasto — arrastar um token não pode acontecer ao mesmo tempo que um
// pan/zoom do mapa (o pointerdown abaixo já bloqueia isso com
// stopPropagation), então ele não muda durante o arrasto.
const dragRect = surface.getBoundingClientRect();
let pendingMoveEv = null;
let moveRafId = null;
// Última posição válida (sem cruzar nenhuma parede/porta fechada) —
// serve de âncora pra testar colisão a cada frame do arrasto (ver
// movementBlockedByWalls, em mesa-tools.js). A colisão só é checada
// pelo token âncora (o que a pessoa está com o dedo/cursor em cima) —
// num arrasto em grupo, checar cada integrante travaria o grupo
// inteiro por causa de 1 canto de parede tocando só um deles.
let lastValidX = tok.x, lastValidY = tok.y;
const applyMove = () => {
moveRafId = null;
const ev = pendingMoveEv;
if (!ev) return;
let x = (ev.clientX - dragRect.left) / dragRect.width;
let y = (ev.clientY - dragRect.top) / dragRect.height;
x = Math.min(1, Math.max(0, x));
y = Math.min(1, Math.max(0, y));
// Paredes e portas fechadas travam o movimento bem em cima delas, sem
// deixar atravessar — segurando Alt/Option (mesmo atalho que já solta
// o token sem encaixar na grade) o token ignora a colisão, caso
// precise passar por cima mesmo assim.
if (!isGroupDrag && !ev.altKey && typeof movementBlockedByWalls === 'function'
&& movementBlockedByWalls(lastValidX, lastValidY, x, y)) {
return;
}
lastValidX = x; lastValidY = y;
const dxN = x - tok.x, dyN = y - tok.y; // delta em relação à posição inicial do token âncora
members.forEach(m => {
const mx = Math.min(1, Math.max(0, m.startX + dxN));
const my = Math.min(1, Math.max(0, m.startY + dyN));
m.el.style.left = (mx * localW) + 'px';
m.el.style.top = (my * localH) + 'px';
if (m.auraEl) {
m.auraEl.style.left = (mx * localW) + 'px';
m.auraEl.style.top = (my * localH) + 'px';
}
m.el._lastX = mx; m.el._lastY = my;
m.el._freePlace = ev.altKey; // segurar Alt/Option solta sem encaixar na grade
broadcastLiveTokenPosition(m.id, mx, my); // outros jogadores veem o token deslizando, em tempo real
liveDragPositions[m.id] = { x: mx, y: my }; // a própria visão (névoa) acompanha o token suavemente, sem esperar o Firestore
});
scheduleVisionRecompute();
};
const move = (ev) => {
pendingMoveEv = ev;
if (moveRafId == null) moveRafId = requestAnimationFrame(applyMove);
};
const up = async (ev) => {
el.removeEventListener('pointermove', move);
el.removeEventListener('pointerup', up);
el.removeEventListener('pointercancel', up);
// Garante que a posição do último evento ainda não aplicado (preso
// esperando o próximo frame) não se perca ao soltar o token.
if (moveRafId != null) { cancelAnimationFrame(moveRafId); moveRafId = null; applyMove(); }
members.forEach(m => {
m.el.classList.remove('dragging');
if (m.auraEl) m.auraEl.classList.remove('dragging');
cancelLiveTokenPosition(m.id); // a escrita final abaixo já cobre a posição; evita um envio atrasado sobrescrevê-la
delete liveDragPositions[m.id]; // a partir daqui, a visão volta a seguir a posição confirmada no Firestore
});
draggingTokenId = null;
// Um clique simples (quase sem arrastar) seleciona/deseleciona o
// token em vez de mover. Na ferramenta "Mover" (padrão), abre as
// alças de girar/redimensionar direto sobre ele, no estilo Owlbear
// Rodeo; na ferramenta de seleção múltipla, marca/desmarca o token no
// grupo. No toque o limiar é maior que no mouse (dedo treme mais que
// um cursor), senão um simples "tap" pra selecionar acaba sendo lido
// como um micro-arrasto e desloca o token por engano.
const moved = Math.hypot(ev.clientX - startClientX, ev.clientY - startClientY);
const tapThreshold = ev.pointerType === 'touch' ? 14 : 6;
if (moved < tapThreshold) {
if (isSelectMode) {
if (multiSelectedIds.has(tokenId)) multiSelectedIds.delete(tokenId); else multiSelectedIds.add(tokenId);
renderAllTokens();
scheduleVisionRecompute();
return;
}
const wasSelected = selectedTokenId === tokenId;
selectedTokenId = wasSelected ? null : tokenId;
// Além das alças de girar/redimensionar, também abre o painel "🎯
// Inspecionar" pro próprio token selecionado (ou, sendo Mestre,
// pro token de qualquer um) — antes o painel só aparecia pra
// tokens que a pessoa NÃO controla. Selecionar de novo o mesmo
// token fecha as duas coisas juntas; só limpa o painel se era
// este token mesmo que estava inspecionado (não mexe se a pessoa
// tinha outro alvo aberto por outro caminho).
if (wasSelected) {
if (inspectedTokenId === tokenId) inspectedTokenId = null;
} else {
inspectedTokenId = tokenId;
}
renderTokenListPanel();
updateSelectionHandles();
renderTokenInspectPanel();
scheduleVisionRecompute();
if (typeof updateToolToolbarActive === 'function') updateToolToolbarActive();
return;
}
if (el._lastX === undefined) { scheduleVisionRecompute(); return; }
// Em arrasto de grupo, encaixa só o token âncora (o que a pessoa
// realmente segurou) na grade e reaplica o MESMO desvio de
// arredondamento pros outros membros — em vez de cada um arredondar
// pro seu próprio centro de célula mais próximo, o que podia
// embaralhar a formação (dois tokens vizinhos "grudarem" na mesma
// célula, por exemplo). Assim o grupo sempre chega inteiro, exatamente
// como estava antes de soltar o mouse, só "colado" na grade pelo
// âncora.
let anchorSnapDx = 0, anchorSnapDy = 0;
if (isGroupDrag && snapToGrid) {
const anchorMember = members.find(m => m.id === tokenId);
if (anchorMember && anchorMember.el._lastX !== undefined && !anchorMember.el._freePlace) {
const rawAX = anchorMember.el._lastX, rawAY = anchorMember.el._lastY;
anchorSnapDx = snapAxisToGrid(rawAX, localW, boardCellPx) - rawAX;
anchorSnapDy = snapAxisToGrid(rawAY, localH, boardCellPx) - rawAY;
}
}
const updates = [];
members.forEach(m => {
if (m.el._lastX === undefined) return;
let finalX = m.el._lastX, finalY = m.el._lastY;
const shouldSnap = snapToGrid && !m.el._freePlace;
if (shouldSnap) {
if (isGroupDrag) {
finalX = Math.min(1, Math.max(0, finalX + anchorSnapDx));
finalY = Math.min(1, Math.max(0, finalY + anchorSnapDy));
} else {
finalX = snapAxisToGrid(finalX, localW, boardCellPx);
finalY = snapAxisToGrid(finalY, localH, boardCellPx);
}
// O encaixe na grade pode "puxar" o token âncora pra dentro de
// uma parede que estava logo ali do lado (a posição bruta, sem
// encaixe, já era válida — só o arredondamento pro centro da
// célula que passou do ponto) — nesse caso, mantém a posição
// bruta em vez do encaixe. Só verificado no âncora (ver nota da
// colisão em applyMove acima).
if (m.id === tokenId && !isGroupDrag && !m.el._freePlace && typeof movementBlockedByWalls === 'function'
&& movementBlockedByWalls(lastValidX, lastValidY, finalX, finalY)) {
finalX = lastValidX; finalY = lastValidY;
}
m.el.style.left = (finalX * localW) + 'px';
m.el.style.top = (finalY * localH) + 'px';
}
updates.push({ id: m.id, x: finalX, y: finalY });
});
scheduleVisionRecompute(); // atualiza já com a posição encaixada, sem esperar o Firestore confirmar
try {
await Promise.all(updates.map(u =>
db.collection('tables').doc(curTable.id).collection('tokens').doc(u.id)
.update({ x: u.x, y: u.y, updatedAt: firebase.firestore.FieldValue.serverTimestamp() })
));
if (selectedTokenId === tokenId) updateSelectionHandles();
} catch (err) {
console.error('Erro ao salvar posição do token:', err);
}
};
el.addEventListener('pointermove', move);
el.addEventListener('pointerup', up);
el.addEventListener('pointercancel', up);
});
}
// -------------------------------------------------- ALÇAS DO TOKEN (owlbear) --
// Ao selecionar um token (clique simples nele), aparecem duas alças por
// cima dele: uma para girar (arrasta em volta) e outra para redimensionar
// (arrasta pra fora/dentro) — exatamente como no Owlbear Rodeo, em vez de
// só botões +/− numa lista ao lado. Cada jogador só vê/mexe nas alças do
// próprio token; o Mestre pode usar as de qualquer um.
function getSelectionHandleGeometry(tok, overrides) {
const scale = (overrides && overrides.scale != null) ? overrides.scale : (tok.scale || 1);
const rot = (overrides && overrides.rot != null) ? overrides.rot : (tok.rot || 0);
const tokenPx = Math.max(8, Math.round(boardCellPx * scale));
return { tokenPx, rot, scale };
}
function updateSelectionHandles(overrides) {
const surface = document.getElementById('boardSurface');
if (!surface) return;
const tok = selectedTokenId ? liveTokens[selectedTokenId] : null;
const canEdit = tok && curProfile && (isTableOwner() || tok.ownerId === curUser.uid);
let wrap = document.getElementById('tokenHandles');
if (!tok || !canEdit) {
if (wrap) wrap.remove();
return;
}
if (!wrap) {
wrap = document.createElement('div');
wrap.id = 'tokenHandles';
wrap.className = 'token-handles';
wrap.innerHTML = `
<div class="token-select-ring"></div>
<div class="token-handle handle-rotate" title="Arrastar para girar (segure Shift para girar em passos de 15°)">⟳</div>
<div class="token-handle handle-resize" title="Arrastar para redimensionar">⤡</div>`;
surface.appendChild(wrap);
attachHandleDragHandlers(wrap);
}
const { tokenPx, rot } = getSelectionHandleGeometry(tok, overrides);
wrap.style.left = (tok.x * baseMapW) + 'px';
wrap.style.top = (tok.y * baseMapH) + 'px';
const ring = wrap.querySelector('.token-select-ring');
const ringPx = tokenPx + 10;
ring.style.width = ringPx + 'px';
ring.style.height = ringPx + 'px';
ring.style.marginLeft = (-ringPx / 2) + 'px';
ring.style.marginTop = (-ringPx / 2) + 'px';
const rotR = tokenPx / 2 + 26;
const rad = rot * Math.PI / 180;
const rotateHandle = wrap.querySelector('.handle-rotate');
rotateHandle.style.left = (Math.sin(rad) * rotR) + 'px';
rotateHandle.style.top = (-Math.cos(rad) * rotR) + 'px';
const resizeR = (tokenPx / 2) * Math.SQRT1_2;
const resizeHandle = wrap.querySelector('.handle-resize');
resizeHandle.style.left = resizeR + 'px';
resizeHandle.style.top = resizeR + 'px';
}
// Aplica visualmente (sem esperar o Firestore) o novo tamanho/rotação
// enquanto a alça está sendo arrastada — igual ao arrasto de posição.
function applyLiveTokenVisual(tokenId, overrides) {
const surface = document.getElementById('boardSurface');
if (!surface) return;
const el = surface.querySelector(`.token[data-id="${tokenId}"]`);
const tok = liveTokens[tokenId];
if (!el || !tok) return;
if (overrides.scale != null) {
const tokenPx = Math.max(8, Math.round(boardCellPx * overrides.scale));
el.style.width = tokenPx + 'px';
el.style.height = tokenPx + 'px';
el.style.marginLeft = (-tokenPx / 2) + 'px';
el.style.marginTop = (-tokenPx / 2) + 'px';
const auraEl = surface.querySelector(`.token-aura[data-aura-id="${tokenId}"]`);
if (auraEl && tok.auraOn) {
const auraPx = tokenPx + Math.round((tok.auraRadius || 2) * 2 * boardCellPx);
auraEl.style.width = auraPx + 'px';
auraEl.style.height = auraPx + 'px';
auraEl.style.marginLeft = (-auraPx / 2) + 'px';
auraEl.style.marginTop = (-auraPx / 2) + 'px';
}
}
if (overrides.rot != null) {
el.querySelectorAll('img, .token-ph').forEach(n => { n.style.transform = `rotate(${overrides.rot}deg)`; });
}
}
function attachHandleDragHandlers(wrap) {
const rotateHandle = wrap.querySelector('.handle-rotate');
const resizeHandle = wrap.querySelector('.handle-resize');
rotateHandle.addEventListener('pointerdown', (e) => {
e.preventDefault(); e.stopPropagation();
const tokenId = selectedTokenId;
const tok = liveTokens[tokenId];
if (!tok) return;
handleDraggingTokenId = tokenId;
rotateHandle.setPointerCapture(e.pointerId);
const surface = document.getElementById('boardSurface');
const rect = surface.getBoundingClientRect(); // medido uma vez só — não muda durante o giro
let liveRot = tok.rot || 0;
const move = (ev) => {
const cx = rect.left + tok.x * rect.width;
const cy = rect.top + tok.y * rect.height;
let angle = Math.atan2(ev.clientX - cx, -(ev.clientY - cy)) * 180 / Math.PI;
if (angle < 0) angle += 360;
if (ev.shiftKey) angle = Math.round(angle / 15) * 15 % 360; // Shift: girar em passos de 15°
liveRot = angle;
applyLiveTokenVisual(tokenId, { rot: liveRot });
updateSelectionHandles({ rot: liveRot });
// Se este token enxerga em cone, o cone acompanha o giro ao vivo, sem
// esperar o Firestore confirmar o novo ângulo (mesma ideia da posição
// durante o arrasto — ver liveDragPositions).
if (tok.visionMode === 'cone') {
liveDragRotations[tokenId] = liveRot;
scheduleVisionRecompute();
}
// Transmite o giro ao vivo pro Firestore (com throttle), do mesmo
// jeito que "girar seguindo o cursor" já fazia — assim todo mundo na
// mesa vê o token virando em tempo real enquanto a alça é arrastada,
// em vez de só ver o resultado final ao soltar.
broadcastLiveTokenRotation(tokenId, liveRot);
};
const up = async () => {
rotateHandle.removeEventListener('pointermove', move);
rotateHandle.removeEventListener('pointerup', up);
rotateHandle.removeEventListener('pointercancel', up);
handleDraggingTokenId = null;
delete liveDragRotations[tokenId];
cancelLiveTokenRotation(tokenId); // a escrita final abaixo já cobre o ângulo; evita um envio atrasado sobrescrevê-la
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId).update({ rot: liveRot });
} catch (err) { console.error('Erro ao girar token:', err); }
};
rotateHandle.addEventListener('pointermove', move);
rotateHandle.addEventListener('pointerup', up);
rotateHandle.addEventListener('pointercancel', up);
});
resizeHandle.addEventListener('pointerdown', (e) => {
e.preventDefault(); e.stopPropagation();
const tokenId = selectedTokenId;
const tok = liveTokens[tokenId];
if (!tok) return;
handleDraggingTokenId = tokenId;
resizeHandle.setPointerCapture(e.pointerId);
const surface = document.getElementById('boardSurface');
const scale0 = tok.scale || 1;
const rect0 = surface.getBoundingClientRect();
const cx0 = rect0.left + tok.x * rect0.width;
const cy0 = rect0.top + tok.y * rect0.height;
const dist0 = Math.max(1, Math.hypot(e.clientX - cx0, e.clientY - cy0));
let liveScale = scale0;
const move = (ev) => {
const cx = cx0, cy = cy0;
const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy);
let scale = scale0 * (dist / dist0);
scale = Math.max(0.5, Math.round(scale * 20) / 20);
liveScale = scale;
applyLiveTokenVisual(tokenId, { scale: liveScale });
updateSelectionHandles({ scale: liveScale });
};
const up = async () => {
resizeHandle.removeEventListener('pointermove', move);
resizeHandle.removeEventListener('pointerup', up);
resizeHandle.removeEventListener('pointercancel', up);
handleDraggingTokenId = null;
try {
await db.collection('tables').doc(curTable.id).collection('tokens').doc(tokenId).update({ scale: liveScale });
} catch (err) { console.error('Erro ao redimensionar token:', err); }
};
resizeHandle.addEventListener('pointermove', move);
resizeHandle.addEventListener('pointerup', up);
resizeHandle.addEventListener('pointercancel', up);
});
}
function attachBoardDragHandlers() {
// Placeholder para futura interação direta com o fundo (ex.: medir distâncias).
// Hoje o arrasto acontece nos próprios tokens (attachTokenDragHandlers).
}
// -------------------------------------------------------- MAPA DO MESTRE --
function renderMasterMapPanel() {
const panel = document.getElementById('masterMapPanel');
if (!isTableOwner()) { panel.innerHTML = ''; panel.classList.add('hidden'); return; }
panel.classList.remove('hidden');
const scene = getActiveScene();
const biomeOptions = Object.keys(MAPGEN_BIOME_LABELS)
.map(id => `<option value="${id}">${escapeHtml(MAPGEN_BIOME_LABELS[id])}</option>`).join('');
const sizeOptions = Object.keys(MAPGEN_SIZES)
.map(id => `<option value="${id}"${id === 'medio' ? ' selected' : ''}>${escapeHtml(MAPGEN_SIZE_LABELS[id] || id)}</option>`).join('');
panel.innerHTML = `
<h4>🗺️ Mapa da cena atual${scene ? ' — ' + escapeHtml(scene.name || '') : ''}</h4>
<h4 style="font-size:13px; margin-top:-6px;">Gerar mapa procedural</h4>
<div class="field">
<select id="mapBiome">${biomeOptions}</select>
</div>
<div class="field">
<select id="mapSize">${sizeOptions}</select>
</div>
<button class="btn small" id="genMapBtn" style="width:auto;">Gerar novo mapa</button>
<button class="btn secondary small hidden" id="regenSameBtn" style="width:auto; margin-top:8px;">🎲 Gerar outra variação</button>
<div class="tc-meta" style="margin-top:8px;">Gerar um novo mapa não move nem apaga os tokens já na mesa — e afeta só a cena atual.</div>
<div class="error-msg hidden" id="mapErr"></div>
<hr class="tool-hr">
<h4>Ou envie um mapa seu</h4>
<div class="field">
<input type="file" id="mapUploadFile" accept="image/*">
</div>
<div class="map-upload-row">
<span class="tc-meta">Nº de colunas da grade:</span>
<input type="number" id="mapUploadCols" value="20" min="4" max="120" style="width:70px;">
</div>
<button class="btn secondary small" id="mapUploadBtn" style="width:auto;">Enviar mapa</button>
<div class="tc-meta" style="margin-top:8px;">A grade é desenhada por cima da sua imagem, no número de colunas escolhido, pra encaixar os tokens certinho.</div>
<div class="error-msg hidden" id="mapUploadErr"></div>`;
document.getElementById('genMapBtn').addEventListener('click', () => generateAndSaveMap());
document.getElementById('regenSameBtn').addEventListener('click', () => generateAndSaveMap());
if (scene && scene.biome) document.getElementById('regenSameBtn').classList.remove('hidden');
document.getElementById('mapUploadBtn').addEventListener('click', () => uploadCustomMap());
}
async function generateAndSaveMap() {
const biome = document.getElementById('mapBiome').value;
const size = document.getElementById('mapSize').value;
const errEl = document.getElementById('mapErr');
const scene = getActiveScene();
if (!scene) return;
try {
const map = mapgenGenerate({ size, biome, seed: Math.floor(Math.random() * 1e9) });
await db.collection('tables').doc(curTable.id).collection('scenes').doc(scene.id).update({
mapImage: map.dataUrl, mapW: map.width, mapH: map.height, cellPx: map.cellPx, biome
});
// Contorna a área de piso do mapa recém-gerado com paredes de bloqueio
// de visão automaticamente — ver regenerateWallsFromGrid, em
// mesa-tools.js (também some com paredes/portas/luzes/memória da
// geração anterior, que não fazem mais sentido no layout novo).
if (map.grid) {
await regenerateWallsFromGrid(scene.id, map.grid, map.cols, map.rows);
}
document.getElementById('regenSameBtn').classList.remove('hidden');
boardZoom = 1;
setTimeout(fitBoardToScreen, 60);
errEl.classList.add('hidden');
} catch (err) {
errEl.textContent = 'Erro ao gerar/salvar mapa: ' + err.message;
errEl.classList.remove('hidden');
}
}
// Lê uma imagem escolhida pelo Mestre, desenha uma grade por cima (no
// mesmo espírito visual dos mapas procedurais) e devolve um dataURL já
// dentro do orçamento de tamanho do Firestore (reaproveita
// mapgenEncodeWithBudget, de js/mapgen.js).
function readCustomMapFile(file, cols) {
return new Promise((resolve, reject) => {
if (!file.type.startsWith('image/')) { reject(new Error('Escolha um arquivo de imagem válido.')); return; }
const reader = new FileReader();
reader.onload = (e) => {
const img = new Image();
img.onload = () => {
const safeCols = Math.max(4, Math.min(120, Math.round(cols) || 20));
const cellPx = Math.max(16, Math.round(img.width / safeCols));
const rows = Math.max(1, Math.round(img.height / cellPx));
const canvas = document.createElement('canvas');
canvas.width = safeCols * cellPx;
canvas.height = rows * cellPx;
const ctx = canvas.getContext('2d');
ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
ctx.strokeStyle = 'rgba(20,16,12,0.4)';
ctx.lineWidth = 1;
for (let x = 0; x <= safeCols; x++) {
ctx.beginPath(); ctx.moveTo(x * cellPx + .5, 0); ctx.lineTo(x * cellPx + .5, canvas.height); ctx.stroke();
}
for (let y = 0; y <= rows; y++) {
ctx.beginPath(); ctx.moveTo(0, y * cellPx + .5); ctx.lineTo(canvas.width, y * cellPx + .5); ctx.stroke();
}
resolve({
dataUrl: mapgenEncodeWithBudget(canvas),
width: canvas.width, height: canvas.height, cellPx
});
};
img.onerror = () => reject(new Error('Não foi possível ler essa imagem.'));
img.src = e.target.result;
};
reader.onerror = () => reject(new Error('Não foi possível ler esse arquivo.'));
reader.readAsDataURL(file);
});
}
async function uploadCustomMap() {
const fileEl = document.getElementById('mapUploadFile');
const colsEl = document.getElementById('mapUploadCols');
const errEl = document.getElementById('mapUploadErr');
const scene = getActiveScene();
if (!scene) return;
if (!fileEl.files || !fileEl.files[0]) {
errEl.textContent = 'Escolha uma imagem primeiro.';
errEl.classList.remove('hidden');
return;
}
try {
const map = await readCustomMapFile(fileEl.files[0], parseInt(colsEl.value, 10));
await db.collection('tables').doc(curTable.id).collection('scenes').doc(scene.id).update({
mapImage: map.dataUrl, mapW: map.width, mapH: map.height, cellPx: map.cellPx, biome: ''
});
fileEl.value = '';
boardZoom = 1;
setTimeout(fitBoardToScreen, 60);
errEl.classList.add('hidden');
} catch (err) {
errEl.textContent = 'Erro ao enviar mapa: ' + err.message;
errEl.classList.remove('hidden');
}
}

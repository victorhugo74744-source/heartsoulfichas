function validateAll() {
const errors = [];
if (!state.characterName.trim()) errors.push('Dê um nome ao personagem.');
const dcActive = typeof isDeadlyCardsActive === 'function' && isDeadlyCardsActive();
if (!state.energyType) errors.push(dcActive ? 'Energia (Porcentagem) não definida — recarregue a página.' : 'Escolha uma energia (Aura, Mana ou Fé).');
if (attrPoolSpent() > attrPoolMax()) errors.push('Você gastou mais pontos de atributo do que tem.');
if (skillPoolSpent() > skillPoolMax()) errors.push('Você gastou mais pontos de perícia do que tem.');
if (state.skills.some(s => s.points > skillCapPerSkill())) errors.push(`Nenhuma perícia pode ultrapassar +${skillCapPerSkill()} no seu nível atual.`);
if (!dcActive) {
if (!state.raceId) errors.push('Escolha uma raça.');
else if (state.raceOptionalChosen.length !== 2) errors.push('Escolha exatamente 2 traços raciais opcionais.');
else {
const raceCheck = DATA.races.find(r => r.id === state.raceId);
if (raceCheck && raceCheck.variantChoice && (state.raceVariantChosen === null || state.raceVariantChosen === undefined)) {
errors.push(`Escolha uma opção em "${raceCheck.variantChoice.label}".`);
}
}
}
if (traitPoolSpent() > traitPoolMax()) errors.push('Você gastou mais pontos de traço do que tem.');
if (!dcActive && !hasMalignTrait()) errors.push('Escolha ao menos 1 Traço Maligno.');
return errors;
}
function renderLineList(containerId, items, onChange) {
const box = document.getElementById(containerId);
if (!box) return;
if (!items.length) items.push('');
box.innerHTML = items.map((val, i) => `
<div class="line-list-item">
<input type="text" data-line="${i}" value="${escapeHtml(val)}">
<button type="button" class="skill-remove" data-line-remove="${i}" ${items.length <= 1 ? 'style="visibility:hidden;"' : ''}>✕</button>
</div>`).join('') + `<button type="button" class="btn secondary small line-list-add" data-add-line style="width:auto;">+ Adicionar linha</button>`;
box.querySelectorAll('input[data-line]').forEach(inp => {
inp.addEventListener('input', () => {
items[parseInt(inp.dataset.line)] = inp.value;
onChange && onChange();
});
inp.addEventListener('keydown', (e) => {
if (e.key === 'Enter') {
e.preventDefault();
items.push('');
renderLineList(containerId, items, onChange);
const nextInputs = box.querySelectorAll('input[data-line]');
nextInputs[nextInputs.length - 1].focus();
}
});
});
box.querySelectorAll('[data-line-remove]').forEach(btn => {
btn.addEventListener('click', () => {
if (items.length <= 1) return;
items.splice(parseInt(btn.dataset.lineRemove), 1);
renderLineList(containerId, items, onChange);
});
});
box.querySelector('[data-add-line]').addEventListener('click', () => {
items.push('');
renderLineList(containerId, items, onChange);
const nextInputs = box.querySelectorAll('input[data-line]');
nextInputs[nextInputs.length - 1].focus();
});
}
function cleanLineList(items) {
const cleaned = items.map(s => s.trim()).filter(s => s.length > 0);
return cleaned;
}
function autoExpandTextarea(el) {
el.style.height = 'auto';
el.style.height = el.scrollHeight + 'px';
}
const CONSUMABLE_EFFECT_TYPES = [
['cura', '💚 Cura'], ['dano', '⚔️ Dano'], ['buff', '✨ Buff'], ['debuff', '☠️ Debuff'],
['estamina', '🏃 Recuperar Estamina'], ['energia', '⚡ Recuperar Energia']
];
const ARMOR_PARTS_LIST = [
['cabeca', '🪖 Cabeça'], ['tronco', '🎽 Tronco'],
['braco_esq', '💪 Braço Esq.'], ['braco_dir', '💪 Braço Dir.'],
['perna_esq', '🥾 Perna Esq.'], ['perna_dir', '🥾 Perna Dir.']
];
function ensureInventoryItemShape(it) {
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
function recalcArmorResources() {
if (!state.resources) return;
if (!state.resources.armor) state.resources.armor = emptyResources().armor;
const totals = { cabeca: 0, tronco: 0, braco_esq: 0, braco_dir: 0, perna_esq: 0, perna_dir: 0 };
(state.inventoryItems || []).forEach(it => {
if (!it || !it.armor || !it.armorEquipped) return;
ARMOR_PARTS_LIST.forEach(([k]) => { totals[k] += parseInt((it.armorParts || {})[k], 10) || 0; });
});
ARMOR_PARTS_LIST.forEach(([k]) => {
const cur = state.resources.armor[k];
if (!cur || cur.max !== totals[k]) state.resources.armor[k] = { max: totals[k], cur: totals[k] };
});
}
function initInventoryUI() {
const box = document.getElementById('fInventory');
if (!box) return;
if (!state.inventoryItems || !state.inventoryItems.length) state.inventoryItems = [{ name: '', weight: 0, qty: 1, consumable: false, effectType: '', effectValue: '', effectDesc: '', armor: false, armorEquipped: false, armorParts: {} }];
state.inventoryItems = state.inventoryItems.map(ensureInventoryItemShape);
recalcArmorResources();
renderInventoryUI();
renderArmorParts();
}
function renderInventoryUI() {
const box = document.getElementById('fInventory');
if (!box) return;
const items = state.inventoryItems;
box.innerHTML = items.map((it, i) => `
<div class="inventory-item-block">
<div class="inventory-item">
<input type="text" class="inv-name" data-inv-name="${i}" placeholder="Nome do item" value="${escapeHtml(it.name)}">
<input type="number" class="inv-weight" data-inv-weight="${i}" placeholder="Peso" min="0" step="0.5" value="${it.weight}">
<input type="number" class="inv-qty" data-inv-qty="${i}" placeholder="Qtd" min="0" step="1" value="${it.qty}">
<button type="button" class="skill-remove" data-inv-remove="${i}" ${items.length <= 1 ? 'style="visibility:hidden;"' : ''}>✕</button>
</div>
<div class="item-type-row">
<label class="item-type-chip"><input type="checkbox" data-inv-consumable="${i}" ${it.consumable ? 'checked' : ''} ${it.armor ? 'disabled title="Um item Armadura não pode ser Consumível"' : ''}> 🧪 Consumível</label>
<label class="item-type-chip armor"><input type="checkbox" data-inv-armor="${i}" ${it.armor ? 'checked' : ''} ${it.consumable ? 'disabled title="Um item Consumível não pode ser Armadura"' : ''}> 🛡️ Armadura</label>
</div>
${it.consumable ? `
<div class="item-detail inv-effect-fields">
<select data-inv-effect-type="${i}">
<option value="">Tipo de efeito…</option>
${CONSUMABLE_EFFECT_TYPES.map(([v, label]) => `<option value="${v}" ${it.effectType === v ? 'selected' : ''}>${label}</option>`).join('')}
</select>
<input type="text" class="inv-effect-value" data-inv-effect-value="${i}" placeholder="Dado/valor (ex.: 1d8+2)" value="${escapeHtml(it.effectValue)}" title="Opcional — notação de dado usada na rolagem da mesa (ex.: 1d8+2). Deixe em branco se o efeito não tem um número pra rolar (comum em Buff/Debuff).">
<input type="text" class="inv-effect-desc" data-inv-effect-desc="${i}" placeholder="Descrição do efeito (ex.: +2 Força por 3 rodadas)" value="${escapeHtml(it.effectDesc)}">
</div>` : ''}
${it.armor ? `
<div class="item-detail inv-armor-fields">
<label class="item-equip-toggle"><input type="checkbox" data-inv-armor-equipped="${i}" ${it.armorEquipped ? 'checked' : ''}> <span>Equipada agora</span></label>
<p class="hint" style="margin:2px 0 8px;">HP de Armadura por parte coberta (0 = não cobre). Some primeiro, antes do HP normal, quando a parte toma dano; some a zero e a armadura "quebra" até ser consertada.</p>
<div class="inv-armor-parts-grid">
${ARMOR_PARTS_LIST.map(([k, label]) => `
<label class="inv-armor-part">
<span class="iap-label">${label}</span>
<input type="number" min="0" step="1" class="inv-armor-part-input" data-inv-armor-part="${i}" data-part="${k}" value="${(it.armorParts && it.armorParts[k]) || 0}">
</label>`).join('')}
</div>
</div>` : ''}
</div>`).join('') + `<button type="button" class="btn secondary small line-list-add" data-inv-add style="width:auto;">+ Adicionar item</button>`;
box.querySelectorAll('[data-inv-name]').forEach(inp => {
inp.addEventListener('input', () => { items[parseInt(inp.dataset.invName)].name = inp.value; });
});
box.querySelectorAll('[data-inv-weight]').forEach(inp => {
inp.addEventListener('input', () => {
items[parseInt(inp.dataset.invWeight)].weight = parseFloat(inp.value) || 0;
renderInventoryWeightSummary();
});
});
box.querySelectorAll('[data-inv-qty]').forEach(inp => {
inp.addEventListener('input', () => {
items[parseInt(inp.dataset.invQty)].qty = parseInt(inp.value, 10) || 0;
renderInventoryWeightSummary();
});
});
box.querySelectorAll('[data-inv-consumable]').forEach(inp => {
inp.addEventListener('change', () => {
items[parseInt(inp.dataset.invConsumable)].consumable = inp.checked;
renderInventoryUI();
});
});
box.querySelectorAll('[data-inv-effect-type]').forEach(sel => {
sel.addEventListener('change', () => { items[parseInt(sel.dataset.invEffectType)].effectType = sel.value; });
});
box.querySelectorAll('[data-inv-effect-value]').forEach(inp => {
inp.addEventListener('input', () => { items[parseInt(inp.dataset.invEffectValue)].effectValue = inp.value; });
});
box.querySelectorAll('[data-inv-effect-desc]').forEach(inp => {
inp.addEventListener('input', () => { items[parseInt(inp.dataset.invEffectDesc)].effectDesc = inp.value; });
});
box.querySelectorAll('[data-inv-armor]').forEach(inp => {
inp.addEventListener('change', () => {
items[parseInt(inp.dataset.invArmor)].armor = inp.checked;
renderInventoryUI();
recalcArmorResources();
renderArmorParts();
});
});
box.querySelectorAll('[data-inv-armor-equipped]').forEach(inp => {
inp.addEventListener('change', () => {
items[parseInt(inp.dataset.invArmorEquipped)].armorEquipped = inp.checked;
recalcArmorResources();
renderArmorParts();
});
});
box.querySelectorAll('[data-inv-armor-part]').forEach(inp => {
inp.addEventListener('input', () => {
const it = items[parseInt(inp.dataset.invArmorPart)];
if (!it.armorParts) it.armorParts = {};
it.armorParts[inp.dataset.part] = parseInt(inp.value, 10) || 0;
recalcArmorResources();
renderArmorParts();
});
});
box.querySelectorAll('[data-inv-remove]').forEach(btn => {
btn.addEventListener('click', () => {
if (items.length <= 1) return;
items.splice(parseInt(btn.dataset.invRemove), 1);
renderInventoryUI();
recalcArmorResources();
renderArmorParts();
});
});
const addBtn = box.querySelector('[data-inv-add]');
if (addBtn) addBtn.addEventListener('click', () => {
items.push({ name: '', weight: 0, qty: 1, consumable: false, effectType: '', effectValue: '', effectDesc: '', armor: false, armorEquipped: false, armorParts: {} });
renderInventoryUI();
const nameInputs = box.querySelectorAll('[data-inv-name]');
nameInputs[nameInputs.length - 1].focus();
});
renderInventoryWeightSummary();
}
function renderArmorParts() {
const box = document.getElementById('fArmorParts');
if (!box) return;
if (!state.resources || !state.resources.armor) { box.innerHTML = ''; return; }
const armor = state.resources.armor;
const anyEquipped = ARMOR_PARTS_LIST.some(([k]) => armor[k] && armor[k].max > 0);
if (!anyEquipped) {
box.innerHTML = `<p class="hint" style="margin:0;">Nenhuma armadura equipada no momento.</p>`;
return;
}
box.innerHTML = ARMOR_PARTS_LIST.map(([k, label]) => {
const p = armor[k] || { max: 0, cur: 0 };
if (!p.max) return '';
const broken = p.cur <= 0;
const pct = p.max ? Math.max(0, Math.min(100, (p.cur / p.max) * 100)) : 0;
return `<div class="armor-part-row${broken ? ' is-broken' : ''}">
<div class="apr-top">
<span class="apr-name">${label}</span>
<span class="apr-value">${p.cur}<span class="apr-max"> / ${p.max}</span>${broken ? ' · quebrada' : ''}</span>
</div>
<div class="durability-gauge"><span class="durability-gauge-fill" style="width:${pct}%;"></span></div>
${p.cur < p.max ? `<button type="button" class="btn secondary small apr-repair" data-armor-repair="${k}" title="Restaura o HP de Armadura desta parte ao máximo">🔧 Consertar</button>` : ''}
</div>`;
}).join('');
box.querySelectorAll('[data-armor-repair]').forEach(btn => {
btn.addEventListener('click', () => {
const k = btn.dataset.armorRepair;
state.resources.armor[k].cur = state.resources.armor[k].max;
renderArmorParts();
});
});
}
function renderInventoryWeightSummary() {
const el = document.getElementById('inventoryWeightSummary');
if (!el) return;
const capacity = carryCapacity();
const total = inventoryTotalWeight();
const st = weightStatus(total, capacity);
const tagClass = st.key === 'normal' ? 'benign' : (st.key === 'pesada' ? 'info' : 'malign');
const pct = capacity > 0 ? Math.max(0, Math.min(100, (total / capacity) * 100)) : 0;
el.innerHTML = `
<div class="weight-summary-row">
<span>Peso total: <b style="color:var(--gold);">${total}</b> / ${capacity} (Capacidade de Carga)</span>
<span class="tag ${tagClass}">${st.label}</span>
</div>
<div class="weight-gauge"><span class="weight-gauge-fill ${tagClass}" style="width:${pct}%;"></span></div>
${st.penalty ? `<p class="hint" style="margin:6px 0 0;">${st.penalty} em todos os testes físicos (Força, Destreza e Constituição)${st.note ? ' · ' + st.note : ''}</p>` : ''}
`;
}
function initNotesUI() {
const ta = document.getElementById('fNotes');
if (!ta) return;
ta.value = (state.notes || []).join('\n');
autoExpandTextarea(ta);
ta.addEventListener('input', () => autoExpandTextarea(ta));
}
let cachedFolders = [];
async function initFolderUI() {
const sel = document.getElementById('fFolder');
if (!sel) return;
try {
cachedFolders = await getFolders();
} catch (err) {
cachedFolders = [];
}
sel.innerHTML = '<option value="">Sem pasta / campanha</option>' +
cachedFolders.map(f => `<option value="${f.id}">${escapeHtml(f.name)}</option>`).join('');
sel.value = state.folderId || '';
}
const APPEARANCE_MAX_DIM = 700;
function initAppearanceUI() {
const input = document.getElementById('fAppearanceImage');
const preview = document.getElementById('appearancePreview');
const msg = document.getElementById('appearanceMsg');
function refreshPreview() {
if (state.appearanceImage) {
preview.innerHTML = `
<img src="${state.appearanceImage}" alt="Aparência do personagem" class="appearance-img">
<button type="button" class="btn secondary small" id="removeAppearanceBtn" style="width:auto; margin-top:8px;">Remover imagem</button>`;
const rm = document.getElementById('removeAppearanceBtn');
if (rm) rm.addEventListener('click', () => {
state.appearanceImage = '';
input.value = '';
refreshPreview();
});
} else {
preview.innerHTML = '';
}
}
input.addEventListener('change', () => {
const file = input.files && input.files[0];
if (!file) return;
if (!file.type.startsWith('image/')) {
if (msg) msg.textContent = 'Escolha um arquivo de imagem válido.';
return;
}
const reader = new FileReader();
reader.onload = (e) => {
const img = new Image();
img.onload = () => {
let { width, height } = img;
if (width > APPEARANCE_MAX_DIM || height > APPEARANCE_MAX_DIM) {
if (width > height) { height = Math.round(height * APPEARANCE_MAX_DIM / width); width = APPEARANCE_MAX_DIM; }
else { width = Math.round(width * APPEARANCE_MAX_DIM / height); height = APPEARANCE_MAX_DIM; }
}
const canvas = document.createElement('canvas');
canvas.width = width; canvas.height = height;
canvas.getContext('2d').drawImage(img, 0, 0, width, height);
state.appearanceImage = canvas.toDataURL('image/jpeg', 0.78);
if (msg) msg.textContent = 'Envie uma foto ou arte do personagem (a imagem é redimensionada automaticamente antes de salvar).';
refreshPreview();
};
img.src = e.target.result;
};
reader.readAsDataURL(file);
});
refreshPreview();
}

function collectFormIntoState() {
state.characterName = document.getElementById('fCharName').value;
const dcActiveNow = typeof isDeadlyCardsActive === 'function' && isDeadlyCardsActive();
state.energyType = dcActiveNow ? dcEnergyLabel(state.dcAssimilacao) : document.getElementById('fEnergy').value;
state.level = parseInt(document.getElementById('fLevel').value) || 1;
state.hand = document.getElementById('fHand').value;
state.height = document.getElementById('fHeight').value;
state.age = document.getElementById('fAge').value !== '' ? (parseInt(document.getElementById('fAge').value) || 0) : null;
state.currentClass = document.getElementById('fClass').value;
state.xp = Math.max(0, parseInt(document.getElementById('fXP').value) || 0);
state.history = document.getElementById('fHistory').value;
state.inventoryItems = (state.inventoryItems || [])
.map(ensureInventoryItemShape)
.filter(it => it.name.trim() || it.weight || it.qty !== 1);
const notesRaw = document.getElementById('fNotes') ? document.getElementById('fNotes').value : '';
state.notes = cleanLineList(notesRaw.split('\n'));
const folderSel = document.getElementById('fFolder');
state.folderId = folderSel ? (folderSel.value || '') : '';
const chosenFolder = cachedFolders.find(f => f.id === state.folderId);
state.folderName = chosenFolder ? chosenFolder.name : '';
state.masterId = chosenFolder ? (chosenFolder.createdBy || null) : null;
state.inspirationPoints = Math.max(0, parseInt(document.getElementById('fInspiration').value) || 0);
collectComplementosIntoState();
if (!state.inventoryItems.length) state.inventoryItems = [];
if (!state.notes.length) state.notes = [];
}
function populateFormFromState() {
document.getElementById('fCharName').value = state.characterName || '';
document.getElementById('fEnergy').value = state.energyType || '';
document.getElementById('fLevel').value = state.level || 1;
document.getElementById('fHand').value = state.hand || 'Destro';
document.getElementById('fHeight').value = state.height || '';
document.getElementById('fAge').value = (state.age === null || state.age === undefined) ? '' : state.age;
document.getElementById('fClass').value = state.currentClass || '';
document.getElementById('fXP').value = state.xp || 0;
document.getElementById('fHistory').value = state.history || '';
document.getElementById('fBackground').value = state.backgroundId || '';
const folderSel = document.getElementById('fFolder');
if (folderSel) folderSel.value = state.folderId || '';
state.inventoryItems = (state.inventoryItems && state.inventoryItems.length)
? state.inventoryItems.map(ensureInventoryItemShape)
: [{ name: '', weight: 0, qty: 1 }];
state.notes = (state.notes && state.notes.length) ? state.notes.slice() : [''];
state.techniques = state.techniques || [];
initInventoryUI();
initNotesUI();
initAppearanceUI();
initInspirationUI();
updateInspirationDisplay();
updateXpHint();
renderAbilities();
renderTechniques();
renderResources();
}
async function syncSheetAppearanceToTokens(user, sheetId, name, image, hp) {
if (!sheetId) return;
try {
const profileDoc = await db.collection('users').doc(user.uid).get();
const activeTables = (profileDoc.exists && profileDoc.data().activeTables) || [];
if (!activeTables.length) return;
await Promise.all(activeTables.map(async (tableId) => {
try {
const tokenRef = db.collection('tables').doc(tableId).collection('tokens').doc(user.uid);
const tokenSnap = await tokenRef.get();
if (tokenSnap.exists && tokenSnap.data().sheetId === sheetId) {
const update = {
name: name || 'Personagem',
image: image || '',
updatedAt: firebase.firestore.FieldValue.serverTimestamp()
};
if (hp) update.hp = hp;
await tokenRef.update(update);
}
} catch (err) {
console.warn('Não foi possível atualizar o token na mesa ' + tableId + ':', err);
}
}));
} catch (err) {
console.warn('Não foi possível sincronizar a aparência com as mesas ativas:', err);
}
}
async function saveSheet(user) {
collectFormIntoState();
const errors = validateAll();
const bottomMsg = document.getElementById('bottomMsg');
if (errors.length > 0) {
bottomMsg.innerHTML = `<div class="error-msg">${errors.map(escapeHtml).join('<br>')}</div>`;
bottomMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
return;
}
bottomMsg.innerHTML = '';
const race = DATA.races.find(r => r.id === state.raceId) || null;
const raceOptionalTraitTexts = race ? currentRaceOptionalTexts(race) : [];
const raceVariantText = (race && race.variantChoice && state.raceVariantChosen !== null && state.raceVariantChosen !== undefined)
? `${race.variantChoice.options[state.raceVariantChosen].name}: ${race.variantChoice.options[state.raceVariantChosen].desc}`
: null;
const background = state.backgroundId ? DATA.backgrounds.find(b => b.id === state.backgroundId) : null;
const dcActive = typeof isDeadlyCardsActive === 'function' && isDeadlyCardsActive();
const payload = {
characterName: state.characterName.trim(),
energyType: state.energyType,
level: state.level,
hand: state.hand,
height: state.height || '',
age: (state.age === null || state.age === undefined) ? null : state.age,
currentClass: state.currentClass || '',
xp: state.xp || 0,
attributes: state.attributes,
skills: state.skills,
raceId: state.raceId || '',
raceName: race ? race.name : '',
raceFixedTrait: (race && state.raceId === state.loadedRaceId && state.raceFixedTraitOverride) ? state.raceFixedTraitOverride : (race ? race.fixedTrait : ''),
raceVariantTrait: raceVariantText,
raceOptionalTraits: raceOptionalTraitTexts,
raceTraitsBought: race ? currentRaceBoughtTexts(race) : [],
backgroundId: state.backgroundId || null,
backgroundName: background ? background.name : null,
backgroundDesc: background ? background.desc : null,
backgroundAtributos: background ? background.atributos : null,
backgroundSkills: state.backgroundSkills || [],
extraTraits: state.extraTraits,
attrManualBonus: state.attrManualBonus || {},
abilities: state.abilities || [],
techniques: state.techniques || [],
resources: state.resources || emptyResources(),
inspirationPoints: state.inspirationPoints || 0,
traitBonusFromInspiration: state.traitBonusFromInspiration || 0,
history: state.history,
appearanceImage: state.appearanceImage || '',
inventoryItems: state.inventoryItems || [],
notes: state.notes || [],
folderId: state.folderId || null,
folderName: state.folderName || null,
masterId: state.masterId || null,
complementos: state.complementos || {},
dcActive,
updatedAt: firebase.firestore.FieldValue.serverTimestamp()
};
const saveBtn = document.getElementById('saveBtn');
saveBtn.disabled = true;
saveBtn.textContent = 'Salvando…';
try {
let sheetOwnerUid = user.uid;
if (editingSheetId) {
const existing = await db.collection('sheets').doc(editingSheetId).get();
if (existing.exists && existing.data().ownerId) sheetOwnerUid = existing.data().ownerId;
await db.collection('sheets').doc(editingSheetId).update(payload);
} else {
payload.ownerId = user.uid;
payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
const ref = await db.collection('sheets').add(payload);
editingSheetId = ref.id;
}
await syncFolderMembership(sheetOwnerUid, state.loadedFolderId || '', state.folderId || '');
state.loadedFolderId = state.folderId || '';
await syncSheetAppearanceToTokens(user, editingSheetId, payload.characterName, payload.appearanceImage, payload.resources && payload.resources.hp);
location.href = 'ficha-view.html?id=' + editingSheetId;
} catch (err) {
bottomMsg.innerHTML = `<div class="error-msg">Erro ao salvar: ${escapeHtml(err.message)}</div>`;
saveBtn.disabled = false;
saveBtn.textContent = 'Salvar Ficha';
}
}
async function loadExistingSheet(id, user, profile) {
let doc;
try {
doc = await db.collection('sheets').doc(id).get();
} catch (err) {
document.getElementById('topMsg').innerHTML = `<div class="error-msg">Ficha não encontrada ou você não tem permissão para editá-la.</div>`;
return;
}
const isOwner = doc.exists && doc.data().ownerId === user.uid;
const isMaster = profile && profile.role === 'master';
if (!doc.exists || (!isOwner && !isMaster)) {
document.getElementById('topMsg').innerHTML = `<div class="error-msg">Ficha não encontrada ou você não tem permissão para editá-la.</div>`;
return;
}
const s = doc.data();
state.characterName = s.characterName;
state.energyType = s.energyType;
state.level = s.level;
state.hand = s.hand || 'Destro';
state.height = s.height || '';
state.age = (s.age === undefined) ? null : s.age;
state.currentClass = s.currentClass || '';
state.xp = s.xp || 0;
state.attributes = s.attributes;
state.skills = s.skills || [];
state.raceId = s.raceId;
const race = DATA.races.find(r => r.id === s.raceId);
state.loadedRaceId = s.raceId;
state.raceFixedTraitOverride = (race && s.raceFixedTrait && s.raceFixedTrait !== race.fixedTrait) ? s.raceFixedTrait : null;
state.raceOptionalChosen = race ? (s.raceOptionalTraits || []).map(text => race.optionalTraits.indexOf(text)).filter(i => i >= 0) : [];
state.raceTraitsBought = race ? (s.raceTraitsBought || []).map(text => race.optionalTraits.indexOf(text)).filter(i => i >= 0) : [];
state.raceOptionalTraitsLoaded = s.raceOptionalTraits || [];
state.raceTraitsBoughtLoaded = s.raceTraitsBought || [];
state.raceOptionalTouched = false;
state.raceBoughtTouched = false;
if (race && race.variantChoice && s.raceVariantTrait) {
const vIdx = race.variantChoice.options.findIndex(v => `${v.name}: ${v.desc}` === s.raceVariantTrait);
state.raceVariantChosen = vIdx >= 0 ? vIdx : null;
} else {
state.raceVariantChosen = null;
}
state.backgroundId = s.backgroundId || '';
state.backgroundSkills = s.backgroundSkills || [];
state.backgroundSkills.forEach(name => addBackgroundSkillToList(name));
state.extraTraits = s.extraTraits || [];
state.extraTraits.forEach(t => {
const skillName = parseTraitSkillFromText(t.desc);
if (skillName) addTraitSkillToList(skillName);
});
state.attrManualBonus = Object.assign({ forca: 0, foco: 0, vontade: 0, intelecto: 0, destreza: 0, constituicao: 0 }, s.attrManualBonus || {});
state.abilities = s.abilities || [];
state.abilities.forEach(migrateAbilityCost);
state.techniques = s.techniques || [];
state.techniques.forEach(migrateTechniqueCost);
state.resources = Object.assign(emptyResources(), s.resources || {});
if (!state.resources.hp) state.resources.hp = emptyResources().hp;
migrateBodyPartsHp(state.resources.hp);
if (!state.resources.economy) state.resources.economy = { bronze: 0, prata: 0, ouro: 0, platina: 0 };
state.inspirationPoints = s.inspirationPoints || 0;
state.traitBonusFromInspiration = s.traitBonusFromInspiration || 0;
state.history = s.history || '';
state.appearanceImage = s.appearanceImage || '';
const rawInventory = s.inventoryItems || (s.inventory ? [s.inventory] : [{ name: '', weight: 0, qty: 1 }]);
state.inventoryItems = rawInventory.map(ensureInventoryItemShape);
state.notes = s.notes || [''];
state.folderId = s.folderId || '';
state.folderName = s.folderName || '';
state.masterId = s.masterId || null;
state.loadedFolderId = s.folderId || '';
state.complementos = s.complementos || {};
populateFormFromState();
await initComplementosUI();
renderAttrs(); updateAttrPoolDisplay();
renderSkills(); updateSkillPoolDisplay();
renderRaceGrid(); renderRaceDetail();
renderBackgroundDetail();
renderTraitCategories(''); renderChosenTraits(); updateTraitPoolDisplay();
renderAttrs(); updateAttrPoolDisplay();
renderAbilities();
renderTechniques();
renderResources();
updateXpHint();
document.getElementById('headTitle').textContent = 'Editar: ' + s.characterName;
document.getElementById('pageMode').textContent = 'Edição de Ficha';
}

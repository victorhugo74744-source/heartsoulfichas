// editor-save.js — parte de js/editor.js, dividido em Ago/2026 porque o arquivo
// único tinha passado de 1900 linhas. Carregamento e salvamento da ficha no Firestore.
// Carregado como script global comum (sem módulos ES) — ver ordem exigida
// em ficha-editor.html. Funções e variáveis aqui são globais e usadas
// livremente pelos outros arquivos editor-*.js.

// ================= LOAD / SAVE =================
function collectFormIntoState() {
  state.characterName = document.getElementById('fCharName').value;
  state.energyType = document.getElementById('fEnergy').value;
  state.level = parseInt(document.getElementById('fLevel').value) || 1;
  state.hand = document.getElementById('fHand').value;
  state.height = document.getElementById('fHeight').value;
  state.age = document.getElementById('fAge').value !== '' ? (parseInt(document.getElementById('fAge').value) || 0) : null;
  state.currentClass = document.getElementById('fClass').value;
  state.xp = Math.max(0, parseInt(document.getElementById('fXP').value) || 0);
  state.history = document.getElementById('fHistory').value;
  // state.appearanceImage já é atualizado diretamente pelo upload em initAppearanceUI().
  // state.inventoryItems já é mantido atualizado por referência pelos listeners
  // de renderInventoryUI() (js/editor-misc.js) — aqui só descarta linhas em
  // branco (sem nome e com peso/quantidade zerados) antes de salvar.
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

// Depois de salvar, empurra o nome/aparência atualizados para qualquer
// token que este jogador tenha ativo em alguma mesa (ver js/mesa-*.js, que
// grava em users/{uid}.activeTables ao "virar" a ficha na mesa e ao sair
// dela). Assim o token acompanha a ficha automaticamente — sem precisar
// voltar na mesa e clicar em "Atualizar aparência" toda vez.
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
        // Só atualiza se o token na mesa for justamente desta ficha — evita
        // sobrescrever com o nome errado caso o jogador tenha entrado nessa
        // mesa com outra ficha depois.
        if (tokenSnap.exists && tokenSnap.data().sheetId === sheetId) {
          const update = {
            name: name || 'Personagem',
            image: image || '',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          };
          // O HP da ficha (Recursos > HP por partes do corpo) é a mesma
          // estrutura {parte: {max, cur}} usada no token na mesa — então
          // empurra também, mantendo os dois sempre iguais (o caminho
          // inverso, da mesa pra ficha, acontece em js/mesa-*.js sempre que
          // uma rolagem de dano/cura ou uma edição manual de HP altera o
          // token na mesa).
          if (hp) update.hp = hp;
          await tokenRef.update(update);
        }
      } catch (err) {
        console.warn('Não foi possível atualizar o token na mesa ' + tableId + ':', err);
      }
    }));
  } catch (err) {
    // Nunca bloqueia o salvamento da ficha por causa disso — só loga.
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

  const race = DATA.races.find(r => r.id === state.raceId);
  const raceOptionalTraitTexts = currentRaceOptionalTexts(race);
  const raceVariantText = (race.variantChoice && state.raceVariantChosen !== null && state.raceVariantChosen !== undefined)
    ? `${race.variantChoice.options[state.raceVariantChosen].name}: ${race.variantChoice.options[state.raceVariantChosen].desc}`
    : null;
  const background = state.backgroundId ? DATA.backgrounds.find(b => b.id === state.backgroundId) : null;

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
    raceId: state.raceId,
    raceName: race.name,
    // Só reaplica o texto padrão do catálogo se a raça em si mudou desde que
    // a ficha foi carregada; senão preserva a edição do Mestre (evolução/
    // fusão do Traço Fixo feita no painel de ficha-view.html).
    raceFixedTrait: (state.raceId === state.loadedRaceId && state.raceFixedTraitOverride) ? state.raceFixedTraitOverride : race.fixedTrait,
    raceVariantTrait: raceVariantText,
    raceOptionalTraits: raceOptionalTraitTexts,
    raceTraitsBought: currentRaceBoughtTexts(race),
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
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Salvando…';
  try {
    let sheetOwnerUid = user.uid;
    if (editingSheetId) {
      // Não sobrescreve ownerId ao editar — preserva o dono original da
      // ficha mesmo quando quem está salvando é o Mestre.
      const existing = await db.collection('sheets').doc(editingSheetId).get();
      if (existing.exists && existing.data().ownerId) sheetOwnerUid = existing.data().ownerId;
      await db.collection('sheets').doc(editingSheetId).update(payload);
    } else {
      payload.ownerId = user.uid;
      payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      const ref = await db.collection('sheets').add(payload);
      editingSheetId = ref.id;
    }
    // Mantém a marca de "tenho ficha nesta pasta" em dia — é o que decide
    // quem vê as mesas afiliadas a ela (ver syncFolderMembership).
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
  // Compatibilidade com fichas salvas antes desta atualização.
  state.height = s.height || '';
  state.age = (s.age === undefined) ? null : s.age;
  state.currentClass = s.currentClass || '';
  state.xp = s.xp || 0;
  state.attributes = s.attributes;
  state.skills = s.skills || [];
  state.raceId = s.raceId;
  const race = DATA.races.find(r => r.id === s.raceId);
  state.loadedRaceId = s.raceId;
  // Se o Traço Fixo salvo não bate mais com o texto padrão da raça no
  // catálogo, é porque o Mestre o editou (evolução/fusão) no painel de
  // ficha-view.html — guarda esse texto pra não perdê-lo ao salvar aqui.
  state.raceFixedTraitOverride = (race && s.raceFixedTrait && s.raceFixedTrait !== race.fixedTrait) ? s.raceFixedTrait : null;
  state.raceOptionalChosen = (s.raceOptionalTraits || []).map(text => race.optionalTraits.indexOf(text)).filter(i => i >= 0);
  state.raceTraitsBought = (s.raceTraitsBought || []).map(text => race.optionalTraits.indexOf(text)).filter(i => i >= 0);
  // Guarda os arrays exatamente como foram salvos (podem ter sido evoluídos/
  // fundidos pelo Mestre e não bater mais com nenhum item do catálogo — daí
  // o índice não ser encontrado acima) e zera os flags de "mexi nisso nesta
  // sessão" — ver currentRaceOptionalTexts/currentRaceBoughtTexts.
  state.raceOptionalTraitsLoaded = s.raceOptionalTraits || [];
  state.raceTraitsBoughtLoaded = s.raceTraitsBought || [];
  state.raceOptionalTouched = false;
  state.raceBoughtTouched = false;
  if (race.variantChoice && s.raceVariantTrait) {
    const vIdx = race.variantChoice.options.findIndex(v => `${v.name}: ${v.desc}` === s.raceVariantTrait);
    state.raceVariantChosen = vIdx >= 0 ? vIdx : null;
  } else {
    state.raceVariantChosen = null;
  }
  state.backgroundId = s.backgroundId || '';
  state.backgroundSkills = s.backgroundSkills || [];
  // Compatibilidade: fichas salvas antes desta atualização tinham as perícias
  // do antecedente separadas, sem poder ganhar pontos. Ao editar, elas entram
  // na lista normal de perícias (marcadas como "Antecedente").
  state.backgroundSkills.forEach(name => addBackgroundSkillToList(name));
  state.extraTraits = s.extraTraits || [];
  // Compatibilidade: fichas salvas antes desta atualização não tinham a
  // perícia do traço entrando automaticamente na lista de perícias.
  state.extraTraits.forEach(t => {
    const skillName = parseTraitSkillFromText(t.desc);
    if (skillName) addTraitSkillToList(skillName);
  });
  // Compatibilidade com fichas salvas antes desta atualização.
  state.attrManualBonus = Object.assign({ forca: 0, foco: 0, vontade: 0, intelecto: 0, destreza: 0, constituicao: 0 }, s.attrManualBonus || {});
  state.abilities = s.abilities || [];
  state.abilities.forEach(migrateAbilityCost);
  state.techniques = s.techniques || [];
  state.techniques.forEach(migrateTechniqueCost);
  state.resources = Object.assign(emptyResources(), s.resources || {});
  if (!state.resources.hp) state.resources.hp = emptyResources().hp;
  migrateBodyPartsHp(state.resources.hp);
  // Compatibilidade: fichas salvas antes desta atualização não tinham economia.
  if (!state.resources.economy) state.resources.economy = { bronze: 0, prata: 0, ouro: 0, platina: 0 };
  state.inspirationPoints = s.inspirationPoints || 0;
  state.traitBonusFromInspiration = s.traitBonusFromInspiration || 0;
  state.history = s.history || '';
  // Compatibilidade com fichas salvas antes desta atualização.
  state.appearanceImage = s.appearanceImage || '';
  // Compatibilidade: fichas antigas tinham inventário como texto livre (uma
  // string por linha) ou um único campo "inventory". ensureInventoryItemShape
  // converte cada item antigo para { name, weight: 0, qty: 1 }.
  const rawInventory = s.inventoryItems || (s.inventory ? [s.inventory] : [{ name: '', weight: 0, qty: 1 }]);
  state.inventoryItems = rawInventory.map(ensureInventoryItemShape);
  state.notes = s.notes || [''];
  state.folderId = s.folderId || '';
  state.folderName = s.folderName || '';
  state.masterId = s.masterId || null;
  // Guarda a pasta com que a ficha foi carregada, pra saber se ela mudou
  // de pasta ao salvar (ver syncFolderMembership em saveSheet()).
  state.loadedFolderId = s.folderId || '';

  populateFormFromState();
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


// editor-init.js — parte de js/editor.js, dividido em Ago/2026 porque o arquivo
// único tinha passado de 1900 linhas. Bootstrap da página: guardPage(), preenchimento inicial de todas as seções e listeners de nível/energia.
// Carregado como script global comum (sem módulos ES) — ver ordem exigida
// em ficha-editor.html. Funções e variáveis aqui são globais e usadas
// livremente pelos outros arquivos editor-*.js.

// ================= INIT =================
// Qualquer usuário logado pode abrir esta página. Jogadores e Mestres podem
// criar fichas novas (o Mestre também pode ter seus próprios personagens e
// jogar em outras mesas). O Mestre também pode editar fichas de jogadores
// (quando há ?id na URL) para dar suporte durante o jogo.
guardPage(null, async (user, profile) => {
  const params = new URLSearchParams(location.search);
  const idParam = params.get('id');
  renderTopbar(profile);
  renderAttrs(); updateAttrPoolDisplay();
  renderSkills(); updateSkillPoolDisplay();
  renderRaceGrid();
  renderBackgroundSelect();
  initTraitFilters();
  renderTraitCategories(''); renderChosenTraits(); updateTraitPoolDisplay();
  initInventoryUI();
  initNotesUI();
  await initFolderUI();
  initAppearanceUI();
  initInspirationUI();
  updateInspirationDisplay();
  initAbilitiesUI();
  renderAbilities();
  initTechniquesUI();
  renderTechniques();
  initXPUI();
  renderResources();

  document.getElementById('fLevel').addEventListener('input', () => {
    state.level = parseInt(document.getElementById('fLevel').value) || 1;
    updateAttrPoolDisplay();
    updateSkillPoolDisplay();
    // O cap por perícia pode ter mudado — força recálculo visual da lista.
    renderSkills();
    updateXpHint();
    // Subir de nível libera rolagens pendentes do dado de vida/estamina/energia.
    renderResources();
  });

  document.getElementById('fEnergy').addEventListener('change', () => {
    state.energyType = document.getElementById('fEnergy').value;
    // A Energia (Aura/Mana/Fé) usa atributos diferentes — recalcula a caixa.
    renderResources();
  });

  if (idParam) {
    editingSheetId = idParam;
    await loadExistingSheet(idParam, user, profile);
  }

  document.getElementById('saveBtn').addEventListener('click', () => saveSheet(user));
});

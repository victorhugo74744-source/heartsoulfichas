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
await initComplementosUI();
document.getElementById('fFolder').addEventListener('change', () => initComplementosUI());
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
renderSkills();
updateXpHint();
renderResources();
});
document.getElementById('fEnergy').addEventListener('change', () => {
state.energyType = document.getElementById('fEnergy').value;
renderResources();
});
if (idParam) {
editingSheetId = idParam;
await loadExistingSheet(idParam, user, profile);
}
document.getElementById('saveBtn').addEventListener('click', () => saveSheet(user));
});

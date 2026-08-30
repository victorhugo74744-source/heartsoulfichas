// editor-abilities.js — parte de js/editor.js, dividido em Ago/2026 porque o arquivo
// único tinha passado de 1900 linhas. UI de habilidades, recursos (HP por parte / Sanidade / Estamina / Energia), economia e técnicas.
// Carregado como script global comum (sem módulos ES) — ver ordem exigida
// em ficha-editor.html. Funções e variáveis aqui são globais e usadas
// livremente pelos outros arquivos editor-*.js.

// ================= HABILIDADES =================
// O custo é um único campo de texto livre (ex.: "2 Estamina", "1 HP",
// "Sanidade") — o próprio jogador escreve o que a habilidade consome,
// sem precisar encaixar em um tipo fixo pré-definido.
// Compatibilidade: fichas salvas antes desta atualização podiam ter o custo
// separado em costAmount + costType, ou (mais antigo ainda) em costLegacyText.
// Ao carregar, tudo isso vira o texto único em a.cost.
function migrateAbilityCost(a) {
  if (!a.cost) {
    if (a.costAmount && a.costType) a.cost = `${a.costAmount} ${a.costType}`;
    else if (a.costLegacyText) a.cost = a.costLegacyText;
    else a.cost = a.cost || '';
  }
  delete a.costAmount; delete a.costType; delete a.costLegacyText;
  a.actionType = a.actionType || '';
}
function abilityCostLabel(a) {
  return a.cost || '';
}
let editingAbilityIndex = null;
function renderAbilities() {
  const list = document.getElementById('abilitiesList');
  if (!list) return;
  if (!state.abilities.length) {
    list.innerHTML = `<p class="hint" style="margin:0 0 10px;">Nenhuma habilidade criada ainda.</p>`;
  } else {
    list.innerHTML = state.abilities.map((a, i) => {
      const costLabel = abilityCostLabel(a);
      return `
      <div class="ability-row">
        <div class="ability-head">
          <b>${escapeHtml(a.name)}</b>
          ${a.actionType ? `<span class="atype">${escapeHtml(a.actionType)}</span>` : ''}
          ${costLabel ? `<span class="tcost">${escapeHtml(costLabel)}</span>` : ''}
          <button type="button" class="skill-remove" data-edit-ability="${i}" title="Editar" style="margin-left:auto;">✎</button>
          <button type="button" class="skill-remove" data-remove-ability="${i}" title="Remover">✕</button>
        </div>
        ${a.desc ? `<div class="ability-desc">${escapeHtml(a.desc)}</div>` : ''}
      </div>`;
    }).join('');
  }
  list.querySelectorAll('[data-remove-ability]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.removeAbility);
      if (editingAbilityIndex === idx) cancelAbilityEdit();
      state.abilities.splice(idx, 1);
      renderAbilities();
    });
  });
  list.querySelectorAll('[data-edit-ability]').forEach(btn => {
    btn.addEventListener('click', () => startAbilityEdit(parseInt(btn.dataset.editAbility)));
  });
}
function startAbilityEdit(index) {
  const a = state.abilities[index];
  if (!a) return;
  editingAbilityIndex = index;
  document.getElementById('newAbilityName').value = a.name || '';
  document.getElementById('newAbilityCost').value = a.cost || '';
  document.getElementById('newAbilityActionType').value = a.actionType || '';
  document.getElementById('newAbilityDesc').value = a.desc || '';
  const addBtn = document.getElementById('addAbilityBtn');
  const cancelBtn = document.getElementById('cancelAbilityEditBtn');
  if (addBtn) addBtn.textContent = 'Salvar edição';
  if (cancelBtn) cancelBtn.style.display = '';
  document.getElementById('newAbilityName').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function cancelAbilityEdit() {
  editingAbilityIndex = null;
  const nameEl = document.getElementById('newAbilityName');
  const costEl = document.getElementById('newAbilityCost');
  const actionTypeEl = document.getElementById('newAbilityActionType');
  const descEl = document.getElementById('newAbilityDesc');
  if (nameEl) nameEl.value = '';
  if (costEl) costEl.value = '';
  if (actionTypeEl) actionTypeEl.value = '';
  if (descEl) descEl.value = '';
  const addBtn = document.getElementById('addAbilityBtn');
  const cancelBtn = document.getElementById('cancelAbilityEditBtn');
  if (addBtn) addBtn.textContent = '+ Adicionar habilidade';
  if (cancelBtn) cancelBtn.style.display = 'none';
}
function initAbilitiesUI() {
  const btn = document.getElementById('addAbilityBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const nameEl = document.getElementById('newAbilityName');
    const costEl = document.getElementById('newAbilityCost');
    const actionTypeEl = document.getElementById('newAbilityActionType');
    const descEl = document.getElementById('newAbilityDesc');
    const name = nameEl.value.trim();
    if (!name) return;
    const ability = {
      name,
      cost: costEl.value.trim(),
      actionType: actionTypeEl.value,
      desc: descEl.value.trim()
    };
    if (editingAbilityIndex !== null && state.abilities[editingAbilityIndex]) {
      state.abilities[editingAbilityIndex] = ability;
    } else {
      state.abilities.push(ability);
    }
    cancelAbilityEdit();
    renderAbilities();
    nameEl.focus();
  });
  const cancelBtn = document.getElementById('cancelAbilityEditBtn');
  if (cancelBtn) cancelBtn.addEventListener('click', cancelAbilityEdit);
}

// ================= RECURSOS (HP por parte, Sanidade, Estamina, Energia) =================
// Compatibilidade: fichas salvas antes desta atualização tinham "Braços" e
// "Pernas" como uma peça só. Ao carregar, o valor antigo vira o ponto de
// partida para o esquerdo e o direito (o jogador ajusta cada lado à mão).
function migrateBodyPartsHp(hp) {
  if (!hp) return;
  if (hp.bracos && !hp.braco_esq && !hp.braco_dir) {
    hp.braco_esq = { max: hp.bracos.max, cur: hp.bracos.cur };
    hp.braco_dir = { max: hp.bracos.max, cur: hp.bracos.cur };
  }
  if (hp.pernas && !hp.perna_esq && !hp.perna_dir) {
    hp.perna_esq = { max: hp.pernas.max, cur: hp.pernas.cur };
    hp.perna_dir = { max: hp.pernas.max, cur: hp.pernas.cur };
  }
  delete hp.bracos;
  delete hp.pernas;
}

function sanityMax() { return 10 + attrMod(attrTotalValue('vontade')); }

// Cada energia usa um atributo diferente como base do seu reservatório,
// conforme o livro de regras: Fé/Vontade, Mana/Intelecto, Aura/Constituição.
const ENERGY_ATTR_MAP = { 'Aura': 'constituicao', 'Mana': 'intelecto', 'Fé': 'vontade' };
function energyAttrKey() { return ENERGY_ATTR_MAP[state.energyType] || null; }
function energyAttrLabel() {
  const k = energyAttrKey();
  const found = ATTR_KEYS.find(([key]) => key === k);
  return found ? found[1] : '';
}
function rollDie(sides) { return 1 + Math.floor(Math.random() * sides); }

// Botão de rolar o dado de vida por nível: soma o valor rolado a TODAS as
// partes do corpo ao mesmo tempo. Libera 1 rolagem por nível ganho.
function renderHpDiceRow() {
  const box = document.getElementById('hpDiceRow');
  if (!box) return;
  const res = state.resources;
  const sides = currentHpDieSides();
  const pending = pendingLevelRolls(res.hpDieRolls);
  box.innerHTML = `
    <div class="resource-row">
      <span class="resource-label">Dado de vida — 1d${sides} por nível (bônus atual: +${res.hpDieBonus || 0} em cada parte)</span>
      <div class="resource-inputs">
        ${pending > 0
          ? `<button type="button" class="btn secondary small" id="hpDiceRollBtn" style="width:auto;">🎲 Rolar 1d${sides} (${pending} pendente${pending > 1 ? 's' : ''})</button>`
          : `<span class="hint" style="margin:0;">Sem rolagens pendentes.</span>`}
      </div>
    </div>`;
  const btn = document.getElementById('hpDiceRollBtn');
  if (btn) btn.addEventListener('click', () => {
    const roll = rollDie(currentHpDieSides());
    res.hpDieBonus = (res.hpDieBonus || 0) + roll;
    res.hpDieRolls = (res.hpDieRolls || 0) + 1;
    // O valor rolado soma em TODAS as partes do corpo ao mesmo tempo — no
    // máximo e também no atual (ganho real de HP, não uma cura completa).
    BODY_PARTS.forEach(([k]) => {
      if (res.hp[k] && res.hp[k].cur !== undefined && res.hp[k].cur !== null) {
        res.hp[k].cur += roll;
      }
    });
    renderHpParts();
  });
}
// Campos para o jogador registrar o novo dado de vida nas Mudanças de
// Classe (níveis 4, 8, 12, 16, 20). O valor digitado (lado do dado, ex.: 8
// para d8) passa a valer para as rolagens seguintes a partir daquele nível.
function renderHpMilestones() {
  const box = document.getElementById('hpMilestonesBox');
  if (!box) return;
  const res = state.resources;
  if (!res.hpDieMilestones) res.hpDieMilestones = { 4: null, 8: null, 12: null, 16: null, 20: null };
  box.innerHTML = `
    <div class="resource-row" style="flex-wrap:wrap;">
      <span class="resource-label" style="flex-basis:100%;">Novo dado de vida nas Mudanças de Classe</span>
      ${HP_DICE_MILESTONES.map(lvl => `
        <div style="display:flex; align-items:center; gap:4px; margin-right:10px;">
          <label style="font-size:0.85em;">Nível ${lvl}: d</label>
          <input type="number" min="1" data-hp-milestone="${lvl}" value="${res.hpDieMilestones[lvl] || ''}" style="width:56px;">
        </div>`).join('')}
    </div>
    <p class="hint" style="margin:0 0 10px;">Preencha o novo dado (ex.: 8 para d8) quando seu personagem mudar de classe. A partir do nível informado, as rolagens do dado de vida passam a usar esse novo dado.</p>`;
  box.querySelectorAll('[data-hp-milestone]').forEach(inp => {
    inp.addEventListener('input', () => {
      const lvl = inp.dataset.hpMilestone;
      const v = parseInt(inp.value) || null;
      res.hpDieMilestones[lvl] = v;
      renderHpDiceRow();
    });
  });
}
function renderHpParts() {
  const box = document.getElementById('hpPartsBox');
  if (!box) return;
  if (!state.resources.hp) state.resources.hp = emptyResources().hp;
  renderHpDiceRow();
  renderHpMilestones();
  box.innerHTML = BODY_PARTS.map(([k, label]) => {
    const max = hpMaxForPart(k);
    const existing = state.resources.hp[k];
    const cur = (existing && existing.cur !== undefined && existing.cur !== null) ? existing.cur : max;
    state.resources.hp[k] = { max, cur };
    return `
      <div class="hp-part-row">
        <span class="hp-part-name">${label}</span>
        <div class="hp-part-inputs">
          <div><label>Atual</label><input type="number" data-hp="${k}" data-field="cur" min="0" max="${max}" value="${cur}"></div>
          <span>/ ${max} (máx.)</span>
        </div>
      </div>`;
  }).join('');
  box.querySelectorAll('[data-hp]').forEach(inp => {
    inp.addEventListener('input', () => {
      const k = inp.dataset.hp;
      // O jogador nunca pode colocar mais HP atual do que o máximo daquela parte.
      const max = state.resources.hp[k].max;
      let v = parseInt(inp.value) || 0;
      if (v > max) v = max;
      if (v < 0) v = 0;
      inp.value = v;
      state.resources.hp[k].cur = v;
    });
  });
}
function renderSanityBox() {
  const box = document.getElementById('sanityBox');
  if (!box) return;
  const max = sanityMax();
  const cur = (state.resources.sanityCur === null || state.resources.sanityCur === undefined) ? max : state.resources.sanityCur;
  box.innerHTML = `
    <div class="resource-row">
      <span class="resource-label">Sanidade — 10 + mod. Vontade</span>
      <div class="resource-inputs">
        <input type="number" id="sanityCurInput" value="${cur}"> <span>/ ${max} (máx.)</span>
      </div>
    </div>`;
  document.getElementById('sanityCurInput').addEventListener('input', (e) => {
    state.resources.sanityCur = parseInt(e.target.value) || 0;
  });
}
// Estamina (1d15 + Constituição) e Energia (1d12 + Vontade/Intelecto/Constituição,
// conforme a energia escolhida) seguem o mesmo padrão:
//  - Na criação da ficha, o jogador rola o dado uma vez (e pode rolar de novo
//    até 2 vezes no total) para definir o resultado que fica fixo na ficha.
//  - Depois de criada, o dado já rolado NUNCA muda — mas o valor máximo
//    exibido continua sendo recalculado (dado + atributo atual), então ele
//    aumenta junto quando o jogador evolui o atributo correspondente na
//    edição.
//  - Fichas criadas antes desta atualização não têm dado registrado
//    (die === null): elas continuam com os campos numéricos antigos,
//    editáveis à mão, para não perder os valores já salvos.
// energyBonusEnabled: só true pra Energia (Mana/Fé/Aura) — soma o bônus de
// traço racial ao reservatório (ver traitEnergyBonus() em editor-core.js).
// Não se aplica à Estamina, que não é "energia de classe".
function renderResourceDiceRow({ boxId, curField, dieField, rollsField, sides, attrKey, label, formulaLabel, missingAttrHint, levelBonusField, levelRollsField, energyBonusEnabled }) {
  const box = document.getElementById(boxId);
  if (!box) return;
  const res = state.resources;
  const die = res[dieField];
  const levelBonus = res[levelBonusField] || 0;
  const energyBonus = energyBonusEnabled ? traitEnergyBonus() : null;
  // O percentual (Reservatório Ampliado) é aplicado por último, sobre o
  // total já com dado + atributo + dado de nível + bônus fixo de traço —
  // igual o próprio texto do traço descreve.
  function applyEnergyBonus(base) {
    if (!energyBonus) return base;
    const withFlat = base + energyBonus.flat;
    return withFlat + Math.floor(withFlat * energyBonus.percent / 100);
  }
  function energyBonusLabel() {
    if (!energyBonus || (!energyBonus.flat && !energyBonus.percent)) return '';
    const parts = [];
    if (energyBonus.flat) parts.push(`+${energyBonus.flat}`);
    if (energyBonus.percent) parts.push(`+${energyBonus.percent}%`);
    return ` + ${parts.join(' ')} (traço)`;
  }

  if (die === null || die === undefined) {
    if (!editingSheetId) {
      // Criação da ficha: ainda não rolou. Se não há atributo de energia
      // definido ainda (ex.: energia não escolhida), avisa em vez de rolar.
      if (!attrKey) {
        box.innerHTML = `
          <div class="resource-row">
            <span class="resource-label">${label}</span>
            <div class="resource-inputs"><span class="hint" style="margin:0;">${missingAttrHint}</span></div>
          </div>`;
        return;
      }
      box.innerHTML = `
        <div class="resource-row">
          <span class="resource-label">${label} — ${formulaLabel}</span>
          <div class="resource-inputs">
            <button type="button" class="btn secondary small" id="${boxId}RollBtn" style="width:auto;">🎲 Rolar 1d${sides}</button>
          </div>
        </div>`;
      document.getElementById(`${boxId}RollBtn`).addEventListener('click', () => {
        res[dieField] = rollDie(sides);
        res[rollsField] = 1;
        const max = applyEnergyBonus(res[dieField] + attrTotalValue(attrKey) + levelBonus);
        res[curField.max] = max;
        res[curField.cur] = max;
        renderStaminaVigorBox();
      });
    } else {
      // Ficha antiga sem dado registrado — mantém a edição manual de sempre.
      box.innerHTML = `
        <div class="resource-row">
          <span class="resource-label">${label}</span>
          <div class="resource-inputs">
            <input type="number" id="${boxId}CurInput" value="${res[curField.cur] || 0}">
            <span>/</span>
            <input type="number" id="${boxId}MaxInput" value="${res[curField.max] || 0}">
          </div>
        </div>`;
      document.getElementById(`${boxId}CurInput`).addEventListener('input', e => { res[curField.cur] = parseInt(e.target.value) || 0; });
      document.getElementById(`${boxId}MaxInput`).addEventListener('input', e => { res[curField.max] = parseInt(e.target.value) || 0; });
    }
    return;
  }

  // Dado já rolado: o máximo é sempre recalculado (dado fixo + atributo atual + bônus de nível + bônus de traço de energia, se houver).
  const max = applyEnergyBonus(die + (attrKey ? attrTotalValue(attrKey) : 0) + levelBonus);
  res[curField.max] = max;
  if (res[curField.cur] === undefined || res[curField.cur] === null) res[curField.cur] = max;
  const rolls = res[rollsField] || 0;
  const canReroll = !editingSheetId && rolls < 2;
  box.innerHTML = `
    <div class="resource-row">
      <span class="resource-label">${label} — 1d${sides} (rolado: ${die}) + ${attrKeyLabel(attrKey)}${levelBonus ? ` + ${levelBonus} (dado de nível)` : ''}${energyBonusLabel()}</span>
      <div class="resource-inputs">
        <input type="number" id="${boxId}CurInput" min="0" max="${max}" value="${res[curField.cur]}">
        <span>/ ${max} (máx.)</span>
        ${canReroll ? `<button type="button" class="btn secondary small" id="${boxId}RerollBtn" style="width:auto; margin-left:8px;">🎲 Rolar de novo (${2 - rolls}/2)</button>` : ''}
      </div>
    </div>`;
  document.getElementById(`${boxId}CurInput`).addEventListener('input', e => {
    let v = parseInt(e.target.value) || 0;
    if (v > max) v = max;
    if (v < 0) v = 0;
    e.target.value = v;
    res[curField.cur] = v;
  });
  if (canReroll) {
    document.getElementById(`${boxId}RerollBtn`).addEventListener('click', () => {
      res[dieField] = rollDie(sides);
      res[rollsField] = rolls + 1;
      const newMax = applyEnergyBonus(res[dieField] + (attrKey ? attrTotalValue(attrKey) : 0) + levelBonus);
      res[curField.max] = newMax;
      res[curField.cur] = newMax;
      renderStaminaVigorBox();
    });
  }
}
function attrKeyLabel(k) {
  const found = ATTR_KEYS.find(([key]) => key === k);
  return found ? found[1] : '—';
}
// Botão de rolar o dado de nível (sempre 1d10) para Estamina/Energia. Some
// direto ao total (fora da fórmula de criação), liberando 1 rolagem por
// nível ganho — igual ao dado de vida.
const LEVEL_DIE_SIDES = 10;
function renderLevelDiceRow({ rowId, bonusField, rollsField, curField, label }) {
  const box = document.getElementById(rowId);
  if (!box) return;
  const res = state.resources;
  const pending = pendingLevelRolls(res[rollsField]);
  box.innerHTML = `
    <div class="resource-row">
      <span class="resource-label">Dado de nível (${label}) — 1d${LEVEL_DIE_SIDES} por nível (bônus atual: +${res[bonusField] || 0})</span>
      <div class="resource-inputs">
        ${pending > 0
          ? `<button type="button" class="btn secondary small" id="${rowId}Btn" style="width:auto;">🎲 Rolar 1d${LEVEL_DIE_SIDES} (${pending} pendente${pending > 1 ? 's' : ''})</button>`
          : `<span class="hint" style="margin:0;">Sem rolagens pendentes.</span>`}
      </div>
    </div>`;
  const btn = document.getElementById(`${rowId}Btn`);
  if (btn) btn.addEventListener('click', () => {
    const roll = rollDie(LEVEL_DIE_SIDES);
    res[bonusField] = (res[bonusField] || 0) + roll;
    res[rollsField] = (res[rollsField] || 0) + 1;
    // O ganho da rolagem soma direto no valor atual também (não só no máximo),
    // igual ganhar HP de verdade ao subir de nível — não é uma cura completa.
    if (res[curField] !== undefined && res[curField] !== null) res[curField] += roll;
    renderStaminaVigorBox();
  });
}
function renderStaminaVigorBox() {
  renderLevelDiceRow({
    rowId: 'estaminaDiceRow', bonusField: 'estaminaLevelBonus', rollsField: 'estaminaLevelRolls',
    curField: 'estaminaCur', label: 'Estamina'
  });
  renderResourceDiceRow({
    boxId: 'estaminaBox', curField: { cur: 'estaminaCur', max: 'estaminaMax' },
    dieField: 'estaminaDie', rollsField: 'estaminaRolls',
    sides: 15, attrKey: 'constituicao', label: 'Estamina',
    formulaLabel: '1d15 + Constituição', missingAttrHint: '',
    levelBonusField: 'estaminaLevelBonus', levelRollsField: 'estaminaLevelRolls'
  });
  renderLevelDiceRow({
    rowId: 'vigorDiceRow', bonusField: 'vigorLevelBonus', rollsField: 'vigorLevelRolls',
    curField: 'vigorCur', label: 'Energia'
  });
  renderResourceDiceRow({
    boxId: 'vigorBox', curField: { cur: 'vigorCur', max: 'vigorMax' },
    dieField: 'vigorDie', rollsField: 'vigorRolls',
    sides: 12, attrKey: energyAttrKey(), label: 'Energia',
    formulaLabel: `1d12 + ${energyAttrLabel()}`,
    missingAttrHint: 'Escolha uma energia (Aura, Mana ou Fé) na etapa 1 para poder rolar a Energia.',
    levelBonusField: 'vigorLevelBonus', levelRollsField: 'vigorLevelRolls',
    energyBonusEnabled: true
  });
}
// ================= ECONOMIA (moedas: Bronze, Prata, Ouro, Platina) =================
const COIN_TYPES = [
  ['bronze', 'Bronze'], ['prata', 'Prata'], ['ouro', 'Ouro'], ['platina', 'Platina']
];
function ensureEconomy() {
  if (!state.resources) state.resources = emptyResources();
  if (!state.resources.economy) state.resources.economy = { bronze: 0, prata: 0, ouro: 0, platina: 0 };
  return state.resources.economy;
}
// Converte tudo para o equivalente em Bronze só para exibição de referência
// (1 Platina = 10 Ouros = 100 Pratas = 1.000 Bronzes), conforme o livro.
function economyTotalInBronze(eco) {
  return (eco.bronze || 0) + (eco.prata || 0) * 10 + (eco.ouro || 0) * 100 + (eco.platina || 0) * 1000;
}
function renderEconomy() {
  const box = document.getElementById('economyBox');
  if (!box) return;
  const eco = ensureEconomy();
  box.innerHTML = COIN_TYPES.map(([k, label]) => `
    <div class="resource-row">
      <span class="resource-label">${label}</span>
      <div class="resource-inputs">
        <input type="number" min="0" data-coin="${k}" value="${eco[k] || 0}">
      </div>
    </div>`).join('') + `
    <p class="hint" id="economyTotalHint" style="margin:8px 0 0;">Total equivalente: ${economyTotalInBronze(eco)} Bronzes.</p>`;
  box.querySelectorAll('[data-coin]').forEach(inp => {
    inp.addEventListener('input', () => {
      const eco2 = ensureEconomy();
      eco2[inp.dataset.coin] = Math.max(0, parseInt(inp.value) || 0);
      const hint = document.getElementById('economyTotalHint');
      if (hint) hint.textContent = `Total equivalente: ${economyTotalInBronze(eco2)} Bronzes.`;
    });
  });
}

// ================= TÉCNICAS =================
// Mesma estrutura das habilidades: custo também é texto livre (o jogador
// escreve o recurso que a técnica consome — Estamina, Energia, Sanidade,
// HP, o que fizer sentido — em vez de escolher entre opções fixas).
function migrateTechniqueCost(t) {
  if (!t.cost && t.costAmount && t.costType) t.cost = `${t.costAmount} ${t.costType}`;
  t.cost = t.cost || '';
  delete t.costAmount; delete t.costType;
  t.actionType = t.actionType || '';
}
function techniqueCostLabel(t) {
  return t.cost || '';
}
let editingTechniqueIndex = null;
function renderTechniques() {
  const list = document.getElementById('techniquesList');
  if (!list) return;
  if (!state.techniques.length) {
    list.innerHTML = `<p class="hint" style="margin:0 0 10px;">Nenhuma técnica criada ainda.</p>`;
  } else {
    list.innerHTML = state.techniques.map((t, i) => {
      const costLabel = techniqueCostLabel(t);
      return `
      <div class="ability-row">
        <div class="ability-head">
          <b>${escapeHtml(t.name)}</b>
          ${t.actionType ? `<span class="atype">${escapeHtml(t.actionType)}</span>` : ''}
          ${costLabel ? `<span class="tcost">${escapeHtml(costLabel)}</span>` : ''}
          <button type="button" class="skill-remove" data-edit-technique="${i}" title="Editar" style="margin-left:auto;">✎</button>
          <button type="button" class="skill-remove" data-remove-technique="${i}" title="Remover">✕</button>
        </div>
        ${t.desc ? `<div class="ability-desc">${escapeHtml(t.desc)}</div>` : ''}
      </div>`;
    }).join('');
  }
  list.querySelectorAll('[data-remove-technique]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.removeTechnique);
      if (editingTechniqueIndex === idx) cancelTechniqueEdit();
      state.techniques.splice(idx, 1);
      renderTechniques();
    });
  });
  list.querySelectorAll('[data-edit-technique]').forEach(btn => {
    btn.addEventListener('click', () => startTechniqueEdit(parseInt(btn.dataset.editTechnique)));
  });
}
function startTechniqueEdit(index) {
  const t = state.techniques[index];
  if (!t) return;
  editingTechniqueIndex = index;
  document.getElementById('newTechniqueName').value = t.name || '';
  document.getElementById('newTechniqueCost').value = t.cost || '';
  document.getElementById('newTechniqueActionType').value = t.actionType || '';
  document.getElementById('newTechniqueDesc').value = t.desc || '';
  const addBtn = document.getElementById('addTechniqueBtn');
  const cancelBtn = document.getElementById('cancelTechniqueEditBtn');
  if (addBtn) addBtn.textContent = 'Salvar edição';
  if (cancelBtn) cancelBtn.style.display = '';
  document.getElementById('newTechniqueName').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function cancelTechniqueEdit() {
  editingTechniqueIndex = null;
  const nameEl = document.getElementById('newTechniqueName');
  const costEl = document.getElementById('newTechniqueCost');
  const actionTypeEl = document.getElementById('newTechniqueActionType');
  const descEl = document.getElementById('newTechniqueDesc');
  if (nameEl) nameEl.value = '';
  if (costEl) costEl.value = '';
  if (actionTypeEl) actionTypeEl.value = '';
  if (descEl) descEl.value = '';
  const addBtn = document.getElementById('addTechniqueBtn');
  const cancelBtn = document.getElementById('cancelTechniqueEditBtn');
  if (addBtn) addBtn.textContent = '+ Adicionar técnica';
  if (cancelBtn) cancelBtn.style.display = 'none';
}
function initTechniquesUI() {
  const btn = document.getElementById('addTechniqueBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const nameEl = document.getElementById('newTechniqueName');
    const costEl = document.getElementById('newTechniqueCost');
    const actionTypeEl = document.getElementById('newTechniqueActionType');
    const descEl = document.getElementById('newTechniqueDesc');
    const name = nameEl.value.trim();
    if (!name) return;
    const technique = {
      name,
      cost: costEl.value.trim(),
      actionType: actionTypeEl.value,
      desc: descEl.value.trim()
    };
    if (editingTechniqueIndex !== null && state.techniques[editingTechniqueIndex]) {
      state.techniques[editingTechniqueIndex] = technique;
    } else {
      state.techniques.push(technique);
    }
    cancelTechniqueEdit();
    renderTechniques();
    nameEl.focus();
  });
  const cancelBtn = document.getElementById('cancelTechniqueEditBtn');
  if (cancelBtn) cancelBtn.addEventListener('click', cancelTechniqueEdit);
}

function renderResources() {
  if (!state.resources) state.resources = emptyResources();
  renderHpParts();
  renderSanityBox();
  renderStaminaVigorBox();
  renderEconomy();
  // A Capacidade de Carga depende da Constituição total, então recalcula o
  // painel de peso sempre que renderResources() roda (mudança de atributo,
  // nível, traço etc.) — sem isso o painel ficaria desatualizado depois de
  // qualquer ajuste que não mexa diretamente no inventário.
  if (typeof renderInventoryWeightSummary === 'function') renderInventoryWeightSummary();
}

function flashMsg(elId, text, isError) {
  const el = document.getElementById(elId);
  el.innerHTML = `<div class="${isError ? 'error-msg' : 'ok-msg'}">${escapeHtml(text)}</div>`;
  setTimeout(() => { if (el.innerHTML.includes(text)) el.innerHTML = ''; }, 3500);
}


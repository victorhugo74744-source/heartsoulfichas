// editor-misc.js — parte de js/editor.js, dividido em Ago/2026 porque o arquivo
// único tinha passado de 1900 linhas. Validação do formulário, listas de linha (inventário/anotações), seleção de pasta/campanha e upload de imagem de aparência.
// Carregado como script global comum (sem módulos ES) — ver ordem exigida
// em ficha-editor.html. Funções e variáveis aqui são globais e usadas
// livremente pelos outros arquivos editor-*.js.

// ================= VALIDATION =================
function validateAll() {
  const errors = [];
  if (!state.characterName.trim()) errors.push('Dê um nome ao personagem.');
  if (!state.energyType) errors.push('Escolha uma energia (Aura, Mana ou Fé).');
  if (attrPoolSpent() > attrPoolMax()) errors.push('Você gastou mais pontos de atributo do que tem.');
  if (skillPoolSpent() > skillPoolMax()) errors.push('Você gastou mais pontos de perícia do que tem.');
  if (state.skills.some(s => s.points > skillCapPerSkill())) errors.push(`Nenhuma perícia pode ultrapassar +${skillCapPerSkill()} no seu nível atual.`);
  if (!state.raceId) errors.push('Escolha uma raça.');
  else if (state.raceOptionalChosen.length !== 2) errors.push('Escolha exatamente 2 traços raciais opcionais.');
  else {
    const raceCheck = DATA.races.find(r => r.id === state.raceId);
    if (raceCheck && raceCheck.variantChoice && (state.raceVariantChosen === null || state.raceVariantChosen === undefined)) {
      errors.push(`Escolha uma opção em "${raceCheck.variantChoice.label}".`);
    }
  }
  if (traitPoolSpent() > traitPoolMax()) errors.push('Você gastou mais pontos de traço do que tem.');
  if (!hasMalignTrait()) errors.push('Escolha ao menos 1 Traço Maligno.');
  return errors;
}

// ================= LINE-LISTS (Inventário / Anotações) =================
// Em vez de uma caixa de texto única e infinita, cada item é uma linha própria
// e a lista vai expandindo conforme o jogador adiciona mais linhas.
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

// ================= INVENTÁRIO (itens estruturados: nome + peso + qtd) =================
// Cada linha do inventário virou um item estruturado — nome, peso unitário
// (conforme a mecânica de Peso do livro de regras) e quantidade — em vez de
// texto livre. Um painel logo abaixo soma peso × quantidade de todos os
// itens e mostra a Capacidade de Carga (15 + mod. Constituição) e a faixa
// de penalidade atual (Normal / Carga Pesada / Carga Máxima / Sobrecarga).
function autoExpandTextarea(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}
// Compatibilidade: fichas salvas antes desta atualização guardavam cada
// item como uma string solta ("Espada longa"). Elas viram um item com peso 0
// e quantidade 1 — o jogador só precisa preencher o peso depois.
// Consumível: um item pode marcar um efeito (Cura/Dano/Buff/Debuff/
// Recuperar Estamina/Recuperar Energia) — o campo effectValue é opcional e
// usa a mesma notação de dado da mesa (ex.: "1d8+2"); effectDesc é texto
// livre, essencial pra Buff/Debuff (que não têm um número pra rolar) e
// opcional como observação extra nos demais tipos.
const CONSUMABLE_EFFECT_TYPES = [
  ['cura', '💚 Cura'], ['dano', '⚔️ Dano'], ['buff', '✨ Buff'], ['debuff', '☠️ Debuff'],
  ['estamina', '🏃 Recuperar Estamina'], ['energia', '⚡ Recuperar Energia']
];
function ensureInventoryItemShape(it) {
  if (typeof it === 'string') return { name: it, weight: 0, qty: 1, consumable: false, effectType: '', effectValue: '', effectDesc: '' };
  return {
    name: (it && it.name) || '',
    weight: (it && it.weight !== undefined && it.weight !== null) ? it.weight : 0,
    qty: (it && it.qty !== undefined && it.qty !== null) ? it.qty : 1,
    consumable: !!(it && it.consumable),
    effectType: (it && it.effectType) || '',
    effectValue: (it && it.effectValue) || '',
    effectDesc: (it && it.effectDesc) || ''
  };
}
function initInventoryUI() {
  const box = document.getElementById('fInventory');
  if (!box) return;
  if (!state.inventoryItems || !state.inventoryItems.length) state.inventoryItems = [{ name: '', weight: 0, qty: 1, consumable: false, effectType: '', effectValue: '', effectDesc: '' }];
  state.inventoryItems = state.inventoryItems.map(ensureInventoryItemShape);
  renderInventoryUI();
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
      <label class="inv-consumable-toggle"><input type="checkbox" data-inv-consumable="${i}" ${it.consumable ? 'checked' : ''}> 🧪 Consumível (tem um efeito ao usar)</label>
      ${it.consumable ? `
      <div class="inv-effect-fields">
        <select data-inv-effect-type="${i}">
          <option value="">Tipo de efeito…</option>
          ${CONSUMABLE_EFFECT_TYPES.map(([v, label]) => `<option value="${v}" ${it.effectType === v ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
        <input type="text" class="inv-effect-value" data-inv-effect-value="${i}" placeholder="Dado/valor (ex.: 1d8+2)" value="${escapeHtml(it.effectValue)}" title="Opcional — notação de dado usada na rolagem da mesa (ex.: 1d8+2). Deixe em branco se o efeito não tem um número pra rolar (comum em Buff/Debuff).">
        <input type="text" class="inv-effect-desc" data-inv-effect-desc="${i}" placeholder="Descrição do efeito (ex.: +2 Força por 3 rodadas)" value="${escapeHtml(it.effectDesc)}">
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
  box.querySelectorAll('[data-inv-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (items.length <= 1) return;
      items.splice(parseInt(btn.dataset.invRemove), 1);
      renderInventoryUI();
    });
  });
  const addBtn = box.querySelector('[data-inv-add]');
  if (addBtn) addBtn.addEventListener('click', () => {
    items.push({ name: '', weight: 0, qty: 1, consumable: false, effectType: '', effectValue: '', effectDesc: '' });
    renderInventoryUI();
    const nameInputs = box.querySelectorAll('[data-inv-name]');
    nameInputs[nameInputs.length - 1].focus();
  });

  renderInventoryWeightSummary();
}
// Painel de capacidade — chamado sempre que peso/quantidade de um item muda
// e também pelo renderResources() (definido em editor-abilities.js), que já
// é disparado toda vez que a Constituição muda, então o total acompanha o
// atributo automaticamente.
function renderInventoryWeightSummary() {
  const el = document.getElementById('inventoryWeightSummary');
  if (!el) return;
  const capacity = carryCapacity();
  const total = inventoryTotalWeight();
  const st = weightStatus(total, capacity);
  const tagClass = st.key === 'normal' ? 'benign' : (st.key === 'pesada' ? 'info' : 'malign');
  el.innerHTML = `
    <div class="weight-summary-row">
      <span>Peso total: <b style="color:var(--gold);">${total}</b> / ${capacity} (Capacidade de Carga)</span>
      <span class="tag ${tagClass}">${st.label}</span>
    </div>
    ${st.penalty ? `<p class="hint" style="margin:6px 0 0;">${st.penalty} em todos os testes físicos (Força, Destreza e Constituição)${st.note ? ' · ' + st.note : ''}</p>` : ''}
  `;
}

// ================= ANOTAÇÕES (mesma caixa única do Inventário) =================
function initNotesUI() {
  const ta = document.getElementById('fNotes');
  if (!ta) return;
  ta.value = (state.notes || []).join('\n');
  autoExpandTextarea(ta);
  ta.addEventListener('input', () => autoExpandTextarea(ta));
}

// ================= PASTA / CAMPANHA =================
// Lista as pastas que o Mestre já criou (painel do Mestre), pra o jogador
// escolher em qual campanha essa ficha entra. Uma ficha sem pasta escolhida
// fica solta (compatível com fichas salvas antes desse recurso existir).
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

// ================= APARÊNCIA (imagem) =================
// Em vez de um link (URL), o jogador faz upload direto do arquivo de imagem.
// A imagem é redimensionada no navegador (canvas) e convertida para base64
// antes de ser salva, pra caber no limite de tamanho de um documento.
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


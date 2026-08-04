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

// ================= INVENTÁRIO (caixa única, expande para baixo) =================
// Em vez de uma linha por item com botão de "+ Adicionar linha", o Inventário
// agora é uma única caixa de texto (um item por linha) que cresce em altura
// conforme o jogador digita, ao invés de estourar/rolar para o lado.
function autoExpandTextarea(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}
function initInventoryUI() {
  const ta = document.getElementById('fInventory');
  if (!ta) return;
  ta.value = (state.inventoryItems || []).join('\n');
  autoExpandTextarea(ta);
  ta.addEventListener('input', () => autoExpandTextarea(ta));
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


// ============================================================
// Biblioteca de NPCs/Monstros: templates reaproveitáveis entre mesas,
// salvos por Mestre (coleção "npcTemplates", campo ownerId). Usado em
// dois lugares:
//   - master.html: só gerenciar (criar/editar/excluir), pra montar a
//     biblioteca fora de qualquer mesa específica.
//   - mesa.html: gerenciar E colocar direto na cena atual com um clique
//     (allowAddToTable:true), sem precisar preencher o form de NPC de
//     novo toda sessão.
// Carregado nas duas páginas — por isso NÃO depende de nada definido em
// mesa-board.js/mesa-dice.js (que master.html não carrega); os poucos
// helpers que precisa (corte de imagem, partes do corpo) são duplicados
// aqui de propósito, isolados sob o prefixo "npcLib" pra nunca colidir
// com as versões usadas só dentro da mesa.
// ============================================================

const NPC_LIB_BODY_PARTS = [
  ['cabeca', 'Cabeça'], ['tronco', 'Tronco'],
  ['braco_esq', 'Braço Esquerdo'], ['braco_dir', 'Braço Direito'],
  ['perna_esq', 'Perna Esquerda'], ['perna_dir', 'Perna Direita']
];
const NPC_LIB_DEFAULT_PART_HP = 10;
const NPC_LIB_DEFAULT_VISION_RADIUS = 12;

function npcLibResizeImage(file, maxDim) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('Escolha um arquivo de imagem válido.')); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2, sy = (img.height - side) / 2;
        const dim = Math.min(maxDim, side);
        const c = document.createElement('canvas');
        c.width = dim; c.height = dim;
        c.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, dim, dim);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('Não foi possível ler essa imagem.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Não foi possível ler esse arquivo.'));
    reader.readAsDataURL(file);
  });
}

function npcLibDefaultHp() {
  const hp = {};
  NPC_LIB_BODY_PARTS.forEach(([k]) => { hp[k] = NPC_LIB_DEFAULT_PART_HP; });
  return hp;
}

let npcLibTemplates = [];  // cache do último carregamento do painel ativo
let npcLibEditingId = null; // id do template em edição (null = form em modo "criar novo")

async function fetchNpcTemplates(uid) {
  const snap = await db.collection('npcTemplates').where('ownerId', '==', uid).get();
  const list = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
  list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
  return list;
}

// Monta o painel inteiro (form de criar/editar + lista) dentro do elemento
// de id "containerId". opts = { uid, allowAddToTable, onAddToTable(template) }
// — allowAddToTable/onAddToTable só fazem sentido dentro de uma mesa (ver
// mesa-tokens.js); no Painel do Mestre (master.js) ficam de fora.
function initNpcLibraryPanel(containerId, opts) {
  const box = document.getElementById(containerId);
  if (!box) return;
  box.innerHTML = '<p class="tc-meta">Carregando biblioteca…</p>';
  npcLibEditingId = null;
  loadAndRenderNpcLibrary(box, opts);
}

async function loadAndRenderNpcLibrary(box, opts) {
  try {
    npcLibTemplates = await fetchNpcTemplates(opts.uid);
  } catch (err) {
    box.innerHTML = `<div class="error-msg">Erro ao carregar biblioteca: ${escapeHtml(err.message)}</div>`;
    return;
  }
  renderNpcLibraryUI(box, opts);
}

function renderNpcLibraryUI(box, opts) {
  const editing = npcLibEditingId ? npcLibTemplates.find(t => t.id === npcLibEditingId) : null;
  const formHp = Object.assign({}, npcLibDefaultHp(), (editing && editing.hp) || {});
  const visionOn = !!(editing && editing.visionOn);
  const visionRadius = (editing && editing.visionRadius) || NPC_LIB_DEFAULT_VISION_RADIUS;

  box.innerHTML = `
    <div class="npc-lib-form">
      <h4 class="npc-lib-form-title">${editing ? '✏️ Editando: ' + escapeHtml(editing.name || '') : '✦ Novo NPC/Monstro'}</h4>
      <div class="npc-lib-form-grid">
        <div>
          <div class="field"><input type="text" id="npcLibName" placeholder="Nome (ex.: Lobo Sombrio)" value="${escapeHtml(editing ? editing.name || '' : '')}"></div>
          <div class="field"><input type="file" id="npcLibImage" accept="image/*"></div>
          <label class="npc-lib-color-row">
            Cor (aura e contorno na mesa)
            <input type="color" id="npcLibColor" value="${escapeHtml((editing && editing.color) || '#8f7a4c')}">
          </label>
        </div>
        ${editing && editing.image ? `<img src="${escapeHtml(editing.image)}" alt="" class="npc-lib-preview">` : ''}
      </div>
      <p class="npc-lib-subhead">HP padrão por parte do corpo</p>
      <div class="npc-lib-hp-grid">
        ${NPC_LIB_BODY_PARTS.map(([k, label]) => `
          <label class="npc-lib-hp-field">${label}
            <input type="number" min="0" step="1" data-npc-lib-hp="${k}" value="${formHp[k]}">
          </label>`).join('')}
      </div>
      <label class="inv-consumable-toggle npc-lib-vision-toggle">
        <input type="checkbox" id="npcLibVisionOn" ${visionOn ? 'checked' : ''}>
        👁 Já nasce enxergando (revela névoa sozinho)
      </label>
      <div class="field" id="npcLibVisionRadiusField" style="margin-top:6px; ${visionOn ? '' : 'display:none;'}">
        <input type="number" id="npcLibVisionRadius" min="1" step="1" placeholder="Alcance de visão (em quadrados)" value="${visionRadius}">
      </div>
      <div class="error-msg hidden" id="npcLibErr"></div>
      <div class="npc-lib-form-actions">
        <button class="btn small" id="npcLibSaveBtn" style="width:auto;">${editing ? 'Salvar alterações' : '💾 Salvar na biblioteca'}</button>
        ${editing ? `<button class="btn secondary small" id="npcLibCancelBtn" style="width:auto;">Cancelar</button>` : ''}
      </div>
    </div>
    <div class="npc-lib-section-head">
      <span class="npc-lib-section-title">📚 Biblioteca</span>
      <span class="npc-lib-count">${npcLibTemplates.length}</span>
    </div>
    ${npcLibTemplates.length === 0
      ? '<p class="npc-lib-empty">🗃️ Nenhum NPC salvo ainda — preencha o formulário acima pra começar.</p>'
      : `<div class="npc-lib-list">${npcLibTemplates.map(t => {
          const totalHp = NPC_LIB_BODY_PARTS.reduce((s, [k]) => s + ((t.hp && t.hp[k]) || 0), 0);
          return `
        <div class="npc-lib-card" style="border-left-color:${escapeHtml(t.color || '#8f7a4c')};">
          ${t.image ? `<img src="${escapeHtml(t.image)}" alt="" class="npc-lib-thumb">` : `<div class="npc-lib-thumb npc-lib-thumb-ph">👹</div>`}
          <div class="npc-lib-info">
            <b>${escapeHtml(t.name || 'Sem nome')}</b>
            <span class="npc-lib-badges">
              <span class="npc-lib-badge npc-lib-badge-hp">❤ ${totalHp} HP</span>
              ${t.visionOn ? '<span class="npc-lib-badge npc-lib-badge-vision">👁 visão</span>' : ''}
            </span>
          </div>
          <div class="npc-lib-actions">
            ${opts.allowAddToTable ? `<button class="btn small" data-npc-lib-add="${t.id}" style="width:auto;">+ Mesa</button>` : ''}
            <button class="btn secondary small" data-npc-lib-edit="${t.id}" style="width:auto;">✏️</button>
            <button class="skill-remove" data-npc-lib-delete="${t.id}" title="Excluir da biblioteca">✕</button>
          </div>
        </div>`;
        }).join('')}</div>`}
  `;

  const visionCheck = box.querySelector('#npcLibVisionOn');
  if (visionCheck) visionCheck.addEventListener('change', () => {
    box.querySelector('#npcLibVisionRadiusField').style.display = visionCheck.checked ? '' : 'none';
  });
  box.querySelector('#npcLibSaveBtn').addEventListener('click', () => saveNpcLibraryForm(box, opts));
  const cancelBtn = box.querySelector('#npcLibCancelBtn');
  if (cancelBtn) cancelBtn.addEventListener('click', () => { npcLibEditingId = null; renderNpcLibraryUI(box, opts); });
  box.querySelectorAll('[data-npc-lib-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      npcLibEditingId = btn.dataset.npcLibEdit;
      renderNpcLibraryUI(box, opts);
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  box.querySelectorAll('[data-npc-lib-delete]').forEach(btn => {
    btn.addEventListener('click', () => deleteNpcLibraryTemplate(box, opts, btn.dataset.npcLibDelete));
  });
  if (opts.allowAddToTable) {
    box.querySelectorAll('[data-npc-lib-add]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = npcLibTemplates.find(x => x.id === btn.dataset.npcLibAdd);
        if (t) opts.onAddToTable(t);
      });
    });
  }
}

async function saveNpcLibraryForm(box, opts) {
  const nameEl = box.querySelector('#npcLibName');
  const fileEl = box.querySelector('#npcLibImage');
  const colorEl = box.querySelector('#npcLibColor');
  const visionOnEl = box.querySelector('#npcLibVisionOn');
  const visionRadiusEl = box.querySelector('#npcLibVisionRadius');
  const errEl = box.querySelector('#npcLibErr');
  const name = nameEl.value.trim();
  if (!name) { errEl.textContent = 'Dê um nome pro NPC.'; errEl.classList.remove('hidden'); return; }

  const hp = {};
  NPC_LIB_BODY_PARTS.forEach(([k]) => {
    const inp = box.querySelector(`[data-npc-lib-hp="${k}"]`);
    hp[k] = Math.max(0, parseInt(inp.value, 10) || 0);
  });
  const editing = npcLibEditingId ? npcLibTemplates.find(t => t.id === npcLibEditingId) : null;
  const data = {
    ownerId: opts.uid,
    name,
    color: colorEl.value || '#8f7a4c',
    hp,
    visionOn: !!visionOnEl.checked,
    visionRadius: Math.max(1, parseInt(visionRadiusEl.value, 10) || NPC_LIB_DEFAULT_VISION_RADIUS),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  try {
    if (fileEl.files && fileEl.files[0]) data.image = await npcLibResizeImage(fileEl.files[0], 240);
    else data.image = (editing && editing.image) || '';

    if (editing) {
      await db.collection('npcTemplates').doc(editing.id).update(data);
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('npcTemplates').add(data);
    }
    npcLibEditingId = null;
    errEl.classList.add('hidden');
    await loadAndRenderNpcLibrary(box, opts);
  } catch (err) {
    errEl.textContent = 'Erro ao salvar: ' + err.message;
    errEl.classList.remove('hidden');
  }
}

async function deleteNpcLibraryTemplate(box, opts, id) {
  if (!confirm('Excluir este NPC da biblioteca? Isso não afeta tokens já colocados em mesas.')) return;
  try {
    await db.collection('npcTemplates').doc(id).delete();
    if (npcLibEditingId === id) npcLibEditingId = null;
    await loadAndRenderNpcLibrary(box, opts);
  } catch (err) {
    alert('Erro ao excluir: ' + err.message);
  }
}

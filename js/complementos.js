// js/complementos.js — Sistema de Complementos de campanha.
//
// Um Complemento é conteúdo extra que o MESTRE anexa a uma PASTA de
// campanha (a mesma pasta à qual a Mesa/tabuleiro pertence — ver campo
// "folderId" em /tables, firestore.rules). Quando a ficha de um jogador
// está nessa pasta, o complemento passa a valer para ela.
//
// Dois tipos possíveis (campo "tipo" do documento):
//  - "adiciona": uma lista de itens escolhíveis (um novo poder, raça,
//    item, ritual, o que a campanha precisar) que o jogador marca na
//    própria ficha, com um limite opcional de quantos pode escolher.
//  - "modifica": campos extras que passam a existir na ficha em si
//    (texto curto, número, texto longo ou marcador), preenchidos pelo
//    jogador — usado quando uma regra da campanha muda o MODELO da
//    ficha, não só adiciona uma opção de escolha.
//
// Guardado em /folders/{folderId}/complementos/{id}. Este arquivo é
// carregado em 3 páginas:
//  - master.html — gerenciar (criar/editar/excluir) por pasta;
//  - ficha-editor.html — escolher itens / preencher campos;
//  - ficha-view.html — mostrar o que já foi escolhido/preenchido.
// Script global comum (sem módulos ES), igual aos demais js/*.js do
// projeto — funções e variáveis aqui ficam disponíveis para os outros.

// ================= CRUD (Firestore) =================
async function getComplementos(folderId) {
  if (!folderId) return [];
  try {
    const snap = await db.collection('folders').doc(folderId).collection('complementos')
      .orderBy('createdAt').get();
    return snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
  } catch (err) {
    console.warn('Não foi possível carregar os complementos da pasta ' + folderId + ':', err);
    return [];
  }
}

function emptyComplementoItem() {
  return { id: 'ci' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), nome: '', custo: '', desc: '' };
}
function emptyComplementoCampo() {
  return { id: 'cf' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), label: '', tipo: 'texto', padrao: '' };
}

async function createComplemento(folderId, data) {
  return db.collection('folders').doc(folderId).collection('complementos').add(Object.assign({
    createdBy: auth.currentUser.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }, data));
}
async function updateComplemento(folderId, id, data) {
  return db.collection('folders').doc(folderId).collection('complementos').doc(id).update(data);
}
async function deleteComplemento(folderId, id) {
  return db.collection('folders').doc(folderId).collection('complementos').doc(id).delete();
}

const COMPLEMENTO_CAMPO_TIPOS = [
  ['texto', 'Texto curto'],
  ['numero', 'Número'],
  ['textarea', 'Texto longo'],
  ['checkbox', 'Marcador (sim/não)']
];

// ============================================================
// PAINEL DO MESTRE (master.html) — gerenciar complementos por pasta
// ============================================================
let cplFolders = [];         // fornecidas por quem chama initComplementosPanel
let cplGetFolders = () => [];
let cplFolderId = '';
let cplList = [];
let cplEditingId = null;     // null = form fechado; '' = criando novo; id = editando existente
let cplFormTipo = 'adiciona';
let cplFormItens = [];
let cplFormCampos = [];

// containerId: onde montar o painel inteiro. opts.getFolders(): função que
// devolve a lista atual de pastas do Mestre (master.js já mantém isso em
// "allFolders") — assim este painel nunca fica com a lista de pastas
// desatualizada quando uma pasta nova é criada/excluída ali do lado.
function initComplementosPanel(containerId, opts) {
  const box = document.getElementById(containerId);
  if (!box) return;
  cplGetFolders = (opts && opts.getFolders) || (() => []);
  cplFolderId = '';
  cplList = [];
  cplEditingId = null;
  renderComplementosPanel(box);
}

// Chamada por master.js sempre que a lista de pastas muda (criar/excluir
// pasta), pra manter o seletor deste painel em dia sem perder a pasta e o
// formulário que já estavam abertos.
function refreshComplementosPanelFolders(containerId) {
  const box = document.getElementById(containerId);
  if (!box) return;
  renderComplementosPanel(box);
}

function renderComplementosPanel(box) {
  cplFolders = cplGetFolders() || [];
  if (!cplFolders.some(f => f.id === cplFolderId)) cplFolderId = '';

  const folderSelectHtml = `
    <div class="field cpl-folder-field">
      <label>Pasta / campanha</label>
      <select id="cplFolderSelect">
        <option value="">Escolha uma pasta…</option>
        ${cplFolders.map(f => `<option value="${f.id}"${f.id === cplFolderId ? ' selected' : ''}>${escapeHtml(f.name)}</option>`).join('')}
      </select>
    </div>`;

  if (!cplFolders.length) {
    box.innerHTML = `${folderSelectHtml}<p class="hint" style="margin-top:10px;">Crie uma pasta de campanha acima antes de montar um complemento.</p>`;
    return;
  }

  if (!cplFolderId) {
    box.innerHTML = `${folderSelectHtml}<p class="hint" style="margin-top:10px;">Escolha uma pasta para ver ou criar os complementos dela.</p>`;
    wireComplementosFolderSelect(box);
    return;
  }

  box.innerHTML = `
    ${folderSelectHtml}
    <div id="cplListBox" style="margin-top:14px;"><p class="hint">Carregando complementos…</p></div>
    <div id="cplFormBox" style="margin-top:16px;"></div>
  `;
  wireComplementosFolderSelect(box);
  loadAndRenderComplementosList(box);
}

function wireComplementosFolderSelect(box) {
  const sel = box.querySelector('#cplFolderSelect');
  if (!sel) return;
  sel.addEventListener('change', () => {
    cplFolderId = sel.value || '';
    cplEditingId = null;
    renderComplementosPanel(box);
  });
}

async function loadAndRenderComplementosList(box) {
  const listBox = box.querySelector('#cplListBox');
  try {
    cplList = await getComplementos(cplFolderId);
  } catch (err) {
    listBox.innerHTML = `<div class="error-msg">Erro ao carregar complementos: ${escapeHtml(err.message)}</div>`;
    return;
  }
  renderComplementosListUI(box);
}

function renderComplementosListUI(box) {
  const listBox = box.querySelector('#cplListBox');
  const formBox = box.querySelector('#cplFormBox');

  listBox.innerHTML = `
    <div class="cpl-list-head">
      <h3>Complementos desta pasta</h3>
      <button type="button" class="btn small" id="cplNewBtn">+ Novo complemento</button>
    </div>
    ${cplList.length ? `<div class="complemento-list">${cplList.map(c => `
      <div class="complemento-card ${c.tipo === 'modifica' ? 'modifica' : ''}">
        <div class="complemento-card-head">
          <span class="complemento-card-icon">${c.tipo === 'modifica' ? '📝' : '➕'}</span>
          <span class="complemento-card-name" title="${escapeHtml(c.nome || '(sem nome)')}">${escapeHtml(c.nome || '(sem nome)')}</span>
        </div>
        <p class="complemento-card-meta">${c.tipo === 'modifica'
          ? `${(c.campos || []).length} campo${(c.campos || []).length === 1 ? '' : 's'} extra na ficha`
          : `${(c.itens || []).length} ite${(c.itens || []).length === 1 ? 'm' : 'ns'} escolhível${(c.itens || []).length === 1 ? '' : 'is'}${c.limite ? ' · limite ' + c.limite : ''}`}</p>
        <div class="complemento-card-actions">
          <button type="button" class="btn secondary small" data-cpl-edit="${c.id}">Editar</button>
          <button type="button" class="btn secondary small" data-cpl-del="${c.id}">Excluir</button>
        </div>
      </div>`).join('')}</div>` : '<div class="complemento-empty"><span class="es-icon">📋</span>Nenhum complemento criado para esta pasta ainda.</div>'}
  `;

  listBox.querySelector('#cplNewBtn').addEventListener('click', () => openComplementoForm(box, ''));
  listBox.querySelectorAll('[data-cpl-edit]').forEach(btn => {
    btn.addEventListener('click', () => openComplementoForm(box, btn.dataset.cplEdit));
  });
  listBox.querySelectorAll('[data-cpl-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const c = cplList.find(x => x.id === btn.dataset.cplDel);
      if (!c) return;
      if (!confirm(`Excluir o complemento "${c.nome}"? Fichas que já escolheram itens dele mantêm o que já foi salvo, mas ele some da lista de escolha.`)) return;
      try {
        await deleteComplemento(cplFolderId, c.id);
        if (cplEditingId === c.id) { cplEditingId = null; formBox.innerHTML = ''; }
        await loadAndRenderComplementosList(box);
      } catch (err) {
        alert('Erro ao excluir: ' + err.message);
      }
    });
  });

  if (cplEditingId !== null) {
    openComplementoForm(box, cplEditingId);
  } else {
    formBox.innerHTML = '';
  }
}

function openComplementoForm(box, id) {
  cplEditingId = id;
  const existing = id ? cplList.find(c => c.id === id) : null;
  cplFormTipo = existing ? existing.tipo : 'adiciona';
  cplFormItens = existing && existing.itens && existing.itens.length ? existing.itens.map(it => Object.assign({}, it)) : [emptyComplementoItem()];
  cplFormCampos = existing && existing.campos && existing.campos.length ? existing.campos.map(cp => Object.assign({}, cp)) : [emptyComplementoCampo()];
  renderComplementoForm(box, existing);
}

function renderComplementoForm(box, existing) {
  const formBox = box.querySelector('#cplFormBox');
  formBox.innerHTML = `
    <div class="panel cpl-form-panel">
      <h3 class="cpl-form-title">${existing ? 'Editar' : 'Novo'} complemento</h3>
      <div class="field">
        <label>Nome do complemento</label>
        <input type="text" id="cplName" placeholder="Ex.: Sangue de Fera, Regras de Sobrevivência..." value="${escapeHtml(existing ? existing.nome : '')}">
      </div>
      <div class="field">
        <label>Tipo</label>
        <div class="cpl-type-toggle">
          <label class="cpl-type-opt ${cplFormTipo === 'adiciona' ? 'selected' : ''}">
            <input type="radio" name="cplTipo" value="adiciona" ${cplFormTipo === 'adiciona' ? 'checked' : ''}>
            <span class="cpl-type-label">➕ Adiciona ao sistema</span>
            <span class="cpl-type-desc">Lista de itens que o jogador escolhe na ficha (novo poder, raça, item...).</span>
          </label>
          <label class="cpl-type-opt ${cplFormTipo === 'modifica' ? 'selected' : ''}">
            <input type="radio" name="cplTipo" value="modifica" ${cplFormTipo === 'modifica' ? 'checked' : ''}>
            <span class="cpl-type-label">📝 Modifica a ficha</span>
            <span class="cpl-type-desc">Campos novos que passam a existir na própria ficha.</span>
          </label>
        </div>
      </div>
      <div id="cplTipoBody"></div>
      <div id="cplFormMsg"></div>
      <div class="cpl-form-actions">
        <button type="button" class="btn small" id="cplSaveBtn">${existing ? 'Salvar alterações' : 'Criar complemento'}</button>
        <button type="button" class="btn secondary small" id="cplCancelBtn">Cancelar</button>
      </div>
    </div>
  `;
  renderComplementoTipoBody(formBox);
  formBox.querySelectorAll('input[name="cplTipo"]').forEach(r => {
    r.addEventListener('change', () => {
      cplFormTipo = formBox.querySelector('input[name="cplTipo"]:checked').value;
      formBox.querySelectorAll('.cpl-type-opt').forEach(opt => {
        opt.classList.toggle('selected', opt.querySelector('input').value === cplFormTipo);
      });
      renderComplementoTipoBody(formBox);
    });
  });
  formBox.querySelector('#cplCancelBtn').addEventListener('click', () => {
    cplEditingId = null;
    formBox.innerHTML = '';
  });
  formBox.querySelector('#cplSaveBtn').addEventListener('click', () => saveComplementoForm(box, existing));
}

function renderComplementoTipoBody(formBox) {
  const bodyBox = formBox.querySelector('#cplTipoBody');
  if (cplFormTipo === 'adiciona') {
    bodyBox.innerHTML = `
      <div class="field" style="max-width:200px;">
        <label>Limite de escolhas</label>
        <input type="number" id="cplLimite" min="0" value="${cplList.find(c => c.id === cplEditingId) && cplEditingId ? (cplList.find(c => c.id === cplEditingId).limite || 0) : 0}">
        <p class="hint" style="margin:6px 0 0;">0 = sem limite (o jogador pode escolher quantos itens quiser).</p>
      </div>
      <div class="sheet-section-title">Itens escolhíveis</div>
      <div id="cplItensRows"></div>
      <button type="button" class="btn secondary small cpl-add-row-btn" id="cplAddItemBtn">+ Adicionar item</button>
    `;
    renderCplItensRows(bodyBox);
    bodyBox.querySelector('#cplAddItemBtn').addEventListener('click', () => {
      cplFormItens.push(emptyComplementoItem());
      renderCplItensRows(bodyBox);
    });
  } else {
    bodyBox.innerHTML = `
      <div class="sheet-section-title">Campos extras da ficha</div>
      <div id="cplCamposRows"></div>
      <button type="button" class="btn secondary small cpl-add-row-btn" id="cplAddCampoBtn">+ Adicionar campo</button>
    `;
    renderCplCamposRows(bodyBox);
    bodyBox.querySelector('#cplAddCampoBtn').addEventListener('click', () => {
      cplFormCampos.push(emptyComplementoCampo());
      renderCplCamposRows(bodyBox);
    });
  }
}

function renderCplItensRows(bodyBox) {
  const rowsBox = bodyBox.querySelector('#cplItensRows');
  rowsBox.innerHTML = cplFormItens.map((it, i) => `
    <div class="complemento-row" data-row="${i}">
      <span class="complemento-row-num">Item ${i + 1}</span>
      <div class="field-row">
        <div class="field"><input type="text" data-f="nome" placeholder="Nome do item" value="${escapeHtml(it.nome)}"></div>
        <div class="field" style="max-width:120px;"><input type="text" data-f="custo" placeholder="Custo" value="${escapeHtml(it.custo || '')}"></div>
      </div>
      <div class="field" style="margin-bottom:0;"><textarea data-f="desc" placeholder="Descrição/efeito" style="min-height:52px;">${escapeHtml(it.desc || '')}</textarea></div>
      ${cplFormItens.length > 1 ? `<button type="button" class="complemento-row-remove" data-remove-row="${i}" title="Remover item">✕</button>` : ''}
    </div>
  `).join('');
  wireCplRows(rowsBox, cplFormItens, () => renderCplItensRows(bodyBox));
}

function renderCplCamposRows(bodyBox) {
  const rowsBox = bodyBox.querySelector('#cplCamposRows');
  rowsBox.innerHTML = cplFormCampos.map((cp, i) => `
    <div class="complemento-row" data-row="${i}">
      <span class="complemento-row-num">Campo ${i + 1}</span>
      <div class="field-row">
        <div class="field" style="margin-bottom:0;"><input type="text" data-f="label" placeholder="Nome do campo" value="${escapeHtml(cp.label)}"></div>
        <div class="field" style="max-width:170px; margin-bottom:0;">
          <select data-f="tipo">
            ${COMPLEMENTO_CAMPO_TIPOS.map(([v, l]) => `<option value="${v}"${cp.tipo === v ? ' selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="field" style="max-width:150px; margin-bottom:0;"><input type="text" data-f="padrao" placeholder="Valor padrão" value="${escapeHtml(cp.padrao || '')}"></div>
      </div>
      ${cplFormCampos.length > 1 ? `<button type="button" class="complemento-row-remove" data-remove-row="${i}" title="Remover campo">✕</button>` : ''}
    </div>
  `).join('');
  wireCplRows(rowsBox, cplFormCampos, () => renderCplCamposRows(bodyBox));
}

function wireCplRows(rowsBox, arr, rerender) {
  rowsBox.querySelectorAll('.complemento-row').forEach(rowEl => {
    const idx = parseInt(rowEl.dataset.row);
    rowEl.querySelectorAll('[data-f]').forEach(inp => {
      inp.addEventListener('input', () => { arr[idx][inp.dataset.f] = inp.value; });
      inp.addEventListener('change', () => { arr[idx][inp.dataset.f] = inp.value; });
    });
  });
  rowsBox.querySelectorAll('[data-remove-row]').forEach(btn => {
    btn.addEventListener('click', () => {
      arr.splice(parseInt(btn.dataset.removeRow), 1);
      rerender();
    });
  });
}

async function saveComplementoForm(box, existing) {
  const formBox = box.querySelector('#cplFormBox');
  const msg = formBox.querySelector('#cplFormMsg');
  msg.innerHTML = '';
  const nome = formBox.querySelector('#cplName').value.trim();
  if (!nome) { msg.innerHTML = '<div class="error-msg">Dê um nome ao complemento.</div>'; return; }

  let data;
  if (cplFormTipo === 'adiciona') {
    const itens = cplFormItens.map(it => ({ id: it.id, nome: (it.nome || '').trim(), custo: (it.custo || '').trim(), desc: (it.desc || '').trim() }))
      .filter(it => it.nome);
    if (!itens.length) { msg.innerHTML = '<div class="error-msg">Adicione pelo menos um item com nome.</div>'; return; }
    const limite = Math.max(0, parseInt(formBox.querySelector('#cplLimite').value) || 0);
    data = { nome, tipo: 'adiciona', itens, limite };
  } else {
    const campos = cplFormCampos.map(cp => ({ id: cp.id, label: (cp.label || '').trim(), tipo: cp.tipo, padrao: cp.padrao || '' }))
      .filter(cp => cp.label);
    if (!campos.length) { msg.innerHTML = '<div class="error-msg">Adicione pelo menos um campo com nome.</div>'; return; }
    data = { nome, tipo: 'modifica', campos };
  }

  const btn = formBox.querySelector('#cplSaveBtn');
  btn.disabled = true;
  try {
    if (existing) {
      await updateComplemento(cplFolderId, existing.id, data);
    } else {
      await createComplemento(cplFolderId, data);
    }
    cplEditingId = null;
    await loadAndRenderComplementosList(box);
  } catch (err) {
    msg.innerHTML = `<div class="error-msg">Erro ao salvar: ${escapeHtml(err.message)}</div>`;
    btn.disabled = false;
  }
}

// ============================================================
// EDITOR DE FICHA (ficha-editor.html) — escolher/preencher
// ============================================================
// Definições da pasta atualmente carregada no editor — cache usado tanto
// pra renderizar a etapa 10 quanto pra montar o retrato salvo em
// collectComplementosIntoState() (ver js/editor-save.js).
let editorComplementosCache = [];

// Chamada em editor-init.js (após a pasta ser conhecida) e de novo sempre
// que o campo "Campanha" muda de valor. Lê o folderId direto do <select>
// pra refletir a escolha em tempo real, mesmo antes de salvar a ficha.
async function initComplementosUI() {
  const folderSel = document.getElementById('fFolder');
  const folderId = folderSel ? (folderSel.value || '') : '';
  const stepEl = document.getElementById('step-10');
  const navEl = document.getElementById('navComplementos');
  editorComplementosCache = await getComplementos(folderId);

  if (!editorComplementosCache.length) {
    if (stepEl) stepEl.style.display = 'none';
    if (navEl) navEl.style.display = 'none';
    window.dispatchEvent(new Event('complementos:visibility-changed'));
    return;
  }
  if (stepEl) stepEl.style.display = '';
  if (navEl) navEl.style.display = '';
  renderComplementosStep();
  populateComplementosFromState();
  window.dispatchEvent(new Event('complementos:visibility-changed'));
}

function renderComplementosStep() {
  const box = document.getElementById('complementosStepBody');
  if (!box) return;
  box.innerHTML = editorComplementosCache.map(c => {
    if (c.tipo === 'modifica') {
      return `
        <div class="sheet-section-title" style="margin-top:18px;">${escapeHtml(c.nome)}</div>
        <div class="complemento-campos" data-complemento="${c.id}">
          ${(c.campos || []).map(cp => renderComplementoCampoInput(c.id, cp)).join('')}
        </div>`;
    }
    const limiteHint = c.limite ? `<div class="points-bar"><span>Itens escolhidos</span><span class="count" data-complemento-count="${c.id}">0 / ${c.limite}</span></div>` : '';
    return `
      <div class="sheet-section-title" style="margin-top:18px;">${escapeHtml(c.nome)}</div>
      ${limiteHint}
      <div class="complemento-itens" data-complemento="${c.id}" data-limite="${c.limite || 0}">
        ${(c.itens || []).map(it => `
          <div class="trait-pick" data-item="${it.id}">
            <div class="thead">
              <span class="tname">${escapeHtml(it.nome)}</span>
              ${it.custo ? `<span class="tcost">${escapeHtml(it.custo)}</span>` : ''}
            </div>
            ${it.desc ? `<div class="tdesc">${escapeHtml(it.desc)}</div>` : ''}
          </div>`).join('')}
      </div>`;
  }).join('');

  // Itens de tipo "adiciona": clique alterna seleção, respeitando o limite
  // (0 = sem limite) — mesmo espírito visual dos traços opcionais de raça.
  box.querySelectorAll('.complemento-itens').forEach(wrap => {
    const limite = parseInt(wrap.dataset.limite) || 0;
    wrap.querySelectorAll('[data-item]').forEach(card => {
      card.addEventListener('click', () => {
        const selected = card.classList.contains('selected');
        if (!selected && limite > 0) {
          const count = wrap.querySelectorAll('.selected').length;
          if (count >= limite) return;
        }
        card.classList.toggle('selected', !selected);
        updateComplementoCountDisplay(wrap.dataset.complemento);
      });
    });
    updateComplementoCountDisplay(wrap.dataset.complemento);
  });
}

function updateComplementoCountDisplay(complementoId) {
  const wrap = document.querySelector(`.complemento-itens[data-complemento="${complementoId}"]`);
  const label = document.querySelector(`[data-complemento-count="${complementoId}"]`);
  if (wrap && label) label.textContent = wrap.querySelectorAll('.selected').length + ' / ' + wrap.dataset.limite;
}

function renderComplementoCampoInput(complementoId, cp) {
  const common = `data-campo="${cp.id}"`;
  if (cp.tipo === 'checkbox') {
    return `<div class="field" style="flex-direction:row; align-items:center; gap:8px;">
      <input type="checkbox" ${common} id="cplField_${cp.id}">
      <label for="cplField_${cp.id}" style="margin:0;">${escapeHtml(cp.label)}</label>
    </div>`;
  }
  if (cp.tipo === 'textarea') {
    return `<div class="field"><label>${escapeHtml(cp.label)}</label><textarea ${common}></textarea></div>`;
  }
  return `<div class="field"><label>${escapeHtml(cp.label)}</label><input type="${cp.tipo === 'numero' ? 'number' : 'text'}" ${common}></div>`;
}

// Preenche a etapa 10 com o que já estava salvo na ficha (state.complementos,
// carregado em loadExistingSheet — ver js/editor-save.js). Precisa rodar
// DEPOIS de renderComplementosStep(), porque lê os elementos que ela cria.
function populateComplementosFromState() {
  const saved = (typeof state !== 'undefined' && state.complementos) || {};
  editorComplementosCache.forEach(c => {
    const savedC = saved[c.id];
    if (!savedC) return;
    if (c.tipo === 'adiciona') {
      const chosenIds = (savedC.itensEscolhidos || []).map(it => it.id);
      document.querySelectorAll(`.complemento-itens[data-complemento="${c.id}"] [data-item]`).forEach(card => {
        card.classList.toggle('selected', chosenIds.includes(card.dataset.item));
      });
      updateComplementoCountDisplay(c.id);
    } else {
      (savedC.campos || []).forEach(cp => {
        const el = document.querySelector(`.complemento-campos[data-complemento="${c.id}"] [data-campo="${cp.id}"]`);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = !!cp.valor;
        else el.value = cp.valor || '';
      });
    }
  });
}

// Lê o que está marcado/preenchido na etapa 10 e monta o retrato salvo na
// ficha (nome/tipo/itens/campos, não só ids) — chamada dentro de
// collectFormIntoState() em js/editor-save.js, antes de montar o payload.
// Guardar o retrato completo (não só ids) faz a ficha continuar mostrando
// certinho o que foi escolhido mesmo que o complemento mude ou seja
// excluído da pasta depois.
function collectComplementosIntoState() {
  const result = {};
  editorComplementosCache.forEach(c => {
    if (c.tipo === 'adiciona') {
      const wrap = document.querySelector(`.complemento-itens[data-complemento="${c.id}"]`);
      if (!wrap) return;
      const chosen = Array.from(wrap.querySelectorAll('.selected')).map(card => {
        const it = (c.itens || []).find(x => x.id === card.dataset.item);
        return it ? Object.assign({}, it) : null;
      }).filter(Boolean);
      if (chosen.length) result[c.id] = { nome: c.nome, tipo: 'adiciona', itensEscolhidos: chosen };
    } else {
      const wrap = document.querySelector(`.complemento-campos[data-complemento="${c.id}"]`);
      if (!wrap) return;
      const campos = (c.campos || []).map(cp => {
        const el = wrap.querySelector(`[data-campo="${cp.id}"]`);
        const valor = el ? (el.type === 'checkbox' ? el.checked : el.value) : (cp.padrao || '');
        return { id: cp.id, label: cp.label, tipo: cp.tipo, valor };
      });
      result[c.id] = { nome: c.nome, tipo: 'modifica', campos };
    }
  });
  if (typeof state !== 'undefined') state.complementos = result;
  return result;
}

// ============================================================
// FICHA (ficha-view.html) — exibição somente leitura
// ============================================================
// Recebe "s" (o documento da ficha) e devolve o HTML da seção, ou '' se a
// ficha não tem nenhum complemento salvo — view.js decide se mostra a
// seção e o item de navegação rápida com base nesse retorno.
function renderComplementosView(s) {
  const data = s.complementos || {};
  const ids = Object.keys(data);
  if (!ids.length) return '';
  return ids.map(id => {
    const c = data[id];
    if (c.tipo === 'modifica') {
      const camposHtml = (c.campos || [])
        .filter(cp => cp.tipo === 'checkbox' ? true : (cp.valor !== '' && cp.valor !== null && cp.valor !== undefined))
        .map(cp => `<div class="sheet-item"><div class="si-head"><span class="si-name">${escapeHtml(cp.label)}</span></div><div class="si-desc">${cp.tipo === 'checkbox' ? (cp.valor ? 'Sim' : 'Não') : escapeHtml(String(cp.valor))}</div></div>`)
        .join('');
      return `<div class="sheet-section-title" style="margin-top:18px;">${escapeHtml(c.nome)}</div><div class="sheet-item-list">${camposHtml || '<p class="hint">Nenhum campo preenchido.</p>'}</div>`;
    }
    const itensHtml = (c.itensEscolhidos || [])
      .map(it => `<div class="sheet-item"><div class="si-head"><span class="si-name">${escapeHtml(it.nome)}</span>${it.custo ? `<span class="si-meta">${escapeHtml(it.custo)}</span>` : ''}</div>${it.desc ? `<div class="si-desc">${escapeHtml(it.desc)}</div>` : ''}</div>`)
      .join('');
    return `<div class="sheet-section-title" style="margin-top:18px;">${escapeHtml(c.nome)}</div><div class="sheet-item-list">${itensHtml || '<p class="hint">Nenhum item escolhido.</p>'}</div>`;
  }).join('');
}

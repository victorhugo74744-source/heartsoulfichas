// js/complementos.js — Sistema de Complementos de campanha.
//
// Um Complemento é conteúdo extra que o MESTRE anexa a uma PASTA de
// campanha (a mesma pasta à qual a Mesa/tabuleiro pertence — ver campo
// "folderId" em /tables, firestore.rules). Quando a ficha de um jogador
// está nessa pasta, o complemento passa a valer para ela.
//
// Hoje só existe um tipo possível (campo "tipo" do documento, sempre
// "sistema"): ativa um RULESET alternativo embutido no próprio código
// (não configurável pelo formulário) — troca mecânicas centrais da ficha
// inteira (energia, classe, raças, fórmulas de recurso, pools de pontos).
// Ver SISTEMAS_EMBUTIDOS logo abaixo e js/deadly-cards.js para o único
// sistema hoje ("Deadly-Cards"). Uma pasta só deve ter um complemento
// "sistema" ativo.
//
// Guardado em /folders/{folderId}/complementos/{id}. Este arquivo é
// carregado em 3 páginas:
//  - master.html — gerenciar (criar/editar/excluir) por pasta;
//  - ficha-editor.html — mostra qual sistema está ativo na pasta;
//  - ficha-view.html — mostra o que já foi escolhido/preenchido.
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

// Registro dos sistemas alternativos embutidos disponíveis. Pra adicionar
// um novo sistema no futuro: implementar a lógica dele num js/<nome>.js
// próprio (nos mesmos moldes de js/deadly-cards.js) e só then registrar
// aqui a entrada correspondente.
const SISTEMAS_EMBUTIDOS = {
  'deadly-cards': {
    nome: 'Deadly-Cards',
    icone: 'assets/deadly-cards-icon-256.png',
    desc: 'Sem raças · classe vira carta (Ás–Rei) · energia única "Porcentagem"/"Assimilação" · pontos de atributo/perícia/traço liberados só pelo Mestre.'
  }
};

// ============================================================
// PAINEL DO MESTRE (master.html) — gerenciar complementos por pasta
// ============================================================
let cplFolders = [];         // fornecidas por quem chama initComplementosPanel
let cplGetFolders = () => [];
let cplFolderId = '';
let cplList = [];
let cplEditingId = null;     // null = form fechado; '' = criando novo; id = editando existente

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
      <div class="complemento-card sistema">
        <div class="complemento-card-head">
          <img class="complemento-card-icon" src="${escapeHtml(c.icone || '')}" alt="">
          <span class="complemento-card-name" title="${escapeHtml(c.nome || '(sem nome)')}">${escapeHtml(c.nome || '(sem nome)')}</span>
        </div>
        <p class="complemento-card-meta">Sistema alternativo de ficha (${escapeHtml((SISTEMAS_EMBUTIDOS[c.sistemaId] || {}).nome || c.sistemaId || '?')})</p>
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
  renderComplementoForm(box, existing);
}

function renderComplementoForm(box, existing) {
  const formBox = box.querySelector('#cplFormBox');
  const currentSistemaId = (existing && existing.sistemaId) || Object.keys(SISTEMAS_EMBUTIDOS)[0];
  formBox.innerHTML = `
    <div class="panel cpl-form-panel">
      <h3 class="cpl-form-title">${existing ? 'Editar' : 'Novo'} complemento</h3>
      <div class="field">
        <label>Nome do complemento</label>
        <input type="text" id="cplName" placeholder="Ex.: Sangue de Fera, Regras de Sobrevivência..." value="${escapeHtml(existing ? existing.nome : '')}">
      </div>
      <div class="field" style="max-width:280px;">
        <label>Sistema embutido</label>
        <select id="cplSistemaId">
          ${Object.keys(SISTEMAS_EMBUTIDOS).map(sid => `<option value="${sid}"${sid === currentSistemaId ? ' selected' : ''}>${escapeHtml(SISTEMAS_EMBUTIDOS[sid].nome)}</option>`).join('')}
        </select>
        <p class="hint" style="margin:6px 0 0;">As regras deste sistema são fixas no código (não dá pra configurar itens/campos aqui) — ele só liga/desliga pra esta pasta.</p>
      </div>
      <div id="cplSistemaPreview"></div>
      <div id="cplFormMsg"></div>
      <div class="cpl-form-actions">
        <button type="button" class="btn small" id="cplSaveBtn">${existing ? 'Salvar alterações' : 'Criar complemento'}</button>
        <button type="button" class="btn secondary small" id="cplCancelBtn">Cancelar</button>
      </div>
    </div>
  `;
  renderCplSistemaPreview(formBox);
  formBox.querySelector('#cplSistemaId').addEventListener('change', () => renderCplSistemaPreview(formBox));
  formBox.querySelector('#cplCancelBtn').addEventListener('click', () => {
    cplEditingId = null;
    formBox.innerHTML = '';
  });
  formBox.querySelector('#cplSaveBtn').addEventListener('click', () => saveComplementoForm(box, existing));
}

function renderCplSistemaPreview(formBox) {
  const sel = formBox.querySelector('#cplSistemaId');
  const sys = SISTEMAS_EMBUTIDOS[sel.value];
  const box = formBox.querySelector('#cplSistemaPreview');
  box.innerHTML = `
    <div class="cpl-sistema-preview">
      <img src="${sys.icone}" alt="">
      <p>${escapeHtml(sys.desc)}</p>
    </div>`;
}

async function saveComplementoForm(box, existing) {
  const formBox = box.querySelector('#cplFormBox');
  const msg = formBox.querySelector('#cplFormMsg');
  msg.innerHTML = '';
  const nome = formBox.querySelector('#cplName').value.trim();
  if (!nome) { msg.innerHTML = '<div class="error-msg">Dê um nome ao complemento.</div>'; return; }

  const sistemaId = formBox.querySelector('#cplSistemaId').value;
  const sys = SISTEMAS_EMBUTIDOS[sistemaId];
  if (!sys) { msg.innerHTML = '<div class="error-msg">Escolha um sistema válido.</div>'; return; }
  const data = { nome, tipo: 'sistema', sistemaId, icone: sys.icone };

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
// EDITOR DE FICHA (ficha-editor.html) — mostra qual sistema está ativo
// ============================================================
// Definições da pasta atualmente carregada no editor — cache usado tanto
// pra renderizar a etapa 10 quanto pra montar o retrato salvo em
// collectComplementosIntoState() (ver js/editor-save.js).
let editorComplementosCache = [];

// Complemento tipo "sistema" ativo na pasta carregada no editor (ver
// SISTEMAS_EMBUTIDOS acima) — no máximo um por pasta é esperado; se houver
// mais de um por engano, vale o primeiro encontrado.
function activeSistemaComplemento() {
  return editorComplementosCache.find(c => c.tipo === 'sistema');
}
function isDeadlyCardsActive() {
  const c = activeSistemaComplemento();
  return !!c && c.sistemaId === 'deadly-cards';
}

// Chamada em editor-init.js (após a pasta ser conhecida) e de novo sempre
// que o campo "Campanha" muda de valor. Lê o folderId direto do <select>
// pra refletir a escolha em tempo real, mesmo antes de salvar a ficha.
async function initComplementosUI() {
  const folderSel = document.getElementById('fFolder');
  const folderId = folderSel ? (folderSel.value || '') : '';
  const stepEl = document.getElementById('step-10');
  const navEl = document.getElementById('navComplementos');
  editorComplementosCache = await getComplementos(folderId);

  // O tipo "sistema" (ex.: Deadly-Cards) muda mecânicas centrais da ficha
  // inteira, então roda independentemente de haver ou não outros
  // complementos nesta pasta (ver js/deadly-cards.js).
  if (typeof applyDeadlyCardsMode === 'function') applyDeadlyCardsMode();

  if (!editorComplementosCache.length) {
    if (stepEl) stepEl.style.display = 'none';
    if (navEl) navEl.style.display = 'none';
    window.dispatchEvent(new Event('complementos:visibility-changed'));
    return;
  }
  if (stepEl) stepEl.style.display = '';
  if (navEl) navEl.style.display = '';
  renderComplementosStep();
  window.dispatchEvent(new Event('complementos:visibility-changed'));
}

function renderComplementosStep() {
  const box = document.getElementById('complementosStepBody');
  if (!box) return;
  box.innerHTML = editorComplementosCache.map(c => {
    const sys = SISTEMAS_EMBUTIDOS[c.sistemaId] || {};
    return `
      <div class="sheet-section-title" style="margin-top:18px;">${escapeHtml(c.nome)}</div>
      <div class="cpl-sistema-preview">
        <img src="${escapeHtml(c.icone || sys.icone || '')}" alt="">
        <p>${escapeHtml(sys.desc || 'Sistema alternativo ativo nesta campanha.')}</p>
      </div>`;
  }).join('');
}

// Lê os complementos ativos da pasta e monta o retrato salvo na ficha
// (nome/tipo/sistemaId/ícone) — chamada dentro de collectFormIntoState()
// em js/editor-save.js, antes de montar o payload. Guardar o retrato
// completo (não só ids) faz a ficha continuar mostrando certinho o que
// estava ativo mesmo que o complemento mude ou seja excluído depois.
function collectComplementosIntoState() {
  const result = {};
  editorComplementosCache.forEach(c => {
    // Sem itens/campos escolhíveis — só guarda o retrato pra ficha-view.html
    // saber mostrar o aviso do sistema mesmo que o complemento mude depois.
    result[c.id] = { nome: c.nome, tipo: 'sistema', sistemaId: c.sistemaId, icone: c.icone };
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
    const sys = SISTEMAS_EMBUTIDOS[c.sistemaId] || {};
    return `
      <div class="sheet-section-title" style="margin-top:18px;">${escapeHtml(c.nome)}</div>
      <div class="cpl-sistema-preview">
        <img src="${escapeHtml(c.icone || sys.icone || '')}" alt="">
        <p>${escapeHtml(sys.desc || 'Sistema alternativo ativo nesta campanha.')}</p>
      </div>`;
  }).join('');
}

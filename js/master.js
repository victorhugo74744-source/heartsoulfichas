let allGroups = []; // [{player:{uid,name,email}, sheets:[...]}]
let allFolders = []; // [{id,name,createdBy,createdAt}] — só as pastas QUE EU CRIEI
let currentSearch = '';
let currentFolderFilter = '';

function renderGroups(groups, filter, folderId) {
  const listEl = document.getElementById('masterList');
  // O container começa com a classe "center-loading" (spinner + texto
  // centralizado) enquanto os dados carregam. Uma vez que temos conteúdo de
  // verdade pra mostrar, ela precisa sair — senão o spinner fica preso ali
  // pra sempre e a lista continua sendo centralizada pelo flex da classe.
  listEl.classList.remove('center-loading');
  const f = (filter || '').toLowerCase();

  const filtered = groups
    .map(g => {
      const playerMatches = g.player.name.toLowerCase().includes(f);
      let sheets = g.sheets.filter(s => playerMatches || (s.characterName || '').toLowerCase().includes(f));
      if (folderId) sheets = sheets.filter(s => s.folderId === folderId);
      return { player: g.player, sheets };
    })
    .filter(g => (f === '' && !folderId) || g.sheets.length > 0 || (f !== '' && g.player.name.toLowerCase().includes(f)));

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="empty-state"><div class="es-icon">🗺</div><p>Nenhuma ficha encontrada.</p></div>`;
    return;
  }

  listEl.innerHTML = filtered.map(g => `
    <div class="player-group">
      <div class="player-group-head">
        <div style="display:flex; align-items:center; gap:10px;">
          ${g.player.avatarImage
            ? `<img src="${escapeHtml(g.player.avatarImage)}" alt="" class="avatar-circle">`
            : `<div class="avatar-circle-placeholder">👤</div>`}
          <h3 style="margin:0;">${escapeHtml(g.player.name)}</h3>
          ${g.player.role === 'master' ? '<span class="badge-master">Mestre</span>' : ''}
        </div>
        <span class="count">${g.sheets.length} ficha${g.sheets.length === 1 ? '' : 's'}</span>
      </div>
      ${g.sheets.length === 0
        ? '<p class="hint" style="margin:0 0 10px;">Ainda não criou nenhuma ficha nas suas campanhas.</p>'
        : `<div class="cards-grid">${g.sheets.map(s => `
          <div class="sheet-card">
            <div class="sc-head">
              <div style="display:flex; align-items:center; gap:12px;">
                ${s.appearanceImage
                  ? `<img src="${escapeHtml(s.appearanceImage)}" alt="Aparência de ${escapeHtml(s.characterName || 'personagem')}" class="avatar-circle" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'avatar-circle-placeholder',textContent:'👤'}));">`
                  : `<div class="avatar-circle-placeholder">👤</div>`}
                <div>
                  <h3>${escapeHtml(s.characterName || 'Sem nome')}</h3>
                  <div class="sc-meta">${escapeHtml(s.raceName || '—')} · Nível ${s.level || 1} · ${escapeHtml(s.energyType || '')}</div>
                  ${s.folderName ? `<div class="folder-badge">${escapeHtml(s.folderName)}</div>` : ''}
                </div>
              </div>
              <a href="ficha-view.html?id=${s.id}" class="btn secondary small" style="width:auto;">Ver ficha</a>
            </div>
            <div class="sc-owner">Atualizada em ${fmtDate(s.updatedAt)}</div>
            <div class="sc-folder-move" style="margin-top:8px;">
              <select data-move-folder="${s.id}">
                <option value="">Sem pasta / campanha</option>
                ${allFolders.map(f => `<option value="${f.id}"${(s.folderId || '') === f.id ? ' selected' : ''}>${escapeHtml(f.name)}</option>`).join('')}
              </select>
            </div>
          </div>`).join('')}</div>`
      }
    </div>`).join('');

  listEl.querySelectorAll('[data-move-folder]').forEach(sel => {
    sel.addEventListener('change', () => moveSheetToFolder(sel.dataset.moveFolder, sel.value));
  });
}

// Move (ou remove) uma ficha de pasta direto pelo painel do Mestre, sem
// precisar abrir a ficha inteira no editor. Como "allFolders" só contém as
// pastas que EU criei, o alvo do movimento é sempre uma pasta minha — por
// isso "masterId" (quem pode gerenciar esta ficha) é sempre atualizado
// junto com "folderId", ficando em sincronia (ver firestore.rules e
// js/editor.js, onde o mesmo par folderId/masterId é definido quando o
// próprio jogador escolhe a campanha na criação da ficha).
async function moveSheetToFolder(sheetId, folderId) {
  const folder = folderId ? allFolders.find(f => f.id === folderId) : null;
  // Precisa do dono e da pasta ANTIGA da ficha antes de sobrescrever, pra
  // atualizar a marca de pasta certa depois (ver syncFolderMembership).
  let ownerUid = null, oldFolderId = '';
  allGroups.forEach(g => {
    g.sheets.forEach(s => {
      if (s.id === sheetId) { ownerUid = g.player.uid; oldFolderId = s.folderId || ''; }
    });
  });
  try {
    await db.collection('sheets').doc(sheetId).update({
      folderId: folderId || null,
      folderName: folder ? folder.name : null,
      masterId: folder ? folder.createdBy : null
    });
    allGroups.forEach(g => {
      g.sheets.forEach(s => {
        if (s.id === sheetId) {
          s.folderId = folderId || null;
          s.folderName = folder ? folder.name : null;
          s.masterId = folder ? folder.createdBy : null;
        }
      });
    });
    renderGroups(allGroups, currentSearch, currentFolderFilter);
    if (ownerUid) await syncFolderMembership(ownerUid, oldFolderId, folderId || '');
  } catch (err) {
    alert('Erro ao mover a ficha de pasta: ' + err.message);
  }
}

function renderFolderList() {
  const box = document.getElementById('folderList');
  const filterSel = document.getElementById('folderFilter');
  if (!allFolders.length) {
    box.innerHTML = '<p class="hint" style="margin:0;">Nenhuma pasta criada ainda.</p>';
  } else {
    box.innerHTML = allFolders.map(f => `
      <span class="folder-chip">${escapeHtml(f.name)}
        <button type="button" data-del-folder="${f.id}" title="Excluir pasta">✕</button>
      </span>`).join('');
    box.querySelectorAll('[data-del-folder]').forEach(btn => {
      btn.addEventListener('click', () => deleteFolder(btn.dataset.delFolder));
    });
  }

  const prevValue = filterSel.value;
  filterSel.innerHTML = '<option value="">Todas as pastas</option>' +
    allFolders.map(f => `<option value="${f.id}">${escapeHtml(f.name)}</option>`).join('');
  filterSel.value = allFolders.some(f => f.id === prevValue) ? prevValue : '';
}

// Só traz as pastas que O PRÓPRIO Mestre logado criou — cada Mestre só vê e
// gerencia as pastas (campanhas) e, por consequência, as fichas dentro
// delas; a pasta de outro Mestre nem aparece aqui (ver firestore.rules).
async function loadFolders() {
  try {
    const snap = await db.collection('folders').where('createdBy', '==', auth.currentUser.uid).get();
    allFolders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderFolderList();
  } catch (err) {
    document.getElementById('folderList').innerHTML =
      `<div class="error-msg">Erro ao carregar pastas: ${escapeHtml(err.message)}</div>`;
  }
}

async function createFolder() {
  const input = document.getElementById('newFolderName');
  const msg = document.getElementById('folderMsg');
  const name = input.value.trim();
  msg.innerHTML = '';
  if (!name) {
    msg.innerHTML = '<div class="error-msg">Dê um nome para a pasta.</div>';
    return;
  }
  const btn = document.getElementById('createFolderBtn');
  btn.disabled = true;
  try {
    await db.collection('folders').add({
      name,
      createdBy: auth.currentUser.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    input.value = '';
    await loadFolders();
  } catch (err) {
    msg.innerHTML = `<div class="error-msg">Erro ao criar pasta: ${escapeHtml(err.message)}</div>`;
  } finally {
    btn.disabled = false;
  }
}

// Ao excluir uma pasta, as fichas que estavam nela não são apagadas —
// só voltam a ficar "sem pasta / campanha" (e sem Mestre responsável),
// pra não perder o trabalho do jogador.
async function deleteFolder(folderId) {
  const folder = allFolders.find(f => f.id === folderId);
  if (!folder) return;
  const sure = confirm(`Excluir a pasta "${folder.name}"? As fichas que estavam nela não serão apagadas, só ficarão sem pasta.`);
  if (!sure) return;

  try {
    const sheetsSnap = await db.collection('sheets').where('folderId', '==', folderId).get();
    if (!sheetsSnap.empty) {
      const batch = db.batch();
      sheetsSnap.forEach(doc => batch.update(doc.ref, { folderId: null, folderName: null, masterId: null }));
      await batch.commit();
    }
    // Limpa as marcas de "tenho ficha nesta pasta" (ver syncFolderMembership)
    // — a pasta vai deixar de existir, então nenhuma mesa pode mais estar
    // afiliada a ela, mas as marcas ficariam órfãs se não apagadas aqui.
    const membersSnap = await db.collection('folders').doc(folderId).collection('members').get();
    if (!membersSnap.empty) {
      const memberBatch = db.batch();
      membersSnap.forEach(doc => memberBatch.delete(doc.ref));
      await memberBatch.commit();
    }
    await db.collection('folders').doc(folderId).delete();
    await loadFolders();
    await reloadSheets();
  } catch (err) {
    document.getElementById('folderMsg').innerHTML = `<div class="error-msg">Erro ao excluir pasta: ${escapeHtml(err.message)}</div>`;
  }
}

// Só traz as fichas que este Mestre pode de fato gerenciar: as que estão
// numa pasta/campanha criada por ele ("masterId" == meu uid) e as suas
// próprias fichas de jogador (caso ele tenha criado um personagem pra si
// mesmo). Fichas de campanhas de outro Mestre, ou sem pasta nenhuma, não
// aparecem aqui — o painel do Mestre não é mais uma visão de "todo mundo
// que já se cadastrou no site", e sim só do que é dele (ver firestore.rules,
// que já barra a leitura dessas outras fichas mesmo que o cliente tentasse).
async function reloadSheets() {
  const uid = auth.currentUser.uid;
  const [masterSheetsSnap, mySheetsSnap] = await Promise.all([
    db.collection('sheets').where('masterId', '==', uid).get(),
    db.collection('sheets').where('ownerId', '==', uid).get()
  ]);
  const sheetsById = {};
  masterSheetsSnap.forEach(doc => { sheetsById[doc.id] = { id: doc.id, ...doc.data() }; });
  mySheetsSnap.forEach(doc => { sheetsById[doc.id] = { id: doc.id, ...doc.data() }; });
  const allSheets = Object.values(sheetsById);

  const ownerIds = Array.from(new Set(allSheets.map(s => s.ownerId)));
  if (!ownerIds.includes(uid)) ownerIds.push(uid); // o próprio Mestre sempre aparece, mesmo sem ficha ainda

  const players = (await Promise.all(ownerIds.map(async (id) => {
    const profile = await getUserProfile(id);
    return profile ? { uid: id, ...profile } : null;
  }))).filter(Boolean);

  const sheetsByOwner = {};
  allSheets.forEach(s => { (sheetsByOwner[s.ownerId] = sheetsByOwner[s.ownerId] || []).push(s); });

  allGroups = players
    .map(p => ({ player: p, sheets: (sheetsByOwner[p.uid] || []).sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)) }))
    // Mestres aparecem primeiro (fica mais fácil achar suas próprias fichas),
    // depois os jogadores em ordem alfabética.
    .sort((a, b) => {
      const aMaster = a.player.role === 'master' ? 0 : 1;
      const bMaster = b.player.role === 'master' ? 0 : 1;
      if (aMaster !== bMaster) return aMaster - bMaster;
      return a.player.name.localeCompare(b.player.name);
    });

  const listEl = document.getElementById('masterList');
  if (allGroups.length === 0) {
    listEl.classList.remove('center-loading');
    listEl.innerHTML = `<div class="empty-state"><div class="es-icon">👥</div><p>Nenhum jogador na sua campanha ainda.</p><p>Crie uma pasta acima e compartilhe o link do site para que seus players entrem nela ao criar a ficha.</p></div>`;
    return;
  }
  renderGroups(allGroups, currentSearch, currentFolderFilter);
}

guardPage('master', async (user, profile) => {
  renderTopbar(profile);
  const listEl = document.getElementById('masterList');

  document.getElementById('createFolderBtn').addEventListener('click', createFolder);
  document.getElementById('newFolderName').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); createFolder(); }
  });

  try {
    await loadFolders();
    await reloadSheets();
  } catch (err) {
    listEl.classList.remove('center-loading');
    listEl.innerHTML = `<div class="error-msg">Erro ao carregar: ${escapeHtml(err.message)}</div>`;
  }

  document.getElementById('searchBox').addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderGroups(allGroups, currentSearch, currentFolderFilter);
  });
  document.getElementById('folderFilter').addEventListener('change', (e) => {
    currentFolderFilter = e.target.value;
    renderGroups(allGroups, currentSearch, currentFolderFilter);
  });
});

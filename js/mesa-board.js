// ============================================================
// Mesa de Tabletop
// - Lobby: lista/cria mesas (mestre cria; jogador entra).
// - Tabuleiro: cada jogador "se transforma" em ficha — escolhe uma de
//   suas fichas e um token com a mesma imagem de aparência aparece no
//   tabuleiro, arrastável em tempo real (Firestore onSnapshot).
// - Mestre: gera mapas de batalha proceduralmente (js/mapgen.js) e pode
//   adicionar tokens avulsos (monstros/NPCs).
// ============================================================

let curUser = null;
let curProfile = null;
let curTable = null;      // {id, ...dados}

// Um usuário com conta de Mestre só tem os poderes de Mestre (gerar mapa,
// desenhar, névoa, iniciativa, apagar token de outro, ver todos os
// sussurros etc.) dentro de uma mesa que ELE MESMO criou. Se o site tem
// mais de um Mestre (mais de uma campanha) e esse Mestre entra numa mesa
// de outro Mestre (como visitante/jogador), ele é tratado como jogador
// comum nessa mesa — não vê nem consegue usar as opções exclusivas do
// dono dela. Ver uso em toda a UI da mesa abaixo (o Firestore também
// aplica essa mesma regra do lado do servidor, ver isTableMaster em
// firestore.rules).
function isTableOwner() {
  return !!(curProfile && curProfile.role === 'master' &&
    curTable && curTable.createdBy === curUser?.uid);
}
let mySheets = [];        // fichas do jogador logado
let tokenUnsub = null;
let tableUnsub = null;
let rollsUnsub = null;
let draggingTokenId = null;

// ---- Cenas (seletor de cenas, estilo Owlbear Rodeo) -----------------------
// Cada mesa pode ter várias cenas (mapas) já preparadas de antemão; o
// Mestre troca qual está "ativa" (curTable.activeSceneId) e todos na mesa
// veem a troca em tempo real. O mapa em si (mapImage/mapW/mapH/cellPx/
// biome) mora no documento da cena, não mais direto na mesa — desenhos e
// névoa também pertencem a uma cena (campo sceneId), então cada cena
// guarda seu próprio "estado" de mapa. Os tokens (fichas dos jogadores e
// NPCs) continuam valendo pra mesa inteira e atravessam de uma cena pra
// outra junto com o grupo, como seria de se esperar de uma mesa de RPG.
let curScenes = [];        // [{id, name, mapImage, mapW, mapH, cellPx, biome, order}, ...]
let sceneUnsub = null;
let lastRenderedSceneId = undefined; // não confundir com null (= "sem cena nenhuma ainda")

// ---- Ferramentas do mapa (régua, desenho, névoa, marcar) ------------------
// 'pan' é a ferramenta padrão (arrastar move o mapa / roda-mouse-pinça dá
// zoom, como já era). As outras ferramentas tomam conta do pointerdown no
// board-wrap enquanto ativas; ver attachBoardInteractionHandlers.
let boardTool = 'pan'; // 'pan' | 'ruler' | 'draw' | 'fog' | 'ping' | 'template'
// Owlbear Rodeo não usa uma paleta fixa de cores prontas — só a roda
// cromática. drawColor nasce igual à cor do Mestre na mesa (myColor) e só
// muda se ele escolher outra na própria roda (ver openTable/renderToolToolbar).
let drawColor = '#e0473f';
let drawUnsub = null, fogUnsub = null, pingUnsub = null, templateUnsub = null;
let liveDrawings = {}, liveFog = {}, livePings = {}, liveTemplates = {};
// ---- Áreas de efeito (templates de magia/ataque: círculo, cone, linha) ----
// Igual à régua/marcação: qualquer jogador presente pode desenhar uma área
// (não só o Mestre), já que é o próprio jogador quem conjura a magia. Fica
// salva (ao contrário do ping) até alguém apagar, pra servir de referência
// durante o combate — por isso mora numa subcoleção própria, com sceneId,
// no mesmo molde de "drawings"/"fog".
let templateShape = 'circle'; // 'circle' | 'cone' | 'line' — formato escolhido para a próxima área
let selectedTokenId = null;      // token com as alças de girar/redimensionar abertas sobre o mapa
let handleDraggingTokenId = null; // token cuja alça (girar/redimensionar) está sendo arrastada agora
// "Encaixar na grade" (estilo Owlbear): ligado por padrão, soltar um token
// o encaixa no centro da célula mais próxima; segurar Alt/Option solta
// livre mesmo com o encaixe ligado. Fica lembrado neste navegador.
let snapToGrid = (localStorage.getItem('mesaSnapGrid') !== '0');

// Quantos metros equivalem a uma casa da grade — usado só para converter as
// medidas (régua e áreas de ataque) de "casas" para metros também, já que
// cada mesa pode usar uma escala diferente. Padrão: 1 casa = 1 metro (regra
// de deslocamento do livro usa metros direto). Fica lembrado neste
// navegador, como o snapToGrid.
let metersPerCell = parseFloat(localStorage.getItem('mesaMetersPerCell')) || 1;

// Formata uma distância em casas para o texto exibido na régua e nas áreas
// de ataque: sempre mostra as duas unidades (casas e metros), já que cada
// mesa/jogador pode preferir pensar em uma ou na outra.
function formatCellsAndMeters(cells, suffix) {
  const meters = cells * metersPerCell;
  const cellWord = Math.abs(cells - 1) < 0.05 ? 'casa' : 'casas';
  return `${cells.toFixed(1)} ${cellWord} · ${meters.toFixed(1)} m${suffix || ''}`;
}

// ------------------------------------------------------- INICIATIVA --
// Rastreador de iniciativa (estilo extensão do Owlbear Rodeo): o Mestre
// adiciona os tokens presentes, define o valor de cada um e avança os
// turnos; todos na mesa veem a ordem e quem está na vez agora.
let liveInitiative = {};   // id (= id do token) -> {name, value}
let activeInitiativeId = null;
let initiativeUnsub = null;

// ---- Cor do usuário / presença ---------------------------------------
// "myColor" é a cor que representa o jogador logado na mesa (contorno do
// token + aura por padrão) — escolhida na roda cromática e lembrada no
// localStorage deste navegador. "npcColor" é a mesma ideia, só que para o
// próximo NPC que o Mestre for adicionar.
let myColor = null;
let npcColor = null;
let presenceUnsub = null, presenceHeartbeat = null;
const USER_COLOR_PALETTE = ['#e0473f', '#e8c76a', '#5ea86a', '#6aa0c9', '#b47fd1', '#e09a5a', '#f2f2ec', '#9c9c94'];

// ---- Chat da mesa (geral / privado / sussurro) -----------------------
// Uma única coleção "chatMessages" por mesa. Diferente de "rolls", aqui o
// Firestore NÃO filtra por documento dentro de uma query/onSnapshot: para
// list/onSnapshot, a regra precisa valer para TODO o conjunto de resultados
// possível da query, senão ele nega a query inteira com "Missing or
// insufficient permissions" (mesmo que o doc específico fosse permitido
// via get()). Por isso escutamos várias queries já restritas por "where",
// cada uma provavelmente permitida pelas regras, e juntamos o resultado.
let chatUnsub = null;
let chatMessagesCache = [];      // mensagens que este cliente tem permissão de ler
let chatChannel = 'general';     // 'general' | 'whisper'
let chatTargetUid = null;        // destinatário selecionado (sussurro; também usado pelo Mestre agora)
let chatPopupOpen = false;
let chatMinimized = false;
let chatUnread = { general: 0, whisper: 0 }; // não lidas por aba, além do total no botão flutuante
let chatSnapshotPrimed = false;  // evita contar o histórico inicial como "não lida"

// Tamanho da célula da grade, em px "naturais" (sem zoom). Os mapas gerados
// por js/mapgen.js sempre usam MAPGEN_CELL_PX (constante compartilhada, já
// que os scripts rodam no mesmo escopo global). Quando não há mapa gerado
// ainda, caímos no mesmo valor por padrão, para o token já nascer do
// tamanho certo em relação à grade "fantasma" do fundo.
const DEFAULT_CELL_PX = (typeof MAPGEN_CELL_PX !== 'undefined') ? MAPGEN_CELL_PX : 36;
let boardCellPx = DEFAULT_CELL_PX; // tamanho real da célula do mapa atual (sem zoom)

// ---- Pan / zoom do tabuleiro (arrastar move o mapa em qualquer direção,
// roda do mouse / pinça faz zoom — igual ao Owlbear Rodeo) -----------------
const ZOOM_MIN = 0.35, ZOOM_MAX = 2.5, ZOOM_STEP = 0.15;
let boardZoom = 1;
let boardPanX = 0, boardPanY = 0; // deslocamento do mapa (em px de tela) dentro do board-wrap
// 900x612 = 25x17 células de DEFAULT_CELL_PX, pra grade "fantasma" bater certinho
let baseMapW = 900, baseMapH = 612; // tamanho "natural" do mapa atual (sem zoom)

function fileToResizedDataUrl(file, maxDim) {
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

// ------------------------------------------------------------ CORES --
function hexToRgba(hex, alpha) {
  const h = (hex || '#c9a15c').replace('#', '');
  const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function hsvToHex(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  let r, g, b;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = n => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

function hexToHsv(hex) {
  hex = (hex || '#c9a15c');
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

// Cada usuário ganha uma cor padrão estável (mesmo antes de escolher uma na
// roda cromática) derivada do próprio uid, só pra ninguém nascer sem cor.
function pickDefaultColor(uid) {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  return USER_COLOR_PALETTE[hash % USER_COLOR_PALETTE.length];
}

function getStoredColor(uid) {
  try { return localStorage.getItem('mesaColor_' + uid) || null; } catch (e) { return null; }
}
function setStoredColor(uid, hex) {
  try { localStorage.setItem('mesaColor_' + uid, hex); } catch (e) {}
}

// ---------------------------------------------------------- RODA CROMÁTICA --
// Popover leve com uma roda de matiz/saturação (canvas) + barra de
// luminosidade, no estilo Owlbear Rodeo. onApply(hex) é chamado só quando o
// usuário confirma ("Usar esta cor"); fechar sem confirmar não muda nada.
let activeWheelPopover = null;

function closeColorWheel() {
  if (activeWheelPopover) { activeWheelPopover.remove(); activeWheelPopover = null; }
  const bd = document.querySelector('.wheel-backdrop');
  if (bd) bd.remove();
}

function drawWheelCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2, R = w / 2;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx, dy = y - cy, dist = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * w + x) * 4;
      if (dist <= R) {
        let angle = Math.atan2(dy, dx) * 180 / Math.PI; if (angle < 0) angle += 360;
        const sat = Math.min(1, dist / R);
        const hex = hsvToHex(angle, sat, 1);
        img.data[idx] = parseInt(hex.slice(1, 3), 16);
        img.data[idx + 1] = parseInt(hex.slice(3, 5), 16);
        img.data[idx + 2] = parseInt(hex.slice(5, 7), 16);
        img.data[idx + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

function openColorWheel(anchorEl, initialColor, onApply) {
  closeColorWheel();
  let { h, s, v } = hexToHsv(initialColor);
  if (v < 0.15) v = 1; // cor "quase preta": abre já num tom visível pro ponteiro fazer sentido

  const backdrop = document.createElement('div');
  backdrop.className = 'wheel-backdrop';
  backdrop.addEventListener('pointerdown', closeColorWheel);
  document.body.appendChild(backdrop);

  const pop = document.createElement('div');
  pop.className = 'wheel-popover';
  pop.innerHTML = `
    <canvas width="140" height="140"></canvas>
    <input type="range" class="wp-light" min="0" max="100" value="${Math.round(v * 100)}">
    <div class="wp-row">
      <span class="wp-preview"></span>
      <span class="wp-hex"></span>
    </div>
    <div class="wp-actions">
      <button type="button" class="wp-cancel">Cancelar</button>
      <button type="button" class="wp-ok">Usar esta cor</button>
    </div>`;
  document.body.appendChild(pop);
  pop.addEventListener('pointerdown', (e) => e.stopPropagation());

  const rect = anchorEl.getBoundingClientRect();
  let left = rect.left, top = rect.bottom + 8;
  if (left + 190 > window.innerWidth) left = window.innerWidth - 198;
  if (top + 260 > window.innerHeight) top = rect.top - 268;
  pop.style.left = Math.max(8, left) + 'px';
  pop.style.top = Math.max(8, top) + 'px';

  const canvas = pop.querySelector('canvas');
  drawWheelCanvas(canvas);
  const lightInput = pop.querySelector('.wp-light');
  const preview = pop.querySelector('.wp-preview');
  const hexLabel = pop.querySelector('.wp-hex');

  function currentHex() { return hsvToHex(h, s, v); }
  function refreshPreview() {
    const hex = currentHex();
    preview.style.background = hex;
    hexLabel.textContent = hex.toUpperCase();
    lightInput.style.background = `linear-gradient(90deg, #000, ${hsvToHex(h, s, 1)})`;
  }
  refreshPreview();

  function pickFromEvent(e) {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    const dist = Math.sqrt(x * x + y * y);
    const R = r.width / 2;
    let angle = Math.atan2(y, x) * 180 / Math.PI; if (angle < 0) angle += 360;
    h = angle;
    s = Math.min(1, dist / R);
    refreshPreview();
  }
  let dragging = false;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; canvas.setPointerCapture(e.pointerId); pickFromEvent(e); });
  canvas.addEventListener('pointermove', (e) => { if (dragging) pickFromEvent(e); });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  lightInput.addEventListener('input', () => { v = lightInput.value / 100; refreshPreview(); });

  pop.querySelector('.wp-cancel').addEventListener('click', closeColorWheel);
  pop.querySelector('.wp-ok').addEventListener('click', () => {
    const hex = currentHex();
    closeColorWheel();
    onApply(hex);
  });

  activeWheelPopover = pop;
}

// ---------------------------------------------------------------- LOBBY --
async function loadTables() {
  const listEl = document.getElementById('tablesList');
  try {
    const snap = await db.collection('tables').orderBy('createdAt', 'desc').get();
    const tables = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    listEl.classList.remove('center-loading');
    if (tables.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><div class="es-icon">🗺</div><p>Nenhuma mesa criada ainda.</p></div>`;
      return;
    }
    listEl.innerHTML = tables.map(t => `
      <div class="table-card">
        <div>
          <h3>${escapeHtml(t.name)}</h3>
          <div class="tc-meta">Criada em ${fmtDate(t.createdAt)}</div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn small" style="width:auto;" data-open="${t.id}">Entrar</button>
          ${(curProfile.role === 'master' && t.createdBy === curUser.uid) ? `<button class="btn-link" data-del="${t.id}">Excluir</button>` : ''}
        </div>
      </div>`).join('');

    listEl.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => openTable(b.dataset.open)));
    listEl.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => deleteTable(b.dataset.del)));
  } catch (err) {
    listEl.classList.remove('center-loading');
    listEl.innerHTML = `<div class="error-msg">Erro ao carregar mesas: ${escapeHtml(err.message)}</div>`;
  }
}

function renderCreateTableBox() {
  const box = document.getElementById('createTableBox');
  if (curProfile.role !== 'master') { box.innerHTML = ''; return; }
  box.innerHTML = `
    <div class="create-table-form">
      <h4 style="font-family:'Cinzel',serif; color:var(--gold); margin:0 0 12px;">Criar nova mesa</h4>
      <div class="field">
        <input type="text" id="newTableName" placeholder="Nome da mesa (ex.: Sessão 1 — A Torre Afundada)">
      </div>
      <button class="btn" id="createTableBtn" style="width:auto; margin-top:8px;">Criar mesa</button>
      <div class="error-msg hidden" id="createTableErr"></div>
    </div>`;
  document.getElementById('createTableBtn').addEventListener('click', async () => {
    const nameEl = document.getElementById('newTableName');
    const errEl = document.getElementById('createTableErr');
    const name = nameEl.value.trim();
    if (!name) { errEl.textContent = 'Dê um nome à mesa.'; errEl.classList.remove('hidden'); return; }
    try {
      await db.collection('tables').add({
        name, createdBy: curUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      nameEl.value = '';
      errEl.classList.add('hidden');
      loadTables();
    } catch (err) {
      errEl.textContent = 'Erro ao criar: ' + err.message;
      errEl.classList.remove('hidden');
    }
  });
}

async function deleteTable(tableId) {
  if (!confirm('Excluir esta mesa e remover todos os tokens dela? Isso não pode ser desfeito.')) return;
  try {
    const tokensSnap = await db.collection('tables').doc(tableId).collection('tokens').get();
    const scenesSnap = await db.collection('tables').doc(tableId).collection('scenes').get();
    const batch = db.batch();
    tokensSnap.forEach(d => batch.delete(d.ref));
    scenesSnap.forEach(d => batch.delete(d.ref));
    batch.delete(db.collection('tables').doc(tableId));
    await batch.commit();
    loadTables();
  } catch (err) {
    alert('Erro ao excluir mesa: ' + err.message);
  }
}

// ---------------------------------------------------------------- CENAS --
// Retorna a cena ativa (a que está sendo exibida agora), ou null se a mesa
// ainda não tem nenhuma cena (caso raríssimo: mestre nunca abriu a mesa).
function getActiveScene() {
  if (!curTable || !curScenes.length) return null;
  return curScenes.find(s => s.id === curTable.activeSceneId) || curScenes[0];
}

// Mesas criadas antes do seletor de cenas guardavam o mapa direto no
// documento da mesa. Na primeira vez que o Mestre abre uma mesa assim,
// migramos esse mapa (se houver) para uma primeira cena "Cena 1" e
// carimbamos os desenhos/névoa já existentes com o id dela — tudo dentro
// de uma única mesa continua funcionando exatamente como antes, só que
// agora dentro de uma cena de verdade.
async function ensureFirstScene() {
  const scenesRef = db.collection('tables').doc(curTable.id).collection('scenes');
  const snap = await scenesRef.orderBy('order', 'asc').get();
  if (!snap.empty) {
    curScenes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return;
  }
  if (!isTableOwner()) { curScenes = []; return; } // aguarda o Mestre migrar
  const newSceneRef = scenesRef.doc();
  const sceneData = {
    name: 'Cena 1',
    mapImage: curTable.mapImage || '', mapW: curTable.mapW || 900, mapH: curTable.mapH || 612,
    cellPx: curTable.cellPx || DEFAULT_CELL_PX, biome: curTable.biome || '',
    order: 0, createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  const batch = db.batch();
  batch.set(newSceneRef, sceneData);
  batch.update(db.collection('tables').doc(curTable.id), { activeSceneId: newSceneRef.id });
  // Carimba desenhos/névoa antigos (sem sceneId) com a cena recém-criada.
  const [drawSnap, fogSnap] = await Promise.all([
    db.collection('tables').doc(curTable.id).collection('drawings').get(),
    db.collection('tables').doc(curTable.id).collection('fog').get()
  ]);
  drawSnap.forEach(d => { if (!d.data().sceneId) batch.update(d.ref, { sceneId: newSceneRef.id }); });
  fogSnap.forEach(d => { if (!d.data().sceneId) batch.update(d.ref, { sceneId: newSceneRef.id }); });
  await batch.commit();
  curTable.activeSceneId = newSceneRef.id;
  curScenes = [{ id: newSceneRef.id, ...sceneData }];
}

function listenScenes() {
  sceneUnsub = db.collection('tables').doc(curTable.id).collection('scenes')
    .orderBy('order', 'asc')
    .onSnapshot(snap => {
      curScenes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      refreshBoardForActiveScene();
    }, err => console.error('Erro ao sincronizar cenas:', err));
}

// Chamado sempre que a mesa ou a lista de cenas muda: percebe se a cena
// ativa mudou (troca de mapa pelo Mestre) e, se sim, re-inscreve os
// desenhos/névoa desta mesa apenas na nova cena, recentra a câmera e
// redesenha o painel de cenas + o fundo do tabuleiro.
function refreshBoardForActiveScene() {
  if (!curTable) return;
  const scene = getActiveScene();
  const newId = scene ? scene.id : null;
  if (newId !== lastRenderedSceneId) {
    lastRenderedSceneId = newId;
    if (drawUnsub) { drawUnsub(); drawUnsub = null; }
    if (fogUnsub) { fogUnsub(); fogUnsub = null; }
    if (templateUnsub) { templateUnsub(); templateUnsub = null; }
    liveDrawings = {}; liveFog = {}; liveTemplates = {};
    lastOwnDrawingId = null; // "desfazer último traço" não deve valer pra outra cena
    selectedTokenId = null; handleDraggingTokenId = null;
    boardZoom = 1; boardPanX = 0; boardPanY = 0;
    if (newId) { listenDrawings(); listenFog(); listenTemplates(); }
  }
  renderBoardBackground();
  renderScenePanel();
  const label = document.getElementById('boardSceneLabel');
  if (label) label.textContent = scene ? `🎬 ${scene.name || 'Cena'}` : '';
  if (newId) setTimeout(fitBoardToScreen, 60);
}

function renderScenePanel() {
  const panel = document.getElementById('scenePanel');
  if (!panel) return;
  if (!isTableOwner()) { panel.classList.add('hidden'); panel.innerHTML = ''; return; }
  panel.classList.remove('hidden');
  const activeId = curTable.activeSceneId;
  panel.innerHTML = `
    <h4>🎬 Cenas</h4>
    <div class="scene-new-row">
      <input type="text" id="newSceneName" placeholder="Nome da nova cena (ex.: Taverna)">
      <button class="btn small" id="addSceneBtn">+ Nova cena</button>
    </div>
    <div class="scene-list" id="sceneListBody">
      ${curScenes.map((s, i) => `
        <div class="scene-card ${s.id === activeId ? 'scene-active' : ''}">
          <div class="scene-thumb" ${s.mapImage ? `style="background-image:url('${s.mapImage}')"` : ''}>${s.mapImage ? '' : '🗺'}</div>
          <div class="scene-info">
            <input type="text" class="scene-name-input" data-scene-id="${s.id}" value="${escapeHtml(s.name || 'Sem nome')}">
            <div class="tc-meta">${s.id === activeId ? 'Cena atual' : '&nbsp;'}</div>
          </div>
          <div class="scene-actions">
            <button type="button" class="scene-use-btn ${s.id === activeId ? 'is-active' : ''}" data-use="${s.id}">${s.id === activeId ? '● Atual' : '○ Usar'}</button>
            <div class="scene-actions-row">
              <button type="button" data-up="${s.id}" title="Mover para cima" ${i === 0 ? 'disabled' : ''}>↑</button>
              <button type="button" data-down="${s.id}" title="Mover para baixo" ${i === curScenes.length - 1 ? 'disabled' : ''}>↓</button>
              <button type="button" class="scene-del-btn" data-del="${s.id}" title="Excluir cena" ${curScenes.length < 2 ? 'disabled' : ''}>🗑</button>
            </div>
          </div>
        </div>`).join('')}
    </div>
    <div class="tc-meta" style="margin-top:10px;">Cada cena guarda seu próprio mapa, desenhos e névoa. As fichas na mesa atravessam junto com o grupo de uma cena para outra.</div>
    <div class="error-msg hidden" id="sceneErr"></div>`;

  document.getElementById('addSceneBtn').addEventListener('click', createNewScene);
  panel.querySelectorAll('[data-use]').forEach(b => b.addEventListener('click', () => setActiveScene(b.dataset.use)));
  panel.querySelectorAll('[data-up]').forEach(b => b.addEventListener('click', () => moveScene(b.dataset.up, -1)));
  panel.querySelectorAll('[data-down]').forEach(b => b.addEventListener('click', () => moveScene(b.dataset.down, 1)));
  panel.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => deleteScene(b.dataset.del)));
  panel.querySelectorAll('.scene-name-input').forEach(inp => {
    inp.addEventListener('change', () => renameScene(inp.dataset.sceneId, inp.value));
  });
}

async function createNewScene() {
  const nameEl = document.getElementById('newSceneName');
  const errEl = document.getElementById('sceneErr');
  const name = (nameEl.value || '').trim() || `Cena ${curScenes.length + 1}`;
  try {
    const maxOrder = curScenes.reduce((m, s) => Math.max(m, s.order || 0), -1);
    const ref = await db.collection('tables').doc(curTable.id).collection('scenes').add({
      name, mapImage: '', mapW: 900, mapH: 612, cellPx: DEFAULT_CELL_PX, biome: '',
      order: maxOrder + 1, createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    await db.collection('tables').doc(curTable.id).update({ activeSceneId: ref.id });
    nameEl.value = '';
    errEl.classList.add('hidden');
  } catch (err) {
    errEl.textContent = 'Erro ao criar cena: ' + err.message;
    errEl.classList.remove('hidden');
  }
}

async function setActiveScene(sceneId) {
  if (sceneId === curTable.activeSceneId) return;
  try { await db.collection('tables').doc(curTable.id).update({ activeSceneId: sceneId }); }
  catch (err) { alert('Erro ao trocar de cena: ' + err.message); }
}

async function renameScene(sceneId, name) {
  const clean = (name || '').trim() || 'Sem nome';
  try { await db.collection('tables').doc(curTable.id).collection('scenes').doc(sceneId).update({ name: clean }); }
  catch (err) { console.error('Erro ao renomear cena:', err); }
}

async function moveScene(sceneId, dir) {
  const idx = curScenes.findIndex(s => s.id === sceneId);
  const otherIdx = idx + dir;
  if (idx < 0 || otherIdx < 0 || otherIdx >= curScenes.length) return;
  const a = curScenes[idx], b = curScenes[otherIdx];
  try {
    const batch = db.batch();
    const scenesRef = db.collection('tables').doc(curTable.id).collection('scenes');
    batch.update(scenesRef.doc(a.id), { order: b.order });
    batch.update(scenesRef.doc(b.id), { order: a.order });
    await batch.commit();
  } catch (err) { alert('Erro ao reordenar cenas: ' + err.message); }
}

async function deleteScene(sceneId) {
  if (curScenes.length < 2) return;
  const scene = curScenes.find(s => s.id === sceneId);
  if (!confirm(`Excluir a cena "${(scene && scene.name) || ''}"? Os desenhos e a névoa dela também serão apagados. Isso não pode ser desfeito.`)) return;
  try {
    const tableRef = db.collection('tables').doc(curTable.id);
    const [drawSnap, fogSnap] = await Promise.all([
      tableRef.collection('drawings').where('sceneId', '==', sceneId).get(),
      tableRef.collection('fog').where('sceneId', '==', sceneId).get()
    ]);
    const batch = db.batch();
    drawSnap.forEach(d => batch.delete(d.ref));
    fogSnap.forEach(d => batch.delete(d.ref));
    batch.delete(tableRef.collection('scenes').doc(sceneId));
    if (curTable.activeSceneId === sceneId) {
      const fallback = curScenes.find(s => s.id !== sceneId);
      if (fallback) batch.update(tableRef, { activeSceneId: fallback.id });
    }
    await batch.commit();
  } catch (err) { alert('Erro ao excluir cena: ' + err.message); }
}

// ---------------------------------------------------------------- BOARD --
async function openTable(tableId) {
  const doc = await db.collection('tables').doc(tableId).get();
  if (!doc.exists) { alert('Essa mesa não existe mais.'); loadTables(); return; }
  curTable = { id: doc.id, ...doc.data() };

  document.getElementById('lobbyView').classList.add('hidden');
  document.getElementById('boardView').style.display = 'block';
  document.getElementById('boardTitle').textContent = curTable.name;
  // Página da mesa usa uma largura maior que o resto do site (mapa e
  // ferramentas maiores no desktop) — só enquanto o tabuleiro está aberto.
  document.querySelector('.shell').classList.add('shell-board');

  // O Mestre também pode ter fichas próprias (criadas como jogador) e
  // entrar na mesa com elas, além de adicionar NPCs avulsos — por isso
  // carregamos mySheets pra qualquer papel, não só pra jogadores.
  const sheetsSnap = await db.collection('sheets').where('ownerId', '==', curUser.uid).get();
  mySheets = sheetsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  myColor = getStoredColor(curUser.uid) || pickDefaultColor(curUser.uid);
  npcColor = pickDefaultColor(curTable.id + '-npc');
  drawColor = myColor; // sem paleta pronta: o traço nasce na sua própria cor da roda

  boardZoom = 1;
  boardPanX = 0; boardPanY = 0;
  boardTool = 'pan';
  selectedTokenId = null;
  curScenes = [];
  lastRenderedSceneId = undefined;
  renderMyTokenPanel();
  renderToolToolbar();
  await ensureFirstScene(); // migra mesas antigas (mapa direto na mesa) pra uma primeira cena, se preciso
  renderMasterMapPanel();
  listenTable();
  listenScenes();
  listenTokens();
  listenRolls();
  listenPings();
  listenPresence();
  listenInitiative();
  startPresenceHeartbeat();
  attachBoardInteractionHandlers();
  resetChatState();
  listenChat();
  showChatFab();
  requestAnimationFrame(() => requestAnimationFrame(fitBoardToScreen));
}

function closeTable() {
  if (tokenUnsub) { tokenUnsub(); tokenUnsub = null; }
  if (tableUnsub) { tableUnsub(); tableUnsub = null; }
  if (sceneUnsub) { sceneUnsub(); sceneUnsub = null; }
  if (rollsUnsub) { rollsUnsub(); rollsUnsub = null; }
  if (drawUnsub) { drawUnsub(); drawUnsub = null; }
  if (fogUnsub) { fogUnsub(); fogUnsub = null; }
  if (pingUnsub) { pingUnsub(); pingUnsub = null; }
  if (templateUnsub) { templateUnsub(); templateUnsub = null; }
  if (presenceUnsub) { presenceUnsub(); presenceUnsub = null; }
  if (initiativeUnsub) { initiativeUnsub(); initiativeUnsub = null; }
  if (chatUnsub) { chatUnsub(); chatUnsub = null; }
  stopPresenceHeartbeat();
  hideChatUi();
  chatMessagesCache = [];
  liveDrawings = {}; liveFog = {}; livePings = {};
  liveInitiative = {}; activeInitiativeId = null;
  selectedTokenId = null; handleDraggingTokenId = null;
  curScenes = []; lastRenderedSceneId = undefined;
  curTable = null;
  const boardView = document.getElementById('boardView');
  boardView.style.display = 'none';
  boardView.classList.remove('fullscreen-mode');
  document.querySelector('.shell').classList.remove('shell-board');
  const fsBtn = document.getElementById('fullscreenBtn');
  if (fsBtn) fsBtn.textContent = '⛶ Expandir mesa';
  document.getElementById('lobbyView').classList.remove('hidden');
  const presPanel = document.getElementById('presencePanel');
  if (presPanel) presPanel.classList.add('hidden');
  loadTables();
}

// ------------------------------------------------------------ PRESENÇA --
// Cada cliente com a mesa aberta escreve um "batimento" próprio a cada 25s
// em tables/{id}/presence/{uid} (a regra do Firestore só deixa cada um
// escrever o próprio documento). A leitura da coleção inteira é liberada só
// para o Mestre — por isso só ele enxerga a lista de quem está na mesa.
function presenceBeforeUnload() {
  if (curTable && curUser) {
    db.collection('tables').doc(curTable.id).collection('presence').doc(curUser.uid).delete().catch(() => {});
  }
}

function startPresenceHeartbeat() {
  const ref = db.collection('tables').doc(curTable.id).collection('presence').doc(curUser.uid);
  const beat = () => {
    ref.set({
      name: (curProfile && curProfile.name) || 'Jogador',
      role: (curProfile && curProfile.role) || 'player',
      color: (curProfile && curProfile.role === 'master') ? '#c9a15c' : myColor,
      lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(err => console.warn('Erro ao registrar presença:', err));
  };
  beat();
  presenceHeartbeat = setInterval(beat, 25000);
  window.addEventListener('beforeunload', presenceBeforeUnload);
}

function stopPresenceHeartbeat() {
  if (presenceHeartbeat) { clearInterval(presenceHeartbeat); presenceHeartbeat = null; }
  window.removeEventListener('beforeunload', presenceBeforeUnload);
  presenceBeforeUnload();
}

// Só o Mestre lê a coleção (regra do Firestore); nos demais, isto não faz
// nada além de manter o painel escondido.
function listenPresence() {
  const panel = document.getElementById('presencePanel');
  if (!panel) return;
  if (!curProfile || !isTableOwner()) { panel.classList.add('hidden'); return; }
  panel.classList.remove('hidden');
  presenceUnsub = db.collection('tables').doc(curTable.id).collection('presence')
    .onSnapshot(snap => {
      const now = Date.now();
      const rows = [];
      snap.forEach(d => {
        const p = d.data();
        const seenAt = (p.lastSeen && p.lastSeen.toDate) ? p.lastSeen.toDate().getTime() : now;
        if (now - seenAt > 70000) return; // batimento "morto" (aba fechada sem avisar): trata como offline
        rows.push({ id: d.id, ...p });
      });
      renderPresencePanel(rows);
    }, err => console.error('Erro ao sincronizar presença:', err));
}

function renderPresencePanel(rows) {
  const body = document.getElementById('presenceBody');
  if (!body) return;
  if (rows.length === 0) { body.innerHTML = `<span class="tc-meta">Ninguém além de você, por enquanto.</span>`; return; }
  body.innerHTML = rows.map(p => `
    <div class="presence-row">
      <span class="presence-dot" style="background:${p.color || '#8f8f88'}; color:${p.color || '#8f8f88'};"></span>
      <span>${escapeHtml(p.name || 'Jogador')}</span>
      <span class="presence-role">${p.role === 'master' ? 'Mestre' : 'Jogador'}</span>
    </div>`).join('');
}

function listenTable() {
  tableUnsub = db.collection('tables').doc(curTable.id).onSnapshot(doc => {
    if (!doc.exists) { alert('O mestre encerrou esta mesa.'); closeTable(); return; }
    curTable = { id: doc.id, ...doc.data() };
    document.getElementById('boardTitle').textContent = curTable.name;
    refreshBoardForActiveScene();
  });
}

function renderBoardBackground() {
  const surface = document.getElementById('boardSurface');
  const scene = getActiveScene();
  if (scene && scene.mapImage) {
    baseMapW = scene.mapW; baseMapH = scene.mapH;
    // O mapa gerado já tem a grade desenhada na própria imagem; usamos o
    // cellPx salvo junto com o mapa (fallback pro padrão em mapas antigos
    // salvos antes desse campo existir).
    boardCellPx = scene.cellPx || DEFAULT_CELL_PX;
    let img = surface.querySelector('img.map-bg');
    if (!img) {
      surface.innerHTML = '<img class="map-bg">';
      img = surface.querySelector('img.map-bg');
      attachBoardDragHandlers();
    }
    if (img.src !== scene.mapImage) {
      // Numa conexão de celular mais lenta, a imagem do mapa pode demorar
      // pra aparecer — sem nada na tela nesse meio-tempo, parece que travou.
      // O quadriculado de fundo do board-wrap já dá uma pista, mas some
      // assim que a tag <img> existe (mesmo vazia); esse spinner cobre esse
      // intervalo até o "load"/"error" da imagem.
      const wrap = document.getElementById('boardWrap');
      if (wrap) wrap.classList.add('map-loading');
      img.onload = () => { if (wrap) wrap.classList.remove('map-loading'); };
      img.onerror = () => { if (wrap) wrap.classList.remove('map-loading'); };
      img.src = scene.mapImage;
    }
    surface.style.backgroundImage = 'none';
  } else {
    baseMapW = 900; baseMapH = 612;
    boardCellPx = DEFAULT_CELL_PX;
    if (!surface.querySelector('.map-placeholder')) {
      surface.innerHTML = `<div class="map-placeholder" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:var(--ink-mute); font-size:14px; text-align:center; padding:20px;">
        ${isTableOwner() ? 'Gere um mapa ao lado, ou apenas mova os tokens sobre este fundo neutro.' : 'O mestre ainda não preparou um mapa para esta cena.'}
      </div>`;
      attachBoardDragHandlers();
    }
  }
  // O board-surface sempre fica no tamanho "natural" (sem zoom) — quem
  // aplica o zoom visualmente é o transform (translate + scale) em
  // applyBoardTransform, o que também escala os tokens (filhos do surface)
  // automaticamente, sem precisar recalcular cada um em px.
  surface.style.width = baseMapW + 'px';
  surface.style.height = baseMapH + 'px';
  applyBoardTransform(); // redesenha a grade, reposiciona tokens e aplica pan/zoom atuais
  // Um novo mapa (ou a primeira vez que o placeholder vira mapa de verdade)
  // pode ter zerado o innerHTML do surface acima — reconstrói as camadas de
  // desenho/névoa/marcações por cima do mapa, se já tivermos algo salvo.
  renderDrawings();
  renderFog();
  renderPings();
  renderTemplates();
}

// Desenha (ou remove) a grade "fantasma" de fundo quando ainda não há mapa
// gerado, sempre no mesmo tamanho de célula usado pelos tokens — assim dá
// pra ver exatamente onde cada token vai encaixar ao soltar.
function updateGhostGrid() {
  const surface = document.getElementById('boardSurface');
  if (!surface) return;
  const scene = getActiveScene();
  if (scene && scene.mapImage) { surface.style.backgroundImage = 'none'; return; }
  // O surface fica no tamanho natural (sem zoom) e é escalado inteiro via
  // transform, então o backgroundSize também usa o tamanho de célula "cru" —
  // o zoom visual da grade vem de graça, junto com o resto do mapa.
  surface.style.backgroundImage =
    `linear-gradient(var(--hairline) 1px, transparent 1px), linear-gradient(90deg, var(--hairline) 1px, transparent 1px)`;
  surface.style.backgroundSize = `${boardCellPx}px ${boardCellPx}px`;
}

// Aplica o pan/zoom atuais (boardPanX/Y, boardZoom) via CSS transform.
// Como board-surface tem tamanho fixo "natural", isso escala e reposiciona
// tudo dentro dele (mapa, grade fantasma e tokens) em bloco.
function applyBoardTransform() {
  const surface = document.getElementById('boardSurface');
  if (!surface) return;
  surface.style.transform = `translate(${boardPanX}px, ${boardPanY}px) scale(${boardZoom})`;
  const label = document.getElementById('zoomLabel');
  if (label) label.textContent = Math.round(boardZoom * 100) + '%';
  updateGhostGrid();
  renderAllTokens();
}

// Aplica um novo zoom mantendo fixo o ponto do mapa que está sob (ax, ay)
// — coordenadas em px relativas ao board-wrap. É isso que faz o zoom "mirar"
// no cursor do mouse (ou no meio do gesto de pinça) em vez de sempre
// recentralizar no canto do mapa.
function zoomBoardAt(newZoom, ax, ay) {
  newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newZoom));
  const sx = (ax - boardPanX) / boardZoom;
  const sy = (ay - boardPanY) / boardZoom;
  boardZoom = newZoom;
  boardPanX = ax - sx * boardZoom;
  boardPanY = ay - sy * boardZoom;
  applyBoardTransform();
}

// Botões de zoom (+/-/100%): usam o centro do tabuleiro visível como âncora.
function setBoardZoom(z) {
  const wrap = document.getElementById('boardWrap');
  const ax = wrap ? wrap.clientWidth / 2 : 0;
  const ay = wrap ? wrap.clientHeight / 2 : 0;
  zoomBoardAt(z, ax, ay);
}

function fitBoardToScreen() {
  const wrap = document.getElementById('boardWrap');
  if (!wrap || !baseMapW || !baseMapH) return;
  const availW = wrap.clientWidth - 16;
  const availH = wrap.clientHeight - 16;
  if (availW <= 0 || availH <= 0) {
    // O wrap ainda mede 0 — comum logo depois de abrir a mesa no celular,
    // enquanto o navegador ainda está terminando de calcular a altura da
    // tela (barra de endereço recolhendo, menu fechando etc.). Calcular o
    // zoom com uma medida 0 jogava o mapa inteiro pra fora da área visível
    // (era isso que fazia o mapa "sumir" no mobile). Em vez de um timeout
    // fixo torcendo pra já ter dado tempo, tenta de novo no próximo frame.
    requestAnimationFrame(() => requestAnimationFrame(fitBoardToScreen));
    return;
  }
  const z = Math.min(availW / baseMapW, availH / baseMapH);
  boardZoom = Math.max(ZOOM_MIN, Math.min(1, z));
  boardPanX = (wrap.clientWidth - baseMapW * boardZoom) / 2;
  boardPanY = (wrap.clientHeight - baseMapH * boardZoom) / 2;
  applyBoardTransform();
}

// Reajusta o mapa quando a janela muda de tamanho — rotação do celular,
// ou a barra de endereço do navegador mobile recolhendo/aparecendo (o que
// muda a altura real disponível sem disparar nenhum outro evento). Sem
// isso, um mapa que coube certinho na abertura podia ficar desalinhado ou
// cortado depois de girar a tela.
let boardRefitTimer = null;
function scheduleBoardRefit() {
  if (!curTable) return; // só importa com uma mesa aberta
  clearTimeout(boardRefitTimer);
  boardRefitTimer = setTimeout(fitBoardToScreen, 150);
}
window.addEventListener('resize', scheduleBoardRefit);
window.addEventListener('orientationchange', scheduleBoardRefit);
document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleBoardRefit(); });

function toggleFullscreenBoard() {
  const boardView = document.getElementById('boardView');
  const btn = document.getElementById('fullscreenBtn');
  const isFs = boardView.classList.toggle('fullscreen-mode');
  btn.textContent = isFs ? '⤢ Sair da tela cheia' : '⛶ Expandir mesa';
  // Dá um tempo pro layout se ajustar antes de recalcular o "ajustar à tela".
  setTimeout(fitBoardToScreen, 60);
}


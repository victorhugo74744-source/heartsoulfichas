function boardPointFromEvent(ev) {
const surface = document.getElementById('boardSurface');
const rect = surface.getBoundingClientRect();
let x = (ev.clientX - rect.left) / rect.width;
let y = (ev.clientY - rect.top) / rect.height;
return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
}
function renderToolToolbar() {
const bar = document.getElementById('toolToolbar');
if (!bar) return;
const isMaster = isTableOwner();
bar.innerHTML = `
<div class="tool-toolbar-label">Navegação</div>
<button type="button" data-tool="pan" title="Mover o mapa (padrão); com um token seu selecionado, as setas do teclado ajustam a posição dele fininho (Shift+seta pula uma casa inteira) e Delete/Backspace apaga ele (só Mestre) — atalho: V"><span class="tool-label">✋ Mover</span><kbd class="tool-key">V</kbd></button>
<button type="button" data-tool="ruler" title="Medir distância em casas da grade (segure Alt/Option para medir livre, sem encaixar) — atalho: R"><span class="tool-label">📏 Régua</span><kbd class="tool-key">R</kbd></button>
<button type="button" data-tool="ping" title="Marcar um ponto para todos verem, na sua cor — atalho: P"><span class="tool-label">📍 Marcar</span><kbd class="tool-key">P</kbd></button>
<button type="button" data-tool="select" title="Seleção múltipla: clique em cada token pra marcar/desmarcar, ou arraste sobre uma área vazia do mapa pra marcar todos de uma vez (Shift+arrastar acrescenta à seleção atual, Esc no meio do arrasto cancela) — Ctrl+A marca todos os tokens que dá pra mexer na cena — depois arraste qualquer um dos marcados para mover o grupo inteiro junto, use as setas do teclado para ajustar a posição fininho (Shift+seta pula uma casa inteira), ou Delete/Backspace pra apagar os marcados (só Mestre) — clique simples numa área vazia limpa a seleção — atalho: M"><span class="tool-label">🔲 Seleção múltipla</span><kbd class="tool-key">M</kbd></button>
<button type="button" id="cursorLockBtn"><span class="tool-label">🧭 Girar c/ cursor</span><kbd class="tool-key">T</kbd></button>
<div class="tool-toolbar-label">Áreas de efeito</div>
<button type="button" data-tool="template" data-shape="circle" title="Área circular (ex.: bola de fogo) — arraste do centro até a borda, na sua cor — atalho: 1"><span class="tool-label">⭕ Círculo</span><kbd class="tool-key">1</kbd></button>
<button type="button" data-tool="template" data-shape="cone" title="Área em cone (ex.: sopro de dragão) — arraste da origem até a ponta — atalho: 2"><span class="tool-label">🔺 Cone</span><kbd class="tool-key">2</kbd></button>
<button type="button" data-tool="template" data-shape="line" title="Área em linha (ex.: raio) — arraste do início até o fim — atalho: 3"><span class="tool-label">▭ Linha</span><kbd class="tool-key">3</kbd></button>
<button type="button" id="clearTemplatesBtn" title="Apagar suas áreas nesta cena (o Mestre apaga todas) — dica: com a ferramenta de área ativa, clique numa área pra apagar só ela — atalho: C"><span class="tool-label">🧹 Limpar áreas</span><kbd class="tool-key">C</kbd></button>
<div class="tool-toolbar-label">Grade</div>
<button type="button" id="snapToggleBtn" title="Ao soltar um token, encaixar automaticamente na célula mais próxima da grade (segure Alt/Option para soltar livre mesmo com isto ligado) — atalho: G"><span class="tool-label">🧲 Encaixar na grade</span><kbd class="tool-key">G</kbd></button>
<label class="cell-unit-label" title="Quantos metros equivalem a uma casa da grade — usado nos números da régua e das áreas de ataque">
<span>m/casa</span>
<input type="number" id="metersPerCellInput" min="0.5" step="0.5" value="${metersPerCell}">
</label>
${isMaster ? `
<div class="tt-sep"></div>
<div class="tool-toolbar-master">
<div class="tool-toolbar-label">Mestre</div>
<button type="button" data-tool="draw" title="Desenhar sobre o mapa — atalho: D"><span class="tool-label">✏️ Desenhar</span><kbd class="tool-key">D</kbd></button>
<button type="button" class="color-swatch" id="drawWheelBtn" style="background:${drawColor};" title="Cor do desenho (roda cromática)"></button>
<button type="button" id="undoDrawBtn" title="Desfazer o último traço — atalho: Ctrl/Cmd+Z"><span class="tool-label">↩️ Desfazer</span><kbd class="tool-key">Ctrl+Z</kbd></button>
<button type="button" id="clearDrawBtn" title="Apagar todos os desenhos desta cena — dica: com a ferramenta de desenho ativa, clique num traço pra apagar só ele — atalho: X"><span class="tool-label">🧹 Limpar desenhos</span><kbd class="tool-key">X</kbd></button>
<div class="tt-sep"></div>
<button type="button" data-tool="wall" title="Desenhar paredes que bloqueiam a visão dos tokens: clique ponto a ponto contornando o obstáculo e clique no ponto inicial (ou dê 2 cliques / Enter) para terminar — a névoa de guerra é revelada automaticamente pela visão de cada token (👁 na lista de tokens), bloqueada por estas paredes; botão direito (ou Backspace) desfaz o último ponto, Esc cancela o traço atual; com a ferramenta ativa (e nenhum traço em andamento), arraste um ponto já existente de uma parede salva para reposicioná-lo — atalho: W"><span class="tool-label">🧱 Parede</span><kbd class="tool-key">W</kbd></button>
<button type="button" data-tool="room" title="Contornar um retângulo/sala inteira com paredes de uma vez: arraste de um canto ao outro e solte — nasce como um contorno fechado, sem precisar clicar ponto a ponto — atalho: B"><span class="tool-label">▭ Sala</span><kbd class="tool-key">B</kbd></button>
<button type="button" id="clearWallsBtn" title="Apagar todas as paredes desta cena — atalho: Shift+W"><span class="tool-label">🧹 Limpar paredes</span><kbd class="tool-key">⇧W</kbd></button>
<button type="button" data-tool="door" title="Colocar uma porta: arraste de um lado ao outro do vão — porta nasce fechada (bloqueia a visão igual a uma parede); qualquer pessoa na mesa clica no ícone 🚪 no mapa para abrir/fechar, revelando a névoa do outro lado; botão direito (Mestre) tranca/destranca — porta trancada só o Mestre abre; com a ferramenta 🚪 ativa, clicar numa porta já existente a apaga — atalho: O"><span class="tool-label">🚪 Porta</span><kbd class="tool-key">O</kbd></button>
<button type="button" id="clearDoorsBtn" title="Apagar todas as portas desta cena — atalho: Shift+O"><span class="tool-label">🧹 Limpar portas</span><kbd class="tool-key">⇧O</kbd></button>
<div class="tt-sep"></div>
<button type="button" data-tool="light" title="Colocar uma fonte de luz (tocha): clique no mapa para acender uma — ela revela sua área sempre, independente de onde os tokens estão, bloqueada pelas paredes; role a roda do mouse sobre uma luz já acesa pra ajustar o raio; com a ferramenta ativa, clique numa luz já existente pra apagá-la — atalho: L"><span class="tool-label">🔥 Luz</span><kbd class="tool-key">L</kbd></button>
<button type="button" id="clearLightsBtn" title="Apagar todas as fontes de luz desta cena — atalho: Shift+L"><span class="tool-label">🧹 Limpar luzes</span><kbd class="tool-key">⇧L</kbd></button>
<button type="button" id="darknessToggleBtn" title="Escuridão real: liga/desliga pra esta cena. Ligada, cada token só enxerga bem perto de si (mais o alcance da própria visão no escuro, ajustável no painel do token) — exceto onde uma fonte de luz (🔥) estiver acesa. Desligada (padrão), os tokens enxergam normalmente até o alcance de visão de cada um, como sempre — atalho: N"><span class="tool-label">🌑 Escuridão</span><kbd class="tool-key">N</kbd></button>
<div class="tt-sep"></div>
<button type="button" id="resetExploredBtn" title="Resetar a memória de exploração desta cena: a névoa volta a cobrir tudo que já foi visto até agora — as paredes e o mapa em si não são afetados">
<span class="tool-label">🌫 Resetar memória</span>
</button>
</div>
` : ''}`;
bar.querySelectorAll('[data-tool]').forEach(btn => btn.addEventListener('click', () => {
if (btn.dataset.shape) templateShape = btn.dataset.shape;
setBoardTool(btn.dataset.tool);
}));
const drawWheelBtn = document.getElementById('drawWheelBtn');
if (drawWheelBtn) drawWheelBtn.addEventListener('click', () => {
openColorWheel(drawWheelBtn, drawColor, (hex) => {
drawColor = hex;
renderToolToolbar();
setBoardTool('draw');
});
});
const clearDrawBtn = document.getElementById('clearDrawBtn');
if (clearDrawBtn) clearDrawBtn.addEventListener('click', clearAllDrawings);
const undoDrawBtn = document.getElementById('undoDrawBtn');
if (undoDrawBtn) undoDrawBtn.addEventListener('click', undoLastDrawing);
const clearWallsBtn = document.getElementById('clearWallsBtn');
if (clearWallsBtn) clearWallsBtn.addEventListener('click', clearAllWalls);
const clearDoorsBtn = document.getElementById('clearDoorsBtn');
if (clearDoorsBtn) clearDoorsBtn.addEventListener('click', clearAllDoors);
const clearLightsBtn = document.getElementById('clearLightsBtn');
if (clearLightsBtn) clearLightsBtn.addEventListener('click', clearAllLights);
const darknessBtn = document.getElementById('darknessToggleBtn');
if (darknessBtn) darknessBtn.addEventListener('click', toggleSceneDarkness);
const resetExploredBtn = document.getElementById('resetExploredBtn');
if (resetExploredBtn) resetExploredBtn.addEventListener('click', resetExplorationMemory);
const clearTemplatesBtn = document.getElementById('clearTemplatesBtn');
if (clearTemplatesBtn) clearTemplatesBtn.addEventListener('click', clearMyOrAllTemplates);
const snapBtn = document.getElementById('snapToggleBtn');
if (snapBtn) snapBtn.addEventListener('click', toggleSnapToGrid);
const cursorLockBtn = document.getElementById('cursorLockBtn');
if (cursorLockBtn) cursorLockBtn.addEventListener('click', toggleCursorFollowForSelectedToken);
const metersInput = document.getElementById('metersPerCellInput');
if (metersInput) metersInput.addEventListener('change', () => {
const v = parseFloat(metersInput.value);
metersPerCell = (isFinite(v) && v > 0) ? v : 1;
metersInput.value = metersPerCell;
try { localStorage.setItem('mesaMetersPerCell', String(metersPerCell)); } catch (e) {}
renderTemplates();
});
updateToolToolbarActive();
}
function toggleSnapToGrid() {
snapToGrid = !snapToGrid;
try { localStorage.setItem('mesaSnapGrid', snapToGrid ? '1' : '0'); } catch (e) {}
updateToolToolbarActive();
}
function updateToolToolbarActive() {
const bar = document.getElementById('toolToolbar');
if (!bar) return;
bar.querySelectorAll('[data-tool]').forEach(b => {
const active = b.dataset.tool === boardTool && (!b.dataset.shape || b.dataset.shape === templateShape);
b.classList.toggle('tool-active', active);
});
const snapBtn = document.getElementById('snapToggleBtn');
if (snapBtn) snapBtn.classList.toggle('tool-active', snapToGrid);
const cursorLockBtn = document.getElementById('cursorLockBtn');
if (cursorLockBtn) {
const tok = selectedTokenId ? liveTokens[selectedTokenId] : null;
const canEdit = !!(tok && curUser && (isTableOwner() || tok.ownerId === curUser.uid));
const on = !!(canEdit && cursorFollowTokenIds.has(selectedTokenId));
cursorLockBtn.disabled = !canEdit;
cursorLockBtn.classList.toggle('tool-active', on);
cursorLockBtn.title = !canEdit
? 'Selecione (clique em) um token seu no mapa para travar o giro dele no cursor — atalho: T'
: (on
? 'Destravar: o token para de girar sozinho — atalho: T'
: 'Travar: o token gira sozinho apontando pra onde o cursor estiver sobre o mapa, e todos na mesa veem o giro ao vivo — atalho: T');
}
const darknessBtn = document.getElementById('darknessToggleBtn');
if (darknessBtn) {
const scene = typeof getActiveScene === 'function' ? getActiveScene() : null;
darknessBtn.classList.toggle('tool-active', !!(scene && scene.darkness));
}
if (typeof renderWalls === 'function' && typeof isTableOwner === 'function' && isTableOwner()) renderWalls();
const wrap = document.getElementById('boardWrap');
if (wrap) {
wrap.classList.remove('tool-draw', 'tool-wall', 'tool-door', 'tool-room', 'tool-light', 'tool-ruler', 'tool-ping', 'tool-template');
if (boardTool !== 'pan') wrap.classList.add('tool-' + boardTool);
}
}
function setBoardTool(tool) {
if (boardTool === 'wall' && tool !== 'wall' && typeof cancelWallChain === 'function') cancelWallChain();
if (boardTool === 'door' && tool !== 'door' && typeof cancelDoorDraft === 'function') cancelDoorDraft();
if (boardTool === 'room' && tool !== 'room' && typeof cancelRoomDraft === 'function') cancelRoomDraft();
if (boardTool === 'select' && tool !== 'select' && typeof multiSelectedIds !== 'undefined' && multiSelectedIds.size) {
multiSelectedIds.clear();
if (typeof renderAllTokens === 'function') renderAllTokens();
if (typeof renderTokenListPanel === 'function') renderTokenListPanel();
}
boardTool = tool;
updateToolToolbarActive();
}
function handleBoardKeydown(e) {
if (!curTable || !document.getElementById('boardView') ||
document.getElementById('boardView').style.display === 'none') return;
const tag = (e.target.tagName || '').toLowerCase();
if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
if (e.ctrlKey || e.metaKey) {
if (e.key.toLowerCase() === 'z') { e.preventDefault(); undoLastDrawing(); return; }
if (e.key.toLowerCase() === 'a') {
e.preventDefault();
if (boardTool !== 'select') setBoardTool('select');
const picked = new Set();
Object.values(liveTokens).forEach(t => {
if (!t || t.id === undefined) return;
if (!isTokenInActiveScene(t) || !isTokenVisibleToViewer(t)) return;
if (canDragToken(t)) picked.add(t.id);
});
multiSelectedIds = picked;
renderAllTokens();
renderTokenListPanel();
}
return;
}
if (e.altKey) return;
const isMaster = isTableOwner();
const key = e.key.toLowerCase();
if (boardTool === 'wall' && isMaster) {
if (key === 'enter' && wallPoints.length >= 2) { e.preventDefault(); finishWallChain(false); return; }
if (key === 'backspace' && wallPoints.length) { e.preventDefault(); wallPoints.pop(); renderWallPreview(); return; }
}
switch (key) {
case 'escape':
if (boardTool === 'wall' && wallPoints.length) cancelWallChain();
else if (boardTool === 'door' && doorStartPt) cancelDoorDraft();
else if (boardTool === 'room' && roomStartPt) cancelRoomDraft();
else setBoardTool('pan');
break;
case 'v': setBoardTool('pan'); break;
case 'r': setBoardTool('ruler'); break;
case 'p': setBoardTool('ping'); break;
case 'm': setBoardTool('select'); break;
case 'arrowup': case 'arrowdown': case 'arrowleft': case 'arrowright': {
if (boardTool !== 'pan' && boardTool !== 'select') return;
const step = e.shiftKey ? 1 : 0.25;
const dx = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0;
const dy = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0;
if (!nudgeSelectedTokens(dx, dy)) return;
break;
}
case 'delete': case 'backspace': {
if (!isMaster) return;
const ids = (boardTool === 'select' && multiSelectedIds.size)
? Array.from(multiSelectedIds)
: (selectedTokenId ? [selectedTokenId] : []);
if (!ids.length) return;
e.preventDefault();
deleteTokensById(ids);
break;
}
case '1': templateShape = 'circle'; setBoardTool('template'); break;
case '2': templateShape = 'cone'; setBoardTool('template'); break;
case '3': templateShape = 'line'; setBoardTool('template'); break;
case 'c': clearMyOrAllTemplates(); break;
case 'g': toggleSnapToGrid(); break;
case 't': toggleCursorFollowForSelectedToken(); break;
case 'd': if (isMaster) setBoardTool('draw'); break;
case 'w': if (isMaster) { if (e.shiftKey) clearAllWalls(); else setBoardTool('wall'); } break;
case 'b': if (isMaster) setBoardTool('room'); break;
case 'o': if (isMaster) { if (e.shiftKey) clearAllDoors(); else setBoardTool('door'); } break;
case 'l': if (isMaster) { if (e.shiftKey) clearAllLights(); else setBoardTool('light'); } break;
case 'n': if (isMaster) toggleSceneDarkness(); break;
case 'x': if (isMaster) clearAllDrawings(); break;
default: return;
}
e.preventDefault();
}
let rulerPointerId = null, rulerStartScreen = null;
function rulerScreenToMapFraction(clientX, clientY) {
const surface = document.getElementById('boardSurface');
const rect = surface.getBoundingClientRect();
const x = rect.width ? (clientX - rect.left) / rect.width : 0;
const y = rect.height ? (clientY - rect.top) / rect.height : 0;
return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
}
function rulerMapFractionToWrapPoint(fx, fy) {
const surface = document.getElementById('boardSurface');
const wrap = document.getElementById('boardWrap');
const sRect = surface.getBoundingClientRect();
const wRect = wrap.getBoundingClientRect();
return { x: (sRect.left - wRect.left) + fx * sRect.width, y: (sRect.top - wRect.top) + fy * sRect.height };
}
function attachRulerHandlers(wrap) {
wrap.addEventListener('pointerdown', (e) => {
if (boardTool !== 'ruler') return;
rulerPointerId = e.pointerId;
rulerStartScreen = { x: e.clientX, y: e.clientY };
wrap.setPointerCapture(e.pointerId);
e.preventDefault();
});
wrap.addEventListener('pointermove', (e) => {
if (rulerPointerId !== e.pointerId || !rulerStartScreen) return;
drawRulerOverlay(rulerStartScreen, { x: e.clientX, y: e.clientY }, e.altKey, e.pointerType);
});
const endRuler = (e) => {
if (rulerPointerId !== e.pointerId) return;
rulerPointerId = null; rulerStartScreen = null;
clearRulerOverlay();
};
wrap.addEventListener('pointerup', endRuler);
wrap.addEventListener('pointercancel', endRuler);
}
function clearRulerOverlay() {
const wrap = document.getElementById('boardWrap');
if (!wrap) return;
const line = wrap.querySelector('.ruler-line-svg');
const label = wrap.querySelector('.ruler-label');
if (line) line.remove();
if (label) label.remove();
}
function drawRulerOverlay(a, b, freePlace, pointerType) {
const wrap = document.getElementById('boardWrap');
const surface = document.getElementById('boardSurface');
if (!wrap || !surface) return;
const wRect = wrap.getBoundingClientRect();
const localW = surface.offsetWidth || baseMapW;
const localH = surface.offsetHeight || baseMapH;
let aFrac = rulerScreenToMapFraction(a.x, a.y);
let bFrac = rulerScreenToMapFraction(b.x, b.y);
const shouldSnap = snapToGrid && !freePlace;
if (shouldSnap) {
aFrac = { x: snapAxisToGrid(aFrac.x, localW, boardCellPx), y: snapAxisToGrid(aFrac.y, localH, boardCellPx) };
bFrac = { x: snapAxisToGrid(bFrac.x, localW, boardCellPx), y: snapAxisToGrid(bFrac.y, localH, boardCellPx) };
}
const aPt = rulerMapFractionToWrapPoint(aFrac.x, aFrac.y);
const bPt = rulerMapFractionToWrapPoint(bFrac.x, bFrac.y);
let svg = wrap.querySelector('.ruler-line-svg');
if (!svg) {
svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('class', 'ruler-line ruler-line-svg');
svg.innerHTML = '<rect class="ruler-cell-a" fill="none" stroke="var(--gold, #C9A15C)" stroke-width="2"/>' +
'<rect class="ruler-cell-b" fill="none" stroke="var(--gold, #C9A15C)" stroke-width="2"/>' +
'<line stroke="var(--gold, #C9A15C)" stroke-width="2.5" stroke-dasharray="6 5"/>' +
'<circle r="4" fill="var(--gold, #C9A15C)"/>';
wrap.appendChild(svg);
}
svg.style.left = '0'; svg.style.top = '0';
svg.setAttribute('width', wRect.width); svg.setAttribute('height', wRect.height);
const line = svg.querySelector('line');
line.setAttribute('x1', aPt.x); line.setAttribute('y1', aPt.y); line.setAttribute('x2', bPt.x); line.setAttribute('y2', bPt.y);
const circle = svg.querySelector('circle');
circle.setAttribute('cx', bPt.x); circle.setAttribute('cy', bPt.y);
const cellScreen = boardCellPx * boardZoom;
const cellA = svg.querySelector('.ruler-cell-a'), cellB = svg.querySelector('.ruler-cell-b');
[cellA, cellB].forEach(r => r.style.display = shouldSnap ? '' : 'none');
if (shouldSnap) {
cellA.setAttribute('x', aPt.x - cellScreen / 2); cellA.setAttribute('y', aPt.y - cellScreen / 2);
cellA.setAttribute('width', cellScreen); cellA.setAttribute('height', cellScreen);
cellB.setAttribute('x', bPt.x - cellScreen / 2); cellB.setAttribute('y', bPt.y - cellScreen / 2);
cellB.setAttribute('width', cellScreen); cellB.setAttribute('height', cellScreen);
}
let label = wrap.querySelector('.ruler-label');
if (!label) {
label = document.createElement('div');
label.className = 'ruler-label';
wrap.appendChild(label);
}
const dxCells = boardCellPx ? ((bFrac.x - aFrac.x) * localW) / boardCellPx : 0;
const dyCells = boardCellPx ? ((bFrac.y - aFrac.y) * localH) / boardCellPx : 0;
const cells = Math.hypot(dxCells, dyCells);
label.textContent = formatCellsAndMeters(cells, shouldSnap ? '' : ' (livre)');
const isTouch = pointerType === 'touch' || pointerType === 'pen';
label.classList.toggle('ruler-label-touch', isTouch);
if (isTouch) {
label.style.left = '50%';
label.style.top = '10px';
label.style.transform = 'translateX(-50%)';
} else {
label.style.transform = 'none';
label.style.left = (bPt.x + 14) + 'px';
label.style.top = (bPt.y - 10) + 'px';
}
}
let drawPointerId = null, drawCurrentPoints = null;
let lastOwnDrawingId = null;
function attachDrawHandlers(wrap) {
wrap.addEventListener('pointerdown', (e) => {
if (boardTool !== 'draw' || !isTableOwner()) return;
drawPointerId = e.pointerId;
drawCurrentPoints = [boardPointFromEvent(e)];
wrap.setPointerCapture(e.pointerId);
e.preventDefault();
});
wrap.addEventListener('pointermove', (e) => {
if (drawPointerId !== e.pointerId || !drawCurrentPoints) return;
drawCurrentPoints.push(boardPointFromEvent(e));
renderLiveDrawStroke(drawCurrentPoints);
});
const endDraw = async (e) => {
if (drawPointerId !== e.pointerId) return;
drawPointerId = null;
const pts = drawCurrentPoints; drawCurrentPoints = null;
removeLiveDrawStroke();
if (!pts || pts.length < 2) return;
if (!curTable.activeSceneId) return;
try {
const ref = await db.collection('tables').doc(curTable.id).collection('drawings').add({
points: pts, color: drawColor, by: curUser.uid, sceneId: curTable.activeSceneId,
createdAt: firebase.firestore.FieldValue.serverTimestamp()
});
lastOwnDrawingId = ref.id;
} catch (err) { console.error('Erro ao salvar desenho:', err); }
};
wrap.addEventListener('pointerup', endDraw);
wrap.addEventListener('pointercancel', endDraw);
}
function drawSvgLayer() {
let svg = document.getElementById('drawSvgLayer');
if (!svg) {
svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.id = 'drawSvgLayer';
svg.style.position = 'absolute'; svg.style.top = '0'; svg.style.left = '0';
svg.style.pointerEvents = 'none';
document.getElementById('boardSurface').appendChild(svg);
}
svg.setAttribute('width', baseMapW); svg.setAttribute('height', baseMapH);
svg.setAttribute('viewBox', `0 0 ${baseMapW} ${baseMapH}`);
return svg;
}
function pointsToPathAttr(points) {
return points.map(p => `${(p.x * baseMapW).toFixed(1)},${(p.y * baseMapH).toFixed(1)}`).join(' ');
}
function renderLiveDrawStroke(points) {
const svg = drawSvgLayer();
let live = svg.querySelector('#liveDrawStroke');
if (!live) {
live = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
live.id = 'liveDrawStroke';
live.setAttribute('fill', 'none');
live.setAttribute('stroke-linecap', 'round');
live.setAttribute('stroke-linejoin', 'round');
svg.appendChild(live);
}
live.setAttribute('stroke', drawColor);
live.setAttribute('stroke-width', Math.max(2, boardCellPx * 0.08));
live.setAttribute('points', pointsToPathAttr(points));
}
function removeLiveDrawStroke() {
const live = document.querySelector('#drawSvgLayer #liveDrawStroke');
if (live) live.remove();
}
function renderDrawings() {
const svg = drawSvgLayer();
svg.querySelectorAll('polyline[data-drawing-id]').forEach(el => {
if (!liveDrawings[el.dataset.drawingId]) el.remove();
});
Object.values(liveDrawings).forEach(d => {
let el = svg.querySelector(`polyline[data-drawing-id="${d.id}"]`);
if (!el) {
el = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
el.dataset.drawingId = d.id;
el.setAttribute('fill', 'none');
el.setAttribute('stroke-linecap', 'round');
el.setAttribute('stroke-linejoin', 'round');
el.style.cursor = 'pointer';
svg.appendChild(el);
el.addEventListener('pointerdown', async (e) => {
if (boardTool !== 'draw' || !isTableOwner()) return;
e.stopPropagation();
try {
await db.collection('tables').doc(curTable.id).collection('drawings').doc(d.id).delete();
if (lastOwnDrawingId === d.id) lastOwnDrawingId = null;
} catch (err) { console.error('Erro ao apagar traço:', err); }
});
}
el.setAttribute('stroke', d.color || '#e0473f');
el.setAttribute('stroke-width', Math.max(2, boardCellPx * 0.08));
el.setAttribute('points', pointsToPathAttr(d.points || []));
});
}
function listenDrawings() {
if (!curTable.activeSceneId) return;
drawUnsub = db.collection('tables').doc(curTable.id).collection('drawings')
.where('sceneId', '==', curTable.activeSceneId)
.onSnapshot(snap => {
liveDrawings = {};
snap.forEach(d => { liveDrawings[d.id] = { id: d.id, ...d.data() }; });
renderDrawings();
}, err => console.error('Erro ao sincronizar desenhos:', err));
}
async function undoLastDrawing() {
if (!lastOwnDrawingId) return;
const id = lastOwnDrawingId;
lastOwnDrawingId = null;
try {
await db.collection('tables').doc(curTable.id).collection('drawings').doc(id).delete();
} catch (err) { console.error('Erro ao desfazer traço:', err); }
}
async function clearAllDrawings() {
if (!curTable.activeSceneId) return;
if (!confirm('Apagar todos os desenhos desta cena?')) return;
try {
const snap = await db.collection('tables').doc(curTable.id).collection('drawings')
.where('sceneId', '==', curTable.activeSceneId).get();
const batch = db.batch();
snap.forEach(d => batch.delete(d.ref));
await batch.commit();
lastOwnDrawingId = null;
} catch (err) { alert('Erro ao limpar desenhos: ' + err.message); }
}
function renderFog() {  }
function listenFog() {  }
let wallPointerId = null;
let wallPoints = [], wallHoverPoint = null;
function attachWallHandlers(wrap) {
wrap.addEventListener('pointerdown', (e) => {
if (boardTool !== 'wall' || !isTableOwner()) return;
if (e.target.closest('.wall-line-shape')) return;
if (e.button === 2) return;
e.preventDefault();
const pt = boardPointFromEvent(e);
if (wallPoints.length >= 3 && isNearWallStart(pt)) { finishWallChain(true); return; }
wallPoints.push(pt);
renderWallPreview();
});
wrap.addEventListener('pointermove', (e) => {
if (boardTool !== 'wall' || !wallPoints.length) return;
wallHoverPoint = boardPointFromEvent(e);
renderWallPreview();
});
wrap.addEventListener('dblclick', (e) => {
if (boardTool !== 'wall' || wallPoints.length < 2) return;
e.preventDefault();
finishWallChain(false);
});
wrap.addEventListener('contextmenu', (e) => {
if (boardTool !== 'wall') return;
e.preventDefault();
if (wallPoints.length) { wallPoints.pop(); renderWallPreview(); }
});
}
function wallSvgLayer() {
let svg = document.getElementById('wallSvgLayer');
if (!svg) {
svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.id = 'wallSvgLayer';
svg.style.position = 'absolute'; svg.style.top = '0'; svg.style.left = '0';
svg.style.pointerEvents = 'none';
document.getElementById('boardSurface').appendChild(svg);
}
svg.setAttribute('width', baseMapW); svg.setAttribute('height', baseMapH);
svg.setAttribute('viewBox', `0 0 ${baseMapW} ${baseMapH}`);
return svg;
}
function isNearWallStart(pt) {
const first = wallPoints[0];
const dx = (pt.x - first.x) * baseMapW, dy = (pt.y - first.y) * baseMapH;
return Math.hypot(dx, dy) < Math.max(14, boardCellPx * 0.25);
}
function renderWallPreview() {
const svg = wallSvgLayer();
if (!wallPoints.length) { removeWallPreview(); return; }
let g = svg.querySelector('#liveWallPreview');
if (!g) {
g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
g.id = 'liveWallPreview';
g.innerHTML = '<polyline class="wall-line-live"></polyline>';
svg.appendChild(g);
}
const linePts = wallHoverPoint ? [...wallPoints, wallHoverPoint] : wallPoints;
g.querySelector('.wall-line-live').setAttribute('points', pointsToPathAttr(linePts));
g.querySelectorAll('.wall-live-dot, .wall-live-first').forEach(el => el.remove());
wallPoints.forEach((p, i) => {
const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
c.setAttribute('cx', p.x * baseMapW); c.setAttribute('cy', p.y * baseMapH);
const isFirst = i === 0 && wallPoints.length >= 3;
c.setAttribute('r', isFirst ? 8 : 4);
c.setAttribute('class', isFirst ? 'wall-live-first' : 'wall-live-dot');
g.appendChild(c);
});
}
function removeWallPreview() {
const g = document.querySelector('#wallSvgLayer #liveWallPreview');
if (g) g.remove();
}
async function finishWallChain(closed) {
const pts = wallPoints;
wallPoints = []; wallHoverPoint = null;
removeWallPreview();
if (pts.length < 2 || !curTable.activeSceneId) return;
try {
await db.collection('tables').doc(curTable.id).collection('walls').add({
points: pts.map(p => ({ x: p.x, y: p.y })),
closed: !!closed,
sceneId: curTable.activeSceneId
});
} catch (err) { console.error('Erro ao salvar parede:', err); }
}
function cancelWallChain() {
wallPoints = []; wallHoverPoint = null;
removeWallPreview();
}
function renderWalls() {
const svg = wallSvgLayer();
const isMaster = isTableOwner();
svg.style.display = isMaster ? '' : 'none';
if (!isMaster) return;
svg.querySelectorAll('polyline[data-wall-id]').forEach(el => {
if (!liveWalls[el.dataset.wallId]) el.remove();
});
svg.querySelectorAll('circle.wall-edit-dot[data-wall-id]').forEach(el => {
if (!liveWalls[el.dataset.wallId]) el.remove();
});
const showHandles = boardTool === 'wall' && !wallPoints.length;
Object.values(liveWalls).forEach(w => {
let el = svg.querySelector(`polyline[data-wall-id="${w.id}"]`);
if (!el) {
el = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
el.dataset.wallId = w.id;
el.setAttribute('class', 'wall-line-shape');
el.style.pointerEvents = 'auto';
svg.appendChild(el);
el.addEventListener('pointerdown', async (e) => {
if (boardTool !== 'wall' || !isTableOwner()) return;
if (e.target.closest('.wall-edit-dot')) return;
e.stopPropagation();
try { await db.collection('tables').doc(curTable.id).collection('walls').doc(w.id).delete(); }
catch (err) { console.error('Erro ao apagar parede:', err); }
});
}
const pts = w.points || [];
const drawPts = (w.closed && pts.length >= 3) ? [...pts, pts[0]] : pts;
el.setAttribute('points', pointsToPathAttr(drawPts));
pts.forEach((p, idx) => {
let dot = svg.querySelector(`circle.wall-edit-dot[data-wall-id="${w.id}"][data-pt="${idx}"]`);
if (!dot) {
dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
dot.dataset.wallId = w.id;
dot.dataset.pt = idx;
dot.setAttribute('class', 'wall-edit-dot');
dot.setAttribute('r', 6);
dot.style.pointerEvents = 'auto';
svg.appendChild(dot);
dot.addEventListener('pointerdown', (e) => startWallVertexDrag(e, w.id, idx));
const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
title.textContent = 'Arraste para mover este ponto da parede';
dot.appendChild(title);
}
dot.setAttribute('cx', p.x * baseMapW);
dot.setAttribute('cy', p.y * baseMapH);
dot.style.display = showHandles ? '' : 'none';
});
});
}
let wallVertexDrag = null;
function startWallVertexDrag(e, wallId, idx) {
if (boardTool !== 'wall' || !isTableOwner()) return;
e.stopPropagation();
e.preventDefault();
const w = liveWalls[wallId];
if (!w) return;
wallVertexDrag = { wallId, idx, pointerId: e.pointerId, points: (w.points || []).map(p => ({ x: p.x, y: p.y })) };
document.addEventListener('pointermove', onWallVertexDragMove);
document.addEventListener('pointerup', onWallVertexDragEnd);
document.addEventListener('pointercancel', onWallVertexDragEnd);
}
function onWallVertexDragMove(e) {
if (!wallVertexDrag || e.pointerId !== wallVertexDrag.pointerId) return;
const pt = boardPointFromEvent(e);
wallVertexDrag.points[wallVertexDrag.idx] = pt;
const svg = wallSvgLayer();
const dot = svg.querySelector(`circle.wall-edit-dot[data-wall-id="${wallVertexDrag.wallId}"][data-pt="${wallVertexDrag.idx}"]`);
if (dot) { dot.setAttribute('cx', pt.x * baseMapW); dot.setAttribute('cy', pt.y * baseMapH); }
const line = svg.querySelector(`polyline[data-wall-id="${wallVertexDrag.wallId}"]`);
const w = liveWalls[wallVertexDrag.wallId];
if (line && w) {
const drawPts = (w.closed && wallVertexDrag.points.length >= 3) ? [...wallVertexDrag.points, wallVertexDrag.points[0]] : wallVertexDrag.points;
line.setAttribute('points', pointsToPathAttr(drawPts));
}
}
async function onWallVertexDragEnd(e) {
if (!wallVertexDrag || e.pointerId !== wallVertexDrag.pointerId) return;
const { wallId, points } = wallVertexDrag;
wallVertexDrag = null;
document.removeEventListener('pointermove', onWallVertexDragMove);
document.removeEventListener('pointerup', onWallVertexDragEnd);
document.removeEventListener('pointercancel', onWallVertexDragEnd);
try {
await db.collection('tables').doc(curTable.id).collection('walls').doc(wallId).update({ points });
} catch (err) { console.error('Erro ao mover ponto da parede:', err); }
}
function listenWalls() {
if (!curTable.activeSceneId) return;
wallsUnsub = db.collection('tables').doc(curTable.id).collection('walls')
.where('sceneId', '==', curTable.activeSceneId)
.onSnapshot(snap => {
liveWalls = {};
snap.forEach(d => { liveWalls[d.id] = { id: d.id, ...d.data() }; });
invalidateCollisionSegmentsCache();
renderWalls();
scheduleVisionRecompute();
}, err => console.error('Erro ao sincronizar paredes:', err));
}
async function clearAllWalls() {
if (!curTable.activeSceneId) return;
if (!confirm('Apagar todas as paredes desta cena?')) return;
try {
const snap = await db.collection('tables').doc(curTable.id).collection('walls')
.where('sceneId', '==', curTable.activeSceneId).get();
const batch = db.batch();
snap.forEach(d => batch.delete(d.ref));
await batch.commit();
} catch (err) { alert('Erro ao limpar paredes: ' + err.message); }
}
async function regenerateWallsFromGrid(sceneId, grid, cols, rows) {
const tableRef = db.collection('tables').doc(curTable.id);
const [oldWalls, oldDoors, oldLights] = await Promise.all([
tableRef.collection('walls').where('sceneId', '==', sceneId).get(),
tableRef.collection('doors').where('sceneId', '==', sceneId).get(),
tableRef.collection('lights').where('sceneId', '==', sceneId).get()
]);
const segments = mapgenWallSegmentsFromGrid(grid, cols, rows);
const ops = [];
oldWalls.forEach(d => ops.push({ type: 'delete', ref: d.ref }));
oldDoors.forEach(d => ops.push({ type: 'delete', ref: d.ref }));
oldLights.forEach(d => ops.push({ type: 'delete', ref: d.ref }));
segments.forEach(s => ops.push({
type: 'create',
ref: tableRef.collection('walls').doc(),
data: {
points: [{ x: s.x1 / cols, y: s.y1 / rows }, { x: s.x2 / cols, y: s.y2 / rows }],
closed: false, sceneId
}
}));
const CHUNK = 400;
for (let i = 0; i < ops.length; i += CHUNK) {
const batch = db.batch();
ops.slice(i, i + CHUNK).forEach(op => {
if (op.type === 'delete') batch.delete(op.ref); else batch.set(op.ref, op.data);
});
await batch.commit();
}
await clearSceneExplorationMemory(sceneId).catch(() => {});
if (typeof invalidateCollisionSegmentsCache === 'function') invalidateCollisionSegmentsCache();
visionFullRedrawNeeded = true;
if (typeof scheduleVisionRecompute === 'function') scheduleVisionRecompute();
}
let doorPointerId = null;
let doorStartPt = null;
function attachDoorHandlers(wrap) {
wrap.addEventListener('pointerdown', (e) => {
if (boardTool !== 'door' || !isTableOwner()) return;
if (e.target.closest('.door-mark')) return;
if (e.button === 2) return;
e.preventDefault();
doorPointerId = e.pointerId;
doorStartPt = boardPointFromEvent(e);
wrap.setPointerCapture(e.pointerId);
renderDoorPreview(doorStartPt, doorStartPt);
});
wrap.addEventListener('pointermove', (e) => {
if (boardTool !== 'door' || doorPointerId !== e.pointerId || !doorStartPt) return;
renderDoorPreview(doorStartPt, boardPointFromEvent(e));
});
const endDoor = async (e) => {
if (doorPointerId !== e.pointerId) return;
doorPointerId = null;
const start = doorStartPt; doorStartPt = null;
removeDoorPreview();
if (!start || !curTable.activeSceneId) return;
const end = boardPointFromEvent(e);
const dx = (end.x - start.x) * baseMapW, dy = (end.y - start.y) * baseMapH;
if (Math.hypot(dx, dy) < 6) return;
try {
await db.collection('tables').doc(curTable.id).collection('doors').add({
x1: start.x, y1: start.y, x2: end.x, y2: end.y,
open: false, sceneId: curTable.activeSceneId
});
} catch (err) { console.error('Erro ao salvar porta:', err); }
};
wrap.addEventListener('pointerup', endDoor);
wrap.addEventListener('pointercancel', endDoor);
}
function cancelDoorDraft() {
doorPointerId = null; doorStartPt = null;
removeDoorPreview();
}
function doorSvgLayer() {
let svg = document.getElementById('doorSvgLayer');
if (!svg) {
svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.id = 'doorSvgLayer';
svg.style.position = 'absolute'; svg.style.top = '0'; svg.style.left = '0';
svg.style.pointerEvents = 'none';
document.getElementById('boardSurface').appendChild(svg);
}
svg.setAttribute('width', baseMapW); svg.setAttribute('height', baseMapH);
svg.setAttribute('viewBox', `0 0 ${baseMapW} ${baseMapH}`);
return svg;
}
function renderDoorPreview(a, b) {
const svg = doorSvgLayer();
let line = svg.querySelector('#liveDoorPreview');
if (!line) {
line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
line.id = 'liveDoorPreview';
line.setAttribute('class', 'door-line-live');
svg.appendChild(line);
}
line.setAttribute('x1', a.x * baseMapW); line.setAttribute('y1', a.y * baseMapH);
line.setAttribute('x2', b.x * baseMapW); line.setAttribute('y2', b.y * baseMapH);
}
function removeDoorPreview() {
const line = document.querySelector('#doorSvgLayer #liveDoorPreview');
if (line) line.remove();
}
function renderDoors() {
const svg = doorSvgLayer();
const isMaster = isTableOwner();
svg.querySelectorAll('[data-door-id]').forEach(el => {
if (!liveDoors[el.dataset.doorId]) { el.remove(); delete doorMarkElCache[el.dataset.doorId]; }
});
Object.values(liveDoors).forEach(d => {
let line = svg.querySelector(`line[data-door-id="${d.id}"]`);
if (!line) {
line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
line.dataset.doorId = d.id;
line.setAttribute('class', 'door-line-shape');
svg.appendChild(line);
}
line.setAttribute('x1', d.x1 * baseMapW); line.setAttribute('y1', d.y1 * baseMapH);
line.setAttribute('x2', d.x2 * baseMapW); line.setAttribute('y2', d.y2 * baseMapH);
line.style.display = isMaster ? '' : 'none';
let mark = svg.querySelector(`g[data-door-id="${d.id}"]`);
if (!mark) {
mark = document.createElementNS('http://www.w3.org/2000/svg', 'g');
mark.dataset.doorId = d.id;
mark.setAttribute('class', 'door-mark');
mark.style.pointerEvents = 'auto';
mark.innerHTML = '<circle class="door-mark-bg" r="11"></circle><text class="door-mark-icon" text-anchor="middle" dominant-baseline="central"></text>';
svg.appendChild(mark);
mark.addEventListener('pointerdown', async (e) => {
e.stopPropagation();
if (boardTool === 'door' && isTableOwner()) {
try { await db.collection('tables').doc(curTable.id).collection('doors').doc(d.id).delete(); }
catch (err) { console.error('Erro ao apagar porta:', err); }
return;
}
const cur = liveDoors[d.id];
if (!isTableOwner() && cur.locked && !cur.open) return;
try {
await db.collection('tables').doc(curTable.id).collection('doors').doc(d.id).update({ open: !cur.open });
} catch (err) { console.error('Erro ao abrir/fechar porta:', err); }
});
mark.addEventListener('contextmenu', async (e) => {
e.preventDefault(); e.stopPropagation();
if (!isTableOwner()) return;
const cur = liveDoors[d.id];
try {
await db.collection('tables').doc(curTable.id).collection('doors').doc(d.id).update({ locked: !cur.locked });
} catch (err) { console.error('Erro ao trancar/destrancar porta:', err); }
});
}
doorMarkElCache[d.id] = mark;
const mx = (d.x1 + d.x2) / 2 * baseMapW, my = (d.y1 + d.y2) / 2 * baseMapH;
mark.setAttribute('transform', `translate(${mx},${my})`);
mark.classList.toggle('door-open', !!d.open);
mark.classList.toggle('door-locked', !!(d.locked && !d.open));
mark.querySelector('.door-mark-icon').textContent = d.open ? '🔓' : (d.locked ? '🔒' : '🚪');
mark.querySelector('title')?.remove();
const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
title.textContent = d.open ? 'Porta aberta — clique para fechar'
: d.locked ? (isMaster ? 'Porta trancada — clique para abrir (jogadores não conseguem) — botão direito destranca' : 'Porta trancada — só o Mestre pode abrir')
: `Porta fechada — clique para abrir${isMaster ? ' — botão direito tranca' : ''}`;
mark.appendChild(title);
});
}
function listenDoors() {
if (!curTable.activeSceneId) return;
doorsUnsub = db.collection('tables').doc(curTable.id).collection('doors')
.where('sceneId', '==', curTable.activeSceneId)
.onSnapshot(snap => {
liveDoors = {};
snap.forEach(d => { liveDoors[d.id] = { id: d.id, ...d.data() }; });
invalidateCollisionSegmentsCache();
renderDoors();
scheduleVisionRecompute();
}, err => console.error('Erro ao sincronizar portas:', err));
}
async function clearAllDoors() {
if (!curTable.activeSceneId) return;
if (!confirm('Apagar todas as portas desta cena?')) return;
try {
const snap = await db.collection('tables').doc(curTable.id).collection('doors')
.where('sceneId', '==', curTable.activeSceneId).get();
const batch = db.batch();
snap.forEach(d => batch.delete(d.ref));
await batch.commit();
} catch (err) { alert('Erro ao limpar portas: ' + err.message); }
}
let roomPointerId = null;
let roomStartPt = null;
function attachRoomHandlers(wrap) {
wrap.addEventListener('pointerdown', (e) => {
if (boardTool !== 'room' || !isTableOwner()) return;
if (e.button === 2) return;
e.preventDefault();
roomPointerId = e.pointerId;
roomStartPt = boardPointFromEvent(e);
wrap.setPointerCapture(e.pointerId);
renderRoomPreview(roomStartPt, roomStartPt);
});
wrap.addEventListener('pointermove', (e) => {
if (boardTool !== 'room' || roomPointerId !== e.pointerId || !roomStartPt) return;
renderRoomPreview(roomStartPt, boardPointFromEvent(e));
});
const endRoom = async (e) => {
if (roomPointerId !== e.pointerId) return;
roomPointerId = null;
const start = roomStartPt; roomStartPt = null;
removeRoomPreview();
if (!start || !curTable.activeSceneId) return;
const end = boardPointFromEvent(e);
const dx = (end.x - start.x) * baseMapW, dy = (end.y - start.y) * baseMapH;
if (Math.hypot(dx, dy) < 6) return;
const points = [
{ x: start.x, y: start.y }, { x: end.x, y: start.y },
{ x: end.x, y: end.y }, { x: start.x, y: end.y }
];
try {
await db.collection('tables').doc(curTable.id).collection('walls').add({
points, closed: true, sceneId: curTable.activeSceneId
});
} catch (err) { console.error('Erro ao criar sala:', err); }
};
wrap.addEventListener('pointerup', endRoom);
wrap.addEventListener('pointercancel', endRoom);
}
function cancelRoomDraft() {
roomPointerId = null; roomStartPt = null;
removeRoomPreview();
}
function renderRoomPreview(a, b) {
const svg = wallSvgLayer();
let rect = svg.querySelector('#liveRoomPreview');
if (!rect) {
rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
rect.id = 'liveRoomPreview';
rect.setAttribute('class', 'room-rect-live');
svg.appendChild(rect);
}
const x1 = Math.min(a.x, b.x) * baseMapW, y1 = Math.min(a.y, b.y) * baseMapH;
const x2 = Math.max(a.x, b.x) * baseMapW, y2 = Math.max(a.y, b.y) * baseMapH;
rect.setAttribute('x', x1); rect.setAttribute('y', y1);
rect.setAttribute('width', Math.max(0, x2 - x1)); rect.setAttribute('height', Math.max(0, y2 - y1));
}
function removeRoomPreview() {
const rect = document.querySelector('#wallSvgLayer #liveRoomPreview');
if (rect) rect.remove();
}
let lightPointerId = null;
let lightMarkElCache = {};
function attachLightHandlers(wrap) {
wrap.addEventListener('pointerdown', async (e) => {
if (boardTool !== 'light' || !isTableOwner()) return;
if (e.target.closest('.light-mark')) return;
if (e.button === 2) return;
e.preventDefault();
const pt = boardPointFromEvent(e);
try {
await db.collection('tables').doc(curTable.id).collection('lights').add({
x: pt.x, y: pt.y, radius: LIGHT_DEFAULT_RADIUS_CELLS, sceneId: curTable.activeSceneId
});
} catch (err) { console.error('Erro ao acender fonte de luz:', err); }
});
}
function lightSvgLayer() {
let svg = document.getElementById('lightSvgLayer');
if (!svg) {
svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.id = 'lightSvgLayer';
svg.style.position = 'absolute'; svg.style.top = '0'; svg.style.left = '0';
svg.style.pointerEvents = 'none';
document.getElementById('boardSurface').appendChild(svg);
}
svg.setAttribute('width', baseMapW); svg.setAttribute('height', baseMapH);
svg.setAttribute('viewBox', `0 0 ${baseMapW} ${baseMapH}`);
return svg;
}
function renderLights() {
const svg = lightSvgLayer();
svg.querySelectorAll('[data-light-id]').forEach(el => {
if (!liveLights[el.dataset.lightId]) { el.remove(); delete lightMarkElCache[el.dataset.lightId]; }
});
Object.values(liveLights).forEach(l => {
let mark = svg.querySelector(`g[data-light-id="${l.id}"]`);
if (!mark) {
mark = document.createElementNS('http://www.w3.org/2000/svg', 'g');
mark.dataset.lightId = l.id;
mark.setAttribute('class', 'light-mark');
mark.style.pointerEvents = 'auto';
mark.innerHTML = '<circle class="light-mark-bg" r="10"></circle><text class="light-mark-icon" text-anchor="middle" dominant-baseline="central">🔥</text>';
svg.appendChild(mark);
mark.addEventListener('pointerdown', async (e) => {
e.stopPropagation();
if (boardTool !== 'light' || !isTableOwner()) return;
try { await db.collection('tables').doc(curTable.id).collection('lights').doc(l.id).delete(); }
catch (err) { console.error('Erro ao apagar fonte de luz:', err); }
});
mark.addEventListener('wheel', async (e) => {
if (!isTableOwner()) return;
e.preventDefault();
const cur = liveLights[l.id];
if (!cur) return;
const next = Math.max(1, Math.round(((cur.radius || LIGHT_DEFAULT_RADIUS_CELLS) + (e.deltaY < 0 ? 0.5 : -0.5)) * 2) / 2);
try { await db.collection('tables').doc(curTable.id).collection('lights').doc(l.id).update({ radius: next }); }
catch (err) { console.error('Erro ao ajustar raio da luz:', err); }
}, { passive: false });
}
lightMarkElCache[l.id] = mark;
mark.setAttribute('transform', `translate(${l.x * baseMapW},${l.y * baseMapH})`);
mark.querySelector('title')?.remove();
const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
title.textContent = `Fonte de luz (raio ${l.radius || LIGHT_DEFAULT_RADIUS_CELLS} casas) — role a roda do mouse pra ajustar`;
mark.appendChild(title);
});
updateLightVisibility();
}
function listenLights() {
if (!curTable.activeSceneId) return;
lightsUnsub = db.collection('tables').doc(curTable.id).collection('lights')
.where('sceneId', '==', curTable.activeSceneId)
.onSnapshot(snap => {
liveLights = {};
snap.forEach(d => { liveLights[d.id] = { id: d.id, ...d.data() }; });
renderLights();
visionFullRedrawNeeded = true;
scheduleVisionRecompute();
}, err => console.error('Erro ao sincronizar fontes de luz:', err));
}
async function clearAllLights() {
if (!curTable.activeSceneId) return;
if (!confirm('Apagar todas as fontes de luz desta cena?')) return;
try {
const snap = await db.collection('tables').doc(curTable.id).collection('lights')
.where('sceneId', '==', curTable.activeSceneId).get();
const batch = db.batch();
snap.forEach(d => batch.delete(d.ref));
await batch.commit();
} catch (err) { alert('Erro ao limpar luzes: ' + err.message); }
}
function updateLightVisibility() {
if (!Object.keys(liveLights).length) return;
const master = isTableOwner();
const cellPx = boardCellPx || DEFAULT_CELL_PX;
Object.values(liveLights).forEach(l => {
const mark = lightMarkElCache[l.id];
if (!mark) return;
if (master) { mark.style.display = ''; return; }
const mx = l.x * baseMapW, my = l.y * baseMapH;
const key = Math.floor(mx / cellPx) + ',' + Math.floor(my / cellPx);
const known = isPointCurrentlyVisible(mx, my) || exploredCells[key];
mark.style.display = known ? '' : 'none';
});
}
const FOG_UNSEEN_COLOR = 'rgba(17,14,11,0.86)';
const FOG_EXPLORED_DIM_ALPHA = 0.55;
const FOG_CIRCLE_SAMPLES = 180;
const FOG_MANY_TOKENS_THRESHOLD = 6;
const FOG_MIN_CIRCLE_SAMPLES = 90;
function adaptiveFogSamples(visionTokenCount) {
if (visionTokenCount <= FOG_MANY_TOKENS_THRESHOLD) return FOG_CIRCLE_SAMPLES;
const extra = visionTokenCount - FOG_MANY_TOKENS_THRESHOLD;
const t = Math.min(1, extra / 6);
return Math.round(FOG_CIRCLE_SAMPLES - (FOG_CIRCLE_SAMPLES - FOG_MIN_CIRCLE_SAMPLES) * t);
}
const FOG_EDGE_SOFTNESS = 0.82;
const DEG2RAD = Math.PI / 180;
let visionRecomputeQueued = false;
let pendingExploredCells = {};
let exploredPersistTimer = null;
let lastVisionTokenState = {};
let visionFullRedrawNeeded = true;
let currentVisionPolygons = [];
const FOG_MAX_RENDER_EDGE = 1400;
function fogRenderScale() {
const longEdge = Math.max(baseMapW, baseMapH);
return longEdge > FOG_MAX_RENDER_EDGE ? FOG_MAX_RENDER_EDGE / longEdge : 1;
}
function scheduleVisionRecompute() {
if (visionRecomputeQueued) return;
visionRecomputeQueued = true;
requestAnimationFrame(() => { visionRecomputeQueued = false; recomputeAndRenderVision(); });
}
function fogOfWarCanvas() {
let canvas = document.getElementById('fogOfWarCanvas');
if (!canvas) {
canvas = document.createElement('canvas');
canvas.id = 'fogOfWarCanvas';
canvas.className = 'fog-of-war-canvas';
document.getElementById('boardSurface').appendChild(canvas);
}
return canvas;
}
function wallSegmentsForVision() {
const segs = [];
Object.values(liveWalls).forEach(w => {
const pts = w.points || [];
for (let i = 0; i < pts.length - 1; i++) {
segs.push({
x1: pts[i].x * baseMapW, y1: pts[i].y * baseMapH,
x2: pts[i + 1].x * baseMapW, y2: pts[i + 1].y * baseMapH
});
}
if (w.closed && pts.length >= 3) {
const a = pts[pts.length - 1], b = pts[0];
segs.push({ x1: a.x * baseMapW, y1: a.y * baseMapH, x2: b.x * baseMapW, y2: b.y * baseMapH });
}
});
return segs;
}
let cachedCollisionSegments = null;
let cachedCollisionGrid = null;
const WALL_GRID_CELL = 320;
function invalidateCollisionSegmentsCache() { cachedCollisionSegments = null; cachedCollisionGrid = null; visionFullRedrawNeeded = true; }
function buildSegmentsGrid(segments) {
const grid = new Map();
segments.forEach(s => {
const minX = Math.min(s.x1, s.x2), maxX = Math.max(s.x1, s.x2);
const minY = Math.min(s.y1, s.y2), maxY = Math.max(s.y1, s.y2);
const c0 = Math.floor(minX / WALL_GRID_CELL), c1 = Math.floor(maxX / WALL_GRID_CELL);
const r0 = Math.floor(minY / WALL_GRID_CELL), r1 = Math.floor(maxY / WALL_GRID_CELL);
for (let r = r0; r <= r1; r++) {
for (let c = c0; c <= c1; c++) {
const key = c + ',' + r;
let bucket = grid.get(key);
if (!bucket) { bucket = []; grid.set(key, bucket); }
bucket.push(s);
}
}
});
return grid;
}
let doorMarkElCache = {};
function collisionSegmentsForVision() {
if (cachedCollisionSegments) return cachedCollisionSegments;
const segs = wallSegmentsForVision();
Object.values(liveDoors).forEach(d => {
if (d.open) return;
segs.push({ x1: d.x1 * baseMapW, y1: d.y1 * baseMapH, x2: d.x2 * baseMapW, y2: d.y2 * baseMapH });
});
cachedCollisionSegments = segs;
return segs;
}
function collisionSegmentsGrid() {
if (!cachedCollisionGrid) cachedCollisionGrid = buildSegmentsGrid(collisionSegmentsForVision());
return cachedCollisionGrid;
}
function segmentsNearCircle(grid, cx, cy, radius) {
const minCol = Math.floor((cx - radius) / WALL_GRID_CELL);
const maxCol = Math.floor((cx + radius) / WALL_GRID_CELL);
const minRow = Math.floor((cy - radius) / WALL_GRID_CELL);
const maxRow = Math.floor((cy + radius) / WALL_GRID_CELL);
const seen = new Set();
const out = [];
for (let r = minRow; r <= maxRow; r++) {
for (let c = minCol; c <= maxCol; c++) {
const bucket = grid.get(c + ',' + r);
if (!bucket) continue;
for (const s of bucket) {
if (seen.has(s)) continue;
seen.add(s);
out.push(s);
}
}
}
return out;
}
function rayHitsSegment(px, py, dx, dy, ax, ay, bx, by) {
const sdx = bx - ax, sdy = by - ay;
const denom = dx * sdy - dy * sdx;
if (Math.abs(denom) < 1e-9) return null;
const t = ((ax - px) * sdy - (ay - py) * sdx) / denom;
const u = ((ax - px) * dy - (ay - py) * dx) / denom;
if (t >= 0 && u >= 0 && u <= 1) return t;
return null;
}
function segmentsIntersect(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y) {
const s1x = p1x - p0x, s1y = p1y - p0y;
const s2x = p3x - p2x, s2y = p3y - p2y;
const denom = (-s2x * s1y + s1x * s2y);
if (Math.abs(denom) < 1e-9) return false;
const s = (-s1y * (p0x - p2x) + s1x * (p0y - p2y)) / denom;
const t = (s2x * (p0y - p2y) - s2y * (p0x - p2x)) / denom;
return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}
function movementBlockedByWalls(fromXNorm, fromYNorm, toXNorm, toYNorm) {
const x1 = fromXNorm * baseMapW, y1 = fromYNorm * baseMapH;
const x2 = toXNorm * baseMapW, y2 = toYNorm * baseMapH;
const grid = collisionSegmentsGrid();
const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
const radius = Math.hypot(x2 - x1, y2 - y1) / 2 + 8;
const segs = segmentsNearCircle(grid, cx, cy, radius);
for (const s of segs) {
if (segmentsIntersect(x1, y1, x2, y2, s.x1, s.y1, s.x2, s.y2)) return true;
}
return false;
}
function computeVisibilityPolygon(cx, cy, radius, segments, coneCenterAngle, coneHalfAngle, sampleCount) {
const samples = sampleCount || FOG_CIRCLE_SAMPLES;
const isCone = coneCenterAngle != null && coneHalfAngle != null;
const angles = [];
if (isCone) {
const steps = Math.max(10, Math.round(samples * (coneHalfAngle * 2) / (Math.PI * 2)));
for (let i = 0; i <= steps; i++) angles.push(-coneHalfAngle + (coneHalfAngle * 2) * (i / steps));
} else {
for (let i = 0; i < samples; i++) angles.push((i / samples) * Math.PI * 2);
}
const EPS = 0.00002;
const TWO_PI = Math.PI * 2;
segments.forEach(s => {
let a1 = Math.atan2(s.y1 - cy, s.x1 - cx);
let a2 = Math.atan2(s.y2 - cy, s.x2 - cx);
if (isCone) {
a1 = Math.max(-coneHalfAngle, Math.min(coneHalfAngle, Math.atan2(Math.sin(a1 - coneCenterAngle), Math.cos(a1 - coneCenterAngle))));
a2 = Math.max(-coneHalfAngle, Math.min(coneHalfAngle, Math.atan2(Math.sin(a2 - coneCenterAngle), Math.cos(a2 - coneCenterAngle))));
} else {
a1 = ((a1 % TWO_PI) + TWO_PI) % TWO_PI;
a2 = ((a2 % TWO_PI) + TWO_PI) % TWO_PI;
}
angles.push(a1 - EPS, a1, a1 + EPS, a2 - EPS, a2, a2 + EPS);
});
angles.sort((a, b) => a - b);
const pts = [];
if (isCone) pts.push({ x: cx, y: cy });
for (const rel of angles) {
const angle = isCone ? coneCenterAngle + rel : rel;
const dx = Math.cos(angle), dy = Math.sin(angle);
let minT = radius;
for (const s of segments) {
const t = rayHitsSegment(cx, cy, dx, dy, s.x1, s.y1, s.x2, s.y2);
if (t !== null && t < minT) minT = t;
}
pts.push({ x: cx + dx * minT, y: cy + dy * minT });
}
return pts;
}
function pointInPolygon(px, py, poly) {
let inside = false;
for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
if (intersect) inside = !inside;
}
return inside;
}
function collectExploredCells(poly, cx, cy, radius, out) {
const cellPx = boardCellPx || DEFAULT_CELL_PX;
const maxCol = Math.max(0, Math.ceil(baseMapW / cellPx) - 1);
const maxRow = Math.max(0, Math.ceil(baseMapH / cellPx) - 1);
const colMin = Math.max(0, Math.floor((cx - radius) / cellPx));
const colMax = Math.min(maxCol, Math.ceil((cx + radius) / cellPx));
const rowMin = Math.max(0, Math.floor((cy - radius) / cellPx));
const rowMax = Math.min(maxRow, Math.ceil((cy + radius) / cellPx));
for (let r = rowMin; r <= rowMax; r++) {
for (let c = colMin; c <= colMax; c++) {
const key = c + ',' + r;
if (out[key] || exploredCells[key]) continue;
const px = (c + 0.5) * cellPx, py = (r + 0.5) * cellPx;
if (pointInPolygon(px, py, poly)) out[key] = true;
}
}
}
function tokenVisionPos(t) {
const live = liveDragPositions[t.id];
return live || { x: t.x, y: t.y };
}
function recomputeAndRenderVision() {
if (!curTable || !curTable.activeSceneId || !baseMapW || !baseMapH) return;
const canvas = fogOfWarCanvas();
const scale = fogRenderScale();
const rw = Math.max(1, Math.round(baseMapW * scale));
const rh = Math.max(1, Math.round(baseMapH * scale));
const sizeChanged = canvas.width !== rw || canvas.height !== rh;
if (sizeChanged) { canvas.width = rw; canvas.height = rh; }
canvas.style.width = baseMapW + 'px';
canvas.style.height = baseMapH + 'px';
const ctx = canvas.getContext('2d');
ctx.setTransform(scale, 0, 0, scale, 0, 0);
const cellPx = boardCellPx || DEFAULT_CELL_PX;
const segmentsGrid = collisionSegmentsGrid();
const isMasterView = isTableOwner();
const visionTokens = Object.values(liveTokens).filter(t =>
isTokenInActiveScene(t) && tokenHasVision(t) && (isMasterView || t.ownerId === curUser.uid));
const samples = adaptiveFogSamples(visionTokens.length);
const activeScene = typeof getActiveScene === 'function' ? getActiveScene() : null;
const sceneIsDark = !!(activeScene && activeScene.darkness);
const forceAll = visionFullRedrawNeeded || sizeChanged;
const EPS_POS = 0.02;
const changed = new Set();
const nextState = {};
let dMinX = Infinity, dMinY = Infinity, dMaxX = -Infinity, dMaxY = -Infinity;
const growDirty = (cx, cy, radius) => {
dMinX = Math.min(dMinX, cx - radius); dMaxX = Math.max(dMaxX, cx + radius);
dMinY = Math.min(dMinY, cy - radius); dMaxY = Math.max(dMaxY, cy + radius);
};
visionTokens.forEach(t => {
const p = tokenVisionPos(t);
const cx = p.x * baseMapW, cy = p.y * baseMapH;
const radiusCells = sceneIsDark
? Math.max(DARK_SELF_RADIUS_CELLS, t.darkRadius || 0)
: (t.visionRadius || DEFAULT_VISION_RADIUS_CELLS);
const radius = radiusCells * cellPx;
const isCone = t.visionMode === 'cone';
const rot = liveDragRotations[t.id] != null ? liveDragRotations[t.id] : (t.rot || 0);
const coneCenter = isCone ? (rot - 90) * DEG2RAD : null;
const coneHalf = isCone ? Math.min(179.5, (t.visionConeDeg || DEFAULT_VISION_CONE_DEG) / 2) * DEG2RAD : null;
const prev = lastVisionTokenState[t.id];
const moved = forceAll || !prev || Math.abs(prev.cx - cx) > EPS_POS || Math.abs(prev.cy - cy) > EPS_POS ||
prev.radius !== radius || prev.coneCenter !== coneCenter || prev.coneHalf !== coneHalf || prev.samples !== samples;
nextState[t.id] = { cx, cy, radius, isCone, coneCenter, coneHalf, samples, poly: prev ? prev.poly : null };
if (moved) {
changed.add(t.id);
if (prev) growDirty(prev.cx, prev.cy, prev.radius);
growDirty(cx, cy, radius);
}
});
Object.keys(lastVisionTokenState).forEach(id => {
if (nextState[id]) return;
const prev = lastVisionTokenState[id];
growDirty(prev.cx, prev.cy, prev.radius);
});
if (!forceAll && changed.size === 0 && dMinX === Infinity) {
return;
}
let dx, dy, dxMax, dyMax;
if (forceAll) {
dx = 0; dy = 0; dxMax = baseMapW; dyMax = baseMapH;
} else {
dx = Math.max(0, Math.floor(dMinX)); dy = Math.max(0, Math.floor(dMinY));
dxMax = Math.min(baseMapW, Math.ceil(dMaxX)); dyMax = Math.min(baseMapH, Math.ceil(dMaxY));
}
const dw = Math.max(0, dxMax - dx), dh = Math.max(0, dyMax - dy);
if (dw > 0 && dh > 0) {
ctx.save();
ctx.beginPath();
ctx.rect(dx, dy, dw, dh);
ctx.clip();
ctx.clearRect(dx, dy, dw, dh);
ctx.globalCompositeOperation = 'source-over';
ctx.fillStyle = FOG_UNSEEN_COLOR;
ctx.fillRect(dx, dy, dw, dh);
ctx.globalCompositeOperation = 'destination-out';
ctx.fillStyle = `rgba(0,0,0,${FOG_EXPLORED_DIM_ALPHA})`;
const colMin = Math.max(0, Math.floor(dx / cellPx)), colMax = Math.ceil(dxMax / cellPx);
const rowMin = Math.max(0, Math.floor(dy / cellPx)), rowMax = Math.ceil(dyMax / cellPx);
for (let r = rowMin; r <= rowMax; r++) {
for (let c = colMin; c <= colMax; c++) {
const key = c + ',' + r;
if (!exploredCells[key]) continue;
ctx.fillRect(c * cellPx - 0.5, r * cellPx - 0.5, cellPx + 1, cellPx + 1);
}
}
const newCells = {};
const currentLightPolygons = [];
ctx.globalCompositeOperation = 'destination-out';
Object.values(liveLights).forEach(l => {
const lx = l.x * baseMapW, ly = l.y * baseMapH;
const lr = (l.radius || LIGHT_DEFAULT_RADIUS_CELLS) * cellPx;
const localSegments = segmentsNearCircle(segmentsGrid, lx, ly, lr);
const poly = computeVisibilityPolygon(lx, ly, lr, localSegments, null, null, samples);
if (poly.length < 3) return;
currentLightPolygons.push(poly);
collectExploredCells(poly, lx, ly, lr, newCells);
const grad = ctx.createRadialGradient(lx, ly, lr * FOG_EDGE_SOFTNESS, lx, ly, lr);
grad.addColorStop(0, 'rgba(0,0,0,1)');
grad.addColorStop(1, 'rgba(0,0,0,0)');
ctx.fillStyle = grad;
ctx.beginPath();
ctx.moveTo(poly[0].x, poly[0].y);
for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
ctx.closePath();
ctx.fill();
});
currentVisionPolygons = currentLightPolygons.slice();
ctx.globalCompositeOperation = 'destination-out';
visionTokens.forEach(t => {
const st = nextState[t.id];
const isChanged = changed.has(t.id);
if (!isChanged) {
const touches = st.cx + st.radius >= dx && st.cx - st.radius <= dxMax && st.cy + st.radius >= dy && st.cy - st.radius <= dyMax;
if (!touches) {
if (st.poly && st.poly.length >= (st.isCone ? 2 : 3)) currentVisionPolygons.push(st.poly);
return;
}
}
let poly = st.poly;
if (isChanged) {
const localSegments = segmentsNearCircle(segmentsGrid, st.cx, st.cy, st.radius);
poly = computeVisibilityPolygon(st.cx, st.cy, st.radius, localSegments, st.coneCenter, st.coneHalf, samples);
st.poly = poly;
if (poly.length >= (st.isCone ? 2 : 3)) collectExploredCells(poly, st.cx, st.cy, st.radius, newCells);
}
if (!poly || poly.length < (st.isCone ? 2 : 3)) return;
currentVisionPolygons.push(poly);
const grad = ctx.createRadialGradient(st.cx, st.cy, st.radius * FOG_EDGE_SOFTNESS, st.cx, st.cy, st.radius);
grad.addColorStop(0, 'rgba(0,0,0,1)');
grad.addColorStop(1, 'rgba(0,0,0,0)');
ctx.fillStyle = grad;
ctx.beginPath();
ctx.moveTo(poly[0].x, poly[0].y);
for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
ctx.closePath();
ctx.fill();
if (st.isCone && isMasterView) {
ctx.save();
ctx.globalCompositeOperation = 'source-over';
ctx.strokeStyle = 'rgba(201,161,92,.35)';
ctx.lineWidth = 1.5;
ctx.stroke();
ctx.restore();
}
});
ctx.globalCompositeOperation = 'source-over';
ctx.restore();
let hasNew = false;
Object.keys(newCells).forEach(k => { if (!exploredCells[k]) { exploredCells[k] = true; hasNew = true; } });
if (hasNew) scheduleExploredPersist(newCells);
}
canvas.style.opacity = isTableOwner() ? '0.4' : '1';
applyTokenFogVisibility();
updateDoorVisibility();
updateLightVisibility();
lastVisionTokenState = nextState;
visionFullRedrawNeeded = false;
}
function isPointCurrentlyVisible(px, py) {
return currentVisionPolygons.some(poly => pointInPolygon(px, py, poly));
}
function updateDoorVisibility() {
if (!Object.keys(liveDoors).length) return;
const master = isTableOwner();
const cellPx = boardCellPx || DEFAULT_CELL_PX;
Object.values(liveDoors).forEach(d => {
const mark = doorMarkElCache[d.id];
if (!mark) return;
if (master) { mark.style.display = ''; return; }
const mx = (d.x1 + d.x2) / 2 * baseMapW, my = (d.y1 + d.y2) / 2 * baseMapH;
const key = Math.floor(mx / cellPx) + ',' + Math.floor(my / cellPx);
const known = isPointCurrentlyVisible(mx, my) || exploredCells[key];
mark.style.display = known ? '' : 'none';
});
}
function applyTokenFogVisibility() {
const master = isTableOwner();
Object.values(liveTokens).forEach(t => {
if (t.ownerId === curUser.uid) return;
const el = tokenElCache[t.id];
const auraEl = tokenAuraElCache[t.id];
if (!el && !auraEl) return;
const p = tokenVisionPos(t);
const visible = master || isPointCurrentlyVisible(p.x * baseMapW, p.y * baseMapH);
if (el) el.style.display = visible ? '' : 'none';
if (auraEl) auraEl.style.display = visible ? '' : 'none';
});
}
function visionMemoryDocRef(sceneId) {
const base = db.collection('tables').doc(curTable.id).collection('visionMemory').doc(sceneId);
return isTableOwner() ? base : base.collection('players').doc(curUser.uid);
}
function scheduleExploredPersist(newCells) {
Object.assign(pendingExploredCells, newCells);
if (exploredPersistTimer) return;
exploredPersistTimer = setTimeout(flushExploredPersist, 700);
}
function flushExploredPersist() {
exploredPersistTimer = null;
const keys = Object.keys(pendingExploredCells);
pendingExploredCells = {};
if (!keys.length || !curTable || !curTable.activeSceneId) return;
const update = {};
keys.forEach(k => { update['cells.' + k] = true; });
visionMemoryDocRef(curTable.activeSceneId)
.set(update, { merge: true })
.catch(err => console.error('Erro ao salvar memória de visão:', err));
}
function listenVisionMemory() {
if (!curTable.activeSceneId) return;
visionMemUnsub = visionMemoryDocRef(curTable.activeSceneId)
.onSnapshot(doc => {
exploredCells = (doc.exists && doc.data().cells) || {};
visionFullRedrawNeeded = true;
scheduleVisionRecompute();
}, err => console.error('Erro ao sincronizar memória de visão:', err));
}
async function clearSceneExplorationMemory(sceneId) {
const base = db.collection('tables').doc(curTable.id).collection('visionMemory').doc(sceneId);
const playersSnap = await base.collection('players').get();
const batch = db.batch();
batch.set(base, { cells: {} });
playersSnap.forEach(d => batch.delete(d.ref));
await batch.commit();
}
async function resetExplorationMemory() {
if (!curTable.activeSceneId || !isTableOwner()) return;
if (!confirm('Resetar a memória de exploração desta cena pra todo mundo (Mestre e jogadores)? A névoa volta a cobrir tudo que já foi visto até agora — as paredes, portas e luzes continuam intactas.')) return;
try {
await clearSceneExplorationMemory(curTable.activeSceneId);
} catch (err) { alert('Erro ao resetar memória de exploração: ' + err.message); }
}
function attachPingHandlers(wrap) {
wrap.addEventListener('pointerdown', async (e) => {
if (boardTool !== 'ping') return;
e.preventDefault();
const p = boardPointFromEvent(e);
try {
const ref = await db.collection('tables').doc(curTable.id).collection('pings').add({
x: p.x, y: p.y, by: curUser.uid, color: myColor || '#c9a15c',
createdAt: firebase.firestore.FieldValue.serverTimestamp()
});
setTimeout(() => ref.delete().catch(() => {}), 1700);
} catch (err) { console.error('Erro ao marcar ponto:', err); }
});
}
function renderPings() {
const surface = document.getElementById('boardSurface');
if (!surface) return;
surface.querySelectorAll('.ping-mark[data-ping-id]').forEach(el => {
if (!livePings[el.dataset.pingId]) el.remove();
});
Object.values(livePings).forEach(p => {
if (surface.querySelector(`.ping-mark[data-ping-id="${p.id}"]`)) return;
const el = document.createElement('div');
el.className = 'ping-mark';
el.dataset.pingId = p.id;
el.style.left = (p.x * baseMapW) + 'px';
el.style.top = (p.y * baseMapH) + 'px';
el.style.borderColor = p.color || '#c9a15c';
surface.appendChild(el);
setTimeout(() => el.remove(), 1700);
});
}
function listenPings() {
pingUnsub = db.collection('tables').doc(curTable.id).collection('pings')
.onSnapshot(snap => {
livePings = {};
snap.forEach(d => { livePings[d.id] = { id: d.id, ...d.data() }; });
renderPings();
}, err => console.error('Erro ao sincronizar marcações:', err));
}
let templatePointerId = null, templateStartPoint = null;
function snapTemplatePoint(p) {
return { x: snapAxisToGrid(p.x, baseMapW, boardCellPx), y: snapAxisToGrid(p.y, baseMapH, boardCellPx) };
}
function attachTemplateHandlers(wrap) {
wrap.addEventListener('pointerdown', (e) => {
if (boardTool !== 'template') return;
templatePointerId = e.pointerId;
let p = boardPointFromEvent(e);
if (snapToGrid && !e.altKey) p = snapTemplatePoint(p);
templateStartPoint = p;
wrap.setPointerCapture(e.pointerId);
e.preventDefault();
});
wrap.addEventListener('pointermove', (e) => {
if (templatePointerId !== e.pointerId || !templateStartPoint) return;
let p = boardPointFromEvent(e);
if (snapToGrid && !e.altKey) p = snapTemplatePoint(p);
renderLiveTemplatePreview(templateShape, templateStartPoint, p);
});
const endTemplate = async (e) => {
if (templatePointerId !== e.pointerId) return;
templatePointerId = null;
const start = templateStartPoint; templateStartPoint = null;
removeLiveTemplatePreview();
if (!start) return;
let end = boardPointFromEvent(e);
if (snapToGrid && !e.altKey) end = snapTemplatePoint(end);
const dx = (end.x - start.x) * baseMapW, dy = (end.y - start.y) * baseMapH;
if (Math.hypot(dx, dy) < 6) return;
if (!curTable.activeSceneId) return;
try {
await db.collection('tables').doc(curTable.id).collection('templates').add({
shape: templateShape, x: start.x, y: start.y, tx: end.x, ty: end.y,
color: myColor || '#c9a15c', by: curUser.uid, sceneId: curTable.activeSceneId,
createdAt: firebase.firestore.FieldValue.serverTimestamp()
});
} catch (err) { console.error('Erro ao salvar área:', err); }
};
wrap.addEventListener('pointerup', endTemplate);
wrap.addEventListener('pointercancel', endTemplate);
}
function templateSvgLayer() {
let svg = document.getElementById('templateSvgLayer');
if (!svg) {
svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.id = 'templateSvgLayer';
svg.style.position = 'absolute'; svg.style.top = '0'; svg.style.left = '0';
document.getElementById('boardSurface').appendChild(svg);
}
svg.setAttribute('width', baseMapW); svg.setAttribute('height', baseMapH);
svg.setAttribute('viewBox', `0 0 ${baseMapW} ${baseMapH}`);
return svg;
}
function templateShapeGeometry(shape, a, b) {
const ax = a.x * baseMapW, ay = a.y * baseMapH;
const bx = b.x * baseMapW, by = b.y * baseMapH;
const dx = bx - ax, dy = by - ay;
const len = Math.hypot(dx, dy) || 0.0001;
if (shape === 'circle') {
return { tag: 'circle', attrs: { cx: ax, cy: ay, r: len }, len, label: { x: ax, y: ay - len - 10 } };
}
const ux = dx / len, uy = dy / len;
const perpx = -uy, perpy = ux;
if (shape === 'cone') {
const half = len / 2;
const baseX = ax + ux * len, baseY = ay + uy * len;
const p1x = baseX + perpx * half, p1y = baseY + perpy * half;
const p2x = baseX - perpx * half, p2y = baseY - perpy * half;
return {
tag: 'polygon', attrs: { points: `${ax},${ay} ${p1x},${p1y} ${p2x},${p2y}` }, len,
label: { x: (ax + baseX) / 2, y: (ay + baseY) / 2 }
};
}
const half = Math.max(6, boardCellPx * 0.45);
const p1x = ax + perpx * half, p1y = ay + perpy * half;
const p2x = bx + perpx * half, p2y = by + perpy * half;
const p3x = bx - perpx * half, p3y = by - perpy * half;
const p4x = ax - perpx * half, p4y = ay - perpy * half;
return {
tag: 'polygon', attrs: { points: `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y}` }, len,
label: { x: (ax + bx) / 2, y: (ay + by) / 2 - half - 10 }
};
}
function applyTemplateShapeEl(el, geo, color) {
el.setAttribute('fill', hexToRgba(color, 0.28));
el.setAttribute('stroke', color);
el.setAttribute('stroke-width', 2);
Object.entries(geo.attrs).forEach(([k, v]) => el.setAttribute(k, v));
}
function formatTemplateLabel(shape, lenPx) {
const cells = boardCellPx ? lenPx / boardCellPx : 0;
const prefix = shape === 'circle' ? 'Raio: ' : shape === 'cone' ? 'Alcance: ' : 'Comprimento: ';
return prefix + formatCellsAndMeters(cells);
}
function upsertTemplateLabelEl(svg, key, shape, geo, color) {
let label = svg.querySelector(`text[data-template-label="${key}"]`);
if (!label) {
label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
label.dataset.templateLabel = key;
label.setAttribute('text-anchor', 'middle');
label.setAttribute('paint-order', 'stroke');
label.setAttribute('stroke', '#0a0806');
label.setAttribute('stroke-linejoin', 'round');
label.style.pointerEvents = 'none';
svg.appendChild(label);
}
const fontSize = Math.max(12, Math.min(18, boardCellPx * 0.34));
label.setAttribute('font-size', fontSize);
label.setAttribute('stroke-width', Math.max(2, fontSize * 0.18));
label.setAttribute('font-family', "'EB Garamond', serif");
label.setAttribute('fill', color);
label.setAttribute('x', geo.label.x);
label.setAttribute('y', geo.label.y);
label.textContent = formatTemplateLabel(shape, geo.len);
}
function renderLiveTemplatePreview(shape, a, b) {
const svg = templateSvgLayer();
const geo = templateShapeGeometry(shape, a, b);
let live = svg.querySelector('#liveTemplatePreview');
if (live && live.tagName.toLowerCase() !== geo.tag) { live.remove(); live = null; }
if (!live) {
live = document.createElementNS('http://www.w3.org/2000/svg', geo.tag);
live.id = 'liveTemplatePreview';
live.style.pointerEvents = 'none';
svg.appendChild(live);
}
const color = myColor || '#c9a15c';
applyTemplateShapeEl(live, geo, color);
upsertTemplateLabelEl(svg, 'live', shape, geo, color);
}
function removeLiveTemplatePreview() {
const svg = document.getElementById('templateSvgLayer');
if (!svg) return;
const live = svg.querySelector('#liveTemplatePreview');
if (live) live.remove();
const label = svg.querySelector('text[data-template-label="live"]');
if (label) label.remove();
}
function renderTemplates() {
const svg = templateSvgLayer();
svg.querySelectorAll('[data-template-id]').forEach(el => {
if (!liveTemplates[el.dataset.templateId]) el.remove();
});
svg.querySelectorAll('text[data-template-label]').forEach(el => {
const key = el.dataset.templateLabel;
if (key !== 'live' && !liveTemplates[key]) el.remove();
});
Object.values(liveTemplates).forEach(t => {
const geo = templateShapeGeometry(t.shape, { x: t.x, y: t.y }, { x: t.tx, y: t.ty });
let el = svg.querySelector(`[data-template-id="${t.id}"]`);
if (el && el.tagName.toLowerCase() !== geo.tag) { el.remove(); el = null; }
if (!el) {
el = document.createElementNS('http://www.w3.org/2000/svg', geo.tag);
el.dataset.templateId = t.id;
el.style.cursor = 'pointer';
svg.appendChild(el);
el.addEventListener('pointerdown', async (e) => {
if (boardTool !== 'template') return;
const canRemove = isTableOwner() || t.by === curUser.uid;
if (!canRemove) return;
e.stopPropagation();
try { await db.collection('tables').doc(curTable.id).collection('templates').doc(t.id).delete(); }
catch (err) { console.error('Erro ao apagar área:', err); }
});
}
const color = t.color || '#c9a15c';
applyTemplateShapeEl(el, geo, color);
upsertTemplateLabelEl(svg, t.id, t.shape, geo, color);
});
}
function listenTemplates() {
if (!curTable.activeSceneId) return;
templateUnsub = db.collection('tables').doc(curTable.id).collection('templates')
.where('sceneId', '==', curTable.activeSceneId)
.onSnapshot(snap => {
liveTemplates = {};
snap.forEach(d => { liveTemplates[d.id] = { id: d.id, ...d.data() }; });
renderTemplates();
}, err => console.error('Erro ao sincronizar áreas:', err));
}
async function clearMyOrAllTemplates() {
if (!curTable.activeSceneId) return;
const isMaster = isTableOwner();
if (!confirm(isMaster ? 'Apagar todas as áreas desta cena?' : 'Apagar suas áreas nesta cena?')) return;
try {
let q = db.collection('tables').doc(curTable.id).collection('templates')
.where('sceneId', '==', curTable.activeSceneId);
if (!isMaster) q = q.where('by', '==', curUser.uid);
const snap = await q.get();
const batch = db.batch();
snap.forEach(d => batch.delete(d.ref));
await batch.commit();
} catch (err) { alert('Erro ao limpar áreas: ' + err.message); }
}
let boardPanPointerId = null;
let boardPanStartX = 0, boardPanStartY = 0, boardPanStartPanX = 0, boardPanStartPanY = 0;
let boardTouchPointers = new Map();
let boardTouchMode = null;
let boardTouchLastX = 0, boardTouchLastY = 0;
let boardPinchLastDist = 0, boardPinchLastMidX = 0, boardPinchLastMidY = 0;
let boardTouchDownX = 0, boardTouchDownY = 0, boardTouchMovedFar = false;
let boardLastTapTime = 0, boardLastTapX = 0, boardLastTapY = 0;
function boardTouchPointsArray() { return Array.from(boardTouchPointers.values()); }
function attachBoardInteractionHandlers() {
const wrap = document.getElementById('boardWrap');
if (!wrap || wrap._boardInteractionAttached) return;
wrap._boardInteractionAttached = true;
wrap.addEventListener('pointerdown', (e) => {
if (e.target.closest('.token') || e.target.closest('.token-handles')) return;
if (boardTool === 'select' && e.pointerType !== 'touch' && e.button === 0) {
e.preventDefault();
wrap.setPointerCapture(e.pointerId);
const startClientX = e.clientX, startClientY = e.clientY;
const shiftExtend = e.shiftKey;
const baseIds = shiftExtend ? new Set(multiSelectedIds) : new Set();
let box = document.getElementById('boardSelectBox');
if (!box) {
box = document.createElement('div');
box.id = 'boardSelectBox';
box.className = 'board-select-box hidden';
wrap.appendChild(box);
}
const wrapRect = wrap.getBoundingClientRect();
const updateBox = (curX, curY) => {
const left = Math.min(startClientX, curX) - wrapRect.left;
const top = Math.min(startClientY, curY) - wrapRect.top;
const w = Math.abs(curX - startClientX);
const h = Math.abs(curY - startClientY);
box.style.left = left + 'px'; box.style.top = top + 'px';
box.style.width = w + 'px'; box.style.height = h + 'px';
box.classList.remove('hidden');
};
const move = (ev) => { updateBox(ev.clientX, ev.clientY); };
const onKeyDuringDrag = (ev) => {
if (ev.key !== 'Escape') return;
ev.preventDefault();
wrap.removeEventListener('pointermove', move);
wrap.removeEventListener('pointerup', up);
wrap.removeEventListener('pointercancel', up);
document.removeEventListener('keydown', onKeyDuringDrag, true);
box.classList.add('hidden');
try { wrap.releasePointerCapture(e.pointerId); } catch (_) {}
};
const up = (ev) => {
wrap.removeEventListener('pointermove', move);
wrap.removeEventListener('pointerup', up);
wrap.removeEventListener('pointercancel', up);
document.removeEventListener('keydown', onKeyDuringDrag, true);
box.classList.add('hidden');
const moved = Math.hypot(ev.clientX - startClientX, ev.clientY - startClientY);
if (moved < 6) {
if (selectedTokenId) {
if (inspectedTokenId === selectedTokenId) { inspectedTokenId = null; if (typeof renderTokenInspectPanel === 'function') renderTokenInspectPanel(); }
selectedTokenId = null;
updateSelectionHandles();
}
if (multiSelectedIds.size) multiSelectedIds.clear();
renderAllTokens();
renderTokenListPanel();
return;
}
const p1 = boardPointFromEvent({ clientX: startClientX, clientY: startClientY });
const p2 = boardPointFromEvent({ clientX: ev.clientX, clientY: ev.clientY });
const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
const minY = Math.min(p1.y, p2.y), maxY = Math.max(p1.y, p2.y);
const picked = new Set(baseIds);
Object.values(liveTokens).forEach(t => {
if (!t || t.id === undefined) return;
if (!isTokenInActiveScene(t) || !isTokenVisibleToViewer(t)) return;
if (t.x >= minX && t.x <= maxX && t.y >= minY && t.y <= maxY) picked.add(t.id);
});
multiSelectedIds = picked;
renderAllTokens();
renderTokenListPanel();
};
wrap.addEventListener('pointermove', move);
wrap.addEventListener('pointerup', up);
wrap.addEventListener('pointercancel', up);
document.addEventListener('keydown', onKeyDuringDrag, true);
return;
}
if (selectedTokenId) {
if (inspectedTokenId === selectedTokenId) { inspectedTokenId = null; if (typeof renderTokenInspectPanel === 'function') renderTokenInspectPanel(); }
selectedTokenId = null;
updateSelectionHandles();
renderTokenListPanel();
}
if (multiSelectedIds.size) { multiSelectedIds.clear(); renderAllTokens(); renderTokenListPanel(); }
if (e.pointerType === 'touch') {
boardTouchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
wrap.setPointerCapture(e.pointerId);
if (boardTouchPointers.size === 1) {
boardTouchMode = (boardTool === 'pan') ? 'pan' : null;
boardTouchLastX = e.clientX; boardTouchLastY = e.clientY;
boardTouchDownX = e.clientX; boardTouchDownY = e.clientY; boardTouchMovedFar = false;
} else if (boardTouchPointers.size === 2) {
boardTouchMode = 'pinch';
const [a, b] = boardTouchPointsArray();
boardPinchLastDist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
boardPinchLastMidX = (a.x + b.x) / 2;
boardPinchLastMidY = (a.y + b.y) / 2;
}
return;
}
if (boardTool !== 'pan') return;
if (e.button !== 0) return;
boardPanPointerId = e.pointerId;
boardPanStartX = e.clientX; boardPanStartY = e.clientY;
boardPanStartPanX = boardPanX; boardPanStartPanY = boardPanY;
wrap.classList.add('panning');
wrap.setPointerCapture(e.pointerId);
});
wrap.addEventListener('pointermove', (e) => {
if (e.pointerType === 'touch') {
if (!boardTouchPointers.has(e.pointerId)) return;
boardTouchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
if (boardTouchMode === 'pan' && boardTouchPointers.size === 1) {
const p = boardTouchPointsArray()[0];
if (Math.hypot(p.x - boardTouchDownX, p.y - boardTouchDownY) > 10) boardTouchMovedFar = true;
boardPanX += (p.x - boardTouchLastX);
boardPanY += (p.y - boardTouchLastY);
boardTouchLastX = p.x; boardTouchLastY = p.y;
applyBoardTransform();
} else if (boardTouchMode === 'pinch' && boardTouchPointers.size === 2) {
const [a, b] = boardTouchPointsArray();
const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
const rect = wrap.getBoundingClientRect();
zoomBoardAt(boardZoom * (dist / boardPinchLastDist), midX - rect.left, midY - rect.top);
boardPanX += (midX - boardPinchLastMidX);
boardPanY += (midY - boardPinchLastMidY);
applyBoardTransform();
boardPinchLastDist = dist; boardPinchLastMidX = midX; boardPinchLastMidY = midY;
}
return;
}
if (boardPanPointerId !== e.pointerId) return;
boardPanX = boardPanStartPanX + (e.clientX - boardPanStartX);
boardPanY = boardPanStartPanY + (e.clientY - boardPanStartY);
applyBoardTransform();
});
const endBoardPointer = (e) => {
if (e.pointerType === 'touch') {
const wasSingle = boardTouchPointers.size === 1;
boardTouchPointers.delete(e.pointerId);
if (boardTouchPointers.size === 1) {
boardTouchMode = 'pan';
const p = boardTouchPointsArray()[0];
boardTouchLastX = p.x; boardTouchLastY = p.y;
} else if (boardTouchPointers.size === 0) {
if (wasSingle && boardTouchMode === 'pan' && !boardTouchMovedFar) {
const now = Date.now();
const distFromLastTap = Math.hypot(e.clientX - boardLastTapX, e.clientY - boardLastTapY);
if (now - boardLastTapTime < 320 && distFromLastTap < 40) {
const rect = wrap.getBoundingClientRect();
zoomBoardAt(Math.min(ZOOM_MAX, boardZoom + 0.5), e.clientX - rect.left, e.clientY - rect.top);
boardLastTapTime = 0;
} else {
boardLastTapTime = now; boardLastTapX = e.clientX; boardLastTapY = e.clientY;
}
}
boardTouchMode = null;
}
return;
}
if (boardPanPointerId === e.pointerId) {
boardPanPointerId = null;
wrap.classList.remove('panning');
}
};
wrap.addEventListener('pointerup', endBoardPointer);
wrap.addEventListener('pointercancel', endBoardPointer);
wrap.addEventListener('pointerleave', endBoardPointer);
wrap.addEventListener('wheel', (e) => {
e.preventDefault();
const rect = wrap.getBoundingClientRect();
const ax = e.clientX - rect.left, ay = e.clientY - rect.top;
zoomBoardAt(boardZoom + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP), ax, ay);
}, { passive: false });
attachRulerHandlers(wrap);
attachDrawHandlers(wrap);
attachWallHandlers(wrap);
attachRoomHandlers(wrap);
attachDoorHandlers(wrap);
attachLightHandlers(wrap);
attachPingHandlers(wrap);
attachTemplateHandlers(wrap);
}
const SIDE_PANEL_COLLAPSE_KEY = 'heartsoul_sidePanelCollapsed';
const SIDE_PANEL_DEFAULT_COLLAPSED = { masterMapPanel: true, scenePanel: true, initiativePanel: true };
function loadSidePanelCollapseState() {
try { return JSON.parse(localStorage.getItem(SIDE_PANEL_COLLAPSE_KEY) || '{}'); }
catch (err) { return {}; }
}
function applySidePanelCollapseState() {
const saved = loadSidePanelCollapseState();
document.querySelectorAll('.board-side > .side-panel').forEach(panel => {
if (!panel.id) return;
const collapsed = Object.prototype.hasOwnProperty.call(saved, panel.id) ? saved[panel.id] : !!SIDE_PANEL_DEFAULT_COLLAPSED[panel.id];
panel.classList.toggle('collapsed', collapsed);
});
}
function expandSidePanel(panelId) {
const panel = document.getElementById(panelId);
if (!panel || !panel.classList.contains('collapsed')) return;
panel.classList.remove('collapsed');
const saved = loadSidePanelCollapseState();
saved[panelId] = false;
try { localStorage.setItem(SIDE_PANEL_COLLAPSE_KEY, JSON.stringify(saved)); } catch (err) {  }
panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
function initSidePanelAccordion() {
const side = document.querySelector('.board-side');
if (!side) return;
if (side.dataset.accordionBound === '1') { applySidePanelCollapseState(); return; }
side.dataset.accordionBound = '1';
side.addEventListener('click', (e) => {
const h4 = e.target.closest('.side-panel > h4:first-child');
if (!h4) return;
const panel = h4.parentElement;
if (!panel.id) return;
const collapsed = panel.classList.toggle('collapsed');
const saved = loadSidePanelCollapseState();
saved[panel.id] = collapsed;
try { localStorage.setItem(SIDE_PANEL_COLLAPSE_KEY, JSON.stringify(saved)); } catch (err) {  }
});
applySidePanelCollapseState();
}
const SUB_PANEL_COLLAPSE_KEY = 'heartsoul_subPanelCollapsed';
function loadSubPanelCollapseState() {
try { return JSON.parse(localStorage.getItem(SUB_PANEL_COLLAPSE_KEY) || '{}'); }
catch (err) { return {}; }
}
function subPanelHtml(id, icon, title, bodyHtml, defaultOpen) {
const saved = loadSubPanelCollapseState();
const collapsed = Object.prototype.hasOwnProperty.call(saved, id) ? saved[id] : !defaultOpen;
return `
<div class="subpanel${collapsed ? ' collapsed' : ''}" id="${id}">
<div class="subpanel-head" data-subpanel-toggle="${id}">
<span class="sp-icon">${icon}</span>
<span class="sp-title">${escapeHtml(title)}</span>
<span class="sp-chevron">▾</span>
</div>
<div class="subpanel-body">${bodyHtml}</div>
</div>`;
}
function initSubPanelAccordion() {
if (document.body.dataset.subAccordionBound === '1') return;
document.body.dataset.subAccordionBound = '1';
document.body.addEventListener('click', (e) => {
const head = e.target.closest('[data-subpanel-toggle]');
if (!head) return;
const id = head.dataset.subpanelToggle;
const panel = document.getElementById(id);
if (!panel) return;
const collapsed = panel.classList.toggle('collapsed');
const saved = loadSubPanelCollapseState();
saved[id] = collapsed;
try { localStorage.setItem(SUB_PANEL_COLLAPSE_KEY, JSON.stringify(saved)); } catch (err) {  }
});
}
const RETRACT_KEY = 'heartsoul_retractPanels';
function loadRetractState() {
try { return JSON.parse(localStorage.getItem(RETRACT_KEY) || '{}'); }
catch (err) { return {}; }
}
function saveRetractState(state) {
try { localStorage.setItem(RETRACT_KEY, JSON.stringify(state)); } catch (err) {  }
}
function initSidebarToggles() {
const toolsPanel = document.getElementById('toolsPanel');
const toolsToggle = document.getElementById('toolsPanelToggle');
const boardSide = document.querySelector('.board-side');
const boardSideToggle = document.getElementById('boardSideToggle');
const state = loadRetractState();
if (toolsPanel) toolsPanel.classList.toggle('retracted', !!state.tools);
if (boardSide) boardSide.classList.toggle('retracted', !!state.side);
if (toolsToggle && !toolsToggle.dataset.bound) {
toolsToggle.dataset.bound = '1';
toolsToggle.addEventListener('click', () => {
if (!toolsPanel) return;
const retracted = toolsPanel.classList.toggle('retracted');
const s = loadRetractState();
s.tools = retracted;
saveRetractState(s);
});
}
if (boardSideToggle && !boardSideToggle.dataset.bound) {
boardSideToggle.dataset.bound = '1';
boardSideToggle.addEventListener('click', () => {
if (!boardSide) return;
const retracted = boardSide.classList.toggle('retracted');
const s = loadRetractState();
s.side = retracted;
saveRetractState(s);
});
}
}

// ============================================================
// Ferramentas do tabuleiro: régua, desenhar, névoa, marcar (ping), áreas de efeito (templates), pan/zoom por arraste, painel lateral sanfonado.
// Parte de mesa.js (dividido para facilitar manutenção).
// Depende de variáveis/funções globais definidas em mesa-board.js
// — carregar SEMPRE depois dele, na ordem dos <script> do mesa.html.
// ============================================================

// ---- Interação do tabuleiro: clicar-e-arrastar move o mapa em qualquer
// direção (mouse) e a roda do mouse dá zoom mirando no cursor; no celular,
// arrastar com 1 dedo move o mapa e pinçar com 2 dedos dá zoom — igual ao
// Owlbear Rodeo. Tudo isso é ignorado quando o toque/clique começa em cima
// de um token (attachTokenDragHandlers cuida desse caso).
// Converte a posição de um ponteiro (em px de tela) para coordenadas
// normalizadas (0..1) do mapa, no mesmo espaço usado por tokens/x,y — já
// leva em conta o pan/zoom atuais, porque usa o retângulo real do
// board-surface (que já está transformado) como referência.
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
    <button type="button" data-tool="pan" title="Mover o mapa (padrão) — atalho: V"><span class="tool-label">✋ Mover</span><kbd class="tool-key">V</kbd></button>
    <button type="button" data-tool="ruler" title="Medir distância em casas da grade (segure Alt/Option para medir livre, sem encaixar) — atalho: R"><span class="tool-label">📏 Régua</span><kbd class="tool-key">R</kbd></button>
    <button type="button" data-tool="ping" title="Marcar um ponto para todos verem, na sua cor — atalho: P"><span class="tool-label">📍 Marcar</span><kbd class="tool-key">P</kbd></button>
    <div class="tt-sep"></div>
    <button type="button" data-tool="template" data-shape="circle" title="Área circular (ex.: bola de fogo) — arraste do centro até a borda, na sua cor — atalho: 1"><span class="tool-label">⭕ Círculo</span><kbd class="tool-key">1</kbd></button>
    <button type="button" data-tool="template" data-shape="cone" title="Área em cone (ex.: sopro de dragão) — arraste da origem até a ponta — atalho: 2"><span class="tool-label">🔺 Cone</span><kbd class="tool-key">2</kbd></button>
    <button type="button" data-tool="template" data-shape="line" title="Área em linha (ex.: raio) — arraste do início até o fim — atalho: 3"><span class="tool-label">▭ Linha</span><kbd class="tool-key">3</kbd></button>
    <button type="button" id="clearTemplatesBtn" title="Apagar suas áreas nesta cena (o Mestre apaga todas) — dica: com a ferramenta de área ativa, clique numa área pra apagar só ela — atalho: C"><span class="tool-label">🧹 Limpar áreas</span><kbd class="tool-key">C</kbd></button>
    <button type="button" id="snapToggleBtn" title="Ao soltar um token, encaixar automaticamente na célula mais próxima da grade (segure Alt/Option para soltar livre mesmo com isto ligado) — atalho: G"><span class="tool-label">🧲 Encaixar na grade</span><kbd class="tool-key">G</kbd></button>
    <label class="cell-unit-label" title="Quantos metros equivalem a uma casa da grade — usado nos números da régua e das áreas de ataque">
      <span>m/casa</span>
      <input type="number" id="metersPerCellInput" min="0.5" step="0.5" value="${metersPerCell}">
    </label>
    ${isMaster ? `
      <div class="tt-sep"></div>
      <button type="button" data-tool="draw" title="Desenhar sobre o mapa — atalho: D"><span class="tool-label">✏️ Desenhar</span><kbd class="tool-key">D</kbd></button>
      <button type="button" class="color-swatch" id="drawWheelBtn" style="background:${drawColor};" title="Cor do desenho (roda cromática)"></button>
      <button type="button" id="undoDrawBtn" title="Desfazer o último traço — atalho: Ctrl/Cmd+Z"><span class="tool-label">↩️ Desfazer</span><kbd class="tool-key">Ctrl+Z</kbd></button>
      <button type="button" id="clearDrawBtn" title="Apagar todos os desenhos desta cena — dica: com a ferramenta de desenho ativa, clique num traço pra apagar só ele — atalho: X"><span class="tool-label">🧹 Limpar desenhos</span><kbd class="tool-key">X</kbd></button>
      <div class="tt-sep"></div>
      <button type="button" data-tool="fog" title="Cobrir/revelar em retângulo: arraste pra cobrir uma área (clique numa área coberta para revelar) — atalho: F"><span class="tool-label">🌫 Névoa</span><kbd class="tool-key">F</kbd></button>
      <button type="button" data-tool="fogPoly" title="Cobrir/revelar em área livre: clique ponto a ponto contornando a área e clique no ponto inicial (ou dê 2 cliques) para fechar e preencher o contorno — clique numa área coberta para revelar, botão direito desfaz o último ponto, Esc cancela o contorno atual — atalho: N"><span class="tool-label">🖊️ Névoa (contorno)</span><kbd class="tool-key">N</kbd></button>
      <button type="button" id="clearFogBtn" title="Revelar o mapa inteiro — atalho: Shift+F"><span class="tool-label">☀️ Revelar tudo</span><kbd class="tool-key">⇧F</kbd></button>
    ` : ''}`;

  bar.querySelectorAll('[data-tool]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.shape) templateShape = b.dataset.shape; // botões de área também escolhem o formato
    setBoardTool(b.dataset.tool);
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
  const clearFogBtn = document.getElementById('clearFogBtn');
  if (clearFogBtn) clearFogBtn.addEventListener('click', clearAllFog);
  const clearTemplatesBtn = document.getElementById('clearTemplatesBtn');
  if (clearTemplatesBtn) clearTemplatesBtn.addEventListener('click', clearMyOrAllTemplates);
  const snapBtn = document.getElementById('snapToggleBtn');
  if (snapBtn) snapBtn.addEventListener('click', toggleSnapToGrid);
  const metersInput = document.getElementById('metersPerCellInput');
  if (metersInput) metersInput.addEventListener('change', () => {
    const v = parseFloat(metersInput.value);
    metersPerCell = (isFinite(v) && v > 0) ? v : 1;
    metersInput.value = metersPerCell;
    try { localStorage.setItem('mesaMetersPerCell', String(metersPerCell)); } catch (e) {}
    renderTemplates(); // reaplica os rótulos (já salvos) com a nova escala
  });

  updateToolToolbarActive();
}

// Liga/desliga o encaixe na grade — função própria (em vez de só um
// listener inline) porque também é chamada pelo atalho de teclado "G",
// não só pelo clique no botão.
function toggleSnapToGrid() {
  snapToGrid = !snapToGrid;
  try { localStorage.setItem('mesaSnapGrid', snapToGrid ? '1' : '0'); } catch (e) {}
  updateToolToolbarActive();
}

function updateToolToolbarActive() {
  const bar = document.getElementById('toolToolbar');
  if (!bar) return;
  bar.querySelectorAll('[data-tool]').forEach(b => {
    // Os três botões de área compartilham data-tool="template" — só o que
    // bate também com o formato escolhido (templateShape) fica realçado.
    const active = b.dataset.tool === boardTool && (!b.dataset.shape || b.dataset.shape === templateShape);
    b.classList.toggle('tool-active', active);
  });
  const snapBtn = document.getElementById('snapToggleBtn');
  if (snapBtn) snapBtn.classList.toggle('tool-active', snapToGrid);
  const wrap = document.getElementById('boardWrap');
  if (wrap) {
    wrap.classList.remove('tool-draw', 'tool-fog', 'tool-fogPoly', 'tool-ruler', 'tool-ping', 'tool-template');
    if (boardTool !== 'pan') wrap.classList.add('tool-' + boardTool);
  }
}

function setBoardTool(tool) {
  // Trocar de ferramenta no meio de um contorno de névoa cancela o contorno
  // em andamento (senão os pontos marcados ficariam soltos, sem nunca
  // virar névoa nem sumir da tela).
  if (boardTool === 'fogPoly' && tool !== 'fogPoly' && typeof cancelFogPoly === 'function') cancelFogPoly();
  boardTool = tool;
  updateToolToolbarActive();
}

// ------------------------------------------------------- ATALHOS DE TECLADO --
// V/R/P trocam de ferramenta, 1/2/3 escolhem o formato de área, C limpa as
// áreas, G liga/desliga o encaixe na grade, D/F/N/X/Shift+F são só do
// Mestre (desenhar/névoa em retângulo/névoa em contorno livre/limpar
// desenhos/revelar tudo), Ctrl+Z desfaz o último traço, Esc volta pra
// "Mover" (ou, com um contorno de névoa em andamento, cancela só o
// contorno). Com a névoa em contorno livre ativa, Enter fecha o contorno
// atual e Backspace desfaz o último ponto marcado — igual ao botão direito
// do mouse. Ganha muito em mesas de combate corrido, onde alternar
// régua/marcar/área toda hora só de mouse atrapalha o ritmo. Ignorado por
// completo enquanto o foco está num campo de texto (chat, input de dados,
// nome de cena etc.) — senão digitar "d" numa mensagem de chat trocaria a
// ferramenta do mapa sem querer.
function handleBoardKeydown(e) {
  if (!curTable || !document.getElementById('boardView') ||
      document.getElementById('boardView').style.display === 'none') return;
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
  if (e.ctrlKey || e.metaKey) {
    if (e.key.toLowerCase() === 'z') { e.preventDefault(); undoLastDrawing(); }
    return;
  }
  if (e.altKey) return; // Alt é usado por outras ferramentas (medir/soltar livre)
  const isMaster = isTableOwner();
  const key = e.key.toLowerCase();
  if (boardTool === 'fogPoly' && isMaster) {
    if (key === 'enter' && fogPolyPoints.length >= 3) { e.preventDefault(); finishFogPoly(); return; }
    if (key === 'backspace' && fogPolyPoints.length) { e.preventDefault(); fogPolyPoints.pop(); renderFogPolyPreview(); return; }
  }
  switch (key) {
    case 'escape':
      if (boardTool === 'fogPoly' && fogPolyPoints.length) cancelFogPoly(); // primeiro Esc só limpa o contorno em andamento
      else setBoardTool('pan');
      break;
    case 'v': setBoardTool('pan'); break;
    case 'r': setBoardTool('ruler'); break;
    case 'p': setBoardTool('ping'); break;
    case '1': templateShape = 'circle'; setBoardTool('template'); break;
    case '2': templateShape = 'cone'; setBoardTool('template'); break;
    case '3': templateShape = 'line'; setBoardTool('template'); break;
    case 'c': clearMyOrAllTemplates(); break;
    case 'g': toggleSnapToGrid(); break;
    case 'd': if (isMaster) setBoardTool('draw'); break;
    case 'f': if (isMaster) { if (e.shiftKey) clearAllFog(); else setBoardTool('fog'); } break;
    case 'n': if (isMaster) setBoardTool('fogPoly'); break;
    case 'x': if (isMaster) clearAllDrawings(); break;
    default: return;
  }
  e.preventDefault();
}

// ------------------------------------------------------------- RÉGUA --
// Ferramenta local (não sincronizada): arrasta de um ponto a outro do mapa
// e mostra, ao vivo, a distância em número de casas da grade — como a
// régua de medição do Owlbear Rodeo, só que sem gastar leitura/escrita no
// Firestore, já que a medida só importa pra quem está medindo.
// Os dois pontos encaixam no centro da célula mais próxima (mesma regra de
// encaixe usada para soltar tokens — respeita o botão "🧲 Encaixar na
// grade" e a tecla Alt/Option para medir livre), então a distância mostrada
// é sempre a distância "de jogo" em casas, e não um valor de pixel bruto
// que muda a cada tremida do mouse.
let rulerPointerId = null, rulerStartScreen = null;

// Converte um ponto de tela (clientX/clientY) para fração 0..1 do mapa,
// usando o board-surface (que já reflete o pan/zoom atuais via
// getBoundingClientRect) — a mesma conversão usada no arraste de tokens.
function rulerScreenToMapFraction(clientX, clientY) {
  const surface = document.getElementById('boardSurface');
  const rect = surface.getBoundingClientRect();
  const x = rect.width ? (clientX - rect.left) / rect.width : 0;
  const y = rect.height ? (clientY - rect.top) / rect.height : 0;
  return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
}

// Converte uma fração 0..1 do mapa para coordenadas de tela relativas ao
// board-wrap (onde o SVG da régua é desenhado), já considerando pan/zoom.
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

  // Encaixa os dois pontos no centro da célula mais próxima, do mesmo jeito
  // que um token é encaixado ao ser solto — assim a régua sempre mede de
  // "meio de casa" a "meio de casa", como as fichas se movem de fato.
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

  // Destaca as duas células (início e fim) quando a medida está encaixada
  // na grade — some quando estiver medindo livre (Alt/Option), já que aí
  // não faz sentido marcar uma célula específica.
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
  // Distância calculada a partir das casas de grade (não do pixel bruto do
  // mouse) — reta entre os centros das duas células, em número de casas.
  const dxCells = boardCellPx ? ((bFrac.x - aFrac.x) * localW) / boardCellPx : 0;
  const dyCells = boardCellPx ? ((bFrac.y - aFrac.y) * localH) / boardCellPx : 0;
  const cells = Math.hypot(dxCells, dyCells);
  label.textContent = formatCellsAndMeters(cells, shouldSnap ? '' : ' (livre)');
  // BUG CORRIGIDO: no toque (dedo), o rótulo ficava colado no ponto final da
  // régua — exatamente onde o dedo está apoiado —, então o próprio dedo
  // tapava o número que deveria mostrar a medida. No mouse isso não é
  // problema (o cursor é fino e não cobre nada), então só o toque/caneta
  // ganha esse tratamento: em vez de seguir o ponto, o rótulo vira um
  // "cartão" fixo perto do topo do tabuleiro, sempre visível, longe de
  // qualquer dedo em qualquer posição da tela.
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

// ------------------------------------------------------------- DESENHAR --
// Traços livres do Mestre sobre o mapa. Cada traço vira um doc na
// subcoleção "drawings" (uma polilinha, em coordenadas normalizadas 0..1
// do mapa) — assim escala e faz pan junto com o resto do board-surface,
// de graça, por ser um SVG filho dele.
let drawPointerId = null, drawCurrentPoints = null;
// Id do último traço criado NESTA sessão do cliente (não persiste entre
// recarregar a página nem troca de cena — ver reset em refreshBoardForActiveScene
// no mesa-board.js). Alimenta o botão/atalho "Desfazer": um único nível,
// de propósito — um "histórico" de várias jogadas seria complexidade extra
// pra um caso de uso que na prática é "ops, saiu torto, refaço".
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
      // Mesmo padrão já usado em renderTemplates(): com a ferramenta de
      // desenho ativa, clicar num traço já existente apaga só ele, em vez
      // de começar um traço novo por cima — sem isso, a única forma de
      // corrigir um desenho era "Limpar desenhos", que apaga TODOS.
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
  lastOwnDrawingId = null; // um nível só: já consome, mesmo se a exclusão falhar
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

// ------------------------------------------------------------- NÉVOA --
// Duas formas de cobrir o mapa com névoa de guerra:
// - Retângulo (ferramenta "fog"): o Mestre arrasta de um canto ao outro.
// - Contorno livre (ferramenta "fogPoly"): o Mestre clica ponto a ponto ao
//   redor da área desejada; ao fechar o contorno (clicando de volta perto
//   do primeiro ponto, dando 2 cliques, apertando Enter ou clicando no
//   botão "Fechar contorno"), a região delimitada pelos pontos vira névoa —
//   útil pra cobrir salas, corredores ou áreas com formato irregular que
//   um retângulo não cobre bem.
// Em ambos os casos, clicar numa área já coberta a revela (ela some).
// Jogadores veem a névoa totalmente opaca; o Mestre a vê semitransparente,
// pra saber o que está escondendo sem perder a visão geral do mapa.
let fogPointerId = null, fogStartPoint = null;
let fogPolyPoints = [], fogPolyHoverPoint = null;

// Com qualquer uma das duas ferramentas de névoa ativas, clicar numa área
// já coberta revela ela — não só com a ferramenta que a criou.
function isFogToolActive() {
  return boardTool === 'fog' || boardTool === 'fogPoly';
}

function attachFogHandlers(wrap) {
  // -- Retângulo: clicar e arrastar --
  wrap.addEventListener('pointerdown', (e) => {
    if (boardTool !== 'fog' || !isTableOwner()) return;
    if (e.target.closest('.fog-rect') || e.target.closest('.fog-poly-shape')) return; // clique numa área existente: ver handler próprio dela
    fogPointerId = e.pointerId;
    fogStartPoint = boardPointFromEvent(e);
    wrap.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  wrap.addEventListener('pointermove', (e) => {
    if (fogPointerId !== e.pointerId || !fogStartPoint) return;
    renderLiveFogPreview(fogStartPoint, boardPointFromEvent(e));
  });
  const endFog = async (e) => {
    if (fogPointerId !== e.pointerId) return;
    fogPointerId = null;
    const start = fogStartPoint; fogStartPoint = null;
    removeLiveFogPreview();
    if (!start) return;
    const end = boardPointFromEvent(e);
    const x = Math.min(start.x, end.x), y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x), h = Math.abs(end.y - start.y);
    if (w < 0.01 || h < 0.01) return; // clique sem arrastar: ignora (evita névoa minúscula sem querer)
    if (!curTable.activeSceneId) return;
    try {
      await db.collection('tables').doc(curTable.id).collection('fog').add({ x, y, w, h, sceneId: curTable.activeSceneId });
    } catch (err) { console.error('Erro ao salvar névoa:', err); }
  };
  wrap.addEventListener('pointerup', endFog);
  wrap.addEventListener('pointercancel', endFog);

  // -- Contorno livre: clique a clique, marcando os pontos da borda --
  wrap.addEventListener('pointerdown', (e) => {
    if (boardTool !== 'fogPoly' || !isTableOwner()) return;
    if (e.target.closest('.fog-rect') || e.target.closest('.fog-poly-shape')) return; // clique numa área existente: revela, não marca ponto
    if (e.button === 2) return; // botão direito: ver "contextmenu" (desfaz o último ponto)
    e.preventDefault();
    const pt = boardPointFromEvent(e);
    // Clicar perto do ponto inicial (com pelo menos 3 já marcados) fecha o contorno.
    if (fogPolyPoints.length >= 3 && isNearFogPolyStart(pt)) { finishFogPoly(); return; }
    fogPolyPoints.push(pt);
    renderFogPolyPreview();
  });
  wrap.addEventListener('pointermove', (e) => {
    if (boardTool !== 'fogPoly' || !fogPolyPoints.length) return;
    fogPolyHoverPoint = boardPointFromEvent(e);
    renderFogPolyPreview();
  });
  wrap.addEventListener('dblclick', (e) => {
    if (boardTool !== 'fogPoly' || !fogPolyPoints.length) return;
    e.preventDefault();
    finishFogPoly();
  });
  wrap.addEventListener('contextmenu', (e) => {
    if (boardTool !== 'fogPoly') return;
    e.preventDefault();
    if (fogPolyPoints.length) { fogPolyPoints.pop(); renderFogPolyPreview(); }
  });
}

function renderLiveFogPreview(a, b) {
  const surface = document.getElementById('boardSurface');
  let el = surface.querySelector('#liveFogPreview');
  if (!el) {
    el = document.createElement('div');
    el.id = 'liveFogPreview';
    el.className = 'fog-rect fog-master';
    surface.appendChild(el);
  }
  const x = Math.min(a.x, b.x) * baseMapW, y = Math.min(a.y, b.y) * baseMapH;
  const w = Math.abs(b.x - a.x) * baseMapW, h = Math.abs(b.y - a.y) * baseMapH;
  el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = w + 'px'; el.style.height = h + 'px';
}

function removeLiveFogPreview() {
  const el = document.getElementById('liveFogPreview');
  if (el) el.remove();
}

// Camada SVG compartilhada onde vivem os polígonos de névoa já salvos e a
// prévia do contorno em andamento — mesmo padrão de drawSvgLayer() (a
// viewBox usa as mesmas unidades de baseMapW/baseMapH, então os pontos
// normalizados 0..1 dos fogs viram coordenadas diretas, sem conversão).
function fogPolySvgLayer() {
  let svg = document.getElementById('fogPolySvgLayer');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'fogPolySvgLayer';
    svg.style.position = 'absolute'; svg.style.top = '0'; svg.style.left = '0';
    svg.style.pointerEvents = 'none';
    document.getElementById('boardSurface').appendChild(svg);
  }
  svg.setAttribute('width', baseMapW); svg.setAttribute('height', baseMapH);
  svg.setAttribute('viewBox', `0 0 ${baseMapW} ${baseMapH}`);
  return svg;
}

// Raio (em px de mapa) considerado "perto o bastante do primeiro ponto"
// pra fechar o contorno com um clique — acompanha o tamanho da grade pra
// funcionar bem tanto em mapas com casas grandes quanto pequenas.
function isNearFogPolyStart(pt) {
  const first = fogPolyPoints[0];
  const dx = (pt.x - first.x) * baseMapW, dy = (pt.y - first.y) * baseMapH;
  return Math.hypot(dx, dy) < Math.max(14, boardCellPx * 0.25);
}

// Prévia ao vivo do contorno: linha ligando os pontos já marcados até o
// cursor, preenchimento provisório (não salvo ainda) e uma bolinha maior
// no primeiro ponto, indicando onde clicar pra fechar a área.
function renderFogPolyPreview() {
  const svg = fogPolySvgLayer();
  if (!fogPolyPoints.length) { removeFogPolyPreview(); return; }
  let g = svg.querySelector('#liveFogPolyPreview');
  if (!g) {
    g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.id = 'liveFogPolyPreview';
    g.innerHTML = '<polygon class="fog-poly-live-shape"></polygon><polyline class="fog-poly-live-line"></polyline>';
    svg.appendChild(g);
  }
  const linePts = fogPolyHoverPoint ? [...fogPolyPoints, fogPolyHoverPoint] : fogPolyPoints;
  const attr = pointsToPathAttr(linePts);
  g.querySelector('.fog-poly-live-line').setAttribute('points', attr);
  g.querySelector('.fog-poly-live-shape').setAttribute('points', attr);
  g.querySelectorAll('.fog-poly-live-dot, .fog-poly-live-first').forEach(el => el.remove());
  fogPolyPoints.forEach((p, i) => {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', p.x * baseMapW); c.setAttribute('cy', p.y * baseMapH);
    const isFirst = i === 0 && fogPolyPoints.length >= 3;
    c.setAttribute('r', isFirst ? 8 : 4);
    c.setAttribute('class', isFirst ? 'fog-poly-live-first' : 'fog-poly-live-dot');
    g.appendChild(c);
  });
}

function removeFogPolyPreview() {
  const g = document.querySelector('#fogPolySvgLayer #liveFogPolyPreview');
  if (g) g.remove();
}

// Fecha o contorno atual e salva a névoa em formato de polígono. Pede ao
// menos 3 pontos (senão não delimita área nenhuma).
async function finishFogPoly() {
  const pts = fogPolyPoints;
  fogPolyPoints = []; fogPolyHoverPoint = null;
  removeFogPolyPreview();
  if (pts.length < 3 || !curTable.activeSceneId) return;
  try {
    await db.collection('tables').doc(curTable.id).collection('fog').add({
      type: 'poly',
      points: pts.map(p => ({ x: p.x, y: p.y })),
      sceneId: curTable.activeSceneId
    });
  } catch (err) { console.error('Erro ao salvar névoa (contorno):', err); }
}

// Descarta o contorno em andamento sem salvar nada (Esc, ou troca de
// ferramenta/cena no meio do desenho).
function cancelFogPoly() {
  fogPolyPoints = []; fogPolyHoverPoint = null;
  removeFogPolyPreview();
}

function renderFog() {
  const surface = document.getElementById('boardSurface');
  if (!surface) return;
  surface.querySelectorAll('.fog-rect[data-fog-id]').forEach(el => {
    if (!liveFog[el.dataset.fogId]) el.remove();
  });
  const svg = fogPolySvgLayer();
  svg.querySelectorAll('polygon[data-fog-id]').forEach(el => {
    if (!liveFog[el.dataset.fogId]) el.remove();
  });
  const isMaster = isTableOwner();
  Object.values(liveFog).forEach(f => {
    // Névoas antigas (salvas antes desta função existir) não têm "type" e
    // continuam sendo retângulos — só as novas, marcadas type:'poly' com
    // pontos suficientes, usam o caminho de polígono.
    if (f.type === 'poly' && Array.isArray(f.points) && f.points.length >= 3) {
      renderFogPolyShape(f, svg, isMaster);
    } else {
      renderFogRectShape(f, surface, isMaster);
    }
  });
}

function renderFogRectShape(f, surface, isMaster) {
  let el = surface.querySelector(`.fog-rect[data-fog-id="${f.id}"]`);
  if (!el) {
    el = document.createElement('div');
    el.dataset.fogId = f.id;
    el.className = 'fog-rect';
    surface.appendChild(el);
    el.addEventListener('pointerdown', async (e) => {
      if (!isFogToolActive() || !isTableOwner()) return;
      e.stopPropagation();
      try { await db.collection('tables').doc(curTable.id).collection('fog').doc(f.id).delete(); }
      catch (err) { console.error('Erro ao revelar névoa:', err); }
    });
  }
  el.classList.toggle('fog-master', isMaster);
  el.style.left = (f.x * baseMapW) + 'px';
  el.style.top = (f.y * baseMapH) + 'px';
  el.style.width = (f.w * baseMapW) + 'px';
  el.style.height = (f.h * baseMapH) + 'px';
}

function renderFogPolyShape(f, svg, isMaster) {
  let el = svg.querySelector(`polygon[data-fog-id="${f.id}"]`);
  if (!el) {
    el = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    el.dataset.fogId = f.id;
    el.setAttribute('class', 'fog-poly-shape');
    el.style.pointerEvents = 'auto'; // a camada svg toda ignora clique — só a forma preenchida recebe
    svg.appendChild(el);
    el.addEventListener('pointerdown', async (e) => {
      if (!isFogToolActive() || !isTableOwner()) return;
      e.stopPropagation();
      try { await db.collection('tables').doc(curTable.id).collection('fog').doc(f.id).delete(); }
      catch (err) { console.error('Erro ao revelar névoa:', err); }
    });
  }
  el.classList.toggle('fog-master', isMaster);
  el.setAttribute('points', pointsToPathAttr(f.points));
}

function listenFog() {
  if (!curTable.activeSceneId) return;
  fogUnsub = db.collection('tables').doc(curTable.id).collection('fog')
    .where('sceneId', '==', curTable.activeSceneId)
    .onSnapshot(snap => {
      liveFog = {};
      snap.forEach(d => { liveFog[d.id] = { id: d.id, ...d.data() }; });
      renderFog();
    }, err => console.error('Erro ao sincronizar névoa:', err));
}

async function clearAllFog() {
  if (!curTable.activeSceneId) return;
  if (!confirm('Revelar o mapa inteiro desta cena (remover toda a névoa)?')) return;
  try {
    const snap = await db.collection('tables').doc(curTable.id).collection('fog')
      .where('sceneId', '==', curTable.activeSceneId).get();
    const batch = db.batch();
    snap.forEach(d => batch.delete(d.ref));
    await batch.commit();
  } catch (err) { alert('Erro ao revelar tudo: ' + err.message); }
}

// -------------------------------------------------------------- MARCAR --
// "Ping": qualquer jogador presente pode marcar um ponto do mapa para
// chamar atenção de todos — some sozinho depois de ~1.6s. Quem cria o
// ping é quem apaga (depois de um tempo), então não sobra lixo se alguém
// fechar a aba no meio do caminho: o próprio doc simplesmente já terá
// sumido do snapshot de quem ainda está na mesa assim que o autor voltar
// a ficar online e/ou o próximo ping dele passar por aqui de novo.
function attachPingHandlers(wrap) {
  wrap.addEventListener('pointerdown', async (e) => {
    if (boardTool !== 'ping') return;
    e.preventDefault();
    const p = boardPointFromEvent(e);
    try {
      // A marcação sai sempre na cor escolhida na roda cromática do próprio
      // jogador (myColor) — ninguém marca numa cor "solta" fora da roda.
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
    if (surface.querySelector(`.ping-mark[data-ping-id="${p.id}"]`)) return; // já animando, não reinicia
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

// --------------------------------------------------------- ÁREAS (📐) --
// Templates de área para magias/ataques, no mesmo espírito do Owlbear
// Rodeo/Roll20: o jogador escolhe o formato (círculo, cone ou linha),
// arrasta da origem até o alcance desejado e solta — a forma fica salva
// na cor dele até alguém apagar (o próprio autor ou o Mestre).
//
// Guardamos só os dois pontos brutos em fração 0..1 do mapa (origem "a" e
// o ponto que definiu tamanho/direção "b"); toda a geometria (raio do
// círculo, triângulo do cone, retângulo da linha) é recalculada a partir
// deles em templateShapeGeometry — mesma ideia de "points" nos desenhos
// livres, só que com forma fixa em vez de traço livre.
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
    if (Math.hypot(dx, dy) < 6) return; // clique sem arrastar: ignora (evita área minúscula sem querer)
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

// Calcula a forma (tag SVG + atributos) de uma área a partir do ponto de
// origem "a" (centro do círculo / vértice do cone / início da linha) e do
// ponto "b" que define tamanho e direção — ambos em fração 0..1 do mapa.
// Devolve tudo já em px "naturais" (mesmo espaço do viewBox acima), então
// serve tanto pra pré-visualização ao vivo quanto pra área já salva.
function templateShapeGeometry(shape, a, b) {
  const ax = a.x * baseMapW, ay = a.y * baseMapH;
  const bx = b.x * baseMapW, by = b.y * baseMapH;
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy) || 0.0001;
  if (shape === 'circle') {
    // Rótulo (raio) logo acima do topo do círculo, fora da área preenchida.
    return { tag: 'circle', attrs: { cx: ax, cy: ay, r: len }, len, label: { x: ax, y: ay - len - 10 } };
  }
  const ux = dx / len, uy = dy / len; // vetor unitário na direção do arraste
  const perpx = -uy, perpy = ux;      // perpendicular a ele
  if (shape === 'cone') {
    // Cone "estilo D&D 5e": a largura da base é sempre igual ao comprimento.
    const half = len / 2;
    const baseX = ax + ux * len, baseY = ay + uy * len;
    const p1x = baseX + perpx * half, p1y = baseY + perpy * half;
    const p2x = baseX - perpx * half, p2y = baseY - perpy * half;
    // Rótulo (alcance) no meio do eixo do cone, da origem até a base.
    return {
      tag: 'polygon', attrs: { points: `${ax},${ay} ${p1x},${p1y} ${p2x},${p2y}` }, len,
      label: { x: (ax + baseX) / 2, y: (ay + baseY) / 2 }
    };
  }
  // 'line': um retângulo fino (cerca de meia casa pra cada lado) do início ao fim.
  const half = Math.max(6, boardCellPx * 0.45);
  const p1x = ax + perpx * half, p1y = ay + perpy * half;
  const p2x = bx + perpx * half, p2y = by + perpy * half;
  const p3x = bx - perpx * half, p3y = by - perpy * half;
  const p4x = ax - perpx * half, p4y = ay - perpy * half;
  // Rótulo (comprimento) no meio da linha, deslocado pra fora da faixa.
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

// Texto mostrado sobre cada área de ataque, com o "comprimento" que a
// definiu — raio pro círculo, alcance pro cone, comprimento pra linha —
// sempre em casas e em metros (metersPerCell), igual à régua.
function formatTemplateLabel(shape, lenPx) {
  const cells = boardCellPx ? lenPx / boardCellPx : 0;
  const prefix = shape === 'circle' ? 'Raio: ' : shape === 'cone' ? 'Alcance: ' : 'Comprimento: ';
  return prefix + formatCellsAndMeters(cells);
}

// Cria (ou atualiza) o <text> com o comprimento de uma área — seja a
// pré-visualização ao vivo (key = 'live') ou uma área já salva (key = id).
// Mora no mesmo SVG que a forma, então acompanha pan/zoom de graça.
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
  // Fonte em unidades "naturais" (mesmo espaço da grade) — acompanha o
  // tamanho da célula do mapa atual, então continua legível tanto num mapa
  // pequeno quanto num grande, e escala junto com o zoom (como o resto do
  // board-surface).
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
      // Clique numa área (com a ferramenta ativa) apaga — só o próprio autor
      // ou o Mestre; jogadores nem tentam a escrita, então a regra do
      // Firestore nunca chega a barrar (e ainda barra, por garantia).
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

let boardPanPointerId = null;   // arrasto com mouse (1 ponteiro só)
let boardPanStartX = 0, boardPanStartY = 0, boardPanStartPanX = 0, boardPanStartPanY = 0;
let boardTouchPointers = new Map(); // ponteiros de toque ativos (celular)
let boardTouchMode = null;          // 'pan' (1 dedo) ou 'pinch' (2 dedos)
let boardTouchLastX = 0, boardTouchLastY = 0;
let boardPinchLastDist = 0, boardPinchLastMidX = 0, boardPinchLastMidY = 0;
// Toque duplo (2 toques rápidos e curtos no mesmo lugar) dá zoom, como em
// apps de mapa — precisa saber onde/quando foi o toque anterior, e se o
// dedo atual chegou a arrastar (senão um arrasto rápido dispararia zoom).
let boardTouchDownX = 0, boardTouchDownY = 0, boardTouchMovedFar = false;
let boardLastTapTime = 0, boardLastTapX = 0, boardLastTapY = 0;

function boardTouchPointsArray() { return Array.from(boardTouchPointers.values()); }

function attachBoardInteractionHandlers() {
  const wrap = document.getElementById('boardWrap');
  if (!wrap || wrap._boardInteractionAttached) return;
  wrap._boardInteractionAttached = true;

  wrap.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.token') || e.target.closest('.token-handles')) return; // deixa o drag do token/alças cuidar disso
    if (selectedTokenId) { selectedTokenId = null; updateSelectionHandles(); renderTokenListPanel(); }

    if (e.pointerType === 'touch') {
      boardTouchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      wrap.setPointerCapture(e.pointerId);
      if (boardTouchPointers.size === 1) {
        // Com uma ferramenta diferente de "mover" ativa, 1 dedo é a própria
        // ferramenta (régua/desenho/névoa/marcar) quem trata — não arrasta o
        // mapa. Ainda assim seguimos rastreando o ponteiro (acima), porque
        // se um segundo dedo descer viramos "pinch" e isso sempre dá zoom,
        // não importa a ferramenta ativa.
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

    if (boardTool !== 'pan') return; // outra ferramenta ativa: quem trata é o handler dela
    if (e.button !== 0) return; // só o botão principal do mouse arrasta o mapa
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
        // Ainda sobrou 1 dedo depois de um pinça — volta a ser arrasto simples.
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
            boardLastTapTime = 0; // consumido — um terceiro toque não vira zoom de novo sozinho
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

  // Roda do mouse: zoom direto (sem precisar de Ctrl), mirando no cursor —
  // já que agora mover o mapa é feito arrastando, e não mais rolando.
  wrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = wrap.getBoundingClientRect();
    const ax = e.clientX - rect.left, ay = e.clientY - rect.top;
    zoomBoardAt(boardZoom + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP), ax, ay);
  }, { passive: false });

  attachRulerHandlers(wrap);
  attachDrawHandlers(wrap);
  attachFogHandlers(wrap);
  attachPingHandlers(wrap);
  attachTemplateHandlers(wrap);
}

// ================================================== PAINÉIS SANFONADOS ==
// Cada .side-panel vira uma "sanfona": clicar no título (sempre o primeiro
// filho, um <h4>, mesmo quando o painel inteiro é redesenhado via innerHTML
// pelas funções render*Panel) abre ou fecha o resto do conteúdo. O estado
// fica salvo no navegador, por painel, então continua do jeito que a pessoa
// deixou da última vez — mesmo depois de o painel ser redesenhado, porque a
// classe "collapsed" fica na própria div do painel, não é apagada pelo
// innerHTML dos filhos.
const SIDE_PANEL_COLLAPSE_KEY = 'heartsoul_sidePanelCollapsed';
// Painéis maiores/menos usados no dia a dia começam fechados por padrão,
// pra tela não ficar tão cheia logo de cara — o resto começa aberto.
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
function initSidePanelAccordion() {
  const side = document.querySelector('.board-side');
  if (!side) return;
  // Trava extra: mesmo que esta função seja chamada mais de uma vez por
  // algum motivo, o clique-ouvinte só é registrado uma única vez.
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
    try { localStorage.setItem(SIDE_PANEL_COLLAPSE_KEY, JSON.stringify(saved)); } catch (err) { /* ignora se o navegador bloquear */ }
  });
  applySidePanelCollapseState();
}

// ===== Painéis retráteis (ferramentas à esquerda / painel lateral à
// direita) — recolhe a coluna inteira de um lado, não só uma sanfona.
// Guarda o estado de cada um separadamente no navegador (chaves próprias),
// pra lembrar aberto/fechado entre visitas, igual às sanfonas acima.
const RETRACT_KEY = 'heartsoul_retractPanels';
function loadRetractState() {
  try { return JSON.parse(localStorage.getItem(RETRACT_KEY) || '{}'); }
  catch (err) { return {}; }
}
function saveRetractState(state) {
  try { localStorage.setItem(RETRACT_KEY, JSON.stringify(state)); } catch (err) { /* ignora se o navegador bloquear */ }
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


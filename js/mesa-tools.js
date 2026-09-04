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
    <div class="tool-toolbar-label">Navegação</div>
    <button type="button" data-tool="pan" title="Mover o mapa (padrão) — atalho: V"><span class="tool-label">✋ Mover</span><kbd class="tool-key">V</kbd></button>
    <button type="button" data-tool="ruler" title="Medir distância em casas da grade (segure Alt/Option para medir livre, sem encaixar) — atalho: R"><span class="tool-label">📏 Régua</span><kbd class="tool-key">R</kbd></button>
    <button type="button" data-tool="ping" title="Marcar um ponto para todos verem, na sua cor — atalho: P"><span class="tool-label">📍 Marcar</span><kbd class="tool-key">P</kbd></button>
    <button type="button" data-tool="select" title="Seleção múltipla: clique em cada token pra marcar/desmarcar (os que você pode mexer), depois arraste qualquer um dos marcados para mover o grupo inteiro junto — clique em uma área vazia do mapa para limpar a seleção — atalho: M"><span class="tool-label">🔲 Seleção múltipla</span><kbd class="tool-key">M</kbd></button>
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
    if (btn.dataset.shape) templateShape = btn.dataset.shape; // botões de área também escolhem o formato
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
  // Botão/atalho "Girar c/ cursor": trava/destrava o giro automático do
  // token que estiver selecionado no mapa (alças abertas em cima dele).
  // Sem token selecionado, ou selecionado mas sem permissão pra mexer nele
  // (não é seu nem você é o Mestre), o botão fica desabilitado — não dá pra
  // travar o giro de um token que você não pode girar de qualquer jeito.
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
  // As alças de edição de ponto de parede só aparecem com a ferramenta 🧱
  // ativa (ver showHandles em renderWalls) — reaplica sempre que a
  // ferramenta muda, não só quando as paredes em si mudam.
  if (typeof renderWalls === 'function' && typeof isTableOwner === 'function' && isTableOwner()) renderWalls();
  const wrap = document.getElementById('boardWrap');
  if (wrap) {
    wrap.classList.remove('tool-draw', 'tool-wall', 'tool-door', 'tool-room', 'tool-light', 'tool-ruler', 'tool-ping', 'tool-template');
    if (boardTool !== 'pan') wrap.classList.add('tool-' + boardTool);
  }
}

function setBoardTool(tool) {
  // Trocar de ferramenta no meio de um traço de parede cancela o traço em
  // andamento (senão os pontos marcados ficariam soltos, sem nunca virar
  // parede nem sumir da tela).
  if (boardTool === 'wall' && tool !== 'wall' && typeof cancelWallChain === 'function') cancelWallChain();
  if (boardTool === 'door' && tool !== 'door' && typeof cancelDoorDraft === 'function') cancelDoorDraft();
  if (boardTool === 'room' && tool !== 'room' && typeof cancelRoomDraft === 'function') cancelRoomDraft();
  // Saindo da ferramenta de seleção múltipla, limpa a seleção — senão ela
  // ficaria "pendurada" (destacada no mapa) sem dar pra fazer nada com ela
  // até voltar pra essa ferramenta de novo.
  if (boardTool === 'select' && tool !== 'select' && typeof multiSelectedIds !== 'undefined' && multiSelectedIds.size) {
    multiSelectedIds.clear();
    if (typeof renderAllTokens === 'function') renderAllTokens();
    if (typeof renderTokenListPanel === 'function') renderTokenListPanel();
  }
  boardTool = tool;
  updateToolToolbarActive();
}

// ------------------------------------------------------- ATALHOS DE TECLADO --
// V/R/P trocam de ferramenta, 1/2/3 escolhem o formato de área, C limpa as
// áreas, G liga/desliga o encaixe na grade, T trava/destrava o giro no
// cursor do token selecionado no mapa (mesmo efeito do botão 🧭 "Seguir
// cursor" na lista de tokens), D/F/N/X/Shift+F são só do Mestre (desenhar/
// névoa em retângulo/névoa em contorno livre/limpar desenhos/revelar
// tudo), Ctrl+Z desfaz o último traço, Esc volta pra "Mover" (ou, com um
// contorno de névoa em andamento, cancela só o contorno). Com a névoa em
// contorno livre ativa, Enter fecha o contorno atual e Backspace desfaz o
// último ponto marcado — igual ao botão direito do mouse. Ganha muito em
// mesas de combate corrido, onde alternar régua/marcar/área toda hora só de
// mouse atrapalha o ritmo. Ignorado por completo enquanto o foco está num
// campo de texto (chat, input de dados, nome de cena etc.) — senão digitar
// "d" numa mensagem de chat trocaria a ferramenta do mapa sem querer.
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
  if (boardTool === 'wall' && isMaster) {
    if (key === 'enter' && wallPoints.length >= 2) { e.preventDefault(); finishWallChain(false); return; }
    if (key === 'backspace' && wallPoints.length) { e.preventDefault(); wallPoints.pop(); renderWallPreview(); return; }
  }
  switch (key) {
    case 'escape':
      if (boardTool === 'wall' && wallPoints.length) cancelWallChain(); // primeiro Esc só limpa o traço em andamento
      else if (boardTool === 'door' && doorStartPt) cancelDoorDraft();
      else if (boardTool === 'room' && roomStartPt) cancelRoomDraft();
      else setBoardTool('pan');
      break;
    case 'v': setBoardTool('pan'); break;
    case 'r': setBoardTool('ruler'); break;
    case 'p': setBoardTool('ping'); break;
    case 'm': setBoardTool('select'); break;
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
// A névoa (fog) antiga, pintada manualmente pelo Mestre, foi substituída
// pela visão dinâmica dos tokens (ver "VISÃO DINÂMICA" mais abaixo): a
// névoa agora é 100% automática, calculada a partir de onde cada token
// com visão está e do que as paredes (ferramenta 🧱) bloqueiam — ninguém
// mais pinta/revela manualmente. Estas funções ficam só de referência —
// liveFog/renderFog/listenFog continuam existindo (chamadas em
// renderBoardBackground) por segurança/compatibilidade com mesas antigas,
// mas na prática não há mais botão nem atalho que crie névoa manual.
function renderFog() { /* substituída pela visão dinâmica automática — ver renderFogOfWar() */ }
function listenFog() { /* idem — a névoa não é mais lida/escrita manualmente */ }

// -------------------------------------------------------------- PAREDES --
// Ferramenta do Mestre (🧱 Parede) para desenhar as paredes que bloqueiam
// a linha de visão dos tokens — é isso que dá forma à névoa de guerra
// automática (ver "VISÃO DINÂMICA" logo abaixo). Clique ponto a ponto ao
// redor do obstáculo (paredes de uma sala, um corredor etc.); termina o
// traço com Enter, dois cliques, o botão "Fechar contorno" ou clicando de
// volta perto do primeiro ponto (isso também fecha o contorno, útil pra
// contornar uma sala inteira). Botão direito (ou Backspace) desfaz o
// último ponto; Esc cancela o traço em andamento. As paredes só aparecem
// para o Mestre (contorno tracejado azulado) — jogadores nunca as veem
// diretamente, só sentem o efeito delas bloqueando a névoa.
let wallPointerId = null;
let wallPoints = [], wallHoverPoint = null;

function attachWallHandlers(wrap) {
  wrap.addEventListener('pointerdown', (e) => {
    if (boardTool !== 'wall' || !isTableOwner()) return;
    if (e.target.closest('.wall-line-shape')) return; // clique numa parede existente: apaga (ver renderWalls), não marca ponto
    if (e.button === 2) return; // botão direito: ver "contextmenu" (desfaz o último ponto)
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

// Camada SVG compartilhada das paredes já salvas + a prévia do traço em
// andamento — mesmo padrão de drawSvgLayer()/fogPolySvgLayer().
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

// Fecha o traço atual e salva a parede (uma cadeia de segmentos — "closed"
// marca se o último ponto deve se ligar de volta ao primeiro, fechando um
// contorno completo, útil pra cercar uma sala inteira de uma vez).
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

// Descarta o traço em andamento sem salvar nada (Esc, ou troca de
// ferramenta/cena no meio do desenho).
function cancelWallChain() {
  wallPoints = []; wallHoverPoint = null;
  removeWallPreview();
}

function renderWalls() {
  const svg = wallSvgLayer();
  const isMaster = isTableOwner();
  // Jogadores nunca veem as paredes em si — só o efeito delas bloqueando a
  // névoa (ver renderFogOfWar) — então a camada inteira fica escondida
  // pra eles, e nem seguimos criando/atualizando os elementos à toa.
  svg.style.display = isMaster ? '' : 'none';
  if (!isMaster) return;
  svg.querySelectorAll('polyline[data-wall-id]').forEach(el => {
    if (!liveWalls[el.dataset.wallId]) el.remove();
  });
  svg.querySelectorAll('circle.wall-edit-dot[data-wall-id]').forEach(el => {
    if (!liveWalls[el.dataset.wallId]) el.remove();
  });
  // As alças de edição de ponto só aparecem com a ferramenta de parede
  // ativa e nenhum traço novo em andamento — senão ficariam confundindo
  // com os pontos do próprio traço sendo desenhado (wallPoints).
  const showHandles = boardTool === 'wall' && !wallPoints.length;
  Object.values(liveWalls).forEach(w => {
    let el = svg.querySelector(`polyline[data-wall-id="${w.id}"]`);
    if (!el) {
      el = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      el.dataset.wallId = w.id;
      el.setAttribute('class', 'wall-line-shape');
      el.style.pointerEvents = 'auto'; // a camada toda ignora clique — só a linha da parede recebe
      svg.appendChild(el);
      el.addEventListener('pointerdown', async (e) => {
        if (boardTool !== 'wall' || !isTableOwner()) return;
        if (e.target.closest('.wall-edit-dot')) return; // clique numa alça: ver abaixo (arrasta, não apaga)
        e.stopPropagation();
        try { await db.collection('tables').doc(curTable.id).collection('walls').doc(w.id).delete(); }
        catch (err) { console.error('Erro ao apagar parede:', err); }
      });
    }
    const pts = w.points || [];
    const drawPts = (w.closed && pts.length >= 3) ? [...pts, pts[0]] : pts;
    el.setAttribute('points', pointsToPathAttr(drawPts));

    // Alças de edição: uma por ponto salvo — arrastar reposiciona o ponto
    // (ver startWallVertexDrag), em vez de precisar apagar e redesenhar a
    // parede inteira pra corrigir um único vértice.
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

// Arrastar um ponto já existente de uma parede salva pra reposicioná-lo,
// em vez de apagar a parede inteira e redesenhar do zero só pra corrigir
// um vértice. Ativo só com a ferramenta 🧱 e nenhum traço novo em
// andamento (ver showHandles em renderWalls). Atualiza a prévia local a
// cada movimento e só grava no Firestore quando o ponteiro é solto.
let wallVertexDrag = null; // {wallId, idx, pointerId, points}
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

// Chamada pela geração de mapa procedural (generateAndSaveMap, em
// mesa-tokens.js) logo depois que um mapa novo é salvo — contorna
// automaticamente toda a área de piso do mapa recém-gerado com paredes de
// bloqueio de visão (ver mapgenWallSegmentsFromGrid, em mapgen.js), sem o
// Mestre precisar traçar nada à mão.
//
// Como o layout é completamente novo a cada geração, as paredes, portas e
// luzes da geração anterior — se houver — deixariam de fazer sentido
// (uma porta ou tocha antiga podia cair em cima de rocha sólida no
// layout novo), então são removidas junto; a memória de exploração também
// é zerada, já que "já visto" de um layout que não existe mais não quer
// dizer nada no novo.
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

  // Um lote do Firestore aceita no máximo 500 operações — mapas grandes
  // (colossal, por ex.) podem passar disso, então divide em lotes de 400
  // (folga de sobra) e vai disparando em sequência.
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

// ---------------------------------------------------------------- PORTAS --
// Uma porta é um segmento único (não uma cadeia como a parede) que bloqueia
// a visão só enquanto está fechada (door.open === false) — abrir/fechar é
// uma ação de jogo, disponível pra qualquer pessoa na mesa, não só o
// Mestre. Só o Mestre cria (arrastando de um lado ao outro do vão) e apaga
// (clicando numa porta existente com a ferramenta 🚪 ativa). Ao contrário
// da parede, o ícone da porta aparece pra todo mundo (pra dar pra abrir/
// fechar); só o traço da porta em si (a "linha" que ela ocupa) fica
// escondido dos jogadores, mesma regra da parede.
let doorPointerId = null;
let doorStartPt = null;

function attachDoorHandlers(wrap) {
  wrap.addEventListener('pointerdown', (e) => {
    if (boardTool !== 'door' || !isTableOwner()) return;
    if (e.target.closest('.door-mark')) return; // clique num ícone existente: ver renderDoors (apaga ou abre/fecha)
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
    if (Math.hypot(dx, dy) < 6) return; // clique sem arrastar: ignora (evita porta minúscula sem querer)
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

// Ícone clicável no meio da porta — visível pra todo mundo (ao contrário do
// traço da parede/porta em si, que só o Mestre vê). Clique normal abre/
// fecha; clique com a ferramenta 🚪 ativa (só o Mestre) apaga a porta.
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
    line.style.display = isMaster ? '' : 'none'; // só o Mestre vê o traço em si — todos veem o ícone abaixo

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
        // Porta trancada: só o Mestre consegue abrir — pra quem joga, o
        // clique simplesmente não faz nada (a porta continua fechada).
        if (!isTableOwner() && cur.locked && !cur.open) return;
        try {
          await db.collection('tables').doc(curTable.id).collection('doors').doc(d.id).update({ open: !cur.open });
        } catch (err) { console.error('Erro ao abrir/fechar porta:', err); }
      });
      // Botão direito (só o Mestre): tranca/destranca, sem abrir nem fechar.
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
      invalidateCollisionSegmentsCache(); // abrir/fechar porta também muda o que bloqueia a visão
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

// -------------------------------------------------------- SALA (RETÂNGULO) --
// Atalho pra contornar uma sala inteira com paredes de uma vez: arraste de
// um canto ao outro e solte — nasce como uma única parede fechada
// (4 pontos, closed:true), igual a fechar um contorno manual com a
// ferramenta 🧱 mas sem precisar clicar ponto a ponto. Reaproveita a mesma
// coleção 'walls' — a "sala" resultante é uma parede comum daí pra frente,
// editável ponto a ponto (ver startWallVertexDrag) e apagável clicando nela
// com a ferramenta 🧱.
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
    if (Math.hypot(dx, dy) < 6) return; // clique sem arrastar: ignora (evita sala minúscula sem querer)
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
  const svg = wallSvgLayer(); // mesma camada visual das paredes (só o Mestre vê)
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

// ---------------------------------------------------------------- LUZES --
// Fonte de luz (🔥 tocha): um ponto fixo no mapa que revela sua área
// sempre, bloqueado pelas paredes/portas fechadas — igual à visão de um
// token, mas sem precisar de nenhum token perto. Só o Mestre cria/apaga
// (clique com a ferramenta ativa) e ajusta o raio (roda do mouse sobre uma
// luz já acesa). O ícone aparece pra todo mundo — como qualquer objeto do
// cenário —, mas só depois que a área dela já foi vista/explorada, pra não
// entregar o que tem lá adiante através da névoa ainda não revelada (mesma
// regra do ícone de porta, ver updateDoorVisibility). O efeito de
// iluminar de fato (limpar a névoa) é calculado em recomputeAndRenderVision.
let lightPointerId = null;
let lightMarkElCache = {};

function attachLightHandlers(wrap) {
  wrap.addEventListener('pointerdown', async (e) => {
    if (boardTool !== 'light' || !isTableOwner()) return;
    if (e.target.closest('.light-mark')) return; // clique numa luz existente: ver renderLights (apaga)
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
      // Roda do mouse sobre a luz ajusta o raio (só o Mestre) — evita
      // precisar de um painel à parte só pra isso.
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
      visionFullRedrawNeeded = true; // fontes de luz mudaram: recalcula tudo
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

// Mesma regra do ícone de porta: só aparece pra quem joga depois que a área
// ao redor já foi vista/explorada — senão a luz entregaria uma sala inteira
// através da névoa ainda não revelada. O Mestre sempre vê todas.
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

// ------------------------------------------------- VISÃO DINÂMICA (névoa) --
// Névoa de guerra automática, estilo Roll20: cada token com visão ligada
// (👁 na lista de tokens) revela um polígono ao redor de si — até
// tok.visionRadius casas de alcance —, bloqueado pelas paredes desenhadas
// acima. Três camadas ficam visíveis ao mesmo tempo, como memória de
// exploração: **não explorado** (bruma escura, mas não um breu 100%
// opaco), **já visto mas fora de visão agora** (escurecido, "lembrança")
// e **visível agora** (limpo). A exploração acumulada fica salva por casa
// da grade (tables/{id}/visionMemory/{sceneId}, campo "cells") —
// compartilhada entre todos na mesa, nunca "esquece" uma área já vista. O
// Mestre sempre vê o mapa inteiro (a camada de névoa aparece bem clara
// pra ele, só de referência).
// Portas (🚪) entram no cálculo como paredes que bloqueiam só enquanto
// fechadas; tokens podem enxergar em cone (na direção que estão virados,
// tok.rot) em vez de 360°; e a borda externa do alcance agora suaviza em
// gradiente (FOG_EDGE_SOFTNESS) em vez de cortar em linha dura — só as
// bordas por causa de parede/porta continuam com corte nítido.
const FOG_UNSEEN_COLOR = 'rgba(17,14,11,0.86)'; // alpha < 1 de propósito: não é um breu totalmente opaco, deixa entrever vagamente o mapa por baixo
const FOG_EXPLORED_DIM_ALPHA = 0.55; // o quanto uma casa "lembrada" (fora de visão agora) ainda escurece o mapa
const FOG_CIRCLE_SAMPLES = 180; // raios extras, espaçados igualmente, pra a borda do alcance ficar arredondada
// Acima desta quantidade de tokens com visão simultânea na cena, o número
// de raios por token começa a cair (até o piso FOG_MIN_CIRCLE_SAMPLES) —
// o custo do cálculo de visibilidade escala com raios × paredes × tokens,
// então numa cena cheia de criaturas isso evita que o recálculo (rodando
// a cada frame de arrasto) fique pesado. Com poucos tokens, continua
// usando a amostragem cheia — a borda do alcance não perde suavidade.
const FOG_MANY_TOKENS_THRESHOLD = 6;
const FOG_MIN_CIRCLE_SAMPLES = 90;
function adaptiveFogSamples(visionTokenCount) {
  if (visionTokenCount <= FOG_MANY_TOKENS_THRESHOLD) return FOG_CIRCLE_SAMPLES;
  // Cai linearmente até o piso conforme mais tokens se somam (12+ já usa o piso).
  const extra = visionTokenCount - FOG_MANY_TOKENS_THRESHOLD;
  const t = Math.min(1, extra / 6);
  return Math.round(FOG_CIRCLE_SAMPLES - (FOG_CIRCLE_SAMPLES - FOG_MIN_CIRCLE_SAMPLES) * t);
}
const FOG_EDGE_SOFTNESS = 0.82; // fração do raio a partir de onde a visão começa a esmaecer até o alcance máximo (1 = sem suavização)
const DEG2RAD = Math.PI / 180;
let visionRecomputeQueued = false;
let pendingExploredCells = {};
let exploredPersistTimer = null;
// Estado do frame anterior de cada token com visão (posição/alcance/cone
// em px "naturais" + o polígono já calculado) — permite reaproveitar o
// polígono de um token que não se mexeu desde o último recálculo, em vez
// de recalcular o shadowcasting dele de novo a cada frame de arrasto de
// OUTRO token. Ver dirty-rect em recomputeAndRenderVision.
let lastVisionTokenState = {};
// Quando true, o próximo recálculo repinta o canvas inteiro e recalcula o
// polígono de TODOS os tokens (em vez de só da região que mudou) — usado
// sempre que algo além de "um token se moveu" pode ter mudado (paredes,
// portas, memória de exploração sincronizada em bloco, lista de tokens,
// tamanho do canvas). É o caminho seguro/completo; o caminho rápido
// (dirty-rect) só roda quando exatamente os tokens que se moveram mudaram
// e nada mais.
let visionFullRedrawNeeded = true;
// Polígonos de visão *atuais* (não a memória) de cada token com visão —
// usados só pra decidir quais NPCs ficam visíveis agora. Ao contrário da
// memória de exploração (que revela o terreno já visto), a posição de uma
// criatura escondida na névoa nunca deve "vazar" pra quem não está vendo
// ela neste exato momento.
let currentVisionPolygons = [];

// Acima desta dimensão (px "naturais", o maior lado do mapa), a névoa é
// desenhada num canvas com resolução reduzida e esticada por CSS até o
// tamanho real do mapa — o resultado é visualmente idêntico (a névoa já é
// uma camada suave, com bordas em gradiente) mas o custo de cada
// clearRect/fillRect/gradiente cai com o quadrado da escala, o que evita
// que mapas grandes fiquem lentos a cada recálculo (a cada frame de
// arrasto de token, por exemplo).
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

// Devolve todos os segmentos de parede (já em px "naturais" do mapa,
// mesmo espaço de baseMapW/baseMapH), prontos pro cálculo de visibilidade.
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

// Cache dos segmentos de colisão (paredes + portas fechadas): antes, esses
// arrays eram reconstruídos do zero a cada recálculo de visão (ou seja, a
// cada frame durante o arrasto de um token) — com muitas paredes numa cena
// grande isso pesava sem necessidade, já que paredes/portas só mudam
// quando o Mestre desenha/apaga algo ou abre/fecha uma porta. Agora o
// resultado fica em cache e só é reconstruído quando invalidateCollisionSegmentsCache()
// é chamada (nos listeners de paredes/portas e na troca de cena).
let cachedCollisionSegments = null;
// Índice espacial (grade uniforme) dos mesmos segmentos, construído junto
// com o cache acima — em cenas com muitas paredes espalhadas pelo mapa,
// isso evita que segmentsNearCircle precise varrer TODOS os segmentos pra
// cada token a cada frame: só olha os "baldes" da grade que cruzam o
// quadrado do alcance do token. Com poucas paredes o ganho é pequeno (a
// grade vira 1-2 baldes), mas não piora nada nesse caso.
let cachedCollisionGrid = null;
const WALL_GRID_CELL = 320; // px "naturais" por balde da grade — sem relação com a grade visual do mapa
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

// Cache do elemento <g> (ícone 🚪) de cada porta, por id — mesma ideia do
// tokenElCache: evita um svg.querySelector a cada porta a cada frame de
// recálculo de visão (updateDoorVisibility roda em todo recompute).
// Mantido em dia por renderDoors, que é quem cria/remove esses elementos.
let doorMarkElCache = {};

// Paredes + portas fechadas — tudo que bloqueia a visão agora mesmo (uma
// porta aberta simplesmente não entra na lista, como se não existisse).
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

// Constrói (ou devolve do cache) o índice espacial dos segmentos atuais —
// sempre em sincronia com collisionSegmentsForVision, já que os dois só
// são invalidados juntos.
function collisionSegmentsGrid() {
  if (!cachedCollisionGrid) cachedCollisionGrid = buildSegmentsGrid(collisionSegmentsForVision());
  return cachedCollisionGrid;
}

// Devolve só os segmentos cujo retângulo envolvente cruza o quadrado do
// alcance de um token — evita testar paredes/portas distantes a cada um
// dos ~180 raios, o que pesa muito em mapas grandes com muitos obstáculos.
// Consulta apenas os baldes da grade espacial que o quadrado do alcance
// cobre, em vez de varrer a lista inteira de segmentos.
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

// Interseção de um raio (origem px,py, direção unitária dx,dy) com um
// segmento (ax,ay)-(bx,by). Devolve a distância "t" ao longo do raio até o
// ponto de interseção, ou null se não houver (paralelos ou fora do
// segmento/atrás da origem).
function rayHitsSegment(px, py, dx, dy, ax, ay, bx, by) {
  const sdx = bx - ax, sdy = by - ay;
  const denom = dx * sdy - dy * sdx;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((ax - px) * sdy - (ay - py) * sdx) / denom;
  const u = ((ax - px) * dy - (ay - py) * dx) / denom;
  if (t >= 0 && u >= 0 && u <= 1) return t;
  return null;
}

// -------------------------------------------------- COLISÃO DE MOVIMENTO --
// Paredes e portas fechadas também bloqueiam o próprio movimento dos
// tokens, não só a visão — usa os mesmos segmentos já calculados pra névoa
// (collisionSegmentsForVision engloba paredes + portas fechadas; uma porta
// aberta simplesmente não entra na lista, então tokens passam livremente).
// Teste clássico de interseção de dois segmentos finitos (não de reta
// infinita, como rayHitsSegment acima).
function segmentsIntersect(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y) {
  const s1x = p1x - p0x, s1y = p1y - p0y;
  const s2x = p3x - p2x, s2y = p3y - p2y;
  const denom = (-s2x * s1y + s1x * s2y);
  if (Math.abs(denom) < 1e-9) return false; // paralelos (ou o mesmo segmento) — trata como sem colisão
  const s = (-s1y * (p0x - p2x) + s1x * (p0y - p2y)) / denom;
  const t = (s2x * (p0y - p2y) - s2y * (p0x - p2x)) / denom;
  return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}

// Recebe origem/destino em coordenadas normalizadas (0..1, mesmo espaço de
// token.x/token.y) e devolve true se o trajeto reto entre os dois pontos
// cruza alguma parede ou porta fechada — usado durante o arrasto de um
// token pra travar o movimento bem na parede, em vez de deixar atravessar.
function movementBlockedByWalls(fromXNorm, fromYNorm, toXNorm, toYNorm) {
  const x1 = fromXNorm * baseMapW, y1 = fromYNorm * baseMapH;
  const x2 = toXNorm * baseMapW, y2 = toYNorm * baseMapH;
  const grid = collisionSegmentsGrid();
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
  const radius = Math.hypot(x2 - x1, y2 - y1) / 2 + 8; // pequena margem
  const segs = segmentsNearCircle(grid, cx, cy, radius);
  for (const s of segs) {
    if (segmentsIntersect(x1, y1, x2, y2, s.x1, s.y1, s.x2, s.y2)) return true;
  }
  return false;
}

// Polígono de visibilidade (estilo "2D visibility"/shadowcasting) a partir
// do centro (cx,cy), limitado ao alcance "radius" (px) e bloqueado pelos
// segmentos de parede/porta — cantos projetam sombra "dura", e onde não há
// obstrução nenhuma a borda vira o próprio círculo do alcance (graças às
// amostras uniformes somadas aos ângulos exatos dos cantos das paredes).
//
// coneCenterAngle/coneHalfAngle (radianos, opcionais): quando os dois são
// passados, a visão vira um cone/leque nessa direção em vez de 360° —
// usado por tokens com visionMode === 'cone' (ver recomputeAndRenderVision).
// Os ângulos das amostras e dos cantos são calculados *relativos* ao centro
// do cone (em vez de absolutos) só pra não quebrar perto de ±180°, quando
// um token está virado pra "trás" (ex.: olhando para a esquerda).
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
      // Normaliza cada ângulo pra "quanto ele se desvia do centro do cone",
      // em vez do ângulo absoluto — e recorta pras bordas do leque, senão
      // um canto de parede fora do cone criaria um raio na direção errada.
      a1 = Math.max(-coneHalfAngle, Math.min(coneHalfAngle, Math.atan2(Math.sin(a1 - coneCenterAngle), Math.cos(a1 - coneCenterAngle))));
      a2 = Math.max(-coneHalfAngle, Math.min(coneHalfAngle, Math.atan2(Math.sin(a2 - coneCenterAngle), Math.cos(a2 - coneCenterAngle))));
    } else {
      // BUG DA VISÃO 360°: atan2 devolve o ângulo no intervalo (-π, π], mas
      // as amostras do círculo abaixo usam [0, 2π). Misturar os dois
      // intervalos e ordenar tudo junto (angles.sort) fazia qualquer canto
      // de parede "atrás à esquerda" do token (ângulo negativo) entrar fora
      // de ordem na lista — o polígono de visão saía com um corte/pico
      // espúrio cruzando o círculo inteiro perto de ±180°. Normalizando os
      // dois cantos pro mesmo intervalo [0, 2π) das amostras, a ordenação
      // fica consistente e o polígono sai correto em qualquer direção.
      a1 = ((a1 % TWO_PI) + TWO_PI) % TWO_PI;
      a2 = ((a2 % TWO_PI) + TWO_PI) % TWO_PI;
    }
    angles.push(a1 - EPS, a1, a1 + EPS, a2 - EPS, a2, a2 + EPS);
  });
  angles.sort((a, b) => a - b);

  const pts = [];
  if (isCone) pts.push({ x: cx, y: cy }); // ápice do leque — fecha a forma de volta no próprio token
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

// Marca (em "out") as casas da grade cujo centro cai dentro do polígono de
// visão — só testa as casas dentro do quadrado que envolve o alcance, pra
// não varrer o mapa inteiro a cada token.
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

// Posição "visual atual" de um token — usa a posição de arrasto ao vivo
// (se houver) em vez da última posição confirmada no Firestore, pra a
// visão acompanhar o token suavemente enquanto ele ainda está sendo
// arrastado (tanto pelo próprio jogador quanto por outra pessoa vista via
// broadcastLiveTokenPosition).
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
  if (sizeChanged) { canvas.width = rw; canvas.height = rh; } // isso também limpa o canvas (fica transparente)
  // O canvas continua ocupando o mesmo espaço "natural" do mapa (o
  // navegador estica a bitmap de resolução menor até esse tamanho) — só a
  // resolução interna de desenho muda.
  canvas.style.width = baseMapW + 'px';
  canvas.style.height = baseMapH + 'px';
  const ctx = canvas.getContext('2d');
  // Daqui pra baixo, todo o desenho continua em coordenadas "naturais"
  // (0..baseMapW, 0..baseMapH) como sempre — este transform é quem projeta
  // isso na resolução (possivelmente reduzida) do canvas.
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  const cellPx = boardCellPx || DEFAULT_CELL_PX;
  const segmentsGrid = collisionSegmentsGrid();
  const isMasterView = isTableOwner();
  // Visão privada por dono de token: cada jogador só descobre o mapa
  // através dos próprios tokens — o token de outro jogador (ou um NPC do
  // Mestre) não revela nada pra quem não é dono dele. O Mestre continua
  // vendo através de qualquer token, como sempre (é assim que ele vê o
  // mapa inteiro, mesmo sem token nenhum próprio).
  const visionTokens = Object.values(liveTokens).filter(t =>
    isTokenInActiveScene(t) && tokenHasVision(t) && (isMasterView || t.ownerId === curUser.uid));
  const samples = adaptiveFogSamples(visionTokens.length);
  // Escuridão real (ver toggleSceneDarkness): fora daqui, cada token vale o
  // próprio visionRadius como sempre ("luz ambiente"). Com a cena marcada
  // como escura, o alcance normal do token só passa a valer dentro de uma
  // fonte de luz (ver bloco de luzes abaixo) — fora da luz, o token só
  // enxerga o piso DARK_SELF_RADIUS_CELLS mais a própria infravisão
  // (t.darkRadius, editável no painel do token).
  const activeScene = typeof getActiveScene === 'function' ? getActiveScene() : null;
  const sceneIsDark = !!(activeScene && activeScene.darkness);

  // forceAll: quando true, TODO token tem o polígono recalculado e a
  // região "suja" vira o mapa inteiro (o canvas pode estar em branco por
  // ter acabado de mudar de tamanho, ou paredes/portas/memória podem ter
  // mudado em qualquer lugar do mapa) — é o caminho seguro de sempre.
  // Quando false, só os tokens que de fato se moveram desde o frame
  // anterior são recalculados, e só a região que eles tocam (posição
  // antiga + nova) é repintada; os demais tokens reaproveitam o polígono
  // já calculado no frame anterior. É esse caminho rápido que faz o
  // arrasto contínuo de um token não pesar sobre os outros que ficaram
  // parados.
  const forceAll = visionFullRedrawNeeded || sizeChanged;

  const EPS_POS = 0.02; // px "naturais" — abaixo disso não vale a pena repintar
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
      ? Math.max(DARK_SELF_RADIUS_CELLS, t.darkRadius || 0) // sem luz por perto: só a infravisão (ou o mínimo de sempre)
      : (t.visionRadius || DEFAULT_VISION_RADIUS_CELLS);     // luz ambiente normal: alcance de visão de sempre
    const radius = radiusCells * cellPx;
    const isCone = t.visionMode === 'cone';
    const rot = liveDragRotations[t.id] != null ? liveDragRotations[t.id] : (t.rot || 0);
    const coneCenter = isCone ? (rot - 90) * DEG2RAD : null; // rot=0 aponta "pra cima" (mesma convenção da alça de girar)
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
  // Tokens que sumiram da visão desde o frame anterior (removidos, visão
  // desligada, saíram da cena) também sujam a região onde estavam.
  Object.keys(lastVisionTokenState).forEach(id => {
    if (nextState[id]) return;
    const prev = lastVisionTokenState[id];
    growDirty(prev.cx, prev.cy, prev.radius);
  });

  if (!forceAll && changed.size === 0 && dMinX === Infinity) {
    // Nada mudou de fato desde o último frame — não há nada pra repintar.
    // (currentVisionPolygons e exploredCells já refletem o estado atual.)
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

    // Base: tudo "não explorado" (opaco), só dentro da região suja.
    ctx.clearRect(dx, dy, dw, dh);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = FOG_UNSEEN_COLOR;
    ctx.fillRect(dx, dy, dw, dh);

    // Casas já exploradas (memória) dentro da região suja: escurece um
    // pouco menos que o "nunca visto". Só varre as casas da grade que
    // caem no retângulo, em vez de todas as casas exploradas do mapa.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0,0,0,${FOG_EXPLORED_DIM_ALPHA})`;
    const colMin = Math.max(0, Math.floor(dx / cellPx)), colMax = Math.ceil(dxMax / cellPx);
    const rowMin = Math.max(0, Math.floor(dy / cellPx)), rowMax = Math.ceil(dyMax / cellPx);
    for (let r = rowMin; r <= rowMax; r++) {
      for (let c = colMin; c <= colMax; c++) {
        const key = c + ',' + r;
        if (!exploredCells[key]) continue;
        ctx.fillRect(c * cellPx - 0.5, r * cellPx - 0.5, cellPx + 1, cellPx + 1); // +1px de folga evita frestas entre casas
      }
    }

    // Fontes de luz (🔥): revelam sua área sempre, independente de onde os
    // tokens estão — calculadas com o mesmo shadowcasting da visão de
    // token, só que a partir da posição da luz. Vêm ANTES dos tokens
    // porque, na "escuridão real", é a luz quem dá o alcance normal de
    // volta pra quem está dentro dela (ver rótulo currentVisionPolygons
    // logo abaixo, que começa já com as luzes dentro).
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
      collectExploredCells(poly, lx, ly, lr, newCells); // luz também vira memória de exploração permanente
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

    // Tokens com visão: cada polígono de visibilidade limpa a névoa
    // (visível agora) e alimenta a memória de exploração. Só os tokens
    // marcados como "mudaram" têm o shadowcasting recalculado; os outros
    // reaproveitam o polígono do frame anterior (ele continua correto,
    // já que nada que o afeta mudou).
    currentVisionPolygons = currentLightPolygons.slice();
    ctx.globalCompositeOperation = 'destination-out';
    visionTokens.forEach(t => {
      const st = nextState[t.id];
      const isChanged = changed.has(t.id);
      if (!isChanged) {
        // Token parado cujo alcance nem toca a região suja: o desenho dele
        // já está correto no canvas de frames anteriores — só reaproveita
        // o polígono (pra NPCs/portas continuarem cientes dele) sem gastar
        // gradiente/fill à toa.
        const touches = st.cx + st.radius >= dx && st.cx - st.radius <= dxMax && st.cy + st.radius >= dy && st.cy - st.radius <= dyMax;
        if (!touches) {
          if (st.poly && st.poly.length >= (st.isCone ? 2 : 3)) currentVisionPolygons.push(st.poly);
          return;
        }
      }
      let poly = st.poly;
      if (isChanged) {
        const localSegments = segmentsNearCircle(segmentsGrid, st.cx, st.cy, st.radius); // só os obstáculos perto o suficiente pra importar
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
      // Contorno bem sutil do cone, só pro Mestre — ajuda a lembrar pra
      // onde cada token está "olhando" sem precisar abrir a ficha dele.
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
    ctx.restore(); // remove o recorte (clip) da região suja

    let hasNew = false;
    Object.keys(newCells).forEach(k => { if (!exploredCells[k]) { exploredCells[k] = true; hasNew = true; } });
    if (hasNew) scheduleExploredPersist(newCells);
  }

  // O Mestre vê o mapa inteiro sempre — a névoa fica só como referência
  // bem clara, pra saber o que os jogadores ainda não viram sem perder a
  // visão geral do tabuleiro.
  canvas.style.opacity = isTableOwner() ? '0.4' : '1';

  applyTokenFogVisibility();
  updateDoorVisibility();
  updateLightVisibility();

  lastVisionTokenState = nextState;
  visionFullRedrawNeeded = false;
}

// Um ponto (em px "naturais" do mapa) está visível *agora* se cai dentro
// de algum polígono de visão atual — ao contrário da memória de
// exploração, isso nunca fica "salvo": some assim que nenhum token com
// visão mais enxergar aquele ponto.
function isPointCurrentlyVisible(px, py) {
  return currentVisionPolygons.some(poly => pointInPolygon(px, py, poly));
}

// O ícone de uma porta (🚪) só aparece pros jogadores se a área ao redor
// dela já foi vista (agora ou na memória de exploração) — senão a própria
// existência da porta seria um spoiler vazando através da névoa ainda não
// revelada. O Mestre sempre vê todas, prontas para conferir/depurar a cena.
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

// Tokens de fora do seu alcance de visão não devem aparecer — nem os NPCs
// escondidos na névoa, nem o personagem de outro jogador que tenha saído do
// seu campo de visão (parede no meio, longe demais, etc.). O único token que
// fica sempre visível pra você é o seu próprio — não faria sentido perder de
// vista o próprio personagem. O Mestre continua vendo todo mundo, sempre.
// Isso é reaplicado a cada recálculo de visão (token se move, parede muda,
// etc.) — ver applyTokenFogVisibility() rodando ao fim de
// recomputeAndRenderVision().
function applyTokenFogVisibility() {
  const master = isTableOwner();
  Object.values(liveTokens).forEach(t => {
    if (t.ownerId === curUser.uid) return; // o próprio token nunca fica escondido de você mesmo
    const el = tokenElCache[t.id];
    const auraEl = tokenAuraElCache[t.id];
    if (!el && !auraEl) return;
    const p = tokenVisionPos(t);
    const visible = master || isPointCurrentlyVisible(p.x * baseMapW, p.y * baseMapH);
    if (el) el.style.display = visible ? '' : 'none';
    if (auraEl) auraEl.style.display = visible ? '' : 'none';
  });
}

// Vis\u00e3o privada por dono de token: cada jogador só descobre o mapa
// através dos próprios tokens (ver filtro de visionTokens em
// recomputeAndRenderVision) — então a memória de exploração de cada
// jogador também precisa ficar isolada, senão a descoberta de um jogador
// vazaria pra tela dos outros por essa via. O Mestre continua com o
// documento "base" de sempre (tables/{id}/visionMemory/{sceneId}), que
// funciona como o histórico agregado de tudo que qualquer token já
// revelou — só como referência pro Mestre, que já enxerga o mapa inteiro
// sempre, com ou sem isso. Cada jogador usa um subdocumento só dele,
// debaixo do mesmo documento base.
function visionMemoryDocRef(sceneId) {
  const base = db.collection('tables').doc(curTable.id).collection('visionMemory').doc(sceneId);
  return isTableOwner() ? base : base.collection('players').doc(curUser.uid);
}

// Grava as casas recém-reveladas na memória de visão (ver
// visionMemoryDocRef acima pra saber em qual documento cada um grava),
// agrupando várias descobertas numa única escrita (throttle) pra não
// sobrecarregar o Firestore durante um arrasto ou quando várias casas
// somem da névoa de uma vez.
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
      visionFullRedrawNeeded = true; // memória sincronizada em bloco: qualquer casa do mapa pode ter mudado
      scheduleVisionRecompute();
    }, err => console.error('Erro ao sincronizar memória de visão:', err));
}

// Reseta a memória de exploração de TODO MUNDO nesta cena — a do Mestre
// (documento agregado de sempre) e a privada de cada jogador. Usada tanto
// pelo botão "🌫 Resetar memória" quanto pela geração de mapa procedural
// (regenerateWallsFromGrid), já que um layout novo torna a memória antiga
// de todo mundo sem sentido.
async function clearSceneExplorationMemory(sceneId) {
  const base = db.collection('tables').doc(curTable.id).collection('visionMemory').doc(sceneId);
  const playersSnap = await base.collection('players').get();
  const batch = db.batch();
  batch.set(base, { cells: {} });
  playersSnap.forEach(d => batch.delete(d.ref));
  await batch.commit();
}

// Botão do Mestre "🌫 Resetar memória": limpa tudo que já foi explorado
// nesta cena, pra todo mundo — a névoa volta a cobrir o mapa inteiro de
// novo, mas as paredes/portas/luzes continuam intactas (só zera a
// memória, não mexe em mais nada). Útil pra rejogar uma área às escuras
// de novo (ex.: os jogadores voltam a uma masmorra tempos depois, ou o
// Mestre quer reforçar a tensão de reexplorar um lugar já visto).
async function resetExplorationMemory() {
  if (!curTable.activeSceneId || !isTableOwner()) return;
  if (!confirm('Resetar a memória de exploração desta cena pra todo mundo (Mestre e jogadores)? A névoa volta a cobrir tudo que já foi visto até agora — as paredes, portas e luzes continuam intactas.')) return;
  try {
    await clearSceneExplorationMemory(curTable.activeSceneId);
  } catch (err) { alert('Erro ao resetar memória de exploração: ' + err.message); }
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
    if (selectedTokenId) {
      if (inspectedTokenId === selectedTokenId) { inspectedTokenId = null; if (typeof renderTokenInspectPanel === 'function') renderTokenInspectPanel(); }
      selectedTokenId = null;
      updateSelectionHandles();
      renderTokenListPanel();
    }
    // Clicar numa área vazia do mapa (fora de qualquer token) limpa a
    // seleção múltipla em andamento, do mesmo jeito que já limpa a seleção
    // simples (alças) acima.
    if (multiSelectedIds.size) { multiSelectedIds.clear(); renderAllTokens(); renderTokenListPanel(); }

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
  attachWallHandlers(wrap);
  attachRoomHandlers(wrap);
  attachDoorHandlers(wrap);
  attachLightHandlers(wrap);
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


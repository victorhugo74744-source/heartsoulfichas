// ============================================================
// Inicialização final: wiring de eventos ao carregar a página.
// Parte de mesa.js (dividido para facilitar manutenção).
// Depende de variáveis/funções globais definidas em mesa-board.js
// — carregar SEMPRE depois dele, na ordem dos <script> do mesa.html.
// ============================================================

// ------------------------------------------------------------------ INIT --
guardPage(null, (user, profile) => {
  curUser = user;
  curProfile = profile;
  renderTopbar(profile);
  renderCreateTableBox();
  loadTables();

  document.getElementById('backToLobbyBtn').addEventListener('click', closeTable);

  // Atalhos de teclado do tabuleiro (V/R/P/1/2/3/D/F/Esc/Ctrl+Z) — ver
  // handleBoardKeydown em mesa-tools.js. Fica no document (não só no
  // boardWrap) porque o foco pode estar em qualquer lugar da página
  // quando o jogador aperta a tecla; a função mesma decide se ignora.
  document.addEventListener('keydown', handleBoardKeydown);

  // Zoom / tela cheia
  document.getElementById('zoomInBtn').addEventListener('click', () => setBoardZoom(boardZoom + ZOOM_STEP));
  document.getElementById('zoomOutBtn').addEventListener('click', () => setBoardZoom(boardZoom - ZOOM_STEP));
  document.getElementById('zoomResetBtn').addEventListener('click', () => setBoardZoom(1));
  document.getElementById('zoomFitBtn').addEventListener('click', fitBoardToScreen);
  document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreenBoard);

  // Ver ficha (modal)
  document.getElementById('sheetModalClose').addEventListener('click', closeSheetModal);
  document.getElementById('sheetModalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'sheetModalOverlay') closeSheetModal();
  });

  // Dados na mesa
  renderTableDiceQuickRow();
  renderTableDiceLog();
  initSidePanelAccordion();
  document.getElementById('diceRollBtn').addEventListener('click', doTableRoll);
  document.getElementById('diceCmdInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); doTableRoll(); }
  });
  document.getElementById('diceTargetSelect').addEventListener('change', updateDiceTargetUiState);
  document.getElementById('diceBodyPartChecks').addEventListener('change', updateDiceTargetUiState);

  // Chat da mesa (botão flutuante + popup: geral/privado/sussurro)
  document.getElementById('chatFabBtn').addEventListener('click', toggleChatPopup);
  document.getElementById('chatMinBtn').addEventListener('click', minimizeChatPopup);
  document.getElementById('chatCloseBtn').addEventListener('click', closeChatPopup);
  document.querySelectorAll('#chatTabs .chat-tab').forEach(b => {
    b.addEventListener('click', () => switchChatChannel(b.dataset.chatType));
  });
  document.getElementById('chatTargetSelect').addEventListener('change', (e) => {
    chatTargetUid = e.target.value || null;
    renderChatTargetOptions();
    renderChatMessages();
    updateChatInputState();
  });
  // Clicar no nome de um par observado (Mestre em "ver todos") entra direto
  // na conversa com aquela pessoa, em vez de precisar usar o seletor.
  document.getElementById('chatMessages').addEventListener('click', (e) => {
    const el = e.target.closest('[data-jump-uid]');
    if (!el) return;
    chatTargetUid = el.dataset.jumpUid;
    document.getElementById('chatTargetSelect').value = chatTargetUid;
    renderChatTargetOptions();
    renderChatMessages();
    updateChatInputState();
    document.getElementById('chatInput').focus();
  });
  document.getElementById('chatSendBtn').addEventListener('click', sendChatMessage);
  document.getElementById('chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  });
});

// Ajusta o campo de digitação conforme o modo atual: desabilitado (com uma
// dica no placeholder) enquanto o Mestre só está "vendo todos" os
// sussurros sem ter escolhido alguém pra falar diretamente.
function updateChatInputState() {
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');
  if (!input || !sendBtn) return;
  const masterWatchingAll = chatChannel === 'whisper' && isTableOwner() && !chatTargetUid;
  input.disabled = masterWatchingAll;
  sendBtn.disabled = masterWatchingAll;
  input.placeholder = masterWatchingAll
    ? 'Escolha alguém acima para sussurrar…'
    : (chatChannel === 'whisper' ? 'Escreva um sussurro…' : 'Escreva uma mensagem…');
}

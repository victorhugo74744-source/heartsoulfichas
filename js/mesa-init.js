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

  // Girar token seguindo o cursor (modo opcional, ligado por token na lista
  // de fichas — ver toggleTokenCursorFollow em mesa-tokens.js).
  initCursorFollowTracking();

  // Ver ficha (modal)
  document.getElementById('sheetModalClose').addEventListener('click', closeSheetModal);
  document.getElementById('sheetModalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'sheetModalOverlay') closeSheetModal();
  });

  // Dados na mesa
  renderTableDiceQuickRow();
  renderTableDiceLog();
  initSidePanelAccordion();
  initSidebarToggles();
  document.getElementById('diceRollBtn').addEventListener('click', doTableRoll);
  document.getElementById('diceCmdInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); doTableRoll(); }
  });
  document.getElementById('diceTargetSelect').addEventListener('change', updateDiceTargetUiState);
  document.getElementById('diceBodyPartChecks').addEventListener('change', updateDiceTargetUiState);

  // Busca e ordenação da lista "Fichas na mesa" — a busca tem um pequeno
  // atraso (debounce) pra não repintar a lista a cada tecla digitada.
  const tlSearchInput = document.getElementById('tokenListSearchInput');
  if (tlSearchInput) tlSearchInput.addEventListener('input', () => {
    clearTimeout(tlSearchDebounceTimer);
    tlSearchDebounceTimer = setTimeout(() => {
      tokenListSearch = tlSearchInput.value;
      renderTokenListPanel();
    }, 150);
  });
  const tlSortSelect = document.getElementById('tokenListSortSelect');
  if (tlSortSelect) tlSortSelect.addEventListener('change', () => {
    tokenListSort = tlSortSelect.value;
    renderTokenListPanel();
  });

  // Chat da mesa (botão flutuante + popup: geral/privado/sussurro)
  document.getElementById('chatFabBtn').addEventListener('click', toggleChatPopup);
  document.getElementById('chatMinBtn').addEventListener('click', minimizeChatPopup);
  document.getElementById('chatCloseBtn').addEventListener('click', closeChatPopup);
  document.querySelectorAll('#chatTabs .chat-tab').forEach(b => {
    b.addEventListener('click', () => switchChatChannel(b.dataset.chatType));
  });
  document.getElementById('chatTargetSelect').addEventListener('change', (e) => {
    chatTargetUid = e.target.value || null;
    clearMyChatTyping(); // trocou de conversa: o "digitando" antigo não faz mais sentido aqui
    renderChatTargetOptions();
    renderChatMessages();
    updateChatInputState();
    renderChatTypingIndicator();
  });
  // Clicar no nome de um par observado (Mestre em "ver todos") entra direto
  // na conversa com aquela pessoa, em vez de precisar usar o seletor. Os
  // outros data-* abaixo são os botões de editar/apagar/salvar/cancelar de
  // cada mensagem (ver renderChatMessages em mesa-chat.js) — tudo por
  // delegação de evento, já que o conteúdo é reconstruído a cada snapshot.
  document.getElementById('chatMessages').addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit-id]');
    if (editBtn) { startEditChatMessage(editBtn.dataset.editId); return; }
    const delBtn = e.target.closest('[data-delete-id]');
    if (delBtn) { deleteChatMessage(delBtn.dataset.deleteId); return; }
    const saveBtn = e.target.closest('[data-save-id]');
    if (saveBtn) { saveEditChatMessage(saveBtn.dataset.saveId); return; }
    if (e.target.closest('.chat-edit-cancel')) { cancelEditChatMessage(); return; }
    const el = e.target.closest('[data-jump-uid]');
    if (!el) return;
    chatTargetUid = el.dataset.jumpUid;
    document.getElementById('chatTargetSelect').value = chatTargetUid;
    renderChatTargetOptions();
    renderChatMessages();
    updateChatInputState();
    document.getElementById('chatInput').focus();
  });
  // Enter/Esc dentro do campo de edição inline de uma mensagem (o campo é
  // recriado a cada render, então também por delegação).
  document.getElementById('chatMessages').addEventListener('keydown', (e) => {
    if (!e.target.classList || !e.target.classList.contains('chat-edit-input')) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      const row = e.target.closest('[data-msg-id]');
      if (row) saveEditChatMessage(row.dataset.msgId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditChatMessage();
    }
  });
  document.getElementById('chatSendBtn').addEventListener('click', sendChatMessage);
  document.getElementById('chatInput').addEventListener('keydown', (e) => {
    // Com o dropdown de menção "@Nome" aberto, as setas/Enter/Esc navegam
    // nele em vez de mover o cursor/mandar a mensagem (ver
    // handleChatInputForMention em mesa-chat.js).
    if (chatMentionActive) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); chatMentionMoveSelection(e.key === 'ArrowDown' ? 1 : -1); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); chatMentionConfirmSelection(); return; }
      if (e.key === 'Escape') { e.preventDefault(); closeChatMentionMenu(); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  });
  document.getElementById('chatInput').addEventListener('input', () => {
    markChatTyping();
    handleChatInputForMention();
  });
  // Sem o pequeno atraso aqui, o blur do input (foco saindo pro botão)
  // fecharia o menu antes do clique nele terminar de registrar.
  document.getElementById('chatInput').addEventListener('blur', () => {
    setTimeout(() => { closeChatMentionMenu(); closeChatEmojiMenu(); }, 150);
  });
  document.getElementById('chatEmojiBtn').addEventListener('click', toggleChatEmojiMenu);
  // mousedown (não click) + preventDefault: dispara ANTES do blur do
  // input, então o texto some do campo antes que o clique no emoji/menção
  // consiga registrar — sem isso, às vezes o clique "erra" a mão.
  document.getElementById('chatEmojiMenu').addEventListener('mousedown', (e) => {
    const btn = e.target.closest('[data-emoji]');
    if (btn) { e.preventDefault(); insertChatEmoji(btn.dataset.emoji); }
  });
  document.getElementById('chatMentionMenu').addEventListener('mousedown', (e) => {
    const btn = e.target.closest('[data-mention-name]');
    if (btn) { e.preventDefault(); selectChatMention(btn.dataset.mentionName); }
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

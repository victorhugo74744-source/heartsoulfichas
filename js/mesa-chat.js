// ============================================================
// Chat da mesa: geral e sussurro (whisper), popup flutuante, envio/render de mensagens.
// Parte de mesa.js (dividido para facilitar manutenção).
// Depende de variáveis/funções globais definidas em mesa-board.js
// — carregar SEMPRE depois dele, na ordem dos <script> do mesa.html.
// ============================================================

// ------------------------------------------------------------------ CHAT --
// 2 canais na mesma coleção tables/{id}/chatMessages:
//  - general: qualquer membro da mesa lê/escreve.
//  - whisper: "sussurro entre personagens" — só os dois envolvidos leem, e
//    o Mestre desta mesa sempre consegue acompanhar TODAS as conversas
//    (ver isTableMaster em firestore.rules) — é o modo "👁️ Ver todos".
//    Além de acompanhar, o Mestre agora também pode ESCOLHER um jogador no
//    mesmo seletor e sussurrar diretamente com ele (pra dar uma dica
//    privada, falar como um NPC à parte, etc.) — vira uma conversa normal
//    entre o Mestre e aquele jogador, que os dois leem (e o Mestre, por ser
//    o Mestre da mesa, continua enxergando todas as outras também). A regra
//    de escrita em firestore.rules já sempre permitiu isso (qualquer membro
//    da mesa pode criar uma mensagem "whisper" contanto que não seja pra si
//    mesmo); só o cliente bloqueava o Mestre antes.
// O canal "Privado" (DM) que existia aqui antes foi removido do projeto
// (junto com js/dm.js e as coleções userDirectory/dmThreads do Firestore) —
// a mesa só tem os dois canais acima agora: Geral e Sussurro.
// Este projeto não tem um backend Node/Socket.IO próprio (é 100% Firebase),
// então firestore.rules faz o papel de "validação no servidor" citado no
// requisito — tanto na escrita (não dá pra fingir ser outro remetente) como
// na leitura (uma mensagem que não é sua nem chega a este cliente).

function chatRoster() {
  // Quem dá pra chamar em Privado/Sussurro: donos dos tokens presentes na
  // mesa (jogadores "transformados" em ficha), sem contar você mesmo.
  const seen = new Set();
  const rows = [];
  Object.values(liveTokens).forEach(t => {
    if (!t.ownerId || t.ownerId === curUser.uid || seen.has(t.ownerId)) return;
    seen.add(t.ownerId);
    rows.push({ uid: t.ownerId, name: t.name || 'Jogador' });
  });
  return rows;
}

function resetChatState() {
  chatChannel = 'general';
  chatTargetUid = null;
  chatUnread = { general: 0, whisper: 0 };
  chatSnapshotPrimed = false;
  chatPopupOpen = false;
  chatMinimized = false;
  const popup = document.getElementById('chatPopup');
  if (popup) { popup.classList.add('hidden'); popup.classList.remove('minimized'); }
  document.querySelectorAll('#chatTabs .chat-tab').forEach(b => b.classList.toggle('active', b.dataset.chatType === 'general'));
  const targetRow = document.getElementById('chatTargetRow');
  if (targetRow) targetRow.classList.add('hidden');
  const errEl = document.getElementById('chatErr');
  if (errEl) errEl.classList.add('hidden');
  const hintEl = document.getElementById('chatHint');
  if (hintEl) hintEl.classList.add('hidden');
  const input = document.getElementById('chatInput');
  if (input) { input.disabled = false; input.placeholder = 'Escreva uma mensagem…'; }
  const sendBtn = document.getElementById('chatSendBtn');
  if (sendBtn) sendBtn.disabled = false;
  updateChatFabBadge();
}

function showChatFab() {
  const fab = document.getElementById('chatFabBtn');
  if (fab) fab.classList.remove('hidden');
}

function hideChatUi() {
  const fab = document.getElementById('chatFabBtn');
  const popup = document.getElementById('chatPopup');
  if (fab) fab.classList.add('hidden');
  if (popup) { popup.classList.add('hidden'); popup.classList.remove('minimized'); }
  chatPopupOpen = false;
  chatMinimized = false;
}

function updateChatFabBadge() {
  const badge = document.getElementById('chatFabBadge');
  const total = chatUnread.general + chatUnread.whisper;
  if (badge) {
    if (total > 0) {
      badge.textContent = total > 9 ? '9+' : String(total);
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
  const dotGeneral = document.getElementById('chatDotGeneral');
  const dotWhisper = document.getElementById('chatDotWhisper');
  if (dotGeneral) dotGeneral.classList.toggle('hidden', chatUnread.general === 0);
  if (dotWhisper) dotWhisper.classList.toggle('hidden', chatUnread.whisper === 0);
}

function listenChat() {
  chatMessagesCache = [];
  chatSnapshotPrimed = false;

  const isMaster = isTableOwner();
  const base = db.collection('tables').doc(curTable.id).collection('chatMessages');
  const byId = new Map();     // id -> mensagem, junta o resultado das várias queries
  const primed = {};          // key -> já recebeu a 1ª snapshot (carga inicial) desta query
  const unsubs = [];

  // Cada query abaixo já vem restrita por "where" de um jeito que as regras
  // conseguem aprovar por inteiro (ver firestore.rules): "general" é aberto
  // a todo mundo; "whisper" só é liberado por completo pra quem é o Mestre
  // *desta* mesa, então jogador comum precisa de duas queries separadas
  // (o que ele mandou e o que ele recebeu) em vez de uma só com "OR".
  function attach(key, query) {
    primed[key] = false;
    const unsub = query.onSnapshot(snap => {
      const wasPrimed = chatSnapshotPrimed; // estado global antes desta snapshot

      snap.docChanges().forEach(change => {
        if (change.type === 'removed') { byId.delete(change.doc.id); return; }
        byId.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
        // Conta como "não lida" só o que chegou ao vivo depois da carga
        // inicial do histórico (de todas as queries), e só se a aba
        // correspondente não estiver realmente aberta e visível agora — se
        // o popup está aberto mas noutra aba, a mensagem que chega na outra
        // aba ainda conta como não lida nela.
        if (wasPrimed && change.type === 'added') {
          const m = change.doc.data();
          const isMine = m.fromUserId === curUser.uid;
          // Uma mensagem só conta como "não lida" numa aba se este cliente
          // realmente tem acesso a ela: geral é sempre visível; sussurro só
          // conta se o cliente for remetente/destinatário, ou o Mestre desta
          // mesa (que acompanha todos).
          const canSeeWhisper = m.type === 'whisper' &&
            (isMine || m.toUserId === curUser.uid || isTableOwner());
          const tabVisible = chatPopupOpen && !chatMinimized && chatChannel === m.type;
          if (!isMine && !tabVisible) {
            if (m.type === 'general') chatUnread.general++;
            else if (canSeeWhisper) chatUnread.whisper++;
          }
        }
      });

      primed[key] = true;
      if (!chatSnapshotPrimed && Object.values(primed).every(Boolean)) chatSnapshotPrimed = true;

      chatMessagesCache = Array.from(byId.values()).sort((a, b) =>
        (a.timestamp ? a.timestamp.toMillis() : 0) - (b.timestamp ? b.timestamp.toMillis() : 0));

      if (wasPrimed) updateChatFabBadge();
      renderChatMessages();
    }, err => console.error('Erro ao sincronizar chat da mesa:', err));
    unsubs.push(unsub);
  }

  attach('general', base.where('type', '==', 'general').orderBy('timestamp', 'asc').limitToLast(300));

  if (isMaster) {
    attach('whisperAll', base.where('type', '==', 'whisper').orderBy('timestamp', 'asc').limitToLast(300));
  } else {
    attach('whisperSent', base.where('type', '==', 'whisper').where('fromUserId', '==', curUser.uid)
      .orderBy('timestamp', 'asc').limitToLast(300));
    attach('whisperReceived', base.where('type', '==', 'whisper').where('toUserId', '==', curUser.uid)
      .orderBy('timestamp', 'asc').limitToLast(300));
  }

  chatUnsub = () => unsubs.forEach(u => u());
}

function toggleChatPopup() {
  const popup = document.getElementById('chatPopup');
  if (!popup) return;
  if (popup.classList.contains('hidden') || chatMinimized) openChatPopup();
  else minimizeChatPopup();
}

function openChatPopup() {
  const popup = document.getElementById('chatPopup');
  if (!popup) return;
  popup.classList.remove('hidden', 'minimized');
  chatPopupOpen = true;
  chatMinimized = false;
  chatUnread[chatChannel] = 0;
  updateChatFabBadge();
  renderChatTargetOptions();
  renderChatMessages();
  updateChatInputState();
  document.getElementById('chatInput').focus();
}

function minimizeChatPopup() {
  const popup = document.getElementById('chatPopup');
  if (!popup) return;
  popup.classList.add('minimized');
  chatMinimized = true;
}

function closeChatPopup() {
  const popup = document.getElementById('chatPopup');
  if (!popup) return;
  popup.classList.add('hidden');
  popup.classList.remove('minimized');
  chatPopupOpen = false;
  chatMinimized = false;
}

function switchChatChannel(type) {
  // Ao trocar de aba com o popup aberto, essa aba passa a estar "vista" —
  // zera a contagem de não lidas dela. Sussurro sempre volta sem alvo
  // escolhido: pro Mestre isso é o modo "👁️ Ver todos"; pro jogador é o
  // estado "escolha alguém" (ver renderChatTargetOptions/renderChatMessages).
  chatChannel = type;
  chatTargetUid = null;
  if (chatPopupOpen && !chatMinimized) { chatUnread[type] = 0; updateChatFabBadge(); }
  document.querySelectorAll('#chatTabs .chat-tab').forEach(b => b.classList.toggle('active', b.dataset.chatType === type));
  const errEl = document.getElementById('chatErr');
  if (errEl) errEl.classList.add('hidden');
  renderChatTargetOptions();
  renderChatMessages();
  updateChatInputState();
}

async function renderChatTargetOptions() {
  const row = document.getElementById('chatTargetRow');
  const select = document.getElementById('chatTargetSelect');
  const hint = document.getElementById('chatHint');
  if (!row || !select) return;

  if (chatChannel === 'general') { row.classList.add('hidden'); if (hint) hint.classList.add('hidden'); return; }

  const isMaster = isTableOwner();
  const options = chatRoster();
  row.classList.remove('hidden');

  if (options.length === 0) {
    // Pro Mestre isso só significa "ninguém pra sussurrar com" — ele ainda
    // consegue acompanhar sussurros que já existam (masterObserving não
    // depende do roster). Pro jogador, não tem com quem sussurrar mesmo.
    select.innerHTML = isMaster
      ? `<option value="">👁️ Ver todos os sussurros</option>`
      : `<option value="">Ninguém disponível ainda</option>`;
    chatTargetUid = null;
    if (hint) hint.classList.add('hidden');
    return;
  }

  const prevValue = chatTargetUid;
  const watchAllOpt = isMaster ? `<option value="">👁️ Ver todos os sussurros</option>` : `<option value="">Selecione…</option>`;
  select.innerHTML = watchAllOpt +
    options.map(o => `<option value="${o.uid}">${isMaster ? 'Sussurrar com ' : ''}${escapeHtml(o.name)}</option>`).join('');
  select.value = (prevValue && options.some(o => o.uid === prevValue)) ? prevValue : '';
  if (select.value !== prevValue) chatTargetUid = select.value || null;

  if (hint) {
    if (isMaster && !chatTargetUid) {
      hint.textContent = '👁️ Acompanhando todos os sussurros da mesa. Clique num nome numa mensagem, ou escolha alguém acima, para sussurrar diretamente com essa pessoa.';
      hint.classList.remove('hidden');
    } else if (chatTargetUid) {
      const targetName = (options.find(o => o.uid === chatTargetUid) || {}).name || 'esta pessoa';
      hint.textContent = isMaster
        ? `🤫 Só você e ${targetName} veem estas mensagens (além de você, que acompanha tudo).`
        : `🤫 Só você, ${targetName} e o Mestre da mesa veem estas mensagens.`;
      hint.classList.remove('hidden');
    } else {
      hint.classList.add('hidden');
    }
  }
}

function fmtChatTime(ts) {
  if (!ts || !ts.toDate) return '';
  return ts.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function scrollChatToBottom() {
  const box = document.getElementById('chatMessages');
  if (box) box.scrollTop = box.scrollHeight;
}

function renderChatMessages() {
  const box = document.getElementById('chatMessages');
  if (!box) return;

  // "Ver todos": só quando o Mestre está em Sussurro e não escolheu um alvo
  // específico. Assim que ele escolhe alguém no seletor (ou clica num nome
  // numa mensagem observada), sai desse modo e vira uma conversa normal.
  const masterObserving = chatChannel === 'whisper' && isTableOwner() && !chatTargetUid;

  if (chatChannel !== 'general' && !chatTargetUid && !masterObserving) {
    box.innerHTML = `<div class="chat-empty">Escolha um destinatário para começar a conversar.</div>`;
    return;
  }

  let list;
  if (chatChannel === 'general') {
    list = chatMessagesCache.filter(m => m.type === 'general');
  } else if (masterObserving) {
    list = chatMessagesCache.filter(m => m.type === 'whisper');
  } else {
    list = chatMessagesCache.filter(m => m.type === chatChannel &&
      ((m.fromUserId === curUser.uid && m.toUserId === chatTargetUid) ||
       (m.fromUserId === chatTargetUid && m.toUserId === curUser.uid)));
  }

  if (list.length === 0) {
    box.innerHTML = masterObserving
      ? `<div class="chat-empty">Nenhum sussurro na mesa ainda.</div>`
      : `<div class="chat-empty">Nenhuma mensagem ainda.</div>`;
    return;
  }

  box.innerHTML = list.map(m => {
    const mine = m.fromUserId === curUser.uid;
    const isMasterMsg = !!curTable && m.fromUserId === curTable.createdBy;
    const masterTag = isMasterMsg ? '<span class="chat-msg-master-tag">Mestre</span>' : '';
    let who;
    if (masterObserving) {
      // Cada nome é clicável na sua própria pessoa: o Mestre entra direto
      // numa conversa de sussurro com quem ele clicar, remetente ou
      // destinatário, sem precisar usar o seletor.
      const fromClick = m.fromUserId === curTable.createdBy ? '' : ` clickable" data-jump-uid="${m.fromUserId}`;
      const toClick = m.toUserId === curTable.createdBy ? '' : ` clickable" data-jump-uid="${m.toUserId}`;
      who = `<span class="chat-msg-who${fromClick}">${escapeHtml(m.fromName || '?')}</span>${masterTag} → ` +
            `<span class="chat-msg-who${toClick}">${escapeHtml(m.toName || '?')}</span>`;
    } else {
      who = `<span class="chat-msg-who">${escapeHtml(mine ? 'Você' : (m.fromName || '?'))}${masterTag}</span>`;
    }
    return `
      <div class="chat-msg${mine ? ' mine' : ''}${chatChannel === 'whisper' ? ' whisper' : ''}">
        <div class="chat-msg-head">${who}<span class="chat-msg-time">${fmtChatTime(m.timestamp)}</span></div>
        <div class="chat-msg-body">${escapeHtml(m.content)}</div>
      </div>`;
  }).join('');
  scrollChatToBottom();
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const errEl = document.getElementById('chatErr');
  if (!input) return;
  const content = input.value.trim();
  errEl.classList.add('hidden');
  if (!content) return;

  if (chatChannel !== 'general' && !chatTargetUid) {
    errEl.textContent = isTableOwner()
      ? 'Você está no modo "ver todos" — escolha um jogador no seletor (ou clique no nome dele numa mensagem) para sussurrar diretamente com ele.'
      : 'Escolha um destinatário antes de enviar.';
    errEl.classList.remove('hidden');
    return;
  }

  const myName = isTableOwner()
    ? (curProfile.name || 'Mestre')
    : ((liveTokens[curUser.uid] && liveTokens[curUser.uid].name) || curProfile.name || 'Jogador');

  const payload = {
    tableId: curTable.id,
    fromUserId: curUser.uid,
    fromName: myName,
    type: chatChannel,
    content: content.slice(0, 1000),
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (chatChannel !== 'general') {
    payload.toUserId = chatTargetUid;
    const target = chatRoster().find(o => o.uid === chatTargetUid);
    payload.toName = (target && target.name) || '';
  }

  try {
    input.value = '';
    await db.collection('tables').doc(curTable.id).collection('chatMessages').add(payload);
  } catch (err) {
    errEl.textContent = 'Erro ao enviar: ' + err.message;
    errEl.classList.remove('hidden');
  }
}


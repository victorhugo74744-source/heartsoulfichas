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
//    Do lado do jogador, o seletor agora sempre tem uma opção fixa "🎭
//    Mestre da mesa" no topo (separada, por optgroup, dos outros jogadores
//    presentes) — dá pra sussurrar direto pro Mestre mesmo que ele não
//    tenha nenhum token na mesa, e mesmo numa mesa onde nenhum outro
//    jogador tem ficha presente ainda (antes disso o seletor ficava vazio
//    e ninguém dava pra chamar). Ver chatMasterEntry().
// O canal "Privado" (DM) que existia aqui antes foi removido do projeto
// (junto com js/dm.js e as coleções userDirectory/dmThreads do Firestore) —
// a mesa só tem os dois canais acima agora: Geral e Sussurro.
// Este projeto não tem um backend Node/Socket.IO próprio (é 100% Firebase),
// então firestore.rules faz o papel de "validação no servidor" citado no
// requisito — tanto na escrita (não dá pra fingir ser outro remetente) como
// na leitura (uma mensagem que não é sua nem chega a este cliente).
//
// Além do que já existia, este arquivo também cobre:
//  - Som + notificação do navegador quando chega um sussurro (ou uma menção
//    "@Nome") e o popup não está aberto/visível nessa aba — ver
//    chatNotifyIncoming/chatPlayNotifSound/chatShowDesktopNotif.
//  - Editar e apagar a própria mensagem (o Mestre também pode apagar
//    qualquer uma, moderação básica) — ver startEditChatMessage/
//    saveEditChatMessage/deleteChatMessage; a regra em firestore.rules só
//    deixa mudar o campo "content" (+ editedAt), nunca remetente/tipo/hora.
//  - Emojis (seletor simples, sem depender de nenhuma lib externa) — ver
//    toggleChatEmojiMenu/insertChatEmoji.
//  - Menções "@Nome": autocompleta com quem está na mesa (jogadores com
//    ficha presente + o Mestre), destaca no texto renderizado e soma ao
//    campo "mentions" da mensagem (lista de uids) pra quem foi citado
//    receber a mesma notificação de um sussurro, mesmo no chat Geral — ver
//    chatDetectMentions/handleChatInputForMention.
//  - "Fulano está digitando…": tables/{id}/typing/{uid}, um heartbeat leve
//    (só escreve ao começar/parar de digitar, não a cada tecla) — ver
//    listenChatTyping/setMyChatTyping/renderChatTypingIndicator.

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

// Entrada fixa do Mestre no seletor de sussurro, do ponto de vista de quem
// está olhando agora: null se o próprio usuário já É o Mestre desta mesa
// (não faz sentido sussurrar consigo mesmo), senão sempre disponível —
// diferente de chatRoster(), não depende de token nenhum estar na mesa.
function chatMasterEntry() {
  if (!curTable || isTableOwner()) return null;
  return { uid: curTable.createdBy, name: 'Mestre', isMaster: true };
}

// Quem dá pra @mencionar: mesma lista de chatRoster() (jogadores com ficha
// presente, exceto você mesmo) + o Mestre da mesa quando você não é ele —
// reaproveita exatamente as mesmas regras do seletor de sussurro.
function chatMentionAllCandidates() {
  const master = chatMasterEntry();
  return master ? [...chatRoster(), master] : chatRoster();
}

// Varre o texto em busca de "@NomeExato" batendo com alguém mencionável
// agora, e devolve os uids encontrados (sem duplicar) — usado ao enviar,
// pra saber quem precisa ser avisado com a mesma notificação de sussurro
// (ver chatNotifyIncoming), mesmo estando no chat Geral.
function chatDetectMentions(content) {
  const found = new Set();
  chatMentionAllCandidates().forEach(c => {
    if (c.name && content.includes('@' + c.name)) found.add(c.uid);
  });
  return Array.from(found);
}

function resetChatState() {
  const titleEl = document.getElementById('chatPopupTitle');
  if (titleEl) titleEl.textContent = (curTable && curTable.name) ? curTable.name : 'Chat da mesa';
  chatChannel = 'general';
  chatTargetUid = null;
  chatUnread = { general: 0, whisper: 0 };
  chatSnapshotPrimed = false;
  chatPopupOpen = false;
  chatMinimized = false;
  chatEditingId = null;
  chatTypingOthers = {};
  chatMyTypingActive = false;
  clearTimeout(chatTypingStopTimer);
  chatTypingStopTimer = null;
  closeChatEmojiMenu();
  closeChatMentionMenu();
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
          // Som + notificação do navegador: todo sussurro que este cliente
          // tem permissão de ver (inclui o Mestre "vendo todos"), e
          // qualquer menção "@Nome" a mim mesmo em qualquer canal — só
          // quando a conversa não está literalmente na tela agora (mesmo
          // critério do "não lida" acima).
          if (!isMine && !tabVisible) {
            if (m.type === 'whisper' && canSeeWhisper) chatNotifyIncoming(m, 'whisper');
            else if (Array.isArray(m.mentions) && m.mentions.includes(curUser.uid)) chatNotifyIncoming(m, 'mention');
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

// -------------------------------------------------------- SOM/NOTIFICAÇÃO --
function chatRequestNotifPermission() {
  if (!('Notification' in window)) return; // navegador sem suporte (ex.: alguns navegadores mobile) — ignora
  if (Notification.permission === 'default') Notification.requestPermission().catch(() => {});
}

// Toca um "ping" de duas notas sintetizado na hora com Web Audio API — sem
// depender de nenhum arquivo de áudio externo (funciona igual offline, já
// que o site é um PWA). Alguns navegadores só deixam tocar som depois de
// alguma interação do usuário na página; o try/catch cobre esse caso raro
// (ex.: a própria primeiríssima notificação, antes de qualquer clique).
function chatPlayNotifSound() {
  try {
    if (!chatAudioCtx) chatAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (chatAudioCtx.state === 'suspended') chatAudioCtx.resume();
    const ctx = chatAudioCtx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.setValueAtTime(988, now + 0.09);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.34);
  } catch (e) { /* silencioso */ }
}

function chatShowDesktopNotif(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, { body, tag: 'heartsoul-chat-' + Date.now() });
    n.onclick = () => { window.focus(); openChatPopup(); n.close(); };
  } catch (e) { /* alguns navegadores mobile não suportam "new Notification()" direto */ }
}

// Chamado ao chegar uma mensagem ao vivo que o cliente não está vendo na
// tela agora (ver listenChat) — toca o som sempre, e soma a notificação do
// sistema quando a permissão do navegador já foi concedida.
function chatNotifyIncoming(m, kind) {
  chatPlayNotifSound();
  const title = kind === 'whisper' ? `🤫 Sussurro de ${m.fromName || '?'}` : `📣 ${m.fromName || '?'} mencionou você`;
  chatShowDesktopNotif(title, (m.content || '').slice(0, 120));
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
  chatRequestNotifPermission(); // ponto discreto pra pedir: já é uma ação ativa de "quero usar o chat"
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
  clearMyChatTyping();
  closeChatEmojiMenu();
  closeChatMentionMenu();
}

function closeChatPopup() {
  const popup = document.getElementById('chatPopup');
  if (!popup) return;
  popup.classList.add('hidden');
  popup.classList.remove('minimized');
  chatPopupOpen = false;
  chatMinimized = false;
  chatEditingId = null;
  clearMyChatTyping();
  closeChatEmojiMenu();
  closeChatMentionMenu();
}

function switchChatChannel(type) {
  // Ao trocar de aba com o popup aberto, essa aba passa a estar "vista" —
  // zera a contagem de não lidas dela. Sussurro sempre volta sem alvo
  // escolhido: pro Mestre isso é o modo "👁️ Ver todos"; pro jogador é o
  // estado "escolha alguém" (ver renderChatTargetOptions/renderChatMessages).
  chatChannel = type;
  chatTargetUid = null;
  chatEditingId = null;
  clearMyChatTyping();
  closeChatEmojiMenu();
  closeChatMentionMenu();
  if (chatPopupOpen && !chatMinimized) { chatUnread[type] = 0; updateChatFabBadge(); }
  document.querySelectorAll('#chatTabs .chat-tab').forEach(b => b.classList.toggle('active', b.dataset.chatType === type));
  const errEl = document.getElementById('chatErr');
  if (errEl) errEl.classList.add('hidden');
  renderChatTargetOptions();
  renderChatMessages();
  updateChatInputState();
  renderChatTypingIndicator();
}

async function renderChatTargetOptions() {
  const row = document.getElementById('chatTargetRow');
  const select = document.getElementById('chatTargetSelect');
  const hint = document.getElementById('chatHint');
  if (!row || !select) return;

  if (chatChannel === 'general') { row.classList.add('hidden'); if (hint) hint.classList.add('hidden'); return; }

  const isMaster = isTableOwner();
  const players = chatRoster();
  row.classList.remove('hidden');

  if (isMaster) {
    // Mestre: acompanha tudo por padrão, ou escolhe um jogador com ficha
    // presente na mesa pra falar diretamente com ele (comportamento igual
    // a antes — o Mestre não precisa de uma opção "Mestre" pra si mesmo).
    if (players.length === 0) {
      select.innerHTML = `<option value="">👁️ Ver todos os sussurros</option>`;
      chatTargetUid = null;
      if (hint) hint.classList.add('hidden');
      return;
    }
    const prevValue = chatTargetUid;
    select.innerHTML = `<option value="">👁️ Ver todos os sussurros</option>` +
      players.map(o => `<option value="${o.uid}">Sussurrar com ${escapeHtml(o.name)}</option>`).join('');
    select.value = (prevValue && players.some(o => o.uid === prevValue)) ? prevValue : '';
    if (select.value !== prevValue) chatTargetUid = select.value || null;
    if (hint) {
      if (!chatTargetUid) {
        hint.textContent = '👁️ Acompanhando todos os sussurros da mesa. Clique num nome numa mensagem, ou escolha alguém acima, para sussurrar diretamente com essa pessoa.';
        hint.classList.remove('hidden');
      } else {
        const targetName = (players.find(o => o.uid === chatTargetUid) || {}).name || 'esta pessoa';
        hint.textContent = `🤫 Só você e ${targetName} veem estas mensagens (além de você, que acompanha tudo).`;
        hint.classList.remove('hidden');
      }
    }
    return;
  }

  // Jogador: sempre pode sussurrar direto com o Mestre da mesa (opção fixa,
  // não depende de token nenhum), além de qualquer outro jogador com ficha
  // presente — os dois grupos ficam separados no seletor.
  const masterEntry = chatMasterEntry();
  const options = masterEntry ? [masterEntry, ...players] : players;
  const prevValue = chatTargetUid;
  select.innerHTML = `<option value="">Selecione…</option>` +
    (masterEntry ? `<option value="${masterEntry.uid}">🎭 Mestre da mesa</option>` : '') +
    (players.length
      ? `<optgroup label="Jogadores">${players.map(o => `<option value="${o.uid}">${escapeHtml(o.name)}</option>`).join('')}</optgroup>`
      : '');
  select.value = (prevValue && options.some(o => o.uid === prevValue)) ? prevValue : '';
  if (select.value !== prevValue) chatTargetUid = select.value || null;

  if (hint) {
    if (chatTargetUid) {
      const target = options.find(o => o.uid === chatTargetUid);
      hint.textContent = (target && target.isMaster)
        ? '🤫 Só você e o Mestre da mesa veem estas mensagens.'
        : `🤫 Só você, ${(target && target.name) || 'esta pessoa'} e o Mestre da mesa veem estas mensagens.`;
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

// "Hoje" / "Ontem" / dd/mm(/aaaa) — usado no divisor de dia entre grupos de
// mensagens de sessões diferentes (ver renderChatMessages).
function fmtChatDayLabel(date) {
  const now = new Date();
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

// Cor determinística do avatar por pessoa (mesmo uid = sempre a mesma cor,
// sem precisar guardar nada) — paleta de tons que combinam com o resto do
// visual (dourado/selo escuro), mas distintos o bastante entre si.
const CHAT_AVATAR_PALETTE = ['#8f5a3c', '#5b8fa8', '#6f8f6a', '#8a6fae', '#a8763f', '#4a9e91', '#b3577a', '#7a8a4a', '#5a6faa', '#b08a3c'];
function chatAvatarColor(uid) {
  const str = uid || '?';
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return CHAT_AVATAR_PALETTE[hash % CHAT_AVATAR_PALETTE.length];
}
function chatAvatarInitial(name) {
  const trimmed = (name || '?').trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
}

function scrollChatToBottom() {
  const box = document.getElementById('chatMessages');
  if (box) box.scrollTop = box.scrollHeight;
}

// Duas mensagens seguidas da MESMA pessoa, mandadas a menos de 5 minutos
// uma da outra, viram uma "fileira" só (agrupadas): nome/hora/avatar só na
// primeira, as de baixo vêm coladas — menos repetição visual numa conversa
// corrida, igual apps de chat comuns.
const CHAT_GROUP_WINDOW_MS = 5 * 60 * 1000;

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

  let html = '';
  let lastDayKey = null;
  let lastGroupKey = null; // uid de quem mandou a última mensagem, pra saber se agrupa com esta
  let lastTimeMs = null;

  list.forEach(m => {
    const mine = m.fromUserId === curUser.uid;
    const isMasterMsg = !!curTable && m.fromUserId === curTable.createdBy;
    const masterTag = isMasterMsg ? '<span class="chat-msg-master-tag">Mestre</span>' : '';
    const msgDate = (m.timestamp && m.timestamp.toDate) ? m.timestamp.toDate() : null;
    const timeMs = msgDate ? msgDate.getTime() : null;

    if (msgDate) {
      const dayKey = msgDate.toDateString();
      if (dayKey !== lastDayKey) {
        html += `<div class="chat-day-divider"><span>${escapeHtml(fmtChatDayLabel(msgDate))}</span></div>`;
        lastDayKey = dayKey;
        lastGroupKey = null; // cada dia começa uma fileira nova, mesmo que seja a mesma pessoa
      }
    }

    let who, rowClasses, avatarHtml;
    if (masterObserving) {
      // Cada nome é clicável na sua própria pessoa: o Mestre entra direto
      // numa conversa de sussurro com quem ele clicar, remetente ou
      // destinatário, sem precisar usar o seletor. Sem avatar nem
      // agrupamento aqui — cada linha já mostra remetente → destinatário,
      // então junto com um avatar de qual dos dois seria ambíguo.
      const fromClick = m.fromUserId === curTable.createdBy ? '' : ` clickable" data-jump-uid="${m.fromUserId}`;
      const toClick = m.toUserId === curTable.createdBy ? '' : ` clickable" data-jump-uid="${m.toUserId}`;
      who = `<span class="chat-msg-who${fromClick}">${escapeHtml(m.fromName || '?')}</span>${masterTag} → ` +
            `<span class="chat-msg-who${toClick}">${escapeHtml(m.toName || '?')}</span>`;
      rowClasses = 'chat-msg-row observing whisper';
      avatarHtml = '';
      lastGroupKey = null;
    } else {
      const groupKey = m.fromUserId;
      const grouped = groupKey === lastGroupKey && timeMs !== null && lastTimeMs !== null &&
        (timeMs - lastTimeMs) < CHAT_GROUP_WINDOW_MS;
      who = grouped ? '' : `<span class="chat-msg-who">${escapeHtml(mine ? 'Você' : (m.fromName || '?'))}</span>${masterTag}`;
      rowClasses = `chat-msg-row${mine ? ' mine' : ''}${chatChannel === 'whisper' ? ' whisper' : ''}${grouped ? ' grouped' : ''}`;
      avatarHtml = grouped
        ? `<div class="chat-avatar spacer"></div>`
        : `<div class="chat-avatar" style="background:${chatAvatarColor(m.fromUserId)};">${escapeHtml(chatAvatarInitial(mine ? 'Você' : (m.fromName || '?')))}</div>`;
      lastGroupKey = groupKey;
    }
    lastTimeMs = timeMs;

    const headHtml = who ? `<div class="chat-msg-head">${who}<span class="chat-msg-time">${fmtChatTime(m.timestamp)}</span></div>` : '';

    // Editar: só o próprio autor, e só o campo "content" (regra do
    // Firestore não deixa mudar mais nada). Apagar: o autor, ou o Mestre
    // desta mesa (moderação básica) — em qualquer canal, mesmo no modo
    // "vendo todos" de um sussurro alheio.
    const canEdit = mine;
    const canDelete = mine || isTableOwner();
    const editedTag = m.editedAt ? '<span class="chat-msg-edited-tag">(editado)</span>' : '';

    let bodyHtml;
    if (chatEditingId === m.id) {
      bodyHtml = `
        <div class="chat-msg-body chat-msg-editing">
          <input type="text" class="chat-edit-input" maxlength="1000" value="${escapeHtml(m.content)}">
          <div class="chat-edit-actions">
            <button type="button" class="chat-edit-save" data-save-id="${m.id}" title="Salvar">✓</button>
            <button type="button" class="chat-edit-cancel" title="Cancelar">✕</button>
          </div>
        </div>`;
    } else {
      bodyHtml = `<div class="chat-msg-body">${chatRenderContent(m.content)}${editedTag}</div>`;
    }

    const actionsHtml = (chatEditingId !== m.id && (canEdit || canDelete)) ? `
      <div class="chat-msg-actions">
        ${canEdit ? `<button type="button" class="chat-edit-btn" data-edit-id="${m.id}" title="Editar">✏️</button>` : ''}
        ${canDelete ? `<button type="button" class="chat-delete-btn" data-delete-id="${m.id}" title="Apagar">🗑️</button>` : ''}
      </div>` : '';

    html += `
      <div class="${rowClasses}" data-msg-id="${m.id}">
        ${avatarHtml}
        <div class="chat-msg-col">
          ${headHtml}
          <div class="chat-msg">${bodyHtml}${actionsHtml}</div>
        </div>
      </div>`;
  });

  box.innerHTML = html;
  if (chatEditingId) {
    // Não rola pro fim enquanto edita: a mensagem sendo editada pode não
    // ser a última, e perder ela de vista no meio da edição é ruim.
    const editBox = box.querySelector('.chat-edit-input');
    if (editBox) { editBox.focus(); editBox.setSelectionRange(editBox.value.length, editBox.value.length); }
  } else {
    scrollChatToBottom();
  }
}

// Todo mundo que pode aparecer citado numa mensagem já enviada — diferente
// de chatMentionAllCandidates() (usado no autocompletar), este NÃO exclui
// você mesmo, senão "@SeuNome" escrito por outra pessoa nunca seria
// reconhecido/destacado na sua própria tela.
function chatAllRenderCandidates() {
  const rows = [];
  const seen = new Set();
  Object.values(liveTokens).forEach(t => {
    if (!t.ownerId || seen.has(t.ownerId)) return;
    seen.add(t.ownerId);
    rows.push({ uid: t.ownerId, name: t.name || 'Jogador' });
  });
  if (curTable && !seen.has(curTable.createdBy)) rows.push({ uid: curTable.createdBy, name: 'Mestre' });
  return rows;
}

// Destaca "@Nome" dentro do texto (já escapado) de uma mensagem, quando o
// nome bate exatamente com alguém mencionável agora — melhor esforço: quem
// já saiu da mesa (perdeu o token) não é reconhecido mais, mas o "@Nome"
// digitado continua ali, só sem o destaque.
function chatRenderContent(content) {
  let html = escapeHtml(content);
  chatAllRenderCandidates()
    .slice()
    .sort((a, b) => (b.name || '').length - (a.name || '').length) // nomes maiores primeiro, senão "Ana" "rouba" parte de "Ana Paula"
    .forEach(c => {
      if (!c.name) return;
      const token = escapeHtml('@' + c.name);
      if (!html.includes(token)) return;
      const cls = c.uid === curUser.uid ? 'chat-mention me' : 'chat-mention';
      html = html.split(token).join(`<span class="${cls}">${token}</span>`);
    });
  return html;
}

// -------------------------------------------------------- EDITAR/APAGAR --
function startEditChatMessage(id) {
  const m = chatMessagesCache.find(x => x.id === id);
  if (!m || m.fromUserId !== curUser.uid) return; // regra do Firestore só deixa o autor editar
  chatEditingId = id;
  closeChatEmojiMenu();
  closeChatMentionMenu();
  renderChatMessages();
}

function cancelEditChatMessage() {
  chatEditingId = null;
  renderChatMessages();
}

async function saveEditChatMessage(id) {
  const row = document.querySelector(`.chat-msg-row[data-msg-id="${id}"]`);
  const box = row && row.querySelector('.chat-edit-input');
  if (!box) return;
  const content = box.value.trim();
  if (!content) { cancelEditChatMessage(); return; }
  chatEditingId = null;
  try {
    await db.collection('tables').doc(curTable.id).collection('chatMessages').doc(id).update({
      content: content.slice(0, 1000),
      editedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error('Erro ao editar mensagem:', err);
  }
  renderChatMessages();
}

async function deleteChatMessage(id) {
  const m = chatMessagesCache.find(x => x.id === id);
  if (!m) return;
  if (!confirm('Apagar esta mensagem? Isso não pode ser desfeito.')) return;
  try {
    await db.collection('tables').doc(curTable.id).collection('chatMessages').doc(id).delete();
  } catch (err) {
    console.error('Erro ao apagar mensagem:', err);
  }
}

// ------------------------------------------------------------- EMOJIS --
const CHAT_EMOJI_LIST = [
  '😀', '😂', '😅', '😉', '😊', '😍', '😘', '😜', '🤔', '😐', '😢', '😭', '😡', '😱', '🥳', '😴',
  '👍', '👎', '👏', '🙏', '💪', '🤝', '✌️', '👋',
  '❤️', '💔', '⭐', '✨', '🔥', '💀', '⚔️', '🛡️', '🎲', '🐉', '🍺', '☕'
];

function toggleChatEmojiMenu() {
  const menu = document.getElementById('chatEmojiMenu');
  if (!menu) return;
  const willOpen = menu.classList.contains('hidden');
  closeChatMentionMenu();
  if (willOpen) { renderChatEmojiMenu(); menu.classList.remove('hidden'); }
  else menu.classList.add('hidden');
}

function closeChatEmojiMenu() {
  const menu = document.getElementById('chatEmojiMenu');
  if (menu) menu.classList.add('hidden');
}

function renderChatEmojiMenu() {
  const menu = document.getElementById('chatEmojiMenu');
  if (!menu) return;
  menu.innerHTML = CHAT_EMOJI_LIST.map(e => `<button type="button" class="chat-emoji-opt" data-emoji="${e}">${e}</button>`).join('');
}

function insertChatEmoji(emoji) {
  const input = document.getElementById('chatInput');
  if (!input) return;
  const start = input.selectionStart != null ? input.selectionStart : input.value.length;
  const end = input.selectionEnd != null ? input.selectionEnd : input.value.length;
  input.value = input.value.slice(0, start) + emoji + input.value.slice(end);
  const pos = start + emoji.length;
  closeChatEmojiMenu();
  input.focus();
  input.setSelectionRange(pos, pos);
  markChatTyping();
}

// ------------------------------------------------------------ MENÇÕES --
// Digitar "@" seguido de letras abre um dropdown com quem está mencionável
// agora (chatMentionAllCandidates), filtrado pelo que já foi digitado
// depois do "@" até o cursor — igual ao autocompletar de apps de chat
// comuns. Ver handleChatInputForMention (chamado a cada tecla do input,
// junto de markChatTyping — ver wiring em mesa-init.js).
function handleChatInputForMention() {
  const input = document.getElementById('chatInput');
  if (!input) return;
  const pos = input.selectionStart != null ? input.selectionStart : input.value.length;
  const uptoCursor = input.value.slice(0, pos);
  const match = uptoCursor.match(/(?:^|\s)@([^\s@]*)$/);
  if (!match) { closeChatMentionMenu(); return; }
  const typed = match[1].toLowerCase();
  const filtered = chatMentionAllCandidates().filter(c => c.name.toLowerCase().includes(typed));
  if (!filtered.length) { closeChatMentionMenu(); return; }
  chatMentionCandidates = filtered;
  chatMentionSelectedIndex = 0;
  chatMentionActive = true;
  renderChatMentionMenu();
}

function renderChatMentionMenu() {
  const menu = document.getElementById('chatMentionMenu');
  if (!menu) return;
  closeChatEmojiMenu();
  menu.innerHTML = chatMentionCandidates.map((c, i) =>
    `<button type="button" class="chat-mention-opt${i === chatMentionSelectedIndex ? ' active' : ''}" data-mention-name="${escapeHtml(c.name)}">${c.isMaster ? '🎭' : '👤'} ${escapeHtml(c.name)}</button>`
  ).join('');
  menu.classList.remove('hidden');
}

function chatMentionMoveSelection(delta) {
  if (!chatMentionCandidates.length) return;
  chatMentionSelectedIndex = (chatMentionSelectedIndex + delta + chatMentionCandidates.length) % chatMentionCandidates.length;
  renderChatMentionMenu();
}

function chatMentionConfirmSelection() {
  const c = chatMentionCandidates[chatMentionSelectedIndex];
  if (c) selectChatMention(c.name);
}

// Troca o "@parcial" que está sendo digitado (antes do cursor) pelo nome
// completo escolhido + um espaço, mantendo o resto do texto intacto.
function selectChatMention(name) {
  const input = document.getElementById('chatInput');
  if (!input) return;
  const pos = input.selectionStart != null ? input.selectionStart : input.value.length;
  const uptoCursor = input.value.slice(0, pos);
  const match = uptoCursor.match(/(?:^|\s)@([^\s@]*)$/);
  if (!match) { closeChatMentionMenu(); return; }
  const atIndex = pos - match[0].length + (match[0].startsWith(' ') ? 1 : 0);
  const before = input.value.slice(0, atIndex);
  const after = input.value.slice(pos);
  const inserted = '@' + name + ' ';
  input.value = before + inserted + after;
  const newPos = (before + inserted).length;
  closeChatMentionMenu();
  input.focus();
  input.setSelectionRange(newPos, newPos);
}

function closeChatMentionMenu() {
  chatMentionActive = false;
  chatMentionCandidates = [];
  const menu = document.getElementById('chatMentionMenu');
  if (menu) menu.classList.add('hidden');
}

// -------------------------------------------------- "ESTÁ DIGITANDO…" --
// Um documento por pessoa (tables/{id}/typing/{uid}); só escreve/apaga o
// PRÓPRIO ao começar/parar de digitar (não a cada tecla — ver
// chatMyTypingActive), evitando martelar o Firestore. CHAT_TYPING_TTL_MS é
// só uma rede de segurança pro cliente ignorar um documento "preso" (ex.:
// aba fechada de forma abrupta, sem dar tempo de apagar); normalmente o
// próprio parar-de-digitar (ou enviar/trocar de conversa/fechar o chat) já
// apaga o documento na hora — ver clearMyChatTyping.
const CHAT_TYPING_TTL_MS = 6000;
const CHAT_TYPING_STOP_DELAY_MS = 4000;

function markChatTyping() {
  if (!curTable || !curUser) return;
  if (chatChannel !== 'general' && !chatTargetUid) return; // sem alvo escolhido, não tem pra quem indicar
  if (!chatMyTypingActive) {
    chatMyTypingActive = true;
    const myName = isTableOwner()
      ? (curProfile.name || 'Mestre')
      : ((liveTokens[curUser.uid] && liveTokens[curUser.uid].name) || curProfile.name || 'Jogador');
    const payload = {
      name: myName,
      channel: chatChannel,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (chatChannel === 'whisper') payload.toUserId = chatTargetUid;
    db.collection('tables').doc(curTable.id).collection('typing').doc(curUser.uid)
      .set(payload).catch(err => console.warn('Erro ao sinalizar "digitando":', err));
  }
  clearTimeout(chatTypingStopTimer);
  chatTypingStopTimer = setTimeout(clearMyChatTyping, CHAT_TYPING_STOP_DELAY_MS);
}

function clearMyChatTyping() {
  clearTimeout(chatTypingStopTimer);
  chatTypingStopTimer = null;
  if (!chatMyTypingActive) return;
  chatMyTypingActive = false;
  if (curTable && curUser) {
    db.collection('tables').doc(curTable.id).collection('typing').doc(curUser.uid).delete().catch(() => {});
  }
}

// Registrado em beforeunload (ver listenChatTyping) pra tentar limpar o
// documento se a aba fechar sem dar tempo do timeout normal — igual ao
// mesmo padrão já usado pra presença (ver presenceBeforeUnload).
function chatTypingBeforeUnload() {
  if (curTable && curUser) {
    db.collection('tables').doc(curTable.id).collection('typing').doc(curUser.uid).delete().catch(() => {});
  }
}

// Igual ao padrão de listenChat: uma query só (sem "where" nenhum) numa
// coleção com regra de leitura variável por documento faz o Firestore
// negar a leitura inteira — por isso, de novo, uma query por canal já
// restrita de um jeito que a regra consegue aprovar por completo (ver
// firestore.rules: tables/{id}/typing/{uid}).
function listenChatTyping() {
  chatTypingOthers = {};
  window.addEventListener('beforeunload', chatTypingBeforeUnload);

  const isMaster = isTableOwner();
  const base = db.collection('tables').doc(curTable.id).collection('typing');
  const byId = new Map();
  const unsubs = [];

  function attach(query) {
    const unsub = query.onSnapshot(snap => {
      snap.docChanges().forEach(change => {
        if (change.doc.id === curUser.uid) return; // nunca precisa do próprio indicador de volta
        if (change.type === 'removed') { byId.delete(change.doc.id); return; }
        byId.set(change.doc.id, { uid: change.doc.id, ...change.doc.data() });
      });
      chatTypingOthers = Object.fromEntries(byId);
      renderChatTypingIndicator();
    }, err => console.warn('Erro ao sincronizar "digitando":', err));
    unsubs.push(unsub);
  }

  attach(base.where('channel', '==', 'general'));
  attach(isMaster
    ? base.where('channel', '==', 'whisper')
    : base.where('channel', '==', 'whisper').where('toUserId', '==', curUser.uid));

  chatTypingTickTimer = setInterval(renderChatTypingIndicator, 2000);
  chatTypingUnsub = () => {
    unsubs.forEach(u => u());
    clearInterval(chatTypingTickTimer);
    chatTypingTickTimer = null;
  };
}

function renderChatTypingIndicator() {
  const el = document.getElementById('chatTyping');
  if (!el) return;
  const now = Date.now();
  const masterObserving = chatChannel === 'whisper' && isTableOwner() && !chatTargetUid;

  const names = Object.values(chatTypingOthers).filter(t => {
    if (!t || !t.updatedAt || !t.updatedAt.toDate) return false;
    if (now - t.updatedAt.toDate().getTime() > CHAT_TYPING_TTL_MS) return false;
    if (t.channel !== chatChannel) return false;
    if (chatChannel === 'general') return true;
    if (masterObserving) return true; // Mestre "vendo todos": qualquer sussurro conta
    return t.uid === chatTargetUid && t.toUserId === curUser.uid; // só a pessoa desta conversa específica
  }).map(t => t.name || 'Alguém');

  if (!names.length) { el.classList.add('hidden'); el.textContent = ''; return; }
  const label = names.length === 1 ? `${names[0]} está digitando…`
    : names.length === 2 ? `${names[0]} e ${names[1]} estão digitando…`
    : `${names.length} pessoas estão digitando…`;
  el.textContent = label;
  el.classList.remove('hidden');
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
    const masterEntry = chatMasterEntry();
    const target = (masterEntry && masterEntry.uid === chatTargetUid)
      ? masterEntry
      : chatRoster().find(o => o.uid === chatTargetUid);
    payload.toName = (target && target.name) || '';
  }

  // "@Nome" reconhecido vira uma notificação (som + aviso do navegador) pra
  // quem foi citado, igual a um sussurro — ver chatNotifyIncoming em
  // listenChat. Só soma o campo se achou alguém, pra não sujar mensagens
  // sem menção nenhuma.
  const mentions = chatDetectMentions(content);
  if (mentions.length) payload.mentions = mentions;

  try {
    input.value = '';
    clearMyChatTyping();
    closeChatEmojiMenu();
    closeChatMentionMenu();
    await db.collection('tables').doc(curTable.id).collection('chatMessages').add(payload);
  } catch (err) {
    errEl.textContent = 'Erro ao enviar: ' + err.message;
    errEl.classList.remove('hidden');
  }
}


function chatRoster() {
const seen = new Set();
const rows = [];
Object.values(liveTokens).forEach(t => {
if (!t.ownerId || t.ownerId === curUser.uid || seen.has(t.ownerId)) return;
seen.add(t.ownerId);
rows.push({ uid: t.ownerId, name: t.name || 'Jogador' });
});
return rows;
}
function chatMasterEntry() {
if (!curTable || isTableOwner()) return null;
return { uid: curTable.createdBy, name: 'Mestre', isMaster: true };
}
function chatMentionAllCandidates() {
const master = chatMasterEntry();
return master ? [...chatRoster(), master] : chatRoster();
}
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
const byId = new Map();
const primed = {};
const unsubs = [];
function attach(key, query) {
primed[key] = false;
const unsub = query.onSnapshot(snap => {
const wasPrimed = chatSnapshotPrimed;
snap.docChanges().forEach(change => {
if (change.type === 'removed') { byId.delete(change.doc.id); return; }
byId.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
if (wasPrimed && change.type === 'added') {
const m = change.doc.data();
const isMine = m.fromUserId === curUser.uid;
const canSeeWhisper = m.type === 'whisper' &&
(isMine || m.toUserId === curUser.uid || isTableOwner());
const tabVisible = chatPopupOpen && !chatMinimized && chatChannel === m.type;
if (!isMine && !tabVisible) {
if (m.type === 'general') chatUnread.general++;
else if (canSeeWhisper) chatUnread.whisper++;
}
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
function chatRequestNotifPermission() {
if (!('Notification' in window)) return;
if (Notification.permission === 'default') Notification.requestPermission().catch(() => {});
}
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
} catch (e) {  }
}
function chatShowDesktopNotif(title, body) {
if (!('Notification' in window) || Notification.permission !== 'granted') return;
try {
const n = new Notification(title, { body, tag: 'heartsoul-chat-' + Date.now() });
n.onclick = () => { window.focus(); openChatPopup(); n.close(); };
} catch (e) {  }
}
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
chatRequestNotifPermission();
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
const CHAT_GROUP_WINDOW_MS = 5 * 60 * 1000;
function renderChatMessages() {
const box = document.getElementById('chatMessages');
if (!box) return;
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
let lastGroupKey = null;
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
lastGroupKey = null;
}
}
let who, rowClasses, avatarHtml;
if (masterObserving) {
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
const editBox = box.querySelector('.chat-edit-input');
if (editBox) { editBox.focus(); editBox.setSelectionRange(editBox.value.length, editBox.value.length); }
} else {
scrollChatToBottom();
}
}
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
function chatRenderContent(content) {
let html = escapeHtml(content);
chatAllRenderCandidates()
.slice()
.sort((a, b) => (b.name || '').length - (a.name || '').length)
.forEach(c => {
if (!c.name) return;
const token = escapeHtml('@' + c.name);
if (!html.includes(token)) return;
const cls = c.uid === curUser.uid ? 'chat-mention me' : 'chat-mention';
html = html.split(token).join(`<span class="${cls}">${token}</span>`);
});
return html;
}
function startEditChatMessage(id) {
const m = chatMessagesCache.find(x => x.id === id);
if (!m || m.fromUserId !== curUser.uid) return;
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
const CHAT_TYPING_TTL_MS = 6000;
const CHAT_TYPING_STOP_DELAY_MS = 4000;
function markChatTyping() {
if (!curTable || !curUser) return;
if (chatChannel !== 'general' && !chatTargetUid) return;
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
function chatTypingBeforeUnload() {
if (curTable && curUser) {
db.collection('tables').doc(curTable.id).collection('typing').doc(curUser.uid).delete().catch(() => {});
}
}
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
if (change.doc.id === curUser.uid) return;
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
if (masterObserving) return true;
return t.uid === chatTargetUid && t.toUserId === curUser.uid;
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

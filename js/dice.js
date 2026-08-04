// ============================================================
// Rolagem de Dados — estilo "bot de Discord"
// O jogador digita um comando (ex: d20, 2d6+3, 2#d20, 4#d6kl2,
// 1d5+1d6+3+1d4, 2#5d20, 2d20+2#1d20) em vez de escolher o dado com
// cliques. Suporta:
//   NdX              -> soma N dados de X lados (N padrão = 1)
//   NdX+MdY+...+K     -> soma livre de vários grupos de dados diferentes
//                        e modificadores fixos (atributo, perícia etc.),
//                        cada termo separado por + ou -
//   N#MdX            -> rola o grupo "MdX" (M dados de X lados, somados)
//                        N vezes SEPARADAMENTE e mantém a tentativa de
//                        maior soma (vantagem), a não ser que 'kl' seja
//                        usado. M padrão = 1 (ou seja, N#dX repete um
//                        único dado, como antes) e N padrão = 2.
//   N#MdXkh(k)        -> mantém as k tentativas de maior soma (padrão k=1)
//   N#MdXkl(k)        -> mantém as k de menor soma (desvantagem, padrão k=1)
//   Um grupo N#MdX também pode ser combinado com + ou - dentro de uma
//   expressão maior, como qualquer outro termo (ex: 2d20+2#1d20+3).
// ============================================================

const QUICK_DICE = [4, 6, 8, 10, 12, 20, 100];
let rollHistory = [];

function rollDie(sides) { return 1 + Math.floor(Math.random() * sides); }

const SYNTAX_HELP = 'Exemplos válidos: d20, 2d6+3, 1d5+1d6+3+1d4, 2#d20, 4#d6kl2, 2#5d20, 2d20+2#1d20.';

// ---------- Parser de comando ----------
function parseRollCommand(raw) {
  const cmd = (raw || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!cmd) return { error: 'Digite um comando de rolagem.' };

  // Expressão livre de soma: NdX + MdY + ... + mods + N#MdX + ...,
  // o que cobre desde "d20" simples até "1d5+1d6+3+1d4" e grupos de
  // vantagem/desvantagem ("2#5d20") soltos ou somados a outros termos.
  return parseSumExpression(cmd, raw);
}

// Interpreta um único termo "N#MdX(kh|kl)(k)": rola o grupo MdX N vezes
// separadamente (cada tentativa é a soma de M dados de X lados) e mantém
// as k tentativas de maior (kh) ou menor (kl) soma.
function parseRepeatTerm(text) {
  const m = text.match(/^(\d*)#(\d*)d(\d+)(k[hl])?(\d*)$/);
  if (!m) return { error: `Grupo de repetição inválido: "${text}".` };

  const [, nStr, mStr, xStr, keepMode, keepNStr] = m;
  const sides = parseInt(xStr, 10);
  if (!sides || sides < 2 || sides > 1000) return { error: 'Escolha dados entre d2 e d1000.' };

  let n = nStr ? parseInt(nStr, 10) : 2;
  n = Math.max(2, Math.min(30, n));
  let diceEach = mStr ? parseInt(mStr, 10) : 1;
  diceEach = Math.max(1, Math.min(30, diceEach));

  const groups = Array.from({ length: n }, () => {
    const rolls = Array.from({ length: diceEach }, () => rollDie(sides));
    return { rolls, sum: rolls.reduce((a, b) => a + b, 0) };
  });

  let keepN = keepNStr ? parseInt(keepNStr, 10) : 1;
  keepN = Math.max(1, Math.min(n, keepN));
  const mode = keepMode === 'kl' ? 'kl' : 'kh';
  const sorted = groups.map((g, i) => ({ sum: g.sum, i })).sort((a, b) => mode === 'kl' ? a.sum - b.sum : b.sum - a.sum);
  const keptIdx = new Set(sorted.slice(0, keepN).map(o => o.i));
  const total = groups.reduce((acc, g, i) => acc + (keptIdx.has(i) ? g.sum : 0), 0);

  return { sides, n, diceEach, mode, keepN, groups, keptIdx, total };
}

function formatRepeatDetail(rg) {
  const groupStrs = rg.groups.map((g, i) => {
    const inner = rg.diceEach > 1 ? `${g.rolls.join('+')}=${g.sum}` : `${g.sum}`;
    return rg.keptIdx.has(i) ? `<span class="kept">${inner}</span>` : inner;
  });
  const tag = rg.mode === 'kl'
    ? ' · desvantagem'
    : (rg.keepN === 1 && rg.n === 2 ? ' · vantagem' : ` · melhor ${rg.keepN} de ${rg.n}`);
  return `[${groupStrs.join(', ')}]${tag}`;
}

function parseSumExpression(cmd, raw) {
  // Quebra a expressão em termos: sinal opcional + (grupo N#MdX, NdX
  // simples, ou número puro). A varredura precisa cobrir a string
  // inteira sem sobras — senão tem caractere que o comando não
  // reconhece (typo, símbolo errado etc.).
  const termRe = /([+-]?)(\d*#\d*d\d+(?:k[hl]\d*)?|\d*d\d+|\d+)/gi;
  const terms = [];
  let idx = 0, match;
  while ((match = termRe.exec(cmd)) !== null) {
    if (match.index !== idx) return { error: `Não entendi "${raw}". ${SYNTAX_HELP}` };
    idx = termRe.lastIndex;
    terms.push({ sign: match[1] === '-' ? -1 : 1, text: match[2] });
  }
  if (idx !== cmd.length || terms.length === 0) {
    return { error: `Não entendi "${raw}". ${SYNTAX_HELP}` };
  }

  let total = 0, diceCount = 0;
  const parts = [];
  for (const term of terms) {
    if (term.text.includes('#')) {
      const rg = parseRepeatTerm(term.text);
      if (rg.error) return rg;
      diceCount += rg.n * rg.diceEach;
      if (diceCount > 50) return { error: 'Muitos dados na mesma rolagem — no máximo 50 ao todo.' };
      total += term.sign * rg.total;
      parts.push({ type: 'repeat', sign: term.sign, text: term.text, rg });
      continue;
    }
    const dMatch = term.text.match(/^(\d*)d(\d+)$/);
    if (dMatch) {
      let n = dMatch[1] ? parseInt(dMatch[1], 10) : 1;
      n = Math.max(1, Math.min(30, n));
      const sides = parseInt(dMatch[2], 10);
      if (!sides || sides < 2 || sides > 1000) return { error: 'Escolha dados entre d2 e d1000.' };
      diceCount += n;
      if (diceCount > 50) return { error: 'Muitos dados na mesma rolagem — no máximo 50 ao todo.' };
      const rolls = Array.from({ length: n }, () => rollDie(sides));
      const sum = rolls.reduce((a, b) => a + b, 0);
      total += term.sign * sum;
      parts.push({ type: 'dice', sign: term.sign, n, sides, rolls, sum });
    } else {
      const value = parseInt(term.text, 10);
      total += term.sign * value;
      parts.push({ type: 'mod', sign: term.sign, value });
    }
  }
  if (diceCount === 0) return { error: `Inclua ao menos um dado na rolagem, ex: 1d20+3.` };

  const label = terms.map((t, i) => (i === 0 ? (t.sign < 0 ? '-' : '') : (t.sign < 0 ? ' - ' : ' + ')) + t.text).join('');
  const detail = parts.map(p => {
    if (p.type === 'repeat') return `${p.sign < 0 ? '-' : ''}${p.text}${formatRepeatDetail(p.rg)}`;
    if (p.type === 'dice') return `${p.sign < 0 ? '-' : ''}${p.n}d${p.sides}[${p.rolls.join(', ')}]`;
    return (p.sign < 0 ? '-' : '+') + p.value;
  }).join('  ');

  const allRolls = parts.flatMap(p => {
    if (p.type === 'dice') return p.rolls;
    if (p.type === 'repeat') return p.rg.groups.flatMap(g => g.rolls);
    return [];
  });

  const isSingleD20 = parts.length === 1 && parts[0].type === 'dice' && parts[0].n === 1 && parts[0].sides === 20 && parts[0].sign === 1;
  const isSingleRepeatD20 = parts.length === 1 && parts[0].type === 'repeat' && parts[0].sign === 1 &&
    parts[0].rg.diceEach === 1 && parts[0].rg.sides === 20 && parts[0].rg.keepN === 1;

  let isNat20 = isSingleD20 && parts[0].rolls[0] === 20;
  let isNat1 = isSingleD20 && parts[0].rolls[0] === 1;
  if (isSingleRepeatD20) {
    const rg = parts[0].rg;
    const keptSum = rg.total; // com diceEach=1 e keepN=1, é o próprio valor do dado mantido
    isNat20 = rg.mode === 'kh' && keptSum === 20;
    isNat1 = rg.mode === 'kl' && keptSum === 1;
  }

  return { ok: true, label, detail, total, rolls: allRolls, kept: allRolls, sides: null, n: diceCount, isNat20, isNat1 };
}

// ---------- Som de dados rolando (sintetizado, sem depender de arquivo externo) ----------
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playDiceSound(numDice) {
  if (!document.getElementById('soundToggle')?.checked) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const clicks = Math.min(16, 6 + numDice * 2);
  const spread = 0.34;

  for (let i = 0; i < clicks; i++) {
    const t = now + (i / clicks) * spread * (0.5 + Math.random() * 0.9);
    const bufSize = Math.floor(ctx.sampleRate * 0.018);
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let j = 0; j < bufSize; j++) data[j] = (Math.random() * 2 - 1) * (1 - j / bufSize);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 700 + Math.random() * 2200;
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.value = 0.12 + Math.random() * 0.1;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t);
  }

  // "thud" final quando os dados param
  const thudTime = now + spread + 0.02;
  const osc = ctx.createOscillator();
  const oGain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(170, thudTime);
  osc.frequency.exponentialRampToValueAtTime(55, thudTime + 0.16);
  oGain.gain.setValueAtTime(0.22, thudTime);
  oGain.gain.exponentialRampToValueAtTime(0.001, thudTime + 0.22);
  osc.connect(oGain).connect(ctx.destination);
  osc.start(thudTime);
  osc.stop(thudTime + 0.24);
}

// ---------- Renderização ----------
function renderQuickRow() {
  const el = document.getElementById('quickRow');
  el.innerHTML = QUICK_DICE.map(f => `<button type="button" class="quick-btn" data-quick="d${f}">d${f}</button>`).join('') +
    `<button type="button" class="quick-btn" data-quick="2#d20">Vantagem</button>` +
    `<button type="button" class="quick-btn" data-quick="2#d20kl">Desvantagem</button>`;
  el.querySelectorAll('[data-quick]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('cmdInput').value = btn.dataset.quick;
      document.getElementById('cmdInput').focus();
    });
  });
}

function renderLog() {
  const el = document.getElementById('rollLog');
  if (!rollHistory.length) {
    el.innerHTML = '<p class="empty-log">Nenhuma rolagem ainda. Digite um comando acima.</p>';
    return;
  }
  el.innerHTML = rollHistory.slice().reverse().map(h => `
    <div class="roll-entry">
      <div class="re-head">
        <span class="re-cmd">${escapeHtml(h.label)}</span>
        <span class="re-total${h.isNat20 ? ' crit' : ''}${h.isNat1 ? ' fail' : ''}">${h.total}</span>
      </div>
      <div class="re-detail">${h.detail}${h.isNat20 ? ' · 🎉 20 natural!' : ''}${h.isNat1 ? ' · 💀 1 natural' : ''}</div>
    </div>`).join('');
}

function doRoll() {
  const input = document.getElementById('cmdInput');
  const errEl = document.getElementById('cmdError');
  const result = parseRollCommand(input.value);

  if (result.error) {
    errEl.textContent = result.error;
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';

  playDiceSound(result.n);

  rollHistory.push(result);
  if (rollHistory.length > 60) rollHistory.shift();
  renderLog();
  input.value = '';
  input.focus();
}

document.getElementById('rollBtn').addEventListener('click', doRoll);
document.getElementById('cmdInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); doRoll(); }
});
document.getElementById('clearHistoryBtn').addEventListener('click', () => { rollHistory = []; renderLog(); });

guardPage(null, (user, profile) => {
  renderTopbar(profile);
  renderQuickRow();
  renderLog();
});

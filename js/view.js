const DATA_V = window.HEARTSOUL_DATA;
const ATTR_LABELS_V = { forca: 'Força', foco: 'Foco', vontade: 'Vontade', intelecto: 'Intelecto', destreza: 'Destreza', constituicao: 'Constituição' };
const BODY_PARTS_V = [
  ['cabeca', 'Cabeça'], ['tronco', 'Tronco'],
  ['braco_esq', 'Braço Esquerdo'], ['braco_dir', 'Braço Direito'],
  ['perna_esq', 'Perna Esquerda'], ['perna_dir', 'Perna Direita']
];
const ATTR_NAME_TO_KEY_V = {
  'Força': 'forca', 'Foco': 'foco', 'Vontade': 'vontade',
  'Intelecto': 'intelecto', 'Destreza': 'destreza', 'Constituição': 'constituicao'
};

function attrModV(v) { return Math.floor(v / 2); }
const COIN_TYPES_V = [
  ['bronze', 'Bronze'], ['prata', 'Prata'], ['ouro', 'Ouro'], ['platina', 'Platina']
];
function economyTotalInBronzeV(eco) {
  return (eco.bronze || 0) + (eco.prata || 0) * 10 + (eco.ouro || 0) * 100 + (eco.platina || 0) * 1000;
}

// Mesma lógica de compatibilidade do editor: mostra custo estruturado
// (quantidade + tipo) quando existe, senão cai no texto livre antigo.
function abilityCostLabelV(a) {
  if (a.costAmount && a.costType) return `${a.costAmount} ${a.costType}`;
  return a.costLegacyText || a.cost || '';
}

// Mesma leitura "melhor esforço" de bônus de atributo a partir do texto dos
// traços usada no editor — ver comentário equivalente em editor.js.
function parseAttrBonusesFromTextV(text) {
  const bonuses = {};
  if (!text) return bonuses;
  const re = /\+(\d+)\s*(Força|Foco|Vontade|Intelecto|Destreza|Constituição)\b/g;
  let m;
  while ((m = re.exec(text))) {
    const key = ATTR_NAME_TO_KEY_V[m[2]];
    bonuses[key] = (bonuses[key] || 0) + parseInt(m[1]);
  }
  return bonuses;
}
function traitAttrBonusesV(s) {
  const texts = [];
  if (s.raceFixedTrait) texts.push(s.raceFixedTrait);
  if (s.raceVariantTrait) texts.push(s.raceVariantTrait);
  (s.raceOptionalTraits || []).forEach(t => texts.push(t));
  (s.raceTraitsBought || []).forEach(t => texts.push(t));
  let bgAtributos = s.backgroundAtributos;
  if (!bgAtributos && s.backgroundId) {
    const bgFallback = DATA_V.backgrounds.find(b => b.id === s.backgroundId);
    bgAtributos = bgFallback && bgFallback.atributos;
  }
  if (bgAtributos) texts.push(bgAtributos);
  (s.extraTraits || []).forEach(t => texts.push(t.desc));
  const total = { forca: 0, foco: 0, vontade: 0, intelecto: 0, destreza: 0, constituicao: 0 };
  texts.map(parseAttrBonusesFromTextV).forEach(b => {
    Object.keys(b).forEach(k => { total[k] += b[k]; });
  });
  return total;
}

function renderLineListView(items) {
  const cleaned = (items || []).map(s => (s || '').trim()).filter(Boolean);
  if (!cleaned.length) return '<p class="hint" style="margin:0;">Nada registrado ainda.</p>';
  return `<div class="sheet-line-list">${cleaned.map(v => `<div class="li">${escapeHtml(v)}</div>`).join('')}</div>`;
}

// ================= INVENTÁRIO (visualização) =================
// Mesma lógica de peso do editor (js/editor-core.js: carryCapacity,
// inventoryTotalWeight, weightStatus) reimplementada aqui porque view.js
// não carrega os scripts do editor. Compatível com fichas antigas, cujos
// itens eram strings soltas sem peso.
function ensureInventoryItemShapeV(it) {
  if (typeof it === 'string') return { name: it, weight: 0, qty: 1 };
  return {
    name: (it && it.name) || '',
    weight: (it && it.weight !== undefined && it.weight !== null) ? it.weight : 0,
    qty: (it && it.qty !== undefined && it.qty !== null) ? it.qty : 1
  };
}
function carryCapacityV(constTotal) { return 15 + attrModV(constTotal); }
function inventoryTotalWeightV(items) {
  return items.reduce((sum, it) => {
    const w = parseFloat(it.weight) || 0;
    const q = parseInt(it.qty, 10);
    return sum + w * (isNaN(q) ? 1 : q);
  }, 0);
}
function weightStatusV(total, capacity) {
  const cap = capacity > 0 ? capacity : 1;
  if (total > cap) {
    const excess = total - cap;
    return {
      key: 'sobrecarga', label: 'Sobrecarga',
      penalty: -5 - 2 * excess,
      note: `Deslocamento reduzido à metade; não pode correr ou esquivar. ${excess} ponto(s) de peso excedente(s)${excess > 5 ? ' — acima do limite de +5 recomendado pelo livro de regras (a critério do mestre).' : '.'}`
    };
  }
  if (total === cap) return { key: 'maxima', label: 'Carga Máxima', penalty: -5, note: 'Deslocamento reduzido em 2 metros.' };
  if (total >= cap * 0.5) return { key: 'pesada', label: 'Carga Pesada', penalty: -2, note: '' };
  return { key: 'normal', label: 'Normal', penalty: 0, note: '' };
}
function renderInventoryView(rawItems, constTotal) {
  const items = (rawItems || []).map(ensureInventoryItemShapeV).filter(it => it.name.trim());
  const capacity = carryCapacityV(constTotal);
  const total = inventoryTotalWeightV(items);
  const st = weightStatusV(total, capacity);
  const tagClass = st.key === 'normal' ? 'benign' : (st.key === 'pesada' ? 'info' : 'malign');
  const tableHtml = items.length
    ? `<table class="sheet-inventory-table">
        <thead><tr><th>Item</th><th>Peso</th><th>Qtd.</th><th>Subtotal</th></tr></thead>
        <tbody>${items.map(it => `<tr><td>${escapeHtml(it.name)}</td><td>${it.weight}</td><td>${it.qty}</td><td>${(it.weight * it.qty)}</td></tr>`).join('')}</tbody>
      </table>`
    : '<p class="hint" style="margin:0;">Nada registrado ainda.</p>';
  return `
    ${tableHtml}
    <div class="weight-summary" style="margin-top:10px;">
      <div class="weight-summary-row">
        <span>Peso total: <b style="color:var(--gold);">${total}</b> / ${capacity} (Capacidade de Carga)</span>
        <span class="tag ${tagClass}">${st.label}</span>
      </div>
      ${st.penalty ? `<p class="hint" style="margin:6px 0 0;">${st.penalty} em todos os testes físicos (Força, Destreza e Constituição)${st.note ? ' · ' + st.note : ''}</p>` : ''}
    </div>`;
}

// ================= EDIÇÃO DE TRAÇOS PELO MESTRE =================
// Painel exclusivo da aba "Mestre": deixa editar o Traço Fixo da raça e a
// lista de Traços Adicionais direto na ficha, sem passar pelo assistente de
// criação (ficha-editor.html). É o que permite continuar o RPG quando um
// traço evolui ou dois traços se fundem em um só, no meio de uma campanha.
// Os bônus de atributo (aba Jogador) usam a mesma leitura "melhor esforço"
// de padrões como "+2 Força" no texto de cada traço (ver traitAttrBonusesV
// acima) — então qualquer edição feita aqui já entra automaticamente nos
// totais de atributo assim que for salva, sem precisar de nenhum código
// separado pra isso.
let masterFixedTraitDraft = null; // texto do Traço Fixo em edição (não salvo ainda)
let masterTraitDraft = null; // cópia de trabalho de s.extraTraits em edição (não salva ainda)
let masterRaceOptDraft = null; // cópia de trabalho de s.raceOptionalTraits (os 2 escolhidos grátis)
let masterRaceBoughtDraft = null; // cópia de trabalho de s.raceTraitsBought (comprados com Pontos de Traço)

function newMasterTrait() {
  return { cat: 'mestre_benign', name: '', cost: 0, desc: '' };
}

// Lista simples de textos (usada pros 2 grupos de traço racial, que são
// guardados como strings soltas "Nome: Descrição", sem custo/categoria
// próprios). "kind" é só usado nos atributos data-* pra saber qual das duas
// listas (e qual draft) uma linha pertence.
function masterStringListHtml(list, kind) {
  if (!list.length) return '<p class="hint" style="margin:0 0 10px;">Nenhum traço aqui ainda.</p>';
  return list.map((val, i) => `
    <div class="master-trait-row">
      <div class="field" style="margin-bottom:8px;">
        <textarea data-mstr="${kind}:${i}" placeholder="Nome: Descrição do traço racial" style="min-height:70px;">${escapeHtml(val)}</textarea>
      </div>
      <button type="button" class="btn danger small" data-mstr-remove="${kind}:${i}" style="width:auto;">Remover</button>
    </div>`).join('');
}

function masterTraitEditorHtml(s) {
  if (masterFixedTraitDraft === null) masterFixedTraitDraft = s.raceFixedTrait || '';
  if (!masterTraitDraft) masterTraitDraft = (s.extraTraits || []).map(t => Object.assign({}, t));
  if (!masterRaceOptDraft) masterRaceOptDraft = (s.raceOptionalTraits || []).slice();
  if (!masterRaceBoughtDraft) masterRaceBoughtDraft = (s.raceTraitsBought || []).slice();

  const rows = masterTraitDraft.map((t, i) => `
    <div class="master-trait-row" data-trait-row="${i}">
      <div class="field-row">
        <div class="field">
          <label>Nome do traço</label>
          <input type="text" data-mt-name="${i}" value="${escapeHtml(t.name || '')}" placeholder="Nome do traço">
        </div>
        <div class="field">
          <label>Custo (Pts. de Traço)</label>
          <input type="number" min="0" data-mt-cost="${i}" value="${t.cost || 0}">
        </div>
      </div>
      <div class="field">
        <label>Descrição</label>
        <textarea data-mt-desc="${i}" placeholder='Descrição do traço — use algo como "+2 Força" para dar bônus automático de atributo'>${escapeHtml(t.desc || '')}</textarea>
      </div>
      <div class="field-row" style="align-items:end;">
        <div class="field" style="margin-bottom:0;">
          <label>Natureza</label>
          <select data-mt-cat="${i}">
            <option value="benign" ${!(t.cat || '').endsWith('_malign') ? 'selected' : ''}>Benigno</option>
            <option value="malign" ${(t.cat || '').endsWith('_malign') ? 'selected' : ''}>Maligno</option>
          </select>
        </div>
        <button type="button" class="btn danger small" data-mt-remove="${i}" style="width:auto; margin-bottom:2px;">Remover traço</button>
      </div>
    </div>`).join('');

  return `
    <div class="panel master-trait-editor">
      <h2>Editar Traços (Mestre)</h2>
      <p class="hint" style="margin-top:-10px;">Visível e editável apenas pelo Mestre. Use quando um traço evoluir ou se fundir com outro durante o RPG — os bônus de atributo do personagem são recalculados sozinhos a partir do texto de cada traço.</p>

      <div class="sheet-section-title" style="margin-top:0;">Traço Fixo da Raça</div>
      <div class="field">
        <textarea id="masterFixedTraitInput" style="min-height:100px;">${escapeHtml(masterFixedTraitDraft)}</textarea>
      </div>

      <div class="sheet-section-title">Traços Raciais Opcionais (escolhidos na criação)</div>
      <div id="masterRaceOptRows">${masterStringListHtml(masterRaceOptDraft, 'opt')}</div>
      <button type="button" class="btn secondary small" id="masterAddRaceOptBtn" style="width:auto;">+ Adicionar traço opcional</button>

      <div class="sheet-section-title">Traços Raciais Extras (comprados com Pontos de Traço)</div>
      <div id="masterRaceBoughtRows">${masterStringListHtml(masterRaceBoughtDraft, 'bought')}</div>
      <button type="button" class="btn secondary small" id="masterAddRaceBoughtBtn" style="width:auto;">+ Adicionar traço comprado</button>

      <div class="sheet-section-title">Traços Adicionais</div>
      <div id="masterTraitRows">${rows || '<p class="hint" style="margin:0 0 12px;">Nenhum traço adicional ainda.</p>'}</div>
      <button type="button" class="btn secondary small" id="masterAddTraitBtn" style="width:auto;">+ Adicionar traço</button>

      <div style="margin-top:18px; display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
        <button type="button" class="btn small" id="masterSaveTraitsBtn" style="width:auto;">Salvar Traços</button>
        <span id="masterTraitsMsg" style="font-size:13px; color:var(--benign);"></span>
      </div>
    </div>`;
}

function rerenderMasterTraitEditor(s, sheetId, onSaved) {
  const container = document.querySelector('.master-trait-editor');
  if (!container) return;
  container.outerHTML = masterTraitEditorHtml(s);
  wireMasterTraitEditor(s, sheetId, onSaved);
}

function wireMasterTraitEditor(s, sheetId, onSaved) {
  const fixedInput = document.getElementById('masterFixedTraitInput');
  fixedInput.addEventListener('input', () => { masterFixedTraitDraft = fixedInput.value; });

  // Os dois grupos de traço racial (opcional escolhido / comprado) usam a
  // mesma lógica: um data-mstr="opt:0" ou "bought:0" identifica o draft e o
  // índice; um data-mstr-remove no mesmo formato remove aquela linha.
  function wireStringList(containerId, draftGetter) {
    const listBox = document.getElementById(containerId);
    if (!listBox) return;
    listBox.querySelectorAll('[data-mstr]').forEach(ta => {
      ta.addEventListener('input', () => {
        const i = parseInt(ta.dataset.mstr.split(':')[1]);
        draftGetter()[i] = ta.value;
      });
    });
    listBox.querySelectorAll('[data-mstr-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.mstrRemove.split(':')[1]);
        draftGetter().splice(i, 1);
        rerenderMasterTraitEditor(s, sheetId, onSaved);
      });
    });
  }
  wireStringList('masterRaceOptRows', () => masterRaceOptDraft);
  wireStringList('masterRaceBoughtRows', () => masterRaceBoughtDraft);
  document.getElementById('masterAddRaceOptBtn').addEventListener('click', () => {
    masterRaceOptDraft.push('');
    rerenderMasterTraitEditor(s, sheetId, onSaved);
  });
  document.getElementById('masterAddRaceBoughtBtn').addEventListener('click', () => {
    masterRaceBoughtDraft.push('');
    rerenderMasterTraitEditor(s, sheetId, onSaved);
  });

  const box = document.getElementById('masterTraitRows');
  box.querySelectorAll('[data-mt-name]').forEach(inp => {
    inp.addEventListener('input', () => { masterTraitDraft[parseInt(inp.dataset.mtName)].name = inp.value; });
  });
  box.querySelectorAll('[data-mt-cost]').forEach(inp => {
    inp.addEventListener('input', () => { masterTraitDraft[parseInt(inp.dataset.mtCost)].cost = parseInt(inp.value) || 0; });
  });
  box.querySelectorAll('[data-mt-desc]').forEach(ta => {
    ta.addEventListener('input', () => { masterTraitDraft[parseInt(ta.dataset.mtDesc)].desc = ta.value; });
  });
  box.querySelectorAll('[data-mt-cat]').forEach(sel => {
    sel.addEventListener('change', () => {
      const i = parseInt(sel.dataset.mtCat);
      // Mantém a base da categoria original (usada em outros lugares pra
      // agrupar traços por tipo) e só troca o sufixo _benign/_malign; um
      // traço novo criado aqui já nasce com a categoria genérica "mestre_*".
      const base = (masterTraitDraft[i].cat || 'mestre_benign').replace(/_(benign|malign)$/, '');
      masterTraitDraft[i].cat = `${base}_${sel.value}`;
    });
  });
  box.querySelectorAll('[data-mt-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      masterTraitDraft.splice(parseInt(btn.dataset.mtRemove), 1);
      rerenderMasterTraitEditor(s, sheetId, onSaved);
    });
  });

  document.getElementById('masterAddTraitBtn').addEventListener('click', () => {
    masterTraitDraft.push(newMasterTrait());
    rerenderMasterTraitEditor(s, sheetId, onSaved);
  });

  document.getElementById('masterSaveTraitsBtn').addEventListener('click', async () => {
    const msg = document.getElementById('masterTraitsMsg');
    const btn = document.getElementById('masterSaveTraitsBtn');
    const fixedTraitVal = fixedInput.value.trim();
    const cleanedTraits = masterTraitDraft
      .map(t => ({ cat: t.cat || 'mestre_benign', name: (t.name || '').trim(), cost: parseInt(t.cost) || 0, desc: (t.desc || '').trim() }))
      .filter(t => t.name || t.desc);
    const cleanedRaceOpt = masterRaceOptDraft.map(t => t.trim()).filter(Boolean);
    const cleanedRaceBought = masterRaceBoughtDraft.map(t => t.trim()).filter(Boolean);
    btn.disabled = true;
    msg.style.color = 'var(--benign)';
    msg.textContent = 'Salvando…';
    try {
      await db.collection('sheets').doc(sheetId).update({
        raceFixedTrait: fixedTraitVal,
        extraTraits: cleanedTraits,
        raceOptionalTraits: cleanedRaceOpt,
        raceTraitsBought: cleanedRaceBought
      });
      s.raceFixedTrait = fixedTraitVal;
      s.extraTraits = cleanedTraits;
      s.raceOptionalTraits = cleanedRaceOpt;
      s.raceTraitsBought = cleanedRaceBought;
      masterFixedTraitDraft = fixedTraitVal;
      masterTraitDraft = cleanedTraits.map(t => Object.assign({}, t));
      masterRaceOptDraft = cleanedRaceOpt.slice();
      masterRaceBoughtDraft = cleanedRaceBought.slice();
      msg.textContent = 'Traços salvos — atributos recalculados.';
      setTimeout(() => { const m = document.getElementById('masterTraitsMsg'); if (m) m.textContent = ''; }, 3500);
      onSaved && onSaved(s);
    } catch (err) {
      msg.style.color = 'var(--seal-bright)';
      msg.textContent = 'Erro ao salvar: ' + err.message;
    } finally {
      btn.disabled = false;
    }
  });
}

function renderSheet(s, ownerProfile, canManage, sheetId, isMaster, activeTab) {
  const el = document.getElementById('content');
  const traitBonuses = traitAttrBonusesV(s);
  const manualBonus = s.attrManualBonus || {};
  // Usado tanto pelo grid de atributos quanto pelo painel de Capacidade de
  // Carga do inventário (ver renderInventoryView), que depende da
  // Constituição total (base + bônus de traço/antecedente + ajuste manual).
  const constTotalV = (s.attributes.constituicao || 0) + (traitBonuses.constituicao || 0) + (manualBonus.constituicao || 0);
  const attrHtml = Object.entries(ATTR_LABELS_V).map(([k, label]) => {
    const base = s.attributes[k];
    const tb = traitBonuses[k] || 0;
    const mb = manualBonus[k] || 0;
    const total = base + tb + mb;
    const mod = attrModV(total);
    const bonusNote = (tb || mb) ? `<div class="hint" style="margin:2px 0 0; font-size:11px;">base ${base}${tb ? ` +${tb} bônus` : ''}${mb ? ` ${mb >= 0 ? '+' + mb : mb} ajuste` : ''}</div>` : '';
    return `<div class="sum-attr"><div class="sa-name">${label}</div><div class="sa-val">${total}</div><div class="hint" style="margin:0;">${mod >= 0 ? '+' : ''}${mod}</div>${bonusNote}</div>`;
  }).join('');

  const bgSkillsHtml = (s.backgroundSkills || []).length
    ? `<div class="sheet-section-title">Perícias Extras (Antecedente)</div>
       <div class="extra-skills-row">${s.backgroundSkills.map(n => `<span class="extra-skill-chip">${escapeHtml(n)}</span>`).join('')}</div>`
    : '';

  const skillsHtml = (s.skills || []).length
    ? s.skills.map(sk => `<div class="li"><b>${escapeHtml(sk.name)}</b> — +${sk.points}</div>`).join('')
    : '<p class="hint" style="margin:0;">Nenhuma perícia registrada.</p>';

  const raceTraitCardHtml = (t) => {
    const { name, desc } = raceTraitNameDesc(t);
    return `<div class="li"><b>${escapeHtml(name)}</b>${desc ? formatTraitBody(desc) : ''}</div>`;
  };
  const raceOptHtml = (s.raceOptionalTraits || []).map(raceTraitCardHtml).join('');
  const raceBoughtHtml = (s.raceTraitsBought || []).map(raceTraitCardHtml).join('');

  const traitsHtml = (s.extraTraits || []).length
    ? s.extraTraits.map(t => `<div class="li"><b>${escapeHtml(t.name)}</b> ${t.cat.endsWith('_malign') ? '<span class="tag malign">Maligno</span>' : '<span class="tag benign">Benigno</span>'} — ${escapeHtml(t.desc)}</div>`).join('')
    : '<p class="hint" style="margin:0;">Nenhum traço adicional.</p>';

  const traitLimit = 6 + (s.traitBonusFromInspiration || 0);

  const abilitiesHtml = (s.abilities || []).length
    ? s.abilities.map(a => `<div class="li"><b>${escapeHtml(a.name)}</b>${a.actionType ? ` <span class="atype">${escapeHtml(a.actionType)}</span>` : ''}${abilityCostLabelV(a) ? ` — <span style="color:var(--ink-mute);">${escapeHtml(abilityCostLabelV(a))}</span>` : ''}${a.desc ? `<div style="margin-top:2px;">${escapeHtml(a.desc)}</div>` : ''}</div>`).join('')
    : '<p class="hint" style="margin:0;">Nenhuma habilidade registrada.</p>';

  const techniqueCostLabelV = (t) => t.cost || (t.costAmount && t.costType ? `${t.costAmount} ${t.costType}` : '');
  const techniquesHtml = (s.techniques || []).length
    ? s.techniques.map(t => `<div class="li"><b>${escapeHtml(t.name)}</b>${t.actionType ? ` <span class="atype">${escapeHtml(t.actionType)}</span>` : ''}${techniqueCostLabelV(t) ? ` — <span style="color:var(--ink-mute);">${escapeHtml(techniqueCostLabelV(t))}</span>` : ''}${t.desc ? `<div style="margin-top:2px;">${escapeHtml(t.desc)}</div>` : ''}</div>`).join('')
    : '<p class="hint" style="margin:0;">Nenhuma técnica registrada.</p>';

  const res = s.resources || {};
  const hp = res.hp || {};
  // Compatibilidade: fichas antigas tinham "Braços"/"Pernas" como uma peça
  // só. Ao exibir, o valor antigo aparece nos dois lados até a ficha ser
  // reaberta e salva no editor (que já faz a migração definitiva).
  if (hp.bracos && !hp.braco_esq && !hp.braco_dir) {
    hp.braco_esq = hp.braco_dir = { max: hp.bracos.max, cur: hp.bracos.cur };
  }
  if (hp.pernas && !hp.perna_esq && !hp.perna_dir) {
    hp.perna_esq = hp.perna_dir = { max: hp.pernas.max, cur: hp.pernas.cur };
  }
  const hpHtml = BODY_PARTS_V.map(([k, label]) => {
    const part = hp[k] || { max: 0, cur: 0 };
    return `<div class="sum-attr"><div class="sa-name">${label}</div><div class="sa-val" style="font-size:15px;">${part.cur}/${part.max}</div></div>`;
  }).join('');
  const econ = res.economy || { bronze: 0, prata: 0, ouro: 0, platina: 0 };
  const sanityMaxV = 10 + attrModV((s.attributes.vontade || 0) + (traitBonuses.vontade || 0) + (manualBonus.vontade || 0));
  const sanityCurV = (res.sanityCur === null || res.sanityCur === undefined) ? sanityMaxV : res.sanityCur;

  // ---- Coluna lateral fixa: retrato + o que se consulta o tempo todo
  // numa mesa (Recursos, Atributos) — o resto flui na coluna principal,
  // sem precisar rolar a ficha inteira pra comparar HP com Atributos.
  const sheetSideHtml = `
    <div class="sheet-portrait">
      ${s.appearanceImage
        ? `<img src="${escapeHtml(s.appearanceImage)}" alt="Aparência de ${escapeHtml(s.characterName || 'personagem')}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'no-img',textContent:'👤'}));">`
        : `<div class="no-img">👤</div>`}
    </div>

    <div class="panel">
      <h2>Recursos</h2>
      <div class="sheet-section-title" style="margin-top:0;">HP por partes do corpo</div>
      <div class="sheet-summary-grid">${hpHtml}</div>
      <div class="sheet-section-title">Sanidade</div>
      <p class="sheet-list">${sanityCurV} / ${sanityMaxV}</p>
      <div class="sheet-section-title">Estamina</div>
      <p class="sheet-list">${res.estaminaCur || 0} / ${res.estaminaMax || 0}</p>
      <div class="sheet-section-title">Energia</div>
      <p class="sheet-list">${res.vigorCur || 0} / ${res.vigorMax || 0}</p>
      <div class="sheet-section-title">Economia</div>
      <div class="sheet-summary-grid">${COIN_TYPES_V.map(([k, label]) => `<div class="sum-attr"><div class="sa-name">${label}</div><div class="sa-val" style="font-size:15px;">${(econ[k] || 0)}</div></div>`).join('')}</div>
      <p class="hint" style="margin:8px 0 0;">Total equivalente: ${economyTotalInBronzeV(econ)} Bronzes.</p>
    </div>

    <div class="panel">
      <h2>Atributos</h2>
      <div class="sheet-summary-grid">${attrHtml}</div>
    </div>
  `;

  const sheetMainHtml = `
    <div class="panel">
      <h2>Perícias</h2>
      ${bgSkillsHtml}
      <div class="sheet-list">${skillsHtml}</div>
    </div>

    <div class="panel">
      <h2>Habilidades e Técnicas</h2>
      <div class="sheet-list">${abilitiesHtml}</div>
      <div class="sheet-section-title">Técnicas</div>
      <div class="sheet-list">${techniquesHtml}</div>
    </div>

    <div class="panel">
      <h2>Raça — ${escapeHtml(s.raceName)}</h2>
      <div class="sheet-section-title">Traço Fixo</div>
      ${(() => {
        const { name: fixedName, desc: fixedBody } = raceTraitNameDesc(s.raceFixedTrait);
        return `<div class="sheet-list"><div class="li"><b>${escapeHtml(fixedName)}</b>${fixedBody ? formatTraitBody(fixedBody) : ''}</div></div>`;
      })()}
      ${s.raceVariantTrait ? `<div class="sheet-section-title">Variação</div><p class="sheet-list">${escapeHtml(s.raceVariantTrait)}</p>` : ''}
      <div class="sheet-section-title">Traços Opcionais Escolhidos</div>
      <div class="sheet-list">${raceOptHtml}</div>
      ${raceBoughtHtml ? `<div class="sheet-section-title">Traços Extras Comprados (Pontos de Traço)</div><div class="sheet-list">${raceBoughtHtml}</div>` : ''}
    </div>

    <div class="panel">
      <h2>Traços Adicionais</h2>
      <p class="hint" style="margin:-4px 0 12px;">Pontos de Inspiração: <b style="color:var(--gold)">${s.inspirationPoints || 0}</b> · Limite de traço atual: <b style="color:var(--gold)">${traitLimit}</b> (3 Inspiração = 1 Ponto de Traço)</p>
      <div class="sheet-list">${traitsHtml}</div>
    </div>

    ${s.backgroundName ? `<div class="panel">
      <h2>Antecedente — ${escapeHtml(s.backgroundName)}</h2>
      ${(() => {
        const bgFallback = (!s.backgroundDesc && s.backgroundId) ? DATA_V.backgrounds.find(b => b.id === s.backgroundId) : null;
        const desc = s.backgroundDesc || (bgFallback && bgFallback.desc) || '';
        const atributos = s.backgroundAtributos || (bgFallback && bgFallback.atributos) || '';
        return `${desc ? `<p class="sheet-list">${escapeHtml(desc)}</p>` : ''}${atributos ? `<p class="sheet-list"><b style="color:var(--gold)">Atributos:</b> ${escapeHtml(atributos)}</p>` : ''}`;
      })()}
    </div>` : ''}

    ${(s.history || (s.inventoryItems && s.inventoryItems.length) || (s.notes && s.notes.length)) ? `<div class="panel">
      <h2>Detalhes</h2>
      ${s.history ? `<div class="sheet-section-title" style="margin-top:0;">História</div><p class="sheet-list" style="white-space:pre-wrap;">${escapeHtml(s.history)}</p>` : ''}
      <div class="sheet-section-title" style="${s.history ? '' : 'margin-top:0;'}">Inventário</div>
      ${renderInventoryView(s.inventoryItems, constTotalV)}
      <div class="sheet-section-title">Anotações</div>
      ${renderLineListView(s.notes)}
    </div>` : ''}
  `;

  const playerTabHtml = `
    <div class="sheet-layout">
      <div class="sheet-side">${sheetSideHtml}</div>
      <div class="sheet-main">${sheetMainHtml}</div>
    </div>
  `;

  const masterTabHtml = `
    <div class="panel master-notes-box">
      <h2>Anotações do Mestre</h2>
      <p class="hint" style="margin-top:-10px;">Visível apenas para o Mestre. Use para segredos, ganchos de história ou lembretes sobre este personagem.</p>
      <textarea id="masterNotesInput" placeholder="Anotações privadas sobre este personagem...">${escapeHtml(s.masterNotes || '')}</textarea>
      <button class="btn secondary small" id="saveMasterNotesBtn" style="width:auto; margin-top:10px;">Salvar Anotações</button>
      <span id="masterNotesMsg" style="margin-left:10px; font-size:13px; color:var(--benign);"></span>
    </div>
    ${masterTraitEditorHtml(s)}
  `;

  el.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">${escapeHtml(s.raceName)} · Nível ${s.level} · ${escapeHtml(s.energyType || '')}${s.currentClass ? ` · ${escapeHtml(s.currentClass)}` : ''}</div>
      <h1>${escapeHtml(s.characterName)}</h1>
      <p>${s.height ? `Altura: <b style="color:var(--gold)">${escapeHtml(s.height)}</b>` : ''}${s.height && (s.age !== null && s.age !== undefined) ? ' · ' : ''}${(s.age !== null && s.age !== undefined) ? `Idade: <b style="color:var(--gold)">${escapeHtml(String(s.age))}</b>` : ''}${(s.height || (s.age !== null && s.age !== undefined)) ? ' · ' : ''}XP: <b style="color:var(--gold)">${s.xp || 0} / ${s.level >= 20 ? '—' : (800 * (s.level || 1))}</b></p>
      ${ownerProfile ? `<p>Jogador: <b style="color:var(--gold)">${escapeHtml(ownerProfile.name)}</b></p>` : ''}
      ${s.folderName ? `<p>Campanha: <b style="color:var(--gold)">${escapeHtml(s.folderName)}</b></p>` : ''}
    </div>

    ${canManage ? `<div style="margin-bottom:20px; display:flex; gap:10px; flex-wrap:wrap;">
      <a href="ficha-editor.html?id=${sheetId}" class="btn secondary small" style="width:auto;">Editar</a>
      <button class="btn danger small" id="deleteBtn" style="width:auto;">Excluir ficha</button>
    </div>` : ''}

    ${isMaster ? `<div class="tabs">
      <button type="button" class="tab-btn ${activeTab === 'mestre' ? '' : 'active'}" data-tab="jogador">Jogador</button>
      <button type="button" class="tab-btn ${activeTab === 'mestre' ? 'active' : ''}" data-tab="mestre">Mestre</button>
    </div>` : ''}

    <div id="tabJogador" style="${activeTab === 'mestre' ? 'display:none;' : ''}">${playerTabHtml}</div>
    ${isMaster ? `<div id="tabMestre" style="${activeTab === 'mestre' ? '' : 'display:none;'}">${masterTabHtml}</div>` : ''}
  `;

  if (isMaster) {
    const tabBtns = el.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tabJogador').style.display = btn.dataset.tab === 'jogador' ? '' : 'none';
        document.getElementById('tabMestre').style.display = btn.dataset.tab === 'mestre' ? '' : 'none';
      });
    });
    document.getElementById('saveMasterNotesBtn').addEventListener('click', async () => {
      const val = document.getElementById('masterNotesInput').value;
      const msg = document.getElementById('masterNotesMsg');
      try {
        await db.collection('sheets').doc(sheetId).update({ masterNotes: val });
        msg.textContent = 'Salvo.';
        setTimeout(() => { msg.textContent = ''; }, 2500);
      } catch (err) {
        msg.style.color = 'var(--seal-bright)';
        msg.textContent = 'Erro ao salvar: ' + err.message;
      }
    });
    wireMasterTraitEditor(s, sheetId, (updatedS) => {
      // Redesenha a ficha inteira (os totais de atributo na aba Jogador
      // dependem do texto dos traços) mas mantém a aba Mestre aberta, já
      // que foi de lá que a ação de salvar partiu.
      renderSheet(updatedS, ownerProfile, canManage, sheetId, isMaster, 'mestre');
    });
  }

  if (canManage) {
    document.getElementById('deleteBtn').addEventListener('click', async () => {
      if (!confirm('Tem certeza que quer excluir esta ficha? Essa ação não pode ser desfeita.')) return;
      await db.collection('sheets').doc(sheetId).delete();
      location.href = document.body.dataset.backTo || 'minhas-fichas.html';
    });
  }
}

guardPage(null, async (user, profile) => {
  renderTopbar(profile);
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const content = document.getElementById('content');
  if (!id) { content.innerHTML = '<div class="error-msg">Ficha não especificada.</div>'; return; }

  try {
    const doc = await db.collection('sheets').doc(id).get();
    if (!doc.exists) { content.innerHTML = '<div class="error-msg">Ficha não encontrada.</div>'; return; }
    const s = doc.data();
    const isOwner = s.ownerId === user.uid;
    const isMaster = profile.role === 'master';
    if (!isOwner && !isMaster) {
      content.innerHTML = '<div class="error-msg">Você não tem permissão para ver esta ficha.</div>';
      return;
    }
    document.body.dataset.backTo = isMaster && !isOwner ? 'master.html' : 'minhas-fichas.html';
    let ownerProfile = null;
    if (isMaster) ownerProfile = await getUserProfile(s.ownerId);
    renderSheet(s, ownerProfile, true, id, isMaster);
  } catch (err) {
    if (err && err.code === 'permission-denied') {
      content.innerHTML = '<div class="error-msg">Você não tem permissão para ver esta ficha.</div>';
      return;
    }
    content.innerHTML = `<div class="error-msg">Erro ao carregar ficha: ${escapeHtml(err.message)}</div>`;
  }
});

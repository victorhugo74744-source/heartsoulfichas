// ============================================================
// Gerador procedural de mapas de batalha — 100% no navegador (canvas),
// sem depender de nenhum serviço externo. Serve para o Mestre montar
// rapidamente um cenário para a mesa, em vários biomas e tamanhos, com
// grade já desenhada na própria imagem.
// Retorna { dataUrl, width, height, cols, rows, cellPx }.
// ============================================================

const MAPGEN_SIZES = {
  minusculo: { cols: 14, rows: 10 },
  pequeno:   { cols: 20, rows: 14 },
  medio:     { cols: 30, rows: 20 },
  grande:    { cols: 40, rows: 26 },
  epico:     { cols: 52, rows: 34 },
  colossal:  { cols: 64, rows: 42 }
};
const MAPGEN_SIZE_LABELS = {
  minusculo: 'Minúsculo (combate rápido)', pequeno: 'Pequeno', medio: 'Médio',
  grande: 'Grande', epico: 'Épico', colossal: 'Colossal (mesa cheia)'
};
const MAPGEN_CELL_PX = 36;

// Paletas por bioma — cada uma tem cor de parede/piso e uma cor de "feature"
// (o elemento extra espalhado pelo chão: água, entulho, árvores, gelo, ossos...).
const MAPGEN_PALETTES = {
  dungeon:   { wall: [18, 15, 12], floor: [65, 51, 27], grid: 'rgba(58,46,34,0.55)',  feature: 'rubble', featureChance: 0.05, featureColor: [40, 33, 24] },
  cave:      { wall: [14, 16, 15], floor: [46, 58, 42], grid: 'rgba(40,58,44,0.5)',   feature: 'rubble', featureChance: 0.06, featureColor: [30, 40, 30] },
  ruinas:    { wall: [16, 14, 13], floor: [70, 58, 40], grid: 'rgba(70,50,30,0.5)',   feature: 'rubble', featureChance: 0.16, featureColor: [95, 70, 45] },
  floresta:  { wall: [10, 20, 12], floor: [40, 66, 36], grid: 'rgba(30,55,28,0.45)',  feature: 'tree',   featureChance: 0.14, featureColor: [22, 46, 22] },
  pantano:   { wall: [12, 16, 14], floor: [52, 60, 40], grid: 'rgba(35,55,45,0.5)',   feature: 'water',  featureChance: 0.20, featureColor: [30, 60, 62] },
  gelo:      { wall: [15, 19, 25], floor: [60, 76, 90], grid: 'rgba(120,150,170,0.4)',feature: 'gelo',   featureChance: 0.14, featureColor: [165, 200, 215] },
  necropole: { wall: [16, 12, 16], floor: [50, 42, 54], grid: 'rgba(80,60,85,0.5)',   feature: 'ossos',  featureChance: 0.10, featureColor: [155, 145, 125] },
  cidade:    { wall: [15, 14, 13], floor: [64, 60, 54], grid: 'rgba(70,64,55,0.55)',  feature: 'rubble', featureChance: 0.10, featureColor: [82, 76, 66] },
  deserto:   { wall: [58, 44, 24], floor: [176, 142, 84], grid: 'rgba(120,92,50,0.4)',feature: 'duna',   featureChance: 0.12, featureColor: [196, 164, 104] },
  vulcao:    { wall: [22, 14, 12], floor: [54, 34, 28], grid: 'rgba(90,40,20,0.5)',   feature: 'lava',   featureChance: 0.12, featureColor: [220, 90, 30] },
  templo:    { wall: [20, 26, 16], floor: [58, 74, 46], grid: 'rgba(40,60,32,0.5)',   feature: 'vinha',  featureChance: 0.15, featureColor: [50, 90, 40] },
  navio:     { wall: [24, 18, 12], floor: [96, 72, 46], grid: 'rgba(60,44,28,0.55)',  feature: 'corda',  featureChance: 0.08, featureColor: [140, 110, 70] },
  mina:      { wall: [26, 22, 18], floor: [72, 60, 46], grid: 'rgba(52,42,32,0.5)',   feature: 'trilho', featureChance: 0.09, featureColor: [128, 96, 54] },
  biblioteca:{ wall: [22, 17, 13], floor: [82, 65, 40], grid: 'rgba(92,72,42,0.45)',  feature: 'livros', featureChance: 0.15, featureColor: [128, 52, 42] },
  esgoto:    { wall: [13, 15, 13], floor: [40, 48, 38], grid: 'rgba(32,42,32,0.5)',   feature: 'lodo',   featureChance: 0.18, featureColor: [52, 72, 42] },
  litoral:   { wall: [42, 40, 36], floor: [182, 170, 132], grid: 'rgba(150,140,100,0.4)', feature: 'concha', featureChance: 0.10, featureColor: [212, 197, 162] },
  metropole: { wall: [24, 22, 20], floor: [96, 90, 78], grid: 'rgba(80,74,62,0.5)',   feature: 'barraca',featureChance: 0.08, featureColor: [150, 62, 50] },
  fazenda:   { wall: [46, 60, 32], floor: [128, 158, 76], grid: 'rgba(80,110,50,0.4)', feature: 'plantacao', featureChance: 0.20, featureColor: [176, 150, 64] },
  guilda:    { wall: [26, 19, 14], floor: [98, 74, 46], grid: 'rgba(84,62,36,0.5)',   feature: 'mesa',   featureChance: 0.11, featureColor: [116, 84, 52] },
  oceano:    { wall: [10, 22, 32], floor: [22, 78, 98], grid: 'rgba(30,100,120,0.4)', feature: 'coral',  featureChance: 0.16, featureColor: [232, 112, 92] },
  taverna:   { wall: [24, 17, 12], floor: [90, 66, 40], grid: 'rgba(80,58,34,0.5)',   feature: 'barril', featureChance: 0.10, featureColor: [96, 64, 36] },
  castelo:   { wall: [30, 28, 26], floor: [80, 76, 70], grid: 'rgba(96,90,82,0.5)',   feature: 'bandeira', featureChance: 0.07, featureColor: [140, 30, 30] },
  planicie:  { wall: [42, 56, 30], floor: [124, 154, 74], grid: 'rgba(84,112,54,0.32)', feature: 'pedra', featureChance: 0.06, featureColor: [132, 122, 102] },
  florestagelada: { wall: [16, 26, 24], floor: [202, 216, 226], grid: 'rgba(150,175,190,0.4)', feature: 'pinheiro', featureChance: 0.17, featureColor: [30, 62, 56] }
};
const MAPGEN_BIOME_LABELS = {
  dungeon: 'Masmorra', cave: 'Caverna', ruinas: 'Ruínas', floresta: 'Floresta', pantano: 'Pântano',
  gelo: 'Geleira', necropole: 'Necrópole', cidade: 'Cidade em Ruínas',
  deserto: 'Deserto', vulcao: 'Vulcão', templo: 'Templo Perdido', navio: 'Convés de Navio',
  mina: 'Mina Abandonada', biblioteca: 'Biblioteca Arcana', esgoto: 'Esgotos', litoral: 'Costa Rochosa',
  metropole: 'Cidade', fazenda: 'Fazenda', guilda: 'Salão da Guilda', oceano: 'Oceano',
  taverna: 'Taverna', castelo: 'Castelo', planicie: 'Planície', florestagelada: 'Floresta Congelada'
};

function mapgenRand(seed) {
  // PRNG simples (mulberry32) para permitir regenerar de forma determinística se quisermos.
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mapgenEmptyGrid(cols, rows, fill) {
  const g = [];
  for (let y = 0; y < rows; y++) g.push(new Array(cols).fill(fill));
  return g;
}

// ---------- Masmorra: salas retangulares ligadas por corredores ----------
// roomOpts permite variar o "estilo" das salas por bioma: masmorra/ruínas
// usam o padrão clássico; cidade usa quarteirões maiores (prédios); necrópole
// usa criptas pequenas e apertadas.
function mapgenDungeon(cols, rows, rng, roomOpts) {
  const opts = Object.assign({ minW: 3, wSpan: 5, minH: 3, hSpan: 4 }, roomOpts);
  const grid = mapgenEmptyGrid(cols, rows, 0); // 0 = parede, 1 = chão
  const rooms = [];
  const avgArea = (opts.minW + opts.wSpan / 2) * (opts.minH + opts.hSpan / 2);
  const attempts = Math.max(6, Math.floor((cols * rows) / (avgArea * 1.15)));

  for (let i = 0; i < attempts; i++) {
    // Clampa a sala ao tamanho do mapa — importante pro combo "mesa
    // minúscula + bioma de salas grandes" não gerar coordenadas inválidas.
    const w = Math.min(opts.minW + Math.floor(rng() * opts.wSpan), cols - 4);
    const h = Math.min(opts.minH + Math.floor(rng() * opts.hSpan), rows - 4);
    if (w < 2 || h < 2) continue;
    const x = 1 + Math.floor(rng() * Math.max(1, cols - w - 2));
    const y = 1 + Math.floor(rng() * Math.max(1, rows - h - 2));
    const room = { x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) };

    const overlaps = rooms.some(r =>
      x - 1 < r.x + r.w && x + w + 1 > r.x && y - 1 < r.y + r.h && y + h + 1 > r.y
    );
    if (overlaps) continue;

    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++)
        grid[yy][xx] = 1;

    if (rooms.length > 0) {
      const prev = rooms[rooms.length - 1];
      // Corredor em L entre os centros das salas.
      if (rng() < 0.5) {
        mapgenCarveH(grid, prev.cx, room.cx, prev.cy);
        mapgenCarveV(grid, prev.cy, room.cy, room.cx);
      } else {
        mapgenCarveV(grid, prev.cy, room.cy, prev.cx);
        mapgenCarveH(grid, prev.cx, room.cx, room.cy);
      }
    }
    rooms.push(room);
  }
  return { grid, rooms };
}

function mapgenCarveH(grid, x1, x2, y) {
  const [a, b] = x1 < x2 ? [x1, x2] : [x2, x1];
  for (let x = a; x <= b; x++) grid[y][x] = 1;
}
function mapgenCarveV(grid, y1, y2, x) {
  const [a, b] = y1 < y2 ? [y1, y2] : [y2, y1];
  for (let y = a; y <= b; y++) grid[y][x] = 1;
}

// ---------- Caverna: autômato celular orgânico ----------
// `openness` controla a densidade inicial de "chão" — usado também para
// variar florestas (mais abertas, clareiras maiores), pântanos (mais
// fechados, corredores estreitos entre a água) e geleiras.
function mapgenCave(cols, rows, rng, openness) {
  const seed0 = openness == null ? 0.45 : openness;
  let grid = mapgenEmptyGrid(cols, rows, 0);
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++)
      grid[y][x] = (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) ? 0 : (rng() < seed0 ? 1 : 0);

  const countNeighbors = (g, x, y) => {
    let c = 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) { c++; continue; }
        if (g[ny][nx] === 1) c++;
      }
    return c;
  };

  for (let it = 0; it < 4; it++) {
    const next = mapgenEmptyGrid(cols, rows, 0);
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const n = countNeighbors(grid, x, y);
        next[y][x] = n > 4 ? 1 : (n < 3 ? 0 : grid[y][x]);
      }
    grid = next;
  }
  return { grid, rooms: [] };
}

// ---------- Orçamento de tamanho (limite de documento do Firestore) ----------
// O mapa é salvo direto no documento da mesa (campo mapImage), e o Firestore
// tem um limite de 1 MiB por documento inteiro. Mapas grandes (épico/
// colossal) podem gerar imagens grandes demais — aqui a gente tenta
// qualidades JPEG decrescentes e, se ainda não bastar, reduz a resolução da
// própria imagem até caber com folga. Isso não muda o tamanho da grade
// (cols/rows/cellPx continuam os mesmos), só a nitidez da textura de fundo.
const MAPGEN_BYTE_BUDGET = 700000; // ~700KB, deixa margem para os outros campos da mesa

function mapgenDataUrlBytes(dataUrl) {
  const i = dataUrl.indexOf(',');
  const b64 = i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
  return Math.floor(b64.length * 0.75);
}

function mapgenEncodeWithBudget(canvas) {
  const qualities = [0.85, 0.72, 0.6, 0.48];
  for (const q of qualities) {
    const dataUrl = canvas.toDataURL('image/jpeg', q);
    if (mapgenDataUrlBytes(dataUrl) <= MAPGEN_BYTE_BUDGET) return dataUrl;
  }
  let scale = 0.85;
  let last = canvas.toDataURL('image/jpeg', 0.48);
  while (scale > 0.3) {
    const c2 = document.createElement('canvas');
    c2.width = Math.max(1, Math.round(canvas.width * scale));
    c2.height = Math.max(1, Math.round(canvas.height * scale));
    c2.getContext('2d').drawImage(canvas, 0, 0, c2.width, c2.height);
    const dataUrl = c2.toDataURL('image/jpeg', 0.55);
    last = dataUrl;
    if (mapgenDataUrlBytes(dataUrl) <= MAPGEN_BYTE_BUDGET) return dataUrl;
    scale -= 0.12;
  }
  return last; // menor que a gente conseguiu, mesmo que ainda pese um pouco
}

function mapgenGenerate({ size = 'medio', biome = 'dungeon', seed } = {}) {
  const dims = MAPGEN_SIZES[size] || MAPGEN_SIZES.medio;
  const { cols, rows } = dims;
  const usedSeed = seed || Math.floor(Math.random() * 1e9);
  const rng = mapgenRand(usedSeed);
  const palette = MAPGEN_PALETTES[biome] || MAPGEN_PALETTES.dungeon;

  let grid;
  if (biome === 'cave') grid = mapgenCave(cols, rows, rng, 0.45).grid;
  else if (biome === 'floresta') grid = mapgenCave(cols, rows, rng, 0.58).grid; // mais aberto: clareiras maiores
  else if (biome === 'pantano') grid = mapgenCave(cols, rows, rng, 0.40).grid;  // mais fechado: passagens estreitas
  else if (biome === 'gelo') grid = mapgenCave(cols, rows, rng, 0.50).grid;     // caverna de gelo, meio-termo
  else if (biome === 'cidade') grid = mapgenDungeon(cols, rows, rng, { minW: 5, wSpan: 6, minH: 4, hSpan: 5 }).grid; // quarteirões/prédios maiores
  else if (biome === 'necropole') grid = mapgenDungeon(cols, rows, rng, { minW: 2, wSpan: 4, minH: 2, hSpan: 3 }).grid; // criptas pequenas e apertadas
  else if (biome === 'vulcao') grid = mapgenCave(cols, rows, rng, 0.48).grid;  // caverna vulcânica, câmaras abertas ligadas por passagens estreitas
  else if (biome === 'deserto') grid = mapgenDungeon(cols, rows, rng, { minW: 5, wSpan: 7, minH: 5, hSpan: 6 }).grid; // pátios abertos entre ruínas soterradas na areia
  else if (biome === 'templo') grid = mapgenDungeon(cols, rows, rng, { minW: 3, wSpan: 5, minH: 3, hSpan: 4 }).grid;  // câmaras de templo, mesmo esqueleto da masmorra clássica
  else if (biome === 'navio') grid = mapgenDungeon(cols, rows, rng, { minW: 2, wSpan: 3, minH: 2, hSpan: 2 }).grid;   // camarotes e porões pequenos e retangulares
  else if (biome === 'mina') grid = mapgenCave(cols, rows, rng, 0.42).grid;    // túneis estreitos e irregulares escavados na rocha
  else if (biome === 'biblioteca') grid = mapgenDungeon(cols, rows, rng, { minW: 4, wSpan: 5, minH: 3, hSpan: 4 }).grid; // salões com fileiras de estantes
  else if (biome === 'esgoto') grid = mapgenCave(cols, rows, rng, 0.38).grid;  // canais apertados e sinuosos
  else if (biome === 'litoral') grid = mapgenCave(cols, rows, rng, 0.62).grid; // faixa de praia bem aberta, com poucos obstáculos de rocha
  else if (biome === 'metropole') grid = mapgenDungeon(cols, rows, rng, { minW: 6, wSpan: 7, minH: 5, hSpan: 6 }).grid; // quarteirões e praças amplas de uma cidade viva
  else if (biome === 'fazenda') grid = mapgenCave(cols, rows, rng, 0.7).grid;   // campos bem abertos, cercas e celeiros isolados
  else if (biome === 'guilda') grid = mapgenDungeon(cols, rows, rng, { minW: 5, wSpan: 6, minH: 4, hSpan: 5 }).grid; // salão principal e cômodos anexos
  else if (biome === 'oceano') grid = mapgenCave(cols, rows, rng, 0.72).grid;   // água aberta com poucos recifes/rochas
  else if (biome === 'taverna') grid = mapgenDungeon(cols, rows, rng, { minW: 4, wSpan: 5, minH: 3, hSpan: 4 }).grid; // salão principal e quartos aconchegantes
  else if (biome === 'castelo') grid = mapgenDungeon(cols, rows, rng, { minW: 6, wSpan: 8, minH: 5, hSpan: 7 }).grid; // salões grandiosos e corredores largos
  else if (biome === 'planicie') grid = mapgenCave(cols, rows, rng, 0.76).grid; // campo aberto, quase sem obstáculos
  else if (biome === 'florestagelada') grid = mapgenCave(cols, rows, rng, 0.55).grid; // clareiras entre pinheiros cobertos de neve
  else grid = mapgenDungeon(cols, rows, rng).grid; // dungeon e ruinas usam o esqueleto clássico de salas+corredores

  // Camada de "features" espalhadas pelo chão (água, entulho, árvores, gelo,
  // ossos) — puramente visual, não bloqueia o piso, só dá variedade ao mapa.
  const features = mapgenEmptyGrid(cols, rows, 0);
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++)
      if (grid[y][x] === 1 && rng() < palette.featureChance) features[y][x] = 1;

  const cell = MAPGEN_CELL_PX;
  const canvas = document.createElement('canvas');
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#120F0C';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const isFloor = grid[y][x] === 1;
      const noise = (Math.sin(x * 12.9898 + y * 78.233 + usedSeed) * 43758.5453) % 1;
      const shade = Math.abs(noise) * 10;
      const [fr, fg, fb] = palette.floor, [wr, wg, wb] = palette.wall;
      if (isFloor) {
        if (features[y][x]) {
          const [er, eg, eb] = palette.featureColor;
          ctx.fillStyle = `rgb(${er + shade},${eg + shade},${eb + shade})`;
        } else {
          ctx.fillStyle = `rgb(${fr + shade},${fg + shade},${fb + shade})`;
        }
      } else {
        ctx.fillStyle = `rgb(${wr + shade * 0.6},${wg + shade * 0.6},${wb + shade * 0.6})`;
      }
      ctx.fillRect(x * cell, y * cell, cell, cell);

      // Marca visual simples pro tipo de feature (sem depender de sprites externos).
      if (isFloor && features[y][x]) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        const cx2 = x * cell + cell / 2, cy2 = y * cell + cell / 2;
        if (palette.feature === 'tree') {
          ctx.fillStyle = `rgb(${palette.featureColor[0] + 30},${palette.featureColor[1] + 40},${palette.featureColor[2] + 20})`;
          ctx.beginPath(); ctx.arc(cx2, cy2, cell * 0.32, 0, Math.PI * 2); ctx.fill();
        } else if (palette.feature === 'water') {
          ctx.fillStyle = `rgb(${palette.featureColor[0] + 25},${palette.featureColor[1] + 35},${palette.featureColor[2] + 45})`;
          ctx.beginPath(); ctx.ellipse(cx2, cy2, cell * 0.4, cell * 0.28, 0, 0, Math.PI * 2); ctx.fill();
        } else if (palette.feature === 'gelo') {
          ctx.fillStyle = `rgb(${palette.featureColor[0]},${palette.featureColor[1]},${palette.featureColor[2]})`;
          ctx.beginPath();
          ctx.moveTo(cx2, cy2 - cell * 0.32); ctx.lineTo(cx2 + cell * 0.24, cy2);
          ctx.lineTo(cx2, cy2 + cell * 0.32); ctx.lineTo(cx2 - cell * 0.24, cy2);
          ctx.closePath(); ctx.fill();
        } else if (palette.feature === 'ossos') {
          ctx.strokeStyle = `rgb(${palette.featureColor[0]},${palette.featureColor[1]},${palette.featureColor[2]})`;
          ctx.lineWidth = Math.max(1, cell * 0.07);
          ctx.beginPath();
          ctx.moveTo(cx2 - cell * 0.22, cy2 - cell * 0.16); ctx.lineTo(cx2 + cell * 0.22, cy2 + cell * 0.16);
          ctx.moveTo(cx2 + cell * 0.22, cy2 - cell * 0.16); ctx.lineTo(cx2 - cell * 0.22, cy2 + cell * 0.16);
          ctx.stroke();
        } else if (palette.feature === 'lava') {
          // Poça de lava brilhante, com um núcleo mais claro pra dar a sensação de incandescência.
          ctx.fillStyle = `rgb(${palette.featureColor[0]},${palette.featureColor[1]},${palette.featureColor[2]})`;
          ctx.beginPath(); ctx.ellipse(cx2, cy2, cell * 0.4, cell * 0.3, 0, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = `rgb(${Math.min(255, palette.featureColor[0] + 35)},${Math.min(255, palette.featureColor[1] + 55)},${palette.featureColor[2]})`;
          ctx.beginPath(); ctx.ellipse(cx2, cy2, cell * 0.16, cell * 0.12, 0, 0, Math.PI * 2); ctx.fill();
        } else if (palette.feature === 'duna') {
          // Curvas concêntricas simulando ondulações de areia.
          ctx.strokeStyle = `rgb(${palette.featureColor[0]},${palette.featureColor[1]},${palette.featureColor[2]})`;
          ctx.lineWidth = Math.max(1, cell * 0.05);
          ctx.beginPath(); ctx.arc(cx2, cy2 + cell * 0.12, cell * 0.28, Math.PI, 0); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx2, cy2 - cell * 0.08, cell * 0.18, Math.PI, 0); ctx.stroke();
        } else if (palette.feature === 'vinha') {
          // Trepadeira serpenteando pela célula, com folhas pontuais.
          ctx.strokeStyle = `rgb(${palette.featureColor[0]},${palette.featureColor[1]},${palette.featureColor[2]})`;
          ctx.lineWidth = Math.max(1, cell * 0.06);
          ctx.beginPath();
          ctx.moveTo(cx2 - cell * 0.3, cy2 - cell * 0.28);
          ctx.quadraticCurveTo(cx2 + cell * 0.25, cy2, cx2 - cell * 0.1, cy2 + cell * 0.3);
          ctx.stroke();
          ctx.fillStyle = `rgb(${Math.min(255, palette.featureColor[0] + 40)},${Math.min(255, palette.featureColor[1] + 50)},${palette.featureColor[2]})`;
          ctx.beginPath(); ctx.arc(cx2 + cell * 0.12, cy2 - cell * 0.04, cell * 0.08, 0, Math.PI * 2); ctx.fill();
        } else if (palette.feature === 'trilho') {
          // Trilhos de vagonete: dois trilhos paralelos com dormentes.
          ctx.strokeStyle = `rgb(${palette.featureColor[0]},${palette.featureColor[1]},${palette.featureColor[2]})`;
          ctx.lineWidth = Math.max(1, cell * 0.05);
          ctx.beginPath(); ctx.moveTo(cx2 - cell * 0.2, cy2 - cell * 0.34); ctx.lineTo(cx2 - cell * 0.2, cy2 + cell * 0.34); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx2 + cell * 0.2, cy2 - cell * 0.34); ctx.lineTo(cx2 + cell * 0.2, cy2 + cell * 0.34); ctx.stroke();
          for (let ty = -0.25; ty <= 0.25; ty += 0.25) {
            ctx.beginPath(); ctx.moveTo(cx2 - cell * 0.26, cy2 + cell * ty); ctx.lineTo(cx2 + cell * 0.26, cy2 + cell * ty); ctx.stroke();
          }
        } else if (palette.feature === 'livros') {
          // Pilha de livros: retângulos empilhados com pequena inclinação.
          ctx.fillStyle = `rgb(${palette.featureColor[0]},${palette.featureColor[1]},${palette.featureColor[2]})`;
          ctx.fillRect(cx2 - cell * 0.24, cy2 + cell * 0.06, cell * 0.48, cell * 0.14);
          ctx.fillStyle = `rgb(${Math.max(0, palette.featureColor[0] - 30)},${Math.max(0, palette.featureColor[1] - 10)},${Math.min(255, palette.featureColor[2] + 30)})`;
          ctx.fillRect(cx2 - cell * 0.18, cy2 - cell * 0.1, cell * 0.4, cell * 0.14);
          ctx.fillStyle = `rgb(${Math.min(255, palette.featureColor[0] + 20)},${Math.min(255, palette.featureColor[1] + 40)},${palette.featureColor[2]})`;
          ctx.fillRect(cx2 - cell * 0.2, cy2 - cell * 0.24, cell * 0.36, cell * 0.12);
        } else if (palette.feature === 'lodo') {
          // Poça de lodo turvo, mais opaca e irregular que a água normal.
          ctx.fillStyle = `rgb(${palette.featureColor[0]},${palette.featureColor[1]},${palette.featureColor[2]})`;
          ctx.beginPath(); ctx.ellipse(cx2, cy2, cell * 0.38, cell * 0.24, 0.3, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 0.5;
          ctx.beginPath(); ctx.arc(cx2 - cell * 0.1, cy2 - cell * 0.06, cell * 0.05, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(cx2 + cell * 0.14, cy2 + cell * 0.08, cell * 0.04, 0, Math.PI * 2); ctx.fill();
        } else if (palette.feature === 'concha') {
          // Concha/pedra de praia em leque.
          ctx.fillStyle = `rgb(${palette.featureColor[0]},${palette.featureColor[1]},${palette.featureColor[2]})`;
          ctx.beginPath();
          for (let i = -2; i <= 2; i++) {
            const ang = (i / 2) * (Math.PI / 3) - Math.PI / 2;
            ctx.lineTo(cx2 + Math.cos(ang) * cell * 0.28, cy2 + cell * 0.18 + Math.sin(ang) * cell * 0.28);
          }
          ctx.lineTo(cx2, cy2 + cell * 0.3);
          ctx.closePath(); ctx.fill();
        } else if (palette.feature === 'barraca') {
          // Barraca de feira: toldo triangular sobre uma base retangular.
          ctx.fillStyle = `rgb(${palette.featureColor[0]},${palette.featureColor[1]},${palette.featureColor[2]})`;
          ctx.beginPath();
          ctx.moveTo(cx2, cy2 - cell * 0.3); ctx.lineTo(cx2 + cell * 0.28, cy2 + cell * 0.02); ctx.lineTo(cx2 - cell * 0.28, cy2 + cell * 0.02);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = `rgb(${Math.max(0, palette.featureColor[0] - 40)},${Math.max(0, palette.featureColor[1] - 20)},${Math.max(0, palette.featureColor[2] - 15)})`;
          ctx.fillRect(cx2 - cell * 0.2, cy2 + cell * 0.02, cell * 0.4, cell * 0.22);
        } else if (palette.feature === 'plantacao') {
          // Fileiras de plantação: pequenas linhas paralelas, como sulcos de cultivo.
          ctx.strokeStyle = `rgb(${palette.featureColor[0]},${palette.featureColor[1]},${palette.featureColor[2]})`;
          ctx.lineWidth = Math.max(1, cell * 0.06);
          for (let ly = -0.24; ly <= 0.24; ly += 0.16) {
            ctx.beginPath(); ctx.moveTo(cx2 - cell * 0.3, cy2 + cell * ly); ctx.lineTo(cx2 + cell * 0.3, cy2 + cell * ly); ctx.stroke();
          }
        } else if (palette.feature === 'mesa') {
          // Mesa de taverna: tampo retangular com dois bancos curtos ao lado.
          ctx.fillStyle = `rgb(${palette.featureColor[0]},${palette.featureColor[1]},${palette.featureColor[2]})`;
          ctx.fillRect(cx2 - cell * 0.26, cy2 - cell * 0.14, cell * 0.52, cell * 0.28);
          ctx.fillStyle = `rgb(${Math.max(0, palette.featureColor[0] - 25)},${Math.max(0, palette.featureColor[1] - 20)},${Math.max(0, palette.featureColor[2] - 15)})`;
          ctx.fillRect(cx2 - cell * 0.34, cy2 - cell * 0.06, cell * 0.06, cell * 0.12);
          ctx.fillRect(cx2 + cell * 0.28, cy2 - cell * 0.06, cell * 0.06, cell * 0.12);
        } else if (palette.feature === 'coral') {
          // Coral ramificado, com alguns "galhos" saindo de uma base comum.
          ctx.strokeStyle = `rgb(${palette.featureColor[0]},${palette.featureColor[1]},${palette.featureColor[2]})`;
          ctx.lineWidth = Math.max(1, cell * 0.06);
          ctx.lineCap = 'round';
          for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(cx2, cy2 + cell * 0.28);
            ctx.lineTo(cx2 + i * cell * 0.2, cy2 - cell * 0.24);
            ctx.stroke();
          }
        } else if (palette.feature === 'barril') {
          // Barril: corpo ovalado com aros mais escuros.
          ctx.fillStyle = `rgb(${palette.featureColor[0]},${palette.featureColor[1]},${palette.featureColor[2]})`;
          ctx.beginPath(); ctx.ellipse(cx2, cy2, cell * 0.22, cell * 0.3, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = `rgb(${Math.max(0, palette.featureColor[0] - 40)},${Math.max(0, palette.featureColor[1] - 30)},${Math.max(0, palette.featureColor[2] - 20)})`;
          ctx.lineWidth = Math.max(1, cell * 0.04);
          ctx.beginPath(); ctx.ellipse(cx2, cy2 - cell * 0.14, cell * 0.22, cell * 0.06, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(cx2, cy2 + cell * 0.14, cell * 0.22, cell * 0.06, 0, 0, Math.PI * 2); ctx.stroke();
        } else if (palette.feature === 'bandeira') {
          // Bandeira num mastro curto.
          ctx.strokeStyle = `rgb(90,80,70)`;
          ctx.lineWidth = Math.max(1, cell * 0.05);
          ctx.beginPath(); ctx.moveTo(cx2 - cell * 0.18, cy2 + cell * 0.3); ctx.lineTo(cx2 - cell * 0.18, cy2 - cell * 0.3); ctx.stroke();
          ctx.fillStyle = `rgb(${palette.featureColor[0]},${palette.featureColor[1]},${palette.featureColor[2]})`;
          ctx.beginPath();
          ctx.moveTo(cx2 - cell * 0.18, cy2 - cell * 0.3); ctx.lineTo(cx2 + cell * 0.26, cy2 - cell * 0.2); ctx.lineTo(cx2 - cell * 0.18, cy2 - cell * 0.08);
          ctx.closePath(); ctx.fill();
        } else if (palette.feature === 'pedra') {
          // Pequeno agrupamento de pedras soltas no campo aberto.
          ctx.fillStyle = `rgb(${palette.featureColor[0]},${palette.featureColor[1]},${palette.featureColor[2]})`;
          ctx.beginPath(); ctx.arc(cx2 - cell * 0.1, cy2 + cell * 0.06, cell * 0.16, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(cx2 + cell * 0.12, cy2, cell * 0.12, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(cx2 + cell * 0.02, cy2 - cell * 0.14, cell * 0.09, 0, Math.PI * 2); ctx.fill();
        } else if (palette.feature === 'pinheiro') {
          // Pinheiro nevado: camadas triangulares com um toque de branco no topo.
          ctx.fillStyle = `rgb(${palette.featureColor[0]},${palette.featureColor[1]},${palette.featureColor[2]})`;
          [0.28, 0.12, -0.04].forEach((oy, i) => {
            const w = cell * (0.3 - i * 0.07);
            ctx.beginPath();
            ctx.moveTo(cx2, cy2 - cell * 0.36 + oy * 0.6);
            ctx.lineTo(cx2 + w, cy2 + oy);
            ctx.lineTo(cx2 - w, cy2 + oy);
            ctx.closePath(); ctx.fill();
          });
          ctx.fillStyle = 'rgba(235,242,248,0.65)';
          ctx.beginPath(); ctx.arc(cx2, cy2 - cell * 0.22, cell * 0.06, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = `rgb(${palette.featureColor[0] + 15},${palette.featureColor[1] + 12},${palette.featureColor[2] + 10})`;
          ctx.fillRect(cx2 - cell * 0.22, cy2 - cell * 0.12, cell * 0.44, cell * 0.24);
        }
        ctx.restore();
      }
    }
  }

  // Grade sutil por cima, para orientar o movimento na mesa.
  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x <= cols; x++) {
    ctx.beginPath(); ctx.moveTo(x * cell + .5, 0); ctx.lineTo(x * cell + .5, canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= rows; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * cell + .5); ctx.lineTo(canvas.width, y * cell + .5); ctx.stroke();
  }

  return {
    dataUrl: mapgenEncodeWithBudget(canvas),
    // width/height/cellPx continuam batendo com a grade lógica (cols x rows)
    // mesmo que o bitmap salvo tenha sido reamostrado pra caber no limite do
    // Firestore — é isso que mantém o encaixe dos tokens na grade correto.
    width: canvas.width,
    height: canvas.height,
    cols, rows, cellPx: cell, seed: usedSeed,
    // Grade lógica piso(1)/parede(0) usada pra desenhar o mapa acima — devolvida
    // aqui pra quem gerou o mapa poder traçar as paredes de bloqueio de visão
    // automaticamente, sem precisar contornar tudo à mão (ver
    // mapgenWallSegmentsFromGrid, chamado por regenerateWallsFromGrid em
    // mesa-tools.js logo depois que o mapa é salvo).
    grid
  };
}

// A partir da grade piso(1)/parede(0) de um mapa gerado, devolve os
// segmentos de parede que contornam toda área de piso — tanto a borda
// externa das salas/cavernas quanto qualquer "ilha" de rocha sólida dentro
// de uma sala (ex.: um pilar isolado também vira uma parede fechando ao
// redor dele). Percorre as linhas de grade horizontais e verticais uma vez
// cada, e junta (merge) trechos retos consecutivos num único segmento em
// vez de um documento por aresta de casa — o resultado típico é algumas
// centenas de segmentos, não milhares. As coordenadas devolvidas estão em
// "casas de grade" (0..cols, 0..rows); quem usa esta função ainda precisa
// dividir por cols/rows pra virar a fração 0..1 que a coleção 'walls' espera.
function mapgenWallSegmentsFromGrid(grid, cols, rows) {
  const isFloor = (x, y) => x >= 0 && x < cols && y >= 0 && y < rows && grid[y][x] === 1;
  const segments = [];

  // Arestas horizontais: uma por linha de grade (0..rows), juntando os
  // trechos em x onde a casa de cima e a de baixo dessa linha divergem
  // (uma é piso, a outra não) em runs retos.
  for (let yLine = 0; yLine <= rows; yLine++) {
    let runStart = null;
    for (let x = 0; x <= cols; x++) {
      const isEdge = x < cols && (isFloor(x, yLine - 1) !== isFloor(x, yLine));
      if (isEdge) {
        if (runStart === null) runStart = x;
      } else if (runStart !== null) {
        segments.push({ x1: runStart, y1: yLine, x2: x, y2: yLine });
        runStart = null;
      }
    }
  }

  // Mesma ideia, arestas verticais.
  for (let xLine = 0; xLine <= cols; xLine++) {
    let runStart = null;
    for (let y = 0; y <= rows; y++) {
      const isEdge = y < rows && (isFloor(xLine - 1, y) !== isFloor(xLine, y));
      if (isEdge) {
        if (runStart === null) runStart = y;
      } else if (runStart !== null) {
        segments.push({ x1: xLine, y1: runStart, x2: xLine, y2: y });
        runStart = null;
      }
    }
  }

  return segments;
}

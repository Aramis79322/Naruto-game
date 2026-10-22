/* ============================================================
   NARUTO: SHINOBI LEGACY — Mundo abierto de Konoha
   Mapa procedural, edificios, NPCs, misiones y coleccionables.
   ============================================================ */
(function () {
  'use strict';

  const D = window.GameData;
  const WORLD_W = 3200;
  const WORLD_H = 2300;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const BUILDINGS = [
    { id: 'academy', name: 'ACADEMIA NINJA', x: 470, y: 910, w: 450, h: 210, style: 'academy', solid: true, label: 'ACADEMIA' },
    { id: 'tower', name: 'TORRE DEL HOKAGE', x: 1320, y: 750, w: 400, h: 180, style: 'tower', solid: true, label: 'HOKAGE' },
    { id: 'missions', name: 'OFICINA DE MISIONES', x: 1660, y: 1370, w: 310, h: 150, style: 'missions', solid: true, label: 'MISIONES' },
    { id: 'ichiraku', name: 'ICHIRAKU RAMEN', x: 900, y: 1370, w: 270, h: 150, style: 'shop', solid: true, label: 'ICHIRAKU' },
    { id: 'hospital', name: 'HOSPITAL DE KONOHA', x: 2120, y: 1080, w: 380, h: 190, style: 'hospital', solid: true, label: 'HOSPITAL' },
    { id: 'house1', name: 'CASA DEL CLAN NARA', x: 1200, y: 720, w: 190, h: 130, style: 'house', solid: true },
    { id: 'house2', name: 'CASA DEL CLAN YAMANAKA', x: 1900, y: 980, w: 200, h: 135, style: 'house', solid: true },
    { id: 'house3', name: 'TIENDA DE ARMAS', x: 1950, y: 1520, w: 210, h: 130, style: 'shop', solid: true },
    { id: 'house4', name: 'CASA DEL CLAN HYŪGA', x: 2600, y: 930, w: 230, h: 150, style: 'house', solid: true },
    { id: 'house5', name: 'POSADA DE LA HOJA', x: 700, y: 1570, w: 210, h: 140, style: 'house', solid: true },
    { id: 'house6', name: 'HERRERÍA', x: 2800, y: 1250, w: 180, h: 120, style: 'house', solid: true },
    { id: 'gate-left', name: '', x: 280, y: 1830, w: 80, h: 150, style: 'gatepillar', solid: true },
    { id: 'gate-right', name: '', x: 650, y: 1830, w: 80, h: 150, style: 'gatepillar', solid: true }
  ];

  const POND = { x: 720, y: 620, rx: 235, ry: 140 };
  const TRAINING = { x: 2560, y: 1640, r: 290 };
  const CLIFF = { x: 1120, y: 40, w: 900, h: 390 };

  const NPCS = [
    { id: 'iruka', name: 'Iruka Umino', role: 'Sensei de la Academia', x: 690, y: 1190, portrait: 'iruka', art: { skin: '#e8c4a0', hair: '#2a2422', style: 'ponytail', outfit: '#3a5a52', outfit2: '#20342e', band: '#1c2b4a', trim: '#d8c9a8', accessory: 'scar' }, marker: 'mission', hasMissions: true, giver: 'D' },
    { id: 'hokage', name: 'Hiruzen Sarutobi', role: 'Tercer Hokage', x: 1510, y: 1000, portrait: 'hiruzen', art: { skin: '#e8c8a8', hair: '#e0e0e0', style: 'short', outfit: '#e8e2d8', outfit2: '#8a2a2a', band: '#1c2b4a', trim: '#c9402e', accessory: 'hat' }, marker: 'story', hasMissions: true, giver: 'S' },
    { id: 'shikamaru', name: 'Shikamaru Nara', role: 'Estratega Jōnin', x: 1800, y: 1560, portrait: 'shikamaru', art: D.CHAR_MAP.shikamaru.art, marker: 'mission', hasMissions: true, giver: 'C' },
    { id: 'sakura', name: 'Sakura Haruno', role: 'Médica de Konoha', x: 2310, y: 1330, portrait: 'sakura', art: D.CHAR_MAP.sakura.art, marker: 'mission', hasMissions: true, giver: 'C' },
    { id: 'kakashi', name: 'Kakashi Hatake', role: 'Jōnin del Equipo 7', x: 2440, y: 1530, portrait: 'kakashi', art: D.CHAR_MAP.kakashi.art, marker: 'mission', hasMissions: true, giver: 'B' },
    { id: 'rocklee', name: 'Rock Lee', role: 'El Poder de la Juventud', x: 2700, y: 1690, portrait: 'rocklee', art: D.CHAR_MAP.rocklee.art, marker: 'spar', hasMissions: false, training: true },
    { id: 'hinata', name: 'Hinata Hyūga', role: 'Kunoichi del Clan Hyūga', x: 1240, y: 1780, portrait: 'hinata', art: D.CHAR_MAP.hinata.art, marker: 'talk', hasMissions: false },
    { id: 'teuchi', name: 'Teuchi', role: 'Dueño de Ichiraku', x: 1035, y: 1550, portrait: 'teuchi', art: { skin: '#e0b894', hair: '#3a3a3a', style: 'short', outfit: '#e8e2d8', outfit2: '#8a2a2a', band: '#e8e2d8', trim: '#d84a2a', accessory: 'hat' }, marker: 'talk', hasMissions: false },
    { id: 'konohamaru', name: 'Konohamaru Sarutobi', role: 'Nieto del Hokage', x: 1930, y: 620, portrait: 'konohamaru', art: { skin: '#e8c4a0', hair: '#2a2422', style: 'short', outfit: '#2b4a7a', outfit2: '#1a2e4a', band: '#1c2b4a', trim: '#e8c94a' }, marker: 'talk', hasMissions: false, scale: 0.78 },
    { id: 'sasuke', name: 'Sasuke Uchiha', role: 'Último Uchiha', x: 990, y: 760, portrait: 'sasuke', art: D.CHAR_MAP.sasuke.art, marker: 'talk', hasMissions: false },
    { id: 'gate', name: 'Guardia de la Puerta', role: 'Chūnin de servicio', x: 505, y: 1780, portrait: '', art: { skin: '#e0b894', hair: '#2a2118', style: 'short', outfit: '#3a5a52', outfit2: '#20342e', band: '#1c2b4a', trim: '#c9c9d4' }, marker: 'talk', hasMissions: false },
    { id: 'kiba', name: 'Kiba Inuzuka', role: 'Rastreador de la Hoja', x: 1440, y: 1840, portrait: 'kiba', art: D.CHAR_MAP.kiba.art, marker: 'talk', hasMissions: false },
    { id: 'shino', name: 'Shino Aburame', role: 'Especialista en kikaichū', x: 1580, y: 1890, portrait: 'shino', art: D.CHAR_MAP.shino.art, marker: 'talk', hasMissions: false },
    { id: 'ino', name: 'Ino Yamanaka', role: 'Floristería Yamanaka', x: 1160, y: 1910, portrait: 'ino', art: D.CHAR_MAP.ino.art, marker: 'talk', hasMissions: false },
    { id: 'choji', name: 'Chōji Akimichi', role: 'Corazón de la Hoja', x: 1310, y: 1950, portrait: 'choji', art: D.CHAR_MAP.choji.art, marker: 'talk', hasMissions: false }
  ];

  const COLLECTIBLES = [
    { id: 'c01', x: 1030, y: 760, type: 'scroll', label: 'Pergamino olvidado' },
    { id: 'c02', x: 560, y: 1180, type: 'ryo', label: 'Bolsa de ryō' },
    { id: 'c03', x: 1190, y: 1050, type: 'leaf', label: 'Hoja de la Voluntad' },
    { id: 'c04', x: 1600, y: 940, type: 'scroll', label: 'Registro del Hokage' },
    { id: 'c05', x: 2240, y: 1510, type: 'ramen', label: 'Cupón de Ichiraku' },
    { id: 'c06', x: 2780, y: 1780, type: 'scroll', label: 'Pergamino de entrenamiento' },
    { id: 'c07', x: 2870, y: 1420, type: 'ryo', label: 'Monedero perdido' },
    { id: 'c08', x: 2600, y: 1130, type: 'leaf', label: 'Hoja de sakura' },
    { id: 'c09', x: 870, y: 1650, type: 'ramen', label: 'Tazón de ramen' },
    { id: 'c10', x: 1480, y: 1740, type: 'ryo', label: 'Pago de una misión' },
    { id: 'c11', x: 490, y: 1980, type: 'scroll', label: 'Mapa antiguo' },
    { id: 'c12', x: 1730, y: 2000, type: 'leaf', label: 'Hoja del Bosque' },
    { id: 'c13', x: 2010, y: 1290, type: 'scroll', label: 'Expediente perdido' },
    { id: 'c14', x: 1360, y: 580, type: 'ryo', label: 'Ofrenda al Hokage' }
  ];

  const ITEM_INFO = {
    scroll: { icon: '巻', label: 'Pergamino', xp: 80, ryo: 40 },
    ryo: { icon: '円', label: 'Ryō', xp: 20, ryo: 120 },
    ramen: { icon: '麺', label: 'Ramen', xp: 40, ryo: 30 },
    leaf: { icon: '葉', label: 'Hoja', xp: 60, ryo: 20 }
  };

  const ROAD_PATHS = [
    { points: [[180, 1270], [3050, 1270]], width: 96 },
    { points: [[1530, 500], [1530, 2200]], width: 84 },
    { points: [[1530, 1270], [2200, 1270], [2440, 1270], [2650, 1580]], width: 64 },
    { points: [[690, 1270], [690, 1700], [505, 1780], [505, 2040]], width: 58 },
    { points: [[1530, 1750], [1100, 1750], [1040, 1580]], width: 48 },
    { points: [[1900, 1270], [1900, 1450], [1800, 1510]], width: 42 }
  ];

  const PLACE_ZONES = [
    { name: 'ACADEMIA NINJA', x: 700, y: 1100, r: 330 },
    { name: 'TORRE DEL HOKAGE', x: 1520, y: 900, r: 330 },
    { name: 'OFICINA DE MISIONES', x: 1810, y: 1450, r: 240 },
    { name: 'ICHIRAKU RAMEN', x: 1040, y: 1460, r: 210 },
    { name: 'HOSPITAL DE KONOHA', x: 2310, y: 1210, r: 280 },
    { name: 'CAMPO DE ENTRENAMIENTO 3', x: 2560, y: 1650, r: 340 },
    { name: 'MERCADO DE KONOHA', x: 1280, y: 1820, r: 300 },
    { name: 'MONUMENTO DE LOS HOKAGE', x: 1570, y: 560, r: 320 },
    { name: 'PUERTA PRINCIPAL', x: 505, y: 1870, r: 230 },
    { name: 'ESTANQUE DEL CLAN', x: 840, y: 700, r: 260 }
  ];

  function makeWorld() {
    return {
      canvas: null, ctx: null, mini: null, miniCtx: null,
      state: null, callbacks: {},
      w: 960, h: 540, dpr: 1, zoom: 1,
      cam: { x: 0, y: 0 }, player: null,
      npcs: [], collectibles: [], trees: [], props: [], grass: [], flowers: [], stones: [], leaves: [],
      focus: null, paused: false, active: false, time: 0,
      last: 0, raf: null, keys: {}, touch: { dx: 0, dy: 0, active: false },
      afterimages: [], miniTimer: 0, placeTimer: 0, currentPlace: '',
      quest: null, spawn: 'academy', bound: {}, lastPrompt: '',
      day: 1, minutes: 8 * 60, dashCd: 0, dashTimer: 0, dashDir: { x: 1, y: 0 }
    };
  }

  let W = makeWorld();

  /* ---------------- Inicialización ---------------- */
  function start(canvas, opts) {
    stop();
    W = makeWorld();
    opts = opts || {};
    W.canvas = canvas;
    W.ctx = canvas.getContext('2d');
    W.state = opts.state;
    W.callbacks = opts.callbacks || {};
    W.spawn = opts.spawn || 'academy';
    W.minutes = W.state.timeMinutes || 8 * 60;
    W.day = W.state.day || 1;
    W.quest = opts.quest || null;
    W.mini = document.getElementById('minimap');
    W.miniCtx = W.mini ? W.mini.getContext('2d') : null;
    buildScenery();
    buildCollectibles();
    buildNpcs();
    resize();
    buildPlayer();
    bindEvents();
    bindJoystick();
    W.active = true;
    W.paused = false;
    W.last = performance.now();
    updateFocus();
    updateClock();
    updatePlace(true);
    if (W.callbacks.onReady) W.callbacks.onReady();
    const loop = function (t) {
      if (!W.active) return;
      W.raf = requestAnimationFrame(loop);
      let dt = (t - W.last) / 1000;
      W.last = t;
      if (dt > 0.05) dt = 0.05;
      if (!W.paused) {
        W.time += dt;
        update(dt);
        render();
      }
    };
    W.raf = requestAnimationFrame(loop);
    window.AudioEngine.playTrack('village');
    return W;
  }

  function stop() {
    if (W.raf) cancelAnimationFrame(W.raf);
    if (W.bound.keydown) window.removeEventListener('keydown', W.bound.keydown);
    if (W.bound.keyup) window.removeEventListener('keyup', W.bound.keyup);
    if (W.bound.blur) window.removeEventListener('blur', W.bound.blur);
    if (W.bound.resize) window.removeEventListener('resize', W.bound.resize);
    const ti = document.getElementById('touch-interact');
    if (ti && W.bound.touchInteract) ti.removeEventListener('pointerdown', W.bound.touchInteract);
    const td = document.getElementById('touch-dash');
    if (td && W.bound.touchDash) td.removeEventListener('pointerdown', W.bound.touchDash);
    const stick = document.getElementById('joystick');
    if (stick) {
      stick.onpointerdown = null; stick.onpointermove = null;
      stick.onpointerup = null; stick.onpointercancel = null;
    }
    W.active = false;
    W.raf = null;
  }

  function buildPlayer() {
    const p = W.state.profile;
    W.player = {
      x: 0, y: 0, facing: 1, walk: 0, moving: false,
      art: p.art, scale: 1.1 * (p.heightScale || 1),
      name: p.name, speed: 210 + (p.stats.spd || 0) * 5
    };
    if (W.spawn === 'training') {
      W.player.x = 2560; W.player.y = 1810;
    } else if (W.spawn === 'gate') {
      W.player.x = 505; W.player.y = 1770;
    } else {
      W.player.x = 740; W.player.y = 1210;
    }
    W.cam.x = clamp(W.player.x - W.w / W.zoom / 2, 0, Math.max(1, WORLD_W - W.w / W.zoom));
    W.cam.y = clamp(W.player.y - W.h / W.zoom / 2, 0, Math.max(1, WORLD_H - W.h / W.zoom));
  }

  function buildNpcs() {
    W.npcs = NPCS.filter(function (n) {
      return !(W.state.profile.baseId && n.id === W.state.profile.baseId);
    }).map(function (n) {
      return Object.assign({}, n, { baseX: n.x, baseY: n.y, walk: Math.random() * 10, facing: -1 });
    });
  }

  function buildCollectibles() {
    const taken = (W.state.progress && W.state.progress.collectibles) || [];
    W.collectibles = COLLECTIBLES.filter(function (c) { return taken.indexOf(c.id) < 0; }).map(function (c) {
      return Object.assign({ icon: ITEM_INFO[c.type].icon }, c, { t: Math.random() * 5 });
    });
  }

  function buildScenery() {
    const rng = mulberry32(20261022);
    W.trees = [];
    // árboles del borde y parques
    const treeZones = [
      { x: 0, y: 0, w: 3200, h: 480, n: 26 },
      { x: 0, y: 1750, w: 900, h: 550, n: 22 },
      { x: 2700, y: 300, w: 500, h: 1900, n: 28 },
      { x: 0, y: 400, w: 430, h: 1300, n: 20 },
      { x: 880, y: 450, w: 350, h: 320, n: 9 },
      { x: 1000, y: 1500, w: 1600, h: 500, n: 16 },
      { x: 1900, y: 200, w: 500, h: 700, n: 14 }
    ];
    treeZones.forEach(function (z) {
      for (let i = 0; i < z.n; i++) {
        const x = z.x + rng() * z.w;
        const y = z.y + rng() * z.h;
        if (insideAnyBuilding(x, y, 40)) continue;
        if (nearRoad(x, y, 52)) continue;
        if (dist(x, y, POND.x, POND.y) < POND.rx + 30) continue;
        if (dist(x, y, 720, 1210) < 160) continue;
        if (dist(x, y, 1510, 1000) < 150) continue;
        if (dist(x, y, 2560, 1640) < TRAINING.r + 10) continue;
        if (NPCS.some(function (n) { return dist(x, y, n.x, n.y) < 105; })) continue;
        const sakura = rng() < 0.22;
        W.trees.push({ x: x, y: y, r: 22 + rng() * 16, size: 0.85 + rng() * 0.5, sakura: sakura, sway: rng() * 6 });
      }
    });
    // árboles emblemáticos
    [
      [310, 1600, 1.2, false], [840, 480, 1.25, true], [980, 500, 0.95, true],
      [1250, 640, 0.9, false], [2420, 760, 1.1, false], [2860, 1010, 1.0, false],
      [560, 1460, 0.9, false], [1880, 2070, 1.1, true], [2440, 2050, 1.2, false],
      [1480, 2080, 0.95, false], [2120, 1780, 0.95, true], [430, 2000, 1.1, false]
    ].forEach(function (t) { W.trees.push({ x: t[0], y: t[1], r: 28, size: t[2], sakura: t[3], sway: Math.random() * 6 }); });

    W.grass = [];
    for (let i = 0; i < 230; i++) {
      W.grass.push({ x: rng() * WORLD_W, y: rng() * WORLD_H, s: 0.5 + rng() * 0.9, p: rng() * 6 });
    }
    W.flowers = [];
    const flowerColors = ['#f2c53d', '#e87a8a', '#7ab8e8', '#e8e2d8', '#c98ae8'];
    for (let i = 0; i < 110; i++) {
      const x = rng() * WORLD_W, y = rng() * WORLD_H;
      if (insideAnyBuilding(x, y, 20) || nearRoad(x, y, 18) || dist(x, y, POND.x, POND.y) < POND.rx) continue;
      W.flowers.push({ x: x, y: y, c: flowerColors[Math.floor(rng() * flowerColors.length)], s: 0.7 + rng() * 0.7 });
    }
    W.stones = [];
    for (let i = 0; i < 52; i++) {
      W.stones.push({ x: rng() * WORLD_W, y: rng() * WORLD_H, s: 0.6 + rng() * 1.2 });
    }
    W.props = [];
    // farolas a lo largo de las calles principales
    for (let x = 380; x < 3000; x += 310) W.props.push({ type: 'lamp', x: x, y: 1210 });
    for (let y = 620; y < 2100; y += 300) W.props.push({ type: 'lamp', x: 1580, y: y });
    // puestos del mercado
    [
      [1110, 1840], [1350, 1870], [1470, 1950], [1230, 2010]
    ].forEach(function (p, i) {
      W.props.push({ type: 'stall', x: p[0], y: p[1], color: i % 2 ? '#c9503a' : '#3a6a9a' });
    });
    // flores del jardín Yamanaka
    for (let i = 0; i < 14; i++) W.props.push({ type: 'flowerbed', x: 1120 + (i % 5) * 34, y: 1970 + Math.floor(i / 5) * 22 });
    // postes de entrenamiento
    for (let i = 0; i < 7; i++) {
      W.props.push({ type: 'post', x: TRAINING.x - 160 + i * 56, y: TRAINING.y + 50 + (i % 2) * 26 });
    }
    W.props.push({ type: 'log', x: TRAINING.x + 70, y: TRAINING.y - 20 });
    W.props.push({ type: 'target', x: TRAINING.x - 190, y: TRAINING.y - 20 });
    // señales
    [
      [1040, 1190, 'ACADEMIA'], [1460, 1190, 'HOKAGE'], [2010, 1290, 'HOSPITAL'],
      [1690, 1290, 'MISIONES'], [1120, 1300, 'ICHIRAKU'], [700, 1600, 'PUERTA'],
      [2470, 1460, 'ENTRENAMIENTO']
    ].forEach(function (s) { W.props.push({ type: 'sign', x: s[0], y: s[1], text: s[2] }); });
    // banco junto al estanque
    W.props.push({ type: 'bench', x: 870, y: 760 });
    // hojas flotantes
    W.leaves = [];
    for (let i = 0; i < 46; i++) W.leaves.push({ x: rng() * 1200, y: rng() * 700, vx: 8 + rng() * 20, vy: 14 + rng() * 18, r: rng() * Math.PI * 2, s: 0.7 + rng() * 0.8, sakura: rng() < 0.2 });
  }

  function insideAnyBuilding(x, y, pad) {
    return BUILDINGS.some(function (b) {
      if (!b.solid) return false;
      return x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad;
    });
  }

  function nearRoad(x, y, pad) {
    return ROAD_PATHS.some(function (r) {
      for (let i = 1; i < r.points.length; i++) {
        if (pointSegmentDist(x, y, r.points[i - 1][0], r.points[i - 1][1], r.points[i][0], r.points[i][1]) < r.width / 2 + pad) return true;
      }
      return false;
    });
  }

  function pointSegmentDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (!l2) return dist(px, py, x1, y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = clamp(t, 0, 1);
    return dist(px, py, x1 + t * dx, y1 + t * dy);
  }

  /* ---------------- Entrada ---------------- */
  function bindEvents() {
    W.bound.keydown = function (e) {
      if (!W.active) return;
      if (W.paused) return;
      W.keys[e.code] = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (W.dashCd <= 0) {
          W.dashTimer = 0.22; W.dashCd = 1.1;
          const ax = axis();
          W.dashDir.x = ax.x || (W.player.facing > 0 ? 1 : -1);
          W.dashDir.y = ax.y;
          window.AudioEngine.sfx('dash');
        }
      }
      if (e.code === 'KeyE') {
        e.preventDefault();
        interact();
      }
      if (e.code === 'Escape') { /* el menú lo maneja main */ }
    };
    W.bound.keyup = function (e) { W.keys[e.code] = false; };
    W.bound.blur = function () { W.keys = {}; };
    W.bound.resize = function () { resize(); };
    window.addEventListener('keydown', W.bound.keydown);
    window.addEventListener('keyup', W.bound.keyup);
    window.addEventListener('blur', W.bound.blur);
    window.addEventListener('resize', W.bound.resize);

    const touchBtn = document.getElementById('touch-interact');
    if (touchBtn) {
      W.bound.touchInteract = function (e) { e.preventDefault(); if (!W.paused) interact(); };
      touchBtn.addEventListener('pointerdown', W.bound.touchInteract);
    }
    const dashBtn = document.getElementById('touch-dash');
    if (dashBtn) {
      W.bound.touchDash = function (e) {
        e.preventDefault();
        if (W.paused || W.dashCd > 0) return;
        W.dashTimer = 0.22; W.dashCd = 1.1;
        const ax = axis();
        W.dashDir.x = ax.x || (W.player.facing > 0 ? 1 : -1);
        W.dashDir.y = ax.y;
        window.AudioEngine.sfx('dash');
      };
      dashBtn.addEventListener('pointerdown', W.bound.touchDash);
    }
  }

  function bindJoystick() {
    const stick = document.getElementById('joystick');
    const knob = document.getElementById('joystick-knob');
    if (!stick || !knob) return;
    let id = null;
    function move(ev) {
      if (id === null) return;
      const r = stick.getBoundingClientRect();
      let dx = ev.clientX - (r.left + r.width / 2);
      let dy = ev.clientY - (r.top + r.height / 2);
      const max = r.width * 0.36;
      const len = Math.hypot(dx, dy);
      if (len > max) { dx *= max / len; dy *= max / len; }
      knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      W.touch.dx = dx / max; W.touch.dy = dy / max; W.touch.active = true;
    }
    stick.onpointerdown = function (ev) {
      id = ev.pointerId; try { stick.setPointerCapture(id); } catch (e) {} move(ev); ev.preventDefault();
    };
    stick.onpointermove = function (ev) { if (ev.pointerId === id) move(ev); };
    function end(ev) {
      if (ev.pointerId !== id) return;
      id = null; W.touch.dx = 0; W.touch.dy = 0; W.touch.active = false;
      knob.style.transform = '';
    }
    stick.onpointerup = end;
    stick.onpointercancel = end;
  }

  function axis() {
    let x = 0, y = 0;
    if (W.keys.KeyA || W.keys.ArrowLeft) x -= 1;
    if (W.keys.KeyD || W.keys.ArrowRight) x += 1;
    if (W.keys.KeyW || W.keys.ArrowUp) y -= 1;
    if (W.keys.KeyS || W.keys.ArrowDown) y += 1;
    x += W.touch.dx || 0; y += W.touch.dy || 0;
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    return { x: x, y: y };
  }

  function interact() {
    if (!W.focus) return;
    window.AudioEngine.sfx('click');
    if (W.focus.type === 'npc') {
      if (W.callbacks.onInteract) W.callbacks.onInteract(W.focus.npc);
    } else if (W.focus.type === 'item') {
      const item = W.focus.item;
      item.taken = true;
      W.collectibles = W.collectibles.filter(function (c) { return !c.taken; });
      W.focus = null;
      updateFocus();
      window.AudioEngine.sfx('pickup');
      if (W.callbacks.onCollect) W.callbacks.onCollect(item);
    }
  }

  /* ---------------- Actualización ---------------- */
  function update(dt) {
    W.minutes += dt * 0.55;
    if (W.minutes >= 1440) { W.minutes -= 1440; W.day++; W.state.day = W.day; }
    W.state.timeMinutes = W.minutes;
    updatePlayer(dt);
    updateCamera(dt);
    updateFocus();
    updateLeaves(dt);
    W.dashCd = Math.max(0, W.dashCd - dt);
    W.dashTimer = Math.max(0, W.dashTimer - dt);
    W.afterimages.forEach(function (a) { a.life -= dt; });
    W.afterimages = W.afterimages.filter(function (a) { return a.life > 0; });
    W.miniTimer -= dt;
    if (W.miniTimer <= 0) { W.miniTimer = 0.12; drawMinimap(); }
    W.placeTimer -= dt;
    if (W.placeTimer <= 0) { W.placeTimer = 0.4; updatePlace(); }
    updateClock();
  }

  function updatePlayer(dt) {
    const p = W.player;
    const b = { left: 60, right: WORLD_W - 60, top: 70, bottom: WORLD_H - 60 };
    const ax = axis();
    let speed = 210 + ((W.state.profile.stats && W.state.profile.stats.spd) || 0) * 5;
    if (W.dashTimer > 0) {
      const dx = W.dashDir.x, dy = W.dashDir.y;
      const len = Math.hypot(dx, dy) || 1;
      movePlayer((dx / len) * 600 * dt, (dy / len) * 600 * dt);
      if (Math.random() < 0.7) W.afterimages.push({ x: p.x, y: p.y, facing: p.facing, walk: p.walk, life: 0.25, max: 0.25 });
    } else if (ax.x || ax.y) {
      movePlayer(ax.x * speed * dt, ax.y * speed * dt * 0.9);
      p.moving = true;
      p.walk += dt * 8;
      if (ax.x) p.facing = ax.x > 0 ? 1 : -1;
    } else {
      p.moving = false;
    }
    p.x = clamp(p.x, b.left, b.right);
    p.y = clamp(p.y, b.top, b.bottom);
  }

  function movePlayer(dx, dy) {
    const p = W.player;
    if (!collides(p.x + dx, p.y)) p.x += dx;
    if (!collides(p.x, p.y + dy)) p.y += dy;
  }

  function collides(x, y) {
    const r = 14;
    for (let i = 0; i < BUILDINGS.length; i++) {
      const b = BUILDINGS[i];
      if (!b.solid) continue;
      if (x > b.x - r && x < b.x + b.w + r && y > b.y - r && y < b.y + b.h + r) return true;
    }
    // estanque
    const dx = (x - POND.x) / (POND.rx + r);
    const dy = (y - POND.y) / (POND.ry + r);
    if (dx * dx + dy * dy < 1) return true;
    // acantilado
    if (x > CLIFF.x && x < CLIFF.x + CLIFF.w && y < CLIFF.y + CLIFF.h + 20) return true;
    // árboles
    for (let i = 0; i < W.trees.length; i++) {
      const t = W.trees[i];
      if (dist(x, y, t.x, t.y) < 14 * t.size) return true;
    }
    return false;
  }

  function updateCamera(dt) {
    const p = W.player;
    const viewW = W.w / W.zoom, viewH = W.h / W.zoom;
    const tx = clamp(p.x - viewW / 2, 0, Math.max(0, WORLD_W - viewW));
    const ty = clamp(p.y - viewH / 2, 0, Math.max(0, WORLD_H - viewH));
    W.cam.x += (tx - W.cam.x) * Math.min(1, dt * 7);
    W.cam.y += (ty - W.cam.y) * Math.min(1, dt * 7);
  }

  function updateFocus() {
    const p = W.player;
    let best = null, bd = 105;
    W.npcs.forEach(function (n) {
      const d = dist(p.x, p.y, n.x, n.y - 20);
      if (d < bd) { bd = d; best = { type: 'npc', npc: n, dist: d }; }
    });
    W.collectibles.forEach(function (c) {
      const d = dist(p.x, p.y, c.x, c.y);
      if (d < 66 && d < bd) { bd = d; best = { type: 'item', item: c, dist: d }; }
    });
    if (best && best.type === 'npc') {
      const n = best.npc;
      n.facing = p.x >= n.x ? 1 : -1;
      if (dist(p.x, p.y, n.x, n.baseY) < 160) n.facing = p.x >= n.x ? 1 : -1;
    }
    W.focus = best;
    const label = !best ? '' : best.type === 'npc' ? 'Hablar con ' + best.npc.name : ITEM_INFO[best.item.type].label + ': ' + best.item.label;
    if (label !== W.lastPrompt) {
      W.lastPrompt = label;
      const prompt = document.getElementById('interact-prompt');
      const text = document.getElementById('interact-text');
      if (prompt) prompt.classList.toggle('hidden', !best);
      if (text) text.textContent = best ? (best.type === 'npc' ? 'Hablar con ' + best.npc.name : 'Recoger ' + best.item.label) : '';
    }
    // mirada al jugador si está cerca
    W.npcs.forEach(function (n) {
      if (dist(p.x, p.y, n.x, n.y) < 180) n.facing = p.x >= n.x ? 1 : -1;
    });
  }

  function updateLeaves(dt) {
    const viewW = W.w / W.zoom, viewH = W.h / W.zoom;
    W.leaves.forEach(function (l) {
      l.x += l.vx * dt;
      l.y += l.vy * dt;
      l.r += dt * 2;
      if (l.y > viewH + 40) { l.y = -30; l.x = Math.random() * (viewW + 100) - 50; }
      if (l.x > viewW + 40) l.x = -30;
    });
  }

  function updateClock() {
    const h = Math.floor(W.minutes / 60) % 24;
    const m = Math.floor(W.minutes % 60);
    const c = document.getElementById('world-clock');
    const d = document.getElementById('world-day');
    if (c) c.textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    if (d) d.textContent = 'DÍA ' + W.day;
  }

  function updatePlace(force) {
    const p = W.player;
    let best = 'ALDEA OCULTA DE LA HOJA', bd = 99999;
    PLACE_ZONES.forEach(function (z) {
      const d = dist(p.x, p.y, z.x, z.y);
      if (d < z.r && d < bd) { bd = d; best = z.name; }
    });
    if (best !== W.currentPlace || force) {
      W.currentPlace = best;
      const el = document.getElementById('world-place');
      if (el) el.textContent = best;
    }
  }

  /* ---------------- Render ---------------- */
  function resize() {
    const rect = W.canvas.getBoundingClientRect();
    W.w = Math.max(320, rect.width || window.innerWidth);
    W.h = Math.max(240, rect.height || window.innerHeight);
    W.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W.canvas.width = Math.floor(W.w * W.dpr);
    W.canvas.height = Math.floor(W.h * W.dpr);
    W.zoom = clamp(Math.min(W.w / 1280, W.h / 760), 0.72, 1.12);
    if (W.player) {
      const viewW = W.w / W.zoom, viewH = W.h / W.zoom;
      W.cam.x = clamp(W.cam.x, 0, Math.max(0, WORLD_W - viewW));
      W.cam.y = clamp(W.cam.y, 0, Math.max(0, WORLD_H - viewH));
    }
  }

  function render() {
    const ctx = W.ctx;
    if (!ctx) return;
    ctx.setTransform(W.dpr, 0, 0, W.dpr, 0, 0);
    ctx.clearRect(0, 0, W.w, W.h);
    ctx.save();
    ctx.scale(W.zoom, W.zoom);
    ctx.translate(-Math.round(W.cam.x), -Math.round(W.cam.y));
    const view = { x: W.cam.x, y: W.cam.y, w: W.w / W.zoom, h: W.h / W.zoom };
    const m = 150;

    drawGround(ctx, view);
    drawCliff(ctx);
    drawRoads(ctx, view);
    drawPond(ctx);
    drawTrainingGround(ctx);

    // capa de objetos ordenables
    const list = [];
    BUILDINGS.forEach(function (b) {
      if (b.style === 'gatepillar') return;
      if (!vis(b.x, b.y - 300, b.w, b.h + 400, view, m)) return;
      list.push({ y: b.y + b.h, draw: function () { drawBuilding(ctx, b); } });
    });
    // puerta principal
    if (vis(280, 1680, 450, 320, view, m)) list.push({ y: 1990, draw: function () { drawGate(ctx); } });
    W.trees.forEach(function (t) {
      if (!vis(t.x - 100, t.y - 150, 200, 200, view, m)) return;
      list.push({ y: t.y, draw: function () { drawTree(ctx, t); } });
    });
    W.props.forEach(function (p) {
      if (!vis(p.x - 80, p.y - 100, 160, 160, view, m)) return;
      list.push({ y: p.y, draw: function () { drawProp(ctx, p); } });
    });
    W.collectibles.forEach(function (c) {
      if (!vis(c.x - 40, c.y - 60, 80, 100, view, m)) return;
      list.push({ y: c.y, draw: function () { drawCollectible(ctx, c); } });
    });
    W.npcs.forEach(function (n) {
      if (!vis(n.x - 80, n.y - 140, 160, 180, view, m)) return;
      list.push({ y: n.y, draw: function () { drawNpc(ctx, n); } });
    });
    W.afterimages.forEach(function (a) {
      list.push({ y: a.y - 1, draw: function () {
        ctx.save(); ctx.globalAlpha = (a.life / a.max) * 0.25;
        window.Art.character(ctx, W.player.art, a.x, a.y, W.player.scale, { time: W.time, facing: a.facing, walk: a.walk, moving: true, aura: '#6ed8ff' });
        ctx.restore();
      } });
    });
    list.push({ y: W.player.y, draw: function () { drawPlayer(ctx); } });
    list.sort(function (a, b) { return a.y - b.y; });
    list.forEach(function (o) { o.draw(); });

    drawQuestMarker(ctx);
    drawLampGlows(ctx, view);
    drawForegroundLeaves(ctx, view);
    ctx.restore();

    drawDayTint(ctx);
    drawScreenLeaves(ctx);
    drawQuestArrow(ctx);
    drawVignette(ctx);
  }

  function vis(x, y, w, h, view, m) {
    return x + w > view.x - m && x < view.x + view.w + m && y + h > view.y - m && y < view.y + view.h + m;
  }

  function drawGround(ctx, view) {
    const g = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    g.addColorStop(0, '#284a2c');
    g.addColorStop(0.5, '#2d522f');
    g.addColorStop(1, '#24452a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    // manchas de hierba
    const rng = mulberry32(8712);
    ctx.save();
    for (let i = 0; i < 30; i++) {
      const x = rng() * WORLD_W, y = rng() * WORLD_H;
      if (!vis(x - 200, y - 100, 400, 200, view, 300)) continue;
      ctx.fillStyle = i % 2 ? 'rgba(75, 125, 66, .18)' : 'rgba(42, 78, 44, .22)';
      ctx.beginPath(); ctx.ellipse(x, y, 130 + rng() * 160, 60 + rng() * 70, rng(), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    // hierba corta
    ctx.save();
    for (let i = 0; i < W.grass.length; i++) {
      const gr = W.grass[i];
      if (!vis(gr.x - 5, gr.y - 10, 10, 20, view, 50)) continue;
      const sway = Math.sin(W.time * 1.4 + gr.p) * 2;
      ctx.strokeStyle = 'rgba(110, 160, 92, .35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(gr.x, gr.y); ctx.lineTo(gr.x - 3 + sway, gr.y - 7 * gr.s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gr.x + 1, gr.y); ctx.lineTo(gr.x + 5 + sway, gr.y - 5 * gr.s); ctx.stroke();
    }
    for (let i = 0; i < W.stones.length; i++) {
      const s = W.stones[i];
      if (!vis(s.x - 10, s.y - 10, 20, 20, view, 50)) continue;
      ctx.fillStyle = 'rgba(90, 105, 88, .45)';
      ctx.beginPath(); ctx.ellipse(s.x, s.y, 4 * s.s, 2.5 * s.s, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawCliff(ctx) {
    // acantilado del monumento
    const c = CLIFF;
    ctx.save();
    ctx.fillStyle = '#3a3a36';
    ctx.beginPath();
    ctx.moveTo(c.x, c.y + c.h);
    ctx.lineTo(c.x + 20, c.y + 40);
    ctx.lineTo(c.x + 130, c.y + 10);
    ctx.lineTo(c.x + 380, c.y);
    ctx.lineTo(c.x + 640, c.y + 30);
    ctx.lineTo(c.x + c.w - 30, c.y + 70);
    ctx.lineTo(c.x + c.w, c.y + c.h);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4a4842';
    ctx.fillRect(c.x + 30, c.y + 80, c.w - 60, c.h - 80);
    // rostros tallados
    for (let i = 0; i < 4; i++) {
      const fx = c.x + 150 + i * 175;
      const fy = c.y + 205;
      ctx.fillStyle = 'rgba(24,24,22,.55)';
      ctx.beginPath(); ctx.ellipse(fx, fy, 58, 76, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(66,62,54,.9)';
      ctx.beginPath(); ctx.ellipse(fx, fy - 8, 52, 66, 0, 0, Math.PI * 2); ctx.fill();
      // ojos, nariz, boca
      ctx.fillStyle = 'rgba(22,22,20,.75)';
      ctx.beginPath(); ctx.ellipse(fx - 20, fy - 16, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(fx + 20, fy - 16, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(fx - 4, fy - 6); ctx.lineTo(fx + 4, fy - 6); ctx.lineTo(fx, fy + 16); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(22,22,20,.7)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(fx - 18, fy + 32); ctx.quadraticCurveTo(fx, fy + 40, fx + 18, fy + 32); ctx.stroke();
    }
    // borde superior de árboles
    ctx.fillStyle = 'rgba(25, 45, 28, .85)';
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.arc(c.x + 40 + i * 58, c.y + 10 + (i % 3) * 8, 34 + (i % 4) * 8, 0, Math.PI * 2);
      ctx.fill();
    }
    // escaleras
    ctx.fillStyle = '#5a554c';
    ctx.beginPath();
    ctx.moveTo(c.x + c.w / 2 - 110, c.y + c.h);
    ctx.lineTo(c.x + c.w / 2 - 70, c.y + c.h + 110);
    ctx.lineTo(c.x + c.w / 2 + 70, c.y + c.h + 110);
    ctx.lineTo(c.x + c.w / 2 + 110, c.y + c.h);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(30,30,26,.4)';
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(c.x + c.w / 2 - 110 + i * 4, c.y + c.h + i * 15);
      ctx.lineTo(c.x + c.w / 2 + 110 - i * 4, c.y + c.h + i * 15);
      ctx.stroke();
    }
    // bandera de la Hoja
    ctx.fillStyle = '#c9402e';
    ctx.fillRect(c.x + c.w / 2 + 150, c.y + 90, 10, 180);
    ctx.fillStyle = '#e8e2d8';
    ctx.fillRect(c.x + c.w / 2 + 160, c.y + 96, 78, 50);
    window.Art.symbol(ctx, 'leaf', c.x + c.w / 2 + 199, c.y + 121, 28, '#c9402e', 4);
    ctx.restore();
  }

  function drawRoads(ctx, view) {
    ctx.save();
    ROAD_PATHS.forEach(function (r) {
      // borde
      ctx.strokeStyle = 'rgba(46, 52, 40, .45)';
      ctx.lineWidth = r.width + 16;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      r.points.forEach(function (pt, i) { if (i === 0) ctx.moveTo(pt[0], pt[1]); else ctx.lineTo(pt[0], pt[1]); });
      ctx.stroke();
      // camino
      ctx.strokeStyle = '#8a7a5a';
      ctx.lineWidth = r.width;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(190, 172, 130, .25)';
      ctx.lineWidth = r.width * 0.55;
      ctx.stroke();
    });
    // adoquines y marcas
    ctx.fillStyle = 'rgba(80, 68, 48, .16)';
    for (let i = 0; i < 160; i++) {
      const x = (i * 197 + (i % 7) * 30) % WORLD_W;
      const y = 1270 + ((i * 53) % 40) - 20;
      if (x > view.x - 60 && x < view.x + view.w + 60) ctx.fillRect(x, y, 14, 5);
    }
    ctx.restore();
  }

  function drawPond(ctx) {
    ctx.save();
    // borde
    ctx.fillStyle = '#5a5140';
    ctx.beginPath(); ctx.ellipse(POND.x, POND.y, POND.rx + 18, POND.ry + 14, 0, 0, Math.PI * 2); ctx.fill();
    // agua
    const g = ctx.createRadialGradient(POND.x - 40, POND.y - 30, 20, POND.x, POND.y, POND.rx);
    g.addColorStop(0, '#4a8a9a');
    g.addColorStop(0.5, '#2f6a7a');
    g.addColorStop(1, '#1c4a58');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(POND.x, POND.y, POND.rx, POND.ry, 0, 0, Math.PI * 2); ctx.fill();
    // reflejos
    ctx.strokeStyle = 'rgba(180, 230, 240, .22)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.ellipse(POND.x - 20 + Math.sin(W.time * 0.7 + i) * 10, POND.y - 40 + i * 20, 60 - i * 4, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // nenúfares
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = '#3f6a3a';
      ctx.beginPath(); ctx.ellipse(POND.x - 110 + i * 55, POND.y + 35 + (i % 2) * 20, 13, 6, i, 0, Math.PI * 2); ctx.fill();
    }
    // muelle
    ctx.fillStyle = '#6a523a';
    ctx.fillRect(POND.x + 55, POND.y - 10, 105, 16);
    ctx.fillStyle = '#7a6246';
    for (let i = 0; i < 6; i++) ctx.fillRect(POND.x + 60 + i * 17, POND.y - 12, 12, 20);
    ctx.restore();
  }

  function drawTrainingGround(ctx) {
    const t = TRAINING;
    ctx.save();
    ctx.fillStyle = 'rgba(150, 126, 88, .65)';
    ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r, t.r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(110, 90, 60, .5)';
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 12]);
    ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r * 0.92, t.r * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    // suelo batido
    ctx.fillStyle = 'rgba(190, 160, 112, .16)';
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.ellipse(t.x - 180 + (i * 37) % 360, t.y - 60 + (i * 53) % 120, 20, 5, i, 0, Math.PI * 2);
      ctx.fill();
    }
    // tronco de práctica
    ctx.fillStyle = '#6a4a2a';
    ctx.fillRect(t.x - 240, t.y + 30, 18, 60);
    ctx.fillStyle = '#8a6a3a';
    ctx.beginPath(); ctx.arc(t.x - 231, t.y + 28, 19, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawBuilding(ctx, b) {
    ctx.save();
    const glow = lightFactor();
    // sombra
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(b.x + b.w / 2, b.y + b.h + 8, b.w * 0.55, 22, 0, 0, Math.PI * 2); ctx.fill();
    if (b.style === 'academy') drawAcademy(ctx, b, glow);
    else if (b.style === 'tower') drawTower(ctx, b, glow);
    else if (b.style === 'shop') drawShop(ctx, b, glow);
    else if (b.style === 'hospital') drawHospital(ctx, b, glow);
    else if (b.style === 'missions') drawMissions(ctx, b, glow);
    else drawHouse(ctx, b, glow);
    ctx.restore();
  }

  function drawHouse(ctx, b, glow) {
    const baseY = b.y + b.h;
    ctx.fillStyle = '#c9b892';
    ctx.fillRect(b.x, b.y + b.h * 0.32, b.w, b.h * 0.68);
    ctx.fillStyle = '#d8c9a8';
    ctx.fillRect(b.x + 8, b.y + b.h * 0.36, b.w - 16, b.h * 0.18);
    // tejado
    ctx.fillStyle = '#7a3a2a';
    ctx.beginPath();
    ctx.moveTo(b.x - 16, b.y + b.h * 0.36);
    ctx.lineTo(b.x + b.w / 2, b.y - 18);
    ctx.lineTo(b.x + b.w + 16, b.y + b.h * 0.36);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.1)';
    ctx.beginPath();
    ctx.moveTo(b.x - 16, b.y + b.h * 0.36);
    ctx.lineTo(b.x + b.w / 2, b.y - 18);
    ctx.lineTo(b.x + b.w / 2, b.y + 2);
    ctx.closePath(); ctx.fill();
    // puerta y ventanas
    ctx.fillStyle = '#5a3a26';
    ctx.fillRect(b.x + b.w * 0.42, baseY - 52, 34, 52);
    ctx.strokeStyle = 'rgba(30,20,12,.5)'; ctx.strokeRect(b.x + b.w * 0.42, baseY - 52, 34, 52);
    for (let i = 0; i < 2; i++) {
      const wx = b.x + 28 + i * (b.w - 100);
      ctx.fillStyle = glow > 0.55 ? '#ffd36a' : '#4a5a66';
      ctx.fillRect(wx, b.y + b.h * 0.56, 30, 26);
      ctx.strokeStyle = '#3a2a1e'; ctx.lineWidth = 2; ctx.strokeRect(wx, b.y + b.h * 0.56, 30, 26);
    }
    // símbolo del clan
    window.Art.symbol(ctx, 'leaf', b.x + b.w / 2, b.y + b.h * 0.5, 20, 'rgba(90, 50, 36, .7)', 4);
  }

  function drawAcademy(ctx, b, glow) {
    const baseY = b.y + b.h;
    ctx.fillStyle = '#d8cbb0';
    ctx.fillRect(b.x, b.y + 60, b.w, b.h - 60);
    ctx.fillStyle = '#e8ddc4';
    ctx.fillRect(b.x + 10, b.y + 66, b.w - 20, 40);
    // tejado azul
    ctx.fillStyle = '#2e4a66';
    ctx.beginPath();
    ctx.moveTo(b.x - 22, b.y + 70);
    ctx.lineTo(b.x + 60, b.y - 10);
    ctx.lineTo(b.x + b.w - 60, b.y - 10);
    ctx.lineTo(b.x + b.w + 22, b.y + 70);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a5a7a';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(b.x + 30 + i * (b.w - 60) / 8, b.y + 8, (b.w - 60) / 8 - 3, 52);
    }
    // segunda planta
    ctx.fillStyle = '#c9bca0';
    ctx.fillRect(b.x + 34, b.y + 96, b.w - 68, 40);
    ctx.fillStyle = '#d8cbb0';
    ctx.fillRect(b.x + 44, b.y + 100, b.w - 88, 10);
    // cartel
    ctx.fillStyle = '#8a2a2a';
    ctx.fillRect(b.x + b.w / 2 - 96, b.y + 112, 192, 38);
    ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 2; ctx.strokeRect(b.x + b.w / 2 - 92, b.y + 116, 184, 30);
    ctx.fillStyle = '#ffe0a0';
    ctx.font = '700 18px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ACADEMIA NINJA', b.x + b.w / 2, b.y + 138);
    // puertas
    ctx.fillStyle = '#6a4a32';
    ctx.fillRect(b.x + b.w / 2 - 44, baseY - 68, 88, 68);
    ctx.fillStyle = 'rgba(30,20,12,.5)';
    ctx.fillRect(b.x + b.w / 2 - 2, baseY - 68, 4, 68);
    for (let i = 0; i < 4; i++) {
      const wx = b.x + 40 + i * 100;
      ctx.fillStyle = glow > 0.55 ? '#ffd36a' : '#546a7a';
      ctx.fillRect(wx, b.y + 156, 36, 24);
      ctx.strokeStyle = '#5a4a3a'; ctx.strokeRect(wx, b.y + 156, 36, 24);
    }
    // banderas
    ctx.fillStyle = '#c9402e';
    ctx.fillRect(b.x + 18, b.y + 72, 10, 100);
    ctx.fillStyle = '#e8e2d8';
    ctx.fillRect(b.x + 28, b.y + 82, 62, 34);
    window.Art.symbol(ctx, 'leaf', b.x + 59, b.y + 99, 22, '#c9402e', 3);
    ctx.fillStyle = '#c9402e';
    ctx.fillRect(b.x + b.w - 28, b.y + 72, 10, 100);
  }

  function drawTower(ctx, b, glow) {
    const baseY = b.y + b.h;
    // base
    ctx.fillStyle = '#8a3a2a';
    ctx.fillRect(b.x, b.y + 30, b.w, b.h - 30);
    ctx.fillStyle = '#a84a34';
    ctx.fillRect(b.x + 12, b.y + 42, b.w - 24, 50);
    // pisos superiores
    for (let i = 0; i < 3; i++) {
      const inset = 40 + i * 42;
      const top = b.y - i * 62;
      ctx.fillStyle = i % 2 ? '#8a2a22' : '#a83a2a';
      ctx.fillRect(b.x + inset, top - 10, b.w - inset * 2, 54);
      ctx.fillStyle = '#d8c9a8';
      ctx.fillRect(b.x + inset + 10, top + 10, b.w - inset * 2 - 20, 6);
      // tejado
      ctx.fillStyle = '#5a2420';
      ctx.beginPath();
      ctx.moveTo(b.x + inset - 24, top - 10);
      ctx.lineTo(b.x + b.w / 2, top - 48);
      ctx.lineTo(b.x + b.w - inset + 24, top - 10);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7a2e22';
      ctx.beginPath();
      ctx.moveTo(b.x + inset - 24, top - 10);
      ctx.lineTo(b.x + b.w / 2, top - 48);
      ctx.lineTo(b.x + b.w / 2, top - 38);
      ctx.lineTo(b.x + inset - 14, top - 4);
      ctx.closePath(); ctx.fill();
    }
    // corona y símbolo
    ctx.fillStyle = '#c9402e';
    ctx.fillRect(b.x + b.w / 2 - 5, b.y - 240, 10, 52);
    ctx.fillStyle = '#e8e2d8';
    ctx.fillRect(b.x + b.w / 2 + 5, b.y - 236, 84, 40);
    window.Art.symbol(ctx, 'leaf', b.x + b.w / 2 + 47, b.y - 216, 24, '#c9402e', 4);
    // puerta principal
    ctx.fillStyle = '#4a2a1e';
    ctx.fillRect(b.x + b.w / 2 - 50, baseY - 80, 100, 80);
    ctx.strokeStyle = '#e8c26a'; ctx.lineWidth = 2; ctx.strokeRect(b.x + b.w / 2 - 44, baseY - 74, 88, 68);
    ctx.fillStyle = '#ffd36a';
    ctx.font = '700 16px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOKAGE', b.x + b.w / 2, baseY - 100);
    // ventanas
    for (let i = 0; i < 4; i++) {
      const wx = b.x + 36 + i * 92;
      ctx.fillStyle = glow > 0.55 ? '#ffd36a' : '#4a3a3a';
      ctx.fillRect(wx, b.y + 100, 30, 24);
      ctx.strokeStyle = '#e8c26a'; ctx.strokeRect(wx, b.y + 100, 30, 24);
    }
    // escalinata
    ctx.fillStyle = '#8a8478';
    ctx.fillRect(b.x + b.w / 2 - 80, baseY, 160, 20);
    ctx.fillStyle = '#9a9488';
    ctx.fillRect(b.x + b.w / 2 - 100, baseY + 18, 200, 18);
  }

  function drawMissions(ctx, b, glow) {
    drawHouse(ctx, b, glow);
    // tablón de misiones
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(b.x + 20, b.y + b.h - 86, 70, 50);
    ctx.fillStyle = '#d8c9a8';
    ctx.fillRect(b.x + 25, b.y + b.h - 81, 60, 40);
    ctx.fillStyle = '#c9402e';
    ctx.fillRect(b.x + 30, b.y + b.h - 76, 22, 14);
    ctx.fillStyle = '#3a6a8a';
    ctx.fillRect(b.x + 56, b.y + b.h - 72, 24, 12);
    ctx.fillStyle = '#e8e2d8';
    ctx.font = '700 10px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MISIONES', b.x + 55, b.y + b.h - 46);
  }

  function drawShop(ctx, b, glow) {
    // toldo
    ctx.fillStyle = '#5a3a26';
    ctx.fillRect(b.x, b.y + 30, b.w, b.h - 30);
    ctx.fillStyle = '#d8c9a8';
    ctx.fillRect(b.x + 10, b.y + 42, b.w - 20, 34);
    // rayas
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = i % 2 ? '#c9402e' : '#e8e2d8';
      ctx.beginPath();
      ctx.moveTo(b.x + i * (b.w / 7), b.y + 12);
      ctx.lineTo(b.x + (i + 1) * (b.w / 7), b.y + 12);
      ctx.lineTo(b.x + (i + 1) * (b.w / 7) + 10, b.y + 42);
      ctx.lineTo(b.x + i * (b.w / 7) - 10, b.y + 42);
      ctx.closePath(); ctx.fill();
    }
    // mostrador y cortinas
    ctx.fillStyle = '#6a4a32';
    ctx.fillRect(b.x + 20, b.y + b.h - 56, b.w - 40, 56);
    ctx.fillStyle = '#e8e2d8';
    ctx.fillRect(b.x + 22, b.y + b.h - 52, b.w - 44, 7);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = 'rgba(232,226,216,.7)';
      ctx.fillRect(b.x + 34 + i * 48, b.y + 76, 34, 34);
      window.Art.symbol(ctx, 'leaf', b.x + 51 + i * 48, b.y + 93, 13, 'rgba(60,40,26,.6)', 2);
    }
    // linterna
    ctx.fillStyle = '#c9402e';
    ctx.beginPath(); ctx.arc(b.x + 24, b.y + 62, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = glow > .5 ? '#ffd36a' : 'rgba(255,200,100,.4)';
    ctx.beginPath(); ctx.arc(b.x + 24, b.y + 62, 6, 0, Math.PI * 2); ctx.fill();
    // cartel
    ctx.fillStyle = '#2a1a12';
    ctx.fillRect(b.x + b.w / 2 - 52, b.y - 24, 104, 40);
    ctx.strokeStyle = '#e8c26a'; ctx.lineWidth = 2; ctx.strokeRect(b.x + b.w / 2 - 48, b.y - 20, 96, 32);
    ctx.fillStyle = '#ffd36a'; ctx.font = '700 15px Rajdhani, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('ICHIRAKU', b.x + b.w / 2, b.y + 1);
  }

  function drawHospital(ctx, b, glow) {
    ctx.fillStyle = '#dde4e2';
    ctx.fillRect(b.x, b.y + 36, b.w, b.h - 36);
    ctx.fillStyle = '#c4d0ce';
    ctx.fillRect(b.x + 12, b.y + 46, b.w - 24, 32);
    ctx.fillStyle = '#5a7a72';
    ctx.beginPath();
    ctx.moveTo(b.x - 18, b.y + 50);
    ctx.lineTo(b.x + b.w / 2, b.y - 20);
    ctx.lineTo(b.x + b.w + 18, b.y + 50);
    ctx.closePath(); ctx.fill();
    // cruz / símbolo médico
    ctx.fillStyle = '#3a8a72';
    ctx.fillRect(b.x + b.w / 2 - 8, b.y + 88, 16, 48);
    ctx.fillRect(b.x + b.w / 2 - 24, b.y + 104, 48, 16);
    // ventanas
    for (let i = 0; i < 3; i++) {
      const wx = b.x + 40 + i * 110;
      ctx.fillStyle = glow > 0.55 ? '#ffe0a0' : '#8aa0a8';
      ctx.fillRect(wx, b.y + 62, 46, 30);
      ctx.strokeStyle = '#5a6a6a'; ctx.strokeRect(wx, b.y + 62, 46, 30);
    }
    // entrada
    ctx.fillStyle = '#5a6a6a';
    ctx.fillRect(b.x + b.w / 2 - 42, b.y + b.h - 64, 84, 64);
    ctx.fillStyle = '#3a8a72';
    ctx.beginPath(); ctx.moveTo(b.x + b.w / 2 - 42, b.y + b.h - 64); ctx.lineTo(b.x + b.w / 2, b.y + b.h - 92); ctx.lineTo(b.x + b.w / 2 + 42, b.y + b.h - 64); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8f4f0'; ctx.font = '700 12px Rajdhani, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('HOSPITAL', b.x + b.w / 2, b.y + b.h - 74);
  }

  function drawGate(ctx) {
    const y = 1850;
    ctx.save();
    // postes
    ctx.fillStyle = '#6a3a2a';
    ctx.fillRect(280, y, 80, 150);
    ctx.fillRect(650, y, 80, 150);
    ctx.fillStyle = '#8a4a32';
    ctx.fillRect(290, y + 8, 60, 134);
    ctx.fillRect(660, y + 8, 60, 134);
    // viga
    ctx.fillStyle = '#5a2e22';
    ctx.fillRect(250, y - 20, 510, 42);
    ctx.fillStyle = '#8a3a2a';
    ctx.fillRect(260, y - 12, 490, 22);
    // tejado
    ctx.fillStyle = '#3a2a22';
    ctx.beginPath();
    ctx.moveTo(230, y - 16);
    ctx.lineTo(300, y - 70);
    ctx.lineTo(710, y - 70);
    ctx.lineTo(780, y - 16);
    ctx.closePath(); ctx.fill();
    // letrero
    ctx.fillStyle = '#2a1a14';
    ctx.fillRect(432, y - 12, 146, 44);
    ctx.strokeStyle = '#e8c26a'; ctx.lineWidth = 2; ctx.strokeRect(437, y - 7, 136, 34);
    ctx.fillStyle = '#ffd36a'; ctx.font = '700 17px Rajdhani, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('KONOHA', 505, y + 16);
    window.Art.symbol(ctx, 'leaf', 505, y - 46, 30, '#e8c26a', 4);
    // vallas
    ctx.strokeStyle = '#6a5a42'; ctx.lineWidth = 5;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(220 - i * 18, y + 60); ctx.lineTo(220 - i * 18, y + 120); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(790 + i * 18, y + 60); ctx.lineTo(790 + i * 18, y + 120); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(130, y + 70); ctx.lineTo(280, y + 70); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(730, y + 70); ctx.lineTo(880, y + 70); ctx.stroke();
    ctx.restore();
  }

  function drawTree(ctx, t) {
    ctx.save();
    const sway = Math.sin(W.time * 1.1 + t.sway) * 2.5;
    const s = t.size;
    // sombra
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath(); ctx.ellipse(t.x, t.y + 6, 44 * s, 14 * s, 0, 0, Math.PI * 2); ctx.fill();
    // tronco
    ctx.fillStyle = '#4a3524';
    ctx.beginPath();
    ctx.moveTo(t.x - 9 * s, t.y);
    ctx.quadraticCurveTo(t.x - 5 * s, t.y - 40 * s, t.x - 3 * s + sway, t.y - 72 * s);
    ctx.lineTo(t.x + 4 * s + sway, t.y - 72 * s);
    ctx.quadraticCurveTo(t.x + 6 * s, t.y - 40 * s, t.x + 10 * s, t.y);
    ctx.closePath(); ctx.fill();
    // copa
    const colors = t.sakura ? ['#8a4a5a', '#a85a6a', '#c96a7a', '#e88a9a'] : ['#1f4028', '#2a542f', '#356a3a', '#407a42'];
    for (let i = 0; i < 5; i++) {
      const ox = Math.cos(i * 1.7) * 34 * s + sway * (i / 3);
      const oy = -78 * s + Math.sin(i * 2.1) * 24 * s;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath(); ctx.arc(t.x + ox, t.y + oy, (34 + (i % 3) * 9) * s, 0, Math.PI * 2); ctx.fill();
    }
    // hojas claras
    if (t.sakura) {
      ctx.fillStyle = 'rgba(255, 190, 200, .4)';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(t.x - 30 * s + i * 16 * s, t.y - 90 * s + (i % 2) * 16 * s, 5 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawProp(ctx, p) {
    ctx.save();
    if (p.type === 'lamp') {
      ctx.fillStyle = '#3a3a34';
      ctx.fillRect(p.x - 4, p.y - 76, 8, 76);
      ctx.fillStyle = '#4a4a44';
      ctx.fillRect(p.x - 13, p.y - 82, 26, 8);
      ctx.fillStyle = lightFactor() > 0.5 ? '#ffd36a' : 'rgba(255, 204, 120, .45)';
      ctx.beginPath(); ctx.arc(p.x, p.y - 82, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2a2a26'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y - 82, 12, 0, Math.PI * 2); ctx.stroke();
    } else if (p.type === 'stall') {
      ctx.fillStyle = 'rgba(0,0,0,.2)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 4, 55, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6a4a32';
      ctx.fillRect(p.x - 40, p.y - 32, 80, 36);
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 ? p.color : '#e8e2d8';
        ctx.fillRect(p.x - 48 + i * 20, p.y - 54, 20, 22);
      }
      ctx.fillStyle = '#3a2a1e';
      ctx.fillRect(p.x - 46, p.y - 56, 92, 5);
      ctx.fillStyle = '#d8c9a8';
      ctx.fillRect(p.x - 34, p.y - 28, 20, 14);
      ctx.fillRect(p.x + 6, p.y - 28, 24, 10);
    } else if (p.type === 'post') {
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6a4a2a';
      ctx.fillRect(p.x - 7, p.y - 60, 14, 60);
      ctx.fillStyle = '#8a6a3a';
      ctx.beginPath(); ctx.arc(p.x, p.y - 60, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(40,26,14,.5)'; ctx.strokeRect(p.x - 7, p.y - 60, 14, 60);
    } else if (p.type === 'log') {
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, 44, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6a4a2a';
      ctx.fillRect(p.x - 44, p.y - 22, 88, 24);
      ctx.fillStyle = '#8a6a3a';
      ctx.beginPath(); ctx.ellipse(p.x + 44, p.y - 10, 12, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(50,32,18,.5)';
      ctx.beginPath(); ctx.arc(p.x + 44, p.y - 10, 6, 0, Math.PI * 2); ctx.stroke();
    } else if (p.type === 'target') {
      ctx.fillStyle = '#6a4a2a';
      ctx.fillRect(p.x - 3, p.y - 70, 6, 70);
      ctx.fillStyle = '#d8c9a8';
      ctx.beginPath(); ctx.arc(p.x, p.y - 78, 24, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c9402e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p.x, p.y - 78, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#c9402e';
      ctx.beginPath(); ctx.arc(p.x, p.y - 78, 6, 0, Math.PI * 2); ctx.fill();
    } else if (p.type === 'sign') {
      ctx.fillStyle = '#5a4028';
      ctx.fillRect(p.x - 3, p.y - 36, 6, 36);
      ctx.fillStyle = '#8a6a42';
      ctx.fillRect(p.x - 44, p.y - 62, 88, 28);
      ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 2; ctx.strokeRect(p.x - 42, p.y - 60, 84, 24);
      ctx.fillStyle = '#f0e2c0'; ctx.font = '700 8px Rajdhani, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y - 45);
    } else if (p.type === 'bench') {
      ctx.fillStyle = '#5a4028';
      ctx.fillRect(p.x - 38, p.y - 18, 76, 10);
      ctx.fillRect(p.x - 30, p.y - 8, 8, 16);
      ctx.fillRect(p.x + 22, p.y - 8, 8, 16);
      ctx.fillStyle = '#7a5a3a';
      ctx.fillRect(p.x - 38, p.y - 26, 76, 8);
    } else if (p.type === 'flowerbed') {
      ctx.fillStyle = '#3f5a32';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 16, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = p.x % 2 ? '#f2c53d' : '#e87a8a';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.arc(p.x - 8 + i * 8, p.y - 5 - (i % 2) * 4, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawNpc(ctx, n) {
    const scale = 1.05 * (n.scale || 1);
    const bob = Math.sin(W.time * 1.8 + n.walk) * 0.8;
    ctx.save();
    window.Art.character(ctx, n.art, n.x, n.y, scale, {
      time: W.time, facing: n.facing, walk: n.walk, moving: false
    });
    // nombre y rol
    if (dist(W.player.x, W.player.y, n.x, n.y) < 280) {
      ctx.textAlign = 'center';
      const nameY = n.y - 125 * scale;
      ctx.font = '700 12px Rajdhani, sans-serif';
      const tw = ctx.measureText(n.name).width;
      ctx.fillStyle = 'rgba(4, 14, 22, .72)';
      ctx.fillRect(n.x - tw / 2 - 8, nameY - 15, tw + 16, 19);
      ctx.fillStyle = '#e8f2f8';
      ctx.fillText(n.name, n.x, nameY);
      ctx.font = '600 8px Rajdhani, sans-serif';
      ctx.fillStyle = 'rgba(120, 216, 255, .8)';
      ctx.fillText(n.role.toUpperCase(), n.x, nameY + 12);
    }
    // marcador
    const markerY = n.y - 150 * scale + bob;
    if (n.marker === 'mission') drawMarker(ctx, n.x, markerY, '!', '#ffc247');
    else if (n.marker === 'story') drawMarker(ctx, n.x, markerY, '巻', '#66d9ff');
    else if (n.marker === 'spar') drawMarker(ctx, n.x, markerY, '⚔', '#ff8a5a');
    else drawMarker(ctx, n.x, markerY, '?', 'rgba(150, 200, 225, .75)');
    // si es objetivo de misión
    if (W.quest && W.quest.targetNpc === n.id) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,194,71,.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(n.x, n.y + 2, 26, 8, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawMarker(ctx, x, y, text, color) {
    const bob = Math.sin(W.time * 3) * 3;
    ctx.save();
    ctx.translate(x, y + bob);
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(4, 14, 22, .85)';
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = '700 12px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 0, 4);
    ctx.restore();
  }

  function drawCollectible(ctx, c) {
    const bob = Math.sin(W.time * 2.2 + c.t) * 5;
    const y = c.y - 22 + bob;
    ctx.save();
    const g = ctx.createRadialGradient(c.x, y, 2, c.x, y, 30);
    g.addColorStop(0, 'rgba(255, 230, 150, .7)');
    g.addColorStop(1, 'rgba(255, 190, 70, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(c.x, y, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(5, 18, 30, .82)';
    ctx.beginPath(); ctx.arc(c.x, y, 12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#ffe3a0';
    ctx.font = '700 12px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(c.icon, c.x, y + 4);
    ctx.restore();
  }

  function drawLampGlows(ctx, view) {
    const glow = lightFactor();
    if (glow < 0.25) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    W.props.forEach(function (p) {
      if (p.type !== 'lamp' || !vis(p.x - 80, p.y - 160, 160, 180, view, 100)) return;
      const g = ctx.createRadialGradient(p.x, p.y - 82, 2, p.x, p.y - 82, 74);
      g.addColorStop(0, 'rgba(255, 200, 110, ' + (0.22 * glow) + ')');
      g.addColorStop(1, 'rgba(255, 180, 80, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y - 82, 74, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }

  function drawForegroundLeaves(ctx, view) {
    // hojas dentro del mundo, cerca de la cámara
    ctx.save();
    for (let i = 0; i < 20; i++) {
      const seed = i * 137.5;
      const x = view.x + ((seed + W.time * 18) % (view.w + 100)) - 50;
      const y = view.y + ((seed * 1.7 + W.time * 24) % (view.h + 80)) - 40;
      const r = W.time + i;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(r);
      ctx.fillStyle = i % 3 ? 'rgba(110, 160, 80, .35)' : 'rgba(255, 200, 120, .28)';
      ctx.beginPath(); ctx.ellipse(0, 0, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawDayTint(ctx) {
    const h = (W.minutes / 60) % 24;
    let color = null, alpha = 0;
    if (h >= 5 && h < 7.5) { color = '#f0a060'; alpha = 0.16 * (1 - Math.abs(h - 6.2) / 1.4); }
    else if (h >= 7.5 && h < 17) { color = null; }
    else if (h >= 17 && h < 19.5) { color = '#e87a3a'; alpha = 0.18 * (1 - Math.abs(h - 18.2) / 1.5); }
    else { color = '#0a1730'; alpha = 0.48; }
    if (color && alpha > 0.01) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(0, 0, W.w, W.h);
      ctx.restore();
    }
    // viñeta de noche
    if (alpha > 0.3) {
      ctx.save();
      ctx.fillStyle = 'rgba(2, 6, 14, .25)';
      ctx.fillRect(0, 0, W.w, W.h);
      ctx.restore();
    }
  }

  function drawScreenLeaves(ctx) {
    ctx.save();
    for (let i = 0; i < W.leaves.length; i++) {
      const l = W.leaves[i];
      const x = ((l.x - W.cam.x * 0.35) % (W.w + 100)) - 50;
      const y = ((l.y - W.cam.y * 0.35) % (W.h + 100)) - 50;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(l.r);
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = l.sakura ? 'rgba(255, 170, 200, .7)' : 'rgba(150, 190, 110, .65)';
      ctx.beginPath(); ctx.ellipse(0, 0, 7 * l.s, 3 * l.s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawVignette(ctx) {
    const g = ctx.createRadialGradient(W.w / 2, W.h / 2, Math.min(W.w, W.h) * 0.35, W.w / 2, W.h / 2, Math.max(W.w, W.h) * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,.36)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W.w, W.h);
  }

  function drawPlayer(ctx) {
    const p = W.player;
    ctx.save();
    window.Art.character(ctx, p.art, p.x, p.y, p.scale, {
      time: W.time, facing: p.facing, walk: p.walk, moving: p.moving
    });
    ctx.restore();
    // círculo de interacción
    if (W.focus) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 194, 71, .3)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, 22, 7, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  }

  function drawQuestMarker(ctx) {
    if (!W.quest) return;
    let x = W.quest.targetX, y = W.quest.targetY;
    if (W.quest.targetNpc) {
      const n = W.npcs.filter(function (n) { return n.id === W.quest.targetNpc; })[0];
      if (n) { x = n.x; y = n.y - 185; }
    }
    if (x == null || y == null) return;
    const bob = Math.sin(W.time * 2.5) * 5;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = 'rgba(255, 194, 71, .9)';
    ctx.fillRect(-7, -7, 14, 14);
    ctx.strokeStyle = 'rgba(255, 240, 200, .8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-7, -7, 14, 14);
    ctx.restore();
    const d = dist(W.player.x, W.player.y, x, y);
    if (d < 900) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 224, 160, .8)';
      ctx.font = '600 10px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(d / 10) + ' m', x, y + 20);
      ctx.restore();
    }
  }

  function drawQuestArrow(ctx) {
    if (!W.quest) return;
    let x = W.quest.targetX, y = W.quest.targetY;
    if (W.quest.targetNpc) {
      const n = W.npcs.filter(function (n) { return n.id === W.quest.targetNpc; })[0];
      if (n) { x = n.x; y = n.y; }
    }
    if (x == null || y == null) return;
    const sx = (x - W.cam.x) * W.zoom;
    const sy = (y - W.cam.y) * W.zoom;
    const m = 60;
    if (sx > m && sx < W.w - m && sy > m && sy < W.h - m) return;
    const cx = W.w / 2, cy = W.h / 2;
    let dx = sx - cx, dy = sy - cy;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const tx = cx + dx * Math.min(W.w * 0.43, W.h * 0.4);
    const ty = cy + dy * Math.min(W.w * 0.43, W.h * 0.4);
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(Math.atan2(dy, dx));
    ctx.fillStyle = 'rgba(255, 194, 71, .85)';
    ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -8); ctx.lineTo(-4, 0); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = 'rgba(255, 224, 160, .75)';
    ctx.font = '700 9px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(dist(W.player.x, W.player.y, x, y) / 10) + ' m', tx - dx * 22, ty - dy * 22);
    ctx.restore();
  }

  function lightFactor() {
    const h = (W.minutes / 60) % 24;
    if (h >= 7 && h <= 17) return 0.15;
    if (h > 17 && h < 19.5) return 0.15 + (h - 17) / 2.5 * 0.85;
    if (h >= 19.5 || h < 5) return 1;
    return 0.7;
  }

  /* ---------------- Minimapa y mapa grande ---------------- */
  function drawMinimap() {
    if (!W.miniCtx) return;
    const c = W.miniCtx;
    const cw = W.mini.width, ch = W.mini.height;
    c.clearRect(0, 0, cw, ch);
    c.fillStyle = '#0a1a12';
    c.fillRect(0, 0, cw, ch);
    const pad = 6;
    const scale = Math.min((cw - pad * 2) / WORLD_W, (ch - pad * 2) / WORLD_H);
    const ox = (cw - WORLD_W * scale) / 2, oy = (ch - WORLD_H * scale) / 2;
    c.save();
    c.translate(ox, oy);
    c.scale(scale, scale);
    c.fillStyle = '#1f3a24';
    c.fillRect(0, 0, WORLD_W, WORLD_H);
    // carreteras
    c.strokeStyle = '#6a6046';
    c.lineWidth = 50;
    ROAD_PATHS.forEach(function (r) {
      c.beginPath();
      r.points.forEach(function (pt, i) { if (i === 0) c.moveTo(pt[0], pt[1]); else c.lineTo(pt[0], pt[1]); });
      c.stroke();
    });
    // estanque
    c.fillStyle = '#2f5a6a';
    c.beginPath(); c.ellipse(POND.x, POND.y, POND.rx, POND.ry, 0, 0, Math.PI * 2); c.fill();
    // edificios
    BUILDINGS.forEach(function (b) {
      if (b.style === 'gatepillar') return;
      c.fillStyle = b.style === 'tower' ? '#b0503a' : b.style === 'academy' ? '#4a6a8a' : b.style === 'hospital' ? '#c4d0ce' : '#8a6a4a';
      c.fillRect(b.x, b.y, b.w, b.h);
    });
    // NPCs
    W.npcs.forEach(function (n) {
      c.fillStyle = n.hasMissions ? '#ffc247' : 'rgba(180, 220, 240, .85)';
      c.beginPath(); c.arc(n.x, n.y, 32, 0, Math.PI * 2); c.fill();
    });
    // jugador
    const p = W.player;
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.facing > 0 ? 0 : Math.PI);
    c.fillStyle = '#ff8a2a';
    c.beginPath(); c.moveTo(90, 0); c.lineTo(-52, -52); c.lineTo(-24, 0); c.lineTo(-52, 52); c.closePath(); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 10; c.stroke();
    c.restore();
    // objetivo
    if (W.quest) {
      let qx = W.quest.targetX, qy = W.quest.targetY;
      if (W.quest.targetNpc) {
        const n = W.npcs.filter(function (n) { return n.id === W.quest.targetNpc; })[0];
        if (n) { qx = n.x; qy = n.y; }
      }
      if (qx != null) {
        c.strokeStyle = '#ffc247'; c.lineWidth = 12;
        c.beginPath(); c.arc(qx, qy, 95 + Math.sin(W.time * 3) * 16, 0, Math.PI * 2); c.stroke();
      }
    }
    c.restore();
    // marco
    c.strokeStyle = 'rgba(120, 200, 240, .25)';
    c.lineWidth = 2;
    c.strokeRect(1, 1, cw - 2, ch - 2);
  }

  function drawBigMap(canvas) {
    if (!canvas) return;
    const c = canvas.getContext('2d');
    const cw = canvas.width, ch = canvas.height;
    c.clearRect(0, 0, cw, ch);
    c.fillStyle = '#0a1a12';
    c.fillRect(0, 0, cw, ch);
    const pad = 24;
    const scale = Math.min((cw - pad * 2) / WORLD_W, (ch - pad * 2) / WORLD_H);
    const ox = (cw - WORLD_W * scale) / 2, oy = (ch - WORLD_H * scale) / 2;
    c.save();
    c.translate(ox, oy); c.scale(scale, scale);
    c.fillStyle = '#233f28';
    c.fillRect(0, 0, WORLD_W, WORLD_H);
    // zona verde
    c.fillStyle = 'rgba(40, 80, 42, .45)';
    c.beginPath(); c.arc(720, 620, 400, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(2560, 1640, 380, 0, Math.PI * 2); c.fill();
    // caminos
    c.strokeStyle = '#a08a60';
    c.lineCap = 'round'; c.lineJoin = 'round';
    ROAD_PATHS.forEach(function (r) {
      c.lineWidth = r.width;
      c.beginPath();
      r.points.forEach(function (pt, i) { if (i === 0) c.moveTo(pt[0], pt[1]); else c.lineTo(pt[0], pt[1]); });
      c.stroke();
    });
    // estanque
    c.fillStyle = '#2f6a7a';
    c.beginPath(); c.ellipse(POND.x, POND.y, POND.rx, POND.ry, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(180,230,240,.4)'; c.lineWidth = 3; c.stroke();
    // acantilado
    c.fillStyle = '#4a4842';
    c.fillRect(CLIFF.x, CLIFF.y, CLIFF.w, CLIFF.h);
    c.fillStyle = 'rgba(20,20,18,.5)';
    for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(CLIFF.x + 180 + i * 180, CLIFF.y + 180, 55, 0, Math.PI * 2); c.fill(); }
    // entrenamiento
    c.strokeStyle = 'rgba(200, 170, 120, .5)'; c.lineWidth = 6; c.setLineDash([18, 14]);
    c.beginPath(); c.ellipse(TRAINING.x, TRAINING.y, TRAINING.r, TRAINING.r * .62, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    // edificios
    BUILDINGS.forEach(function (b) {
      if (b.style === 'gatepillar') return;
      c.fillStyle = b.style === 'tower' ? '#c9503a' : b.style === 'academy' ? '#4a7aa8' : b.style === 'hospital' ? '#dce4e2' : b.style === 'shop' ? '#b07a4a' : '#9a7a52';
      c.fillRect(b.x, b.y, b.w, b.h);
      c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 3; c.strokeRect(b.x, b.y, b.w, b.h);
    });
    // puerta
    c.fillStyle = '#8a4a32';
    c.fillRect(260, 1820, 510, 40);
    // etiquetas
    c.textAlign = 'center';
    const labels = [
      ['ACADEMIA', 695, 900, '#8fc8f0'],
      ['HOKAGE', 1520, 720, '#ffb86a'],
      ['MISIONES', 1815, 1340, '#e8b07a'],
      ['ICHIRAKU', 1035, 1340, '#e8a07a'],
      ['HOSPITAL', 2310, 1050, '#e8f4f0'],
      ['ENTRENAMIENTO', 2560, 1320, '#9ed3a0'],
      ['MERCADO', 1300, 2040, '#e8d0a0'],
      ['PUERTA', 505, 2110, '#d8b86a'],
      ['MONUMENTO', 1570, 470, '#d8d0b8']
    ];
    c.font = '700 60px Rajdhani, sans-serif';
    c.textBaseline = 'middle';
    labels.forEach(function (l) {
      c.font = '700 60px Rajdhani, sans-serif';
      const tw = c.measureText(l[0]).width;
      c.fillStyle = 'rgba(4, 14, 20, .75)';
      c.fillRect(l[1] - tw / 2 - 18, l[2] - 48, tw + 36, 70);
      c.fillStyle = l[3];
      c.fillText(l[0], l[1], l[2] - 12);
    });
    // NPCs
    W.npcs.forEach(function (n) {
      c.fillStyle = n.hasMissions ? '#ffc247' : 'rgba(180, 220, 240, .9)';
      c.beginPath(); c.arc(n.x, n.y, 36, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(4, 14, 20, .75)'; c.lineWidth = 7; c.stroke();
    });
    // jugador
    c.save();
    c.translate(W.player.x, W.player.y);
    c.rotate(W.player.facing > 0 ? 0 : Math.PI);
    c.fillStyle = '#ff8a2a';
    c.beginPath(); c.moveTo(72, 0); c.lineTo(-46, -46); c.lineTo(-22, 0); c.lineTo(-46, 46); c.closePath(); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 10; c.stroke();
    c.restore();
    // leyenda de colores y título
    c.restore();
    c.fillStyle = 'rgba(4, 14, 20, .85)';
    c.fillRect(22, 22, 240, 38);
    c.fillStyle = '#ffc247';
    c.font = '700 20px Rajdhani, sans-serif';
    c.textAlign = 'left';
    c.fillText('MAPA DE KONOHA', 38, 48);
  }

  /* ---------------- API ---------------- */
  window.World = {
    start: start,
    stop: stop,
    pause: function () { W.paused = true; },
    resume: function () { W.paused = false; W.last = performance.now(); },
    isActive: function () { return W.active; },
    isPaused: function () { return W.paused; },
    setQuest: function (q) { W.quest = q; },
    setSpawn: function (s) { W.spawn = s; },
    teleport: function (x, y) {
      if (!W.player) return;
      W.player.x = ClampWorldX(x); W.player.y = ClampWorldY(y);
    },
    getPlayer: function () { return W.player; },
    getState: function () { return W.state; },
    getNpcs: function () { return W.npcs; },
    getNpc: function (id) { return W.npcs.filter(function (n) { return n.id === id; })[0] || NPCS.filter(function (n) { return n.id === id; })[0] || null; },
    getCollectibles: function () { return W.collectibles; },
    drawBigMap: drawBigMap,
    itemInfo: ITEM_INFO,
    buildings: BUILDINGS,
    npcData: NPCS,
    worldSize: { w: WORLD_W, h: WORLD_H },
    focus: function () { return W.focus; }
  };

  function ClampWorldX(x) { return clamp(x, 60, WORLD_W - 60); }
  function ClampWorldY(y) { return clamp(y, 70, WORLD_H - 60); }
})();

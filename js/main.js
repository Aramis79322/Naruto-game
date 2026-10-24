/* ============================================================
   NARUTO: SHINOBI LEGACY — Controlador principal
   Menús, creación, mundo, historia, misiones y progresión.
   ============================================================ */
(function () {
  'use strict';

  const D = window.GameData;
  const SAVE_KEY = 'naruto_shinobi_legacy_save_v1';
  const SETTINGS_KEY = 'naruto_shinobi_legacy_settings_v1';

  const $ = function (id) { return document.getElementById(id); };
  const $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  let state = null;
  let settings = loadSettings();
  let saveData = loadSave();
  let currentScreen = 'boot';
  let bootLoaded = false;
  let selectedIndex = 0;
  let pendingMode = 'story';
  let createState = null;
  let createTab = 'body';
  let createBaseIndex = 0;
  let selectedVillage = 'konoha';
  let worldStarted = false;
  let pendingReturnPos = null;
  let lastBattle = null;
  let queuedRank = null;
  let currentCutscene = null;
  let storyPart = 'p1';
  let arcFilter = 'all';
  let selectedArcId = null;
  let missionFilter = 'all';
  let selectedMissionId = null;
  let settingsReturn = 'boot';
  let codexReturn = 'boot';
  let creditsReturn = 'boot';
  let confirmCallback = null;
  let confirmCancelCallback = null;
  let mapPausedWorld = false;
  let loops = {};
  let saveTimer = null;
  let unlockDone = false;

  /* ---------------- Konoha 3D ---------------- */
  const W3D_NPC_POS = {
    iruka: [-52, 0], hokage: [-12, 12], shikamaru: [12, 34], sakura: [-28, 21],
    kakashi: [5, 28], rocklee: [18, 30], hinata: [-22, 53], teuchi: [-34, 34],
    konohamaru: [-22, 8], sasuke: [-37, -33], gate: [-65, 51], kiba: [-10, 58],
    shino: [-1, 62], ino: [-27, 64], choji: [-19, 66]
  };
  const W3D_AREAS = [
    { name: 'ACADEMIA NINJA', x: -50, z: 0, r: 25 },
    { name: 'TORRE DEL HOKAGE', x: -12, z: 12, r: 20 },
    { name: 'PLAZA CENTRAL', x: -27.7, z: 0, r: 18 },
    { name: 'ICHIRAKU RAMEN', x: -34, z: 34, r: 12 },
    { name: 'CAMPO DE ENTRENAMIENTO 3', x: 12, z: 30, r: 20 },
    { name: 'MERCADO DE KONOHA', x: -20, z: 55, r: 22 },
    { name: 'PUERTA DE KONOHA', x: -65, z: 51, r: 18 },
    { name: 'MONUMENTO DE LOS HOKAGE', x: 30, z: -10, r: 45 },
    { name: 'BOSQUE DE KONOHA', x: -40, z: -35, r: 25 }
  ];
  const W3D_VIEWS = [
    { dist: 3.8, label: 'CERCA' },
    { dist: 5.6, label: 'MEDIA' },
    { dist: 8.6, label: 'LEJOS' }
  ];
  const W3D_MAX_SCROLLS = 8;
  let world3dActive = false;
  let battleReturn3d = false;
  let panelReturnMode = 'world';
  let w3dViewIndex = 1;
  let w3dScrolls = { found: 0, total: W3D_MAX_SCROLLS };
  let w3dNpcById = {};
  let w3dArea = 'PLAZA CENTRAL';
  let mapReturn3d = false;

  /* ---------------- Utilidades ---------------- */
  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function shade(hex, amount) {
    const h = String(hex || '#000000').replace('#', '');
    const full = h.length === 3 ? h.split('').map(function (c) { return c + c; }).join('') : h;
    const num = parseInt(full, 16);
    if (isNaN(num)) return hex;
    let r = (num >> 16) + amount, g = ((num >> 8) & 255) + amount, b = (num & 255) + amount;
    r = clamp(r, 0, 255); g = clamp(g, 0, 255); b = clamp(b, 0, 255);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  function fmtNum(n) {
    const value = Math.round(Number(n) || 0);
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function formatDate(ts) {
    if (!ts) return 'Sin datos';
    try {
      return new Date(ts).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return new Date(ts).toLocaleString(); }
  }

  function rankData(id) {
    return D.SHINOBI_RANKS.filter(function (r) { return r.id === id; })[0] || D.SHINOBI_RANKS[0];
  }

  function rankForLevel(level) {
    let id = 'genin';
    D.SHINOBI_RANKS.forEach(function (r) {
      if (level >= (D.RANK_LEVEL[r.id] || 99)) id = r.id;
    });
    return id;
  }

  function clanData(id) {
    return D.CLANS.filter(function (c) { return c.id === id; })[0] || D.CLANS[D.CLANS.length - 1];
  }

  function styleData(id) {
    return D.FIGHT_STYLES.filter(function (s) { return s.id === id; })[0] || D.FIGHT_STYLES[0];
  }

  function charData(id) {
    return D.CHAR_MAP[id] || null;
  }

  function currentReturnScreen() {
    return currentScreen;
  }

  function safePlayTrack(name) {
    try { window.AudioEngine.playTrack(name); } catch (e) {}
  }
  function safeSfx(name) {
    try { window.AudioEngine.sfx(name); } catch (e) {}
  }

  function toast(message, type, icon) {
    const holder = $('toasts');
    if (!holder) return;
    const node = document.createElement('div');
    node.className = 'toast ' + (type || '');
    node.innerHTML = '<i>' + escapeHTML(icon || '✦') + '</i><span>' + escapeHTML(message) + '</span>';
    holder.appendChild(node);
    setTimeout(function () {
      node.classList.add('out');
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 360);
    }, 3200);
  }

  function showTransition(fn) {
    const node = $('transition');
    if (!node) { fn(); return; }
    node.classList.add('on');
    setTimeout(function () {
      try { fn(); } catch (e) { console.error(e); }
      setTimeout(function () { node.classList.remove('on'); }, 90);
    }, 260);
  }

  /* ---------------- Ajustes y guardado ---------------- */
  function defaultSettings() {
    return { music: 0.55, sfx: 0.7, voice: true, tips: true, shake: true, touch: false, fast: false, low3d: false };
  }

  function loadSettings() {
    const base = defaultSettings();
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return base;
      const parsed = JSON.parse(raw);
      Object.keys(base).forEach(function (k) {
        if (typeof parsed[k] === typeof base[k]) base[k] = parsed[k];
      });
    } catch (e) {}
    return base;
  }

  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}
    applySettings();
  }

  function applySettings() {
    try {
      window.AudioEngine.setMusicVolume(settings.music);
      window.AudioEngine.setSfxVolume(settings.sfx);
      window.AudioEngine.setVoice(!!settings.voice);
    } catch (e) {}
    document.body.classList.toggle('touch', !!settings.touch);
    document.body.classList.toggle('show-touch', !!settings.touch);
    window.__reduceShake = !settings.shake;
    if (window.Konoha3D) {
      if (window.Konoha3D.setReduced) window.Konoha3D.setReduced(!!settings.low3d);
      if (window.Konoha3D.setTouchMode) window.Konoha3D.setTouchMode(!!settings.touch);
    }
  }

  function normalizeState(raw) {
    if (!raw || !raw.profile || !raw.profile.name) return null;
    const s = raw;
    s.version = 1;
    s.mode = s.mode === 'training' ? 'training' : 'story';
    s.createdAt = s.createdAt || Date.now();
    s.lastPlayed = s.lastPlayed || Date.now();
    s.timeMinutes = typeof s.timeMinutes === 'number' ? s.timeMinutes : 8 * 60;
    s.day = Math.max(1, s.day || 1);
    s.worldPos = s.worldPos && typeof s.worldPos.x === 'number' ? s.worldPos : null;
    s.world3dPos = s.world3dPos && typeof s.world3dPos.x === 'number' ? s.world3dPos : null;
    s.progress = s.progress || {};
    s.progress.arcs = Array.isArray(s.progress.arcs) ? s.progress.arcs : [];
    s.progress.missions = Array.isArray(s.progress.missions) ? s.progress.missions : [];
    s.progress.collectibles = Array.isArray(s.progress.collectibles) ? s.progress.collectibles : [];
    s.progress.collectibles3d = Array.isArray(s.progress.collectibles3d) ? s.progress.collectibles3d : [];
    s.progress.history = Array.isArray(s.progress.history) ? s.progress.history : [];
    s.progress.tutorialStage = typeof s.progress.tutorialStage === 'number' ? s.progress.tutorialStage : 0;
    s.progress.introSeen = !!s.progress.introSeen;
    s.progress.trainingWon = !!s.progress.trainingWon;
    s.progress.lastRamenDay = s.progress.lastRamenDay || 0;
    s.stats = s.stats || {};
    s.stats.victories = s.stats.victories || 0;
    s.stats.defeats = s.stats.defeats || 0;
    s.stats.totalXp = s.stats.totalXp || 0;
    s.stats.totalRyo = s.stats.totalRyo || 0;
    s.stats.playSeconds = s.stats.playSeconds || 0;
    const p = s.profile;
    p.level = clamp(parseInt(p.level, 10) || 1, 1, D.MAX_LEVEL);
    p.xp = Math.max(0, Number(p.xp) || 0);
    p.ryo = Math.max(0, Number(p.ryo) || 0);
    p.rank = D.RANK_LEVEL[p.rank] ? p.rank : rankForLevel(p.level);
    p.baseId = p.baseId || 'custom';
    p.clan = p.clan || 'civil';
    p.style = p.style || 'balance';
    p.stats = p.stats || { nin: 5, tai: 5, gen: 5, spd: 5, def: 5 };
    p.jutsu = Array.isArray(p.jutsu) && p.jutsu.length ? p.jutsu.slice(0, 2) : customJutsu(p.clan, p.style);
    p.ultimate = p.ultimate || customUltimate(p.clan);
    p.art = p.art || clone(D.CUSTOM_BASE_ART);
    p.heightScale = p.heightScale || 1;
    p.title = p.title || 'Shinobi de la Hoja';
    p.village = 'konoha';
    p.idNumber = p.idNumber || String(1000 + Math.floor(Math.random() * 9000));
    return s;
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return normalizeState(JSON.parse(raw));
    } catch (e) { return null; }
  }

  function saveGame(silent) {
    if (!state) return false;
    /* La exploración 3D desde el menú es una demo: nunca sobrescribe una partida. */
    if (state.demo) {
      if (!silent) toast('Modo demo: esta exploración no se guarda. Crea un shinobi para conservar tu progreso.', '', '3D');
      return false;
    }
    state.lastPlayed = Date.now();
    if (window.Konoha3D && window.Konoha3D.isActive && window.Konoha3D.isActive()) {
      syncWorld3DPosition();
    } else if (window.World && World.isActive && World.isActive() && World.getPlayer) {
      const p = World.getPlayer();
      if (p) state.worldPos = { x: p.x, y: p.y };
      state.timeMinutes = World.getState() ? World.getState().timeMinutes : state.timeMinutes;
      state.day = World.getState() ? World.getState().day : state.day;
    }
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      saveData = normalizeState(JSON.parse(JSON.stringify(state)));
      refreshContinue();
      if (!silent) toast('Partida guardada en la Hoja', 'good', '✓');
      return true;
    } catch (e) {
      console.error(e);
      if (!silent) toast('No se pudo guardar la partida', 'bad', '!');
      return false;
    }
  }

  function refreshContinue() {
    const btn = $('btn-continue');
    const label = $('continue-label');
    if (!btn) return;
    saveData = saveData || loadSave();
    if (saveData) {
      btn.classList.remove('hidden');
      const p = saveData.profile;
      label.textContent = p.name.toUpperCase() + ' · NIVEL ' + p.level + ' · ' + rankData(p.rank).name.toUpperCase();
    } else {
      btn.classList.add('hidden');
    }
  }

  /* ---------------- Navegación ---------------- */
  function stopLoops(except) {
    Object.keys(loops).forEach(function (key) {
      if (key === except) return;
      if (loops[key]) cancelAnimationFrame(loops[key]);
      delete loops[key];
    });
  }

  function startLoop(key, fn) {
    if (loops[key]) cancelAnimationFrame(loops[key]);
    let last = performance.now();
    function frame(now) {
      if (currentScreen !== screenForLoop(key)) { delete loops[key]; return; }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      loops[key] = requestAnimationFrame(frame);
      fn(now / 1000, dt);
    }
    loops[key] = requestAnimationFrame(frame);
  }

  function screenForLoop(key) {
    if (key === 'boot') return 'boot';
    if (key === 'select') return 'select';
    if (key === 'create') return 'create';
    if (key === 'cutscene') return 'cutscene';
    if (key === 'credits') return 'credits';
    return '__none__';
  }

  function showScreen(id) {
    stopLoops(loopKeyForScreen(id));
    $$('.screen').forEach(function (screen) {
      screen.classList.toggle('active', screen.id === 'screen-' + id);
    });
    if (id !== currentScreen) {
      const toastHolder = $('toasts');
      if (toastHolder) toastHolder.innerHTML = '';
    }
    currentScreen = id;
    document.body.classList.toggle('in-game', id === 'world' || id === 'world3d' || id === 'battle' || id === 'result' || id === 'cutscene');
    document.body.classList.toggle('mode-3d', id === 'world3d');
    if (id === 'boot') {
      startBootLoop();
      refreshContinue();
      if (bootLoaded) {
        const load = $('boot-loading'), menu = $('boot-menu');
        if (load) load.classList.add('hidden');
        if (menu) menu.classList.remove('hidden');
        ['btn-story', 'btn-training', 'btn-world3d', 'btn-codex', 'btn-settings', 'btn-credits'].forEach(function (btnId) {
          const b = $(btnId); if (b) b.disabled = false;
        });
      }
      if (unlockDone) safePlayTrack('menu');
    } else if (id === 'select') {
      startSelectLoop();
      if (unlockDone) safePlayTrack('menu');
    } else if (id === 'create') {
      startCreateLoop();
    } else if (id === 'credits') {
      startCreditsLoop();
    }
  }

  function loopKeyForScreen(id) {
    if (id === 'boot') return 'boot';
    if (id === 'select') return 'select';
    if (id === 'create') return 'create';
    if (id === 'cutscene') return 'cutscene';
    if (id === 'credits') return 'credits';
    return '__none__';
  }

  function goBack(target) {
    safeSfx('back');
    if (target === 'boot') { showScreen('boot'); return; }
    if (target === 'select') { openSelect(pendingMode); return; }
    if (target === 'create') { openCreate(); return; }
    if (target === 'world') {
      if (state) goToWorld(); else showScreen('boot');
    }
  }

  function goToWorld() {
    if (!state) { showScreen('boot'); return; }
    showScreen('world');
    updateWorldHUD();
    updateQuestTracker();
    startOrResumeWorld();
  }

  /* ---------------- Konoha 3D · estado y arranque ---------------- */
  function formatGameClock(minutes) {
    let total = Math.floor(Number(minutes) || 0) % 1440;
    if (total < 0) total += 1440;
    return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
  }

  function buildDemo3DState() {
    const base = charData('naruto');
    if (!base) return null;
    const clanId = 'uzumaki', styleId = 'balance';
    const clan = clanData(clanId), style = styleData(styleId);
    const art = clone(base.art);
    art.height = art.height || 'media';
    art.body = art.body || art.build || 'normal';
    art.build = art.body;
    art.villageSymbol = 'leaf';
    if (!art.accessory) art.accessory = 'none';
    if (!art.hair2) art.hair2 = shade(art.hair || '#f2c53d', -38);
    return normalizeState({
      version: 1,
      mode: 'training',
      demo: true,
      createdAt: Date.now(),
      lastPlayed: Date.now(),
      profile: {
        name: base.name,
        baseId: 'naruto',
        village: 'konoha',
        villageName: 'Aldea Oculta de la Hoja',
        clan: clanId,
        clanName: clan.name,
        style: styleId,
        styleName: style.name,
        title: base.title,
        role: base.role,
        element: base.element,
        level: 1,
        xp: 0,
        ryo: 500,
        rank: 'genin',
        stats: computeStats(base.stats, clanId, styleId),
        jutsu: clone(base.jutsu),
        ultimate: clone(base.ultimate),
        art: art,
        heightScale: heightScaleFor('media'),
        quote: base.quote,
        bio: base.bio,
        idNumber: 'DEMO-3D'
      },
      timeMinutes: 8 * 60,
      day: 1,
      worldPos: null,
      world3dPos: null,
      progress: {
        arcs: [], missions: [], collectibles: [], collectibles3d: [], history: [],
        tutorialStage: 0, introSeen: true, trainingWon: true, lastRamenDay: 0
      },
      stats: { victories: 0, defeats: 0, totalXp: 0, totalRyo: 0, playSeconds: 0 }
    });
  }

  function buildWorld3DNpcs() {
    const defs = [];
    const list = window.World && window.World.npcData ? window.World.npcData : [];
    list.forEach(function (npc) {
      if (!npc || npc.id === 'sasuke') return;
      const pos = W3D_NPC_POS[npc.id];
      if (!pos) return;
      defs.push(Object.assign({}, npc, { x: pos[0], z: pos[1] }));
    });
    const baseId = state && state.profile ? state.profile.baseId : 'naruto';
    const playerModel = baseId === 'sasuke' ? 'sasuke' : 'naruto';
    const rivalId = playerModel === 'sasuke' ? 'naruto' : 'sasuke';
    const rival = charData(rivalId);
    if (rival) {
      const pos = W3D_NPC_POS.sasuke || [-37, -33];
      defs.push({
        id: rivalId, name: rival.name, role: rival.role || 'Shinobi de la Hoja',
        portrait: rival.portrait, art: rival.art, marker: 'spar',
        x: pos[0], z: pos[1]
      });
    }
    return defs;
  }

  function syncWorld3DPosition() {
    if (!state || !window.Konoha3D || !window.Konoha3D.isActive()) return;
    const p = window.Konoha3D.getPlayerState();
    if (p) state.world3dPos = { x: p.x, y: p.y, z: p.z, rot: p.rot };
    const clock = window.Konoha3D.getTime ? window.Konoha3D.getTime() : null;
    if (clock) {
      state.timeMinutes = clock.minutes;
      state.day = clock.day;
    }
  }

  function startKonoha3D(opts) {
    opts = opts || {};
    if (!window.Konoha3D) {
      toast('El motor 3D no está disponible. Comprueba los archivos de Three.js.', 'bad', '!');
      return;
    }
    if (opts.demo) {
      if (opts.reset || !state || !state.demo) state = buildDemo3DState();
      if (state) state.demo = true;
    } else if (!state) {
      showScreen('boot');
      return;
    }
    if (!state) return;

    if (window.Konoha3D.isActive() && window.Konoha3D.isReady() && currentScreen === 'world3d') {
      updateWorldHUD();
      updateQuestTracker();
      window.Konoha3D.resume();
      return;
    }

    const defs = buildWorld3DNpcs();
    w3dNpcById = {};
    defs.forEach(function (npc) { w3dNpcById[npc.id] = npc; });
    w3dArea = 'PLAZA CENTRAL';
    w3dScrolls = {
      found: (state.progress.collectibles3d || []).length,
      total: W3D_MAX_SCROLLS
    };
    mapReturn3d = false;

    showScreen('world3d');
    world3dActive = true;
    hideAllModals();
    updateWorldHUD();
    updateQuestTracker();
    safePlayTrack('village');

    const spawn = state.world3dPos && typeof state.world3dPos.x === 'number'
      ? { x: state.world3dPos.x, z: state.world3dPos.z, rot: state.world3dPos.rot }
      : { x: -27.7, z: 0.1, rot: Math.PI };
    const quest = computeQuest();
    const playerModel = state.profile.baseId === 'sasuke' ? 'sasuke' : 'naruto';
    const collected = (state.progress.collectibles3d || []).slice();
    const timeMinutes = state.timeMinutes;
    const day = state.day;

    setTimeout(function () {
      if (currentScreen !== 'world3d' || !state) return;
      window.Konoha3D.start($('w3d-canvas'), {
        npcs: defs,
        areas: W3D_AREAS,
        collected: collected,
        timeMinutes: timeMinutes,
        day: day,
        spawn: spawn,
        quest: quest,
        playerModel: playerModel,
        touch: !!settings.touch,
        reduced: !!settings.low3d,
        quality: settings.low3d ? 'low' : 'auto',
        dom: {
          loader: $('w3d-loading'),
          error: $('w3d-error'),
          errorText: $('w3d-error-text'),
          loadFill: $('w3d-load-fill'),
          loadPercent: $('w3d-load-percent'),
          loadLabel: $('w3d-load-label'),
          tint: $('w3d-tint'),
          minimap: $('w3d-minimap'),
          touch: $('w3d-touch'),
          joystick: $('w3d-joystick'),
          joystickKnob: $('w3d-joystick-knob'),
          jump: $('w3d-jump'),
          interact: $('w3d-interact'),
          lookPad: $('w3d-look')
        },
        callbacks: {
          onReady: function () {
            world3dActive = true;
            const ps = window.Konoha3D.getPlayerState();
            if (ps && ps.area) w3dArea = ps.area;
            window.Konoha3D.setCamera({ dist: W3D_VIEWS[w3dViewIndex].dist });
            updateWorldHUD();
            updateQuestTracker();
            hideWorld3DPrompt();
            if (state.demo) {
              setTimeout(function () {
                if (currentScreen === 'world3d') toast('Demo de Konoha 3D · explora libremente. El progreso no se guarda.', '', '3D');
              }, 600);
            }
          },
          onError: function () {
            world3dActive = false;
            hideWorld3DPrompt();
          },
          onStop: function () {
            world3dActive = false;
            hideWorld3DPrompt();
          },
          onPrompt: function (payload) {
            const prompt = $('w3d-prompt');
            const text = $('w3d-prompt-text');
            const key = $('w3d-prompt-key');
            if (!prompt) return;
            if (payload && payload.text) {
              if (text) text.textContent = payload.text;
              if (key) key.textContent = settings.touch ? 'TOCA' : 'E';
              prompt.classList.remove('hidden');
            } else {
              prompt.classList.add('hidden');
            }
          },
          onInteract: function (payload) {
            if (!payload) return;
            const def = w3dNpcById[payload.id] || (window.World.getNpc && window.World.getNpc(payload.id));
            if (def) handleNpcInteract(def);
          },
          onCollect: function (item) { handleWorld3DScroll(item); },
          onScrolls: function (payload) {
            w3dScrolls = {
              found: payload ? payload.found : 0,
              total: payload && payload.total ? payload.total : W3D_MAX_SCROLLS
            };
            updateWorld3DScrollCounter();
          },
          onTime: function (payload) {
            if (!state || !payload) return;
            state.timeMinutes = payload.minutes;
            state.day = payload.day;
            const clock = $('w3d-clock');
            const dayNode = $('w3d-day');
            if (clock) clock.textContent = formatGameClock(payload.minutes);
            if (dayNode) dayNode.textContent = 'DÍA ' + payload.day;
          },
          onArea: function (payload) {
            if (!payload || !payload.name) return;
            w3dArea = payload.name;
            const node = $('w3d-place');
            if (node) node.textContent = payload.name;
          },
          onCompass: function (payload) {
            if (!payload) return;
            const node = $('w3d-compass');
            if (node) node.textContent = payload.label || 'N';
          }
        }
      });
    }, 30);
  }

  function hideWorld3DPrompt() {
    const prompt = $('w3d-prompt');
    if (prompt) prompt.classList.add('hidden');
  }

  function enterWorld3DFromWorld() {
    if (!state) return;
    if (window.Konoha3D && window.Konoha3D.isActive()) {
      showScreen('world3d');
      updateWorldHUD();
      updateQuestTracker();
      window.Konoha3D.resume();
      return;
    }
    if (window.World.isActive()) {
      syncWorldPosition();
      window.World.stop();
    }
    worldStarted = false;
    saveGame(true);
    startKonoha3D({ demo: false });
  }

  function exitKonoha3D() {
    const demo = !state || !!state.demo;
    if (state && !demo) syncWorld3DPosition();
    if (window.Konoha3D && window.Konoha3D.isActive()) window.Konoha3D.stop(true);
    world3dActive = false;
    mapReturn3d = false;
    battleReturn3d = false;
    hideWorld3DPrompt();
    hideAllModals();
    if (demo) {
      state = null;
      worldStarted = false;
      pendingReturnPos = null;
      showScreen('boot');
      refreshContinue();
      return;
    }
    saveGame(true);
    showScreen('world');
    updateWorldHUD();
    updateQuestTracker();
    worldStarted = false;
    startOrResumeWorld(state.mode === 'training' ? 'training' : 'academy');
    safePlayTrack('village');
    setTimeout(function () {
      if (currentScreen === 'world') toast('De vuelta en Konoha 2D', '', '火');
    }, 700);
  }

  function retryKonoha3D() {
    if (!state) return;
    startKonoha3D({ demo: !!state.demo });
  }

  function cycleWorld3DView() {
    if (!window.Konoha3D || !window.Konoha3D.isActive()) return;
    w3dViewIndex = (w3dViewIndex + 1) % W3D_VIEWS.length;
    const view = W3D_VIEWS[w3dViewIndex];
    window.Konoha3D.setCamera({ dist: view.dist });
    toast('Cámara · ' + view.label, '', '視');
    safeSfx('click');
  }

  function openWorld3DPause() {
    if (!state) return;
    const demo = !!state.demo;
    const note = $('w3d-pause-note');
    if (note) {
      note.textContent = demo
        ? 'Modo demo: tu posición y los pergaminos no se guardarán. Crea un shinobi para conservar el progreso.'
        : 'Tu posición, la hora y los pergaminos encontrados se guardan en la partida.';
    }
    const save = $('btn-3d-save');
    if (save) {
      save.disabled = demo;
      save.textContent = demo ? 'DEMO · SIN GUARDADO' : 'GUARDAR PARTIDA';
    }
    const to2d = $('btn-3d-2d');
    if (to2d) to2d.classList.toggle('hidden', demo);
    const resume = $('btn-3d-resume');
    if (resume) resume.disabled = !(window.Konoha3D && window.Konoha3D.isActive());
    showModal('pause-3d-modal');
  }

  function handleWorld3DScroll(item) {
    if (!state || !item || !item.id) return;
    if (!Array.isArray(state.progress.collectibles3d)) state.progress.collectibles3d = [];
    const list = state.progress.collectibles3d;
    if (list.indexOf(item.id) < 0) list.push(item.id);
    const reward = grantRewards(35, 30, { silent: true });
    toast((item.label || 'Pergamino') + ' · +' + fmtNum(reward.xp) + ' EXP', 'exp', '巻');
    if (list.length >= W3D_MAX_SCROLLS) {
      addHistory({
        type: 'collect', title: 'Memorias de Konoha 3D', rank: 'S',
        detail: 'Encontró los ocho pergaminos ocultos en la aldea tridimensional.'
      });
      setTimeout(function () { toast('Has reunido los ocho pergaminos de Konoha 3D.', 'good', '巻'); }, 500);
    }
    saveGame(true);
    updateWorldHUD();
    updateQuestTracker();
    flushRankUp();
  }

  /* ---------------- Audio primer gesto ---------------- */
  function unlockAudio() {
    if (unlockDone) return;
    unlockDone = true;
    try { window.AudioEngine.init(); } catch (e) {}
    applySettings();
    if (currentScreen === 'boot' || currentScreen === 'select') safePlayTrack('menu');
  }

  /* ---------------- Canvas helpers ---------------- */
  function sizeCanvas(canvas, ctx) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, rect.width), h = Math.max(1, rect.height);
    const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw; canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: h, dpr: dpr };
  }

  function clearCanvas(canvas, ctx) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawCharacterPreview(canvas, art, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    const size = sizeCanvas(canvas, ctx);
    clearCanvas(canvas, ctx);
    const t = opts.time || 0;
    const w = size.w, h = size.h;
    const baseScale = opts.scale || Math.min(w / 170, h / 230);
    const heightScale = opts.heightScale || 1;
    const scale = baseScale * heightScale;
    const x = opts.x == null ? w / 2 : opts.x;
    const y = opts.y == null ? h * 0.87 : opts.y;
    const color = opts.color || '#ffc247';

    const glow = ctx.createRadialGradient(x, y - 120 * scale, 10, x, y - 90 * scale, (opts.glow || 190) * scale);
    glow.addColorStop(0, hexA(color, 0.22));
    glow.addColorStop(0.55, hexA(color, 0.07));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.ellipse(x, y - 80 * scale, (opts.glow || 190) * scale, (opts.glow || 190) * scale * 0.7, 0, 0, Math.PI * 2); ctx.fill();

    // anillos del suelo
    ctx.save();
    ctx.translate(x, y + 4 * scale);
    ctx.scale(1, 0.3);
    ctx.strokeStyle = hexA(color, 0.28);
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(0, 0, 65 * scale * (0.95 + Math.sin(t * 1.2) * 0.03), 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = hexA('#69d8ff', 0.18);
    ctx.beginPath(); ctx.arc(0, 0, 83 * scale, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    window.Art.character(ctx, art, 0, 0, 1, { time: t, facing: opts.facing || 1, moving: opts.moving || false, walk: t * 3 });
    ctx.restore();

    if (opts.particles !== false) {
      for (let i = 0; i < 10; i++) {
        const a = t * 0.5 + i * 0.66;
        const px = x + Math.cos(a) * (70 + i * 6) * scale * 0.65;
        const py = y - (50 + ((i * 37) % 120)) * scale + Math.sin(a * 1.6) * 18;
        ctx.fillStyle = hexA(i % 2 ? '#ffcf5a' : '#8ee8ff', 0.25 + 0.25 * Math.abs(Math.sin(t + i)));
        ctx.beginPath(); ctx.arc(px, py, 1.2 + (i % 2) * 0.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function hexA(hex, a) {
    const h = String(hex || '#ffffff').replace('#', '');
    const full = h.length === 3 ? h.split('').map(function (c) { return c + c; }).join('') : h;
    const n = parseInt(full, 16);
    if (isNaN(n)) return 'rgba(255,255,255,' + a + ')';
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  /* ---------------- Boot ---------------- */
  function startBootLoop() {
    const canvas = $('boot-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    startLoop('boot', function (t, dt) {
      const size = sizeCanvas(canvas, ctx);
      clearCanvas(canvas, ctx);
      // bruma luminosa
      const g = ctx.createRadialGradient(size.w * 0.2, size.h * 0.5, 10, size.w * 0.2, size.h * 0.5, size.w * 0.55);
      g.addColorStop(0, 'rgba(242,106,27,.12)');
      g.addColorStop(0.45, 'rgba(42,110,150,.06)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, size.w, size.h);
      // hojas
      for (let i = 0; i < 34; i++) {
        const baseX = ((i * 173.7 + t * (11 + i % 7) * 0.7) % (size.w + 100)) - 50;
        const baseY = ((i * 97.3 + t * (7 + i % 5) * 0.6) % (size.h + 80)) - 40;
        const a = 0.08 + (i % 5) * 0.035;
        ctx.save();
        ctx.translate(baseX + Math.sin(t * 0.7 + i) * 22, baseY);
        ctx.rotate(t * 0.8 + i * 0.7);
        ctx.fillStyle = i % 3 === 0 ? 'rgba(255,194,71,' + a + ')' : 'rgba(130,205,180,' + a + ')';
        ctx.beginPath(); ctx.ellipse(0, 0, 5 + (i % 3), 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      // destellos
      for (let i = 0; i < 12; i++) {
        const px = (i * 251 + Math.sin(t * 0.4 + i) * 60) % size.w;
        const py = size.h - ((i * 137 + t * 18) % (size.h * 0.7));
        ctx.fillStyle = 'rgba(255,220,150,' + (0.08 + 0.08 * Math.sin(t + i)) + ')';
        ctx.beginPath(); ctx.arc(px, py, 1.4, 0, Math.PI * 2); ctx.fill();
      }
      if (settings.tips && Math.floor(t / 9) !== Math.floor((t - dt) / 9)) {
        const tip = D.TRAINING_TIPS[Math.floor(t / 9) % D.TRAINING_TIPS.length];
        const node = $('boot-tip-text');
        if (node) node.textContent = tip;
      }
    });
  }

  function bootArtPreload() {
    let progress = 8;
    const fill = $('load-fill'), pct = $('load-percent'), label = $('load-label');
    const labels = ['INVOCANDO A LOS SHINOBI...', 'TEJIENDO EL CHAKRA...', 'CARGANDO EL MONUMENTO...', 'ABRIENDO LAS PUERTAS DE KONOHA...'];
    const tick = setInterval(function () {
      if (bootLoaded) { clearInterval(tick); return; }
      progress = Math.min(92, progress + 2 + Math.random() * 7);
      if (fill) fill.style.width = progress.toFixed(0) + '%';
      if (pct) pct.textContent = Math.round(progress) + '%';
      if (label) label.textContent = labels[Math.min(labels.length - 1, Math.floor(progress / 26))];
    }, 220);
    const done = function () {
      if (bootLoaded) return;
      bootLoaded = true;
      clearInterval(tick);
      if (fill) fill.style.width = '100%';
      if (pct) pct.textContent = '100%';
      if (label) label.textContent = 'TODO LISTO, SHINOBI';
      setTimeout(function () {
        const load = $('boot-loading'), menu = $('boot-menu');
        if (load) load.classList.add('hidden');
        if (menu) menu.classList.remove('hidden');
        ['btn-story', 'btn-training', 'btn-world3d', 'btn-codex', 'btn-settings', 'btn-credits'].forEach(function (id) {
          const b = $(id); if (b) b.disabled = false;
        });
        refreshContinue();
        if (unlockDone) safeSfx('unlock');
      }, 520);
    };
    window.Art.preload(done);
    setTimeout(done, 5200);
  }

  /* ---------------- Selección de personaje ---------------- */
  function rosterList() {
    return D.CHARACTERS.concat([{ id: 'custom', name: 'Tu propio shinobi', short: 'Personalizado', custom: true }]);
  }

  function openSelect(mode) {
    pendingMode = mode === 'training' ? 'training' : 'story';
    const roster = rosterList();
    if (selectedIndex < 0 || selectedIndex >= roster.length) selectedIndex = 0;
    const pill = $('select-mode-pill');
    const eyebrow = document.querySelector('#screen-select .topbar-title .eyebrow');
    if (pill) pill.textContent = pendingMode === 'training' ? 'ENTRENAMIENTO' : 'HISTORIA';
    if (eyebrow) eyebrow.textContent = pendingMode === 'training' ? 'ENTRENAMIENTO' : 'MODO HISTORIA';
    const story = document.querySelector('#select-title');
    if (story) story.dataset.mode = pendingMode;
    renderRoster();
    renderSelected();
    showScreen('select');
    safePlayTrack('menu');
  }

  function renderRoster() {
    const strip = $('roster-strip');
    if (!strip) return;
    const roster = rosterList();
    strip.innerHTML = roster.map(function (c, i) {
      if (c.custom) {
        return '<button class="roster-item custom ' + (i === selectedIndex ? 'active' : '') + '" data-index="' + i + '">' +
          '<span class="roster-avatar">✦</span><span>PERSONALIZADO</span></button>';
      }
      return '<button class="roster-item ' + (i === selectedIndex ? 'active' : '') + '" data-index="' + i + '">' +
        '<img src="' + escapeHTML(c.portrait) + '" alt="' + escapeHTML(c.short) + '">' +
        '<span>' + escapeHTML(c.short) + '</span></button>';
    }).join('');
    const count = $('roster-count');
    if (count) count.textContent = D.CHARACTERS.length + ' shinobi + personaje propio';
  }

  function selectArt(c) {
    if (!c || c.custom) return clone(D.CUSTOM_BASE_ART);
    const art = clone(c.art);
    art.height = art.height || 'media';
    art.body = art.body || art.build || 'normal';
    art.build = art.body;
    return art;
  }

  function renderSelected() {
    const roster = rosterList();
    const c = roster[clamp(selectedIndex, 0, roster.length - 1)];
    if (!c) return;
    const isCustom = !!c.custom;
    const art = selectArt(c);
    const name = isCustom ? 'Tu propio shinobi' : c.name;
    const title = isCustom ? 'Nueva leyenda de la Hoja' : c.title;
    const desc = isCustom ? 'Elige cada rasgo de tu shinobi: altura, cuerpo, rostro, mirada y estilo de combate. Tu historia empieza desde cero.' : c.bio;
    const quote = isCustom ? '«No heredé un clan. Voy a heredar una leyenda.»' : c.quote;
    const stats = isCustom ? { nin: 5, tai: 5, gen: 5, spd: 5, def: 5 } : c.stats;
    const element = isCustom ? 'A elegir' : c.element;
    const jutsu = isCustom ? 'Elige tu clan y estilo' : (c.jutsu || []).map(function (j) { return j.name; }).join(' · ');
    const label = $('select-base-label');
    if (label) label.textContent = isCustom ? 'CREACIÓN LIBRE' : 'PERSONAJE BASE';
    const nameNode = $('select-name');
    if (nameNode) nameNode.textContent = name;
    const titleNode = $('select-title');
    if (titleNode) titleNode.textContent = title;
    const descNode = $('select-desc');
    if (descNode) descNode.textContent = desc;
    const quoteNode = $('select-quote');
    if (quoteNode) quoteNode.textContent = quote;
    const tag = $('select-village-tag');
    if (tag) tag.textContent = isCustom ? 'KONOHA · PERSONAJE ORIGINAL' : 'KONOHA · ' + (c.role || 'SHINOBI').toUpperCase();
    const statsNode = $('select-stats');
    if (statsNode) {
      const labels = [['NINJUTSU', 'nin'], ['TAIJUTSU', 'tai'], ['GENJUTSU', 'gen'], ['VELOCIDAD', 'spd'], ['DEFENSA', 'def']];
      statsNode.innerHTML = labels.map(function (pair) {
        const v = stats[pair[1]] || 0;
        return '<div class="stat-row"><span>' + pair[0] + '</span><div class="bar"><i style="width:' + (v / 12 * 100) + '%"></i></div><em>' + v + '</em></div>';
      }).join('');
    }
    const elementNode = $('select-element');
    if (elementNode) elementNode.textContent = element;
    const jutsuNode = $('select-jutsu');
    if (jutsuNode) jutsuNode.textContent = jutsu;
    const confirm = $('btn-select-confirm');
    if (confirm) confirm.innerHTML = (isCustom ? 'CREAR Y PERSONALIZAR' : 'ELEGIR Y PERSONALIZAR') + ' <span>›</span>';
    $$('.roster-item', $('roster-strip')).forEach(function (item) {
      item.classList.toggle('active', Number(item.dataset.index) === selectedIndex);
    });
    const active = document.querySelector('.roster-item.active');
    if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest' });
    drawSelectPreview(art, c);
  }

  function drawSelectPreview(art, c) {
    const canvas = $('select-preview');
    if (!canvas) return;
    const scale = c && c.custom ? 2.7 : clamp(2.55 * (art.height === 'alta' ? 1.05 : art.height === 'baja' ? 0.94 : 1), 2.3, 2.9);
    drawCharacterPreview(canvas, art, {
      scale: scale, heightScale: 1, y: canvas.getBoundingClientRect().height * 0.81,
      color: c && c.custom ? '#7ce4ff' : (clanData('civil').color), glow: 180
    });
  }

  function startSelectLoop() {
    startLoop('select', function (t) {
      const roster = rosterList();
      const c = roster[clamp(selectedIndex, 0, roster.length - 1)];
      if (!c) return;
      const art = selectArt(c);
      const canvas = $('select-preview');
      if (!canvas) return;
      drawCharacterPreview(canvas, art, {
        time: t, scale: 2.6 * (art.height === 'alta' ? 1.05 : art.height === 'baja' ? 0.94 : 1),
        heightScale: 1, y: canvas.getBoundingClientRect().height * 0.81,
        color: c.custom ? '#7ce4ff' : '#ffc247', glow: 180
      });
    });
  }

  function cycleSelect(dir) {
    const roster = rosterList();
    selectedIndex = (selectedIndex + dir + roster.length) % roster.length;
    safeSfx('click');
    renderSelected();
  }

  /* ---------------- Creación de personaje ---------------- */
  const EXTRA_ACCESSORIES = {
    forehead: 'Marca de frente', scroll: 'Pergamino', fan: 'Abanico', midriff: 'Top corto',
    plate: 'Placa ninja', coat: 'Capa de Hokage', gaara: 'Calabaza de arena', snake: 'Serpiente',
    puppet: 'Marioneta', scythe: 'Guadaña', stitches: 'Costuras', scope: 'Monóculo',
    samehada: 'Samehada', paper: 'Papel', horns: 'Cuernos', swirl: 'Remolino',
    sunglasses: 'Gafas oscuras', bandage: 'Vendas', glasses: 'Gafas', paint: 'Pintura',
    mask: 'Máscara', whiskers: 'Bigotes', fangs: 'Colmillos', sharingan: 'Sharingan',
    byakugan: 'Byakugan', rinnegan: 'Rinnegan', seven: 'Siete espadas'
  };

  const CREATE_TABS = {
    body: ['cuerpo', 'rostro'],
    look: ['pelo', 'ojos'],
    outfit: ['ropa', 'clan'],
    combat: ['estilo']
  };

  function createTabsList() {
    return [
      { id: 'body', name: 'CUERPO' },
      { id: 'look', name: 'ROSTRO' },
      { id: 'outfit', name: 'VESTUARIO' },
      { id: 'combat', name: 'COMBATE' }
    ];
  }

  function defaultClanForBase(c) {
    if (!c || c.custom) return 'civil';
    const map = {
      naruto: 'uzumaki', sasuke: 'uchiha', sakura: 'civil', kakashi: 'hatake', hinata: 'hyuga',
      shikamaru: 'nara', rocklee: 'civil', gaara: 'civil', neji: 'hyuga', kiba: 'inuzuka',
      shino: 'aburame', ino: 'yamanaka', choji: 'akimichi', tenten: 'civil', temari: 'civil',
      kankuro: 'civil', sai: 'civil', yamato: 'sarutobi', jiraiya: 'sarutobi', tsunade: 'sarutobi',
      killerbee: 'civil', minato: 'sarutobi'
    };
    return map[c.id] || 'civil';
  }

  function defaultStyleForBase(c) {
    if (!c || c.custom) return 'balance';
    if (c.stats.spd >= 9) return 'speed';
    if (c.stats.nin >= 9) return 'ninjutsu';
    if (c.stats.tai >= 8) return 'taijutsu';
    if (c.stats.gen >= 7) return 'genjutsu';
    return 'balance';
  }

  function openCreate() {
    const roster = rosterList();
    if (!roster[selectedIndex]) selectedIndex = 0;
    const c = roster[selectedIndex];
    createBaseIndex = selectedIndex;
    const art = selectArt(c);
    art.height = art.height || 'media';
    art.body = art.body || art.build || 'normal';
    art.build = art.body;
    art.nose = art.nose || 0; art.mouth = art.mouth || 0; art.ears = art.ears || 0; art.pupils = art.pupils || 0;
    art.height = art.height || 'media';
    createState = {
      baseId: c.custom ? 'custom' : c.id,
      baseName: c.custom ? 'Kaze' : c.name,
      name: c.custom ? 'Kaze' : c.name,
      art: clone(art),
      clan: defaultClanForBase(c),
      style: defaultStyleForBase(c),
      facing: 1
    };
    if (!c.custom && c.art.accessory && D.ACCESSORIES.every(function (a) { return a.id !== c.art.accessory; })) {
      createState.art.accessory = c.art.accessory;
    }
    createTab = 'body';
    createInitialSnapshot();
    const nameInput = $('input-name');
    if (nameInput) nameInput.value = createState.name;
    renderCreate();
    showScreen('create');
  }

  let createInitial = null;
  function createInitialSnapshot() {
    createInitial = { art: clone(createState.art), name: createState.name, clan: createState.clan, style: createState.style };
  }

  function createArt() {
    if (!createState) return null;
    const a = createState.art;
    a.build = a.body || a.build || 'normal';
    return a;
  }

  function createRowsForTab(tab) {
    const art = createState.art;
    const accList = D.ACCESSORIES.map(function (a) { return { id: a.id, name: a.name }; });
    if (accList.every(function (a) { return a.id !== art.accessory; })) {
      accList.push({ id: art.accessory, name: EXTRA_ACCESSORIES[art.accessory] || 'Heredado' });
    }
    const heightIndex = Math.max(0, D.HEIGHTS.map(function (h) { return h.id; }).indexOf(art.height));
    const bodyIndex = Math.max(0, D.BODIES.map(function (b) { return b.id; }).indexOf(art.body));
    const clanIndex = Math.max(0, D.CLANS.map(function (c) { return c.id; }).indexOf(createState.clan));
    const styleIndex = Math.max(0, D.FIGHT_STYLES.map(function (s) { return s.id; }).indexOf(createState.style));
    const rows = [];
    if (tab === 'body') {
      rows.push({
        key: 'height', label: 'ALTURA', sub: 'Silueta general', values: D.HEIGHTS, index: heightIndex,
        display: function (v) { return v.name; },
        set: function (v) { art.height = v.id; }
      });
      rows.push({
        key: 'body', label: 'CUERPO', sub: 'Constitución física', values: D.BODIES, index: bodyIndex,
        display: function (v) { return v.name; },
        set: function (v) { art.body = v.id; art.build = v.id; }
      });
      rows.push({
        key: 'skin', label: 'PIEL', sub: 'Tono de piel', values: D.SKIN_COLORS, color: true,
        index: Math.max(0, D.SKIN_COLORS.indexOf(art.skin)),
        display: function (v) { return v.toUpperCase(); },
        set: function (v) { art.skin = v; }
      });
      rows.push({
        key: 'nose', label: 'NARIZ', sub: 'Rasgo facial', values: D.NOSES, index: art.nose || 0,
        display: function (v) { return v; },
        set: function (v, i) { art.nose = i; }
      });
      rows.push({
        key: 'mouth', label: 'BOCA', sub: 'Expresión', values: D.MOUTHS, index: art.mouth || 0,
        display: function (v) { return v; },
        set: function (v, i) { art.mouth = i; }
      });
      rows.push({
        key: 'ears', label: 'OREJAS', sub: 'Forma', values: D.EARS, index: art.ears || 0,
        display: function (v) { return v; },
        set: function (v, i) { art.ears = i; }
      });
    } else if (tab === 'look') {
      rows.push({
        key: 'style', label: 'PEINADO', sub: 'Estilo de cabello', values: D.HAIR_STYLES,
        index: Math.max(0, D.HAIR_STYLES.map(function (h) { return h.id; }).indexOf(art.style)),
        display: function (v) { return v.name; },
        set: function (v) { art.style = v.id; }
      });
      rows.push({
        key: 'hair', label: 'CABELLO', sub: 'Color principal', values: D.HAIR_COLORS, color: true,
        index: Math.max(0, D.HAIR_COLORS.indexOf(art.hair)),
        display: function (v) { return v.toUpperCase(); },
        set: function (v) { art.hair = v; art.hair2 = shade(v, -38); }
      });
      rows.push({
        key: 'eye', label: 'OJOS', sub: 'Color del iris', values: D.EYE_COLORS, color: true,
        index: Math.max(0, D.EYE_COLORS.indexOf(art.eye)),
        display: function (v) { return v.toUpperCase(); },
        set: function (v) { art.eye = v; }
      });
      rows.push({
        key: 'pupils', label: 'PUPILAS', sub: 'Iris y pupila', values: D.PUPILS, index: art.pupils || 0,
        display: function (v) { return v; },
        set: function (v, i) { art.pupils = i; }
      });
      rows.push({
        key: 'accessory', label: 'ACCESORIO', sub: 'Detalle facial o ninja', values: accList,
        index: Math.max(0, accList.map(function (a) { return a.id; }).indexOf(art.accessory)),
        display: function (v) { return v.name; },
        set: function (v) { art.accessory = v.id; }
      });
    } else if (tab === 'outfit') {
      rows.push({
        key: 'outfit', label: 'TRAJE', sub: 'Color principal', values: D.OUTFIT_COLORS, color: true,
        index: Math.max(0, D.OUTFIT_COLORS.indexOf(art.outfit)),
        display: function (v) { return v.toUpperCase(); },
        set: function (v) { art.outfit = v; }
      });
      rows.push({
        key: 'outfit2', label: 'PANTALÓN', sub: 'Color secundario', values: D.OUTFIT2_COLORS, color: true,
        index: Math.max(0, D.OUTFIT2_COLORS.indexOf(art.outfit2)),
        display: function (v) { return v.toUpperCase(); },
        set: function (v) { art.outfit2 = v; }
      });
      rows.push({
        key: 'trim', label: 'DETALLES', sub: 'Cintas y ribetes', values: D.OUTFIT_COLORS, color: true,
        index: Math.max(0, D.OUTFIT_COLORS.indexOf(art.trim)),
        display: function (v) { return v.toUpperCase(); },
        set: function (v) { art.trim = v; }
      });
      rows.push({
        key: 'band', label: 'BANDANA', sub: 'Color de la tela', values: D.BAND_COLORS, color: true,
        index: Math.max(0, D.BAND_COLORS.indexOf(art.band)),
        display: function (v) { return v.toUpperCase(); },
        set: function (v) { art.band = v; }
      });
      rows.push({
        key: 'clan', label: 'CLAN', sub: 'Herencia y bonus', values: D.CLANS, index: clanIndex,
        display: function (v) { return v.name; },
        set: function (v) {
          createState.clan = v.id;
          if (v.accessory) art.accessory = v.accessory;
        }
      });
    } else {
      rows.push({
        key: 'style', label: 'ESTILO', sub: 'Forma de combatir', values: D.FIGHT_STYLES, index: styleIndex,
        display: function (v) { return v.name; },
        set: function (v) { createState.style = v.id; }
      });
      rows.push({
        key: 'clan', label: 'CLAN', sub: 'Bonus pasivo de sangre', values: D.CLANS, index: clanIndex,
        display: function (v) { return v.name; },
        set: function (v) {
          createState.clan = v.id;
          if (v.accessory) art.accessory = v.accessory;
        }
      });
      rows.push({
        key: 'accessory', label: 'ACCESORIO', sub: 'Detalle ninja', values: accList,
        index: Math.max(0, accList.map(function (a) { return a.id; }).indexOf(art.accessory)),
        display: function (v) { return v.name; },
        set: function (v) { art.accessory = v.id; }
      });
    }
    return rows;
  }

  let currentCreateRows = [];

  function renderCreate() {
    if (!createState) return;
    const tabs = createTabsList();
    const tabBox = document.querySelector('#screen-create .create-tabs');
    if (tabBox) {
      const expected = tabs.map(function (t) { return t.id; }).join('|');
      if (tabBox.dataset.ready !== expected) {
        tabBox.dataset.ready = expected;
        tabBox.innerHTML = tabs.map(function (t) {
          return '<button class="create-tab" type="button" data-create-tab="' + t.id + '">' + t.name + '</button>';
        }).join('');
      }
      $$('.create-tab', tabBox).forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.createTab === createTab);
      });
    }
    const tab = tabs.filter(function (t) { return t.id === createTab; })[0] || tabs[0];
    const titleNode = $('create-tab-title');
    if (titleNode) titleNode.textContent = tab.name + ' · ' + (createTab === 'body' ? 'PROPORCIONES' : createTab === 'look' ? 'IDENTIDAD' : createTab === 'outfit' ? 'CLAN Y ESTILO' : 'ESTILO SHINOBI');
    currentCreateRows = createRowsForTab(createTab);
    const pager = $('create-pager');
    if (pager) pager.textContent = currentCreateRows.length + ' OPCIONES';
    const rows = $('create-rows');
    if (rows) {
      rows.innerHTML = currentCreateRows.map(function (row, ri) {
        let valueHTML = '<div class="create-value"><b>' + escapeHTML(row.display(row.values[row.index])) + '</b><small>' + escapeHTML(row.sub) + '</small></div>';
        let swatches = '';
        if (row.color) {
          swatches = '<div class="create-swatches">' + row.values.map(function (color, ci) {
            return '<button class="swatch ' + (ci === row.index ? 'active' : '') + '" data-swatch="' + ri + '" data-value="' + ci + '" style="background:' + escapeHTML(color) + '" title="' + escapeHTML(color) + '"></button>';
          }).join('') + '</div>';
        }
        return '<div class="create-row" data-row="' + ri + '" style="grid-template-columns:1fr minmax(0,150px) 25px 25px;">' +
          '<label>' + escapeHTML(row.label) + '<small>' + escapeHTML(row.sub) + '</small></label>' +
          valueHTML +
          '<button class="create-arrow" data-key="' + escapeHTML(row.key) + '" data-dir="-1" aria-label="Anterior">‹</button>' +
          '<button class="create-arrow" data-key="' + escapeHTML(row.key) + '" data-dir="1" aria-label="Siguiente">›</button>' +
          swatches + '</div>';
      }).join('');
    }
    const art = createArt();
    const nameNode = $('create-badge-name');
    if (nameNode) nameNode.textContent = createState.name || 'SIN NOMBRE';
    const clanNode = $('create-badge-clan');
    if (clanNode) clanNode.textContent = clanData(createState.clan).name.toUpperCase();
    const badgeVillage = $('create-badge-village');
    if (badgeVillage) badgeVillage.textContent = 'ALDEA DE LA HOJA';
    const metaVillage = $('meta-village');
    if (metaVillage) metaVillage.textContent = 'Konoha';
    const metaClan = $('meta-clan');
    if (metaClan) metaClan.textContent = clanData(createState.clan).name;
    const metaStyle = $('meta-style');
    if (metaStyle) metaStyle.textContent = styleData(createState.style).name;
    const perk = $('create-perk');
    const clan = clanData(createState.clan);
    if (perk) perk.textContent = clan.perk + ' · ' + styleData(createState.style).desc;
    const stats = computeStats(baseStats(createState.baseId), createState.clan, createState.style);
    const mini = $('create-mini-stats');
    if (mini) {
      mini.innerHTML = [['NIN', 'nin'], ['TAI', 'tai'], ['GEN', 'gen'], ['VEL', 'spd'], ['DEF', 'def']].map(function (p, i) {
        return '<div class="mini-stat"><span>' + p[0] + '</span><b>' + (stats[p[1]] || 0) + '</b><i style="width:' + clamp((stats[p[1]] || 0) / 12 * 100, 8, 100) + '%"></i></div>';
      }).join('');
    }
    drawCreatePreview(art, 0);
  }

  function drawCreatePreview(art, time) {
    const canvas = $('create-canvas');
    if (!canvas) return;
    const h = D.HEIGHTS.filter(function (x) { return x.id === art.height; })[0] || D.HEIGHTS[1];
    drawCharacterPreview(canvas, art, {
      time: time || 0, heightScale: h.scale,
      facing: createState ? createState.facing : 1, color: clanData(createState ? createState.clan : 'civil').color
    });
  }

  function startCreateLoop() {
    startLoop('create', function (t) {
      const art = createArt();
      if (art) drawCreatePreview(art, t);
    });
  }

  function changeCreateRow(key, dir) {
    const row = currentCreateRows.filter(function (r) { return r.key === key; })[0];
    if (!row) return;
    const next = (row.index + dir + row.values.length) % row.values.length;
    row.set(row.values[next], next);
    safeSfx('click');
    renderCreate();
  }

  function setCreateRowValue(key, index) {
    const row = currentCreateRows.filter(function (r) { return r.key === key; })[0];
    if (!row) return;
    row.set(row.values[index], index);
    safeSfx('click');
    renderCreate();
  }

  function randomizeCreate() {
    if (!createState) return;
    const pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
    const art = createState.art;
    art.skin = pick(D.SKIN_COLORS);
    art.hair = pick(D.HAIR_COLORS);
    art.hair2 = shade(art.hair, -38);
    art.style = pick(D.HAIR_STYLES).id;
    art.eye = pick(D.EYE_COLORS);
    art.pupils = Math.floor(Math.random() * D.PUPILS.length);
    art.nose = Math.floor(Math.random() * D.NOSES.length);
    art.mouth = Math.floor(Math.random() * D.MOUTHS.length);
    art.ears = Math.floor(Math.random() * D.EARS.length);
    art.outfit = pick(D.OUTFIT_COLORS);
    art.outfit2 = pick(D.OUTFIT2_COLORS);
    art.trim = pick(D.OUTFIT_COLORS);
    art.band = pick(D.BAND_COLORS);
    art.height = pick(D.HEIGHTS).id;
    art.body = pick(D.BODIES).id;
    art.build = art.body;
    art.accessory = pick(D.ACCESSORIES).id;
    createState.clan = pick(D.CLANS).id;
    createState.style = pick(D.FIGHT_STYLES).id;
    safeSfx('confirm');
    renderCreate();
    toast('Apariencia aleatoria generada', 'exp', '✦');
  }

  function resetCreate() {
    if (!createInitial || !createState) return;
    createState.art = clone(createInitial.art);
    createState.name = createInitial.name;
    createState.clan = createInitial.clan;
    createState.style = createInitial.style;
    createState.facing = 1;
    const input = $('input-name');
    if (input) input.value = createState.name;
    safeSfx('back');
    renderCreate();
  }

  function baseStats(baseId) {
    const c = charData(baseId);
    return c && c.stats ? clone(c.stats) : { nin: 5, tai: 5, gen: 5, spd: 5, def: 5 };
  }

  function computeStats(base, clanId, styleId) {
    const out = clone(base || { nin: 5, tai: 5, gen: 5, spd: 5, def: 5 });
    const clan = clanData(clanId), style = styleData(styleId);
    ['nin', 'tai', 'gen', 'spd', 'def'].forEach(function (k) {
      out[k] = (out[k] || 0) + ((clan.bonus && clan.bonus[k]) || 0) + ((style.bonus && style.bonus[k]) || 0);
      out[k] = clamp(out[k], 1, 20);
    });
    return out;
  }

  function heightScaleFor(id) {
    const h = D.HEIGHTS.filter(function (x) { return x.id === id; })[0];
    return h ? h.scale : 1;
  }

  function finishCreateAndChooseVillage() {
    if (!createState) return;
    const input = $('input-name');
    const name = (input ? input.value : createState.name).trim().replace(/\s+/g, ' ');
    if (!name) {
      toast('Escribe un nombre para tu shinobi', 'bad', '!');
      safeSfx('error');
      if (input) input.focus();
      return;
    }
    createState.name = name.slice(0, 20);
    safeSfx('confirm');
    openVillage();
  }

  /* ---------------- Aldea natal ---------------- */
  const VILLAGE_POSITIONS = {
    konoha: { x: 51, y: 61 }, suna: { x: 41, y: 76 }, kiri: { x: 66, y: 67 },
    iwa: { x: 37, y: 48 }, kumo: { x: 62, y: 39 }, taki: { x: 46, y: 58 },
    oto: { x: 57, y: 51 }, ame: { x: 48, y: 64 }, shimo: { x: 63, y: 27 },
    hoshi: { x: 44, y: 34 }
  };

  function openVillage() {
    if (!createState) return;
    selectedVillage = 'konoha';
    showScreen('village');
    renderVillage();
  }

  function renderVillage() {
    const village = D.VILLAGES.filter(function (v) { return v.id === 'konoha'; })[0] || D.VILLAGES[0];
    const pins = $('map-pins');
    if (pins) {
      pins.innerHTML = D.VILLAGES.map(function (v) {
        const pos = VILLAGE_POSITIONS[v.id] || { x: 50, y: 50 };
        const available = v.id === 'konoha';
        return '<button class="map-pin ' + (available ? 'available' : 'locked') + (v.id === selectedVillage ? ' active' : '') + '"' +
          ' style="left:' + pos.x + '%;top:' + pos.y + '%" data-village="' + v.id + '" title="' + escapeHTML(v.name) + '">' +
          '<span class="pin-dot"></span><span>' + escapeHTML(v.short || v.name) + '</span></button>';
      }).join('');
    }
    const grid = $('village-grid');
    if (grid) {
      grid.innerHTML = D.VILLAGES.map(function (v) {
        const available = v.id === 'konoha';
        return '<button class="village-chip ' + (v.id === selectedVillage ? 'active' : '') + (available ? '' : ' locked') + '" data-village="' + v.id + '">' +
          '<i style="background:' + escapeHTML(v.color || '#ffc247') + '"></i><span>' + escapeHTML(v.short || v.name) + '</span>' +
          (available ? '<b>✓</b>' : '<b>🔒</b>') + '</button>';
      }).join('');
    }
    const name = $('village-name');
    if (name) name.textContent = village.name;
    const short = $('village-short');
    if (short) short.textContent = (village.short || village.name).toUpperCase();
    const country = $('village-country');
    if (country) country.textContent = (village.country || 'PAÍS DEL FUEGO').toUpperCase();
    const desc = $('village-desc');
    if (desc) desc.textContent = village.desc;
    const bonus = $('village-bonus');
    if (bonus) bonus.textContent = village.bonus || 'La Voluntad del Fuego arde en cada shinobi de Konoha.';
    const kage = $('village-kage');
    if (kage) kage.textContent = village.kage || 'Hiruzen Sarutobi';
    const status = $('map-status');
    if (status) status.textContent = '1 aldea disponible · ' + (D.VILLAGES.length - 1) + ' por desbloquear';
    drawVillageEmblem();
  }

  function drawVillageEmblem() {
    const canvas = $('village-emblem');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const g = ctx.createRadialGradient(48, 48, 2, 48, 48, 56);
    g.addColorStop(0, 'rgba(255,194,71,.18)');
    g.addColorStop(1, 'rgba(4,14,24,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    window.Art.symbol(ctx, 'leaf', 48, 48, 64, { color: '#ffc247' });
    ctx.strokeStyle = 'rgba(255,194,71,.32)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(48, 48, 43, 0, Math.PI * 2); ctx.stroke();
  }

  function pickVillage(id) {
    if (id !== 'konoha') {
      safeSfx('error');
      toast('Esa aldea llegará en una futura actualización. Por ahora solo Konoha.', 'bad', '🔒');
      return;
    }
    selectedVillage = id;
    renderVillage();
    safeSfx('click');
  }

  function confirmVillage() {
    if (!createState) return;
    const begin = function () {
      finishCharacterCreation();
    };
    if (saveData) {
      showConfirm({
        kicker: 'PARTIDA EXISTENTE',
        title: 'SOBRESCRIBIR HISTORIA',
        text: 'Ya existe una partida guardada. Si comienzas una nueva aventura, la anterior se perderá. ¿Quieres continuar?',
        ok: 'CREAR NUEVO SHINOBI',
        cancel: 'CANCELAR',
        danger: true,
        onOk: begin
      });
    } else {
      begin();
    }
  }

  /* ---------------- Creación del perfil ---------------- */
  function customJutsu(clanId, styleId) {
    const tables = {
      uzumaki: [
        { name: 'Remolino de Chakra', type: 'nova', cost: 18, color: '#ff9e45', desc: 'Una explosión de energía vital que empuja a los enemigos cercanos.' },
        { name: 'Cadenas de Chakra', type: 'projectile', cost: 22, color: '#ffcf5c', desc: 'Cadenas doradas que atraviesan el campo.' }
      ],
      uchiha: [
        { name: 'Bola de Fuego', type: 'projectile', cost: 18, color: '#ff6b35', desc: 'Una gran esfera de fuego que arrasa la línea enemiga.' },
        { name: 'Genjutsu Sharingan', type: 'field', cost: 22, color: '#c62e2e', desc: 'Ilusión ocular que aturde a los rivales en un área.' }
      ],
      hyuga: [
        { name: 'Ocho Trigramas', type: 'nova', cost: 16, color: '#b9e8ff', desc: 'Golpes de palma que cierran los puntos de chakra cercanos.' },
        { name: 'Kaiten', type: 'dash', cost: 20, color: '#d8f4ff', desc: 'Rotación defensiva que repele ataques y embiste.' }
      ],
      nara: [
        { name: 'Posesión de Sombra', type: 'field', cost: 20, color: '#475f3f', desc: 'La sombra atrapa a los enemigos en el área.' },
        { name: 'Lanza de Sombra', type: 'projectile', cost: 18, color: '#6d8a5e', desc: 'Una aguja de sombra a larga distancia.' }
      ],
      akimichi: [
        { name: 'Expansión Corporal', type: 'nova', cost: 20, color: '#e09a56', desc: 'Tu cuerpo crece y derriba todo a tu alrededor.' },
        { name: 'Puño de Carne', type: 'dash', cost: 18, color: '#c9793a', desc: 'Una embestida con la fuerza de una montaña.' }
      ],
      inuzuka: [
        { name: 'Colmillo Sobrepasado', type: 'dash', cost: 16, color: '#c9a06a', desc: 'Tú y tu compañero atacan girando como una bala.' },
        { name: 'Aliento de Bestia', type: 'projectile', cost: 19, color: '#d8b56a', desc: 'Una onda de instinto salvaje.' }
      ],
      aburame: [
        { name: 'Enjambre Kikaichu', type: 'field', cost: 18, color: '#5d7a4a', desc: 'Una nube de insectos que drena el chakra enemigo.' },
        { name: 'Escarabajo Perforador', type: 'projectile', cost: 20, color: '#3f5240', desc: 'Un insecto gigante atraviesa la formación.' }
      ],
      yamanaka: [
        { name: 'Transferencia Mental', type: 'field', cost: 21, color: '#d8b04a', desc: 'Una onda psíquica que rompe la concentración.' },
        { name: 'Flor de Mente', type: 'projectile', cost: 19, color: '#f0d47a', desc: 'Una flor de chakra que persigue al objetivo.' }
      ],
      sarutobi: [
        { name: 'Shuriken de Fuego', type: 'projectile', cost: 17, color: '#ff8a3a', desc: 'Proyectiles incendiarios de precisión.' },
        { name: 'Técnica de Tierra', type: 'field', cost: 21, color: '#a8834e', desc: 'El suelo estalla bajo los pies enemigos.' }
      ],
      hatake: [
        { name: 'Raikiri', type: 'dash', cost: 20, color: '#9fe8ff', desc: 'Un tajo de rayos que atraviesa la distancia.' },
        { name: 'Lobo de Rayo', type: 'projectile', cost: 22, color: '#d8f8ff', desc: 'Una bestia eléctrica que corre hacia el rival.' }
      ],
      civil: [
        { name: 'Esfera de Chakra', type: 'projectile', cost: 16, color: '#7ce4ff', desc: 'Una esfera giratoria de chakra comprimido.' },
        { name: 'Onda de Choque', type: 'nova', cost: 20, color: '#6ab8e8', desc: 'Una descarga que empuja a todo enemigo cercano.' }
      ]
    };
    let list = tables[clanId] || tables.civil;
    if (styleId === 'taijutsu') {
      list = list.slice(0, 1).concat([{ name: 'Ráfaga de Puños', type: 'dash', cost: 15, color: '#ffbe6a', desc: 'Una combinación física que cierra la distancia.' }]);
    } else if (styleId === 'genjutsu') {
      list = list.slice(0, 1).concat([{ name: 'Ilusión de Espejos', type: 'field', cost: 22, color: '#c99aff', desc: 'El enemigo queda atrapado en una ilusión.' }]);
    } else if (styleId === 'speed') {
      list = list.slice(0, 1).concat([{ name: 'Corte Relámpago', type: 'dash', cost: 17, color: '#aef4ff', desc: 'Un tajo instantáneo imposible de seguir.' }]);
    }
    return list;
  }

  function customUltimate(clanId) {
    const list = {
      uzumaki: { name: 'Tormenta del Remolino', color: '#ff9e45', desc: 'El chakra del clan Uzumaki estalla como un huracán.' },
      uchiha: { name: 'Susanoo Carmesí', color: '#c62e2e', desc: 'El avatar del Sharingan desciende sobre el campo.' },
      hyuga: { name: 'Ruptura de los Ocho Trigramas', color: '#d8f4ff', desc: 'Cada punto de chakra del enemigo es sellado.' },
      nara: { name: 'Pozo de Sombras', color: '#475f3f', desc: 'Mil sombras arrastran al rival bajo tierra.' },
      akimichi: { name: 'Dios de la Muerte', color: '#e09a56', desc: 'Una técnica prohibida que concentra toda tu vitalidad.' },
      inuzuka: { name: 'Doble Colmillo Huracanado', color: '#c9a06a', desc: 'Tú y tu compañero se convierten en un tornado de colmillos.' },
      aburame: { name: 'Plaga de la Hoja', color: '#5d7a4a', desc: 'Un enjambre infinito devora el chakra del campo.' },
      yamanaka: { name: 'Palacio de la Mente', color: '#d8b04a', desc: 'Arrastras al enemigo a tu propio mundo mental.' },
      sarutobi: { name: 'Voluntad del Fuego', color: '#ff8a3a', desc: 'Las llamas de la aldea protegen a los suyos.' },
      hatake: { name: 'Relámpago Blanco', color: '#9fe8ff', desc: 'Un destello de luz corta el cielo y el suelo.' },
      civil: { name: 'Legado de la Hoja', color: '#7ce4ff', desc: 'No hay sangre antigua: solo una voluntad que no se rinde.' }
    };
    return list[clanId] || list.civil;
  }

  function buildProfile() {
    const base = charData(createState.baseId);
    const clan = clanData(createState.clan);
    const style = styleData(createState.style);
    const art = clone(createState.art);
    art.height = art.height || 'media';
    art.body = art.body || art.build || 'normal';
    art.build = art.body;
    art.villageSymbol = 'leaf';
    if (!art.accessory) art.accessory = 'none';
    if (!art.hair2) art.hair2 = shade(art.hair || '#3b2a22', -38);
    const stats = computeStats(baseStats(createState.baseId), createState.clan, createState.style);
    const jutsu = base && base.jutsu ? clone(base.jutsu) : customJutsu(createState.clan, createState.style);
    const ultimate = base && base.ultimate ? clone(base.ultimate) : customUltimate(createState.clan);
    return {
      name: createState.name,
      baseId: createState.baseId,
      village: 'konoha',
      villageName: 'Aldea Oculta de la Hoja',
      clan: createState.clan,
      clanName: clan.name,
      style: createState.style,
      styleName: style.name,
      title: base ? base.title : 'Nueva leyenda de la Hoja',
      role: base ? base.role : 'Shinobi de la Hoja',
      element: base ? base.element : (clan.name === 'Sin clan' ? 'Chakra puro' : 'Sangre de clan'),
      level: 1,
      xp: 0,
      ryo: 500,
      rank: 'genin',
      stats: stats,
      jutsu: jutsu,
      ultimate: ultimate,
      art: art,
      heightScale: heightScaleFor(art.height),
      quote: base ? base.quote : '«No heredé un clan. Voy a heredar una leyenda.»',
      bio: base ? base.bio : 'Un shinobi sin historia que está a punto de escribir la más grande de todas.',
      idNumber: String(100000 + Math.floor(Math.random() * 900000)),
      createdAt: Date.now()
    };
  }

  function finishCharacterCreation() {
    hideAllModals();
    const profile = buildProfile();
    state = {
      version: 1,
      mode: pendingMode,
      createdAt: Date.now(),
      lastPlayed: Date.now(),
      profile: profile,
      timeMinutes: 8 * 60,
      day: 1,
      worldPos: null,
      world3dPos: null,
      progress: {
        arcs: [], missions: [], collectibles: [], collectibles3d: [], history: [],
        tutorialStage: 0, introSeen: false, trainingWon: false, lastRamenDay: 0
      },
      stats: { victories: 0, defeats: 0, totalXp: 0, totalRyo: 0, playSeconds: 0 }
    };
    queuedRank = null;
    pendingReturnPos = null;
    worldStarted = false;
    saveGame(true);
    const intro = window.Story.buildAcademyIntro(profile, pendingMode);
    const chapter = pendingMode === 'training' ? 'CAMPO DE ENTRENAMIENTO 3 · PRÓLOGO' : 'ACADEMIA NINJA · PRÓLOGO';
    showTransition(function () {
      playCutscene(intro, {
        chapter: chapter,
        onDone: function () {
          if (!state) return;
          state.progress.introSeen = true;
          saveGame(true);
          showScreen('world');
          updateWorldHUD();
          startOrResumeWorld(pendingMode === 'training' ? 'training' : 'academy');
          updateQuestTracker();
          setTimeout(function () {
            toast(pendingMode === 'training' ? 'Campo de Entrenamiento 3 · Kakashi te espera' : 'Academia Ninja · Iruka-sensei te espera', 'exp', '✦');
          }, 700);
        }
      });
    });
  }

  /* ---------------- Progresión ---------------- */
  function xpMultiplier() {
    if (!state) return 1;
    let mult = 1;
    if (state.profile.clan === 'civil') mult += 0.12;
    if (state.profile.village === 'konoha') mult += 0.05;
    return mult;
  }

  function grantRewards(xp, ryo, opts) {
    opts = opts || {};
    if (!state) return { xp: 0, ryo: 0, levels: 0, rankUp: null };
    const hasNoClan = state.profile.clan === 'civil';
    const multXp = opts.raw ? 1 : (hasNoClan ? 1.12 : 1) + (state.profile.village === 'konoha' ? 0.05 : 0);
    const multRyo = opts.raw ? 1 : (hasNoClan ? 1.1 : 1) + (state.profile.village === 'konoha' ? 0.05 : 0);
    const addXp = Math.max(0, Math.round((xp || 0) * multXp));
    const addRyo = Math.max(0, Math.round((ryo || 0) * multRyo));
    const p = state.profile;
    p.xp += addXp;
    p.ryo += addRyo;
    state.stats.totalXp += addXp;
    state.stats.totalRyo += addRyo;
    let levelUps = 0;
    while (p.level < D.MAX_LEVEL && p.xp >= D.LEVEL_XP(p.level)) {
      p.xp -= D.LEVEL_XP(p.level);
      p.level++;
      levelUps++;
      p.stats.nin += p.level % 3 === 0 ? 1 : 0;
      p.stats.tai += p.level % 4 === 0 ? 1 : 0;
      p.stats.gen += p.level % 5 === 0 ? 1 : 0;
      p.stats.spd += p.level % 4 === 1 ? 1 : 0;
      p.stats.def += p.level % 5 === 2 ? 1 : 0;
    }
    if (p.level >= D.MAX_LEVEL) p.xp = Math.min(p.xp, D.LEVEL_XP(D.MAX_LEVEL));
    const nextRank = rankForLevel(p.level);
    let rankUp = null;
    if (nextRank !== p.rank) {
      rankUp = { from: p.rank, to: nextRank };
      p.rank = nextRank;
      queuedRank = rankUp;
    }
    if (!opts.silent) {
      if (addXp) toast('+' + fmtNum(addXp) + ' EXP' + (addRyo ? ' · +₽' + fmtNum(addRyo) : ''), 'exp', '✦');
      if (levelUps) toast('¡Nivel ' + p.level + ' alcanzado!', 'good', '↑');
    }
    saveGame(true);
    updateWorldHUD();
    return { xp: addXp, ryo: addRyo, levels: levelUps, rankUp: rankUp };
  }

  function flushRankUp(after) {
    if (queuedRank) {
      const q = queuedRank;
      queuedRank = null;
      showRankUp(q, after);
      return true;
    }
    if (after) after();
    return false;
  }

  function showRankUp(rankUp, after) {
    if (!rankUp) { if (after) after(); return; }
    if (currentScreen === 'world' && window.World.isActive()) window.World.pause();
    if (currentScreen === 'world3d' && window.Konoha3D && window.Konoha3D.isActive()) {
      syncWorld3DPosition();
      window.Konoha3D.pause();
    }
    const next = rankData(rankUp.to);
    const title = $('reward-title');
    if (title) title.textContent = next.name.toUpperCase();
    const text = $('reward-text');
    if (text) text.textContent = 'Has ascendido de ' + rankData(rankUp.from).name + ' a ' + next.name + '. ' + next.desc + ' Tu bandana ha cambiado y nuevas misiones están a tu alcance.';
    const kicker = $('reward-kicker');
    if (kicker) kicker.textContent = 'ASCENSO DE RANGO';
    const canvas = $('reward-bandana');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const g = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 5, canvas.width / 2, canvas.height / 2, canvas.width * 0.55);
      g.addColorStop(0, 'rgba(255,194,71,.12)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
      window.Art.bandana(ctx, canvas.width / 2, canvas.height / 2 + 4, canvas.width * 0.72, { rank: rankUp.to, village: 'konoha' });
    }
    rankUpAfter = after || null;
    safeSfx('rankup');
    showModal('reward-modal');
    updateWorldHUD();
  }

  let rankUpAfter = null;

  /* ---------------- Estado del mundo ---------------- */
  function startOrResumeWorld(spawn) {
    if (!state) return;
    if (worldStarted && window.World.isActive()) {
      window.World.setQuest(computeQuest());
      window.World.resume();
      safePlayTrack('village');
      updateQuestTracker();
      updateWorldHUD();
      return;
    }
    window.World.stop();
    worldStarted = true;
    const targetSpawn = spawn || (state.mode === 'training' ? 'training' : 'academy');
    window.World.start($('world-canvas'), {
      state: state,
      spawn: targetSpawn,
      quest: computeQuest(),
      callbacks: {
        onInteract: function (npc) { handleNpcInteract(npc); },
        onCollect: function (item) { handleCollectible(item); }
      }
    });
    if (pendingReturnPos && window.World.teleport) {
      window.World.teleport(pendingReturnPos.x, pendingReturnPos.y);
      state.worldPos = { x: pendingReturnPos.x, y: pendingReturnPos.y };
      pendingReturnPos = null;
    } else if (state.worldPos && window.World.teleport) {
      window.World.teleport(state.worldPos.x, state.worldPos.y);
    }
    safePlayTrack('village');
    updateWorldHUD();
    updateQuestTracker();
    if (!saveTimer) saveTimer = setInterval(function () { if (state) saveGame(true); }, 45000);
  }

  function captureReturnPosition() {
    if (window.World.isActive()) {
      const p = window.World.getPlayer();
      const ws = window.World.getState ? window.World.getState() : null;
      if (p) pendingReturnPos = { x: p.x, y: p.y };
      if (ws) {
        state.timeMinutes = ws.timeMinutes;
        state.day = ws.day;
      }
    } else if (!pendingReturnPos && state.worldPos) {
      pendingReturnPos = { x: state.worldPos.x, y: state.worldPos.y };
    }
  }

  function handleCollectible(item) {
    if (!state || !item) return;
    if (state.progress.collectibles.indexOf(item.id) < 0) state.progress.collectibles.push(item.id);
    const info = (window.World.itemInfo && window.World.itemInfo[item.type]) || { name: 'Objeto perdido', xp: 15, ryo: 10, lore: '' };
    const r = grantRewards(info.xp, info.ryo, { silent: true });
    toast(info.name + ' · +' + fmtNum(r.xp) + ' EXP', 'exp', '✦');
    if (info.lore) {
      setTimeout(function () { toast(info.lore, '', '記'); }, 500);
    }
    if (state.progress.collectibles.length >= 14) {
      addHistory({ type: 'collect', title: 'Coleccionista de la Hoja', rank: 'S', detail: 'Encontró los 14 secretos de Konoha.' });
    }
    saveGame(true);
    updateWorldHUD();
    updateQuestTracker();
    flushRankUp();
  }

  function addHistory(entry) {
    if (!state) return;
    const record = Object.assign({
      at: Date.now(),
      type: entry.type || 'mission',
      title: entry.title || 'Hazaña',
      rank: entry.rank || 'D',
      detail: entry.detail || ''
    }, entry);
    state.progress.history.unshift(record);
    state.progress.history = state.progress.history.slice(0, 30);
  }

  function processVictory(config, result) {
    if (!state) return null;
    if (config.kind === 'arc') {
      if (state.progress.arcs.indexOf(config.arcId) < 0) state.progress.arcs.push(config.arcId);
      const arc = window.Story.getArc(config.arcId);
      if (arc) {
        addHistory({ type: 'arc', title: arc.name, rank: config.rank, detail: 'Arco ' + String(window.Story.arcNumber(arc)).padStart(2, '0') + ' completado.' });
      }
      if (config.arcId === 'p1-01' && state.progress.tutorialStage < 3) state.progress.tutorialStage = 3;
    } else if (config.kind === 'mission') {
      if (state.progress.missions.indexOf(config.missionId) < 0) state.progress.missions.push(config.missionId);
      const mission = window.Story.missionById(config.missionId);
      if (mission) {
        addHistory({ type: 'mission', title: mission.title, rank: config.rank, detail: mission.location + ' · ' + mission.giver });
      }
      if (state.mode === 'story' && state.progress.tutorialStage === 1) {
        state.progress.tutorialStage = 2;
      }
    } else if (config.kind === 'training') {
      state.progress.trainingWon = true;
      addHistory({ type: 'training', title: config.title, rank: 'D', detail: 'Combate de práctica completado.' });
    }
    state.stats.victories++;
    const rewards = grantRewards(config.reward.xp, config.reward.ryo, { silent: true });
    saveGame(true);
    updateWorldHUD();
    return rewards;
  }

  function updateWorldHUD() {
    if (!state) return;
    const p = state.profile;
    const rank = rankData(p.rank);
    const name = $('hud-name');
    if (name) name.textContent = p.name;
    const rankNode = $('hud-rank');
    if (rankNode) rankNode.textContent = rank.name.toUpperCase();
    const level = $('hud-level');
    if (level) level.textContent = p.level;
    const ryo = $('hud-ryo');
    if (ryo) ryo.textContent = '₽ ' + fmtNum(p.ryo);
    const need = p.level >= D.MAX_LEVEL ? D.LEVEL_XP(D.MAX_LEVEL) : D.LEVEL_XP(p.level);
    const xpText = $('hud-xp-text');
    if (xpText) xpText.textContent = p.level >= D.MAX_LEVEL ? 'NIVEL MÁXIMO' : fmtNum(p.xp) + ' / ' + fmtNum(need) + ' XP';
    const fill = $('hud-xp-fill');
    if (fill) fill.style.width = clamp(p.xp / need * 100, 0, 100) + '%';
    const badge = $('world-mode-badge');
    if (badge) badge.textContent = state.mode === 'training' ? 'ENTRENAMIENTO LIBRE' : 'MODO HISTORIA';
    drawHudPortrait('hud-portrait');
    drawJournalPortrait();
    updateWorld3DHUD();
  }

  function updateWorld3DHUD() {
    if (!state) return;
    const p = state.profile;
    const rank = rankData(p.rank);
    const name = $('w3d-hud-name');
    if (name) name.textContent = p.name;
    const rankNode = $('w3d-hud-rank');
    if (rankNode) rankNode.textContent = rank.name.toUpperCase();
    const level = $('w3d-hud-level');
    if (level) level.textContent = p.level;
    const ryo = $('w3d-hud-ryo');
    if (ryo) ryo.textContent = '₽ ' + fmtNum(p.ryo);
    const need = p.level >= D.MAX_LEVEL ? D.LEVEL_XP(D.MAX_LEVEL) : D.LEVEL_XP(p.level);
    const xpText = $('w3d-hud-xp-text');
    if (xpText) xpText.textContent = p.level >= D.MAX_LEVEL ? 'NIVEL MÁXIMO' : fmtNum(p.xp) + ' / ' + fmtNum(need) + ' XP';
    const fill = $('w3d-hud-xp-fill');
    if (fill) fill.style.width = clamp(p.xp / need * 100, 0, 100) + '%';
    const badge = $('w3d-mode-badge');
    if (badge) badge.textContent = state.demo ? 'DEMO · EXPLORACIÓN LIBRE' : 'EXPLORACIÓN LIBRE 3D';
    const clock = $('w3d-clock');
    if (clock) clock.textContent = formatGameClock(state.timeMinutes);
    const day = $('w3d-day');
    if (day) day.textContent = 'DÍA ' + Math.max(1, state.day || 1);
    const place = $('w3d-place');
    if (place) place.textContent = w3dArea;
    const pauseNote = $('w3d-pause-note');
    if (pauseNote) {
      pauseNote.textContent = state.demo
        ? 'Modo demo: tu posición y los pergaminos no se guardarán. Crea un shinobi para conservar el progreso.'
        : 'Tu posición, la hora y los pergaminos encontrados se guardan en la partida.';
    }
    updateWorld3DScrollCounter();
    drawHudPortrait('w3d-hud-portrait');
  }

  function updateWorld3DScrollCounter() {
    const holder = $('w3d-scrolls');
    if (!holder) return;
    const count = holder.querySelector('b');
    const found = state && state.progress.collectibles3d ? state.progress.collectibles3d.length : w3dScrolls.found;
    const total = w3dScrolls.total || W3D_MAX_SCROLLS;
    if (count) count.textContent = found + ' / ' + total;
  }

  function drawHudPortrait(canvasId) {
    const canvas = $(canvasId || 'hud-portrait');
    if (!canvas || !state) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    const g = ctx.createRadialGradient(37, 34, 4, 37, 38, 38);
    g.addColorStop(0, 'rgba(255,194,71,.2)');
    g.addColorStop(1, 'rgba(5,18,30,.05)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.translate(37, 66);
    const s = 0.48 * (state.profile.heightScale || 1);
    ctx.scale(s, s);
    window.Art.character(ctx, state.profile.art, 0, 0, 1, { time: 0, facing: 1 });
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,194,71,.25)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(37, 37, 35, 0, Math.PI * 2); ctx.stroke();
  }

  function drawJournalPortrait() {
    const canvas = $('journal-portrait');
    if (!canvas || !state) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0b2234'); g.addColorStop(0.65, '#071724'); g.addColorStop(1, '#040d15');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#ffc247';
    ctx.beginPath(); ctx.arc(w * 0.7, h * 0.28, w * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(w / 2, h * 0.9);
    const s = Math.min(w / 190, h / 210) * 1.2;
    ctx.scale(s, s);
    window.Art.character(ctx, state.profile.art, 0, 0, 1, { time: 0, facing: 1 });
    ctx.restore();
    ctx.fillStyle = 'rgba(3,10,16,.65)';
    ctx.fillRect(0, h - 34, w, 34);
    ctx.fillStyle = '#ffd477';
    ctx.font = '700 12px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.profile.name.toUpperCase(), w / 2, h - 14);
    ctx.textAlign = 'left';
  }

  /* ---------------- Misiones activas ---------------- */
  function computeQuest() {
    if (!state) return null;
    if (state.mode === 'training') {
      if (!state.progress.trainingWon) {
        return {
          id: 'training-first', title: 'Calentamiento',
          desc: 'Kakashi te espera en el Campo de Entrenamiento 3. Habla con él para empezar el combate de práctica.',
          objective: 'Habla con Kakashi', reward: '120 EXP · ₽ 80',
          targetNpc: 'kakashi', kind: 'training'
        };
      }
      return {
        id: 'training-free', title: 'Shinobi libre',
        desc: 'El camino es tuyo: acepta misiones, explora Konoha o entrena con tus compañeros.',
        objective: 'Completa misiones de rango D y superiores', reward: 'Progresión libre',
        targetNpc: 'shikamaru', kind: 'training'
      };
    }
    const stage = state.progress.tutorialStage;
    if (stage === 0) {
      return {
        id: 'academy-1', title: 'El primer día',
        desc: 'Iruka-sensei te espera frente a la Academia. Es hora de demostrar que puedes soportar la mirada de la aldea.',
        objective: 'Habla con Iruka-sensei', reward: '120 EXP · ₽ 200',
        targetNpc: 'iruka', kind: 'story'
      };
    }
    if (stage === 1) {
      return {
        id: 'academy-2', title: 'Primera misión',
        desc: 'Iruka ha confiado en ti. Shikamaru tiene el tablero de misiones D abierto en el centro de la aldea.',
        objective: 'Habla con Shikamaru y acepta una misión D', reward: 'Experiencia y ryo',
        targetNpc: 'shikamaru', kind: 'story'
      };
    }
    if (stage === 2) {
      return {
        id: 'academy-3', title: 'Ciudadano de la Hoja',
        desc: 'El Tercer Hokage quiere conocerte en la Torre. Tu expediente de genin necesita su sello.',
        objective: 'Preséntate ante el Hokage', reward: '150 EXP · ₽ 150',
        targetNpc: 'hokage', kind: 'story'
      };
    }
    const next = window.Story.nextArc(state);
    if (next) {
      return {
        id: 'arc-next', title: 'Crónicas de la Hoja',
        desc: 'Siguiente arco recomendado: «' + next.name + '». Abre el tablero de Historia para revivir la leyenda.',
        objective: 'Completa el arco ' + String(window.Story.arcNumber(next)).padStart(2, '0') + ' de ' + (next.id.indexOf('p1') === 0 ? 'Naruto' : 'Shippuden'),
        reward: 'EXP · Ryo · Nueva crónica', targetNpc: 'hokage', kind: 'story'
      };
    }
    return {
      id: 'arc-complete', title: 'La Hoja en paz',
      desc: 'Has recorrido todas las crónicas de Naruto y Shippuden. Konoha te reconoce como una leyenda viva.',
      objective: 'Entrena, completa misiones S y encuentra todos los secretos', reward: 'Sin límites',
      targetNpc: 'shikamaru', kind: 'story'
    };
  }

  function updateQuestTracker() {
    if (!state) return;
    const q = computeQuest();
    if (!q) return;
    if (window.World.isActive()) window.World.setQuest(q);
    if (window.Konoha3D && window.Konoha3D.isActive()) window.Konoha3D.setQuest(q);
    const title = $('quest-title'), desc = $('quest-desc'), obj = $('quest-objective'), reward = $('quest-reward');
    if (title) title.textContent = q.title;
    if (desc) desc.textContent = q.desc;
    if (obj) obj.textContent = q.objective;
    if (reward) reward.textContent = q.reward;
    const wTitle = $('w3d-quest-title'), wDesc = $('w3d-quest-desc'), wObj = $('w3d-quest-objective');
    if (wTitle) wTitle.textContent = q.title;
    if (wDesc) wDesc.textContent = q.desc;
    if (wObj) wObj.textContent = q.objective;
    const tracker = document.querySelector('.quest-tracker');
    if (tracker) tracker.classList.toggle('collapsed', !!state.questCollapsed);
    const wTracker = $('w3d-quest-tracker');
    if (wTracker) wTracker.classList.toggle('collapsed', !!state.questCollapsed);
    const collapse = $('btn-quest-collapse');
    if (collapse) collapse.textContent = state.questCollapsed ? '+' : '−';
    const wCollapse = $('btn-w3d-quest-collapse');
    if (wCollapse) wCollapse.textContent = state.questCollapsed ? '+' : '−';
  }

  function maybeAdvanceNpcQuest(npc) {
    if (!state || !npc) return null;
    if (state.mode !== 'story') return null;
    const stage = state.progress.tutorialStage;
    if (npc.id === 'iruka' && stage === 0) {
      state.progress.tutorialStage = 1;
      grantRewards(120, 200, { silent: false });
      addHistory({ type: 'training', title: 'La lección de Iruka', rank: 'D', detail: 'Primer día en la Academia.' });
      saveGame(true);
      updateQuestTracker();
      return 'first';
    }
    if (npc.id === 'hokage' && stage === 2) {
      state.progress.tutorialStage = 3;
      grantRewards(150, 150, { silent: false });
      addHistory({ type: 'story', title: 'Sello del Hokage', rank: 'D', detail: 'Expediente de genin aprobado.' });
      saveGame(true);
      updateQuestTracker();
      return 'hokage';
    }
    return null;
  }

  /* ---------------- Interacción con NPCs ---------------- */
  const NPC_EXTRA_LINES = {
    kiba: ['«Akamaru dice que hueles a miedo. No te preocupes, a mí también me pasaba al principio.»', '«¡Eh, tú! ¿Quieres correr? El que pierda invita al ramen.»'],
    shino: ['«El silencio también es una forma de comunicación. Los insectos lo saben mejor que nadie.»', '«Hay 1.247 kikaichu bajo mi abrigo. Todos te están observando.»'],
    ino: ['«No basta con ser fuerte. También hay que saber presentarse. Y tú... necesitas práctica.»', '«Mi clan lee mentes, pero no necesito poderes para saber que estás nervioso.»'],
    choji: ['«¿Has probado el ramen de Teuchi? Yo prefiero el asado con patatas. Somos lo que comemos.»', '«Mis compañeros dicen que soy lento. Pero cuando hace falta, nadie me mueve.»'],
    konohamaru: ['«¡Yo seré el Séptimo Hokage! Bueno, el Sexto... o el que venga después de ti!»', '«El abuelo dice que un verdadero ninja nunca presume. Pero yo puedo presumir un poquito.»']
  };

  function npcLineFor(npc) {
    const stage = state.progress.tutorialStage;
    if (state.mode === 'story') {
      if (npc.id === 'iruka' && stage === 0) {
        return { text: 'Mira a tu alrededor, {name}. Esta aldea te ha mirado con desprecio, con lástima o con miedo. Hoy empieza el día en que decidirás qué hacer con esas miradas.', mood: 'warm' };
      }
      if (npc.id === 'iruka' && stage === 1) {
        return { text: 'No dejes que una mala bienvenida te robe el futuro. Shikamaru tiene trabajo para ti en el tablero. Empieza por una misión D y vuelve con la cabeza alta.', mood: 'warm' };
      }
      if (npc.id === 'shikamaru' && stage < 2) {
        return { text: 'Qué problema... Iruka dice que ya estás listo. Toma una misión D. No es glamoroso, pero hasta un Hokage empezó recogiendo basura.', mood: 'neutral' };
      }
      if (npc.id === 'hokage' && stage === 2) {
        return { text: 'Así que tú eres la nueva promesa de Iruka. La Hoja no pregunta por tu clan ni por tu pasado. Solo por tu voluntad. Bienvenido, {name}.', mood: 'warm' };
      }
    }
    if (npc.id === 'kakashi' && !state.progress.trainingWon) {
      return { text: 'Llegas tarde. O temprano, según se mire. El Campo 3 está libre. Si quieres aprender algo, tendrás que quitármelo.', mood: 'neutral' };
    }
    if (npc.id === 'teuchi') {
      return { text: '¡Un cliente nuevo! El ramen de Ichiraku cura casi todo: el hambre, el frío y las derrotas. ¿Te pongo un tazón?', mood: 'warm' };
    }
    if (npc.id === 'gate') {
      return { text: 'Las puertas de Konoha permanecen abiertas para sus ninjas. Otras tierras tendrán que esperar: hoy, la Hoja es tu hogar.', mood: 'neutral' };
    }
    if (npc.id === 'sasuke') {
      return { text: 'No tengo tiempo para perderlo contigo. Si quieres aprender algo útil, ponte en guardia. El camino del shinobi no se recorre hablando.', mood: 'neutral' };
    }
    if (npc.id === 'naruto') {
      return { text: '¡Eh, tú! ¿También estás explorando la aldea? Algún día seré Hokage y todos estos tejados serán mi responsabilidad. ¡Entrena conmigo si te atreves!', mood: 'warm' };
    }
    if (NPC_EXTRA_LINES[npc.id]) {
      const lines = NPC_EXTRA_LINES[npc.id];
      return { text: lines[(state.profile.name.length + npc.id.length) % lines.length], mood: 'neutral' };
    }
    const line = window.Story.getNpcLines(npc.id, state.profile);
    return { text: line, mood: 'neutral' };
  }

  function handleNpcInteract(npc) {
    if (!state || !npc) return;
    if (window.World.isActive()) window.World.pause();
    if (window.Konoha3D && window.Konoha3D.isActive() && !window.Konoha3D.isPaused()) window.Konoha3D.pause();
    const advance = maybeAdvanceNpcQuest(npc);
    const data = npcLineFor(npc);
    let line = data.text.replace(/\{name\}/g, state.profile.name);
    if (advance === 'first') {
      line = 'Eso es, ' + state.profile.name + '. Ya has dado el primer paso. Aquí no se trata de ganar una pelea: se trata de no dejar que la aldea decida quién eres. Shikamaru te espera en el tablero.';
    } else if (advance === 'hokage') {
      line = 'Expediente aprobado. Desde hoy eres un genin de la Hoja, con todos los derechos y deberes de un shinobi. Las crónicas de esta aldea también llevarán tu nombre, ' + state.profile.name + '.';
    }
    const options = [];
    const canMissions = ['iruka', 'hokage', 'shikamaru', 'sakura', 'kakashi'].indexOf(npc.id) >= 0;
    if (canMissions) {
      let rank = null;
      if (npc.id === 'iruka') rank = 'D';
      if (npc.id === 'shikamaru') rank = 'all';
      if (npc.id === 'sakura') rank = 'C';
      if (npc.id === 'kakashi') rank = 'B';
      if (npc.id === 'hokage') rank = 'S';
      options.push({
        label: rank === 'all' ? 'VER TABLERO DE MISIONES' : 'MISIONES DE RANGO ' + rank,
        primary: true, icon: '任',
        action: function () { openMissions(rank === 'all' ? 'all' : rank); }
      });
    }
    if (npc.id === 'hokage') {
      options.push({ label: 'ABRIR CRÓNICAS DE LA HOJA', icon: '巻', action: function () { openStoryPanel(); } });
    }
    if (npc.id === 'kakashi' || npc.id === 'rocklee') {
      const opponent = npc.id === 'rocklee' ? 'rocklee' : 'kakashi';
      options.push({
        label: state.progress.trainingWon ? 'SPARRING LIBRE CON ' + npc.name.toUpperCase() : 'ENTRENAR CON ' + npc.name.toUpperCase(),
        primary: npc.id === 'kakashi', icon: '術',
        action: function () { startTraining(opponent); }
      });
    }
    if (npc.id === 'shikamaru') {
      options.push({ label: 'CONSULTAR PRÓXIMA CRÓNICA', icon: '✦', action: function () { openStoryPanel(); } });
    }
    if (npc.id === 'teuchi') {
      options.push({ label: 'PEDIR RAMEN · ₽ 50', primary: true, icon: '飯', action: function () { eatRamen(); } });
    }
    if (npc.id === 'gate') {
      options.push({ label: 'ABRIR MAPA DEL MUNDO', icon: '地', action: function () { openWorldMap(); } });
    }
    if (npc.id === 'iruka') {
      options.push({ label: 'PEDIR CONSEJO', icon: '?', action: function () { npcAdvice(); } });
    }
    if (npc.id === 'sasuke' || npc.id === 'naruto') {
      options.push({
        label: 'ENTRENAR CON ' + npc.name.toUpperCase(), icon: '術',
        action: function () { startTraining(npc.id); }
      });
    }
    options.push({ label: 'DESPEDIRSE', icon: '×', close: true });
    openDialogue(npc, line, options);
  }

  function npcAdvice() {
    const facts = D.WORLD_FACTS;
    const fact = facts[Math.floor(Math.random() * facts.length)];
    closeDialogue(false);
    toast(fact, '', '記');
    setTimeout(function () { resumeWorldIfPaused(); }, 450);
  }

  function eatRamen() {
    if (!state) return;
    if (state.profile.ryo < 50) {
      closeDialogue(false);
      toast('Necesitas ₽ 50 para un tazón de Ichiraku.', 'bad', '!');
      setTimeout(resumeWorldIfPaused, 300);
      return;
    }
    state.profile.ryo -= 50;
    const firstToday = state.progress.lastRamenDay !== state.day;
    state.progress.lastRamenDay = state.day;
    const r = grantRewards(firstToday ? 70 : 25, 0, { silent: true });
    closeDialogue(false);
    toast('Ramen de Ichiraku · -₽50 · +' + r.xp + ' EXP', 'good', '飯');
    updateWorldHUD();
    saveGame(true);
    flushRankUp(function () { setTimeout(resumeWorldIfPaused, 250); });
  }

  /* ---------------- Diálogos ---------------- */
  function openDialogue(npc, line, options) {
    if (window.World.isActive()) window.World.pause();
    if (window.Konoha3D && window.Konoha3D.isActive() && !window.Konoha3D.isPaused()) window.Konoha3D.pause();
    hideAllModals();
    const name = $('dialogue-name');
    if (name) name.textContent = npc.name;
    const role = $('dialogue-role');
    if (role) role.textContent = npc.role || 'Shinobi de la Hoja';
    const affil = $('dialogue-affil');
    if (affil) affil.textContent = 'KONOHA';
    const text = $('dialogue-text');
    if (text) text.textContent = line;
    drawDialoguePortrait(npc);
    const box = $('dialogue-options');
    if (box) {
      box.innerHTML = options.map(function (o, i) {
        return '<button class="dialogue-option ' + (o.primary ? 'primary' : '') + '" data-option="' + i + '">' +
          '<i>' + escapeHTML(o.icon || '›') + '</i><span>' + escapeHTML(o.label) + '</span><b>›</b></button>';
      }).join('');
      $$('.dialogue-option', box).forEach(function (btn) {
        btn.addEventListener('click', function () {
          const o = options[Number(btn.dataset.option)];
          if (!o) return;
          safeSfx('click');
          if (o.close) { closeDialogue(true); return; }
          closeDialogue(false);
          if (o.action) o.action();
        });
      });
    }
    showModal('dialogue-modal');
  }

  function closeDialogue(resume) {
    hideModal('dialogue-modal');
    if (resume) resumeWorldIfPaused();
  }

  function resumeWorldIfPaused() {
    if (currentScreen === 'world3d' && window.Konoha3D && window.Konoha3D.isActive() && window.Konoha3D.isPaused && window.Konoha3D.isPaused()) {
      window.Konoha3D.resume();
      return;
    }
    if (currentScreen === 'world' && window.World.isActive() && window.World.isPaused && window.World.isPaused()) {
      window.World.resume();
    }
  }

  function drawDialoguePortrait(npc) {
    const canvas = $('dialogue-portrait');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#123043'); g.addColorStop(0.7, '#081b29'); g.addColorStop(1, '#040d15');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = 0.12; ctx.fillStyle = '#ffc247';
    ctx.beginPath(); ctx.arc(w * 0.68, h * 0.25, w * 0.38, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    const key = npc.portrait;
    const img = key && window.Art.images && window.Art.images[key];
    if (img && img.complete && img.naturalWidth) {
      ctx.drawImage(img, 0, 0, w, h);
      ctx.fillStyle = 'rgba(2,8,14,.17)'; ctx.fillRect(0, 0, w, h);
    } else {
      ctx.save();
      ctx.translate(w / 2, h * 0.94);
      ctx.scale(w / 190, h / 190);
      window.Art.character(ctx, npc.art || D.CHAR_MAP.kakashi.art, 0, 0, 1, { time: 0, facing: 1 });
      ctx.restore();
    }
    const shadeGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
    shadeGrad.addColorStop(0, 'rgba(3,10,17,0)');
    shadeGrad.addColorStop(1, 'rgba(3,10,17,.72)');
    ctx.fillStyle = shadeGrad; ctx.fillRect(0, 0, w, h);
  }

  /* ---------------- Paneles ---------------- */
  function syncWorldPosition() {
    if (!state || !window.World.isActive()) return;
    const p = window.World.getPlayer();
    const ws = window.World.getState ? window.World.getState() : null;
    if (p) state.worldPos = { x: p.x, y: p.y };
    if (ws) {
      state.timeMinutes = ws.timeMinutes;
      state.day = ws.day;
    }
  }

  function pauseWorldForPanel() {
    if (currentScreen === 'world' && window.World.isActive()) {
      panelReturnMode = 'world';
      syncWorldPosition();
      window.World.pause();
      saveGame(true);
    } else if (currentScreen === 'world3d' && window.Konoha3D && window.Konoha3D.isActive()) {
      panelReturnMode = 'world3d';
      syncWorld3DPosition();
      window.Konoha3D.pause();
      saveGame(true);
    }
  }

  function openStoryPanel() {
    if (!state) return;
    pauseWorldForPanel();
    closeDetailSheet('arc-detail');
    if (!selectedArcId) {
      const next = window.Story.nextArc(state);
      selectedArcId = next ? next.id : D.ARCS_P1[0].id;
      storyPart = selectedArcId.indexOf('p2') === 0 ? 'p2' : 'p1';
    }
    showScreen('story');
    renderStory();
  }

  function openMissions(rank) {
    if (!state) return;
    pauseWorldForPanel();
    closeDetailSheet('mission-detail');
    if (rank && D.RANKS[rank]) missionFilter = rank;
    if (!missionFilter) missionFilter = 'all';
    const list = filteredMissions();
    if (!selectedMissionId || !list.some(function (m) { return m.id === selectedMissionId; })) {
      selectedMissionId = list.length ? list[0].id : null;
    }
    showScreen('missions');
    renderMissions();
  }

  function openJournal() {
    if (!state) return;
    pauseWorldForPanel();
    showScreen('journal');
    renderJournal();
  }

  function openCodex(from) {
    codexReturn = from || currentScreen;
    if (currentScreen === 'world' || currentScreen === 'world3d') pauseWorldForPanel();
    showScreen('codex');
    renderCodex();
  }

  function openSettings(from) {
    settingsReturn = from || (currentScreen === 'settings' ? 'boot' : currentScreen);
    showScreen('settings');
    populateSettings();
  }

  function openCredits(from) {
    creditsReturn = from || currentScreen;
    if (currentScreen === 'world' || currentScreen === 'world3d') pauseWorldForPanel();
    showScreen('credits');
    drawCredits();
  }

  function panelBack(target) {
    safeSfx('back');
    if (target === 'world') {
      if (!state) { showScreen('boot'); return; }
      if (panelReturnMode === 'world3d') {
        showScreen('world3d');
        updateWorldHUD();
        updateQuestTracker();
        if (window.Konoha3D && window.Konoha3D.isActive()) window.Konoha3D.resume();
        else startKonoha3D({ demo: !!state.demo });
        safePlayTrack('village');
        return;
      }
      showScreen('world');
      updateWorldHUD();
      updateQuestTracker();
      if (window.World.isActive()) window.World.resume();
      else startOrResumeWorld(state.mode === 'training' ? 'training' : 'academy');
      return;
    }
    if (target === 'boot') { showScreen('boot'); return; }
    if (target === 'select') { openSelect(pendingMode); return; }
    if (target === 'create') { openCreate(); return; }
    showScreen(target);
  }

  /* ---------------- Arcos ---------------- */
  function isMobilePanel() {
    return !!(window.matchMedia && window.matchMedia('(max-width: 900px)').matches);
  }

  function openDetailSheet(id) {
    const node = $(id);
    if (node) node.classList.add('open');
  }

  function closeDetailSheet(id) {
    const node = $(id);
    if (node) node.classList.remove('open');
  }

  function filteredArcs() {
    const part = storyPart === 'p2' ? D.ARCS_P2 : D.ARCS_P1;
    return part.filter(function (a) { return arcFilter === 'all' || a.rank === arcFilter; });
  }

  function arcCompleted(id) {
    return !!(state && state.progress.arcs.indexOf(id) >= 0);
  }

  function renderStory() {
    if (!state) return;
    const prog = window.Story.arcProgress(state);
    const total = D.ARCS_P1.length + D.ARCS_P2.length;
    const done = prog.p1 + prog.p2;
    const storyProgress = $('story-progress');
    if (storyProgress) storyProgress.textContent = done + ' / ' + total + ' ARCOS';
    const p1 = $('p1-progress'), p2 = $('p2-progress');
    if (p1) p1.textContent = Math.round(prog.p1 / D.ARCS_P1.length * 100) + '%';
    if (p2) p2.textContent = Math.round(prog.p2 / D.ARCS_P2.length * 100) + '%';
    $$('[data-part-pct="p1"]').forEach(function (node) { node.textContent = Math.round(prog.p1 / D.ARCS_P1.length * 100) + '%'; });
    $$('[data-part-pct="p2"]').forEach(function (node) { node.textContent = Math.round(prog.p2 / D.ARCS_P2.length * 100) + '%'; });
    $$('#screen-story .story-part').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.part === storyPart);
    });
    $$('#arc-filters button').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.rank === arcFilter);
    });
    let list = filteredArcs();
    if (!selectedArcId || !list.some(function (a) { return a.id === selectedArcId; })) {
      selectedArcId = list.length ? list[0].id : null;
    }
    const arcList = $('arc-list');
    if (arcList) {
      if (!list.length) {
        arcList.innerHTML = '<div class="dd-empty">No hay arcos con este filtro.</div>';
      } else {
        arcList.innerHTML = list.map(function (arc) {
          const rank = D.RANKS[arc.rank] || D.RANKS.D;
          const isDone = arcCompleted(arc.id);
          return '<button class="arc-card ' + (selectedArcId === arc.id ? 'active' : '') + '" data-arc="' + escapeHTML(arc.id) + '" style="--rank-color:' + rank.color + '">' +
            '<div class="arc-card-top"><span class="arc-id">ARCO ' + String(window.Story.arcNumber(arc)).padStart(2, '0') + ' · ' + (arc.id.indexOf('p1') === 0 ? 'NARUTO' : 'SHIPPUDEN') + '</span>' +
            '<span class="badge-rank">' + arc.rank + '</span></div>' +
            '<h4>' + escapeHTML(arc.name) + '</h4>' +
            '<p>' + escapeHTML(arc.summary) + '</p>' +
            '<div class="arc-meta"><span>NIVEL REC. ' + window.Story.recommendedLevel(arc) + '</span>' +
            (isDone ? '<span class="arc-check">✓ COMPLETADO</span>' : '<b>' + rank.label.toUpperCase() + '</b>') + '</div>' +
            '</button>';
        }).join('');
      }
    }
    const count = $('arc-count');
    if (count) count.textContent = list.length + ' arcos' + (arcFilter === 'all' ? '' : ' · RANGO ' + arcFilter);
    renderArcDetail();
  }

  function renderArcDetail() {
    const box = $('arc-detail');
    if (!box) return;
    const arc = selectedArcId ? window.Story.getArc(selectedArcId) : null;
    if (!arc) {
      box.innerHTML = '<div class="dd-empty">Selecciona un arco para ver el expediente.</div>';
      return;
    }
    const rank = D.RANKS[arc.rank] || D.RANKS.D;
    const boss = D.ENEMIES[arc.boss] || null;
    const reward = window.Story.arcReward(arc, arcCompleted(arc.id));
    const recommended = window.Story.recommendedLevel(arc);
    const low = state.profile.level < recommended;
    const chars = (arc.chars || []).map(function (c) { return '<span>' + escapeHTML(c) + '</span>'; }).join('');
    box.innerHTML =
      '<button class="dd-close" data-close-detail="arc-detail">✕ CERRAR</button>' +
      '<span class="dd-kicker">EXPEDIENTE DE ARCO · ' + escapeHTML(rank.label.toUpperCase()) + '</span>' +
      '<h3 class="dd-title">' + escapeHTML(arc.name) + '</h3>' +
      '<div class="dd-sub">ARCO ' + String(window.Story.arcNumber(arc)).padStart(2, '0') + ' · EPISODIOS ' + escapeHTML(arc.eps || '—') + '</div>' +
      '<p class="dd-summary">' + escapeHTML(arc.summary) + '</p>' +
      '<div class="dd-block"><div class="dd-block-title">PERSONAJES CLAVE</div><div class="dd-chars">' + chars + '</div></div>' +
      '<div class="dd-block"><div class="dd-block-title">INFORME DE COMBATE</div>' +
      '<div class="dd-row"><span>Rango</span><b style="color:' + rank.color + '">' + arc.rank + ' · ' + rank.label + '</b></div>' +
      '<div class="dd-row"><span>Nivel recomendado</span><b style="color:' + (low ? 'var(--danger)' : 'var(--text)') + '">' + recommended + (low ? ' · RIESGO' : '') + '</b></div>' +
      '<div class="dd-row"><span>Recompensa</span><b>' + fmtNum(reward.xp) + ' EXP · ₽' + fmtNum(reward.ryo) + '</b></div>' +
      '<div class="dd-row"><span>Estado</span><b>' + (arcCompleted(arc.id) ? 'Completado' : 'Pendiente') + '</b></div></div>' +
      (boss ? '<div class="dd-block"><div class="dd-block-title">OBJETIVO FINAL</div><div class="dd-boss"><canvas width="108" height="108"></canvas><div><b>' + escapeHTML(boss.name) + '</b><span>JEFE DEL ARCO</span></div></div></div>' : '') +
      '<div class="dd-actions"><button class="btn btn-primary" data-start-arc="' + escapeHTML(arc.id) + '">' + (arcCompleted(arc.id) ? 'REPETIR ARCO' : 'COMENZAR ARCO') + ' <span>›</span></button>' +
      '<div class="dd-level">' + (low ? 'Tu nivel es inferior al recomendado. Puedes intentarlo, pero el combate será exigente.' : 'Tu nivel está preparado para este arco.') + '</div></div>';
    const canvas = box.querySelector('.dd-boss canvas');
    if (canvas && boss) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const g = ctx.createRadialGradient(54, 54, 2, 54, 54, 58);
      g.addColorStop(0, 'rgba(255,194,71,.18)'); g.addColorStop(1, 'rgba(4,14,24,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(54, 103);
      ctx.scale(0.9, 0.9);
      window.Art.character(ctx, boss.art || { skin: '#e8c4a0', outfit: '#4b4a56' }, 0, 0, 1, { time: 0, facing: 1 });
      ctx.restore();
    }
  }

  function beginArc(id) {
    const arc = window.Story.getArc(id);
    if (!arc || !state) return;
    closeDetailSheet('arc-detail');
    const repeat = arcCompleted(id);
    const config = window.Story.buildBattle(arc, state.profile, repeat);
    startPreparedBattle(config, 'CRÓNICAS DE LA HOJA · RANGO ' + arc.rank);
  }

  /* ---------------- Misiones ---------------- */
  function filteredMissions() {
    return D.MISSIONS.filter(function (m) { return missionFilter === 'all' || m.rank === missionFilter; });
  }

  function missionCompleted(id) {
    return !!(state && state.progress.missions.indexOf(id) >= 0);
  }

  function missionTypeName(type, icon) {
    if (type === 'collect') return 'RECOLECCIÓN';
    if (type === 'boss') return 'OBJETIVO';
    return 'COMBATE';
  }

  function renderMissions() {
    if (!state) return;
    const list = filteredMissions();
    const done = state.progress.missions.length;
    const total = D.MISSIONS.length;
    const progress = $('mission-progress');
    if (progress) progress.textContent = done + ' / ' + total + ' COMPLETADAS';
    $$('#mission-filters button').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.rank === missionFilter);
    });
    if (!selectedMissionId || !list.some(function (m) { return m.id === selectedMissionId; })) {
      selectedMissionId = list.length ? list[0].id : null;
    }
    const node = $('mission-list');
    if (node) {
      if (!list.length) node.innerHTML = '<div class="dd-empty">No hay misiones disponibles con este filtro.</div>';
      else {
        node.innerHTML = list.map(function (m) {
          const rank = D.RANKS[m.rank] || D.RANKS.D;
          const isDone = missionCompleted(m.id);
          return '<button class="mission-card ' + (selectedMissionId === m.id ? 'active' : '') + '" data-mission="' + escapeHTML(m.id) + '" style="--rank-color:' + rank.color + '">' +
            '<span class="mission-rank">' + m.rank + '</span>' +
            '<div class="mc-body"><h4>' + escapeHTML(m.title) + '</h4><p>' + escapeHTML(m.desc) + '</p>' +
            '<div class="mc-tags"><span>' + escapeHTML(missionTypeName(m.type, m.icon)) + '</span><span>' + escapeHTML(m.location) + '</span></div></div>' +
            '<div class="mc-side"><b>₽ ' + fmtNum(m.reward.ryo) + '</b><span>' + fmtNum(m.reward.xp) + ' XP</span>' +
            (isDone ? '<span class="mission-done">✓ HECHA</span>' : '<span>' + rank.label + '</span>') + '</div></button>';
        }).join('');
      }
    }
    const count = $('mission-count');
    if (count) count.textContent = list.length + ' misiones' + (missionFilter === 'all' ? '' : ' · RANGO ' + missionFilter);
    renderMissionDetail();
  }

  function renderMissionDetail() {
    const box = $('mission-detail');
    if (!box) return;
    const m = selectedMissionId ? window.Story.missionById(selectedMissionId) : null;
    if (!m) {
      box.innerHTML = '<div class="dd-empty">Acepta una misión del tablero.</div>';
      return;
    }
    const rank = D.RANKS[m.rank] || D.RANKS.D;
    const boss = m.boss ? D.ENEMIES[m.boss] : null;
    const enemies = (m.enemies || []).map(function (id) { return D.ENEMIES[id] ? D.ENEMIES[id].name : id; });
    if (boss) enemies.push(boss.name + ' (jefe)');
    const done = missionCompleted(m.id);
    box.innerHTML =
      '<button class="dd-close" data-close-detail="mission-detail">✕ CERRAR</button>' +
      '<span class="dd-kicker">TABLERO DE MISIONES · RANGO ' + m.rank + '</span>' +
      '<h3 class="dd-title">' + escapeHTML(m.title) + '</h3>' +
      '<div class="dd-sub">' + escapeHTML(m.location) + ' · ' + escapeHTML(rank.label.toUpperCase()) + '</div>' +
      '<p class="dd-summary">' + escapeHTML(m.desc) + '</p>' +
      '<div class="dd-block"><div class="dd-block-title">DETALLES DEL ENCARGO</div>' +
      '<div class="dd-row"><span>Cliente</span><b>' + escapeHTML(m.giver) + '</b></div>' +
      '<div class="dd-row"><span>Tipo</span><b>' + escapeHTML(missionTypeName(m.type, m.icon)) + '</b></div>' +
      '<div class="dd-row"><span>Objetivo</span><b>' + (m.type === 'collect' ? 'Recoge ' + (m.goal || 3) + ' objetos' : 'Derrota a los enemigos') + '</b></div>' +
      '<div class="dd-row"><span>Recompensa</span><b>' + fmtNum(m.reward.xp) + ' EXP · ₽' + fmtNum(m.reward.ryo) + '</b></div>' +
      '<div class="dd-row"><span>Estado</span><b>' + (done ? 'Completada' : 'Disponible') + '</b></div></div>' +
      (enemies.length ? '<div class="dd-block"><div class="dd-block-title">AMENAZAS</div><div class="dd-chars">' + enemies.map(function (n) { return '<span>' + escapeHTML(n) + '</span>'; }).join('') + '</div></div>' : '') +
      (boss ? '<div class="dd-block"><div class="dd-block-title">JEFE DE LA MISIÓN</div><div class="dd-boss"><canvas width="108" height="108"></canvas><div><b>' + escapeHTML(boss.name) + '</b><span>OBJETIVO PRIORITARIO</span></div></div></div>' : '') +
      '<div class="dd-actions"><button class="btn btn-primary" data-start-mission="' + escapeHTML(m.id) + '">' + (done ? 'REPETIR MISIÓN' : 'ACEPTAR MISIÓN') + ' <span>›</span></button>' +
      '<div class="dd-level">' + (done ? 'Las repeticiones otorgan el 25% de la recompensa original.' : 'Puedes aceptar esta misión aunque tu nivel sea bajo.') + '</div></div>';
    const canvas = box.querySelector('.dd-boss canvas');
    if (canvas && boss) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const g = ctx.createRadialGradient(54, 54, 2, 54, 54, 58);
      g.addColorStop(0, 'rgba(255,194,71,.18)'); g.addColorStop(1, 'rgba(4,14,24,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save(); ctx.translate(54, 103); ctx.scale(0.9, 0.9);
      window.Art.character(ctx, boss.art || { skin: '#e8c4a0', outfit: '#4b4a56' }, 0, 0, 1, { time: 0, facing: 1 });
      ctx.restore();
    }
  }

  function beginMission(id) {
    const mission = window.Story.missionById(id);
    if (!mission || !state) return;
    closeDetailSheet('mission-detail');
    const repeat = missionCompleted(id);
    const config = window.Story.buildMissionBattle(mission, state.profile, repeat);
    startPreparedBattle(config, 'TABLERO DE LA TORRE · RANGO ' + mission.rank);
  }

  /* ---------------- Diario ---------------- */
  function renderJournal() {
    if (!state) return;
    const p = state.profile;
    const rank = rankData(p.rank);
    const prog = window.Story.arcProgress(state);
    const journalRank = $('journal-rank');
    if (journalRank) journalRank.textContent = rank.name.toUpperCase() + ' DE LA HOJA · NIVEL ' + p.level;
    const name = $('journal-name');
    if (name) name.textContent = p.name;
    const clan = $('journal-clan');
    if (clan) clan.textContent = (p.clanName || clanData(p.clan).name).toUpperCase();
    const num = $('journal-number');
    if (num) num.textContent = p.idNumber || '000000';
    const village = $('journal-village');
    if (village) village.textContent = 'KONOHA';
    const bandanaRank = $('journal-bandana-rank');
    if (bandanaRank) bandanaRank.textContent = rank.name.toUpperCase();
    drawJournalPortrait();
    drawJournalBandana();
    const stats = $('journal-stats');
    if (stats) {
      const medals = journalMedalData();
      const unlocked = medals.filter(function (m) { return m.unlocked; }).length;
      stats.innerHTML =
        '<div class="jstat"><span>NIVEL</span><b>' + p.level + '</b><small>' + fmtNum(p.xp) + ' / ' + fmtNum(D.LEVEL_XP(p.level)) + ' XP</small></div>' +
        '<div class="jstat"><span>RYŌ</span><b>₽' + fmtNum(p.ryo) + '</b><small>Fortuna shinobi</small></div>' +
        '<div class="jstat"><span>VICTORIAS</span><b>' + state.stats.victories + '</b><small>' + state.stats.defeats + ' derrotas</small></div>' +
        '<div class="jstat"><span>ARCOS</span><b>' + (prog.p1 + prog.p2) + '</b><small>de ' + (D.ARCS_P1.length + D.ARCS_P2.length) + '</small></div>' +
        '<div class="jstat"><span>MEDALLAS</span><b>' + unlocked + '</b><small>de ' + medals.length + '</small></div>';
    }
    const progress = $('journal-progress');
    if (progress) {
      const collect = state.progress.collectibles.length;
      progress.innerHTML = [
        ['Parte I · Naruto', prog.p1, D.ARCS_P1.length],
        ['Parte II · Shippuden', prog.p2, D.ARCS_P2.length],
        ['Misiones completadas', state.progress.missions.length, D.MISSIONS.length],
        ['Secretos de Konoha', collect, 14],
        ['Nivel de shinobi', p.level, D.MAX_LEVEL]
      ].map(function (row) {
        return '<div class="progress-row"><span>' + row[0] + '</span><b>' + row[1] + ' / ' + row[2] + '</b><div class="pb"><i style="width:' + clamp(row[1] / row[2] * 100, 0, 100) + '%"></i></div></div>';
      }).join('');
    }
    const history = $('journal-history');
    if (history) {
      const records = state.progress.history.slice(0, 6);
      if (!records.length) history.innerHTML = '<div class="history-empty">Todavía no hay hazañas. Habla con Iruka y empieza tu primera misión.</div>';
      else {
        history.innerHTML = records.map(function (h) {
          const rank = D.RANKS[h.rank] || D.RANKS.D;
          return '<div class="history-item" style="--rank-color:' + rank.color + '"><i>' + escapeHTML(h.rank || 'D') + '</i><div><b>' + escapeHTML(h.title) + '</b><span>' + escapeHTML(h.detail || '') + '</span></div></div>';
        }).join('');
      }
    }
    const medals = journalMedalData();
    const count = $('journal-medals-count');
    if (count) count.textContent = medals.filter(function (m) { return m.unlocked; }).length + ' / ' + medals.length;
    const medalNode = $('journal-medals');
    if (medalNode) {
      medalNode.innerHTML = medals.map(function (m) {
        return '<div class="medal ' + (m.unlocked ? '' : 'locked') + '"><div class="medal-icon">' + m.icon + '</div><div><b>' + escapeHTML(m.name) + '</b><span>' + escapeHTML(m.desc) + '</span></div></div>';
      }).join('');
    }
  }

  function drawJournalBandana() {
    const canvas = $('journal-bandana');
    if (!canvas || !state) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const g = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 8, canvas.width / 2, canvas.height / 2, canvas.width * 0.5);
    g.addColorStop(0, 'rgba(255,194,71,.14)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
    window.Art.bandana(ctx, canvas.width / 2, canvas.height / 2 + 8, canvas.width * 0.72, { rank: state.profile.rank, village: 'konoha' });
  }

  function journalMedalData() {
    if (!state) return [];
    const p = state.profile;
    const arcCount = state.progress.arcs.length;
    const collect = state.progress.collectibles.length;
    return [
      { icon: '忍', name: 'Primeros pasos', desc: 'Completa tu primera misión', unlocked: state.progress.missions.length >= 1 },
      { icon: '火', name: 'Voluntad de Fuego', desc: 'Alcanza el rango Chūnin', unlocked: p.level >= 4 },
      { icon: '勝', name: 'Veterano', desc: 'Gana 10 combates', unlocked: state.stats.victories >= 10 },
      { icon: '巻', name: 'Cronista', desc: 'Completa 10 arcos', unlocked: arcCount >= 10 },
      { icon: '葉', name: 'Coleccionista', desc: 'Encuentra los 14 secretos', unlocked: collect >= 14 },
      { icon: '影', name: 'Leyenda de la Hoja', desc: 'Completa los 56 arcos', unlocked: arcCount >= 56 }
    ];
  }

  /* ---------------- Códice ---------------- */
  let codexTab = 'village';

  function renderCodex() {
    const pins = $('codex-pins');
    if (pins) {
      pins.innerHTML = D.VILLAGES.map(function (v) {
        const pos = VILLAGE_POSITIONS[v.id] || { x: 50, y: 50 };
        const available = v.id === 'konoha';
        return '<button class="map-pin ' + (available ? 'available' : 'locked') + '" data-village="' + v.id + '" title="' + escapeHTML(v.name) + '" style="left:' + pos.x + '%;top:' + pos.y + '%;background:none;border:0;padding:0;position:absolute">' +
          '<span class="pin-dot"></span><span>' + escapeHTML(v.short || v.name) + '</span></button>';
      }).join('');
    }
    const list = $('codex-village-list');
    if (list) {
      list.innerHTML = D.VILLAGES.map(function (v) {
        const available = v.id === 'konoha';
        return '<div class="codex-village-item ' + (available ? 'available' : 'locked') + '"><i style="background:' + (available ? '#ffc247' : '#7a8a9a') + '"></i><span>' + escapeHTML(v.short || v.name) + '</span><b style="margin-left:auto;font-size:8px;color:' + (available ? '#7bd88f' : 'var(--dim)') + '">' + (available ? 'DISPONIBLE' : 'PRÓXIMAMENTE') + '</b></div>';
      }).join('');
    }
    const row = $('codex-bandana-canvases');
    if (row) {
      row.innerHTML = D.SHINOBI_RANKS.map(function (r) {
        return '<canvas width="188" height="76" data-bandana="' + r.id + '" title="Bandana de ' + escapeHTML(r.name) + '"></canvas>';
      }).join('');
      $$('canvas[data-bandana]', row).forEach(function (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);
        window.Art.bandana(ctx, 47, 19, 80, { rank: canvas.dataset.bandana, village: 'konoha' });
      });
    }
    const ranks = $('rank-codex-list');
    if (ranks) {
      const current = state ? state.profile.rank : null;
      ranks.innerHTML = D.SHINOBI_RANKS.map(function (r) {
        return '<div class="rank-card" style="' + (r.id === current ? 'border-color:rgba(255,194,71,.55);box-shadow:0 0 0 1px rgba(255,194,71,.12) inset' : '') + '">' +
          '<canvas width="600" height="200" data-rank-bandana="' + r.id + '"></canvas>' +
          '<h3>' + escapeHTML(r.name.toUpperCase()) + ' <span>' + escapeHTML(r.jp) + '</span></h3>' +
          '<p>' + escapeHTML(r.desc) + '</p>' +
          '<small>' + (r.id === 'genin' ? 'NIVEL 1 · INICIO' : 'ASCENSO AL NIVEL ' + D.RANK_LEVEL[r.id]) + (r.id === current ? ' · TU RANGO' : '') + '</small></div>';
      }).join('');
      $$('canvas[data-rank-bandana]', ranks).forEach(function (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);
        window.Art.bandana(ctx, 150, 52, 240, { rank: canvas.dataset.rankBandana, village: 'konoha' });
      });
    }
    $$('.codex-tabs button').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.codexTab === codexTab);
    });
    $$('.codex-panel').forEach(function (panel) {
      panel.classList.toggle('active', panel.id === 'codex-' + codexTab);
    });
  }

  function showCodexTab(tab) {
    if (!tab) return;
    codexTab = tab;
    renderCodex();
  }

  /* ---------------- Ajustes ---------------- */
  function populateSettings() {
    const music = $('set-music'), sfx = $('set-sfx');
    if (music) music.value = Math.round(settings.music * 100);
    if (sfx) sfx.value = Math.round(settings.sfx * 100);
    const musicVal = $('set-music-val'), sfxVal = $('set-sfx-val');
    if (musicVal) musicVal.textContent = Math.round(settings.music * 100) + '%';
    if (sfxVal) sfxVal.textContent = Math.round(settings.sfx * 100) + '%';
    const toggles = [['set-voice', 'voice'], ['set-tips', 'tips'], ['set-shake', 'shake'], ['set-touch', 'touch'], ['set-fast', 'fast'], ['set-low3d', 'low3d']];
    toggles.forEach(function (pair) {
      const node = $(pair[0]);
      if (node) node.checked = !!settings[pair[1]];
    });
    updateSaveInfo();
    const saveNow = $('btn-save-now');
    if (saveNow) saveNow.disabled = !state || !!(state && state.demo);
    const reset = $('btn-reset-save');
    if (reset) reset.disabled = !state && !loadSave();
  }

  function updateSaveInfo() {
    const node = $('save-info');
    if (!node) return;
    if (state && state.demo) {
      node.innerHTML = 'Estás explorando en <b style="color:var(--gold)">modo demo</b>.<br>La demo no modifica tu partida guardada. Crea un shinobi para conservar el progreso.';
      return;
    }
    const save = state ? normalizeState(JSON.parse(JSON.stringify(state))) : loadSave();
    if (!save) {
      node.innerHTML = 'No hay ninguna partida guardada.<br>Empieza una nueva historia para crear tu expediente shinobi.';
      return;
    }
    const p = save.profile;
    const prog = save.progress;
    node.innerHTML = '<b style="color:var(--gold)">' + escapeHTML(p.name) + '</b> · Nivel ' + p.level + ' · ' + rankData(p.rank).name + '<br>' +
      'Arcos: ' + prog.arcs.length + ' / 56 · Misiones: ' + prog.missions.length + ' / ' + D.MISSIONS.length + '<br>' +
      'Guardado: ' + formatDate(save.lastPlayed);
  }

  function resetSave() {
    showConfirm({
      kicker: 'ZONA DE PELIGRO',
      title: 'BORRAR PARTIDA',
      text: 'Se eliminarán tu personaje, todo tu progreso y tus estadísticas. Esta acción no se puede deshacer.',
      ok: 'BORRAR DEFINITIVAMENTE',
      cancel: 'CANCELAR',
      danger: true,
      onOk: function () {
        try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
        saveData = null;
        state = null;
        queuedRank = null;
        pendingReturnPos = null;
        worldStarted = false;
        world3dActive = false;
        battleReturn3d = false;
        mapReturn3d = false;
        try { window.World.stop(); } catch (e) {}
        try { window.Konoha3D.stop(true); } catch (e) {}
        try { window.Battle.stop(); } catch (e) {}
        hideAllModals();
        showScreen('boot');
        refreshContinue();
        updateSaveInfo();
        toast('Partida borrada. La Hoja espera un nuevo comienzo.', 'good', '✓');
      }
    });
  }

  function drawCredits() {
    const legal = $('credits-legal');
    if (legal) legal.textContent = D.CREDITS;
    const canvas = $('credits-emblem');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const g = ctx.createRadialGradient(75, 75, 4, 75, 75, 80);
    g.addColorStop(0, 'rgba(255,194,71,.2)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
    window.Art.symbol(ctx, 'leaf', 75, 75, 100, { color: '#ffc247' });
    ctx.strokeStyle = 'rgba(255,194,71,.3)';
    ctx.beginPath(); ctx.arc(75, 75, 66, 0, Math.PI * 2); ctx.stroke();
  }

  function startCreditsLoop() {
    startLoop('credits', function (t) {
      const canvas = $('credits-emblem');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const g = ctx.createRadialGradient(75, 75, 4, 75, 75, 84);
      g.addColorStop(0, 'rgba(255,194,71,' + (0.14 + 0.05 * Math.sin(t)) + ')');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(75, 75);
      ctx.rotate(Math.sin(t * 0.25) * 0.06);
      window.Art.symbol(ctx, 'leaf', 0, 0, 100, { color: '#ffc247' });
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,194,71,.3)';
      ctx.beginPath(); ctx.arc(75, 75, 66, t * 0.15, t * 0.15 + Math.PI * 1.4); ctx.stroke();
    });
  }

  /* ---------------- Modales ---------------- */
  function showModal(id) {
    const layer = $('modal-layer');
    if (!layer) return;
    $$('.modal', layer).forEach(function (modal) { modal.classList.add('hidden'); });
    const modal = $(id);
    if (modal) modal.classList.remove('hidden');
    layer.classList.remove('hidden');
  }

  function hideModal(id) {
    const modal = $(id);
    if (modal) modal.classList.add('hidden');
    const layer = $('modal-layer');
    if (layer) {
      const visible = $$('.modal', layer).some(function (m) { return !m.classList.contains('hidden'); });
      if (!visible) layer.classList.add('hidden');
    }
  }

  function hideAllModals() {
    const layer = $('modal-layer');
    if (layer) {
      $$('.modal', layer).forEach(function (modal) { modal.classList.add('hidden'); });
      layer.classList.add('hidden');
    }
  }

  function anyModalVisible() {
    const layer = $('modal-layer');
    return !!(layer && !layer.classList.contains('hidden'));
  }

  function showConfirm(opts) {
    opts = opts || {};
    const kicker = $('confirm-kicker'), title = $('confirm-title'), text = $('confirm-text');
    if (kicker) kicker.textContent = opts.kicker || 'CONFIRMAR';
    if (title) title.textContent = opts.title || '¿ESTÁS SEGURO?';
    if (text) {
      if (opts.html) text.innerHTML = opts.html;
      else text.textContent = opts.text || '';
    }
    const cancel = $('confirm-cancel'), ok = $('confirm-ok');
    if (cancel) {
      cancel.classList.toggle('hidden', opts.cancel === null);
      cancel.textContent = opts.cancel || 'CANCELAR';
    }
    if (ok) {
      ok.textContent = opts.ok || 'CONFIRMAR';
      ok.className = 'btn ' + (opts.danger ? 'btn-danger' : 'btn-primary');
    }
    confirmCallback = typeof opts.onOk === 'function' ? opts.onOk : null;
    confirmCancelCallback = typeof opts.onCancel === 'function' ? opts.onCancel : null;
    showModal('confirm-modal');
  }

  /* ---------------- Cutscene ---------------- */
  function playCutscene(beats, opts) {
    opts = opts || {};
    const list = (beats || []).filter(Boolean);
    if (!list.length) {
      if (opts.onDone) setTimeout(opts.onDone, 40);
      return;
    }
    hideAllModals();
    if (currentScreen === 'world' && window.World.isActive()) window.World.pause();
    currentCutscene = {
      beats: list,
      index: 0,
      chapter: opts.chapter || 'CRÓNICAS DE LA HOJA',
      auto: !!opts.auto,
      onDone: opts.onDone || null,
      finished: false,
      paused: false,
      typed: 0,
      total: 0,
      lastBlip: 0,
      hold: 0,
      start: performance.now(),
      history: []
    };
    showScreen('cutscene');
    safePlayTrack('story');
    const autoBtn = $('btn-cutscene-auto');
    if (autoBtn) {
      autoBtn.textContent = 'AUTO: ' + (currentCutscene.auto ? 'ON' : 'OFF');
      autoBtn.classList.toggle('active', currentCutscene.auto);
    }
    renderCutsceneBeat();
    startCutsceneLoop();
  }

  function getTitleHint() {
    let hint = $('cutscene-title-hint');
    if (!hint) {
      const card = $('cutscene-titlecard');
      if (!card) return null;
      hint = document.createElement('div');
      hint.id = 'cutscene-title-hint';
      hint.style.cssText = 'margin-top:18px;font-size:9px;letter-spacing:.28em;color:rgba(255,194,71,.75);font-weight:700;';
      card.appendChild(hint);
    }
    return hint;
  }

  function renderCutsceneBeat() {
    const cs = currentCutscene;
    if (!cs) return;
    const beat = cs.beats[cs.index];
    if (!beat) return;
    const titleCard = $('cutscene-titlecard');
    const dialogue = $('cutscene-dialogue');
    const chapter = $('cutscene-chapter');
    if (chapter) {
      chapter.textContent = (cs.chapter || 'CRÓNICAS DE LA HOJA') + (beat.chapter ? ' · ' + String(beat.chapter).toUpperCase() : '');
    }
    cs.hold = 0;
    cs.lastBlip = 0;
    const hint = getTitleHint();
    const autoBtn = $('btn-cutscene-auto');
    if (autoBtn) autoBtn.textContent = 'AUTO: ' + (cs.auto ? 'ON' : 'OFF');
    if (beat.type === 'title') {
      if (dialogue) dialogue.classList.add('hidden');
      if (titleCard) {
        titleCard.classList.remove('hidden');
        const kicker = $('cutscene-title-kicker');
        const text = $('cutscene-title-text');
        if (kicker) kicker.textContent = beat.kicker || 'KONOHA';
        if (text) text.textContent = beat.title || '';
        if (hint) hint.textContent = cs.auto ? 'AVANZANDO AUTOMÁTICAMENTE...' : (settings.touch ? 'TOCA LA PANTALLA PARA CONTINUAR' : 'HAZ CLIC O PULSA ENTER PARA CONTINUAR');
        titleCard.style.animation = 'none';
        void titleCard.offsetWidth;
        titleCard.style.animation = '';
      }
      cs.history.push({ speaker: 'TÍTULO', text: [beat.kicker, beat.title].filter(Boolean).join(' · ') });
      cs.typed = cs.total = 0;
    } else {
      if (titleCard) titleCard.classList.add('hidden');
      if (dialogue) dialogue.classList.remove('hidden');
      const speaker = $('cutscene-speaker');
      if (speaker) speaker.textContent = (beat.speaker || 'NARRADOR').toUpperCase();
      drawCutscenePortrait(beat);
      const textNode = $('cutscene-text');
      cs.total = (beat.text || '').length;
      cs.typed = settings.fast ? cs.total : 0;
      if (textNode) textNode.textContent = (beat.text || '').slice(0, Math.floor(cs.typed));
      if (autoBtn) autoBtn.textContent = 'AUTO: ' + (cs.auto ? 'ON' : 'OFF');
      cs.history.push({ speaker: beat.speaker || 'NARRADOR', text: beat.text || '' });
    }
    const progress = $('cutscene-progress');
    if (progress) {
      progress.innerHTML = cs.beats.map(function (_, i) {
        return '<i class="' + (i <= cs.index ? 'on' : '') + '"></i>';
      }).join('');
    }
    const next = $('btn-cutscene-next');
    if (next) next.innerHTML = cs.index >= cs.beats.length - 1 ? 'TERMINAR <span>›</span>' : 'CONTINUAR <span>›</span>';
  }

  function drawCutscenePortrait(beat) {
    const canvas = $('cutscene-portrait');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#183b4f'); g.addColorStop(0.7, '#0b2130'); g.addColorStop(1, '#061018');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    let key = beat.portrait || '';
    if (key && key.indexOf('/') >= 0) {
      key = key.split('/').pop().replace(/\.(png|jpg|webp|jpeg)$/i, '');
    }
    const img = key && window.Art.images ? window.Art.images[key] : null;
    if (img && img.complete && img.naturalWidth) {
      window.Art.portrait(ctx, key, 0, 0, w, h, 8);
      ctx.fillStyle = 'rgba(2,8,14,.08)'; ctx.fillRect(0, 0, w, h);
    } else {
      let art = null;
      if (D.CHAR_MAP[key]) art = D.CHAR_MAP[key].art;
      if (!art && D.ENEMIES[key]) art = D.ENEMIES[key].art;
      if (!art) {
        const name = String(beat.speaker || '').toLowerCase();
        if (name.indexOf('iruka') >= 0) art = { skin: '#e8c4a0', hair: '#2a2422', style: 'ponytail', outfit: '#3a5a52', outfit2: '#20342e', band: '#1c2b4a', accessory: 'scar' };
        else if (name.indexOf('hokage') >= 0 || name.indexOf('hiruzen') >= 0) art = { skin: '#e8c8a8', hair: '#e0e0e0', style: 'short', outfit: '#e8e2d8', outfit2: '#8a2a2a', band: '#1c2b4a', accessory: 'hat' };
        else art = { skin: '#e8c4a0', hair: '#2a2422', style: 'short', outfit: '#3a5a52', outfit2: '#20342e', band: '#1c2b4a' };
      }
      ctx.save();
      ctx.translate(w / 2, h * 0.94);
      ctx.scale(w / 180, h / 180);
      window.Art.character(ctx, art, 0, 0, 1, { time: 0, facing: 1 });
      ctx.restore();
    }
    const fade = ctx.createLinearGradient(0, h * 0.55, 0, h);
    fade.addColorStop(0, 'rgba(3,9,14,0)');
    fade.addColorStop(1, 'rgba(3,9,14,.7)');
    ctx.fillStyle = fade; ctx.fillRect(0, 0, w, h);
  }

  function startCutsceneLoop() {
    const canvas = $('cutscene-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const start = performance.now();
    startLoop('cutscene', function (_, dt) {
      const cs = currentCutscene;
      if (!cs || cs.finished) return;
      const beat = cs.beats[cs.index];
      if (!beat) return;
      const size = sizeCanvas(canvas, ctx);
      const t = (performance.now() - start) / 1000;
      window.Art.scene(ctx, beat.scene || 'village', size.w, size.h, t, beat.mood || 'neutral');
      // grano y viñeta cinematográfica
      ctx.save();
      ctx.globalAlpha = 0.025;
      for (let i = 0; i < 40; i++) {
        const x = (i * 167 + t * 80) % size.w;
        const y = (i * 83 + t * 31) % size.h;
        ctx.fillStyle = i % 2 ? '#ffffff' : '#000000';
        ctx.fillRect(x, y, 1.5, 1.5);
      }
      ctx.restore();
      if (beat.type !== 'title' && !cs.paused) {
        if (cs.typed < cs.total) {
          cs.typed = Math.min(cs.total, cs.typed + dt * (settings.fast ? 220 : 54));
          const textNode = $('cutscene-text');
          if (textNode) textNode.textContent = (beat.text || '').slice(0, Math.floor(cs.typed));
          if (settings.voice && Math.floor(cs.typed) - cs.lastBlip >= 4) {
            cs.lastBlip = Math.floor(cs.typed);
            try { window.AudioEngine.blip(); } catch (e) {}
          }
        }
        if (cs.auto) {
          cs.hold += dt;
          const wait = cs.typed >= cs.total ? 2.2 : 4.4;
          if (cs.hold >= wait) advanceCutscene();
        }
      } else if (beat.type === 'title' && cs.auto && !cs.paused) {
        cs.hold += dt;
        if (cs.hold >= 3.2) advanceCutscene();
      }
    });
  }

  function advanceCutscene() {
    const cs = currentCutscene;
    if (!cs || cs.finished || cs.paused) return;
    const beat = cs.beats[cs.index];
    if (!beat) return;
    if (beat.type !== 'title' && cs.typed < cs.total) {
      cs.typed = cs.total;
      const textNode = $('cutscene-text');
      if (textNode) textNode.textContent = beat.text || '';
      safeSfx('click');
      return;
    }
    safeSfx('click');
    cs.index++;
    if (cs.index >= cs.beats.length) {
      finishCutscene();
      return;
    }
    renderCutsceneBeat();
  }

  function finishCutscene() {
    const cs = currentCutscene;
    if (!cs || cs.finished) return;
    cs.finished = true;
    const cb = cs.onDone;
    currentCutscene = null;
    stopLoops('cutscene');
    hideAllModals();
    safeSfx('confirm');
    if (typeof cb === 'function') {
      setTimeout(function () {
        try { cb(); } catch (e) { console.error(e); }
      }, 22);
    }
  }

  function showCutsceneLog() {
    const cs = currentCutscene;
    if (!cs) return;
    cs.paused = true;
    const html = cs.history.map(function (h) {
      return '<div style="margin-bottom:9px"><b style="color:#ffc247;font-size:9px;letter-spacing:.16em">' + escapeHTML(h.speaker) + '</b><br><span style="font-size:12px;line-height:1.5;color:#cfe4ef">' + escapeHTML(h.text) + '</span></div>';
    }).join('');
    showConfirm({
      kicker: 'REGISTRO DE DIÁLOGO',
      title: 'LO QUE SE HA DICHO',
      html: html || 'Todavía no hay líneas en el registro.',
      ok: 'CERRAR',
      cancel: null,
      onOk: function () {
        hideAllModals();
        if (currentCutscene) currentCutscene.paused = false;
      }
    });
  }

  function toggleCutsceneAuto() {
    if (!currentCutscene) return;
    currentCutscene.auto = !currentCutscene.auto;
    currentCutscene.hold = 0;
    const btn = $('btn-cutscene-auto');
    if (btn) btn.textContent = 'AUTO: ' + (currentCutscene.auto ? 'ON' : 'OFF');
    if (btn) btn.classList.toggle('active', currentCutscene.auto);
    safeSfx('click');
  }

  /* ---------------- Combate ---------------- */
  function startTraining(opponent) {
    if (!state) return;
    const config = window.Story.buildTrainingBattle(state.profile, opponent || 'kakashi');
    closeDialogue(false);
    startPreparedBattle(config, 'CAMPO DE ENTRENAMIENTO 3 · SPARRING');
  }

  function startPreparedBattle(config, chapter) {
    if (!state || !config) return;
    hideAllModals();
    const from3d = !!(window.Konoha3D && window.Konoha3D.isActive());
    battleReturn3d = from3d;
    if (from3d) {
      syncWorld3DPosition();
      pendingReturnPos = null;
      window.Konoha3D.stop(true);
      world3dActive = false;
      hideWorld3DPrompt();
    } else if (window.World.isActive()) {
      captureReturnPosition();
      window.World.stop();
    } else if (!pendingReturnPos) {
      captureReturnPosition();
    }
    worldStarted = false;
    if (pendingReturnPos) state.worldPos = { x: pendingReturnPos.x, y: pendingReturnPos.y };
    saveGame(true);
    if (config.intro && config.intro.length) {
      playCutscene(config.intro, {
        chapter: chapter || 'CRÓNICAS DE LA HOJA',
        onDone: function () { launchBattle(config); }
      });
    } else {
      launchBattle(config);
    }
  }

  function launchBattle(config) {
    if (!state) { showScreen('boot'); return; }
    hideAllModals();
    showScreen('battle');
    safePlayTrack('battle');
    window.Battle.start($('battle-canvas'), config, state.profile, {
      onEnd: function (result) { handleBattleEnd(result, config); },
      onPause: function (paused) {
        if (paused) showModal('pause-battle-modal');
        else hideAllModals();
      }
    });
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 60);
  }

  function handleBattleEnd(result, config) {
    if (!state) return;
    hideAllModals();
    const win = !!result.win;
    let rewards = null;
    if (win) {
      rewards = processVictory(config, result);
    } else {
      state.stats.defeats++;
      saveGame(true);
    }
    lastBattle = { config: config, result: result, win: win, rewards: rewards };
    showScreen('result');
    renderResult();
    safePlayTrack(win ? 'menu' : 'story');
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds || 0));
    const m = Math.floor(total / 60), s = total % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function renderResult() {
    if (!lastBattle) return;
    const config = lastBattle.config;
    const result = lastBattle.result;
    const win = lastBattle.win;
    const rank = D.RANKS[config.rank] || D.RANKS.D;
    const kicker = $('result-kicker'), rankNode = $('result-rank'), title = $('result-title'), subtitle = $('result-subtitle');
    const rewards = $('result-rewards'), stats = $('result-stats');
    const retry = $('btn-result-retry'), cont = $('btn-result-continue');
    if (kicker) kicker.textContent = win ? (config.kind === 'arc' ? 'CRÓNICA COMPLETADA' : config.kind === 'training' ? 'ENTRENAMIENTO COMPLETADO' : 'MISIÓN COMPLETADA') : 'DERROTA';
    if (rankNode) {
      rankNode.textContent = win ? config.rank : '✕';
      rankNode.style.color = win ? rank.color : 'var(--danger)';
      rankNode.style.textShadow = '0 0 50px ' + (win ? rank.color : '#ff4d5e') + '66';
    }
    if (title) title.textContent = win ? (config.kind === 'arc' ? 'LA LEYENDA CONTINÚA' : config.kind === 'training' ? 'BUEN COMBATE' : 'OBJETIVO CUMPLIDO') : 'CAÍSTE...';
    if (subtitle) {
      subtitle.textContent = win
        ? (config.kind === 'arc' ? 'Konoha recordará este capítulo de tu historia.' : config.kind === 'training' ? 'Has demostrado que la Voluntad del Fuego arde en ti.' : 'El cliente está a salvo y tu reputación crece.')
        : 'La Hoja no olvida a los suyos. Descansa, entrena y vuelve a intentarlo.';
    }
    if (rewards) {
      if (!win || !lastBattle.rewards) {
        rewards.innerHTML = '';
      } else {
        const pieces = ['<span class="reward-pill exp">+' + fmtNum(lastBattle.rewards.xp) + ' EXP</span>', '<span class="reward-pill">+₽' + fmtNum(lastBattle.rewards.ryo) + '</span>'];
        if (lastBattle.rewards.levels > 0) pieces.push('<span class="reward-pill exp">+' + lastBattle.rewards.levels + ' NIVEL</span>');
        if (lastBattle.rewards.rankUp) pieces.push('<span class="reward-pill">NUEVO RANGO</span>');
        if (config.kind === 'arc') pieces.push('<span class="reward-pill exp">CRÓNICA REGISTRADA</span>');
        rewards.innerHTML = pieces.join('');
      }
    }
    if (stats) {
      let rows = '<div><span>TIEMPO</span><b>' + formatTime(result.time) + '</b></div>' +
        '<div><span>COMBO MÁX.</span><b>' + (result.maxCombo || 0) + '</b></div>' +
        '<div><span>DERRIBADOS</span><b>' + (result.defeated || 0) + '</b></div>' +
        '<div><span>VIDA RESTANTE</span><b>' + Math.max(0, Math.round(result.hpLeft || 0)) + '</b></div>';
      if (config.objective && config.objective.type === 'collect') {
        rows += '<div><span>OBJETOS</span><b>' + (config.objective.goal || 3) + ' / ' + (config.objective.goal || 3) + '</b></div>';
      }
      stats.innerHTML = rows;
    }
    if (retry) retry.classList.toggle('hidden', win);
    if (cont) cont.innerHTML = 'VOLVER A KONOHA <span>›</span>';
  }

  function continueAfterResult() {
    if (!lastBattle) { returnToWorldAfterBattle(); return; }
    const ctx = lastBattle;
    safeSfx('confirm');
    const finishFlow = function () {
      if (ctx.win && ctx.config.outro && ctx.config.outro.length) {
        playCutscene(ctx.config.outro, {
          chapter: ctx.config.kind === 'arc' ? 'CRÓNICA COMPLETADA · ' + ctx.config.title.toUpperCase() : 'MISIÓN COMPLETADA',
          onDone: returnToWorldAfterBattle
        });
      } else {
        returnToWorldAfterBattle();
      }
    };
    if (ctx.win && queuedRank) {
      flushRankUp(finishFlow);
    } else {
      finishFlow();
    }
  }

  function retryBattle() {
    if (!lastBattle) return;
    const config = lastBattle.config;
    lastBattle = null;
    hideAllModals();
    launchBattle(config);
  }

  function returnToWorldAfterBattle() {
    if (!state) { showScreen('boot'); return; }
    lastBattle = null;
    hideAllModals();
    if (battleReturn3d) {
      battleReturn3d = false;
      saveGame(true);
      startKonoha3D({ demo: !!state.demo });
      setTimeout(function () {
        const q = computeQuest();
        if (q && state && state.mode === 'story' && state.progress.tutorialStage === 2) {
          toast('El Hokage te espera en la Torre. Tu expediente aguarda su sello.', 'exp', '巻');
        }
      }, 1200);
      return;
    }
    if (pendingReturnPos) state.worldPos = { x: pendingReturnPos.x, y: pendingReturnPos.y };
    saveGame(true);
    showScreen('world');
    updateWorldHUD();
    updateQuestTracker();
    startOrResumeWorld(state.mode === 'training' ? 'training' : 'academy');
    setTimeout(function () {
      const q = computeQuest();
      if (q && state.mode === 'story' && state.progress.tutorialStage === 2) {
        toast('El Hokage te espera en la Torre. Tu expediente aguarda su sello.', 'exp', '巻');
      }
    }, 900);
  }

  function retreatBattle() {
    showConfirm({
      kicker: 'ABANDONAR COMBATE',
      title: 'RETIRARSE',
      text: 'La misión quedará incompleta y no recibirás recompensas. ¿Quieres volver a Konoha?',
      ok: 'RETIRARSE',
      cancel: 'SEGUIR LUCHANDO',
      danger: true,
      onOk: function () {
        try { window.Battle.stop(); } catch (e) {}
        lastBattle = null;
        hideAllModals();
        returnToWorldAfterBattle();
      },
      onCancel: function () {
        if (currentScreen === 'battle' && window.Battle.activeGame()) {
          window.Battle.pause();
          showModal('pause-battle-modal');
        }
      }
    });
  }

  /* ---------------- Pausa y menú ---------------- */
  function openPause() {
    if (!state) return;
    if (currentScreen === 'world3d') {
      if (window.Konoha3D && window.Konoha3D.isActive()) {
        syncWorld3DPosition();
        window.Konoha3D.pause();
      }
      openWorld3DPause();
      safeSfx('click');
      return;
    }
    if (currentScreen !== 'world') return;
    if (window.World.isActive()) {
      syncWorldPosition();
      window.World.pause();
    }
    showModal('pause-modal');
    safeSfx('click');
  }

  function closePause(resume) {
    hideAllModals();
    if (resume) resumeWorldIfPaused();
  }

  function confirmMainMenu(from) {
    const demo = !!(state && state.demo);
    showConfirm({
      kicker: 'VOLVER AL MENÚ',
      title: demo ? 'SALIR DE LA DEMO' : 'DEJAR LA HOJA',
      text: demo
        ? 'La exploración 3D desde el menú es una demo y no guarda progreso. ¿Quieres volver al menú principal?'
        : 'Tu progreso se guardará y podrás continuar después desde el menú principal. ¿Quieres salir?',
      ok: demo ? 'SALIR DE LA DEMO' : 'GUARDAR Y SALIR',
      cancel: 'SEGUIR JUGANDO',
      onOk: function () {
        if (state && !demo) saveGame(true);
        try { window.World.stop(); } catch (e) {}
        try { window.Konoha3D.stop(true); } catch (e) {}
        try { window.Battle.stop(); } catch (e) {}
        state = null;
        world3dActive = false;
        battleReturn3d = false;
        mapReturn3d = false;
        worldStarted = false;
        pendingReturnPos = null;
        queuedRank = null;
        lastBattle = null;
        hideAllModals();
        showScreen('boot');
        refreshContinue();
      },
      onCancel: function () {
        if (from === 'pause3d' && currentScreen === 'world3d') showModal('pause-3d-modal');
        else if (from === 'pause' && currentScreen === 'world') showModal('pause-modal');
        else if (from === 'battle' && currentScreen === 'battle') showModal('pause-battle-modal');
      }
    });
  }

  /* ---------------- Mapa ---------------- */
  function openWorldMap() {
    mapReturn3d = currentScreen === 'world3d';
    mapPausedWorld = currentScreen === 'world' && window.World.isActive();
    if (mapPausedWorld) {
      syncWorldPosition();
      window.World.pause();
    } else if (mapReturn3d && window.Konoha3D && window.Konoha3D.isActive()) {
      syncWorld3DPosition();
      window.Konoha3D.pause();
    }
    showModal('map-modal');
    drawActiveMap();
    safeSfx('click');
  }

  function closeWorldMap() {
    hideAllModals();
    if (mapPausedWorld || mapReturn3d) resumeWorldIfPaused();
    mapPausedWorld = false;
    mapReturn3d = false;
  }

  function drawActiveMap() {
    const canvas = $('big-map');
    if (!canvas) return;
    if (mapReturn3d) {
      try { drawWorld3DMap(canvas); } catch (e) { console.error(e); }
      return;
    }
    try { window.World.drawBigMap(canvas); } catch (e) { console.error(e); }
  }

  function drawWorld3DMap(canvas) {
    const stats = window.Konoha3D && window.Konoha3D.stats ? window.Konoha3D.stats() : null;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#10251a');
    bg.addColorStop(1, '#07130d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const span = 230;
    const pad = 46;
    const scale = Math.min((w - pad * 2) / span, (h - pad * 2) / span);
    const cx = w / 2, cy = h / 2;
    const px = function (x) { return cx + x * scale; };
    const pz = function (z) { return cy + z * scale; };

    ctx.strokeStyle = 'rgba(160, 210, 180, .08)';
    ctx.lineWidth = 1;
    for (let v = -100; v <= 100; v += 20) {
      ctx.beginPath(); ctx.moveTo(px(v), pz(-105)); ctx.lineTo(px(v), pz(105)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px(-105), pz(v)); ctx.lineTo(px(105), pz(v)); ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(200, 170, 110, .25)';
    ctx.lineWidth = 2;
    W3D_AREAS.forEach(function (area) {
      ctx.beginPath();
      ctx.moveTo(px(-27.7), pz(0.1));
      ctx.lineTo(px(area.x), pz(area.z));
      ctx.stroke();
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    W3D_AREAS.forEach(function (area) {
      ctx.fillStyle = 'rgba(255, 194, 71, .055)';
      ctx.strokeStyle = 'rgba(255, 194, 71, .28)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px(area.x), pz(area.z), Math.max(18, area.r * scale), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    /* Etiquetas con detección de solapes: el mapa queda legible en 3D. */
    const labelBoxes = [];
    function areaLabel(text, x, y) {
      ctx.font = '700 11px Rajdhani, sans-serif';
      const tw = ctx.measureText(text).width + 10;
      const th = 15;
      const candidates = [
        [x, y], [x, y - 16], [x, y + 16],
        [x - tw / 2 - 8, y], [x + tw / 2 + 8, y],
        [x, y - 32], [x, y + 32],
        [x - tw / 2 - 8, y - 16], [x + tw / 2 + 8, y + 16]
      ];
      let chosen = null;
      for (let i = 0; i < candidates.length; i++) {
        const box = {
          x: candidates[i][0] - tw / 2,
          y: candidates[i][1] - th / 2,
          w: tw, h: th
        };
        if (box.x < 4 || box.y < 4 || box.x + box.w > w - 4 || box.y + box.h > h - 4) continue;
        const overlap = labelBoxes.some(function (b) {
          return !(box.x + box.w < b.x || box.x > b.x + b.w || box.y + box.h < b.y || box.y > b.y + b.h);
        });
        if (!overlap) { chosen = { box: box, x: candidates[i][0], y: candidates[i][1] }; break; }
      }
      if (!chosen) {
        chosen = { box: { x: x - tw / 2, y: y - th / 2, w: tw, h: th }, x: x, y: y };
      }
      labelBoxes.push(chosen.box);
      ctx.fillStyle = 'rgba(4, 14, 20, .78)';
      ctx.fillRect(chosen.box.x, chosen.box.y, chosen.box.w, chosen.box.h);
      ctx.fillStyle = 'rgba(224, 238, 246, .9)';
      ctx.fillText(text, chosen.x, chosen.y + 0.5);
    }
    W3D_AREAS.forEach(function (area) {
      areaLabel(area.name, px(area.x), pz(area.z) - Math.max(18, area.r * scale) - 12);
    });

    if (stats) {
      const quest = computeQuest();
      const target = quest ? quest.targetNpc : null;
      stats.npcs.forEach(function (npc) {
        const isTarget = target === npc.id;
        ctx.fillStyle = isTarget ? '#ffc247' : 'rgba(102, 217, 255, .9)';
        ctx.beginPath();
        ctx.arc(px(npc.x), pz(npc.z), isTarget ? 6 : 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(4, 14, 20, .8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
      stats.scrolls.forEach(function (scroll) {
        if (scroll.collected) return;
        const x = px(scroll.x), z = pz(scroll.z);
        ctx.save();
        ctx.translate(x, z);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#ffd477';
        ctx.fillRect(-4.5, -4.5, 9, 9);
        ctx.strokeStyle = 'rgba(4, 14, 20, .85)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-4.5, -4.5, 9, 9);
        ctx.restore();
      });
      if (stats.player) {
        ctx.save();
        ctx.translate(px(stats.player.x), pz(stats.player.z));
        ctx.rotate(-(stats.player.rot || 0));
        ctx.fillStyle = '#ff8a2a';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(-8, 8);
        ctx.lineTo(0, 4);
        ctx.lineTo(8, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(4, 14, 20, .88)';
    ctx.fillRect(22, 22, 278, 40);
    ctx.fillStyle = '#ffc247';
    ctx.font = '700 19px Rajdhani, sans-serif';
    ctx.fillText('KONOHA 3D · MAPA TÁCTICO', 38, 47);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(200, 225, 238, .62)';
    ctx.font = '700 12px Rajdhani, sans-serif';
    ctx.fillText('● SHINOBI   ◆ PERGAMINO   ▲ TÚ', w - 30, h - 24);
    ctx.textAlign = 'left';
  }

  /* ---------------- Flujo de partida ---------------- */
  function returnToCreateScreen() {
    if (!createState) { openCreate(); return; }
    showScreen('create');
    renderCreate();
  }

  function closeCodex() {
    safeSfx('back');
    if (codexReturn === 'world3d' && state) {
      showScreen('world3d');
      updateWorldHUD();
      updateQuestTracker();
      if (window.Konoha3D && window.Konoha3D.isActive()) window.Konoha3D.resume();
      else startKonoha3D({ demo: !!state.demo });
      safePlayTrack('village');
      return;
    }
    if (codexReturn === 'world' && state) {
      showScreen('world');
      updateWorldHUD();
      updateQuestTracker();
      if (window.World.isActive()) window.World.resume();
      else startOrResumeWorld(state.mode === 'training' ? 'training' : 'academy');
      safePlayTrack('village');
    } else {
      showScreen('boot');
    }
  }

  function closeSettings() {
    safeSfx('back');
    const target = settingsReturn;
    if (target === 'battle' && currentScreen === 'battle') {
      hideAllModals();
      showModal('pause-battle-modal');
      return;
    }
    if (target === 'world3d' && state) {
      showScreen('world3d');
      updateWorldHUD();
      updateQuestTracker();
      if (window.Konoha3D && window.Konoha3D.isActive()) openWorld3DPause();
      else startKonoha3D({ demo: !!state.demo });
      return;
    }
    if (target === 'world' && state) {
      showScreen('world');
      updateWorldHUD();
      updateQuestTracker();
      if (window.World.isActive()) showModal('pause-modal');
      else startOrResumeWorld(state.mode === 'training' ? 'training' : 'academy');
      return;
    }
    showScreen('boot');
  }

  function closeCredits() {
    safeSfx('back');
    if (creditsReturn === 'world3d' && state) {
      showScreen('world3d');
      updateWorldHUD();
      updateQuestTracker();
      if (window.Konoha3D && window.Konoha3D.isActive()) window.Konoha3D.resume();
      else startKonoha3D({ demo: !!state.demo });
      safePlayTrack('village');
      return;
    }
    if (creditsReturn === 'world' && state) {
      showScreen('world');
      updateWorldHUD();
      updateQuestTracker();
      if (window.World.isActive()) window.World.resume();
      else startOrResumeWorld(state.mode === 'training' ? 'training' : 'academy');
      safePlayTrack('village');
    } else {
      showScreen('boot');
    }
  }

  function requestSkipCutscene() {
    if (!currentCutscene) return;
    currentCutscene.paused = true;
    showConfirm({
      kicker: 'SALTAR CUTSCENE',
      title: '¿OMITIR ESTA ESCENA?',
      text: 'Puedes saltar la escena para volver a la acción. No perderás ningún progreso.',
      ok: 'SALTAR ESCENA',
      cancel: 'SEGUIR VIENDO',
      onOk: function () { finishCutscene(); },
      onCancel: function () {
        hideAllModals();
        if (currentCutscene) currentCutscene.paused = false;
      }
    });
  }

  function closeTopModal() {
    const layer = $('modal-layer');
    if (!layer || layer.classList.contains('hidden')) return false;
    const visible = $$('.modal', layer).filter(function (m) { return !m.classList.contains('hidden'); });
    const top = visible[visible.length - 1];
    if (!top) { hideAllModals(); return false; }
    if (top.id === 'reward-modal') return false;
    if (top.id === 'confirm-modal') {
      const cancel = confirmCancelCallback;
      confirmCallback = null;
      confirmCancelCallback = null;
      hideAllModals();
      if (cancel) cancel();
      else if (currentCutscene) currentCutscene.paused = false;
      return true;
    }
    if (top.id === 'dialogue-modal') { closeDialogue(true); return true; }
    if (top.id === 'pause-modal') { closePause(true); return true; }
    if (top.id === 'pause-3d-modal') { closePause(true); return true; }
    if (top.id === 'pause-battle-modal') {
      hideAllModals();
      if (currentScreen === 'battle') window.Battle.resume();
      return true;
    }
    if (top.id === 'map-modal') { closeWorldMap(); return true; }
    hideAllModals();
    return true;
  }

  function continueGame() {
    unlockAudio();
    const loaded = loadSave();
    if (!loaded) {
      saveData = null;
      refreshContinue();
      toast('No hay una partida guardada para continuar.', 'bad', '!');
      safeSfx('error');
      return;
    }
    state = loaded;
    saveData = normalizeState(clone(loaded));
    pendingMode = state.mode;
    pendingReturnPos = null;
    queuedRank = null;
    lastBattle = null;
    worldStarted = false;
    const idx = D.CHARACTERS.map(function (c) { return c.id; }).indexOf(state.profile.baseId);
    selectedIndex = idx >= 0 ? idx : D.CHARACTERS.length;
    hideAllModals();
    const enterWorld = function () {
      if (!state) return;
      showScreen('world');
      updateWorldHUD();
      updateQuestTracker();
      startOrResumeWorld(state.mode === 'training' ? 'training' : 'academy');
      setTimeout(function () {
        if (currentScreen !== 'world' || !state) return;
        toast('Bienvenido de nuevo, ' + state.profile.name + '.', 'exp', '火');
      }, 700);
    };
    showTransition(function () {
      if (!state) return;
      if (!state.progress.introSeen) {
        const intro = window.Story.buildAcademyIntro(state.profile, state.mode);
        playCutscene(intro, {
          chapter: state.mode === 'training' ? 'CAMPO DE ENTRENAMIENTO 3 · PRÓLOGO' : 'ACADEMIA NINJA · PRÓLOGO',
          onDone: function () {
            if (!state) return;
            state.progress.introSeen = true;
            saveGame(true);
            enterWorld();
          }
        });
      } else {
        enterWorld();
      }
    });
  }

  function startNewStory(mode) {
    pendingMode = mode === 'training' ? 'training' : 'story';
    if (!saveData) {
      openSelect(pendingMode);
      return;
    }
    showConfirm({
      kicker: 'NUEVA PARTIDA',
      title: 'EMPEZAR DE CERO',
      text: 'Ya tienes una partida guardada. Si creas un nuevo shinobi y terminas la creación, la partida anterior será reemplazada. Tu progreso actual no se borrará hasta entonces.',
      ok: 'CREAR NUEVO SHINOBI',
      cancel: 'USAR PARTIDA GUARDADA',
      danger: true,
      onOk: function () { openSelect(pendingMode); },
      onCancel: function () { hideAllModals(); showScreen('boot'); }
    });
  }

  /* ---------------- Enlaces de interfaz ---------------- */
  function listen(id, event, fn) {
    const node = $(id);
    if (node) node.addEventListener(event, fn);
  }

  function delegate(root, selector, event, fn) {
    const node = typeof root === 'string' ? $(root) : root;
    if (!node) return;
    node.addEventListener(event, function (e) {
      const target = e.target && e.target.closest ? e.target.closest(selector) : null;
      if (!target || !node.contains(target)) return;
      fn(e, target);
    });
  }

  function bindUI() {
    /* Menú principal */
    listen('btn-continue', 'click', continueGame);
    listen('btn-story', 'click', function () { startNewStory('story'); });
    listen('btn-training', 'click', function () { startNewStory('training'); });
    listen('btn-world3d', 'click', function () {
      unlockAudio();
      safeSfx('confirm');
      startKonoha3D({ demo: true, reset: true });
    });
    listen('btn-codex', 'click', function () { openCodex('boot'); });
    listen('btn-settings', 'click', function () { openSettings('boot'); });
    listen('btn-credits', 'click', function () { openCredits('boot'); });

    /* Selección */
    listen('select-prev', 'click', function () { cycleSelect(-1); });
    listen('select-next', 'click', function () { cycleSelect(1); });
    listen('btn-select-confirm', 'click', function () { safeSfx('confirm'); openCreate(); });
    listen('btn-select-custom', 'click', function () {
      selectedIndex = rosterList().length - 1;
      safeSfx('confirm');
      renderSelected();
      openCreate();
    });
    delegate('roster-strip', '.roster-item', 'click', function (_, item) {
      selectedIndex = Number(item.dataset.index) || 0;
      safeSfx('click');
      renderSelected();
    });
    const strip = $('roster-strip');
    if (strip) {
      let wheelAt = 0;
      strip.addEventListener('wheel', function (e) {
        const now = Date.now();
        if (now - wheelAt < 140) return;
        wheelAt = now;
        e.preventDefault();
        cycleSelect(e.deltaY > 0 ? 1 : -1);
      }, { passive: false });
    }

    /* Creación */
    delegate('screen-create', '[data-create-tab]', 'click', function (_, btn) {
      const tab = btn.dataset.createTab;
      if (!tab || tab === createTab) return;
      createTab = tab;
      safeSfx('click');
      renderCreate();
    });
    delegate('create-rows', '.create-arrow', 'click', function (_, btn) {
      changeCreateRow(btn.dataset.key, Number(btn.dataset.dir) || 1);
    });
    delegate('create-rows', '.swatch', 'click', function (_, btn) {
      const row = currentCreateRows[Number(btn.dataset.swatch)];
      if (row) setCreateRowValue(row.key, Number(btn.dataset.value));
    });
    listen('btn-preview-left', 'click', function () {
      if (!createState) return;
      createState.facing = -1;
      safeSfx('click');
      renderCreate();
    });
    listen('btn-preview-right', 'click', function () {
      if (!createState) return;
      createState.facing = 1;
      safeSfx('click');
      renderCreate();
    });
    listen('btn-create-random', 'click', randomizeCreate);
    listen('btn-create-reset', 'click', resetCreate);
    listen('btn-create-back', 'click', function () {
      safeSfx('back');
      openSelect(pendingMode);
    });
    listen('btn-create-confirm', 'click', finishCreateAndChooseVillage);
    listen('input-name', 'input', function () {
      if (!createState) return;
      createState.name = this.value;
      const nameNode = $('create-badge-name');
      if (nameNode) nameNode.textContent = this.value.trim() || 'SIN NOMBRE';
    });
    listen('input-name', 'keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishCreateAndChooseVillage();
      }
    });

    /* Aldea natal */
    delegate('map-pins', '[data-village]', 'click', function (_, pin) { pickVillage(pin.dataset.village); });
    delegate('village-grid', '[data-village]', 'click', function (_, chip) { pickVillage(chip.dataset.village); });
    listen('btn-village-confirm', 'click', confirmVillage);

    /* Cutscene */
    listen('btn-cutscene-next', 'click', advanceCutscene);
    listen('btn-skip-cutscene', 'click', requestSkipCutscene);
    listen('btn-cutscene-log', 'click', showCutsceneLog);
    listen('btn-cutscene-auto', 'click', toggleCutsceneAuto);
    listen('cutscene-canvas', 'click', advanceCutscene);
    listen('cutscene-titlecard', 'click', advanceCutscene);

    /* Mundo abierto */
    listen('btn-world-3d', 'click', function () {
      safeSfx('confirm');
      enterWorld3DFromWorld();
    });
    listen('btn-world-story', 'click', openStoryPanel);
    listen('btn-world-missions', 'click', function () { openMissions('all'); });
    listen('btn-world-journal', 'click', openJournal);
    listen('btn-world-codex', 'click', function () { openCodex('world'); });
    listen('btn-world-menu', 'click', openPause);
    listen('btn-quest-collapse', 'click', function () {
      if (!state) return;
      state.questCollapsed = !state.questCollapsed;
      safeSfx('click');
      updateQuestTracker();
      saveGame(true);
    });

    /* Konoha 3D */
    listen('btn-w3d-story', 'click', openStoryPanel);
    listen('btn-w3d-missions', 'click', function () { openMissions('all'); });
    listen('btn-w3d-codex', 'click', function () { openCodex('world3d'); });
    listen('btn-w3d-view', 'click', cycleWorld3DView);
    listen('btn-w3d-menu', 'click', openPause);
    listen('btn-w3d-quest-collapse', 'click', function () {
      if (!state) return;
      state.questCollapsed = !state.questCollapsed;
      safeSfx('click');
      updateQuestTracker();
      saveGame(true);
    });
    listen('w3d-error-retry', 'click', retryKonoha3D);
    listen('w3d-error-back', 'click', exitKonoha3D);
    listen('btn-3d-resume', 'click', function () { closePause(true); });
    listen('btn-3d-save', 'click', function () {
      if (!state) return;
      if (state.demo) {
        toast('Modo demo: esta exploración no se guarda. Crea un shinobi para conservar tu progreso.', '', '3D');
        return;
      }
      saveGame(false);
    });
    listen('btn-3d-settings', 'click', function () {
      hideAllModals();
      openSettings('world3d');
    });
    listen('btn-3d-credits', 'click', function () {
      hideAllModals();
      openCredits('world3d');
    });
    listen('btn-3d-2d', 'click', exitKonoha3D);
    listen('btn-3d-menu', 'click', function () { confirmMainMenu('pause3d'); });

    /* Botones de vuelta de los paneles */
    $$('[data-back]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (currentScreen === 'codex') { closeCodex(); return; }
        if (currentScreen === 'village' && btn.dataset.back === 'create') {
          safeSfx('back');
          returnToCreateScreen();
          return;
        }
        panelBack(btn.dataset.back);
      });
    });

    /* Arcos */
    $$('#screen-story .story-part').forEach(function (btn) {
      btn.addEventListener('click', function () {
        storyPart = btn.dataset.part === 'p2' ? 'p2' : 'p1';
        selectedArcId = null;
        closeDetailSheet('arc-detail');
        safeSfx('click');
        renderStory();
      });
    });
    delegate('arc-filters', 'button', 'click', function (_, btn) {
      arcFilter = btn.dataset.rank || 'all';
      selectedArcId = null;
      closeDetailSheet('arc-detail');
      safeSfx('click');
      renderStory();
    });
    delegate('arc-list', '[data-arc]', 'click', function (_, card) {
      selectedArcId = card.dataset.arc;
      safeSfx('click');
      renderStory();
      if (isMobilePanel()) openDetailSheet('arc-detail');
    });
    delegate('arc-detail', '[data-start-arc]', 'click', function (_, btn) {
      beginArc(btn.dataset.startArc);
    });
    delegate('arc-detail', '[data-close-detail]', 'click', function () {
      safeSfx('back');
      closeDetailSheet('arc-detail');
    });

    /* Misiones */
    delegate('mission-filters', 'button', 'click', function (_, btn) {
      missionFilter = btn.dataset.rank || 'all';
      selectedMissionId = null;
      closeDetailSheet('mission-detail');
      safeSfx('click');
      renderMissions();
    });
    delegate('mission-list', '[data-mission]', 'click', function (_, card) {
      selectedMissionId = card.dataset.mission;
      safeSfx('click');
      renderMissions();
      if (isMobilePanel()) openDetailSheet('mission-detail');
    });
    delegate('mission-detail', '[data-start-mission]', 'click', function (_, btn) {
      beginMission(btn.dataset.startMission);
    });
    delegate('mission-detail', '[data-close-detail]', 'click', function () {
      safeSfx('back');
      closeDetailSheet('mission-detail');
    });

    /* Diario */
    listen('btn-journal-save', 'click', function () { saveGame(false); });
    listen('btn-journal-menu', 'click', function () { confirmMainMenu('journal'); });

    /* Códice */
    $$('.codex-tabs button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showCodexTab(btn.dataset.codexTab);
        safeSfx('click');
      });
    });
    delegate('codex-pins', '[data-village]', 'click', function (_, pin) {
      const village = D.VILLAGES.filter(function (v) { return v.id === pin.dataset.village; })[0];
      if (!village) return;
      safeSfx('click');
      toast(village.name + ' — ' + (village.id === 'konoha' ? 'Alcantarillado, ramen y Voluntad del Fuego.' : 'Próximamente en una futura actualización.'), village.id === 'konoha' ? 'exp' : '', village.id === 'konoha' ? '火' : '🔒');
    });

    /* Ajustes */
    [['set-music', 'music', 'set-music-val'], ['set-sfx', 'sfx', 'set-sfx-val']].forEach(function (spec) {
      const input = $(spec[0]);
      if (!input) return;
      input.addEventListener('input', function () {
        const value = clamp(Number(input.value) / 100, 0, 1);
        settings[spec[1]] = value;
        const label = $(spec[2]);
        if (label) label.textContent = Math.round(value * 100) + '%';
        saveSettings();
      });
    });
    [['set-voice', 'voice'], ['set-tips', 'tips'], ['set-shake', 'shake'], ['set-touch', 'touch'], ['set-fast', 'fast'], ['set-low3d', 'low3d']].forEach(function (spec) {
      const input = $(spec[0]);
      if (!input) return;
      input.addEventListener('change', function () {
        settings[spec[1]] = !!input.checked;
        saveSettings();
        applySettings();
        safeSfx('click');
      });
    });
    listen('btn-save-now', 'click', function () {
      if (!state) {
        toast('Todavía no hay una partida activa.', 'bad', '!');
        return;
      }
      saveGame(false);
      updateSaveInfo();
    });
    listen('btn-reset-save', 'click', resetSave);
    listen('btn-settings-back', 'click', closeSettings);

    /* Créditos */
    listen('btn-credits-back', 'click', closeCredits);

    /* Combate */
    listen('btn-battle-pause', 'click', function () {
      if (currentScreen !== 'battle' || !window.Battle.activeGame()) return;
      window.Battle.pause();
      showModal('pause-battle-modal');
      safeSfx('click');
    });
    listen('btn-battle-resume', 'click', function () {
      hideAllModals();
      window.Battle.resume();
      safeSfx('click');
    });
    listen('btn-battle-settings', 'click', function () {
      hideAllModals();
      openSettings('battle');
    });
    listen('btn-battle-retreat', 'click', retreatBattle);
    listen('btn-result-continue', 'click', continueAfterResult);
    listen('btn-result-retry', 'click', retryBattle);

    /* Pausa del mundo */
    listen('btn-pause-resume', 'click', function () { closePause(true); });
    listen('btn-pause-save', 'click', function () { saveGame(false); });
    listen('btn-pause-settings', 'click', function () {
      hideAllModals();
      openSettings('world');
    });
    listen('btn-pause-menu', 'click', function () { confirmMainMenu('pause'); });

    /* Modales */
    listen('dialogue-close', 'click', function () { closeDialogue(true); });
    listen('map-close', 'click', closeWorldMap);
    listen('confirm-ok', 'click', function () {
      const cb = confirmCallback;
      confirmCallback = null;
      confirmCancelCallback = null;
      hideAllModals();
      safeSfx('confirm');
      if (cb) cb();
    });
    listen('confirm-cancel', 'click', function () {
      const cb = confirmCancelCallback;
      confirmCallback = null;
      confirmCancelCallback = null;
      hideAllModals();
      safeSfx('back');
      if (cb) cb();
    });
    listen('reward-ok', 'click', function () {
      const cb = rankUpAfter;
      rankUpAfter = null;
      hideAllModals();
      safeSfx('confirm');
      if (cb) cb();
      else if (currentScreen === 'world' || currentScreen === 'world3d') resumeWorldIfPaused();
    });
  }

  /* ---------------- Teclado global ---------------- */
  function handleGlobalKey(e) {
    const target = e.target || {};
    const tag = (target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) return;
    unlockAudio();

    if (anyModalVisible()) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeTopModal();
      }
      return;
    }

    if (currentScreen === 'battle') return;

    if (currentScreen === 'cutscene') {
      if (e.key === 'Escape') {
        e.preventDefault();
        requestSkipCutscene();
      } else if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        advanceCutscene();
      }
      return;
    }

    if (currentScreen === 'result') {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        continueAfterResult();
      }
      return;
    }

    if (currentScreen === 'world3d') {
      if (e.key === 'Escape') {
        e.preventDefault();
        openPause();
        return;
      }
      const code = e.code;
      if (code === 'KeyV') { e.preventDefault(); cycleWorld3DView(); }
      else if (code === 'KeyH') { e.preventDefault(); openStoryPanel(); }
      else if (code === 'KeyM') { e.preventDefault(); openMissions('all'); }
      else if (code === 'KeyJ') { e.preventDefault(); openJournal(); }
      else if (code === 'KeyC') { e.preventDefault(); openCodex('world3d'); }
      return;
    }

    if (currentScreen === 'world') {
      if (e.key === 'Escape') {
        e.preventDefault();
        openPause();
        return;
      }
      const code = e.code;
      if (code === 'KeyV') { e.preventDefault(); enterWorld3DFromWorld(); }
      else if (code === 'KeyH') { e.preventDefault(); openStoryPanel(); }
      else if (code === 'KeyM') { e.preventDefault(); openMissions('all'); }
      else if (code === 'KeyJ') { e.preventDefault(); openJournal(); }
      else if (code === 'KeyC') { e.preventDefault(); openCodex('world'); }
      return;
    }

    if (currentScreen === 'select') {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault(); cycleSelect(-1);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault(); cycleSelect(1);
      } else if (e.key === 'Enter') {
        e.preventDefault(); safeSfx('confirm'); openCreate();
      } else if (e.key === 'Escape') {
        e.preventDefault(); safeSfx('back'); showScreen('boot');
      }
      return;
    }

    if (currentScreen === 'create') {
      if (e.key === 'Escape') {
        e.preventDefault(); safeSfx('back'); openSelect(pendingMode);
      }
      return;
    }

    if (currentScreen === 'village') {
      if (e.key === 'Enter') {
        e.preventDefault(); confirmVillage();
      } else if (e.key === 'Escape') {
        e.preventDefault(); safeSfx('back'); returnToCreateScreen();
      }
      return;
    }

    if (currentScreen === 'settings') {
      if (e.key === 'Escape') { e.preventDefault(); closeSettings(); }
      return;
    }
    if (currentScreen === 'codex') {
      if (e.key === 'Escape') { e.preventDefault(); closeCodex(); }
      return;
    }
    if (currentScreen === 'story' || currentScreen === 'missions' || currentScreen === 'journal') {
      if (e.key === 'Escape') { e.preventDefault(); panelBack('world'); }
      return;
    }
    if (currentScreen === 'credits') {
      if (e.key === 'Escape') { e.preventDefault(); closeCredits(); }
      return;
    }
    if (currentScreen === 'boot') {
      if (e.key === 'Enter' && bootLoaded) {
        e.preventDefault();
        if (saveData) continueGame();
        else startNewStory('story');
      }
    }
  }

  /* ---------------- Inicio ---------------- */
  function bindGlobalEvents() {
    document.addEventListener('pointerdown', unlockAudio, true);
    document.addEventListener('keydown', handleGlobalKey);
    window.addEventListener('beforeunload', function () {
      if (state) saveGame(true);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && state) saveGame(true);
    });
    window.addEventListener('resize', function () {
      const layer = $('modal-layer');
      const map = $('map-modal');
      if (layer && map && !layer.classList.contains('hidden') && !map.classList.contains('hidden')) {
        drawActiveMap();
      }
    });
  }

  function init() {
    if (document.body.dataset.gameReady === '1') return;
    document.body.dataset.gameReady = '1';
    try {
      if (!localStorage.getItem(SETTINGS_KEY) && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
        settings.touch = true;
      }
    } catch (e) {}
    applySettings();
    bindUI();
    bindGlobalEvents();
    hideAllModals();
    const menu = $('boot-menu');
    if (menu) menu.classList.add('hidden');
    const loading = $('boot-loading');
    if (loading) loading.classList.remove('hidden');
    refreshContinue();
    showScreen('boot');
    bootArtPreload();
    if (!saveTimer) {
      saveTimer = setInterval(function () { if (state) saveGame(true); }, 45000);
    }
  }

  init();

})();

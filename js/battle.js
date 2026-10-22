/* ============================================================
   NARUTO: SHINOBI LEGACY — Motor de combate
   Arena 2.5D, combos, jutsu, definitivas, jefes y objetivos.
   ============================================================ */
(function () {
  'use strict';

  const D = window.GameData;
  let game = null;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
  function rand(a, b) { return a + Math.random() * (b - a); }

  function BattleGame(canvas, config, player, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;
    this.playerData = player;
    this.callbacks = callbacks || {};
    this.w = 960; this.h = 540; this.dpr = 1;
    this.paused = false;
    this.finished = false;
    this.phase = 'intro';
    this.time = 0;
    this.runTime = 0;
    this.keys = {};
    this.attackQueued = false;
    this.waveIndex = -1;
    this.waveTimer = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.boss = null;
    this.enemies = [];
    this.projectiles = [];
    this.effects = [];
    this.telegraphs = [];
    this.pickups = [];
    this.orbs = [];
    this.afterimages = [];
    this.particles = [];
    this.shake = 0;
    this.flash = 0;
    this.cinematic = 0;
    this.cinematicName = '';
    this.maxCombo = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.damageDealt = 0;
    this.damageTaken = 0;
    this.defeatedCount = 0;
    this.messageTimer = 0;
    this.warningTimer = 0;
    this.slowmo = 0;
    this.touch = { dx: 0, dy: 0, active: false };
    this.result = null;
    this.raf = null;
    this.last = 0;
    this.bound = {};
    this.init();
  }

  BattleGame.prototype.init = function () {
    this.cacheHud();
    this.resize();
    this.createPlayer();
    this.spawnInitial();
    this.bindEvents();
    this.updateHudStatic();
    this.phase = 'fight';
    this.showMessage('¡COMIENZA EL COMBATE!', 1.4);
    window.AudioEngine.playTrack('battle');
    this.last = performance.now();
    const self = this;
    this.raf = requestAnimationFrame(function (t) { self.loop(t); });
  };

  BattleGame.prototype.cacheHud = function () {
    const $ = function (id) { return document.getElementById(id); };
    this.hud = {
      name: $('battle-player-name'), rank: $('battle-player-rank'),
      portrait: $('battle-portrait'),
      hp: $('battle-hp'), hpText: $('battle-hp-text'),
      chakra: $('battle-chakra'), chakraText: $('battle-chakra-text'),
      ult: $('battle-ult'), ultText: $('battle-ult-text'),
      kicker: $('battle-kicker'), title: $('battle-title'), subtitle: $('battle-subtitle'),
      bossWrap: $('battle-boss-wrap'), bossName: $('battle-boss-name'), bossHp: $('battle-boss-hp'),
      combo: $('battle-combo'), comboCount: $('battle-combo-count'),
      msg: $('battle-msg'), warning: $('battle-warning'),
      skill1: $('battle-skill-1'), skill2: $('battle-skill-2'), skill3: $('battle-skill-3'), skill4: $('battle-skill-4'),
      skill1Label: $('skill-1-label'), skill2Label: $('skill-2-label'), skill4Label: $('skill-4-label')
    };
  };

  BattleGame.prototype.createPlayer = function () {
    const p = this.playerData;
    const stats = p.stats || { nin: 5, tai: 5, gen: 3, spd: 5, def: 5 };
    const level = p.level || 1;
    const clan = D.CLANS.filter(function (c) { return c.id === p.clan; })[0];
    const bonus = (clan && clan.bonus) || {};
    this.player = {
      name: p.name || 'Shinobi',
      level: level,
      art: p.art,
      scale: 1.28 * (p.heightScale || 1),
      x: this.w / 2, y: this.h * 0.7,
      vx: 0, vy: 0, facing: 1, moving: false, walk: 0,
      maxHp: 110 + (stats.def || 0) * 13 + level * 15 + (bonus.hp || 0),
      maxChakra: 90 + (stats.nin || 0) * 9 + level * 6 + (bonus.chakra || 0),
      atk: 10 + (stats.tai || 0) * 2.4 + (stats.nin || 0) * 0.9 + level * 1.8,
      nin: stats.nin || 0, tai: stats.tai || 0, spd: stats.spd || 0, def: stats.def || 0,
      speed: 225 + (stats.spd || 0) * 7,
      jutsu: (p.jutsu || []).slice(0, 2),
      ultimate: p.ultimate || { name: 'Técnica definitiva', color: '#ffc247' },
      hp: 0, chakra: 0, chaos: 0, maxChaos: 100,
      invuln: 0, hurt: 0, attackAnim: 0, attackCd: 0, comboStep: 0, comboTimer: 0,
      dashCd: 0, dashTimer: 0, dashDir: { x: 1, y: 0 }, afterimageTimer: 0,
      jutsuCd: [0, 0], castAnim: 0, ultAnim: 0,
      dead: false, deathTimer: 0
    };
    this.player.hp = this.player.maxHp;
    this.player.chakra = this.player.maxChakra;
    const portrait = this.hud.portrait;
    if (portrait) {
      const c = portrait.getContext('2d');
      c.clearRect(0, 0, portrait.width, portrait.height);
      c.save();
      c.scale(portrait.width / 70, portrait.height / 70);
      window.Art.character(c, this.player.art || {}, 35, 64, 0.55, { time: 0, facing: 1 });
      c.restore();
    }
  };

  BattleGame.prototype.updateHudStatic = function () {
    const p = this.player;
    const h = this.hud;
    if (!h.name) return;
    h.name.textContent = p.name;
    h.rank.textContent = (this.playerData.rank || 'genin').toUpperCase() + ' · NIVEL ' + p.level;
    h.kicker.textContent = this.config.kind === 'arc' ? 'CRÓNICA DE LA HOJA · RANGO ' + this.config.rank : this.config.kind === 'training' ? 'ENTRENAMIENTO LIBRE' : 'MISIÓN · RANGO ' + this.config.rank;
    h.title.textContent = this.config.title || 'COMBATE';
    h.subtitle.textContent = this.config.subtitle || '';
    if (h.skill1Label && p.jutsu[0]) h.skill1Label.textContent = p.jutsu[0].name;
    if (h.skill2Label && p.jutsu[1]) h.skill2Label.textContent = p.jutsu[1].name;
    else if (h.skill2Label) h.skill2Label.textContent = 'SIN JUTSU';
    if (h.skill4Label) h.skill4Label.textContent = p.ultimate.name;
    this.updateObjective();
    this.updateBars();
  };

  BattleGame.prototype.updateObjective = function () {
    const o = this.config.objective || { type: 'defeat' };
    const h = this.hud;
    if (!h.subtitle) return;
    if (o.type === 'collect') {
      const got = this.pickups.filter(function (p) { return p.taken; }).length;
      h.subtitle.textContent = 'RECOGE LOS OBJETOS · ' + got + ' / ' + (o.goal || 3);
    } else {
      const alive = this.enemies.filter(function (e) { return !e.dead; }).length + (this.boss && !this.boss.dead ? 1 : 0);
      const total = this.config.kind === 'arc' ? 'ELIMINA A TODOS LOS ENEMIGOS' : 'DERROTA A TODOS LOS ENEMIGOS';
      h.subtitle.textContent = total + (alive > 0 ? ' · ' + alive : '');
    }
  };

  BattleGame.prototype.updateBars = function () {
    const p = this.player;
    const h = this.hud;
    if (!h.hp) return;
    h.hp.style.width = clamp(p.hp / p.maxHp * 100, 0, 100) + '%';
    h.hpText.textContent = Math.max(0, Math.ceil(p.hp)) + ' / ' + Math.round(p.maxHp);
    h.chakra.style.width = clamp(p.chakra / p.maxChakra * 100, 0, 100) + '%';
    h.chakraText.textContent = Math.floor(Math.max(0, p.chakra)) + ' / ' + Math.round(p.maxChakra);
    const chaosPct = clamp(p.chaos / p.maxChaos * 100, 0, 100);
    h.ult.style.width = chaosPct + '%';
    h.ultText.textContent = Math.floor(chaosPct) + '%';
    if (this.boss && !this.boss.dead) {
      h.bossWrap.classList.remove('hidden');
      h.bossName.textContent = this.boss.name.toUpperCase();
      h.bossHp.style.width = clamp(this.boss.hp / this.boss.maxHp * 100, 0, 100) + '%';
    } else {
      h.bossWrap.classList.add('hidden');
    }
    this.updateSkillCooldowns();
  };

  BattleGame.prototype.updateSkillCooldowns = function () {
    const p = this.player;
    const defs = [
      { el: this.hud.skill1, cd: p.jutsuCd[0] },
      { el: this.hud.skill2, cd: p.jutsuCd[1] },
      { el: this.hud.skill3, cd: p.dashCd },
      { el: this.hud.skill4, cd: 0 }
    ];
    defs.forEach(function (d, i) {
      if (!d.el) return;
      const overlay = d.el.querySelector('.cooldown');
      if (!overlay) return;
      if (i === 3) {
        overlay.classList.add('hidden');
        d.el.classList.toggle('ready', p.chaos >= p.maxChaos);
        d.el.classList.toggle('cooling', p.chaos < p.maxChaos);
      } else if (d.cd > 0.05) {
        overlay.classList.remove('hidden');
        overlay.textContent = d.cd.toFixed(1);
        d.el.classList.add('cooling');
      } else {
        overlay.classList.add('hidden');
        d.el.classList.remove('cooling');
      }
    });
    if (this.hud.skill2 && !p.jutsu[1]) this.hud.skill2.classList.add('cooling');
  };

  /* ---------------- Entrada ---------------- */
  BattleGame.prototype.bindEvents = function () {
    const self = this;
    this.bound.keydown = function (e) {
      if (!game) return;
      const k = e.code;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(k) >= 0) e.preventDefault();
      if (k === 'KeyP' || k === 'Escape') {
        e.preventDefault();
        if (self.finished) return;
        self.paused = !self.paused;
        if (self.callbacks.onPause) self.callbacks.onPause(self.paused);
        return;
      }
      if (self.paused || self.finished) return;
      self.keys[k] = true;
      if (e.repeat) return;
      if (k === 'KeyJ') self.tryAttack();
      else if (k === 'KeyK') self.tryJutsu(0);
      else if (k === 'KeyL') self.tryJutsu(1);
      else if (k === 'KeyU') self.tryUltimate();
      else if (k === 'ShiftLeft' || k === 'ShiftRight' || k === 'Space') self.tryDash();
    };
    this.bound.keyup = function (e) { if (game) self.keys[e.code] = false; };
    this.bound.blur = function () { if (game) self.keys = {}; };
    this.bound.resize = function () { if (game) self.resize(); };
    window.addEventListener('keydown', this.bound.keydown);
    window.addEventListener('keyup', this.bound.keyup);
    window.addEventListener('blur', this.bound.blur);
    window.addEventListener('resize', this.bound.resize);

    this.bound.buttons = [];
    document.querySelectorAll('#screen-battle [data-action]').forEach(function (btn) {
      const fn = function (ev) {
        ev.preventDefault();
        if (self.paused || self.finished) return;
        const act = btn.dataset.action;
        if (act === 'attack') self.tryAttack();
        else if (act === 'jutsu1') self.tryJutsu(0);
        else if (act === 'jutsu2') self.tryJutsu(1);
        else if (act === 'ultimate') self.tryUltimate();
        else if (act === 'dash') self.tryDash();
      };
      btn.addEventListener('pointerdown', fn);
      self.bound.buttons.push({ btn: btn, fn: fn });
    });

    this.bindJoystick();
  };

  BattleGame.prototype.bindJoystick = function () {
    const self = this;
    const stick = document.getElementById('battle-joystick');
    const knob = document.getElementById('battle-knob');
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
      self.touch.dx = dx / max;
      self.touch.dy = dy / max;
      self.touch.active = true;
    }
    stick.onpointerdown = function (ev) {
      id = ev.pointerId;
      try { stick.setPointerCapture(id); } catch (err) {}
      move(ev); ev.preventDefault();
    };
    stick.onpointermove = function (ev) { if (ev.pointerId === id) move(ev); };
    function end(ev) {
      if (ev.pointerId !== id) return;
      id = null; self.touch.dx = 0; self.touch.dy = 0; self.touch.active = false;
      knob.style.transform = '';
    }
    stick.onpointerup = end;
    stick.onpointercancel = end;
  };

  BattleGame.prototype.axis = function () {
    let x = 0, y = 0;
    if (this.keys.KeyA || this.keys.ArrowLeft) x -= 1;
    if (this.keys.KeyD || this.keys.ArrowRight) x += 1;
    if (this.keys.KeyW || this.keys.ArrowUp) y -= 1;
    if (this.keys.KeyS || this.keys.ArrowDown) y += 1;
    x += this.touch.dx;
    y += this.touch.dy;
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x: x, y: y };
  };

  /* ---------------- Dimensiones ---------------- */
  BattleGame.prototype.resize = function () {
    const oldW = this.w, oldH = this.h;
    const rect = this.canvas.getBoundingClientRect();
    this.w = Math.max(320, rect.width || window.innerWidth);
    this.h = Math.max(240, rect.height || window.innerHeight);
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.canvas.width = Math.floor(this.w * this.dpr);
    this.canvas.height = Math.floor(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.groundTop = this.h * 0.31;
    this.bottom = this.h - 66;
    if (this.player && oldW && oldH) {
      const sx = this.w / oldW, sy = this.h / oldH;
      const all = [this.player].concat(this.enemies).concat(this.projectiles).concat(this.pickups).concat(this.orbs);
      all.forEach(function (o) { if (o) { o.x *= sx; o.y *= sy; } });
      this.boss = this.boss;
    }
  };

  BattleGame.prototype.boundsFor = function (obj) {
    return {
      left: 46, right: this.w - 46,
      top: this.groundTop + 20, bottom: this.bottom
    };
  };

  /* ---------------- Oleadas ---------------- */
  BattleGame.prototype.spawnInitial = function () {
    const cfg = this.config;
    if (cfg.objective && cfg.objective.type === 'collect') {
      this.spawnPickups(cfg.objective.goal || 3, cfg.objective.icon);
    }
    if (cfg.kind === 'arc') {
      this.nextWave();
    } else {
      // misión / entrenamiento: enemigos y jefe juntos
      if (cfg.waves && cfg.waves[0] && cfg.waves[0].enemies.length) this.spawnWave(cfg.waves[0]);
      this.waveIndex = 0;
      if (cfg.boss) {
        this.spawnBoss();
      } else if (cfg.kind === 'training' && !cfg.boss) {
        // seguridad: sin enemigos no hay combate
        this.spawnEnemy({ type: 'ronin', level: 1 });
      }
      if (cfg.kind === 'mission' && cfg.objective && cfg.objective.type === 'collect' && (!cfg.waves || !cfg.waves[0].enemies.length)) {
        // sin enemigos: misión de recogida tranquila
      }
    }
  };

  BattleGame.prototype.nextWave = function () {
    const waves = this.config.waves || [];
    this.waveIndex++;
    if (this.waveIndex < waves.length) {
      this.spawnWave(waves[this.waveIndex]);
      this.showMessage('OLEADA ' + (this.waveIndex + 1) + ' / ' + waves.length, 1.3);
    } else if (!this.bossSpawned && this.config.boss) {
      this.waveIndex = waves.length;
      this.spawnBoss();
    } else if (this.config.objective && this.config.objective.type !== 'collect') {
      this.tryFinishVictory();
    }
  };

  BattleGame.prototype.spawnWave = function (wave) {
    const self = this;
    (wave.enemies || []).forEach(function (en, i) {
      self.spawnEnemy(en, i);
    });
    this.updateObjective();
  };

  BattleGame.prototype.spawnEnemy = function (en, idx) {
    const def = D.ENEMIES[en.type] || D.ENEMIES.bandido;
    const level = en.level || 1;
    const x = rand(100, this.w - 100);
    const y = rand(this.groundTop + 70, this.bottom - 60);
    const e = this.makeEnemy(def, en.type, level, x, y, false);
    this.enemies.push(e);
  };

  BattleGame.prototype.makeEnemy = function (def, type, level, x, y, isBoss) {
    const hpScale = 1 + Math.max(0, level - 1) * (isBoss ? 0.09 : 0.12);
    const atkScale = 1 + Math.max(0, level - 1) * 0.055;
    const art = def.art || {
      skin: '#e8c4a0', hair: def.hair || '#2a2a33', style: 'short',
      outfit: def.color || '#5a4a3a', outfit2: '#1b1b22', band: '#1c2b4a'
    };
    const e = {
      name: def.name || 'Enemigo', type: type, def: def, boss: !!isBoss,
      x: x, y: y, vx: 0, vy: 0, facing: -1, walk: rand(0, 10), moving: false,
      maxHp: Math.round(def.hp * hpScale), hp: 0,
      atk: def.atk * atkScale, speed: def.speed || 130, range: def.range || 60,
      kind: def.kind || 'melee', proj: def.proj || '#ff7a4a',
      art: art, scale: isBoss ? 1.48 : 1.03,
      cd: rand(0.5, 2), attackAnim: 0, hurt: 0, dead: false, deathTimer: 0,
      pattern: null, patternCd: rand(2.2, 3.4), summonCd: 12, hitFlash: 0,
      spawnTimer: 0.45, telegraph: null, state: 'idle'
    };
    e.hp = e.maxHp;
    return e;
  };

  BattleGame.prototype.spawnBoss = function () {
    if (!this.config.boss) return;
    const b = this.config.boss;
    let def, type = b.type;
    if (b.custom) {
      def = b.custom;
    } else {
      def = D.ENEMIES[b.type] || D.ENEMIES.mizuki;
    }
    const x = this.w / 2;
    const y = this.groundTop + 100;
    const boss = this.makeEnemy(def, type, b.level || 1, x, y, true);
    boss.scale = 1.65;
    this.boss = boss;
    this.enemies.push(boss);
    this.bossSpawned = true;
    this.showMessage('¡' + boss.name.toUpperCase() + '!', 2);
    this.shake = 8;
    window.AudioEngine.playTrack('boss', { force: true });
    window.AudioEngine.sfx('explosion');
    this.updateObjective();
  };

  BattleGame.prototype.spawnPickups = function (goal, icon) {
    for (let i = 0; i < goal; i++) {
      const x = rand(110, this.w - 110);
      const y = rand(this.groundTop + 70, this.bottom - 40);
      this.pickups.push({ x: x, y: y, icon: icon || 'scroll', taken: false, t: rand(0, 5) });
    }
  };

  /* ---------------- Acciones del jugador ---------------- */
  BattleGame.prototype.nearestEnemy = function (maxDist) {
    let best = null, bd = maxDist || 99999;
    const p = this.player;
    this.enemies.forEach(function (e) {
      if (e.dead) return;
      const d = dist(p.x, p.y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    });
    return best;
  };

  BattleGame.prototype.tryAttack = function () {
    const p = this.player;
    if (p.dead || this.phase !== 'fight' || this.finished) return;
    if (p.attackCd > 0) {
      if (p.attackCd < 0.16) this.attackQueued = true;
      return;
    }
    p.attackCd = 0.27;
    p.comboTimer = 1.4;
    p.comboStep = (p.comboStep % 3) + 1;
    p.attackAnim = 0.22;
    const heavy = p.comboStep === 3;
    const near = this.nearestEnemy(170);
    if (near) {
      const dx = near.x - p.x, dy = near.y - p.y;
      if (Math.abs(dx) > 4) p.facing = dx >= 0 ? 1 : -1;
    }
    const dir = p.facing;
    const range = heavy ? 122 : 96;
    const power = p.atk * (heavy ? 1.75 : p.comboStep === 2 ? 1.12 : 0.9);
    const px = p.x, py = p.y - 42;
    this.effects.push({ type: 'slash', x: p.x + dir * (range * 0.55), y: p.y - 44, dir: dir, life: 0.2, max: 0.2, color: heavy ? '#ffd36a' : '#ffe9c4', heavy: heavy });
    let hits = 0;
    const self = this;
    this.enemies.forEach(function (e) {
      if (e.dead) return;
      const dx = (e.x - p.x) * dir;
      const dy = Math.abs(e.y - p.y);
      if (dx > -20 && dx < range && dy < (heavy ? 82 : 58)) {
        self.damageEnemy(e, power, heavy ? 65 : 22, dir);
        hits++;
      }
    });
    if (hits) {
      p.chaos = clamp(p.chaos + (heavy ? 13 : 7), 0, p.maxChaos);
      p.chakra = clamp(p.chakra + 4, 0, p.maxChakra);
      this.combo += hits;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      window.AudioEngine.sfx('hit');
      this.shake = Math.max(this.shake, heavy ? 7 : 3);
      if (heavy) window.AudioEngine.sfx('slash');
    } else {
      window.AudioEngine.sfx('slash');
    }
    this.comboTimer = 2.4;
    this.updateComboHud();
  };

  BattleGame.prototype.tryJutsu = function (index) {
    const p = this.player;
    if (p.dead || this.phase !== 'fight' || this.finished) return;
    const j = p.jutsu[index];
    if (!j) { this.showMessage('No tienes esa técnica equipada.', 1); window.AudioEngine.sfx('error'); return; }
    if (p.jutsuCd[index] > 0) { window.AudioEngine.sfx('error'); return; }
    if (p.chakra < j.cost) { this.showMessage('Chakra insuficiente', 1); window.AudioEngine.sfx('error'); return; }
    p.chakra -= j.cost;
    p.jutsuCd[index] = 2.8 + index * 0.5;
    p.castAnim = 0.35;
    const near = this.nearestEnemy(620);
    let dirX = p.facing, dirY = 0;
    if (near) {
      const dx = near.x - p.x, dy = near.y - p.y;
      const len = Math.hypot(dx, dy) || 1;
      dirX = dx / len; dirY = dy / len;
      p.facing = dx >= 0 ? 1 : -1;
    }
    const color = j.color || '#6ed8ff';
    window.AudioEngine.sfx(j.type === 'projectile' ? 'fire' : 'jutsu');
    if (j.type === 'dash') {
      const nx = clamp(p.x + dirX * 230, 60, this.w - 60);
      const ny = clamp(p.y + dirY * 150, this.groundTop + 30, this.bottom);
      const midX = (p.x + nx) / 2, midY = (p.y + ny) / 2;
      this.effects.push({ type: 'beam', x: p.x, y: p.y - 35, x2: nx, y2: ny - 35, life: 0.3, max: 0.3, color: color, width: 34 });
      this.effects.push({ type: 'ring', x: nx, y: ny - 35, r: 10, maxR: 95, life: 0.35, max: 0.35, color: color });
      const self = this;
      this.enemies.forEach(function (e) {
        if (e.dead) return;
        const d = self.pointLineDist(e.x, e.y, p.x, p.y, nx, ny);
        if (d < 62) self.damageEnemy(e, p.atk * 2.3 + p.nin * 2, 70, dirX >= 0 ? 1 : -1);
      });
      p.x = nx; p.y = ny;
      p.invuln = Math.max(p.invuln, 0.25);
      p.dashTimer = 0.1;
      this.shake = Math.max(this.shake, 7);
    } else if (j.type === 'projectile') {
      this.projectiles.push({
        x: p.x + dirX * 32, y: p.y - 48 + dirY * 20,
        vx: dirX * 640, vy: dirY * 640, r: 19, dmg: p.atk * 1.9 + p.nin * 2.4,
        owner: 'player', color: color, life: 1.6, trail: [], pierce: 0
      });
    } else {
      this.effects.push({ type: 'ring', x: p.x, y: p.y - 35, r: 15, maxR: 160, life: 0.4, max: 0.4, color: color });
      const self = this;
      this.enemies.forEach(function (e) {
        if (!e.dead && dist(e.x, e.y, p.x, p.y) < 160) self.damageEnemy(e, p.atk * 1.6 + p.nin * 1.8, 40, p.facing);
      });
    }
    p.chaos = clamp(p.chaos + 8, 0, p.maxChaos);
    this.updateBars();
  };

  BattleGame.prototype.pointLineDist = function (px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (!len2) return dist(px, py, x1, y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = clamp(t, 0, 1);
    return dist(px, py, x1 + t * dx, y1 + t * dy);
  };

  BattleGame.prototype.tryUltimate = function () {
    const p = this.player;
    if (p.dead || this.phase !== 'fight' || this.finished) return;
    if (p.chaos < p.maxChaos) { this.showMessage('El medidor de CAOS no está lleno', 1); window.AudioEngine.sfx('error'); return; }
    p.chaos = 0;
    p.ultAnim = 1.4;
    this.cinematic = 1.25;
    this.cinematicName = p.ultimate.name || 'Técnica definitiva';
    this.flash = 1;
    this.shake = 20;
    this.showMessage('¡' + (p.ultimate.name || 'TÉCNICA DEFINITIVA').toUpperCase() + '!', 2);
    window.AudioEngine.sfx('ultimate');
    const self = this;
    const color = p.ultimate.color || '#ffc247';
    this.effects.push({ type: 'ring', x: p.x, y: p.y - 40, r: 10, maxR: 320, life: 0.7, max: 0.7, color: color });
    this.effects.push({ type: 'ring', x: p.x, y: p.y - 40, r: 10, maxR: 460, life: 1, max: 1, color: color });
    setTimeout(function () {
      if (!game) return;
      window.AudioEngine.sfx('explosion');
      self.enemies.forEach(function (e) {
        if (!e.dead && dist(e.x, e.y, self.player.x, self.player.y) < 520) {
          self.damageEnemy(e, self.player.atk * 4.5 + self.player.nin * 5 + 100, 190, self.player.facing);
        }
      });
      self.flash = 0.9;
      self.shake = 26;
    }, 430);
  };

  BattleGame.prototype.tryDash = function () {
    const p = this.player;
    if (p.dead || this.phase !== 'fight' || this.finished) return;
    if (p.dashCd > 0) return;
    const axis = this.axis();
    let dx = axis.x, dy = axis.y;
    if (!dx && !dy) { dx = p.facing; dy = 0; }
    const len = Math.hypot(dx, dy) || 1;
    p.dashDir.x = dx / len; p.dashDir.y = dy / len;
    p.dashTimer = 0.2;
    p.dashCd = 1.15;
    p.invuln = Math.max(p.invuln, 0.28);
    window.AudioEngine.sfx('dash');
  };

  /* ---------------- Daño ---------------- */
  BattleGame.prototype.damageEnemy = function (e, amount, knock, dir) {
    if (e.dead) return;
    const dmg = Math.round(amount * (0.9 + Math.random() * 0.2));
    e.hp -= dmg;
    e.hurt = 0.18;
    e.hitFlash = 0.15;
    this.damageDealt += dmg;
    this.effects.push({ type: 'damage', x: e.x + rand(-12, 12), y: e.y - (e.boss ? 120 : 85), text: dmg, color: '#ffe0a0', life: 0.75, max: 0.75 });
    this.spark(e.x, e.y - 45, e.boss ? '#ffb04a' : '#ffcf6a', 5);
    if (knock) {
      const k = 1 + knock / 80;
      e.x = clamp(e.x + (dir || 1) * k * 16, 50, this.w - 50);
    }
    if (e.hp <= 0) this.killEnemy(e);
    this.updateObjective();
  };

  BattleGame.prototype.killEnemy = function (e) {
    if (e.dead) return;
    e.dead = true;
    e.deathTimer = 0.45;
    this.defeatedCount++;
    window.AudioEngine.sfx(e.boss ? 'explosion' : 'die');
    this.effects.push({ type: 'ring', x: e.x, y: e.y - 30, r: 6, maxR: e.boss ? 140 : 55, life: 0.4, max: 0.4, color: e.boss ? '#ff8a4a' : '#ffd36a' });
    this.spark(e.x, e.y - 35, '#ffcf6a', e.boss ? 18 : 6);
    if (e.boss) {
      this.bossDefeated = true;
      this.shake = 18;
      this.showMessage('¡JEFE DERROTADO!', 1.8);
      this.orbs.push({ x: e.x, y: e.y, type: 'chakra', t: 0 });
    } else if (Math.random() < 0.20) {
      this.orbs.push({ x: e.x, y: e.y, type: Math.random() < 0.5 ? 'chakra' : 'ryo', t: 0 });
    }
    this.updateObjective();
  };

  BattleGame.prototype.damagePlayer = function (amount) {
    const p = this.player;
    if (p.dead || p.invuln > 0 || this.cinematic > 0.7) return;
    const dmg = Math.round(amount * (1 - (p.def || 0) * 0.015));
    p.hp -= dmg;
    p.invuln = 0.55;
    p.hurt = 0.4;
    this.damageTaken += dmg;
    this.combo = 0;
    this.shake = Math.max(this.shake, 7);
    this.flash = Math.max(this.flash, 0.25);
    p.chaos = clamp(p.chaos + 6, 0, p.maxChaos);
    this.effects.push({ type: 'damage', x: p.x, y: p.y - 95, text: '-' + dmg, color: '#ff8a8a', life: 0.8, max: 0.8 });
    this.spark(p.x, p.y - 45, '#ff6a6a', 8);
    window.AudioEngine.sfx('hurt');
    if (p.hp <= 0) {
      p.hp = 0;
      p.dead = true;
      p.deathTimer = 1.1;
      this.phase = 'ending';
      this.showMessage('DERROTA...', 2);
      window.AudioEngine.sfx('defeat');
      window.AudioEngine.stopMusic();
      const self = this;
      this.result = { win: false, time: this.runTime, maxCombo: this.maxCombo, damageDealt: this.damageDealt, damageTaken: this.damageTaken, defeated: this.defeatedCount, hpLeft: 0 };
      setTimeout(function () { self.finish(false); }, 1500);
    }
    this.updateBars();
  };

  BattleGame.prototype.heal = function (amount) {
    const p = this.player;
    if (p.dead) return;
    p.hp = clamp(p.hp + amount, 0, p.maxHp);
    this.effects.push({ type: 'damage', x: p.x, y: p.y - 100, text: '+' + Math.round(amount), color: '#8affa8', life: 0.9, max: 0.9 });
    window.AudioEngine.sfx('heal');
  };

  BattleGame.prototype.spark = function (x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = rand(50, 220);
      this.particles.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: rand(0.25, 0.6), max: 0.6, color: color, size: rand(2, 5) });
    }
  };

  /* ---------------- Actualización ---------------- */
  BattleGame.prototype.loop = function (t) {
    if (!game) return;
    const self = this;
    this.raf = requestAnimationFrame(function (tt) { self.loop(tt); });
    let dt = (t - this.last) / 1000;
    this.last = t;
    if (dt > 0.05) dt = 0.05;
    if (!this.paused) {
      this.time += dt;
      if (this.phase === 'fight') this.runTime += dt;
      this.update(dt);
    }
    this.render();
  };

  BattleGame.prototype.update = function (dt) {
    const p = this.player;
    const slow = this.slowmo > 0 ? 0.35 : 1;
    if (this.slowmo > 0) this.slowmo -= dt;
    const gdt = dt * slow;

    if (this.cinematic > 0) this.cinematic -= dt;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2.4);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 38);
    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0 && this.hud.msg) this.hud.msg.classList.remove('on');
    }
    if (this.warningTimer > 0) {
      this.warningTimer -= dt;
      if (this.warningTimer <= 0 && this.hud.warning) this.hud.warning.classList.add('hidden');
    }

    // cooldowns y regeneración
    p.attackCd = Math.max(0, p.attackCd - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    p.jutsuCd[0] = Math.max(0, p.jutsuCd[0] - dt);
    p.jutsuCd[1] = Math.max(0, p.jutsuCd[1] - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    p.hurt = Math.max(0, p.hurt - dt);
    p.attackAnim = Math.max(0, p.attackAnim - dt);
    p.castAnim = Math.max(0, p.castAnim - dt);
    p.ultAnim = Math.max(0, p.ultAnim - dt);
    if (!p.dead) {
      p.chakra = clamp(p.chakra + dt * (6 + p.nin * 0.4), 0, p.maxChakra);
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) { this.combo = 0; this.updateComboHud(); }
      }
    }
    if (p.attackCd < 0.15 && this.attackQueued) {
      this.attackQueued = false;
      this.tryAttack();
    }

    if (p.dead) {
      p.deathTimer = Math.max(0, p.deathTimer - dt);
    } else if (this.phase === 'fight') {
      this.updatePlayerMovement(dt);
    }

    this.updateEnemies(gdt);
    this.updateProjectiles(gdt);
    this.updateEffects(dt);
    this.updatePickups(dt);
    this.updateOrbs(dt);
    this.updateTelegraphs(dt);
    this.tryFinishVictory();
    this.updateBars();
    this.updateObjective();
    if (this.shake < 0.2) this.shake = 0;
  };

  BattleGame.prototype.updatePlayerMovement = function (dt) {
    const p = this.player;
    const axis = this.axis();
    const b = this.boundsFor();
    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      p.x += p.dashDir.x * 820 * dt;
      p.y += p.dashDir.y * 560 * dt;
      p.afterimageTimer -= dt;
      if (p.afterimageTimer <= 0) {
        p.afterimageTimer = 0.04;
        this.afterimages.push({ x: p.x, y: p.y, facing: p.facing, life: 0.28, max: 0.28, walk: p.walk });
      }
    } else {
      p.x += axis.x * p.speed * dt;
      p.y += axis.y * p.speed * dt * 0.82;
      p.moving = Math.abs(axis.x) + Math.abs(axis.y) > 0.1;
      if (p.moving) {
        p.walk += dt * 7.5;
        if (axis.x) p.facing = axis.x > 0 ? 1 : -1;
        else {
          const near = this.nearestEnemy(220);
          if (near) p.facing = near.x >= p.x ? 1 : -1;
        }
      }
    }
    p.x = clamp(p.x, b.left, b.right);
    p.y = clamp(p.y, b.top, b.bottom);
    this.afterimages.forEach(function (a) { a.life -= dt; });
    this.afterimages = this.afterimages.filter(function (a) { return a.life > 0; });
  };

  BattleGame.prototype.updateEnemies = function (dt) {
    const p = this.player;
    const self = this;
    this.enemies.forEach(function (e) {
      if (e.dead) {
        e.deathTimer -= dt;
        return;
      }
      if (e.hurt > 0) e.hurt -= dt;
      if (e.spawnTimer > 0) { e.spawnTimer -= dt; return; }
      const d = dist(e.x, e.y, p.x, p.y);
      const dx = p.x - e.x, dy = p.y - e.y;
      const len = Math.hypot(dx, dy) || 1;
      e.facing = dx >= 0 ? 1 : -1;
      if (p.dead || self.phase !== 'fight') return;
      e.cd -= dt;
      const b = self.boundsFor();

      if (e.boss) {
        self.updateBoss(e, dt, d, dx, dy, len);
      } else if (e.kind === 'ranged') {
        const desired = 190;
        e.moving = false;
        if (d < desired - 30) {
          e.x -= (dx / len) * e.speed * dt;
          e.y -= (dy / len) * e.speed * dt * 0.8;
          e.moving = true;
        } else if (d > desired + 50) {
          e.x += (dx / len) * e.speed * 0.7 * dt;
          e.y += (dy / len) * e.speed * 0.7 * dt * 0.8;
          e.moving = true;
        }
        if (e.cd <= 0 && d < 520) {
          e.cd = rand(1.9, 2.8);
          e.attackAnim = 0.2;
          self.enemyProjectile(e, Math.atan2(dy, dx), 280, e.atk);
        }
      } else {
        e.moving = false;
        if (d > e.range * 0.9) {
          e.x += (dx / len) * e.speed * dt;
          e.y += (dy / len) * e.speed * dt * 0.82;
          e.moving = true;
          e.walk += dt * 6;
        }
        if (d < e.range + 28 && e.cd <= 0) {
          e.cd = rand(1.1, 1.8);
          e.attackAnim = 0.28;
          if (d < e.range + 50) self.damagePlayer(e.atk);
        }
      }
      e.x = clamp(e.x, b.left, b.right);
      e.y = clamp(e.y, b.top, b.bottom);
      if (e.attackAnim > 0) e.attackAnim -= dt;
    });

    // separación entre enemigos
    for (let i = 0; i < this.enemies.length; i++) {
      const a = this.enemies[i];
      if (a.dead) continue;
      for (let j = i + 1; j < this.enemies.length; j++) {
        const c = this.enemies[j];
        if (c.dead) continue;
        const dd = dist(a.x, a.y, c.x, c.y);
        if (dd < 50 && dd > 0.01) {
          const push = (50 - dd) * 0.5;
          const nx = (a.x - c.x) / dd, ny = (a.y - c.y) / dd;
          a.x += nx * push * 0.5; a.y += ny * push * 0.5;
          c.x -= nx * push * 0.5; c.y -= ny * push * 0.5;
        }
      }
    }

    if (this.waveIndex >= 0 && this.phase === 'fight') {
      const alive = this.enemies.some(function (e) { return !e.dead && !e.boss; });
      const lastWave = this.waveIndex >= (this.config.waves || []).length - 1;
      if (!alive && this.config.kind === 'arc') {
        if (!lastWave) {
          if (this.waveTimer <= 0) this.waveTimer = 1.0;
        } else if (!this.bossSpawned && this.config.boss) {
          if (this.waveTimer <= 0) this.waveTimer = 1.1;
        }
      }
      if (this.waveTimer > 0) {
        this.waveTimer -= dt;
        if (this.waveTimer <= 0) {
          if (this.config.kind === 'arc' && !this.bossSpawned && lastWave) {
            this.spawnBoss();
          } else {
            this.nextWave();
          }
        }
      }
    }
  };

  BattleGame.prototype.updateBoss = function (e, dt, d, dx, dy, len) {
    const p = this.player;
    const self = this;
    e.patternCd -= dt;
    e.summonCd -= dt;
    if (e.pattern) {
      e.pattern.timer -= dt;
      if (e.pattern.type === 'slam') {
        if (e.pattern.timer <= 0) {
          self.bossSlam(e);
          e.pattern = null;
          e.patternCd = rand(3.4, 5.2);
        }
      } else if (e.pattern.type === 'charge') {
        if (e.pattern.timer <= 0) {
          self.bossCharge(e);
          e.pattern = null;
          e.patternCd = rand(4, 6);
        }
      } else if (e.pattern.type === 'spread') {
        if (e.pattern.timer <= 0) {
          for (let k = -2; k <= 2; k++) self.enemyProjectile(e, Math.atan2(dy, dx) + k * 0.18, 300, e.atk * 0.8);
          window.AudioEngine.sfx('fire');
          e.pattern = null;
          e.patternCd = rand(2.8, 4.2);
        }
      }
      return;
    }
    e.moving = false;
    if (e.summonCd <= 0 && self.enemies.filter(function (x) { return !x.dead && !x.boss; }).length < 4) {
      e.summonCd = 13;
      for (let i = 0; i < 2; i++) {
        const minion = self.makeEnemy(D.ENEMIES.zetsu, 'zetsu', Math.max(1, e.def.hp ? 5 : 5), e.x + rand(-60, 60), e.y + rand(20, 70), false);
        minion.spawnTimer = 0.5;
        self.enemies.push(minion);
        self.effects.push({ type: 'ring', x: minion.x, y: minion.y - 30, r: 5, maxR: 40, life: 0.3, max: 0.3, color: '#b4e0b0' });
      }
      self.showMessage('¡El jefe invoca refuerzos!', 1.3);
    }
    if (e.patternCd <= 0) {
      const choice = Math.random();
      if (choice < 0.42) {
        e.pattern = { type: 'slam', timer: 1.05, max: 1.05, x: p.x, y: p.y, r: 155 };
        self.showWarning();
      } else if (choice < 0.72) {
        e.pattern = { type: 'charge', timer: 0.8, max: 0.8, angle: Math.atan2(dy, dx) };
        self.showWarning();
      } else {
        e.pattern = { type: 'spread', timer: 0.9, max: 0.9 };
      }
      return;
    }
    if (d > 120) {
      e.x += (dx / len) * e.speed * 0.55 * dt;
      e.y += (dy / len) * e.speed * 0.55 * dt * 0.8;
      e.moving = true;
      e.walk += dt * 5;
    }
    if (d < 130 && e.cd <= 0) {
      e.cd = 1.4;
      e.attackAnim = 0.35;
      self.damagePlayer(e.atk * 1.2);
    }
  };

  BattleGame.prototype.showWarning = function () {
    if (this.hud.warning) this.hud.warning.classList.remove('hidden');
    this.warningTimer = 0.9;
  };

  BattleGame.prototype.bossSlam = function (e) {
    const t = e.pattern;
    this.effects.push({ type: 'ring', x: t.x, y: t.y - 20, r: 10, maxR: t.r, life: 0.38, max: 0.38, color: '#ff6a4a' });
    this.effects.push({ type: 'explosion', x: t.x, y: t.y - 30, life: 0.5, max: 0.5, color: '#ff8a4a' });
    this.spark(t.x, t.y - 20, '#ffb04a', 16);
    this.shake = 14;
    window.AudioEngine.sfx('explosion');
    if (dist(this.player.x, this.player.y, t.x, t.y) < t.r + 25) this.damagePlayer(e.atk * 1.8 + 8);
  };

  BattleGame.prototype.bossCharge = function (e) {
    const t = e.pattern;
    const dirX = Math.cos(t.angle), dirY = Math.sin(t.angle);
    const sx = e.x, sy = e.y;
    const tx = clamp(e.x + dirX * 420, 60, this.w - 60);
    const ty = clamp(e.y + dirY * 300, this.groundTop + 20, this.bottom);
    this.effects.push({ type: 'beam', x: sx, y: sy - 45, x2: tx, y2: ty - 45, life: 0.45, max: 0.45, color: '#ff4a4a', width: 60 });
    e.x = tx; e.y = ty;
    if (this.pointLineDist(this.player.x, this.player.y, sx, sy, tx, ty) < 70) this.damagePlayer(e.atk * 1.6 + 6);
    this.shake = 10;
    window.AudioEngine.sfx('slash');
  };

  BattleGame.prototype.enemyProjectile = function (e, angle, speed, dmg) {
    this.projectiles.push({
      x: e.x + Math.cos(angle) * 28, y: e.y - 42 + Math.sin(angle) * 15,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      r: 11, dmg: dmg, owner: 'enemy', color: e.proj || '#ff7a4a', life: 2.2, trail: []
    });
  };

  BattleGame.prototype.updateProjectiles = function (dt) {
    const self = this;
    this.projectiles.forEach(function (pr) {
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.life -= dt;
      pr.trail.push({ x: pr.x, y: pr.y });
      if (pr.trail.length > 8) pr.trail.shift();
      if (pr.owner === 'player') {
        self.enemies.forEach(function (e) {
          if (!e.dead && pr.life > 0 && dist(pr.x, pr.y, e.x, e.y - 45) < pr.r + 28) {
            self.damageEnemy(e, pr.dmg, 60, pr.vx > 0 ? 1 : -1);
            self.effects.push({ type: 'explosion', x: pr.x, y: pr.y, life: 0.3, max: 0.3, color: pr.color });
            window.AudioEngine.sfx('explosion');
            pr.life = 0;
          }
        });
      } else {
        if (dist(pr.x, pr.y, self.player.x, self.player.y - 42) < pr.r + 24) {
          self.damagePlayer(pr.dmg);
          self.effects.push({ type: 'ring', x: pr.x, y: pr.y, r: 5, maxR: 38, life: 0.25, max: 0.25, color: pr.color });
          pr.life = 0;
        }
      }
      if (pr.x < 20 || pr.x > self.w - 20 || pr.y < self.groundTop - 50 || pr.y > self.h + 20) pr.life = 0;
    });
    this.projectiles = this.projectiles.filter(function (p) { return p.life > 0; });
  };

  BattleGame.prototype.updateEffects = function (dt) {
    this.effects.forEach(function (e) { e.life -= dt; });
    this.effects = this.effects.filter(function (e) { return e.life > 0; });
    this.particles.forEach(function (p) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 420 * dt;
      p.vx *= 0.98;
    });
    this.particles = this.particles.filter(function (p) { return p.life > 0; });
    this.afterimages.forEach(function (a) { a.life -= dt; });
    this.afterimages = this.afterimages.filter(function (a) { return a.life > 0; });
  };

  BattleGame.prototype.updatePickups = function (dt) {
    const self = this;
    this.pickups.forEach(function (pk) {
      if (pk.taken) return;
      pk.t += dt;
      if (dist(pk.x, pk.y, self.player.x, self.player.y) < 48) {
        pk.taken = true;
        self.player.chaos = clamp(self.player.chaos + 18, 0, self.player.maxChaos);
        self.player.chakra = clamp(self.player.chakra + 15, 0, self.player.maxChakra);
        self.showMessage('OBJETO RECUPERADO · ' + self.pickups.filter(function (x) { return x.taken; }).length + ' / ' + self.pickups.length, 1.4);
        window.AudioEngine.sfx('pickup');
        self.effects.push({ type: 'ring', x: pk.x, y: pk.y - 20, r: 4, maxR: 45, life: 0.3, max: 0.3, color: '#ffd36a' });
      }
    });
  };

  BattleGame.prototype.updateOrbs = function (dt) {
    const self = this;
    this.orbs.forEach(function (o) {
      o.t += dt;
      const d = dist(o.x, o.y, self.player.x, self.player.y);
      if (d < 80) {
        const nx = (self.player.x - o.x) / (d || 1), ny = (self.player.y - o.y) / (d || 1);
        o.x += nx * 200 * dt; o.y += ny * 200 * dt;
      }
      if (d < 28) {
        o.t = 99;
        if (o.type === 'chakra') {
          self.player.chakra = clamp(self.player.chakra + 14, 0, self.player.maxChakra);
          self.effects.push({ type: 'damage', x: o.x, y: o.y - 30, text: '+14 CH', color: '#6ed8ff', life: 0.7, max: 0.7 });
        } else {
          self.effects.push({ type: 'damage', x: o.x, y: o.y - 30, text: '+40 ₽', color: '#ffd36a', life: 0.7, max: 0.7 });
          if (self.callbacks.onRyo) self.callbacks.onRyo(40);
        }
        window.AudioEngine.sfx('coin');
      }
    });
    this.orbs = this.orbs.filter(function (o) { return o.t < 20; });
  };

  BattleGame.prototype.updateTelegraphs = function (dt) {
    this.telegraphs.forEach(function (t) { t.life -= dt; });
    this.telegraphs = this.telegraphs.filter(function (t) { return t.life > 0; });
  };

  BattleGame.prototype.tryFinishVictory = function () {
    if (this.phase !== 'fight' || this.finished) return;
    const o = this.config.objective || { type: 'defeat' };
    if (o.type === 'collect') {
      const done = this.pickups.filter(function (p) { return p.taken; }).length;
      if (this.pickups.length && done >= this.pickups.length) {
        this.triggerVictory();
      }
      return;
    }
    const alive = this.enemies.some(function (e) { return !e.dead; });
    const wavesLeft = this.config.kind === 'arc' && !this.bossSpawned ? this.waveIndex < (this.config.waves || []).length - 1 : false;
    if (!alive && !wavesLeft && (!this.config.boss || this.bossDefeated)) {
      const pending = this.config.kind === 'arc' && this.waveIndex < (this.config.waves || []).length - 1;
      if (!pending) this.triggerVictory();
    }
  };

  BattleGame.prototype.triggerVictory = function () {
    if (this.phase !== 'fight' || this.finished) return;
    this.phase = 'ending';
    this.showMessage('¡VICTORIA!', 2.2);
    window.AudioEngine.sfx('victory');
    window.AudioEngine.stopMusic();
    this.flash = 0.5;
    this.shake = 12;
    const self = this;
    this.result = { win: true, time: this.runTime, maxCombo: this.maxCombo, damageDealt: this.damageDealt, damageTaken: this.damageTaken, defeated: this.defeatedCount, hpLeft: Math.ceil(this.player.hp) };
    setTimeout(function () { self.finish(true); }, 1400);
  };

  BattleGame.prototype.finish = function (win) {
    if (this.finished) return;
    this.finished = true;
    const result = this.result || { win: win, time: this.runTime, maxCombo: this.maxCombo, damageDealt: this.damageDealt, damageTaken: this.damageTaken, defeated: this.defeatedCount, hpLeft: Math.ceil(this.player.hp) };
    result.config = this.config;
    result.player = this.playerData;
    this.stop(true);
    if (this.callbacks.onEnd) this.callbacks.onEnd(result);
  };

  BattleGame.prototype.stop = function (silent) {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    if (this.bound.keydown) window.removeEventListener('keydown', this.bound.keydown);
    if (this.bound.keyup) window.removeEventListener('keyup', this.bound.keyup);
    if (this.bound.blur) window.removeEventListener('blur', this.bound.blur);
    if (this.bound.resize) window.removeEventListener('resize', this.bound.resize);
    (this.bound.buttons || []).forEach(function (b) {
      b.btn.removeEventListener('pointerdown', b.fn);
    });
    this.bound.buttons = [];
    if (!silent) {
      window.AudioEngine.stopMusic();
      this.finished = true;
    }
  };

  BattleGame.prototype.pause = function () {
    this.paused = true;
  };
  BattleGame.prototype.resume = function () {
    this.paused = false;
    this.last = performance.now();
  };

  BattleGame.prototype.showMessage = function (text, time) {
    if (!this.hud.msg) return;
    this.hud.msg.textContent = text;
    this.hud.msg.classList.add('on');
    this.messageTimer = time || 1.2;
  };

  BattleGame.prototype.updateComboHud = function () {
    if (!this.hud.combo) return;
    if (this.combo > 1) {
      this.hud.combo.classList.remove('hidden');
      this.hud.comboCount.textContent = this.combo;
    } else {
      this.hud.combo.classList.add('hidden');
    }
  };

  /* ---------------- Render ---------------- */
  BattleGame.prototype.render = function () {
    const ctx = this.ctx;
    const w = this.w, h = this.h;
    if (!ctx) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const shakeAmt = window.__reduceShake ? 0 : this.shake;
    const shakeX = shakeAmt ? rand(-shakeAmt, shakeAmt) : 0;
    const shakeY = shakeAmt ? rand(-shakeAmt, shakeAmt) : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    window.Art.arena(ctx, this.config.arena || 'hoja', w, h, this.time);

    // marco de arena
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 194, 71, .08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.68, w * 0.45, h * 0.3, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // sombras y telegrafías
    const self = this;
    this.telegraphs.forEach(function (t) { self.drawTelegraph(ctx, t); });
    if (this.boss && this.boss.pattern) this.drawBossTelegraph(ctx, this.boss);
    this.pickups.forEach(function (p) { if (!p.taken) self.drawPickup(ctx, p); });
    this.orbs.forEach(function (o) { self.drawOrb(ctx, o); });

    // entidades ordenadas por y
    const ents = [];
    this.afterimages.forEach(function (a) { ents.push({ kind: 'after', a: a, y: a.y }); });
    this.enemies.forEach(function (e) { if (!e.dead || e.deathTimer > 0) ents.push({ kind: 'enemy', e: e, y: e.y }); });
    if (!this.player.dead || this.player.deathTimer > -1) ents.push({ kind: 'player', y: this.player.y });
    ents.sort(function (a, b) { return a.y - b.y; });
    ents.forEach(function (en) {
      if (en.kind === 'enemy') self.drawEnemy(ctx, en.e);
      else if (en.kind === 'player') self.drawPlayer(ctx);
      else self.drawAfterimage(ctx, en.a);
    });

    this.projectiles.forEach(function (p) { self.drawProjectile(ctx, p); });
    this.effects.forEach(function (e) { self.drawEffect(ctx, e); });
    this.particles.forEach(function (p) { self.drawParticle(ctx, p); });

    ctx.restore();

    // overlays
    if (this.flash > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.7, this.flash * 0.5) + ')';
      ctx.fillRect(0, 0, w, h);
    }
    if (this.cinematic > 0) {
      ctx.fillStyle = 'rgba(3, 8, 14, .42)';
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 220, 150, .9)';
      ctx.font = '400 ' + Math.min(64, w * 0.06) + 'px "Bebas Neue", sans-serif';
      ctx.fillText(this.cinematicName.toUpperCase(), w / 2, h * 0.27);
      ctx.restore();
    }
    const vg = ctx.createRadialGradient(w / 2, h * 0.55, h * 0.2, w / 2, h * 0.55, h * 0.9);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.28)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
    if (this.player.hp / this.player.maxHp < 0.25 && !this.player.dead) {
      const low = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8);
      low.addColorStop(0, 'rgba(255,0,0,0)');
      low.addColorStop(1, 'rgba(180,20,30,.2)');
      ctx.fillStyle = low;
      ctx.fillRect(0, 0, w, h);
    }
    if (this.player.dead && this.phase === 'ending') {
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.fillRect(0, 0, w, h);
    }
  };

  BattleGame.prototype.drawPlayer = function (ctx) {
    const p = this.player;
    if (p.dead && p.deathTimer <= 0) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      window.Art.character(ctx, p.art, p.x, p.y, p.scale, { time: this.time, facing: p.facing, walk: p.walk, moving: false });
      ctx.restore();
      return;
    }
    ctx.save();
    if (p.invuln > 0 && Math.floor(this.time * 20) % 2 === 0) ctx.globalAlpha = 0.45;
    if (p.dead) ctx.globalAlpha = Math.max(0, p.deathTimer);
    window.Art.character(ctx, p.art, p.x, p.y, p.scale, {
      time: this.time, facing: p.facing, walk: p.walk, moving: p.moving,
      hurt: p.hurt > 0 ? 1 : 0, attack: p.attackAnim > 0 ? 1 : 0,
      aura: p.chaos >= p.maxChaos ? (p.ultimate.color || '#ffc247') : null
    });
    ctx.restore();
    // clan marker
    if (!p.dead) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 214, 140, .75)';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 160 * p.scale / 1.28);
      ctx.lineTo(p.x - 5, p.y - 170 * p.scale / 1.28);
      ctx.lineTo(p.x + 5, p.y - 170 * p.scale / 1.28);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };

  BattleGame.prototype.drawAfterimage = function (ctx, a) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, a.life / a.max) * 0.28;
    ctx.globalCompositeOperation = 'lighter';
    window.Art.character(ctx, this.player.art, a.x, a.y, this.player.scale, { time: this.time, facing: a.facing, walk: a.walk, moving: true, aura: '#6ed8ff' });
    ctx.restore();
  };

  BattleGame.prototype.drawEnemy = function (ctx, e) {
    ctx.save();
    if (e.spawnTimer > 0) ctx.globalAlpha = 1 - e.spawnTimer / 0.45;
    if (e.dead) ctx.globalAlpha = Math.max(0, e.deathTimer / 0.45);
    if (e.boss) {
      ctx.save();
      const aura = ctx.createRadialGradient(e.x, e.y - 60, 10, e.x, e.y - 60, 100);
      aura.addColorStop(0, 'rgba(255,70,70,.2)');
      aura.addColorStop(1, 'rgba(255,70,70,0)');
      ctx.fillStyle = aura;
      ctx.beginPath(); ctx.arc(e.x, e.y - 60, 100, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    window.Art.character(ctx, e.art, e.x, e.y, e.scale, {
      time: this.time + e.walk, facing: e.facing, walk: e.walk, moving: e.moving,
      hurt: e.hurt > 0 ? 1 : 0, attack: e.attackAnim > 0 ? 1 : 0
    });
    ctx.restore();
    if (e.dead) return;
    // barra de vida
    const w = e.boss ? 90 : 46;
    const hpy = e.y - (e.boss ? 190 : 130);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(e.x - w / 2, hpy, w, e.boss ? 6 : 4);
    ctx.fillStyle = e.boss ? '#ff5a6a' : '#ffcf6a';
    ctx.fillRect(e.x - w / 2, hpy, w * clamp(e.hp / e.maxHp, 0, 1), e.boss ? 6 : 4);
    if (e.boss) {
      ctx.fillStyle = 'rgba(255,235,220,.9)';
      ctx.font = '600 10px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(e.name.toUpperCase(), e.x, hpy - 6);
    }
    ctx.restore();
  };

  BattleGame.prototype.drawProjectile = function (ctx, p) {
    ctx.save();
    p.trail.forEach(function (t, i) {
      ctx.globalAlpha = (i + 1) / p.trail.length * 0.35;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(t.x, t.y, p.r * (0.3 + i / p.trail.length * 0.6), 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.r * 2.2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.3, p.color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  BattleGame.prototype.drawEffect = function (ctx, e) {
    const t = e.life / e.max;
    ctx.save();
    if (e.type === 'slash') {
      ctx.globalAlpha = Math.max(0, t);
      ctx.strokeStyle = e.color;
      ctx.lineWidth = e.heavy ? 8 : 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const arc = e.heavy ? 1.2 : 0.9;
      ctx.arc(e.x, e.y, e.heavy ? 58 : 42, -arc + (e.dir > 0 ? 0 : Math.PI), arc + (e.dir > 0 ? 0 : Math.PI));
      ctx.stroke();
      ctx.globalAlpha = t * 0.25;
      ctx.lineWidth = e.heavy ? 20 : 12;
      ctx.stroke();
    } else if (e.type === 'ring') {
      const p = 1 - t;
      const r = lerp(e.r, e.maxR, p);
      ctx.globalAlpha = t * 0.85;
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 3 + t * 5;
      ctx.beginPath(); ctx.ellipse(e.x, e.y + 24, r, r * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = t * 0.25;
      ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.65, 0, Math.PI * 2); ctx.stroke();
    } else if (e.type === 'explosion') {
      const p = 1 - t;
      const r = 12 + p * 75;
      ctx.globalAlpha = t;
      const g = ctx.createRadialGradient(e.x, e.y, 2, e.x, e.y, r);
      g.addColorStop(0, 'rgba(255,255,255,.9)');
      g.addColorStop(0.35, e.color || '#ffb04a');
      g.addColorStop(1, 'rgba(255,80,20,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill();
    } else if (e.type === 'beam') {
      ctx.globalAlpha = t * 0.9;
      const g = ctx.createLinearGradient(e.x, e.y, e.x2, e.y2);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.4, e.color || '#6ed8ff');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = (e.width || 24) * t;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x2, e.y2); ctx.stroke();
      ctx.strokeStyle = '#fff';
      ctx.globalAlpha = t * 0.5;
      ctx.lineWidth = (e.width || 24) * t * 0.25;
      ctx.stroke();
    } else if (e.type === 'damage') {
      ctx.globalAlpha = Math.min(1, t * 2);
      ctx.fillStyle = e.color;
      ctx.font = '700 ' + (typeof e.text === 'number' ? 20 : 16) + 'px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,.6)';
      ctx.lineWidth = 3;
      const y = e.y - (1 - t) * 36;
      ctx.strokeText(String(e.text), e.x, y);
      ctx.fillText(String(e.text), e.x, y);
    }
    ctx.restore();
  };

  BattleGame.prototype.drawParticle = function (ctx, p) {
    const t = p.life / p.max;
    ctx.save();
    ctx.globalAlpha = Math.max(0, t);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  BattleGame.prototype.drawTelegraph = function (ctx, t) {
    ctx.save();
    ctx.globalAlpha = 0.3 + 0.3 * Math.sin(this.time * 12);
    ctx.strokeStyle = '#ff4a4a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r, t.r * 0.35, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#ff4a4a';
    ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r, t.r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  BattleGame.prototype.drawBossTelegraph = function (ctx, boss) {
    const pt = boss.pattern;
    if (!pt || pt.type === 'spread') return;
    const p = 1 - pt.timer / pt.max;
    ctx.save();
    if (pt.type === 'slam') {
      ctx.globalAlpha = 0.25 + 0.3 * p;
      ctx.strokeStyle = '#ff4a4a';
      ctx.lineWidth = 2 + p * 3;
      ctx.beginPath(); ctx.ellipse(pt.x, pt.y, pt.r, pt.r * 0.35, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.1 + p * 0.15;
      ctx.fillStyle = '#ff3a3a';
      ctx.beginPath(); ctx.ellipse(pt.x, pt.y, pt.r * p, pt.r * 0.35 * p, 0, 0, Math.PI * 2); ctx.fill();
    } else if (pt.type === 'charge') {
      const dirX = Math.cos(pt.angle), dirY = Math.sin(pt.angle);
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = '#ff4a4a';
      ctx.lineWidth = 30 * p;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(boss.x, boss.y); ctx.lineTo(boss.x + dirX * 420, boss.y + dirY * 300); ctx.stroke();
      ctx.globalAlpha = 0.3 + p * 0.4;
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffb0a0';
      ctx.stroke();
    }
    ctx.restore();
  };

  BattleGame.prototype.drawPickup = function (ctx, p) {
    ctx.save();
    const bob = Math.sin(p.t * 2.2) * 7;
    const y = p.y - 26 + bob;
    const g = ctx.createRadialGradient(p.x, y, 3, p.x, y, 34);
    g.addColorStop(0, 'rgba(255,220,120,.5)');
    g.addColorStop(1, 'rgba(255,180,60,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(p.x, y, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(6, 20, 32, .8)';
    ctx.beginPath(); ctx.arc(p.x, y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffd36a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffd36a';
    ctx.font = '700 13px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    const icon = p.icon === 'cat' ? '猫' : p.icon === 'ramen' ? '麺' : p.icon === 'leaf' ? '葉' : '巻';
    ctx.fillText(icon, p.x, y + 5);
    ctx.restore();
  };

  BattleGame.prototype.drawOrb = function (ctx, o) {
    ctx.save();
    const bob = Math.sin(o.t * 4) * 3;
    const color = o.type === 'chakra' ? '#6ed8ff' : '#ffd36a';
    const g = ctx.createRadialGradient(o.x, o.y - 20 + bob, 1, o.x, o.y - 20 + bob, 16);
    g.addColorStop(0, '#fff');
    g.addColorStop(0.4, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(o.x, o.y - 20 + bob, 16, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  BattleGame.prototype.drawBigMap = function () {}; // reservado

  /* ---------------- API ---------------- */
  window.Battle = {
    start: function (canvas, config, player, callbacks) {
      if (game) game.stop();
      game = new BattleGame(canvas, config, player, callbacks);
      return game;
    },
    stop: function () { if (game) { game.stop(); game = null; } },
    pause: function () { if (game) game.pause(); },
    resume: function () { if (game) game.resume(); },
    isActive: function () { return !!game && !game.finished; },
    activeGame: function () { return game; }
  };
})();

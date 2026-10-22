/* ============================================================
   NARUTO: SHINOBI LEGACY — Arte procedural (canvas)
   ============================================================ */
(function () {
  'use strict';

  const images = {};
  const imageList = {};
  const loaded = {};
  let ready = false;

  function loadImage(key, src) {
    if (!src) return;
    const img = new Image();
    img.onload = function () { loaded[key] = true; };
    img.onerror = function () { loaded[key] = false; };
    img.src = src;
    images[key] = img;
  }

  function preload(cb) {
    const chars = window.GameData.CHARACTERS;
    chars.forEach(function (c) { loadImage(c.id, c.portrait); });
    Object.keys(window.GameData.ENEMIES).forEach(function (k) {
      const e = window.GameData.ENEMIES[k];
      if (e.portrait) loadImage(k, e.portrait);
    });
    loadImage('iruka', 'assets/portraits/iruka.png');
    [
      ['hiruzen', 'hiruzen'], ['asuma', 'asuma'], ['kurenai', 'kurenai'],
      ['shizune', 'shizune'], ['konohamaru', 'konohamaru'], ['kushina', 'kushina'],
      ['guy', 'guy'], ['hashirama', 'hashirama'], ['tobirama', 'tobirama'],
      ['shisui', 'shisui'], ['mei', 'mei'], ['onoki', 'onoki'],
      ['nagato', 'nagato'], ['a4', 'a4']
    ].forEach(function (pair) {
      loadImage(pair[0], 'assets/portraits/' + pair[1] + '.png');
    });
    loadImage('konoha', 'assets/img/konoha.png');
    loadImage('bandanas', 'assets/img/bandanas.jpg');
    loadImage('worldmap', 'assets/img/world-map.webp');
    const wait = setInterval(function () {
      const keys = Object.keys(images);
      const done = keys.every(function (k) { return loaded[k] !== undefined; });
      if (done) {
        clearInterval(wait);
        ready = true;
        if (cb) cb();
      }
    }, 60);
    setTimeout(function () {
      clearInterval(wait);
      ready = true;
      if (cb) cb();
    }, 4500);
  }

  function img(key) {
    const i = images[key];
    return i && i.complete && i.naturalWidth ? i : null;
  }

  /* ---------------- Símbolos de aldea ---------------- */
  function symbol(ctx, type, x, y, size, color, lw) {
    ctx.save();
    ctx.translate(x, y);
    const s = size / 100;
    ctx.scale(s, s);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lw || 9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    switch (type) {
      case 'leaf': {
        // Espiral de Konoha con cola
        ctx.beginPath();
        ctx.arc(0, -2, 27, 0.5, Math.PI * 2.05, false);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(10, 25);
        ctx.quadraticCurveTo(30, 36, 41, 25);
        ctx.quadraticCurveTo(52, 13, 44, 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, -2, 12, 0.8, Math.PI * 2.1);
        ctx.stroke();
        break;
      }
      case 'sand': {
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(-22, -30); ctx.lineTo(22, -30);
        ctx.quadraticCurveTo(8, -8, 0, 0);
        ctx.quadraticCurveTo(-8, 8, -22, 30);
        ctx.lineTo(22, 30);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-17, -24); ctx.quadraticCurveTo(0, -10, 17, -24);
        ctx.moveTo(-17, 24); ctx.quadraticCurveTo(0, 10, 17, 24);
        ctx.stroke();
        break;
      }
      case 'mist': {
        ctx.lineWidth = 7;
        for (let i = 0; i < 4; i++) {
          const xx = -18 + i * 12;
          ctx.beginPath();
          ctx.moveTo(xx, -26);
          ctx.bezierCurveTo(xx + 10, -14, xx - 10, -2, xx, 10);
          ctx.bezierCurveTo(xx + 10, 20, xx - 6, 24, xx, 30);
          ctx.stroke();
        }
        break;
      }
      case 'cloud': {
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(-18, -4, 13, Math.PI * 0.7, Math.PI * 2.1);
        ctx.arc(0, -14, 16, Math.PI * 0.9, Math.PI * 2.15);
        ctx.arc(18, -2, 13, Math.PI * 0.95, Math.PI * 2.3);
        ctx.arc(8, 10, 12, Math.PI * 0.1, Math.PI * 1.2);
        ctx.stroke();
        break;
      }
      case 'stone': {
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(-28, -22); ctx.lineTo(28, -22);
        ctx.moveTo(-20, 4); ctx.lineTo(20, 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 18, 16, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-26, 2, 5, 0, Math.PI * 2);
        ctx.arc(26, 2, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'waterfall': {
        ctx.lineWidth = 7;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(i * 16, -28);
          ctx.bezierCurveTo(i * 16 + 8, -10, i * 16 - 8, 10, i * 16, 28);
          ctx.stroke();
        }
        break;
      }
      case 'sound': {
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.ellipse(-14, 20, 11, 8, -0.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-4, 20); ctx.lineTo(-4, -26);
        ctx.quadraticCurveTo(20, -24, 22, -4);
        ctx.stroke();
        break;
      }
      case 'rain': {
        ctx.lineWidth = 7;
        for (let i = 0; i < 4; i++) {
          const xx = -24 + i * 16;
          ctx.beginPath();
          ctx.moveTo(xx, -24); ctx.lineTo(xx, 24);
          ctx.stroke();
        }
        ctx.lineWidth = 5;
        for (let i = 0; i < 4; i++) {
          const xx = -24 + i * 16;
          ctx.beginPath();
          ctx.moveTo(xx - 8, 12); ctx.lineTo(xx + 8, 20);
          ctx.stroke();
        }
        break;
      }
      case 'grass': {
        ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(0, 28); ctx.lineTo(0, -26); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-2, 4); ctx.quadraticCurveTo(-28, -6, -30, -26); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(2, 10); ctx.quadraticCurveTo(28, 0, 30, -18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-2, -4); ctx.quadraticCurveTo(-18, -16, -16, -30); ctx.stroke();
        break;
      }
      case 'whirl': {
        ctx.lineWidth = 8;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, 8 + i * 9, i * 1.8, i * 1.8 + 4.6);
          ctx.stroke();
        }
        break;
      }
      default: {
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /* ---------------- Bandana ---------------- */
  function bandana(ctx, x, y, w, opts) {
    opts = opts || {};
    const h = w * 0.36;
    const village = opts.village || 'konoha';
    const symbolType = opts.symbol || 'leaf';
    const rank = opts.rank || 'genin';
    const scratched = !!opts.scratched;
    const rankIndex = Math.max(0, ['genin', 'chunin', 'jonin', 'anbu', 'kage'].indexOf(rank));
    const clothColors = ['#1c2b4a', '#173f33', '#2a2118', '#0d0d12', '#e9e9e9'];
    const plateColors = [['#d7dee5', '#8d99a5'], ['#d7dee5', '#8d99a5'], ['#dfc98e', '#9c7f42'], ['#c4c4d2', '#717181'], ['#efd98c', '#b28a2c']];
    const cloth = clothColors[rankIndex];
    const plate = plateColors[rankIndex];

    ctx.save();
    ctx.translate(x, y);
    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.ellipse(0, h * 0.12, w * 0.52, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tela
    const grd = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    grd.addColorStop(0, cloth);
    grd.addColorStop(0.48, lighten(cloth, 18));
    grd.addColorStop(1, cloth);
    ctx.fillStyle = grd;
    roundRect(ctx, -w / 2, -h / 2, w, h, h * 0.22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.35)';
    ctx.lineWidth = Math.max(1, w * 0.006);
    ctx.stroke();

    // Placa
    const pw = w * 0.46;
    const ph = h * 0.66;
    const pg = ctx.createLinearGradient(-pw / 2, -ph / 2, pw / 2, ph / 2);
    pg.addColorStop(0, plate[0]);
    pg.addColorStop(0.5, lighten(plate[0], 22));
    pg.addColorStop(1, plate[1]);
    ctx.fillStyle = pg;
    roundRect(ctx, -pw / 2, -ph / 2, pw, ph, ph * 0.18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,30,35,.65)';
    ctx.lineWidth = Math.max(1, w * 0.005);
    ctx.stroke();

    // Símbolo
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, -pw / 2, -ph / 2, pw, ph, ph * 0.18);
    ctx.clip();
    symbol(ctx, symbolType, 0, 0, ph * 0.66, '#26262c', Math.max(4, ph * 0.07));
    ctx.restore();

    // Remaches
    ctx.fillStyle = 'rgba(40,40,48,.7)';
    ctx.beginPath();
    ctx.arc(-pw * 0.39, 0, Math.max(1.2, w * 0.008), 0, Math.PI * 2);
    ctx.arc(pw * 0.39, 0, Math.max(1.2, w * 0.008), 0, Math.PI * 2);
    ctx.fill();

    // Rango: pips
    if (rankIndex > 0) {
      ctx.fillStyle = plate[1];
      for (let i = 0; i < rankIndex; i++) {
        ctx.beginPath();
        ctx.arc(-w * 0.34 + i * w * 0.045, h * 0.34, Math.max(1, w * 0.009), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Renegado: raya
    if (scratched) {
      ctx.strokeStyle = 'rgba(245,245,245,.9)';
      ctx.lineWidth = Math.max(2, w * 0.014);
      ctx.beginPath();
      ctx.moveTo(-pw * 0.36, -ph * 0.38);
      ctx.lineTo(pw * 0.36, ph * 0.38);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(120,30,30,.6)';
      ctx.lineWidth = Math.max(1, w * 0.005);
      ctx.beginPath();
      ctx.moveTo(-pw * 0.3, -ph * 0.46);
      ctx.lineTo(pw * 0.42, ph * 0.3);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------------- Personajes chibi ---------------- */
  const HAIR = {
    spiky: function (ctx, c, t, sway) {
      ctx.fillStyle = c.hair;
      ctx.strokeStyle = c.hair2 || c.hair;
      ctx.lineWidth = 2;
      // melena de fondo
      ctx.beginPath();
      ctx.arc(0, -92, 27, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();
      const spikes = 11;
      for (let i = 0; i < spikes; i++) {
        const a = Math.PI + (i / (spikes - 1)) * Math.PI;
        const r1 = 24;
        const r2 = 38 + (i % 3) * 5;
        const x1 = Math.cos(a) * r1;
        const y1 = -92 + Math.sin(a) * r1;
        const x2 = Math.cos(a - 0.08) * r2;
        const y2 = -92 + Math.sin(a - 0.08) * r2;
        const x3 = Math.cos(a + 0.14) * r2;
        const y3 = -92 + Math.sin(a + 0.14) * r2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.fill();
      }
      // flequillo
      ctx.beginPath();
      ctx.moveTo(-25, -104);
      ctx.quadraticCurveTo(-8, -116, 8, -108);
      ctx.quadraticCurveTo(22, -116, 25, -100);
      ctx.quadraticCurveTo(12, -102, 3, -95);
      ctx.quadraticCurveTo(-10, -102, -25, -96);
      ctx.closePath();
      ctx.fill();
    },
    duck: function (ctx, c) {
      ctx.fillStyle = c.hair;
      ctx.beginPath();
      ctx.arc(0, -94, 26, Math.PI * 0.85, Math.PI * 2.15);
      ctx.fill();
      // púas traseras
      ctx.beginPath();
      ctx.moveTo(-18, -112); ctx.lineTo(-34, -120); ctx.lineTo(-26, -102);
      ctx.lineTo(-36, -96); ctx.lineTo(-24, -88); ctx.closePath(); ctx.fill();
      // flequillo en pico
      ctx.beginPath();
      ctx.moveTo(-24, -104);
      ctx.quadraticCurveTo(-20, -78, -8, -86);
      ctx.quadraticCurveTo(-4, -108, 8, -108);
      ctx.quadraticCurveTo(4, -82, 18, -86);
      ctx.quadraticCurveTo(24, -108, 26, -104);
      ctx.quadraticCurveTo(6, -124, -24, -104);
      ctx.fill();
    },
    long: function (ctx, c) {
      ctx.fillStyle = c.hair2 || c.hair;
      ctx.beginPath();
      ctx.ellipse(0, -80, 30, 44, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c.hair;
      ctx.beginPath();
      ctx.arc(0, -94, 27, Math.PI * 0.85, Math.PI * 2.2);
      ctx.fill();
      // flequillo
      ctx.beginPath();
      ctx.moveTo(-26, -102);
      ctx.quadraticCurveTo(-18, -126, 0, -122);
      ctx.quadraticCurveTo(20, -126, 27, -102);
      ctx.quadraticCurveTo(18, -108, 12, -94);
      ctx.quadraticCurveTo(4, -108, -6, -94);
      ctx.quadraticCurveTo(-14, -108, -26, -102);
      ctx.fill();
      // mechones laterales
      ctx.beginPath();
      ctx.moveTo(-26, -100); ctx.quadraticCurveTo(-34, -66, -22, -50);
      ctx.quadraticCurveTo(-16, -74, -18, -92); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(26, -100); ctx.quadraticCurveTo(34, -66, 22, -50);
      ctx.quadraticCurveTo(16, -74, 18, -92); ctx.fill();
    },
    ponytail: function (ctx, c) {
      ctx.fillStyle = c.hair2 || c.hair;
      ctx.beginPath();
      ctx.ellipse(-4, -122, 12, 24, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c.hair;
      ctx.beginPath();
      ctx.arc(0, -95, 26, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-25, -102);
      ctx.quadraticCurveTo(-10, -120, 10, -112);
      ctx.quadraticCurveTo(24, -112, 26, -98);
      ctx.quadraticCurveTo(10, -102, 0, -92);
      ctx.quadraticCurveTo(-12, -102, -25, -95);
      ctx.fill();
      ctx.strokeStyle = c.hair2 || c.hair;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(-4, -116, 6, 0, Math.PI * 2);
      ctx.stroke();
    },
    twintails: function (ctx, c) {
      ctx.fillStyle = c.hair2 || c.hair;
      ctx.beginPath(); ctx.ellipse(-32, -78, 12, 28, 0.25, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(32, -78, 12, 28, -0.25, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c.hair;
      ctx.beginPath(); ctx.arc(0, -94, 26, Math.PI * 0.85, Math.PI * 2.15); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-26, -102);
      ctx.quadraticCurveTo(-16, -124, 2, -118);
      ctx.quadraticCurveTo(20, -124, 26, -102);
      ctx.quadraticCurveTo(12, -106, 4, -92);
      ctx.quadraticCurveTo(-8, -106, -26, -96);
      ctx.fill();
      ctx.beginPath(); ctx.arc(-30, -104, 10, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(30, -104, 10, 0, Math.PI * 2); ctx.fill();
    },
    buns: function (ctx, c) {
      ctx.fillStyle = c.hair;
      ctx.beginPath(); ctx.arc(0, -94, 26, Math.PI * 0.85, Math.PI * 2.15); ctx.fill();
      ctx.beginPath(); ctx.arc(-21, -117, 11, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(21, -117, 11, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-26, -102);
      ctx.quadraticCurveTo(-8, -116, 12, -108);
      ctx.quadraticCurveTo(24, -108, 26, -98);
      ctx.quadraticCurveTo(8, -102, -2, -92);
      ctx.quadraticCurveTo(-14, -100, -26, -96);
      ctx.fill();
    },
    bowl: function (ctx, c) {
      ctx.fillStyle = c.hair;
      ctx.beginPath();
      ctx.arc(0, -97, 28, Math.PI, Math.PI * 2);
      ctx.lineTo(26, -82);
      ctx.quadraticCurveTo(0, -74, -26, -82);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-27, -104, 54, 10);
      // brillo
      ctx.strokeStyle = 'rgba(255,255,255,.18)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -100, 19, Math.PI * 1.15, Math.PI * 1.6);
      ctx.stroke();
    },
    silver: function (ctx, c) {
      ctx.fillStyle = c.hair;
      ctx.beginPath();
      ctx.arc(0, -94, 27, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();
      const spikes = 9;
      for (let i = 0; i < spikes; i++) {
        const a = Math.PI + (i / (spikes - 1)) * Math.PI;
        const r2 = 38 + (i % 2) * 6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 23, -94 + Math.sin(a) * 23);
        ctx.lineTo(Math.cos(a - 0.09) * r2 - 5, -94 + Math.sin(a - 0.09) * r2 - 6);
        ctx.lineTo(Math.cos(a + 0.12) * r2, -94 + Math.sin(a + 0.12) * r2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(-26, -102);
      ctx.quadraticCurveTo(-12, -114, 6, -106);
      ctx.quadraticCurveTo(20, -112, 25, -98);
      ctx.quadraticCurveTo(10, -104, 0, -94);
      ctx.quadraticCurveTo(-12, -102, -26, -96);
      ctx.fill();
    },
    mane: function (ctx, c) {
      ctx.fillStyle = c.hair;
      ctx.beginPath();
      ctx.ellipse(0, -88, 38, 42, 0, 0, Math.PI * 2);
      ctx.fill();
      const spikes = 14;
      for (let i = 0; i < spikes; i++) {
        const a = Math.PI * 0.85 + (i / (spikes - 1)) * Math.PI * 1.3;
        const r2 = 48 + (i % 3) * 6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 30, -90 + Math.sin(a) * 30);
        ctx.lineTo(Math.cos(a - 0.12) * r2, -90 + Math.sin(a - 0.12) * r2);
        ctx.lineTo(Math.cos(a + 0.1) * r2, -90 + Math.sin(a + 0.1) * r2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = c.hair2 || c.hair;
      ctx.beginPath();
      ctx.moveTo(-30, -100);
      ctx.quadraticCurveTo(0, -126, 30, -100);
      ctx.quadraticCurveTo(8, -106, 0, -92);
      ctx.quadraticCurveTo(-10, -106, -30, -100);
      ctx.fill();
    },
    short: function (ctx, c) {
      ctx.fillStyle = c.hair;
      ctx.beginPath();
      ctx.arc(0, -95, 27, Math.PI * 0.82, Math.PI * 2.18);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-26, -100);
      ctx.quadraticCurveTo(-14, -121, 4, -115);
      ctx.quadraticCurveTo(18, -120, 26, -99);
      ctx.quadraticCurveTo(14, -104, 2, -92);
      ctx.quadraticCurveTo(-12, -104, -26, -94);
      ctx.fill();
    },
    bob: function (ctx, c) {
      ctx.fillStyle = c.hair;
      ctx.beginPath();
      ctx.arc(0, -92, 29, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(27, -68);
      ctx.quadraticCurveTo(0, -58, -27, -68);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-26, -102);
      ctx.quadraticCurveTo(-6, -120, 12, -108);
      ctx.quadraticCurveTo(24, -112, 26, -98);
      ctx.quadraticCurveTo(8, -104, -2, -92);
      ctx.quadraticCurveTo(-14, -100, -26, -94);
      ctx.fill();
    },
    hood: function (ctx, c) {
      ctx.fillStyle = c.outfit2 || '#2a2a33';
      ctx.beginPath();
      ctx.arc(0, -96, 32, Math.PI * 0.85, Math.PI * 2.15);
      ctx.fill();
      ctx.fillStyle = c.hair;
      ctx.beginPath();
      ctx.arc(0, -95, 24, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-24, -100);
      ctx.quadraticCurveTo(-8, -116, 10, -108);
      ctx.quadraticCurveTo(22, -110, 24, -98);
      ctx.quadraticCurveTo(8, -102, -2, -92);
      ctx.quadraticCurveTo(-14, -100, -24, -94);
      ctx.fill();
      // capucha borde
      ctx.strokeStyle = lighten(c.outfit2 || '#2a2a33', 22);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, -96, 31, Math.PI * 1.02, Math.PI * 1.98);
      ctx.stroke();
    },
    shark: function (ctx, c) {
      ctx.fillStyle = c.hair;
      ctx.beginPath();
      ctx.arc(0, -94, 28, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-26, -100); ctx.lineTo(-3, -120); ctx.lineTo(8, -98);
      ctx.lineTo(25, -108); ctx.lineTo(26, -92); ctx.closePath(); ctx.fill();
    }
  };

  function drawCharacter(ctx, data, x, y, scale, opt) {
    opt = opt || {};
    const c = data.art || data;
    const t = opt.time || 0;
    const walk = opt.walk || 0;
    const moving = !!opt.moving;
    const facing = opt.facing === -1 ? -1 : 1;
    const bob = moving ? Math.abs(Math.sin(walk * 2)) * 2.2 : Math.sin(t * 2.1) * 0.7;
    const hurt = opt.hurt || 0;
    const attack = opt.attack || 0;
    const aura = opt.aura;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    // sombra
    ctx.save();
    ctx.scale(1, 0.32);
    const sh = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
    sh.addColorStop(0, 'rgba(0,0,0,.42)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (aura) {
      ctx.save();
      const ag = ctx.createRadialGradient(0, -60, 8, 0, -60, 70);
      ag.addColorStop(0, hexA(aura, 0.22));
      ag.addColorStop(0.6, hexA(aura, 0.1));
      ag.addColorStop(1, hexA(aura, 0));
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.arc(0, -60, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.translate(0, -bob);
    ctx.scale(facing, 1);
    if (hurt > 0) ctx.filter = 'brightness(1.8) saturate(.4)';

    // ---- Accesorios detrás ----
    if (c.accessory === 'gaara') {
      ctx.save();
      ctx.translate(-16, -52);
      ctx.rotate(-0.2);
      const g = ctx.createLinearGradient(0, -30, 20, 30);
      g.addColorStop(0, '#c49a5e'); g.addColorStop(1, '#8c6335');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(0, 0, 17, 28, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#5e4323'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#2f2114';
      ctx.beginPath(); ctx.ellipse(0, -27, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    if (c.accessory === 'fan') {
      ctx.save();
      ctx.translate(-14, -58); ctx.rotate(-0.3);
      ctx.fillStyle = '#6b5a8e';
      ctx.beginPath(); ctx.ellipse(0, 0, 15, 34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d7c74a'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }
    if (c.accessory === 'scroll') {
      ctx.save();
      ctx.translate(-15, -48); ctx.rotate(-0.35);
      ctx.fillStyle = '#e2d2a8';
      ctx.fillRect(-5, -30, 10, 46);
      ctx.fillStyle = '#b23a33';
      ctx.fillRect(-6, -32, 12, 6); ctx.fillRect(-6, 14, 12, 6);
      ctx.restore();
    }
    if (c.accessory === 'sunglasses' || c.accessory === 'seven') {
      for (let i = 0; i < 7; i++) {
        ctx.save();
        ctx.translate(-18 + (i % 4) * 11, -60 + Math.floor(i / 4) * 7);
        ctx.rotate(-0.5 + i * 0.08);
        ctx.fillStyle = '#4a4a55';
        ctx.fillRect(-2, -34, 4, 40);
        ctx.fillStyle = '#d7d7de';
        ctx.fillRect(-5, -40, 10, 4);
        ctx.restore();
      }
    }
    if (c.accessory === 'coat') {
      ctx.fillStyle = '#f0ede4';
      ctx.beginPath();
      ctx.moveTo(-20, -76); ctx.lineTo(-40, -12); ctx.lineTo(-20, -10);
      ctx.lineTo(-10, -66); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d64535';
      ctx.beginPath();
      ctx.moveTo(-26, -26); ctx.quadraticCurveTo(-16, -34, -10, -14);
      ctx.lineTo(-20, -10); ctx.closePath(); ctx.fill();
    }

    // ---- Piernas ----
    const bodyW = c.build === 'slim' ? 30 : c.build === 'broad' ? 44 : 36;
    const halfW = bodyW / 2;
    const legSpread = c.build === 'broad' ? 9 : c.build === 'slim' ? 6 : 7.5;
    const legSwing = moving ? Math.sin(walk * 2) * 9 : 0;
    ctx.lineCap = 'round';
    ctx.strokeStyle = c.outfit2 || '#1e2430';
    ctx.lineWidth = c.build === 'broad' ? 11.5 : c.build === 'slim' ? 9 : 10;
    ctx.beginPath();
    ctx.moveTo(-legSpread, -34); ctx.lineTo(-legSpread - 1 + legSwing * 0.7, -4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(legSpread, -34); ctx.lineTo(legSpread + 1 - legSwing * 0.7, -4);
    ctx.stroke();
    // sandalias
    ctx.fillStyle = '#2c2c34';
    ctx.beginPath(); ctx.ellipse(-legSpread - 1 + legSwing * 0.7, -2, 7, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(legSpread + 1 - legSwing * 0.7, -2, 7, 3.5, 0, 0, Math.PI * 2); ctx.fill();

    // ---- Torso ----
    const tg = ctx.createLinearGradient(0, -78, 0, -30);
    tg.addColorStop(0, lighten(c.outfit, 12));
    tg.addColorStop(1, c.outfit);
    ctx.fillStyle = tg;
    roundRect(ctx, -halfW, -78, bodyW, 46, 9);
    ctx.fill();
    // cuello / camiseta
    ctx.fillStyle = c.outfit2 || '#1b1b22';
    ctx.beginPath();
    ctx.moveTo(-Math.min(13, halfW - 5), -78); ctx.lineTo(0, -66); ctx.lineTo(Math.min(13, halfW - 5), -78);
    ctx.lineTo(Math.min(9, halfW - 8), -84); ctx.lineTo(0, -76); ctx.lineTo(-Math.min(9, halfW - 8), -84);
    ctx.closePath(); ctx.fill();
    // cremallera / detalles
    ctx.strokeStyle = hexA(c.trim || '#ffffff', 0.75);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -67); ctx.lineTo(0, -34);
    ctx.stroke();
    if (c.accessory === 'midriff') {
      ctx.fillStyle = c.skin || '#f4d2ba';
      ctx.fillRect(-halfW, -40, bodyW, 8);
    }
    // cinturón
    ctx.fillStyle = c.outfit2 || '#1b1b22';
    ctx.fillRect(-halfW, -38, bodyW, 6);
    ctx.fillStyle = '#c9c9d4';
    ctx.fillRect(-4, -39, 8, 8);

    // ---- Brazos ----
    const armSwing = moving ? Math.sin(walk * 2 + Math.PI) * 10 : 0;
    const shoulderX = halfW - 2;
    const handX = halfW + 4;
    ctx.strokeStyle = c.outfit;
    ctx.lineWidth = c.build === 'broad' ? 9 : 8;
    ctx.beginPath();
    ctx.moveTo(-shoulderX, -72);
    ctx.lineTo(-handX - armSwing * 0.4, -48);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(shoulderX, -72);
    ctx.lineTo(handX + armSwing * 0.4, -48);
    ctx.stroke();
    // manos
    ctx.fillStyle = c.skin || '#f2c6a0';
    ctx.beginPath(); ctx.arc(-handX - armSwing * 0.4, -46, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(handX + armSwing * 0.4, -46, 4.5, 0, Math.PI * 2); ctx.fill();

    // puño de ataque
    if (attack > 0) {
      ctx.save();
      ctx.translate(22, -54);
      ctx.rotate(-1.1);
      ctx.strokeStyle = c.outfit;
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -26); ctx.stroke();
      ctx.fillStyle = c.skin || '#f2c6a0';
      ctx.beginPath(); ctx.arc(0, -29, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // ---- Cabeza ----
    ctx.fillStyle = c.skin || '#f2c6a0';
    ctx.beginPath();
    ctx.arc(0, -94, 23, 0, Math.PI * 2);
    ctx.fill();
    // orejas
    const earR = c.ears === 1 ? 3.1 : 4;
    ctx.beginPath(); ctx.arc(-22, -92, earR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(22, -92, earR, 0, Math.PI * 2); ctx.fill();

    // pelo
    const hairFn = HAIR[c.style] || HAIR.short;
    hairFn(ctx, c, t, 0);

    // ---- Rostro ----
    // ojos
    const eyeY = -93;
    const eyeX = 8.5;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(-eyeX, eyeY, 4.6, 5.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(eyeX, eyeY, 4.6, 5.4, 0, 0, Math.PI * 2); ctx.fill();
    let iris = c.eye || '#3a3a46';
    if (c.accessory === 'sharingan') iris = '#c62e2e';
    if (c.accessory === 'rinnegan') iris = '#9a7ad6';
    if (c.accessory === 'byakugan') iris = '#e8eef4';
    ctx.fillStyle = iris;
    ctx.beginPath(); ctx.arc(-eyeX, eyeY + 0.4, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeX, eyeY + 0.4, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#16161c';
    if ((c.pupils || 0) === 1) {
      [-eyeX, eyeX].forEach(function (ex) {
        ctx.beginPath(); ctx.ellipse(ex, eyeY + 0.4, 0.8, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      });
    } else if ((c.pupils || 0) === 2) {
      [-eyeX, eyeX].forEach(function (ex) {
        ctx.beginPath(); ctx.arc(ex, eyeY + 0.4, 1.35, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = lighten(iris, 55);
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.arc(ex, eyeY + 0.4, 2.1, 0, Math.PI * 2); ctx.stroke();
      });
    } else {
      ctx.beginPath(); ctx.arc(-eyeX, eyeY + 0.4, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(eyeX, eyeY + 0.4, 1.2, 0, Math.PI * 2); ctx.fill();
    }
    if (c.accessory === 'sharingan') {
      ctx.fillStyle = '#1a1a1a';
      [-eyeX, eyeX].forEach(function (ex) {
        for (let i = 0; i < 3; i++) {
          const a = i * Math.PI * 2 / 3;
          ctx.beginPath();
          ctx.arc(ex + Math.cos(a) * 1.8, eyeY + 0.4 + Math.sin(a) * 1.8, 0.55, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
    if (c.accessory === 'byakugan') {
      ctx.strokeStyle = 'rgba(160,180,200,.8)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(-eyeX, eyeY, 3.4, 0, Math.PI * 2);
      ctx.arc(eyeX, eyeY, 3.4, 0, Math.PI * 2);
      ctx.stroke();
    }
    // cejas
    ctx.strokeStyle = c.hair2 || c.hair;
    ctx.lineWidth = c.accessory === 'brows' ? 3.2 : 1.6;
    ctx.beginPath();
    if (c.accessory === 'brows') {
      ctx.moveTo(-13, -101); ctx.quadraticCurveTo(-8, -104, -4, -100);
      ctx.moveTo(4, -100); ctx.quadraticCurveTo(8, -104, 13, -101);
    } else {
      ctx.moveTo(-13, -100); ctx.lineTo(-5, -99);
      ctx.moveTo(5, -99); ctx.lineTo(13, -100);
    }
    ctx.stroke();

    // nariz
    ctx.strokeStyle = 'rgba(150,92,72,.55)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    if (c.nose === 1) {
      ctx.moveTo(-1, -89); ctx.lineTo(1.4, -86.5);
    } else if (c.nose === 2) {
      ctx.moveTo(-2.4, -87.2); ctx.quadraticCurveTo(0, -85.8, 2.4, -87.2);
    } else {
      ctx.moveTo(0, -88.5); ctx.lineTo(0.8, -86.8);
    }
    ctx.stroke();

    // boca
    ctx.strokeStyle = '#8a5a54';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    if (c.accessory === 'fangs') {
      ctx.moveTo(-4, -82); ctx.quadraticCurveTo(0, -79, 4, -82);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(-3, -82); ctx.lineTo(-1.5, -78); ctx.lineTo(0, -82); ctx.fill();
      ctx.beginPath(); ctx.moveTo(1, -82); ctx.lineTo(2.5, -78); ctx.lineTo(4, -82); ctx.fill();
    } else if (c.mouth === 1) {
      ctx.moveTo(-3.2, -81.5); ctx.lineTo(3.2, -81.5);
      ctx.stroke();
    } else if (c.mouth === 2) {
      ctx.moveTo(-3.6, -80.4); ctx.quadraticCurveTo(0, -83, 3.6, -80.4);
      ctx.stroke();
    } else {
      ctx.moveTo(-3.5, -82); ctx.quadraticCurveTo(0, -80.5, 3.5, -82);
      ctx.stroke();
    }

    // rasgos
    if (c.accessory === 'whiskers') {
      ctx.strokeStyle = 'rgba(150,95,70,.75)';
      ctx.lineWidth = 1.1;
      [-1, 1].forEach(function (side) {
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(side * 13, -91 + i * 3.4);
          ctx.lineTo(side * 19, -92 + i * 3.8);
          ctx.stroke();
        }
      });
    }
    if (c.accessory === 'gaara') {
      ctx.strokeStyle = 'rgba(70,50,45,.65)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.ellipse(-eyeX, eyeY, 6.4, 7.2, 0, 0, Math.PI * 2);
      ctx.ellipse(eyeX, eyeY, 6.4, 7.2, 0, 0, Math.PI * 2);
      ctx.stroke();
      // tatuaje 愛
      ctx.strokeStyle = '#b23a33';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-16, -110); ctx.lineTo(-6, -110);
      ctx.moveTo(-11, -114); ctx.lineTo(-11, -102);
      ctx.moveTo(-15, -104); ctx.lineTo(-7, -104);
      ctx.stroke();
    }
    if (c.accessory === 'paint') {
      ctx.strokeStyle = '#7a4b8c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-19, -98); ctx.quadraticCurveTo(-10, -88, -15, -80);
      ctx.moveTo(19, -98); ctx.quadraticCurveTo(10, -88, 15, -80);
      ctx.stroke();
    }
    if (c.accessory === 'diamond') {
      ctx.fillStyle = '#7a4bb5';
      ctx.beginPath();
      ctx.moveTo(0, -114); ctx.lineTo(4, -109); ctx.lineTo(0, -104); ctx.lineTo(-4, -109);
      ctx.closePath(); ctx.fill();
    }
    if (c.accessory === 'horns') {
      ctx.fillStyle = '#efe6ec';
      ctx.beginPath();
      ctx.moveTo(-16, -112); ctx.lineTo(-25, -132); ctx.lineTo(-9, -118); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(16, -112); ctx.lineTo(25, -132); ctx.lineTo(9, -118); ctx.closePath(); ctx.fill();
    }

    // máscara
    if (c.accessory === 'mask') {
      ctx.fillStyle = '#2a2f38';
      ctx.beginPath();
      ctx.arc(0, -94, 23, 0.15, Math.PI - 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.06)';
      ctx.beginPath();
      ctx.arc(0, -92, 22, 0.2, Math.PI - 0.3);
      ctx.closePath(); ctx.fill();
    }
    if (c.accessory === 'bandage') {
      ctx.fillStyle = '#e8e0d0';
      ctx.beginPath();
      ctx.arc(0, -94, 23, -0.2, Math.PI + 0.2);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(120,110,95,.5)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(-20, -100 + i * 6); ctx.lineTo(20, -102 + i * 6); ctx.stroke();
      }
      ctx.fillStyle = '#2a2a33';
      ctx.beginPath(); ctx.arc(eyeX, eyeY, 4, 0, Math.PI * 2); ctx.fill();
    }
    if (c.accessory === 'glasses' || c.accessory === 'sunglasses' || c.accessory === 'scope') {
      ctx.strokeStyle = '#1b1b22';
      ctx.lineWidth = 1.8;
      ctx.fillStyle = c.accessory === 'sunglasses' ? '#15151c' : 'rgba(140,200,230,.35)';
      ctx.beginPath(); ctx.ellipse(-eyeX, eyeY, 7, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(eyeX, eyeY, 7, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-2, eyeY); ctx.lineTo(2, eyeY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-15, eyeY); ctx.lineTo(-21, eyeY - 2); ctx.moveTo(15, eyeY); ctx.lineTo(21, eyeY - 2); ctx.stroke();
    }

    // ---- Banda ninja ----
    if (c.band !== false) {
      ctx.fillStyle = c.band || '#1c2b4a';
      roundRect(ctx, -24, -108, 48, 8, 2.5);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.35)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // placa
      const px = -11, py = -111;
      const pg = ctx.createLinearGradient(px, py, px + 22, py + 12);
      pg.addColorStop(0, '#e4e9ee'); pg.addColorStop(0.5, '#b4bcc4'); pg.addColorStop(1, '#7e8892');
      ctx.fillStyle = pg;
      roundRect(ctx, px, py, 22, 12, 2.5);
      ctx.fill();
      ctx.strokeStyle = '#5d6670';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // símbolo de la aldea
      symbol(ctx, c.villageSymbol || 'leaf', px + 11, py + 6, 10, '#2a2a30', 2.2);
      // rasguño de renegado
      if (c.scratched) {
        ctx.strokeStyle = 'rgba(250,250,250,.9)';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(px + 2, py + 10); ctx.lineTo(px + 20, py + 2); ctx.stroke();
      }
    }

    // hombrera / capa
    if (c.accessory === 'plate') {
      ctx.fillStyle = '#c9d2da';
      roundRect(ctx, -24, -78, 12, 10, 3); ctx.fill();
      ctx.fillStyle = '#8d99a5';
      roundRect(ctx, -23, -77, 10, 8, 2); ctx.fill();
    }

    ctx.restore();
  }

  /* ---------------- Retratos ---------------- */
  function drawPortrait(ctx, key, x, y, w, h, radius) {
    const im = img(key);
    ctx.save();
    roundRect(ctx, x, y, w, h, radius || 0);
    ctx.clip();
    if (im) {
      const ir = im.width / im.height;
      const r = w / h;
      let sx = 0, sy = 0, sw = im.width, sh = im.height;
      if (ir > r) { sw = im.height * r; sx = (im.width - sw) / 2; }
      else { sh = im.width / r; sy = Math.max(0, (im.height - sh) * 0.25); }
      ctx.drawImage(im, sx, sy, sw, sh, x, y, w, h);
    } else {
      ctx.fillStyle = '#1a1c24';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#3b3f4d';
      ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.42, w * 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x + w * 0.3, y + h * 0.6, w * 0.4, h * 0.35);
    }
    ctx.restore();
  }

  /* ---------------- Escenas ---------------- */
  const LEAVES = [];
  for (let i = 0; i < 42; i++) {
    LEAVES.push({ x: Math.random(), y: Math.random(), s: 0.4 + Math.random() * 0.9, v: 0.02 + Math.random() * 0.05, p: Math.random() * 6.28 });
  }

  function drawLeaves(ctx, w, h, t) {
    ctx.save();
    for (let i = 0; i < LEAVES.length; i++) {
      const l = LEAVES[i];
      const x = ((l.x + t * l.v * 0.06) % 1.1) * w;
      const y = ((l.y + t * l.v * 0.12) % 1.1) * h;
      const s = l.s;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * 0.7 + l.p);
      ctx.fillStyle = i % 4 === 0 ? 'rgba(255,170,70,.55)' : i % 3 === 0 ? 'rgba(120,170,80,.45)' : 'rgba(210,200,160,.32)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 5 * s, 2.4 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawKonohaBackdrop(ctx, w, h, t, zoom) {
    const im = img('konoha');
    ctx.save();
    const z = zoom || 1.05;
    if (im) {
      const ir = im.width / im.height, r = w / h;
      let sw = im.width, sh = im.height, sx = 0, sy = 0;
      if (ir > r) { sw = im.height * r; sx = (im.width - sw) / 2; }
      else { sh = im.width / r; sy = (im.height - sh) / 2; }
      ctx.drawImage(im, sx, sy, sw, sh, -w * (z - 1) / 2, -h * (z - 1) / 2, w * z, h * z);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#4878a8'); g.addColorStop(0.6, '#e0a05a'); g.addColorStop(1, '#2a3326');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    // calidez / vignette
    const v = ctx.createRadialGradient(w * 0.5, h * 0.45, h * 0.2, w * 0.5, h * 0.5, h * 0.95);
    v.addColorStop(0, 'rgba(255,150,60,.05)');
    v.addColorStop(1, 'rgba(5,8,12,.78)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  function cloud(ctx, x, y, s, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 0.5 : alpha;
    ctx.fillStyle = color || '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 24 * s, 0, Math.PI * 2);
    ctx.arc(x + 28 * s, y - 12 * s, 30 * s, 0, Math.PI * 2);
    ctx.arc(x + 62 * s, y, 22 * s, 0, Math.PI * 2);
    ctx.arc(x + 34 * s, y + 12 * s, 24 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawScene(ctx, scene, w, h, t, mood) {
    ctx.clearRect(0, 0, w, h);
    if (scene === 'village') {
      drawKonohaBackdrop(ctx, w, h, t, 1.04 + Math.sin(t * 0.12) * 0.01);
      drawLeaves(ctx, w, h, t);
      return;
    }
    if (scene === 'street') {
      // cielo atardecer
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, mood === 'rain' ? '#2a3440' : '#35405e');
      g.addColorStop(0.45, mood === 'rain' ? '#4a5a66' : '#c96a4a');
      g.addColorStop(1, '#1a1e24');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // luna
      ctx.fillStyle = 'rgba(240,235,220,.8)';
      ctx.beginPath(); ctx.arc(w * 0.78, h * 0.2, 32, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(15,18,24,.9)';
      ctx.beginPath(); ctx.arc(w * 0.78 + 14, h * 0.2 - 8, 30, 0, Math.PI * 2); ctx.fill();
      // casas silueta
      for (let i = 0; i < 8; i++) {
        const bw = 110 + (i % 3) * 50;
        const bh = 150 + ((i * 47) % 100);
        const x = i * 150 - 40;
        const y = h - 130 - bh;
        ctx.fillStyle = i % 2 ? '#171b22' : '#1e232b';
        ctx.fillRect(x, y, bw, bh + 130);
        ctx.beginPath();
        ctx.moveTo(x - 20, y);
        ctx.lineTo(x + bw / 2, y - 60);
        ctx.lineTo(x + bw + 20, y);
        ctx.closePath();
        ctx.fillStyle = '#11151b';
        ctx.fill();
        // ventanas
        for (let j = 0; j < 3; j++) {
          if ((i + j) % 3 === 0) continue;
          ctx.fillStyle = 'rgba(255,170,80,' + (0.35 + 0.25 * Math.sin(t + i + j)) + ')';
          ctx.fillRect(x + 20 + j * 32, y + 24, 18, 22);
        }
      }
      // suelo
      ctx.fillStyle = '#14181e';
      ctx.fillRect(0, h - 120, w, 120);
      // niebla / lluvia
      if (mood === 'rain') {
        ctx.strokeStyle = 'rgba(160,190,210,.25)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 90; i++) {
          const rx = (i * 137 + t * 120) % w;
          const ry = (i * 91 + t * 380) % h;
          ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 5, ry + 18); ctx.stroke();
        }
      }
      // siluetas de aldeanos
      drawSilhouette(ctx, w * 0.2, h * 0.82, 1, 0.9);
      drawSilhouette(ctx, w * 0.66, h * 0.86, 1.2, 0.9);
      drawSilhouette(ctx, w * 0.48, h * 0.88, 0.9, 0.9);
      ctx.fillStyle = 'rgba(5,8,12,.35)';
      ctx.fillRect(0, 0, w, h);
      return;
    }
    if (scene === 'academy') {
      // interior de madera
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#3a2a1e');
      g.addColorStop(1, '#1c1410');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // ventanas shoji
      for (let i = 0; i < 3; i++) {
        const x = w * 0.62 + i * 130;
        ctx.fillStyle = mood === 'rain' ? 'rgba(100,140,165,.35)' : 'rgba(255,214,150,.55)';
        ctx.fillRect(x, h * 0.12, 100, h * 0.42);
        ctx.strokeStyle = '#5a3d28';
        ctx.lineWidth = 6;
        ctx.strokeRect(x, h * 0.12, 100, h * 0.42);
        ctx.lineWidth = 3;
        for (let j = 1; j < 4; j++) {
          ctx.beginPath(); ctx.moveTo(x + j * 25, h * 0.12); ctx.lineTo(x + j * 25, h * 0.54); ctx.stroke();
        }
        for (let j = 1; j < 4; j++) {
          ctx.beginPath(); ctx.moveTo(x, h * 0.12 + j * h * 0.105); ctx.lineTo(x + 100, h * 0.12 + j * h * 0.105); ctx.stroke();
        }
      }
      // pizarra
      ctx.fillStyle = '#24302a';
      ctx.fillRect(w * 0.08, h * 0.15, w * 0.35, h * 0.3);
      ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 10;
      ctx.strokeRect(w * 0.08, h * 0.15, w * 0.35, h * 0.3);
      ctx.fillStyle = 'rgba(230,230,220,.7)';
      ctx.font = 'bold ' + Math.round(w * 0.035) + 'px "Yu Gothic", sans-serif';
      ctx.fillText('忍', w * 0.1, h * 0.27);
      ctx.font = Math.round(w * 0.014) + 'px Rajdhani, sans-serif';
      ctx.fillText('La Voluntad del Fuego', w * 0.1, h * 0.35);
      ctx.fillText('1. Proteger a los compañeros', w * 0.1, h * 0.39);
      ctx.fillText('2. Nunca abandonar la misión', w * 0.1, h * 0.425);
      // suelo
      ctx.fillStyle = '#2e2118';
      ctx.fillRect(0, h * 0.62, w, h * 0.38);
      for (let i = 0; i < 12; i++) {
        ctx.strokeStyle = 'rgba(0,0,0,.25)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, h * 0.64 + i * 22); ctx.lineTo(w, h * 0.64 + i * 22); ctx.stroke();
      }
      // mesas
      for (let i = 0; i < 4; i++) {
        const x = 80 + i * 210;
        const y = h * 0.7 + (i % 2) * 40;
        ctx.fillStyle = '#4a3424';
        ctx.fillRect(x, y, 120, 16);
        ctx.fillRect(x + 10, y + 16, 8, 40);
        ctx.fillRect(x + 100, y + 16, 8, 40);
      }
      // luz
      const lg = ctx.createRadialGradient(w * 0.7, h * 0.2, 20, w * 0.7, h * 0.2, h * 0.9);
      lg.addColorStop(0, mood === 'rain' ? 'rgba(120,160,190,.18)' : 'rgba(255,200,120,.28)');
      lg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = lg; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 0, w, h);
      if (mood === 'rain') {
        ctx.strokeStyle = 'rgba(160,190,210,.18)';
        for (let i = 0; i < 50; i++) {
          const rx = (i * 131 + t * 80) % w;
          const ry = (i * 73 + t * 300) % h;
          ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 4, ry + 14); ctx.stroke();
        }
      }
      return;
    }
    if (scene === 'monument') {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#1e2a3e');
      g.addColorStop(0.45, '#b06a4a');
      g.addColorStop(1, '#1a1c1e');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // sol
      ctx.fillStyle = 'rgba(255,180,90,.75)';
      ctx.beginPath(); ctx.arc(w * 0.5, h * 0.5, h * 0.16, 0, Math.PI * 2); ctx.fill();
      // montaña
      ctx.fillStyle = '#4a3a2e';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.58);
      ctx.lineTo(w * 0.18, h * 0.34);
      ctx.lineTo(w * 0.33, h * 0.5);
      ctx.lineTo(w * 0.5, h * 0.27);
      ctx.lineTo(w * 0.66, h * 0.48);
      ctx.lineTo(w * 0.82, h * 0.35);
      ctx.lineTo(w, h * 0.6);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath(); ctx.fill();
      // rostros de los hokage
      const faces = [0.28, 0.42, 0.56, 0.7];
      faces.forEach(function (fx, i) {
        const x = w * fx, y = h * 0.52 + (i % 2) * 18;
        ctx.fillStyle = '#6a5342';
        ctx.beginPath(); ctx.ellipse(x, y, 38, 50, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3a2e26';
        ctx.beginPath(); ctx.ellipse(x - 13, y - 6, 7, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 13, y - 6, 7, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y + 20, 12, 0, Math.PI); ctx.fill();
        ctx.fillStyle = 'rgba(255,220,180,.1)';
        ctx.beginPath(); ctx.ellipse(x - 10, y - 14, 20, 24, 0.4, 0, Math.PI * 2); ctx.fill();
      });
      // aldea abajo
      ctx.fillStyle = '#1e2224';
      for (let i = 0; i < 30; i++) {
        const bx = (i * 73) % w;
        const bh = 20 + (i % 4) * 12;
        ctx.fillRect(bx, h * 0.76 - bh, 30, bh + 60);
      }
      // pájaros
      ctx.strokeStyle = 'rgba(20,20,24,.75)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const bx = (t * 18 + i * 160) % (w + 80) - 40;
        const by = h * 0.2 + Math.sin(t + i) * 12;
        ctx.beginPath();
        ctx.moveTo(bx - 7, by); ctx.quadraticCurveTo(bx, by - 5, bx + 7, by);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(8,10,14,.28)'; ctx.fillRect(0, 0, w, h);
      drawLeaves(ctx, w, h, t);
      return;
    }
    if (scene === 'forest') {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#101a18'); g.addColorStop(1, '#1e2a1e');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // luna
      ctx.fillStyle = 'rgba(220,235,220,.5)';
      ctx.beginPath(); ctx.arc(w * 0.72, h * 0.18, 50, 0, Math.PI * 2); ctx.fill();
      // árboles
      for (let i = 0; i < 12; i++) {
        const x = i * (w / 11) + (i % 3) * 18;
        const tw = 26 + (i % 4) * 10;
        ctx.fillStyle = i % 2 ? '#1a241c' : '#141e18';
        ctx.fillRect(x, h * 0.2, tw, h * 0.8);
        ctx.beginPath();
        ctx.arc(x + tw / 2, h * 0.2, 80 + (i % 3) * 20, 0, Math.PI * 2);
        ctx.fill();
      }
      // fuegos artificiales de luciérnagas
      for (let i = 0; i < 35; i++) {
        const fx = (i * 191 + Math.sin(t + i) * 40) % w;
        const fy = (i * 97 + Math.cos(t * 0.7 + i) * 30) % h;
        const a = 0.3 + 0.5 * Math.abs(Math.sin(t * 2 + i));
        ctx.fillStyle = 'rgba(190,240,140,' + a + ')';
        ctx.beginPath(); ctx.arc(fx, fy, 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(4,8,6,.3)'; ctx.fillRect(0, 0, w, h);
      return;
    }
    drawArenaBackdrop(ctx, scene, w, h, t);
  }

  /* ---------------- Escenarios de combate ---------------- */
  const ARENAS = {
    hoja: { sky: ['#16233a', '#445f74', '#0d141c'], ground: '#263d29', ground2: '#1c2f21', accent: '#e8bb4e', style: 'village', particles: 'leaves' },
    academia: { sky: ['#2a1e1a', '#8a5a3a', '#160f0c'], ground: '#3a2a1e', ground2: '#291d15', accent: '#ffc878', style: 'academy', particles: 'dust' },
    bosque: { sky: ['#0d1a18', '#2b4a3a', '#050c0a'], ground: '#1d2f20', ground2: '#15241a', accent: '#9ed36a', style: 'forest', particles: 'fireflies' },
    camino: { sky: ['#2a3346', '#c98a5a', '#141820'], ground: '#4a3d2c', ground2: '#352b20', accent: '#ffb066', style: 'road', particles: 'dust' },
    puente: { sky: ['#1b2a3a', '#5a7a8a', '#0b1218'], ground: '#4a4a52', ground2: '#33333a', accent: '#8fd4e8', style: 'bridge', particles: 'rain' },
    arena: { sky: ['#26303a', '#8a6a4a', '#14181c'], ground: '#5a4a3a', ground2: '#3f3428', accent: '#ffd27a', style: 'arena', particles: 'dust' },
    valle: { sky: ['#20283a', '#775a6a', '#10141c'], ground: '#2a3a42', ground2: '#1d2a30', accent: '#a8d8e8', style: 'valley', particles: 'rain' },
    desierto: { sky: ['#3a2a1e', '#e8b06a', '#241810'], ground: '#c49a5e', ground2: '#a87c46', accent: '#ffe0a0', style: 'desert', particles: 'sand' },
    cueva: { sky: ['#140f1c', '#3a2a4a', '#08060c'], ground: '#2a2233', ground2: '#1c1624', accent: '#b47aff', style: 'cave', particles: 'dust' },
    mar: { sky: ['#0d1c2a', '#2f6a8a', '#061018'], ground: '#1a4252', ground2: '#12323f', accent: '#7ae0e8', style: 'sea', particles: 'rain' },
    montana: { sky: ['#1c2430', '#6a7a8a', '#0d1218'], ground: '#3a4048', ground2: '#282e36', accent: '#d8e8f4', style: 'mountain', particles: 'snow' },
    ruinas: { sky: ['#1a1e26', '#5a5a62', '#0c0e12'], ground: '#35343a', ground2: '#26252a', accent: '#b0a88a', style: 'ruins', particles: 'ash' },
    templo: { sky: ['#2a1e1a', '#b06a4a', '#140e0c'], ground: '#40322a', ground2: '#2d231e', accent: '#ffb060', style: 'temple', particles: 'petals' },
    guerra: { sky: ['#28161a', '#a84a3a', '#12080a'], ground: '#3a2a26', ground2: '#2a1d1a', accent: '#ff7a4a', style: 'war', particles: 'ash' },
    kaguya: { sky: ['#1a1626', '#8a7ab0', '#0a0812'], ground: '#4a3a5a', ground2: '#342a42', accent: '#e8d8ff', style: 'moon', particles: 'petals' },
    cumbre: { sky: ['#1c2838', '#6a8aa8', '#0d141c'], ground: '#4a4a52', ground2: '#34343c', accent: '#d8e8f4', style: 'summit', particles: 'snow' },
    isla: { sky: ['#0d2a34', '#3a9a9a', '#061418'], ground: '#c4b47a', ground2: '#9a8a5a', accent: '#ffe08a', style: 'island', particles: 'leaves' },
    canon: { sky: ['#2a2226', '#a87a5a', '#140f12'], ground: '#7a5a42', ground2: '#5a4030', accent: '#ffcf8a', style: 'canyon', particles: 'dust' },
    prision: { sky: ['#1a2026', '#4a5a66', '#0a0e12'], ground: '#3a4048', ground2: '#282e34', accent: '#a8c4d4', style: 'prison', particles: 'dust' },
    mansion: { sky: ['#1a1420', '#5a3a5a', '#0c0810'], ground: '#3a2a3a', ground2: '#281c2a', accent: '#d8a8e8', style: 'mansion', particles: 'petals' },
    cielo: { sky: ['#1a2440', '#c98a5a', '#0c1018'], ground: '#3a3a4a', ground2: '#282836', accent: '#ffe0a0', style: 'sky', particles: 'leaves' },
    nieve: { sky: ['#26303c', '#b8c8d8', '#141a20'], ground: '#e8eef4', ground2: '#c4d0da', accent: '#ffffff', style: 'snow', particles: 'snow' }
  };

  const ARENA_ALIASES = { 'montaña': 'montana', 'mansión': 'mansion', 'cañon': 'canon' };

  function drawArenaBackdrop(ctx, theme, w, h, t) {
    const a = ARENAS[theme] || ARENAS[ARENA_ALIASES[theme]] || ARENAS.hoja;
    const horizon = h * 0.6;
    ctx.clearRect(0, 0, w, h);

    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, a.sky[0]);
    sky.addColorStop(0.62, a.sky[1]);
    sky.addColorStop(1, a.sky[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, horizon + 2);

    // astro
    const sunX = w * 0.72, sunY = horizon * 0.42;
    const sg = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, h * 0.32);
    sg.addColorStop(0, hexA(a.accent, 0.85));
    sg.addColorStop(0.18, hexA(a.accent, 0.24));
    sg.addColorStop(1, hexA(a.accent, 0));
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(sunX, sunY, h * 0.32, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hexA(a.accent, 0.55);
    ctx.beginPath(); ctx.arc(sunX, sunY, h * 0.055, 0, Math.PI * 2); ctx.fill();

    // nubes estilizadas
    ctx.fillStyle = 'rgba(255,255,255,.05)';
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 353 + t * (4 + i)) % (w + 400)) - 200;
      const cy = horizon * (0.18 + (i % 3) * 0.12);
      ctx.beginPath();
      ctx.ellipse(cx, cy, 90 + i * 22, 12 + (i % 2) * 6, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 70, cy + 6, 60 + i * 14, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // fondo lejano
    if (a.style === 'village' || a.style === 'academy') {
      ctx.fillStyle = '#1a2420';
      ctx.beginPath();
      ctx.moveTo(0, horizon);
      ctx.lineTo(0, horizon * 0.72);
      ctx.quadraticCurveTo(w * 0.22, horizon * 0.62, w * 0.36, horizon * 0.76);
      ctx.quadraticCurveTo(w * 0.55, horizon * 0.58, w * 0.72, horizon * 0.74);
      ctx.quadraticCurveTo(w * 0.88, horizon * 0.66, w, horizon * 0.76);
      ctx.lineTo(w, horizon);
      ctx.closePath(); ctx.fill();
      // tejados
      for (let i = 0; i < 18; i++) {
        const bx = (i * 97 + 30) % w;
        const bw = 54 + (i % 4) * 18;
        const bh = 24 + (i % 3) * 14;
        const by = horizon - bh - 8 - (i % 2) * 8;
        ctx.fillStyle = i % 2 ? 'rgba(28,32,36,.85)' : 'rgba(38,44,48,.85)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.beginPath();
        ctx.moveTo(bx - 8, by);
        ctx.lineTo(bx + bw / 2, by - 14);
        ctx.lineTo(bx + bw + 8, by);
        ctx.closePath(); ctx.fill();
      }
      // rostros del monumento
      if (a.style === 'village') {
        ctx.save();
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < 4; i++) {
          const fx = w * (0.16 + i * 0.11);
          ctx.fillStyle = '#3c332c';
          ctx.beginPath(); ctx.ellipse(fx, horizon * 0.66, 30, 40, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#181410';
          ctx.beginPath(); ctx.ellipse(fx - 10, horizon * 0.63, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(fx + 10, horizon * 0.63, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
    } else if (a.style === 'forest' || a.style === 'island') {
      for (let i = 0; i < 16; i++) {
        const bx = i * (w / 15) + (i % 3) * 20;
        const th = 100 + (i % 5) * 40;
        ctx.fillStyle = i % 2 ? '#12241a' : '#0e1d16';
        ctx.fillRect(bx, horizon - th, 18 + (i % 4) * 8, th + 30);
        ctx.beginPath();
        ctx.arc(bx + 14, horizon - th, 52 + (i % 3) * 22, 0, Math.PI * 2);
        ctx.fill();
      }
      if (a.style === 'island') {
        ctx.fillStyle = 'rgba(30,120,130,.5)';
        ctx.fillRect(0, horizon * 0.82, w, horizon * 0.2);
      }
    } else if (a.style === 'mountain' || a.style === 'valley' || a.style === 'summit') {
      for (let layer = 0; layer < 3; layer++) {
        const alpha = 0.35 + layer * 0.2;
        const baseY = horizon + layer * 8;
        ctx.fillStyle = 'rgba(' + (18 + layer * 12) + ',' + (24 + layer * 12) + ',' + (32 + layer * 14) + ',' + alpha + ')';
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        for (let i = 0; i <= 8; i++) {
          const px = (w / 8) * i;
          const py = baseY - (70 + ((i * 47 + layer * 91) % 150));
          ctx.lineTo(px, py);
        }
        ctx.lineTo(w, baseY);
        ctx.closePath(); ctx.fill();
      }
      // cascada o valle
      if (a.style === 'valley') {
        ctx.fillStyle = 'rgba(120,180,200,.18)';
        ctx.beginPath();
        ctx.moveTo(w * 0.42, horizon * 0.55);
        ctx.bezierCurveTo(w * 0.5, horizon * 0.8, w * 0.4, horizon, w * 0.48, horizon + 30);
        ctx.lineTo(w * 0.56, horizon + 30);
        ctx.bezierCurveTo(w * 0.5, horizon, w * 0.58, horizon * 0.78, w * 0.5, horizon * 0.55);
        ctx.closePath(); ctx.fill();
      }
    } else if (a.style === 'desert' || a.style === 'canyon') {
      for (let i = 0; i < 5; i++) {
        const px = w * (0.08 + i * 0.22);
        ctx.fillStyle = 'rgba(110,70,42,.55)';
        ctx.beginPath();
        ctx.moveTo(px - 90, horizon);
        ctx.lineTo(px - 60, horizon - 60 - (i % 2) * 40);
        ctx.lineTo(px - 20, horizon - 30);
        ctx.lineTo(px, horizon - 80 - (i % 3) * 20);
        ctx.lineTo(px + 40, horizon - 24);
        ctx.lineTo(px + 70, horizon - 55);
        ctx.lineTo(px + 110, horizon);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,220,160,.08)';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(w * (0.2 + i * 0.25), horizon - 30, 120, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (a.style === 'sea' || a.style === 'bridge') {
      ctx.fillStyle = 'rgba(20,60,84,.75)';
      ctx.fillRect(0, horizon * 0.8, w, horizon * 0.25);
      ctx.strokeStyle = 'rgba(160,230,240,.18)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 18; i++) {
        const yy = horizon * 0.82 + (i % 6) * 8;
        ctx.beginPath();
        ctx.moveTo(0, yy);
        for (let x = 0; x <= w; x += 40) {
          ctx.lineTo(x, yy + Math.sin(x * 0.02 + t * 1.6 + i) * 2.5);
        }
        ctx.stroke();
      }
      if (a.style === 'bridge') {
        ctx.fillStyle = '#3a3a44';
        ctx.fillRect(0, horizon - 10, w, 34);
        ctx.fillStyle = '#2a2a32';
        for (let i = 0; i < 12; i++) ctx.fillRect(i * (w / 11), horizon - 22, 12, 60);
        ctx.strokeStyle = '#565660';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(0, horizon - 26); ctx.lineTo(w, horizon - 26); ctx.stroke();
      }
    } else if (a.style === 'arena') {
      ctx.fillStyle = '#2a2a32';
      ctx.beginPath();
      ctx.ellipse(w / 2, horizon, w * 0.52, horizon * 0.28, 0, Math.PI, 0);
      ctx.fill();
      for (let i = 0; i < 22; i++) {
        const px = (i / 21) * w;
        ctx.fillStyle = i % 2 ? 'rgba(160,150,130,.35)' : 'rgba(100,95,85,.35)';
        ctx.fillRect(px - 10, horizon - 46, 20, 30);
      }
    } else if (a.style === 'war') {
      ctx.fillStyle = 'rgba(30,18,18,.8)';
      for (let i = 0; i < 26; i++) {
        const bx = (i * 83 + 20) % w;
        const bh2 = 20 + (i % 5) * 24;
        ctx.fillRect(bx, horizon - bh2, 12 + (i % 3) * 8, bh2);
      }
      ctx.strokeStyle = 'rgba(255,120,80,.25)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const mx = (i * 233 + t * 8) % w;
        ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx + 18, horizon); ctx.stroke();
      }
    } else if (a.style === 'moon' || a.style === 'sky') {
      // luna gigante
      const mg = ctx.createRadialGradient(w * 0.5, horizon * 0.45, 20, w * 0.5, horizon * 0.45, h * 0.38);
      mg.addColorStop(0, 'rgba(230,220,255,.55)');
      mg.addColorStop(0.4, 'rgba(190,170,230,.18)');
      mg.addColorStop(1, 'rgba(120,100,180,0)');
      ctx.fillStyle = mg;
      ctx.beginPath(); ctx.arc(w * 0.5, horizon * 0.45, h * 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(240,235,255,.28)';
      ctx.beginPath(); ctx.arc(w * 0.5, horizon * 0.45, h * 0.17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(20,16,30,.45)';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(w * 0.5 - 50 + i * 28, horizon * 0.45 - 30 + (i % 2) * 30, 18 + (i % 3) * 8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (a.style === 'temple' || a.style === 'mansion') {
      ctx.fillStyle = 'rgba(25,18,20,.84)';
      ctx.beginPath();
      ctx.moveTo(w * 0.14, horizon);
      ctx.lineTo(w * 0.3, horizon * 0.5);
      ctx.lineTo(w * 0.7, horizon * 0.5);
      ctx.lineTo(w * 0.86, horizon);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(90,30,30,.45)';
      for (let i = 0; i < 5; i++) ctx.fillRect(w * (0.22 + i * 0.14), horizon * 0.62, 10, horizon * 0.38);
      ctx.fillStyle = 'rgba(255,150,70,.2)';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(w * (0.24 + i * 0.13), horizon * 0.72, 8 + Math.sin(t * 2 + i) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (a.style === 'ruins' || a.style === 'prison' || a.style === 'cave') {
      ctx.fillStyle = 'rgba(20,20,26,.85)';
      for (let i = 0; i < 12; i++) {
        const px = (i * 149 + 20) % w;
        const ph = 30 + (i % 4) * 38;
        ctx.fillRect(px, horizon - ph, 30 + (i % 3) * 18, ph + 20);
      }
      if (a.style === 'cave') {
        ctx.fillStyle = 'rgba(16,10,22,.9)';
        for (let i = 0; i < 10; i++) {
          const px = i * (w / 9);
          ctx.beginPath();
          ctx.moveTo(px - 40, 0);
          ctx.lineTo(px + 20, 90 + (i % 3) * 50);
          ctx.lineTo(px + 80, 0);
          ctx.closePath(); ctx.fill();
        }
      }
    }

    // suelo
    const ground = ctx.createLinearGradient(0, horizon, 0, h);
    ground.addColorStop(0, a.ground);
    ground.addColorStop(1, a.ground2);
    ctx.fillStyle = ground;
    ctx.fillRect(0, horizon, w, h - horizon);

    // perspectiva del suelo
    ctx.strokeStyle = 'rgba(0,0,0,.13)';
    ctx.lineWidth = 1;
    for (let i = -6; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(w / 2 + i * 30, horizon);
      ctx.lineTo(w / 2 + i * 240, h);
      ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const yy = horizon + Math.pow(i / 8, 1.8) * (h - horizon);
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke();
    }

    // detalles del suelo
    ctx.save();
    ctx.globalAlpha = 0.5;
    if (a.style === 'forest' || a.style === 'island' || a.style === 'village') {
      for (let i = 0; i < 60; i++) {
        const gx = (i * 173) % w;
        const gy = horizon + 20 + ((i * 97) % (h - horizon - 10));
        ctx.strokeStyle = 'rgba(120,180,100,.4)';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx - 3, gy - 7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + 4, gy - 6); ctx.stroke();
      }
    } else if (a.style === 'desert') {
      for (let i = 0; i < 8; i++) {
        ctx.strokeStyle = 'rgba(120,80,40,.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const yy = horizon + 30 + i * 26;
        ctx.moveTo(0, yy);
        ctx.quadraticCurveTo(w * 0.5, yy + 18, w, yy - 6);
        ctx.stroke();
      }
    } else if (a.style === 'arena' || a.style === 'temple' || a.style === 'mansion') {
      ctx.strokeStyle = 'rgba(0,0,0,.16)';
      for (let i = 0; i < 9; i++) {
        ctx.beginPath(); ctx.moveTo(0, horizon + i * (h - horizon) / 8); ctx.lineTo(w, horizon + i * (h - horizon) / 8); ctx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        ctx.beginPath(); ctx.moveTo(i * w / 11, horizon); ctx.lineTo(i * w / 11 - 100, h); ctx.stroke();
      }
    } else if (a.style === 'sea' || a.style === 'bridge') {
      ctx.strokeStyle = 'rgba(160,230,240,.12)';
      for (let i = 0; i < 8; i++) {
        const yy = horizon + 20 + i * (h - horizon) / 8;
        ctx.beginPath(); ctx.moveTo(0, yy); ctx.quadraticCurveTo(w / 2, yy + 8, w, yy); ctx.stroke();
      }
    }
    ctx.restore();

    // marco lateral: árboles/rocas
    ctx.fillStyle = 'rgba(8,10,14,.75)';
    if (a.style === 'forest' || a.style === 'island') {
      [-20, w + 20].forEach(function (sx, idx) {
        ctx.beginPath();
        ctx.ellipse(sx, horizon, 130, h * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(8,14,10,.6)';
      });
    } else if (a.style === 'cave' || a.style === 'ruins') {
      [-30, w + 30].forEach(function (sx) {
        ctx.beginPath(); ctx.moveTo(sx, h); ctx.lineTo(sx + (sx < 0 ? 150 : -150), horizon - 40); ctx.lineTo(sx, horizon - 140); ctx.closePath(); ctx.fill();
      });
    }

    // viñeta
    const vg = ctx.createRadialGradient(w / 2, h * 0.55, h * 0.25, w / 2, h * 0.55, h * 0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.5)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);

    // partículas
    drawAmbient(ctx, a.particles, w, h, t, a.accent);
  }

  function drawAmbient(ctx, type, w, h, t, accent) {
    ctx.save();
    if (type === 'rain') {
      ctx.strokeStyle = 'rgba(170,210,230,.25)';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 70; i++) {
        const rx = (i * 137 + t * 80) % w;
        const ry = (i * 91 + t * 420) % h;
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 5, ry + 16); ctx.stroke();
      }
    } else if (type === 'sand' || type === 'dust') {
      ctx.fillStyle = type === 'sand' ? 'rgba(255,220,160,.24)' : 'rgba(220,200,170,.16)';
      for (let i = 0; i < 55; i++) {
        const px = (i * 211 + t * (22 + i % 4 * 8)) % w;
        const py = (i * 83 + Math.sin(t + i) * 20 + h * 0.2) % h;
        ctx.beginPath(); ctx.arc(px, py, 1 + (i % 2), 0, Math.PI * 2); ctx.fill();
      }
    } else if (type === 'snow') {
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      for (let i = 0; i < 70; i++) {
        const px = (i * 181 + Math.sin(t * 0.7 + i) * 30) % w;
        const py = (i * 73 + t * 30) % h;
        ctx.beginPath(); ctx.arc(px, py, 1.4 + (i % 3) * 0.6, 0, Math.PI * 2); ctx.fill();
      }
    } else if (type === 'leaves') {
      for (let i = 0; i < 26; i++) {
        const px = (i * 197 + t * 24 + Math.sin(t + i) * 30) % (w + 40) - 20;
        const py = (i * 113 + t * 34) % (h + 40) - 20;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(t * 1.4 + i);
        ctx.fillStyle = i % 3 ? 'rgba(110,160,80,.5)' : 'rgba(210,160,70,.45)';
        ctx.beginPath(); ctx.ellipse(0, 0, 5, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    } else if (type === 'fireflies') {
      for (let i = 0; i < 32; i++) {
        const px = (i * 181 + Math.sin(t * 0.5 + i) * 50) % w;
        const py = (i * 97 + Math.cos(t * 0.7 + i * 2) * 30 + h * 0.2) % h;
        const al = 0.3 + 0.5 * Math.abs(Math.sin(t * 1.8 + i));
        ctx.fillStyle = 'rgba(190,240,140,' + al + ')';
        ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
      }
    } else if (type === 'petals') {
      for (let i = 0; i < 30; i++) {
        const px = (i * 163 + t * 26 + Math.sin(t * 0.8 + i) * 40) % (w + 30) - 15;
        const py = (i * 107 + t * 40) % (h + 30) - 15;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(t + i);
        ctx.fillStyle = 'rgba(255,170,200,.45)';
        ctx.beginPath(); ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    } else if (type === 'ash') {
      ctx.fillStyle = 'rgba(255,140,90,.28)';
      for (let i = 0; i < 60; i++) {
        const px = (i * 199 + Math.sin(t + i) * 18) % w;
        const py = (i * 79 + t * 18) % h;
        ctx.beginPath(); ctx.arc(px, py, 1 + (i % 2), 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawSilhouette(ctx, x, y, s, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.globalAlpha = alpha || 0.9;
    ctx.fillStyle = '#0b0d12';
    ctx.beginPath(); ctx.arc(0, -72, 16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-14, -60); ctx.lineTo(14, -60); ctx.lineTo(20, -6); ctx.lineTo(-20, -6);
    ctx.closePath(); ctx.fill();
    ctx.fillRect(-16, -6, 10, 26);
    ctx.fillRect(6, -6, 10, 26);
    ctx.restore();
  }

  /* ---------------- Utilidades ---------------- */
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function lighten(hex, amt) {
    if (!hex) return '#ffffff';
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (h) { return h + h; }).join('');
    const n = parseInt(hex, 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.min(255, Math.max(0, r)); g = Math.min(255, Math.max(0, g)); b = Math.min(255, Math.max(0, b));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function hexA(hex, a) {
    if (!hex) return 'rgba(255,255,255,' + a + ')';
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (h) { return h + h; }).join('');
    const n = parseInt(hex, 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  window.Art = {
    preload: preload,
    isReady: function () { return ready; },
    images: images,
    symbol: symbol,
    bandana: bandana,
    character: drawCharacter,
    portrait: drawPortrait,
    scene: drawScene,
    arena: drawArenaBackdrop,
    konoha: drawKonohaBackdrop,
    leaves: drawLeaves,
    roundRect: roundRect,
    lighten: lighten,
    hexA: hexA,
    cloud: cloud
  };
})();

/* ============================================================
   NARUTO: SHINOBI LEGACY — Audio procedural (Web Audio API)
   Música y efectos generados en tiempo real, sin archivos.
   ============================================================ */
(function () {
  'use strict';

  let ctx = null;
  let master = null;
  let musicBus = null;
  let sfxBus = null;
  let musicVolume = 0.55;
  let sfxVolume = 0.7;
  let voiceEnabled = true;
  let currentTrack = null;
  let schedulerTimer = null;
  let step = 0;
  let nextTime = 0;
  let noiseBuffer = null;
  let lastBlip = 0;

  const SCALE_MINOR = [0, 2, 3, 5, 7, 8, 10];
  const SCALE_MAJOR = [0, 2, 4, 5, 7, 9, 11];
  const SCALE_PENTA = [0, 2, 4, 7, 9];

  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  function makeNoise() {
    if (!ctx) return null;
    if (noiseBuffer) return noiseBuffer;
    const len = Math.floor(ctx.sampleRate * 1.2);
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return noiseBuffer;
  }

  function init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume().catch(function () {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
      musicBus = ctx.createGain();
      musicBus.gain.value = musicVolume;
      musicBus.connect(master);
      sfxBus = ctx.createGain();
      sfxBus.gain.value = sfxVolume;
      sfxBus.connect(master);
      makeNoise();
    } catch (e) {
      ctx = null;
    }
  }

  function setMusicVolume(v) {
    musicVolume = Math.max(0, Math.min(1, v));
    if (musicBus) musicBus.gain.setTargetAtTime(musicVolume, ctx.currentTime, 0.08);
  }
  function setSfxVolume(v) {
    sfxVolume = Math.max(0, Math.min(1, v));
    if (sfxBus) sfxBus.gain.setTargetAtTime(sfxVolume, ctx.currentTime, 0.05);
  }
  function setVoice(on) { voiceEnabled = !!on; }

  function tone(freq, when, dur, type, gain, bus, slideTo, filterHz) {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, when);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), when + dur);
    let node = o;
    if (filterHz) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filterHz;
      o.connect(f);
      node = f;
    }
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), when + Math.min(0.035, dur * 0.25));
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    node.connect(g);
    g.connect(bus || musicBus || master);
    o.start(when);
    o.stop(when + dur + 0.03);
  }

  function noise(when, dur, gain, type, freq, q, bus) {
    if (!ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = makeNoise();
    const f = ctx.createBiquadFilter();
    f.type = type || 'bandpass';
    f.frequency.setValueAtTime(freq || 1600, when);
    f.Q.value = q || 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(f); f.connect(g); g.connect(bus || sfxBus || master);
    src.start(when);
    src.stop(when + dur + 0.02);
  }

  /* ---------------- Música por capas ---------------- */
  const TRACKS = {
    menu: {
      bpm: 78, bars: 8, beats: 4, swing: 0.02,
      chords: [[45, 48, 52], [41, 45, 48], [48, 52, 55], [43, 47, 50]],
      melody: [57, 60, 64, 69, 67, 64, 60, 62, 64, 67, 72, 69, 67, 64, 62, 60],
      arp: [0, 2, 1, 2, 0, 2, 1, 2]
    },
    village: {
      bpm: 96, bars: 8, beats: 4, swing: 0.04,
      chords: [[48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48]],
      melody: [60, 64, 67, 72, 69, 67, 64, 62, 60, 64, 67, 69, 72, 67, 64, 60],
      arp: [0, 1, 2, 1, 0, 2, 1, 2]
    },
    battle: {
      bpm: 132, bars: 8, beats: 4, swing: 0,
      chords: [[38, 41, 45], [38, 41, 45], [36, 40, 43], [34, 38, 41]],
      melody: [62, 65, 69, 70, 69, 65, 62, 58, 62, 65, 69, 74, 72, 69, 65, 62],
      arp: [0, 0, 1, 0, 2, 0, 1, 0]
    },
    boss: {
      bpm: 144, bars: 8, beats: 4, swing: 0,
      chords: [[33, 36, 40], [33, 36, 40], [31, 35, 38], [29, 33, 36]],
      melody: [57, 60, 63, 64, 63, 60, 57, 55, 57, 60, 64, 67, 65, 63, 60, 57],
      arp: [0, 0, 1, 0, 2, 0, 1, 0]
    },
    story: {
      bpm: 66, bars: 8, beats: 4, swing: 0,
      chords: [[45, 48, 52], [41, 45, 48], [48, 52, 55], [43, 47, 50]],
      melody: [69, 67, 64, 60, 64, 67, 69, 72, 69, 67, 64, 62, 60, 62, 64, 67],
      arp: [0, 2, 1, 2, 0, 2, 1, 2]
    },
    tension: {
      bpm: 88, bars: 4, beats: 4, swing: 0,
      chords: [[40, 43, 47], [40, 43, 47], [39, 42, 46], [38, 41, 45]],
      melody: [64, 0, 67, 0, 70, 69, 67, 0, 64, 0, 62, 0, 63, 64, 67, 0],
      arp: [0, 1, 0, 1]
    }
  };

  function scheduleStep(track, s, time) {
    const beat = s % (track.beats * 2); // 8 corcheas por compás
    const bar = Math.floor(s / (track.beats * 2)) % track.bars;
    const chord = track.chords[bar % track.chords.length];
    const isMenu = currentTrack === 'menu';
    const isBattle = currentTrack === 'battle' || currentTrack === 'boss';

    // Pads / acordes al inicio del compás
    if (beat === 0 && (isMenu || currentTrack === 'story' || currentTrack === 'tension' || currentTrack === 'village')) {
      chord.forEach(function (n, i) {
        tone(midi(n + (currentTrack === 'story' ? 12 : 0)), time + i * 0.01, 3.6, 'sine', 0.035, musicBus, null, 1100);
        tone(midi(n + 12), time + i * 0.02, 3.2, 'triangle', 0.012, musicBus, null, 1600);
      });
    }

    // Bajo
    if (isBattle) {
      if (beat % 2 === 0) {
        tone(midi(chord[0] - 12), time, 0.22, currentTrack === 'boss' ? 'sawtooth' : 'square', 0.055, musicBus, null, 260);
        tone(midi(chord[0] - 12), time + 0.26, 0.12, 'square', 0.03, musicBus, null, 240);
      }
    } else if (beat === 0 || beat === 4) {
      tone(midi(chord[0] - 12), time, 0.55, 'triangle', 0.05, musicBus, null, 380);
    }

    // Arpegio / melodía
    const melodyNote = track.melody[(s + bar * 3) % track.melody.length];
    if (melodyNote && beat % 2 === 0) {
      const gain = isBattle ? 0.028 : 0.032;
      tone(midi(melodyNote), time, isBattle ? 0.16 : 0.5, isBattle ? 'square' : 'triangle', gain, musicBus, null, isBattle ? 1400 : 2600);
      if (currentTrack === 'village' || isMenu) {
        tone(midi(melodyNote + 12), time + 0.02, 0.25, 'sine', 0.012, musicBus, null, 3000);
      }
    }
    // Arpegio suave
    const arpIdx = track.arp[(s + (isBattle ? 0 : 0)) % track.arp.length];
    const arpNote = chord[arpIdx] + 12;
    if (!isBattle && beat % 2 === 1) {
      tone(midi(arpNote), time, 0.35, 'sine', 0.016, musicBus, null, 2400);
    }

    // Percusión
    if (isBattle) {
      if (beat === 0 || beat === 3) {
        tone(120, time, 0.12, 'sine', 0.15, musicBus, 44);
      }
      if (beat === 2 || beat === 6) {
        noise(time, 0.12, 0.09, 'highpass', 1800, 0.7, musicBus);
      }
      if (s % 1 === 0) {
        noise(time, 0.035, beat % 2 ? 0.015 : 0.028, 'highpass', 7500, 0.5, musicBus);
      }
      if (currentTrack === 'boss' && (beat === 4 || beat === 7)) {
        noise(time, 0.25, 0.08, 'lowpass', 260, 0.8, musicBus);
      }
    } else if (currentTrack === 'village') {
      if (beat === 0) tone(90, time, 0.09, 'sine', 0.08, musicBus, 52);
      if (beat === 4) noise(time, 0.05, 0.02, 'highpass', 5000, 0.5, musicBus);
    }
  }

  function scheduler() {
    if (!ctx || !currentTrack) return;
    const track = TRACKS[currentTrack];
    if (!track) return;
    const stepDur = (60 / track.bpm) / 2;
    while (nextTime < ctx.currentTime + 0.18) {
      scheduleStep(track, step, nextTime);
      step++;
      nextTime += stepDur + (step % 2 ? track.swing : 0);
    }
  }

  function playTrack(name, opts) {
    opts = opts || {};
    init();
    if (!ctx) { currentTrack = name; return; }
    if (currentTrack === name && schedulerTimer && !opts.force) return;
    currentTrack = name;
    step = 0;
    nextTime = ctx.currentTime + 0.06;
    if (schedulerTimer) { clearInterval(schedulerTimer); schedulerTimer = null; }
    // pequeño fade de entrada
    if (musicBus) {
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setValueAtTime(0.0001, ctx.currentTime);
      musicBus.gain.exponentialRampToValueAtTime(Math.max(0.0001, musicVolume), ctx.currentTime + 0.7);
    }
    schedulerTimer = setInterval(scheduler, 90);
    scheduler();
  }

  function stopMusic() {
    if (schedulerTimer) { clearInterval(schedulerTimer); schedulerTimer = null; }
    currentTrack = null;
  }

  /* ---------------- SFX ---------------- */
  function blip() {
    if (!ctx || !voiceEnabled) return;
    const now = ctx.currentTime;
    if (now - lastBlip < 0.055) return;
    lastBlip = now;
    tone(520 + Math.random() * 160, now, 0.035, 'square', 0.012, sfxBus, 440, 2200);
  }

  const SFX = {
    click: function (t) { tone(760, t, 0.05, 'square', 0.035, sfxBus, 900, 2500); },
    hover: function (t) { tone(520, t, 0.03, 'sine', 0.015, sfxBus, 560, 1800); },
    confirm: function (t) { tone(520, t, 0.08, 'triangle', 0.07, sfxBus, null, 3000); tone(780, t + 0.08, 0.16, 'triangle', 0.06, sfxBus, null, 3200); },
    back: function (t) { tone(500, t, 0.08, 'triangle', 0.045, sfxBus, 340, 2000); },
    error: function (t) { tone(180, t, 0.12, 'square', 0.05, sfxBus, 130, 800); tone(140, t + 0.1, 0.16, 'square', 0.04, sfxBus, 90, 700); },
    hit: function (t) {
      noise(t, 0.09, 0.13, 'bandpass', 1000, 0.9, sfxBus);
      tone(120, t, 0.09, 'sine', 0.16, sfxBus, 55);
    },
    slash: function (t) { noise(t, 0.12, 0.09, 'highpass', 2600, 1.4, sfxBus); tone(1300, t, 0.07, 'sawtooth', 0.025, sfxBus, 400, 3000); },
    hurt: function (t) { tone(200, t, 0.18, 'sawtooth', 0.06, sfxBus, 90, 900); noise(t, 0.12, 0.06, 'lowpass', 700, 0.6, sfxBus); },
    dash: function (t) { noise(t, 0.16, 0.07, 'bandpass', 1200, 1.8, sfxBus); tone(420, t, 0.16, 'sine', 0.02, sfxBus, 900, 2200); },
    jutsu: function (t) { tone(320, t, 0.45, 'sawtooth', 0.05, sfxBus, 1250, 2000); noise(t, 0.35, 0.04, 'bandpass', 2200, 1.2, sfxBus); },
    fire: function (t) { noise(t, 0.3, 0.12, 'lowpass', 900, 0.8, sfxBus); tone(180, t, 0.3, 'sawtooth', 0.04, sfxBus, 70, 800); },
    explosion: function (t) {
      noise(t, 0.6, 0.22, 'lowpass', 320, 0.6, sfxBus);
      tone(90, t, 0.5, 'sine', 0.22, sfxBus, 36);
      noise(t + 0.04, 0.3, 0.08, 'highpass', 1800, 0.7, sfxBus);
    },
    pickup: function (t) { tone(880, t, 0.08, 'triangle', 0.04, sfxBus); tone(1174, t + 0.07, 0.12, 'triangle', 0.04, sfxBus); },
    coin: function (t) { tone(1568, t, 0.06, 'square', 0.025, sfxBus); tone(2093, t + 0.05, 0.12, 'square', 0.02, sfxBus); },
    levelup: function (t) { [523, 659, 784, 1046, 1318].forEach(function (f, i) { tone(f, t + i * 0.09, 0.28, 'triangle', 0.055, sfxBus); }); },
    rankup: function (t) { [392, 523, 659, 784, 1046].forEach(function (f, i) { tone(f, t + i * 0.13, 0.4, 'triangle', 0.06, sfxBus); }); noise(t + 0.5, 0.6, 0.04, 'highpass', 3000, 0.5, sfxBus); },
    victory: function (t) { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, t + i * 0.12, 0.5, 'triangle', 0.06, sfxBus); }); tone(1318, t + 0.55, 0.8, 'triangle', 0.05, sfxBus); },
    defeat: function (t) { [392, 330, 262, 196].forEach(function (f, i) { tone(f, t + i * 0.18, 0.5, 'sine', 0.05, sfxBus); }); },
    ultimate: function (t) { noise(t, 0.8, 0.06, 'bandpass', 800, 1.2, sfxBus); tone(160, t, 0.8, 'sawtooth', 0.05, sfxBus, 900, 1800); tone(320, t + 0.3, 0.6, 'square', 0.03, sfxBus, 1400, 2200); },
    die: function (t) { noise(t, 0.35, 0.08, 'lowpass', 800, 0.4, sfxBus); tone(200, t, 0.35, 'sawtooth', 0.03, sfxBus, 40, 500); },
    heal: function (t) { [660, 880, 990].forEach(function (f, i) { tone(f, t + i * 0.07, 0.25, 'sine', 0.03, sfxBus); }); },
    unlock: function (t) { [440, 554, 659, 880].forEach(function (f, i) { tone(f, t + i * 0.1, 0.4, 'triangle', 0.05, sfxBus); }); }
  };

  function sfx(name) {
    init();
    if (!ctx || !SFX[name]) return;
    try { SFX[name](ctx.currentTime); } catch (e) {}
  }

  window.AudioEngine = {
    init: init,
    isReady: function () { return !!ctx; },
    playTrack: playTrack,
    stopMusic: stopMusic,
    stop: stopMusic,
    setMusicVolume: setMusicVolume,
    setSfxVolume: setSfxVolume,
    setVoice: setVoice,
    sfx: sfx,
    blip: blip,
    current: function () { return currentTrack; }
  };
})();

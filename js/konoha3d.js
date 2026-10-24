/* ============================================================
   NARUTO: SHINOBI LEGACY — Konoha 3D
   Modo de exploración en tercera persona sobre el diorama de la
   Aldea Oculta de la Hoja (GLB de Sketchfab).
   Diseñado para equipos modestos: materiales unlit, sin sombras
   dinámicas, DPR adaptativo y geometría estática cacheada.
   API pública: window.Konoha3D
   ============================================================ */
(function () {
  'use strict';

  var VILLAGE_URL = 'assets/models/village_opt.glb';
  var CHARS_URL = 'assets/models/naruto_sasuke_opt.glb';
  var KAKASHI_URL = 'assets/models/kakashi.glb';
  var RUN_URL = 'assets/models/naruto_run.glb';
  var HOKAGE_ROOM_URL = 'assets/models/hokage_room.glb';
  var MODEL_KEYS = {};
  MODEL_KEYS[VILLAGE_URL] = 'village';
  MODEL_KEYS[CHARS_URL] = 'chars';
  MODEL_KEYS[KAKASHI_URL] = 'kakashi';
  MODEL_KEYS[RUN_URL] = 'run';
  MODEL_KEYS[HOKAGE_ROOM_URL] = 'room';
  var MODEL_DATA_URL = 'js/models3d-data.js';
  var modelDataPromise = null;

  var VILLAGE_SCALE = 44;
  var PLAYER_HEIGHT = 1.72;
  var WALK_STEP = 0.92;
  var WALK_MIN = 3.0;
  var WALK_MAX = 16.0;
  var CELL = 1.0;
  var DAY_SECONDS_PER_MINUTE = 1.15;

  /* El despacho se construye lejos de la aldea para poder teletransportar
     al jugador sin recargar la escena ni el renderer. */
  var ROOM_X = 420;
  var ROOM_Z = 0;
  var ROOM_FLOOR = 0.02;
  var ROOM_MIN_X = ROOM_X - 11.2;
  var ROOM_MAX_X = ROOM_X + 1.7;
  var ROOM_MIN_Z = ROOM_Z - 7.7;
  var ROOM_MAX_Z = ROOM_Z + 7.7;
  var ROOM_CAM_MIN_X = ROOM_X - 11.7;
  var ROOM_CAM_MAX_X = ROOM_X + 2.15;
  var ROOM_SPAWN = { x: ROOM_X - 2.2, z: ROOM_Z, yaw: -Math.PI / 2 };
  var ROOM_EXIT = { x: ROOM_X + 1.45, z: ROOM_Z };
  var ROOM_DESK = { minX: ROOM_X - 9.3, maxX: ROOM_X - 5.2, minZ: ROOM_Z - 2.4, maxZ: ROOM_Z + 1.4 };
  var HOKAGE_ROOM_POS = { x: ROOM_X - 7.6, z: ROOM_Z - 0.45 };
  var CHECKPOINT_X = -9.7;
  var CHECKPOINT_Z = 19.8;

  /* Correspondencia de las patas del rig DEF con el clip Mixamo suministrado.
     El torso se deja en su pose de reposo: mezclar orientaciones entre ambos
     rigs lo doblaba hacia atrás. */
  var RUN_LEG_MAP = {
    naruto: {
      'DEF-thighL_0495': 'mixamorigLeftUpLeg_056',
      'DEF-shinL_0497': 'mixamorigLeftLeg_057',
      'DEF-footL_0499': 'mixamorigLeftFoot_058',
      'DEF-toeL_0500': 'mixamorigLeftToeBase_059',
      'DEF-thighR_0494': 'mixamorigRightUpLeg_00',
      'DEF-shinR_0516': 'mixamorigRightLeg_061',
      'DEF-footR_0518': 'mixamorigRightFoot_062',
      'DEF-toeR_0519': 'mixamorigRightToeBase_063'
    },
    sasuke: {
      'DEF-thighL_083': 'mixamorigLeftUpLeg_056',
      'DEF-shinL_085': 'mixamorigLeftLeg_057',
      'DEF-footL_087': 'mixamorigLeftFoot_058',
      'DEF-toeL_088': 'mixamorigLeftToeBase_059',
      'DEF-thighR_0102': 'mixamorigRightUpLeg_00',
      'DEF-shinR_0104': 'mixamorigRightLeg_061',
      'DEF-footR_0106': 'mixamorigRightFoot_062',
      'DEF-toeR_0107': 'mixamorigRightToeBase_063'
    }
  };

  var BONE_NAMES = {
    naruto: {
      thighL: 'DEF-thighL_0495', thighR: 'DEF-thighR_0494',
      shinL: 'DEF-shinL_0497', shinR: 'DEF-shinR_0516',
      armL: 'DEF-upper_armL_0569', armR: 'DEF-upper_armR_0694',
      head: 'head_0536'
    },
    sasuke: {
      thighL: 'DEF-thighL_083', thighR: 'DEF-thighR_0102',
      shinL: 'DEF-shinL_085', shinR: 'DEF-shinR_0104',
      armL: 'DEF-upper_armL_0156', armR: 'DEF-upper_armR_0282',
      head: 'head_0124'
    }
  };

  var S = {
    /* motor */
    renderer: null, scene: null, camera: null, canvas: null,
    active: false, paused: false, ready: false, loading: false,
    hidden: false, raf: null, last: 0, elapsed: 0, frameCount: 0,
    callbacks: {}, opts: null, dom: {},
    /* recursos */
    modelCache: {}, charFrames: {}, preparedVillage: false,
    miniAtlas: null,
    /* mundo */
    hm: null, village: null, water: null, waterDeep: null, sky: null, skyTex: null,
    skyKey: '', sunMesh: null, scenery: null, clouds: null,
    /* actores */
    player: null, npcs: [], scrolls: [], quest: null,
    promptText: '', promptBest: null, interactCooldown: 0,
    /* despacho del Hokage */
    room: null, checkpoint: null, roomExit: null,
    /* cámara e input */
    keys: {}, dragging: false, lastMouse: { x: 0, y: 0 },
    cam: {
      yaw: 0.6, pitch: 0.2, dist: 5.6, curDist: 5.6,
      pos: null, target: null, initialized: false,
      right: null, forward: null
    },
    touch: { active: false, mx: 0, my: 0, lookId: -1, lookX: 0, lookY: 0, joyId: -1 },
    /* tiempo */
    clockTime: 8 * 60, day: 1, timeAcc: 0, areaName: '', lastCompass: '',
    miniTimer: 0, hudTimer: 0, markerTimer: 0, labelTimer: 0,
    /* acabado */
    areaTimer: 0, areaLast: '',
    quality: { dpr: 1, maxDpr: 1.5, low: false, acc: 0, frames: 0, samples: 0, lastChange: 0 },
    handlers: null, collectFx: [],
    tmp: null,
    version: 3
  };

  /* ============================================================
     Utilidades
     ============================================================ */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function damp(current, target, rate, dt) { return lerp(current, target, 1 - Math.exp(-rate * dt)); }
  function dist2(ax, az, bx, bz) { var dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; }
  function nowMs() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  function dom(id) { return document.getElementById(id); }

  function mixColor(a, b, t) {
    return new THREE.Color(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
  }

  function shortestAngle(from, to) {
    var d = (to - from) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  function notify(kind, payload) {
    var fn = S.callbacks && S.callbacks[kind];
    if (typeof fn === 'function') {
      try { fn(payload); } catch (e) { console.error('[Konoha3D] callback ' + kind, e); }
    }
  }

  function setLoading(pct, label) {
    var p = clamp(Math.round(pct), 0, 100);
    if (S.dom.loadFill) S.dom.loadFill.style.width = p + '%';
    if (S.dom.loadPercent) S.dom.loadPercent.textContent = p + '%';
    if (S.dom.loadLabel && label) S.dom.loadLabel.textContent = label;
  }

  function setOverlay(id, show) {
    var node = S.dom[id === 'loading' ? 'loader' : 'error'];
    if (node) node.classList.toggle('hidden', !show);
  }

  function fail(message, detail) {
    S.loading = false;
    S.ready = false;
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = null; }
    if (detail) console.error('[Konoha3D]', message, detail);
    if (S.dom.errorText) S.dom.errorText.textContent = message;
    setOverlay('error', true);
    setOverlay('loading', false);
    notify('onError', { message: message, detail: detail ? String(detail) : '' });
  }

  /* ============================================================
     Materiales
     ============================================================ */
  function basicMaterialFrom(src, options) {
    options = options || {};
    var useSource = src && src.isMeshBasicMaterial && !options.forceClone && !options.skinning;
    if (useSource) {
      src.fog = true;
      if (options.side !== undefined) src.side = options.side;
      if (options.skinning) src.skinning = true;
      if (src.map) src.map.encoding = THREE.sRGBEncoding;
      return src;
    }
    var mat = new THREE.MeshBasicMaterial({
      map: src && src.map ? src.map : null,
      color: src && src.color ? src.color.clone() : new THREE.Color(0xffffff),
      transparent: !!(src && src.transparent),
      opacity: src && src.opacity !== undefined ? src.opacity : 1,
      alphaTest: src && src.alphaTest ? src.alphaTest : 0,
      side: options.side !== undefined ? options.side : (src && src.side !== undefined ? src.side : THREE.FrontSide),
      depthWrite: !(src && src.transparent && src.opacity < 1) && (src ? src.depthWrite !== false : true),
      fog: true,
      vertexColors: !!(src && src.vertexColors)
    });
    if (options.skinning) mat.skinning = true;
    if (mat.map) mat.map.encoding = THREE.sRGBEncoding;
    return mat;
  }

  function isOutline(mesh) {
    if (!mesh) return false;
    if (/outline/i.test(mesh.name || '')) return true;
    var mat = mesh.material;
    if (mat && /outline/i.test(mat.name || '')) return true;
    return false;
  }

  /* ============================================================
     Carga de modelos (con caché en memoria)
     ============================================================ */
  function getLoader() {
    if (!window.THREE || !THREE.GLTFLoader) return null;
    if (!getLoader.instance) getLoader.instance = new THREE.GLTFLoader();
    return getLoader.instance;
  }

  function base64ToBuffer(b64) {
    var bin = atob(b64);
    var len = bin.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  function loadModel(url, weight, progressRef) {
    if (S.modelCache[url]) return Promise.resolve(S.modelCache[url]);
    return new Promise(function (resolve, reject) {
      var loader = getLoader();
      if (!loader) { reject(new Error('GLTFLoader no disponible')); return; }
      var key = MODEL_KEYS[url];
      var embedded = key && window.K3D_MODELS && window.K3D_MODELS[key];
      if (embedded) {
        /* Modelos incrustados: funciona al abrir index.html con file://. */
        setLoading(progressRef.loaded / (progressRef.total || 1) * 100, 'PREPARANDO KONOHA 3D...');
        var buffer;
        try {
          buffer = base64ToBuffer(embedded);
        } catch (e) {
          reject(e);
          return;
        }
        loader.parse(buffer, '', function (gltf) {
          S.modelCache[url] = gltf;
          if (window.K3D_MODELS) {
            try { delete window.K3D_MODELS[key]; } catch (e) { window.K3D_MODELS[key] = null; }
          }
          progressRef.loaded += weight;
          setLoading(progressRef.loaded / (progressRef.total || 1) * 100, 'PREPARANDO KONOHA 3D...');
          resolve(gltf);
        }, function (err) {
          reject(err);
        });
        return;
      }
      loader.load(url, function (gltf) {
        S.modelCache[url] = gltf;
        progressRef.loaded += weight;
        resolve(gltf);
      }, function (evt) {
        if (evt && evt.lengthComputable) {
          var ratio = clamp(evt.loaded / evt.total, 0, 1);
          var base = progressRef.loaded;
          var total = progressRef.total || 1;
          setLoading((base + ratio * weight) / total * 100, 'DESCARGANDO MODELOS 3D...');
        }
      }, function (err) {
        reject(err);
      });
    });
  }

  /* ============================================================
     Alturas del terreno y navegación
     ============================================================ */
  function buildHeightmap(root) {
    var box = new THREE.Box3().setFromObject(root);
    var W = Math.ceil((box.max.x - box.min.x) / CELL);
    var H = Math.ceil((box.max.z - box.min.z) / CELL);
    var grid = new Float32Array(W * H);
    grid.fill(-1);
    /* Rejilla de paredes (triángulos verticales): la cámara la usa para
       no atravesar montañas, muros ni fachadas. */
    var BC = 1.0;
    var BW = Math.ceil((box.max.x - box.min.x) / BC);
    var BH = Math.ceil((box.max.z - box.min.z) / BC);
    var solid = new Float32Array(BW * BH);
    solid.fill(-1);
    var a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    var ab = new THREE.Vector3(), ac = new THREE.Vector3(), n = new THREE.Vector3();
    root.traverse(function (o) {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
      var pos = o.geometry.attributes.position;
      var idx = o.geometry.index;
      var total = idx ? idx.count : pos.count;
      for (var i = 0; i < total; i += 3) {
        var i0 = idx ? idx.getX(i) : i;
        var i1 = idx ? idx.getX(i + 1) : i + 1;
        var i2 = idx ? idx.getX(i + 2) : i + 2;
        a.fromBufferAttribute(pos, i0).applyMatrix4(o.matrixWorld);
        b.fromBufferAttribute(pos, i1).applyMatrix4(o.matrixWorld);
        c.fromBufferAttribute(pos, i2).applyMatrix4(o.matrixWorld);
        ab.subVectors(b, a); ac.subVectors(c, a); n.crossVectors(ab, ac);
        if (n.lengthSq() < 1e-12) continue;
        n.normalize();
        if (n.y < 0.45 && n.y > -0.45) rasterTri(solid, BW, BH, box, BC, a, b, c);
        if (n.y < 0.45) continue;
        rasterTri(grid, W, H, box, CELL, a, b, c);
      }
    });

    var hm = {
      minX: box.min.x, minZ: box.min.z, maxX: box.max.x, maxZ: box.max.z,
      cell: CELL, W: W, H: H, y: grid,
      solid: solid, solidCell: BC, solidW: BW, solidH: BH,
      reach: new Uint8Array(W * H), reachList: [], walkable: 0
    };
    S.hm = hm;
    return hm;
  }

  /* Pinta en la rejilla la altura de un triángulo sobre las celdas que cubre */
  function rasterTri(target, TW, TH, box, cell, a, b, c) {
    var ix0 = Math.max(0, Math.floor((Math.min(a.x, b.x, c.x) - box.min.x) / cell));
    var ix1 = Math.min(TW - 1, Math.ceil((Math.max(a.x, b.x, c.x) - box.min.x) / cell));
    var iz0 = Math.max(0, Math.floor((Math.min(a.z, b.z, c.z) - box.min.z) / cell));
    var iz1 = Math.min(TH - 1, Math.ceil((Math.max(a.z, b.z, c.z) - box.min.z) / cell));
    var v0x = b.x - a.x, v0z = b.z - a.z, v1x = c.x - a.x, v1z = c.z - a.z;
    var den = v0x * v1z - v1x * v0z;
    if (Math.abs(den) < 1e-9) return;
    for (var gz = iz0; gz <= iz1; gz++) {
      for (var gx = ix0; gx <= ix1; gx++) {
        var wx = box.min.x + (gx + 0.5) * cell;
        var wz = box.min.z + (gz + 0.5) * cell;
        var v2x = wx - a.x, v2z = wz - a.z;
        var u = (v2x * v1z - v1x * v2z) / den;
        if (u < 0 || u > 1) continue;
        var v = (v0x * v2z - v2x * v0z) / den;
        if (v < 0 || u + v > 1) continue;
        var y = a.y + u * (b.y - a.y) + v * (c.y - a.y);
        var k = gz * TW + gx;
        if (y > target[k]) target[k] = y;
      }
    }
  }

  /* Altura de cualquier geometría (muros incluidos) para la cámara */
  function solidHeight(x, z) {
    var hm = S.hm;
    if (!hm || !hm.solid) return null;
    var gx = Math.floor((x - hm.minX) / hm.solidCell);
    var gz = Math.floor((z - hm.minZ) / hm.solidCell);
    if (gx < 0 || gx >= hm.solidW || gz < 0 || gz >= hm.solidH) return null;
    var y = hm.solid[gz * hm.solidW + gx];
    return y < 0 ? null : y;
  }

  function cellIndex(hm, x, z) {
    var gx = Math.floor((x - hm.minX) / hm.cell);
    var gz = Math.floor((z - hm.minZ) / hm.cell);
    if (gx < 0 || gx >= hm.W || gz < 0 || gz >= hm.H) return -1;
    return gz * hm.W + gx;
  }

  function terrainHeight(x, z) {
    var hm = S.hm;
    if (!hm) return null;
    var k = cellIndex(hm, x, z);
    if (k < 0) return null;
    var y = hm.y[k];
    return y < 0 ? null : y;
  }

  function groundHeight(x, z) {
    var hm = S.hm;
    if (!hm) return null;
    var k = cellIndex(hm, x, z);
    if (k < 0 || !hm.reach[k]) return null;
    return hm.y[k];
  }

  function bfsReachable(hm, seedX, seedZ) {
    var seed = nearestWalkable(hm, seedX, seedZ, 30);
    if (!seed) return 0;
    var seen = hm.reach;
    var stack = new Int32Array(hm.W * hm.H);
    var sp = 0;
    var k0 = seed.z * hm.W + seed.x;
    seen[k0] = 1;
    stack[sp++] = k0;
    var count = 0;
    while (sp > 0) {
      var k = stack[--sp];
      count++;
      hm.reachList.push(k);
      var x = k % hm.W, z = (k / hm.W) | 0;
      var y = hm.y[k];
      for (var d = 0; d < 4; d++) {
        var nx = x + (d === 0 ? 1 : d === 1 ? -1 : 0);
        var nz = z + (d === 2 ? 1 : d === 3 ? -1 : 0);
        if (nx < 0 || nx >= hm.W || nz < 0 || nz >= hm.H) continue;
        var nk = nz * hm.W + nx;
        if (seen[nk]) continue;
        var ny = hm.y[nk];
        if (ny < WALK_MIN || ny > WALK_MAX) continue;
        if (Math.abs(ny - y) > WALK_STEP) continue;
        seen[nk] = 1;
        stack[sp++] = nk;
      }
    }
    hm.walkable = count;
    return count;
  }

  function nearestWalkable(hm, x, z, maxRadius) {
    var gx = Math.floor((x - hm.minX) / hm.cell);
    var gz = Math.floor((z - hm.minZ) / hm.cell);
    var best = null;
    for (var r = 0; r <= maxRadius; r++) {
      for (var dz = -r; dz <= r; dz++) {
        for (var dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          var cx = gx + dx, cz = gz + dz;
          if (cx < 0 || cx >= hm.W || cz < 0 || cz >= hm.H) continue;
          var y = hm.y[cz * hm.W + cx];
          if (y < WALK_MIN || y > WALK_MAX) continue;
          if (!best || y < best.y) best = { x: cx, z: cz, y: y };
        }
      }
      if (best) break;
    }
    return best;
  }

  function cellHasWall(x, z, y) {
    var s = solidHeight(x, z);
    return s !== null && s > y + 1.1;
  }

  function resolveReachable(x, z, maxRadius) {
    var hm = S.hm;
    if (!hm) return null;
    var gx = Math.floor((x - hm.minX) / hm.cell);
    var gz = Math.floor((z - hm.minZ) / hm.cell);
    var limit = maxRadius === undefined ? 40 : maxRadius;
    for (var r = 0; r <= limit; r++) {
      var best = null;
      for (var dz = -r; dz <= r; dz++) {
        for (var dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          var cx = gx + dx, cz = gz + dz;
          if (cx < 0 || cx >= hm.W || cz < 0 || cz >= hm.H) continue;
          var k = cz * hm.W + cx;
          if (!hm.reach[k]) continue;
          var wx = hm.minX + (cx + 0.5) * hm.cell;
          var wz = hm.minZ + (cz + 0.5) * hm.cell;
          if (cellHasWall(wx, wz, hm.y[k])) continue;
          var d = dx * dx + dz * dz;
          if (!best || d < best.d) best = { x: cx, z: cz, y: hm.y[k], d: d };
        }
      }
      if (best) {
        return { x: hm.minX + (best.x + 0.5) * hm.cell, y: best.y, z: hm.minZ + (best.z + 0.5) * hm.cell };
      }
    }
    return null;
  }

  function findReachableSpot(x, z, radius, minDist, used) {
    var hm = S.hm;
    if (!hm) return null;
    var best = null;
    for (var i = 0; i < hm.reachList.length; i++) {
      var k = hm.reachList[i];
      var cx = k % hm.W, cz = (k / hm.W) | 0;
      var wx = hm.minX + (cx + 0.5) * hm.cell;
      var wz = hm.minZ + (cz + 0.5) * hm.cell;
      var d = Math.sqrt(dist2(wx, wz, x, z));
      if (d > radius) continue;
      if (cellHasWall(wx, wz, hm.y[k])) continue;
      var clash = false;
      for (var u = 0; u < used.length; u++) {
        if (Math.sqrt(dist2(wx, wz, used[u].x, used[u].z)) < minDist) { clash = true; break; }
      }
      if (clash) continue;
      if (!best || d < best.d) best = { x: wx, z: wz, y: hm.y[k], d: d };
    }
    if (!best) best = resolveReachable(x, z, 60);
    return best;
  }

  /* ============================================================
     Escena: aldea, cielo, agua, paisaje
     ============================================================ */
  function prepareVillage() {
    var gltf = S.modelCache[VILLAGE_URL];
    if (!gltf) return null;
    var root = gltf.scene;
    if (!root.userData.__k3dPrepared) {
      root.updateMatrixWorld(true);
      var raw = new THREE.Box3().setFromObject(root);
      var center = raw.getCenter(new THREE.Vector3());
      var min = raw.min.clone();
      root.scale.setScalar(VILLAGE_SCALE);
      root.position.set(-center.x * VILLAGE_SCALE, -min.y * VILLAGE_SCALE, -center.z * VILLAGE_SCALE);
      root.updateMatrixWorld(true);
      root.traverse(function (o) {
        if (!o.isMesh) return;
        if (!o.userData.__k3dMat) {
          o.material = basicMaterialFrom(o.material, { side: THREE.DoubleSide });
          o.userData.__k3dMat = true;
        }
        o.matrixAutoUpdate = false;
        o.updateMatrix();
        o.frustumCulled = true;
      });
      root.userData.__k3dPrepared = true;
    }
    return root;
  }

  function makeSkyTexture(top, bottom) {
    var cv = document.createElement('canvas');
    cv.width = 4; cv.height = 256;
    var ctx = cv.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#' + top.getHexString());
    g.addColorStop(0.55, '#' + mixColor(top, bottom, 0.65).getHexString());
    g.addColorStop(1, '#' + bottom.getHexString());
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    var tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
  }

  function buildSky() {
    S.skyTex = makeSkyTexture(new THREE.Color(0x3f92cf), new THREE.Color(0xcfe6f2));
    var mat = new THREE.MeshBasicMaterial({ map: S.skyTex, side: THREE.BackSide, depthWrite: false, fog: false });
    var geo = new THREE.SphereGeometry(520, 20, 14);
    S.sky = new THREE.Mesh(geo, mat);
    S.sky.frustumCulled = false;
    S.sky.renderOrder = -10;
    S.scene.add(S.sky);

    var sunMat = new THREE.MeshBasicMaterial({ color: 0xfff3c4, transparent: true, opacity: 0.9, fog: false, depthWrite: false });
    S.sunMesh = new THREE.Mesh(new THREE.SphereGeometry(16, 10, 8), sunMat);
    S.sunMesh.frustumCulled = false;
    S.sunMesh.renderOrder = -9;
    S.scene.add(S.sunMesh);
  }

  function buildWater() {
    var deep = new THREE.Mesh(
      new THREE.PlaneGeometry(2200, 2200),
      new THREE.MeshBasicMaterial({ color: 0x0a2536, fog: true })
    );
    deep.rotation.x = -Math.PI / 2;
    deep.position.y = 0.9;
    deep.matrixAutoUpdate = false;
    deep.updateMatrix();
    S.scene.add(deep);
    S.waterDeep = deep;

    var surf = new THREE.Mesh(
      new THREE.PlaneGeometry(2200, 2200),
      new THREE.MeshBasicMaterial({ color: 0x2f7fa8, transparent: true, opacity: 0.82, depthWrite: false, fog: true })
    );
    surf.rotation.x = -Math.PI / 2;
    surf.position.y = 2.55;
    surf.matrixAutoUpdate = false;
    surf.updateMatrix();
    surf.renderOrder = 1;
    S.scene.add(surf);
    S.water = surf;
  }

  function buildScenery() {
    var geo = new THREE.ConeGeometry(1, 1, 6);
    var mat = new THREE.MeshBasicMaterial({ color: 0x5d7c95, fog: true });
    var count = S.quality.low ? 10 : 16;
    var inst = new THREE.InstancedMesh(geo, mat, count);
    var dummy = new THREE.Object3D();
    for (var i = 0; i < count; i++) {
      var a = (i / count) * Math.PI * 2 + (i % 3) * 0.24;
      var r = 260 + (i % 5) * 26;
      dummy.position.set(Math.sin(a) * r, 4, Math.cos(a) * r);
      dummy.rotation.y = a * 1.7;
      dummy.scale.set(56 + (i % 4) * 16, 70 + (i % 5) * 22, 52 + (i % 3) * 18);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    inst.frustumCulled = false;
    inst.matrixAutoUpdate = false;
    S.scene.add(inst);
    S.scenery = inst;

    if (S.quality.low) return;

    var cgeo = new THREE.SphereGeometry(1, 7, 5);
    var cmat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false, fog: true });
    var clouds = new THREE.InstancedMesh(cgeo, cmat, 12);
    var d2 = new THREE.Object3D();
    for (var c = 0; c < 12; c++) {
      var ang = (c / 12) * Math.PI * 2 + (c % 4) * 0.5;
      var rad = 150 + (c % 6) * 26;
      d2.position.set(Math.sin(ang) * rad, 105 + (c % 5) * 12, Math.cos(ang) * rad);
      d2.scale.set(34 + (c % 4) * 10, 9 + (c % 3) * 3, 24 + (c % 5) * 8);
      d2.rotation.y = ang;
      d2.updateMatrix();
      clouds.setMatrixAt(c, d2.matrix);
    }
    clouds.instanceMatrix.needsUpdate = true;
    clouds.frustumCulled = false;
    clouds.matrixAutoUpdate = false;
    S.scene.add(clouds);
    S.clouds = clouds;
  }

  /* ============================================================
     Tiempo del día y color
     ============================================================ */
  var PALETTES = {
    day: { top: 0x3f92cf, bottom: 0xcfe6f2, fog: 0xa9cfe4, water: 0x2f7fa8, tint: 0x000000, alpha: 0 },
    dawn: { top: 0x24406b, bottom: 0xf2864a, fog: 0xc98a6c, water: 0x2a5a76, tint: 0xff9a55, alpha: 0.14 },
    dusk: { top: 0x2b3f70, bottom: 0xf26a1b, fog: 0xb8734f, water: 0x27506a, tint: 0xff7a3a, alpha: 0.13 },
    night: { top: 0x040a18, bottom: 0x0d2036, fog: 0x0a1826, water: 0x0d2a3d, tint: 0x041024, alpha: 0.42 }
  };

  function paletteFor(time) {
    var f = (time / 1440) % 1;
    if (f < 0.21) return PALETTES.night;
    if (f < 0.29) return PALETTES.dawn;
    if (f < 0.71) return PALETTES.day;
    if (f < 0.79) return PALETTES.dusk;
    return PALETTES.night;
  }

  function updateSky(force) {
    var pal = paletteFor(S.clockTime);
    var key = pal.top + '|' + pal.bottom;
    if (key !== S.skyKey || force) {
      S.skyKey = key;
      var top = new THREE.Color(pal.top), bottom = new THREE.Color(pal.bottom);
      if (S.skyTex) S.skyTex.dispose();
      S.skyTex = makeSkyTexture(top, bottom);
      S.sky.material.map = S.skyTex;
      S.sky.material.needsUpdate = true;
      if (S.water) S.water.material.color.setHex(pal.water);
      if (S.waterDeep) S.waterDeep.material.color.setHex(pal.water).multiplyScalar(0.42);
      if (S.scenery) S.scenery.material.color.setHex(pal.fog).multiplyScalar(0.72);
      S.scene.fog.color.setHex(pal.fog);
      S.renderer.setClearColor(pal.fog);
      if (S.dom.tint) {
        var t = new THREE.Color(pal.tint);
        S.dom.tint.style.background = 'rgba(' + Math.round(t.r * 255) + ',' + Math.round(t.g * 255) + ',' + Math.round(t.b * 255) + ',' + pal.alpha + ')';
        S.dom.tint.style.opacity = pal.alpha > 0 ? '1' : '0';
      }
    }
    var f = (S.clockTime / 1440) % 1;
    var sunAngle = (f - 0.25) * Math.PI * 2;
    var sunDir = S.tmp.v1.set(Math.cos(sunAngle) * 0.4, Math.sin(sunAngle), Math.cos(sunAngle) * 0.55).normalize();
    S.sunMesh.position.copy(sunDir).multiplyScalar(430);
    S.sunMesh.visible = sunDir.y > 0.02;
    if (S.sunMesh.visible) {
      S.sunMesh.material.color.setHex(pal === PALETTES.day ? 0xfff6d0 : 0xffb26b);
      S.sunMesh.material.opacity = pal === PALETTES.day ? 0.95 : 0.75;
    }
  }

  /* ============================================================
     Modelos de personaje
     ============================================================ */
  function getCharFrame(which) {
    if (S.charFrames[which]) return S.charFrames[which];
    var gltf = S.modelCache[CHARS_URL];
    if (!gltf) return null;
    var rigName = which === 'sasuke' ? 'rig001' : 'rig';
    var rig = gltf.scene.getObjectByName(rigName) || gltf.scene.getObjectByName(rigName === 'rig' ? 'rig' : 'rig.001');
    if (!rig) return null;
    gltf.scene.updateMatrixWorld(true);
    var frame = { rig: rig, matrix: rig.matrixWorld.clone() };
    S.charFrames[which] = frame;
    return frame;
  }

  function skinnedBox(meshes) {
    var box = new THREE.Box3();
    var v = new THREE.Vector3();
    meshes.forEach(function (o) {
      if (o.skeleton && o.skeleton.update) o.skeleton.update();
      var pos = o.geometry.attributes.position;
      for (var i = 0; i < pos.count; i++) {
        o.boneTransform(i, v);
        v.applyMatrix4(o.matrixWorld);
        box.expandByPoint(v);
      }
    });
    return box;
  }

  function normalizationFor(box, targetHeight) {
    var size = box.getSize(new THREE.Vector3());
    var height = Math.max(0.001, size.y);
    var s = targetHeight / height;
    var cx = (box.min.x + box.max.x) / 2;
    var cz = (box.min.z + box.max.z) / 2;
    var m = new THREE.Matrix4().makeTranslation(-cx * s, -box.min.y * s, -cz * s);
    m.multiply(new THREE.Matrix4().makeScale(s, s, s));
    return m;
  }

  function collectRigMeshes(rig) {
    var list = [];
    rig.traverse(function (o) {
      if (!o.isMesh) return;
      if (isOutline(o)) { o.visible = false; return; }
      list.push(o);
    });
    return list;
  }

  function createPlayerModel(which) {
    var frame = getCharFrame(which);
    if (!frame) return null;
    var clone = THREE.SkeletonUtils.clone(frame.rig);
    clone.matrixAutoUpdate = false;
    clone.matrix.copy(frame.matrix);
    var meshes = collectRigMeshes(clone);
    if (!meshes.length) return null;
    var helper = new THREE.Group();
    helper.add(clone);
    helper.updateMatrixWorld(true);
    var box = skinnedBox(meshes);
    var norm = normalizationFor(box, PLAYER_HEIGHT);
    clone.matrix.copy(frame.matrix).premultiply(norm);
    helper.updateMatrixWorld(true);

    meshes.forEach(function (o) {
      o.material = basicMaterialFrom(o.material, { skinning: true, forceClone: true });
      o.frustumCulled = false;
      if (o.skeleton && o.skeleton.update) o.skeleton.update();
    });

    var root = new THREE.Group();
    var holder = new THREE.Group();
    holder.add(clone);
    root.add(holder);
    root.matrixAutoUpdate = true;

    var boneMap = {};
    var names = BONE_NAMES[which];
    var bones = [];
    if (names) {
      Object.keys(names).forEach(function (slot) {
        var bone = clone.getObjectByName(names[slot]);
        if (!bone) return;
        var pq = new THREE.Quaternion();
        bone.parent.getWorldQuaternion(pq);
        pq.invert();
        var axis = new THREE.Vector3(1, 0, 0).applyQuaternion(pq);
        boneMap[slot] = { bone: bone, rest: bone.quaternion.clone(), axis: axis };
        bones.push(boneMap[slot]);
      });
    }

    var shadow = makeBlobShadow(0.62);
    shadow.position.y = 0.05;
    root.add(shadow);

    var runKit = createRunKit(clone, which);
    return { which: which, root: root, holder: holder, model: clone, bones: boneMap, meshes: meshes, shadow: shadow, runKit: runKit, runTime: 0 };
  }

  function runBoneAxis(bone) {
    if (!bone || !bone.parent) return new THREE.Vector3(1, 0, 0);
    var pq = new THREE.Quaternion();
    bone.parent.getWorldQuaternion(pq);
    pq.invert();
    return new THREE.Vector3(1, 0, 0).applyQuaternion(pq).normalize();
  }

  function createRunKit(clone, which) {
    var gltf = S.modelCache[RUN_URL];
    var map = RUN_LEG_MAP[which];
    if (!gltf || !map || !gltf.animations || !gltf.animations.length) return null;
    var runScene = gltf.scene;
    var cache = runScene.userData.__k3dRunRest;
    if (!cache) {
      cache = {};
      runScene.traverse(function (o) {
        if (o.isBone) cache[o.name] = o.quaternion.clone();
      });
      runScene.userData.__k3dRunRest = cache;
    }

    var srcBone = {}, srcRest = {}, srcRestInv = {};
    var targetBone = {}, targetRest = {};
    Object.keys(map).forEach(function (targetName) {
      var tb = clone.getObjectByName(targetName);
      var sb = runScene.getObjectByName(map[targetName]);
      if (!tb || !sb) return;
      targetBone[targetName] = tb;
      targetRest[targetName] = tb.quaternion.clone();
      srcBone[targetName] = sb;
      var rest = cache[sb.name] || sb.quaternion.clone();
      srcRest[targetName] = rest;
      srcRestInv[targetName] = rest.clone().invert();
    });
    if (!Object.keys(targetBone).length) return null;

    var armNames = which === 'sasuke'
      ? ['DEF-upper_armL_0156', 'DEF-upper_armR_0282']
      : ['DEF-upper_armL_0569', 'DEF-upper_armR_0694'];
    var armData = [];
    armNames.forEach(function (name, idx) {
      var bone = clone.getObjectByName(name);
      if (!bone) return;
      armData.push({
        bone: bone,
        rest: bone.quaternion.clone(),
        axis: runBoneAxis(bone),
        side: idx === 0 ? 1 : -1
      });
    });

    var names = BONE_NAMES[which] || {};
    var headBone = names.head ? clone.getObjectByName(names.head) : null;
    var headRest = headBone ? headBone.quaternion.clone() : null;
    var headAxis = headBone ? runBoneAxis(headBone) : null;

    var footBones = [];
    Object.keys(targetBone).forEach(function (name) {
      if (/foot|toe/i.test(name)) footBones.push(targetBone[name]);
    });

    var clip = gltf.animations[0];
    var mixer = new THREE.AnimationMixer(runScene);
    var action = mixer.clipAction(clip);
    action.play();

    return {
      which: which, runScene: runScene, clip: clip, mixer: mixer,
      duration: clip.duration || 0.6333,
      srcBone: srcBone, srcRest: srcRest, srcRestInv: srcRestInv,
      targetBone: targetBone, targetRest: targetRest,
      armData: armData, headBone: headBone, headRest: headRest, headAxis: headAxis,
      footBones: footBones, lean: 0.12
    };
  }

  function resetRunPose(p) {
    var kit = p && p.runKit;
    if (!kit) return;
    Object.keys(kit.targetBone).forEach(function (name) {
      kit.targetBone[name].quaternion.copy(kit.targetRest[name]);
    });
    kit.armData.forEach(function (a) { a.bone.quaternion.copy(a.rest); });
    if (kit.headBone && kit.headRest) kit.headBone.quaternion.copy(kit.headRest);
    if (p.holder) {
      p.holder.rotation.x = 0;
      p.holder.position.y = 0;
    }
    p.runActive = false;
  }

  function applyRunPose(p, dt, speedNow) {
    var kit = p && p.runKit;
    if (!kit) return false;
    var ratio = clamp(speedNow / 7.6, 0, 1.2);
    p.runTime = (p.runTime || 0) + dt * (1.15 + ratio * 0.55);
    var t = p.runTime % kit.duration;
    kit.mixer.setTime(t);

    Object.keys(kit.targetBone).forEach(function (name) {
      var delta = S.tmp.q1.copy(kit.srcRestInv[name]).multiply(kit.srcBone[name].quaternion);
      kit.targetBone[name].quaternion.copy(kit.targetRest[name]).multiply(delta);
    });

    var sway = Math.sin(t / kit.duration * Math.PI * 2);
    kit.armData.forEach(function (a) {
      var q = S.tmp.q2.setFromAxisAngle(a.axis, 1.15 + sway * 0.09 * a.side);
      a.bone.quaternion.copy(a.rest).premultiply(q);
    });
    if (kit.headBone && kit.headRest && kit.headAxis) {
      kit.headBone.quaternion.copy(kit.headRest);
      S.tmp.q1.setFromAxisAngle(kit.headAxis, -0.08);
      kit.headBone.quaternion.premultiply(S.tmp.q1);
    }

    if (p.holder) p.holder.rotation.x = kit.lean;
    if (p.holder) p.holder.position.y = 0;
    p.root.updateMatrixWorld(true);
    var minY = Infinity;
    var v = S.tmp.v1;
    kit.footBones.forEach(function (bone) {
      bone.getWorldPosition(v);
      p.root.worldToLocal(v);
      if (v.y < minY) minY = v.y;
    });
    if (p.holder && isFinite(minY)) p.holder.position.y = -minY;
    p.runActive = true;
    return true;
  }

  function bakeRig(which, targetHeight) {
    var frame = getCharFrame(which);
    if (!frame) return null;
    var clone = THREE.SkeletonUtils.clone(frame.rig);
    clone.matrixAutoUpdate = false;
    clone.matrix.copy(frame.matrix);
    var holder = new THREE.Group();
    holder.add(clone);
    holder.updateMatrixWorld(true);
    var meshes = collectRigMeshes(clone);
    if (!meshes.length) return null;
    var box = skinnedBox(meshes);
    var norm = normalizationFor(box, targetHeight);
    var group = new THREE.Group();
    var m = new THREE.Matrix4();
    var v = new THREE.Vector3();
    meshes.forEach(function (o) {
      if (o.skeleton && o.skeleton.update) o.skeleton.update();
      var src = o.geometry.attributes.position;
      var arr = new Float32Array(src.count * 3);
      m.multiplyMatrices(norm, o.matrixWorld);
      for (var i = 0; i < src.count; i++) {
        o.boneTransform(i, v);
        v.applyMatrix4(m);
        arr[i * 3] = v.x; arr[i * 3 + 1] = v.y; arr[i * 3 + 2] = v.z;
      }
      var geo = o.geometry.clone();
      geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      if (geo.attributes.skinIndex) geo.deleteAttribute('skinIndex');
      if (geo.attributes.skinWeight) geo.deleteAttribute('skinWeight');
      geo.deleteAttribute('normal');
      geo.computeBoundingBox();
      geo.computeBoundingSphere();
      var mesh = new THREE.Mesh(geo, basicMaterialFrom(o.material, { skinning: false, forceClone: true }));
      mesh.matrixAutoUpdate = false;
      mesh.frustumCulled = true;
      group.add(mesh);
    });
    return group;
  }

  function prepareKakashi() {
    var gltf = S.modelCache[KAKASHI_URL];
    if (!gltf) return null;
    var root = gltf.scene;
    if (!root.userData.__k3dPrepared) {
      root.traverse(function (o) {
        if (!o.isMesh) return;
        if (!o.userData.__k3dMat) {
          o.material = basicMaterialFrom(o.material, { forceClone: true });
          o.userData.__k3dMat = true;
        }
        if (!o.userData.__k3dPosed) {
          var pos = o.geometry.attributes.position;
          for (var i = 0; i < pos.count; i++) {
            var x = pos.getX(i), z = pos.getZ(i);
            if (Math.abs(x) < 0.7 || z < 4.8) continue;
            var side = x < 0 ? -1 : 1;
            var w = Math.min(1, (Math.abs(x) - 0.7) / 0.55);
            var ang = side * (Math.PI / 2.2) * w;
            var dx = x - side * 0.7;
            var dz = z - 5.75;
            pos.setX(i, side * 0.7 + Math.cos(ang) * dx + Math.sin(ang) * dz);
            pos.setZ(i, 5.75 + (-Math.sin(ang) * dx + Math.cos(ang) * dz));
          }
          pos.needsUpdate = true;
          o.geometry.computeBoundingBox();
          o.geometry.computeBoundingSphere();
          o.userData.__k3dPosed = true;
        }
        o.matrixAutoUpdate = false;
        o.updateMatrix();
      });
      root.updateMatrixWorld(true);
      var raw = new THREE.Box3().setFromObject(root);
      var size = raw.getSize(new THREE.Vector3());
      var s = 1.76 / Math.max(0.001, size.y);
      var cx = (raw.min.x + raw.max.x) / 2;
      var cz = (raw.min.z + raw.max.z) / 2;
      root.scale.multiplyScalar(s);
      root.position.set(-cx * s, -raw.min.y * s, -cz * s);
      root.updateMatrixWorld(true);
      root.userData.__k3dPrepared = true;
    }
    return root;
  }

  /* ============================================================
     NPCs chibi procedurales (bajo coste)
     ============================================================ */
  var UNIT = null;
  function unitGeometry() {
    if (UNIT) return UNIT;
    UNIT = {
      box: new THREE.BoxGeometry(1, 1, 1),
      cyl: new THREE.CylinderGeometry(1, 1, 1, 7),
      cone: new THREE.ConeGeometry(1, 1, 6),
      sphere: new THREE.SphereGeometry(1, 8, 6)
    };
    return UNIT;
  }

  function mergeParts(parts) {
    var posCount = 0, idxCount = 0;
    for (var p = 0; p < parts.length; p++) {
      posCount += parts[p].geo.attributes.position.count;
      idxCount += parts[p].geo.index ? parts[p].geo.index.count : parts[p].geo.attributes.position.count;
    }
    var positions = new Float32Array(posCount * 3);
    var colors = new Float32Array(posCount * 3);
    var indices = posCount > 65535 ? new Uint32Array(idxCount) : new Uint16Array(idxCount);
    var v = new THREE.Vector3();
    var vOff = 0, iOff = 0;
    parts.forEach(function (part) {
      var geo = part.geo, pos = geo.attributes.position, idx = geo.index;
      var count = pos.count;
      for (var i = 0; i < count; i++) {
        v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(part.matrix);
        positions[(vOff + i) * 3] = v.x;
        positions[(vOff + i) * 3 + 1] = v.y;
        positions[(vOff + i) * 3 + 2] = v.z;
        colors[(vOff + i) * 3] = part.color.r;
        colors[(vOff + i) * 3 + 1] = part.color.g;
        colors[(vOff + i) * 3 + 2] = part.color.b;
      }
      if (idx) {
        for (var k = 0; k < idx.count; k++) indices[iOff + k] = idx.getX(k) + vOff;
        iOff += idx.count;
      } else {
        for (var n = 0; n < count; n++) indices[iOff + n] = n + vOff;
        iOff += count;
      }
      vOff += count;
    });
    var out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    out.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    out.setIndex(new THREE.BufferAttribute(indices, 1));
    out.computeBoundingSphere();
    return out;
  }

  function makePartFactory(parts) {
    var u = unitGeometry();
    function push(geo, color, x, y, z, rx, ry, rz, sx, sy, sz) {
      var m = new THREE.Matrix4();
      m.makeRotationFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0));
      m.scale(new THREE.Vector3(sx, sy, sz));
      m.setPosition(x || 0, y || 0, z || 0);
      parts.push({ geo: geo, matrix: m, color: new THREE.Color(color) });
    }
    return {
      box: function (color, x, y, z, sx, sy, sz, rx, ry, rz) { push(u.box, color, x, y, z, rx, ry, rz, sx, sy, sz); },
      cyl: function (color, x, y, z, sx, sy, sz, rx, ry, rz) { push(u.cyl, color, x, y, z, rx, ry, rz, sx, sy, sz); },
      cone: function (color, x, y, z, sx, sy, sz, rx, ry, rz) { push(u.cone, color, x, y, z, rx, ry, rz, sx, sy, sz); },
      sphere: function (color, x, y, z, sx, sy, sz, rx, ry, rz) { push(u.sphere, color, x, y, z, rx, ry, rz, sx, sy, sz); }
    };
  }

  function chibiGeometry(art) {
    art = art || {};
    var skin = art.skin || '#e8c4a0';
    var hair = art.hair || '#2a2422';
    var hair2 = art.hair2 || hair;
    var outfit = art.outfit || '#3a5a52';
    var outfit2 = art.outfit2 || '#20342e';
    var trim = art.trim || '#d8c9a8';
    var band = art.band || '#1c2b4a';
    var style = art.style || 'short';
    var accessory = art.accessory || 'none';
    var parts = [];
    var f = makePartFactory(parts);
    var dark = '#1a1a22';

    // piernas (de pie o sentado)
    if (art.seated) {
      f.box(outfit2, -0.12, 0.56, 0.2, 0.17, 0.16, 0.42);
      f.box(outfit2, 0.12, 0.56, 0.2, 0.17, 0.16, 0.42);
      f.box(outfit2, -0.12, 0.3, 0.4, 0.17, 0.38, 0.19);
      f.box(outfit2, 0.12, 0.3, 0.4, 0.17, 0.38, 0.19);
      f.box(dark, -0.12, 0.07, 0.44, 0.2, 0.1, 0.28);
      f.box(dark, 0.12, 0.07, 0.44, 0.2, 0.1, 0.28);
      f.box(trim, -0.12, 0.19, 0.4, 0.185, 0.12, 0.2);
      f.box(trim, 0.12, 0.19, 0.4, 0.185, 0.12, 0.2);
    } else {
      f.box(outfit2, -0.12, 0.28, 0, 0.17, 0.56, 0.19);
      f.box(outfit2, 0.12, 0.28, 0, 0.17, 0.56, 0.19);
      f.box(dark, -0.12, 0.05, 0.03, 0.2, 0.1, 0.28);
      f.box(dark, 0.12, 0.05, 0.03, 0.2, 0.1, 0.28);
      f.box(trim, -0.12, 0.2, 0.01, 0.185, 0.12, 0.2);
      f.box(trim, 0.12, 0.2, 0.01, 0.185, 0.12, 0.2);
    }

    // torso
    f.box(outfit, 0, 0.78, 0, 0.46, 0.52, 0.28);
    f.box(outfit2, 0, 0.62, 0.02, 0.48, 0.2, 0.3);
    f.box(trim, 0, 0.9, 0.15, 0.16, 0.32, 0.03);
    f.box(outfit, -0.31, 0.8, 0, 0.14, 0.46, 0.16, 0, 0, -0.14);
    f.box(outfit, 0.31, 0.8, 0, 0.14, 0.46, 0.16, 0, 0, 0.14);
    f.box(skin, -0.34, 0.55, 0.01, 0.11, 0.13, 0.13);
    f.box(skin, 0.34, 0.55, 0.01, 0.11, 0.13, 0.13);
    f.box(skin, 0, 1.06, 0, 0.16, 0.1, 0.15);

    // cabeza
    f.box(skin, 0, 1.22, 0, 0.34, 0.3, 0.32);
    f.box('#ffffff', -0.07, 1.25, 0.16, 0.08, 0.07, 0.02);
    f.box('#ffffff', 0.07, 1.25, 0.16, 0.08, 0.07, 0.02);
    f.box(dark, -0.07, 1.25, 0.175, 0.045, 0.05, 0.01);
    f.box(dark, 0.07, 1.25, 0.175, 0.045, 0.05, 0.01);

    // pelo
    f.box(hair, 0, 1.39, -0.01, 0.36, 0.14, 0.34);
    if (style === 'spiky') {
      for (var i = 0; i < 7; i++) {
        var a = (i / 7) * Math.PI - Math.PI / 2;
        f.cone(i % 2 ? hair : hair2, Math.sin(a) * 0.14, 1.5 + (i % 3) * 0.03, Math.cos(a) * 0.1 - 0.02, 0.1, 0.18, 0.1, 0, 0, Math.sin(a) * 0.4);
      }
    } else if (style === 'ponytail') {
      f.box(hair, 0, 1.34, -0.19, 0.12, 0.1, 0.12);
      f.cyl(hair2, 0, 1.15, -0.25, 0.07, 0.4, 0.07, 0.35, 0, 0);
    } else if (style === 'long') {
      f.box(hair, -0.17, 1.14, -0.06, 0.08, 0.5, 0.2);
      f.box(hair, 0.17, 1.14, -0.06, 0.08, 0.5, 0.2);
      f.box(hair2, 0, 1.1, -0.18, 0.3, 0.45, 0.08);
    } else if (style === 'silver') {
      for (var s = 0; s < 5; s++) {
        f.cone(hair, -0.2 + s * 0.1, 1.52, -0.05, 0.09, 0.2, 0.09, 0, 0, (s - 2) * 0.25);
      }
    } else if (style === 'bowl') {
      f.box(hair, 0, 1.36, 0, 0.4, 0.2, 0.36);
    } else if (style === 'gaara') {
      f.box(hair, 0, 1.41, -0.01, 0.36, 0.16, 0.34);
      f.box(dark, 0, 1.22, 0.17, 0.24, 0.09, 0.01);
    }

    // bandana
    f.box(band, 0, 1.35, 0.15, 0.37, 0.1, 0.06);
    f.box('#cfd6dd', 0, 1.35, 0.185, 0.13, 0.07, 0.02);
    f.box('#8d949c', 0, 1.35, 0.195, 0.05, 0.04, 0.01);

    if (accessory === 'whiskers') {
      f.box(dark, -0.13, 1.2, 0.17, 0.06, 0.01, 0.01);
      f.box(dark, -0.13, 1.16, 0.17, 0.06, 0.01, 0.01);
      f.box(dark, 0.13, 1.2, 0.17, 0.06, 0.01, 0.01);
      f.box(dark, 0.13, 1.16, 0.17, 0.06, 0.01, 0.01);
    } else if (accessory === 'mask') {
      f.box('#20242c', 0, 1.13, 0.165, 0.31, 0.14, 0.03);
    } else if (accessory === 'hat') {
      f.cyl('#e8e2d8', 0, 1.5, 0, 0.3, 0.06, 0.3);
      f.cone('#c9402e', 0, 1.62, 0, 0.18, 0.16, 0.18);
      f.cyl('#8a2a2a', 0, 1.52, 0, 0.31, 0.03, 0.31);
    } else if (accessory === 'scar') {
      f.box('#b5645a', 0, 1.2, 0.17, 0.03, 0.02, 0.01, 0, 0, 0.6);
    } else if (accessory === 'brows') {
      f.box(dark, -0.08, 1.32, 0.165, 0.1, 0.03, 0.01);
      f.box(dark, 0.08, 1.32, 0.165, 0.1, 0.03, 0.01);
    } else if (accessory === 'forehead') {
      f.box(art.trim || '#f7a8c1', 0, 1.37, 0.17, 0.1, 0.07, 0.02, 0, 0, 0.78);
    }

    return mergeParts(parts);
  }

  /* Aspecto de cada habitante (colores y peinado) */
  var NPC_ART = {
    iruka: { hair: '#3b2a1f', style: 'ponytail', outfit: '#3d5a78', outfit2: '#2a3f57', trim: '#d8c9a8', accessory: 'scar' },
    hokage: { hair: '#bdb7ae', style: 'short', outfit: '#f0ece0', outfit2: '#d8d2c2', trim: '#c9402e', accessory: 'hat' },
    shikamaru: { hair: '#2b2b33', style: 'ponytail', outfit: '#44555e', outfit2: '#2e3b42', trim: '#8b9aa3' },
    sakura: { hair: '#f0a6c0', style: 'short', outfit: '#c94f52', outfit2: '#8f3a3d', trim: '#f3e7d8', accessory: 'forehead' },
    rocklee: { hair: '#1f1b1a', style: 'bowl', outfit: '#2f7a4a', outfit2: '#1f5c35', trim: '#ece7d8', accessory: 'brows' },
    hinata: { hair: '#2b3d63', style: 'long', outfit: '#e8ebf4', outfit2: '#c2c9d9', trim: '#8fa2c4' },
    teuchi: { hair: '#4a3a2f', style: 'short', outfit: '#f2f1ea', outfit2: '#dbd8ce', trim: '#c9402e', accessory: 'hat' },
    konohamaru: { hair: '#5a4128', style: 'spiky', outfit: '#e0b23c', outfit2: '#b98a24', trim: '#4f7bbf' },
    gate: { hair: '#2a2422', style: 'short', outfit: '#3d5a78', outfit2: '#2a3f57', trim: '#7f8a92' },
    kiba: { hair: '#4a3f37', style: 'spiky', outfit: '#5a5f6b', outfit2: '#3f434c', trim: '#8d949c', accessory: 'scar' },
    shino: { hair: '#2a2a30', style: 'bowl', outfit: '#3d4a52', outfit2: '#2a333a', trim: '#7f8a92' },
    ino: { hair: '#f0d489', style: 'ponytail', outfit: '#6b4b78', outfit2: '#4e3557', trim: '#e3d6c4' },
    choji: { hair: '#7a4a2a', style: 'spiky', outfit: '#4a6b3a', outfit2: '#37502c', trim: '#d9c26a' },
    sasuke: { hair: '#23222b', style: 'spiky', outfit: '#2f3f8f', outfit2: '#232f6b', trim: '#e9e4d8' },
    naruto: { hair: '#f2cf4a', style: 'spiky', outfit: '#e2701f', outfit2: '#b8551a', trim: '#3d5a78', accessory: 'whiskers' },
    kakashi: { hair: '#d6d6d6', style: 'silver', outfit: '#3f5a4a', outfit2: '#2c4034', trim: '#20242c', accessory: 'mask' }
  };

  function genericArt(id) {
    var h = 0;
    for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
    var styles = ['short', 'spiky', 'bowl', 'ponytail', 'long'];
    return {
      hair: 'hsl(' + h + ',30%,26%)',
      hair2: 'hsl(' + h + ',26%,20%)',
      outfit: 'hsl(' + ((h + 168) % 360) + ',28%,40%)',
      outfit2: 'hsl(' + ((h + 168) % 360) + ',30%,28%)',
      trim: 'hsl(' + ((h + 40) % 360) + ',22%,74%)',
      style: styles[h % styles.length]
    };
  }

  function artFor(def) {
    if (def.art) return def.art;
    return NPC_ART[def.id] || genericArt(def.id || 'konoha');
  }

  function makeChibi(art, scale) {
    var geo = chibiGeometry(art);
    var mat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: true });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    var group = new THREE.Group();
    group.add(mesh);
    group.scale.setScalar((scale || 1) * 0.98);
    return group;
  }

  /* ============================================================
     Etiquetas, marcadores y sombras
     ============================================================ */
  function makeBlobShadow(size) {
    var key = 'shadow';
    if (!S.modelCache[key]) {
      var cv = document.createElement('canvas');
      cv.width = 64; cv.height = 64;
      var ctx = cv.getContext('2d');
      var g = ctx.createRadialGradient(32, 32, 2, 32, 32, 31);
      g.addColorStop(0, 'rgba(0,0,0,0.62)');
      g.addColorStop(0.45, 'rgba(0,0,0,0.4)');
      g.addColorStop(0.8, 'rgba(0,0,0,0.12)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      var tex = new THREE.CanvasTexture(cv);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      S.modelCache[key] = tex;
    }
    var mat = new THREE.MeshBasicMaterial({ map: S.modelCache[key], transparent: true, depthWrite: false, fog: false, opacity: 0.85 });
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(size * 2.2, size * 2.2), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 1;
    return mesh;
  }

  function makeLabelTexture(name, role, accent) {
    var key = 'label:' + name + '|' + role + '|' + accent;
    if (S.modelCache[key]) return S.modelCache[key];
    var cv = document.createElement('canvas');
    cv.width = 320; cv.height = 76;
    var ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, 320, 76);
    ctx.fillStyle = 'rgba(4,14,23,0.78)';
    ctx.fillRect(10, 4, 300, 62);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 4, 300, 62);
    ctx.fillStyle = accent;
    ctx.fillRect(10, 4, 8, 62);
    ctx.fillStyle = '#eaf6ff';
    ctx.font = '700 26px Rajdhani, Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(String(name || '').slice(0, 24), 30, 34);
    ctx.fillStyle = '#9fc4d8';
    ctx.font = '600 14px Rajdhani, Segoe UI, sans-serif';
    ctx.fillText(String(role || 'Shinobi de la Hoja').slice(0, 42), 30, 56);
    var tex = new THREE.CanvasTexture(cv);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.encoding = THREE.sRGBEncoding;
    S.modelCache[key] = tex;
    return tex;
  }

  function makeLabelSprite(name, role, accent) {
    var mat = new THREE.SpriteMaterial({
      map: makeLabelTexture(name, role, accent),
      transparent: true,
      depthWrite: false,
      fog: false
    });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(2.7, 0.64, 1);
    return sprite;
  }

  var markerCache = {};
  function makeMarkerSprite(kind) {
    if (markerCache[kind]) {
      var cached = new THREE.Sprite(new THREE.SpriteMaterial({ map: markerCache[kind], transparent: true, depthWrite: false, fog: false }));
      cached.scale.set(0.72, 0.72, 1);
      return cached;
    }
    var cv = document.createElement('canvas');
    cv.width = 96; cv.height = 96;
    var ctx = cv.getContext('2d');
    var accent = kind === 'quest' ? '#ffc247' : kind === 'spar' ? '#ff8a2a' : '#66d9ff';
    ctx.beginPath();
    ctx.arc(48, 48, 34, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(4,14,23,0.82)';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = accent;
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.font = '700 52px Rajdhani, Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(kind === 'quest' ? '!' : kind === 'spar' ? '★' : '…', 48, 52);
    var tex = new THREE.CanvasTexture(cv);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.encoding = THREE.sRGBEncoding;
    markerCache[kind] = tex;
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
    sprite.scale.set(0.72, 0.72, 1);
    return sprite;
  }

  /* ============================================================
     Construcción del mundo jugable
     ============================================================ */
  function buildWorld() {
    setLoading(62, 'COLOCANDO LAS CALLES DE KONOHA...');
    S.village = prepareVillage();
    if (!S.village) throw new Error('No se pudo preparar la aldea');
    S.scene.add(S.village);
    buildHeightmap(S.village);

    setLoading(72, 'CALCULANDO RUTAS DE LA ALDEA...');
    var hm = S.hm;
    bfsReachable(hm, -27.7, 0.1);

    buildSky();
    buildWater();
    buildScenery();
    updateSky(true);

    S.scene.fog = new THREE.Fog(0xa9cfe4, 65, 330);

    setLoading(80, 'INVOCANDO AL SHINOBI...');
    var playerModel = S.opts.playerModel === 'sasuke' ? 'sasuke' : 'naruto';
    var player = createPlayerModel(playerModel);
    if (!player) {
      player = createFallbackPlayer();
    }
    S.player = player;
    S.scene.add(player.root);
    var spawn = resolveReachable(
      (S.opts.spawn && typeof S.opts.spawn.x === 'number') ? S.opts.spawn.x : -27.7,
      (S.opts.spawn && typeof S.opts.spawn.z === 'number') ? S.opts.spawn.z : 0.1,
      45
    ) || { x: -27.7, y: 9.5, z: 0.1 };
    player.root.position.set(spawn.x, spawn.y, spawn.z);
    player.x = spawn.x; player.z = spawn.z; player.y = spawn.y;
    player.groundY = spawn.y; player.jumpY = 0; player.vy = 0; player.onGround = true;
    player.phase = 0; player.speed = 0; player.velX = 0; player.velZ = 0;
    var spawnRot = (S.opts.spawn && typeof S.opts.spawn.rot === 'number') ? S.opts.spawn.rot : Math.PI;
    player.yaw = spawnRot + Math.PI;
    player.targetYaw = player.yaw;
    player.root.rotation.y = player.yaw;
    S.cam.yaw = spawnRot;
    S.cam.target = new THREE.Vector3();
    S.cam.pos = new THREE.Vector3();
    S.cam.initialized = false;

    setLoading(86, 'PREPARANDO EL DESPACHO DEL HOKAGE...');
    buildHokageRoom();
    buildHokageCheckpoint();
    setLoading(90, 'LLAMANDO A LOS HABITANTES...');
    buildNpcs();
    buildScrolls();
    setLoading(97, 'ABRIENDO LAS PUERTAS...');
  }

  function createFallbackPlayer() {
    var root = new THREE.Group();
    var body = new THREE.Mesh(new THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.35, 1.0, 4, 8) : new THREE.CylinderGeometry(0.35, 0.35, 1.6, 8), new THREE.MeshBasicMaterial({ color: 0xf26a1b }));
    body.position.y = 0.85;
    root.add(body);
    var shadow = makeBlobShadow(0.6);
    root.add(shadow);
    return { which: 'naruto', root: root, holder: root, model: body, bones: {}, meshes: [body], shadow: shadow };
  }

  function buildNpcs() {
    var list = Array.isArray(S.opts.npcs) ? S.opts.npcs : [];
    var used = [];
    list.forEach(function (def) {
      if (!def || !def.id) return;
      var roomNpc = !!def.room;
      var spot;
      if (roomNpc) {
        spot = { x: ROOM_X + (def.x || 0), z: ROOM_Z + (def.z || 0), y: ROOM_FLOOR };
      } else {
        spot = resolveReachable(def.x, def.z, 55);
        if (spot) {
          used.push({ x: spot.x, z: spot.z });
        } else {
          var fallback = findReachableSpot(-27.7, 0.1, 90, 6, used);
          if (!fallback) return;
          spot = fallback;
        }
      }
      var group = new THREE.Group();
      var full = null;
      if (def.model === 'rival') {
        full = bakeRig(S.opts.playerModel === 'sasuke' ? 'naruto' : 'sasuke', PLAYER_HEIGHT);
      } else if (def.model === 'kakashi') {
        full = prepareKakashi();
      }
      if (full) {
        group.add(full);
      } else {
        var art = artFor(def);
        if (def.seated) art = Object.assign({}, art, { seated: true });
        group.add(makeChibi(art, def.scale || 1));
      }
      var shadow = makeBlobShadow(full ? 0.66 : 0.58);
      shadow.position.y = 0.05;
      group.add(shadow);

      var label = makeLabelSprite(def.name || def.id, def.role || 'Shinobi de la Hoja', def.id === 'hokage' ? '#ffc247' : '#66d9ff');
      label.position.y = full ? 2.35 : (def.seated ? 1.9 : 2.0);
      label.visible = false;
      group.add(label);

      var marker = makeMarkerSprite(def.marker === 'story' ? 'quest' : def.marker === 'mission' ? 'quest' : def.marker === 'spar' ? 'spar' : 'talk');
      marker.position.y = full ? 2.9 : (def.seated ? 2.25 : 2.5);
      marker.visible = false;
      group.add(marker);

      group.position.set(spot.x, spot.y, spot.z);
      var baseYaw = roomNpc
        ? (typeof def.yaw === 'number' ? def.yaw : Math.PI / 2)
        : Math.atan2(-spot.x, -spot.z);
      group.rotation.y = baseYaw;
      group.matrixAutoUpdate = true;
      if (roomNpc) group.visible = !!(S.room && S.room.active);
      S.scene.add(group);
      S.npcs.push({
        id: def.id, name: def.name || def.id, role: def.role || '',
        marker: def.marker || 'talk',
        x: spot.x, z: spot.z, groundY: spot.y,
        baseYaw: baseYaw, yaw: baseYaw,
        group: group, label: label, markerSprite: marker,
        phase: Math.random() * 6.28,
        full: !!full,
        seated: !!def.seated,
        roomNpc: roomNpc,
        fixedYaw: roomNpc || !!def.fixedYaw,
        labelAccent: def.id === 'hokage' ? '#ffc247' : '#66d9ff'
      });
    });
  }

  function makeRoomPortal(x, z, title, subtitle) {
    var group = new THREE.Group();
    group.position.set(x, ROOM_FLOOR + 0.035, z);
    var ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.02, 0.055, 8, 36),
      new THREE.MeshBasicMaterial({ color: 0xffc247, transparent: true, opacity: 0.9, fog: false, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);
    var disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.92, 32),
      new THREE.MeshBasicMaterial({ color: 0xffc247, transparent: true, opacity: 0.13, side: THREE.DoubleSide, fog: false, depthWrite: false })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.005;
    group.add(disc);
    var beaconMat = new THREE.MeshBasicMaterial({ color: 0xffc247, transparent: true, opacity: 0.1, side: THREE.DoubleSide, fog: false, depthWrite: false });
    var beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.42, 4.2, 8, 1, true), beaconMat);
    beacon.position.y = 1.8;
    group.add(beacon);
    var label = makeLabelSprite(title, subtitle, '#ffc247');
    label.position.y = 2.15;
    group.add(label);
    group.userData.ring = ring;
    group.userData.beacon = beacon;
    group.userData.label = label;
    S.scene.add(group);
    return { x: x, z: z, group: group, ring: ring, beacon: beacon, label: label };
  }

  function buildHokageRoom() {
    var gltf = S.modelCache[HOKAGE_ROOM_URL];
    if (!gltf) return;
    /* El modelo se cachea entre partidas: clonarlo y partir siempre de la
       altura base evita que el despacho se desplace al volver a entrar. */
    ROOM_FLOOR = 0.02;
    var root = gltf.scene.clone(true);
    root.updateMatrixWorld(true);
    var box = new THREE.Box3().setFromObject(root);
    var center = box.getCenter(new THREE.Vector3());
    root.position.x += ROOM_X - center.x;
    root.position.z += ROOM_Z - center.z;
    root.position.y += ROOM_FLOOR - box.min.y;
    root.updateMatrixWorld(true);

    /* El suelo del modelo queda algo por encima de su base: usamos la cara
       superior de la tarima como altura de apoyo del jugador. */
    var floorMesh = root.getObjectByName('Object_4');
    if (floorMesh) {
      var floorBox = new THREE.Box3().setFromObject(floorMesh);
      if (isFinite(floorBox.max.y)) ROOM_FLOOR = floorBox.max.y + 0.006;
    }

    var ceilings = [];
    root.traverse(function (o) {
      if (!o.isMesh) return;
      o.frustumCulled = true;
      if (o.name === 'Object_300' || /ceiling|techo|roof/i.test(o.name || '')) {
        o.visible = false;
        return;
      }
      if (o.material) o.material = basicMaterialFrom(o.material, { side: THREE.DoubleSide, forceClone: true });
      var mb = new THREE.Box3().setFromObject(o);
      if (isFinite(mb.min.y) && mb.min.y > ROOM_FLOOR + 2.95) {
        o.visible = false;
        ceilings.push(o.name);
      }
    });
    S.scene.add(root);

    /* Techo oscuro propio para que la cámara no vea el cielo desde dentro. */
    var ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(24.2, 17.4),
      new THREE.MeshBasicMaterial({ color: 0x241b13, side: THREE.DoubleSide, fog: false })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(ROOM_X, ROOM_FLOOR + 3.58, ROOM_Z);
    S.scene.add(ceiling);

    S.room = {
      active: false,
      root: root,
      ceiling: ceiling,
      returnPos: null,
      prevCamDist: null,
      hiddenCeilings: ceilings
    };
    S.roomExit = makeRoomPortal(ROOM_EXIT.x, ROOM_EXIT.z, 'SALIR DEL DESPACHO', 'Volver a la aldea');
    S.room.exit = S.roomExit;
    S.roomExit.label.visible = false;
  }

  function buildHokageCheckpoint() {
    var spot = resolveReachable(CHECKPOINT_X, CHECKPOINT_Z, 8);
    if (!spot) spot = resolveReachable(CHECKPOINT_X, 20, 10);
    if (!spot) spot = { x: CHECKPOINT_X, z: CHECKPOINT_Z, y: 9.56 };
    var group = new THREE.Group();
    group.position.set(spot.x, spot.y + 0.035, spot.z);

    var ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.18, 0.065, 8, 40),
      new THREE.MeshBasicMaterial({ color: 0xffc247, transparent: true, opacity: 0.92, fog: false, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);
    var disc = new THREE.Mesh(
      new THREE.CircleGeometry(1.06, 36),
      new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.16, side: THREE.DoubleSide, fog: false, depthWrite: false })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.006;
    group.add(disc);
    var inner = new THREE.Mesh(
      new THREE.TorusGeometry(0.72, 0.025, 6, 32),
      new THREE.MeshBasicMaterial({ color: 0xfff2c8, transparent: true, opacity: 0.55, fog: false, depthWrite: false })
    );
    inner.rotation.x = -Math.PI / 2;
    inner.position.y = 0.01;
    group.add(inner);
    var beaconMat = new THREE.MeshBasicMaterial({ color: 0xffc247, transparent: true, opacity: 0.08, side: THREE.DoubleSide, fog: false, depthWrite: false });
    var beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.52, 5.2, 8, 1, true), beaconMat);
    beacon.position.y = 2.3;
    group.add(beacon);
    var label = makeLabelSprite('DESPACHO DEL HOKAGE', 'Entrar en el despacho', '#ffc247');
    label.position.y = 2.55;
    group.add(label);

    group.userData.ring = ring;
    group.userData.inner = inner;
    group.userData.beacon = beacon;
    S.scene.add(group);
    S.checkpoint = {
      x: spot.x, z: spot.z, groundY: spot.y,
      group: group, ring: ring, inner: inner, beacon: beacon, label: label,
      phase: 0
    };
  }

  function updateRoomPortals(dt) {
    /* Las aguas de la aldea son dos planos enormes; dentro del despacho
       taparían el suelo del modelo. */
    var showWater = !(S.room && S.room.active);
    if (S.water) S.water.visible = showWater;
    if (S.waterDeep) S.waterDeep.visible = showWater;
    if (S.checkpoint) {
      var c = S.checkpoint;
      c.ring.rotation.z += dt * 0.9;
      c.inner.rotation.z -= dt * 1.35;
      c.beacon.material.opacity = 0.055 + 0.055 * (0.5 + 0.5 * Math.sin(S.elapsed * 2.1));
      var pulse = 1 + Math.sin(S.elapsed * 2.1) * 0.05;
      c.ring.scale.set(pulse, pulse, 1);
      var dc = S.player ? Math.hypot(S.player.x - c.x, S.player.z - c.z) : 999;
      c.label.visible = dc > 9 && dc < 80;
    }
    if (S.roomExit) {
      var e = S.roomExit;
      e.ring.rotation.z -= dt * 0.9;
      e.beacon.material.opacity = 0.06 + 0.05 * (0.5 + 0.5 * Math.sin(S.elapsed * 1.8 + 1));
      e.group.visible = !!(S.room && S.room.active);
      if (S.player) {
        var de = Math.hypot(S.player.x - e.x, S.player.z - e.z);
        e.label.visible = de > 3.2;
      }
    }
  }

  function buildScrolls() {
    var anchors = [
      [-70, 15], [-45, -25], [-30, -32], [60, -55],
      [70, 22], [65, 45], [10, 60], [-55, 60]
    ];
    var labels = [
      'Pergamino olvidado', 'Registro del Hokage', 'Mapa antiguo', 'Pergamino de entrenamiento',
      'Carta del País del Fuego', 'Notas del Clan Nara', 'Códice de la Hoja', 'Diario de Ichiraku'
    ];
    var collected = {};
    (S.opts.collected || []).forEach(function (id) { collected[id] = true; });
    var used = [];
    for (var i = 0; i < anchors.length; i++) {
      var id = 's3d-' + String(i + 1).padStart(2, '0');
      var spot = findReachableSpot(anchors[i][0], anchors[i][1], 60, 16, used);
      if (!spot) continue;
      used.push({ x: spot.x, z: spot.z });
      var group = makeScrollMesh();
      group.position.set(spot.x, spot.y + 0.75, spot.z);
      S.scene.add(group);
      var scroll = {
        id: id, label: labels[i] || 'Pergamino de Konoha',
        x: spot.x, z: spot.z, groundY: spot.y,
        group: group, collected: !!collected[id], phase: Math.random() * 6.28
      };
      group.visible = !scroll.collected;
      S.scrolls.push(scroll);
    }
    notify('onScrolls', { found: countScrolls(), total: S.scrolls.length });
  }

  function makeScrollMesh() {
    var group = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.52, 8),
      new THREE.MeshBasicMaterial({ color: 0xf0e4c8, fog: true })
    );
    body.rotation.z = Math.PI / 2;
    group.add(body);
    var band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.125, 0.125, 0.1, 8),
      new THREE.MeshBasicMaterial({ color: 0xd64535, fog: true })
    );
    band.rotation.z = Math.PI / 2;
    group.add(band);
    var ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.52, 0.03, 6, 20),
      new THREE.MeshBasicMaterial({ color: 0xffc247, transparent: true, opacity: 0.85, fog: false, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);
    group.userData.ring = ring;
    group.userData.body = body;

    var beaconMat = new THREE.MeshBasicMaterial({ color: 0xffc247, transparent: true, opacity: 0.11, depthWrite: false, side: THREE.DoubleSide, fog: false });
    var beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.34, 5.5, 7, 1, true), beaconMat);
    beacon.position.y = 2.2;
    group.add(beacon);
    group.userData.beacon = beacon;
    return group;
  }

  function countScrolls() {
    var n = 0;
    S.scrolls.forEach(function (s) { if (s.collected) n++; });
    return n;
  }

  /* ============================================================
     Miniatura / minimapa
     ============================================================ */
  function buildMiniAtlas() {
    var hm = S.hm;
    if (!hm) return;
    var scale = 2;
    var cv = document.createElement('canvas');
    cv.width = Math.ceil(hm.W * scale);
    cv.height = Math.ceil(hm.H * scale);
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#123a4f';
    ctx.fillRect(0, 0, cv.width, cv.height);
    for (var z = 0; z < hm.H; z++) {
      for (var x = 0; x < hm.W; x++) {
        var k = z * hm.W + x;
        var y = hm.y[k];
        var col;
        if (y < 0) col = '#123a4f';
        else if (y < WALK_MIN) col = '#c8b184';
        else if (!hm.reach[k]) col = y > WALK_MAX ? '#6c5138' : '#4c4a4e';
        else {
          var t = clamp((y - WALK_MIN) / (WALK_MAX - WALK_MIN), 0, 1);
          col = 'rgb(' + Math.round(58 + t * 44) + ',' + Math.round(126 + t * 70) + ',' + Math.round(72 + t * 40) + ')';
        }
        ctx.fillStyle = col;
        ctx.fillRect(x * scale, z * scale, scale, scale);
      }
    }
    S.miniAtlas = cv;
  }

  function drawMinimap() {
    var canvas = S.dom.minimap;
    if (!canvas || !S.miniAtlas || !S.player) return;
    var rect = canvas.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var cw = Math.round(rect.width), ch = Math.round(rect.height);
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
    }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    if (S.room && S.room.active) {
      var l = -12.3, r = 2.7, t = -8.9, b = 8.9;
      var pad = 9;
      var sc = Math.min((cw - pad * 2) / (r - l), (ch - pad * 2) / (b - t));
      var ox = pad + ((cw - pad * 2) - (r - l) * sc) / 2;
      var oy = pad + ((ch - pad * 2) - (b - t) * sc) / 2;
      function toRoom(lx, lz) { return [ox + (lx - l) * sc, oy + (lz - t) * sc]; }
      ctx.fillStyle = '#101a26';
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = '#1c2c3a';
      ctx.fillRect(ox, oy, (r - l) * sc, (b - t) * sc);
      ctx.strokeStyle = 'rgba(255,194,71,0.75)';
      ctx.lineWidth = 2;
      ctx.strokeRect(ox, oy, (r - l) * sc, (b - t) * sc);
      var desk = toRoom(ROOM_DESK.minX - ROOM_X, ROOM_DESK.minZ - ROOM_Z);
      ctx.fillStyle = 'rgba(255,194,71,0.28)';
      ctx.fillRect(desk[0], desk[1], (ROOM_DESK.maxX - ROOM_DESK.minX) * sc, (ROOM_DESK.maxZ - ROOM_DESK.minZ) * sc);
      var hk = toRoom(HOKAGE_ROOM_POS.x - ROOM_X, HOKAGE_ROOM_POS.z - ROOM_Z);
      ctx.fillStyle = '#ffe066';
      ctx.beginPath(); ctx.arc(hk[0], hk[1], 4, 0, Math.PI * 2); ctx.fill();
      var ex = toRoom(ROOM_EXIT.x - ROOM_X, ROOM_EXIT.z - ROOM_Z);
      ctx.strokeStyle = '#78dcff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ex[0], ex[1], 4, 0, Math.PI * 2); ctx.stroke();
      var pl = toRoom(S.player.x - ROOM_X, S.player.z - ROOM_Z);
      ctx.save();
      ctx.translate(pl[0], pl[1]);
      ctx.rotate(Math.atan2(Math.sin(S.player.yaw), -Math.cos(S.player.yaw)));
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -6); ctx.lineTo(4.4, 5); ctx.lineTo(0, 2.4); ctx.lineTo(-4.4, 5);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,194,71,0.95)';
      ctx.font = '700 10px Rajdhani, Segoe UI, sans-serif';
      ctx.fillText('DESPACHO', 8, ch - 7);
      return;
    }
    var scale = 2.6;
    var viewW = cw / scale, viewH = ch / scale;
    var hm = S.hm;
    var px = (S.player.x - hm.minX) / hm.cell * 2;
    var pz = (S.player.z - hm.minZ) / hm.cell * 2;
    var sx = clamp(px - viewW, 0, Math.max(0, S.miniAtlas.width - viewW * 2));
    var sy = clamp(pz - viewH, 0, Math.max(0, S.miniAtlas.height - viewH * 2));
    ctx.drawImage(S.miniAtlas, sx, sy, viewW * 2, viewH * 2, 0, 0, cw, ch);

    function toMini(x, z) {
      return [
        (px - sx) / 2 * scale + (x - S.player.x) * scale,
        (pz - sy) / 2 * scale + (z - S.player.z) * scale
      ];
    }

    S.scrolls.forEach(function (s) {
      if (s.collected) return;
      var p = toMini(s.x, s.z);
      if (p[0] < -8 || p[0] > cw + 8 || p[1] < -8 || p[1] > ch + 8) return;
      ctx.fillStyle = '#ffc247';
      ctx.beginPath();
      ctx.arc(p[0], p[1], 3, 0, Math.PI * 2);
      ctx.fill();
    });

    if (S.checkpoint) {
      var cpMark = toMini(S.checkpoint.x, S.checkpoint.z);
      if (cpMark[0] > -10 && cpMark[0] < cw + 10 && cpMark[1] > -10 && cpMark[1] < ch + 10) {
        ctx.strokeStyle = '#ffc247';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cpMark[0], cpMark[1], 4.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,194,71,0.55)';
        ctx.beginPath();
        ctx.arc(cpMark[0], cpMark[1], 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    S.npcs.forEach(function (n) {
      var p = toMini(n.x, n.z);
      if (p[0] < -8 || p[0] > cw + 8 || p[1] < -8 || p[1] > ch + 8) return;
      var isQuest = S.quest && S.quest.targetNpc === n.id;
      ctx.fillStyle = isQuest ? '#ffe066' : 'rgba(120,220,255,0.85)';
      ctx.beginPath();
      ctx.arc(p[0], p[1], isQuest ? 3.6 : 2.4, 0, Math.PI * 2);
      ctx.fill();
    });

    var cp = toMini(S.player.x, S.player.z);
    ctx.save();
    ctx.translate(cp[0], cp[1]);
    ctx.rotate(Math.atan2(Math.sin(S.player.yaw), -Math.cos(S.player.yaw)));
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4.4, 5);
    ctx.lineTo(0, 2.4);
    ctx.lineTo(-4.4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    var cm = S.camLabel || 'N';
    ctx.fillStyle = 'rgba(255,194,71,0.95)';
    ctx.font = '700 11px Rajdhani, Segoe UI, sans-serif';
    ctx.fillText(cm, cw - 18, 14);
  }

  function updateCompass() {
    var dirX = -Math.sin(S.cam.yaw), dirZ = -Math.cos(S.cam.yaw);
    var ang = (Math.atan2(dirX, -dirZ) * 180 / Math.PI + 360) % 360;
    var labels = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    var idx = Math.round(ang / 45) % 8;
    S.camLabel = labels[idx];
    if (labels[idx] !== S.lastCompass) {
      S.lastCompass = labels[idx];
      notify('onCompass', { label: labels[idx] });
    }
  }

  /* ============================================================
     Áreas de la aldea
     ============================================================ */
  function updateArea() {
    if (!S.player) return;
    if (S.room && S.room.active) {
      if (S.areaLast !== 'DESPACHO DEL HOKAGE') {
        S.areaLast = 'DESPACHO DEL HOKAGE';
        notify('onArea', { name: S.areaLast });
      }
      return;
    }
    var areas = S.opts.areas || [];
    if (!areas.length) return;
    var best = null;
    for (var i = 0; i < areas.length; i++) {
      var a = areas[i];
      var d = Math.sqrt(dist2(S.player.x, S.player.z, a.x, a.z));
      if (d > (a.r || 20)) continue;
      if (!best || d < best.d) best = { name: a.name, d: d };
    }
    var name = best ? best.name : 'ALDEA OCULTA DE LA HOJA';
    if (name !== S.areaLast) {
      S.areaLast = name;
      notify('onArea', { name: name });
    }
  }

  /* ============================================================
     Movimiento y animación
     ============================================================ */
  function readMoveInput() {
    var mx = 0, my = 0;
    if (S.keys['KeyW'] || S.keys['ArrowUp']) my += 1;
    if (S.keys['KeyS'] || S.keys['ArrowDown']) my -= 1;
    if (S.keys['KeyA'] || S.keys['ArrowLeft']) mx -= 1;
    if (S.keys['KeyD'] || S.keys['ArrowRight']) mx += 1;
    if (S.touch.active) { mx += S.touch.mx; my += S.touch.my; }
    var len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }
    return { x: mx, y: my };
  }

  function wallBlocked(x, z, g) {
    var r = 0.32;
    var pts = [[x, z], [x + r, z], [x - r, z], [x, z + r], [x, z - r]];
    for (var i = 0; i < pts.length; i++) {
      var s = solidHeight(pts[i][0], pts[i][1]);
      if (s !== null && s > g + 1.1) return true;
    }
    return false;
  }

  function tryMovePlayer(dx, dz) {
    var p = S.player;
    var nx = p.x + dx, nz = p.z + dz;
    if (S.room && S.room.active) {
      nx = clamp(nx, ROOM_MIN_X, ROOM_MAX_X);
      nz = clamp(nz, ROOM_MIN_Z, ROOM_MAX_Z);
      if (nx > ROOM_DESK.minX && nx < ROOM_DESK.maxX && nz > ROOM_DESK.minZ && nz < ROOM_DESK.maxZ) return false;
      p.x = nx; p.z = nz; p.groundY = ROOM_FLOOR;
      return true;
    }
    var g = groundHeight(nx, nz);
    if (g === null) return false;
    if (Math.abs(g - p.groundY) > 1.05) return false;
    if (wallBlocked(nx, nz, g)) return false;
    p.x = nx; p.z = nz; p.groundY = g;
    return true;
  }

  function updatePlayerPhysics(dt) {
    var p = S.player;
    var input = readMoveInput();
    var running = !!(S.keys['ShiftLeft'] || S.keys['ShiftRight'] || S.touch.run);
    var speed = running ? 7.6 : 4.3;
    var fx = -Math.sin(S.cam.yaw), fz = -Math.cos(S.cam.yaw);
    var rx = Math.cos(S.cam.yaw), rz = -Math.sin(S.cam.yaw);
    var wantX = fx * input.y + rx * input.x;
    var wantZ = fz * input.y + rz * input.x;
    var len = Math.hypot(wantX, wantZ);
    if (len > 0.001) {
      wantX = wantX / len * speed;
      wantZ = wantZ / len * speed;
    } else {
      wantX = 0; wantZ = 0;
    }
    var accel = p.onGround ? 16 : 6;
    p.velX = damp(p.velX, wantX, accel, dt);
    p.velZ = damp(p.velZ, wantZ, accel, dt);

    var mx = p.velX * dt, mz = p.velZ * dt;
    if (!tryMovePlayer(mx, 0)) p.velX *= 0.2;
    if (!tryMovePlayer(0, mz)) p.velZ *= 0.2;

    // separación suave con NPCs
    for (var i = 0; i < S.npcs.length; i++) {
      var n = S.npcs[i];
      var d2 = dist2(p.x, p.z, n.x, n.z);
      if (d2 < 0.81 && d2 > 0.0001) {
        var d = Math.sqrt(d2);
        var push = (0.9 - d) / d;
        var nx = p.x + (p.x - n.x) * push;
        var nz = p.z + (p.z - n.z) * push;
        if (groundHeight(nx, nz) !== null) { p.x = nx; p.z = nz; }
      }
    }

    // salto y suelo
    if (S.keys['Space'] && p.onGround) {
      p.vy = 5.3;
      p.onGround = false;
    }
    if (!p.onGround) {
      p.vy -= 14.5 * dt;
      p.jumpY += p.vy * dt;
      if (p.jumpY <= 0) { p.jumpY = 0; p.vy = 0; p.onGround = true; }
    }
    p.y = damp(p.y, p.groundY, 16, dt) + p.jumpY;
    p.root.position.set(p.x, p.y, p.z);

    var speedNow = Math.hypot(p.velX, p.velZ);
    p.speed = damp(p.speed, speedNow, 10, dt);
    if (speedNow > 0.35) {
      p.targetYaw = Math.atan2(p.velX, p.velZ);
    }
    var diff = shortestAngle(p.yaw, p.targetYaw);
    p.yaw += diff * Math.min(1, dt * 12);
    p.root.rotation.y = p.yaw;

    p.shadow.position.y = 0.05 - p.jumpY;
    p.shadow.material.opacity = clamp(0.75 - p.jumpY * 0.22, 0.18, 0.75);

    animatePlayer(dt, speedNow);
  }

  function applyBone(slot, angle) {
    var b = S.player && S.player.bones[slot];
    if (!b) return;
    b.bone.quaternion.copy(b.rest);
    if (Math.abs(angle) < 0.0001) return;
    S.tmp.q1.setFromAxisAngle(b.axis, angle);
    b.bone.quaternion.premultiply(S.tmp.q1);
  }

  function animatePlayer(dt, speedNow) {
    var p = S.player;
    if (!p || !p.bones) return;
    var moving = speedNow > 0.4;
    var ratio = clamp(speedNow / 7.6, 0, 1.2);

    /* La carrera usa el clip Mixamo suministrado (patas) + brazos detrás
       al estilo Naruto. El salto y el reposo conservan la animación
       procedural original. */
    if (moving && p.onGround && p.runKit) {
      applyRunPose(p, dt, speedNow);
      return;
    }
    if (p.runActive) resetRunPose(p);

    if (moving) {
      p.phase += dt * (5.6 + ratio * 5.2) * (speedNow > 0.4 ? 1 : 0);
    } else {
      p.phase = damp(p.phase, Math.round(p.phase / Math.PI) * Math.PI, 6, dt);
    }
    var swing = moving ? (0.5 + ratio * 0.4) : 0;
    var s = Math.sin(p.phase);
    var s2 = Math.sin(p.phase + Math.PI);
    var thighA = s * swing;
    var thighB = s2 * swing;
    var kneeA = Math.max(0, -Math.sin(p.phase + 0.7)) * swing * 1.1;
    var kneeB = Math.max(0, -Math.sin(p.phase + 0.7 + Math.PI)) * swing * 1.1;
    if (!p.onGround) {
      thighA = 0.55; thighB = -0.35; kneeA = 0.9; kneeB = 0.25;
    }
    applyBone('thighL', thighA);
    applyBone('thighR', thighB);
    applyBone('shinL', -kneeA);
    applyBone('shinR', -kneeB);
    if (p.which !== 'sasuke') {
      applyBone('armL', -s * swing * 0.75);
      applyBone('armR', -s2 * swing * 0.75);
    }
    var bob = moving ? Math.sin(p.phase * 2) * 0.035 * ratio : 0;
    var breath = Math.sin(S.elapsed * 1.8) * 0.012;
    if (p.holder && p.holder.position) {
      p.holder.position.y = bob + breath;
    }
    applyBone('head', moving ? Math.sin(p.phase) * 0.04 : Math.sin(S.elapsed * 1.4) * 0.05);
  }

  /* ============================================================
     Cámara
     ============================================================ */
  function updateCamera(dt) {
    var p = S.player;
    var cam = S.cam;
    var tx = p.x, ty = p.y + 1.42, tz = p.z;
    var cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    var ox = Math.sin(cam.yaw) * cp, oy = sp, oz = Math.cos(cam.yaw) * cp;
    var dist = cam.dist;
    var bestT = 1;
    for (var t = 0.16; t <= 1.001; t += 0.1) {
      var sx = tx + ox * dist * t;
      var sy = ty + oy * dist * t;
      var sz = tz + oz * dist * t;
      var g = solidHeight(sx, sz);
      var gy = terrainHeight(sx, sz);
      if ((g !== null && sy < g + 0.5) || (gy !== null && sy < gy + 0.45)) {
        bestT = Math.max(0.16, t - 0.1);
        break;
      }
    }
    cam.curDist = damp(cam.curDist, dist * bestT, 12, dt);
    var cx = tx + ox * cam.curDist;
    var cy = ty + oy * cam.curDist;
    var cz = tz + oz * cam.curDist;
    if (cy < 1.2) cy = 1.2;
    var camGround = terrainHeight(cx, cz);
    if (camGround !== null && cy < camGround + 0.4) cy = camGround + 0.4;
    if (S.room && S.room.active) {
      cx = clamp(cx, ROOM_CAM_MIN_X, ROOM_CAM_MAX_X);
      cz = clamp(cz, ROOM_MIN_Z + 0.35, ROOM_MAX_Z - 0.35);
      cy = clamp(cy, ROOM_FLOOR + 0.75, ROOM_FLOOR + 3.3);
    }

    if (!cam.initialized) {
      cam.pos.set(cx, cy, cz);
      cam.target.set(tx, ty, tz);
      cam.initialized = true;
    } else {
      cam.pos.x = damp(cam.pos.x, cx, 14, dt);
      cam.pos.y = damp(cam.pos.y, cy, 12, dt);
      cam.pos.z = damp(cam.pos.z, cz, 14, dt);
      cam.target.x = damp(cam.target.x, tx, 16, dt);
      cam.target.y = damp(cam.target.y, ty, 14, dt);
      cam.target.z = damp(cam.target.z, tz, 16, dt);
    }
    S.camera.position.copy(cam.pos);
    S.camera.lookAt(cam.target.x, cam.target.y + 0.08, cam.target.z);
  }

  /* ============================================================
     Entrada y salida del despacho del Hokage
     ============================================================ */
  function enterHokageRoom() {
    var p = S.player, room = S.room;
    if (!p || !room || S.paused || room.active) return;
    room.active = true;
    room.returnPos = {
      x: p.x, z: p.z, y: p.groundY,
      playerYaw: p.yaw,
      camYaw: S.cam.yaw,
      pitch: S.cam.pitch
    };
    room.prevCamDist = S.cam.dist;

    p.x = ROOM_SPAWN.x; p.z = ROOM_SPAWN.z;
    p.groundY = ROOM_FLOOR; p.y = ROOM_FLOOR;
    p.jumpY = 0; p.vy = 0; p.onGround = true;
    p.velX = 0; p.velZ = 0; p.speed = 0;
    p.yaw = p.targetYaw = ROOM_SPAWN.yaw;
    p.root.rotation.y = p.yaw;
    p.root.position.set(p.x, p.y, p.z);

    S.cam.dist = 3.7;
    S.cam.curDist = 3.7;
    S.cam.yaw = Math.PI / 2;
    S.cam.pitch = 0.24;
    S.cam.initialized = false;
    if (S.roomExit) S.roomExit.group.visible = true;

    S.promptText = ''; S.promptBest = null;
    notify('onPrompt', null);
    S.areaLast = 'DESPACHO DEL HOKAGE';
    notify('onArea', { name: S.areaLast });
  }

  function exitHokageRoom() {
    var p = S.player, room = S.room;
    if (!p || !room || !room.active) return;
    var back = room.returnPos || { x: CHECKPOINT_X, z: CHECKPOINT_Z + 1.2, y: 9.57, playerYaw: Math.PI, camYaw: 0, pitch: 0.2 };
    room.active = false;
    p.x = back.x; p.z = back.z;
    p.groundY = back.y; p.y = back.y;
    p.jumpY = 0; p.vy = 0; p.onGround = true;
    p.velX = 0; p.velZ = 0; p.speed = 0;
    p.yaw = p.targetYaw = back.playerYaw;
    p.root.rotation.y = p.yaw;
    p.root.position.set(p.x, p.y, p.z);

    S.cam.yaw = back.camYaw;
    S.cam.pitch = typeof back.pitch === 'number' ? back.pitch : 0.2;
    S.cam.dist = room.prevCamDist || 5.6;
    S.cam.curDist = S.cam.dist;
    S.cam.initialized = false;
    if (S.roomExit) S.roomExit.group.visible = false;

    S.promptText = ''; S.promptBest = null;
    notify('onPrompt', null);
    S.areaLast = 'TORRE DEL HOKAGE';
    notify('onArea', { name: S.areaLast });
  }

  /* ============================================================
     Interacción
     ============================================================ */
  function updateInteraction() {
    var p = S.player;
    if (!p) return;
    var best = null;
    var bestScore = 1e9;
    S.npcs.forEach(function (n) {
      if (n.roomNpc && !(S.room && S.room.active)) return;
      var d2 = dist2(p.x, p.z, n.x, n.z);
      var range = n.full ? 4.0 : 3.0;
      if (d2 > range * range) return;
      var score = d2 / (range * range);
      if (score < bestScore) { bestScore = score; best = { type: 'npc', npc: n }; }
    });
    S.scrolls.forEach(function (s) {
      if (s.collected) return;
      var d2 = dist2(p.x, p.z, s.x, s.z);
      var range = 2.3;
      if (d2 > range * range) return;
      var score = d2 / (range * range) - 0.35;
      if (score < bestScore) { bestScore = score; best = { type: 'scroll', scroll: s }; }
    });
    if (S.checkpoint && (!S.room || !S.room.active)) {
      var d2c = dist2(p.x, p.z, S.checkpoint.x, S.checkpoint.z);
      var rangeC = 3.2;
      if (d2c <= rangeC * rangeC) {
        var scoreC = d2c / (rangeC * rangeC) - 0.45;
        if (scoreC < bestScore) { bestScore = scoreC; best = { type: 'checkpoint' }; }
      }
    }
    if (S.room && S.room.active && S.roomExit) {
      var d2e = dist2(p.x, p.z, S.roomExit.x, S.roomExit.z);
      var rangeE = 2.7;
      if (d2e <= rangeE * rangeE) {
        var scoreE = d2e / (rangeE * rangeE) - 0.5;
        if (scoreE < bestScore) { bestScore = scoreE; best = { type: 'roomExit' }; }
      }
    }
    S.promptBest = best;
    var text = '';
    if (best && best.type === 'npc') text = 'Hablar con ' + best.npc.name;
    else if (best && best.type === 'scroll') text = 'Recoger ' + best.scroll.label;
    else if (best && best.type === 'checkpoint') text = 'Entrar al despacho del Hokage';
    else if (best && best.type === 'roomExit') text = 'Salir al exterior';
    if (text !== S.promptText) {
      S.promptText = text;
      notify('onPrompt', text ? { text: text } : null);
    }
  }

  function interact() {
    if (!S.active || S.paused) return;
    var best = S.promptBest;
    if (!best) return;
    if (best.type === 'scroll') {
      collectScroll(best.scroll);
    } else if (best.type === 'npc') {
      var npc = best.npc;
      S.promptText = '';
      notify('onPrompt', null);
      notify('onInteract', { id: npc.id, name: npc.name, role: npc.role });
    } else if (best.type === 'checkpoint') {
      enterHokageRoom();
    } else if (best.type === 'roomExit') {
      exitHokageRoom();
    }
  }

  function collectScroll(scroll) {
    if (!scroll || scroll.collected) return;
    scroll.collected = true;
    scroll.group.visible = false;
    spawnCollectFx(scroll.x, scroll.groundY + 0.9, scroll.z);
    notify('onCollect', { id: scroll.id, label: scroll.label, type: 'scroll' });
    notify('onScrolls', { found: countScrolls(), total: S.scrolls.length });
    S.promptText = '';
    notify('onPrompt', null);
  }

  function spawnCollectFx(x, y, z) {
    var mat = new THREE.SpriteMaterial({ map: S.modelCache['shadow'], color: 0xffc247, transparent: true, depthWrite: false, fog: false, opacity: 0.9 });
    for (var i = 0; i < 8; i++) {
      var sp = new THREE.Sprite(mat.clone());
      sp.position.set(x, y, z);
      sp.scale.set(0.32, 0.32, 1);
      S.scene.add(sp);
      var a = (i / 8) * Math.PI * 2;
      S.collectFx.push({ sprite: sp, t: 0, vx: Math.sin(a) * 1.6, vy: 2.2 + (i % 3) * 0.5, vz: Math.cos(a) * 1.6 });
    }
  }

  function updateCollectFx(dt) {
    for (var i = S.collectFx.length - 1; i >= 0; i--) {
      var fx = S.collectFx[i];
      fx.t += dt;
      fx.vy -= 5.5 * dt;
      fx.sprite.position.x += fx.vx * dt;
      fx.sprite.position.y += fx.vy * dt;
      fx.sprite.position.z += fx.vz * dt;
      fx.sprite.material.opacity = clamp(0.9 - fx.t * 1.4, 0, 0.9);
      if (fx.t > 0.7) {
        S.scene.remove(fx.sprite);
        fx.sprite.material.dispose();
        S.collectFx.splice(i, 1);
      }
    }
  }

  /* ============================================================
     Actualización de actores y HUD
     ============================================================ */
  function updateNpcs(dt) {
    var p = S.player;
    var roomActive = !!(S.room && S.room.active);
    for (var i = 0; i < S.npcs.length; i++) {
      var n = S.npcs[i];
      if (n.roomNpc) {
        n.group.visible = roomActive;
        if (!roomActive) {
          if (n.markerSprite) n.markerSprite.visible = false;
          continue;
        }
      }
      if (!n.seated) n.group.position.y = n.groundY + Math.sin(S.elapsed * 1.5 + n.phase) * 0.02;
      var d2 = dist2(p.x, p.z, n.x, n.z);
      if (n.fixedYaw) {
        n.group.rotation.y = n.baseYaw;
      } else {
        var yaw = n.baseYaw;
        if (d2 < 64) yaw = Math.atan2(p.x - n.x, p.z - n.z);
        n.yaw += shortestAngle(n.yaw, yaw) * Math.min(1, dt * 4);
        n.group.rotation.y = n.yaw;
      }
      var isQuest = !!(S.quest && S.quest.targetNpc === n.id);
      if (n.markerSprite) {
        n.markerSprite.visible = isQuest || (d2 < 400 && n.marker !== 'talk');
        if (n.markerSprite.visible) {
          n.markerSprite.position.y = (n.full ? 2.9 : (n.seated ? 2.25 : 2.5)) + Math.sin(S.elapsed * 2.4 + n.phase) * 0.07;
        }
      }
    }
  }

  function updateLabels() {
    var p = S.player;
    for (var i = 0; i < S.npcs.length; i++) {
      var n = S.npcs[i];
      if (n.roomNpc && !(S.room && S.room.active)) {
        n.label.visible = false;
        continue;
      }
      var d2 = dist2(p.x, p.z, n.x, n.z);
      var visible = d2 < 430;
      n.label.visible = visible;
      if (!visible) continue;
      /* tamaño estable en pantalla: lejos se agranda, cerca se reduce */
      var k = clamp(Math.sqrt(d2) * 0.095, 0.42, 1.75);
      n.label.scale.set(2.7 * k, 0.64 * k, 1);
      if (n.markerSprite && n.markerSprite.visible) {
        n.markerSprite.scale.set(0.72 * k, 0.72 * k, 1);
      }
    }
  }

  function updateScrolls(dt) {
    for (var i = 0; i < S.scrolls.length; i++) {
      var s = S.scrolls[i];
      if (s.collected) continue;
      s.group.rotation.y += dt * 0.8;
      s.group.position.y = s.groundY + 0.8 + Math.sin(S.elapsed * 1.7 + s.phase) * 0.09;
      var ring = s.group.userData.ring;
      if (ring) ring.rotation.z += dt * 1.4;
      var beacon = s.group.userData.beacon;
      if (beacon) beacon.material.opacity = 0.08 + 0.06 * (0.5 + 0.5 * Math.sin(S.elapsed * 2.2 + s.phase));
    }
  }

  function updateTime(dt) {
    S.timeAcc += dt;
    while (S.timeAcc >= DAY_SECONDS_PER_MINUTE) {
      S.timeAcc -= DAY_SECONDS_PER_MINUTE;
      S.clockTime += 1;
      if (S.clockTime >= 1440) {
        S.clockTime -= 1440;
        S.day += 1;
      }
    }
  }

  function updateHud(dt) {
    S.hudTimer -= dt;
    if (S.hudTimer <= 0) {
      S.hudTimer = 0.5;
      notify('onTime', { minutes: S.clockTime, day: S.day });
      updateSky(false);
    }
    S.miniTimer -= dt;
    if (S.miniTimer <= 0) {
      S.miniTimer = 0.13;
      drawMinimap();
    }
    S.areaTimer -= dt;
    if (S.areaTimer <= 0) {
      S.areaTimer = 0.4;
      updateArea();
    }
    S.labelTimer -= dt;
    if (S.labelTimer <= 0) {
      S.labelTimer = 0.35;
      updateLabels();
    }
    S.markerTimer -= dt;
    if (S.markerTimer <= 0) {
      S.markerTimer = 0;
      updateCompass();
    }
  }

  function updateQuality(dt) {
    S.quality.acc += dt;
    S.quality.frames++;
    if (S.quality.acc < 1.2) return;
    var fps = S.quality.frames / S.quality.acc;
    S.quality.acc = 0;
    S.quality.frames = 0;
    var now = nowMs();
    if (now - S.quality.lastChange < 4000) return;
    if (fps < 34 && S.quality.dpr > 0.72) {
      S.quality.dpr = Math.max(0.72, S.quality.dpr - 0.16);
      applyDpr();
      S.quality.lastChange = now;
    } else if (fps > 55 && S.quality.dpr < S.quality.maxDpr) {
      S.quality.dpr = Math.min(S.quality.maxDpr, S.quality.dpr + 0.08);
      applyDpr();
      S.quality.lastChange = now;
    }
  }

  function applyDpr() {
    if (!S.renderer) return;
    S.renderer.setPixelRatio(S.quality.dpr);
    resize();
  }

  /* ============================================================
     Bucle principal
     ============================================================ */
  function loop(now) {
    if (!S.active) return;
    S.raf = requestAnimationFrame(loop);
    var dt = Math.min(0.05, (now - S.last) / 1000);
    S.last = now;
    S.elapsed += dt;
    if (S.paused || S.hidden) return;
    try {
      updatePlayerPhysics(dt);
      updateCamera(dt);
      updateNpcs(dt);
      updateScrolls(dt);
      updateRoomPortals(dt);
      updateCollectFx(dt);
      updateInteraction();
      updateTime(dt);
      updateHud(dt);
      updateQuality(dt);
      S.frameCount++;
    } catch (e) {
      console.error('[Konoha3D] update', e);
    }
    S.renderer.render(S.scene, S.camera);
  }

  function startLoop() {
    if (S.raf) return;
    S.last = nowMs();
    S.raf = requestAnimationFrame(loop);
  }

  /* ============================================================
     Entrada
     ============================================================ */
  function makeHandlers() {
    var h = {};
    h.keydown = function (e) {
      var tag = (e.target && e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable)) return;
      if (!S.active || S.paused) return;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') e.preventDefault();
      S.keys[e.code] = true;
      if (e.code === 'KeyE') interact();
      if (e.code === 'Space') S.keys['Space'] = true;
    };
    h.keyup = function (e) {
      S.keys[e.code] = false;
    };
    h.blur = function () {
      S.keys = {};
      S.touch.active = false;
      S.touch.mx = 0; S.touch.my = 0;
    };
    h.mousedown = function (e) {
      if (!S.active || S.paused) return;
      if (S.isTouch) return;
      if (document.pointerLockElement === S.canvas) return;
      if (e.button === 0) {
        S.dragging = true;
        S.lastMouse.x = e.clientX;
        S.lastMouse.y = e.clientY;
        S.downX = e.clientX;
        S.downY = e.clientY;
        S.dragDist = 0;
      }
    };
    h.mouseup = function () { S.dragging = false; };
    h.mousemove = function (e) {
      if (!S.active || S.paused) return;
      if (document.pointerLockElement === S.canvas) {
        S.cam.yaw -= e.movementX * 0.0026;
        S.cam.pitch = clamp(S.cam.pitch - e.movementY * 0.0019, -0.18, 0.95);
      } else if (S.dragging) {
        var dx = e.clientX - S.lastMouse.x;
        var dy = e.clientY - S.lastMouse.y;
        S.lastMouse.x = e.clientX;
        S.lastMouse.y = e.clientY;
        S.dragDist = (S.dragDist || 0) + Math.abs(dx) + Math.abs(dy);
        S.cam.yaw -= dx * 0.005;
        S.cam.pitch = clamp(S.cam.pitch - dy * 0.0035, -0.18, 0.95);
      }
    };
    h.wheel = function (e) {
      if (!S.active || S.paused) return;
      e.preventDefault();
      S.cam.dist = clamp(S.cam.dist + (e.deltaY > 0 ? 0.6 : -0.6), 3.0, 9.5);
    };
    h.click = function () {
      if (!S.active || S.paused || S.isTouch) return;
      if ((S.dragDist || 0) > 6) return;
      if (document.pointerLockElement !== S.canvas && S.canvas.requestPointerLock) {
        try { S.canvas.requestPointerLock(); } catch (e) {}
      }
    };
    h.contextmenu = function (e) { e.preventDefault(); };
    h.resize = function () { resize(); };
    h.visibility = function () { S.hidden = !!document.hidden; if (!S.hidden) S.last = nowMs(); };
    h.pointerlock = function () {
      if (document.pointerLockElement !== S.canvas) S.dragging = false;
    };
    return h;
  }

  function bindEvents() {
    if (S.handlers) return;
    var h = makeHandlers();
    S.handlers = h;
    window.addEventListener('keydown', h.keydown);
    window.addEventListener('keyup', h.keyup);
    window.addEventListener('blur', h.blur);
    window.addEventListener('resize', h.resize);
    document.addEventListener('visibilitychange', h.visibility);
    document.addEventListener('pointerlockchange', h.pointerlock);
    document.addEventListener('mousemove', h.mousemove);
    document.addEventListener('mouseup', h.mouseup);
    if (S.canvas) {
      S.canvas.addEventListener('mousedown', h.mousedown);
      S.canvas.addEventListener('wheel', h.wheel, { passive: false });
      S.canvas.addEventListener('click', h.click);
      S.canvas.addEventListener('contextmenu', h.contextmenu);
    }
    bindTouch();
  }

  function unbindEvents() {
    var h = S.handlers;
    if (!h) return;
    window.removeEventListener('keydown', h.keydown);
    window.removeEventListener('keyup', h.keyup);
    window.removeEventListener('blur', h.blur);
    window.removeEventListener('resize', h.resize);
    document.removeEventListener('visibilitychange', h.visibility);
    document.removeEventListener('pointerlockchange', h.pointerlock);
    document.removeEventListener('mousemove', h.mousemove);
    document.removeEventListener('mouseup', h.mouseup);
    if (S.canvas) {
      S.canvas.removeEventListener('mousedown', h.mousedown);
      S.canvas.removeEventListener('wheel', h.wheel, { passive: false });
      S.canvas.removeEventListener('click', h.click);
      S.canvas.removeEventListener('contextmenu', h.contextmenu);
    }
    S.handlers = null;
  }

  function bindTouch() {
    if (S.touchBound) {
      updateTouchVisibility();
      return;
    }
    S.touchBound = true;
    var joy = S.dom.joystick, knob = S.dom.joystickKnob, jump = S.dom.jump, act = S.dom.interact, look = S.dom.lookPad;
    if (joy) {
      var radius = 52;
      var start = function (e) {
        S.touch.joyId = e.pointerId;
        joy.setPointerCapture && joy.setPointerCapture(e.pointerId);
        move(e);
      };
      var move = function (e) {
        if (S.touch.joyId !== e.pointerId) return;
        var rect = joy.getBoundingClientRect();
        var cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        var dx = e.clientX - cx, dy = e.clientY - cy;
        var len = Math.hypot(dx, dy);
        if (len > radius) { dx = dx / len * radius; dy = dy / len * radius; len = radius; }
        S.touch.mx = dx / radius;
        S.touch.my = -dy / radius;
        S.touch.active = true;
        if (knob) knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      };
      var end = function (e) {
        if (S.touch.joyId !== e.pointerId) return;
        S.touch.joyId = -1;
        S.touch.mx = 0; S.touch.my = 0; S.touch.active = false;
        if (knob) knob.style.transform = '';
      };
      joy.addEventListener('pointerdown', start);
      joy.addEventListener('pointermove', move);
      joy.addEventListener('pointerup', end);
      joy.addEventListener('pointercancel', end);
    }
    if (jump) {
      jump.addEventListener('pointerdown', function (e) { e.preventDefault(); S.keys['Space'] = true; });
      jump.addEventListener('pointerup', function () { S.keys['Space'] = false; });
      jump.addEventListener('pointercancel', function () { S.keys['Space'] = false; });
    }
    if (act) {
      act.addEventListener('pointerdown', function (e) { e.preventDefault(); interact(); });
    }
    if (look) {
      look.addEventListener('pointerdown', function (e) {
        S.touch.lookId = e.pointerId;
        S.touch.lookX = e.clientX;
        S.touch.lookY = e.clientY;
        look.setPointerCapture && look.setPointerCapture(e.pointerId);
      });
      look.addEventListener('pointermove', function (e) {
        if (S.touch.lookId !== e.pointerId) return;
        var dx = e.clientX - S.touch.lookX;
        var dy = e.clientY - S.touch.lookY;
        S.touch.lookX = e.clientX;
        S.touch.lookY = e.clientY;
        S.cam.yaw -= dx * 0.006;
        S.cam.pitch = clamp(S.cam.pitch - dy * 0.004, -0.18, 0.95);
      });
      var endLook = function (e) {
        if (S.touch.lookId === e.pointerId) S.touch.lookId = -1;
      };
      look.addEventListener('pointerup', endLook);
      look.addEventListener('pointercancel', endLook);
    }
    updateTouchVisibility();
  }

  function updateTouchVisibility() {
    var node = S.dom.touch;
    if (node) node.classList.toggle('hidden', !S.opts || !S.opts.touch);
    if (S.dom.jump) S.dom.jump.classList.toggle('hidden', !S.opts || !S.opts.touch);
  }

  /* ============================================================
     Arranque / parada
     ============================================================ */
  function detectQuality() {
    var ua = navigator.userAgent || '';
    var mobile = /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(ua);
    var cores = navigator.hardwareConcurrency || 4;
    var mem = navigator.deviceMemory || 4;
    var reduced = !!(S.opts && S.opts.reduced) || (S.opts && S.opts.quality === 'low');
    var low = mobile || cores <= 4 || mem <= 4 || reduced || S.isTouch;
    var dpr = window.devicePixelRatio || 1;
    var maxDpr = low ? 1 : Math.min(1.5, dpr);
    if (reduced) maxDpr = Math.min(maxDpr, 1);
    S.quality.low = low;
    S.quality.baseLow = low;
    S.quality.baseMaxDpr = Math.max(0.75, maxDpr);
    S.quality.maxDpr = S.quality.baseMaxDpr;
    S.quality.dpr = S.quality.maxDpr;
  }

  function resize() {
    if (!S.renderer || !S.canvas) return;
    var w = S.canvas.clientWidth || window.innerWidth || 1280;
    var h = S.canvas.clientHeight || window.innerHeight || 720;
    S.camera.aspect = Math.max(0.2, w / Math.max(1, h));
    S.camera.updateProjectionMatrix();
    S.renderer.setPixelRatio(S.quality.dpr);
    S.renderer.setSize(w, h, false);
  }

  function start(canvasEl, options) {
    options = options || {};
    if (!window.THREE || !THREE.WebGLRenderer || !THREE.GLTFLoader || !THREE.SkeletonUtils) {
      S.callbacks = options.callbacks || {};
      S.dom = options.dom || {};
      fail('La librería 3D no está disponible. Comprueba los archivos vendor de Three.js.');
      return false;
    }
    if (S.active && S.canvas === canvasEl && S.ready) {
      S.opts = options;
      S.callbacks = options.callbacks || {};
      S.dom = options.dom || {};
      S.isTouch = !!(options.touch || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));
      updateTouchVisibility();
      resume();
      return true;
    }
    stop(true);

    S.opts = options;
    S.callbacks = options.callbacks || {};
    S.dom = options.dom || {};
    S.canvas = canvasEl || S.canvas;
    if (!S.canvas) return false;
    S.tmp = {
      v1: new THREE.Vector3(), q1: new THREE.Quaternion(),
      v2: new THREE.Vector3(), q2: new THREE.Quaternion()
    };
    S.isTouch = !!(options.touch || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));
    S.clockTime = typeof options.timeMinutes === 'number' ? options.timeMinutes : 8 * 60;
    S.day = typeof options.day === 'number' && options.day > 0 ? options.day : 1;
    S.quest = options.quest || null;
    S.scrolls = []; S.npcs = []; S.collectFx = []; S.frameCount = 0;
    S.promptText = ''; S.promptBest = null;
    S.room = null; S.checkpoint = null; S.roomExit = null;
    detectQuality();
    setOverlay('error', false);
    setOverlay('loading', true);
    setLoading(1, 'PREPARANDO EL MOTOR 3D...');

    try {
      S.renderer = new THREE.WebGLRenderer({
        canvas: S.canvas,
        antialias: false,
        alpha: false,
        stencil: false,
        powerPreference: 'high-performance'
      });
    } catch (e) {
      fail('No se pudo iniciar WebGL en este equipo. Cierra otras pestañas o actualiza el navegador.', e);
      return false;
    }
    S.renderer.outputEncoding = THREE.sRGBEncoding;
    S.renderer.setPixelRatio(S.quality.dpr);
    S.renderer.shadowMap.enabled = false;
    S.renderer.autoClear = true;
    S.renderer.setClearColor(0xa9cfe4);

    S.scene = new THREE.Scene();
    S.scene.fog = new THREE.Fog(0xa9cfe4, 65, 330);
    S.camera = new THREE.PerspectiveCamera(58, 1, 0.08, 1200);
    S.camera.position.set(0, 30, 60);
    S.camera.lookAt(0, 0, 0);
    resize();

    S.active = true;
    S.paused = false;
    S.ready = false;
    S.loading = true;
    S.session = (S.session || 0) + 1;
    var session = S.session;
    bindEvents();

    var progressRef = { loaded: 0, total: 1 };
    Promise.all([
      loadModel(VILLAGE_URL, 0.49, progressRef),
      loadModel(CHARS_URL, 0.36, progressRef),
      loadModel(KAKASHI_URL, 0.04, progressRef),
      loadModel(RUN_URL, 0.05, progressRef),
      loadModel(HOKAGE_ROOM_URL, 0.06, progressRef)
    ]).then(function () {
      if (!S.active || session !== S.session) return;
      buildWorld();
      buildMiniAtlas();
      resize();
      updateTouchVisibility();
      S.ready = true;
      S.loading = false;
      setLoading(100, 'KONOHA LISTA');
      setOverlay('loading', false);
      updateSky(true);
      notify('onReady', { scrolls: { found: countScrolls(), total: S.scrolls.length } });
      startLoop();
    }).catch(function (err) {
      if (session !== S.session) return;
      fail('No se pudieron cargar los modelos 3D. Recarga la página y vuelve a intentarlo. Si el problema continúa, comprueba que tu navegador tenga WebGL activado.', err);
    });
    return true;
  }

  function stop(silent) {
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = null; }
    if (!silent && typeof S.callbacks.onStop === 'function') {
      try { S.callbacks.onStop(); } catch (e) {}
    }
    unbindEvents();
    if (document.pointerLockElement === S.canvas && document.exitPointerLock) {
      try { document.exitPointerLock(); } catch (e) {}
    }
    S.active = false;
    S.paused = false;
    S.ready = false;
    S.loading = false;
    S.hidden = false;
    S.dragging = false;
    S.keys = {};
    S.touch.active = false; S.touch.mx = 0; S.touch.my = 0;
    if (S.scene) {
      S.scene.clear();
      S.scene = null;
    }
    if (S.renderer) {
      try { S.renderer.dispose(); } catch (e) {}
      S.renderer = null;
    }
    S.village = null; S.water = null; S.waterDeep = null; S.sky = null; S.sunMesh = null;
    S.scenery = null; S.clouds = null; S.player = null;
    S.npcs = []; S.scrolls = []; S.collectFx = [];
    S.room = null; S.checkpoint = null; S.roomExit = null;
    S.miniAtlas = null;
    setOverlay('loading', false);
    setOverlay('error', false);
  }

  function pause() {
    if (!S.active) return;
    S.paused = true;
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = null; }
    if (document.pointerLockElement === S.canvas && document.exitPointerLock) {
      try { document.exitPointerLock(); } catch (e) {}
    }
  }

  function resume() {
    if (!S.active) return;
    S.paused = false;
    S.last = nowMs();
    startLoop();
  }

  function setQuest(quest) {
    S.quest = quest || null;
    if (S.quest && S.quest.targetNpc) {
      for (var i = 0; i < S.npcs.length; i++) {
        if (S.npcs[i].id === S.quest.targetNpc) break;
      }
    }
  }

  function getPlayerState() {
    if (!S.player) return null;
    /* Las coordenadas internas del despacho no deben guardarse: al volver
       a entrar en el mundo el jugador aparecería en mitad de la nada. */
    if (S.room && S.room.active && S.room.returnPos) {
      var b = S.room.returnPos;
      return { x: b.x, y: b.y, z: b.z, rot: b.camYaw, area: 'TORRE DEL HOKAGE' };
    }
    return { x: S.player.x, y: S.player.y, z: S.player.z, rot: S.cam.yaw, area: S.areaLast };
  }

  function setPlayerState(pos) {
    if (!pos || !S.player) return;
    var p = S.player;
    var spot;
    if (S.room && S.room.active) {
      spot = {
        x: clamp(pos.x, ROOM_MIN_X, ROOM_MAX_X),
        z: clamp(pos.z, ROOM_MIN_Z, ROOM_MAX_Z),
        y: ROOM_FLOOR
      };
    } else {
      spot = resolveReachable(pos.x, pos.z, 50);
    }
    if (!spot) return;
    p.x = spot.x; p.z = spot.z; p.groundY = spot.y; p.y = spot.y;
    p.jumpY = 0; p.vy = 0; p.onGround = true; p.velX = 0; p.velZ = 0;
    p.phase = 0;
    if (typeof pos.rot === 'number') {
      S.cam.yaw = pos.rot;
      p.yaw = p.targetYaw = pos.rot + Math.PI;
      p.root.rotation.y = p.yaw;
    }
    p.root.position.set(p.x, p.y, p.z);
    S.cam.initialized = false;
  }

  function markCollectible(id) {
    for (var i = 0; i < S.scrolls.length; i++) {
      if (S.scrolls[i].id === id) {
        S.scrolls[i].collected = true;
        S.scrolls[i].group.visible = false;
      }
    }
    notify('onScrolls', { found: countScrolls(), total: S.scrolls.length });
  }

  function setTouchMode(on) {
    S.opts = S.opts || {};
    S.opts.touch = !!on;
    if (S.active) {
      S.isTouch = !!(on || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));
      updateTouchVisibility();
    }
  }

  function setReduced(on) {
    S.opts = S.opts || {};
    S.opts.reduced = !!on;
    if (S.quality) S.quality.low = !!on || !!S.quality.baseLow;
    if (S.clouds) S.clouds.visible = !(S.quality && S.quality.low);
    if (S.quality && S.renderer) {
      var base = S.quality.baseMaxDpr || S.quality.maxDpr || 1;
      S.quality.maxDpr = on ? Math.min(base, 1) : base;
      S.quality.dpr = Math.min(S.quality.dpr, S.quality.maxDpr);
      applyDpr();
    }
  }

  window.Konoha3D = {
    version: S.version,
    start: start,
    stop: stop,
    pause: pause,
    resume: resume,
    isActive: function () { return S.active; },
    isPaused: function () { return S.paused; },
    isReady: function () { return S.ready; },
    getPlayerState: getPlayerState,
    setPlayerState: setPlayerState,
    setQuest: setQuest,
    setTime: function (minutes, day) {
      if (typeof minutes === 'number') S.clockTime = minutes % 1440;
      if (typeof day === 'number' && day > 0) S.day = day;
      updateSky(true);
      notify('onTime', { minutes: S.clockTime, day: S.day });
    },
    getTime: function () { return { minutes: S.clockTime, day: S.day }; },
    setCamera: function (opts) {
      opts = opts || {};
      if (typeof opts.yaw === 'number') S.cam.yaw = opts.yaw;
      if (typeof opts.pitch === 'number') S.cam.pitch = clamp(opts.pitch, -0.18, 0.95);
      if (typeof opts.dist === 'number') S.cam.dist = clamp(opts.dist, 3.0, 9.5);
      S.cam.initialized = false;
      return { yaw: S.cam.yaw, pitch: S.cam.pitch, dist: S.cam.dist };
    },
    interact: interact,
    enterHokageRoom: enterHokageRoom,
    exitHokageRoom: exitHokageRoom,
    isRoomActive: function () { return !!(S.room && S.room.active); },
    markCollectible: markCollectible,
    setTouchMode: setTouchMode,
    setReduced: setReduced,
    countScrolls: countScrolls,
    /* --- diagnóstico (usado por las pruebas automáticas) --- */
    stats: function () {
      return {
        ready: S.ready, active: S.active, walkable: S.hm ? S.hm.walkable : 0,
        cells: S.hm ? S.hm.y.length : 0,
        grid: S.hm ? { W: S.hm.W, H: S.hm.H, minX: S.hm.minX, minZ: S.hm.minZ, cell: S.hm.cell } : null,
        player: getPlayerState(),
        camera: S.camera ? {
          x: Math.round(S.camera.position.x * 100) / 100,
          y: Math.round(S.camera.position.y * 100) / 100,
          z: Math.round(S.camera.position.z * 100) / 100,
          dist: Math.round(S.cam.curDist * 100) / 100
        } : null,
        solidAtCamera: S.camera ? solidHeight(S.camera.position.x, S.camera.position.z) : null,
        cam: { yaw: S.cam.yaw, pitch: S.cam.pitch, dist: S.cam.curDist },
        quality: { dpr: S.quality.dpr, low: S.quality.low },
        frames: S.frameCount,
        room: S.room ? { active: S.room.active, floorY: ROOM_FLOOR, player: S.player ? { x: S.player.x, y: S.player.y, z: S.player.z, rot: S.player.yaw } : null, exit: { x: S.roomExit.x, z: S.roomExit.z } } : null,
        checkpoint: S.checkpoint ? { x: S.checkpoint.x, z: S.checkpoint.z, y: S.checkpoint.groundY } : null,
        motion: S.player ? { onGround: S.player.onGround, runActive: !!S.player.runActive, speed: S.player.speed, lean: S.player.holder ? S.player.holder.rotation.x : 0, holderY: S.player.holder ? S.player.holder.position.y : 0 } : null,
        npcs: S.npcs.map(function (n) { return { id: n.id, x: n.x, z: n.z, y: n.groundY, full: n.full, seated: !!n.seated }; }),
        scrolls: S.scrolls.map(function (s) { return { id: s.id, x: s.x, z: s.z, y: s.groundY, collected: s.collected ? 1 : 0 }; })
      };
    },
    /* Rejilla de terreno alrededor de un punto: 'y' altura del suelo,
       'w' alcanzable a pie, 's' altura de cualquier geometría (muros) */
    probe: function (x, z, radius) {
      var hm = S.hm;
      if (!hm) return null;
      var r = radius === undefined ? 6 : radius;
      var row = [];
      for (var dz = -r; dz <= r; dz++) {
        var line = [];
        for (var dx = -r; dx <= r; dx++) {
          var wx = x + dx, wz = z + dz;
          var k = cellIndex(hm, wx, wz);
          if (k < 0) { line.push(null); continue; }
          var y = hm.y[k];
          var s = solidHeight(wx, wz);
          line.push({
            y: Math.round(y * 100) / 100,
            w: hm.reach[k] ? 1 : 0,
            s: s === null ? -1 : Math.round(s * 100) / 100
          });
        }
        row.push(line);
      }
      return { rows: row };
    },
    heightAt: function (x, z) {
      var y = terrainHeight(x, z);
      var k = S.hm ? cellIndex(S.hm, x, z) : -1;
      return { y: y, walk: !!(S.hm && k >= 0 && S.hm.reach[k]) };
    }
  };
})();

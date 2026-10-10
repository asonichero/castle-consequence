// Beanstalk — test level: Jack looks after the golden hen. Jack (Day clothes) starts at 75% of his size and must sweep the floor, fill the hen's dish,
// carry water to her trough without spilling it, and win her trust by approaching slowly (move too fast near her and she backs away). He can clap to
// shoo her out of the way, but it costs him size. When Gerda (Work clothes) comes back she asks how it went and Jack can tell the truth or lie. A
// scripted correction follows, across her lap (js/lap.js), its severity decided by how he really did and whether he lied, with Jack at whatever size
// he has been left at. His size never goes below 50%.
// Everything is in skin pixels, as in blocky.js; Jack's size is a fraction of his full size (which is 95% of the model's scale).
(function (root) {
'use strict';
const THREE = root.THREE, B = root.Blocky, Lap = root.Lap;
const V3 = THREE.Vector3;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;

// ── The rules ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const SIZE_START = 0.75, SIZE_MIN = 0.5, FULL = 0.95;
// What makes Jack shrink (fractions of his full size, so 0.05 is five percentage points):
const COST = {
  clap: 0.03,         // clapping to shoo the hen
  lie: 0.05,          // lying to Gerda about how it went
  spill: 0.02,        // each spill of the water he is carrying (every 15 units lost)
  startle: 0.01,      // frightening the hen by moving too fast near her (at most once every four seconds)
  unfinished: 0.02,   // each chore still undone when Gerda comes back
  dawdle: 0.02,       // not done by the time she is back (the clock runs out)
};
const TIME_LIMIT = 240;                       // seconds before Gerda comes back whether he is ready or not
const WALK = 14, CREEP = 5.5;                 // speeds, in his own body-lengths... per second (multiplied by his scale)
const HEN_ALARM = 9, SPILL_ABOVE = 9;         // moving faster than this (same units) frightens the hen near her / slops the water
const HALL = { x0: -70, x1: 70, z0: -44, z1: 44 };
const SPOT = {
  rack: new V3(-50, 0, -38), sack: new V3(-48, 0, 34), dish: new V3(22, 0, 18), trough: new V3(38, 0, 18), well: new V3(45, 0, -30), door: new V3(-72, 0, 0),
};
const PEN = { x0: 8, x1: 62, z0: 2, z1: 36 };
const PATCHES = [[-30, -20], [-10, 10], [5, -25], [-45, 10], [20, -8], [-20, 28]];
const CHORES = ['sweep', 'dish', 'water', 'trust'];

// ── Small builders ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const srgb = hex => new THREE.Color(hex).convertSRGBToLinear();
const mat = hex => new THREE.MeshLambertMaterial({ color: srgb(hex) });
function box(w, h, d, x, y, z, hex, parent) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(hex)); m.position.set(x, y, z); if (parent) parent.add(m); return m; }

function plankTexture(base, line, repeat) {
  const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 32, 32); x.fillStyle = line; for (let i = 0; i < 4; i++) x.fillRect(0, i * 8, 32, 1);
  let s = 11; for (let i = 0; i < 40; i++) { s = (s * 1103515245 + 12345) >>> 0; x.fillStyle = 'rgba(0,0,0,0.07)'; x.fillRect((s >> 8) % 32, (s >> 16) % 32, 2, 1); }
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.encoding = THREE.sRGBEncoding; return t;
}

// The golden hen: a blocky bird facing +z. Parts are kept so she can peck, flap and settle.
function makeHen() {
  const g = new THREE.Group(), parts = {};
  const gold = 0xe2ab2c, goldHi = 0xf0c64a, goldDk = 0xb8851c, red = 0xc4402c, orange = 0xe08a2a;
  const body = new THREE.Group(); body.position.y = 6.5; g.add(body); parts.body = body;
  box(7, 6, 10, 0, 0, 0, gold, body); box(5, 3, 8, 0, 3.2, -0.3, goldHi, body); box(6, 4, 4, 0, -0.5, 4.8, goldHi, body);          // body, back, breast
  parts.tail = new THREE.Group(); parts.tail.position.set(0, 2.5, -5); body.add(parts.tail);
  box(1.6, 5, 1.2, 0, 1.5, -1, goldDk, parts.tail); box(1.6, 4, 1.2, -1.8, 1, -0.8, gold, parts.tail); box(1.6, 4, 1.2, 1.8, 1, -0.8, gold, parts.tail);   // tail feathers
  parts.wingL = new THREE.Group(); parts.wingL.position.set(3.6, 1.5, 0); body.add(parts.wingL); box(0.9, 4, 7, 0.3, -1, 0, goldDk, parts.wingL);
  parts.wingR = new THREE.Group(); parts.wingR.position.set(-3.6, 1.5, 0); body.add(parts.wingR); box(0.9, 4, 7, -0.3, -1, 0, goldDk, parts.wingR);
  parts.head = new THREE.Group(); parts.head.position.set(0, 3.2, 5.6); body.add(parts.head);
  box(3, 4, 3, 0, 0.8, 0, goldHi, parts.head); box(3.6, 3.4, 3.6, 0, 3.4, 1.2, gold, parts.head);                                  // neck and head
  box(1.6, 1.2, 2, 0, 3.3, 3.6, orange, parts.head); box(0.6, 1.2, 2.6, 0, 5.6, 1.2, red, parts.head); box(0.8, 1.4, 0.8, 0, 2.2, 3.1, red, parts.head);   // beak, comb, wattle
  box(0.6, 0.6, 0.3, 1.5, 4, 3.0, 0x1b1410, parts.head); box(0.6, 0.6, 0.3, -1.5, 4, 3.0, 0x1b1410, parts.head);                      // eyes
  for (const sx of [-1.6, 1.6]) { box(0.7, 3.6, 0.7, sx, 1.8, 0.5, orange, g); box(2.2, 0.5, 2.6, sx, 0.25, 1.1, orange, g); }        // legs and feet
  g.userData.parts = parts; return g;
}

// A simple walking rig: legs and arms swing from rig.walk = { sw, arm, carry, clap }.
function rigWalk(rig) {
  rig.walk = { sw: 0, arm: 0, carry: 0, clap: 0 };
  rig.after = r => {
    const w = r.walk;
    r.legL.thigh.rotation.x = w.sw; r.legR.thigh.rotation.x = -w.sw;
    r.armL.rotation.x = lerp(-w.arm, -1.15, w.carry); r.armR.rotation.x = lerp(w.arm, -1.15, w.carry);
    if (w.clap > 0) { r.armL.rotation.x = r.armR.rotation.x = -1.2; r.armL.rotation.z = -0.35 + 0.3 * Math.sin(w.clap * 30); r.armR.rotation.z = 0.35 - 0.3 * Math.sin(w.clap * 30); }
  };
}

// ── The level ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function create(els, ui) {
  const lvlEl = els.level, lapEl = els.lap;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.setPixelRatio(Math.min(2, root.devicePixelRatio || 1)); lvlEl.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1b2230); scene.fog = new THREE.Fog(0x1b2230, 160, 320);
  const camera = new THREE.PerspectiveCamera(38, 1, 1, 600);
  scene.add(new THREE.HemisphereLight(0xe8eeff, 0x40362e, 0.75));
  const sun = new THREE.DirectionalLight(0xfff0d8, 0.7); sun.position.set(-30, 90, 60); scene.add(sun);

  // The room: a plank floor, a back wall, a side wall with the door (Gerda's way in), a low fence on the right.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(140, 88), new THREE.MeshLambertMaterial({ map: plankTexture('#8a6c4a', '#6b5238', [14, 9]) })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const wallMat = new THREE.MeshLambertMaterial({ map: plankTexture('#6e5a46', '#55442f', [10, 2]) });
  const wall = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat); m.position.set(x, y, z); scene.add(m); return m; };
  wall(144, 26, 2, 0, 13, -45); wall(2, 26, 36, -71, 13, -27); wall(2, 26, 36, -71, 13, 27); wall(2, 8, 18, -71, 22, 0); wall(2, 26, 90, 71, 13, 0);
  box(2.4, 26, 2.4, -71, 13, -9, 0x4a3a2a, scene); box(2.4, 26, 2.4, -71, 13, 9, 0x4a3a2a, scene);
  // The nest (the hen's corner): straw bedding and low boards.
  box(20, 1, 14, 52, 0.5, 30, 0xc9a54a, scene); box(20, 4, 1, 52, 2, 23.5, 0x7a5a38, scene); box(1, 4, 14, 41.5, 2, 30, 0x7a5a38, scene);

  // Props.
  const props = {};
  props.rack = new THREE.Group(); props.rack.position.copy(SPOT.rack); scene.add(props.rack);
  box(14, 2, 1, 0, 14, -5, 0x5a4430, props.rack); box(1, 3, 2, -4, 12, -4, 0x5a4430, props.rack); box(1, 3, 2, 4, 12, -4, 0x5a4430, props.rack);
  props.broom = new THREE.Group(); box(0.9, 18, 0.9, 0, 9, 0, 0x8a6a40, props.broom); box(3.4, 5, 2.2, 0, 2.5, 0, 0xc9b06a, props.broom); box(3, 1, 2, 0, 5.4, 0, 0x6a5030, props.broom);
  props.broom.position.set(0, 0, -3); props.broom.rotation.x = -0.12; props.rack.add(props.broom);
  props.sack = new THREE.Group(); props.sack.position.copy(SPOT.sack); scene.add(props.sack);
  box(9, 10, 7, 0, 5, 0, 0xc2a678, props.sack); box(7, 2, 5, 0, 10.4, 0, 0xe0c46a, props.sack); box(9.2, 1, 7.2, 0, 8, 0, 0x8a7448, props.sack);
  props.dish = new THREE.Group(); props.dish.position.copy(SPOT.dish); scene.add(props.dish);
  box(8, 2, 8, 0, 1, 0, 0x6a4a30, props.dish); box(6, 1, 6, 0, 2, 0, 0x2a1d12, props.dish); props.grain = box(5.4, 1, 5.4, 0, 2.4, 0, 0xf0c64a, props.dish); props.grain.visible = false;
  props.trough = new THREE.Group(); props.trough.position.copy(SPOT.trough); scene.add(props.trough);
  box(14, 3, 6, 0, 1.5, 0, 0x6a4a30, props.trough); box(12, 2, 4, 0, 3, 0, 0x2a1d12, props.trough); props.water = box(11.6, 1, 3.6, 0, 3.4, 0, 0x5aa0e0, props.trough); props.water.visible = false;
  props.well = new THREE.Group(); props.well.position.copy(SPOT.well); scene.add(props.well);
  for (const [x, z] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) box(3, 7, 3, x, 3.5, z, 0x8a8a90, props.well);
  box(8, 3, 3, 0, 8, -4, 0x8a8a90, props.well); box(8, 3, 3, 0, 8, 4, 0x8a8a90, props.well); box(3, 3, 8, -4, 8, 0, 0x8a8a90, props.well); box(3, 3, 8, 4, 8, 0, 0x8a8a90, props.well);
  box(1.4, 16, 1.4, -5, 8, 0, 0x5a4430, props.well); box(1.4, 16, 1.4, 5, 8, 0, 0x5a4430, props.well); box(12, 1.4, 1.4, 0, 16, 0, 0x5a4430, props.well);
  props.bucketHome = new THREE.Group(); props.bucketHome.position.set(0, 9.5, 0); props.well.add(props.bucketHome);
  const makeBucket = () => { const b = new THREE.Group(); box(4.4, 4, 4.4, 0, 2, 0, 0x7a5a38, b); const w = box(3.6, 0.6, 3.6, 0, 3.8, 0, 0x5aa0e0, b); b.userData.water = w; box(0.5, 3, 0.5, 0, 6, 0, 0x4a3a2a, b); return b; };
  const bucket = makeBucket(); props.bucketHome.add(bucket);
  // The doorway's light.
  box(0.4, 18, 14, -70, 9, 0, 0xf6e6b0, scene).material.transparent = true;

  // Dirt to sweep.
  const patches = PATCHES.map(([x, z]) => {
    const g = new THREE.Group(); g.position.set(x, 0.1, z);
    const d = new THREE.Mesh(new THREE.CircleGeometry(5.2, 10), mat(0x4a3722)); d.rotation.x = -Math.PI / 2; g.add(d);
    for (let i = 0; i < 5; i++) box(1.6, 0.3, 0.5, (i - 2) * 1.8, 0.4, ((i * 7) % 5 - 2) * 1.3, 0xc9a54a, g).rotation.y = i;
    scene.add(g); return { g, x, z, amount: 1 };
  });

  // Characters.
  const jack = B.makeJack(); B.paintJackInto(jack.skin, { outfit: 'Day', hitched: false }); jack.tex.needsUpdate = true; rigWalk(jack);
  const jackG = new THREE.Group(); jackG.add(jack.root); scene.add(jackG);
  const gerda = B.makeGerda('Work'); rigWalk(gerda); const gerdaG = new THREE.Group(); gerdaG.add(gerda.root); gerdaG.visible = false; scene.add(gerdaG);
  const hen = makeHen(), henP = hen.userData.parts; scene.add(hen);
  // What Jack carries (attached to his right hand).
  const held = { broom: null, grain: null, bucket: null };
  const carryBroom = new THREE.Group(); carryBroom.visible = false; jack.armR.add(carryBroom);
  const heldBroom = props.broom.clone(); heldBroom.position.set(0, -9, 3); heldBroom.rotation.set(-0.5, 0, 0); carryBroom.add(heldBroom);
  const carryGrain = new THREE.Group(); carryGrain.visible = false; jack.armR.add(carryGrain); box(4, 3, 4, 0, -10, 3.5, 0xf0c64a, carryGrain); box(4.6, 1, 4.6, 0, -11.8, 3.5, 0x7a5a38, carryGrain);
  const carryBucket = makeBucket(); carryBucket.visible = false; carryBucket.position.set(0, -12, 4.5); jack.armR.add(carryBucket);
  // Spilled drops.
  const drops = []; const dropGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8), dropMat = mat(0x6ab0f0);

  // ── State ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const S = {
    phase: 'play', t: 0, size: SIZE_START, shownSize: SIZE_START, log: [], floats: [],
    pos: new V3(-35, 0, 4), heading: 0, speedN: 0, creeping: false, phaseWalk: 0,
    holding: null, water: 0, spillAcc: 0, spillCool: 0, sweeping: false, clapCool: 0,
    chores: { sweep: false, dish: false, water: false, trust: false }, dishFilled: false, troughFilled: false,
    counts: { claps: 0, spills: 0, startles: 0, unfinished: 0, dawdle: 0 }, lie: false, told: null,
    hen: { pos: new V3(34, 0, 22), target: new V3(34, 0, 22), mode: 'wander', timer: 2, trust: 0, startleCool: 0, heading: 0, bob: 0, settled: false },
    shrunk: [],
    hint: '', msg: '',
  };
  const keys = {};
  const note = (text, cls) => { S.log.unshift({ text, cls: cls || '', t: S.t }); if (S.log.length > 6) S.log.pop(); ui.log && ui.log(S.log); };
  function shrink(amount, why) {
    const before = S.size; S.size = Math.max(SIZE_MIN, S.size - amount); const lost = Math.round((before - S.size) * 100);
    S.shrunk.push({ why, amount: before - S.size });
    note(lost > 0 ? `${why}: −${lost}% (you are ${Math.round(S.size * 100)}%)` : `${why}: you cannot get any smaller (50%)`, 'bad');
    S.floats.push({ text: lost > 0 ? `−${lost}%` : '50% floor', t: 0 });
  }

  // ── Input ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right', Shift: 'creep', ' ': 'sweep' };
  root.addEventListener('keydown', e => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    const k = KEYMAP[e.key]; if (k) { keys[k] = true; if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault(); }
    if (S.phase !== 'play') return;
    if (e.key === 'e' || e.key === 'E') interact();
    if (e.key === 'c' || e.key === 'C') clap();
    if (e.key === 'q' || e.key === 'Q') putDown();
  });
  root.addEventListener('keyup', e => { const k = KEYMAP[e.key]; if (k) keys[k] = false; });

  // ── Doing things ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const near = (p, r) => S.pos.distanceTo(p) < (r || 11);
  const heldName = () => S.holding;
  function setHeld(what) {
    S.holding = what; carryBroom.visible = what === 'broom'; carryGrain.visible = what === 'grain'; carryBucket.visible = what === 'bucket';
    props.broom.visible = what !== 'broom'; bucket.visible = what !== 'bucket';
  }
  function interact() {
    if (S.phase !== 'play') return;
    if (near(SPOT.rack)) { if (!S.holding) { setHeld('broom'); note('You take the broom. Hold Space to sweep.'); } else if (S.holding === 'broom') { setHeld(null); note('You hang the broom back up.'); } else note('Your hands are full.'); return; }
    if (near(SPOT.sack)) { if (!S.holding) { setHeld('grain'); note('You scoop up some grain.'); } else if (S.holding === 'grain') { setHeld(null); note('You tip the grain back.'); } else note('Your hands are full.'); return; }
    if (near(SPOT.dish, 12)) {
      if (S.holding !== 'grain') { note(S.dishFilled ? 'The dish is full.' : 'You need grain for the dish.'); return; }
      if (S.hen.pos.distanceTo(SPOT.dish) < 9) { note('The hen is standing in the dish. (Clap to shoo her, if you must.)'); return; }
      S.dishFilled = true; S.chores.dish = true; props.grain.visible = true; setHeld(null); note('You fill her dish with grain. ✔', 'good'); return;
    }
    if (near(SPOT.well)) { if (!S.holding) { setHeld('bucket'); S.water = 100; S.spillAcc = 0; note('You fill the bucket. Creep (hold Shift) so it does not slop.'); } else if (S.holding === 'bucket') { setHeld(null); S.water = 0; note('You set the bucket down at the well.'); } else note('Your hands are full.'); return; }
    if (near(SPOT.trough, 12)) {
      if (S.holding !== 'bucket') { note(S.troughFilled ? 'The trough is full.' : 'You need the water bucket.'); return; }
      if (S.water < 50) { note('Too little left in the bucket: go and fill it again.'); return; }
      S.troughFilled = true; S.chores.water = true; props.water.visible = true;
      note(S.counts.spills ? 'You pour the water in. ✔ (you did spill some on the way)' : 'You pour the water in without a drop lost. ✔', 'good'); setHeld(null); S.water = 0; return;
    }
    if (S.hen.pos.distanceTo(S.pos) < 12) {
      if (S.hen.trust >= 100 && !S.chores.trust) { S.chores.trust = true; S.hen.settled = true; note('The golden hen lets you stroke her. She trusts you. ✔', 'good'); }
      else if (!S.chores.trust) note('She is not ready to be touched. Approach slowly and wait.');
      return;
    }
    note('Nothing to do here.');
  }
  function putDown() {
    if (!S.holding) return;
    if (S.holding === 'bucket' && S.water > 0) { note('You drop the bucket and the water goes everywhere!', 'bad'); spillDrops(S.water / 10); S.counts.spills++; shrink(COST.spill, 'Dropped the water'); }
    setHeld(null); S.water = 0;
  }
  function clap() {
    if (S.clapCool > 0) return;
    S.clapCool = 1.2; jack.walk.clap = 0.0001; S.counts.claps++;
    const d = S.hen.pos.distanceTo(S.pos);
    note('CLAP!');
    if (d < 40) { fleeFrom(S.pos, 'clap'); S.hen.trust = Math.max(0, S.hen.trust - 25); if (S.chores.trust === false) S.hen.settled = false; }
    shrink(COST.clap, 'Clapping at the hen');
  }
  function spillDrops(n) { for (let i = 0; i < n; i++) { const m = new THREE.Mesh(dropGeo, dropMat); m.position.copy(S.pos).add(new V3(0, 8, 0)); scene.add(m); drops.push({ m, v: new V3((Math.random() - 0.5) * 8, 6 + Math.random() * 6, (Math.random() - 0.5) * 8), life: 1.2 }); } }

  // ── The hen ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  function penPoint() { return new V3(lerp(PEN.x0, PEN.x1, Math.random()), 0, lerp(PEN.z0, PEN.z1, Math.random())); }
  function fleeFrom(from, why) {
    const h = S.hen, away = h.pos.clone().sub(from); away.y = 0; if (away.lengthSq() < 0.01) away.set(1, 0, 0.3); away.normalize();
    let t = h.pos.clone().addScaledVector(away, 26); t.x = clamp(t.x, PEN.x0, PEN.x1); t.z = clamp(t.z, PEN.z0, PEN.z1);
    if (t.distanceTo(h.pos) < 8) t = penPoint();
    h.target = t; h.mode = 'flee'; h.settled = false;
  }
  function updateHen(dt) {
    const h = S.hen, d = h.pos.distanceTo(S.pos); h.startleCool = Math.max(0, h.startleCool - dt);
    // Too fast, too close: she backs away.
    if (d < 20 && S.speedN > HEN_ALARM && h.mode !== 'flee') {
      fleeFrom(S.pos, 'fast'); h.trust = Math.max(0, h.trust - 14);
      if (h.startleCool <= 0) { h.startleCool = 4; S.counts.startles++; note('You moved too fast: the hen backs away.', 'bad'); shrink(COST.startle, 'Startling the hen'); }
    }
    // Slow and close: she warms to you.
    if (d < 11 && S.speedN < 6.5 && h.mode !== 'flee' && !S.chores.trust) h.trust = Math.min(100, h.trust + (S.speedN < 1 ? 16 : 10) * dt);
    if (S.chores.trust || h.settled) { h.settled = true; h.mode = 'settled'; const to = S.pos.clone().add(new V3(Math.sin(S.heading) * 9, 0, Math.cos(S.heading) * 9)); const dd = to.distanceTo(h.pos); if (dd > 2) h.pos.addScaledVector(to.sub(h.pos).normalize(), Math.min(dd, 9 * dt)); }
    else if (h.mode === 'flee') { const dd = h.target.distanceTo(h.pos); if (dd < 1) { h.mode = 'wander'; h.timer = 2; } else h.pos.addScaledVector(h.target.clone().sub(h.pos).normalize(), Math.min(dd, 24 * dt)); }
    else {
      h.timer -= dt; const dd = h.target.distanceTo(h.pos);
      if (dd > 0.8) h.pos.addScaledVector(h.target.clone().sub(h.pos).normalize(), Math.min(dd, 5 * dt));
      if (h.timer <= 0) { h.timer = 3 + Math.random() * 4; h.target = Math.random() < 0.35 ? SPOT.dish.clone().add(new V3(-5, 0, -4)) : penPoint(); }
    }
    h.pos.x = clamp(h.pos.x, HALL.x0 + 4, HALL.x1 - 4); h.pos.z = clamp(h.pos.z, HALL.z0 + 4, HALL.z1 - 4);
    // Face where she is going (or at Jack when she trusts him).
    const look = h.mode === 'settled' ? S.pos.clone().sub(h.pos) : h.target.clone().sub(h.pos); if (look.lengthSq() > 0.5) h.heading = Math.atan2(look.x, look.z);
    hen.position.copy(h.pos); hen.rotation.y = lerp(hen.rotation.y, h.heading, Math.min(1, dt * 8)); h.bob += dt * (h.mode === 'flee' ? 18 : h.mode === 'settled' ? 2 : 5);
    const flee = h.mode === 'flee';
    henP.head.rotation.x = flee ? -0.2 : 0.35 * Math.max(0, Math.sin(h.bob)) * (h.mode === 'settled' ? 0.2 : 1);
    henP.wingL.rotation.z = flee ? 0.9 + 0.5 * Math.sin(h.bob * 2) : 0.05; henP.wingR.rotation.z = -henP.wingL.rotation.z; henP.body.position.y = 6.5 + (flee ? 0.8 * Math.abs(Math.sin(h.bob)) : 0) - (h.mode === 'settled' ? 1 : 0);
    henP.tail.rotation.x = flee ? -0.6 : 0.1;
  }

  // ── Per-frame play ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  function updatePlay(dt) {
    S.t += dt; S.clapCool = Math.max(0, S.clapCool - dt); S.spillCool = Math.max(0, S.spillCool - dt);
    const scale = S.shownSize * FULL;
    // Movement. Hold Shift to creep.
    const dir = new V3((keys.right ? 1 : 0) - (keys.left ? 1 : 0), 0, (keys.down ? 1 : 0) - (keys.up ? 1 : 0)); S.creeping = !!keys.creep;
    const want = dir.lengthSq() > 0 ? dir.normalize().multiplyScalar((S.creeping ? CREEP : WALK) * scale) : new V3();
    const vel = want; S.pos.addScaledVector(vel, dt);
    for (const [p, r] of [[SPOT.well, 9], [SPOT.sack, 6], [SPOT.trough, 8]]) { const dd = S.pos.clone().sub(p); dd.y = 0; if (dd.length() < r) S.pos.copy(p).addScaledVector(dd.normalize(), r); }
    S.pos.x = clamp(S.pos.x, HALL.x0 + 5, HALL.x1 - 5); S.pos.z = clamp(S.pos.z, HALL.z0 + 5, HALL.z1 - 5);
    S.speedN = vel.length() / scale;
    if (vel.lengthSq() > 0.01) S.heading = Math.atan2(vel.x, vel.z);
    // The water.
    if (S.holding === 'bucket' && S.speedN > SPILL_ABOVE) {
      const loss = (S.speedN - SPILL_ABOVE) * 4.5 * dt; S.water = Math.max(0, S.water - loss); S.spillAcc += loss; if (Math.random() < 0.4) spillDrops(1);
      if (S.spillAcc >= 15 && S.spillCool <= 0) { S.spillAcc -= 15; S.spillCool = 1.5; S.counts.spills++; note('Water slops over the rim!', 'bad'); shrink(COST.spill, 'Spilling the water'); }
    }
    // Sweeping: Space with the broom.
    S.sweeping = !!(keys.sweep && S.holding === 'broom');
    if (S.sweeping) {
      const front = S.pos.clone().add(new V3(Math.sin(S.heading), 0, Math.cos(S.heading)).multiplyScalar(7 * scale / 0.7));
      for (const p of patches) if (p.amount > 0 && Math.hypot(p.x - front.x, p.z - front.z) < 8) p.amount = Math.max(0, p.amount - dt / 1.1);
      if (!S.chores.sweep && patches.every(p => p.amount <= 0)) { S.chores.sweep = true; note('The floor is swept. ✔', 'good'); }
    }
    for (const p of patches) { p.g.visible = p.amount > 0.02; p.g.scale.setScalar(0.4 + 0.6 * p.amount); }
    updateHen(dt);
    // Hints.
    S.hint = '';
    if (near(SPOT.rack)) S.hint = S.holding === 'broom' ? 'E: hang up the broom' : S.holding ? '' : 'E: take the broom';
    else if (near(SPOT.sack)) S.hint = S.holding === 'grain' ? 'E: put the grain back' : S.holding ? '' : 'E: scoop grain';
    else if (near(SPOT.dish, 12)) S.hint = S.holding === 'grain' ? 'E: fill the dish' : '';
    else if (near(SPOT.well)) S.hint = S.holding === 'bucket' ? 'E: put the bucket down' : S.holding ? '' : 'E: fill the bucket';
    else if (near(SPOT.trough, 12)) S.hint = S.holding === 'bucket' ? 'E: pour the water in' : '';
    else if (S.hen.pos.distanceTo(S.pos) < 12 && S.hen.trust >= 100 && !S.chores.trust) S.hint = 'E: stroke the hen';
    // End of the job.
    const done = CHORES.every(c => S.chores[c]);
    if (done && !S.doneAt) { S.doneAt = S.t; note('All done. Gerda will be back any moment…'); }
    if ((S.doneAt && S.t - S.doneAt > 2.5) || S.t > TIME_LIMIT) beginReturn(S.t > TIME_LIMIT && !done);
  }

  // ── Characters on screen ───────────────────────────────────────────────────────────────────────────────────────────────────────────
  function poseJack(dt) {
    S.shownSize += (S.size - S.shownSize) * Math.min(1, dt * 5); const sc = S.shownSize * FULL;
    jackG.position.copy(S.pos); jack.root.scale.setScalar(sc); jack.root.rotation.y = lerp(jack.root.rotation.y, S.heading, Math.min(1, dt * 10));
    const moving = S.speedN > 0.5; S.phaseWalk += dt * (S.speedN * 0.55);
    jack.walk.sw = moving ? Math.sin(S.phaseWalk) * 0.65 : 0; jack.walk.arm = moving ? Math.sin(S.phaseWalk) * 0.55 : 0;
    jack.walk.carry = lerp(jack.walk.carry, S.holding === 'bucket' || S.holding === 'grain' ? 1 : S.holding === 'broom' ? 0.8 : 0, Math.min(1, dt * 8));
    if (S.sweeping) { jack.walk.arm = 0; carryBroom.rotation.z = Math.sin(S.t * 14) * 0.35; } else carryBroom.rotation.z = 0;
    if (jack.walk.clap > 0) { jack.walk.clap += dt; if (jack.walk.clap > 0.45) jack.walk.clap = 0; }
    if (S.holding === 'bucket') { const w = carryBucket.userData.water; w.scale.y = Math.max(0.01, S.water / 100); w.visible = S.water > 2; }
    B.step(jack, dt);
  }
  function floatTexts(dt) {
    for (const f of S.floats) f.t += dt; S.floats = S.floats.filter(f => f.t < 1.6); ui.floats && ui.floats(S.floats, camera, jackG.position, S.shownSize * FULL);
    for (const d of drops) { d.life -= dt; d.v.y -= 30 * dt; d.m.position.addScaledVector(d.v, dt); if (d.m.position.y < 0.4) { d.m.position.y = 0.4; d.v.set(0, 0, 0); } if (d.life <= 0) scene.remove(d.m); }
    for (let i = drops.length - 1; i >= 0; i--) if (drops[i].life <= 0) drops.splice(i, 1);
  }

  // ── Gerda comes back ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
  let gerdaAt = null;
  function beginReturn(clockRanOut) {
    if (S.phase !== 'play') return;
    S.phase = 'return'; setHeld(null); S.sweeping = false; S.speedN = 0;
    for (const c of CHORES) if (!S.chores[c]) { S.counts.unfinished++; }
    if (S.counts.unfinished) shrink(COST.unfinished * S.counts.unfinished, `${S.counts.unfinished} chore${S.counts.unfinished > 1 ? 's' : ''} left undone`);
    if (clockRanOut) { S.counts.dawdle = 1; shrink(COST.dawdle, 'Taking too long'); }
    gerdaG.visible = true; gerdaG.position.copy(SPOT.door); gerdaG.position.x = -66; gerdaAt = 'walking';
    S.targetPos = new V3(-4, 0, 2);
  }
  function updateReturn(dt) {
    S.t += dt;
    // Gerda walks in to meet Jack; Jack turns to face her.
    const target = new V3(S.pos.x - 16, 0, S.pos.z); target.x = Math.max(target.x, -58);
    if (gerdaAt === 'walking') {
      const d = target.clone().sub(gerdaG.position); d.y = 0;
      if (d.length() > 1.5) { gerdaG.position.addScaledVector(d.normalize(), Math.min(d.length(), 14 * dt)); gerda.root.rotation.y = Math.atan2(d.x, d.z); gerda.walk.sw = Math.sin(S.t * 7) * 0.5; gerda.walk.arm = Math.sin(S.t * 7) * 0.4; }
      else { gerdaAt = 'here'; gerda.walk.sw = 0; gerda.walk.arm = 0; S.heading = Math.atan2(gerdaG.position.x - S.pos.x, gerdaG.position.z - S.pos.z); gerda.root.rotation.y = Math.atan2(S.pos.x - gerdaG.position.x, S.pos.z - gerdaG.position.z); askHowItWent(); }
    }
    updateHen(dt); poseJack(dt); B.step(gerda, dt);
  }
  const reasons = () => {
    const c = S.counts, r = [];
    if (c.spills) r.push(c.spills > 1 ? 'spilled the water more than once' : 'spilled the water');
    if (c.startles) r.push(c.startles > 1 ? 'frightened my hen' : 'frightened my hen');
    if (c.claps) r.push(c.claps > 1 ? 'clapped at her to shoo her' : 'clapped at her to shoo her');
    if (c.unfinished) r.push('left ' + (c.unfinished > 1 ? 'chores' : 'a chore') + ' undone');
    if (c.dawdle) r.push('dawdled');
    return r;
  };
  const perfect = () => !reasons().length;
  const list = r => r.length <= 1 ? r.join('') : r.slice(0, -1).join(', ') + ' and ' + r[r.length - 1];
  function askHowItWent() {
    S.phase = 'ask';
    ui.dialog({ who: 'Gerda', text: 'There you are. So — how did it go with the hen?', choices: [
      { label: 'Tell her exactly what happened', fn: () => answer('truth') },
      { label: 'Say it all went perfectly', fn: () => answer('perfect') },
    ] });
  }
  function answer(kind) {
    S.told = kind; const real = perfect();
    if (kind === 'perfect' && !real) { S.lie = true; shrink(COST.lie, 'Lying to Gerda'); }
    let text;
    if (kind === 'truth') text = real ? '“Everything done, and she lets me stroke her,” you say. Gerda nods slowly. “Good. I like it when it is true.”'
      : `“I ${list(reasons())},” you admit. Gerda’s mouth twitches. “Thank you for telling me straight. That counts.”`;
    else text = real ? '“It all went perfectly,” you say, and for once it is simply true. Gerda smiles, a little disappointed to find nothing to scold.'
      : `“It all went perfectly,” you say. Gerda looks at the dish, the floor, the hen, and then at you. “Does it? You ${list(reasons())}. And now you have lied to me about it as well.”`;
    const plan = buildPlan();
    ui.dialog({ who: 'Gerda', text: text + ' ' + plan.verdict, choices: [{ label: 'Go with her…', fn: () => startDiscipline(plan) }] });
  }

  // ── Severity ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // How Jack really did, plus whether he lied: demerits, then a tier (0 token … 3 severe); a lie lifts it a tier.
  function demerits() { const c = S.counts; return c.unfinished * 2 + c.spills * 1.5 + c.startles * 0.5 + c.claps * 1 + c.dawdle * 1; }
  function buildPlan() {
    const d = demerits(); let tier = d < 0.5 ? 0 : d < 4 ? 1 : d < 8 ? 2 : 3; if (S.lie) tier = Math.min(3, tier + 1);
    const TIERS = [
      { name: 'Token', hand: 6, paddle: 0, strength: 0.7, pace: 1.0, verdict: 'No complaints really — “a few for luck, then.”' },
      { name: 'Light', hand: 14, paddle: 0, strength: 0.85, pace: 1.1, verdict: '“A light correction, I think.”' },
      { name: 'Firm', hand: 26, paddle: 0, strength: 1.0, pace: 1.2, verdict: '“A firm one. Come along.”' },
      { name: 'Severe', hand: 16, paddle: 16, strength: 1.1, pace: 1.3, verdict: '“I think the paddle, this time.”' },
    ];
    const T = TIERS[tier];
    return Object.assign({ tier, demerits: d, reasons: reasons(), lie: S.lie }, T);
  }

  // ── The scripted correction ────────────────────────────────────────────────────────────────────────────────────────────────────────
  let lap = null, steps = [], stepAt = 0, stepWait = 0, hitsSeen = 0, planNow = null;
  function startDiscipline(plan) {
    planNow = plan; S.phase = 'discipline'; S.floats = []; ui.floats && ui.floats([], camera, jackG.position, 1); lvlEl.style.display = 'none'; lapEl.style.display = 'block'; ui.discipline(true, plan);
    if (!lap) { lap = Lap.create(lapEl); lap.on((type, d) => { if (type === 'hit') hitsSeen++; if (type === 'tooharsh') say('Gerda', 'That is quite enough.'); }); }
    lap.reset(); lap.st.sound = true; lap.outfit('gerda', 'Work'); lap.outfit('jack', 'Day'); lap.size(S.size);
    lap.layers({ trousers: 'up', drawers: 'up' }); lap.implement('hand'); lap.st.side = 'alt';
    // A smaller Jack feels the same hand more: strength grows as he shrinks.
    const bias = 1 + 0.8 * (1 - S.size);
    lap.st.strength = clamp(plan.strength * bias, 0.5, 1.5); lap.st.pace = plan.pace; lap.view('overview');
    steps = scriptFor(plan); stepAt = 0; stepWait = 0.5; hitsSeen = 0;
  }
  const say = (who, text) => ui.say(who, text);
  const sayStep = (who, text, ms) => ({ say: [who, text], wait: ms || 2600 });
  function scriptFor(p) {
    const r = p.reasons, st = [];
    const why = r.length ? `You ${list(r)}.` : 'You did everything I asked.';
    st.push(sayStep('Gerda', p.tier === 0 ? `${why} I have no real complaint.` : why, 3200));
    if (p.lie) st.push(sayStep('Gerda', 'And you told me it was perfect. That is the part that earns the extra.', 3400));
    st.push(sayStep('Gerda', p.tier === 0 ? 'Still. Across my lap, for luck.' : 'Over my knee. Now.', 2400));
    st.push({ do: () => lap.view('overview'), wait: 500 });
    const chunk = (n, line, jackLine) => { if (!n) return; st.push({ run: n }); if (line) st.push(sayStep('Gerda', line, 2200)); if (jackLine) st.push(sayStep('Jack', jackLine, 1800)); };
    if (p.tier === 0) { chunk(p.hand, 'There. Off you go.'); }
    else if (p.tier === 1) { chunk(Math.ceil(p.hand / 2), 'Hold still.', 'Ow — I am sorry!'); chunk(Math.floor(p.hand / 2), 'That will do.'); }
    else if (p.tier === 2) {
      chunk(Math.ceil(p.hand / 3), 'You will remember this next time.', 'I will, I will!');
      st.push({ do: () => lap.layers({ trousers: 'down' }), wait: 600 }, sayStep('Gerda', 'Shorts down. You know why.', 1800));
      chunk(Math.ceil(p.hand / 3), 'Quiet.', 'Ow! Please!'); chunk(p.hand - 2 * Math.ceil(p.hand / 3), 'Nearly done.');
    } else {
      st.push({ do: () => lap.layers({ trousers: 'down' }), wait: 500 });
      chunk(Math.ceil(p.hand / 2), 'This is what honesty costs.', 'I am sorry, I am sorry!'); chunk(p.hand - Math.ceil(p.hand / 2), 'Nearly there.');
      st.push({ wait2: 'idle' }, { do: () => { lap.implement('paddle'); lap.layers({ trousers: 'down', drawers: 'down' }); }, wait: 400 }, sayStep('Gerda', 'The paddle for the rest.', 2200));
      chunk(Math.ceil(p.paddle / 2), 'Stay where you are.', 'Please — no more!'); chunk(p.paddle - Math.ceil(p.paddle / 2), 'And that is the last of it.');
    }
    st.push({ end: true });
    return st;
  }
  function updateDiscipline(dt) {
    lap.update(dt); ui.meter && ui.meter(lap.info());
    if (stepAt >= steps.length) return;
    if (stepWait > 0) { stepWait -= dt; return; }
    const s = steps[stepAt];
    if (s.run) {                            // a run of smacks: start it, then wait until it has finished (or been stopped)
      if (!s.started) { s.started = true; lap.run(s.run); return; }
      if (!lap.st.swing && lap.st.runLeft === 0) stepAt++;
      return;
    }
    if (s.wait2) { if (!lap.st.swing) stepAt++; return; }
    if (s.say) say(s.say[0], s.say[1]);
    if (s.do) s.do();
    if (s.end) { finishDiscipline(false); stepAt = steps.length; return; }
    stepAt++; stepWait = (s.wait || 0) / 1000;
  }
  function finishDiscipline(red) {
    lap.end && lap.end(); const info = lap.info();
    ui.finish({ red, plan: planNow, info, size: S.size, log: S.shrunk, counts: S.counts, lie: S.lie, hits: lap.st.hits });
  }
  function redWord() { if (S.phase !== 'discipline' || !lap) return; stepAt = steps.length; lap.red(); say('Gerda', 'Red. Stopping at once. Come here.'); finishDiscipline(true); }

  // ── Loop ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  function frame(dt) {
    if (S.phase === 'discipline') { updateDiscipline(dt); return; }
    if (S.phase === 'play') { updatePlay(dt); poseJack(dt); }
    else if (S.phase === 'return' || S.phase === 'ask') updateReturn(dt);
    floatTexts(dt);
    // Camera: follow Jack; during the talk, frame both.
    let at = S.pos.clone();
    if (S.phase !== 'play' && gerdaG.visible) at = S.pos.clone().add(gerdaG.position).multiplyScalar(0.5);
    const want = at.clone().add(new V3(0, S.phase === 'play' ? 64 : 50, S.phase === 'play' ? 90 : 72));
    camera.position.lerp(want, Math.min(1, dt * 3)); camera.lookAt(at.x, 8, at.z);
    renderer.render(scene, camera);
    ui.hud && ui.hud(S, { SIZE_MIN, TIME_LIMIT, patches: patches.filter(p => p.amount <= 0).length, patchTotal: patches.length });
  }
  function resize() { const w = lvlEl.clientWidth || root.innerWidth, h = lvlEl.clientHeight || root.innerHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  root.addEventListener('resize', resize); resize(); camera.position.set(-35, 46, 70);

  return {
    frame, S, shrink, redWord, keys, COST, SIZE_MIN, resize, jack, gerda, hen: S.hen, props, patches,
    lapRef: () => lap, view: n => lap && lap.view(n),
    // For the page and the tests.
    interact, clap, putDown, setHeld,
    debug: { finishAll() { for (const c of CHORES) S.chores[c] = true; S.hen.trust = 100; patches.forEach(p => p.amount = 0); props.grain.visible = props.water.visible = true; }, answer, askHowItWent, beginReturn, buildPlan, startDiscipline },
  };
}

root.Level = { create, COST, SIZE_START, SIZE_MIN, TIME_LIMIT };
})(typeof window !== 'undefined' ? window : globalThis);

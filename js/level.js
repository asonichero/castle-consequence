// Beanstalk — test level: Jack looks after the golden hen. Jack (Day clothes) starts at 75% of his size and must sweep the floor, fill the hen's dish,
// carry water to her trough without spilling it, and win her trust by approaching slowly (move too fast near her and she backs away). He can clap to
// shoo her out of the way, but it costs him size. When Gerda (Work clothes) comes back (on a timer, or when he calls her) she asks how it went and Jack
// can tell the truth or lie. A scripted correction follows, across her lap (js/lap.js), its severity decided by how he really did and whether he lied,
// with Jack at whatever size he has been left at. His size never goes below 50%.
// The room is built for Gerda (everything in it is 1.5 times the size of a thing in the blocky model's own units), so a Jack of 75% feels small in it;
// the camera keeps a fixed distance from him *in his own sizes*, so as he shrinks the room seems to grow. The mouse looks around (drag).
// Jack's size is a fraction of his full size, which is 95% of the model's scale.
(function (root) {
'use strict';
const THREE = root.THREE, B = root.Blocky, Lap = root.Lap;
const V3 = THREE.Vector3;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const turn = (from, to, t) => { let d = ((to - from + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return from + d * t; };   // the short way round

// ── The rules ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const SIZE_START = 0.8, SIZE_MIN = 0.5, FULL = 0.95;
const K = 1.5;                                  // the room's scale: it is a Gerda-sized room
// What makes Jack shrink (fractions of his full size, so 0.05 is five percentage points):
const COST = {
  clap: 0.03,         // clapping to shoo the hen
  lie: 0.05,          // lying to Gerda about how it went
  spill: 0.02,        // each spill of the water he is carrying (every 15 units lost), or dropping the bucket
  startle: 0.01,      // frightening the hen by moving too fast near her (at most once every four seconds)
  unfinished: 0.02,   // each chore still undone when Gerda comes back
  dawdle: 0.02,       // not done by the time she is back on her own (the clock ran out)
  litter: 0.01,       // the broom or the bucket left lying about instead of put back
};
const TIME_LIMIT = 240;                         // seconds before Gerda comes back whether he is ready or not
const WALK = 26, CREEP = 7.5, RUN = 50;                  // speeds, in body-lengths-ish per second (times his scale)
const HEN_ALARM = 13, SPILL_ABOVE = 13, CALM = 9.5;   // faster than this near the hen scares her / slops the water; slower than CALM she warms to him
const R_ = 62;                                  // the room is square: 124 design units each way
const HALL = { x0: -R_ * K, x1: R_ * K, z0: -R_ * K, z1: R_ * K };
const ALARM_RADIUS = 28;                        // the hen only minds his pace within this distance
const D = { rack: [-44, -56], sack: [-50, 46], dish: [20, 20], trough: [36, 20], well: [48, -34], nest: [34, 36], chair: [0, -52] };   // (design coordinates; the world's are K times these)
const SPOT = {}; for (const k in D) SPOT[k] = new V3(D[k][0] * K, 0, D[k][1] * K); SPOT.door = new V3(-(R_ + 2) * K, 0, 0);
const PEN = { x0: 6 * K, x1: 56 * K, z0: 4 * K, z1: 54 * K };
const PATCHES = [[-30, -20], [-10, 10], [5, -25], [-45, 10], [20, -8], [-20, 28]].map(p => [p[0] * K, p[1] * K]);
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

// Packed earth: pale, trodden clay (lighter than the dirt that is swept up).
function earthTexture(repeat) {
  const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
  x.fillStyle = '#b79a72'; x.fillRect(0, 0, 32, 32);
  let s = 7; for (let i = 0; i < 150; i++) { s = (s * 1103515245 + 12345) >>> 0; const v = (s >> 24) & 3; x.fillStyle = ['rgba(255,240,210,0.16)', 'rgba(90,60,30,0.14)', 'rgba(150,120,80,0.2)', 'rgba(60,40,20,0.1)'][v]; x.fillRect((s >> 8) % 32, (s >> 16) % 32, 1 + (v & 1), 1); }
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.encoding = THREE.sRGBEncoding; return t;
}

// The golden hen: a blocky bird facing +z (designed at twice her size on screen; she is scaled to half). Parts are kept so she can peck, flap and settle.
function makeHen() {
  const g = new THREE.Group(), parts = {};
  const gold = 0xe2ab2c, goldHi = 0xf0c64a, goldDk = 0xb8851c, red = 0xc4402c, orange = 0xe08a2a;
  const body = new THREE.Group(); body.position.y = 6.5; g.add(body); parts.body = body;
  box(7, 6, 10, 0, 0, 0, gold, body); box(5, 3, 8, 0, 3.2, -0.3, goldHi, body); box(6, 4, 4, 0, -0.5, 4.8, goldHi, body);
  parts.tail = new THREE.Group(); parts.tail.position.set(0, 2.5, -5); body.add(parts.tail);
  box(1.6, 5, 1.2, 0, 1.5, -1, goldDk, parts.tail); box(1.6, 4, 1.2, -1.8, 1, -0.8, gold, parts.tail); box(1.6, 4, 1.2, 1.8, 1, -0.8, gold, parts.tail);
  parts.wingL = new THREE.Group(); parts.wingL.position.set(3.6, 1.5, 0); body.add(parts.wingL); box(0.9, 4, 7, 0.3, -1, 0, goldDk, parts.wingL);
  parts.wingR = new THREE.Group(); parts.wingR.position.set(-3.6, 1.5, 0); body.add(parts.wingR); box(0.9, 4, 7, -0.3, -1, 0, goldDk, parts.wingR);
  parts.head = new THREE.Group(); parts.head.position.set(0, 3.2, 5.6); body.add(parts.head);
  box(3, 4, 3, 0, 0.8, 0, goldHi, parts.head); box(3.6, 3.4, 3.6, 0, 3.4, 1.2, gold, parts.head);
  box(1.6, 1.2, 2, 0, 3.3, 3.6, orange, parts.head); box(0.6, 1.2, 2.6, 0, 5.6, 1.2, red, parts.head); box(0.8, 1.4, 0.8, 0, 2.2, 3.1, red, parts.head);
  box(0.6, 0.6, 0.3, 1.5, 4, 3.0, 0x1b1410, parts.head); box(0.6, 0.6, 0.3, -1.5, 4, 3.0, 0x1b1410, parts.head);
  for (const sx of [-1.6, 1.6]) { box(0.7, 3.6, 0.7, sx, 1.8, 0.5, orange, g); box(2.2, 0.5, 2.6, sx, 0.25, 1.1, orange, g); }
  g.userData.parts = parts; return g;
}

// A simple walking rig: legs and arms swing from rig.walk = { sw, arm, carry, clap }.
function rigWalk(rig) {
  rig.walk = { sw: 0, arm: 0, carry: 0, clap: 0, sit: false, kick: 0, t: 0 };
  rig.after = r => {
    const w = r.walk;
    if (w.sit) {                                   // seated: legs hang from the seat; a restless Jack swings his shins
      r.legL.knee.rotation.x = r.state.shinX + w.kick * 0.7 * Math.sin(w.t * 7); r.legR.knee.rotation.x = r.state.shinX + w.kick * 0.7 * Math.sin(w.t * 7 + Math.PI);
      r.legL.thigh.rotation.x = r.state.thighX + w.kick * 0.08 * Math.sin(w.t * 7); r.legR.thigh.rotation.x = r.state.thighX - w.kick * 0.08 * Math.sin(w.t * 7);
      return;
    }
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
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1b2230); scene.fog = new THREE.Fog(0x1b2230, 200, 460);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.3, 900);
  scene.add(new THREE.HemisphereLight(0xe8eeff, 0x40362e, 0.8));
  const sun = new THREE.DirectionalLight(0xfff0d8, 0.7); sun.position.set(-60, 160, 100); scene.add(sun);

  // The room is built in its own group at K times scale: a plank floor, a back wall, a side wall with the door (Gerda's way in), a low far wall.
  const room = new THREE.Group(); room.scale.setScalar(K); scene.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * R_, 2 * R_), new THREE.MeshLambertMaterial({ map: earthTexture([14, 14]) })); floor.rotation.x = -Math.PI / 2; room.add(floor);   // packed earth
  const wallMat = new THREE.MeshLambertMaterial({ map: plankTexture('#6e5a46', '#55442f', [8, 3]) });
  const wall = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat); m.position.set(x, y, z); room.add(m); return m; };
  const WH = 42, W = R_ + 1;                                                                        // wall height (design units): over a head taller than Gerda
  const half = (R_ - 9) / 2;
  wall(2 * W, WH, 2, 0, WH / 2, -W);                                                                  // north wall (the chair stands against it)
  wall(2 * W, WH, 2, 0, WH / 2, W);                                                                   // south wall
  wall(2, WH, 2 * half, -W, WH / 2, -9 - half); wall(2, WH, 2 * half, -W, WH / 2, 9 + half); wall(2, WH - 30, 18, -W, 30 + (WH - 30) / 2, 0);   // west wall, with the door
  wall(2, WH, 2 * W, W, WH / 2, 0);                                                                   // east wall
  box(2.6, 30, 2.6, -W, 15, -9, 0x4a3a2a, room); box(2.6, 30, 2.6, -W, 15, 9, 0x4a3a2a, room);
  box(0.4, 30, 16, -W + 0.8, 15, 0, 0xf6e6b0, room);                                                 // the doorway's light
  box(20, 1, 14, D.nest[0], 0.5, D.nest[1], 0xc9a54a, room); box(20, 4, 1, D.nest[0], 2, D.nest[1] - 6.5, 0x7a5a38, room); box(1, 4, 14, D.nest[0] - 10.5, 2, D.nest[1], 0x7a5a38, room);   // the hen's nest

  // Props (design units, so everything is Gerda-sized once the room is scaled).
  const props = {};
  props.rack = new THREE.Group(); props.rack.position.set(D.rack[0], 0, D.rack[1] - 6); room.add(props.rack);
  box(14, 2, 1, 0, 24, -0.5, 0x5a4430, props.rack); box(1, 3, 2, -4, 22, 0.4, 0x5a4430, props.rack); box(1, 3, 2, 4, 22, 0.4, 0x5a4430, props.rack);
  props.broom = new THREE.Group(); box(0.9, 18, 0.9, 0, 9, 0, 0x8a6a40, props.broom); box(3.4, 5, 2.2, 0, 2.5, 0, 0xc9b06a, props.broom); box(3, 1, 2, 0, 5.4, 0, 0x6a5030, props.broom);
  props.rack.add(props.broom); props.broom.position.set(0, 4, 1.6); props.broom.rotation.x = -0.12;            // hung on the rack
  props.sack = new THREE.Group(); props.sack.position.set(D.sack[0], 0, D.sack[1]); room.add(props.sack);
  box(9, 10, 7, 0, 5, 0, 0xc2a678, props.sack); box(7, 2, 5, 0, 10.4, 0, 0xe0c46a, props.sack); box(9.2, 1, 7.2, 0, 8, 0, 0x8a7448, props.sack);
  props.dish = new THREE.Group(); props.dish.position.set(D.dish[0], 0, D.dish[1]); room.add(props.dish);
  box(8, 2, 8, 0, 1, 0, 0x6a4a30, props.dish); box(6, 1, 6, 0, 2, 0, 0x2a1d12, props.dish);
  props.grain = new THREE.Group(); box(5.2, 1.6, 5.2, 0, 3.0, 0, 0xf0c64a, props.grain); box(3.2, 1.2, 3.2, 0, 4.2, 0, 0xf6d868, props.grain); box(1.6, 0.8, 1.6, 0, 5.0, 0, 0xfbe58a, props.grain); props.grain.visible = false; props.dish.add(props.grain);
  props.trough = new THREE.Group(); props.trough.position.set(D.trough[0], 0, D.trough[1]); room.add(props.trough);
  box(14, 3.2, 6, 0, 1.6, 0, 0x6a4a30, props.trough); box(12, 2.4, 4, 0, 3.0, 0, 0x2a1d12, props.trough);
  props.water = box(11.6, 0.7, 3.6, 0, 4.0, 0, 0x6ab8f6, props.trough); props.water.visible = false;           // (its top stands above both rims, so it shows)
  props.well = new THREE.Group(); props.well.position.set(D.well[0], 0, D.well[1]); room.add(props.well);
  for (const [x, z] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) box(3, 7, 3, x, 3.5, z, 0x8a8a90, props.well);
  box(8, 3, 3, 0, 8, -4, 0x8a8a90, props.well); box(8, 3, 3, 0, 8, 4, 0x8a8a90, props.well); box(3, 3, 8, -4, 8, 0, 0x8a8a90, props.well); box(3, 3, 8, 4, 8, 0, 0x8a8a90, props.well);
  box(1.4, 16, 1.4, -5, 8, 0, 0x5a4430, props.well); box(1.4, 16, 1.4, 5, 8, 0, 0x5a4430, props.well); box(12, 1.4, 1.4, 0, 16, 0, 0x5a4430, props.well);
  // The chair against the north wall, facing south: Jack can sit on it.
  props.chair = new THREE.Group(); props.chair.position.set(D.chair[0], 0, D.chair[1]); room.add(props.chair);
  const CH = 11;                                                                                      // seat height (design units)
  box(12, 1.6, 12, 0, CH - 0.8, 0, 0x7a5636, props.chair); box(12, 13, 1.4, 0, CH + 6.5, -5.3, 0x6a4a2e, props.chair);
  for (const [x, z] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) box(1.4, CH - 1.6, 1.4, x, (CH - 1.6) / 2, z, 0x5a3e26, props.chair);
  box(1.4, 7, 1.4, -5.3, CH + 5, -5.3, 0x5a3e26, props.chair); box(1.4, 7, 1.4, 5.3, CH + 5, -5.3, 0x5a3e26, props.chair);
  const makeBucket = () => { const b = new THREE.Group(); box(4.4, 4, 4.4, 0, 2, 0, 0x7a5a38, b); const w = box(3.6, 0.6, 3.6, 0, 3.8, 0, 0x6ab8f6, b); b.userData.water = w; box(0.5, 3, 0.5, 0, 6, 0, 0x4a3a2a, b); return b; };
  const bucket = makeBucket(); bucket.position.set(0, 9.2, 0); props.well.add(bucket);          // sits on the well's rim
  // Where the broom and the bucket belong (as a pose within their parents), so they can be put back.
  const home = { broom: { parent: props.rack, pos: props.broom.position.clone(), rotX: -0.12 }, bucket: { parent: props.well, pos: bucket.position.clone(), rotX: 0 } };

  // Dirt to sweep (world coordinates) and the footprints left in it.
  const patches = PATCHES.map(([x, z]) => {
    const g = new THREE.Group(); g.position.set(x, 0.12, z);
    const d = new THREE.Mesh(new THREE.CircleGeometry(5.2 * K, 12), mat(0x4a3722)); d.rotation.x = -Math.PI / 2; g.add(d);
    for (let i = 0; i < 6; i++) box(2.2, 0.4, 0.7, (i - 2.5) * 2.4, 0.5, ((i * 7) % 5 - 2) * 1.7, 0xc9a54a, g).rotation.y = i;
    scene.add(g); return { g, x, z, amount: 1 };
  });
  const prints = [];                                                                         // { g, x, z, amount, jack }
  const MAX_PRINTS = 90;
  function addPrint(x, z, heading, size, bird, jackMade) {
    const g = new THREE.Group(); g.position.set(x, 0.14, z); g.rotation.y = heading;
    if (bird) { for (const a of [-0.5, 0, 0.5]) { const t = box(0.35 * size, 0.2, 1.6 * size, Math.sin(a) * 0.9 * size, 0, Math.cos(a) * 0.9 * size, 0x3a2a18, g); t.rotation.y = a; } }
    else { box(1.9 * size, 0.2, 4.4 * size, 0, 0, 0, 0x3a2a18, g); box(1.5 * size, 0.2, 1.2 * size, 0, 0, 2.6 * size, 0x3a2a18, g); }
    scene.add(g); prints.push({ g, x, z, amount: 1, jack: jackMade });
    if (prints.length > MAX_PRINTS) { const o = prints.shift(); scene.remove(o.g); }
  }

  // Characters.
  const jack = B.makeJack(); B.paintJackInto(jack.skin, { outfit: 'Day', hitched: false }); jack.tex.needsUpdate = true; rigWalk(jack);
  const jackG = new THREE.Group(); jackG.add(jack.root); scene.add(jackG);
  const gerda = B.makeGerda('Work'); rigWalk(gerda); const gerdaG = new THREE.Group(); gerdaG.add(gerda.root); gerdaG.visible = false; scene.add(gerdaG);
  const hen = makeHen(), henP = hen.userData.parts; hen.scale.setScalar(0.5); scene.add(hen);   // half her old size
  // What Jack carries hangs from his right hand, in a carrier that cancels his own scale so the broom and bucket stay the room's size.
  const carrier = new THREE.Group(); carrier.position.y = -10; jack.armR.add(carrier);
  const carryBroom = new THREE.Group(); carryBroom.visible = false; carrier.add(carryBroom);
  const heldBroom = props.broom.clone(); heldBroom.position.set(0, -9, 3); heldBroom.rotation.set(-0.7, 0, 0); carryBroom.add(heldBroom);
  const carryGrain = new THREE.Group(); carryGrain.visible = false; carrier.add(carryGrain); box(4, 3, 4, 0, -1, 3, 0xf0c64a, carryGrain); box(4.6, 1, 4.6, 0, -2.8, 3, 0x7a5a38, carryGrain);
  const carryBucket = makeBucket(); carryBucket.visible = false; carryBucket.position.set(0, -4, 3.5); carrier.add(carryBucket);
  // Spilled drops.
  const drops = []; const dropGeo = new THREE.BoxGeometry(1, 1, 1), dropMat = mat(0x6ab0f0);

  // ── State ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const S = {
    phase: 'play', t: 0, size: SIZE_START, shownSize: SIZE_START, log: [], floats: [],
    sitting: false, pos: new V3(-40 * K, 0, 6 * K), heading: 0, speedN: 0, creeping: false, phaseWalk: 0, stride: 0, dirt: 0, foot: 1,
    holding: null, water: 0, spillAcc: 0, spillCool: 0, sweeping: false, clapCool: 0,
    items: { broom: { where: 'home', x: 0, z: 0 }, bucket: { where: 'home', x: 0, z: 0 } },
    chores: { sweep: false, dish: false, water: false, trust: false }, dishFilled: false, troughFilled: false,
    counts: { claps: 0, spills: 0, startles: 0, unfinished: 0, dawdle: 0, litter: 0, tracked: 0 }, lie: false, told: null,
    hen: { pos: new V3(30 * K, 0, 24 * K), target: new V3(30 * K, 0, 24 * K), mode: 'wander', timer: 2, trust: 50, startleCool: 0, heading: 0, bob: 0, settled: false, dirt: 0, stride: 0 },
    cam: { yaw: 0, pitch: 0.42 }, shrunk: [], hint: '', msg: '',
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
  const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right', Shift: 'creep', ' ': 'sweep', r: 'run', R: 'run' };
  root.addEventListener('keydown', e => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    const k = KEYMAP[e.key]; if (k) { keys[k] = true; if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault(); }
    if (S.phase !== 'play') return;
    if (e.key === 'e' || e.key === 'E') interact();
    if (e.key === 'c' || e.key === 'C') clap();
    if (e.key === 'q' || e.key === 'Q') putDown();
    if (e.key === 'g' || e.key === 'G') callGerda();
  });
  root.addEventListener('keyup', e => { const k = KEYMAP[e.key]; if (k) keys[k] = false; });
  // The mouse looks around Jack: drag.
  let dragging = null;
  renderer.domElement.addEventListener('pointerdown', e => { dragging = { x: e.clientX, y: e.clientY }; renderer.domElement.setPointerCapture && renderer.domElement.setPointerCapture(e.pointerId); });
  renderer.domElement.addEventListener('pointermove', e => {
    if (!dragging) return;
    S.cam.yaw -= (e.clientX - dragging.x) * 0.006; S.cam.pitch = clamp(S.cam.pitch + (e.clientY - dragging.y) * 0.005, 0.06, 1.3); dragging.x = e.clientX; dragging.y = e.clientY;
  });
  const endDrag = () => { dragging = null; };
  renderer.domElement.addEventListener('pointerup', endDrag); renderer.domElement.addEventListener('pointercancel', endDrag);

  // ── Doing things ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const near = (p, r) => S.pos.distanceTo(p) < (r || 13);
  const itemPos = n => { const it = S.items[n]; return it.where === 'floor' ? new V3(it.x, 0, it.z) : n === 'broom' ? SPOT.rack : SPOT.well; };
  function setHeld(what) {
    S.holding = what; carryBroom.visible = what === 'broom'; carryGrain.visible = what === 'grain'; carryBucket.visible = what === 'bucket';
    props.broom.visible = what !== 'broom'; bucket.visible = what !== 'bucket';
  }
  // Putting an item down: back where it belongs, or in place on the floor where Jack stands.
  function placeItem(name, where) {
    const it = S.items[name], obj = name === 'broom' ? props.broom : bucket;
    if (where === 'home') { const h = home[name]; h.parent.add(obj); obj.position.copy(h.pos); obj.rotation.set(h.rotX, 0, 0); it.where = 'home'; }
    else {
      room.add(obj); const x = S.pos.x + Math.sin(S.heading) * 9, z = S.pos.z + Math.cos(S.heading) * 9; it.x = x; it.z = z; it.where = 'floor';
      obj.position.set(x / K, name === 'broom' ? 1.2 : 0, z / K); obj.rotation.set(name === 'broom' ? -1.45 : 0, S.heading, name === 'bucket' ? 1.45 : 0);   // a broom lies flat; a bucket lies on its side
    }
    obj.visible = true;
  }
  const CHAIR_SEAT = 11 * K, SEAT_Z = SPOT.chair.z - 1.5 * K;
  function sitDown() {
    if (S.holding) { note('Put what you are carrying down first (Q).'); return; }
    S.sitting = true; S.pos.set(SPOT.chair.x, 0, SEAT_Z); S.heading = 0; S.speedN = 0; note('You sit on the chair.');
  }
  function standUp() { S.sitting = false; S.pos.set(SPOT.chair.x, 0, SPOT.chair.z + 11 * K); }
  function interact() {
    if (S.phase !== 'play') return;
    if (S.sitting) { standUp(); return; }
    if (near(SPOT.chair, 13 * K)) { sitDown(); return; }
    // Things lying on the floor can be picked up again.
    for (const n of ['broom', 'bucket']) if (S.items[n].where === 'floor' && near(itemPos(n), 12) && !S.holding) {
      setHeld(n); S.water = 0; note(n === 'broom' ? 'You pick the broom up.' : 'You pick the bucket up (it is empty: fill it at the well).'); return;
    }
    if (near(SPOT.rack)) { if (!S.holding && S.items.broom.where === 'home') { setHeld('broom'); note('You take the broom. Hold Space to sweep.'); } else if (S.holding === 'broom') { setHeld(null); placeItem('broom', 'home'); note('You hang the broom back up.', 'good'); } else note(S.holding ? 'Your hands are full.' : 'The broom is not here.'); return; }
    if (near(SPOT.sack)) { if (!S.holding) { setHeld('grain'); note('You scoop up some grain.'); } else if (S.holding === 'grain') { setHeld(null); note('You tip the grain back.'); } else note('Your hands are full.'); return; }
    if (near(SPOT.dish, 14)) {
      if (S.holding !== 'grain') { note(S.dishFilled ? 'The dish is full.' : 'You need grain for the dish.'); return; }
      if (S.hen.pos.distanceTo(SPOT.dish) < 10) { note('The hen is standing in the dish. (Clap to shoo her, if you must.)'); return; }
      S.dishFilled = true; S.chores.dish = true; props.grain.visible = true; setHeld(null); note('You fill her dish with grain. ✔', 'good'); return;
    }
    if (near(SPOT.well, 14)) {
      if (!S.holding && S.items.bucket.where === 'home') { setHeld('bucket'); S.water = 100; S.spillAcc = 0; note('You fill the bucket. Creep (hold Shift) so it does not slop.'); }
      else if (S.holding === 'bucket') { setHeld(null); S.water = 0; placeItem('bucket', 'home'); note('You set the bucket back on the well.', 'good'); }
      else note(S.holding ? 'Your hands are full.' : 'The bucket is not here.'); return;
    }
    if (near(SPOT.trough, 14)) {
      if (S.holding !== 'bucket') { note(S.troughFilled ? 'The trough is full.' : 'You need the water bucket.'); return; }
      if (S.water < 50) { note('Too little left in the bucket: go and fill it again.'); return; }
      S.troughFilled = true; S.chores.water = true; props.water.visible = true;
      note(S.counts.spills ? 'You pour the water in. ✔ (you did spill some on the way)' : 'You pour the water in without a drop lost. ✔', 'good'); S.water = 0; return;   // (the empty bucket stays in his hand)
    }
    if (S.hen.pos.distanceTo(S.pos) < 14) {
      if (S.hen.trust >= 100 && !S.chores.trust) { S.chores.trust = true; S.hen.settled = true; note('The golden hen lets you stroke her. She trusts you. ✔', 'good'); }
      else if (!S.chores.trust) note('She is not ready to be touched. Approach slowly and wait.');
      return;
    }
    note('Nothing to do here.');
  }
  // Q: drop what he holds, where he stands. A dropped bucket spills; the grain is lost.
  function putDown() {
    if (!S.holding) return;
    const what = S.holding;
    if (what === 'bucket' && S.water > 0) { note('You drop the bucket and the water goes everywhere!', 'bad'); spillDrops(Math.ceil(S.water / 8)); S.counts.spills++; shrink(COST.spill, 'Dropping the water'); }
    setHeld(null); S.water = 0;
    if (what === 'broom' || what === 'bucket') { placeItem(what, 'floor'); note(`You drop the ${what} here.`); } else note('You let the grain fall.');
  }
  function clap() {
    if (S.clapCool > 0) return;
    S.clapCool = 1.2; jack.walk.clap = 0.0001; S.counts.claps++;
    note('CLAP!');
    if (S.hen.pos.distanceTo(S.pos) < 60) { fleeFrom(S.pos); S.hen.trust = Math.max(0, S.hen.trust - 25); S.hen.settled = false; S.chores.trust = false; }
    shrink(COST.clap, 'Clapping at the hen');
  }
  function callGerda() { if (S.phase !== 'play') return; note('You call for Gerda.'); beginReturn(false, true); }
  function spillDrops(n) { for (let i = 0; i < n; i++) { const m = new THREE.Mesh(dropGeo, dropMat); m.position.copy(S.pos).add(new V3(0, 8, 0)); scene.add(m); drops.push({ m, v: new V3((Math.random() - 0.5) * 12, 8 + Math.random() * 8, (Math.random() - 0.5) * 12), life: 1.2 }); } }

  // ── The hen ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  function penPoint() { return new V3(lerp(PEN.x0, PEN.x1, Math.random()), 0, lerp(PEN.z0, PEN.z1, Math.random())); }
  function fleeFrom(from) {
    const h = S.hen, away = h.pos.clone().sub(from); away.y = 0; if (away.lengthSq() < 0.01) away.set(1, 0, 0.3); away.normalize();
    let t = h.pos.clone().addScaledVector(away, 34); t.x = clamp(t.x, PEN.x0, PEN.x1); t.z = clamp(t.z, PEN.z0, PEN.z1);
    if (t.distanceTo(h.pos) < 10) t = penPoint();
    h.target = t; h.mode = 'flee'; h.settled = false;
  }
  function updateHen(dt) {
    const h = S.hen, d = h.pos.distanceTo(S.pos), before = h.pos.clone(); h.startleCool = Math.max(0, h.startleCool - dt);
    if (d < ALARM_RADIUS && S.speedN > HEN_ALARM && h.mode !== 'flee') {                            // too fast, too close: she backs away
      fleeFrom(S.pos); h.trust = Math.max(0, h.trust - 14);
      if (h.startleCool <= 0) { h.startleCool = 4; S.counts.startles++; note('You moved too fast: the hen backs away.', 'bad'); shrink(COST.startle, 'Startling the hen'); }
    }
    if (d < 16 && S.speedN < CALM && h.mode !== 'flee' && !S.chores.trust) h.trust = Math.min(100, h.trust + (S.speedN < 1 ? 16 : 10) * dt);   // slow and close: she warms to you
    if (S.chores.trust || h.settled) {
      h.settled = true; h.mode = 'settled';
      const to = S.pos.clone().add(new V3(Math.sin(S.heading) * 13, 0, Math.cos(S.heading) * 13)), dd = to.distanceTo(h.pos); if (dd > 3) h.pos.addScaledVector(to.sub(h.pos).normalize(), Math.min(dd, 12 * dt));
    } else if (h.mode === 'flee') { const dd = h.target.distanceTo(h.pos); if (dd < 1) { h.mode = 'wander'; h.timer = 2; } else h.pos.addScaledVector(h.target.clone().sub(h.pos).normalize(), Math.min(dd, 34 * dt)); }
    else {
      h.timer -= dt; const dd = h.target.distanceTo(h.pos);
      if (dd > 1) h.pos.addScaledVector(h.target.clone().sub(h.pos).normalize(), Math.min(dd, 7 * dt));
      if (h.timer <= 0) { h.timer = 3 + Math.random() * 4; h.target = Math.random() < 0.35 ? SPOT.dish.clone().add(new V3(-7, 0, -6)) : penPoint(); }
    }
    h.pos.x = clamp(h.pos.x, HALL.x0 + 5, HALL.x1 - 5); h.pos.z = clamp(h.pos.z, HALL.z0 + 5, HALL.z1 - 5);
    // Dirt on her feet: the hen tracks it too.
    for (const p of patches) if (p.amount > 0.2 && Math.hypot(p.x - h.pos.x, p.z - h.pos.z) < 5 * K) h.dirt = 4;
    h.stride += before.distanceTo(h.pos); if (h.dirt > 0 && h.stride > 3.6) { h.stride = 0; h.dirt--; addPrint(h.pos.x + (Math.random() - 0.5) * 1.5, h.pos.z + (Math.random() - 0.5) * 1.5, h.heading, 0.7, true, false); }
    const look = h.mode === 'settled' ? S.pos.clone().sub(h.pos) : h.target.clone().sub(h.pos); if (look.lengthSq() > 0.5) h.heading = Math.atan2(look.x, look.z);
    hen.position.copy(h.pos); hen.rotation.y = turn(hen.rotation.y, h.heading, Math.min(1, dt * 8)); h.bob += dt * (h.mode === 'flee' ? 18 : h.mode === 'settled' ? 2 : 5);
    const flee = h.mode === 'flee';
    henP.head.rotation.x = flee ? -0.2 : 0.35 * Math.max(0, Math.sin(h.bob)) * (h.mode === 'settled' ? 0.2 : 1);
    henP.wingL.rotation.z = flee ? 0.9 + 0.5 * Math.sin(h.bob * 2) : 0.05; henP.wingR.rotation.z = -henP.wingL.rotation.z; henP.body.position.y = 6.5 + (flee ? 0.8 * Math.abs(Math.sin(h.bob)) : 0) - (h.mode === 'settled' ? 1 : 0);
    henP.tail.rotation.x = flee ? -0.6 : 0.1;
  }

  // ── Per-frame play ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const sweepDone = () => patches.every(p => p.amount <= 0) && prints.every(p => p.amount <= 0);
  function updatePlay(dt) {
    S.t += dt; S.clapCool = Math.max(0, S.clapCool - dt); S.spillCool = Math.max(0, S.spillCool - dt);
    const scale = S.shownSize * FULL;
    // Movement, relative to where the camera looks. Hold Shift to creep.
    const f = new V3(-Math.sin(S.cam.yaw), 0, -Math.cos(S.cam.yaw)), r = new V3(Math.cos(S.cam.yaw), 0, -Math.sin(S.cam.yaw));
    const dir = new V3().addScaledVector(f, (keys.up ? 1 : 0) - (keys.down ? 1 : 0)).addScaledVector(r, (keys.right ? 1 : 0) - (keys.left ? 1 : 0)); S.creeping = !!keys.creep && !S.sitting;
    if (S.sitting && dir.lengthSq() > 0) standUp();
    const vel = !S.sitting && dir.lengthSq() > 0 ? dir.normalize().multiplyScalar((S.creeping ? CREEP : keys.run ? RUN : WALK) * scale) : new V3();
    const before = S.pos.clone(); S.pos.addScaledVector(vel, dt);
    { const c = SPOT.chair, dx = S.pos.x - c.x, dz = S.pos.z - c.z; if (!S.sitting && Math.abs(dx) < 9 * K && Math.abs(dz) < 8 * K) { if (Math.abs(dx) / (9 * K) > Math.abs(dz) / (8 * K)) S.pos.x = c.x + Math.sign(dx || 1) * 9 * K; else S.pos.z = c.z + Math.sign(dz || 1) * 8 * K; } }   // the chair is solid
    for (const [p, rad] of [[SPOT.well, 11 * K], [SPOT.sack, 7 * K], [SPOT.trough, 9 * K]]) { const dd = S.pos.clone().sub(p); dd.y = 0; if (dd.length() < rad) S.pos.copy(p).addScaledVector(dd.normalize(), rad); }
    S.pos.x = clamp(S.pos.x, HALL.x0 + 6, HALL.x1 - 6); S.pos.z = clamp(S.pos.z, HALL.z0 + 6, HALL.z1 - 6);
    S.speedN = vel.length() / scale;
    if (vel.lengthSq() > 0.01) S.heading = Math.atan2(vel.x, vel.z);
    // Dirt on his feet: footprints across the clean floor.
    for (const p of patches) if (p.amount > 0.2 && Math.hypot(p.x - S.pos.x, p.z - S.pos.z) < 5.2 * K) S.dirt = 7;
    S.stride += before.distanceTo(S.pos);
    if (S.dirt > 0 && S.stride > 4.4 * scale) {
      S.stride = 0; S.dirt--; S.foot = -S.foot; S.counts.tracked++;
      const side = new V3(Math.cos(S.heading), 0, -Math.sin(S.heading)).multiplyScalar(1.6 * scale * S.foot);
      addPrint(S.pos.x + side.x, S.pos.z + side.z, S.heading, scale * 1.1, false, true); S.chores.sweep = false;
    }
    // The water.
    if (S.holding === 'bucket' && S.speedN > SPILL_ABOVE) {
      const loss = (S.speedN - SPILL_ABOVE) * 4.5 * dt; S.water = Math.max(0, S.water - loss); S.spillAcc += loss; if (Math.random() < 0.4) spillDrops(1);
      if (S.spillAcc >= 15 && S.spillCool <= 0) { S.spillAcc -= 15; S.spillCool = 1.5; S.counts.spills++; note('Water slops over the rim!', 'bad'); shrink(COST.spill, 'Spilling the water'); }
    }
    // Sweeping: Space with the broom (patches and footprints alike).
    S.sweeping = !!(keys.sweep && S.holding === 'broom');
    if (S.sweeping) {
      const front = S.pos.clone().add(new V3(Math.sin(S.heading), 0, Math.cos(S.heading)).multiplyScalar(11));
      for (const p of patches) if (p.amount > 0 && Math.hypot(p.x - front.x, p.z - front.z) < 11) p.amount = Math.max(0, p.amount - dt / 1.1);
      for (const p of prints) if (p.amount > 0 && Math.hypot(p.x - front.x, p.z - front.z) < 10) p.amount = Math.max(0, p.amount - dt / 0.5);
      if (!S.chores.sweep && sweepDone()) { S.chores.sweep = true; note('The floor is swept clean. ✔', 'good'); }
    }
    for (const p of patches) { p.g.visible = p.amount > 0.02; p.g.scale.setScalar(0.4 + 0.6 * p.amount); }
    for (const p of prints) p.g.visible = p.amount > 0.05;
    updateHen(dt);
    // Hints.
    S.hint = '';
    const floorItem = ['broom', 'bucket'].find(n => S.items[n].where === 'floor' && near(itemPos(n), 12));
    if (S.sitting) S.hint = 'E or move: stand up';
    else if (floorItem && !S.holding) S.hint = `E: pick up the ${floorItem}`;
    else if (near(SPOT.chair, 13 * K) && !S.holding) S.hint = 'E: sit on the chair';
    else if (near(SPOT.rack)) S.hint = S.holding === 'broom' ? 'E: hang up the broom' : S.holding ? '' : S.items.broom.where === 'home' ? 'E: take the broom' : '';
    else if (near(SPOT.sack)) S.hint = S.holding === 'grain' ? 'E: put the grain back' : S.holding ? '' : 'E: scoop grain';
    else if (near(SPOT.dish, 14)) S.hint = S.holding === 'grain' ? 'E: fill the dish' : '';
    else if (near(SPOT.well, 14)) S.hint = S.holding === 'bucket' ? 'E: put the bucket back' : S.holding ? '' : S.items.bucket.where === 'home' ? 'E: fill the bucket' : '';
    else if (near(SPOT.trough, 14)) S.hint = S.holding === 'bucket' ? 'E: pour the water in' : '';
    else if (S.hen.pos.distanceTo(S.pos) < 14 && S.hen.trust >= 100 && !S.chores.trust) S.hint = 'E: stroke the hen';
    // End of the job: when everything is done (and tidy), or the clock runs out.
    const done = CHORES.every(c => S.chores[c]);
    if (done && !S.doneAt) { S.doneAt = S.t; note('All done. Gerda will be back any moment… (or call her with G)'); }
    if ((S.doneAt && S.t - S.doneAt > 4) || S.t > TIME_LIMIT) beginReturn(S.t > TIME_LIMIT && !done, false);
  }

  // ── Characters on screen ───────────────────────────────────────────────────────────────────────────────────────────────────────────
  function poseJack(dt) {
    S.shownSize += (S.size - S.shownSize) * Math.min(1, dt * 5); const sc = S.shownSize * FULL;
    jackG.position.copy(S.pos); if (S.sitting) { jackG.position.y = CHAIR_SEAT - 4 * sc; jackG.position.z = SPOT.chair.z + 6 * K - 1.5 - 6 * sc; }   // knees at the seat's front edge, shins hanging free jack.root.scale.setScalar(sc); jack.root.rotation.y = turn(jack.root.rotation.y, S.heading, Math.min(1, dt * 12));
    carrier.scale.setScalar(K / sc);                                                       // (the broom and bucket stay the room's size)
    const patient = clamp((S.size - 0.5) / 0.45, 0, 1);                                      // 95%+ is fully patient, 50% kicks his feet playfully
    if (S.sitting !== !!jack.walk.sit) { B.setPose(jack, S.sitting ? 'sit' : 'stand'); jack.walk.sit = S.sitting; }
    jack.walk.kick = S.sitting ? (1 - patient) * 0.9 : 0; jack.walk.t += dt * (1.6 - 0.6 * patient);
    const moving = S.speedN > 0.5; S.phaseWalk += dt * (S.speedN * 0.42);
    jack.walk.sw = moving ? Math.sin(S.phaseWalk) * 0.65 : 0; jack.walk.arm = moving ? Math.sin(S.phaseWalk) * 0.55 : 0;
    jack.walk.carry = lerp(jack.walk.carry, S.holding === 'bucket' || S.holding === 'grain' ? 1 : S.holding === 'broom' ? 0.8 : 0, Math.min(1, dt * 8));
    if (S.sweeping) { jack.walk.arm = 0; carryBroom.rotation.z = Math.sin(S.t * 14) * 0.35; } else carryBroom.rotation.z = 0;
    if (jack.walk.clap > 0) { jack.walk.clap += dt; if (jack.walk.clap > 0.45) jack.walk.clap = 0; }
    if (S.holding === 'bucket') { const w = carryBucket.userData.water; w.scale.y = Math.max(0.01, S.water / 100); w.visible = S.water > 2; }
    B.step(jack, dt);
  }
  function floatTexts(dt) {
    for (const f of S.floats) f.t += dt; S.floats = S.floats.filter(f => f.t < 1.6); ui.floats && ui.floats(S.floats, camera, jackG.position, S.shownSize * FULL);
    for (const d of drops) { d.life -= dt; d.v.y -= 40 * dt; d.m.position.addScaledVector(d.v, dt); if (d.m.position.y < 0.5) { d.m.position.y = 0.5; d.v.set(0, 0, 0); } if (d.life <= 0) scene.remove(d.m); }
    for (let i = drops.length - 1; i >= 0; i--) if (drops[i].life <= 0) drops.splice(i, 1);
  }

  // ── Gerda comes back ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
  let gerdaAt = null;
  function beginReturn(clockRanOut, called) {
    if (S.phase !== 'play') return;
    if (S.sitting) standUp();
    S.phase = 'return'; S.sweeping = false; S.speedN = 0;
    if (S.holding === 'broom' || S.holding === 'bucket') { const w = S.holding; setHeld(null); S.water = 0; placeItem(w, 'floor'); } else setHeld(null);   // whatever he holds is set down where he stands
    for (const c of CHORES) if (!S.chores[c]) S.counts.unfinished++;
    if (S.counts.unfinished) shrink(COST.unfinished * S.counts.unfinished, `${S.counts.unfinished} chore${S.counts.unfinished > 1 ? 's' : ''} left undone`);
    S.counts.litter = ['broom', 'bucket'].filter(n => S.items[n].where !== 'home').length;
    if (S.counts.litter) shrink(COST.litter * S.counts.litter, S.counts.litter > 1 ? 'The broom and bucket left lying about' : 'Something left lying about');
    if (clockRanOut) { S.counts.dawdle = 1; shrink(COST.dawdle, 'Taking too long'); }
    S.called = !!called; gerdaG.visible = true; gerdaG.position.copy(SPOT.door); gerdaG.position.x = -R_ * K; gerdaAt = 'walking';
  }
  function updateReturn(dt) {
    S.t += dt;
    // Gerda walks in to meet Jack; Jack turns to face her.
    const target = new V3(S.pos.x - 22, 0, S.pos.z); target.x = Math.max(target.x, -(R_ - 4) * K);
    if (gerdaAt === 'walking') {
      const d = target.clone().sub(gerdaG.position); d.y = 0;
      if (d.length() > 2) { gerdaG.position.addScaledVector(d.normalize(), Math.min(d.length(), 22 * dt)); gerda.root.rotation.y = turn(gerda.root.rotation.y, Math.atan2(d.x, d.z), 0.3); gerda.walk.sw = Math.sin(S.t * 8) * 0.5; gerda.walk.arm = Math.sin(S.t * 8) * 0.4; }
      else { gerdaAt = 'here'; gerda.walk.sw = 0; gerda.walk.arm = 0; S.heading = Math.atan2(gerdaG.position.x - S.pos.x, gerdaG.position.z - S.pos.z); gerda.root.rotation.y = Math.atan2(S.pos.x - gerdaG.position.x, S.pos.z - gerdaG.position.z); askHowItWent(); }
    }
    updateHen(dt); poseJack(dt); B.step(gerda, dt);
  }
  const reasons = () => {
    const c = S.counts, r = [];
    if (c.spills) r.push(c.spills > 1 ? 'spilled the water more than once' : 'spilled the water');
    if (c.startles) r.push('frightened my hen');
    if (c.claps) r.push('clapped at her to shoo her');
    if (c.tracked >= 6) r.push('tracked mud across my floor');
    if (c.litter) r.push('left things lying about');
    if (c.unfinished) r.push('left ' + (c.unfinished > 1 ? 'chores' : 'a chore') + ' undone');
    if (c.dawdle) r.push('dawdled');
    return r;
  };
  const perfect = () => !reasons().length;
  const list = r => r.length <= 1 ? r.join('') : r.slice(0, -1).join(', ') + ' and ' + r[r.length - 1];
  function askHowItWent() {
    S.phase = 'ask';
    ui.dialog({ who: 'Gerda', text: S.called ? 'You called? Well, I am here. How did it go with the hen?' : 'There you are. So — how did it go with the hen?', choices: [
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
  function demerits() { const c = S.counts; return c.unfinished * 2 + c.spills * 1.5 + c.startles * 0.5 + c.claps * 1 + c.dawdle * 1 + c.litter * 0.5 + (c.tracked >= 6 ? 1 : 0); }
  function buildPlan() {
    const d = demerits(); let tier = d < 0.5 ? 0 : d < 4 ? 1 : d < 8 ? 2 : 3; if (S.lie) tier = Math.min(3, tier + 1);
    const TIERS = [
      { name: 'Token', hand: 6, paddle: 0, strength: 0.7, pace: 1.0, verdict: 'No complaints really — “a few for luck, then.”' },
      { name: 'Light', hand: 14, paddle: 0, strength: 0.85, pace: 1.1, verdict: '“A light correction, I think.”' },
      { name: 'Firm', hand: 26, paddle: 0, strength: 1.0, pace: 1.2, verdict: '“A firm one. Come along.”' },
      { name: 'Severe', hand: 16, paddle: 16, strength: 1.1, pace: 1.3, verdict: '“I think the paddle, this time.”' },
    ];
    return Object.assign({ tier, demerits: d, reasons: reasons(), lie: S.lie }, TIERS[tier]);
  }

  // ── The scripted correction ────────────────────────────────────────────────────────────────────────────────────────────────────────
  let lap = null, steps = [], stepAt = 0, stepWait = 0, planNow = null;
  function startDiscipline(plan) {
    planNow = plan; S.phase = 'discipline'; S.floats = []; ui.floats && ui.floats([], camera, jackG.position, 1);
    lvlEl.style.display = 'none'; lapEl.style.display = 'block'; ui.discipline(true, plan);
    if (!lap) { lap = Lap.create(lapEl); lap.on((type) => { if (type === 'tooharsh') say('Gerda', 'That is quite enough.'); }); }
    carryIntoLap();
    lap.reset(); lap.st.sound = true; lap.outfit('gerda', 'Work'); lap.outfit('jack', 'Day'); lap.size(S.size);
    lap.layers({ trousers: 'up', drawers: 'up' }); lap.implement('hand'); lap.st.side = 'alt';
    // A smaller Jack feels the same hand more: strength grows as he shrinks.
    lap.st.strength = clamp(plan.strength * (1 + 0.8 * (1 - S.size)), 0.5, 1.5); lap.st.pace = plan.pace; lap.view('overview');
    steps = scriptFor(plan); stepAt = 0; stepWait = 0.5;
  }
  // The correction happens in the middle of the room, exactly as Jack left it: the room, the dirt and footprints, any broom or bucket left lying
  // about, and the hen settled in her nest, all move into the lap scene (whose own floor is hidden).
  function carryIntoLap() {
    const sc = lap.scene; lap.floor.visible = false; sc.background = new THREE.Color(0x1b2230); sc.fog = new THREE.Fog(0x1b2230, 240, 560);
    const world = new THREE.Group(); world.position.y = lap.floor.position.y; sc.add(world);   // the room's floor is the lowered floor, under the chair's legs
    world.add(room); patches.forEach(p => world.add(p.g)); prints.forEach(p => world.add(p.g)); drops.forEach(d => world.add(d.m));
    const n = SPOT.nest; hen.position.set(n.x, 1 * K, n.z); hen.rotation.y = Math.atan2(-n.x, -n.z); world.add(hen);
    henP.head.rotation.x = 0.1; henP.wingL.rotation.z = 0.05; henP.wingR.rotation.z = -0.05; henP.body.position.y = 5.5; henP.tail.rotation.x = 0.1;
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
      st.push({ idle: true }, { do: () => { lap.implement('paddle'); lap.layers({ trousers: 'down', drawers: 'down' }); }, wait: 400 }, sayStep('Gerda', 'The paddle for the rest.', 2200));
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
    if (s.idle) { if (!lap.st.swing) stepAt++; return; }
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
    // Camera: locked at a fixed distance *in Jack's own sizes* (so as he shrinks the room seems to grow), looking where the mouse points. During the
    // talk it takes in Gerda as well.
    const sc = S.shownSize * FULL, talk = S.phase !== 'play' && gerdaG.visible;
    const at = talk ? S.pos.clone().add(gerdaG.position).multiplyScalar(0.5) : S.pos.clone();
    const dist = 78 * sc + (talk ? S.pos.distanceTo(gerdaG.position) * 1.1 : 0), lookH = (S.sitting ? CHAIR_SEAT * 0.8 + 12 * sc : 17 * sc) + (talk ? 8 : 0);
    const cp = Math.cos(S.cam.pitch), sp = Math.sin(S.cam.pitch);
    const want = new V3(at.x + Math.sin(S.cam.yaw) * cp * dist, lookH + sp * dist, at.z + Math.cos(S.cam.yaw) * cp * dist);
    want.x = clamp(want.x, HALL.x0 + 2, HALL.x1 - 2); want.z = clamp(want.z, HALL.z0 + 2, HALL.z1 - 2); want.y = clamp(want.y, 2, 150);
    camera.position.lerp(want, Math.min(1, dt * 10)); camera.lookAt(at.x, lookH, at.z);
    renderer.render(scene, camera);
    ui.hud && ui.hud(S, { SIZE_MIN, TIME_LIMIT, patches: patches.filter(p => p.amount <= 0).length, patchTotal: patches.length, prints: prints.filter(p => p.amount > 0.05).length });
  }
  function resize() { const w = lvlEl.clientWidth || root.innerWidth, h = lvlEl.clientHeight || root.innerHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  root.addEventListener('resize', resize); resize(); camera.position.set(S.pos.x, 40, S.pos.z + 60);

  return {
    frame, S, shrink, redWord, keys, COST, SIZE_MIN, resize, jack, gerda, hen: S.hen, props, patches, prints,
    lapRef: () => lap, view: n => lap && lap.view(n),
    interact, clap, putDown, setHeld, callGerda,
    debug: { finishAll() { for (const c of CHORES) S.chores[c] = true; S.hen.trust = 100; patches.forEach(p => p.amount = 0); props.grain.visible = props.water.visible = true; }, answer, askHowItWent, beginReturn, buildPlan, startDiscipline },
  };
}

root.Level = { create, COST, SIZE_START, SIZE_MIN, TIME_LIMIT };
})(typeof window !== 'undefined' ? window : globalThis);

// Beanstalk — Across the Lap. Gerda (the Giantess) is the giver and Jack the subject, in the blocky style of js/blocky.js; this is the one
// discipline scene kept from Birchwood House, with its mechanics: the engine's pain model (Starlight.createPain) turns each smack
// (implement, strength, pace, the wait with the hand raised, the clothing over the skin, how tender the skin already is) into Jack's
// distress, whose bands drive his reaction and face; the rear colours up with the smacks; trousers and drawers come up and down; and the
// safe word ("Red") stops everything at once.
// Everything is in skin pixels (1 unit = 1 pixel, a standing figure is 32 tall). Gerda sits on the chair facing +z; Jack lies face down
// across her lap, hips over her right knee, head hanging off her left side, hands toward the floor.
(function (root) {
'use strict';
const THREE = root.THREE, B = root.Blocky, S = root.Starlight;
const V3 = THREE.Vector3, UP = new V3(0, 1, 0), DOWN = new V3(0, -1, 0);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const srgb = hex => new THREE.Color(hex).convertSRGBToLinear();

// Where everything is. P is Jack's hip joint; PITCH tips him head-down so his upper body leans toward the floor.
const P = new V3(-6, 10, 6.5), PITCH = -0.05;   // hip joint: his torso's centre (6 up from it) is over the centre of her thighs (x 0, z 3)
const JACK_FULL = 0.95;        // Jack's full size (100%) as a fraction of the model's own scale: he is a little smaller than the model he is built as
const HOVER = 1.4;            // at rest the hand or paddle hovers this far above the centre of his lower back (the contact pose, lifted)
const TIMES = { lift: 0.45, hold: 0.15, strike: 0.09, contact: 0.32, back: 0.3 };
// Implements: the hand lands with the end of Gerda's arm block, on the middle of his rear. The paddle is a small rounded blade held out from the
// right-hand face of her arm block (the side toward his head in the top view) with its face down, so it lies across one cheek at a time.
// mark is the engine's weight toward the colour at the contact site; weight/sting live in the engine's PAIN.implement.
const IMPL = {
  hand:   { name: 'Hand',   mark: 1,     paddle: false },
  paddle: { name: 'Paddle', mark: 8 / 3, paddle: true },
};
const LEAN = -0.75;              // how far back she sits (fixed)
const BANDS = ['composed', 'flinching', 'struggling', 'close to the edge of resistance', 'past the edge of resistance: most receptive', 'too harsh'];

function create(view, opts) {
  opts = opts || {};
  // ── Stage ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.setPixelRatio(Math.min(2, root.devicePixelRatio || 1));
  view.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x14181f); scene.fog = new THREE.Fog(0x14181f, 140, 300);
  const camera = new THREE.PerspectiveCamera(36, 1, 1, 600);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.minDistance = 12; controls.maxDistance = 160; controls.maxPolarAngle = Math.PI * 0.495;
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x30283a, 0.62));
  const sun = new THREE.DirectionalLight(0xfff0d8, 0.62); sun.position.set(40, 80, 60); scene.add(sun);
  const fc = document.createElement('canvas'); fc.width = fc.height = 32; const fx = fc.getContext('2d');
  fx.fillStyle = '#3a3f4a'; fx.fillRect(0, 0, 32, 32); fx.fillStyle = '#343944'; fx.fillRect(0, 0, 16, 16); fx.fillRect(16, 16, 16, 16);
  fx.fillStyle = '#2a2e38'; fx.fillRect(0, 15, 32, 1); fx.fillRect(15, 0, 1, 32);
  const ft = new THREE.CanvasTexture(fc); ft.magFilter = THREE.NearestFilter; ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(16, 16); ft.encoding = THREE.sRGBEncoding;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(256, 256), new THREE.MeshLambertMaterial({ map: ft })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  // The chair: a plank seat (top at y = 4, where Gerda's thighs rest) and a straight back.
  const LEGH = B.CHAIR.legH; scene.add(B.makeChair());   // (the same chair stands in the level's room; a floor lowered to meet its legs, and Gerda's shins lengthened by the same amount)
  floor.position.y = -LEGH;

  // ── The cast ────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const gerda = B.makeGerda(), jack = B.makeJack();
  scene.add(gerda.root);
  const frame = new THREE.Group(); frame.add(jack.root); scene.add(frame);
  // Jack's frame: local +y (his head) runs along world +x, his front faces down, then the whole body is tipped head-down by PITCH.
  const qx = new THREE.Quaternion().setFromAxisAngle(new V3(1, 0, 0), Math.PI / 2), qy = new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), Math.PI / 2);
  const qz = new THREE.Quaternion().setFromAxisAngle(new V3(0, 0, 1), PITCH);
  frame.quaternion.copy(qz).multiply(qy).multiply(qx);
  for (const l of [gerda.legL, gerda.legR]) { const sh = l.knee.children[0]; sh.scale.y = (6 + LEGH) / 6; sh.position.y = -3 * sh.scale.y; }
  B.setPose(gerda, 'sit'); Object.assign(gerda.state, B.POSES.sit);
  Object.assign(jack.state, { hipY: 0, lift: 0 }); Object.assign(jack.target, { hipY: 0, lift: 0 });
  // The glutes block hangs from a hinge at its top edge, which lies in the plane of his back (just proud of it) at the bottom edge of the torso, and
  // tips forward from there part-way toward the angle of his thighs (which fold forward at the hip), bridging his back and his thighs. It
  // takes the look of the trousers, drawers or bare skin.
  const glutes = B.makeGlutes(), glutesTilt = new THREE.Group();
  glutesTilt.position.set(0, 0.6, -2.55); glutesTilt.rotation.x = -0.45;
  glutes.mesh.scale.set(1.1, 1.2, 1.2); glutes.mesh.position.set(0, -2.6, 2.58);   // back face in the hinge's plane, top face at the hinge
  glutesTilt.add(glutes.mesh); jack.hips.add(glutesTilt);
  // Where the hand lands: points on the back of Jack's hips (his left cheek is the nearer, world −z side), and the middle of his back.
  const mk = (x, y, z, parent) => { const o = new THREE.Object3D(); o.position.set(x, y, z); (parent || jack.torso).add(o); return o; };
  const rear = { L: mk(2, -2.4, -0.05, glutesTilt), R: mk(-2, -2.4, -0.05, glutesTilt), C: mk(0, -2.4, -0.05, glutesTilt) }, upperBack = mk(0, 10, -2);

  // The paddle: a short round handle out of the middle of the right-hand face of her forearm block (the face toward his head in the top view, +x in the
  // forearm's own frame, near its end) and a small blade with rounded corners, lying along that direction with its face down at the contact, its
  // width along the arm, across one cheek. Tool-local, the paddle runs along -y; the tool group is turned a quarter so that it runs along the arm's +x.
  const HANDLE = 1.2, BLADE_L = 4.5, BLADE_W = 4;
  const PAD_M = 5.8, PAD_SIDE = 1.5 + HANDLE + BLADE_L / 2;   // how far along the arm the paddle springs, and how far its blade's middle stands out to the side
  const tool = new THREE.Group(); tool.position.set(1.5, -PAD_M, 0); tool.rotation.z = Math.PI / 2; gerda.wrist.add(tool);
  const woodMat = c => new THREE.MeshLambertMaterial({ color: srgb(c) });
  const paddle = new THREE.Group(); paddle.visible = false; tool.add(paddle);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, HANDLE + 0.2, 12), woodMat(0x7a4e26)); handle.position.y = -(HANDLE + 0.2) / 2; paddle.add(handle);
  {
    const w = BLADE_W, l = BLADE_L, rad = 1.2, x0 = -w / 2, x1 = w / 2, y1 = -HANDLE, y0 = y1 - l, sh = new THREE.Shape();
    sh.moveTo(x0 + rad, y0); sh.lineTo(x1 - rad, y0); sh.quadraticCurveTo(x1, y0, x1, y0 + rad); sh.lineTo(x1, y1 - rad); sh.quadraticCurveTo(x1, y1, x1 - rad, y1);
    sh.lineTo(x0 + rad, y1); sh.quadraticCurveTo(x0, y1, x0, y1 - rad); sh.lineTo(x0, y0 + rad); sh.quadraticCurveTo(x0, y0, x0 + rad, y0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.8, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 2, curveSegments: 8 });
    g.translate(0, 0, -0.4); paddle.add(new THREE.Mesh(g, woodMat(0x9a6a38)));
  }

  // ── The session ─────────────────────────────────────────────────────────────────────────────────────────────────────────
  const pain = S.createPain({ tolerance: 0.45, resilience: 0.5 });
  const st = {
    outfit: { gerda: 'Work', jack: 'Outdoor' }, lean: LEAN, size: 1, implement: 'hand', pace: 1, strength: 1, side: 'alt', nextSide: 'R',
    trousers: 'up', drawers: 'up', marks: { L: 0, R: 0 }, expr: 0,
    hits: 0, ended: false, red: false, peak: 0, swing: null, runLeft: 0, gap: 0, sound: true, last: null,
  };
  const J = { kick: 0, kickSide: 'R', t: 0 };     // Jack's reaction to the last smack, and a clock for his wriggling
  let dirty = true, repaintAt = 0, fadeAcc = 0;
  const events = [];
  const say = (type, data) => events.forEach(f => f(type, data));

  const cushion = () => {      // what Jack is wearing over the struck area, stacked as in the engine (sting only)
    const c = S.PAIN.CUSHION, worn = st.trousers === 'up' ? [c.trousers, c.briefs] : st.drawers === 'up' ? [c.briefs] : [];
    return 1 - worn.reduce((left, x) => left * (1 - x), 1);
  };
  const bandIndex = () => { const d = pain.distress(); return d < 0.3 ? 0 : d < 0.6 ? 1 : d < 0.9 ? 2 : d < 1 ? 3 : d < 1.5 ? 4 : 5; };
  const exprFor = () => Math.min(3, Math.max(0, bandIndex() - (bandIndex() >= 3 ? 1 : 0)));
  const canStrike = () => !st.ended && !pain.tooHarsh;

  // Audio: a short noise burst, deeper for a heavier implement.
  let actx = null;
  const thwack = power => {
    if (!st.sound) return;
    try {
      actx = actx || new (root.AudioContext || root.webkitAudioContext)();
      const n = Math.floor(actx.sampleRate * 0.09), buf = actx.createBuffer(1, n, actx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (n * 0.18));
      const src = actx.createBufferSource(); src.buffer = buf;
      const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = st.trousers === 'up' ? 900 : 1800;
      const g = actx.createGain(); g.gain.value = clamp(0.25 + 0.35 * power, 0.1, 0.9);
      src.connect(f); f.connect(g); g.connect(actx.destination); src.start();
    } catch (e) { /* no audio here */ }
  };

  // ── Smacks ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  function smack() {
    if (!canStrike() || st.swing) return false;
    st.swing = { phase: 'lift', t: 0, side: pickSide(), waited: 0, tau: 1, hover: 1 };
    return true;
  }
  // Which cheek takes the colour of the next smack (alternating, or the one chosen).
  function pickSide() {
    const side = st.side === 'alt' ? st.nextSide : st.side;
    if (st.side === 'alt') st.nextSide = st.nextSide === 'R' ? 'L' : 'R';
    return side;
  }
  function impact(sw) {
    const impl = IMPL[st.implement], tender = (st.marks.L + st.marks.R) / 2;
    const hit = pain.hit({ implement: st.implement, strength: st.strength, speed: st.pace, raised: sw.waited, tender, cushion: cushion() });
    const gain = 0.01875 * impl.mark * st.strength;
    for (const c of sw.side === 'C' ? ['L', 'R'] : [sw.side]) st.marks[c] = 1 - (1 - st.marks[c]) * (1 - gain);
    st.hits++; st.peak = Math.max(st.peak, pain.distress()); st.last = hit;
    J.kick = Math.max(J.kick, hit.reaction); J.kickSide = sw.side === 'C' ? (Math.random() < 0.5 ? 'L' : 'R') : sw.side;
    thwack(hit.reaction); dirty = true;
    say('hit', { hit, side: sw.side, distress: pain.distress(), band: BANDS[bandIndex()] });
    if (pain.tooHarsh) { st.runLeft = 0; say('tooharsh', {}); }
  }
  function advance(dt) {
    const sw = st.swing; if (!sw) return;
    const sp = st.pace; sw.t += sw.phase === 'hold' || sw.phase === 'contact' ? dt : dt * sp;
    const ease = x => x * x * (3 - 2 * x);
    switch (sw.phase) {
      case 'lift': sw.tau = lerp(1, 0, ease(clamp(sw.t / TIMES.lift, 0, 1))); sw.hover = sw.tau; if (sw.t >= TIMES.lift) { sw.phase = 'hold'; sw.t = 0; } break;
      case 'hold': sw.tau = 0; sw.waited = sw.t; if (sw.t >= TIMES.hold) { sw.phase = 'strike'; sw.t = 0; } break;
      case 'strike': { const x = clamp(sw.t / TIMES.strike, 0, 1); sw.tau = x * x; if (x >= 1) { sw.tau = 1; sw.phase = 'contact'; sw.t = 0; impact(sw); } break; }
      case 'contact': sw.tau = 1; if (sw.t >= TIMES.contact) {
        // In a run the arm goes straight from contact back up to raised for the next smack; only the last one returns to rest.
        if (st.runLeft > 0 && canStrike()) { st.runLeft--; sw.phase = 'rise'; sw.side = pickSide(); sw.waited = 0; } else sw.phase = 'back';
        sw.t = 0;
      } break;
      case 'rise': sw.tau = lerp(1, 0, ease(clamp(sw.t / TIMES.lift, 0, 1))); if (sw.t >= TIMES.lift) { sw.phase = 'hold'; sw.t = 0; } break;
      case 'back': sw.tau = 1; sw.hover = ease(clamp(sw.t / TIMES.back, 0, 1)); if (sw.t >= TIMES.back) { st.swing = null; st.gap = 0.25; } break;
    }
  }

  // ── Posing ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const tmpA = new V3(), tmpB = new V3(), tmpQ = new THREE.Quaternion(), tmpQ2 = new THREE.Quaternion();
  const world = o => o.getWorldPosition(new V3());
  const aim = (obj, dirWorld) => {            // turn obj so its -y axis runs along dirWorld
    obj.parent.getWorldQuaternion(tmpQ).invert();
    tmpA.copy(dirWorld).normalize().applyQuaternion(tmpQ);
    obj.quaternion.setFromUnitVectors(DOWN, tmpA);
  };

  // ── Pose edits (js/lap-poses.js): offsets on top of the procedural pose, per beat, applied bone by bone ───────────────────────────────────
  const ARM = 10, shoulderLocal = new V3(-5.5, 10, 0), DEG = Math.PI / 180, eul = new THREE.Euler(0, 0, 0, 'YXZ'), qd = new THREE.Quaternion();
  // Two sets of poses, made at different sizes of Jack, 100% and 50%, which the poses blend between as he scales (so the contact sites always work).
  // The file is { 100: {gerda, jack}, 50: {gerda, jack} } (a file with no sizes is taken for both).
  const LP = root.LapPoses || {};
  const EDITS = { 100: JSON.parse(JSON.stringify(LP[100] || (LP.gerda ? LP : {}))), 50: JSON.parse(JSON.stringify(LP[50] || (LP.gerda ? LP : {}))) };
  const SIZE_MIN = 0.5;                       // below this the poses do not reach (the lower limit of the position)
  // Editable poses: Hand { rest, raised, contactL, contactR }, Paddle { rest, raised, contactL, contactR } for Gerda (the contact pose is
  // per cheek, and per implement), and Jack { base, react }.
  const GERDA_BEATS = ['rest', 'raised', 'contactL', 'contactR'];
  const BEATS = { hand: GERDA_BEATS, paddle: GERDA_BEATS, jack: ['base', 'react'] };
  for (const k of [100, 50]) {
    const e = EDITS[k]; e.gerda = e.gerda || {}; e.jack = e.jack || {};
    for (const w of ['hand', 'paddle']) { e.gerda[w] = e.gerda[w] || {}; for (const b of GERDA_BEATS) e.gerda[w][b] = e.gerda[w][b] || {}; }
    for (const b of BEATS.jack) e.jack[b] = e.jack[b] || {};
  }
  let editKey = 100;                          // the set the editor is working on (Jack is held at that size while it is open)
  const sizeT = () => clamp((st.size - SIZE_MIN) / (1 - SIZE_MIN), 0, 1);    // 0 at 50%, 1 at 100%
  // The set of edits in force for a figure's bones: Gerda's depend on the implement in hand.
  const setOf = (who, key) => who === 'gerda' ? EDITS[key].gerda[st.implement] : EDITS[key].jack;
  const BONES = {
    gerda: { torso: gerda.torso, neck: gerda.neck, armL: gerda.armL, armR: gerda.armR, elbowR: gerda.elbow, wristR: gerda.wrist, thighL: gerda.legL.thigh, thighR: gerda.legR.thigh, kneeL: gerda.legL.knee, kneeR: gerda.legR.knee, paddle: tool },
    jack: { frame, torso: jack.torso, neck: jack.neck, glutes: glutesTilt, armL: jack.armL, armR: jack.armR, thighL: jack.legL.thigh, thighR: jack.legR.thigh, kneeL: jack.legL.knee, kneeR: jack.legR.knee },
  };
  const frameBase = frame.quaternion.clone(), glutesBase = glutesTilt.quaternion.clone(), basePos = new Map();
  for (const w in BONES) for (const n in BONES[w]) basePos.set(BONES[w][n], BONES[w][n].position.clone());
  // Put every bone back to its procedural pose (undoing last frame's offsets) before the new frame's pose is built.
  function restoreBones() {
    for (const w in BONES) for (const n in BONES[w]) {
      const b = BONES[w][n];
      if (b.userData.proc) { b.quaternion.copy(b.userData.proc); b.userData.proc = null; b.position.copy(basePos.get(b)); }
    }
    frame.quaternion.copy(frameBase); glutesTilt.quaternion.copy(glutesBase);
  }
  // The offsets one bone takes at the given beat weights: a rotation (quaternion) and a position shift, or null if it has none.
  function editFor(who, n, weights) {
    let any = false; const rr = [0, 0, 0], pp = [0, 0, 0];
    const t = sizeT();
    for (const [key, wk] of [[50, 1 - t], [100, t]]) {            // blend the two sets by Jack's size
      if (!wk) continue; const set = setOf(who, key);
      for (const beat in weights) {
        const e = set[beat] && set[beat][n], wt = weights[beat] * wk; if (!e || !wt) continue;
        any = true; for (let i = 0; i < 3; i++) { rr[i] += wt * (e.r ? e.r[i] : 0); pp[i] += wt * (e.p ? e.p[i] : 0); }
      }
    }
    return any ? { q: new THREE.Quaternion().setFromEuler(new THREE.Euler(rr[0] * DEG, rr[1] * DEG, rr[2] * DEG, 'YXZ')), p: pp } : null;
  }
  function applyEdits(who, names, weights) {
    for (const n of names) {
      const e = editFor(who, n, weights); if (!e) continue;
      const bone = BONES[who][n];
      bone.userData.proc = bone.quaternion.clone();
      bone.quaternion.multiply(e.q);
      bone.position.x += e.p[0]; bone.position.y += e.p[1]; bone.position.z += e.p[2];
    }
  }
  // How much of each beat's offsets applies now.
  // The landed pose belongs to the cheek being struck: contactL or contactR.
  function gerdaWeights() {
    const w = gerdaBeatWeights(), sw = st.swing;
    if (w.contact) { w[sw && sw.side === 'L' ? 'contactL' : 'contactR'] = w.contact; delete w.contact; }
    return w;
  }
  function gerdaBeatWeights() {
    const sw = st.swing; if (!sw) return { rest: 1 };
    const t = sw.tau;
    switch (sw.phase) {
      case 'lift': { const a = clamp(1 - t, 0, 1); return { rest: 1 - a, raised: a }; }
      case 'hold': return { raised: 1 };
      case 'strike': case 'rise': case 'freeze': return { raised: 1 - t, contact: t };
      case 'contact': return { contact: 1 };
      case 'back': { const b = clamp(sw.hover || 0, 0, 1); return { contact: 1 - b, rest: b }; }
    }
    return { rest: 1 };
  }
  const jackWeights = () => ({ base: 1, react: clamp(J.kick, 0, 1) });

  // Her swinging arm has an elbow: an upper arm of 4 (shoulder pivot to elbow) and a forearm of 6. Two-bone reach: where the elbow goes for the
  // shoulder at S to bring the point m along the forearm to M (it bends toward the pole when M is nearer than the arm's full length, and the arm
  // straightens, short of M, when it is further).
  const LU = 4, LF = 6, POLE = new V3(-0.7, 0.5, -0.5).normalize();
  function twoBone(S, M, m) {
    const v = M.clone().sub(S), d = clamp(v.length(), Math.abs(LU - m) + 0.05, LU + m - 0.01), ud = v.normalize();
    const cosA = clamp((LU * LU + d * d - m * m) / (2 * LU * d), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
    const pp = POLE.clone().addScaledVector(ud, -POLE.dot(ud)).normalize();
    const E = S.clone().addScaledVector(ud, LU * cosA).addScaledVector(pp, LU * sinA);
    const Mx = S.clone().addScaledVector(ud, d);
    return { u1: E.clone().sub(S).normalize(), f: Mx.clone().sub(E).normalize() };
  }
  // The blade's side and the arm's pose for a forearm direction f: the blade lies toward the world's +x as far as the forearm's axis allows.
  const sideOf = f => { const v = new V3(1, 0, 0).addScaledVector(f, -f.x); return v.lengthSq() > 1e-4 ? v.normalize() : new V3(0, 0, 1); };

  gerda.after = function (g) {
    const gw = gerdaWeights(), sw = st.swing, impl = IMPL[st.implement], tau = sw ? sw.tau : 1, hover = sw ? (sw.hover || 0) : 1;
    // Where she lands, on the cheek being struck (they alternate, or the one chosen). The hand: the end of her forearm on its middle. The paddle: the
    // middle of its blade on it (the blade's middle plane stands a little off his skin).
    // At rest (no swing) the aim is the centre of his lower back, at whatever size he is; during a swing it is the cheek struck. It eases from one to
    // the other (and is exact while the editor holds a pose).
    const padSide = sw ? sw.side : (st.side === 'alt' ? st.nextSide : st.side);
    const goal = world(rear[sw ? padSide : 'C']); if (impl.paddle) goal.y += 0.4; goal.y += hover * HOVER;
    const snap = !st.aim || hs.on || (sw && sw.phase === 'freeze');
    st.aim = snap ? goal.clone() : st.aim.lerp(goal, 1 - Math.exp(-(st.dt || 0.016) * 12));
    const T = st.aim.clone();
    // Her torso never twists or leans for a strike (a pose edit of it stays put); the arm and, for the paddle, the blade's angle do the aiming.
    st.yaw = 0;
    g.torso.rotation.order = 'YXZ'; g.torso.rotation.set(LEAN, st.yaw, 0); g.neck.rotation.x = 0.55 + 0.4 * LEAN; g.neck.rotation.y = -st.yaw * 0.9;
    applyEdits('gerda', ['torso', 'neck', 'thighL', 'thighR', 'kneeL', 'kneeR'], gw);
    g.root.updateMatrixWorld(true);
    // Left hand rests on Jack's back.
    const sL = world(g.armL), tL = world(upperBack);
    aim(g.armL, tmpB.copy(tL).sub(sL)); applyEdits('gerda', ['armL'], gw);
    // Right arm: shoulder, elbow and wrist (the forearm's own twist). Contact pose: the hand's forearm end, or the paddle's mount, is brought to where
    // it lands; the raised pose lifts the elbow up and forward. They blend by how far the swing has come.
    const sh = world(g.armR);
    const reachM = impl.paddle ? PAD_M : LF;
    const solve = (Mt, withSide) => {        // pose params for the forearm's point m to reach Mt (the paddle: its blade's middle then lands on T)
      let M = Mt, ik;
      for (let it = 0; it < (withSide ? 4 : 1); it++) {
        ik = twoBone(sh, M, reachM);
        if (withSide) M = Mt.clone().addScaledVector(sideOf(ik.f), -PAD_SIDE);
      }
      return ik;
    };
    const contact = solve(T, impl.paddle);
    const ud = T.clone().sub(sh).normalize();
    const raisedIK = twoBone(sh, sh.clone().addScaledVector(ud.clone().multiplyScalar(0.35).addScaledVector(UP, 0.95).normalize(), reachM * 0.95), reachM);
    const armPose = ik => {                 // set the arm to ik, return its local pivot rotation, elbow flexion and wrist twist
      aim(g.armR, ik.u1);
      const h = new V3().crossVectors(ik.u1, ik.f); let psi = Math.acos(clamp(ik.u1.dot(ik.f), -1, 1));
      if (h.lengthSq() > 1e-6) {             // roll the upper arm about its own axis so the elbow's hinge (local x) is across the bend
        h.normalize(); g.armR.updateMatrixWorld(true);
        const xw = new V3(1, 0, 0).applyQuaternion(g.armR.getWorldQuaternion(tmpQ2));
        const ang = Math.atan2(xw.clone().cross(h).dot(ik.u1), xw.dot(h));
        g.armR.parent.getWorldQuaternion(tmpQ).invert();
        g.armR.quaternion.premultiply(tmpQ2.setFromAxisAngle(ik.u1.clone().applyQuaternion(tmpQ), ang));
      } else psi = 0;
      // The elbow hinges about local x; take whichever sign puts the forearm along ik.f.
      g.elbow.rotation.set(psi, 0, 0); g.wrist.rotation.set(0, 0, 0); g.root.updateMatrixWorld(true);
      const fw = new V3(0, -1, 0).applyQuaternion(g.wrist.getWorldQuaternion(tmpQ2));
      if (fw.dot(ik.f) < 0.999) { g.elbow.rotation.x = -psi; g.root.updateMatrixWorld(true); }
      let omega = 0;
      if (impl.paddle) {                      // twist the forearm about its axis so the blade lies toward his head
        const xw = new V3(1, 0, 0).applyQuaternion(g.wrist.getWorldQuaternion(tmpQ2)), want = sideOf(ik.f);
        omega = -Math.atan2(xw.clone().cross(want).dot(ik.f), xw.dot(want));
      }
      return { q: g.armR.quaternion.clone(), psi: g.elbow.rotation.x, omega };
    };
    const pc = armPose(contact), pr = armPose(raisedIK);
    g.armR.quaternion.copy(pr.q).slerp(pc.q, tau);
    g.elbow.rotation.set(lerp(pr.psi, pc.psi, tau), 0, 0); g.wrist.rotation.set(0, lerp(pr.omega, pc.omega, tau), 0);
    paddle.visible = impl.paddle;
    const gwArm = Object.assign({}, gw); delete gwArm.rest;      // at rest the right arm is aimed (over the centre of his lower back), not posed by hand
    applyEdits('gerda', ['armR', 'elbowR', 'wristR'], gwArm);
    if (impl.paddle) {
      // Roll the blade about its own length so that, at contact, its face lies on the angle of his glutes (the block's back face, tipped between his
      // back and his thighs); raised, it is left as the forearm carries it.
      tool.rotation.set(0, 0, Math.PI / 2); g.root.updateMatrixWorld(true);
      tool.getWorldQuaternion(tmpQ2);
      const lw = new V3(1, 0, 0).applyQuaternion(tmpQ2), zw = new V3(0, 0, 1).applyQuaternion(tmpQ2);
      const nIn = new V3(0, 0, 1).applyQuaternion(glutesTilt.getWorldQuaternion(tmpQ)).addScaledVector(lw, 0);   // into the block, from its back face
      const want = nIn.addScaledVector(lw, -nIn.dot(lw));
      if (want.lengthSq() > 1e-4) { want.normalize(); tool.rotation.set(Math.atan2(zw.clone().cross(want).dot(lw), zw.dot(want)) * tau, 0, Math.PI / 2); }
    }
    if (impl.paddle) applyEdits('gerda', ['paddle'], gwArm);
  };
  jack.after = function (j) {
    const k = J.kick, d = clamp(pain.distress(), 0, 1.5), w = Math.sin(J.t * 9) * 0.05 * Math.min(1, d) + Math.sin(J.t * 5.3) * 0.03 * Math.min(1, d);
    for (const key of ['legL', 'legR']) {
      const l = j[key], mine = (key === 'legL') === (J.kickSide === 'L') ? 1 : 0.45;
      // Hanging off the edge of her lap: thighs down and out from the glutes block, knees bent back so the feet clear the floor.
      l.thigh.rotation.x = -0.96 + k * (0.9 * mine) + w * (key === 'legL' ? 1 : -1);
      l.thigh.rotation.z = l.sign * (0.12 + 0.2 * k * mine);
      l.knee.rotation.x = 0.6 + 0.6 * k * mine + 0.5 * Math.max(0, w);
    }
    j.neck.rotation.x = -0.1 - 0.5 * k + 0.1 * Math.min(1, d) * Math.sin(J.t * 4);   // face toward the floor, lifting as he yelps
    j.neck.rotation.y = -0.75 + 0.15 * Math.sin(J.t * 3) * Math.min(1, d);              // turned toward the room
    for (const key of ['armL', 'armR']) {
      const a = j[key], sg = a.userData.sign;
      // Arms reach down past his head to the floor (his shoulders are only ten up, so they cannot hang straight).
      a.rotation.x = -2.14 - 0.25 * k + Math.sin(J.t * 7 + (sg > 0 ? 0 : 1.7)) * 0.08 * Math.min(1, d);
      a.rotation.z = sg * (0.12 + 0.1 * k);
    }
    j.torso.rotation.z = 0.06 * Math.min(1, d) * Math.sin(J.t * 6);
    applyEdits('jack', ['torso', 'neck', 'glutes', 'armL', 'armR', 'thighL', 'thighR', 'kneeL', 'kneeR'], jackWeights());
  };

  // ── Frame loop ──────────────────────────────────────────────────────────────────────────────────────────────────────────
  function repaint() {
    st.expr = exprFor();
    B.paintJackInto(jack.skin, { trousers: st.trousers, drawers: st.drawers, marks: st.marks, expr: st.expr, outfit: st.outfit.jack, hitched: true });
    jack.tex.needsUpdate = true;
    B.paintGlutesInto(glutes.skin, { trousers: st.trousers, drawers: st.drawers, marks: st.marks, outfit: st.outfit.jack }); glutes.tex.needsUpdate = true;
    jack.legL.ring.visible = jack.legR.ring.visible = st.trousers === 'down';
    dirty = false;
  }
  function update(dt) {
    restoreBones(); st.dt = dt;
    J.t += dt; J.kick *= Math.exp(-dt * 4.5); if (st.holdKick != null) J.kick = st.holdKick;
    if (st.swing) advance(dt);
    pain.update(dt, !!(st.swing && st.swing.phase === 'contact'));
    if (st.ended && !st.swing && st.runLeft) st.runLeft = 0;
    if (exprFor() !== st.expr) dirty = true;
    // The colour fades with time while the correction runs, but once it is over it stays until the level resets (the deep red slowly, a faint blush a little more slowly per bit): about a minute and a half to a quarter of its depth.
    if (!st.swing && !st.ended) { let faded = false; for (const c of ['L', 'R']) if (st.marks[c] > 0) { st.marks[c] = Math.max(0, st.marks[c] - (st.marks[c] * 0.012 + 0.0008) * dt); faded = true; } if (faded) { fadeAcc += dt; if (fadeAcc > 0.8) { fadeAcc = 0; dirty = true; } } }
    repaintAt -= dt; if (dirty && repaintAt <= 0) { repaint(); repaintAt = 0.12; }
    // Jack's size (the premise: he shrinks on arrival): his frame is scaled about his hip joint, which is re-placed so his torso's centre is still
    // over the centre of her thighs and his belly still rests on them (their tops are at y = 8, 8.75 under the skirt; his body is 4 deep).
    const sz = st.size * JACK_FULL; frame.scale.setScalar(sz);    // (his full size, 100%, is 95% of the model's own scale)
    frame.position.set(-6 * sz, 8.75 + 2 * sz + 0.7 * J.kick * sz, P.z);
    applyEdits('jack', ['frame'], jackWeights());
    B.step(jack, dt); scene.updateMatrixWorld(true);
    B.step(gerda, dt);
    updateHandles(); controls.update(); renderer.render(scene, camera);
  }

  // ── Cameras ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const VIEWS = {
    overview: { pos: [-44, 56, 50], at: [-3, 10, 4] },       // three-quarter, from in front of Gerda's right
    behind: { pos: [-38, 58, 12], at: [-8, 10, 4] },         // down on Jack's rear, from his feet
    shoulder: { pos: [-22, 46, -22], at: [-6, 8, 6] },       // over Gerda's right shoulder: the giver's own view
    face: { pos: [22, 6, 30], at: [6, 5, 3] },               // Jack's face, from the floor side
  };
  function view_(name) { const v = VIEWS[name]; camera.position.set(...v.pos); controls.target.set(...v.at); }
  view_('overview');
  function resize() { const w = view.clientWidth || 800, h = view.clientHeight || 600; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  root.addEventListener('resize', resize); resize();

  // ── Public ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // The pose editor's interface (the page builds the controls): preview only, nothing is stored; report() prints the file to paste back.
  const round = v => Math.round(v * 10) / 10;
  // ── Pose handles: click and drag a joint in the view. Dragging a handle turns the bone it belongs to (so the joint at the other end of that bone
  // follows the cursor), twists it, or moves it, by editing the held beat's offsets; the sliders show the same numbers. ──────────────────────────
  const hpt = (parent, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; };
  const H = (bone, kind, label, tip, axis) => ({ bone, kind, label, tip, axis });
  const BLADE_END = -(HANDLE + BLADE_L);
  const HANDLE_DEFS = {
    gerda: [
      H('neck', 'aim', 'Head', hpt(gerda.neck, 0, 4, 0)),
      H('torso', 'aim', 'Chest (turns and leans the torso)', hpt(gerda.torso, 0, 12, 0)),
      H('torso', 'move', 'Torso (moves it)', hpt(gerda.torso, 0, 2, 0)),
      H('armL', 'aim', 'Left hand (swings the left arm)', hpt(gerda.armL, 0, -10, 0)),
      H('armR', 'aim', 'Right elbow (swings the right upper arm)', gerda.elbow),
      H('elbowR', 'aim', 'Right hand (bends the elbow)', hpt(gerda.wrist, 0, -6, 0)),
      H('wristR', 'twist', 'Right wrist twist (turns the forearm, hand and paddle about the forearm)', hpt(gerda.wrist, 2.4, -3, 0), new V3(0, 1, 0)),
      H('wristR', 'move', 'Right wrist (moves the hand and paddle mount)', hpt(gerda.wrist, 0, -4.5, 0)),
      H('paddle', 'aim', 'Paddle tip (swings the paddle)', hpt(tool, 0, BLADE_END, 0)),
      H('paddle', 'twist', 'Paddle roll (rolls the blade about its length)', hpt(tool, BLADE_W / 2, -(HANDLE + BLADE_L / 2), 0), new V3(0, 1, 0)),
      H('thighL', 'aim', 'Left knee', hpt(gerda.legL.thigh, 0, -6, 0)), H('kneeL', 'aim', 'Left foot', hpt(gerda.legL.knee, 0, -6, 0)),
      H('thighR', 'aim', 'Right knee', hpt(gerda.legR.thigh, 0, -6, 0)), H('kneeR', 'aim', 'Right foot', hpt(gerda.legR.knee, 0, -6, 0)),
    ],
    jack: [
      H('frame', 'move', 'Jack (moves his whole body on her lap)', hpt(frame, 0, 0, 0)),
      H('torso', 'aim', 'Shoulders (turns his torso)', hpt(jack.torso, 0, 12, 0)),
      H('neck', 'aim', 'Head', hpt(jack.neck, 0, 4, 0)),
      H('armL', 'aim', 'Left hand', hpt(jack.armL, 0, -10, 0)), H('armR', 'aim', 'Right hand', hpt(jack.armR, 0, -10, 0)),
      H('glutes', 'aim', 'Glutes block (tilts it)', hpt(glutesTilt, 0, -5.2, 2.25)),
      H('thighL', 'aim', 'Left knee', hpt(jack.legL.thigh, 0, -6, 0)), H('kneeL', 'aim', 'Left foot', hpt(jack.legL.knee, 0, -6, 0)),
      H('thighR', 'aim', 'Right knee', hpt(jack.legR.thigh, 0, -6, 0)), H('kneeR', 'aim', 'Right foot', hpt(jack.legR.knee, 0, -6, 0)),
    ],
  };
  // What each bone is, in plain words (shown in the editor).
  const BONE_INFO = {
    torso: 'Torso: turns and leans the whole upper body from the hips (its position moves it).',
    neck: 'Head: tilts and turns the head from the base of the neck.',
    armL: 'Left arm: swings the whole left arm from the shoulder.',
    armR: 'Right shoulder: swings the whole right arm from the shoulder; the forearm follows.',
    elbowR: 'Right elbow: bends the right forearm (and hand) at the elbow.',
    wristR: 'Right wrist: the forearm turned about its own length (twist), and the forearm, hand and paddle mount moved as a unit (position). It does not bend the elbow.',
    paddle: 'Paddle: swings the paddle at its mount on the forearm, and rolls the blade.',
    thighL: 'Left thigh: swings the left leg from the hip.', thighR: 'Right thigh: swings the right leg from the hip.',
    kneeL: 'Left knee: bends the left lower leg.', kneeR: 'Right knee: bends the right lower leg.',
    glutes: 'Glutes block: tilts the block that bridges his back and thighs.',
    frame: 'Jack: moves and turns his whole body on her lap.',
  };
  const handleMat = (color) => new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.9 });
  const handleGeo = { aim: new THREE.SphereGeometry(0.85, 14, 10), move: new THREE.BoxGeometry(1.3, 1.3, 1.3), twist: new THREE.OctahedronGeometry(1.0) };
  const HCOL = { aim: 0xffcc33, move: 0x44ddff, twist: 0xff66cc };
  const handleGroup = new THREE.Group(); handleGroup.visible = false; scene.add(handleGroup);
  for (const who in HANDLE_DEFS) for (const h of HANDLE_DEFS[who]) {
    h.who = who; h.mesh = new THREE.Mesh(handleGeo[h.kind], handleMat(HCOL[h.kind])); h.mesh.renderOrder = 999; h.mesh.userData.handle = h; h.mesh.visible = false; handleGroup.add(h.mesh);
  }
  const hs = { on: false, who: 'gerda', bone: null, onPick: null, onChange: null, drag: null };
  function updateHandles() {
    if (!hs.on) return;
    for (const w in HANDLE_DEFS) for (const h of HANDLE_DEFS[w]) {
      const show = w === hs.who; h.mesh.visible = show;
      if (!show) continue;
      h.tip.getWorldPosition(h.mesh.position);
      const sel = h.bone === hs.bone, d = camera.position.distanceTo(h.mesh.position);
      h.mesh.scale.setScalar((sel ? 1.35 : 1) * Math.max(0.5, d / 70)); h.mesh.material.opacity = sel ? 1 : 0.65;
      h.mesh.material.color.setHex(sel ? 0xffffff : HCOL[h.kind]);
    }
  }
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), dragPlane = new THREE.Plane(), hitP = new V3();
  const weightsNow = () => cur.who === 'jack' ? jackWeights() : gerdaWeights();
  function pointerRay(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
  }
  function applyDrag(drag, target) {
    const h = drag.h, fig = h.who, bone = BONES[fig][h.bone], set = setFor(cur.who)[cur.beat], wts = weightsNow(), wb = wts[cur.beat] || 1;
    const entry = set[h.bone] || (set[h.bone] = { r: [0, 0, 0], p: [0, 0, 0] }); entry.r = entry.r || [0, 0, 0]; entry.p = entry.p || [0, 0, 0];
    if (h.kind === 'move') {
      const inv = new THREE.Matrix4().copy(bone.parent ? bone.parent.matrixWorld : new THREE.Matrix4()).invert();
      const a = drag.startWorld.clone().applyMatrix4(inv), b = target.clone().applyMatrix4(inv);
      for (let i = 0; i < 3; i++) entry.p[i] = drag.startP[i] + (b.getComponent(i) - a.getComponent(i)) / wb;
    } else {
      bone.updateWorldMatrix(true, false);
      const pivot = bone.getWorldPosition(new V3()), tip = h.tip.getWorldPosition(new V3());
      const cq = bone.getWorldQuaternion(new THREE.Quaternion()), pq = (bone.parent ? bone.parent.getWorldQuaternion(new THREE.Quaternion()) : new THREE.Quaternion());
      let qw = new THREE.Quaternion();
      if (h.kind === 'aim') {
        const d0 = tip.clone().sub(pivot), d1 = target.clone().sub(pivot);
        if (d0.length() < 1e-6 || d1.length() < 1e-6) return;
        qw.setFromUnitVectors(d0.normalize(), d1.normalize());
      } else {
        const axis = h.axis.clone().applyQuaternion(cq).normalize();
        const v0 = tip.clone().sub(pivot), v1 = target.clone().sub(pivot);
        v0.addScaledVector(axis, -v0.dot(axis)); v1.addScaledVector(axis, -v1.dot(axis));
        if (v0.length() < 1e-6 || v1.length() < 1e-6) return;
        qw.setFromAxisAngle(axis, Math.atan2(v0.clone().cross(v1).dot(axis), v0.dot(v1)));
      }
      const newLocal = pq.clone().invert().multiply(qw.multiply(cq));
      const proc = bone.userData.proc || bone.quaternion;
      const tot = new THREE.Euler().setFromQuaternion(proc.clone().invert().multiply(newLocal), 'YXZ');
      const want = [tot.x / DEG, tot.y / DEG, tot.z / DEG];
      for (let i = 0; i < 3; i++) {                      // the others' share of the total stays; the held beat's share takes the rest
        let others = 0; for (const b in wts) if (b !== cur.beat && setFor(cur.who)[b] && setFor(cur.who)[b][h.bone]) others += wts[b] * ((setFor(cur.who)[b][h.bone].r || [0, 0, 0])[i]);
        entry.r[i] = (want[i] - others) / wb;
      }
    }
    if (entry.r.every(v => Math.abs(v) < 0.05) && entry.p.every(v => Math.abs(v) < 0.005)) delete set[h.bone];
    if (hs.onChange) hs.onChange(h.bone);
  }
  const hostEl = renderer.domElement.parentElement;
  hostEl.addEventListener('pointerdown', e => {
    if (!hs.on || e.button !== 0) return;
    pointerRay(e);
    const meshes = HANDLE_DEFS[hs.who].map(h => h.mesh), hit = ray.intersectObjects(meshes, false)[0];
    if (!hit) return;
    e.stopPropagation(); e.preventDefault();
    const h = hit.object.userData.handle; hs.bone = h.bone; controls.enabled = false;
    dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new V3()).negate(), hit.point);
    const set = setFor(cur.who)[cur.beat], ent = set[h.bone];
    hs.drag = { h, grab: hit.point.clone().sub(h.mesh.position), startWorld: h.tip.getWorldPosition(new V3()), startP: ent && ent.p ? ent.p.slice() : [0, 0, 0] };
    if (hs.onPick) hs.onPick(h.bone, h.label);
    renderer.domElement.setPointerCapture && renderer.domElement.setPointerCapture(e.pointerId);
  }, true);
  hostEl.addEventListener('pointermove', e => {
    if (!hs.drag) return;
    pointerRay(e);
    if (ray.ray.intersectPlane(dragPlane, hitP)) applyDrag(hs.drag, hitP.clone().sub(hs.drag.grab));
  }, true);
  const endDrag = () => { if (hs.drag) { hs.drag = null; controls.enabled = true; } };
  hostEl.addEventListener('pointerup', endDrag, true); hostEl.addEventListener('pointercancel', endDrag, true);

  // who: 'hand', 'paddle' (Gerda with that implement) or 'jack'.
  const cur = { who: 'paddle', beat: 'contactL' };      // what the editor is holding the scene at
  const figure = who => who === 'jack' ? 'jack' : 'gerda', setFor = who => who === 'jack' ? EDITS[editKey].jack : EDITS[editKey].gerda[who];
  const editor = {
    beats: BEATS, bones: who => Object.keys(BONES[figure(who)]).filter(n => who !== 'hand' || n !== 'paddle'),
    get(who, beat, bone) { const e = setFor(who)[beat][bone] || {}; return { r: (e.r || [0, 0, 0]).slice(), p: (e.p || [0, 0, 0]).slice() }; },
    set(who, beat, bone, r, p) {
      if (r.every(v => !v) && p.every(v => !v)) delete setFor(who)[beat][bone]; else setFor(who)[beat][bone] = { r: r.slice(), p: p.slice() };
    },
    resetBone(who, beat, bone) { delete setFor(who)[beat][bone]; },
    resetBeat(who, beat) { setFor(who)[beat] = {}; },
    clear() { for (const w in BEATS) for (const b of BEATS[w]) setFor(w)[b] = {}; },
    sizeMin: SIZE_MIN,
    // Hold the scene at a beat so it can be posed: Gerda's rest, raised, or landed on the left or right cheek (with the hand or the paddle in
    // hand); Jack's base or fully reacting.
    hold(who, beat) {
      cur.who = who; cur.beat = beat;
      st.runLeft = 0; st.swing = null;
      if (who !== 'jack') {
        st.implement = who; st.holdKick = null;
        if (beat !== 'rest') st.swing = { phase: 'freeze', t: 0, side: beat === 'contactL' ? 'L' : 'R', waited: 0, tau: beat === 'raised' ? 0 : 1 };
      } else st.holdKick = beat === 'react' ? 1 : 0;
    },
    release() { st.swing = null; st.holdKick = null; },
    // Handles in the view: on or off, for Hand/Paddle (Gerda's) or Jack's; which bone is selected; callbacks for a pick and for a change by dragging.
    handles(on, who) { hs.on = !!on; if (hs.on) st.size = editKey / 100; hs.who = who === 'jack' ? 'jack' : 'gerda'; handleGroup.visible = hs.on; if (!hs.on) { endDrag(); for (const w in HANDLE_DEFS) for (const h of HANDLE_DEFS[w]) h.mesh.visible = false; } },
    select(bone) { hs.bone = bone; },
    onPick(f) { hs.onPick = f; }, onChange(f) { hs.onChange = f; },
    info: (who, bone) => BONE_INFO[bone] || '',
    handleLabels: who => HANDLE_DEFS[who === 'jack' ? 'jack' : 'gerda'].map(h => ({ bone: h.bone, kind: h.kind, label: h.label })),
    // Which of the two sets is being edited (100 or 50); Jack is held at that size while the editor is open.
    sizeKey(k) { if (k === undefined) return editKey; editKey = k === 50 ? 50 : 100; if (hs.on) st.size = editKey / 100; return editKey; },
    report() {
      const dump = (set, beats, pad) => beats.map(b => {
        const bones = Object.keys(set[b]).map(n => { const e = set[b][n], parts = [];
          if (e.r && e.r.some(v => v)) parts.push(`r: [${e.r.map(round).join(', ')}]`);
          if (e.p && e.p.some(v => v)) parts.push(`p: [${e.p.map(round).join(', ')}]`);
          return `${n}: { ${parts.join(', ')} }`; });
        return `${pad}${b}: {${bones.length ? '\n' + pad + '  ' + bones.join(',\n' + pad + '  ') + ',\n' + pad : ''}}`;
      }).join(',\n');
      const one = k => {
        const e = EDITS[k], gerdaOut = ['hand', 'paddle'].map(w => `      ${w}: {\n${dump(e.gerda[w], GERDA_BEATS, '        ')},\n      }`).join(',\n');
        return `  ${k}: {\n    gerda: {\n${gerdaOut},\n    },\n    jack: {\n${dump(e.jack, BEATS.jack, '      ')},\n    },\n  },`;
      };
      return `root.LapPoses = {\n${one(100)}\n${one(50)}\n};`;
    },
  };
  const api = {
    editor,
    scene, floor, camera, controls, renderer, gerda, jack, pain, st, IMPL, BANDS, J,
    on: f => events.push(f),
    update, view: view_, smack,
    // A run: the first smack lifts from rest, each next one comes straight up from contact to raised, and the last one returns to rest.
    run(n) { if (!canStrike()) return; n = Math.max(1, n | 0); if (st.swing) st.runLeft = n; else if (smack()) st.runLeft = n - 1; },
    stop() { st.runLeft = 0; },
    end() { if (st.ended) return; st.ended = true; st.runLeft = 0; say('end', { red: false, hits: st.hits, peak: st.peak }); },
    red() { if (st.ended) return; st.ended = true; st.red = true; st.runLeft = 0; st.swing = null; say('end', { red: true, hits: st.hits, peak: st.peak }); },
    reset() { pain.reset(); Object.assign(st, { hits: 0, ended: false, red: false, peak: 0, swing: null, runLeft: 0, marks: { L: 0, R: 0 }, last: null }); J.kick = 0; dirty = true; say('reset', {}); },
    size(v) { if (!hs.on) st.size = clamp(v, SIZE_MIN, 1); },
    // Wardrobe: Jack has 'Outdoor'; Gerda 'Work' or 'Fine'.
    outfit(who, name) {
      if (who === 'gerda' && B.OUTFITS.gerda.indexOf(name) >= 0) { st.outfit.gerda = name; B.paintGerdaInto(gerda.skin, name); gerda.tex.needsUpdate = true; }
      if (who === 'jack' && B.OUTFITS.jack.indexOf(name) >= 0) { st.outfit.jack = name; dirty = true; }
    },
    outfits: B.OUTFITS,
    clearMarks() { st.marks = { L: 0, R: 0 }; dirty = true; },
    implement(name) { if (!IMPL[name] || st.swing) return; st.implement = name; },
    layers(o) { Object.assign(st, o); dirty = true; },
    canStrike, bandIndex, bandName: () => BANDS[bandIndex()],
    info: () => ({ distress: pain.distress(), band: BANDS[bandIndex()], hits: st.hits, peak: st.peak, ended: st.ended, red: st.red, tooHarsh: pain.tooHarsh, busy: !!st.swing, running: st.runLeft > 0, marks: st.marks, receptivity: pain.receptivity() }),
    repaintNow: () => { repaint(); },
  };
  repaint();
  return api;
}

root.Lap = { create, IMPL, BANDS };
})(typeof window !== 'undefined' ? window : globalThis);

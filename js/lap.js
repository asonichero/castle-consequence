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
const P = new V3(-6, 10, 3), PITCH = -0.05;   // hip joint: his torso's centre (6 up from it) is over the centre of her thighs (x 0, z 3)
const LEAN = -0.3;             // Gerda sits back in the chair; her straight arm only reaches Jack's rear from there
const REST = 0.88;             // how near the hand hovers to the rear between smacks (0 = raised, 1 = landed)
const TIMES = { lift: 0.45, hold: 0.15, strike: 0.09, contact: 0.32, back: 0.3 };
// Implements: the hand lands with the end of Gerda's arm block; the paddle is a small blade gripped in her fist, running on from the end of
// the arm, its face toward Jack (she sits further back to reach with it). mark is the engine's weight toward the colour at the contact
// site; dual lands on both cheeks at once. weight/sting live in the engine's PAIN.implement.
const IMPL = {
  hand:   { name: 'Hand',   mark: 1,     dual: false, lean: -0.35, reach: 11.9 },
  paddle: { name: 'Paddle', mark: 8 / 3, dual: true,  lean: -0.5,  reach: 13.5 },
};
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
  const wood = new THREE.MeshLambertMaterial({ color: srgb(0x6a4a2e) });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(14, 4, 12), wood); seat.position.set(0, 2, -0.5); scene.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(14, 14, 1.5), wood); back.position.set(0, 11, -9.5); scene.add(back);
  for (const [x, z] of [[-6, -6], [6, -6]]) { const post = new THREE.Mesh(new THREE.BoxGeometry(1.5, 18, 1.5), wood); post.position.set(x, 9, z - 3.5); scene.add(post); }

  // ── The cast ────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const gerda = B.makeGerda(), jack = B.makeJack();
  scene.add(gerda.root);
  const frame = new THREE.Group(); frame.add(jack.root); scene.add(frame);
  // Jack's frame: local +y (his head) runs along world +x, his front faces down, then the whole body is tipped head-down by PITCH.
  const qx = new THREE.Quaternion().setFromAxisAngle(new V3(1, 0, 0), Math.PI / 2), qy = new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), Math.PI / 2);
  const qz = new THREE.Quaternion().setFromAxisAngle(new V3(0, 0, 1), PITCH);
  frame.quaternion.copy(qz).multiply(qy).multiply(qx);
  B.setPose(gerda, 'sit'); Object.assign(gerda.state, B.POSES.sit);
  Object.assign(jack.state, { hipY: 0, lift: 0 }); Object.assign(jack.target, { hipY: 0, lift: 0 });
  // The glutes block hangs from a hinge at its top edge, which lies in the plane of his back (just proud of it) at the bottom edge of the torso, and
  // tips forward from there part-way toward the angle of his thighs (which fold forward at the hip), bridging his back and his thighs. It
  // takes the look of the trousers, drawers or bare skin.
  const glutes = B.makeGlutes(), glutesTilt = new THREE.Group();
  glutesTilt.position.set(0, 0.6, -2.05); glutesTilt.rotation.x = -0.45;
  glutes.mesh.scale.set(1, 1.2, 1.05); glutes.mesh.position.set(0, -2.6, 2.25 - 0.0);   // back face in the hinge's plane, top face at the hinge
  glutesTilt.add(glutes.mesh); jack.hips.add(glutesTilt);
  // Where the hand lands: points on the back of Jack's hips (his left cheek is the nearer, world −z side), and the middle of his back.
  const mk = (x, y, z, parent) => { const o = new THREE.Object3D(); o.position.set(x, y, z); (parent || jack.torso).add(o); return o; };
  const rear = { L: mk(2, -2.4, -0.05, glutesTilt), R: mk(-2, -2.4, -0.05, glutesTilt), C: mk(0, -2.4, -0.05, glutesTilt) }, upperBack = mk(0, 10, -2);

  // The paddle: a short handle out of the middle of the end of her right arm (as if in her fist) and a small blade, 6 long in all.
  const tool = new THREE.Group(); tool.position.y = -12; gerda.armR.add(tool);
  const box = (w, h, d, y, color) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: srgb(color) })); m.position.y = y; return m; };
  const paddle = new THREE.Group(); paddle.add(box(1.4, 1.5, 1.4, -0.75, 0x7a4e26), box(4, 4.5, 1.1, -3.75, 0x9a6a38)); paddle.visible = false; tool.add(paddle);

  // ── The session ─────────────────────────────────────────────────────────────────────────────────────────────────────────
  const pain = S.createPain({ tolerance: 0.45, resilience: 0.5 });
  const st = {
    lean: IMPL.hand.lean, size: 1, implement: 'hand', pace: 1, strength: 1, side: 'alt', nextSide: 'R',
    trousers: 'up', drawers: 'up', marks: { L: 0, R: 0 }, expr: 0,
    hits: 0, ended: false, red: false, peak: 0, swing: null, runLeft: 0, gap: 0, sound: true, last: null,
  };
  const J = { kick: 0, kickSide: 'R', t: 0 };     // Jack's reaction to the last smack, and a clock for his wriggling
  let dirty = true, repaintAt = 0;
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
    let side = st.side === 'alt' ? st.nextSide : st.side;
    if (IMPL[st.implement].dual) side = 'C';
    st.swing = { phase: 'lift', t: 0, side, waited: 0, tau: REST };
    if (st.side === 'alt') st.nextSide = st.nextSide === 'R' ? 'L' : 'R';
    return true;
  }
  function impact(sw) {
    const impl = IMPL[st.implement], tender = (st.marks.L + st.marks.R) / 2;
    const hit = pain.hit({ implement: st.implement, strength: st.strength, speed: st.pace, raised: sw.waited, tender, cushion: cushion() });
    const gain = 0.075 * impl.mark * st.strength;
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
      case 'lift': sw.tau = lerp(REST, 0, ease(clamp(sw.t / TIMES.lift, 0, 1))); if (sw.t >= TIMES.lift) { sw.phase = 'hold'; sw.t = 0; } break;
      case 'hold': sw.tau = 0; sw.waited = sw.t; if (sw.t >= TIMES.hold) { sw.phase = 'strike'; sw.t = 0; } break;
      case 'strike': { const x = clamp(sw.t / TIMES.strike, 0, 1); sw.tau = x * x; if (x >= 1) { sw.tau = 1; sw.phase = 'contact'; sw.t = 0; impact(sw); } break; }
      case 'contact': sw.tau = 1; if (sw.t >= TIMES.contact) { sw.phase = 'back'; sw.t = 0; } break;
      case 'back': sw.tau = lerp(1, REST, ease(clamp(sw.t / TIMES.back, 0, 1))); if (sw.t >= TIMES.back) { st.swing = null; st.gap = 0.25; } break;
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

  gerda.after = function (g) {
    g.torso.rotation.order = 'YXZ'; g.torso.rotation.y = st.yaw || 0; g.torso.rotation.x = st.lean; g.neck.rotation.x = 0.55; g.neck.rotation.y = -(st.yaw || 0) * 0.9;
    g.root.updateMatrixWorld(true);
    // Left hand rests on Jack's back.
    const sL = world(g.armL), tL = world(upperBack);
    aim(g.armL, tmpB.copy(tL).sub(sL));
    // Right arm: a straight block from the shoulder. The hand lands with the end of it; the paddle's blade lies on from there, face down on him.
    const sw = st.swing, impl = IMPL[st.implement];
    const side = sw ? sw.side : (impl.dual ? 'C' : st.side === 'alt' ? st.nextSide : st.side);
    const tau = sw ? sw.tau : REST;
    const sh = world(g.armR), T = world(rear[side]);
    if (impl.dual) T.y += 0.55;                  // the blade's middle plane stands half its thickness off his skin
    const d = T.clone().sub(sh), u = d.clone().normalize();
    const raised = u.clone().multiplyScalar(0.35).addScaledVector(UP, 0.9).normalize();
    const dir = raised.lerp(u, tau).normalize();
    aim(g.armR, dir);
    paddle.visible = impl.dual;
    if (impl.dual) {
      // Roll the blade about the arm's axis so its face looks toward Jack: forward as it is raised, down onto him as it lands.
      const want = new V3(0, -tau, 0).addScaledVector(u, 1 - tau); want.addScaledVector(dir, -want.dot(dir));
      if (want.lengthSq() < 1e-4) want.copy(UP).negate().addScaledVector(dir, dir.y);
      want.normalize();
      g.armR.updateMatrixWorld(true);
      const zw = new V3(0, 0, 1).applyQuaternion(g.armR.getWorldQuaternion(tmpQ2));
      tool.quaternion.setFromAxisAngle(new V3(0, 1, 0), Math.atan2(zw.clone().cross(want).dot(dir.clone().negate()), zw.dot(want)));
    }
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
  };

  // Her arm is one straight block, so to land on the cheek she turns her upper body (away from Jack, her right shoulder going back) until the
  // shoulder is exactly the arm's reach from it; the paddle, with its blade, needs her further round.
  const rEuler = new THREE.Euler(0, 0, 0, 'YXZ'), shoulderLocal = new V3(-4 - 1.5, 10, 0), torsoAt = new V3(0, 4, 0), tmpS = new V3();
  function solveYaw(dt) {
    const impl = IMPL[st.implement], sw = st.swing;
    const side = sw ? sw.side : (impl.dual ? 'C' : st.side === 'alt' ? st.nextSide : st.side);
    const T = world(rear[side]); if (impl.dual) T.y += 0.55;
    const dist = yaw => { rEuler.set(st.lean, yaw, 0); return tmpS.copy(shoulderLocal).applyEuler(rEuler).add(torsoAt).distanceTo(T); };
    let lo = -1.3, hi = 0.4;                         // distance falls as yaw rises
    for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (dist(mid) > impl.reach) lo = mid; else hi = mid; }
    const target = (lo + hi) / 2;
    st.yaw = st.yaw == null ? target : st.yaw + (target - st.yaw) * Math.min(1, dt * 8);
  }

  // ── Frame loop ──────────────────────────────────────────────────────────────────────────────────────────────────────────
  function repaint() {
    st.expr = exprFor();
    B.paintJackInto(jack.skin, { trousers: st.trousers, drawers: st.drawers, marks: st.marks, expr: st.expr });
    jack.tex.needsUpdate = true;
    B.paintGlutesInto(glutes.skin, { trousers: st.trousers, drawers: st.drawers, marks: st.marks }); glutes.tex.needsUpdate = true;
    jack.legL.ring.visible = jack.legR.ring.visible = st.trousers === 'down';
    dirty = false;
  }
  function update(dt) {
    J.t += dt; J.kick *= Math.exp(-dt * 4.5);
    st.lean += (IMPL[st.implement].lean - st.lean) * Math.min(1, dt * 3);   // she sits back further to reach with the paddle
    if (st.swing) advance(dt);
    else if (st.runLeft > 0 && canStrike()) { st.gap -= dt; if (st.gap <= 0) { smack(); st.runLeft--; } }
    pain.update(dt, !!(st.swing && st.swing.phase === 'contact'));
    if (st.ended && !st.swing && st.runLeft) st.runLeft = 0;
    if (exprFor() !== st.expr) dirty = true;
    repaintAt -= dt; if (dirty && repaintAt <= 0) { repaint(); repaintAt = 0.12; }
    // Jack's size (the premise: he shrinks on arrival): his frame is scaled about his hip joint, which is re-placed so his torso's centre is still
    // over the centre of her thighs and his belly still rests on them (their tops are at y = 8, 8.75 under the skirt; his body is 4 deep).
    const sz = st.size; frame.scale.setScalar(sz);
    frame.position.set(-6 * sz, 8.75 + 2 * sz + 0.7 * J.kick * sz, P.z);
    B.step(jack, dt); scene.updateMatrixWorld(true);
    solveYaw(dt); B.step(gerda, dt);
    controls.update(); renderer.render(scene, camera);
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
  const api = {
    scene, camera, controls, renderer, gerda, jack, pain, st, IMPL, BANDS, J,
    on: f => events.push(f),
    update, view: view_, smack,
    run(n) { if (!canStrike()) return; st.runLeft = Math.max(1, n | 0); st.gap = 0; },
    stop() { st.runLeft = 0; },
    end() { if (st.ended) return; st.ended = true; st.runLeft = 0; say('end', { red: false, hits: st.hits, peak: st.peak }); },
    red() { if (st.ended) return; st.ended = true; st.red = true; st.runLeft = 0; st.swing = null; say('end', { red: true, hits: st.hits, peak: st.peak }); },
    reset() { pain.reset(); Object.assign(st, { hits: 0, ended: false, red: false, peak: 0, swing: null, runLeft: 0, marks: { L: 0, R: 0 }, last: null }); J.kick = 0; dirty = true; say('reset', {}); },
    size(v) { st.size = clamp(v, 0.1, 1); },
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

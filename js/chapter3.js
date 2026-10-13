// Climbing Toward Consequence — Chapter Three, the opening cutscene: the beanstalk.
//   Jack lies on his pallet bed in his drawers and a white nightshirt, under a blanket, facing the wall. The fire is banked low and it is still dark. He rolls onto his back as he wakes and wonders
//   that it is still night though he does not feel tired; he throws off the blanket, sits up (and is reminded of last night's ache), rises, walks to the window, gasps, and runs for the door and out.
//   Cut to outside, on the door as he comes out and turns, agog, to the beans he planted; the camera lifts to show a gigantic beanstalk growing from the 3 x 3 patch. His mother will eat her words
//   when she sees it, he says, but perhaps something of more value lies at the top: he will climb it, and be back before she wakes. He goes back in.
// A beat is one camera angle (see G.cut in game.js); everyone is put where they stand as it begins.
// Exposes Chapter3.run(G, W) (W is Night.build's world) and Chapter3.buildStalk(scene).
(function (root) {
'use strict';
const THREE = root.THREE, B = root.Blocky, F = root.Farm, A = root.GameAudio, V3 = THREE.Vector3;
const v = (x, y, z) => new V3(x, y, z), clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const ease = x => x * x * (3 - 2 * x);
const turn = (from, to, t) => { const d = ((to - from + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return from + d * t; };
const SC = 0.95, PLOT = F.PLOT;
const basis = (x, y, z) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
const Q_SIDE = basis(v(0, 1, 0), v(-1, 0, 0), v(0, 0, 1)), Q_BACK = basis(v(0, 0, -1), v(-1, 0, 0), v(0, 1, 0)), Q_SIT = basis(v(0, 0, -1), v(0, 1, 0), v(1, 0, 0));

// ── The beanstalk: five vines from the five furrows, braiding into one great stalk that climbs out of sight, with leaves, tendrils and pods. ──
function buildStalk(scene) {
  const g = new THREE.Group(); scene.add(g); const box = F.box, plain = F.plain;
  const green = [plain('#3f7f3a'), plain('#4a8f42'), plain('#37703a'), plain('#58a04a')], leafM = [plain('#4f9a46'), plain('#3f8a3c'), plain('#62ab52')], pod = plain('#7ab85a');
  const cx = PLOT.cx, cz = PLOT.cz, PIP = [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]].map(([i, j]) => v(cx + i * PLOT.cell, 0, cz + j * PLOT.cell));
  // The five vines lean in from their furrows and join at about 70 up.
  PIP.forEach((p, k) => { for (let s = 0; s < 8; s++) { const t = s / 8, x = lerp(p.x, cx, t * t), z = lerp(p.z, cz, t * t), y = 4 + t * 70, m = box(7 - t * 2, 11, 7 - t * 2, green[k % 4], x, y, z, g); m.rotation.y = k + t * 3; m.rotation.z = (cx - p.x) * 0.004 * t; m.rotation.x = -(cz - p.z) * 0.004 * t; } });
  // The stalk: it twists as it climbs, thinning a little, bending now one way and now another.
  const N = 74; let top = null;
  for (let s = 0; s < N; s++) {
    const y = 70 + s * 10, t = s / N, w = lerp(15, 7, t), sway = Math.sin(s * 0.19) * (8 + t * 40), sway2 = Math.cos(s * 0.15) * (6 + t * 36), x = cx + sway, z = cz + sway2;
    const m = box(w, 11, w, green[s % 4], x, y, z, g); m.rotation.y = s * 0.42;
    box(w * 0.35, 12, w * 0.35, plain('#8bc46a'), x + Math.cos(s * 0.42) * w * 0.5, y, z + Math.sin(s * 0.42) * w * 0.5, g).rotation.y = s * 0.42;       // a pale rib winding up it
    if (s % 3 === 1) { const a = s * 1.3, L = 30 + (1 - t) * 26; const leaf = new THREE.Group(); leaf.position.set(x, y, z); leaf.rotation.y = a; leaf.rotation.z = -0.25; g.add(leaf);
      box(L, 1.4, 14, leafM[s % 3], L / 2 + w / 2, 0, 0, leaf); box(L * 0.7, 1.4, 9, leafM[(s + 1) % 3], L * 0.9, 0.4, 7, leaf); box(L * 0.7, 1.4, 9, leafM[(s + 2) % 3], L * 0.9, 0.4, -7, leaf); }
    if (s % 8 === 5) { const a = s * 0.9; box(2, 2, 22, pod, x + Math.cos(a) * w, y - 4, z + Math.sin(a) * w, g).rotation.y = -a; }
    top = [x, y, z];
  }
  // A last curl of tendril at the very top, and a faint glow at the base where the beans were.
  box(30, 3, 3, green[1], top[0] + 16, top[1] + 8, top[2], g).rotation.z = 0.5; const light = new THREE.PointLight(0x9be07a, 0.7, 120, 1.5); light.position.set(cx, 20, cz); g.add(light);
  for (const p of PIP) box(CELL_ - 2, 1.2, CELL_ - 2, plain('#33241a'), p.x, 0.7, p.z, g);        // (the five tilled squares)
  return g;
}
const CELL_ = F.PLOT.cell;

async function run(G, W) {
  const { ext, int, jackIn, jackOut, ja, aOut } = W, A_ = A, I = int.scene, E = ext.scene;
  G.mode = 'cutscene'; document.body.classList.add('cutscene'); G.drone = null; G.keepLine = false;
  // ── The room, in the dark, the fire banked low. ──
  int.setBank(0.12); int.hemi.intensity = 0.1; int.dim.intensity = 0.03;
  const moon = new THREE.PointLight(0x8aa0d8, 0.7, 95, 1.4); moon.position.set(-34, 30, 64); I.add(moon);
  for (const m of int.bedBlanket) m.visible = false;
  W.paintJack(jackIn, { outfit: 'Night', expr: 1 });
  jackIn.root.visible = true; jackIn.root.scale.setScalar(SC); W.mother.root.visible = false; int.chair.visible = true;
  const blanket = new THREE.Group(); const bl = F.box(32, 2.4, 18.4, F.plain('#6a4a3a'), 0, 0, 0, blanket); F.box(32.2, 2.5, 4, F.plain('#8a6a4a'), 0, 0.1, -7, blanket); I.add(blanket);
  // ── Jack's body: limbs by a few numbers, the whole of him placed by the point of his hips and which way up he lies. ──
  const P = { thigh: -0.25, knee: 0.5, armX: 0.2, armZ: 0.12, torso: 0.1, neckX: 0.15, neckY: 0, rub: 0, lie: 1 };
  jackIn.after = r => {
    const sw = Math.sin(ja.phase) * clamp(ja.speed / 20, 0, 1) * (ja.speed > 35 ? 1.15 : 0.7), t = ja.t, br = 0.02 * Math.sin(t * 1.7) * P.lie;
    r.hips.position.y = 12 + Math.abs(Math.sin(ja.phase)) * 0.5 * clamp(ja.speed / 20, 0, 1);
    r.legL.thigh.rotation.set(P.thigh + sw, 0, 0.03); r.legR.thigh.rotation.set(P.thigh - sw, 0, -0.03); r.legL.knee.rotation.set(P.knee, 0, 0); r.legR.knee.rotation.set(P.knee, 0, 0);
    for (const [a, sg] of [[r.armL, 1], [r.armR, -1]]) {
      a.rotation.x = lerp(P.armX + (sg > 0 ? -sw : sw) * 0.9, 0.34 + 0.05 * Math.sin(t * 5 + sg), P.rub); a.rotation.z = lerp(sg * P.armZ, -sg * 0.3, P.rub);
    }
    r.torso.rotation.set(P.torso + br, 0, 0); r.neck.rotation.set(P.neckX, P.neckY, 0);
  };
  const hipsLocal = v(0, 12 * SC, 0);
  const setBody = (Q, p) => { jackIn.root.quaternion.copy(Q); jackIn.root.position.copy(p).sub(hipsLocal.clone().applyQuaternion(Q)); };
  const tween = async (secs, fn) => { const t0 = G.t; for (;;) { const k = clamp((G.t - t0) / secs, 0, 1); fn(k, ease(k)); if (k >= 1) break; await G.wait(0.03); } };
  const BED_Y = 6.2, HIPS_SIDE = v(-28.5, BED_Y + 4.2, 62.5), HIPS_BACK = v(-28.5, BED_Y + 2.4, 62), HIPS_SIT = v(-34, BED_Y + 2.2, 62);
  const placeBlanket = (x, y, z, sx) => { blanket.position.set(x, y, z); blanket.scale.set(sx == null ? 1 : sx, 1, 1); };
  const sleeping = () => { P.lie = 1; P.thigh = -0.25; P.knee = 0.55; P.armX = 0.25; P.armZ = 0.1; P.torso = 0.12; P.neckX = 0.1; P.neckY = 0; P.rub = 0; ja.speed = 0; setBody(Q_SIDE, HIPS_SIDE); placeBlanket(-31, 11.2, 62.2, 1); };
  const cams = {
    room: { pos: v(-14, 40, 20), look: v(-34, 8, 62), fov: 52 },
    over: { pos: v(-32, 34, 42), look: v(-33, 9, 62), fov: 40 },
    sit: { pos: v(-8, 26, 48), look: v(-34, 14, 62), fov: 44 },
    window: { pos: v(4, 22, 60), look: v(-34, 22, 68), fov: 40 },
    run: { pos: v(-70, 46, 30), look: v(-4, 10, 60), fov: 56 },
    door: { pos: v(30, 20, 40), look: v(34, 16, 72), fov: 46 },
  };
  G.setScene(W.iworld);
  A_ && A_.ambience({ wind: 0.12, birds: 0, fire: 0.25 });

  // ── 1. The room: the bed, a sleeper under a blanket, facing the wall. ──
  G.cut(cams.room, () => { sleeping(); });
  G.fade(false, 1.6); await G.wait(3.2);
  // ── 2. He wakes: rolls onto his back. ──
  G.cut(cams.over, () => { sleeping(); });
  await G.wait(1.4);
  await tween(1.6, (k, e) => {
    jackIn.root.quaternion.slerpQuaternions(Q_SIDE, Q_BACK, e); const p = HIPS_SIDE.clone().lerp(HIPS_BACK, e); jackIn.root.position.copy(p).sub(hipsLocal.clone().applyQuaternion(jackIn.root.quaternion));
    P.thigh = lerp(-0.25, 0, e); P.knee = lerp(0.55, 0.1, e); P.armX = lerp(0.25, 0.05, e); blanket.position.z = 62.2; W.paintJack(jackIn, { outfit: 'Night', expr: k > 0.6 ? 0 : 1 });
  });
  W.paintJack(jackIn, { outfit: 'Night', expr: 0 });
  await G.wait(0.8);
  await G.say('jack', 'Still dark. It must still be night.');
  await G.say('jack', 'Strange... I don’t feel the least bit tired.');
  // ── 3. The blanket thrown back; he sits up, and remembers. ──
  G.cut(cams.sit, () => { P.lie = 1; P.thigh = 0; P.knee = 0.1; P.armX = 0.05; P.rub = 0; setBody(Q_BACK, HIPS_BACK); placeBlanket(-31, 11, 62.2, 1); });
  await tween(0.9, (k, e) => { placeBlanket(lerp(-31, -8, e), lerp(11, 8.6, e), lerp(62.2, 66, e), lerp(1, 0.55, e)); P.armX = lerp(0.05, -0.9, Math.sin(e * Math.PI)); });
  await tween(1.3, (k, e) => {
    jackIn.root.quaternion.slerpQuaternions(Q_BACK, Q_SIT, e); const p = HIPS_BACK.clone().lerp(HIPS_SIT, e); jackIn.root.position.copy(p).sub(hipsLocal.clone().applyQuaternion(jackIn.root.quaternion));
    P.thigh = lerp(0, -1.5, e); P.knee = lerp(0.1, 0, e); P.torso = lerp(0.1, 0.05, e); P.neckX = lerp(0.1, 0.25, e); P.lie = 1 - e;
  });
  W.paintJack(jackIn, { outfit: 'Night', expr: 1 }); A_ && A_.voice && A_.voice(0.5, 2, 0, 0.5);            // the ache from the night before
  await tween(1.2, (k, e) => { P.rub = Math.sin(Math.min(1, k * 1.2) * Math.PI) * 1; P.torso = 0.05 + 0.12 * Math.sin(k * Math.PI); });
  P.rub = 0; W.paintJack(jackIn, { outfit: 'Night', expr: 0 });
  await G.wait(0.5);
  // ── 4. He rises, onto the pallet, and goes to the window. ──
  G.cut(cams.sit, () => { P.lie = 0; P.thigh = -1.5; P.knee = 0; P.rub = 0; P.torso = 0.05; setBody(Q_SIT, HIPS_SIT); placeBlanket(-8, 8.6, 66, 0.55); });
  const STAND_Y = BED_Y + 12 * SC;
  await tween(0.9, (k, e) => { setBody(Q_SIT, v(-34, lerp(BED_Y + 2.2, STAND_Y, e), 62)); P.thigh = lerp(-1.5, 0, e); P.neckX = lerp(0.25, 0.1, e); });
  jackIn.root.quaternion.setFromAxisAngle(v(0, 1, 0), Math.PI / 2); jackIn.root.position.set(-34, BED_Y, 62);
  const heading = { y: Math.PI / 2 };
  const walkTo = async (to, speed, h0) => {                                                                // walk along the ground (and over the pallet), heading his way
    let ws = G.t; const from = jackIn.root.position.clone();
    for (;;) {
      const d = Math.hypot(to.x - jackIn.root.position.x, to.z - jackIn.root.position.z); if (d < 1.2) break;
      const want = Math.atan2(to.x - jackIn.root.position.x, to.z - jackIn.root.position.z), stp = Math.min(d, speed * 0.04); heading.y = turn(heading.y, want, 0.3);
      jackIn.root.quaternion.setFromAxisAngle(v(0, 1, 0), heading.y); jackIn.root.position.x += Math.sin(heading.y) * stp; jackIn.root.position.z += Math.cos(heading.y) * stp;
      const onBed = jackIn.root.position.x > -57 && jackIn.root.position.x < -11 && jackIn.root.position.z > 52 && jackIn.root.position.z < 72; jackIn.root.position.y = lerp(jackIn.root.position.y, onBed ? BED_Y : 0, 0.35);
      ja.speed = speed * 0.95; ja.phase += stp * 0.42; await G.wait(0.04);
    }
    ja.speed = 0;
  };
  P.lie = 0; P.armX = 0.05; P.armZ = 0.1; P.knee = 0; P.torso = 0.05;
  await walkTo(v(-34, 0, 68.5), 14, Math.PI / 2);
  heading.y = turn(heading.y, 0, 1); jackIn.root.quaternion.setFromAxisAngle(v(0, 1, 0), 0);
  // ── 5. At the window: he looks out, and gasps. ──
  G.cut(cams.window, () => { P.lie = 0; P.thigh = 0; P.knee = 0; P.rub = 0; P.torso = 0.05; ja.speed = 0; jackIn.root.position.set(-34, BED_Y, 68.2); jackIn.root.quaternion.setFromAxisAngle(v(0, 1, 0), 0); heading.y = 0; placeBlanket(-8, 8.6, 66, 0.55); });
  await G.wait(0.9);
  A_ && A_.voice && A_.voice(0.9, 4, 0, 0.9);                                                               // the gasp
  W.paintJack(jackIn, { outfit: 'Night', expr: 3 });
  await tween(0.5, (k, e) => { P.armX = lerp(0.05, -0.5, e); P.armZ = lerp(0.1, 0.5, e); P.torso = lerp(0.05, -0.1, e); P.neckX = lerp(0.1, -0.1, e); });
  await G.wait(0.9);
  // ── 6. He runs for the door. ──
  G.cut(cams.run, () => { P.lie = 0; P.thigh = 0; P.knee = 0; P.rub = 0; P.armX = -0.5; P.armZ = 0.5; P.torso = -0.1; P.neckX = -0.1; jackIn.root.position.set(-34, BED_Y, 68.2); heading.y = 0; jackIn.root.quaternion.setFromAxisAngle(v(0, 1, 0), 0); });
  P.armX = 0.2; P.armZ = 0.1; P.torso = 0.18; P.neckX = 0.1;
  const dpos = v(34, 0, 74);
  await walkTo(v(-34, 0, 54), 40); await walkTo(v(30, 0, 62), 52);
  G.cut(cams.door, () => { P.lie = 0; P.thigh = 0; P.knee = 0; P.rub = 0; P.armX = 0.2; P.armZ = 0.1; P.torso = 0.18; P.neckX = 0.1; jackIn.root.position.set(30, 0, 62); heading.y = Math.atan2(4, 12); ja.speed = 0; });
  { const w = walkTo(v(34, 0, 71), 52); await tween(0.5, (k, e) => { int.doorLeaf.rotation.y = lerp(0, -1.9, e); }); A_ && A_.latch && A_.latch(); await w; }
  await walkTo(v(36, 0, 82), 52);
  jackIn.root.visible = false; I.remove(moon); I.remove(blanket);

  // ── 7. Outside: the door, and Jack coming out of it. ──
  W.paintJack(jackOut, { outfit: 'Night', expr: 4 });
  const stalk = buildStalk(E);
  const DOOR = v(34, 0, 22), look = { y: 0 };
  G.setScene(W.world); A_ && A_.ambience({ wind: 0.4, birds: 0, fire: 0 });
  const outPose = () => { aOut.speed = 0; aOut.fist = 0; aOut.hold = 0; aOut.cover = 0; aOut.crouch = 0; aOut.dig = 0; aOut.carry = 0; aOut.bow = 0; aOut.look = 0; };
  G.cut({ pos: v(60, 22, 52), look: v(34, 18, 24), fov: 46 }, () => { outPose(); jackOut.root.visible = true; jackOut.root.position.set(DOOR.x + 2, 0, DOOR.z + 2); jackOut.root.rotation.y = 0; ext.doorLeaf.rotation.y = -1.9; });
  await G.fade(false, 0.5);
  { let h = 0; const to = v(40, 0, 44); for (;;) { const d = Math.hypot(to.x - jackOut.root.position.x, to.z - jackOut.root.position.z); if (d < 1) break; const stp = Math.min(d, 46 * 0.04); h = turn(h, Math.atan2(to.x - jackOut.root.position.x, to.z - jackOut.root.position.z), 0.3); jackOut.root.rotation.y = h; jackOut.root.position.x += Math.sin(h) * stp; jackOut.root.position.z += Math.cos(h) * stp; aOut.speed = 44; aOut.phase += stp * 0.42; await G.wait(0.04); } }
  aOut.speed = 0;
  // He turns, to the beans he planted, agog.
  await tween(0.9, (k, e) => { jackOut.root.rotation.y = lerp(jackOut.root.rotation.y, -Math.PI / 2 - 0.1, e); });
  W.paintJack(jackOut, { outfit: 'Night', expr: 3 }); aOut.hold = 0.35; aOut.bow = -0.3;
  await G.wait(1.2);
  // ── 8. The camera lifts, and the beanstalk is revealed. ──
  await G.shot({ pos: v(150, 150, 300), look: v(-60, 240, 0), fov: 62 }, 8, 'inOut');
  await G.say('jack', 'Mother will eat every word when she sees this.');
  await G.say('jack', '...But perhaps something worth more than her words lies at the top.');
  await G.say('jack', 'I’ll climb it. I’ll be back before she wakes.');
  // ── 9. He goes back inside. ──
  G.cut({ pos: v(70, 30, 70), look: v(34, 16, 26), fov: 50 }, () => { aOut.hold = 0; aOut.bow = 0; jackOut.root.position.set(40, 0, 44); jackOut.root.rotation.y = Math.PI; });
  { let h = Math.PI; const to = v(36, 0, 28); for (;;) { const d = Math.hypot(to.x - jackOut.root.position.x, to.z - jackOut.root.position.z); if (d < 1) break; const stp = Math.min(d, 22 * 0.04); h = turn(h, Math.atan2(to.x - jackOut.root.position.x, to.z - jackOut.root.position.z), 0.3); jackOut.root.rotation.y = h; jackOut.root.position.x += Math.sin(h) * stp; jackOut.root.position.z += Math.cos(h) * stp; aOut.speed = 22; aOut.phase += stp * 0.42; await G.wait(0.04); } }
  { let h = Math.PI; for (let i = 0; i < 40; i++) { jackOut.root.position.z -= 0.35; aOut.speed = 20; aOut.phase += 0.3; await G.wait(0.04); } }
  jackOut.root.visible = false; aOut.speed = 0;
  { const t0 = G.t; await tween(0.7, (k, e) => { ext.doorLeaf.rotation.y = lerp(-1.9, 0, e); }); A_ && A_.thwack && A_.thwack(0.3, true, 0.5); }
  await G.wait(1.4);
  A_ && A_.stopMusic && A_.stopMusic(2.5); await G.fade(true, 2.2); A_ && A_.ambience({ wind: 0, birds: 0, fire: 0 });
  G.hideLine && G.hideLine(); await G.wait(0.8);
  G.mode = 'end'; document.body.classList.remove('cutscene');
  return { stalk };
}

root.Chapter3 = { run, buildStalk };
})(typeof window !== 'undefined' ? window : globalThis);

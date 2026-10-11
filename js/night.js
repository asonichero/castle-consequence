// Climbing Toward Consequence — the close of Chapter Two: the cottage at night.
//   Jack comes home through the gate and up to the door under the stars; then, indoors, he tells his Mother what he has done with the cow, in a tone set by the choices he made at the
//   Peddler's cart; she is furious, sits him down in front of the hearth and takes him over her knee (bared; the lap scene's engine, in this room). If he was at his most brash she is
//   not finished with the hand: she sends him for the birch that hangs by the hearth and bends him over the kitchen table for a last, sharper round. Then she stands him up and sends him
//   out to plant the beans, if they are so powerful.
(function (root) {
'use strict';
const THREE = root.THREE, B = root.Blocky, C = root.Cast, F = root.Farm, Lap = root.Lap, A = root.GameAudio, V3 = THREE.Vector3;
const v = (x, y, z) => new V3(x, y, z), clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const turn = (from, to, t) => { const d = ((to - from + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return from + d * t; };
const SC = 0.95, STAGE_Y = 5.7;
const SEAT = { x: -26, z: -24, ry: Math.PI / 2 }, TABLE = { x: 46, z: 22.4, ry: -Math.PI / 2 };       // where the lap scene's stage stands for each part of it

// How brash Jack was at the cart, from his three choices: 0 (the most humble) to 6.
function brashness(choices) {
  const c = choices || [];
  return [2, 1, 0][c[0]] + [1, 0, 2][c[1]] + [2, 1, 0][c[2]] || 0;
}
const tierOf = c => { const b = brashness(c); return b >= 5 ? 2 : b >= 3 ? 1 : 0; };     // 0 humble, 1 cheeky, 2 brash

// ── The night outside: the same farm, under the stars. ──
function nightify(ext) {
  const s = ext.scene, T = F.textures();
  s.background = new THREE.Color(0x070b18); s.fog = new THREE.Fog(0x070b18, 220, 900);
  s.traverse(o => {
    if (o.isHemisphereLight) { o.color.set(0x6a7ab8); o.groundColor.set(0x1a1a24); o.intensity = 0.75; }
    else if (o.isDirectionalLight) { o.color.set(0x9db4f0); o.intensity = 0.55; }
    if (o.isMesh && o.material && o.material.map === T.cloud) o.visible = false;
  });
  const pts = []; let seed = 7; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 260; i++) { const th = rnd() * Math.PI * 2, ph = 0.15 + rnd() * 1.2; pts.push(Math.cos(th) * Math.cos(ph) * 1500, Math.sin(ph) * 1500, Math.sin(th) * Math.cos(ph) * 1500); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  s.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 5, sizeAttenuation: false, fog: false })));
  const moon = new THREE.Mesh(new THREE.BoxGeometry(60, 60, 8), new THREE.MeshBasicMaterial({ color: 0xf4f0d8, fog: false })); moon.position.set(-700, 700, -900); moon.lookAt(0, 0, 0); s.add(moon);
  // The warmth of the windows and the door spilling out onto the yard.
  for (const [x, y, z, i] of [[-34, 30, 40, 1.1], [8, 30, 40, 1.1], [34, 20, 40, 0.9]]) { const l = new THREE.PointLight(0xffb060, i, 150, 1.5); l.position.set(x, y, z); s.add(l); }
  ext.cow.visible = false;
}

function build(G) {
  const ext = F.exterior(); nightify(ext);
  const int = F.interior(), scene = int.scene;
  // ── Actors: Jack and his Mother as they stand and walk and talk. (The lap scene brings its own pair, matched to these where it takes over.) ──
  const paintJack = (rig, o) => { B.paintJackInto(rig.skin, Object.assign({ outfit: 'Outdoor', expr: 0, trousers: 'up', drawers: 'up' }, o || {})); rig.tex.needsUpdate = true; rig.legL.ring.visible = rig.legR.ring.visible = !!(o && o.trousers === 'down'); };
  const mk = () => {
    const j = B.makeJack(); j.root.scale.setScalar(SC); paintJack(j); B.setPose(j, 'stand'); for (let i = 0; i < 30; i++) B.step(j, 0.1); return j;
  };
  const ja = { t: 0, phase: 0, speed: 0, bare: 0, hold: 0, cover: 0, bow: 0, look: 0, fist: 0, shuffle: 0 };
  const hold = (rig, st) => { rig.after = r => st(r); return rig; };
  const jackOut = mk(), jackIn = mk();                       // outside under the stars, and in the room
  const poseJack = (rig, a) => r => {
    const sw = Math.sin(a.phase) * clamp(a.speed / 20, 0, 1) * (a.shuffle ? 0.35 : 0.7), idle = 0.015 * Math.sin(a.t * 1.1);
    r.legL.thigh.rotation.x = sw; r.legR.thigh.rotation.x = -sw;
    r.armL.rotation.x = -sw * 0.8 + idle; r.armR.rotation.x = sw * 0.8 - idle; r.armL.rotation.z = r.armR.rotation.z = 0;
    if (a.fist) { r.armR.rotation.x = -1.0 * a.fist; r.armR.rotation.z = -0.15; }
    if (a.hold) { r.armL.rotation.x = r.armR.rotation.x = -1.25 * a.hold; r.armL.rotation.z = 0.2; r.armR.rotation.z = -0.2; }
    if (a.cover) { r.armL.rotation.x = r.armR.rotation.x = 0.7 * a.cover; r.armL.rotation.z = -0.35 * a.cover; r.armR.rotation.z = 0.35 * a.cover; }
    r.neck.rotation.x = 0.28 * a.bow + 0.03 * Math.sin(a.t * 0.9); r.neck.rotation.y = a.look; r.torso.rotation.x = 0.06 * a.bow;
    r.hips.position.y = 12 + Math.abs(Math.sin(a.phase)) * 0.5 * clamp(a.speed / 20, 0, 1);
  };
  const aOut = { t: 0, phase: 0, speed: 0, bare: 0, hold: 0, cover: 0, bow: 0, look: 0, fist: 0, shuffle: 0 }, aIn = ja;
  hold(jackOut, poseJack(jackOut, aOut)); hold(jackIn, poseJack(jackIn, aIn));
  jackOut.root.visible = false; ext.scene.add(jackOut.root);
  const mother = C.makeMother(); mother.setExpr(1);
  const ma = { t: 0, phase: 0, speed: 0, wag: 0, gesture: 0, fold: 0, chin: 0, tilt: 0, birch: 0, point: 0 };
  mother.after = r => {
    const s = Math.sin(ma.phase) * clamp(ma.speed / 12, 0, 1) * 0.6, t = ma.t;
    if (mother.pose !== 'sit') { r.legL.thigh.rotation.x = s; r.legR.thigh.rotation.x = -s; }
    const f = ma.fold;
    r.armL.rotation.x = (mother.pose === 'sit' ? -0.9 : -0.05) * (1 - f) - 1.0 * f; r.armL.rotation.z = -0.1 * (1 - f) + 0.55 * f;
    r.armR.rotation.x = (-0.5 - 0.5 * ma.gesture + ma.wag * 0.14 * Math.sin(t * 8) - 0.5 * ma.point) * (1 - f) - 1.1 * f; r.armR.rotation.z = (0.15 + 0.1 * ma.gesture) * (1 - f) - 0.55 * f;
    if (r.elbow) r.elbow.rotation.x = (-0.3 - 0.9 * ma.gesture) * (1 - f) - 0.6 * f;
    r.neck.rotation.y = ma.chin * 0.65; r.neck.rotation.x = 0.05 + 0.04 * Math.sin(t * 0.7); r.neck.rotation.z = ma.tilt * 0.12;
  };
  const mBirch = B.makeBirch(); mBirch.root.visible = false; mother.wrist.add(mBirch.root); mBirch.root.position.set(0, -6, 0);
  const jBirch = B.makeBirch(); jBirch.root.visible = false; jackIn.armR.add(jBirch.root); jBirch.root.position.set(0, -11.5, 1.2); jBirch.root.rotation.x = -1.3;
  scene.add(mother.root); scene.add(jackIn.root);
  int.chair.visible = true;
  // ── The lap scene's stage, in the room. ──
  const lap = Lap.create(null, { external: { scene, camera: G.camera, renderer: G.renderer }, table: false, jackFull: 1 });
  lap.giver('mother', 1); lap.stage.scale.setScalar(SC); lap.stage.visible = false; lap.jack.root.visible = true;
  lap.pain.stats.tolerance = 0; lap.pain.stats.resilience = 0.2; lap.st.noRecovery = true; lap.st.side = 'alt';
  // The stage stands where the scene needs it: at the chair, or at the table.
  const placeStage = at => { lap.stage.position.set(at.x, STAGE_Y, at.z); lap.stage.rotation.y = at.ry; lap.stage.updateMatrixWorld(true); };
  const world = { scene: ext.scene, update(dt, t) { ext.update(dt, t); aOut.t += dt; B.step(jackOut, dt); } };
  const iworld = { scene, update(dt, t) { int.update(dt, t); ja.t += dt; ma.t += dt; B.step(jackIn, dt); B.step(mother, dt); if (lap.stage.visible) lap.update(dt); } };
  // Where the lap scene's stage stands: at the chair, and at the table (its edge, on the side the room editor leaves the table facing).
  const ch = int.spots.chair, tb = int.table, SEAT = { x: ch.x, z: ch.z, ry: int.spots.chairRy }, tr = tb.rotation.y, TABLE = { x: tb.position.x - 7.6 * Math.sin(tr), z: tb.position.z - 7.6 * Math.cos(tr), ry: -Math.PI / 2 + tr };
  return { SEAT, TABLE, ext, int, jackOut, aOut, jackIn, ja, mother, ma, mBirch, jBirch, lap, placeStage, paintJack, world, iworld, scene };
}

// A point given in the lap stage's own units, in the world as the stage stands now.
const sp = (W, x, y, z) => W.lap.stage.localToWorld(v(x, y, z));
function stageShot(W, pos, at, fov) { W.lap.stage.updateMatrixWorld(true); return { pos: sp(W, ...pos), look: sp(W, ...at), fov: fov || 40 }; }

// ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
async function run(G, choices, opts) {
  opts = opts || {};
  const W = build(G), tier = tierOf(choices), say = G.say, who = (w, t, o) => G.say(w, t, o);
  const { jackOut, aOut, jackIn, ja, mother, ma, mBirch, jBirch, lap, int, ext, SEAT, TABLE } = W;
  const pick = (a, b, c) => [a, b, c][tier];
  G.mode = 'cutscene'; document.body.classList.add('cutscene'); G.drone = null;
  const walk = async (rig, a, pts, speed, face) => {                    // walk a rig through points, its feet going
    for (const q of pts) {
      let d = Math.hypot(q.x - rig.root.position.x, q.z - rig.root.position.z);
      while (d > 1.2) {
        const ang = Math.atan2(q.x - rig.root.position.x, q.z - rig.root.position.z), step = Math.min(d, speed * 0.04);
        rig.root.rotation.y = turn(rig.root.rotation.y, ang, 0.35); rig.root.position.x += Math.sin(ang) * step; rig.root.position.z += Math.cos(ang) * step; a.speed = speed * 0.95; a.phase += step * 0.42 * (a.shuffle ? 1.4 : 1);
        await G.wait(0.04); d = Math.hypot(q.x - rig.root.position.x, q.z - rig.root.position.z);
      }
    }
    a.speed = 0; if (face != null) rig.root.rotation.y = face;
  };
  // ── 1. Outside: home through the gate, up the path to the door. ──
  G.setScene(W.world); A && A.ambience({ wind: 0.25, birds: 0, fire: 0 }); A && A.duckMusic(0.5, 2); A && A.startMusic({ dark: true });
  jackOut.root.visible = true; jackOut.root.position.set(0, 0, 150); jackOut.root.rotation.y = Math.PI; aOut.fist = 1; aOut.bow = 0.2; W.paintJack(jackOut, { expr: pick(1, 5, 5) });
  const outShots = {
    gate: { pos: v(-62, 20, 176), look: v(4, 14, 100), fov: 46 },
    path: { pos: v(-40, 16, 88), look: v(6, 14, 60), fov: 48 },
    door: { pos: v(84, 16, 56), look: v(30, 16, 26), fov: 44 },
  };
  G.cut(outShots.gate); await G.fade(false, 1.6);
  const walkOut = walk(jackOut, aOut, [v(0, 0, 128), v(0, 0, 66), v(34, 0, 62), v(34, 0, 29)], 24, Math.PI);
  await G.wait(3.2); G.cut(outShots.path);
  await G.wait(3.4); G.cut(outShots.door);
  await walkOut;
  await G.wait(0.6);
  await who('jack', pick('Perhaps I should have said no.', 'She’ll understand, once she sees them.', 'Home before the lamps burn low. Wait until she sees what I’ve brought.'));
  await G.wait(0.4); A && A.thwack(0.3, true, 0.5);
  await G.fade(true, 1.0);

  // ── 2. Indoors: the telling. ──
  G.setScene(W.iworld); jackOut.root.visible = false; aOut.fist = 0;
  A && A.ambience({ wind: 0.1, birds: 0, fire: 0.8 });
  mother.root.visible = true; jackIn.root.visible = true; lap.stage.visible = false;
  int.chair.visible = true; mother.setExpr(1); B.setPose(mother, 'stand'); mother.pose = 'stand'; ma.fold = 1; ma.wag = 0; ma.gesture = 0; ma.chin = 0;
  mother.root.position.set(-22, 0, -27); mother.root.rotation.y = Math.PI / 2; jackIn.root.position.set(34, 0, 50); jackIn.root.rotation.y = Math.PI; W.paintJack(jackIn, { expr: pick(1, 5, 5) }); ja.fist = 1;
  for (let i = 0; i < 20; i++) { B.step(mother, 0.1); B.step(jackIn, 0.1); }
  const sh = {
    wide: { pos: v(-14, 24, 38), look: v(-12, 19, -27), fov: 42 },
    door: { pos: v(-10, 26, -34), look: v(30, 16, 46), fov: 50 },
    mFace: { pos: v(-10, 24, 18), look: v(-24, 21, -26), fov: 34 },
    jFace: { pos: v(-34, 22, 8), look: v(-4, 17, -26), fov: 40 },
    two: { pos: v(-14, 24, 38), look: v(-12, 19, -27), fov: 42 },
  };
  G.cut(sh.wide); await G.fade(false, 1.2); await G.wait(0.6);
  await walk(jackIn, ja, [v(34, 0, 30), v(12, 0, 26), v(12, 0, -26), v(-2, 0, -26)], 24, -Math.PI / 2);
  ja.speed = 0; ja.bow = pick(1, 0.4, 0);
  G.cut(sh.mFace);
  await who('mother', 'Where is Milky-White?');
  G.cut(sh.jFace);
  await who('jack', pick('I sold her, Mother. But not for coin. I know how it will sound.', 'I sold her, Mother. Look what I got for her.', 'Gone, Mother. Sold, and for a good deal more than coin.'));
  G.cut(sh.mFace); ma.chin = 0;
  await who('mother', 'What is in your hand, Jack?');
  G.cut(sh.two); ja.fist = 0; ja.hold = 0.8;
  await who('jack', pick('Beans. The woman said they grow whatever we need, whether we know it or not. I believed her.', 'Beans, Mother. Magic ones. The woman at the cart said they grow whatever we need.', 'Beans, Mother. Five of them, and every one enchanted. Gold, silver, ember red, moss green, and one the deep blue of a night with no end.'));
  ja.hold = 0;
  G.cut(sh.mFace);
  await who('mother', 'Beans.');
  ma.gesture = 1; ma.wag = 0.6; ma.fold = 0;
  await who('mother', 'We had one cow. One. You were to bring home coin for the roof and flour for the winter. And you have brought me five beans.');
  G.cut(sh.jFace);
  await who('jack', pick('I know. I’m sorry. I didn’t think. She spoke so well, and I wanted so badly to bring you something.', 'It was a fair trade, Mother. She said so herself.', 'It was a fair exchange. You’ll see. By spring we’ll have more than a cow’s worth, and you’ll be the first to say so.'));
  G.cut(sh.mFace); ma.wag = 1;
  await who('mother', 'A fair trade. This is the third time this week you have come home with foolishness in place of sense, and the last of our cow besides. I told you this morning. Not for stories. Not for tricks.');
  G.cut(sh.jFace);
  await who('jack', pick('Mother, please. I can fix this. I’ll find her, I’ll—', 'I did what I thought was best.', 'You never believe me! One day you’ll see I was right.'));
  G.cut(sh.mFace); ma.wag = 0.4;
  await who('mother', pick('Hush.', 'You did what pleased you.', 'I believe every word you say, Jack. That is the trouble.'));
  // She sits in the chair by the hearth, and calls him to her.
  G.cut(sh.jFace); ma.gesture = 0; ma.wag = 0; ma.fold = 0;
  await G.wait(0.4); B.setPose(mother, 'sit'); mother.pose = 'sit'; mother.root.position.set(SEAT.x, STAGE_Y, SEAT.z); mother.root.rotation.y = SEAT.ry; ma.chin = 0;
  for (let i = 0; i < 12; i++) B.step(mother, 0.1);
  G.cut(sh.two);
  await who('mother', 'Come here.');
  await who('jack', 'Mother?');
  await who('mother', 'Come here, Jack.');
  await walk(jackIn, ja, [v(-17, 0, -24)], 12, -Math.PI / 2);
  ja.speed = 0;

  // ── 3. Across her knee. ──
  W.placeStage(SEAT);
  const cams = {
    seat: stageShot(W, [-60, 20, 16], [0, 12, 6], 38),
    seatClose: stageShot(W, [-44, 16, 12], [0, 12, 6], 32),
    lap: stageShot(W, [-44, 52, 46], [-3, 9, 4], 38),
    lapBehind: stageShot(W, [-30, 16, 10], [-6, 8, 5], 36),
    lapFace: stageShot(W, [6, 14, 60], [6, 6, 4], 36),
  };
  jackIn.root.visible = false; mother.root.visible = false; lap.stage.visible = true; int.chair.visible = false;
  lap.reset(); lap.layers({ trousers: 'up', drawers: 'up' }); lap.armed(false); lap.place('seat', 0); lap.giver('mother', 1);
  lap.st.sound = true; lap.st.strength = 1.1; lap.st.pace = 1;
  G.cut(cams.seat); await G.wait(0.4);
  await who('jack', pick('Mother, please. I’ve learned, I swear it.', 'Mother, you can’t mean it.', 'You can’t be serious.'));
  lap.fumble(1); await G.wait(0.4);
  await who('mother', 'Dead serious. You were told, plain and clear.');
  G.cut(cams.seatClose);
  await who('jack', pick('I’m too old for this—', 'I’m twenty-one! You can’t treat me like a boy!', 'I’m twenty-one, Mother! You can’t just—'));
  await who('mother', 'Then stop behaving like one.');
  lap.layers({ trousers: 'down' }); A && A.blip && A.blip(); await G.wait(0.5);
  await who('jack', 'Mother!');
  lap.layers({ drawers: 'down' }); lap.fumble(0); lap.cover(1); await G.wait(0.5);
  await who('mother', 'No more clever excuses. No more compasses and lucky finds and magic anything. I am tired, Jack. Tired of clearing up after your choices.');
  lap.cover(0); lap.place('lap', 1.4); G.cut(cams.lap); await G.wait(1.7);
  // The hand.
  lap.implement('hand'); lap.st.strength = 1.1;
  const smacks = async n => {
    if (G.skipping) { lap.st.pace = 8; } else lap.st.pace = 1;
    lap.run(n); await G.wait(0.4);
    for (let i = 0; i < 400 && (lap.info().busy || lap.info().running); i++) await G.wait(0.1);
    lap.st.pace = 1;
  };
  const P_ = (hu, mi, br) => pick(hu, mi, br);
  await who('mother', 'You were trusted with a simple task.');
  await smacks(P_(5, 6, 6));
  G.cut(cams.lapBehind);
  await who('jack', pick('Ow! I’m sorry, I’m sorry!', 'Ow! It was a fair trade!', 'It was a fair trade!'));
  await who('mother', 'You sold our food for a dream, and came home smiling.');
  await smacks(P_(6, 7, 7));
  G.cut(cams.lapFace);
  await who('jack', pick('I won’t do it again, I won’t!', 'Mother, that’s enough!', 'They’re magic, Mother! You’ll see!'));
  G.cut(cams.lap);
  await who('mother', 'You think the world owes you wonders. Perhaps it does. But not like this.');
  await smacks(P_(5, 8, 8));
  await who('jack', pick('Please, Mother, I understand, I do!', 'Ow! Please!', 'I’d do it again! Ow! I would!'));
  if (tier >= 1) {
    G.cut(cams.lapBehind);
    await who('mother', 'That is for forgetting my voice.'); await smacks(3);
    await who('mother', 'For forgetting your word.'); await smacks(3);
    await who('mother', 'And for forgetting your place.'); await smacks(P_(0, 4, 5));
    G.cut(cams.lapFace);
    await who('jack', tier === 1 ? 'Yes, Mother! I’m sorry! I’m sorry!' : 'It’s not— it’s not fair! Ow! You’ll see, you’ll all see!');
  }
  await G.wait(0.5);
  lap.st.sound = true;
  if (tier < 2) {
    // The end of it: she lets him up and sets him on his feet.
    G.cut(cams.lap);
    await who('mother', tier === 0 ? 'There. That will do.' : 'There. Up.');
    lap.place('seat', 1.4); lap.cover(1); G.cut(cams.seatClose); await G.wait(1.6);
  } else {
    // He has not had enough: the birch.
    G.cut(cams.lap);
    await who('mother', 'You still think this a joke.');
    await who('jack', 'It isn’t— Mother, I— the beans—');
    await who('mother', 'Up.');
    lap.place('seat', 1.2); lap.cover(1); G.cut(cams.seatClose); await G.wait(1.4);
    await who('mother', 'Fetch me the birch.');
    await who('jack', 'The birch? Mother, no—');
    await who('mother', 'It hangs on its nail by the hearth. Fetch it. Now.');
    await who('jack', 'I’ve had enough! I’ve— I’ve had enough!');
    await who('mother', 'Not by half. Go.');
    // He goes, bare below the waist, with his trousers about his knees.
    lap.stage.visible = false; mother.root.visible = true; jackIn.root.visible = true; int.chair.visible = false; int.chair.visible = true;
    B.setPose(mother, 'sit'); mother.pose = 'sit'; mother.root.position.set(SEAT.x, STAGE_Y, SEAT.z); mother.root.rotation.y = SEAT.ry; ma.fold = 0; ma.gesture = 0.3;
    W.paintJack(jackIn, { expr: 3, trousers: 'down', drawers: 'down', marks: lap.st.marks }); ja.cover = 0; ja.shuffle = 1; ja.bow = 1;
    jackIn.root.position.set(-17, 0, -24); jackIn.root.rotation.y = -Math.PI / 2;
    const hook = int.spots.birch;
    const walkCams = { wide: { pos: v(14, 34, -2), look: v(-26, 16, -36), fov: 56 }, hook: { pos: v(-52, 26, -18), look: v(-34, 18, -50), fov: 44 } };
    G.cut(walkCams.wide);
    await walk(jackIn, ja, [v(-30, 0, -40), v(hook.x + 3, 0, hook.z + 1)], 9, -Math.PI * 0.95);
    G.cut(walkCams.hook); int.birchProp.root.visible = false; jBirch.root.visible = true; ja.hold = 0.7; await G.wait(0.8);
    await who('jack', 'Mother, please. I’ll plant them, I’ll do anything—');
    G.cut(walkCams.wide);
    await walk(jackIn, ja, [v(-30, 0, -36), v(-18, 0, -25)], 9, -Math.PI / 2);
    await who('mother', 'You will. After.');
    jBirch.root.visible = false; mBirch.root.visible = true; ja.hold = 0; ma.birch = 1;
    G.cut(sh.mFace); await who('mother', 'Over the table.');
    await who('jack', 'Mother—');
    await who('mother', 'Now, Jack.');
    // To the table: she stands, he takes his place at its edge, and bends.
    mother.root.visible = false; jackIn.root.visible = false; lap.stage.visible = true; int.chair.visible = true;
    W.placeStage(TABLE);
    int.tableClutter.visible = false; lap.layers({ trousers: 'down', drawers: 'down' }); lap.armed(true); lap.implement('birch'); lap.place('after', 0); lap.giver('mother', 1); lap.st.strength = 1.35;
    const tcams = {
      behind: stageShot(W, [-46, 22, 30], [-4, 9, -2], 40),
      above: stageShot(W, [-20, 46, 40], [-4, 9, -2], 40),
      side: stageShot(W, [-46, 22, 30], [-4, 9, -2], 40),
      face: stageShot(W, [14, 24, 46], [-4, 10, -2], 40),
    };
    G.cut(tcams.side); await G.wait(0.5);
    lap.place('table', 1.6); await G.wait(1.9);
    G.cut(tcams.behind);
    await who('mother', 'Hands flat on the table.');
    await who('jack', 'Mother, I’ve learned, I swear—');
    lap.st.pace = 1; await smacks(4);
    G.cut(tcams.face);
    await who('jack', 'Ow! Ow! Mother!');
    G.cut(tcams.above);
    await who('mother', 'Is it a fair trade now?');
    await smacks(4);
    G.cut(tcams.behind);
    await who('jack', 'No! No, it isn’t! I’m sorry, I’m sorry!');
    await who('mother', 'Every one of those beans goes into the ground tonight, and every one of them is yours to answer for.');
    await smacks(3);
    G.cut(tcams.face);
    await who('jack', 'Yes, Mother! Yes!');
    await G.wait(0.5);
    G.cut(tcams.side);
    await who('mother', 'Up.');
    lap.place('after', 1.6); lap.cover(1); await G.wait(1.8);
  }
  // ── 4. Up again; out to the garden. ──
  const endCam = tier === 2 ? stageShot(W, [-30, 24, 32], [-5, 14, -5], 42) : cams.seatClose;
  G.cut(endCam);
  await who('mother', tier === 0 ? 'Pull your trousers up.' : 'Pull your trousers up, and wipe your face.');
  lap.layers({ trousers: 'up', drawers: 'up' }); lap.cover(0); await G.wait(0.8);
  await who('jack', 'Yes, Mother.');
  await who('mother', 'Go and plant them, then. If they’re so powerful. We will see what comes up.');
  await G.wait(0.5);
  A && A.stopMusic(2.5); await G.fade(true, 2.4); A && A.ambience({ wind: 0, birds: 0, fire: 0 });
  lap.stage.visible = false; G.hideLine && G.hideLine(); await G.wait(1);
  G.mode = 'end'; document.body.classList.remove('cutscene');
  return { tier, brash: brashness(choices), hits: lap.st.hits };
}

root.Night = { run, brashness, tierOf, build, SEAT, TABLE };
})(typeof window !== 'undefined' ? window : globalThis);

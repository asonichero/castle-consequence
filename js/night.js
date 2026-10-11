// Climbing Toward Consequence — the close of Chapter Two: the cottage at night.
//   Jack comes home through the gate and up to the door under the stars; then, indoors, he tells his Mother what he has done with the cow, in a tone set by the choices he made at the
//   Peddler's cart; she is furious, sits in the chair by the hearth and calls him to her. The scene ends there, as he steps up to her knee: the correction itself is to be a scene of its own.
//   A beat is one camera angle (see G.cut in game.js): everyone is put where they stand as it begins, and what happens in it happens in view of that one angle.
(function (root) {
'use strict';
const THREE = root.THREE, B = root.Blocky, C = root.Cast, F = root.Farm, A = root.GameAudio, V3 = THREE.Vector3;
const v = (x, y, z) => new V3(x, y, z), clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const turn = (from, to, t) => { const d = ((to - from + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return from + d * t; };
const SC = 0.95, STAGE_Y = 5.7;

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
  // ── Actors: Jack and his Mother as they stand and walk and talk. ──
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
  scene.add(mother.root); scene.add(jackIn.root);
  int.chair.visible = true;
  const world = { scene: ext.scene, update(dt, t) { ext.update(dt, t); aOut.t += dt; B.step(jackOut, dt); } };
  const iworld = { scene, update(dt, t) { int.update(dt, t); ja.t += dt; ma.t += dt; B.step(jackIn, dt); B.step(mother, dt); } };
  // Where the chair stands (the room editor decides), and which way it faces.
  const ch = int.spots.chair, SEAT = { x: ch.x, z: ch.z, ry: int.spots.chairRy };
  return { SEAT, ext, int, jackOut, aOut, jackIn, ja, mother, ma, paintJack, world, iworld, scene };
}

// ──────────────────────────────────────────────────────────────────────────────────────────
async function run(G, choices, opts) {
  opts = opts || {};
  const W = build(G), tier = tierOf(choices), who = (w, t, o) => G.say(w, t, o);
  const { jackOut, aOut, jackIn, ja, mother, ma, int, SEAT } = W;
  const pick = (a, b, c) => [a, b, c][tier];
  // The indoor staging is laid out from the chair: cl(a, y, b) is a point a units ahead of it (the way it faces) and b to its right, so it follows the chair wherever the room editor puts it.
  const cl = (a, y, b) => v(SEAT.x + a * Math.sin(SEAT.ry) + (b || 0) * Math.cos(SEAT.ry), y, SEAT.z + a * Math.cos(SEAT.ry) - (b || 0) * Math.sin(SEAT.ry));
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

  // ── 1. Outside: home through the gate, up the path to the door. Three angles; Jack is put where he stands as each begins. ──
  G.setScene(W.world); A && A.ambience({ wind: 0.25, birds: 0, fire: 0 }); A && A.duckMusic(0.5, 2); A && A.startMusic({ dark: true });
  const outJack = (x, z) => { jackOut.root.visible = true; jackOut.root.position.set(x, 0, z); jackOut.root.rotation.y = Math.PI; aOut.speed = 0; aOut.fist = 1; aOut.bow = 0.2; W.paintJack(jackOut, { expr: pick(1, 5, 5) }); };
  const outShots = {
    gate: { pos: v(-62, 20, 176), look: v(4, 14, 100), fov: 46 },
    path: { pos: v(-40, 16, 88), look: v(6, 14, 60), fov: 48 },
    door: { pos: v(84, 16, 56), look: v(30, 16, 26), fov: 44 },
  };
  G.cut(outShots.gate, () => outJack(0, 150));
  await G.fade(false, 1.6);
  await walk(jackOut, aOut, [v(0, 0, 98)], 24, Math.PI);
  G.cut(outShots.path, () => outJack(0, 98));
  await walk(jackOut, aOut, [v(0, 0, 66), v(34, 0, 62), v(34, 0, 29)], 24, Math.PI);
  G.cut(outShots.door, () => outJack(34, 29));
  await G.wait(0.6);
  await who('jack', pick('Perhaps I should have said no.', 'She’ll understand, once she sees them.', 'Home before the lamps burn low. Wait until she sees what I’ve brought.'));
  await G.wait(0.4); A && A.thwack(0.3, true, 0.5);
  await G.fade(true, 1.0);

  // ── 2. Indoors: the telling. Every beat puts Jack and his Mother where they are as it begins (telling()), then does only what happens within it. ──
  const sh = {
    wide: { pos: cl(64, 36, -44), look: cl(16, 22), fov: 46 },
    mFace: { pos: cl(40, 30, 28), look: cl(5, 25, 2), fov: 36 },
    jFace: { pos: cl(14, 26, -22), look: cl(28, 22), fov: 40 },
  };
  const telling = (o) => {
    o = Object.assign({ jackAt: cl(28, 0), ry: SEAT.ry + Math.PI, bow: pick(1, 0.4, 0), fist: 1, hold: 0, gesture: 0, wag: 0, fold: 1, chin: 0, seated: false }, o || {});
    G.setScene(W.iworld); A && A.ambience({ wind: 0.1, birds: 0, fire: 0.8 });
    jackOut.root.visible = false; mother.root.visible = true; jackIn.root.visible = true; int.chair.visible = true; mother.setExpr(1);
    jackIn.root.position.copy(o.jackAt); jackIn.root.rotation.y = o.ry; W.paintJack(jackIn, { expr: pick(1, 5, 5) });
    ja.speed = 0; ja.fist = o.fist; ja.hold = o.hold; ja.bow = o.bow; ja.cover = 0; ja.shuffle = 0;
    ma.gesture = o.gesture; ma.wag = o.wag; ma.fold = o.fold; ma.chin = o.chin; ma.speed = 0;
    if (o.seated) { B.setPose(mother, 'sit'); mother.pose = 'sit'; mother.root.position.set(SEAT.x, STAGE_Y, SEAT.z); }
    else { B.setPose(mother, 'stand'); mother.pose = 'stand'; mother.root.position.copy(cl(5, 0)); }
    mother.root.rotation.y = SEAT.ry;
    for (let i = 0; i < 20; i++) { B.step(mother, 0.1); B.step(jackIn, 0.1); }
  };
  G.cut(sh.wide, () => telling({ jackAt: v(34, 0, 50), ry: Math.PI, bow: 0 }));        // Jack comes in at the door and crosses the room
  await G.fade(false, 1.2); await G.wait(0.6);
  await walk(jackIn, ja, [v(30, 0, 0), cl(42, 0), cl(28, 0)], 24, SEAT.ry + Math.PI);
  ja.bow = pick(1, 0.4, 0);
  G.cut(sh.mFace, () => telling());
  await who('mother', 'Where is Milky-White?');
  G.cut(sh.jFace, () => telling());
  await who('jack', pick('I sold her, Mother. But not for coin. I know how it will sound.', 'I sold her, Mother. Look what I got for her.', 'Gone, Mother. Sold, and for a good deal more than coin.'));
  G.cut(sh.mFace, () => telling());
  await who('mother', 'What is in your hand, Jack?');
  G.cut(sh.wide, () => telling({ fist: 0, hold: 0.8 }));
  await who('jack', pick('Beans. The woman said they grow whatever we need, whether we know it or not. I believed her.', 'Beans, Mother. Magic ones. The woman at the cart said they grow whatever we need.', 'Beans, Mother. Five of them, and every one enchanted. Gold, silver, ember red, moss green, and one the deep blue of a night sky.'));
  G.cut(sh.mFace, () => telling({ fist: 0 }));
  await who('mother', 'Beans.');
  ma.gesture = 1; ma.wag = 0.6; ma.fold = 0;
  await who('mother', 'We had one cow. One. You were to bring home coin for the roof and flour for the winter. And you have brought me five beans.');
  G.cut(sh.jFace, () => telling({ fist: 0, gesture: 1, wag: 0.6, fold: 0 }));
  await who('jack', pick('I know. I’m sorry. I didn’t think. She spoke so well, and I wanted so badly to bring you something.', 'It was a fair trade, Mother. She said so herself.', 'It was a fair exchange. You’ll see. By spring we’ll have more than a cow’s worth, and you’ll be the first to say so.'));
  G.cut(sh.mFace, () => telling({ fist: 0, gesture: 1, wag: 1, fold: 0 }));
  await who('mother', 'A fair trade. This is the third time this week you have come home with foolishness in place of sense, and the last of our cow besides. I told you this morning. Not for stories. Not for tricks.');
  G.cut(sh.jFace, () => telling({ fist: 0, gesture: 1, wag: 1, fold: 0 }));
  await who('jack', pick('Mother, please. I can fix this. I’ll find her, I’ll—', 'I did what I thought was best.', 'You never believe me! One day you’ll see I was right.'));
  G.cut(sh.mFace, () => telling({ fist: 0, gesture: 1, wag: 0.4, fold: 0 }));
  await who('mother', pick('Hush.', 'You did what pleased you.', 'I believe every word you say, Jack. That is the trouble.'));
  // She sits in the chair by the hearth, and calls him to her.
  G.cut(sh.jFace, () => telling({ fist: 0 , gesture: 0, wag: 0, fold: 0 }));
  await G.wait(0.4); B.setPose(mother, 'sit'); mother.pose = 'sit'; mother.root.position.set(SEAT.x, STAGE_Y, SEAT.z); mother.root.rotation.y = SEAT.ry;
  for (let i = 0; i < 12; i++) B.step(mother, 0.1);
  await G.wait(0.6);
  G.cut(sh.wide, () => telling({ fist: 0, gesture: 0, wag: 0, fold: 0, seated: true }));
  await who('mother', 'Come here.');
  await who('jack', 'Mother?');
  await who('mother', 'Come here, Jack.');
  ja.shuffle = 1; ja.bow = 1;
  await walk(jackIn, ja, [cl(16, 0)], 12, SEAT.ry + Math.PI);
  ja.speed = 0;
  // The scene ends here, as he steps up to her knee: the correction that follows is a scene of its own.
  await G.wait(0.8);
  A && A.stopMusic(2.5); await G.fade(true, 2.4); A && A.ambience({ wind: 0, birds: 0, fire: 0 });
  G.hideLine && G.hideLine(); await G.wait(1);
  G.mode = 'end'; document.body.classList.remove('cutscene');
  return { tier, brash: brashness(choices), hits: 0 };
}

root.Night = { run, brashness, tierOf, build };
})(typeof window !== 'undefined' ? window : globalThis);

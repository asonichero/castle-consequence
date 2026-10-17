// Climbing Toward Consequence — Chapter Four, The Golden Egg: it opens on a dream.
//   Jack comes home to the cottage at half his size, in his day clothes, empty-handed. Neither he nor his Mother says a word about either. He walks across the room to her (playable), answers her
//   (dialogue, and one action: turning out his pockets), is called to her knee (playable again) and is corrected: shorter than the one at the close of Chapter One, and harder than anything
//   Gerda has done. Her last words send him back for something to bring home. The dream is lit cold, the hearth the one warm thing in it.
//   The cottage, his Mother and the discipline engine are Chapter One's (js/night.js, js/correction.js, js/lap.js).
//   Exposes Dream.run(G, W, opts) where W is Night.build's world; resolves { tier, slip }. opts.slip (0 to 2) stands in for how Chapter Three went.
(function (root) {
'use strict';
const THREE = root.THREE, B = root.Blocky, Lap = root.Lap, A = root.GameAudio, V3 = THREE.Vector3;
const v = (x, y, z) => new V3(x, y, z), clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const turn = (from, to, t) => { const d = ((to - from + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return from + d * t; };
const SC = 0.95, STAGE_Y = 5.7, JS = 0.5, OUT = 'Day', RED = { red: true };

async function run(G, W, opts) {
  opts = opts || {};
  const { jackIn, ja, mother, ma, int, SEAT, scene } = W, say = (w, t, o) => G.say(w, t, o);
  const L = Object.assign({ lies: G.ch3lies || 0, rounds: 0, choreLied: false, obj: 0, washed: true }, G.ch3log || {});
  const day = L.lies + L.rounds + (L.choreLied ? 1 : 0) + 0.5 * Math.min(L.obj, 3) + (L.washed ? 0 : 0.5);
  const slip = opts.slip !== undefined ? opts.slip : day <= 0.5 ? 0 : day <= 2.5 ? 1 : 2;       // (0: nothing to hold against him; 1: a mixed day; 2: a hard one)
  const paint = o => W.paintJack(jackIn, Object.assign({ outfit: OUT, expr: 1 }, o));
  const el = G.renderer.domElement;

  // ── The room, by dream light; the two of them. ──
  const keep = { bg: scene.background, fog: scene.fog, hc: int.hemi.color.getHex(), hi: int.hemi.intensity, di: int.dim.intensity, dc: int.dim.color.getHex() };
  scene.background = new THREE.Color(0x070a16); scene.fog = new THREE.Fog(0x070a16, 120, 300);
  int.hemi.color.setHex(0x6070b0); int.hemi.intensity = 0.3; int.dim.color.setHex(0x8090d0); int.dim.intensity = 0.4;
  const rug = int.items.rug.g.position, M1 = v(rug.x, 0, rug.z), HEARTH = Math.PI;       // (she stands on the rug, facing the fire: ry π looks towards -z)
  jackIn.root.scale.setScalar(SC * JS); jackIn.root.visible = mother.root.visible = true; int.chair.visible = true; int.tableClutter.visible = true;
  const reset = () => { Object.assign(ja, { speed: 0, bare: 0, hold: 0, cover: 0, bow: 0, look: 0, fist: 0, shuffle: 0, rub: 0, hitch: 0 }); Object.assign(ma, { speed: 0, wag: 0, gesture: 0, fold: 0, chin: 0, tilt: 0, point: 0, side: 1 }); };
  reset(); paint({ trousers: 'up', drawers: 'up' }); B.setPose(mother, 'stand'); mother.pose = 'stand'; mother.setExpr(1);
  mother.root.position.copy(M1); mother.root.rotation.y = HEARTH;
  const J0 = v(34, 0, 60); jackIn.root.position.copy(J0); jackIn.root.rotation.y = Math.PI;
  for (let i = 0; i < 20; i++) { B.step(mother, 0.1); B.step(jackIn, 0.1); }
  G.setScene(W.iworld); G.drone = null; A && A.ambience({ wind: 0.15, birds: 0, fire: 0.5 }); A && A.duckMusic && A.duckMusic(0.35, 2);

  // ── What he can do: walk, in a camera that stays behind him; the room's furniture is in the way. ──
  const st = { free: false, pos: J0.clone(), heading: Math.PI, yaw: 0, pitch: 0.5, hb: 0, goal: null, onGoal: null };
  const tp = int.table.position, RECTS = [[tp.x - 19, tp.x + 19, tp.z - 14, tp.z + 14], [-58, -12, 49, 74], [-82, -50, -15, 35]], BLOCK = [[SEAT.x, SEAT.z, 12], [-65, -65, 9], [66, -66, 8]], LIM = 66;       // (the table, the bed, the stairs; the chair, the barrel, the crate)
  const blocked = (x, z) => Math.abs(x) > LIM || Math.abs(z) > LIM || BLOCK.some(b => Math.hypot(x - b[0], z - b[1]) < b[2]) || RECTS.some(r => x > r[0] && x < r[1] && z > r[2] && z < r[3]);
  const keys = {}, ui = root.TouchUI.create({ keys }), stick = ui.stick;
  const KM = { w: 'up', W: 'up', ArrowUp: 'up', s: 'down', S: 'down', ArrowDown: 'down', a: 'left', A: 'left', ArrowLeft: 'left', d: 'right', D: 'right', ArrowRight: 'right' };
  const kd = e => { const k = KM[e.key]; if (k) { keys[k] = true; if (e.key.startsWith('Arrow')) e.preventDefault(); } }, ku = e => { const k = KM[e.key]; if (k) keys[k] = false; };
  root.addEventListener('keydown', kd); root.addEventListener('keyup', ku);
  const drags = new Map(), pd = e => drags.set(e.pointerId, { x: e.clientX, y: e.clientY }), pm = e => { const d = drags.get(e.pointerId); if (!d) return; st.yaw -= (e.clientX - d.x) * 0.006; st.pitch = clamp(st.pitch + (e.clientY - d.y) * 0.005, 0.15, 1.2); d.x = e.clientX; d.y = e.clientY; }, pu = e => drags.delete(e.pointerId);
  el.addEventListener('pointerdown', pd); el.addEventListener('pointermove', pm); el.addEventListener('pointerup', pu); el.addEventListener('pointercancel', pu);
  const hint = document.createElement('div'); hint.id = 'dHint'; hint.style.cssText = 'position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:30;padding:6px 14px;background:rgba(10,12,20,.72);color:#e8e2d0;font:italic 15px Georgia,serif;border-radius:4px;display:none;pointer-events:none';
  document.body.appendChild(hint);
  const camPos = v(0, 0, 0), camLook = v(0, 0, 0);
  const tick = dt => {
    if (!st.free) return;
    const f = v(-Math.sin(st.yaw), 0, -Math.cos(st.yaw)), r = v(Math.cos(st.yaw), 0, -Math.sin(st.yaw));
    const dir = v(0, 0, 0).addScaledVector(f, (keys.up ? 1 : 0) - (keys.down ? 1 : 0)).addScaledVector(r, (keys.right ? 1 : 0) - (keys.left ? 1 : 0));
    if (Math.hypot(stick.x, stick.y) > 0.2) dir.addScaledVector(f, -stick.y).addScaledVector(r, stick.x);
    let sp = 0;
    if (dir.lengthSq() > 0) {
      dir.normalize(); st.heading = turn(st.heading, Math.atan2(dir.x, dir.z), Math.min(1, dt * 9)); sp = 15;
      const nx = st.pos.x + Math.sin(st.heading) * sp * dt, nz = st.pos.z + Math.cos(st.heading) * sp * dt;
      if (!blocked(nx, st.pos.z)) st.pos.x = nx; if (!blocked(st.pos.x, nz)) st.pos.z = nz;
    }
    ja.speed = sp; ja.phase += sp * dt * 0.42 / 0.95 * 1.6; ja.shuffle = 0; ja.bow = 0.25;
    jackIn.root.position.set(st.pos.x, 0, st.pos.z); jackIn.root.rotation.y = st.heading;
    const near = st.goal ? Math.hypot(st.pos.x - st.goal.x, st.pos.z - st.goal.z) : 99;
    st.hb += dt; if (A && A.thud && st.hb > lerp(0.5, 1.3, clamp((near - 20) / 90, 0, 1))) { st.hb = 0; A.thud(0.12); }       // (a heartbeat, quickening as he nears her)
    const d = 44, at = v(st.pos.x, 8, st.pos.z), want = v(at.x + Math.sin(st.yaw) * Math.cos(st.pitch) * d, Math.max(4, at.y + Math.sin(st.pitch) * d), at.z + Math.cos(st.yaw) * Math.cos(st.pitch) * d);
    want.x = clamp(want.x, -70, 70); want.z = clamp(want.z, -70, 70); want.y = Math.min(want.y, 56);       // (the camera stays inside the room)
    if (camPos.lengthSq() === 0) camPos.copy(want); else camPos.lerp(want, Math.min(1, dt * 8)); camLook.copy(at);
    G.cut({ pos: camPos, look: camLook, fov: 48 });
    if (st.goal && near < st.goalR && st.onGoal) { const f2 = st.onGoal; st.onGoal = null; f2(); }
  };
  G.updaters.push(tick);
  G.dream = { st, M1, slip };       // (for tools and tests)
  // Walking to a place: his, until he is within r of it.
  const goTo = (p, r, text) => new Promise(res => {
    G.mode = 'play'; document.body.classList.remove('cutscene'); G.hideLine && G.hideLine(); ui.show(true);
    hint.textContent = text; hint.style.display = 'block'; camPos.set(0, 0, 0); st.free = true; st.goal = p; st.goalR = r;
    st.onGoal = () => { st.free = false; hint.style.display = 'none'; ui.show(false); for (const k in keys) keys[k] = false; stick.x = stick.y = 0; ja.speed = 0; G.mode = 'cutscene'; document.body.classList.add('cutscene'); res(); };
  });
  // Talk: the two of them side-on, as a pair.
  const pair = () => {
    const a = mother.root.position, b = jackIn.root.position, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, dx = b.x - a.x, dz = b.z - a.z, n = Math.hypot(dx, dz) || 1, px = -dz / n, pz = dx / n, sg = pz > 0 ? -1 : 1;       // (the camera takes the side away from the table, which would stand between)
    G.cut({ pos: v(clamp(mx + px * sg * 78, -68, 68), 24, clamp(mz + pz * sg * 78, -68, 68)), look: v(mx, 15, mz), fov: 42 });
  };
  const faceEach = async () => {
    const a = mother.root.position, b = jackIn.root.position, tm = Math.atan2(b.x - a.x, b.z - a.z), tj = tm + Math.PI;
    for (let i = 0; i < 16; i++) { mother.root.rotation.y = turn(mother.root.rotation.y, tm, 0.3); jackIn.root.rotation.y = turn(jackIn.root.rotation.y, tj, 0.3); await G.wait(0.04); }
  };
  const pts = { score: 0 };
  const pickOf = async (who, opts2) => { const i = await G.choose(who, opts2.map(o => o[0])); pts.score += opts2[i][1]; return i; };

  // ── 1. The threshold. ──
  G.mode = 'cutscene'; document.body.classList.add('cutscene'); const f = document.getElementById('fade'); f.style.transition = 'none'; f.style.opacity = 1; void f.offsetWidth; f.style.transition = '';
  G.cut({ pos: v(70, 30, 84), look: v(0, 14, 0), fov: 52 }); await G.wait(0.2); G.fade(false, 2.2); await G.wait(1.6);
  await goTo(M1, 28, 'Go to Mother.');
  // ── 2. What did you bring me? ──
  await faceEach(); reset(); ma.side = 1; pair(); await G.wait(0.6);
  await say('mother', 'Jack.'); await G.wait(0.5);
  await say('mother', 'What did you bring me?');
  const a1 = await pickOf('jack', [['Nothing, Mother. I’m sorry.', 0], ['It’s coming. I only need a little longer.', 1], ['You never gave me the chance to finish!', 2], [{ act: 'Turn out your pockets' }, 0]]);
  if (a1 === 3) {
    for (let i = 1; i <= 14; i++) { ja.hold = 0.5 * i / 14; ja.cover = 0; await G.wait(0.04); } A && A.rustle && A.rustle(0.5); await G.wait(0.5);
    paint({ expr: 3 }); await G.wait(0.8); ja.hold = 0;
    await say('mother', 'Empty.'); await say('mother', 'Empty, Jack.');
  } else {
    await say('jack', ['Nothing, Mother. I’m sorry.', 'It’s coming. I only need a little longer.', 'You never gave me the chance to finish!'][a1]);
    ma.gesture = a1 === 2 ? 1 : 0.3; ma.wag = a1 === 2 ? 0.6 : 0;
    await say('mother', ['Nothing.', 'A little longer.', 'Finish.'][a1]);
    await say('mother', ['Nothing.', 'A little longer.', 'You have never finished a thing in your life.'][a1]);
  }
  reset(); ma.side = 1;
  // ── 3. The accounting: it is of his day, and it is hers. ──
  pair();
  await say('mother', ['You were good, and what did it buy? Nothing in your hands.', 'The truth when it suits you, and a fib when it doesn’t, and home you come with nothing.', 'You lied, and you sulked, and you made a mess of every task you were given, and you come home with nothing.'][slip]);
  const a2 = await pickOf('jack', [['I’ll bring something, Mother. I promise.', 0], ['I was looked after. I had a bed.', 1], ['Perhaps I would, if you ever said a kind word!', 2]]);
  await say('jack', ['I’ll bring something, Mother. I promise.', 'I was looked after. I had a bed.', 'Perhaps I would, if you ever said a kind word!'][a2]);
  ma.gesture = a2 === 0 ? 0 : 1; ma.wag = a2 === 2 ? 1 : 0.3;
  await say('mother', ['You promise.', 'By whom?', 'Kind.'][a2]);
  if (a2 === 1) { paint({ expr: 3 }); await G.wait(0.9); await say('mother', 'By whom, Jack?'); }
  else await say('mother', ['You always promise.', '', 'I have been kind to you all your life, and look what you bring me.'][a2]);
  await G.wait(0.4); reset();
  // ── 4. Come here. ──
  await G.fade(true, 0.8);
  B.setPose(mother, 'sit'); mother.pose = 'sit'; mother.root.position.set(SEAT.x, STAGE_Y, SEAT.z); mother.root.rotation.y = SEAT.ry; ma.fold = 0; ma.side = 0;
  const cl = (a, y, b) => v(SEAT.x + a * Math.sin(SEAT.ry) + (b || 0) * Math.cos(SEAT.ry), y, SEAT.z + a * Math.cos(SEAT.ry) - (b || 0) * Math.sin(SEAT.ry));
  const J1 = cl(52, 0); st.pos.copy(J1); st.heading = SEAT.ry + Math.PI; st.yaw = SEAT.ry + Math.PI; jackIn.root.position.copy(J1); jackIn.root.rotation.y = st.heading; paint({});
  for (let i = 0; i < 12; i++) { B.step(mother, 0.1); B.step(jackIn, 0.1); } B.seatFeet(mother, 0);
  G.cut({ pos: cl(22, 22, 52), look: cl(10, 14, 0), fov: 44 }); await G.fade(false, 0.9);
  await say('mother', 'Come here.'); await say('mother', 'Come here, Jack.');
  await goTo(cl(20, 0), 15, 'Go to her.');
  // ── 5. The correction: over her knee, with the hand; shorter than the one at the close of Chapter One, and harder. ──
  const tier = Math.min(2, Math.floor((pts.score + (slip >= 2 ? 1 : 0)) / 2)), pick = (a, b, c) => [a, b, c][tier];
  ui.destroy(); hint.remove(); root.removeEventListener('keydown', kd); root.removeEventListener('keyup', ku); el.removeEventListener('pointerdown', pd); el.removeEventListener('pointermove', pm); el.removeEventListener('pointerup', pu); el.removeEventListener('pointercancel', pu);
  const lap = Lap.create(null, { external: { scene, camera: G.camera, renderer: G.renderer }, table: false, jackFull: 1 });
  lap.giver('mother', 1); lap.stage.scale.setScalar(SC); lap.stage.visible = false; lap.jack.root.visible = true; lap.st.noRecovery = true; lap.st.side = 'alt'; lap.outfit('jack', OUT);
  G.lap = lap;
  const placeStage = at => { lap.stage.position.set(at.x, STAGE_Y, at.z); lap.stage.rotation.y = at.ry; lap.stage.updateMatrixWorld(true); };
  const cworld = { scene, update(dt, t) { int.update(dt, t); ja.t += dt; ma.t += dt; B.step(jackIn, dt); B.step(mother, dt); if (lap.stage.visible) lap.update(dt); } };
  G.setScene(cworld); G.mode = 'correction'; document.body.classList.remove('cutscene'); A && A.ambience({ wind: 0.1, birds: 0, fire: 0.8 });
  const C = root.Correction, cam = C.freeCam(G, { x0: -75, x1: 75, z0: -75, z1: 75, h: 62 }), panel = C.ui(), camBtn = document.getElementById('corrCam'), redBtn = document.getElementById('corrRed');
  let red = false, shown = null;
  redBtn.onclick = () => { red = true; lap.red(); G.captionOff(); };
  const stageView = (name, ms) => { const V = lap.views[name]; lap.stage.updateMatrixWorld(true); cam.go(lap.stage.localToWorld(v(...V.pos)), lap.stage.localToWorld(v(...V.at)), 46, ms == null ? 700 : ms); shown = name; };
  const SET = ['overview', 'behind', 'shoulder', 'face'];
  camBtn.onclick = () => stageView(SET[(SET.indexOf(shown) + 1) % SET.length]);
  const showUI = on => panel.classList.toggle('on', !!on);
  const cap = async (who, text) => { if (red) throw RED; await G.caption(who, text); if (red) throw RED; };
  const wait = async s => { await G.wait(s); if (red) throw RED; };
  const smacks = async n => { if (!n) return; lap.run(n); await G.wait(0.4); for (let i = 0; i < 700 && (lap.info().busy || lap.info().running); i++) { await G.wait(0.1); if (red) return; } };
  const step = async (line, n) => { if (red) throw RED; const l = line ? G.caption(line[0], line[1]) : Promise.resolve(); await Promise.all([l, smacks(n)]); if (red) throw RED; };
  const standBefore = () => {
    lap.stage.visible = false; mother.root.visible = jackIn.root.visible = true; mother.setExpr(1); reset(); ma.side = 0;
    placeStage(SEAT); B.setPose(mother, 'sit'); mother.pose = 'sit'; mother.root.position.set(SEAT.x, STAGE_Y, SEAT.z); mother.root.rotation.y = SEAT.ry;
    jackIn.root.position.copy(cl(20, 0)); jackIn.root.rotation.y = SEAT.ry + Math.PI;
    ja.rub = 1; ja.bow = 0.5; paint({ expr: 3, trousers: 'down', drawers: tier >= 1 ? 'down' : 'up', marks: lap.st.marks });
    W.jackGl.mesh.visible = true; B.paintGlutesInto(W.jackGl.skin, { trousers: 'down', drawers: tier >= 1 ? 'down' : 'up', marks: lap.st.marks, outfit: OUT }); W.jackGl.tex.needsUpdate = true;
    for (let i = 0; i < 12; i++) { B.step(mother, 0.1); B.step(jackIn, 0.1); } B.seatFeet(mother, 0);
  };
  const handScene = async () => {
    placeStage(SEAT); lap.stage.visible = true; int.chair.visible = false; jackIn.root.visible = mother.root.visible = false;
    lap.reset(); lap.size(JS); lap.layers({ trousers: 'up', drawers: 'up' }); lap.armed(false); lap.implement('hand'); lap.place('seat', 0); lap.giver('mother', 1);
    lap.st.sound = true; lap.st.strength = 1.45; lap.st.pace = 1.7;       // (her hand is heavier than Gerda's, and quicker)
    showUI(true); cam.enable(true); stageView('overview', 0);
    await G.fade(false, 0.6); await wait(0.6);
    await cap('jack', pick('Mother, please—', 'Mother, you can’t—', 'You wouldn’t—'));
    lap.fumble(1); await wait(0.3);
    await cap('mother', 'Empty hands, Jack. Empty hands, again.');
    lap.layers({ trousers: 'down', drawers: tier >= 1 ? 'down' : 'up' }); A && A.blip && A.blip(); await wait(0.5);
    await cap('jack', 'Mother!'); lap.fumble(0); lap.cover(1); await wait(0.3);
    await cap('mother', 'Over my knee.');
    lap.cover(0); lap.place('lap', 1.2); await wait(1.5);
    await step(['mother', 'This is what coming home with nothing earns.'], pick(16, 20, 24));
    await step(['jack', pick('Ow! I’m sorry, I’m sorry!', 'Ow! Mother, that’s enough!', 'Ow! It isn’t fair!')], 6);
    await step(null, pick(10, 14, 18));
    await step(['mother', 'Not one thing, in all this time. Not one thing to show for it.'], pick(12, 16, 20));
    await step(['jack', pick('I’ll bring something! I will!', 'Ow! I’ll bring something, I will!', 'I’ll bring you something! Ow! You’ll see!')], 6);
    await step(null, pick(8, 12, 16));
    await wait(0.4); await cap('mother', 'Up.');
    lap.place('seat', 1.1); lap.cover(1); await wait(1.3);
  };
  const aftermath = async () => {
    showUI(false); cam.enable(true);
    await G.fade(true, 0.5); standBefore(); stageView('seat', 0); await G.fade(false, 0.6);
    await cap('mother', 'Pull your trousers up.'); await cap('jack', 'Yes, Mother.');
    ja.rub = 0; ja.bow = 0.3; paint({ expr: 1, trousers: 'down', drawers: tier >= 1 ? 'down' : 'up', marks: lap.st.marks });
    for (let i = 1; i <= 34; i++) { ja.hitch = i / 34; if (i === 20) { paint({ expr: 1 }); W.jackGl.mesh.visible = false; A && A.blip && A.blip(); } await wait(0.04); }
    ja.hitch = 0; await wait(0.5);
    await cap('mother', 'And you will not come home to me with empty hands again, Jack. Not ever.');
    await cap('jack', 'No, Mother.'); await wait(1.0);
  };
  try {
    try { await handScene(); await aftermath(); }
    catch (e) {
      if (e !== RED) throw e;
      lap.stop(); G.captionOff && G.captionOff(); red = false; showUI(false);
      await G.caption('jack', 'Red! No more, please!'); await G.caption('mother', 'Alright, Jack. I hear you. That’s an end to it.'); await G.wait(0.4);
      await aftermath();
    }
  } finally { showUI(false); cam.restore(); }
  G.updaters = G.updaters.filter(u => u !== tick);
  A && A.stopMusic && A.stopMusic(2); await G.fade(true, 2.4); A && A.ambience({ wind: 0, birds: 0, fire: 0 }); G.captionOff && G.captionOff(); await G.wait(0.6);
  lap.stage.visible = false; G.mode = 'end';
  scene.background = keep.bg; scene.fog = keep.fog; int.hemi.color.setHex(keep.hc); int.hemi.intensity = keep.hi; int.dim.color.setHex(keep.dc); int.dim.intensity = keep.di; W.jackGl.mesh.visible = false; jackIn.root.scale.setScalar(SC);
  return { tier, slip };
}

root.Dream = { run };
})(typeof window !== 'undefined' ? window : globalThis);

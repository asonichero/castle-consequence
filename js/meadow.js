// Climbing Toward Consequence — the cloud meadow, Chapter Two ("The Climb"): Jack walks from the top of the beanstalk to the castle gate.
//   The land is built at full scale (a castle for people; a meadow of moss and low flowers). Jack starts at a quarter of his size and, as he walks, shrinks to a tenth; the camera is kept to his size,
//   so the meadow seems to grow round him, though nothing in it changes. He does not notice, and neither does the prose, until the gate.
//   An opening cutscene (the moss, the air, the land, the castle), a walk (WASD / stick; drag to look; wheel, + and - or pinch to zoom), and a closing cutscene at the gate.
// Exposes Meadow.run(G, W): W is Night.build's world (Jack, in his outdoor clothes).
(function (root) {
'use strict';
const THREE = root.THREE, F = root.Farm, A = root.GameAudio, V3 = THREE.Vector3;
const v = (x, y, z) => new V3(x, y, z), clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const angDiff = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
const SC = 0.95, K0 = 0.25, K1 = 0.10;
const START_Z = 40, GATE_Z = -700, TRIGGER_Z = -672;                    // (the walk runs along -z, from the edge of the cloud to the castle's gate)
const kOf = z => lerp(K0, K1, clamp((START_Z - z) / (START_Z - TRIGGER_Z), 0, 1));
const rnd = (() => { let s = 777; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();

function canvasTex(w, h, paint, rx, ry) { const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rx) t.repeat.set(rx, ry); return t; }
const mossTex = () => canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#d3ddcd'; g.fillRect(0, 0, w, h); const cols = ['#c8d6c2', '#e1ead9', '#bccfb8', '#d6e2c8', '#e8eee0']; for (let i = 0; i < 700; i++) { g.fillStyle = cols[Math.floor(rnd() * cols.length)]; g.fillRect(Math.floor(rnd() * w), Math.floor(rnd() * h), 2, 2); } }, 260, 260);
const stoneTex = (rx, ry) => canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#d9d3bd'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) { g.fillStyle = '#b9b39c'; g.fillRect(0, y, w, 2); for (let x = (y / 16) % 2 ? 0 : 16; x < w; x += 32) g.fillRect(x, y, 2, 16); } for (let i = 0; i < 160; i++) { g.fillStyle = rnd() < 0.5 ? '#f4f0e2' : '#dcd6c0'; g.fillRect(Math.floor(rnd() * w), Math.floor(rnd() * h), 2, 2); } }, rx, ry);

function build() {
  const scene = new THREE.Scene(), sky = new THREE.Color(0xe6e4ee);
  scene.background = sky; scene.fog = new THREE.Fog(0xe2dfea, 60, 1250);
  scene.add(new THREE.HemisphereLight(0xe8ecfa, 0xb8c4b0, 0.72)); const sun = new THREE.DirectionalLight(0xffe8c8, 0.55); sun.position.set(-300, 400, 200); scene.add(sun);
  const box = F.box, glints = [];
  // The ground: white moss, to the haze.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshLambertMaterial({ map: mossTex() })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  // Hills, in soft blocks, and distant banks of cloud.
  const mossCols = [0xc9d6c0, 0xbccdb4, 0xd2dcc8, 0xaec2a8];
  const hill = (x, z, r, h) => { for (let i = 0; i < 4; i++) { const w = r * 2 * (1 - i * 0.24), hh = h / 4; box(w, hh, w * (0.8 + rnd() * 0.4), new THREE.MeshLambertMaterial({ color: mossCols[(i + Math.floor(rnd() * 4)) % 4] }), x, i * hh + hh / 2, z, scene); } };
  for (let i = 0; i < 16; i++) { const side = i % 2 ? 1 : -1; hill(side * (260 + rnd() * 420), 100 - i * 55 - rnd() * 60, 70 + rnd() * 90, 40 + rnd() * 70); }
  for (let i = 0; i < 10; i++) box(300 + rnd() * 200, 30 + rnd() * 30, 200, new THREE.MeshBasicMaterial({ color: 0xf4eee8 }), (rnd() - 0.5) * 2600, 40 + rnd() * 120, -1500 - rnd() * 600, scene);
  // The silver stream: twice across the way, shallow enough to wade.
  const silver = new THREE.MeshPhongMaterial({ color: 0xcfe0ee, emissive: 0x6c7a8a, shininess: 140, specular: 0xffffff });
  const ribbon = (z0, amp, ph) => { let px = -520, pz = z0 + amp * Math.sin(px * 0.012 + ph); for (let x = -500; x <= 520; x += 14) { const z = z0 + amp * Math.sin(x * 0.012 + ph), len = Math.hypot(14, z - pz), m = box(len + 1, 0.5, 24 + 6 * Math.sin(x * 0.03), silver, (x + px) / 2, 0.22, (z + pz) / 2, scene); m.rotation.y = -Math.atan2(z - pz, 14); px = x; pz = z; } };
  ribbon(-210, 40, 0.5); ribbon(-430, 55, 2.1); ribbon(-90, 120, 4.0);
  // Flowers and grass, in their thousands: all of one height, so the shrinking Jack finds them rising.
  const dummy = new THREE.Object3D(), inst = (geo, mat, n, place) => { const m = new THREE.InstancedMesh(geo, mat, n); const col = new THREE.Color(); for (let i = 0; i < n; i++) { const c = place(dummy, col); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); if (c) m.setColorAt(i, c); } m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; scene.add(m); return m; };
  const bloomCols = ['#f4f0ff', '#e8d8f8', '#ffe8c8', '#dff0ff', '#fff6d8'].map(c => new THREE.Color(c)), tuftCols = ['#cfe0c8', '#bcd4b8', '#e4eedc'].map(c => new THREE.Color(c));
  const spot = () => { const wide = rnd() < 0.22, x = wide ? (rnd() < 0.5 ? -1 : 1) * (90 + rnd() * 320) : (rnd() - 0.5) * 190, z = 80 - rnd() * 800; return [x, z]; };
  const NF = 3200; const pts = []; for (let i = 0; i < NF; i++) pts.push(spot());
  const stems = [], blooms = [];
  inst(new THREE.BoxGeometry(0.22, 1, 0.22), new THREE.MeshLambertMaterial({ color: 0x9fc08a }), NF, (d, c) => { const [x, z] = pts[stems.length], h = 1.0 + rnd() * 0.5; stems.push(h); d.position.set(x, h / 2, z); d.scale.set(1, h, 1); d.rotation.set(0, rnd() * 3, 0); return null; });
  inst(new THREE.BoxGeometry(0.7, 0.45, 0.7), new THREE.MeshLambertMaterial({ color: 0xffffff }), NF, (d, c) => { const [x, z] = pts[blooms.length], h = stems[blooms.length]; blooms.push(1); d.position.set(x, h + 0.1, z); d.scale.set(1, 1, 1); d.rotation.set(0, rnd() * 3, 0); return bloomCols[Math.floor(rnd() * bloomCols.length)]; });
  const NG = 7000, gp = []; for (let i = 0; i < NG; i++) gp.push(spot());
  let gi = 0; inst(new THREE.BoxGeometry(0.3, 1, 0.3), new THREE.MeshLambertMaterial({ color: 0xffffff }), NG, (d, c) => { const [x, z] = gp[gi++], h = 0.6 + rnd() * 0.9; d.position.set(x, h / 2, z); d.scale.set(1, h, 1); d.rotation.set(0, rnd() * 3, 0); return tuftCols[Math.floor(rnd() * 3)]; });
  // A few pale trees lining the way to the gate: the tallest is the measure the gate is held against.
  const trunkM = new THREE.MeshLambertMaterial({ color: 0xd9d3c0 }), leafM = [0xb9d4c0, 0xa8c8b4, 0xc6dccb].map(c => new THREE.MeshLambertMaterial({ color: c }));
  for (let i = 0; i < 18; i++) { const side = i % 2 ? 1 : -1, x = side * (70 + rnd() * 90), z = -300 - i * 22 - rnd() * 14, h = 34 + rnd() * 22; box(4, h, 4, trunkM, x, h / 2, z, scene); box(24, 8, 24, leafM[0], x, h + 2, z, scene); box(17, 8, 17, leafM[1], x, h + 9, z, scene); box(10, 8, 10, leafM[2], x, h + 16, z, scene); }
  // The castle: moonlight and bone. A main body, two wings, one tower; no flag.
  const stone = (rx, ry) => new THREE.MeshLambertMaterial({ map: stoneTex(rx, ry), emissive: 0x161b2a });
  const win = new THREE.MeshBasicMaterial({ color: 0x0b0f1c });
  const castle = new THREE.Group(); scene.add(castle);
  const CZ = -790;                                                         // the main body's front face
  box(260, 110, 60, stone(10, 5), 0, 55, CZ - 30, castle); box(266, 6, 66, stone(10, 1), 0, 113, CZ - 30, castle);
  for (const sx of [-1, 1]) { box(70, 96, 100, stone(3, 4), sx * 165, 48, CZ + 20, castle); box(76, 6, 106, stone(3, 1), sx * 165, 99, CZ + 20, castle); }
  box(44, 250, 44, stone(2, 10), 70, 125, CZ - 70, castle); for (let i = 0; i < 6; i++) box(54 - i * 8, 7, 54 - i * 8, stone(2, 1), 70, 253 + i * 7, CZ - 70, castle);
  const slit = (x, y, z, ry, hh) => { box(6, hh, 1, win, x, y, z, castle).rotation.y = ry; const g = new THREE.Mesh(new THREE.PlaneGeometry(1.1, hh * 0.9), new THREE.MeshBasicMaterial({ color: 0xbfd4ff, transparent: true, opacity: 0.1, depthWrite: false })); g.position.set(x, y, z + (ry ? 0 : 0.7)); g.rotation.y = ry; castle.add(g); glints.push({ m: g.material, ph: rnd() * 6.28 }); };
  for (let row = 0; row < 3; row++) for (let i = -5; i <= 5; i++) slit(i * 24, 28 + row * 28, CZ + 0.6, 0, 18);
  for (const sx of [-1, 1]) for (let row = 0; row < 3; row++) for (let i = -1; i <= 1; i++) slit(sx * 165 + i * 22, 26 + row * 26, CZ + 70.6, 0, 16);
  for (let row = 0; row < 8; row++) slit(70, 30 + row * 28, CZ - 47.6, 0, 18);
  // The courtyard, the great doors, and the curtain wall with its wide open gate.
  box(300, 1, 160, new THREE.MeshLambertMaterial({ color: 0xcfc9b6 }), 0, 0.5, CZ + 80, castle);
  const wood = new THREE.MeshLambertMaterial({ color: 0x3a2a20 }), iron = new THREE.MeshPhongMaterial({ color: 0x2b2d36, shininess: 70, specular: 0x667088 });
  box(52, 72, 3, wood, 0, 36, CZ + 1.5, castle); box(52, 3, 4, iron, 0, 20, CZ + 2, castle); box(52, 3, 4, iron, 0, 52, CZ + 2, castle); box(2, 72, 4, iron, 0, 36, CZ + 2, castle); box(4, 4, 3, iron, -6, 34, CZ + 3, castle); box(4, 4, 3, iron, 6, 34, CZ + 3, castle);
  box(62, 6, 6, stone(3, 1), 0, 75, CZ + 2, castle);
  for (const sx of [-1, 1]) box(104, 84, 16, stone(5, 4), sx * 98, 42, GATE_Z, castle);
  box(100, 18, 16, stone(5, 1), 0, 93, GATE_Z, castle); box(110, 5, 18, stone(5, 1), 0, 104, GATE_Z, castle);
  for (const sx of [-1, 1]) { const leaf = new THREE.Group(); leaf.position.set(sx * 48, 0, GATE_Z); leaf.rotation.y = sx * 1.35; castle.add(leaf); for (let i = 0; i < 8; i++) box(1.6, 76, 1.6, iron, -sx * (3 + i * 5.8), 38, 0, leaf); for (const y of [10, 40, 70]) box(46, 2, 2, iron, -sx * 24, y, 0, leaf); }
  castle.updateMatrixWorld(true);
  // The castle's long shadow across the last of the way.
  const shade = new THREE.Mesh(new THREE.PlaneGeometry(520, 260), new THREE.MeshBasicMaterial({ color: 0x1c2030, transparent: true, opacity: 0.22, depthWrite: false })); shade.rotation.x = -Math.PI / 2; shade.position.set(0, 0.6, -575); scene.add(shade);
  return { scene, glints, sun, hemi: scene.children.find(o => o.isHemisphereLight), shade, update(dt, t) { for (const g of glints) g.m.opacity = 0.08 + 0.12 * (0.5 + 0.5 * Math.sin(t * 0.6 + g.ph)) * (0.5 + 0.5 * Math.sin(t * 0.23 + g.ph * 3)); } };
}

// What he carries: his father's knife, the satchel, and a flask at his belt (the flask is new).
function addGear(rig) {
  const box = F.box, plain = F.plain, g = new THREE.Group();
  const knife = new THREE.Group(); box(1.2, 8, 0.8, plain('#b9bfc8'), 0, -4.5, 0, knife); box(1.6, 3.6, 1.2, plain('#4a3626'), 0, 0, 0, knife); box(3, 0.7, 1.4, plain('#b8923a'), 0, -1.8, 0, knife); knife.position.set(-5.6, 2, 0.4); rig.hips.add(knife);
  const satchel = new THREE.Group(); box(1.3, 10, 4.7, plain('#6a4a2e'), 0, 6.5, 0, satchel).rotation.z = 0.37; box(2.6, 7, 8, plain('#8a6a42'), 5.4, 3, 0, satchel); box(2.9, 3, 8.2, plain('#6a4a2e'), 5.4, 5.6, 0, satchel); box(0.8, 1.6, 1.4, plain('#b8923a'), 6.9, 4.4, 0, satchel); rig.torso.add(satchel);
  const flask = new THREE.Group(); box(2.6, 5.6, 2.6, plain('#6f8294'), 0, -2.8, 0, flask); box(1.2, 1.4, 1.2, plain('#c8a060'), 0, 0.6, 0, flask); box(0.5, 4, 0.5, plain('#4a3626'), 0, 2.6, 0, flask); flask.position.set(-4.6, 1, 2.6); rig.hips.add(flask);
  return g;
}

function run(G, W) {
  return new Promise(async resolve => {
    const { jackOut, aOut } = W, el = G.renderer.domElement, camera = G.camera, nearOld = camera.near;
    const M = build(), scene = M.scene, world = { scene, update: M.update };
    scene.add(jackOut.root); jackOut.root.visible = true; W.paintJack(jackOut, { expr: 0 }); addGear(jackOut);
    G.setScene(world); G.drone = null; G.save({ step: 'meadow' });
    camera.near = 0.1; camera.updateProjectionMatrix();
    A && A.ambience({ wind: 0.14, birds: 0, fire: 0 });
    const st = { pos: v(0, 0, START_Z), heading: Math.PI, walkN: 0, walkPh: 0, mode: 'intro', free: false, camA: Math.PI / 2, pitch: 0.28, zoomF: 1, kk: K0, look: 0, shiver: 0, bob: 0, craned: 0, frown: 0, stillSaid: 0, toastAt: 0, spd: 0, gripPrev: false };
    // Jack's body: walking, looking, shivering.
    jackOut.after = r => {
      const w = Math.sin(st.walkPh) * 0.7 * st.walkN, t = G.t, sh = st.shiver * 0.05 * Math.sin(t * 38);
      r.legL.thigh.rotation.x = w - st.bob * 0.5; r.legR.thigh.rotation.x = -w - st.bob * 0.5; r.legL.knee.rotation.x = st.bob * 1.0; r.legR.knee.rotation.x = st.bob * 1.0;
      r.armL.rotation.x = -w * 0.8 + sh; r.armR.rotation.x = w * 0.8 - sh; r.armL.rotation.z = 0.06 + st.shiver * 0.18; r.armR.rotation.z = -0.06 - st.shiver * 0.18;
      r.neck.rotation.x = st.look; r.torso.rotation.x = 0.04 + st.craned * 0.08 + sh * 0.6; r.hips.position.y = 12 - st.bob * 3 + Math.abs(Math.sin(st.walkPh)) * 0.5 * st.walkN;
    };
    // ── HUD and controls ──
    const css = document.createElement('style');
    css.textContent = `#mwHud { position: fixed; inset: 0; pointer-events: none; z-index: 12; font-family: Georgia, serif; color: #ece8df; }
      #mwObj { position: absolute; top: 12px; left: 50%; transform: translateX(-50%); background: rgba(10,12,16,0.7); border: 1px solid #4a4d58; border-radius: 8px; padding: 8px 16px; font-size: clamp(13px, 1.9vw, 17px); text-align: center; display: none; }
      #mwToast { position: absolute; left: 50%; bottom: 22vh; transform: translateX(-50%); background: rgba(10,12,16,0.8); border: 1px solid #4a4d58; padding: 7px 15px; border-radius: 8px; font-size: 14px; max-width: 80vw; text-align: center; opacity: 0; transition: opacity .5s; }
      #mwBtns { position: absolute; right: 12px; bottom: 12px; display: flex; gap: 6px; pointer-events: auto; } #mwBtns button { margin: 0; padding: 12px 18px; font-size: 15px; background: rgba(20,22,30,0.85); touch-action: none; }
      #mwStick { position: absolute; left: 22px; bottom: 26px; width: 120px; height: 120px; border-radius: 50%; background: rgba(20,22,28,0.45); border: 2px solid rgba(230,196,106,0.55); touch-action: none; display: none; pointer-events: auto; }
      #mwKnob { position: absolute; left: 50%; top: 50%; width: 52px; height: 52px; margin: -26px 0 0 -26px; border-radius: 50%; background: rgba(230,196,106,0.75); pointer-events: none; } @media (pointer: coarse) { #mwStick { display: block; } }`;
    document.head.appendChild(css);
    const hud = document.createElement('div'); hud.id = 'mwHud'; hud.style.display = 'none';
    hud.innerHTML = '<div id="mwObj">Walk to the castle.</div><div id="mwToast"></div><div id="mwStick"><div id="mwKnob"></div></div><div id="mwBtns"><button id="mwZm">&minus;</button><button id="mwZp">+</button></div>';
    document.body.appendChild(hud);
    const $ = id => document.getElementById(id);
    const toast = (t, ms = 5000) => { $('mwToast').textContent = t; $('mwToast').style.opacity = 1; st.toastAt = performance.now() + ms; };
    const keys = {}, stick = { x: 0, y: 0 }, KM = { w: 'up', W: 'up', ArrowUp: 'up', s: 'down', S: 'down', ArrowDown: 'down', a: 'left', A: 'left', ArrowLeft: 'left', d: 'right', D: 'right', ArrowRight: 'right', q: 'camL', Q: 'camL', e: 'camR', E: 'camR', '+': 'zIn', '=': 'zIn', '-': 'zOut', _: 'zOut' };
    const typing = e => e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
    const kd = e => { if (typing(e)) return; const k = KM[e.key]; if (k) { keys[k] = true; if (e.key.startsWith('Arrow')) e.preventDefault(); } }, ku = e => { const k = KM[e.key]; if (k) keys[k] = false; };
    root.addEventListener('keydown', kd); root.addEventListener('keyup', ku);
    $('mwZm').onpointerdown = () => { keys.zOut = true; }; $('mwZp').onpointerdown = () => { keys.zIn = true; }; for (const id of ['mwZm', 'mwZp']) { const b = $(id); b.onpointerup = b.onpointerleave = b.onpointercancel = () => { keys.zOut = keys.zIn = false; }; }
    const drags = new Map();
    const pd = e => drags.set(e.pointerId, { x: e.clientX, y: e.clientY }), pm = e => { const d = drags.get(e.pointerId); if (!d || !st.free) return; const ox = d.x, oy = d.y; d.x = e.clientX; d.y = e.clientY;
      if (drags.size === 2) { const p = [...drags.values()], dist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); if (st.pinch) st.zoomF = clamp(st.zoomF * st.pinch / Math.max(20, dist), 0.3, 3.2); st.pinch = dist; return; }
      st.camA -= (d.x - ox) * 0.007; st.pitch = clamp(st.pitch + (d.y - oy) * 0.005, -0.5, 1.45); }, pu = e => { drags.delete(e.pointerId); st.pinch = 0; };
    const wheel = e => { e.preventDefault(); if (st.free) st.zoomF = clamp(st.zoomF * (e.deltaY > 0 ? 1.1 : 0.9), 0.3, 3.2); };
    el.addEventListener('wheel', wheel, { passive: false }); el.addEventListener('pointerdown', pd); el.addEventListener('pointermove', pm); el.addEventListener('pointerup', pu); el.addEventListener('pointercancel', pu);
    { const sEl = $('mwStick'), k = $('mwKnob'); let id = null; const set = e => { const r = sEl.getBoundingClientRect(); let dx = (e.clientX - r.left - r.width / 2) / (r.width / 2), dy = (e.clientY - r.top - r.height / 2) / (r.height / 2); const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; } stick.x = dx; stick.y = dy; k.style.transform = `translate(${dx * 34}px, ${dy * 34}px)`; };
      sEl.addEventListener('pointerdown', e => { id = e.pointerId; sEl.setPointerCapture(id); set(e); }); sEl.addEventListener('pointermove', e => { if (e.pointerId === id) set(e); }); const end = e => { if (e.pointerId === id) { id = null; stick.x = stick.y = 0; k.style.transform = ''; } }; sEl.addEventListener('pointerup', end); sEl.addEventListener('pointercancel', end); }

    // ── Each frame: the walk, and the camera when it is the player's. ──
    const camPos = new V3(), camLook = new V3();
    const blocked = (x, z) => x < -280 || x > 280 || z > 120 || z < -760 || (z < -688 && Math.abs(x) > 44);
    const place = () => { st.kk = kOf(st.pos.z); jackOut.root.scale.setScalar(SC * st.kk); jackOut.root.position.set(st.pos.x, -0.5 * st.bob * st.kk, st.pos.z); jackOut.root.rotation.y = st.heading; };
    const tick = dt => {
      if (st.mode === 'walk') {
        const f = v(-Math.cos(st.camA), 0, -Math.sin(st.camA)), r = v(Math.sin(st.camA), 0, -Math.cos(st.camA));
        const dir = v(0, 0, 0).addScaledVector(f, (keys.up ? 1 : 0) - (keys.down ? 1 : 0)).addScaledVector(r, (keys.right ? 1 : 0) - (keys.left ? 1 : 0));
        if (Math.hypot(stick.x, stick.y) > 0.2) dir.addScaledVector(f, -stick.y).addScaledVector(r, stick.x);
        if (dir.lengthSq() > 0) {
          dir.normalize(); st.heading += angDiff(Math.atan2(dir.x, dir.z), st.heading) * Math.min(1, dt * 10);
          const sp = 30 * SC * Math.pow(st.kk / K0, 0.6) * 0.43 * 2.3 * 0.62, nx = st.pos.x + Math.sin(st.heading) * sp * dt, nz = st.pos.z + Math.cos(st.heading) * sp * dt;     // (his stride shortens as he shrinks, but not as fast as his size)
          if (!blocked(nx, st.pos.z)) st.pos.x = nx; if (!blocked(st.pos.x, nz)) st.pos.z = nz; st.walkN = 1; st.walkPh += 10.9 * Math.pow(st.kk / SC, -0.35) * 0.55 * dt * 1.4;
        } else st.walkN = Math.max(0, st.walkN - dt * 6);
        st.bob = st.walkN * 0.15 * (0.5 + 0.5 * Math.sin(st.walkPh * 2));                                  // (the moss gives a little under each step)
        // The prose, as he goes.
        const p = clamp((START_Z - st.pos.z) / (START_Z - TRIGGER_Z), 0, 1);
        if (st.stillSaid === 0 && p > 0.04) { st.stillSaid = 1; A && A.ambience({ wind: 0, birds: 0, fire: 0 }); A && A.duckMusic && A.duckMusic(0.18, 5); G.caption('narrator', 'The breeze here carried no scent, no birdsong, no rustle of branch or leaf. Just stillness—deep and deliberate.'); }
        else if (st.stillSaid === 1 && p > 0.3) { st.stillSaid = 2; G.caption('narrator', 'His legs felt smaller. Not just tired—lighter. Each step seemed to fall more softly.'); }
        else if (st.stillSaid === 2 && p > 0.5) { st.stillSaid = 3; G.caption('narrator', 'He didn’t notice how the grass grew taller; didn’t notice how the breeze felt different—lower, closer, as though he were closer to the ground. Didn’t notice that when he stepped through the meadow’s edge, the flowers came to his hip instead of his shin.'); }
        else if (st.stillSaid === 3 && p > 0.76) { st.stillSaid = 4; G.caption('narrator', 'The air thinned again. Or perhaps he thinned. He walked until the castle’s shadow fell over him.'); }
        const sh = clamp((-st.pos.z - 520) / 90, 0, 1); M.hemi.intensity = 0.72 * (1 - 0.3 * sh); M.sun.intensity = 0.55 * (1 - 0.55 * sh);
        if (st.pos.z <= TRIGGER_Z && st.mode === 'walk') { st.mode = 'gate'; gate(); }
      }
      place();
      if (st.toastAt && performance.now() > st.toastAt) { $('mwToast').style.opacity = 0; st.toastAt = 0; }
      if (st.free) {
        if (keys.camL) st.camA += 1.7 * dt; if (keys.camR) st.camA -= 1.7 * dt; if (keys.zIn) st.zoomF = Math.max(0.3, st.zoomF - 1.2 * dt); if (keys.zOut) st.zoomF = Math.min(3.2, st.zoomF + 1.2 * dt);
        const kk = st.kk, d = 90 * kk * st.zoomF, at = v(st.pos.x, 14 * kk, st.pos.z), want = v(at.x + Math.cos(st.camA) * d * Math.cos(st.pitch), Math.max(0.4 * kk, at.y + Math.sin(st.pitch) * d * 0.9 + 6 * kk), at.z + Math.sin(st.camA) * d * Math.cos(st.pitch));
        if (camPos.lengthSq() === 0) camPos.copy(want); else camPos.lerp(want, Math.min(1, dt * 8)); camLook.copy(at); G.cut({ pos: camPos, look: camLook, fov: 50 });
      }
    };
    const cleanup = () => { root.removeEventListener('keydown', kd); root.removeEventListener('keyup', ku); el.removeEventListener('wheel', wheel); el.removeEventListener('pointerdown', pd); el.removeEventListener('pointermove', pm); el.removeEventListener('pointerup', pu); el.removeEventListener('pointercancel', pu); G.updaters = G.updaters.filter(u => u !== tick); hud.remove(); css.remove(); jackOut.after = null; jackOut.root.scale.setScalar(SC); camera.near = nearOld; camera.updateProjectionMatrix(); };
    place(); G.updaters.push(tick); G.meadow = { st };

    // ── The opening: the moss, the air, the land, the castle. ──
    const k = K0, S = () => st.pos, wait = G.wait;
    G.mode = 'cutscene'; document.body.classList.add('cutscene');
    const f = $('fade'); f.style.background = '#fff'; f.style.transition = 'none'; f.style.opacity = 1;
    G.cut({ pos: v(S().x + 5 * k * 10, 1.6, S().z + 18), look: v(S().x, 1.0, S().z), fov: 42 }); await wait(0.5);
    f.style.transition = ''; await G.fade(false, 2.2); f.style.background = '';
    // 1. The moss.
    st.look = 0.55; await G.say('narrator', 'The ground was spongy beneath his boots—not cloud but white moss, thick and soft, cool as riverbed stone. It gave slightly under his weight.');
    for (let i = 0; i < 2; i++) { for (let j = 0; j <= 12; j++) { st.bob = Math.sin(j / 12 * Math.PI) * 0.9; await wait(0.03); } await wait(0.25); } st.bob = 0;
    // 2. The air.
    G.cut({ pos: v(S().x + 7, 7.5, S().z + 17), look: v(S().x, 6.2, S().z - 6), fov: 44 }); st.look = -0.18;
    await G.say('narrator', 'The air was heavy with sweetness—honeysuckle, maybe, and something richer beneath it. Something old.');
    // 3. The land.
    st.look = 0; G.cut({ pos: v(-60, 22, S().z + 52), look: v(-10, 8, S().z - 120), fov: 52 });
    G.say('narrator', 'The land stretched wide. Meadow and stream, hill and haze. Nothing looked fully real, but it all felt present. Like it had been waiting for him to arrive.');
    await G.shot({ pos: v(70, 30, S().z + 40), look: v(10, 14, S().z - 260), fov: 56 }, 9, 'inOut'); G.captionOff && G.captionOff();
    // 4. The castle.
    G.cut({ pos: v(S().x + 3, 6, S().z + 22), look: v(0, 90, -760), fov: 34 });
    await G.say('narrator', 'Far off, rising above the strange meadows and curling silver streams, stood a castle. Enormous. Impossible.');
    G.say('narrator', 'A main body with two wings, its single tower shimmered in the light, and the stone looked like it had been carved from moonlight and bone.');
    await G.shot({ pos: v(S().x + 2, 8, S().z - 120), look: v(0, 120, -770), fov: 26 }, 8, 'inOut');
    await G.say('narrator', 'No flag flew. No gate moved. But the windows watched—tall and dark and glinting faintly, as if they caught more than sunlight.');
    G.cut({ pos: v(S().x - 7, 6, S().z + 16), look: v(S().x, 5.6, S().z), fov: 36 }); st.shiver = 1; st.heading = Math.PI + 0.2;
    await G.say('narrator', 'Jack shivered. He felt their gaze on him, cold and quiet, like breath on the back of his neck.');
    st.shiver = 0; await G.say('narrator', 'Jack walked.');
    // ── The walk ──
    G.skipping = false; G.mode = 'play'; document.body.classList.remove('cutscene'); G.hideLine && G.hideLine(); st.heading = Math.PI; st.look = 0; st.camA = Math.PI / 2; camPos.set(0, 0, 0);
    st.free = true; st.mode = 'walk'; hud.style.display = 'block'; $('mwObj').style.display = 'block'; toast('WASD or the stick to walk · drag to look round · wheel or + / − to zoom', 6500);

    // ── At the gate. ──
    async function gate() {
      st.free = false; st.walkN = 0; hud.style.display = 'none'; G.mode = 'cutscene'; document.body.classList.add('cutscene'); st.pos.x = clamp(st.pos.x, -26, 26); st.heading = Math.PI; const kk = K1;
      G.cut({ pos: v(st.pos.x + 6, 2.2, GATE_Z + 36), look: v(0, 56, GATE_Z), fov: 52 }); st.look = -0.7; st.craned = 1;
      G.say('narrator', 'The gate was wide. Too wide. The iron bars rose higher than the tallest tree, and he had to crane his neck to see the arch.');
      await G.shot({ pos: v(st.pos.x + 6, 1.4, GATE_Z + 22), look: v(0, 84, GATE_Z), fov: 58 }, 7, 'inOut');
      await G.say('narrator', 'They looked untouched by time or rust, but worn by memory.');
      G.cut({ pos: v(st.pos.x - 6, 3.2, GATE_Z + 24), look: v(st.pos.x, 2.6, GATE_Z + 6), fov: 36 }); st.look = 0.1; st.craned = 0; W.paintJack(jackOut, { expr: 4 });
      await G.say('narrator', 'His satchel felt heavier now. The belt tugged at his waist. The flask knocked against his knee. He frowned.');
      await G.say('jack', 'It isn’t the world that’s grown. It’s me. I’m getting smaller.');
      await G.say('narrator', 'The world wasn’t just bigger—he was smaller.');
      st.look = 0; W.paintJack(jackOut, { expr: 1 });
      G.cut({ pos: v(st.pos.x - 8, 3.6, GATE_Z + 20), look: v(st.pos.x, 2.4, GATE_Z - 4), fov: 42 });
      G.say('narrator', 'But Jack didn’t turn back; he stepped through the gate, and the air shifted again.');
      // He goes through, and the camera goes with him.
      for (let i = 0; i < 150; i++) { st.pos.z -= 0.45 * (kk / K1); st.pos.x *= 0.98; st.walkN = 1; st.walkPh += 0.42; st.bob = 0.12; const u = i / 150; G.cut({ pos: v(st.pos.x - 6 + 4 * u, 3 + u, st.pos.z + 16), look: v(st.pos.x, 2.4, st.pos.z - 6), fov: 42 }); await wait(0.04); }
      st.walkN = 0; st.bob = 0; await wait(0.9);
      A && A.bell && A.bell(0.7); A && A.duckMusic && A.duckMusic(0.05, 1);
      for (let i = 0; i < 20; i++) { G.cut({ pos: v(st.pos.x - 2 + (Math.random() - 0.5) * 0.4, 4 + (Math.random() - 0.5) * 0.3, st.pos.z + 12), look: v(st.pos.x, 3, st.pos.z - 10), fov: 42 }); await wait(0.04); }
      await G.say('narrator', 'Somewhere within the castle, a bell tolled.');
      await G.say('narrator', 'Low.'); await G.say('narrator', 'Slow.'); await G.say('narrator', 'As if it had been waiting for him.');
      await wait(1.2); await G.fade(true, 2.2); A && A.ambience({ wind: 0, birds: 0, fire: 0 });
      cleanup(); G.mode = 'end'; document.body.classList.remove('cutscene'); resolve({ gate: true });
    }
  });
}

root.Meadow = { run };
})(typeof window !== 'undefined' ? window : globalThis);

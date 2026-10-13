// Climbing Toward Consequence — a test level: walk Jack about the castle (js/castle.js, at 100% model scale).
//   Chapter One's controls (WASD or the stick, Shift runs, Space jumps, drag to look, V or the wheel to zoom), plus C for a first-person camera, and a slider that sets Jack's size from 5% to 150%.
//   The walls, furniture and sills are solid, found by walking the built scene (every opaque box); Jack steps up onto low things and can jump onto higher ones.
// Exposes CastleWalk.run(G, W): W is Night.build's world (Jack, in his outdoor clothes).
(function (root) {
'use strict';
const THREE = root.THREE, A = root.GameAudio, V3 = THREE.Vector3;
const v = (x, y, z) => new V3(x, y, z), clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const angDiff = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
const SC = 0.95, HEIGHT = 31, FULL = 1.4;                            // (Jack's model height at the cottage's 100% is 31; in the castle his "100%" is 1.4 times that, 43, and the ceiling, 86, is twice it)
const PLACES = [['Entrance hall', 0, 70, Math.PI], ['Corridor A', -180, -26, Math.PI / 2], ['Music hall', -150, 44, Math.PI], ['Library', -150, -98, Math.PI], ['Nursery', -250, -205, 0], ['Kitchen', 150, 0, Math.PI], ['Parlour', 310, -40, Math.PI],
  ['Bathing room', 320, -140, -Math.PI / 2], ['Hen roost', 280, -250, 0], ['Garden', 80, -200, Math.PI]];

// Every opaque box in the room becomes a collision box (floors, rugs and glass excepted), in a grid for quick lookup.
function collect(room, ceiling) {
  const boxes = [], grid = new Map(), CELL = 24, key = (a, b) => a * 4096 + b; room.updateMatrixWorld(true);
  room.traverse(o => {
    if (!o.isMesh || !o.visible) return; for (let p = o.parent; p; p = p.parent) if (p === ceiling || (p.userData && p.userData.noCollide)) return;
    if (o.material && (o.material.transparent || o.material.blending === THREE.AdditiveBlending)) return;
    const b = new THREE.Box3().setFromObject(o); if (b.max.x - b.min.x < 0.3 || b.max.z - b.min.z < 0.3) return;
    const low = b.max.y <= 0.7; if (low) { const m = o.matrixWorld.elements; if (b.max.y <= 0.15 || Math.abs(m[0] * m[2]) > 0.01) return; }          // (rugs and mats are floor he stands on, not walls: only the squared-up ones, whose boxes are true)
    const e = { x0: b.min.x, x1: b.max.x, z0: b.min.z, z1: b.max.z, y0: b.min.y, y1: b.max.y, low };
    { const m = o.material, c = m && !m.map && m.color; if (c) { const sc = c.clone().convertLinearToSRGB(), R = Math.round(sc.r * 255), G_ = Math.round(sc.g * 255), B_ = Math.round(sc.b * 255); e.wood = R >= 0x30 && R <= 0xa0 && R > G_ && G_ > B_ && R - B_ >= 14 && R - B_ <= 75; } }      // (brown, unglazed: wood he can get his hands into) boxes.push(e);
    for (let i = Math.floor(e.x0 / CELL); i <= Math.floor(e.x1 / CELL); i++) for (let j = Math.floor(e.z0 / CELL); j <= Math.floor(e.z1 / CELL); j++) { const k = key(i, j); (grid.get(k) || grid.set(k, []).get(k)).push(e); }
  });
  const near = (x, z, r) => { const out = [], seen = new Set(); for (let i = Math.floor((x - r) / CELL); i <= Math.floor((x + r) / CELL); i++) for (let j = Math.floor((z - r) / CELL); j <= Math.floor((z + r) / CELL); j++) { const c = grid.get(key(i, j)); if (c) for (const e of c) if (!seen.has(e)) { seen.add(e); out.push(e); } } return out; };
  return { boxes, near };
}

function run(G, W, opts) {
  opts = opts || {}; const story = !!opts.story, ROOMS = { hall: [-88, 88, -108, 108], kitchen: [92, 248, -109, 51], hallKitchenDoor: [86, 94, -45, -5] };
  return new Promise(async resolve => {
    const { jackOut, aOut } = W, el = G.renderer.domElement, camera = G.camera, nearOld = camera.near;
    const M = root.Castle.interior(), scene = M.scene, ceiling = M.ceiling;
    // In the story, only some rooms are his: the others' doors are shut, and the walls of the rest keep him in. (Jack comes in under the great door, at the size he left the meadow: a tenth.)
    const open = story ? (opts.rooms || ['hall', 'kitchen', 'hallKitchenDoor']).map(k => ROOMS[k]) : null;
    if (story) { const near = (d, r) => { const x = d.axis === 'z' ? d.c : d.fixed, z = d.axis === 'z' ? d.fixed : d.c, e = 6; return x > r[0] - e && x < r[1] + e && z > r[2] - e && z < r[3] + e && !(x > r[0] + e && x < r[1] - e && z > r[2] + e && z < r[3] - e); };
      const STATES = opts.doors || [['x', -90, -25.5, 'ajar'], ['x', 90, -25, 'open'], ['z', -111, 162, 'closed'], ['x', 250, -75, 'closed']];     // the narrow corridor's doors pulled to; the kitchen's open; the garden's and the parlour's shut
      for (const d of M.doors) { const sp = STATES.find(q => q[0] === d.axis && Math.abs(q[1] - d.fixed) < 3 && Math.abs(q[2] - d.c) < 6);
        if (sp && sp[3] === 'open') continue; if (sp && sp[3] === 'ajar') { d.lg.rotation.y = Math.sign(d.lg.rotation.y || 1) * 0.42; d.og.userData.noCollide = false; continue; }
        if (sp || open.some(r => near(d, r))) { d.lg.rotation.y = 0; d.og.userData.noCollide = false; } } for (const h of M.hallLeaves) h.lf.rotation.y = 0; }
    const world = { scene, update(dt, t) { M.update(dt, t); aOut.t += dt; root.Blocky.step(jackOut, dt); } };
    // two more horses' worth of toys are not wanted here: one rocking horse is all the nursery has (see castle.js)
    const C = collect(M.room, ceiling);
    scene.add(jackOut.root); jackOut.root.visible = true; W.paintJack(jackOut, { expr: 0 }); root.Meadow && root.Meadow.addGear && root.Meadow.addGear(jackOut);
    G.setScene(world); G.drone = null; if (!story) G.noSave = true;
    camera.near = 0.4; camera.far = 1600; camera.updateProjectionMatrix(); let nearS = 0;
    A && A.ambience({ wind: 0, birds: 0, fire: 0.2 });
    const st = { pos: v(0, 0, story ? 98 : 70), heading: Math.PI, walkN: 0, walkPh: 0, camA: Math.PI / 2, pitch: 0.35, fpPitch: 0, zoom: 1, vy: 0, y: 0, jumpReq: false, s: story ? (opts.scale || 0.1) : FULL, fp: false, scene: false, perch: null, air: false, cl: null, mant: null, stam: 1, climbPh: 0, toastAt: 0 };
    jackOut.after = r => {
      const w = Math.sin(st.walkPh) * 0.7 * st.walkN;
      r.legL.thigh.rotation.x = w; r.legR.thigh.rotation.x = -w; r.legL.knee.rotation.x = 0; r.legR.knee.rotation.x = 0;
      r.armL.rotation.x = -w * 0.8; r.armR.rotation.x = w * 0.8; r.armL.rotation.z = 0.06; r.armR.rotation.z = -0.06; r.neck.rotation.x = 0; r.torso.rotation.x = 0.04; r.hips.position.y = 12 + Math.abs(Math.sin(st.walkPh)) * 0.5 * st.walkN;
      if (st.cl) { const c = Math.sin(st.climbPh); r.armL.rotation.x = -2.5 + 0.5 * c; r.armR.rotation.x = -2.5 - 0.5 * c; r.legL.thigh.rotation.x = -0.9 - 0.5 * c; r.legR.thigh.rotation.x = -0.9 + 0.5 * c; r.legL.knee.rotation.x = 0.9; r.legR.knee.rotation.x = 0.9; r.torso.rotation.x = -0.15; }
      else if (st.mant) { r.armL.rotation.x = r.armR.rotation.x = -2.2; r.legL.thigh.rotation.x = -1.0; r.legR.thigh.rotation.x = -0.3; r.legL.knee.rotation.x = 1.0; }
      else if (st.air) { r.armL.rotation.x = r.armR.rotation.x = -2.5; r.legL.thigh.rotation.x = -0.5; r.legR.thigh.rotation.x = 0.25; r.legR.knee.rotation.x = 0.5; }                    // (the leap, as in Chapter One)
    };
    // ── HUD and controls ──
    const css = document.createElement('style');
    css.textContent = `#cwHud { position: fixed; inset: 0; pointer-events: none; z-index: 12; font-family: Georgia, serif; color: #ece8df; }
      #cwPanel { position: absolute; top: 12px; left: 12px; background: rgba(10,12,16,0.78); border: 1px solid #4a4d58; border-radius: 8px; padding: 8px 12px; font-size: 14px; pointer-events: auto; display: flex; flex-direction: column; gap: 6px; max-width: 46vw; }
      #cwPanel input[type=range] { width: 200px; max-width: 40vw; } #cwPanel select { background: #20232e; color: #ece8df; border: 1px solid #4a4d58; border-radius: 6px; padding: 4px; font-size: 14px; }
      #cwToast { position: absolute; left: 50%; bottom: 22vh; transform: translateX(-50%); background: rgba(10,12,16,0.8); border: 1px solid #4a4d58; padding: 7px 15px; border-radius: 8px; font-size: 14px; max-width: 80vw; text-align: center; opacity: 0; transition: opacity .5s; }
      #cwBtns { position: absolute; right: 12px; bottom: 12px; display: flex; gap: 6px; pointer-events: auto; } #cwBtns button { margin: 0; padding: 12px 18px; font-size: 15px; background: rgba(20,22,30,0.85); touch-action: none; }
      #cwStick { position: absolute; left: 22px; bottom: 26px; width: 120px; height: 120px; border-radius: 50%; background: rgba(20,22,28,0.45); border: 2px solid rgba(230,196,106,0.55); touch-action: none; display: none; pointer-events: auto; }
      #cwKnob { position: absolute; left: 50%; top: 50%; width: 52px; height: 52px; margin: -26px 0 0 -26px; border-radius: 50%; background: rgba(230,196,106,0.75); pointer-events: none; } @media (pointer: coarse) { #cwStick { display: block; } }
      #cwStamW { position: absolute; left: 50%; bottom: 14vh; transform: translateX(-50%); width: 160px; height: 10px; background: rgba(10,12,16,0.7); border: 1px solid #4a4d58; border-radius: 5px; display: none; overflow: hidden; } #cwStam { height: 100%; width: 100%; background: #e6c46a; }
      #cwCross { position: absolute; left: 50%; top: 50%; width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%; background: rgba(255,255,255,0.7); display: none; }`;
    document.head.appendChild(css);
    const hud = document.createElement('div'); hud.id = 'cwHud';
    hud.innerHTML = '<div id="cwPanel"><label>Jack’s size: <b id="cwPct">100%</b><br><input id="cwScale" type="range" min="5" max="150" step="1" value="100"></label><select id="cwGo"><option value="">Go to…</option></select></div><div id="cwStamW"><div id="cwStam"></div></div><div id="cwCross"></div><div id="cwToast"></div><div id="cwStick"><div id="cwKnob"></div></div><div id="cwBtns"><button id="cwJump" class="touchonly">Jump</button><button id="cwView">View: Third person</button><button id="cwZoom">Zoom</button></div>';
    document.body.appendChild(hud);
    const $ = id => document.getElementById(id);
    const toast = (t, ms = 6000) => { $('cwToast').textContent = t; $('cwToast').style.opacity = 1; st.toastAt = performance.now() + ms; };
    const keys = {}, stick = { x: 0, y: 0 }, KM = { w: 'up', W: 'up', ArrowUp: 'up', s: 'down', S: 'down', ArrowDown: 'down', a: 'left', A: 'left', ArrowLeft: 'left', d: 'right', D: 'right', ArrowRight: 'right', Shift: 'run' };
    const runB = document.createElement('button'); runB.textContent = 'Run'; runB.className = 'touchonly'; runB.onpointerdown = () => { keys.run = true; }; runB.onpointerup = runB.onpointerleave = runB.onpointercancel = () => { keys.run = false; }; $('cwBtns').appendChild(runB);
    const typing = e => e.target && /TEXTAREA|SELECT/.test(e.target.tagName) || (e.target && e.target.tagName === 'INPUT' && e.target.type !== 'range');
    const ZOOMS = [{ name: 'Close', d: 52 }, { name: 'Medium', d: 92 }, { name: 'Far', d: 150 }, { name: 'Wide', d: 520 }];
    function cycleZoom(dir) { st.zoom = (st.zoom + (dir || 1) + ZOOMS.length) % ZOOMS.length; $('cwZoom').textContent = 'Zoom: ' + ZOOMS[st.zoom].name; }
    function toggleView() { st.fp = !st.fp; $('cwView').textContent = 'View: ' + (st.fp ? 'First person' : 'Third person'); $('cwCross').style.display = st.fp ? 'block' : 'none'; jackOut.root.visible = !st.fp; if (st.fp) st.fpPitch = 0; }
    const kd = e => { if (typing(e)) return; const k = KM[e.key]; if (k) { keys[k] = true; if (e.key.startsWith('Arrow')) e.preventDefault(); } if (e.key === ' ') { keys.space = true; e.preventDefault(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } if (e.repeat) return; if (e.key === ' ') st.jumpReq = true; if (e.key === 'v' || e.key === 'V') cycleZoom(); if (e.key === 'c' || e.key === 'C') toggleView(); }, ku = e => { const k = KM[e.key]; if (k) keys[k] = false; if (e.key === ' ') keys.space = false; };
    root.addEventListener('keydown', kd); root.addEventListener('keyup', ku);
    $('cwZoom').onclick = () => cycleZoom(); $('cwZoom').textContent = 'Zoom: ' + ZOOMS[st.zoom].name; $('cwView').onclick = toggleView; $('cwJump').onpointerdown = e => { e.preventDefault(); st.jumpReq = true; keys.space = true; }; $('cwJump').onpointerup = $('cwJump').onpointerleave = $('cwJump').onpointercancel = () => { keys.space = false; };
    $('cwScale').oninput = () => { st.s = +$('cwScale').value / 100 * FULL; $('cwPct').textContent = Math.round(st.s / FULL * 100) + '%'; };
    $('cwScale').onchange = () => $('cwScale').blur();
    for (const [i, p] of PLACES.entries()) { const o = document.createElement('option'); o.value = i; o.textContent = p[0]; $('cwGo').appendChild(o); }
    $('cwGo').onchange = () => { const p = PLACES[+$('cwGo').value]; $('cwGo').value = ''; $('cwGo').blur(); if (!p) return; st.pos.set(p[1], 0, p[2]); st.heading = p[3]; st.y = 0; st.vy = 0; st.camA = Math.atan2(-Math.cos(p[3]), -Math.sin(p[3])) + 0; camPos.set(0, 0, 0); };
    const drags = new Map();
    const pd = e => drags.set(e.pointerId, { x: e.clientX, y: e.clientY }), pu = e => drags.delete(e.pointerId);
    const pm = e => { const d = drags.get(e.pointerId); if (!d) return; st.camA += (e.clientX - d.x) * 0.006; if (st.fp) st.fpPitch = clamp(st.fpPitch + (e.clientY - d.y) * 0.005, -1.3, 1.3); else st.pitch = clamp(st.pitch + (e.clientY - d.y) * 0.005, -0.9, 1.35); d.x = e.clientX; d.y = e.clientY; };
    const wheel = e => { e.preventDefault(); if (!st.fp) cycleZoom(e.deltaY > 0 ? 1 : -1); };
    el.addEventListener('wheel', wheel, { passive: false }); el.addEventListener('pointerdown', pd); el.addEventListener('pointermove', pm); el.addEventListener('pointerup', pu); el.addEventListener('pointercancel', pu);
    { const sEl = $('cwStick'), k = $('cwKnob'); let id = null; const set = e => { const r = sEl.getBoundingClientRect(); let dx = (e.clientX - r.left - r.width / 2) / (r.width / 2), dy = (e.clientY - r.top - r.height / 2) / (r.height / 2); const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; } stick.x = dx; stick.y = dy; k.style.transform = `translate(${dx * 34}px, ${dy * 34}px)`; };
      sEl.addEventListener('pointerdown', e => { id = e.pointerId; sEl.setPointerCapture(id); set(e); }); sEl.addEventListener('pointermove', e => { if (e.pointerId === id) set(e); }); const end = e => { if (e.pointerId === id) { id = null; stick.x = stick.y = 0; k.style.transform = ''; } }; sEl.addEventListener('pointerup', end); sEl.addEventListener('pointercancel', end); }

    // ── Collision: a circle against the boxes, vertically as tall as Jack. ──
    const camPos = new V3(), camLook = new V3();
    const step = () => 4 * st.s;                                                       // how high a ledge he steps straight up onto
    const blockedAt = (x, z, y) => { const r = 4 * st.s, top = y + HEIGHT * st.s * 0.98, up = y + step(); if (x < M.bounds.x0 || x > M.bounds.x1 || z < M.bounds.z0 || z > M.bounds.z1) return true;
      if (open && !open.some(q => x > q[0] && x < q[1] && z > q[2] && z < q[3])) return true;
      if (st.perch && (x < st.perch.x0 || x > st.perch.x1 || z < st.perch.z0 || z > st.perch.z1)) return true;                      // (on a rung he cannot walk off: only jump)
      if (story && st.bread && x < -83.5 && z > -43 && z < -8) return true;                                  // (once he has smelt it, the narrow corridor's doors are as far as he goes)
      for (const e of C.near(x, z, r)) { if (e.low || e.y1 <= up || e.y0 >= top) continue; const cx = clamp(x, e.x0, e.x1), cz = clamp(z, e.z0, e.z1); if ((x - cx) * (x - cx) + (z - cz) * (z - cz) < r * r) return true; } return false; };
    const floorAt = (x, z, y) => { const r = 3 * st.s, up = y + step() + 0.5; let g = 0; for (const e of C.near(x, z, r)) { if (e.y1 > up || e.y1 <= g) continue; const cx = clamp(x, e.x0, e.x1), cz = clamp(z, e.z0, e.z1); if ((x - cx) * (x - cx) + (z - cz) * (z - cz) < r * r) g = e.y1; } return g; };
    const ceilAt = p => (Math.abs(p.x) < 92 && Math.abs(p.z) < 112) ? root.Castle.HH : M.H;                     // (the hall's ceiling is higher)
    const camBlocked = (p, s) => { if (p.y > ceilAt(p) - 9) return true; for (const e of C.near(p.x, p.z, 3)) if (e.y1 - e.y0 > 30 && p.x > e.x0 - 1.5 * s && p.x < e.x1 + 1.5 * s && p.z > e.z0 - 1.5 * s && p.z < e.z1 + 1.5 * s && p.y > e.y0 && p.y < e.y1) return true; return false; };

    const tick = dt => {
      if (st.scene) { jackOut.root.scale.setScalar(SC * st.s); jackOut.root.position.set(st.pos.x, st.y, st.pos.z); jackOut.root.rotation.y = st.heading; return; }
      const s = st.s; if (Math.abs(s - nearS) > 0.02) { nearS = s; camera.near = Math.max(0.1, 0.3 * s); camera.updateProjectionMatrix(); }       // (a nearer near plane only as he is small: the depth buffer keeps its precision, so flat surfaces do not shimmer)
      const f = v(-Math.cos(st.camA), 0, -Math.sin(st.camA)), r = v(Math.sin(st.camA), 0, -Math.cos(st.camA));
      if (st.lockT > 0) { st.lockT -= dt; keys.up = keys.down = keys.left = keys.right = false; stick.x = stick.y = 0; st.heading += angDiff(st.lockH, st.heading) * Math.min(1, dt * 5); st.camA += angDiff(Math.atan2(-Math.cos(st.lockH), -Math.sin(st.lockH)), st.camA) * Math.min(1, dt * 3); }
      const Hj = HEIGHT * SC * s, busy = !!(st.cl || st.mant);
      const dir = v(0, 0, 0).addScaledVector(f, (keys.up ? 1 : 0) - (keys.down ? 1 : 0)).addScaledVector(r, (keys.right ? 1 : 0) - (keys.left ? 1 : 0));
      if (Math.hypot(stick.x, stick.y) > 0.2) dir.addScaledVector(f, -stick.y).addScaledVector(r, stick.x);
      if (busy) { st.walkN = 0; } else if (dir.lengthSq() > 0) {
        dir.normalize(); const want = Math.atan2(dir.x, dir.z); st.heading += angDiff(want, st.heading) * Math.min(1, dt * 9);
        const off = Math.abs(angDiff(want, st.heading)), ease = clamp(1 - off / Math.PI * 0.8, 0.2, 1), sp = (keys.run ? 50 : 26) * SC * Math.pow(s, 0.6) * ease, nx = st.pos.x + Math.sin(st.heading) * sp * dt, nz = st.pos.z + Math.cos(st.heading) * sp * dt;
        if (!blockedAt(nx, st.pos.z, st.y)) st.pos.x = nx; if (!blockedAt(st.pos.x, nz, st.y)) st.pos.z = nz; st.walkN = 1; st.walkPh += 10.9 * Math.pow(s, -0.35) * 0.55 * dt * 1.4 * (keys.run ? 1.5 : 1);
      } else st.walkN = Math.max(0, st.walkN - dt * 6);
      if (story && !st.loaf && st.pos.x > 96 && st.pos.z > -109 && st.pos.z < 51) { st.loaf = true; st.lockT = 1.8; st.lockH = Math.atan2(175 - st.pos.x, -36 - st.pos.z); G.caption('jack', 'A loaf! A freshly baked loaf, right there on the table.'); setTimeout(() => G.caption('jack', 'It must be miles up... I wonder if I could climb to it.'), 3400); }
      if (story) { const near = st.pos.x < -82.5 && st.pos.z > -43 && st.pos.z < -8;                                   // (right up at the narrow corridor's doors, where the smell of bread comes through the gap)
        if (near && !st.inZone) { st.inZone = true;
          if (!st.bread) { st.bread = true; st.lockT = 2.2; st.lockH = Math.atan2(90 - st.pos.x, -25 - st.pos.z); G.caption('jack', 'Is that... warm bread?'); setTimeout(() => G.caption('jack', 'I can smell it from here. I haven\u2019t eaten since... I\u2019m starving.'), 3200); }
          else { if (performance.now() - (st.remindAt || 0) > 6000) { st.remindAt = performance.now(); G.caption('jack', 'Not that way. I’m starving, and that bread has to be somewhere close.'); } } }
        else if (!near) st.inZone = false; }
      const gy = floorAt(st.pos.x, st.pos.z, st.y), rj = 4 * s;
      // Wood he can get his hands to: a short step up (to three quarters of his height) is a mantle; anything taller, a climb, which tires him fast (about a height and a half) unless there is a rung to rest on, and a rung or a top he can pull onto within one more height.
      const pointOn = (e, x, z) => [clamp(x, e.x0, e.x1), clamp(z, e.z0, e.z1)];
      const startMantle = e => { const mx = Math.min(rj * 0.8, (e.x1 - e.x0) / 2), mz = Math.min(rj * 0.8, (e.z1 - e.z0) / 2), x0 = e.x0 + mx, x1 = e.x1 - mx, z0 = e.z0 + mz, z1 = e.z1 - mz;
        let to = null, bd = 1e9; for (let i = 0; i <= 16; i++) for (let j = 0; j <= 16; j++) { const x = x0 + (x1 - x0) * i / 16, z = z0 + (z1 - z0) * j / 16; if (blockedAt(x, z, e.y1)) continue; const d = Math.hypot(x - st.pos.x, z - st.pos.z); if (d < bd) { bd = d; to = [x, z]; } }       // (he slides along to the nearest spot of it that is clear of the wood he was holding)
        if (!to) to = [clamp(st.pos.x, x0, x1), clamp(st.pos.z, z0, z1)];
        st.mant = { e, t: 0, dur: 0.6, from: { x: st.pos.x, y: st.y, z: st.pos.z }, to: { x: to[0], y: e.y1, z: to[1] } }; st.cl = null; st.vy = 0; };
      const tryClimb = () => { const R = rj + 1.2 * s, fx = Math.sin(st.heading), fz = Math.cos(st.heading); let best = null;
        for (const e of C.near(st.pos.x, st.pos.z, R + 2)) { if (!e.wood || e.low || e.y1 <= st.y + 0.45 * Hj || e.y0 > st.y + 0.5 * Hj) continue; const [qx, qz] = pointOn(e, st.pos.x, st.pos.z), dx = qx - st.pos.x, dz = qz - st.pos.z, d = Math.hypot(dx, dz);
          if (d > R || (d > 0.01 && (dx * fx + dz * fz) / d < 0.2)) continue; if (!best || e.y1 > best.e.y1) best = { e, qx, qz, d }; }
        if (!best) return false; const gap = best.e.y1 - st.y; if (gap <= 0.5 * Hj) return false; if (gap <= 0.75 * Hj) { startMantle(best.e); return true; }
        let nx = st.pos.x - best.qx, nz = st.pos.z - best.qz; const nl = Math.hypot(nx, nz); if (nl < 0.01) { nx = -fx; nz = -fz; } else { nx /= nl; nz /= nl; }
        st.pos.x = best.qx + nx * 6.5 * s; st.pos.z = best.qz + nz * 6.5 * s; st.heading = Math.atan2(-nx, -nz); st.cl = { e: best.e }; st.stam = 1; st.vy = 0; return true; };
      if (st.jumpReq) { st.jumpReq = false; if (!busy && st.y <= gy + 0.01 && !tryClimb()) { st.vy = 112 * s; st.perch = null; } }
      if (st.mant) { const m = st.mant; m.t += dt; const k = clamp(m.t / m.dur, 0, 1); st.pos.x = m.from.x + (m.to.x - m.from.x) * k; st.pos.z = m.from.z + (m.to.z - m.from.z) * k; st.y = m.from.y + (m.to.y - m.from.y) * k + Math.sin(k * Math.PI) * 0.4 * Hj * 0.4; if (k >= 1) { st.y = m.to.y; st.mant = null; st.vy = 0; st.stam = 1; st.perch = m.e && Math.min(m.e.x1 - m.e.x0, m.e.z1 - m.e.z0) < 20 * s ? m.e : null; } }
      else if (st.cl) {
        st.climbPh += dt * 9; if (!keys.space || st.stam <= 0) { st.cl = null; }
        else { const sp = 0.8 * Hj; st.y += sp * dt; st.stam -= sp * dt / (1.6 * Hj); let plat = null;
          for (const e of C.near(st.pos.x, st.pos.z, 1.2 * Hj + 3)) { if (!e.wood || e.low || e.y1 <= st.y + 0.3 * Hj || e.y1 > st.y + 1.0 * Hj) continue; const [qx, qz] = pointOn(e, st.pos.x, st.pos.z); if (Math.hypot(qx - st.pos.x, qz - st.pos.z) > 0.8 * Hj) continue; if (!plat || e.y1 > plat.y1) plat = e; }
          if (plat) startMantle(plat); }
      }
      if (!busy || (!st.cl && !st.mant)) {
        if (st.vy <= 0 && st.y <= gy + 0.4 * s && !st.cl && !st.mant) { st.y += (gy - st.y) * Math.min(1, dt * 22); st.vy = 0; } else if (!st.cl && !st.mant) { st.vy -= 420 * s * dt; st.y += st.vy * dt; if (st.y < gy) { st.y = gy; st.vy = 0; } else if (st.vy > 0 && blockedAt(st.pos.x, st.pos.z, st.y)) st.vy = 0; }
      }
      st.air = !st.cl && !st.mant && (st.vy > 1 || st.y > gy + 0.5 * s); if (!st.air && !st.cl && !st.mant) st.stam = 1;
      $('cwStamW').style.display = st.cl ? 'block' : 'none'; $('cwStam').style.width = Math.max(0, st.stam * 100) + '%';
      jackOut.root.scale.setScalar(SC * s); jackOut.root.position.set(st.pos.x, st.y, st.pos.z); jackOut.root.rotation.y = st.heading;
      if (st.toastAt && performance.now() > st.toastAt) { $('cwToast').style.opacity = 0; st.toastAt = 0; }
      // the camera: behind him (never snapping back), or through his eyes
      if (st.fp) {
        const eye = v(st.pos.x, st.y + 27 * SC * s, st.pos.z), d = v(-Math.cos(st.camA) * Math.cos(st.fpPitch), -Math.sin(st.fpPitch), -Math.sin(st.camA) * Math.cos(st.fpPitch));
        camPos.copy(eye).addScaledVector(d, -0.01); camLook.copy(eye).addScaledVector(d, 10); G.cut({ pos: camPos, look: camLook, fov: 72 });
      } else {
        const d = ZOOMS[st.zoom].d * s, at = v(st.pos.x, st.y + 15 * SC * s, st.pos.z), dirv = v(Math.cos(st.camA) * Math.cos(st.pitch), Math.sin(st.pitch), Math.sin(st.camA) * Math.cos(st.pitch));
        let reach = d, p = v(0, 0, 0); for (let u = 4 * s; u <= d; u += Math.max(1, 2 * s)) { p.copy(at).addScaledVector(dirv, u); p.y = Math.max(p.y, 1.2 * s); if (camBlocked(p, s)) { reach = Math.max(4 * s, u - 3 * s); break; } }
        const want = at.clone().addScaledVector(dirv, reach); want.y = Math.max(want.y, 1.2 * s);                       // (the camera slides along the floor, never below it, and tilts up to take in the ceiling)
        if (camPos.lengthSq() === 0) camPos.copy(want); else camPos.lerp(want, Math.min(1, dt * 10)); camLook.copy(at); camLook.y += Math.max(0, -st.pitch) * d * 0.9; G.cut({ pos: camPos, look: camLook, fov: 48 });
      }
    };
    const cleanup = () => { root.removeEventListener('keydown', kd); root.removeEventListener('keyup', ku); el.removeEventListener('wheel', wheel); el.removeEventListener('pointerdown', pd); el.removeEventListener('pointermove', pm); el.removeEventListener('pointerup', pu); el.removeEventListener('pointercancel', pu); G.updaters = G.updaters.filter(u => u !== tick); hud.remove(); css.remove(); jackOut.after = null; jackOut.root.scale.setScalar(SC); jackOut.root.visible = true; camera.near = nearOld; camera.updateProjectionMatrix(); };
    G.updaters.push(tick); G.castleWalk = { st, cleanup, resolve, C, M };
    const toastTxt = story ? 'WASD or the stick to walk \u00b7 Shift runs \u00b7 Space jumps \u00b7 drag to look \u00b7 V or the wheel zooms \u00b7 C for first person' : 'WASD or the stick to walk \u00b7 Shift runs \u00b7 Space jumps \u00b7 drag to look \u00b7 V or the wheel zooms \u00b7 C for first person';
    const f = $('fade');
    if (!story) { G.mode = 'play'; document.body.classList.remove('cutscene'); G.hideLine && G.hideLine(); toast(toastTxt); f.style.transition = ''; await G.fade(false, 1.2); return; }
    // ── The story: the hall, from a few angles, and what it says to him; then it is his. ──
    st.scene = true; G.mode = 'cutscene'; document.body.classList.add('cutscene'); $('cwPanel').style.display = 'none'; G.save({ step: 'castle' });
    const wait = G.wait, walkTo = async (tx, tz, secs) => { const x0 = st.pos.x, z0 = st.pos.z, n = Math.max(2, Math.round(secs / 0.04)); st.heading = Math.atan2(tx - x0, tz - z0); for (let i = 1; i <= n; i++) { const k = i / n; st.pos.x = x0 + (tx - x0) * k; st.pos.z = z0 + (tz - z0) * k; st.walkN = 1; st.walkPh += 10.9 * Math.pow(st.s, -0.35) * 0.55 * 0.04 * 1.4; await wait(0.04); } st.walkN = 0; };
    st.pos.set(0, 0, 94); st.heading = Math.PI; G.cut({ pos: v(-3, 1.6, 101), look: v(0, 24, 62), fov: 58 });
    f.style.transition = ''; G.fade(false, 1.6);
    await G.shot({ pos: v(-3, 1.6, 101), look: v(0, 118, 12), fov: 58 }, 6, 'inOut'); await wait(0.5);
    walkTo(0, 76, 4.2); G.cut({ pos: v(-34, 1.8, 66), look: v(6, 22, 8), fov: 54 }); await G.shot({ pos: v(-26, 2.2, 50), look: v(14, 20, 6), fov: 54 }, 5, 'inOut');
    G.cut({ pos: v(4, 2.4, 58), look: v(0, 2.4, 76), fov: 38 }); W.paintJack(jackOut, { expr: 1 }); await wait(1.0);
    await G.say('jack', 'Who lives in a place like this?');
    await G.shot({ pos: v(0, 7, -96), look: v(0, 3, 76), fov: 46 }, 5, 'inOut');
    await G.say('jack', 'A table set for one, and a hall you could lose a village in.');
    G.cut({ pos: v(3, 2.7, 64), look: v(0, 2.7, 76), fov: 32 }); await wait(0.8);
    await G.say('jack', 'There has to be something here I can carry home. Something Mother can’t argue with.');
    await wait(0.4); const kk = st.s, d0 = 92 * kk; await G.shot({ pos: v(0, 15 * SC * kk + Math.sin(0.5) * d0, st.pos.z + d0 * Math.cos(0.5)), look: v(0, 15 * SC * kk, st.pos.z), fov: 48 }, 1.6, 'inOut');
    G.skipping = false; st.scene = false; G.mode = 'play'; document.body.classList.remove('cutscene'); G.hideLine && G.hideLine(); st.heading = Math.PI; st.camA = Math.PI / 2; camPos.set(0, 0, 0); toast(toastTxt, 6500);
  });
}

root.CastleWalk = { run };
})(typeof window !== 'undefined' ? window : globalThis);

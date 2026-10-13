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
    if (!o.isMesh || !o.visible) return; for (let p = o.parent; p; p = p.parent) if (p === ceiling) return;
    if (o.material && (o.material.transparent || o.material.blending === THREE.AdditiveBlending)) return;
    const b = new THREE.Box3().setFromObject(o); if (b.max.y <= 0.6 || b.max.x - b.min.x < 0.3 || b.max.z - b.min.z < 0.3) return;
    const e = { x0: b.min.x, x1: b.max.x, z0: b.min.z, z1: b.max.z, y0: b.min.y, y1: b.max.y }; boxes.push(e);
    for (let i = Math.floor(e.x0 / CELL); i <= Math.floor(e.x1 / CELL); i++) for (let j = Math.floor(e.z0 / CELL); j <= Math.floor(e.z1 / CELL); j++) { const k = key(i, j); (grid.get(k) || grid.set(k, []).get(k)).push(e); }
  });
  const near = (x, z, r) => { const out = [], seen = new Set(); for (let i = Math.floor((x - r) / CELL); i <= Math.floor((x + r) / CELL); i++) for (let j = Math.floor((z - r) / CELL); j <= Math.floor((z + r) / CELL); j++) { const c = grid.get(key(i, j)); if (c) for (const e of c) if (!seen.has(e)) { seen.add(e); out.push(e); } } return out; };
  return { boxes, near };
}

function run(G, W) {
  return new Promise(async resolve => {
    const { jackOut, aOut } = W, el = G.renderer.domElement, camera = G.camera, nearOld = camera.near;
    const M = root.Castle.interior(), scene = M.scene, ceiling = M.ceiling;
    const world = { scene, update(dt, t) { M.update(dt, t); aOut.t += dt; root.Blocky.step(jackOut, dt); } };
    // two more horses' worth of toys are not wanted here: one rocking horse is all the nursery has (see castle.js)
    const C = collect(M.room, ceiling);
    scene.add(jackOut.root); jackOut.root.visible = true; W.paintJack(jackOut, { expr: 0 }); root.Meadow && root.Meadow.addGear && root.Meadow.addGear(jackOut);
    G.setScene(world); G.drone = null; G.noSave = true;
    camera.near = 0.1; camera.far = 4000; camera.updateProjectionMatrix();
    A && A.ambience({ wind: 0, birds: 0, fire: 0.2 });
    const st = { pos: v(0, 0, 70), heading: Math.PI, walkN: 0, walkPh: 0, camA: Math.PI / 2, pitch: 0.35, fpPitch: 0, zoom: 1, vy: 0, y: 0, jumpReq: false, s: FULL, fp: false, toastAt: 0 };
    jackOut.after = r => {
      const w = Math.sin(st.walkPh) * 0.7 * st.walkN;
      r.legL.thigh.rotation.x = w; r.legR.thigh.rotation.x = -w; r.legL.knee.rotation.x = 0; r.legR.knee.rotation.x = 0;
      r.armL.rotation.x = -w * 0.8; r.armR.rotation.x = w * 0.8; r.armL.rotation.z = 0.06; r.armR.rotation.z = -0.06; r.neck.rotation.x = 0; r.torso.rotation.x = 0.04; r.hips.position.y = 12 + Math.abs(Math.sin(st.walkPh)) * 0.5 * st.walkN;
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
      #cwCross { position: absolute; left: 50%; top: 50%; width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%; background: rgba(255,255,255,0.7); display: none; }`;
    document.head.appendChild(css);
    const hud = document.createElement('div'); hud.id = 'cwHud';
    hud.innerHTML = '<div id="cwPanel"><label>Jack’s size: <b id="cwPct">100%</b><br><input id="cwScale" type="range" min="5" max="150" step="1" value="100"></label><select id="cwGo"><option value="">Go to…</option></select></div><div id="cwCross"></div><div id="cwToast"></div><div id="cwStick"><div id="cwKnob"></div></div><div id="cwBtns"><button id="cwJump" class="touchonly">Jump</button><button id="cwView">View: Third person</button><button id="cwZoom">Zoom</button></div>';
    document.body.appendChild(hud);
    const $ = id => document.getElementById(id);
    const toast = (t, ms = 6000) => { $('cwToast').textContent = t; $('cwToast').style.opacity = 1; st.toastAt = performance.now() + ms; };
    const keys = {}, stick = { x: 0, y: 0 }, KM = { w: 'up', W: 'up', ArrowUp: 'up', s: 'down', S: 'down', ArrowDown: 'down', a: 'left', A: 'left', ArrowLeft: 'left', d: 'right', D: 'right', ArrowRight: 'right', Shift: 'run' };
    const runB = document.createElement('button'); runB.textContent = 'Run'; runB.className = 'touchonly'; runB.onpointerdown = () => { keys.run = true; }; runB.onpointerup = runB.onpointerleave = runB.onpointercancel = () => { keys.run = false; }; $('cwBtns').appendChild(runB);
    const typing = e => e.target && /TEXTAREA|SELECT/.test(e.target.tagName) || (e.target && e.target.tagName === 'INPUT' && e.target.type !== 'range');
    const ZOOMS = [{ name: 'Close', d: 52 }, { name: 'Medium', d: 92 }, { name: 'Far', d: 150 }];
    function cycleZoom(dir) { st.zoom = (st.zoom + (dir || 1) + ZOOMS.length) % ZOOMS.length; $('cwZoom').textContent = 'Zoom: ' + ZOOMS[st.zoom].name; }
    function toggleView() { st.fp = !st.fp; $('cwView').textContent = 'View: ' + (st.fp ? 'First person' : 'Third person'); $('cwCross').style.display = st.fp ? 'block' : 'none'; jackOut.root.visible = !st.fp; if (st.fp) st.fpPitch = 0; }
    const kd = e => { if (typing(e)) return; const k = KM[e.key]; if (k) { keys[k] = true; if (e.key.startsWith('Arrow')) e.preventDefault(); } if (e.key === ' ') { e.preventDefault(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } if (e.repeat) return; if (e.key === ' ') st.jumpReq = true; if (e.key === 'v' || e.key === 'V') cycleZoom(); if (e.key === 'c' || e.key === 'C') toggleView(); }, ku = e => { const k = KM[e.key]; if (k) keys[k] = false; };
    root.addEventListener('keydown', kd); root.addEventListener('keyup', ku);
    $('cwZoom').onclick = () => cycleZoom(); $('cwZoom').textContent = 'Zoom: ' + ZOOMS[st.zoom].name; $('cwView').onclick = toggleView; $('cwJump').onpointerdown = e => { e.preventDefault(); st.jumpReq = true; };
    $('cwScale').oninput = () => { st.s = +$('cwScale').value / 100 * FULL; $('cwPct').textContent = Math.round(st.s / FULL * 100) + '%'; };
    $('cwScale').onchange = () => $('cwScale').blur();
    for (const [i, p] of PLACES.entries()) { const o = document.createElement('option'); o.value = i; o.textContent = p[0]; $('cwGo').appendChild(o); }
    $('cwGo').onchange = () => { const p = PLACES[+$('cwGo').value]; $('cwGo').value = ''; $('cwGo').blur(); if (!p) return; st.pos.set(p[1], 0, p[2]); st.heading = p[3]; st.y = 0; st.vy = 0; st.camA = Math.atan2(-Math.cos(p[3]), -Math.sin(p[3])) + 0; camPos.set(0, 0, 0); };
    const drags = new Map();
    const pd = e => drags.set(e.pointerId, { x: e.clientX, y: e.clientY }), pu = e => drags.delete(e.pointerId);
    const pm = e => { const d = drags.get(e.pointerId); if (!d) return; st.camA += (e.clientX - d.x) * 0.006; if (st.fp) st.fpPitch = clamp(st.fpPitch + (e.clientY - d.y) * 0.005, -1.3, 1.3); else st.pitch = clamp(st.pitch + (e.clientY - d.y) * 0.005, 0.08, 1.35); d.x = e.clientX; d.y = e.clientY; };
    const wheel = e => { e.preventDefault(); if (!st.fp) cycleZoom(e.deltaY > 0 ? 1 : -1); };
    el.addEventListener('wheel', wheel, { passive: false }); el.addEventListener('pointerdown', pd); el.addEventListener('pointermove', pm); el.addEventListener('pointerup', pu); el.addEventListener('pointercancel', pu);
    { const sEl = $('cwStick'), k = $('cwKnob'); let id = null; const set = e => { const r = sEl.getBoundingClientRect(); let dx = (e.clientX - r.left - r.width / 2) / (r.width / 2), dy = (e.clientY - r.top - r.height / 2) / (r.height / 2); const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; } stick.x = dx; stick.y = dy; k.style.transform = `translate(${dx * 34}px, ${dy * 34}px)`; };
      sEl.addEventListener('pointerdown', e => { id = e.pointerId; sEl.setPointerCapture(id); set(e); }); sEl.addEventListener('pointermove', e => { if (e.pointerId === id) set(e); }); const end = e => { if (e.pointerId === id) { id = null; stick.x = stick.y = 0; k.style.transform = ''; } }; sEl.addEventListener('pointerup', end); sEl.addEventListener('pointercancel', end); }

    // ── Collision: a circle against the boxes, vertically as tall as Jack. ──
    const camPos = new V3(), camLook = new V3();
    const step = () => 4 * st.s;                                                       // how high a ledge he steps straight up onto
    const blockedAt = (x, z, y) => { const r = 4 * st.s, top = y + HEIGHT * st.s * 0.98, up = y + step(); if (x < M.bounds.x0 || x > M.bounds.x1 || z < M.bounds.z0 || z > M.bounds.z1) return true;
      for (const e of C.near(x, z, r)) { if (e.y1 <= up || e.y0 >= top) continue; const cx = clamp(x, e.x0, e.x1), cz = clamp(z, e.z0, e.z1); if ((x - cx) * (x - cx) + (z - cz) * (z - cz) < r * r) return true; } return false; };
    const floorAt = (x, z, y) => { const r = 3 * st.s, up = y + step() + 0.5; let g = 0; for (const e of C.near(x, z, r)) { if (e.y1 > up || e.y1 <= g) continue; const cx = clamp(x, e.x0, e.x1), cz = clamp(z, e.z0, e.z1); if ((x - cx) * (x - cx) + (z - cz) * (z - cz) < r * r) g = e.y1; } return g; };
    const camBlocked = (p, s) => { if (p.y > M.H - 2 || p.y < 1 * s) return true; for (const e of C.near(p.x, p.z, 3)) if (e.y1 - e.y0 > 30 && p.x > e.x0 - 1.5 * s && p.x < e.x1 + 1.5 * s && p.z > e.z0 - 1.5 * s && p.z < e.z1 + 1.5 * s && p.y > e.y0 && p.y < e.y1) return true; return false; };

    const tick = dt => {
      const s = st.s, f = v(-Math.cos(st.camA), 0, -Math.sin(st.camA)), r = v(Math.sin(st.camA), 0, -Math.cos(st.camA));
      const dir = v(0, 0, 0).addScaledVector(f, (keys.up ? 1 : 0) - (keys.down ? 1 : 0)).addScaledVector(r, (keys.right ? 1 : 0) - (keys.left ? 1 : 0));
      if (Math.hypot(stick.x, stick.y) > 0.2) dir.addScaledVector(f, -stick.y).addScaledVector(r, stick.x);
      if (dir.lengthSq() > 0) {
        dir.normalize(); const want = Math.atan2(dir.x, dir.z); st.heading += angDiff(want, st.heading) * Math.min(1, dt * 9);
        const off = Math.abs(angDiff(want, st.heading)), ease = clamp(1 - off / Math.PI * 0.8, 0.2, 1), sp = (keys.run ? 50 : 26) * SC * Math.pow(s, 0.6) * ease, nx = st.pos.x + Math.sin(st.heading) * sp * dt, nz = st.pos.z + Math.cos(st.heading) * sp * dt;
        if (!blockedAt(nx, st.pos.z, st.y)) st.pos.x = nx; if (!blockedAt(st.pos.x, nz, st.y)) st.pos.z = nz; st.walkN = 1; st.walkPh += 10.9 * Math.pow(s, -0.35) * 0.55 * dt * 1.4 * (keys.run ? 1.5 : 1);
      } else st.walkN = Math.max(0, st.walkN - dt * 6);
      const gy = floorAt(st.pos.x, st.pos.z, st.y);
      if (st.jumpReq) { st.jumpReq = false; if (st.y <= gy + 0.01) st.vy = 112 * s; }
      if (st.vy <= 0 && st.y <= gy + 0.4 * s) { st.y += (gy - st.y) * Math.min(1, dt * 22); st.vy = 0; } else { st.vy -= 420 * s * dt; st.y += st.vy * dt; if (st.y < gy) { st.y = gy; st.vy = 0; } else if (st.vy > 0 && blockedAt(st.pos.x, st.pos.z, st.y)) st.vy = 0; }
      jackOut.root.scale.setScalar(SC * s); jackOut.root.position.set(st.pos.x, st.y, st.pos.z); jackOut.root.rotation.y = st.heading;
      if (st.toastAt && performance.now() > st.toastAt) { $('cwToast').style.opacity = 0; st.toastAt = 0; }
      // the camera: behind him (never snapping back), or through his eyes
      if (st.fp) {
        const eye = v(st.pos.x, st.y + 27 * SC * s, st.pos.z), d = v(-Math.cos(st.camA) * Math.cos(st.fpPitch), -Math.sin(st.fpPitch), -Math.sin(st.camA) * Math.cos(st.fpPitch));
        camPos.copy(eye).addScaledVector(d, -0.01); camLook.copy(eye).addScaledVector(d, 10); G.cut({ pos: camPos, look: camLook, fov: 72 });
      } else {
        const d = ZOOMS[st.zoom].d * s, at = v(st.pos.x, st.y + 15 * SC * s, st.pos.z), dirv = v(Math.cos(st.camA) * Math.cos(st.pitch), Math.sin(st.pitch), Math.sin(st.camA) * Math.cos(st.pitch));
        let reach = d, p = v(0, 0, 0); for (let u = 4 * s; u <= d; u += Math.max(1, 2 * s)) { p.copy(at).addScaledVector(dirv, u); if (camBlocked(p, s)) { reach = Math.max(4 * s, u - 3 * s); break; } }
        const want = at.clone().addScaledVector(dirv, reach);
        if (camPos.lengthSq() === 0) camPos.copy(want); else camPos.lerp(want, Math.min(1, dt * 10)); camLook.copy(at); G.cut({ pos: camPos, look: camLook, fov: 48 });
      }
    };
    const cleanup = () => { root.removeEventListener('keydown', kd); root.removeEventListener('keyup', ku); el.removeEventListener('wheel', wheel); el.removeEventListener('pointerdown', pd); el.removeEventListener('pointermove', pm); el.removeEventListener('pointerup', pu); el.removeEventListener('pointercancel', pu); G.updaters = G.updaters.filter(u => u !== tick); hud.remove(); css.remove(); jackOut.after = null; jackOut.root.scale.setScalar(SC); jackOut.root.visible = true; camera.near = nearOld; camera.updateProjectionMatrix(); };
    G.updaters.push(tick); G.castleWalk = { st, cleanup, resolve };
    G.mode = 'play'; document.body.classList.remove('cutscene'); G.hideLine && G.hideLine();
    toast('WASD or the stick to walk · Shift runs · Space jumps · drag to look · V or the wheel zooms · C for first person');
    const f = $('fade'); f.style.transition = ''; await G.fade(false, 1.2);
  });
}

root.CastleWalk = { run };
})(typeof window !== 'undefined' ? window : globalThis);

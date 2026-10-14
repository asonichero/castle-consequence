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
function collect(room, ceiling, pantry) {
  const boxes = [], grid = new Map(), CELL = 24, key = (a, b) => a * 4096 + b; room.updateMatrixWorld(true);
  room.traverse(o => {
    if (!o.isMesh || !o.visible) return; for (let p = o.parent; p; p = p.parent) if (p === ceiling || (p.userData && p.userData.noCollide)) return;
    if (o.material && (o.material.transparent || o.material.blending === THREE.AdditiveBlending)) return;
    const b = new THREE.Box3().setFromObject(o); if (b.max.x - b.min.x < 0.3 || b.max.z - b.min.z < 0.3) return;
    const low = b.max.y <= 0.7; if (low) { const m = o.matrixWorld.elements; if (b.max.y <= 0.15 || Math.abs(m[0] * m[2]) > 0.01) return; }          // (rugs and mats are floor he stands on, not walls: only the squared-up ones, whose boxes are true)
    const e = { x0: b.min.x, x1: b.max.x, z0: b.min.z, z1: b.max.z, y0: b.min.y, y1: b.max.y, low };
    if (pantry) for (let q = o.parent; q; q = q.parent) if (q === pantry) { e.pantry = true; break; }
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
        if (sp || open.some(r => near(d, r))) { d.openAng = d.lg.rotation.y; d.lg.rotation.y = 0; d.og.userData.noCollide = false; } } for (const h of M.hallLeaves) h.lf.rotation.y = 0; }
    let gerda = null; const world = { scene, update(dt, t) { M.update(dt, t); aOut.t += dt; if (st && st.wriggle && st.inHand && gerda && jackOut.root.parent === gerda.wrist && root.GerdaHold) { const J = root.GerdaHold.jack, w = t * 1; jackOut.root.rotation.set(J.rx + 0.045 * Math.sin(w * 3.1), J.ry + 0.06 * Math.sin(w * 2.3 + 1), J.rz + 0.04 * Math.sin(w * 3.7 + 2)); jackOut.root.position.set(J.px + 0.02 * Math.sin(w * 2.9), J.py + 0.025 * Math.sin(w * 3.3 + 1), J.pz + 0.02 * Math.sin(w * 2.1)); }
      root.Blocky.step(jackOut, dt); if (gerda) root.Blocky.step(gerda, dt); } };
    // two more horses' worth of toys are not wanted here: one rocking horse is all the nursery has (see castle.js)
    const C = collect(M.room, ceiling, M.items.pantry && M.items.pantry.g);
    const things = []; if (story) { M.room.updateMatrixWorld(true); M.room.traverse(o => { if (o.userData && o.userData.item) { const w = new V3(); o.getWorldPosition(w); things.push(Object.assign({ o, pos: w }, o.userData.item)); } }); }
    scene.add(jackOut.root); jackOut.root.visible = true; W.paintJack(jackOut, { expr: 0 }); root.Meadow && root.Meadow.addGear && root.Meadow.addGear(jackOut);
    G.setScene(world); G.drone = null; if (!story) G.noSave = true;
    camera.near = 0.4; camera.far = 1600; camera.updateProjectionMatrix(); let nearS = 0;
    A && A.ambience({ wind: 0, birds: 0, fire: 0.2 });
    const st = { pos: v(0, 0, story ? 98 : 70), heading: Math.PI, walkN: 0, walkPh: 0, camA: Math.PI / 2, pitch: 0.35, fpPitch: 0, zoom: 1, vy: 0, y: 0, jumpReq: false, s: story ? (opts.scale || 0.1) : FULL, fp: false, scene: false, actReq: false, putReq: false, eaten: 0, perch: null, air: false, cl: null, mant: null, stam: 1, climbPh: 0, toastAt: 0 };
    jackOut.after = r => {
      const w = Math.sin(st.walkPh) * 0.7 * st.walkN;
      r.legL.thigh.rotation.x = w; r.legR.thigh.rotation.x = -w; r.legL.knee.rotation.x = 0; r.legR.knee.rotation.x = 0;
      r.armL.rotation.x = -w * 0.8; r.armR.rotation.x = w * 0.8; r.armL.rotation.z = 0.06; r.armR.rotation.z = -0.06; r.neck.rotation.x = 0; r.torso.rotation.x = 0.04; r.hips.position.y = 12 + Math.abs(Math.sin(st.walkPh)) * 0.5 * st.walkN;
      if (st.cl) { const c = Math.sin(st.climbPh); r.armL.rotation.x = -2.5 + 0.5 * c; r.armR.rotation.x = -2.5 - 0.5 * c; r.legL.thigh.rotation.x = -0.9 - 0.5 * c; r.legR.thigh.rotation.x = -0.9 + 0.5 * c; r.legL.knee.rotation.x = 0.9; r.legR.knee.rotation.x = 0.9; r.torso.rotation.x = -0.15; }
      else if (st.mant) { r.armL.rotation.x = r.armR.rotation.x = -2.2; r.legL.thigh.rotation.x = -1.0; r.legR.thigh.rotation.x = -0.3; r.legL.knee.rotation.x = 1.0; }
      else if (st.inHand && root.GerdaHold) { const J = root.GerdaHold.jack, wg = st.wriggle ? 0.3 * Math.sin(G.t * 3.4) : 0, wg2 = st.wriggle ? 0.3 * Math.sin(G.t * 2.7 + 1.5) : 0; r.armL.rotation.set(J.armLx + 0.3 * wg, 0, J.armLz + 0.2 * wg2); r.armR.rotation.set(J.armRx - 0.3 * wg, 0, J.armRz - 0.2 * wg2); r.legL.thigh.rotation.x = J.legLx + 0.35 * wg2; r.legR.thigh.rotation.x = J.legRx - 0.35 * wg; r.legL.knee.rotation.x = J.kneeL; r.legR.knee.rotation.x = J.kneeR; r.torso.rotation.x = J.torsoX; r.neck.rotation.x = J.neckX; }
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
      #cwPrompt { position: absolute; left: 50%; bottom: 30vh; transform: translateX(-50%); background: rgba(10,12,16,0.82); border: 1px solid #c9a84c; color: #f3e4b0; padding: 6px 14px; border-radius: 8px; font-size: 15px; display: none; white-space: nowrap; }
      #cwObjt { position: absolute; top: 12px; left: 50%; transform: translateX(-50%); background: rgba(10,12,16,0.7); border: 1px solid #4a4d58; border-radius: 8px; padding: 8px 16px; font-size: 16px; display: none; }
      #cwCross { position: absolute; left: 50%; top: 50%; width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%; background: rgba(255,255,255,0.7); display: none; }`;
    document.head.appendChild(css);
    const hud = document.createElement('div'); hud.id = 'cwHud';
    hud.innerHTML = '<div id="cwPanel"><label>Jack’s size: <b id="cwPct">100%</b><br><input id="cwScale" type="range" min="5" max="150" step="1" value="100"></label><select id="cwGo"><option value="">Go to…</option></select></div><div id="cwObjt"></div><div id="cwPrompt"></div><div id="cwStamW"><div id="cwStam"></div></div><div id="cwCross"></div><div id="cwToast"></div><div id="cwStick"><div id="cwKnob"></div></div><div id="cwBtns"><button id="cwJump" class="touchonly">Jump</button><button id="cwView">View: Third person</button><button id="cwZoom">Zoom</button></div>';
    document.body.appendChild(hud);
    const $ = id => document.getElementById(id);
    const toast = (t, ms = 6000) => { $('cwToast').textContent = t; $('cwToast').style.opacity = 1; st.toastAt = performance.now() + ms; };
    const keys = {}, stick = { x: 0, y: 0 }, KM = { w: 'up', W: 'up', ArrowUp: 'up', s: 'down', S: 'down', ArrowDown: 'down', a: 'left', A: 'left', ArrowLeft: 'left', d: 'right', D: 'right', ArrowRight: 'right', Shift: 'run' };
    const runB = document.createElement('button'); runB.textContent = 'Run'; runB.className = 'touchonly'; runB.onpointerdown = () => { keys.run = true; }; runB.onpointerup = runB.onpointerleave = runB.onpointercancel = () => { keys.run = false; }; $('cwBtns').appendChild(runB);
    const typing = e => e.target && /TEXTAREA|SELECT/.test(e.target.tagName) || (e.target && e.target.tagName === 'INPUT' && e.target.type !== 'range');
    const ZOOMS = [{ name: 'Close', d: 52 }, { name: 'Medium', d: 92 }, { name: 'Far', d: 150 }, { name: 'Wide', d: 520 }];
    function cycleZoom(dir) { st.zoom = (st.zoom + (dir || 1) + ZOOMS.length) % ZOOMS.length; $('cwZoom').textContent = 'Zoom: ' + ZOOMS[st.zoom].name; }
    function toggleView() { st.fp = !st.fp; $('cwView').textContent = 'View: ' + (st.fp ? 'First person' : 'Third person'); $('cwCross').style.display = st.fp ? 'block' : 'none'; jackOut.root.visible = !st.fp; if (st.fp) st.fpPitch = 0; }
    const kd = e => { if (typing(e)) return; const k = KM[e.key]; if (k) { keys[k] = true; if (e.key.startsWith('Arrow')) e.preventDefault(); } if (e.key === ' ') { keys.space = true; e.preventDefault(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } if (e.repeat) return; if (e.key === ' ') st.jumpReq = true; if (e.key === 'v' || e.key === 'V') cycleZoom(); if (e.key === 'c' || e.key === 'C') toggleView(); if (e.key === 'e' || e.key === 'E') st.actReq = true; if (e.key === 'q' || e.key === 'Q') st.putReq = true; }, ku = e => { const k = KM[e.key]; if (k) keys[k] = false; if (e.key === ' ') keys.space = false; };
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
    const floorAt = (x, z, y) => { const r = 1.2 * st.s, up = y + step() + 0.5; let g = 0; for (const e of C.near(x, z, r)) { if (e.y1 > up || e.y1 <= g) continue; const cx = clamp(x, e.x0, e.x1), cz = clamp(z, e.z0, e.z1); if ((x - cx) * (x - cx) + (z - cz) * (z - cz) < r * r) g = e.y1; } return g; };
    const ceilAt = p => (Math.abs(p.x) < 92 && Math.abs(p.z) < 112) ? root.Castle.HH : M.H;                     // (the hall's ceiling is higher)
    const camBlocked = (p, s) => { if (p.y > ceilAt(p) - 9) return true; for (const e of C.near(p.x, p.z, 3)) if ((e.y1 - e.y0 > 30 || (st.inCup && e.pantry)) && p.x > e.x0 - 1.5 * s && p.x < e.x1 + 1.5 * s && p.z > e.z0 - 1.5 * s && p.z < e.z1 + 1.5 * s && p.y > e.y0 && p.y < e.y1) return true; return false; };

    // ── The kitchen table: things to look at, crumbs to take or leave, the loaf that is not his, and then footsteps overhead. ──
    const say = t => G.caption('jack', t), later = (ms, f) => setTimeout(f, ms), tableG = M.items.kitchenTable.g, pantryG = M.items.pantry.g;
    const promptEl = () => $('cwPrompt');
    function storyTick(dt) {
      const Hj = HEIGHT * SC * st.s, pr = promptEl(); let text = '';
      { const lp = pantryG.worldToLocal(new V3(st.pos.x, st.y, st.pos.z)); st.inCup = Math.abs(lp.x) < 11.6 && lp.z > -6.2 && lp.z < 6.4 && lp.y > -1 && lp.y < 22; }               // (inside the cupboard its walls and doors hold the camera in)
      if (st.hiding) { pr.style.display = 'none'; return; }
      if (st.busy) { pr.style.display = 'none'; st.actReq = st.putReq = false; return; }                          // (he is saying what he has to say: nothing else can be touched until it is said)
      const onTable = st.y >= 25.3 && Math.abs(st.pos.x - tableG.position.x) <= 25 && Math.abs(st.pos.z - tableG.position.z) <= 13;
      if (onTable && !st.tMount) st.tMount = performance.now();
      if (st.tMount && !st.alarm) { const el = (performance.now() - st.tMount) / 1000; if ((st.loafTaken && el >= 50) || el >= 110) alarm(); }
      const act = st.actReq, put = st.putReq; st.actReq = st.putReq = false;
      if (st.held) {                                                                                       // a crumb in his hand: eat it, or put it back
        text = 'E \u2014 eat it     Q \u2014 put it back';
        if (act) { st.eaten++; const k = st.held; st.held = null; const mm = say(st.eaten === 1 ? 'Mm. Sorry. It was only a crumb.' : 'Mm.'); if (st.eaten >= 4) { st.busy = true; mm.then(() => say('That barely touched it... I’m still hungry.')).then(() => { st.loafReady = true; st.busy = false; }); } }
        else if (put) { st.held.o.visible = true; st.held = null; say('No. Better to leave it where it was.'); }
      } else {
        let best = null, bd = 1e9;
        for (const t of things) { if (t.kind === 'crumb' && !t.o.visible) continue; const dx = t.pos.x - st.pos.x, dz = t.pos.z - st.pos.z, d = Math.hypot(dx, dz); if (d < (t.kind === 'crumb' ? 1.7 : 3.4) * Hj && Math.abs(t.pos.y - st.y) < 1.4 * Hj && d < bd) { best = t; bd = d; } }
        if (best) {
          text = best.kind === 'crumb' ? 'E \u2014 pick up the crumb' : best.kind === 'loaf' ? (st.loafReady ? 'E \u2014 take a crumb of the loaf' : 'E \u2014 look at the loaf') : 'E \u2014 look';
          if (act) {
            if (best.kind === 'look') say(best.text);
            else if (best.kind === 'crumb') { best.o.visible = false; st.held = best; if (!st.firstCrumb) { st.firstCrumb = true; say('Should I? It isn’t mine... it doesn’t belong to me.'); } }
            else if (best.kind === 'loaf') {
              if (!st.loafReady) say(best.text);
              else if (!st.loafHes) { st.loafHes = true; say('Mother would say not to take what isn’t offered.'); }
              else if (!st.loafTaken) { st.loafTaken = true; say('Just one crumb. A loaf that size won’t miss it.'); }
              else say('I’ve had my crumb.');
            }
          }
        }
      }
      pr.textContent = text; pr.style.display = text ? 'block' : 'none';
    }
    function alarm() {
      st.alarm = true; st.shakeT = 1.4; A && A.thud && A.thud(0.8); say('What was that? Movement... above me.');
      later(3200, () => { A && A.thud && A.thud(0.9); st.shakeT = 1.0; say('Footsteps. Someone’s coming! I have to hide!'); $('cwObjt').textContent = 'Find somewhere to hide.'; $('cwObjt').style.display = 'block'; later(22000, gerdaScene); });
    }
    // ── Gerda, at full size: she opens the parlour door, circles the kitchen looking, and ends at the cupboard. Whatever she sees, she sees by line of sight. ──
    const GS = FULL, gst = { x: 0, z: 0, h: 0, ph: 0, walk: 0, bend: 0, reach: 0, look: 0 }, EYE = 41;
    const gsay = t => G.caption('gerda', t);
    function placeGerda() { gerda.root.position.set(gst.x, 0, gst.z); gerda.root.rotation.y = gst.h; }
    function makeG() { gerda = root.Blocky.makeGerda('Fine'); gerda.root.scale.setScalar(GS); scene.add(gerda.root); gerda.after = r => { const w = Math.sin(gst.ph) * 0.62 * gst.walk; r.legL.thigh.rotation.x = w; r.legR.thigh.rotation.x = -w; r.armL.rotation.x = -w * 0.7; r.armR.rotation.x = w * 0.7 - gst.reach; r.torso.rotation.x = gst.bend; r.neck.rotation.x = gst.look - gst.bend * 0.6;
      const h = gst.hold || 0, HP = root.GerdaHold && root.GerdaHold.gerda; if (h > 0 && HP) { const L = (a, b) => a + (b - a) * h;                                  // holding Jack: the pose set in pose-editor.html (js/gerda-pose.js)
        r.hips.position.y -= HP.hipsY * h; r.torso.rotation.set(L(r.torso.rotation.x, HP.torsoX), L(0, HP.torsoY), L(0, HP.torsoZ)); r.neck.rotation.set(L(r.neck.rotation.x, HP.neckX), L(0, HP.neckY), 0);
        r.armR.rotation.set(L(r.armR.rotation.x, HP.armRx), 0, L(0, HP.armRz)); r.elbow.rotation.x = L(0, HP.elbowX); r.wrist.rotation.y = L(0, HP.wristY); r.armL.rotation.set(L(r.armL.rotation.x, HP.armLx), 0, L(0, HP.armLz));
        r.legL.thigh.rotation.x = L(w, HP.legLx) + w * h; r.legL.knee.rotation.x = L(0, HP.legLknee); r.legR.thigh.rotation.x = L(-w, HP.legRx) - w * h; r.legR.knee.rotation.x = L(0, HP.legRknee); }
      if (gst.give > 0) { const k = gst.give, L2 = (a, b) => a + (b - a) * k; r.armR.rotation.x = L2(r.armR.rotation.x, gst.gArm === undefined ? -1.5 : gst.gArm); r.armR.rotation.z = L2(r.armR.rotation.z, 0.05); r.elbow.rotation.x = L2(r.elbow.rotation.x, -0.15); r.torso.rotation.x = L2(r.torso.rotation.x, gst.gTorso === undefined ? 0.5 : gst.gTorso); r.neck.rotation.x = L2(r.neck.rotation.x, 0.25); }
      if (gst.lreach > 0) r.armL.rotation.set(-gst.lreach, 0, 0.05); if (gst.sniff) r.neck.rotation.x += gst.sniff;
      if (gst.alive) { const t = G.t, a = gst.alive, tk = gst.talk || 0, ls = gst.listen || 0;                       // (she is not a statue: she breathes, shifts her weight, turns her head, talks with her free hand, and feels him wriggle)
        r.torso.rotation.x += a * 0.012 * Math.sin(t * 1.5); r.torso.rotation.y += a * (0.025 * Math.sin(t * 0.55) + 0.015 * tk * Math.sin(t * 1.8)); r.torso.rotation.z += a * 0.012 * Math.sin(t * 0.8 + 1);
        r.neck.rotation.y += a * (0.04 * Math.sin(t * 0.63) + 0.02 * tk * Math.sin(t * 2.4)); r.neck.rotation.x += a * (0.02 * Math.sin(t * 0.9 + 1) + 0.03 * tk * Math.sin(t * 3.2) + 0.08 * ls); r.neck.rotation.z += a * 0.015 * Math.sin(t * 0.7 + 2);
        if (!(gst.lreach > 0)) { r.armL.rotation.x += a * (0.03 * Math.sin(t * 1.3) - 0.18 * tk * (0.5 + 0.5 * Math.sin(t * 1.7))); r.armL.rotation.z += a * (0.03 + 0.08 * tk * (0.5 + 0.5 * Math.sin(t * 1.5 + 1))); }
        if (st.wriggle) { r.armR.rotation.x += a * 0.008 * Math.sin(t * 3.4); r.armR.rotation.z += a * 0.008 * Math.sin(t * 2.7 + 1); }
        r.hips.rotation.y = a * 0.015 * Math.sin(t * 0.5 + 0.5); } }; placeGerda(); }
    const seen = () => {                                                                                    // does she see him? from her eyes to his head, chest and feet, through the boxes that stand between
      if (!gerda || st.caught) return st.caught; const Hj = HEIGHT * SC * st.s;
      if (gst.cupOpen && st.inCup && Math.hypot(st.pos.x - gst.x, st.pos.z - gst.z) < 60) return true;
      const ey = (EYE - gst.bend * 16) * GS / 1.4, ex = gst.x + Math.sin(gst.h) * 4, ez = gst.z + Math.cos(gst.h) * 4;
      for (const f of [0.85, 0.5, 0.12]) { const tx = st.pos.x, ty = st.y + f * Hj, tz = st.pos.z, dx = tx - ex, dy = ty - ey, dz = tz - ez, L = Math.hypot(dx, dy, dz); if (L > 170) continue;
        const cand = new Set(); for (let u = 0; u <= L; u += 6) for (const e of C.near(ex + dx * u / L, ez + dz * u / L, 7)) cand.add(e); cand.add(null);
        let clear = true; for (const e of cand) { if (!e || e.low || e.y1 - e.y0 < 0.5) continue;                      // an exact test of the sight line against each box that stands near it (a thin door cannot slip between samples)
          let t0 = 0, t1 = 1, hit = true; for (const [o0, d0, lo, hi] of [[ex, dx, e.x0, e.x1], [ey, dy, e.y0, e.y1], [ez, dz, e.z0, e.z1]]) { if (Math.abs(d0) < 1e-6) { if (o0 < lo || o0 > hi) { hit = false; break; } } else { let ta = (lo - o0) / d0, tb = (hi - o0) / d0; if (ta > tb) { const tt = ta; ta = tb; tb = tt; } t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) { hit = false; break; } } }
          if (hit && t1 > 0.001 && t0 < 0.999) { clear = false; break; } }
        if (clear) return true; }
      return false; };
    async function gWalk(tx, tz, sp) {                                                                     // true if she arrives; false if she sees him on the way
      const dx = tx - gst.x, dz = tz - gst.z, d = Math.hypot(dx, dz), n = Math.max(2, Math.ceil(d / (sp * 0.04))), h1 = Math.atan2(dx, dz);
      for (let i = 1; i <= n; i++) { gst.h += angDiff(h1, gst.h) * 0.35; gst.x += dx / n; gst.z += dz / n; gst.ph += 0.42; gst.walk = 1; placeGerda(); if (seen()) { gst.walk = 0; return false; } await G.wait(0.04); }
      gst.walk = 0; return true; }
    async function gLook(secs, bend) { const n = Math.round(secs / 0.04); for (let i = 1; i <= n; i++) { const k = Math.sin(Math.PI * i / n); gst.bend = bend * Math.min(1, k * 2.2); gst.look = 0.25 * Math.sin(i * 0.2); placeGerda(); if (seen()) { gst.bend = bend; return false; } await G.wait(0.04); } gst.bend = 0; gst.look = 0; return true; }
    const quick = d => new Promise(r => setTimeout(r, d));
    if (story) { makeG(); gst.x = 268; gst.z = -75; gst.h = -Math.PI / 2; placeGerda(); }                   // she is in the parlour from the start, behind its shut doors
    const swing = d => { const a = d.openAng || 1.75; d.lg.rotation.y = a; d.og.updateMatrixWorld(true); const p = d.lg.localToWorld(new V3(10, 0, 0)); d.lg.rotation.y = 0; return p.x < d.fixed ? a : -a; };   // which way the leaf swings to open into the kitchen
    async function gerdaScene() {
      if (st.scene || st.caught) return; const doors = M.doors.filter(d => d.axis === 'x' && Math.abs(d.fixed - 250) < 3 && Math.abs(d.c + 75) < 6);
      for (const d of doors) d.ang = swing(d);
      A && A.thud && A.thud(0.5); for (let i = 1; i <= 25; i++) { for (const d of doors) d.lg.rotation.y = d.ang * i / 25; await G.wait(0.04); }
      gsay('I can tell somebody’s here. I can feel it.');
      const route = [[238, -75], [214, -66], { say: 'Don’t think I won’t find you. Small things leave small marks.' }, [214, -8], { look: 1.6, bend: 0.8 }, [226, 22], [222, 38], { say: 'Come out, now. I’m not cross... yet.' }, [170, 38], [122, 24], { look: 1.4, bend: 0.7 }, [126, -6], [126, -66], { say: 'Only one place left.' }, [126, -92]];
      for (const r of route) { let ok = true; if (Array.isArray(r)) ok = await gWalk(r[0], r[1], 30); else if (r.say) gsay(r.say); else ok = await gLook(r.look, r.bend); if (!ok) return caught(); }
      // the cupboard
      gst.h = Math.PI / 2 * -1 + Math.PI; gst.h = -Math.PI / 2; placeGerda(); const cd = pantryG.userData.cupDoors; await G.wait(0.6);
      for (let i = 1; i <= 22; i++) { cd.dl.rotation.y = -1.7 * i / 22; cd.dr.rotation.y = 0.7 + 1.0 * i / 22; gst.bend = 0.5 * i / 22; placeGerda(); await G.wait(0.04); } gst.cupOpen = true;
      if (seen()) return caught();
      gsay('Nothing. Hm.'); await G.wait(1.6); gst.bend = 0; placeGerda(); gsay('I must be going soft.'); await G.wait(1.4);
      if (!(await gWalk(238, -75, 26)) ) return caught(); await gWalk(268, -75, 26); for (let i = 24; i >= 0; i--) { for (const d of doors) d.lg.rotation.y = d.ang * i / 24; await G.wait(0.04); }
      if (gerda) { scene.remove(gerda.root); }
      G.castleResult = 'hidden'; $('cwObjt').style.display = 'none'; $('cwObjt').textContent = 'She has gone.'; $('cwObjt').style.display = 'block'; await G.wait(2.5); await finish('hidden');
    }
    const gbody = (x, z) => !hitBody(x, z, 7, 4, 44), hitBody = (x, z, r, y0, y1) => { for (const e of C.near(x, z, r + 1)) { if (e.low || e.y1 <= y0 || e.y0 >= y1) continue; const cx = clamp(x, e.x0, e.x1), cz = clamp(z, e.z0, e.z1); if ((x - cx) * (x - cx) + (z - cz) * (z - cz) < r * r) return true; } return false; };
    const gseg = (a1, b1) => { const n = Math.ceil(Math.hypot(b1[0] - a1[0], b1[1] - a1[1]) / 3); for (let i = 1; i <= n; i++) if (!gbody(a1[0] + (b1[0] - a1[0]) * i / n, a1[1] + (b1[1] - a1[1]) * i / n)) return false; return true; };
    function gnav(sx, sz, tx, tz) {                                                                          // her way across the kitchen without going through anything: a short search over a grid of floor she can stand on
      const S = [sx, sz], T = [tx, tz]; if (gseg(S, T)) return [T]; const nodes = [S, T]; for (let x = 100; x <= 238; x += 14) for (let z = -98; z <= 46; z += 14) if (gbody(x, z)) nodes.push([x, z]);
      const dist = new Array(nodes.length).fill(1e9), prev = new Array(nodes.length).fill(-1), done = new Array(nodes.length).fill(false); dist[0] = 0;
      for (let k = 0; k < nodes.length; k++) { let u = -1; for (let i = 0; i < nodes.length; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i; if (u < 0 || dist[u] >= 1e9) break; done[u] = true; if (u === 1) break;
        for (let i = 0; i < nodes.length; i++) if (!done[i]) { const d = Math.hypot(nodes[i][0] - nodes[u][0], nodes[i][1] - nodes[u][1]); if (dist[u] + d < dist[i] && d < 60 && gseg(nodes[u], nodes[i])) { dist[i] = dist[u] + d; prev[i] = u; } } }
      const out = []; let i = 1; while (i > 0) { out.unshift(nodes[i]); i = prev[i]; } return out.length && i === 0 ? out : [T]; }
    const gspeak = async (who, text) => { gst.talk = who === 'gerda' ? 1 : 0; gst.listen = who === 'jack' ? 1 : 0; await G.say(who, text); gst.talk = 0; gst.listen = 0; };
    async function ending(follow, cam) {
      gst.alive = 1;
      const jc = () => jackOut.torso.localToWorld(new V3(0, 6, 0)), hd = () => gerda.neck.localToWorld(new V3(0, 4, 0)), face = e => W.paintJack(jackOut, { expr: e });
      const fwd = () => new V3(Math.sin(gst.h), 0, Math.cos(gst.h)), side = f => new V3(f.z, 0, -f.x);
      const shotFace = () => { const h = hd(), j = jc(), f = fwd(), mid = h.clone().lerp(j, 0.5); G.cut({ pos: mid.clone().add(f.clone().multiplyScalar(44)).add(side(f).multiplyScalar(9)).add(new V3(0, 3, 0)), look: mid, fov: 38 }); };      // (on Gerda, from in front and a little to one side, wide enough to have Jack in her fist in the frame)
      const shotJack = () => { const h = hd(), j = jc(), f = fwd(), s2 = side(f), sg = Math.sign(j.clone().sub(h).dot(s2)) || 1; G.cut({ pos: h.clone().sub(f.clone().multiplyScalar(18)).add(s2.multiplyScalar(-sg * 9)).add(new V3(0, 4, 0)), look: j.clone().add(new V3(0, 0.6, 0)), fov: 30 }); };      // (on Jack, from over her shoulder, on the side away from the hand that holds him)
      const shotBoxJack = () => { const f = fwd(), h = hd(), s2 = side(f); G.cut({ pos: h.clone().sub(f.clone().multiplyScalar(10)).add(s2.multiplyScalar(8)).add(new V3(0, 2, 0)), look: bx.localToWorld(new V3(0, 2.4, 0.6)), fov: 26 }); };          // (and on him in the box, from over her shoulder)
      face(1);                                                                                              // wincing, whenever he is not speaking
      shotFace(); await gspeak('gerda', 'Well. Not so badly put together. A little wild at the edges. A little soft in the jaw.');
      await G.wait(0.4);
      for (let i = 1; i <= 16; i++) { gst.sniff = 0.35 * Math.sin(Math.PI * i / 16); placeGerda(); await G.wait(0.04); } gst.sniff = 0;
      await gspeak('gerda', 'Sweat, and sap. And underneath it, something like home.');
      shotJack(); await G.wait(0.7);
      shotFace(); await gspeak('gerda', 'Now then. What small creature walks into my kitchen and helps himself?');
      shotJack(); face(3); await gspeak('jack', 'I didn’t take a thing! I was only looking!'); face(1);
      shotFace(); await gspeak('gerda', 'Only looking. Of course you were. A curious little mouse.');
      shotJack(); face(3); await gspeak('jack', 'I’m no mouse! Put me down!'); face(1);
      shotFace(); await gspeak('gerda', 'No? Then a boy, perhaps.');
      shotJack(); face(2); await G.wait(0.5); await gspeak('jack', 'I’m a man.'); face(1); await G.wait(0.6);
      shotFace(); await gspeak('gerda', 'Are you. We’ll see.');
      // to the cupboard, with him in her hand
      const bx = M.items.keepsakeBox.g, box = bx.userData.box, tgt = new V3(119, 0, -92); const route = gnav(gst.x, gst.z, tgt.x, tgt.z);
      { const mx = (gst.x + tgt.x) / 2, mz = (gst.z + tgt.z) / 2, sp = Math.hypot(gst.x - tgt.x, gst.z - tgt.z); G.cut({ pos: v(mx + 10, 62 + sp * 0.2, mz + 70 + sp * 0.3), look: v(mx, 22, mz), fov: 56 }); }                    // (the walk across the kitchen, from above and to the side)
      for (const [wx, wz] of route) { const x0 = gst.x, z0 = gst.z, d = Math.hypot(wx - x0, wz - z0), n = Math.max(2, Math.ceil(d / 1.2)), h1 = Math.atan2(wx - x0, wz - z0); for (let i = 1; i <= n; i++) { const k = i / n; gst.x = x0 + (wx - x0) * k; gst.z = z0 + (wz - z0) * k; gst.h += angDiff(h1, gst.h) * 0.3; gst.ph += 0.4; gst.walk = 1; placeGerda(); follow(); cam(); await G.wait(0.04); } }
      gst.walk = 0; for (let i = 0; i < 14; i++) { gst.h += angDiff(-Math.PI / 2, gst.h) * 0.3; placeGerda(); follow(); cam(); await G.wait(0.04); }
      // the least she need lean, and how high she need raise her arm, for her hand to be over the open box
      { const T = bx.localToWorld(new V3(0, 11, 0)); let bestG = null; gst.give = 1;
        for (let tq = 0; tq <= 0.6; tq += 0.05) for (let ar = -2.4; ar <= -0.7; ar += 0.1) { gst.gTorso = tq; gst.gArm = ar; placeGerda(); root.Blocky.step(gerda, 0); gerda.root.updateMatrixWorld(true); const hp = gerda.wrist.localToWorld(new V3(0, -6, 0)), e = hp.distanceTo(T), hd2 = gerda.neck.localToWorld(new V3(0, 4, 0)); if (Math.hypot(hd2.x - T.x, hd2.z - T.z) < 15) continue; if (e < 4 && (!bestG || tq < bestG.tq - 1e-6 || (tq === bestG.tq && e < bestG.e))) bestG = { tq, ar, e }; }
        if (!bestG) { let m = 1e9; for (let tq = 0; tq <= 0.9; tq += 0.05) for (let ar = -2.6; ar <= -0.5; ar += 0.1) { gst.gTorso = tq; gst.gArm = ar; placeGerda(); root.Blocky.step(gerda, 0); gerda.root.updateMatrixWorld(true); const e = gerda.wrist.localToWorld(new V3(0, -6, 0)).distanceTo(T), hd2 = gerda.neck.localToWorld(new V3(0, 4, 0)); if (Math.hypot(hd2.x - T.x, hd2.z - T.z) < 15) continue; if (e < m) { m = e; bestG = { tq, ar, e }; } } }
        if (!bestG) bestG = { tq: 0.3, ar: -1.5, e: 99 };
        gst.give = 0; gst.gTorso = bestG.tq; gst.gArm = bestG.ar; G.castleWalk.giveSolve = bestG; G.castleWalk.giveHead = (() => { const q = gerda.neck.localToWorld(new V3(0, 4, 0)); return [q.x, q.y, q.z, T.x, T.y, T.z]; })(); placeGerda(); }
      // she opens the box with her free hand
      G.cut({ pos: bx.localToWorld(new V3(-26, 28, 24)), look: bx.localToWorld(new V3(10, 8, 0)), fov: 50 });
      for (let i = 1; i <= 20; i++) { const k = i / 20; gst.lreach = 1.3 * k; box.lid.rotation.x = -1.95 * k; placeGerda(); follow(); cam(); await G.wait(0.04); }
      // and gives him up to it: he is eased down and laid on the velvet
      for (let i = 1; i <= 18; i++) { gst.give = i / 18; placeGerda(); follow(); cam(); await G.wait(0.04); }
      st.wriggle = 0; bx.attach(jackOut.root); st.inHand = true; const p0 = jackOut.root.position.clone(), q0 = jackOut.root.quaternion.clone(), qL = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), pIn = new V3(0, 1.45, 1.4), pAbove = new V3(0, 4.2, 0.4);
      G.cut({ pos: bx.localToWorld(new V3(-13, 15, 10)), look: bx.localToWorld(new V3(0, 3, 0)), fov: 42 });
      face(3); G.caption('jack', 'AAAAAAH—!'); if (A && A.voice) { A.voice(1.4, 5, 0, 1.4); setTimeout(() => A.voice(1.5, 5, 0, 1.4), 520); }                         // (he screams as she lowers him)
      const bs = jackOut.root.scale.x; for (let i = 1; i <= 26; i++) { const k = i / 26, e = k * k * (3 - 2 * k), up = Math.sin(Math.PI * k) * 0.0; const tgtP = k < 0.5 ? p0.clone().lerp(pAbove, k / 0.5) : pAbove.clone().lerp(pIn, (k - 0.5) / 0.5); jackOut.root.position.copy(tgtP); jackOut.root.quaternion.copy(q0).slerp(qL, e); gst.give = 1 - 0.35 * k; placeGerda(); follow(); await G.wait(0.04); }
      face(3); let strug = true; const qS = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0, 0));
      const struggle = (async () => { while (strug) { for (let i = 1; i <= 40 && strug; i++) { const k = Math.sin(Math.PI * i / 40); jackOut.root.quaternion.copy(qL).slerp(qS, k * 0.55); jackOut.root.position.set(0, 1.45 + 0.5 * k, 1.4 - 0.5 * k); await G.wait(0.04); } await G.wait(0.25); } })();      // (he struggles to sit up while she speaks)
      G.cut({ pos: bx.localToWorld(new V3(0, 3.6, -3.9)), look: hd().clone().add(new V3(0, 2, 0)), fov: 62 });                                          // (from behind him, in the box: her face looking down through the top)
      await gspeak('gerda', 'A magic stalk, a stranger’s house, a plate that was never yours. And you thought no one would notice.');
      await gspeak('gerda', 'That isn’t a man’s doing, little one. That’s mischief. And mischief gets put somewhere safe.');
      strug = false; await struggle; face(1); jackOut.root.quaternion.copy(qL); jackOut.root.position.copy(pIn);
      shotBoxJack(); face(3); await gspeak('jack', 'I’m not—');
      for (let i = 1; i <= 14; i++) { box.lid.rotation.x = -1.95 * (1 - i / 14); gst.lreach = 1.3 * (1 - i / 14); placeGerda(); await G.wait(0.04); } A && A.thud && A.thud(0.4); await G.wait(1.2);
    }
    async function caught() {
      if (st.caught) return; st.caught = true; st.scene = true; G.mode = 'cutscene'; document.body.classList.add('cutscene'); $('cwPrompt').style.display = 'none'; $('cwObjt').style.display = 'none'; st.walkN = 0; st.cl = null; st.mant = null; st.vy = 0;
      const wasSkip = G.skipping; if (opts.capture) G.skipping = true;                                      // (in the capture, finding him and picking him up belong to the level: they are run through unseen, and the cutscene proper begins with her holding him)
      const wide = () => { if (opts.capture) return; const mx = (gst.x + st.pos.x) / 2, mz = (gst.z + st.pos.z) / 2, px = -(gst.z - st.pos.z), pz = gst.x - st.pos.x, pl = Math.hypot(px, pz) || 1, dd = Math.max(52, pl * 0.9); G.cut({ pos: v(mx + px / pl * dd, 58 + Math.max(0, dd - 52) * 0.4, mz + pz / pl * dd), look: v(mx, 26, mz), fov: 54 }); };      // (one angle per beat, from above the height of the table so nothing stands between; the scene-notes tool can then move it)
      const cam = () => {};
      const jx = st.pos.x, jz = st.pos.z, jy = st.y;
      st.heading = Math.atan2(gst.x - jx, gst.z - jz);                                                   // he freezes, and turns his face to her
      // Where she can stand and lean without any of her going into anything: her body on the floor, her torso over what is between, her arm down to him.
      const hit = (x, z, r, y0, y1, top) => { for (const e of C.near(x, z, r + 1)) { if (e.low || e.y1 <= y0 || e.y0 >= y1 || (top !== undefined && e.y1 <= top + 0.6)) continue; const cx = clamp(x, e.x0, e.x1), cz = clamp(z, e.z0, e.z1); if ((x - cx) * (x - cx) + (z - cz) * (z - cz) < r * r) return true; } return false; };
      let stance = null;
      for (const D of [14, 20, 27]) { const cands = []; for (let k = 0; k < 24; k++) { const a = k * Math.PI / 12, sx = jx + Math.cos(a) * D, sz = jz + Math.sin(a) * D; let ok = !hit(sx, sz, 7, 4, 44) && !hit(sx, sz, 7, 4, 44, jy);
          for (const t of [0.3, 0.6, 0.85]) { const lx = sx + (jx - sx) * t, lz = sz + (jz - sz) * t; if (hit(lx, lz, 3.6, jy + 12, jy + 36, jy)) ok = false; }
          if (hit(jx, jz, 2.6, jy + 0.9, jy + 12, jy)) ok = false;
          const n = Math.ceil(Math.hypot(sx - gst.x, sz - gst.z) / 3); for (let i = 1; i <= n && ok; i++) if (hit(gst.x + (sx - gst.x) * i / n, gst.z + (sz - gst.z) * i / n, 7, 4, 44, 0)) ok = false;
          if (ok) cands.push({ sx, sz, D, d: Math.hypot(sx - gst.x, sz - gst.z) }); }
        if (cands.length) { cands.sort((p1, p2) => p1.d - p2.d); stance = cands[0]; break; } }
      if (!stance) { const a = Math.atan2(gst.z - jz, gst.x - jx); stance = { sx: jx + Math.cos(a) * 27, sz: jz + Math.sin(a) * 27, D: 27 }; }
      const faceJ = Math.atan2(jx - stance.sx, jz - stance.sz);
      for (let i = 0; i < 14; i++) { gst.h += angDiff(Math.atan2(jx - gst.x, jz - gst.z), gst.h) * 0.3; placeGerda(); cam(); await G.wait(0.04); }
      wide(); gsay('There you are.'); await G.wait(0.6);
      { const x0 = gst.x, z0 = gst.z, n = Math.max(2, Math.ceil(Math.hypot(stance.sx - x0, stance.sz - z0) / 1.2)); for (let i = 1; i <= n; i++) { const k = i / n; gst.x = x0 + (stance.sx - x0) * k; gst.z = z0 + (stance.sz - z0) * k; gst.h += angDiff(i < n * 0.7 ? Math.atan2(stance.sx - x0, stance.sz - z0) : faceJ, gst.h) * 0.35; gst.ph += 0.42; gst.walk = 1; placeGerda(); cam(); await G.wait(0.04); } gst.walk = 0; gst.h = faceJ; }
      wide();
      // she leans only as far as her hand needs to meet him: the least bend (then reach) that puts her palm at his feet
      const handAt = (bd, rc) => { gst.bend = bd; gst.reach = rc; placeGerda(); root.Blocky.step(gerda, 0); gerda.root.updateMatrixWorld(true); return gerda.wrist.localToWorld(new V3(0, -6, 0)); };
      let best = null; for (let bd = 0; bd <= 1.4; bd += 0.05) for (let rc = 0.5; rc <= 2.0; rc += 0.1) { const hp = handAt(bd, rc), e = Math.hypot(hp.x - jx, hp.z - jz) + Math.abs(hp.y - (jy + 2)) * 0.8; if (e < 3.2 && (!best || bd < best.bd - 1e-6 || (bd === best.bd && e < best.e))) best = { bd, rc, e }; }
      if (!best) { let m = 1e9; for (let bd = 0; bd <= 1.4; bd += 0.05) for (let rc = 0.5; rc <= 2.0; rc += 0.1) { const hp = handAt(bd, rc), e = Math.hypot(hp.x - jx, hp.z - jz) + Math.abs(hp.y - (jy + 2)) * 0.8; if (e < m) { m = e; best = { bd, rc, e }; } } }
      handAt(0, 0); const bendTo = best.bd, reachTo = best.rc;
      for (let i = 1; i <= 18; i++) { const k = i / 18; gst.bend = bendTo * k; gst.reach = reachTo * k; placeGerda(); cam(); await G.wait(0.04); }
      { const hp = handAt(bendTo, reachTo), x0 = st.pos.x, z0 = st.pos.z; for (let i = 1; i <= 6; i++) { const k = i / 6; st.pos.x = x0 + (hp.x - x0) * k; st.pos.z = z0 + (hp.z - z0) * k; placeGerda(); cam(); await G.wait(0.04); } }
      // the hand has him: he is fixed to her wrist from here, so he goes wherever her arm goes; she rises into the held pose
      gerda.root.updateMatrixWorld(true); { const wq = new THREE.Quaternion(), jq = new THREE.Quaternion(), wp = new V3(); gerda.wrist.getWorldQuaternion(wq); jackOut.root.getWorldQuaternion(jq); jackOut.root.getWorldPosition(wp);
        const lp = gerda.wrist.worldToLocal(wp.clone()), le = new THREE.Euler().setFromQuaternion(wq.clone().invert().multiply(jq), 'XYZ'), PJ = root.GerdaHold.jack, lerp = (a1, b1, k) => a1 + (b1 - a1) * k;
        gerda.wrist.add(jackOut.root); jackOut.root.scale.setScalar(SC * st.s / GS); st.inHand = true;
        const follow = () => { gerda.root.updateMatrixWorld(true); const wp2 = new V3(); jackOut.root.getWorldPosition(wp2); st.pos.set(wp2.x, 0, wp2.z); st.y = wp2.y; };
        for (let i = 1; i <= 30; i++) { const k = i / 30; gst.hold = k; gst.bend *= 0.96; gst.reach *= 0.96; jackOut.root.position.set(lerp(lp.x, PJ.px, k), lerp(lp.y, PJ.py, k), lerp(lp.z, PJ.pz, k)); jackOut.root.rotation.set(lerp(le.x, PJ.rx, k), lerp(le.y, PJ.ry, k), lerp(le.z, PJ.rz, k)); placeGerda(); follow(); cam(); await G.wait(0.04); }
        for (let i = 0; i < 6; i++) { jackOut.root.position.set(PJ.px, PJ.py, PJ.pz); jackOut.root.rotation.set(PJ.rx, PJ.ry, PJ.rz); placeGerda(); follow(); cam(); await G.wait(0.04); }
        st.wriggle = 1;                                                                                    // (he wriggles in her fist for as long as he is held)
        // before the scene proper, she steps back into the nearest open space, so that the cameras have room and nothing of hers goes into anything
        { const clear = (x, z) => !hit(x, z, 15, 4, 50, 0), pathOk = (x, z) => !hit(x, z, 8, 4, 50, 0); let sp = null, bd = 1e9;
          const fx = Math.sin(gst.h), fz = Math.cos(gst.h), front = (x, z) => { for (const d of [12, 22, 32, 42, 52]) for (const l of [-16, 0, 16]) if (hit(x + fx * d + fz * l, z + fz * d - fx * l, 6, 4, 60, 0)) return false; return true; };      // (clear ground in front of her, where the cameras will be, as well as around her)
          for (const needFront of [true, false]) { for (let r = 0; r <= 110; r += 5) for (let k = 0; k < 36; k++) { const a2 = k * Math.PI / 18, x = gst.x + Math.cos(a2) * r, z = gst.z + Math.sin(a2) * r; if (!clear(x, z) || x < 100 || x > 236 || z < -100 || z > 44 || (needFront && !front(x, z))) continue;
              const n = Math.ceil(r / 3); let ok = true; for (let i = 1; i <= n && ok; i++) if (!pathOk(gst.x + (x - gst.x) * i / n, gst.z + (z - gst.z) * i / n)) ok = false; if (!ok) continue;
              const back = Math.cos(a2 - (gst.h + Math.PI)), cost = r + (1 - back) * 25; if (cost < bd) { bd = cost; sp = [x, z]; } }
            if (sp) break; }
          G.castleWalk.back = { from: [gst.x, gst.z], sp, clearHere: clear(gst.x, gst.z) };
          if (sp && Math.hypot(sp[0] - gst.x, sp[1] - gst.z) > 1) { const x0 = gst.x, z0 = gst.z, n = Math.max(2, Math.ceil(Math.hypot(sp[0] - x0, sp[1] - z0) / 0.9)); for (let i = 1; i <= n; i++) { const k = i / n; gst.x = x0 + (sp[0] - x0) * k; gst.z = z0 + (sp[1] - z0) * k; gst.ph -= 0.4; gst.walk = 0.7; placeGerda(); follow(); cam(); await G.wait(0.04); } gst.walk = 0; placeGerda(); follow(); } }
        if (opts.capture) { root.Blocky.step(gerda, 0); root.Blocky.step(jackOut, 0); gerda.root.updateMatrixWorld(true); G.skipping = wasSkip; }
        await ending(follow, cam); }
      await finish('caught');
    }
    async function finish(res) { G.castleResult = res; await G.fade(true, 2.2); await G.wait(0.3); cleanup(); G.mode = 'end'; document.body.classList.remove('cutscene'); resolve({ result: res }); }
    const tick = dt => {
      if (st.scene) { st.jumpReq = st.actReq = st.putReq = false; if (!st.inHand) { jackOut.root.scale.setScalar(SC * st.s); jackOut.root.position.set(st.pos.x, st.y, st.pos.z); jackOut.root.rotation.y = st.heading; } return; }
      const s = st.s; if (Math.abs(s - nearS) > 0.02) { nearS = s; camera.near = Math.max(0.1, 0.3 * s); camera.updateProjectionMatrix(); }       // (a nearer near plane only as he is small: the depth buffer keeps its precision, so flat surfaces do not shimmer)
      const f = v(-Math.cos(st.camA), 0, -Math.sin(st.camA)), r = v(Math.sin(st.camA), 0, -Math.cos(st.camA));
      if (st.lockT > 0) { st.lockT -= dt; keys.up = keys.down = keys.left = keys.right = false; stick.x = stick.y = 0; st.heading += angDiff(st.lockH, st.heading) * Math.min(1, dt * 5); st.camA += angDiff(Math.atan2(-Math.cos(st.lockH), -Math.sin(st.lockH)), st.camA) * Math.min(1, dt * 3); st.pitch += (0.1 - st.pitch) * Math.min(1, dt * 3); }       // (the camera settles low behind him, so that what he has noticed is in view)
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
          if (!st.bread) { st.bread = true; st.lockT = 3.0; st.lockH = Math.atan2(90 - st.pos.x, -25 - st.pos.z); G.caption('jack', 'Is that... warm bread?'); setTimeout(() => G.caption('jack', 'I can smell it from here. I haven\u2019t eaten since... I\u2019m starving.'), 3200); }
          else { if (performance.now() - (st.remindAt || 0) > 6000) { st.remindAt = performance.now(); G.caption('jack', 'Not that way. I’m starving, and that bread has to be somewhere close.'); } } }
        else if (!near) st.inZone = false; }
      if (story) storyTick(dt);
      const gy = floorAt(st.pos.x, st.pos.z, st.y), rj = 4 * s;
      // Wood he can get his hands to: a short step up (to three quarters of his height) is a mantle; anything taller, a climb, which tires him fast (about a height and a half) unless there is a rung to rest on, and a rung or a top he can pull onto within one more height.
      const pointOn = (e, x, z) => [clamp(x, e.x0, e.x1), clamp(z, e.z0, e.z1)];
      const landingFor = e => { const mx = Math.min(rj * 0.8, (e.x1 - e.x0) / 2), mz = Math.min(rj * 0.8, (e.z1 - e.z0) / 2), x0 = e.x0 + mx, x1 = e.x1 - mx, z0 = e.z0 + mz, z1 = e.z1 - mz;
        let to = null, bd = 1e9; for (let i = 0; i <= 16; i++) for (let j = 0; j <= 16; j++) { const x = x0 + (x1 - x0) * i / 16, z = z0 + (z1 - z0) * j / 16; if (blockedAt(x, z, e.y1)) continue; const d = Math.hypot(x - st.pos.x, z - st.pos.z); if (d < bd) { bd = d; to = [x, z]; } }
        return to; };                                   // (the nearest spot of it that is clear of the wood above: the top of a leg that runs into the seat is no place to stand)
      const startMantle = (e, to) => { st.mant = { e, t: 0, dur: 0.85, from: { x: st.pos.x, y: st.y, z: st.pos.z }, to: { x: to[0], y: e.y1, z: to[1] } }; st.cl = null; st.vy = 0; };
      const tryClimb = () => { const R = rj + 1.2 * s, fx = Math.sin(st.heading), fz = Math.cos(st.heading); let best = null;
        for (const e of C.near(st.pos.x, st.pos.z, R + 2)) { if (!e.wood || e.low || e.y1 <= st.y + 0.45 * Hj || e.y0 > st.y + 0.5 * Hj) continue; const [qx, qz] = pointOn(e, st.pos.x, st.pos.z), dx = qx - st.pos.x, dz = qz - st.pos.z, d = Math.hypot(dx, dz);
          if (d > R || (d > 0.01 && (dx * fx + dz * fz) / d < 0.2)) continue; if (!best || e.y1 > best.e.y1) best = { e, qx, qz, d }; }
        if (!best) return false; const gap = best.e.y1 - st.y; if (gap <= 0.5 * Hj) return false; if (gap <= 0.75 * Hj) { const to = landingFor(best.e); if (to) { startMantle(best.e, to); return true; } }
        let nx = st.pos.x - best.qx, nz = st.pos.z - best.qz; const nl = Math.hypot(nx, nz); if (nl < 0.01) { nx = -fx; nz = -fz; } else { nx /= nl; nz /= nl; }
        st.pos.x = best.qx + nx * 6.5 * s; st.pos.z = best.qz + nz * 6.5 * s; st.heading = Math.atan2(-nx, -nz); st.cl = { e: best.e }; st.stam = 1; st.vy = 0; st.perch = null; return true; };
      if (st.jumpReq) { st.jumpReq = false; if (!busy && st.y <= gy + 0.01 && !tryClimb()) { st.vy = 112 * s; st.perch = null; } }
      if (st.mant) { const m = st.mant; m.t += dt; const k = clamp(m.t / m.dur, 0, 1), rise = Math.max(m.from.y, m.to.y + 0.22 * Hj);                // (up the face to above the lip, then over the edge and down onto the top: the edge climbs as the leg did)
        if (k < 0.5) { const q = k / 0.5, e2 = q * q * (3 - 2 * q); st.pos.x = m.from.x; st.pos.z = m.from.z; st.y = m.from.y + (rise - m.from.y) * e2; }
        else { const q = (k - 0.5) / 0.5, e2 = q * q * (3 - 2 * q); st.pos.x = m.from.x + (m.to.x - m.from.x) * e2; st.pos.z = m.from.z + (m.to.z - m.from.z) * e2; st.y = rise + (m.to.y - rise) * e2; }
        if (k >= 1) { st.y = m.to.y; st.mant = null; st.vy = 0; st.stam = 1; st.perch = m.e && Math.min(m.e.x1 - m.e.x0, m.e.z1 - m.e.z0) < 20 * s ? m.e : null; } }
      else if (st.cl) {
        st.climbPh += dt * 9; if (!keys.space || st.stam <= 0) { st.cl = null; }
        else { const sp = 0.8 * Hj; st.y += sp * dt; st.stam -= sp * dt / (1.6 * Hj); let plat = null;
          for (const e of C.near(st.pos.x, st.pos.z, 1.2 * Hj + 3)) { if (!e.wood || e.low || e.y1 <= st.y + 0.3 * Hj || e.y1 > st.y + 1.3 * Hj) continue; const [qx, qz] = pointOn(e, st.pos.x, st.pos.z); if (Math.hypot(qx - st.pos.x, qz - st.pos.z) > 0.8 * Hj) continue; if (!landingFor(e)) continue; if (!plat || e.y1 > plat.y1) plat = e; }
          if (plat) startMantle(plat, landingFor(plat)); }
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
        if (camPos.lengthSq() === 0) camPos.copy(want); else camPos.lerp(want, Math.min(1, dt * 10)); camLook.copy(at); camLook.y += Math.max(0, -st.pitch) * d * 0.9; let cp = camPos; if (st.shakeT > 0) { st.shakeT -= dt; cp = camPos.clone(); cp.x += (Math.random() - 0.5) * 0.6 * s; cp.y += (Math.random() - 0.5) * 0.6 * s; } G.cut({ pos: cp, look: camLook, fov: 48 });
      }
    };
    const cleanup = () => { if (jackOut.root.parent !== scene) { scene.add(jackOut.root); st.inHand = false; } root.removeEventListener('keydown', kd); root.removeEventListener('keyup', ku); el.removeEventListener('wheel', wheel); el.removeEventListener('pointerdown', pd); el.removeEventListener('pointermove', pm); el.removeEventListener('pointerup', pu); el.removeEventListener('pointercancel', pu); G.updaters = G.updaters.filter(u => u !== tick); hud.remove(); css.remove(); jackOut.after = null; jackOut.root.scale.setScalar(SC); jackOut.root.visible = true; camera.near = nearOld; camera.updateProjectionMatrix(); };
    G.updaters.push(tick); G.castleWalk = { st, cleanup, resolve, C, M, gst };
    if (opts.capture) {                                                                                      // the capture, on its own (for scene-notes.html): Jack is hiding in the cupboard, and Gerda has just opened its doors
      const cd = pantryG.userData.cupDoors; cd.dl.rotation.y = -1.7; cd.dr.rotation.y = 1.7; st.inCup = true;
      st.pos.set(98, 0, -84); st.y = 0; st.scene = true; G.mode = 'cutscene'; $('cwPanel').style.display = 'none'; st.alarm = true; st.heading = Math.PI / 2;
      gst.x = 126; gst.z = -92; gst.h = -Math.PI / 2; gst.bend = 0.5; gst.cupOpen = true; placeGerda(); jackOut.root.scale.setScalar(SC * st.s); jackOut.root.position.set(st.pos.x, 0, st.pos.z); jackOut.root.rotation.y = st.heading; $('fade').style.transition = ''; G.fade(false, 0.8); await caught(); return; }
    const toastTxt = story ? 'WASD or the stick to walk \u00b7 Shift runs \u00b7 Space jumps \u00b7 drag to look \u00b7 V or the wheel zooms \u00b7 C for first person' : 'WASD or the stick to walk \u00b7 Shift runs \u00b7 Space jumps \u00b7 drag to look \u00b7 V or the wheel zooms \u00b7 C for first person';
    const f = $('fade');
    if (!story) { G.mode = 'play'; document.body.classList.remove('cutscene'); G.hideLine && G.hideLine(); toast(toastTxt); f.style.transition = ''; await G.fade(false, 1.2); return; }
    // ── The story: the hall, from a few angles, and what it says to him; then it is his. ──
    st.scene = true; G.mode = 'cutscene'; document.body.classList.add('cutscene'); $('cwPanel').style.display = 'none'; G.save({ step: 'castle' });
    const wait = G.wait, walkTo = async (tx, tz, secs) => { const x0 = st.pos.x, z0 = st.pos.z, n = Math.max(2, Math.round(secs / 0.04)); st.heading = Math.atan2(tx - x0, tz - z0); for (let i = 1; i <= n; i++) { const k = i / n; st.pos.x = x0 + (tx - x0) * k; st.pos.z = z0 + (tz - z0) * k; st.walkN = 1; st.walkPh += 10.9 * Math.pow(st.s, -0.35) * 0.55 * 0.04 * 1.4; await wait(0.04); } st.walkN = 0; };
    st.pos.set(0, 0, 94); st.heading = Math.PI; G.cut({ pos: v(4, 2.4, 60), look: v(0, 2.4, 86), fov: 34 });                 // (it opens on Jack, coming in; the hall is shown once, when he looks up at it)
    f.style.transition = ''; G.fade(false, 1.6); W.paintJack(jackOut, { expr: 1 }); const wk = walkTo(0, 76, 4.2); await wait(1.4);
    await G.say('jack', 'Who lives in a place like this?');
    G.cut({ pos: v(-3, 1.6, 101), look: v(0, 24, 62), fov: 58 }); const rv = G.shot({ pos: v(-3, 1.6, 101), look: v(0, 118, 12), fov: 58 }, 6, 'inOut');
    await G.say('jack', 'A table set for one, and a hall you could lose a village in.'); await rv;
    G.cut({ pos: v(3, 2.7, 64), look: v(0, 2.7, 76), fov: 32 }); await wait(0.8);
    await G.say('jack', 'There has to be something here I can carry home. Something Mother can’t argue with.');
    await wait(0.4); const kk = st.s, d0 = 92 * kk; await G.shot({ pos: v(0, 15 * SC * kk + Math.sin(0.5) * d0, st.pos.z + d0 * Math.cos(0.5)), look: v(0, 15 * SC * kk, st.pos.z), fov: 48 }, 1.6, 'inOut');
    await wk; G.skipping = false; st.scene = false; st.jumpReq = st.actReq = st.putReq = false; for (const k in keys) keys[k] = false; stick.x = stick.y = 0; st.walkN = 0; st.vy = 0; st.lockT = 0; G.mode = 'play'; document.body.classList.remove('cutscene'); G.hideLine && G.hideLine(); st.heading = Math.PI; st.camA = Math.PI / 2; camPos.set(0, 0, 0); toast(toastTxt, 6500);
  });
}

root.CastleWalk = { run };
})(typeof window !== 'undefined' ? window : globalThis);

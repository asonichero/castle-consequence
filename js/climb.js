// Climbing Toward Consequence — the climb, Chapter Three: Jack goes up the beanstalk.
//   He hangs from handholds (knots of bark) and moves hand over hand to the next, reading the stalk as he goes; his grip is limited by stamina, and rests are on the broad leaves.
//   Lower stalk: every hold is sound, the reachable ones glow, and the way teaches grip, stamina and rest.
//   Middle stalk: it resists: holds slide about, some are slick with sap (reach through them quickly), leaves curl away when he lingers, and gusts come (shown first by the leaves and a rush at the screen's edge).
//   Upper stalk: the thin air narrows his sight and drains his strength faster; a vast shadow slides through the clouds overhead from time to time.
//   The top: a blanket of cloud, a ceiling the camera cannot pass; he goes up through it. As he climbs he is scaled down to a quarter, with the camera kept to him, so the stalk seems to grow.
// Controls: WASD / arrows (or the stick) to reach for a hold; hold Space (or the Grip button) to brace; drag to turn the view.
// Exposes Climb.run(G, W): W is Night.build's world (its exterior, and Jack out of doors).
(function (root) {
'use strict';
const THREE = root.THREE, F = root.Farm, A = root.GameAudio, V3 = THREE.Vector3;
const v = (x, y, z) => new V3(x, y, z), clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const SC = 0.95, TOP = 790, CLOUD_Y = 800, MIN_S = 0.25;
const PLOT = F.PLOT, CX = PLOT.cx, CZ = PLOT.cz;
const sOf = y => lerp(1, MIN_S, clamp(y / TOP, 0, 1));                       // how big Jack is at a height
const zoneOf = y => (y < 240 ? 'lower' : y < 540 ? 'middle' : 'upper');
// The stalk's centre and radius at a height (as Chapter3.buildStalk makes it: five vines to about 70 up, then the twisting trunk).
const centre = y => {
  if (y < 70) return v(CX, y, lerp(CZ, CZ + 6, y / 70));
  const s = (y - 70) / 10, t = s / 74; return v(CX + Math.sin(s * 0.19) * (8 + t * 40), y, CZ + Math.cos(s * 0.15) * (6 + t * 36));
};
const trunkR = y => (y < 70 ? 4 : lerp(15, 7, ((y - 70) / 10) / 74) / 2 + 0.6);
const angDiff = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

function run(G, W) {
  return new Promise(resolve => {
    const { ext, jackOut, world } = W, E = ext.scene, el = G.renderer.domElement, box = F.box, plain = F.plain;
    const C3 = root.Chapter3; C3 && C3.ensureDawn && C3.ensureDawn(E);
    G.setScene(world); G.drone = null; G.mode = 'play'; document.body.classList.remove('cutscene'); G.hideLine && G.hideLine();
    A && A.ambience({ wind: 0.35, birds: 0.5, fire: 0 });
    G.save({ step: 'climb' });
    const rnd = (() => { let s = 90210; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
    const stage = new THREE.Group(); E.add(stage);

    // ── The holds: a ring of three to a rung, the rungs closer as he shrinks; a broad leaf now and again to rest on. ──
    const holds = [], mats = {
      good: new THREE.MeshLambertMaterial({ color: 0xc9a862 }), glow: new THREE.MeshBasicMaterial({ color: 0xffeaa0 }), faint: new THREE.MeshLambertMaterial({ color: 0xe0c47a, emissive: 0x3a2e10 }),
      slick: new THREE.MeshPhongMaterial({ color: 0xa8d890, emissive: 0x2a5a3a, shininess: 120, specular: 0xffffff }), moving: new THREE.MeshLambertMaterial({ color: 0xb48a58 }), leaf: new THREE.MeshLambertMaterial({ color: 0x5aa84c }),
    };
    let y = 5, rung = 0, sinceLedge = 0, a0 = 0;
    const holdPos = h => { const c = centre(h.y); return v(c.x + Math.cos(h.a) * h.r, h.y, c.z + Math.sin(h.a) * h.r); };
    while (y < TOP - 8) {
      const s = sOf(y), z = zoneOf(y), cadence = z === 'lower' ? 12 : z === 'middle' ? 10 : 7, ledgeNow = ++sinceLedge >= cadence;
      for (let j = 0; j < 3; j++) {
        const a = a0 + j * 2.09 + (rnd() - 0.5) * 0.6, hy = y + (rnd() - 0.5) * 2 * s, r = trunkR(hy) + (y < 70 ? 0.4 : 1.2);
        let kind = 'good';
        if (ledgeNow && j === 1) kind = 'ledge';
        else if (z === 'middle' && rnd() < 0.3) kind = rnd() < 0.55 ? 'slick' : 'moving';
        else if (z === 'upper' && rnd() < 0.34) kind = rnd() < 0.5 ? 'slick' : 'moving';
        const h = { y: hy, a, r, kind, s, base: { y: hy, a }, ph: rnd() * 6.28, mesh: null, leaf: null, curl: 0, curlT: 0, gone: 0 };
        if (kind === 'ledge') {
          const L = 28 * s, leaf = new THREE.Group(); leaf.rotation.y = -a; const c = centre(hy);
          leaf.position.set(c.x + Math.cos(a) * (trunkR(hy) - 1), hy - 0.7 * s, c.z + Math.sin(a) * (trunkR(hy) - 1)); stage.add(leaf);
          const pivot = new THREE.Group(); leaf.add(pivot); box(L, 1.4 * s, 15 * s, mats.leaf, L / 2, 0, 0, pivot); box(L * 0.6, 1.4 * s, 9 * s, plain('#7ab85a'), L * 0.85, 0.3 * s, 6 * s, pivot);
          h.leaf = pivot; h.r = trunkR(hy) + L * 0.5; h.L = L; sinceLedge = 0;
        } else {
          const m = new THREE.Mesh(new THREE.BoxGeometry(5 * s, 2.8 * s, 3.4 * s), kind === 'slick' ? mats.slick : kind === 'moving' ? mats.moving : mats.good);
          m.rotation.y = -a; stage.add(m); h.mesh = m;
        }
        holds.push(h);
      }
      y += 8 * s; rung++; a0 += 0.9 + rnd() * 0.5;
    }
    holds.sort((p, q) => p.y - q.y);
    const GROUND = { y: -2, a: Math.PI * 0.5, r: 16, kind: 'ground', s: 1, base: { y: -2, a: Math.PI * 0.5 }, ph: 0, mesh: null };
    const place = h => {            // where a hold is now (some of them move)
      if (h.kind === 'moving') { const t = G.t; h.y = h.base.y + 3.2 * h.s * Math.sin(t * 0.7 + h.ph); h.a = h.base.a + 0.55 * Math.sin(t * 0.45 + h.ph * 1.7); }
      const p = holdPos(h); if (h.mesh) { h.mesh.position.copy(p); h.mesh.rotation.y = -h.a; } return p;
    };
    holds.forEach(place);
    const sap = new THREE.Group(); stage.add(sap);                        // drips under the slick holds, so they can be read
    for (const h of holds) if (h.kind === 'slick') { const p = holdPos(h); box(0.9 * h.s, 4 * h.s, 0.9 * h.s, mats.slick, p.x, p.y - 3 * h.s, p.z, sap); }

    // ── Clouds overhead (the ceiling), and the shadow that slides through them. ──
    const cloudMats = [new THREE.MeshBasicMaterial({ color: 0xfbece0 }), new THREE.MeshBasicMaterial({ color: 0xf2dcd0 }), new THREE.MeshBasicMaterial({ color: 0xffffff })];
    const clouds = new THREE.Group(); stage.add(clouds);
    for (let i = -7; i <= 7; i++) for (let j = -7; j <= 7; j++) { const w = 200 + rnd() * 70, m = box(w, 14 + rnd() * 10, w, cloudMats[(i + j + 14) % 3], CX + i * 190 + (rnd() - 0.5) * 30, CLOUD_Y + rnd() * 8, CZ + j * 190 + (rnd() - 0.5) * 30, clouds); m.rotation.y = rnd(); }
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1500, 560), new THREE.MeshBasicMaterial({ color: 0x1a1a2c, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide }));
    shadow.rotation.x = Math.PI / 2; shadow.position.set(CX, CLOUD_Y - 7, CZ); stage.add(shadow);
    const lights = []; E.traverse(o => { if (o.isHemisphereLight || o.isDirectionalLight) lights.push([o, o.intensity]); });
    const sky0 = new THREE.Color(0xf0b890), sky1 = new THREE.Color(0xd4e4f4), fogOld = E.fog, bgOld = E.background;
    const camera = G.camera, nearOld = camera.near;

    // ── Jack on the stalk. ──
    const st = { cur: GROUND, y: 0, a: GROUND.a, r: GROUND.r, mode: 'idle', mt: 0, from: null, to: null, stamina: 100, grip: false, hold: 0, cool: 0, gust: { t: 14, phase: 'wait' }, slip: 0, toastAt: 0, capAt: 0, yawOff: 0, camA: GROUND.a, shake: 0, ledgeT: 0, zone: 'lower', best: 0, ended: false, tut: 0 };
    jackOut.root.visible = true; jackOut.root.rotation.set(0, 0, 0); W.paintJack(jackOut, { expr: 1 });
    const pose = { up: 0, reach: 0, stand: 1, fall: 0 };
    jackOut.after = r => {
      const t = G.t, tr = 0.04 * Math.sin(t * 22) * Math.max(0, 1 - st.stamina / 30);       // trembling when spent
      const hang = 1 - pose.stand, sw = Math.sin(t * 1.3) * 0.05;
      r.armL.rotation.x = lerp(0.05, -2.95 + (st.mode === 'move' ? 0.5 * Math.sin(st.mt * 6.28) : 0), hang) + tr; r.armR.rotation.x = lerp(0.05, -2.95 - (st.mode === 'move' ? 0.5 * Math.sin(st.mt * 6.28) : 0), hang) + tr;
      r.armL.rotation.z = lerp(0, 0.12, hang); r.armR.rotation.z = lerp(0, -0.12, hang);
      r.legL.thigh.rotation.x = lerp(0, -0.35 + sw + (st.mode === 'move' ? 0.4 * Math.sin(st.mt * 6.28 + 1) : 0), hang); r.legR.thigh.rotation.x = lerp(0, -0.2 - sw + (st.mode === 'move' ? 0.4 * Math.sin(st.mt * 6.28) : 0), hang);
      r.legL.knee.rotation.x = lerp(0, 0.6, hang); r.legR.knee.rotation.x = lerp(0, 0.9, hang);
      if (pose.fall) { r.armL.rotation.x = -2.2 + 0.4 * Math.sin(t * 30); r.armR.rotation.x = -2.2 - 0.4 * Math.sin(t * 30); }
      r.hips.position.y = 12; r.torso.rotation.x = lerp(0.05, 0.12, hang); r.neck.rotation.x = lerp(0.1, -0.25, hang);
    };

    // ── HUD ──
    const css = document.createElement('style');
    css.textContent = `#clHud { position: fixed; inset: 0; pointer-events: none; z-index: 12; font-family: Georgia, serif; color: #ece8df; }
      #clAlt { position: absolute; top: 12px; left: 14px; background: rgba(10,12,16,0.78); border: 1px solid #4a4d58; border-radius: 8px; padding: 6px 12px; font-size: 14px; }
      #clObj { position: absolute; top: 12px; left: 50%; transform: translateX(-50%); background: rgba(10,12,16,0.78); border: 1px solid #4a4d58; border-radius: 8px; padding: 8px 16px; font-size: clamp(13px, 1.9vw, 17px); text-align: center; max-width: 60vw; }
      #clSt { position: absolute; left: 50%; bottom: 3.5vh; transform: translateX(-50%); width: min(340px, 56vw); } #clSt span { font-size: 12px; opacity: .85; letter-spacing: .08em; text-transform: uppercase; }
      #clBar { height: 12px; background: #1c1f27; border: 1px solid #454a58; border-radius: 5px; overflow: hidden; margin-top: 3px; } #clBar i { display: block; height: 100%; width: 100%; background: linear-gradient(90deg, #c9a84c, #7ab85a); transition: background .2s; } #clBar.low i { background: #c0503a; }
      #clToast { position: absolute; left: 50%; bottom: 12vh; transform: translateX(-50%); background: rgba(10,12,16,0.85); border: 1px solid #4a4d58; padding: 8px 16px; border-radius: 8px; font-size: 14px; max-width: 80vw; text-align: center; opacity: 0; transition: opacity .4s; }
      #clBtns { position: absolute; right: 12px; bottom: 12px; display: flex; flex-direction: column; gap: 6px; align-items: flex-end; pointer-events: auto; } #clBtns button { margin: 0; padding: 12px 18px; font-size: 15px; background: rgba(20,22,30,0.85); touch-action: none; } #clBtns button.on { background: #6b5a2a; border-color: #c9a84c; }
      #clStick { position: absolute; left: 22px; bottom: 26px; width: 120px; height: 120px; border-radius: 50%; background: rgba(20,22,28,0.45); border: 2px solid rgba(230,196,106,0.55); touch-action: none; display: none; pointer-events: auto; }
      #clKnob { position: absolute; left: 50%; top: 50%; width: 52px; height: 52px; margin: -26px 0 0 -26px; border-radius: 50%; background: rgba(230,196,106,0.75); pointer-events: none; } @media (pointer: coarse) { #clStick { display: block; } }
      #clVig { position: absolute; inset: 0; opacity: 0; } #clGust { position: absolute; inset: 0; opacity: 0; background: linear-gradient(90deg, rgba(255,255,255,.55), transparent 22%, transparent 78%, rgba(255,255,255,.55)); }
      #clGustTxt { position: absolute; top: 18%; left: 50%; transform: translateX(-50%); font-size: 20px; letter-spacing: .3em; color: #fff; text-shadow: 0 0 10px #000; opacity: 0; }`;
    document.head.appendChild(css);
    const hud = document.createElement('div'); hud.id = 'clHud';
    hud.innerHTML = '<div id="clVig"></div><div id="clGust"></div><div id="clGustTxt">WIND</div><div id="clAlt"></div><div id="clObj">Climb the beanstalk.</div><div id="clSt"><span>Stamina</span><div id="clBar"><i></i></div></div><div id="clToast"></div><div id="clStick"><div id="clKnob"></div></div><div id="clBtns"><button id="clGrip">Grip (Space)</button></div>';
    document.body.appendChild(hud);
    const $ = id => document.getElementById(id);
    const toast = (t, ms = 3600) => { $('clToast').textContent = t; $('clToast').style.opacity = 1; st.toastAt = performance.now() + ms; };
    const mutter = (t, force) => { if (!force && performance.now() < st.capAt) return; st.capAt = performance.now() + 7000; G.caption('jack', t); };
    const keys = {}, stick = { x: 0, y: 0 }, KM = { w: 'up', W: 'up', ArrowUp: 'up', s: 'down', S: 'down', ArrowDown: 'down', a: 'left', A: 'left', ArrowLeft: 'left', d: 'right', D: 'right', ArrowRight: 'right', ' ': 'grip', Shift: 'grip' };
    const typing = e => e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
    const kd = e => { if (typing(e)) return; const k = KM[e.key]; if (k) { keys[k] = true; if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault(); } };
    const ku = e => { const k = KM[e.key]; if (k) keys[k] = false; };
    root.addEventListener('keydown', kd); root.addEventListener('keyup', ku);
    const gb = $('clGrip'); gb.onpointerdown = () => { keys.grip = true; }; gb.onpointerup = gb.onpointerleave = gb.onpointercancel = () => { keys.grip = false; };
    const drags = new Map();
    const pd = e => drags.set(e.pointerId, { x: e.clientX }), pm = e => { const d = drags.get(e.pointerId); if (!d) return; st.yawOff = clamp(st.yawOff - (e.clientX - d.x) * 0.006, -1.3, 1.3); d.x = e.clientX; }, pu = e => drags.delete(e.pointerId);
    el.addEventListener('pointerdown', pd); el.addEventListener('pointermove', pm); el.addEventListener('pointerup', pu); el.addEventListener('pointercancel', pu);
    { const sEl = $('clStick'), k = $('clKnob'); let id = null; const set = e => { const r = sEl.getBoundingClientRect(); let dx = (e.clientX - r.left - r.width / 2) / (r.width / 2), dy = (e.clientY - r.top - r.height / 2) / (r.height / 2); const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; } stick.x = dx; stick.y = dy; k.style.transform = `translate(${dx * 34}px, ${dy * 34}px)`; };
      sEl.addEventListener('pointerdown', e => { id = e.pointerId; sEl.setPointerCapture(id); set(e); }); sEl.addEventListener('pointermove', e => { if (e.pointerId === id) set(e); }); const end = e => { if (e.pointerId === id) { id = null; stick.x = stick.y = 0; k.style.transform = ''; } }; sEl.addEventListener('pointerup', end); sEl.addEventListener('pointercancel', end); }

    // ── Reaching. ──
    const reachOf = h => 17 * (h.s || 1) * (h === GROUND ? 1.5 : 1);
    const arcTo = (p, q) => { const dth = angDiff(q.a, p.a), r = (p.r + q.r) / 2; return { right: -dth * Math.min(r, 14), up: q.y - p.y }; };
    const reachable = (from, h) => { if (h === from || h.gone > 0.5) return false; const d = arcTo(from, h); return Math.hypot(d.right, d.up) <= reachOf(from) && h.y > -1; };
    const input = () => { let ix = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), iy = (keys.up ? 1 : 0) - (keys.down ? 1 : 0); if (Math.hypot(stick.x, stick.y) > 0.3) { ix += stick.x; iy -= stick.y; } const m = Math.hypot(ix, iy); return m > 0.3 ? { x: ix / m, y: iy / m } : null; };
    function pick(from, inp) {
      let best = null, bs = -9;
      for (const h of holds) { if (Math.abs(h.y - from.y) > 40) continue; if (!reachable(from, h)) continue; const d = arcTo(from, h), L = Math.hypot(d.right, d.up) || 1, cos = (d.right * inp.x + d.up * inp.y) / L; if (cos < 0.5) continue; const sc = cos * 2 - L / reachOf(from); if (sc > bs) { bs = sc; best = h; } }
      return best;
    }
    const drain = () => (st.zone === 'upper' ? 1.8 : 1);
    function startMove(h) {
      if (st.stamina <= 0) return;
      st.from = { y: st.y, a: st.a, r: st.r }; st.to = h; st.mode = 'move'; st.mt = 0; st.stamina = Math.max(0, st.stamina - 3 * drain()); A && A.blip && A.blip();
    }
    function poseAt(h) { const p = h === GROUND ? { y: 0, a: h.a, r: h.r } : { y: h.kind === 'ledge' ? h.y : h.y - 34 * SC * sOf(h.y), a: h.a, r: h.kind === 'ledge' ? h.r - h.L * 0.15 : trunkR(h.y) + 2.4 * sOf(h.y) }; return p; }
    function drop(msg, toLedge) {                   // loses his hold: falls to the nearest leaf below (or a good way down) and catches himself
      let tgt = null; const lim = st.cur.y;
      for (let i = holds.length - 1; i >= 0; i--) { const h = holds[i]; if (h.y < lim - 20 * sOf(lim) && h.kind === 'ledge' && h.gone < 0.5) { tgt = h; break; } }
      if (!tgt) { for (let i = holds.length - 1; i >= 0; i--) { const h = holds[i]; if (h.y < lim - 40 * sOf(lim) && h.kind !== 'slick' && h.kind !== 'moving') { tgt = h; break; } } }
      if (!tgt) tgt = GROUND; if (toLedge && st.cur.kind === 'ledge') tgt = st.cur;
      st.from = { y: st.y, a: st.a, r: st.r }; st.to = tgt; st.mode = 'drop'; st.mt = 0; pose.fall = 1; st.stamina = Math.max(st.stamina, 35); if (msg) toast(msg); A && A.thwack && A.thwack(0.3, true, 0.3);
    }
    const first = poseAt(GROUND); st.y = first.y; st.a = first.a; st.r = first.r;
    function scheduleGust() { const z = st.zone; st.gust = { phase: 'wait', t: z === 'middle' ? 13 + rnd() * 7 : z === 'upper' ? 8 + rnd() * 5 : 999 }; }
    scheduleGust();

    // ── Each frame. ──
    const camPos = new V3(), camLook = new V3(); let ended = false, fovCur = 50;
    const tick = dt => {
      if (ended) return;
      const t = G.t, h0 = st.cur, k = SC * sOf(st.y);
      st.zone = zoneOf(st.y); if (st.zone !== st.lastZone) { st.lastZone = st.zone; scheduleGust(); if (st.zone === 'middle') { mutter('It’s fighting me... the knots are moving.', true); toast('The stalk resists: knots drift, sap makes holds slick, leaves curl away, and gusts come.', 6000); } else if (st.zone === 'upper') { mutter('The air is so thin... everything is harder.', true); toast('Thin air: your sight narrows and your strength drains faster.', 6000); } }
      for (const h of holds) if (h.kind === 'moving' && Math.abs(h.y - st.y) < 80) place(h);
      // The leaves that curl away.
      for (const h of holds) if (h.kind === 'ledge' && h.leaf) {
        const lingering = (st.cur === h && st.mode === 'idle') || (st.zone === 'middle' && Math.abs(h.y - st.y) < 22 * h.s * 1.5 && Math.abs(angDiff(h.a, st.a)) < 1.0);
        if (st.zone !== 'lower') { if (h.gone <= 0 && lingering) { h.curlT += dt; if (h.curlT > 3.2) { h.gone = 1; h.curlT = 0; if (st.cur === h) { drop('The leaf curls away beneath you!'); } } } else if (h.gone > 0) { h.curlT += dt; if (h.curlT > 7) { h.gone = 0; h.curlT = 0; } } if (h.gone <= 0 && !lingering) h.curlT = Math.max(0, h.curlT - dt); }
        const want = h.gone > 0 ? 1.45 : 0, windy = st.gust.phase === 'warn' || st.gust.phase === 'blow' ? 0.09 * Math.sin(t * 9 + h.ph) : 0; h.curl = lerp(h.curl, want, Math.min(1, dt * 4)); h.leaf.rotation.z = -h.curl + windy; h.leaf.rotation.x = h.curl * 0.2;
      }
      // Gusts: a warning first, then the blow.
      const g = st.gust; g.t -= dt;
      if (g.phase === 'wait' && g.t <= 0) { g.phase = 'warn'; g.t = 1.9; A && A.ambience({ wind: 0.9, birds: 0.1, fire: 0 }); toast('A gust is coming. Brace! (hold Space)', 1800); }
      else if (g.phase === 'warn' && g.t <= 0) { g.phase = 'blow'; g.t = 1.5; }
      else if (g.phase === 'blow') {
        st.shake = 1;
        if (g.t <= 0) { A && A.ambience({ wind: 0.35, birds: 0.4, fire: 0 }); scheduleGust(); }
        else if (!g.hit && st.mode !== 'drop' && st.cur !== GROUND) { g.hit = true; if (st.grip) { st.stamina = Math.max(0, st.stamina - 12); toast('You hold on against the wind.', 1800); } else if (st.cur.kind === 'ledge') { toast('The leaf bucks, but you ride it out.', 1800); } else { st.stamina = Math.max(0, st.stamina - 14); drop('The gust tears you from the stalk!'); } }
      }
      if (g.phase !== 'blow') g.hit = false;
      // Strength.
      st.grip = !!keys.grip && st.mode === 'idle'; gb.classList.toggle('on', st.grip);
      if (st.mode === 'idle') {
        const onLedge = st.cur.kind === 'ledge' || st.cur === GROUND;
        if (onLedge) st.stamina = Math.min(100, st.stamina + (st.grip ? 24 : 11) * dt);
        else st.stamina = Math.max(0, st.stamina - 1.6 * drain() * (st.grip ? 0.3 : 1) * dt * (st.zone === 'lower' ? 0.6 : 1));
        if (st.stamina <= 0 && st.cur !== GROUND) { drop('Your arms give out! You slide, and catch yourself below.'); }
        else { // slick holds: leave them quickly
          if (st.cur.kind === 'slick') { st.slip += dt; if (st.slip > 0.75) { st.slip = 0; st.stamina = Math.max(0, st.stamina - 10); drop('Slick with sap! Your hands slide off.'); } } else st.slip = 0;
          st.cool -= dt; const inp = input();
          if (inp && st.cool <= 0 && !st.grip && st.mode === 'idle') { const h = pick(st.cur, inp); if (h) startMove(h); else st.cool = 0.12; }
        }
        // He trails the hold he's on if it moves.
        if (st.mode === 'idle') { const p = poseAt(st.cur); st.y = lerp(st.y, p.y, Math.min(1, dt * 12)); st.a = lerp(st.a, st.cur.a, Math.min(1, dt * 12)); st.r = lerp(st.r, p.r, Math.min(1, dt * 12)); }
      } else if (st.mode === 'move' || st.mode === 'drop') {
        const dur = st.mode === 'drop' ? 0.75 : 0.42; st.mt += dt / dur; const u = clamp(st.mt, 0, 1), e = st.mode === 'drop' ? u * u : u * u * (3 - 2 * u), p = poseAt(st.to);
        const da = angDiff(st.to.a, st.from.a); st.y = lerp(st.from.y, p.y, e); st.a = st.from.a + da * e; st.r = lerp(st.from.r, p.r, e);
        if (u >= 1) { st.cur = st.to; st.mode = 'idle'; st.cool = 0.14; pose.fall = 0; st.best = Math.max(st.best, st.cur.y); st.ledgeT = 0; if (st.cur.kind === 'ledge' && !st.restedOnce) { st.restedOnce = true; mutter('A broad leaf. I can rest here.'); } }
      }
      pose.stand = lerp(pose.stand, st.cur.kind === 'ledge' || st.cur === GROUND ? (st.mode === 'move' ? 0.5 : 1) : 0, Math.min(1, dt * 9));
      if (st.mode === 'drop') pose.stand = 0;
      // Teaching, in the lower stalk.
      if (st.zone === 'lower') {
        if (st.tut === 0 && t > 1.2) { st.tut = 1; toast('Reach for a glowing handhold: W A S D, or the stick.', 6000); }
        else if (st.tut === 1 && st.cur !== GROUND) { st.tut = 2; st.tutAt = t; mutter('Hand over hand. Up we go.'); }
        else if (st.tut === 2 && t > st.tutAt + 6) { st.tut = 3; toast('Hanging tires you. Hold Space to grip and steady yourself; it costs less strength.', 7000); }
        else if (st.tut === 3 && st.stamina < 65) { st.tut = 4; toast('Watch the stamina bar. A broad leaf is a place to rest; hold Space there to recover faster.', 7000); }
      }
      if (st.best > TOP - 70 && !st.near) { st.near = true; mutter('Cloud! I can see the cloud above!', true); }
      // Jack himself: scaled down as he climbs.
      jackOut.root.scale.setScalar(k); const tp = centre(st.y);
      const pos = v(tp.x + Math.cos(st.a) * st.r, st.y, tp.z + Math.sin(st.a) * st.r);
      jackOut.root.position.copy(pos); jackOut.root.rotation.y = Math.atan2(-Math.cos(st.a), -Math.sin(st.a));
      // Which holds are within reach (lower: bright and pulsing; middle: a faint tint).
      const pulse = 0.5 + 0.5 * Math.sin(t * 5);
      for (const h of holds) if (h.mesh) { const near = st.mode === 'idle' && Math.abs(h.y - st.cur.y) < 40 && reachable(st.cur, h); const base = h.kind === 'slick' ? mats.slick : h.kind === 'moving' ? mats.moving : mats.good; h.mesh.material = near && st.zone === 'lower' ? mats.glow : near && st.zone === 'middle' && h.kind === 'good' ? mats.faint : base; h.mesh.scale.setScalar(near && st.zone === 'lower' ? 1.15 + 0.2 * pulse : 1); }
      // The sky, the light and the air.
      const hf = clamp(st.y / TOP, 0, 1), sky = sky0.clone().lerp(sky1, hf); E.background = sky; E.fog = new THREE.Fog(sky.getHex(), 260 + hf * 300, 1500);
      const sx = CX + lerp(-1700, 1700, ((t % 46) / 46)), shade = clamp(1 - Math.abs(sx - tp.x) / 650, 0, 1) * clamp((st.y - 380) / 200, 0, 1); shadow.position.x = sx;
      for (const [l, i0] of lights) l.intensity = i0 * (1 - 0.45 * shade);
      const vig = clamp((st.y - 500) / 260, 0, 1), low = st.stamina < 25 ? 0.2 * (0.5 + 0.5 * Math.sin(t * 6)) : 0;
      $('clVig').style.opacity = Math.min(1, vig + low); $('clVig').style.background = `radial-gradient(circle at 50% 52%, transparent ${Math.round(lerp(90, 18, vig))}%, rgba(8,10,16,${0.55 + 0.4 * vig}) ${Math.round(lerp(120, 48, vig))}%)`;
      $('clGust').style.opacity = g.phase === 'warn' ? 0.25 + 0.5 * (1 - g.t / 1.9) : g.phase === 'blow' ? 0.8 : 0; $('clGustTxt').style.opacity = g.phase === 'warn' ? 1 : 0;
      $('clAlt').textContent = `Height ${Math.round(st.y * 0.12)} m   ·   ${st.zone === 'lower' ? 'Lower stalk' : st.zone === 'middle' ? 'Middle stalk' : 'Upper stalk'}`;
      $('clBar').firstChild.style.width = st.stamina + '%'; $('clBar').classList.toggle('low', st.stamina < 25);
      if (st.toastAt && performance.now() > st.toastAt) { $('clToast').style.opacity = 0; st.toastAt = 0; }
      // The camera: outside him, at his own scale (so as he shrinks the stalk looms), held under the cloud.
      const kk = sOf(st.y), ca = st.a + st.yawOff; st.camA = st.camA + angDiff(ca, st.camA) * Math.min(1, dt * 3);
      const d = (88 + 14 * (st.zone === 'upper' ? 1 : 0)) * kk, at = v(tp.x + Math.cos(st.a) * st.r * 0.4, st.y + (st.cur.kind === 'ledge' ? 14 : -4) * kk * 0.95, tp.z + Math.sin(st.a) * st.r * 0.4);
      const want = v(at.x + Math.cos(st.camA) * d, at.y + 20 * kk, at.z + Math.sin(st.camA) * d);
      want.y = Math.min(want.y, CLOUD_Y - 8); at.y = Math.min(at.y, CLOUD_Y - 2);
      if (st.shake > 0) { want.x += (Math.random() - 0.5) * 2.2 * kk; want.y += (Math.random() - 0.5) * 1.6 * kk; st.shake = Math.max(0, st.shake - dt * 3); }
      if (camPos.lengthSq() === 0) camPos.copy(want); else camPos.lerp(want, Math.min(1, dt * 8)); camLook.copy(at);
      fovCur = lerp(fovCur, g.phase === 'blow' ? 56 : 50, Math.min(1, dt * 4));
      G.cut({ pos: camPos, look: camLook, fov: fovCur });
      // At the top: up through the cloud.
      if (!st.ended && st.y > TOP - 30 && st.mode === 'idle') { st.ended = true; finish(); }
    };
    async function finish() {
      st.mode = 'rise'; hud.style.display = 'none';
      const y0 = st.y, t0 = G.t; A && A.ambience({ wind: 0.6, birds: 0, fire: 0 });
      while (G.t - t0 < 3.4) { const u = clamp((G.t - t0) / 3.4, 0, 1); st.y = lerp(y0, CLOUD_Y + 18, u * u * (3 - 2 * u)); st.mode = 'rise'; pose.stand = 0; await G.wait(0.03); }
      const f = $('fade'); f.style.background = '#fff'; await G.fade(true, 1.2);
      await G.wait(0.5); cleanup(); f.style.background = ''; G.mode = 'end'; resolve({ top: true });
    }
    // (a tick-mode of 'rise' lets the frame code above keep placing him as st.y changes)
    function cleanup() {
      ended = true; root.removeEventListener('keydown', kd); root.removeEventListener('keyup', ku); el.removeEventListener('pointerdown', pd); el.removeEventListener('pointermove', pm); el.removeEventListener('pointerup', pu); el.removeEventListener('pointercancel', pu);
      G.updaters = G.updaters.filter(u => u !== tick); hud.remove(); css.remove(); E.remove(stage); E.fog = fogOld; E.background = bgOld; for (const [l, i0] of lights) l.intensity = i0; jackOut.after = null; jackOut.root.scale.setScalar(SC); camera.near = nearOld;
    }
    camera.near = 0.3; camera.updateProjectionMatrix();
    G.updaters.push(tick); G.climb = { st, holds, drop };           // (for tools and tests)
    G.fade(false, 1.4);
    mutter('Up we go. The stalk is wider than the cottage... but it will hold.', true);
  });
}

root.Climb = { run };
})(typeof window !== 'undefined' ? window : globalThis);

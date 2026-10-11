// Climbing Toward Consequence — the game shell: the content notice and 18+ confirmation, the title screen (over the drone view of the homestead), settings, saves, and the cutscene
// toolkit the story scenes are written with. A cutscene is an async function that awaits these: G.say(who, text), G.shot(name, secs), G.fade(black, secs), G.wait(secs).
// Skipping sets a flag that makes every wait, line and move finish at once, so a scene can be skipped and still land on the right frame.
(function (root) {
'use strict';
const THREE = root.THREE, Audio_ = root.GameAudio, V3 = THREE.Vector3;
const $ = id => document.getElementById(id);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ease = { linear: t => t, inOut: t => t * t * (3 - 2 * t), out: t => 1 - (1 - t) * (1 - t), in: t => t * t, soft: t => t * t * t * (t * (6 * t - 15) + 10) };

const SAVE_KEY = 'castle-consequence:save:v1', NOTICE_KEY = 'castle-consequence:notice:v1', SET_KEY = 'castle-consequence:settings:v1';
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* no storage */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* no storage */ } },
};

function create(els) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.setPixelRatio(Math.min(2, root.devicePixelRatio || 1)); els.stage.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 4000);
  const G = { renderer, camera, scene: null, t: 0, skipping: false, settings: Object.assign({ speed: 1, auto: true, subtitles: true }, store.get(SET_KEY, {})), mode: 'notice', shots: {}, updaters: [], drone: null, maxDt: 0.05 };
  const cam = { pos: new V3(), look: new V3(), fov: 50 }, move = { active: null };

  function resize() { const w = els.stage.clientWidth || root.innerWidth, h = els.stage.clientHeight || root.innerHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  root.addEventListener('resize', resize); resize();

  // ── Camera: named shots {pos, look, fov}; G.shot(name | spec, secs, easing) moves there (secs 0 cuts); G.drone is a function(t) that drives the camera while set. ──
  const specOf = s => typeof s === 'string' ? G.shots[s] : s;
  G.cut = s => { s = specOf(s); cam.pos.copy(s.pos); cam.look.copy(s.look); cam.fov = s.fov || cam.fov; move.active = null; };
  G.shot = (s, secs = 2, e = 'inOut') => new Promise(res => {
    s = specOf(s); if (G.skipping || secs <= 0) { G.cut(s); res(); return; }
    move.active = { from: { pos: cam.pos.clone(), look: cam.look.clone(), fov: cam.fov }, to: s, t: 0, secs, e: ease[e] || ease.inOut, res };
  });
  G.shotNow = () => ({ pos: cam.pos.clone(), look: cam.look.clone(), fov: cam.fov });

  // ── Timing. ──
  const waiters = [];
  G.wait = secs => new Promise(res => { if (G.skipping) { res(); return; } waiters.push({ t: secs, res }); });
  const fadeEl = els.fade;
  G.fade = (toBlack, secs = 1) => new Promise(res => {
    if (G.skipping) { fadeEl.style.transition = 'none'; fadeEl.style.opacity = toBlack ? 1 : 0; res(); return; }
    fadeEl.style.transition = `opacity ${secs}s ease`; fadeEl.style.opacity = toBlack ? 1 : 0; setTimeout(res, secs * 1000);
  });

  // ── Dialogue: a subtitle box that types its line out (the voice babbles for the same length). A tap or key press finishes typing, then moves on. ──
  const subs = els.subs, subWho = els.subWho, subText = els.subText;
  let advance = null;
  const tap = () => { if (advance) advance(); };
  root.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { if (G.mode === 'cutscene') { e.preventDefault(); tap(); } } });
  els.stage.addEventListener('pointerdown', () => { if (G.mode === 'cutscene') tap(); });
  subs.addEventListener('pointerdown', e => { e.stopPropagation(); if (G.mode === 'cutscene') tap(); });
  const WHO = { mother: ['Mother', '#e6b8a0'], jack: ['Jack', '#a8d8a0'], gerda: ['Gerda', '#e6a0c0'], peddler: ['Peddler', '#c8c090'], merchant: ['Merchant', '#a0c8f0'], narrator: ['', '#e6c46a'] };
  G.say = (who, text, opts) => new Promise(resolve => {
    if (G.skipping || (!G.settings.subtitles && !(opts && opts.force))) { resolve(); return; }
    const w = WHO[who] || [who, '#e6c46a']; subWho.textContent = w[0]; subWho.style.color = w[1]; subs.style.display = 'block'; subText.textContent = '';
    const cps = 34 * G.settings.speed, typeSecs = Math.max(0.6, text.length / cps), voice = Audio_ && who !== 'narrator' ? Audio_.speak(who, text, typeSecs, { muffle: opts && opts.muffle }) : null;
    const t0 = performance.now(); let typed = false, hold = null, poll = null, typing = null; const gateBtn = document.getElementById('subGate');
    const close = () => { clearTimeout(hold); clearInterval(typing); clearInterval(poll); advance = null; if (voice) voice.stop(); if (gateBtn) gateBtn.style.display = 'none'; subs.style.display = 'none'; resolve(); };
    const gateLabel = opts && opts.gate;
    const finish = () => {
      if (typed) return; typed = true; clearInterval(typing); subText.textContent = text;
      if (gateLabel) { gateBtn.textContent = gateLabel; gateBtn.style.display = 'inline-block'; gateBtn.onclick = e => { e.stopPropagation(); gateBtn.style.display = 'none'; close(); }; }   // a button inside the box that ends the line, so it cannot be missed
      else if (G.settings.auto) hold = setTimeout(close, Math.max(1100, text.length * 48 / G.settings.speed));
    };
    typing = setInterval(() => { const n = Math.min(text.length, Math.floor((performance.now() - t0) / 1000 * cps)); subText.textContent = text.slice(0, n); if (n >= text.length) finish(); }, 30);
    advance = () => { if (!typed) { finish(); if (voice) voice.stop(); } else if (!gateLabel) close(); };            // a tap finishes the typing, the next one moves on
    poll = setInterval(() => { if (G.skipping) close(); }, 60);
  });
  G.hideLine = () => { subs.style.display = 'none'; advance = null; };

  // ── The frame loop. ──
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(G.maxDt, (now - last) / 1000); last = now; G.t += dt;
    for (let i = waiters.length - 1; i >= 0; i--) { const w = waiters[i]; w.t -= dt; if (w.t <= 0) { waiters.splice(i, 1); w.res(); } }
    if (G.skipping) { for (const w of waiters.splice(0)) w.res(); if (move.active) { const m = move.active; move.active = null; G.cut(m.to); m.res(); } }
    if (move.active) {
      const m = move.active; m.t += dt; const k = m.e(clamp(m.t / m.secs, 0, 1));
      cam.pos.lerpVectors(m.from.pos, m.to.pos, k); cam.look.lerpVectors(m.from.look, m.to.look, k); cam.fov = m.from.fov + ((m.to.fov || m.from.fov) - m.from.fov) * k;
      if (m.t >= m.secs) { move.active = null; m.res(); }
    } else if (G.drone) { const s = G.drone(G.t); cam.pos.copy(s.pos); cam.look.copy(s.look); cam.fov = s.fov; }
    for (const u of G.updaters) u(dt, G.t);
    if (G.scene) {
      camera.position.copy(cam.pos); camera.lookAt(cam.look); if (Math.abs(camera.fov - cam.fov) > 0.01) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
      renderer.render(G.scene, camera);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ── Scenes: G.setScene(world) shows a world ({ scene, update(dt, t) }) and runs its update each frame. ──
  G.setScene = world => { G.scene = world.scene; G.world = world; G.updaters = G.updaters.filter(u => !u.isWorld); const u = (dt, t) => world.update && world.update(dt, t); u.isWorld = true; G.updaters.push(u); };

  G.store = store; G.SAVE_KEY = SAVE_KEY; G.NOTICE_KEY = NOTICE_KEY; G.saveSettings = () => store.set(SET_KEY, G.settings);
  G.save = data => store.set(SAVE_KEY, Object.assign(store.get(SAVE_KEY, {}), data, { savedAt: Date.now() }));
  G.loadSave = () => store.get(SAVE_KEY, null); G.clearSave = () => store.del(SAVE_KEY);
  return G;
}

root.Game = { create, ease, store, SAVE_KEY, NOTICE_KEY };
})(typeof window !== 'undefined' ? window : globalThis);

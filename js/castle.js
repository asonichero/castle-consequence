// Climbing Toward Consequence — the castle within, at full (100%) model scale. Gerda's home: mostly one storey (the tower's single room above is not built yet), ceilings twice a model's height (61).
//   The entrance hall is the heart of it. Off it, to the west, the quiet grand wing (two corridors, the music hall, the library, the old playroom); to the east, Gerda's warm wing (the kitchen, the parlour,
//   a narrow hallway, the bathing room, the roost), and out of the kitchen the walled garden. Free-standing pieces are placed by CastleLayout (js/castle-layout.js, written by room-editor.html?room=castle).
// Exposes Castle.interior() with the same shape as Farm.interior(): { scene, room, ceiling, items, place, layout, update, bounds, views }.
(function (root) {
'use strict';
const THREE = root.THREE, F = root.Farm, V3 = THREE.Vector3;
const H = 61;                                                                    // twice a full-size Jack
const box = F.box, plain = F.plain, unlit = F.unlit;
const rng = F.rng(4141);

// ── Surfaces ──
const canvasTex = (w, h, paint, rx, ry) => { const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rx) t.repeat.set(rx, ry); return t; };
const TEX = {};
const surface = (name, make, color) => { if (!TEX[name]) TEX[name] = make(); return new THREE.MeshLambertMaterial({ map: TEX[name], color: color || 0xffffff }); };
const speck = (g, w, h, cols, n, s) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[Math.floor(rng() * cols.length)]; g.fillRect(Math.floor(rng() * w), Math.floor(rng() * h), s || 2, s || 2); } };
const floorHall = () => surface('hall', () => canvasTex(128, 128, (g, w, h) => {                       // cream stone, veined with silver
  g.fillStyle = '#efe6d0'; g.fillRect(0, 0, w, h); speck(g, w, h, ['#f4ecd8', '#e6dcc2', '#ebe1c8'], 500);
  for (let v = 0; v < 9; v++) { let x = rng() * w, y = rng() * h; g.fillStyle = rng() < 0.5 ? '#c4ccd8' : '#dde2ea'; for (let i = 0; i < 40; i++) { g.fillRect(Math.floor(x) % w, Math.floor(y) % h, 2, 2); x += (rng() - 0.35) * 4; y += (rng() - 0.5) * 3 + 1; } }
  g.fillStyle = '#d6cdb4'; for (let i = 0; i < w; i += 32) { g.fillRect(i, 0, 1, h); g.fillRect(0, i, w, 1); } }, 44, 44));
const wallBone = (rx, ry) => { const m = surface('bone', () => canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#ddd5bf'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) { g.fillStyle = '#bdb59d'; g.fillRect(0, y, w, 2); for (let x = (y / 16) % 2 ? 0 : 16; x < w; x += 32) g.fillRect(x, y, 2, 16); } speck(g, w, h, ['#e8e1cc', '#d0c8b0'], 140); })); return m; };
const stoneFloor = (c) => surface('flag', () => canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#cfc6b0'; g.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 32) { g.fillStyle = '#a99f88'; g.fillRect(i, 0, 1, h); g.fillRect(0, i, w, 1); } speck(g, w, h, ['#d8cfba', '#c2b9a2'], 120); }, 60, 60), c);
const woodFloor = (c) => surface('wood', () => canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#9a7a52'; g.fillRect(0, 0, w, h); for (let i = 0; i < h; i += 8) { g.fillStyle = '#7e603c'; g.fillRect(0, i, w, 1); for (let j = (i / 8) % 2 ? 0 : 20; j < w; j += 40) g.fillRect(j, i, 1, 8); } speck(g, w, h, ['#a98a60', '#8c6c46'], 160); }, 60, 60), c);
const tileFloor = () => surface('tile', () => canvasTex(32, 32, (g, w, h) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#c6dde4' : '#9fc2cf'; g.fillRect(x * 8, y * 8, 8, 8); } g.fillStyle = '#7fa4b2'; for (let i = 0; i < w; i += 8) { g.fillRect(i, 0, 1, h); g.fillRect(0, i, w, 1); } }, 70, 70));
const strawFloor = () => surface('straw', () => canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#d6b866'; g.fillRect(0, 0, w, h); speck(g, w, h, ['#e8cf80', '#bf9f4e', '#f0dc98'], 600, 2); }, 40, 40));
const soilFloor = () => surface('soil', () => canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#6a4e36'; g.fillRect(0, 0, w, h); speck(g, w, h, ['#5a3f2a', '#7a5c40', '#4f7a3a'], 500); }, 60, 60));
const rugTex = () => surface('rug', () => canvasTex(64, 16, (g, w, h) => { g.fillStyle = '#5a2f78'; g.fillRect(0, 0, w, h); g.fillStyle = '#c9a23c'; g.fillRect(0, 0, w, 2); g.fillRect(0, h - 2, w, 2); g.fillRect(0, 4, w, 1); g.fillRect(0, h - 5, w, 1); for (let x = 2; x < w; x += 8) { g.fillStyle = '#c9a23c'; g.fillRect(x + 2, 6, 3, 4); g.fillStyle = '#7e4aa6'; g.fillRect(x + 3, 7, 1, 2); } }, 12, 1));
const tapTex = (a, b, c) => canvasTex(16, 32, (g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w, h); g.fillStyle = b; for (let y = 4; y < h; y += 8) { g.fillRect(2, y, w - 4, 3); } g.fillStyle = c; g.fillRect(0, 0, w, 2); g.fillRect(0, h - 2, w, 2); g.fillRect(0, 0, 1, h); g.fillRect(w - 1, 0, 1, h); });
const flat = (tex, w, h, d, x, y, z, parent) => box(w, h, d, new THREE.MeshLambertMaterial({ map: tex }), x, y, z, parent);

function interior() {
  const scene = new THREE.Scene(), room = new THREE.Group(); scene.add(room); scene.background = new THREE.Color(0xa8d2f2);
  const ceil = new THREE.Group(); room.add(ceil);
  let LAY = root.CastleLayout || {};
  try { if (root.location && /[?&]layout=draft/.test(root.location.search)) LAY = JSON.parse(root.localStorage.getItem('castle-consequence:castlelayout:draft')) || LAY; } catch (e) { /* no draft */ }
  const items = {}, anim = [], flames = [];
  const movable = (key, label, g, def) => { items[key] = { g, label, def, y: g.position.y }; g.userData.movable = key; room.add(g); place(key, LAY[key] || def); return g; };
  const place = (key, o) => { const it = items[key], g = it.g; g.position.set(o.x, it.y, o.z); g.rotation.y = o.ry || 0; };
  const at = (x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); return g; };
  const B = (w, h, d, color, x, y, z, parent) => box(w, h, d, plain(color), x, y, z, parent || room);
  const boneM = wallBone(), plasterM = surface('plaster', () => canvasTex(32, 32, (g, w, h) => { g.fillStyle = '#e8d3ac'; g.fillRect(0, 0, w, h); speck(g, w, h, ['#efdcb8', '#dcc79e'], 120); }, 1, 1));
  const warmM = plasterM;

  // ── Lighting: a warm daylight inside, and a few lamps. ──
  scene.add(new THREE.HemisphereLight(0xfff3e0, 0x8a7a64, 0.62));
  const lamp = (x, y, z, c, i, d) => { const l = new THREE.PointLight(c, i, d, 1.4); l.position.set(x, y, z); scene.add(l); return l; };
  lamp(0, 46, 20, 0xfff0d0, 0.95, 260); lamp(0, 24, -96, 0xffa860, 0.7, 150); lamp(-195, 44, -30, 0xffe6c0, 0.7, 190); lamp(-318, 44, -180, 0xffe6c0, 0.65, 230); lamp(-215, 44, -105, 0xdde8ff, 0.6, 150);
  lamp(-215, 44, -205, 0xfff0c0, 0.9, 150); lamp(-280, 40, -390, 0xe8dcc8, 0.55, 140); lamp(170, 40, -30, 0xffe0b0, 0.9, 190); lamp(290, 44, -350, 0xfff0c0, 0.95, 150); lamp(300, 40, -170, 0xd8f0f8, 0.55, 140); lamp(166, 80, -210, 0xfff6e0, 0.8, 300);

  // ── The shell: a floor, walls with openings, and a ceiling, room by room. ──
  const cloud = box(2600, 4, 2600, plain('#f4f0f4'), -20, -9, -170, scene);
  const slab = (x0, z0, x1, z1, floorM, ceilM, noCeil) => { box(x1 - x0, 2, z1 - z0, floorM, (x0 + x1) / 2, -1, (z0 + z1) / 2, room); if (!noCeil) box(x1 - x0 + 4, 3, z1 - z0 + 4, ceilM || boneM, (x0 + x1) / 2, H + 1.5, (z0 + z1) / 2, ceil); };
  // ops: [from, to, bottom, top] along the wall; the wall is a run along x (axis 'z', at z = fixed) or along z (axis 'x', at x = fixed).
  const wall = (axis, fixed, a0, a1, m, ops, h, th) => {
    h = h || H; th = th || 4; const seg = (c0, c1, y0, y1) => { if (c1 - c0 < 0.05 || y1 - y0 < 0.05) return; if (axis === 'z') box(c1 - c0, y1 - y0, th, m, (c0 + c1) / 2, (y0 + y1) / 2, fixed, room); else box(th, y1 - y0, c1 - c0, m, fixed, (y0 + y1) / 2, (c0 + c1) / 2, room); };
    let cur = a0; for (const o of (ops || []).slice().sort((p, q) => p[0] - q[0])) { seg(cur, o[0], 0, h); seg(o[0], o[1], 0, o[2]); seg(o[0], o[1], o[3], h); cur = o[1]; } seg(cur, a1, 0, h);
  };
  const DOOR = 52;                                                                  // a doorway: up to 52
  const glass = ['#c0485a', '#d8b04a', '#6a4aa8', '#4a78c8'];
  let gi = 0;
  const window_ = (axis, fixed, c, w, y0, y1, dirSign, shaft, clear) => {                  // glass in the opening, and (if asked) a shaft of coloured light slanting down and in from it
    const col = new THREE.Color(clear ? '#bcd6f4' : glass[gi++ % 4]), g = at(axis === 'z' ? c : fixed, (y0 + y1) / 2, axis === 'z' ? fixed : c); room.add(g);
    const gm = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8 });
    if (axis === 'z') box(w, y1 - y0, 0.5, gm, 0, 0, 0, g); else box(0.5, y1 - y0, w, gm, 0, 0, 0, g);
    if (shaft) {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(axis === 'z' ? w * 0.8 : 6, 74, axis === 'z' ? 6 : w * 0.8), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending })), sl = 0.42 * dirSign;
      if (axis === 'x') { sh.rotation.z = Math.atan(sl); sh.position.set(sl * 35, -35, 0); } else { sh.rotation.x = -Math.atan(sl); sh.position.set(0, -35, sl * 35); } g.add(sh);
    }
    return g;
  };

  // ════════ THE ENTRANCE HALL: x -90..90, z -110..110 ════════
  const hallFloor = floorHall(); slab(-90, -110, 90, 110, hallFloor, boneM);
    wall('z', 110, -90, 90, boneM, [[-26, 26, 0, 56], [-70, -52, 38, 56], [52, 70, 38, 56]]);                                     // south: the grand doors, and two high windows
  wall('z', -110, -90, 90, boneM, [[-77, -59, 38, 56], [59, 77, 38, 56]]);                                                    // north: the hearth wall
  wall('x', -90, -110, 110, boneM, [[-43, -8, 0, 52]]);                   // west: to the grand wing
  wall('x', 90, -110, 110, boneM, [[-45, -5, 0, 52]]);                    // east: to Gerda's wing
  window_('z', 110, -61, 18, 38, 56, -1, true); window_('z', 110, 61, 18, 38, 56, -1, true);
  window_('z', -110, -68, 18, 38, 56, 1, true); window_('z', -110, 68, 18, 38, 56, 1, true);
  // the grand doors, standing open
  for (const sx of [-1, 1]) { const lf = at(sx * 26, 0, 110); lf.rotation.y = sx * -1.3; room.add(lf); B(26, 56, 2.6, '#3a2a20', -sx * 13, 28, 0, lf); B(26, 2.4, 3.2, '#2b2d36', -sx * 13, 14, 0, lf); B(26, 2.4, 3.2, '#2b2d36', -sx * 13, 42, 0, lf); }
  box(60, 5, 6, boneM, 0, 58.5, 110, room);
  // the hearth, gaping, at the far end
  { const hg = at(0, 0, -110); room.add(hg); B(92, 50, 20, '#cfc7b0', 0, 25, 10, hg); B(40, 30, 21, '#14100c', 0, 15, 10.4, hg); B(100, 5, 24, '#bdb59d', 0, 52, 10, hg); B(54, 8, 22, '#bdb59d', 0, 34, 10.2, hg); B(46, 1, 12, '#3a3a3a', 0, 0.5, 14, hg);
    for (let i = 0; i < 7; i++) { const m = B(4 + (i % 3), 10, 4, i % 2 ? '#ffb040' : '#ff7a20', -14 + i * 4.6, 6, 12, hg); flames.push({ m, base: 10, ph: i * 1.3 }); } B(36, 1.5, 3, '#4a3626', 0, 1.5, 12, hg); B(20, 3, 3, '#4a3626', 0, 3, 12.4, hg);
    const hl = lamp(0, 14, -92, 0xff9a40, 1.1, 130); anim.push((t) => { hl.intensity = 1.0 + 0.2 * Math.sin(t * 11) * Math.sin(t * 6.1); }); }
  // the velvet chair, beside the hearth
  { const g = at(0, 0, 0); B(16, 7, 16, '#6a2860', 0, 11, 0, g); B(16, 24, 4, '#5a2052', 0, 22, -6, g); B(3, 12, 16, '#5a2052', -9.5, 14, 0, g); B(3, 12, 16, '#5a2052', 9.5, 14, 0, g); for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(2, 8, 2, '#3a2a20', sx * 7, 4, sz * 7, g); B(18, 1.6, 18, '#c9a23c', 0, 8, 0, g); movable('velvetChair', 'Velvet chair (by the hearth)', g, { x: 36, z: -52, ry: -0.6 }); }
  // the long table, set for one, and its chair
  { const g = at(0, 0, 0); B(100, 3, 24, '#5a3c26', 0, 24, 0, g); for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(4, 24, 4, '#3a2a20', sx * 44, 12, sz * 9, g); B(104, 1, 28, '#7a1f3a', 0, 25.4, 0, g);
    B(8, 0.8, 8, '#f4f0e8', -40, 26.2, 0, g); B(2.6, 5, 2.6, '#c9a23c', -34, 28, -4, g); B(0.7, 0.4, 7, '#c8ccd4', -45, 26, 0, g); B(0.7, 0.4, 7, '#c8ccd4', -35.5, 26, 0, g); B(1.6, 7, 1.6, '#e8dcc0', -26, 29, 5, g); B(2, 1, 2, '#ffd870', -26, 33, 5, g);
    B(16, 3, 16, '#6a2860', -52, 12, 0, g); B(3, 24, 16, '#5a2052', -60, 20, 0, g); movable('longTable', 'Long table, set for one', g, { x: 2, z: 9, ry: 0 }); }
  { const g = at(0, 0, 0); B(44, 20, 15, '#4a3626', 0, 10, 0, g); B(46, 2, 16, '#5a4630', 0, 21, 0, g); B(18, 14, 0.8, '#6a5036', -10, 10, 7.8, g); B(18, 14, 0.8, '#6a5036', 10, 10, 7.8, g); B(2, 2, 1, '#c9a23c', -2, 10, 8.4, g); B(2, 2, 1, '#c9a23c', 2, 10, 8.4, g); B(5, 9, 5, '#8a9ab0', -12, 26, 0, g); B(3, 5, 3, '#c9a23c', 8, 24, 0, g); movable('lowCupboard', 'Low cupboard (by the table)', g, { x: -58, z: -85, ry: 0 }); }
  const chandelier = (k, x, z, label) => {                                                // they sway with no wind
    const g = at(x, H, z); B(0.8, 14, 0.8, '#5a5a62', 0, -7, 0, g); const ring = at(0, -16, 0); g.add(ring); B(20, 1.6, 1.6, '#c9a23c', 0, 0, 0, ring); B(1.6, 1.6, 20, '#c9a23c', 0, 0, 0, ring); B(14, 1.2, 14, '#b8923a', 0, -1, 0, ring);
    for (const [cx, cz] of [[-9, 0], [9, 0], [0, -9], [0, 9]]) { B(1.4, 4, 1.4, '#efe8d8', cx, 2.4, cz, ring); B(1.6, 1.8, 1.6, '#ffd870', cx, 5.2, cz, ring); } B(1.6, 6, 1.6, '#c9a23c', 0, -4, 0, ring);
    movable('chandelier' + k, label || 'Chandelier ' + k, g, { x, z, ry: 0 }); anim.push((t) => { g.rotation.z = 0.05 * Math.sin(t * 0.7 + k * 2); g.rotation.x = 0.04 * Math.sin(t * 0.55 + k); });
  };
  chandelier(1, -50, 70); chandelier(2, 0, 10); chandelier(3, 40, -50);
  // tapestries, stirring as if someone sighed
  const tapestry = (axis, fixed, c, y, w, h, tex, ph) => { const g = at(axis === 'z' ? c : fixed, y + h, axis === 'z' ? fixed : c); room.add(g); flat(tex, axis === 'z' ? w : 0.8, h, axis === 'z' ? 0.8 : w, 0, -h / 2, 0, g); anim.push((t) => { const s = 0.5 + 0.5 * Math.sin(t * 0.5 + ph); g.rotation[axis === 'z' ? 'x' : 'z'] = 0.05 * s * Math.sin(t * 1.3 + ph); }); return g; };
  const T = [tapTex('#7a1f3a', '#c9a23c', '#3a0f1c'), tapTex('#1f3a7a', '#d8d4c0', '#0f1c3a'), tapTex('#2f6a3a', '#c9a23c', '#173a20'), tapTex('#5a2f78', '#d8b04a', '#2a1238')];
  tapestry('x', -88, -64, 12, 20, 38, T[0], 0); tapestry('x', -88, 10, 12, 20, 38, T[1], 1.5); tapestry('x', -88, 56, 12, 20, 38, T[3], 3); tapestry('x', 88, -64, 12, 20, 38, T[2], 2); tapestry('x', 88, 10, 12, 20, 38, T[3], 4); tapestry('x', 88, 56, 12, 20, 38, T[0], 5); tapestry('z', 108, 0, 14, 22, 36, T[1], 6);

  // ════════ THE WEST WING: the quiet, grander half. Corridor B runs north-south down its west side; the rooms open off it to the east. ════════
  const stone = stoneFloor();
  slab(-273, -43, -90, -8, stone, boneM);                                                // corridor A, the rug
  wall('z', -43, -273, -90, boneM, []); wall('z', -8, -273, -90, boneM, []);
  { const g = at(0, 0, 0); box(166, 0.5, 28, rugTex(), 0, 0.3, 0, g); B(166, 0.4, 2.6, '#c9a23c', 0, 0.55, 12, g); B(166, 0.4, 2.6, '#c9a23c', 0, 0.55, -12, g); movable('rugA', 'The great rug (gold and violet)', g, { x: -180, z: -26, ry: 0 }); }
  { const g = at(0, 0, 0); B(3.4, 1.4, 3.4, '#c9a23c', 0, 1, 0, g); B(2.8, 3.4, 2.8, '#c9a23c', 3, 1.8, 0, g).rotation.z = 1.4; B(8, 0.15, 6, '#7a1020', 6, 0.2, 1, g); movable('goblet', 'Fallen goblet', g, { x: -140, z: -27, ry: 0.5 }); }
  { const g = at(-215, 0, -40.4); room.add(g); B(24, 40, 0.8, '#26324a', 0, 24, 0, g); B(26, 2, 1, '#c9a23c', 0, 44.5, 0, g); B(26, 2, 1, '#c9a23c', 0, 3.5, 0, g);         // the woman in silver
    B(10, 18, 1, '#cfd4de', 0, 18, 0.8, g); B(12, 10, 1, '#e8ecf4', 0, 29, 0.8, g); B(7, 5, 1, '#e8c8a8', 0, 37, 0.9, g);
    const head = at(0, 41, 1.4); g.add(head); B(7, 7, 7, '#e8c8a8', 0, 0, 0, head); B(8, 3, 8, '#cfd4de', 0, 4, 0, head); B(1.3, 1.3, 0.6, '#2a3a60', -1.8, 0.6, 3.5, head); B(1.3, 1.3, 0.6, '#2a3a60', 1.8, 0.6, 3.5, head); B(3, 0.8, 0.6, '#9a4a4a', 0, -1.8, 3.5, head);
    const spec = { head, look: null }; anim.push((t) => { head.rotation.y = spec.look != null ? spec.look : 0.5 * Math.sin(t * 0.35) * (0.5 + 0.5 * Math.sin(t * 0.13)); }); room.userData.woman = spec; }
  // corridor B: urns and cabinets carved with stories
  slab(-314, -160, -273, 97, stone, boneM);
  wall('x', -314, -160, 97, boneM, [[-129, -111, 38, 54], [-49, -31, 38, 54], [31, 49, 38, 54]]); window_('x', -314, -120, 18, 38, 54, 1, true, 1); window_('x', -314, -40, 18, 38, 54, 1, true, 1); window_('x', -314, 40, 18, 38, 54, 1, true, 1);
  wall('x', -273, -160, 97, boneM, [[-43, -8, 0, 52], [-118, -82, 0, 52], [28, 60, 0, 52]]); wall('z', 97, -314, -273, boneM, []);
  const urn = (k, x, z) => { const g = at(0, 0, 0); B(7, 3, 7, '#b9b4a6', 0, 1.5, 0, g); B(10, 8, 10, '#c4bfb0', 0, 7, 0, g); B(7, 5, 7, '#b9b4a6', 0, 13.5, 0, g); B(4, 3, 4, '#b9b4a6', 0, 17, 0, g); B(6.5, 1.5, 6.5, '#a8a396', 0, 19, 0, g); B(10.4, 1, 0.4, '#8a8478', 0, 7, 5.1, g); movable('urn' + k, 'Stone urn ' + k, g, { x, z, ry: 0 }); };
  [[-306, -142], [-306, -78], [-306, -21], [-306, 39], [-306, 82], [-280, -150]].forEach((p, i) => urn(i + 1, p[0], p[1]));
  const cabinet = (k, x, z, ry) => { const g = at(0, 0, 0); B(26, 34, 12, '#4a3626', 0, 17, 0, g); B(28, 2, 14, '#5a4630', 0, 35, 0, g); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) B(6.5, 7, 0.8, r % 2 ? '#7a6040' : '#8a6c48', -8 + c * 8, 8 + r * 9.5, 6.4, g); B(1.4, 3, 1, '#c9a23c', -1.5, 17, 6.9, g); B(1.4, 3, 1, '#c9a23c', 1.5, 17, 6.9, g); movable('cabinet' + k, 'Carved cabinet ' + k, g, { x, z, ry }); };
  cabinet(1, -306, -121, Math.PI / 2); cabinet(2, -306, -53, Math.PI / 2); cabinet(3, -306, 6, Math.PI / 2); cabinet(4, -306, 62, Math.PI / 2);
  // the music hall: x -273..-93, z 0..88
  slab(-273, 0, -93, 88, woodFloor(), boneM); wall('z', 0, -273, -93, boneM, []); wall('z', 88, -273, -93, boneM, [[-229, -211, 37, 53], [-179, -161, 37, 53], [-125, -107, 37, 53]]); wall('x', -93, 0, 88, boneM, []);
  for (const cx of [-220, -170, -116]) window_('z', 88, cx, 18, 37, 53, -1, true, 1);
  const harp = (k, x, z, ry) => { const g = at(0, 0, 0); B(16, 3, 8, '#c9a23c', 0, 1.5, 0, g); B(3, 40, 3, '#c9a23c', 7, 21, 0, g); const neck = B(18, 3, 3, '#c9a23c', -1, 40, 0, g); neck.rotation.z = -0.28; for (let i = 0; i < 9; i++) B(0.25, 14 + i * 2.8, 0.25, '#f0ecd8', -8 + i * 1.7, 8 + (14 + i * 2.8) / 2 - 1, 0, g); B(2.4, 3, 4, '#5a2f78', 0, 3.6, 0, g); movable('harp' + k, 'Harp ' + k, g, { x, z, ry }); };
  harp(1, -241, 16, 0); harp(2, -204, 14, 0.2); harp(3, -165, 72, Math.PI);
  { const g = at(0, 0, 0); B(34, 2, 10, '#5a4630', 0, 14, 0, g); B(2, 14, 8, '#4a3626', -14, 7, 0, g); B(2, 14, 8, '#4a3626', 14, 7, 0, g); for (let i = 0; i < 6; i++) B(1, 1, 18, i % 2 ? '#c9a23c' : '#c8ccd4', -12 + i * 4.8, 15.4, 0, g); movable('fluteRack', 'Flute rack', g, { x: -124, z: 66, ry: Math.PI / 2 }); }
  for (const [k, x, z] of [[1, -220, 50], [2, -182, 38]]) { const g = at(0, 0, 0); B(9, 2, 9, '#6a2860', 0, 10, 0, g); for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(1.4, 10, 1.4, '#4a3626', sx * 3.4, 5, sz * 3.4, g); movable('stool' + k, 'Music stool ' + k, g, { x, z, ry: 0 }); }
  // the sunlit library, behind a gauze curtain: x -273..-93, z -146..-51
  slab(-273, -146, -93, -51, woodFloor(0xd8c8a8), boneM); wall('z', -146, -273, -93, boneM, []); wall('z', -51, -273, -93, boneM, []); wall('x', -93, -146, -51, boneM, [[-144, -114, 36, 58]]);
  window_('x', -93, -129, 28, 36, 58, -1, true, 1);
  { const g = at(-271.5, 25, -100); room.add(g); const gm = new THREE.MeshBasicMaterial({ color: 0xf4f0ea, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }); const cur = new THREE.Mesh(new THREE.BoxGeometry(0.4, 50, 34), gm); g.add(cur); anim.push((t) => { cur.rotation.z = 0.02 * Math.sin(t * 0.9); cur.rotation.x = 0.03 * Math.sin(t * 0.7 + 1); }); }
  for (let s = 0; s < 3; s++) { const g = at(0, 0, 0); B(8, 38, 34, '#5a4026', 0, 19, 0, g); for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) B(5, 7 - (c % 2) * 0.8, 3.2, ['#7a1f3a', '#2f4a7a', '#2f6a3a', '#c9a23c', '#5a2f78'][(r + c) % 5], 0.8, 6 + r * 8.6, -14 + c * 4, g); movable('shelf' + (s + 1), 'Bookshelf ' + (s + 1), g, [{ x: -263, z: -125, ry: 0 }, { x: -204, z: -141, ry: -Math.PI / 2 }, { x: -140, z: -141, ry: -Math.PI / 2 }][s]); }
  { const g = at(0, 0, 0); const cols = ['#7a1f3a', '#5a2f78', '#c9a23c', '#2a6a7a', '#b84a6a', '#3a5a9a']; for (let i = 0; i < 14; i++) { const a = rng() * 6.28, r = rng() * 12, l = Math.floor(i / 6); B(10 + rng() * 5, 4, 10 + rng() * 5, cols[i % 6], Math.cos(a) * r, 2 + l * 3.4, Math.sin(a) * r, g).rotation.y = rng() * 3; } movable('cushionHeap', 'Heap of silk cushions', g, { x: -161, z: -117, ry: 0 }); }
  { const g = at(0, 0, 0); B(44, 7, 14, '#4a3626', 0, 6, 0, g); B(44, 6, 14, '#6a2860', 0, 12, 0, g); B(44, 10, 3, '#6a2860', 0, 17, -6, g); for (const sx of [-1, 1]) B(3, 8, 14, '#4a3626', sx * 21, 8, 0, g); movable('paddedBench', 'Padded bench', g, { x: -141, z: -70, ry: 0 }); }
  // the old playroom, which is also where Jack sleeps: x -314..-99, z -293..-160
  slab(-314, -293, -99, -160, woodFloor(0xb89a74), boneM); const nW = [[-299, -281], [-249, -231], [-199, -181], [-149, -131]].map(o => [o[0], o[1], 38, 56]), nS = [[-274, -256], [-234, -216], [-194, -176]].map(o => [o[0], o[1], 38, 56]);
  wall('z', -293, -314, -99, boneM, nW); wall('z', -160, -314, -99, boneM, [[-308, -280, 0, 52]]); wall('x', -314, -293, -160, boneM, nS); wall('x', -99, -293, -160, boneM, nS);
  for (const cx of [-290, -240, -190, -140]) window_('z', -293, cx, 18, 38, 56, 1, true, 1); for (const cz of [-265, -225, -185]) { window_('x', -314, cz, 18, 38, 56, 1, true, 1); window_('x', -99, cz, 18, 38, 56, -1, true, 1); }
  const horse = (k, x, z, ry) => { const g = at(0, 0, 0); B(22, 3, 4, '#8a7a60', 0, 2, 5, g); B(22, 3, 4, '#8a7a60', 0, 2, -5, g); B(16, 10, 8, '#a89a82', 0, 14, 0, g); B(5, 10, 5, '#a89a82', 8, 21, 0, g); B(6, 5, 4, '#a89a82', 12, 24, 0, g); B(1, 5, 3, '#6a5a44', 7.5, 25, 0, g); B(2, 8, 2, '#6a5a44', -9, 14, 0, g); for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(1.8, 9, 1.8, '#8a7a60', sx * 5.5, 7, sz * 3.4, g); movable('horse' + k, 'Rocking horse ' + k, g, { x, z, ry }); anim.push((t) => { g.rotation.z = k === 2 ? 0.03 * Math.sin(t * 0.8) : 0; }); };
  horse(1, -198, -239, 0.4); horse(2, -240, -262, -0.3); horse(3, -160, -205, 1.2);
  { const g = at(0, 0, 0); for (const [x, z, c] of [[0, 0, '#b04a4a'], [5, 1, '#4a6ab0'], [2, 4, '#c9a23c'], [-4, 3, '#4a9a5a']]) B(4, 4, 4, c, x, 2, z, g).rotation.y = rng() * 3; B(5, 5, 5, '#c4a070', -9, 2.5, -3, g); B(2, 5, 2, '#a04a6a', 9, 2.5, -2, g); movable('toys', 'Worn toys (blocks, ball, top)', g, { x: -186, z: -175, ry: 0 }); }
  { const g = at(0, 0, 0); B(30, 18, 22, '#9a8a6a', 0, 9, 0, g); B(2, 18, 22, '#8a7a5a', 14, 9, 0, g); B(30, 1, 22, '#8a7a5a', 0, 18.5, 0, g); B(2, 8, 20, '#7a6a4a', -6, 3, 14, g).rotation.z = 0.9; B(16, 2, 12, '#6a3a3a', -4, 1.4, 16, g).rotation.x = 0.3; B(8, 8, 1, '#c9a23c', 4, 9, 11.4, g); B(4, 4, 0.5, '#4a6a8a', -6, 12, 11.2, g); B(4, 4, 0.5, '#4a6a8a', 6, 4, 11.2, g); movable('dollhouse', 'Broken dollhouse (in the corner)', g, { x: -292, z: -270, ry: 0.3 }); }
  { const g = at(0, 0, 0); B(7, 1.6, 9, '#6a1a2a', 0, 0.8, 0, g); B(7.2, 0.4, 9.2, '#c9a23c', 0, 1.7, 0, g); movable('ledger', 'The hidden ledger of names', g, { x: -304, z: -283, ry: 0.5 }); }
  { const g = at(0, 0, 0); const W_ = 38, D_ = 24;                                           // Jack's cot: low bars on all four sides
    B(W_, 3, D_, '#5a4026', 0, 5, 0, g); B(W_ - 3, 3.4, D_ - 3, '#e8e0cc', 0, 8, 0, g); B(W_ - 6, 2, D_ - 6, '#6a3a5a', 3, 10, 0, g); B(8, 2.4, 10, '#f4f0e8', -13, 10.4, 0, g);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(2.4, 16, 2.4, '#4a3420', sx * (W_ / 2 - 1.2), 8, sz * (D_ / 2 - 1.2), g);
    for (const sz of [-1, 1]) { B(W_, 1.4, 1.4, '#4a3420', 0, 15, sz * (D_ / 2 - 1.2), g); for (let i = 0; i < 9; i++) B(1, 9, 1, '#6a4a2e', -W_ / 2 + 4 + i * ((W_ - 8) / 8), 10.5, sz * (D_ / 2 - 1.2), g); }
    for (const sx of [-1, 1]) { B(1.4, 1.4, D_, '#4a3420', sx * (W_ / 2 - 1.2), 15, 0, g); for (let i = 0; i < 5; i++) B(1, 9, 1, '#6a4a2e', sx * (W_ / 2 - 1.2), 10.5, -D_ / 2 + 4 + i * ((D_ - 8) / 4), g); }
    movable('cot', 'Jack\'s cot (low bars on all four sides)', g, { x: -125, z: -270, ry: 0 }); }

  chandelier(4, -183, 44, 'Chandelier (music hall)'); chandelier(5, -183, -98, 'Chandelier (library)'); chandelier(6, -230, -226, 'Chandelier 1 (nursery)'); chandelier(7, -160, -226, 'Chandelier 2 (nursery)');

  // ════════ GERDA'S WING: the warmer half ════════
  slab(90, -111, 250, 53, stoneFloor(0xd8c0a0), warmM);                                   // the kitchen
  wall('z', 53, 90, 250, warmM, [[108, 138, 35, 52], [171, 201, 35, 52]]); wall('z', -111, 90, 250, warmM, [[110, 130, 36, 54], [150, 174, 0, 50], [196, 216, 36, 54]]); wall('x', 250, -111, 53, warmM, [[-95, -55, 0, 52]]); wall('x', 90, -111, 53, warmM, [[-45, -5, 0, 52]]);
  window_('z', 53, 123, 30, 35, 52, -1, true, 1); window_('z', 53, 186, 30, 35, 52, -1, true, 1); window_('z', -111, 120, 18, 36, 54, 1, true, 1); window_('z', -111, 206, 18, 36, 54, 1, true, 1);
  { const hg = at(246, 0, 5); room.add(hg); hg.rotation.y = -Math.PI / 2; B(66, 40, 14, '#c4a880', 0, 20, 7, hg); B(28, 22, 15, '#14100c', 0, 11, 7.4, hg); B(72, 4, 16, '#a88a62', 0, 42, 7, hg); for (let i = 0; i < 5; i++) { const m = B(3.4, 8, 3, i % 2 ? '#ffb040' : '#ff7a20', -7 + i * 3.6, 5, 9, hg); flames.push({ m, base: 8, ph: i * 1.7 }); } const kl = lamp(230, 12, 5, 0xff9a40, 0.9, 110); anim.push((t) => { kl.intensity = 0.8 + 0.18 * Math.sin(t * 10) * Math.sin(t * 5.7); }); }
  { const g = at(0, 0, 0); B(20, 24, 16, '#2b2d36', 0, 12, 0, g); B(22, 2, 18, '#3a3d48', 0, 25, 0, g); for (const [x, z] of [[-5, -3], [5, 3]]) B(7, 1, 7, '#1a1a20', x, 26, z, g); B(3, 18, 3, '#2b2d36', 6, 34, -5, g); movable('stove', 'Iron stove', g, { x: 125, z: -90, ry: 0 }); }
  { const g = at(0, 0, 0); B(50, 3, 26, '#7a5a3a', 0, 24, 0, g); for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(3.4, 24, 3.4, '#5a4026', sx * 22, 12, sz * 10, g); B(8, 1.2, 8, '#d8d4c8', 6, 26, 0, g); B(5, 7, 5, '#a8442a', -12, 28, 4, g); movable('kitchenTable', 'Kitchen table', g, { x: 169, z: -36, ry: 0 }); }
  { const g = at(0, 0, 0); B(10, 2.4, 10, '#7a5a3a', 0, 21, 0, g); for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(1.6, 21, 1.6, '#5a4026', sx * 4, 10.5, sz * 4, g); B(10, 1, 1.2, '#5a4026', 0, 12, 4, g); B(10, 1, 1.2, '#5a4026', 0, 12, -4, g); movable('tallStool', 'Tall stool (at the table)', g, { x: 172, z: -60, ry: 0 }); }
  { const g = at(0, 0, 0); B(44, 32, 14, '#6a4a2e', 0, 16, 0, g); B(46, 2, 16, '#7a5a3a', 0, 33, 0, g); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { B(9.4, 8, 0.8, '#8a6a44', -16.5 + c * 11, 5 + r * 10, 7.4, g); B(1.6, 1.6, 1, '#c9a23c', -16.5 + c * 11, 5 + r * 10, 8, g); } B(8, 12, 8, '#9a7a56', 14, 40, 0, g); movable('drawers', 'Drawers (that hold what she needs)', g, { x: 224, z: -99, ry: Math.PI }); }
  { const g = at(0, 0, 0); B(14, 2, 16, '#5a4026', 0, 12, 0, g); B(14, 20, 2, '#5a4026', 0, 21, -7, g); for (const sx of [-1, 1]) { B(2, 12, 16, '#5a4026', sx * 6.5, 14, 0, g); B(2, 2, 22, '#4a3420', sx * 6.5, 1, 0, g); for (const sz of [-1, 1]) B(1.6, 12, 1.6, '#5a4026', sx * 6.5, 6, sz * 7, g); } B(12, 2, 14, '#b84a4a', 0, 13.4, 0, g); movable('rockingChair', 'Rocking chair (by the fire)', g, { x: 208, z: 23, ry: Math.PI / 2 }); anim.push((t) => { g.rotation.z = 0.04 * Math.sin(t * 0.9); }); }
  // the parlour: x 250..376, z -109..-8
  slab(250, -109, 376, -8, woodFloor(0xd8b890), warmM); wall('z', -8, 250, 376, warmM, [[300, 330, 0, 52]]); wall('x', 376, -109, -8, warmM, [[-90, -50, 28, 54]]); wall('z', -109, 250, 376, warmM, [[258, 288, 0, 52]]);
  window_('x', 376, -70, 40, 28, 54, -1, true, 1);
  { const g = at(0, 0, 0); B(44, 7, 12, '#5a4026', 0, 4, 0, g); B(44, 4, 12, '#b86a4a', 0, 9, 0, g); movable('windowBench', 'Window bench', g, { x: 368, z: -70, ry: Math.PI / 2 }); }
  { const g = at(0, 0, 0); box(30, 0.5, 20, rugTex(), 0, 0.3, 0, g); movable('parlourRug', 'Parlour rug', g, { x: 307, z: -59, ry: 0 }); }
  // where the stairs to the tower will rise (not built yet): a stair hall flush under the parlour, x 250..376, z -8..53 (shares the kitchen's east wall)
  slab(250, -8, 376, 53, woodFloor(0xc8a880), warmM); wall('z', 53, 250, 376, warmM, []); wall('x', 376, -8, 53, warmM, []);
  for (let i = 0; i < 4; i++) B(34 - i * 1.2, 4.6 * (i + 1), 6, '#8a6a44', 313, 2.3 * (i + 1), 46 - i * 5.6, room);
  // the narrow hallway: x 250..295, z -207..-109; and the tiled bathing room: x 295..382, z -202..-115
  slab(250, -207, 295, -109, woodFloor(0xc8a880), warmM); wall('x', 295, -207, -109, warmM, [[-175, -145, 0, 52]]);
  slab(295, -202, 382, -115, tileFloor(), warmM); wall('z', -202, 295, 382, warmM, []); wall('z', -115, 295, 382, warmM, []); wall('x', 382, -202, -115, warmM, [[-172, -145, 36, 54]]);
  window_('x', 382, -158, 27, 36, 54, -1, true, 1);
  B(87, 18, 1, '#9fc2cf', 338, 9, -201, room); B(1, 18, 87, '#9fc2cf', 381, 9, -158, room);
  { const g = at(0, 0, 0); B(42, 12, 20, '#f0f0ec', 0, 6, 0, g); B(38, 1, 16, '#9fd0e8', 0, 12, 0, g); for (const sx of [-1, 1]) B(3, 3, 3, '#c9a23c', sx * 18, 1.5, 9, g); movable('tub', 'Bathing tub', g, { x: 355, z: -177, ry: 0 }); }
  { const g = at(0, 0, 0); B(8, 12, 8, '#e8e4d8', 0, 6, 0, g); B(10, 1.2, 10, '#c9a23c', 0, 12.6, 0, g); movable('bathStool', 'Bath stool and towels', g, { x: 367, z: -155, ry: 0 }); }
  // the indoor roost: x 250..390, z -330..-208
  slab(250, -330, 390, -208, strawFloor(), warmM); wall('z', -208, 250, 390, warmM, [[258, 288, 0, 52]]); wall('z', -330, 250, 390, warmM, [[300, 316, 44, 58]]); wall('x', 390, -330, -208, warmM, [[-290, -260, 36, 56]]); wall('x', 250, -348, -111, warmM, [[-300, -285, 0, 11], [-240, -220, 38, 56]]);
  window_('z', -330, 308, 16, 44, 58, 1, true, 1); window_('x', 390, -275, 30, 36, 56, -1, true, 1); window_('x', 250, -230, 20, 38, 56, 1, true, 1);
  B(18, 2, 12, '#a89c84', 308, 41, -336, room); B(22, 1, 14, '#bdb59d', 308, 40, -337, room);                                  // the stone ledge outside the high window: Jack's way out
  // the hen's tunnel, through the wall to the garden: just her size
  { const tl = '#a89c84'; B(10, 1.4, 14, tl, 246, 11.5, -292.5, room); B(10, 1.4, 14, tl, 246, 0.2, -292.5, room); B(10, 12, 1.4, tl, 246, 6, -299.7, room); B(10, 12, 1.4, tl, 246, 6, -285.3, room); B(8, 0.6, 12, '#d6b866', 246, 0.9, -292.5, room); }
  const hen = (x, z, sc) => { const g = at(x, 0, z); const gold = '#e8b830'; B(10, 8, 12, gold, 0, 6, 0, g); B(6, 6, 6, gold, 0, 11.5, 5.4, g); B(2, 2, 3, '#e87a20', 0, 11, 9.4, g); B(1.4, 3, 3, '#c0402a', 0, 15.5, 5.4, g); B(2, 5, 6, gold, 0, 8, -7.4, g); B(2, 4, 8, '#d8a828', -5.2, 6.4, 0, g); B(2, 4, 8, '#d8a828', 5.2, 6.4, 0, g); B(0.6, 0.6, 0.6, '#1a1a1a', -2.6, 12.4, 8, g); B(0.6, 0.6, 0.6, '#1a1a1a', 2.6, 12.4, 8, g); g.scale.setScalar(sc); return g; };
  { const g = at(0, 0, 0); B(22, 8, 22, '#6a2860', 0, 4, 0, g); B(24, 1.4, 24, '#c9a23c', 0, 8.4, 0, g); const h = hen(0, 0, 0.9); h.position.y = 9; g.add(h); anim.push((t) => { h.rotation.z = 0.02 * Math.sin(t * 1.3); h.position.y = 9 + 0.15 * Math.sin(t * 1.3); }); movable('henCushion', 'The golden hen, on her velvet cushion', g, { x: 310, z: -255, ry: 0 }); }
  { const g = at(0, 0, 0); for (let i = 0; i < 6; i++) B(14, 9, 14, i % 2 ? '#9a7a52' : '#8a6a44', 0, 4.5 + i * 9, 0, g).rotation.y = i * 0.3; movable('crateTower', 'Tower of crates', g, { x: 292, z: -314, ry: 0 }); }
  { const g = at(0, 0, 0); for (let i = 0; i < 5; i++) { B(22, 2, 10, '#5a4026', 0, 12 + i * 8, 0, g); B(2, 8, 2, '#4a3420', -9, 9 + i * 8, 4, g); } movable('shelfTower', 'Shelves climbing to the window', g, { x: 324, z: -318, ry: 0 }); }
  // ════════ THE GARDEN, between the wings: x -95..250, z -348..-111, on the same white moss as the meadow ════════
  const mossG = surface('moss', () => canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#d3ddcd'; g.fillRect(0, 0, w, h); speck(g, w, h, ['#c8d6c2', '#e1ead9', '#bccfb8', '#d6e2c8', '#e8eee0'], 700); }, 120, 120), 0xe8f0e0);
  box(345, 2, 237, mossG, 77.5, -1, -229.5, room);
  const GW = '#c8c0a8', GH = 56;                                                     // the garden wall: no higher than the ceilings, with the clouds beyond it
  for (const [w, d, x, z] of [[349, 4, 77.5, -348], [4, 237, -95, -229.5]]) { B(w, GH, d, GW, x, GH / 2, z, room); B(w + 2, 4, d + 2, '#e8e4ee', x, GH + 2, z, room); }
  for (const [x, z, w, h] of [[77, -410, 520, 50], [-230, -400, 220, 44], [330, -400, 240, 46], [-400, -200, 90, 40]]) B(w, h, 90, '#f4f0f4', x, h / 2 - 4, z, room);
  for (let k = 0; k < 3; k++) { const g = at(0, 0, 0); B(70, 3, 16, '#4a3322', 0, 1.5, 0, g); for (let i = 0; i < 13; i++) B(2, 2 + rng() * 6, 2, ['#4a8a3a', '#6a9a4a', '#3a7a4a'][i % 3], -31 + i * 5, 6, rng() * 8 - 4, g); movable('herbBed' + (k + 1), 'Herb bed ' + (k + 1), g, { x: -10, z: -223 + k * 35, ry: 0 }); }
  for (let k = 0; k < 4; k++) { const g = at(0, 0, 0); B(16, 3, 10, '#7a5a3a', 0, 1.5, 0, g); for (let i = 0; i < 6; i++) B(1.4, 2 + rng() * 2.4, 1.4, '#5aaa4a', -6 + i * 2.4, 4.4, (i % 2) * 3 - 1.5, g); movable('seedlings' + (k + 1), 'Seedling tray ' + (k + 1), g, { x: 100, z: -202 + k * 19, ry: 0 }); }
  { const g = at(170, 0, -111); room.add(g); B(150, 2, 16, '#5a4026', 0, 44, -8, g); B(150, 14, 1, '#6a4a2e', 0, 52, -15.5, g); for (let i = 0; i < 14; i++) { B(0.3, 6, 0.3, '#8a7a5a', -66 + i * 10.4, 40, -7, g); B(3, 6, 3, ['#6a9a4a', '#8a8a5a', '#9a6a8a', '#7aa05a'][i % 4], -66 + i * 10.4, 35, -7, g); } }
  { const g = at(0, 0, 0); B(10, 6, 10, '#a8a396', 0, 3, 0, g); B(4, 24, 4, '#2b2d36', 0, 18, 0, g); B(3, 3, 12, '#2b2d36', 0, 29, 4, g); B(18, 2, 2, '#2b2d36', 0, 27, 0, g).rotation.z = 0.5; B(4, 3, 6, '#2b2d36', 0, 22, 5, g); B(22, 6, 12, '#7a5a3a', 0, 3, 12, g); B(20, 2, 10, '#5aa8d0', 0, 5.4, 12, g); movable('pump', 'Water pump and trough', g, { x: 123, z: -291, ry: Math.PI }); }
  { const g = at(0, 0, 0); B(22, 12, 16, '#7a5a3a', 0, 6, 0, g); B(24, 2, 18, '#5a4026', 0, 13, 0, g); B(16, 4, 12, '#6a2860', 0, 14, 0, g); const h = hen(0, 0, 0.8); h.position.set(0, 16, 0); g.add(h); movable('roost2', 'The hen\'s second roost, in the sun (by her tunnel)', g, { x: 226, z: -292, ry: -Math.PI / 2 }); }

  const bounds = { x0: -330, x1: 400, z0: -365, z1: 124 };
  const views = { front: [[40, 36, 420], [40, 30, 100]], top: [[40, 760, 20], [40, 0, -120]], iso: [[330, 380, 300], [30, 0, -110]], hall: [[0, 40, 104], [0, 22, -60]], hearth: [[0, 40, -96], [0, 20, 40]], west: [[-100, 38, -26], [-270, 20, -26]], corridorB: [[-294, 40, 90], [-294, 18, -150]], library: [[-100, 38, -100], [-240, 14, -110]], playroom: [[-110, 44, -170], [-250, 10, -250]], kitchen: [[100, 40, 48], [190, 12, -30]], roost: [[256, 44, -214], [320, 14, -280]], garden: [[-80, 60, -120], [100, 4, -250]] };
  return {
    scene, room, ceiling: ceil, items, place, layout: () => { const o = {}; for (const k in items) { const g = items[k].g; o[k] = { x: +g.position.x.toFixed(1), z: +g.position.z.toFixed(1), ry: +g.rotation.y.toFixed(3) }; } return o; },
    W: bounds.x1 - bounds.x0, D: bounds.z1 - bounds.z0, H, bounds, views, woman: room.userData.woman,
    update(dt, t) { for (const f of flames) { const s = f.base * (0.8 + 0.55 * Math.sin(t * 9 + f.ph) * Math.sin(t * 5.3 + f.ph * 2)); f.m.scale.y = Math.max(0.3, s / f.base); } for (const a of anim) a(t); },
  };
}
root.Castle = { interior, H };
})(typeof window !== 'undefined' ? window : globalThis);

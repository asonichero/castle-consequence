// Beanstalk — blocky models. Jack (21) and the Giantess, Gerda (late 30s), as Minecraft-style characters: a head, a torso, two arms
// and two legs, each a plain box textured from a 64x64 skin laid out like a Minecraft skin (base layer plus outer layer), except that the
// arms are 3x3 pixels, a little thinner than Minecraft's. The other departure from the stock rig: each leg is cut at the knee into thigh and
// shin boxes. They read as one straight leg when standing and only show a bend when the character sits.
// The skins are painted here, pixel by pixel, rather than loaded; blocky.html shows the pair, and js/lap.js poses them across the lap.
(function (root) {
'use strict';
const THREE = root.THREE;

// ---------------------------------------------------------------------------------------------------------------------------
// Skin atlas (Minecraft 64x64 layout). Each part is a box of w x h x d pixels whose six faces are laid out from (u, v).
// ---------------------------------------------------------------------------------------------------------------------------
const atlas = (aw, ad) => {
  const P = (u, v, w, h, d) => ({ u, v, w, h, d });
  return {
    head: P(0, 0, 8, 8, 8), hat: P(32, 0, 8, 8, 8),
    body: P(16, 16, 8, 12, 4), jacket: P(16, 32, 8, 12, 4),
    rArm: P(40, 16, aw, 12, ad), rArmO: P(40, 32, aw, 12, ad), lArm: P(32, 48, aw, 12, ad), lArmO: P(48, 48, aw, 12, ad),
    rLeg: P(0, 16, 4, 12, 4), rLegO: P(0, 32, 4, 12, 4), lLeg: P(16, 48, 4, 12, 4), lLegO: P(0, 48, 4, 12, 4),
  };
};
// Rectangle (in skin pixels) of one face of a part. Faces are named as seen on the character: its right side is on the viewer's left.
const faceRect = (p, f) => {
  switch (f) {
    case 'front': return { x: p.u + p.d, y: p.v + p.d, w: p.w, h: p.h };
    case 'back': return { x: p.u + 2 * p.d + p.w, y: p.v + p.d, w: p.w, h: p.h };
    case 'right': return { x: p.u, y: p.v + p.d, w: p.d, h: p.h };
    case 'left': return { x: p.u + p.d + p.w, y: p.v + p.d, w: p.d, h: p.h };
    case 'top': return { x: p.u + p.d, y: p.v, w: p.w, h: p.d };
    case 'bottom': return { x: p.u + p.d + p.w, y: p.v, w: p.w, h: p.d };
  }
};
const SIDES = ['right', 'front', 'left', 'back'];
const FACES = ['right', 'front', 'left', 'back', 'top', 'bottom'];

class Skin {
  constructor(armWidth, armDepth = 4, custom) {
    this.A = custom ? custom.A : atlas(armWidth, armDepth);
    this.canvas = document.createElement('canvas'); this.canvas.width = custom ? custom.W : 64; this.canvas.height = custom ? custom.H : 64;
    this.ctx = this.canvas.getContext('2d');
  }
  // Fill a rectangle of a face (x, y relative to the face's top-left; w, h default to the rest of the face).
  fill(part, face, color, x = 0, y = 0, w, h) {
    const r = faceRect(this.A[part], face);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(r.x + x, r.y + y, w === undefined ? r.w - x : w, h === undefined ? r.h - y : h);
  }
  px(part, face, x, y, color) { this.fill(part, face, color, x, y, 1, 1); }
  all(part, color) { for (const f of FACES) this.fill(part, f, color); }
  // The four sides of a part, rows y..y+h.
  band(part, color, y, h) { for (const f of SIDES) this.fill(part, f, color, 0, y, undefined, h); }
  // Pixel art: rows of characters, each looked up in pal ('.' leaves the pixel alone).
  grid(part, face, rows, pal, ox = 0, oy = 0) {
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const c = row[i]; if (c !== '.' && pal[c]) this.px(part, face, ox + i, oy + j, pal[c]); } });
  }
  // A little deterministic grain on every painted pixel (alpha untouched), so flat colours read as cloth, leather and skin.
  grain(seed, amount, skip) {
    const W = this.canvas.width, H = this.canvas.height, img = this.ctx.getImageData(0, 0, W, H), d = img.data;
    let s = seed >>> 0;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (d[i + 3] === 0 || (skip && skip.some(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h))) continue;
      const k = (rnd() - 0.5) * 2 * amount;
      d[i] = Math.max(0, Math.min(255, d[i] + k)); d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + k)); d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + k));
    }
    this.ctx.putImageData(img, 0, 0);
  }
  texture() {
    const t = new THREE.CanvasTexture(this.canvas);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.encoding = THREE.sRGBEncoding;
    return t;
  }
}

// ---------------------------------------------------------------------------------------------------------------------------
// Jack, 21: lean, quick, a grin kept ready. Linen shirt under a green vest, patched brown trousers, boots.
// ---------------------------------------------------------------------------------------------------------------------------
// Jack's whole skin, painted from scratch for a state: st = { trousers: 'up'|'down', drawers: 'up'|'down', marks: { L, R } (0–1), expr: 0–3 }.
// (Cheap: 64x64 pixels. The lap scene repaints it as the clothes change, the marks come up and the face reacts.)
const JACK_FACES = [
  ['SbbSSbbS', 'SWESSEWS', 'SSSnnSSS', 'SsMTTMsS', 'SuuSSuuS'],   // 0 the grin kept ready
  ['SbbSSbbS', 'SlESSElS', 'SSSnnSSS', 'SsMMMMsS', 'SuuSSuuS'],   // 1 wincing
  ['SddSSddS', 'SddSSddS', 'SsSnnSsS', 'SMTTTTMS', 'SuuSSuuS'],   // 2 eyes screwed shut, teeth gritted
  ['SddSSddS', 'SddSSddS', 'SSSnnSSS', 'SMmmmmMS', 'SuMmmMuS'],   // 3 crying out
];
function paintJackInto(k, st) {
  st = Object.assign({ trousers: 'up', drawers: 'up', marks: { L: 0, R: 0 }, expr: 0 }, st);
  k.ctx.clearRect(0, 0, 64, 64);
  const C = { skin: '#e2b58f', skinSh: '#c99874', skinHi: '#eec7a2', seat: '#ebc4a0',
    hair: '#7a4a22', hairHi: '#9a6532', hairDk: '#5c3517', brow: '#5c3517', white: '#f2f0ea', iris: '#3f7f4a', lid: '#b98a68', lip: '#b4685a', teeth: '#f6f2ea', stub: '#c19170', mouth: '#6a2a2a',
    linen: '#e8dfc4', linenSh: '#cfc4a6', vest: '#4b7a3a', vestDk: '#375c2a', belt: '#4a3220', buckle: '#d6b24a', pouch: '#6b4a2a',
    trousers: '#6d5233', trousersDk: '#59422a', patch: '#8b7048', stitch: '#4a3820', boot: '#3a2616', bootHi: '#5a3d24', sole: '#22160c', lace: '#b8a070',
    drawers: '#e6dcc2', drawersSh: '#cbbf9f' };
  const pal = { H: C.hair, h: C.hairHi, d: C.brow, S: C.skin, s: C.skinSh, b: C.brow, W: C.white, E: C.iris, l: C.lid, M: C.lip, T: C.teeth, u: C.stub, n: C.skinSh, k: C.skinHi, m: C.mouth };
  const down = st.trousers === 'down', drawersDown = st.drawers === 'down';

  // Head: skin all over, then hair; the face from the current expression.
  k.all('head', C.skin);
  const F = JACK_FACES[Math.max(0, Math.min(3, st.expr | 0))];
  k.grid('head', 'front', ['HHHHHHHH', 'HhHHdHhH', 'HSSkHSSH', ...F], pal);
  if ((st.expr | 0) === 0) k.px('head', 'front', 1, 4, C.white);
  k.fill('head', 'top', C.hair);
  k.fill('head', 'back', C.hair); k.fill('head', 'back', C.hairDk, 0, 6, undefined, 2);
  for (const f of ['right', 'left']) { k.fill('head', f, C.skin); k.fill('head', f, C.hair, 0, 0, undefined, 3); }
  k.fill('head', 'right', C.hair, 0, 3, 3, 3); k.fill('head', 'left', C.hair, 5, 3, 3, 3);
  k.fill('head', 'right', C.skinSh, 4, 4, 1, 2); k.fill('head', 'left', C.skinSh, 3, 4, 1, 2);
  k.fill('head', 'right', C.hair, 7, 3, 1, 2); k.fill('head', 'left', C.hair, 0, 3, 1, 2);
  k.fill('head', 'bottom', C.skinSh);
  // Hat layer: the thicker hair, with a swept fringe and a tuft.
  k.fill('hat', 'top', C.hair); k.px('hat', 'top', 2, 1, C.hairHi); k.px('hat', 'top', 5, 3, C.hairHi); k.px('hat', 'top', 3, 6, C.hairDk); k.px('hat', 'top', 6, 5, C.hairHi);
  k.fill('hat', 'back', C.hair, 0, 0, undefined, 6); k.fill('hat', 'back', C.hairDk, 0, 5, undefined, 1); k.px('hat', 'back', 2, 2, C.hairHi); k.px('hat', 'back', 5, 3, C.hairHi);
  k.fill('hat', 'right', C.hair, 0, 0, undefined, 3); k.fill('hat', 'right', C.hair, 0, 3, 3, 3); k.fill('hat', 'left', C.hair, 0, 0, undefined, 3); k.fill('hat', 'left', C.hair, 5, 3, 3, 3);
  k.grid('hat', 'front', ['HHhHHHHH', 'H.H..hH.', '.......H'], { H: C.hair, h: C.hairHi });
  k.px('hat', 'front', 7, 1, C.hairDk);

  // Torso: linen shirt, laced at the throat, the green vest over it.
  k.all('body', C.linen);
  k.grid('body', 'front', [
    'vSLLLLSv', 'vvLlLlvv', 'vvvLLvvv', 'vvvvvvvv', 'vvvvvvvv', 'vvvvvvvv', 'vvvvvvvv', 'vvvvvvvv', 'vvvvvvvv', '........', '........', '........' ],
    { v: C.vest, L: C.linen, l: C.linenSh, S: C.skin });
  k.fill('body', 'front', C.linen, 3, 3, 2, 6); k.fill('body', 'front', C.linenSh, 3, 3, 1, 6);
  k.fill('body', 'front', C.vestDk, 2, 3, 1, 6); k.fill('body', 'front', C.vestDk, 5, 3, 1, 6);
  for (let y = 4; y < 9; y += 2) { k.px('body', 'front', 3, y, C.stitch); k.px('body', 'front', 4, y, C.stitch); }
  k.fill('body', 'back', C.vest, 0, 0, undefined, 9); k.fill('body', 'back', C.vestDk, 3, 0, 2, 9);
  k.fill('body', 'right', C.linen, 0, 0, undefined, 9); k.fill('body', 'left', C.linen, 0, 0, undefined, 9);
  k.fill('body', 'right', C.vest, 0, 3, undefined, 6); k.fill('body', 'left', C.vest, 0, 3, undefined, 6);
  k.fill('body', 'top', C.linen);
  // The shirt-tail stays on the torso whatever is up or down. The seat (the glutes block in the lap pose) and the upper thighs take the colour of
  // the trousers, drawers or bare skin; bare rows on the legs are remembered (with their cheek) so the marks can be laid on afterwards.
  const bare = [];
  const colourOf = w => w === 'skin' ? C.seat : w === 'drawers' ? C.drawers : C.trousers;
  // Outer layer: the belt, buckle and a pouch on the hip while the trousers are up; the vest's collar standing off the shoulders always.
  if (!down) {
    for (const f of SIDES) k.fill('jacket', f, C.belt, 0, 8, undefined, 2);
    k.fill('jacket', 'front', C.buckle, 3, 8, 2, 2); k.px('jacket', 'front', 3, 8, '#f0d878'); k.px('jacket', 'front', 4, 9, '#a8872c');
    k.fill('jacket', 'left', C.pouch, 1, 9, 2, 2); k.fill('jacket', 'left', C.belt, 1, 9, 2, 1);
  }
  k.fill('jacket', 'front', C.vest, 0, 0, 2, 1); k.fill('jacket', 'front', C.vest, 6, 0, 2, 1); k.fill('jacket', 'back', C.vest, 0, 0, undefined, 1);

  // Arms: short linen sleeves rolled over the elbow, a leather wrist-wrap, bare forearm and hand.
  for (const side of ['rArm', 'lArm']) {
    k.all(side, C.skin);
    k.band(side, C.linen, 0, 5); k.band(side, C.linenSh, 5, 1); k.fill(side, 'top', C.linen); k.fill(side, 'bottom', C.skinSh);
    k.band(side, C.belt, 8, 2); k.band(side, C.skinHi, 6, 1);
    for (const f of SIDES) { k.px(side, f, 0, 7, C.skinSh); k.px(side, f, 0, 11, C.skinSh); }
    k.band(sideOuter(side), C.vest, 0, 2);
  }
  k.px('rArm', 'front', 2, 10, C.skinSh); k.px('lArm', 'front', 1, 11, C.skinSh);

  // Legs. Standing straight, the trousers run down to the boots. Pulled down they bunch at the knee (rows 4-5, with a band over the joint, see
  // buildCharacter), and the thigh above shows drawers; with the drawers down too, the thigh is bare to row 1 and they bunch on rows 2-3.
  const legRow = r => !down ? 'trousers' : r >= 4 ? 'trousers' : !drawersDown ? 'drawers' : r < 2 ? 'skin' : 'drawers';
  for (const [leg, cheek] of [['rLeg', 'R'], ['lLeg', 'L']]) {
    k.all(leg, C.trousers);
    k.band(leg, C.trousersDk, 6, 1); k.fill(leg, 'bottom', C.sole); k.fill(leg, 'top', C.trousersDk);
    k.band(leg, C.boot, 8, 4); k.band(leg, C.bootHi, 8, 1); k.band(leg, C.sole, 11, 1);
    k.fill(leg, 'front', C.patch, 1, 2, 2, 2); k.px(leg, 'front', 1, 2, C.stitch); k.px(leg, 'front', 2, 3, C.stitch);
    k.px(leg, 'front', 1, 9, C.lace); k.px(leg, 'front', 2, 10, C.lace); k.px(leg, 'front', 2, 9, C.bootHi); k.px(leg, 'front', 1, 10, C.bootHi);
    if (down) {
      for (let r = 0; r < 4; r++) {
        const w = legRow(r);
        for (const f of SIDES) k.fill(leg, f, colourOf(w), 0, r, undefined, 1);
        if (w === 'skin') bare.push([leg, 'back', 0, r, 4, 1, cheek]);
      }
      for (const f of SIDES) k.fill(leg, f, C.trousersDk, 0, 5, undefined, 1);
      k.fill(leg, 'top', C.seat);
      if (drawersDown) for (const f of SIDES) k.fill(leg, f, C.drawersSh, 0, 3, undefined, 1);
    }
  }
  k.grain(1021, 5, [{ x: 8, y: 8, w: 8, h: 8 }]);
  // Marks: the bare rear colours up, patchy at first. Each bare pixel gets a share of its cheek's mark, jittered by position.
  for (const [part, face, x, y, w, h, cheek] of bare) markRect(k, part, face, x, y, w, h, cheek, st.marks);
  return k;
}
// Lay a cheek's mark over a rectangle of bare skin: patchy at first, evening out as it deepens.
function markRect(k, part, face, x, y, w, h, cheek, marks) {
  const m = marks && marks[cheek] || 0; if (m <= 0.01) return;
  const r = faceRect(k.A[part], face);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const hsh = (((x + i) * 73856093) ^ ((y + j) * 19349663) ^ (cheek === 'L' ? 83492791 : 0)) >>> 0, jit = 0.6 + 0.8 * ((hsh % 1000) / 1000);
    k.ctx.fillStyle = `rgba(186,48,44,${Math.min(0.85, 0.7 * m * jit)})`;
    k.ctx.fillRect(r.x + x + i, r.y + y + j, 1, 1);
  }
}
// The glutes: a block that fills the gap at the hips when the legs fold forward in the lap pose. Its own small skin (24x8, the layout of an
// 8x4x4 box), painted to match what Jack has on there: trousers, drawers or bare skin (with the marks).
const GLUTES = { u: 0, v: 0, w: 8, h: 4, d: 4 };
function paintGlutesInto(g, st) {
  st = Object.assign({ trousers: 'up', drawers: 'up', marks: { L: 0, R: 0 } }, st);
  const what = st.trousers === 'up' ? 'trousers' : st.drawers === 'up' ? 'drawers' : 'skin';
  const base = { trousers: '#6d5233', drawers: '#e6dcc2', skin: '#ebc4a0' }[what], seam = { trousers: '#59422a', drawers: '#cbbf9f', skin: '#c99874' }[what];
  g.ctx.clearRect(0, 0, 24, 8);
  g.all('glutes', base);
  g.fill('glutes', 'back', seam, 3, 0, 2, 4); g.fill('glutes', 'bottom', seam, 3, 0, 2, 4);
  if (what === 'trousers') { g.fill('glutes', 'back', '#8b7048', 0, 1, 2, 2); g.px('glutes', 'back', 0, 1, '#4a3820'); }
  g.grain(5031, 5);
  if (what === 'skin') {
    // Every side of the block takes the colour: the back, front, bottom and top by cheek (left half, right half), the ends each their own cheek.
    for (const f of ['back', 'front', 'bottom', 'top']) { markRect(g, 'glutes', f, 0, 0, 4, f === 'back' || f === 'front' ? 4 : 4, 'L', st.marks); markRect(g, 'glutes', f, 4, 0, 4, 4, 'R', st.marks); }
    markRect(g, 'glutes', 'left', 0, 0, 4, 4, 'L', st.marks); markRect(g, 'glutes', 'right', 0, 0, 4, 4, 'R', st.marks);
  }
  return g;
}
function makeGlutes() {
  const g = new Skin(3, 3, { W: 24, H: 8, A: { glutes: GLUTES } }), tex = g.texture();
  const mesh = new THREE.Mesh(boxGeo(GLUTES, 0.15, 0, 4, 24, 8), new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5 }));
  paintGlutesInto(g, {}); tex.needsUpdate = true;
  return { mesh, skin: g, tex };
}
function paintJack(st) { return paintJackInto(new Skin(3, 3), st); }
const sideOuter = s => s + 'O';

// ---------------------------------------------------------------------------------------------------------------------------
// Gerda, late thirties: broad-shouldered, practical, laughs easily and means what she says. A plum bodice laced over a blouse,
// a cream apron and a full skirt, wool stockings and boots; auburn hair going grey at the temple, pinned up in a bun.
// ---------------------------------------------------------------------------------------------------------------------------
function paintGerda() {
  const k = new Skin(3, 3);
  const C = { skin: '#ecc3a0', skinSh: '#d3a584', skinHi: '#f3d0b0', line: '#dcae8c',
    hair: '#8a3a1e', hairHi: '#a8502a', hairDk: '#64280f', grey: '#a39a90', brow: '#6a2e16', white: '#f2f0ea', iris: '#5f7f95', lid: '#c79876', lip: '#a8525a', lipDk: '#8a3038', teeth: '#f6f2ea',
    blouse: '#ece6d6', blouseSh: '#cfc7b4', plum: '#7a2a3a', plumDk: '#5c1e2c', plumHi: '#923a4c', lace: '#e6d7b0', belt: '#4a3220', apron: '#e9dfc8', apronSh: '#cdc2a8', pocket: '#d8ccb0',
    stocking: '#d8cdb4', stockingSh: '#bfb398', boot: '#4a2f1c', bootHi: '#6a4528', sole: '#22160c', ring: '#e6c24a', trim: '#c9a84c' };
  const pal = { H: C.hair, h: C.hairHi, d: C.hairDk, g: C.grey, S: C.skin, s: C.skinSh, t: C.line, b: C.brow, W: C.white, E: C.iris, M: C.lip, m: C.lipDk, n: C.skinSh, k: C.skinHi };

  k.all('head', C.skin);
  k.grid('head', 'front', [
    'HHHHHHHH',
    'HHgHHhHH',
    'HSSSSSSH',
    'HbbSsbbH',
    'HWESSEWH',
    'HsSnnSsH',
    'StMMMMtS',
    'SSSsSSSS' ], pal);
  k.fill('head', 'top', C.hair); k.fill('head', 'back', C.hair);
  for (const f of ['right', 'left']) { k.fill('head', f, C.skin); k.fill('head', f, C.hair, 0, 0, undefined, 3); }
  k.fill('head', 'right', C.hair, 0, 3, 3, 4); k.fill('head', 'left', C.hair, 5, 3, 3, 4);
  k.fill('head', 'right', C.hair, 7, 3, 1, 3); k.fill('head', 'left', C.hair, 0, 3, 1, 3);
  k.fill('head', 'right', C.skinSh, 4, 4, 1, 2); k.fill('head', 'left', C.skinSh, 3, 4, 1, 2);
  k.px('head', 'right', 4, 6, C.ring); k.px('head', 'left', 3, 6, C.ring); // small gold earrings
  k.fill('head', 'bottom', C.skinSh);
  // Hat layer: the hair swept back and pinned, falling past the jaw behind the ears; a grey streak at the temple.
  k.fill('hat', 'top', C.hair); k.grid('hat', 'top', ['.h..h...', '..h..h..', '.h..h..h', 'h..h..h.', '..h..h..', 'h...h...'], { h: C.hairHi }, 0, 1);
  k.px('hat', 'top', 2, 0, C.grey); k.px('hat', 'top', 3, 1, C.grey); k.px('hat', 'top', 4, 2, C.grey);
  k.fill('hat', 'back', C.hair, 0, 0, undefined, 7); k.fill('hat', 'back', C.hairDk, 0, 6, undefined, 1); k.px('hat', 'back', 3, 2, C.hairHi); k.px('hat', 'back', 4, 4, C.hairHi);
  for (const f of ['right', 'left']) { k.fill('hat', f, C.hair, 0, 0, undefined, 3); }
  k.fill('hat', 'right', C.hair, 0, 3, 3, 4); k.fill('hat', 'left', C.hair, 5, 3, 3, 4);
  k.grid('hat', 'front', ['HHHHHHHH', 'HHgHH.HH', 'H......H'], { H: C.hair, g: C.grey });
  k.px('hat', 'front', 1, 1, C.grey);

  // Torso: blouse at the throat, plum bodice laced up the front, a belt, then the skirt's waist.
  k.all('body', C.plum);
  k.grid('body', 'front', [
    'WWSSSSWW', 'WWWSSWWW', 'pppcPpPp', 'ppppccpp', 'pppcPcpp', 'ppppccpp', 'pppcPcpp', 'pppppppp', 'dddddddd', 'pppppppp', 'pppppppp', 'pppppppp' ],
    { W: C.blouse, S: C.skin, p: C.plum, P: C.plumDk, c: C.lace, d: C.belt });
  k.grid('body', 'front', ['..hh..hh', '........'], { h: C.plumHi }, 0, 2);
  k.fill('body', 'back', C.plum); k.fill('body', 'back', C.blouse, 0, 0, undefined, 2); k.fill('body', 'back', C.plumDk, 3, 2, 2, 5); k.fill('body', 'back', C.belt, 0, 8, undefined, 1);
  k.fill('body', 'right', C.plum); k.fill('body', 'left', C.plum); k.fill('body', 'right', C.blouse, 0, 0, undefined, 2); k.fill('body', 'left', C.blouse, 0, 0, undefined, 2);
  k.fill('body', 'right', C.belt, 0, 8, undefined, 1); k.fill('body', 'left', C.belt, 0, 8, undefined, 1);
  k.fill('body', 'top', C.blouse); k.fill('body', 'bottom', C.plumDk);
  // Outer layer: the cream apron (with its pocket and strings) and the skirt flaring off the hip.
  k.fill('jacket', 'front', C.apron, 1, 5, 6, 7); k.fill('jacket', 'front', C.apronSh, 1, 5, 6, 1);
  k.fill('jacket', 'front', C.pocket, 2, 8, 4, 2); k.fill('jacket', 'front', C.apronSh, 2, 8, 4, 1); k.px('jacket', 'front', 2, 9, C.apronSh); k.px('jacket', 'front', 5, 9, C.apronSh);
  k.fill('jacket', 'front', C.trim, 1, 11, 6, 1);
  k.fill('jacket', 'front', C.apron, 3, 4, 2, 1); k.px('jacket', 'front', 3, 3, C.apron); k.px('jacket', 'front', 4, 3, C.apron);
  for (const f of ['right', 'left', 'back']) { k.fill('jacket', f, C.plum, 0, 8, undefined, 4); k.fill('jacket', f, C.plumDk, 0, 11, undefined, 1); }
  k.fill('jacket', 'back', C.apronSh, 2, 6, 4, 1); k.px('jacket', 'back', 1, 7, C.apron); k.px('jacket', 'back', 6, 7, C.apron); // apron strings tied behind
  k.fill('jacket', 'front', C.plum, 0, 8, 1, 4); k.fill('jacket', 'front', C.plum, 7, 8, 1, 4);

  // Arms (slim): blouse sleeves rolled above the elbow, strong forearms, a wedding ring on the left hand.
  for (const side of ['rArm', 'lArm']) {
    k.all(side, C.skin);
    k.band(side, C.blouse, 0, 5); k.band(side, C.blouseSh, 5, 1); k.fill(side, 'top', C.blouse); k.fill(side, 'bottom', C.skinSh);
    k.band(side, C.skinHi, 6, 1); k.band(side, C.skinSh, 9, 1);
  }
  k.px('lArm', 'front', 1, 10, C.ring); k.px('lArm', 'left', 1, 10, C.ring);

  // Legs: the skirt's overlay covers the thigh to the knee; wool stockings beneath, laced boots.
  for (const leg of ['rLeg', 'lLeg']) {
    k.all(leg, C.stocking);
    k.band(leg, C.stockingSh, 6, 1); k.fill(leg, 'top', C.plumDk); k.fill(leg, 'bottom', C.sole);
    k.band(leg, C.boot, 8, 4); k.band(leg, C.bootHi, 8, 1); k.band(leg, C.sole, 11, 1);
    k.px(leg, 'front', 1, 9, C.lace); k.px(leg, 'front', 2, 10, C.lace); k.px(leg, 'front', 2, 9, C.bootHi); k.px(leg, 'front', 1, 10, C.bootHi);
    const o = sideOuter(leg);
    for (const f of SIDES) { k.fill(o, f, C.plum, 0, 0, undefined, 6); k.fill(o, f, C.plumDk, 0, 5, undefined, 1); k.px(o, f, 1, 2, C.plumHi); }
    k.fill(o, 'front', C.trim, 0, 4, undefined, 1);
  }
  k.grain(2077, 5, [{ x: 8, y: 8, w: 8, h: 8 }]);
  return k;
}

// ---------------------------------------------------------------------------------------------------------------------------
// Geometry: a box whose faces read from the skin atlas. A leg is two of these (rows y0..y1 of the same leg), so the skin runs on
// unbroken across the knee. Faces that fall inside the joint are given one flat texel of the leg's own colour.
// ---------------------------------------------------------------------------------------------------------------------------
function boxGeo(part, pad, y0, y1, W = 64, H = 64) {
  const w = part.w, d = part.d;
  const g = new THREE.BoxGeometry(w + 2 * pad, (y1 - y0) + 2 * pad, d + 2 * pad);
  const uv = g.attributes.uv;
  const rect = (face, x0, ya, x1, yb) => {
    const i = face * 4;
    uv.setXY(i, x0 / W, 1 - ya / H); uv.setXY(i + 1, x1 / W, 1 - ya / H);
    uv.setXY(i + 2, x0 / W, 1 - yb / H); uv.setXY(i + 3, x1 / W, 1 - yb / H);
  };
  const texel = (face, sx, sy) => { for (let k = 0; k < 4; k++) uv.setXY(face * 4 + k, (sx + 0.5) / W, 1 - (sy + 0.5) / H); };
  const side = (face, f) => { const r = faceRect(part, f); rect(face, r.x, r.y + y0, r.x + r.w, r.y + y1); };
  side(0, 'left'); side(1, 'right'); side(4, 'front'); side(5, 'back');
  const fr = faceRect(part, 'front'), tp = faceRect(part, 'top'), bt = faceRect(part, 'bottom');
  if (y0 === 0) rect(2, tp.x, tp.y, tp.x + tp.w, tp.y + tp.h); else texel(2, fr.x + (fr.w >> 1), fr.y + y0);
  if (y1 === part.h) rect(3, bt.x, bt.y, bt.x + bt.w, bt.y + bt.h); else texel(3, fr.x + (fr.w >> 1), fr.y + y1 - 1);
  return g;
}

// ---------------------------------------------------------------------------------------------------------------------------
// The rig.
// ---------------------------------------------------------------------------------------------------------------------------
const POSES = {
  stand: { hipY: 12, lift: 0, thighX: 0, shinX: 0, spread: 0.02, armX: 0, armIn: -0.04, forearm: 0, headX: 0 },
  sit:   { hipY: 6,  lift: -2, thighX: -Math.PI / 2, shinX: Math.PI / 2, spread: 0.06, armX: -0.8, armIn: 0.14, forearm: 0, headX: 0.08 },
};

// opts: { skin, armWidth, hair:{bun}, lap }  Everything is in skin pixels (1 unit = 1 pixel); a standing figure is 32 tall.
function buildCharacter(skin, opts) {
  const aw = opts.armWidth, A = skin.A;
  const tex = skin.texture();
  const mat = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.FrontSide });
  const root = new THREE.Group();
  const hips = new THREE.Group(); root.add(hips);
  const rig = { root, hips, state: Object.assign({}, POSES.stand), target: Object.assign({}, POSES.stand), skin };

  const mesh = (part, outer, pad, y0 = 0, y1 = A[part].h) => {
    const m = new THREE.Mesh(boxGeo(A[part], 0, y0, y1), mat);
    const g = new THREE.Group(); g.add(m);
    if (outer) { const o = new THREE.Mesh(boxGeo(A[outer], pad, y0, y1), mat); g.add(o); }
    return g;
  };

  // Torso and head.
  rig.torso = new THREE.Group(); hips.add(rig.torso);
  const torsoMesh = mesh('body', 'jacket', 0.5); torsoMesh.position.y = 6; rig.torso.add(torsoMesh);
  rig.neck = new THREE.Group(); rig.neck.position.y = 12; rig.torso.add(rig.neck);
  const headMesh = mesh('head', 'hat', 1); headMesh.position.y = 4; rig.neck.add(headMesh);
  if (opts.bun) {
    const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d');
    const cols = ['#8a3a1e', '#a8502a', '#64280f', '#8a3a1e', '#b9b0a6'];
    let s = 7; for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { s = (s * 1103515245 + 12345) >>> 0; const r = (s >> 16) % 12; x.fillStyle = r < 6 ? cols[0] : r < 9 ? cols[1] : r < 11 ? cols[2] : (j % 4 === 0 ? cols[4] : cols[3]); x.fillRect(i, j, 1, 1); }
    const bt = new THREE.CanvasTexture(c); bt.magFilter = bt.minFilter = THREE.NearestFilter; bt.generateMipmaps = false; bt.encoding = THREE.sRGBEncoding;
    const bun = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 4), new THREE.MeshLambertMaterial({ map: bt }));
    bun.position.set(0, 5.5, -5.6); rig.neck.add(bun);
    const pin = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 5), new THREE.MeshLambertMaterial({ color: 0xc9a84c }));
    pin.position.set(2.2, 5.8, -5.6); pin.rotation.z = 0.3; rig.neck.add(pin);
  }

  // Arms: one box each, hung from the shoulder, as in the stock rig.
  const shoulderX = 4 + aw / 2;
  for (const [key, sign, p, o] of [['armL', 1, 'lArm', 'lArmO'], ['armR', -1, 'rArm', 'rArmO']]) {
    const pivot = new THREE.Group(); pivot.position.set(sign * shoulderX, 10, 0); pivot.rotation.order = 'ZXY';
    const m = mesh(p, o, 0.5); m.position.y = -4; pivot.add(m); rig.torso.add(pivot); rig[key] = pivot; pivot.userData.sign = sign;
  }

  // Legs: thigh from the hip, shin from the knee. Standing, the two meet flush; seated, the knee shows.
  for (const [key, sign, p, o] of [['legL', 1, 'lLeg', 'lLegO'], ['legR', -1, 'rLeg', 'rLegO']]) {
    const thigh = new THREE.Group(); thigh.position.x = sign * 2; thigh.rotation.order = 'ZXY';
    const tm = mesh(p, o, opts.skirt ? 0.7 : 0.5, 0, 6); tm.position.y = -3; thigh.add(tm);
    const knee = new THREE.Group(); knee.position.y = -6; thigh.add(knee);
    const sm = mesh(p, o, 0.5, 6, 12); sm.position.y = -3; knee.add(sm);
    // The gathered trousers, once they are pulled down to the knee: a band that wraps the joint (one flat texel of the trouser colour).
    const ring = new THREE.Mesh(new THREE.BoxGeometry(5.8, 3.4, 5.8), mat), fr = faceRect(A[p], 'front'), uv = ring.geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (fr.x + 1.5) / 64, 1 - (fr.y + 6.5) / 64);
    ring.position.y = 0.4; ring.visible = false; knee.add(ring);
    hips.add(thigh); rig[key] = { thigh, knee, sign, ring };
  }
  rig.apply = apply; rig.tex = tex;
  apply.call(rig);
  return rig;
}

function apply() {
  const s = this.state;
  this.hips.position.y = s.hipY;
  this.torso.position.y = s.lift;
  this.neck.rotation.x = s.headX;
  for (const k of ['armL', 'armR']) {
    const a = this[k], sg = a.userData.sign;
    a.rotation.x = s.armX; a.rotation.z = -sg * s.armIn;
  }
  for (const k of ['legL', 'legR']) {
    const l = this[k];
    l.thigh.rotation.x = s.thighX; l.thigh.rotation.z = l.sign * s.spread; l.knee.rotation.x = s.shinX;
  }
  if (this.after) this.after(this);   // a scene's own additions to the pose (the lap scene's swing and kicks)
}

function setPose(rig, name) { rig.target = Object.assign({}, POSES[name]); rig.pose = name; }
function step(rig, dt) {
  const k = Math.min(1, dt * 9);
  for (const key in rig.target) rig.state[key] += (rig.target[key] - rig.state[key]) * k;
  rig.apply();
}

const makeJack = () => buildCharacter(paintJack(), { armWidth: 3 });
const makeGerda = () => buildCharacter(paintGerda(), { armWidth: 3, bun: true, skirt: true });

root.Blocky = { makeJack, makeGerda, setPose, step, POSES, Skin, paintJackInto, paintGlutesInto, makeGlutes, boxGeo, faceRect };
})(typeof window !== 'undefined' ? window : globalThis);

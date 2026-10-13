// Climbing Toward Consequence — the screens around the story: the content notice, the title, settings, the end card; and the saved game.
(function (root) {
'use strict';
const $ = id => document.getElementById(id), A = root.GameAudio;
const G = root.Game.create({ stage: $('stage'), fade: $('fade'), subs: $('subs'), subWho: $('subWho'), subText: $('subText') });
root.__game = G;
let W = G.worlds = root.Opening.build(G); W.market = root.Market.build(G, W);
const rebuildWorlds = () => { W = G.worlds = root.Opening.build(G); W.market = root.Market.build(G, W); };
const show = id => document.querySelectorAll('.screen').forEach(s => { if (s.id === id) s.classList.add('on'); else if (s.id !== 'dev') s.classList.remove('on'); });
const hideAll = () => { document.body.classList.remove('titlePic'); document.querySelectorAll('.screen').forEach(s => { if (s.id !== 'dev') s.classList.remove('on'); }); };
$('dev').style.display = 'block';

// The drone view is behind everything, from the first frame.
G.setScene(W.ext); G.drone = root.Opening.DRONE; G.mode = 'title';

const snap = (world, drone) => G.snapshotFarm(world, drone || root.Opening.DRONE);
const STALK_VIEW = () => root.Chapter3.STALK_VIEW();
const toTitle = () => {
  G.mode = 'title'; G.setScene(W.ext); G.drone = root.Opening.DRONE; G.skipping = false; G.hideLine(); document.body.classList.remove('cutscene');
  $('fade').style.transition = 'opacity .8s ease'; $('fade').style.opacity = 0;
  $('bContinue').disabled = !G.loadSave(); show('title');
  { const shot = G.memShot || (G.loadSave() && G.titleShot()); $('titleShot').style.backgroundImage = shot ? 'url(' + shot + ')' : ''; document.body.classList.toggle('titlePic', !!shot); }
  if (A && A.ctx) { A.ambience({ wind: 0.5, birds: 0.5, fire: 0 }); A.duckMusic(1, 2); A.startMusic(); }
  $('dev').style.display = 'block';
};

// Notice and 18+ confirmation, remembered once given.
if (G.store.get(G.NOTICE_KEY, false)) { toTitle(); } else { G.mode = 'notice'; show('notice'); }
$('noticeYes').onclick = () => { G.store.set(G.NOTICE_KEY, true); if (A) { A.init(); A.startMusic(); A.ambience({ wind: 0.5, birds: 0.5 }); } toTitle(); };
$('noticeNo').onclick = () => { location.href = 'about:blank'; };

// Menu. (A tap here is also what lets the browser start the sound.)
const wake = () => { if (A) { A.init(); A.startMusic(); A.ambience({ wind: 0.5, birds: 0.5 }); } };
async function playOpening() {
  G.rerun = () => { rebuildWorlds(); return playOpening(); };       // (debug rewind: the opening runs again on fresh worlds)
  hideAll(); $('dev').style.display = 'none'; wake();
  await root.Opening.run(G, W);
  G.skipping = false; G.save({ step: 'market-day', opening: true, size: 0.8 }); snap(W.ext);
  await playMarket();
}
// Chapter One, Market Day (the first part): the dialogue at the cottage door, the cow to wrangle, the closing scene. (It starts from black.)
async function playMarket() {
  G.rerun = null;
  hideAll(); $('dev').style.display = 'none'; wake(); G.mode = 'cutscene';
  $('fade').style.transition = 'none'; $('fade').style.opacity = 1; await new Promise(r => setTimeout(r, 60));
  const res = await root.Market.run(G, W, W.market);
  G.skipping = false; G.save({ step: 'market-road', care: { cowStartles: res ? res.startles : 0 } }); snap(W.ext);
  await playRoad();
}
// Chapter One, Market Day (the road): the winding road, the obstacles, the Peddler's cart and the trade. (It starts from black.)
async function playRoad(opts) {
  G.rerun = null;
  hideAll(); $('dev').style.display = 'none'; wake(); G.mode = 'cutscene';
  $('fade').style.transition = 'none'; $('fade').style.opacity = 1; await new Promise(r => setTimeout(r, 60));
  const res = await root.Road.run(G, opts);
  G.skipping = false; G.save({ step: 'beans', care: Object.assign((G.loadSave() || {}).care || {}, { runSecs: res.runSecs, soothes: res.soothes, plants: res.plants }), choices: res.choices }); snap(W.ext);
  await playNight(res.choices);
}
// The close of Chapter One: the cottage at night (Jack's account, his Mother's reply). The choices he made at the cart set how it goes.
async function playNight(choices) {
  G.rerun = () => playNight(choices);
  hideAll(); $('dev').style.display = 'none'; wake(); G.mode = 'cutscene';
  $('fade').style.transition = 'none'; $('fade').style.opacity = 1; await new Promise(r => setTimeout(r, 60));
  const res = await root.Night.run(G, choices);
  G.skipping = false; G.save({ step: 'planted', night: { tier: res.tier, brash: res.brash } }); snap(res.world.world);
  if (root.Correction && res.world) await root.Correction.run(G, res.world, res.tier);
  if (root.Garden && res.world) { G.save({ step: 'garden', night: { tier: res.tier, brash: res.brash } }); await root.Garden.run(G, res.world, res.tier); G.save({ step: 'garden-done' }); snap(res.world.world); }
  if (root.Chapter3 && res.world) { await root.Chapter3.run(G, res.world); G.save({ step: 'beanstalk' }); snap(res.world.world, STALK_VIEW); if (root.Climb) { await root.Climb.run(G, res.world); G.save({ step: 'climb-done' }); } }
  showEnd();
}
// Debug: the correction on its own, with Jack standing before his Mother as the night scene leaves him.
async function playCorrection(tier) {
  hideAll(); $('dev').style.display = 'none'; wake(); G.mode = 'cutscene';
  const W = root.Night.build(G), SEAT = W.SEAT;
  W.jackIn.root.position.set(SEAT.x + 16 * Math.sin(SEAT.ry), 0, SEAT.z + 16 * Math.cos(SEAT.ry)); W.jackIn.root.rotation.y = SEAT.ry + Math.PI; W.jackIn.root.visible = true;
  $('fade').style.transition = 'none'; $('fade').style.opacity = 0;
  await root.Correction.run(G, W, tier);
  showEnd();
}
// Debug: the gardening on its own, by night, with the beans in Jack's pocket.
async function playGarden(tier) {
  hideAll(); $('dev').style.display = 'none'; wake(); G.mode = 'cutscene';
  const W = root.Night.build(G); $('fade').style.transition = 'none'; $('fade').style.opacity = 1; await new Promise(r => setTimeout(r, 60)); $('fade').style.transition = '';
  await root.Garden.run(G, W, tier);
  showEnd();
}
// Chapter Two, The Climb: the waking cutscene, the dress-and-knife stretch (and, from here, the climb).
// Chapter Two: the climb itself, on its own (the stalk at dawn, Jack at its foot).
async function playClimb() {
  hideAll(); $('dev').style.display = 'none'; wake(); G.mode = 'cutscene';
  const W = root.Night.build(G); $('fade').style.transition = 'none'; $('fade').style.opacity = 1; await new Promise(r => setTimeout(r, 60)); $('fade').style.transition = '';
  W.jackOut.root.visible = true; W.jackOut.root.position.set(CLIMB_BASE.x, 0, CLIMB_BASE.z);
  await root.Climb.run(G, W); G.save({ step: 'climb-done' });
  showEnd();
}
const CLIMB_BASE = { x: 0, z: 0 };
async function playChapter3(only) {
  hideAll(); $('dev').style.display = 'none'; wake(); G.mode = 'cutscene';
  const W = root.Night.build(G); $('fade').style.transition = 'none'; $('fade').style.opacity = 1; await new Promise(r => setTimeout(r, 60)); $('fade').style.transition = '';
  await root.Chapter3.run(G, W, only ? { only } : null); G.save({ step: 'beanstalk' }); snap(W.world, STALK_VIEW);
  if (root.Climb) { await root.Climb.run(G, W); G.save({ step: 'climb-done' }); }
  showEnd();
}
function showEnd() {
  const s = G.loadSave() || {}, two = ['dress', 'beanstalk', 'climb', 'climb-done'].includes(s.step), beans = ['beans', 'planted', 'garden', 'garden-done'].includes(s.step);
  $('endTitle').textContent = two ? 'Chapter Two \u2014 The Climb' : 'Chapter One \u2014 Market Day';
  $('endText').textContent = s.step === 'climb-done' ? 'Jack has climbed through the clouds.' : s.step === 'dress' ? 'Jack is awake in the dawn, with a beanstalk outside.' : s.step === 'beanstalk' ? 'A beanstalk has grown in the night, and Jack means to climb it.' : s.step === 'garden-done' ? 'The beans are in the ground, and Jack is indoors.' : s.step === 'planted' ? 'Jack goes out into the dark to plant the beans.' : beans ? 'Jack has the beans, and a mother waiting up for him.' : 'Jack has a cow to sell in the morning.';
  show('endcard'); G.mode = 'end'; $('fade').style.transition = 'none'; $('fade').style.opacity = 0; document.body.classList.remove('playing', 'cutscene');
}
// Level select (debug): plays from a chapter without touching the saved game.
$('levelSel').onchange = async () => {
  const k = $('levelSel').value; $('levelSel').value = ''; if (!k) return; G.noSave = true; G.debugCtl = true;
  try {
    if (k === 'opening') await playOpening();
    else if (k === 'market') await playMarket();
    else if (k === 'road') await playRoad();
    else if (k === 'cart') await playRoad({ cart: true });
    else if (k === 'nightH') await playNight([2, 1, 2]);
    else if (k === 'nightC') await playNight([1, 0, 1]);
    else if (k === 'nightB') await playNight([0, 2, 0]);
    else if (k === 'gardenH' || k === 'gardenC' || k === 'gardenB') await playGarden(k === 'gardenH' ? 0 : k === 'gardenC' ? 1 : 2);
    else if (k === 'ch3') await playChapter3();
    else if (k === 'ch3d') await playChapter3('dress');
    else if (k === 'climb') await playClimb();
    else if (k === 'corrH' || k === 'corrC' || k === 'corrB') await playCorrection(k === 'corrH' ? 0 : k === 'corrC' ? 1 : 2);
  } finally { G.noSave = false; G.debugCtl = false; }
};
// Debug controls over a cutscene (shown for scenes started from the level select, or with ?debug): pause / play, back to the previous beat, on to the next.
if (/[?&]debug\b/.test(location.search)) G.debugCtl = true;
$('dbgBack').onclick = () => G.rewind(); $('dbgPlay').onclick = () => G.pause(); $('dbgFwd').onclick = () => G.forward();
setInterval(() => { const on = G.debugCtl && G.mode === 'cutscene'; document.body.classList.toggle('dbg', on); if (on) { $('dbgPlay').textContent = G.paused ? '\u25B6' : '\u275A\u275A'; $('dbgBack').disabled = !G.rerun; $('dbgInfo').textContent = 'beat ' + G.beat + (G.seekTo != null ? ' \u2192 ' + G.seekTo : ''); } }, 150);
$('bNew').onclick = () => { G.noSave = false; if (G.loadSave() && !confirm('Start a new game? Your saved game will be replaced.')) return; G.clearSave(); playOpening(); };
$('bContinue').onclick = () => { G.noSave = false; wake(); const sv = G.loadSave() || {}; if (sv.step === 'market-day') playMarket(); else if (sv.step === 'market-road') playRoad(); else if (sv.step === 'garden-done') playChapter3(); else if (sv.step === 'dress') playChapter3('dress'); else if (sv.step === 'beanstalk' || sv.step === 'climb' || sv.step === 'climb-done') playClimb(); else if (sv.step === 'beans') playNight((sv.choices) || []); else { hideAll(); showEnd(); } };
$('bSettings').onclick = () => { wake(); show('settings'); };
$('bBack').onclick = () => { G.saveSettings(); if (pmOpen()) pmBack(); else show('title'); };
$('bTitle').onclick = toTitle;
$('skip').onclick = () => { G.skipping = true; };
$('bReset').onclick = () => { if (confirm('Delete your saved game?')) { G.clearSave(); $('bContinue').disabled = true; } };

// The pause menu: the Menu button, or Escape, during anything playable. It stops the scene where it stands; its settings open in the same pop-up.
const setCard = $('settings').firstElementChild, pm = $('pmenu');
const pmOpen = () => pm.classList.contains('on');
const playable = () => !['title', 'notice', 'end'].includes(G.mode) && !document.querySelector('.screen.on:not(#dev):not(#pmenu)');
let pmWas = false;
function pmShow() { if (pmOpen() || !playable()) return; pmWas = G.paused; G.pause(true); pmBack(); pm.classList.add('on'); document.body.classList.add('pm'); }
function pmBack() { if (setCard.parentNode === pm) $('settings').appendChild(setCard); $('pmMain').style.display = ''; }
function pmHide() { pm.classList.remove('on'); document.body.classList.remove('pm'); pmBack(); if (!pmWas) G.pause(false); }
$('menuBtn').onclick = pmShow; $('pmResume').onclick = pmHide;
$('pmSettings').onclick = () => { $('pmMain').style.display = 'none'; pm.appendChild(setCard); };
$('pmTitle').onclick = () => { if (confirm('Return to the title? Your last save point is kept; progress within this scene is lost.')) location.reload(); };
root.addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (pmOpen()) { pmHide(); e.preventDefault(); } else if (playable()) { pmShow(); e.preventDefault(); } });
setInterval(() => document.body.classList.toggle('inplay', playable() && !pmOpen()), 150);

// Settings controls.
const vol = [['vMaster', 'master'], ['vMusic', 'music'], ['vSfx', 'sfx'], ['vVoice', 'voice']];
vol.forEach(([id, k]) => { const el = $(id); el.value = Math.round(A.vols[k] * 100); el.oninput = () => { A.init(); A.setVol(k, el.value / 100); if (k === 'sfx') A.thwack(0.7); if (k === 'voice') A.speak('mother', 'Stand still, Jack.', 1); }; });
$('vSpeed').value = Math.round(G.settings.speed * 100); $('vSpeed').oninput = () => { G.settings.speed = $('vSpeed').value / 100; G.saveSettings(); };
$('cAuto').checked = G.settings.auto; $('cAuto').onchange = () => { G.settings.auto = $('cAuto').checked; G.saveSettings(); };
$('cSubs').checked = G.settings.subtitles; $('cSubs').onchange = () => { G.settings.subtitles = $('cSubs').checked; G.saveSettings(); };
})(window);

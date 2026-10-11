// Climbing Toward Consequence — the screens around the story: the content notice, the title, settings, the end card; and the saved game.
(function (root) {
'use strict';
const $ = id => document.getElementById(id), A = root.GameAudio;
const G = root.Game.create({ stage: $('stage'), fade: $('fade'), subs: $('subs'), subWho: $('subWho'), subText: $('subText') });
root.__game = G;
const W = G.worlds = root.Opening.build(G); W.market = root.Market.build(G, W);
const show = id => document.querySelectorAll('.screen').forEach(s => { if (s.id === id) s.classList.add('on'); else if (s.id !== 'dev') s.classList.remove('on'); });
const hideAll = () => document.querySelectorAll('.screen').forEach(s => { if (s.id !== 'dev') s.classList.remove('on'); });
$('dev').style.display = 'block';

// The drone view is behind everything, from the first frame.
G.setScene(W.ext); G.drone = root.Opening.DRONE; G.mode = 'title';

const toTitle = () => {
  G.mode = 'title'; G.setScene(W.ext); G.drone = root.Opening.DRONE; G.skipping = false; G.hideLine(); document.body.classList.remove('cutscene');
  $('fade').style.transition = 'opacity .8s ease'; $('fade').style.opacity = 0;
  $('bContinue').disabled = !G.loadSave(); show('title');
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
  hideAll(); $('dev').style.display = 'none'; wake();
  await root.Opening.run(G, W);
  G.skipping = false; G.save({ step: 'market-day', opening: true, size: 0.8 });
  await playMarket();
}
// Chapter One: the dialogue at the cottage door, the cow to wrangle, the closing scene. (It starts from black.)
async function playMarket() {
  hideAll(); $('dev').style.display = 'none'; wake(); G.mode = 'cutscene';
  $('fade').style.transition = 'none'; $('fade').style.opacity = 1; await new Promise(r => setTimeout(r, 60));
  const res = await root.Market.run(G, W, W.market);
  G.skipping = false; G.save({ step: 'market-road', care: { cowStartles: res ? res.startles : 0 } });
  await playRoad();
}
// Chapter Two: the winding road, the obstacles, the Peddler's cart and the trade. (It starts from black.)
async function playRoad(opts) {
  hideAll(); $('dev').style.display = 'none'; wake(); G.mode = 'cutscene';
  $('fade').style.transition = 'none'; $('fade').style.opacity = 1; await new Promise(r => setTimeout(r, 60));
  const res = await root.Road.run(G, opts);
  G.skipping = false; G.save({ step: 'beans', care: Object.assign((G.loadSave() || {}).care || {}, { runSecs: res.runSecs, soothes: res.soothes, plants: res.plants }), choices: res.choices });
  showEnd();
}
function showEnd() {
  const s = G.loadSave() || {}, beans = s.step === 'beans';
  $('endTitle').textContent = beans ? 'Chapter Two \u2014 The Market Road' : 'Chapter One \u2014 Market Day';
  $('endText').textContent = beans ? 'Jack has five beans, and no cow.' : 'Jack has a cow to sell in the morning.';
  show('endcard'); G.mode = 'end'; $('fade').style.transition = 'none'; $('fade').style.opacity = 0; document.body.classList.remove('playing', 'cutscene');
}
// Level select (debug): plays from a chapter without touching the saved game.
$('levelSel').onchange = async () => {
  const k = $('levelSel').value; $('levelSel').value = ''; if (!k) return; G.noSave = true;
  try {
    if (k === 'opening') await playOpening();
    else if (k === 'market') await playMarket();
    else if (k === 'road') await playRoad();
    else if (k === 'cart') await playRoad({ cart: true });
  } finally { G.noSave = false; }
};
$('bNew').onclick = () => { G.noSave = false; if (G.loadSave() && !confirm('Start a new game? Your saved game will be replaced.')) return; G.clearSave(); playOpening(); };
$('bContinue').onclick = () => { G.noSave = false; wake(); const sv = G.loadSave() || {}; if (sv.step === 'market-day') playMarket(); else if (sv.step === 'market-road') playRoad(); else { hideAll(); showEnd(); } };
$('bSettings').onclick = () => { wake(); show('settings'); };
$('bBack').onclick = () => { G.saveSettings(); show('title'); };
$('bTitle').onclick = toTitle;
$('skip').onclick = () => { G.skipping = true; };
$('bReset').onclick = () => { if (confirm('Delete your saved game?')) { G.clearSave(); $('bContinue').disabled = true; } };

// Settings controls.
const vol = [['vMaster', 'master'], ['vMusic', 'music'], ['vSfx', 'sfx'], ['vVoice', 'voice']];
vol.forEach(([id, k]) => { const el = $(id); el.value = Math.round(A.vols[k] * 100); el.oninput = () => { A.init(); A.setVol(k, el.value / 100); if (k === 'sfx') A.thwack(0.7); if (k === 'voice') A.speak('mother', 'Stand still, Jack.', 1); }; });
$('vSpeed').value = Math.round(G.settings.speed * 100); $('vSpeed').oninput = () => { G.settings.speed = $('vSpeed').value / 100; G.saveSettings(); };
$('cAuto').checked = G.settings.auto; $('cAuto').onchange = () => { G.settings.auto = $('cAuto').checked; G.saveSettings(); };
$('cSubs').checked = G.settings.subtitles; $('cSubs').onchange = () => { G.settings.subtitles = $('cSubs').checked; G.saveSettings(); };
})(window);

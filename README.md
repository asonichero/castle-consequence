# Birchwood House

A halfway house for fairytale characters whose stories ended without a moral, or who never lived the one we know them
for, and who find themselves, at eighteen or past it, unable to fit the strict adult world. You run the house. They
call you whatever you tell them to; you are never named, only "you".

It is built on the Starlight engine (`starlight-engine.js`, three.js r128 in `vendor/`) and takes its structure from
the Birchwood House spec, with one big change: **there are no cards**. Each evening's correction is live, and its
beginning, end and content are entirely the player's.

**Everyone in the house is an adult (18+) who came in of their own accord, knowing what the house is for.** The
runaway rule of the spec is the *safe word*, "Red", which can be called at any moment. Every call stops the scene at
once and costs them for real (Valued −2, Satisfaction −1, Composure −1, Resentment +1); on the second or third call
(two if their Resentment is already 6 or more) they leave the house for good. Nothing in the game overrides it.

The game ends when everyone has either moved on or left. Nobody who has done either comes back in: the house takes in
whoever has not yet been through it (three at a time), and shrinks as the pool runs out. With fewer than three
residents the morning ends once every resident is placed (not every slot), a shared chore cannot be done alone (it
fails), and with one resident no shared chores are dealt. The final score is how many moved on.

## Run it

```
npm run serve        # then open http://localhost:8765/
npm test             # rules unit tests (Node, no dependencies)
npm run e2e          # browser smoke test, needs Playwright (see the header of tests/e2e-smoke.js)
```

Any static server works; there is no build step. Each page shows a small `build …` stamp in its bottom-left corner and loads its scripts with that stamp as a version, so a stale browser cache can be spotted at a glance (update `FS_BUILD` in `index.html` and `editor.html` when you change files). Progress autosaves in `localStorage` at the start of each morning.

## The day

1. **Morning.** A fresh chore list is generated: one place per resident, some chores paired (two residents, resolved
   on the lower effective Attention and how well they get on). Tap a resident then a chore, or drag. The day starts
   when everyone is placed.
2. **Resolution** (no screen of its own): chores resolve against *effective* Attention (all six stats bear on it) →
   moving on is checked → events roll (at most two, on two different people) → moving on is checked → Behaviour Cards.
3. **Evening.** Each resident, in turn, shows their Behaviour Card (the day's chore, and any event). You choose:
   - **Sit them down**: a live correction, or
   - **Offer a word**: a reprieve (stern, kind, written reflection) that replaces the correction.
4. **The night.** Anyone at Resentment 7 with Valued ≤ 2 calls the safe word. The house is refilled to three from
   those who have not yet been through it, and it's morning (or the game is over, if no one is left).

## The live correction

You begin across the lap, with the hand, bottoms and briefs up (all changeable), then everything is live:

- **Smack** once, or **Run** a number and **Stop** whenever you like (Space also smacks), then **End the correction** when you decide it is done.
- **Pace** and **Strength** are multipliers with − / + buttons (how fast you swing and how soon the next comes; how hard each lands). **Run** sets how many smacks a run gives.
- **Change position…** opens a list; a short passage of narration plays while the room is set again. The pain, the marks and the clock carry over. (Over the table, across the lap, hands on head, hands on the chair, bent over with feet apart. The last needs the switch or paddle.)
- **Change implement…** opens a list. The hand is simply put down; anything else has to be fetched, which is a short exchange: the options on offer, and how the resident answers, depend on their stats and how far along they are (ask politely, tell them, explain what it is for, say nothing and fetch it yourself, or check they are all right to go on). The first exchange of a correction can nudge a stat; the resident then comes back, returns to position, and the new implement is in hand.
- **Layers** (skirt, bottoms, briefs) are toggled live; a skirt is always hitched up for a correction (the game doesn't offer to change it; the editor still has down / hitched up / off for previewing). Clothing over the struck area cushions the sting, as in the engine's pain model.
- **Cameras**: the buttons are standard angles, and the view is yours: drag to orbit, scroll to zoom, right-drag to pan. A button takes the camera back to its angle (Overview: three-quarter from behind on the side away from the player; Behind: square on the contact sites; Over your shoulder: the player's right shoulder; Face: from in front, at a height that suits the pose). Changing position keeps a chosen angle, but leaves a view you framed yourself alone. The editor has the same angles in its discipline-scene section.

The engine's pain model (tolerance, resilience, implement, speed, dread, dwell, clothing, tender skin) turns what you
do into a **distress** reading for that resident. The *highest* distress you bring them to is scored against the band
they needed that evening:

| Band | Peak distress | Needed by |
|---|---|---|
| Minimal | < 0.2 | Wilfulness 1 |
| Light | 0.2 – 0.55 | Wilfulness 2–3 |
| Moderate | 0.55 – 0.9 | Wilfulness 4–5 |
| Firm | 0.9 – 1.2 (the edge of resistance is 1.0) | Wilfulness 6–7 |
| Severe | 1.2 – 1.5 | only with a situational modifier on top |
| Too harsh | ≥ 1.5 | never; nothing more is struck |

Trouble shifts the band up (a half-done or failed chore +1; an event +0 to +2; both stack, capped at +2). The "trap"
events (someone hiding that they are not fine) need a gentle answer, not a hand. Match quality drives the stats exactly
as in the spec (well-matched / undershoot / overshoot). Too harsh counts as a far overshoot, and if the resident's trust
is already thin (Valued ≤ 3 or Resentment ≥ 5) they call the safe word on the spot (and the correction stops).

**Guidance** (on by default, toggle in the header) shades the band the resident needs on the meter.

### The room

A bare room in a medieval cottage: boarded floor, lime-washed stone walls, beamed ceiling, a window that lights the scene, a hearth, a door, a broom and a bucket. The furniture is plain joinery built to the engine's dimensions in `js/room.js`: the plank-seated chair the player sits in (which a resident can also bend over, hands on the seat) and a table with a thick plank top (which they bend over at full height).

### Skirts

A skirt is simulated cloth (`SKIRT` and `skirtStep` in `starlight-engine.js`), and in the discipline scene it is back on by default.

- **Weight.** It is stepped at a fixed 120 steps a second whatever the frame rate, under real gravity with very little air drag, with mass that grows toward the hem (a sewn hem), so it falls, swings and settles instead of floating. Dropped 10 cm it falls 4.8 cm in the first 0.1 s (free fall is 4.9) and is at rest within a second, the same at 20, 60 and 120 frames a second.
- **Folds, not a lampshade.** Stretch is resisted hard and capped at 5%; squashing is resisted much less, so the cloth buckles into folds instead of holding a bell shape; bending is weak; neighbours damp each other so it doesn't ring.
- **Putting it on.** `settleSkirt` walks the body from standing into the pose with the cloth falling and draping, then restores the pose exactly, so a bent-over subject's skirt hangs and rides the way it would have if she had bent over in it (a short skirt rides up over the back, a longer one falls around the hips) rather than lying on her back.
- **No clipping.** Collisions are resolved so that bodies and furniture come first, then other people's hands, and the cloth's own body last, with the floor having the last word, so wherever cloth is squeezed (a palm pressing it onto skin) it ends on the skin and never inside it. Particles can't move further than 16 mm in a step, so they can't tunnel through the skin test; the cloth's layers push each other apart; the palm is held a cloth's thickness further out so it lands on the cloth.
- **Tests.** `tests/skirt-physics.js` checks the fall and its frame-rate independence, and that nothing ends up inside the body, speeds stay sane and the mesh stays finite in every position and with several implements.

### Goodbyes

Moving on and leaving by the safe word are scenes, not cards: the resident stands in the cottage room, a few beats of narration and talk play over it, and you get one choice that colours the parting. They play wherever it happens (after a result card, during the day, or overnight), before anyone new is introduced.

- **Moving on**: each resident has their own opening, three answers to what you say (proud of them / what will they do first / just open the door), and a last image. Their closing line is the one from the Collection.
- **The safe word (leaving)**: the narration differs for a resident brought too far and one who has quietly reached the end of their patience. The options (thank them, ask if they need anything, step back and open the door) never try to talk anyone out of it, and the resident's replies follow how they were feeling (willing, sullen, cheeky, flustered, plain). It always ends with nothing held against them.

All of it is data in `js/content.js` (`SCENES`), assembled by `farewellScene` in `js/rules.js`.

### Candle (replaces the card hand)

Corrections are free; reprieves and aftercare are paid from five marks of candle per evening: reprieves cost 2,
Corner Time / Lines / Warm Words 1, Held After 2. That is what keeps "always offer a kind word" from being a solved game.

## The cast

Red (never met the wolf), Goldilocks (nobody ever came home), Rapunzel (the prince never came), Jack (it always
worked out), Hans (never learned to shiver; the spec's "Corren"), Snow White (rescued, again and again). Starting
spreads and moving-on thresholds are the spec's; their quirks (Hans's halved Wilfulness movement and near-immunity to
severity, Snow White's doubled Valued and sluggish Satisfaction, Jack shrugging off a small overshoot while valued, Red
reading over-correction as abandonment, Goldilocks reading a reprieve as no consequence) live in `js/content.js` and
`changeStat` in `js/rules.js`.

## Shirts

A `top` layer becomes a shirt with a few options (engine: `topCoverage`, `buildShirtParts`, and the fragment shader):

- `neck: 'v'`: a V neckline cut into the painted base (front only).
- `placket: true`: a painted fastening all the way down the front, from the point of the V to the hem: a doubled strip with stitched edges and a button every 4.2 cm (`buttons`, `buttonGap`, `placketWidth` to change them). It is painted per pixel, so it stays crisp.
- `collar: true`: a 3D collar, a band round the neck and two points laid down along the V, sitting on the neck bone (`collarColor`).
- `cuffs: true`: two rolled cuffs of cloth on each forearm just above where the sleeve ends. `sleeves` is in arm segments (1 = the elbow, 2 = the wrist), so `1.5` ends halfway down the forearm and `1.75` three quarters of the way; the cuffs follow it (`cuffAt` to override, `cuffColor`).
- `belt` on any `bottom`, `top` or `skirt` layer: a leather band with a metal buckle at the front, skinned to the waist so it bends with the body: `belt: { color, buckle, width, at, buckleScale }`. On bottoms it sits at the belly line (where a top tucked in at `from: 'belly'` meets them); on a dress (a top or skirt) at the waist. `at` can be `'belly'`, `'waist'`, `'hip'` or `'under'`. It comes off with lowered bottoms.
- Bottoms take `from: 'belly'` (default), `'waist'` (so they meet a top whose `from` is `'waist'`) or `'hip'`.

Jack wears the collar and fastening on a short sleeve (`sleeves: 0.45`), no cuffs; The Huntsman wears a white shirt with all four, sleeves rolled to three quarters.

## Character editor

`editor.html` (linked from the title screen) is the Starlight character viewer, with Birchwood House's cast in place of the stock bodies and no environment: just the figures on a plain floor. It has everything the viewer has:

- **Characters**: the six residents and the player's two looks (Mother Hubbard, in jeans and a plum tank, and The Huntsman, in a white shirt and brown breeches, both in their forties), one at a time or in a line-up.
- **Clothing**: looks, per-layer ticks and colours, skin tone. **Pose**: the pose library, hands on head, spread.
- **View**: skeleton, weights, wireframe, turntable, head camera.
- **Discipline scene**: show it, loop the swing, smack, clear marks, sound; implements, disciplinarian, subject, position (lap, over the table, hands on head, hands on the chair, bent over with feet apart), beat, swing speed and holds, palm angle. The scene is the game's own: the editor runs the same session code as the game (`FairyShoeScene.createSession` in `js/scene.js`), with the bodies built from the designs being edited, so a change to the game's scenes shows here too. The furniture is the game's cottage chair and table.
- **Pose editor**: freeze the scene at a beat, drag joints or the implement, pin hands, and print a **Report**.
- **Measurements, face and expression sliders**, voxel size, and the design's JSON.

(The dance library is not part of this game, so that section is gone.)

What it adds is **reports**. Everything in the editor is a preview: nothing is saved and the game never reads it, so there is no state to get out of step with the files. To make an edit permanent, make a report, copy it and paste it back into the chat, where it is put into the project:

- **Design report (this character)** lists what you changed about the selected character from its design in `js/bodies.js` (a patch: if you only moved the height, only the height is listed) and then the whole design as it now stands. *Every changed design* does the same for each character that differs.
- **Pose report** turns the pose editor's Report into entries for `js/poses.js`, grouped by position (`lap`, `case`, `head`, `chair`, `spread`). An entry names whose pose it is (`subject` or `giver`, the player), the beat (`base` / `contact` for the subject; `relaxed` / `raised` / `contact` for the player) and the bones, as the engine's pose-table Euler degrees; where the scene itself drives a bone (the swinging arm's IK) the report uses the table value.
- **Try a design in the preview**: paste a few fields as JSON (`{"height":172,"outfit":{"hair":"#5a1e12"}}`) or a whole preset as *Show as JSON* prints it. Objects merge, arrays replace, `null` removes a field, colours can be numbers, `0xrrggbb` or `"#rrggbb"`. *Revert this character* goes back to `js/bodies.js`.

**Testing shortcut.** The menu has *Test: most severe correction*, next to the character editor: a pop-up asks for the giver and the subject, then a throwaway game is built with that resident at the top expected severity (Wilfulness high, the largest situational modifier) and you land on the correction's set-up (position, implement, clothes, *Bring them in*). Your save is not touched.

## Layout

```
index.html            page shell
css/style.css
js/content.js         the cast, chores, event templates, lines (pure data)
js/rules.js           the rules (pure functions over JSON state; runs in Node)
js/edits.js           the editor's reports: parsing a pasted design or pose report, and writing the design and pose reports
js/poses.js           pose edits (pasted from the editor's pose report)
js/room.js            the cottage room, the chair and the table
js/bodies.js          the residents' (and the player's) bodies, as Starlight presets
js/scene.js           the live-correction wrapper: cameras, rebuild-in-place, layers, pace and strength
editor.html           the character editor: the Starlight viewer plus reports (js/editor-setup.js gives it the cast)
js/ui.js              interface and game flow
tests/rules.test.js   unit tests for the rules, including a long simulated run
tests/edits.test.js   pose-report / design parsing, the reports, and the implement exchange
tests/e2e-smoke.js    two days in headless Chromium, including every live control
tests/skirt-physics.js + skirt.html  the cloth: weight, frame-rate independence, no clipping
```

## Blocky models (Beanstalk prototype)

`blocky.html` (script: `js/blocky.js`) is a separate prototype for a new, Minecraft-style direction: Jack (21) and Gerda, the Giantess
(late 30s), as box-built characters with hand-painted 64×64 skins (base + outer layer; arms are 3×3 pixels, a little thinner than Minecraft's). Legs are
split at the knee, so the bend only shows when seated. Open it from the same static server, `http://localhost:8765/blocky.html`.

### Across the lap (`lap.html`, `js/lap.js`)

The one discipline scene kept for this direction: Gerda gives, Jack receives, across her lap on a plain chair. The mechanics are the
game's own, ported:

- **Smack / Run / Stop / End**, with **Pace** and **Strength** steps (Space smacks); a smack is a lift, a hold with the arm raised (that wait builds dread), the strike and a short
  hold on the skin (which keeps stinging).
- The engine's **pain model** (`Starlight.createPain`, from `starlight-engine.js`) turns each smack into Jack's **distress**; its bands (composed, flinching, struggling, close to
  the edge, past it, too harsh) drive his kicks and wriggling and his face (four expressions, repainted into his skin). At 1.5 it is too harsh and nothing more is struck.
- **Implements**: the hand (landed with the end of Gerda's forearm, on the middle of one cheek at a time) and a small rounded paddle held out from the face of her arm block that looks toward his head in the top view, face down, landing on one cheek at a time (it alternates with the hand's colour); each with the engine's weight and sting. 
- **Clothes**: trousers up or down, and drawers up or down (with the trousers down). Cloth over the rear cushions the sting only, as in the engine.
- **Marks**: the bare rear colours up with the smacks, cheek by cheek, and tender skin hurts more.
- **Red**: the safe word stops everything at once.
- Cameras: Overview, Behind, Over your shoulder (Gerda's view), Face; drag to orbit as well.

Gerda's swinging (right) arm has an elbow (an upper arm and a forearm, cut like the legs at the knee) and a wrist twist, and the swing is solved geometrically: her torso never twists or leans for a strike (so a pose edit of it stays put). The hand's end lands exactly on the middle of the cheek being struck; the paddle's mount on the forearm is placed so its blade's middle lies on the cheek being struck, the elbow bending more for the nearer cheek and for a smaller Jack, the blade lying toward his head and rolled about its length to the angle of his glutes at contact. Which cheek takes the colour still alternates. At rest (between runs and single smacks) the hand or paddle hovers over the centre of his lower back, at any size of Jack (the right arm's rest pose is aimed, so edits to the right arm's bones at the rest beat are ignored).
Jack's size (50–100%, where 100% is 95% of the model's own scale) is a slider in the lap viewer (50% is the lowest this position works at, and there are two sets of Gerda's poses, made at 100% and at 50%, that blend between as he scales, so the contact sites always work; the pose editor edits one set at a time, holding Jack at that size): his body is scaled about his hip joint and re-seated on her lap, so the premise (he shrinks on arrival and regains his size level by level) can be previewed. The contact sites are on his body, so they move and shrink with him, and the aim is refitted each frame (the blade's height counts most in the fit) so the paddle always lies on his skin. The pain model does not yet change with his size.


#### Pose editor (lap viewer)

`lap.html` ▸ **Edit poses** holds the scene at a beat and lets you lay offsets on any bone, live: Gerda's poses for each implement in hand (Hand and Paddle, each with rest, raised, contactL and contactR: the contact pose belongs to the cheek struck), and Jack's base pose and his full reaction (added in proportion to how hard a smack lands). You can also **click and drag the joint handles in the view**: yellow spheres swing a bone so the joint at its far end follows the cursor (e.g. the right elbow handle swings the upper arm, the right hand handle bends the elbow), cyan cubes move a bone, pink diamonds twist it (the wrist twist, the paddle's roll); the selected one is white, and the sliders show the same numbers. Rotation is in degrees, position in units; Jack's `frame` moves his whole body on her lap and `glutes` is the block. Offsets sit on top of the procedural pose (so her reach still adapts). **Nothing is stored in the browser**: press **Report**, then paste it into `js/lap-poses.js` (or into the chat).

#### Wardrobe

Jack has **Outdoor** (linen shirt, green jerkin, patched trousers, boots), **Day** (a soft green tunic with wooden buttons, hem brushing the tops of his thighs, over plain snug shorts, barefoot), **Soft** (a cornflower tunic, softer, with a small pocket sewn on the front, over cornflower shorts short enough to show his knees, barefoot) and **Fine** (the outdoor clothes dressed up: a deep green jerkin edged in gold, clean breeches with a gold seam, polished boots with brass buckles). In the lap scene the tunic is lifted clear of his seat, so his shorts or trousers, drawers or bare skin show as before. Gerda has **Work** (plum bodice, a bibless apron tied at the waist, ankle-length skirt, barefoot) and **Fine** (barefoot, gold anklets hung with small bells and moonstones, a lavender gown with cream embroidery falling to mid-calf, 3/4 sleeves, bracelets to match the anklets). Pick them in the Wardrobe section of `lap.html` and `blocky.html`; `Blocky.OUTFITS` lists them and `Blocky.paintGerdaInto(skin, 'Fine')` repaints her skin.

### Test level: the golden hen (`level.html`, `js/level.js`)

Gerda has gone out and left Jack (Day clothes, starting at **80%** of his size) looking after her golden hen. He must **sweep the floor** (take the broom, hold Space over the dirt), **fill the hen's dish** (grain from the sack), **carry water to the trough without spilling it** (bucket from the floor by the broom, filled from the always-full basin (the old well); hold Shift to creep, or it slops), and **win the hen's trust** by approaching slowly and keeping still near her (move fast near her and she backs away). WASD or the arrows walk, **Shift** (hold) runs, **C** toggles sneaking, **E** picks up and drops anything (the broom, bucket, grain and the hen herself; next to the rack or well it puts them back, otherwise they stay where he stands), and sits on the chair. **Space** claps if his hands are free (or strokes the hen once she trusts him fully), and uses what he holds: hold it to sweep with the broom; at the dish it fills it; at the well it fills the bucket; at the trough it pours; anywhere else water or grain is dumped on the floor, which makes a new patch of dirt (and spilled water costs size). Holding the hen drains her trust as fast as a clap, every second. **G** calls Gerda back early, and buttons at the bottom right do all of these. On a phone or tablet the page is responsive: a joystick (bottom left) walks, any other touch drags the view, and the buttons do the rest (the ? button shows the help). Dragging the mouse looks around Jack (the camera keeps a fixed distance in Jack's own sizes, so the room seems to grow as he shrinks). The room is square, with packed-earth floor, built at Gerda's size; the hen is half size and starts at 50% trust, and only reacts to Jack's pace within about 28 units of her. The hen roams the whole room. Placed in her nest (E to pick her up and drop her there) or driven towards it, she settles in the centre of it and rests for at least 5 seconds plus 2 more for every 10% of her trust (fast movement no longer bothers her), so the more unsettled she is, the sooner she gets up; anywhere within the nest counts as placing her, and with Jack in or beside the nest Space settles her, raising her trust, and at 100% she stays in her nest. Muddy footprints (Jack's or the hen's) can be swept like dirt. The same chair that stands in the correction scene is against the north wall: Jack sits patiently at 95%, and kicks his feet more and more as he shrinks towards 50%. The correction happens in the middle of the room exactly as he left it, with the hen settled in her nest. During the correction Gerda and Jack talk between short bursts of smacks, and Jack cries out (a synthesised voice that is higher, longer and more broken as his distress rises). The camera may pass through the walls; a wall it has gone through is not drawn, so the room stays visible.

His size never goes below **50%**. What makes him shrink (percentage points of his full size):

| Cause | Cost |
|---|---|
| Clapping to shoo the hen | 3% |
| Lying to Gerda about how it went | 5% (a flat cost, not a reset) |
| Spilling the water (each 15 units lost, or dropping the bucket) | 2% |
| Startling the hen (moving too fast near her, at most once every 4 s) | 1% |
| Each chore still undone when Gerda comes back | 2% |
| Not finished when the 4-minute clock runs out | 2% |
| The broom or bucket left lying about instead of put back (each) | 1% |

A spotless job (nothing undone, nothing broken, no lie) earns no correction at all: Gerda ruffles his hair and calls him a good boy. After the correction a scene shows Jack facing the wall with his bottoms and drawers down and Gerda standing behind him, with a short summary window at the bottom (smacks, and what he was disciplined for: spilled water only counts if left as dirt, and the hen's final temperament is recorded, not each startle). The colour on his bottom slowly fades with time. Anything else earns at least a Light one (severity is stricter than before), and her lecture happens in the room, before a fade to black loads the correction. When the chores are done (or time is up) Gerda (Work clothes) walks in and asks how it went: Jack can tell her exactly what happened, or say it all went perfectly (which is only a lie if it didn't, and then costs 5%). A scripted correction follows across her lap (`js/lap.js`), run with Jack at the size he ends at (a smaller Jack feels the same hand a little more). Its severity comes from how he really did (undone chores 2 each, spills 1.5, startles 0.5, claps 1, running late 1) and then whether he lied: Token, Light, Firm (shorts come down part-way), Severe (hand, then the paddle, bare for the last of it); a lie lifts it one tier. "Red" stops it on the spot.

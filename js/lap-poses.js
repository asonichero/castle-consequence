// Beanstalk — Across the lap: pose edits. Offsets (degrees, and units for position) laid on top of the procedural pose of each bone, per beat.
// Gerda's poses, for each implement in hand ('hand', 'paddle'): 'rest' (between smacks), 'raised' (the arm up, about to strike) and 'contactL' /
// 'contactR' (landed on the left or right cheek); they blend as the swing moves.
// Jack's: 'base' (always on) and 'react' (added in proportion to his reaction to a smack). Bones: Gerda torso, neck, armL, armR, thighL,
// thighR, kneeL, kneeR, elbowR, wristR (the forearm's own twist), paddle; Jack the same without the paddle, plus glutes (the block) and frame (his whole body on her lap).
// An entry is { r: [x, y, z] degrees (Euler, order YXZ, in the bone's own space), p: [x, y, z] units }. The lap viewer's pose editor prints a
// report in exactly this form (Pose editor ▸ Report): paste it over this file. Nothing else writes to it.
(function (root) {
'use strict';
root.LapPoses = {
  gerda: {
    hand: {
      rest: {
        torso: { r: [41, 0, 0], p: [0, 0, -2] },
        armL: { r: [-11, 0, 0] },
      },
      raised: {
        torso: { r: [41, 0, 0], p: [0, 0, -2] },
        armL: { r: [-11, 0, 0] },
        elbowR: { r: [-10, -100, 25] },
      },
      contactL: {
        torso: { r: [41, 0, 0], p: [0, 0, -2] },
        armL: { r: [-11, 0, 0] },
      },
      contactR: {
        torso: { r: [41, 0, 0], p: [0, 0, -2] },
        armL: { r: [-11, 0, 0] },
      },
    },
    paddle: {
      rest: {
        torso: { r: [41, 0, 0], p: [0, 0, -2] },
        armL: { r: [-11, 0, 0] },
      },
      raised: {
        torso: { r: [41, 0, 0], p: [0, 0, -2] },
        armL: { r: [-11, 0, 0] },
        elbowR: { r: [-10, -100, 25] },
      },
      contactL: {
        torso: { r: [41, 0, 0], p: [0, 0, -2] },
        armL: { r: [-11, 0, 0] },
        paddle: { r: [8, -8, 0] },
        wristR: { r: [0, -22, 0], p: [-1.6, -0.4, -2] },
      },
      contactR: {
        torso: { r: [41, 0, 0], p: [0, 0, -2] },
        armL: { r: [-11, 0, 0] },
        paddle: { r: [8, -8, 0] },
        wristR: { r: [0, -22, 0], p: [-1.6, -0.4, -2] },
      },
    },
  },
  jack: {
    base: {},
    react: {},
  },
};
})(typeof window !== 'undefined' ? window : globalThis);

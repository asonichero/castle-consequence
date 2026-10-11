// Beanstalk — Across the lap: pose edits. Offsets (degrees, and units for position) laid on top of the procedural pose of each bone, per beat.
// Two sets, made with Jack at 100% and at 50% of his size; at any size between, the offsets are blended between them (so the contact sites
// always work). 50% is the lowest size these poses work at.
// Gerda's poses, for each implement in hand ('hand', 'paddle'): 'rest' (between smacks), 'raised' (the arm up, about to strike) and 'contactL' /
// 'contactR' (landed on the left or right cheek); they blend as the swing moves. Jack's: 'base' (always on) and 'react' (added in proportion to
// his reaction to a smack). Bones: Gerda torso, neck, armL, armR, thighL, thighR, kneeL, kneeR, elbowR, wristR (the forearm's own twist, and
// the forearm, hand and paddle mount moved as a unit), paddle; Jack the same without the paddle, plus glutes (the block) and frame (his
// whole body on her lap).
// An entry is { r: [x, y, z] degrees (Euler, order YXZ, in the bone's own space), p: [x, y, z] units }. The lap viewer's pose editor prints a
// report in exactly this form (Pose editor ▸ Report): paste it over this file. Nothing else writes to it.
(function (root) {
'use strict';
root.LapPoses = {
  100: {
    gerda: {
      hand: {
        rest: {
          torso: { r: [41, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-11, 0, 0] },
          elbowR: { r: [30, -20, 6] },
        },
        raised: {
          torso: { r: [35, -3, -3], p: [0, 0, -0.5] },
          armL: { r: [-11, 0, 0] },
          elbowR: { r: [-10, -100, 25] },
        },
        contactL: {
          torso: { r: [41, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-11, 0, 0] },
          armR: { r: [11.1, -2.6, -26.8] },
          elbowR: { r: [-10.7, -9.7, 29.9] },
        },
        contactR: {
          torso: { r: [42, -3, 4], p: [0, 0, -0.5] },
          armL: { r: [-11, 0, 0] },
          elbowR: { r: [-20.2, 40.8, -3.8] },
          armR: { r: [5.8, 0.2, 3.6] },
          wristR: { p: [-0.2, 0, 0] },
        },
      },
      paddle: {
        rest: {
          torso: { r: [41, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-11, 0, 0] },
          elbowR: { r: [19, 2.5, 12.3] },
          paddle: { r: [-1.1, -37.5, 1.2] },
          armR: { r: [17.4, 0.5, 4.4] },
        },
        raised: {
          torso: { r: [35, 0, 0], p: [0, 0, -0.5] },
          elbowR: { r: [-48.5, 4.7, -24.7] },
          armR: { r: [-22, 2.8, -14.2] },
          armL: { r: [-8.5, -0.1, 1.4] },
        },
        contactL: {
          torso: { r: [41, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-11, 0, 0] },
          paddle: { r: [8, -8, 0] },
          wristR: { r: [0, -22, 0], p: [-1.2, 0.4, -1.6] },
          elbowR: { r: [-5.4, 3.4, -7.5] },
        },
        contactR: {
          torso: { r: [45, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-12.6, 0, 1.9] },
          paddle: { r: [7.5, 12.2, 2.7] },
          wristR: { r: [0, -22, 0], p: [0.5, -0.3, 0] },
          elbowR: { r: [27.9, -5.6, -29.4] },
          armR: { r: [-11, -0.2, 2.3] },
        },
      },
    },
    jack: {
      base: {},
      react: {},
    },
  },
  50: {
    gerda: {
      hand: {
        rest: {
          torso: { r: [41, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-11, 0, 0] },
          elbowR: { r: [-8.2, -24.2, 20] },
          armR: { r: [24.2, -3.2, -7.4] },
          paddle: { r: [0, 17.9, 0] },
          wristR: { r: [0, 11.9, 0] },
        },
        raised: {
          torso: { r: [35, -3, -3], p: [0, 0, -0.5] },
          armL: { r: [-11.2, 0, 0.9] },
          elbowR: { r: [-10, -100, 25] },
        },
        contactL: {
          torso: { r: [41, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-11, 0, 0] },
          armR: { r: [12, -3.1, -26.8] },
          elbowR: { r: [-5.2, -6.1, 41.9] },
          wristR: { r: [0, 11.6, 0] },
        },
        contactR: {
          torso: { r: [41, -3, 4], p: [0, 0, -0.5] },
          armL: { r: [-11, 0, 0] },
          elbowR: { r: [-19.2, 40.7, -8.6] },
          armR: { r: [5.8, 0.2, 3.6] },
          wristR: { p: [-0.2, 0, 0] },
        },
      },
      paddle: {
        rest: {
          torso: { r: [41, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-11, 0, 0] },
          elbowR: { r: [2, -80, -7] },
          paddle: { r: [1, -102, 2], p: [0, 1, 0] },
          armR: { r: [17.4, 0.5, 4.4] },
        },
        raised: {
          torso: { r: [35, 0, 0], p: [0, 0, -0.5] },
          elbowR: { r: [-48.5, 4.7, -24.7] },
          armR: { r: [-22, 2.8, -14.2] },
          armL: { r: [-8.5, -0.1, 1.4] },
        },
        contactL: {
          torso: { r: [41, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-11, 0, 0] },
          paddle: { r: [7, 20.4, 3.8] },
          wristR: { r: [0, -13.9, 0], p: [0.2, 0.4, -1.4] },
          elbowR: { r: [-1, 2.6, -1.5] },
          armR: { r: [-2.5, 0.3, -15.4] },
        },
        contactR: {
          torso: { r: [41, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-12.6, 0, 1.9] },
          paddle: { r: [0.9, 39.8, 1.8], p: [0, 1, 0] },
          wristR: { r: [0, -22, 0], p: [0.5, -0.3, 0] },
          elbowR: { r: [13.3, 17.7, 18.7] },
          armR: { r: [-6.6, -3, -34.4] },
        },
      },
    },
    jack: {
      base: {},
      react: {},
    },
  },
  table: {
    100: {
      gerda: {
        hand: {
          rest: {},
          raised: {},
          contactL: {},
          contactR: {},
        },
        paddle: {
          rest: {},
          raised: {},
          contactL: {},
          contactR: {},
        },
        birch: {
          rest: {
            torso: { r: [7.4, 32.5, 7.6], p: [-13.8, 0, -7.6] },
            elbowR: { r: [-17.1, -0.7, 0.5] },
            armR: { r: [-6.5, -2.2, -13.4] },
            paddle: { r: [0, -14.3, 0] },
            birch: { r: [-71.5, 32, -42.4] },
            wristR: { r: [0, -6.5, 0] },
          },
          raised: {
            torso: { r: [7.4, 32.5, 7.6], p: [-13.8, 0, -7.6] },
            elbowR: { r: [-17.1, -0.7, 0.5] },
            armR: { r: [-6.5, -2.2, -13.4] },
            paddle: { r: [0, -14.3, 0] },
            birch: { r: [-71.5, 32, -42.4] },
            wristR: { r: [0, -6.5, 0] },
          },
          contactL: {
            torso: { r: [7.4, 32.5, 7.6], p: [-13.8, 0, -7.6] },
            elbowR: { r: [-17.1, -0.7, 0.5] },
            armR: { r: [-6.5, -2.2, -13.4] },
            paddle: { r: [0, -14.3, 0] },
            birch: { r: [-71.5, 32, -42.4] },
            wristR: { r: [0, -6.5, 0] },
          },
          contactR: {
            torso: { r: [7.4, 32.5, 7.6], p: [-13.8, 0, -7.6] },
            elbowR: { r: [-17.1, -0.7, 0.5] },
            armR: { r: [-6.5, -2.2, -13.4] },
            paddle: { r: [0, -14.3, 0] },
            birch: { r: [-71.5, 32, -42.4] },
            wristR: { r: [0, -6.5, 0] },
          },
        },
      },
      jack: {
        hand: {
          rest: {},
          raised: {},
          contactL: {},
          contactR: {},
        },
        paddle: {
          rest: {},
          raised: {},
          contactL: {},
          contactR: {},
        },
        birch: {
          rest: {
            frame: { p: [-11.5, 0, 0] },
            armR: { r: [3.6, -0.7, -24.5] },
            armL: { r: [3.3, 0.6, 23.6] },
            neck: { r: [-33, 53, 1] },
          },
          raised: {
            frame: { p: [-11.5, 0, 0] },
            armR: { r: [3.6, -0.7, -24.5] },
            armL: { r: [3.3, 0.6, 23.6] },
            neck: { r: [-33, 53, 1] },
          },
          contactL: {
            frame: { p: [-11.5, 0, 0] },
            armR: { r: [3.6, -0.7, -24.5] },
            armL: { r: [3.3, 0.6, 23.6] },
            neck: { r: [-33, 53, 1] },
          },
          contactR: {
            frame: { p: [-11.5, 0, 0] },
            armR: { r: [3.6, -0.7, -24.5] },
            armL: { r: [3.3, 0.6, 23.6] },
            neck: { r: [-33, 53, 1] },
          },
        },
      },
    },
    50: {
      gerda: {
        hand: {
          rest: {},
          raised: {},
          contactL: {},
          contactR: {},
        },
        paddle: {
          rest: {},
          raised: {},
          contactL: {},
          contactR: {},
        },
        birch: {
          rest: {
            torso: { r: [7.4, 32.5, 7.6], p: [-13.8, 0, -7.6] },
            elbowR: { r: [-17.1, -0.7, 0.5] },
            armR: { r: [-6.5, -2.2, -13.4] },
            paddle: { r: [0, -14.3, 0] },
            birch: { r: [-71.5, 32, -42.4] },
            wristR: { r: [0, -6.5, 0] },
          },
          raised: {
            torso: { r: [7.4, 32.5, 7.6], p: [-13.8, 0, -7.6] },
            elbowR: { r: [-17.1, -0.7, 0.5] },
            armR: { r: [-6.5, -2.2, -13.4] },
            paddle: { r: [0, -14.3, 0] },
            birch: { r: [-71.5, 32, -42.4] },
            wristR: { r: [0, -6.5, 0] },
          },
          contactL: {
            torso: { r: [7.4, 32.5, 7.6], p: [-13.8, 0, -7.6] },
            elbowR: { r: [-17.1, -0.7, 0.5] },
            armR: { r: [-6.5, -2.2, -13.4] },
            paddle: { r: [0, -14.3, 0] },
            birch: { r: [-71.5, 32, -42.4] },
            wristR: { r: [0, -6.5, 0] },
          },
          contactR: {
            torso: { r: [7.4, 32.5, 7.6], p: [-13.8, 0, -7.6] },
            elbowR: { r: [-17.1, -0.7, 0.5] },
            armR: { r: [-6.5, -2.2, -13.4] },
            paddle: { r: [0, -14.3, 0] },
            birch: { r: [-71.5, 32, -42.4] },
            wristR: { r: [0, -6.5, 0] },
          },
        },
      },
      jack: {
        hand: {
          rest: {},
          raised: {},
          contactL: {},
          contactR: {},
        },
        paddle: {
          rest: {},
          raised: {},
          contactL: {},
          contactR: {},
        },
        birch: {
          rest: {
            frame: { p: [-11.5, 0, 0] },
            armR: { r: [3.6, -0.7, -24.5] },
            armL: { r: [3.3, 0.6, 23.6] },
            neck: { r: [-33, 53, 1] },
          },
          raised: {
            frame: { p: [-11.5, 0, 0] },
            armR: { r: [3.6, -0.7, -24.5] },
            armL: { r: [3.3, 0.6, 23.6] },
            neck: { r: [-33, 53, 1] },
          },
          contactL: {
            frame: { p: [-11.5, 0, 0] },
            armR: { r: [3.6, -0.7, -24.5] },
            armL: { r: [3.3, 0.6, 23.6] },
            neck: { r: [-33, 53, 1] },
          },
          contactR: {
            frame: { p: [-11.5, 0, 0] },
            armR: { r: [3.6, -0.7, -24.5] },
            armL: { r: [3.3, 0.6, 23.6] },
            neck: { r: [-33, 53, 1] },
          },
        },
      },
    },
  },
};
})(typeof window !== 'undefined' ? window : globalThis);

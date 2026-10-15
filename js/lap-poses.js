// Beanstalk — Across the lap: pose edits. Offsets (degrees, and units for position) laid on top of the procedural pose of each bone, per beat.
// Two sets, made with Jack at 100% and at 50% of his size; at any size between, the offsets are blended between them (so the contact sites
// always work). 50% is the lowest size these poses work at.
// Gerda's poses, for each implement in hand ('hand', 'paddle'): 'rest' (between smacks), 'raised' (the arm up, about to strike) and 'contactL' /
// 'contactR' (landed on the left or right cheek); they blend as the swing moves. Jack's: 'base' (always on) and 'react' (added in proportion to
// his reaction to a smack). Bones: Gerda torso, neck, armL, armR, thighL, thighR, kneeL, kneeR, elbowR, wristR (the forearm's own twist, and
// the forearm, hand and paddle mount moved as a unit), paddle; Jack the same without the paddle, plus glutes (the block) and frame (his
// whole body on her lap).
// An entry is { r: [x, y, z] degrees, p: [x, y, z] units }. r is absolute: the joint's own angles from its standing position (in its own order: torso YXZ, arms and thighs ZXY, the rest XYZ), within the joint's range (js/lap.js, LIMITS); a bone with no r keeps its procedural
// pose. p is how far the part has moved from where it stands (only the torso, Jack's whole body, his glutes block and the implements move). The lap viewer's pose editor prints a report in exactly this form (Pose editor ▸ Report): paste it over this file. Nothing else writes to it.
(function (root) {
'use strict';
root.LapPoses = {
  100: {
    gerda: {
      hand: {
        rest: {
          torso: { r: [-2, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-80.2, 90, 12.4] },
          elbowR: { r: [85.5, 0, 0] },
          elbowL: { r: [33.2, 4.9, 0] },
          birch: { r: [0, 0, 0] },
        },
        raised: {
          torso: { r: [-7.9, -2.5, -0.9], p: [0, 0, -0.5] },
          armL: { r: [-57, 90, 107.8] },
          elbowR: { r: [96.3, -80, 0] },
          armR: { r: [-2.8, 90, -95.3] },
        },
        contactL: {
          torso: { r: [-2, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-47.8, 90, 110] },
          armR: { r: [-8.5, -90, -77.8] },
          elbowR: { r: [94.2, -10.7, 0] },
        },
        contactR: {
          torso: { r: [-0.9, -2.2, 6], p: [0, 0, -0.5] },
          armL: { r: [-33.9, 90, 97.4] },
          elbowR: { r: [22.8, 38.5, 0] },
          armR: { r: [-73.6, -90, -110] },
        },
      },
      paddle: {
        rest: {
          torso: { r: [-2, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-47.8, 90, 110] },
          elbowR: { r: [82.6, 2.4, 0] },
          paddle: { r: [-165, -1.1, 91.2] },
          armR: { r: [-25.3, -90, -108.1] },
        },
        raised: {
          torso: { r: [-8, 0, 0], p: [0, 0, -0.5] },
          elbowR: { r: [64.8, 3.3, 0] },
          armR: { r: [30.6, 90, -97.4] },
          armL: { r: [-62.3, 90, 98.1] },
        },
        contactL: {
          torso: { r: [-2, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-47.8, 90, 110] },
          paddle: { r: [173.7, 8, 90] },
          wristR: { r: [0, 52.8, 0] },
          elbowR: { r: [86.2, 3.4, 0] },
        },
        contactR: {
          torso: { r: [2, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-37.9, 90, 110] },
          paddle: { r: [160.2, 7.5, 92.7] },
          wristR: { r: [0, 45.8, 0] },
          elbowR: { r: [63.6, -5.5, 0] },
          armR: { r: [-21.5, -90, -104.4] },
        },
      },
      birch: {
        rest: {},
        raised: {},
        contactL: {},
        contactR: {},
      },
      'hand~reach': {
        rest: {
          torso: { r: [-2, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-80.2, 90, 12.4] },
          elbowR: { r: [85.4, 0, 0] },
          elbowL: { r: [33.2, 4.9, 0] },
          birch: { r: [0, 0, 0] },
        },
        raised: {
          torso: { r: [-7.9, -2.5, -0.9], p: [0, 0, -0.5] },
          armL: { r: [-57, 90, 107.8] },
          elbowR: { r: [96.3, -80, 0] },
          armR: { r: [-2.8, 90, -95.3] },
        },
        contactL: {
          torso: { r: [-2, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-47.8, 90, 110] },
          armR: { r: [-8.5, -90, -77.8] },
          elbowR: { r: [94.2, -10.7, 0] },
        },
        contactR: {
          torso: { r: [-0.9, -2.2, 6], p: [0, 0, -0.5] },
          armL: { r: [-33.9, 90, 97.4] },
          elbowR: { r: [22.8, 38.5, 0] },
          armR: { r: [-73.6, -90, -110] },
        },
      },
      'hand~hold': {
        rest: {
          torso: { r: [-2, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-49.3, -90, 110] },
          elbowR: { r: [85.5, 0, 0] },
          elbowL: { r: [84.3, 0.4, 0] },
          birch: { r: [0, 0, 0] },
        },
        raised: {
          torso: { r: [-7.9, -2.5, -0.9], p: [0, 0, -0.5] },
          armL: { r: [-62, -51.1, -85] },
          elbowR: { r: [96.3, -80, 0] },
          armR: { r: [-2.8, 90, -95.3] },
        },
        contactL: {
          torso: { r: [-2, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-57.6, -62, -94.1] },
          armR: { r: [-8.5, -90, -77.8] },
          elbowR: { r: [94.2, -10.7, 0] },
        },
        contactR: {
          torso: { r: [-0.9, -2.2, 6], p: [0, 0, -0.5] },
          armL: { r: [-65.4, -45.4, -91] },
          elbowR: { r: [22.8, 38.5, 0] },
          armR: { r: [-73.6, -90, -110] },
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
        rest: {},
        raised: {},
        contactL: {},
        contactR: {},
      },
      'hand~reach': {
        rest: {
          armR: { r: [35.5, 6, -7] },
          elbowR: { r: [0, -0.9, 0] },
        },
        raised: {},
        contactL: {},
        contactR: {},
      },
      'hand~hold': {
        rest: {
          armR: { r: [53, 90, -9.1] },
          elbowR: { r: [0, 41, 0] },
        },
        raised: {},
        contactL: {},
        contactR: {},
      },
    },
  },
  50: {
    gerda: {
      hand: {
        rest: {
          torso: { r: [-2, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-72.2, 42.5, -19] },
          elbowR: { r: [62.1, -24.8, 0] },
          armR: { r: [-76.1, -90, -40.7] },
          paddle: { r: [172.4, 0, 90] },
          wristR: { r: [0, 11.9, 0] },
          elbowL: { r: [43.1, 2.8, 0] },
        },
        raised: {
          torso: { r: [-7.9, -2.5, -0.9], p: [0, 0, -0.5] },
          armL: { r: [-74.6, 83.1, 26.2] },
          elbowR: { r: [90.4, -80, 0] },
        },
        contactL: {
          torso: { r: [-2, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-73.8, 90, 70.3] },
          armR: { r: [-38.8, -90, -38.1] },
          elbowR: { r: [73.5, -8.1, 0] },
          wristR: { r: [0, 11.6, 0] },
        },
        contactR: {
          torso: { r: [-1.9, -2.3, 6], p: [0, 0, -0.5] },
          armL: { r: [-56.4, 90, 62.4] },
          elbowR: { r: [18.1, 38.2, 0] },
          armR: { r: [-78.9, -14.7, 37.6] },
        },
      },
      paddle: {
        rest: {
          torso: { r: [-2, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-73.8, 90, 70.3] },
          elbowR: { r: [64.9, -79.8, 0] },
          paddle: { r: [-14.7, 1, 92], p: [0, 1, 0] },
          armR: { r: [-56.1, -90, -85.1] },
        },
        raised: {
          torso: { r: [-8, 0, 0], p: [0, 0, -0.5] },
          elbowR: { r: [64.8, 3.3, 0] },
          armR: { r: [25.8, 90, -103] },
          armL: { r: [-71.1, 58.9, -0.5] },
        },
        contactL: {
          torso: { r: [-2, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-73.8, 90, 70.3] },
          paddle: { r: [155.2, 7, 93.8] },
          wristR: { r: [0, 63, 0] },
          elbowR: { r: [62.8, 2.6, 0] },
          armR: { r: [-19.6, -90, -71.2] },
        },
        contactR: {
          torso: { r: [-2, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-71.3, 90, 70.3] },
          paddle: { r: [141.5, 0.9, 91.8], p: [0, 1, 0] },
          wristR: { r: [0, 50.3, 0] },
          elbowR: { r: [42.5, 17.7, 0] },
          armR: { r: [-22.3, -90, -45.1] },
        },
      },
      birch: {
        rest: {},
        raised: {},
        contactL: {},
        contactR: {},
      },
      'hand~reach': {
        rest: {
          torso: { r: [-2, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-72.2, 42.5, -19] },
          elbowR: { r: [61.9, -24.8, 0] },
          armR: { r: [-76.1, -90, -39.8] },
          paddle: { r: [-178.7, 0, 90] },
          wristR: { r: [0, 11.9, 0] },
          elbowL: { r: [43.1, 2.8, 0] },
        },
        raised: {
          torso: { r: [-7.9, -2.5, -0.9], p: [0, 0, -0.5] },
          armL: { r: [-74.6, 83.1, 26.2] },
          elbowR: { r: [90.4, -80, 0] },
        },
        contactL: {
          torso: { r: [-2, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-73.8, 90, 70.3] },
          armR: { r: [-38.8, -90, -38.1] },
          elbowR: { r: [73.5, -8.1, 0] },
          wristR: { r: [0, 11.6, 0] },
        },
        contactR: {
          torso: { r: [-1.9, -2.3, 6], p: [0, 0, -0.5] },
          armL: { r: [-56.4, 90, 62.4] },
          elbowR: { r: [18.1, 38.2, 0] },
          armR: { r: [-78.9, -14.7, 37.6] },
        },
      },
      'hand~hold': {
        rest: {
          torso: { r: [-2, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-59.3, 45.3, -3.9] },
          elbowR: { r: [62, -24.8, 0] },
          armR: { r: [-76.1, -90, -40.1] },
          paddle: { r: [-178.7, 0, 90] },
          wristR: { r: [0, 11.9, 0] },
          elbowL: { r: [0, -47.1, 0] },
        },
        raised: {
          torso: { r: [-7.9, -2.5, -0.9], p: [0, 0, -0.5] },
          armL: { r: [-62.4, -11.3, -55.6] },
          elbowR: { r: [90.4, -80, 0] },
        },
        contactL: {
          torso: { r: [-2, 0, 0], p: [0, 0, -0.5] },
          armL: { r: [-60.4, -22, -66.9] },
          armR: { r: [-38.8, -90, -38.1] },
          elbowR: { r: [73.5, -8.1, 0] },
          wristR: { r: [0, 11.6, 0] },
        },
        contactR: {
          torso: { r: [-1.9, -2.3, 6], p: [0, 0, -0.5] },
          armL: { r: [-64.3, 14.8, -49.2] },
          elbowR: { r: [18.1, 38.2, 0] },
          armR: { r: [-78.9, -14.7, 37.6] },
        },
      },
    },
    jack: {
      hand: {
        rest: {
          armL: { r: [4, -90, 110] },
        },
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
        rest: {},
        raised: {},
        contactL: {},
        contactR: {},
      },
      'hand~reach': {
        rest: {
          armL: { r: [4, -90, 110] },
          armR: { r: [24.4, -0.8, 9.1] },
          elbowR: { r: [0, 7.8, 0] },
        },
        raised: {},
        contactL: {},
        contactR: {},
      },
      'hand~hold': {
        rest: {
          armL: { r: [4, -90, 110] },
          armR: { r: [58.1, 90, -0.6] },
          elbowR: { r: [0, 60.5, 0] },
        },
        raised: {},
        contactL: {},
        contactR: {},
      },
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
            torso: { r: [-0.6, -9.5, 0.6], p: [-13.8, 0, -7.6] },
            elbowR: { r: [5.5, -0.2, 0] },
            armR: { r: [-6.6, -2.3, -3.6] },
            paddle: { r: [0, 0, 90] },
            birch: { r: [-76.1, 17, 15.6] },
            wristR: { r: [0, -6.5, 0] },
            neck: { r: [10.2, 26.9, -2] },
          },
          raised: {
            torso: { r: [-0.6, -16.5, 0.6], p: [-13.8, 0, -7.6] },
            elbowR: { r: [0, -8.9, 0] },
            armR: { r: [31.8, 5.3, -80.4] },
            paddle: { r: [0, 0, 90] },
            birch: { r: [-90.6, 14.5, -9.7] },
            wristR: { r: [0, -75.6, 0] },
            armL: { r: [-13.9, 0.4, 5.1] },
          },
          contactL: {
            torso: { r: [7.4, 32.5, 7.6], p: [-13.8, 0, -7.6] },
            elbowR: { r: [56.1, 0, 0] },
            armR: { r: [14.2, -90, -8.2] },
            paddle: { r: [0, 0, 90] },
            birch: { r: [37, 19.6, 54.7] },
            wristR: { r: [0, 0, 0] },
            armL: { r: [11.1, -0.7, 8.8] },
            neck: { r: [5.7, -28, 0] },
          },
          contactR: {
            torso: { r: [7.4, 32.5, 7.6], p: [-13.8, 0, -7.6] },
            elbowR: { r: [56.1, 0, 0] },
            armR: { r: [14.2, -90, -8.2] },
            paddle: { r: [0, 0, 90] },
            birch: { r: [37, 19.6, 54.7] },
            wristR: { r: [0, 0, 0] },
            armL: { r: [11.1, -0.7, 8.8] },
            neck: { r: [5.7, -28, 0] },
          },
        },
        'hand~reach': {
          rest: {},
          raised: {},
          contactL: {},
          contactR: {},
        },
        'hand~hold': {
          rest: {},
          raised: {},
          contactL: {},
          contactR: {},
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
            armR: { r: [-27.6, -90, -110] },
            armL: { r: [-27.5, 90, 110] },
            neck: { r: [-38.7, -1.2, 0.2] },
          },
          raised: {
            frame: { p: [-11.5, 0, 0] },
            armR: { r: [-27.6, -90, -110] },
            armL: { r: [-27.5, 90, 110] },
            neck: { r: [-38.7, -1.2, 0.2] },
          },
          contactL: {
            frame: { r: [90, 39.7, -90], p: [-10.4, 0.3, 0.1] },
            armR: { r: [-45, -90, -110] },
            armL: { r: [-46.5, 90, 110] },
            neck: { r: [-51.3, -1.2, -0.3] },
            kneeR: { r: [34, 2.2, 0] },
            kneeL: { r: [30.8, -0.3, 0] },
            thighR: { r: [-61.3, 0.5, -5.1] },
            thighL: { r: [-60, -1, 4.5] },
            torso: { r: [5.6, 0, 0.2] },
          },
          contactR: {
            frame: { r: [90, 39.7, -90], p: [-10.4, 0.3, 0.1] },
            armR: { r: [-45, -90, -110] },
            armL: { r: [-46.5, 90, 110] },
            neck: { r: [-51.3, -1.2, -0.3] },
            kneeR: { r: [34, 2.2, 0] },
            kneeL: { r: [30.8, -0.3, 0] },
            thighR: { r: [-61.3, 0.5, -5.1] },
            thighL: { r: [-60, -1, 4.5] },
            torso: { r: [5.6, 0, 0.2] },
          },
        },
        'hand~reach': {
          rest: {},
          raised: {},
          contactL: {},
          contactR: {},
        },
        'hand~hold': {
          rest: {},
          raised: {},
          contactL: {},
          contactR: {},
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
            torso: { r: [-0.6, -9.5, 0.6], p: [-13.8, 0, -7.6] },
            elbowR: { r: [5.5, -0.2, 0] },
            armR: { r: [-6.6, -2.3, -3.6] },
            paddle: { r: [0, 0, 90] },
            birch: { r: [-76.1, 17, 15.6] },
            wristR: { r: [0, -6.5, 0] },
            neck: { r: [10.2, 26.9, -2] },
          },
          raised: {
            torso: { r: [-0.6, -16.5, 0.6], p: [-13.8, 0, -7.6] },
            elbowR: { r: [0, -8.9, 0] },
            armR: { r: [31.8, 5.3, -80.4] },
            paddle: { r: [0, 0, 90] },
            birch: { r: [-90.6, 14.5, -9.7] },
            wristR: { r: [0, -75.6, 0] },
            armL: { r: [-13.9, 0.4, 5.1] },
          },
          contactL: {
            torso: { r: [7.4, 32.5, 7.6], p: [-13.8, 0, -7.6] },
            elbowR: { r: [5.2, 0, 0] },
            armR: { r: [-17.1, -90, 9.6] },
            paddle: { r: [0, 0, 90] },
            birch: { r: [53.6, 28, 52.6] },
            wristR: { r: [0, 0, 0] },
            armL: { r: [11.1, -0.7, 8.8] },
            neck: { r: [5.7, -28, 0] },
          },
          contactR: {
            torso: { r: [7.4, 32.5, 7.6], p: [-13.8, 0, -7.6] },
            elbowR: { r: [5.2, 0, 0] },
            armR: { r: [-17.1, -90, 9.6] },
            paddle: { r: [0, 0, 90] },
            birch: { r: [53.6, 28, 52.6] },
            wristR: { r: [0, 0, 0] },
            armL: { r: [11.1, -0.7, 8.8] },
            neck: { r: [5.7, -28, 0] },
          },
        },
        'hand~reach': {
          rest: {},
          raised: {},
          contactL: {},
          contactR: {},
        },
        'hand~hold': {
          rest: {},
          raised: {},
          contactL: {},
          contactR: {},
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
            armR: { r: [-44, -90, -110] },
            armL: { r: [-44.1, 90, 110] },
            neck: { r: [-38.7, -1.2, 0.2] },
          },
          raised: {
            frame: { p: [-11.5, 0, 0] },
            armR: { r: [-44, -90, -110] },
            armL: { r: [-44.1, 90, 110] },
            neck: { r: [-38.7, -1.2, 0.2] },
          },
          contactL: {
            frame: { r: [90, 58.8, -90], p: [-10.4, 0.3, 0.1] },
            armR: { r: [-59.7, -90, -110] },
            armL: { r: [-62.1, 90, 110] },
            neck: { r: [-51.3, -1.2, -0.3] },
            kneeR: { r: [34, 2.2, 0] },
            kneeL: { r: [30.8, -0.3, 0] },
            thighR: { r: [-42.2, 0.3, -5.3] },
            thighL: { r: [-40.9, -0.5, 4.9] },
            torso: { r: [5.6, 0, 0.2] },
          },
          contactR: {
            frame: { r: [90, 58.8, -90], p: [-10.4, 0.3, 0.1] },
            armR: { r: [-59.7, -90, -110] },
            armL: { r: [-62.1, 90, 110] },
            neck: { r: [-51.3, -1.2, -0.3] },
            kneeR: { r: [34, 2.2, 0] },
            kneeL: { r: [30.8, -0.3, 0] },
            thighR: { r: [-42.2, 0.3, -5.3] },
            thighL: { r: [-40.9, -0.5, 4.9] },
            torso: { r: [5.6, 0, 0.2] },
          },
        },
        'hand~reach': {
          rest: {},
          raised: {},
          contactL: {},
          contactR: {},
        },
        'hand~hold': {
          rest: {},
          raised: {},
          contactL: {},
          contactR: {},
        },
      },
    },
  },
};
})(typeof window !== 'undefined' ? window : globalThis);

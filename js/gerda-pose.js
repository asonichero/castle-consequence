// Climbing Toward Consequence — how Gerda holds Jack (at a tenth of his size) in one hand. Written by pose-editor.html (Copy pose): paste it over this file.
//   gerda: joint angles in radians (hipsY: how far her hips drop); jack: his position and turns in the frame of her wrist (so he goes wherever her hand goes), and his own limbs.
(function (root) {
'use strict';
root.GerdaHold = {
  gerda: { hipsY: 0, torsoX: 0.1, torsoY: 0, torsoZ: 0, neckX: -0.1, neckY: 0, armRx: -1.2, armRz: 0.1, elbowX: -1.3, wristY: 0, armLx: 0.1, armLz: 0, legLx: 0, legLknee: 0, legRx: 0, legRknee: 0 },
  jack: { px: 0, py: -6.5, pz: 1.5, rx: 2.6, ry: 0, rz: 0, armLx: -0.4, armRx: -0.4, armLz: 0.2, armRz: 0.2, legLx: 0, legRx: 0, kneeL: 0, kneeR: 0, torsoX: 0, neckX: 0 },
};
})(typeof window !== 'undefined' ? window : globalThis);

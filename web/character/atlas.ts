import * as THREE from "three";
import { MannequinAdapter } from "./mannequin";
/** Original stylized character: sculpted hair, layered bomber, cargo trousers and sneakers. */
export class AtlasAdapter extends MannequinAdapter {
  build() {
    super.build();
    const head = this.bones.head,
      torso = this.bones.spine;
    const skin = "#bd8f73",
      hair = "#242c30",
      jacket = this.config.hoodie || "#52766b",
      rib = "#354e49",
      cream = "#e7dbc2";
    // Refine visible skin and clothing geometry while preserving the existing rig.
    this.root.traverse((o: any) => {
      if (o.isMesh) {
        o.material.flatShading = false;
        o.material.needsUpdate = true;
        o.material.roughness = 0.78;
      }
    });
    this.nose.visible = false;
    for (const o of head.children as any[])
      if (
        o.isMesh &&
        (o.geometry?.parameters?.radius === 0.227 ||
          o.geometry?.parameters?.radius === 0.22 ||
          (o.geometry?.parameters?.radius === 0.045 && o !== this.nose))
      )
        o.visible = false;
    this.brows.forEach((b: any) => (b.visible = false));
    const ellipsoid = (
      parent: any,
      color: string,
      pos: number[],
      scale: number[],
    ) => {
      const m = this.part(
        new THREE.SphereGeometry(1, 16, 12),
        color,
        parent,
        ...(pos as [number, number, number]),
      );
      m.material.flatShading = false;
      m.material.needsUpdate = true;
      m.scale.fromArray(scale);
      return m;
    };
    ellipsoid(head, skin, [0, -0.035, 0.015], [0.19, 0.17, 0.175]);
    ellipsoid(head, skin, [0, -0.025, 0.188], [0.016, 0.021, 0.014]);
    for (const side of [-1, 1]) {
      ellipsoid(
        head,
        "#a5725c",
        [side * 0.205, -0.003, 0.017],
        [0.018, 0.031, 0.018],
      );
      ellipsoid(
        head,
        "#b98a75",
        [side * 0.112, -0.075, 0.157],
        [0.047, 0.022, 0.009],
      );
    }
    // One smooth cap and swept forelock replace the segmented ball-shaped hair.
    const cap = this.part(
      new THREE.SphereGeometry(
        0.215,
        48,
        32,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.585,
      ),
      hair,
      head,
      0,
      0.045,
      -0.015,
    );
    cap.scale.set(1, 0.94, 1.02);
    const lock = ellipsoid(
      head,
      "#303a3c",
      [-0.045, 0.19, 0.095],
      [0.092, 0.043, 0.105],
    );
    lock.rotation.z = -0.28;
    lock.rotation.x = -0.12;
    ellipsoid(head, "#1c2427", [0, 0.025, -0.12], [0.195, 0.15, 0.078]);
    // White sclera, colored irises, pupils and catchlights move/blink as groups.
    for (let i = 0; i < 2; i++) {
      this.eyes[i].visible = false;
      const x = i ? 0.083 : -0.083,
        eye = new THREE.Group();
      eye.position.set(x, 0.035, 0.187);
      head.add(eye);
      ellipsoid(eye, "#eee7da", [0, 0, 0], [0.037, 0.024, 0.011]);
      ellipsoid(eye, "#657864", [0, 0, 0.011], [0.014, 0.019, 0.005]);
      ellipsoid(eye, "#152326", [0, 0, 0.015], [0.008, 0.013, 0.004]);
      ellipsoid(eye, "#ffffff", [-0.005, 0.007, 0.019], [0.003, 0.004, 0.002]);
      this.eyes[i] = eye;
      const brow = ellipsoid(
        head,
        "#333331",
        [x, 0.088, 0.18],
        [0.047, 0.011, 0.009],
      );
      brow.rotation.z = i ? 0.08 : -0.08;
      this.brows[i] = brow;
    }
    // Replace the mannequin's cuboid mouth with a small rounded viseme surface.
    this.mouth.visible = false;
    this.mouth = ellipsoid(
      head,
      "#593a35",
      [0, -0.086, 0.194],
      [0.032, 0.006, 0.008],
    );
    // Bomber jacket: stand collar, ribbed hem, center opening, zipper and pockets.
    const collar = this.part(
      new THREE.TorusGeometry(0.115, 0.027, 8, 24),
      rib,
      torso,
      0,
      0.5,
      0,
    );
    collar.rotation.x = Math.PI / 2;
    this.box(0.14, 0.4, 0.035, cream, torso, 0, 0.24, 0.232);
    for (const side of [-1, 1]) {
      this.box(0.035, 0.43, 0.036, rib, torso, side * 0.089, 0.23, 0.245);
      const pocket = this.box(
        0.095,
        0.095,
        0.035,
        jacket,
        torso,
        side * 0.165,
        0.1,
        0.22,
      );
      pocket.rotation.z = side * 0.15;
      this.box(0.083, 0.009, 0.006, "#a5b6a5", pocket, 0, 0.028, 0.02);
      for (let i = 0; i < 4; i++)
        this.box(
          0.007,
          0.035,
          0.008,
          rib,
          torso,
          side * (0.105 + i * 0.035),
          -0.04,
          0.2,
        );
      const lower = this.bones[(side < 0 ? "left" : "right") + "LowerArm"];
      this.part(
        new THREE.CylinderGeometry(0.061, 0.061, 0.055, 16),
        rib,
        lower,
        0,
        -0.26,
        0,
      );
      // Individual knuckles and fingers instead of a single sphere hand.
      for (let finger = 0; finger < 4; finger++)
        ellipsoid(
          lower,
          skin,
          [(finger - 1.5) * 0.023, -0.345, 0.018],
          [0.014, 0.042, 0.021],
        );
      ellipsoid(
        lower,
        skin,
        [side * 0.055, -0.304, 0.027],
        [0.023, 0.04, 0.024],
      );
      const leg = this.bones[(side < 0 ? "left" : "right") + "UpperLeg"];
      this.box(0.045, 0.14, 0.11, "#344b50", leg, side * 0.084, -0.2, 0.005);
      this.box(0.047, 0.025, 0.12, "#405b60", leg, side * 0.087, -0.145, 0.005);
      const shin = this.bones[(side < 0 ? "left" : "right") + "LowerLeg"];
      this.box(0.18, 0.035, 0.3, "#9eaa9f", shin, 0, -0.38, 0.06);
      this.box(0.13, 0.045, 0.11, "#c6cbb9", shin, 0, -0.295, 0.08);
      for (let lace = 0; lace < 3; lace++)
        this.box(
          0.105,
          0.009,
          0.012,
          "#fbf3df",
          shin,
          0,
          -0.267,
          0.055 + lace * 0.027,
        );
    }
    this.box(0.009, 0.38, 0.012, "#b8b5a0", torso, 0, 0.23, 0.258);
    this.box(0.021, 0.032, 0.015, "#dac69a", torso, 0, 0.31, 0.267);
    // Small original embroidered patch and watch, no external branding.
    this.box(0.063, 0.065, 0.014, "#d7bb83", torso, -0.16, 0.34, 0.22);
    this.box(0.034, 0.009, 0.004, rib, torso, -0.16, 0.34, 0.23);
    const wrist = this.bones.leftLowerArm;
    this.box(0.085, 0.05, 0.019, "#202f33", wrist, 0, -0.257, 0.065);
    this.box(0.052, 0.032, 0.005, "#b9c9b9", wrist, 0, -0.257, 0.077);
    this.phone.material.roughness = 0.28;
  }

  setViseme(w: any) {
    const open = THREE.MathUtils.clamp(
      (w.aa || 0) +
        0.6 * (w.oh || 0) +
        0.4 * (w.ou || 0) +
        0.3 * (w.ee || 0) +
        0.2 * (w.ih || 0),
      0,
      1,
    );
    this.mouth.scale.set(0.032, 0.006 + open * 0.026, 0.008);
  }
}

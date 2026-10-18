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
        o.material.roughness = 0.78;
      }
    });
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
      m.scale.fromArray(scale);
      return m;
    };
    ellipsoid(head, skin, [0, -0.05, 0.015], [0.198, 0.181, 0.182]);
    ellipsoid(head, skin, [0, -0.016, 0.19], [0.035, 0.047, 0.037]);
    for (const side of [-1, 1]) {
      ellipsoid(
        head,
        "#a5725c",
        [side * 0.216, -0.003, 0.017],
        [0.024, 0.041, 0.023],
      );
      ellipsoid(
        head,
        skin,
        [side * 0.129, -0.047, 0.155],
        [0.059, 0.052, 0.029],
      );
    }
    // Swept, individually modeled hair locks, with a tapered back silhouette.
    for (let i = 0; i < 9; i++) {
      const m = ellipsoid(
        head,
        i % 3 ? "#273034" : "#354044",
        [(i - 4) * 0.041, 0.183 + Math.sin(i * 0.45) * 0.021, 0.06],
        [0.058, 0.076, 0.119],
      );
      m.rotation.z = -0.32;
      m.rotation.x = -0.22;
    }
    ellipsoid(head, hair, [0, 0.05, -0.12], [0.207, 0.172, 0.092]);
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
      this.brows[i].scale.set(1.16, 1.3, 1);
      this.brows[i].position.z = 0.199;
    }
    // Mouth remains the animated viseme surface, set in a subtle lip rim.
    this.mouth.position.z = 0.2;
    ellipsoid(head, "#945e50", [0, -0.086, 0.192], [0.047, 0.014, 0.009]);
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
}

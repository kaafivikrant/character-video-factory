import * as THREE from "three";
export class MannequinAdapter {
  root = new THREE.Group();
  bones: any = {};
  mouth: any;
  eyes: any[] = [];
  brows: any[] = [];
  phone: any;
  expressions: any = {};
  neck: any;
  constructor(public config: any) {
    this.root.position.fromArray(config.position);
    this.build();
  }
  async load() {
    return this.root;
  }
  part(geometry: any, color: string, parent: any, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.82,
        flatShading: true,
      }),
    );
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  box(
    w: number,
    h: number,
    d: number,
    color: string,
    parent: any,
    x = 0,
    y = 0,
    z = 0,
  ) {
    return this.part(new THREE.BoxGeometry(w, h, d), color, parent, x, y, z);
  }
  joint(name: string, parent: any, pos: number[]) {
    const g = new THREE.Group();
    g.position.fromArray(pos);
    parent.add(g);
    this.bones[name] = g;
    return g;
  }
  build() {
    const skin = "#bd8f73",
      hair = "#293236",
      hoodie = this.config.hoodie || "#c66b48",
      pants = this.config.pants || "#273b46";
    const hips = this.joint("hips", this.root, [0, 0.83, 0]);
    const torso = this.joint("spine", hips, [0, 0.15, 0]);
    this.part(
      new THREE.CylinderGeometry(0.25, 0.22, 0.55, 7),
      hoodie,
      torso,
      0,
      0.22,
      0,
    );
    this.box(0.12, 0.23, 0.02, "#e8d6b5", torso, 0, 0.27, 0.23);
    this.box(0.3, 0.13, 0.035, hoodie, torso, 0, 0.03, 0.22);
    this.neck = this.joint("neck", torso, [0, 0.52, 0]);
    this.part(new THREE.CylinderGeometry(0.095, 0.1, 0.12, 8), skin, this.neck);
    const head = this.joint("head", this.neck, [0, 0.18, 0]);
    this.part(new THREE.SphereGeometry(0.22, 9, 7), skin, head).scale.set(
      1,
      1.13,
      0.91,
    );
    this.part(
      new THREE.SphereGeometry(0.227, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.53),
      hair,
      head,
      0,
      0.045,
      0,
    );
    this.box(0.085, 0.04, 0.05, skin, head, 0, -0.015, 0.195);
    for (const x of [-0.085, 0.085]) {
      this.part(
        new THREE.SphereGeometry(0.045, 6, 5),
        skin,
        head,
        Math.sign(x) * 0.22,
        0,
        0,
      );
      const eye = this.box(
        0.049,
        0.025,
        0.016,
        "#1d282e",
        head,
        x,
        0.035,
        0.18,
      );
      this.eyes.push(eye);
      this.brows.push(this.box(0.067, 0.016, 0.02, hair, head, x, 0.085, 0.18));
    }
    this.mouth = this.box(
      0.078,
      0.016,
      0.018,
      "#49302c",
      head,
      0,
      -0.085,
      0.185,
    );
    for (const [side, x] of [
      ["left", -0.28],
      ["right", 0.28],
    ] as const) {
      const upper = this.joint(side + "UpperArm", torso, [x, 0.4, 0]);
      this.part(
        new THREE.CylinderGeometry(0.085, 0.07, 0.29, 6),
        hoodie,
        upper,
        0,
        -0.145,
        0,
      );
      const lower = this.joint(side + "LowerArm", upper, [0, -0.29, 0]);
      this.part(
        new THREE.CylinderGeometry(0.07, 0.055, 0.28, 6),
        hoodie,
        lower,
        0,
        -0.14,
        0,
      );
      this.part(
        new THREE.SphereGeometry(0.065, 7, 5),
        skin,
        lower,
        0,
        -0.31,
        0,
      );
      const leg = this.joint(side + "UpperLeg", hips, [x * 0.47, -0.07, 0]);
      this.part(
        new THREE.CylinderGeometry(0.105, 0.085, 0.36, 6),
        pants,
        leg,
        0,
        -0.18,
        0,
      );
      const shin = this.joint(side + "LowerLeg", leg, [0, -0.36, 0]);
      this.part(
        new THREE.CylinderGeometry(0.085, 0.07, 0.34, 6),
        pants,
        shin,
        0,
        -0.17,
        0,
      );
      this.box(0.17, 0.11, 0.29, "#ece4cf", shin, 0, -0.34, 0.06);
    }
    this.phone = this.box(
      0.105,
      0.18,
      0.022,
      "#202b35",
      this.bones.rightLowerArm,
      0,
      -0.3,
      0.065,
    );
    this.box(0.085, 0.14, 0.005, "#7cc8d5", this.phone, 0, 0, 0.014);
    this.phone.visible = false;
  }
  setExpression(name: string, w: number) {
    this.expressions[name] = w;
  }
  setViseme(w: any) {
    const open =
      (w.aa || 0) +
      0.6 * (w.oh || 0) +
      0.4 * (w.ou || 0) +
      0.3 * (w.ee || 0) +
      0.2 * (w.ih || 0);
    this.mouth.scale.y = 1 + open * 5;
    this.mouth.scale.x = 1 + 0.4 * (w.ee || 0) - 0.3 * (w.ou || 0);
  }
  setPose(pose: any) {
    for (const bone of Object.values(this.bones) as any[])
      bone.rotation.set(0, 0, 0);
    for (const [name, v] of Object.entries(pose) as any)
      if (this.bones[name]) this.bones[name].rotation.set(...v);
  }
  lookAt(target: any) {
    const rel = new THREE.Vector3().subVectors(target, this.root.position);
    this.neck.rotation.y = THREE.MathUtils.clamp(
      Math.atan2(rel.x, rel.z) - this.root.rotation.y,
      -0.35,
      0.35,
    );
  }
  update(dt: number) {
    const e = this.expressions;
    for (const eye of this.eyes)
      eye.scale.y = Math.max(
        0.05,
        (1 - (e.blink || 0)) * (1 + 0.7 * (e.surprised || 0)),
      );
    this.brows.forEach((b, i) => {
      b.rotation.z =
        (i ? 1 : -1) * ((e.angry || 0) * 0.5 - (e.sad || 0) * 0.35);
      b.position.y = 0.085 + (e.surprised || 0) * 0.02;
    });
  }
}

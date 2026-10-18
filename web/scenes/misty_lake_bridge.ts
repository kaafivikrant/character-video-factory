import * as THREE from "three";
export function mistyLake(scene: any, seed: number) {
  scene.background = new THREE.Color("#9bb3b8");
  scene.fog = new THREE.FogExp2("#9bb3b8", 0.045);
  const mat = (c: string) =>
    new THREE.MeshStandardMaterial({
      color: c,
      roughness: 0.9,
      flatShading: true,
    });
  const add = (g: any, m: any, x: number, y: number, z: number) => {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    scene.add(o);
    return o;
  };
  const stone = mat("#8a9691"),
    rail = mat("#5e7779");
  for (let i = -5; i < 13; i++) {
    add(new THREE.BoxGeometry(3.2, 0.18, 0.72), stone, 0, -0.16, -i * 0.75);
    for (const x of [-1.55, 1.55])
      if (i % 2 === 0)
        add(new THREE.BoxGeometry(0.13, 0.85, 0.13), rail, x, 0.28, -i * 0.75);
  }
  for (const x of [-1.55, 1.55])
    add(new THREE.BoxGeometry(0.15, 0.13, 14), rail, x, 0.7, -2.6);
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({
      color: "#527e87",
      roughness: 0.27,
      metalness: 0.38,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.4;
  scene.add(water);
  for (let i = 0; i < 36; i++) {
    const x = Math.sin(i * 12.3 + seed) * 13,
      z = -3 - i * 0.5;
    if (Math.abs(x) < 2) continue;
    const lily = add(
      new THREE.CylinderGeometry(0.22, 0.22, 0.02, 7),
      mat("#6c8b6b"),
      x,
      -0.37,
      z,
    );
    lily.rotation.y = i;
  }
  const pagoda = new THREE.Group();
  pagoda.position.set(-5, -0.3, -18);
  scene.add(pagoda);
  for (let i = 0; i < 3; i++) {
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(2.5 - i * 0.45, 0.7, 4),
      mat("#42585b"),
    );
    roof.position.y = 2 + i * 1.25;
    roof.rotation.y = Math.PI / 4;
    pagoda.add(roof);
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(2 - i * 0.3, 1.2, 2 - i * 0.3),
      mat("#647779"),
    );
    pillar.position.y = 1.3 + i * 1.25;
    pagoda.add(pillar);
  }
  for (let i = 0; i < 12; i++) {
    const hill = add(
      new THREE.ConeGeometry(9, 7 + (i % 4), 7),
      mat("#819da1"),
      Math.sin(i * 3.2) * 35,
      0,
      -35 - i,
    );
    hill.scale.z = 0.65;
  }
  return {
    update: (t: number) => {
      water.material.color.setHSL(0.53, 0.22, 0.4 + Math.sin(t * 0.7) * 0.005);
    },
  };
}

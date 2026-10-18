import * as THREE from "three";
export function streetNight(scene: any, seed: number) {
  scene.background = new THREE.Color("#142530");
  scene.fog = new THREE.FogExp2("#142530", 0.055);
  const mesh = (
    g: any,
    c: string,
    x: number,
    y: number,
    z: number,
    emissive = false,
  ) => {
    const o = new THREE.Mesh(
      g,
      new THREE.MeshStandardMaterial({
        color: c,
        roughness: emissive ? 0.35 : 0.6,
        metalness: 0.25,
        ...(emissive ? { emissive: c, emissiveIntensity: 2 } : {}),
      }),
    );
    o.position.set(x, y, z);
    o.receiveShadow = true;
    o.castShadow = !emissive;
    scene.add(o);
    return o;
  };
  mesh(new THREE.BoxGeometry(40, 0.2, 60), "#243b44", 0, -0.15, -12);
  for (const side of [-1, 1])
    for (let i = 0; i < 9; i++) {
      mesh(
        new THREE.BoxGeometry(3, 5 + (i % 3), 3),
        "#263942",
        side * 4,
        2.5,
        -i * 4,
      );
      mesh(
        new THREE.BoxGeometry(0.05, 0.7, 1.8),
        i % 2 ? "#e7956f" : "#65bdbd",
        side * 2.47,
        2.4,
        -i * 4,
        true,
      );
      for (let j = 0; j < 3; j++)
        mesh(
          new THREE.BoxGeometry(0.03, 0.6, 0.4),
          "#d7ae76",
          side * 2.48,
          3.5 + j * 0.8,
          -i * 4,
          true,
        );
    }
  return { update: (t: number) => {} };
}

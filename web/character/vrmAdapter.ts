import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "virtual:vrm";
// Optional package is dynamically resolved at runtime so the mannequin remains available offline.
export class VRMAdapter {
  root = new THREE.Group();
  vrm: any;
  phone: any;
  expressions: any = {};
  constructor(public config: any) {}
  async load() {
    const loader = new GLTFLoader();
    loader.register((p) => new VRMLoaderPlugin(p));
    const gltf: any = await loader.loadAsync("/" + this.config.model);
    this.vrm = gltf.userData.vrm;
    if (!this.vrm) throw new Error("File does not contain a VRM");
    VRMUtils.rotateVRM0(this.vrm);
    this.root.add(this.vrm.scene);
    this.root.position.fromArray(this.config.position);
    return this.root;
  }
  setExpression(n: string, w: number) {
    this.expressions[n] = w;
    this.vrm.expressionManager?.setValue(n, w);
  }
  setViseme(w: any) {
    for (const [n, v] of Object.entries(w))
      this.vrm.expressionManager?.setValue(n, v);
  }
  setPose(p: any) {
    this.vrm.humanoid?.resetNormalizedPose();
    for (const [n, v] of Object.entries(p) as any)
      this.vrm.humanoid?.getNormalizedBoneNode(n)?.rotation.set(...v);
  }
  lookAt(target: any) {
    this.vrm.lookAt?.lookAt(target);
  }
  update(dt: number) {
    this.vrm.update(dt);
  }
}

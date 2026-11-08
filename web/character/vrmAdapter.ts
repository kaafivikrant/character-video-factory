import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from 'virtual:vrm';
import { solveLeg } from '../../src/timeline/motion';
export class VRMAdapter {
  root=new THREE.Group();vrm:any;phone:any;expressions:any={};metrics:any;body:any;
  vrm0=false;
  constructor(public config:any){}
  bone(name:string){return this.vrm.humanoid.getNormalizedBoneNode(name);}
  point(name:string){return this.bone(name)?.getWorldPosition(new THREE.Vector3());}
  async load(){
    const loader=new GLTFLoader();loader.register(p=>new VRMLoaderPlugin(p));
    const gltf:any=await loader.loadAsync(this.config.modelUrl||'/'+this.config.model);
    this.vrm=gltf.userData.vrm;if(!this.vrm)throw new Error('File does not contain a VRM');
    this.vrm0=this.vrm.meta?.metaVersion==='0';VRMUtils.rotateVRM0(this.vrm);
    this.root.add(this.vrm.scene);this.root.updateMatrixWorld(true);
    const hip=this.point('hips'),upper=this.point('leftUpperLeg'),knee=this.point('leftLowerLeg'),foot=this.point('leftFoot');
    const bounds=new THREE.Box3().setFromObject(this.root);
    this.metrics={height:bounds.max.y-bounds.min.y,hip:hip.y,upper:upper.y,thigh:upper.distanceTo(knee),shin:knee.distanceTo(foot),ankle:foot.y,head:this.point('head').y};
    this.metrics.seatHeight=this.metrics.ankle+this.metrics.shin*0.97;
    this.vrm.scene.traverse((o:any)=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    const hand=this.bone('rightHand');
    if(hand){
      this.phone=new THREE.Group();
      const body=new THREE.Mesh(new THREE.BoxGeometry(.085,.16,.017),new THREE.MeshStandardMaterial({color:'#142332',roughness:.3,metalness:.5}));
      const screen=new THREE.Mesh(new THREE.BoxGeometry(.073,.14,.002),new THREE.MeshStandardMaterial({color:'#8ddbd3',emissive:'#5aaca8',emissiveIntensity:.45}));screen.position.z=.01;
      this.phone.add(body,screen);this.phone.rotation.z=this.vrm0?-Math.PI/2:Math.PI/2;
      this.phone.position.set(this.vrm0 ? .045 : -.045,0,.035);hand.add(this.phone);
      this.phone.visible=this.config.prop==='phone';
    }
    this.root.position.fromArray(this.config.position);return this.root;
  }
  setExpression(n:string,w:number){this.expressions[n]=w;this.vrm.expressionManager?.setValue(n,w);}
  setViseme(w:any){for(const [n,v] of Object.entries(w))this.vrm.expressionManager?.setValue(n,v);}
  setBody(body:any){this.body=body;}
  setPose(input:any){
    const p={...input},m=this.metrics,b=this.body||{seated:0,gait:null};
    const crouch=b.gait?.run ? .06 : .025;
    const seatDrop=m.seatHeight+.065-m.hip;
    const offset=seatDrop*b.seated-crouch*(1-b.seated)*(b.gait?.weight||0);
    this.root.position.y=(b.position?.[1]??this.config.position[1])+offset;
    for(const [i,side] of ['left','right'].entries()){
      const foot=b.gait?.feet[i]||{z:0,lift:0};
      const targetZ=foot.z*(1-b.seated)+m.thigh*.98*b.seated;
      const [upper,knee,ankle]=solveLeg(m.thigh,m.shin,m.upper+offset-m.ankle-foot.lift,targetZ);
      p[side+'UpperLeg']=[upper,0,0];p[side+'LowerLeg']=[knee,0,0];p[side+'Foot']=[ankle,0,0];
    }
    this.vrm.humanoid.resetNormalizedPose();
    const k=this.vrm0?-1:1;
    for(const [name,r] of Object.entries(p) as any){this.bone(name)?.quaternion.setFromEuler(new THREE.Euler(r[0]*k,r[1],r[2]*k));}
    this.vrm.humanoid.update();this.root.updateMatrixWorld(true);
  }
  lookAt(target:any){this.vrm.lookAt?.lookAt(target);}
  update(dt:number){this.vrm.update(0);this.root.updateMatrixWorld(true);}
  diagnostics(){
    const points=Object.fromEntries(['hips','head','leftHand','rightHand','leftFoot','rightFoot'].map(n=>[n,this.point(n)?.toArray()]));
    return {points,seatHeight:this.metrics.seatHeight,root:this.root.position.toArray(),yaw:this.root.rotation.y};
  }
}

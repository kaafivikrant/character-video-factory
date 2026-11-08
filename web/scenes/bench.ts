import * as THREE from 'three';
export function addBench(scene:any, position:number[], height:number, yaw=0) {
 const group=new THREE.Group();group.position.fromArray(position);group.rotation.y=yaw;
 const part=(w:number,h:number,d:number,color:string,x:number,y:number,z:number)=>{
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.75}));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
 };
 part(.9,.07,.46,'#b47643',0,height-.035,-.08);
 for(const x of [-.36,.36]){part(.055,height,.055,'#1e3540',x,height/2,-.21);part(.055,height,.055,'#1e3540',x,height/2,.08);part(.045,.55,.045,'#1e3540',x,height+.24,-.28);}
 part(.9,.18,.05,'#b47643',0,height+.3,-.28);scene.add(group);return group;
}

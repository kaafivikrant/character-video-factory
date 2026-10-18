import * as THREE from 'three';
export class MannequinAdapter {
 root=new THREE.Group();bones:any={};mouth:any;eyes:any[]=[];brows:any[]=[];phone:any;expressions:any={};neck:any;
 constructor(public config:any){this.root.position.fromArray(config.position);this.build();}
 async load(){return this.root;}
 part(geometry:any,color:string,parent:any,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.82,flatShading:true}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 box(w:number,h:number,d:number,color:string,parent:any,x=0,y=0,z=0){return this.part(new THREE.BoxGeometry(w,h,d),color,parent,x,y,z);}
 joint(name:string,parent:any,pos:number[]){const g=new THREE.Group();g.position.fromArray(pos);parent.add(g);this.bones[name]=g;return g;}
 build(){const skin='#bd8f73',hair='#293236',hoodie=this.config.hoodie||'#c66b48',pants=this.config.pants||'#273b46';
 const hips=this.joint('hips',this.root,[0,.83,0]);const torso=this.joint('spine',hips,[0,.15,0]);this.part(new THREE.CylinderGeometry(.25,.22,.55,7),hoodie,torso,0,.22,0);this.box(.12,.23,.02,'#e8d6b5',torso,0,.27,.23);this.box(.3,.13,.035,hoodie,torso,0,.03,.22);
 this.neck=this.joint('neck',torso,[0,.52,0]);this.part(new THREE.CylinderGeometry(.095,.1,.12,8),skin,this.neck);
 const head=this.joint('head',this.neck,[0,.18,0]);this.part(new THREE.SphereGeometry(.22,9,7),skin,head).scale.set(1,1.13,.91);this.part(new THREE.SphereGeometry(.227,8,5,0,Math.PI*2,0,Math.PI*.53),hair,head,0,.045,0);
 this.box(.085,.04,.05,skin,head,0,-.015,.195);for(const x of [-.085,.085]){this.part(new THREE.SphereGeometry(.045,6,5),skin,head,Math.sign(x)*.22,0,0);const eye=this.box(.049,.025,.016,'#1d282e',head,x,.035,.18);this.eyes.push(eye);this.brows.push(this.box(.067,.016,.02,hair,head,x,.085,.18));}
 this.mouth=this.box(.078,.016,.018,'#49302c',head,0,-.085,.185);
 for(const [side,x]of [['left',-.28],['right',.28]] as const){const upper=this.joint(side+'UpperArm',torso,[x,.4,0]);this.part(new THREE.CylinderGeometry(.085,.07,.29,6),hoodie,upper,0,-.145,0);const lower=this.joint(side+'LowerArm',upper,[0,-.29,0]);this.part(new THREE.CylinderGeometry(.07,.055,.28,6),hoodie,lower,0,-.14,0);this.part(new THREE.SphereGeometry(.065,7,5),skin,lower,0,-.31,0);const leg=this.joint(side+'UpperLeg',hips,[x*.47,-.07,0]);this.part(new THREE.CylinderGeometry(.105,.085,.36,6),pants,leg,0,-.18,0);const shin=this.joint(side+'LowerLeg',leg,[0,-.36,0]);this.part(new THREE.CylinderGeometry(.085,.07,.34,6),pants,shin,0,-.17,0);this.box(.17,.11,.29,'#ece4cf',shin,0,-.34,.06);}
 this.phone=this.box(.105,.18,.022,'#202b35',this.bones.rightLowerArm,0,-.3,.065);this.box(.085,.14,.005,'#7cc8d5',this.phone,0,0,.014);this.phone.visible=false;
 }
 setExpression(name:string,w:number){this.expressions[name]=w;}
 setViseme(w:any){const open=(w.aa||0)+.6*(w.oh||0)+.4*(w.ou||0)+.3*(w.ee||0)+.2*(w.ih||0);this.mouth.scale.y=1+open*5;this.mouth.scale.x=1+.4*(w.ee||0)-.3*(w.ou||0);}
 setPose(pose:any){for(const bone of Object.values(this.bones) as any[])bone.rotation.set(0,0,0);for(const [name,v]of Object.entries(pose) as any)if(this.bones[name])this.bones[name].rotation.set(...v);}
 lookAt(target:any){const rel=new THREE.Vector3().subVectors(target,this.root.position);this.neck.rotation.y=THREE.MathUtils.clamp(Math.atan2(rel.x,rel.z)-this.root.rotation.y,-.35,.35);}
 update(dt:number){const e=this.expressions;for(const eye of this.eyes)eye.scale.y=Math.max(.05,(1-(e.blink||0))*(1+.7*(e.surprised||0)));this.brows.forEach((b,i)=>{b.rotation.z=(i?1:-1)*((e.angry||0)*.5-(e.sad||0)*.35);b.position.y=.085+(e.surprised||0)*.02;});}
}

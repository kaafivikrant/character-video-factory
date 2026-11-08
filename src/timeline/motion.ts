import { Euler, Quaternion } from 'three';
import { ease } from './gestures';
export type Vec3 = [number, number, number];
export type Pose = Record<string, Vec3>;
export function compileActions(spec: any, lines: any[], total: number) {
  const actions = (spec.actions || []).map((a: any) => ({...a, start:lines[a.at_line-1].start+a.offset})).sort((a:any,b:any)=>a.start-b.start);
  const states = new Map(spec.characters.map((c:any)=>[c.id,{position:[...c.position],end:0,seated:c.posture==='seated'}]));
  return actions.map((a:any)=>{
    const s:any=states.get(a.character);
    if(a.start<s.end-1e-6) throw new Error(`Overlapping actions for ${a.character}`);
    if(a.start+a.duration>total+1e-6) throw new Error(`Action for ${a.character} extends beyond the video`);
    const moving=a.type==='walk'||a.type==='run';
    if(moving && s.seated) throw new Error(`${a.character} must stand before walking/running`);
    if(moving && Math.abs(a.to[1]-s.position[1])>0.001) throw new Error('Walking/running currently requires a level floor');
    const result={...a,end:a.start+a.duration,from:[...s.position],seatedFrom:s.seated};
    if(moving) s.position=[...a.to];
    else s.seated=a.type==='sit';
    s.end=result.end;
    return result;
  });
}
export function sampleMotion(config:any, actions:any[], time:number) {
  let position=[...config.position] as Vec3, seated=config.posture==='seated'?1:0;
  let gait:any=null;
  for(const a of actions.filter(a=>a.character===config.id)) {
    if(time<a.start) break;
    const p=ease((time-a.start)/a.duration);
    if(a.type==='walk'||a.type==='run') {
      position=a.from.map((v:number,i:number)=>v+(a.to[i]-v)*p) as Vec3;
      if(time<a.end) {
        const dx=a.to[0]-a.from[0],dz=a.to[2]-a.from[2], distance=Math.hypot(dx,dz);
        const steps=Math.max(2,Math.ceil(distance/(a.type==='run'?0.4:0.22)/2)*2);
        const phase=p*steps;
        const feet=[0,1].map(side=>{
          let along=0, lift=0;
          for(let step=side;step<steps;step+=2) {
            if(phase<step) break;
            const u=Math.min(1,phase-step), next=Math.min(1,(step+2)/steps);
            const from=step<2?0:Math.min(1,step/steps);
            along=from+(next-from)*ease(u);
            lift=Math.sin(Math.PI*u)*(a.type==='run'?0.12:0.065);
          }
          return {z:(along-p)*distance,lift};
        });
        gait={feet,yaw:Math.atan2(dx,dz),weight:ease((time-a.start)/0.18)*ease((a.end-time)/0.18),phase,run:a.type==='run'};
      }
    } else seated=Number(a.seatedFrom)+(Number(a.type==='sit')-Number(a.seatedFrom))*p;
  }
  return {position,seated,gait};
}
export function blendPose(base:Pose, target:Pose, weight:number):Pose {
  const result={...base};
  for(const [bone,rotation] of Object.entries(target)) {
    const q=new Quaternion().setFromEuler(new Euler(...(base[bone]||[0,0,0])));
    q.slerp(new Quaternion().setFromEuler(new Euler(...rotation)),Math.max(0,Math.min(1,weight)));
    const e=new Euler().setFromQuaternion(q); result[bone]=[e.x,e.y,e.z];
  }
  return result;
}
// Canonical VRM1 axes: forward +Z, left arm +X. Adapter handles VRM0 conversion.
export function actingPose(time:number, seed:number, line:any, phone:boolean, seated:number, gait:any):Pose {
  const phase=seed*0.7;
  let pose:Pose={
    leftUpperArm:[0,0,-1.32],rightUpperArm:[0,0,1.32],
    leftLowerArm:[0,-0.14,0],rightLowerArm:[0,0.14,0],
    spine:[Math.sin(time*1.8+phase)*0.009+seated*0.035,0,Math.sin(time*0.8+phase)*0.012],
    head:[Math.sin(time*1.1+phase)*0.015,0,Math.sin(time*0.7+phase)*0.012],
  };
  if(gait) {
    const swing=Math.sin(gait.phase*Math.PI)*0.35*gait.weight;
    pose.leftUpperArm=[swing,0,-1.32];pose.rightUpperArm=[-swing,0,1.32];
    if(gait.run){pose.leftLowerArm=[0,-0.95,0];pose.rightLowerArm=[0,0.95,0];pose.spine[0]=-0.1;}
  }
  const grip=(amount:number)=>{
    for(const finger of ['Index','Middle','Ring','Little'])
      for(const part of ['Proximal','Intermediate','Distal'])pose[`right${finger}${part}`]=[0,0,amount];
    pose.rightThumbMetacarpal=[0,0.4,-0.25];pose.rightThumbProximal=[0,0.2,0.3];
  };
  if(phone){pose.rightUpperArm=[-0.25,0,1.12];pose.rightLowerArm=[0,1.35,0];grip(0.6);}
  if(!line) {pose.head[0]+=Math.sin(time*2.2+phase)*0.018;return pose;}
  const elapsed=time-line.start,duration=line.end-line.start;
  const envelope=ease(elapsed/0.32)*ease((duration-elapsed)/0.38);
  const beat=0.78+0.22*Math.sin(elapsed*3.8);
  const arm=phone?'left':'right', sign=arm==='left'?-1:1;
  const upper=`${arm}UpperArm`,lower=`${arm}LowerArm`,hand=`${arm}Hand`;
  const gestures:Record<string,Pose>={
    hold_phone:{head:[0.13,0,0],leftUpperArm:[-0.3,0,-1.15],leftLowerArm:[0,-0.7,0]},
    palm_out:{[upper]:[-0.45,0,sign*0.85],[lower]:[0,sign*1.1,0],[hand]:[0,-sign*0.35,0]},
    point:{[upper]:[-0.6,0,sign*0.65],[lower]:[0,sign*0.6,0],head:[-0.03,sign*0.05,0]},
    shrug:{leftUpperArm:[-0.15,0,-0.8],leftLowerArm:[0,-1.1,0],rightUpperArm:[-0.15,0,0.8],rightLowerArm:[0,1.1,0],head:[0.02,0,0.12]},
    open_arms:{leftUpperArm:[-0.2,0,-0.7],leftLowerArm:[0,-0.5,0],rightUpperArm:[-0.2,0,0.7],rightLowerArm:[0,0.5,0]},
    hand_to_chest:{[upper]:[-0.45,0,sign*1.0],[lower]:[0,sign*1.7,0]},
    hand_to_neck:{[upper]:[-0.75,0,sign*0.8],[lower]:[0,sign*1.9,0],head:[0.05,0,-sign*0.1]},
    head_down:{head:[0.22,0,0]},look_away:{head:[0.03,0.28,0.06]},
    lean_in:{spine:[0.12,0,0],head:[-0.05,0,0]},step_back:{head:[-0.08,0,0.09]},
    big_gesture:{leftUpperArm:[-0.5,0,-0.45],rightUpperArm:[-0.5,0,0.45],leftLowerArm:[0,-1.0,0],rightLowerArm:[0,1.0,0]},
  };
  let target={...(gestures[line.gesture]||{})};
  // Keep the phone hand gripping it even during broad gestures.
  if(phone){delete target.rightUpperArm;delete target.rightLowerArm;}
  pose=blendPose(pose,target,envelope*(0.55+line.intensity*0.45)*beat);
  pose.head[0]+=Math.sin(elapsed*4.5)*0.025*envelope;
  return pose;
}
/** Two-segment sagittal IK with a level foot, measured per avatar. */
export function solveLeg(thigh:number, shin:number, down:number, forward:number):Vec3 {
  const r=Math.max(0.01,Math.min(thigh+shin-0.0001,Math.hypot(down,forward)));
  const clamp=(v:number)=>Math.max(-1,Math.min(1,v));
  const upper=-(Math.atan2(forward,down)+Math.acos(clamp((thigh*thigh+r*r-shin*shin)/(2*thigh*r))));
  const lower=Math.PI-Math.acos(clamp((thigh*thigh+shin*shin-r*r)/(2*thigh*shin)));
  return [upper,lower,-upper-lower];
}

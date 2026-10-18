import {loadSpec} from '../src/spec/load';import {buildTimeline} from '../src/timeline/build';import {launch} from '../src/render/launch';
try {const s=loadSpec('specs/short_8s.yaml');const t=buildTimeline(s,s.lines.map(()=>({duration:2,TEST_ONLY:true})));const stage=await launch(t);try {console.log(stage.info);await stage.page.evaluate(()=>(window as any).__stage.renderFrame(0));}finally{await stage.close();}}
catch(e){console.error('Browser smoke blocked:',e.message);process.exitCode=1;}

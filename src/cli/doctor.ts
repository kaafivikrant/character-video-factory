import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {chromiumPath} from '../render/launch';
const rows:any[]=[];
function check(name:string,f:()=>any,fallback=''){try{const detail=f();rows.push({check:name,status:detail?'PASS':'FAIL',detail:detail===true?'available':detail||fallback});}catch{rows.push({check:name,status:'FAIL',detail:fallback||'unavailable'});}}
const cmd=(x:string,a:string[]=[])=>execFileSync(x,a,{encoding:'utf8',stdio:['ignore','pipe','pipe']});
check('Node >=20',()=>Number(process.versions.node.split('.')[0])>=20);
check('pnpm',()=>cmd('pnpm',['--version']).trim());
check('ffmpeg',()=>cmd('ffmpeg',['-version']).split('\n')[0]);
check('H.264 VideoToolbox',()=>cmd('ffmpeg',['-hide_banner','-encoders']).includes('h264_videotoolbox'),'libx264 fallback');
check('libass',()=>cmd('ffmpeg',['-hide_banner','-filters']).includes(' ass '),'browser canvas captions fallback');
check('ffprobe',()=>cmd('ffprobe',['-version']).split('\n')[0]);
check('Rhubarb',()=>cmd('./tools/rhubarb/rhubarb',['--version']).trim(),'energy lip sync fallback');
check('Chromium',()=>Boolean(chromiumPath()),'run pnpm exec playwright install chromium');
check('Fish key in environment',()=>Boolean(process.env.FISH_API_KEY),'mock TTS');
check('macOS say',()=>cmd('which',['say']).trim());
try{await fetch('https://api.fish.audio',{signal:AbortSignal.timeout(8000)});rows.push({check:'Fish network',status:'PASS',detail:'reachable'});}catch{rows.push({check:'Fish network',status:'FAIL',detail:'mock TTS fallback'});}
console.table(rows);console.log('Doctor reports capability failures without blocking available fallbacks.');
if(process.argv.includes('--strict')&&rows.some(r=>r.status==='FAIL'))process.exitCode=1;

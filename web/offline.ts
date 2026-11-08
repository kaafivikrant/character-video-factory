import './stage';
(async()=>{
const stage=(window as any).__stage,t=(window as any).__OFFLINE_TIMELINE__;
const info=await stage.load(t);
const controls=document.createElement('div');controls.id='controls';
controls.innerHTML='<b>Character motion review</b><p id="status">Ready</p><input id="frame" aria-label="Frame" type="number" min="0" value="0"><button id="show">Show frame</button><button id="play">Play preview</button><button id="render">Export silent MP4</button><button id="still">Save current frame</button><button id="audit">Export diagnostics</button><pre id="readout"></pre>';
document.body.appendChild(controls);const status=document.getElementById('status')!,readout=document.getElementById('readout')!;
const field=document.getElementById('frame') as HTMLInputElement;field.max=String(t.frames-1);
function show(i:number){stage.renderFrame(i);field.value=String(i);readout.textContent=JSON.stringify({seconds:i/t.fps,characters:stage.diagnostics},null,1);}
function save(name:string,b:Blob){const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),10000);}
document.getElementById('show')!.onclick=()=>show(Math.min(t.frames-1,Math.max(0,Number(field.value))));
let timer:any;
document.getElementById('play')!.onclick=()=>{if(timer){clearInterval(timer);timer=null;return;}let i=Number(field.value);timer=setInterval(()=>{show(i++%t.frames)},1000/t.fps);};
document.getElementById('still')!.onclick=()=>stage.canvas.toBlob((b:Blob)=>save(`review-frame-${field.value}.png`,b));
document.getElementById('audit')!.onclick=()=>{
 const values=[];const indices=[0,.2,.4,.6,.8].map(x=>Math.floor(x*(t.frames-1)));
 for(const i of [...indices,...indices.slice().reverse()]){stage.renderFrame(i);values.push({frame:i,characters:stage.diagnostics,mouth:stage.mouthState,jpeg:stage.canvas.toDataURL('image/jpeg',.92)});}
 save('motion-diagnostics.json',new Blob([JSON.stringify({info,values})],{type:'application/json'}));show(0);
};
document.getElementById('render')!.onclick=async()=>{clearInterval(timer);timer=null;status.textContent='Rendering frames…';await new Promise(r=>setTimeout(r,100));try{
 const encoded=await stage.exportMP4();const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));save('silent.mp4',new Blob([bytes],{type:'video/mp4'}));status.textContent=`Complete: ${t.frames} frames, ${(t.frames/t.fps).toFixed(2)} seconds`;
}catch(e){status.textContent='Render failed: '+(e as Error).message;}};
status.textContent=`Ready: ${info.renderer}`;show(Math.min(t.frames-1,Math.max(0,Number(new URLSearchParams(location.search).get('frame')||0))));
})().catch(e=>{document.body.textContent='Preview failed: '+e.message;});

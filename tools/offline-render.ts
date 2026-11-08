// Server-free rendering fallback: package the same stage and assets as a local HTML file.
import {build} from 'vite';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const input=process.argv[2],dir=process.argv[3];
if(!input||!dir)throw new Error('Usage: node --import tsx tools/offline-render.ts timeline.json output-directory');
const timeline=JSON.parse(readFileSync(input,'utf8'));
for(const c of timeline.spec.characters){delete c.voice;c.modelUrl='data:model/gltf-binary;base64,'+readFileSync(c.model).toString('base64');}
const built:any=await build({configFile:resolve('web/vite.config.ts'),logLevel:'error',build:{write:false,minify:true,target:'esnext',lib:{entry:resolve('web/offline.ts'),formats:['iife'],name:'Preview'},rollupOptions:{output:{inlineDynamicImports:true}}}});
const js=built[0].output.find((o:any)=>o.type==='chunk').code;
mkdirSync(dir,{recursive:true});
writeFileSync(`${dir}/preview.html`,`<!doctype html><meta charset="utf-8"><title>Character motion review</title><style>body{margin:0;background:#111923;color:white;font:14px system-ui;display:flex;justify-content:center}canvas{height:94vh;width:auto}#controls{position:fixed;left:8px;top:8px;background:#192634;padding:12px;border-radius:8px;max-width:260px;z-index:2}button,input{font:inherit;margin:5px;padding:8px}pre{white-space:pre-wrap;font-size:11px}</style><body><script>window.__OFFLINE_TIMELINE__=${JSON.stringify(timeline).replaceAll('<','\\u003c')};</script><script>${js.replaceAll('</script','<\\/script')}</script>`);
console.log(`Offline preview: ${dir}/preview.html`);

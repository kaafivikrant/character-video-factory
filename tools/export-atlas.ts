import {writeFileSync} from 'node:fs';import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';import {AtlasAdapter} from '../web/character/atlas';import {loadSpec} from '../src/spec/load';
// GLTFExporter requires FileReader even without textures; only in-memory Blob reads are needed.
(globalThis as any).FileReader=class {result:any;onloadend:any;onerror:any;readAsArrayBuffer(blob:Blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();}).catch(error=>this.onerror?.(error));}};
const a=new AtlasAdapter(loadSpec('specs/khan_30s.yaml').characters[0]);a.root.name='Atlas — original detailed character';
const glb=await new GLTFExporter().parseAsync(a.root,{binary:true});
if(!(glb instanceof ArrayBuffer))throw new Error('Expected binary GLB');
writeFileSync('assets/characters/atlas.glb',Buffer.from(glb));
const loaded=await new GLTFLoader().parseAsync(glb,'');let meshes=0;loaded.scene.traverse((o:any)=>{if(o.isMesh)meshes++;});console.log(JSON.stringify({file:'assets/characters/atlas.glb',bytes:glb.byteLength,verifiedMeshes:meshes}));

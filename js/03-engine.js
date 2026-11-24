/* 學習冒險城．js/03-engine.js
 * three.js 場景、燈光、模型包載入、程式產生的貼圖與文字
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ======================= THREE ======================= */
const canvas=$('world');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color('#9fcbe8');
scene.fog=new THREE.Fog('#c9e0ec',80,190);
const camera=new THREE.PerspectiveCamera(52,1,0.1,500);
scene.add(new THREE.HemisphereLight('#f3f7ff','#6b5a3a',0.62));
const sun=new THREE.DirectionalLight('#fff0d4',0.95);
sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-55,right:55,top:55,bottom:-55,near:1,far:180}); sun.shadow.bias=-0.0006;
scene.add(sun,sun.target);
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
addEventListener('resize',resize); resize();

/* ======================= LOADING ======================= */
try{window.createImageBitmap=undefined;}catch(e){}
const loader=new THREE.GLTFLoader();
const models={};
async function fetchBuf(url,onp){
  const r=await fetch(url); if(!r.ok) throw new Error(url+' '+r.status);
  const total=+r.headers.get('content-length')||0;
  if(!r.body||!r.body.getReader||!total||!onp){ const b=await r.arrayBuffer(); onp&&onp(1); return b; }
  const rd=r.body.getReader(); const chunks=[]; let got=0;
  for(;;){ const {done,value}=await rd.read(); if(done) break; chunks.push(value); got+=value.length; onp(Math.min(.97,got/total)); }
  const out=new Uint8Array(got); let o=0; for(const c of chunks){out.set(c,o);o+=c.length;} onp(1); return out.buffer;
}
const packs={};
function loadPack(name,onp){
  if(packs[name]) return packs[name];
  return packs[name]=(async()=>{
    const buf=await fetchBuf(`assets/${name}.pack.wasm`,onp); const dv=new DataView(buf); const jl=dv.getUint32(0,true);
    const idx=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,4,jl))); const base=4+jl;
    for(const [n,[o,l]] of Object.entries(idx)){ if(models[n]) continue;
      await new Promise(res=>loader.parse(buf.slice(base+o,base+o+l),'',g=>{g.scene.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});models[n]=g;res();},e=>{console.warn(n,e);res();})); }
  })();
}

function place(name,x,z,{s=1,ry=0,y=0,shadow=true,face=false}={}){
  const g=models[name]; if(!g) return null;
  const o=g.scene.clone(true); o.position.set(x,y,z); o.scale.setScalar(s);
  o.rotation.y=face?Math.atan2(-x,-z):ry;
  if(!shadow) o.traverse(m=>{if(m.isMesh)m.castShadow=false;});
  scene.add(o); return o;
}

/* ======================= TEXTURES ======================= */
function canvasTex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;if(rep)t.repeat.set(rep,rep);t.anisotropy=4;return t;}
const grassTex=canvasTex(256,256,(x,w,h)=>{x.fillStyle='#7fae4c';x.fillRect(0,0,w,h);for(let i=0;i<900;i++){x.fillStyle=['#76a446','#89b955','#6f9a40','#93c25d'][i%4];x.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*3,2+Math.random()*5);}},40);
const cobbleTex=canvasTex(256,256,(x,w,h)=>{x.fillStyle='#8c8174';x.fillRect(0,0,w,h);for(let r=0;r<8;r++)for(let c=0;c<8;c++){const ox=(r%2)*16;const g=150+Math.random()*40|0;x.fillStyle=`rgb(${g},${g-8},${g-20})`;x.beginPath();x.roundRect?x.roundRect(c*32+ox+2,r*32+2,28,28,7):x.rect(c*32+ox+2,r*32+2,28,28);x.fill();}},1);
const dirtTex=canvasTex(128,128,(x,w,h)=>{x.fillStyle='#b8925c';x.fillRect(0,0,w,h);for(let i=0;i<500;i++){x.fillStyle=['#a8834f','#c7a06a','#9c7845'][i%3];x.fillRect(Math.random()*w,Math.random()*h,2,2);}},1);

function labelSprite(text,{bg='#2a1b12',fg='#fbf3e1',border='#e2b04a',size=1}={}){
  const c=document.createElement('canvas');const ctx=c.getContext('2d');
  const font='bold 60px "LXGW WenKai TC","Noto Sans TC","Microsoft JhengHei",serif';
  ctx.font=font; const w=Math.ceil(ctx.measureText(text).width)+64; c.width=w; c.height=104;
  ctx.font=font; ctx.fillStyle=bg; ctx.strokeStyle=border; ctx.lineWidth=6;
  const r=18; ctx.beginPath();ctx.moveTo(r+4,4);ctx.arcTo(w-4,4,w-4,100,r);ctx.arcTo(w-4,100,4,100,r);ctx.arcTo(4,100,4,4,r);ctx.arcTo(4,4,w-4,4,r);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=fg; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(text,w/2,56);
  const tex=new THREE.CanvasTexture(c); tex.encoding=THREE.sRGBEncoding;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthWrite:false,fog:false}));
  sp.scale.set(w/104*1.5*size,1.5*size,1); sp.renderOrder=5; return sp;
}

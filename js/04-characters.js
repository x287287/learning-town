/* 學習冒險城．js/04-characters.js
 * 角色：KayKit 角色組裝、角色編輯器零件化角色、動畫
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ======================= CHARACTERS ======================= */
let CLIPS={};
const ONCE=['jump','cheer','interact','chop','castShot','shoot','slash2','hit','death','skAwaken','skDeath','skInactive','skRevive'];
function buildCharacter(look){
  if(look.hero&&models.hero) return buildHero(look);
  const bc=(CLASSES[look.cls]&&CLASSES[look.cls].base)||look.cls;
  const g=models['ch_'+bc]; const root=THREE.SkeletonUtils.clone(g.scene);
  const C=CLASSES[bc];
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false;}});
  for(const n of GEAR_ALL){const o=root.getObjectByName(n); if(o) o.visible=(n===look.main)||(n===look.off&&!TWO_HANDED.has(look.main));}
  if(C.hat){const h=root.getObjectByName(C.hat); if(h) h.visible=!!look.hat;}
  const cape=root.getObjectByName(C.cape);
  if(cape){const cc=CAPES.find(c=>c.id===look.cape)||CAPES[1]; cape.visible=!!cc.color;
    if(cc.color) cape.traverse(m=>{if(m.isMesh){m.material=m.material.clone();m.material.map=null;m.material.color=new THREE.Color(cc.color);m.material.needsUpdate=true;}});}
  if(look.fx==='glow'){const w=root.getObjectByName(look.main); if(w) w.traverse(m=>{if(m.isMesh){m.material=m.material.clone();m.material.emissive=new THREE.Color('#3f8cff');m.material.emissiveIntensity=.9;}});}
  if(look.fx==='rune'){const w=root.getObjectByName(look.main); if(w) w.traverse(m=>{if(m.isMesh){m.material=m.material.clone();m.material.emissive=new THREE.Color('#ff7a1f');m.material.emissiveIntensity=1;}});}
  if(look.fx==='crown'){ if(C.hat){const h=root.getObjectByName(C.hat); if(h) h.visible=false;}
    root.updateMatrixWorld(true); const hb=root.getObjectByName('head'); const hm=root.getObjectByName(bc==='Rogue_Hooded'?'Rogue_Head_Hooded':bc+'_Head');
    if(hb&&hm){ const box=new THREE.Box3().setFromObject(hm); const crown=makeCrown(); const p=new THREE.Vector3((box.min.x+box.max.x)/2,box.max.y-.12,(box.min.z+box.max.z)/2); hb.worldToLocal(p);
      const ws=new THREE.Vector3(); hb.getWorldScale(ws); crown.scale.setScalar(1/ws.x); crown.position.copy(p); hb.add(crown); } }
  return finishChar(root,look);
}
function finishChar(root,look){
  const holder=new THREE.Group(); holder.add(root); root.scale.setScalar(.75);
  if(look.fx==='aura'){const ring=new THREE.Mesh(new THREE.RingGeometry(.7,1.05,40),new THREE.MeshBasicMaterial({color:'#ffd56a',transparent:true,opacity:.75,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.05;ring.userData.spin=1;holder.add(ring);}
  if(look.fx==='sparkle'||look.fx==='petal'||look.fx==='snow'){const pf=look.fx==='petal',sn=look.fx==='snow';for(let i=0;i<6;i++){const s=new THREE.Mesh(new THREE.OctahedronGeometry(sn?.11:.09),new THREE.MeshBasicMaterial({color:pf?(i%2?'#ffb3c8':'#ff7fa6'):sn?(i%2?'#ffffff':'#a8dcff'):(i%2?'#fff3b0':'#c9b6ff')}));if(pf)s.scale.set(1.5,.35,1.1);if(sn)s.scale.set(.5,1.4,.5);s.userData.orbit=i;holder.add(s);}}
  if(look.fx==='bubble'){for(let i=0;i<6;i++){const s=new THREE.Mesh(new THREE.SphereGeometry(.08+(i%3)*.03,12,8),new THREE.MeshBasicMaterial({color:i%2?'#bff4ff':'#d9c8ff',transparent:true,opacity:.55,depthWrite:false}));s.userData.orbit=i;holder.add(s);}}
  const mixer=new THREE.AnimationMixer(root); const actions={};
  for(const [k,clip] of Object.entries(CLIPS)) actions[k]=mixer.clipAction(clip);
  for(const k of ONCE) if(actions[k]){actions[k].setLoop(THREE.LoopOnce);actions[k].clampWhenFinished=true;}
  return {holder,root,mixer,actions,cur:null};
}
function makeCrown(){
  const g=new THREE.Group(); const gold=new THREE.MeshLambertMaterial({color:'#f2c14e',emissive:'#7a5200',emissiveIntensity:.5});
  const band=new THREE.Mesh(new THREE.CylinderGeometry(.42,.44,.2,16,1,true),gold); band.material.side=THREE.DoubleSide; band.position.y=.1; g.add(band);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2; const sp=new THREE.Mesh(new THREE.ConeGeometry(.08,.22,6),gold); sp.position.set(Math.cos(a)*.42,.31,Math.sin(a)*.42); g.add(sp);
    if(i%2===0){const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.055),new THREE.MeshLambertMaterial({color:i%4?'#3fa0ff':'#e0473a',emissive:i%4?'#1d4f99':'#7a1d14'}));gem.position.set(Math.cos(a)*.445,.1,Math.sin(a)*.445);g.add(gem);}}
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;}); return g;
}
function playOn(ch,name,fade=.2){const a=ch.actions[name]; if(!a||ch.cur===a) return; a.reset().fadeIn(fade).play(); if(ch.cur) ch.cur.fadeOut(fade); ch.cur=a;}
function oneShot(ch,name,back='idle',ms=1200){const a=ch.actions[name]; if(!a) return; if(ch.cur) ch.cur.fadeOut(.15); a.reset().fadeIn(.15).play(); ch.cur=a; ch.busy=true; setTimeout(()=>{ch.busy=false; ch.cur=null; playOn(ch,back);},ms);}
function fxTick(ch,t){ch.holder.children.forEach(c=>{if(c.userData.spin)c.rotation.z=t*1.5; if(c.userData.orbit!==undefined){const a=t*1.6+c.userData.orbit*Math.PI/3;c.position.set(Math.cos(a)*.9,1+Math.sin(t*2+c.userData.orbit)*.4,Math.sin(a)*.9);c.rotation.y=t*3;}});}

function heroBlank(){ const h={skin:'#f6c09c',color:'#9b5a45'}; for(const k in HERO_PARTS) if(k!=='head') h[k]=null; return h; }
function heroPreset(cls){ return Object.assign(heroBlank(),HERO_PRESET[cls]||HERO_PRESET.Knight); }
function heroFromLook(look){
  const cls=look.cls||'Knight', h=heroPreset(cls); h.right=null; h.left=null;
  const C=CLASSES[cls]; if(C&&C.hat&&look.hat===false) h.hat=null;
  for(const g of [look.main,look.off]){ const m=GEAR_TO_HERO[g]; if(m&&!h[m[0]]) h[m[0]]=m[1]; }
  if(TWO_HANDED.has(look.main)) h.left=null; return h;
}
function heroKey(k,v){ return k+':'+v; }
function heroPrice(k,v){ return HERO_PRICE_X[v]||HERO_PRICE[k]||50; }
function heroOwned(k,v){ if(v==null||v===''||k==='skin') return true; if(HERO_FREE[k]&&HERO_FREE[k].includes(v)) return true; return !!(save.wardrobe&&save.wardrobe[heroKey(k,v)]); }
function grantHero(h){ save.wardrobe=save.wardrobe||{}; for(const [k,v] of Object.entries(h||{})) if(v&&k!=='skin'&&(HERO_PARTS[k]||k==='color')) save.wardrobe[heroKey(k,v)]=1; }
function heroVisible(root,H){
  const get=n=>root.getObjectByName(n), show=(k,lab,on)=>{const e=HERO_PARTS[k]&&HERO_PARTS[k][lab]; if(e) for(const n of e.meshes){const o=get(n); if(o) o.visible=on;}};
  for(const k in HERO_PARTS) for(const lab in HERO_PARTS[k]) show(k,lab,false);
  for(const k in HERO_PARTS) show(k,k==='head'?'共用頭':H[k],true);
  const hat=H.hat, hairHidden=!!(hat&&(HIDE_ALL.includes(hat)||H.hair===SPIKY));
  if(hairHidden&&H.hair) show('hair',H.hair,false);
  if(H.hairacc==='包包頭'){ const shown=H.hair&&!hairHidden, a=get('hairacc_bun'), b=get('hairacc_bun_bald'); if(a) a.visible=!hat&&!!shown; if(b) b.visible=!hat&&!shown; }
  if(hat==='兜帽'){ const e=get('head_ears'); if(e) e.visible=false; }
}
function buildHero(look){
  const root=THREE.SkeletonUtils.clone(models.hero.scene);
  const H=Object.assign(heroBlank(),look.hero); if(look.fx==='crown') H.hat=null;
  const mats={};
  root.traverse(o=>{ if(!o.isMesh) return; o.castShadow=true; o.receiveShadow=true; o.frustumCulled=false; const n=o.material&&o.material.name;
    if(n==='tint'||n==='skin'){ if(!mats[n]){ const m=mats[n]=o.material.clone(); m.color=new THREE.Color(n==='tint'?H.color:H.skin).convertSRGBToLinear(); if(n==='tint') m.color.multiplyScalar(1.12); } o.material=mats[n]; } });
  heroVisible(root,H);
  const partMeshes=(k)=>H[k]&&HERO_PARTS[k][H[k]]?HERO_PARTS[k][H[k]].meshes.map(n=>root.getObjectByName(n)).filter(Boolean):[];
  const cc=CAPES.find(c=>c.id===look.cape);
  if(cc&&cc.color) for(const o of partMeshes('cape')) o.traverse(m=>{if(m.isMesh){m.material=m.material.clone();m.material.map=null;m.material.color=new THREE.Color(cc.color);m.material.needsUpdate=true;}});
  if(look.fx==='glow'||look.fx==='rune') for(const o of partMeshes('right')) o.traverse(m=>{if(m.isMesh){m.material=m.material.clone();m.material.emissive=new THREE.Color(look.fx==='glow'?'#3f8cff':'#ff7a1f');m.material.emissiveIntensity=look.fx==='glow'?.9:1;}});
  // 把看不見的零件拿掉，減少繪製負擔
  const drop=[]; for(const k in HERO_PARTS) for(const lab in HERO_PARTS[k]) for(const n of HERO_PARTS[k][lab].meshes){ const o=root.getObjectByName(n); if(o&&!o.visible) drop.push(o); }
  drop.forEach(o=>o.parent&&o.parent.remove(o));
  if(look.fx==='crown'){ root.updateMatrixWorld(true); const hb=root.getObjectByName('head'), hm=root.getObjectByName('head_base');
    if(hb&&hm){ const box=new THREE.Box3().setFromObject(hm); const crown=makeCrown(); const p=new THREE.Vector3((box.min.x+box.max.x)/2,box.max.y-.12,(box.min.z+box.max.z)/2); hb.worldToLocal(p);
      const ws=new THREE.Vector3(); hb.getWorldScale(ws); crown.scale.setScalar(1/ws.x); crown.position.copy(p); hb.add(crown); } }
  return finishChar(root,look);
}

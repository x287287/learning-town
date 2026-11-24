/* 學習冒險城．js/13-battle-fx.js
 * 武器攻擊特效（光球、箭、劍氣、音符、爆炸）
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ---------- 武器攻擊特效（程式產生的光球、箭、劍氣、音符，不是 3D 模型） ---------- */
const VFX=[];
let _glowTex=null; const _noteTex={};
function glowTex(){ if(_glowTex) return _glowTex; const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d'); const r=g.createRadialGradient(32,32,0,32,32,32);
  r.addColorStop(0,'rgba(255,255,255,1)'); r.addColorStop(.35,'rgba(255,255,255,.75)'); r.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=r; g.fillRect(0,0,64,64); return _glowTex=new THREE.CanvasTexture(c); }
function noteTex(ch){ if(_noteTex[ch]) return _noteTex[ch]; const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d'); g.font='bold 52px serif'; g.textAlign='center'; g.textBaseline='middle';
  g.lineWidth=6; g.strokeStyle='rgba(60,20,40,.9)'; g.strokeText(ch,32,34); g.fillStyle='#fff'; g.fillText(ch,32,34); return _noteTex[ch]=new THREE.CanvasTexture(c); }
function vSprite(color,size,tex,additive=true){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex||glowTex(),color:new THREE.Color(color),transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending})); s.scale.setScalar(size); return s; }
function vBasic(color,opa=1){ return new THREE.MeshBasicMaterial({color:new THREE.Color(color),transparent:true,opacity:opa,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}); }
function vfxAdd(obj,dur,upd,delay=0){ VFX.push({obj,t:-delay,dur,upd,added:false}); }
function vfxTick(dt){
  for(let i=VFX.length-1;i>=0;i--){ const v=VFX[i]; v.t+=dt; if(v.t<0) continue;
    if(!v.added){ scene.add(v.obj); v.added=true; }
    const k=Math.min(1,v.t/v.dur); v.upd(k,v.obj,dt);
    if(k>=1){ scene.remove(v.obj); v.obj.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material) o.material.dispose(); }); VFX.splice(i,1); } }
}
function vfxBurst(pos,color,n=10,spd=3,size=.28,dur=.5,delay=0,grav=4){
  for(let i=0;i<n;i++){ const s=vSprite(color,size); const v=new THREE.Vector3(Math.random()-.5,Math.random()*.9+.1,Math.random()-.5).normalize().multiplyScalar(spd*(.5+Math.random()*.7)); s.position.copy(pos);
    vfxAdd(s,dur*(.7+Math.random()*.5),(k,o,dt)=>{ v.y-=grav*dt; o.position.addScaledVector(v,dt); o.material.opacity=1-k; o.scale.setScalar(size*(1-k*.6)); },delay); }
}
function vfxFlash(pos,color,size=1.6,dur=.25,delay=0){ const s=vSprite(color,size*.4); s.position.copy(pos); vfxAdd(s,dur,(k,o)=>{ o.scale.setScalar(size*(.4+k*.9)); o.material.opacity=1-k; },delay); }
function vfxRing(pos,color,r=1.6,dur=.45,delay=0){ const m=new THREE.Mesh(new THREE.RingGeometry(.82,1,40),vBasic(color,.9)); m.rotation.x=-Math.PI/2; m.position.set(pos.x,(pos.ground??pos.y)+.06,pos.z);
  vfxAdd(m,dur,(k,o)=>{ const sc=.2+k*r; o.scale.set(sc,sc,sc); o.material.opacity=.9*(1-k); },delay); }
function vfxPillar(pos,color,delay=0){ const m=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,5,20,1,true),vBasic(color,.6)); m.position.set(pos.x,(pos.ground??0)+2.5,pos.z);
  vfxAdd(m,.7,(k,o)=>{ o.scale.set(1-k*.7,.3+Math.min(1,k*4)*.7,1-k*.7); o.material.opacity=.6*(1-k); },delay); }
function vfxCross(pos,color,size=1.3,delay=0){ const g=new THREE.Group(); for(const a of [.8,-.8]){ const m=new THREE.Mesh(new THREE.PlaneGeometry(size*1.6,size*.12),vBasic(color,1)); m.rotation.z=a; g.add(m); }
  g.position.copy(pos); vfxAdd(g,.35,(k,o)=>{ o.lookAt(camera.position); o.children.forEach((c,i)=>{ c.scale.x=Math.min(1,k*4); c.material.opacity=1-Math.max(0,k-.3)/.7; }); },delay); }
/* 飛行物：from→to，arc 是拋物線高度，到達時執行 onHit */
function vfxShot(obj,from,to,delay,dur,{arc=0,spin=0,roll=0,trail=null,face=true,wave=0}={},onHit){
  const dir=to.clone().sub(from); const yaw=-Math.atan2(dir.z,dir.x); let tt=0, hit=false; obj.position.copy(from);
  vfxAdd(obj,dur,(k,o,dt)=>{ o.position.lerpVectors(from,to,k); o.position.y+=Math.sin(Math.PI*k)*arc;
    if(wave){ o.position.y+=Math.sin(k*Math.PI*3)*wave; }
    if(face){ o.rotation.set(0,yaw,0); if(arc){ const slope=Math.cos(Math.PI*k)*Math.PI*arc/dir.length(); o.rotateZ(Math.atan(slope)-Math.atan2(0,1)); } }
    if(roll) o.rotateX(roll); if(spin) o.rotateX(spin*k*Math.PI*2);
    if(trail&&(tt+=dt)>.016){ tt=0; vfxFlash(o.position.clone(),trail[0],trail[1],.22); }
    if(k>=1&&!hit){ hit=true; onHit&&onHit(); } },delay);
}
function vCrescent(color,size,thick=.28){ const g=new THREE.Group(); const m=new THREE.Mesh(new THREE.RingGeometry(1-thick,1,28,1,-Math.PI*.42,Math.PI*.84),vBasic(color,.95)); g.add(m);
  const m2=new THREE.Mesh(new THREE.RingGeometry(1-thick*.45,1-thick*.1,28,1,-Math.PI*.36,Math.PI*.72),vBasic('#ffffff',.9)); g.add(m2); g.scale.setScalar(size); return g; }
function vArrow(big){ const g=new THREE.Group(); const L=big?1.1:.8;
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,L,6),new THREE.MeshBasicMaterial({color:'#8a5a2b'})); shaft.rotation.z=Math.PI/2; g.add(shaft);
  const head=new THREE.Mesh(new THREE.ConeGeometry(.07,.2,8),new THREE.MeshBasicMaterial({color:'#d8dde3'})); head.rotation.z=-Math.PI/2; head.position.x=L/2+.08; g.add(head);
  for(const a of [0,Math.PI/2]){ const f=new THREE.Mesh(new THREE.PlaneGeometry(.22,.1),new THREE.MeshBasicMaterial({color:'#e8e2d4',side:THREE.DoubleSide})); f.position.x=-L/2+.08; f.rotation.x=a; g.add(f); }
  const glow=vSprite('#fff3b0',.35); glow.position.x=L/2; g.add(glow); return g; }
function vBomb(){ const g=new THREE.Group(); g.add(new THREE.Mesh(new THREE.SphereGeometry(.16,12,10),new THREE.MeshBasicMaterial({color:'#2b2b33'}))); const f=vSprite('#ffb347',.32); f.position.y=.2; g.add(f); return g; }
function weaponKind(){
  const L=save.look, H=L.hero; let r=H?H.right:null;
  if(!H){ const m=L.main; r={'1H_Wand':'魔杖','2H_Staff':'法杖','1H_Crossbow':'手弩','2H_Crossbow':'重弩','2H_Sword':'雙手大劍','2H_Axe':'雙手巨斧','1H_Axe':'單手斧','Throwable':'炸彈'}[m]||(m&&m!=='none'?'單手劍':null); }
  if(r==='魔杖') return 'wand'; if(r==='法杖') return 'staff'; if(r==='牧師權杖') return 'holy';
  if(r==='手弩') return 'bolt'; if(r==='重弩') return 'bigbolt'; if(r==='炸彈') return 'bomb';
  if(r==='雙手大劍'||r==='雙手巨斧') return 'heavy'; if(r==='單手斧') return 'axe'; if(r) return 'blade';
  if(L.cls==='Mage') return 'wand'; if(L.cls==='Cleric') return 'holy'; if(L.cls==='Bard'||(H&&H.back==='魯特琴')) return 'song'; return 'fist';
}
function battleAnchors(){
  const b=battle; const pp=new THREE.Vector3(); player.ch.holder.getWorldPosition(pp); const mp=new THREE.Vector3(); b.m.ch.holder.getWorldPosition(mp);
  if(!b.m.fxH){ const box=new THREE.Box3().setFromObject(b.m.ch.holder); b.m.fxH=Math.max(.8,Math.min(3.2,(box.max.y-box.min.y)||1.4)); }
  const dir=mp.clone().sub(pp); dir.y=0; dir.normalize(); const right=new THREE.Vector3(-dir.z,0,dir.x);
  const hand=pp.clone().addScaledVector(dir,.5).addScaledVector(right,.45); hand.y+=1.25;
  const tgt=mp.clone().addScaledVector(dir,-.25); tgt.y+=b.m.fxH*.5; tgt.ground=mp.y;
  const chest=pp.clone(); chest.y+=.95; chest.ground=pp.y;
  return {pp,mp,dir,hand,tgt,chest,mh:b.m.fxH};
}
/* 答對：依武器放出攻擊特效，大約在 0.42 秒時打中（和怪物受傷動畫同步）。big＝兩倍傷害 */
function attackFx(big){
  if(!battle||!player.ch||!battle.m||!battle.m.ch) return;
  const A=battleAnchors(), K=weaponKind(), S=big?1.6:1, T=A.tgt;
  const impact=(col,n=12)=>{ vfxFlash(T,col,1.8*S); vfxBurst(T,col,Math.round(n*S),3.2*S); if(big){ vfxRing(T,col,2.6); vfxFlash(T,'#ffffff',2.4,.3); } };
  if(K==='wand'||K==='staff'||K==='holy'){
    const col=K==='wand'?'#5aa8ff':K==='staff'?'#b46bff':'#ffd25a', sz=(K==='staff'?1.05:.8)*S;
    const orb=new THREE.Group(); orb.add(vSprite(col,sz)); orb.add(vSprite('#ffffff',sz*.45));
    if(K==='staff'){ for(let i=0;i<3;i++){ const sp=vSprite(col,.18); sp.userData.o=i; orb.add(sp); } }
    vfxFlash(A.hand,col,.9,.2,.18);
    vfxShot(orb,A.hand,T,.2,.22,{face:false,trail:[col,sz*.8],arc:K==='holy'?.3:.12},()=>{ impact(col,14); if(K==='holy'){ vfxPillar(T,col); vfxBurst(T,'#fff6c8',8,1.5,.22,.8,.05,-1.5); } if(K==='staff') vfxRing(T,col,2); });
    if(K==='staff') vfxAdd(new THREE.Object3D(),.42,()=>{ orb.children.forEach(c=>{ if(c.userData.o!==undefined){ const a=performance.now()/90+c.userData.o*2.1; c.position.set(0,Math.cos(a)*.35,Math.sin(a)*.35); } }); });
  } else if(K==='bolt'||K==='bigbolt'){
    const big2=K==='bigbolt'; const ar=vArrow(big2); ar.scale.setScalar((big?1.5:1.2)*(big2?1.15:1));
    vfxShot(ar,A.hand,T,.3,.12,{arc:.15,trail:['#fff3b0',.45]},()=>{ vfxBurst(T,'#ffe9a8',Math.round(9*S),2.6*S,.2,.4); vfxFlash(T,'#ffffff',1.1*S,.18); if(big) vfxRing(T,'#ffe9a8',2.2); });
  } else if(K==='bomb'){
    vfxShot(vBomb(),A.hand,T,.14,.28,{arc:1.3,face:false,spin:0},()=>{ vfxFlash(T,'#ffb347',3*S,.35); vfxFlash(T,'#fff2c0',1.6*S,.2); vfxBurst(T,'#ff8a2a',Math.round(16*S),4.2*S,.34,.55); vfxBurst(T,'#777',6,1.2,.6,.9,.05,-1.2); vfxRing(T,'#ffb347',2.4*S); });
  } else if(K==='heavy'||K==='blade'||K==='axe'){
    const col=K==='heavy'?'#ffd27a':K==='axe'?'#ffa04d':'#bfe9ff', sz=(K==='heavy'?1.4:1)*S;
    const cr=vCrescent(col,sz,K==='heavy'?.32:.26); const tilt=(Math.random()-.5)*.8;
    vfxShot(cr,A.hand,T,K==='heavy'?.24:.26,K==='heavy'?.18:.16,{roll:K==='axe'?0:tilt,spin:K==='axe'?2:0},()=>{ vfxCross(T,col,1.2*S); vfxBurst(T,col,Math.round(10*S),3*S,.24,.4); vfxFlash(T,'#ffffff',1.2*S,.18); if(K==='heavy') vfxRing(T,col,2.6*S); });
  } else if(K==='song'){
    const cols=['#ff7ab8','#7ad0ff','#ffd35a'], chs=['♪','♫','♪'];
    chs.forEach((ch,i)=>{ const n=vSprite(cols[i],.8*S,noteTex(ch),false); const from=A.hand.clone(); from.y+=.25;
      vfxShot(n,from,T.clone().add(new THREE.Vector3(0,(i-1)*.25,0)),.1+i*.07,.26,{face:false,wave:.25*(i%2?1:-1),trail:[cols[i],.45]},()=>{ vfxBurst(T,cols[i],5,2.2,.22,.45); vfxFlash(T,cols[i],1.1,.2); }); });
  } else {
    vfxFlash(T,'#ffe066',1.4*S,.22,.4); vfxBurst(T,'#ffe066',Math.round(8*S),2.6,.22,.4,.4);
  }
}
/* 答錯：怪物反擊的特效；res＝hit／guard（盾牌或寵物擋下）／dodge */
function defendFx(res,magic){
  if(!battle||!player.ch||!battle.m||!battle.m.ch) return;
  const A=battleAnchors(), C=A.chest;
  if(magic){ const from=A.mp.clone(); from.y+=A.mh*.6; const o=new THREE.Group(); o.add(vSprite('#ff4a6a',.6)); o.add(vSprite('#ffffff',.25));
    vfxShot(o,from,C,.2,.22,{face:false,trail:['#ff4a6a',.45]}); }
  if(res==='guard'){ const m=new THREE.Mesh(new THREE.SphereGeometry(1,24,16,0,Math.PI*2,0,Math.PI*.6),vBasic('#7ec8ff',.5)); m.position.set(A.pp.x,A.pp.y+.2,A.pp.z);
    vfxAdd(m,.55,(k,o)=>{ o.scale.setScalar(.9+k*.35); o.material.opacity=.5*(1-k); },.38); vfxBurst(C,'#bfe6ff',8,2.5,.2,.4,.42); }
  else if(res==='dodge'){ const p=C.clone().addScaledVector(new THREE.Vector3(-A.dir.z,0,A.dir.x),.6); vfxFlash(p,'#d9d9d9',1,.25,.42); }
  else { vfxCross(C,'#ff5a5a',1,.42); vfxBurst(C,'#ff6b6b',8,2.4,.2,.4,.42); }
}

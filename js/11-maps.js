/* 學習冒險城．js/11-maps.js
 * 五科試煉地圖：怪物、地面、場景、魔王寶箱、傳送與遺跡小地圖
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ======================= 科目試煉地圖 ======================= */
const MAP={x:0,z:-420};
const STAGES=[
  {n:1,name:'質數守衛',topic:'質數與合數',x:-10,z:14,hp:3,reward:20},
  {n:2,name:'分解術士',topic:'質因數分解',x:12,z:-8,hp:3,reward:20},
  {n:3,name:'公因數盜賊',topic:'最大公因數',x:-12,z:-30,hp:3,reward:20},
  {n:4,name:'倍數戰士',topic:'最小公倍數',x:12,z:-52,hp:3,reward:20},
  {n:5,name:'遺跡之王',topic:'綜合應用',x:0,z:-76,hp:5,reward:50,boss:true,timer:60},
];
const monsters=[];
let area='town';
const SPAWN={town:new THREE.Vector3(-29,0,7),math:new THREE.Vector3(MAP.x,0,MAP.z+28)};

/* --- 守衛怪物：數學用 KayKit 骷髏，其他科用 Quaternius Ultimate Monsters --- */
function buildMonster(st,model){
  const g=models[model]; const root=THREE.SkeletonUtils.clone(g.scene);
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false;
    if(/Eyes/.test(o.name)){o.material=o.material.clone();o.material.emissive=new THREE.Color(st.boss?'#ff3b2f':'#7fe6ff');o.material.emissiveIntensity=1.4;}}});
  const holder=new THREE.Group(); holder.add(root); root.scale.setScalar(st.boss?1.25:.8);
  const mixer=new THREE.AnimationMixer(root); const actions={};
  for(const [k,clip] of Object.entries(CLIPS)) actions[k]=mixer.clipAction(clip);
  for(const k of ONCE) if(actions[k]){actions[k].setLoop(THREE.LoopOnce);actions[k].clampWhenFinished=true;}
  return {holder,root,mixer,actions,cur:null};
}
const UMA={
  Big:{idle:'Idle',hit:'HitReact',chop:'Weapon',castShot:'Punch',cheer:'Yes',skAwaken:'Jump',skRevive:'Jump',skDeath:'Death',skInactive:'Duck'},
  Blob:{idle:'Idle',hit:'HitRecieve',chop:'Bite_Front',castShot:'Bite_Front',cheer:'Dance',skAwaken:'Jump',skRevive:'Jump',skDeath:'Death',skInactive:null},
  Flying:{idle:'Flying_Idle',hit:'HitReact',chop:'Headbutt',castShot:'Punch',cheer:'Yes',skAwaken:'Yes',skRevive:'Yes',skDeath:'Death',skInactive:null},
};
function buildUM(st,model){
  const g=models[model]; const kind=model.split('_')[1]; const A=UMA[kind]||UMA.Big;
  const root=THREE.SkeletonUtils.clone(g.scene);
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false;}});
  const holder=new THREE.Group(), inner=new THREE.Group(); holder.add(inner); inner.add(root);
  const box=new THREE.Box3().setFromObject(root); const h=box.max.y-box.min.y||1; root.scale.multiplyScalar((st.boss?3.3:2.05)/h);
  const b2=new THREE.Box3().setFromObject(root); root.position.y-=b2.min.y;
  const lift=kind==='Flying'?(st.boss?.7:.55):0; inner.position.y=lift;
  const mixer=new THREE.AnimationMixer(root); const actions={};
  const find=n=>g.animations.find(a=>a.name===n);
  for(const [k,n] of Object.entries(A)){ if(!n) continue; let c=find(n); if(!c) continue; if(Object.values(actions).some(a=>a.getClip()===c)) c=c.clone(); actions[k]=mixer.clipAction(c); }
  for(const k of ONCE) if(actions[k]){actions[k].setLoop(THREE.LoopOnce);actions[k].clampWhenFinished=true;}
  if(!actions.skInactive&&actions.idle){ const a=mixer.clipAction(actions.idle.getClip().clone()); a.timeScale=.22; actions.skInactive=a; }
  return {holder,root,mixer,actions,cur:null,top:(b2.max.y-b2.min.y)+lift};
}
function makeMonster(st,model){
  const x=MAP.x+st.x, z=MAP.z+st.z; const sk=model.startsWith('ch_');
  const ch=sk?buildMonster(st,model):buildUM(st,model); ch.holder.position.set(x,0,z-1.5);
  const nameTag=labelSprite(st.name,{bg:st.boss?'#8a1f16':'#2a1b12',size:st.boss?.75:.55}); nameTag.position.y=sk?(st.boss?4.05:2.9):ch.top+(st.boss?1.15:.95); ch.holder.add(nameTag);
  const badge=labelSprite(stageBadge(st),{bg:'rgba(42,27,18,.88)',size:.45}); badge.position.y=sk?(st.boss?3.1:2.12):ch.top+(st.boss?.3:.2); ch.holder.add(badge);
  return {st,ch,badge,nameTag,model,pos:new THREE.Vector3(x,0,z-1.5)};
}
const monSets={};
function spawnMonsters(sub){
  for(const m of monsters) scene.remove(m.ch.holder);
  monsters.length=0;
  if(!monSets[sub]) monSets[sub]=STAGES.map((st,i)=>makeMonster(st,THEMES[sub].mon[i]));
  for(const m of monSets[sub]){ scene.add(m.ch.holder); monsters.push(m); }
}
function holdPose(ch,name){const a=ch.actions[name]; if(!a) return; if(ch.cur&&ch.cur!==a) ch.cur.fadeOut(.2); a.reset().fadeIn(.2).play(); ch.cur=a; ch.busy=true;}
function monsterRest(m){
  calm(m); const s=m.st; m.ch.busy=false; m.ch.cur=null;
  for(const a of Object.values(m.ch.actions)) a.stop();
  if(UM().cleared[s.n]) holdPose(m.ch,'skDeath');
  else if(stageLocked(s.n)) holdPose(m.ch,'skInactive');
  else playOn(m.ch,'idle');
  const old=m.badge; const nb=labelSprite(stageBadge(s),{bg:'rgba(42,27,18,.88)',size:.45}); nb.position.copy(old.position); m.ch.holder.remove(old); m.ch.holder.add(nb); m.badge=nb;
}
function setUnit(u){
  curUnit=u; const U=MATH_UNITS[u-1];
  STAGES.forEach((s,i)=>{s.name=U.stages[i][0]; s.topic=U.stages[i][1];});
  for(const m of monsters){ const s=m.st; const old=m.nameTag; const nt=labelSprite(s.name,{bg:s.boss?'#8a1f16':'#2a1b12',size:s.boss?.75:.55}); nt.position.copy(old.position); m.ch.holder.remove(old); m.ch.holder.add(nt); m.nameTag=nt; monsterRest(m); }
  if(bossFx.chest) refreshBossRewards();
}
function stageLocked(n){return n>1&&!UM().cleared[n-1];}
function stageBadge(s){return UM().cleared[s.n]?`第${s.n}關．${starStr(starsOf(s.n))}`:stageLocked(s.n)?`第${s.n}關．尚未解鎖`:`第${s.n}關．${s.topic}`;}

/* --- 地面與擂台花紋（每科不同） --- */
const groundCache={};
function groundTex(sub){
  if(groundCache[sub]) return groundCache[sub];
  const dots=(x,w,h,base,cols,n,sz)=>{x.fillStyle=base;x.fillRect(0,0,w,h);for(let i=0;i<n;i++){x.fillStyle=cols[i%cols.length];x.fillRect(Math.random()*w,Math.random()*h,sz[0]+Math.random()*sz[1],sz[0]+Math.random()*sz[1]);}};
  const D={
    math:x=>dots(x,256,256,'#c9ab78',['#bf9f6c','#d4b886','#b39260','#ccb07c'],1100,[2,3]),
    chinese:x=>{dots(x,256,256,'#5f8f45',['#567f3d','#6a9c4c','#4d7536','#7aa856'],1300,[2,4]);for(let i=0;i<70;i++){x.fillStyle=['#a5793f','#c49a52','#8a6232'][i%3];x.beginPath();x.ellipse(Math.random()*256,Math.random()*256,4,2,Math.random()*3,0,7);x.fill();}},
    english:x=>{dots(x,256,256,'#ead39d',['#e2c890','#f1dcaa','#d9bd82','#efe0b8'],1300,[1,3]);for(let i=0;i<18;i++){x.fillStyle='#fff8e6';x.beginPath();x.arc(Math.random()*256,Math.random()*256,2.2,0,7);x.fill();}},
    science:x=>{dots(x,256,256,'#86c45a',['#7ab850','#93cf66','#6fae48','#9bd66e'],1300,[2,4]);for(let i=0;i<60;i++){x.fillStyle=['#f4e06a','#f19ac0','#ffffff','#b9a0f0'][i%4];x.beginPath();x.arc(Math.random()*256,Math.random()*256,2.4,0,7);x.fill();}},
    social:x=>{x.fillStyle='#a8957a';x.fillRect(0,0,256,256);for(let r=0;r<8;r++)for(let c=0;c<8;c++){const ox=(r%2)*16;const g=170+Math.random()*30|0;x.fillStyle=`rgb(${g},${g-16},${g-38})`;x.beginPath();x.roundRect?x.roundRect(c*32+ox+2,r*32+2,28,28,6):x.rect(c*32+ox+2,r*32+2,28,28);x.fill();}},
  };
  const t=canvasTex(256,256,(x,w,h)=>D[sub](x),sub==='social'?60:34);
  return groundCache[sub]=t;
}
const arenaCache={};
function arenaTex(sub,s){
  const k=sub+s.n; if(arenaCache[k]) return arenaCache[k]; const T=THEMES[sub]; const ink=s.boss?'#ff8a5c':T.ink;
  const tex=canvasTex(512,512,(c,w,h)=>{c.fillStyle=T.disc;c.fillRect(0,0,w,h);c.strokeStyle=ink;c.lineWidth=12;c.beginPath();c.arc(256,256,236,0,7);c.stroke();
    c.lineWidth=5;c.beginPath();c.arc(256,256,196,0,7);c.stroke();c.fillStyle=ink;c.font='bold 150px "LXGW WenKai TC","Noto Sans TC",serif';c.textAlign='center';c.textBaseline='middle';c.fillText(s.boss?'王':String(s.n),256,262);
    c.font='bold 30px "LXGW WenKai TC","Noto Sans TC",serif';for(let i=0;i<12;i++){const a=i/12*Math.PI*2;c.save();c.translate(256+Math.cos(a)*216,256+Math.sin(a)*216);c.rotate(a+Math.PI/2);c.fillText(T.ring[i],0,0);c.restore();}});
  tex.wrapS=tex.wrapT=THREE.ClampToEdgeWrapping; return arenaCache[k]=tex;
}

/* --- 共用地圖骨架：地面、小路、擂台、碰撞、回城傳送門、魔王寶箱 --- */
let ruinsGround=null, mapLabel=null; const arenaDiscs=[];
function buildMapBase(){
  const O=(x,z)=>[MAP.x+x,MAP.z+z];
  const g=new THREE.Mesh(new THREE.CircleGeometry(150,72),new THREE.MeshLambertMaterial({map:groundTex('math')}));
  g.rotation.x=-Math.PI/2; g.position.set(MAP.x,.01,MAP.z); g.receiveShadow=true; scene.add(g); ruinsGround=g;
  const pts=[[0,30],...STAGES.map(s=>[s.x,s.z])];
  for(let i=0;i<pts.length-1;i++){const [a,b]=pts[i],[c,d]=pts[i+1];const [x0,z0]=O(a,b),[x1,z1]=O(c,d);pathTo(x0,z0,x1,z1,4.5);}
  STAGES.forEach(s=>{
    const [x,z]=O(s.x,s.z); const R=s.boss?10:6.5;
    const disc=new THREE.Mesh(new THREE.CircleGeometry(R,56),new THREE.MeshLambertMaterial({map:arenaTex('math',s)})); disc.rotation.x=-Math.PI/2; disc.position.set(x,.07,z); disc.receiveShadow=true; scene.add(disc); arenaDiscs.push(disc);
    circ(x,z-1.5,s.boss?1.4:.9);
    zones.push({id:'monster',stage:s.n,area:'math',x,z:z+3,r:4.2,label:`挑戰第${s.n}關：${s.name}`,labelFn:()=>UM().cleared[s.n]?`再次挑戰第${s.n}關（練習）`:`挑戰第${s.n}關：${s.name}`});
  });
  const [px,pz]=O(0,36); const grp=new THREE.Group(); grp.position.set(px,0,pz);
  const stone=new THREE.MeshLambertMaterial({color:'#a9a397'}), stoneD=new THREE.MeshLambertMaterial({color:'#7d776d'});
  for(const sx of [-2.1,2.1]){const p=new THREE.Mesh(new THREE.BoxGeometry(.9,5.2,.9),stone);p.position.set(sx,2.6,0);grp.add(p);}
  const lin=new THREE.Mesh(new THREE.BoxGeometry(5.4,.8,1.1),stoneD);lin.position.y=5.6;grp.add(lin);
  const sheet=new THREE.Mesh(new THREE.PlaneGeometry(3.3,4.6),portalMaterial('#e2b04a'));sheet.position.y=2.75;grp.add(sheet);portals.push(sheet);
  grp.traverse(o=>{if(o.isMesh&&o!==sheet){o.castShadow=true;}}); scene.add(grp); circ(px-2.1,pz,.8); circ(px+2.1,pz,.8);
  label('回到學習冒險城',px,pz,7.4,{bg:'#3a2a5a',size:1});
  zones.push({id:'exit',area:'math',x:px,z:pz-2.6,r:2.6,label:'回到學習冒險城'});
  mapLabel=label('數字遺跡',MAP.x,MAP.z+16,12,{bg:'#2f5ea8',size:1.1});
  buildBossRewards();
}

/* --- 各科場景（每科一個群組，碰撞只在該科生效） --- */
const SCN={};
const sp=(name,lx,lz,o)=>{const m=place(name,MAP.x+lx,MAP.z+lz,o||{}); if(m) SCN[buildSub].add(m); return m;};
const lc=(lx,lz,r)=>circ(MAP.x+lx,MAP.z+lz,r);
const faceC=(lx,lz)=>Math.atan2(-lx,-24-lz);
function segD(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,L=dx*dx+dz*dz;let t=L?((px-ax)*dx+(pz-az)*dz)/L:0;t=Math.max(0,Math.min(1,t));return Math.hypot(px-ax-dx*t,pz-az-dz*t);}
function freeSpot(lx,lz,pad){
  for(const s of STAGES) if(Math.hypot(s.x-lx,s.z-lz)<(s.boss?12:8.5)+pad) return false;
  const P=[[0,38],[0,30],...STAGES.map(s=>[s.x,s.z])];
  for(let i=0;i<P.length-1;i++) if(segD(lx,lz,P[i][0],P[i][1],P[i+1][0],P[i+1][1])<4+pad) return false;
  if(Math.hypot(lx-6,lz-28)<4+pad) return false;
  return true;
}
function scatter(n,r0,r1,pad,fn){ let k=0; for(let t=0;t<n*8&&k<n;t++){ const a=rnd(0,Math.PI*2), r=Math.sqrt(rnd(r0*r0,r1*r1)); const lx=Math.cos(a)*r, lz=-24+Math.sin(a)*r; if(!freeSpot(lx,lz,pad)) continue; fn(lx,lz,k); k++; } }
function ringOut(n,r0,r1,fn){ for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+rnd(-.06,.06), r=rnd(r0,r1); fn(Math.cos(a)*r,-24+Math.sin(a)*r,i); } }
function arenaRing(fn){ STAGES.forEach(s=>{ const R=s.boss?10:6.5, n=s.boss?8:5; for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+.3; const lx=s.x+Math.cos(a)*(R+1.2), lz=s.z+Math.sin(a)*(R+1.2); if(lz>s.z+R*.6&&Math.abs(lx-s.x)<4) continue; fn(lx,lz,s,i); } }); }
function floatWords(words,fg){ for(let i=0;i<22;i++){ const s=labelSprite(words[i%words.length],{bg:'rgba(255,240,200,0)',fg,border:'rgba(0,0,0,0)',size:rnd(.7,1.3)}); s.material.opacity=.78; s.position.set(MAP.x+rnd(-40,40),rnd(6,14),MAP.z+rnd(-90,30)); s.userData.bob=s.position.y; SCN[buildSub].add(s); spinners.push(s); } }
const FO_TREES=['fo_Tree_1_A','fo_Tree_1_B','fo_Tree_2_A','fo_Tree_2_C','fo_Tree_3_A','fo_Tree_4_A','fo_Tree_5_A','fo_Tree_6_A','fo_Tree_7_A'];
const SCENERY={
  math(){
    arenaRing((lx,lz,s)=>{ const h=s.boss?rnd(4,7):rnd(1.5,4.5); const col=new THREE.Mesh(new THREE.CylinderGeometry(.6,.7,h,8),new THREE.MeshLambertMaterial({color:'#a59d90'})); col.position.set(MAP.x+lx,h/2,MAP.z+lz); col.castShadow=true; col.receiveShadow=true; SCN.math.add(col); lc(lx,lz,.9); });
    for(const sx of [-12,12]){ sp('towerA',sx,-80,{s:7}); lc(sx,-80,3.6); sp('flagR',sx+(sx<0?3:-3),-77,{s:9}); }
    const ruins=[['destroyed',-24,8],['destroyed',24,14],['scaffold',26,-24],['destroyed',-26,-14],['destroyed',-28,-50],['scaffold',-24,-66],['destroyed',28,-68],['destroyed',26,-40],['wall',-18,-90],['wall',18,-90],['wall',-34,-82],['wall',34,-82]];
    for(const [n,lx,lz] of ruins){ sp(n,lx,lz,{s:8,ry:rnd(0,6.28)}); lc(lx,lz,n==='wall'?3:5); }
    scatter(34,18,58,1,(lx,lz,i)=>{ const k=['rock','rock2','rock3','rock4','treeCut','tree3','barrel','crate'][i%8]; sp(k,lx,lz,{s:k.startsWith('rock')?rnd(9,14):k.startsWith('tree')?rnd(6,8):7,ry:rnd(0,6)}); if(!k.startsWith('rock')&&k!=='treeCut') lc(lx,lz,1); });
    ringOut(18,100,115,(lx,lz,i)=>sp(i%3?'mountainBare':'mountain',lx,lz,{s:rnd(18,26),ry:rnd(0,6),shadow:false}));
    floatWords(['2','3','5','7','11','13','6','12','24','36','GCD','LCM','×','÷'],'#fff1c2');
  },
  chinese(){
    arenaRing((lx,lz,s,i)=>{ sp(i%2?'fo_Bush_1_A':'fo_Rock_1_A',lx,lz,{s:i%2?6:3.2,ry:rnd(0,6.28)}); lc(lx,lz,1.1); });
    sp('hx_church_green',0,-98,{s:12}); sp('hx_flag_green',-9,-88,{s:9}); sp('hx_flag_green',9,-88,{s:9});
    scatter(64,16,60,2,(lx,lz,i)=>{ sp(FO_TREES[i%FO_TREES.length],lx,lz,{s:rnd(1.7,2.4),ry:rnd(0,6.28)}); lc(lx,lz,1.1); });
    scatter(70,6,62,.5,(lx,lz,i)=>{ const k=['fo_Bush_1_A','fo_Bush_2_A','fo_Bush_3_A','fo_Bush_4_A','fo_Grass_1_A','fo_Grass_2_A','fo_Grass_1_A'][i%7]; sp(k,lx,lz,{s:k.includes('Grass')?rnd(3,4.5):rnd(2.6,4),ry:rnd(0,6.28)}); });
    scatter(14,14,60,1.5,(lx,lz,i)=>{ sp(i%2?'fo_Rock_3_A':'fo_Rock_1_A',lx,lz,{s:rnd(3,4.5),ry:rnd(0,6.28)}); lc(lx,lz,1.6); });
    ringOut(120,64,108,(lx,lz,i)=>sp(FO_TREES[i%FO_TREES.length],lx,lz,{s:rnd(2.5,3.8),ry:rnd(0,6.28),shadow:false}));
    floatWords(['文','字','詩','詞','句','讀','寫','書','成語','閱讀','修辭','標點'],'#fff6d0');
  },
  english(){
    const sea=new THREE.Mesh(new THREE.CircleGeometry(420,72),new THREE.MeshLambertMaterial({color:'#3f8fc0'})); sea.rotation.x=-Math.PI/2; sea.position.set(MAP.x,-.35,MAP.z); SCN.english.add(sea);
    const foam=new THREE.Mesh(new THREE.RingGeometry(91.5,95,96),new THREE.MeshBasicMaterial({color:'#e9f6ff',transparent:true,opacity:.75})); foam.rotation.x=-Math.PI/2; foam.position.set(MAP.x,-.2,MAP.z); SCN.english.add(foam);
    arenaRing((lx,lz)=>{ sp('pk_Dock_Pole',lx,lz,{s:2.4}); lc(lx,lz,.8); });
    const B=[['hx_tavern_blue',-34,-6,9],['hx_market_blue',34,-30,9],['hx_home_A_blue',-30,22,8],['hx_home_B_blue',30,18,8],['hx_home_A_blue',36,-62,8],['hx_home_B_blue',-34,-58,8],['hx_tower_A_blue',-48,-36,8],['hx_well_blue',22,4,6]];
    for(const [n,lx,lz,s] of B){ sp(n,lx,lz,{s,ry:faceC(lx,lz)}); lc(lx,lz,n.includes('well')?2.6:s*.6); }
    sp('pk_Cannon',-14,-70,{s:2.2,ry:-2.6}); lc(-14,-70,1.6); sp('pk_Cannon',14,-70,{s:2.2,ry:-.5}); lc(14,-70,1.6);
    scatter(24,20,60,1.5,(lx,lz,i)=>{ sp(['pk_PalmTree_1','pk_PalmTree_2','pk_PalmTree_3'][i%3],lx,lz,{s:rnd(2,2.7),ry:rnd(0,6.28)}); lc(lx,lz,.9); });
    scatter(18,12,58,1,(lx,lz,i)=>{ const k=['pk_Barrel','pk_Barrel','pk_Bucket_Fishes','pk_Anchor','pk_Rock_1','pk_Rock_3'][i%6]; sp(k,lx,lz,{s:k==='pk_Anchor'?3:2.2,ry:rnd(0,6.28)}); if(k!=='pk_Anchor') lc(lx,lz,1); });
    for(let i=0;i<30;i++){ const a=rnd(0,Math.PI*2), r=rnd(84,92); sp(['pk_Rock_1','pk_Rock_2','pk_Rock_3'][i%3],Math.cos(a)*r,Math.sin(a)*r,{s:rnd(2.5,4.5),ry:rnd(0,6.28)}); }
    for(const a of [0.15,Math.PI-0.2,-2.1]){ for(let k=0;k<5;k++){ const r=86+k*6.6; sp('pk_Dock',Math.cos(a)*r,Math.sin(a)*r,{s:2.6,y:-2.25,ry:Math.atan2(Math.cos(a),Math.sin(a))}); } }
    sp('pk_Ship_Large',-4,-112,{s:1.5,y:-.4,ry:Math.PI/2+.2}); sp('pk_Ship_Small',112,-6,{s:2.4,y:-.2,ry:.4}); sp('pk_Ship_Small',-108,18,{s:2.4,y:-.2,ry:-2.4});
    floatWords(['A','B','C','Hi!','Hello','ABC','Whale','Ship','Sea','Fish','Wow','Yes'],'#ffffff');
  },
  science(){
    arenaRing((lx,lz,s,i)=>{ sp(i%2?'fo_Rock_3_A':'fo_Bush_3_A',lx,lz,{s:i%2?2.8:4,ry:rnd(0,6.28)}); lc(lx,lz,1.1); });
    ringOut(16,80,102,(lx,lz,i)=>sp(['hx_mountain_A_grass_trees','hx_mountain_B_grass','hx_mountain_C_grass_trees'][i%3],lx,lz,{s:rnd(15,21),ry:rnd(0,6.28),shadow:false}));
    sp('hx_mountain_C_grass_trees',0,-114,{s:14,ry:.4,shadow:false});
    const water=new THREE.MeshLambertMaterial({color:'#4aa3d8'}), shore=new THREE.MeshLambertMaterial({color:'#d9c58f'});
    for(const [lx,lz,r] of [[-36,-16,7],[34,-40,6],[-28,-62,5]]){
      const rim=new THREE.Mesh(new THREE.CircleGeometry(r+1.1,40),shore); rim.rotation.x=-Math.PI/2; rim.position.set(MAP.x+lx,.05,MAP.z+lz); rim.receiveShadow=true; SCN.science.add(rim);
      const w=new THREE.Mesh(new THREE.CircleGeometry(r,40),water); w.rotation.x=-Math.PI/2; w.position.set(MAP.x+lx,.08,MAP.z+lz); SCN.science.add(w); lc(lx,lz,r-.4);
      for(let i=0;i<5;i++){ const a=rnd(0,6.28), d=rnd(0,r-1.5); sp(i%2?'hx_waterlily_A':'hx_waterlily_B',lx+Math.cos(a)*d,lz+Math.sin(a)*d,{s:10,y:.1,ry:rnd(0,6.28),shadow:false}); }
      for(let i=0;i<5;i++){ const a=rnd(0,6.28); sp(i%2?'hx_waterplant_A':'hx_waterplant_B',lx+Math.cos(a)*(r+.3),lz+Math.sin(a)*(r+.3),{s:9,ry:rnd(0,6.28)}); }
    }
    sp('hx_windmill_green',36,8,{s:9,ry:faceC(36,8)}); lc(36,8,5); sp('hx_watermill_green',-47,-8,{s:8,ry:faceC(-47,-8)}); lc(-47,-8,4.5);
    scatter(8,48,60,3,(lx,lz,i)=>{ sp(i%2?'hx_hills_A_trees':'hx_hills_B_trees',lx,lz,{s:rnd(8,10),ry:rnd(0,6.28)}); lc(lx,lz,6.5); });
    scatter(16,16,58,2,(lx,lz,i)=>{ sp(['hx_trees_A_large','hx_trees_B_large','hx_trees_A_medium'][i%3],lx,lz,{s:rnd(6,7.5),ry:rnd(0,6.28)}); lc(lx,lz,3.6); });
    scatter(60,6,62,.5,(lx,lz,i)=>{ const k=['fo_Bush_1_A','fo_Bush_3_A','fo_Grass_1_A','fo_Grass_2_A','fo_Grass_1_A','fo_Rock_1_A'][i%6]; sp(k,lx,lz,{s:k.includes('Rock')?rnd(2,3):rnd(3.2,5),ry:rnd(0,6.28)}); });
    floatWords(['H2O','O2','CO2','pH','°C','雲','風','磁','電','骨','N','S'],'#eafcff');
  },
  social(){
    arenaRing((lx,lz)=>{ sp('hx_flag_yellow',lx,lz,{s:8.5,ry:rnd(0,6.28)}); lc(lx,lz,.7); });
    for(let i=0;i<26;i++){ const a=i/26*Math.PI*2; const lx=Math.cos(a)*67, lz=-24+Math.sin(a)*67; const off=Math.abs(Math.atan2(Math.sin(a-Math.PI/2),Math.cos(a-Math.PI/2))); if(off<.5) continue; sp(off<.75?'hx_wall_straight_gate':'hx_wall_straight',lx,lz,{s:8.2,ry:-a-Math.PI/2}); }
    sp('hx_castle_yellow',0,-102,{s:9}); for(const sx of [-17,17]){ sp('hx_tower_B_yellow',sx,-92,{s:7}); sp('hx_flag_yellow',sx*.55,-87,{s:9}); }
    const B=[['hx_home_A_yellow',-32,24,8],['hx_home_B_yellow',30,22,8],['hx_tavern_yellow',-34,-4,8],['hx_market_yellow',34,-28,8],['hx_blacksmith_yellow',-36,-48,8],['hx_church_yellow',36,-56,9],['hx_barracks_yellow',-46,-24,7],['hx_windmill_yellow',46,0,8],['hx_well_yellow',22,6,6],['hx_home_A_yellow',-24,-70,7],['hx_home_B_yellow',26,-78,7],['hx_tower_A_yellow',50,-40,7]];
    for(const [n,lx,lz,s] of B){ sp(n,lx,lz,{s,ry:faceC(lx,lz)}); lc(lx,lz,n.includes('well')?2.6:s*.6); }
    scatter(12,16,58,2,(lx,lz,i)=>{ const k=['hx_destroyed','hx_resource_stone','hx_crate_A_big','hx_resource_stone'][i%4]; sp(k,lx,lz,{s:k==='hx_destroyed'?7:6,ry:rnd(0,6.28)}); lc(lx,lz,k==='hx_destroyed'?4.5:1.6); });
    for(let i=0;i<10;i++){ const a=rnd(0,6.28); sp('hx_fence_stone_straight',Math.cos(a)*rnd(30,58),-24+Math.sin(a)*rnd(30,58),{s:7,ry:rnd(0,6.28)}); }
    ringOut(16,96,116,(lx,lz,i)=>sp(i%3?'mountain':'mountain2',lx,lz,{s:rnd(20,28),ry:rnd(0,6.28),shadow:false}));
    ringOut(8,84,92,(lx,lz)=>sp('hills',lx,lz,{s:rnd(14,18),ry:rnd(0,6.28),shadow:false}));
    floatWords(['民主','憲法','族群','經濟','城鄉','歷史','臺灣','文化','選舉','產業','法治','區域'],'#fff1c2');
  },
};
let buildingMap=null;
async function ensureSubject(sub){
  if(SCN[sub]) return true;
  if(buildingMap) return buildingMap;
  return buildingMap=(async()=>{
    const T=THEMES[sub];
    const box=document.createElement('div'); box.className='loadmsg'; box.innerHTML=`<b>正在開啟${T.map}…</b><span class="loadbar"><i></i></span>`; document.body.appendChild(box);
    try{
      await loadPack(T.pack,f=>{box.querySelector('i').style.width=(f*100)+'%';});
      if(sub==='math'){ const SKM=models['ch_Skeleton_Minion']; const pickS=n=>SKM&&SKM.animations.find(a=>a.name===n);
        const add={skAwaken:pickS('Skeletons_Awaken_Standing'),skDeath:pickS('Death_C_Skeletons'),skInactive:pickS('Skeleton_Inactive_Standing_Pose'),skRevive:pickS('Death_C_Skeletons_Resurrect')};
        for(const [k,v] of Object.entries(add)) if(v) CLIPS[k]=v; }
      for(const m of T.mon) if(!models[m]) throw new Error('missing '+m);
      if(!ruinsGround) buildMapBase();
      const grp=new THREE.Group(); grp.visible=false; scene.add(grp); SCN[sub]=grp; buildSub=sub;
      try{ SCENERY[sub](); } finally{ buildSub=null; }
      return true;
    }catch(e){ console.warn(e); delete packs[T.pack]; delete SCN[sub]; toast(`${T.map}載入失敗，請檢查網路後再試一次`); return false; }
    finally{ box.remove(); buildingMap=null; }
  })();
}
async function enterMap(u,sub){ if(!veil.hidden){veil.hidden=true;veil.innerHTML='';} if(talk) endTalk(); mode='ui'; stopMove();
  const target=sub&&SUBJ_DATA[sub]?sub:curSub;
  const ok=await ensureSubject(target); if(!ok){mode='play';return;} useSub(target); applyTheme(curSub); setUnit(u||curUnit); travel('math'); }
function applyTheme(sub){
  const T=THEMES[sub]||THEMES.math;
  ruinsGround.material.map=groundTex(sub); ruinsGround.material.needsUpdate=true; ruinsGround.scale.setScalar(T.island?T.island/150:1);
  arenaDiscs.forEach((d,i)=>{ d.material.map=arenaTex(sub,STAGES[i]); d.material.needsUpdate=true; });
  if(mapLabel){ const nl=labelSprite(T.map,{bg:T.color,size:1.1*1.7}); nl.position.copy(mapLabel.position); scene.remove(mapLabel); scene.add(nl); mapLabel=nl; }
  for(const [k,g] of Object.entries(SCN)) g.visible=k===sub;
  spawnMonsters(sub); setGuide(sub);
}
const bossFx={};
function buildBossRewards(){
  const B=STAGES[4]; const cx=MAP.x+B.x, cz=MAP.z+B.z;
  // treasure chest
  const chest=new THREE.Group(); chest.position.set(cx-5,0,cz+3.2); chest.rotation.y=.35;
  const wood=new THREE.MeshLambertMaterial({color:'#7a4520'}), gold=new THREE.MeshLambertMaterial({color:'#e2b04a',emissive:'#5a3b00',emissiveIntensity:.4});
  const base=new THREE.Mesh(new THREE.BoxGeometry(1.8,1,1.2),wood); base.position.y=.5; chest.add(base);
  for(const x of [-.6,.6]){const band=new THREE.Mesh(new THREE.BoxGeometry(.14,1.04,1.24),gold);band.position.set(x,.5,0);chest.add(band);}
  const lid=new THREE.Group(); lid.position.set(0,1,-.6); chest.add(lid);
  const top=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,1.8,16,1,false,0,Math.PI),wood); top.rotation.z=Math.PI/2; top.rotation.y=Math.PI/2; top.position.set(0,0,.6); lid.add(top);
  for(const x of [-.6,.6]){const b=new THREE.Mesh(new THREE.CylinderGeometry(.63,.63,.14,16,1,false,0,Math.PI),gold);b.rotation.z=Math.PI/2;b.rotation.y=Math.PI/2;b.position.set(x,0,.6);lid.add(b);}
  const lock=new THREE.Mesh(new THREE.BoxGeometry(.3,.36,.12),gold); lock.position.set(0,.92,.62); chest.add(lock);
  const glow=new THREE.PointLight('#ffd27a',1.2,7); glow.position.set(0,1.6,.6); chest.add(glow);
  const shine=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,4,20,1,true),new THREE.MeshBasicMaterial({color:'#ffe9a8',transparent:true,opacity:.18,side:THREE.DoubleSide,depthWrite:false})); shine.position.y=2.6; chest.add(shine);
  chest.traverse(o=>{if(o.isMesh&&o!==shine){o.castShadow=true;o.receiveShadow=true;}}); scene.add(chest);
  const tag=labelSprite('寶箱',{bg:'#8a5a12',size:.6}); tag.position.y=3; chest.add(tag);
  bossFx.chest=chest; bossFx.lid=lid; bossFx.glow=glow; bossFx.shine=shine; bossFx.tag=tag; bossFx.lidTarget=0;
  zones.push({id:'chest',area:'math',x:cx-5+Math.sin(.35)*1.8,z:cz+3.2+Math.cos(.35)*1.8,r:2.6,label:'打開寶箱',cond:()=>!!UM().chest&&!battle});
  // victory portal
  const grp=new THREE.Group(); grp.position.set(cx+5.5,0,cz+3.6); grp.rotation.y=-.35;
  const stone=new THREE.MeshLambertMaterial({color:'#a9a397'}), stoneD=new THREE.MeshLambertMaterial({color:'#7d776d'});
  for(const sx of [-2.1,2.1]){const p=new THREE.Mesh(new THREE.BoxGeometry(.9,5.2,.9),stone);p.position.set(sx,2.6,0);grp.add(p);}
  const lin=new THREE.Mesh(new THREE.BoxGeometry(5.4,.8,1.1),stoneD);lin.position.y=5.6;grp.add(lin);
  const sheet=new THREE.Mesh(new THREE.PlaneGeometry(3.3,4.6),portalMaterial('#5fd0ff'));sheet.position.y=2.75;grp.add(sheet);portals.push(sheet);
  const pl=labelSprite('回到學習冒險城',{bg:'#2f5ea8',size:.7}); pl.position.y=7.2; grp.add(pl);
  grp.traverse(o=>{if(o.isMesh&&o!==sheet)o.castShadow=true;}); scene.add(grp); bossFx.portal=grp;
  zones.push({id:'exit',area:'math',x:cx+5.5-Math.sin(.35)*2.6,z:cz+3.6+Math.cos(.35)*2.6,r:2.6,label:'走進傳送門，回到學習冒險城',cond:()=>!!UM().cleared[5]&&!battle});
  refreshBossRewards();
}
function refreshBossRewards(){
  const won=!!UM().cleared[5];
  bossFx.chest.visible=won; bossFx.portal.visible=won;
  const avail=!!UM().chest; bossFx.lidTarget=avail?0:-1.9; bossFx.glow.intensity=avail?1.2:.2; bossFx.shine.visible=avail; bossFx.tag.visible=avail;
}
const LOOT_EQ=['eq_crown','eq_rune','eq_bone'];
function openChest(){
  if(!UM().chest) return;
  UM().chest=0; sfx('chest'); const left=LOOT_EQ.filter(i=>!save.inv[i]); const r=Math.random(); let html, eq=null;
  if(left.length&&r<.4){ eq=left[Math.random()*left.length|0]; save.inv[eq]=1; }
  if(eq){ const i=ITEM[eq]; html=`<div class="card"><div class="glyph" style="background:${i.color}">${i.glyph}</div><div style="min-width:0"><h3>稀有裝備：${i.name}</h3><p>${i.desc}</p></div></div>`; }
  else if(r<.75){ const pool=['hint','glass','potion']; const a=pool[Math.random()*3|0], b=pool[Math.random()*3|0]; for(const x of [a,b]) save.inv[x]=(save.inv[x]||0)+1;
    const names=[a,b].map(x=>ITEM[x].name); html=`<div class="card"><div class="glyph" style="background:#3d8a4a">道</div><div style="min-width:0"><h3>冒險道具</h3><p>${names[0]}、${names[1]}，已放進背包。</p></div></div>`; }
  else { const c=30+(Math.random()*4|0)*10; addCoins(c,'chest'); html=`<div class="card"><div class="glyph" style="background:#e2b04a;color:#2a1b12">金</div><div style="min-width:0"><h3>一袋金幣</h3><p>獲得 ${c} 金幣。</p></div></div>`; }
  persist(); hud(); refreshBossRewards(); oneShot(player.ch,'cheer','idle',1700);
  setTimeout(()=>{ openPanel(panelShell('寶箱打開了！',eq?'運氣真好，開出了稀有裝備！':'這次沒有開出裝備。每個單元的魔王寶箱只在第一次通關時出現，試試其他單元吧！',html+(eq?'<p class="note" style="color:var(--parchment)">到城裡的裁縫屋找莉莉，就能換上新裝備。</p>':'')+`<p class="note">還沒開出的稀有裝備：${LOOT_EQ.filter(i=>!save.inv[i]).map(i=>ITEM[i].name).join('、')||'全部收集完成！'}</p>`)); },700);
}

/* ---------- travel ---------- */
const fadeEl=document.createElement('div');
fadeEl.style.cssText='position:fixed;inset:0;background:#120a05;opacity:0;pointer-events:none;transition:opacity .45s;z-index:40';
document.body.appendChild(fadeEl);
function travel(to){
  mode='ui'; stopMove(); fadeEl.style.opacity='1';
  setTimeout(()=>{
    area=to; player.pos.copy(SPAWN[to]); player.vy=0; player.yaw=to==='math'?Math.PI:-Math.PI/2; cam.yaw=to==='math'?0:Math.PI/2;
    if(to==='math'){const bg=MATH_UNITS[curUnit-1].bg;scene.background.set(bg);scene.fog.color.set(bg);scene.fog.near=60;scene.fog.far=150;}
    else {scene.background.set('#9fcbe8');scene.fog.color.set('#c9e0ec');scene.fog.near=80;scene.fog.far=190;}
    camera.position.set(player.pos.x+Math.sin(cam.yaw)*12,player.pos.y+6,player.pos.z+Math.cos(cam.yaw)*12);
    lastArea='__'; nearZone=null; $('prompt').hidden=true; petTeleport(); stopNav();
    setTimeout(()=>{fadeEl.style.opacity='0';mode='play';canvas.focus();
      if(to==='math'){toast(`${THEMES[curSub].map}．${MATH_UNITS[curUnit-1].title}`); if(curSub==='english'&&!sndPref.enAuto&&!sessionStorage.getItem('lt-en-hint')){try{sessionStorage.setItem('lt-en-hint','1');}catch(e){} setTimeout(()=>toast('小提醒：英文題目旁的 🔊 可以聽發音；「聲音」裡可以打開「英語自動朗讀」。'),2600);} if(!save.ach.ruins){save.ach.ruins=1;persist();hud();}}},350);
  },480);
}
function exitMap(){ if(talk) endTalk(); travel('town'); }

/* ---------- minimap for the ruins ---------- */
function drawRuinsMap(){
  const W=300,cx=W/2,sc=W/120; mctx.setTransform(1,0,0,1,0,0); mctx.clearRect(0,0,W,W);
  mctx.save(); mctx.beginPath(); mctx.arc(cx,cx,cx,0,7); mctx.clip(); mctx.fillStyle=(THEMES[curSub]||THEMES.math).mini; mctx.fillRect(0,0,W,W);
  const P=(lx,lz)=>[cx+lx*sc,cx+(lz+24)*sc];
  mctx.strokeStyle='#9c7845'; mctx.lineWidth=9; mctx.beginPath(); mctx.moveTo(...P(0,30)); for(const s of STAGES) mctx.lineTo(...P(s.x,s.z)); mctx.stroke();
  const mark=(lx,lz,t,c)=>{const [x,y]=P(lx,lz);mctx.fillStyle=c;mctx.beginPath();mctx.arc(x,y,14,0,7);mctx.fill();mctx.strokeStyle='#e2b04a';mctx.lineWidth=2;mctx.stroke();mctx.fillStyle='#fbf3e1';mctx.font='bold 15px "LXGW WenKai TC","Noto Sans TC",serif';mctx.textAlign='center';mctx.textBaseline='middle';mctx.fillText(t,x,y+1);};
  mark(0,36,'回','#3a2a5a');
  if(UM().cleared[5]) mark(5.5,-72.4,'回','#2f5ea8');
  if(UM().chest) mark(-5,-72.8,'寶','#c9961f');
  for(const s of STAGES) mark(s.x,s.z,s.boss?'王':String(s.n),UM().cleared[s.n]?'#3d8a4a':stageLocked(s.n)?'#7d776d':'#b33a2c');
  const [px,py]=P(player.pos.x-MAP.x,player.pos.z-MAP.z); mctx.translate(px,py); mctx.rotate(-player.yaw+Math.PI);
  mctx.fillStyle='#fbf3e1'; mctx.strokeStyle='#2a1b12'; mctx.lineWidth=3; mctx.beginPath(); mctx.moveTo(0,-13); mctx.lineTo(9,9); mctx.lineTo(0,4); mctx.lineTo(-9,9); mctx.closePath(); mctx.fill(); mctx.stroke();
  mctx.restore();
}

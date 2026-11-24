/* 學習冒險城．js/22-pets.js
 * 寵物：資料、跟隨、寵物小屋、領養、寵物進化
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ======================= 寵物系統（Quaternius Ultimate Animated Animal Pack，CC0） ======================= */
const BIG={idle:'Idle',walk:'Walk',run:'Run',jump:'Jump',eat:'Wave',idle2:'Yes'};
const FLY={idle:'Flying_Idle',walk:'Fast_Flying',run:'Fast_Flying',jump:'Headbutt',eat:'Yes',idle2:'Yes'};
const PETS=[
  {id:'mushnub',model:'um_Mushnub',name:'蘑菇球',  def:'菇菇',h:.8, price:80, color:'#d9863a',perk:'幸運：打倒怪物時多得 3 金幣',
   anims:{idle:'Idle',walk:'Walk',run:'Walk',jump:'Jump',eat:'Dance',idle2:'Yes'}},
  {id:'cactoro',model:'um_Cactoro',name:'仙人掌勇士',def:'刺刺',h:1.05,price:100,color:'#5a8f3c',perk:'守護：每場戰鬥第一次答錯，不會被扣心',anims:BIG},
  {id:'hywirl', model:'um_Hywirl', name:'紫旋精靈',def:'旋旋',h:.95,price:120,color:'#8a4fb0',perk:'聰明：每場戰鬥第一題，自動刪去一個錯誤選項',anims:FLY,fly:.35},
  {id:'demon',  model:'um_Demon',  name:'小惡魔',  def:'角角',h:1,  price:150,color:'#b33a2c',perk:'時光：魔王關每題多 15 秒',anims:BIG},
  {id:'ghost',  model:'um_Ghost',  name:'影翼精靈',def:'夜夜',h:.95,price:180,color:'#3d2a4d',perk:'祝福：許願井的金幣變成兩倍',anims:FLY,fly:.35},
  {id:'dino',   model:'um_Dino',   name:'寶石小龍',def:'寶寶',h:1.05,price:200,color:'#b0476a',perk:'龍息：答對時有 3 成機會造成兩倍傷害',anims:BIG},
];
const PET_EVO={
  mushnub:{model:'umx_Mushnub_Evolved',name:'超級蘑菇球',anims:{idle:'Idle',walk:'Walk',run:'Walk',jump:'Jump',eat:'Dance',idle2:'Yes'},h:1.05},
  cactoro:{name:'黃金仙人掌勇士',grow:1.25,glow:'#ffd76a'},
  hywirl:{name:'星光紫旋精靈',grow:1.25,glow:'#d6b8ff'},
  demon:{model:'umx_BlueDemon',name:'藍焰惡魔',anims:BIG,h:1.25},
  ghost:{model:'umx_Ghost_Skull',name:'骷髏影翼',anims:FLY,fly:.4,h:1.1},
  dino:{model:'umx_Dragon',name:'飛天寶石龍',anims:FLY,fly:.5,h:.85},
};
const EVO_LOVE=25;
const OLD_PET={shiba:'mushnub',husky:'cactoro',fox:'hywirl',alpaca:'demon',deer:'ghost',wolf:'dino',mushroom:'mushnub',slime:'cactoro',ghost:'hywirl',demon:'demon',bat:'ghost',dragon:'dino'};
function migratePets(){ if(!(save.pets&&save.pets.owned&&save.pets.v!==3)) return; const own={},src=save.pets.owned;
  for(const [o,v] of Object.entries(src)){ const n=OLD_PET[o]||o; if(PETS.some(p=>p.id===n)) own[n]=own[n]||v; }
  save.pets.owned=own; if(save.pets.active) save.pets.active=OLD_PET[save.pets.active]||save.pets.active; if(!own[save.pets.active]) save.pets.active=null; save.pets.v=3; persist(); }
const PET=Object.fromEntries(PETS.map(p=>[p.id,p]));
const PETLOC={x:-44,z:40}; let spawnPen=()=>{};
function petPerk(id){ return save.pets&&save.pets.active===id; }
function buildPet(id,evo){
  const P=PET[id], E=evo?PET_EVO[id]:null; const useM=!!(E&&E.model&&models[E.model]); const g=models[useM?E.model:P.model]; if(!g) return null;
  const anims=useM?E.anims:P.anims, hh=useM?E.h:P.h*(E&&E.grow||1), fly=useM?(E.fly||0):(P.fly||0);
  const root=THREE.SkeletonUtils.clone(g.scene);
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false;}});
  const holder=new THREE.Group(); holder.add(root);
  const box=new THREE.Box3().setFromObject(root); const h=box.max.y-box.min.y||1; const s=hh*1.3/h; root.scale.multiplyScalar(s);
  const box2=new THREE.Box3().setFromObject(root); root.position.y-=box2.min.y;
  const mixer=new THREE.AnimationMixer(root); const actions={};
  const find=n=>g.animations.find(a=>a.name===n);
  for(const [k,n] of Object.entries(anims)){ let c=find(n); if(!c) continue; if(Object.values(actions).some(a=>a.getClip()===c)) c=c.clone(); actions[k]=mixer.clipAction(c); }
  if(anims.run===anims.walk&&actions.run) actions.run.timeScale=1.7;
  for(const k of ['eat','jump','idle2']) if(actions[k]){actions[k].setLoop(THREE.LoopOnce);actions[k].clampWhenFinished=true;}
  if(E&&!useM&&E.glow){ root.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.emissive=new THREE.Color(E.glow);o.material.emissiveIntensity=.4;}});
    const ring=new THREE.Mesh(new THREE.RingGeometry(.75*hh,1.15*hh,32),new THREE.MeshBasicMaterial({color:E.glow,transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false})); ring.rotation.x=-Math.PI/2; ring.position.y=.07; holder.add(ring); }
  return {holder,root,mixer,actions,cur:null,id,h:hh,fly};
}
/* --- 玩家帶著的寵物 --- */
let pet=null;
function rebuildPet(){
  if(pet){scene.remove(pet.holder);pet=null;}
  const id=save.pets&&save.pets.active; if(!id||!save.pets.owned[id]) return;
  const po=save.pets.owned[id]; if(po.evo&&PET_EVO[id].model&&!packs.petevo) loadPack('petevo').then(()=>rebuildPet()).catch(()=>{delete packs.petevo;});
  pet=buildPet(id,!!po.evo); if(!pet) return;
  const tag=labelSprite(po.name||PET[id].name,{bg:'rgba(42,27,18,.85)',size:.4}); tag.position.y=pet.h*1.25+.6; pet.holder.add(tag);
  pet.holder.position.set(player.pos.x+1.5,0,player.pos.z+1.5); pet.yaw=player.yaw; scene.add(pet.holder); playOn(pet,'idle'); pet.idleT=0;
}
function petTeleport(){ if(pet){pet.holder.position.set(player.pos.x-Math.sin(player.yaw)*2,0,player.pos.z-Math.cos(player.yaw)*2);} }
function updatePet(dt){
  if(!pet) return; const p=pet.holder.position;
  if(mode==='battle'&&battle){ const tx=player.pos.x+1.7, tz=player.pos.z+.4; p.x+=(tx-p.x)*Math.min(1,dt*6); p.z+=(tz-p.z)*Math.min(1,dt*6); pet.holder.rotation.y=Math.PI; if(!pet.busy) playOn(pet,'idle'); pet.mixer.update(dt); return; }
  const back=1.8, side=.9;
  const tx=player.pos.x-Math.sin(player.yaw)*back+Math.cos(player.yaw)*side, tz=player.pos.z-Math.cos(player.yaw)*back-Math.sin(player.yaw)*side;
  const dx=tx-p.x, dz=tz-p.z, d=Math.hypot(dx,dz);
  if(d>12){ p.set(tx,0,tz); }
  else if(d>.6){ const sp=Math.min(13,d*2.6); p.x+=dx/d*sp*dt; p.z+=dz/d*sp*dt; let a=Math.atan2(dx,dz)-(pet.yaw||0); a=Math.atan2(Math.sin(a),Math.cos(a)); pet.yaw=(pet.yaw||0)+a*Math.min(1,dt*8); pet.busy=false; playOn(pet,sp>6?'run':'walk'); pet.idleT=0; }
  else { let a=player.yaw-(pet.yaw||0); a=Math.atan2(Math.sin(a),Math.cos(a)); pet.yaw+=a*Math.min(1,dt*2); if(!pet.busy) playOn(pet,'idle'); pet.idleT+=dt;
    if(pet.idleT>7&&!pet.busy){ pet.idleT=0; oneShot(pet,Math.random()<.5?'eat':'idle2','idle',2600); } }
  p.y=pet.fly?pet.fly+Math.sin(performance.now()/400)*.12:0; pet.holder.rotation.y=pet.yaw; pet.mixer.update(dt);
}
/* --- 寵物小屋與展示柵欄 --- */
const penPets=[];
function buildPetHouse(){
  const {x,z}=PETLOC;
  place('homeA2',x-10,z+4,{s:8,face:true}); circ(x-10,z+4,4.2);
  label('魔法寵物屋',x-10,z+4,13);
  // 柵欄圍出展示區
  const R=6.2, n=22; const fenceWood=new THREE.MeshLambertMaterial({color:'#8a5a35'}), fenceDark=new THREE.MeshLambertMaterial({color:'#5e3b22'});
  for(let i=0;i<n;i++){ const a=i/n*Math.PI*2; if(Math.abs(Math.atan2(Math.sin(a+0.785),Math.cos(a+0.785)))<.4) continue;
    const fx=x+4+Math.cos(a)*R, fz=z+Math.sin(a)*R; const post=new THREE.Mesh(new THREE.BoxGeometry(.28,1.3,.28),fenceDark); post.position.set(fx,.65,fz); post.castShadow=true; scene.add(post); circ(fx,fz,.55);
    const a2=(i+1)/n*Math.PI*2; if(Math.abs(Math.atan2(Math.sin(a2+0.785),Math.cos(a2+0.785)))<.4) continue; const gx=x+4+Math.cos(a2)*R, gz=z+Math.sin(a2)*R; const L=Math.hypot(gx-fx,gz-fz);
    for(const hy of [.45,.95]){ const rail=new THREE.Mesh(new THREE.BoxGeometry(.12,.14,L),fenceWood); rail.position.set((fx+gx)/2,hy,(fz+gz)/2); rail.rotation.y=Math.atan2(gx-fx,gz-fz); rail.castShadow=true; scene.add(rail); }
    circ((fx+gx)/2,(fz+gz)/2,.55); }
  const grass=new THREE.Mesh(new THREE.CircleGeometry(R,40),new THREE.MeshLambertMaterial({color:'#76a446'})); grass.rotation.x=-Math.PI/2; grass.position.set(x+4,.03,z); grass.receiveShadow=true; scene.add(grass);
  place('bucket',x+7,z-2,{s:6}); place('sack',x+1,z+3,{s:7});
  spawnPen=()=>PETS.forEach((P,i)=>{ const pp=buildPet(P.id); if(!pp) return; const a=i/PETS.length*Math.PI*2; pp.holder.position.set(x+4+Math.cos(a)*3,0,z+Math.sin(a)*3); pp.yaw=rnd(0,6.28); pp.target=null; pp.wait=rnd(1,4); scene.add(pp.holder); playOn(pp,'idle');
    const t=labelSprite(P.name,{bg:P.color,size:.38}); t.position.y=P.h*1.25+.55; pp.holder.add(t); penPets.push(pp); });
}
function updatePen(dt){
  if(area!=='town') return; const {x,z}=PETLOC; const cx=x+4;
  if(Math.hypot(player.pos.x-cx,player.pos.z-z)>45) return;
  for(const pp of penPets){ const p=pp.holder.position;
    if(pp.wait>0){ pp.wait-=dt; if(!pp.busy) playOn(pp,'idle'); if(pp.wait<=0){ const a=rnd(0,6.28), r=rnd(0,4.2); pp.target=[cx+Math.cos(a)*r,z+Math.sin(a)*r]; } if(Math.random()<dt*.08&&!pp.busy) oneShot(pp,'eat','idle',2600); }
    else if(pp.target){ const dx=pp.target[0]-p.x, dz=pp.target[1]-p.z, d=Math.hypot(dx,dz); if(d<.3){pp.target=null;pp.wait=rnd(2,6);} else { p.x+=dx/d*1.6*dt; p.z+=dz/d*1.6*dt; let a=Math.atan2(dx,dz)-pp.yaw; a=Math.atan2(Math.sin(a),Math.cos(a)); pp.yaw+=a*Math.min(1,dt*5); pp.busy=false; playOn(pp,'walk'); } }
    if(PET[pp.id].fly) p.y=PET[pp.id].fly+Math.sin(performance.now()/400+pp.yaw)*.12; pp.holder.rotation.y=pp.yaw; pp.mixer.update(dt); }
}
/* --- 介面 --- */
function petsOwned(){ return save.pets?Object.keys(save.pets.owned||{}):[]; }

function openPetShop(){
  const cards=PETS.map(P=>{ const own=save.pets&&save.pets.owned[P.id];
    return `<div class="card"><div class="glyph" style="background:${P.color}">${P.name[0]}</div><div style="min-width:0"><h3>${P.name}</h3><p>${P.perk}</p><div class="meta"><span class="purse"><span class="gem"></span>${P.price} 金幣</span></div></div>${own?'<button class="act" type="button" disabled>已領養</button>':`<button class="act" type="button" data-adopt="${P.id}" ${save.coins<P.price?'disabled':''}>領養</button>`}</div>`;}).join('');
  openPanel(panelShell('魔法寵物屋．領養',`你有 ${save.coins} 金幣。每隻寵物都有一個冒險能力，只有「帶在身邊」的寵物會發揮能力。`,cards));
  veil.querySelectorAll('[data-adopt]').forEach(b=>b.onclick=()=>adoptStep(b.dataset.adopt));
}
function adoptStep(id){
  const P=PET[id];
  openPanel(panelShell(`領養${P.name}`,P.perk,`<div class="scroll">幫你的${P.name}取個名字吧！</div>
    <input id="petName" maxlength="8" value="${P.def}" style="font:inherit;font-size:20px;padding:10px 12px;border-radius:10px;border:2px solid var(--brass-deep);background:var(--parchment);color:var(--ink);font-family:var(--f-display)">
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="act" type="button" id="adoptYes">花 ${P.price} 金幣領養</button><button class="act ghost" type="button" id="adoptNo" style="color:var(--parchment)">再想想</button></div>`));
  $('petName').focus(); $('petName').select();
  $('adoptNo').onclick=()=>openPetShop();
  $('adoptYes').onclick=()=>{ if(save.coins<P.price){toast('金幣不夠喔');return;}
    const nm=($('petName').value.trim()||P.name).slice(0,8); spendCoins(P.price,'pet'); save.pets=save.pets||{owned:{},active:null,v:3};
    save.pets.owned[id]={name:nm,love:0}; save.pets.active=id; if(!save.ach.pet){save.ach.pet=1;toast('達成成就「我的好夥伴」！');}
    persist(); hud(); rebuildPet(); checkAch();
    openPanel(panelShell('領養成功！',`${nm}現在跟著你一起冒險了。`,`<div class="scroll">${nm}的能力：${P.perk}<br>點右上角的「寵物」可以更換帶在身邊的寵物、改名字或跟牠玩。</div><button class="act" type="button" id="adoptOk" style="align-self:flex-start">好！</button>`));
    $('adoptOk').onclick=()=>closePanel(); if(pet) oneShot(pet,'jump','idle',1400); };
}
function openPets(){
  const ids=petsOwned();
  const body=ids.length?ids.map(id=>{const P=PET[id],o=save.pets.owned[id],on=save.pets.active===id; const lv=Math.min(10,Math.floor((o.love||0)/5));
    return `<div class="card"><div class="glyph" style="background:${P.color}">${P.name[0]}</div><div style="min-width:0"><h3>${esc(o.name)}<span style="font-size:13px;color:#6b4c2c;margin-left:6px">${o.evo?PET_EVO[id].name:P.name}</span></h3><p>${P.perk}</p>
    <div class="meta"><span>親密度 ${'♥'.repeat(lv)}${'♡'.repeat(10-lv)}</span>${on?'<span class="chip" style="background:#3d8a4a">帶在身邊</span>':''}${o.evo?'<span class="chip" style="background:#b8862a">已進化</span>':(o.love||0)>=EVO_LOVE?`<button class="act" type="button" data-evo="${id}">進化！</button>`:`<span>再增加 ${EVO_LOVE-(o.love||0)} 親密度就能進化</span>`}</div>
    <div class="meta"><button class="act ghost" type="button" data-play="${id}" ${on?'':'disabled'}>摸摸牠</button><button class="act ghost" type="button" data-rename="${id}">改名字</button></div></div>
    ${on?`<button class="act ghost" type="button" data-rest="${id}">休息</button>`:`<button class="act" type="button" data-take="${id}">帶在身邊</button>`}</div>`;}).join('')
    :'<div class="empty">還沒有寵物。<br>到城西南的魔法寵物屋找露露領養吧！</div>';
  openPanel(panelShell('我的寵物','一次可以帶一隻寵物，牠的能力只在帶在身邊時發揮。打倒怪物會增加親密度。',body));
  veil.querySelectorAll('[data-take]').forEach(b=>b.onclick=()=>{save.pets.active=b.dataset.take;persist();rebuildPet();openPets();});
  veil.querySelectorAll('[data-evo]').forEach(b=>b.onclick=()=>evolvePet(b.dataset.evo));
  veil.querySelectorAll('[data-rest]').forEach(b=>b.onclick=()=>{save.pets.active=null;persist();rebuildPet();openPets();});
  veil.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>{const o=save.pets.owned[b.dataset.play];const t=today(); if(o.pat!==t){o.pat=t;o.love=(o.love||0)+1;persist();toast(`${o.name}很開心！親密度增加了`);} else toast(`${o.name}開心地轉圈圈`); if(pet) oneShot(pet,'jump','idle',1400);});
  veil.querySelectorAll('[data-rename]').forEach(b=>b.onclick=()=>{const id=b.dataset.rename,o=save.pets.owned[id];
    openPanel(panelShell('改名字',PET[id].name,`<input id="petRename" maxlength="8" value="${esc(o.name)}" style="font:inherit;font-size:20px;padding:10px 12px;border-radius:10px;border:2px solid var(--brass-deep);background:var(--parchment);color:var(--ink);font-family:var(--f-display)"><div style="display:flex;gap:8px"><button class="act" type="button" id="rnOk">確定</button><button class="act ghost" type="button" id="rnNo" style="color:var(--parchment)">取消</button></div>`));
    $('petRename').focus(); $('rnNo').onclick=()=>openPets(); $('rnOk').onclick=()=>{o.name=($('petRename').value.trim()||PET[id].name).slice(0,8);persist();rebuildPet();openPets();};});
}

/* ======================= 寵物進化 ======================= */
async function evolvePet(id){
  const o=save.pets&&save.pets.owned[id]; if(!o||o.evo||(o.love||0)<EVO_LOVE) return; const E=PET_EVO[id];
  if(E.model){ try{ toast('進化中…'); await loadPack('petevo'); }catch(e){ delete packs.petevo; toast('載入失敗，請檢查網路後再試一次'); return; } }
  o.evo=1; save.pets.active=id; persist(); rebuildPet(); checkAch(); hud(); if(pet) oneShot(pet,'jump','idle',1400);
  openPanel(panelShell('進化成功！',`${esc(o.name)}進化成「${E.name}」了！`,`<div class="scroll">${esc(o.name)}變得更帥氣了！能力一樣是：${PET[id].perk}<br>繼續帶著牠一起冒險吧。</div><button class="act" type="button" id="evoOk" style="align-self:flex-start">太棒了！</button>`));
  $('evoOk').onclick=()=>openPets();
}

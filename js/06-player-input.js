/* 學習冒險城．js/06-player-input.js
 * 玩家角色、鍵盤／滑鼠／觸控搖桿、碰撞
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ======================= PLAYER ======================= */
const player={pos:new THREE.Vector3(0,0,24),yaw:Math.PI,ch:null,tag:null,vy:0};
function rebuildPlayer(){
  const old=player.ch; if(old) scene.remove(old.holder);
  const ch=buildCharacter(save.look); scene.add(ch.holder); player.ch=ch; playOn(ch,'idle');
  const tag=labelSprite(save.name||'冒險者',{bg:'rgba(42,27,18,.85)',size:.5}); tag.position.y=save.title?2.98:2.6; ch.holder.add(tag);
  if(save.title){const t=labelSprite(save.title,{bg:'rgba(179,58,44,.92)',size:.34});t.position.y=2.32;ch.holder.add(t);}
  ch.holder.position.copy(player.pos); ch.holder.rotation.y=player.yaw;
}

/* ======================= INPUT ======================= */
const keys={}; let mode='create'; // create | play | ui | talk
const isTouch=matchMedia('(pointer:coarse)').matches;
addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT') return;
  keys[e.code]=true;
  if(mode==='tour'){ if(e.code==='Escape') endTour(); else if(e.code==='ArrowRight'||e.code==='Enter'||e.code==='Space'){e.preventDefault();$('tourNext').click();} else if(e.code==='ArrowLeft') $('tourPrev').click(); return; }
  if(mode==='play'&&e.code==='KeyM'){ openBigMap(); return; }
  if(mode==='play'){
    if(e.code==='KeyE'||e.code==='Enter'){ if(nearZone){e.preventDefault();interact(nearZone);} }
    if(e.code==='Space'){e.preventDefault();jump();}
    if(e.code==='KeyB') openBag();
  } else if(mode==='talk'){
    if(e.code==='Escape') endTalk();
    if(e.code==='KeyE'||e.code==='Enter'||e.code==='Space'){e.preventDefault();advanceTalk();}
  } else if(mode==='ui'&&e.code==='Escape') closePanel();
  else if(mode==='ui'&&altCur&&altCur.type==='num'&&!altCur.locked){const k=e.key; if(/^[0-9]$/.test(k)||k==='.'||k==='-') altKey(k); else if(k==='Backspace'){e.preventDefault();altKey('⌫');} else if(k==='Enter'){e.preventDefault();altKey('ok');}}
  else if(mode==='ui'&&((pr&&!pr.locked)||(qz&&!qz.locked))){const n=['Digit1','Digit2','Digit3','Digit4'].indexOf(e.code);const bs=veil.querySelectorAll('.propts .bopt');if(n>=0&&bs[n])bs[n].click();}
  else if(mode==='battle'&&battle&&battle.cur&&battle.cur.type==='num'&&!battle.locked){const k=e.key; if(/^[0-9]$/.test(k)||k==='.'||k==='-') numKey(k); else if(k==='Backspace'){e.preventDefault();numKey('⌫');} else if(k==='Enter'){e.preventDefault();numKey('ok');}}
  else if(mode==='battle'&&battle){const n=['Digit1','Digit2','Digit3','Digit4'].indexOf(e.code);const bs=$('bOpts').querySelectorAll('.bopt');if(n>=0&&bs[n]&&!bs[n].disabled){bs[n].click();}}
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
const cam={yaw:0,pitch:.36,dist:12}; let lastDrag=-1e9;
let drag=null;
canvas.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.focus();});
canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;lastDrag=performance.now();const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;cam.yaw-=dx*.006;cam.pitch=Math.min(1.15,Math.max(.08,cam.pitch+dy*.004));});
canvas.addEventListener('pointerup',e=>{if(drag&&drag.id===e.pointerId)drag=null;});
canvas.addEventListener('pointercancel',()=>{drag=null;});
canvas.addEventListener('wheel',e=>{e.preventDefault();cam.dist=Math.min(26,Math.max(5,cam.dist+e.deltaY*.01));},{passive:false});
const stick={x:0,y:0,id:null}; const stickEl=$('stick'),knob=$('knob');
stickEl.addEventListener('pointerdown',e=>{stick.id=e.pointerId;stickEl.setPointerCapture(e.pointerId);moveStick(e);});
stickEl.addEventListener('pointermove',e=>{if(stick.id===e.pointerId)moveStick(e);});
const endStick=()=>{stick.id=null;stick.x=stick.y=0;knob.style.transform='';};
stickEl.addEventListener('pointerup',endStick);stickEl.addEventListener('pointercancel',endStick);
function moveStick(e){const r=stickEl.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const m=Math.hypot(dx,dy),max=r.width/2-10;if(m>max){dx*=max/m;dy*=max/m;}knob.style.transform=`translate(${dx}px,${dy}px)`;stick.x=dx/max;stick.y=dy/max;}
$('actBtn').addEventListener('click',()=>{if(mode==='play'){nearZone?interact(nearZone):jump();}else if(mode==='talk')advanceTalk();});
$('prompt').addEventListener('click',()=>{if(mode==='play'&&nearZone)interact(nearZone);});
function jump(){if(player.pos.y>0.01)return;player.vy=8;if(player.ch.actions.jump){oneShot(player.ch,'jump','idle',700);}}

/* ======================= COLLISION ======================= */
function collide(p){
  const R=.6;
  for(const c of colliders){
    if(c.sub&&(area==='town'||c.sub!==curSub)) continue;
    if(c.box){const [x0,z0,x1,z1]=c.box;const qx=Math.max(x0,Math.min(p.x,x1)),qz=Math.max(z0,Math.min(p.z,z1));const dx=p.x-qx,dz=p.z-qz,d=Math.hypot(dx,dz);
      if(d<R){if(d>1e-4){p.x=qx+dx/d*R;p.z=qz+dz/d*R;}else{const o=[[p.x-x0,-1,0],[x1-p.x,1,0],[p.z-z0,0,-1],[z1-p.z,0,1]].sort((a,b)=>a[0]-b[0])[0];p.x+=o[1]*(o[0]+R);p.z+=o[2]*(o[0]+R);}}}
    else if(c.r>0){const dx=p.x-c.x,dz=p.z-c.z,d=Math.hypot(dx,dz),m=c.r+R;if(d<m&&d>1e-4){p.x=c.x+dx/d*m;p.z=c.z+dz/d*m;}}
  }
  if(area==='town'){const d=Math.hypot(p.x,p.z); if(d>64){p.x*=64/d;p.z*=64/d;} if(p.z>LOC.gate.z-1.5) p.z=LOC.gate.z-1.5;}
  else {const cx=MAP.x,cz=MAP.z-24,dx=p.x-cx,dz=p.z-cz,d=Math.hypot(dx,dz); if(d>62){p.x=cx+dx/d*62;p.z=cz+dz/d*62;}}
}

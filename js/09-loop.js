/* 學習冒險城．js/09-loop.js
 * 互動區、小地圖、主迴圈 tick、玩家與 NPC 移動
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ======================= INTERACT ======================= */
let nearZone=null;
function interact(z){
  if(z.npc) startTalk(z.npc);
  else if(z.id==='portal') openPortal(z.sub);
  else if(z.id==='notice') openNotice();
  else if(z.id==='well') openWell();
  else if(z.id==='monster') startBattle(z.stage);
  else if(z.id==='exit') exitMap();
  else if(z.id==='chest') openChest();
  else if(z.id==='animal') petAnimal(z.ref);
}
function buildZones(){
  for(const n of npcs){ zones.push({npc:n.def.id,ref:n,r:3.2,label:`和${n.def.name}說話`,labelFn:()=>`和${n.def.name}說話`,place:n.def.place,area:n.def.area||'town'}); }
  zones.push({id:'well',x:0,z:3.3,r:2.6,label:'在許願井許願',place:'well'});
}

/* ======================= MINIMAP ======================= */
const mm=$('minimap'),mctx=mm.getContext('2d');
const MAPMARK=[['委','#b33a2c',LOC.guild],['市','#b8862a',LOC.market],['鐵','#5b5f66',LOC.smith],['裁','#7a4fb0',LOC.tailor],['書','#2f5ea8',LOC.library],['門','#3a2a5a',{x:-35,z:2}],['堡','#8a2a20',{x:0,z:-56}],['訓','#3d8a4a',LOC.training],['井','#6f6458',{x:0,z:0}],['寵','#d9863a',{x:-40,z:40}]];
function drawMinimap(){
  const W=300,cx=W/2,sc=W/140; mctx.setTransform(1,0,0,1,0,0); mctx.clearRect(0,0,W,W);
  mctx.save(); mctx.beginPath(); mctx.arc(cx,cx,cx,0,7); mctx.clip();
  mctx.fillStyle='#7fae4c'; mctx.fillRect(0,0,W,W);
  const P=(x,z)=>[cx+x*sc,cx+z*sc];
  mctx.strokeStyle='#c4a06a'; mctx.lineWidth=10*sc*.5;
  for(const k of ['castle','guild','market','smith','gate','tailor','portal','library']){mctx.beginPath();mctx.moveTo(cx,cx);mctx.lineTo(...P(LOC[k].x,LOC[k].z));mctx.stroke();}
  mctx.fillStyle='#a49a8c'; mctx.beginPath(); mctx.arc(cx,cx,16*sc,0,7); mctx.fill();
  mctx.fillStyle='#8a8279'; mctx.beginPath(); mctx.arc(...P(-35,2),14*sc,0,7); mctx.fill();
  mctx.fillStyle='#6f6458'; mctx.fillRect(...P(-60,LOC.gate.z-1.5),120*sc,3*sc);
  for(const [t,c,L] of MAPMARK){const [x,y]=P(L.x,L.z);mctx.fillStyle=c;mctx.beginPath();mctx.arc(x,y,14,0,7);mctx.fill();mctx.strokeStyle='#e2b04a';mctx.lineWidth=2;mctx.stroke();
    mctx.fillStyle='#fbf3e1';mctx.font='bold 15px "LXGW WenKai TC","Noto Sans TC",serif';mctx.textAlign='center';mctx.textBaseline='middle';mctx.fillText(t,x,y+1);}
  for(const n of npcs){const [x,y]=P(n.holder.position.x,n.holder.position.z);mctx.fillStyle='#fff3b0';mctx.beginPath();mctx.arc(x,y,3.5,0,7);mctx.fill();}
  const [px,py]=P(player.pos.x,player.pos.z); mctx.translate(px,py); mctx.rotate(-player.yaw+Math.PI);
  mctx.fillStyle='#fbf3e1'; mctx.strokeStyle='#2a1b12'; mctx.lineWidth=3; mctx.beginPath(); mctx.moveTo(0,-13); mctx.lineTo(9,9); mctx.lineTo(0,4); mctx.lineTo(-9,9); mctx.closePath(); mctx.fill(); mctx.stroke();
  mctx.restore();
}

/* ======================= LOOP ======================= */
const clock=new THREE.Clock(); const tmp=new THREE.Vector3(); let lastArea='', ready=false;
const AREA_NAMES={guild:'冒險者公會',market:'市集',smith:'鐵匠鋪',tailor:'裁縫屋',library:'大圖書館',portal:'傳送門廣場',castle:'榮譽殿堂',training:'訓練場',gate:'城門',well:'中央廣場'};
function areaAt(p){
  let best=null,bd=1e9; for(const [k,L] of Object.entries(LOC)){const d=Math.hypot(p.x-L.x,p.z-L.z);const r=k==='castle'?24:k==='portal'?15:k==='well'?16:k==='gate'?10:13;if(d<r&&d<bd){bd=d;best=k;}}
  return best;
}
function tick(){
  const dt=Math.min(clock.getDelta(),.05), t=clock.elapsedTime;
  if(ready){
    if(mode==='play'||mode==='talk'||mode==='ui'||mode==='battle') updatePlayer(dt,t);
    if(mode==='tour'){ if(player.ch){player.ch.mixer.update(dt);} tourTick(); }
    if(!$('mapVeil').hidden&&(++bigTick%6===0)) drawBigMap();
    updateNPCs(dt,t); updateAnimals(dt); vfxTick(dt); if(mode!=='create'){updatePet(dt);} updatePen(dt);
    if(area==='math'&&bossFx.lid){bossFx.lid.rotation.x+=(bossFx.lidTarget-bossFx.lid.rotation.x)*Math.min(1,dt*4); if(bossFx.shine.visible) bossFx.shine.rotation.y+=dt;}
    if(area==='math') for(const m of monsters){m.ch.mixer.update(dt); if(!m.ch.busy&&!(battle&&battle.m===m)){const d=Math.hypot(player.pos.x-m.pos.x,player.pos.z-m.pos.z);const ty=d<10?Math.atan2(player.pos.x-m.pos.x,player.pos.z-m.pos.z):0;let a=ty-m.ch.holder.rotation.y;a=Math.atan2(Math.sin(a),Math.cos(a));m.ch.holder.rotation.y+=a*Math.min(1,dt*3);}}
    if(mode==='battle'&&battle){$('prompt').hidden=true;const m=battle.m.pos;const mx=(m.x+player.pos.x)/2,mz=(m.z+player.pos.z)/2;const narrow=innerWidth<640;
      { const W=innerWidth,H=innerHeight,r=$('battle').getBoundingClientRect(); let fx=0,fy=0,fw=W,fh=H;
        if(r.width&&r.left>W*.3){fw=r.left;} else if(r.height&&r.top>H*.25){fh=r.top;} else if(r.height&&r.bottom<H*.75){fy=r.bottom;fh=H-r.bottom;}
        if(fw<W){fy=Math.min(60,H*.15); fh=H-fy;}
        const cx=fx+fw/2, cy=fy+fh/2; const fit=Math.max(.55,Math.min(1,Math.min(fw/W,fh/H)*1.15)); const k=1/fit;
        tmp.set(mx+1.7*k,1+2.8*k,mz+6.6*k); camera.position.lerp(tmp,.1); camera.lookAt(mx,1.15,mz);
        camera.setViewOffset(W,H,W/2-cx,H/2-cy,W,H); camera.userData.vo=1; }
      if(battle.m.ch.holder.rotation.y!==0) battle.m.ch.holder.rotation.y*=.9;}
    if(mode!=='battle'&&camera.userData.vo){camera.clearViewOffset();camera.userData.vo=0;}
    if(mode==='pick'){const a=t*.05;camera.position.set(Math.sin(a)*46,22,Math.cos(a)*46);camera.lookAt(0,2,0);}
    if(mode==='create'&&preview){
      preview.mixer.update(dt); fxTick(preview,t); const s=previewSpot(); preview.holder.rotation.y+=((-cam.yaw)-preview.holder.rotation.y)*Math.min(1,dt*8);
      if(!drag) cam.yaw*=Math.max(0,1-dt*2.5); const narrow=innerWidth<=640; const off=narrow?new THREE.Vector3(0,2.3,0):new THREE.Vector3(-1.6,0,0);
      tmp.set(s.x+off.x+0,s.y+1.6+(narrow?1.4:0),s.z+5.6+(narrow?1.5:0)); camera.position.lerp(tmp,.12); camera.lookAt(s.x+off.x,s.y+(narrow?.9:1.2),s.z);
      if(narrow){ const r=$('creator').getBoundingClientRect(), W=innerWidth, H=innerHeight; const cy=Math.max(90,r.top||H*.42)/2+8; camera.setViewOffset(W,H,0,H/2-cy,W,H); camera.userData.vo=1; }
      sun.position.set(s.x+30,50,s.z+20); sun.target.position.set(s.x,0,s.z);
    }
  } else { camera.position.set(Math.sin(t*.06)*70,34,Math.cos(t*.06)*70); camera.lookAt(0,4,0); }
  for(const p of portals) p.material.uniforms.t.value=t;
  for(const s of spinners){ if(s.userData.cloud){s.position.x+=dt*s.userData.cloud; if(s.position.x>160)s.position.x=-160;} else if(s.userData.gem){s.rotation.y=t*1.5;} else if(s.userData.bob){s.position.y=s.userData.bob+Math.sin(t*2.4)*.3;} }
  renderer.render(scene,camera); requestAnimationFrame(tick);
}
function updatePlayer(dt,t){
  const ch=player.ch; if(!ch) return;
  let ix=0,iz=0;
  if(mode==='play'){
    if(keys.KeyW||keys.ArrowUp) iz+=1; if(keys.KeyS||keys.ArrowDown) iz-=1; if(keys.KeyA||keys.ArrowLeft) ix-=1; if(keys.KeyD||keys.ArrowRight) ix+=1;
    if(stick.id!==null){ix+=stick.x; iz-=stick.y;}
    if(nav){ if(Math.hypot(ix,iz)>.1) stopNav(); else { const v=navStep(dt); if(v){ix=v[0];iz=v[1];} } }
  }
  const mag=Math.min(1,Math.hypot(ix,iz)); const run=keys.ShiftLeft||keys.ShiftRight||(stick.id!==null&&mag>.92)||!!nav;
  if(mag>.08){
    const fx=-Math.sin(cam.yaw), fz=-Math.cos(cam.yaw); let dx=fx*iz-fz*ix, dz=fz*iz+fx*ix; const l=Math.hypot(dx,dz); dx/=l; dz/=l;
    const sp=(run?11:6)*mag; player.pos.x+=dx*sp*dt; player.pos.z+=dz*sp*dt;
    let d=Math.atan2(dx,dz)-player.yaw; d=Math.atan2(Math.sin(d),Math.cos(d)); player.yaw+=d*Math.min(1,dt*12);
    if(mode==='play'&&!drag&&performance.now()-lastDrag>1200&&iz>-.2){const k=iz>.2?2.4:.9; let cd=(player.yaw+Math.PI)-cam.yaw; cd=Math.atan2(Math.sin(cd),Math.cos(cd)); cam.yaw+=cd*Math.min(1,dt*k*mag);}
    if(!ch.busy||ch.cur===ch.actions.cheer){ch.busy=false; playOn(ch,run?'run':'walk');}
  } else if(!ch.busy) playOn(ch,'idle');
  if(player.vy!==0||player.pos.y>0){player.vy-=24*dt;player.pos.y+=player.vy*dt;if(player.pos.y<=0){player.pos.y=0;player.vy=0;}}
  collide(player.pos);
  ch.holder.position.copy(player.pos); ch.holder.rotation.y=player.yaw; ch.mixer.update(dt); fxTick(ch,t);
  const tx=player.pos.x,ty=player.pos.y+2,tz=player.pos.z;
  tmp.set(tx+Math.sin(cam.yaw)*Math.cos(cam.pitch)*cam.dist, ty+Math.sin(cam.pitch)*cam.dist, tz+Math.cos(cam.yaw)*Math.cos(cam.pitch)*cam.dist);
  if(mode!=='battle'){camera.position.lerp(tmp,1-Math.pow(.0008,dt)); camera.lookAt(tx,ty,tz);}
  sun.position.set(tx+30,55,tz+22); sun.target.position.set(tx,0,tz);
  if(mode==='play'){
    let nz=null,best=1e9;
    for(const z of zones){if((z.area||'town')!==area) continue; if(z.cond&&!z.cond()) continue; const zx=z.ref?z.ref.holder.position.x:z.x, zz=z.ref?z.ref.holder.position.z:z.z; const d=Math.hypot(player.pos.x-zx,player.pos.z-zz); if(d<z.r&&d<best){best=d;nz=z;}}
    if(nz!==nearZone){nearZone=nz;$('prompt').hidden=!nz;if(nz)$('promptText').textContent=nz.labelFn?nz.labelFn():nz.label;$('actBtn').textContent=nz?'對話':'跳';}
    $('prompt').querySelector('kbd').hidden=isTouch;
    if(area==='math'){let best=null,bd=1e9;for(const s of STAGES){const d=Math.hypot(player.pos.x-MAP.x-s.x,player.pos.z-MAP.z-s.z);if(d<bd){bd=d;best=s;}}
      const a='m'+(bd<12?best.n:0); if(a!==lastArea){lastArea=a;$('where').textContent=`${THEMES[curSub].map}（${MATH_UNITS[curUnit-1].title}）．`+(bd<12?`第${best.n}關 ${best.topic}`:THEMES[curSub].road);}
      drawRuinsMap(); return; }
    const a=areaAt(player.pos); if(a!==lastArea){lastArea=a;$('where').textContent='學習冒險城．'+(a?AREA_NAMES[a]:'城鎮街道'); if(a&&!save.visited[a]){save.visited[a]=1;persist();checkAch();}}
    drawMinimap();
  }
}
function updateNPCs(dt,t){
  for(const n of npcs){
    const d=n.def;
    if(d.walk&&!n.talking){
      if(n.pause>0){n.pause-=dt; if(!n.busy) playOn(n,'idle');}
      else{const [wx,wz]=d.walk[n.wp]; const p=n.holder.position; const dx=wx-p.x,dz=wz-p.z,L=Math.hypot(dx,dz);
        if(L<.4){n.wp=(n.wp+1)%d.walk.length; n.pause=rnd(1.5,4);} else {const sp=2.2; p.x+=dx/L*sp*dt; p.z+=dz/L*sp*dt; let a=Math.atan2(dx,dz)-n.yaw; a=Math.atan2(Math.sin(a),Math.cos(a)); n.yaw+=a*Math.min(1,dt*6); playOn(n,'walk');}
        const pd=Math.hypot(player.pos.x-p.x,player.pos.z-p.z); if(pd<1.4){n.pause=Math.max(n.pause,1);} }
      n.holder.rotation.y=n.yaw;
    } else if(!d.walk&&!n.talking){
      const pd=Math.hypot(player.pos.x-d.x,player.pos.z-d.z); const target=pd<7&&mode==='play'?Math.atan2(player.pos.x-d.x,player.pos.z-d.z):n.home;
      let a=target-n.yaw; a=Math.atan2(Math.sin(a),Math.cos(a)); n.yaw+=a*Math.min(1,dt*3); n.holder.rotation.y=n.yaw;
    }
    n.mixer.update(dt); fxTick(n,t);
  }
}

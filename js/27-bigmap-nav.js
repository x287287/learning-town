/* 學習冒險城．js/27-bigmap-nav.js
 * 大地圖與自動導航
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ======================= 大地圖與自動導航 ======================= */
const bigC=$('bigMap'), bctx=bigC.getContext('2d'); let bigHits=[];
function openBigMap(){
  if(mode!=='play') return; $('mapTitle').textContent=area==='town'?'學習冒險城地圖':`${THEMES[curSub].map}地圖`; stopMove(); mode='ui'; $('mapVeil').hidden=false; drawBigMap(); $('mapClose').focus();
}
function closeBigMap(){ $('mapVeil').hidden=true; if(mode==='ui'&&veil.hidden){mode='play';canvas.focus();} }
$('minimap').addEventListener('click',openBigMap);
$('minimap').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openBigMap();}});
$('mapClose').onclick=closeBigMap;
$('mapVeil').addEventListener('pointerdown',e=>{if(e.target.id==='mapVeil')closeBigMap();});
function drawBigMap(){
  const W=bigC.width, H=bigC.height; const c=bctx; c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,W,H); bigHits=[];
  const town=area==='town';
  let sc,P;
  if(town){ sc=W/116; P=(x,z)=>[W/2+x*sc,H/2+z*sc]; }
  else { sc=W/124; P=(x,z)=>[W/2+(x-MAP.x)*sc,H/2+(z-MAP.z+24)*sc]; }
  c.fillStyle=town?'#7fae4c':(THEMES[curSub]||THEMES.math).mini; c.fillRect(0,0,W,H);
  if(town){
    c.strokeStyle='#c4a06a'; c.lineWidth=5*sc*.9;
    for(const k of ['castle','guild','market','smith','gate','tailor','portal','library']){c.beginPath();c.moveTo(W/2,H/2);c.lineTo(...P(LOC[k].x,LOC[k].z));c.stroke();}
    c.beginPath();c.moveTo(...P(31,-27));c.lineTo(...P(48,-30));c.stroke();
    c.fillStyle='#a49a8c'; c.beginPath(); c.arc(W/2,H/2,16*sc,0,7); c.fill();
    c.fillStyle='#8a8279'; c.beginPath(); c.arc(...P(-35,2),14*sc,0,7); c.fill();
    c.fillStyle='#8fc25a'; c.beginPath(); c.arc(...P(-40,40),6.2*sc,0,7); c.fill();
    c.fillStyle='#6f6458'; c.fillRect(...P(-60,LOC.gate.z-1.5),120*sc,3*sc);
    const B=[['冒險者公會','#b33a2c',LOC.guild],['市集','#b8862a',LOC.market],['鐵匠鋪','#5b5f66',LOC.smith],['裁縫屋','#7a4fb0',LOC.tailor],['大圖書館','#2f5ea8',LOC.library],['傳送門廣場','#3a2a5a',{x:-38,z:-10}],['榮譽殿堂','#8a2a20',{x:0,z:-60}],['訓練場','#3d8a4a',LOC.training],['魔法寵物屋','#d9863a',{x:-54,z:46}],['城門','#5b5f66',{x:0,z:55}]];
    c.font='bold 15px "LXGW WenKai TC","Noto Sans TC",serif'; c.textAlign='center'; c.textBaseline='middle';
    for(const [n,col,L] of B){ const k=n==='城門'?1:1.13; const [x,y]=P(L.x*k,L.z*k); const w=c.measureText(n).width+14; c.fillStyle='rgba(42,27,18,.72)'; roundRect(c,x-w/2,y-11,w,22,6); c.fill(); c.fillStyle='#fbf3e1'; c.fillText(n,x,y+1); }
  } else {
    c.strokeStyle='#9c7845'; c.lineWidth=10; c.beginPath(); c.moveTo(...P(MAP.x,MAP.z+30)); for(const s of STAGES) c.lineTo(...P(MAP.x+s.x,MAP.z+s.z)); c.stroke();
  }
  // targets
  const T=[];
  for(const n of npcs){ const d=n.def; if((d.area||'town')!==area) continue; T.push({kind:'npc',ref:n,face:d.face,color:d.color,name:d.name,sub:d.role}); }
  if(!town){
    for(const s of STAGES){ const st=UM().cleared[s.n]?'已通過':stageLocked(s.n)?'未解鎖':''; T.push({kind:'stage',x:MAP.x+s.x,z:MAP.z+s.z+3,face:s.boss?'王':String(s.n),color:UM().cleared[s.n]?'#3d8a4a':stageLocked(s.n)?'#7d776d':'#b33a2c',name:s.name,sub:st||s.topic}); }
    T.push({kind:'spot',x:MAP.x,z:MAP.z+33.4,face:'回',color:'#3a2a5a',name:'回城傳送門',sub:''});
  }
  c.font='bold 18px "LXGW WenKai TC","Noto Sans TC",serif';
  for(const o of T){ const px=o.ref?o.ref.holder.position.x:o.x, pz=o.ref?o.ref.holder.position.z:o.z; const [x,y]=P(px,pz); const r=17;
    c.fillStyle=o.color; c.beginPath(); c.arc(x,y,r,0,7); c.fill(); c.lineWidth=3; c.strokeStyle='#e2b04a'; c.stroke();
    c.fillStyle='#fbf3e1'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(o.face,x,y+1);
    c.font='bold 13px "Noto Sans TC",sans-serif'; const lab=o.name; const w=c.measureText(lab).width+10; c.fillStyle='rgba(251,243,225,.92)'; roundRect(c,x-w/2,y+r+3,w,18,5); c.fill(); c.fillStyle='#3a2413'; c.fillText(lab,x,y+r+12);
    c.font='bold 18px "LXGW WenKai TC","Noto Sans TC",serif';
    bigHits.push({x,y,r:r+8,o,px,pz}); }
  // player
  const [px,py]=P(player.pos.x,player.pos.z); c.save(); c.translate(px,py); c.rotate(-player.yaw+Math.PI);
  c.fillStyle='#fbf3e1'; c.strokeStyle='#2a1b12'; c.lineWidth=3; c.beginPath(); c.moveTo(0,-15); c.lineTo(11,11); c.lineTo(0,5); c.lineTo(-11,11); c.closePath(); c.fill(); c.stroke(); c.restore();
  if(nav){ const g=navGoal(); if(g){ const [gx,gy]=P(g.x,g.z); c.setLineDash([8,8]); c.strokeStyle='#ffd76a'; c.lineWidth=4; c.beginPath(); c.moveTo(px,py); c.lineTo(gx,gy); c.stroke(); c.setLineDash([]); } }
}
function roundRect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
bigC.addEventListener('click',e=>{
  const r=bigC.getBoundingClientRect(); const x=(e.clientX-r.left)*bigC.width/r.width, y=(e.clientY-r.top)*bigC.height/r.height;
  let best=null,bd=1e9; for(const h of bigHits){const d=Math.hypot(h.x-x,h.y-y); if(d<h.r&&d<bd){bd=d;best=h;}}
  if(!best) return; closeBigMap(); startNav(best.o);
});
/* --- 導航 --- */
let nav=null; let navMark=null;
function navGoal(){ if(!nav) return null; const o=nav.target; if(o.ref) return {x:o.ref.holder.position.x,z:o.ref.holder.position.z}; return {x:o.x,z:o.z}; }
function startNav(o){
  const pts=[];
  if(area==='town'){
    const g=o.ref?o.ref.holder.position:{x:o.x,z:o.z};
    const pr=Math.hypot(player.pos.x,player.pos.z), gr=Math.hypot(g.x,g.z);
    const pa=Math.atan2(player.pos.z,player.pos.x), ga=Math.atan2(g.z,g.x);
    const da=Math.atan2(Math.sin(ga-pa),Math.cos(ga-pa)); const ringPt=a=>({x:Math.cos(a)*14.5,z:Math.sin(a)*14.5});
    if(!(pr>17&&gr>17&&Math.abs(da)<.35)){
      if(pr>17) pts.push(ringPt(pa));
      if(gr>17){ const steps=Math.max(1,Math.ceil(Math.abs(da)/0.9)); for(let k=1;k<=steps;k++) pts.push(ringPt(pa+da*k/steps)); }
    }
  } else {
    const order=[{x:MAP.x,z:MAP.z+28},...STAGES.map(s=>({x:MAP.x+s.x,z:MAP.z+s.z+4.5}))];
    const near=(p)=>{let bi=0,bd=1e9;order.forEach((q,i)=>{const d=Math.hypot(q.x-p.x,q.z-p.z);if(d<bd){bd=d;bi=i;}});return bi;};
    const a=near(player.pos), b=near(o.ref?o.ref.holder.position:{x:o.x,z:o.z});
    if(a<b) for(let i=a+1;i<b;i++) pts.push(order[i]); else for(let i=a-1;i>b;i--) pts.push(order[i]);
  }
  nav={target:o,pts,k:0,last:player.pos.clone(),t:0};
  if(!navMark){ navMark=labelSprite('▼',{bg:'#e2b04a',fg:'#2a1b12',border:'#2a1b12',size:.7}); scene.add(navMark); }
  navMark.visible=true; toast(`自動前往：${o.name}`);
}
function stopNav(){ nav=null; if(navMark) navMark.visible=false; }
function navStep(dt){
  const g=navGoal(); if(navMark) navMark.position.set(g.x,(nav.target.ref?3.4:3)+Math.sin(performance.now()/250)*.2,g.z);
  const wp=nav.k<nav.pts.length?nav.pts[nav.k]:g; const final=nav.k>=nav.pts.length;
  const dx=wp.x-player.pos.x, dz=wp.z-player.pos.z, d=Math.hypot(dx,dz);
  const arrive=final?(nav.target.kind==='npc'?2.4:1.6):1.2;
  if(d<arrive){ if(!final){nav.k++; return navStep(dt);} const o=nav.target; stopNav();
    player.yaw=Math.atan2(dx,dz); toast(`抵達：${o.name}`); return null; }
  nav.t+=dt; if(nav.t>1.2){ const moved=player.pos.distanceTo(nav.last); nav.last.copy(player.pos); nav.t=0;
    if(moved<1.2){ nav.stuck=(nav.stuck||0)+1; if(nav.stuck>=3&&!final){ nav.k++; nav.stuck=0; } else { const side=nav.stuck%2?1:-1; nav.pts.splice(nav.k,0,{x:player.pos.x+(-dz/d)*3.5*side,z:player.pos.z+(dx/d)*3.5*side}); } } else nav.stuck=0; }
  const ux=dx/d, uz=dz/d; const fx=-Math.sin(cam.yaw), fz=-Math.cos(cam.yaw);
  return [ -ux*fz+uz*fx, ux*fx+uz*fz ];
}

let bigTick=0;

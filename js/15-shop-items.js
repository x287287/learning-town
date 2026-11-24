/* 學習冒險城．js/15-shop-items.js
 * 名牌框、背包道具、煙火、流浪商人
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ---------- 名牌框與新道具 ---------- */
const FRAMES={frame_leaf:'fr-leaf',frame_silver:'fr-silver',frame_gold:'fr-gold',frame_rainbow:'fr-rainbow'};
function applyFrame(){ const c=$('hudCrest'); if(!c) return; c.className='crest'+(save.frame&&FRAMES[save.frame]&&save.inv[save.frame]?' '+FRAMES[save.frame]:''); }
function useBagItem(id){
  if(id==='treat'){ const a=save.pets&&save.pets.active&&save.pets.owned[save.pets.active]; if(!a){toast('要先帶一隻寵物在身邊喔');return;}
    a.love=(a.love||0)+3; save.inv.treat--; if(save.inv.treat<=0) delete save.inv.treat; persist(); if(pet) oneShot(pet,'jump','idle',1400); sfx('coin');
    toast(`${a.name}吃得好開心！親密度 +3（目前 ${a.love}）`); openBag(); return; }
  if(id==='firework'){ if(mode!=='ui'&&mode!=='play') return; save.inv.firework--; if(save.inv.firework<=0) delete save.inv.firework; persist(); closePanel(); fireworks(); return; }
  if(FRAMES[id]){ save.frame=save.frame===id?'':id; persist(); applyFrame(); openBag(); }
}
function fireworks(){
  const cv=document.createElement('canvas'); cv.className='fw'; document.body.appendChild(cv);
  const W=cv.width=innerWidth*devicePixelRatio, H=cv.height=innerHeight*devicePixelRatio; const x=cv.getContext('2d'); const P=[]; const cols=['#ffd76a','#ff7fa6','#7fe6ff','#8fe08a','#c9b6ff','#ff9b4a'];
  let shots=0; const t0=performance.now();
  const burst=()=>{ const cx=W*(.2+Math.random()*.6), cy=H*(.15+Math.random()*.3), c=cols[Math.random()*cols.length|0]; sfx('pop');
    for(let i=0;i<110;i++){const a=Math.random()*7,v=(3+Math.random()*7)*devicePixelRatio;P.push({x:cx,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1,c});} };
  sfx('whoosh');
  const step=()=>{ const t=performance.now()-t0; if(shots<7&&t>shots*420+300){shots++;burst();}
    x.globalCompositeOperation='destination-out'; x.fillStyle='rgba(0,0,0,.25)'; x.fillRect(0,0,W,H); x.globalCompositeOperation='lighter';
    for(const p of P){ p.x+=p.vx; p.y+=p.vy; p.vy+=.06*devicePixelRatio; p.vx*=.985; p.l-=.011; if(p.l>0){x.fillStyle=p.c; x.globalAlpha=p.l; x.beginPath(); x.arc(p.x,p.y,3.6*devicePixelRatio,0,7); x.fill();} }
    x.globalAlpha=1; if(t<4800) requestAnimationFrame(step); else cv.remove(); };
  requestAnimationFrame(step); toast('砰！天空綻放了煙火！');
}

/* ======================= 流浪商人 ======================= */
function wanderStock(){ const all=ITEMS.filter(i=>i.shop==='wander'); const R=seeded(dayIdx()*31+7); const a=all.slice(); for(let i=a.length-1;i>0;i--){const j=R()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];} return a.slice(0,2); }
function openWander(){
  const list=wanderStock();
  const cards=list.map(i=>{const owned=save.inv[i.id]>0; return `<div class="card"><div class="glyph" style="background:${i.color}">${i.glyph}</div><div style="min-width:0"><h3>${i.name}</h3><p>${i.desc}</p><div class="meta"><span class="purse"><span class="gem"></span>${i.price} 金幣</span></div></div>${owned?'<button class="act" type="button" disabled>已擁有</button>':`<button class="act" type="button" data-wbuy="${i.id}" ${save.coins<i.price?'disabled':''}>購買</button>`}</div>`;}).join('');
  openPanel(panelShell('流浪商人的推車',`你有 ${save.coins} 金幣。卡洛每天出現在不同地方，帶的商品也不一樣，市集買不到喔！`,cards+'<p class="note">買到的染料和特效，到裁縫屋找莉莉換上。</p>'));
  veil.querySelectorAll('[data-wbuy]').forEach(b=>b.onclick=()=>{const i=ITEM[b.dataset.wbuy]; if(save.coins<i.price) return; spendCoins(i.price,'wander'); save.inv[i.id]=1; persist(); checkAch(); hud(); toast(`買到「${i.name}」`); openWander();});
}

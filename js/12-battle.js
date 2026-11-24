/* 學習冒險城．js/12-battle.js
 * 戰鬥：開始、出題、新題型（判斷、輸入、配對、排序）、結算、勝負、星星與連擊
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ---------- battle ---------- */
let battle=null;
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
function attackClip(){const L=save.look; const H=L.hero;
  if(H){ const r=H.right; if(['魔杖','法杖','牧師權杖'].includes(r)||(!r&&(L.cls==='Mage'||L.cls==='Cleric'))) return 'castShot'; if(r==='手弩'||r==='重弩') return 'shoot'; if(r==='雙手大劍'||r==='雙手巨斧') return 'slash2'; return 'chop'; } if(L.cls==='Mage') return 'castShot'; if(/Crossbow/.test(L.main)) return 'shoot'; if(TWO_HANDED.has(L.main)) return 'slash2'; return 'chop';}

/* ---------- 星星與連擊 ---------- */
let comboRun=0;
function starsOf(n,u,sub){ const x=SS(sub).units[u||curUnit]; return x&&x.stars&&x.stars[n]||0; }
function unitStars(u,sub){ let t=0; for(let n=1;n<=5;n++) t+=starsOf(n,u,sub); return t; }
function starStr(n){ return '★'.repeat(n)+'☆'.repeat(3-n); }
function showCombo(){ const el=$('bCombo'); if(!el) return; if(comboRun>=2){ el.hidden=false; el.innerHTML=`連擊 <b>${comboRun}</b>${comboRun>=3?'<small>每題 +2 金幣</small>':''}`; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } else el.hidden=true; }

/* ---------- 新題型 ---------- */
const NEG_RE=/何者.{0,4}(錯|不|非)|哪.{0,5}(錯|不是|不正確|不屬於)|錯誤|不正確/;
const OPT_RE=/下列|何者|哪一|哪個|哪項|哪些|選出|以下|上述|選項/;
function isNumQ(q){ return /^-?\d+(\.\d+)?$/.test(q.o[0].trim()) && !OPT_RE.test(q.q); }
function canTF(q){ return !NEG_RE.test(q.q) && !q.o.some(o=>/以上|皆是|皆非|都對|都不對/.test(o)); }
function matchOK(q){ return q.q.length<=42 && q.o[0].length<=16 && !OPT_RE.test(q.q) && !/\n/.test(q.q); }
/* 排序題：從圖書館影片的年表或流程圖解產生。只用確認過「有先後順序」的段落（等級-科目-單元-段落 → 要用的項目，null 代表全部） */
const ORD_OK={'es-chinese-1-2':null,'es-chinese-2-0':null,'es-chinese-2-2':null,'es-chinese-3-1':null,'es-chinese-3-2':null,'es-chinese-4-0':null,'es-chinese-4-1':null,'es-chinese-4-2':null,
  'es-english-4-0':null,'es-math-2-3':null,'es-math-6-2':null,'es-math-7-3':null,'es-science-1-2':null,
  'es-social-1-0':null,'es-social-3-0':[0,1,2],'es-social-3-1':null,'es-social-3-2':null,'es-social-4-0':null,'es-social-4-2':null,
  'jh-chinese-4-1':null,'jh-math-5-0':null,'jh-science-5-1':null,'jh-social-3-1':null,'jh-social-4-0':null,'jh-social-4-1':null,'jh-social-6-0':null};
function ordCands(u){
  const out=[]; const S=VIDEOS[u]; if(!S) return out;
  S.forEach((sc,i)=>{ const key=`${lvOf(save)}-${curSub}-${u}-${i}`; if(!(key in ORD_OK)) return; const d=sc.d; if(!d||!(d[0]==='tl'||d[0]==='flow')||d[2]==='loop') return;
    let items=d[0]==='tl'?d[1].map(([t,e])=>({show:e,note:t+'：'+e})):d[1].map(x=>{const p=String(x).split('|');return {show:p.join('：'),note:p.join('：')};});
    const pick=ORD_OK[key]; if(pick) items=pick.map(k=>items[k]).filter(Boolean);
    if(items.length>=3&&items.length<=6&&new Set(items.map(x=>x.show)).size===items.length) out.push({title:sc.t,tl:d[0]==='tl',items}); });
  return out;
}
function makeSpecial(b){
  const kinds=[]; const Q=MATH_UNITS[curUnit-1].q[b.s.n-1];
  const mc=Q.map((q,qi)=>({q,qi})).filter(x=>matchOK(x.q)); const pick=[]; const seen=new Set();
  for(const x of shuffle(mc)){ const a=x.q.o[0].replace(/\s/g,'').replace(/^(-?[\d.\/]+).*$/,'$1'); if(seen.has('a:'+a)||seen.has(x.q.q)) continue; seen.add('a:'+a); seen.add(x.q.q); pick.push(x); if(pick.length===3) break; }
  if(pick.length===3) kinds.push({type:'match',pairs:pick});
  const oc=ordCands(curUnit); if(oc.length) kinds.push({type:'ord',...oc[Math.random()*oc.length|0]});
  return kinds.length?kinds[Math.random()*kinds.length|0]:null;
}
function chooseQ(b){
  if(!b.special&&b.asked>=1){ const want=b.s.boss?.45:.2; if(Math.random()<want){ const sp=makeSpecial(b); if(sp){ b.special=true; return sp; } } }
  if(b.k>=b.pool.length){b.pool=shuffle(b.pool);b.k=0;}
  const qi=b.pool[b.k++]; const q=MATH_UNITS[curUnit-1].q[b.s.n-1][qi];
  if(isNumQ(q)&&Math.random()<.45) return {type:'num',q,qi};
  if(canTF(q)&&Math.random()<.16){ const truth=Math.random()<.5; return {type:'tf',q,qi,truth,show:truth?0:1+(Math.random()*3|0)}; }
  return {type:'mc',q,qi,order:shuffle([0,1,2,3])};
}
const TYPE_TAG={tf:'判斷對錯',num:'算出答案',match:'配對題',ord:'排順序'};
function renderQ(){
  const b=battle, c=b.cur, O=$('bOpts'); O.className='bt-opts'; $('bTag').hidden=c.type==='mc'; $('bTag').textContent=TYPE_TAG[c.type]||'';
  if(c.type==='mc'){ $('bQ').textContent=c.q.q;
    O.innerHTML=c.order.map((oi,i)=>`<button type="button" class="bopt" data-i="${oi}" data-say="${esc(c.q.o[oi])}"><span class="key">${i+1}</span>${esc(c.q.o[oi])}</button>`).join('');
    O.querySelectorAll('.bopt').forEach(x=>x.onclick=()=>answer(+x.dataset.i));
    addSpeak($('bQ'),O,curSub,c.q.q); }
  else if(c.type==='tf'){ $('bQ').textContent=c.q.q; O.classList.add('tf');
    O.innerHTML=`<div class="tfbox">答案是「<b>${esc(c.q.o[c.show])}</b>」，對嗎？</div><button type="button" class="bopt tfo" data-v="1"><span class="key">1</span>⭕ 對</button><button type="button" class="bopt tfo" data-v="0"><span class="key">2</span>❌ 不對</button>`;
    O.querySelectorAll('.tfo').forEach(x=>x.onclick=()=>tfAnswer(+x.dataset.v));
    addSpeak($('bQ'),null,curSub,c.q.q+'. '+c.q.o[c.show]); }
  else if(c.type==='num'){ $('bQ').textContent=c.q.q; O.classList.add('num'); c.val='';
    const keys=['7','8','9','⌫','4','5','6','-','1','2','3','.','0'];
    O.innerHTML=`<div class="numin" id="numIn" aria-live="polite"><span class="ph">輸入答案</span></div><div class="numpad">${keys.map(k=>`<button type="button" class="nk" data-k="${k}">${k}</button>`).join('')}<button type="button" class="nk go" data-k="ok">確定</button></div>`;
    O.querySelectorAll('.nk').forEach(x=>x.onclick=()=>numKey(x.dataset.k)); }
  else if(c.type==='match'){ $('bQ').textContent='把左邊的題目和右邊的答案配成一對：先點題目，再點答案。'; O.classList.add('mt'); c.sel=null; c.link={};
    c.right=shuffle(c.pairs.map((_,i)=>i));
    O.innerHTML=`<div class="mt-col">${c.pairs.map((p,i)=>`<button type="button" class="mt-item L" data-l="${i}">${esc(p.q.q)}</button>`).join('')}</div><div class="mt-col">${c.right.map(i=>`<button type="button" class="mt-item R" data-r="${i}">${esc(c.pairs[i].q.o[0])}</button>`).join('')}</div><button type="button" class="act mt-go" id="mtGo" disabled>確定</button>`;
    O.querySelectorAll('.mt-item').forEach(x=>x.onclick=()=>matchTap(x)); $('mtGo').onclick=()=>matchSubmit(); }
  else if(c.type==='ord'){ $('bQ').textContent=`「${c.title}」：${c.tl?'依照時間先後':'依照正確順序'}，從第一個開始點。`; O.classList.add('ord'); c.pick=[]; c.mix=shuffle(c.items.map((_,i)=>i));
    renderOrd(); }
}
function renderOrd(){
  const c=battle.cur, O=$('bOpts');
  O.innerHTML=`<div class="ord-ans">${c.items.map((_,k)=>{const i=c.pick[k];return i===undefined?`<span class="ord-slot">${k+1}</span>`:`<button type="button" class="ord-chip on" data-back="${k}"><b>${k+1}</b>${esc(c.items[i].show)}</button>`;}).join('')}</div>
    <div class="ord-pool">${c.mix.filter(i=>!c.pick.includes(i)).map(i=>`<button type="button" class="ord-chip" data-i="${i}">${esc(c.items[i].show)}</button>`).join('')}</div>
    <button type="button" class="act mt-go" id="ordGo" ${c.pick.length===c.items.length?'':'disabled'}>確定</button>`;
  O.querySelectorAll('[data-i]').forEach(x=>x.onclick=()=>{ if(battle.locked) return; c.pick.push(+x.dataset.i); renderOrd(); });
  O.querySelectorAll('[data-back]').forEach(x=>x.onclick=()=>{ if(battle.locked) return; c.pick.splice(+x.dataset.back); renderOrd(); });
  $('ordGo').onclick=()=>ordSubmit();
}
function tfAnswer(v){
  const b=battle; if(!b||b.locked) return; const c=b.cur; const ok=(v===1)===c.truth;
  $('bOpts').querySelectorAll('.tfo').forEach(x=>{x.disabled=true; const xv=+x.dataset.v; if((xv===1)===c.truth) x.classList.add('right'); else if(xv===v) x.classList.add('wrong');});
  resolve(ok,false);
}
function numKey(k){
  const b=battle; if(!b||b.locked||b.cur.type!=='num') return; const c=b.cur;
  if(k==='ok'){ if(c.val&&c.val!=='-') numSubmit(); return; }
  if(k==='⌫') c.val=c.val.slice(0,-1);
  else if(k==='-'){ c.val=c.val.startsWith('-')?c.val.slice(1):'-'+c.val; }
  else if(k==='.'){ if(!c.val.includes('.')) c.val=(c.val===''||c.val==='-'?c.val+'0':c.val)+'.'; }
  else if(c.val.replace(/[-.]/g,'').length<9) c.val=(c.val==='0'?'':c.val==='-0'?'-':c.val)+k;
  $('numIn').innerHTML=c.val?esc(c.val):'<span class="ph">輸入答案</span>';
}
function numSubmit(){
  const b=battle; const c=b.cur; const ok=Math.abs(parseFloat(c.val)-parseFloat(c.q.o[0]))<1e-9;
  $('numIn').classList.add(ok?'right':'wrong'); $('bOpts').querySelectorAll('.nk').forEach(x=>x.disabled=true);
  resolve(ok,false);
}
const MT_COL=['#2f5ea8','#c2452f','#3d8a4a','#7a4fb0'];
function matchTap(el){
  const b=battle; if(!b||b.locked) return; const c=b.cur;
  if(el.classList.contains('L')){ const l=+el.dataset.l; if(c.link[l]!==undefined){ delete c.link[l]; c.sel=null; } else c.sel=l; }
  else { const r=+el.dataset.r; const owner=Object.keys(c.link).find(k=>c.link[k]===r); if(owner!==undefined){ delete c.link[owner]; } else if(c.sel!==null){ c.link[c.sel]=r; c.sel=null; } }
  paintMatch();
}
function paintMatch(){
  const c=battle.cur; const lefts=Object.keys(c.link).map(Number);
  $('bOpts').querySelectorAll('.mt-item.L').forEach(x=>{const l=+x.dataset.l; const on=c.link[l]!==undefined; x.classList.toggle('sel',c.sel===l); x.style.setProperty('--mc',on?MT_COL[l]:''); x.classList.toggle('on',on); x.dataset.no=on?String(l+1):'';});
  $('bOpts').querySelectorAll('.mt-item.R').forEach(x=>{const r=+x.dataset.r; const l=lefts.find(k=>c.link[k]===r); const on=l!==undefined; x.style.setProperty('--mc',on?MT_COL[l]:''); x.classList.toggle('on',on); x.dataset.no=on?String(l+1):'';});
  $('mtGo').disabled=lefts.length!==c.pairs.length;
}
function matchSubmit(){
  const b=battle; if(!b||b.locked) return; const c=b.cur; let all=true;
  c.pairs.forEach((p,l)=>{ const good=c.link[l]===l; if(!good) all=false; recordAnswer(curSub,curUnit,b.s.n-1,p.qi,p.q,good);
    const L=$('bOpts').querySelector(`.mt-item.L[data-l="${l}"]`); if(L) L.classList.add(good?'right':'wrong'); });
  $('bOpts').querySelectorAll('.mt-item,#mtGo').forEach(x=>x.disabled=true);
  resolve(all,false,true);
}
function ordSubmit(){
  const b=battle; if(!b||b.locked) return; const c=b.cur; const ok=c.pick.every((v,k)=>v===k);
  $('bOpts').querySelectorAll('.ord-ans .ord-chip').forEach((x,k)=>x.classList.add(c.pick[k]===k?'right':'wrong'));
  $('bOpts').querySelectorAll('button').forEach(x=>x.disabled=true);
  resolve(ok,false);
}
function revealAnswer(){
  const c=battle.cur; const O=$('bOpts');
  O.querySelectorAll('button').forEach(x=>x.disabled=true);
  if(c.type==='mc') O.querySelectorAll('.bopt').forEach(x=>{if(+x.dataset.i===0)x.classList.add('right');});
  if(c.type==='tf') O.querySelectorAll('.tfo').forEach(x=>{if((+x.dataset.v===1)===c.truth)x.classList.add('right');});
}
function answerHtml(ok,timeout){
  const c=battle.cur; const head=ok?'<b class="ok">答對了！</b>':(timeout?'<b class="no">時間到！</b>':'<b class="no">答錯了</b>');
  if(c.type==='mc'||c.type==='num') return {head:head+(ok?'':`　正確答案：<b>${esc(c.q.o[0])}</b>`),exp:esc(c.q.e)};
  if(c.type==='tf') return {head:head+`　${c.truth?'這個答案是對的':'這個答案不對'}${c.truth?'':`，正確答案是：<b>${esc(c.q.o[0])}</b>`}`,exp:esc(c.q.e)};
  if(c.type==='match') return {head:head+(ok?'　三組全部配對正確！':'　正確的配對是：'),exp:c.pairs.map(p=>`${esc(p.q.q)} → <b>${esc(p.q.o[0])}</b>`).join('<br>')};
  if(c.type==='ord') return {head:head+(ok?'　順序完全正確！':'　正確的順序是：'),exp:c.items.map((it,k)=>`${k+1}. ${esc(c.tl?it.note:it.show)}`).join('<br>')};
}

function startBattle(n,confirmed){
  const m=monsters[n-1]; const s=m.st;
  if(stageLocked(n)){toast(`要先通過第 ${n-1} 關喔`);return;}
  const replay=!!UM().cleared[n];
  if(replay&&!confirmed){
    openPanel(panelShell(`再次挑戰第 ${n} 關`,`${s.name}．${s.topic}`,`<div class="scroll">你已經打倒過${s.name}了。<br>再次挑戰時，${s.name}會<b>復活</b>，題目一樣隨機出現。<br>${s.boss?'但通關後<b>不會再出現寶箱</b>，':'通關後'}只有 5 金幣的練習獎勵。</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="act" type="button" id="replayYes">讓它復活，再挑戰一次</button><button class="act ghost" type="button" id="replayNo" style="color:var(--parchment)">先不要</button></div>`));
    $('replayYes').onclick=()=>{veil.hidden=true;veil.innerHTML='';mode='play';startBattle(n,true);};
    $('replayNo').onclick=()=>closePanel(); return;
  }
  mode='battle'; stopMove(); nearZone=null; $('prompt').hidden=true; $('actBtn').hidden=true; $('stick').hidden=true;
  battle={m,s,hp:s.hp,hearts:3,asked:0,special:false,bonus:0,maxCombo:0,rage:false,pool:shuffle(MATH_UNITS[curUnit-1].q[n-1].map((_,i)=>i)),k:0,cur:null,timerId:null,tLeft:0,double:false,hinted:false,locked:false,over:false};
  player.pos.set(m.pos.x,0,m.pos.z+4.6); player.yaw=Math.PI; player.vy=0;
  const pc=player.ch; pc.busy=false; for(const a of Object.values(pc.actions)) a.stop(); pc.cur=null; playOn(pc,'idle');
  pc.holder.children.forEach(c=>{if(c.isSprite)c.visible=false;});
  const mc=m.ch; for(const a of Object.values(mc.actions)) a.stop(); mc.cur=null; mc.busy=true;
  holdPose(mc,replay&&mc.actions.skRevive?'skRevive':'skAwaken'); if(replay) toast(`${s.name}復活了！`);
  setTimeout(()=>{if(battle&&battle.m===m){mc.busy=false;mc.cur=null;playOn(mc,'idle');}},replay?2400:1600);
  $('bStage').textContent=`第 ${n} 關．${s.topic}`; $('bMName').textContent=s.name; $('bPName').textContent=(save.name||'冒險者')+'．'+(CLASSES[save.look.cls]||CLASSES.Knight).label;
  $('battle').hidden=false; for(const id of ['hudBtns','minimap','where','help']) $(id).hidden=true;
  renderBars(); showCombo(); nextQuestion(); bgmUpdate();
}
function renderBars(){
  const b=battle; $('bPHearts').innerHTML=Array.from({length:3},(_,i)=>`<span class="heart ${i<b.hearts?'':'lost'}">♥</span>`).join('');
  $('bMHp').innerHTML=Array.from({length:b.s.hp},(_,i)=>`<span class="heart m ${i<b.hp?'':'lost'}">♥</span>`).join('');
  const inv=save.inv;
  const items=[['hint','提示卷軸','刪去一個錯誤選項',!b.locked&&!b.hinted&&!b.over&&b.cur&&b.cur.type==='mc'],['glass','時間沙漏','多 15 秒',!!b.s.timer&&!b.locked&&!b.over],['potion','金幣加倍藥水','本場獎勵兩倍',!b.double&&!b.over]];
  $('bItems').innerHTML=items.map(([id,nm,tip,ok])=>`<button type="button" class="bitem" data-use="${id}" ${(inv[id]||0)>0&&ok?'':'disabled'} title="${tip}">${nm} <b>${inv[id]||0}</b></button>`).join('')+
    (b.double?'<span class="bdouble">獎勵加倍中</span>':'')+`<button type="button" class="bitem flee" id="bFlee">撤退</button>`;
  $('bItems').querySelectorAll('[data-use]').forEach(x=>x.onclick=()=>useItem(x.dataset.use));
  $('bFlee').onclick=()=>endBattle();
}
function nextQuestion(){
  const b=battle; b.cur=chooseQ(b); b.asked=(b.asked||0)+1; b.hinted=false; b.locked=false;
  $('bFb').hidden=true; $('bFb').innerHTML='';
  renderQ();
  const tm=battleTimer(b);
  if(tm){b.tMax=tm+(petPerk('demon')?15:0)+(clsIs('Mage')?10:0)+(b.cur.type==='match'||b.cur.type==='ord'?20:0);b.tLeft=b.tMax;$('bTimer').hidden=false;clearInterval(b.timerId);
    b.timerId=setInterval(()=>{const before=Math.ceil(b.tLeft);b.tLeft-=.1;drawTimer();if(b.tLeft<=5&&Math.ceil(b.tLeft)<before&&b.tLeft>0)sfx('tick');if(b.tLeft<=0){clearInterval(b.timerId);answer(-1);}},100);drawTimer();}
  else $('bTimer').hidden=true;
  if(b.cur.type==='mc'&&clsIs('Mage')&&!b.mageDone){ b.mageDone=true; const wrong=[...$('bOpts').querySelectorAll('.bopt:not([disabled])')].filter(x=>+x.dataset.i!==0); const pick=wrong[Math.random()*wrong.length|0]; if(pick){pick.disabled=true;pick.classList.add('struck'); toast('魔法師的智慧之光：刪去了一個錯誤選項');} }
  if(b.cur.type==='mc'&&petPerk('hywirl')&&!b.foxDone){ b.foxDone=true; const wrong=[...$('bOpts').querySelectorAll('.bopt:not([disabled])')].filter(x=>+x.dataset.i!==0); const pick=wrong[Math.random()*wrong.length|0]; if(pick){pick.disabled=true;pick.classList.add('struck'); toast(`${save.pets.owned.hywirl.name}幫你刪去了一個錯誤選項`);} }
  renderBars();
}
function battleTimer(b){ if(!b.s.timer) return 0; if(!b.rage) return b.s.timer; const c=b.cur; const len=c&&c.q?c.q.q.length+c.q.o.join('').length/3:30; return Math.round(Math.max(40,Math.min(60,40+(len-30)*.6))); }
function drawTimer(){const b=battle;$('bTimer').querySelector('i').style.width=Math.max(0,b.tLeft/(b.tMax||60)*100)+'%';$('bTimer').querySelector('span').textContent=Math.ceil(Math.max(0,b.tLeft))+' 秒';$('bTimer').classList.toggle('low',b.tLeft<=10);}
function useItem(id){
  const b=battle; if(!b||(save.inv[id]||0)<=0) return;
  if(id==='hint'){ if(b.hinted||b.locked||b.cur.type!=='mc') return; const wrong=[...$('bOpts').querySelectorAll('.bopt:not([disabled])')].filter(x=>+x.dataset.i!==0); const pick=wrong[Math.random()*wrong.length|0]; if(!pick) return; pick.disabled=true; pick.classList.add('struck'); b.hinted=true; }
  if(id==='glass'){ if(!b.s.timer||b.locked) return; b.tLeft+=15; b.tMax+=15; drawTimer(); }
  if(id==='potion'){ if(b.double) return; b.double=true; }
  save.inv[id]--; if(save.inv[id]<=0) delete save.inv[id]; persist(); renderBars(); sfx('coin');
  toast({hint:'提示卷軸：刪去了一個錯誤選項',glass:'時間沙漏：多了 15 秒',potion:'這一場的金幣獎勵加倍！'}[id]);
}
function answer(i){
  const b=battle; if(!b||b.locked) return;
  if(i===-1){ b.locked=true; revealAnswer(); resolve(false,true); return; }
  if(b.cur.type==='tf'){ tfAnswer(i===0?1:0); return; }
  if(b.cur.type!=='mc') return;
  b.locked=true;
  $('bOpts').querySelectorAll('.bopt').forEach(x=>{x.disabled=true;const v=+x.dataset.i;if(v===0)x.classList.add('right');else if(v===i)x.classList.add('wrong');});
  resolve(i===0,false);
}

/* 所有題型共用：記錄、連擊、攻擊或被反擊、狂暴、解說 */
function resolve(ok,timeout,recorded){
  const b=battle; b.locked=true; clearInterval(b.timerId); const c=b.cur;
  if(!recorded&&c.q) recordAnswer(curSub,curUnit,b.s.n-1,c.qi,c.q,ok);
  const pc=player.ch, mc=b.m.ch;
  let perkMsg='';
  if(ok){ comboRun++; b.maxCombo=Math.max(b.maxCombo||0,comboRun); if(comboRun>=3) b.bonus=(b.bonus||0)+(clsIs('Bard')?3:2);
    if(comboRun>(save.bestCombo||0)){ save.bestCombo=comboRun; }
    const dbl=petPerk('dino')&&Math.random()<.3; const crit=!dbl&&clsIs('Barbarian')&&comboRun>=3&&Math.random()<.5;
    b.hp=Math.max(0,b.hp-(dbl||crit?2:1)); if(dbl) perkMsg=`${save.pets.owned.dino.name}的龍息：兩倍傷害！`; if(crit) perkMsg='戰士的狂戰之力：重擊！兩倍傷害！';
    if(clsIs('Cleric')&&!b.healed&&comboRun>=3&&b.hearts<3){ b.healed=true; b.hearts++; perkMsg=(perkMsg?perkMsg+'<br>':'')+'牧師的治癒之光：恢復了 1 顆愛心！'; }
    oneShot(pc,attackClip(),'idle',1000); try{ attackFx(dbl||crit); }catch(e){ console.warn('fx',e); } sfx('ok',comboRun); if(comboRun>=3) sfx('combo',comboRun); setTimeout(()=>{sfx('hit'); if(b.hp>0) oneShot(mc,'hit','idle',700);},420); }
  else { const song=clsIs('Bard')&&!b.song&&comboRun>=2; const keep=!song&&comboRun>=2&&(save.inv.charm||0)>0;
    if(song){ b.song=true; perkMsg=`吟遊詩人的鼓舞之歌：連擊 ${comboRun} 沒有中斷！`; }
    else if(keep){ save.inv.charm--; if(save.inv.charm<=0) delete save.inv.charm; perkMsg=`連擊護符發光了！連擊 ${comboRun} 沒有中斷。`; } else comboRun=0;
    if(b.rage) b.rageClean=false;
    const pm=t=>{perkMsg=(perkMsg?perkMsg+'<br>':'')+t;};
    let def='hit';
    if(clsIs('Knight')&&!b.guard){ b.guard=true; def='guard'; pm('騎士的守護之盾擋下了這次攻擊！（每場一次）'); }
    else if(clsIs('Rogue_Hooded')&&Math.random()<.3){ def='dodge'; pm('兜帽遊俠的靈巧閃避：閃開了攻擊！'); }
    else if(petPerk('cactoro')&&!b.shield){b.shield=true; def='guard'; pm(`${save.pets.owned.cactoro.name}擋下了這次攻擊！`);} else b.hearts--;
    try{ defendFx(def,b.s.n===2); }catch(e){ console.warn('fx',e); }
    if(b.hearts<=0&&(save.inv.feather||0)>0){ save.inv.feather--; if(save.inv.feather<=0) delete save.inv.feather; b.hearts=1; b.revived=true; perkMsg=(perkMsg?perkMsg+'<br>':'')+'復活羽毛閃耀金光：你恢復了 1 顆愛心！'; }
    sfx('no'); oneShot(mc,b.s.n===2?'castShot':'chop','idle',1000); setTimeout(()=>{sfx('hurt'); if(b.hearts>0) oneShot(pc,'hit','idle',700);},420); }
  showCombo();
  let rageMsg='';
  if(ok&&b.s.boss&&!b.rage&&b.hp>0&&b.hp<=Math.floor(b.s.hp/2)){ b.rage=true; b.rageClean=true; enrage(b.m); rageMsg=`<p class="rage-msg">${esc(b.s.name)}狂暴了！接下來每題的時間變短（題目越長，時間越多）。撐過去不再失去愛心，還有勇氣獎勵！</p>`; }
  const h=answerHtml(ok,timeout);
  $('bFb').innerHTML=`<p>${h.head}</p>${perkMsg?`<p class="perk">${perkMsg}</p>`:''}${rageMsg}<p class="exp">${h.exp}</p><button type="button" class="act" id="bNext">${b.hp<=0?'打倒它！':b.hearts<=0?'繼續':'下一題'}</button>`;
  $('bFb').hidden=false; renderBars(); persist(); $('bNext').focus();
  $('bNext').onclick=()=>{ if(b.hp<=0) win(); else if(b.hearts<=0) lose(); else nextQuestion(); };
  if(ok) checkAch();
}
function enrage(m){
  sfx('rage'); $('battle').classList.add('rage'); const r=m.ch.root;
  m.rageScale=r.scale.x; r.scale.setScalar(m.rageScale*1.22);
  r.traverse(o=>{ if(o.isMesh&&o.material&&!o.userData.rageOrig){ o.userData.rageOrig=o.material; const mm=o.material.clone(); if(mm.emissive){mm.emissive=new THREE.Color('#d0281c');mm.emissiveIntensity=.55;} else if(mm.color) mm.color=mm.color.clone().lerp(new THREE.Color('#ff3020'),.35); o.material=mm; } });
}
function calm(m){
  if(!m||m.rageScale===undefined) return; const r=m.ch.root; r.scale.setScalar(m.rageScale); delete m.rageScale;
  r.traverse(o=>{ if(o.userData.rageOrig){ o.material=o.userData.rageOrig; delete o.userData.rageOrig; } });
}
function win(){
  const b=battle; b.over=true; const s=b.s; const first=!UM().cleared[s.n];
  let coins=first?s.reward:5; if(b.double) coins*=2; if(petPerk('mushnub')) coins+=3;
  const um=UM(); um.stars=um.stars||{}; const stars=Math.max(1,Math.min(3,b.hearts-(b.revived?1:0)||1)); const prevSt=um.stars[s.n]||0; if(stars>prevSt) um.stars[s.n]=stars;
  const starBonus=!first&&stars>prevSt?(stars-prevSt)*10:0; const comboBonus=b.bonus||0; const courage=b.rage&&b.rageClean?15:0;
  coins+=starBonus+comboBonus+courage;
  const rogueBonus=clsIs('Rogue')?Math.max(2,Math.round(coins*.2)):0; coins+=rogueBonus;
  const wkBonus=curSub===weekState().sub?Math.round(coins*.5):0; coins+=wkBonus; const weekMsg=weekWin();
  if(save.pets&&save.pets.active&&save.pets.owned[save.pets.active]){save.pets.owned[save.pets.active].love=(save.pets.owned[save.pets.active].love||0)+1;} if(pet) oneShot(pet,'jump','idle',1400);
  save.dex=save.dex||{}; const dk=curSub+'-'+s.n; const newDex=!save.dex[dk]; save.dex[dk]=(save.dex[dk]||0)+1;
  addCoins(coins,'battle'); UM().cleared[s.n]=1; SS().wins=(SS().wins||0)+1;
  if(!save.ach.mathwin){save.ach.mathwin=1;} if(s.boss&&!save.ach.mathking){save.ach.mathking=1;} if(s.boss&&first) UM().chest=1;
  persist(); hud();
  holdPose(b.m.ch,'skDeath'); oneShot(player.ch,'cheer','idle',1800);
  const q=s.boss?QUESTS.find(x=>x.sub===curSub&&x.unit===curUnit):null; const qs=q&&save.quests[q.id];
  const qmsg=q?(qs==='active'?`委託「${q.title}」完成了！回冒險者公會找雷恩領取 ${q.reward} 金幣。`:qs==='done'?'':`冒險者公會有一個「${q.title}」委託，接下來就能領取額外獎勵。`):'';
  const nextMsg=s.n<5?(first?`第 ${s.n+1} 關已經解鎖。`:'練習完成！'):(first?`你征服了「${MATH_UNITS[curUnit-1].title}」！${s.name}身邊出現了寶箱和回城的傳送門。`:'再次征服這個單元！這次沒有寶箱，旁邊的傳送門可以直接回城。');
  $('bQ').textContent=`勝利！打倒了${s.name}`; $('bOpts').innerHTML=''; $('bTimer').hidden=true;
  sfx('win'); setTimeout(()=>sfx('coin'),900); $('battle').classList.remove('rage'); $('bTag').hidden=true;
  const extra=[comboBonus?`連擊獎勵 +${comboBonus}`:'',starBonus?`星星進步 +${starBonus}`:'',courage?`勇氣獎勵 +${courage}`:'',rogueBonus?`遊俠尋寶 +${rogueBonus}`:'',wkBonus?`主題週 +${wkBonus}`:'',weekMsg].filter(Boolean).join('．');
  $('bFb').innerHTML=`<p class="win-stars" aria-label="${stars} 顆星">${'<span class="st on">★</span>'.repeat(stars)}${'<span class="st">★</span>'.repeat(3-stars)}</p><p class="exp" style="margin-top:-4px">${stars===3?'完美！一顆愛心都沒有失去。':stars===2?'很棒！失去 1 顆愛心。再挑戰一次，挑戰三顆星！':'過關了！再挑戰一次，挑戰更多星星！'}${prevSt&&stars<=prevSt?`（最佳紀錄 ${prevSt} 顆星）`:''}</p><p><b class="ok">獲得 ${coins} 金幣</b>${first?'':'（再次挑戰的練習獎勵）'}${b.double?'．藥水加倍':''}${extra?`<br><span class="perk">${extra}</span>`:''}</p><p class="exp">${nextMsg}${qmsg?'<br>'+qmsg:''}${newDex?`<br>怪物圖鑑新登記：${DEX[curSub][s.n-1]}！`:''}</p><button type="button" class="act" id="bLeave">離開戰鬥</button>`;
  $('bFb').hidden=false; renderBars(); $('bLeave').onclick=()=>endBattle(); $('bLeave').focus();
}
function lose(){
  const b=battle; b.over=true; holdPose(player.ch,'death'); oneShot(b.m.ch,'cheer','idle',1600); sfx('lose'); comboRun=0; showCombo(); $('bTag').hidden=true; $('battle').classList.remove('rage'); calm(b.m);
  $('bQ').textContent='被打倒了……'; $('bOpts').innerHTML=''; $('bTimer').hidden=true;
  $('bFb').innerHTML=`<p class="exp">別灰心！剛才的解說記起來了嗎？再試一次一定會更好。</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="act" id="bRetry">再挑戰</button><button type="button" class="act ghost" id="bLeave">離開</button></div>`;
  $('bFb').hidden=false; renderBars();
  $('bRetry').onclick=()=>{const n=b.s.n; clearInterval(b.timerId); battle=null; startBattle(n,true);}; $('bLeave').onclick=()=>endBattle(); $('bRetry').focus();
}
function endBattle(){
  const b=battle; if(!b) return; clearInterval(b.timerId); battle=null; calm(b.m); $('battle').classList.remove('rage'); try{speechSynthesis.cancel();}catch(e){}
  $('battle').hidden=true; for(const id of ['hudBtns','minimap','where']) $(id).hidden=false; $('help').hidden=isTouch; $('stick').hidden=!isTouch; $('actBtn').hidden=!isTouch;
  const pc=player.ch; pc.busy=false; for(const a of Object.values(pc.actions)) a.stop(); pc.cur=null; playOn(pc,'idle');
  pc.holder.children.forEach(c=>{if(c.isSprite)c.visible=true;});
  monsters.forEach(monsterRest); refreshBossRewards();
  player.pos.z+=1.5; mode='play'; canvas.focus(); checkAch();
}

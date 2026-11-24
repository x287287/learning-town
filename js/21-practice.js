/* 學習冒險城．js/21-practice.js
 * 訓練場、練習新題型、通用答題面板、錯題小精靈、每日挑戰
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ---------- 訓練場：練習模式 ---------- */
let pr=null; // 目前練習
let prSet={sub:'math',unit:1,stage:0,count:10}; // stage 0 = 全部小節
function prPool(unit,stage){ const U=MATH_UNITS[unit-1]; const out=[]; U.q.forEach((qs,si)=>{ if(stage&&si!==stage-1) return; qs.forEach((q,qi)=>out.push({q,si,qi})); }); return out; }
function openPractice(){
  pr=null; useSub(prSet.sub); if(!MATH_UNITS[prSet.unit-1]) prSet.unit=1;
  const U=MATH_UNITS[prSet.unit-1];
  const units=MATH_UNITS.map(u=>`<button type="button" class="ch" data-pu="${u.n}" aria-pressed="${prSet.unit===u.n}">${u.n}. ${esc(u.title)}</button>`).join('');
  const stages=[`<button type="button" class="ch" data-ps="0" aria-pressed="${prSet.stage===0}">全部小節</button>`,...U.stages.map((s,i)=>`<button type="button" class="ch" data-ps="${i+1}" aria-pressed="${prSet.stage===i+1}">${i===4?'綜合應用':s[1]}</button>`)].join('');
  const total=prPool(prSet.unit,prSet.stage).length;
  const counts=[5,10,20,0].map(c=>{const lab=c?`${c} 題`:`全部 ${total} 題`;const dis=c&&c>total;return `<button type="button" class="ch" data-pc="${c}" aria-pressed="${prSet.count===c}" ${dis?'disabled style="opacity:.4"':''}>${lab}</button>`;}).join('');
  if(prSet.count&&prSet.count>total) prSet.count=0;
  const pkey=prSet.sub==='math'?`${prSet.unit}-${prSet.stage}`:`${prSet.sub}-${prSet.unit}-${prSet.stage}`; const best=(save.practice||{})[pkey];
  openPanel(panelShell('訓練場．練習模式','選好單元和題數就能開始。答錯會看到解說，練習幾次都可以。',`
    <div class="prsec"><h3>科目</h3><div class="choices">${SUBJECTS.filter(s=>SUBJ_DATA[s.id]).map(s=>`<button type="button" class="ch" data-psub="${s.id}" aria-pressed="${prSet.sub===s.id}">${s.name}</button>`).join('')}</div><p class="note">${esc(SUBJ_DATA[prSet.sub].book)}</p></div>
    <div class="prsec"><h3>單元</h3><div class="choices">${units}</div></div>
    <div class="prsec"><h3>範圍</h3><div class="choices">${stages}</div></div>
    <div class="prsec"><h3>題數</h3><div class="choices">${counts}</div></div>
    <p class="note">${best?`這個範圍的最佳紀錄：答對 ${best.c} / ${best.n} 題`:'這個範圍還沒有練習紀錄'}．已完成練習 ${save.prDone||0} 次</p>
    <button type="button" class="act" id="prGo" style="align-self:flex-start;font-size:18px">開始練習</button>`));
  veil.querySelectorAll('[data-psub]').forEach(b=>b.onclick=()=>{prSet.sub=b.dataset.psub;prSet.unit=1;prSet.stage=0;openPractice();});
  veil.querySelectorAll('[data-pu]').forEach(b=>b.onclick=()=>{prSet.unit=+b.dataset.pu;prSet.stage=0;openPractice();});
  veil.querySelectorAll('[data-ps]').forEach(b=>b.onclick=()=>{prSet.stage=+b.dataset.ps;openPractice();});
  veil.querySelectorAll('[data-pc]').forEach(b=>b.onclick=()=>{prSet.count=+b.dataset.pc;openPractice();});
  $('prGo').onclick=()=>startPractice();
}
function startPractice(){
  const pool=shuffle(prPool(prSet.unit,prSet.stage)); const n=prSet.count?Math.min(prSet.count,pool.length):pool.length;
  pr={list:pool.slice(0,n),k:0,correct:0,wrong:[],locked:false,hinted:false};
  showPracticeQ();
}
function showPracticeQ(){
  const it=pr.list[pr.k], q=it.q, U=MATH_UNITS[prSet.unit-1]; const order=shuffle([0,1,2,3]); pr.locked=false;
  const pct=Math.round(pr.k/pr.list.length*100);
  openPanel(panelShell(`練習：${U.title}`,`第 ${pr.k+1} / ${pr.list.length} 題．答對 ${pr.correct} 題`,`
    <div class="prbar"><i style="width:${pct}%"></i></div>
    <div class="prtag">${it.si===4?'綜合應用':U.stages[it.si][1]}</div>
    <div class="prq">${esc(q.q)}</div>
    <div class="propts">${order.map((oi,i)=>`<button type="button" class="bopt" data-i="${oi}"><span class="key">${i+1}</span>${esc(q.o[oi])}</button>`).join('')}</div>
    <div class="prfb" id="prFb" hidden></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="act ghost" id="prQuit" style="color:var(--parchment)">結束練習</button></div>`));
  veil.querySelector('.panel').classList.add('practice');
  veil.querySelectorAll('.propts .bopt').forEach(b=>b.onclick=()=>practiceAnswer(+b.dataset.i));
  addSpeak(veil.querySelector('.prq'),veil.querySelector('.propts'),prSet.sub,q.q);
  maybeAlt(q,(ok,pick)=>practiceAnswer(ok?0:-1,pick));
  $('prQuit').onclick=()=>finishPractice(true);
}
function practiceAnswer(i,pickTxt){
  if(!pr||pr.locked) return; pr.locked=true; const it=pr.list[pr.k], q=it.q; const ok=i===0; sfx(ok?'ok':'no');
  veil.querySelectorAll('.propts .bopt').forEach(b=>{b.disabled=true;const v=+b.dataset.i;if(v===0)b.classList.add('right');else if(v===i)b.classList.add('wrong');});
  recordAnswer(prSet.sub,prSet.unit,it.si,it.qi,q,ok); if(ok) pr.correct++; else pr.wrong.push({q,pick:pickTxt!==undefined?pickTxt:q.o[i]});
  const last=pr.k>=pr.list.length-1;
  const fb=$('prFb'); fb.hidden=false;
  fb.innerHTML=`<p>${ok?'<b class="ok">答對了！</b>':`<b class="no">答錯了</b>　正確答案：<b>${esc(q.o[0])}</b>`}</p><p class="exp">${esc(q.e)}</p><button type="button" class="act" id="prNext">${last?'看結果':'下一題'}</button>`;
  $('prNext').onclick=()=>{ if(last) finishPractice(false); else { pr.k++; showPracticeQ(); } };
  $('prNext').focus();
  const sub=veil.querySelector('.panel .sub'); if(sub) sub.textContent=`第 ${pr.k+1} / ${pr.list.length} 題．答對 ${pr.correct} 題`;
}
function finishPractice(quit){
  const done=pr.k+(pr.locked?1:0); const n=quit?done:pr.list.length; const c=pr.correct;
  if(n>0){
    save.prDone=(save.prDone||0)+(quit?0:1); save.practice=save.practice||{};
    const key=prSet.sub==='math'?`${prSet.unit}-${prSet.stage}`:`${prSet.sub}-${prSet.unit}-${prSet.stage}`, old=save.practice[key];
    if(!quit&&(!old||c/n>old.c/old.n||(c/n===old.c/old.n&&n>old.n))) save.practice[key]={c,n};
    if(!quit&&!save.ach.practice){save.ach.practice=1;toast('達成成就「勤學苦練」！');}
    if(!quit&&c===n&&n>=10&&!save.ach.perfect){save.ach.perfect=1;toast('達成成就「完美練習」！');}
    persist(); hud(); checkAch();
  }
  const pct=n?Math.round(c/n*100):0;
  const msg=n===0?'還沒有作答喔。':pct===100?'全部答對，太厲害了！':pct>=80?'很棒！再練一次衝滿分吧！':pct>=60?'不錯喔，看看錯的題目再挑戰一次。':'別灰心，先看下面的解說，再練一次會更好。';
  const wrongList=pr.wrong.length?pr.wrong.map((w,i)=>`<div class="card" style="grid-template-columns:1fr"><div style="min-width:0"><h3>${i+1}. ${esc(w.q.q)}</h3><p>你的答案：${esc(w.pick||'未作答')}．正確答案：<b>${esc(w.q.o[0])}</b></p><p>${esc(w.q.e)}</p></div></div>`).join(''):'';
  openPanel(panelShell(quit?'練習結束':'練習完成！',`${MATH_UNITS[prSet.unit-1].title}`,`
    <div class="scroll" style="text-align:center"><div style="font-size:42px;color:var(--crimson);font-weight:700">${c} / ${n}</div>${msg}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="act" id="prAgain">再練一次</button><button type="button" class="act ghost" id="prSetup" style="color:var(--parchment)">換單元或題數</button></div>
    ${wrongList?'<h3 style="margin:6px 0 0;font-family:var(--f-display);color:var(--brass)">答錯的題目</h3>'+wrongList:''}`));
  pr=null;
  $('prAgain').onclick=()=>startPractice(); $('prSetup').onclick=()=>openPractice();
}

/* ---------- 練習、每日挑戰也有新題型（判斷對錯、輸入答案） ---------- */
let altCur=null;
function altPick(q){ if(isNumQ(q)&&Math.random()<.45) return {type:'num'}; if(canTF(q)&&Math.random()<.2){ const truth=Math.random()<.5; return {type:'tf',truth,show:truth?0:1+(Math.random()*3|0)}; } return null; }
function renderAlt(alt,q,O,done){
  altCur=alt; Object.assign(alt,{q,O,done,locked:false,val:''});
  if(alt.type==='tf'){ O.classList.add('tf'); O.innerHTML=`<div class="tfbox">答案是「<b>${esc(q.o[alt.show])}</b>」，對嗎？</div><button type="button" class="bopt tfo" data-v="1"><span class="key">1</span>⭕ 對</button><button type="button" class="bopt tfo" data-v="0"><span class="key">2</span>❌ 不對</button>`;
    O.querySelectorAll('.tfo').forEach(x=>x.onclick=()=>altTF(+x.dataset.v)); }
  else { O.classList.add('num'); const keys=['7','8','9','⌫','4','5','6','-','1','2','3','.','0'];
    O.innerHTML=`<div class="numin" aria-live="polite"><span class="ph">輸入答案</span></div><div class="numpad">${keys.map(k=>`<button type="button" class="nk" data-k="${k}">${k}</button>`).join('')}<button type="button" class="nk go" data-k="ok">確定</button></div>`;
    O.querySelectorAll('.nk').forEach(x=>x.onclick=()=>altKey(x.dataset.k)); }
}
function altTF(v){ const a=altCur; if(!a||a.locked) return; a.locked=true; const ok=(v===1)===a.truth;
  a.O.querySelectorAll('.tfo').forEach(x=>{x.disabled=true;const xv=+x.dataset.v;if((xv===1)===a.truth)x.classList.add('right');else if(xv===v)x.classList.add('wrong');});
  altCur=null; a.done(ok,ok?a.q.o[0]:(a.truth?'（判斷成不對）':`（判斷「${a.q.o[a.show]}」是對的）`)); }
function altKey(k){ const a=altCur; if(!a||a.locked||a.type!=='num') return;
  if(k==='ok'){ if(!a.val||a.val==='-') return; a.locked=true; const ok=Math.abs(parseFloat(a.val)-parseFloat(a.q.o[0]))<1e-9; const el=a.O.querySelector('.numin'); el.classList.add(ok?'right':'wrong'); a.O.querySelectorAll('.nk').forEach(x=>x.disabled=true); altCur=null; a.done(ok,a.val); return; }
  if(k==='⌫') a.val=a.val.slice(0,-1); else if(k==='-') a.val=a.val.startsWith('-')?a.val.slice(1):'-'+a.val;
  else if(k==='.'){ if(!a.val.includes('.')) a.val=(a.val===''||a.val==='-'?a.val+'0':a.val)+'.'; }
  else if(a.val.replace(/[-.]/g,'').length<9) a.val=(a.val==='0'?'':a.val==='-0'?'-':a.val)+k;
  a.O.querySelector('.numin').innerHTML=a.val?esc(a.val):'<span class="ph">輸入答案</span>'; }
function maybeAlt(q,onDone){
  const alt=altPick(q); if(!alt){ altCur=null; return; }
  const O=veil.querySelector('.propts'); const tag=veil.querySelector('.prtag'); if(tag) tag.textContent+=`．${TYPE_TAG[alt.type]}`;
  renderAlt(alt,q,O,onDone);
}

/* ======================= 通用答題面板（錯題複習、每日挑戰） ======================= */
let qz=null;
function runQuiz(title,items,onDone){ qz={title,items,k:0,c:0,wrong:[],locked:false,onDone}; showQz(); }
function showQz(){
  const it=qz.items[qz.k], q=it.q; const order=shuffle([0,1,2,3]); qz.locked=false;
  const pct=Math.round(qz.k/qz.items.length*100);
  openPanel(panelShell(qz.title,`第 ${qz.k+1} / ${qz.items.length} 題．答對 ${qz.c} 題`,`
    <div class="prbar"><i style="width:${pct}%"></i></div>
    <div class="prtag">${SUB[it.sub].name}．${esc(unitShort(it.U))}．${it.si===4?'綜合應用':esc(it.U.stages[it.si][1])}</div>
    <div class="prq">${esc(q.q)}</div>
    <div class="propts">${order.map((oi,i)=>`<button type="button" class="bopt" data-i="${oi}"><span class="key">${i+1}</span>${esc(q.o[oi])}</button>`).join('')}</div>
    <div class="prfb" id="qzFb" hidden></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="act ghost" id="qzQuit" style="color:var(--parchment)">先停在這裡</button></div>`));
  veil.querySelector('.panel').classList.add('practice');
  veil.querySelectorAll('.propts .bopt').forEach(b=>b.onclick=()=>qzAnswer(+b.dataset.i));
  addSpeak(veil.querySelector('.prq'),veil.querySelector('.propts'),it.sub,q.q);
  maybeAlt(q,(ok,pick)=>qzAnswer(ok?0:-1,pick));
  $('qzQuit').onclick=()=>qzFinish(true);
}
function qzAnswer(i,pickTxt){
  if(!qz||qz.locked) return; qz.locked=true; const it=qz.items[qz.k], q=it.q, ok=i===0; sfx(ok?'ok':'no');
  veil.querySelectorAll('.propts .bopt').forEach(b=>{b.disabled=true;const v=+b.dataset.i;if(v===0)b.classList.add('right');else if(v===i)b.classList.add('wrong');});
  const g0=gradNote; recordAnswer(it.sub,it.u,it.si,it.qi,q,ok); const grad=gradNote>g0;
  if(ok) qz.c++; else qz.wrong.push({q,pick:pickTxt!==undefined?pickTxt:q.o[i]});
  const last=qz.k>=qz.items.length-1;
  const fb=$('qzFb'); fb.hidden=false;
  fb.innerHTML=`<p>${ok?'<b class="ok">答對了！</b>':`<b class="no">答錯了</b>　正確答案：<b>${esc(q.o[0])}</b>`}${grad?'　<b class="ok">這題從錯題本畢業了！</b>':''}</p><p class="exp">${esc(q.e)}</p><button type="button" class="act" id="qzNext">${last?'看結果':'下一題'}</button>`;
  $('qzNext').onclick=()=>{ if(last) qzFinish(false); else { qz.k++; showQz(); } }; $('qzNext').focus();
  const sub=veil.querySelector('.panel .sub'); if(sub) sub.textContent=`第 ${qz.k+1} / ${qz.items.length} 題．答對 ${qz.c} 題`;
}
function qzFinish(quit){ const z=qz; if(!z) return; const n=quit?z.k+(z.locked?1:0):z.items.length; qz=null; checkAch(); z.onDone&&z.onDone({c:z.c,n,quit,wrong:z.wrong}); }

/* ======================= 錯題小精靈 ======================= */
function openWrongBook(){
  const all=wrongList(); persist();
  const per=SUBJECTS.map(s=>[s,all.filter(x=>x.sub===s.id).length]);
  const rows=all.slice(0,30).map(x=>`<div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:${SUB[x.sub].color}">${SUB[x.sub].name[0]}</div><div style="min-width:0"><h3 style="font-size:17px">${esc(x.q.q)}</h3><p>${esc(unitShort(x.U))}．錯過 ${x.w.n} 次．再答對 ${2-(x.w.c||0)} 次就畢業</p></div></div>`).join('');
  openPanel(panelShell('錯題本','書籤精靈露米會把你在戰鬥、練習中答錯的題目收在這裡。同一題再答對 2 次，就能從錯題本畢業！',
    all.length?`<div class="scroll" style="text-align:center">錯題本裡有 <b style="color:var(--crimson);font-size:26px">${all.length}</b> 題．已經畢業 ${save.grad||0} 題</div>
    <div class="tabs">${per.filter(([,n])=>n).map(([s,n])=>`<button type="button" class="tab" data-wsub="${s.id}">${s.name}（${n}）</button>`).join('')}</div>
    <button type="button" class="act" id="wbAll" style="align-self:flex-start;font-size:18px">複習錯題（最多 10 題）</button>
    <p class="note">點上面的科目，只複習那一科。</p>${rows}`
    :`<div class="empty">錯題本是空的！<br>${save.grad?`你已經讓 ${save.grad} 題畢業了，好厲害。`:'答錯的題目會自動收進來。'}</div>`));
  const go=sub=>{ const L=shuffle(wrongList(sub)).slice(0,10); if(!L.length) return; runQuiz(sub?`錯題複習．${SUB[sub].name}`:'錯題複習',L,res=>{
    const left=wrongList().length; persist(); hud();
    openPanel(panelShell(res.quit?'複習先停在這裡':'複習完成！',`錯題本還剩 ${left} 題．累計畢業 ${save.grad||0} 題`,`<div class="scroll" style="text-align:center"><div style="font-size:42px;color:var(--crimson);font-weight:700">${res.c} / ${res.n}</div>${res.n&&res.c===res.n?'全部答對！錯題正在一題一題畢業。':'看懂解說，下次一定會更好。'}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${left?'<button type="button" class="act" id="wbAgain">再複習一輪</button>':''}<button type="button" class="act ghost" id="wbBack" style="color:var(--parchment)">回到錯題本</button></div>`));
    if($('wbAgain')) $('wbAgain').onclick=()=>go(sub); $('wbBack').onclick=()=>openWrongBook(); }); };
  if($('wbAll')) $('wbAll').onclick=()=>go(null);
  veil.querySelectorAll('[data-wsub]').forEach(b=>b.onclick=()=>go(b.dataset.wsub));
}

/* ======================= 每日信差 ======================= */
function seeded(seed){ let a=seed>>>0; return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}; }
function dailyItems(){
  const R=seeded(dayIdx()*7919+13); const subs=SUBJECTS.map(s=>s.id).filter(s=>SUBJ_DATA[s]);
  for(let i=subs.length-1;i>0;i--){const j=R()*(i+1)|0;[subs[i],subs[j]]=[subs[j],subs[i]];}
  return subs.slice(0,3).map(s=>{ const D=SUBJ_DATA[s]; const U=D.units[R()*D.units.length|0]; const si=R()*4|0; const qi=R()*U.q[si].length|0; return qAt(s,U.n,si,qi); }).filter(Boolean);
}
function dailyState(){ const d=save.daily||{}; const t=dayIdx(); const streak=d.last===t||d.last===t-1?(d.streak||0):0; return {doneToday:d.last===t,streak,best:d.best||0}; }
function openDaily(){
  const st=dailyState();
  if(st.doneToday){ openPanel(panelShell('每日挑戰','信差小飛每天會送來 3 題不同科目的挑戰。',`<div class="scroll">今天的挑戰已經完成了！<br>目前連續 <b>${st.streak}</b> 天．最長紀錄 ${st.best} 天<br>明天再來找我拿新的信喔。</div>${dailyRewardNote()}`)); return; }
  openPanel(panelShell('每日挑戰','信差小飛每天會送來 3 題不同科目的挑戰。',`<div class="scroll">今天的信送到了！裡面有 3 題，來自不同科目。<br>完成就能得到 15 金幣，全對再多 10 金幣。<br>目前連續 <b>${st.streak}</b> 天。</div>${dailyRewardNote()}<button type="button" class="act" id="dyGo" style="align-self:flex-start;font-size:18px">拆開今天的信</button>`));
  $('dyGo').onclick=()=>runQuiz('每日挑戰',dailyItems(),res=>{
    if(res.quit){ openPanel(panelShell('挑戰還沒完成','要把 3 題都作答完，才算完成今天的挑戰。',`<button type="button" class="act" id="dyRe" style="align-self:flex-start">重新挑戰</button>`)); $('dyRe').onclick=()=>openDaily(); return; }
    const t=dayIdx(), d=save.daily||{}; const streak=d.last===t-1?(d.streak||0)+1:1; save.daily={last:t,streak,best:Math.max(d.best||0,streak)};
    let coins=15+(res.c===res.n?10:0); addCoins(coins,'daily'); let extra='';
    if(streak>=7&&!save.inv.eq_sky){ save.inv.eq_sky=1; extra='<p class="note" style="color:#ffd76a">連續 7 天！你得到了限定的「天空藍披風」，到裁縫屋換上吧！</p>'; }
    persist(); hud(); checkAch(); oneShot(player.ch,'cheer','idle',1500);
    openPanel(panelShell('每日挑戰完成！',`連續 ${streak} 天．答對 ${res.c} / ${res.n} 題`,`<div class="scroll" style="text-align:center"><div style="font-size:42px;color:var(--crimson);font-weight:700">+${coins} 金幣</div>${res.c===res.n?'全部答對，加碼 10 金幣！':'答錯的題目已經收進錯題本，可以找露米複習。'}</div>${extra}${dailyRewardNote()}`));
  });
}
function dailyRewardNote(){ return '<p class="note">連續 3 天可得到稱號「每日勤學家」；連續 7 天可得到限定的天空藍披風。中斷一天就會從 1 重新算起。</p>'; }

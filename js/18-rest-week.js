/* 學習冒險城．js/18-rest-week.js
 * 休息提醒、每週主題
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ---------- 休息提醒 ---------- */
const REST_KEY='learning-town-rest';
let restMin=(()=>{const v=+lsGet(REST_KEY); return isNaN(v)||lsGet(REST_KEY)===null?30:v;})();
let playSec=0, lastInput=Date.now();
['pointerdown','keydown','touchstart'].forEach(ev=>addEventListener(ev,()=>{lastInput=Date.now();},{passive:true}));
setInterval(()=>{
  if(document.hidden||mode==='pick'||mode==='create'||!save.created) return;
  if(Date.now()-lastInput>120000) return;
  playSec+=5; if(restMin>0&&playSec>=restMin*60&&(mode==='play'||mode==='ui')&&!battle&&!vp&&!pr&&!qz){ playSec=0; openRest(); }
},5000);
function openRest(){
  openPanel(panelShell('休息一下吧！',`你已經連續冒險 ${restMin} 分鐘了。`,`<div class="scroll" style="text-align:center;font-size:19px">站起來伸展一下，<br>看看窗外遠方的景物 20 秒，<br>讓眼睛休息一下。<br><b id="restT" style="font-size:44px;color:var(--brass)">20</b></div><button type="button" class="act" id="restOk" disabled>休息好了，繼續冒險</button>`));
  const x=veil.querySelector('.x'); if(x) x.hidden=true;
  let n=20; const t=setInterval(()=>{ n--; const el=$('restT'); if(!el){clearInterval(t);return;} el.textContent=n; if(n<=0){ clearInterval(t); el.textContent='好了！'; $('restOk').disabled=false; sfx('coin'); } },1000);
  $('restOk').onclick=()=>{ clearInterval(t); closePanel(); toast('休息完畢，冒險繼續！'); };
}

/* ---------- 每週主題 ---------- */
const WEEK_ORDER=['math','chinese','english','science','social'];
function weekIdx(){ return Math.floor((dayIdx()+3)/7); }
function weekSub(){ return WEEK_ORDER[((weekIdx()%5)+5)%5]; }
function weekState(){ const w=weekIdx(); let W=save.week; if(!W||W.w!==w) W=save.week={w,sub:weekSub(),n:0,done:0}; return W; }
const WEEK_GOAL=5;
function weekBanner(){ const W=weekState(); const nm=SUB[W.sub].name; return `本週是「${nm}主題週」：${nm}的闖關金幣 ×1.5；本週打倒 ${WEEK_GOAL} 隻${nm}守衛（重玩也算），可以拿到 40 金幣${W.done?'（本週已完成！）':`，目前 ${Math.min(W.n,WEEK_GOAL)} / ${WEEK_GOAL}`}。`; }
function weekWin(){ const W=weekState(); if(curSub!==W.sub) return ''; W.n++; if(!W.done&&W.n>=WEEK_GOAL){ W.done=1; addCoins(40,'week'); save.weekStars=(save.weekStars||0)+1; return `主題週目標完成！額外獲得 40 金幣`; } return W.done?'':`主題週進度 ${W.n} / ${WEEK_GOAL}`; }

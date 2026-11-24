/* 學習冒險城．js/28-picker.js
 * 冒險者選擇畫面
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ======================= 冒險者選擇（同一台裝置多個存檔） ======================= */
let pickManage=false, pickDel=null;
function capeColor(id){ const c=CAPES.find(c=>c.id===id); return c&&c.color||'#7a4b2a'; }
function fmtDay(t){ if(!t) return ''; const d=new Date(t), n=new Date(); const dd=dayIdx(n)-dayIdx(d); return dd<=0?'今天':dd===1?'昨天':`${d.getMonth()+1}/${d.getDate()}`; }
function openPicker(){
  mode='pick'; stopMove(); if(talk) endTalk(); veil.hidden=true; veil.innerHTML='';
  $('creator').hidden=true; for(const id of ['hudPlayer','hudBtns','minimap','where','help','stick','actBtn','prompt','dialog','tourBox']) $(id).hidden=true;
  if(player.ch) player.ch.holder.visible=false; if(pet) pet.holder.visible=false;
  renderPicker(); $('picker').hidden=false;
}
function renderPicker(){
  if($('pBk')) $('pBk').onclick=()=>openBackup(); if($('pLogin')) $('pLogin').onclick=()=>openLogin();
  const L=prof.list.slice().sort((a,b)=>(b.last||0)-(a.last||0));
  const cards=L.map(p=>{
    if(pickDel===p.id) return `<div class="pcard del"><p>確定要刪除「<b>${esc(p.name)}</b>」的所有進度嗎？刪除後無法復原。</p><div class="prow"><button type="button" class="act" data-delyes="${p.id}">確定刪除</button><button type="button" class="act ghost" data-delno="1">取消</button></div></div>`;
    return `<div class="pcard"><button type="button" class="pmain" data-pick="${p.id}" aria-label="以${esc(p.name)}進入遊戲">
      <span class="pface" style="background:${capeColor(p.cape)}">${esc((p.name||'冒')[0])}</span>
      <span class="pinfo"><b>${esc(p.name)}</b><small><span class="lvtag ${p.lv==='jh'?'jh':''}">${LEVELS[p.lv==='jh'?'jh':'es'].name}</span>${esc(p.title||'新手冒險者')}．${CLASSES[p.cls]?CLASSES[p.cls].label:''}</small><small>征服 ${p.done||0} 個單元．${p.coins||0} 金幣．${fmtDay(p.last)}玩過</small></span>
      ${pickManage?'':'<span class="pgo">進入 ▸</span>'}</button>
      ${pickManage?`<button type="button" class="act" data-del="${p.id}">刪除</button>`:''}</div>`;
  }).join('');
  $('pList').innerHTML=cards||'<p class="note" style="text-align:center">這台裝置還沒有冒險者。</p>';
  $('pManage').textContent=pickManage?'完成':'管理冒險者'; $('pManage').hidden=!L.length;
  $('pNew').disabled=L.length>=40; $('pNote').textContent=L.length>=40?'這台裝置最多 40 位冒險者，請先刪除不用的。':`這台裝置有 ${L.length} 位冒險者，每個人的進度分開儲存。`;
  $('pList').querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>pickProfile(b.dataset.pick));
  $('pList').querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{pickDel=b.dataset.del;renderPicker();});
  $('pList').querySelectorAll('[data-delyes]').forEach(b=>b.onclick=()=>{deleteProfile(b.dataset.delyes);pickDel=null;if(!prof.list.length)pickManage=false;renderPicker();});
  $('pList').querySelectorAll('[data-delno]').forEach(b=>b.onclick=()=>{pickDel=null;renderPicker();});
}
function deleteProfile(id){ if(!id) return; lsDel(KEY+':'+id); lsDel(TOK_KEY(id)); prof.list=prof.list.filter(p=>p.id!==id); if(prof.cur===id) prof.cur=null; lsSet(PKEY,JSON.stringify(prof)); }
function pickProfile(id){
  loadProfile(id); $('picker').hidden=true; pickManage=false; pickDel=null;
  rebuildPlayer(); rebuildPet(); if(player.ch) player.ch.holder.visible=true;
  for(const id of ['hudPlayer','hudBtns','minimap','where']) $(id).hidden=false;
  $('help').hidden=isTouch; $('stick').hidden=!isTouch; $('actBtn').hidden=!isTouch; mode='play'; cam.yaw=player.yaw+Math.PI;
  persist(); checkAch(); hud(); canvas.focus(); toast(`歡迎回來，${save.name}！`); if(!save.toured) setTimeout(()=>{if(mode==='play') startTour();},1800);
  else { setTimeout(()=>{ if(mode==='play'){ const W=weekState(); toast(`本週是「${SUB[W.sub].name}主題週」，${SUB[W.sub].name}闖關金幣 ×1.5！`);} },2200); }
  cloudBadge();
  if(!save.cloud) setTimeout(()=>openAccount('create',()=>{ if(!save.toured) startTour(); }),700);
  else if(!cloudTok()) setTimeout(()=>{ toast('雲端登入已過期，請重新登入。'); openLoginForCurrent(); },700);
  else cloudCheckOnEnter();
}
function switchPlayer(){ persist(); location.reload(); }
function changeLevel(lv){ setLevel(lv); persist(); try{sessionStorage.setItem('learning-town-autopick',curId||'');}catch(e){} location.reload(); }
$('pNew').onclick=()=>{ $('picker').hidden=true; pickManage=false; pickDel=null; loadProfile(null); player.pos.set(0,0,8); player.yaw=Math.PI; openCreator(false); };
$('pManage').onclick=()=>{ pickManage=!pickManage; pickDel=null; renderPicker(); };
$('hudPlayer').onclick=()=>{ if(mode!=='play') return; openPanel(panelShell('切換冒險者',`目前是「${esc(save.name)}」。切換後會回到冒險者選擇畫面，你的進度已經自動儲存。`,`<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="act" type="button" id="swYes">切換冒險者</button><button class="act ghost" type="button" id="swNo" style="color:var(--parchment)">繼續冒險</button></div>`)); $('swYes').onclick=()=>switchPlayer(); $('swNo').onclick=()=>closePanel(); };

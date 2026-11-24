/* 學習冒險城．js/29-update.js
 * 版本更新公告
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ======================= 版本更新公告 ======================= */
/* 每次發布新版：把 APP_VERSION 和 version.json 的 v 一起加 1，並在 version.json 的 notes 最前面加一則公告。 */
const APP_VERSION=33, SEEN_KEY='learning-town-seen-version';
let updShown=0, updInfo=null;
async function fetchVer(){ try{ const r=await fetch('version.json?t='+Date.now(),{cache:'no-store'}); if(!r.ok) return null; const j=await r.json(); return j&&j.v?j:null; }catch(e){ return null; } }
function noteHtml(list){ return list.map(n=>`<div class="unote"><h3>${esc(n.title)}<small>${esc(n.date||'')}</small></h3><ul>${(n.items||[]).map(i=>`<li>${esc(i)}</li>`).join('')}</ul></div>`).join(''); }
function showUpdate(info,newer,seen){
  const list=(info.notes||[]).filter(n=>newer?n.v>APP_VERSION:(n.v>seen&&n.v<=APP_VERSION)).slice(0,3);
  $('updTitle').textContent=newer?'有新版本！':'更新公告';
  $('updSub').textContent=newer?'遊戲已經更新了，重新整理就能玩到新內容。你的進度會自動儲存，不會不見。':'這次更新了這些內容：';
  $('updBody').innerHTML=noteHtml(list)||'<p class="note">修正了一些小問題。</p>';
  $('updReload').hidden=!newer; $('updLater').textContent=newer?'等一下再更新':'知道了！';
  $('updBox').hidden=false; $('updPill').hidden=true; updInfo={info,newer};
  (newer?$('updReload'):$('updLater')).focus();
}
function doReload(){ try{persist();}catch(e){} if(updInfo&&updInfo.info) lsSet(SEEN_KEY,String(updInfo.info.v)); location.reload(); }
$('updReload').onclick=doReload; $('updPillBtn').onclick=doReload;
$('updLater').onclick=()=>{ $('updBox').hidden=true; if(updInfo&&updInfo.newer) $('updPill').hidden=false; else lsSet(SEEN_KEY,String(APP_VERSION)); };
async function checkUpdate(first){
  const info=await fetchVer(); if(!info) return;
  if(info.v>APP_VERSION){ if(updShown<info.v){ updShown=info.v; showUpdate(info,true); } return; }
  if(first){ const raw=lsGet(SEEN_KEY); const seen=raw?+raw:0;
    if(!raw&&!hadPlayers){ lsSet(SEEN_KEY,String(APP_VERSION)); return; }
    if(seen<APP_VERSION) showUpdate(info,false,seen); }
}
const hadPlayers=prof.list.length>0;
setInterval(()=>{ if(!document.hidden) checkUpdate(false); },180000);
document.addEventListener('visibilitychange',()=>{ if(!document.hidden) checkUpdate(false); });

/* 學習冒險城．js/17-cloud.js
 * Supabase 雲端存檔：帳號、登入、同步、衝突處理
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ======================= Supabase 雲端存檔（帳號＋密碼） ======================= */
const CLOUD={url:'https://tsxbphngzuzpdddhadfw.supabase.co',key:'sb_publishable_EOXrx2SRQbFRHACqHbUUig_4e-EkgkE'};
const TOK_KEY=id=>'learning-town-cloud:'+id;
const CLOUD_ERR={bad_username:'帳號要 2～16 個字，不能有空白。',bad_password:'密碼要 4～64 個字。',taken:'這個帳號已經有人使用了，換一個吧。',bad_login:'帳號或密碼不對。',locked:'密碼錯太多次了，請 5 分鐘後再試。',too_large:'存檔太大，無法上傳。',full:'雲端帳號已經滿了，請告訴老師。',busy:'現在建立帳號的人太多，請稍後再試。',bad_session:'登入已經過期，請重新登入。',offline:'連不上雲端，請檢查網路。'};
async function rpc(fn,args){
  let r; try{ r=await fetch(`${CLOUD.url}/rest/v1/rpc/${fn}`,{method:'POST',headers:{'apikey':CLOUD.key,'Content-Type':'application/json'},body:JSON.stringify(args),keepalive:fn==='lt_save'&&JSON.stringify(args).length<60000}); }
  catch(e){ const er=new Error('offline'); er.code='offline'; throw er; }
  const t=await r.text(); let j=null; try{ j=t?JSON.parse(t):null; }catch(e){}
  if(!r.ok){ const code=(j&&j.message)||'offline'; const er=new Error(code); er.code=CLOUD_ERR[code]?code:'offline'; throw er; }
  if(j&&j.error){ const er=new Error(j.error); er.code=j.error; throw er; }
  return j;
}
const cloudMsg=e=>CLOUD_ERR[e&&e.code]||'發生錯誤，請稍後再試。';
function cloudTok(){ return curId?lsGet(TOK_KEY(curId)):null; }
function cloudPayload(){ const s=JSON.parse(JSON.stringify(save)); delete s.cloud; return s; }
let cloudState={dirty:false,busy:false,timer:null,last:0,err:''};
function cloudMark(){ if(!save.cloud||!cloudTok()) return; cloudState.dirty=true; clearTimeout(cloudState.timer); cloudState.timer=setTimeout(cloudPush,4000); cloudBadge(); }
async function cloudPush(force){
  const tok=cloudTok(); if(!tok||!save.cloud||(!cloudState.dirty&&!force)||cloudState.busy) return;
  cloudState.busy=true; const myId=curId;
  try{
    const r=await rpc('lt_save',{p_token:tok,p_save:cloudPayload(),p_rev:save.cloud.rev||null});
    if(myId!==curId) return;
    if(r&&r.conflict){ cloudState.busy=false; cloudConflict(r); return; }
    save.cloud.rev=r.rev; cloudState.dirty=false; cloudState.last=Date.now(); cloudState.err=''; lsSet(KEY+':'+curId,JSON.stringify(save));
  }catch(e){ cloudState.err=e.code||'offline'; if(e.code==='bad_session'){ lsDel(TOK_KEY(curId)); toast('雲端登入已過期，請到「說明」重新登入，才能繼續雲端存檔。'); } }
  finally{ cloudState.busy=false; cloudBadge(); }
}
setInterval(()=>{ if(cloudState.dirty) cloudPush(); },60000);
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&cloudState.dirty){ clearTimeout(cloudState.timer); cloudPush(); } });
addEventListener('pagehide',()=>{ if(cloudState.dirty) cloudPush(); });
function cloudBadge(){
  const el=$('hudCloud'); if(!el) return;
  if(!save.cloud){ el.textContent='☁ 未建立帳號'; el.className='cloud-chip warn'; return; }
  if(!cloudTok()){ el.textContent='☁ 需要重新登入'; el.className='cloud-chip warn'; return; }
  if(cloudState.err&&cloudState.dirty){ el.textContent='☁ 未同步'; el.className='cloud-chip warn'; return; }
  el.textContent=cloudState.dirty||cloudState.busy?'☁ 同步中…':'☁ 已存到雲端'; el.className='cloud-chip'+(cloudState.dirty?' busy':'');
}
/* 另一台裝置也玩過：讓玩家選要留哪一份 */
function cloudConflict(r){
  const cs=r.save||{}, units=x=>['math','chinese','english','science','social'].reduce((t,k)=>t+Object.keys((x[k]&&x[k].units)||{}).length,0);
  openPanel(panelShell('兩份進度不一樣','你在另一台裝置也玩過。要保留哪一份？',`
    <div class="card" style="grid-template-columns:1fr auto"><div><h3>雲端的進度</h3><p>${cs.coins||0} 金幣．挑戰過 ${units(cs)} 個單元</p></div><button type="button" class="act" id="cfCloud">用雲端的</button></div>
    <div class="card" style="grid-template-columns:1fr auto"><div><h3>這台裝置的進度</h3><p>${save.coins} 金幣．挑戰過 ${units(save)} 個單元</p></div><button type="button" class="act" id="cfLocal">用這台的</button></div>
    <p class="note">沒有選到的那一份會被取代。</p>`));
  const x=veil.querySelector('.x'); if(x) x.hidden=true; acctLock=true;
  $('cfCloud').onclick=()=>{ acctLock=false; const c=save.cloud; c.rev=r.rev; save=Object.assign(BLANK(),cs,{cloud:c}); fixSave(); persist(); cloudState.dirty=false; try{sessionStorage.setItem('learning-town-autopick',curId);}catch(e){} location.reload(); };
  $('cfLocal').onclick=()=>{ acctLock=false; save.cloud.rev=r.rev; cloudState.dirty=true; closePanel(); cloudPush(true); toast('已用這台裝置的進度覆蓋雲端'); };
}
/* 進入冒險者時：先和雲端對一下版本 */
async function cloudCheckOnEnter(){
  const tok=cloudTok(); if(!save.cloud||!tok) return;
  try{ const r=await rpc('lt_load',{p_token:tok});
    if(r.rev>(save.cloud.rev||0)){ const c=save.cloud; c.rev=r.rev; c.user=r.username||c.user; save=Object.assign(BLANK(),r.save||{},{cloud:c}); fixSave(); persist(); cloudState.dirty=false; try{sessionStorage.setItem('learning-town-autopick',curId);}catch(e){} toast('從雲端載入最新進度…'); setTimeout(()=>location.reload(),700); }
    else if(r.rev<(save.cloud.rev||0)){ cloudState.dirty=true; cloudPush(true); }
    cloudState.err=''; cloudBadge();
  }catch(e){ cloudState.err=e.code; if(e.code==='bad_session') lsDel(TOK_KEY(curId)); cloudBadge(); }
}
/* 建立帳號／登入的面板 */
let acctLock=false, acctAfter=null;
function openAccount(kind,after){
  acctAfter=after||null; const create=kind==='create';
  const body=`${create?`<p style="color:var(--parchment);line-height:1.6;margin:0 0 6px">建立帳號後，進度會自動存到雲端；換電腦、換平板，用帳號密碼登入就能接著玩。<b>請記住你的帳號和密碼</b>，也可以請爸爸媽媽幫你記下來。</p>`:'<p style="color:var(--parchment);margin:0 0 6px">輸入你之前建立的帳號和密碼。</p>'}
    <div class="card acct" style="grid-template-columns:1fr"><div>
      <label>帳號（2～16 個字，可以用中文、英文或數字）<input id="acU" maxlength="16" autocomplete="username" value="${create?esc(save.name||''):''}"></label>
      <label>密碼（至少 4 個字）<input id="acP" type="password" maxlength="64" autocomplete="${create?'new-password':'current-password'}"></label>
      ${create?'<label>再輸入一次密碼<input id="acP2" type="password" maxlength="64" autocomplete="new-password"></label>':''}
      <label class="showpw"><input type="checkbox" id="acShow"> 顯示密碼</label>
    </div></div>
    <p class="acct-msg" id="acMsg" role="alert"></p>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="act" id="acGo">${create?'建立帳號':'登入'}</button>${create?'<button type="button" class="act" id="acHave" style="background:var(--walnut-2)">我已經有帳號了</button>':''}<button type="button" class="act" id="acLater" style="background:#6b5a48" hidden>先不連線，下次再建立</button></div>`;
  openPanel(panelShell(create?'建立雲端帳號':'用帳號登入',create?`替「${esc(save.name)}」建立帳號和密碼`:'把雲端的進度下載到這台裝置',body));
  const x=veil.querySelector('.x'); if(create&&x) x.hidden=true; acctLock=create;
  $('acShow').onchange=e=>{ for(const id of ['acP','acP2']) if($(id)) $(id).type=e.target.checked?'text':'password'; };
  veil.querySelectorAll('.acct input').forEach(i=>i.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter') $('acGo').click(); }));
  if($('acHave')) $('acHave').onclick=()=>openLoginForCurrent();
  $('acLater').onclick=()=>{ acctLock=false; closePanel(); toast('下次進入時會再請你建立帳號'); if(acctAfter) acctAfter(); };
  $('acGo').onclick=async()=>{
    const u=$('acU').value.trim(), p=$('acP').value; const msg=$('acMsg'); msg.textContent='';
    if(u.length<2){ msg.textContent=CLOUD_ERR.bad_username; return; } if(p.length<4){ msg.textContent=CLOUD_ERR.bad_password; return; } if(create&&p!==$('acP2').value){ msg.textContent='兩次輸入的密碼不一樣。'; return; }
    $('acGo').disabled=true; msg.textContent='連線中…';
    try{
      if(create){ persist(); const r=await rpc('lt_register',{p_user:u,p_pass:p,p_save:cloudPayload()});
        lsSet(TOK_KEY(curId),r.token); save.cloud={user:r.username,rev:r.rev}; persist(); cloudState.dirty=false; cloudState.err='';
        acctLock=false; closePanel(); cloudBadge(); toast(`帳號「${r.username}」建立完成，進度已存到雲端！`); sfx('ach'); if(acctAfter) acctAfter(); }
    }catch(e){ msg.textContent=cloudMsg(e); $('acGo').disabled=false; if(e.code==='offline'&&create) $('acLater').hidden=false; }
  };
  setTimeout(()=>{ const i=$(create?'acP':'acU'); if(i) i.focus(); },100);
}
/* 這位冒險者已經在別處有帳號：登入後選要用哪一份 */
function openLoginForCurrent(){ openLogin(async r=>{
  const id=curId; lsSet(TOK_KEY(id),r.token); save.cloud={user:r.username,rev:r.rev}; persist();
  cloudConflict({rev:r.rev,save:r.save}); }); }
/* 選擇畫面的「用帳號登入」：建立或更新一位本機冒險者 */
function openLogin(onOk){
  const inPick=mode==='pick'; if(inPick){ $('picker').hidden=true; mode='ui'; }
  openAccount('login');
  const x=veil.querySelector('.x'); if(x){ x.hidden=false; x.onclick=()=>{ closePanel(); if(inPick) openPicker(); }; }
  $('acGo').onclick=async()=>{
    const u=$('acU').value.trim(), p=$('acP').value, msg=$('acMsg'); $('acGo').disabled=true; msg.textContent='連線中…';
    try{ const r=await rpc('lt_login',{p_user:u,p_pass:p});
      if(onOk){ await onOk(r); return; }
      let id=prof.list.map(x=>x.id).find(id=>{ try{ const s=JSON.parse(lsGet(KEY+':'+id)); return s&&s.cloud&&String(s.cloud.user).toLowerCase()===String(r.username).toLowerCase(); }catch(e){ return false; } });
      if(!id){ if(prof.list.length>=40){ msg.textContent='這台裝置的冒險者已經滿 40 位了。'; $('acGo').disabled=false; return; } id='p'+Date.now().toString(36)+Math.random().toString(36).slice(2,5); }
      const s=Object.assign(r.save||{},{cloud:{user:r.username,rev:r.rev}}); if(!s.created){ msg.textContent='這個帳號還沒有存檔。'; $('acGo').disabled=false; return; }
      if(id===curId){ save=Object.assign(BLANK(),s); fixSave(); } lsSet(KEY+':'+id,JSON.stringify(s)); lsSet(TOK_KEY(id),r.token); const meta=profMeta(id,s); const k=prof.list.findIndex(x=>x.id===id); if(k>=0) prof.list[k]=meta; else prof.list.push(meta); lsSet(PKEY,JSON.stringify(prof));
      try{sessionStorage.setItem('learning-town-autopick',id);}catch(e){} toast(`歡迎回來，${s.name}！`); setTimeout(()=>location.reload(),600);
    }catch(e){ msg.textContent=cloudMsg(e); $('acGo').disabled=false; }
  };
}
function openChangePw(){
  openPanel(panelShell('變更密碼',`帳號：${esc(save.cloud.user)}`,`<div class="card acct" style="grid-template-columns:1fr"><div>
    <label>舊密碼<input id="cpO" type="password" maxlength="64"></label><label>新密碼（至少 4 個字）<input id="cpN" type="password" maxlength="64"></label><label>再輸入一次新密碼<input id="cpN2" type="password" maxlength="64"></label></div></div>
    <p class="acct-msg" id="cpMsg"></p><button type="button" class="act" id="cpGo">變更密碼</button>`));
  veil.querySelectorAll('.acct input').forEach(i=>i.addEventListener('keydown',e=>e.stopPropagation()));
  $('cpGo').onclick=async()=>{ const m=$('cpMsg'); if($('cpN').value!==$('cpN2').value){ m.textContent='兩次輸入的新密碼不一樣。'; return; }
    try{ await rpc('lt_change_password',{p_token:cloudTok(),p_old:$('cpO').value,p_new:$('cpN').value}); closePanel(); toast('密碼已經變更'); }catch(e){ m.textContent=cloudMsg(e); } };
}
function cloudInfoCard(){
  if(!save.cloud) return `<div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:#2f5ea8">雲</div><div><h3>雲端存檔</h3><p>還沒有建立帳號，進度只存在這台裝置。</p><button type="button" class="act" data-cloud="create" style="margin-top:6px">建立帳號</button></div></div>`;
  const ok=!!cloudTok();
  return `<div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:#2f5ea8">雲</div><div><h3>雲端存檔</h3><p>帳號：<b>${esc(save.cloud.user)}</b>．${ok?(cloudState.dirty?'有進度還沒上傳':'進度已存到雲端')+(cloudState.last?`（${new Date(cloudState.last).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})}）`:''):'登入已過期，請重新登入'}。在別的裝置上，到選擇冒險者畫面按「用帳號登入」就能接著玩。</p><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${ok?'<button type="button" class="act" data-cloud="sync">立即同步</button><button type="button" class="act" data-cloud="pw">變更密碼</button>':'<button type="button" class="act" data-cloud="relogin">重新登入</button>'}</div></div></div>`;
}
document.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('[data-cloud]'); if(!b) return; const k=b.dataset.cloud;
  if(k==='create') openAccount('create'); else if(k==='pw') openChangePw(); else if(k==='relogin') openLoginForCurrent();
  else if(k==='sync'){ cloudState.dirty=true; cloudPush(true).then(()=>{ toast(cloudState.err?cloudMsg({code:cloudState.err}):'已同步到雲端'); }); } });
/* 從舊網址搬家：網址 #import=LTB1:... 帶來的存檔 */
async function importFromHash(){
  const h=location.hash||''; if(!h.startsWith('#import=')) return false;
  try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){}
  try{ const obj=await readBackup(decodeURIComponent(h.slice(8))); let n=0; for(const it of obj.list){ const id=restoreOne(it,false); if(id) n++; }
    setTimeout(()=>toast(`搬家完成！帶過來 ${n} 位冒險者。進入後請建立帳號和密碼。`),800); return n>0;
  }catch(e){ setTimeout(()=>toast('搬家資料讀取失敗：'+(e.message||'')),800); return false; }
}

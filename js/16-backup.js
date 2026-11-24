/* 學習冒險城．js/16-backup.js
 * 存檔備份與還原
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ---------- 存檔備份與還原 ---------- */
const BK_PREFIX='LTB1:';
async function packText(str){
  const bytes=new TextEncoder().encode(str);
  try{ if(window.CompressionStream){ const cs=new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw')); const buf=new Uint8Array(await new Response(cs).arrayBuffer()); return 'z'+b64(buf); } }catch(e){}
  return 'p'+b64(bytes);
}
async function unpackText(code){
  const kind=code[0], bytes=unb64(code.slice(1));
  if(kind==='z'){ const ds=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')); return new TextDecoder().decode(await new Response(ds).arrayBuffer()); }
  return new TextDecoder().decode(bytes);
}
function b64(u8){ let s=''; for(let i=0;i<u8.length;i+=0x8000) s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000)); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function unb64(t){ t=t.replace(/[\s]/g,'').replace(/-/g,'+').replace(/_/g,'/'); while(t.length%4) t+='='; const s=atob(t); const u=new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i]=s.charCodeAt(i); return u; }
async function makeBackup(ids){
  const list=ids.map(id=>{ const raw=lsGet(KEY+':'+id); return raw?{id,save:JSON.parse(raw)}:null; }).filter(Boolean);
  const obj={app:'learning-town',v:APP_VERSION,at:Date.now(),list};
  return BK_PREFIX+await packText(JSON.stringify(obj));
}
async function readBackup(text){
  text=String(text||'').trim(); const i=text.indexOf(BK_PREFIX); if(i<0) throw new Error('這不是學習冒險城的備份');
  const obj=JSON.parse(await unpackText(text.slice(i+BK_PREFIX.length).split(/\s/)[0]));
  if(!obj||obj.app!=='learning-town'||!Array.isArray(obj.list)) throw new Error('備份內容看不懂');
  return obj;
}
function restoreOne(item,asNew){
  const s=item.save; if(!s||!s.created) return null;
  let id=item.id; if(asNew||!/^p[a-z0-9]+$/.test(id)) id='p'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  if(!prof.list.some(p=>p.id===id)&&prof.list.length>=40) return null;
  lsSet(KEY+':'+id,JSON.stringify(s)); const meta=profMeta(id,s);
  const k=prof.list.findIndex(p=>p.id===id); if(k>=0) prof.list[k]=meta; else prof.list.push(meta);
  lsSet(PKEY,JSON.stringify(prof)); return id;
}
async function bkDownload(code,name){
  try{ const D=window.claude&&window.claude.use?await window.claude.use('downloads'):null;
    if(D){ try{ await D.save({filename:name,data:code}); toast('備份檔已儲存'); }catch(e){ toast(e&&e.code==='declined'?'已取消下載':'這裡無法下載檔案，請改用「複製備份代碼」'); } return; } }catch(e){}
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([code],{type:'text/plain'})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
}
function fmtDate(t){ const d=new Date(t); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
let bkState=null;
function openBackup(){
  bkState={step:'menu'}; let box=$('bkBox'); if(!box){ box=document.createElement('div'); box.id='bkBox'; box.className='veil bkbox'; document.body.appendChild(box); }
  box.hidden=false; renderBackup();
}
function closeBackup(){ const b=$('bkBox'); if(b){b.hidden=true;b.innerHTML='';} bkState=null; if(mode==='pick') renderPicker(); }
function renderBackup(){
  const box=$('bkBox'), st=bkState; const L=prof.list.slice().sort((a,b)=>(b.last||0)-(a.last||0));
  let body='';
  if(st.step==='menu'){
    body=`<p>進度只存在這台裝置的瀏覽器裡。電腦還原、清除瀏覽紀錄或換裝置時，進度就會不見，記得定期備份！</p>
      <h3>備份</h3><div class="bk-list">${L.length?L.map(p=>`<button type="button" class="act" data-bk="${p.id}">${esc(p.name)}</button>`).join(''):'<p class="note">這台裝置還沒有冒險者。</p>'}${L.length>1?'<button type="button" class="act ghost" data-bkall="1" style="color:var(--parchment)">全部冒險者一起備份（老師用）</button>':''}</div>
      <h3>還原</h3><p class="note">選擇備份檔，或把備份代碼貼在下面。</p>
      <input type="file" id="bkFile" accept=".txt,text/plain">
      <textarea id="bkCode" rows="3" placeholder="貼上以 LTB1: 開頭的備份代碼"></textarea>
      <button type="button" class="act" id="bkRead">讀取備份</button><p class="note" id="bkMsg"></p>`;
  } else if(st.step==='made'){
    body=`<p>已經做好「<b>${esc(st.label)}</b>」的備份。</p>
      <div class="bk-list"><button type="button" class="act" id="bkDl">下載備份檔</button><button type="button" class="act" id="bkCopy">複製備份代碼</button></div>
      <p class="note">備份檔可以存到雲端硬碟、上傳到班級的作業區，或用 Email 寄給自己。換到其他裝置時，打開遊戲，按「備份／還原」，選擇這個檔案就能還原。</p>
      <textarea readonly rows="3" id="bkOut">${esc(st.code)}</textarea><p class="note">代碼長度 ${st.code.length} 字。</p>
      <button type="button" class="act ghost" id="bkBack" style="color:var(--parchment)">返回</button>`;
  } else if(st.step==='confirm'){
    body=`<p>這份備份是 ${fmtDate(st.obj.at)} 做的，裡面有 ${st.obj.list.length} 位冒險者：</p>
      <div class="bk-list" style="flex-direction:column;align-items:stretch">${st.obj.list.map((it,k)=>{const s=it.save||{};const same=prof.list.find(p=>p.id===it.id);return `<div class="bk-item"><b>${esc(s.name||'冒險者')}</b><small>${LEVELS[lvOf(s)].name}．${s.coins||0} 金幣${same?`．這台裝置已有同一位冒險者（${fmtDay(same.last)}玩過）`:''}</small><div class="bk-list">${same?`<button type="button" class="act" data-rs="${k}" data-new="0">覆蓋成備份的進度</button><button type="button" class="act ghost" data-rs="${k}" data-new="1" style="color:var(--parchment)">另存成新的冒險者</button>`:`<button type="button" class="act" data-rs="${k}" data-new="0">還原</button>`}</div></div>`;}).join('')}</div>
      ${st.obj.list.length>1?'<button type="button" class="act" id="bkAllRs">全部還原（同名的會覆蓋）</button>':''}
      <p class="note" id="bkMsg"></p><button type="button" class="act ghost" id="bkBack" style="color:var(--parchment)">返回</button>`;
  }
  box.innerHTML=panelShell('備份／還原進度','把進度存成一個檔案，換裝置也能接著玩。',body);
  box.querySelector('.x').onclick=closeBackup; const back=$('bkBack'); if(back) back.onclick=()=>{bkState={step:'menu'};renderBackup();};
  box.querySelectorAll('[data-bk]').forEach(b=>b.onclick=async()=>{ if(curId===b.dataset.bk) persist(); const p=prof.list.find(x=>x.id===b.dataset.bk); const code=await makeBackup([b.dataset.bk]); markBackup([b.dataset.bk]); bkState={step:'made',code,label:p.name,file:`學習冒險城備份-${p.name}-${fmtDate(Date.now())}.txt`}; renderBackup(); });
  box.querySelectorAll('[data-bkall]').forEach(b=>b.onclick=async()=>{ if(curId) persist(); const ids=prof.list.map(p=>p.id); const code=await makeBackup(ids); markBackup(ids); bkState={step:'made',code,label:`全部 ${ids.length} 位冒險者`,file:`學習冒險城備份-全部-${fmtDate(Date.now())}.txt`}; renderBackup(); });
  if($('bkDl')) $('bkDl').onclick=()=>bkDownload(st.code,st.file);
  if($('bkCopy')) $('bkCopy').onclick=async()=>{ try{await navigator.clipboard.writeText(st.code);toast('已複製備份代碼');}catch(e){const t=$('bkOut');t.select();document.execCommand('copy');toast('已複製備份代碼');} };
  if($('bkFile')) $('bkFile').onchange=e=>{const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{$('bkCode').value=r.result; $('bkRead').click();}; r.readAsText(f);};
  if($('bkRead')) $('bkRead').onclick=async()=>{ try{ const obj=await readBackup($('bkCode').value); bkState={step:'confirm',obj}; renderBackup(); }catch(e){ $('bkMsg').textContent='讀取失敗：'+(e.message||'代碼不完整'); } };
  box.querySelectorAll('[data-rs]').forEach(b=>b.onclick=()=>{ const it=st.obj.list[+b.dataset.rs]; const id=restoreOne(it,b.dataset.new==='1');
    if(!id){ $('bkMsg').textContent='還原失敗：這台裝置最多 40 位冒險者。'; return; }
    if(curId===id){ toast('已還原，重新載入中…'); try{sessionStorage.setItem('learning-town-autopick',id);}catch(e){} setTimeout(()=>location.reload(),600); return; }
    b.closest('.bk-item').innerHTML=`<b>${esc(it.save.name)}</b><small style="color:#8fe08a">已還原完成</small>`; });
  if($('bkAllRs')) $('bkAllRs').onclick=()=>{ let n=0; for(const it of st.obj.list) if(restoreOne(it,false)) n++; $('bkMsg').textContent=`已還原 ${n} 位冒險者。`; if(curId&&st.obj.list.some(it=>it.id===curId)){ try{sessionStorage.setItem('learning-town-autopick',curId);}catch(e){} setTimeout(()=>location.reload(),800);} };
}
function markBackup(ids){ const t=Date.now(); for(const id of ids){ if(id===curId){ save.lastBackup=t; persist(); continue; } try{ const s=JSON.parse(lsGet(KEY+':'+id)); s.lastBackup=t; lsSet(KEY+':'+id,JSON.stringify(s)); }catch(e){} } }

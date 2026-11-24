/* 學習冒險城．js/02-save.js
 * 存檔：多位冒險者、學習階段切換、存檔修正、金幣收支、學習紀錄（錯題本、答題統計）
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ======================= SAVE ======================= */
const KEY='learning-town-medieval-v1', PKEY='learning-town-profiles-v1';
const today=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();};
const BLANK=()=>({name:'',look:{cls:'Knight',hat:true,cape:'red',main:'1H_Sword',off:'Round_Shield',fx:'none'},coins:100,inv:{},quests:{},ach:{},title:'',talked:{},visited:{},lastWish:'',created:false,math:{units:{}}});
let save=BLANK(), curId=null, prof={list:[],cur:null};
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);return true;}catch(e){return false;}}
function lsDel(k){try{localStorage.removeItem(k);}catch(e){}}
function profMeta(id,s){ let done=0; for(const k of ['math','chinese','english','science','social']){ const u=s[k]&&s[k].units; if(u) for(const x of Object.values(u)) if(x&&x.cleared&&x.cleared[5]) done++; }
  const lk=s.look||{}; return {id,lv:lvOf(s),name:s.name||'冒險者',cls:lk.cls||'Knight',cape:lk.cape||'red',title:s.title||'',coins:s.coins||0,done,last:Date.now()}; }
try{ const P=JSON.parse(lsGet(PKEY)||'null'); if(P&&Array.isArray(P.list)) prof=P; }catch(e){}
(()=>{ const old=lsGet(KEY); if(!old) return; // 舊版只有一個存檔：搬成第一位冒險者
  try{ const s=JSON.parse(old); if(s&&s.created){ const id='p'+Date.now().toString(36); if(lsSet(KEY+':'+id,old)){ prof.list.push(profMeta(id,s)); prof.cur=id; lsSet(PKEY,JSON.stringify(prof)); lsDel(KEY); } } else lsDel(KEY); }catch(e){} })();
prof.list=prof.list.filter(p=>p&&p.id&&lsGet(KEY+':'+p.id));
/* 學習階段：國小（es）／國中（jh）。目前階段的進度放在 save 最上層，另一個階段的進度收在 save.lvStore[階段] */
const LV_FIELDS=['math','chinese','english','science','social','quests','watched','wrong','stats','practice'];
function lvOf(s){ return s&&s.level==='jh'?'jh':'es'; }
function setLevel(lv){
  const old=lvOf(save); if(old===lv) return;
  save.lvStore=save.lvStore||{}; const keep={};
  for(const f of LV_FIELDS){ if(save[f]!==undefined) keep[f]=save[f]; delete save[f]; }
  save.lvStore[old]=keep; const back=save.lvStore[lv]||{};
  for(const f of LV_FIELDS) if(back[f]!==undefined) save[f]=back[f];
  delete save.lvStore[lv]; save.level=lv; fixSave();
}
function fixSave(){
  if(!save.quests) save.quests={};
  if(!save.math) save.math={units:{}};
  if(save.math.cleared){save.math.units=save.math.units||{};save.math.units[1]={cleared:save.math.cleared,chest:save.math.chest||0};delete save.math.cleared;delete save.math.chest;}
  if(!save.math.units) save.math.units={};
  if(save.look&&save.created&&!save.look.hero){ save.look.hero=heroFromLook(save.look); grantHero(save.look.hero); const c=CAPES.find(x=>x.id===save.look.cape); if(!c||!c.shop) save.look.cape='none'; }
  if(save.watched) for(const k of Object.keys(save.watched)) if(/^\d+$/.test(k)){ save.watched['math-'+k]=1; delete save.watched[k]; }
}
function loadProfile(id){ save=BLANK(); curId=id||null; if(id){ try{ const s=JSON.parse(lsGet(KEY+':'+id)||'null'); if(s) save=Object.assign(save,s); }catch(e){} } fixSave(); if(id) migratePets(); applyLevel(); }
function persist(){
  if(!curId){ if(!save.created) return; curId='p'+Date.now().toString(36)+Math.random().toString(36).slice(2,5); }
  lsSet(KEY+':'+curId,JSON.stringify(save));
  const m=profMeta(curId,save); const i=prof.list.findIndex(p=>p.id===curId); if(i>=0) prof.list[i]=m; else prof.list.push(m); prof.cur=curId; lsSet(PKEY,JSON.stringify(prof));
  try{ cloudMark(); }catch(e){}
}

/* ======================= 備份、休息提醒、主題週、練習新題型、城鎮動物 ======================= */
/* ---------- 金幣收支紀錄（給老師觀察經濟平衡） ---------- */
function addCoins(n,src){ n=Math.round(n)||0; save.coins+=n; const L=save.coinLog=save.coinLog||{}; L[src]=(L[src]||0)+n; }
function spendCoins(n,src){ save.coins-=n; const L=save.coinLog=save.coinLog||{}; L['-'+src]=(L['-'+src]||0)+n; }
const COIN_SRC={battle:'闖關',chest:'寶箱',quest:'委託',video:'看影片',daily:'每日挑戰',wish:'許願井',week:'主題週','-shop':'商店','-pet':'領養寵物','-wander':'流浪商人','-job':'轉職'};
function coinLogHtml(){
  const L=save.coinLog||{}; const inc=Object.entries(L).filter(([k])=>!k.startsWith('-')), out=Object.entries(L).filter(([k])=>k.startsWith('-'));
  if(!inc.length&&!out.length) return '';
  const sum=a=>a.reduce((t,[,v])=>t+v,0);
  return `<div class="scroll" style="font-size:15px"><b>金幣收支</b>（第 28 版開始記錄）<br>收入 ${sum(inc)}：${inc.sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${COIN_SRC[k]||k} ${v}`).join('、')||'無'}<br>支出 ${sum(out)}：${out.sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${COIN_SRC[k]||k} ${v}`).join('、')||'無'}</div>`;
}

/* ======================= 學習紀錄（錯題本、學習報告共用） ======================= */
function dayIdx(d){ d=d||new Date(); return Math.round(new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime()/864e5); }
function stripTags(h){ const d=document.createElement('div'); d.innerHTML=h; return d.textContent.trim(); }
function qAt(sub,u,si,qi){ const D=SUBJ_DATA[sub]; const U=D&&D.units[u-1]; const q=U&&U.q[si]&&U.q[si][qi]; return q?{sub,u,si,qi,q,U}:null; }
let gradNote=0;
function recordAnswer(sub,u,si,qi,q,ok){
  if(qi===undefined||qi===null||!q) return;
  save.stats=save.stats||{}; const S=save.stats[sub]=save.stats[sub]||{}; const k=u+'-'+si; const e=S[k]=S[k]||[0,0]; e[0]++; if(ok) e[1]++;
  save.wrong=save.wrong||{}; const key=`${sub}-${u}-${si}-${qi}`; const w=save.wrong[key];
  if(!ok) save.wrong[key]={c:0,n:(w?w.n:0)+1,h:q.q.slice(0,12)};
  else if(w){ w.c=(w.c||0)+1; if(w.c>=2){ delete save.wrong[key]; save.grad=(save.grad||0)+1; gradNote++; } }
  persist();
}
function wrongList(sub){
  save.wrong=save.wrong||{}; const out=[];
  for(const [key,w] of Object.entries(save.wrong)){ const [s,u,si,qi]=key.split('-'); const it=qAt(s,+u,+si,+qi);
    if(!it||it.q.q.slice(0,12)!==w.h){ delete save.wrong[key]; continue; } if(sub&&s!==sub) continue; out.push(Object.assign(it,{w})); }
  return out;
}
function unitShort(U){ return U.title.replace(/^第.單元\s*/,''); }

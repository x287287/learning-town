/* 學習冒險城．js/23-job.js
 * 職業導師（轉職）
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

function clsIs(k){ return !!(save&&save.look&&save.look.cls===k); }

/* ---------- 職業導師（轉職） ---------- */
function openJob(){
  const cur=save.look.cls;
  const cards=Object.entries(CLASSES).map(([k,c])=>{ const T=CLS_TRAIT[k]; const me=k===cur;
    return `<div class="card"><div class="glyph" style="background:${T.color}">${T.glyph}</div><div style="min-width:0"><h3>${c.label}<span style="font-size:13px;color:#6b4c2c;margin-left:6px">${T.name}</span></h3><p>${T.desc}</p></div>${me?'<button class="act" type="button" disabled>目前職業</button>':`<button class="act" type="button" data-job="${k}" ${save.coins<JOB_PRICE?'disabled':''}>轉職</button>`}</div>`; }).join('');
  openPanel(panelShell('職業導師．轉職',`你現在是${CLASSES[cur].label}，有 ${save.coins} 金幣。轉職一次要 ${JOB_PRICE} 金幣${save.coins<JOB_PRICE?'，金幣還不夠，先去闖關存金幣吧':''}。`,cards));
  veil.querySelectorAll('[data-job]').forEach(b=>b.onclick=()=>jobStep(b.dataset.job));
}
function jobStep(k){
  const C=CLASSES[k], T=CLS_TRAIT[k];
  openPanel(panelShell(`轉職成為${C.label}？`,`職業特性．${T.name}`,`<div class="scroll">${T.desc}<br><br>轉職要花 <b>${JOB_PRICE} 金幣</b>（你有 ${save.coins} 金幣）。轉職後會換上${C.label}的服裝和武器（這套服裝送給你，之後也能在裁縫屋穿），臉和頭髮不會變。<br>金幣、背包、寵物和學習進度都不會改變。</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="act" type="button" id="jobYes">花 ${JOB_PRICE} 金幣轉職</button><button class="act ghost" type="button" id="jobNo" style="color:var(--parchment)">再想想</button></div>`));
  $('jobNo').onclick=()=>openJob();
  $('jobYes').onclick=()=>doJob(k);
}
function doJob(k){
  const C=CLASSES[k]; if(!C||save.look.cls===k) return false;
  if(save.coins<JOB_PRICE){ toast('金幣不夠喔'); return false; }
  spendCoins(JOB_PRICE,'job');
  const L=save.look; L.cls=k; L.main=C.main[0]; L.off=C.off[0]||'none'; L.hat=!!C.hat;
  const P=heroPreset(k); L.hero=L.hero||heroFromLook(L); for(const sl of OUTFIT_SLOTS) L.hero[sl]=P[sl]; grantHero(HERO_PRESET[k]);
  save.jobs=(save.jobs||0)+1; let achMsg='';
  if(!save.ach.job){ save.ach.job=1; achMsg='<br>達成成就「新的旅程」！'; }
  persist(); rebuildPlayer(); rebuildPet(); hud(); checkAch(); sfx('ach');
  if(player.ch&&player.ch.actions.cheer) oneShot(player.ch,'cheer','idle',1600);
  openPanel(panelShell('轉職成功！',`你現在是${C.label}了。`,`<div class="scroll"><b>職業特性．${CLS_TRAIT[k].name}</b>：${CLS_TRAIT[k].desc}${achMsg}<br><br>${C.label}的服裝和武器已經放進你的衣櫃，想重新搭配可以到裁縫屋找莉莉。</div><button class="act" type="button" id="jobOk" style="align-self:flex-start">好！</button>`));
  $('jobOk').onclick=()=>closePanel(); return true;
}

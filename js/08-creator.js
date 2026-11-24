/* 學習冒險城．js/08-creator.js
 * 創角與裁縫屋（角色編輯器介面、試穿與購買）
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ======================= CREATOR ======================= */
let draft=null, editing=false;
function owned(id){return !id||!!save.inv[id];}
let hTab='hair';
function hOk(k,v){ if(heroOwned(k,v)) return true; if(!editing){ const P=HERO_PRESET[draft.cls]||{}; return P[k]===v; } return false; }
function heroUnowned(){ const out=[]; if(!draft||!draft.hero) return out; for(const [k] of HERO_SLOTS){ if(k==='dye'||k==='fx'||k==='skin') continue; const v=draft.hero[k]; if(v&&!hOk(k,v)) out.push([k,v,heroPrice(k,v)]); } return out; }
function renderCreator(){
  const L=draft, H=L.hero;
  $('cClass').innerHTML=Object.entries(CLASSES).map(([k,c])=>`<button type="button" class="ch ${editing&&L.cls!==k?'lock':''}" data-cls="${k}" aria-pressed="${L.cls===k}">${c.label}</button>`).join('');
  const T=CLS_TRAIT[L.cls]; $('cClsNote').innerHTML=`<b>職業特性．${T.name}</b>：${T.desc}${editing?'<br>想換職業，要到榮譽殿堂找職業導師葛雷。':'<br>選職業會先換上那個職業的服裝。之後想換職業，可以到榮譽殿堂找職業導師（要花金幣）。'}`;
  $('hTabs').innerHTML=HERO_SLOTS.map(([k,t])=>`<button type="button" class="ch" data-htab="${k}" aria-pressed="${hTab===k}">${t}</button>`).join('');
  const lockNote=editing?'有「金幣」標示的造型還沒擁有，可以先點來試穿，喜歡再買。':'有「金幣」標示的造型要用金幣買，進城後到裁縫屋就能試穿和購買。';
  let html='', note='';
  if(hTab==='skin'||hTab==='color'){
    const list=hTab==='skin'?SKIN_COLORS:HAIR_COLORS;
    html=list.map(([n,c])=>{const ok=hOk(hTab,c); return `<button type="button" class="sw ${ok?'':'lock'}" data-hset="${c}" aria-pressed="${H[hTab]===c}" aria-label="${n}${ok?'':'（'+heroPrice(hTab,c)+' 金幣）'}" title="${n}${ok?'':'：'+heroPrice(hTab,c)+' 金幣'}" style="background:${c}"></button>`;}).join('');
    note=hTab==='skin'?'臉、耳朵和露出來的手會一起換色。膚色都不用錢。':'頭髮、眉毛、鬍子和髮飾會一起換色。基本髮色免費，其他每種 30 金幣。'+(editing?'':' '+lockNote);
  } else if(hTab==='dye'){
    html=CAPES.map(c=>{const ok=owned(c.shop); return c.color?`<button type="button" class="sw ${ok?'':'lock'}" data-cape="${c.id}" aria-pressed="${L.cape===c.id}" aria-label="${c.label}色披風${ok?'':'（未解鎖）'}" title="${c.label}${ok?'':'：'+lockHint(c.shop)}" style="background:${c.color}"></button>`
      :`<button type="button" class="ch" data-cape="none" aria-pressed="${L.cape==='none'}">原本的顏色</button>`;}).join('');
    note=H.cape?'把披風染成另一種顏色。染料在市集和流浪商人那裡買。':'現在沒有穿披風，先到「披風」挑一件。';
  } else if(hTab==='fx'){
    html=FX.map(f=>{const ok=owned(f.shop);return `<button type="button" class="ch ${ok?'':'lock'}" data-fx="${f.id}" aria-pressed="${L.fx===f.id}" title="${ok?'':lockHint(f.shop)}">${f.label}${ok?'':lockTag(f.shop)}</button>`;}).join('');
    note='特效在鐵匠鋪購買，或從魔王寶箱開出來。';
  } else {
    const S=HERO_SLOTS.find(x=>x[0]===hTab);
    if(S[3]) html+=`<button type="button" class="ch" data-hset="" aria-pressed="${!H[hTab]}">${S[3]}</button>`;
    html+=Object.keys(HERO_PARTS[hTab]||{}).map(lab=>{const ok=hOk(hTab,lab); return `<button type="button" class="ch ${ok?'':'lock'}" data-hset="${lab}" aria-pressed="${H[hTab]===lab}">${lab}${ok?'':`<small>${heroPrice(hTab,lab)} 金幣</small>`}</button>`;}).join('');
    note=(hTab==='hat'&&H.hat?(HIDE_ALL.includes(H.hat)?'這頂帽子會把頭髮整個蓋住。':'刺刺短髮和包包頭戴帽子時會收進帽子裡。')+' ':'')+lockNote;
  }
  $('hOpts').innerHTML=html; $('hNote').textContent=note; renderBuy();
}
function renderBuy(){
  const u=editing?heroUnowned():[], box=$('hBuy'); box.hidden=!u.length; if(!u.length){ box.innerHTML=''; return; }
  const tot=u.reduce((a,x)=>a+x[2],0), nm=x=>x[0]==='color'?(HAIR_COLORS.find(c=>c[1]===x[1])||['髮色'])[0]+'髮色':x[1];
  box.innerHTML=`<p>試穿中：${u.map(x=>`${esc(nm(x))}（${x[2]}）`).join('、')}<br>共 <b>${tot}</b> 金幣，你有 ${save.coins} 金幣。</p><div class="row"><button type="button" class="act" id="hBuyBtn" ${save.coins<tot?'disabled':''}>全部買下</button><button type="button" class="act ghost" id="hUndo" style="color:var(--parchment)">換回原本的</button></div>`;
  $('hBuyBtn').onclick=()=>{ if(save.coins<tot){toast('金幣不夠喔');return;} spendCoins(tot,'shop'); save.wardrobe=save.wardrobe||{}; u.forEach(([k,v])=>{save.wardrobe[heroKey(k,v)]=1;});
    if(!save.ach.buy){save.ach.buy=1;toast('達成成就「精打細算」！');} else toast('買好了！'); persist(); hud(); sfx('coin'); renderCreator(); };
  $('hUndo').onclick=()=>{ const orig=(save.look.hero)||heroFromLook(save.look); u.forEach(([k])=>{ draft.hero[k]=heroOwned(k,orig[k])?orig[k]:null; }); renderCreator(); previewDraft(); };
}
$('cForm').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return; const d=b.dataset;
  if(d.lv){ draftLv=d.lv==='jh'?'jh':'es'; renderLv(); return; }
  if(d.htab){ hTab=d.htab; renderCreator(); return; }
  if(d.hset!==undefined){ const v=d.hset===''?null:d.hset;
    if(!editing&&!hOk(hTab,v)){ toast(`這個造型要 ${heroPrice(hTab,v)} 金幣，進城後到裁縫屋就能買`); return; }
    if(HERO_SLOTS.find(x=>x[0]===hTab&&x[2])&&!v) return;
    draft.hero[hTab]=v; renderCreator(); previewDraft(); return; }
  if(d.cls&&editing&&d.cls!==draft.cls){ toast(`想換職業，請到榮譽殿堂找職業導師葛雷（${JOB_PRICE} 金幣）`); return; }
  if(d.cls){draft.cls=d.cls;const C=CLASSES[d.cls];draft.main=C.main[0];draft.off=C.off[0]||'none';draft.hat=true; const sk=draft.hero&&draft.hero.skin; draft.hero=heroPreset(d.cls); if(sk) draft.hero.skin=sk;}
  else if(d.hat!==undefined) draft.hat=d.hat==='true';
  else if(d.cape){const c=CAPES.find(x=>x.id===d.cape); if(!owned(c.shop)){toast(lockHint(c.shop));return;} draft.cape=d.cape;}
  else if(d.main) draft.main=d.main;
  else if(d.off) draft.off=d.off;
  else if(d.fx){const f=FX.find(x=>x.id===d.fx); if(!owned(f.shop)){toast(lockHint(f.shop));return;} draft.fx=d.fx;}
  else return;
  renderCreator(); previewDraft();
});
let preview=null;
function previewDraft(){
  if(preview) scene.remove(preview.holder);
  preview=buildCharacter(draft); scene.add(preview.holder); playOn(preview,'idle');
  preview.holder.position.copy(previewSpot()); preview.holder.rotation.y=0;
  if(preview.actions.cheer) setTimeout(()=>preview&&oneShot(preview,'cheer','idle',1500),50);
}
function previewSpot(){return editing?new THREE.Vector3(-22,0,22):new THREE.Vector3(0,0,24);}
let draftLv='es';
function renderLv(){
  $('cLv').innerHTML=Object.values(LEVELS).map(L=>`<button type="button" class="ch" data-lv="${L.id}" aria-pressed="${draftLv===L.id}">${L.full}</button>`).join('');
  $('cLvNote').textContent=LEVELS[draftLv].desc+'。之後也可以在「說明」裡修改。';
}
function openCreator(edit){
  editing=!!edit; if(talk){clearInterval(typeT);$('dialog').hidden=true;talk.n.talking=false;talk=null;}
  draft=JSON.parse(JSON.stringify(save.look)); if(!draft.hero) draft.hero=edit?heroFromLook(draft):heroPreset(draft.cls); if(!edit&&!save.created) draft.cape='none'; hTab='hair'; mode='create'; stopMove(); cam.yaw=0;
  $('nameInput').value=save.name||''; $('cTitle').textContent=edit?'裁縫屋':'學習冒險城';
  $('cLead').textContent=edit?'莉莉幫你重新搭配造型。':'打造你的冒險者，進城接受委託、學習知識，成為王國的英雄。';
  $('goBtn').textContent=edit?'完成換裝':'進城冒險！'; $('loadbar').hidden=true;
  $('creator').hidden=false; for(const id of ['hudPlayer','hudBtns','minimap','where','help','stick','actBtn','prompt']) $(id).hidden=true;
  if(player.ch) player.ch.holder.visible=false;
  draftLv=lvOf(save); $('lvRow').hidden=!!edit; renderLv();
  renderCreator(); previewDraft();
}
$('nameInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!$('goBtn').disabled)$('goBtn').click();});
$('goBtn').onclick=()=>{
  if(editing&&heroUnowned().length){ toast('還有試穿中的造型還沒買，先買下或換回原本的喔'); $('hBuy').scrollIntoView({block:'nearest'}); return; }
  if(!editing) grantHero(draft.hero);
  const nm=($('nameInput').value.trim()||'冒險者').slice(0,10);
  const changed=JSON.stringify(save.look)!==JSON.stringify(draft)||nm!==save.name;
  save.name=nm; save.look=draft;
  if(editing&&changed){save.ach.dress||(save.ach.dress=1,toast('達成成就「時尚冒險者」！'));}
  if(!save.created){save.created=true; save.level=draftLv; applyLevel();}
  persist();
  if(preview){scene.remove(preview.holder);preview=null;}
  if(editing){player.pos.set(-20,0,24);player.yaw=Math.atan2(-1,-1);}
  rebuildPlayer(); rebuildPet(); checkAch(); hud();
  $('creator').hidden=true;
  for(const id of ['hudPlayer','hudBtns','minimap','where']) $(id).hidden=false;
  $('help').hidden=isTouch; $('stick').hidden=!isTouch; $('actBtn').hidden=!isTouch;
  mode='play'; canvas.focus(); cam.yaw=player.yaw+Math.PI;
  oneShot(player.ch,'cheer','idle',1500);
  if(!editing){ toast(`歡迎來到學習冒險城，${save.name}！`); if(!save.toured) setTimeout(()=>{if(mode==='play') startTour();},1600); if(!save.cloud) setTimeout(()=>openAccount('create',()=>{ if(!save.toured) startTour(); }),400); }
};

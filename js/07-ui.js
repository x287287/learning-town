/* 學習冒險城．js/07-ui.js
 * 對話框、各種面板（委託、市集、背包、日誌、成就、說明）、HUD、提示訊息、解鎖說明
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ======================= DIALOGUE ======================= */
let talk=null, typeT=null;
function npcById(id){return npcs.find(n=>n.def.id===id);}
function startTalk(id){
  const n=npcById(id); const d=n.def; mode='talk'; stopMove();
  save.talked[id]=1; persist(); checkAch();
  n.talking=true; n.yaw=Math.atan2(player.pos.x-n.holder.position.x,player.pos.z-n.holder.position.z); n.holder.rotation.y=n.yaw;
  if(d.walk) playOn(n,'idle');
  player.yaw=Math.atan2(n.holder.position.x-player.pos.x,n.holder.position.z-player.pos.z);
  if(!n.busy) oneShot(n,'interact',d.anim==='walk'?'idle':d.anim==='chop'?'hammer':d.anim==='cast'?'cast':'idle',1100);
  talk={n,lines:[...d.lines],i:0,opts:d.opts};
  $('dFace').textContent=d.face; $('dFace').style.background=d.color; $('dWho').innerHTML=`${esc(d.name)}<small>${esc(d.role)}</small>`;
  $('dialog').hidden=false; $('prompt').hidden=true; showLine();
}
function say(id,text){ if(!talk) return; talk.lines=[text]; talk.i=0; talk.opts=[]; showLine(); }
function showLine(){
  const line=talk.lines[talk.i]; const el=$('dLine'); el.textContent=''; let k=0; clearInterval(typeT);
  talk.typing=true; $('dOpts').innerHTML='';
  typeT=setInterval(()=>{k+=1; el.textContent=line.slice(0,k); if(k>=line.length){clearInterval(typeT);talk.typing=false;renderOpts();}},28);
}
function renderOpts(){
  const last=talk.i>=talk.lines.length-1; const o=$('dOpts'); o.innerHTML='';
  if(!last){const b=document.createElement('button');b.className='opt';b.type='button';b.textContent='繼續 ▸';b.onclick=advanceTalk;o.appendChild(b);b.focus();return;}
  for(const [t,fn] of talk.opts){const b=document.createElement('button');b.className='opt';b.type='button';b.textContent=t;b.onclick=()=>{fn();};o.appendChild(b);}
  const bye=document.createElement('button');bye.className='opt leave';bye.type='button';bye.textContent='再見';bye.onclick=endTalk;o.appendChild(bye);
  (o.querySelector('.opt')||bye).focus();
}
function advanceTalk(){ if(!talk) return; if(talk.typing){clearInterval(typeT);$('dLine').textContent=talk.lines[talk.i];talk.typing=false;renderOpts();return;}
  if(talk.i<talk.lines.length-1){talk.i++;showLine();} }
function endTalk(){ if(!talk) return; const n=talk.n; n.talking=false; if(!n.def.walk){n.yaw=n.home;} clearInterval(typeT); talk=null; $('dialog').hidden=true; mode='play'; canvas.focus(); }

/* ======================= PANELS ======================= */
const veil=$('veil');
function openPanel(html){ if(typeof stopVideo==='function'&&!/vscreen/.test(html)) stopVideo(); if(talk){clearInterval(typeT);$('dialog').hidden=true;} veil.innerHTML=html; veil.hidden=false; mode='ui'; stopMove();
  const x=veil.querySelector('.x'); if(x){x.addEventListener('click',closePanel);x.focus();}
  const bd=veil.querySelector('.panel .body'); if(bd){ requestAnimationFrame(()=>{ if(bd.scrollHeight>bd.clientHeight+8){ const h=document.createElement('div'); h.className='scroll-hint'; h.textContent='往下滑看更多 ▾'; bd.appendChild(h); bd.addEventListener('scroll',()=>{h.hidden=bd.scrollTop+bd.clientHeight>=bd.scrollHeight-10;},{passive:true}); } }); } }
function closePanel(){ if(acctLock) return; $('mapVeil').hidden=true; stopVideo(); pr=null; qz=null; veil.hidden=true; veil.innerHTML=''; if(talk){mode='talk';$('dialog').hidden=false;renderOpts();} else {mode='play';canvas.focus();} }
veil.addEventListener('pointerdown',e=>{if(e.target===veil)closePanel();});
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function chip(sub){const s=SUB[sub];return `<span class="chip" style="background:${s.color}">${s.name}</span>`;}
function panelShell(title,sub,body,label){return `<div class="panel wood" role="dialog" aria-label="${label||title}"><header><div style="flex:1;min-width:0"><h2>${title}</h2>${sub?`<p class="sub">${sub}</p>`:''}</div><button class="x" type="button" aria-label="關閉">✕</button></header><div class="body">${body}</div></div>`;}
function stopMove(){for(const k in keys)keys[k]=false;endStick();}

let questFilter='all';
function openQuestBoard(){
  const tabs=[['all','全部'],...SUBJECTS.map(s=>[s.id,s.name])].map(([id,n])=>`<button class="tab" type="button" data-f="${id}" aria-pressed="${questFilter===id}">${n}</button>`).join('');
  const list=QUESTS.filter(q=>questFilter==='all'||q.sub===questFilter).map(q=>{const st=save.quests[q.id];const s=SUB[q.sub];
    return `<div class="card"><div class="glyph" style="background:${s.color}">${s.name[0]}</div><div style="min-width:0"><h3>${esc(q.title)}</h3><p>${esc(q.goal)}</p>
    <div class="meta">${chip(q.sub)}<span class="purse"><span class="gem"></span>+${q.reward} 金幣</span>${st==='active'?(q.unit&&unitDone(q.unit,q.sub)?'<span class="chip" style="background:#b8862a">可以領獎</span>':'<span class="chip" style="background:#3d8a4a">進行中</span>'):''}</div></div>
    ${st==='done'?'<span class="chip" style="background:#3d8a4a">已完成</span>':st==='active'&&q.unit&&unitDone(q.unit,q.sub)?`<button class="act" type="button" data-claim="${q.id}">領取獎勵</button>`:st==='active'?`<button class="act ghost" type="button" data-drop="${q.id}">放棄</button>`:`<button class="act" type="button" data-take="${q.id}">接取委託</button>`}</div>`;}).join('');
  openPanel(panelShell('任務板','接下委託後，到西邊的傳送門廣場出發。目前是示範任務，之後會換成你的單元題目。',`<div class="tabs">${tabs}</div>${list}`));
  veil.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{questFilter=b.dataset.f;openQuestBoard();});
  veil.querySelectorAll('[data-take]').forEach(b=>b.onclick=()=>{const q=QUESTS.find(x=>x.id===b.dataset.take);save.quests[q.id]='active';persist();checkAch();hud();toast(`接下委託「${q.title}」`);openQuestBoard();});
  veil.querySelectorAll('[data-drop]').forEach(b=>b.onclick=()=>{delete save.quests[b.dataset.drop];persist();hud();openQuestBoard();});
  veil.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>{const q=QUESTS.find(x=>x.id===b.dataset.claim);save.quests[q.id]='done';addCoins(q.reward,'quest');persist();hud();toast(`完成委託「${q.title}」，獲得 ${q.reward} 金幣！`);oneShot(player.ch,'cheer','idle',1500);openQuestBoard();});
}
let shopTab={market:'item',smith:'look'};
function openShop(which){
  const name=which==='market'?'市集':'鐵匠鋪';
  let list=ITEMS.filter(i=>i.shop===which);
  let tabs='';
  if(which==='market'){tabs=`<div class="tabs">${[['item','冒險道具'],['look','披風染料'],['frame','名牌框']].map(([id,n])=>`<button class="tab" type="button" data-t="${id}" aria-pressed="${shopTab.market===id}">${n}</button>`).join('')}</div>`;list=list.filter(i=>i.kind===shopTab.market);}
  const cards=list.map(i=>{const own=save.inv[i.id]||0;const owned=i.kind==='look'&&own>0;
    return `<div class="card"><div class="glyph" style="background:${i.color}">${i.glyph}</div><div style="min-width:0"><h3>${i.name}</h3><p>${i.desc}</p>
    <div class="meta"><span class="purse"><span class="gem"></span>${i.price} 金幣</span>${i.kind==='item'&&own?`<span>持有 ${own}</span>`:''}</div></div>
    ${owned?'<button class="act" type="button" disabled>已擁有</button>':`<button class="act" type="button" data-buy="${i.id}" ${save.coins<i.price?'disabled':''}>購買</button>`}</div>`;}).join('');
  openPanel(panelShell(name,`你有 ${save.coins} 金幣。${which==='smith'?'特效買了之後，到裁縫屋換上。':''}`,tabs+cards));
  veil.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{shopTab.market=b.dataset.t;openShop(which);});
  veil.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const i=ITEM[b.dataset.buy];if(save.coins<i.price)return;spendCoins(i.price,'shop');save.inv[i.id]=(save.inv[i.id]||0)+1;persist();checkAch();hud();sfx('coin');toast(`買到「${i.name}」`);openShop(which);});
}
function openBag(){
  const owned=ITEMS.filter(i=>save.inv[i.id]);
  const body=owned.length?owned.map(i=>`<div class="card"><div class="glyph" style="background:${i.color}">${i.glyph}</div><div style="min-width:0"><h3>${i.name}</h3><p>${i.desc}</p></div>${i.id==='treat'||i.id==='firework'?`<div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end"><span class="chip" style="background:var(--walnut)">x ${save.inv[i.id]}</span><button class="act" type="button" data-usebag="${i.id}">使用</button></div>`:i.kind==='frame'?`<div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">${save.frame===i.id?'<span class="chip" style="background:#3d8a4a">配戴中</span>':''}<button class="act" type="button" data-usebag="${i.id}">${save.frame===i.id?'取下':'配戴'}</button></div>`:`<span class="chip" style="background:var(--walnut)">${i.kind==='item'?'x '+save.inv[i.id]:'已解鎖'}</span>`}</div>`).join('')
    :'<div class="empty">背包還是空的。<br>到東邊的市集逛逛吧！</div>';
  openPanel(panelShell('背包','戰鬥道具會在答題時使用；點心和煙火在這裡使用；名牌框在這裡配戴；染料和特效到裁縫屋換上。',body));
  veil.querySelectorAll('[data-usebag]').forEach(b=>b.onclick=()=>useBagItem(b.dataset.usebag));
}
function openLog(){
  const act=QUESTS.filter(q=>save.quests[q.id]==='active');
  const body=act.length?act.map(q=>{const s=SUB[q.sub];return `<div class="card"><div class="glyph" style="background:${s.color}">${s.name[0]}</div><div style="min-width:0"><h3>${esc(q.title)}</h3><p>${esc(q.goal)}．${q.unit&&unitDone(q.unit,q.sub)?'已通過，回冒險者公會領獎':'前往傳送門廣場 →「'+s.name+'」'+(q.unit?'，選第 '+q.unit+' 單元':'')}</p></div><span class="purse"><span class="gem"></span>+${q.reward}</span></div>`;}).join('')
    :'<div class="empty">還沒有接任何委託。<br>到冒險者公會找雷恩吧！</div>';
  openPanel(panelShell('任務','進行中的委託',body));
}
function openAch(){
  const n=ACH.filter(a=>save.ach[a.id]).length;
  const body=ACH.map(a=>{const got=save.ach[a.id];const on=save.title===a.title;
    return `<div class="card ${got?'':'locked'}"><div class="glyph" style="background:${got?'#e2b04a':'#8a7a62'};color:#2a1b12">${got?'★':'？'}</div><div style="min-width:0"><h3>${a.name}</h3><p>${a.desc}．稱號：「${a.title}」</p></div>
    ${got?(on?'<button class="act ghost" type="button" data-title="">取下稱號</button>':`<button class="act" type="button" data-title="${a.title}">配戴稱號</button>`):'<span class="chip" style="background:#8a7a62">未達成</span>'}</div>`;}).join('');
  openPanel(panelShell('榮譽殿堂',`已達成 ${n} / ${ACH.length} 項成就。配戴的稱號會顯示在名字下方。`,`<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="act" type="button" id="achRep">我的學習報告</button><button class="act" type="button" id="achDex">怪物圖鑑</button></div><div class="ach-grid">${body}</div>`));
  $('achRep').onclick=()=>openReport(); $('achDex').onclick=()=>openDex();
  veil.querySelectorAll('[data-title]').forEach(b=>b.onclick=()=>{save.title=b.dataset.title;persist();rebuildPlayer();hud();openAch();});
}
function openNotice(){
  openPanel(panelShell('公告欄','老師的公告會貼在這裡。',`<div class="scroll"><b>📣 ${weekBanner()}</b></div><div class="scroll">各位冒險者好！<br>五科的傳送門都已經開放了。先到大圖書館看重點影片，再到傳送門廣場闖關；答錯的題目會收進錯題本，記得回來複習。<br>城東的牧場和城西的草地來了一些動物朋友，走過去摸摸牠們，會學到動物小知識喔！<br>記得定期在「說明」裡備份自己的進度。<br><br>—— 城主（老師）</div>`));
}
function openWell(){
  const done=save.lastWish===today();
  openPanel(panelShell('許願井','每天可以許一次願，會得到小小的祝福。',
    done?`<div class="scroll">井水閃著微光……<br>你今天已經許過願了，明天再來吧！</div>`
        :`<div class="scroll">投下一枚小石子，閉上眼睛許個願……</div><button class="act" type="button" id="wishBtn">許願</button>`));
  const b=$('wishBtn'); if(b) b.onclick=()=>{const gifts=[10,15,20,25];const g=gifts[Math.random()*4|0]*(petPerk('ghost')?2:1);addCoins(g,'wish');save.lastWish=today();save.ach.wish||(save.ach.wish=1);persist();checkAch();hud();
    const words=['願你今天學到一件新事情！','願你答題時靈光一閃！','願你和朋友一起變強！','願你的努力被看見！'];
    veil.querySelector('.body').innerHTML=`<div class="scroll">井底升起金色的光……<br><b>${words[Math.random()*4|0]}</b><br>你得到了 ${g} 金幣的祝福。</div>`;
    oneShot(player.ch,'cheer','idle',1600);};
}
function openPortal(sub){
  if(SUBJ_DATA[sub]){ const D=SUBJ_DATA[sub], T=THEMES[sub];
    const cards=D.units.map(u=>{const p=unitProgress(u.n,sub);const done=unitDone(u.n,sub);
      return `<div class="card"><div class="glyph" style="background:${done?'#3d8a4a':T.color}">${u.n}</div><div style="min-width:0"><h3>${esc(u.title.startsWith('第')||/^[A-Z]/.test(u.title)?u.title:'第'+CN8[u.n-1]+'單元　'+u.title)}</h3><p>${u.stages.slice(0,4).map(s=>esc(s[1])).join('、')}，最後挑戰${esc(u.stages[4][0])}</p><div class="meta"><span class="chip" style="background:${done?'#3d8a4a':p?'#b8862a':'#8a7a62'}">${done?'已征服':p?`已通過 ${p} / 5 關`:'尚未挑戰'}</span>${p?`<span class="chip stars">★ ${unitStars(u.n,sub)} / 15</span>`:''}</div></div><button class="act" type="button" data-unit="${u.n}">出發</button></div>`;}).join('');
    openPanel(panelShell(`${SUB[sub].name}傳送門．${T.map}`,`${esc(D.book)}。選一個單元出發，每個單元有 5 關。每關最多 3 顆星，不失去愛心就能拿滿。`,cards));
    veil.querySelectorAll('[data-unit]').forEach(b=>b.onclick=()=>enterMap(+b.dataset.unit,sub)); return; }
  const s=SUB[sub]; const qs=QUESTS.filter(q=>q.sub===sub&&save.quests[q.id]==='active');
  openPanel(panelShell(`${s.name}傳送門`,s.desc,`<div class="scroll">傳送門的魔力還在聚集中。<br>這個世界的地圖完成後，就能從這裡出發。</div>
    <p class="note">${qs.length?`你在這個世界的委託：${qs.map(q=>'「'+esc(q.title)+'」').join('、')}`:`還沒有${s.name}的委託，可以先到冒險者公會接取。`}</p>
    <button class="act" type="button" disabled>出發（即將開放）</button>`));
}
function openInfo(){
  openPanel(panelShell('冒險指南','',`
    <div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:#b33a2c">委</div><div><h3>冒險者公會（東北）</h3><p>找公會長雷恩接取各科委託。</p></div></div>
    <div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:#b8862a">市</div><div><h3>市集（東）與鐵匠鋪（東南）</h3><p>用金幣買道具、披風染料、附魔特效。</p></div></div>
    <div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:#7a4fb0">裁</div><div><h3>裁縫屋（西南）</h3><p>角色編輯器：髮型、五官、膚色、帽子、衣服、披風、武器和特效都能換；新造型可以先試穿，再用金幣買下。想換職業，要到榮譽殿堂找職業導師葛雷（${JOB_PRICE} 金幣）。</p></div></div>
    <div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:#3a2a5a">門</div><div><h3>傳送門廣場（西）</h3><p>五座傳送門通往${SUB.chinese.name}「文字森林」、數學「數字遺跡」、英語「海港王國」、自然「奇幻山谷」、社會「時光古城」，全部已開放。每個世界有不同的地形和守衛怪物，答對攻擊、答錯被反擊，對戰時可按 1～4 選答案。題型除了選擇題，還有判斷對錯、輸入答案、配對和排順序（訓練場和每日挑戰也會出現判斷對錯、輸入答案）。連續答對有連擊獎勵；不失去愛心能拿到 3 顆星；魔王血量剩一半會狂暴！</p></div></div>
    <div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:#2f5ea8">書</div><div><h3>大圖書館（西北）．榮譽殿堂（北）．訓練場（遠東北）</h3><p>看各單元的重點複習影片、查看成就稱號；訓練場可以選單元和題數反覆練習。</p></div></div>
    <div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:#d9863a">寵</div><div><h3>魔法寵物屋（西南）</h3><p>找露露領養奇幻寵物。帶在身邊的寵物會跟著你，還會在戰鬥中發揮魔法能力。</p></div></div>
    <div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:#7a4fb0">露</div><div><h3>書籤精靈露米（大圖書館旁）</h3><p>答錯的題目會自動收進錯題本，找露米複習，同一題再答對 2 次就能畢業。</p></div></div>
    <div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:#c2452f">信</div><div><h3>每日信差小飛（中央廣場）</h3><p>每天 3 題跨科挑戰。連續 3 天得到稱號，連續 7 天得到限定披風。</p></div></div>
    <div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:#6b4c2c">卡</div><div><h3>流浪商人卡洛（每天換地方）</h3><p>販賣市集買不到的限定染料和特效，打開大地圖就能找到他。</p></div></div>
    <div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:#2f5ea8">鑑</div><div><h3>怪物圖鑑與學習報告</h3><p>右上角「圖鑑」收集五科 25 種怪物；榮譽殿堂可以看各科答對率和最需要加強的地方。</p></div></div>
    <div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:#5b5f66">井</div><div><h3>中央廣場</h3><p>許願井每天可以許願一次；公告欄有老師的公告。</p></div></div>
    <div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:#b8862a">週</div><div><h3>主題週</h3><p>${weekBanner()}每週一換一科，依照數學、${SUB.chinese.name}、英語、自然、社會輪流。</p></div></div>
    <div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:${CLS_TRAIT[save.look.cls].color}">${CLS_TRAIT[save.look.cls].glyph}</div><div><h3>我的職業：${CLASSES[save.look.cls].label}（${CLS_TRAIT[save.look.cls].name}）</h3><p>${CLS_TRAIT[save.look.cls].desc}想換職業，到榮譽殿堂找職業導師葛雷。</p></div></div>
    ${cloudInfoCard()}
    <div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:#3d8a4a">存</div><div><h3>備份檔（額外保險）</h3><p>有雲端帳號就會自動存檔；也可以另外下載備份檔。${save.lastBackup?`上次備份：${fmtDate(save.lastBackup)}`:'你還沒有備份過。'}</p><button type="button" class="act" data-infobk="1" style="margin-top:6px">備份／還原我的進度</button></div></div>
    <div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:#5b5f66">休</div><div><h3>休息提醒（老師或家長設定）</h3><p>連續冒險一段時間後，會請你休息 20 秒、看看遠方。這台裝置目前：<b>${restMin?restMin+' 分鐘':'關閉'}</b></p><div class="choices" style="margin-top:6px">${[0,20,30,45,60].map(m=>`<button type="button" class="ch" data-rest="${m}" aria-pressed="${restMin===m}">${m?m+' 分鐘':'關閉'}</button>`).join('')}</div></div></div>
    <div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:#2f5ea8">聲</div><div><h3>聲音</h3><p>右上角「聲音」可以開關音效、背景音樂和英語自動朗讀。英語題目旁邊的 🔊 可以聽英文發音。</p></div></div>
    <p class="note">電腦：W A S D 或方向鍵移動，Shift 跑步，空白鍵跳，拖曳滑鼠轉視角，滾輪縮放，E 對話，B 背包。平板：左下搖桿移動，拖曳畫面轉視角，右下按鈕對話。</p>
    <p class="note">進度存在這台裝置的瀏覽器裡；同一台裝置可以有多位冒險者，各自分開存檔（點左上角的名字就能切換）。3D 模型：KayKit Medieval Hexagon Pack、Forest Nature Pack、Adventurers 與 Skeletons Character Pack，作者 Kay Lousberg（CC0 公眾領域）；寵物與各科守衛怪物：Quaternius Ultimate Monsters（CC0）；海港場景：Quaternius Pirate Kit（CC0）；3D 引擎 three.js（MIT）。</p>
    <button class="act" type="button" id="tourAgain" style="align-self:flex-start">重看城鎮導覽</button>
    <p class="note">點右下角的小地圖（或按 M）會打開大地圖，點 NPC 或地點就會自動走過去。</p>
    <div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:${lvOf(save)==='jh'?'#2f5ea8':'#3d8a4a'}">${LEVELS[lvOf(save)].name[1]}</div><div><h3>學習階段：${LEVELS[lvOf(save)].full}</h3><p>${LEVELS[lvOf(save)].desc}。換階段後，題庫、影片、委託和闖關進度都會換成另一個階段的；原本的進度會保留，換回來就會回來。金幣、裝備、寵物和成就不變。</p><button class="act" type="button" id="lvBtn" style="margin-top:6px">改成${LEVELS[lvOf(save)==='jh'?'es':'jh'].full}</button><div id="lvConfirm" hidden><p class="note">確定要把「${esc(save.name)}」改成${LEVELS[lvOf(save)==='jh'?'es':'jh'].full}嗎？遊戲會重新整理一次。</p><div style="display:flex;gap:8px;margin-top:6px"><button class="act" type="button" id="lvYes">確定更改</button><button class="act ghost" type="button" id="lvNo" style="color:var(--parchment)">取消</button></div></div></div></div>
    <button class="act" type="button" id="switchBtn" style="align-self:flex-start">切換冒險者</button>
    <button class="act ghost" type="button" id="resetBtn" style="color:var(--parchment)">刪除這位冒險者（${esc(save.name)}）的進度</button>
    <div id="resetConfirm" hidden><p class="note">確定要刪除「${esc(save.name)}」的角色、金幣、背包、任務和成就嗎？其他冒險者的進度不受影響。</p><div style="display:flex;gap:8px;margin-top:6px"><button class="act" type="button" id="resetYes">確定清除</button><button class="act ghost" type="button" id="resetNo" style="color:var(--parchment)">取消</button></div></div>`));
  $('tourAgain').onclick=()=>{ veil.hidden=true; veil.innerHTML=''; mode='play'; startTour(); };
  $('resetBtn').onclick=()=>{$('resetConfirm').hidden=false;$('resetBtn').hidden=true;};
  $('resetNo').onclick=()=>{$('resetConfirm').hidden=true;$('resetBtn').hidden=false;};
  $('resetYes').onclick=()=>{ deleteProfile(curId); curId=null; location.reload(); };
  $('switchBtn').onclick=()=>switchPlayer();
  $('lvBtn').onclick=()=>{$('lvConfirm').hidden=false;$('lvBtn').hidden=true;};
  $('lvNo').onclick=()=>{$('lvConfirm').hidden=true;$('lvBtn').hidden=false;};
  $('lvYes').onclick=()=>changeLevel(lvOf(save)==='jh'?'es':'jh');
  veil.querySelectorAll('[data-infobk]').forEach(b=>b.onclick=()=>{persist();openBackup();});
  veil.querySelectorAll('[data-rest]').forEach(b=>b.onclick=()=>{restMin=+b.dataset.rest; lsSet(REST_KEY,String(restMin)); playSec=0; openInfo();});
}
$('btnBag').onclick=()=>mode==='play'&&openBag(); $('btnPet').onclick=()=>mode==='play'&&openPets(); $('btnLog').onclick=()=>mode==='play'&&openLog(); $('btnAch').onclick=()=>mode==='play'&&openAch(); $('btnInfo').onclick=()=>mode==='play'&&openInfo(); $('btnSnd').onclick=()=>mode==='play'&&openSound(); $('btnDex').onclick=()=>mode==='play'&&openDex();

/* ======================= ACHIEVEMENTS / HUD ======================= */
function checkAch(){
  const got=[];
  const set=(id,cond)=>{if(cond&&!save.ach[id]){save.ach[id]=1;got.push(id);}};
  set('arrive',save.created);
  set('chat',NPC_DEFS.filter(d=>!d.area).every(d=>save.talked[d.id]));
  set('quest',Object.keys(save.quests).length>0);
  set('buy',Object.keys(save.inv).length>0);
  set('explore',PLACES.every(p=>save.visited[p]));
  set('mathall',SUBJ_DATA.math&&SUBJ_DATA.math.units.every(u=>unitDone(u.n,'math')));
  set('daily3',(save.daily&&save.daily.best||0)>=3); set('review',(save.grad||0)>=10); set('dex5',dexCount()>=5); set('dexall',dexCount()>=25); set('evolve',!!(save.pets&&Object.values(save.pets.owned||{}).some(o=>o.evo)));
  set('combo10',(save.bestCombo||0)>=10); set('friend',Object.keys(save.petted||{}).length>=ANIMAL_DEFS.length); set('weekstar',(save.weekStars||0)>=1);
  set('star15',['chinese','math','english','science','social'].some(s=>SUBJ_DATA[s]&&SUBJ_DATA[s].units.some(u=>unitStars(u.n,s)>=15)));
  set('allsub',['chinese','math','english','science','social'].every(s=>SUBJ_DATA[s]&&SUBJ_DATA[s].units.some(u=>unitDone(u.n,s))));
  if(got.length){persist(); const a=ACH.find(x=>x.id===got[0]); toast(`達成成就「${a.name}」！`); sfx('ach'); if(!save.title){save.title=a.title;persist();rebuildPlayer();}}
  hud();
}
function hud(){
  $('hudName').textContent=save.name||'冒險者'; $('hudCrest').textContent=(save.name||'冒')[0];
  $('hudTitle').textContent=save.title||'尚無稱號'; $('hudCoins').textContent=save.coins; applyFrame(); try{cloudBadge();}catch(e){}
  const n=QUESTS.filter(q=>save.quests[q.id]==='active').length; $('logBadge').textContent=n; $('logBadge').hidden=!n;
  $('achCount').textContent=`${ACH.filter(a=>save.ach[a.id]).length}/${ACH.length}`;
}
let toastT; function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2000);}

/* ======================= 解鎖說明 ======================= */
function lockHint(id){ const it=ITEM[id]; if(!it) return ''; if(it.how) return it.how; if(it.shop==='chest') return '打倒魔王，從寶箱有機會開出來'; if(it.shop==='smith') return '到鐵匠鋪購買就能解鎖'; return '到市集買染料就能解鎖'; }
function lockTag(id){ const it=ITEM[id]; return !it?'':{chest:'（寶箱）',smith:'（鐵匠鋪）',wander:'（流浪商人）',reward:'（每日挑戰）'}[it.shop]||'（市集）'; }

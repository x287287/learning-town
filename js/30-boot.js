/* 學習冒險城．js/30-boot.js
 * 啟動：載入模型包、建立世界、進入冒險者、測試用介面
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ======================= BOOT ======================= */
Promise.all([
  loadPack('town',f=>{$('loadFill').style.width=(f*100)+'%';}),
  loadPack('hero').catch(e=>console.warn('hero',e)),
  Promise.all(['es','jh'].flatMap(lv=>['math','chinese','english','science','social'].map(s=>fetch(`data/${lv==='jh'?'jh-':''}${s}.json`).then(r=>r.ok?r.json():null).catch(()=>null).then(d=>{if(d) DATA_LV[lv][s]=d;})))).then(()=>{
    if(!DATA_LV.es.math) throw new Error('math data missing'); applyLevel();
  }),
  document.fonts?document.fonts.ready.catch(()=>{}):0
]).then(()=>{
  const K=models['ch_Knight']; const pick=(n)=>K.animations.find(a=>a.name===n);
  CLIPS={idle:pick('Idle'),walk:pick('Walking_A'),run:pick('Running_A'),jump:pick('Jump_Full_Short'),cheer:pick('Cheer'),interact:pick('Interact'),cast:pick('Spellcasting'),chop:pick('1H_Melee_Attack_Chop'),
    hammer:pick('1H_Melee_Attack_Chop')&&pick('1H_Melee_Attack_Chop').clone(),castShot:pick('Spellcast_Shoot'),shoot:pick('1H_Ranged_Shoot'),slash2:pick('2H_Melee_Attack_Slice'),hit:pick('Hit_A'),death:pick('Death_A')};
  for(const k in CLIPS) if(!CLIPS[k]) delete CLIPS[k];
  buildWorld(); buildPetHouse(); buildNPCs(); buildZones(); ready=true;
  loadPack('pets').then(()=>{spawnPen(); rebuildPet();}).catch(e=>console.warn('pets',e)).then(()=>loadPack('animals')).then(()=>spawnAnimals()).catch(e=>console.warn('animals',e));
  $('loadbar').hidden=true; $('goBtn').disabled=false;
  if((location.hash||'').startsWith('#import=')){ importFromHash().then(ok=>{ try{sessionStorage.setItem('lt-moved',ok?'1':'0');}catch(e){} location.reload(); }); }
  else {
  let auto=null; try{ auto=sessionStorage.getItem('learning-town-autopick'); sessionStorage.removeItem('learning-town-autopick'); }catch(e){}
  if(auto&&prof.list.some(p=>p.id===auto)){ $('creator').hidden=true; pickProfile(auto); }
  else if(prof.list.length) openPicker(); else { loadProfile(null); openCreator(false); }
  try{ const mv=sessionStorage.getItem('lt-moved'); sessionStorage.removeItem('lt-moved'); if(mv==='1') setTimeout(()=>toast('搬家完成！選一位冒險者進入，接著建立帳號和密碼。'),900); else if(mv==='0') setTimeout(()=>toast('搬家資料讀取失敗，請回到舊網址再試一次。'),900); }catch(e){}
  }
  checkUpdate(true);
  window.__town={sim:(sec)=>{for(let i=0;i<sec*20;i++){updatePlayer(.05,0);}},startTour,openBigMap,startNav,get nav(){return nav;},get mode(){return mode;},openPets,openPetShop,openPractice,openLibrary,player,npcs,interact,openCreator,closePanel,startTalk,endTalk,get save(){return save;},get prof(){return prof;},checkUpdate,openPicker,pickProfile,setLevel,changeLevel,applyLevel,get subjData(){return SUBJ_DATA;},get quests(){return QUESTS;},cam,enterMap,startBattle,answer:(i)=>answer(i),get battle(){return battle;},openDex,openReport,openWrongBook,openDaily,openWander,evolvePet,openPets,openAch,openVideo,useSub:(x)=>useSub(x),qzAnswer:(i)=>qzAnswer(i),get qz(){return qz;},numKey,tfAnswer,matchTap,matchSubmit,ordSubmit,openSound,openBag,useBagItem,fireworks,get comboRun(){return comboRun;},set comboRun(v){comboRun=v;},sfx,get sndPref(){return sndPref;},ordCands:(u)=>ordCands(u),openAccount,openLogin,cloudPush,get cloudState(){return cloudState;},rpc,openBackup,makeBackup,readBackup,restoreOne,openRest,weekState,weekBanner,get animals(){return animals;},petAnimal,get altCur(){return altCur;},altKey,altTF,get restMin(){return restMin;},_bt:{renderQ,makeSpecial,chooseQ,isNumQ,canTF,nextQuestion},get portalLabels(){return portalLabels;},openJob,doJob,jobStep,attackFx,defendFx,weaponKind,get VFX(){return VFX;},heroOwned,heroUnowned,get HERO_PARTS(){return HERO_PARTS;},get hTab(){return hTab;},renderCreator,get zones(){return zones;}};
}).catch(e=>{ console.error(e); const g=$('goBtn'); g.textContent='載入失敗，請重新整理頁面'; g.disabled=true; });
requestAnimationFrame(tick);

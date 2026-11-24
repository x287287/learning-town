/* 學習冒險城．js/26-tour.js
 * 新手導覽
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ======================= 新手導覽 ======================= */
const TOUR=[
  {t:'歡迎來到學習冒險城！',d:'這是城鎮中央的廣場。跟著導覽認識每一棟建築，之後隨時可以點右下角的地圖，選一位 NPC 就會自動走過去。',x:0,z:0,cam:[0,16,26]},
  {t:'冒險者公會．任務板',d:'找公會長雷恩接取各科委託。打倒單元魔王後回來，就能領取金幣獎勵。',x:27,z:-26,cam:[12,9,-8]},
  {t:'傳送門廣場',d:'五座傳送門通往國語、數學、英語、自然、社會的世界。每個世界的地形和怪物都不同，選單元出發，答對題目攻擊守衛怪物！',x:-38,z:2,cam:[-20,12,12]},
  {t:'大圖書館',d:'館長索菲亞的影片室，有每個單元的重點複習影片。旁邊的書籤精靈露米會幫你整理錯題本。',x:-27,z:-26,cam:[-12,10,-8]},
  {t:'訓練場',d:'教官布魯斯的練習模式：自己選科目、單元和題數，想練幾次都可以。',x:52,z:-30,cam:[38,10,-14]},
  {t:'市集與鐵匠鋪',d:'用金幣在市集買答題道具和披風染料，鐵匠鋪有武器附魔和光環特效。',x:30,z:18,cam:[12,12,26]},
  {t:'裁縫屋',d:'找裁縫師莉莉，隨時可以更換職業造型、頭飾、披風和武器。',x:-24,z:32,cam:[-10,9,18]},
  {t:'魔法寵物屋',d:'找露露領養寵物。帶在身邊的寵物會跟著你冒險，還有特殊能力。',x:-42,z:40,cam:[-28,10,30]},
  {t:'榮譽殿堂',d:'達成成就可以得到稱號，配戴後會顯示在名字下方。',x:0,z:-60,cam:[0,14,-34]},
  {t:'許願井與公告欄',d:'許願井每天可以許一次願；公告欄有老師的公告；信差小飛每天會送來挑戰信。祝你冒險愉快！',x:0,z:2,cam:[8,7,14]},
];
let tour=null; const tourLook=new THREE.Vector3();
function startTour(){
  if(talk) endTalk(); if(!veil.hidden){veil.hidden=true;veil.innerHTML='';}
  stopNav(); stopMove(); mode='tour'; tour={i:0,pos:new THREE.Vector3(),look:new THREE.Vector3()};
  tourLook.copy(player.pos);
  for(const id of ['hudBtns','minimap','where','help','stick','actBtn','prompt']) $(id).hidden=true;
  $('tourBox').hidden=false; showTourStep(0);
}
function showTourStep(i){
  tour.i=i; const s=TOUR[i];
  tour.pos.set(s.cam[0],s.cam[1],s.cam[2]); tour.look.set(s.x,2,s.z);
  $('tourNo').textContent=`${i+1} / ${TOUR.length}`; $('tourTitle').textContent=s.t; $('tourText').textContent=s.d;
  $('tourPrev').disabled=i===0; $('tourNext').textContent=i===TOUR.length-1?'開始冒險！':'下一個 ▸';
  $('tourNext').focus();
}
function endTour(){
  if(!tour) return; tour=null; save.toured=1; persist();
  $('tourBox').hidden=true; for(const id of ['hudBtns','minimap','where']) $(id).hidden=false;
  $('help').hidden=isTouch; $('stick').hidden=!isTouch; $('actBtn').hidden=!isTouch;
  mode='play'; cam.yaw=player.yaw+Math.PI; canvas.focus();
}
$('tourPrev').onclick=()=>{ if(tour&&tour.i>0) showTourStep(tour.i-1); };
$('tourNext').onclick=()=>{ if(!tour) return; if(tour.i<TOUR.length-1) showTourStep(tour.i+1); else endTour(); };
$('tourSkip').onclick=()=>endTour();
function tourTick(){ if(!tour) return; camera.position.lerp(tour.pos,.045); tourLook.lerp(tour.look,.06); camera.lookAt(tourLook);
  sun.position.set(tourLook.x+30,55,tourLook.z+22); sun.target.position.set(tourLook.x,0,tourLook.z); }

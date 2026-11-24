/* 學習冒險城．js/10-subjects.js
 * 科目題庫狀態、學習階段套用、各科主題設定
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

let MATH_UNITS=[]; let SUBJ_DATA={}; let curSub='math';
const DATA_LV={es:{},jh:{}};
function rebuildQuests(){
  QUESTS.length=0; const lv=lvOf(save);
  for(const s of ['math','chinese','english','science','social']){ const D=SUBJ_DATA[s]; if(!D) continue;
    if(s==='math'&&lv==='es'){ QUESTS.push(...ES_MATH_QUESTS); continue; }
    for(const u of D.units) QUESTS.push({id:`q-${s}-u${u.n}`,sub:s,unit:u.n,title:`${u.title.replace(/^第.單元　/,'').replace(/^Unit \d+ /,'')}：${u.stages[4][0]}`,goal:`打倒「${u.title}」的${u.stages[4][0]}`,reward:40}); }
}
function applyLevel(){
  SUBJ_DATA=DATA_LV[lvOf(save)]||{}; SUB.chinese.name=lvOf(save)==='jh'?'國文':'國語'; rebuildQuests(); try{refreshPortalLabels();}catch(e){}
  if(!useSub(curSub)) useSub(Object.keys(SUBJ_DATA)[0]||'math');
}
/* 每個科目有自己的地圖模型包、守衛怪物、地面與擂台花紋。mon 依序是第 1～5 關（第 5 關是魔王）。 */
const THEMES={
  math:{map:'數字遺跡',color:'#2f5ea8',mini:'#c9ab78',pack:'ruins',road:'遺跡小路',
    mon:['ch_Skeleton_Minion','ch_Skeleton_Mage','ch_Skeleton_Rogue','ch_Skeleton_Warrior','ch_Skeleton_Warrior'],
    ring:['2','3','5','7','11','13','17','19','23','29','31','37'],disc:'#8f877c',ink:'#e9d391'},
  chinese:{map:'文字森林',color:'#c2452f',mini:'#6f9a52',pack:'forest',road:'森林小徑',
    mon:['mo_Blob_GreenBlob','mo_Big_Monkroose','mo_Blob_GreenSpikyBlob','mo_Big_Frog','mo_Big_MushroomKing'],
    ring:['春','夏','秋','冬','山','水','日','月','風','雲','花','鳥'],disc:'#6b5a44',ink:'#f2dc9a'},
  english:{map:'海港王國',color:'#7a4fb0',mini:'#e8d3a2',pack:'harbor',road:'碼頭步道',island:92,
    mon:['mo_Blob_Fish','mo_Flying_Glub','mo_Flying_Squidle','mo_Flying_Glub_Evolved','mo_Big_Fish'],
    ring:['A','B','C','D','E','F','G','H','I','J','K','L'],disc:'#8a6a48',ink:'#ffe6a8'},
  science:{map:'奇幻山谷',color:'#3d8a4a',mini:'#8cc46a',pack:'valley',road:'山谷小路',
    mon:['mo_Blob_Alien','mo_Flying_Armabee','mo_Big_Birb','mo_Big_Bunny','mo_Flying_Dragon_Evolved'],
    ring:['H2O','O2','CO2','pH','°C','N','S','Fe','Cu','Na','Cl','Mg'],disc:'#4f6f7a',ink:'#c8f4ff'},
  social:{map:'時光古城',color:'#b8862a',mini:'#c2ad8a',pack:'oldcity',road:'古城大街',
    mon:['mo_Flying_Goleling','mo_Blob_Wizard','mo_Big_Ninja','mo_Big_Tribal','mo_Big_Orc'],
    ring:['民','主','法','治','族','群','經','濟','城','鄉','歷','史'],disc:'#8a7356',ink:'#ffe2a0'},
};
const CN8='一二三四五六七八';
function useSub(sub){ if(!SUBJ_DATA[sub]) return false; curSub=sub; MATH_UNITS=SUBJ_DATA[sub].units; VIDEOS=SUBJ_DATA[sub].videos; return true; }
function SS(sub){ sub=sub||curSub; save[sub]=save[sub]||{}; save[sub].units=save[sub].units||{}; return save[sub]; }
let curUnit=1;
function UM(u){u=u||curUnit; const s=SS(); if(!s.units[u]) s.units[u]={cleared:{},chest:0}; return s.units[u];}
function unitDone(u,sub){const x=SS(sub).units[u];return !!(x&&x.cleared&&x.cleared[5]);}
function unitProgress(u,sub){const x=SS(sub).units[u];return x&&x.cleared?Object.keys(x.cleared).length:0;}

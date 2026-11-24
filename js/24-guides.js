/* 學習冒險城．js/24-guides.js
 * 各科地圖嚮導
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ======================= 各科地圖嚮導 ======================= */
const GUIDES={
  math:{name:'艾達',role:'遺跡考古學家',face:'艾',color:'#b8862a',look:{cls:'Rogue_Hooded',hat:false,cape:'brown',main:'none',off:'none'},hello:'歡迎來到數字遺跡！這裡的石柱上刻滿了數字的祕密。'},
  chinese:{name:'文淵夫子',role:'書院夫子',face:'文',color:'#3d6b3a',look:{cls:'Mage',hat:true,cape:'green',main:'2H_Staff',off:'none'},hello:'歡迎來到文字森林。讀書要眼到、口到、心到，每片葉子都藏著好詞好句。'},
  english:{name:'Max 船長',role:'港口船長',face:'船',color:'#2f5ea8',look:{cls:'Barbarian',hat:true,cape:'blue',main:'none',off:'Mug'},hello:'Hello! Welcome to Harbor Kingdom! 歡迎來到海港王國，開口說英文，海風會幫你加油！'},
  science:{name:'綠葉博士',role:'山谷研究員',face:'葉',color:'#2f8a6a',look:{cls:'Mage',hat:false,cape:'green',main:'1H_Wand',off:'Spellbook_open'},hello:'歡迎來到奇幻山谷！科學家要多觀察、多提問，答案常常藏在實驗裡。'},
  social:{name:'史官阿明',role:'古城史官',face:'史',color:'#8a6a2a',look:{cls:'Rogue',hat:false,cape:'gold',main:'none',off:'none'},hello:'歡迎來到時光古城。每一面城牆都記錄著過去，認識歷史，才能看懂現在。'},
};
function setGuide(sub){
  const n=npcById('guide'); const G=GUIDES[sub]||GUIDES.math; if(!n||n.def.cur===sub) return;
  const d=n.def; Object.assign(d,{name:G.name,role:G.role,face:G.face,color:G.color,look:G.look,cur:sub,
    lines:[G.hello,'沿著小路往北走，五隻守衛怪物各守著一關。答對題目就能攻擊，答錯會被反擊。',...(sub==='english'?['英文題目旁邊有小喇叭 🔊，點一下就能聽英文發音。想要每題自動唸，可以到右上角「聲音」打開「英語自動朗讀」！']:[]),'闖關前可以先聽我說說這個單元的重點。答錯也沒關係，看懂解說，下一題就會更厲害！']});
  const ch=buildCharacter(G.look); const old=n.holder; ch.holder.position.copy(old.position); ch.holder.rotation.y=old.rotation.y; scene.remove(old);
  Object.assign(n,{holder:ch.holder,root:ch.root,mixer:ch.mixer,actions:ch.actions,cur:null,busy:false}); scene.add(n.holder); playOn(n,'idle');
  const tag=labelSprite(d.name,{bg:'rgba(42,27,18,.85)',size:.5}); tag.position.y=2.98; n.holder.add(tag);
  const role=labelSprite(d.role,{bg:'rgba(226,176,74,.92)',fg:'#2a1b12',border:'rgba(0,0,0,0)',size:.36}); role.position.y=2.33; n.holder.add(role);
}
function guideTips(){
  const U=MATH_UNITS[curUnit-1], V=VIDEOS[curUnit]||[];
  const lines=[`「${unitShort(U)}」有這些重點，我一個一個說給你聽：`];
  V.slice(0,5).forEach(s=>{ const k=(s.L||[]).map(stripTags).filter(Boolean)[0]; lines.push(`${s.t}：${k||''}`); });
  lines.push(`最後的${U.stages[4][0]}會考綜合應用，每題限時 1 分鐘。想看完整影片，可以回城到大圖書館喔！`);
  talk.lines=lines; talk.i=0; talk.opts=[]; showLine();
}

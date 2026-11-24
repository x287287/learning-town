/* 學習冒險城．js/01-data.js
 * 共用小工具與遊戲資料：科目、職業與職業特性、角色編輯器零件與價格、裝備、商品、成就、地點
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

const $=id=>document.getElementById(id);
const rnd=(a,b)=>a+Math.random()*(b-a);

/* ======================= GAME DATA ======================= */
const SUBJECTS=[
  {id:'chinese',name:'國語',color:'#c2452f',desc:'字詞、成語與閱讀的「文字森林」'},
  {id:'math',   name:'數學',color:'#2f5ea8',desc:'數與量、圖形與計算的「數字遺跡」'},
  {id:'english',name:'英語',color:'#7a4fb0',desc:'單字、句型與對話的「海港王國」'},
  {id:'science',name:'自然',color:'#3d8a4a',desc:'動植物、天氣與實驗的「奇幻山谷」'},
  {id:'social', name:'社會',color:'#b8862a',desc:'家鄉、地圖與歷史的「時光古城」'},
];
const SUB=Object.fromEntries(SUBJECTS.map(s=>[s.id,s]));
const LEVELS={
  es:{id:'es',name:'國小',full:'國小六年級',term:'六上',desc:'翰林數學、南一國語、康軒英語自然社會（六上）'},
  jh:{id:'jh',name:'國中',full:'國中三年級',term:'九上',desc:'翰林數學英語社會、南一國文、康軒自然（九上）'},
};
const ES_MATH_QUESTS=[
  {id:'q-ma-u1',sub:'math',unit:1,title:'第一單元：遺跡之王',goal:'打倒「最大公因數與最小公倍數」的遺跡之王',reward:40},
  {id:'q-ma-u2',sub:'math',unit:2,title:'第二單元：分數魔王',goal:'打倒「分數除法」的分數魔王',reward:40},
  {id:'q-ma-u3',sub:'math',unit:3,title:'第三單元：小數魔王',goal:'打倒「小數除法」的小數魔王',reward:40},
  {id:'q-ma-u4',sub:'math',unit:4,title:'第四單元：比例魔王',goal:'打倒「比與比值」的比例魔王',reward:40},
  {id:'q-ma-u5',sub:'math',unit:5,title:'第五單元：天秤魔王',goal:'打倒「兩量關係」的天秤魔王',reward:40},
  {id:'q-ma-u6',sub:'math',unit:6,title:'第六單元：圓環魔王',goal:'打倒「圓周長與扇形周長」的圓環魔王',reward:40},
  {id:'q-ma-u7',sub:'math',unit:7,title:'第七單元：巨像魔王',goal:'打倒「放大、縮小與比例尺」的巨像魔王',reward:40},
  {id:'q-ma-u8',sub:'math',unit:8,title:'第八單元：謎題魔王',goal:'打倒「怎樣解題」的謎題魔王',reward:40},
];
const QUESTS=[];
const CLASSES={
  Knight:{label:'騎士',hat:'Knight_Helmet',hatLabel:'頭盔',cape:'Knight_Cape',main:['1H_Sword','2H_Sword'],off:['Round_Shield','Badge_Shield','Rectangle_Shield','Spike_Shield','1H_Sword_Offhand']},
  Barbarian:{label:'戰士',hat:'Barbarian_Hat',hatLabel:'獸角帽',cape:'Barbarian_Cape',main:['1H_Axe','2H_Axe'],off:['Barbarian_Round_Shield','1H_Axe_Offhand','Mug']},
  Mage:{label:'魔法師',hat:'Mage_Hat',hatLabel:'巫師帽',cape:'Mage_Cape',main:['1H_Wand','2H_Staff'],off:['Spellbook','Spellbook_open']},
  Rogue:{label:'遊俠',hat:null,cape:'Rogue_Cape',main:['Knife','1H_Crossbow','2H_Crossbow'],off:['Knife_Offhand','Throwable']},
  Rogue_Hooded:{label:'兜帽遊俠',hat:null,cape:'Rogue_Cape',main:['Knife','1H_Crossbow','2H_Crossbow'],off:['Knife_Offhand','Throwable']},
  Cleric:{label:'牧師',base:'Mage',hat:'Mage_Hat',hatLabel:'巫師帽',cape:'Mage_Cape',main:['1H_Wand','2H_Staff'],off:['Spellbook','Spellbook_open']},
  Bard:{label:'吟遊詩人',base:'Rogue',hat:null,cape:'Rogue_Cape',main:['Knife'],off:['Knife_Offhand']},
};
/* 職業特性與轉職 */
const CLS_TRAIT={
  Knight:{name:'守護之盾',glyph:'盾',color:'#2f5ea8',desc:'每場戰鬥第一次答錯時，盾牌會擋下攻擊，不會失去愛心。'},
  Barbarian:{name:'狂戰之力',glyph:'斧',color:'#b33a2c',desc:'連擊 3 題以上時，答對有一半機會打出重擊，造成兩倍傷害。'},
  Mage:{name:'智慧之光',glyph:'光',color:'#7a4fb0',desc:'每場戰鬥第一道選擇題，會自動刪去一個錯誤選項；有時間限制的題目多 10 秒。'},
  Rogue:{name:'尋寶眼光',glyph:'寶',color:'#b8862a',desc:'打贏戰鬥時，多拿 20% 金幣（至少多 2 枚）。'},
  Rogue_Hooded:{name:'靈巧閃避',glyph:'影',color:'#3d8a4a',desc:'答錯時有 3 成機會閃開攻擊，不會失去愛心。'},
  Cleric:{name:'治癒之光',glyph:'聖',color:'#c9a227',desc:'每場戰鬥連續答對 3 題時，如果失去過愛心，會恢復 1 顆（每場一次）。'},
  Bard:{name:'鼓舞之歌',glyph:'琴',color:'#b33a6a',desc:'每場戰鬥第一次在連擊中答錯，連擊不會中斷；連擊 3 題以上時，每題多 1 金幣。'},
};
const JOB_PRICE=150;
/* 冒險者角色編輯器（零件化角色、造型用金幣購買） */
const HERO_PARTS={"hair":{"刺刺短髮":{"src":"騎士","meshes":["hair_knight"]},"中分長髮":{"src":"法師","meshes":["hair_mage","hair_mage_tie"]},"側分長髮":{"src":"盜賊","meshes":["hair_rogue"]}},"body":{"騎士盔甲":{"src":"騎士","meshes":["body_knight","body_knight_armL","body_knight_armR"]},"野蠻人皮衣":{"src":"野蠻人","meshes":["body_barbarian","body_barbarian_armL","body_barbarian_armR"]},"法師長袍":{"src":"法師","meshes":["body_mage","body_mage_armL","body_mage_armR"]},"盜賊短衣":{"src":"盜賊","meshes":["body_rogue","body_rogue_armL","body_rogue_armR"]},"牧師長袍":{"src":"牧師","meshes":["body_priest","body_priest_armL","body_priest_armR"]},"吟遊詩人短衣":{"src":"吟遊詩人","meshes":["body_bard","body_bard_armL","body_bard_armR"]}},"legs":{"騎士護腿":{"src":"騎士","meshes":["legs_knight_L","legs_knight_R"]},"毛皮褲":{"src":"野蠻人","meshes":["legs_barbarian_L","legs_barbarian_R"]},"法師長靴":{"src":"法師","meshes":["legs_mage_L","legs_mage_R"]},"皮靴短褲":{"src":"盜賊","meshes":["legs_rogue_L","legs_rogue_R"]},"吟遊詩人短褲":{"src":"吟遊詩人","meshes":["legs_bard_L","legs_bard_R"]}},"hat":{"騎士頭盔":{"src":"騎士","meshes":["hat_knight"]},"牛角帽":{"src":"野蠻人","meshes":["hat_barbarian"]},"巫師帽":{"src":"法師","meshes":["hat_mage"]},"兜帽":{"src":"盜賊","meshes":["hat_hood"]},"牧師高帽":{"src":"牧師","meshes":["hat_priest"]},"羽毛帽":{"src":"吟遊詩人","meshes":["hat_bard"]}},"cape":{"紅披風":{"src":"騎士","meshes":["cape_knight"]},"毛皮披肩":{"src":"野蠻人","meshes":["cape_barbarian"]},"紫披風":{"src":"法師","meshes":["cape_mage"]},"綠斗篷":{"src":"盜賊","meshes":["cape_rogue"]},"綠披風":{"src":"吟遊詩人","meshes":["cape_bard"]}},"right":{"單手劍":{"src":"騎士","meshes":["r_sword"]},"雙手大劍":{"src":"騎士","meshes":["r_greatsword"]},"單手斧":{"src":"野蠻人","meshes":["r_axe"]},"雙手巨斧":{"src":"野蠻人","meshes":["r_greataxe"]},"啤酒杯":{"src":"野蠻人","meshes":["r_mug"]},"魔杖":{"src":"法師","meshes":["r_wand"]},"法杖":{"src":"法師","meshes":["r_staff"]},"手弩":{"src":"盜賊","meshes":["r_crossbow"]},"重弩":{"src":"盜賊","meshes":["r_heavycrossbow"]},"短刀":{"src":"盜賊","meshes":["r_knife"]},"炸彈":{"src":"盜賊","meshes":["r_bomb"]},"牧師權杖":{"src":"牧師","meshes":["r_priest_staff"]}},"left":{"副手劍":{"src":"騎士","meshes":["l_sword"]},"圓盾":{"src":"騎士","meshes":["l_roundshield"]},"徽章盾":{"src":"騎士","meshes":["l_badgeshield"]},"方盾":{"src":"騎士","meshes":["l_rectshield"]},"尖刺盾":{"src":"騎士","meshes":["l_spikeshield"]},"副手斧":{"src":"野蠻人","meshes":["l_axe"]},"木圓盾":{"src":"野蠻人","meshes":["l_woodshield"]},"魔法書":{"src":"法師","meshes":["l_spellbook"]},"打開的魔法書":{"src":"法師","meshes":["l_spellbook_open"]},"副手短刀":{"src":"盜賊","meshes":["l_knife"]},"聖典":{"src":"牧師","meshes":["l_holybook"]}},"beard":{"大鬍子":{"src":"野蠻人","meshes":["beard_barbarian"]},"八字鬍":{"src":"自製","meshes":["beard_mustache"]},"山羊鬍":{"src":"自製","meshes":["beard_goatee"]}},"back":{"魯特琴":{"src":"吟遊詩人","meshes":["back_lute"]}},"hairacc":{"馬尾":{"src":"自製","meshes":["hairacc_ponytail"]},"包包頭":{"src":"自製","meshes":["hairacc_bun","hairacc_bun_bald"]},"雙辮子":{"src":"自製","meshes":["hairacc_braids"]}},"head":{"共用頭":{"src":"KayKit 風格","meshes":["head_base","head_ears"]}},"eyes":{"圓圓眼":{"src":"騎士／野蠻人","meshes":["eyes_barbarian"]},"睫毛眼":{"src":"法師","meshes":["eyes_mage"]},"細長眼":{"src":"盜賊","meshes":["eyes_rogue"]},"瞇瞇眼":{"src":"自製","meshes":["eyes_happy"]},"閃亮大眼":{"src":"自製","meshes":["eyes_big","eyes_big_shine"]}},"brows":{"粗眉":{"src":"騎士","meshes":["brows_knight"]},"濃眉":{"src":"野蠻人","meshes":["brows_barbarian"]},"細眉":{"src":"法師","meshes":["brows_mage"]},"挑眉":{"src":"盜賊","meshes":["brows_rogue"]}},"nose":{"小圓鼻":{"src":"騎士","meshes":["nose_knight"]},"大蒜鼻":{"src":"野蠻人","meshes":["nose_barbarian"]},"尖鼻子":{"src":"法師／盜賊","meshes":["nose_mage"]}},"mouth":{"淺笑":{"src":"騎士","meshes":["mouth_knight"]},"抿嘴":{"src":"法師","meshes":["mouth_mage"]},"微笑":{"src":"盜賊","meshes":["mouth_rogue"]},"大笑":{"src":"自製","meshes":["mouth_laugh"]},"驚訝":{"src":"自製","meshes":["mouth_wow"]}},"cheek":{"腮紅":{"src":"自製","meshes":["cheek_blush"]},"耳環":{"src":"盜賊","meshes":["earring_rogue"]},"腮紅＋耳環":{"src":"自製","meshes":["cheek_blush","earring_rogue"]}}};
const HERO_SLOTS=[['hair','髮型',0,'光頭'],['color','髮色'],['hairacc','髮飾',0,'無'],['eyes','眼睛',1],['brows','眉毛',0,'無'],['nose','鼻子',1],['mouth','嘴巴',0,'無'],['cheek','臉頰',0,'無'],['beard','鬍子',0,'無'],['skin','膚色'],
  ['hat','帽子',0,'不戴'],['body','上衣',1],['legs','褲子',1],['cape','披風',0,'不穿'],['dye','披風顏色'],['back','背飾',0,'無'],['right','右手',0,'空手'],['left','左手',0,'空手'],['fx','特效']];
const HAIR_COLORS=[['棕色','#9b5a45'],['深棕','#5a3418'],['黑色','#262326'],['金色','#e4ac5c'],['淺金','#f0d290'],['薑紅','#c8642e'],['紅色','#c03a2b'],['灰白','#c9c6c2'],['白色','#f4f1ea'],['藍色','#4f86c6'],['紫色','#8a5cc0'],['粉紅','#f08cb4'],['綠色','#4e9a5c'],['銀灰','#978f86'],['亞麻','#dcae7d']];
const SKIN_COLORS=[['淺膚','#fbd7bd'],['原色','#f6c09c'],['蜜桃','#eab08a'],['小麥','#d79a6c'],['焦糖','#c68642'],['可可','#8d5524'],['深棕','#5c3a21'],['淡綠','#a8d8a0'],['淡藍','#a9c8ee']];
const HIDE_ALL=['騎士頭盔','牛角帽','兜帽'], SPIKY='刺刺短髮';
const HERO_PRESET={
  Knight:{eyes:'圓圓眼',brows:'粗眉',nose:'小圓鼻',mouth:'淺笑',hair:'刺刺短髮',color:'#dcae7d',hat:'騎士頭盔',body:'騎士盔甲',legs:'騎士護腿',cape:'紅披風',right:'單手劍',left:'圓盾'},
  Barbarian:{eyes:'圓圓眼',brows:'濃眉',nose:'大蒜鼻',beard:'大鬍子',color:'#978f86',hat:'牛角帽',body:'野蠻人皮衣',legs:'毛皮褲',cape:'毛皮披肩',right:'雙手巨斧'},
  Mage:{eyes:'睫毛眼',brows:'細眉',nose:'尖鼻子',mouth:'抿嘴',hair:'中分長髮',color:'#262326',hat:'巫師帽',body:'法師長袍',legs:'法師長靴',cape:'紫披風',right:'法杖',left:'魔法書'},
  Rogue:{eyes:'細長眼',brows:'挑眉',nose:'尖鼻子',mouth:'微笑',cheek:'耳環',hair:'側分長髮',color:'#9b5a45',body:'盜賊短衣',legs:'皮靴短褲',cape:'綠斗篷',right:'短刀',left:'副手短刀'},
  Rogue_Hooded:{eyes:'細長眼',brows:'挑眉',nose:'尖鼻子',mouth:'微笑',hair:'側分長髮',color:'#5a3418',hat:'兜帽',body:'盜賊短衣',legs:'皮靴短褲',cape:'綠斗篷',right:'手弩',left:'副手短刀'},
  Cleric:{eyes:'睫毛眼',brows:'細眉',nose:'尖鼻子',mouth:'抿嘴',hair:'中分長髮',color:'#c8642e',hat:'牧師高帽',body:'牧師長袍',legs:'法師長靴',right:'牧師權杖',left:'聖典'},
  Bard:{eyes:'細長眼',brows:'挑眉',nose:'尖鼻子',mouth:'微笑',hair:'側分長髮',color:'#e4ac5c',hat:'羽毛帽',body:'吟遊詩人短衣',legs:'吟遊詩人短褲',cape:'綠披風',back:'魯特琴'},
};
const OUTFIT_SLOTS=['hat','body','legs','cape','back','right','left'];
const HERO_PRICE={eyes:20,brows:15,nose:15,mouth:15,cheek:20,hair:40,hairacc:40,beard:30,hat:60,body:100,legs:60,cape:60,back:80,right:60,left:50,color:30};
const HERO_PRICE_X={'雙手大劍':80,'雙手巨斧':80,'法杖':80,'重弩':80,'牧師權杖':80,'啤酒杯':30,'炸彈':40};
const HERO_FREE={color:['#9b5a45','#5a3418','#262326','#e4ac5c'],eyes:['圓圓眼','睫毛眼','細長眼'],brows:['粗眉','細眉'],nose:['小圓鼻','尖鼻子'],mouth:['淺笑','微笑'],hair:['刺刺短髮','中分長髮','側分長髮']};
const GEAR_TO_HERO={'1H_Sword':['right','單手劍'],'2H_Sword':['right','雙手大劍'],'Round_Shield':['left','圓盾'],'Badge_Shield':['left','徽章盾'],'Rectangle_Shield':['left','方盾'],'Spike_Shield':['left','尖刺盾'],'1H_Sword_Offhand':['left','副手劍'],
  '1H_Axe':['right','單手斧'],'2H_Axe':['right','雙手巨斧'],'Barbarian_Round_Shield':['left','木圓盾'],'1H_Axe_Offhand':['left','副手斧'],'Mug':['right','啤酒杯'],'1H_Wand':['right','魔杖'],'2H_Staff':['right','法杖'],
  'Spellbook':['left','魔法書'],'Spellbook_open':['left','打開的魔法書'],'Knife':['right','短刀'],'1H_Crossbow':['right','手弩'],'2H_Crossbow':['right','重弩'],'Knife_Offhand':['left','副手短刀'],'Throwable':['right','炸彈']};

const GEAR_ALL=[...new Set(Object.values(CLASSES).flatMap(c=>[...c.main,...c.off]))];
const TWO_HANDED=new Set(['2H_Sword','2H_Axe','2H_Staff','2H_Crossbow']);
const CAPES=[
  {id:'none',label:'不穿',color:null},{id:'red',label:'紅',color:'#b33a2c'},{id:'blue',label:'藍',color:'#2f5ea8'},{id:'green',label:'綠',color:'#3d8a4a'},{id:'brown',label:'棕',color:'#7a4b2a'},
  {id:'gold',label:'金',color:'#e2b04a',shop:'dye_gold'},{id:'purple',label:'紫',color:'#7a4fb0',shop:'dye_purple'},{id:'black',label:'黑',color:'#222226',shop:'dye_black'},{id:'bone',label:'骸骨白',color:'#e8e2d0',shop:'eq_bone'},
  {id:'rose',label:'玫瑰粉',color:'#e07aa0',shop:'dye_rose'},{id:'teal',label:'湖水綠',color:'#2fa59a',shop:'dye_teal'},{id:'sky',label:'天空藍',color:'#5fb7e8',shop:'eq_sky'},
];
const FX=[{id:'none',label:'無'},{id:'aura',label:'金色光環',shop:'fx_aura'},{id:'glow',label:'武器藍光',shop:'fx_glow'},{id:'sparkle',label:'星光',shop:'fx_sparkle'},{id:'crown',label:'遺跡王冠',shop:'eq_crown'},{id:'rune',label:'符文火光',shop:'eq_rune'},{id:'petal',label:'花瓣飛舞',shop:'fx_petal'},{id:'snow',label:'冰雪結晶',shop:'fx_snow'},{id:'bubble',label:'魔法泡泡',shop:'fx_bubble'}];
const ITEMS=[
  {id:'hint',  shop:'market',kind:'item', name:'提示卷軸', glyph:'卷', color:'#3d8a4a', price:20, desc:'答題時刪去一個錯誤選項。'},
  {id:'glass', shop:'market',kind:'item', name:'時間沙漏', glyph:'沙', color:'#b8862a', price:25, desc:'計時任務延長 15 秒。'},
  {id:'potion',shop:'market',kind:'item', name:'金幣加倍藥水', glyph:'藥', color:'#c2452f', price:45, desc:'下一個任務的金幣獎勵變兩倍。'},
  {id:'feather',shop:'market',kind:'item', name:'復活羽毛', glyph:'羽', color:'#e2b04a', price:40, desc:'戰鬥中愛心歸零時自動使用，恢復 1 顆愛心繼續作戰。'},
  {id:'charm',  shop:'market',kind:'item', name:'連擊護符', glyph:'護', color:'#2f5ea8', price:35, desc:'連擊 2 以上時答錯，自動使用，連擊不會中斷。'},
  {id:'treat',  shop:'market',kind:'item', name:'寵物點心', glyph:'點', color:'#d9863a', price:30, desc:'在背包使用，身邊寵物的親密度 +3，更快進化。'},
  {id:'firework',shop:'market',kind:'item',name:'慶祝煙火', glyph:'火', color:'#c2452f', price:15, desc:'在背包使用，在城鎮上空放一場煙火。'},
  {id:'frame_leaf',  shop:'market',kind:'frame',name:'森林葉框',glyph:'葉',color:'#3d8a4a',price:50,desc:'左上角的名牌換成綠葉邊框。在背包配戴。'},
  {id:'frame_silver',shop:'market',kind:'frame',name:'閃亮銀框',glyph:'銀',color:'#9aa4ad',price:80,desc:'名牌換成閃亮的銀色邊框。在背包配戴。'},
  {id:'frame_gold',  shop:'market',kind:'frame',name:'榮耀金框',glyph:'榮',color:'#e2b04a',price:150,desc:'名牌換成會發光的金色邊框。在背包配戴。'},
  {id:'frame_rainbow',shop:'market',kind:'frame',name:'彩虹傳說框',glyph:'虹',color:'#7a4fb0',price:250,desc:'名牌換成流動的彩虹邊框，傳說等級！在背包配戴。'},
  {id:'dye_gold',  shop:'market',kind:'look',name:'金色披風染料',glyph:'金',color:'#e2b04a',price:60,desc:'到裁縫屋可以把披風染成金色。'},
  {id:'dye_purple',shop:'market',kind:'look',name:'紫色披風染料',glyph:'紫',color:'#7a4fb0',price:40,desc:'到裁縫屋可以把披風染成紫色。'},
  {id:'dye_black', shop:'market',kind:'look',name:'黑色披風染料',glyph:'黑',color:'#222226',price:40,desc:'到裁縫屋可以把披風染成黑色。'},
  {id:'fx_glow',   shop:'smith', kind:'look',name:'武器附魔：藍光',glyph:'光',color:'#2f5ea8',price:80,desc:'讓你的武器發出藍色光芒。'},
  {id:'fx_aura',   shop:'smith', kind:'look',name:'勇者光環',glyph:'環',color:'#e2b04a',price:100,desc:'腳下出現閃耀的金色光環。'},
  {id:'fx_sparkle',shop:'smith', kind:'look',name:'星光護符',glyph:'星',color:'#7a4fb0',price:70,desc:'身邊環繞著小星星。'},
  {id:'fx_snow',   shop:'smith', kind:'look',name:'冰雪結晶',glyph:'雪',color:'#5fb7e8',price:90,desc:'身邊飄著藍白色的冰晶。到裁縫屋的「特效」換上。'},
  {id:'fx_bubble', shop:'smith', kind:'look',name:'魔法泡泡',glyph:'泡',color:'#2fa59a',price:110,desc:'身邊浮著透明的魔法泡泡。到裁縫屋的「特效」換上。'},
  {id:'eq_crown',shop:'chest',kind:'look',name:'遺跡王冠',glyph:'冠',color:'#c9961f',price:0,desc:'遺跡之王寶箱的稀有裝備。到裁縫屋的「特效」換上。'},
  {id:'eq_rune', shop:'chest',kind:'look',name:'符文火光',glyph:'符',color:'#d2621f',price:0,desc:'遺跡之王寶箱的稀有裝備。武器燃起橘色符文光。'},
  {id:'eq_bone', shop:'chest',kind:'look',name:'骸骨白披風',glyph:'骸',color:'#9d9583',price:0,desc:'遺跡之王寶箱的稀有裝備。到裁縫屋把披風換成骸骨白。'},
  {id:'eq_sky',shop:'reward',kind:'look',name:'天空藍披風',glyph:'天',color:'#5fb7e8',price:0,desc:'每日挑戰連續 7 天的限定獎勵。到裁縫屋換上。',how:'每日挑戰連續 7 天就能得到'},
  {id:'dye_rose',shop:'wander',kind:'look',name:'玫瑰粉染料',glyph:'玫',color:'#e07aa0',price:90,desc:'流浪商人的限定染料，把披風染成玫瑰粉。',how:'流浪商人限定販售'},
  {id:'dye_teal',shop:'wander',kind:'look',name:'湖水綠染料',glyph:'湖',color:'#2fa59a',price:90,desc:'流浪商人的限定染料，把披風染成湖水綠。',how:'流浪商人限定販售'},
  {id:'fx_petal',shop:'wander',kind:'look',name:'花瓣飛舞',glyph:'花',color:'#ff8fb0',price:120,desc:'流浪商人的限定特效，身邊飄著粉紅花瓣。',how:'流浪商人限定販售'},
];
const ITEM=Object.fromEntries(ITEMS.map(i=>[i.id,i]));
const ACH=[
  {id:'arrive',name:'初來乍到',desc:'第一次進入學習冒險城',title:'新手冒險者'},
  {id:'chat',name:'城鎮之友',desc:'和城裡每一位居民說過話',title:'城鎮之友'},
  {id:'quest',name:'接下委託',desc:'在冒險者公會接取第一個任務',title:'見習委託人'},
  {id:'buy',name:'精打細算',desc:'第一次在市集或鐵匠鋪購物',title:'精明買家'},
  {id:'dress',name:'時尚冒險者',desc:'在裁縫屋改變一次造型',title:'時尚冒險者'},
  {id:'wish',name:'幸運之泉',desc:'在許願井許下願望',title:'幸運兒'},
  {id:'read',name:'小書蟲',desc:'在大圖書館看完一部教學影片',title:'小書蟲'},
  {id:'explore',name:'城鎮探險家',desc:'走訪城裡所有重要地點',title:'探險家'},
  {id:'pet',name:'我的好夥伴',desc:'在魔法寵物屋領養第一隻寵物',title:'動物好朋友'},
  {id:'practice',name:'勤學苦練',desc:'在訓練場完成一次練習',title:'練習生'},
  {id:'perfect',name:'完美練習',desc:'一次練習 10 題以上全部答對',title:'神射手'},
  {id:'ruins',name:'遺跡初探',desc:'第一次走進科目試煉地圖',title:'遺跡探險家'},
  {id:'mathwin',name:'初次勝利',desc:'在試煉地圖打倒第一隻守衛怪物',title:'數字勇者'},
  {id:'mathking',name:'遺跡征服者',desc:'打倒任一個單元的魔王',title:'學科勇士'},
  {id:'allsub',name:'全科冒險家',desc:'五個科目都至少征服一個單元',title:'全科冒險家'},
  {id:'mathall',name:'數學全制霸',desc:'征服目前學習階段的數學全部單元',title:'數學王'},
  {id:'daily3',name:'每日勤學',desc:'每日挑戰連續完成 3 天',title:'每日勤學家'},
  {id:'review',name:'錯題剋星',desc:'讓 10 題從錯題本畢業',title:'錯題剋星'},
  {id:'dex5',name:'小小收藏家',desc:'怪物圖鑑收集 5 種怪物',title:'怪物收藏家'},
  {id:'dexall',name:'怪物博士',desc:'怪物圖鑑收集全部 25 種怪物',title:'怪物博士'},
  {id:'evolve',name:'馴獸大師',desc:'讓一隻寵物進化',title:'馴獸大師'},
  {id:'combo10',name:'連擊高手',desc:'在試煉地圖連續答對 10 題',title:'連擊高手'},
  {id:'star15',name:'完美勇者',desc:'任一個單元的 5 關都拿到 3 顆星',title:'完美勇者'},
  {id:'friend',name:'動物好朋友',desc:'摸摸城裡全部 8 隻動物',title:'動物好朋友'},
  {id:'weekstar',name:'主題週之星',desc:'完成一次主題週目標',title:'主題週之星'},
  {id:'job',name:'新的旅程',desc:'找職業導師轉職一次',title:'轉職冒險者'},
];
const PLACES=['guild','market','smith','tailor','library','portal','castle','training','well','gate'];

/* 學習冒險城．js/05-world.js
 * 城鎮：建築、布告欄、傳送門、NPC 與對話內容
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ======================= WORLD ======================= */
const colliders=[]; const zones=[]; const npcs=[]; const portals=[]; const spinners=[];
let buildSub=null; // 正在建造哪一科的場景：這時加的碰撞只在該科生效
const circ=(x,z,r)=>colliders.push(buildSub?{x,z,r,sub:buildSub}:{x,z,r});
function pathTo(x0,z0,x1,z1,w=5){const dx=x1-x0,dz=z1-z0,L=Math.hypot(dx,dz);const t=dirtTex.clone();t.needsUpdate=true;t.repeat.set(w/4,L/4);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,L),new THREE.MeshLambertMaterial({map:t}));m.rotation.x=-Math.PI/2;m.rotation.z=Math.atan2(dx,dz);m.rotation.order='YXZ';
  m.rotation.set(-Math.PI/2,0,0);const g=new THREE.Group();g.add(m);g.position.set((x0+x1)/2,.03,(z0+z1)/2);g.rotation.y=Math.atan2(dx,dz);m.receiveShadow=true;scene.add(g);}

const LOC={
  castle:{x:0,z:-60}, guild:{x:27,z:-26}, market:{x:36,z:6}, smith:{x:24,z:32}, gate:{x:0,z:52},
  tailor:{x:-24,z:32}, portal:{x:-38,z:2}, library:{x:-27,z:-26}, training:{x:52,z:-30}, well:{x:0,z:0},
};
function buildWorld(){
  const ground=new THREE.Mesh(new THREE.CircleGeometry(170,64),new THREE.MeshLambertMaterial({map:grassTex}));
  ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
  // plaza
  const ct=cobbleTex.clone(); ct.needsUpdate=true; ct.repeat.set(6,6);
  const plaza=new THREE.Mesh(new THREE.CircleGeometry(16,48),new THREE.MeshLambertMaterial({map:ct})); plaza.rotation.x=-Math.PI/2; plaza.position.y=.04; plaza.receiveShadow=true; scene.add(plaza);
  const rim=new THREE.Mesh(new THREE.RingGeometry(15.6,16.4,64),new THREE.MeshLambertMaterial({color:'#6f6458'})); rim.rotation.x=-Math.PI/2; rim.position.y=.05; scene.add(rim);
  for(const k of ['castle','guild','market','smith','gate','tailor','portal','library']){const L=LOC[k];const d=Math.hypot(L.x,L.z);const ux=L.x/d,uz=L.z/d;const stop=k==='castle'?d-14:k==='portal'?d-12:k==='gate'?d:d-7;pathTo(ux*15,uz*15,ux*stop,uz*stop);}
  pathTo(31,-27,48,-30,4);

  /* --- Castle: Hall of Honour --- */
  place('castle',LOC.castle.x,LOC.castle.z,{s:10}); circ(0,-60,10.5);
  for(const x of [-14,14]){place('towerA',x,-52,{s:7});circ(x,-52,3.6);}
  place('flagR',-6,-46,{s:9}); place('flagR',6,-46,{s:9});
  label('榮譽殿堂',0,-36,7.2);

  /* --- Guild (tavern) --- */
  place('tavern',LOC.guild.x,LOC.guild.z,{s:9,face:true}); circ(27,-26,6);
  buildQuestBoard(17.5,-22.5,Math.atan2(-17.5,22.5));
  place('barrel',20,-30,{s:7}); circ(20,-30,.8); place('barrel',21.3,-31,{s:7}); place('crate',33,-19,{s:7});
  label('冒險者公會',27,-26,15.5);

  /* --- Market --- */
  place('market',LOC.market.x,LOC.market.z,{s:9,face:true}); circ(36,6,7);
  for(const [x,z] of [[29,13],[30,-2],[28,14.5]]) place('crate',x,z,{s:8});
  place('sack',29.5,-3.5,{s:9}); place('wheelbarrow',31,15,{s:8,ry:1}); circ(30,-2,1); circ(29,13.5,1.5);
  label('市集',36,6,11);

  /* --- Blacksmith --- */
  place('blacksmith',LOC.smith.x,LOC.smith.z,{s:9,face:true}); circ(24,32,6.5);
  place('weaponrack',17,26,{s:9,ry:.8}); circ(17,26,1); place('lumber',30,25,{s:7,ry:.5}); circ(30,25,2);
  label('鐵匠鋪',24,32,11.5);

  /* --- Tailor (home) --- */
  place('homeB',LOC.tailor.x,LOC.tailor.z,{s:9,face:true}); circ(-24,32,5.5);
  place('flagB',-18.5,26.5,{s:8}); place('flagY',-29,26,{s:8});
  label('裁縫屋',-24,32,14);

  /* --- Library (church) --- */
  place('church',LOC.library.x,LOC.library.z,{s:11,face:true}); circ(-27,-26,6.2);
  label('大圖書館',-27,-26,20);

  /* --- Training ground --- */
  place('archery',LOC.training.x,LOC.training.z,{s:8,face:true}); circ(52,-30,6.5);
  for(const [x,z] of [[44,-40],[48,-41],[52,-42]]){place('target',x,z,{s:10,ry:Math.PI});circ(x,z,1);}
  place('tent',58,-20,{s:9}); circ(58,-20,2.4);
  label('訓練場',52,-30,15);

  /* --- Well (plaza) & notice board --- */
  place('well',0,0,{s:6}); circ(0,0,2.3);
  buildNoticeBoard(9.5,7.5);

  /* --- Gate & walls --- */
  place('wallGate',0,LOC.gate.z,{s:9});
  for(const x of [-18,-36,18,36]) place('wall',x,LOC.gate.z,{s:9});
  place('wallCorner',-54,LOC.gate.z,{s:9,ry:-Math.PI/2}); place('wallCorner',54,LOC.gate.z,{s:9,ry:Math.PI});
  colliders.push({box:[-62,LOC.gate.z-3.6,-4.3,LOC.gate.z+3.6]},{box:[4.3,LOC.gate.z-3.6,62,LOC.gate.z+3.6]});
  place('flagR',-6,LOC.gate.z-3,{s:9}); place('flagR',6,LOC.gate.z-3,{s:9});
  label('學習冒險城',0,LOC.gate.z,14);

  /* --- Portal circle --- */
  buildPortals(LOC.portal.x,LOC.portal.z);

  /* --- Houses & landmarks --- */
  const homes=[['homeA',-44,-46],['homeB2',-48,24],['homeA2',44,44],['homeA',-12,-40],['homeB',14,-42],['homeA2',-50,-12],['homeB2',50,16],['homeB',38,-46]];
  for(const [n,x,z] of homes){place(n,x,z,{s:8,face:true}); circ(x,z,4.2);}
  place('windmill',62,34,{s:9,face:true}); circ(62,34,5);
  place('towerA',-62,-26,{s:8}); circ(-62,-26,4.2);
  place('barracks',-58,30,{s:7,face:true}); circ(-58,30,5);
  place('grain',70,10,{s:8}); place('grain',70,-6,{s:8});
  for(let i=0;i<10;i++) place('fence',66+(i%2)*2,-14+i*4,{s:4,ry:Math.PI/2});

  /* --- Trees, rocks, mountains --- */
  for(let i=0;i<70;i++){const a=i/70*Math.PI*2+rnd(-.03,.03),r=rnd(68,92);const x=Math.cos(a)*r,z=Math.sin(a)*r;
    place(['treeL','treeM','treeB'][i%3],x,z,{s:rnd(7,10),ry:rnd(0,6)});}
  for(let i=0;i<26;i++){const a=rnd(0,Math.PI*2),r=rnd(40,62);const x=Math.cos(a)*r,z=Math.sin(a)*r;
    if(Math.abs(x)<8&&z>40) continue; if(Math.hypot(x-LOC.training.x,z-LOC.training.z)<14) continue; if(Math.hypot(x+38,z-2)<16) continue;
    let ok=true; for(const c of colliders) if(!c.box&&Math.hypot(c.x-x,c.z-z)<c.r+4) ok=false; if(!ok) continue;
    place(i%2?'tree1':'tree2',x,z,{s:rnd(6,8),ry:rnd(0,6)}); circ(x,z,1.3);}
  for(let i=0;i<14;i++){const a=rnd(0,Math.PI*2),r=rnd(30,60); place(i%2?'rock':'rock2',Math.cos(a)*r,Math.sin(a)*r,{s:rnd(6,10),ry:rnd(0,6)});}
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2+rnd(-.1,.1),r=rnd(120,140); place(i%2?'mountain':'mountain2',Math.cos(a)*r,Math.sin(a)*r,{s:rnd(22,32),ry:rnd(0,6),shadow:false});}
  for(let i=0;i<8;i++){const a=rnd(0,Math.PI*2),r=rnd(98,112); place('hills',Math.cos(a)*r,Math.sin(a)*r,{s:rnd(14,18),ry:rnd(0,6),shadow:false});}
  for(let i=0;i<14;i++){const c=place(i%2?'cloudB':'cloudS',rnd(-150,150),rnd(-150,150),{y:rnd(42,58),s:rnd(5,9),shadow:false}); if(c){c.userData.cloud=rnd(.6,1.4); spinners.push(c);}}
}
function label(t,x,z,y,opt){const s=labelSprite(t,Object.assign({size:1.7},opt||{}));s.position.set(x,y,z);scene.add(s);return s;}

function buildQuestBoard(x,z,ry){
  const grp=new THREE.Group(); grp.position.set(x,0,z); grp.rotation.y=ry;
  const wood=new THREE.MeshLambertMaterial({color:'#7a4b2a'}), dark=new THREE.MeshLambertMaterial({color:'#4f301b'});
  for(const sx of [-2.6,2.6]){const p=new THREE.Mesh(new THREE.BoxGeometry(.45,4.8,.45),dark);p.position.set(sx,2.4,0);grp.add(p);}
  const board=new THREE.Mesh(new THREE.BoxGeometry(5.6,3,.3),wood); board.position.set(0,2.9,0); grp.add(board);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(6.4,.35,1.3),new THREE.MeshLambertMaterial({color:'#b33a2c'})); roof.position.set(0,4.8,0); grp.add(roof);
  ['#f2e3c2','#efd9b0','#f6ead0','#ecd6a8','#f2e3c2','#efd9b0'].forEach((c,i)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.05),new THREE.MeshLambertMaterial({color:c}));p.position.set(-1.8+(i%3)*1.8,i<3?3.55:2.25,.16);p.rotation.z=rnd(-.08,.08);grp.add(p);});
  grp.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}}); scene.add(grp); circ(x,z,2.6);
  const m=label('！',x,z,6.8,{bg:'#e2b04a',fg:'#2a1b12',border:'#2a1b12',size:.9}); m.userData.bob=6.8; spinners.push(m);
}
function buildNoticeBoard(x,z){
  const grp=new THREE.Group(); grp.position.set(x,0,z); grp.rotation.y=Math.atan2(-x,-z);
  const wood=new THREE.MeshLambertMaterial({color:'#7a4b2a'});
  for(const sx of [-1.3,1.3]){const p=new THREE.Mesh(new THREE.BoxGeometry(.3,3.2,.3),wood);p.position.set(sx,1.6,0);grp.add(p);}
  const b=new THREE.Mesh(new THREE.BoxGeometry(3.1,1.9,.2),new THREE.MeshLambertMaterial({color:'#5f3a20'}));b.position.y=2.2;grp.add(b);
  const paper=new THREE.Mesh(new THREE.PlaneGeometry(2.5,1.4),new THREE.MeshLambertMaterial({color:'#f2e3c2'}));paper.position.set(0,2.2,.11);grp.add(paper);
  grp.traverse(o=>{if(o.isMesh)o.castShadow=true;}); scene.add(grp); circ(x,z,1.6);
  zones.push({id:'notice',x:x-x/Math.hypot(x,z)*2.4,z:z-z/Math.hypot(x,z)*2.4,r:2.8,label:'查看公告欄',place:'well'});
}
function portalMaterial(color){
  return new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,uniforms:{t:{value:0},c:{value:new THREE.Color(color)}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec2 vUv;uniform float t;uniform vec3 c;void main(){vec2 p=vUv-.5;float r=length(p)*2.;float a=atan(p.y,p.x);
      float sw=sin(a*5.+r*9.-t*3.)*.5+.5;float core=smoothstep(1.,.0,r);vec3 col=mix(c*.8,vec3(1.,.97,.85),sw*core*.65);
      gl_FragColor=vec4(col,smoothstep(1.,.86,r)*(.6+.4*sw));}`});
}
const portalLabels={};
function refreshPortalLabels(){
  for(const [id,p] of Object.entries(portalLabels)){ const nm=SUB[id].name; if(p.name===nm) continue; scene.remove(p.sp); p.sp=label(nm,p.x,p.z,8,{bg:p.color,size:.85}); p.name=nm; }
  for(const z of zones) if(z.id==='portal'&&SUB[z.sub]) z.label=`走進「${SUB[z.sub].name}」傳送門`;
}
function buildPortals(cx,cz){
  const runeTex=canvasTex(512,512,(x,w,h)=>{x.fillStyle='#8a8279';x.fillRect(0,0,w,h);x.strokeStyle='#d9c48c';x.lineWidth=10;x.beginPath();x.arc(256,256,230,0,7);x.stroke();x.lineWidth=5;x.beginPath();x.arc(256,256,190,0,7);x.stroke();
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2-Math.PI/2;x.beginPath();x.moveTo(256+Math.cos(a)*190,256+Math.sin(a)*190);const b=(i+2)/5*Math.PI*2-Math.PI/2;x.lineTo(256+Math.cos(b)*190,256+Math.sin(b)*190);x.stroke();}
    x.fillStyle='#d9c48c';x.font='bold 30px serif';for(let i=0;i<24;i++){const a=i/24*Math.PI*2;x.save();x.translate(256+Math.cos(a)*210,256+Math.sin(a)*210);x.rotate(a+Math.PI/2);x.fillText('ᚠᚢᚦᚨᚱᚲᚷᚹ'[i%8],-9,10);x.restore();}});
  runeTex.wrapS=runeTex.wrapT=THREE.ClampToEdgeWrapping;
  const disc=new THREE.Mesh(new THREE.CircleGeometry(14,64),new THREE.MeshLambertMaterial({map:runeTex})); disc.rotation.x=-Math.PI/2; disc.position.set(cx+3,.06,cz); disc.receiveShadow=true; scene.add(disc);
  label('傳送門廣場',cx+3,cz,11,{bg:'#3a2a5a'});
  const stone=new THREE.MeshLambertMaterial({color:'#a9a397'}), stoneD=new THREE.MeshLambertMaterial({color:'#7d776d'});
  SUBJECTS.forEach((s,i)=>{
    const ang=(i-2)*0.45, R=11; const x=cx+3-Math.cos(ang)*R, z=cz+Math.sin(ang)*R;
    const grp=new THREE.Group(); grp.position.set(x,0,z); grp.lookAt(cx+3,0,cz);
    for(const sx of [-2.1,2.1]){const p=new THREE.Mesh(new THREE.BoxGeometry(.9,5.2,.9),stone);p.position.set(sx,2.6,0);grp.add(p);const cap=new THREE.Mesh(new THREE.BoxGeometry(1.2,.4,1.2),stoneD);cap.position.set(sx,5.3,0);grp.add(cap);}
    const lintel=new THREE.Mesh(new THREE.BoxGeometry(5.4,.8,1.1),stoneD); lintel.position.y=5.6; grp.add(lintel);
    const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.45),new THREE.MeshLambertMaterial({color:s.color,emissive:s.color,emissiveIntensity:.6})); gem.position.y=6.5; grp.add(gem); spinners.push(Object.assign(gem,{userData:{gem:true}}));
    const sheet=new THREE.Mesh(new THREE.PlaneGeometry(3.3,4.6,1,1),portalMaterial(s.color)); sheet.position.y=2.75; grp.add(sheet);
    const step=new THREE.Mesh(new THREE.BoxGeometry(5.4,.35,1.8),stoneD); step.position.y=.17; grp.add(step);
    const light=new THREE.PointLight(s.color,.8,10); light.position.set(0,2.8,1.4); grp.add(light);
    grp.traverse(o=>{if(o.isMesh&&o!==sheet){o.castShadow=true;o.receiveShadow=true;}}); scene.add(grp);
    portalLabels[s.id]={sp:label(s.name,x,z,8,{bg:s.color,size:.85}),x,z,name:s.name,color:s.color};
    const fx=x+(cx+3-x)/R*2.8, fz=z+(cz-z)/R*2.8;
    zones.push({id:'portal',sub:s.id,x:fx,z:fz,r:2.4,label:`走進「${s.name}」傳送門`,place:'portal'});
    colliders.push({x:x+Math.sin(ang+Math.PI/2)*0, z, r:0}); circ(x-(cx+3-x)/R*.2,z-(cz-z)/R*.2,1.4);
    circ(x+(z-cz)/R*2.1,z-(x-cx-3)/R*2.1,.8); circ(x-(z-cz)/R*2.1,z+(x-cx-3)/R*2.1,.8);
    portals.push(sheet);
  });
}

/* ======================= NPCs ======================= */
const WANDER_SPOTS=[[44,22,'市集北邊'],[-46,-34,'大圖書館西邊'],[22,-38,'冒險者公會南邊'],[-14,40,'裁縫屋東邊'],[56,-6,'城東麥田旁'],[-52,12,'傳送門廣場西邊']];
const WANDER=WANDER_SPOTS[dayIdx()%WANDER_SPOTS.length];
const NPC_DEFS=[
  {id:'guild',name:'雷恩',role:'冒險者公會長',face:'雷',color:'#b33a2c',look:{cls:'Knight',hat:false,cape:'red',main:'1H_Sword',off:'Badge_Shield'},x:21,z:-17.5,place:'guild',anim:'idle',
    lines:['歡迎來到冒險者公會！王國各地都有需要你幫忙的委託。','任務板上的委託都和學習有關。完成委託，就能得到金幣喔。'],
    opts:[['查看任務板',()=>openQuestBoard()],['任務要怎麼完成？',()=>say('guild','接下委託後，到西邊的傳送門廣場，走進對應科目的傳送門。數學的「數字遺跡」已經開放了！打倒守衛後，記得回來找我領獎勵。')]]},
  {id:'market',name:'米拉',role:'市集商人',face:'米',color:'#b8862a',look:{cls:'Rogue',hat:false,cape:'brown',main:'Knife',off:'none'},x:28.5,z:5.5,place:'market',anim:'idle',
    lines:['來看看喔！好用的冒險道具，還有漂亮的披風染料！','答題卡關的時候，提示卷軸可是很有用的。'],
    opts:[['看看商品',()=>openShop('market')]]},
  {id:'smith',name:'鐵鎚老爹',role:'鐵匠',face:'鎚',color:'#5b5f66',look:{cls:'Barbarian',hat:false,cape:'none',main:'1H_Axe',off:'none'},x:18.5,z:28,place:'smith',anim:'chop',
    lines:['鏘！鏘！……喔，小冒險者，要讓裝備閃閃發光嗎？','附魔和光環很貴，但很帥。先努力完成任務存金幣吧！'],
    opts:[['看看附魔與特效',()=>openShop('smith')]]},
  {id:'tailor',name:'莉莉',role:'裁縫師',face:'莉',color:'#7a4fb0',look:{cls:'Rogue_Hooded',hat:false,cape:'purple',main:'none',off:'none'},x:-18.5,z:27.5,place:'tailor',anim:'idle',
    lines:['歡迎來到裁縫屋！髮型、五官、帽子、衣服、披風、武器，通通可以在這裡挑。','還沒擁有的造型可以先試穿，喜歡再用金幣買下來。','想換職業的話，要去榮譽殿堂找職業導師葛雷喔。'],
    opts:[['更換造型',()=>openCreator(true)]]},
  {id:'library',name:'索菲亞',role:'大圖書館館長',face:'索',color:'#2f5ea8',look:{cls:'Mage',hat:false,cape:'blue',main:'none',off:'Spellbook_open'},x:-21,z:-19,place:'library',anim:'idle',
    lines:['噓——這裡是大圖書館。影片室裡有各單元的重點複習影片。','出發冒險前先來複習，答題會更有把握。'],
    opts:[['觀看教學影片',()=>openLibrary()]]},
  {id:'portal',name:'梅林',role:'傳送門守護者',face:'梅',color:'#3a2a5a',look:{cls:'Mage',hat:true,cape:'purple',main:'2H_Staff',off:'none'},x:-29,z:2,place:'portal',anim:'cast',
    lines:['五座傳送門通往五個學科的世界。每個世界都有不同的試煉。','五座傳送門的魔力都已經聚集完成，國語、數學、英語、自然、社會都可以出發了！'],
    opts:[['介紹五個世界',()=>say('portal','國語是文字森林、數學是數字遺跡、英語是海港王國、自然是奇幻山谷、社會是時光古城。')]]},
  {id:'castle',name:'亞瑟',role:'騎士隊長',face:'亞',color:'#2f5ea8',look:{cls:'Knight',hat:true,cape:'blue',main:'2H_Sword',off:'none'},x:0,z:-43,place:'castle',anim:'idle',
    lines:['這裡是榮譽殿堂。每一位冒險者的成就，國王都看在眼裡。','達成成就可以獲得稱號，選一個最喜歡的掛在名字上吧！'],
    opts:[['查看成就與稱號',()=>openAch()],['我的學習報告',()=>openReport()],['怪物圖鑑',()=>openDex()]]},
  {id:'job',name:'葛雷',role:'職業導師',face:'職',color:'#8a6a2a',look:{cls:'Cleric',cape:'none',fx:'none',hero:Object.assign({},HERO_PRESET.Cleric,{skin:'#eab08a',color:'#c9c6c2',beard:'山羊鬍',hair:'中分長髮',left:null})},x:-7,z:-47,ry:0.35,place:'castle',anim:'idle',
    lines:['我是職業導師葛雷。每一種職業都有自己的特長，在戰鬥中會幫上不同的忙。',`想換一種職業冒險嗎？轉職要 ${JOB_PRICE} 金幣，換了之後也可以再換回來。`],
    opts:[['我想轉職',()=>openJob()],['各職業有什麼特性？',()=>say('job','騎士的盾會擋下第一次攻擊；戰士連擊時會打出重擊；魔法師會刪去錯的選項，還多一點時間；遊俠打贏能多拿金幣；兜帽遊俠有機會閃開攻擊；牧師連擊時能恢復愛心；吟遊詩人的歌能保住連擊。')]]},
  {id:'training',name:'布魯斯',role:'訓練教官',face:'布',color:'#3d8a4a',look:{cls:'Barbarian',hat:true,cape:'green',main:'2H_Axe',off:'none'},x:46,z:-26,place:'training',anim:'idle',
    lines:['想變強就要多練習！這裡是訓練場。','選一個單元、決定要練幾題，想練幾次都可以。答錯了就看解說，再來一次！'],
    opts:[['開始練習',()=>openPractice()]]},
  {id:'gate',name:'哈洛',role:'城門守衛',face:'哈',color:'#5b5f66',look:{cls:'Knight',hat:true,cape:'red',main:'1H_Sword',off:'Rectangle_Shield'},x:-5,z:47,place:'gate',anim:'idle',
    lines:['站住！……啊，是冒險者啊，請進。','城外很危險，沒有完成訓練之前，先別出城喔。'],opts:[]},
  {id:'guide',area:'math',name:'艾達',role:'試煉嚮導',face:'艾',color:'#b8862a',look:{cls:'Rogue_Hooded',hat:false,cape:'brown',main:'none',off:'none'},x:6,z:-392,ry:-0.4,anim:'idle',
    lines:['歡迎來到試煉之地！每個單元都有自己的試煉。','沿著小路往北走，五隻守衛怪物各守著一關。每個世界的怪物都不一樣喔！答對題目就能攻擊，答錯會被反擊。','答錯也沒關係，看懂解說，下一題就會更厲害！'],
    opts:[['這個單元的關卡',()=>{const U=MATH_UNITS[curUnit-1];say('guide',`這裡是「${U.title}」。`+U.stages.slice(0,4).map((s,i)=>`第 ${i+1} 關${s[1]}`).join('、')+`。最後的${U.stages[4][0]}會考綜合應用題，每題限時 1 分鐘！`);}],['闖關前複習重點',()=>guideTips()],['換一個單元',()=>{endTalk();openPortal(curSub);}],['回到學習冒險城',()=>exitMap()]]},
  {id:'petshop',name:'露露',role:'魔法寵物屋主人',face:'露',color:'#d9863a',look:{cls:'Rogue',hat:false,cape:'green',main:'none',off:'none'},x:-34,z:34,ry:-2.36,place:'pets',anim:'idle',
    lines:['歡迎來到魔法寵物屋！柵欄裡的奇幻小夥伴都在等新主人喔。','每隻寵物都有自己的魔法能力，帶在身邊就能幫你闖關。'],
    opts:[['領養寵物',()=>openPetShop()],['寵物怎麼進化？',()=>say('petshop','打倒怪物或每天摸摸牠，親密度就會增加。親密度到 25（5 顆愛心）時，在「我的寵物」裡按「進化」，寵物就會變成更帥氣的樣子！')],['寵物有什麼用？',()=>say('petshop','蘑菇球讓你多拿金幣、仙人掌勇士幫你擋一次攻擊、紫旋精靈會幫你刪掉錯的選項，小惡魔讓魔王關多一點時間，影翼精靈讓許願井的祝福加倍，寶石小龍有機會打出兩倍傷害！')]]},
  {id:'spirit',name:'露米',role:'書籤精靈．錯題本',face:'露',color:'#7a4fb0',look:{cls:'Mage',hat:true,cape:'purple',main:'1H_Wand',off:'Spellbook'},x:-35,z:-17,place:'library',anim:'cast',
    lines:['我是住在大圖書館的書籤精靈露米！','你在戰鬥、練習和每日挑戰中答錯的題目，我都幫你夾進錯題本了。同一題再答對 2 次，就能從錯題本畢業喔！'],
    opts:[['打開錯題本',()=>openWrongBook()],['查看學習報告',()=>openReport()]]},
  {id:'messenger',name:'小飛',role:'每日信差',face:'信',color:'#c2452f',look:{cls:'Rogue',hat:false,cape:'red',main:'none',off:'Throwable'},x:-10,z:-6,place:'well',anim:'idle',
    lines:['叮咚！我是信差小飛，每天都會送一封挑戰信來喔。','信裡有 3 題不同科目的題目，連續完成還有特別的獎勵！'],
    opts:[['收下今天的信',()=>openDaily()]]},
  {id:'wander',name:'卡洛',role:'流浪商人',face:'卡',color:'#6b4c2c',look:{cls:'Rogue_Hooded',hat:false,cape:'brown',main:'none',off:'none'},x:WANDER[0],z:WANDER[1],anim:'idle',
    lines:['嘿嘿，旅行者！我是流浪商人卡洛，每天都在城裡不同的地方擺攤。',`今天我在${WANDER[2]}。我帶的東西，市集可買不到喔！`],
    opts:[['看看推車',()=>openWander()]]},
  {id:'villager1',name:'湯姆',role:'村民',face:'湯',color:'#7a4b2a',look:{cls:'Barbarian',hat:false,cape:'none',main:'none',off:'Mug'},x:-8,z:10,anim:'walk',walk:[[-8,10],[8,12],[12,-8],[-10,-10]],
    lines:['今天天氣真好！你也是來冒險的嗎？','聽說許願井每天都可以許一次願，會得到小小的祝福喔。'],opts:[]},
  {id:'villager2',name:'安娜',role:'村民',face:'安',color:'#3d8a4a',look:{cls:'Rogue_Hooded',hat:false,cape:'green',main:'none',off:'none'},x:20,z:10,anim:'walk',walk:[[20,10],[8,24],[-14,22],[-20,4],[-12,-18],[10,-20]],
    lines:['我正要去市集買麵包。','公告欄上有老師貼的公告，記得常常去看看！'],opts:[]},
  {id:'v_scholar',name:'阿哲',role:'小書僮',face:'哲',color:'#2f5ea8',look:{cls:'Mage',hat:false,cape:'blue',main:'none',off:'Spellbook'},x:0,z:-14,anim:'walk',walk:[[0,-14],[0,-33],[5,-33],[5,-14]],
    lines:['我每天都在大圖書館和城堡之間跑來跑去！','你知道嗎？一天讀 15 分鐘，一年就讀了 90 個小時以上。','看影片的時候，試著先猜猜看答案，再看解說，會記得更牢喔。'],opts:[]},
  {id:'v_farmer',name:'老陳',role:'牧場主人',face:'陳',color:'#7a5a2a',look:{cls:'Barbarian',hat:false,cape:'brown',main:'none',off:'none'},x:16,z:4,anim:'walk',walk:[[16,4],[30,-10],[46,-10],[51,-5],[46,-10],[30,-10]],
    lines:['城東的牧場是我照顧的，牛和馬都很乖，去摸摸牠們吧！','草吃進牛的肚子，會變成牛奶。大自然真神奇！','照顧動物要有耐心，學習也是一樣喔。'],opts:[]},
  {id:'v_bard',name:'莉亞',role:'吟遊詩人',face:'莉',color:'#b33a6a',look:{cls:'Bard',cape:'none',fx:'none',hero:Object.assign({},HERO_PRESET.Bard,{skin:'#fbd7bd',color:'#c03a2b',hairacc:'馬尾',mouth:'大笑',cheek:'腮紅',eyes:'閃亮大眼'})},x:3,z:14,anim:'walk',walk:[[3,14],[3,42],[-6,42],[-6,20]],
    lines:['啦啦啦～我在城門和廣場之間唱歌。','把要背的東西編成歌或口訣，就比較容易記住喔！','累了就休息一下，眼睛看看遠方，等一下會學得更好。'],opts:[]},
  {id:'v_apprentice',name:'阿光',role:'魔法學徒',face:'光',color:'#7a4fb0',look:{cls:'Mage',hat:true,cape:'purple',main:'1H_Wand',off:'none'},x:-22,z:10,anim:'walk',walk:[[-22,10],[-34,12],[-35,-8],[-22,-8]],
    lines:['我在練習傳送魔法，可是常常傳錯地方……','梅林老師說：答錯不可怕，弄懂為什麼錯才是真正的魔法。','城西草地的羊駝毛好軟，去看看牠們吧！'],opts:[]},
];
function buildNPCs(){
  for(const d of NPC_DEFS){
    const ch=buildCharacter(d.look); ch.holder.position.set(d.x,0,d.z); scene.add(ch.holder);
    ch.def=d; ch.yaw=d.walk?0:(d.ry!==undefined?d.ry:Math.atan2(-d.x,-d.z)); ch.holder.rotation.y=ch.yaw; ch.home=ch.yaw; ch.wp=1; ch.pause=0;
    playOn(ch,d.anim==='walk'?'walk':d.anim==='chop'?'hammer':d.anim==='cast'?'cast':'idle');
    const tag=labelSprite(d.name,{bg:'rgba(42,27,18,.85)',size:.5}); tag.position.y=2.98; ch.holder.add(tag);
    const role=labelSprite(d.role,{bg:'rgba(226,176,74,.92)',fg:'#2a1b12',border:'rgba(0,0,0,0)',size:.36}); role.position.y=2.33; ch.holder.add(role);
    if(!d.walk) circ(d.x,d.z,.9);
    npcs.push(ch);
  }
}

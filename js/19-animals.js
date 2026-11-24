/* 學習冒險城．js/19-animals.js
 * 城鎮動物
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ---------- 城鎮裡自由走動的動物（Quaternius Ultimate Animated Animals，CC0） ---------- */
const ANIMAL_DEFS=[
  {m:'an_Cow',name:'乳牛哞哞',h:1.55,sp:1.1,pen:[54,-4,7],facts:['牛是反芻動物，會把吞下去的草再嚼一次。','牛有四個胃室，最大的叫瘤胃。']},
  {m:'an_Cow',name:'牛小花',h:1.45,sp:1.1,pen:[54,-4,7],facts:['乳牛每天要喝很多水，才能產出牛奶。']},
  {m:'an_Horse',name:'駿馬疾風',h:2.0,sp:1.6,pen:[54,-4,7],facts:['馬可以站著睡覺，因為腿部有特別的「鎖定」構造。','馬的眼睛長在頭的兩側，視野非常寬。']},
  {m:'an_Alpaca',name:'羊駝咩咩',h:1.7,sp:1.1,pen:[-57,9,6],facts:['羊駝原產在南美洲的安地斯山區。','羊駝的毛又軟又保暖，可以做成毛衣。']},
  {m:'an_Alpaca',name:'羊駝棉花糖',h:1.55,sp:1.1,pen:[-57,9,6],facts:['羊駝是群居動物，喜歡和同伴待在一起。']},
  {m:'an_Deer',name:'小鹿斑斑',h:1.6,sp:1.4,pen:[-30,-50,6],facts:['臺灣的梅花鹿身上有白色斑點，像梅花一樣。','鹿是草食動物，喜歡吃嫩葉和嫩芽。']},
  {m:'an_Fox',name:'狐狸阿橘',h:.62,sp:1.5,pen:[-30,-50,6],facts:['狐狸的大尾巴可以幫助平衡，冬天還能蓋住身體保暖。','狐狸的聽覺很好，能聽到雪地底下老鼠的聲音。']},
  {m:'an_ShibaInu',name:'柴犬小黃',h:.75,sp:1.6,pen:[9,36,5],facts:['狗的嗅覺比人類靈敏好幾萬倍。','狗會用搖尾巴、耳朵的位置來表達心情。']},
];
const animals=[];
function spawnAnimals(){
  for(const d of ANIMAL_DEFS){ const g=models[d.m]; if(!g) continue;
    const root=THREE.SkeletonUtils.clone(g.scene); root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false;}});
    const box=new THREE.Box3().setFromObject(root); const s=d.h/Math.max(.01,box.max.y-box.min.y); root.scale.setScalar(s); root.position.y=-box.min.y*s;
    const holder=new THREE.Group(); holder.add(root); const [cx,cz,r]=d.pen; const a0=Math.random()*6.28, r0=Math.random()*r*.8;
    holder.position.set(cx+Math.cos(a0)*r0,0,cz+Math.sin(a0)*r0); holder.rotation.y=Math.random()*6.28; scene.add(holder);
    const mixer=new THREE.AnimationMixer(root); const A={}; for(const c of g.animations) A[c.name]=mixer.clipAction(c);
    const an={d,holder,root,mixer,A,cur:null,yaw:holder.rotation.y,state:'idle',t:Math.random()*3,tx:0,tz:0,react:0};
    animPlay(an,'Idle'); animals.push(an);
    zones.push({id:'animal',ref:an,r:2.6+(d.h>1.2?.6:0),label:`摸摸${d.name}`,labelFn:()=>`摸摸${d.name}`,area:'town'});
  }
}
function animPlay(an,name,fade=.35){ const a=an.A[name]||an.A.Idle; if(!a||an.cur===a) return; a.reset().fadeIn(fade).play(); if(an.cur) an.cur.fadeOut(fade); an.cur=a; }
function updateAnimals(dt){
  if(area!=='town'||!animals.length) return;
  for(const an of animals){
    const p=an.holder.position, d=an.d, [cx,cz,R]=d.pen; an.t-=dt;
    const pd=Math.hypot(player.pos.x-p.x,player.pos.z-p.z);
    if(an.react>0){ an.react-=dt; const ta=Math.atan2(player.pos.x-p.x,player.pos.z-p.z); let a=ta-an.yaw; a=Math.atan2(Math.sin(a),Math.cos(a)); an.yaw+=a*Math.min(1,dt*4); if(an.react<=0) {an.state='idle';an.t=1.5;} }
    else if(an.state==='walk'){
      const dx=an.tx-p.x,dz=an.tz-p.z,L=Math.hypot(dx,dz);
      if(L<.3||an.t<=0||pd<1.6){ an.state=Math.random()<.45?'eat':'idle'; an.t=3+Math.random()*5; animPlay(an,an.state==='eat'?'Eating':'Idle'); }
      else { const sp=d.sp; const nx=p.x+dx/L*sp*dt, nz=p.z+dz/L*sp*dt; const q={x:nx,z:nz}; collide(q); p.x=q.x; p.z=q.z;
        let a=Math.atan2(dx,dz)-an.yaw; a=Math.atan2(Math.sin(a),Math.cos(a)); an.yaw+=a*Math.min(1,dt*3); animPlay(an,'Walk'); }
    } else if(an.t<=0){ const a=Math.random()*6.28, r=Math.random()*R; an.tx=cx+Math.cos(a)*r; an.tz=cz+Math.sin(a)*r; an.state='walk'; an.t=12; }
    for(const o of animals){ if(o===an) continue; const dx=p.x-o.holder.position.x, dz=p.z-o.holder.position.z, dd=Math.hypot(dx,dz), m=(an.d.h+o.d.h)*.6; if(dd<m&&dd>1e-3){ const k=(m-dd)*.5*Math.min(1,dt*4)/dd; p.x+=dx*k; p.z+=dz*k; } }
    an.holder.rotation.y=an.yaw;
    if(pd<40) an.mixer.update(dt);
  }
}
function petAnimal(an){
  an.react=2.2; an.state='react'; const hit=an.A.Idle_HitReact1; if(hit){ hit.reset().setLoop(THREE.LoopOnce,1); hit.clampWhenFinished=false; hit.fadeIn(.2).play(); if(an.cur&&an.cur!==hit) an.cur.fadeOut(.2); an.cur=hit; setTimeout(()=>{ if(an.cur===hit) animPlay(an,'Idle'); },900); }
  sfx('pop'); const f=an.d.facts[Math.random()*an.d.facts.length|0]; toast(`${an.d.name}：${f}`);
  save.petted=save.petted||{}; if(!save.petted[an.d.name]){ save.petted[an.d.name]=1; persist(); checkAch(); }
}

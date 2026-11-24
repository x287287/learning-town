/* 學習冒險城．js/25-dex-report.js
 * 怪物圖鑑、我的學習報告
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ======================= 怪物圖鑑 ======================= */
const DEX={
  math:['骷髏小兵','骷髏法師','骷髏盜賊','骷髏戰士','骷髏之王'],
  chinese:['綠苔球','叢林猴','刺刺球','青蛙劍士','蘑菇王'],
  english:['河豚','飛飛魚','小飛章','雙球飛魚','鯊魚人'],
  science:['觸手外星人','盔甲蜂','藍羽鳥','胡蘿蔔兔','進化飛龍'],
  social:['石像小鬼','古代巫師','忍者','部落戰士','獸人將軍'],
};
const DEX_ORDER=['chinese','math','english','science','social'];
function dexCount(){ const d=save.dex||{}; return Object.keys(d).filter(k=>d[k]>0).length; }
let thumbR=null; const thumbCache={};
function monThumb(model,boss){
  if(thumbCache[model]) return thumbCache[model]; if(!models[model]) return null;
  try{
    if(!thumbR){ thumbR=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true}); thumbR.setSize(160,160,false); thumbR.outputEncoding=THREE.sRGBEncoding; }
    const sc=new THREE.Scene(); sc.add(new THREE.HemisphereLight('#ffffff','#776655',1)); const dl=new THREE.DirectionalLight('#ffffff',.8); dl.position.set(3,5,4); sc.add(dl);
    const st={boss:!!boss}; const ch=model.startsWith('ch_')?buildMonster(st,model):buildUM(st,model); sc.add(ch.holder);
    if(ch.actions.idle){ ch.actions.idle.play(); ch.mixer.update(.4); }
    ch.holder.updateMatrixWorld(true); const b=new THREE.Box3().setFromObject(ch.holder); const c=b.getCenter(new THREE.Vector3()); const R=Math.max(b.max.y-b.min.y,1.2);
    const cam=new THREE.PerspectiveCamera(32,1,.05,100); cam.position.set(c.x+R*.55,c.y+R*.25,c.z+R*2.1); cam.lookAt(c);
    thumbR.render(sc,cam); return thumbCache[model]=thumbR.domElement.toDataURL('image/png');
  }catch(e){ return null; }
}
let dexTab='chinese';
function openDex(){
  const d=save.dex||{}; const tabs=DEX_ORDER.map(s=>{const n=DEX[s].filter((_,i)=>d[`${s}-${i+1}`]).length; return `<button class="tab" type="button" data-dx="${s}" aria-pressed="${dexTab===s}">${SUB[s].name}（${n}/5）</button>`;}).join('');
  const T=THEMES[dexTab];
  const cards=DEX[dexTab].map((nm,i)=>{ const k=`${dexTab}-${i+1}`, got=d[k]>0, boss=i===4; const img=got?monThumb(T.mon[i],boss):null;
    return `<div class="card dexcard ${got?'':'locked'}"><div class="glyph" style="background:${got?T.color:'#8a7a62'};${img?`background-image:url(${img});background-size:cover;background-position:center;`:''}width:64px;height:64px">${img?'':got?nm[0]:'？'}</div><div style="min-width:0"><h3>${got?nm:'？？？'}${boss?'<span class="chip" style="background:#8a1f16;margin-left:6px">魔王</span>':''}</h3><p>出沒：${T.map}．第 ${i+1} 關${got?`．已打倒 ${d[k]} 次`:'．還沒遇見'}</p></div></div>`;}).join('');
  openPanel(panelShell('怪物圖鑑',`已收集 ${dexCount()} / 25 種怪物。打倒一次就會登記；進過那張地圖後，圖鑑會顯示怪物的模樣。`,`<div class="tabs">${tabs}</div>${cards}`));
  veil.querySelectorAll('[data-dx]').forEach(b=>b.onclick=()=>{dexTab=b.dataset.dx;openDex();});
}

/* ======================= 我的學習報告 ======================= */
let repTab='math';
function openReport(){
  const S=(save.stats||{}); const subs=SUBJECTS.filter(s=>SUBJ_DATA[s.id]);
  const acc=e=>e&&e[0]?Math.round(e[1]/e[0]*100):null;
  const sumSub=sid=>{ let a=0,c=0; for(const e of Object.values(S[sid]||{})){a+=e[0];c+=e[1];} return [a,c]; };
  const tabs=subs.map(s=>{const t=sumSub(s.id);return `<button class="tab" type="button" data-rp="${s.id}" aria-pressed="${repTab===s.id}">${s.name}${t[0]?`．${acc(t)}%`:''}</button>`;}).join('');
  const D=SUBJ_DATA[repTab], st=S[repTab]||{}; const tot=sumSub(repTab);
  let weak=null; for(const [k,e] of Object.entries(st)){ const p=acc(e); if(e[0]>=3&&p<80&&(!weak||p<weak.p)){ const [u,si]=k.split('-').map(Number); weak={u,si,p,n:e[0]}; } }
  const wn=wrongList(repTab).length;
  const head=`<div class="scroll"><b>${SUB[repTab].name}</b>．${esc(D.book)}<br>${tot[0]?`作答 ${tot[0]} 題，答對 ${tot[1]} 題，答對率 <b style="color:var(--crimson)">${acc(tot)}%</b>`:'這一科還沒有作答紀錄，先去闖關或練習吧！'}<br>錯題本裡還有 ${wn} 題${weak?`<br>最需要加強：<b>${esc(unitShort(D.units[weak.u-1]))}．${weak.si===4?'綜合應用':esc(D.units[weak.u-1].stages[weak.si][1])}</b>（答對率 ${weak.p}%）`:''}</div>`;
  const rows=D.units.map(U=>{ let a=0,c=0,low=null; for(let si=0;si<5;si++){ const e=st[U.n+'-'+si]; if(!e) continue; a+=e[0]; c+=e[1]; const p=acc(e); if(e[0]>=2&&(!low||p<low.p)) low={si,p}; }
    const p=a?Math.round(c/a*100):null; const prog=unitProgress(U.n,repTab);
    return `<div class="card" style="grid-template-columns:50px 1fr"><div class="glyph" style="background:${unitDone(U.n,repTab)?'#3d8a4a':SUB[repTab].color}">${U.n}</div><div style="min-width:0"><h3 style="font-size:17px">${esc(unitShort(U))}</h3>
      <div class="prbar" style="margin:6px 0"><i style="width:${p||0}%;background:${p===null?'var(--brass)':p>=80?'#3d8a4a':p>=60?'#b8862a':'#b33a2c'}"></i></div>
      <p>${a?`答對率 ${p}%（${c}/${a}）`:'還沒作答'}．闖關 ${prog}/5 關${low&&low.p<80?`．加強：${low.si===4?'綜合應用':esc(U.stages[low.si][1])}`:''}</p></div></div>`; }).join('');
  openPanel(panelShell('我的學習報告','戰鬥、練習、錯題複習和每日挑戰的答題都會記錄在這裡。',`<div class="tabs">${tabs}</div>${head}<div style="display:flex;gap:8px;flex-wrap:wrap">${weak?'<button type="button" class="act" id="rpWeak">去練最需要加強的這一關</button>':''}${wn?'<button type="button" class="act" id="rpWrong">複習這一科的錯題</button>':''}</div>${rows}${coinLogHtml()}<p class="note">紀錄存在這台裝置的瀏覽器裡，記得定期備份。</p>`));
  if($('rpWeak')) $('rpWeak').onclick=()=>{ prSet.sub=repTab; prSet.unit=weak.u; prSet.stage=weak.si+1; useSub(repTab); const n=prPool(weak.u,weak.si+1).length; prSet.count=n>=10?10:0; startPractice(); };
  veil.querySelectorAll('[data-rp]').forEach(b=>b.onclick=()=>{repTab=b.dataset.rp;openReport();});
  if($('rpWrong')) $('rpWrong').onclick=()=>openWrongBook();
}

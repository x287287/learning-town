/* 學習冒險城．js/20-library.js
 * 大圖書館：影片播放器與圖解
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

let VIDEOS={};
/* ---------- 影片播放器 ---------- */
let vp=null, zhVoice=null, hasTTS=false;
function pickVoice(){ try{ const vs=speechSynthesis.getVoices(); zhVoice=vs.find(v=>/zh[-_]TW/i.test(v.lang))||vs.find(v=>/zh[-_](HK|Hant)/i.test(v.lang))||vs.find(v=>/^zh/i.test(v.lang))||null; hasTTS=!!zhVoice; }catch(e){ hasTTS=false; } }
try{ if('speechSynthesis' in window){ pickVoice(); speechSynthesis.onvoiceschanged=pickVoice; } }catch(e){}
function voiceOn(){ return hasTTS && save.voice!==false; }
function sceneMs(sc){ return Math.max(6500, sc.n.length*235); }
function unitMinutes(u){ const ms=VIDEOS[u].reduce((a,s)=>a+sceneMs(s)+900,0); return Math.max(1,Math.round(ms/60000)); }
function stopVideo(){ if(!vp) return; vp.timers.forEach(clearTimeout); vp.timers=[]; clearInterval(vp.tick); try{speechSynthesis.cancel();}catch(e){} vp=null; }

function openLibrary(){
  stopVideo();
  const subj=SUBJECTS.map(s=>{const D=SUBJ_DATA[s.id]; const ok=!!D; const tot=ok?D.units.length:0; const w=ok?D.units.filter(u=>save.watched&&save.watched[s.id+'-'+u.n]).length:0;
    return `<div class="card ${ok?'':'locked'}"><div class="glyph" style="background:${s.color}">${s.name[0]}</div><div style="min-width:0"><h3>${s.name}</h3><p>${ok?`${esc(D.book)}．${tot} 部單元重點影片．已看 ${w} / ${tot}`:'這一科的影片還在整理中'}</p></div>${ok?`<button class="act" type="button" data-sub="${s.id}">選擇</button>`:'<span class="chip" style="background:#8a7a62">尚未開放</span>'}</div>`;}).join('');
  openPanel(panelShell('大圖書館．影片室','選一個科目，看看學過的重點。',subj));
  veil.querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>{useSub(b.dataset.sub);openMathVideos();});
}
function openMathVideos(){
  stopVideo();
  const list=MATH_UNITS.map(u=>{const seen=save.watched&&save.watched[curSub+'-'+u.n];
    return `<div class="card"><div class="glyph" style="background:${seen?'#3d8a4a':'#2f5ea8'}">${u.n}</div><div style="min-width:0"><h3>${esc(u.title)}</h3><p>${VIDEOS[u.n].map(s=>s.t).join('．')}</p><div class="meta"><span class="chip" style="background:${seen?'#3d8a4a':'#8a7a62'}">${seen?'已看過':'還沒看'}</span><span>約 ${unitMinutes(u.n)} 分鐘．${VIDEOS[u.n].length} 段</span></div></div><button class="act" type="button" data-play="${u.n}">播放</button></div>`;}).join('');
  openPanel(panelShell(`${SUB[curSub].name}．重點複習影片`,`${esc(SUBJ_DATA[curSub].book)}。已經學過的單元，用幾分鐘把重點再看一次。`,`<button class="act ghost" type="button" id="libBack" style="color:var(--parchment);align-self:flex-start">← 回到科目</button>${list}`));
  $('libBack').onclick=()=>openLibrary();
  veil.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>openVideo(+b.dataset.play));
}
/* ======================= 圖書館影片：圖解（一步一步出現的示意圖） ======================= */
/* 每段影片可帶 d:[種類, ...參數]。畫在 400×300 的黑板座標上，回傳「步驟」陣列，播放時依序出現。 */
const DC={w:'#f4efe0',y:'#ffd76a',r:'#ff9a86',b:'#8fd0ff',g:'#9be39b',p:'#d7b3ff',o:'#ffb866'};
const DCY=['y','b','g','o','p','r'];
const dcol=c=>DC[c]||c||DC.w;
function dW(s){let w=0;for(const ch of String(s)) w+=ch.charCodeAt(0)>255?1:.56;return w;}
function dWrap(s,max){ const out=[]; for(const part of String(s).split('|')){ let cur='',w=0; const toks=part.match(/[A-Za-z0-9'’.,:;!?()+\-×÷=%°\/]+|\s+|./g)||[];
    for(const t of toks){ const tw=dW(t); if(w+tw>max&&cur.trim()){out.push(cur.trim());cur='';w=0;} cur+=t;w+=tw; } out.push(cur.trim()); } return out; }
function dT(x,y,s,o={}){ const z=o.s||14, ls=dWrap(s,o.w?o.w/z:99), lh=z*1.25, y0=y-(ls.length-1)*lh/2;
  return `<text x="${x}" y="${y0.toFixed(1)}" font-size="${z}" fill="${dcol(o.c)}" text-anchor="${o.a||'middle'}" dominant-baseline="central"${o.b?' font-weight="700"':''}>${ls.map((l,i)=>`<tspan x="${x}" dy="${i?lh:0}">${esc(l)}</tspan>`).join('')}</text>`; }
function dFit(s,w,h,max=16,min=8){ for(let z=max;z>=min;z--){ const ls=dWrap(s,w/z); if(ls.length*z*1.25<=h&&ls.every(l=>dW(l)*z<=w+1)) return z; } return min; }
function dB(x,y,w,h,s,c,o={}){ const z=dFit(s,w-10,h-6,o.s||16);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${o.f||'rgba(255,255,255,.07)'}" stroke="${dcol(c)}" stroke-width="2"/>`+(s?dT(x+w/2,y+h/2,s,{s:z,w:w-10,c:o.tc,b:o.b}):''); }
function dA(x1,y1,x2,y2,c,sw){ const a=Math.atan2(y2-y1,x2-x1); const p=t=>`${(x2+Math.cos(a+t)*9).toFixed(1)},${(y2+Math.sin(a+t)*9).toFixed(1)}`;
  return `<line class="dr" pathLength="1" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${dcol(c)}" stroke-width="${sw||2.5}" stroke-linecap="round"/><polygon points="${x2},${y2} ${p(Math.PI-.45)} ${p(Math.PI+.45)}" fill="${dcol(c)}"/>`; }
function dLink(P,Q,bw,bh,c){ const dx=Q[0]-P[0],dy=Q[1]-P[1],L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L; const t=Math.min((bw/2+3)/(Math.abs(ux)||1e-6),(bh/2+3)/(Math.abs(uy)||1e-6));
  return dA(P[0]+ux*t,P[1]+uy*t,Q[0]-ux*t,Q[1]-uy*t,c||'w'); }
function dTitled(x,y,w,h,s,c){ const [a,b]=String(s).split('|'); if(b===undefined) return dB(x,y,w,h,a,c);
  const z=dFit(a,w-8,h*.34,16), rest=s.slice(a.length+1), z2=dFit(rest,w-10,h*.52,14);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="rgba(255,255,255,.07)" stroke="${dcol(c)}" stroke-width="2"/>`+dT(x+w/2,y+h*.22,a,{s:z,c,b:1,w:w-8})+dT(x+w/2,y+h*.64,rest,{s:z2,w:w-10}); }
const DP={
  L:(x1,y1,x2,y2,c,dash)=>`<line ${dash?'stroke-dasharray="6 5"':'class="dr" pathLength="1"'} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${dcol(c)}" stroke-width="2.5" stroke-linecap="round"/>`,
  C:(cx,cy,r,c,f,op)=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f?dcol(f):'none'}" fill-opacity="${op||.3}" stroke="${dcol(c)}" stroke-width="2.5"${f?'':' class="dr" pathLength="1"'}/>`,
  T:(x,y,s,c,z,a)=>dT(x,y,s,{c,s:z||14,a,b:(z||14)>=18}),
  P:(pts,c,f,op)=>`<polygon points="${pts}" fill="${f?dcol(f):'none'}" fill-opacity="${op||.25}" stroke="${dcol(c)}" stroke-width="2.5" stroke-linejoin="round"/>`,
  A:(x1,y1,x2,y2,c,sw)=>dA(x1,y1,x2,y2,c,sw),
  R:(x,y,w,h,c,f,op)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${f?dcol(f):'none'}" fill-opacity="${op||.3}" stroke="${dcol(c)}" stroke-width="2"/>`,
  D:(d,c,f,op)=>`<path d="${d}" fill="${f?dcol(f):'none'}" fill-opacity="${op||.3}" stroke="${dcol(c)}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"${f?'':' class="dr" pathLength="1"'}/>`,
  B:(x,y,w,h,s,c)=>dTitled(x,y,w,h,s,c),
};
const DIA={
  svg(els){ const out=[]; for(const [s,t,...a] of els){ (out[s]=out[s]||[]).push(DP[t](...a)); } return Array.from(out,x=>(x||[]).join('')); },
  flow(items,opt,mid){ const n=items.length,out=[];
    if(opt==='loop'){ const bw=n>4?92:112,bh=50; const P=items.map((_,i)=>{const a=-Math.PI/2+i*2*Math.PI/n; return [200+Math.cos(a)*136,150+Math.sin(a)*98];});
      items.forEach((t,i)=>{ let s=dTitled(P[i][0]-bw/2,P[i][1]-bh/2,bw,bh,t,DCY[i%6]); if(i) s+=dLink(P[i-1],P[i],bw,bh); if(i===n-1) s+=dLink(P[i],P[0],bw,bh); out.push(s); });
      if(mid) out[0]+=dT(200,150,mid,{s:15,c:'o',b:1}); return out; }
    if(opt==='down'){ const bh=Math.min(54,(292-(n-1)*18)/n); const y0=150-(n*bh+(n-1)*18)/2;
      items.forEach((t,i)=>{ const y=y0+i*(bh+18); out.push((i?dA(200,y-16,200,y-3,'w'):'')+dTitled(30,y,340,bh,t,DCY[i%6])); }); return out; }
    const per=n<=4?n:Math.ceil(n/2), rows=n<=4?1:2, bw=(384-(per-1)*24)/per, bh=rows===1?92:76, ys=rows===1?[104]:[50,176];
    const pos=i=>{ const r=i<per?0:1, k=r?per-1-(i-per):i; return [8+k*(bw+24)+bw/2, ys[r]+bh/2]; };
    items.forEach((t,i)=>{ const [x,y]=pos(i); out.push((i?dLink(pos(i-1),[x,y],bw,bh):'')+dTitled(x-bw/2,y-bh/2,bw,bh,t,DCY[i%6])); }); return out; },
  cmp(cols){ const n=cols.length, w=(390-(n-1)*10)/n; return cols.map(([h,c,items],i)=>{ const x=5+i*(w+10); const ih=Math.min(64,232/items.length);
      return `<rect x="${x}" y="8" width="${w}" height="284" rx="10" fill="rgba(255,255,255,.06)" stroke="${dcol(c)}" stroke-width="2"/><rect x="${x}" y="8" width="${w}" height="42" rx="10" fill="${dcol(c)}" fill-opacity=".22"/>`
        +dT(x+w/2,29,h,{s:dFit(h,w-10,34,19),c,b:1,w:w-10})+items.map((t,k)=>dT(x+w/2,54+(238-ih*items.length)/2+ih*(k+.5),t,{s:dFit(t,w-12,ih-6,15),w:w-12})).join(''); }); },
  bars(items,note){ const n=items.length, max=Math.max(...items.map(i=>i[1])), H=note?248:284, rh=Math.min(54,H/n), y0=(H-rh*n)/2+6;
    const out=items.map(([l,v,show],i)=>{ const y=y0+i*rh, bw=Math.max(6,200*v/max); return dT(112,y+rh/2,l,{s:dFit(l,104,rh-6,14),a:'end',w:104})
      +`<rect x="120" y="${y+rh*.2}" width="${bw}" height="${rh*.6}" rx="5" fill="${dcol(DCY[i%6])}" fill-opacity=".8"/>`+dT(128+bw,y+rh/2,show===undefined?String(v):show,{s:15,a:'start',c:DCY[i%6],b:1}); });
    if(note) out.push(dT(200,278,note,{s:dFit(note,380,30,15),c:'y',b:1,w:380})); return out; },
  tl(items){ const n=items.length, gap=n>1?250/(n-1):0, y0=n>1?25:150;
    return items.map(([w,l],i)=>{ const y=y0+i*gap; return (i?`<line class="dr" pathLength="1" x1="104" y1="${y-gap}" x2="104" y2="${y}" stroke="${DC.w}" stroke-width="3"/>`:'')
      +`<circle cx="104" cy="${y}" r="7" fill="${DC.y}"/>`+dT(92,y,w,{s:dFit(w,86,40,16),a:'end',c:'y',b:1,w:86})+dT(120,y,l,{s:dFit(l,272,Math.max(24,gap-8),15),a:'start',w:272}); }); },
  eq(lines){ const n=lines.length, pl=l=>l.replace(/\[\[|\]\]/g,''); const z=Math.min(30,250/(n*1.5),...lines.map(l=>384/dW(pl(l)))), lh=z*1.5, y0=150-(n-1)*lh/2;
    return lines.map((l,i)=>`<text x="200" y="${y0+i*lh}" font-size="${z.toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="${DC.w}" font-weight="700">${l.split(/\[\[(.+?)\]\]/).map((p,j)=>j%2?`<tspan fill="${DC.y}">${esc(p)}</tspan>`:esc(p)).join('')}</text>`); },
  tree(root,kids){ const n=kids.length, w=(390-(n-1)*8)/n; const out=[dB(100,8,200,54,root,'y',{s:19,tc:'y',b:1})];
    kids.forEach((k,i)=>{ const x=5+i*(w+8); out.push(`<line class="dr" pathLength="1" x1="200" y1="62" x2="${x+w/2}" y2="128" stroke="${DC.w}" stroke-width="2"/>`+dTitled(x,128,w,150,k,DCY[(i+1)%6])); }); return out; },
  sent(parts,note){ let z=24; const lz=z=>Math.max(12,z*.58), wd=z=>parts.map(([t,l])=>Math.max(dW(t)*z*1.08,dW(l||'')*lz(z))+16); while(z>10&&wd(z).reduce((a,b)=>a+b,0)+(parts.length-1)*6>392) z--;
    const W=wd(z), tot=W.reduce((a,b)=>a+b,0)+(parts.length-1)*6; let x=200-tot/2; const yb=note?74:98;
    const out=parts.map(([t,l,c],i)=>{ const w=W[i]; const s=(l?`<rect x="${x}" y="${yb}" width="${w}" height="${z*1.9}" rx="7" fill="${dcol(c)}" fill-opacity=".16" stroke="${dcol(c)}" stroke-width="1.5"/>`:'')
        +dT(x+w/2,yb+z*.95,t,{s:z,c:l?c:'w',b:1})+(l?dT(x+w/2,yb+z*1.9+lz(z)*.95,l,{s:lz(z),c}):''); x+=w+6; return s; });
    if(note) out.push(dT(200,236,note,{s:dFit(note,380,84,17),c:'y',b:1,w:380})); return out; },
  pie(items,note){ const tot=items.reduce((a,i)=>a+i[1],0); let a=-Math.PI/2; const cx=115,cy=note?128:150,r=92;
    const out=items.map(([l,v,c],i)=>{ const b=a+2*Math.PI*v/tot, big=b-a>Math.PI?1:0; const p=`M${cx},${cy} L${(cx+r*Math.cos(a)).toFixed(1)},${(cy+r*Math.sin(a)).toFixed(1)} A${r},${r} 0 ${big} 1 ${(cx+r*Math.cos(b)).toFixed(1)},${(cy+r*Math.sin(b)).toFixed(1)} Z`; a=b;
      const ly=cy-((items.length-1)*34)/2+i*34; return `<path d="${p}" fill="${dcol(c||DCY[i%6])}" fill-opacity=".85" stroke="#1b332c" stroke-width="2"/><rect x="232" y="${ly-9}" width="18" height="18" rx="4" fill="${dcol(c||DCY[i%6])}"/>`+dT(258,ly,`${l} ${v}%`,{s:16,a:'start',b:1}); });
    if(note) out.push(dT(200,272,note,{s:dFit(note,380,40,15),c:'y',b:1,w:380})); return out; },
  tbl(heads,rows,fw){ const nc=heads.length, n=rows.length, rh=Math.min(50,284/(n+1)), y0=(300-rh*(n+1))/2; const f=fw||390/nc, cw=i=>i?(390-f)/(nc-1):f, cx=i=>5+(i?f+(i-1)*cw(1):0);
    const row=(cells,y,head)=>cells.map((t,i)=>`<rect x="${cx(i)}" y="${y}" width="${cw(i)}" height="${rh}" fill="${head?'rgba(255,215,106,.2)':'rgba(255,255,255,.05)'}" stroke="rgba(244,239,224,.45)" stroke-width="1.2"/>`
      +(t?dT(cx(i)+cw(i)/2,y+rh/2,t,{s:dFit(t,cw(i)-8,rh-6,head?16:15),c:head?'y':(i||nc<3?'w':'b'),b:head,w:cw(i)-8}):'')).join('');
    return [row(heads,y0,1),...rows.map((r,k)=>row(r,y0+rh*(k+1)))]; },
};
function drawDia(d){ try{ const f=DIA[d[0]]; if(!f) return ''; const st=f(...d.slice(1));
    return `<svg viewBox="0 0 400 300" role="img" aria-label="圖解">${st.map((s,k)=>`<g class="ds" data-s="${k}">${s}</g>`).join('')}</svg>`; }catch(e){ console.warn('dia',e); return ''; } }

function openVideo(u){
  stopVideo();
  const S=VIDEOS[u], U=MATH_UNITS[u-1];
  const chaps=S.map((s,i)=>`<button type="button" class="vchap" data-i="${i}">${i+1}. ${s.t}</button>`).join('');
  openPanel(panelShell(`${esc(U.title)}`,`重點複習影片．${S.length} 段．約 ${unitMinutes(u)} 分鐘`,`
    <div class="vscreen" id="vScreen">
      <div class="vhead"><span class="vno" id="vNo"></span><h3 id="vTitle"></h3></div>
      <div class="vbody" id="vBody"></div>
      <div class="vsub" id="vSub"></div>
      <div class="vend" id="vEnd" hidden></div>
    </div>
    <div class="vbar" id="vBar">${S.map((_,i)=>`<button type="button" class="vseg" data-i="${i}" aria-label="第 ${i+1} 段"><i></i></button>`).join('')}</div>
    <div class="vctl">
      <button type="button" class="act ghost" id="vPrev" style="color:var(--parchment)">上一段</button>
      <button type="button" class="act" id="vPlay">暫停</button>
      <button type="button" class="act ghost" id="vNext" style="color:var(--parchment)">下一段</button>
      <button type="button" class="act ghost" id="vVoice" style="color:var(--parchment);margin-left:auto"></button>
    </div>
    <div class="vchaps">${chaps}</div>
    <p class="note" id="vNote">${hasTTS?'':'這台裝置沒有中文語音，影片會用字幕播放。'}</p>
    <button class="act ghost" type="button" id="vBack" style="color:var(--parchment);align-self:flex-start">← 回到單元列表</button>`));
  veil.querySelector('.panel').classList.add('wide');
  vp={u,i:0,playing:true,timers:[],tick:null,t0:0,dur:1};
  $('vPrev').onclick=()=>{ if(vp.i>0) showScene(vp.i-1); else showScene(0); };
  $('vNext').onclick=()=>{ if(vp.i<S.length-1) showScene(vp.i+1); else finishVideo(); };
  $('vPlay').onclick=()=>togglePlay();
  $('vVoice').onclick=()=>{ if(!hasTTS){toast('這台裝置沒有中文語音');return;} save.voice=save.voice===false; persist(); renderVoiceBtn(); if(vp.playing) showScene(vp.i); };
  $('vBack').onclick=()=>openMathVideos();
  veil.querySelectorAll('.vseg,.vchap').forEach(b=>b.onclick=()=>{ vp.playing=true; showScene(+b.dataset.i); });
  renderVoiceBtn(); showScene(0);
}
function renderVoiceBtn(){ const b=$('vVoice'); if(b){ b.textContent=hasTTS?(voiceOn()?'語音：開':'語音：關'):'只有字幕'; b.disabled=!hasTTS; } }
function splitSentences(n){ return n.split(/(?<=[。！？；])/).map(s=>s.trim()).filter(Boolean); }
function showScene(i){
  if(!vp) return; vp.timers.forEach(clearTimeout); vp.timers=[]; clearInterval(vp.tick); try{speechSynthesis.cancel();}catch(e){}
  const S=VIDEOS[vp.u], sc=S[i]; vp.i=i;
  $('vEnd').hidden=true; $('vNo').textContent=`${i+1} / ${S.length}`; $('vTitle').textContent=sc.t;
  const vls=sc.L.map(l=>`<div class="vl">${l}</div>`).join(''), dg=sc.d?drawDia(sc.d):'';
  $('vScreen').classList.toggle('hasd',!!dg); $('vBody').classList.toggle('dg',!!dg);
  $('vBody').innerHTML=dg?`<div class="vdia">${dg}</div><div class="vtxt">${vls}</div>`:vls;
  veil.querySelectorAll('.vchap').forEach((b,k)=>b.setAttribute('aria-current',k===i?'true':'false'));
  veil.querySelectorAll('.vseg i').forEach((x,k)=>x.style.width=k<i?'100%':'0%');
  $('vPlay').textContent=vp.playing?'暫停':'播放';
  const sents=splitSentences(sc.n); $('vSub').textContent=vp.playing?sents[0]:sc.n;
  if(!vp.playing){ veil.querySelectorAll('.vl,.ds').forEach(e=>e.classList.add('on')); return; }
  const dur=sceneMs(sc); vp.dur=dur; vp.t0=performance.now();
  const lines=[...veil.querySelectorAll('.vl')];
  lines.forEach((e,k)=>vp.timers.push(setTimeout(()=>e.classList.add('on'),300+k*(dur*.82/lines.length))));
  const dss=[...veil.querySelectorAll('.ds')]; dss.forEach((e,k)=>vp.timers.push(setTimeout(()=>e.classList.add('on'),250+k*(dur*.8/dss.length))));
  // subtitles follow the narration by character position
  const starts=[]; let acc=0; for(const s of sents){starts.push(acc);acc+=s.length;}
  const showSentAt=(ch)=>{let k=0;for(let j=0;j<starts.length;j++) if(ch>=starts[j]) k=j; $('vSub').textContent=sents[k];};
  let spoken=false;
  if(voiceOn()){
    try{
      const onend=()=>{ if(vp&&vp.playing&&vp.i===i){ spoken=true; vp.timers.push(setTimeout(()=>autoNext(i),900)); } };
      if(curSub==='english'&&enVoice&&hasEn(sc.n)) speakMix(sc.n,{onb:c=>{ if(vp&&vp.i===i) showSentAt(c); },onend});
      else { const ut=new SpeechSynthesisUtterance(sc.n); ut.voice=zhVoice; ut.lang=zhVoice.lang; ut.rate=1;
      ut.onboundary=e=>{ if(vp&&vp.i===i) showSentAt(e.charIndex||0); };
      ut.onend=onend;
      speechSynthesis.speak(ut); }
    }catch(e){}
  }
  vp.tick=setInterval(()=>{ if(!vp) return; const f=Math.min(1,(performance.now()-vp.t0)/dur); const seg=veil.querySelectorAll('.vseg i')[i]; if(seg) seg.style.width=(f*100)+'%';
    if(!voiceOn()) showSentAt(Math.floor(f*acc)); },200);
  vp.timers.push(setTimeout(()=>{ if(!spoken) autoNext(i); }, voiceOn()?dur*1.9:dur+900));
}
function autoNext(i){ if(!vp||!vp.playing||vp.i!==i) return; const S=VIDEOS[vp.u]; if(i<S.length-1) showScene(i+1); else finishVideo(); }
function togglePlay(){ if(!vp) return; if(!$('vEnd').hidden){ vp.playing=true; showScene(0); return; }
  vp.playing=!vp.playing; if(vp.playing) showScene(vp.i); else { vp.timers.forEach(clearTimeout); vp.timers=[]; clearInterval(vp.tick); try{speechSynthesis.cancel();}catch(e){} veil.querySelectorAll('.vl,.ds').forEach(e=>e.classList.add('on')); $('vSub').textContent=VIDEOS[vp.u][vp.i].n; $('vPlay').textContent='播放'; } }
function finishVideo(){
  if(!vp) return; const u=vp.u; vp.timers.forEach(clearTimeout); vp.timers=[]; clearInterval(vp.tick); vp.playing=false;
  veil.querySelectorAll('.vseg i').forEach(x=>x.style.width='100%');
  save.watched=save.watched||{}; const wk=curSub+'-'+u; const first=!save.watched[wk]; save.watched[wk]=1; if(first) addCoins(10,'video');
  if(!save.ach.read){save.ach.read=1; toast('達成成就「小書蟲」！');}
  persist(); hud(); checkAch();
  const e=$('vEnd'); e.hidden=false;
  e.innerHTML=`<h3>看完了！</h3><p>${first?'第一次看完，獲得 10 金幣。':'複習完成。'}準備好就去${THEMES[curSub].map}挑戰「${MATH_UNITS[u-1].title}」吧！</p><div class="vendbtn"><button type="button" class="act" id="vGo">前往${THEMES[curSub].map}</button><button type="button" class="act ghost" id="vAgain" style="color:var(--parchment)">再看一次</button></div>`;
  $('vPlay').textContent='重播';
  $('vGo').onclick=()=>{ stopVideo(); enterMap(u,curSub); };
  $('vAgain').onclick=()=>{ vp.playing=true; showScene(0); };
}

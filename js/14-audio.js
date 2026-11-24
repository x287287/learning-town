/* 學習冒險城．js/14-audio.js
 * 音效與背景音樂（Web Audio 合成）、英語朗讀
 * js/ 裡的檔案共用同一個全域範圍，依 index.html 列出的順序載入。 */
'use strict';

/* ======================= 聲音、英語朗讀、連擊、星星、新題型 ======================= */
/* ---------- 音效與背景音樂：用 Web Audio 即時合成，不需要音檔 ---------- */
const SND_KEY='learning-town-sound';
let sndPref=(()=>{try{return Object.assign({sfx:1,bgm:0,vol:.7,enAuto:0},JSON.parse(lsGet(SND_KEY)||'{}'));}catch(e){return {sfx:1,bgm:0,vol:.7,enAuto:0};}})();
function saveSnd(){lsSet(SND_KEY,JSON.stringify(sndPref));}
let AC=null,sfxBus=null,bgmBus=null,noiseBuf=null;
function audioInit(){
  try{
    if(!AC){const C=window.AudioContext||window.webkitAudioContext; if(!C) return false; AC=new C();
      const comp=AC.createDynamicsCompressor(); comp.connect(AC.destination);
      sfxBus=AC.createGain(); sfxBus.connect(comp); bgmBus=AC.createGain(); bgmBus.gain.value=0; bgmBus.connect(comp);
      noiseBuf=AC.createBuffer(1,AC.sampleRate*.6,AC.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; }
    if(AC.state==='suspended') AC.resume();
    sfxBus.gain.value=sndPref.vol*.55; return true;
  }catch(e){ return false; }
}
['pointerdown','keydown','touchstart'].forEach(ev=>addEventListener(ev,()=>audioInit(),{passive:true}));
function tone(f,dur,o={}){
  if(!AC||!sndPref.sfx&&!o.bus) return; const t=AC.currentTime+(o.at||0);
  const osc=AC.createOscillator(), g=AC.createGain(); osc.type=o.type||'triangle'; osc.frequency.setValueAtTime(f,t);
  if(o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide,t+dur);
  const v=o.vol||.3; g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(v,t+(o.att||.01)); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  osc.connect(g); g.connect(o.bus||sfxBus); osc.start(t); osc.stop(t+dur+.05);
}
function noise(dur,o={}){
  if(!AC||!sndPref.sfx) return; const t=AC.currentTime+(o.at||0);
  const src=AC.createBufferSource(); src.buffer=noiseBuf; const f=AC.createBiquadFilter(); f.type=o.ft||'lowpass'; f.frequency.setValueAtTime(o.f||1200,t); if(o.f2) f.frequency.exponentialRampToValueAtTime(o.f2,t+dur);
  const g=AC.createGain(); g.gain.setValueAtTime(o.vol||.3,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  src.connect(f); f.connect(g); g.connect(sfxBus); src.start(t); src.stop(t+dur+.05);
}
const NOTE=n=>440*Math.pow(2,(n-69)/12);
const SFX={
  click(){tone(1100,.05,{type:'sine',vol:.08});},
  ok(c){const up=Math.min(c||0,8);[72,76,79].forEach((n,i)=>tone(NOTE(n+up),.16,{at:i*.07,vol:.22}));},
  no(){tone(330,.28,{type:'square',slide:150,vol:.12});tone(247,.3,{type:'square',slide:110,vol:.08,at:.1});},
  hit(){noise(.18,{f:2400,f2:300,vol:.35});tone(140,.18,{type:'sine',slide:60,vol:.35});},
  hurt(){noise(.22,{f:900,f2:200,vol:.3});tone(110,.25,{type:'sawtooth',slide:55,vol:.15});},
  coin(){tone(NOTE(83),.08,{type:'square',vol:.1});tone(NOTE(88),.25,{type:'square',vol:.1,at:.08});},
  win(){[60,64,67,72,76,79,84].forEach((n,i)=>tone(NOTE(n),.22,{at:i*.08,vol:.2}));tone(NOTE(84),.7,{at:.6,vol:.18});},
  lose(){[67,63,60,55].forEach((n,i)=>tone(NOTE(n),.35,{at:i*.2,vol:.18,type:'sine'}));},
  chest(){[72,79,84,88,91,96].forEach((n,i)=>tone(NOTE(n),.3,{at:i*.06,vol:.12,type:'sine'}));},
  ach(){[[72,0],[72,.12],[72,.24],[79,.36],[76,.6],[79,.72],[84,.84]].forEach(([n,a])=>tone(NOTE(n),.3,{at:a,vol:.16,type:'square'}));},
  rage(){tone(55,1.2,{type:'sawtooth',vol:.25,slide:40});noise(1,{f:400,f2:80,vol:.35});tone(NOTE(46),.5,{type:'square',vol:.12,at:.3});},
  tick(){tone(1500,.04,{type:'square',vol:.06});},
  combo(n){tone(NOTE(79+Math.min(n,12)),.12,{type:'square',vol:.1,at:.18});},
  pop(){noise(.5,{ft:'bandpass',f:3000,f2:600,vol:.25});tone(NOTE(84),.3,{type:'sine',vol:.08,at:.05});},
  whoosh(){noise(.6,{ft:'bandpass',f:400,f2:3000,vol:.12});},
};
function sfx(k,...a){ if(!sndPref.sfx) return; if(!audioInit()) return; try{SFX[k](...a);}catch(e){} }
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button');if(b&&!b.disabled&&!b.closest('#bOpts')&&!b.closest('.propts')) sfx('click');},true);

/* 背景音樂：城鎮（輕鬆）、戰鬥（緊張）、魔王狂暴（更快） */
const BGM={
  town:{bpm:92,prog:[[60,64,67],[57,60,64],[53,57,60],[55,59,62]],mel:[0,2,1,2,0,1,2,1],type:'triangle',bass:'sine'},
  battle:{bpm:126,prog:[[57,60,64],[53,57,60],[55,59,62],[52,56,59]],mel:[0,1,2,1,2,1,0,2],type:'square',bass:'triangle'},
  boss:{bpm:150,prog:[[57,60,64],[58,62,65],[57,60,64],[56,59,64]],mel:[2,1,0,1,2,2,1,0],type:'sawtooth',bass:'square'},
};
let bgmCur=null,bgmStep=0,bgmNext=0,bgmTimer=null;
function bgmWanted(){ if(!sndPref.bgm||document.hidden) return null; if(vp) return null; if(mode==='battle'&&battle) return battle.rage?'boss':'battle'; return 'town'; }
function bgmUpdate(){
  const w=bgmWanted(); if(w&&!audioInit()) return;
  if(!AC) return;
  bgmBus.gain.setTargetAtTime(w?sndPref.vol*.16:0,AC.currentTime,.4);
  if(w===bgmCur) return; bgmCur=w; bgmStep=0; bgmNext=AC.currentTime+.1;
  clearInterval(bgmTimer); if(!w) return;
  bgmTimer=setInterval(()=>{ const P=BGM[bgmCur]; if(!P) return; const st=60/P.bpm/2;
    while(bgmNext<AC.currentTime+.25){ const bar=Math.floor(bgmStep/8)%P.prog.length, k=bgmStep%8, ch=P.prog[bar];
      const at=bgmNext-AC.currentTime;
      if(k%4===0) tone(NOTE(ch[0]-12),st*3.5,{type:P.bass,vol:.22,at,bus:bgmBus});
      const n=ch[P.mel[(k+bar)%8]]+12+(k===7&&bar%2?2:0);
      if(k!==3&&k!==7||bgmCur!=='town') tone(NOTE(n),st*.9,{type:P.type,vol:P.type==='triangle'?.12:.05,at,bus:bgmBus});
      bgmNext+=st; bgmStep++; } },90);
}
setInterval(bgmUpdate,600);

function openSound(){
  const row=(id,label,desc)=>`<div class="card" style="grid-template-columns:1fr auto"><div><h3>${label}</h3><p>${desc}</p></div><button type="button" class="act ${sndPref[id]?'':'ghost'}" data-snd="${id}" style="${sndPref[id]?'':'color:var(--parchment)'}">${sndPref[id]?'開':'關'}</button></div>`;
  openPanel(panelShell('聲音設定','在教室裡可以把音樂關掉，只留音效；或全部關掉。',`
    ${row('sfx','音效','答對、答錯、打倒怪物、開寶箱時的聲音')}
    ${row('bgm','背景音樂','城鎮和戰鬥時的背景音樂')}
    ${row('enAuto','英語自動朗讀','英語的題目出現時，自動用英文唸一遍')}
    <div class="card" style="grid-template-columns:1fr"><div><h3>音量</h3><input type="range" min="0" max="1" step=".05" value="${sndPref.vol}" id="sndVol" style="width:100%"></div></div>
    <p class="note">英語朗讀使用裝置內建的英文語音${enVoice?'（這台裝置可以使用）':'（這台裝置目前找不到英文語音，會用預設語音）'}。題目旁邊的「🔊」按鈕可以隨時再聽一次。</p>`));
  veil.querySelectorAll('[data-snd]').forEach(b=>b.onclick=()=>{const k=b.dataset.snd;sndPref[k]=sndPref[k]?0:1;saveSnd();audioInit();bgmUpdate();if(k==='sfx'&&sndPref.sfx)sfx('ok');openSound();});
  $('sndVol').oninput=e=>{sndPref.vol=+e.target.value;saveSnd();audioInit();bgmUpdate();};
  $('sndVol').onchange=()=>sfx('coin');
}

/* ---------- 英語朗讀：英文用英文語音、中文用中文語音 ---------- */
let enVoice=null;
function pickEnVoice(){ try{ const vs=speechSynthesis.getVoices(); enVoice=vs.find(v=>/^en[-_]US/i.test(v.lang)&&/Google|Samantha|Microsoft/i.test(v.name))||vs.find(v=>/^en[-_]US/i.test(v.lang))||vs.find(v=>/^en/i.test(v.lang))||null; }catch(e){} }
try{ if('speechSynthesis' in window){ pickEnVoice(); speechSynthesis.addEventListener('voiceschanged',pickEnVoice); } }catch(e){}
function speechRuns(t){
  t=String(t).replace(/_{2,}/g,' ... ');
  const out=[]; const re=/[A-Za-z][A-Za-z0-9'’\-]*(?:[ \t,.!?;:"“”()]+[A-Za-z0-9][A-Za-z0-9'’\-]*)*[.!?]?/g; let last=0,m;
  while((m=re.exec(t))){ if(m.index>last) out.push({t:t.slice(last,m.index),en:0,at:last}); out.push({t:m[0],en:1,at:m.index}); last=m.index+m[0].length; }
  if(last<t.length) out.push({t:t.slice(last),en:0,at:last});
  return out.filter(r=>/[A-Za-z0-9㐀-鿿]/.test(r.t));
}
function speakMix(t,o={}){
  try{ if(!('speechSynthesis' in window)) return false; speechSynthesis.cancel();
    const runs=speechRuns(t); if(!runs.length) return false;
    runs.forEach((r,k)=>{ const ut=new SpeechSynthesisUtterance(r.t);
      if(r.en&&enVoice){ut.voice=enVoice;ut.lang=enVoice.lang;ut.rate=o.enRate||.9;} else if(zhVoice){ut.voice=zhVoice;ut.lang=zhVoice.lang;ut.rate=1;}
      if(o.onb) ut.onboundary=e=>o.onb(r.at+(e.charIndex||0));
      if(k===runs.length-1&&o.onend) ut.onend=o.onend;
      speechSynthesis.speak(ut); });
    return true;
  }catch(e){ return false; }
}
function canSpeak(){ return 'speechSynthesis' in window && !!(enVoice||zhVoice); }
function hasEn(t){ return /[A-Za-z]{2,}/.test(t); }
/* 在題目和選項旁加上朗讀按鈕（只有英語科） */
function addSpeak(qEl,optsEl,sub,qText){
  if(sub!=='english'||!canSpeak()||!qEl) return;
  const b=document.createElement('button'); b.type='button'; b.className='say'; b.textContent='🔊'; b.title='唸題目'; b.setAttribute('aria-label','唸題目');
  b.onclick=e=>{e.stopPropagation();speakMix(qText);}; qEl.prepend(b);
  if(optsEl) optsEl.querySelectorAll('.bopt').forEach(o=>{ const txt=o.dataset.say||o.textContent.replace(/^\d/,''); if(!hasEn(txt)) return;
    const s=document.createElement('span'); s.className='say-o'; s.textContent='🔊'; s.setAttribute('role','button'); s.setAttribute('aria-label','唸這個選項');
    s.onclick=e=>{e.stopPropagation();e.preventDefault();speakMix(txt);}; o.appendChild(s); });
  if(sndPref.enAuto) setTimeout(()=>speakMix(qText),250);
}

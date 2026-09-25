'use strict';
const $ = id => document.getElementById(id);
const KEY = 'malssum_dictation_v3';
const APP_VERSION = '2026.09.25.3';
const dateKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
let state;
try { state = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* Recover without removing old records. */ }
if (!state || typeof state !== 'object' || !state.entries || typeof state.entries !== 'object') state = {book:'gen',chapter:1,index:0,plan:'1year',pause:1000,font:23,entries:{}};
if (!BIBLE_BOOKS.some(b=>b.id===state.book)) state.book='gen';
if (!READING_PLANS[state.plan]) state.plan='1year';
state.planStart = validPlanDate(state.planStart) ? state.planStart : dateKey();
state.chapter=Math.max(1,Math.min(Number(state.chapter)||1,BIBLE_BOOKS.find(b=>b.id===state.book).totalChapters));
state.font=Math.max(18,Math.min(34,Number(state.font)||23));
state.pause=[1000,1800,2800,4000].includes(Number(state.pause))?Number(state.pause):1000;
state.index=Math.max(0,Number(state.index)||0);
const mobileSpeech=typeof navigator!=='undefined'&&(navigator.userAgentData?.mobile||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||'')||(/Macintosh/.test(navigator.userAgent||'')&&navigator.maxTouchPoints>1));
let soundActive=false, completedReplay=null;
let microphoneGranted=false, emptyRestarts=0;
let listening=false, recognition=null, generation=0, pauseTimer=null, restartTimer=null, interim='', starting=false;
const verses=()=>CHAPTER_DATA[`${state.book}_${state.chapter}`] || [];
const verseRange=(index=state.index)=>(CHAPTER_RANGES[`${state.book}_${state.chapter}`]||[]).find(([a,b])=>index+1>=a&&index+1<=b)||[index+1,index+1];
const verseKey=()=>{const [a,b]=verseRange();for(let v=a;v<=b;v++){const k=`${state.book}_${state.chapter}_${v}`;if(!state.entries[k]?.completed)return k;}return `${state.book}_${state.chapter}_${a}`;};
const entry=()=>state.entries[verseKey()];
const todayEntries=()=>Object.values(state.entries).filter(e=>e && e.completed && e.date===dateKey() && typeof e.text==='string' && e.text.trim());
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{$('storage-note').textContent='저장 공간이 부족해 새 기록을 저장하지 못했어요. 기록 이미지를 보관해 주세요.';$('status').textContent='기록 저장 공간을 확인해 주세요';}}
function status(message,hint){$('status').textContent=message;$('hint').textContent=hint;}
function validPlanDate(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const d=new Date(`${value}T12:00:00Z`);
  return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;
}
function planCalendar(start=state.planStart,today=dateKey(),plan=state.plan){
  const days=READING_PLANS[plan].days;
  const elapsed=Math.max(0,Math.floor((Date.parse(`${today}T00:00:00Z`)-Date.parse(`${start}T00:00:00Z`))/86400000));
  const end=new Date(Date.parse(`${start}T00:00:00Z`)+(days-1)*86400000).toISOString().slice(0,10);
  return {elapsed,remaining:Math.max(0,days-elapsed),day:Math.min(days,elapsed+1),end,overdue:Math.max(0,elapsed-days+1)};
}
function updateTotals(){
  const n=todayEntries().length;const goal=READING_PLANS[state.plan].dailyTargetVerses;const done=n>=goal;
  $('today-count').textContent=n;$('goal-count').textContent=`/ ${goal.toLocaleString('ko-KR')}절`;$('daily-progress').max=goal;$('daily-progress').value=n;
  $('goal-message').textContent=done?'✓ 오늘 분량 완료':`오늘 목표까지 ${goal-n}절 남았어요.`;
  $('daily-complete').hidden=!done;
  const calendar=planCalendar();
  $('elapsed-days').textContent=`${calendar.elapsed}일`;$('remaining-days').textContent=`${calendar.remaining}일`;
  $('plan-end').textContent=`${calendar.overdue?`종료일 ${calendar.overdue}일 지남`:`${calendar.day}일째 진행 중`} · 종료 예정 ${calendar.end}`;
  $('plan-start').value=state.planStart;$('plan-start').max=dateKey();
}
function advanceReadingPosition(){
  const next=verses().findIndex((_,i)=>i>state.index&&!state.entries[`${state.book}_${state.chapter}_${i+1}`]?.completed);
  if(next>=0){state.index=next;return true;}
  const b=BIBLE_BOOKS.findIndex(b=>b.id===state.book);
  if(state.chapter<BIBLE_BOOKS[b].totalChapters)state.chapter++;
  else if(b<BIBLE_BOOKS.length-1){state.book=BIBLE_BOOKS[b+1].id;state.chapter=1;}
  else return false;
  state.index=0;selectors();return true;
}
function selectors(){ $('book').replaceChildren(...BIBLE_BOOKS.map(b=>new Option(b.name,b.id)));$('book').value=state.book;const book=BIBLE_BOOKS.find(b=>b.id===state.book);$('chapter').replaceChildren(...Array.from({length:book.totalChapters},(_,i)=>new Option(`${i+1}장`,i+1)));$('chapter').value=state.chapter;$('plan').value=state.plan;$('pause').value=state.pause;$('pause-help').textContent='문장 중간에 자주 쉬면 길게 설정해 주세요.'; }
function render(){
  const list=verses();state.index=Math.min(state.index,Math.max(0,list.length-1));state.index=verseRange()[0]-1;document.documentElement.style.setProperty('--verse-size',`${state.font}px`);
  $('chapter-info').textContent=list.length?`${BIBLE_BOOKS.find(b=>b.id===state.book).name} ${state.chapter}장 · ${list.length}절${CHAPTER_HEADINGS[`${state.book}_${state.chapter}`]?' · '+CHAPTER_HEADINGS[`${state.book}_${state.chapter}`]:''}`:'본문 준비 중';
  $('verses').replaceChildren();
  if(!list.length){const p=document.createElement('p');p.className='empty';p.textContent='아직 이 장의 본문이 준비되지 않았어요. 창세기 1장 등 수록된 본문을 선택해 주세요.';$('verses').append(p);}
  list.forEach((text,i)=>{
    const [first,last]=verseRange(i);if(i+1!==first)return;const verseLabel=first===last?String(first):`${first}–${last}`;
    const active=i===state.index;const e=active?entry():state.entries[`${state.book}_${state.chapter}_${i+1}`];
    const card=document.createElement('section');card.id=`verse-${i}`;card.className=`verse ${active?'active':''} ${e?.completed?'done':''}`;
    const top=document.createElement('div');top.className='verse-top';const num=document.createElement('span');num.className='verse-num';num.textContent=e?.completed?`${verseLabel} ✓`:verseLabel;const body=document.createElement('div');body.className='verse-text';body.textContent=text;top.append(num,body);card.append(top);
    const d=document.createElement('div');d.className='dictation';d.id=`dictation-${i}`;d.hidden=!active&&!e?.text;const label=document.createElement('small');label.textContent=e?.completed?'나의 받아쓰기 · 읽음':'나의 받아쓰기';const t=document.createElement('span');t.id=`transcript-${i}`;t.textContent=e?.text||'';const partial=document.createElement('span');partial.id=`interim-${i}`;partial.className='interim';partial.textContent=active?interim:'';d.append(label,t,partial);if(active&&!e?.text&&!interim)t.textContent='읽는 목소리를 이곳에 남겨요.';card.append(d);
    if(!active){const select=document.createElement('button');select.className='select-verse';select.textContent='여기부터 읽기';select.onclick=()=>{stop();state.index=i;save();render();};card.append(select);}
    $('verses').append(card);
  });
  $('mic').disabled=!list.length;$('finish').disabled=!entry()?.text?.trim()||!!entry()?.completed;
  $('mic').textContent=starting&&!listening?'권한 요청 취소':listening?'Ⅱ 잠시 멈춤':'● 낭독 시작';$('status-dot').classList.toggle('live',listening);
  const b=BIBLE_BOOKS.findIndex(b=>b.id===state.book);$('previous').disabled=b===0&&state.chapter===1;$('next').disabled=b===BIBLE_BOOKS.length-1&&state.chapter===BIBLE_BOOKS[b].totalChapters;
  updateTotals();
}
function cancelTimer(){clearTimeout(pauseTimer);pauseTimer=null;}
function detach(){soundActive=false;generation++;clearTimeout(restartTimer);cancelTimer();if(recognition){const old=recognition;recognition=null;old.onend=old.onresult=old.onerror=old.onspeechstart=old.onspeechend=old.onsoundstart=old.onsoundend=null;old.abort();}}
function stop(){listening=false;starting=false;detach();interim='';save();render();status('잠시 쉬어가도 괜찮아요','받아쓴 내용은 보관되어 있어요. 시작하면 이어서 읽어요.');}
function scheduleBoundary(){
  cancelTimer();
  if(!listening||soundActive||!recognition?.hasFreshResult()||!entry()?.text?.trim()||interim)return;
  const key=verseKey(),token=generation;
  const delay=state.pause;
  pauseTimer=setTimeout(()=>{pauseTimer=null;if(token===generation&&key===verseKey()&&listening&&!soundActive&&!interim&&recognition?.hasFreshResult())complete();},delay);
}
function complete(){
  const e=entry();if(!e?.text?.trim()||e.completed)return;
  const before=todayEntries().length;
  cancelTimer();const [first,last]=verseRange();
  for(let v=first;v<=last;v++){const k=`${state.book}_${state.chapter}_${v}`;if(!state.entries[k]?.completed)state.entries[k]={text:e.text,completed:true,date:dateKey(),book:state.book,chapter:state.chapter,verse:v};}
  state.index=last-1;
  const goal=READING_PLANS[state.plan].dailyTargetVerses;
  const reachedGoal=before<goal&&todayEntries().length>=goal;
  const keepListening=listening;interim='';
  const previousChapter=`${state.book}_${state.chapter}`;
  const moved=advanceReadingPosition();if(moved)completedReplay={key:verseKey(),text:e.text};save();
  const changedChapter=previousChapter!==`${state.book}_${state.chapter}`;
  if(reachedGoal||!moved||!verses().length||changedChapter){listening=false;starting=false;detach();}
  else if(keepListening&&recognition)recognition.moveToVerse();
  render();
  if(reachedGoal){status('✓ 오늘 분량을 다 읽었어요!','다음 읽을 위치를 저장했어요. 더 읽으려면 낭독 시작을 눌러 주세요.');$('daily-complete').scrollIntoView({behavior:'smooth',block:'center'});}
  else if(!moved){status('마지막 본문까지 읽었어요','나의 기록에서 지금까지의 진도를 확인해 주세요.');}
  else if(changedChapter){status('다음 장에서 이어 읽어요',verses().length?'낭독 시작을 누르면 다음 장부터 이어집니다.':'다음 장의 본문이 아직 준비되지 않았어요. 읽은 기록은 저장되어 있어요.');}
  else{$(`verse-${state.index}`)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});if(keepListening){status(`${state.index+1}절을 듣고 있어요`,'한 절 뒤에 잠시 쉬어 주세요.');if(!recognition){clearTimeout(restartTimer);openRecognition(true);}}}
}
// Some mobile engines emit a growing phrase in several result slots.
// Fold only cumulative prefixes within one speech segment, not repeated words inside text.
function mergeGrowingPhrase(previous,next){
  if(!previous)return next;if(!next)return previous;
  if(next===previous||previous.startsWith(next+' '))return previous;
  if(next.startsWith(previous+' '))return next;
  return previous+' '+next;
}
function mergeRestartReplay(base,text){
  if(!base||!text)return base||text;
  if(text===base||text.startsWith(base+' '))return text;
  if(base.startsWith(text+' '))return base;
  const old=base.split(/\s+/),fresh=text.split(/\s+/);
  for(let n=Math.min(old.length,fresh.length);n>=2;n--){
    if(old.slice(-n).join(' ')===fresh.slice(0,n).join(' '))return [...old,...fresh.slice(n)].join(' ');
  }
  return base+' '+text;
}
// A service restart may replay the completed verse with new result indexes.
const speechLetters=text=>Array.from(text.matchAll(/[\p{L}\p{N}]/gu));
const speechIdentity=text=>speechLetters(text).map(m=>m[0].toLowerCase()).join('');
function withoutCompletedReplay(text,key){
  if(completedReplay?.key!==key||!text)return text;
  const previous=speechIdentity(completedReplay.text),letters=speechLetters(text);
  const current=letters.map(m=>m[0].toLowerCase()).join('');
  if(!current||!previous)return text;
  // Hold an ambiguous prefix/suffix rather than marking another verse read.
  if(previous.includes(current))return '';
  let overlap=0;
  if(current.startsWith(previous))overlap=previous.length;
  else for(let n=Math.min(previous.length,current.length);n>=8;n--){
    if(previous.slice(-n)===current.slice(0,n)){overlap=n;break;}
  }
  if(!overlap)return text;
  return text.slice(letters[overlap-1].index+letters[overlap-1][0].length).replace(/^[\s\p{P}]+/u,'');
}
function openRecognition(automatic=false){
  const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Speech){listening=false;starting=false;render();status('이 브라우저에서는 받아쓰기를 지원하지 않아요','음성 인식을 지원하는 브라우저에서 열어 주세요.');return;}
  const token=++generation;const r=new Speech();recognition=r;r.lang='ko-KR';r.continuous=true;r.interimResults=true;
  let key=verseKey(),base=entry()?.text||'',floor=0,seen=0,segment=0,slots=[],madeProgress=false,replay=automatic;
  let freshResult=false,speechEnded=false;
  r.hasFreshResult=()=>freshResult;
  r.moveToVerse=()=>{key=verseKey();base=entry()?.text||'';floor=seen;segment++;replay=false;freshResult=false;speechEnded=false;};
  r.onstart=()=>{if(token!==generation)return;starting=false;status(`${state.index+1}절을 듣고 있어요`,'단어가 달라도 괜찮아요. 한 절 뒤에 잠시 쉬어 주세요.');};
  r.onsoundstart=()=>{if(token===generation){soundActive=true;speechEnded=false;cancelTimer();}};
  r.onspeechstart=()=>{if(token===generation){segment++;soundActive=true;speechEnded=false;cancelTimer();}};
  r.onsoundend=r.onspeechend=()=>{if(token===generation){soundActive=false;speechEnded=true;scheduleBoundary();}};
  r.onresult=event=>{
    if(token!==generation||!listening||key!==verseKey())return;
    const from=Math.max(floor,event.resultIndex||0);
    seen=event.results.length;
    slots.length=seen;
    for(let i=from;i<seen;i++){
      const result=event.results[i];
      slots[i]={text:result[0].transcript.trim(),final:result.isFinal,segment:slots[i]?.segment??segment};
    }
    const groups=[];let partial='';
    for(let i=floor;i<seen;i++){
      const slot=slots[i];if(!slot)continue;
      if(completedReplay?.key===key&&speechIdentity(slot.text)===speechIdentity(completedReplay.text))continue;
      if(!slot.final){partial=mergeGrowingPhrase(partial,slot.text);continue;}
      const last=groups[groups.length-1];
      if(last&&last.segment===slot.segment)last.text=mergeGrowingPhrase(last.text,slot.text);
      else groups.push({segment:slot.segment,text:slot.text});
    }
    const rawFinal=groups.map(g=>g.text).filter(Boolean).join(' ');
    const final=withoutCompletedReplay(rawFinal,key);
    partial=withoutCompletedReplay(partial,key);
    const text=replay?mergeRestartReplay(base,final):[base,final].filter(Boolean).join(' ');
    const changed=text!==(entry()?.text||'')||partial!==interim;
    // Old/cumulative events must not reset silence timers or spill into the next verse.
    if(!changed)return;
    cancelTimer();interim=partial;
    if(final&&text!==(entry()?.text||''))freshResult=true;
    if(text.trim()){madeProgress=madeProgress||text!==(entry()?.text||'');state.entries[key]={...state.entries[key],text,completed:false};}
    const t=$(`transcript-${state.index}`);if(t)t.textContent=text+(text&&partial?' ':'');const p=$(`interim-${state.index}`);if(p)p.textContent=partial;
    $('finish').disabled=!text.trim();save();scheduleBoundary();
  };
  r.onerror=event=>{if(token!==generation)return;if(event.error==='no-speech')return;stop();status(event.error==='not-allowed'?'마이크 사용을 허용해 주세요':'받아쓰기가 잠시 멈췄어요',event.error==='not-allowed'?'주소창의 사이트 설정에서 마이크를 허용한 뒤 다시 시작해 주세요.':'연결과 마이크를 확인한 뒤 다시 시작해 주세요. 저장된 내용은 유지됩니다.');};
  r.onend=()=>{
    if(token!==generation||!listening)return;
    // A confirmed speech-end remains valid when Android closes the service
    // before the pause expires. An unexpected disconnect alone is not completion.
    const pendingBoundary=speechEnded&&freshResult&&!soundActive&&!interim&&pauseTimer!==null;
    const endedKey=verseKey(),endedText=entry()?.text;
    const endedToken=++generation;cancelTimer();soundActive=false;recognition=null;interim='';starting=false;
    if(pendingBoundary){
      render();status(`${state.index+1}절을 마무리하고 있어요`,'다음 절을 듣고 있어요 표시가 나오면 이어서 읽어 주세요.');
      pauseTimer=setTimeout(()=>{
        pauseTimer=null;
        if(endedToken!==generation||!listening||verseKey()!==endedKey||entry()?.text!==endedText)return;
        complete();
        if(listening&&endedToken===generation)openRecognition(true);
      },state.pause);
      return;
    }
    emptyRestarts=madeProgress?0:emptyRestarts+1;
    if(emptyRestarts>=3){stop();status('휴대폰에서 음성 연결이 반복해서 종료됐어요','잠시 후 낭독 시작을 다시 눌러 주세요. 받아쓴 내용은 보관되어 있어요.');return;}
    render();
    status('음성 연결을 다시 준비하고 있어요','듣고 있어요 표시가 나오면 이어서 읽어 주세요.');
    restartTimer=setTimeout(()=>{if(endedToken===generation&&listening)openRecognition(true);},800*Math.pow(2,Math.max(0,emptyRestarts-1)));
  };
  try{r.start();}catch{stop();status('마이크를 시작하지 못했어요','잠시 후 낭독 시작을 다시 눌러 주세요.');}
}
async function requestMicrophone(startAfterPermission=true){
  if(listening||starting||(startAfterPermission&&!verses().length))return;
  if(window.isSecureContext===false){status('마이크는 HTTPS 주소에서 사용할 수 있어요','현재 HTTP 주소에서는 권한 창을 열 수 없어요. HTTPS 주소로 다시 접속해 주세요.');return;}
  if(!(window.SpeechRecognition||window.webkitSpeechRecognition)){status('이 브라우저에서는 받아쓰기를 지원하지 않아요','Chrome 또는 Safari에서 다시 열어 주세요.');return;}
  if(typeof navigator==='undefined'||!navigator.mediaDevices?.getUserMedia){status('마이크 권한을 요청할 수 없어요','HTTPS 주소를 Chrome 또는 Safari에서 열고 다시 시도해 주세요.');return;}
  if(startAfterPermission&&microphoneGranted){start();return;}
  const token=++generation;
  starting=true;render();status('마이크 사용을 허용해 주세요',startAfterPermission?'브라우저 권한 창에서 허용을 누르면 낭독이 시작돼요.':'목소리 받아쓰기에 마이크를 사용해요. 허용 후 낭독 시작을 눌러 주세요.');
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    stream.getTracks().forEach(track=>track.stop());
    if(token!==generation)return;
    starting=false;microphoneGranted=true;
    if(startAfterPermission)start();
    else{render();status('마이크 사용 준비가 되었어요','낭독 시작을 누르면 받아쓰기를 시작해요.');}
  }catch(error){
    if(token!==generation)return;
    stop();
    if(error.name==='NotAllowedError'||error.name==='SecurityError')status('마이크 권한이 허용되지 않았어요','주소창의 사이트 설정과 휴대폰의 브라우저 앱 권한에서 마이크를 허용한 뒤 다시 눌러 주세요.');
    else if(error.name==='NotFoundError')status('마이크를 찾을 수 없어요','연결된 마이크를 확인한 뒤 다시 눌러 주세요.');
    else status('마이크를 사용할 수 없어요','마이크를 사용하는 다른 앱을 닫고 다시 눌러 주세요.');
  }
}
function start(){if(listening||starting||!verses().length)return;if(entry()?.completed){const first=verses().findIndex((_,i)=>!state.entries[`${state.book}_${state.chapter}_${i+1}`]?.completed);if(first<0){if(advanceReadingPosition()){save();render();if(verses().length)start();else status('다음 장의 본문 준비 중','읽은 기록과 이어 읽을 위치는 저장되어 있어요.');}else status('마지막 본문까지 읽었어요','나의 기록을 확인해 주세요.');return;}state.index=first;}completedReplay=null;emptyRestarts=0;starting=true;listening=true;render();status('마이크를 연결하고 있어요','마이크 권한 요청이 나오면 허용해 주세요.');openRecognition();}
function navigate(delta){stop();const b=BIBLE_BOOKS.findIndex(b=>b.id===state.book);let n=state.chapter+delta;if(n>BIBLE_BOOKS[b].totalChapters&&b<BIBLE_BOOKS.length-1){state.book=BIBLE_BOOKS[b+1].id;n=1;}else if(n<1&&b>0){state.book=BIBLE_BOOKS[b-1].id;n=BIBLE_BOOKS[b-1].totalChapters;}state.chapter=n;state.index=0;selectors();save();render();}
function ranges(){const groups=new Map();todayEntries().forEach(e=>{const k=`${BIBLE_BOOKS.find(b=>b.id===e.book)?.name||e.book} ${e.chapter}장`;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(e.verse);});return Array.from(groups,([k,v])=>`${k} ${v.sort((a,b)=>a-b).join(', ')}절`).join(' · ');}
// 제공된 개역개정 4판 파일의 절 번호 기준 (없음 표기 포함).
const TOTAL_BIBLE_VERSES = 31102;
function overallProgress(){
  const ids=new Set(Object.values(state.entries).filter(e=>e?.completed && typeof e.text==='string' && e.text.trim() && BIBLE_BOOKS.some(b=>b.id===e.book) && Number.isInteger(e.chapter) && Number.isInteger(e.verse)).map(e=>`${e.book}_${e.chapter}_${e.verse}`));
  const count=ids.size;
  const percent=Math.min(100,count/TOTAL_BIBLE_VERSES*100);
  return {count,percent,label:count>0&&percent<0.01?'< 0.01%':`${percent.toFixed(2)}%`};
}
let shareSnapshot=null, shareFile=null, shareRevision=0;
function captureShare(){return {date:dateKey(),today:todayEntries().length,ranges:ranges()||'첫 번째 낭독을 기다리고 있어요.',overall:overallProgress()};}
function shareText(snapshot){return `[말씀소리 · 나의 낭독 기록]\n${snapshot.date}\n오늘 읽은 말씀: ${snapshot.today}절\n${snapshot.ranges}\n성경 전체 진도: ${snapshot.overall.label}\n누적 ${snapshot.overall.count.toLocaleString('ko-KR')} / ${TOTAL_BIBLE_VERSES.toLocaleString('ko-KR')}절 (개역개정 기준)\n나의 속도로, 매일 한 걸음.`;}
function share(){
  updateTotals();shareSnapshot=captureShare();shareFile=null;const revision=++shareRevision;
  const s=shareSnapshot;
  $('share-date').textContent=s.date.replaceAll('-','. ');$('share-count').textContent=s.today;$('share-ranges').textContent=s.ranges;
  $('share-percent').textContent=s.overall.label;$('share-progress').max=TOTAL_BIBLE_VERSES;$('share-progress').value=s.overall.count;
  $('share-total').textContent=`누적 ${s.overall.count.toLocaleString('ko-KR')} / ${TOTAL_BIBLE_VERSES.toLocaleString('ko-KR')}절`;
  $('share-message').textContent='';$('share-copy-text').hidden=true;$('share-dialog').showModal();
  // Prepare before the user's share tap, preserving Web Share's user activation.
  createShareBlob(s).then(blob=>{if(revision===shareRevision && typeof File!=='undefined')shareFile=new File([blob],`말씀소리-${s.date}.png`,{type:'image/png'});}).catch(()=>{});
}
async function createShareBlob(s){
  await document.fonts.ready;
  const canvas=document.createElement('canvas');canvas.width=1080;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('canvas');
  ctx.font='26px sans-serif';const lines=[];let line='';
  for(const char of s.ranges){if(ctx.measureText(line+char).width>850){lines.push(line);line='';}line+=char;}if(line)lines.push(line);
  const progressY=845+lines.length*45;
  canvas.height=Math.max(1400,progressY+360);
  ctx.fillStyle='#edf1e7';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#284e43';
  ctx.font='28px sans-serif';ctx.fillText('말씀소리 · READING JOURNAL',90,120);ctx.font='26px sans-serif';ctx.fillText(s.date,90,190);
  ctx.font='54px "Noto Serif KR", serif';ctx.fillText('오늘도 말씀과 기도로',90,350);ctx.fillText('이만큼 거룩하여졌습니다',90,435);
  ctx.font='160px sans-serif';ctx.fillText(String(s.today),90,650);ctx.font='30px sans-serif';ctx.fillText('절을 소리 내어 읽었어요',90,715);
  ctx.font='26px sans-serif';lines.forEach((l,i)=>ctx.fillText(l,90,815+i*45));
  ctx.font='32px sans-serif';ctx.fillText(`성경 전체 진도  ${s.overall.label}`,90,progressY+45);
  ctx.fillStyle='#d4dfce';ctx.fillRect(90,progressY+75,900,12);ctx.fillStyle='#284e43';ctx.fillRect(90,progressY+75,900*s.overall.percent/100,12);
  ctx.font='26px sans-serif';ctx.fillText(`누적 ${s.overall.count.toLocaleString('ko-KR')} / 31,102절 · 개역개정 기준`,90,progressY+135);
  ctx.fillText('나의 속도로, 매일 한 걸음.',90,canvas.height-90);
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('image')),'image/png'));
}
async function download(){
  try{const s=shareSnapshot||captureShare();const blob=await createShareBlob(s);const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`말씀소리-${s.date}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);$('share-message').textContent='기록 이미지를 저장했어요. 카카오톡에서 사진으로 보내세요.';}
  catch{$('share-message').textContent='이미지를 저장하지 못했어요. 스크린샷으로 보관해 주세요.';}
}
async function copyShare(){
  const text=shareText(shareSnapshot||captureShare());
  try{await navigator.clipboard.writeText(text);$('share-message').textContent='공유 문구를 복사했어요. 카카오톡 대화창에 붙여넣어 주세요.';}
  catch{$('share-copy-text').value=text;$('share-copy-text').hidden=false;$('share-copy-text').select();$('share-message').textContent='아래 문구를 복사해 카카오톡에 붙여넣어 주세요.';}
}
async function shareToKakao(){
  const s=shareSnapshot||captureShare();
  if(!navigator.share){$('share-message').textContent='이 브라우저는 공유창을 지원하지 않아요. 이미지 저장 또는 공유 문구 복사 후 카카오톡으로 보내세요.';return;}
  try{
    const payload={title:'말씀소리 · 나의 낭독 기록',text:shareText(s)};
    if(shareFile && navigator.canShare?.({files:[shareFile]}))payload.files=[shareFile];
    await navigator.share(payload);
    $('share-message').textContent='공유창을 닫았어요.';
  }catch(error){$('share-message').textContent=error.name==='AbortError'?'공유를 취소했어요.':'공유창을 열지 못했어요. 이미지 저장 또는 공유 문구 복사를 이용해 주세요.';}
}
$('mic').onclick=()=>listening||starting?stop():requestMicrophone();$('finish').onclick=()=>complete();
$('book').onchange=e=>{stop();state.book=e.target.value;state.chapter=1;state.index=0;selectors();save();render();};
$('chapter').onchange=e=>{stop();state.chapter=Number(e.target.value);state.index=0;save();render();};
$('plan').onchange=e=>{stop();state.plan=e.target.value;save();updateTotals();};$('pause').onchange=e=>{state.pause=Number(e.target.value);save();scheduleBoundary();};
$('smaller').onclick=()=>{state.font=Math.max(18,state.font-2);save();render();};$('larger').onclick=()=>{state.font=Math.min(34,state.font+2);save();render();};
$('previous').onclick=()=>navigate(-1);$('next').onclick=()=>navigate(1);$('share-open').onclick=share;$('share-close').onclick=()=>$('share-dialog').close();$('download').onclick=download;$('kakao-share').onclick=shareToKakao;$('copy-share').onclick=copyShare;
window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden&&(listening||starting))stop();else updateTotals();});
selectors();render();save();
$('daily-share').onclick=share;
$('plan-start').onchange=e=>{const value=e.target.value;if(!validPlanDate(value)||value>dateKey()){e.target.value=state.planStart;return;}state.planStart=value;save();updateTotals();};

// Request access on entry without starting dictation.
setTimeout(()=>requestMicrophone(false),0);


// Show the version of the reader code actually loaded, without touching records.
async function checkAppUpdate(){
  const button=$('check-update');button.disabled=true;
  try{
    const response=await fetch('./public/version.json',{cache:'no-store'});
    if(!response.ok)throw new Error('version');
    const release=await response.json();
    if(typeof release.version!=='string'||!/^\d{4}\.\d{2}\.\d{2}\.\d+$/.test(release.version))throw new Error('version');
    const current=release.version===APP_VERSION;
    $('app-version').textContent=`적용 버전 ${APP_VERSION} · ${current?'최신 버전입니다':'새 버전이 있어요'}`;
    $('open-update').hidden=current;
    if(!current){const url=new URL(window.location.href);url.searchParams.set('v',release.version);$('open-update').href=url.href;}
  }catch{$('app-version').textContent=`적용 버전 ${APP_VERSION} · 업데이트 확인 불가`;}
  finally{button.disabled=false;}
}
$('app-version').textContent=`적용 버전 ${APP_VERSION}`;
$('check-update').onclick=checkAppUpdate;

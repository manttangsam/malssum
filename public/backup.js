'use strict';
const BACKUP_FORMAT = 'malssum-reading-backup';
const MAX_BACKUP_SIZE = 30 * 1024 * 1024;
let pendingRestore = null;
let backupSelection = 0;

function validateBackup(raw) {
  const fail = () => { throw new Error('말씀소리 백업 파일이 아니거나 내용이 손상되었어요. 원본 백업 파일을 다시 선택해 주세요.'); };
  if (!raw || raw.format !== BACKUP_FORMAT || raw.version !== 1 || !raw.state) fail();
  const s = raw.state;
  if (s.planStart !== undefined && !validPlanDate(s.planStart)) fail();
  const book = BIBLE_BOOKS.find(b => b.id === s.book);
  if (!book || !Number.isInteger(s.chapter) || s.chapter < 1 || s.chapter > book.totalChapters || !Number.isInteger(s.index) || s.index < 0 || s.index > 175) fail();
  if (!Object.hasOwn(READING_PLANS, s.plan) || ![500,800,1000,1800,2800,4000].includes(s.pause) || !Number.isFinite(s.font) || s.font < 18 || s.font > 34) fail();
  if (s.completedReadings !== undefined && (!Number.isInteger(s.completedReadings) || s.completedReadings < 0)) fail();
  if (s.cycleComplete !== undefined && typeof s.cycleComplete !== 'boolean') fail();
  if (!s.entries || typeof s.entries !== 'object' || Array.isArray(s.entries) || Object.keys(s.entries).length > 32000) fail();
  const entries = {};
  for (const [key, value] of Object.entries(s.entries)) {
    const match = /^([a-z0-9]+)_(\d+)_(\d+)$/.exec(key);
    if (!match) fail();
    const [,id,ch,v] = match;
    const b = BIBLE_BOOKS.find(b => b.id === id);
    if (!b || +ch < 1 || +ch > b.totalChapters || +v < 1 || +v > 176 || key !== `${id}_${+ch}_${+v}`) fail();
    if (!value || typeof value.text !== 'string' || !value.text.trim() || value.text.length > 100000 || typeof value.completed !== 'boolean') fail();
    const e = {text:value.text, completed:value.completed};
    if (e.completed) {
      if (value.book !== id || value.chapter !== +ch || value.verse !== +v || typeof value.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) fail();
      const date = new Date(`${value.date}T12:00:00Z`);
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value.date) fail();
      Object.assign(e, {book:id, chapter:+ch, verse:+v, date:value.date});
    }
    entries[key] = e;
  }
  return {book:s.book, chapter:s.chapter, index:s.index, plan:s.plan, pause:s.pause, font:s.font, planStart:s.planStart||dateKey(), completedReadings:s.completedReadings||0, cycleComplete:s.cycleComplete===true, entries};
}

function backupPayload() {
  return {format:BACKUP_FORMAT, version:1, exportedAt:new Date().toISOString(), state:JSON.parse(JSON.stringify(state))};
}
function backupFile(shareCompatible=false) {
  return new File([JSON.stringify(backupPayload(),null,2)], `말씀소리-전체기록-${dateKey()}.${shareCompatible?'txt':'json'}`, {type:shareCompatible?'text/plain':'application/json'});
}
function mergeBackup(current, incoming) {
  const entries = {...current.entries};
  for (const [key,e] of Object.entries(incoming.entries)) {
    // Preserve completed local records and drafts; an incoming completion can finish a local draft.
    if (!entries[key] || (!entries[key].completed && e.completed)) entries[key] = e;
  }
  return {...incoming, completedReadings:Math.max(current.completedReadings||0,incoming.completedReadings||0), cycleComplete:(current.cycleComplete||incoming.cycleComplete)&&Object.keys(entries).length>=TOTAL_BIBLE_VERSES, entries};
}
function backupStats(s) {
  const values = Object.values(s.entries);
  return {completed:values.filter(e=>e.completed).length, drafts:values.filter(e=>!e.completed).length};
}
function updateBackupInfo() {
  const stats = backupStats(state);
  $('backup-summary').textContent = `보관할 기록: 완독 누적 ${state.completedReadings||0}독 · 읽은 말씀 ${stats.completed}절 · 작성 중 ${stats.drafts}절`;
  let last;
  try { last = localStorage.getItem('malssum_backup_exported_at'); } catch {}
  $('backup-last').textContent = last ? `최근 백업 내보내기: ${new Date(last).toLocaleString('ko-KR')} · 외부 보관 여부도 확인해 주세요.` : '아직 백업 파일을 내보내지 않았어요.';
}
function noteExport() {
  try { localStorage.setItem('malssum_backup_exported_at',new Date().toISOString()); } catch {}
  updateBackupInfo();
}
function downloadBackup() {
  try {
    const file = backupFile();
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = file.name; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    noteExport();
    $('backup-message').textContent = '다운로드를 요청했어요. 다운로드 폴더의 파일을 다른 기기나 클라우드 드라이브에도 보관해 주세요.';
  } catch { $('backup-message').textContent = '백업 파일을 만들지 못했어요. 저장 공간을 확인하고 다시 시도해 주세요.'; }
}
async function shareBackup() {
  const message=$('backup-share-message');message.textContent='공유창을 준비하고 있어요…';
  try {
    if (!navigator.share) {
      message.textContent = '이 브라우저에서는 파일 보내기를 지원하지 않아요. 위의 백업 파일 저장을 이용해 주세요.';
      return;
    }
    const jsonFile=backupFile();
    const textFile=backupFile(true);
    const file=navigator.canShare?.({files:[jsonFile]})?jsonFile:navigator.canShare?.({files:[textFile]})?textFile:null;
    if(!file){message.textContent='이 브라우저에서는 백업 파일을 다른 앱으로 보낼 수 없어요. 위의 백업 파일 저장을 이용해 주세요.';return;}
    await navigator.share({files:[file], title:'말씀소리 전체 기록 백업', text:'말씀소리 전체 기록 백업 파일입니다.'});
    noteExport();
    message.textContent = '공유창을 닫았어요. 카카오톡이나 선택한 곳에 파일이 도착했는지 확인해 주세요.';
  } catch (error) { message.textContent = error.name === 'AbortError' ? '백업 보내기를 취소했어요.' : '백업 파일을 보내지 못했어요. 위의 백업 파일 저장을 이용해 주세요.'; }
}
async function selectBackup(file) {
  const selection = ++backupSelection;
  pendingRestore = null;
  $('backup-preview').hidden = true;
  $('backup-message').textContent = '';
  if (!file) return;
  try {
    if (file.size > MAX_BACKUP_SIZE) throw new Error('파일이 너무 커요. 30MB 이하의 말씀소리 백업 파일을 선택해 주세요.');
    const incoming = validateBackup(JSON.parse(await file.text()));
    if (selection !== backupSelection) return;
    pendingRestore = incoming;
    const stats = backupStats(incoming);
    const combined = backupStats(mergeBackup(state,incoming));
    $('backup-preview-text').textContent = `백업: 읽은 말씀 ${stats.completed}절 · 작성 중 ${stats.drafts}절. 합친 뒤 총 ${combined.completed}절. 이어 읽을 위치: ${BIBLE_BOOKS.find(b=>b.id===incoming.book).name} ${incoming.chapter}장 ${incoming.index+1}절.`;
    $('backup-preview').hidden = false;
  } catch (error) {
    if (selection !== backupSelection) return;
    $('backup-message').textContent = error instanceof SyntaxError ? '파일 내용을 읽을 수 없어요. 원본 백업 파일을 다시 선택해 주세요.' : error.message;
  }
}
function restoreBackup() {
  if (!pendingRestore) return;
  const merged = mergeBackup(state,pendingRestore);
  try {
    // Save before replacing live state; quota failures leave all active records intact.
    localStorage.setItem(KEY,JSON.stringify(merged));
  } catch {
    $('backup-message').textContent = '저장 공간이 부족해 복원하지 못했어요. 현재 기록은 유지됩니다.';
    return;
  }
  state = merged;
  pendingRestore = null;
  $('backup-preview').hidden = true;
  selectors(); render(); updateBackupInfo();
  $('backup-message').textContent = '기록을 합쳐 복원했어요. 이 창을 닫고 읽던 곳에서 이어가세요.';
}
$('backup-open').onclick = () => {
  stop(); pendingRestore = null; backupSelection++;
  $('backup-file').value = ''; $('backup-preview').hidden = true; $('backup-message').textContent = '';
  $('backup-share-message').textContent = '';
  updateBackupInfo(); $('backup-dialog').showModal();
};
$('backup-close').onclick = () => { backupSelection++; $('backup-dialog').close(); };
$('backup-download').onclick = downloadBackup;
$('backup-share').onclick = shareBackup;
$('backup-file').onchange = event => selectBackup(event.target.files[0]);
$('backup-restore').onclick = restoreBackup;

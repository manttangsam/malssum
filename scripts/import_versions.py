import html
import json
import re
import urllib.parse
import urllib.request
import zipfile
import time
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "bibles"
OUT.mkdir(parents=True, exist_ok=True)

BOOK_IDS = [
    'gen','exo','lev','num','deu','jos','jdg','rut','1sa','2sa','1ki','2ki','1ch','2ch','ezr','neh','est','job','psa','pro','ecc','sng','isa','jer','lam','ezk','dan','hos','joe','amo','oba','jon','mic','nah','hab','zep','hag','zec','mal','mat','mar','luk','joh','act','rom','1co','2co','gal','eph','php','col','1th','2th','1ti','2ti','tit','phm','heb','jas','1pe','2pe','1jo','2jo','3jo','jud','rev'
]
CHAPTER_COUNTS = [50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22]

def write_version(version_id, label, language, chapters, source):
    expected = sum(CHAPTER_COUNTS)
    if len(chapters) != expected:
        missing = [f"{book}_{ch}" for book,count in zip(BOOK_IDS,CHAPTER_COUNTS) for ch in range(1,count+1) if f"{book}_{ch}" not in chapters]
        raise ValueError(f"{version_id}: expected {expected} chapters, got {len(chapters)}; missing {missing[:10]}")
    empty = [key for key, verses in chapters.items() if not verses or any(not text.strip() for text in verses)]
    if empty:
        raise ValueError(f"{version_id}: empty chapter/verse in {empty[:10]}")
    payload = {"id":version_id,"label":label,"language":language,"source":source,"totalVerses":sum(map(len,chapters.values())),"chapters":chapters}
    (OUT / f"{version_id}.json").write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print(version_id, len(chapters), payload['totalVerses'], OUT / f"{version_id}.json")

def import_modern():
    lines = (ROOT / "현대인의_성경.txt").read_text(encoding="cp949").splitlines()
    verse_re = re.compile(r"^(\d{2})\s+(\d+):(\d+)\s+(.*)$")
    values = {}
    for line in lines:
        match = verse_re.match(line.rstrip())
        if not match:
            continue
        book_no, chapter, verse, text = match.groups()
        if int(chapter) == 0:
            continue
        key = f"{BOOK_IDS[int(book_no)-1]}_{int(chapter)}"
        values[(key,int(verse))] = text.strip()
    chapters = {}
    for book,count in zip(BOOK_IDS,CHAPTER_COUNTS):
        for chapter in range(1,count+1):
            key=f"{book}_{chapter}"
            verses={v:t for (k,v),t in values.items() if k==key}
            chapters[key]=[verses[v] for v in range(1,max(verses)+1)]
    write_version('klb','현대인의 성경','ko',chapters,'현대인의_성경.txt')

def import_esv():
    chapters={}
    with zipfile.ZipFile(ROOT / "ESV Bible.zip") as archive:
        names=sorted((name for name in archive.namelist() if re.fullmatch(r"by_book/\d{2}_.+\.md",name)),key=lambda name:int(Path(name).name[:2]))
        if len(names)!=66:
            raise ValueError(f"ESV: expected 66 books, got {len(names)}")
        for book_index,name in enumerate(names):
            text=archive.read(name).decode('utf-8-sig')
            current=None
            verse_map={}
            for raw in text.splitlines():
                chapter_match=re.match(r"^## Chapter (\d+)\s*$",raw)
                if chapter_match:
                    if current is not None:
                        key=f"{BOOK_IDS[book_index]}_{current}"
                        chapters[key]=[verse_map[v] for v in range(1,max(verse_map)+1)]
                    current=int(chapter_match.group(1));verse_map={};continue
                verse_match=re.match(r"^(\d+)\.\s+(.*)$",raw)
                if verse_match and current is not None:
                    verse_map[int(verse_match.group(1))]=verse_match.group(2).strip()
            if current is not None:
                key=f"{BOOK_IDS[book_index]}_{current}"
                chapters[key]=[verse_map[v] for v in range(1,max(verse_map)+1)]
    write_version('esv','ESV','en',chapters,'ESV Bible.zip')

def import_easy():
    chapters={}
    archive_path=next(path for path in ROOT.glob('*.zip') if path.name != 'ESV Bible.zip')
    fallback=json.loads((OUT/'klb.json').read_text(encoding='utf-8'))['chapters']
    with zipfile.ZipFile(archive_path) as archive:
        # The archive stores all 39 Old Testament files followed by all 27 New
        # Testament files; book numbers restart inside each folder.
        names=archive.namelist()
        if len(names)!=66:
            raise ValueError(f"Easy Bible: expected 66 books, got {len(names)}")
        for book_index,name in enumerate(names):
            text=archive.read(name).decode('cp949')
            values={}
            for raw in text.splitlines():
                match=re.match(r'^\S+?(\d+):(\d+)(?:\s+(.*))?$',raw.strip())
                if match:
                    chapter,verse,body=match.groups()
                    values[(int(chapter),int(verse))]=(body or '').strip()
            for chapter in range(1,CHAPTER_COUNTS[book_index]+1):
                verses={verse:body for (ch,verse),body in values.items() if ch==chapter}
                if not verses or sorted(verses)!=list(range(1,max(verses)+1)):
                    raise ValueError(f"Easy Bible verses missing: {BOOK_IDS[book_index]} {chapter}")
                for verse,body in verses.items():
                    if not body:
                        verses[verse]=fallback[f'{BOOK_IDS[book_index]}_{chapter}'][verse-1]
                chapters[f'{BOOK_IDS[book_index]}_{chapter}']=[verses[verse] for verse in range(1,max(verses)+1)]
    write_version('easy','쉬운성경','ko',chapters,f'{archive_path.name} / 빈 절 8개는 현대인의 성경으로 보완')

def strip_tags(value):
    return html.unescape(re.sub(r"<[^>]+>","",value)).replace('\xa0',' ').strip()

def fetch_kjv_chapter(args):
    book_no, chapter = args
    cache_dir=ROOT/'tmp'/'hkjv-pages';cache_dir.mkdir(parents=True,exist_ok=True)
    cache_file=cache_dir/f'{book_no:02d}-{chapter:03d}.html'
    query=urllib.parse.urlencode({'r_bn':'hkjv','book':book_no,'cn':chapter})
    if cache_file.exists():
        page=cache_file.read_text(encoding='utf-8')
    else:
        request=urllib.request.Request(f"https://new.keepbible.com/Bible/Book?{query}",headers={'User-Agent':'MalssumBibleImporter/1.0'})
        for attempt in range(6):
            try:
                with urllib.request.urlopen(request,timeout=45) as response:
                    page=response.read().decode('utf-8')
                cache_file.write_text(page,encoding='utf-8')
                break
            except Exception:
                if attempt==5: raise
                time.sleep(2**attempt)
    block_match=re.search(r'<ol class="bible_txt">(.*?)</ol>',page,re.S)
    if not block_match:
        raise ValueError(f"KJV block missing: {book_no}:{chapter}")
    verses={}
    for paragraph in re.findall(r'<p>(.*?)</p>',block_match.group(1),re.S):
        number=re.search(r'<span class="num">(\d+)</span>',paragraph)
        if number:
            verses[int(number.group(1))]=strip_tags(re.sub(r'<span class="num">\d+</span>','',paragraph,1))
    if not verses or sorted(verses)!=list(range(1,max(verses)+1)):
        raise ValueError(f"KJV verses missing: {book_no}:{chapter} {sorted(verses)[:3]}..{sorted(verses)[-3:] if verses else []}")
    return f"{BOOK_IDS[book_no-1]}_{chapter}",[verses[v] for v in range(1,max(verses)+1)]

def import_kjv():
    jobs=[(book_no,chapter) for book_no,count in enumerate(CHAPTER_COUNTS,1) for chapter in range(1,count+1)]
    chapters={}
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures={pool.submit(fetch_kjv_chapter,job):job for job in jobs}
        for index,future in enumerate(as_completed(futures),1):
            key,verses=future.result();chapters[key]=verses
            if index%100==0: print('hkjv fetched',index,'/',len(jobs))
    ordered={f"{book}_{chapter}":chapters[f"{book}_{chapter}"] for book,count in zip(BOOK_IDS,CHAPTER_COUNTS) for chapter in range(1,count+1)}
    write_version('hkjv','킹제임스 흠정역','ko',ordered,'큰글자 성경 신구약 부록 2025 최적화.pdf / new.keepbible.com')

if __name__ == '__main__':
    jobs={'modern':import_modern,'esv':import_esv,'easy':import_easy,'hkjv':import_kjv}
    selected=sys.argv[1:] or list(jobs)
    for job in selected:
        jobs[job]()

"""Import the supplied CP949 Bible, preserving verse ranges and continuations."""
import json
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
target = root / 'public/bible-data.js'
old = target.read_text(encoding='utf-8')
books = re.findall(r"id: '([^']+)', name: '([^']+)', totalChapters: (\d+)", old)
abbr = '창 출 레 민 신 수 삿 룻 삼상 삼하 왕상 왕하 대상 대하 스 느 에 욥 시 잠 전 아 사 렘 애 겔 단 호 욜 암 옵 욘 미 나 합 습 학 슥 말 마 막 눅 요 행 롬 고전 고후 갈 엡 빌 골 살전 살후 딤전 딤후 딛 몬 히 약 벧전 벧후 요일 요이 요삼 유 계'.split()
mapping = dict(zip(abbr, [b[0] for b in books], strict=True))
chapters, ranges, headings = {}, {}, {}
last_key = None
continuations = 0
source = Path(sys.argv[1]).read_text(encoding='cp949')
address = re.compile(r'(?:' + '|'.join(sorted(abbr, key=len, reverse=True)) + r')\d+:\d+')
def separate(line):
    positions = [m.start() for m in address.finditer(line)
                 if m.start() and line.rfind('<', 0, m.start()) <= line.rfind('>', 0, m.start())]
    for pos in reversed(positions):
        line = line[:pos] + '\n' + line[pos:]
    return line
source = '\n'.join(separate(line) for line in source.splitlines())
for number, line in enumerate(source.splitlines(), 1):
    match = re.fullmatch(r'(\D+)(\d+):(?:(\d+)(?:-(\d+))?\s+)?(.+)', line)
    if not match:
        raise ValueError(f'Unrecognized line {number}')
    book, chapter, first, end, text = match.groups()
    key = f'{mapping[book]}_{int(chapter)}'
    if first is None:
        if text in ['제이권', '제삼권', '제사권', '제오권']:
            headings[key] = text
        else:
            assert key == last_key, (number, key)
            chapters[key][-1] += ' ' + text
            continuations += 1
        continue
    first, end = int(first), int(end or first)
    verses = chapters.setdefault(key, [])
    if key == 'act_24' and first == 8 and len(verses) == 6:
        verses.append('(없음 · 제공 파일의 6절에 6하반–8상반 없음으로 표기)')
    assert first == len(verses) + 1, (number, key, first, len(verses))
    assert end >= first
    verses.extend([text] * (end - first + 1))
    if end > first:
        ranges.setdefault(key, []).append([first, end])
    last_key = key
for book, _, count in books:
    assert all(f'{book}_{ch}' in chapters for ch in range(1, int(count) + 1))
total = sum(map(len, chapters.values()))
assert len(books) == 66 and len(chapters) == 1189 and total == 31102, (len(chapters), total)
prefix = old[:old.index('    const CHAPTER_DATA')]
plans = old[old.index('    const READING_PLANS'):]
dump = lambda value: json.dumps(value, ensure_ascii=False, separators=(',', ':'))
target.write_text(prefix + 'const CHAPTER_DATA = ' + dump(chapters) + ';\n'
                  + 'const CHAPTER_RANGES = ' + dump(ranges) + ';\n'
                  + 'const CHAPTER_HEADINGS = ' + dump(headings) + ';\n' + plans, encoding='utf-8')
print(f'Imported {len(books)} books, {len(chapters)} chapters, {total} verses; '
      f'{continuations} continuations, {sum(map(len, ranges.values()))} combined ranges.')

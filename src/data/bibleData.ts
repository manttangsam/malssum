import { Book, Chapter, Verse } from '../types/bible';

export function cleanVerseText(text: string): string {
  // Remove punctuation, special characters, extra spaces, numbers for accurate STT matching
  return text
    .replace(/[.,/#!$%^&*;:{}=\-_`~()'"<>?ㆍ;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const BIBLE_BOOKS: Book[] = [
  { id: 'gen', name: '창세기', testament: 'OT', totalChapters: 50 },
  { id: 'exo', name: '출애굽기', testament: 'OT', totalChapters: 40 },
  { id: 'psa', name: '시편', testament: 'OT', totalChapters: 150 },
  { id: 'pro', name: '잠언', testament: 'OT', totalChapters: 31 },
  { id: 'isa', name: '이사야', testament: 'OT', totalChapters: 66 },
  { id: 'mat', name: '마태복음', testament: 'NT', totalChapters: 28 },
  { id: 'joh', name: '요한복음', testament: 'NT', totalChapters: 21 },
  { id: 'rom', name: '로마서', testament: 'NT', totalChapters: 16 },
  { id: 'rev', name: '요한계시록', testament: 'NT', totalChapters: 22 },
];

export const INITIAL_BIBLE_CHAPTERS: Record<string, Chapter> = {
  // 창세기 1장
  'gen_1': {
    bookId: 'gen',
    bookName: '창세기',
    chapter: 1,
    verses: [
      {
        id: 'gen_1_1',
        bookId: 'gen',
        bookName: '창세기',
        chapter: 1,
        verse: 1,
        text: '태초에 하나님이 천지를 창조하시니라',
        cleanText: '태초에 하나님이 천지를 창조하시니라'
      },
      {
        id: 'gen_1_2',
        bookId: 'gen',
        bookName: '창세기',
        chapter: 1,
        verse: 2,
        text: '땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 영은 수면 위에 운행하시니라',
        cleanText: '땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 영은 수면 위에 운행하시니라'
      },
      {
        id: 'gen_1_3',
        bookId: 'gen',
        bookName: '창세기',
        chapter: 1,
        verse: 3,
        text: '하나님이 이르시되 빛이 있으라 하시니 빛이 있었고',
        cleanText: '하나님이 이르시되 빛이 있으라 하시니 빛이 있었고'
      },
      {
        id: 'gen_1_4',
        bookId: 'gen',
        bookName: '창세기',
        chapter: 1,
        verse: 4,
        text: '빛이 하나님이 보시기에 좋았더라 하나님이 빛과 어둠을 나누사',
        cleanText: '빛이 하나님이 보시기에 좋았더라 하나님이 빛과 어둠을 나누사'
      },
      {
        id: 'gen_1_5',
        bookId: 'gen',
        bookName: '창세기',
        chapter: 1,
        verse: 5,
        text: '하나님이 빛을 낮이라 부르시고 어둠을 밤이라 부르시니라 저녁이 되고 아침이 되니 이는 첫째 날이니라',
        cleanText: '하나님이 빛을 낮이라 부르시고 어둠을 밤이라 부르시니라 저녁이 되고 아침이 되니 이는 첫째 날이니라'
      },
      {
        id: 'gen_1_6',
        bookId: 'gen',
        bookName: '창세기',
        chapter: 1,
        verse: 6,
        text: '하나님이 이르시되 물 가운데에 굳창이 있어 물과 물로 나누라 하시고',
        cleanText: '하나님이 이르시되 물 가운데에 궁창이 있어 물과 물로 나누라 하시고'
      },
      {
        id: 'gen_1_7',
        bookId: 'gen',
        bookName: '창세기',
        chapter: 1,
        verse: 7,
        text: '하나님이 궁창을 만드사 궁창 아래의 물과 궁창 위의 물로 나누게 하시니 그대로 되니라',
        cleanText: '하나님이 궁창을 만드사 궁창 아래의 물과 궁창 위의 물로 나누게 하시니 그대로 되니라'
      },
      {
        id: 'gen_1_8',
        bookId: 'gen',
        bookName: '창세기',
        chapter: 1,
        verse: 8,
        text: '하나님이 궁창을 하늘이라 부르시니라 저녁이 되고 아침이 되니 이는 둘째 날이니라',
        cleanText: '하나님이 궁창을 하늘이라 부르시니라 저녁이 되고 아침이 되니 이는 둘째 날이니라'
      }
    ]
  },

  // 시편 23편
  'psa_23': {
    bookId: 'psa',
    bookName: '시편',
    chapter: 23,
    verses: [
      {
        id: 'psa_23_1',
        bookId: 'psa',
        bookName: '시편',
        chapter: 23,
        verse: 1,
        text: '여호와는 나의 목자시니 내게 부족함이 없으리로다',
        cleanText: '여호와는 나의 목자시니 내게 부족함이 없으리로다'
      },
      {
        id: 'psa_23_2',
        bookId: 'psa',
        bookName: '시편',
        chapter: 23,
        verse: 2,
        text: '그가 나를 푸른 밭에 누이시며 쉬만 한 물 가로 인도하시는도다',
        cleanText: '그가 나를 푸른 밭에 누이시며 쉬만 한 물 가로 인도하시는도다'
      },
      {
        id: 'psa_23_3',
        bookId: 'psa',
        bookName: '시편',
        chapter: 23,
        verse: 3,
        text: '내 영혼을 소생시키시고 자기 이름을 위하여 의의 길로 인도하시는도다',
        cleanText: '내 영혼을 소생시키시고 자기 이름을 위하여 의의 길로 인도하시는도다'
      },
      {
        id: 'psa_23_4',
        bookId: 'psa',
        bookName: '시편',
        chapter: 23,
        verse: 4,
        text: '내가 사망의 음침한 골짜기로 다니엘지라도 해를 두려워하지 않을 것은 주께서 나와 함께 하심이라 주의 지팡이와 막대기가 나를 안위하시나이다',
        cleanText: '내가 사망의 음침한 골짜기로 다닐지라도 해를 두려워하지 않을 것은 주께서 나와 함께 하심이라 주의 지팡이와 막대기가 나를 안위하시나이다'
      },
      {
        id: 'psa_23_5',
        bookId: 'psa',
        bookName: '시편',
        chapter: 23,
        verse: 5,
        text: '주께서 내 원수의 목전에서 내게 상을 차려 주시고 기름을 내 머리에 부으셨으니 내 잔이 넘치나이다',
        cleanText: '주께서 내 원수의 목전에서 내게 상을 차려 주시고 기름을 내 머리에 부으셨으니 내 잔이 넘치나이다'
      },
      {
        id: 'psa_23_6',
        bookId: 'psa',
        bookName: '시편',
        chapter: 23,
        verse: 6,
        text: '내 평생에 선하심과 인자하심이 반드시 나를 따르리니 내가 여호와의 집에 영원히 살리로다',
        cleanText: '내 평생에 선하심과 인자하심이 반드시 나를 따르리니 내가 여호와의 집에 영원히 살리로다'
      }
    ]
  },

  // 마태복음 5장 (산상수훈 복있는 자)
  'mat_5': {
    bookId: 'mat',
    bookName: '마태복음',
    chapter: 5,
    verses: [
      {
        id: 'mat_5_1',
        bookId: 'mat',
        bookName: '마태복음',
        chapter: 5,
        verse: 1,
        text: '예수께서 무리를 보시고 산에 올라가 앉으시니 제자들이 나아온지라',
        cleanText: '예수께서 무리를 보시고 산에 올라가 앉으시니 제자들이 나아온지라'
      },
      {
        id: 'mat_5_2',
        bookId: 'mat',
        bookName: '마태복음',
        chapter: 5,
        verse: 2,
        text: '입을 열어 가르쳐 이르시되',
        cleanText: '입을 열어 가르쳐 이르시되'
      },
      {
        id: 'mat_5_3',
        bookId: 'mat',
        bookName: '마태복음',
        chapter: 5,
        verse: 3,
        text: '심령이 가난한 자는 복이 있나니 천국이 그들의 것임이요',
        cleanText: '심령이 가난한 자는 복이 있나니 천국이 그들의 것임이요'
      },
      {
        id: 'mat_5_4',
        bookId: 'mat',
        bookName: '마태복음',
        chapter: 5,
        verse: 4,
        text: '애통하는 자는 복이 있나니 그들이 위로를 받을 것임이요',
        cleanText: '애통하는 자는 복이 있나니 그들이 위로를 받을 것임이요'
      },
      {
        id: 'mat_5_5',
        bookId: 'mat',
        bookName: '마태복음',
        chapter: 5,
        verse: 5,
        text: '온유한 자는 복이 있나니 그들이 땅을 기업으로 받을 것임이요',
        cleanText: '온유한 자는 복이 있나니 그들이 땅을 기업으로 받을 것임이요'
      },
      {
        id: 'mat_5_6',
        bookId: 'mat',
        bookName: '마태복음',
        chapter: 5,
        verse: 6,
        text: '의에 주리고 목마른 자는 복이 있나니 그들이 배부를 것임이요',
        cleanText: '의에 주리고 목마른 자는 복이 있나니 그들이 배부를 것임이요'
      },
      {
        id: 'mat_5_7',
        bookId: 'mat',
        bookName: '마태복음',
        chapter: 5,
        verse: 7,
        text: '긍휼히 여기는 자는 복이 있나니 그들이 긍휼히 여김을 받을 것임이요',
        cleanText: '긍휼히 여기는 자는 복이 있나니 그들이 긍휼히 여김을 받을 것임이요'
      },
      {
        id: 'mat_5_8',
        bookId: 'mat',
        bookName: '마태복음',
        chapter: 5,
        verse: 8,
        text: '마음이 청결한 자는 복이 있나니 그들이 하나님을 볼 것임이요',
        cleanText: '마음이 청결한 자는 복이 있나니 그들이 하나님을 볼 것임이요'
      }
    ]
  },

  // 요한복음 1장
  'joh_1': {
    bookId: 'joh',
    bookName: '요한복음',
    chapter: 1,
    verses: [
      {
        id: 'joh_1_1',
        bookId: 'joh',
        bookName: '요한복음',
        chapter: 1,
        verse: 1,
        text: '태초에 말씀이 계시니라 이 말씀이 하나님과 함께 계셨으니 이 말씀은 곧 하나님이시니라',
        cleanText: '태초에 말씀이 계시니라 이 말씀이 하나님과 함께 계셨으니 이 말씀은 곧 하나님이시니라'
      },
      {
        id: 'joh_1_2',
        bookId: 'joh',
        bookName: '요한복음',
        chapter: 1,
        verse: 2,
        text: '그가 태초에 하나님과 함께 계셨고',
        cleanText: '그가 태초에 하나님과 함께 계셨고'
      },
      {
        id: 'joh_1_3',
        bookId: 'joh',
        bookName: '요한복음',
        chapter: 1,
        verse: 3,
        text: '만물이 그로 말미암아 지은 바 되었으니 지은 것이 하나도 그가 없이는 된 것이 없느나라',
        cleanText: '만물이 그로 말미암아 지은 바 되었으니 지은 것이 하나도 그가 없이는 된 것이 없느니라'
      },
      {
        id: 'joh_1_4',
        bookId: 'joh',
        bookName: '요한복음',
        chapter: 1,
        verse: 4,
        text: '그 안에 생명이 있었으니 이 생명은 사람들의 빛이라',
        cleanText: '그 안에 생명이 있었으니 이 생명은 사람들의 빛이라'
      },
      {
        id: 'joh_1_5',
        bookId: 'joh',
        bookName: '요한복음',
        chapter: 1,
        verse: 5,
        text: '빛이 어둠에 비치되 어둠이 깨닫지 못하더라',
        cleanText: '빛이 어둠에 비치되 어둠이 깨닫지 못하더라'
      }
    ]
  },

  // 로마서 8장
  'rom_8': {
    bookId: 'rom',
    bookName: '로마서',
    chapter: 8,
    verses: [
      {
        id: 'rom_8_1',
        bookId: 'rom',
        bookName: '로마서',
        chapter: 8,
        verse: 1,
        text: '그러므로 이제 그리스도 예수 안에 있는 자에게는 결코 정죄함이 없나니',
        cleanText: '그러므로 이제 그리스도 예수 안에 있는 자에게는 결코 정죄함이 없나니'
      },
      {
        id: 'rom_8_28',
        bookId: 'rom',
        bookName: '로마서',
        chapter: 8,
        verse: 28,
        text: '우리가 알거니와 하나님을 사랑하는 자 곧 그의 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라',
        cleanText: '우리가 알거니와 하나님을 사랑하는 자 곧 그의 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라'
      },
      {
        id: 'rom_8_31',
        bookId: 'rom',
        bookName: '로마서',
        chapter: 8,
        verse: 31,
        text: '그런즉 이 일에 대하여 우리가 무슨 말 하리요 만일 하나님이 우리를 위하시면 누가 우리를 대적하리요',
        cleanText: '그런즉 이 일에 대하여 우리가 무슨 말 하리요 만일 하나님이 우리를 위하시면 누가 우리를 대적하리요'
      },
      {
        id: 'rom_8_38',
        bookId: 'rom',
        bookName: '로마서',
        chapter: 8,
        verse: 38,
        text: '내가 확신하노니 사망이나 생명이나 천사들이나 권세자들이나 현재 일이나 장래 일이나 능력이나',
        cleanText: '내가 확신하노니 사망이나 생명이나 천사들이나 권세자들이나 현재 일이나 장래 일이나 능력이나'
      },
      {
        id: 'rom_8_39',
        bookId: 'rom',
        bookName: '로마서',
        chapter: 8,
        verse: 39,
        text: '높음이나 깊음이나 다른 어떤 피조물이라도 우리를 우리 주 그리스도 예수 안에 있는 하나님의 사랑에서 끊을 수 없으리라',
        cleanText: '높음이나 깊음이나 다른 어떤 피조물이라도 우리를 우리 주 그리스도 예수 안에 있는 하나님의 사랑에서 끊을 수 없으리라'
      }
    ]
  }
};

/**
 * Generates a dummy chapter dynamically if requested chapter is not pre-populated.
 */
export function getChapterData(bookId: string, chapterNum: number): Chapter {
  const key = `${bookId}_${chapterNum}`;
  if (INITIAL_BIBLE_CHAPTERS[key]) {
    return INITIAL_BIBLE_CHAPTERS[key];
  }

  const book = BIBLE_BOOKS.find((b) => b.id === bookId) || { name: '성경', id: bookId };
  
  // Generic template verses for testing any chapter
  const verses: Verse[] = Array.from({ length: 6 }, (_, i) => {
    const verseNo = i + 1;
    const text = `${book.name} ${chapterNum}장 ${verseNo}절 말씀입니다. 주께서 우리에게 이 말씀을 통해 크신 은혜와 평강을 베풀어 주시기를 소망합니다.`;
    return {
      id: `${bookId}_${chapterNum}_${verseNo}`,
      bookId,
      bookName: book.name,
      chapter: chapterNum,
      verse: verseNo,
      text,
      cleanText: cleanVerseText(text)
    };
  });

  return {
    bookId,
    bookName: book.name,
    chapter: chapterNum,
    verses
  };
}

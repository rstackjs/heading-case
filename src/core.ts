import { dict } from './dict.js';

export type WordMeta = {
  type: 'word' | 'space';
  value: string;
};

const isEnglishWord = (word: string) => /^[a-zA-Z]+$/.test(word);
const isFirstCharUppercase = (word: string) => /^[A-Z][a-z]*$/.test(word);

const isTerm = (word: string, line: string) => {
  return dict.some((term) => {
    if (term.includes(` ${word}`) || term.includes(`${word} `)) {
      return line.includes(term);
    }
    return term === word;
  });
};

const findCodeSpanEnd = (line: string, start: number) => {
  let openingEnd = start + 1;
  while (line[openingEnd] === '`') {
    openingEnd++;
  }

  const delimiterLength = openingEnd - start;
  let closingStart = line.indexOf('`', openingEnd);

  while (closingStart !== -1) {
    let closingEnd = closingStart + 1;
    while (line[closingEnd] === '`') {
      closingEnd++;
    }

    if (closingEnd - closingStart === delimiterLength) {
      return closingEnd;
    }
    closingStart = line.indexOf('`', closingEnd);
  }

  // An unmatched backtick run is literal text, not an inline code span.
  return openingEnd;
};

const lineToWords = (line: string) => {
  const words: WordMeta[] = [];

  let lastWord: WordMeta = {
    type: 'word',
    value: '',
  };

  for (let index = 0; index < line.length; index++) {
    let char = line[index];

    if (char === '\\' && /[\\`]/.test(line[index + 1] ?? '')) {
      char += line[++index];
    } else if (char === '`') {
      // Keep code spans in a single token so their contents are never cased.
      const end = findCodeSpanEnd(line, index);
      char = line.slice(index, end);
      index = end - 1;
    }

    if (/^\s$/.test(char)) {
      if (lastWord.type === 'space') {
        lastWord.value += char;
      } else {
        words.push(lastWord);
        lastWord = {
          type: 'space',
          value: char,
        };
      }
    } else if (lastWord.type === 'word') {
      lastWord.value += char;
    } else {
      words.push(lastWord);
      lastWord = {
        type: 'word',
        value: char,
      };
    }
  }

  words.push(lastWord);

  return words;
};

export const formatWords = (words: WordMeta[]) => {
  const line = words.map((word) => word.value).join('');
  const englishWords: string[] = [];

  for (const word of words) {
    const { type, value } = word;

    if (type === 'space') {
      continue;
    }

    if (isEnglishWord(value)) {
      englishWords.push(value);
    }

    if (
      // ignore the first English word
      englishWords.length <= 1 ||
      // ignore terms
      isTerm(value, line) ||
      // only format the first-char-uppercase English words
      !isFirstCharUppercase(value)
    ) {
      continue;
    }

    word.value = value.toLowerCase();
  }

  return words;
};

export const formatLine = (line: string) => {
  return formatWords(lineToWords(line))
    .map((word) => word.value)
    .join('');
};

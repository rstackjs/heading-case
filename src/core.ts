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

const indexCodeSpans = (line: string) => {
  const spans = new Map<number, number>();
  const nextEnds = new Map<number, number>();

  // Index the nearest closing run of each length without rescanning the suffix.
  for (let end = line.length; end > 0;) {
    if (line[end - 1] !== '`') {
      end--;
      continue;
    }
    let start = end - 1;
    while (start > 0 && line[start - 1] === '`') {
      start--;
    }

    const length = end - start;
    spans.set(start, nextEnds.get(length) ?? end);
    // An escaped first backtick leaves the rest of the run as a possible opener.
    if (length > 1) {
      spans.set(start + 1, nextEnds.get(length - 1) ?? end);
    }
    nextEnds.set(length, end);
    end = start;
  }

  return spans;
};

const lineToWords = (line: string) => {
  const words: WordMeta[] = [];

  let lastWord: WordMeta = {
    type: 'word',
    value: '',
  };

  const codeSpans = indexCodeSpans(line);

  for (let index = 0; index < line.length; index++) {
    let char = line[index];
    if (char === '\\' && /[\\`]/.test(line[index + 1] ?? '')) {
      char += line[++index];
    } else if (char === '`') {
      const end = codeSpans.get(index)!;
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

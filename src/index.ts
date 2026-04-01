import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import color from 'picocolors';
import { logger } from 'rslog';
import { escapePath, glob } from 'tinyglobby';
import { dict } from './dict.js';

const DEFAULT_IGNORE = [
  '**/node_modules',
  '**/dist',
  '**/.git',
  '**/.cache',
  '**/temp',
];

/**
 * Ask Git for ignored paths so scans follow `.gitignore`, `.git/info/exclude`,
 * and the user's global ignore rules when available.
 */
function getGitIgnorePatterns(cwd: string) {
  try {
    const stdout = execFileSync(
      'git',
      [
        'ls-files',
        '--others',
        '--ignored',
        '--exclude-standard',
        '--directory',
        '-z',
      ],
      {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    );

    return stdout
      .split('\0')
      .filter(Boolean)
      .map((path) => escapePath(path));
  } catch {
    return [];
  }
}

export async function globMarkdownFiles(cwd: string) {
  return glob(['**/*.md', '**/*.mdx'], {
    cwd,
    ignore: [...DEFAULT_IGNORE, ...getGitIgnorePatterns(cwd)],
    absolute: true,
  });
}

const isTitleLine = (line: string) => /^#{1,6}\s+\S/.test(line.trim());
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

const shouldWrite = process.argv.includes('--write');

type WordMeta = {
  type: 'word' | 'space';
  value: string;
};

const lineToWords = (line: string) => {
  const words: WordMeta[] = [];

  let lastWord: WordMeta = {
    type: 'word',
    value: '',
  };

  for (const char of line.split('')) {
    if (/\s/.test(char)) {
      if (lastWord.type === 'space') {
        lastWord.value += char;
      } else {
        words.push(lastWord);
        lastWord = {
          type: 'space',
          value: char,
        };
      }
    } else {
      if (lastWord.type === 'word') {
        lastWord.value += char;
      } else {
        words.push(lastWord);
        lastWord = {
          type: 'word',
          value: char,
        };
      }
    }
  }

  words.push(lastWord);

  return words;
};

export const formatLine = (line: string) => {
  const words = lineToWords(line);
  const englishWords: string[] = [];

  for (let index = 0; index < words.length; index++) {
    const word = words[index];
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

    const lowerCase = value.toLowerCase();
    if (lowerCase !== value) {
      word.value = lowerCase;
    }
  }

  return words.map((word) => word.value).join('');
};

function formatContent(content: string, filePath: string) {
  const lines = content.split('\n');

  return lines
    .map((originalLine) => {
      if (isTitleLine(originalLine)) {
        const formattedLine = formatLine(originalLine);

        if (!shouldWrite && formattedLine !== originalLine) {
          logger.error(`Unexpected heading case in ${color.dim(filePath)}`);
          logger.log(`        Current: ${color.cyan(originalLine)}`);
          logger.log(`        Expected: ${color.cyan(formattedLine)}\n`);
        }

        return formattedLine;
      }
      return originalLine;
    })
    .join('\n');
}

async function formatFile(filePath: string) {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  const formatted = formatContent(content, filePath);
  const isChanged = formatted !== content;

  if (isChanged && shouldWrite) {
    await fs.promises.writeFile(filePath, formatted);
    logger.success(`[heading-case] formatted: ${color.dim(filePath)}`);
  }

  return isChanged;
}

export async function headingCase({
  root = process.cwd(),
}: {
  root?: string;
} = {}) {
  const files = await globMarkdownFiles(root);
  let count = 0;

  for (const file of files) {
    const isFormatted = await formatFile(file);
    if (isFormatted) {
      count++;
    }
  }

  if (count) {
    if (shouldWrite) {
      logger.success(
        `[heading-case] formatted ${color.yellow(count.toString())} files.`,
      );
    } else {
      logger.info(
        `[heading-case] found issues in ${color.yellow(count.toString())} files.`,
      );
      process.exit(1);
    }
  } else {
    logger.success(
      `[heading-case] ${color.yellow(files.length)} files scanned, no issues found.`,
    );
  }
}

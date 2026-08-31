import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import color from 'picocolors';
import { logger } from 'rslog';
import { escapePath, glob } from 'tinyglobby';
import { formatLine } from './core.js';

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

function formatContent(content: string, filePath: string, write: boolean) {
  const lines = content.split('\n');

  return lines
    .map((originalLine) => {
      if (isTitleLine(originalLine)) {
        const formattedLine = formatLine(originalLine);

        if (!write && formattedLine !== originalLine) {
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

async function formatFile(filePath: string, write: boolean) {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  const formatted = formatContent(content, filePath, write);
  const isChanged = formatted !== content;

  if (isChanged && write) {
    await fs.promises.writeFile(filePath, formatted);
    logger.success(`[heading-case] formatted: ${color.dim(filePath)}`);
  }

  return isChanged;
}

export async function headingCase({
  root = process.cwd(),
  write = process.argv.includes('--write'),
}: {
  root?: string;
  write?: boolean;
} = {}) {
  const files = await globMarkdownFiles(root);
  let count = 0;

  for (const file of files) {
    const isFormatted = await formatFile(file, write);
    if (isFormatted) {
      count++;
    }
  }

  if (count) {
    if (write) {
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

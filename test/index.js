import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { formatLine, globMarkdownFiles } from '../dist/index.js';

test('should format line as expected', () => {
  // Basic
  assert.deepStrictEqual(formatLine('# Hello World'), '# Hello world');
  assert.deepStrictEqual(formatLine('## Hello World'), '## Hello world');
  assert.deepStrictEqual(formatLine('### Hello World'), '### Hello world');
  assert.deepStrictEqual(formatLine('#### Hello World'), '#### Hello world');
  assert.deepStrictEqual(formatLine('##### Hello World'), '##### Hello world');
  assert.deepStrictEqual(
    formatLine('###### Hello World'),
    '###### Hello world',
  );

  // Same words
  assert.deepStrictEqual(
    formatLine('# Hello Hello Hello World'),
    '# Hello hello hello world',
  );

  // Term
  assert.deepStrictEqual(
    formatLine('# A New Method for Creating JavaScript Rollovers'),
    '# A new method for creating JavaScript rollovers',
  );

  // Number
  assert.deepStrictEqual(formatLine('# 1. Hello World'), '# 1. Hello world');

  // Chinese
  assert.deepStrictEqual(
    formatLine('# 你好 Hello World'),
    '# 你好 Hello world',
  );
});

test('should skip markdown files inside gitignored doc_build directories', async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'heading-case-'));

  await fs.mkdir(path.join(cwd, 'docs'));
  await fs.mkdir(path.join(cwd, 'doc_build'));
  await fs.writeFile(path.join(cwd, '.gitignore'), 'doc_build/\n');
  await fs.writeFile(path.join(cwd, 'docs', 'guide.md'), '# Hello World\n');
  await fs.writeFile(
    path.join(cwd, 'doc_build', 'draft.md'),
    '# Hidden Title\n',
  );

  execFileSync('git', ['init'], { cwd, stdio: 'ignore' });

  const files = await globMarkdownFiles(cwd);

  assert.deepStrictEqual(files, [path.join(cwd, 'docs', 'guide.md')]);
});

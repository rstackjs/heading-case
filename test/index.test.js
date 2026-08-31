import assert from 'node:assert';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { test } from 'rstack/test';
import { normalize } from 'pathe';
import { globMarkdownFiles } from '../dist/cli.js';
import { formatLine } from '../dist/core.js';

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

  // Prefix
  assert.deepStrictEqual(
    formatLine('## [Important] Package name'),
    '## [Important] Package name',
  );

  // Chinese
  assert.deepStrictEqual(
    formatLine('# 你好 Hello World'),
    '# 你好 Hello world',
  );
});

test('should preserve the existing CLI check and write usage', async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'heading-case-cli-'));
  const filePath = path.join(cwd, 'guide.md');
  const binPath = path.resolve(import.meta.dirname, '../bin.js');

  await fs.writeFile(filePath, '# Hello World\n');

  const checkResult = spawnSync(process.execPath, [binPath], {
    cwd,
    encoding: 'utf8',
  });

  assert.strictEqual(checkResult.status, 1, checkResult.stderr);
  assert.strictEqual(await fs.readFile(filePath, 'utf8'), '# Hello World\n');

  const writeResult = spawnSync(process.execPath, [binPath, '--write'], {
    cwd,
    encoding: 'utf8',
  });

  assert.strictEqual(writeResult.status, 0, writeResult.stderr);
  assert.strictEqual(await fs.readFile(filePath, 'utf8'), '# Hello world\n');
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

  assert.deepStrictEqual(
    files.map(normalize),
    [path.join(cwd, 'docs', 'guide.md')].map(normalize),
  );
});

test('should skip gitignored directories with non-ascii names', async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'heading-case-'));

  await fs.mkdir(path.join(cwd, 'docs'));
  await fs.mkdir(path.join(cwd, '文档构建'));
  await fs.writeFile(path.join(cwd, '.gitignore'), '文档构建/\n');
  await fs.writeFile(path.join(cwd, 'docs', 'guide.md'), '# Hello World\n');
  await fs.writeFile(path.join(cwd, '文档构建', '草稿.md'), '# Hidden Title\n');

  execFileSync('git', ['init'], { cwd, stdio: 'ignore' });
  execFileSync('git', ['config', 'core.quotePath', 'true'], {
    cwd,
    stdio: 'ignore',
  });

  const files = await globMarkdownFiles(cwd);

  assert.deepStrictEqual(
    files.map(normalize),
    [path.join(cwd, 'docs', 'guide.md')].map(normalize),
  );
});

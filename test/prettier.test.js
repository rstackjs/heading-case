import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import * as prettier from 'prettier';
import { test } from 'rstack/test';
import plugin from '../dist/index.js';

test('should format Markdown and MDX headings with Prettier', async () => {
  const markdown = [
    '# Hello World',
    '',
    '# Hello **Bold World** and React Router',
    '',
    'Setext Heading',
    '==============',
    '',
    '<!-- prettier-ignore -->',
    '# Ignored Heading',
    '',
    '```md',
    '# Nested Markdown Heading',
    '```',
    '',
  ].join('\n');
  const expectedMarkdown = [
    '# Hello world',
    '',
    '# Hello **bold world** and React Router',
    '',
    'Setext heading',
    '==============',
    '',
    '<!-- prettier-ignore -->',
    '# Ignored Heading',
    '',
    '```md',
    '# Nested Markdown Heading',
    '```',
    '',
  ].join('\n');

  const formattedMarkdown = await prettier.format(markdown, {
    parser: 'markdown',
    plugins: [plugin],
  });
  const formattedMdx = await prettier.format(
    '# Hello World\n\n<Component title="Hello World" />\n',
    {
      parser: 'mdx',
      plugins: [plugin],
    },
  );

  assert.strictEqual(formattedMarkdown, expectedMarkdown);
  assert.strictEqual(
    formattedMdx,
    '# Hello world\n\n<Component title="Hello World" />\n',
  );
  assert.strictEqual(
    await prettier.format(formattedMarkdown, {
      parser: 'markdown',
      plugins: [plugin],
    }),
    formattedMarkdown,
  );
});

test('should load the package entry as a Prettier plugin through rs fmt', async () => {
  const projectRoot = path.resolve(import.meta.dirname, '..');
  const cwd = await fs.mkdtemp(path.join(projectRoot, '.heading-case-rs-fmt-'));
  const rsBin = path.join(
    projectRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'rs.CMD' : 'rs',
  );
  const runRsFmt = (...args) =>
    spawnSync(rsBin, ['fmt', '--no-cache', ...args], {
      cwd,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });

  try {
    await fs.writeFile(
      path.join(cwd, 'rstack.config.mjs'),
      [
        "import { define } from 'rstack';",
        '',
        'define.fmt({',
        "  plugins: ['heading-case'],",
        '});',
        '',
      ].join('\n'),
    );
    await fs.writeFile(path.join(cwd, 'guide.md'), '# Hello World\n');

    const checkBefore = runRsFmt('--check', 'guide.md');
    assert.strictEqual(
      checkBefore.status,
      1,
      checkBefore.stderr || checkBefore.stdout,
    );

    const write = runRsFmt('guide.md');
    assert.strictEqual(write.status, 0, write.stderr || write.stdout);
    assert.strictEqual(
      await fs.readFile(path.join(cwd, 'guide.md'), 'utf8'),
      '# Hello world\n',
    );

    const checkAfter = runRsFmt('--check', 'guide.md');
    assert.strictEqual(
      checkAfter.status,
      0,
      checkAfter.stderr || checkAfter.stdout,
    );
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});

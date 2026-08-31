# heading-case

Format page titles and section headings in Markdown and MDX files to use [sentence-style capitalization](https://learn.microsoft.com/en-us/style-guide/text-formatting/using-type/use-sentence-style-capitalization).

It can be used as a Prettier plugin or as a standalone CLI.

<p>
  <a href="https://npmjs.com/package/heading-case">
   <img src="https://img.shields.io/npm/v/heading-case?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
  <a href="https://npmcharts.com/compare/heading-case?minimal=true"><img src="https://img.shields.io/npm/dm/heading-case.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
</p>

## Example

- Input:

```md
# A New Method for Creating JavaScript Rollovers
```

- Output:

```md
# A new method for creating JavaScript rollovers
```

## Usage

Install:

```bash
npm add heading-case -D
```

### Rstack CLI

Add `heading-case` to the [`rs fmt` Prettier plugins](https://rstack.rs/guide/formatting#prettier-plugins):

```ts
import { define } from 'rstack';

define.fmt({
  plugins: ['heading-case'],
});
```

Check or write formatted files:

```bash
rs fmt --check
rs fmt
```

### Prettier

Add the plugin to your Prettier configuration:

```js
/** @type {import('prettier').Config} */
const config = {
  plugins: ['heading-case'],
};

export default config;
```

Then run Prettier normally:

```bash
prettier . --check
prettier . --write
```

### Standalone CLI

The existing CLI remains available. Check all Markdown and MDX files in the current directory:

```bash
npx heading-case
```

By default, files ignored by Git are skipped as well, including rules from `.gitignore`, `.git/info/exclude`, and global Git ignore files.

Check and write the formatted content to the file:

```bash
npx heading-case --write
```

The programmatic CLI and core formatting utilities are available from subpath exports:

```js
import { headingCase } from 'heading-case/cli';
import { formatLine } from 'heading-case/core';
```

## Limitations

This package is designed for Rstack's documentation. It follows the writing style of Rstack documentation and may not work well for other projects.

There are some edge cases that can not be correctly handled, so the execution result is not completely reliable.

## License

[MIT](./LICENSE).

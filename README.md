# heading-case

Format page titles and section headings in markdown files to use [sentence-style capitalization](https://learn.microsoft.com/en-us/style-guide/text-formatting/using-type/use-sentence-style-capitalization).

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

## Limitations

This package is designed for Rspack's documentation. It follows the writing style of Rspack documentation and may not work well for other projects.

There are some edge cases that can not be correctly handled, so the execution result is not completely reliable.

## Usage

Install:

```bash
npm add heading-case -D
```

Check all markdown and MDX files in the current directory:

```bash
npx heading-case
```

By default, files ignored by Git are skipped as well, including rules from `.gitignore`, `.git/info/exclude`, and global Git ignore files.

Check and write the formatted content to the file:

```bash
npx heading-case --write
```

## License

[MIT](./LICENSE).

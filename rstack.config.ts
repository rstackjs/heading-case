// Configuration guide: https://rstack.rs/config
import { define } from 'rstack';

define.lib({
  format: 'esm',
  syntax: 'es2021',
  dts: true,
});

define.test({});

define.lint(({ js, ts }) => [js.configs.recommended, ts.configs.recommended]);

define.fmt({
  singleQuote: true,
  sortPackageJson: true,
});

define.staged({
  '*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}': ['rs lint', 'rs fmt'],
  '*.{json,md,mdx,css,scss,less,html,yml,yaml}': 'rs fmt',
});

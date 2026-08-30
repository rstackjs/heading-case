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
  ignorePatterns: ['dist/**'],
});

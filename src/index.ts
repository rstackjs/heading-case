import type { Parser, Plugin, Printer } from 'prettier';
import {
  parsers as markdownParsers,
  printers as markdownPrinters,
} from 'prettier/plugins/markdown';
import { formatWords, type WordMeta } from './core.js';

const AST_FORMAT = 'heading-case-mdast';

type MarkdownNode = {
  children?: MarkdownNode[];
  type?: string;
  value?: string;
};

const collectWordNodes = (node: MarkdownNode, words: MarkdownNode[]) => {
  if (
    (node.type === 'word' || node.type === 'whitespace') &&
    typeof node.value === 'string'
  ) {
    words.push(node);
    return;
  }

  for (const child of node.children ?? []) {
    collectWordNodes(child, words);
  }
};

const formatHeading = (heading: MarkdownNode) => {
  const wordNodes: MarkdownNode[] = [];
  collectWordNodes(heading, wordNodes);

  const words: WordMeta[] = wordNodes.map((node) => ({
    type: node.type === 'whitespace' ? 'space' : 'word',
    value: node.value ?? '',
  }));

  formatWords(words);

  for (let index = 0; index < wordNodes.length; index++) {
    wordNodes[index].value = words[index].value;
  }
};

const formatHeadings = (node: MarkdownNode) => {
  if (node.type === 'heading') {
    formatHeading(node);
    return;
  }

  for (const child of node.children ?? []) {
    formatHeadings(child);
  }
};

const wrapParser = (parser: Parser): Parser => ({
  ...parser,
  astFormat: AST_FORMAT,
});

export const parsers = {
  markdown: wrapParser(markdownParsers.markdown),
  mdx: wrapParser(markdownParsers.mdx),
  remark: wrapParser(markdownParsers.remark),
};

const markdownPrinter = markdownPrinters.mdast;

const printer: Printer = {
  ...markdownPrinter,
  async preprocess(ast, options) {
    const preprocessed = markdownPrinter.preprocess
      ? await markdownPrinter.preprocess(ast, options)
      : ast;

    // Do not apply heading-case recursively to Markdown inside fenced code.
    if (options.parentParser === undefined) {
      formatHeadings(preprocessed as MarkdownNode);
    }

    return preprocessed;
  },
};

export const printers = {
  [AST_FORMAT]: printer,
};

const plugin: Plugin = {
  parsers,
  printers,
};

export default plugin;

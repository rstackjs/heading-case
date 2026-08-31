import type { Parser, Plugin, Printer } from 'prettier';
import {
  parsers as markdownParsers,
  printers as markdownPrinters,
} from 'prettier/plugins/markdown';
import { formatWords, type WordMeta } from './core.js';

const AST_FORMAT = 'heading-case-mdast';

type MarkdownNode = {
  children?: MarkdownNode[];
  referenceType?: string;
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
  const children = heading.children ?? [];

  // A leading `[Label]` can be parsed as a shortcut link reference when the
  // document contains a matching reference definition. Treat it as a heading
  // prefix either way, so the word after it remains the first English word.
  const contentNodes =
    children[0]?.type === 'linkReference' &&
    children[0].referenceType === 'shortcut'
      ? children.slice(1)
      : children;

  for (const child of contentNodes) {
    collectWordNodes(child, wordNodes);
  }

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

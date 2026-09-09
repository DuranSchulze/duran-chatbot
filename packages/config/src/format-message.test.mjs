import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatRichMessage } from '../dist/format-message.js';
import { MarkdownManager } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';

test('editor formatting survives serialization and renders in the shared chat dialect', () => {
  const manager = new MarkdownManager({ extensions: [StarterKit] });
  const source = '# Heading\n\n**Bold** *italic* ++underline++ ~~strike~~ `code`\n\n- Bullet\n\n1. Number\n\n> Quote\n\n---\n\n```\nconst a = "<safe>";\n```';
  const doc = manager.parse(source);
  const saved = manager.serialize(doc);
  assert.deepEqual(manager.parse(saved), doc);
  const html = formatRichMessage(saved);
  for (const tag of ['h1', 'strong', 'em', 'u', 'del', 'code', 'ul', 'ol', 'blockquote', 'hr', 'pre']) {
    assert.match(html, new RegExp('<' + tag + '(?:>|\\s)'));
  }
});

test('variables and nested formatting survive while code remains literal', () => {
  const html = formatRichMessage('**Hello {{companyName}} and ++team++**\n\n`++literal++`');
  assert.match(html, /<strong>Hello {{companyName}} and <u>team<\/u><\/strong>/);
  assert.match(html, /<code>\+\+literal\+\+<\/code>/);
});

test('untrusted HTML and unsafe links cannot become executable markup', () => {
  const html = formatRichMessage('<script>alert(1)</script>\n\n[bad](javascript:alert) [good](https://example.com)\n\n![image](https://example.com/tracker.png)');
  assert.doesNotMatch(html, /<script|href="javascript:|<img/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /rel="noopener noreferrer"/);
});

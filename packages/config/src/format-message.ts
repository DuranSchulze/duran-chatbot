import { Marked } from 'marked';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// One Markdown dialect for saved editor content and every chat surface.
// Raw HTML is displayed literally; links only allow web and email protocols.
const markdown = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    html({ text }) { return escapeHtml(text); },
    link({ href, tokens }) {
      const label = this.parser.parseInline(tokens);
      if (!/^(https?:\/\/|mailto:)/i.test(href)) return label;
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    },
    image({ text }) { return escapeHtml(text); },
  },
  extensions: [{
    name: 'underline',
    level: 'inline',
    start(source) { return source.indexOf('++'); },
    tokenizer(source) {
      const match = /^\+\+([\s\S]+?)\+\+/.exec(source);
      if (match) return {
        type: 'underline', raw: match[0],
        tokens: this.lexer.inlineTokens(match[1]),
      };
    },
    renderer(token) {
      return `<u>${this.parser.parseInline(token.tokens ?? [])}</u>`;
    },
  }],
});

export function formatRichMessage(text: string): string {
  return markdown.parse(text, { async: false });
}

function escapeStr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function processInline(raw: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = raw.split(urlRegex)
  return parts
    .map((part, i) => {
      // URLs (odd indices from the split)
      if (i % 2 === 1) {
        const safe = escapeStr(part)
        return `<a href="${safe}" target="_blank" rel="noopener noreferrer" class="underline text-blue-400 hover:text-blue-300">${safe}</a>`
      }
      let s = escapeStr(part)
      // Inline code (must be done before bold/italic to avoid mangling backticks)
      s = s.replace(/`([^`]+)`/g, "<code class=\"bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded text-xs font-mono\">$1</code>")
      // Bold **text**
      s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      // Italic *text* (but not ** which is already consumed)
      s = s.replace(/(?<!\*)\*([^*\s][^*]*?)\*(?!\*)/g, "<em>$1</em>")
      return s
    })
    .join("")
}

// ─── Block-level rendering ───────────────────────────────────────────────────

type BlockState = {
  html: string[]
  inUl: boolean
  inOl: boolean
  inBlockquote: boolean
  inCodeBlock: boolean
}

function closeUl(s: BlockState) {
  if (s.inUl) {
    s.html.push("</ul>")
    s.inUl = false
  }
}

function closeOl(s: BlockState) {
  if (s.inOl) {
    s.html.push("</ol>")
    s.inOl = false
  }
}

function closeBlockquote(s: BlockState) {
  if (s.inBlockquote) {
    s.html.push("</blockquote>")
    s.inBlockquote = false
  }
}

function closeLists(s: BlockState) {
  closeUl(s)
  closeOl(s)
}

function closeAll(s: BlockState) {
  closeLists(s)
  closeBlockquote(s)
  closeCodeBlock(s)
}

function closeCodeBlock(s: BlockState) {
  if (s.inCodeBlock) {
    s.html.push("</code></pre>")
    s.inCodeBlock = false
  }
}

export function formatMessage(text: string): string {
  const lines = text.split("\n")
  const state: BlockState = {
    html: [],
    inUl: false,
    inOl: false,
    inBlockquote: false,
    inCodeBlock: false,
  }

  for (const rawLine of lines) {
    const trimmed = rawLine.trim()

    // ── Fenced code block (```) ──
    if (trimmed.startsWith("```")) {
      if (state.inCodeBlock) {
        closeCodeBlock(state)
      } else {
        closeAll(state)
        state.html.push("<pre class=\"rounded-lg bg-slate-800 border border-slate-700 p-4 my-2 overflow-x-auto\"><code class=\"text-sm text-slate-200 font-mono leading-relaxed block\">")
        state.inCodeBlock = true
      }
      continue
    }

    if (state.inCodeBlock) {
      state.html.push(escapeStr(rawLine) + "\n")
      continue
    }

    // ── Empty line ──
    if (!trimmed) {
      closeLists(state)
      state.html.push("\n") // small vertical gap
      continue
    }

    // ── Heading (##, ###, etc.) ──
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      closeAll(state)
      const level = headingMatch[1].length
      const sizeClass =
        level === 1
          ? "text-lg font-semibold text-white mt-4 mb-2"
          : level === 2
            ? "text-base font-semibold text-white mt-3 mb-1.5"
            : "text-sm font-semibold text-slate-200 mt-3 mb-1"
      state.html.push(`<h${level} class="${sizeClass}">${processInline(headingMatch[2])}</h${level}>`)
      continue
    }

    // ── Blockquote (>) ──
    const bqMatch = trimmed.match(/^>\s?(.*)$/)
    if (bqMatch) {
      closeLists(state)
      if (!state.inBlockquote) {
        state.html.push('<blockquote class="border-l-2 border-slate-600 pl-4 my-2 text-slate-400 italic">')
        state.inBlockquote = true
      }
      state.html.push(`<p class="mb-1 last:mb-0">${processInline(bqMatch[1])}</p>`)
      continue
    }

    // ── Horizontal rule (---) ──
    if (/^-{3,}$/.test(trimmed)) {
      closeAll(state)
      state.html.push('<hr class="border-slate-700 my-4" />')
      continue
    }

    // ── Unordered list ──
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/)
    if (bulletMatch) {
      closeOl(state)
      closeBlockquote(state)
      if (!state.inUl) {
        state.html.push('<ul class="list-disc list-inside space-y-0.5 my-1">')
        state.inUl = true
      }
      state.html.push(`<li>${processInline(bulletMatch[1])}</li>`)
      continue
    }

    // ── Ordered list ──
    const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/)
    if (numberedMatch) {
      closeUl(state)
      closeBlockquote(state)
      if (!state.inOl) {
        state.html.push('<ol class="list-decimal list-inside space-y-0.5 my-1">')
        state.inOl = true
      }
      state.html.push(`<li>${processInline(numberedMatch[1])}</li>`)
      continue
    }

    // ── Regular paragraph ──
    closeLists(state)
    state.html.push(`<p class="mb-1 last:mb-0">${processInline(trimmed)}</p>`)
  }

  closeAll(state)
  return state.html.join("")
}

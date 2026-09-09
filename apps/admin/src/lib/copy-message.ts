import { formatMessage } from "./format-message";

/** Export the rendered response, without the chat's dark theme or Markdown markers. */
export function prepareMessageClipboard(markdown: string) {
  const doc = new DOMParser().parseFromString(formatMessage(markdown), "text/html");

  function plain(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (!(node instanceof Element)) return "";
    const children = () => Array.from(node.childNodes).map(plain).join("");
    switch (node.tagName) {
      case "BR": return "\n";
      case "PRE": return (node.textContent ?? "").trimEnd() + "\n\n";
      case "HR": return "\n";
      case "UL":
      case "OL": {
        const start = Number(node.getAttribute("start") ?? 1);
        return Array.from(node.children).map((item, index) => {
          const prefix = node.tagName === "OL" ? `${start + index}. ` : "• ";
          return prefix + plain(item).trim().replace(/\n/g, "\n  ");
        }).join("\n") + "\n\n";
      }
      case "A": {
        const label = children();
        const href = node.getAttribute("href") ?? "";
        return href && label !== href && label !== href.replace(/^mailto:/, "")
          ? `${label} (${href})` : label;
      }
      case "TR": return Array.from(node.children).map(plain).join("\t") + "\n";
      case "P":
      case "H1":
      case "H2":
      case "H3":
      case "H4":
      case "H5":
      case "H6":
      case "BLOCKQUOTE": return children().trim() + "\n\n";
      default: return children();
    }
  }

  const text = Array.from(doc.body.children).map(plain).join("").trim();
  // Inline styles survive paste into email composers without depending on app CSS.
  const styles: Record<string, string> = {
    p: "margin:0 0 12px;",
    h1: "font-size:22px;font-weight:700;margin:16px 0 8px;",
    h2: "font-size:18px;font-weight:700;margin:16px 0 8px;",
    h3: "font-size:16px;font-weight:700;margin:12px 0 6px;",
    strong: "font-weight:700;",
    em: "font-style:italic;",
    u: "text-decoration:underline;",
    del: "text-decoration:line-through;",
    ul: "list-style-type:disc;padding-left:24px;margin:8px 0;",
    ol: "list-style-type:decimal;padding-left:24px;margin:8px 0;",
    blockquote: "border-left:2px solid #999;padding-left:12px;margin:12px 0;",
    pre: "font-family:monospace;white-space:pre-wrap;background:#f3f4f6;padding:12px;",
    code: "font-family:monospace;",
    a: "color:#2563eb;text-decoration:underline;",
    table: "border-collapse:collapse;",
    th: "border:1px solid #ccc;padding:6px;font-weight:700;",
    td: "border:1px solid #ccc;padding:6px;",
  };
  for (const [tag, style] of Object.entries(styles)) {
    doc.body.querySelectorAll(tag).forEach((element) => element.setAttribute("style", style));
  }
  return {
    text,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#111827;">${doc.body.innerHTML}</div>`,
  };
}

export async function copyFormattedMessage(markdown: string): Promise<void> {
  const { text, html } = prepareMessageClipboard(markdown);
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" }),
      })]);
      return;
    } catch {
      // Some browsers only permit plain-text clipboard writes.
    }
  }
  await navigator.clipboard.writeText(text);
}

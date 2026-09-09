import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";
import { CONTACT_TEMPLATE_VARIABLES } from "@duran-chatbot/config";

import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { RichTextEditor } from "@/components/editor";
import "./prompt-editor.css";
import { cn } from "@/lib/utils";

const Variables = Extension.create({
  name: "promptVariables",
  addProseMirrorPlugins() {
    return [new Plugin({
      props: {
        decorations(state) {
          const decorations: Decoration[] = [];
          state.doc.descendants((node, pos) => {
            if (!node.isText || !node.text) return;
            for (const match of node.text.matchAll(/\{\{\s*[a-zA-Z][a-zA-Z0-9_]*\s*\}\}/g)) {
              const known = CONTACT_TEMPLATE_VARIABLES.some(
                (variable) => variable.token === match[0].replace(/[{}\s]/g, ""),
              );
              decorations.push(Decoration.inline(
                pos + match.index!, pos + match.index! + match[0].length,
                { class: known ? "prompt-variable" : "prompt-variable-unknown" },
              ));
            }
          });
          return DecorationSet.create(state.doc, decorations);
        },
      },
    })];
  },
});

type PromptTextareaProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  /** "light" for the admin config panels, "dark" for the internal chat drawer. */
  variant?: "light" | "dark";
  /** Hide the insert chips row (the highlighting still applies). */
  hideChips?: boolean;
  className?: string;
  label?: string;
  /** Used by the expanded editor to avoid nesting expansion controls. */
  expandable?: boolean;
};

export function PromptTextarea({
  id,
  value,
  onChange,
  rows = 8,
  placeholder,
  variant = "light",
  hideChips = false,
  className,
  label = "Prompt editor",
  expandable = true,
}: PromptTextareaProps) {
  const [expanded, setExpanded] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const fieldId = useId();
  useEffect(() => {
    if (expanded) dialogRef.current?.showModal();
  }, [expanded]);
  const dark = variant === "dark";
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
      }),
      Markdown,
      Placeholder.configure({ placeholder: placeholder ?? "Write your instructions…" }),
      Variables,
    ],
    content: value,
    contentType: "markdown",
    editorProps: { attributes: {
      id: id ?? fieldId, role: "textbox", "aria-label": label,
      "aria-multiline": "true", spellcheck: "false",
    }},
    onUpdate: ({ editor: current }) => onChange(current.getMarkdown()),
  });
  useEffect(() => {
    if (editor && editor.getMarkdown() !== value) {
      editor.commands.setContent(value, { emitUpdate: false, contentType: "markdown" });
    }
  }, [editor, value]);
  const insertToken = (token: string) => {
    editor?.chain().focus().insertContent({ type: "text", text: `{{${token}}}` }).run();
  };

  return (
    <div className={cn("w-full min-w-0 space-y-3", className)}>
      {expandable && (
        <div className="flex min-w-0 items-center justify-between gap-3">
          <span className={cn("text-xs", dark ? "text-slate-400" : "text-slate-500")}>Edit instructions</span>
          <button type="button" onClick={() => setExpanded(true)} aria-haspopup="dialog" aria-label={`Expand ${label.toLowerCase()}`} className={cn("inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500", dark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50")}>
            <Maximize2 className="size-3.5" /> Expand
          </button>
        </div>
      )}
      <div className={cn("prompt-editor", dark && "prompt-editor-dark")}
        style={{ "--prompt-height": `${Math.max(3, rows) * 24 + 24}px` } as React.CSSProperties}>
        <RichTextEditor editor={editor}>
          <RichTextEditor.Toolbar className="prompt-formatting-toolbar">
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Underline />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.H2 />
            <RichTextEditor.H3 />
            <RichTextEditor.BulletList />
            <RichTextEditor.OrderedList />
            <RichTextEditor.Blockquote />
            <RichTextEditor.Code />
            <RichTextEditor.ClearFormatting />
            <RichTextEditor.Undo />
            <RichTextEditor.Redo />
          </RichTextEditor.Toolbar>
          <RichTextEditor.Content />
        </RichTextEditor>
      </div>

      {!hideChips && (
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <span
            className={cn(
              "w-full text-xs",
              dark ? "text-slate-500" : "text-slate-500",
            )}
          >
            Insert a contact variable at the cursor:
          </span>
          {CONTACT_TEMPLATE_VARIABLES.map((variable) => (
            <button
              key={variable.token}
              type="button"
              title={`${variable.label} — from Contact & Location`}
              onClick={() => insertToken(variable.token)}
              className={cn(
                "max-w-full break-all border px-0.5 py-px font-mono text-[8px] leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                dark
                  ? "border-blue-400/40 bg-blue-500/15 text-blue-300 hover:border-blue-300/60 hover:bg-blue-500/25"
                  : "border-blue-200 bg-blue-500/10 text-blue-700 hover:border-blue-300 hover:bg-blue-500/20",
              )}
            >
              {`{{${variable.token}}}`}
            </button>
          ))}
        </div>
      )}
      {expanded && createPortal(
        <dialog ref={dialogRef} aria-labelledby={titleId} onCancel={() => setExpanded(false)} onClose={() => setExpanded(false)} onClick={(event) => { if (event.target === event.currentTarget) setExpanded(false); }} className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto border border-slate-700 bg-slate-900 p-0 text-slate-100 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-semibold">{label}</h2>
              <p className="mt-1 text-xs text-slate-400">Edit in a larger workspace. Close this editor, then save your settings to apply changes.</p>
            </div>
            <button type="button" onClick={() => setExpanded(false)} aria-label="Close expanded editor" className="flex size-9 shrink-0 items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><X className="size-4" /></button>
          </div>
          <div className="p-4 sm:p-6">
            <PromptTextarea value={value} onChange={onChange} rows={16} placeholder={placeholder} variant="dark" hideChips={hideChips} label={label} expandable={false} />
          </div>
          <div className="flex justify-end border-t border-slate-800 px-4 py-3 sm:px-6">
            <button type="button" onClick={() => setExpanded(false)} className="bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">Done</button>
          </div>
        </dialog>, document.body,
      )}
    </div>
  );
}

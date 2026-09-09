import type { Editor } from "@tiptap/react";
import { useCallback, useState } from "react";

import { useRichTextEditorContext } from "../rte-context";
import {
  CODE_BLOCK_LANGUAGES,
  getLanguageLabel,
  useEditorState,
  shallowEqual,
} from "./utils";

const FallbackIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="rte-editor-icon"
  >
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

export const LanguageSelector = ({ editor }: { editor: Editor }) => {
  const [open, setOpen] = useState(false);
  const [pill, setPill] = useState<{
    height: number;
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const { icons } = useRichTextEditorContext();
  const { currentLanguage } = useEditorState(
    editor,
    (ed) => ({
      currentLanguage: ed.getAttributes("codeBlock").language || "javascript",
    }),
    shallowEqual
  );

  const langIcon = icons.languageIcons[currentLanguage] ?? <FallbackIcon />;

  const handleItemEnter = useCallback((target: EventTarget | null) => {
    const item = (target as HTMLElement).closest<HTMLElement>(
      "[data-dropdown-item]"
    );
    if (!item) {
      return;
    }
    setPill({
      height: item.offsetHeight,
      left: item.offsetLeft,
      top: item.offsetTop,
      width: item.offsetWidth,
    });
  }, []);

  const handleMouseOver = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      handleItemEnter(event.target);
    },
    [handleItemEnter]
  );

  const handleFocus = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      handleItemEnter(event.target);
    },
    [handleItemEnter]
  );

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="rte-bubble-btn"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen(!open)}
      >
        <span className="rte-bubble-btn-icon">{langIcon}</span>
        <span className="rte-bubble-btn-text">
          {getLanguageLabel(currentLanguage)}
        </span>
        <span className="rte-bubble-btn-icon" style={{ height: 12, width: 12 }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      {open && (
        <>
          <div
            className="rte-bubble-overlay"
            role="presentation"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
              }
            }}
          />
          <div
            className="rte-bubble-dropdown rte-bubble-dropdown--language"
            onFocus={handleFocus}
            onMouseLeave={() => setPill(null)}
            onMouseOver={handleMouseOver}
          >
            <div
              aria-hidden="true"
              className={[
                "rte-bubble-dropdown-pill",
                pill ? "rte-bubble-dropdown-pill--visible" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={
                pill
                  ? {
                      height: pill.height,
                      left: pill.left,
                      top: pill.top,
                      width: pill.width,
                    }
                  : undefined
              }
            />
            {CODE_BLOCK_LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                data-dropdown-item
                className={`rte-bubble-dropdown-item${currentLanguage === lang ? " rte-bubble-dropdown-item--active" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .updateAttributes("codeBlock", { language: lang })
                    .run();
                  setOpen(false);
                }}
              >
                <span className="rte-bubble-dropdown-icon">
                  {icons.languageIcons[lang] ?? <FallbackIcon />}
                </span>
                <span>{getLanguageLabel(lang)}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

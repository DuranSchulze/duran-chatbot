import { Fragment } from "react";
import {
  interpolateTemplateVariables,
  safePrivacyLinkUrl,
  splitPrivacyNoticeText,
  type AppearanceConfig,
} from "@duran-chatbot/config";

type PrivacyNoticePreviewProps = {
  /** Widget appearance — supplies the link's brand color and any {{contact}} tokens. */
  appearance: AppearanceConfig;
  text: string;
  linkLabel: string;
  url: string;
};

/**
 * Live preview of the widget's consent row: an unchecked box plus the sentence
 * with its {{link}} token rendered as the real link, so an admin can see the
 * brand color and confirm the URL before saving.
 */
export function PrivacyNoticePreview({ appearance, text, linkLabel, url }: PrivacyNoticePreviewProps) {
  const label = linkLabel.trim();
  const href = safePrivacyLinkUrl(url);

  const link = label ? (
    href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
        style={{ color: appearance.primaryColor }}
      >
        {label}
      </a>
    ) : (
      label
    )
  ) : null;

  const sentence = interpolateTemplateVariables(text.trim(), appearance).trim();
  const parts = splitPrivacyNoticeText(sentence);
  const body = sentence
    ? parts.map((part, index) => (
        <Fragment key={index}>
          {part}
          {index < parts.length - 1 ? link : null}
        </Fragment>
      ))
    : link;

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <label className="flex items-start gap-2.5 text-xs leading-5 text-muted-foreground">
        <input
          type="checkbox"
          disabled
          tabIndex={-1}
          aria-hidden="true"
          className="mt-0.5 size-3.5 shrink-0"
          style={{ accentColor: appearance.primaryColor }}
        />
        <span>{body}</span>
      </label>
    </div>
  );
}

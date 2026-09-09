# Modernize the Internal Legal Chat Workspace

Written against: `cf4ef6211dc48a72fbe606c1d28ae96513793af0` plus the current working-tree version of `apps/admin/src/pages/InternalChatPage.tsx`

## Evidence chain

- Surface: protected admin route `/internal`, rendered by `InternalChatPage` through `apps/admin/src/App.tsx`.
- Selected region: the conversation stream beginning at the `space-y-4 max-w-3xl mx-auto` container in `apps/admin/src/pages/InternalChatPage.tsx`, together with the header, empty state, notices, composer, and settings drawer that establish its visual context.
- Problem: the page has the required dark palette and message states, but the conversation is presented as one undifferentiated sequence of compact bubbles. Long legal answers, citations, recommendations, warnings, timestamps, and message actions compete inside the same visual treatment. The surrounding header and composer also read as thin utility bars rather than a cohesive internal research workspace.
- Design evidence: `DESIGN.md` sections 2, 3.1–3.4, 5, 6.3, 9, 11–13 define the admin as a flat, sharp, low-chroma workbench; identify Internal Legal Chat as a dark operations surface; prescribe Geist, slate/blue tokens, semantic amber/rose/emerald, Lucide icons, concise copy, decisive 150–300 ms motion, and the global square-corner rule.
- Runtime evidence: `apps/admin/src/App.tsx` imports `InternalChatPage` and mounts it at `/internal`; `apps/admin/src/index.css` supplies the admin palette, Geist, zero radius tokens, and the global radius override; `apps/admin/src/pages/InternalChatPage.tsx` owns every visible state in the selected surface; `apps/admin/src/lib/format-message.ts` supplies the rich legal-response markup rendered inside assistant messages.
- Owner: `apps/admin/src/pages/InternalChatPage.tsx` remains the page and visual-composition owner. `apps/admin/src/lib/format-message.ts` remains the rich-text formatter. Global visual contracts remain owned by `apps/admin/src/index.css` and documented by `DESIGN.md`.
- Scope and affected surfaces: `/internal` at desktop, tablet, and mobile widths; empty, ready, active conversation, sending, editing, error, fallback-model, no-API-key, and open-settings states.
- Uncertainty: there is no supplied screenshot or visual reference. The executor must validate the plan in the browser before considering it complete, but should not substitute a different visual language.

## Design language

- Audited surface: Internal Legal Chat at `/internal` in the admin application.
- Design sources: current `DESIGN.md`; `apps/admin/src/index.css`; the dark operations exemplar in `apps/admin/src/pages/ConversationsPage.tsx`; shared `Button` behavior in `apps/admin/src/components/ui/button.tsx`.
- Documented decisions: dark slate operations canvas; flat admin geometry; blue primary action and focus; translucent accent tints; amber for attention/internal-use warnings; rose/red for errors; Geist for UI text; mono only for identifiers/model values; short sentence-case controls; Lucide icons; fast motion; no gradients on core surfaces.
- Governing owners and consumers: global palette/radius/type in `apps/admin/src/index.css` consumed by the admin root; shared button variants in `apps/admin/src/components/ui/button.tsx`; local chat composition in `apps/admin/src/pages/InternalChatPage.tsx`; rich response HTML in `apps/admin/src/lib/format-message.ts`.
- Explicit exceptions: None documented.

## Design decision

Reframe the page as a focused legal briefing workspace while retaining its identity as a dark admin operations surface. Assistant output should read like an editorial document optimized for long-form legal analysis; user prompts should remain compact and visibly authored by the staff member; the composer should become a stable command surface; notices and settings should remain subordinate system layers.

“Modern” in this surface means clearer hierarchy, deliberate density, better use of the wide canvas, persistent context, and polished state transitions. It does **not** mean gradients, glass cards, consumer-style rounded bubbles, a new color family, or a second design system. All shapes remain square at runtime under the existing global rule.

## Visual specification

### 1. Workspace frame and header

- Use `min-h-[100dvh] h-[100dvh]` behavior for the page so the working area is stable on mobile browsers while preserving the existing non-scrolling shell.
- Keep the header as a compact dark operations bar with `slate-950/900/800` layering and a single bottom border. Align its content to the same conversation measure used below rather than allowing the title and transcript to feel unrelated.
- Preserve the Bot chip, page title, active model, new-session action, settings action, Admin navigation, and logout behavior. Present the model as secondary mono metadata, not as a competing subtitle.
- Keep icon-only actions at the existing 32 px compact size, but ensure every one has a visible focus state and an accessible name. The settings action retains the documented translucent blue active tint.
- At widths below `sm`, keep labels hidden where already intended and preserve usable tap targets; do not introduce a permanent sidebar.

### 2. Empty workspace

- Replace the vertically isolated “bot icon + paragraph + warning pill” stack with a restrained briefing-start composition inside the same content measure as the transcript.
- Use the documented microlabel pattern for `INTERNAL LEGAL ASSISTANT`, followed by one clear title and one short explanatory sentence. Keep the Bot icon in a square blue-tinted chip.
- Render the “Not for client responses — internal use only” message as an amber bordered notice row beneath the introduction, not as a rounded consumer badge.
- Keep connecting and missing-key states immediately below the notice. Loading stays neutral with the existing spinner; missing configuration stays rose/red and names the fixable condition plainly.
- Do not add suggested prompts, attachments, search, citations, or other functionality as part of this visual redesign.

### 3. Conversation stream

- Increase the shared reading measure from the current `max-w-3xl` to a single `max-w-4xl` page measure used by transcript and composer, with responsive horizontal padding (`px-4`, then `sm:px-6`, then `lg:px-8`). Legal answers may use the full measure; user prompts remain narrower.
- Replace assistant “bubble” styling with a briefing row: a fixed square Bot identity chip in a narrow left column and a flexible response column with a subtle `slate-900/800` surface boundary. Use `text-slate-100` for the answer, `text-slate-400/500` for metadata, and `blue-400` for links. Preserve rich headings, lists, blockquotes, code, rules, and safe HTML formatting.
- Retain user messages as right-aligned blue prompt blocks, capped around 72–78% of the row on desktop and allowed to use more width on narrow screens. Keep white text and blue-tinted timestamp text.
- Keep error messages left-aligned with the assistant identity column, using only the documented rose/red surface, border, and text semantics.
- Move timestamps and copy/edit controls into a quiet metadata/action row associated with each message instead of overlaying controls across message content. Controls may fade in on pointer hover, but must also appear on `focus-within` and remain directly reachable on touch layouts.
- Preserve copy for all messages and edit for user messages. Preserve the existing copied-success emerald tint. Do not change message order, history construction, footer handling, or editing semantics.
- Maintain consistent vertical rhythm: larger separation between speaker turns than between a response and its metadata. Avoid decorative dividers between every message.

### 4. Rich legal-response typography

- Treat assistant prose as a document within the conversation: `text-sm` at compact widths, comfortable line height, controlled paragraph spacing, and stronger section-heading separation.
- Keep headings within the existing Geist family and color system. Keep code/identifiers in the existing mono stack.
- Keep lists outside-positioned with enough left padding for multi-line legal points; keep blockquotes as a slate left rule; keep horizontal rules subtle; keep links blue and underlined.
- Constrain wide code blocks to horizontal scrolling within the response column so they cannot widen the page.
- Implement these decisions in `apps/admin/src/lib/format-message.ts`, which is the page-local formatter used by `InternalChatPage`. Keep the response wrapper responsible only for layout and base text color. Do not create a global prose theme or modify widget formatting.

### 5. Sending state

- Preserve the assistant identity column and render the three-dot indicator in the same briefing surface used by assistant responses, so the layout does not jump when the answer arrives.
- Keep the bounce stagger, but place it within the documented motion budget and add a reduced-motion presentation through scoped `motion-reduce:animate-none` utilities or the local equivalent.
- Preserve automatic scrolling to the transcript end.

### 6. Composer as a command surface

- Keep the composer anchored below the scrollable transcript with the existing top border. Inside the shared `max-w-4xl` measure, wrap the textarea and send action in one contained `slate-900` command surface with a `slate-700/800` border.
- Keep the textarea auto-growing, one-row minimum, current maximum height, disabled logic, and keyboard behavior. Use a short placeholder such as `Ask a legal question…`; move `Enter to send · Shift+Enter for new line` into persistent low-contrast helper text so instructions do not disappear after typing.
- Keep the send action as the sole solid blue control in the composer and retain its loading spinner. The control remains square at runtime and uses the shared `Button` component.
- Integrate the editing state into a compact amber status strip at the top of the command surface, with the existing Cancel action. Preserve the current edit/send logic.
- Keep failure/connection conditions legible when the textarea is disabled; do not rely on opacity alone to explain why sending is unavailable.

### 7. Notices and settings relationship

- Preserve the fallback-model notice as a full-width amber system strip between header and transcript; align its inner content with the conversation measure and keep its dismiss action.
- Preserve the right-side settings drawer, scrim, save/reset behavior, model dialog, and `420px` desktop width. Only reconcile its header alignment, control focus treatments, and square geometry with the redesigned page; do not redesign the settings information architecture in this change.
- Keep the drawer’s 300 ms transform and dark system-layer identity. Add no blur or translucent panel effects beyond the documented scrim treatment.

## State matrix

| State | Required presentation | Behavior to preserve |
| --- | --- | --- |
| Empty and ready | Briefing-start composition, internal-use notice, active composer | Initial focus behavior and first send |
| Connecting | Neutral spinner and “Connecting to AI…” status | Composer disabled until ready |
| API key missing | Plain rose/red fixable-condition message | No send until configured |
| User message | Compact right-aligned blue prompt block | Copy, edit, timestamp |
| Assistant message | Full reading-width briefing row | Rich formatting, copy, timestamp, response footer |
| Error message | Left briefing row with rose/red semantics | Error text preserved verbatim |
| Sending | Stable assistant row with reduced-motion-safe indicator | Auto-scroll and send lock |
| Editing | Amber strip integrated with composer | Cancel, replace prompt, remove following assistant reply |
| Model fallback | Amber system strip aligned to content measure | Dismiss and model names |
| Settings open | Dark right drawer over scrim | Draft/save/reset/model-dialog behavior |

## Reuse

- Existing palette, font, radius, and focus tokens from `apps/admin/src/index.css`.
- Existing `Button` component and its default blue action behavior from `apps/admin/src/components/ui/button.tsx`.
- Existing `cn` helper and Lucide icons already imported by `InternalChatPage`.
- Existing rich formatter from `apps/admin/src/lib/format-message.ts`.
- Exemplar: dark canvas, borders, action density, and semantic message colors in `apps/admin/src/pages/ConversationsPage.tsx`.
- Exemplar: the Internal Legal Chat rules already recorded in `DESIGN.md` section 6.3.

No new shared primitive is required. Keep the composition local to `InternalChatPage.tsx`; do not create a shared component solely because multiple dark pages contain messages.

## Changes

1. `apps/admin/src/pages/InternalChatPage.tsx`
   - Change: reorganize the page shell, header alignment, empty workspace, transcript, message rows, typing state, fallback strip, and composer according to the visual specification and state matrix above.
   - Preserve: all current state, API calls, model fallback notice, settings persistence, conversation history, response-footer stripping, logging, copy/edit behavior, new-session behavior, navigation, logout, auto-scroll, keyboard send, and drawer behavior—including the user’s current uncommitted logic changes.
   - Verify: every state remains visually coherent without changing business behavior; long legal answers read as documents while user prompts remain visibly distinct.

2. `apps/admin/src/lib/format-message.ts`
   - Change: tune heading, paragraph, list, quote, code-block, and rule classes to produce the specified legal-document hierarchy inside assistant responses.
   - Preserve: escaping, supported Markdown subset, external-link safety attributes, and all formatter behavior. Do not modify `packages/widget/src/dom.ts` or any widget style.
   - Verify: headings, numbered and bulleted lists, blockquotes, inline code, fenced code, rules, links, bold, and italics remain correctly formatted inside the new response surface.

3. `apps/admin/src/index.css`
   - Change: none expected. Add no page-specific global selectors and do not alter radius or palette tokens.
   - Preserve: Geist, existing slate/blue theme, and `#root [class*="rounded"] { border-radius: 0 !important; }`.
   - Verify: all admin geometry remains flat and other admin pages are visually unchanged.

4. `DESIGN.md`
   - Change after the implementation is accepted and visually validated: expand section 6.3 with the final conversation pattern—assistant briefing rows, compact blue user prompts, shared `max-w-4xl` reading/composer measure, command-surface composer, touch/focus-visible message actions, and reduced-motion sending state.
   - Preserve: the “Backstage: sharp and quiet” concept, the dark operations palette, flat-corner discipline, existing semantic colors, and every widget-specific rule.
   - Verify: documentation describes the final implementation exactly and introduces no aspirational behavior that was not shipped.

## Scope

- Inherit: all states of the `/internal` page because they share the same page-local structure.
- Verify: the model-selection dialog and settings drawer because they overlay the redesigned workspace; `/conversations` because it supplies the closest dark-surface exemplar but must not change.
- Exclude: public widget UI, Conversations inbox redesign, AI behavior, prompt content, model configuration, data persistence, chat logging, attachments, prompt suggestions, sources/citation retrieval, conversation history navigation, new dependencies, global radius changes, and new color tokens.

## Implementation sequence

1. Capture baseline screenshots of `/internal` at approximately 1440×900, 768×1024, and 390×844 for empty, active conversation, and open-drawer states. These are validation artifacts only, not new design authority.
2. Establish the shared workspace measure and responsive page frame; align header, notice content, transcript, and composer.
3. Recompose the empty state and each message role without changing state or handlers.
4. Recompose the composer and editing strip while preserving textarea sizing, key handling, disabled logic, and send behavior.
5. Tune scoped rich-response typography and the stable typing row.
6. Reconcile focus, hover, touch, disabled, and reduced-motion presentations.
7. Validate every state and viewport, then update `DESIGN.md` with only the implemented decisions.

## Validation

- Product: sign in, open `/internal`, send a prompt, receive a long answer, copy both roles, edit a prior prompt, cancel editing, start a new session, open/save/reset settings, dismiss a fallback notice, and verify all behavior is unchanged.
- Interface: inspect empty, connecting, missing-key, user, assistant, long Markdown, error, sending, editing, fallback-notice, copied-success, disabled-composer, and settings-open states at 1440×900, 768×1024, and 390×844. Include very long words, URLs, code blocks, multi-level-looking legal lists, and a long response footer.
- Responsive: confirm there is one vertical page scroll owner (the transcript), no horizontal page overflow, the drawer fills the viewport on mobile, the composer remains visible above the mobile viewport edge, and message actions are usable without hover.
- System: confirm all colors resolve to existing slate/blue/amber/rose/emerald utilities; all corners remain square at runtime; there are no gradients, glass panels, or widget-style pills; `/conversations`, `/`, and the public widget remain unchanged.
- Accessibility: tab through header controls, message actions, composer, and drawer; verify visible focus, accessible icon names, sensible focus order, and non-animated typing feedback under reduced motion.
- Repository: `npm run build --workspace=apps/admin` → TypeScript and Vite complete successfully.
- Repository: `npm run lint -- --quiet` → no new lint errors introduced by the redesign.
- Review: inspect `git diff -- apps/admin/src/pages/InternalChatPage.tsx apps/admin/src/lib/format-message.ts apps/admin/src/index.css DESIGN.md` → only the scoped presentation and accepted documentation changes are present; user-authored chat logic remains intact.

## Stop conditions

- Stop if the working-tree changes in `InternalChatPage.tsx` cannot be preserved cleanly; reconcile with their owner before rewriting the affected blocks.
- Stop if the redesign requires changing global radius or color tokens, because that would affect every admin surface and exceed this plan.
- Stop if the desired “modern” direction requires new product behavior such as attachments, sources, history, or prompt suggestions; specify that as a separate product change.
- Stop if browser validation shows that `100dvh` or the contained composer causes clipping or keyboard overlap on supported mobile browsers; correct the local frame without modifying widget safe-area behavior.
- Stop if changes to `format-message.ts` would alter the public widget; the widget has a separate formatter and is explicitly out of scope.

## Design documentation

- After acceptance and validation: update `DESIGN.md` section 6.3 with the implemented Internal Legal Chat workspace pattern and section 9 with the reduced-motion behavior for the sending indicator. Do not change the global flat-admin versus soft-widget distinction.

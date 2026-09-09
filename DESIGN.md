# Duran Chatbot — Frontend Design Reference

> **Purpose.** This document preserves the *theme, look, and idea* of the frontend so the design can be understood, reproduced, and evolved consistently. If you change colors, radii, type, layout, or motion, read this first and keep the conventions below intact.

---

## 1. What this codebase is

A chatbot product with **three frontend surfaces**, all in one repo:

| Surface | Location | Audience | Tech |
|---|---|---|---|
| **Admin console** | `apps/admin` | The business (staff) | React 19 + Vite + Tailwind CSS v4 + shadcn-style primitives (`cva`), lucide-react icons |
| **Embeddable chat widget** | `packages/widget` | Website visitors | Vanilla TypeScript, Shadow DOM, hand-written CSS string, no framework |
| **Widget preview page** | `apps/admin/src/pages/widget-preview-page.tsx` (`/?preview=1`) | The business (approving changes) | React; mounts the *real* widget |
| Shared config types/defaults | `packages/config` | Both | Plain TypeScript (drives what is customizable) |

The widget's *appearance is data*: an admin edits an `AppearanceConfig`, and the widget renders it via CSS custom properties. Everything the visitor sees (colors, radius, position, company name, welcome message) is config, delivered through `/api/config`.

---

## 2. The design idea

> **Backstage: sharp and quiet. Front stage: soft and brand-colored.**

The product deliberately runs two distinct visual dialects, and the contrast *is* the design:

1. **The admin console is a flat, sharp-cornered, low-chroma "workbench."** Neutral slate surfaces on a very light canvas, one restrained blue accent, and semantic status colors (emerald/amber/rose). No gradient chrome, no decorative rounding — panels, buttons, chips, even avatars render as **squares**. It reads as precise, fast, utilitarian.
2. **The visitor-facing widget is soft, rounded, and warm.** A circular floating launcher, 16px-radius message bubbles with a tiny "tail" corner, pill inputs, gentle float/enter animations — all tinted by the client's own brand color. It reads as approachable and human.

Same product, two moods: **work** and **welcome**.

### Corner-radius discipline (important)

The sharp admin look is **enforced globally**, not just styled:

- All radius tokens in `apps/admin/src/index.css` are `0rem` (`--radius-sm … --radius-3xl`).
- An explicit override guarantees it:
  ```css
  #root [class*="rounded"] { border-radius: 0 !important; }
  ```
  (Introduced deliberately in commit `e2fdb6c` alongside the responsive/mobile layout.)

This means utility classes like `rounded-xl`, `rounded-2xl`, and `rounded-full` still *appear* in components (they express shape intent and future flexibility), but at runtime **everything inside `#root` renders square** — cards, buttons, badges, chips, avatars, dots, and spinning loaders. The only softening cue that survives is the **ring** (focus rings, selection rings).

The widget, by contrast, lives in a Shadow DOM outside `#root` and is **fully rounded** (`packages/widget/src/styles.ts`). Never apply the admin flattening rule to widget styles, and never add rounding "back" into the admin at the utility level — if the flat look is ever reconsidered, remove the override and zero-tokens *globally*, not per-component.

---

## 3. Visual foundations

### 3.1 Typography

| Context | Font stack |
|---|---|
| Admin console | `"Geist Variable", sans-serif` (imported via `@fontsource-variable/geist`; mapped to `--font-sans`) |
| Code / mono inside admin | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace` |
| Widget (visitor site) | System stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` — deliberately *not* a webfont, so it stays lightweight and matches the host page |

Admin type conventions:

- **Microlabels / eyebrows** — `text-[10px]` or `text-xs`, `font-semibold`, `uppercase`, `tracking-widest` (≈`0.2em`), `text-slate-400/500`. Used above section titles ("Settings", "Brand System", "Widget Preview", "Config snapshot").
- **Titles** — `text-xl font-semibold tracking-tight text-slate-900` (sections), `text-2xl` on standalone pages.
- **Body / descriptions** — `text-sm leading-6 text-slate-500`; fine print `text-xs leading-5 text-slate-500`.
- **Labels on form fields** — `text-sm font-medium text-slate-700`.
- Slug/model values that are identifiers are shown in `font-mono` (`profile.slug`, model label in the Internal Chat header).
- Body is set to `text-rendering: optimizeLegibility` + antialiasing in `index.css`.

### 3.2 Admin color language

Token source: `apps/admin/src/index.css` (`@theme inline`). Values map onto Tailwind's slate/blue palette.

**Neutral canvas & text**

| Token | Value | Used for |
|---|---|---|
| `--color-background` | `#f8fafc` (slate-50) | Page background (`bg-slate-50`) |
| `--color-foreground` | `#0f172a` (slate-900) | Body text |
| `--color-card` | `#ffffff` | Card/panel surface |
| `--color-card-foreground` | `#0f172a` | |
| `--color-border` / `--color-input` | `#e2e8f0` (slate-200) | Hairlines, inputs |
| `--color-muted` / `--color-secondary` / `--color-accent` | `#f1f5f9` (slate-100) | Subtle fills |
| `--color-muted-foreground` | `#64748b` (slate-500) | Secondary text |
| `--color-secondary-foreground` / `--color-accent-foreground` | `#334155` (slate-700) | |

**Accent & status**

| Role | Value | Usage notes |
|---|---|---|
| Primary / ring | `#2563eb` = blue-600 | Buttons default, active nav, focus rings, "Edit" CTAs, send buttons in dark surfaces |
| Hover (light bg) | `bg-blue-700` | Button default hover |
| Success / saved | emerald-500/600 (e.g. `#10b981`/`#059669`) | "Saved", status pills, admin-reply affordances |
| Warning / dirty | amber-400/500/600 | "Unsaved changes", "Needs reply", editing cues |
| Destructive / error | `#dc2626` red-600, rose-600/rose-50 surfaces | Delete, logout hover, error banners |
| Link | `text-blue-600`, underline | |

**Dos & don'ts.** Stay inside the slate + blue-600 family for structure and primary action. Use emerald/amber/rose only with their semantic meaning (success / attention / destructive). There is **no** purple, orange, cyan, or pink in the UI, and no gradients on core surfaces (the only gradient is the preview-page "canvas" background, and a faint blue sheen on the Internal Chat CTA card).

### 3.3 Dark "operations" surfaces

Four screens run a **dark variant of the same system** on `bg-slate-950`:

- Login page (`LoginPage.tsx`)
- Conversations inbox (`ConversationsPage.tsx`)
- Internal Legal Chat (`InternalChatPage.tsx`)
- The Config editor's **sidebar** and **dialogs** (dark panels inside an otherwise light app)

Shared dark palette: canvas `slate-950`, panels `slate-900`, borders `slate-800`, elevated fills `slate-800/60–70`, input borders `slate-700`, placeholder `slate-600`, body text `slate-100/white`, secondary text `slate-400/500`. Accents are applied as **translucent tints** rather than solid fills:

- Active nav row: `bg-blue-500/20 text-white`, icon `text-blue-400`
- Hover rows: `hover:bg-slate-800`
- Icon chips: `bg-blue-500/15 text-blue-400`
- Amber warning chips: `bg-amber-500/10–15 border-amber-500/20 text-amber-400`
- Admin ("you") messages in the inbox: `bg-emerald-600/20 border-emerald-500/30 text-emerald-50`, label `text-emerald-300`
- Unread dot: solid `bg-blue-500` with a `ring-2 ring-slate-950` halo

Dialogs are dark **even when the rest of the page is light** — the dialog panel is `bg-slate-900 border-slate-700` over a `bg-black/60 backdrop-blur-sm` scrim. Keep that: it gives modals a consistent "system layer" identity.

### 3.4 Elevation & shadows

| Element | Shadow |
|---|---|
| Light cards / panels | `shadow-sm` + `border-slate-200` |
| Hovered profile row | `hover:shadow-md` (+ `hover:border-blue-200`) |
| Sticky admin top bar | `shadow-sm` over `border-b border-slate-200` |
| Dark drawer (settings) | `shadow-2xl` |
| Mobile sidebar overlay scrim | `bg-black/50 backdrop-blur-sm` |
| Dialog scrim | `bg-black/60 backdrop-blur-sm` |
| Widget floating elements | soft `0 4–16px` black shadows with low alpha (`rgba(0,0,0,.15–.2)`); hover lifts slightly |

---

## 4. Admin console anatomy

### 4.1 Shell (`components/layout/admin-shell.tsx`)

- Desktop: fixed **dark** left sidebar `w-64` (`bg-slate-900`); content column padded `lg:pl-64`.
- Sticky top bar (`z-30`, white, `border-b`).
- Content: `px-4 py-6 sm:px-6 lg:px-8`, constrained by `max-w-5xl space-y-6`.
- The active settings panel renders inside a white bordered card; below it a 3-column grid of `aside` cards (`sm:grid-cols-2 lg:grid-cols-3`).
- Mobile (`< lg`): the sidebar becomes a slide-in drawer `w-72` with an overlay scrim, toggled from a hamburger in the top bar.

### 4.2 Sidebar (`sidebar-nav.tsx`) — dark

1. **Logo row** — `logo.webp` at `h-9`, separated by `border-b border-slate-800`.
2. **Save-status pill** — 12px, translucent fill: emerald (`bg-emerald-500/15 text-emerald-400` + dot) when clean, amber when dirty ("Unsaved changes" / "All changes saved").
3. **"SETTINGS" microlabel** — 10px uppercase tracking-widest `text-slate-500`.
4. **Nav rows** — icon (16px, lucide) + label, `py-2.5`, rounded (→ flat at runtime). Active = `bg-blue-500/20 text-white`, icon `text-blue-400`, plus a 6px blue dot on the right. Inactive = `text-slate-400 hover:bg-slate-800 hover:text-slate-100`.

Order of sections (`features/config-editor/sections.tsx`): Appearance → AI Settings → Persona → Action Menu → Services → Dataset → Behavior → Contact & Location → Email.

### 4.3 Top bar (`top-bar.tsx`) — light, 56px (`h-14`)

Breadcrumb pattern `Profiles / {profileName} · {section}` on the left; actions right:

- Status text: "Saved" (`CheckCircle2`, emerald) or "Unsaved changes" (amber) — desktop only.
- **Preview** — outline button, `ExternalLink` icon.
- **Save** — primary button, disabled unless dirty; label "Saving…" while saving.
- **Conversations** — bordered link button (`MessageSquare`).
- **Logout** — ghost icon button; hover turns `text-red-600 bg-red-50`.

---

## 5. Admin UI kit (primitives)

Components in `components/ui/`. Base look: `h-10` controls, 1px `slate-200` borders, white bg, blue focus ring `focus:border-blue-400 focus:ring-2 focus:ring-blue-100`, disabled = 40–60% opacity + `not-allowed`.

**Button** (`button.tsx`, `cva`)

| Variant | Look |
|---|---|
| `default` | `bg-blue-600 text-white`, hover `bg-blue-700`, `shadow-sm` |
| `outline` | white + `border-slate-200`, `text-slate-700`, hover `bg-slate-50` |
| `secondary` | `bg-slate-100 text-slate-700`, hover `bg-slate-200` |
| `ghost` | transparent, `text-slate-600`, hover `bg-slate-100` |
| `destructive` | `bg-rose-600 text-white`, hover `bg-rose-700` |
| `link` | blue, underline on hover |

Sizes: `xs (h-7)`, `sm (h-8)`, `default (h-10)`, `lg (h-11)`, icon variants. Compact bars use `h-8 px-3 text-xs gap-1.5` with 14px icons — the "chunky toolbar button" style seen in the TopBar/Conversations.

**Form fields** (`field.tsx` + inputs)
- Field = label above control, `space-y-2.5`; `FieldGrid` = 2-col at `md`.
- Input/Select/Textarea: described above; Select draws a `ChevronDown` affordance; `Switch` = 28×48px pill track (`h-7 w-12`), checked `bg-blue-600` with knob `translate-x-6`, otherwise `bg-slate-100`.
- `ColorInput`: native color swatch + hex text input side by side.
- Field descriptions in `text-xs text-slate-500`.

**Card** — `rounded-2xl border border-slate-200 bg-white shadow-sm` (flat at runtime), header `p-5`, title `text-lg font-semibold tracking-tight`, description `text-sm leading-6 text-slate-500`.

**SectionHeader** — bordered bottom (`border-slate-100`, `pb-5`), optional eyebrow, `text-xl` title, `text-sm` description, optional action slot. Every settings panel opens with one.

**Badge** — small pill `rounded-full border px-2.5 py-1 text-xs`: `default` (blue-50/blue-700), `secondary` (slate), `success` (emerald), `warning` (amber). (Rendered square by the global override.)

**Dialog** (`dialog.tsx`) — dark system layer described in §3.3: `max-w-lg`, rounded-2xl (→ flat), header with title + X, scrollable body, Esc/overlay-click to close.

**Banners & states**
- `StatusBanner` — info (white/slate icon chip) or error (rose-50, rose icon chip) row cards.
- Loading — centered `size-8 animate-spin` ring (`border-slate-200 border-t-blue-500`) + caption ("Loading profiles…", "Loading workspace…").
- Empty states — dashed-border card, centered lucide icon in `text-slate-300`, medium title, helper text, primary CTA (see profile list).
- Error blocks — `rounded-xl border-rose-200 bg-rose-50 text-rose-700`.

### Iconography

All admin icons are **lucide-react**, `size-4` inside buttons, `size-3.5` in compact/`sm`, `size-5/6` for page-level glyphs. Icon-with-tint chips are a recurring motif (blue `bg-blue-50 text-blue-600`, dark `bg-blue-500/15 text-blue-400`). The widget uses its own inline SVGs (see §7).

---

## 6. Admin pages

### 6.1 Profile hub (`features/profiles/profile-list.tsx`)

Light page (`bg-slate-50`, `max-w-3xl`). Header: blue square logo chip with `Bot` icon + "Chatbot Profiles" + "New profile" primary button. Rows (active): white cards that lift on hover (`hover:border-blue-200 hover:shadow-md`), left icon chip + name/slug/date, right ghost icon actions (edit, archive, delete) + primary **Edit →** button. Archived section uses muted rows on `slate-50` with secondary badges. A dark gradient CTA card links to the Internal Legal Chat. Fullscreen `Dialog`s handle create/rename.

### 6.2 Conversations inbox (`pages/ConversationsPage.tsx`) — dark, full-screen `h-screen`

Master–detail mail-client layout on `bg-slate-950`:

- **Left rail (w-72):** brand row, "Config / refresh / logout" actions, per-profile **tabs** (active `bg-blue-500/20 text-blue-400`), search box (`bg-slate-800/60`), and the user list.
- **User rows:** avatar chip (flat square at runtime) with blue unread dot, name (white, semibold when unread), email, relative time; row-wide **attention** cue = 2px amber left border + "Needs reply" amber pill when the visitor's last message is unanswered.
- **Thread panel:** header with identity + meta ("First seen · N messages") + **Export CSV**; bubbles `max-w-[70%] rounded-2xl`:
  - visitor: `bg-blue-600 text-white`, corner `rounded-br-md` (→ flat);
  - AI/assistant: `bg-slate-800 text-slate-100`;
  - **admin (you):** `bg-emerald-600/20 border-emerald-500/30 text-emerald-50` with a `Headset` label row in emerald-300 — it must stay visually distinct in the inbox but *seamless* in the visitor widget (see §7.5).
  - timestamps 10px (`text-blue-200` on visitor, `text-slate-500` otherwise).
- **Reply composer:** dark textarea (`bg-slate-800/60`, emerald focus ring) + emerald "Send" button; hint "⌘/Ctrl+Enter to send".

### 6.3 Internal Legal Chat (`pages/InternalChatPage.tsx`) — dark

Full-screen chat like a messaging app:

- **Reference rail:** at `xl+`, a separately scrolling right rail (`w-80`, `2xl:w-96`) collects source links and sandboxed Google Search suggestions by question in conversation order. It uses slate-950 canvas, slate-900 link surfaces, slate-800 borders, blue-400 reference numbers, and Geist utility text. Inline citations remain in answers; the full source appendix is retained for copying. On smaller screens, a header References button opens the same content in a native modal dialog with Escape, focus containment, and a visible close action. New sessions clear the rail along with the conversation. No additional motion is introduced.

- Header: its content follows the same `max-w-4xl` measure as the transcript and composer; a square `Bot` chip, title "Internal Legal Chat", compact model name in `font-mono`, and actions for new session, back to admin, and logout establish the workspace context.
- Empty state: a left-ruled legal-briefing introduction uses the standard uppercase microlabel, a blue icon tile, one explanatory paragraph, and a full-width amber internal-use notice. Connection and missing-key states attach directly below it.
- Conversation measure: transcript and composer share `max-w-4xl` with responsive page gutters. Long assistant answers may use the full reading width; staff prompts remain compact and right-aligned.
- Assistant responses: a square blue identity chip sits in a narrow left rail; the answer renders as an editorial `bg-slate-900/60 border-slate-800` briefing surface with a blue uppercase speaker label. Rich headings, paragraphs, outside-positioned lists, blockquotes, rules, links, and horizontally scrolling code are supplied by `formatMessage`.
- Staff prompts: `bg-blue-600 text-white` blocks capped at roughly 78% on desktop and 88% on mobile. Errors use the same left-rail composition with `bg-red-950/50 border-red-800/50 text-red-200` semantics.
- Message metadata: timestamps and copy/edit actions sit below the associated message instead of overlaying its content. Actions reveal on hover or keyboard focus at `sm+` and remain visible on touch layouts; copied success uses emerald.
- Typing: three staggered dots occupy the same assistant briefing row so the transcript does not reflow when the response arrives. Under reduced motion, the dots remain visible but stop bouncing.
- Composer: an anchored `bg-slate-900 border-slate-700` command surface contains the auto-growing textarea (`fieldSizing: content`), the sole solid-blue send control, persistent keyboard guidance, and a visible connection status. Editing adds an amber strip within the same surface.
- **Settings drawer:** right-side panel `w-full sm:w-[420px] bg-slate-900 border-l border-slate-800`, slides via `translate-x`, scrim behind; contains system prompt, model select, temperature slider, dataset editor, response footer.
- **Settings entry:** a square, bordered slate control at the left of the composer input opens the drawer. It matches the 42px send-button height, shows an icon plus “Settings” at `sm+`, and uses an icon alone on mobile. The open state uses the standard translucent blue tint.

### 6.4 Login (`pages/LoginPage.tsx`) — dark, minimal

Centered on `bg-slate-950`, no card: blue `Lock` icon chip, "Admin Login" + sub-copy, then a plain form (`max-w-sm`): labels `text-xs text-slate-400`, dark inputs (`bg-slate-900 border-slate-700`, blue focus ring), full-width primary submit, and a soft red error strip. This restraint is intentional.

---

## 7. The embeddable widget (`packages/widget`)

**Architecture:** a `ChatbotWidget` class creates a host + Shadow Root, injects one `<style>` (all CSS lives in `styles.ts`), builds HTML strings from `dom.ts`, and mounts fixed at the viewport corner. Styles are namespaced `cb-*`, isolated via `:host { all: initial }`, and depend on CSS custom properties injected by `getCSSVariables()` in `dom.ts`.

### 7.1 Design tokens (CSS variables)

| Variable | Source | Role |
|---|---|---|
| `--cb-primary` | `appearance.primaryColor` | Brand action color — header band, launcher, user bubbles, send, links, focus |
| `--cb-accent` | `appearance.accentColor` | **Hover** color for primary controls |
| `--cb-bg` | `appearance.backgroundColor` | Chat window background |
| `--cb-text` | `appearance.textColor` | Message/body text color |
| `--cb-radius` | `appearance.borderRadius` | Chat-window shell radius (UI offers 8 / 12 / 16 px; default 12) |
| `--cb-keyboard-offset` | runtime (JS) | iOS keyboard lift for the composer |

Defaults in `packages/config`: primary `#004a99` (deep brand blue), accent `#0056b3`, bg `#ffffff`, text `#212529`, radius `12`, position bottom-right.

### 7.2 Geometry & chrome

| Element | Spec |
|---|---|
| Launcher FAB | 60px circle, primary bg, white 28px glyph, `box-shadow 0 4px 12px rgba(0,0,0,.15)` |
| Position | 20px from bottom+corner; mirrors to bottom-left via `[data-position]` |
| Chat window | 440×600 (caps: `calc(100vw-40px)`, `calc(100vh-120px)`), `border-radius: var(--cb-radius)`, shadow `0 8px 32px rgba(0,0,0,.15)` |
| Header | Solid **primary** band, white 16px semibold company name, ghost X button |
| Composer | White, `border-top #e9ecef`; message input is a **pill** (`border-radius: 24px`); send is a 40px **circle** in primary |
| Mobile (<420px) | Window becomes **fullscreen** (`inset:0`, radius 0), composer sticky with keyboard-offset + `safe-area-inset` paddings |
| Message max width | 86% (bubbles) |

### 7.3 Bubbles & type

Bubble recipe: 13px text, `line-height 1.45`, `padding 9px 13px`, `border-radius 16px`, with the corner nearest the sender flattened to **4px** (the "tail" cue).

| Bubble | Fill / text | Alignment |
|---|---|---|
| User | `var(--cb-primary)` / white | right |
| AI / persona | `#f1f3f5` / `var(--cb-text)` | left |
| Agent ("middleman" human reply) | `#f1f3f5` / `var(--cb-text)` + 11px semibold **primary** label above | left — *looks identical to AI on purpose* |
| Error | `#f8d7da` / `#721c24` | left |
| Friendly "problem" notice | `#fff7ed` / `#7c2d12`, border `#fed7aa` | left |
| Quote success | `#f0fdf4` / `#166534`, border `#86efac` | left |

Rich text: links underline in primary (fixed `#0056b3` inside AI bubbles), bold/italic/lists/mailto supported; timestamps 11px `opacity .6`; a **copy button** fades in at the bubble's top-right on hover. Enter animation = 8px rise + fade.

### 7.4 Surfaces inside the chat

- **Lead-capture form** (shown until the visitor gives name+email): title + two square-ish inputs (`#dee2e6` borders) whose focus state *lifts* (`translateY(-1px)` + soft shadow, primary border); full-width **square** submit (12px, weight 700).
- **Action menu** (configurable quick links): a rounded 18px floating panel above the composer; items are 13px-radius tiles with a small primary dot, and **fill primary on hover** (text flips white). 
- **CTA card** (post-answer): a brand-tinted chip row — bg `color-mix(primary 12%, transparent)`, border `color-mix(primary 20%, transparent)` — with italic 12px heading and pill buttons in primary (hover = accent).
- **Quote card**: light-blue tint (`#f0f6ff`, border `#bfdbfe`), navy text (`#1e3a5f`), textarea with blue focus glow, full-width square-ish submit (8px radius).
- Scrollbars: 6px, light gray thumbs.

Motion personality: FAB gently **floats** (`cb-float`, 3.2s infinite, ±4px); on open the chat icon **cross-fades + rotates** into an X (the FAB stays put and morphs); window opens with `scale(.94) translateY(14px) → 1` over .28s from the bottom corner; sections/bubbles rise in. Everything respects `prefers-reduced-motion` (animations and transitions removed).

### 7.5 The "middleman" seam

Human replies injected by staff (Conversations page) render in the visitor's widget with **the same style as AI messages** plus a small primary-colored agent label — so a human hand-off feels seamless, never like a different system.

---

## 8. Preview page (`/?preview=1`)

A "look but don't touch" QA stage that follows the **light admin** language (square panels, uppercase tracking labels) while simulating a real website:

- Page bg: soft diagonal slate gradient (`linear-gradient(135deg,#e2e8f0,#f8fafc,#cbd5e1)`).
- Hero panel: white/90 blur card, title + actions (Reload saved config / Open chat / Close chat / Back to editor).
- The "canvas" (left) is where the real widget mounts: gradient white panel with a faint **blueprint grid** background (32px cells, `rgba(148,163,184,.12)` hairlines).
- "Current state" aside (right, 320px) shows live config: position, primary color swatch, welcome message.

---

## 9. Motion & interaction budget

- Durations are **fast and decisive**: 150–300ms micro-interactions; 300ms drawers/sheets; 240–280ms widget chrome.
- Easing: CSS `ease` / `ease-in-out` (Tailwind), `ease` on widget transforms; hover effects are 150–200ms `transition-colors` / `transition-all` / `transition-transform`.
- Hover language: **fill** (buttons), **lift** (translateY(-1px) + shadow — inputs on focus, widget CTAs), **tint** (rows, chips), **morph** (FAB icon), **rotate** (FAB hover while open = 90° turn).
- Loading language: spin ring (admin), spinning lucide icon in buttons ("Saving…"/"Sending…"), bouncing dots (Internal Chat typing), CSS spinner circle (widget streaming). Internal Chat applies `motion-reduce:animate-none` to its typing dots and loading icons so status remains legible without continuous movement.
- `tw-animate-css` is imported (admin) and available for utility-driven micro-animations; keep usage aligned with the budget above.

---

## 10. Assets

- `apps/admin/public/logo.webp` — brand logo, dark-surfaces header usage (`h-9`/`h-8`).
- `apps/admin/public/favicon.svg`, `icons.svg`, `widget.js` (built embed script the admin points customers at).
- `apps/admin/src/assets/` — legacy Vite/hero assets (hero.png currently unused by the UI).
- Widget glyphs are **inline SVGs**: filled chat-bubble + X for the FAB (28px), outline menu ☰ (20px), filled send arrow (20px), X (20px), copy (14px). Keep stroke/fill consistent with `currentColor` so they inherit `--cb-primary`/white.

---

## 11. Copy & voice

### Formatted prompt and chat content

Multiline AI instructions, persona guidance, knowledge entries, service guidance,
preset messages, welcome text, and internal response footers use the shared
Editorcn prompt editor. The inline and expanded editors save Markdown strings;
underline uses the editor's `++text++` syntax.

Internal chat, the conversations inbox, and the public widget use
`formatRichMessage` from `packages/config` for that same Markdown dialect.
This includes fresh and restored messages and the widget welcome message.
Bold, italic, underline, strike-through, headings, lists, quotes, and code
retain their formatting. Surface-specific CSS preserves the admin's dark
square design and the widget's configured brand design. Raw HTML is escaped,
unsafe link protocols are rejected, and remote Markdown images render as text.

- UI chrome: short, imperative, sentence case ("Save", "Preview", "New profile", "Export CSV"); section *labels* may be capitalized words ("Action Menu").
- Microlabels are uppercase + letterspaced; never shout in body copy.
- Descriptions are calm and explanatory, one sentence, `text-sm` ("Each profile has its own knowledge, persona, and widget settings.").
- Status language: "All changes saved" / "Unsaved changes" / "Saved"; error copy states the fixable condition plainly.
- The persona panel configures the *widget's* voice; the *admin UI's* voice stays neutral and tool-like.

---

## 12. Accessibility & responsive conventions to keep

- Every icon-only control has `aria-label`/`title`; `role="dialog"`, `role="log" aria-live="polite"`, `aria-pressed`, `aria-expanded`, `aria-checked` are used where relevant (widget included).
- Focus is never `outline: none` without a replacement: admin uses `focus-visible:ring-2`/`focus:ring-*` blue rings; widget inputs color the border + glow.
- `prefers-reduced-motion: reduce` kills widget animation/transitions wholesale.
- Safe-area insets + `100dvh` + keyboard-offset handling on mobile widget; `env(safe-area-inset-*)` respected.
- Breakpoints: shell sidebar `lg` (drawer below), field grids `md`, top-bar breadcrumbs hide below `sm`, widget fullscreen below `420px`.

---

## 13. Rules for future work (preserve this look)

1. **Change global things globally.** Radius, fonts, and semantic colors live in one place: `apps/admin/src/index.css` `@theme inline`. Don't fight them per-component.
2. **Square = admin, round = widget.** Never add `rounded-*` expecting it to show in the admin; never strip rounding from widget CSS.
3. **Use the slate/blue lexicon.** New hues need a real reason; status colors stay semantic (emerald=success/saved/human-reply, amber=dirty/attention, rose/red=destructive/error).
4. **Two dark layers allowed**: the config sidebar + dialogs, and the full-dark ops screens (Login/Conversations/Internal). Translucent blue tints (`/15–20`) are the house style for active states on dark.
5. **Keep typography minimal.** Geist (admin), system stack (widget); mono only for identifiers; uppercase+tracking only for microlabels.
6. **Widget colors are config.** If new widget styling is needed, route colors through `AppearanceConfig`/`--cb-*` vars — never hardcode brand colors into widget CSS (neutrals like `#f1f3f5` bubbles and `#e9ecef` borders are fine).
7. **Motion stays in budget** (§9) and honors `prefers-reduced-motion`.
8. **The "middleman" seam matters**: human replies should keep looking native inside the widget while staying clearly labeled.

---

## 14. Intentional design pivots (changelog)

- `e2fdb6c` — **Flat-corner overhaul + mobile layout**: radius tokens zeroed and `#root [class*="rounded"] { border-radius: 0 !important; }` added; shadcn `oklch` token system replaced by the explicit hex slate/blue palette in `index.css`; responsive sidebar-as-drawer and widget preview introduced. Treat the flat look as a deliberate decision, not a bug.

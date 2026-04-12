# Duran Chatbot

A configurable AI chatbot system for Duran & Duran-Schulze Law. The project includes an embeddable website widget, an admin dashboard for editing chatbot profiles, shared configuration types, and Vercel API routes for profile storage, Gemini model discovery, chatbot config delivery, and quote-request email notifications.

The system is built as an npm workspace monorepo:

- `apps/admin`: React + Vite admin dashboard.
- `packages/widget`: embeddable floating chatbot widget.
- `packages/config`: shared TypeScript config types, defaults, and merge helpers.
- `api`: Vercel serverless API routes.
- `data/config.json`: fallback/default chatbot configuration.

## What The System Does

This project lets you manage one or more chatbot profiles and embed a selected profile on a website through a simple script tag.

At runtime, the widget:

1. Loads `widget.js` from the deployed app.
2. Reads the optional `data-profile` value from the embed container.
3. Fetches the matching config from `/api/config`.
4. Receives the Gemini API key from the server response.
5. Mounts a Shadow DOM floating chat widget on the host website.
6. Captures the visitor name and email before chat starts.
7. Sends the visitor message, profile details, services, dataset, and persona guidance to Gemini.
8. Detects quote/pricing intent and can collect a quote-request message.
9. Sends quote requests by email to configured internal recipients.

## Current Feature Inventory

### Admin Dashboard

The admin dashboard is the control center for chatbot profiles and configuration.

- Profile list screen for managing multiple chatbot profiles.
- Create profile flow with profile name and URL-safe slug.
- Archive profile flow with protection against archiving the last active profile.
- Profile-specific editor: each profile has its own config, knowledge, services, persona, appearance, and behavior.
- Dirty-state save workflow: edits stay local until you click save.
- Save status feedback after successful updates.
- Responsive admin shell with sidebar navigation and mobile menu.
- Configuration summary card for quickly checking current settings.
- Generated embed-code card for the active profile.
- Preview button that opens the real widget preview using the current unsaved config.
- Fallback error banners when config or profile operations fail.

### Profile Management

Profiles let the same system power different brands, sites, or chatbot variants.

- Default profile slug: `duran-schulze`.
- Profile metadata includes `slug`, `name`, `status`, and `createdAt`.
- Active profiles can be edited.
- Archived profiles are shown separately and are no longer editable from the profile list.
- Profile data is stored in Redis when `REDIS_URL` is configured.
- If Redis has no profile index yet, the system bootstraps one from the legacy config key or `data/config.json`.
- Old single-config storage under `chatbot:config` can be migrated into the profile system automatically.

### Appearance Settings

The Appearance section controls the visible brand layer of the widget.

- Company name.
- Welcome message.
- Widget screen position: bottom right or bottom left.
- Primary color.
- Accent color.
- Background color.
- Text color.
- Border radius presets: small, medium, and large.

These values become CSS variables inside the widget Shadow DOM, so the embedded widget keeps its styling isolated from the host website.

### AI Settings

The AI Settings section controls the Gemini model and response behavior.

- Editable system prompt.
- Gemini model selector.
- Live model list loaded from the Gemini models API through `/api/models`.
- Fallback model list if model loading fails:
  - `gemini-2.5-flash`
  - `gemini-2.5-pro`
  - `gemini-2.0-flash`
- Temperature slider from `0` to `1`.
- Max token input from `256` to `8192`.
- Gemini API key is injected from the server environment and stripped before config is saved.

The default legal assistant prompt tells the bot to provide general legal-process information for Philippine law topics while avoiding formal legal advice and directing users to consult Duran & Duran-Schulze Law attorneys.

### Persona Settings

Persona settings add a voice layer on top of the main system prompt without replacing safety or legal guardrails.

- Enable or disable persona voice guidance.
- Persona name.
- Role or relationship.
- Tone guidance.
- Writing style guidance.
- Signature phrases.
- Do instructions.
- Do-not instructions.
- Audience notes.

When enabled, persona fields are appended to the Gemini system instruction with a reminder that the bot should reflect communication style without claiming to literally be the person.

### Quick Links

Quick links appear inside the widget after lead capture and help visitors take common actions quickly.

- Add, edit, and remove quick links.
- Each quick link has a label, destination URL, and icon name.
- Supported icon labels in the admin UI:
  - `link`
  - `calendar`
  - `globe`
  - `mail`
  - `phone`
- The widget currently displays the first two quick links as shortcut buttons.
- Links open in a new tab with `noopener noreferrer`.

Default quick links include:

- Schedule with Atty. Marie Christine.
- Schedule with Atty. Mary Wendy.
- Visit the official website.

### Services Knowledge

Services are structured sales/process entries used when users ask about service offerings, pricing, process, inclusions, exclusions, or next steps.

Each service entry includes:

- Service name.
- Keywords.
- Flexible price text.
- Process explanation.
- Notes for caveats, inclusions, exclusions, or qualifiers.
- CTA or recommended next step.

When present, service entries are added to the Gemini system instruction as a service knowledge base. The bot is instructed to use stored price wording faithfully, avoid inventing prices, and guide visitors toward the configured next step.

### Dataset Knowledge Base

Dataset entries provide trusted reference material for recurring questions.

Each dataset entry includes:

- Title.
- Category.
- Keywords.
- Content.

The dataset is appended to the Gemini system instruction as a knowledge base. The default fallback config includes entries for:

- Annulment Process Philippines.
- Philippine Visa Types.
- Estate Tax Amnesty.

### Widget Behavior

Behavior settings control interaction rules and utility features.

- Auto-open delay in seconds.
- Show or hide message timestamps.
- Enable or disable copy buttons on AI responses.
- Enable or disable quote-request flow.
- Configure quote notification recipients.
- Configure optional CC recipients.
- Configure quote email subject.

Quote requests are only useful when email credentials and recipients are configured.

### Embeddable Widget

The widget is packaged separately from the admin dashboard and copied into the admin public folder during build.

Widget features:

- Floating launcher button.
- Bottom-left or bottom-right placement.
- Shadow DOM style isolation.
- Responsive mobile layout.
- Escape key closes the chat.
- Body scroll lock when the mobile chat is open.
- Visual viewport handling for mobile keyboards.
- Lead capture form before chat starts.
- Visitor profile saved in `localStorage`.
- Optional prefilled visitor profile through embed config.
- Gemini-powered AI responses.
- AI response formatting for paragraphs, bullet lists, numbered lists, bold, italics, and links.
- Copy-to-clipboard button for AI messages.
- Timestamp support.
- Quick links after lead capture.
- Quote intent detection.
- Quote-request card with textarea and submit button.
- Graceful error messages for missing API key, Gemini errors, and quote email failures.

Quote intent detection watches for words such as `quote`, `quotation`, `estimate`, `cost`, `pricing`, `price`, `fee`, `rate`, `charges`, `billing`, `invoice`, and `payment`.

### Lead Capture

Before a visitor can chat, the widget asks for:

- Name.
- Email address.

The widget validates that both fields are present and that the email looks valid. Once submitted, the visitor profile is:

- Stored in `localStorage` under `duran-chatbot-visitor-profile`.
- Added to Gemini context as visitor details.
- Sent with quote requests.

### Quote Request Emails

Quote requests are submitted to `/api/quote-request`.

The API route includes:

- CORS handling.
- POST-only request handling.
- Basic in-memory IP rate limiting: 5 requests per 10 minutes.
- Honeypot support.
- Name, email, and message validation.
- Gmail SMTP sending through `nodemailer`.
- Profile-specific notification recipients.
- Optional CC recipients.
- Profile-specific email subject.
- HTML and plain-text email bodies in production API route.
- Manila timezone timestamp.

Required environment variables for quote emails:

- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`

Required behavior config for quote emails:

- `behavior.quoteNotifyTo` must contain at least one recipient.
- `behavior.enableQuoteRequest` should be enabled for the widget flow.

### Preview Mode

The admin dashboard includes a real widget preview at `/?preview=1`.

Preview behavior:

- The admin saves the current unsaved config into `localStorage`.
- The preview page mounts the real `ChatbotWidget` class.
- Preview controls can open chat, close chat, and reload saved config.
- The preview sidebar shows current position, primary color, and welcome message.

This is useful for checking appearance and copy before publishing config changes.

### Config Storage

The system has two storage modes:

1. Redis-backed mode:
   - Enabled when `REDIS_URL` is set.
   - Required for saving changes from the admin dashboard.
   - Stores profiles and profile configs.

2. Fallback file mode:
   - Used when Redis is not configured.
   - Reads from `data/config.json`.
   - Useful for local defaults and first boot.
   - Does not support persistent admin saves.

Redis keys used by the system:

- `chatbot:profiles`: profile metadata index.
- `chatbot:profile:{slug}`: full config for one profile.
- `chatbot:config`: legacy single-config key used for migration/bootstrap.

## Project Structure

```text
.
├── api/
│   ├── config.js
│   ├── models.js
│   ├── profiles.js
│   └── quote-request.js
├── apps/
│   └── admin/
│       ├── src/
│       │   ├── api/
│       │   ├── components/
│       │   ├── features/
│       │   ├── hooks/
│       │   ├── lib/
│       │   ├── pages/
│       │   └── server/
│       └── public/
│           └── widget.js
├── data/
│   └── config.json
├── packages/
│   ├── config/
│   └── widget/
├── package.json
└── vercel.json
```

## API Routes

### `GET /api/config`

Returns the default chatbot config. If `REDIS_URL` is configured, this can read stored config; otherwise it reads `data/config.json`.

The response includes `ai.apiKey` injected from `GEMINI_API_KEY`.

### `GET /api/config?profile={slug}`

Returns the config for a specific profile. If no stored profile config exists, the API falls back to `data/config.json`.

### `POST /api/config`

Saves the default config to Redis. Requires `REDIS_URL`.

The API normalizes the config with defaults and strips `ai.apiKey` before saving.

### `POST /api/config?profile={slug}`

Saves a profile-specific config to Redis. Requires `REDIS_URL`.

### `GET /api/profiles`

Returns profile metadata:

```json
{
  "profiles": []
}
```

### `GET /api/profiles?slug={slug}`

Returns one profile with metadata and config.

### `POST /api/profiles`

Creates a new profile from the fallback config.

Expected body:

```json
{
  "name": "Profile Name",
  "slug": "profile-slug"
}
```

### `PUT /api/profiles?slug={slug}`

Updates profile config and/or profile name.

Expected body can include:

```json
{
  "name": "New Name",
  "config": {}
}
```

### `DELETE /api/profiles?slug={slug}`

Archives a profile. The API blocks archiving the last active profile.

### `GET /api/models`

Fetches available Gemini models from Google, filters for models that support `generateContent`, normalizes IDs and labels, and returns them sorted by label.

Requires `GEMINI_API_KEY`.

### `POST /api/quote-request`

Sends a quote-request notification email.

Expected body:

```json
{
  "name": "Visitor Name",
  "email": "visitor@example.com",
  "message": "I need help with...",
  "service": "Optional service/topic",
  "profile": "duran-schulze",
  "honeypot": ""
}
```

## Environment Variables

Create `.env.local` at the repo root for local development.

```bash
REDIS_URL=
GEMINI_API_KEY=
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

Variable purpose:

- `REDIS_URL`: Redis connection string for profile/config persistence.
- `GEMINI_API_KEY`: Google Gemini API key used by `/api/models` and injected into widget config.
- `GMAIL_USER`: Gmail account used by `nodemailer` for quote-request emails.
- `GMAIL_APP_PASSWORD`: Gmail app password used by `nodemailer`.

Do not store the Gemini API key inside saved chatbot config. The API intentionally removes `ai.apiKey` before saving and injects it at read time from environment variables.

## Local Development

Install dependencies:

```bash
npm install
```

Run the admin app:

```bash
npm run dev
```

The admin dev server uses port `5173`.

Run the widget package directly:

```bash
npm run dev:widget
```

Build everything:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Build Flow

The root build runs in this order:

1. Build shared config package.
2. Build widget package.
3. Build admin app.

The admin build runs `apps/admin/scripts/sync-widget-bundle.mjs`, which copies:

```text
packages/widget/dist/widget.umd.js
```

to:

```text
apps/admin/public/widget.js
```

That copied file is what the deployed embed code loads.

## Embed Code

The admin dashboard generates embed code for the selected profile.

Example:

```html
<!-- Chatbot Widget -->
<div id="chatbot-widget" data-profile="duran-schulze"></div>
<script src="https://your-deployed-domain.com/widget.js?v=1.1.0" defer></script>
```

The `data-profile` attribute selects which profile config to load.

Optional runtime overrides can be provided through `window.ChatbotConfig` before `widget.js` loads:

```html
<script>
  window.ChatbotConfig = {
    appearance: {
      companyName: "Custom Company Name",
      primaryColor: "#004a99"
    }
  };
</script>
<div id="chatbot-widget" data-profile="duran-schulze"></div>
<script src="https://your-deployed-domain.com/widget.js" defer></script>
```

Supported container data attributes:

- `data-profile`
- `data-api-key`
- `data-position`
- `data-primary-color`
- `data-company-name`

The preferred production pattern is still to keep the Gemini key on the server and let `/api/config` inject it.

## Deployment Notes

This project is set up for Vercel.

`vercel.json` includes:

- Cache headers for `/widget.js`.
- Function duration settings for `api/profiles.js` and `api/quote-request.js`.

Before deploying, configure these environment variables in Vercel:

- `REDIS_URL`
- `GEMINI_API_KEY`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`

For profile editing to persist in production, `REDIS_URL` must be set.

For quote-request emails to work, Gmail credentials must be set and the active profile must have at least one `quoteNotifyTo` recipient.

## Default Duran Law Configuration

The fallback config in `data/config.json` currently describes a Duran & Duran-Schulze Law assistant.

Default specialization areas include:

- Family Law.
- Immigration Law.
- Property and Estate Law.
- Tax Law.
- Corporate Law.
- Intellectual Property Law.
- Labor Law.

The default prompt emphasizes:

- General legal-process information.
- Professional and formal tone.
- Philippine law context.
- No specific legal advice.
- Strong recommendation to schedule a consultation for personalized guidance.
- Website reference: `https://duranschulze.com/`.

## Important Notes And Current Limitations

- Admin saves require Redis. Without `REDIS_URL`, the app can read fallback config but cannot persist changes.
- The widget needs `GEMINI_API_KEY` through server config or embed override before it can answer.
- Quote emails require Gmail credentials and notification recipients.
- The quote-request rate limiter is in memory, so it resets when the serverless/runtime instance restarts.
- The widget displays only the first two quick links even if more are configured.
- Profile creation currently starts from `data/config.json`.
- The production `/api/profiles` route contains a `cloneFrom` placeholder but does not actually clone another stored profile yet.
- The dev API plugin and production API routes are similar but not perfectly identical. Test important behavior in production-like deployment before relying on it.

## Quick Memory Checklist

When you come back to this project later, remember:

- Edit chatbot behavior in the admin dashboard.
- Use profiles when different websites or chatbot variants need separate settings.
- Use Appearance for brand and welcome-message changes.
- Use AI Settings for model, prompt, temperature, and max token changes.
- Use Persona for voice/style only, not legal rules.
- Use Services for pricing/process/CTA knowledge.
- Use Dataset for FAQ or legal-process reference entries.
- Use Behavior for auto-open, timestamps, copy buttons, and quote email settings.
- Use Preview before saving/publishing major changes.
- Copy the embed code from the admin dashboard for the active profile.
- Keep secrets in environment variables, not config JSON.

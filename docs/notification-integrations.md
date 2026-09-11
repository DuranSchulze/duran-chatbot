# Chatbot inquiry notifications

The Integrations panel now persists per-profile switches and reports server readiness, delivery counts and the latest failure. Each logged inquiry creates a database event and per-channel delivery rows in the same transaction as the conversation messages. The API awaits an initial delivery attempt; a worker retries temporary failures. Telegram, Viber and WhatsApp use their official HTTPS APIs. Secrets never enter chatbot configuration or status responses.

## Setup

1. Run `npm run build`. Apply the additive schema upgrade to each deployment database with `npm run db:migrate:notifications` (requires `DATABASE_URL`). For local configuration use `node --env-file=.env.local scripts/migrate-notifications.mjs`. This runner uses a transaction, skips an already applied upgrade and refuses a partially applied schema. Existing profiles start with all channels disabled. There is no Prisma migration history in this repository; the versioned SQL is in `packages/database/prisma/changes/20260910_notifications.sql`.
2. Set `NOTIFICATION_PROFILE_SLUG` to the exact chatbot profile slug. Credentials below are authorized for **one profile per deployment**, preventing accidental routing of another profile's inquiries to these recipients. Renaming the profile also requires updating this environment variable. Use separate deployments for independently routed clients.
3. Configure one or more channels below in server environment variables, or root `.env.local` for development. Restart/redeploy after changing variables. Never use a `VITE_` prefix for these secrets.
4. Set a strong random `CRON_SECRET`. Production `vercel.json` invokes `/api/notification-dispatch` every minute with Vercel's bearer-secret authentication. **This schedule requires Vercel Pro/Enterprise.** On Hobby, remove the cron entry and arrange an external scheduler to call this endpoint every minute with `Authorization: Bearer <CRON_SECRET>`. Do not ship retries without a running scheduler. Local Vite runs the same worker every minute while the dev server is running. [Vercel scheduling limits](https://vercel.com/docs/cron-jobs/usage-and-pricing), [cron security](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
5. Log into the admin, select the profile, enable the intended channels, and save. Refresh status to check missing settings. Disclose to visitors that their name, email and inquiry will be shared with your team through the selected messaging services.
6. Submit a clearly labeled test inquiry through the widget and verify the recipient's phone as well as the admin counters. No real provider messages are sent by the automated tests.

## Telegram

Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. Create a bot with BotFather, start a conversation with it from the recipient account, then obtain that chat's ID through Telegram's bot updates tooling. For groups, add the bot with permission to post and use the group chat ID. Alerts use plain text with link previews disabled, including profile, name, email, inquiry and an event reference. Text is bounded below the provider limit. [Telegram Bot API](https://core.telegram.org/bots/api#sendmessage).

## Viber

Set `VIBER_AUTH_TOKEN` and `VIBER_ADMIN_USER_IDS`. The recipient list accepts comma- or newline-separated user IDs; duplicates and blank entries are ignored. The legacy `VIBER_ADMIN_USER_ID` remains supported and is combined with the plural list. Obtain an active commercial bot and have every recipient subscribe to it; each recipient ID comes from your bot's signed subscription/message callback. This implementation sends outbound alerts and does not host a subscription webhook. Viber bot creation is on commercial terms, so the old panel's “free” description was incorrect. [Viber REST API](https://developers.viber.com/docs/api/rest-bot-api/).

## WhatsApp

Set `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ADMIN_NUMBERS` (comma- or newline-separated international-digit numbers), `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANGUAGE` (e.g. `en_US`) and `WHATSAPP_API_VERSION` (a supported Graph API version, e.g. `v23.0`). The legacy `WHATSAPP_ADMIN_NUMBER` remains supported and is combined with the plural list. Use a business account; every recipient must opt in. Register an approved template with exactly four positional body text parameters and no required header/button parameters:

```text
New chatbot inquiry for {{1}}.
Name: {{2}}
Email: {{3}}
Inquiry: {{4}}
```

The parameters are profile slug, visitor name, visitor email and inquiry. The adapter always uses a template, so it does not rely on an open customer-service messaging window. Keep the fixed template text short (the example above fits). Inquiry text is flattened and limited to 350 characters; the complete original stays in Conversations. Check template eligibility/category, current pricing and recipient restrictions in your Meta account. [Meta template request](https://www.postman.com/meta/whatsapp-business-platform/request/o65u5m5/send-message-template-text).

## Delivery semantics and operation

- Missing name/email is shown as “Not provided”; absence of identity does not discard an inquiry. Failed AI calls can be logged without an assistant response. The widget submits the inquiry immediately before AI generation and attaches the eventual answer using the same request ID. The notification does not wait for an AI answer. Network failure or browser termination before submission can still prevent capture.
- `accepted` means the provider accepted the API request for every configured recipient, **not** delivered/read on their phones. Delivery-receipt webhooks are not implemented. If a later recipient fails after an earlier one was accepted, retrying the channel delivery can send a duplicate to the earlier recipient.
- Temporary HTTP/network failures retry up to five attempts with exponential backoff and rate-limit delay. Permanent failures stay visible. Fix the setup, then use **Retry failed alerts** to requeue up to 50 failed deliveries. Turning off a channel or archiving its profile cancels queued deliveries when processed. An already in-flight send cannot be revoked.
- Rows are claimed using database compare-and-set leases. Expired leases recover after worker interruption. Provider acceptance followed by a worker crash can produce a duplicate; exactly-once delivery is not guaranteed by these APIs. Telegram/Viber include an event reference for recognizing duplicates.
- `requestId` makes repeated submission of the same inquiry idempotent within a conversation. Clients must reuse that ID on retry; older clients without an ID receive a new one per request.
- Database admission limits are 10 new inquiries per session per minute and 60 per profile per minute. They work across instances, but a public widget still needs deployment-level bot/IP abuse controls for hostile traffic. These are conservative initial limits, not a high-throughput queue design. Workers process 12 due deliveries per run; monitor backlog and tune capacity for your traffic.
- Failure records contain safe codes rather than raw provider responses or token-bearing URLs. Events reference original messages instead of copying PII into a second payload. Deleting the message/conversation/profile cascades the notification records. Retention follows your existing conversation retention process.
- Admin authentication protects config/profile writes, notification status and manual retries. The pre-existing broader application still exposes its Gemini key to the browser for direct AI calls and has other public chat APIs; this change is not a certification of the entire application's security. Move AI calls server-side and audit conversation access before an unrestricted production launch.

## Validation

`npm run lint:notifications` checks the integration UI and service modules with the existing admin ESLint configuration. The root `npm run lint` still lacks a root configuration.

`npm run test:notifications` runs provider contract, validation and authorization tests without provider access. `TEST_DATABASE_URL=... npm run test:notifications:db` creates and deletes a randomly named schema on a PostgreSQL test database, verifies concurrency, persistence, retries, rate limits and cascades, and mocks all provider requests. The database user needs schema creation permission. `npm run build` checks all workspaces and synchronizes the checked-in widget bundle.

Rollback: disable all integrations and stop the scheduler, then deploy the previous application build. The additive tables/column can remain safely; do not drop them while retaining notification history.

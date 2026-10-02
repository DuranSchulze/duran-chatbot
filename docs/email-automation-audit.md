# Email automation audit — 2 October 2026

## Result

The chat email pipeline is implemented, but the database/environment loaded through root `.env.local` is not ready to send conversation alerts. This is not a verification of the deployed server's environment or inbox delivery.

Read-only checks found:

- Active `duran-schulze` profile: conversation email alerts enabled; configured recipients and sender/key readiness passed; `ADMIN_APP_URL` readiness failed.
- 20 email delivery rows for that profile are `failed` with `email_admin_url_invalid`.
- Quote/request recipients are configured.
- `Book a Legal Consultation` is a `link` action. Clicking it opens an external page; it does not record a booking or send an email.

No real emails were sent and no notification rows/settings were changed during the audit.

## Traced behavior

The widget submits each visitor message to `/api/chat-log` before AI generation, then attaches the answer using the same request ID. `logChat` saves the message, notification event and delivery rows in one transaction. Repeated request IDs do not create additional inquiry alerts. Enabled conversation emails are sent through the shared outbox worker using the profile's Resend integration.

Conversation emails include the triggering visitor message, bounded recent visitor history, name/email if supplied, and an authenticated `/conversations?profile=…&conversation=…` dashboard link. Assistant and admin messages are excluded. One email is generated per visitor message, rather than one per conversation. Opening the widget alone does not send an email.

The request form posts to `/api/quote-request`. The widget selects visitor mode: To is the visitor, the configured team is CC, and Reply-To is the first team address. This route is separate from conversation alerts. It has no conversation lookup/link or chat-history snippet; it includes the submitted request/topic. The form submission itself is not saved as a chat message. A standalone request therefore does not produce a conversation alert.

Consultation buttons support link, prompt and quote actions. A link click cannot establish that a booking was completed. Confirmed booking emails require an integration/webhook from the actual booking provider; none exists in this repository.

## Fixes applied

- Included the submitted request in both HTML and plain-text visitor/team emails in production and the local API. Previously the message was omitted; only the optional service field was included.
- Removed the local request route's fallback to the default profile's recipients, matching production behavior and preventing cross-profile routing.
- Added a 10-second request-email timeout, rejected redirects, and required a Resend acceptance ID before reporting success.
- Added regression coverage for message content, escaping, visitor/team addressing, bounded transport, acceptance IDs and malformed provider responses.

## Remaining operational and reliability gaps

1. Configure server-only `ADMIN_APP_URL` to the correct HTTPS dashboard origin. Restart/redeploy, check saved Email readiness, then use **Retry failed emails** to requeue the existing failures. Do not use the public law-firm/booking URL unless it actually hosts the admin dashboard.
2. `vercel.json` defines no cron. Initial chat sends are awaited, but later retries/lease recovery need an external scheduler invoking `/api/notification-dispatch` with `Authorization: Bearer <CRON_SECRET>`. A scheduler configured outside the repository was not verified. Local development runs a periodic worker.
3. Quote/request emails use direct sending, without the chat outbox's retries, delivery status or request-ID deduplication. Quote rows are persisted only after provider acceptance, and persistence is best effort. Failed sends do not save a request; repeated submissions can send duplicate emails. A durable request outbox would address this separately.
4. The consultation link needs a booking-provider completion webhook for confirmed booking notifications. Changing it to a quote action would collect an inquiry, not confirm an appointment.
5. Provider acceptance does not prove inbox delivery. Delivery/bounce webhooks are not implemented. A real labeled test and inbox check are still required after configuration and deployment.

## Validation

- `npm run test:notifications`: 33 tests passed, with mocked providers.
- `npm run build`: all workspaces passed; existing admin chunk-size warning remains.
- `npm run lint:notifications`: passed.
- Read-only profile readiness and grouped email delivery history queries against the database from `.env.local`.
- The isolated database integration suite was not run; no `TEST_DATABASE_URL` was supplied for this audit.

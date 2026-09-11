# Conversation Email Notifications

Implementation status (2026-09-11): implemented. The new settings are nested under `behavior.conversationEmail`; authenticated config/profile reads preserve them and public reads replace them with empty defaults to prevent leaking internal recipients. Email status/retry uses the existing endpoint with `channel=email`. No schema changes were needed. The shared config dependency now builds before the database workspace.

Validation: focused automated tests and full build pass. Mocked-provider coverage includes filtering, safe links/redirects, public-config redaction, worker cancellation/retries and scoped status. Isolated database coverage was added but requires `TEST_DATABASE_URL`, which is not configured in this session. Live provider delivery and production deployment remain release checks; no actual emails were sent.

## 1. Goal

Add an optional, per-profile email notification for chatbot conversations. When a visitor sends a new message, configured internal recipients receive an email that identifies the visitor, shows only visitor-authored chat content, and includes a button that opens the exact conversation in the authenticated internal Conversations page. The existing quote-request email flow and Viber, WhatsApp, and Telegram notifications must continue to work unchanged.

## 2. Context Summary

The widget currently posts every visitor message to `/api/chat-log`. `packages/database/src/chat-log.ts` stores the conversation and message, creates one durable `NotificationEvent`, creates per-channel `NotificationDelivery` rows, and attempts immediate dispatch. `packages/database/src/notifications.ts` retries pending delivery rows through the request path and a one-minute worker/cron.

Per-profile email sending already exists through Resend in `packages/database/src/email.ts`. The encrypted Resend key and sender details are stored in `EmailIntegration`; quote-recipient settings are stored separately in the profile's JSON `behavior` configuration.

The internal Conversations page is protected by the shared admin login. It currently accepts only a `profile` query parameter, returns `sessionId` rather than the database conversation ID, and does not restore the originally requested URL after login.

Confirmed product requirement: notification email bodies must omit AI/chatbot and admin messages. The button may open the normal internal view, where the authorized admin can see the complete conversation.

Assumptions for the first version:

- Conversation email alerts are independent of quote emails and have their own enable switch and recipient list.
- One alert is created for every newly persisted visitor message, matching the messaging-channel notification cadence.
- Each email contains the visitor-only transcript available at dispatch time, with the newest visitor message clearly identified.
- Notifications are disabled by default for existing and new profiles.
- The email button requires normal admin authentication; no public or passwordless transcript link is created.
- `ADMIN_APP_URL` is the canonical deployed admin origin used to create links. Local development may use an explicit localhost URL.

Open product decision: if one email per visitor message becomes too noisy, a later feature can add first-message-only or inactivity-digest delivery. Digesting is not included in this plan because it changes scheduling and aggregation semantics.

## 3. Scope

- Add per-profile controls for conversation email alerts in the Email settings page.
- Reuse the profile's existing Resend integration and verified sender.
- Support multiple primary and CC internal recipients.
- Create a durable email delivery alongside enabled messaging deliveries for each visitor message.
- Render a branded HTML and plain-text notification containing visitor identity, visitor-only messages, timestamps, profile context, and an internal call-to-action button.
- Add a secure deep link that selects the exact conversation.
- Preserve the deep link through admin login.
- Show email delivery readiness, counts, latest safe failure, and manual retry controls in the Email page.
- Add automated and manual coverage for payload filtering, delivery, retries, deep linking, authorization, and regressions.
- Document setup, environment requirements, cadence, privacy behavior, and operational limitations.

## 4. Out of Scope

- Changing the visitor-facing quote acknowledgement or internal quote-request email behavior.
- Including AI assistant or human-admin messages in the notification email.
- Passwordless, signed, or public access to conversations.
- Per-recipient delivery tracking; one email delivery sends to the configured To/CC envelope.
- Email reply ingestion or turning email replies into conversation messages.
- Delivery/open tracking webhooks from Resend.
- Digest scheduling, inactivity windows, daily summaries, or first-message-only policies.
- Redesigning the Conversations page beyond deep-link selection and login return handling.
- Changing Viber, WhatsApp, or Telegram payloads and configuration.

## 5. Affected Files and Folders

```txt
packages/
  config/src/index.ts
  database/src/
    chat-log.ts
    email.ts
    notifications.ts
    notification-status.ts
  database/prisma/schema.prisma
apps/
  admin/src/
    App.tsx
    components/ProtectedRoute.tsx
    features/config-editor/panels/email-panel.tsx
    pages/LoginPage.tsx
    pages/ConversationsPage.tsx
    api/conversations.ts
    server/api-plugin.ts
api/
  conversations.js
  notification-status.js
  notification-dispatch.js
tests/
  notifications.test.mjs
  notifications-db.mjs
docs/
  notification-integrations.md
  system-documentation.md
plans/
  conversation-email-notifications/PLAN.md
```

- `packages/config/src/index.ts`: add strictly normalized conversation-email settings to `BehaviorConfig` and defaults.
- `packages/database/src/chat-log.ts`: enqueue the `email` delivery in the same transaction as the visitor message when the feature is enabled.
- `packages/database/src/email.ts`: reuse Resend transport while adding the conversation-notification envelope, safe provider error classification, and provider message ID handling.
- `packages/database/src/notifications.ts`: recognize `email` as an outbox delivery type, verify the feature remains enabled, load visitor-only transcript data, send it, and apply existing lease/retry behavior.
- `packages/database/src/notification-status.ts`: provide email-scoped counts, readiness, latest failure, and retry behavior without mixing the email card with messaging-channel UI.
- `packages/database/prisma/schema.prisma`: review only; its string `channel` field and existing event relationships can support `email` without a schema change.
- `apps/admin/src/features/config-editor/panels/email-panel.tsx`: add the configuration and operational status card.
- `apps/admin/src/pages/ConversationsPage.tsx` and `apps/admin/src/api/conversations.ts`: expose/use the non-secret conversation ID and select the requested conversation.
- `apps/admin/src/components/ProtectedRoute.tsx` and `apps/admin/src/pages/LoginPage.tsx`: retain safe internal return destinations through login.
- `api/*` and `apps/admin/src/server/api-plugin.ts`: keep production serverless routes and the local Vite API implementation behaviorally identical.
- `tests/*`: extend provider-contract and isolated-database coverage.
- `docs/*`: explain configuration, content filtering, deep-link authentication, retries, and email frequency.

## 6. Step-by-Step Implementation Plan

1. Define the configuration contract.
   - Add a boolean enable flag, primary recipient array, optional CC recipient array, and optional subject setting for conversation email alerts under `BehaviorConfig`.
   - Default the enable flag to false and lists to empty.
   - Normalize booleans strictly and normalize recipient arrays so malformed saved JSON cannot accidentally activate delivery.
   - Keep these settings separate from `quoteNotifyTo`, `quoteNotifyCC`, and quote subjects.
   - Affected files: `packages/config/src/index.ts`, configuration tests.

2. Add the Email-page configuration card.
   - Add a “Conversation email alerts” card below the Resend provider card and separate from “Quote request notifications.”
   - Provide an enable switch, comma-separated To and CC fields, and subject input.
   - Explain that one message is sent per visitor message, only visitor messages appear in the email, the button requires admin login, and the complete conversation remains available internally.
   - Disable or clearly mark the feature as not ready when no valid primary recipient or Resend sender/key is configured.
   - Save recipient/subject changes with the existing profile Save action; keep Resend credentials on the existing dedicated Save settings action.
   - Affected files: `apps/admin/src/features/config-editor/panels/email-panel.tsx`, `packages/config/src/index.ts`.

3. Enqueue email notifications atomically.
   - In the existing chat-log transaction, append an `email` delivery when the profile is active and conversation email alerts are explicitly enabled.
   - Continue using the existing `NotificationEvent` and original user `Message` relation so no second PII/transcript copy is stored.
   - Preserve request-ID idempotency: repeated submission of the same visitor message must not create or send a second email delivery.
   - Do not require provider readiness during enqueue; a missing/invalid setup should become a visible safe failure, consistent with messaging channels.
   - Affected files: `packages/database/src/chat-log.ts`, `packages/database/src/notifications.ts`.
   - Dependency: configuration contract from step 1.

4. Add the conversation email adapter.
   - Extend outbox delivery typing to include `email` without adding it to the Viber/WhatsApp/Telegram settings list.
   - When processing an email row, reload the event, profile configuration, conversation, and messages from the database.
   - Cancel a queued row if the profile is archived or conversation email alerts have been disabled.
   - Select only messages whose role is exactly `user`, ordered by timestamp. Never serialize `assistant` or `admin` content into either HTML or plain text.
   - Highlight the event's newest visitor message and include the visitor name/email, profile name, conversation start/last activity, and visitor-only message timestamps.
   - Bound the transcript by both message count and total character count. Clearly state when older visitor messages were omitted and rely on the internal button for the complete transcript.
   - HTML-escape every profile, visitor, subject, and message value. Generate an equivalent plain-text body.
   - Send one Resend request using the configured primary recipients and CC list. Capture the returned provider ID for the delivery row.
   - Classify network errors, HTTP 429, and 5xx responses as retryable; treat invalid credentials, invalid recipients, invalid sender, and other 4xx responses as permanent. Persist only safe error codes.
   - Affected files: `packages/database/src/email.ts`, `packages/database/src/notifications.ts`.
   - Dependencies: steps 1 and 3.

5. Build the safe internal conversation URL.
   - Require a canonical `ADMIN_APP_URL` for enabled email alerts. Normalize it to an origin and reject credentials, fragments, unsupported protocols, and non-local HTTP origins.
   - Build the button URL with encoded `profile` and database `conversation` ID parameters.
   - Do not put the public widget `sessionId`, visitor email, visitor name, message text, or authentication token in the URL.
   - Add readiness feedback for a missing or invalid `ADMIN_APP_URL`.
   - Affected files: `packages/database/src/email.ts`, `packages/database/src/notification-status.ts`, environment/setup documentation.

6. Implement exact-conversation deep linking.
   - Add the database conversation ID to authenticated `/api/conversations` responses while retaining `sessionId` for existing reply and polling operations.
   - Parse the `conversation` query parameter on the Conversations page.
   - After the profile and conversations load, select the matching conversation, mark it read through the existing path, and keep it selected during refreshes.
   - Show a clear not-found state if the ID does not exist in the requested profile rather than silently selecting another profile's conversation.
   - Preserve the normal list/search experience when no conversation parameter is provided.
   - Keep both the production serverless route and local Vite API implementation aligned.
   - Affected files: `api/conversations.js`, `apps/admin/src/server/api-plugin.ts`, `apps/admin/src/api/conversations.ts`, `apps/admin/src/pages/ConversationsPage.tsx`.
   - Dependency: step 5 defines the URL contract.

7. Preserve deep links through authentication.
   - When an unauthenticated user opens an emailed internal URL, send them to `/login` while storing the original internal path and query string in router state.
   - After successful login, return to that stored internal URL instead of always navigating to `/`.
   - Accept only application-relative destinations beginning with `/`; reject protocol-relative and absolute values to prevent open redirects.
   - Preserve the current behavior for ordinary logins that have no return destination.
   - Affected files: `apps/admin/src/components/ProtectedRoute.tsx`, `apps/admin/src/pages/LoginPage.tsx`, routing tests if added.

8. Add email delivery status and retry controls.
   - Expose authenticated, email-scoped status containing enabled/configured state, missing setup labels, pending/sending/accepted/failed/cancelled counts, and the latest safe error.
   - Add a manual retry action that resets only failed `email` rows for the selected profile, capped consistently with the existing retry operation.
   - Display this status inside the new Email-page card with loading, success, missing-setup, failure, and retrying states.
   - Do not expose the Resend key, recipient addresses, raw provider response, or full transcript in status responses.
   - Affected files: `packages/database/src/notification-status.ts`, `api/notification-status.js` or a dedicated authenticated email-status route, `apps/admin/src/server/api-plugin.ts`, `apps/admin/src/features/config-editor/panels/email-panel.tsx`.
   - Dependencies: steps 1 and 4.

9. Keep worker and deployment behavior consistent.
   - Confirm immediate dispatch still happens after chat persistence.
   - Confirm the Vercel cron and local one-minute worker pick up pending/stale email rows without separate scheduling infrastructure.
   - Ensure an email failure never rolls back or rejects successful chat persistence.
   - Update operational documentation to require the existing notification migration and active scheduler, even though this feature adds no new table.
   - Affected files: `api/notification-dispatch.js`, `apps/admin/src/server/api-plugin.ts`, `docs/notification-integrations.md`, `docs/system-documentation.md`.

10. Validate and release.
    - Run focused unit/provider tests, isolated database tests when `TEST_DATABASE_URL` is available, targeted lint, and the full workspace build.
    - Render the email with plain text, HTML-like text, long text, Unicode, and missing optional visitor identity.
    - Verify the Email card and deep-linked Conversations page at desktop and mobile widths.
    - Send a labeled test conversation in a non-production or approved test profile and verify the email button opens the correct conversation after login.
    - Affected files: `tests/notifications.test.mjs`, `tests/notifications-db.mjs`, relevant admin test files if introduced, generated `apps/admin/public/widget.js` only if the widget source changes.

## 7. Database Changes

No database changes required.

## 8. Backend Changes

- Add `email` as an internal outbox delivery type while leaving the public messaging integration definitions limited to Telegram, Viber, and WhatsApp.
- Add email-enabled logic to the chat-log transaction and worker dispatch branch.
- Create a conversation-notification formatter/adapter that queries only `role = "user"` messages.
- Reuse `sendProfileEmail`/Resend credentials, but return and validate the Resend provider message ID for outbox tracking.
- Add safe retry classification and avoid persisting raw Resend responses.
- Validate and construct the canonical internal URL from `ADMIN_APP_URL` plus profile and conversation IDs.
- Add email-scoped readiness/status/retry operations protected by existing admin JWT validation.
- Return the database conversation ID from authenticated conversation APIs.
- Keep `api/*.js` production handlers and `apps/admin/src/server/api-plugin.ts` local handlers behaviorally equivalent.

## 9. Frontend Changes

- Add a distinct “Conversation email alerts” card to Email settings with enable, To, CC, and subject controls.
- Explain notification cadence and explicitly state that AI replies are excluded from email.
- Display readiness and delivery counters without exposing secret or recipient values.
- Add a retry button only when failed email delivery rows exist.
- Parse `conversation` on the Conversations page and select the exact matching item after data loads.
- Provide loading and not-found feedback for deep links.
- Preserve the requested conversation URL through login and then navigate back to it.
- Keep the complete transcript visible in the authenticated conversation view; the email-only filtering must not change the dashboard transcript.

## 10. Validation Rules

- Enable flag must be the boolean value `true`; truthy strings must not enable delivery.
- Require at least one syntactically valid primary email address before the feature is considered ready.
- Trim and deduplicate primary and CC recipients case-insensitively; prevent the same address from appearing in both envelopes.
- Cap recipient counts to a documented operational maximum.
- Subject must be trimmed, single-line, and length-bounded; use a safe default when blank.
- `ADMIN_APP_URL` must parse as an allowed HTTP(S) origin, with HTTPS required outside localhost.
- Profile and conversation IDs must always be URL-encoded.
- Deep-linked conversation ID must belong to the requested active profile.
- Include only exact `user` roles in the email transcript.
- Bound each message and the total transcript; support Unicode without splitting surrogate pairs.
- Reject or safely escape HTML/control characters in every rendered field.
- Preserve existing chat-log request size limits, request-ID uniqueness, and per-session/per-profile admission limits.

## 11. Security Considerations

- The email button must not grant access by itself. Existing admin JWT authentication remains mandatory for viewing conversations.
- Use the database conversation ID in links; never expose the public polling `sessionId` or JWT.
- Preserve and validate login return paths to prevent open-redirect attacks.
- Treat email as disclosure of visitor PII and chat content. Keep it opt-in per profile, display a privacy warning, and document that every configured recipient must be authorized to receive client communications.
- Do not include AI output or admin replies in notification emails, including hidden previews, quoted text, plain-text alternatives, subjects, or metadata.
- Do not include Resend credentials, raw provider errors, or recipient lists in public config/status responses.
- Continue encrypting profile Resend API keys at rest and never send them to the browser.
- HTML-escape untrusted visitor content and avoid unsafe URL construction.
- Keep status/retry and conversation APIs behind admin authentication.
- The current application has one shared admin role and no per-profile authorization. Document this limitation; per-recipient user accounts/RBAC are a separate security project.
- Retain current chat-log rate limits and monitor email volume/cost because one visitor message can generate one email.

## 12. Testing Plan

- Unit/provider tests:
  - Enabled email notifications create the correct Resend envelope and provider ID.
  - Disabled email notifications produce no email delivery row or provider call.
  - Existing Telegram, Viber, WhatsApp, and quote email payloads remain unchanged.
  - Primary/CC lists are trimmed, deduplicated, and validated.
  - Missing Resend configuration, recipients, or `ADMIN_APP_URL` produces safe readiness/failure codes.
  - Email HTML and text contain all included visitor messages and no assistant/admin message content.
  - HTML-like visitor content is escaped and Unicode truncation is safe.
  - The CTA URL contains only the expected encoded origin, profile, and conversation ID.
  - 429/network/5xx failures retry; permanent 4xx failures do not.

- Isolated database tests:
  - Chat persistence and the email delivery row are atomic.
  - Repeated request IDs do not create duplicate email rows or sends.
  - Immediate delivery succeeds and records the provider ID.
  - Deferred workers claim one row once under concurrency and recover expired leases.
  - Disabling alerts or archiving the profile cancels queued email rows.
  - Manual retry affects only failed email rows for the requested profile.
  - Deleting a conversation/profile cascades email outbox records through existing relations.

- Frontend/routing tests:
  - The Email card shows disabled, ready, missing setup, sending, failed, and retrying states.
  - An authenticated deep link selects and marks the exact conversation read.
  - An unauthenticated deep link returns to the exact conversation after successful login.
  - An invalid or cross-profile ID shows not found and does not expose another conversation.
  - Normal `/conversations?profile=...` behavior remains unchanged.

- Manual checks:
  - Verify the email in major desktop/mobile clients and with images blocked.
  - Confirm the plain-text fallback is understandable.
  - Confirm the CTA works from a logged-out browser and returns after login.
  - Confirm only client messages appear in the email while the full authenticated page includes AI messages.
  - Confirm long conversations show the truncation notice and correct CTA.

## 13. Rollback Plan

- Turn off “Conversation email alerts” for affected profiles first; the worker will cancel queued rows when it sees the disabled setting.
- Revert the configuration fields, Email-page card, email adapter, outbox branch, deep-link handling, and login return handling as one release.
- Existing `email` delivery rows may remain in `NotificationDelivery`; they are harmless string-channel records and will cascade with their parent events. If cleanup is desired, delete only rows whose channel is exactly `email` after taking a database backup.
- No schema rollback is necessary because this plan adds no migration.
- Preserve the existing Resend integration, quote-email configuration, messaging deliveries, conversations, and messages during rollback.
- Restore the prior API response shape only after the UI no longer depends on the conversation ID.

## 14. Final Checklist

- [x] Plan reviewed
- [x] Files identified
- [x] Database changes checked
- [x] Backend changes checked
- [x] Frontend changes checked
- [x] Validation rules checked
- [x] Security considerations checked
- [x] Tests planned
- [x] Rollback plan reviewed
- [x] Assumptions and open questions resolved (one alert per visitor message; no digest)

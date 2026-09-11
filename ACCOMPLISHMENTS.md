# Project Accomplishments

This file records meaningful product, engineering, reliability, and documentation work completed in the Duran Chatbot codebase. Add new entries under the newest date and describe outcomes rather than individual commits.

## 2026-09-11

### Messaging notification integrations

- Implemented durable chatbot inquiry notifications for Telegram, Viber, and WhatsApp using their official provider APIs.
- Added per-profile enable switches and operational readiness information in the Integrations page.
- Added support for notifying multiple Viber users through `VIBER_ADMIN_USER_IDS` while retaining the legacy single-recipient setting.
- Added support for notifying multiple opted-in WhatsApp numbers through `WHATSAPP_ADMIN_NUMBERS` while retaining the legacy single-recipient setting.
- Added in-product setup instructions explaining how administrators obtain the required bot tokens, user/chat IDs, phone-number ID, template information, and recipient identifiers.
- Added safe failure codes, bounded provider requests, delivery counters, retry controls, rate-limit handling, and worker lease recovery.
- Made notification persistence idempotent through conversation request IDs so normal client retries do not create duplicate delivery rows.
- Kept a provider failure from rolling back or rejecting a successfully saved visitor conversation.

### Quote-request email behavior

- Standardized quote-request email behavior so the visitor receives the starter email and the configured internal team is included for follow-up.
- Added separate primary and CC recipient lists for internal quote notifications.
- Added configurable internal and visitor-facing quote email subjects.
- Kept quote-request emails independent from regular conversation email alerts.
- Updated visitor-facing confirmation text so it accurately describes what happens after a quote is submitted.

### Conversation email alerts

- Added optional, per-profile conversation email alerts using the existing Resend integration and verified sender.
- Added independent To and CC recipient lists, an optional subject, and a disabled-by-default enable switch in Email settings.
- Added one durable email delivery for each newly persisted visitor message when the feature is enabled.
- Created branded HTML and plain-text notification emails showing the visitor identity, profile, timestamps, recent visitor-authored messages, and a highlighted newest message.
- Excluded chatbot and administrator messages from email content through both database-query and formatter-level filtering.
- Bounded transcript size and message count, added an omission notice for long conversations, escaped untrusted HTML, and preserved Unicode safely during truncation.
- Added a **View conversation** button that uses the internal database conversation ID and does not expose the widget session ID, visitor identity, message content, or authentication tokens in the URL.
- Added validation for recipient addresses, recipient count, subjects, and the canonical `ADMIN_APP_URL` used for internal links.
- Added Resend timeout handling, safe retry classification, provider-message ID tracking, and email-only delivery retry controls.
- Added email readiness, pending, sending, accepted, failed, and cancelled status information to the Email page.
- Protected internal email routing details by removing recipients and subjects from public widget configuration responses while retaining them for authenticated administrators.

### Conversation dashboard and authentication

- Added an accessible show/hide password control to the administrator login form.
- Added a **Remember me** option: checked logins persist for the token’s seven-day lifetime, while unchecked logins remain limited to the current browser session.
- Updated logout and preference changes to clear both persistent and session authentication storage.
- Added database conversation IDs to authenticated conversation API responses for precise internal linking.
- Added direct conversation selection through `profile` and `conversation` URL parameters.
- Preserved the originally requested conversation URL through administrator login.
- Restricted login return destinations to safe application-relative URLs to prevent open redirects.
- Added a clear not-found state for deleted or profile-mismatched conversation links.
- Improved the Conversations page on mobile by switching cleanly between the list and conversation view and adding a mobile back action.
- Kept the complete visitor, chatbot, and administrator transcript available inside the authenticated dashboard.

### Embedded chatbot behavior

- Added a per-profile **Open by default** option so embedded chatbots can render already expanded.
- Added the `data-start-open` embed override for installations such as WordPress.
- Retained delayed auto-opening for profiles that should initially remain minimized.
- Made the default widget behavior open immediately while allowing each profile or embed to override it.

### Configuration, UI, and privacy

- Added a protected **What’s new** page that publishes the latest dated entry from this root accomplishment log inside the admin dashboard.
- Added announcement navigation from the profile dashboard and profile settings, with a responsive release timeline and production-readiness summary.
- Organized email provider settings, conversation alerts, and quote-request notifications into a consistent Email settings experience.
- Added loading, success, setup-needed, validation-error, failure, and retrying states for conversation email alerts.
- Corrected narrow-screen layout overflow in the admin settings shell and kept header actions accessible on mobile.
- Added no-store response headers for authenticated configuration containing internal notification routing.
- Preserved existing public widget configuration behavior while preventing internal recipient leakage.

### Documentation and verification

- Added detailed notification setup and operations documentation covering Telegram, Viber, WhatsApp, conversation emails, privacy, retries, scheduling, and rollback.
- Created and completed the conversation email notification implementation plan.
- Added unit and provider-contract coverage for payloads, validation, filtering, safe links, authentication, redaction, retry classification, and channel isolation.
- Added isolated database coverage for atomic persistence, concurrency, idempotency, cancellation, and retry behavior. This suite requires `TEST_DATABASE_URL`.
- Added an isolated preview server and browser checks for exact conversation links, login return, missing conversations, Email-page validation, retry behavior, and desktop/mobile layouts.
- Completed the full workspace build, targeted lint checks, 29 automated notification tests, and isolated desktop/mobile UI verification without sending real provider messages.

### Production setup still required

- Set `ADMIN_APP_URL` to the deployed admin dashboard origin.
- Configure a Resend API key and verified sender for each applicable profile or provide the supported server environment fallbacks.
- Configure the messaging-provider environment variables for each enabled channel.
- Enable the desired notification channels and conversation email alerts for each profile, add recipients, and save the profile.
- Keep the notification worker or production scheduler active for deferred retries.
- Run the isolated database suite with a dedicated `TEST_DATABASE_URL` before release when one is available.
- Perform an approved test-profile delivery before enabling real production recipients. Automated tests do not send real emails or messaging-provider notifications.

## Entry Template

Copy this section when recording future work:

```md
## YYYY-MM-DD

### Feature or work area

- Outcome delivered to users or administrators.
- Important reliability, security, or compatibility improvement.
- Tests or validation completed.
- Any production setup or follow-up that remains.
```

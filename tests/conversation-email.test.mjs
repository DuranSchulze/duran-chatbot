import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import prisma, { formatConversationEmail, conversationAdminUrl, sendResendNotification, NotificationError, getNotificationStatus, retryFailedNotifications, dispatchNotifications, conversationEmailReadiness, sendProfileEmail } from '../packages/database/dist/index.js';
import { normalizeConversationEmail, conversationEmailRecipientError, mergeWithDefaults, publicWidgetConfig } from '../packages/config/dist/index.js';
import { safeReturnTo } from '../apps/admin/src/lib/return-to.ts';
import configHandler from '../api/config.js';
import profilesHandler from '../api/profiles.js';
import statusHandler from '../api/notification-status.js';
import conversationsHandler from '../api/conversations.js';
import quoteHandler from '../api/quote-request.js';

const settings = normalizeConversationEmail({ enabled: true, to: ['staff@example.com'], cc: ['manager@example.com'] });
const conversation = { id: 'db-id', userName: '<Client>', userEmail: 'visitor@example.com', firstSeen: '2026-09-11T01:00:00Z', lastActive: '2026-09-11T02:00:00Z' };
const message = { id: 'visitor-2', role: 'user', content: 'Help <script>alert("x")</script> & quotes? 😊', timestamp: conversation.lastActive };
const input = { settings, profile: { slug: 'test', name: 'Duran <Test>' }, conversation, message, adminOrigin: 'https://admin.example.com', messages: [
  { id: 'visitor-1', role: 'user', content: 'Earlier client content', timestamp: conversation.firstSeen },
  message,
  { id: 'ai', role: 'assistant', content: 'SECRET_AI_REPLY', timestamp: conversation.lastActive },
  { id: 'staff', role: 'admin', content: 'SECRET_ADMIN_REPLY', timestamp: conversation.lastActive },
] };
const response = () => ({ headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.code = n; return this; }, json(body) { this.body = body; return this; }, end() {} });
const reply = (body, status = 200, headers) => new Response(JSON.stringify(body), { status, headers });
function env(t, key, value) { const prev = process.env[key]; if (value === undefined) delete process.env[key]; else process.env[key] = value; t.after(() => { if (prev === undefined) delete process.env[key]; else process.env[key] = prev; }); }
function mock(t, object, key, fn) { const prev = object[key]; object[key] = fn; t.after(() => { object[key] = prev; }); }

test('alerts default off, strict flags, normalize and deduplicate envelope without hiding invalid addresses', () => {
  assert.equal(mergeWithDefaults({}).behavior.conversationEmail.enabled, false);
  assert.equal(normalizeConversationEmail({ enabled: 'true' }).enabled, false);
  const value = normalizeConversationEmail({ enabled: true, to: [' A@EXAMPLE.COM ', 'a@example.com'], cc: ['A@example.com', 'b@example.com'], subject: 'Hi\r\nCc: hidden' });
  assert.deepEqual(value.to, ['a@example.com']); assert.deepEqual(value.cc, ['b@example.com']); assert.equal(value.subject, 'Hi Cc: hidden');
  assert.equal(conversationEmailRecipientError(value), null);
  for (const to of [[], ['bad'], ['Name <x@example.com>'], ['x@example.com\r\nBcc:y@example.com'], Array.from({ length: 21 }, (_, i) => `${i}@example.com`)]) {
    assert.ok(conversationEmailRecipientError(normalizeConversationEmail({ to })));
  }
});

test('public config strips internal alert addresses and subject without mutating admin config', () => {
  const config = mergeWithDefaults({ behavior: { conversationEmail: { ...settings, subject: 'Private routing' } } });
  const safe = JSON.stringify(publicWidgetConfig(config));
  assert.ok(!safe.includes('staff@example.com')); assert.ok(!safe.includes('Private routing'));
  assert.equal(config.behavior.conversationEmail.to[0], 'staff@example.com');
});

test('email is visitor-only in HTML and plain text, safely escaped, bounded and internally linked', () => {
  const mail = formatConversationEmail(input);
  for (const body of [mail.html, mail.text, mail.subject]) {
    assert.ok(!body.includes('SECRET_AI_REPLY')); assert.ok(!body.includes('SECRET_ADMIN_REPLY'));
  }
  assert.ok(mail.text.includes(message.content)); assert.ok(mail.text.includes('Earlier client content'));
  assert.ok(mail.html.includes('&lt;script&gt;')); assert.ok(!mail.html.includes('<script>'));
  assert.ok(mail.html.includes('profile=test&amp;conversation=db-id'));
  assert.ok(!mail.to.includes(conversation.userEmail)); assert.equal(mail.cc, 'manager@example.com');
  const long = formatConversationEmail({ ...input, message: { ...message, content: 'x'.repeat(20000) }, messages: Array.from({ length: 30 }, (_, i) => ({ ...message, id: `history-${i}`, content: 'y'.repeat(5000) })) });
  assert.ok(long.text.length < 14000); assert.match(long.text, /omitted/);
  const unicode = formatConversationEmail({ ...input, message: { ...message, content: 'x'.repeat(5999) + '😊'.repeat(20) } });
  assert.equal(unicode.text.isWellFormed(), true);
  assert.match(unicode.text, /omitted/);
  assert.throws(() => formatConversationEmail({ ...input, message: input.messages[2] }), /email_invalid_message_role/);
  const missing = formatConversationEmail({ ...input, conversation: { ...conversation, userName: '', userEmail: '' } });
  assert.match(missing.text, /Not provided/);
});

test('canonical admin links reject unsafe origins and encode only internal identifiers', () => {
  for (const origin of ['', 'javascript:alert(1)', 'http://example.com', 'https://u:p@example.com', 'https://example.com/path', 'https://example.com/#token', 'https://example.com/?x=1', '//example.com']) {
    assert.throws(() => conversationAdminUrl('profile', 'id', origin), /email_admin_url_invalid/);
  }
  const url = new URL(conversationAdminUrl('law & tax', 'id/#', 'https://admin.example.com/'));
  assert.equal(url.searchParams.get('profile'), 'law & tax'); assert.equal(url.searchParams.get('conversation'), 'id/#');
  assert.equal(url.pathname, '/conversations'); assert.equal([...url.searchParams].length, 2);
  assert.match(conversationAdminUrl('p', 'id', 'http://localhost:5173'), /^http:\/\/localhost:5173/);
});

test('safe login return preserves deep links and rejects external or ambiguous redirects', () => {
  const path = '/conversations?profile=law&conversation=db-id';
  assert.equal(safeReturnTo(path), path);
  for (const value of [undefined, 'https://evil.example', '//evil.example', '/\\evil.example', '/\nevil.example', '/login', 'javascript:alert(1)']) assert.equal(safeReturnTo(value), '/');
});

test('Resend notification contract: bounded request, accepted id, safe retry classifications', async () => {
  assert.equal(await sendResendNotification('private-key', { to: settings.to }, async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails'); assert.equal(options.redirect, 'error'); assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.headers.Authorization, 'Bearer private-key');
    return reply({ id: 'resend-id' });
  }), 'resend-id');
  for (const status of [400, 401, 403, 422, 429, 500, 503]) {
    await assert.rejects(sendResendNotification('private-key', {}, async () => reply({ message: 'SECRET_PROVIDER_DETAIL' }, status, { 'retry-after': '45' })), error => {
      assert.ok(error instanceof NotificationError); assert.equal(error.retryable, status === 429 || status >= 500); assert.equal(error.code, `email_http_${status}`); assert.equal(error.retryAfterSeconds, 45); return true;
    });
  }
  await assert.rejects(sendResendNotification('key', {}, async () => { throw new Error('SECRET_NETWORK_URL'); }), error => error.code === 'email_network_or_timeout' && error.retryable);
  await assert.rejects(sendResendNotification('key', {}, async () => reply({})), error => error.code === 'email_invalid_provider_response');
});

test('public config/profile endpoints redact email routing; authenticated reads preserve it; invalid tokens fail closed', async t => {
  env(t, 'AUTH_JWT_SECRET', 'test-only');
  const config = mergeWithDefaults({ behavior: { conversationEmail: settings } });
  mock(t, prisma.profile, 'findUnique', async () => ({ slug: 'test', name: 'Test', status: 'active', createdAt: new Date(), config }));
  for (const handler of [configHandler, profilesHandler]) {
    for (const authenticated of [false, true]) {
      const res = response();
      await handler({ method: 'GET', url: '/?profile=test&slug=test', headers: authenticated ? { authorization: `Bearer ${jwt.sign({}, 'test-only')}` } : {} }, res);
      assert.equal(res.code, 200); assert.equal(JSON.stringify(res.body).includes('staff@example.com'), authenticated); assert.equal(res.headers['Cache-Control'], 'no-store');
    }
    const res = response();
    await handler({ method: 'GET', url: '/', headers: { authorization: 'Bearer invalid' } }, res);
    assert.equal(res.code, 401);
  }
});

test('status and retries are profile- and channel-scoped; status has no recipients', async t => {
  env(t, 'ADMIN_APP_URL', 'https://admin.example.com'); env(t, 'RESEND_API_KEY', 'test-key'); env(t, 'RESEND_FROM_EMAIL', 'sender@example.com');
  mock(t, prisma.emailIntegration, 'findUnique', async () => null);
  mock(t, prisma.profile, 'findUnique', async () => ({ status: 'active', config: { behavior: { conversationEmail: settings } } }));
  const queries = [];
  mock(t, prisma.notificationDelivery, 'groupBy', async args => { queries.push(args.where); return [{ channel: 'email', status: 'failed', _count: { _all: 1 } }]; });
  mock(t, prisma.notificationDelivery, 'findFirst', async args => { queries.push(args.where); return null; });
  mock(t, prisma.notificationDelivery, 'findMany', async args => { queries.push(args.where); assert.equal(args.take, 50); return [{ id: 'd1' }]; });
  mock(t, prisma.notificationDelivery, 'updateMany', async args => { queries.push(args.where); return { count: 1 }; });
  const status = await getNotificationStatus('test', 'email');
  assert.equal(status.readiness.configured, true); assert.ok(!JSON.stringify(status).includes('staff@example.com'));
  assert.equal((await retryFailedNotifications('test', 'email')).queued, 1);
  assert.ok(queries.every(q => q.channel.equals === 'email' && q.event.conversation.profileId === 'test'));
  queries.length = 0;
  await getNotificationStatus('test'); await retryFailedNotifications('test');
  assert.ok(queries.every(q => !q.channel.in.includes('email')));
  env(t, 'RESEND_FROM_EMAIL', '');
  assert.equal((await conversationEmailReadiness('test', settings)).configured, false);
});

test('email status and conversations require authentication before any database query', async () => {
  for (const handler of [statusHandler, conversationsHandler]) {
    for (const method of ['GET', 'POST']) {
      const res = response(); await handler({ method, url: '/?profile=test&channel=email', headers: {} }, res); assert.equal(res.code, 401);
    }
  }
});

test('email worker sends only user query, captures provider ID, and cancels disabled/archived rows', async t => {
  env(t, 'ADMIN_APP_URL', 'https://admin.example.com'); env(t, 'RESEND_API_KEY', 'test-key'); env(t, 'RESEND_FROM_EMAIL', 'sender@example.com');
  mock(t, prisma.emailIntegration, 'findUnique', async () => null);
  mock(t, prisma.message, 'findMany', async args => { assert.equal(args.where.role, 'user'); assert.equal(args.take, 21); return input.messages; });
  let sent = 0;
  mock(t, globalThis, 'fetch', async (_url, options) => { sent++; const payload = JSON.parse(options.body); assert.ok(!JSON.stringify(payload).includes('SECRET_AI_REPLY')); return reply({ id: 'resend-1' }); });
  const row = { id: 'd1', eventId: 'event', channel: 'email', status: 'pending', attempts: 0, leaseToken: null };
  const profile = { ...input.profile, status: 'active', config: { behavior: { conversationEmail: settings } } };
  mock(t, prisma.notificationDelivery, 'findMany', async () => [row]);
  let finished;
  mock(t, prisma.notificationDelivery, 'updateMany', async args => { if (args.data.leaseToken === null) finished = args.data; return { count: 1 }; });
  mock(t, prisma.notificationEvent, 'findUnique', async () => ({ message, conversation: { ...conversation, profile } }));
  await dispatchNotifications('event'); assert.equal(sent, 1); assert.equal(finished.status, 'accepted'); assert.equal(finished.providerMessageId, 'resend-1');
  profile.config.behavior.conversationEmail = { ...settings, enabled: false };
  await dispatchNotifications('event'); assert.equal(sent, 1); assert.equal(finished.status, 'cancelled');
  profile.config.behavior.conversationEmail = settings; profile.status = 'archived';
  await dispatchNotifications('event'); assert.equal(sent, 1); assert.equal(finished.status, 'cancelled');
  profile.status = 'active';
  mock(t, globalThis, 'fetch', async () => reply({ message: 'PRIVATE' }, 503));
  await dispatchNotifications('event'); assert.equal(finished.status, 'pending'); assert.equal(finished.lastError, 'email_http_503');
  mock(t, globalThis, 'fetch', async () => reply({}, 401));
  await dispatchNotifications('event'); assert.equal(finished.status, 'failed'); assert.equal(finished.lastError, 'email_http_401');
  row.attempts = 5;
  await dispatchNotifications('event'); assert.equal(finished.lastError, 'attempt_limit');
});


test('request emails include submitted details in the visitor/team thread and require provider acceptance', async t => {
  env(t, 'RESEND_API_KEY', 'test-key'); env(t, 'RESEND_FROM_EMAIL', 'sender@example.com');
  mock(t, prisma.emailIntegration, 'findUnique', async () => null);
  mock(t, prisma.config, 'findUnique', async () => ({ behavior: { quoteNotifyTo: ['staff@example.com'], quoteNotifyCC: ['manager@example.com'] }, appearance: { companyName: 'Test firm' } }));
  mock(t, prisma.profile, 'upsert', async () => ({}));
  let persisted = 0;
  mock(t, prisma.quoteRequest, 'create', async () => { persisted++; return {}; });
  let payload;
  mock(t, globalThis, 'fetch', async (_url, options) => {
    assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.redirect, 'error');
    payload = JSON.parse(options.body);
    return reply({ id: 'request-email-id' });
  });
  const req = { method: 'POST', headers: { 'x-real-ip': 'test-request' }, body: { name: 'Client', email: 'client@example.com', message: 'Please discuss <tax> obligations.', service: 'Consultation', profile: 'test', emailVisitor: true } };
  const res = response(); await quoteHandler(req, res);
  assert.equal(res.code, 200); assert.equal(persisted, 1);
  assert.deepEqual(payload.to, ['client@example.com']);
  assert.deepEqual(payload.cc, ['staff@example.com', 'manager@example.com']);
  assert.ok(payload.text.includes(req.body.message));
  assert.ok(payload.html.includes('Please discuss &lt;tax&gt; obligations.'));
  assert.equal(await sendProfileEmail('test', { to: 'staff@example.com', subject: 'Test', text: 'Test' }), 'request-email-id');
  mock(t, globalThis, 'fetch', async () => reply({}));
  const failed = response(); await quoteHandler(req, failed);
  assert.equal(failed.code, 500); assert.equal(persisted, 1);
});

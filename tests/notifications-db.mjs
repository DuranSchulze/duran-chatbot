// Uses an isolated, randomly named schema; never reads/writes application tables.
// TEST_DATABASE_URL must allow CREATE SCHEMA. Provider requests are always mocked.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

if (!process.env.TEST_DATABASE_URL) throw new Error('Set TEST_DATABASE_URL to a PostgreSQL test database');
const schema = `notification_test_${randomUUID().replaceAll('-', '')}`;
const url = new URL(process.env.TEST_DATABASE_URL);
const originalSchema = url.searchParams.get('schema') || 'public';
url.searchParams.set('schema', schema);
url.searchParams.set('connection_limit', '1');
process.env.DATABASE_URL = url.toString();
process.env.NOTIFICATION_PROFILE_SLUG = 'example';
process.env.TELEGRAM_BOT_TOKEN = 'test-token';
process.env.TELEGRAM_CHAT_ID = 'test-chat';
const setup = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
let prisma;
const originalFetch = globalThis.fetch;
try {
  execFileSync('node_modules/.bin/prisma', ['db', 'push', '--schema=packages/database/prisma/schema.prisma', '--skip-generate'], { env: process.env, stdio: 'pipe' });
  const lib = await import('../packages/database/dist/index.js');
  prisma = lib.default;
  await prisma.profile.create({ data: { slug: 'example', name: 'Example', config: { create: { appearance: {}, ai: {}, persona: {}, services: [], quickLinks: [], dataset: [], behavior: {}, integrations: { telegram: { enabled: true } } } } } });
  let sends = 0;
  globalThis.fetch = async () => { sends++; return new Response(JSON.stringify({ ok: true, result: { message_id: sends } })); };
  const input = { profile: 'example', sessionId: 'session', requestId: 'one', userName: 'Test visitor', userEmail: 'test@example.com', userMessage: 'Help with an inquiry', aiResponse: 'Certainly' };
  const results = await Promise.all([lib.logChat(input), lib.logChat(input)]);
  assert.equal(results.filter(x => x.duplicate).length, 1);
  assert.equal(await prisma.message.count(), 2);
  assert.equal(sends, 1);
  assert.equal((await prisma.notificationDelivery.findFirst()).status, 'accepted');
  await assert.rejects(lib.logChat({ ...input, userMessage: 'Different' }), error => error.status === 409);
  console.log('PASS: transaction, concurrent idempotency, accepted delivery, conflict detection');

  globalThis.fetch = async () => new Response('{}', { status: 503 });
  const retry = await lib.logChat({ ...input, requestId: 'retry' });
  let delivery = await prisma.notificationDelivery.findFirst({ where: { eventId: retry.eventId } });
  assert.equal(delivery.status, 'pending'); assert.equal(delivery.attempts, 1);
  assert.equal(await prisma.message.count(), 4);
  await prisma.notificationDelivery.update({ where: { id: delivery.id }, data: { nextAttemptAt: new Date(0) } });
  globalThis.fetch = async () => { sends++; return new Response(JSON.stringify({ ok: true, result: { message_id: sends } })); };
  await Promise.all([lib.dispatchNotifications(), lib.dispatchNotifications()]);
  delivery = await prisma.notificationDelivery.findUnique({ where: { id: delivery.id } });
  assert.equal(delivery.status, 'accepted'); assert.equal(delivery.attempts, 2); assert.equal(sends, 2);
  console.log('PASS: transient failure preserves chat, concurrent retry workers claim once');

  globalThis.fetch = async () => new Response('{}', { status: 429 });
  const disabled = await lib.logChat({ ...input, requestId: 'disabled' });
  await prisma.config.update({ where: { profileId: 'example' }, data: { integrations: {} } });
  await prisma.notificationDelivery.updateMany({ where: { eventId: disabled.eventId }, data: { nextAttemptAt: new Date(0) } });
  globalThis.fetch = async () => assert.fail('disabled channel must not send');
  await lib.dispatchNotifications();
  assert.equal((await prisma.notificationDelivery.findFirst({ where: { eventId: disabled.eventId } })).status, 'cancelled');
  const aiFailed = await lib.logChat({ ...input, requestId: 'ai-failed', aiResponse: '', userName: '', userEmail: '' });
  assert.equal(await prisma.notificationDelivery.count({ where: { eventId: aiFailed.eventId } }), 0);
  assert.equal((await prisma.conversation.findFirst()).userEmail, input.userEmail);
  console.log('PASS: disabling cancels queued alerts; AI failures log; identity is preserved');

  await assert.rejects(lib.logChat({ ...input, profile: 'unknown' }), error => error.status === 404);
  assert.equal(await prisma.profile.count(), 1);
  for (let i = 0; i < 6; i++) await lib.logChat({ ...input, requestId: `limit-${i}` });
  await assert.rejects(lib.logChat({ ...input, requestId: 'rate-limited' }), error => error.status === 429);
  assert.equal(await prisma.notificationEvent.count(), 10);
  console.log('PASS: unknown profiles rejected; shared database rate limit enforced');

  // Production config route round-trip uses exactly the migrated database field.
  process.env.AUTH_JWT_SECRET = 'test-only-secret';
  const { default: jwt } = await import('jsonwebtoken');
  const { default: configHandler } = await import('../api/config.js');
  const res = () => ({ setHeader() {}, status(n) { this.code = n; return this; }, json(body) { this.body = body; return this; }, end() {} });
  let response = res();
  await configHandler({ method: 'POST', url: '/?profile=example', headers: { authorization: `Bearer ${jwt.sign({ username: 'admin' }, process.env.AUTH_JWT_SECRET)}` }, body: { integrations: { telegram: { enabled: true } } } }, response);
  assert.equal(response.code, 200);
  response = res();
  await configHandler({ method: 'GET', url: '/?profile=example', headers: {} }, response);
  assert.equal(response.body.integrations.telegram.enabled, true);
  console.log('PASS: authenticated production config save/read preserves integrations');

  globalThis.fetch = async () => new Response(JSON.stringify({ ok: true, result: { message_id: 77 } }));
  const immediateInput = { ...input, sessionId: 'immediate', requestId: 'immediate', aiResponse: '' };
  const immediate = await lib.logChat(immediateInput);
  const event = await prisma.notificationEvent.findUnique({ where: { id: immediate.eventId } });
  assert.equal(await prisma.message.count({ where: { conversationId: event.conversationId } }), 1);
  assert.equal((await prisma.notificationDelivery.findFirst({ where: { eventId: immediate.eventId } })).status, 'accepted');
  await Promise.all([lib.logChat({ ...immediateInput, aiResponse: 'Later answer' }), lib.logChat({ ...immediateInput, aiResponse: 'Later answer' })]);
  assert.equal(await prisma.message.count({ where: { conversationId: event.conversationId } }), 2);
  assert.equal(await prisma.notificationDelivery.count({ where: { eventId: immediate.eventId } }), 1);
  assert.equal((await prisma.notificationDelivery.findFirst({ where: { eventId: immediate.eventId } })).attempts, 1);
  console.log('PASS: immediate inquiry notification; delayed answer attaches once without another alert');

  await assert.rejects(lib.logChat({ ...input, profile: 'internal' }), error => error.status === 401);
  await lib.logChat({ ...input, profile: 'internal' }, { allowInternal: true });
  await prisma.profile.delete({ where: { slug: 'internal' } });
  globalThis.fetch = async () => new Response('{}', { status: 401 });
  const permanent = await lib.logChat({ ...input, sessionId: 'permanent', requestId: 'permanent' });
  assert.equal((await prisma.notificationDelivery.findFirst({ where: { eventId: permanent.eventId } })).status, 'failed');
  const retried = await lib.retryFailedNotifications('example');
  assert.equal(retried.queued, 1);
  await prisma.notificationDelivery.updateMany({ where: { eventId: permanent.eventId }, data: { status: 'sending', leaseUntil: new Date(0), leaseToken: 'expired', attempts: 1 } });
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: true, result: { message_id: 99 } }));
  await lib.dispatchNotifications();
  assert.equal((await prisma.notificationDelivery.findFirst({ where: { eventId: permanent.eventId } })).status, 'accepted');
  await prisma.notificationDelivery.updateMany({ where: { eventId: permanent.eventId }, data: { status: 'sending', leaseUntil: new Date(0), leaseToken: 'expired-again', attempts: 5 } });
  globalThis.fetch = async () => assert.fail('attempt cap must prevent further sends');
  await lib.dispatchNotifications();
  assert.equal((await prisma.notificationDelivery.findFirst({ where: { eventId: permanent.eventId } })).status, 'failed');
  console.log('PASS: authenticated internal chat bootstrap, permanent failures, manual retry, stale leases, attempt cap');

  // Independent email profile; fake provider only, including transaction-level idempotency.
  process.env.ADMIN_APP_URL = 'https://admin.example.test';
  process.env.RESEND_API_KEY = 'test-only-key';
  process.env.RESEND_FROM_EMAIL = 'test@example.test';
  const conversationEmail = { enabled: true, to: ['team@example.test'], cc: [], subject: '' };
  await prisma.profile.create({ data: { slug: 'email-test', name: 'Email test', config: { create: { appearance: {}, ai: {}, persona: {}, services: [], quickLinks: [], dataset: [], behavior: { conversationEmail }, integrations: {} } } } });
  let emailSends = 0;
  globalThis.fetch = async (_url, options) => {
    emailSends++;
    const payload = JSON.parse(options.body);
    assert.ok(!payload.text.includes('AI_NOT_FOR_EMAIL'));
    assert.ok(!payload.html.includes('AI_NOT_FOR_EMAIL'));
    assert.ok(payload.text.includes('conversation='));
    return new Response(JSON.stringify({ id: `email-${emailSends}` }));
  };
  const emailInput = { ...input, profile: 'email-test', sessionId: 'email-session', requestId: 'email-one', aiResponse: 'AI_NOT_FOR_EMAIL' };
  const emailResults = await Promise.all([lib.logChat(emailInput), lib.logChat(emailInput)]);
  assert.equal(emailResults.filter(x => x.duplicate).length, 1);
  assert.equal(emailSends, 1);
  let emailDelivery = await prisma.notificationDelivery.findFirst({ where: { eventId: emailResults[0].eventId, channel: 'email' } });
  assert.equal(emailDelivery.status, 'accepted'); assert.equal(emailDelivery.providerMessageId, 'email-1');
  globalThis.fetch = async () => new Response('{}', { status: 503 });
  const emailRetry = await lib.logChat({ ...emailInput, requestId: 'email-retry' });
  emailDelivery = await prisma.notificationDelivery.findFirst({ where: { eventId: emailRetry.eventId } });
  assert.equal(emailDelivery.status, 'pending');
  await prisma.notificationDelivery.update({ where: { id: emailDelivery.id }, data: { status: 'failed' } });
  assert.equal((await lib.retryFailedNotifications('email-test')).queued, 0);
  assert.equal((await lib.retryFailedNotifications('email-test', 'email')).queued, 1);
  const emailStatus = await lib.getNotificationStatus('email-test', 'email');
  assert.equal(emailStatus.readiness.configured, true);
  assert.ok(!JSON.stringify(emailStatus).includes('team@example.test'));
  await prisma.config.update({ where: { profileId: 'email-test' }, data: { behavior: { conversationEmail: { ...conversationEmail, enabled: false } } } });
  globalThis.fetch = async () => assert.fail('disabled email must not send');
  await lib.dispatchNotifications(emailRetry.eventId);
  assert.equal((await prisma.notificationDelivery.findUnique({ where: { id: emailDelivery.id } })).status, 'cancelled');
  const emailOff = await lib.logChat({ ...emailInput, requestId: 'email-off' });
  assert.equal(await prisma.notificationDelivery.count({ where: { eventId: emailOff.eventId } }), 0);
  await prisma.profile.delete({ where: { slug: 'email-test' } });
  console.log('PASS: email transaction idempotency, visitor-only payload, retries, scope isolation, disable cancellation');

  await prisma.profile.delete({ where: { slug: 'example' } });
  assert.equal(await prisma.notificationDelivery.count(), 0);
  assert.equal(await prisma.notificationEvent.count(), 0);
  console.log('PASS: profile deletion cascades notification records');
} finally {
  globalThis.fetch = originalFetch;
  await prisma?.$disconnect();
  await setup.$executeRawUnsafe(`SET search_path TO "${originalSchema.replaceAll('"', '""')}"`);
  await setup.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await setup.$disconnect();
}

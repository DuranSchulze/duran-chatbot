import test from 'node:test';
import assert from 'node:assert/strict';
import { sendNotification, notificationReadiness, enabledChannels, NotificationError, validateChatLog } from '../packages/database/dist/index.js';
import { mergeWithDefaults } from '../packages/config/dist/index.js';
import jwt from 'jsonwebtoken';
import configHandler from '../api/config.js';
import profilesHandler from '../api/profiles.js';
import statusHandler from '../api/notification-status.js';
import cronHandler from '../api/notification-dispatch.js';
import chatHandler from '../api/chat-log.js';

const env = { NOTIFICATION_PROFILE_SLUG: 'example', TELEGRAM_BOT_TOKEN: 'secret', TELEGRAM_CHAT_ID: '42', VIBER_AUTH_TOKEN: 'secret', VIBER_ADMIN_USER_ID: '42', WHATSAPP_ACCESS_TOKEN: 'secret', WHATSAPP_PHONE_NUMBER_ID: '42', WHATSAPP_ADMIN_NUMBER: '639000000000', WHATSAPP_API_VERSION: 'v23.0', WHATSAPP_TEMPLATE_NAME: 'inquiry', WHATSAPP_TEMPLATE_LANGUAGE: 'en_US' };
const inquiry = { profile: 'example', name: 'Visitor', email: 'visitor@example.com', query: '<b>Help</b> with fees?', eventId: 'event-1' };
const reply = (data, status = 200, headers) => new Response(JSON.stringify(data), { status, headers });
function response() { return { headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; }, end() { return this; } }; }

test('integration flags default off and reject truthy strings and unexpected secret fields', () => {
  assert.deepEqual(enabledChannels(mergeWithDefaults({}).integrations), []);
  const merged = mergeWithDefaults({ integrations: { telegram: { enabled: 'true', token: 'secret' }, viber: { enabled: true } } });
  assert.deepEqual(merged.integrations.telegram, { enabled: false });
  assert.deepEqual(enabledChannels(merged.integrations), ['viber']);
});
test('credentials are bound to a profile and readiness never exposes their values', () => {
  assert.equal(notificationReadiness('example', env).telegram.configured, true);
  assert.equal(notificationReadiness('other', env).telegram.configured, false);
  assert.ok(!JSON.stringify(notificationReadiness('example', env)).includes('secret'));
});
for (const channel of ['telegram', 'viber', 'whatsapp']) test(`${channel} uses correct official payload and accepts a provider id`, async () => {
  const id = await sendNotification(channel, inquiry, env, async (url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal instanceof AbortSignal);
    if (channel === 'telegram') { assert.match(url, /^https:\/\/api.telegram.org\//); assert.equal(body.parse_mode, undefined); assert.ok(body.text.includes(inquiry.query)); return reply({ ok: true, result: { message_id: 7 } }); }
    if (channel === 'viber') { assert.equal(options.headers['X-Viber-Auth-Token'], 'secret'); assert.equal(body.receiver, '42'); return reply({ status: 0, message_token: '7' }); }
    assert.match(url, /^https:\/\/graph.facebook.com\/v23.0\/42\/messages$/);
    assert.equal(body.type, 'template');
    assert.deepEqual(body.template.components[0].parameters.map(x => x.text), [inquiry.profile, inquiry.name, inquiry.email, inquiry.query]);
    return reply({ messages: [{ id: '7' }] });
  });
  assert.equal(id, '7');
});
test('plain text is bounded and missing identity is explicit', async () => {
  await sendNotification('telegram', { ...inquiry, name: '', email: '', query: '😀'.repeat(9000) }, env, async (_, options) => {
    const { text } = JSON.parse(options.body); assert.ok(Array.from(text).length < 4096); assert.match(text, /Not provided/); return reply({ ok: true, result: { message_id: 1 } });
  });
});
test('WhatsApp parameters have no newlines and stay within template size budget', async () => {
  await sendNotification('whatsapp', { ...inquiry, query: 'a\n'.repeat(9000) }, env, async (_, options) => {
    const params = JSON.parse(options.body).template.components[0].parameters;
    assert.ok(params.every(x => !x.text.includes('\n'))); assert.ok(params[3].text.length <= 450); return reply({ messages: [{ id: '1' }] });
  });
});
test('429 honors retry-after without exposing provider content', async () => {
  await assert.rejects(sendNotification('telegram', inquiry, env, async () => reply({ description: 'secret' }, 429, { 'retry-after': '120' })), error => error.retryable && error.retryAfterSeconds === 120 && !error.message.includes('secret'));
});
test('permanent rejection is not retried', async () => {
  await assert.rejects(sendNotification('whatsapp', inquiry, env, async () => reply({}, 401)), error => error instanceof NotificationError && !error.retryable);
});
test('provider logical failures and malformed success are rejected', async () => {
  await assert.rejects(sendNotification('viber', inquiry, env, async () => reply({ status: 6 })), /viber_rejected/);
  await assert.rejects(sendNotification('telegram', inquiry, env, async () => reply({ ok: false, error_code: 429 })), error => error.retryable);
  await assert.rejects(sendNotification('whatsapp', inquiry, env, async () => reply({})), /invalid_provider_response/);
});
test('transport errors never expose bot token URLs', async () => {
  await assert.rejects(sendNotification('telegram', inquiry, env, async url => { throw new Error(url); }), error => error.message === 'network_or_timeout');
});
test('wrong profile cannot send even with complete credentials', async () => {
  await assert.rejects(sendNotification('telegram', { ...inquiry, profile: 'other' }, env, async () => assert.fail('must not call provider')), /not_configured/);
});
test('chat validation permits AI failure but rejects malformed and oversized input', () => {
  const input = { sessionId: 'session', userMessage: 'Help' };
  assert.equal(validateChatLog(input).aiResponse, '');
  assert.equal(validateChatLog(input).profile, 'duran-schulze');
  for (const value of [null, [], {}, { ...input, sessionId: '' }, { ...input, userMessage: {} }, { ...input, userName: 'x'.repeat(151) }]) assert.throws(() => validateChatLog(value));
});
test('production config/profile writes and status are protected without touching database', async () => {
  for (const [handler, method] of [[configHandler, 'POST'], [profilesHandler, 'PUT'], [profilesHandler, 'DELETE'], [statusHandler, 'GET']]) {
    const res = response(); await handler({ method, headers: {}, url: '/' }, res); assert.equal(res.statusCode, 401);
  }
});
test('cron rejects absent, wrong, and admin bearer tokens', async () => {
  process.env.CRON_SECRET = 'cron-secret';
  for (const authorization of ['', 'Bearer wrong', `Bearer ${jwt.sign({ username: 'admin' }, 'jwt-secret')}`]) {
    const res = response(); await cronHandler({ method: 'GET', headers: { authorization } }, res); assert.equal(res.statusCode, 401);
  }
  delete process.env.CRON_SECRET;
});
test('chat endpoint rejects invalid JSON and unsupported methods', async () => {
  let res = response(); await chatHandler({ method: 'POST', body: '{', headers: {} }, res); assert.equal(res.statusCode, 400);
  res = response(); await chatHandler({ method: 'GET', headers: {} }, res); assert.equal(res.statusCode, 405);
});

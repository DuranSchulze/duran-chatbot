import test from 'node:test';
import assert from 'node:assert/strict';
import { sendNotification, notificationReadiness, enabledChannels, NotificationError, validateChatLog } from '../packages/database/dist/index.js';
import { mergeWithDefaults, interpolateTemplateVariables, safePrivacyLinkUrl, splitPrivacyNoticeText } from '../packages/config/dist/index.js';
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
  const defaults = mergeWithDefaults({});
  assert.deepEqual(enabledChannels(defaults.integrations), []);
  assert.equal(defaults.behavior.openByDefault, true);
  assert.equal(mergeWithDefaults({ behavior: { openByDefault: false } }).behavior.openByDefault, false);
  assert.equal(mergeWithDefaults({ behavior: { openByDefault: 'true' } }).behavior.openByDefault, false);
  const merged = mergeWithDefaults({ integrations: { telegram: { enabled: 'true', token: 'secret' }, viber: { enabled: true } } });
  assert.deepEqual(merged.integrations.telegram, { enabled: false });
  assert.deepEqual(enabledChannels(merged.integrations), ['viber']);
});
test('proactive greeting defaults off, keeps a custom message, and forces the chat closed', () => {
  const defaults = mergeWithDefaults({});
  assert.equal(defaults.behavior.enableProactiveGreeting, false);
  assert.equal(defaults.behavior.proactiveGreetingMessage, 'Hey, this is {{companyName}}. Want some assistance?');
  assert.equal(interpolateTemplateVariables(defaults.behavior.proactiveGreetingMessage, { companyName: 'Acme' }), 'Hey, this is Acme. Want some assistance?');

  const custom = mergeWithDefaults({ behavior: { enableProactiveGreeting: true, proactiveGreetingMessage: 'Hi from {{companyName}}!' } });
  assert.equal(custom.behavior.proactiveGreetingMessage, 'Hi from {{companyName}}!');

  // The greeting bubble and the auto-expanded chat are mutually exclusive, so enabling the bubble wins.
  assert.equal(custom.behavior.openByDefault, false);
  assert.equal(mergeWithDefaults({ behavior: { enableProactiveGreeting: true, openByDefault: true } }).behavior.openByDefault, false);

  // Invalid or absent messages fall back to the shipped default instead of leaking through.
  assert.equal(mergeWithDefaults({ behavior: { proactiveGreetingMessage: 42 } }).behavior.proactiveGreetingMessage, defaults.behavior.proactiveGreetingMessage);

  // With the bubble off, openByDefault still defaults to true.
  assert.equal(mergeWithDefaults({ behavior: { enableProactiveGreeting: false } }).behavior.openByDefault, true);
});
test('privacy notice defaults off, keeps custom copy, and tolerates non-string values', () => {
  const defaults = mergeWithDefaults({});
  assert.equal(defaults.behavior.privacyNoticeEnabled, false);
  assert.equal(defaults.behavior.privacyNoticeText, 'I have read and agree to the {{link}}.');
  assert.equal(defaults.behavior.privacyNoticeLinkLabel, 'Privacy Policy');
  assert.equal(defaults.behavior.privacyNoticeUrl, '');

  const custom = mergeWithDefaults({ behavior: { privacyNoticeEnabled: true, privacyNoticeText: 'I accept the {{link}}', privacyNoticeLinkLabel: 'Terms', privacyNoticeUrl: 'https://example.test/terms' } });
  assert.equal(custom.behavior.privacyNoticeEnabled, true);
  assert.equal(custom.behavior.privacyNoticeText, 'I accept the {{link}}');
  assert.equal(custom.behavior.privacyNoticeLinkLabel, 'Terms');
  assert.equal(custom.behavior.privacyNoticeUrl, 'https://example.test/terms');

  // Strict flags and non-string copy fall back instead of leaking through.
  assert.equal(mergeWithDefaults({ behavior: { privacyNoticeEnabled: 'true' } }).behavior.privacyNoticeEnabled, false);
  assert.equal(mergeWithDefaults({ behavior: { privacyNoticeText: 42 } }).behavior.privacyNoticeText, defaults.behavior.privacyNoticeText);
  assert.equal(mergeWithDefaults({ behavior: { privacyNoticeUrl: null } }).behavior.privacyNoticeUrl, '');
});
test('privacy links stay http(s)-only and the sentence splits on its link token', () => {
  assert.equal(safePrivacyLinkUrl('https://example.test/privacy'), 'https://example.test/privacy');
  assert.equal(safePrivacyLinkUrl('  http://example.test/p  '), 'http://example.test/p');
  for (const unsafe of ['javascript:alert(1)', 'data:text/html,x', 'example.test/privacy', 'ftp://example.test/p', '', null, undefined]) {
    assert.equal(safePrivacyLinkUrl(unsafe), '');
  }

  assert.deepEqual(splitPrivacyNoticeText('I agree to the {{link}}.'), ['I agree to the ', '.']);
  assert.deepEqual(splitPrivacyNoticeText('I agree to the {{  link  }}.'), ['I agree to the ', '.']);
  assert.deepEqual(splitPrivacyNoticeText('No token here.'), ['No token here.']);
  assert.deepEqual(splitPrivacyNoticeText('{{link}} and {{link}}'), ['', ' and ', '']);
});
test('credentials are bound to a profile and readiness never exposes their values', () => {
  assert.equal(notificationReadiness('example', env).telegram.configured, true);
  assert.equal(notificationReadiness('other', env).telegram.configured, false);
  assert.ok(!JSON.stringify(notificationReadiness('example', env)).includes('secret'));
});
test('plural Viber and WhatsApp recipient lists are accepted without legacy recipient variables', () => {
  const multi = { ...env, VIBER_ADMIN_USER_ID: '', VIBER_ADMIN_USER_IDS: 'viber-1,viber-2', WHATSAPP_ADMIN_NUMBER: '', WHATSAPP_ADMIN_NUMBERS: '6391\n6392' };
  assert.equal(notificationReadiness('example', multi).viber.configured, true);
  assert.equal(notificationReadiness('example', multi).whatsapp.configured, true);
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
for (const channel of ['viber', 'whatsapp']) test(`${channel} sends once to each unique configured recipient`, async () => {
  const multi = channel === 'viber'
    ? { ...env, VIBER_ADMIN_USER_ID: 'first', VIBER_ADMIN_USER_IDS: 'second, first\nthird' }
    : { ...env, WHATSAPP_ADMIN_NUMBER: '6391', WHATSAPP_ADMIN_NUMBERS: '6392,6391\n6393' };
  const recipients = [];
  const id = await sendNotification(channel, inquiry, multi, async (_, options) => {
    const body = JSON.parse(options.body);
    recipients.push(channel === 'viber' ? body.receiver : body.to);
    return channel === 'viber' ? reply({ status: 0, message_token: recipients.length }) : reply({ messages: [{ id: recipients.length }] });
  });
  assert.deepEqual(recipients, channel === 'viber' ? ['second', 'first', 'third'] : ['6392', '6391', '6393']);
  assert.equal(id, '1,2,3');
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

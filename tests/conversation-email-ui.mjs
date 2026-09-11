// Start tests/preview-conversation-email.mjs first. Requires Playwright locally,
// or PLAYWRIGHT_MODULE pointing to its bundled index.mjs. No real messages sent.
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { formatConversationEmail } from '../packages/database/dist/index.js';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const output = await mkdtemp(join(tmpdir(), 'duran-email-ui-'));
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
try {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const base = 'http://127.0.0.1:5188';
  const path = '/conversations?profile=email-preview&conversation=conversation-preview';
  await page.goto(base + path);
  await page.getByLabel('Username', { exact: true }).fill('preview');
  await page.getByLabel('Password', { exact: true }).fill('preview');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('heading', { name: 'Preview visitor', exact: true }).waitFor();
  assert.equal(new URL(page.url()).pathname + new URL(page.url()).search, path);
  await page.screenshot({ path: join(output, 'conversation-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: join(output, 'conversation-mobile.png') });
  assert.ok(await page.getByRole('button', { name: 'Back to conversations', exact: true }).isVisible());
  await page.getByRole('button', { name: 'Back to conversations', exact: true }).click();
  assert.equal(new URL(page.url()).searchParams.has('conversation'), false);
  await page.goto(base + '/conversations?profile=email-preview&conversation=missing');
  await page.getByText('This conversation was not found in this profile. It may have been deleted. Choose another conversation below.', { exact: true }).waitFor();
  assert.equal(await page.getByRole('heading', { name: 'Preview visitor', exact: true }).count(), 0);
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto(base + '/');
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByRole('button', { name: 'Email', exact: true }).click();
  await page.getByRole('heading', { name: 'Conversation email alerts', exact: true }).waitFor();
  await page.getByText('Ready', { exact: true }).waitFor();
  await page.getByRole('heading', { name: 'Conversation email alerts', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(output, 'email-desktop.png') });
  const to = page.getByLabel('Notify recipients', { exact: true }).first();
  await to.fill('team@example.test, second@example.test');
  assert.equal(await to.inputValue(), 'team@example.test, second@example.test');
  await to.fill('invalid');
  await page.getByRole('alert').filter({ hasText: 'Enter valid email addresses' }).waitFor();
  await to.fill('team@example.test');
  await page.getByRole('button', { name: 'Retry failed emails', exact: true }).click();
  await page.getByText('1 failed email alerts queued. The worker will retry them shortly.', { exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('heading', { name: 'Conversation email alerts', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(output, 'email-mobile.png') });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
  assert.deepEqual(errors, []);

  const timestamp = '2026-09-11T02:00:00Z';
  const message = { id: 'one', role: 'user', content: 'Can you help with company registration?\nOur team needs a quote. <Not HTML> 😊', timestamp };
  const mail = formatConversationEmail({ settings: { enabled: true, to: ['team@example.test'], cc: [], subject: '' }, profile: { slug: 'email-preview', name: 'Duran Schulze' }, conversation: { id: 'conversation-preview', userName: 'Preview visitor', userEmail: 'visitor@example.test', firstSeen: timestamp, lastActive: timestamp }, message, messages: [message], adminOrigin: base });
  await page.setContent(mail.html);
  await page.screenshot({ path: join(output, 'email-message-mobile.png'), fullPage: true });
  assert.equal(await page.getByRole('link', { name: 'View conversation', exact: true }).getAttribute('href'), base + path);
  console.log('PASS: login return, exact selection, missing conversation, mobile navigation, Email card validation/retry, and rendered email CTA');
  console.log('Screenshots:', output);
} catch (error) {
  await page.screenshot({ path: join(output, 'failure.png'), fullPage: true });
  console.error('UI state:', await page.locator('body').innerText());
  console.error('Overflow:', await page.evaluate(() => [...document.querySelectorAll('body *')].map(el => ({ tag: el.tagName, className: el.className, right: el.getBoundingClientRect().right, width: el.getBoundingClientRect().width })).filter(el => el.right > innerWidth + 1).slice(0, 25)));
  console.error('Screenshots:', output);
  throw error;
} finally { await browser.close(); }

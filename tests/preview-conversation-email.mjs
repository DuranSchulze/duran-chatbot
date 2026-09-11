// Isolated UI fixture. No database, environment file, AI, or email provider access.
// Run after npm run build: node tests/preview-conversation-email.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { mergeWithDefaults } from '../packages/config/dist/index.js';

const root = resolve('apps/admin/dist');
let config = mergeWithDefaults({ behavior: { conversationEmail: { enabled: true, to: ['team@example.test'], cc: [], subject: '' } } });
const profile = { slug: 'email-preview', name: 'Duran · Email preview', status: 'active', createdAt: new Date().toISOString() };
const session = { id: 'conversation-preview', sessionId: 'public-session-preview', userName: 'Preview visitor', userEmail: 'visitor@example.test', profile: profile.slug, firstSeen: new Date().toISOString(), lastActive: new Date().toISOString(), adminReadAt: null,
  messages: [{ role: 'user', content: 'Can you help with a quote for company registration?', timestamp: new Date().toISOString() }, { role: 'assistant', content: 'This reply stays in the dashboard and is excluded from notification emails.', timestamp: new Date().toISOString() }] };
const token = `preview.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.preview`;
createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const json = (body, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
  const body = async () => { const chunks = []; for await (const chunk of req) chunks.push(chunk); return JSON.parse(Buffer.concat(chunks).toString() || '{}'); };
  if (url.pathname === '/api/auth') { const input = await body(); return json(input.username === 'preview' && input.password === 'preview' ? { token } : { error: 'Use preview / preview (local fixture only)' }, input.username === 'preview' && input.password === 'preview' ? 200 : 401); }
  if (url.pathname === '/api/profiles') {
    if (req.method === 'PUT') { const input = await body(); if (input.config) config = mergeWithDefaults(input.config); return json({ success: true }); }
    return json(url.searchParams.has('slug') ? { ...profile, ...(url.searchParams.get('metadata') === '1' ? {} : { config }) } : { profiles: [profile] });
  }
  if (url.pathname === '/api/config') return json(config);
  if (url.pathname === '/api/db-status') return json({ ok: true });
  if (url.pathname === '/api/email-integration') return req.method === 'GET' ? json({ integration: { provider: 'resend', fromEmail: 'notifications@example.test', fromName: 'Duran', hasSecret: true, configured: true } }) : json({ error: 'Sending and credential writes disabled in preview' }, 403);
  if (url.pathname === '/api/notification-status') return json(req.method === 'POST' ? { queued: 1 } : { readiness: { enabled: config.behavior.conversationEmail.enabled, configured: true, missing: [] }, counts: [{ status: 'accepted', count: 8 }, { status: 'failed', count: 1 }], lastFailure: { lastError: 'email_http_503', updatedAt: new Date().toISOString() } });
  if (url.pathname === '/api/conversations') {
    if (req.method === 'POST') { session.adminReadAt = new Date().toISOString(); return json({ success: true }); }
    return json({ sessions: url.searchParams.get('profile') === profile.slug ? [session] : [] });
  }
  if (url.pathname.startsWith('/api/')) return json({ error: 'Not available in isolated preview' }, 404);
  try {
    const path = resolve(root, '.' + url.pathname);
    if (!path.startsWith(root + '/')) throw new Error();
    const data = await readFile(path);
    res.writeHead(200, { 'Content-Type': ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.webp': 'image/webp', '.svg': 'image/svg+xml' })[extname(path)] || 'application/octet-stream' }); res.end(data);
  } catch { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(await readFile(resolve(root, 'index.html'))); }
}).listen(5188, '127.0.0.1', () => console.log('Isolated preview: http://127.0.0.1:5188/conversations?profile=email-preview&conversation=conversation-preview (login preview / preview)'));

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { readGeminiStream } from './gemini-stream.ts'

const source = await readFile(new URL('./gemini.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  .replace('"./grounding"', JSON.stringify(new URL('./grounding.ts', import.meta.url).href))
  .replace('"./gemini-stream"', JSON.stringify(new URL('./gemini-stream.ts', import.meta.url).href))
const { callGemini } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
const frame = (parts, extra = {}) => ({ candidates: [{ content: { parts }, ...extra }] })
function stream(payloads) {
  const bytes = new TextEncoder().encode(payloads.map(p => `data: ${JSON.stringify(p)}\r\n\r\n`).join(''))
  return new ReadableStream({ start(controller) { for (const byte of bytes) controller.enqueue(Uint8Array.of(byte)); controller.close() } })
}
const ai = { apiKey: 'test', model: 'gemini-2.5-flash', maxTokens: 4096, temperature: 0.7, systemPrompt: '' }
const call = (options = {}) => callGemini('Question', ai, { enabled: false }, [], [], [], options)

test('SSE preserves UTF-8 and frame boundaries', async () => {
  const received = []
  await readGeminiStream(stream([{ text: '⚖️ café' }, { text: 'next' }]), p => received.push(p))
  assert.deepEqual(received, [{ text: '⚖️ café' }, { text: 'next' }])
})
test('malformed JSON rejects', async () => {
  const body = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('data: {bad}\n\n')); c.close() } })
  await assert.rejects(readGeminiStream(body, () => {}), SyntaxError)
})
test('streams separate summaries and final citations; preserves fast budget', async (t) => {
  let request
  t.mock.method(globalThis, 'fetch', async (_, init) => {
    request = JSON.parse(init.body)
    return new Response(stream([
      frame([{ thought: true, text: 'Summary' }]),
      frame([{ text: 'Answer.' }]),
      frame([], { finishReason: 'STOP', groundingMetadata: { groundingChunks: [{ web: { uri: 'https://example.gov', title: 'Law' } }], groundingSupports: [{ segment: { text: 'Answer.' }, groundingChunkIndices: [0] }] } }),
    ]))
  })
  const updates = []
  const result = await call({ fast: true, includeThoughts: true, webSearch: true, onUpdate: u => updates.push(u) })
  assert.equal(result.thinkingSummary, 'Summary')
  assert.match(result.text, /Sources/)
  assert.doesNotMatch(result.text, /Summary/)
  assert.equal(result.sources.length, 1)
  assert.equal(request.generationConfig.thinkingConfig.thinkingBudget, 512)
  assert.equal(request.generationConfig.thinkingConfig.includeThoughts, true)
  assert.deepEqual(updates.map(u => u.type), ['attempt-reset', 'summary-update', 'answer-update'])
})
test('fallback resets attempts and never combines their summaries', async (t) => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => {
    calls++
    return new Response(stream(calls === 1 ? [frame([{ thought: true, text: 'Old' }])] : [frame([{ text: 'New' }], { finishReason: 'STOP' })]))
  })
  const updates = []
  const result = await call({ onUpdate: u => updates.push(u) })
  assert.equal(result.text, 'New')
  assert.equal(result.thinkingSummary, '')
  assert.equal(result.fallbackUsed, true)
  assert.equal(updates.filter(u => u.type === 'attempt-reset').length, 2)
})
test('longest truncated attempt retains matching summary and is labeled incomplete', async (t) => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => {
    calls++
    return new Response(stream([frame([{ thought: true, text: `Summary ${calls}` }, { text: calls === 1 ? 'Longest answer' : 'Short' }], { finishReason: 'MAX_TOKENS' })]))
  })
  const result = await call({ onUpdate: () => {} })
  assert.equal(result.text, 'Longest answer')
  assert.equal(result.thinkingSummary, 'Summary 1')
  assert.equal(result.incomplete, true)
  assert.equal(calls, 3)
})
test('safety errors do not fallback', async (t) => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => { calls++; return new Response(stream([frame([], { finishReason: 'SAFETY' })])) })
  await assert.rejects(call({ onUpdate: () => {} }), /safety filters/)
  assert.equal(calls, 1)
})
test('explicit summary rejection retries without includeThoughts', async (t) => {
  const configs = []
  t.mock.method(globalThis, 'fetch', async (_, init) => {
    configs.push(JSON.parse(init.body).generationConfig)
    return configs.length === 1 ? new Response(JSON.stringify({ error: { message: 'includeThoughts is not supported' } }), { status: 400 }) : new Response(stream([frame([{ text: 'Answer' }], { finishReason: 'STOP' })]))
  })
  assert.equal((await call({ includeThoughts: true, onUpdate: () => {} })).text, 'Answer')
  assert.equal(configs[0].thinkingConfig.includeThoughts, true)
  assert.equal(configs[1].thinkingConfig, undefined)
})
test('user cancellation does not fallback', async (t) => {
  const controller = new AbortController()
  let calls = 0
  t.mock.method(globalThis, 'fetch', async (_, init) => {
    calls++
    return new Promise((_, reject) => { init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))); controller.abort() })
  })
  await assert.rejects(call({ signal: controller.signal, onUpdate: () => {} }), { name: 'AbortError' })
  assert.equal(calls, 1)
})

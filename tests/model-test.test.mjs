import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import handler from "../api/model-test.js";

test("admin model test validates access and reports actual model responses", async (t) => {
  const previousSecret = process.env.AUTH_JWT_SECRET;
  const previousKey = process.env.GEMINI_API_KEY;
  process.env.AUTH_JWT_SECRET = "model-test-secret";
  process.env.GEMINI_API_KEY = "test-key";
  t.after(() => {
    if (previousSecret === undefined) delete process.env.AUTH_JWT_SECRET;
    else process.env.AUTH_JWT_SECRET = previousSecret;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  });
  const authorization = `Bearer ${jwt.sign({}, "model-test-secret", { expiresIn: "1m" })}`;
  const call = async (body, headers = { authorization }, method = "POST") => {
    const result = { setHeader() {}, end(value) { this.body = JSON.parse(value); } };
    await handler({ method, headers, body }, result);
    return result;
  };
  const fetchMock = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.ok(url.endsWith("/gemini-test:generateContent"));
    assert.equal(options.headers["x-goog-api-key"], "test-key");
    return Response.json({ candidates: [{ content: { parts: [{ thought: true, text: "hidden" }, { text: "Hello!" }] } }] });
  });
  assert.equal((await call({ model: "gemini-test" }, {})).statusCode, 401);
  assert.equal((await call({ model: "../bad" })).statusCode, 400);
  assert.equal((await call(null)).statusCode, 400);
  assert.equal((await call({}, {}, "GET")).statusCode, 405);
  assert.equal(fetchMock.mock.callCount(), 0);
  const success = await call({ model: "gemini-test" });
  assert.equal(success.statusCode, 200);
  assert.equal(success.body.model, "gemini-test");
  assert.equal(success.body.text, "Hello!");
  assert.ok(success.body.elapsedMs >= 0);
  fetchMock.mock.mockImplementation(async () => Response.json({}, { status: 429 }));
  assert.match((await call({ model: "gemini-test" })).body.error, /quota/);
  fetchMock.mock.mockImplementation(async () => Response.json({ candidates: [] }));
  assert.match((await call({ model: "gemini-test" })).body.error, /no text/);
  fetchMock.mock.mockImplementation(async () => { throw new DOMException("timeout", "TimeoutError"); });
  assert.equal((await call({ model: "gemini-test" })).statusCode, 504);
});

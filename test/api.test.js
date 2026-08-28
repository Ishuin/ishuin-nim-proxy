import { test } from 'node:test';
import assert from 'node:assert/strict';

const { default: handler } = await import('../api/index.js');

function createRes() {
  let statusCode = 0;
  let jsonData = null;
  return {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      jsonData = data;
      return this;
    },
    get statusCode() {
      return statusCode;
    },
    get jsonData() {
      return jsonData;
    },
  };
}

test('POST /api/chat - success returns 200 with text', async () => {
  global.fetch = () =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'test reply' } }],
        }),
    });

  const req = { method: 'POST', body: { message: 'hello' } };
  const res = createRes();
  await handler(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.jsonData.text, 'test reply');
});

test('POST /api/chat - missing message returns 400', async () => {
  const req = { method: 'POST', body: {} };
  const res = createRes();
  await handler(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.ok(res.jsonData.error);
});

test('POST /api/chat - wrong method returns 405', async () => {
  const req = { method: 'GET' };
  const res = createRes();
  await handler(req, res);
  assert.strictEqual(res.statusCode, 405);
});

test('POST /api/audit - returns 200 with audit response', async () => {
  global.fetch = () =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'audit reply' } }],
        }),
    });

  const req = { method: 'POST', body: { message: 'review this', path: '/api/audit' } };
  const res = createRes();
  await handler(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.jsonData.text, 'audit reply');
});

test('POST /api/chat - NIM error propagates with status', async () => {
  global.fetch = () =>
    Promise.resolve({
      ok: false,
      status: 500,
      text: () => Promise.resolve('upstream error'),
    });

  const req = { method: 'POST', body: { message: 'hello' } };
  const res = createRes();
  await handler(req, res);
  assert.strictEqual(res.statusCode, 500);
  assert.strictEqual(res.jsonData.error, 'upstream error');
});

test('POST /api/chat - exception returns 500', async () => {
  global.fetch = () => {
    throw new Error('network fail');
  };

  const req = { method: 'POST', body: { message: 'hello' } };
  const res = createRes();
  await handler(req, res);
  assert.strictEqual(res.statusCode, 500);
  assert.ok(res.jsonData.error.includes('Error connecting'));
});

test('POST /api/chat - custom system prompt is forwarded', async () => {
  let capturedBody = null;
  global.fetch = (_url, options) => {
    capturedBody = JSON.parse(options.body);
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'custom reply' } }],
        }),
    });
  };

  const req = {
    method: 'POST',
    body: { message: 'hello', system: 'custom system' },
  };
  const res = createRes();
  await handler(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(capturedBody.messages[0].role, 'system');
  assert.strictEqual(capturedBody.messages[0].content, 'custom system');
  assert.strictEqual(capturedBody.messages[1].role, 'user');
  assert.strictEqual(capturedBody.messages[1].content, 'hello');
});

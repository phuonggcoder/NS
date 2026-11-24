import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { getAiConfigFromEnv } from '../server-ai.mjs';
import { handleApiRequest } from '../server-api.mjs';

describe('Full-Stack Audit Fixes: Gemini x-goog-api-key, 2.5->2.0 fallback, 503 Storage Guard & Resilient Feedback', () => {
  let rootDir;
  let server;
  let baseUrl;
  let adminCookie = '';

  before(async () => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specpage-audit-'));
    server = http.createServer(async (req, res) => {
      if (await handleApiRequest(req, res, { rootDir })) return;
      res.statusCode = 404;
      res.end('Not Found');
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;

    const setupRes = await fetch(`${baseUrl}/api/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'AuditFixPassword123!' }),
    });
    assert.equal(setupRes.status, 200);
    adminCookie = setupRes.headers.get('set-cookie').split(';')[0];
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it('uses x-goog-api-key header (never ?key= query), honors GEMINI_MODEL, and falls back 2.5-flash (404) -> 2.0-flash (200)', async () => {
    const seenRequests = [];
    const mockGemini = http.createServer((req, res) => {
      seenRequests.push({
        url: req.url,
        apiKeyHeader: req.headers['x-goog-api-key'],
      });
      if (req.url.includes('gemini-2.5-flash:generateContent')) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: { message: 'Model gemini-2.5-flash not enabled' } }));
        return;
      }
      if (req.url.includes('gemini-2.0-flash:generateContent')) {
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify({ text: 'Thành công qua gemini-2.0-flash!' }) }],
                },
              },
            ],
          })
        );
        return;
      }
      res.statusCode = 404;
      res.end();
    });

    await new Promise((resolve) => mockGemini.listen(0, '127.0.0.1', resolve));
    const gAddr = mockGemini.address();

    const prevKey = process.env.GEMINI_API_KEY;
    const prevBase = process.env.GEMINI_API_BASE_URL;
    const prevModel = process.env.GEMINI_MODEL;
    process.env.GEMINI_API_KEY = 'AIzaTestHeaderOnlyKey123';
    process.env.GEMINI_API_BASE_URL = `http://127.0.0.1:${gAddr.port}`;
    process.env.GEMINI_MODEL = 'gemini-2.5-flash';

    try {
      const cfg = getAiConfigFromEnv();
      assert.equal(cfg.model, 'gemini-2.5-flash');

      const res = await fetch(`${baseUrl}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          task: 'menu_item_desc',
          input: 'Trà đào cam sả',
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.providerUsed, 'gemini');
      assert.equal(data.text, 'Thành công qua gemini-2.0-flash!');

      assert.equal(seenRequests.length, 2);
      for (const r of seenRequests) {
        assert.equal(r.url.includes('key='), false);
        assert.equal(r.apiKeyHeader, 'AIzaTestHeaderOnlyKey123');
      }
    } finally {
      if (prevKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prevKey;
      if (prevBase === undefined) delete process.env.GEMINI_API_BASE_URL;
      else process.env.GEMINI_API_BASE_URL = prevBase;
      if (prevModel === undefined) delete process.env.GEMINI_MODEL;
      else process.env.GEMINI_MODEL = prevModel;
      await new Promise((resolve) => mockGemini.close(resolve));
    }
  });

  it('returns HTTP 503 on GET /api/projects when cloud storage fails (never silent null)', async () => {
    const failingUpstash = http.createServer((_req, res) => {
      res.statusCode = 500;
      res.end('Upstash Outage');
    });
    await new Promise((resolve) => failingUpstash.listen(0, '127.0.0.1', resolve));
    const uAddr = failingUpstash.address();

    const prevUrl = process.env.UPSTASH_REDIS_REST_URL;
    const prevTok = process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${uAddr.port}`;
    process.env.UPSTASH_REDIS_REST_TOKEN = 'upstash-test';

    try {
      const res = await fetch(`${baseUrl}/api/projects`, {
        headers: { Cookie: adminCookie },
      });
      assert.equal(res.status, 503);
      const body = await res.json();
      assert.equal(body.ok, false);
      assert.ok(body.error.includes('lưu trữ'));
    } finally {
      if (prevUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
      else process.env.UPSTASH_REDIS_REST_URL = prevUrl;
      if (prevTok === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
      else process.env.UPSTASH_REDIS_REST_TOKEN = prevTok;
      await new Promise((resolve) => failingUpstash.close(resolve));
    }
  });

  it('keeps POST /api/ai/feedback resilient (HTTP 200) even when Gemini fails with 500', async () => {
    const failingGemini = http.createServer((_req, res) => {
      res.statusCode = 500;
      res.end('Internal Error');
    });
    await new Promise((resolve) => failingGemini.listen(0, '127.0.0.1', resolve));
    const gAddr = failingGemini.address();

    const prevKey = process.env.GEMINI_API_KEY;
    const prevBase = process.env.GEMINI_API_BASE_URL;
    process.env.GEMINI_API_KEY = 'AIzaTestResilienceKey';
    process.env.GEMINI_API_BASE_URL = `http://127.0.0.1:${gAddr.port}`;

    try {
      const res = await fetch(`${baseUrl}/api/ai/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          projectId: 'proj-resilient',
          taskType: 'headlines',
          aiOutput: 'Tiêu đề dài quá nhiều chữ không cần thiết',
          userFinalOutput: 'Ngắn gọn.',
          action: 'edited',
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.ok(data.learnedRule.length > 0);
    } finally {
      if (prevKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prevKey;
      if (prevBase === undefined) delete process.env.GEMINI_API_BASE_URL;
      else process.env.GEMINI_API_BASE_URL = prevBase;
      await new Promise((resolve) => failingGemini.close(resolve));
    }
  });
});

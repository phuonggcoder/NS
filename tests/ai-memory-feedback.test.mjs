import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import {
  appendLearnedRule,
  getAiMemoryKey,
  getProjectAiMemory,
  saveProjectAiMemory,
} from '../server-ai-memory.mjs';
import { handleApiRequest } from '../server-api.mjs';

describe('Context-Aware Gemini AI, Long-Term Brand Memory & Self-Learning Feedback', () => {
  let rootDir;
  let server;
  let baseUrl;
  let adminCookie = '';

  const sampleSpec = {
    specVersion: '1.0.0',
    templateId: 'coffee-shop',
    updatedAt: new Date().toISOString(),
    meta: {
      title: 'Mộc Coffee',
      description: 'Quá ngắn',
      favicon: '☕',
      floatingContact: { enabled: false, label: '', href: '#' },
    },
    theme: {
      presetId: 'warm-craft',
      mode: 'light',
      colors: {
        primary: '#8B4513',
        accent: '#D97706',
        background: '#FFFBF5',
        surface: '#FFFFFF',
        surfaceAlt: '#FEF3C7',
        text: '#292018',
        muted: '#78716C',
        border: '#FDE68A',
      },
      typography: { headingFont: 'Lora', bodyFont: 'Be Vietnam Pro', scale: 'standard' },
      shape: { radius: 'rounded', buttonStyle: 'solid', cardStyle: 'bordered' },
      spacing: 'standard',
    },
    sections: [
      {
        id: 'hero-1',
        type: 'hero',
        visible: true,
        anchorId: 'home',
        style: { surface: 'default', padding: 'spacious' },
        variant: 'centered',
        badge: 'Coffee',
        headline: 'Cà phê',
        highlightText: 'ngon',
        subheadline: 'Mộc Coffee chuyên rang xay.',
        primaryCtaLabel: 'Đặt ngay',
        primaryCtaHref: '#products',
        secondaryCtaLabel: 'Xem menu',
        secondaryCtaHref: '#about',
        imageUrl: '',
        imageCaption: '',
        trustChips: [],
      },
    ],
    digitalMenu: {
      enabled: true,
      brandName: 'Mộc Coffee',
      currency: 'đ',
      categories: [{ id: 'c1', name: 'Cà phê', visible: true, sortOrder: 0 }],
      items: [
        {
          id: 'm1',
          categoryId: 'c1',
          name: 'Bạc Xỉu Kem Muối',
          description: 'Ngon',
          imageUrl: '',
          price: 45000,
          status: 'available',
          optionGroups: [],
          sortOrder: 0,
        },
      ],
      theme: {
        layout: 'grid',
        mode: 'light',
        primaryColor: '#8B4513',
        accentColor: '#D97706',
        backgroundColor: '#FFFBF5',
        textColor: '#292018',
        fontFamily: 'Be Vietnam Pro',
        showCategoryNav: true,
      },
    },
  };

  before(async () => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specpage-ai-mem-'));
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
      body: JSON.stringify({ password: 'AiMemoryPassword123!' }),
    });
    assert.equal(setupRes.status, 200);
    adminCookie = setupRes.headers.get('set-cookie').split(';')[0];

    await fetch(`${baseUrl}/api/projects`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        activeProjectId: 'proj_moc_01',
        projects: [
          {
            id: 'proj_moc_01',
            slug: 'moc-coffee',
            projectName: 'Mộc Coffee',
            clientName: 'Anh Nam',
            status: 'draft',
            notes: '',
            updatedAt: new Date().toISOString(),
            spec: sampleSpec,
          },
        ],
      }),
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it('server-ai-memory.mjs persists ai:memory:<projectId>, deduplicates, and caps learnedRules at 20', async () => {
    assert.equal(getAiMemoryKey('proj_moc_01'), 'ai:memory:proj_moc_01');

    await saveProjectAiMemory(
      'proj_moc_01',
      {
        brandProfile: {
          industry: 'Cà phê đặc sản',
          tone: 'Ấm áp, tinh tế',
          audience: 'Người yêu cà phê rang mộc',
          usp: '100% Arabica Cầu Đất rang mới 48h',
          forbiddenWords: ['rẻ nhất', 'giá sốc'],
        },
        learnedRules: ['Luôn viết ngắn gọn dưới 2 dòng'],
      },
      rootDir
    );

    // Add 22 distinct rules -> must cap at 20 and dedupe
    for (let i = 1; i <= 22; i++) {
      await appendLearnedRule('proj_moc_01', `Quy tắc thương hiệu số ${i}`, rootDir);
    }
    await appendLearnedRule('proj_moc_01', 'quy tắc thương hiệu số 22', rootDir);

    const mem = await getProjectAiMemory('proj_moc_01', rootDir);
    assert.equal(mem.brandProfile.industry, 'Cà phê đặc sản');
    assert.deepEqual(mem.brandProfile.forbiddenWords, ['rẻ nhất', 'giá sốc']);
    assert.equal(mem.learnedRules.length, 20);
  });

  it('GET/PUT /api/ai/memory enforces auth and persists Brand Memory', async () => {
    const unauth = await fetch(`${baseUrl}/api/ai/memory?projectId=proj_moc_01`);
    assert.equal(unauth.status, 401);

    const putRes = await fetch(`${baseUrl}/api/ai/memory`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        projectId: 'proj_moc_01',
        brandProfile: {
          industry: 'Specialty Coffee',
          tone: 'Tối giản, chân thành',
          audience: 'Dân văn phòng',
          usp: 'Rang mộc không tẩm',
          forbiddenWords: ['số 1'],
        },
        learnedRules: ['Ưu tiên mô tả hương vị thật'],
      }),
    });
    assert.equal(putRes.status, 200);

    const getRes = await fetch(`${baseUrl}/api/ai/memory?projectId=proj_moc_01`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(getRes.status, 200);
    const data = await getRes.json();
    assert.equal(data.memory.brandProfile.industry, 'Specialty Coffee');
    assert.equal(data.memory.learnedRules[0], 'Ưu tiên mô tả hương vị thật');
  });

  it('POST /api/ai/feedback logs actions and distills <20-word rules on edited/rejected', async () => {
    const unauth = await fetch(`${baseUrl}/api/ai/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj_moc_01', taskType: 'headlines', aiOutput: 'A', action: 'accepted' }),
    });
    assert.equal(unauth.status, 401);

    const prevGem = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const editRes = await fetch(`${baseUrl}/api/ai/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          projectId: 'proj_moc_01',
          taskType: 'menu_item_desc',
          topic: 'Bạc Xỉu Kem Muối',
          aiOutput: 'Đây là một món đồ uống tuyệt vời nhất dành cho mọi người ở mọi lúc mọi nơi với hương vị đặc biệt.',
          userFinalOutput: 'Bạc xỉu béo dịu 45.000đ.',
          action: 'edited',
        }),
      });
      assert.equal(editRes.status, 200);
      const editData = await editRes.json();
      assert.ok(editData.learnedRule.length > 0);
      assert.ok(editData.learnedRule.split(/\s+/).length <= 20);

      const rejRes = await fetch(`${baseUrl}/api/ai/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          projectId: 'proj_moc_01',
          taskType: 'headlines',
          topic: 'Hero Headline',
          aiOutput: 'Tiêu đề chung chung',
          action: 'rejected',
        }),
      });
      assert.equal(rejRes.status, 200);
      const rejData = await rejRes.json();
      assert.ok(rejData.learnedRule.length > 0);
      assert.ok(rejData.memory.optimizationLog.length >= 2);
    } finally {
      if (prevGem !== undefined) process.env.GEMINI_API_KEY = prevGem;
    }
  });

  it('injects [PROJECT CONTEXT] & [LONG-TERM BRAND MEMORY] into Gemini systemInstruction and never leaks GEMINI_API_KEY', async () => {
    let capturedBody = null;
    const mockGemini = http.createServer((req, res) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        capturedBody = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        summary: 'Gemini đã đọc toàn bộ trang và đề xuất 2 điểm tối ưu.',
                        recommendations: [
                          {
                            id: 'g-1',
                            priority: 'high',
                            category: 'conversion',
                            title: 'Nâng cấp tiêu đề Hero theo USP',
                            reason: 'Tiêu đề hiện quá ngắn.',
                            targetSectionType: 'hero',
                            targetField: 'headline',
                            currentValue: 'Cà phê',
                            suggestedValue: 'Arabica Cầu Đất Rang Mộc 48h',
                          },
                        ],
                      }),
                    },
                  ],
                },
              },
            ],
          })
        );
      });
    });

    await new Promise((resolve) => mockGemini.listen(0, '127.0.0.1', resolve));
    const gAddr = mockGemini.address();
    const prevKey = process.env.GEMINI_API_KEY;
    const prevBase = process.env.GEMINI_API_BASE_URL;
    process.env.GEMINI_API_KEY = 'super-secret-gemini-key-test';
    process.env.GEMINI_API_BASE_URL = `http://127.0.0.1:${gAddr.port}`;

    try {
      const res = await fetch(`${baseUrl}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          task: 'holistic_audit',
          projectId: 'proj_moc_01',
          slug: 'moc-coffee',
          spec: sampleSpec,
        }),
      });
      assert.equal(res.status, 200);
      const rawText = await res.text();
      assert.equal(rawText.includes('super-secret-gemini-key-test'), false);

      const data = JSON.parse(rawText);
      assert.equal(data.ok, true);
      assert.equal(data.providerUsed, 'gemini');
      assert.equal(data.recommendations[0].suggestedValue, 'Arabica Cầu Đất Rang Mộc 48h');

      const sysText = capturedBody?.systemInstruction?.parts?.[0]?.text || '';
      assert.ok(sysText.includes('[PROJECT CONTEXT]'));
      assert.ok(sysText.includes('[LONG-TERM BRAND MEMORY]'));
      assert.ok(sysText.includes('Specialty Coffee'));
      assert.ok(sysText.includes('Digital Menu (Mộc Coffee)'));
    } finally {
      if (prevKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prevKey;
      if (prevBase === undefined) delete process.env.GEMINI_API_BASE_URL;
      else process.env.GEMINI_API_BASE_URL = prevBase;
      await new Promise((resolve) => mockGemini.close(resolve));
    }
  });

  it('recovers automatically from Gemini HTTP 404 by falling back / discovering an available model via ListModels', async () => {
    const requestedUrls = [];
    const mockGemini404 = http.createServer((req, res) => {
      requestedUrls.push(`${req.method} ${req.url.split('?')[0]}`);
      if (req.method === 'GET' && req.url.startsWith('/v1beta/models')) {
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            models: [
              {
                name: 'models/gemini-2.5-pro-preview',
                supportedGenerationMethods: ['generateContent'],
              },
            ],
          })
        );
        return;
      }

      if (req.url.includes('gemini-2.5-pro-preview:generateContent')) {
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify({ text: 'Mô tả từ model được tự động khám phá!' }) }],
                },
              },
            ],
          })
        );
        return;
      }

      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: { message: 'Model not found' } }));
    });

    await new Promise((resolve) => mockGemini404.listen(0, '127.0.0.1', resolve));
    const gAddr = mockGemini404.address();
    const prevKey = process.env.GEMINI_API_KEY;
    const prevBase = process.env.GEMINI_API_BASE_URL;
    const prevModel = process.env.AI_MODEL;
    process.env.GEMINI_API_KEY = 'gemini-404-recovery-key';
    process.env.GEMINI_API_BASE_URL = `http://127.0.0.1:${gAddr.port}`;
    process.env.AI_MODEL = 'models/gemini-1.0-pro-legacy';

    try {
      const res = await fetch(`${baseUrl}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          task: 'menu_item_desc',
          projectId: 'proj_moc_01',
          slug: 'moc-coffee',
          input: 'Cà phê sữa đá',
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.providerUsed, 'gemini');
      assert.equal(data.text, 'Mô tả từ model được tự động khám phá!');
      assert.ok(requestedUrls.some((u) => u === 'GET /v1beta/models'));
    } finally {
      if (prevKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prevKey;
      if (prevBase === undefined) delete process.env.GEMINI_API_BASE_URL;
      else process.env.GEMINI_API_BASE_URL = prevBase;
      if (prevModel === undefined) delete process.env.AI_MODEL;
      else process.env.AI_MODEL = prevModel;
      await new Promise((resolve) => mockGemini404.close(resolve));
    }
  });
});

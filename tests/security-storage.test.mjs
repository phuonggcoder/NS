import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { handleApiRequest } from '../server-api.mjs';
import {
  KV_KEYS,
  backupStoreSnapshot,
  getAnalyticsDayKey,
  getPublicSiteSpec,
  getVersionsKey,
  savePublishedSite,
  storeGetStrict,
} from '../server-store.mjs';

describe('Đợt 1: Security, Storage Hardening & Review Token Separation', () => {
  let rootDir;
  let server;
  let baseUrl;
  let adminCookie = '';
  let reviewToken = '';

  const baseSpec = {
    specVersion: '1.0.0',
    templateId: 'creator-store',
    updatedAt: new Date().toISOString(),
    meta: {
      title: 'Dự án Demo Đợt 1',
      description: 'Mô tả demo',
      favicon: '✨',
      floatingContact: { enabled: false, label: '', href: '#' },
    },
    theme: {
      presetId: 'speckit-crisp',
      mode: 'light',
      colors: {
        primary: '#007AFF',
        accent: '#5856D6',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceAlt: '#F5F5F7',
        text: '#1D1D1F',
        muted: '#6E6E73',
        border: '#E5E5EA',
      },
      typography: { headingFont: 'Inter', bodyFont: 'Inter', scale: 'standard' },
      shape: { radius: 'rounded', buttonStyle: 'solid', cardStyle: 'bordered' },
      spacing: 'standard',
    },
    sections: [],
  };

  before(async () => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specpage-dot1-'));
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
      body: JSON.stringify({ password: 'Dot1StrongPassword!' }),
    });
    assert.equal(setupRes.status, 200);
    adminCookie = setupRes.headers.get('set-cookie').split(';')[0];
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it('rejects cross-origin admin POST/PUT/DELETE with 403 CSRF guard (Origin & Referer)', async () => {
    const putCrossOrigin = await fetch(`${baseUrl}/api/projects`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
        Origin: 'https://evil-site.example',
      },
      body: JSON.stringify({ projects: [], activeProjectId: 'x' }),
    });
    assert.equal(putCrossOrigin.status, 403);

    const postCrossReferer = await fetch(`${baseUrl}/api/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
        Referer: 'https://phishing.example/steal',
      },
      body: JSON.stringify({ spec: baseSpec, html: '<html></html>' }),
    });
    assert.equal(postCrossReferer.status, 403);

    const deleteCrossOrigin = await fetch(`${baseUrl}/api/orders`, {
      method: 'DELETE',
      headers: {
        Cookie: adminCookie,
        Origin: 'https://evil-site.example',
      },
    });
    assert.equal(deleteCrossOrigin.status, 403);
  });

  it('storeGetStrict distinguishes missing key ({ found: false, value: null }) from corrupt/5xx errors (throws)', async () => {
    const missing = await storeGetStrict('missing_key_123', rootDir);
    assert.deepEqual(missing, { found: false, value: null });

    // Corrupt local JSON file must throw instead of returning fallback
    const kvDir = path.join(rootDir, 'data', 'kv');
    fs.mkdirSync(kvDir, { recursive: true });
    const badName = Buffer.from('broken_json_key', 'utf8').toString('base64url');
    fs.writeFileSync(path.join(kvDir, `${badName}.json`), '{invalid-json', 'utf8');
    await assert.rejects(() => storeGetStrict('broken_json_key', rootDir));

    // Simulate HTTP 500 on Upstash REST API -> storeGetStrict must throw
    const failingUpstash = http.createServer((_req, res) => {
      res.statusCode = 502;
      res.end('Bad Gateway');
    });
    await new Promise((resolve) => failingUpstash.listen(0, '127.0.0.1', resolve));
    const uAddr = failingUpstash.address();
    const prevUrl = process.env.UPSTASH_REDIS_REST_URL;
    const prevTok = process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${uAddr.port}`;
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    try {
      await assert.rejects(() => storeGetStrict('any_key', rootDir), /Upstash HTTP 502/);
    } finally {
      if (prevUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
      else process.env.UPSTASH_REDIS_REST_URL = prevUrl;
      if (prevTok === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
      else process.env.UPSTASH_REDIS_REST_TOKEN = prevTok;
      await new Promise((resolve) => failingUpstash.close(resolve));
    }
  });

  it('provides backupStoreSnapshot and future-proof KV key builders', async () => {
    assert.equal(KV_KEYS.CUSTOM_THEMES, 'themes:custom');
    assert.equal(getVersionsKey('proj_123'), 'versions:proj_123');
    assert.equal(getAnalyticsDayKey('quan-ca-phe', '2026-11-24'), 'analytics:quan-ca-phe:2026-11-24');
    assert.equal(getAnalyticsDayKey('Invalid Slug!', '2026-11-24'), 'analytics:du-an-mau:2026-11-24');

    const backup = await backupStoreSnapshot('dot1-verify', rootDir);
    assert.ok(backup.backupKey.startsWith('backup:'));
    const loaded = await storeGetStrict(backup.backupKey, rootDir);
    assert.equal(loaded.found, true);
    assert.equal(loaded.value.label, 'dot1-verify');
  });

  it('auto-generates reviewToken for legacy projects and separates mode=live vs mode=review', async () => {
    const draftSpec = {
      ...baseSpec,
      meta: { ...baseSpec.meta, title: 'Bản Nháp Bí Mật' },
    };

    const putRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        activeProjectId: 'p-legacy',
        projects: [
          {
            id: 'p-legacy',
            slug: 'khach-legacy',
            projectName: 'Khách Legacy',
            clientName: 'Chị Hoa',
            status: 'draft',
            notes: '',
            updatedAt: new Date().toISOString(),
            spec: draftSpec,
          },
        ],
      }),
    });
    assert.equal(putRes.status, 200);

    const listRes = await fetch(`${baseUrl}/api/projects`, { headers: { Cookie: adminCookie } });
    const listData = await listRes.json();
    reviewToken = listData.projects[0].reviewToken;
    assert.ok(typeof reviewToken === 'string' && reviewToken.length >= 16);

    // Anonymous mode=live BEFORE publish must NOT expose draft project
    const publicLiveBeforePublish = await fetch(`${baseUrl}/api/public/site?slug=khach-legacy`);
    assert.equal(publicLiveBeforePublish.status, 404);

    // mode=review without or with wrong reviewToken must return 403
    const reviewNoToken = await fetch(`${baseUrl}/api/public/review?slug=khach-legacy`);
    assert.equal(reviewNoToken.status, 403);
    const reviewBadToken = await fetch(`${baseUrl}/api/public/review?slug=khach-legacy&token=wrong`);
    assert.equal(reviewBadToken.status, 403);

    // mode=review with valid reviewToken returns draft spec
    const reviewValid = await fetch(
      `${baseUrl}/api/public/review?slug=khach-legacy&token=${encodeURIComponent(reviewToken)}`
    );
    assert.equal(reviewValid.status, 200);
    const reviewValidData = await reviewValid.json();
    assert.equal(reviewValidData.spec.meta.title, 'Bản Nháp Bí Mật');

    // Direct getPublicSiteSpec check: mode=live returns only published snapshot
    const publishedSpec = { ...baseSpec, meta: { ...baseSpec.meta, title: 'Bản Đã Xuất Bản' } };
    await savePublishedSite('khach-legacy', publishedSpec, '<html><body>Published</body></html>', rootDir);

    const liveResult = await getPublicSiteSpec('khach-legacy', rootDir, { mode: 'live' });
    assert.equal(liveResult.isDraft, false);
    assert.equal(liveResult.spec.meta.title, 'Bản Đã Xuất Bản');

    const reviewDenied = await getPublicSiteSpec('khach-legacy', rootDir, {
      mode: 'review',
      reviewToken: 'bad',
    });
    assert.equal(reviewDenied.unauthorized, true);

    const reviewAllowed = await getPublicSiteSpec('khach-legacy', rootDir, {
      mode: 'review',
      reviewToken,
    });
    assert.equal(reviewAllowed.isDraft, true);
    assert.equal(reviewAllowed.spec.meta.title, 'Bản Nháp Bí Mật');
  });
});

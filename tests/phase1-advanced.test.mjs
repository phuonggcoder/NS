import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import {
  handleApiRequest,
  handlePublishedAssetRequest,
  handleSeoDiscoveryRequest,
} from '../server-api.mjs';
import { storeGetStrict } from '../server-store.mjs';

describe('Đợt 3: Server AI Proxy, Version Restore, Token Review, SEO & Privacy Analytics', () => {
  let rootDir;
  let server;
  let baseUrl;
  let adminCookie = '';
  let reviewToken = '';

  const baseSpec = {
    specVersion: '1.0.0',
    templateId: 'coffee-shop',
    updatedAt: new Date().toISOString(),
    meta: {
      title: 'Mộc Café — Bản Gốc V1',
      description: 'Cà phê rang mộc Đà Lạt',
      favicon: '☕',
      floatingContact: { enabled: false, label: '', href: '#' },
      ogTitle: 'Mộc Café OG',
      canonicalUrl: 'https://moccafe.example/',
    },
    theme: {
      presetId: 'warm-craft',
      mode: 'light',
      colors: {
        primary: '#8B4513',
        secondary: '#D97706',
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
    sections: [],
    digitalMenu: {
      enabled: true,
      brandName: 'Mộc Café',
      currency: 'đ',
      categories: [],
      items: [],
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
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specpage-dot3-'));
    server = http.createServer(async (req, res) => {
      if (await handleApiRequest(req, res, { rootDir })) return;
      if (await handleSeoDiscoveryRequest(req, res, rootDir)) return;
      if (await handlePublishedAssetRequest(req, res, rootDir)) return;
      res.statusCode = 404;
      res.end('Not Found');
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;

    const setupRes = await fetch(`${baseUrl}/api/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'Dot3AdminPassword!' }),
    });
    assert.equal(setupRes.status, 200);
    adminCookie = setupRes.headers.get('set-cookie').split(';')[0];

    await fetch(`${baseUrl}/api/projects`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        activeProjectId: 'proj-dot3',
        projects: [
          {
            id: 'proj-dot3',
            slug: 'moc-cafe',
            projectName: 'Mộc Café',
            clientName: 'Anh Minh',
            status: 'review',
            notes: '',
            updatedAt: new Date().toISOString(),
            spec: baseSpec,
          },
        ],
      }),
    });

    const listRes = await fetch(`${baseUrl}/api/projects`, { headers: { Cookie: adminCookie } });
    const listData = await listRes.json();
    reviewToken = listData.projects[0].reviewToken;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it('AI proxy requires admin auth (401) and falls back cleanly to local Vietnamese engine', async () => {
    const unauth = await fetch(`${baseUrl}/api/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'menu_item_desc', input: 'Bạc xỉu kem muối' }),
    });
    assert.equal(unauth.status, 401);

    const prevGem = process.env.GEMINI_API_KEY;
    const prevOai = process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const spellRes = await fetch(`${baseUrl}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          task: 'spellcheck',
          input: 'ca phe tra sua chat luong gia tot',
          context: { brandName: 'Mộc Café' },
        }),
      });
      assert.equal(spellRes.status, 200);
      const spellData = await spellRes.json();
      assert.equal(spellData.ok, true);
      assert.equal(spellData.providerUsed, 'local');
      assert.ok(spellData.text.includes('cà phê'));
      assert.ok(spellData.text.includes('trà sữa'));

      const menuRes = await fetch(`${baseUrl}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          task: 'menu_item_desc',
          input: 'Cold Brew Cam Sả',
          context: { brandName: 'Mộc Café' },
        }),
      });
      const menuData = await menuRes.json();
      assert.equal(menuData.ok, true);
      assert.ok(menuData.text.includes('Cold Brew Cam Sả'));
    } finally {
      if (prevGem !== undefined) process.env.GEMINI_API_KEY = prevGem;
      if (prevOai !== undefined) process.env.OPENAI_API_KEY = prevOai;
    }
  });

  it('Version History round-trip saves snapshot and auto-backups current state before restore', async () => {
    const saveV1 = await fetch(`${baseUrl}/api/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        slug: 'moc-cafe',
        label: 'Bản ổn định V1',
        scope: 'both',
        actor: 'Senior Admin',
        spec: baseSpec,
      }),
    });
    assert.equal(saveV1.status, 200);
    const v1Json = await saveV1.json();
    assert.equal(v1Json.version.actor, 'Senior Admin');
    assert.equal(v1Json.version.scope, 'both');

    // Overwrite active project to V2
    const v2Spec = { ...baseSpec, meta: { ...baseSpec.meta, title: 'Mộc Café — Bản Thử Nghiệm V2' } };
    await fetch(`${baseUrl}/api/projects`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        activeProjectId: 'proj-dot3',
        projects: [
          {
            id: 'proj-dot3',
            slug: 'moc-cafe',
            projectName: 'Mộc Café',
            clientName: 'Anh Minh',
            status: 'review',
            notes: '',
            updatedAt: new Date().toISOString(),
            reviewToken,
            spec: v2Spec,
          },
        ],
      }),
    });

    // Restore V1 -> must revert project spec to V1 and save V2 backup snapshot
    const restoreRes = await fetch(`${baseUrl}/api/versions/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ slug: 'moc-cafe', versionId: v1Json.version.id }),
    });
    assert.equal(restoreRes.status, 200);
    const restoreData = await restoreRes.json();
    assert.equal(restoreData.restored.spec.meta.title, 'Mộc Café — Bản Gốc V1');

    const projAfter = await (await fetch(`${baseUrl}/api/projects`, { headers: { Cookie: adminCookie } })).json();
    assert.equal(projAfter.projects[0].spec.meta.title, 'Mộc Café — Bản Gốc V1');

    const versionsList = await (
      await fetch(`${baseUrl}/api/versions?slug=moc-cafe`, { headers: { Cookie: adminCookie } })
    ).json();
    assert.ok(versionsList.versions.some((v) => v.spec.meta.title === 'Mộc Café — Bản Thử Nghiệm V2'));
  });

  it('Client Review enforces token (403/200) and supports pending -> rejected -> approved with history', async () => {
    const denied = await fetch(`${baseUrl}/api/public/review?slug=moc-cafe&token=invalid`);
    assert.equal(denied.status, 403);

    const allowed = await fetch(
      `${baseUrl}/api/public/review?slug=moc-cafe&token=${encodeURIComponent(reviewToken)}`
    );
    assert.equal(allowed.status, 200);
    const allowedData = await allowed.json();
    assert.equal(allowedData.status, 'review');

    const rejectRes = await fetch(`${baseUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientSlug: 'moc-cafe',
        reviewToken,
        author: 'Anh Minh',
        sectionLabel: 'Bảng giá',
        comment: 'Cần cập nhật lại giá size L',
        type: 'rejected',
      }),
    });
    assert.equal(rejectRes.status, 200);
    assert.equal((await rejectRes.json()).status, 'rejected');

    const approveRes = await fetch(`${baseUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientSlug: 'moc-cafe',
        reviewToken,
        author: 'Anh Minh',
        sectionLabel: 'Tổng thể trang',
        comment: 'Đã sửa chuẩn, đồng ý xuất bản.',
        type: 'approved',
      }),
    });
    assert.equal(approveRes.status, 200);
    assert.equal((await approveRes.json()).status, 'approved');

    const historyRes = await fetch(
      `${baseUrl}/api/public/review?slug=moc-cafe&token=${encodeURIComponent(reviewToken)}`
    );
    const historyData = await historyRes.json();
    assert.equal(historyData.status, 'approved');
    assert.equal(historyData.feedbackHistory.length, 2);
  });

  it('serves dynamic /robots.txt and /sitemap.xml including published site and Digital Menu', async () => {
    await fetch(`${baseUrl}/api/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        slug: 'moc-cafe',
        spec: baseSpec,
        html: '<!doctype html><html><body><h1>Mộc Café</h1></body></html>',
      }),
    });

    const robotsRes = await fetch(`${baseUrl}/robots.txt`);
    assert.equal(robotsRes.status, 200);
    const robotsText = await robotsRes.text();
    assert.ok(robotsText.includes('User-agent: *'));
    assert.ok(robotsText.includes('Sitemap:'));

    const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`);
    assert.equal(sitemapRes.status, 200);
    const sitemapXml = await sitemapRes.text();
    assert.ok(sitemapXml.includes('<urlset'));
    assert.ok(sitemapXml.includes('/clients/moc-cafe/index.html'));
    assert.ok(sitemapXml.includes('/menu/moc-cafe'));
  });

  it('tracks privacy-friendly analytics without storing raw IP or User-Agent PII', async () => {
    const fakeIp = '198.51.100.77';
    const fakeUa = 'SecretCustomBrowser/9.9';

    await fetch(`${baseUrl}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': fakeIp,
        'user-agent': fakeUa,
        Referer: 'https://facebook.com/post/123',
      },
      body: JSON.stringify({ slug: 'moc-cafe', event: 'page_view', path: '/clients/moc-cafe/index.html' }),
    });

    await fetch(`${baseUrl}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': fakeIp,
        'user-agent': fakeUa,
      },
      body: JSON.stringify({ slug: 'moc-cafe', event: 'qr_visit', path: '/menu/moc-cafe?qr=1' }),
    });

    await fetch(`${baseUrl}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': fakeIp,
        'user-agent': fakeUa,
      },
      body: JSON.stringify({ slug: 'moc-cafe', event: 'menu_item_view', itemName: 'Cà Phê Sữa Đá' }),
    });

    const rawStore = await storeGetStrict('analytics:moc-cafe', rootDir);
    assert.equal(rawStore.found, true);
    const serialized = JSON.stringify(rawStore.value);
    assert.equal(serialized.includes(fakeIp), false);
    assert.equal(serialized.includes(fakeUa), false);

    const reportRes = await fetch(`${baseUrl}/api/analytics?slug=moc-cafe&days=30`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(reportRes.status, 200);
    const report = await reportRes.json();
    assert.equal(report.totals.pageViews, 1);
    assert.equal(report.totals.menuViews, 1);
    assert.equal(report.totals.qrVisits, 1);
    assert.equal(report.totals.uniqueVisitors, 1);
    assert.equal(report.popularMenuItems[0].name, 'Cà Phê Sữa Đá');
  });
});

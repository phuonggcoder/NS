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

describe('Publish, Token Review, SEO Discovery, Analytics & Server AI', () => {
  let rootDir;
  let server;
  let baseUrl;
  let cookie;
  let reviewToken;

  before(async () => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specpage-e2e-'));
    server = http.createServer(async (req, res) => {
      if (await handleApiRequest(req, res, { rootDir })) return;
      if (await handleSeoDiscoveryRequest(req, res, rootDir)) return;
      if (await handlePublishedAssetRequest(req, res, rootDir)) return;
      res.statusCode = 404;
      res.end('Not found');
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;

    const setup = await fetch(`${baseUrl}/api/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'ReviewAdminPassword2026!' }),
    });
    cookie = setup.headers.get('set-cookie').split(';')[0];

    await fetch(`${baseUrl}/api/projects`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        activeProjectId: 'r-1',
        projects: [
          {
            id: 'r-1',
            slug: 'coffee-moc',
            projectName: 'Mộc Coffee',
            clientName: 'Anh Bình',
            status: 'review',
            notes: '',
            updatedAt: new Date().toISOString(),
            spec: {
              specVersion: '1.0.0',
              templateId: 'coffee-shop',
              updatedAt: new Date().toISOString(),
              meta: { title: 'Mộc Coffee', description: 'Cà phê rang mộc', favicon: '☕', floatingContact: { enabled: false, label: '', href: '#' } },
              theme: {},
              sections: [],
              digitalMenu: { enabled: true, brandName: 'Mộc Coffee', currency: 'đ', categories: [], items: [], theme: { layout: 'grid', mode: 'light', primaryColor: '#8B4513', accentColor: '#D97706', backgroundColor: '#FFF', textColor: '#111', fontFamily: 'Inter', showCategoryNav: true } },
            },
          },
        ],
      }),
    });

    const projRes = await fetch(`${baseUrl}/api/projects`, { headers: { Cookie: cookie } });
    const projData = await projRes.json();
    reviewToken = projData.projects[0].reviewToken;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it('enforces reviewToken on /api/public/review and updates project status on approve/reject', async () => {
    const badRes = await fetch(`${baseUrl}/api/public/review?slug=coffee-moc&token=wrong-token`);
    assert.equal(badRes.status, 403);

    const goodRes = await fetch(
      `${baseUrl}/api/public/review?slug=coffee-moc&token=${encodeURIComponent(reviewToken)}`
    );
    assert.equal(goodRes.status, 200);
    const goodData = await goodRes.json();
    assert.equal(goodData.slug, 'coffee-moc');

    const rejectRes = await fetch(`${baseUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientSlug: 'coffee-moc',
        reviewToken,
        author: 'Anh Bình',
        sectionLabel: 'Hero',
        comment: 'Đổi màu nút đậm hơn',
        type: 'rejected',
      }),
    });
    assert.equal(rejectRes.status, 200);
    const rejectData = await rejectRes.json();
    assert.equal(rejectData.status, 'rejected');

    const approveRes = await fetch(`${baseUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientSlug: 'coffee-moc',
        reviewToken,
        author: 'Anh Bình',
        sectionLabel: 'Tổng thể trang',
        comment: 'OK duyệt!',
        type: 'approved',
      }),
    });
    assert.equal(approveRes.status, 200);
    const approveData = await approveRes.json();
    assert.equal(approveData.status, 'approved');
  });

  it('publishes site and serves dynamic /robots.txt and /sitemap.xml', async () => {
    const pubRes = await fetch(`${baseUrl}/api/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        slug: 'coffee-moc',
        spec: { meta: { title: 'Mộc Coffee' }, sections: [], theme: {} },
        html: '<!doctype html><html><body><h1>Mộc Coffee</h1></body></html>',
      }),
    });
    assert.equal(pubRes.status, 200);

    const clientHtml = await fetch(`${baseUrl}/clients/coffee-moc/index.html`);
    assert.equal(clientHtml.status, 200);
    assert.ok((await clientHtml.text()).includes('Mộc Coffee'));

    const robotsRes = await fetch(`${baseUrl}/robots.txt`);
    assert.equal(robotsRes.status, 200);
    assert.ok((await robotsRes.text()).includes('Sitemap:'));

    const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`);
    assert.equal(sitemapRes.status, 200);
    const xml = await sitemapRes.text();
    assert.ok(xml.includes('/clients/coffee-moc/index.html'));
    assert.ok(xml.includes('/menu/coffee-moc'));
  });

  it('tracks privacy-friendly analytics without storing IP/PII and aggregates report', async () => {
    await fetch(`${baseUrl}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.42' },
      body: JSON.stringify({ slug: 'coffee-moc', event: 'page_view', path: '/clients/coffee-moc/index.html' }),
    });
    await fetch(`${baseUrl}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.42' },
      body: JSON.stringify({ slug: 'coffee-moc', event: 'qr_visit', path: '/menu/coffee-moc?qr=1' }),
    });
    await fetch(`${baseUrl}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.42' },
      body: JSON.stringify({ slug: 'coffee-moc', event: 'menu_item_view', itemName: 'Bạc Xỉu Kem Muối' }),
    });

    const rawStore = await storeGetStrict('analytics:coffee-moc', rootDir);
    assert.equal(rawStore.found, true);
    assert.equal(JSON.stringify(rawStore.value).includes('203.0.113.42'), false);

    const reportRes = await fetch(`${baseUrl}/api/analytics?slug=coffee-moc&days=30`, {
      headers: { Cookie: cookie },
    });
    const report = await reportRes.json();
    assert.equal(report.ok, true);
    assert.equal(report.totals.pageViews, 1);
    assert.equal(report.totals.qrVisits, 1);
    assert.equal(report.totals.menuViews, 1);
    assert.equal(report.totals.uniqueVisitors, 1);
    assert.equal(report.popularMenuItems[0].name, 'Bạc Xỉu Kem Muối');
  });

  it('provides server-side AI fallback with zero secrets exposed', async () => {
    const aiRes = await fetch(`${baseUrl}/api/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        task: 'spellcheck',
        input: 'ca phe tra sua chat luong gia tot',
        context: { brandName: 'Mộc Coffee' },
      }),
    });
    assert.equal(aiRes.status, 200);
    const aiData = await aiRes.json();
    assert.equal(aiData.ok, true);
    assert.ok(aiData.text.includes('cà phê'));
    assert.ok(aiData.text.includes('trà sữa'));
  });
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import QRCode from 'qrcode';
import { handleApiRequest } from '../server-api.mjs';

describe('Digital Menu, Pricing/Validation & QR Code Generation', () => {
  let rootDir;
  let server;
  let baseUrl;
  let cookie;

  before(async () => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specpage-menu-'));
    server = http.createServer(async (req, res) => {
      if (await handleApiRequest(req, res, { rootDir })) return;
      res.statusCode = 404;
      res.end('Not found');
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;

    const setup = await fetch(`${baseUrl}/api/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'MenuAdminPassword2026!' }),
    });
    cookie = setup.headers.get('set-cookie').split(';')[0];
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it('serves enabled Digital Menu via /api/public/menu and returns 404 when disabled', async () => {
    const menuPayload = {
      enabled: true,
      brandName: 'Quán Trà Sữa LÁ',
      currency: 'đ',
      categories: [{ id: 'c1', name: 'Trà Sữa', visible: true, sortOrder: 0 }],
      items: [
        {
          id: 'i1',
          categoryId: 'c1',
          name: 'Oolong Kem Cheese',
          description: 'Đậm vị trà',
          imageUrl: '',
          price: 48000,
          salePrice: 42000,
          status: 'available',
          bestSeller: true,
          optionGroups: [
            {
              id: 'g-size',
              name: 'Size',
              type: 'single',
              required: true,
              choices: [
                { id: 's-m', label: 'Size M', priceDelta: 0 },
                { id: 's-l', label: 'Size L', priceDelta: 10000 },
              ],
            },
            {
              id: 'g-top',
              name: 'Topping',
              type: 'multiple',
              required: false,
              choices: [{ id: 't-tc', label: 'Trân châu', priceDelta: 8000 }],
            },
          ],
          sortOrder: 0,
        },
      ],
      theme: {
        layout: 'grid',
        mode: 'light',
        primaryColor: '#059669',
        accentColor: '#F59E0B',
        backgroundColor: '#FFFFFF',
        textColor: '#0F172A',
        fontFamily: 'Be Vietnam Pro',
        showCategoryNav: true,
      },
    };

    await fetch(`${baseUrl}/api/projects`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        activeProjectId: 'm-1',
        projects: [
          {
            id: 'm-1',
            slug: 'tra-sua-la',
            projectName: 'Trà Sữa LÁ',
            clientName: 'Chị Mai',
            status: 'draft',
            notes: '',
            updatedAt: new Date().toISOString(),
            spec: {
              specVersion: '1.0.0',
              templateId: 'milk-tea',
              updatedAt: new Date().toISOString(),
              meta: { title: 'Trà Sữa LÁ', description: '', favicon: '🧋', floatingContact: { enabled: false, label: '', href: '#' } },
              theme: {},
              sections: [],
              digitalMenu: menuPayload,
            },
          },
        ],
      }),
    });

    const pubMenuRes = await fetch(`${baseUrl}/api/public/menu?slug=tra-sua-la`);
    assert.equal(pubMenuRes.status, 200);
    const pubMenu = await pubMenuRes.json();
    assert.equal(pubMenu.ok, true);
    assert.equal(pubMenu.menu.brandName, 'Quán Trà Sữa LÁ');
    assert.equal(pubMenu.menu.items[0].optionGroups[0].required, true);

    const missingRes = await fetch(`${baseUrl}/api/public/menu?slug=khong-ton-tai`);
    assert.equal(missingRes.status, 404);
  });

  it('generates valid PNG data URL and SVG string for stable QR Menu URLs', async () => {
    const stableUrl = `${baseUrl}/menu/tra-sua-la?qr=1&branch=quan-1&table=ban-05`;
    const pngDataUrl = await QRCode.toDataURL(stableUrl, { width: 256 });
    const svgString = await QRCode.toString(stableUrl, { type: 'svg', width: 256 });
    assert.ok(pngDataUrl.startsWith('data:image/png;base64,'));
    assert.ok(svgString.includes('<svg') && svgString.includes('</svg>'));
  });
});

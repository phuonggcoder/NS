import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import QRCode from 'qrcode';
import { handleApiRequest } from '../server-api.mjs';
import {
  calculateConfiguredItemPrice,
  formatMenuPrice,
  validateRequiredOptionGroups,
} from '../src/data/menuPricing.mjs';

describe('Đợt 2: Digital Menu Pricing, Option Validation, QR, /api/public/menu & /api/themes', () => {
  let rootDir;
  let server;
  let baseUrl;
  let adminCookie = '';

  const sampleItem = {
    id: 'item-oolong',
    categoryId: 'cat-1',
    name: 'Trà Sữa Oolong Kem Cheese',
    description: 'Thơm đậm vị trà rang',
    imageUrl: '',
    price: 48000,
    salePrice: 42000,
    status: 'available',
    bestSeller: true,
    featured: true,
    allergens: ['Sữa', 'Caffeine'],
    sortOrder: 0,
    optionGroups: [
      {
        id: 'grp-size',
        name: 'Kích cỡ (Size)',
        type: 'single',
        required: true,
        choices: [
          { id: 'sz-m', label: 'Size M', priceDelta: 0, defaultSelected: true },
          { id: 'sz-l', label: 'Size L', priceDelta: 10000 },
        ],
      },
      {
        id: 'grp-topping',
        name: 'Topping thêm',
        type: 'multiple',
        required: false,
        maxSelect: 2,
        choices: [
          { id: 'top-tc', label: 'Trân châu đen', priceDelta: 8000 },
          { id: 'top-cheese', label: 'Kem Cheese', priceDelta: 12000 },
          { id: 'top-pud', label: 'Pudding trứng', priceDelta: 10000 },
        ],
      },
    ],
  };

  before(async () => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specpage-dot2-'));
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
      body: JSON.stringify({ password: 'Dot2AdminPassword!' }),
    });
    assert.equal(setupRes.status, 200);
    adminCookie = setupRes.headers.get('set-cookie').split(';')[0];
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it('calculates configured item price using salePrice, option surcharges, and quantity', () => {
    // Base uses salePrice (42,000) + Size L (+10,000) + 2 toppings (+8,000 + 12,000) = 72,000 * 2 = 144,000
    const pricing = calculateConfiguredItemPrice(
      sampleItem,
      {
        'grp-size': ['sz-l'],
        'grp-topping': ['top-tc', 'top-cheese'],
      },
      2
    );
    assert.equal(pricing.unitBase, 42000);
    assert.equal(pricing.optionsDelta, 30000);
    assert.equal(pricing.unitTotal, 72000);
    assert.equal(pricing.lineTotal, 144000);
    assert.equal(formatMenuPrice(pricing.lineTotal, 'đ'), '144.000đ');
  });

  it('validates required option groups and maxSelect constraints', () => {
    const missingReq = validateRequiredOptionGroups(sampleItem, {});
    assert.equal(missingReq.valid, false);
    assert.deepEqual(missingReq.missingGroupIds, ['grp-size']);

    const tooManyToppings = validateRequiredOptionGroups(sampleItem, {
      'grp-size': ['sz-m'],
      'grp-topping': ['top-tc', 'top-cheese', 'top-pud'],
    });
    assert.equal(tooManyToppings.valid, false);
    assert.deepEqual(tooManyToppings.missingGroupIds, ['grp-topping']);

    const valid = validateRequiredOptionGroups(sampleItem, {
      'grp-size': ['sz-l'],
      'grp-topping': ['top-tc'],
    });
    assert.equal(valid.valid, true);
    assert.deepEqual(valid.missingGroupIds, []);
  });

  it('serves /api/public/menu 200 when enabled, 404 when disabled, and captures QR branch/table orders', async () => {
    await fetch(`${baseUrl}/api/projects`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        activeProjectId: 'p-menu-on',
        projects: [
          {
            id: 'p-menu-on',
            slug: 'quan-la',
            projectName: 'Quán Trà LÁ',
            clientName: 'Chị Lan',
            status: 'draft',
            notes: '',
            updatedAt: new Date().toISOString(),
            spec: {
              specVersion: '1.0.0',
              templateId: 'milk-tea',
              updatedAt: new Date().toISOString(),
              meta: { title: 'Quán Trà LÁ', description: '', favicon: '🧋', floatingContact: { enabled: false, label: '', href: '#' } },
              theme: {},
              sections: [],
              digitalMenu: {
                enabled: true,
                brandName: 'Quán Trà LÁ',
                currency: 'đ',
                categories: [{ id: 'cat-1', name: 'Trà Sữa', visible: true, sortOrder: 0 }],
                items: [sampleItem],
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
              },
            },
          },
          {
            id: 'p-menu-off',
            slug: 'menu-tat',
            projectName: 'Menu Đang Tắt',
            clientName: 'Anh B',
            status: 'draft',
            notes: '',
            updatedAt: new Date().toISOString(),
            spec: {
              specVersion: '1.0.0',
              templateId: 'business',
              updatedAt: new Date().toISOString(),
              meta: { title: 'Menu Đang Tắt', description: '', favicon: '🏢', floatingContact: { enabled: false, label: '', href: '#' } },
              theme: {},
              sections: [],
              digitalMenu: {
                enabled: false,
                brandName: 'Menu Tắt',
                currency: 'đ',
                categories: [],
                items: [],
                theme: {
                  layout: 'grid',
                  mode: 'light',
                  primaryColor: '#007AFF',
                  accentColor: '#5856D6',
                  backgroundColor: '#FFFFFF',
                  textColor: '#0F172A',
                  fontFamily: 'Inter',
                  showCategoryNav: true,
                },
              },
            },
          },
        ],
      }),
    });

    const okRes = await fetch(`${baseUrl}/api/public/menu?slug=quan-la`);
    assert.equal(okRes.status, 200);
    const okData = await okRes.json();
    assert.equal(okData.menu.brandName, 'Quán Trà LÁ');
    assert.equal(okData.menu.items[0].id, 'item-oolong');

    const offRes = await fetch(`${baseUrl}/api/public/menu?slug=menu-tat`);
    assert.equal(offRes.status, 404);

    // Submit order from QR Menu with branch & table params
    const ordRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'order',
        clientSlug: 'quan-la',
        branch: 'chi-nhanh-q1',
        table: 'ban-08',
        productId: 'item-oolong',
        productName: '[Menu QR] Trà Sữa Oolong Kem Cheese',
        unitPrice: '72.000đ',
        quantity: 2,
        totalDisplay: '144.000đ',
        customerName: 'Khách ban-08',
        phone: '0909111222',
        note: 'Size L, Kem Cheese',
      }),
    });
    assert.equal(ordRes.status, 200);

    const listOrdRes = await fetch(`${baseUrl}/api/orders?slug=quan-la`, {
      headers: { Cookie: adminCookie },
    });
    const listOrd = await listOrdRes.json();
    assert.equal(listOrd.orders[0].branch, 'chi-nhanh-q1');
    assert.equal(listOrd.orders[0].table, 'ban-08');

    // QR generation with branch & table params
    const qrUrl = `${baseUrl}/menu/quan-la?qr=1&branch=chi-nhanh-q1&table=ban-08`;
    const png = await QRCode.toDataURL(qrUrl, { width: 256 });
    const svg = await QRCode.toString(qrUrl, { type: 'svg', width: 256 });
    assert.ok(png.startsWith('data:image/png;base64,'));
    assert.ok(svg.includes('<svg') && svg.includes('</svg>'));
  });

  it('protects /api/themes with admin auth and persists custom themes', async () => {
    const unauthGet = await fetch(`${baseUrl}/api/themes`);
    assert.equal(unauthGet.status, 401);

    const unauthPut = await fetch(`${baseUrl}/api/themes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themes: [] }),
    });
    assert.equal(unauthPut.status, 401);

    const customTheme = {
      id: 'theme-cafe-warm',
      name: 'Café Rang Mộc',
      createdAt: new Date().toISOString(),
      theme: {
        presetId: 'custom',
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
        typography: {
          headingFont: 'Lora',
          bodyFont: 'Be Vietnam Pro',
          scale: 'standard',
          fontSize: 'md',
        },
        shape: { radius: 'rounded', buttonStyle: 'solid', cardStyle: 'bordered' },
        spacing: 'standard',
      },
    };

    const putRes = await fetch(`${baseUrl}/api/themes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ themes: [customTheme] }),
    });
    assert.equal(putRes.status, 200);

    const getRes = await fetch(`${baseUrl}/api/themes`, { headers: { Cookie: adminCookie } });
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.equal(getData.themes.length, 1);
    assert.equal(getData.themes[0].name, 'Café Rang Mộc');
    assert.equal(getData.themes[0].theme.colors.secondary, '#D97706');
  });
});

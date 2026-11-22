import fs from 'node:fs';
import path from 'node:path';

const MAX_BODY_BYTES = 15 * 1024 * 1024;

export function sanitizeSlug(raw) {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned || cleaned.length > 60 || !/^[a-z0-9-]+$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

export function resolveSafeChild(baseDir, ...segments) {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, ...segments);
  if (target !== base && !target.startsWith(base + path.sep)) {
    throw new Error('Đường dẫn không hợp lệ.');
  }
  return target;
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;

    req.on('data', (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_BODY_BYTES) {
        reject(new Error('Dữ liệu vượt quá giới hạn 15MB.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Payload JSON không hợp lệ.'));
      }
    });

    req.on('error', reject);
  });
}

async function readJsonFile(filePath, fallback) {
  try {
    const raw = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath, data) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export async function handleApiRequest(req, res, options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const urlObj = new URL(req.url || '/', 'http://localhost');
  const pathname = urlObj.pathname;

  if (!pathname.startsWith('/api/')) {
    return false;
  }

  const publicDir = path.resolve(rootDir, 'public');
  const dataDir = path.resolve(rootDir, 'data');

  try {
    if (pathname === '/api/health' && req.method === 'GET') {
      sendJson(res, 200, {
        ok: true,
        service: 'specpage-studio',
        time: new Date().toISOString(),
      });
      return true;
    }

    if (pathname === '/api/clients' && req.method === 'GET') {
      const clientsRoot = path.join(publicDir, 'clients');
      let items = [];
      try {
        const entries = await fs.promises.readdir(clientsRoot, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          const slug = sanitizeSlug(entry.name);
          if (!slug) continue;
          const specPath = path.join(clientsRoot, slug, 'spec.json');
          const specData = await readJsonFile(specPath, null);
          items.push({
            slug,
            title: specData?.meta?.title || slug,
            updatedAt: specData?.updatedAt || null,
            url: `/clients/${slug}/index.html`,
            specUrl: `/clients/${slug}/spec.json`,
          });
        }
      } catch {
        items = [];
      }
      sendJson(res, 200, { ok: true, clients: items });
      return true;
    }

    if (pathname === '/api/publish' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!body || typeof body.html !== 'string' || !body.spec || typeof body.spec !== 'object') {
        sendJson(res, 400, { ok: false, error: 'Thiếu trường spec hoặc html hợp lệ.' });
        return true;
      }

      await fs.promises.mkdir(publicDir, { recursive: true });
      await Promise.all([
        fs.promises.writeFile(path.join(publicDir, 'site.html'), body.html, 'utf8'),
        writeJsonFile(path.join(publicDir, 'published-spec.json'), body.spec),
      ]);

      let clientUrl;
      const slug = body.slug ? sanitizeSlug(body.slug) : null;
      if (body.slug && !slug) {
        sendJson(res, 400, { ok: false, error: 'Slug khách hàng chỉ được chứa a-z, 0-9 và dấu -.' });
        return true;
      }

      if (slug) {
        const clientDir = resolveSafeChild(publicDir, 'clients', slug);
        await fs.promises.mkdir(clientDir, { recursive: true });
        await Promise.all([
          fs.promises.writeFile(path.join(clientDir, 'index.html'), body.html, 'utf8'),
          writeJsonFile(path.join(clientDir, 'spec.json'), body.spec),
        ]);
        clientUrl = `/clients/${slug}/index.html`;
      }

      sendJson(res, 200, {
        ok: true,
        siteUrl: '/site.html',
        specUrl: '/published-spec.json',
        clientUrl,
      });
      return true;
    }

    if (pathname === '/api/feedback') {
      const feedbackPath = path.join(dataDir, 'feedback.json');
      if (req.method === 'GET') {
        const all = await readJsonFile(feedbackPath, []);
        const slugParam = urlObj.searchParams.get('slug');
        const items = slugParam
          ? all.filter((f) => f.clientSlug === slugParam)
          : all;
        sendJson(res, 200, { ok: true, items });
        return true;
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        if (!body || typeof body.comment !== 'string' || !body.comment.trim()) {
          sendJson(res, 400, { ok: false, error: 'Thiếu nội dung góp ý.' });
          return true;
        }
        const entry = {
          id: typeof body.id === 'string' ? body.id : `fb-${Date.now().toString(36)}`,
          createdAt: typeof body.createdAt === 'string' ? body.createdAt : new Date().toISOString(),
          clientSlug: sanitizeSlug(body.clientSlug) || 'du-an-mau',
          author: String(body.author || 'Khách hàng').slice(0, 80),
          sectionLabel: String(body.sectionLabel || 'Tổng thể trang').slice(0, 80),
          comment: body.comment.trim().slice(0, 1200),
          type: body.type === 'approved' ? 'approved' : 'feedback',
          resolved: false,
        };
        const current = await readJsonFile(feedbackPath, []);
        const next = [entry, ...(Array.isArray(current) ? current : [])].slice(0, 300);
        await writeJsonFile(feedbackPath, next);
        sendJson(res, 200, { ok: true, item: entry });
        return true;
      }
    }

    if (pathname === '/api/orders') {
      const ordersPath = path.join(dataDir, 'orders.json');
      if (req.method === 'GET') {
        const data = await readJsonFile(ordersPath, { orders: [], leads: [] });
        const slugParam = urlObj.searchParams.get('slug');
        if (slugParam) {
          sendJson(res, 200, {
            ok: true,
            orders: (data.orders || []).filter((o) => o.clientSlug === slugParam),
            leads: (data.leads || []).filter((l) => l.clientSlug === slugParam),
          });
        } else {
          sendJson(res, 200, { ok: true, orders: data.orders || [], leads: data.leads || [] });
        }
        return true;
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        const current = await readJsonFile(ordersPath, { orders: [], leads: [] });
        const orders = Array.isArray(current.orders) ? current.orders : [];
        const leads = Array.isArray(current.leads) ? current.leads : [];

        if (body.kind === 'lead') {
          const lead = {
            id: typeof body.id === 'string' ? body.id : `lead-${Date.now().toString(36)}`,
            createdAt: typeof body.createdAt === 'string' ? body.createdAt : new Date().toISOString(),
            clientSlug: sanitizeSlug(body.clientSlug) || undefined,
            name: String(body.name || '').slice(0, 120),
            phone: String(body.phone || '').slice(0, 40),
            email: String(body.email || '').slice(0, 120),
            message: String(body.message || '').slice(0, 1500),
          };
          await writeJsonFile(ordersPath, {
            orders,
            leads: [lead, ...leads].slice(0, 300),
          });
        } else {
          const order = {
            id: typeof body.id === 'string' ? body.id : `ord-${Date.now().toString(36)}`,
            createdAt: typeof body.createdAt === 'string' ? body.createdAt : new Date().toISOString(),
            clientSlug: sanitizeSlug(body.clientSlug) || undefined,
            productId: String(body.productId || ''),
            productName: String(body.productName || 'Sản phẩm').slice(0, 160),
            unitPrice: String(body.unitPrice || ''),
            quantity: Math.max(1, Math.min(999, Number(body.quantity) || 1)),
            totalDisplay: String(body.totalDisplay || ''),
            customerName: String(body.customerName || '').slice(0, 120),
            phone: String(body.phone || '').slice(0, 40),
            email: String(body.email || '').slice(0, 120),
            note: String(body.note || '').slice(0, 1000),
          };
          await writeJsonFile(ordersPath, {
            orders: [order, ...orders].slice(0, 300),
            leads,
          });
        }

        sendJson(res, 200, { ok: true });
        return true;
      }
    }

    sendJson(res, 404, { ok: false, error: 'API endpoint không tồn tại.' });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ nội bộ.';
    sendJson(res, 500, { ok: false, error: message });
    return true;
  }
}

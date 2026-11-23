import {
  applySecurityHeaders,
  changeAdminPassword,
  checkRateLimit,
  clearSessionCookie,
  createSessionCookie,
  getAuthState,
  isRequestAuthenticated,
  setupFirstAdminPassword,
  verifyAdminPassword,
} from './server-auth.mjs';
import {
  getPublicSiteSpec,
  getPublishedSite,
  getStorageMode,
  listPublishedSites,
  sanitizeSlug,
  savePublishedSite,
  storeGet,
  storeSet,
} from './server-store.mjs';

const MAX_ADMIN_BODY_BYTES = 15 * 1024 * 1024;
const MAX_PUBLIC_BODY_BYTES = 64 * 1024;

function sendJson(res, statusCode, payload, req = null) {
  if (req) applySecurityHeaders(res, req);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function readJsonBody(req, maxBytes = MAX_ADMIN_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;

    req.on('data', (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        reject(Object.assign(new Error('Dữ liệu gửi lên vượt quá giới hạn cho phép.'), { statusCode: 413 }));
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
        reject(Object.assign(new Error('Payload JSON không hợp lệ.'), { statusCode: 400 }));
      }
    });

    req.on('error', reject);
  });
}

function enforceRateLimit(req, res, bucket, limit, windowMs) {
  const result = checkRateLimit(req, bucket, limit, windowMs);
  if (!result.allowed) {
    res.setHeader('Retry-After', String(result.retryAfterSec));
    sendJson(
      res,
      429,
      {
        ok: false,
        error: `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${result.retryAfterSec} giây.`,
      },
      req
    );
    return false;
  }
  return true;
}

async function requireAdmin(req, res, rootDir) {
  const authed = await isRequestAuthenticated(req, rootDir);
  if (!authed) {
    sendJson(res, 401, { ok: false, error: 'Phiên đăng nhập hết hạn hoặc chưa đăng nhập.' }, req);
    return false;
  }
  return enforceRateLimit(req, res, 'admin-api', 120, 60 * 1000);
}

export async function handlePublishedAssetRequest(req, res, rootDir = process.cwd()) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return false;
  }

  const urlObj = new URL(req.url || '/', 'http://localhost');
  const pathname = decodeURIComponent(urlObj.pathname);

  let slug = null;
  let kind = null; // 'html' | 'spec'

  if (pathname === '/site.html') {
    kind = 'html';
  } else if (pathname === '/published-spec.json') {
    kind = 'spec';
  } else {
    const clientHtmlMatch = pathname.match(/^\/clients\/([a-z0-9-]+)(?:\/|\/index\.html)?$/);
    const clientSpecMatch = pathname.match(/^\/clients\/([a-z0-9-]+)\/spec\.json$/);
    if (clientHtmlMatch) {
      slug = sanitizeSlug(clientHtmlMatch[1]);
      kind = 'html';
    } else if (clientSpecMatch) {
      slug = sanitizeSlug(clientSpecMatch[1]);
      kind = 'spec';
    }
  }

  if (!kind) return false;

  const site = await getPublishedSite(slug, rootDir);
  if (!site) return false;

  applySecurityHeaders(res, req);
  res.statusCode = 200;
  res.setHeader('Cache-Control', 'no-cache');

  if (kind === 'spec') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(req.method === 'HEAD' ? '' : JSON.stringify(site.spec, null, 2));
  } else {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(req.method === 'HEAD' ? '' : site.html);
  }
  return true;
}

export async function handleApiRequest(req, res, options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const urlObj = new URL(req.url || '/', 'http://localhost');
  const pathname = urlObj.pathname;

  if (!pathname.startsWith('/api/')) {
    return false;
  }

  applySecurityHeaders(res, req);

  try {
    // 1. Health Check & Public Live Spec (Public, read-only)
    if (pathname === '/api/health' && req.method === 'GET') {
      const state = await getAuthState(rootDir);
      sendJson(res, 200, {
        ok: true,
        service: 'specpage-studio',
        storageMode: getStorageMode(),
        authConfigured: state.configured,
        time: new Date().toISOString(),
      });
      return true;
    }

    if (pathname === '/api/public/site' && req.method === 'GET') {
      const slugParam = urlObj.searchParams.get('slug');
      const result = await getPublicSiteSpec(slugParam || null, rootDir);
      if (!result) {
        sendJson(res, 404, { ok: false, error: 'Chưa có trang web nào được lưu.' });
        return true;
      }
      sendJson(res, 200, {
        ok: true,
        slug: result.slug,
        projectName: result.projectName,
        spec: result.spec,
      });
      return true;
    }

    // 2. Auth Status / Setup / Login / Logout / Change Password
    if (pathname === '/api/auth/status' && req.method === 'GET') {
      const state = await getAuthState(rootDir);
      const authenticated = await isRequestAuthenticated(req, rootDir);
      sendJson(res, 200, {
        ok: true,
        configured: state.configured,
        envManaged: state.envManaged,
        authenticated,
        storageMode: getStorageMode(),
      });
      return true;
    }

    if (pathname === '/api/auth/setup' && req.method === 'POST') {
      if (!enforceRateLimit(req, res, 'auth-login', 10, 15 * 60 * 1000)) return true;
      const body = await readJsonBody(req, MAX_PUBLIC_BODY_BYTES);
      const result = await setupFirstAdminPassword(body.password, rootDir);
      if (!result.ok) {
        sendJson(res, result.status || 400, { ok: false, error: result.error });
        return true;
      }
      const cookie = await createSessionCookie(req, body.rememberMe !== false, rootDir);
      res.setHeader('Set-Cookie', cookie);
      sendJson(res, 200, { ok: true, configured: true, authenticated: true });
      return true;
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
      if (!enforceRateLimit(req, res, 'auth-login', 10, 15 * 60 * 1000)) return true;
      const state = await getAuthState(rootDir);
      if (!state.configured) {
        sendJson(res, 400, {
          ok: false,
          error: 'Chưa thiết lập mật khẩu quản trị. Hãy tạo mật khẩu lần đầu.',
        });
        return true;
      }
      const body = await readJsonBody(req, MAX_PUBLIC_BODY_BYTES);
      const valid = await verifyAdminPassword(body.password, rootDir);
      if (!valid) {
        sendJson(res, 401, { ok: false, error: 'Mật khẩu quản trị không đúng.' });
        return true;
      }
      const cookie = await createSessionCookie(req, body.rememberMe !== false, rootDir);
      res.setHeader('Set-Cookie', cookie);
      sendJson(res, 200, { ok: true, authenticated: true });
      return true;
    }

    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      res.setHeader('Set-Cookie', clearSessionCookie(req));
      sendJson(res, 200, { ok: true });
      return true;
    }

    if (pathname === '/api/auth/change-password' && req.method === 'POST') {
      if (!(await requireAdmin(req, res, rootDir))) return true;
      const body = await readJsonBody(req, MAX_PUBLIC_BODY_BYTES);
      const result = await changeAdminPassword(body.currentPassword, body.nextPassword, rootDir);
      if (!result.ok) {
        sendJson(res, result.status || 400, { ok: false, error: result.error });
        return true;
      }
      sendJson(res, 200, { ok: true });
      return true;
    }

    // 3. Projects Sync (Admin Only)
    if (pathname === '/api/projects') {
      if (!(await requireAdmin(req, res, rootDir))) return true;

      if (req.method === 'GET') {
        const stored = await storeGet('projects', null, rootDir);
        sendJson(res, 200, {
          ok: true,
          storageMode: getStorageMode(),
          projects: Array.isArray(stored?.projects) ? stored.projects : null,
          activeProjectId: typeof stored?.activeProjectId === 'string' ? stored.activeProjectId : null,
          updatedAt: stored?.updatedAt || null,
        });
        return true;
      }

      if (req.method === 'PUT') {
        const body = await readJsonBody(req, MAX_ADMIN_BODY_BYTES);
        if (!body || !Array.isArray(body.projects) || typeof body.activeProjectId !== 'string') {
          sendJson(res, 400, { ok: false, error: 'Dữ liệu dự án không hợp lệ.' });
          return true;
        }
        const payload = {
          projects: body.projects,
          activeProjectId: body.activeProjectId,
          updatedAt: new Date().toISOString(),
        };
        await storeSet('projects', payload, rootDir);
        sendJson(res, 200, {
          ok: true,
          storageMode: getStorageMode(),
          updatedAt: payload.updatedAt,
        });
        return true;
      }
    }

    // 4. Published Clients & Publish (Admin Only)
    if (pathname === '/api/clients' && req.method === 'GET') {
      if (!(await requireAdmin(req, res, rootDir))) return true;
      const clients = await listPublishedSites(rootDir);
      sendJson(res, 200, { ok: true, clients });
      return true;
    }

    if (pathname === '/api/publish' && req.method === 'POST') {
      if (!(await requireAdmin(req, res, rootDir))) return true;
      const body = await readJsonBody(req, MAX_ADMIN_BODY_BYTES);
      if (!body || typeof body.html !== 'string' || !body.spec || typeof body.spec !== 'object') {
        sendJson(res, 400, { ok: false, error: 'Thiếu trường spec hoặc html hợp lệ.' });
        return true;
      }
      if (body.slug && !sanitizeSlug(body.slug)) {
        sendJson(res, 400, { ok: false, error: 'Slug khách hàng chỉ được chứa a-z, 0-9 và dấu -.' });
        return true;
      }

      const result = await savePublishedSite(body.slug || null, body.spec, body.html, rootDir);
      sendJson(res, 200, {
        ok: true,
        storageMode: getStorageMode(),
        ...result,
      });
      return true;
    }

    // 5. Client Feedback (POST is public & rate-limited for clients; GET is Admin Only)
    if (pathname === '/api/feedback') {
      if (req.method === 'GET') {
        if (!(await requireAdmin(req, res, rootDir))) return true;
        const all = (await storeGet('feedback', [], rootDir)) || [];
        const slugParam = urlObj.searchParams.get('slug');
        const items = slugParam
          ? all.filter((f) => f.clientSlug === slugParam)
          : all;
        sendJson(res, 200, { ok: true, items });
        return true;
      }

      if (req.method === 'POST') {
        if (!enforceRateLimit(req, res, 'public-submit', 20, 10 * 60 * 1000)) return true;
        const body = await readJsonBody(req, MAX_PUBLIC_BODY_BYTES);
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
        const current = (await storeGet('feedback', [], rootDir)) || [];
        const next = [entry, ...(Array.isArray(current) ? current : [])].slice(0, 300);
        await storeSet('feedback', next, rootDir);
        sendJson(res, 200, { ok: true, item: entry });
        return true;
      }
    }

    // 6. Customer Orders & Leads (POST is public & rate-limited for shoppers; GET/DELETE are Admin Only)
    if (pathname === '/api/orders') {
      if (req.method === 'GET') {
        if (!(await requireAdmin(req, res, rootDir))) return true;
        const data = (await storeGet('orders', { orders: [], leads: [] }, rootDir)) || {
          orders: [],
          leads: [],
        };
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

      if (req.method === 'DELETE') {
        if (!(await requireAdmin(req, res, rootDir))) return true;
        await storeSet('orders', { orders: [], leads: [] }, rootDir);
        sendJson(res, 200, { ok: true });
        return true;
      }

      if (req.method === 'POST') {
        if (!enforceRateLimit(req, res, 'public-submit', 20, 10 * 60 * 1000)) return true;
        const body = await readJsonBody(req, MAX_PUBLIC_BODY_BYTES);
        const current = (await storeGet('orders', { orders: [], leads: [] }, rootDir)) || {
          orders: [],
          leads: [],
        };
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
          await storeSet('orders', {
            orders,
            leads: [lead, ...leads].slice(0, 300),
          }, rootDir);
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
          await storeSet('orders', {
            orders: [order, ...orders].slice(0, 300),
            leads,
          }, rootDir);
        }

        sendJson(res, 200, { ok: true });
        return true;
      }
    }

    sendJson(res, 404, { ok: false, error: 'API endpoint không tồn tại.' });
    return true;
  } catch (err) {
    const status = err && typeof err === 'object' && 'statusCode' in err ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ nội bộ.';
    sendJson(res, status, { ok: false, error: message });
    return true;
  }
}

import { extractLearnedRuleFromFeedback, generateAiContent, getAiConfigFromEnv } from './server-ai.mjs';
import {
  appendLearnedRule,
  appendOptimizationLog,
  getProjectAiMemory,
  saveProjectAiMemory,
} from './server-ai-memory.mjs';
import { queryAnalytics, trackAnalyticsEvent } from './server-analytics.mjs';
import {
  applySecurityHeaders,
  changeAdminPassword,
  checkRateLimit,
  clearSessionCookie,
  createSessionCookie,
  generateReviewToken,
  getAuthState,
  isRequestAuthenticated,
  safeEqualStrings,
  setupFirstAdminPassword,
  verifyAdminPassword,
  verifySameOrigin,
} from './server-auth.mjs';
import {
  KV_KEYS,
  backupStoreSnapshot,
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
const MAX_VERSIONS_PER_SLUG = 30;

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

function enforceSameOrigin(req, res) {
  if (!verifySameOrigin(req)) {
    sendJson(
      res,
      403,
      { ok: false, error: 'Yêu cầu bị từ chối do Origin không hợp lệ (CSRF guard).' },
      req
    );
    return false;
  }
  return true;
}

async function requireAdmin(req, res, rootDir) {
  if (!enforceSameOrigin(req, res)) return false;
  const authed = await isRequestAuthenticated(req, rootDir);
  if (!authed) {
    sendJson(res, 401, { ok: false, error: 'Phiên đăng nhập hết hạn hoặc chưa đăng nhập.' }, req);
    return false;
  }
  return enforceRateLimit(req, res, 'admin-api', 180, 60 * 1000);
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function handleSeoDiscoveryRequest(req, res, rootDir = process.cwd()) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return false;
  }
  const urlObj = new URL(req.url || '/', 'http://localhost');
  const pathname = urlObj.pathname;
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const proto = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const baseUrl = `${proto}://${host}`;

  if (pathname === '/robots.txt') {
    applySecurityHeaders(res, req);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    const body = [
      'User-agent: *',
      'Allow: /',
      'Allow: /clients/',
      'Allow: /menu/',
      'Disallow: /api/',
      `Sitemap: ${baseUrl}/sitemap.xml`,
    ].join('\n');
    res.end(req.method === 'HEAD' ? '' : body);
    return true;
  }

  if (pathname === '/sitemap.xml') {
    applySecurityHeaders(res, req);
    const [clients, projectsData] = await Promise.all([
      listPublishedSites(rootDir),
      storeGet('projects', null, rootDir),
    ]);

    const urls = new Map();
    urls.set(`${baseUrl}/site.html`, new Date().toISOString());

    for (const c of clients) {
      if (c?.slug) {
        urls.set(`${baseUrl}/clients/${encodeURIComponent(c.slug)}/index.html`, c.updatedAt || new Date().toISOString());
      }
    }

    if (projectsData && Array.isArray(projectsData.projects)) {
      for (const proj of projectsData.projects) {
        if (!proj?.slug) continue;
        if (proj.spec?.meta?.robotsNoIndex) continue;
        if (proj.status === 'published') {
          urls.set(`${baseUrl}/?mode=live&slug=${encodeURIComponent(proj.slug)}`, proj.updatedAt || new Date().toISOString());
        }
        if (proj.spec?.digitalMenu?.enabled) {
          urls.set(`${baseUrl}/menu/${encodeURIComponent(proj.slug)}`, proj.updatedAt || new Date().toISOString());
        }
      }
    }

    const entriesXml = Array.from(urls.entries())
      .map(
        ([loc, lastmod]) =>
          `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${escapeXml(String(lastmod).slice(0, 10))}</lastmod>\n  </url>`
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entriesXml}\n</urlset>\n`;
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(req.method === 'HEAD' ? '' : xml);
    return true;
  }

  return false;
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

async function saveVersionSnapshot({ slug, label, scope, spec, actor }, rootDir) {
  const safeSlug = sanitizeSlug(slug) || 'du-an-mau';
  const key = `versions:${safeSlug}`;
  const existing = (await storeGet(key, [], rootDir)) || [];
  const entry = {
    id: `ver-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    slug: safeSlug,
    createdAt: new Date().toISOString(),
    actor: String(actor || 'Admin').slice(0, 60),
    label: String(label || 'Bản lưu tự động').slice(0, 120),
    scope: scope === 'menu' || scope === 'both' ? scope : 'landing',
    spec,
  };
  const next = [entry, ...(Array.isArray(existing) ? existing : [])].slice(0, MAX_VERSIONS_PER_SLUG);
  await storeSet(key, next, rootDir);
  return entry;
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
    // 1. Health Check & Public Live Spec & Public Digital Menu
    if (pathname === '/api/health' && req.method === 'GET') {
      const state = await getAuthState(rootDir);
      sendJson(res, 200, {
        ok: true,
        service: 'specpage-studio',
        storageMode: getStorageMode(),
        authConfigured: state.configured,
        aiConfigured: getAiConfigFromEnv().configured,
        time: new Date().toISOString(),
      });
      return true;
    }

    if (pathname === '/api/public/site' && req.method === 'GET') {
      const slugParam = urlObj.searchParams.get('slug');
      const authedAdmin = await isRequestAuthenticated(req, rootDir);
      const result = await getPublicSiteSpec(slugParam || null, rootDir, {
        mode: 'live',
        isAdmin: authedAdmin,
        allowDraftFallback: authedAdmin,
      });
      if (!result) {
        sendJson(res, 404, { ok: false, error: 'Chưa có trang web nào được lưu.' });
        return true;
      }
      sendJson(res, 200, {
        ok: true,
        slug: result.slug,
        projectName: result.projectName,
        isDraft: result.isDraft,
        status: result.status,
        spec: result.spec,
      });
      return true;
    }

    if (pathname === '/api/public/menu' && req.method === 'GET') {
      const slugParam = urlObj.searchParams.get('slug');
      const safeSlug = slugParam ? sanitizeSlug(slugParam) : null;
      const projectsData = await storeGet('projects', null, rootDir);

      let matched = null;
      if (projectsData && Array.isArray(projectsData.projects)) {
        matched = safeSlug
          ? projectsData.projects.find((p) => p && p.slug === safeSlug)
          : projectsData.projects.find((p) => p && p.id === projectsData.activeProjectId) ||
            projectsData.projects[0];
      }

      let spec = matched?.spec;
      let resolvedSlug = matched?.slug || safeSlug || 'du-an-mau';
      let projectName = matched?.projectName || '';

      if (!spec?.digitalMenu) {
        const published = await getPublishedSite(safeSlug, rootDir);
        if (published?.spec?.digitalMenu) {
          spec = published.spec;
          resolvedSlug = safeSlug || published.slug || 'du-an-mau';
          projectName = published.spec.meta?.title || resolvedSlug;
        }
      }

      if (!spec?.digitalMenu || !spec.digitalMenu.enabled) {
        sendJson(res, 404, { ok: false, error: 'Thực đơn điện tử chưa được kích hoạt hoặc không tồn tại.' });
        return true;
      }

      sendJson(res, 200, {
        ok: true,
        slug: resolvedSlug,
        projectName: projectName || spec.digitalMenu.brandName,
        menu: spec.digitalMenu,
        meta: spec.meta,
      });
      return true;
    }

    if (pathname === '/api/public/review' && req.method === 'GET') {
      const slugParam = sanitizeSlug(urlObj.searchParams.get('slug') || '');
      const tokenParam = (urlObj.searchParams.get('token') || '').trim();
      if (!slugParam) {
        sendJson(res, 400, { ok: false, error: 'Thiếu slug dự án hợp lệ.' });
        return true;
      }

      const authedAdmin = await isRequestAuthenticated(req, rootDir);
      const match = await getPublicSiteSpec(slugParam, rootDir, {
        mode: 'review',
        reviewToken: tokenParam,
        isAdmin: authedAdmin,
      });

      if (!match) {
        sendJson(res, 404, { ok: false, error: 'Không tìm thấy dự án để duyệt.' });
        return true;
      }

      if ('unauthorized' in match && match.unauthorized) {
        sendJson(res, 403, {
          ok: false,
          error: match.reason || 'Link xem trước yêu cầu mã xác thực (review token) hợp lệ.',
        });
        return true;
      }

      const allFeedback = (await storeGet('feedback', [], rootDir)) || [];
      const history = Array.isArray(allFeedback)
        ? allFeedback.filter((f) => f.clientSlug === slugParam).slice(0, 50)
        : [];

      sendJson(res, 200, {
        ok: true,
        slug: match.slug,
        projectName: match.projectName,
        clientName: match.clientName || '',
        status: match.status,
        publishedUrl: match.publishedUrl || null,
        spec: match.spec,
        feedbackHistory: history,
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
      if (!enforceSameOrigin(req, res)) return true;
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
      if (!enforceSameOrigin(req, res)) return true;
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
      if (!enforceSameOrigin(req, res)) return true;
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
        const projects = Array.isArray(stored?.projects)
          ? stored.projects.map((p) => (p && !p.reviewToken ? { ...p, reviewToken: generateReviewToken() } : p))
          : null;
        sendJson(res, 200, {
          ok: true,
          storageMode: getStorageMode(),
          projects,
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
        const normalizedProjects = body.projects.map((p) =>
          p && typeof p === 'object' && !p.reviewToken ? { ...p, reviewToken: generateReviewToken() } : p
        );
        const payload = {
          projects: normalizedProjects,
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

    // 4. Custom Saved Themes (Admin Only)
    if (pathname === '/api/themes') {
      if (!(await requireAdmin(req, res, rootDir))) return true;

      if (req.method === 'GET') {
        const themes =
          (await storeGet(KV_KEYS.CUSTOM_THEMES, null, rootDir)) ??
          (await storeGet('custom_themes', [], rootDir));
        sendJson(res, 200, { ok: true, themes: Array.isArray(themes) ? themes : [] });
        return true;
      }

      if (req.method === 'PUT') {
        const body = await readJsonBody(req, MAX_ADMIN_BODY_BYTES);
        if (!body || !Array.isArray(body.themes)) {
          sendJson(res, 400, { ok: false, error: 'Danh sách theme không hợp lệ.' });
          return true;
        }
        const trimmed = body.themes.slice(0, 50);
        await storeSet(KV_KEYS.CUSTOM_THEMES, trimmed, rootDir);
        sendJson(res, 200, { ok: true, themes: trimmed });
        return true;
      }
    }

    // 5. Version History (Admin Only)
    if (pathname === '/api/versions') {
      if (!(await requireAdmin(req, res, rootDir))) return true;
      const slugParam = sanitizeSlug(urlObj.searchParams.get('slug') || '') || 'du-an-mau';

      if (req.method === 'GET') {
        const list = (await storeGet(`versions:${slugParam}`, [], rootDir)) || [];
        sendJson(res, 200, {
          ok: true,
          slug: slugParam,
          versions: Array.isArray(list) ? list : [],
        });
        return true;
      }

      if (req.method === 'POST') {
        const body = await readJsonBody(req, MAX_ADMIN_BODY_BYTES);
        if (!body || !body.spec || typeof body.spec !== 'object') {
          sendJson(res, 400, { ok: false, error: 'Thiếu dữ liệu spec để lưu phiên bản.' });
          return true;
        }
        const version = await saveVersionSnapshot(
          {
            slug: body.slug || slugParam,
            label: body.label || 'Lưu thủ công',
            scope: body.scope || 'both',
            spec: body.spec,
            actor: body.actor || 'Admin',
          },
          rootDir
        );
        sendJson(res, 200, { ok: true, version });
        return true;
      }
    }

    if (pathname === '/api/versions/restore' && req.method === 'POST') {
      if (!(await requireAdmin(req, res, rootDir))) return true;
      const body = await readJsonBody(req, MAX_ADMIN_BODY_BYTES);
      const safeSlug = sanitizeSlug(body?.slug || '') || 'du-an-mau';
      const versionId = String(body?.versionId || '');
      if (!versionId) {
        sendJson(res, 400, { ok: false, error: 'Thiếu mã phiên bản cần khôi phục.' });
        return true;
      }

      const list = (await storeGet(`versions:${safeSlug}`, [], rootDir)) || [];
      const target = Array.isArray(list) ? list.find((v) => v.id === versionId) : null;
      if (!target || !target.spec) {
        sendJson(res, 404, { ok: false, error: 'Không tìm thấy phiên bản này.' });
        return true;
      }

      // Backup current state before restoring
      await backupStoreSnapshot(`pre-restore-${safeSlug}`, rootDir);
      const projectsData = await storeGet('projects', null, rootDir);
      if (projectsData && Array.isArray(projectsData.projects)) {
        const currentProj = projectsData.projects.find((p) => p && p.slug === safeSlug);
        if (currentProj?.spec) {
          await saveVersionSnapshot(
            {
              slug: safeSlug,
              label: 'Sao lưu tự động trước khi khôi phục',
              scope: 'both',
              spec: currentProj.spec,
              actor: 'Hệ thống',
            },
            rootDir
          );
        }

        const updatedProjects = projectsData.projects.map((p) =>
          p && p.slug === safeSlug
            ? { ...p, spec: target.spec, updatedAt: new Date().toISOString() }
            : p
        );
        await storeSet(
          'projects',
          {
            projects: updatedProjects,
            activeProjectId: projectsData.activeProjectId,
            updatedAt: new Date().toISOString(),
          },
          rootDir
        );
      }

      sendJson(res, 200, { ok: true, restored: target });
      return true;
    }

    // 6. Published Clients & Publish (Admin Only)
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
      await saveVersionSnapshot(
        {
          slug: body.slug || 'du-an-mau',
          label: 'Xuất bản Production',
          scope: 'both',
          spec: body.spec,
          actor: 'Admin',
        },
        rootDir
      );
      sendJson(res, 200, {
        ok: true,
        storageMode: getStorageMode(),
        ...result,
      });
      return true;
    }

    // 7. Server-Side AI Proxy (Admin Only)
    if (pathname === '/api/ai/status' && req.method === 'GET') {
      if (!(await requireAdmin(req, res, rootDir))) return true;
      const cfg = getAiConfigFromEnv();
      sendJson(res, 200, {
        ok: true,
        configured: cfg.configured,
        provider: cfg.provider,
        model: cfg.model,
      });
      return true;
    }

    if (pathname === '/api/ai/generate' && req.method === 'POST') {
      if (!(await requireAdmin(req, res, rootDir))) return true;
      if (!enforceRateLimit(req, res, 'ai-api', 30, 10 * 60 * 1000)) return true;
      const body = await readJsonBody(req, MAX_ADMIN_BODY_BYTES);
      const result = await generateAiContent(body, { rootDir });
      sendJson(res, 200, result);
      return true;
    }

    if (pathname === '/api/ai/memory') {
      if (!(await requireAdmin(req, res, rootDir))) return true;

      if (req.method === 'GET') {
        const projectId = urlObj.searchParams.get('projectId') || 'default';
        const memory = await getProjectAiMemory(projectId, rootDir);
        sendJson(res, 200, { ok: true, projectId, memory });
        return true;
      }

      if (req.method === 'PUT') {
        const body = await readJsonBody(req, MAX_PUBLIC_BODY_BYTES);
        const projectId = String(body?.projectId || 'default');
        const memory = await saveProjectAiMemory(
          projectId,
          {
            brandProfile: body?.brandProfile,
            learnedRules: body?.learnedRules,
            optimizationLog: body?.optimizationLog,
          },
          rootDir
        );
        sendJson(res, 200, { ok: true, projectId, memory });
        return true;
      }
    }

    if (pathname === '/api/ai/feedback' && req.method === 'POST') {
      if (!(await requireAdmin(req, res, rootDir))) return true;
      if (!enforceRateLimit(req, res, 'ai-api', 60, 10 * 60 * 1000)) return true;

      const body = await readJsonBody(req, MAX_PUBLIC_BODY_BYTES);
      const projectId = String(body?.projectId || 'default');
      const taskType = String(body?.taskType || 'website_copy');
      const action =
        body?.action === 'edited' || body?.action === 'rejected' ? body.action : 'accepted';
      const topic = String(body?.topic || taskType).slice(0, 120);

      let memory = await appendOptimizationLog(
        projectId,
        {
          topic,
          status: action,
          note: body?.note || (action === 'accepted' ? 'Người dùng áp dụng trực tiếp' : ''),
        },
        rootDir
      );

      let learnedRule = '';
      if (action === 'edited' || action === 'rejected') {
        learnedRule = await extractLearnedRuleFromFeedback({
          taskType,
          aiOutput: body?.aiOutput || '',
          userFinalOutput: body?.userFinalOutput || '',
          action,
          note: body?.note || '',
          memory,
        });
        if (learnedRule) {
          const updated = await appendLearnedRule(projectId, learnedRule, rootDir);
          memory = updated.memory;
          learnedRule = updated.rule;
        }
      }

      sendJson(res, 200, { ok: true, projectId, action, learnedRule, memory });
      return true;
    }

    // 8. Client Feedback (POST is public/token-verified & rate-limited; GET/PATCH Admin Only)
    if (pathname === '/api/feedback') {
      if (req.method === 'GET') {
        if (!(await requireAdmin(req, res, rootDir))) return true;
        const all = (await storeGet('feedback', [], rootDir)) || [];
        const slugParam = urlObj.searchParams.get('slug');
        const items = slugParam ? all.filter((f) => f.clientSlug === slugParam) : all;
        sendJson(res, 200, { ok: true, items });
        return true;
      }

      if (req.method === 'PATCH') {
        if (!(await requireAdmin(req, res, rootDir))) return true;
        const body = await readJsonBody(req, MAX_PUBLIC_BODY_BYTES);
        const all = (await storeGet('feedback', [], rootDir)) || [];
        const next = (Array.isArray(all) ? all : []).map((item) =>
          item.id === body?.id ? { ...item, resolved: Boolean(body.resolved) } : item
        );
        await storeSet('feedback', next, rootDir);
        sendJson(res, 200, { ok: true, items: next });
        return true;
      }

      if (req.method === 'POST') {
        if (!enforceRateLimit(req, res, 'public-submit', 20, 10 * 60 * 1000)) return true;
        const body = await readJsonBody(req, MAX_PUBLIC_BODY_BYTES);
        if (!body || typeof body.comment !== 'string' || !body.comment.trim()) {
          sendJson(res, 400, { ok: false, error: 'Thiếu nội dung góp ý.' });
          return true;
        }

        const safeSlug = sanitizeSlug(body.clientSlug) || 'du-an-mau';
        const projectsData = await storeGet('projects', null, rootDir);
        const targetProj = Array.isArray(projectsData?.projects)
          ? projectsData.projects.find((p) => p && p.slug === safeSlug)
          : null;

        if (targetProj?.reviewToken && body.reviewToken) {
          if (!safeEqualStrings(String(body.reviewToken), targetProj.reviewToken)) {
            sendJson(res, 403, { ok: false, error: 'Mã duyệt mẫu (review token) không hợp lệ.' });
            return true;
          }
        } else if (targetProj?.reviewToken && !(await isRequestAuthenticated(req, rootDir))) {
          sendJson(res, 403, { ok: false, error: 'Thiếu mã xác thực duyệt mẫu.' });
          return true;
        }

        const feedbackType =
          body.type === 'approved'
            ? 'approved'
            : body.type === 'rejected'
              ? 'rejected'
              : 'feedback';

        const entry = {
          id: typeof body.id === 'string' ? body.id : `fb-${Date.now().toString(36)}`,
          createdAt: typeof body.createdAt === 'string' ? body.createdAt : new Date().toISOString(),
          clientSlug: safeSlug,
          author: String(body.author || 'Khách hàng').slice(0, 80),
          sectionLabel: String(body.sectionLabel || 'Tổng thể trang').slice(0, 80),
          comment: body.comment.trim().slice(0, 1200),
          type: feedbackType,
          resolved: false,
        };
        const current = (await storeGet('feedback', [], rootDir)) || [];
        const next = [entry, ...(Array.isArray(current) ? current : [])].slice(0, 300);
        await storeSet('feedback', next, rootDir);

        let updatedStatus = targetProj?.status;
        if (targetProj && (feedbackType === 'approved' || feedbackType === 'rejected')) {
          updatedStatus = feedbackType;
          const updatedProjects = projectsData.projects.map((p) =>
            p && p.slug === safeSlug
              ? { ...p, status: updatedStatus, updatedAt: new Date().toISOString() }
              : p
          );
          await storeSet(
            'projects',
            {
              projects: updatedProjects,
              activeProjectId: projectsData.activeProjectId,
              updatedAt: new Date().toISOString(),
            },
            rootDir
          );
        }

        sendJson(res, 200, { ok: true, item: entry, status: updatedStatus });
        return true;
      }
    }

    // 9. Customer Orders & Leads (POST is public & rate-limited for shoppers; GET/DELETE are Admin Only)
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
          await storeSet(
            'orders',
            {
              orders,
              leads: [lead, ...leads].slice(0, 300),
            },
            rootDir
          );
        } else {
          const order = {
            id: typeof body.id === 'string' ? body.id : `ord-${Date.now().toString(36)}`,
            createdAt: typeof body.createdAt === 'string' ? body.createdAt : new Date().toISOString(),
            clientSlug: sanitizeSlug(body.clientSlug) || undefined,
            branch: body.branch ? String(body.branch).slice(0, 60) : undefined,
            table: body.table ? String(body.table).slice(0, 60) : undefined,
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
          await storeSet(
            'orders',
            {
              orders: [order, ...orders].slice(0, 300),
              leads,
            },
            rootDir
          );
        }

        sendJson(res, 200, { ok: true });
        return true;
      }
    }

    // 10. Privacy-Friendly Analytics
    if (pathname === '/api/analytics/track' && req.method === 'POST') {
      if (!enforceRateLimit(req, res, 'analytics-track', 120, 10 * 60 * 1000)) return true;
      const body = await readJsonBody(req, MAX_PUBLIC_BODY_BYTES);
      const result = await trackAnalyticsEvent(req, body, rootDir);
      if (!result.ok) {
        sendJson(res, 400, result);
        return true;
      }
      sendJson(res, 200, { ok: true });
      return true;
    }

    if (pathname === '/api/analytics' && req.method === 'GET') {
      if (!(await requireAdmin(req, res, rootDir))) return true;
      const slugParam = urlObj.searchParams.get('slug') || 'du-an-mau';
      const daysParam = urlObj.searchParams.get('days') || '30';
      const report = await queryAnalytics({ slug: slugParam, daysCount: daysParam }, rootDir);
      sendJson(res, 200, { ok: true, ...report });
      return true;
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

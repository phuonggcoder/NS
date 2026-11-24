import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const KV_KEYS = {
  PROJECTS: 'projects',
  CUSTOM_THEMES: 'themes:custom',
  ORDERS: 'orders',
  FEEDBACK: 'feedback',
  SITES_INDEX: 'sites_index',
};

export function getVersionsKey(projectIdOrSlug) {
  const cleaned = String(projectIdOrSlug || 'default')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 80);
  return `versions:${cleaned || 'default'}`;
}

export function getAnalyticsDayKey(slug, dateStr = new Date().toISOString().slice(0, 10)) {
  const safeSlug = sanitizeSlug(slug) || 'du-an-mau';
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(String(dateStr || ''))
    ? String(dateStr)
    : new Date().toISOString().slice(0, 10);
  return `analytics:${safeSlug}:${safeDate}`;
}

function constantTimeMatch(a, b) {
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

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

export function getDataDir(rootDir = process.cwd()) {
  if (process.env.DATA_DIR && process.env.DATA_DIR.trim()) {
    return path.resolve(process.env.DATA_DIR.trim());
  }
  return path.resolve(rootDir, 'data');
}

export function getPublicDir(rootDir = process.cwd()) {
  if (process.env.PUBLIC_DIR && process.env.PUBLIC_DIR.trim()) {
    return path.resolve(process.env.PUBLIC_DIR.trim());
  }
  return path.resolve(rootDir, 'public');
}

export function getStorageMode() {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return 'upstash';
  }
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return 'supabase';
  }
  return 'local';
}

function keyToLocalPath(key, rootDir) {
  const safeName = Buffer.from(key, 'utf8').toString('base64url');
  return path.join(getDataDir(rootDir), 'kv', `${safeName}.json`);
}

async function upstashCommand(args) {
  const url = process.env.UPSTASH_REDIS_REST_URL.replace(/\/$/, '');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    throw new Error(`Upstash HTTP ${res.status}`);
  }
  return res.json();
}

function supabaseHeaders(extra = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

export async function storeGetStrict(key, rootDir = process.cwd()) {
  const mode = getStorageMode();
  const namespacedKey = `specpage:${key}`;

  if (mode === 'upstash') {
    const data = await upstashCommand(['GET', namespacedKey]);
    if (data && typeof data.result === 'string') {
      return { found: true, value: JSON.parse(data.result) };
    }
    return { found: false, value: null };
  }

  if (mode === 'supabase') {
    const base = process.env.SUPABASE_URL.replace(/\/$/, '');
    const url = `${base}/rest/v1/specpage_kv?key=eq.${encodeURIComponent(namespacedKey)}&select=value`;
    const res = await fetch(url, { headers: supabaseHeaders() });
    if (!res.ok) {
      throw new Error(`Supabase HTTP ${res.status}`);
    }
    const rows = await res.json();
    if (Array.isArray(rows) && rows.length > 0 && rows[0].value !== undefined) {
      return { found: true, value: rows[0].value };
    }
    return { found: false, value: null };
  }

  const filePath = keyToLocalPath(key, rootDir);
  try {
    const raw = await fs.promises.readFile(filePath, 'utf8');
    return { found: true, value: JSON.parse(raw) };
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
      return { found: false, value: null };
    }
    throw err;
  }
}

export async function storeGet(key, fallback = null, rootDir = process.cwd()) {
  try {
    const res = await storeGetStrict(key, rootDir);
    return res.found ? res.value : fallback;
  } catch {
    return fallback;
  }
}

export async function backupStoreSnapshot(label = 'auto', rootDir = process.cwd()) {
  const safeLabel = String(label || 'auto').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 32);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupKey = `backup:${stamp}-${safeLabel}`;
  const [projects, sitesIndex, feedback, orders] = await Promise.all([
    storeGet('projects', null, rootDir),
    storeGet('sites_index', null, rootDir),
    storeGet('feedback', null, rootDir),
    storeGet('orders', null, rootDir),
  ]);
  const snapshot = {
    createdAt: new Date().toISOString(),
    label: safeLabel,
    storageMode: getStorageMode(),
    projects,
    sitesIndex,
    feedback,
    orders,
  };
  await storeSet(backupKey, snapshot, rootDir);
  return { backupKey, createdAt: snapshot.createdAt };
}

export async function storeSet(key, value, rootDir = process.cwd()) {
  const mode = getStorageMode();
  const namespacedKey = `specpage:${key}`;

  if (mode === 'upstash') {
    await upstashCommand(['SET', namespacedKey, JSON.stringify(value)]);
    return;
  }

  if (mode === 'supabase') {
    const base = process.env.SUPABASE_URL.replace(/\/$/, '');
    const url = `${base}/rest/v1/specpage_kv?on_conflict=key`;
    const res = await fetch(url, {
      method: 'POST',
      headers: supabaseHeaders({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify([
        {
          key: namespacedKey,
          value,
          updated_at: new Date().toISOString(),
        },
      ]),
    });
    if (!res.ok) {
      throw new Error(`Supabase HTTP ${res.status}`);
    }
    return;
  }

  const filePath = keyToLocalPath(key, rootDir);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}

export async function storeDelete(key, rootDir = process.cwd()) {
  const mode = getStorageMode();
  const namespacedKey = `specpage:${key}`;

  if (mode === 'upstash') {
    await upstashCommand(['DEL', namespacedKey]);
    return;
  }

  if (mode === 'supabase') {
    const base = process.env.SUPABASE_URL.replace(/\/$/, '');
    const url = `${base}/rest/v1/specpage_kv?key=eq.${encodeURIComponent(namespacedKey)}`;
    await fetch(url, { method: 'DELETE', headers: supabaseHeaders() });
    return;
  }

  const filePath = keyToLocalPath(key, rootDir);
  await fs.promises.rm(filePath, { force: true });
}

export async function savePublishedSite(slug, spec, html, rootDir = process.cwd()) {
  const publicDir = getPublicDir(rootDir);
  await fs.promises.mkdir(publicDir, { recursive: true });

  const mainSiteRecord = {
    slug: '__main__',
    spec,
    html,
    updatedAt: new Date().toISOString(),
  };

  await Promise.all([
    fs.promises.writeFile(path.join(publicDir, 'site.html'), html, 'utf8'),
    fs.promises.writeFile(
      path.join(publicDir, 'published-spec.json'),
      JSON.stringify(spec, null, 2),
      'utf8'
    ),
    storeSet('site:__main__', mainSiteRecord, rootDir),
  ]);

  let clientUrl;
  const safeSlug = slug ? sanitizeSlug(slug) : null;
  if (safeSlug) {
    const clientDir = resolveSafeChild(publicDir, 'clients', safeSlug);
    await fs.promises.mkdir(clientDir, { recursive: true });

    const clientRecord = {
      slug: safeSlug,
      spec,
      html,
      updatedAt: new Date().toISOString(),
    };

    const indexMap = (await storeGet('sites_index', {}, rootDir)) || {};
    indexMap[safeSlug] = {
      slug: safeSlug,
      title: spec?.meta?.title || safeSlug,
      updatedAt: spec?.updatedAt || clientRecord.updatedAt,
      url: `/clients/${safeSlug}/index.html`,
      specUrl: `/clients/${safeSlug}/spec.json`,
    };

    await Promise.all([
      fs.promises.writeFile(path.join(clientDir, 'index.html'), html, 'utf8'),
      fs.promises.writeFile(
        path.join(clientDir, 'spec.json'),
        JSON.stringify(spec, null, 2),
        'utf8'
      ),
      storeSet(`site:${safeSlug}`, clientRecord, rootDir),
      storeSet('sites_index', indexMap, rootDir),
    ]);

    clientUrl = `/clients/${safeSlug}/index.html`;
  }

  return {
    siteUrl: '/site.html',
    specUrl: '/published-spec.json',
    clientUrl,
  };
}

export async function getPublishedSite(slug = null, rootDir = process.cwd()) {
  const storeKey = slug ? `site:${slug}` : 'site:__main__';
  const stored = await storeGet(storeKey, null, rootDir);
  if (stored && typeof stored.html === 'string' && stored.spec) {
    return stored;
  }

  // Fallback to disk if pre-seeded in public/
  const publicDir = getPublicDir(rootDir);
  try {
    if (slug) {
      const safeSlug = sanitizeSlug(slug);
      if (!safeSlug) return null;
      const clientDir = resolveSafeChild(publicDir, 'clients', safeSlug);
      const [html, specRaw] = await Promise.all([
        fs.promises.readFile(path.join(clientDir, 'index.html'), 'utf8'),
        fs.promises.readFile(path.join(clientDir, 'spec.json'), 'utf8'),
      ]);
      return { slug: safeSlug, html, spec: JSON.parse(specRaw) };
    }

    const [html, specRaw] = await Promise.all([
      fs.promises.readFile(path.join(publicDir, 'site.html'), 'utf8'),
      fs.promises.readFile(path.join(publicDir, 'published-spec.json'), 'utf8'),
    ]);
    return { slug: '__main__', html, spec: JSON.parse(specRaw) };
  } catch {
    return null;
  }
}

export async function listPublishedSites(rootDir = process.cwd()) {
  const indexMap = (await storeGet('sites_index', {}, rootDir)) || {};
  const bySlug = new Map(Object.entries(indexMap));

  const clientsRoot = path.join(getPublicDir(rootDir), 'clients');
  try {
    const entries = await fs.promises.readdir(clientsRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const slug = sanitizeSlug(entry.name);
      if (!slug || bySlug.has(slug)) continue;
      try {
        const specRaw = await fs.promises.readFile(
          path.join(clientsRoot, slug, 'spec.json'),
          'utf8'
        );
        const specData = JSON.parse(specRaw);
        bySlug.set(slug, {
          slug,
          title: specData?.meta?.title || slug,
          updatedAt: specData?.updatedAt || null,
          url: `/clients/${slug}/index.html`,
          specUrl: `/clients/${slug}/spec.json`,
        });
      } catch {
        bySlug.set(slug, {
          slug,
          title: slug,
          updatedAt: null,
          url: `/clients/${slug}/index.html`,
          specUrl: `/clients/${slug}/spec.json`,
        });
      }
    }
  } catch {
    // public/clients may not exist yet
  }

  return Array.from(bySlug.values());
}

export async function getPublicSiteSpec(slug = null, rootDir = process.cwd(), options = {}) {
  const safeSlug = slug ? sanitizeSlug(slug) : null;
  const mode = options.mode === 'review' ? 'review' : 'live';
  const isAdmin = Boolean(options.isAdmin);
  const reviewToken = typeof options.reviewToken === 'string' ? options.reviewToken.trim() : '';

  if (mode === 'review' || options.allowDraft) {
    const projectsData = await storeGet('projects', null, rootDir);
    if (projectsData && Array.isArray(projectsData.projects) && projectsData.projects.length > 0) {
      const match = safeSlug
        ? projectsData.projects.find((p) => p && p.slug === safeSlug)
        : projectsData.projects.find((p) => p && p.id === projectsData.activeProjectId) ||
          projectsData.projects[0];

      if (match && match.spec && Array.isArray(match.spec.sections)) {
        if (mode === 'review' && !isAdmin && match.reviewToken) {
          if (!reviewToken || !constantTimeMatch(reviewToken, match.reviewToken)) {
            return {
              unauthorized: true,
              reason: 'Link xem trước yêu cầu mã xác thực (reviewToken) hợp lệ.',
            };
          }
        }
        return {
          slug: match.slug || safeSlug || 'du-an-mau',
          projectName: match.projectName || match.spec.meta?.title || 'Landing Page',
          clientName: match.clientName || '',
          publishedUrl: match.publishedUrl || null,
          spec: match.spec,
          isDraft: true,
          status: match.status || 'draft',
        };
      }
    }
  }

  // In mode=live, strictly serve published snapshots first so drafts never leak publicly
  const published = await getPublishedSite(safeSlug, rootDir);
  if (published && published.spec && Array.isArray(published.spec.sections)) {
    return {
      slug: safeSlug || published.slug || 'du-an-mau',
      projectName: published.spec.meta?.title || safeSlug || 'Landing Page',
      spec: published.spec,
      isDraft: false,
      status: 'published',
    };
  }

  // Only allow draft fallback in live mode if explicitly requested (e.g., admin previewing before first publish)
  if (options.allowDraftFallback === true) {
    const projectsData = await storeGet('projects', null, rootDir);
    if (projectsData && Array.isArray(projectsData.projects) && projectsData.projects.length > 0) {
      const match = safeSlug
        ? projectsData.projects.find((p) => p && p.slug === safeSlug)
        : projectsData.projects.find((p) => p && p.id === projectsData.activeProjectId) ||
          projectsData.projects[0];

      if (match && match.spec && Array.isArray(match.spec.sections)) {
        return {
          slug: match.slug || safeSlug || 'du-an-mau',
          projectName: match.projectName || match.spec.meta?.title || 'Landing Page',
          spec: match.spec,
          isDraft: true,
          status: match.status || 'draft',
        };
      }
    }
  }

  return null;
}

import fs from 'node:fs';
import path from 'node:path';

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

export async function storeGet(key, fallback = null, rootDir = process.cwd()) {
  const mode = getStorageMode();
  const namespacedKey = `specpage:${key}`;

  try {
    if (mode === 'upstash') {
      const data = await upstashCommand(['GET', namespacedKey]);
      if (data && typeof data.result === 'string') {
        return JSON.parse(data.result);
      }
      return fallback;
    }

    if (mode === 'supabase') {
      const base = process.env.SUPABASE_URL.replace(/\/$/, '');
      const url = `${base}/rest/v1/specpage_kv?key=eq.${encodeURIComponent(namespacedKey)}&select=value`;
      const res = await fetch(url, { headers: supabaseHeaders() });
      if (!res.ok) return fallback;
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0 && rows[0].value !== undefined) {
        return rows[0].value;
      }
      return fallback;
    }

    const filePath = keyToLocalPath(key, rootDir);
    const raw = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
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
  const publicDir = path.resolve(rootDir, 'public');
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
  const publicDir = path.resolve(rootDir, 'public');
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

  const clientsRoot = path.resolve(rootDir, 'public', 'clients');
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

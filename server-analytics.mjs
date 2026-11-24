import crypto from 'node:crypto';
import { sanitizeSlug, storeGet, storeSet } from './server-store.mjs';

const MAX_DAYS_RETAINED = 90;
let runtimeSalt = null;

function getDailySalt() {
  if (!runtimeSalt) {
    runtimeSalt = process.env.SESSION_SECRET || crypto.randomBytes(16).toString('hex');
  }
  return runtimeSalt;
}

function getClientIpForHash(req) {
  const forwarded = req?.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req?.socket?.remoteAddress || 'unknown';
}

function computeDailyVisitorToken(req, dateStr) {
  const ip = getClientIpForHash(req);
  const ua = String(req?.headers?.['user-agent'] || '').slice(0, 120);
  // One-way daily hash only — raw IP and UA are never stored anywhere
  return crypto
    .createHash('sha256')
    .update(`${dateStr}|${ip}|${ua}|${getDailySalt()}`)
    .digest('hex')
    .slice(0, 16);
}

function normalizeReferrerSource(rawReferrer) {
  if (!rawReferrer || typeof rawReferrer !== 'string') return 'Direct';
  const trimmed = rawReferrer.trim();
  if (!trimmed) return 'Direct';
  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (!host) return 'Direct';
    if (host.includes('facebook.com') || host.includes('fb.com')) return 'Facebook';
    if (host.includes('zalo.me')) return 'Zalo';
    if (host.includes('google.')) return 'Google';
    if (host.includes('tiktok.com')) return 'TikTok';
    if (host.includes('instagram.com')) return 'Instagram';
    return host.slice(0, 48);
  } catch {
    return 'Direct';
  }
}

export async function trackAnalyticsEvent(req, body, rootDir = process.cwd()) {
  const slug = sanitizeSlug(body?.slug || 'du-an-mau') || 'du-an-mau';
  const event = String(body?.event || 'page_view');
  const allowedEvents = new Set(['page_view', 'menu_view', 'qr_visit', 'menu_item_view']);
  if (!allowedEvents.has(event)) {
    return { ok: false, error: 'Loại sự kiện thống kê không hợp lệ.' };
  }

  const today = new Date().toISOString().slice(0, 10);
  const visitorHash = computeDailyVisitorToken(req, today);
  const pathStr = String(body?.path || '/').slice(0, 120);
  const itemName = body?.itemName ? String(body.itemName).slice(0, 100) : null;
  const source = event === 'qr_visit' ? 'QR Code' : normalizeReferrerSource(body?.referrer);

  const key = `analytics:${slug}`;
  const store = (await storeGet(key, { slug, days: {} }, rootDir)) || { slug, days: {} };
  const days = store.days && typeof store.days === 'object' ? store.days : {};

  if (!days[today]) {
    days[today] = {
      pageViews: 0,
      menuViews: 0,
      qrVisits: 0,
      visitors: [],
      pages: {},
      items: {},
      sources: {},
    };
  }

  const bucket = days[today];
  if (event === 'page_view') {
    bucket.pageViews = (bucket.pageViews || 0) + 1;
    bucket.pages[pathStr] = (bucket.pages[pathStr] || 0) + 1;
  } else if (event === 'menu_view') {
    bucket.menuViews = (bucket.menuViews || 0) + 1;
    bucket.pages[pathStr] = (bucket.pages[pathStr] || 0) + 1;
  } else if (event === 'qr_visit') {
    bucket.qrVisits = (bucket.qrVisits || 0) + 1;
    bucket.menuViews = (bucket.menuViews || 0) + 1;
    bucket.pages[pathStr] = (bucket.pages[pathStr] || 0) + 1;
  } else if (event === 'menu_item_view' && itemName) {
    bucket.items[itemName] = (bucket.items[itemName] || 0) + 1;
  }

  if (event !== 'menu_item_view') {
    bucket.sources[source] = (bucket.sources[source] || 0) + 1;
  }

  if (!Array.isArray(bucket.visitors)) bucket.visitors = [];
  if (!bucket.visitors.includes(visitorHash) && bucket.visitors.length < 2000) {
    bucket.visitors.push(visitorHash);
  }

  // Prune old days > MAX_DAYS_RETAINED
  const sortedDates = Object.keys(days).sort();
  if (sortedDates.length > MAX_DAYS_RETAINED) {
    for (const oldDate of sortedDates.slice(0, sortedDates.length - MAX_DAYS_RETAINED)) {
      delete days[oldDate];
    }
  }

  await storeSet(key, { slug, days, updatedAt: new Date().toISOString() }, rootDir);
  return { ok: true };
}

export async function queryAnalytics({ slug, daysCount = 30 }, rootDir = process.cwd()) {
  const safeSlug = sanitizeSlug(slug || 'du-an-mau') || 'du-an-mau';
  const clampedDays = Math.max(1, Math.min(90, Number(daysCount) || 30));
  const store = (await storeGet(`analytics:${safeSlug}`, { slug: safeSlug, days: {} }, rootDir)) || {
    slug: safeSlug,
    days: {},
  };
  const daysMap = store.days && typeof store.days === 'object' ? store.days : {};

  const cutoffDate = new Date();
  cutoffDate.setUTCDate(cutoffDate.getUTCDate() - (clampedDays - 1));
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);

  let pageViews = 0;
  let menuViews = 0;
  let qrVisits = 0;
  const uniqueVisitorSet = new Set();
  const pagesTotal = {};
  const itemsTotal = {};
  const sourcesTotal = {};
  const series = [];

  for (const date of Object.keys(daysMap).sort()) {
    if (date < cutoffStr) continue;
    const b = daysMap[date];
    const pv = Number(b.pageViews) || 0;
    const mv = Number(b.menuViews) || 0;
    const qv = Number(b.qrVisits) || 0;
    const uv = Array.isArray(b.visitors) ? b.visitors.length : 0;

    pageViews += pv;
    menuViews += mv;
    qrVisits += qv;
    if (Array.isArray(b.visitors)) {
      for (const h of b.visitors) uniqueVisitorSet.add(h);
    }

    for (const [k, v] of Object.entries(b.pages || {})) {
      pagesTotal[k] = (pagesTotal[k] || 0) + (Number(v) || 0);
    }
    for (const [k, v] of Object.entries(b.items || {})) {
      itemsTotal[k] = (itemsTotal[k] || 0) + (Number(v) || 0);
    }
    for (const [k, v] of Object.entries(b.sources || {})) {
      sourcesTotal[k] = (sourcesTotal[k] || 0) + (Number(v) || 0);
    }

    series.push({ date, pageViews: pv, menuViews: mv, qrVisits: qv, uniqueVisitors: uv });
  }

  const topList = (obj) =>
    Object.entries(obj)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

  return {
    slug: safeSlug,
    days: clampedDays,
    totals: {
      pageViews,
      uniqueVisitors: uniqueVisitorSet.size,
      menuViews,
      qrVisits,
    },
    popularPages: topList(pagesTotal),
    popularMenuItems: topList(itemsTotal),
    trafficSources: topList(sourcesTotal),
    series,
  };
}

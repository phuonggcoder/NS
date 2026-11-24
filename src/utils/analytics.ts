export type AnalyticsEventName = 'page_view' | 'menu_view' | 'qr_visit' | 'menu_item_view';

export function trackAnalyticsEvent(params: {
  slug: string;
  event: AnalyticsEventName;
  path?: string;
  itemId?: string;
  itemName?: string;
}): void {
  if (typeof window === 'undefined') return;
  const payload = JSON.stringify({
    slug: params.slug || 'du-an-mau',
    event: params.event,
    path: params.path || window.location.pathname + window.location.search,
    itemId: params.itemId,
    itemName: params.itemName,
    referrer: document.referrer || '',
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/track', blob);
      return;
    }
    void fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    });
  } catch {
    // Analytics should never interrupt customer experience
  }
}

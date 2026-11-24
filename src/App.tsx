import { useEffect, useState } from 'react';
import { getTemplateSpec } from './data/templates';
import { LandingPage } from './renderer/LandingPage';
import { DigitalMenuPage } from './renderer/menu/DigitalMenuPage';
import { AuthGate } from './studio/AuthGate';
import { ClientReviewBar } from './studio/ClientReviewBar';
import { StudioApp } from './studio/StudioApp';
import type {
  ClientFeedbackItem,
  DigitalMenuConfig,
  LandingPageSpec,
  ProjectStatus,
} from './types/spec';
import { trackAnalyticsEvent } from './utils/analytics';
import { readLocalSpecReadOnly } from './utils/projects';
import { saveLead, saveOrder } from './utils/storage';

function isValidSpec(candidate: unknown): candidate is LandingPageSpec {
  if (!candidate || typeof candidate !== 'object') return false;
  const spec = candidate as LandingPageSpec;
  return Boolean(Array.isArray(spec.sections) && spec.theme && spec.meta);
}

export function App() {
  const pathname = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const menuPathMatch = pathname.match(/^\/menu\/([a-z0-9-]+)\/?$/i);
  const mode = params.get('mode');
  const isMenuMode = Boolean(menuPathMatch) || mode === 'menu';
  const isLiveMode = !isMenuMode && mode === 'live';
  const isReviewMode = !isMenuMode && mode === 'review';
  const fromStudio = params.get('from') === 'studio';
  const slugParam = menuPathMatch?.[1] || params.get('slug');
  const reviewTokenParam = params.get('token') || '';
  const branchParam = params.get('branch') || undefined;
  const tableParam = params.get('table') || undefined;
  const isQrVisit = params.get('qr') === '1' || Boolean(branchParam || tableParam);

  const [liveSpec, setLiveSpec] = useState<LandingPageSpec>(
    () => readLocalSpecReadOnly(slugParam) ?? getTemplateSpec('creator-store')
  );
  const [menuData, setMenuData] = useState<DigitalMenuConfig | null>(null);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewMeta, setReviewMeta] = useState<{
    status: ProjectStatus;
    feedbackHistory: ClientFeedbackItem[];
    projectTitle: string;
  }>({ status: 'review', feedbackHistory: [], projectTitle: 'Mẫu Landing Page' });

  const [loadingSpec, setLoadingSpec] = useState<boolean>(
    isLiveMode || isReviewMode || isMenuMode
  );
  const [reviewViewport, setReviewViewport] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    if (!isMenuMode) return;
    let cancelled = false;
    const resolvedSlug = slugParam || 'du-an-mau';

    async function loadMenu() {
      try {
        const res = await fetch(
          `/api/public/menu?slug=${encodeURIComponent(resolvedSlug)}`,
          { cache: 'no-store' }
        );
        const data = (await res.json()) as {
          ok?: boolean;
          menu?: DigitalMenuConfig;
          error?: string;
        };
        if (!cancelled && res.ok && data.ok && data.menu) {
          setMenuData(data.menu);
          document.title = data.menu.seo?.title || `${data.menu.brandName} — Thực đơn điện tử`;
          setLoadingSpec(false);
          trackAnalyticsEvent({
            slug: resolvedSlug,
            event: isQrVisit ? 'qr_visit' : 'menu_view',
          });
          return;
        }
        if (!cancelled && res.status === 404) {
          const local = readLocalSpecReadOnly(slugParam);
          if (local?.digitalMenu?.enabled) {
            setMenuData(local.digitalMenu);
            setLoadingSpec(false);
            return;
          }
          setMenuError(data.error || 'Thực đơn điện tử chưa được kích hoạt.');
          setLoadingSpec(false);
          return;
        }
      } catch {
        const local = readLocalSpecReadOnly(slugParam);
        if (!cancelled && local?.digitalMenu?.enabled) {
          setMenuData(local.digitalMenu);
          setLoadingSpec(false);
          return;
        }
        if (!cancelled) {
          setMenuError('Không thể tải thực đơn. Vui lòng thử lại.');
          setLoadingSpec(false);
        }
      }
    }

    void loadMenu();
    return () => {
      cancelled = true;
    };
  }, [isMenuMode, slugParam, isQrVisit]);

  useEffect(() => {
    if (!isLiveMode && !isReviewMode) return;
    let cancelled = false;

    async function loadServerFirstSpec() {
      if (isReviewMode) {
        const targetSlug = slugParam || 'du-an-mau';
        try {
          const res = await fetch(
            `/api/public/review?slug=${encodeURIComponent(targetSlug)}&token=${encodeURIComponent(
              reviewTokenParam
            )}`,
            { cache: 'no-store', credentials: 'same-origin' }
          );
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const data = (await res.json()) as {
              ok?: boolean;
              spec?: unknown;
              status?: ProjectStatus;
              feedbackHistory?: ClientFeedbackItem[];
              projectName?: string;
              error?: string;
            };
            if (!cancelled && res.ok && data.ok && isValidSpec(data.spec)) {
              setLiveSpec(data.spec);
              setReviewMeta({
                status: data.status || 'review',
                feedbackHistory: Array.isArray(data.feedbackHistory) ? data.feedbackHistory : [],
                projectTitle:
                  data.projectName || data.spec.meta.title.split('—')[0]?.trim() || 'Mẫu Landing Page',
              });
              setLoadingSpec(false);
              return;
            }
            if (!cancelled && res.status === 403) {
              setReviewError(
                data.error || 'Link xem trước bản nháp yêu cầu mã bảo mật (review token) hợp lệ.'
              );
              setLoadingSpec(false);
              return;
            }
          }
        } catch {
          // Fall through to local read-only if offline static
        }
      }

      // Public Live mode
      const publicApiUrl = slugParam
        ? `/api/public/site?slug=${encodeURIComponent(slugParam)}`
        : '/api/public/site';

      try {
        const res = await fetch(publicApiUrl, { cache: 'no-store' });
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
          const data = (await res.json()) as { ok?: boolean; slug?: string; spec?: unknown };
          if (!cancelled && data.ok && isValidSpec(data.spec)) {
            setLiveSpec(data.spec);
            setLoadingSpec(false);
            if (isLiveMode) {
              trackAnalyticsEvent({
                slug: data.slug || slugParam || 'du-an-mau',
                event: 'page_view',
              });
            }
            return;
          }
        }
      } catch {
        // Try static spec fallback next
      }

      const staticSpecUrl = slugParam
        ? `/clients/${encodeURIComponent(slugParam)}/spec.json`
        : '/published-spec.json';

      try {
        const res = await fetch(staticSpecUrl, { cache: 'no-store' });
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
          const parsed = (await res.json()) as unknown;
          if (!cancelled && isValidSpec(parsed)) {
            setLiveSpec(parsed);
            setLoadingSpec(false);
            return;
          }
        }
      } catch {
        // Fall through to read-only localStorage
      }

      if (!cancelled) {
        const local = readLocalSpecReadOnly(slugParam);
        if (local) setLiveSpec(local);
        setLoadingSpec(false);
      }
    }

    void loadServerFirstSpec();
    return () => {
      cancelled = true;
    };
  }, [isLiveMode, isReviewMode, slugParam, reviewTokenParam]);

  useEffect(() => {
    if (!isLiveMode && !isReviewMode) return;
    document.title = liveSpec.meta.title || 'Landing Page';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && liveSpec.meta.description) {
      metaDesc.setAttribute('content', liveSpec.meta.description);
    }

    const onStorage = () => {
      const local = readLocalSpecReadOnly(slugParam);
      if (local) setLiveSpec(local);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [isLiveMode, isReviewMode, slugParam, liveSpec.meta.title, liveSpec.meta.description]);

  if (isMenuMode) {
    if (loadingSpec) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Be Vietnam Pro', sans-serif",
            color: '#475569',
          }}
        >
          Đang tải thực đơn điện tử...
        </div>
      );
    }

    if (menuError || !menuData) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
            fontFamily: "'Be Vietnam Pro', sans-serif",
          }}
        >
          <h2 style={{ margin: '0 0 8px' }}>Không thể mở Digital Menu</h2>
          <p style={{ color: '#64748b', margin: 0 }}>
            {menuError || 'Thực đơn chưa được kích hoạt.'}
          </p>
        </div>
      );
    }

    const resolvedSlug = slugParam || 'du-an-mau';
    return (
      <DigitalMenuPage
        menu={menuData}
        clientSlug={resolvedSlug}
        branch={branchParam}
        table={tableParam}
        onItemOpened={(item) =>
          trackAnalyticsEvent({
            slug: resolvedSlug,
            event: 'menu_item_view',
            itemId: item.id,
            itemName: item.name,
          })
        }
      />
    );
  }

  if (isLiveMode || isReviewMode) {
    if (loadingSpec) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            color: '#475569',
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Đang đồng bộ phiên bản mới nhất...
        </div>
      );
    }

    if (isReviewMode && reviewError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
            background: '#f8fafc',
            fontFamily: "'Be Vietnam Pro', sans-serif",
          }}
        >
          <h2 style={{ margin: '0 0 8px', color: '#0f172a' }}>Không thể mở bản xem trước</h2>
          <p style={{ color: '#64748b', maxWidth: 440, margin: 0 }}>{reviewError}</p>
        </div>
      );
    }

    const syncOrderToServer = (payload: Record<string, unknown>) => {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    };

    const pageEl = (
      <LandingPage
        spec={liveSpec}
        clientSlug={slugParam || undefined}
        onOrderCaptured={(order) => {
          saveOrder(order);
          syncOrderToServer({ kind: 'order', ...order });
        }}
        onLeadCaptured={(lead) => {
          saveLead(lead);
          syncOrderToServer({ kind: 'lead', ...lead });
        }}
      />
    );

    return (
      <>
        {isReviewMode && reviewViewport === 'mobile' ? (
          <div
            style={{
              minHeight: '100vh',
              background: '#e2e8f0',
              padding: '24px 12px 96px',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 390,
                background: '#ffffff',
                borderRadius: 24,
                overflow: 'hidden',
                boxShadow: '0 24px 60px rgba(15,23,42,0.25)',
                border: '6px solid #0f172a',
              }}
            >
              {pageEl}
            </div>
          </div>
        ) : (
          <div style={isReviewMode ? { paddingBottom: 76 } : undefined}>{pageEl}</div>
        )}

        {isReviewMode && (
          <ClientReviewBar
            clientSlug={slugParam || 'du-an-mau'}
            reviewToken={reviewTokenParam || undefined}
            projectTitle={reviewMeta.projectTitle}
            projectStatus={reviewMeta.status}
            feedbackHistory={reviewMeta.feedbackHistory}
            sections={liveSpec.sections}
            viewport={reviewViewport}
            onChangeViewport={setReviewViewport}
          />
        )}

        {isLiveMode && fromStudio && (
          <a
            href="/"
            style={{
              position: 'fixed',
              left: 16,
              bottom: 16,
              zIndex: 90,
              padding: '8px 14px',
              borderRadius: 999,
              background: 'rgba(15, 23, 42, 0.85)',
              color: '#ffffff',
              fontSize: 12.5,
              fontWeight: 600,
              textDecoration: 'none',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
            }}
          >
            ← Quay lại Studio chỉnh sửa
          </a>
        )}
      </>
    );
  }

  return (
    <AuthGate>
      {({ authStatus, onLoggedOut }) => (
        <StudioApp authStatus={authStatus} onLoggedOut={onLoggedOut} />
      )}
    </AuthGate>
  );
}

export default App;

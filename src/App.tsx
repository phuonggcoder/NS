import { useEffect, useState } from 'react';
import { getTemplateSpec } from './data/templates';
import { LandingPage } from './renderer/LandingPage';
import { AuthGate } from './studio/AuthGate';
import { ClientReviewBar } from './studio/ClientReviewBar';
import { StudioApp } from './studio/StudioApp';
import type { LandingPageSpec } from './types/spec';
import { readLocalSpecReadOnly } from './utils/projects';
import { saveLead, saveOrder } from './utils/storage';

function isValidSpec(candidate: unknown): candidate is LandingPageSpec {
  if (!candidate || typeof candidate !== 'object') return false;
  const spec = candidate as LandingPageSpec;
  return Boolean(Array.isArray(spec.sections) && spec.theme && spec.meta);
}

export function App() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const isLiveMode = mode === 'live';
  const isReviewMode = mode === 'review';
  const fromStudio = params.get('from') === 'studio';
  const slugParam = params.get('slug');

  const [liveSpec, setLiveSpec] = useState<LandingPageSpec>(
    () => readLocalSpecReadOnly(slugParam) ?? getTemplateSpec('creator-store')
  );
  const [loadingSpec, setLoadingSpec] = useState<boolean>(isLiveMode || isReviewMode);
  const [reviewViewport, setReviewViewport] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    if (!isLiveMode && !isReviewMode) return;
    let cancelled = false;

    async function loadServerFirstSpec() {
      // 1. Always ask backend persistent store first so every browser sees identical live data
      const publicApiUrl = slugParam
        ? `/api/public/site?slug=${encodeURIComponent(slugParam)}`
        : '/api/public/site';

      try {
        const res = await fetch(publicApiUrl, { cache: 'no-store' });
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
          const data = (await res.json()) as { ok?: boolean; spec?: unknown };
          if (!cancelled && data.ok && isValidSpec(data.spec)) {
            setLiveSpec(data.spec);
            setLoadingSpec(false);
            return;
          }
        }
      } catch {
        // Try static spec fallback next
      }

      // 2. Fallback to static published spec JSON
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
        // Fall through to read-only localStorage or default starter
      }

      // 3. Fallback to read-only localStorage (only if already saved on this browser)
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
  }, [isLiveMode, isReviewMode, slugParam]);

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
            projectTitle={liveSpec.meta.title.split('—')[0]?.trim() || 'Mẫu Landing Page'}
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

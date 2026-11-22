import { useEffect, useState } from 'react';
import { getTemplateSpec } from './data/templates';
import { LandingPage } from './renderer/LandingPage';
import { AuthGate } from './studio/AuthGate';
import { ClientReviewBar } from './studio/ClientReviewBar';
import { StudioApp } from './studio/StudioApp';
import type { LandingPageSpec } from './types/spec';
import { loadProjectsState } from './utils/projects';
import { loadStoredSpec, saveLead, saveOrder } from './utils/storage';

function resolveInitialSpec(slugParam: string | null): LandingPageSpec {
  if (slugParam) {
    const { projects } = loadProjectsState();
    const match = projects.find((p) => p.slug === slugParam);
    if (match) return match.spec;
  }
  return loadStoredSpec() ?? getTemplateSpec('creator-store');
}

export function App() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const isLiveMode = mode === 'live';
  const isReviewMode = mode === 'review';
  const fromStudio = params.get('from') === 'studio';
  const slugParam = params.get('slug');

  const [liveSpec, setLiveSpec] = useState<LandingPageSpec>(() =>
    resolveInitialSpec(slugParam)
  );
  const [reviewViewport, setReviewViewport] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    if (!isLiveMode && !isReviewMode) return;

    const specUrl = slugParam
      ? `/clients/${encodeURIComponent(slugParam)}/spec.json`
      : '/published-spec.json';

    const hasLocalMatch = slugParam
      ? loadProjectsState().projects.some((p) => p.slug === slugParam)
      : loadStoredSpec() !== null;

    if (!hasLocalMatch) {
      let cancelled = false;
      fetch(specUrl)
        .then((res) => (res.ok ? res.json() : null))
        .then((parsed: LandingPageSpec | null) => {
          if (
            !cancelled &&
            parsed &&
            Array.isArray(parsed.sections) &&
            parsed.theme &&
            parsed.meta
          ) {
            setLiveSpec(parsed);
          }
        })
        .catch(() => {
          // Keep fallback spec
        });
      return () => {
        cancelled = true;
      };
    }
  }, [isLiveMode, isReviewMode, slugParam]);

  useEffect(() => {
    if (!isLiveMode && !isReviewMode) return;
    document.title = liveSpec.meta.title || 'Landing Page';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && liveSpec.meta.description) {
      metaDesc.setAttribute('content', liveSpec.meta.description);
    }

    const onStorage = () => {
      setLiveSpec(resolveInitialSpec(slugParam));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [isLiveMode, isReviewMode, slugParam, liveSpec.meta.title, liveSpec.meta.description]);

  if (isLiveMode || isReviewMode) {
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

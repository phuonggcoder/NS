import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, Eye, Layers, LayoutTemplate, Palette, X } from 'lucide-react';
import type { AiSuggestion } from '../ai/aiTypes';
import { runLocalAudit } from '../ai/localAuditor';
import { createDefaultSection, getTemplateSpec } from '../data/templates';
import {
  buildStandaloneHtml,
  downloadTextFile,
  publishSiteToServer,
} from '../exporter/exportHtml';
import { LandingPage } from '../renderer/LandingPage';
import type {
  ClientProject,
  ContactLead,
  CustomerOrder,
  LandingPageSpec,
  LandingSection,
  ProjectStatus,
  SectionType,
  ViewportMode,
} from '../types/spec';
import {
  clearOrdersOnServer,
  fetchProjectsFromServer,
  saveProjectsToServer,
  type AuthStatusResponse,
  type StorageMode,
} from '../utils/auth';
import {
  createClientProject,
  duplicateClientProject,
  loadProjectsState,
  saveProjectsState,
  updateSpecInProject,
} from '../utils/projects';
import {
  clearLeads,
  clearOrders,
  cloneSpec,
  generateId,
  loadLeads,
  loadOrders,
  saveStoredSpec,
} from '../utils/storage';
import { AiAssistantPanel } from './AiAssistantPanel';
import { DesignPanel } from './DesignPanel';
import { SectionInspector } from './inspector/SectionInspector';
import { OrdersDrawer } from './OrdersDrawer';
import { ProjectsDrawer } from './ProjectsDrawer';
import { PublishModal } from './PublishModal';
import { SecurityModal } from './SecurityModal';
import { SpecModal } from './SpecModal';
import { StructurePanel } from './StructurePanel';
import { TemplatesSpecPanel } from './TemplatesSpecPanel';
import { TopBar } from './TopBar';
import './studio.css';

type LeftTab = 'structure' | 'design' | 'templates';

const MAX_HISTORY = 40;

interface StudioAppProps {
  authStatus?: AuthStatusResponse;
  onLoggedOut?: () => void;
}

export function StudioApp({ authStatus, onLoggedOut }: StudioAppProps) {
  const [projectsState, setProjectsState] = useState(() => loadProjectsState());
  const activeProject =
    projectsState.projects.find((p) => p.id === projectsState.activeProjectId) ??
    projectsState.projects[0];

  const [history, setHistory] = useState<{
    past: LandingPageSpec[];
    present: LandingPageSpec;
    future: LandingPageSpec[];
  }>(() => ({
    past: [],
    present: activeProject.spec,
    future: [],
  }));

  const spec = history.present;

  const [leftTab, setLeftTab] = useState<LeftTab>('structure');
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    () => spec.sections.find((s) => s.type === 'hero')?.id ?? spec.sections[0]?.id ?? null
  );

  // Cloud / Server Persistence Status
  const [storageMode, setStorageMode] = useState<StorageMode>(
    authStatus?.storageMode ?? 'browser'
  );
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'offline'>(
    authStatus?.staticFallback ? 'offline' : 'saved'
  );
  const hydratedFromServerRef = useRef(false);
  const syncTimerRef = useRef<number | null>(null);

  // AI Workbench & Live Preview State
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>(() =>
    runLocalAudit(activeProject.spec)
  );
  const [previewState, setPreviewState] = useState<{
    spec: LandingPageSpec;
    label: string;
    highlightSectionId?: string;
  } | null>(null);

  // Modals & Drawers
  const [specModalOpen, setSpecModalOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);

  const [orders, setOrders] = useState<CustomerOrder[]>(() => loadOrders());
  const [leads, setLeads] = useState<ContactLead[]>(() => loadLeads());
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastPublishedUrl, setLastPublishedUrl] = useState<string | undefined>(
    activeProject.publishedUrl
  );
  const [toast, setToast] = useState<{
    message: string;
    linkHref?: string;
    linkLabel?: string;
  } | null>(null);

  const showToast = useCallback(
    (message: string, linkHref?: string, linkLabel?: string) => {
      setToast({ message, linkHref, linkLabel });
    },
    []
  );

  useEffect(() => {
    if (!toast) return;
    const duration = toast.linkHref ? 5400 : 3200;
    const timer = window.setTimeout(() => setToast(null), duration);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Hydrate projects from persistent server/cloud store on initial mount
  useEffect(() => {
    if (authStatus?.staticFallback) {
      hydratedFromServerRef.current = true;
      setSyncStatus('offline');
      return;
    }

    let cancelled = false;
    void fetchProjectsFromServer().then((res) => {
      if (cancelled) return;
      if (res.unauthorized) {
        onLoggedOut?.();
        return;
      }
      if (res.storageMode) setStorageMode(res.storageMode);

      if (res.ok && res.projects && res.projects.length > 0) {
        const nextActiveId =
          res.projects.find((p) => p.id === res.activeProjectId)?.id ?? res.projects[0].id;
        const activeProj = res.projects.find((p) => p.id === nextActiveId) ?? res.projects[0];
        saveProjectsState(res.projects, nextActiveId);
        saveStoredSpec(activeProj.spec);
        setProjectsState({ projects: res.projects, activeProjectId: nextActiveId });
        setHistory({ past: [], present: activeProj.spec, future: [] });
        setAiSuggestions(runLocalAudit(activeProj.spec));
        setLastPublishedUrl(activeProj.publishedUrl);
        setSelectedSectionId(
          activeProj.spec.sections.find((s) => s.type === 'hero')?.id ??
          activeProj.spec.sections[0]?.id ??
          null
        );
        setSyncStatus('saved');
      } else if (res.ok) {
        // Seed server/cloud store with initial local project
        const local = loadProjectsState();
        void saveProjectsToServer(local.projects, local.activeProjectId).then((saveRes) => {
          if (!cancelled && saveRes.ok) setSyncStatus('saved');
        });
      }
      hydratedFromServerRef.current = true;
    });

    return () => {
      cancelled = true;
    };
  }, [authStatus?.staticFallback, onLoggedOut]);

  // Sync spec into localStorage + active project + debounced cloud/server save
  useEffect(() => {
    saveStoredSpec(spec);
    let latestProjects: ClientProject[] = [];
    let latestActiveId = '';

    setProjectsState((prev) => {
      const nextProjects = updateSpecInProject(prev.projects, prev.activeProjectId, spec);
      saveProjectsState(nextProjects, prev.activeProjectId);
      latestProjects = nextProjects;
      latestActiveId = prev.activeProjectId;
      return { ...prev, projects: nextProjects };
    });

    if (!hydratedFromServerRef.current || authStatus?.staticFallback) {
      return;
    }

    setSyncStatus('saving');
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = window.setTimeout(() => {
      void saveProjectsToServer(latestProjects, latestActiveId).then((res) => {
        if (res.unauthorized) {
          onLoggedOut?.();
          return;
        }
        if (res.storageMode) setStorageMode(res.storageMode);
        setSyncStatus(res.ok ? 'saved' : 'offline');
      });
    }, 900);

    return () => {
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, [spec, authStatus?.staticFallback, onLoggedOut]);

  const flushProjectsToServer = useCallback(
    (projects: ClientProject[], activeId: string) => {
      if (authStatus?.staticFallback) return;
      setSyncStatus('saving');
      void saveProjectsToServer(projects, activeId).then((res) => {
        if (res.unauthorized) {
          onLoggedOut?.();
          return;
        }
        if (res.storageMode) setStorageMode(res.storageMode);
        setSyncStatus(res.ok ? 'saved' : 'offline');
      });
    },
    [authStatus?.staticFallback, onLoggedOut]
  );

  // Sync orders & leads from localStorage + authenticated server endpoint
  const syncInbox = useCallback(async () => {
    const localOrders = loadOrders();
    const localLeads = loadLeads();
    setOrders(localOrders);
    setLeads(localLeads);

    try {
      const res = await fetch('/api/orders', { credentials: 'same-origin' });
      if (res.status === 401) {
        onLoggedOut?.();
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as {
        orders?: CustomerOrder[];
        leads?: ContactLead[];
      };
      if (Array.isArray(data.orders)) {
        const mergedOrders = new Map<string, CustomerOrder>();
        [...data.orders, ...localOrders].forEach((o) => mergedOrders.set(o.id, o));
        setOrders(Array.from(mergedOrders.values()));
      }
      if (Array.isArray(data.leads)) {
        const mergedLeads = new Map<string, ContactLead>();
        [...data.leads, ...localLeads].forEach((l) => mergedLeads.set(l.id, l));
        setLeads(Array.from(mergedLeads.values()));
      }
    } catch {
      // Ignore offline/static
    }
  }, [onLoggedOut]);

  useEffect(() => {
    void syncInbox();
    window.addEventListener('focus', syncInbox);
    window.addEventListener('storage', syncInbox);
    return () => {
      window.removeEventListener('focus', syncInbox);
      window.removeEventListener('storage', syncInbox);
    };
  }, [syncInbox]);

  const commitSpec = useCallback((nextSpec: LandingPageSpec) => {
    const stamped: LandingPageSpec = {
      ...nextSpec,
      updatedAt: new Date().toISOString(),
    };
    setHistory((prev) => ({
      past: [...prev.past.slice(-(MAX_HISTORY - 1)), prev.present],
      present: stamped,
      future: [],
    }));
  }, []);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      return {
        past: prev.past.slice(0, -1),
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: prev.future.slice(1),
      };
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditingInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (isEditingInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  const scrollToCanvasSection = (id: string) => {
    window.requestAnimationFrame(() => {
      const el = document.querySelector(`[data-lp-section-id="${id}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const handleSelectSection = (id: string) => {
    setSelectedSectionId(id);
    if (aiPanelOpen && !previewState) {
      setAiPanelOpen(false);
    }
  };

  const handleReorderSection = (fromIndex: number, toIndex: number) => {
    const nextSections = [...spec.sections];
    const [moved] = nextSections.splice(fromIndex, 1);
    nextSections.splice(toIndex, 0, moved);
    commitSpec({ ...spec, sections: nextSections });
  };

  const handleMoveSection = (id: string, delta: -1 | 1) => {
    const index = spec.sections.findIndex((s) => s.id === id);
    if (index === -1) return;
    const target = index + delta;
    if (target < 0 || target >= spec.sections.length) return;
    handleReorderSection(index, target);
  };

  const handleToggleVisible = (id: string) => {
    const nextSections = spec.sections.map((s) =>
      s.id === id ? { ...s, visible: !s.visible } : s
    );
    commitSpec({ ...spec, sections: nextSections });
  };

  const handleDuplicateSection = (id: string) => {
    const index = spec.sections.findIndex((s) => s.id === id);
    if (index === -1) return;
    const copy = cloneSpec(spec.sections[index]);
    copy.id = generateId(copy.type);
    const nextSections = [...spec.sections];
    nextSections.splice(index + 1, 0, copy);
    commitSpec({ ...spec, sections: nextSections });
    setSelectedSectionId(copy.id);
    showToast('Đã nhân bản khối giao diện.');
  };

  const handleDeleteSection = (id: string) => {
    if (spec.sections.length <= 1) {
      showToast('Trang cần giữ lại ít nhất 1 khối nội dung.');
      return;
    }
    const nextSections = spec.sections.filter((s) => s.id !== id);
    commitSpec({ ...spec, sections: nextSections });
    if (selectedSectionId === id) {
      setSelectedSectionId(nextSections[0]?.id ?? null);
    }
  };

  const handleAddSection = (type: SectionType) => {
    const created = createDefaultSection(type);
    const footerIndex = spec.sections.findIndex((s) => s.type === 'footer');
    const nextSections = [...spec.sections];
    if (type === 'navbar') {
      nextSections.unshift(created);
    } else if (footerIndex !== -1 && type !== 'footer') {
      nextSections.splice(footerIndex, 0, created);
    } else {
      nextSections.push(created);
    }
    commitSpec({ ...spec, sections: nextSections });
    setSelectedSectionId(created.id);
    setAiPanelOpen(false);
    scrollToCanvasSection(created.id);
    showToast('Đã thêm khối mới vào trang.');
  };

  const handleUpdateSection = (updated: LandingSection) => {
    const nextSections = spec.sections.map((s) => (s.id === updated.id ? updated : s));
    commitSpec({ ...spec, sections: nextSections });
  };

  const handleSelectTemplate = (templateId: string) => {
    const nextSpec = getTemplateSpec(templateId);
    commitSpec(nextSpec);
    setPreviewState(null);
    setAiSuggestions(runLocalAudit(nextSpec));
    setSelectedSectionId(
      nextSpec.sections.find((s) => s.type === 'hero')?.id ?? nextSpec.sections[0]?.id ?? null
    );
    showToast('Đã áp dụng mẫu giao diện mới.');
  };

  const switchActiveProject = (project: ClientProject) => {
    setPreviewState(null);
    setHistory({ past: [], present: project.spec, future: [] });
    setAiSuggestions(runLocalAudit(project.spec));
    setLastPublishedUrl(project.publishedUrl);
    setSelectedSectionId(
      project.spec.sections.find((s) => s.type === 'hero')?.id ??
      project.spec.sections[0]?.id ??
      null
    );
    setProjectsState((prev) => {
      saveProjectsState(prev.projects, project.id);
      flushProjectsToServer(prev.projects, project.id);
      return { ...prev, activeProjectId: project.id };
    });
    showToast(`Đang chỉnh sửa dự án: ${project.projectName}`);
  };

  const handlePublishSite = async () => {
    setIsPublishing(true);
    try {
      const html = buildStandaloneHtml(spec, activeProject.slug);
      const res = await publishSiteToServer(spec, html, activeProject.slug);
      if (res.ok) {
        const targetUrl = res.clientUrl || res.siteUrl || '/site.html';
        setLastPublishedUrl(targetUrl);
        setProjectsState((prev) => {
          const nextProjects = updateSpecInProject(prev.projects, prev.activeProjectId, spec, {
            status: 'published',
            publishedUrl: targetUrl,
          });
          saveProjectsState(nextProjects, prev.activeProjectId);
          flushProjectsToServer(nextProjects, prev.activeProjectId);
          return { ...prev, projects: nextProjects };
        });
        showToast(
          'Đã xuất bản trang khách hàng thành công!',
          targetUrl,
          `Mở ${targetUrl} →`
        );
      } else {
        downloadTextFile(`${activeProject.slug}.html`, html, 'text/html');
        showToast('Đã tải xuống file HTML độc lập cho khách hàng.');
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDownloadHtml = () => {
    const html = buildStandaloneHtml(spec, activeProject.slug);
    downloadTextFile(`${activeProject.slug || 'index'}.html`, html, 'text/html');
    showToast('Đã tải xuống file HTML hoàn chỉnh.');
  };

  const handleDownloadSpecJson = () => {
    downloadTextFile(
      `${activeProject.slug || 'landing'}.spec.json`,
      JSON.stringify(spec, null, 2),
      'application/json'
    );
    showToast('Đã tải xuống file Spec JSON.');
  };

  const displaySpec = previewState?.spec ?? spec;
  const selectedSection = displaySpec.sections.find((s) => s.id === selectedSectionId) ?? null;
  const pendingAiCount = aiSuggestions.filter((s) => s.status === 'pending').length;

  return (
    <div className="st-shell">
      <TopBar
        activeProject={activeProject}
        viewport={viewport}
        onViewportChange={setViewport}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        ordersCount={orders.length}
        leadsCount={leads.length}
        aiIssuesCount={pendingAiCount}
        aiPanelOpen={aiPanelOpen}
        syncStatus={syncStatus}
        storageMode={storageMode}
        onToggleAiPanel={() => setAiPanelOpen((prev) => !prev)}
        onOpenProjects={() => setProjectsOpen(true)}
        onOpenOrders={() => {
          void syncInbox();
          setOrdersOpen(true);
        }}
        onOpenSpecModal={() => setSpecModalOpen(true)}
        onOpenSecurity={() => setSecurityOpen(true)}
        onOpenPublishModal={() => setPublishOpen(true)}
      />

      <div className="st-workspace">
        <aside className="st-sidebar">
          <div className="st-panel-tabs">
            <button
              type="button"
              className={`st-tab-btn ${leftTab === 'structure' ? 'is-active' : ''}`}
              onClick={() => setLeftTab('structure')}
            >
              <Layers size={14} />
              <span>Cấu trúc</span>
            </button>
            <button
              type="button"
              className={`st-tab-btn ${leftTab === 'design' ? 'is-active' : ''}`}
              onClick={() => setLeftTab('design')}
            >
              <Palette size={14} />
              <span>Thiết kế</span>
            </button>
            <button
              type="button"
              className={`st-tab-btn ${leftTab === 'templates' ? 'is-active' : ''}`}
              onClick={() => setLeftTab('templates')}
            >
              <LayoutTemplate size={14} />
              <span>Mẫu & SEO</span>
            </button>
          </div>

          <div className="st-scroll-body">
            {leftTab === 'structure' && (
              <StructurePanel
                sections={spec.sections}
                selectedSectionId={selectedSectionId}
                onSelectSection={(id) => {
                  setSelectedSectionId(id);
                  scrollToCanvasSection(id);
                }}
                onReorderSection={handleReorderSection}
                onMoveSection={handleMoveSection}
                onToggleVisible={handleToggleVisible}
                onDuplicateSection={handleDuplicateSection}
                onDeleteSection={handleDeleteSection}
                onAddSection={handleAddSection}
              />
            )}
            {leftTab === 'design' && (
              <DesignPanel
                theme={spec.theme}
                onChangeTheme={(theme) => commitSpec({ ...spec, theme })}
              />
            )}
            {leftTab === 'templates' && (
              <TemplatesSpecPanel
                currentTemplateId={spec.templateId}
                meta={spec.meta}
                onSelectTemplate={handleSelectTemplate}
                onUpdateMeta={(meta) => commitSpec({ ...spec, meta })}
                onImportSpec={(imported) => {
                  commitSpec(imported);
                  setAiSuggestions(runLocalAudit(imported));
                  setSelectedSectionId(imported.sections[0]?.id ?? null);
                  showToast('Đã nhập file Spec thành công.');
                }}
                onResetDefault={() => handleSelectTemplate('creator-store')}
              />
            )}
          </div>
        </aside>

        <main className="st-canvas-stage" onClick={() => setSelectedSectionId(null)}>
          <div className={`st-canvas-frame is-${viewport}`}>
            {previewState && (
              <div className="st-preview-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={16} />
                  <span>{previewState.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="st-btn st-btn-sm st-btn-primary"
                    onClick={() => {
                      const applied = previewState.spec;
                      setPreviewState(null);
                      commitSpec(applied);
                      setAiSuggestions(runLocalAudit(applied));
                      showToast('Đã chấp nhận bản chỉnh sửa từ AI.');
                    }}
                  >
                    <Check size={13} />
                    <span>Chấp nhận</span>
                  </button>
                  <button
                    type="button"
                    className="st-btn st-btn-sm"
                    onClick={() => setPreviewState(null)}
                  >
                    <X size={13} />
                    <span>Thoát xem thử</span>
                  </button>
                </div>
              </div>
            )}

            <LandingPage
              spec={displaySpec}
              clientSlug={activeProject.slug}
              editorProps={{
                selectedSectionId,
                previewHighlightSectionId: previewState?.highlightSectionId,
                onSelectSection: handleSelectSection,
                onMoveSection: handleMoveSection,
                onDuplicateSection: handleDuplicateSection,
                onToggleVisible: handleToggleVisible,
                onDeleteSection: handleDeleteSection,
              }}
            />
          </div>
        </main>

        {aiPanelOpen ? (
          <AiAssistantPanel
            spec={spec}
            isPreviewing={Boolean(previewState)}
            previewLabel={previewState?.label}
            onStartPreview={(previewSpec, label, highlightSectionId) => {
              setPreviewState({ spec: previewSpec, label, highlightSectionId });
              if (highlightSectionId) scrollToCanvasSection(highlightSectionId);
            }}
            onStopPreview={() => setPreviewState(null)}
            onApplySpec={(nextSpec, msg) => {
              commitSpec(nextSpec);
              setAiSuggestions(runLocalAudit(nextSpec));
              showToast(msg);
            }}
            onClose={() => {
              setPreviewState(null);
              setAiPanelOpen(false);
            }}
            suggestions={aiSuggestions}
            onSetSuggestions={setAiSuggestions}
          />
        ) : (
          <SectionInspector
            section={selectedSection}
            onUpdateSection={handleUpdateSection}
            onDeleteSection={handleDeleteSection}
          />
        )}
      </div>

      <SpecModal
        open={specModalOpen}
        spec={spec}
        onClose={() => setSpecModalOpen(false)}
        onApplySpec={(next) => {
          commitSpec(next);
          setAiSuggestions(runLocalAudit(next));
          showToast('Đã cập nhật trang theo Spec JSON mới.');
        }}
      />

      <OrdersDrawer
        open={ordersOpen}
        orders={orders}
        leads={leads}
        onClose={() => setOrdersOpen(false)}
        onClearAll={() => {
          clearOrders();
          clearLeads();
          void clearOrdersOnServer();
          setOrders([]);
          setLeads([]);
          showToast('Đã xóa toàn bộ danh sách đơn & liên hệ.');
        }}
      />

      <ProjectsDrawer
        open={projectsOpen}
        projects={projectsState.projects}
        activeProjectId={activeProject.id}
        onClose={() => setProjectsOpen(false)}
        onSelectProject={(id) => {
          const found = projectsState.projects.find((p) => p.id === id);
          if (found) switchActiveProject(found);
        }}
        onCreateProject={(params) => {
          const created = createClientProject(projectsState.projects, params);
          setProjectsState((prev) => {
            const next = [created, ...prev.projects];
            saveProjectsState(next, created.id);
            flushProjectsToServer(next, created.id);
            return { projects: next, activeProjectId: created.id };
          });
          setHistory({ past: [], present: created.spec, future: [] });
          setAiSuggestions(runLocalAudit(created.spec));
          setLastPublishedUrl(undefined);
          setProjectsOpen(false);
          showToast(`Đã tạo dự án mới cho "${created.clientName}".`);
        }}
        onDuplicateProject={(source) => {
          const copy = duplicateClientProject(projectsState.projects, source);
          setProjectsState((prev) => {
            const next = [copy, ...prev.projects];
            saveProjectsState(next, prev.activeProjectId);
            flushProjectsToServer(next, prev.activeProjectId);
            return { ...prev, projects: next };
          });
          showToast(`Đã tạo phiên bản sao: ${copy.projectName}`);
        }}
        onDeleteProject={(id) => {
          if (projectsState.projects.length <= 1) return;
          const remaining = projectsState.projects.filter((p) => p.id !== id);
          const nextActive =
            id === activeProject.id ? remaining[0] : activeProject;
          setProjectsState({
            projects: remaining,
            activeProjectId: nextActive.id,
          });
          saveProjectsState(remaining, nextActive.id);
          flushProjectsToServer(remaining, nextActive.id);
          if (id === activeProject.id) {
            setHistory({ past: [], present: nextActive.spec, future: [] });
            setAiSuggestions(runLocalAudit(nextActive.spec));
          }
          showToast('Đã xóa dự án.');
        }}
        onUpdateStatus={(id, status: ProjectStatus) => {
          setProjectsState((prev) => {
            const next = prev.projects.map((p) =>
              p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
            );
            saveProjectsState(next, prev.activeProjectId);
            flushProjectsToServer(next, prev.activeProjectId);
            return { ...prev, projects: next };
          });
        }}
      />

      <PublishModal
        open={publishOpen}
        project={activeProject}
        isPublishing={isPublishing}
        lastPublishedUrl={lastPublishedUrl}
        onClose={() => setPublishOpen(false)}
        onPublishToServer={handlePublishSite}
        onDownloadHtml={handleDownloadHtml}
        onDownloadSpecJson={handleDownloadSpecJson}
      />

      <SecurityModal
        open={securityOpen}
        storageMode={storageMode}
        envManaged={Boolean(authStatus?.envManaged)}
        onClose={() => setSecurityOpen(false)}
        onLoggedOut={() => onLoggedOut?.()}
      />

      {toast && (
        <div className="st-toast" role="status">
          <CheckCircle2 size={16} color="#4ade80" />
          <span>{toast.message}</span>
          {toast.linkHref && (
            <a
              href={toast.linkHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#60a5fa',
                textDecoration: 'underline',
                fontWeight: 700,
                marginLeft: 4,
              }}
            >
              {toast.linkLabel || toast.linkHref}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

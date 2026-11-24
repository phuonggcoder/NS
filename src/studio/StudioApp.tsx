import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, Eye, Layers, LayoutTemplate, Palette, X } from 'lucide-react';
import type { AiSuggestion } from '../ai/aiTypes';
import { runLocalAudit } from '../ai/localAuditor';
import { createDefaultSection, getSectionLabel, getTemplateSpec } from '../data/templates';
import {
  buildStandaloneHtml,
  downloadTextFile,
  publishSiteToServer,
} from '../exporter/exportHtml';
import { LandingPage } from '../renderer/LandingPage';
import { StudioFocusProvider } from '../renderer/StudioFocusContext';
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
  createClientReviewToken,
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
import { AnalyticsDrawer } from './AnalyticsDrawer';
import { CanvasStage, type CanvasStageHandle } from './CanvasStage';
import { DesignPanel } from './DesignPanel';
import { SectionInspector } from './inspector/SectionInspector';
import { DigitalMenuEditor } from './menu/DigitalMenuEditor';
import { OrdersDrawer } from './OrdersDrawer';
import { ProjectsDrawer } from './ProjectsDrawer';
import { PublishModal } from './PublishModal';
import { SecurityModal } from './SecurityModal';
import { SeoPanel } from './SeoPanel';
import { SpecModal } from './SpecModal';
import { StructurePanel } from './StructurePanel';
import { TemplatesSpecPanel } from './TemplatesSpecPanel';
import { TopBar } from './TopBar';
import { VersionHistoryDrawer } from './VersionHistoryDrawer';
import './studio.css';

type LeftTab = 'structure' | 'design' | 'templates';

const MAX_HISTORY = 40;

interface StudioAppProps {
  authStatus?: AuthStatusResponse;
  onLoggedOut?: () => void;
}

export function StudioApp({ authStatus, onLoggedOut }: StudioAppProps) {
  const [projectsState, setProjectsState] = useState(() => loadProjectsState());
  const projectsRef = useRef(projectsState);
  projectsRef.current = projectsState;

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
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [cleanPreview, setCleanPreview] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    () => spec.sections.find((s) => s.type === 'hero')?.id ?? spec.sections[0]?.id ?? null
  );
  const [activeFocus, setActiveFocus] = useState<{
    sectionId: string;
    fieldKey: string | null;
    fieldLabel: string;
  } | null>(null);
  const canvasRef = useRef<CanvasStageHandle>(null);
  const suppressAutoPanRef = useRef(false);

  // Cloud / Server Persistence Status
  const [storageMode, setStorageMode] = useState<StorageMode>(
    authStatus?.storageMode ?? 'browser'
  );
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'offline'>(
    authStatus?.staticFallback ? 'offline' : 'saved'
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
  const [menuEditorOpen, setMenuEditorOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

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
    actionLabel?: string;
    onAction?: () => void;
    isError?: boolean;
  } | null>(null);

  const showToast = useCallback(
    (
      message: string,
      linkHref?: string,
      linkLabel?: string,
      extra?: { actionLabel?: string; onAction?: () => void; isError?: boolean }
    ) => {
      setToast({ message, linkHref, linkLabel, ...extra });
    },
    []
  );

  useEffect(() => {
    if (!toast) return;
    const duration = toast.linkHref ? 5400 : 3200;
    const timer = window.setTimeout(() => setToast(null), duration);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const applyProjectsState = useCallback(
    (nextProjects: ClientProject[], nextActiveId: string) => {
      const nextState = { projects: nextProjects, activeProjectId: nextActiveId };
      projectsRef.current = nextState;
      saveProjectsState(nextProjects, nextActiveId);
      setProjectsState(nextState);
    },
    []
  );

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
        saveStoredSpec(activeProj.spec);
        applyProjectsState(res.projects, nextActiveId);
        setHistory({ past: [], present: activeProj.spec, future: [] });
        setAiSuggestions(runLocalAudit(activeProj.spec));
        setLastPublishedUrl(activeProj.publishedUrl);
        setActiveFocus(null);
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
  }, [applyProjectsState, authStatus?.staticFallback, onLoggedOut]);

  // Sync spec into localStorage + active project + debounced cloud/server save
  useEffect(() => {
    saveStoredSpec(spec);
    const current = projectsRef.current;
    const nextProjects = updateSpecInProject(current.projects, current.activeProjectId, spec);
    const targetActiveId = current.activeProjectId;
    applyProjectsState(nextProjects, targetActiveId);

    if (!hydratedFromServerRef.current || authStatus?.staticFallback) {
      return;
    }

    setSyncStatus('saving');
    setHasUnsavedChanges(true);
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = window.setTimeout(() => {
      syncTimerRef.current = null;
      void saveProjectsToServer(nextProjects, targetActiveId).then((res) => {
        if (res.unauthorized) {
          onLoggedOut?.();
          return;
        }
        if (res.storageMode) setStorageMode(res.storageMode);
        if (res.ok) {
          setSyncStatus('saved');
          setHasUnsavedChanges(false);
        } else {
          setSyncStatus('error');
          showToast(
            'Lỗi đồng bộ: Chưa lưu được dữ liệu lên server!',
            undefined,
            undefined,
            {
              isError: true,
              actionLabel: 'Thử lại ngay',
              onAction: () => {
                void flushSyncNow();
              },
            }
          );
        }
      });
    }, 900);

    return () => {
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, [spec, applyProjectsState, authStatus?.staticFallback, onLoggedOut, showToast]);

  // Prevent accidental tab close / reload while saving, offline/error, or dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const isDirtyOrUnsynced =
        syncStatus === 'saving' ||
        syncStatus === 'error' ||
        (syncStatus === 'offline' && !authStatus?.staticFallback) ||
        hasUnsavedChanges;
      if (isDirtyOrUnsynced) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [syncStatus, hasUnsavedChanges, authStatus?.staticFallback]);

  const flushProjectsToServer = useCallback(
    (projects: ClientProject[], activeId: string) => {
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      if (authStatus?.staticFallback) return;
      setSyncStatus('saving');
      void saveProjectsToServer(projects, activeId).then((res) => {
        if (res.unauthorized) {
          onLoggedOut?.();
          return;
        }
        if (res.storageMode) setStorageMode(res.storageMode);
        if (res.ok) {
          setSyncStatus('saved');
          setHasUnsavedChanges(false);
        } else {
          setSyncStatus('error');
        }
      });
    },
    [authStatus?.staticFallback, onLoggedOut]
  );

  const flushSyncNow = useCallback(async (): Promise<boolean> => {
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    if (authStatus?.staticFallback) return false;
    const { projects, activeProjectId } = projectsRef.current;
    const latestProjects = updateSpecInProject(projects, activeProjectId, spec);
    applyProjectsState(latestProjects, activeProjectId);
    saveStoredSpec(spec);
    setSyncStatus('saving');
    const res = await saveProjectsToServer(latestProjects, activeProjectId);
    if (res.unauthorized) {
      onLoggedOut?.();
      return false;
    }
    if (res.storageMode) setStorageMode(res.storageMode);
    if (res.ok) {
      setSyncStatus('saved');
      setHasUnsavedChanges(false);
      return true;
    }
    setSyncStatus('error');
    showToast(
      'Không thể lưu lên server. Vui lòng kiểm tra kết nối và thử lại.',
      undefined,
      undefined,
      {
        isError: true,
        actionLabel: 'Thử lại ngay',
        onAction: () => {
          void flushSyncNow();
        },
      }
    );
    return false;
  }, [applyProjectsState, authStatus?.staticFallback, onLoggedOut, showToast, spec]);

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

  const focusCanvasTarget = useCallback((id: string, fieldKey?: string | null) => {
    canvasRef.current?.focusTarget(id, fieldKey);
  }, []);

  const handleSelectSection = (id: string) => {
    setSelectedSectionId(id);
    setActiveFocus((prev) => (prev && prev.sectionId === id ? prev : null));
    if (aiPanelOpen && !previewState) {
      setAiPanelOpen(false);
    }
  };

  const handleFocusFromCanvas = useCallback(
    (sectionId: string, fieldKey: string, fieldLabel: string) => {
      setSelectedSectionId(sectionId);
      setActiveFocus({ sectionId, fieldKey, fieldLabel });
      if (aiPanelOpen && !previewState) {
        setAiPanelOpen(false);
      }
      setRightPanelOpen(true);
      window.setTimeout(() => {
        const fieldEl = document.querySelector(
          `.st-inspector [data-inspector-field="${fieldKey}"]`
        ) as HTMLElement | null;
        if (fieldEl) {
          fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const focusable = fieldEl.querySelector(
            'input, textarea, select'
          ) as HTMLElement | null;
          if (focusable) {
            suppressAutoPanRef.current = true;
            focusable.focus({ preventScroll: true });
            window.setTimeout(() => {
              suppressAutoPanRef.current = false;
            }, 20);
          }
        }
      }, 45);
    },
    [aiPanelOpen, previewState]
  );

  const handleFocusFromInspector = useCallback(
    (fieldKey: string, fieldLabel: string) => {
      if (!selectedSectionId) return;
      setActiveFocus({ sectionId: selectedSectionId, fieldKey, fieldLabel });
      if (suppressAutoPanRef.current) {
        suppressAutoPanRef.current = false;
        return;
      }
      canvasRef.current?.focusTarget(selectedSectionId, fieldKey);
    },
    [selectedSectionId]
  );

  const handleJumpToFocus = useCallback(() => {
    if (activeFocus) {
      canvasRef.current?.focusTarget(activeFocus.sectionId, activeFocus.fieldKey);
      return;
    }
    if (selectedSectionId) {
      canvasRef.current?.focusTarget(selectedSectionId, null);
    }
  }, [activeFocus, selectedSectionId]);

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
    setActiveFocus(null);
    setAiPanelOpen(false);
    setRightPanelOpen(true);
    focusCanvasTarget(created.id);
    showToast('Đã thêm khối mới vào trang.');
  };

  const handleUpdateSection = (updated: LandingSection) => {
    const nextSections = spec.sections.map((s) => (s.id === updated.id ? updated : s));
    commitSpec({ ...spec, sections: nextSections });
  };

  const handleSelectTemplate = (templateId: string, preserveBrand = false) => {
    const nextSpec = getTemplateSpec(templateId);
    if (preserveBrand) {
      nextSpec.meta = {
        ...nextSpec.meta,
        title: spec.meta.title,
        description: spec.meta.description,
        ogTitle: spec.meta.ogTitle,
        ogDescription: spec.meta.ogDescription,
        ogImage: spec.meta.ogImage,
        canonicalUrl: spec.meta.canonicalUrl,
      };
      if (spec.digitalMenu && !nextSpec.digitalMenu) {
        nextSpec.digitalMenu = cloneSpec(spec.digitalMenu);
      }
    }
    commitSpec(nextSpec);
    setPreviewState(null);
    setActiveFocus(null);
    setAiSuggestions(runLocalAudit(nextSpec));
    const nextId =
      nextSpec.sections.find((s) => s.type === 'hero')?.id ?? nextSpec.sections[0]?.id ?? null;
    setSelectedSectionId(nextId);
    if (nextId) focusCanvasTarget(nextId);
    showToast('Đã áp dụng mẫu giao diện mới.');
  };

  const switchActiveProject = (project: ClientProject) => {
    setPreviewState(null);
    setActiveFocus(null);
    setHistory({ past: [], present: project.spec, future: [] });
    setAiSuggestions(runLocalAudit(project.spec));
    setLastPublishedUrl(project.publishedUrl);
    setSelectedSectionId(
      project.spec.sections.find((s) => s.type === 'hero')?.id ??
        project.spec.sections[0]?.id ??
        null
    );
    applyProjectsState(projectsRef.current.projects, project.id);
    flushProjectsToServer(projectsRef.current.projects, project.id);
    showToast(`Đang chỉnh sửa dự án: ${project.projectName}`);
  };

  const handlePublishSite = async () => {
    setIsPublishing(true);
    try {
      await flushSyncNow();
      const html = buildStandaloneHtml(spec, activeProject.slug);
      const res = await publishSiteToServer(spec, html, activeProject.slug);
      if (res.unauthorized) {
        onLoggedOut?.();
        return;
      }
      if (res.ok) {
        const targetUrl = res.clientUrl || res.siteUrl || '/site.html';
        setLastPublishedUrl(targetUrl);
        const current = projectsRef.current;
        const nextProjects = updateSpecInProject(current.projects, current.activeProjectId, spec, {
          status: 'published',
          publishedUrl: targetUrl,
        });
        applyProjectsState(nextProjects, current.activeProjectId);
        flushProjectsToServer(nextProjects, current.activeProjectId);
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
  const currentActiveFieldKey =
    activeFocus && activeFocus.sectionId === selectedSectionId ? activeFocus.fieldKey : null;
  const currentActiveFieldLabel =
    activeFocus && activeFocus.sectionId === selectedSectionId ? activeFocus.fieldLabel : null;
  const activeFocusTrail = currentActiveFieldLabel
    ? `${selectedSection ? getSectionLabel(selectedSection.type) : 'Khối'} · ${currentActiveFieldLabel}`
    : selectedSection
      ? getSectionLabel(selectedSection.type)
      : null;

  return (
    <div className="st-shell">
      <TopBar
        activeProject={activeProject}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        ordersCount={orders.length}
        leadsCount={leads.length}
        aiIssuesCount={pendingAiCount}
        aiPanelOpen={aiPanelOpen}
        leftPanelOpen={leftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        syncStatus={syncStatus}
        storageMode={storageMode}
        activeFocusTrail={activeFocusTrail}
        onJumpToFocus={handleJumpToFocus}
        onSaveNow={() => {
          void flushSyncNow().then((saved) => {
            if (saved) showToast('Đã lưu toàn bộ thay đổi lên server.');
          });
        }}
        onToggleLeftPanel={() => setLeftPanelOpen((prev) => !prev)}
        onToggleRightPanel={() => setRightPanelOpen((prev) => !prev)}
        onToggleAiPanel={() =>
          setAiPanelOpen((prev) => {
            const next = !prev;
            if (next) setRightPanelOpen(true);
            return next;
          })
        }
        onOpenDigitalMenu={() => setMenuEditorOpen(true)}
        onOpenVersions={() => setVersionsOpen(true)}
        onOpenSeo={() => setSeoOpen(true)}
        onOpenAnalytics={() => setAnalyticsOpen(true)}
        onOpenProjects={() => setProjectsOpen(true)}
        onOpenOrders={() => {
          void syncInbox();
          setOrdersOpen(true);
        }}
        onOpenSpecModal={() => setSpecModalOpen(true)}
        onOpenSecurity={() => setSecurityOpen(true)}
        onOpenLivePreview={async () => {
          await flushSyncNow();
          window.open(
            `/?mode=live&from=studio&slug=${encodeURIComponent(activeProject.slug)}`,
            '_blank',
            'noopener,noreferrer'
          );
        }}
        onOpenPublishModal={() => {
          void flushSyncNow();
          setPublishOpen(true);
        }}
      />

      <div
        className={`st-workspace ${!leftPanelOpen ? 'is-left-hidden' : ''} ${
          !rightPanelOpen ? 'is-right-hidden' : ''
        }`}
      >
        {leftPanelOpen && (
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
                    setActiveFocus(null);
                    focusCanvasTarget(id);
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
                  onChangeTheme={(theme) => {
                    setPreviewState(null);
                    commitSpec({ ...spec, theme });
                  }}
                  onPreviewTheme={(previewTheme, label) =>
                    setPreviewState({ spec: { ...spec, theme: previewTheme }, label })
                  }
                />
              )}
              {leftTab === 'templates' && (
                <TemplatesSpecPanel
                  currentTemplateId={spec.templateId}
                  currentSpec={spec}
                  meta={spec.meta}
                  onSelectTemplate={handleSelectTemplate}
                  onPreviewTemplate={(previewSpec, label) =>
                    setPreviewState({ spec: previewSpec, label })
                  }
                  onUpdateMeta={(meta) => commitSpec({ ...spec, meta })}
                  onImportSpec={(imported) => {
                    commitSpec(imported);
                    setActiveFocus(null);
                    setAiSuggestions(runLocalAudit(imported));
                    const nextId = imported.sections[0]?.id ?? null;
                    setSelectedSectionId(nextId);
                    if (nextId) focusCanvasTarget(nextId);
                    showToast('Đã nhập file Spec thành công.');
                  }}
                  onResetDefault={() => handleSelectTemplate('creator-store')}
                />
              )}
            </div>
          </aside>
        )}

        <CanvasStage
          ref={canvasRef}
          viewport={viewport}
          cleanPreview={cleanPreview}
          canJumpToFocus={Boolean(activeFocus || selectedSectionId)}
          activeFocusLabel={activeFocusTrail}
          onViewportChange={setViewport}
          onToggleCleanPreview={() => setCleanPreview((prev) => !prev)}
          onJumpToFocus={handleJumpToFocus}
          onBackgroundClick={() => {
            setSelectedSectionId(null);
            setActiveFocus(null);
          }}
        >
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

          <StudioFocusProvider
            value={{
              isStudio: true,
              cleanPreview,
              selectedSectionId,
              activeFieldKey: currentActiveFieldKey,
              activeFieldLabel: currentActiveFieldLabel,
              onFocusField: handleFocusFromCanvas,
            }}
          >
            <LandingPage
              spec={displaySpec}
              clientSlug={activeProject.slug}
              editorProps={{
                selectedSectionId,
                cleanPreview,
                previewHighlightSectionId: previewState?.highlightSectionId,
                onSelectSection: handleSelectSection,
                onMoveSection: handleMoveSection,
                onDuplicateSection: handleDuplicateSection,
                onToggleVisible: handleToggleVisible,
                onDeleteSection: handleDeleteSection,
              }}
            />
          </StudioFocusProvider>
        </CanvasStage>

        {rightPanelOpen &&
          (aiPanelOpen ? (
            <AiAssistantPanel
              spec={spec}
              isPreviewing={Boolean(previewState)}
              previewLabel={previewState?.label}
              onStartPreview={(previewSpec, label, highlightSectionId) => {
                setPreviewState({ spec: previewSpec, label, highlightSectionId });
                if (highlightSectionId) focusCanvasTarget(highlightSectionId);
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
              activeFieldKey={currentActiveFieldKey}
              onFocusField={handleFocusFromInspector}
              onJumpToCanvas={handleJumpToFocus}
              onUpdateSection={handleUpdateSection}
              onDeleteSection={handleDeleteSection}
            />
          ))}
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
          const created = createClientProject(projectsRef.current.projects, params);
          const next = [created, ...projectsRef.current.projects];
          applyProjectsState(next, created.id);
          flushProjectsToServer(next, created.id);
          setHistory({ past: [], present: created.spec, future: [] });
          setActiveFocus(null);
          setAiSuggestions(runLocalAudit(created.spec));
          setLastPublishedUrl(undefined);
          setProjectsOpen(false);
          showToast(`Đã tạo dự án mới cho "${created.clientName}".`);
        }}
        onDuplicateProject={(source) => {
          const copy = duplicateClientProject(projectsRef.current.projects, source);
          const next = [copy, ...projectsRef.current.projects];
          applyProjectsState(next, projectsRef.current.activeProjectId);
          flushProjectsToServer(next, projectsRef.current.activeProjectId);
          showToast(`Đã tạo phiên bản sao: ${copy.projectName}`);
        }}
        onDeleteProject={(id) => {
          if (projectsRef.current.projects.length <= 1) return;
          const remaining = projectsRef.current.projects.filter((p) => p.id !== id);
          const nextActive = id === activeProject.id ? remaining[0] : activeProject;
          applyProjectsState(remaining, nextActive.id);
          flushProjectsToServer(remaining, nextActive.id);
          if (id === activeProject.id) {
            setActiveFocus(null);
            setHistory({ past: [], present: nextActive.spec, future: [] });
            setAiSuggestions(runLocalAudit(nextActive.spec));
          }
          showToast('Đã xóa dự án.');
        }}
        onUpdateStatus={(id, status: ProjectStatus) => {
          const next = projectsRef.current.projects.map((p) =>
            p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
          );
          applyProjectsState(next, projectsRef.current.activeProjectId);
          flushProjectsToServer(next, projectsRef.current.activeProjectId);
        }}
      />

      <PublishModal
        open={publishOpen}
        project={activeProject}
        isPublishing={isPublishing}
        lastPublishedUrl={lastPublishedUrl}
        onClose={() => setPublishOpen(false)}
        onPublishToServer={handlePublishSite}
        onRegenerateReviewToken={() => {
          const nextToken = createClientReviewToken();
          const current = projectsRef.current;
          const nextProjects = current.projects.map((p) =>
            p.id === current.activeProjectId
              ? { ...p, reviewToken: nextToken, status: 'review' as ProjectStatus, updatedAt: new Date().toISOString() }
              : p
          );
          applyProjectsState(nextProjects, current.activeProjectId);
          flushProjectsToServer(nextProjects, current.activeProjectId);
          showToast('Đã tạo lại mã Review Token mới cho khách duyệt.');
        }}
        onDownloadHtml={handleDownloadHtml}
        onDownloadSpecJson={handleDownloadSpecJson}
      />

      <DigitalMenuEditor
        open={menuEditorOpen}
        slug={activeProject.slug}
        brandTitle={activeProject.projectName}
        templateId={spec.templateId}
        menu={spec.digitalMenu}
        onChange={(digitalMenu) => commitSpec({ ...spec, digitalMenu })}
        onClose={() => setMenuEditorOpen(false)}
      />

      <VersionHistoryDrawer
        open={versionsOpen}
        slug={activeProject.slug}
        currentSpec={spec}
        onClose={() => setVersionsOpen(false)}
        onPreviewVersion={(verSpec, label) => setPreviewState({ spec: verSpec, label })}
        onRestoredSpec={(restoredSpec, label) => {
          setPreviewState(null);
          commitSpec(restoredSpec);
          setAiSuggestions(runLocalAudit(restoredSpec));
          showToast(`Đã khôi phục phiên bản: ${label}`);
        }}
      />

      <SeoPanel
        open={seoOpen}
        slug={activeProject.slug}
        spec={spec}
        onUpdateMeta={(meta) => commitSpec({ ...spec, meta })}
        onUpdateMenuSeo={(seo) => {
          if (!spec.digitalMenu) return;
          commitSpec({ ...spec, digitalMenu: { ...spec.digitalMenu, seo } });
        }}
        onClose={() => setSeoOpen(false)}
      />

      <AnalyticsDrawer
        open={analyticsOpen}
        projects={projectsState.projects}
        activeSlug={activeProject.slug}
        onClose={() => setAnalyticsOpen(false)}
      />

      <SecurityModal
        open={securityOpen}
        storageMode={storageMode}
        envManaged={Boolean(authStatus?.envManaged)}
        onClose={() => setSecurityOpen(false)}
        onLoggedOut={() => onLoggedOut?.()}
      />

      {toast && (
        <div
          className="st-toast"
          role="status"
          style={toast.isError ? { background: '#7f1d1d', border: '1px solid #ef4444' } : undefined}
        >
          <CheckCircle2 size={16} color={toast.isError ? '#fca5a5' : '#4ade80'} />
          <span>{toast.message}</span>
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              className="st-btn st-btn-sm"
              style={{ marginLeft: 6, background: '#ffffff', color: '#0f172a' }}
              onClick={() => {
                setToast(null);
                toast.onAction?.();
              }}
            >
              {toast.actionLabel}
            </button>
          )}
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

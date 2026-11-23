import { getTemplateSpec } from '../data/templates';
import type {
  ClientFeedbackItem,
  ClientProject,
  LandingPageSpec,
  ProjectStatus,
} from '../types/spec';
import { cloneSpec, generateId, loadStoredSpec } from './storage';

const PROJECTS_KEY = 'specpage_projects_v1';
const ACTIVE_PROJECT_KEY = 'specpage_active_project_v1';
const FEEDBACK_KEY = 'specpage_feedback_v1';

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; color: string; bg: string }
> = {
  draft: { label: 'Bản nháp', color: '#475569', bg: '#E2E8F0' },
  review: { label: 'Chờ khách duyệt', color: '#B45309', bg: '#FEF3C7' },
  approved: { label: 'Khách đã duyệt', color: '#15803D', bg: '#DCFCE7' },
  published: { label: 'Đã xuất bản', color: '#1D4ED8', bg: '#DBEAFE' },
};

export function slugifyVietnamese(input: string): string {
  const normalized = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return normalized || `khach-hang-${Date.now().toString(36)}`;
}

function makeUniqueSlug(baseSlug: string, existing: ClientProject[]): string {
  const used = new Set(existing.map((p) => p.slug));
  if (!used.has(baseSlug)) return baseSlug;
  let counter = 2;
  while (used.has(`${baseSlug}-${counter}`)) counter++;
  return `${baseSlug}-${counter}`;
}

export function loadProjectsState(): {
  projects: ClientProject[];
  activeProjectId: string;
} {
  try {
    const raw = window.localStorage.getItem(PROJECTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ClientProject[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const storedActive = window.localStorage.getItem(ACTIVE_PROJECT_KEY);
        const active =
          parsed.find((p) => p.id === storedActive)?.id ?? parsed[0].id;
        return { projects: parsed, activeProjectId: active };
      }
    }
  } catch {
    // Fall through to migration/default creation
  }

  const migratedSpec = loadStoredSpec() ?? getTemplateSpec('creator-store');
  const firstProject: ClientProject = {
    id: generateId('proj'),
    slug: 'du-an-mau',
    projectName: migratedSpec.meta.title.split('—')[0]?.trim() || 'Dự án chính',
    clientName: 'Khách hàng mặc định',
    status: 'draft',
    notes: 'Dự án khởi tạo đầu tiên',
    updatedAt: new Date().toISOString(),
    spec: migratedSpec,
  };
  saveProjectsState([firstProject], firstProject.id);
  return { projects: [firstProject], activeProjectId: firstProject.id };
}

export function saveProjectsState(
  projects: ClientProject[],
  activeProjectId: string
): void {
  try {
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    window.localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
  } catch {
    // Ignore storage quota error
  }
}

export function createClientProject(
  existing: ClientProject[],
  params: {
    projectName: string;
    clientName: string;
    templateId: string;
    notes?: string;
  }
): ClientProject {
  const slug = makeUniqueSlug(slugifyVietnamese(params.projectName), existing);
  const spec = getTemplateSpec(params.templateId);
  spec.meta.title = `${params.projectName} — ${params.clientName}`;
  return {
    id: generateId('proj'),
    slug,
    projectName: params.projectName.trim() || 'Dự án mới',
    clientName: params.clientName.trim() || 'Khách hàng mới',
    status: 'draft',
    notes: params.notes?.trim() || '',
    updatedAt: new Date().toISOString(),
    spec,
  };
}

export function duplicateClientProject(
  existing: ClientProject[],
  source: ClientProject
): ClientProject {
  const copyName = `${source.projectName} (Bản 2)`;
  const slug = makeUniqueSlug(slugifyVietnamese(`${source.slug}-v2`), existing);
  return {
    ...cloneSpec(source),
    id: generateId('proj'),
    slug,
    projectName: copyName,
    status: 'draft',
    updatedAt: new Date().toISOString(),
    publishedUrl: undefined,
  };
}

export function loadLocalFeedback(): ClientFeedbackItem[] {
  try {
    const raw = window.localStorage.getItem(FEEDBACK_KEY);
    return raw ? (JSON.parse(raw) as ClientFeedbackItem[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalFeedback(item: ClientFeedbackItem): ClientFeedbackItem[] {
  const next = [item, ...loadLocalFeedback()].slice(0, 100);
  try {
    window.localStorage.setItem(FEEDBACK_KEY, JSON.stringify(next));
  } catch {
    // Ignore
  }
  return next;
}

export async function submitFeedbackToServer(item: ClientFeedbackItem): Promise<void> {
  saveLocalFeedback(item);
  try {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
  } catch {
    // Works gracefully offline/static via localStorage
  }
}

export function readLocalSpecReadOnly(slugParam: string | null): LandingPageSpec | null {
  try {
    const rawProjects = window.localStorage.getItem(PROJECTS_KEY);
    if (rawProjects) {
      const parsed = JSON.parse(rawProjects) as ClientProject[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (slugParam) {
          const bySlug = parsed.find((p) => p && p.slug === slugParam);
          if (bySlug?.spec && Array.isArray(bySlug.spec.sections)) {
            return bySlug.spec;
          }
        } else {
          const activeId = window.localStorage.getItem(ACTIVE_PROJECT_KEY);
          const active = parsed.find((p) => p && p.id === activeId) ?? parsed[0];
          if (active?.spec && Array.isArray(active.spec.sections)) {
            return active.spec;
          }
        }
      }
    }
  } catch {
    // Ignore invalid JSON
  }
  return slugParam ? null : loadStoredSpec();
}

export async function fetchFeedbackForSlug(slug: string): Promise<ClientFeedbackItem[]> {
  const local = loadLocalFeedback().filter((f) => f.clientSlug === slug);
  try {
    const res = await fetch(`/api/feedback?slug=${encodeURIComponent(slug)}`, {
      credentials: 'same-origin',
    });
    if (!res.ok) return local;
    const data = (await res.json()) as { items?: ClientFeedbackItem[] };
    if (!Array.isArray(data.items)) return local;
    const byId = new Map<string, ClientFeedbackItem>();
    [...data.items, ...local].forEach((entry) => byId.set(entry.id, entry));
    return Array.from(byId.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return local;
  }
}

export function updateSpecInProject(
  projects: ClientProject[],
  projectId: string,
  spec: LandingPageSpec,
  patchMeta?: Partial<Pick<ClientProject, 'status' | 'publishedUrl' | 'projectName' | 'clientName'>>
): ClientProject[] {
  return projects.map((p) =>
    p.id === projectId
      ? {
          ...p,
          ...patchMeta,
          spec,
          updatedAt: new Date().toISOString(),
        }
      : p
  );
}

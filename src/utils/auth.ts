import type { ClientProject } from '../types/spec';

export type StorageMode = 'upstash' | 'supabase' | 'local' | 'browser';

export interface AuthStatusResponse {
  ok: boolean;
  configured: boolean;
  envManaged: boolean;
  authenticated: boolean;
  storageMode: StorageMode;
  staticFallback?: boolean;
}

export async function fetchAuthStatus(): Promise<AuthStatusResponse> {
  try {
    const res = await fetch('/api/auth/status', { credentials: 'same-origin' });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return {
        ok: false,
        configured: false,
        envManaged: false,
        authenticated: true,
        storageMode: 'browser',
        staticFallback: true,
      };
    }
    return (await res.json()) as AuthStatusResponse;
  } catch {
    return {
      ok: false,
      configured: false,
      envManaged: false,
      authenticated: true,
      storageMode: 'browser',
      staticFallback: true,
    };
  }
}

export async function setupAdminPassword(
  password: string,
  rememberMe: boolean
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/auth/setup', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, rememberMe }),
  });
  return (await res.json()) as { ok: boolean; error?: string };
}

export async function loginAdmin(
  password: string,
  rememberMe: boolean
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, rememberMe }),
  });
  return (await res.json()) as { ok: boolean; error?: string };
}

export async function logoutAdmin(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  } catch {
    // Ignore
  }
}

export async function changePasswordOnServer(
  currentPassword: string,
  nextPassword: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, nextPassword }),
  });
  return (await res.json()) as { ok: boolean; error?: string };
}

export async function fetchProjectsFromServer(): Promise<{
  ok: boolean;
  unauthorized?: boolean;
  storageMode?: StorageMode;
  projects: ClientProject[] | null;
  activeProjectId: string | null;
}> {
  try {
    const res = await fetch('/api/projects', { credentials: 'same-origin' });
    if (res.status === 401) {
      return { ok: false, unauthorized: true, projects: null, activeProjectId: null };
    }
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return { ok: false, projects: null, activeProjectId: null };
    }
    const data = (await res.json()) as {
      ok?: boolean;
      storageMode?: StorageMode;
      projects?: ClientProject[] | null;
      activeProjectId?: string | null;
    };
    return {
      ok: Boolean(data.ok),
      storageMode: data.storageMode,
      projects: Array.isArray(data.projects) ? data.projects : null,
      activeProjectId: typeof data.activeProjectId === 'string' ? data.activeProjectId : null,
    };
  } catch {
    return { ok: false, projects: null, activeProjectId: null };
  }
}

export async function saveProjectsToServer(
  projects: ClientProject[],
  activeProjectId: string
): Promise<{ ok: boolean; unauthorized?: boolean; storageMode?: StorageMode }> {
  try {
    const res = await fetch('/api/projects', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projects, activeProjectId }),
    });
    if (res.status === 401) {
      return { ok: false, unauthorized: true };
    }
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return { ok: false };
    }
    const data = (await res.json()) as { ok?: boolean; storageMode?: StorageMode };
    return { ok: Boolean(data.ok), storageMode: data.storageMode };
  } catch {
    return { ok: false };
  }
}

export async function clearOrdersOnServer(): Promise<void> {
  try {
    await fetch('/api/orders', { method: 'DELETE', credentials: 'same-origin' });
  } catch {
    // Ignore offline
  }
}

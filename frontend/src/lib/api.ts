export type ApiResult<T> = { data?: T; error?: string };

export const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem('token') || undefined;
}

function getRefreshToken() {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem('refreshToken') || undefined;
}

function setTokens(token?: string, refreshToken?: string) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('token', token);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
}

async function doRefresh(rt: string, timeoutMs = 8000) {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
        signal: ctrl.signal,
      });
      const isJson = res.headers.get('content-type')?.includes('application/json');
      const body = isJson ? await res.json() : undefined;
      if (!res.ok) return { error: (body?.error as string) || res.statusText } as ApiResult<Pick<AuthResponse, 'token'|'refreshToken'>>;
      return { data: body } as ApiResult<Pick<AuthResponse, 'token'|'refreshToken'>>;
    } finally {
      clearTimeout(id);
    }
  } catch (e: any) {
    const msg = e?.name === 'AbortError' ? 'Request timed out' : (e?.message || 'Network error');
    return { error: msg };
  }
}

export async function api<T>(path: string, init: RequestInit = {}, timeoutMs = 8000): Promise<ApiResult<T>> {
  try {
    const headers: HeadersInit = { 'Content-Type': 'application/json', ...(init.headers || {}) };
    const token = getToken();
    if (token) (headers as any)['Authorization'] = `Bearer ${token}`;
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(`${BASE}${path}`, { ...init, headers, signal: ctrl.signal });
    } finally {
      clearTimeout(id);
    }
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const body = isJson ? await res.json() : undefined;
    if (!res.ok) {
      // Try refresh on 401 once
      if (res.status === 401 && path !== '/auth/refresh') {
        const rt = getRefreshToken();
        if (rt) {
          const refreshed = await doRefresh(rt, timeoutMs);
          if (refreshed.data?.token && refreshed.data?.refreshToken) {
            setTokens(refreshed.data.token, refreshed.data.refreshToken);
            const retryHeaders: HeadersInit = { 'Content-Type': 'application/json', ...(init.headers || {}) };
            (retryHeaders as any)['Authorization'] = `Bearer ${refreshed.data.token}`;
            const retryCtrl = new AbortController();
            const retryId = setTimeout(() => retryCtrl.abort(), timeoutMs);
            try {
              const retryRes = await fetch(`${BASE}${path}`, { ...init, headers: retryHeaders, signal: retryCtrl.signal });
              const retryIsJson = retryRes.headers.get('content-type')?.includes('application/json');
              const retryBody = retryIsJson ? await retryRes.json() : undefined;
              if (!retryRes.ok) {
                return { error: (retryBody?.error as string) || retryRes.statusText };
              }
              return { data: retryBody } as ApiResult<T>;
            } finally {
              clearTimeout(retryId);
            }
          }
        }
      }
      return { error: (body?.error as string) || res.statusText };
    }
    return { data: body } as ApiResult<T>;
  } catch (e: any) {
    const msg = e?.name === 'AbortError' ? 'Request timed out' : (e?.message || 'Network error');
    return { error: msg };
  }
}

export type User = { id: number; username: string; created_at: string };
export type AuthResponse = { token: string; refreshToken: string; user: User };
export type Conversation = { id: number; user_id: number; title: string; created_at: string; updated_at: string };
export type Message = { id: number; conversation_id: number; content: string; role: 'user'|'assistant'|'system'; timestamp: string; token_count?: number };

export const AuthAPI = {
  login: (username: string, password: string) => api<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username: string, password: string) => api<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  refresh: (refreshToken: string) => api<Pick<AuthResponse, 'token' | 'refreshToken'>>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
};

export const ConversationsAPI = {
  list: () => api<Conversation[]>('/conversations'),
  create: (title: string) => api<Conversation>('/conversations', { method: 'POST', body: JSON.stringify({ title }) }),
  get: (id: number) => api<Conversation & { messages: Message[] }>(`/conversations/${id}`),
  rename: (id: number, title: string) => api<Conversation>(`/conversations/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
  remove: (id: number) => api<void>(`/conversations/${id}`, { method: 'DELETE' }),
  send: (id: number, content: string) => api<{ user: Message; assistant: Message }>(`/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
};

export async function pingHealth(timeoutMs = 3000): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${BASE}/health`, { signal: ctrl.signal });
    clearTimeout(id);
    return res.ok;
  } catch {
    return false;
  }
}

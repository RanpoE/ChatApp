export type ApiResult<T> = { data?: T; error?: string };

export const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem('token') || undefined;
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
      return { error: (body?.error as string) || res.statusText };
    }
    return { data: body } as ApiResult<T>;
  } catch (e: any) {
    const msg = e?.name === 'AbortError' ? 'Request timed out' : (e?.message || 'Network error');
    return { error: msg };
  }
}

export type User = { id: number; username: string; created_at: string };
export type AuthResponse = { token: string; user: User };
export type Conversation = { id: number; user_id: number; title: string; created_at: string; updated_at: string };
export type Message = { id: number; conversation_id: number; content: string; role: 'user'|'assistant'|'system'; timestamp: string; token_count?: number };

export const AuthAPI = {
  login: (username: string, password: string) => api<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username: string, password: string) => api<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
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

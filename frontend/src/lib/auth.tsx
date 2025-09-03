"use client";

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User, AuthResponse } from './api';

type AuthState = { user?: User; token?: string; login: (r: AuthResponse) => void; logout: () => void; ready: boolean };

const AuthCtx = createContext<AuthState>({ login: () => {}, logout: () => {}, ready: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User|undefined>();
  const [token, setToken] = useState<string|undefined>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('token') || undefined;
    const u = localStorage.getItem('user');
    setToken(t);
    if (u) {
      try { setUser(JSON.parse(u)); } catch {}
    }
    setReady(true);
  }, []);

  const login = (r: AuthResponse) => {
    localStorage.setItem('token', r.token);
    localStorage.setItem('user', JSON.stringify(r.user));
    setToken(r.token);
    setUser(r.user);
  };
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(undefined);
    setUser(undefined);
  };

  const value = useMemo(() => ({ user, token, login, logout, ready }), [user, token, ready]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}


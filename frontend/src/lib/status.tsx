"use client";

import { createContext, useContext, useMemo } from 'react';

type Status = { online: boolean; lastChecked?: number; checking: boolean; checkNow: () => void };

const Ctx = createContext<Status>({ online: true, checking: false, checkNow: () => {} });

export function BackendStatusProvider({ children }: { children: React.ReactNode }) {
  // Backend status check removed: always report online with no network calls
  const value = useMemo<Status>(() => ({ online: true, checking: false, checkNow: () => {} }), []);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useBackendStatus = () => useContext(Ctx);

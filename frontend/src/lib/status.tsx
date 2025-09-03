"use client";

import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { pingHealth } from '@/lib/api';

type Status = { online: boolean; lastChecked?: number; checking: boolean; checkNow: () => void };

const Ctx = createContext<Status>({ online: true, checking: false, checkNow: () => {} });

export function BackendStatusProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<number | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doCheck = useCallback(async () => {
    setChecking(true);
    const ok = await pingHealth(1500);
    setOnline(ok);
    setChecking(false);
    setLastChecked(Date.now());
  }, []);

  useEffect(() => {
    // initial check on mount (client-only)
    doCheck();
    // periodic checks
    timerRef.current = setInterval(doCheck, 10000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [doCheck]);

  return (
    <Ctx.Provider value={{ online, checking, lastChecked, checkNow: doCheck }}>
      {children}
    </Ctx.Provider>
  );
}

export const useBackendStatus = () => useContext(Ctx);

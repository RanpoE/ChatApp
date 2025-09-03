"use client";

import { ReactNode, useEffect } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { hydrateFromStorage } from '@/store/authSlice';
import { BackendStatusProvider } from '@/lib/status';

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => { store.dispatch(hydrateFromStorage()); }, []);
  return (
    <ThemeProvider>
      <Provider store={store}>
        <BackendStatusProvider>
          {children}
        </BackendStatusProvider>
      </Provider>
    </ThemeProvider>
  );
}

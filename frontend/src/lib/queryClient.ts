"use client";

import { QueryClient } from '@tanstack/react-query';

// Module-scoped singleton QueryClient for the app router
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});


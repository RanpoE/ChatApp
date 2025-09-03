import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User, AuthResponse } from '@/lib/api';

export type AuthState = { user?: User; token?: string; refreshToken?: string; ready: boolean };

const initialState: AuthState = {
  user: undefined,
  token: undefined,
  refreshToken: undefined,
  ready: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateFromStorage(state) {
      if (typeof window === 'undefined') return;
      try {
        const t = localStorage.getItem('token') || undefined;
        const rt = localStorage.getItem('refreshToken') || undefined;
        const uStr = localStorage.getItem('user');
        state.token = t;
        state.refreshToken = rt;
        if (uStr) state.user = JSON.parse(uStr);
      } catch {}
      state.ready = true;
    },
    loginSuccess(state, action: PayloadAction<AuthResponse>) {
      const { token, refreshToken, user } = action.payload;
      state.token = token;
      state.refreshToken = refreshToken;
      state.user = user;
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
      }
    },
    logout(state) {
      state.token = undefined;
      state.refreshToken = undefined;
      state.user = undefined;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    },
  },
});

export const { hydrateFromStorage, loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;

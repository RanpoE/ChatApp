"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthAPI, ConversationsAPI, type Conversation, type Message, type AuthResponse } from '@/lib/api';
import { useAppDispatch } from '@/store/hooks';
import { loginSuccess } from '@/store/authSlice';

// Query Keys
export const qk = {
  conversations: ['conversations'] as const,
  conversation: (id: number) => ['conversation', id] as const,
};

// Auth hooks
export function useLogin() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await AuthAPI.login(username, password);
      if (!res.data) throw new Error(res.error || 'Login failed');
      return res.data as AuthResponse;
    },
    onSuccess: (auth) => { dispatch(loginSuccess(auth)); },
  });
}

export function useRegister() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await AuthAPI.register(username, password);
      if (!res.data) throw new Error(res.error || 'Registration failed');
      return res.data as AuthResponse;
    },
    onSuccess: (auth) => { dispatch(loginSuccess(auth)); },
  });
}

// Conversations
export function useConversations() {
  return useQuery({
    queryKey: qk.conversations,
    queryFn: async () => {
      const res = await ConversationsAPI.list();
      if (res.error) throw new Error(res.error);
      return res.data as Conversation[];
    },
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => ConversationsAPI.create(title),
    onSuccess: async (res) => {
      if (!res.error) await qc.invalidateQueries({ queryKey: qk.conversations });
    },
  });
}

export function useRenameConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) => ConversationsAPI.rename(id, title),
    onSuccess: async (res, vars) => {
      if (!res.error) {
        await Promise.all([
          qc.invalidateQueries({ queryKey: qk.conversations }),
          qc.invalidateQueries({ queryKey: qk.conversation(vars.id) }),
        ]);
      }
    },
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ConversationsAPI.remove(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.conversations });
    },
  });
}

export function useConversation(id?: number) {
  return useQuery({
    queryKey: id ? qk.conversation(id) : ['conversation', 'missing'],
    enabled: !!id,
    queryFn: async () => {
      const res = await ConversationsAPI.get(id as number);
      if (res.error) throw new Error(res.error);
      return res.data as Conversation & { messages: Message[] };
    },
  });
}

export function useSendMessage(conversationId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => ConversationsAPI.send(conversationId, content),
    onSuccess: async () => {
      // Update list ordering/updated_at, keep conversation detail under local control
      await qc.invalidateQueries({ queryKey: qk.conversations });
    },
  });
}

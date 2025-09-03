import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Conversation, Message } from '@/lib/api';

export type LocalMessage = Message & { _status?: 'sent'|'delivered'|'error' };

export type ChatState = {
  conversations: Conversation[];
  currentId?: number;
  messagesByConv: Record<number, LocalMessage[]>;
  typingByConv: Record<number, boolean>;
};

const initialState: ChatState = {
  conversations: [],
  currentId: undefined,
  messagesByConv: {},
  typingByConv: {},
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations(state, action: PayloadAction<Conversation[]>) {
      state.conversations = action.payload;
    },
    addConversation(state, action: PayloadAction<Conversation>) {
      state.conversations = [action.payload, ...state.conversations];
    },
    setCurrentConversation(state, action: PayloadAction<number|undefined>) {
      state.currentId = action.payload;
    },
    setMessages(state, action: PayloadAction<{ id: number; messages: LocalMessage[] }>) {
      state.messagesByConv[action.payload.id] = action.payload.messages;
    },
    addMessage(state, action: PayloadAction<{ id: number; message: LocalMessage }>) {
      const arr = state.messagesByConv[action.payload.id] || (state.messagesByConv[action.payload.id] = []);
      arr.push(action.payload.message);
    },
    replaceMessage(state, action: PayloadAction<{ id: number; tempId: number; real: LocalMessage }>) {
      const arr = state.messagesByConv[action.payload.id];
      if (!arr) return;
      const idx = arr.findIndex(m => m.id === action.payload.tempId);
      if (idx !== -1) arr[idx] = action.payload.real;
      else arr.push(action.payload.real);
    },
    setTyping(state, action: PayloadAction<{ id: number; typing: boolean }>) {
      state.typingByConv[action.payload.id] = action.payload.typing;
    },
    markError(state, action: PayloadAction<{ id: number; tempId: number }>) {
      const arr = state.messagesByConv[action.payload.id];
      if (!arr) return;
      const idx = arr.findIndex(m => m.id === action.payload.tempId);
      if (idx !== -1) arr[idx] = { ...arr[idx], _status: 'error' } as LocalMessage;
    }
  }
});

export const { setConversations, addConversation, setCurrentConversation, setMessages, addMessage, replaceMessage, setTyping, markError } = chatSlice.actions;
export default chatSlice.reducer;


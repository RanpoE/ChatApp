"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { ConversationsAPI, type Message } from '@/lib/api';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setMessages as setMessagesAction, addMessage, replaceMessage, setTyping as setTypingAction, markError } from '@/store/chatSlice';
import { useBackendStatus } from '@/lib/status';

type LocalMessage = Message & { _status?: 'sent' | 'delivered' | 'error' };

export default function ChatView() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const id = Number(Array.isArray(rawId) ? rawId[0] : rawId);
  const dispatch = useAppDispatch();
  const messages = useAppSelector(s => (Number.isFinite(id) ? s.chat.messagesByConv[id] : undefined)) || null;
  const [title, setTitle] = useState<string>('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const typing = useAppSelector(s => (Number.isFinite(id) ? s.chat.typingByConv[id] : false));
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const msgRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const { online } = useBackendStatus();

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    ConversationsAPI.get(id).then(r => {
      if (r.data) {
        const m = (r.data.messages || []).slice().reverse(); // backend returns desc; show asc
        dispatch(setMessagesAction({ id, messages: m as LocalMessage[] }));
        setTitle(r.data.title);
        setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }), 0);
      }
    });
    // focus input when conversation changes
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [id, dispatch]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (!online) {
      // keep focus and show a quick shake via autofocus cycle
      inputRef.current?.focus();
      return;
    }
    if (!input.trim()) {
      // keep focus for quick typing
      inputRef.current?.focus();
      return;
    }
    // keep focus on input even if button gets focus
    inputRef.current?.focus();
    setSending(true);
    dispatch(setTypingAction({ id, typing: true }));

    // Optimistically render the user's message immediately
    const tempId = -Date.now();
    const userContent = input.trim();
    const tempUser: LocalMessage = {
      id: tempId,
      conversation_id: id,
      content: userContent,
      role: 'user',
      timestamp: new Date().toISOString(),
      token_count: undefined,
      _status: 'sent',
    };
    dispatch(addMessage({ id, message: tempUser }));
    setInput('');
    // Scroll right after adding the user's bubble
    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 0);

    const started = Date.now();
    const r = await ConversationsAPI.send(id, userContent);
    const elapsed = Date.now() - started;
    const wait = Math.max(0, 2000 - elapsed);
    if (wait > 0) await new Promise(res => setTimeout(res, wait));
    setSending(false);
    dispatch(setTypingAction({ id, typing: false }));
    if (r.data) {
      dispatch(replaceMessage({ id, tempId, real: { ...r.data.user, _status: 'delivered' } as LocalMessage }));
      dispatch(addMessage({ id, message: r.data.assistant as LocalMessage }));
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 50);
    } else {
      dispatch(markError({ id, tempId }));
    }
    // re-focus input after send
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const onRename = async () => {
    const newTitle = prompt('Rename conversation', title);
    if (!newTitle) return;
    const r = await ConversationsAPI.rename(id, newTitle);
    if (r.data) setTitle(r.data.title);
  };

  // Memo: only messages matching the query (or all if no query)
  const visibleMessages = useMemo(() => {
    if (!messages) return null;
    const q = query.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(m => m.content.toLowerCase().includes(q));
  }, [messages, query]);

  // When filtering, scroll to the latest visible message
  useEffect(() => {
    if (!visibleMessages?.length) return;
    const last = visibleMessages[visibleMessages.length - 1];
    const el = msgRefs.current[last.id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [visibleMessages]);

  const highlight = (text: string, q: string) => {
    const needle = q.trim();
    if (!needle) return <>{text}</>;
    const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${esc})`, 'ig');
    const parts = text.split(re);
    return (
      <>
        {parts.map((part, idx) =>
          re.test(part) ? (
            <mark key={idx} className="bg-yellow-300/60 dark:bg-yellow-500/30 rounded px-0.5">
              {part}
            </mark>
          ) : (
            <span key={idx}>{part}</span>
          )
        )}
      </>
    );
  };

  if (!Number.isFinite(id)) return <div className="p-6">Invalid conversation</div>;
  if (!messages) return <div className="p-6">Loading…</div>;

  return (
    <div className="flex-1 min-h-0 grid grid-rows-[auto_1fr_auto]">
      <header className="border-b px-3 sm:px-4 py-2 flex items-center gap-2">
        <h1 className="text-base sm:text-lg font-semibold flex-1 truncate">{title}</h1>
        <Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search messages" className="max-w-[12rem] hidden sm:block h-9" />
        <Button variant="outline" onClick={onRename}>Rename</Button>
      </header>
      <div ref={listRef} className="overflow-auto p-3 sm:p-4 space-y-3 bg-muted/30">
        {visibleMessages?.map(m => (
          <div key={m.id} ref={(el) => { msgRefs.current[m.id] = el; }} className={`max-w-[85%] md:max-w-2xl lg:max-w-3xl ${m.role==='user' ? 'ml-auto' : ''}`}>
            <div className={`px-3 py-2 rounded-2xl ${m.role==='user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border rounded-bl-sm'}`}>
              <div className="whitespace-pre-wrap break-words leading-relaxed">{highlight(m.content, query)}</div>
            </div>
            {m.role === 'user' && (
              <div className={`mt-1 text-[11px] text-muted-foreground ${m.role==='user' ? 'text-right' : ''}`}>
                {m._status === 'error' ? 'error' : m._status === 'delivered' ? 'delivered' : m._status === 'sent' ? 'sent' : ''}
              </div>
            )}
          </div>
        ))}
        {query.trim() && visibleMessages?.length === 0 && (
          <div className="text-sm text-muted-foreground">No messages match &quot;{query}&quot;</div>
        )}
        {typing && (
          <div className="max-w-3xl">
            <div className="px-3 py-2 rounded bg-card border inline-flex items-center gap-2 text-muted-foreground">
              <span className="text-sm">Assistant is typing</span>
              <span className="animate-pulse">…</span>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={onSend} className="border-t p-2 sm:p-3 flex gap-2 bg-background pb-[env(safe-area-inset-bottom)]">
        <Input ref={inputRef} autoFocus value={input} onChange={e=>setInput(e.target.value)} placeholder={online ? "Send a message…" : "Backend offline"} className="h-11" disabled={!online} />
        <Button type="submit" loading={sending} disabled={!online || sending || !input.trim()} className="h-11">Send</Button>
      </form>
    </div>
  );
}

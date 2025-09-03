"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ConversationsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModeToggle } from '@/components/mode-toggle';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addConversation, setConversations } from '@/store/chatSlice';
import { logout } from '@/store/authSlice';
import { Menu, X } from 'lucide-react';
import { useBackendStatus } from '@/lib/status';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);
  const ready = useAppSelector(s => s.auth.ready);
  const items = useAppSelector(s => s.chat.conversations);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('New Chat');
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { online } = useBackendStatus();

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    ConversationsAPI.list().then(r => { if (r.data) dispatch(setConversations(r.data)); });
  }, [ready, user, router, dispatch]);

  const onNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const r = await ConversationsAPI.create(title || 'New Chat');
    setCreating(false);
    if (r.data) {
      dispatch(addConversation(r.data));
      router.push(`/chat/${r.data.id}`);
    }
  };

  const currentId = pathname?.startsWith('/chat/') ? Number(pathname.split('/')[2]) : undefined;

  if (!ready) return null;
  if (!user) return null;

  return (
    <div className="h-dvh min-h-0 flex">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex w-72 shrink-0 border-r p-3 flex-col gap-3 min-h-0">
        <div className="flex items-center justify-between">
          <div className="text-sm">Signed in as <span className="font-semibold">{user.username}</span></div>
          <ModeToggle />
        </div>
        <form onSubmit={onNew} className="flex gap-2">
          <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder={online ? "New chat title" : "Backend offline"} disabled={!online} />
          <Button type="submit" loading={creating} disabled={!online}>New</Button>
        </form>
        <nav className="flex-1 overflow-auto space-y-1">
          {items.map(c => (
            <Link key={c.id} href={`/chat/${c.id}`} className={`block truncate px-2 py-1 rounded hover:bg-muted ${currentId===c.id ? 'bg-muted font-medium' : ''}`}>
              {c.title}
            </Link>
          ))}
        </nav>
        <Button variant="outline" onClick={() => { dispatch(logout()); router.push('/login'); }}>Logout</Button>
      </aside>

      {/* Mobile overlay sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-background border-r p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="text-sm">{user.username}</div>
              <button aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} className="p-2 rounded hover:bg-muted"><X size={18} /></button>
            </div>
            <form onSubmit={(e)=>{onNew(e); setSidebarOpen(false);}} className="flex gap-2">
              <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder={online ? "New chat title" : "Backend offline"} disabled={!online} />
              <Button type="submit" loading={creating} disabled={!online}>New</Button>
            </form>
            <nav className="flex-1 overflow-auto space-y-1">
              {items.map(c => (
                <Link key={c.id} href={`/chat/${c.id}`} onClick={()=>setSidebarOpen(false)} className={`block truncate px-2 py-1 rounded hover:bg-muted ${currentId===c.id ? 'bg-muted font-medium' : ''}`}>
                  {c.title}
                </Link>
              ))}
            </nav>
            <Button variant="outline" onClick={() => { dispatch(logout()); router.push('/login'); }}>Logout</Button>
          </div>
        </div>
      )}

      {/* Main */}
      <section className="flex-1 min-w-0 min-h-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="md:hidden border-b px-3 py-2 flex items-center gap-2">
          <button aria-label="Open sidebar" onClick={()=>setSidebarOpen(true)} className="p-2 rounded hover:bg-muted"><Menu size={20} /></button>
          <div className="font-medium">Chat</div>
          <div className="ml-auto"><ModeToggle /></div>
        </div>
        <div className="min-h-0 flex-1 flex flex-col">
          {children}
        </div>
      </section>
    </div>
  );
}

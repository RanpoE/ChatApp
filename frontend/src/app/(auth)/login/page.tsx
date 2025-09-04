"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBackendStatus } from '@/lib/status';
import { useLogin } from '@/hooks/queries';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string|undefined>();
  const { online, checking } = useBackendStatus();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    login.mutate(
      { username, password },
      {
        onSuccess: () => router.push('/chat'),
        onError: (err: unknown) =>
          setError(err instanceof Error ? err.message : 'Login failed'),
      }
    );
  };

  // Always client-rendered
  
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border rounded-lg p-6">
        <h1 className="text-xl font-semibold">Login</h1>
        {!online && (
          <div className="text-sm rounded-md border border-red-300/60 bg-red-100/40 text-red-700 p-2">
            Backend is offline. {checking ? 'Checking…' : 'Please try again later.'}
          </div>
        )}
        <div className="space-y-2">
          <label className="text-sm">Username</label>
          <Input autoFocus value={username} onChange={e=>setUsername(e.target.value)} placeholder="yourname" required minLength={3} />
        </div>
        <div className="space-y-2">
          <label className="text-sm">Password</label>
          <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" loading={login.isPending} disabled={!online}>Sign in</Button>
        <p className="text-sm text-muted-foreground">No account? <Link className="underline" href="/register">Register</Link></p>
      </form>
    </main>
  );
}

"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthAPI } from '@/lib/api';
import { useAppDispatch } from '@/store/hooks';
import { loginSuccess } from '@/store/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const ready = true;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|undefined>();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(undefined);
    const { data, error } = await AuthAPI.register(username, password);
    setLoading(false);
    if (error || !data) return setError(error || 'Registration failed');
    dispatch(loginSuccess(data));
    router.push('/chat');
  };

  // Always client-rendered

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border rounded-lg p-6">
        <h1 className="text-xl font-semibold">Register</h1>
        <div className="space-y-2">
          <label className="text-sm">Username</label>
          <Input autoFocus value={username} onChange={e=>setUsername(e.target.value)} placeholder="yourname" required minLength={3} />
        </div>
        <div className="space-y-2">
          <label className="text-sm">Password</label>
          <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" loading={loading}>Create account</Button>
        <p className="text-sm text-muted-foreground">Have an account? <Link className="underline" href="/login">Login</Link></p>
      </form>
    </main>
  );
}

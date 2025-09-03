"use client";

import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-dvh grid place-items-center p-6">
      <div className="max-w-md w-full border rounded-lg p-6 space-y-3">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">{error?.message || 'Internal error'}</p>
        <div className="flex gap-2 pt-2">
          <button onClick={() => reset()} className="px-4 py-2 text-sm rounded-md border">Try again</button>
          <Link href="/login" className="px-4 py-2 text-sm rounded-md border">Go to Login</Link>
          <Link href="/" className="px-4 py-2 text-sm rounded-md border">Home</Link>
        </div>
      </div>
    </div>
  );
}

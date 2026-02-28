'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function getSafeRedirect(url: string | null) {
    if (!url) return '/';
    if (url.startsWith('/') && !url.startsWith('//')) return url;
    return '/';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const callbackUrl = getSafeRedirect(searchParams.get('callbackUrl'));
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (!res || res.error) {
      setError('Nieprawidłowy email lub hasło');
      return;
    }

    const nextUrl = res?.url ? getSafeRedirect(res.url) : callbackUrl;
    router.push(nextUrl);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border bg-background p-6"
      >
        <div>
          <h1 className="text-xl font-semibold">Zaloguj się</h1>
          <p className="text-sm text-muted-foreground">Panel rodzica / trenera</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Hasło</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {loading ? 'Logowanie...' : 'Zaloguj się'}
        </button>
      </form>
    </main>
  );
}

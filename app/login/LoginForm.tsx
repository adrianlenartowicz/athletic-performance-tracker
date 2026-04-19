'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function LoginForm() {
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
      if (res?.error === 'RateLimit') {
        setError('Za dużo prób logowania. Spróbuj ponownie za 15 minut.');
      } else {
        setError('Nieprawidłowy email lub hasło');
      }
      return;
    }

    const nextUrl = res?.url ? getSafeRedirect(res.url) : callbackUrl;
    router.push(nextUrl);
  }

  return (
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

      <div className="text-right">
        <Link href="/reset-password" className="text-sm text-primary underline-offset-4 hover:underline">
          Nie pamiętasz hasła?
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        {loading ? 'Logowanie...' : 'Zaloguj się'}
      </button>
    </form>
  );
}

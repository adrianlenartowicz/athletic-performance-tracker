'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { resetPasswordWithToken } from '../actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success' }
  | {
      status: 'error';
      message: string;
      fieldErrors?: {
        password?: string;
        confirmPassword?: string;
      };
    };

export default function ResetPasswordWithTokenPage() {
  const params = useParams();
  const router = useRouter();
  const token = Array.isArray(params?.token) ? params?.token[0] : params?.token;

  const [state, setState] = useState<SubmitState>({ status: 'idle' });

  async function handleSubmit(formData: FormData) {
    if (!token || typeof token !== 'string') {
      setState({ status: 'error', message: 'Nieprawidłowy link resetu.' });
      return;
    }

    setState({ status: 'submitting' });

    const result = await resetPasswordWithToken(token, formData);

    if (result.success) {
      setState({ status: 'success' });
      setTimeout(() => router.push('/login'), 1500);
      return;
    }

    if (result.error === 'expired') {
      setState({ status: 'error', message: 'Link resetu wygasł.' });
      return;
    }

    if (result.error === 'validation') {
      setState({
        status: 'error',
        message: 'Popraw błędy w formularzu.',
        fieldErrors: result.fieldErrors,
      });
      return;
    }

    setState({ status: 'error', message: 'Nieprawidłowe dane.' });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-4 p-6">
          <div>
            <h1 className="text-xl font-semibold">Ustaw nowe hasło</h1>
            <p className="text-sm text-muted-foreground">
              Wpisz nowe hasło, a następnie potwierdź.
            </p>
            <p className="text-sm text-muted-foreground">Minimum 10 znaków.</p>
          </div>

          {state.status === 'success' ? (
            <p className="text-sm">Hasło zostało zmienione. Przekierowuję...</p>
          ) : (
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nowe hasło</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={10}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  autoComplete="new-password"
                />
                {state.status === 'error' && state.fieldErrors?.password && (
                  <p className="text-sm text-destructive">{state.fieldErrors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Potwierdź hasło</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={10}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  autoComplete="new-password"
                />
                {state.status === 'error' && state.fieldErrors?.confirmPassword && (
                  <p className="text-sm text-destructive">{state.fieldErrors.confirmPassword}</p>
                )}
              </div>

              {state.status === 'error' && (
                <p className="text-sm text-destructive">{state.message}</p>
              )}

              <Button type="submit" disabled={state.status === 'submitting'} className="w-full">
                {state.status === 'submitting' ? 'Zapisywanie...' : 'Zapisz hasło'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

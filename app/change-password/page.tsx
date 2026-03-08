'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { changePassword } from './actions';
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
        currentPassword?: string;
        newPassword?: string;
        confirmPassword?: string;
      };
    };

export default function ChangePasswordPage() {
  const router = useRouter();
  const [state, setState] = useState<SubmitState>({ status: 'idle' });

  async function handleSubmit(formData: FormData) {
    setState({ status: 'submitting' });

    const result = await changePassword(formData);

    if (result.success) {
      setState({ status: 'success' });
      setTimeout(() => router.push('/'), 1000);
      return;
    }

    if (result.error === 'wrong_current') {
      setState({ status: 'error', message: 'Aktualne hasło jest nieprawidłowe.' });
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
            <h1 className="text-xl font-semibold">Zmień hasło</h1>
            <p className="text-sm text-muted-foreground">
              Ze względów bezpieczeństwa ustaw nowe hasło.
            </p>
            <p className="text-sm text-muted-foreground">Minimum 10 znaków.</p>
          </div>

          {state.status === 'success' ? (
            <p className="text-sm">Hasło zostało zmienione. Przekierowuję...</p>
          ) : (
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Aktualne hasło</label>
                <input
                  type="password"
                  name="currentPassword"
                  required
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  autoComplete="current-password"
                />
                {state.status === 'error' && state.fieldErrors?.currentPassword && (
                  <p className="text-sm text-destructive">{state.fieldErrors.currentPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nowe hasło</label>
                <input
                  type="password"
                  name="newPassword"
                  required
                  minLength={10}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  autoComplete="new-password"
                />
                {state.status === 'error' && state.fieldErrors?.newPassword && (
                  <p className="text-sm text-destructive">{state.fieldErrors.newPassword}</p>
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

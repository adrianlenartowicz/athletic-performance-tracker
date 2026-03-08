'use client';

import { useState } from 'react';
import { requestPasswordReset } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ResetPasswordRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      await requestPasswordReset(formData);
      setSubmitted(true);
    } catch (e) {
      setError('Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-4 p-6">
          <div>
            <h1 className="text-xl font-semibold">Reset hasła</h1>
            <p className="text-sm text-muted-foreground">
              Podaj email, a wyślemy link do zresetowania hasła.
            </p>
          </div>

          {submitted ? (
            <p className="text-sm">Jeśli konto istnieje, wysłaliśmy link do resetu hasła.</p>
          ) : (
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  autoComplete="email"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Wysyłanie...' : 'Wyślij link'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

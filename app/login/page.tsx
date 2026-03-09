import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40">
      <Suspense
        fallback={
          <div className="w-full max-w-sm rounded-lg border bg-background p-6 text-sm text-muted-foreground">
            Ładowanie...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}

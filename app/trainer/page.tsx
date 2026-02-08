import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function TrainerPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'TRAINER') {
    redirect('/children');
  }

  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto max-w-xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Panel trenera</h1>
          <p className="text-sm text-muted-foreground">Wybierz, co chcesz zrobić</p>
        </header>

        <div className="grid gap-4">
          <a
            href="/trainer/test-session"
            className="rounded-lg border bg-background p-4 hover:bg-muted transition"
          >
            <div className="font-medium">Nowa sesja testowa</div>
            <div className="text-sm text-muted-foreground">Wprowadzanie wyników podczas testów</div>
          </a>
        </div>
      </div>
    </main>
  );
}

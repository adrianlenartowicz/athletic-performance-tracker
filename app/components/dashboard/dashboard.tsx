import { ReactNode } from 'react';

type DashboardLayoutProps = {
  headerSlot?: ReactNode;
  children: ReactNode;
};

export function DashboardLayout({ headerSlot, children }: DashboardLayoutProps) {
  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Postępy dziecka</h1>
          <p className="text-sm text-muted-foreground">
            Podsumowanie wyników i rozwoju sprawności
          </p>

          {headerSlot}
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {children}
        </section>
      </div>
    </main>
  );
}

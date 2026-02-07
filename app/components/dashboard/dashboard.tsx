import { ReactNode } from 'react';
import Header from '@/app/components/app/AppHeader';

type DashboardLayoutProps = {
  children: ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <main className="min-h-screen bg-muted/40">
      <Header />

      <div className="mx-auto max-w-7xl p-6">
        <section className="grid gap-6 md:grid-cols-2">{children}</section>
      </div>
    </main>
  );
}

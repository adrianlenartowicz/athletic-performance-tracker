import { requireAdmin } from '@/lib/auth';
import LogoutButton from '@/app/components/app/LogoutButton';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-6">
          <Link href="/admin" className="text-sm font-medium">
            Admin
          </Link>
          <LogoutButton />
        </div>
      </header>
      <main className="px-6 py-10">{children}</main>
    </div>
  );
}

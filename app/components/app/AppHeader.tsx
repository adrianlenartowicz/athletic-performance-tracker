import { auth } from '@/lib/auth';
import LogoutButton from '@/app/components/app/LogoutButton';
import Link from 'next/link';

export default async function AppHeader() {
  const session = await auth();

  if (!session?.user) return null;

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href="/children" className="text-sm text-muted-foreground hover:underline">
          ← Wróć do listy dzieci
        </Link>

        <LogoutButton />
      </div>
    </header>
  );
}

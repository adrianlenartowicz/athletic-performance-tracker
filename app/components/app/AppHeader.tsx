import { auth } from '@/lib/auth';
import LogoutButton from '@/app/components/app/LogoutButton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function AppHeader() {
  const session = await auth();

  if (!session?.user) return null;

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/children">← Wróć do listy dzieci</Link>
        </Button>

        <LogoutButton />
      </div>
    </header>
  );
}

import { auth } from '@/lib/auth';
import LogoutButton from '@/app/components/app/LogoutButton';

export default async function Header() {
  const session = await auth();

  if (!session?.user) return null;

  return (
    <header className="flex items-center justify-between border-b bg-background px-6 py-4">
      <div className="text-sm text-muted-foreground">Zalogowany jako {session.user.email}</div>

      <LogoutButton />
    </header>
  );
}

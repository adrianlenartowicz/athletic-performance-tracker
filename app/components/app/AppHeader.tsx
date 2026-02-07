import { auth } from '@/lib/auth';
import LogoutButton from '@/app/components/app/LogoutButton';

export default async function AppHeader() {
  const session = await auth();

  if (!session?.user) return null;

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="text-sm font-medium">
          Panel rodzica
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}

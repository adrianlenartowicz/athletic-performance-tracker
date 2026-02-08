import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getChildrenForUser } from '@/lib/queries/children';
import Link from 'next/link';

export default async function ChildrenPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  const children = await getChildrenForUser(session.user.id);

  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Lista dzieci</h1>
          <p className="text-sm text-muted-foreground">
            Wybierz dziecko, aby zobaczyć jego postępy
          </p>
        </header>

        <section
          className={`grid gap-6 ${
            children.length === 1
              ? 'grid-cols-1'
              : children.length === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
          }`}
        >
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/children/${child.id}/dashboard`}
              className="group relative rounded-xl border bg-background p-6 transition
                         hover:shadow-md hover:border-primary/40"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-medium">
                  {child.name.charAt(0)}
                </div>

                <div className="flex-1">
                  <div className="font-medium">{child.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Zobacz postępy i wyniki testów
                  </div>
                </div>

                <div className="text-muted-foreground transition group-hover:translate-x-1">→</div>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

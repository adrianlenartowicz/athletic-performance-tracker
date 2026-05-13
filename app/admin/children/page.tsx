import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getAdminChildren } from '@/lib/queries/admin';

export default async function AdminChildrenPage() {
  await requireAdmin();
  const children = await getAdminChildren();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dzieci</h1>
        <p className="text-sm text-muted-foreground">Wybierz dziecko, aby zobaczyć jego postępy</p>
      </div>

      <div className="space-y-2">
        {children.map((child) => (
          <Link
            key={child.id}
            href={`/admin/children/${child.id}/dashboard`}
            className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-muted/50"
          >
            <div>
              <span className="font-medium">{child.name}</span>
              <span className="ml-2 text-muted-foreground">
                ur. {child.birthYear} &mdash;{' '}
                {child.group.location ? `${child.group.name} (${child.group.location})` : child.group.name}
              </span>
            </div>
            <span className="text-muted-foreground">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

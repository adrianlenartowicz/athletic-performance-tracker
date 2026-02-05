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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Twoje dzieci</h1>

      <ul className="space-y-2">
        {children.map((child) => (
          <Link
            key={child.id}
            href={`/children/${child.id}/dashboard`}
            className="block p-4 rounded border hover:bg-muted"
          >
            {child.name}
          </Link>
        ))}
      </ul>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';

export default async function Home() {
  const session = await requireAuth();

  if (session.user.role === 'ADMIN') {
    redirect('/admin');
  }

  if (session.user.role === 'TRAINER') {
    redirect('/trainer');
  }

  if (session.user.role === 'PARENT') {
    redirect('/children');
  }

  redirect('/login');
}

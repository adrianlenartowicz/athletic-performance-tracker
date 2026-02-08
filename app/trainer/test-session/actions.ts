'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function startTestSession(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== 'TRAINER') redirect('/');

  const testType = formData.get('testType') as string;
  const childIds = formData.getAll('childIds') as string[];

  if (!testType || childIds.length === 0) {
    redirect('/trainer/test-session');
  }

  const params = new URLSearchParams();
  params.set('test', testType);
  childIds.forEach((id) => params.append('child', id));

  redirect(`/trainer/test-session/session?${params.toString()}`);
}

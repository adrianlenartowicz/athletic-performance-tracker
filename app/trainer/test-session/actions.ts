'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getChildrenByIds } from '@/lib/queries/children';

export async function startTestSession(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== 'TRAINER') redirect('/');

  const testType = formData.get('testType') as string;
  const childIds = formData.getAll('childIds') as string[];

  if (!testType || childIds.length === 0) {
    redirect('/trainer/test-session');
  }

  const allowedChildren = await getChildrenByIds(childIds, session.user.id);
  if (allowedChildren.length === 0) {
    redirect('/trainer/test-session');
  }

  const params = new URLSearchParams();
  params.set('test', testType);
  allowedChildren.forEach((child) => params.append('child', child.id));

  redirect(`/trainer/test-session/session?${params.toString()}`);
}

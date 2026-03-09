'use server';

import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getChildrenByIds, type TrainerChildListItem } from '@/lib/queries/children';
import { TEST_DEFINITIONS } from '@/lib/domain/tests';

function isTestType(value: string): value is keyof typeof TEST_DEFINITIONS {
  return Object.prototype.hasOwnProperty.call(TEST_DEFINITIONS, value);
}

export async function startTestSession(formData: FormData) {
  const session = await requireAuth();
  if (session.user.role !== 'TRAINER') redirect('/');

  const testType = formData.get('testType') as string;
  const childIds = formData.getAll('childIds') as string[];

  if (!testType || !isTestType(testType)) {
    redirect('/trainer/test-session');
  }

  if (childIds.length === 0) {
    redirect('/trainer/test-session');
  }

  const allowedChildren = await getChildrenByIds(childIds, session.user.id);
  if (allowedChildren.length === 0) {
    redirect('/trainer/test-session');
  }

  const params = new URLSearchParams();
  params.set('test', testType);
  allowedChildren.forEach((child: TrainerChildListItem) => params.append('child', child.id));

  redirect(`/trainer/test-session/session?${params.toString()}`);
}

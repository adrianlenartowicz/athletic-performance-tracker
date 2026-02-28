import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getChildrenByIds } from '@/lib/queries/children';
import { TEST_DEFINITIONS } from '@/lib//domain/tests';
import TrainerSessionClient from '@/app/components/trainer/TrainerSessionClient';

type Props = {
  searchParams: {
    test?: string;
    child?: string[] | string;
  };
};

export default async function TrainerSessionPage({ searchParams }: Props) {
  const session = await auth();
  if (!session || session.user.role !== 'TRAINER') redirect('/');

  const params = await searchParams;
  const testKey = params.test;
  const raw = params.child;

  if (!testKey || !TEST_DEFINITIONS[testKey as keyof typeof TEST_DEFINITIONS]) {
    redirect('/trainer/test-session');
  }

  const childIds = typeof raw === 'string' ? [raw] : Array.isArray(raw) ? raw : [];

  if (childIds.length === 0) redirect('/trainer/test-session');

  const children = await getChildrenByIds(childIds);

  return (
    <TrainerSessionClient
      test={TEST_DEFINITIONS[testKey as keyof typeof TEST_DEFINITIONS]}
      children={children}
    />
  );
}

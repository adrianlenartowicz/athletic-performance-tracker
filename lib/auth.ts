import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export function auth() {
  return getServerSession(authOptions);
}

type RequireAuthOptions = {
  allowPasswordChange?: boolean;
};

export async function requireAuth(options?: RequireAuthOptions) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mustChangePassword: true, sessionVersion: true },
  });

  if (!user) {
    redirect('/login');
  }

  const sessionVersion = (session.user as { sessionVersion?: number }).sessionVersion;
  if (sessionVersion === undefined || user.sessionVersion !== sessionVersion) {
    redirect('/login');
  }

  if (user.mustChangePassword && !options?.allowPasswordChange) {
    redirect('/change-password');
  }

  return session;
}

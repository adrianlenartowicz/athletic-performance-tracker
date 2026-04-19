import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export function auth() {
  return getServerSession(authOptions);
}

type RequireAuthInternalOptions = {
  allowMustChangePassword: boolean;
};

async function requireAuthInternal(options: RequireAuthInternalOptions) {
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

  if (session.user.sessionVersion === undefined || user.sessionVersion !== session.user.sessionVersion) {
    redirect('/login');
  }

  if (user.mustChangePassword && !options.allowMustChangePassword) {
    redirect('/change-password');
  }

  return session;
}

export async function requireAuth() {
  return requireAuthInternal({ allowMustChangePassword: false });
}

export async function requireAuthForPasswordChange() {
  return requireAuthInternal({ allowMustChangePassword: true });
}

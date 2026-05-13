'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { requireAuthForPasswordChange } from '@/lib/auth';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Wpisz aktualne hasło.'),
    newPassword: z
      .string()
      .min(10, 'Hasło musi mieć co najmniej 10 znaków.')
      .max(128, 'Hasło może mieć maksymalnie 128 znaków.'),
    confirmPassword: z
      .string()
      .min(10, 'Hasło musi mieć co najmniej 10 znaków.')
      .max(128, 'Hasło może mieć maksymalnie 128 znaków.'),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Hasła nie są zgodne.',
      });
    }
  });

type ChangePasswordFieldErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export type ChangePasswordResult =
  | { success: true }
  | {
      success: false;
      error: 'validation' | 'wrong_current';
      fieldErrors?: ChangePasswordFieldErrors;
    };

export async function changePassword(formData: FormData): Promise<ChangePasswordResult> {
  const session = await requireAuthForPasswordChange();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      success: false,
      error: 'validation',
      fieldErrors: {
        currentPassword: fieldErrors.currentPassword?.[0],
        newPassword: fieldErrors.newPassword?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
      },
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect('/login');
  }

  const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!isValid) {
    return { success: false, error: 'wrong_current' };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
      sessionVersion: { increment: 1 },
    },
  });

  return { success: true };
}

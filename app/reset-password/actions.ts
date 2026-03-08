'use server';

import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';

const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.trim().toLowerCase()),
});

export type RequestPasswordResetResult = {
  success: true;
};

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      });
    }
  });

export type ResetPasswordResult =
  | { success: true }
  | { success: false; error: 'invalid' | 'expired' };

export async function requestPasswordReset(
  formData: FormData
): Promise<RequestPasswordResetResult> {
  const parsed = requestPasswordResetSchema.safeParse({
    email: formData.get('email'),
  });

  if (!parsed.success) {
    return { success: true };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user) {
    return { success: true };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password/${rawToken}`;

  await sendPasswordResetEmail(user.email, resetUrl);

  return { success: true };
}

export async function resetPasswordWithToken(
  token: string,
  formData: FormData
): Promise<ResetPasswordResult> {
  const parsed = resetPasswordSchema.safeParse({
    token,
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    return { success: false, error: 'invalid' };
  }

  const tokenHash = crypto.createHash('sha256').update(parsed.data.token).digest('hex');

  const now = new Date();

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
    },
  });

  if (!resetToken) {
    return { success: false, error: 'invalid' };
  }

  if (resetToken.expiresAt <= now) {
    return { success: false, error: 'expired' };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: now },
    }),
  ]);

  return { success: true };
}

'use server';

import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';

const RESET_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
  cleanupAfterMs: 24 * 60 * 60 * 1000,
};

function getWindowStart(nowMs: number, windowMs: number) {
  return new Date(Math.floor(nowMs / windowMs) * windowMs);
}

async function getClientIpFromHeaders(): Promise<string | null> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return requestHeaders.get('x-real-ip');
}

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
    password: z.string().min(10).max(128),
    confirmPassword: z.string().min(10).max(128),
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

type ResetPasswordFieldErrors = {
  password?: string;
  confirmPassword?: string;
};

export type ResetPasswordResult =
  | { success: true }
  | {
      success: false;
      error: 'invalid' | 'expired' | 'validation';
      fieldErrors?: ResetPasswordFieldErrors;
    };

export async function requestPasswordReset(
  formData: FormData
): Promise<RequestPasswordResetResult> {
  const parsed = requestPasswordResetSchema.safeParse({
    email: formData.get('email'),
  });

  if (!parsed.success) {
    return { success: true };
  }

  const email = parsed.data.email;
  const ip: string = (await getClientIpFromHeaders()) ?? 'unknown';
  const nowMs = Date.now();
  const windowStart = getWindowStart(nowMs, RESET_RATE_LIMIT.windowMs);
  const key = `reset|${email}|${ip}`;

  await prisma.loginAttempt.deleteMany({
    where: {
      windowStart: { lt: new Date(nowMs - RESET_RATE_LIMIT.cleanupAfterMs) },
    },
  });

  const attempt = await prisma.loginAttempt.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, email, ip, windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });

  if (attempt.count > RESET_RATE_LIMIT.maxAttempts) {
    return { success: true };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { success: true };
  }

  const now = new Date();
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: now },
  });

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
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      success: false,
      error: 'validation',
      fieldErrors: {
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
      },
    };
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
    prisma.passwordResetToken.updateMany({
      where: { userId: resetToken.userId, usedAt: null },
      data: { usedAt: now },
    }),
  ]);

  return { success: true };
}

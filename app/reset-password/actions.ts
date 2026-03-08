'use server';

import { z } from 'zod';
import crypto from 'crypto';
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

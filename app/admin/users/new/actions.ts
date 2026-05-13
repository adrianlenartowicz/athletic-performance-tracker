'use server';

import { redirect } from 'next/navigation';
import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';

const INVITE_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export async function createUser(formData: FormData) {
  await requireAdmin();

  const email = (formData.get('email') as string).trim().toLowerCase();
  const role = formData.get('role') as string;

  if (!email || !email.includes('@')) {
    throw new Error('Invalid email.');
  }

  if (role !== 'PARENT' && role !== 'TRAINER') {
    throw new Error('Invalid role.');
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    throw new Error(`A user with this email already exists.`);
  }

  // The user never knows or transmits this hash; they set a real password via the invite link.
  const placeholderPasswordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);

  const rawInviteToken = randomBytes(32).toString('hex');
  const inviteTokenHash = createHash('sha256').update(rawInviteToken).digest('hex');
  const inviteExpiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_SECONDS * 1000);

  if (role === 'TRAINER') {
    const groupIds = formData.getAll('groupIds') as string[];

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: placeholderPasswordHash,
          role: 'TRAINER',
          mustChangePassword: false,
        },
        select: { id: true },
      });

      await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: inviteTokenHash,
          expiresAt: inviteExpiresAt,
        },
      });

      if (groupIds.length > 0) {
        await tx.trainerGroup.createMany({
          data: groupIds.map((groupId) => ({ trainerId: user.id, groupId })),
        });
      }
    });
  } else {
    const childNames = formData.getAll('childName') as string[];
    const childBirthYears = formData.getAll('childBirthYear') as string[];
    const childGroupIds = formData.getAll('childGroupId') as string[];

    const children = childNames
      .map((name, i) => ({
        name: name.trim(),
        birthYear: Number(childBirthYears[i]),
        groupId: childGroupIds[i] ?? '',
      }))
      .filter((c) => c.name);

    for (const child of children) {
      if (!Number.isInteger(child.birthYear) || child.birthYear < 1900) {
        throw new Error(`Invalid birth year for ${child.name}.`);
      }
      if (!child.groupId) {
        throw new Error(`Group is required for ${child.name}.`);
      }
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: placeholderPasswordHash,
          role: 'PARENT',
          mustChangePassword: false,
        },
        select: { id: true },
      });

      await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: inviteTokenHash,
          expiresAt: inviteExpiresAt,
        },
      });

      for (const child of children) {
        await tx.child.create({
          data: {
            name: child.name,
            birthYear: child.birthYear,
            parentId: user.id,
            groupId: child.groupId,
          },
        });
      }
    });
  }

  const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000';
  const setupUrl = `${baseUrl}/reset-password/${rawInviteToken}`;
  await sendWelcomeEmail(email, setupUrl, role);

  redirect(`/admin?created=${encodeURIComponent(email)}`);
}

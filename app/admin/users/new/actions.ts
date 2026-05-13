'use server';

import { redirect } from 'next/navigation';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';

function generateTemporaryPassword() {
  return `Tmp-${randomBytes(12).toString('base64url')}!`;
}

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

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  if (role === 'TRAINER') {
    const groupIds = formData.getAll('groupIds') as string[];

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'TRAINER',
          mustChangePassword: true,
        },
        select: { id: true },
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
          passwordHash,
          role: 'PARENT',
          mustChangePassword: true,
        },
        select: { id: true },
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

  const loginUrl = `${process.env.APP_BASE_URL ?? ''}/login`;
  await sendWelcomeEmail(email, temporaryPassword, loginUrl);

  redirect(`/admin?created=${encodeURIComponent(email)}`);
}

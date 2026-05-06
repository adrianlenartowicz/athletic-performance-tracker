import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { TEST_DEFINITIONS, type TestType } from '../lib/domain/tests';

export type TargetEnvironment = 'production' | 'staging';
export type UserRole = 'PARENT' | 'TRAINER';

export type GroupChoice = {
  id: string;
  name: string;
  location: string | null;
};

export type ChildInput = {
  name: string;
  birthYear: number;
  groupId: string;
  results: ResultInput[];
};

export type ResultInput = {
  testType: TestType;
  value: number;
  testedAt: Date;
};

export type CreateUserInput = {
  email: string;
  role: UserRole;
  temporaryPassword: string;
  mustChangePassword: boolean;
  children: ChildInput[];
};

export type ChildChoice = {
  id: string;
  name: string;
  birthYear: number;
  parent: {
    email: string;
  };
  group: {
    name: string;
    location: string | null;
  };
};

export type CreatePhysiotherapistReportInput = {
  childId: string;
  reportDate: Date;
  observations: string[];
  recommendations: string[];
  comparisonToPrevious: string | null;
};

export const TEST_TYPES = Object.keys(TEST_DEFINITIONS) as TestType[];

export function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL not found. Run this through `vercel env run`, for example: `npm run user:ui:staging`.'
    );
  }

  return databaseUrl;
}

export function describeDatabaseUrl(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return 'Unable to parse DATABASE_URL';
  }
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateTemporaryPassword() {
  return `Tmp-${randomBytes(12).toString('base64url')}!`;
}

export function isUserRole(value: string): value is UserRole {
  return value === 'PARENT' || value === 'TRAINER';
}

export function isTestType(value: string): value is TestType {
  return TEST_TYPES.includes(value as TestType);
}

export async function getGroups(): Promise<GroupChoice[]> {
  return prisma.group.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, location: true },
  });
}

export async function getChildren(): Promise<ChildChoice[]> {
  return prisma.child.findMany({
    orderBy: [{ name: 'asc' }, { birthYear: 'asc' }],
    select: {
      id: true,
      name: true,
      birthYear: true,
      parent: {
        select: { email: true },
      },
      group: {
        select: { name: true, location: true },
      },
    },
  });
}

export async function disconnectAdminPrisma() {
  await prisma.$disconnect();
}

export async function createPhysiotherapistReport(input: CreatePhysiotherapistReportInput) {
  const observations = input.observations.map((item) => item.trim()).filter(Boolean);
  const recommendations = input.recommendations.map((item) => item.trim()).filter(Boolean);

  if (observations.length === 0) throw new Error('At least one observation is required.');
  if (recommendations.length === 0) throw new Error('At least one recommendation is required.');
  if (Number.isNaN(input.reportDate.getTime())) throw new Error('Report date is invalid.');

  const child = await prisma.child.findUnique({
    where: { id: input.childId },
    select: { id: true, name: true },
  });

  if (!child) {
    throw new Error('Child not found.');
  }

  return prisma.physiotherapistReport.create({
    data: {
      childId: child.id,
      reportDate: input.reportDate,
      observations,
      recommendations,
      comparisonToPrevious: input.comparisonToPrevious?.trim() || null,
    },
    select: {
      id: true,
      reportDate: true,
      child: {
        select: { name: true },
      },
    },
  });
}

export async function createUserWithChildren(input: CreateUserInput) {
  const email = normalizeEmail(input.email);
  if (!email || !email.includes('@')) throw new Error('Invalid email.');
  if (!isUserRole(input.role)) throw new Error('Invalid role.');
  if (!input.temporaryPassword) throw new Error('Temporary password is required.');

  if (input.role !== 'PARENT' && input.children.length > 0) {
    throw new Error('Only parent users can have children.');
  }

  const passwordHash = await bcrypt.hash(input.temporaryPassword, 10);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (existing) {
      throw new Error(`User already exists: ${existing.email} (${existing.id})`);
    }

    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: input.role,
        mustChangePassword: input.mustChangePassword,
      },
      select: {
        id: true,
        email: true,
        role: true,
        mustChangePassword: true,
      },
    });

    let resultsCount = 0;
    for (const child of input.children) {
      const name = child.name.trim();
      if (!name) throw new Error('Child name is required.');
      if (!Number.isInteger(child.birthYear)) throw new Error('Child birth year is invalid.');

      const createdChild = await tx.child.create({
        data: {
          name,
          birthYear: child.birthYear,
          parentId: user.id,
          groupId: child.groupId,
        },
        select: { id: true },
      });

      if (child.results.length > 0) {
        await tx.testResult.createMany({
          data: child.results.map((result) => {
            if (!isTestType(result.testType)) throw new Error('Invalid test type.');
            const testedAt = new Date(result.testedAt);
            if (Number.isNaN(testedAt.getTime())) throw new Error('Invalid test date.');

            return {
              childId: createdChild.id,
              testType: result.testType,
              value: result.value,
              unit: TEST_DEFINITIONS[result.testType].unit,
              testedAt,
            };
          }),
        });
        resultsCount += child.results.length;
      }
    }

    return { user, childrenCount: input.children.length, resultsCount };
  });
}

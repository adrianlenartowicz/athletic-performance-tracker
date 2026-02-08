import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  await prisma.testResult.deleteMany();
  await prisma.child.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('test1234', 10);

  // ======================
  // TRAINER
  // ======================
  const trainer = await prisma.user.create({
    data: {
      email: 'trainer@test.pl',
      passwordHash,
      role: UserRole.TRAINER,
    },
  });

  // ======================
  // PARENT 1
  // ======================
  const parent1 = await prisma.user.create({
    data: {
      email: 'parent1@test.pl',
      passwordHash,
      role: UserRole.PARENT,
      children: {
        create: [
          {
            name: 'Jan',
            birthDate: new Date('2014-05-10'),
            results: {
              create: [
                // Sprint 20m (lower = better)
                { testType: 'sprint_20m', value: 4.5, unit: 's', testedAt: new Date('2024-01-10') },
                { testType: 'sprint_20m', value: 4.1, unit: 's', testedAt: new Date('2024-03-10') },
                { testType: 'sprint_20m', value: 3.8, unit: 's', testedAt: new Date('2024-05-10') },

                // Broad jump (higher = better)
                {
                  testType: 'broad_jump',
                  value: 150,
                  unit: 'cm',
                  testedAt: new Date('2024-01-10'),
                },
                {
                  testType: 'broad_jump',
                  value: 165,
                  unit: 'cm',
                  testedAt: new Date('2024-03-10'),
                },
                {
                  testType: 'broad_jump',
                  value: 178,
                  unit: 'cm',
                  testedAt: new Date('2024-05-10'),
                },

                // Vertical jump
                {
                  testType: 'vertical_jump',
                  value: 28,
                  unit: 'cm',
                  testedAt: new Date('2024-02-10'),
                },
                {
                  testType: 'vertical_jump',
                  value: 33,
                  unit: 'cm',
                  testedAt: new Date('2024-05-10'),
                },
              ],
            },
          },
          {
            name: 'Zosia',
            birthDate: new Date('2016-08-22'),
            results: {
              create: [
                { testType: 'sprint_20m', value: 4.9, unit: 's', testedAt: new Date('2024-02-01') },
                { testType: 'sprint_20m', value: 4.7, unit: 's', testedAt: new Date('2024-05-01') },

                {
                  testType: 'broad_jump',
                  value: 135,
                  unit: 'cm',
                  testedAt: new Date('2024-02-01'),
                },
                {
                  testType: 'broad_jump',
                  value: 142,
                  unit: 'cm',
                  testedAt: new Date('2024-05-01'),
                },
              ],
            },
          },
        ],
      },
    },
  });

  // ======================
  // PARENT 2
  // ======================
  const parent2 = await prisma.user.create({
    data: {
      email: 'parent2@test.pl',
      passwordHash,
      role: UserRole.PARENT,
      children: {
        create: [
          {
            name: 'Kuba',
            birthDate: new Date('2013-11-02'),
            results: {
              create: [
                { testType: 'sprint_20m', value: 3.9, unit: 's', testedAt: new Date('2024-01-15') },
                { testType: 'sprint_20m', value: 3.7, unit: 's', testedAt: new Date('2024-04-15') },

                {
                  testType: 'broad_jump',
                  value: 180,
                  unit: 'cm',
                  testedAt: new Date('2024-01-15'),
                },
                {
                  testType: 'broad_jump',
                  value: 190,
                  unit: 'cm',
                  testedAt: new Date('2024-04-15'),
                },
              ],
            },
          },
          {
            name: 'Maja',
            birthDate: new Date('2015-03-18'),
            results: {
              create: [
                { testType: 'sprint_20m', value: 4.6, unit: 's', testedAt: new Date('2024-02-20') },
                { testType: 'sprint_20m', value: 4.4, unit: 's', testedAt: new Date('2024-06-20') },

                {
                  testType: 'vertical_jump',
                  value: 26,
                  unit: 'cm',
                  testedAt: new Date('2024-02-20'),
                },
                {
                  testType: 'vertical_jump',
                  value: 30,
                  unit: 'cm',
                  testedAt: new Date('2024-06-20'),
                },
              ],
            },
          },
          {
            name: 'Antek',
            birthDate: new Date('2017-01-12'),
            results: {
              create: [
                { testType: 'sprint_20m', value: 5.1, unit: 's', testedAt: new Date('2024-03-01') },
                {
                  testType: 'broad_jump',
                  value: 120,
                  unit: 'cm',
                  testedAt: new Date('2024-03-01'),
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('Seed completed');
  console.log('Trainer:', trainer.email);
  console.log('Parents:', parent1.email, parent2.email);
  console.log('Password for all users: test1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

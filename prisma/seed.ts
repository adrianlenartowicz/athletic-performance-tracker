import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

async function main() {
  await prisma.testResult.deleteMany();
  await prisma.child.deleteMany();
  await prisma.user.deleteMany();

  const parent = await prisma.user.create({
    data: {
      email: 'parent@test.pl',
      role: UserRole.PARENT,
      children: {
        create: [
          {
            name: 'Jan',
            birthDate: new Date('2014-05-10'),
            results: {
              create: [
                {
                  testType: 'sprint_20m',
                  value: 4.3,
                  unit: 's',
                  testedAt: new Date('2024-01-01'),
                },
                {
                  testType: 'sprint_20m',
                  value: 4.0,
                  unit: 's',
                  testedAt: new Date('2024-03-01'),
                },
                {
                  testType: 'sprint_20m',
                  value: 3.8,
                  unit: 's',
                  testedAt: new Date('2024-05-01'),
                },
                {
                  testType: 'broad_jump',
                  value: 160,
                  unit: 'cm',
                  testedAt: new Date('2024-02-01'),
                },
                {
                  testType: 'broad_jump',
                  value: 175,
                  unit: 'cm',
                  testedAt: new Date('2024-05-01'),
                },
                {
                  testType: 'vertical_jump',
                  value: 142,
                  unit: 'cm',
                  testedAt: new Date('2024-04-01'),
                },
                {
                  testType: 'vertical_jump',
                  value: 179,
                  unit: 'cm',
                  testedAt: new Date('2024-08-01'),
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('Seed completed:', parent.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

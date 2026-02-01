import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const parent = await prisma.user.create({
    data: {
      email: "parent@test.pl",
      role: UserRole.PARENT,
      children: {
        create: [
          {
            name: "Jan",
            birthDate: new Date("2014-05-10"),
            results: {
              create: [
                {
                  testType: "sprint_20m",
                  value: 4.2,
                  unit: "s",
                  testedAt: new Date("2024-01-01"),
                },
                {
                  testType: "sprint_20m",
                  value: 3.9,
                  unit: "s",
                  testedAt: new Date("2024-04-01"),
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("Seed completed:", parent.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

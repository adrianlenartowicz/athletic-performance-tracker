import { randomBytes } from 'node:crypto';
import { createInterface, type Interface } from 'node:readline/promises';
import bcrypt from 'bcryptjs';
import { TEST_DEFINITIONS, type TestType } from '../lib/domain/tests';

type TargetEnvironment = 'production' | 'staging';
type UserRole = 'PARENT' | 'TRAINER';

type GroupChoice = {
  id: string;
  name: string;
  location: string | null;
};

type ChildInput = {
  name: string;
  birthYear: number;
  groupId: string;
  results: ResultInput[];
};

type ResultInput = {
  testType: TestType;
  value: number;
  testedAt: Date;
};

const TEST_TYPES = Object.keys(TEST_DEFINITIONS) as TestType[];

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL not found. Run this through `vercel env run`, for example: `npm run user:create:staging`.'
    );
  }

  return databaseUrl;
}

function describeDatabaseUrl(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return 'Unable to parse DATABASE_URL';
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function generateTemporaryPassword() {
  return `Tmp-${randomBytes(8).toString('base64url')}!`;
}

function formatGroup(group: GroupChoice) {
  return group.location ? `${group.name} (${group.location})` : group.name;
}

async function askRequired(rl: Interface, question: string) {
  const answer = (await rl.question(question)).trim();
  if (!answer) throw new Error('Value is required.');
  return answer;
}

async function askYesNo(rl: Interface, question: string, defaultValue = false) {
  const suffix = defaultValue ? ' (Y/n): ' : ' (y/N): ';
  const answer = (await rl.question(`${question}${suffix}`)).trim().toLowerCase();
  if (!answer) return defaultValue;
  if (answer === 'y' || answer === 'yes') return true;
  if (answer === 'n' || answer === 'no') return false;
  throw new Error('Answer must be yes or no.');
}

async function askMatching(rl: Interface, label: string, normalize = (value: string) => value.trim()) {
  const first = normalize(await askRequired(rl, `${label}: `));
  const second = normalize(await askRequired(rl, `Repeat ${label.toLowerCase()}: `));
  if (first !== second) {
    throw new Error(`${label} values do not match.`);
  }
  return first;
}

async function askRole(rl: Interface, production: boolean): Promise<UserRole> {
  const normalizeRole = (value: string) => value.trim().toUpperCase();
  const input = production
    ? await askMatching(rl, 'Role (PARENT/TRAINER)', normalizeRole)
    : normalizeRole((await rl.question('Role (PARENT/TRAINER) [PARENT]: ')).trim() || 'PARENT');

  if (input !== 'PARENT' && input !== 'TRAINER') {
    throw new Error('Role must be PARENT or TRAINER.');
  }

  return input;
}

async function askProductionBoolean(rl: Interface, label: string) {
  const first = await askYesNo(rl, label);
  const second = await askYesNo(rl, `Repeat: ${label}`);
  if (first !== second) {
    throw new Error(`${label} values do not match.`);
  }
  return first;
}

async function askTargetEnvironment(rl: Interface): Promise<TargetEnvironment> {
  const environmentArg = process.argv.find((arg) => arg.startsWith('--environment='));
  const environment = environmentArg?.split('=')[1];

  if (environment === 'production' || environment === 'staging') {
    console.log(
      `Target environment: ${environment === 'production' ? 'Production' : 'Staging / non-production'}`
    );
    return environment;
  }

  if (environmentArg) {
    throw new Error('--environment must be production or staging.');
  }

  console.log('Target environment:');
  console.log('1. Production');
  console.log('2. Staging / non-production');

  const answer = await askRequired(rl, 'Choose 1 or 2: ');
  if (answer === '1') return 'production';
  if (answer === '2') return 'staging';
  throw new Error('Choose 1 for production or 2 for staging.');
}

async function confirmEnvironment(rl: Interface, targetEnvironment: TargetEnvironment) {
  if (targetEnvironment === 'production') {
    const confirmation = await askRequired(rl, 'Type PRODUCTION to continue: ');
    if (confirmation !== 'PRODUCTION') throw new Error('Canceled.');
    return;
  }

  const confirmed = await askYesNo(rl, 'Continue with staging / non-production');
  if (!confirmed) throw new Error('Canceled.');
}

async function chooseGroup(rl: Interface, groups: GroupChoice[], production: boolean) {
  if (groups.length === 0) {
    throw new Error('No group found. Create at least one Group before adding children.');
  }

  console.log('Available groups:');
  groups.forEach((group, index) => {
    console.log(`${index + 1}. ${formatGroup(group)}`);
  });

  const choose = async (label: string) => {
    const answer = Number(await askRequired(rl, label));
    const group = groups[answer - 1];
    if (!Number.isInteger(answer) || !group) {
      throw new Error('Invalid group choice.');
    }
    return group;
  };

  const group = await choose('Group number: ');
  if (!production) return group;

  const repeatedGroup = await choose('Repeat group number: ');
  if (group.id !== repeatedGroup.id) {
    throw new Error('Group choices do not match.');
  }
  return group;
}

async function askProductionUser(rl: Interface) {
  const email = normalizeEmail(await askMatching(rl, 'Email', normalizeEmail));
  if (!email.includes('@')) throw new Error('Invalid email.');

  const role = await askRole(rl, true);
  const generatePassword = await askProductionBoolean(
    rl,
    'Generate a random temporary password'
  );
  const password = generatePassword
    ? generateTemporaryPassword()
    : await askMatching(rl, 'Temporary password');

  return { email, role, temporaryPassword: password, mustChangePassword: true };
}

async function askStagingUser(rl: Interface) {
  const email = normalizeEmail(await askRequired(rl, 'Email: '));
  if (!email.includes('@')) throw new Error('Invalid email.');

  const role = await askRole(rl, false);
  const passwordInput = await rl.question('Temporary password (leave empty to auto-generate): ');
  const temporaryPassword = passwordInput.trim() || generateTemporaryPassword();
  const mustChangePassword = await askYesNo(rl, 'Force password change on first login', true);

  return { email, role, temporaryPassword, mustChangePassword };
}

function createMockChildren(groupId: string): ChildInput[] {
  const timestamp = new Date().toISOString().slice(11, 16).replace(':', '');
  const testDates = ['2026-01-10', '2026-03-10', '2026-05-10'];

  const testSeries: Record<TestType, number[][]> = {
    sprint_20m: [
      [5.2, 5.0, 4.8],
      [5.6, 5.4, 5.1],
    ],
    broad_jump: [
      [135, 145, 158],
      [120, 132, 141],
    ],
    vertical_jump: [
      [118, 126, 134],
      [110, 119, 128],
    ],
  };

  return [
    { name: `Test Dziecko ${timestamp}-1`, birthYear: 2015 },
    { name: `Test Dziecko ${timestamp}-2`, birthYear: 2017 },
  ].map((child, childIndex) => ({
    ...child,
    groupId,
    results: TEST_TYPES.flatMap((testType) =>
      testSeries[testType][childIndex].map((value, index) => ({
        testType,
        value,
        testedAt: new Date(testDates[index]),
      }))
    ),
  }));
}

async function askBirthYear(rl: Interface, production: boolean) {
  const readBirthYear = async (label: string) => {
    const value = Number(await askRequired(rl, label));
    if (!Number.isInteger(value) || value < 1900 || value > new Date().getFullYear()) {
      throw new Error('Birth year is invalid.');
    }
    return value;
  };

  const birthYear = await readBirthYear('Birth year: ');
  if (!production) return birthYear;

  const repeatedBirthYear = await readBirthYear('Repeat birth year: ');
  if (birthYear !== repeatedBirthYear) {
    throw new Error('Birth year values do not match.');
  }
  return birthYear;
}

async function askResult(rl: Interface, production: boolean): Promise<ResultInput> {
  console.log(`Test types: ${TEST_TYPES.join(', ')}`);

  const readTestType = async (label: string) => {
    const value = (await askRequired(rl, label)) as TestType;
    if (!TEST_TYPES.includes(value)) throw new Error('Invalid test type.');
    return value;
  };

  const readNumber = async (label: string) => {
    const value = Number(await askRequired(rl, label));
    if (!Number.isFinite(value)) throw new Error('Value must be a number.');
    return value;
  };

  const readDate = async (label: string) => {
    const input = await askRequired(rl, label);
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) throw new Error('Date is invalid.');
    return date;
  };

  const testType = await readTestType('Test type: ');
  if (production) {
    const repeatedTestType = await readTestType('Repeat test type: ');
    if (testType !== repeatedTestType) {
      throw new Error('Test type values do not match.');
    }
  }

  const value = await readNumber(`Value (${TEST_DEFINITIONS[testType].unit}): `);
  if (production) {
    const repeatedValue = await readNumber(`Repeat value (${TEST_DEFINITIONS[testType].unit}): `);
    if (value !== repeatedValue) {
      throw new Error('Result value does not match.');
    }
  }

  const testedAt = await readDate('Test date (YYYY-MM-DD): ');
  if (production) {
    const repeatedTestedAt = await readDate('Repeat test date (YYYY-MM-DD): ');
    if (testedAt.toISOString() !== repeatedTestedAt.toISOString()) {
      throw new Error('Test date does not match.');
    }
  }

  return { testType, value, testedAt };
}

async function askChildren(rl: Interface, groups: GroupChoice[], production: boolean) {
  const children: ChildInput[] = [];

  while (await askYesNo(rl, 'Add a child')) {
    const name = production
      ? await askMatching(rl, 'Child name')
      : await askRequired(rl, 'Child name: ');
    const birthYear = await askBirthYear(rl, production);
    const group = await chooseGroup(rl, groups, production);
    const results: ResultInput[] = [];

    while (await askYesNo(rl, `Add a test result for ${name}`)) {
      results.push(await askResult(rl, production));
    }

    children.push({ name, birthYear, groupId: group.id, results });
  }

  return children;
}

function printSummary(input: {
  targetEnvironment: TargetEnvironment;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
  children: ChildInput[];
}) {
  const resultsCount = input.children.reduce((sum, child) => sum + child.results.length, 0);

  console.log('\nSummary');
  console.log(`Environment: ${input.targetEnvironment === 'production' ? 'PRODUCTION' : 'Staging'}`);
  console.log(`Email: ${input.email}`);
  console.log(`Role: ${input.role}`);
  console.log(`Force password change: ${input.mustChangePassword ? 'yes' : 'no'}`);
  console.log(`Children to add: ${input.children.length}`);
  console.log(`Results to add: ${resultsCount}`);

  for (const child of input.children) {
    console.log(`- ${child.name}, ${child.birthYear}, results: ${child.results.length}`);
  }
}

async function main() {
  const databaseUrl = getDatabaseUrl();
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const targetEnvironment = await askTargetEnvironment(rl);

    console.log('Database source: process.env.DATABASE_URL');
    console.log(`Database: ${describeDatabaseUrl(databaseUrl)}`);

    await confirmEnvironment(rl, targetEnvironment);

    const production = targetEnvironment === 'production';
    const userInput = production ? await askProductionUser(rl) : await askStagingUser(rl);

    const { default: prisma } = await import('../lib/prisma');

    const existing = await prisma.user.findUnique({
      where: { email: userInput.email },
      select: { id: true, email: true },
    });

    if (existing) {
      throw new Error(`User already exists: ${existing.email} (${existing.id})`);
    }

    const groups = await prisma.group.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, location: true },
    });

    let children: ChildInput[] = [];
    if (userInput.role === 'PARENT') {
      if (production) {
        children = await askChildren(rl, groups, true);
      } else if (await askYesNo(rl, 'Add mocked children and test results')) {
        const group = await chooseGroup(rl, groups, false);
        children = createMockChildren(group.id);
      }
    }

    printSummary({ targetEnvironment, ...userInput, children });

    const finalConfirmation = production
      ? await askRequired(rl, 'Type CREATE PRODUCTION USER to continue: ')
      : await askRequired(rl, 'Type CREATE USER to continue: ');

    if (
      (production && finalConfirmation !== 'CREATE PRODUCTION USER') ||
      (!production && finalConfirmation !== 'CREATE USER')
    ) {
      console.log('Canceled.');
      await prisma.$disconnect();
      return;
    }

    const passwordHash = await bcrypt.hash(userInput.temporaryPassword, 10);

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: userInput.email,
          passwordHash,
          role: userInput.role,
          mustChangePassword: userInput.mustChangePassword,
        },
        select: {
          id: true,
          email: true,
          role: true,
          mustChangePassword: true,
        },
      });

      let resultsCount = 0;
      for (const child of children) {
        const createdChild = await tx.child.create({
          data: {
            name: child.name,
            birthYear: child.birthYear,
            parentId: user.id,
            groupId: child.groupId,
          },
          select: { id: true },
        });

        if (child.results.length > 0) {
          await tx.testResult.createMany({
            data: child.results.map((result) => ({
              childId: createdChild.id,
              testType: result.testType,
              value: result.value,
              unit: TEST_DEFINITIONS[result.testType].unit,
              testedAt: result.testedAt,
            })),
          });
          resultsCount += child.results.length;
        }
      }

      return { user, childrenCount: children.length, resultsCount };
    });

    console.log('\nUser created successfully.');
    console.log(`ID: ${created.user.id}`);
    console.log(`Email: ${created.user.email}`);
    console.log(`Role: ${created.user.role}`);
    console.log(`mustChangePassword: ${created.user.mustChangePassword}`);
    console.log(`Children created: ${created.childrenCount}`);
    console.log(`Test results created: ${created.resultsCount}`);
    console.log(`Temporary password: ${userInput.temporaryPassword}`);
    console.log('\nShare email and password via separate channels.');

    await prisma.$disconnect();
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exit(1);
});

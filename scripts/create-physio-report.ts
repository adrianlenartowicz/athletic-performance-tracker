import { createInterface, type Interface } from 'node:readline/promises';
import {
  createPhysiotherapistReport,
  describeDatabaseUrl,
  disconnectAdminPrisma,
  getChildren,
  getDatabaseUrl,
  type ChildChoice,
  type TargetEnvironment,
} from './admin-user-core';

function getEnvironment(): TargetEnvironment {
  const arg = process.argv.find((value) => value.startsWith('--environment='));
  const environment = arg?.split('=')[1];
  if (environment === 'production' || environment === 'staging') return environment;
  throw new Error('--environment must be production or staging.');
}

function formatChild(child: ChildChoice) {
  const group = child.group.location
    ? `${child.group.name} (${child.group.location})`
    : child.group.name;
  return `${child.name}, ${child.birthYear} - ${group} - ${child.parent.email}`;
}

async function askRequired(rl: Interface, question: string) {
  const answer = (await rl.question(question)).trim();
  if (!answer) throw new Error('Value is required.');
  return answer;
}

async function askOptional(rl: Interface, question: string) {
  const answer = (await rl.question(question)).trim();
  return answer || null;
}

async function askDate(rl: Interface) {
  const input = await askRequired(rl, 'Report date (YYYY-MM-DD): ');
  const date = new Date(input);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input) || Number.isNaN(date.getTime())) {
    throw new Error('Report date must use YYYY-MM-DD.');
  }
  return date;
}

async function askLines(rl: Interface, label: string) {
  console.log(`${label} - enter one item per line. Submit an empty line when finished.`);

  const lines: string[] = [];
  while (true) {
    const line = (await rl.question(`- `)).trim().replace(/^-+\s*/, '');
    if (!line) break;
    lines.push(line);
  }

  if (lines.length === 0) {
    throw new Error(`${label} requires at least one item.`);
  }

  return lines;
}

async function chooseChild(rl: Interface, children: ChildChoice[]) {
  if (children.length === 0) {
    throw new Error('No children found.');
  }

  console.log('\nChildren');
  children.forEach((child, index) => {
    console.log(`${index + 1}. ${formatChild(child)}`);
  });

  const childNumber = Number(await askRequired(rl, 'Child number: '));
  const child = children[childNumber - 1];
  if (!Number.isInteger(childNumber) || !child) {
    throw new Error('Invalid child number.');
  }

  return child;
}

function printSummary(input: {
  environment: TargetEnvironment;
  child: ChildChoice;
  reportDate: Date;
  observations: string[];
  recommendations: string[];
  comparisonToPrevious: string | null;
}) {
  console.log('\nSummary');
  console.log(`Environment: ${input.environment === 'production' ? 'PRODUCTION' : 'Staging'}`);
  console.log(`Child: ${formatChild(input.child)}`);
  console.log(`Report date: ${input.reportDate.toISOString().slice(0, 10)}`);
  console.log(`Observations: ${input.observations.length}`);
  console.log(`Recommendations: ${input.recommendations.length}`);
  console.log(`Comparison note: ${input.comparisonToPrevious ? 'yes' : 'no'}`);
}

async function main() {
  const environment = getEnvironment();
  const database = describeDatabaseUrl(getDatabaseUrl());
  const production = environment === 'production';
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log(`Target environment: ${production ? 'Production' : 'Staging / non-production'}`);
    console.log('Database source: process.env.DATABASE_URL');
    console.log(`Database: ${database}`);

    if (production) {
      const confirmation = await askRequired(rl, 'Type PRODUCTION to continue: ');
      if (confirmation !== 'PRODUCTION') throw new Error('Canceled.');
    }

    const child = await chooseChild(rl, await getChildren());
    const reportDate = await askDate(rl);
    const observations = await askLines(rl, 'Observations');
    const comparisonToPrevious = await askOptional(
      rl,
      'What changed since previous report? (optional): '
    );
    const recommendations = await askLines(rl, 'Recommendations');

    printSummary({
      environment,
      child,
      reportDate,
      observations,
      recommendations,
      comparisonToPrevious,
    });

    const finalConfirmation = production
      ? await askRequired(rl, 'Type CREATE PRODUCTION PHYSIO REPORT to save: ')
      : await askRequired(rl, 'Type CREATE PHYSIO REPORT to save: ');

    if (
      (production && finalConfirmation !== 'CREATE PRODUCTION PHYSIO REPORT') ||
      (!production && finalConfirmation !== 'CREATE PHYSIO REPORT')
    ) {
      console.log('Canceled.');
      return;
    }

    const created = await createPhysiotherapistReport({
      childId: child.id,
      reportDate,
      observations,
      recommendations,
      comparisonToPrevious,
    });

    console.log('\nPhysiotherapist report created.');
    console.log(`ID: ${created.id}`);
    console.log(`Child: ${created.child.name}`);
    console.log(`Report date: ${created.reportDate.toISOString().slice(0, 10)}`);
  } finally {
    rl.close();
    await disconnectAdminPrisma();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exit(1);
});

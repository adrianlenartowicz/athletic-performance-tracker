import bcrypt from 'bcryptjs';

// Hash computed lazily on first login, not at import time
let passwordHash: string | undefined;
function getPasswordHash(): string {
  if (!passwordHash) passwordHash = bcrypt.hashSync('dev123456', 10);
  return passwordHash;
}

export function getUsers() {
  const hash = getPasswordHash();
  return [
    { id: 'dev-parent-1', email: 'parent@dev.local', passwordHash: hash, role: 'PARENT' as const, mustChangePassword: false, sessionVersion: 0, createdAt: new Date('2026-01-01') },
    { id: 'dev-trainer-1', email: 'trainer@dev.local', passwordHash: hash, role: 'TRAINER' as const, mustChangePassword: false, sessionVersion: 0, createdAt: new Date('2026-01-01') },
    { id: 'dev-admin-1', email: 'admin@dev.local', passwordHash: hash, role: 'ADMIN' as const, mustChangePassword: false, sessionVersion: 0, createdAt: new Date('2026-01-01') },
  ];
}

export const groups = [
  { id: 'dev-group-1', name: 'Grupa A', location: 'Warszawa', createdAt: new Date('2026-01-01') },
  { id: 'dev-group-2', name: 'Grupa B', location: null, createdAt: new Date('2026-01-01') },
];

export const trainerGroups = [
  { trainerId: 'dev-trainer-1', groupId: 'dev-group-1' },
  { trainerId: 'dev-trainer-1', groupId: 'dev-group-2' },
];

export const children = [
  { id: 'dev-child-1', name: 'Anna Kowalska', birthYear: 2015, parentId: 'dev-parent-1', groupId: 'dev-group-1', createdAt: new Date('2026-01-15') },
  { id: 'dev-child-2', name: 'Piotr Nowak', birthYear: 2016, parentId: 'dev-parent-1', groupId: 'dev-group-2', createdAt: new Date('2026-01-15') },
];

export const testResults = [
  { id: 'dev-r1', childId: 'dev-child-1', testType: 'sprint_20m', value: 5.2, unit: 's', testedAt: new Date('2026-01-10'), createdAt: new Date() },
  { id: 'dev-r2', childId: 'dev-child-1', testType: 'sprint_20m', value: 5.0, unit: 's', testedAt: new Date('2026-03-10'), createdAt: new Date() },
  { id: 'dev-r3', childId: 'dev-child-1', testType: 'sprint_20m', value: 4.8, unit: 's', testedAt: new Date('2026-05-10'), createdAt: new Date() },
  { id: 'dev-r4', childId: 'dev-child-1', testType: 'broad_jump', value: 135, unit: 'cm', testedAt: new Date('2026-01-10'), createdAt: new Date() },
  { id: 'dev-r5', childId: 'dev-child-1', testType: 'broad_jump', value: 145, unit: 'cm', testedAt: new Date('2026-03-10'), createdAt: new Date() },
  { id: 'dev-r6', childId: 'dev-child-1', testType: 'broad_jump', value: 158, unit: 'cm', testedAt: new Date('2026-05-10'), createdAt: new Date() },
  { id: 'dev-r7', childId: 'dev-child-1', testType: 'vertical_jump', value: 118, unit: 'cm', testedAt: new Date('2026-01-10'), createdAt: new Date() },
  { id: 'dev-r8', childId: 'dev-child-1', testType: 'vertical_jump', value: 126, unit: 'cm', testedAt: new Date('2026-03-10'), createdAt: new Date() },
  { id: 'dev-r9', childId: 'dev-child-2', testType: 'sprint_20m', value: 5.6, unit: 's', testedAt: new Date('2026-01-10'), createdAt: new Date() },
  { id: 'dev-r10', childId: 'dev-child-2', testType: 'sprint_20m', value: 5.4, unit: 's', testedAt: new Date('2026-03-10'), createdAt: new Date() },
];

export const physiotherapistReports = [
  {
    id: 'dev-report-1',
    childId: 'dev-child-1',
    reportDate: new Date('2026-04-15'),
    title: 'Ocena fizjoterapeutyczna',
    observations: ['Dobra postawa ciała', 'Prawidłowe napięcie mięśniowe', 'Symetryczny chód'],
    recommendations: ['Kontynuować ćwiczenia rozciągające', 'Unikać długotrwałego siedzenia'],
    comparisonToPrevious: 'Wyraźna poprawa elastyczności w stosunku do poprzedniej wizyty.',
    createdAt: new Date('2026-04-15'),
    updatedAt: new Date('2026-04-15'),
  },
];

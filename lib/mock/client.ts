import * as db from './data';

function getGroup(groupId: string) {
  return db.groups.find((g) => g.id === groupId) ?? null;
}

function getChildrenForTrainer(trainerId: string) {
  const groupIds = db.trainerGroups.filter((tg) => tg.trainerId === trainerId).map((tg) => tg.groupId);
  return db.children.filter((c) => groupIds.includes(c.groupId));
}

function enrichChild(child: (typeof db.children)[0]) {
  return {
    ...child,
    group: getGroup(child.groupId),
    results: db.testResults
      .filter((r) => r.childId === child.id)
      .sort((a, b) => a.testedAt.getTime() - b.testedAt.getTime()),
    physiotherapistReports: db.physiotherapistReports
      .filter((r) => r.childId === child.id)
      .sort((a, b) => b.reportDate.getTime() - a.reportDate.getTime()),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockClient: any = {
  user: {
    findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
      const users = db.getUsers();
      if (where.email) return users.find((u) => u.email === where.email) ?? null;
      if (where.id) return users.find((u) => u.id === where.id) ?? null;
      return null;
    },
    findMany: async () => {
      return [...db.getUsers()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
    create: async ({ data }: { data: Record<string, unknown> }) => ({
      id: `dev-new-${Date.now()}`,
      ...data,
      createdAt: new Date(),
    }),
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const users = db.getUsers();
      const user = users.find((u) => u.id === where.id);
      return user ? { ...user, ...data } : null;
    },
  },

  child: {
    findMany: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      let result = db.children;

      if (where?.parentId) {
        result = result.filter((c) => c.parentId === where.parentId);
      }

      const trainerWhere = (where?.group as Record<string, unknown> | undefined)?.trainers as Record<string, unknown> | undefined;
      const trainerId = (trainerWhere?.some as Record<string, unknown> | undefined)?.trainerId as string | undefined;
      if (trainerId) {
        const ids = new Set(getChildrenForTrainer(trainerId).map((c) => c.id));
        result = result.filter((c) => ids.has(c.id));
      }

      const inIds = (where?.id as Record<string, unknown> | undefined)?.in as string[] | undefined;
      if (inIds) result = result.filter((c) => inIds.includes(c.id));

      return result.map(enrichChild);
    },

    findFirst: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      let result = db.children;

      if (where?.parentId) result = result.filter((c) => c.parentId === where.parentId);
      if (where?.id) result = result.filter((c) => c.id === where.id);

      const trainerWhere = (where?.group as Record<string, unknown> | undefined)?.trainers as Record<string, unknown> | undefined;
      const trainerId = (trainerWhere?.some as Record<string, unknown> | undefined)?.trainerId as string | undefined;
      if (trainerId) {
        const ids = new Set(getChildrenForTrainer(trainerId).map((c) => c.id));
        result = result.filter((c) => ids.has(c.id));
      }

      return result.length > 0 ? enrichChild(result[0]) : null;
    },

    findUnique: async ({ where }: { where: { id: string } }) => {
      const child = db.children.find((c) => c.id === where.id);
      return child ? enrichChild(child) : null;
    },

    create: async ({ data }: { data: Record<string, unknown> }) => ({
      id: `dev-new-child-${Date.now()}`,
      ...data,
      createdAt: new Date(),
    }),
  },

  group: {
    findMany: async () => db.groups,
  },

  trainerGroup: {
    createMany: async () => ({ count: 0 }),
  },

  testResult: {
    create: async ({ data }: { data: Record<string, unknown> }) => ({
      id: `dev-new-result-${Date.now()}`,
      ...data,
      createdAt: new Date(),
    }),
  },

  physiotherapistReport: {
    create: async ({ data }: { data: Record<string, unknown> }) => ({
      id: `dev-new-report-${Date.now()}`,
      title: 'Ocena fizjoterapeutyczna',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  },

  loginAttempt: {
    deleteMany: async () => ({ count: 0 }),
    upsert: async () => ({ id: 'dev-attempt', key: '', email: null, ip: null, windowStart: new Date(), count: 1, createdAt: new Date(), updatedAt: new Date() }),
  },

  passwordResetToken: {
    create: async () => ({ id: 'dev-token', userId: '', tokenHash: '', expiresAt: new Date(), usedAt: null, createdAt: new Date() }),
    findFirst: async () => null,
    updateMany: async () => ({ count: 0 }),
  },

  $transaction: async (fnOrOps: unknown) => {
    if (typeof fnOrOps === 'function') return fnOrOps(mockClient);
    if (Array.isArray(fnOrOps)) return Promise.all(fnOrOps);
    return null;
  },

  $disconnect: async () => {},
};

export default mockClient;

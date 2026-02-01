import prisma from '@/lib/prisma';

export default async function Home() {
  const children = await prisma.child.findMany({
    include: { results: true },
  });

  const users = await prisma.user.findMany();
  console.log('USERS', users);

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard (dev)</h1>
      <pre>{JSON.stringify(children, null, 2)}</pre>
    </main>
  );
}

import prisma from '@/lib/prisma';
import { DashboardLayout } from './components/dashboard/dashboard';

export default async function Home() {
  return (
    <DashboardLayout>
      <div className="h-48 rounded-lg border bg-background" />
      <div className="h-48 rounded-lg border bg-background" />
    </DashboardLayout>
  );
}

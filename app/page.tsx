import prisma from '@/lib/prisma';
import { DashboardLayout } from './components/dashboard/dashboard';
import { WidgetCard } from './components/widgets/WidgetCard';

export default function Home() {
  return (
    <DashboardLayout>
      <WidgetCard title="Historia testów">
        <div className="h-32 rounded bg-muted" />
      </WidgetCard>

      <WidgetCard title="Progres">
        <div className="h-32 rounded bg-muted" />
      </WidgetCard>
    </DashboardLayout>
  );
}

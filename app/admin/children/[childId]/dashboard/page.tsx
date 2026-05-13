import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { getChildDashboardById } from '@/lib/queries/dashboard';
import { TestProgressWidgetServer } from '@/app/components/widgets/TestProgressWidget.server';
import { PhysiotherapistReportWidget } from '@/app/components/widgets/PhysiotherapistReportWidget';

type Props = {
  params: Promise<{ childId: string }>;
};

export default async function AdminChildDashboardPage({ params }: Props) {
  const { childId } = await params;

  await requireAdmin();

  const dashboard = await getChildDashboardById(childId);

  if (!dashboard) {
    redirect('/admin/children');
  }

  const physiotherapistReports = dashboard.physiotherapistReports.map((report) => ({
    id: report.id,
    title: report.title,
    observations: report.observations,
    recommendations: report.recommendations,
    comparisonToPrevious: report.comparisonToPrevious,
    reportDateLabel: report.reportDate.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
  }));

  const latestTestDateLabel = dashboard.latestTestDate?.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const latestReportDateLabel = dashboard.latestPhysiotherapistReportDate?.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mx-auto max-w-7xl">
      <section className="grid gap-6 md:grid-cols-2">
      <div className="md:col-span-2 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Postępy dziecka — {dashboard.child.name}
        </h1>
        <p className="text-sm text-muted-foreground">Podsumowanie wyników i rozwoju sprawności</p>
        {(latestTestDateLabel || latestReportDateLabel) && (
          <div className="space-y-1 pt-1 text-sm">
            {latestTestDateLabel && (
              <div>
                <span className="font-medium text-foreground">Ostatni pomiar:</span>{' '}
                <span className="text-muted-foreground">{latestTestDateLabel}</span>
              </div>
            )}
            {latestReportDateLabel && (
              <div>
                <span className="font-medium text-foreground">Najnowszy raport fizjoterapeutyczny:</span>{' '}
                <span className="text-muted-foreground">{latestReportDateLabel}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {dashboard.widgets.map((widget) => (
        <TestProgressWidgetServer
          key={widget.testType}
          testType={widget.testType}
          results={widget.results}
        />
      ))}

      {physiotherapistReports.length > 0 && (
        <PhysiotherapistReportWidget reports={physiotherapistReports} />
      )}
      </section>
    </div>
  );
}

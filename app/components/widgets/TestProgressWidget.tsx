import { WidgetCard } from './WidgetCard';
import { calculateStepProgress } from '@/lib/domain/progress';
import { ProgressChart } from './ProgressChart';

type TestMeasurement = {
  value: number;
  testedAt: Date;
};

type Props = {
  results: TestMeasurement[];
};

export function TestProgressWidget({ results }: Props) {
  const progress = calculateStepProgress(results);

  const chartData = results.map((r) => ({
    label: r.testedAt.toLocaleDateString('pl-PL', {
      month: 'long',
    }),
    value: r.value,
  }));

  if (!progress) {
    return (
      <WidgetCard title="Sprint 20m">
        <p className="text-sm text-muted-foreground">Za mało danych do wyliczenia progresu</p>
      </WidgetCard>
    );
  }

  const isImprovement = progress.absoluteChange < 0;

  return (
    <WidgetCard title="Sprint 20m">
      <div className="space-y-4">
        <div>
          <div className="text-2xl font-semibold">
            {isImprovement ? '+' : ''}
            {Math.abs(progress.percentChange).toFixed(1)}%
          </div>
          <p className="text-sm text-muted-foreground">
            {progress.from} → {progress.to}
          </p>
        </div>

        <ProgressChart data={chartData} />
      </div>
    </WidgetCard>
  );
}

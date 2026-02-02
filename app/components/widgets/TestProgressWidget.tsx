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
      day: '2-digit',
      month: 'short',
    }),
    value: r.value,
  }));

  if (!progress) {
    return (
      <WidgetCard title="Sprint 20 m">
        <p className="text-sm text-muted-foreground">
          Za mało danych do wyliczenia progresu
        </p>
      </WidgetCard>
    );
  }

  const isImprovement = progress.absoluteChange < 0;

  return (
    <WidgetCard title="Sprint 20 m">
      <div className="space-y-4">

        <div className="flex items-end gap-6">
          <div>
            <div className="text-3xl font-semibold leading-none">
              {isImprovement ? '+' : ''}
              {Math.abs(progress.percentChange).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              poprawa wyniku
            </p>
          </div>

          <div className="border-l pl-6">
            <div className="text-sm font-medium">
              {progress.from.toFixed(1)} s → {progress.to.toFixed(1)} s
            </div>
            <p className="text-xs text-muted-foreground">
              pierwszy → ostatni pomiar
            </p>
          </div>
        </div>

        <div className="pt-2">
          <ProgressChart data={chartData} />
        </div>
        
      </div>
    </WidgetCard>
  );
}

'use client';

import { useState } from 'react';
import { WidgetCard } from './WidgetCard';
import { ProgressChart } from './ProgressChart';
import { SelectProgressType } from './SelectProgressType';
import { ProgressMode, ProgressResult } from '@/lib/domain/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

type Props = {
  test: {
    label: string;
    unit: string;
  };
  stepProgress: ProgressResult | null;
  overallProgress: ProgressResult | null;
  chartData: { label: string; value: number }[];
  step: number;
  unit: string;
  betterDirection?: 'lower' | 'higher';
};

export function TestProgressWidgetClient({
  test,
  stepProgress,
  overallProgress,
  chartData,
  step,
  unit,
  betterDirection,
}: Props) {
  const [mode, setMode] = useState<ProgressMode>('step');
  const progress = mode === 'step' ? stepProgress : overallProgress;
  const visibleChartData = mode === 'step' ? chartData.slice(-2) : chartData;

  if (!progress) {
    if (chartData.length === 0) {
      return (
        <WidgetCard title={test.label}>
          <p className="text-sm text-muted-foreground">Brak wyników do wyświetlenia</p>
        </WidgetCard>
      );
    }

    if (chartData.length === 1) {
      const first = chartData[0];
      return (
        <WidgetCard title={test.label}>
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4 flex-nowrap">
                <div>
                  <div className="text-3xl font-semibold leading-none text-foreground">
                    {first.value} {test.unit}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Wynik startowy</p>
                </div>

                <div className="h-8 w-px bg-border" />

                <div className="text-sm font-medium flex flex-col text-muted-foreground">
                  Brak porównania
                  <span className="text-xs">Pierwszy pomiar</span>
                </div>
              </div>
            </div>

            <Alert>
              <Info />
              <AlertTitle>Pierwszy pomiar</AlertTitle>
              <AlertDescription>
                Kolejny wynik pozwoli policzyć zmianę i pokazać postępy na wykresie.
              </AlertDescription>
            </Alert>
          </div>
        </WidgetCard>
      );
    }

    return (
      <WidgetCard title={test.label}>
        <p className="text-sm text-muted-foreground">Za mało danych do wyliczenia progresu</p>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title={test.label}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 flex-nowrap">
            <div>
              <div className="text-3xl font-semibold leading-none text-foreground">
                {progress.sign}
                {Math.abs(progress.percent).toFixed(1)}%
              </div>
              <p className="text-xs font-medium text-muted-foreground">{progress.label}</p>
            </div>

            <div className="h-8 w-px bg-border" />

            <div className="text-sm font-medium flex flex-col text-foreground">
              {progress.from.toFixed(1)} {test.unit} → {progress.to.toFixed(1)} {test.unit}
              <span className="text-muted-foreground text-xs">
                {betterDirection === 'lower' ? 'mniej = lepiej' : 'więcej = lepiej'}
              </span>
            </div>
          </div>

          {chartData.length >= 3 && (
            <div className="w-full sm:w-auto sm:min-w-[220px]">
              <SelectProgressType value={mode} onChange={setMode} />
            </div>
          )}
        </div>

        <ProgressChart
          data={visibleChartData}
          step={step}
          unit={unit}
          betterDirection={betterDirection}
          title={mode === 'step' ? 'Ostatnie pomiary' : 'Postępy w czasie'}
        />
      </div>
    </WidgetCard>
  );
}

'use client';

import { useState } from 'react';
import { WidgetCard } from './WidgetCard';
import { ProgressChart } from './ProgressChart';
import { SelectProgressType } from './SelectProgressType';
import { ProgressMode } from '@/lib/domain/progress';
import { ProgressResult } from '@/lib/domain/progress';

type Props = {
  test: {
    label: string;
    unit: string;
  };
  stepProgress: ProgressResult | null;
  overallProgress: ProgressResult | null;
  chartData: { label: string; value: number }[];
};

export function TestProgressWidgetClient({
  test,
  stepProgress,
  overallProgress,
  chartData,
}: Props) {
  const [mode, setMode] = useState<ProgressMode>('step');

  const progress = mode === 'step' ? stepProgress : overallProgress;

  if (!progress) {
    return (
      <WidgetCard title={test.label}>
        <p className="text-sm text-muted-foreground">Za mało danych do wyliczenia progresu</p>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title={test.label}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div>
              <div className="text-3xl font-semibold">
                {progress.sign}
                {Math.abs(progress.percent).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">{progress.label}</p>
            </div>

            <div className="border-l pl-6 text-sm font-medium">
              {progress.from.toFixed(1)} {test.unit} → {progress.to.toFixed(1)} {test.unit}
            </div>
          </div>

          <SelectProgressType value={mode} onChange={setMode} />
        </div>

        <ProgressChart data={chartData} />
      </div>
    </WidgetCard>
  );
}

'use client';

import { useState } from 'react';
import { WidgetCard } from './WidgetCard';
import { ProgressChart } from './ProgressChart';
import { SelectProgressType } from './SelectProgressType';
import { ProgressMode, ProgressResult } from '@/lib/domain/progress';

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
};

export function TestProgressWidgetClient({
  test,
  stepProgress,
  overallProgress,
  chartData,
  step,
  unit,
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            <div>
              <div className="text-3xl font-semibold leading-none">
                {progress.sign}
                {Math.abs(progress.percent).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">{progress.label}</p>
            </div>

            <div className="text-sm font-medium sm:border-l sm:pl-6">
              {progress.from.toFixed(1)} {test.unit} → {progress.to.toFixed(1)} {test.unit}
            </div>
          </div>

          <div className="w-full sm:w-auto sm:min-w-[180px]">
            <SelectProgressType value={mode} onChange={setMode} />
          </div>
        </div>

        <ProgressChart data={chartData} step={step} unit={unit} />
      </div>
    </WidgetCard>
  );
}

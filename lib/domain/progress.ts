import { TestDefinition } from './tests';

export type Measurement = {
  value: number;
  testedAt: Date;
};

export type ProgressTrend = 'improvement' | 'regression' | 'neutral';

export type ProgressResult = {
  trend: 'improvement' | 'regression' | 'neutral';
  percent: number;
  from: number;
  to: number;
  sign: '+' | '-' | '';
  label: string;
};

export function calculateStepProgress(
  measurements: Measurement[],
  test: TestDefinition
): ProgressResult | null {
  if (measurements.length < 2) return null;

  const prev = measurements[measurements.length - 2].value;
  const last = measurements[measurements.length - 1].value;

  return interpretProgress(prev, last, test);
}

export function calculateOverallProgress(
  measurements: Measurement[],
  test: TestDefinition
): ProgressResult | null {
  if (measurements.length < 2) return null;

  const first = measurements[0].value;
  const last = measurements[measurements.length - 1].value;

  return interpretProgress(first, last, test);
}

function interpretProgress(from: number, to: number, test: TestDefinition): ProgressResult {
  const rawChange = to - from;
  const percent = Math.abs((rawChange / from) * 100);

  let trend: ProgressResult['trend'] = 'neutral';

  if (test.betterDirection === 'lower') {
    if (rawChange < 0) trend = 'improvement';
    else if (rawChange > 0) trend = 'regression';
  } else {
    if (rawChange > 0) trend = 'improvement';
    else if (rawChange < 0) trend = 'regression';
  }

  const sign = trend === 'improvement' ? '+' : trend === 'regression' ? '-' : '';
  const label =
    trend === 'improvement'
      ? 'poprawa wyniku'
      : trend === 'regression'
        ? 'pogorszenie wyniku'
        : 'brak zmiany';

  return {
    trend,
    percent,
    from,
    to,
    sign,
    label,
  };
}

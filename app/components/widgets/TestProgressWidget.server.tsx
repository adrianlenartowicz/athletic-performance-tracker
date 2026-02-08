import { getTestDefinition, TestType } from '@/lib/domain/tests';
import { calculateStepProgress, calculateOverallProgress } from '@/lib/domain/progress';
import { TestProgressWidgetClient } from '@/app/components/widgets/TestProgressWidget.client';

type TestMeasurement = {
  value: number;
  testedAt: Date;
};

type Props = {
  testType: TestType;
  results: TestMeasurement[];
};

export function TestProgressWidgetServer({ testType, results }: Props) {
  const test = getTestDefinition(testType);

  const stepProgress = calculateStepProgress(results, test);
  const overallProgress = calculateOverallProgress(results, test);

  const chartData = results.map((r) => ({
    label: r.testedAt.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'short',
    }),
    value: r.value,
  }));

  return (
    <TestProgressWidgetClient
      test={test}
      stepProgress={stepProgress}
      overallProgress={overallProgress}
      chartData={chartData}
      step={test.step}
      unit={test.unit}
    />
  );
}

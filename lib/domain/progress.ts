export type TestMeasurement = {
  value: number;
  testedAt: Date;
};

export function calculateStepProgress(results: TestMeasurement[]) {
  if (results.length < 2) {
    return null;
  }

  const sorted = [...results].sort((a, b) => a.testedAt.getTime() - b.testedAt.getTime());

  const prev = sorted[sorted.length - 2];
  const last = sorted[sorted.length - 1];

  const absoluteChange = last.value - prev.value;
  const percentChange = (absoluteChange / prev.value) * 100;

  return {
    from: prev.value,
    to: last.value,
    absoluteChange,
    percentChange,
    fromDate: prev.testedAt,
    toDate: last.testedAt,
  };
}

export function calculateOverallProgress(results: TestMeasurement[]) {
  if (results.length < 2) {
    return null;
  }

  const sorted = [...results].sort((a, b) => a.testedAt.getTime() - b.testedAt.getTime());

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const absoluteChange = last.value - first.value;
  const percentChange = (absoluteChange / first.value) * 100;

  return {
    from: first.value,
    to: last.value,
    absoluteChange,
    percentChange,
    fromDate: first.testedAt,
    toDate: last.testedAt,
  };
}

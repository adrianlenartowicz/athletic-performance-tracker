import { WidgetCard } from "./WidgetCard";
import { calculateStepProgress } from "@/lib/domain/progress";

type TestMeasurement = {
  value: number;
  testedAt: Date;
};

type Props = {
  results: TestMeasurement[];
};

export function TestProgressWidget({ results }: Props) {
  const progress = calculateStepProgress(results);

  if (!progress) {
    return (
      <WidgetCard title="Progres">
        <p className="text-sm text-muted-foreground">
          Za mało danych do wyliczenia progresu
        </p>
      </WidgetCard>
    );
  }

  const isImprovement = progress.absoluteChange < 0;

  return (
    <WidgetCard title="Progres">
      <div className="space-y-2">
        <div className="text-2xl font-semibold">
          {isImprovement ? "+" : ""}
          {Math.abs(progress.percentChange).toFixed(1)}%
        </div>

        <p className="text-sm text-muted-foreground">
          {progress.from} → {progress.to}
        </p>
      </div>
    </WidgetCard>
  );
}

'use client';

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

type ChartPoint = {
  label: string;
  value: number;
};

type Props = {
  data: ChartPoint[];
  step: number;
  unit: string;
  betterDirection?: 'lower' | 'higher';
  title?: string;
};

function ticksToDisplay(min: number, max: number, step: number) {
  const ticks: number[] = [];
  const baseFirstTick = Math.floor(min / step) * step;
  const firstTick = baseFirstTick === min ? baseFirstTick - step : baseFirstTick;

  for (let value = firstTick; value <= max + step; value += step) {
    ticks.push(value);
  }

  return ticks;
}

export function ProgressChart({
  data,
  step,
  unit,
  betterDirection,
  title = 'Postępy w czasie',
}: Props) {
  const chartConfig = {
    value: {
      label: 'Wynik',
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const ticks = ticksToDisplay(min, max, step);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart data={data} margin={{ top: 20, bottom: 20, left: 10, right: 20 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />

            <XAxis
              dataKey="label"
              padding={{ left: 16, right: 16 }}
              tickLine={false}
              axisLine={false}
              tickMargin={18}
            />

            <YAxis
              reversed={betterDirection === 'lower'}
              ticks={ticks}
              domain={[ticks[0], ticks[ticks.length - 1]]}
              axisLine={false}
              tickLine={false}
              tickMargin={14}
              width={44}
              tick={{
                fontSize: 11,
                fill: 'hsl(var(--muted-foreground))',
              }}
              tickFormatter={(value) => `${value}\u00A0${unit}`}
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent formatter={(value) => ['Wynik: ', `${value}\u00A0${unit}`]} />
              }
            />

            <Line
              dataKey="value"
              type="linear"
              stroke="var(--color-value)"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

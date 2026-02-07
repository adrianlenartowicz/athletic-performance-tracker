'use client';

import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { YAxis } from 'recharts';

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
  title?: string;
};

export function ProgressChart({ data, title = 'Postępy w czasie' }: Props) {
  const chartConfig = {
    value: {
      label: 'Wynik',
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  const padding = range === 0 ? Math.abs(min) * 0.1 || 1 : range * 0.15;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            data={data}
            margin={{
              top: 20,
              bottom: 20,
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              padding={{ left: 16, right: 16 }}
              tickLine={false}
              axisLine={false}
              tickMargin={18}
            />
            <YAxis hide domain={[min - padding, max + padding]} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
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

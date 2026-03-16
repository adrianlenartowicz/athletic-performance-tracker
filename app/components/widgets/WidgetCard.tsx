import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type WidgetCardProps = {
  title: string;
  children: ReactNode;
};

export function WidgetCard({ title, children }: WidgetCardProps) {
  return (
    <Card className="gap-3">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

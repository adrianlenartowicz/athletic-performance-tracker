import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type WidgetCardProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function WidgetCard({ title, children, className }: WidgetCardProps) {
  return (
    <Card className={cn('gap-3', className)}>
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

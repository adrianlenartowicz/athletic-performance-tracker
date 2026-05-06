'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type PhysiotherapistReportView = {
  id: string;
  title: string;
  reportDateLabel: string;
  observations: string[];
  recommendations: string[];
  comparisonToPrevious: string | null;
};

type PhysiotherapistReportWidgetProps = {
  reports: PhysiotherapistReportView[];
};

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-6 text-foreground">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2">
          <span className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-primary/70" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function PhysiotherapistReportWidget({ reports }: PhysiotherapistReportWidgetProps) {
  const [selectedReportId, setSelectedReportId] = useState(reports[0]?.id ?? '');
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? reports[0],
    [reports, selectedReportId]
  );

  if (!selectedReport) {
    return null;
  }

  return (
    <WidgetCard title="Raport fizjoterapeutyczny" className="md:col-span-2">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <FileText className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>

            <div>
              <div className="font-medium">{selectedReport.title}</div>
              <div className="text-sm text-muted-foreground">
                Raport z {selectedReport.reportDateLabel}
              </div>
            </div>
          </div>

          {reports.length > 1 ? (
            <Select
              value={selectedReport.id}
              onValueChange={(value) => {
                setSelectedReportId(value);
                setIsExpanded(false);
              }}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reports.map((report) => (
                  <SelectItem key={report.id} value={report.id}>
                    Raport z {report.reportDateLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className={`relative ${isExpanded ? '' : 'max-h-80 overflow-hidden'}`}>
            <div className="space-y-6">
              <section className="space-y-3">
                <h2 className="text-sm font-medium">Obserwacje</h2>
                <BulletList items={selectedReport.observations} />
              </section>

              {selectedReport.comparisonToPrevious ? (
                <section className="rounded-lg border bg-muted/40 p-4">
                  <h2 className="text-sm font-medium">Zmiany od poprzedniego badania</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {selectedReport.comparisonToPrevious}
                  </p>
                </section>
              ) : null}

              <section className="space-y-3">
                <h2 className="text-sm font-medium">Zalecenia</h2>
                <BulletList items={selectedReport.recommendations} />
              </section>
            </div>

            {!isExpanded ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-fit"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((current) => !current)}
          >
            {isExpanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
            {isExpanded ? 'Zwiń raport' : 'Pokaż cały raport'}
          </Button>
        </div>
      </div>
    </WidgetCard>
  );
}

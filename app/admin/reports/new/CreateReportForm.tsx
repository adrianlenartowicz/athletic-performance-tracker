'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createReport } from './actions';

type Child = {
  id: string;
  name: string;
  birthYear: number;
  group: { name: string; location: string | null };
};

export default function CreateReportForm({ children }: { children: Child[] }) {
  const [observations, setObservations] = useState(['']);
  const [recommendations, setRecommendations] = useState(['']);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function updateLine(
    list: string[],
    setList: (v: string[]) => void,
    index: number,
    value: string
  ) {
    const next = [...list];
    next[index] = value;
    setList(next);
  }

  function addLine(list: string[], setList: (v: string[]) => void) {
    setList([...list, '']);
  }

  function removeLine(list: string[], setList: (v: string[]) => void, index: number) {
    setList(list.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    observations.filter(Boolean).forEach((o) => formData.append('observations', o));
    recommendations.filter(Boolean).forEach((r) => formData.append('recommendations', r));

    try {
      await createReport(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setPending(false);
    }
  }

  function formatChild(child: Child) {
    const group = child.group.location
      ? `${child.group.name} (${child.group.location})`
      : child.group.name;
    return `${child.name}, ${child.birthYear} — ${group}`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Dziecko</h2>

        <div className="space-y-2">
          <Label htmlFor="childId">Dziecko</Label>
          <Select name="childId" required>
            <SelectTrigger id="childId">
              <SelectValue placeholder="Wybierz dziecko" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {formatChild(child)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reportDate">Data raportu</Label>
          <Input id="reportDate" name="reportDate" type="date" required />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Obserwacje
        </h2>
        <div className="space-y-2">
          {observations.map((obs, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={obs}
                onChange={(e) => updateLine(observations, setObservations, i, e.target.value)}
                placeholder={`Obserwacja ${i + 1}`}
              />
              {observations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLine(observations, setObservations, i)}
                  className="text-sm text-muted-foreground hover:text-destructive px-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addLine(observations, setObservations)}
        >
          + Dodaj obserwację
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Zalecenia
        </h2>
        <div className="space-y-2">
          {recommendations.map((rec, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={rec}
                onChange={(e) => updateLine(recommendations, setRecommendations, i, e.target.value)}
                placeholder={`Zalecenie ${i + 1}`}
              />
              {recommendations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLine(recommendations, setRecommendations, i)}
                  className="text-sm text-muted-foreground hover:text-destructive px-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addLine(recommendations, setRecommendations)}
        >
          + Dodaj zalecenie
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Porównanie z poprzednim raportem
        </h2>
        <div className="space-y-2">
          <Label htmlFor="comparisonToPrevious">Co się zmieniło? (opcjonalnie)</Label>
          <Input id="comparisonToPrevious" name="comparisonToPrevious" autoComplete="off" />
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? 'Zapisywanie...' : 'Zapisz raport'}
      </Button>
    </form>
  );
}

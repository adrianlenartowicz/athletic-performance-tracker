'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TEST_DEFINITIONS, TestType } from '@/lib/domain/tests';
import { createTestResult } from './actions';

type Child = { id: string; name: string; birthYear: number; group: { name: string; location: string | null } };

const TEST_TYPES = Object.values(TEST_DEFINITIONS);

function formatChild(child: Child) {
  const group = child.group.location ? `${child.group.name} (${child.group.location})` : child.group.name;
  return `${child.name}, ur. ${child.birthYear} — ${group}`;
}

export default function CreateResultForm({ children }: { children: Child[] }) {
  const [testType, setTestType] = useState<TestType>('sprint_20m');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const definition = TEST_DEFINITIONS[testType];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await createTestResult(new FormData(e.currentTarget));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Coś poszło nie tak.');
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
        <Label htmlFor="testType">Rodzaj testu</Label>
        <Select
          name="testType"
          value={testType}
          onValueChange={(v) => setTestType(v as TestType)}
        >
          <SelectTrigger id="testType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEST_TYPES.map((t) => (
              <SelectItem key={t.type} value={t.type}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">
          Wynik <span className="text-muted-foreground font-normal">({definition.unit})</span>
        </Label>
        <Input
          id="value"
          name="value"
          type="number"
          inputMode="decimal"
          step="any"
          min={definition.minValue}
          max={definition.maxValue}
          placeholder={`${definition.minValue}–${definition.maxValue} ${definition.unit}`}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="testedAt">Data testu</Label>
        <Input
          id="testedAt"
          name="testedAt"
          type="date"
          required
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? 'Zapisywanie...' : 'Zapisz wynik'}
      </Button>
    </form>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { TestDefinition } from '@/lib/domain/tests';
import { saveTestResult } from '@/app/trainer/test-session/session/actions';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Child = {
  id: string;
  name: string;
};

type SavedResult = {
  id: string;
  name: string;
  value: number;
  unit: string;
};

type Props = {
  test: TestDefinition;
  children: Child[];
};

export default function TrainerSessionClient({ test, children }: Props) {
  const [queue, setQueue] = useState(children);
  const [allAttemptsMap, setAllAttemptsMap] = useState<Record<string, number[]>>({});
  const [value, setValue] = useState<number | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [sessionResults, setSessionResults] = useState<SavedResult[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const childrenKey = [...children]
    .map((c) => c.id)
    .sort()
    .join(',');
  const storageKey = `trainerSession:${test.type}:${childrenKey}`;

  const child = queue[0];
  const nextChild = queue[1];

  useEffect(() => {
    inputRef.current?.focus();
    setErrorMessage(null);
  }, [child]);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        testType: string;
        childrenIds: string[];
        queue: Child[];
        allAttemptsMap: Record<string, number[]>;
        value: number | null;
        sessionResults: SavedResult[];
        savedAt: number;
      };

      if (parsed.testType !== test.type) return;
      const parsedKey = [...(parsed.childrenIds ?? [])].sort().join(',');
      if (parsedKey !== childrenKey) return;

      const hasLocalData =
        (parsed.sessionResults?.length ?? 0) > 0 ||
        Object.keys(parsed.allAttemptsMap ?? {}).length > 0 ||
        parsed.value !== null;

      if (!hasLocalData) {
        localStorage.removeItem(storageKey);
        return;
      }

      setQueue(parsed.queue ?? children);
      setAllAttemptsMap(parsed.allAttemptsMap ?? {});
      setValue(parsed.value ?? null);
      setSessionResults(parsed.sessionResults ?? []);
      setRestoreNotice('Przywrócono przerwaną sesję.');
      setTimeout(() => setRestoreNotice(null), 2500);
    } catch {
      // If parsing fails, ignore saved state.
    }
  }, [storageKey, test.type, children]);

  useEffect(() => {
    const hasLocalData =
      sessionResults.length > 0 || Object.keys(allAttemptsMap).length > 0 || value !== null;

    if (!hasLocalData) {
      return;
    }
    const payload = {
      testType: test.type,
      childrenIds: [...children].map((c) => c.id).sort(),
      queue,
      allAttemptsMap,
      value,
      sessionResults,
      savedAt: Date.now(),
    };

    localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [storageKey, test.type, children, queue, allAttemptsMap, value, sessionResults]);

  useEffect(() => {
    if (queue.length === 0) {
      localStorage.removeItem(storageKey);
    }
  }, [queue.length, storageKey]);

  if (!child) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-xl font-semibold">Sesja zakończona</div>
          <div className="text-muted-foreground">Wszystkie wyniki zapisane</div>
        </div>

        <div className="rounded-xl border">
          <div className="px-4 py-3 border-b font-medium">Wyniki z tej sesji</div>
          {sessionResults.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              Brak zapisanych wyników w tej sesji.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dziecko</TableHead>
                  <TableHead>Wynik</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.name}</TableCell>
                    <TableCell>
                      {result.value} {result.unit}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex justify-center">
          <Button asChild size="lg">
            <Link href="/trainer/test-session">Nowa sesja</Link>
          </Button>
        </div>
      </div>
    );
  }

  const childAttempts = allAttemptsMap[child.id] ?? [];
  const attemptNumber = childAttempts.length + 1;
  const isOutOfRange = value !== null && (value < test.minValue || value > test.maxValue);

  function bestOf(values: number[]) {
    return test.betterDirection === 'lower' ? Math.min(...values) : Math.max(...values);
  }

  function removeFinishedChild(childId: string) {
    setAllAttemptsMap((prevAttempts) => {
      const { [childId]: _, ...rest } = prevAttempts;
      return rest;
    });
    setQueue((prevQueue) => prevQueue.slice(1));
  }

  async function saveAttempt(action: 'next-child' | 'second-attempt') {
    if (value === null || isSaving) return;
    setErrorMessage(null);

    const childUpdatedAttempts = [...childAttempts, value];
    const newAllAttemptsMap = {
      ...allAttemptsMap,
      [child.id]: childUpdatedAttempts,
    };

    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 800);

    if (childUpdatedAttempts.length === 2) {
      const best = bestOf(childUpdatedAttempts);

      setIsSaving(true);
      try {
        await saveTestResult({
          childId: child.id,
          testType: test.type,
          value: best,
        });
      } catch {
        setErrorMessage('Nie udało się zapisać wyniku. Spróbuj ponownie.');
        return;
      } finally {
        setIsSaving(false);
      }

      setSessionResults((prev) => [
        ...prev,
        {
          id: child.id,
          name: child.name,
          value: best,
          unit: test.unit,
        },
      ]);

      removeFinishedChild(child.id);
      setValue(null);
      return;
    }

    setAllAttemptsMap(newAllAttemptsMap);
    setValue(null);

    if (action === 'next-child') {
      setQueue((q) => [...q.slice(1), q[0]]);
    }
  }

  return (
    <main className="mx-auto max-w-md p-4 space-y-6">
      {restoreNotice && (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm">{restoreNotice}</div>
      )}
      <header className="space-y-1">
        <div className="text-sm text-muted-foreground">{test.label}</div>
        <div className="text-lg font-semibold">{child.name}</div>
      </header>

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Próba {attemptNumber} / 2</span>
        <span>{nextChild ? `Następny: ${nextChild.name}` : 'Ostatnie dziecko'}</span>
      </div>

      <div className="rounded-xl border p-5 space-y-4">
        <input
          ref={inputRef}
          type="number"
          step={test.step}
          inputMode="decimal"
          placeholder={`(${test.unit})`}
          className={`w-full rounded-lg border px-4 py-4 text-2xl text-center ${
            isOutOfRange ? 'border-destructive focus-visible:border-destructive' : ''
          }`}
          value={value ?? ''}
          disabled={isSaving}
          onChange={(e) => setValue(e.target.value === '' ? null : Number(e.target.value))}
        />
        <div className="text-center text-xs text-muted-foreground">
          Zakres: {test.minValue}–{test.maxValue} {test.unit}
        </div>
        {isOutOfRange && (
          <div className="text-center text-sm text-destructive">
            Wartość poza zakresem dla tego testu.
          </div>
        )}
        {errorMessage && <div className="text-center text-sm text-destructive">{errorMessage}</div>}

        {childAttempts.length === 1 && (
          <div className="text-center text-sm text-muted-foreground">
            Próba 1: {childAttempts[0]} {test.unit}
          </div>
        )}

        {justSaved && <div className="text-center text-sm text-green-600">✓ Zapisano</div>}

        <div className="space-y-2">
          {childAttempts.length === 0 && (
            <>
              <button
                type="button"
                onClick={() => saveAttempt('next-child')}
                disabled={value === null || isSaving || isOutOfRange}
                className="w-full rounded-lg bg-primary py-3 text-primary-foreground disabled:opacity-40"
              >
                Zapisz i następne dziecko
              </button>

              <button
                type="button"
                onClick={() => saveAttempt('second-attempt')}
                disabled={value === null || isSaving || isOutOfRange}
                className="w-full rounded-lg border py-3 disabled:opacity-40"
              >
                Zapisz i druga próba
              </button>
            </>
          )}

          {childAttempts.length === 1 && (
            <button
              type="button"
              onClick={() => saveAttempt('next-child')}
              disabled={value === null || isSaving || isOutOfRange}
              className="w-full rounded-lg bg-primary py-3 text-primary-foreground disabled:opacity-40"
            >
              Zapisz i zakończ dla dziecka
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

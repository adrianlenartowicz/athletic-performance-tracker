'use client';

import { useEffect, useRef, useState } from 'react';
import { TestDefinition } from '@/lib/domain/tests';

type Child = {
  id: string;
  name: string;
};

type Props = {
  test: TestDefinition;
  children: Child[];
};

export default function TrainerSessionClient({ test, children }: Props) {
  const [queue, setQueue] = useState(children);
  const [attemptsMap, setAttemptsMap] = useState<Record<string, number[]>>({});
  const [value, setValue] = useState<number | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const child = queue[0];
  const nextChild = queue[1];

  useEffect(() => {
    inputRef.current?.focus();
  }, [child]);

  if (!child) {
    return (
      <div className="p-6 text-center space-y-2">
        <div className="text-xl font-semibold">Sesja zakończona</div>
        <div className="text-muted-foreground">Wszystkie wyniki zapisane</div>
      </div>
    );
  }

  const attempts = attemptsMap[child.id] ?? [];
  const attemptNumber = attempts.length + 1;

  function bestOf(values: number[]) {
    return test.betterDirection === 'lower' ? Math.min(...values) : Math.max(...values);
  }

  function saveAttempt(action: 'next-child' | 'second-attempt') {
    if (value === null) return;

    const updatedAttempts = [...attempts, value];
    const nextMap = {
      ...attemptsMap,
      [child.id]: updatedAttempts,
    };

    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 800);

    if (updatedAttempts.length === 2) {
      const best = bestOf(updatedAttempts);

      // TODO: server action
      // await saveTestResult({ childId: child.id, testType: test.type, value: best })

      const { [child.id]: _, ...rest } = nextMap;
      setAttemptsMap(rest);
      setQueue((q) => q.slice(1));
      setValue(null);
      return;
    }

    setAttemptsMap(nextMap);
    setValue(null);

    if (action === 'next-child') {
      setQueue((q) => [...q.slice(1), q[0]]);
    }
  }

  return (
    <main className="mx-auto max-w-md p-4 space-y-6">
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
          className="w-full rounded-lg border px-4 py-4 text-2xl text-center"
          value={value ?? ''}
          onChange={(e) => setValue(e.target.value === '' ? null : Number(e.target.value))}
        />

        {attempts.length === 1 && (
          <div className="text-center text-sm text-muted-foreground">
            Próba 1: {attempts[0]} {test.unit}
          </div>
        )}

        {justSaved && <div className="text-center text-sm text-green-600">✓ Zapisano</div>}

        <div className="space-y-2">
          {attempts.length === 0 && (
            <>
              <button
                type="button"
                onClick={() => saveAttempt('next-child')}
                disabled={value === null}
                className="w-full rounded-lg bg-primary py-3 text-primary-foreground disabled:opacity-40"
              >
                Zapisz i następne dziecko
              </button>

              <button
                type="button"
                onClick={() => saveAttempt('second-attempt')}
                disabled={value === null}
                className="w-full rounded-lg border py-3 disabled:opacity-40"
              >
                Zapisz i druga próba
              </button>
            </>
          )}

          {attempts.length === 1 && (
            <button
              type="button"
              onClick={() => saveAttempt('next-child')}
              disabled={value === null}
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

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { TEST_DEFINITIONS } from '@/lib/domain/tests';

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

type SavedSession = {
  storageKey: string;
  testType: string;
  childrenIds: string[];
  queue: Child[];
  allAttemptsMap: Record<string, number[]>;
  value: number | null;
  sessionResults: SavedResult[];
  savedAt: number;
};

type Props = {
  childrenList: Child[];
};

export default function SessionRestorePrompt({ childrenList }: Props) {
  const router = useRouter();
  const [session, setSession] = useState<SavedSession | null>(null);

  const nameById = useMemo(
    () => new Map(childrenList.map((child) => [child.id, child.name])),
    [childrenList]
  );

  useEffect(() => {
    const sessions: SavedSession[] = [];

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('trainerSession:')) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw) as Omit<SavedSession, 'storageKey'>;
        if (!parsed.testType || !Array.isArray(parsed.childrenIds)) continue;

        const hasLocalData =
          (parsed.sessionResults?.length ?? 0) > 0 ||
          Object.keys(parsed.allAttemptsMap ?? {}).length > 0 ||
          parsed.value !== null;

        if (!hasLocalData) {
          localStorage.removeItem(key);
          continue;
        }

        sessions.push({
          storageKey: key,
          testType: parsed.testType,
          childrenIds: parsed.childrenIds,
          queue: parsed.queue ?? [],
          allAttemptsMap: parsed.allAttemptsMap ?? {},
          value: parsed.value ?? null,
          sessionResults: parsed.sessionResults ?? [],
          savedAt: parsed.savedAt ?? 0,
        });
      } catch {
        // Ignore invalid localStorage entries.
      }
    }

    if (sessions.length === 0) return;

    sessions.sort((a, b) => b.savedAt - a.savedAt);
    setSession(sessions[0]);
  }, []);

  if (!session) return null;

  const activeSession = session;
  const definition = TEST_DEFINITIONS[activeSession.testType as keyof typeof TEST_DEFINITIONS];
  const normalizedChildrenKey = [...activeSession.childrenIds].sort().join(',');
  const normalizedStorageKey = `trainerSession:${activeSession.testType}:${normalizedChildrenKey}`;
  const restoreFlagKey = `trainerSession:restore:${normalizedStorageKey}`;

  function handleRestore() {
    if (normalizedStorageKey !== activeSession.storageKey) {
      const raw = localStorage.getItem(activeSession.storageKey);
      if (raw) {
        localStorage.setItem(normalizedStorageKey, raw);
        localStorage.removeItem(activeSession.storageKey);
      }
    }
    const params = new URLSearchParams();
    params.set('test', activeSession.testType);
    activeSession.childrenIds.forEach((id) => params.append('child', id));

    sessionStorage.setItem(restoreFlagKey, '1');
    router.push(`/trainer/test-session/session?${params.toString()}`);
  }

  function handleDiscard() {
    localStorage.removeItem(activeSession.storageKey);
    setSession(null);
  }

  return (
    <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
      <div className="space-y-1">
        <div className="font-medium">Wykryto przerwaną sesję</div>
        <div className="text-sm text-muted-foreground">
          Test: {definition?.label ?? activeSession.testType}
        </div>
        <div className="text-xs text-muted-foreground">
          Ostatni zapis:{' '}
          {new Date(activeSession.savedAt).toLocaleString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
        <div className="text-xs text-muted-foreground">
          Pozostało dzieci: {activeSession.queue.length}
        </div>
      </div>

      {(activeSession.sessionResults.length > 0 ||
        Object.keys(activeSession.allAttemptsMap).length > 0) && (
        <div className="rounded-md border bg-background p-3 space-y-3">
          <div className="text-xs font-medium text-muted-foreground">Podgląd stanu sesji</div>

          {activeSession.sessionResults.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Zapisane w bazie</div>
              <div className="space-y-1">
                {activeSession.sessionResults.map((result) => (
                  <div
                    key={`saved-${result.id}`}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="font-medium">{result.name}</div>
                    <div className="text-muted-foreground">
                      {result.value} {result.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(activeSession.allAttemptsMap).length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">W trakcie (niezapisane)</div>
              <div className="space-y-1">
                {Object.entries(activeSession.allAttemptsMap).map(([childId, attempts]) => (
                  <div
                    key={`attempt-${childId}`}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="font-medium">{nameById.get(childId) ?? 'Nieznane dziecko'}</div>
                    <div className="text-muted-foreground">
                      Próba 1: {attempts[0]} {definition?.unit ?? ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" onClick={handleRestore}>
          Przywróć sesję
        </Button>
        <Button type="button" variant="outline" onClick={handleDiscard}>
          Odrzuć
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createUser } from './actions';

type Group = { id: string; name: string; location: string | null };

type Child = { id: number; name: string; birthYear: string; groupId: string };

let nextId = 1;

function emptyChild(groupId: string): Child {
  return { id: nextId++, name: '', birthYear: '', groupId };
}

export default function CreateUserForm({ groups }: { groups: Group[] }) {
  const defaultGroupId = groups[0]?.id ?? '';
  const [role, setRole] = useState<'PARENT' | 'TRAINER'>('PARENT');
  const [children, setChildren] = useState<Child[]>([emptyChild(defaultGroupId)]);
  const [trainerGroupIds, setTrainerGroupIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function addChild() {
    setChildren((prev) => [...prev, emptyChild(defaultGroupId)]);
  }

  function removeChild(id: number) {
    setChildren((prev) => prev.filter((c) => c.id !== id));
  }

  function updateChild(id: number, field: keyof Omit<Child, 'id'>, value: string) {
    setChildren((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  function toggleTrainerGroup(groupId: string) {
    setTrainerGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);

    if (role === 'TRAINER') {
      trainerGroupIds.forEach((id) => formData.append('groupIds', id));
    }

    try {
      await createUser(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setPending(false);
    }
  }

  function formatGroup(group: Group) {
    return group.location ? `${group.name} (${group.location})` : group.name;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
<div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="off" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Rola</Label>
          <Select
            name="role"
            value={role}
            onValueChange={(v) => setRole(v as 'PARENT' | 'TRAINER')}
          >
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PARENT">Rodzic</SelectItem>
              <SelectItem value="TRAINER">Trener</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {role === 'PARENT' && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Dzieci</h2>

          <div className="space-y-3">
            {children.map((child, index) => (
              <div key={child.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Dziecko {index + 1}</span>
                  {children.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChild(child.id)}
                      className="text-sm text-muted-foreground hover:text-destructive"
                    >
                      Usuń
                    </button>
                  )}
                </div>

                <input type="hidden" name="childName" value={child.name} />
                <input type="hidden" name="childBirthYear" value={child.birthYear} />
                <input type="hidden" name="childGroupId" value={child.groupId} />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Imię i nazwisko</Label>
                    <Input
                      value={child.name}
                      onChange={(e) => updateChild(child.id, 'name', e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rok urodzenia</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={child.birthYear}
                      onChange={(e) => updateChild(child.id, 'birthYear', e.target.value)}
                      placeholder="np. 2015"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Grupa</Label>
                  <Select
                    value={child.groupId}
                    onValueChange={(v) => updateChild(child.id, 'groupId', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {formatGroup(g)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addChild}>
            + Dodaj dziecko
          </Button>
        </div>
      )}

      {role === 'TRAINER' && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Grupy</h2>
          <div className="space-y-2">
            {groups.map((group) => (
              <label key={group.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  checked={trainerGroupIds.includes(group.id)}
                  onChange={() => toggleTrainerGroup(group.id)}
                />
                <span className="text-sm">{formatGroup(group)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Tworzenie...' : 'Utwórz użytkownika'}
      </Button>
    </form>
  );
}

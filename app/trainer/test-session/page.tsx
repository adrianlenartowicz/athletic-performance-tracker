import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllChildrenForTrainer } from '@/lib/queries/children';
import { TEST_DEFINITIONS } from '@/lib/domain/tests';
import { startTestSession } from './actions';
import SessionRestorePrompt from '@/app/components/trainer/SessionRestorePrompt';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function TrainerTestSessionPage() {
  const session = await requireAuth();
  if (session.user.role !== 'TRAINER') redirect('/');

  const children = await getAllChildrenForTrainer(session.user.id);

  return (
    <form action={startTestSession} className="mx-auto max-w-5xl space-y-8 p-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Nowa sesja testowa</h1>
        <p className="text-sm text-muted-foreground">
          Wybierz test oraz dzieci, które bierzę udział w pomiarze
        </p>
      </header>

      <SessionRestorePrompt childrenList={children} />

      <section className="max-w-sm">
        <Select name="testType" required>
          <SelectTrigger className="h-12 w-full px-4 text-base">
            <SelectValue placeholder="Wybierz test" />
          </SelectTrigger>
          <SelectContent className="max-h-[60vh] text-base">
            {Object.entries(TEST_DEFINITIONS).map(([key, test]) => (
              <SelectItem key={key} value={key} className="py-3 text-base">
                {test.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Dzieci biorące udział</h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <label key={child.id} className="cursor-pointer">
              <input type="checkbox" name="childIds" value={child.id} className="peer sr-only" />

              <Card className="transition peer-checked:border-primary peer-checked:ring-1 peer-checked:ring-primary">
                <CardContent className="flex items-center gap-3 pr-4 pl-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {child.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{child.name}</div>
                    <p className="text-sm text-muted-foreground">{child.birthYear}</p>
                  </div>
                </CardContent>
              </Card>
            </label>
          ))}
        </div>
      </section>

      <div className="pt-4">
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          Rozpocznij sesję
        </Button>
      </div>
    </form>
  );
}

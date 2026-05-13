import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getAdminUsers, type AdminUser } from '@/lib/queries/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ROLE_LABEL: Record<AdminUser['role'], string> = {
  ADMIN: 'Admin',
  TRAINER: 'Trener',
  PARENT: 'Rodzic',
};

function formatDate(date: Date) {
  return date.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatCount(count: number) {
  if (count === 1) return '1 konto';
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14)) {
    return `${count} konta`;
  }
  return `${count} kont`;
}

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await getAdminUsers();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Użytkownicy</h1>
          <p className="text-sm text-muted-foreground">{formatCount(users.length)} w systemie</p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new">Dodaj użytkownika</Link>
        </Button>
      </div>

      {users.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nie ma jeszcze żadnych użytkowników.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rola</TableHead>
                <TableHead>Utworzono</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium break-all">{user.email}</TableCell>
                  <TableCell>{ROLE_LABEL[user.role]}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    {user.isActivated ? (
                      <Badge variant="success">Aktywne</Badge>
                    ) : (
                      <Badge variant="warning">Oczekuje na aktywację</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        „Oczekuje na aktywację” oznacza, że użytkownik nie kliknął jeszcze w link aktywacyjny
        i nie ustawił własnego hasła.
      </p>
    </div>
  );
}

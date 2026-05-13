import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const createdEmail = params.created;
  const reportCreated = params.report === 'created';
  const resultCreated = params.result === 'created';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">Zarządzanie użytkownikami i raportami</p>
      </div>

      {createdEmail && (
        <Alert>
          <AlertDescription>
            Użytkownik <strong>{createdEmail}</strong> został utworzony. Link aktywacyjny został wysłany na podany adres email.
          </AlertDescription>
        </Alert>
      )}

      {reportCreated && (
        <Alert>
          <AlertDescription>Raport fizjoterapeutyczny został zapisany.</AlertDescription>
        </Alert>
      )}

      {resultCreated && (
        <Alert>
          <AlertDescription>Wynik testu został zapisany.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        <Link href="/admin/users">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Użytkownicy</CardTitle>
              <CardDescription>
                Przeglądaj konta i dodawaj nowych rodziców lub trenerów
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/reports/new">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Dodaj raport fizjoterapeutyczny</CardTitle>
              <CardDescription>Utwórz raport dla wybranego dziecka</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/results/new">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Dodaj wynik testu</CardTitle>
              <CardDescription>Zapisz wynik testu dla wybranego dziecka</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/children">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Postępy dzieci</CardTitle>
              <CardDescription>Przeglądaj wyniki i raporty dla każdego dziecka</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}

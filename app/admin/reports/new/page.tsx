import { getAdminChildren } from '@/lib/queries/admin';
import CreateReportForm from './CreateReportForm';

export default async function NewReportPage() {
  const children = await getAdminChildren();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dodaj raport fizjoterapeutyczny</h1>
        <p className="text-sm text-muted-foreground">Utwórz nowy raport dla wybranego dziecka.</p>
      </div>

      <CreateReportForm children={children} />
    </div>
  );
}

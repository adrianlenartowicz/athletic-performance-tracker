import { requireAdmin } from '@/lib/auth';
import { getAdminChildren } from '@/lib/queries/admin';
import CreateResultForm from './CreateResultForm';

export default async function NewResultPage() {
  await requireAdmin();
  const children = await getAdminChildren();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dodaj wynik testu</h1>
      </div>
      <CreateResultForm children={children} />
    </div>
  );
}

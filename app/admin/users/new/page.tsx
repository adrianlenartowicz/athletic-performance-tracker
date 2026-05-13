import { getAdminGroups } from '@/lib/queries/admin';
import CreateUserForm from './CreateUserForm';

export default async function NewUserPage() {
  const groups = await getAdminGroups();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Utwórz użytkownika</h1>
        <p className="text-sm text-muted-foreground">
          Użytkownik otrzyma email z hasłem tymczasowym.
        </p>
      </div>

      <CreateUserForm groups={groups} />
    </div>
  );
}

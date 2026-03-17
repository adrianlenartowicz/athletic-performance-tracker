import { requireAuthForPasswordChange } from '@/lib/auth';
import ChangePasswordForm from './ChangePasswordForm';

export default async function ChangePasswordPage() {
  await requireAuthForPasswordChange();

  return <ChangePasswordForm />;
}

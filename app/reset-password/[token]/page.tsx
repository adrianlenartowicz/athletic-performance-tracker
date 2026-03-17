import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  RESET_PASSWORD_TOKEN_COOKIE_NAME,
  RESET_PASSWORD_TOKEN_TTL_SECONDS,
  getResetPasswordTokenCookieOptions,
  isResetPasswordTokenFormatValid,
} from '@/lib/reset-password';

type Props = {
  params: Promise<{
    token: string;
  }>;
};

export default async function ResetPasswordWithTokenPage({ params }: Props) {
  const { token } = await params;
  const cookieStore = await cookies();

  if (!token || !isResetPasswordTokenFormatValid(token)) {
    cookieStore.set(RESET_PASSWORD_TOKEN_COOKIE_NAME, '', getResetPasswordTokenCookieOptions(0));
    redirect('/reset-password');
  }

  cookieStore.set(
    RESET_PASSWORD_TOKEN_COOKIE_NAME,
    token,
    getResetPasswordTokenCookieOptions(RESET_PASSWORD_TOKEN_TTL_SECONDS)
  );

  redirect('/reset-password/update');
}

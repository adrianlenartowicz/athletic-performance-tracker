export const RESET_PASSWORD_TOKEN_COOKIE_NAME = 'reset_password_token';
export const RESET_PASSWORD_TOKEN_TTL_SECONDS = 10 * 60;

export function getResetPasswordTokenCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/reset-password',
    maxAge,
  };
}

export function isResetPasswordTokenFormatValid(token: string) {
  return /^[a-f0-9]{64}$/i.test(token);
}

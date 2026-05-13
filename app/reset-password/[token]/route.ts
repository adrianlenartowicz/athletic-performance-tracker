import { NextRequest, NextResponse } from 'next/server';
import {
  RESET_PASSWORD_TOKEN_COOKIE_NAME,
  RESET_PASSWORD_TOKEN_TTL_SECONDS,
  getResetPasswordTokenCookieOptions,
  isResetPasswordTokenFormatValid,
} from '@/lib/reset-password';

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { token } = await context.params;
  const origin = request.nextUrl.origin;

  if (!token || !isResetPasswordTokenFormatValid(token)) {
    const response = NextResponse.redirect(new URL('/reset-password', origin));
    response.cookies.set(
      RESET_PASSWORD_TOKEN_COOKIE_NAME,
      '',
      getResetPasswordTokenCookieOptions(0)
    );
    return response;
  }

  const response = NextResponse.redirect(new URL('/reset-password/update', origin));
  response.cookies.set(
    RESET_PASSWORD_TOKEN_COOKIE_NAME,
    token,
    getResetPasswordTokenCookieOptions(RESET_PASSWORD_TOKEN_TTL_SECONDS)
  );
  return response;
}

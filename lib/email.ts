import { Resend } from 'resend';
import { RESET_PASSWORD_TOKEN_TTL_SECONDS } from '@/lib/reset-password';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'no-reply@mail.alawroc.pl';
const REPLY_TO_EMAIL = process.env.EMAIL_REPLY_TO ?? 'akademia@alawroc.pl';

export async function sendWelcomeEmail(to: string, temporaryPassword: string, loginUrl: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[dev] RESEND_API_KEY not set — skipping welcome email to ${to} (password: ${temporaryPassword})`);
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    replyTo: REPLY_TO_EMAIL,
    subject: 'Twoje konto w Akademii Lekkiej Atletyki Wrocław zostało utworzone',
    html: `
      <p>Witaj,</p>
      <p>Twoje konto zostało utworzone. Możesz się zalogować używając poniższych danych:</p>
      <p><strong>Email:</strong> ${to}<br />
      <strong>Hasło tymczasowe:</strong> ${temporaryPassword}</p>
      <p><a href="${loginUrl}">Zaloguj się</a></p>
      <p>Przy pierwszym logowaniu zostaniesz poproszony o zmianę hasła.</p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Missing RESEND_API_KEY');
  }

  const expiresInMinutes = Math.floor(RESET_PASSWORD_TOKEN_TTL_SECONDS / 60);

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    replyTo: REPLY_TO_EMAIL,
    subject: 'Reset your password',
    html: `
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in ${expiresInMinutes} minutes.</p>
    `,
  });
}

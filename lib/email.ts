import { Resend } from 'resend';
import { RESET_PASSWORD_TOKEN_TTL_SECONDS } from '@/lib/reset-password';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'no-reply@mail.alawroc.pl';
const REPLY_TO_EMAIL = process.env.EMAIL_REPLY_TO ?? 'akademia@alawroc.pl';

export type WelcomeRole = 'PARENT' | 'TRAINER';

const ROLE_COPY: Record<
  WelcomeRole,
  {
    subtitle: string;
    intro: string;
    featuresHeading: string;
    features: string[];
    closing: string;
  }
> = {
  PARENT: {
    subtitle: 'Panel rodzica',
    intro:
      'Administrator naszej akademii utworzył dla Ciebie konto rodzica. Dzięki panelowi możesz na bieżąco śledzić, jak Twoje dziecko rozwija się podczas treningów lekkoatletycznych.',
    featuresHeading: 'Co znajdziesz w panelu:',
    features: [
      'Wyniki testów sprawnościowych (sprint na 20 m, skok w dal, skok dosiężny i inne)',
      'Wykresy postępów w czasie — z każdym kolejnym pomiarem widać, jak zmieniają się wyniki',
      'Raporty fizjoterapeuty z obserwacjami, zaleceniami i porównaniem do poprzedniej wizyty',
      'Daty najnowszych pomiarów i ocen sprawności w jednym miejscu',
    ],
    closing:
      'Panel jest dostępny przez całą dobę — możesz zaglądać do niego, kiedy tylko chcesz sprawdzić postępy swojego dziecka.',
  },
  TRAINER: {
    subtitle: 'Panel trenera',
    intro:
      'Administrator naszej akademii utworzył dla Ciebie konto trenera. Panel pomoże Ci sprawnie prowadzić sesje testowe i rejestrować wyniki dzieci z Twoich grup.',
    featuresHeading: 'Co możesz zrobić w panelu:',
    features: [
      'Wybierać dzieci ze swoich grup treningowych do sesji testowej',
      'Wprowadzać wyniki pomiarów (sprint, skoki, gibkość i inne) w prostym formularzu',
      'Kontynuować przerwaną sesję — postęp zapisywany jest automatycznie',
      'Mieć pewność, że wprowadzone wyniki trafiają od razu do panelu rodzica',
    ],
    closing:
      'Po zalogowaniu zobaczysz tylko dzieci z grup, do których jesteś przypisany.',
  },
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmailShell(opts: { subtitle: string; preheader: string; bodyHtml: string }) {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>Akademia Lekkiej Atletyki Wrocław</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(opts.preheader)}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f5f7;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 6px rgba(15,23,42,0.04);">
          <tr>
            <td style="background-color:#0f172a;padding:28px 40px;">
              <div style="font-size:18px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;line-height:1.3;">Akademia Lekkiej Atletyki Wrocław</div>
              <div style="margin-top:4px;font-size:13px;color:#94a3b8;">${escapeHtml(opts.subtitle)}</div>
            </td>
          </tr>
          ${opts.bodyHtml}
          <tr>
            <td style="background-color:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                Wiadomość wygenerowana automatycznie. Jeśli nie spodziewałeś się tej wiadomości, możesz ją zignorować — nic nie zostanie aktywowane bez Twojego potwierdzenia.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendWelcomeEmail(to: string, setupUrl: string, role: WelcomeRole) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[dev] RESEND_API_KEY not set — skipping invite email to ${to}. Setup URL: ${setupUrl}`
    );
    return;
  }

  const copy = ROLE_COPY[role];
  const safeSetupUrl = escapeHtml(setupUrl);

  const featuresList = copy.features
    .map(
      (feature) =>
        `<li style="margin:0 0 8px;line-height:1.6;">${escapeHtml(feature)}</li>`
    )
    .join('');

  const bodyHtml = `
    <tr>
      <td style="padding:40px 40px 8px;">
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;letter-spacing:-0.01em;color:#0f172a;line-height:1.3;">
          Witamy w panelu Akademii
        </h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
          ${escapeHtml(copy.intro)}
        </p>

        <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#0f172a;font-weight:600;">
          ${escapeHtml(copy.featuresHeading)}
        </p>
        <ul style="margin:0 0 24px;padding:0 0 0 20px;font-size:14px;color:#334155;">
          ${featuresList}
        </ul>

        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
          Aby zakończyć aktywację, ustaw swoje hasło. Link poniżej jest jednorazowy i wygasa po 7 dniach.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
          <tr>
            <td style="background-color:#0f172a;border-radius:8px;">
              <a href="${safeSetupUrl}"
                 style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;line-height:1;">
                Ustaw hasło i aktywuj konto
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#64748b;">
          Jeśli przycisk nie działa, skopiuj poniższy adres do paska przeglądarki:<br />
          <a href="${safeSetupUrl}" style="color:#0ea5e9;word-break:break-all;">${safeSetupUrl}</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 32px;">
        <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
          ${escapeHtml(copy.closing)}
        </p>
      </td>
    </tr>
  `;

  const html = buildEmailShell({
    subtitle: copy.subtitle,
    preheader: 'Ustaw hasło, aby aktywować konto w Akademii Lekkiej Atletyki Wrocław.',
    bodyHtml,
  });

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    replyTo: REPLY_TO_EMAIL,
    subject: 'Aktywuj swoje konto w Akademii Lekkiej Atletyki Wrocław',
    html,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Missing RESEND_API_KEY');
  }

  const expiresInMinutes = Math.floor(RESET_PASSWORD_TOKEN_TTL_SECONDS / 60);
  const safeResetUrl = escapeHtml(resetUrl);

  const bodyHtml = `
    <tr>
      <td style="padding:40px;">
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;letter-spacing:-0.01em;color:#0f172a;line-height:1.3;">
          Reset hasła
        </h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
          Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta. Aby ustawić nowe hasło, kliknij w przycisk poniżej.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
          <tr>
            <td style="background-color:#0f172a;border-radius:8px;">
              <a href="${safeResetUrl}"
                 style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;line-height:1;">
                Ustaw nowe hasło
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#64748b;">
          Link jest jednorazowy i wygasa za ${expiresInMinutes} minut.
        </p>

        <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#64748b;">
          Jeśli przycisk nie działa, skopiuj poniższy adres do paska przeglądarki:<br />
          <a href="${safeResetUrl}" style="color:#0ea5e9;word-break:break-all;">${safeResetUrl}</a>
        </p>

        <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
          Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość — Twoje obecne hasło pozostaje aktywne.
        </p>
      </td>
    </tr>
  `;

  const html = buildEmailShell({
    subtitle: 'Reset hasła',
    preheader: 'Link do zresetowania hasła w panelu Akademii Lekkiej Atletyki Wrocław.',
    bodyHtml,
  });

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    replyTo: REPLY_TO_EMAIL,
    subject: 'Reset hasła — Akademia Lekkiej Atletyki Wrocław',
    html,
  });
}

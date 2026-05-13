import { Resend } from 'resend';
import { RESET_PASSWORD_TOKEN_TTL_SECONDS } from '@/lib/reset-password';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'no-reply@mail.alawroc.pl';
const REPLY_TO_EMAIL = process.env.EMAIL_REPLY_TO ?? 'akademia@alawroc.pl';

const BRAND_COLOR = '#E0584F';
const BRAND_COLOR_LIGHT = '#FFE4E0';

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
      'W naszej Akademii utworzyliśmy dla Ciebie konto rodzica. Tutaj zobaczysz, jak Twoje dziecko rozwija się na treningach.',
    featuresHeading: 'Co znajdziesz w panelu:',
    features: [
      'Wyniki testów sprawnościowych — sprintów, skoków i innych',
      'Wykresy postępów po każdym kolejnym pomiarze',
      'Raporty fizjoterapeuty z obserwacjami i zaleceniami',
      'Daty ostatnich pomiarów i ocen w jednym miejscu',
    ],
    closing: 'W razie pytań napisz do nas: akademia@alawroc.pl.',
  },
  TRAINER: {
    subtitle: 'Panel trenera',
    intro:
      'W naszej Akademii utworzyliśmy dla Ciebie konto trenera. Panel pomoże Ci szybko zapisywać wyniki dzieci z Twoich grup.',
    featuresHeading: 'Co możesz robić w panelu:',
    features: [
      'Wybierać dzieci ze swoich grup do sesji testowej',
      'Wprowadzać wyniki pomiarów w prostym formularzu',
      'Wracać do przerwanej sesji — postępy zapisują się automatycznie',
      'Mieć pewność, że wyniki od razu trafiają do panelu rodzica',
    ],
    closing: 'Po zalogowaniu zobaczysz tylko dzieci z grup, do których jesteś przypisany.',
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
            <td style="background-color:${BRAND_COLOR};padding:28px 40px;">
              <div style="font-size:18px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;line-height:1.3;">Akademia Lekkiej Atletyki Wrocław</div>
              <div style="margin-top:4px;font-size:13px;color:${BRAND_COLOR_LIGHT};">${escapeHtml(opts.subtitle)}</div>
            </td>
          </tr>
          ${opts.bodyHtml}
          <tr>
            <td style="background-color:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                Wiadomość wygenerowana automatycznie. Jeśli to nie Ty, zignoruj tę wiadomość — nic nie zostanie aktywowane bez kliknięcia w link.
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
    .map((feature) => `<li style="margin:0 0 8px;line-height:1.6;">${escapeHtml(feature)}</li>`)
    .join('');

  const bodyHtml = `
    <tr>
      <td style="padding:40px 40px 8px;">
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;letter-spacing:-0.01em;color:#0f172a;line-height:1.3;">
          Cześć!
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
          Aby aktywować konto, ustaw własne hasło. Link wygasa po 7 dniach i można go użyć tylko raz.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
          <tr>
            <td style="background-color:${BRAND_COLOR};border-radius:8px;">
              <a href="${safeSetupUrl}"
                 style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;line-height:1;">
                Ustaw hasło
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#64748b;">
          Jeśli przycisk nie działa, skopiuj ten adres do paska przeglądarki:<br />
          <a href="${safeSetupUrl}" style="color:${BRAND_COLOR};word-break:break-all;">${safeSetupUrl}</a>
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
    subject: 'Aktywuj swoje konto — Akademia Lekkiej Atletyki Wrocław',
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
          Otrzymaliśmy prośbę o reset hasła do Twojego konta. Aby ustawić nowe, kliknij w przycisk poniżej.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
          <tr>
            <td style="background-color:${BRAND_COLOR};border-radius:8px;">
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
          Jeśli przycisk nie działa, skopiuj ten adres do paska przeglądarki:<br />
          <a href="${safeResetUrl}" style="color:${BRAND_COLOR};word-break:break-all;">${safeResetUrl}</a>
        </p>

        <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
          Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość — Twoje obecne hasło pozostaje aktywne.
        </p>
      </td>
    </tr>
  `;

  const html = buildEmailShell({
    subtitle: 'Reset hasła',
    preheader: 'Link do zresetowania hasła w Akademii Lekkiej Atletyki Wrocław.',
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

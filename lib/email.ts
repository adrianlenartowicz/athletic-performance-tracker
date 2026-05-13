import { Resend } from 'resend';
import { RESET_PASSWORD_TOKEN_TTL_SECONDS } from '@/lib/reset-password';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'no-reply@mail.alawroc.pl';
const REPLY_TO_EMAIL = process.env.EMAIL_REPLY_TO ?? 'akademia@alawroc.pl';

const BRAND_COLOR = '#E0584F';

export type WelcomeRole = 'PARENT' | 'TRAINER';

const ROLE_COPY: Record<
  WelcomeRole,
  {
    intro: string;
    featuresHeading: string;
    features: string[];
    closing: string;
  }
> = {
  PARENT: {
    intro:
      'Utworzyliśmy dla Ciebie konto rodzica. Tutaj zobaczysz, jak Twoje dziecko rozwija się na treningach.',
    featuresHeading: 'Co znajdziesz w panelu:',
    features: [
      'Wyniki testów sprawnościowych z każdego pomiaru',
      'Postępy dziecka przedstawione na czytelnych wykresach',
      'Raporty fizjoterapeuty z obserwacjami i zaleceniami',
    ],
    closing: 'W razie pytań napisz do nas: akademia@alawroc.pl.',
  },
  TRAINER: {
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

function buildEmailShell(opts: { preheader: string; bodyHtml: string }) {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>Akademia Lekkiej Atletyki Wrocław</title>
</head>
<body style="margin:0;padding:0;background-color:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(opts.preheader)}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fafafa;padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background-color:#ffffff;border-radius:12px;border:1px solid #eaecef;">
          <tr>
            <td style="padding:40px 48px 0;">
              <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#9aa3af;">
                Akademia Lekkiej Atletyki Wrocław
              </div>
              <div style="margin-top:10px;height:2px;width:32px;background-color:${BRAND_COLOR};font-size:0;line-height:0;">&nbsp;</div>
            </td>
          </tr>
          ${opts.bodyHtml}
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;">
          <tr>
            <td style="padding:24px 16px 0;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#9aa3af;">
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
    .map((feature) => `<li style="margin:0 0 8px;line-height:1.7;">${escapeHtml(feature)}</li>`)
    .join('');

  const bodyHtml = `
    <tr>
      <td style="padding:28px 48px 40px;">
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#334155;">
          ${escapeHtml(copy.intro)}
        </p>

        <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#0f172a;">
          ${escapeHtml(copy.featuresHeading)}
        </p>
        <ul style="margin:0 0 28px;padding:0 0 0 20px;font-size:15px;color:#475569;">
          ${featuresList}
        </ul>

        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155;">
          Aby aktywować konto, ustaw własne hasło. Link wygasa po 7 dniach i można go użyć tylko raz.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
          <tr>
            <td style="background-color:${BRAND_COLOR};border-radius:8px;">
              <a href="${safeSetupUrl}"
                 style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;line-height:1;">
                Ustaw hasło
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#94a3b8;">
          Jeśli przycisk nie działa, skopiuj ten adres do paska przeglądarki:<br />
          <a href="${safeSetupUrl}" style="color:${BRAND_COLOR};word-break:break-all;">${safeSetupUrl}</a>
        </p>

        <div style="border-top:1px solid #eaecef;margin:0 0 20px;font-size:0;line-height:0;">&nbsp;</div>

        <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
          ${escapeHtml(copy.closing)}
        </p>
      </td>
    </tr>
  `;

  const html = buildEmailShell({
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
      <td style="padding:28px 48px 40px;">
        <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;letter-spacing:-0.01em;color:#0f172a;line-height:1.3;">
          Reset hasła
        </h1>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#334155;">
          Otrzymaliśmy prośbę o reset hasła do Twojego konta. Aby ustawić nowe, kliknij w przycisk poniżej.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
          <tr>
            <td style="background-color:${BRAND_COLOR};border-radius:8px;">
              <a href="${safeResetUrl}"
                 style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;line-height:1;">
                Ustaw nowe hasło
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#94a3b8;">
          Link jest jednorazowy i wygasa za ${expiresInMinutes} minut.
        </p>

        <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#94a3b8;">
          Jeśli przycisk nie działa, skopiuj ten adres do paska przeglądarki:<br />
          <a href="${safeResetUrl}" style="color:${BRAND_COLOR};word-break:break-all;">${safeResetUrl}</a>
        </p>

        <div style="border-top:1px solid #eaecef;margin:0 0 20px;font-size:0;line-height:0;">&nbsp;</div>

        <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
          Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość — Twoje obecne hasło pozostaje aktywne.
        </p>
      </td>
    </tr>
  `;

  const html = buildEmailShell({
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

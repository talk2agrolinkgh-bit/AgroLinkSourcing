// src/lib/mail.ts
// Sends the NextAuth magic-link email over an HTTP API — never SMTP.
//
// Why not SMTP: serverless platforms (Vercel included) block or silently drop
// outbound SMTP (ports 587/465), which made sign-in hang on "Sending link…"
// forever. HTTP APIs travel over HTTPS (443) and always work.
//
// Providers (first one configured wins):
//   1. Resend  — RESEND_API_KEY + EMAIL_FROM on your verified domain,
//                e.g. "AgroLink <hello@agrolinksourcing.com>" via EMAIL_FROM
//                + EMAIL_FROM_NAME. Recommended now that the domain is live.
//   2. Brevo   — BREVO_API_KEY + EMAIL_FROM (a verified sender). Fallback.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const FROM_NAME = process.env.EMAIL_FROM_NAME || "AgroLink";
const SUBJECT = "Your AgroLink sign-in link";

export async function sendMagicLinkEmail(to: string, url: string) {
  const provider = RESEND_API_KEY ? "resend" : BREVO_API_KEY ? "brevo" : null;

  if (!provider || !EMAIL_FROM) {
    console.error(
      "[mail] No email provider configured (RESEND_API_KEY or BREVO_API_KEY, plus EMAIL_FROM) — magic-link email was NOT sent.\n" +
        `[mail] Sign-in link for ${to}: ${url}`
    );
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured (set RESEND_API_KEY and EMAIL_FROM).");
    }
    return; // in dev the link is printed above so the flow can still be tested
  }

  const html = magicLinkTemplate(url);
  const label = provider === "resend" ? "Resend" : "Brevo";

  let res: Response;
  try {
    res =
      provider === "resend"
        ? await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from: `${FROM_NAME} <${EMAIL_FROM}>`, to: [to], subject: SUBJECT, html }),
            signal: AbortSignal.timeout(10_000),
          })
        : await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: { "api-key": BREVO_API_KEY as string, "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              sender: { name: FROM_NAME, email: EMAIL_FROM },
              to: [{ email: to }],
              subject: SUBJECT,
              htmlContent: html,
            }),
            // Hard timeout so a network hiccup fails visibly instead of hanging.
            signal: AbortSignal.timeout(10_000),
          });
  } catch (err: any) {
    console.error(`[mail] Network error reaching ${label} for ${to}:`, err?.message || err);
    throw new Error(`Could not reach ${label}: ${err?.message || "network error"}`);
  }

  if (!res.ok) {
    const body = await res.text();
    // Most common cause: EMAIL_FROM isn't on a verified domain/sender.
    console.error(`[mail] ${label} rejected the send to ${to}: ${res.status} ${body}`);
    throw new Error(`${label} failed to send magic-link email: ${res.status} ${body}`);
  }
}

function magicLinkTemplate(url: string) {
  return `
  <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #16241A;">
    <p style="font-family: monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #A66E1C; margin-bottom: 8px;">AgroLink</p>
    <h1 style="font-size: 22px; margin: 0 0 16px;">Sign in to AgroLink</h1>
    <p style="font-size: 14px; line-height: 1.6; color: #41503F;">
      Click the button below to sign in. This link expires in 15 minutes and can only be used once.
    </p>
    <a href="${url}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #1F4E2B; color: #F3ECDC; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 14px;">
      Sign in to AgroLink
    </a>
    <p style="font-size: 12px; color: #41503F; margin-top: 24px;">
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>`;
}

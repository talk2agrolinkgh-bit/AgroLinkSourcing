// src/lib/mail.ts
// Sends the NextAuth magic-link email via Brevo's HTTP API — not SMTP.
//
// Why the switch from Gmail SMTP: serverless platforms (Vercel included)
// frequently block or silently drop outbound SMTP connections (ports
// 587/465) for anti-spam reasons. That produces exactly the symptom this
// replaced — the sign-in button hangs on "Sending link…" forever, with no
// error, because the TCP connection to Gmail's mail server never completes
// or fails. It works locally because your own network has no such
// restriction. An HTTP API call travels over ordinary HTTPS (port 443),
// which is never blocked anywhere, so this class of bug can't recur.
//
// Why Brevo specifically (not Resend/SendGrid): Brevo verifies a single
// email address you already own via a one-click confirmation link — not a
// domain. That's the actual constraint here (no domain purchased yet).
//
// Setup (no domain required):
//   1. Sign up free at brevo.com
//   2. Settings (gear icon) -> Senders, Domains & Dedicated IPs -> Senders
//      -> Add a Sender -> enter the email you want to send from -> Brevo
//      emails that address a confirmation link -> click it
//   3. Settings -> SMTP & API -> API Keys -> Generate a new API key
//   4. Set BREVO_API_KEY and EMAIL_FROM (the address you just verified) below

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const FROM_NAME = process.env.EMAIL_FROM_NAME || "AgroLink";

export async function sendMagicLinkEmail(to: string, url: string) {
  if (!BREVO_API_KEY || !EMAIL_FROM) {
    // Fail loudly in development so it's obvious email isn't configured yet,
    // rather than pretending a link was sent.
    console.error(
      "[mail] BREVO_API_KEY / EMAIL_FROM is not set — magic-link email was NOT sent.\n" +
        `[mail] Sign-in link for ${to}: ${url}`
    );
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured (BREVO_API_KEY / EMAIL_FROM missing).");
    }
    return; // in dev, the link is printed to the console so you can still test the flow
  }

  let res: Response;
  try {
    res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: EMAIL_FROM },
        to: [{ email: to }],
        subject: "Your AgroLink sign-in link",
        htmlContent: magicLinkTemplate(url),
      }),
      // A hard timeout so a network hiccup fails fast and visibly (a real
      // error the sign-in page can show) instead of ever hanging silently
      // again — the exact failure mode this file was rewritten to eliminate.
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err: any) {
    console.error(`[mail] Network error reaching Brevo for ${to}:`, err?.message || err);
    throw new Error(`Could not reach Brevo: ${err?.message || "network error"}`);
  }

  if (!res.ok) {
    const body = await res.text();
    // Always log the real reason server-side (Vercel -> your project ->
    // Logs). The most common cause here is EMAIL_FROM not matching a
    // verified sender in your Brevo account.
    console.error(`[mail] Brevo rejected the send to ${to}: ${res.status} ${body}`);
    throw new Error(`Brevo failed to send magic-link email: ${res.status} ${body}`);
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

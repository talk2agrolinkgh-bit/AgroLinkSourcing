// src/lib/whatsapp.ts
// Centralised WhatsApp deep-link builder.
// Replace WHATSAPP_NUMBER with the live business number (E.164, no "+", no spaces).

// Digits only (E.164 without "+"). Defaults to the live AgroLink number; the
// NEXT_PUBLIC_WHATSAPP_NUMBER env var overrides it if the number ever changes.
const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "233544200542").replace(/\D/g, "");

export const WHATSAPP_CONFIGURED = WHATSAPP_NUMBER.length >= 8;

export function waLink(message: string, number: string = WHATSAPP_NUMBER) {
  const encoded = encodeURIComponent(message);
  // With no number configured, wa.me/?text= still opens WhatsApp with the message ready to send.
  return `https://wa.me/${number}?text=${encoded}`;
}

export const waMessages = {
  productInquiry: (productName: string, origin: string) =>
    `Hello AgroLink, I am interested in sourcing ${productName} from ${origin}.`,
  farmInquiry: (projectName: string) =>
    `Hello AgroLink, I would like to ask about the ${projectName} project.`,
  academyEnroll: (tier: "Mentorship + Training" | "Video Training Only") =>
    `Hello AgroLink, I want to join the Produce-Sourcing Academy (${tier}).`,
  generalContact: () => `Hello AgroLink, I'd like to talk to your team.`,
};

// Human-readable form of the live number, e.g. "+233 20 123 4567". Null when not configured.
export const WHATSAPP_NUMBER_DISPLAY: string | null = WHATSAPP_CONFIGURED
  ? "+" +
    (WHATSAPP_NUMBER.startsWith("233") && WHATSAPP_NUMBER.length === 12
      ? `${WHATSAPP_NUMBER.slice(0, 3)} ${WHATSAPP_NUMBER.slice(3, 5)} ${WHATSAPP_NUMBER.slice(5, 8)} ${WHATSAPP_NUMBER.slice(8)}`
      : WHATSAPP_NUMBER)
  : null;

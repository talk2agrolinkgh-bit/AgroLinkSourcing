// src/lib/scrub.ts
// Defence in depth for the Sourcing Desk: even after an admin approves a
// request, free-text fields could still contain a phone number, email or link
// (a common way to bypass the platform). Anything that looks like contact
// information is masked before it is shown to agents.

const PATTERNS: RegExp[] = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,        // emails
  /(?:https?:\/\/|www\.)\S+/gi,                       // links
  /\b(?:wa\.me|t\.me|bit\.ly)\/\S+/gi,                 // chat/short links
  /\+?\d[\d\s().-]{6,}\d/g,                            // phone-like numbers (8+ digits with separators)
];

export function scrubContacts(text: string | null | undefined): string | null {
  if (!text) return null;
  let out = text;
  for (const p of PATTERNS) out = out.replace(p, "[contact hidden]");
  return out;
}

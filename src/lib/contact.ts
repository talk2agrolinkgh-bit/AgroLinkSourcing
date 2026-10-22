// src/lib/contact.ts
// Single source of truth for public contact details. All values come from
// env vars so going live never requires editing code.

export const SITE_DOMAIN = "agrolinksourcing.com";
export const SITE_URL_DEFAULT = `https://${SITE_DOMAIN}`;

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || `hello@${SITE_DOMAIN}`;
export const CONTACT_LOCATION = process.env.NEXT_PUBLIC_CONTACT_LOCATION || "Accra, Ghana";

// Shown beneath the footer. Set NEXT_PUBLIC_SHOW_DEMO_NOTICE="false" once real
// products/farm projects replace the seeded demo data.
export const SHOW_DEMO_NOTICE = process.env.NEXT_PUBLIC_SHOW_DEMO_NOTICE !== "false";

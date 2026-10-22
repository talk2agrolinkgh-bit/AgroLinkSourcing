// src/app/robots.ts
// Auto-served at /robots.txt.

import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://agrolinksourcing.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/account", "/login"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

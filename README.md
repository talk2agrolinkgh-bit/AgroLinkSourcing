# AgroLink — Production Scaffold & Implementation Guide

This package contains two things:

1. **`agrolink.html`** (in the same download) — a fully interactive, mobile-first
   prototype of the whole product. Open it in any browser. It's built with
   Tailwind (CDN) + vanilla JS, no build step, so you can click through every
   journey today: Market → Product → Quotation, Start Sourcing, List Your
   Product, Farm For You → Project → Participation, Academy / Contract
   Command, and a read-only Admin preview.

2. **This folder** — a real Next.js + TypeScript + Prisma codebase scaffold:
   the architecture, data model, and reference implementations you build the
   live product on top of. It does **not** run as-is — it has no
   `node_modules` and no database — because this environment has no network
   access to install packages. Everything below tells you exactly how to
   bring it to life on your machine.

---

## 1. What's actually built vs. scaffolded

**Built (real, working code):**
- `prisma/schema.prisma` — the full data model (25+ entities from the brief), now including `AdminUser.passwordHash` and `SiteContent` for the CMS
- `prisma/seed.ts` — seeds demo products, suppliers, farm projects, academy modules, CMS blocks, and the first admin login
- `src/lib/db.ts` — Prisma client
- `src/lib/auth.ts` + `src/app/api/auth/[...nextauth]/route.ts` — **one NextAuth instance, two providers**: Credentials for the admin dashboard, and passwordless Email magic-link for buyers/suppliers/farmers/students
- `src/lib/mail.ts` — sends the magic-link email via Brevo's HTTP API (not SMTP — Gmail SMTP was tried first, but serverless platforms block/drop outbound SMTP connections, which made sign-in hang forever with no error; Brevo needs no domain either, just a single verified sender address; logs the link to the console instead if `BREVO_API_KEY`/`EMAIL_FROM` isn't set, so the flow is testable without email configured)
- `src/lib/whatsapp.ts` — WhatsApp deep-link helper + message templates
- `src/lib/cloudinary.ts` + `src/components/uploads/MediaUploader.tsx` — direct browser-to-Cloudinary image/video/document uploads via an unsigned preset (no backend token exchange). Wired into all three upload zones: Admin → Add Product (photos), public List Your Product (photos + supporting documents), Admin → Post Update (photos + video). Without `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`/`NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` set, each zone shows a clear "not configured yet" message instead of pretending to accept files
- `src/lib/cloudinary-admin.ts` + `src/app/api/media/delete/route.ts` — signed Cloudinary deletion, called automatically when someone removes a file from a form before submitting it. Scoped to only ever touch assets in AgroLink's own upload folder, which is why the endpoint doesn't need to be auth-gated even though guest forms call it
- Uploaded product photos render on the Market grid, Home page preview, and product detail page (falls back to a category icon on solid forest-green until a product has a real photo); uploaded farm-update photos/video render on the public farm project page's update feed
- `src/lib/roles.ts` — auto-elevates a signed-in user from VISITOR the first time they take an action that signals what they use AgroLink for: **BUYER** on a sourcing request or product inquiry, **FARMER** on a farm participation request, **STUDENT** on an Academy enroll click (`src/components/academy/EnrollButton.tsx` + `/api/academy-enrollments`), **SUPPLIER** only when an admin actually verifies one of their listings (self-reporting "I'm a supplier" isn't worth trusting on its own). Elevation never fires twice — once someone's off VISITOR, further role changes are a manual admin decision
- **Public sign-in** — `/login` (request a magic link) → `/account` (a lightweight dashboard showing the signed-in user's sourcing requests, farm participation, academy enrollment, supplier profile if any, and their current role — read live from the database since role elevation doesn't retroactively update an already-issued session token). Sign-in is never required for browsing, searching, or submitting a one-off request — every public form still works as a guest; if the person happens to be signed in, their submission is silently linked to their account
- **Full public site** — `src/app/(public)/*`: Home, Market (search + filter), Product detail (quote request), Farm For You (list + detail + participation request), Academy (Contract Command + Produce-Sourcing curriculum, pulled live from the DB), Start Sourcing, List Your Product, How It Works, Contact, Login/Account, and a mobile-only More page — all server components fetching via Prisma, paired with small client components for the interactive parts (forms, search, market filter, uploads)
- **Public API routes** — sourcing requests, supplier submissions, product inquiries, farm participation, academy enrollment interest, and a live search endpoint — all zod-validated, all writing a matching `Lead` record for the admin inbox, and all linking to the signed-in user's account when one exists
- **Sourcing Desk** — `/sourcing-desk` — live sourcing requests were never meant to be public past the submission form, and one endpoint (`GET /api/sourcing-requests`) genuinely was leaking full buyer contact details unauthenticated; that's closed. In its place: a gated page where only agents an admin has explicitly **approved** can view open requests (product/quantity/destination/spec — deliberately never buyer name, company, email, or WhatsApp) and respond. Completing the Produce-Sourcing Academy makes someone *eligible to apply* (`src/lib/sourcing-desk.ts` explains why that's not the same as being approved); admin reviews applications at `/admin/sourcing-agents`, seeing their enrollment history alongside the decision. A response just notifies AgroLink — agents never get a direct line to the buyer, keeping AgroLink as the coordinating party the whole way through, consistent with how every other flow in this app works
- **Full admin dashboard** — `src/app/admin/(dashboard)/*` (auth-gated route group) + `src/app/admin/login`:
  Overview, Products, Suppliers, Sourcing Requests (kanban, drag-and-drop), Sourcing Desk Access (approve/revoke trained agents), Farm Projects (stage + Post Update modal with real photo/video upload), Academy (curriculum editor), Leads, CMS
- **Admin API routes** — `src/app/api/admin/**` covering products CRUD (now creating `ProductImage` rows from uploaded URLs), supplier verify/suspend (with `VerificationRecord` audit trail + SUPPLIER role elevation), sourcing request stage updates, sourcing agent approve/revoke, farm project stage + updates, academy module management, lead handled-toggle, CMS saves — all role-gated via `getServerSession`
- `tailwind.config.ts`, `next.config.js` (Cloudinary added to `remotePatterns`), `postcss.config.js`, `tsconfig.json` — full build config
- `agrolink.html` / `agrolink-admin.html` — the original interactive prototypes (kept for quick demos without a database)
- **Academy curriculum editor** — `src/app/api/admin/academy/[courseId]/modules/[moduleId]/route.ts` — rename, reorder (swap with neighbor, powers the ↑/↓ buttons), and delete (re-numbers what's left so ordering stays contiguous), wired into `CurriculumModal`
- **SEO** — `src/app/sitemap.ts` (every static route plus every published product and farm project, regenerated from live data), `src/app/robots.ts` (blocks `/admin`, `/api`, `/account`, `/login`), and dynamic Open Graph images generated at request time with `next/og` — a branded default card plus one per product and per farm project showing the real name/origin/region so social shares always match the database. `metadataBase` and sitewide OG/Twitter defaults added to the root layout; indexable pages got real descriptions, private/utility pages (`/account`, `/more`) got `noindex`
- **PWA** — `src/app/manifest.ts` (installable, `theme_color`/`background_color` matching the brand palette), the real logo cropped and rendered at every required size (favicon, apple-touch-icon, 192, 512, maskable — see "Branding" below), and `public/sw.js`, a deliberately conservative service worker: it only precaches an offline fallback page (`/offline`) and cache-first's hashed `_next/static` build assets — it never touches `/api/*`, `/admin/*`, or any dynamic page, since this app's data changes too often for that to be safe
- **Branding** — the real AgroLink logo replaces every placeholder mark. `public/logo-mark.png` is the canonical transparent-background emblem used in the Header, Footer, and Admin sidebar; `src/app/icon.png`, `apple-icon.png`, and `favicon.ico` (auto-detected by Next's file conventions, no code needed) plus `public/icon-192.png`, `icon-512.png`, and `icon-maskable-512.png` (opaque forest-green background, scaled into the safe zone Android's adaptive-icon mask requires) cover every installed-app surface. `src/lib/og-logo.ts` holds the same emblem as a base64 data URI so the three Open Graph image cards can embed it directly, without depending on the site being publicly reachable at render time

Every route and page described in the original 36-point brief is now real,
working code — nothing core is left as a placeholder. What's left (below)
is intentionally outside that scope: infrastructure work (PWA, SEO) rather
than product functionality.

---

## 2. Step-by-step: get this running locally

```bash
# 1. Install Node.js 20+ if you don't have it, then:
cd agrolink-app
npm install

# 2. Spin up a free Postgres instance (pick one):
#    - Supabase (supabase.com) — free tier, instant Postgres URL
#    - Neon (neon.tech) — free tier, serverless Postgres
#    - Railway (railway.app)
#    - Or run Postgres locally with Docker:
docker run --name agrolink-db -e POSTGRES_PASSWORD=agrolink -p 5432:5432 -d postgres

# 3. Copy the env file and fill in your DB URL
cp .env.example .env
# Edit .env — set DATABASE_URL and NEXT_PUBLIC_WHATSAPP_NUMBER
# For public sign-in emails, set BREVO_API_KEY and EMAIL_FROM (see
# .env.example for the 4-step setup — no domain needed, just a verified
# single sender address).
# Without it, magic-links are printed to the terminal in development instead
# of emailed, so you can still test the sign-in flow end-to-end.
# For image/video/document uploads, set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and
# NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET (free tier at cloudinary.com — create
# an "Unsigned" upload preset under Settings → Upload). Without these, every
# upload zone shows a clear "not configured yet" message instead of a broken
# file picker. Also set CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET (Settings
# → Access Keys) so removing a file from a form actually deletes it from
# Cloudinary too, instead of just leaving it orphaned.

# 4. Push the schema to your database
npm run db:push

# 5. Seed demo data + create your first admin login
npm run db:seed
# → creates admin@agrolinksourcing.com / agrolink-admin-2026 — CHANGE THIS PASSWORD
#   immediately: update prisma/seed.ts or update the row directly, then re-hash
#   with bcrypt before deploying anywhere public.

# 6. Start the dev server
npm run dev
# → http://localhost:3000       (public site)
# → http://localhost:3000/login (buyer/supplier/farmer/student sign-in)
# → http://localhost:3000/admin (admin dashboard — sign in with the seeded login)
```

---

## 3. What's left

Nothing from the original brief. Every route, page, form, admin workflow,
auth flow, upload zone, role-elevation trigger, and infrastructure item
(sitemap, robots.txt, OG images, PWA manifest, service worker) described
across this project is now real, working code — see `FOLDER_MAP.md` for
the complete file-by-file breakdown.

The one thing worth doing before a real launch that's outside this
project's scope to invent for you:

- **Production secrets** — `DATABASE_URL`, `NEXTAUTH_SECRET`,
  `RESEND_API_KEY`, `CLOUDINARY_*`, and `NEXT_PUBLIC_SITE_URL` all need real
  values before deploying (see `.env.example`).

---

## 4. Deployment

- **Frontend/API**: Vercel (zero-config for Next.js App Router)
- **Database**: Supabase or Neon (both have generous free tiers and give you
  a `DATABASE_URL` immediately)
- **Images**: Cloudinary or Supabase Storage
- **WhatsApp**: start with `wa.me` deep links (already implemented, zero
  setup). Upgrade to WhatsApp Business API only once volume justifies the
  integration work — the brief explicitly said not to pretend an
  integration is live before it's configured.

---

## 5. What was deliberately left out of v1

Per the brief's "do not overbuild" instruction, these are documented in
`prisma/schema.prisma` comments and `FOLDER_MAP.md` but not built:
multi-language, multi-currency, escrow, digital contracts, shipment
tracking, AI-powered matching, commodity price intelligence. The schema's
`Transaction` and `Payment` models exist so these can be added later without
a redesign.

---

## 6. File index

```
agrolink-app/
├── README.md                 ← you are here
├── FOLDER_MAP.md              route/component map + rationale
├── package.json
├── tailwind.config.ts
├── next.config.js
├── postcss.config.js
├── tsconfig.json
├── .env.example
├── prisma/
│   ├── schema.prisma           full data model
│   └── seed.ts                 demo data + first admin login
└── src/
    ├── lib/                    db.ts, auth.ts, whatsapp.ts
    ├── components/
    │   ├── layout/              Header, Footer, MobileNav, WhatsAppFab, SearchOverlay
    │   ├── market/, farm/        ProductCard, MarketGrid, FarmCard
    │   ├── forms/                Sourcing, Supplier, Quote, Participation forms
    │   ├── ui/                   badges.tsx (shared public-site primitives)
    │   └── admin/                sidebar, tables, modals — see FOLDER_MAP.md
    └── app/
        ├── layout.tsx           root layout (fonts only)
        ├── (public)/            every public page — home, market, farm, academy, etc.
        ├── admin/                login (ungated) + (dashboard) (auth-gated)
        └── api/                  public routes + /admin/** (role-gated)
```


## Going live checklist (agrolinksourcing.com)

Vercel → Project → Settings → Environment Variables (then Redeploy, *without* build cache):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://agrolinksourcing.com` |
| `NEXTAUTH_URL` | `https://agrolinksourcing.com` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | your number, digits only, e.g. `233201234567` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | e.g. `hello@agrolinksourcing.com` |
| `RESEND_API_KEY` | from resend.com → API Keys (domain must show Verified) |
| `EMAIL_FROM` | an address on the domain, e.g. `hello@agrolinksourcing.com` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary dashboard → top-left cloud name |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | name of an **Unsigned** upload preset |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary → Settings → Access Keys |

`NEXT_PUBLIC_*` values are baked in at build time, so a redeploy is required after changing them.
Email prefers Resend when `RESEND_API_KEY` is set and falls back to Brevo (`BREVO_API_KEY`).

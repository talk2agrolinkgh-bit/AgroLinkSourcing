# AgroLink — Route & Folder Map (Next.js App Router)

Everything below is BUILT unless marked [scaffold].

src/app/
  layout.tsx                      Root layout — fonts + metadata (incl. metadataBase, OG/Twitter defaults,
                                   viewport/themeColor, SW registration script) only, no chrome
  not-found.tsx                   Branded 404
  offline/page.tsx                Offline fallback — precached by public/sw.js, has no DB dependency
  globals.css                     Tailwind directives + a few shared keyframes/utilities
  sitemap.ts                      /sitemap.xml — static routes + every published product/farm project
  robots.ts                       /robots.txt — disallows /admin, /api, /account, /login
  manifest.ts                     /manifest.webmanifest — PWA install metadata
  icon.png / apple-icon.png /
  favicon.ico                     Real logo, static — auto-detected by Next's file conventions, no code needed
  opengraph-image.tsx             Default OG card (next/og, real logo embedded via src/lib/og-logo.ts)

  (public)/                       Route group — adds Header/Footer/MobileNav/WhatsApp FAB
    layout.tsx
    page.tsx                      Home
    market/page.tsx                Market listing (search + category filter)
    market/[slug]/page.tsx         Product detail + Request Quotation
    market/[slug]/opengraph-image.tsx  Per-product OG card (name + origin, from live data)
    farm/page.tsx                  Farm For You program + project list
    farm/[slug]/page.tsx           Farm project detail + Request Participation
    farm/[slug]/opengraph-image.tsx    Per-project OG card (name + region/crop, from live data)
    academy/page.tsx               Contract Command + Produce-Sourcing Academy (curriculum from DB)
    sourcing/page.tsx              Start Sourcing form
    sourcing-desk/page.tsx         Gated: open sourcing requests for APPROVED agents only —
                                    handles SIGNED_OUT/NONE/PENDING/REVOKED/APPROVED as distinct states
    list-product/page.tsx          List Your Product form
    how-it-works/page.tsx
    contact/page.tsx
    login/page.tsx                 Request a magic-link sign-in email
    login/check-email/page.tsx     NextAuth's configured verifyRequest fallback
    account/page.tsx                Signed-in buyer/supplier dashboard — their sourcing
                                    requests, farm participation, enrollments, supplier profile,
                                    and Sourcing Desk status if they've applied
    more/page.tsx                  Mobile-only catch-all for secondary links + account/sign-in

  admin/
    login/page.tsx                 Credentials sign-in (outside the auth gate)
    (dashboard)/                   Route group — layout.tsx gates every page below
      layout.tsx                   Redirects to /admin/login if not an authenticated ADMIN
      page.tsx                     Overview
      products/page.tsx            Table + status/publish/feature toggles + Add Product modal
      suppliers/page.tsx           Table + verify/suspend (writes VerificationRecord)
      sourcing-requests/page.tsx   Kanban, drag-and-drop across all 7 stages
      sourcing-agents/page.tsx     Review Sourcing Desk applications — approve/revoke, shown
                                    alongside each applicant's enrollment history for context
      farm-projects/page.tsx       Stage control + Post Update modal
      academy/page.tsx             Course cards + curriculum editor modal + enrollments table
      leads/page.tsx               Unified inbox, mark handled/unhandled
      cms/page.tsx                 Editable homepage text blocks

  api/
    sourcing-requests/route.ts        public POST (elevates to BUYER) / GET (admin-only — was
                                       unauthenticated, this was the actual leak that prompted
                                       the Sourcing Desk feature; fixed)
    sourcing-desk/apply/route.ts      public POST — NONE -> PENDING for the signed-in user
    sourcing-desk/[id]/respond/route.ts  public POST — 403s unless sourcingAgentStatus is
                                       APPROVED; creates a Message, bumps NEW -> SOURCING
    supplier-submissions/route.ts     public POST
    product-inquiries/route.ts        public POST — "Request Quotation" on product pages, elevates to BUYER
    farm-participation/route.ts       public POST — "Request Participation" on farm pages, elevates to FARMER
    academy-enrollments/route.ts      public POST — fired by the Enroll button, elevates to STUDENT
    search/route.ts                   public GET — powers the header search overlay
    media/delete/route.ts             public POST — signed Cloudinary cleanup, called by MediaUploader on remove
    auth/[...nextauth]/route.ts       NextAuth handler — Credentials (admin) + Email magic-link (public)
    admin/
      products/route.ts                 GET list, POST create (creates ProductImage rows from imageUrls)
      products/[id]/route.ts            PATCH (status/published/featured/fields), DELETE
      suppliers/route.ts                GET list
      suppliers/[id]/route.ts           PATCH status + writes VerificationRecord + elevates to SUPPLIER on VERIFIED
      sourcing-requests/[id]/route.ts   PATCH status (kanban moves)
      sourcing-agents/[id]/route.ts     PATCH status — approve/revoke Sourcing Desk access
      farm-projects/route.ts            GET list, POST create
      farm-projects/[id]/route.ts       PATCH stage/published/paymentModel
      farm-projects/[id]/updates/route.ts  POST — the "Post Update" action (photoUrls/videoUrls)
      academy/[courseId]/modules/route.ts  GET, POST add module
      academy/[courseId]/modules/[moduleId]/route.ts  PATCH (rename/reorder), DELETE (re-numbers remaining)
      leads/route.ts                    GET list
      leads/[id]/route.ts               PATCH handled
      cms/route.ts                      GET list
      cms/[id]/route.ts                 PATCH value

src/components/
  layout/       Header (+ search, + session-aware sign-in/account link), Footer, MobileNav, WhatsAppFab, SearchOverlay
  market/       ProductCard (renders uploaded photo, falls back to category icon), MarketGrid (client filter/search)
  farm/         FarmCard
  forms/        FormField helpers, SourcingRequestForm, SupplierSubmissionForm,
                QuoteRequestForm, ParticipationRequestForm — each posts to its API
                route and swaps to the same success copy used in the HTML prototype
  academy/      EnrollButton (client) — records interest via /api/academy-enrollments,
                then opens WhatsApp
  sourcing-desk/  ApplyButton, RespondForm (client) — the two writes an approved agent
                can make; access itself is checked server-side in the page and again in
                the API route, never trusted from the client alone
  account/      SignOutButton (client) — used on /account
  uploads/      MediaUploader (client) — direct-to-Cloudinary image/video/document
                upload with inline previews, progress, and automatic cleanup-on-remove;
                used by AddProductModal, SupplierSubmissionForm, and PostUpdateModal
  ui/           badges.tsx — VerificationBadge, StagePill, DemoDataBadge, SectionHead
                (shared across every public page)
  admin/        AdminSidebar, AdminMobileNav, Toaster, ui.tsx, ProductsTable,
                SuppliersTable, SourcingRequestsBoard, SourcingAgentsTable, FarmProjectCard,
                LeadsTable, CmsEditor, AddProductModal, AddFarmProjectModal, PostUpdateModal,
                CurriculumModal

src/lib/
  db.ts            Prisma client singleton
  whatsapp.ts      wa.me link builder + message templates + display number
  cloudinary.ts       Unsigned direct-to-Cloudinary upload helper (image/video/document)
  cloudinary-admin.ts Server-only signed deletion — parses public_id/resource_type
                       back out of a secure_url, scoped to the "agrolink/" folder
  roles.ts         elevateRoleIfVisitor() — the one-way VISITOR → role promotion
                    used by all four elevation trigger points (see api/ list above)
  sourcing-desk.ts getSourcingDeskAccess() — the single source of truth for whether
                    a signed-in user can see open sourcing requests; returns a
                    discriminated union (SIGNED_OUT/NONE/PENDING/REVOKED/APPROVED)
                    so the page can't accidentally treat an unhandled case as allowed
  auth.ts          NextAuth config — one instance, two providers: Credentials
                   (admin, id "admin-credentials", bypasses the Prisma adapter)
                   and Email (public magic-link, via the Prisma adapter)
  mail.ts          Sends the magic-link email via Brevo's HTTP API (not SMTP —
                   Gmail SMTP hung forever on Vercel since serverless platforms
                   block outbound SMTP; Brevo needs only a verified single
                   sender, no domain); logs the link to the console instead
                   if BREVO_API_KEY/EMAIL_FROM isn't set
  og-logo.ts       The real emblem as a base64 data URI — embedded directly
                   into OG image cards so generation never depends on the
                   site being publicly reachable
  validation/      [scaffold] zod schemas shared between public forms and API routes
                   (forms currently validate server-side only, in the route handler)

public/
  logo-mark.png    Canonical transparent-background emblem — used by Header,
                   Footer, and AdminSidebar; also the source for icon-512.png
  icon-192.png / icon-512.png /
  icon-maskable-512.png            The three PWA manifest icon sizes (maskable
                                    has an opaque forest-green background,
                                    scaled into Android's safe zone)
  sw.js            Deliberately conservative service worker — offline fallback
                   + cache-first hashed build assets only, never touches
                   /api/*, /admin/*, or any dynamic page

prisma/
  schema.prisma    Full data model incl. AdminUser.passwordHash, SiteContent
  seed.ts          Seeds demo data + first admin login

Why this shape:
- `(public)` and `admin/(dashboard)` are both route groups so each can carry
  its own layout/chrome (site nav vs. dashboard sidebar) without leaking into
  the other, and so `/admin/login` can sit outside the auth gate on its own.
- Every page is a server component that fetches via Prisma directly — no
  client-side loading spinner on first paint anywhere in the app. Each page
  ships small, focused client components only for the interactive slice
  (a filter, a form, a modal, a kanban board).
- Every API route re-validates with zod (public routes) or re-checks
  `isAdminSession()` (admin routes) itself, even though the calling page
  already gates access — routes must never trust that only the intended
  page could have called them.
- `VerificationRecord` is written on every supplier status change from the
  API route itself, not the UI, so the audit trail can't be bypassed by a
  different client.
- Product/farm photography is intentionally not faked with stock images —
  cards use a category icon on a solid forest-green field until real photo
  upload (step 1 in README) is wired up.
- Role elevation only ever fires once per user (VISITOR → something else)
  and only SUPPLIER requires an admin action first — see src/lib/roles.ts
  for the full reasoning. This keeps the four trigger points (three public
  API routes + one admin route) simple one-line calls instead of a stateful
  role-transition system.
- The Cloudinary delete endpoint is intentionally not auth-gated, because
  guest forms need to be able to clean up their own removed-before-submit
  uploads too. Safety instead comes from scoping: it can only ever delete
  assets whose public_id starts with "agrolink/" — the one folder this app
  ever uploads to.
- The service worker never caches a dynamic page, `/api/*`, or `/admin/*` —
  only the static offline fallback and hashed `_next/static` build assets.
  This app's data (prices, verification status, sourcing-request stages)
  changes too often for a more aggressive caching strategy to be safe.
- Sourcing Desk access is a separate field (`User.sourcingAgentStatus`) from
  `role`, not a repurposed STUDENT role check — someone can complete the
  Academy and never apply, or apply and get rejected, and `role` alone can't
  represent "eligible but not yet approved." The agent-facing page never
  selects buyer name/company/email/whatsapp from the database at all (not
  just hidden in the UI) — there's no query result to accidentally leak.

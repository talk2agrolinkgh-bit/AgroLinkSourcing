// scripts/create-admin.ts
// Creates the admin login, or resets its password if the email already exists.
// Does NOT seed any demo data — safe to run against the live database.
//
// Usage (PowerShell, from the project folder):
//   $env:DATABASE_URL = 'postgresql://...'      # the LIVE database URL
//   $env:ADMIN_EMAIL = 'you@yourdomain.com'
//   $env:ADMIN_PASSWORD = 'a-long-password-12+chars'
//   npm run admin:create
//   Remove-Item Env:DATABASE_URL, Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD first.");
  if (password.length < 12) throw new Error("Use a password of at least 12 characters.");

  // Default SUPER_ADMIN (the owner). Set ADMIN_ROLE=ADMIN to create a regular admin.
  const role = process.env.ADMIN_ROLE === "ADMIN" ? "ADMIN" : "SUPER_ADMIN";
  const db = new PrismaClient();
  const host = (process.env.DATABASE_URL || "").split("@")[1]?.split("/")[0] ?? "(unknown host)";
  const passwordHash = await bcrypt.hash(password, 10);

  await db.adminUser.upsert({
    where: { email },
    update: { passwordHash, role, active: true },
    create: { email, name: "AgroLink Admin", passwordHash, role },
  });
  console.log(`Admin ready: ${email} as ${role}  (database host: ${host})`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});

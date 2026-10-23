// prisma/seed.ts
// Run with `npm run db:seed`. Populates enough demo data to make every
// admin screen and public page meaningful immediately, and creates the
// first admin login (change the password immediately in production).

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // ---------- Admin login ----------
  const passwordHash = await bcrypt.hash("agrolink-admin-2026", 10);
  await db.adminUser.upsert({
    where: { email: "admin@agrolink.africa" },
    update: {},
    create: { email: "admin@agrolink.africa", name: "A. Mensah", passwordHash, role: "SUPER_ADMIN" },
  });

  // ---------- Product categories ----------
  const categoryNames = ["Nuts & Kernels", "Botanicals", "Oilseeds", "Grains", "Beans & Cereals", "Fuel & Biomass"];
  const categories: Record<string, string> = {};
  for (const name of categoryNames) {
    const cat = await db.productCategory.upsert({
      where: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
      update: {},
      create: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
    });
    categories[name] = cat.id;
  }

  // ---------- Products (demo data, clearly not live inventory) ----------
  const products = [
    { slug: "cashew-nuts", name: "Cashew Nuts (Raw)", cat: "Nuts & Kernels", origin: "Ghana", grade: "Grade A, W240/W320", moq: "1 x 20ft container", availableQty: "120 MT", status: "VERIFIED", published: true, featured: true },
    { slug: "hibiscus-flowers", name: "Hibiscus Flowers (Dried)", cat: "Botanicals", origin: "Senegal", grade: "Premium, hand-sorted", moq: "500 kg trial", availableQty: "8 MT", status: "VERIFIED", published: true, featured: false },
    { slug: "sesame-seeds", name: "Sesame Seeds (Hulled)", cat: "Oilseeds", origin: "Ethiopia", grade: "99% purity", moq: "1 x 20ft container", availableQty: "200 MT", status: "PENDING", published: false, featured: false },
    { slug: "groundnuts", name: "Groundnuts (Peanuts)", cat: "Nuts & Kernels", origin: "Nigeria", grade: "Bold, Aflatoxin-tested", moq: "1 x 20ft container", availableQty: "90 MT", status: "VERIFIED", published: true, featured: false },
    { slug: "soybeans", name: "Soybeans", cat: "Oilseeds", origin: "Zambia", grade: "Non-GMO", moq: "1 x 40ft container", availableQty: "300 MT", status: "VERIFIED", published: true, featured: true },
    { slug: "coffee-beans", name: "Coffee Beans (Green, Arabica)", cat: "Beans & Cereals", origin: "Ethiopia", grade: "Grade 2, Washed", moq: "1 x 20ft container", availableQty: "40 MT", status: "VERIFIED", published: true, featured: false },
    { slug: "local-rice", name: "Local Rice (Paddy & Milled)", cat: "Grains", origin: "Ghana", grade: "5% broken", moq: "10 MT", availableQty: "150 MT", status: "UNVERIFIED", published: false, featured: false },
    { slug: "charcoal", name: "Charcoal (Hardwood, Lump)", cat: "Fuel & Biomass", origin: "Ghana", grade: "Export grade", moq: "1 x 20ft container", availableQty: "180 MT", status: "VERIFIED", published: true, featured: false },
  ];
  for (const p of products) {
    await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug, name: p.name, categoryId: categories[p.cat], origin: p.origin,
        description: `${p.name} sourced from ${p.origin}. Demo listing — replace with real supplier data.`,
        grade: p.grade, moq: p.moq, availableQty: p.availableQty,
        status: p.status as any, published: p.published, featured: p.featured,
      },
    });
  }

  // ---------- Suppliers ----------
  const suppliers = [
    { business: "Brong-Ahafo Cashew Cooperative", country: "Ghana", location: "Sunyani", status: "VERIFIED" },
    { business: "Sahel Botanicals Ltd", country: "Senegal", location: "Kaolack", status: "VERIFIED" },
    { business: "Humera Oilseed Traders", country: "Ethiopia", location: "Humera", status: "PENDING" },
    { business: "Volta Rice Millers", country: "Ghana", location: "Ho", status: "UNVERIFIED" },
  ];
  for (const s of suppliers) {
    await db.supplier.upsert({
      where: { id: s.business.slice(0, 20) },
      update: {},
      create: {
        id: s.business.slice(0, 20),
        businessName: s.business, country: s.country, location: s.location,
        contactEmail: `contact@${s.business.toLowerCase().replace(/[^a-z]/g, "")}.com`,
        contactPhone: "+233200000000", status: s.status as any,
      },
    });
  }

  // ---------- Farm projects ----------
  const farms = [
    { slug: "kumasi-cashew-block", name: "Kumasi Cashew Block", region: "Ashanti Region, Ghana", crop: "Cashew", sizeAcres: 15, stage: "PLANTING" },
    { slug: "tamale-soybean-plot", name: "Tamale Soybean Plot", region: "Northern Region, Ghana", crop: "Soybean", sizeAcres: 25, stage: "GROWING" },
    { slug: "volta-rice-field", name: "Volta Rice Field", region: "Volta Region, Ghana", crop: "Rice", sizeAcres: 10, stage: "HARVESTING" },
    { slug: "eastern-groundnut-trial", name: "Eastern Groundnut Trial", region: "Eastern Region, Ghana", crop: "Groundnut", sizeAcres: 8, stage: "PLANNING" },
  ];
  for (const f of farms) {
    await db.farmProject.upsert({
      where: { slug: f.slug },
      update: {},
      create: {
        slug: f.slug, name: f.name, region: f.region, crop: f.crop, sizeAcres: f.sizeAcres, stage: f.stage as any,
        description: `${f.name} — demo project record.`, landArrangement: "Leased for the season", managementNotes: "Farm-hand crew coordinated by AgroLink field officer",
        published: true,
      },
    });
  }

  // ---------- Academy ----------
  const academy = await db.academyCourse.upsert({
    where: { slug: "produce-sourcing-academy" },
    update: {},
    create: { slug: "produce-sourcing-academy", title: "Produce-Sourcing Academy", description: "Six weeks of practical sourcing training.", durationWeeks: 6, published: true },
  });
  const contractCommand = await db.academyCourse.upsert({
    where: { slug: "contract-command" },
    update: {},
    create: { slug: "contract-command", title: "Contract Command (Practical Track)", description: "Practical trade-sourcing training.", published: true },
  });

  const modules = [
    "Understanding the agricultural trade business", "Identifying tradable African products", "Locating buyers", "Brokers & agents",
    "Conversing with buyers", "Locating suppliers", "Conversing with suppliers", "Supplier verification", "Product specifications",
    "Pricing and negotiation", "Incoterms", "Shipping basics", "Documentation", "Closing and managing a transaction",
  ];
  for (let i = 0; i < modules.length; i++) {
    await db.academyModule.upsert({
      where: { id: `${academy.id}-mod-${i}` },
      update: {},
      create: { id: `${academy.id}-mod-${i}`, courseId: academy.id, order: i, title: modules[i] },
    });
  }
  const ccModules = ["Buyers", "Suppliers", "Brokers & Agents", "Trade"];
  for (let i = 0; i < ccModules.length; i++) {
    await db.academyModule.upsert({
      where: { id: `${contractCommand.id}-mod-${i}` },
      update: {},
      create: { id: `${contractCommand.id}-mod-${i}`, courseId: contractCommand.id, order: i, title: ccModules[i] },
    });
  }

  // ---------- CMS blocks ----------
  const cmsBlocks = [
    { key: "homepage_hero", label: "Homepage Hero", value: "Africa Produces. AgroLink Connects." },
    { key: "announcement_banner", label: "Site Announcement Banner", value: "" },
    { key: "trust_intro", label: "Trust Section Intro", value: "Built on verification, not assumption." },
  ];
  for (const b of cmsBlocks) {
    await db.siteContent.upsert({ where: { key: b.key }, update: {}, create: b });
  }

  console.log("Seed complete. Admin login: admin@agrolink.africa / agrolink-admin-2026 (change immediately).");
  console.log("Public sign-in uses passwordless magic-link email — no seeded password needed.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => db.$disconnect());

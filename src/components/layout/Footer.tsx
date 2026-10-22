// src/components/layout/Footer.tsx
import Link from "next/link";
import Image from "next/image";
import { WHATSAPP_NUMBER_DISPLAY } from "@/lib/whatsapp";
import { CONTACT_EMAIL, CONTACT_LOCATION, SHOW_DEMO_NOTICE } from "@/lib/contact";

export function Footer() {
  return (
    <footer className="mt-24 bg-forest-800 text-cream-100">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-14 grid grid-cols-2 lg:grid-cols-5 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Image src="/logo-mark.png" alt="AgroLink" width={28} height={28} className="w-7 h-7" />
            <span className="font-display font-semibold text-lg">AgroLink</span>
          </div>
          <p className="text-sm text-cream-100/70 max-w-xs">
            We connect African agricultural products with buyers and markets — through sourcing, trade education and
            professionally coordinated farming projects.
          </p>
        </div>
        <div>
          <p className="font-display text-sm font-semibold mb-3 text-gold-200">Platform</p>
          <ul className="space-y-2 text-sm text-cream-100/70">
            <li><Link href="/market" className="hover:text-cream-50">Market</Link></li>
            <li><Link href="/farm" className="hover:text-cream-50">Farm For You</Link></li>
            <li><Link href="/academy" className="hover:text-cream-50">Academy</Link></li>
            <li><Link href="/sourcing" className="hover:text-cream-50">Start Sourcing</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-display text-sm font-semibold mb-3 text-gold-200">For Business</p>
          <ul className="space-y-2 text-sm text-cream-100/70">
            <li><Link href="/list-product" className="hover:text-cream-50">List Your Product</Link></li>
            <li><Link href="/sourcing-desk" className="hover:text-cream-50">Sourcing Desk</Link></li>
            <li><Link href="/how-it-works" className="hover:text-cream-50">How It Works</Link></li>
            <li><Link href="/contact" className="hover:text-cream-50">Contact AgroLink</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-display text-sm font-semibold mb-3 text-gold-200">Talk to us</p>
          <ul className="space-y-2 text-sm text-cream-100/70">
            {WHATSAPP_NUMBER_DISPLAY && (
              <li>WhatsApp: <span className="font-mono">{WHATSAPP_NUMBER_DISPLAY}</span></li>
            )}
            <li><a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-cream-50">{CONTACT_EMAIL}</a></li>
            <li>{CONTACT_LOCATION}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream-50/10 py-5 text-center text-xs text-cream-100/50">
        © {new Date().getFullYear()} AgroLink.{SHOW_DEMO_NOTICE && " All product and pricing data on this preview is demo data."}
      </div>
    </footer>
  );
}

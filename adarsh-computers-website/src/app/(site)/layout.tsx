import { Suspense } from "react";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getSiteSettings } from "@/lib/site-data";
import { CartProvider } from "@/components/site/CartProvider";
import { FloatingWhatsApp } from "@/components/site/FloatingWhatsApp";
import { ScrollReveal } from "@/components/site/ScrollReveal";

async function HeaderWithSettings() {
  const settings = await getSiteSettings();
  return <SiteHeader business={settings.business} />;
}

async function FooterWithSettings() {
  const settings = await getSiteSettings();
  return <SiteFooter business={settings.business} home={settings.home} />;
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  // Stream the page immediately; public settings are request-cached and enrich the shell as soon as they arrive.
  return <CartProvider><Suspense fallback={<SiteHeader business={null} />}><HeaderWithSettings /></Suspense><main><ScrollReveal>{children}</ScrollReveal></main><Suspense fallback={<SiteFooter business={null} home={null} />}><FooterWithSettings /></Suspense><FloatingWhatsApp /></CartProvider>;
}

import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getSiteSettings } from "@/lib/site-data";
import { CartProvider } from "@/components/site/CartProvider";
import { FloatingWhatsApp } from "@/components/site/FloatingWhatsApp";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings();
  return <CartProvider><SiteHeader business={settings.business} /><main>{children}</main><SiteFooter business={settings.business} home={settings.home} /><FloatingWhatsApp /></CartProvider>;
}

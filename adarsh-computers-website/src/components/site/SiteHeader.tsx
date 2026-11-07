import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, MapPin, Phone, UserRound } from "lucide-react";
import type { BusinessSettings } from "@/lib/site-data";
import { Button } from "@/components/ui/button";
import { CartButton } from "@/components/site/CartButton";
import { MobileMenu } from "@/components/site/MobileMenu";
import { whatsappHref } from "@/lib/utils";

const links = [{ href: "/products", label: "Products" }, { href: "/services", label: "Services" }, { href: "/about", label: "About" }, { href: "/contact", label: "Contact" }];

export function SiteHeader({ business }: { business: BusinessSettings | null }) {
  const brandMark = <Image src={business?.logo_url || "/brand/adarsh-computers-logo.png"} alt="" width={42} height={42} className="brand-logo" priority />;
  return <header className="site-header">
    <div className="topline"><div className="container topline-inner"><span><MapPin size={13} aria-hidden="true" /> Nehru Place · New Delhi</span>{business?.phone && <a href={"tel:" + business.phone}><Phone size={13} aria-hidden="true" /> {business.phone}</a>}</div></div>
    <div className="container nav-shell">
      <Link href="/" className="brand-lockup" aria-label="Adarsh Computers home">{brandMark}<span className="brand-copy"><strong>ADARSH</strong><small>COMPUTERS</small></span></Link>
      <nav className="desktop-nav" aria-label="Main navigation">{links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
      <Link className="account-header-link" href="/account" aria-label="Customer account"><UserRound size={19} /><span>Account</span></Link>
      <CartButton />
      <div className="nav-actions"><Button size="sm" className="nav-enquiry" asChild><Link href={business?.whatsapp ? whatsappHref(business.whatsapp, "Hello, I have a product enquiry.") : "/contact"} target={business?.whatsapp ? "_blank" : undefined} rel={business?.whatsapp ? "noreferrer" : undefined}>Get in touch <ArrowUpRight size={15} /></Link></Button></div>
      <MobileMenu />
    </div>
  </header>;
}

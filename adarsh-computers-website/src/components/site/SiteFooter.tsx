import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, MapPin, Phone } from "lucide-react";
import type { BusinessSettings, HomeSettings } from "@/lib/site-data";
import { getBusinessMapEmbedUrl, getBusinessMapUrl } from "@/lib/maps";
import { GoogleMapEmbed } from "@/components/site/GoogleMapEmbed";

export function SiteFooter({ business, home }: { business: BusinessSettings | null; home: HomeSettings | null }) {
  const brandMark = <Image src={business?.logo_url || "/brand/adarsh-computers-logo.png"} alt="" width={42} height={42} className="brand-logo" />;
  const mapEmbedUrl = getBusinessMapEmbedUrl(business);
  const mapUrl = getBusinessMapUrl(business);
  return <footer className="site-footer">
    <div className="container footer-main">
      <div className="footer-brand"><Link href="/" className="brand-lockup brand-lockup-light">{brandMark}<span className="brand-copy"><strong>ADARSH</strong><small>COMPUTERS</small></span></Link><p>{home?.tagline || "Making Technology Work For You"}</p></div>
      <div><span className="footer-label">Explore</span><Link href="/products">Products</Link><Link href="/services">Services</Link><Link href="/about">About us</Link><Link href="/contact">Contact</Link></div>
      <div><span className="footer-label">Visit or call</span>{business?.phone && <a href={"tel:" + business.phone}><Phone size={14} /> {business.phone}</a>}{business?.email && <a href={"mailto:" + business.email}>{business.email} <ArrowUpRight size={14} /></a>}{business?.address && <p className="footer-address"><MapPin size={14} /> {business.address}</p>}<div className="footer-social">{business?.facebook_url && <a href={business.facebook_url} target="_blank" rel="noreferrer">Facebook <ArrowUpRight size={12} /></a>}{business?.instagram_url && <a href={business.instagram_url} target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={12} /></a>}{business?.linkedin_url && <a href={business.linkedin_url} target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight size={12} /></a>}</div></div>
      <div className="footer-map-column"><div className="footer-map-heading"><span className="footer-label">Find us in Nehru Place</span><a href={mapUrl} target="_blank" rel="noopener noreferrer">Open in Google Maps <ArrowUpRight size={13} /></a></div><div className="footer-map-frame"><GoogleMapEmbed title="Adarsh Computers on Google Maps" src={mapEmbedUrl} /></div></div>
    </div>
    <div className="container footer-bottom"><span>© {new Date().getFullYear()} Adarsh Computers</span><span className="footer-credit">Designed &amp; Developed by <a href="https://blitzwebwork.vercel.app/" target="_blank" rel="noopener noreferrer">BlitzWebWorks</a></span><div><Link href="/privacy-policy">Privacy</Link><Link href="/cookie-policy">Cookies</Link><Link href="/terms">Terms</Link><Link href="/shipping-delivery">Delivery</Link><Link href="/refund-cancellation">Cancellations</Link><Link href="/grievance">Privacy concerns</Link><Link href="/privacy-request">Privacy request</Link></div></div>
  </footer>;
}


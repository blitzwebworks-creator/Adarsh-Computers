import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/site/ContactForm";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/site-data";
import { whatsappHref } from "@/lib/utils";
import { getBusinessMapEmbedUrl, getBusinessMapUrl } from "@/lib/maps";
import { GoogleMapEmbed } from "@/components/site/GoogleMapEmbed";

type SearchParams = Promise<{ product?: string }>;
export const metadata = { title: "Contact", description: "Contact Adarsh Computers in Nehru Place, New Delhi." };
export default async function ContactPage({ searchParams }: { searchParams: SearchParams }) {
  const [settings, params] = await Promise.all([getSiteSettings(), searchParams]);
  const { business } = settings;
  const mapEmbedUrl = getBusinessMapEmbedUrl(business);
  const mapUrl = getBusinessMapUrl(business);
  return <>
    <section className="page-hero"><div className="container page-hero-inner"><span className="eyebrow">Contact</span><h1>Let’s talk about what you need.</h1><p>Share a product or service enquiry and the store will get back to you.</p><div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>Contact</span></div></div></section>
    <section className="section-padding contact-section"><div className="container contact-grid"><div className="contact-info"><span className="eyebrow">Visit or get in touch</span><h2>We’re in the heart of Nehru Place.</h2><p>Reach out directly or send an enquiry with a few details about what you’re looking for.</p>
      {business?.phone && <a href={"tel:" + business.phone} className="contact-detail"><span className="contact-detail-icon"><Phone size={19} /></span><span><small>Call the store</small><strong>{business.phone}</strong></span><ArrowUpRight size={16} /></a>}
      {business?.secondary_phone && <a href={"tel:" + business.secondary_phone} className="contact-detail"><span className="contact-detail-icon"><Phone size={19} /></span><span><small>Alternate number</small><strong>{business.secondary_phone}</strong></span><ArrowUpRight size={16} /></a>}
      {business?.email && <a href={"mailto:" + business.email} className="contact-detail"><span className="contact-detail-icon"><Mail size={19} /></span><span><small>Email</small><strong>{business.email}</strong></span><ArrowUpRight size={16} /></a>}
      {business?.address && <div className="contact-detail address-detail"><span className="contact-detail-icon"><MapPin size={19} /></span><span><small>Visit us</small><strong>{business.address}</strong></span></div>}
      {business?.whatsapp && <Button variant="secondary" className="whatsapp-button" asChild><Link href={whatsappHref(business.whatsapp, "Hello, I have a product enquiry.")} target="_blank" rel="noreferrer">Chat on WhatsApp <ArrowUpRight size={16} /></Link></Button>}
    </div><div className="contact-form-card"><span className="eyebrow">Send an enquiry</span><h2>How can we help?</h2><ContactForm initialInterested={params.product || ""} /></div></div></section>
    <section className="map-section"><div className="container map-frame-wrap"><div className="map-heading"><div><span className="eyebrow">Find us</span><h2>Visit Adarsh Computers</h2></div><Button variant="outline" asChild><a href={mapUrl} target="_blank" rel="noopener noreferrer">Open in Google Maps <ArrowUpRight size={16} /></a></Button></div><div className="map-frame"><GoogleMapEmbed title="Map to Adarsh Computers" src={mapEmbedUrl} /></div></div></section>
  </>;
}

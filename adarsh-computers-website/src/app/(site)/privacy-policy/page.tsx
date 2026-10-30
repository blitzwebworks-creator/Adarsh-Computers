import Link from "next/link";
import { getSiteSettings } from "@/lib/site-data";

export const metadata = { title: "Privacy policy" };
export default async function PrivacyPolicyPage() {
  const { business } = await getSiteSettings();
  return <section className="section-padding legal-page"><div className="container"><span className="eyebrow">Legal</span><h1>Privacy policy</h1><p className="prose-copy">This page explains how information submitted through the Adarsh Computers enquiry form is used.</p><h2>Information you provide</h2><p className="prose-copy">When you send an enquiry, the form collects your name, phone number, optional email address, the product or service you are interested in, and your message. The information is stored so the store can review and respond to your request.</p><h2>How to contact us</h2><p className="prose-copy">To ask about an enquiry or request correction or deletion, contact {business?.email ? <a href={"mailto:" + business.email}>{business.email}</a> : "Adarsh Computers using the contact page"}.</p><h2>Changes</h2><p className="prose-copy">This notice may be updated when the website or enquiry process changes. Please check this page for the latest version.</p><Link className="text-link" href="/contact">Contact Adarsh Computers</Link></div></section>;
}

import Link from "next/link";
import { getSiteSettings } from "@/lib/site-data";

export const metadata = { title: "Privacy concerns and grievances" };

export default async function GrievancePage() {
  const { business } = await getSiteSettings();
  return <section className="section-padding legal-page"><div className="container legal-document">
    <span className="eyebrow">Help and escalation</span><h1>Privacy concerns</h1>
    <p className="prose-copy">If you have a concern about personal information handled through this website, contact Adarsh Computers and describe the account, enquiry or order involved. Please do not include passwords or payment credentials.</p>
    <h2>Contact the business</h2><p className="prose-copy">{business?.email ? <>Email <a href={`mailto:${business.email}?subject=Website%20privacy%20concern`}>{business.email}</a></> : <Link href="/contact">Use the contact page</Link>}{business?.phone ? <> or call <a href={`tel:${business.phone}`}>{business.phone}</a></> : null}. The business has not supplied a separate named grievance officer for this site.</p>
    <h2>Make a privacy request</h2><p className="prose-copy">Use the <Link href="/privacy-request">privacy request form</Link> to ask about access, correction or deletion. The business may verify your identity before sharing or changing information.</p>
  </div></section>;
}

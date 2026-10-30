import Link from "next/link";

export const metadata = { title: "Terms and conditions" };
export default function TermsPage() {
  return <section className="section-padding legal-page"><div className="container"><span className="eyebrow">Legal</span><h1>Terms and conditions</h1><p className="prose-copy">The website provides general information about Adarsh Computers and a catalogue of products and services. Product listings are managed by the store; contact the store to confirm current availability, specifications and price before making a purchase decision.</p><h2>Enquiries</h2><p className="prose-copy">Submitting an enquiry does not place an order or reserve a product. The store may contact you using the details supplied in the form to respond to your request.</p><h2>Website information</h2><p className="prose-copy">The business may update product listings, service details and website content over time. Please contact the store if you need clarification about information shown here.</p><Link className="text-link" href="/contact">Contact Adarsh Computers</Link></div></section>;
}

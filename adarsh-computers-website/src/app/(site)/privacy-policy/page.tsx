import Link from "next/link";
import { getSiteSettings } from "@/lib/site-data";

export const metadata = { title: "Privacy notice" };

export default async function PrivacyPolicyPage() {
  const { business } = await getSiteSettings();
  const email = business?.email;
  const phone = business?.phone;
  return <section className="section-padding legal-page"><div className="container legal-document">
    <span className="eyebrow">Privacy · Adarsh Computers</span>
    <h1>Privacy notice</h1>
    <p className="prose-copy">This notice describes how Adarsh Computers handles personal information when you browse this website, contact the store, create a customer account or prepare an order. It is written for the features currently available on this website.</p>
    <p className="legal-updated">Last updated: 9 November 2026</p>

    <h2>Information you provide</h2>
    <ul className="legal-list">
      <li><strong>Enquiries:</strong> your name, phone number, optional email address, the product or service you ask about and your message.</li>
      <li><strong>Customer accounts:</strong> your name and email address used for sign-in. Supabase Auth handles your password; this website does not display it to store staff.</li>
      <li><strong>Saved details and orders:</strong> contact and delivery details, products, quantities, prices, discounts, order notes and order status.</li>
      <li><strong>Privacy requests:</strong> your name, email, selected request type and the details you choose to provide.</li>
      <li><strong>Basic technical data:</strong> the hosting and security services may process connection and device information needed to deliver, protect and troubleshoot the website.</li>
    </ul>

    <h2>Why information is used</h2>
    <p className="prose-copy">Information is used to answer enquiries, manage customer sign-in, save requested profile details, prepare and follow up on orders, prevent abuse, maintain website security and meet applicable record-keeping obligations. The website does not currently offer online payment or ask for card or bank credentials. Do not send passwords or payment credentials in an enquiry or order note.</p>

    <h2>Service providers and external links</h2>
    <p className="prose-copy">Supabase provides the configured database, authentication and image-storage services. The deployment host processes website requests and may provide security and delivery services. When you choose to load the map, Google may receive connection information under its own terms. When you choose to open and send the prepared order message, WhatsApp receives the information included in that message. These external services have their own privacy notices and settings.</p>
    <p className="prose-copy">We do not currently use this website to send promotional emails or to run advertising or analytics trackers. The cart is saved in your browser storage. Authentication uses essential Supabase session cookies; the optional “Remember me” choice extends the session cookie lifetime.</p>

    <h2>Children’s information</h2>
    <p className="prose-copy">This general computer hardware catalogue is not designed specifically for children. Please have a parent or guardian handle account creation, enquiries and order requests for a child. If you believe a child’s information was submitted inappropriately, contact the store so it can review the request.</p>

    <h2>Security and incident response</h2>
    <p className="prose-copy">The website uses encrypted connections, role-based administrator access, database access policies and protected authentication sessions. These safeguards reduce risk but cannot guarantee that every online service is risk-free. If the business identifies an incident affecting personal information, it should investigate, contain the incident and communicate with affected people or authorities when required by applicable law.</p>

    <h2>Access, correction and deletion requests</h2>
    <p className="prose-copy">You can ask the business about the personal information associated with an account, enquiry or order. Submit a request through the <Link href="/privacy-request">privacy request form</Link>. To protect account and order information, we may ask you to verify your identity before providing a copy or making a change. A request is not completed automatically when the form is submitted. Some records may need to be retained where applicable law or legitimate business records require it.</p>
    <p className="prose-copy">Information is kept only for as long as it is needed to respond, manage an account or order, protect the service and satisfy applicable record-keeping duties. For abuse prevention, public form intake stores a hash of the connection fingerprint for rate limiting rather than the raw value; old rate-limit rows are cleaned up during later form submissions. The business should maintain a separate documented retention schedule for customer records and review it with its legal adviser.</p>
    <p className="prose-copy">To withdraw a choice you previously made or ask the business to stop optional processing, sign out of your account where relevant and submit a <Link href="/privacy-request">privacy request</Link>. There is no marketing opt-in or analytics tracking choice currently offered on this website. A withdrawal request does not remove information that must be retained for an order, security or legal record.</p>

    <h2>Contact</h2>
    <p className="prose-copy">For privacy questions, use the <Link href="/contact">contact page</Link>{email ? <> or email <a href={`mailto:${email}`}>{email}</a></> : null}{phone ? <> or call <a href={`tel:${phone}`}>{phone}</a></> : null}. The business has not supplied a separate named privacy or grievance officer for this website.</p>

    <h2>About applicable privacy law</h2>
    <p className="prose-copy">This notice is an operational website notice, not a legal opinion or a certification of compliance. The DPDP Act and Rules use a phased commencement schedule; the principal notice, consent and data-principal-rights obligations are scheduled to commence 18 months after the Gazette publication dated 13 November 2025. The business should have the final notice, retention periods and grievance contact reviewed before representing that it meets every applicable requirement.</p>
    <div className="legal-link-row"><Link className="text-link" href="/privacy-request">Make a privacy request</Link><Link className="text-link" href="/cookie-policy">Cookie and storage notice</Link><Link className="text-link" href="/contact">Contact the store</Link></div>
  </div></section>;
}

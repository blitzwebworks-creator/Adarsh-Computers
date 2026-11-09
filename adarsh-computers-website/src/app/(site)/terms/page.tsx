import Link from "next/link";

export const metadata = { title: "Website terms" };

export default function TermsPage() {
  return <section className="section-padding legal-page"><div className="container legal-document">
    <span className="eyebrow">Customer information</span><h1>Website terms</h1>
    <p className="prose-copy">This website provides information about Adarsh Computers, its product catalogue and services. A listing or enquiry is not a reservation, an offer to sell at a guaranteed price, or a confirmed order.</p>
    <h2>Product information and availability</h2><p className="prose-copy">Specifications, price and availability are maintained by the store and may change. Contact Adarsh Computers to confirm current details before purchasing. Any product warranty is the warranty offered by the relevant manufacturer or seller and should be confirmed with the store.</p>
    <h2>Order requests and payment</h2><p className="prose-copy">The current checkout saves your requested items and prepares a message for WhatsApp. It does not take payment. A request remains pending until the store confirms product availability, final price, delivery arrangements and any applicable charges. Do not treat the order-ready screen or a saved request as a payment receipt or confirmation.</p>
    <h2>Use of the website</h2><p className="prose-copy">Please provide accurate information, use the forms for genuine requests and do not attempt to access or change another person’s account or order. We may restrict abusive requests to protect the service and customers.</p>
    <h2>Privacy and contact</h2><p className="prose-copy">Personal information is handled as described in the <Link href="/privacy-policy">privacy notice</Link>. For product, delivery or website questions, use the <Link href="/contact">contact page</Link>.</p>
  </div></section>;
}

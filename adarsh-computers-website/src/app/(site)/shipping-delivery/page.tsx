import Link from "next/link";

export const metadata = { title: "Shipping and delivery" };

export default function ShippingDeliveryPage() {
  return <section className="section-padding legal-page"><div className="container legal-document">
    <span className="eyebrow">Order information</span><h1>Shipping and delivery</h1>
    <p className="prose-copy">The website’s checkout currently prepares an order request for confirmation with Adarsh Computers. It does not accept online payment or create a confirmed delivery booking.</p>
    <h2>Confirming an order</h2><p className="prose-copy">Before you accept an order, the store will confirm product availability, delivery method, destination coverage, expected timing and any delivery charge directly with you. These details can vary by product and location, so they are not guaranteed by the catalogue or checkout request.</p>
    <h2>Need delivery details?</h2><p className="prose-copy">Please contact the store before treating a request as confirmed. You can use the <Link href="/contact">contact page</Link> or the WhatsApp option shown at checkout.</p>
  </div></section>;
}

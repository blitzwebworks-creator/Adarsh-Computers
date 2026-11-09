import Link from "next/link";

export const metadata = { title: "Cancellations and refunds" };

export default function RefundCancellationPage() {
  return <section className="section-padding legal-page"><div className="container legal-document">
    <span className="eyebrow">Order information</span><h1>Cancellations and refunds</h1>
    <p className="prose-copy">No online payment is collected through this website. A checkout submission is an order request for the store to review; it is not a completed purchase or a payment.</p>
    <h2>Before an order is confirmed</h2><p className="prose-copy">If you need to change or withdraw a pending request, contact Adarsh Computers as soon as possible and quote the order reference. The store will confirm whether the request can still be changed.</p>
    <h2>Confirmed purchases</h2><p className="prose-copy">Any cancellation, return, replacement or refund for a separately confirmed purchase depends on the terms communicated by the store and any applicable law. Please confirm those terms with the store before accepting the purchase. This website does not publish a fixed return window or promise a refund.</p>
    <p className="prose-copy">For help, use the <Link href="/contact">contact page</Link> or the WhatsApp conversation used to confirm your order.</p>
  </div></section>;
}

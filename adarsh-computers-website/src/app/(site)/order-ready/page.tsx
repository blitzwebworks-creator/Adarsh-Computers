import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CircleCheck, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClearCartOnReady } from "@/components/site/ClearCartOnReady";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, whatsappHref } from "@/lib/utils";

export const metadata: Metadata = { title: "Order ready", description: "Review your order details and send them to Adarsh Computers on WhatsApp." };
type SearchParams = Promise<{ reference?: string }>;
type ReadyItem = { product_id: string | null; product_name: string; brand: string | null; image_url: string | null; unit_price: number; quantity: number; line_total: number };
type ReadyOrder = { reference: string; customer_name: string; customer_phone: string; customer_email: string; delivery_address: string; city: string | null; state: string | null; pincode: string | null; notes: string | null; subtotal: number; discount_amount: number; discount_code: string | null; total: number; status: string; created_at: string; items: ReadyItem[] };

export default async function OrderReadyPage({ searchParams }: { searchParams: SearchParams }) {
  const { reference } = await searchParams;
  if (!reference || !/^AC-[A-Z0-9-]{10,30}$/.test(reference)) notFound();
  const cookieStore = await cookies();
  const savedAccess = cookieStore.get("adarsh_order_access")?.value || "";
  const [savedReference, token] = savedAccess.split(":");
  if (!token || savedReference !== reference) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_adarsh_order", { p_reference: reference, p_access_token: token });
  if (error || !data || typeof data !== "object") notFound();
  const order = data as unknown as ReadyOrder;
  if (!Array.isArray(order.items)) notFound();

  const whatsappMessage = [
    `Hello Adarsh Computers, I am sending the details for order ${order.reference}.`,
    "", `Name: ${order.customer_name}`, `Contact: ${order.customer_phone}`, `Email: ${order.customer_email}`,
    `Delivery address: ${[order.delivery_address, order.city, order.state, order.pincode].filter(Boolean).join(", ")}`,
    ...(order.notes ? [`Notes: ${order.notes}`] : []), "", "Products:",
    ...order.items.map((item) => `• ${item.product_name} × ${item.quantity} — ${formatCurrency(Number(item.unit_price))} each (${formatCurrency(Number(item.line_total))})`),
    ...(order.discount_code ? [`Discount code: ${order.discount_code} (−${formatCurrency(Number(order.discount_amount))})`] : []),
    `Product total: ${formatCurrency(Number(order.total))}`, "Please confirm availability, delivery and the final order with me.",
  ].join("\n");
  const whatsapp = whatsappHref("918506006504", whatsappMessage);

  return <section className="order-ready-section"><ClearCartOnReady /><div className="container order-ready-wrap">
    <div className="order-ready-card surface">
      <div className="order-ready-success"><CircleCheck size={38} /><span>Order details prepared</span></div>
      <span className="eyebrow">Reference {order.reference}</span>
      <h1>Your order is ready to send.</h1>
      <p className="order-ready-lead">This order has not been confirmed. Send the prepared WhatsApp message, then wait for the store to confirm availability, delivery and the final order.</p>
      <div className="order-ready-progress"><span><i><Check size={12} /></i>Details saved</span><span className="progress-line" /><span><i>2</i>Send on WhatsApp</span><span className="progress-line" /><span><i>3</i>Store confirms</span></div>
      <div className="ready-order-grid">
        <section className="ready-order-items"><div className="ready-section-heading"><h2>Order summary</h2><span>{formatDate(order.created_at)}</span></div>
          {order.items.map((item, index) => <article className="ready-order-item" key={item.product_id || item.product_name + index}><span className="ready-order-image">{item.image_url && <Image src={item.image_url} alt="" fill sizes="62px" />}</span><span className="ready-order-copy"><strong>{item.product_name}</strong><small>{item.brand || "Adarsh Computers"} · Qty {item.quantity} · {formatCurrency(Number(item.unit_price))} each</small></span><strong>{formatCurrency(Number(item.line_total))}</strong></article>)}
          <div className="ready-order-totals"><div><span>Subtotal</span><strong>{formatCurrency(Number(order.subtotal))}</strong></div>{Number(order.discount_amount) > 0 && <div className="summary-discount"><span>Discount · {order.discount_code}</span><strong>−{formatCurrency(Number(order.discount_amount))}</strong></div>}<div className="summary-total"><span>Product total</span><strong>{formatCurrency(Number(order.total))}</strong></div><small>Delivery and any shipping charge will be confirmed by the store.</small></div>
        </section>
        <aside className="ready-customer-info"><h2>Customer information</h2><dl><div><dt>Name</dt><dd>{order.customer_name}</dd></div><div><dt>Contact</dt><dd>{order.customer_phone}</dd></div><div><dt>Email</dt><dd>{order.customer_email}</dd></div><div><dt>Delivery address</dt><dd>{[order.delivery_address, order.city, order.state, order.pincode].filter(Boolean).join(", ")}</dd></div>{order.notes && <div><dt>Notes</dt><dd>{order.notes}</dd></div>}</dl></aside>
      </div>
      <div className="order-ready-actions"><Button asChild size="lg"><a href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} /> Continue to WhatsApp <ArrowRight size={17} /></a></Button><Button variant="outline" asChild><Link href="/"><ArrowLeft size={16} /> Back to homepage</Link></Button></div>
      <p className="order-ready-disclaimer"><ShieldCheck size={15} /> Sending the WhatsApp message is required. The store will confirm your order directly.</p>
    </div>
  </div></section>;
}

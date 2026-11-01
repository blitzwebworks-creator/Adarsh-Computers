import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserRound, StickyNote, CreditCard, Clock3 } from "lucide-react";
import { AdminNotice, AdminPageHeader, StatusBadge } from "@/components/admin/AdminBits";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/ui/FormSubmitButton";
import { addOrderNoteAction, updateOrderPaymentAction, updateOrderStatusAction } from "@/lib/actions/admin";
import { getOrder, getOrderNotes, getOrderStatusEvents } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order details" };
type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ notice?: string; error?: string }>;
export default async function AdminOrderDetailPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { id } = await params;
  const [order, notes, statusEvents, query] = await Promise.all([getOrder(id), getOrderNotes(id), getOrderStatusEvents(id), searchParams]);
  if (!order) notFound();
  return <>
    <AdminPageHeader eyebrow="Order details" title={order.reference} description={`Placed ${formatDate(order.created_at)} · ${order.order_items?.length || 0} products`}><Button variant="outline" asChild><Link href="/admin/orders"><ArrowLeft size={15} /> All orders</Link></Button></AdminPageHeader>
    <AdminNotice notice={query.notice} error={query.error} />
    <div className="admin-order-detail-grid">
      <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">Customer</span><h2>{order.customer_name}</h2></div><span className="customer-detail-icon"><UserRound size={18} /></span></div>
        <dl className="admin-order-customer"><div><dt>Phone</dt><dd><a href={"tel:" + order.customer_phone}>{order.customer_phone}</a></dd></div><div><dt>Email</dt><dd><a href={"mailto:" + order.customer_email}>{order.customer_email}</a></dd></div><div><dt>Delivery address</dt><dd>{[order.delivery_address, order.city, order.state, order.pincode].filter(Boolean).join(", ")}</dd></div>{order.notes && <div><dt>Notes</dt><dd>{order.notes}</dd></div>}</dl>
      </section>
      <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">Order status</span><h2>Follow-up</h2></div><StatusBadge>{order.status}</StatusBadge></div>
        <form action={updateOrderStatusAction} className="admin-form"><input type="hidden" name="id" value={order.id} /><label className="admin-field">Update status<select name="status" className="admin-select" defaultValue={order.status}><option>Pending</option><option>New</option><option>WhatsApp Contacted</option><option>Confirmed</option><option>Processing</option><option>Packed</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select></label><FormSubmitButton pendingText="Saving status…">Save status</FormSubmitButton></form>
        <div className="order-timeline"><strong>Order timeline</strong>{statusEvents.length ? statusEvents.map((event) => <span key={event.id}><Clock3 size={16} /> {event.from_status ? `${event.from_status} → ${event.to_status}` : `Order created · ${event.to_status}`} · {formatDate(event.created_at)}</span>) : <span><Clock3 size={16} /> Created · {formatDate(order.created_at)} · Current status: {order.status}</span>}</div>
      </section>
      <section className="admin-panel surface admin-order-items-panel"><div className="admin-panel-heading"><div><span className="eyebrow">Products and pricing</span><h2>Order summary</h2></div></div>
        <div className="admin-order-items">{order.order_items?.map((item, index) => <article className="admin-order-item" key={item.id || item.product_name + index}><span className="admin-order-image">{item.image_url && <Image src={item.image_url} alt="" width={54} height={54} unoptimized />}</span><span><strong>{item.product_name}</strong><small>{item.brand || "Adarsh Computers"} · Quantity {item.quantity}</small></span><span>{formatCurrency(Number(item.unit_price))} each</span><strong>{formatCurrency(Number(item.line_total))}</strong></article>)}</div>
        <div className="admin-order-totals"><div><span>Subtotal</span><strong>{formatCurrency(Number(order.subtotal))}</strong></div>{Number(order.discount_amount) > 0 && <div><span>Discount · {order.discount_code}</span><strong>−{formatCurrency(Number(order.discount_amount))}</strong></div>}<div><span>Delivery</span><strong>Confirmed by store</strong></div><div><span>Product total</span><strong>{formatCurrency(Number(order.total))}</strong></div></div>
      </section>
      <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">Payment information</span><h2><CreditCard size={17} /> Payment status</h2></div><StatusBadge>{order.payment_status || "not_required"}</StatusBadge></div><p className="order-payment-note">This site currently prepares WhatsApp orders and does not process online payments. Only record a payment after verifying it outside the website.</p><form action={updateOrderPaymentAction} className="admin-form"><input type="hidden" name="order_id" value={order.id} /><label className="admin-field">Payment status<select className="admin-select" name="payment_status" defaultValue={order.payment_status || "not_required"}><option value="not_required">Not required / WhatsApp order</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></label><label className="admin-field">Payment method<input className="admin-select" name="payment_method" maxLength={80} defaultValue={order.payment_method || "WhatsApp"} /></label><label className="admin-field">Transaction reference<input className="admin-select" name="payment_transaction_id" maxLength={160} defaultValue={order.payment_transaction_id || ""} placeholder="Optional verified reference" /></label><FormSubmitButton pendingText="Saving payment details…">Save payment details</FormSubmitButton></form></section>
      <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">Internal only</span><h2><StickyNote size={17} /> Team notes</h2></div></div><form action={addOrderNoteAction} className="admin-form"><input type="hidden" name="order_id" value={order.id} /><label className="admin-field">Add a note<textarea className="admin-select order-note-input" name="note" maxLength={2000} required placeholder="Add a private follow-up note for the team." /></label><FormSubmitButton pendingText="Adding note…">Add note</FormSubmitButton></form>{notes.length > 0 && <div className="order-note-list">{notes.map((note) => <article key={note.id}><p>{note.note}</p><time dateTime={note.created_at}>{formatDate(note.created_at)}</time></article>)}</div>}</section>
    </div>
  </>;
}

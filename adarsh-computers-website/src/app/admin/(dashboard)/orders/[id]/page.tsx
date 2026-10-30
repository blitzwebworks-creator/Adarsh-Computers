import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserRound } from "lucide-react";
import { AdminPageHeader, StatusBadge } from "@/components/admin/AdminBits";
import { Button } from "@/components/ui/button";
import { updateOrderStatusAction } from "@/lib/actions/admin";
import { getOrder } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order details" };
type Params = Promise<{ id: string }>;
export default async function AdminOrderDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  return <>
    <AdminPageHeader eyebrow="Order details" title={order.reference} description={`Placed ${formatDate(order.created_at)} · ${order.order_items?.length || 0} products`}><Button variant="outline" asChild><Link href="/admin/orders"><ArrowLeft size={15} /> All orders</Link></Button></AdminPageHeader>
    <div className="admin-order-detail-grid">
      <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">Customer</span><h2>{order.customer_name}</h2></div><span className="customer-detail-icon"><UserRound size={18} /></span></div>
        <dl className="admin-order-customer"><div><dt>Phone</dt><dd><a href={"tel:" + order.customer_phone}>{order.customer_phone}</a></dd></div><div><dt>Email</dt><dd><a href={"mailto:" + order.customer_email}>{order.customer_email}</a></dd></div><div><dt>Delivery address</dt><dd>{[order.delivery_address, order.city, order.state, order.pincode].filter(Boolean).join(", ")}</dd></div>{order.notes && <div><dt>Notes</dt><dd>{order.notes}</dd></div>}</dl>
      </section>
      <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">Order status</span><h2>Follow-up</h2></div><StatusBadge>{order.status}</StatusBadge></div>
        <form action={updateOrderStatusAction} className="admin-form"><input type="hidden" name="id" value={order.id} /><label className="admin-field">Update status<select name="status" className="admin-select" defaultValue={order.status}><option>Pending</option><option>WhatsApp Contacted</option><option>Confirmed</option><option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select></label><Button type="submit">Save status</Button></form>
      </section>
      <section className="admin-panel surface admin-order-items-panel"><div className="admin-panel-heading"><div><span className="eyebrow">Products and pricing</span><h2>Order summary</h2></div></div>
        <div className="admin-order-items">{order.order_items?.map((item, index) => <article className="admin-order-item" key={item.id || item.product_name + index}><span className="admin-order-image">{item.image_url && <Image src={item.image_url} alt="" width={54} height={54} unoptimized />}</span><span><strong>{item.product_name}</strong><small>{item.brand || "Adarsh Computers"} · Quantity {item.quantity}</small></span><span>{formatCurrency(Number(item.unit_price))} each</span><strong>{formatCurrency(Number(item.line_total))}</strong></article>)}</div>
        <div className="admin-order-totals"><div><span>Subtotal</span><strong>{formatCurrency(Number(order.subtotal))}</strong></div>{Number(order.discount_amount) > 0 && <div><span>Discount · {order.discount_code}</span><strong>−{formatCurrency(Number(order.discount_amount))}</strong></div>}<div><span>Product total</span><strong>{formatCurrency(Number(order.total))}</strong></div></div>
      </section>
    </div>
  </>;
}

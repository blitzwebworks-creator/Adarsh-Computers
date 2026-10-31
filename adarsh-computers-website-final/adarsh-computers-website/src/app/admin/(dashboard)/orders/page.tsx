import Link from "next/link";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { AdminNotice, AdminPageHeader, StatusBadge } from "@/components/admin/AdminBits";
import { Button } from "@/components/ui/button";
import { getOrders } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Orders" };
type SearchParams = Promise<{ notice?: string; error?: string }>;
export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const orders = await getOrders();
  return <>
    <AdminPageHeader eyebrow="Store activity" title="Orders" description="Review customer details, order items and WhatsApp follow-up status." />
    <AdminNotice notice={params.notice} error={params.error} />
    <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">Order history</span><h2>{orders.length} orders</h2></div></div>
      {orders.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Reference</th><th>Customer</th><th>Products</th><th>Product total</th><th>Status</th><th>Date</th><th /></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.reference}</strong></td><td><div className="customer-cell"><strong>{order.customer_name}</strong><a href={"tel:" + order.customer_phone}>{order.customer_phone}</a><a href={"mailto:" + order.customer_email}>{order.customer_email}</a></div></td><td>{order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items</td><td>{formatCurrency(Number(order.total))}</td><td><StatusBadge>{order.status}</StatusBadge></td><td>{formatDate(order.created_at)}</td><td><Button variant="outline" size="sm" asChild><Link href={"/admin/orders/" + order.id}>View <ArrowUpRight size={14} /></Link></Button></td></tr>)}</tbody></table></div> : <div className="admin-empty"><span className="empty-icon"><ShoppingBag size={22} /></span><strong>No orders yet.</strong><p>Orders submitted through checkout will appear here.</p></div>}
    </section>
  </>;
}

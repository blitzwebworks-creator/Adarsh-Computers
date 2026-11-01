import Link from "next/link";
import { ArrowUpRight, Search, ShoppingBag, Trash2 } from "lucide-react";
import { AdminNotice, AdminPageHeader, StatusBadge } from "@/components/admin/AdminBits";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { Button } from "@/components/ui/button";
import { deleteOrderAction } from "@/lib/actions/admin";
import { getOrders } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Orders" };
type SearchParams = Promise<{ notice?: string; error?: string; search?: string; status?: string; from?: string; to?: string }>;
export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const orders = await getOrders({ search: params.search, status: params.status, from: params.from, to: params.to });
  return <>
    <AdminPageHeader eyebrow="Store activity" title="Orders" description="Review customer details, order items and WhatsApp follow-up status." />
    <AdminNotice notice={params.notice} error={params.error} />
    <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">Order history</span><h2>{orders.length} orders</h2></div></div>
      <form method="get" className="admin-list-filters"><label className="admin-search-field"><Search size={16} /><input name="search" defaultValue={params.search || ""} placeholder="Search reference, customer, email or phone" /></label><select className="admin-select" name="status" defaultValue={params.status || "all"}><option value="all">All order statuses</option><option value="new">New orders</option><option value="processing">Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select><label className="admin-date-filter">From<input type="date" name="from" defaultValue={params.from || ""} /></label><label className="admin-date-filter">To<input type="date" name="to" defaultValue={params.to || ""} /></label><Button type="submit" variant="outline">Filter</Button><Button type="button" variant="ghost" asChild><Link href="/admin/orders">Clear</Link></Button></form>
      {orders.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Reference</th><th>Customer</th><th>Products · Qty</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th /></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.reference}</strong></td><td><div className="customer-cell"><strong>{order.customer_name}</strong><a href={"tel:" + order.customer_phone}>{order.customer_phone}</a><a href={"mailto:" + order.customer_email}>{order.customer_email}</a></div></td><td><span>{order.order_items?.length || 0} products · {order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items</span><small className="order-product-summary">{order.order_items?.map((item) => `${item.product_name} ×${item.quantity}`).join(", ")}</small></td><td>{formatCurrency(Number(order.total))}</td><td><StatusBadge>{order.payment_status === "paid" ? "Paid" : order.payment_status === "pending" ? "Payment Pending" : order.payment_status === "failed" ? "Payment Failed" : order.payment_status === "refunded" ? "Refunded" : "Not Required"}</StatusBadge></td><td><StatusBadge>{order.status}</StatusBadge></td><td>{formatDate(order.created_at)}</td><td><div className="table-actions"><Button variant="outline" size="sm" asChild><Link href={"/admin/orders/" + order.id}>View <ArrowUpRight size={14} /></Link><ConfirmForm action={deleteOrderAction} message={`Permanently delete order ${order.reference}? Its items, notes, status history and order notification will also be deleted.`}><input type="hidden" name="id" value={order.id} /><Button variant="danger" size="icon" aria-label={`Delete order ${order.reference}`} title="Delete order"><Trash2 size={15} /></Button></ConfirmForm></div></td></tr>)}</tbody></table></div> : <div className="admin-empty"><span className="empty-icon"><ShoppingBag size={22} /></span><strong>No orders match this filter.</strong><p>New customer orders will appear here automatically when live updates are connected.</p></div>}
    </section>
  </>;
}

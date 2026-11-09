import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LogOut, Package, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/admin/AdminBits";
import { Input } from "@/components/ui/input";
import { FormSubmitButton } from "@/components/ui/FormSubmitButton";
import { saveCustomerDetailsAction, signOutCustomerAction } from "@/lib/actions/customer-auth";
import { requireCustomer } from "@/lib/auth";
import { getCustomerDetails, getCustomerOrders } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PRIVACY_NOTICE_VERSION } from "@/lib/privacy";

export const metadata: Metadata = { title: "My Account" };
type SearchParams = Promise<{ profile?: string }>;
export default async function CustomerAccountPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { user, profile } = await requireCustomer();
  const [details, orders] = await Promise.all([getCustomerDetails(user.id), getCustomerOrders(user.id)]);
  const profileMessage = params.profile === "saved" ? "Your details have been saved." : params.profile === "invalid" ? "Check the required fields and try again." : params.profile === "consent" ? "Please review and accept the privacy notice before saving your details." : params.profile === "setup" ? "Saved details are temporarily unavailable. Please try again later." : params.profile === "error" ? "We could not save your details. Try again." : "";
  return <section className="customer-account-section"><div className="container">
    <div className="account-page-heading"><div><span className="eyebrow">Customer account</span><h1>Hello{details?.full_name ? `, ${details.full_name.split(" ")[0]}` : ""}.</h1><p>Manage your saved details and review your order history.</p></div><form action={signOutCustomerAction}><Button variant="outline"><LogOut size={16} /> Sign out</Button></form></div>
    <div className="customer-account-grid">
      <section className="account-panel surface"><div className="account-panel-heading"><span><UserRound size={18} /></span><div><h2>Contact and delivery details</h2><p>These details can be filled into checkout when you’re signed in.</p></div></div>
        {profileMessage && <p className={params.profile === "saved" ? "auth-success" : "auth-error"} role="status">{profileMessage}</p>}
        <form action={saveCustomerDetailsAction} className="admin-form customer-profile-form"><input type="hidden" name="privacy_notice_version" value={PRIVACY_NOTICE_VERSION} /><FormField label="Full name"><Input name="full_name" required minLength={2} maxLength={120} defaultValue={details?.full_name || ""} /></FormField><div className="admin-form-grid"><FormField label="Phone"><Input name="phone" type="tel" required minLength={7} maxLength={30} defaultValue={details?.phone || ""} /></FormField><FormField label="Email"><Input name="email" type="email" required defaultValue={details?.email || profile.email || user.email || ""} /></FormField></div><FormField label="Delivery address"><Input name="address" required minLength={5} maxLength={500} defaultValue={details?.address || ""} /></FormField><div className="admin-form-grid"><FormField label="City"><Input name="city" maxLength={120} defaultValue={details?.city || ""} /></FormField><FormField label="State"><Input name="state" maxLength={120} defaultValue={details?.state || ""} /></FormField><FormField label="Pincode"><Input name="pincode" maxLength={20} defaultValue={details?.pincode || ""} /></FormField></div><label className="privacy-consent-row"><input name="privacy_consent" type="checkbox" required />I agree to the use of my details to save and use my customer profile under the <Link href="/privacy-policy">privacy notice</Link>.</label><FormSubmitButton pendingText="Saving details…">Save details <ArrowRight size={15} /></FormSubmitButton></form>
      </section>
      <section className="account-panel surface"><div className="account-panel-heading"><span><Package size={18} /></span><div><h2>Order history</h2><p>{orders.length} saved {orders.length === 1 ? "order" : "orders"}</p></div></div>
        {orders.length ? <div className="account-orders">{orders.map((order) => <details className="account-order" key={order.id}><summary><span><strong>{order.reference}</strong><small>{formatDate(order.created_at)} · {order.order_items?.length || 0} products</small></span><span className="account-order-meta"><span className={"status-badge status-" + order.status.toLowerCase().replaceAll(" ", "-")}>{order.status}</span><strong>{formatCurrency(Number(order.total))}</strong></span></summary><div className="account-order-details">{order.order_items?.map((item, index) => <p key={item.id || item.product_name + index}>{item.product_name} × {item.quantity}<strong>{formatCurrency(Number(item.line_total))}</strong></p>)}{order.discount_code && <p>Discount · {order.discount_code}<strong>−{formatCurrency(Number(order.discount_amount))}</strong></p>}<Link href="/cart">Shop again <ArrowRight size={14} /></Link></div></details>)}</div> : <div className="account-orders-empty"><Package size={23} /><p>Your orders will appear here.</p><Button variant="outline" size="sm" asChild><Link href="/products">Browse products</Link></Button></div>}
      </section>
    </div>
  </div></section>;
}

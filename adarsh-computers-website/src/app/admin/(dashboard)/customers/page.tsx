import { UserRound } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminBits";
import { getCustomerProfiles } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  const customers = await getCustomerProfiles();
  return <>
    <AdminPageHeader eyebrow="Customer accounts" title="Customers" description="Registered customer accounts from Supabase Auth. Passwords and authentication tokens are never exposed here." />
    <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">Registered customers</span><h2>{customers.length} accounts</h2></div></div>
      {customers.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Customer account</th><th>Profile ID</th><th>Registered</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td><div className="table-product"><span className="table-product-placeholder"><UserRound size={16} /></span><span><strong>{customer.email}</strong><small>Customer</small></span></div></td><td><code>{customer.id}</code></td><td>{formatDate(customer.created_at)}</td></tr>)}</tbody></table></div> : <div className="admin-empty">No registered customer accounts yet.</div>}
    </section>
  </>;
}

import Link from "next/link";
import { ArrowUpRight, Inbox, Layers3, Package, Plus, Sparkles } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminBits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function AdminOverviewPage() {
  const stats = await getDashboardStats();
  const cards = [
    { label: "Total products", value: stats.products, icon: Package, href: "/admin/products" },
    { label: "Active products", value: stats.activeProducts, icon: Sparkles, href: "/admin/products" },
    { label: "Total enquiries", value: stats.enquiries, icon: Inbox, href: "/admin/enquiries" },
    { label: "New enquiries", value: stats.newEnquiries, icon: Layers3, href: "/admin/enquiries" },
  ];
  return <>
    <AdminPageHeader eyebrow="Overview" title="Good to see you." description="A live snapshot of your catalogue and customer enquiries."><Button asChild><Link href="/admin/products?new=1#product-form"><Plus size={16} /> Add product</Link></Button></AdminPageHeader>
    {!stats.configured && <div className="admin-notice admin-notice-error">Database setup is not complete. Apply the additive migration at <code>supabase/migrations/202610300001_initial_business_schema.sql</code> in the Supabase SQL Editor, then refresh.</div>}
    <div className="stats-grid">{cards.map(({ label, value, icon: Icon, href }) => <Link href={href} key={label} className="stat-card"><span className="stat-icon"><Icon size={18} /></span><span className="stat-label">{label}</span><strong>{stats.configured ? value : "—"}</strong><span className="stat-link">View details <ArrowUpRight size={14} /></span></Link>)}</div>
    <div className="admin-dashboard-grid">
      <Card className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">Latest activity</span><h2>Recent enquiries</h2></div><Button variant="outline" size="sm" asChild><Link href="/admin/enquiries">All enquiries <ArrowUpRight size={14} /></Link></Button></div>
        {stats.recentEnquiries.length ? <div className="admin-activity-list">{stats.recentEnquiries.map((item) => <Link href="/admin/enquiries" className="admin-activity" key={item.id}><span className="activity-avatar">{item.name.slice(0, 1).toUpperCase()}</span><span className="activity-copy"><strong>{item.name}</strong><small>{item.interested_in || "General enquiry"} · {formatDate(item.created_at)}</small></span><span className={"status-badge status-" + item.status.toLowerCase().replaceAll(" ", "-")}>{item.status}</span></Link>)}</div> : <div className="admin-empty">New customer enquiries will appear here.</div>}
      </Card>
      <Card className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">Catalogue</span><h2>Recently added</h2></div><Button variant="outline" size="sm" asChild><Link href="/admin/products">All products <ArrowUpRight size={14} /></Link></Button></div>
        {stats.recentProducts.length ? <div className="admin-activity-list">{stats.recentProducts.map((item) => <Link href={"/admin/products?edit=" + item.id + "#product-form"} className="admin-activity" key={item.id}><span className="activity-avatar product-avatar"><Package size={15} /></span><span className="activity-copy"><strong>{item.name}</strong><small>{item.brand || "No brand"} · {formatDate(item.created_at)}</small></span><span className={item.is_published ? "status-badge status-published" : "status-badge status-draft"}>{item.is_published ? "Published" : "Draft"}</span></Link>)}</div> : <div className="admin-empty">Products you add will appear here.</div>}
      </Card>
    </div>
    <Card className="admin-category-summary"><div><span className="eyebrow">Category setup</span><h2>{stats.configured ? stats.categories + " categories" : "Catalogue setup pending"}</h2><p>Organize products so customers can browse them more easily.</p></div><Button variant="outline" asChild><Link href="/admin/categories">Manage categories <ArrowUpRight size={15} /></Link></Button></Card>
  </>;
}

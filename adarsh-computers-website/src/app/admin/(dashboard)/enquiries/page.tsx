import { ArrowUpRight, Inbox, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { AdminNotice, AdminPageHeader } from "@/components/admin/AdminBits";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { Button } from "@/components/ui/button";
import { updateEnquiryStatusAction, deleteEnquiryAction } from "@/lib/actions/admin";
import { getEnquiries } from "@/lib/data";
import type { Enquiry } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type SearchParams = Promise<{ notice?: string; error?: string; search?: string; status?: string; focus?: string }>;
export default async function AdminEnquiriesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const enquiries = await getEnquiries({ search: params.search, status: params.status });
  return <>
    <AdminPageHeader eyebrow="Customer conversations" title="Enquiries" description="Review incoming requests and update each enquiry as you follow up." />
    <AdminNotice notice={params.notice} error={params.error} />
    <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">Inbox</span><h2>{enquiries.length} enquiries</h2></div></div>
      <form method="get" className="admin-list-filters"><label className="admin-search-field"><Search size={16} /><input name="search" defaultValue={params.search || ""} placeholder="Search name, email, phone or message" /></label><select className="admin-select" name="status" defaultValue={params.status || "all"}><option value="all">All enquiry statuses</option><option value="unread">Unread</option><option>New</option><option>Read</option><option>Contacted</option><option>In Progress</option><option>Resolved</option></select><Button type="submit" variant="outline">Filter</Button><Button type="button" variant="ghost" asChild><Link href="/admin/enquiries">Clear</Link></Button></form>
      {enquiries.length ? <div className="admin-table-wrap"><table className="admin-table enquiry-table"><thead><tr><th>Enquiry ID</th><th>Customer</th><th>Subject</th><th>Message</th><th>Submitted</th><th>Status</th><th /></tr></thead><tbody>{enquiries.map((item: Enquiry) => <tr id={item.id} key={item.id} className={params.focus === item.id ? "admin-focus-row" : undefined}><td><code>{item.id.slice(0, 8)}</code></td><td><div className="customer-cell"><strong>{item.name}</strong><a href={"tel:" + item.phone}>{item.phone}</a>{item.email && <a href={"mailto:" + item.email}>{item.email}</a>}</div></td><td>{item.interested_in || "General enquiry"}</td><td><details className="message-details"><summary>Read message</summary><p>{item.message}</p></details></td><td>{formatDate(item.created_at)}</td><td><form action={updateEnquiryStatusAction} className="status-editor"><input type="hidden" name="id" value={item.id} /><select className="admin-select" name="status" defaultValue={item.status}><option>New</option><option>Unread</option><option>Read</option><option>Contacted</option><option>In Progress</option><option>Resolved</option><option>Completed</option></select><Button variant="outline" size="sm">Save</Button></form></td><td><ConfirmForm action={deleteEnquiryAction} message={"Delete the enquiry from " + item.name + "? This action cannot be undone."}><input type="hidden" name="id" value={item.id} /><Button variant="danger" size="icon" aria-label={"Delete enquiry from " + item.name}><Trash2 size={15} /></Button></ConfirmForm></td></tr>)}</tbody></table></div> : <div className="admin-empty"><span className="empty-icon"><Inbox size={21} /></span><strong>No enquiries match this filter.</strong><p>New requests from the public contact form will appear here.</p></div>}
    </section>
  </>;
}

import { ArrowUpRight, Inbox, Trash2 } from "lucide-react";
import { AdminNotice, AdminPageHeader } from "@/components/admin/AdminBits";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { Button } from "@/components/ui/button";
import { updateEnquiryStatusAction, deleteEnquiryAction } from "@/lib/actions/admin";
import { getEnquiries } from "@/lib/data";
import type { Enquiry } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type SearchParams = Promise<{ notice?: string; error?: string }>;
export default async function AdminEnquiriesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const enquiries = await getEnquiries();
  return <>
    <AdminPageHeader eyebrow="Customer conversations" title="Enquiries" description="Review incoming requests and update each enquiry as you follow up." />
    <AdminNotice notice={params.notice} error={params.error} />
    <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">Inbox</span><h2>{enquiries.length} enquiries</h2></div></div>
      {enquiries.length ? <div className="admin-table-wrap"><table className="admin-table enquiry-table"><thead><tr><th>Customer</th><th>Interested in</th><th>Message</th><th>Submitted</th><th>Status</th><th /></tr></thead><tbody>{enquiries.map((item: Enquiry) => <tr key={item.id}><td><div className="customer-cell"><strong>{item.name}</strong><a href={"tel:" + item.phone}>{item.phone}</a>{item.email && <a href={"mailto:" + item.email}>{item.email}</a>}</div></td><td>{item.interested_in || "General"}</td><td><details className="message-details"><summary>Read message</summary><p>{item.message}</p></details></td><td>{formatDate(item.created_at)}</td><td><form action={updateEnquiryStatusAction} className="status-editor"><input type="hidden" name="id" value={item.id} /><select className="admin-select" name="status" defaultValue={item.status}><option>New</option><option>Contacted</option><option>In Progress</option><option>Completed</option></select><Button variant="outline" size="sm">Save</Button></form></td><td><ConfirmForm action={deleteEnquiryAction} message={"Delete the enquiry from " + item.name + "? This action cannot be undone."}><input type="hidden" name="id" value={item.id} /><Button variant="danger" size="icon" aria-label={"Delete enquiry from " + item.name}><Trash2 size={15} /></Button></ConfirmForm></td></tr>)}</tbody></table></div> : <div className="admin-empty"><span className="empty-icon"><Inbox size={21} /></span><strong>No customer enquiries yet.</strong><p>New requests from the public contact form will appear here.</p></div>}
    </section>
  </>;
}

import Link from "next/link";
import { Search, ShieldCheck } from "lucide-react";
import { AdminNotice, AdminPageHeader } from "@/components/admin/AdminBits";
import { FormSubmitButton } from "@/components/ui/FormSubmitButton";
import { Button } from "@/components/ui/button";
import { updatePrivacyRequestAction } from "@/lib/actions/admin";
import { getPrivacyRequests } from "@/lib/data";
import type { PrivacyRequest } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type SearchParams = Promise<{ notice?: string; error?: string; status?: string; search?: string; focus?: string }>;

export default async function AdminPrivacyRequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const allRequests = await getPrivacyRequests();
  const term = (params.search || "").trim().toLowerCase();
  const requests = allRequests.filter((item) => {
    const matchesStatus = !params.status || params.status === "all" || item.status === params.status;
    const matchesSearch = !term || [item.full_name, item.email, item.request_type, item.details].some((value) => value.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });
  return <>
    <AdminPageHeader eyebrow="Customer privacy" title="Privacy requests" description="Review access, correction and deletion requests. Verify identity before you provide information or make account changes." />
    <AdminNotice notice={params.notice} error={params.error} />
    {params.error === "verify" && <div className="admin-notice admin-notice-error" role="alert">Verify the requester’s identity before marking a request in progress or complete.</div>}
    <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">Private inbox</span><h2>{requests.length} requests</h2></div><span className="privacy-admin-reminder"><ShieldCheck size={16} /> Verify identity before acting</span></div>
      <form method="get" className="admin-list-filters"><label className="admin-search-field"><Search size={16} /><input name="search" defaultValue={params.search || ""} placeholder="Search name, email or request" /></label><select className="admin-select" name="status" defaultValue={params.status || "all"}><option value="all">All statuses</option><option>Received</option><option>Identity check required</option><option>In progress</option><option>Completed</option><option>Unable to process</option></select><Button type="submit" variant="outline">Filter</Button><Button variant="ghost" asChild><Link href="/admin/privacy-requests">Clear</Link></Button></form>
      {requests.length ? <div className="admin-table-wrap"><table className="admin-table privacy-request-table"><thead><tr><th>Request</th><th>Contact</th><th>Details</th><th>Received</th><th>Review and update</th></tr></thead><tbody>{requests.map((item: PrivacyRequest) => <tr id={item.id} key={item.id} className={params.focus === item.id ? "admin-focus-row" : undefined}>
        <td><code>{item.id.slice(0, 8)}</code><strong className="privacy-type">{item.request_type}</strong><span className="status-badge">{item.status}</span></td>
        <td><strong>{item.full_name}</strong><a href={`mailto:${item.email}`}>{item.email}</a></td>
        <td><p className="privacy-request-details">{item.details}</p>{item.admin_notes && <small className="privacy-request-admin-note">Staff note: {item.admin_notes}</small>}</td>
        <td>{formatDate(item.created_at)}{item.identity_verified_at && <small className="privacy-verified-label">Identity verified · {formatDate(item.identity_verified_at)}</small>}</td>
        <td><form action={updatePrivacyRequestAction} className="privacy-request-review-form"><input type="hidden" name="id" value={item.id} /><label className="privacy-verify-check"><input type="checkbox" name="identity_verified" defaultChecked={Boolean(item.identity_verified_at)} /> Identity verified</label><label className="privacy-status-label">Status<select className="admin-select" name="status" defaultValue={item.status}><option>Received</option><option>Identity check required</option><option>In progress</option><option>Completed</option><option>Unable to process</option></select></label><label className="privacy-status-label">Internal note<textarea name="admin_notes" maxLength={2000} defaultValue={item.admin_notes} placeholder="Avoid adding sensitive details" /></label><FormSubmitButton pendingText="Saving…">Save review</FormSubmitButton></form></td>
      </tr>)}</tbody></table></div> : <div className="admin-empty"><span className="empty-icon"><ShieldCheck size={20} /></span><strong>No requests match this filter.</strong><p>Submitted privacy requests will be held for authorized administrators here.</p></div>}
    </section>
  </>;
}

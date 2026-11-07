import { KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminBits";
import { getProfiles } from "@/lib/data";
import type { Profile } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default async function AdminUsersPage() {
  const profiles = await getProfiles();
  const administrators = profiles.filter((profile) => ["owner", "admin", "editor"].includes(profile.role));
  return <>
    <AdminPageHeader eyebrow="Access control" title="Admin users" description="Review accounts with access to the management workspace." />
    <div className="admin-notice admin-notice-success"><ShieldCheck size={17} /> Administrator registration is not available from the website. Accounts and roles are provisioned by the project owner through Supabase.</div>
    <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">Authorized profiles</span><h2>{administrators.length} administrators</h2></div></div>
      {administrators.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Account</th><th>Role</th><th>Created</th></tr></thead><tbody>{administrators.map((profile: Profile) => <tr key={profile.id}><td><div className="table-product"><span className="table-product-placeholder"><UserRound size={16} /></span><span><strong>{profile.email}</strong><small>{profile.id}</small></span></div></td><td><span className="status-badge status-published">{profile.role}</span></td><td>{formatDate(profile.created_at)}</td></tr>)}</tbody></table></div> : <div className="admin-empty">No administrator profiles are available. Apply the database migration and create the initial owner account using the setup guide.</div>}
    </section>
    <section className="admin-setup-note"><span className="setup-note-icon"><KeyRound size={20} /></span><div><strong>Need to add or change an administrator?</strong><p>Use the trusted setup instructions in the project README. Roles cannot be granted from a public form or an unauthenticated request.</p></div></section>
  </>;
}

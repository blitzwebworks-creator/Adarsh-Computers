import Link from "next/link";
import { ArrowUpRight, Plus, Tag, Trash2 } from "lucide-react";
import { AdminNotice, AdminPageHeader, FormField, StatusBadge } from "@/components/admin/AdminBits";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteDiscountCodeAction, saveDiscountCodeAction } from "@/lib/actions/admin";
import { getDiscountCodes } from "@/lib/data";
import type { DiscountCode } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Discount codes" };
type SearchParams = Promise<{ edit?: string; notice?: string; error?: string }>;
function dateTimeLocal(value: string | null) { if (!value) return ""; const date = new Date(value); date.setMinutes(date.getMinutes() + 330); return date.toISOString().slice(0, 16); }

export default async function AdminDiscountsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const codes = await getDiscountCodes();
  const editing = params.edit ? codes.find((code) => code.id === params.edit) || null : null;
  return <>
    <AdminPageHeader eyebrow="Promotions" title="Discount codes" description="Create limited, time-bound offers. Each order revalidates the discount against live prices and current usage." />
    <AdminNotice notice={params.notice} error={params.error} />
    <div className="admin-two-column">
      <section className="admin-panel surface" id="discount-form"><div className="admin-panel-heading"><div><span className="eyebrow">{editing ? "Edit code" : "New code"}</span><h2>{editing ? editing.code : "Create a discount"}</h2></div>{editing && <Button variant="ghost" size="sm" asChild><Link href="/admin/discounts#discount-form">Cancel</Link></Button>}</div>
        <form action={saveDiscountCodeAction} className="admin-form"><input type="hidden" name="id" value={editing?.id || ""} />
          <FormField label="Code"><Input name="code" required minLength={3} maxLength={30} defaultValue={editing?.code || ""} placeholder="WELCOME10" autoCapitalize="characters" /></FormField>
          <div className="admin-form-grid"><FormField label="Discount type"><select className="admin-select" name="discount_type" defaultValue={editing?.discount_type || "percentage"}><option value="percentage">Percentage</option><option value="fixed">Fixed amount (INR)</option></select></FormField><FormField label="Discount amount"><Input name="amount" type="number" min="0.01" step="0.01" required defaultValue={editing?.amount ?? ""} /></FormField></div>
          <FormField label="Minimum product subtotal (INR)"><Input name="minimum_subtotal" type="number" min="0" step="0.01" defaultValue={editing?.minimum_subtotal ?? 0} /></FormField>
          <div className="admin-form-grid"><FormField label="Maximum discount (optional)"><Input name="maximum_discount" type="number" min="0.01" step="0.01" defaultValue={editing?.maximum_discount ?? ""} /></FormField><FormField label="Usage limit (optional)"><Input name="usage_limit" type="number" min="1" step="1" defaultValue={editing?.usage_limit ?? ""} /></FormField></div>
          <div className="admin-form-grid"><FormField label="Starts at (optional)"><Input name="starts_at" type="datetime-local" defaultValue={dateTimeLocal(editing?.starts_at || null)} /></FormField><FormField label="Ends at (optional)"><Input name="ends_at" type="datetime-local" defaultValue={dateTimeLocal(editing?.ends_at || null)} /></FormField></div>
          <label className="admin-checkbox-label"><input type="checkbox" name="is_active" defaultChecked={editing?.is_active ?? true} /> Code is active</label>
          <Button type="submit"><Plus size={15} /> {editing ? "Save code" : "Create code"}</Button>
        </form>
      </section>
      <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">Offers</span><h2>{codes.length} discount codes</h2></div></div>
        {codes.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Code</th><th>Offer</th><th>Usage</th><th>Status</th><th>End date</th><th /></tr></thead><tbody>{codes.map((code: DiscountCode) => <tr key={code.id}><td><strong>{code.code}</strong></td><td>{code.discount_type === "percentage" ? `${code.amount}%` : formatCurrency(Number(code.amount))}{code.minimum_subtotal > 0 && <small className="discount-condition"> on orders over {formatCurrency(Number(code.minimum_subtotal))}</small>}</td><td>{code.used_count}{code.usage_limit ? ` / ${code.usage_limit}` : " uses"}</td><td><StatusBadge>{code.is_active ? "Active" : "Disabled"}</StatusBadge></td><td>{code.ends_at ? formatDate(code.ends_at) : "No expiry"}</td><td><div className="table-actions"><Button variant="outline" size="sm" asChild><Link href={"/admin/discounts?edit=" + code.id + "#discount-form"}>Edit <ArrowUpRight size={13} /></Link></Button><ConfirmForm action={deleteDiscountCodeAction} message={`Delete discount code ${code.code}? It will no longer apply to new orders.`}><input type="hidden" name="id" value={code.id} /><Button variant="danger" size="icon" aria-label={"Delete " + code.code}><Trash2 size={15} /></Button></ConfirmForm></div></td></tr>)}</tbody></table></div> : <div className="admin-empty"><span className="empty-icon"><Tag size={22} /></span><strong>No discount codes yet.</strong><p>Create a code to make it available to customers at checkout.</p></div>}
      </section>
    </div>
  </>;
}

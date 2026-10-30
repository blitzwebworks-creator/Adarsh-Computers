import Link from "next/link";
import { MessageSquareQuote, Plus, Trash2 } from "lucide-react";
import { AdminNotice, AdminPageHeader, FormField } from "@/components/admin/AdminBits";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteTestimonialAction, saveTestimonialAction } from "@/lib/actions/admin";
import { getTestimonials } from "@/lib/data";
import type { Testimonial } from "@/lib/types";

type SearchParams = Promise<{ edit?: string; notice?: string; error?: string }>;
export default async function AdminTestimonialsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const testimonials = await getTestimonials(true);
  const editing = testimonials.find((item) => item.id === params.edit) || null;
  return <>
    <AdminPageHeader eyebrow="Customer feedback" title="Testimonials" description="Publish customer comments only after you have permission to share them." />
    <AdminNotice notice={params.notice} error={params.error} />
    <div className="admin-two-column">
      <section className="admin-panel surface" id="testimonial-form"><div className="admin-panel-heading"><div><span className="eyebrow">{editing ? "Edit testimonial" : "New testimonial"}</span><h2>{editing ? "Update comment" : "Add feedback"}</h2></div>{editing && <Button variant="ghost" size="sm" asChild><Link href="/admin/testimonials#testimonial-form">Cancel</Link></Button>}</div>
        <form action={saveTestimonialAction} className="admin-form"><input type="hidden" name="id" value={editing?.id || ""} />
          <FormField label="Customer name"><Input name="customer_name" required minLength={2} maxLength={120} defaultValue={editing?.customer_name || ""} /></FormField>
          <FormField label="Company or role (optional)"><Input name="company" maxLength={120} defaultValue={editing?.company || ""} /></FormField>
          <FormField label="Customer comment"><Textarea name="quote" required minLength={10} maxLength={2000} defaultValue={editing?.quote || ""} /></FormField>
          <FormField label="Rating (optional)"><select className="admin-select" name="rating" defaultValue={editing?.rating || ""}><option value="">No rating</option><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select></FormField>
          <label className="admin-checkbox-label"><input type="checkbox" name="is_published" defaultChecked={editing?.is_published || false} /> Publish this testimonial</label>
          <Button type="submit"><Plus size={15} /> {editing ? "Save testimonial" : "Add testimonial"}</Button>
        </form>
      </section>
      <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">Published feedback</span><h2>{testimonials.length} testimonials</h2></div></div>
        {testimonials.length ? <div className="admin-item-list">{testimonials.map((item: Testimonial) => <article className="admin-testimonial-row" key={item.id}><span className="admin-item-thumb item-thumb-empty"><MessageSquareQuote size={18} /></span><div className="admin-item-copy"><strong>{item.customer_name}{item.company ? " · " + item.company : ""}</strong><small>{item.is_published ? "Published" : "Draft"}{item.rating ? " · " + item.rating + " / 5" : ""}</small><p>{item.quote}</p></div><div className="table-actions"><Button variant="outline" size="sm" asChild><Link href={"/admin/testimonials?edit=" + item.id + "#testimonial-form"}>Edit</Link></Button><ConfirmForm action={deleteTestimonialAction} message={"Delete testimonial from " + item.customer_name + "? This action cannot be undone."}><input type="hidden" name="id" value={item.id} /><Button variant="danger" size="icon" aria-label={"Delete testimonial from " + item.customer_name}><Trash2 size={15} /></Button></ConfirmForm></div></article>)}</div> : <div className="admin-empty">No testimonials yet. Add only real customer feedback that you have permission to publish.</div>}
      </section>
    </div>
  </>;
}

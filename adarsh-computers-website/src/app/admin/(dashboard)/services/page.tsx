import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Plus, Trash2, Wrench } from "lucide-react";
import { AdminNotice, AdminPageHeader, FormField } from "@/components/admin/AdminBits";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { ImagePicker } from "@/components/site/ImagePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteServiceAction, saveServiceAction } from "@/lib/actions/admin";
import { getServices } from "@/lib/data";
import type { Service } from "@/lib/types";

type SearchParams = Promise<{ edit?: string; notice?: string; error?: string }>;
export default async function AdminServicesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const services = await getServices(true);
  const editing = services.find((service) => service.id === params.edit) || null;
  return <>
    <AdminPageHeader eyebrow="Offerings" title="Services" description="Manage the service information shown on your public website." />
    <AdminNotice notice={params.notice} error={params.error} />
    <div className="admin-two-column">
      <section className="admin-panel surface" id="service-form"><div className="admin-panel-heading"><div><span className="eyebrow">{editing ? "Edit service" : "New service"}</span><h2>{editing ? "Update service" : "Add a service"}</h2></div>{editing && <Button variant="ghost" size="sm" asChild><Link href="/admin/services#service-form">Cancel</Link></Button>}</div>
        <form action={saveServiceAction} className="admin-form" encType="multipart/form-data"><input type="hidden" name="id" value={editing?.id || ""} /><input type="hidden" name="existing_image" value={editing?.image_url || ""} />
          <FormField label="Service name"><Input name="name" required minLength={2} maxLength={160} defaultValue={editing?.name || ""} placeholder="What service do you offer?" /></FormField>
          <FormField label="Description"><Textarea name="description" maxLength={4000} defaultValue={editing?.description || ""} placeholder="Describe the service clearly." /></FormField>
          <div className="admin-form-grid"><FormField label="Sort order"><Input name="sort_order" type="number" defaultValue={editing?.sort_order ?? 0} /></FormField><FormField label="Service image"><ImagePicker folder="services" currentImage={editing?.image_url} /></FormField></div>
          <label className="admin-checkbox-label"><input type="checkbox" name="is_published" defaultChecked={editing?.is_published || false} /> Publish this service</label>
          <Button type="submit"><Plus size={15} /> {editing ? "Save service" : "Add service"}</Button>
        </form>
      </section>
      <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">Website services</span><h2>{services.length} services</h2></div></div>
        {services.length ? <div className="admin-item-list">{services.map((service: Service) => <article className="admin-item-row" key={service.id}>{service.image_url ? <Image src={service.image_url} alt="" width={42} height={42} unoptimized className="admin-item-thumb" /> : <span className="admin-item-thumb item-thumb-empty"><Wrench size={18} /></span>}<div className="admin-item-copy"><strong>{service.name}</strong><small>{service.is_published ? "Published" : "Draft"}</small></div><div className="table-actions"><Button variant="outline" size="sm" asChild><Link href={"/admin/services?edit=" + service.id + "#service-form"}>Edit</Link></Button><ConfirmForm action={deleteServiceAction} message={"Delete service “" + service.name + "”? This action cannot be undone."}><input type="hidden" name="id" value={service.id} /><Button variant="danger" size="icon" aria-label={"Delete " + service.name}><Trash2 size={15} /></Button></ConfirmForm></div></article>)}</div> : <div className="admin-empty">Add a service when you are ready to publish details.</div>}
      </section>
    </div>
  </>;
}



import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Plus, Trash2 } from "lucide-react";
import { AdminNotice, AdminPageHeader, FormField } from "@/components/admin/AdminBits";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { ImagePicker } from "@/components/site/ImagePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteCategoryAction, saveCategoryAction } from "@/lib/actions/admin";
import { getCategories } from "@/lib/data";
import type { Category } from "@/lib/types";

type SearchParams = Promise<{ edit?: string; notice?: string; error?: string }>;
export default async function AdminCategoriesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const categories = await getCategories(true);
  const editing = categories.find((category) => category.id === params.edit) || null;
  return <>
    <AdminPageHeader eyebrow="Catalogue structure" title="Categories" description="Keep the catalogue easy to browse and manage category visibility." />
    <AdminNotice notice={params.notice} error={params.error} />
    <div className="admin-two-column">
      <section className="admin-panel surface" id="category-form"><div className="admin-panel-heading"><div><span className="eyebrow">{editing ? "Edit category" : "New category"}</span><h2>{editing ? "Update category" : "Add a category"}</h2></div>{editing && <Button variant="ghost" size="sm" asChild><Link href="/admin/categories#category-form">Cancel</Link></Button>}</div>
        <form action={saveCategoryAction} className="admin-form" encType="multipart/form-data"><input type="hidden" name="id" value={editing?.id || ""} /><input type="hidden" name="existing_image" value={editing?.image_url || ""} />
          <FormField label="Category name"><Input name="name" required minLength={2} maxLength={100} defaultValue={editing?.name || ""} placeholder="For example, monitors" /></FormField>
          <FormField label="Description"><Textarea name="description" maxLength={600} defaultValue={editing?.description || ""} placeholder="A short description for customers." /></FormField>
          <div className="admin-form-grid"><FormField label="Sort order"><Input name="sort_order" type="number" defaultValue={editing?.sort_order ?? 0} /></FormField><div className="admin-field"><span>Category image</span><ImagePicker currentImage={editing?.image_url} /></div></div>
          <label className="admin-checkbox-label"><input type="checkbox" name="is_active" defaultChecked={editing?.is_active ?? true} /> Show this category on the website</label>
          <Button type="submit"><Plus size={15} /> {editing ? "Save category" : "Add category"}</Button>
        </form>
      </section>
      <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">Browse structure</span><h2>{categories.length} categories</h2></div></div>
        {categories.length ? <div className="admin-item-list">{categories.map((category: Category) => <article className="admin-item-row" key={category.id}>{category.image_url ? <Image src={category.image_url} alt="" width={42} height={42} unoptimized className="admin-item-thumb" /> : <span className="admin-item-thumb item-thumb-empty">{category.name.slice(0, 1)}</span>}<div className="admin-item-copy"><strong>{category.name}</strong><small>/{category.slug} · {category.is_active ? "Visible" : "Hidden"}</small></div><div className="table-actions"><Button variant="outline" size="sm" asChild><Link href={"/admin/categories?edit=" + category.id + "#category-form"}>Edit</Link></Button><ConfirmForm action={deleteCategoryAction} message={"Delete category “" + category.name + "”? Products in it will remain and become uncategorized."}><input type="hidden" name="id" value={category.id} /><Button variant="danger" size="icon" aria-label={"Delete " + category.name}><Trash2 size={15} /></Button></ConfirmForm></div></article>)}</div> : <div className="admin-empty">Categories will show here after the database migration is applied.</div>}
      </section>
    </div>
  </>;
}



import { randomUUID } from "node:crypto";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Plus, Search, Trash2 } from "lucide-react";
import { AdminNotice, AdminPageHeader, FormField } from "@/components/admin/AdminBits";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { ImagePicker } from "@/components/site/ImagePicker";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/ui/FormSubmitButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteProductAction, saveProductAction } from "@/lib/actions/admin";
import { getCategories, getProduct, getProducts } from "@/lib/data";
import type { Product } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

type SearchParams = Promise<{ edit?: string; notice?: string; error?: string }>;
export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [products, categories, editing] = await Promise.all([getProducts({ admin: true }), getCategories(true), params.edit ? getProduct(params.edit, true) : Promise.resolve(null)]);
  const newProductId = editing?.id || randomUUID();
  return <>
    <AdminPageHeader eyebrow="Catalogue" title="Products" description="Create and publish the products customers can browse on your website."><Button variant="outline" asChild><Link href="/products" target="_blank" rel="noreferrer">View catalogue <ArrowUpRight size={15} /></Link></Button></AdminPageHeader>
    <AdminNotice notice={params.notice} error={params.error} />
    <div className="admin-two-column">
      <section className="admin-panel surface" id="product-form"><div className="admin-panel-heading"><div><span className="eyebrow">{editing ? "Edit listing" : "New listing"}</span><h2>{editing ? "Update product" : "Add a product"}</h2></div>{editing && <Button variant="ghost" size="sm" asChild><Link href="/admin/products#product-form">Cancel edit</Link></Button>}</div>
        <form action={saveProductAction} className="admin-form" encType="multipart/form-data">
          <input type="hidden" name="id" value={newProductId} />
          <FormField label="Product name"><Input name="name" required minLength={2} maxLength={160} defaultValue={editing?.name || ""} placeholder="Enter a product name" /></FormField>
          <div className="admin-form-grid"><FormField label="Brand"><Input name="brand" maxLength={100} defaultValue={editing?.brand || ""} placeholder="Brand" /></FormField><FormField label="Category"><select className="admin-select" name="category_id" defaultValue={editing?.category_id || ""}><option value="">Select a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></FormField></div>
          <FormField label="Description"><Textarea name="description" maxLength={4000} defaultValue={editing?.description || ""} placeholder="Share the useful product details." /></FormField>
          <div className="admin-form-grid"><FormField label="Price (INR, optional)"><Input name="price" type="number" min="0" max="9999999999.99" step="0.01" defaultValue={editing?.price ?? ""} placeholder="Leave blank to quote on enquiry" /></FormField><FormField label="Compare-at price (optional)" hint="Requires a product price and must be higher than it."><Input name="compare_at_price" type="number" min="0" max="9999999999.99" step="0.01" defaultValue={editing?.compare_at_price ?? ""} placeholder="Original price for a discount display" /></FormField></div>
          <div className="admin-form-grid"><FormField label="Availability"><select className="admin-select" name="availability" defaultValue={editing?.availability || "Contact for availability"}><option>In stock</option><option>Available to order</option><option>Contact for availability</option><option>Out of stock</option></select></FormField><FormField label="Stock quantity (optional)" hint="Leave blank if stock is not tracked. Enter 0 to prevent orders for this item."><Input name="stock_quantity" type="number" min="0" max="1000000" step="1" defaultValue={editing?.stock_quantity ?? ""} placeholder="Not tracked" /></FormField></div>
          <div className="admin-field"><span>Product image</span><ImagePicker folder="products" currentImage={editing?.image_url} /></div>
          <FormField label="Additional product image URLs" hint="Paste up to 8 public business-media URLs from Supabase Storage, one per line."><Textarea name="image_urls" rows={3} defaultValue={(editing?.image_urls || []).join("\n")} placeholder="https://…supabase.co/storage/v1/object/public/business-media/products/..." /></FormField>
          <FormField label="Technical specifications" hint="Enter one item per line in Label: Value format."><Textarea name="specifications" rows={4} defaultValue={Object.entries(editing?.specifications || {}).map(([key, value]) => `${key}: ${value}`).join("\n")} placeholder={'Memory: 8 GB GDDR6\nCooling: Dual fan'} /></FormField>
          <div className="admin-checkbox-row"><label><input type="checkbox" name="is_published" defaultChecked={editing ? editing.is_published : true} /> Publish on website</label><label><input type="checkbox" name="is_featured" defaultChecked={editing?.is_featured || false} /> Feature on homepage</label></div>
          <FormSubmitButton pendingText={editing ? "Saving product…" : "Adding product…"}><Plus size={15} /> {editing ? "Save product" : "Add product"}</FormSubmitButton>
        </form>
      </section>
      <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">Inventory</span><h2>{products.length} products</h2></div></div>
        {products.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Website status</th><th>Availability</th><th>Stock</th><th>Price</th><th>Added</th><th /></tr></thead><tbody>{products.map((product: Product) => <tr key={product.id}><td><div className="table-product">{product.image_url ? <Image src={product.image_url} alt="" width={42} height={42} /> : <span className="table-product-placeholder"><Search size={16} /></span>}<span><strong>{product.name}</strong><small>{product.brand || "No brand"} · {product.categories?.name || "Uncategorized"}</small></span></div></td><td><span className={product.is_published ? "status-badge status-published" : "status-badge status-draft"}>{product.is_published ? "Published" : "Draft"}</span></td><td>{product.stock_quantity === 0 ? "Out of stock" : product.availability}</td><td>{product.stock_quantity === null ? "Not tracked" : product.stock_quantity}</td><td>{formatCurrency(product.price) || "On enquiry"}</td><td>{formatDate(product.created_at)}</td><td><div className="table-actions"><Button variant="outline" size="sm" asChild><Link href={"/admin/products?edit=" + product.id + "#product-form"}>Edit</Link></Button><ConfirmForm action={deleteProductAction} message={"Delete “" + product.name + "”? This also removes its stored image."}><input type="hidden" name="id" value={product.id} /><Button variant="danger" size="icon" aria-label={"Delete " + product.name}><Trash2 size={15} /></Button></ConfirmForm></div></td></tr>)}</tbody></table></div> : <div className="admin-empty">There are no products yet. Add a product when you are ready to publish real inventory.</div>}
      </section>
    </div>
  </>;
}


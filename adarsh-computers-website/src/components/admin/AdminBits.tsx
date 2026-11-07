import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminPageHeader({ eyebrow, title, description, children }: { eyebrow: string; title: string; description?: string; children?: ReactNode }) {
  return <div className="admin-page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{children && <div className="admin-header-actions">{children}</div>}</div>;
}

export function AdminNotice({ notice, error }: { notice?: string; error?: string }) {
  const productErrors: Record<string, string> = {
    name: "Enter a product name between 2 and 160 characters.",
    brand: "Brand must be 100 characters or fewer.",
    description: "Description must be 4,000 characters or fewer.",
    category: "The selected category is no longer valid. Choose a category again or leave it uncategorized.",
    price: "Enter a valid price from ₹0 to ₹9,999,999,999.99, or leave it blank for enquiry pricing.",
    compare_price: "Compare-at price must be greater than the product price. Add a product price first, or leave compare-at blank.",
    stock: "Stock must be a whole number between 0 and 1,000,000, or left blank when it is not tracked.",
    availability: "Choose one of the listed availability options.",
    gallery_count: "Use no more than 8 additional image URLs.",
    gallery_url: "Additional images must be public URLs from this project's business-media storage bucket.",
    specifications_count: "Add no more than 30 specification lines.",
    specifications_format: "Each specification needs a label and value, for example: Memory: 8 GB.",
    id: "This product form has expired. Refresh the page and try again.",
  };
  const text = notice === "saved" ? "Changes saved." : notice === "note" ? "Internal order note added." : notice === "payment" ? "Payment information saved." : notice === "order-deleted" ? "Order deleted. Its items, notes, status history and notification were removed too." : notice === "saved-basic" ? "Product saved. Run migration 202610300002_store_orders_customers.sql to enable stock counts, compare-at prices, image galleries and specifications." : notice === "deleted" ? "Item deleted." : error === "order-delete" ? "Order could not be deleted. Apply the admin order deletion migration and try again." : error === "image" ? "Image upload failed. Confirm the Storage migration, accepted image type and 5 MB limit, then try again." : error === "note" ? "The internal order note could not be saved. Apply the order management migration and try again." : error === "payment" ? "Payment details could not be saved. Apply the order management migration and try again." : error === "validation" ? "Check the product name and supported field limits, then try again." : error && productErrors[error] ? productErrors[error] : error === "save" ? "Product could not be saved. Check that the database migration is applied and the admin role has products table access." : error === "delete" ? "Item could not be deleted. Check whether another record depends on it and try again." : error ? "The change could not be completed. Review the database setup and try again." : "";
  if (!text) return null;
  return <div className={cn("admin-notice", error ? "admin-notice-error" : "admin-notice-success")} role="status">{text}</div>;
}

export function StatusBadge({ children }: { children: ReactNode }) {
  return <span className={"status-badge status-" + String(children).toLowerCase().replaceAll(" ", "-")}>{children}</span>;
}

export function FormField({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="admin-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

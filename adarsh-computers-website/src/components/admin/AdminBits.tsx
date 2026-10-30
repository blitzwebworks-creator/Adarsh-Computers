import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminPageHeader({ eyebrow, title, description, children }: { eyebrow: string; title: string; description?: string; children?: ReactNode }) {
  return <div className="admin-page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{children && <div className="admin-header-actions">{children}</div>}</div>;
}

export function AdminNotice({ notice, error }: { notice?: string; error?: string }) {
  const text = notice === "saved" ? "Changes saved." : notice === "saved-basic" ? "Product saved. Run migration 202610300002_store_orders_customers.sql to enable stock counts, compare-at prices, image galleries and specifications." : notice === "deleted" ? "Item deleted." : error === "image" ? "Image upload failed. Confirm the Storage migration and try again." : error === "validation" ? "Check the required fields and try again." : error === "save" ? "Product could not be saved. Check the admin role, products table permissions and Supabase logs." : error ? "The change could not be completed. Review the database setup and try again." : "";
  if (!text) return null;
  return <div className={cn("admin-notice", error ? "admin-notice-error" : "admin-notice-success")} role="status">{text}</div>;
}

export function StatusBadge({ children }: { children: ReactNode }) {
  return <span className={"status-badge status-" + String(children).toLowerCase().replaceAll(" ", "-")}>{children}</span>;
}

export function FormField({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="admin-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireAdmin();
  return <AdminShell email={profile.email}>{children}</AdminShell>;
}

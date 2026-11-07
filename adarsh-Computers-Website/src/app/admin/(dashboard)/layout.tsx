import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { getAdminNotificationUnreadCount, getAdminNotifications } from "@/lib/data";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireAdmin();
  const [notifications, unreadCount] = await Promise.all([getAdminNotifications(20), getAdminNotificationUnreadCount()]);
  return <AdminShell email={profile.email} notifications={notifications} unreadCount={unreadCount}>{children}</AdminShell>;
}

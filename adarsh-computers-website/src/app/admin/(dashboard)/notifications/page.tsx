import { AdminPageHeader } from "@/components/admin/AdminBits";
import { NotificationHistory } from "@/components/admin/NotificationHistory";
import { getAdminNotifications } from "@/lib/data";

export const metadata = { title: "Notifications" };

export default async function AdminNotificationsPage() {
  const notifications = await getAdminNotifications(100);
  return <><AdminPageHeader eyebrow="Admin inbox" title="Notifications" description="Internal notifications for new orders and customer enquiries." /><NotificationHistory initialItems={notifications} /></>;
}

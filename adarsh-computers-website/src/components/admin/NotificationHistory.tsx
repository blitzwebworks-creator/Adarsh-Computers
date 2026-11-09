"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Inbox } from "lucide-react";
import { toast } from "sonner";
import { markAdminNotificationRead, markAllAdminNotificationsRead } from "@/lib/actions/admin";
import type { AdminNotification } from "@/lib/types";
import { Button } from "@/components/ui/button";

function destination(item: AdminNotification) {
  if (item.type === "order") return `/admin/orders/${item.reference_id}`;
  if (item.type === "privacy_request") return `/admin/privacy-requests?focus=${encodeURIComponent(item.reference_id)}#${item.reference_id}`;
  return `/admin/enquiries?focus=${encodeURIComponent(item.reference_id)}#${item.reference_id}`;
}

export function NotificationHistory({ initialItems }: { initialItems: AdminNotification[] }) {
  const [items, setItems] = useState(initialItems);
  useEffect(() => setItems(initialItems), [initialItems]);
  const unreadCount = items.filter((item) => !item.is_read).length;

  async function markRead(id: string) {
    const result = await markAdminNotificationRead(id);
    if (!result.success) { toast.error("This notification could not be updated."); return; }
    setItems((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item));
  }

  async function markAllRead() {
    const result = await markAllAdminNotificationsRead();
    if (!result.success) { toast.error("Notifications could not be updated."); return; }
    setItems((current) => current.map((item) => ({ ...item, is_read: true })));
  }

  return <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">Internal activity</span><h2>{items.length} notifications · {unreadCount} unread</h2></div><Button variant="outline" onClick={() => void markAllRead()} disabled={!unreadCount}><CheckCheck size={15} /> Mark all read</Button></div>
    {items.length ? <div className="notification-history-list">{items.map((item) => <article key={item.id} className={`notification-history-row${item.is_read ? " is-read" : ""}`}><span className="notification-history-icon">{item.type === "order" ? <Bell size={17} /> : <Inbox size={17} />}</span><div className="notification-history-copy"><strong>{item.title}</strong><p>{item.message}</p><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time></div><div className="notification-history-actions"><Link className="text-link" href={destination(item)}>{item.type === "order" ? "View order" : "View enquiry"}</Link>{!item.is_read && <Button type="button" size="icon" variant="ghost" aria-label="Mark notification as read" onClick={() => void markRead(item.id)}><Check size={16} /></Button>}</div></article>)}</div> : <div className="admin-empty">There are no notifications yet. New orders and enquiries will appear here automatically.</div>}
  </section>;
}

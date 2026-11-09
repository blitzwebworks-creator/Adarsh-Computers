"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Circle, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { markAdminNotificationRead, markAllAdminNotificationsRead } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/client";
import type { AdminNotification } from "@/lib/types";

type LiveStatus = "connecting" | "live" | "polling";

function notificationHref(item: AdminNotification) {
  if (item.type === "order") return `/admin/orders/${item.reference_id}`;
  if (item.type === "privacy_request") return `/admin/privacy-requests?focus=${encodeURIComponent(item.reference_id)}#${item.reference_id}`;
  return `/admin/enquiries?focus=${encodeURIComponent(item.reference_id)}#${item.reference_id}`;
}

export function AdminLiveCenter({ initialNotifications, initialUnread }: { initialNotifications: AdminNotification[]; initialUnread: number | null }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnread ?? initialNotifications.filter((item) => !item.is_read).length);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const seenIds = useRef(new Set(initialNotifications.map((item) => item.id)));
  const unread = unreadCount;

  useEffect(() => {
    setNotifications(initialNotifications);
    seenIds.current = new Set(initialNotifications.map((item) => item.id));
    if (initialUnread !== null) setUnreadCount(initialUnread);
  }, [initialNotifications, initialUnread]);

  const refresh = useCallback(() => router.refresh(), [router]);

  useEffect(() => {
    const supabase = createClient();
    let connected = false;
    const channel = supabase.channel("adarsh-admin-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "enquiries" }, refresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_notifications" }, (payload) => {
        const item = payload.new as AdminNotification;
        if (!item?.id || seenIds.current.has(item.id)) return;
        seenIds.current.add(item.id);
        setNotifications((current) => [item, ...current.filter((entry) => entry.id !== item.id)].slice(0, 50));
        if (!item.is_read) setUnreadCount((count) => count + 1);
        toast.success(item.title, { description: item.message });
        refresh();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "admin_notifications" }, (payload) => {
        const item = payload.new as AdminNotification;
        setNotifications((current) => current.map((entry) => entry.id === item.id ? item : entry));
        refresh();
      })
      .subscribe((nextStatus) => {
        connected = nextStatus === "SUBSCRIBED";
        setStatus(connected ? "live" : "polling");
      });

    const fallback = window.setInterval(() => {
      if (!connected) refresh();
    }, 30000);
    const visibility = () => { if (document.visibilityState === "visible" && !connected) refresh(); };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.clearInterval(fallback);
      document.removeEventListener("visibilitychange", visibility);
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  async function openNotification(item: AdminNotification) {
    if (!item.is_read) {
      const result = await markAdminNotificationRead(item.id);
      if (result.success) {
        setNotifications((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_read: true } : entry));
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    }
    setOpen(false);
    router.push(notificationHref(item));
  }

  async function markAllRead() {
    const result = await markAllAdminNotificationsRead();
    if (!result.success) { toast.error("Notifications could not be marked as read."); return; }
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);
  }

  const statusLabel = status === "live" ? "Live updates connected" : status === "connecting" ? "Connecting to live updates" : "Live updates unavailable; checking every 30 seconds";

  return <div className="admin-live-center">
    <span className={`admin-live-status admin-live-${status}`} title={statusLabel} aria-label={statusLabel}>
      {status === "connecting" ? <LoaderCircle size={14} className="spin" /> : <Circle size={9} fill="currentColor" />}
      <span>{status === "live" ? "Live" : status === "connecting" ? "Connecting" : "Polling"}</span>
    </span>
    <div className="admin-notification-wrap">
      <button className="admin-notification-trigger" type="button" aria-label={`Notifications, ${unread} unread`} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Bell size={18} />{unread > 0 && <span className="admin-notification-badge">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && <section className="admin-notification-popover" aria-label="Admin notifications">
        <div className="admin-notification-head"><div><strong>Notifications</strong><small>{unread} unread</small></div><button type="button" onClick={() => void markAllRead()} disabled={!unread} aria-label="Mark all notifications as read"><CheckCheck size={16} /></button></div>
        <div className="admin-notification-list">
          {notifications.length ? notifications.slice(0, 8).map((item) => <button type="button" className={`admin-notification-item${item.is_read ? " is-read" : ""}`} key={item.id} onClick={() => void openNotification(item)}><span className="admin-notification-item-dot" /><span><strong>{item.title}</strong><small>{item.message}</small><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time></span></button>) : <p className="admin-notification-empty">New orders and enquiries will appear here.</p>}
        </div>
        <Link className="admin-notification-all" href="/admin/notifications" onClick={() => setOpen(false)}>View notification history</Link>
      </section>}
    </div>
  </div>;
}

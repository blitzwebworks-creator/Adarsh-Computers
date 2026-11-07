import Link from "next/link";
import Image from "next/image";
import { signOutAction } from "@/lib/actions/auth";
import { LayoutDashboard, Package, Layers3, Wrench, Inbox, MessageSquareQuote, PanelsTopLeft, Settings2, Users, LogOut, ArrowUpRight, Menu, ShoppingBag, Tag, Bell, UserRound, MailOpen } from "lucide-react";
import { AdminLiveCenter } from "@/components/admin/AdminLiveCenter";
import type { AdminNotification } from "@/lib/types";

const navigation = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Layers3 },
  { href: "/admin/services", label: "Services", icon: Wrench },
  { href: "/admin/enquiries", label: "Enquiries", icon: Inbox },
  { href: "/admin/enquiries?status=unread", label: "Unread enquiries", icon: MailOpen },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/orders?status=new", label: "New orders", icon: ShoppingBag },
  { href: "/admin/orders?status=processing", label: "Processing orders", icon: ShoppingBag },
  { href: "/admin/orders?status=Shipped", label: "Shipped orders", icon: ShoppingBag },
  { href: "/admin/orders?status=Delivered", label: "Delivered orders", icon: ShoppingBag },
  { href: "/admin/orders?status=Cancelled", label: "Cancelled orders", icon: ShoppingBag },
  { href: "/admin/discounts", label: "Discount codes", icon: Tag },
  { href: "/admin/customers", label: "Customers", icon: UserRound },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/content", label: "Website content", icon: PanelsTopLeft },
  { href: "/admin/settings", label: "Business settings", icon: Settings2 },
  { href: "/admin/users", label: "Admin users", icon: Users },
];

export function AdminShell({ children, email, notifications, unreadCount }: { children: React.ReactNode; email: string; notifications: AdminNotification[]; unreadCount: number | null }) {
  return <div className="admin-layout">
    <aside className="admin-sidebar">
      <div className="admin-sidebar-head"><Link href="/" className="admin-brand"><Image src="/brand/adarsh-computers-logo.png" alt="" width={40} height={40} className="admin-brand-logo" /><span><strong>ADARSH</strong><small>ADMIN CONSOLE</small></span></Link>
        <details className="admin-mobile-menu"><summary aria-label="Open admin navigation"><Menu size={20} /></summary><nav>{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href}><Icon size={16} />{label}</Link>)}<form action={signOutAction}><button><LogOut size={16} /> Sign out</button></form></nav></details>
      </div>
      <div className="admin-sidebar-scroll"><div className="admin-sidebar-label">Workspace</div>
        <nav className="admin-nav">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href}><Icon size={17} /><span>{label}</span><ArrowUpRight size={13} className="admin-nav-arrow" /></Link>)}</nav>
      </div>
      <div className="admin-sidebar-bottom"><div className="admin-user-dot">{email.slice(0, 1).toUpperCase()}</div><div className="admin-user-meta"><strong>{email}</strong><small>Authorized administrator</small></div><form action={signOutAction}><button type="submit" className="admin-signout" aria-label="Sign out"><LogOut size={17} /></button></form></div>
    </aside>
    <div className="admin-main"><header className="admin-topbar"><div><span className="eyebrow">Adarsh Computers</span><strong>Management workspace</strong></div><div className="admin-topbar-actions"><AdminLiveCenter initialNotifications={notifications} initialUnread={unreadCount} /><Link href="/" target="_blank" rel="noreferrer">View website <ArrowUpRight size={15} /></Link><form action={signOutAction}><button type="submit" aria-label="Sign out"><LogOut size={16} /></button></form></div></header><main className="admin-content">{children}</main><footer className="admin-footer-credit"><span>Digital partner</span><a href="https://blitzwebwork.vercel.app/" target="_blank" rel="noopener noreferrer">BlitzWebWorks <ArrowUpRight size={12} /></a></footer></div>
  </div>;
}

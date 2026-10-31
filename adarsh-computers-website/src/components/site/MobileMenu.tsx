"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const links = [
  { href: "/products", label: "Products" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/account", label: "Customer account" },
  { href: "/admin/login", label: "Admin login" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return <div className={`mobile-menu${open ? " is-open" : ""}`} ref={rootRef}>
    <button
      className="mobile-menu-toggle"
      type="button"
      aria-label={open ? "Close navigation" : "Open navigation"}
      aria-expanded={open}
      aria-controls="public-mobile-navigation"
      onClick={() => setOpen((current) => !current)}
    >
      {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
    </button>
    <nav id="public-mobile-navigation" className="mobile-dropdown" aria-label="Mobile navigation" aria-hidden={!open}>
      {links.map((link) => <Link
        key={link.href}
        href={link.href}
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
      >{link.label}</Link>)}
    </nav>
  </div>;
}

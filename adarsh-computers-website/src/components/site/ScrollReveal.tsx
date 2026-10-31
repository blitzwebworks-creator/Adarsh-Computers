"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

const itemSelector = ".category-card, .product-card, .reason-item, .why-intro, .testimonial-card, .service-card, .about-copy, .about-panel, .contact-info, .contact-detail, .contact-form-card, .section-title-row, .page-hero-inner";

export function ScrollReveal({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const sections = [...root.children].filter((element): element is HTMLElement => element instanceof HTMLElement && element.tagName === "SECTION");
    const targets: HTMLElement[] = [];
    for (const section of sections) {
      const items = [...section.querySelectorAll<HTMLElement>(itemSelector)];
      if (items.length) targets.push(...items);
      else if (!section.classList.contains("hero-section") && !section.classList.contains("page-hero")) targets.push(section);
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const target = entry.target as HTMLElement;
        target.classList.add("scroll-reveal-visible");
        observer.unobserve(target);
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -36px 0px" });

    targets.forEach((target, index) => {
      target.style.setProperty("--scroll-reveal-delay", `${(index % 5) * 45}ms`);
      target.classList.add("scroll-reveal-item");
      observer.observe(target);
    });

    return () => observer.disconnect();
  }, [pathname]);

  return <div className="scroll-reveal-root" ref={rootRef}>{children}</div>;
}

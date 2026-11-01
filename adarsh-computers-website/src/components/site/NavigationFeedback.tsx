"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";

const navigationEvent = "adarsh:navigation-start";

export function announceNavigationStart() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(navigationEvent));
}

type OverlayState = "hidden" | "visible" | "leaving";

export function NavigationFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [progress, setProgress] = useState(false);
  const [overlay, setOverlay] = useState<OverlayState>("hidden");
  const pending = useRef(false);
  const previousRoute = useRef<string | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    revealTimer.current = null;
    safetyTimer.current = null;
  }, []);

  const finishNavigation = useCallback(() => {
    clearTimers();
    pending.current = false;
    setProgress(false);
    const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setOverlay((current) => current === "visible" && !reducedMotion ? "leaving" : "hidden");
  }, [clearTimers]);

  const beginNavigation = useCallback(() => {
    clearTimers();
    pending.current = true;
    setProgress(true);
    setOverlay((current) => current === "visible" ? "visible" : "hidden");
    revealTimer.current = setTimeout(() => {
      if (pending.current) setOverlay("visible");
    }, 300);
    // Clear feedback if a navigation is cancelled or an error prevents a route commit.
    safetyTimer.current = setTimeout(finishNavigation, 20000);
  }, [clearTimers, finishNavigation]);

  useEffect(() => {
    if (previousRoute.current === null) {
      previousRoute.current = routeKey;
      return;
    }
    if (previousRoute.current !== routeKey) {
      previousRoute.current = routeKey;
      finishNavigation();
    }
  }, [finishNavigation, routeKey]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      const anchor = target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      const current = new URL(window.location.href);
      if (destination.pathname === current.pathname && destination.search === current.search) return;
      beginNavigation();
    };
    const onAnnouncedNavigation = () => beginNavigation();
    const onPopState = () => beginNavigation();
    const onPageHide = () => finishNavigation();
    const onPageShow = () => finishNavigation();

    document.addEventListener("click", onClick, true);
    window.addEventListener(navigationEvent, onAnnouncedNavigation);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(navigationEvent, onAnnouncedNavigation);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      clearTimers();
    };
  }, [beginNavigation, clearTimers, finishNavigation]);

  return <>
    <div className={`navigation-progress${progress ? " is-active" : ""}`} aria-hidden="true"><span /></div>
    {overlay !== "hidden" && <div
      className={`navigation-loader navigation-loader-${overlay}`}
      role="status"
      aria-live="polite"
      aria-label="Getting things ready for you"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && overlay === "leaving") setOverlay("hidden");
      }}
    >
      <div className="navigation-loader-card">
        <div className="navigation-loader-brand" aria-label="Adarsh Computers">
          <Image src="/brand/adarsh-computers-logo.png" alt="" width={44} height={44} className="brand-logo" />
          <span className="brand-copy"><strong>ADARSH</strong><small>COMPUTERS</small></span>
        </div>
        <span className="navigation-loader-ring" aria-hidden="true"><i /></span>
        <strong className="navigation-loader-title">Getting things ready for you...</strong>
        <span className="navigation-loader-subtitle">Making Technology Work For You.</span>
      </div>
    </div>}
  </>;
}

"use client";

import { usePathname } from "next/navigation";
import { AccountSkeleton, CustomerAuthSkeleton } from "@/components/site/LoadingStates";

export function AccountRouteLoading() {
  const pathname = usePathname();
  return pathname === "/account" ? <AccountSkeleton /> : <CustomerAuthSkeleton />;
}

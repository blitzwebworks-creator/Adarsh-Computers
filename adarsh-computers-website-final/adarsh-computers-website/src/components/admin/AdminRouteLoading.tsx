"use client";

import { usePathname } from "next/navigation";
import { AdminDashboardSkeleton, AdminSectionSkeleton } from "@/components/site/LoadingStates";

export function AdminRouteLoading() {
  const pathname = usePathname();
  return pathname === "/admin" ? <AdminDashboardSkeleton /> : <AdminSectionSkeleton />;
}

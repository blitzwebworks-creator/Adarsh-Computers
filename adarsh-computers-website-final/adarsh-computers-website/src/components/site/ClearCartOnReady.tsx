"use client";

import { useEffect } from "react";
import { useCart } from "@/components/site/CartProvider";

export function ClearCartOnReady() {
  const { clearCart } = useCart();
  useEffect(() => { clearCart(); }, [clearCart]);
  return null;
}

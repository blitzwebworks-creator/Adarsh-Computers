"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/site/CartProvider";

export function CartButton() {
  const { itemCount, ready } = useCart();
  return <Link className="cart-header-button" href="/cart" aria-label={ready ? `Shopping cart, ${itemCount} items` : "Shopping cart"}>
    <ShoppingCart size={20} aria-hidden="true" />
    <span>Cart</span>
    <span className="cart-count" aria-live="polite">{ready ? itemCount : 0}</span>
  </Link>;
}

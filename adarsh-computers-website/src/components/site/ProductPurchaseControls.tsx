"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/site/CartProvider";
import { announceNavigationStart } from "@/components/site/NavigationFeedback";

export function ProductPurchaseControls({ productId, available, stockQuantity }: { productId: string; available: boolean; stockQuantity: number | null }) {
  const maxQuantity = stockQuantity === null ? 20 : Math.max(1, Math.min(20, stockQuantity));
  const [quantity, setQuantity] = useState(1);
  const [pending, startTransition] = useTransition();
  const pendingAction = useRef<"cart" | "checkout" | null>(null);
  const { addItem } = useCart();
  const router = useRouter();
  useEffect(() => { if (!pending) pendingAction.current = null; }, [pending]);

  function add(goToCheckout: boolean) {
    if (pending || !available) return;
    pendingAction.current = goToCheckout ? "checkout" : "cart";
    startTransition(() => {
      addItem(productId, quantity);
      if (goToCheckout) {
        announceNavigationStart();
        router.push("/checkout");
      }
    });
    if (!goToCheckout) toast.success("Added to your cart.");
  }

  return <div className="product-purchase-controls">
    <div className="quantity-control product-quantity" aria-label="Select quantity"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus size={15} /></button><span>{quantity}</span><button type="button" onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} disabled={quantity >= maxQuantity} aria-label="Increase quantity"><Plus size={15} /></button></div>
    <Button size="lg" onClick={() => add(false)} disabled={!available || pending} aria-busy={pending && pendingAction.current === "cart"}>{pending && pendingAction.current === "cart" ? <LoaderCircle className="spin" size={17} /> : <ShoppingCart size={17} />}{pending && pendingAction.current === "cart" ? "Adding to cart…" : "Add to cart"}</Button>
    <Button size="lg" variant="teal" onClick={() => add(true)} disabled={!available || pending} aria-busy={pending && pendingAction.current === "checkout"}>{pending && pendingAction.current === "checkout" ? <LoaderCircle className="spin" size={17} /> : <Zap size={16} />}{pending && pendingAction.current === "checkout" ? "Opening checkout…" : "Buy now"}</Button>
  </div>;
}

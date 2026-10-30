"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/site/CartProvider";

export function ProductPurchaseControls({ productId, available }: { productId: string; available: boolean }) {
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const { addItem } = useCart();
  const router = useRouter();

  function add(goToCheckout: boolean) {
    if (pending || !available) return;
    setPending(true);
    addItem(productId, quantity);
    if (goToCheckout) router.push("/checkout");
    else toast.success("Added to your cart.");
    window.setTimeout(() => setPending(false), 450);
  }

  return <div className="product-purchase-controls">
    <div className="quantity-control product-quantity" aria-label="Select quantity"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus size={15} /></button><span>{quantity}</span><button type="button" onClick={() => setQuantity((value) => Math.min(20, value + 1))} disabled={quantity >= 20} aria-label="Increase quantity"><Plus size={15} /></button></div>
    <Button size="lg" onClick={() => add(false)} disabled={!available || pending}><ShoppingCart size={17} />{pending ? "Adding…" : "Add to cart"}</Button>
    <Button size="lg" variant="lime" onClick={() => add(true)} disabled={!available || pending}><Zap size={16} />Buy now</Button>
  </div>;
}

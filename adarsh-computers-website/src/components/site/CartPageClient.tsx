"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/components/site/CartProvider";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { validateDiscountAction, type DiscountValidation } from "@/lib/actions/store";
import type { Product } from "@/lib/types";

export function CartPageClient() {
  const { items, ready, setQuantity, removeItem, clearCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState<DiscountValidation | null>(null);
  const [checkingDiscount, setCheckingDiscount] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!ready) return;
    if (items.length === 0) { setProducts([]); setLoadingProducts(false); return; }
    setLoadingProducts(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("products").select("id,name,brand,description,category_id,price,compare_at_price,availability,image_url,image_urls,specifications,is_published,is_featured,created_at,updated_at").in("id", items.map((item) => item.id)).eq("is_published", true);
    setProducts(error ? [] : (data || []) as unknown as Product[]);
    setLoadingProducts(false);
  }, [items, ready]);

  useEffect(() => { void loadProducts(); }, [loadProducts]);
  useEffect(() => { setDiscount(null); }, [items]);

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const subtotal = items.reduce((sum, item) => sum + Number(productMap.get(item.id)?.price || 0) * item.quantity, 0);
  const unavailable = ready && items.some((item) => {
    const product = productMap.get(item.id);
    return !product || product.price === null || product.availability === "Out of stock";
  });
  const discountAmount = discount?.valid ? Number(discount.discount_amount || 0) : 0;
  const total = Math.max(0, subtotal - discountAmount);

  async function applyDiscount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckingDiscount(true);
    const result = await validateDiscountAction(discountCode, items);
    setDiscount(result);
    if (result.valid && result.code) setDiscountCode(result.code);
    setCheckingDiscount(false);
  }

  if (!ready || loadingProducts) return <div className="store-loading" role="status"><span className="loading-spinner" /> Loading your cart…</div>;

  if (items.length === 0) return <section className="cart-empty surface"><span className="cart-empty-icon"><ShoppingBag size={25} /></span><h1>Your cart is waiting.</h1><p>Browse the catalogue and add the products you’d like to enquire about.</p><Button asChild><Link href="/products">Explore products <ArrowRight size={16} /></Link></Button></section>;

  return <div className="cart-layout">
    <section className="cart-items-panel surface" aria-label="Products in your cart">
      <div className="cart-heading"><div><span className="eyebrow">Your selection</span><h1>Your Cart <span>({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span></h1></div><Button variant="ghost" size="sm" onClick={clearCart}>Clear cart</Button></div>
      {unavailable && <p className="store-alert" role="alert">One or more products are unavailable or no longer have a listed price. Remove those products before checkout.</p>}
      <div className="cart-line-list">{items.map((item) => {
        const product = productMap.get(item.id);
        if (!product) return <article className="cart-line cart-line-unavailable" key={item.id}><div className="cart-line-copy"><strong>Product no longer available</strong><span>Remove this item to continue.</span></div><Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} aria-label="Remove unavailable product"><Trash2 size={17} /></Button></article>;
        const image = product.image_url || product.image_urls?.[0];
        return <article className="cart-line" key={item.id}>
          <Link className="cart-line-image" href={"/products/" + product.id} aria-label={"View " + product.name}>{image ? <Image src={image} alt="" fill sizes="(max-width: 700px) 25vw, 120px" /> : <ShoppingBag size={24} />}</Link>
          <div className="cart-line-copy"><Link href={"/products/" + product.id}><strong>{product.name}</strong></Link><span>{product.brand || "Adarsh Computers"}</span><span className={product.availability === "Out of stock" ? "availability-unavailable" : "availability-available"}>{product.availability}</span></div>
          <div className="cart-line-price"><strong>{formatCurrency(product.price) || "Price on enquiry"}</strong><span>each</span></div>
          <div className="quantity-control" aria-label={"Quantity for " + product.name}><button type="button" onClick={() => item.quantity > 1 ? setQuantity(item.id, item.quantity - 1) : removeItem(item.id)} aria-label="Decrease quantity"><Minus size={15} /></button><span>{item.quantity}</span><button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= 20} aria-label="Increase quantity"><Plus size={15} /></button></div>
          <strong className="cart-line-total">{product.price === null ? "Ask us" : formatCurrency(Number(product.price) * item.quantity)}</strong>
          <Button variant="ghost" size="icon" className="cart-remove" onClick={() => removeItem(item.id)} aria-label={"Remove " + product.name}><Trash2 size={17} /></Button>
        </article>;
      })}</div>
      <Link className="continue-shopping" href="/products"><ArrowLeft size={16} /> Continue shopping</Link>
    </section>
    <aside className="cart-summary surface">
      <span className="eyebrow">Order summary</span><h2>Summary</h2>
      <form className="discount-form" onSubmit={applyDiscount}><label htmlFor="cart-discount-code">Discount code</label><div><Input id="cart-discount-code" value={discountCode} onChange={(event) => { setDiscountCode(event.target.value.toUpperCase()); setDiscount(null); }} placeholder="Enter code" autoComplete="off" /><Button type="submit" variant="outline" disabled={checkingDiscount || !discountCode.trim()}>{checkingDiscount ? "Checking…" : "Apply"}</Button></div>{discount && <p className={discount.valid ? "discount-feedback success" : "discount-feedback error"} role="status">{discount.message}</p>}{discount?.valid && <button type="button" className="remove-discount" onClick={() => { setDiscount(null); setDiscountCode(""); }}>Remove discount</button>}</form>
      <div className="summary-line"><span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span><strong>{formatCurrency(subtotal)}</strong></div>
      {discountAmount > 0 && <div className="summary-line summary-discount"><span>Discount{discount?.code ? " · " + discount.code : ""}</span><strong>−{formatCurrency(discountAmount)}</strong></div>}
      <div className="summary-total"><span>Product total</span><strong>{formatCurrency(total)}</strong></div>
      <p className="shipping-note">Delivery details and any shipping charge will be confirmed by the store.</p>
      {unavailable || subtotal <= 0 ? <Button size="lg" className="checkout-button" disabled>Proceed to order <ArrowRight size={17} /></Button> : <Button asChild size="lg" className="checkout-button"><Link href={"/checkout" + (discount?.valid && discount.code ? "?discount=" + encodeURIComponent(discount.code) : "")}>Proceed to order <ArrowRight size={17} /></Link></Button>}
      <p className="whatsapp-order-note">No online payment is taken. You’ll review and send your order through WhatsApp.</p>
    </aside>
  </div>;
}

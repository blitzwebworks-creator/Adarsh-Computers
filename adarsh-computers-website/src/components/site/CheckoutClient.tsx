"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, LoaderCircle, ShieldCheck, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/components/site/CartProvider";
import { createClient } from "@/lib/supabase/client";
import { isMissingOptionalProductColumn, legacyProductClientFields, normalizeProductRow, productClientFields } from "@/lib/product-compat";
import { createOrderAction, validateDiscountAction, type DiscountValidation, type StoreActionState } from "@/lib/actions/store";
import { formatCurrency } from "@/lib/utils";
import type { CustomerDetails, Product } from "@/lib/types";
import { CartSkeleton } from "@/components/site/LoadingStates";

export function CheckoutClient({ initialDetails, initialDiscountCode }: { initialDetails: CustomerDetails | null; initialDiscountCode: string }) {
  const { items, ready } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [productLoadError, setProductLoadError] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [discountCode, setDiscountCode] = useState(initialDiscountCode.toUpperCase());
  const [discount, setDiscount] = useState<DiscountValidation | null>(null);
  const [checkingDiscount, setCheckingDiscount] = useState(false);
  const [initialChecked, setInitialChecked] = useState(false);
  const [actionState, formAction, pending] = useActionState(createOrderAction, {} as StoreActionState);

  const loadProducts = useCallback(async () => {
    if (!ready) return;
    if (!items.length) { setProducts([]); setProductLoadError(false); setLoadingProducts(false); return; }
    setLoadingProducts(true);
    try {
      const supabase = createClient();
      const ids = items.map((item) => item.id);
      const current = await supabase.from("products").select(productClientFields).in("id", ids).eq("is_published", true);
      let rows = current.data as unknown as unknown[] | null;
      let loadError = current.error;
      if (isMissingOptionalProductColumn(current.error)) {
        const legacy = await supabase.from("products").select(legacyProductClientFields).in("id", ids).eq("is_published", true);
        rows = legacy.data as unknown as unknown[] | null;
        loadError = legacy.error;
      }
      setProductLoadError(Boolean(loadError));
      setProducts(loadError ? [] : ((rows || []) as (Partial<Product> & Pick<Product, "id" | "name">)[]).map(normalizeProductRow));
    } catch {
      setProductLoadError(true);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [items, ready]);
  useEffect(() => { void loadProducts(); }, [loadProducts]);

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const subtotal = items.reduce((sum, item) => sum + Number(productMap.get(item.id)?.price || 0) * item.quantity, 0);
  const unavailable = ready && items.some((item) => {
    const product = productMap.get(item.id);
    return !product || product.price === null || product.availability === "Out of stock" || product.stock_quantity === 0 || (product.stock_quantity !== null && item.quantity > product.stock_quantity);
  });
  const discountAmount = discount?.valid ? Number(discount.discount_amount || 0) : 0;
  const total = Math.max(0, subtotal - discountAmount);

  async function checkDiscount(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (checkingDiscount) return;
    setCheckingDiscount(true);
    try {
      const result = await validateDiscountAction(discountCode, items);
      setDiscount(result);
    } catch {
      setDiscount({ valid: false, message: "We could not check that code. Please try again." });
    } finally {
      setCheckingDiscount(false);
    }
  }

  useEffect(() => {
    if (ready && initialDiscountCode && items.length && !initialChecked) {
      setInitialChecked(true);
      void checkDiscount();
    }
  }, [ready, initialDiscountCode, items, initialChecked]);

  if (!ready || loadingProducts) return <CartSkeleton checkout embedded />;
  if (!items.length) return <div className="cart-empty surface"><h1>Your cart is empty.</h1><p>Add a product before starting checkout.</p><Button asChild><Link href="/products">Browse products <ArrowRight size={16} /></Link></Button></div>;

  return <>
    <div className="checkout-page-heading"><Link href="/cart" className="checkout-back"><ArrowLeft size={16} /> Back to cart</Link><span className="eyebrow">Secure order details</span><h1>Order details</h1><p>Share your delivery details. You’ll review the prepared message before sending it to the store on WhatsApp.</p></div>
    <div className="checkout-layout">
      <section className="checkout-customer-panel surface">
        <div className="checkout-panel-heading"><span className="checkout-panel-icon"><ShieldCheck size={19} /></span><div><h2>Customer information</h2><p>Fields marked required are needed to prepare the order.</p></div></div>
        <form action={formAction} className="checkout-form">
          <input type="hidden" name="items" value={JSON.stringify(items)} />
          <input type="hidden" name="discount_code" value={discount?.valid ? discount.code || "" : ""} />
          <label className="checkout-field"><span>Full name <i>*</i></span><Input name="full_name" required minLength={2} maxLength={120} autoComplete="name" defaultValue={initialDetails?.full_name || ""} placeholder="Your full name" /></label>
          <div className="checkout-form-grid"><label className="checkout-field"><span>Contact number <i>*</i></span><Input name="phone" type="tel" required minLength={7} maxLength={30} autoComplete="tel" placeholder="+91 98765 43210" defaultValue={initialDetails?.phone || ""} /></label><label className="checkout-field"><span>Email address <i>*</i></span><Input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" defaultValue={initialDetails?.email || ""} /></label></div>
          <label className="checkout-field"><span>Complete delivery address <i>*</i></span><Textarea name="address" required minLength={5} maxLength={500} autoComplete="street-address" placeholder="House number, street, area and nearby landmark" defaultValue={initialDetails?.address || ""} /></label>
          <div className="checkout-form-grid checkout-location-grid"><label className="checkout-field"><span>City</span><Input name="city" maxLength={120} autoComplete="address-level2" defaultValue={initialDetails?.city || ""} /></label><label className="checkout-field"><span>State</span><Input name="state" maxLength={120} autoComplete="address-level1" defaultValue={initialDetails?.state || ""} /></label><label className="checkout-field"><span>Pincode</span><Input name="pincode" inputMode="numeric" maxLength={20} autoComplete="postal-code" defaultValue={initialDetails?.pincode || ""} /></label></div>
          <label className="checkout-field"><span>Additional order notes <i className="optional-tag">Optional</i></span><Textarea name="notes" maxLength={2000} placeholder="Delivery timing or other helpful details" /></label>
          {actionState.error && <p className="checkout-error" role="alert">{actionState.error}</p>}
          {productLoadError && <p className="checkout-error" role="alert">We couldn’t load current product details. Return to the cart and contact the store before continuing.</p>}
          {unavailable && <p className="checkout-error" role="alert">One or more products are no longer available at a listed price. Return to your cart to remove them.</p>}
          <Button type="submit" size="lg" className="checkout-submit" disabled={pending || unavailable || subtotal <= 0}>{pending ? <>Preparing your order <LoaderCircle className="spin" size={17} /></> : <>Place order via WhatsApp <ArrowRight size={17} /></>}</Button>
          <p className="checkout-privacy-note">No payment is collected here. Your order remains pending until you send the WhatsApp message and the store confirms it.</p>
        </form>
      </section>
      <aside className="checkout-summary surface">
        <span className="eyebrow">Your order</span><h2>Order summary <span>({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span></h2>
        <div className="checkout-order-lines">{items.map((item) => {
          const product = productMap.get(item.id);
          if (!product) return <div className="checkout-order-item" key={item.id}><span className="checkout-summary-unavailable">Product unavailable</span></div>;
          const image = product.image_url || product.image_urls?.[0];
          return <div className="checkout-order-item" key={item.id}><span className="checkout-order-image">{image && <Image src={image} alt="" fill sizes="56px" />}</span><span className="checkout-order-copy"><strong>{product.name}</strong><small>{product.brand || "Adarsh Computers"} · Qty {item.quantity}</small></span><strong className="checkout-order-price">{formatCurrency(Number(product.price || 0) * item.quantity)}</strong></div>;
        })}</div>
      <form className="discount-form checkout-discount-form" onSubmit={checkDiscount}><label htmlFor="checkout-discount">Discount code</label><div><Input id="checkout-discount" value={discountCode} onChange={(event) => { setDiscountCode(event.target.value.toUpperCase()); setDiscount(null); }} placeholder="Enter code" autoComplete="off" /><Button type="submit" variant="outline" disabled={checkingDiscount || !discountCode.trim()} aria-busy={checkingDiscount}>{checkingDiscount ? <LoaderCircle className="spin" size={15} /> : <Tag size={14} />}{checkingDiscount ? "Checking…" : "Apply"}</Button></div>{discount && <p className={discount.valid ? "discount-feedback success" : "discount-feedback error"} role="status">{discount.message}</p>}{discount?.valid && <button type="button" className="remove-discount" onClick={() => { setDiscount(null); setDiscountCode(""); }}>Remove discount</button>}</form>
        <div className="summary-line"><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
        {discountAmount > 0 && <div className="summary-line summary-discount"><span>Discount · {discount?.code}</span><strong>−{formatCurrency(discountAmount)}</strong></div>}
        <div className="summary-total"><span>Product total</span><strong>{formatCurrency(total)}</strong></div>
        <p className="shipping-note">Delivery and any shipping charge will be confirmed by the store.</p>
      </aside>
    </div>
  </>;
}

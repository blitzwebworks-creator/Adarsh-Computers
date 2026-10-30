"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type StoreActionState = { error?: string };
const cartSchema = z.array(z.object({ id: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).min(1).max(50);
const customerSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  email: z.email().max(254),
  address: z.string().trim().min(5).max(500),
  city: z.string().trim().max(120),
  state: z.string().trim().max(120),
  pincode: z.string().trim().max(20),
  notes: z.string().trim().max(2000),
});

export type DiscountValidation = { valid: boolean; code?: string; discount_amount?: number; message: string };

export async function validateDiscountAction(code: string, items: { id: string; quantity: number }[]): Promise<DiscountValidation> {
  const parsed = cartSchema.safeParse(items);
  if (!parsed.success || !code.trim()) return { valid: false, message: "Enter a discount code and add a priced product first." };
  const supabase = await createClient();
  const ids = [...new Set(parsed.data.map((item) => item.id))];
  const { data: products, error } = await supabase.from("products").select("id,price,is_published,availability").in("id", ids);
  if (error || !products || products.length !== ids.length) return { valid: false, message: "Some products are no longer available. Refresh your cart." };
  const byId = new Map(products.map((product) => [product.id, product]));
  let subtotal = 0;
  for (const item of parsed.data) {
    const product = byId.get(item.id);
    if (!product?.is_published || product.availability === "Out of stock" || product.price === null) return { valid: false, message: "A cart item is no longer available at a listed price." };
    subtotal += Number(product.price) * item.quantity;
  }
  const { data, error: discountError } = await supabase.rpc("validate_adarsh_discount", { p_code: code.trim(), p_subtotal: subtotal });
  if (discountError || !data || typeof data !== "object") return { valid: false, message: "Discount validation is unavailable. Try again shortly." };
  return data as DiscountValidation;
}

export async function createOrderAction(_previous: StoreActionState, formData: FormData): Promise<StoreActionState> {
  let items: unknown;
  try { items = JSON.parse(String(formData.get("items") || "[]")); }
  catch { return { error: "Your cart could not be read. Return to the cart and try again." }; }
  const parsedItems = cartSchema.safeParse(items);
  const parsedCustomer = customerSchema.safeParse({
    full_name: formData.get("full_name"), phone: formData.get("phone"), email: formData.get("email"),
    address: formData.get("address"), city: formData.get("city") || "", state: formData.get("state") || "",
    pincode: formData.get("pincode") || "", notes: formData.get("notes") || "",
  });
  if (!parsedItems.success) return { error: "Your cart is empty or invalid. Return to the cart and try again." };
  if (!parsedCustomer.success) return { error: "Enter your name, a valid phone number and email, and a complete delivery address." };

  const accessToken = randomUUID();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_adarsh_order", {
    p_items: parsedItems.data,
    p_customer: parsedCustomer.data,
    p_discount_code: String(formData.get("discount_code") || "").trim(),
    p_access_token: accessToken,
  });
  if (error || !data || typeof data !== "object" || typeof (data as { reference?: unknown }).reference !== "string") {
    const message = error?.message || "";
    if (/discount code/i.test(message)) return { error: "That discount code is no longer valid. Return to your cart and review the discount." };
    if (/product|cart|quantity|customer details|order subtotal/i.test(message)) return { error: message.replace(/^.*ERROR:\s*/i, "") };
    return { error: "We could not save this order. Please review your details and try again." };
  }
  const reference = (data as { reference: string }).reference;
  const cookieStore = await cookies();
  cookieStore.set("adarsh_order_access", reference + ":" + accessToken, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60,
  });
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/account");
  redirect("/order-ready?reference=" + encodeURIComponent(reference));
}

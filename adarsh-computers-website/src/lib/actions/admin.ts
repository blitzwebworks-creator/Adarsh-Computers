"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseEnv } from "@/lib/env";
import { isMissingOptionalProductColumn } from "@/lib/product-compat";
import { slugify } from "@/lib/utils";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function submittedImage(formData: FormData): { url: string | null; invalid: boolean } {
  const url = text(formData, "uploaded_image_url");
  if (!url) return { url: null, invalid: false };
  try {
    const parsed = new URL(url);
    const expected = new URL(getSupabaseEnv().url);
    const valid = parsed.origin === expected.origin && parsed.pathname.startsWith("/storage/v1/object/public/business-media/");
    return valid ? { url, invalid: false } : { url: null, invalid: true };
  } catch {
    return { url: null, invalid: true };
  }
}

async function removeImage(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], url: string | null) {
  if (!url) return;
  const marker = "/storage/v1/object/public/business-media/";
  const index = url.indexOf(marker);
  if (index >= 0) {
    const objectPath = decodeURIComponent(url.slice(index + marker.length));
    await supabase.storage.from("business-media").remove([objectPath]);
  }
}

export async function saveProductAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const uploadedImage = submittedImage(formData);
  const uploadedProductImages = [...new Set(text(formData, "uploaded_product_image_urls").split(/\r?\n/).map((url) => url.trim()).filter(Boolean))];
  const uploadedGalleryImages = [...new Set(text(formData, "uploaded_gallery_image_urls").split(/\r?\n/).map((url) => url.trim()).filter(Boolean))];
  const storageOrigin = new URL(getSupabaseEnv().url).origin;
  const isBusinessStorageImage = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" && parsed.origin === storageOrigin && parsed.pathname.startsWith("/storage/v1/object/public/business-media/");
    } catch { return false; }
  };
  const isProductStorageImage = (url: string) => isBusinessStorageImage(url) && new URL(url).pathname.startsWith("/storage/v1/object/public/business-media/products/");
  const cleanupUploads = async () => {
    const images = [...new Set([uploadedImage.url, ...uploadedProductImages].filter((url): url is string => Boolean(url && isProductStorageImage(url))))];
    await Promise.all(images.map((url) => removeImage(supabase, url)));
  };
  const fail = async (error: string): Promise<never> => {
    await cleanupUploads();
    redirect(`/admin/products?error=${encodeURIComponent(error)}`);
  };
  if (uploadedImage.invalid) await fail("image");
  if ((uploadedImage.url && (!isProductStorageImage(uploadedImage.url) || !uploadedProductImages.includes(uploadedImage.url))) || uploadedProductImages.some((url) => !isProductStorageImage(url)) || uploadedGalleryImages.some((url) => !isProductStorageImage(url) || !uploadedProductImages.includes(url)) || uploadedGalleryImages.length > 4) await fail("gallery_url");
  const id = text(formData, "id") || randomUUID();
  if (!z.string().uuid().safeParse(id).success) await fail("id");
  const name = text(formData, "name");
  const brand = text(formData, "brand");
  const description = text(formData, "description");
  const categoryId = text(formData, "category_id");
  const price = text(formData, "price");
  const compareAtPrice = text(formData, "compare_at_price");
  const stockQuantity = text(formData, "stock_quantity");
  const availability = text(formData, "availability");
  if (!z.string().min(2).max(160).safeParse(name).success) await fail("name");
  if (!z.string().max(100).safeParse(brand).success) await fail("brand");
  if (!z.string().max(4000).safeParse(description).success) await fail("description");
  if (categoryId && !z.string().uuid().safeParse(categoryId).success) await fail("category");
  const validMoney = (value: string) => value === "" || (/^(?:\d+)(?:\.\d{1,2})?$/.test(value) && Number(value) <= 9999999999.99);
  if (!validMoney(price)) await fail("price");
  if (!validMoney(compareAtPrice) || (compareAtPrice !== "" && (price === "" || Number(compareAtPrice) <= Number(price)))) await fail("compare_price");
  if (!(stockQuantity === "" || (/^\d+$/.test(stockQuantity) && Number(stockQuantity) <= 1000000))) await fail("stock");
  if (!z.enum(["In stock", "Available to order", "Contact for availability", "Out of stock"]).safeParse(availability).success) await fail("availability");
  const parsed = z.object({
    name: z.string().min(2).max(160),
    brand: z.string().max(100),
    description: z.string().max(4000),
    category_id: z.string().uuid().or(z.literal("")),
    price: z.string().refine((value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0), "Invalid price"),
    compare_at_price: z.string().refine((value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0), "Invalid compare price"),
    stock_quantity: z.string().refine((value) => value === "" || (/^\d+$/.test(value) && Number(value) <= 1000000), "Invalid inventory quantity"),
    availability: z.enum(["In stock", "Available to order", "Contact for availability", "Out of stock"]),
  }).safeParse({ name, brand, description, category_id: categoryId, price, compare_at_price: compareAtPrice, stock_quantity: stockQuantity, availability });
  if (!parsed.success) {
    await cleanupUploads();
    redirect("/admin/products?error=validation");
  }
  const product = parsed.data;

  const imageUrls = [...new Set(text(formData, "image_urls").split(/\r?\n/).map((url) => url.trim()).filter(Boolean))];
  if (imageUrls.some((url) => !isBusinessStorageImage(url))) await fail("gallery_url");
  const specifications: Record<string, string> = {};
  const specificationLines = text(formData, "specifications").split(/\r?\n/).filter((line) => line.trim());
  if (specificationLines.length > 30) await fail("specifications_count");
  for (const line of specificationLines) {
    const separator = line.indexOf(":");
    if (separator < 1) await fail("specifications_format");
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!key || key.length > 60 || !value || value.length > 240) await fail("specifications_format");
    specifications[key] = value;
  }

  // Read stored media from the database. Hidden form fields are user-editable and
  // must not be trusted when deciding which storage objects can be removed.
  let existingProduct = await supabase.from("products").select("image_url,image_urls").eq("id", id).maybeSingle();
  if (isMissingOptionalProductColumn(existingProduct.error)) existingProduct = await supabase.from("products").select("image_url").eq("id", id).maybeSingle();
  if (existingProduct.error) await fail("save");
  const existingMedia = existingProduct.data as { image_url: string | null; image_urls?: string[] | null } | null;
  const previousImage = existingMedia?.image_url || null;
  const previousGallery = existingMedia?.image_urls || [];
  if (imageUrls.length > 4 && (imageUrls.some((url) => !previousGallery.includes(url)) || imageUrls.length > previousGallery.length)) await fail("gallery_count");
  if (imageUrls.some((url) => !previousGallery.includes(url) && !uploadedGalleryImages.includes(url))) await fail("gallery_url");
  let imageUrl = uploadedImage.url || previousImage;
  if (formData.get("remove_image") === "yes") imageUrl = null;
  const productPayload = {
    id,
    name: product.name,
    brand: product.brand || null,
    description: product.description || null,
    category_id: product.category_id || null,
    price: product.price === "" ? null : Number(product.price),
    compare_at_price: product.compare_at_price === "" ? null : Number(product.compare_at_price),
    stock_quantity: product.stock_quantity === "" ? null : Number(product.stock_quantity),
    availability: product.stock_quantity === "0" ? "Out of stock" : product.availability,
    image_url: imageUrl,
    image_urls: imageUrls,
    specifications,
    is_published: formData.get("is_published") === "on",
    is_featured: formData.get("is_featured") === "on",
    updated_at: new Date().toISOString(),
  };
  const writePayload = { ...productPayload };
  let result = await supabase.from("products").upsert(writePayload, { onConflict: "id" });
  let usedLegacySchema = false;
  const optionalColumns = ["compare_at_price", "stock_quantity", "image_urls", "specifications"] as const;
  for (let attempt = 0; result.error && attempt < optionalColumns.length; attempt += 1) {
    if (!isMissingOptionalProductColumn(result.error)) break;
    const missingColumn = optionalColumns.find((column) => result.error?.message.toLowerCase().includes(column));
    if (!missingColumn || !(missingColumn in writePayload)) break;
    delete (writePayload as Partial<typeof productPayload>)[missingColumn];
    usedLegacySchema = true;
    result = await supabase.from("products").upsert(writePayload, { onConflict: "id" });
  }
  const { error } = result;
  if (error) {
    await fail("save");
  }
  if (uploadedImage.url && uploadedImage.url !== imageUrl) await removeImage(supabase, uploadedImage.url);
  if (previousImage && previousImage !== imageUrl) await removeImage(supabase, previousImage);
  const galleryWasSaved = "image_urls" in writePayload;
  if (galleryWasSaved) {
    for (const oldImage of previousGallery) if (!imageUrls.includes(oldImage) && oldImage !== imageUrl) await removeImage(supabase, oldImage);
  }
  const selectedImages = new Set([...(imageUrl ? [imageUrl] : []), ...(galleryWasSaved ? imageUrls : [])]);
  for (const uploadedProductImage of uploadedProductImages) if (!selectedImages.has(uploadedProductImage)) await removeImage(supabase, uploadedProductImage);
  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath("/admin/products");
  redirect(usedLegacySchema ? "/admin/products?notice=saved-basic" : "/admin/products?notice=saved");
}

export async function deleteProductAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  if (!z.string().uuid().safeParse(id).success) redirect("/admin/products?error=validation");
  let selected = await supabase.from("products").select("image_url,image_urls").eq("id", id).maybeSingle();
  if (isMissingOptionalProductColumn(selected.error)) selected = await supabase.from("products").select("image_url").eq("id", id).maybeSingle();
  const data = selected.data as { image_url: string | null; image_urls?: string[] | null } | null;
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) redirect("/admin/products?error=delete");
  await removeImage(supabase, data?.image_url || null);
  for (const image of data?.image_urls || []) await removeImage(supabase, image);
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/products?notice=deleted");
}

export async function saveCategoryAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const uploadedImage = submittedImage(formData);
  if (uploadedImage.invalid) redirect("/admin/categories?error=image");
  const id = text(formData, "id") || randomUUID();
  const name = text(formData, "name");
  if (!z.string().min(2).max(100).safeParse(name).success) redirect("/admin/categories?error=validation");
  const previousImage = text(formData, "existing_image") || null;
  let imageUrl = uploadedImage.url || previousImage;
  if (formData.get("remove_image") === "yes") imageUrl = null;
  const { error } = await supabase.from("categories").upsert({
    id, name, slug: slugify(name), description: text(formData, "description") || null,
    image_url: imageUrl, sort_order: Number(text(formData, "sort_order") || 0), is_active: formData.get("is_active") === "on", updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  if (error) {
    if (uploadedImage.url && uploadedImage.url !== previousImage) await removeImage(supabase, uploadedImage.url);
    redirect("/admin/categories?error=save");
  }
  if (uploadedImage.url && uploadedImage.url !== imageUrl) await removeImage(supabase, uploadedImage.url);
  if (previousImage && previousImage !== imageUrl) await removeImage(supabase, previousImage);
  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath("/admin/categories");
  redirect("/admin/categories?notice=saved");
}

export async function deleteCategoryAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  if (!z.string().uuid().safeParse(id).success) redirect("/admin/categories?error=validation");
  const { data } = await supabase.from("categories").select("image_url").eq("id", id).maybeSingle();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) redirect("/admin/categories?error=delete");
  await removeImage(supabase, data?.image_url || null);
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/categories?notice=deleted");
}

export async function saveServiceAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const uploadedImage = submittedImage(formData);
  if (uploadedImage.invalid) redirect("/admin/services?error=image");
  const id = text(formData, "id") || randomUUID();
  const name = text(formData, "name");
  const description = text(formData, "description");
  if (!z.string().min(2).max(160).safeParse(name).success || !z.string().max(4000).safeParse(description).success) redirect("/admin/services?error=validation");
  const previousImage = text(formData, "existing_image") || null;
  let imageUrl = uploadedImage.url || previousImage;
  if (formData.get("remove_image") === "yes") imageUrl = null;
  const { error } = await supabase.from("services").upsert({
    id, name, description: description || null, image_url: imageUrl,
    is_published: formData.get("is_published") === "on", sort_order: Number(text(formData, "sort_order") || 0), updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  if (error) {
    if (uploadedImage.url && uploadedImage.url !== previousImage) await removeImage(supabase, uploadedImage.url);
    redirect("/admin/services?error=save");
  }
  if (uploadedImage.url && uploadedImage.url !== imageUrl) await removeImage(supabase, uploadedImage.url);
  if (previousImage && previousImage !== imageUrl) await removeImage(supabase, previousImage);
  revalidatePath("/services");
  revalidatePath("/admin/services");
  redirect("/admin/services?notice=saved");
}

export async function deleteServiceAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  if (!z.string().uuid().safeParse(id).success) redirect("/admin/services?error=validation");
  const { data } = await supabase.from("services").select("image_url").eq("id", id).maybeSingle();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) redirect("/admin/services?error=delete");
  await removeImage(supabase, data?.image_url || null);
  revalidatePath("/services");
  redirect("/admin/services?notice=deleted");
}

export async function updateEnquiryStatusAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  const status = text(formData, "status");
  if (!z.string().uuid().safeParse(id).success || !["New", "Unread", "Read", "Contacted", "In Progress", "Resolved", "Completed"].includes(status)) redirect("/admin/enquiries?error=validation");
  const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);
  if (error) redirect("/admin/enquiries?error=save");
  revalidatePath("/admin/enquiries");
  revalidatePath("/admin");
  redirect("/admin/enquiries?notice=saved");
}

export async function deleteEnquiryAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  if (!z.string().uuid().safeParse(id).success) redirect("/admin/enquiries?error=validation");
  const { error } = await supabase.from("enquiries").delete().eq("id", id);
  if (error) redirect("/admin/enquiries?error=delete");
  revalidatePath("/admin/enquiries");
  revalidatePath("/admin");
  redirect("/admin/enquiries?notice=deleted");
}

export async function saveTestimonialAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id") || randomUUID();
  const customer = text(formData, "customer_name");
  const quote = text(formData, "quote");
  const ratingRaw = text(formData, "rating");
  const rating = ratingRaw ? Number(ratingRaw) : null;
  if (!z.string().min(2).max(120).safeParse(customer).success || !z.string().min(10).max(2000).safeParse(quote).success || (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5))) redirect("/admin/testimonials?error=validation");
  const { error } = await supabase.from("testimonials").upsert({ id, customer_name: customer, company: text(formData, "company") || null, quote, rating, is_published: formData.get("is_published") === "on", updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) redirect("/admin/testimonials?error=save");
  revalidatePath("/");
  revalidatePath("/admin/testimonials");
  redirect("/admin/testimonials?notice=saved");
}

export async function deleteTestimonialAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  if (!z.string().uuid().safeParse(id).success) redirect("/admin/testimonials?error=validation");
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) redirect("/admin/testimonials?error=delete");
  revalidatePath("/");
  revalidatePath("/admin/testimonials");
  redirect("/admin/testimonials?notice=deleted");
}

export async function saveSiteSettingsAction(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const key = text(formData, "key");
  if (!["home", "about", "business"].includes(key)) redirect("/admin/content?error=validation");
  const uploadedImage = submittedImage(formData);
  if (uploadedImage.invalid) redirect("/admin/settings?error=image");
  const previous = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  const current = (previous.data?.value && typeof previous.data.value === "object" ? previous.data.value : {}) as Record<string, unknown>;
  const value: Record<string, unknown> = { ...current };
  for (const [field, raw] of formData.entries()) {
    if (field === "key" || field === "image" || field === "remove_logo" || field === "remove_image") continue;
    if (typeof raw === "string") value[field] = raw.trim();
  }
  if (key === "business") value.brands = text(formData, "brands").split(",").map((brand) => brand.trim()).filter(Boolean);
  if (key === "business" ) {
    for (const field of ["facebook_url", "instagram_url", "linkedin_url", "map_url"]) {
      const urlValue = typeof value[field] === "string" ? value[field] as string : "";
      if (!urlValue) continue;
      try {
        const parsedUrl = new URL(urlValue);
        if (parsedUrl.protocol !== "https:") throw new Error("invalid" );
        if (field === "map_url" && !["google.com", "www.google.com", "maps.google.com", "maps.app.goo.gl"].includes(parsedUrl.hostname)) throw new Error("invalid" );
      } catch { redirect("/admin/settings?error=validation"); }
    }
  }
  if (key === "business" && uploadedImage.url) value.logo_url = uploadedImage.url;
  if (formData.get("remove_image") === "yes") value.logo_url = "";
  const { error } = await supabase.from("site_settings").upsert({ key, value, is_public: true, updated_at: new Date().toISOString(), updated_by: user.id }, { onConflict: "key" });
  if (error) {
    if (uploadedImage.url && uploadedImage.url !== current.logo_url) await removeImage(supabase, uploadedImage.url);
    redirect("/admin/" + (key === "business" ? "settings" : "content") + "?error=save");
  }
  const oldLogo = typeof current.logo_url === "string" ? current.logo_url : null;
  if (uploadedImage.url && uploadedImage.url !== value.logo_url) await removeImage(supabase, uploadedImage.url);
  if (key === "business" && oldLogo && oldLogo !== value.logo_url) await removeImage(supabase, oldLogo);
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/admin/content");
  revalidatePath("/admin/settings");
  redirect("/admin/" + (key === "business" ? "settings" : "content") + "?notice=saved");
}

export async function saveDiscountCodeAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  const code = text(formData, "code").toUpperCase();
  const discountType = text(formData, "discount_type");
  const amount = Number(text(formData, "amount"));
  const minimumSubtotal = Number(text(formData, "minimum_subtotal") || 0);
  const maximumDiscountRaw = text(formData, "maximum_discount");
  const usageLimitRaw = text(formData, "usage_limit");
  const startsAtRaw = text(formData, "starts_at");
  const endsAtRaw = text(formData, "ends_at");
  const codeValid = /^[A-Z0-9_-]{3,30}$/.test(code);
  if (!codeValid || !["percentage", "fixed"].includes(discountType) || !Number.isFinite(amount) || amount <= 0 || (discountType === "percentage" && amount > 100) || !Number.isFinite(minimumSubtotal) || minimumSubtotal < 0 || (maximumDiscountRaw && (!Number.isFinite(Number(maximumDiscountRaw)) || Number(maximumDiscountRaw) <= 0)) || (usageLimitRaw && (!Number.isInteger(Number(usageLimitRaw)) || Number(usageLimitRaw) < 1))) redirect("/admin/discounts?error=validation");
  const startsAt = startsAtRaw ? new Date(startsAtRaw + (startsAtRaw.length === 16 ? ":00+05:30" : "")) : null;
  const endsAt = endsAtRaw ? new Date(endsAtRaw + (endsAtRaw.length === 16 ? ":00+05:30" : "")) : null;
  if ((startsAt && Number.isNaN(startsAt.getTime())) || (endsAt && Number.isNaN(endsAt.getTime())) || (startsAt && endsAt && endsAt <= startsAt)) redirect("/admin/discounts?error=validation");
  const value = {
    code, discount_type: discountType, amount, minimum_subtotal: minimumSubtotal,
    maximum_discount: maximumDiscountRaw ? Number(maximumDiscountRaw) : null,
    usage_limit: usageLimitRaw ? Number(usageLimitRaw) : null,
    starts_at: startsAt?.toISOString() || null, ends_at: endsAt?.toISOString() || null,
    is_active: formData.get("is_active") === "on", updated_at: new Date().toISOString(),
  };
  const result = id
    ? await supabase.from("discount_codes").update(value).eq("id", id)
    : await supabase.from("discount_codes").insert(value);
  if (result.error) redirect("/admin/discounts?error=save");
  revalidatePath("/admin/discounts");
  revalidatePath("/cart");
  redirect("/admin/discounts?notice=saved");
}

export async function deleteDiscountCodeAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  if (!z.string().uuid().safeParse(id).success) redirect("/admin/discounts?error=validation");
  const { error } = await supabase.from("discount_codes").delete().eq("id", id);
  if (error) redirect("/admin/discounts?error=delete");
  revalidatePath("/admin/discounts");
  redirect("/admin/discounts?notice=deleted");
}

export async function updateOrderStatusAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  const status = text(formData, "status");
  const statuses = ["Pending", "New", "WhatsApp Contacted", "Confirmed", "Processing", "Packed", "Shipped", "Delivered", "Cancelled"];
  if (!z.string().uuid().safeParse(id).success || !statuses.includes(status)) redirect("/admin/orders?error=validation");
  const { error } = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect("/admin/orders?error=save");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/" + id);
  revalidatePath("/admin");
  revalidatePath("/account");
  redirect("/admin/orders?notice=saved");
}

export async function deleteOrderAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  if (!z.string().uuid().safeParse(id).success) redirect("/admin/orders?error=order-delete");

  const { data: existingOrder, error: lookupError } = await supabase.from("orders").select("id").eq("id", id).maybeSingle();
  if (lookupError || !existingOrder) redirect("/admin/orders?error=order-delete");

  const { data: deletedOrder, error } = await supabase.from("orders").delete().eq("id", id).select("id").maybeSingle();
  if (error || !deletedOrder) redirect("/admin/orders?error=order-delete");

  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/" + id);
  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
  revalidatePath("/account");
  redirect("/admin/orders?notice=order-deleted");
}

export async function addOrderNoteAction(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = text(formData, "order_id");
  const note = text(formData, "note");
  if (!z.string().uuid().safeParse(id).success || !z.string().min(1).max(2000).safeParse(note).success) redirect("/admin/orders?error=validation");
  const { error } = await supabase.from("order_notes").insert({ order_id: id, note, created_by: user.id });
  if (error) redirect("/admin/orders/" + id + "?error=note");
  revalidatePath("/admin/orders/" + id);
  redirect("/admin/orders/" + id + "?notice=note");
}

export async function updateOrderPaymentAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "order_id");
  const paymentStatus = text(formData, "payment_status");
  const paymentMethod = text(formData, "payment_method");
  const transactionId = text(formData, "payment_transaction_id");
  if (!z.string().uuid().safeParse(id).success || !["not_required", "pending", "paid", "failed", "refunded"].includes(paymentStatus) || !z.string().max(80).safeParse(paymentMethod).success || !z.string().max(160).safeParse(transactionId).success) redirect("/admin/orders?error=validation");
  const { error } = await supabase.from("orders").update({ payment_status: paymentStatus, payment_method: paymentMethod || null, payment_transaction_id: transactionId || null, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect("/admin/orders/" + id + "?error=payment");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/" + id);
  revalidatePath("/admin");
  redirect("/admin/orders/" + id + "?notice=payment");
}

export async function markAdminNotificationRead(id: string): Promise<{ success: boolean }> {
  const { supabase } = await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return { success: false };
  const { data, error } = await supabase.rpc("mark_adarsh_notification_read", { p_id: id });
  if (error) return { success: false };
  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
  return { success: Boolean(data) };
}

export async function markAllAdminNotificationsRead(): Promise<{ success: boolean }> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("mark_all_adarsh_notifications_read");
  if (error) return { success: false };
  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
  return { success: true };
}




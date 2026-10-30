"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxImageBytes = 5 * 1024 * 1024;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function fileFrom(formData: FormData, key = "image") {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

async function uploadImage(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], file: File, folder: string) {
  if (!imageTypes.has(file.type) || file.size > maxImageBytes) throw new Error("Choose a JPG, PNG, WebP or AVIF image under 5 MB.");
  const safeName = file.name.split(/[\\/]/).pop()?.replace(/[^a-zA-Z0-9._-]/g, "-") || "image";
  const objectPath = folder + "/" + randomUUID() + "-" + safeName;
  const { error } = await supabase.storage.from("business-media").upload(objectPath, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error("Image upload failed. Check the Storage migration and try again.");
  return supabase.storage.from("business-media").getPublicUrl(objectPath).data.publicUrl;
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
  const id = text(formData, "id") || randomUUID();
  const parsed = z.object({
    name: z.string().min(2).max(160),
    brand: z.string().max(100),
    description: z.string().max(4000),
    category_id: z.string().uuid().or(z.literal("")),
    price: z.string().refine((value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0), "Invalid price"),
    availability: z.enum(["In stock", "Available to order", "Contact for availability", "Out of stock"]),
  }).safeParse({ name: text(formData, "name"), brand: text(formData, "brand"), description: text(formData, "description"), category_id: text(formData, "category_id"), price: text(formData, "price"), availability: text(formData, "availability") });
  if (!parsed.success) redirect("/admin/products?error=validation");

  const previousImage = text(formData, "existing_image") || null;
  const imageFile = fileFrom(formData);
  let imageUrl = previousImage;
  if (imageFile) {
    try { imageUrl = await uploadImage(supabase, imageFile, "products"); }
    catch { redirect("/admin/products?error=image"); }
  }
  if (formData.get("remove_image") === "yes") imageUrl = null;
  const { error } = await supabase.from("products").upsert({
    id,
    name: parsed.data.name,
    brand: parsed.data.brand || null,
    description: parsed.data.description || null,
    category_id: parsed.data.category_id || null,
    price: parsed.data.price === "" ? null : Number(parsed.data.price),
    availability: parsed.data.availability,
    image_url: imageUrl,
    is_published: formData.get("is_published") === "on",
    is_featured: formData.get("is_featured") === "on",
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  if (error) redirect("/admin/products?error=save");
  if (previousImage && previousImage !== imageUrl) await removeImage(supabase, previousImage);
  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath("/admin/products");
  redirect("/admin/products?notice=saved");
}

export async function deleteProductAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  if (!z.string().uuid().safeParse(id).success) redirect("/admin/products?error=validation");
  const { data } = await supabase.from("products").select("image_url").eq("id", id).maybeSingle();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) redirect("/admin/products?error=delete");
  await removeImage(supabase, data?.image_url || null);
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/products?notice=deleted");
}

export async function saveCategoryAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id") || randomUUID();
  const name = text(formData, "name");
  if (!z.string().min(2).max(100).safeParse(name).success) redirect("/admin/categories?error=validation");
  const previousImage = text(formData, "existing_image") || null;
  let imageUrl = previousImage;
  const imageFile = fileFrom(formData);
  if (imageFile) {
    try { imageUrl = await uploadImage(supabase, imageFile, "categories"); }
    catch { redirect("/admin/categories?error=image"); }
  }
  if (formData.get("remove_image") === "yes") imageUrl = null;
  const { error } = await supabase.from("categories").upsert({
    id, name, slug: slugify(name), description: text(formData, "description") || null,
    image_url: imageUrl, sort_order: Number(text(formData, "sort_order") || 0), is_active: formData.get("is_active") === "on", updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  if (error) redirect("/admin/categories?error=save");
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
  const id = text(formData, "id") || randomUUID();
  const name = text(formData, "name");
  const description = text(formData, "description");
  if (!z.string().min(2).max(160).safeParse(name).success || !z.string().max(4000).safeParse(description).success) redirect("/admin/services?error=validation");
  const previousImage = text(formData, "existing_image") || null;
  let imageUrl = previousImage;
  const imageFile = fileFrom(formData);
  if (imageFile) {
    try { imageUrl = await uploadImage(supabase, imageFile, "services"); }
    catch { redirect("/admin/services?error=image"); }
  }
  if (formData.get("remove_image") === "yes") imageUrl = null;
  const { error } = await supabase.from("services").upsert({
    id, name, description: description || null, image_url: imageUrl,
    is_published: formData.get("is_published") === "on", sort_order: Number(text(formData, "sort_order") || 0), updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  if (error) redirect("/admin/services?error=save");
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
  if (!z.string().uuid().safeParse(id).success || !["New", "Contacted", "In Progress", "Completed"].includes(status)) redirect("/admin/enquiries?error=validation");
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
  const logoFile = fileFrom(formData, "image");
  if (logoFile) {
    try { value.logo_url = await uploadImage(supabase, logoFile, "business"); }
    catch { redirect("/admin/settings?error=image"); }
  }
  if (formData.get("remove_image") === "yes") value.logo_url = "";
  const { error } = await supabase.from("site_settings").upsert({ key, value, is_public: true, updated_at: new Date().toISOString(), updated_by: user.id }, { onConflict: "key" });
  if (error) redirect("/admin/" + (key === "business" ? "settings" : "content") + "?error=save");
  const oldLogo = typeof current.logo_url === "string" ? current.logo_url : null;
  if (key === "business" && oldLogo && oldLogo !== value.logo_url) await removeImage(supabase, oldLogo);
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/admin/content");
  revalidatePath("/admin/settings");
  redirect("/admin/" + (key === "business" ? "settings" : "content") + "?notice=saved");
}




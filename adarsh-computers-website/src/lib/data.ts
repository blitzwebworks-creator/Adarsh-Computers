import { createClient } from "@/lib/supabase/server";
import type { Category, Enquiry, Product, Profile, Service, Testimonial } from "@/lib/types";

const productFields = "id,name,brand,description,category_id,price,availability,image_url,is_published,is_featured,created_at,updated_at,categories(name,slug)";

export async function getProducts(options: { search?: string; categorySlug?: string; featured?: boolean; limit?: number; admin?: boolean; sort?: string } = {}) {
  try {
    const supabase = await createClient();
    let query = supabase.from("products").select(productFields);
    if (options.sort === "name") query = query.order("name", { ascending: true });
    else if (options.sort === "price-low") query = query.order("price", { ascending: true, nullsFirst: false });
    else if (options.sort === "price-high") query = query.order("price", { ascending: false, nullsFirst: false });
    else query = query.order("created_at", { ascending: false });
    if (!options.admin) query = query.eq("is_published", true);
    if (options.featured) query = query.eq("is_featured", true);
    if (options.search?.trim()) query = query.ilike("name", "%" + options.search.trim().replace(/[%,()]/g, "") + "%");
    if (options.categorySlug) {
      const category = await supabase.from("categories").select("id").eq("slug", options.categorySlug).maybeSingle();
      if (!category.data?.id) return [] as Product[];
      query = query.eq("category_id", category.data.id);
    }
    if (options.limit) query = query.limit(options.limit);
    const { data, error } = await query;
    if (error) return [] as Product[];
    return (data || []) as unknown as Product[];
  } catch {
    return [] as Product[];
  }
}

export async function getProduct(id: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("products").select(productFields).eq("id", id).maybeSingle();
    return error ? null : (data as unknown as Product | null);
  } catch {
    return null;
  }
}

export async function getCategories(admin = false) {
  try {
    const supabase = await createClient();
    let query = supabase.from("categories").select("*").order("sort_order").order("name");
    if (!admin) query = query.eq("is_active", true);
    const { data, error } = await query;
    return error ? [] as Category[] : (data || []) as Category[];
  } catch {
    return [] as Category[];
  }
}

export async function getServices(admin = false) {
  try {
    const supabase = await createClient();
    let query = supabase.from("services").select("*").order("sort_order").order("name");
    if (!admin) query = query.eq("is_published", true);
    const { data, error } = await query;
    return error ? [] as Service[] : (data || []) as Service[];
  } catch {
    return [] as Service[];
  }
}

export async function getEnquiries() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("enquiries").select("*").order("created_at", { ascending: false });
    return error ? [] as Enquiry[] : (data || []) as Enquiry[];
  } catch {
    return [] as Enquiry[];
  }
}

export async function getTestimonials(admin = false) {
  try {
    const supabase = await createClient();
    let query = supabase.from("testimonials").select("*").order("created_at", { ascending: false });
    if (!admin) query = query.eq("is_published", true);
    const { data, error } = await query;
    return error ? [] as Testimonial[] : (data || []) as Testimonial[];
  } catch {
    return [] as Testimonial[];
  }
}

export async function getProfiles() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("profiles").select("id,email,role,created_at").order("created_at");
    return error ? [] as Profile[] : (data || []) as Profile[];
  } catch {
    return [] as Profile[];
  }
}

export async function getDashboardStats() {
  try {
    const supabase = await createClient();
    const [products, activeProducts, enquiries, newEnquiries, categories, recentEnquiries, recentProducts] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabase.from("enquiries").select("id", { count: "exact", head: true }),
      supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "New"),
      supabase.from("categories").select("id", { count: "exact", head: true }),
      supabase.from("enquiries").select("id,name,phone,interested_in,status,created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("products").select("id,name,brand,is_published,created_at").order("created_at", { ascending: false }).limit(5),
    ]);
    const configured = !products.error && !activeProducts.error && !enquiries.error && !newEnquiries.error && !categories.error && !recentEnquiries.error && !recentProducts.error;
    return {
      configured,
      products: products.count || 0,
      activeProducts: activeProducts.count || 0,
      enquiries: enquiries.count || 0,
      newEnquiries: newEnquiries.count || 0,
      categories: categories.count || 0,
      recentEnquiries: (recentEnquiries.data || []) as Pick<Enquiry, "id" | "name" | "phone" | "interested_in" | "status" | "created_at">[],
      recentProducts: (recentProducts.data || []) as Pick<Product, "id" | "name" | "brand" | "is_published" | "created_at">[],
    };
  } catch {
    return { configured: false, products: 0, activeProducts: 0, enquiries: 0, newEnquiries: 0, categories: 0, recentEnquiries: [], recentProducts: [] };
  }
}



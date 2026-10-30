import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isMissingOptionalProductColumn, legacyProductFields, normalizeProductRow, productFields } from "@/lib/product-compat";
import type { Category, CustomerDetails, DiscountCode, Enquiry, Order, Product, Profile, Service, Testimonial } from "@/lib/types";

export async function getProducts(options: { search?: string; categorySlug?: string; featured?: boolean; limit?: number; admin?: boolean; sort?: string } = {}) {
  try {
    const supabase = await createClient();
    let categoryId: string | null = null;
    if (options.categorySlug) {
      const category = await supabase.from("categories").select("id").eq("slug", options.categorySlug).maybeSingle();
      if (!category.data?.id) return [] as Product[];
      categoryId = category.data.id;
    }
    const queryProducts = (fields: string) => {
      let query = supabase.from("products").select(fields);
      if (options.sort === "name") query = query.order("name", { ascending: true });
      else if (options.sort === "price-low") query = query.order("price", { ascending: true, nullsFirst: false });
      else if (options.sort === "price-high") query = query.order("price", { ascending: false, nullsFirst: false });
      else query = query.order("created_at", { ascending: false });
      if (!options.admin) query = query.eq("is_published", true);
      if (options.featured) query = query.eq("is_featured", true);
      if (options.search?.trim()) query = query.ilike("name", "%" + options.search.trim().replace(/[%,()]/g, "") + "%");
      if (categoryId) query = query.eq("category_id", categoryId);
      if (options.limit) query = query.limit(options.limit);
      return query;
    };
    let result = await queryProducts(productFields);
    if (isMissingOptionalProductColumn(result.error)) result = await queryProducts(legacyProductFields);
    if (result.error) {
      console.error("[products] Supabase read failed:", result.error.code);
      return [] as Product[];
    }
    return ((result.data || []) as unknown as (Partial<Product> & Pick<Product, "id" | "name">)[]).map(normalizeProductRow);
  } catch {
    return [] as Product[];
  }
}

export const getProduct = cache(async function getProduct(id: string, admin = false) {
  try {
    const supabase = await createClient();
    let query = supabase.from("products").select(productFields).eq("id", id);
    if (!admin) query = query.eq("is_published", true);
    let result = await query.maybeSingle();
    if (isMissingOptionalProductColumn(result.error)) {
      let legacyQuery = supabase.from("products").select(legacyProductFields).eq("id", id);
      if (!admin) legacyQuery = legacyQuery.eq("is_published", true);
      result = await legacyQuery.maybeSingle();
    }
    if (result.error) {
      console.error("[products] Supabase detail read failed:", result.error.code);
      return null;
    }
    return result.data ? normalizeProductRow(result.data as unknown as Partial<Product> & Pick<Product, "id" | "name">) : null;
  } catch {
    return null;
  }
});

export async function getDiscountCodes() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("discount_codes").select("*").order("created_at", { ascending: false });
    return error ? [] as DiscountCode[] : (data || []) as DiscountCode[];
  } catch {
    return [] as DiscountCode[];
  }
}

export async function getOrders() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("orders").select("id,reference,user_id,customer_name,customer_phone,customer_email,delivery_address,city,state,pincode,notes,subtotal,discount_amount,discount_code,total,status,created_at,updated_at,order_items(id,product_id,product_name,brand,image_url,unit_price,quantity,line_total)").order("created_at", { ascending: false });
    return error ? [] as Order[] : (data || []) as unknown as Order[];
  } catch {
    return [] as Order[];
  }
}

export async function getOrder(id: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("orders").select("id,reference,user_id,customer_name,customer_phone,customer_email,delivery_address,city,state,pincode,notes,subtotal,discount_amount,discount_code,total,status,created_at,updated_at,order_items(id,product_id,product_name,brand,image_url,unit_price,quantity,line_total)").eq("id", id).maybeSingle();
    return error ? null : data as unknown as Order | null;
  } catch {
    return null;
  }
}

export async function getCustomerDetails(userId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("customer_details").select("*").eq("user_id", userId).maybeSingle();
    return error ? null : data as CustomerDetails | null;
  } catch {
    return null;
  }
}

export async function getCustomerOrders(userId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("orders").select("id,reference,user_id,customer_name,customer_phone,customer_email,delivery_address,city,state,pincode,notes,subtotal,discount_amount,discount_code,total,status,created_at,order_items(id,product_id,product_name,brand,image_url,unit_price,quantity,line_total)").eq("user_id", userId).order("created_at", { ascending: false });
    return error ? [] as Order[] : (data || []) as unknown as Order[];
  } catch {
    return [] as Order[];
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



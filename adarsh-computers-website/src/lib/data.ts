import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isMissingOptionalProductColumn, legacyProductFields, normalizeProductRow, productFields } from "@/lib/product-compat";
import type { AdminNotification, Category, CustomerDetails, DiscountCode, Enquiry, Order, OrderNote, OrderStatusEvent, PrivacyRequest, Product, Profile, Service, Testimonial } from "@/lib/types";

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

export async function getOrders(options: { search?: string; status?: string; from?: string; to?: string } = {}) {
  try {
    const supabase = await createClient();
    const queryOrders = (withPayment: boolean) => {
      const fields = "id,reference,user_id,customer_name,customer_phone,customer_email,delivery_address,city,state,pincode,notes,subtotal,discount_amount,discount_code,total,status,created_at,updated_at," + (withPayment ? "payment_status,payment_method,payment_transaction_id," : "") + "order_items(id,product_id,product_name,brand,image_url,unit_price,quantity,line_total)";
      let query = supabase.from("orders").select(fields).order("created_at", { ascending: false });
      if (options.status === "new") query = query.in("status", ["Pending", "New"]);
      else if (options.status === "processing") query = query.in("status", ["Confirmed", "Processing", "Packed"]);
      else if (["Shipped", "Delivered", "Cancelled"].includes(options.status || "")) query = query.eq("status", options.status!);
      if (options.from && /^\d{4}-\d{2}-\d{2}$/.test(options.from)) query = query.gte("created_at", `${options.from}T00:00:00+05:30`);
      if (options.to && /^\d{4}-\d{2}-\d{2}$/.test(options.to)) query = query.lte("created_at", `${options.to}T23:59:59.999+05:30`);
      if (options.search?.trim()) {
        const term = options.search.trim().replace(/[%,()]/g, "");
        if (term) query = query.or(`reference.ilike.%${term}%,customer_name.ilike.%${term}%,customer_email.ilike.%${term}%,customer_phone.ilike.%${term}%`);
      }
      return query;
    };
    let result = await queryOrders(true);
    if (result.error && (result.error.code === "42703" || result.error.code === "PGRST204")) result = await queryOrders(false);
    return result.error ? [] as Order[] : (result.data || []) as unknown as Order[];
  } catch {
    return [] as Order[];
  }
}

export async function getOrder(id: string) {
  try {
    const supabase = await createClient();
    const fields = "id,reference,user_id,customer_name,customer_phone,customer_email,delivery_address,city,state,pincode,notes,subtotal,discount_amount,discount_code,total,status,created_at,updated_at,payment_status,payment_method,payment_transaction_id,order_items(id,product_id,product_name,brand,image_url,unit_price,quantity,line_total)";
    let result = await supabase.from("orders").select(fields).eq("id", id).maybeSingle();
    if (result.error && (result.error.code === "42703" || result.error.code === "PGRST204")) result = await supabase.from("orders").select(fields.replace("payment_status,payment_method,payment_transaction_id,", "")).eq("id", id).maybeSingle();
    return result.error ? null : result.data as unknown as Order | null;
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

export async function getEnquiries(options: { search?: string; status?: string } = {}) {
  try {
    const supabase = await createClient();
    let query = supabase.from("enquiries").select("*").order("created_at", { ascending: false });
    if (options.status === "unread") query = query.in("status", ["New", "Unread"]);
    else if (options.status && ["New", "Unread", "Read", "Contacted", "In Progress", "Resolved", "Completed"].includes(options.status)) query = query.eq("status", options.status);
    if (options.search?.trim()) {
      const term = options.search.trim().replace(/[%,()]/g, "");
      if (term) query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,interested_in.ilike.%${term}%,message.ilike.%${term}%`);
    }
    const { data, error } = await query;
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

export async function getCustomerProfiles() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("profiles").select("id,email,role,created_at").eq("role", "customer").order("created_at", { ascending: false });
    return error ? [] as Profile[] : (data || []) as Profile[];
  } catch {
    return [] as Profile[];
  }
}

export async function getAdminNotifications(limit = 50) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("admin_notifications").select("id,type,reference_id,title,message,is_read,created_at").order("created_at", { ascending: false }).limit(limit);
    return error ? [] as AdminNotification[] : (data || []) as AdminNotification[];
  } catch {
    return [] as AdminNotification[];
  }
}

export async function getAdminNotificationUnreadCount() {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase.from("admin_notifications").select("id", { count: "exact", head: true }).eq("is_read", false);
    return error ? null : count || 0;
  } catch {
    return null;
  }
}

export async function getPrivacyRequests() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("privacy_requests").select("id,full_name,email,request_type,details,status,admin_notes,identity_verified_at,created_at,updated_at").order("created_at", { ascending: false }).limit(200);
    return error ? [] as PrivacyRequest[] : (data || []) as PrivacyRequest[];
  } catch {
    return [] as PrivacyRequest[];
  }
}

export async function getOrderNotes(orderId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("order_notes").select("id,order_id,note,created_by,created_at").eq("order_id", orderId).order("created_at", { ascending: false });
    return error ? [] as OrderNote[] : (data || []) as OrderNote[];
  } catch {
    return [] as OrderNote[];
  }
}

export async function getOrderStatusEvents(orderId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("order_status_events").select("id,order_id,from_status,to_status,changed_by,created_at").eq("order_id", orderId).order("created_at", { ascending: true });
    return error ? [] as OrderStatusEvent[] : (data || []) as OrderStatusEvent[];
  } catch {
    return [] as OrderStatusEvent[];
  }
}

export async function getDashboardStats() {
  try {
    const supabase = await createClient();
    const [dashboardRpc, recentEnquiries, recentProducts] = await Promise.all([
      supabase.rpc("get_adarsh_admin_stats"),
      supabase.from("enquiries").select("id,name,phone,interested_in,status,created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("products").select("id,name,brand,is_published,created_at").order("created_at", { ascending: false }).limit(5),
    ]);
    let stats = dashboardRpc.data && typeof dashboardRpc.data === "object" ? dashboardRpc.data as Record<string, number> : null;
    let configured = !recentEnquiries.error && !recentProducts.error;
    if (!stats) {
      const [products, activeProducts, enquiries, newEnquiries, categories, orders, newOrders, processingOrders, shippedOrders, deliveredOrders, cancelledOrders, customers, unreadNotifications, revenue] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("enquiries").select("id", { count: "exact", head: true }),
        supabase.from("enquiries").select("id", { count: "exact", head: true }).in("status", ["New", "Unread"]),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["Pending", "New"]),
        supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["Confirmed", "Processing", "Packed"]),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "Shipped"),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "Delivered"),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "Cancelled"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
        supabase.from("admin_notifications").select("id", { count: "exact", head: true }).eq("is_read", false),
        supabase.from("orders").select("total").eq("payment_status", "paid").neq("status", "Cancelled"),
      ]);
      configured = configured && !products.error && !activeProducts.error && !enquiries.error && !categories.error;
      const orderResult = revenue.error ? [] : revenue.data || [];
      stats = {
        total_products: products.count || 0, active_products: activeProducts.count || 0,
        total_enquiries: enquiries.count || 0, new_enquiries: newEnquiries.count || 0, total_categories: categories.count || 0,
        total_revenue: orderResult.reduce((sum, order) => sum + Number(order.total || 0), 0),
        total_orders: orders.count || 0, new_orders: newOrders.count || 0, processing_orders: processingOrders.count || 0,
        shipped_orders: shippedOrders.count || 0, delivered_orders: deliveredOrders.count || 0, cancelled_orders: cancelledOrders.count || 0,
        unread_enquiries: newEnquiries.count || 0, registered_customers: customers.count || 0, unread_notifications: unreadNotifications.count || 0,
      };
    }
    return {
      configured,
      realtimeConfigured: !dashboardRpc.error,
      totalRevenue: Number(stats.total_revenue || 0),
      totalOrders: Number(stats.total_orders || 0),
      newOrders: Number(stats.new_orders || 0),
      processingOrders: Number(stats.processing_orders || 0),
      shippedOrders: Number(stats.shipped_orders || 0),
      deliveredOrders: Number(stats.delivered_orders || 0),
      cancelledOrders: Number(stats.cancelled_orders || 0),
      unreadEnquiries: Number(stats.unread_enquiries || 0),
      registeredCustomers: Number(stats.registered_customers || 0),
      unreadNotifications: Number(stats.unread_notifications || 0),
      products: Number(stats.total_products || 0),
      activeProducts: Number(stats.active_products || 0),
      enquiries: Number(stats.total_enquiries || 0),
      newEnquiries: Number(stats.new_enquiries || 0),
      categories: Number(stats.total_categories || 0),
      recentEnquiries: (recentEnquiries.data || []) as Pick<Enquiry, "id" | "name" | "phone" | "interested_in" | "status" | "created_at">[],
      recentProducts: (recentProducts.data || []) as Pick<Product, "id" | "name" | "brand" | "is_published" | "created_at">[],
    };
  } catch {
    return { configured: false, realtimeConfigured: false, totalRevenue: 0, totalOrders: 0, newOrders: 0, processingOrders: 0, shippedOrders: 0, deliveredOrders: 0, cancelledOrders: 0, unreadEnquiries: 0, registeredCustomers: 0, unreadNotifications: 0, products: 0, activeProducts: 0, enquiries: 0, newEnquiries: 0, categories: 0, recentEnquiries: [], recentProducts: [] };
  }
}



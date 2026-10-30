export type Product = {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  category_id: string | null;
  price: number | null;
  compare_at_price: number | null;
  availability: string;
  image_url: string | null;
  image_urls: string[];
  specifications: Record<string, string>;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  categories?: { name: string; slug: string } | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Enquiry = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  interested_in: string | null;
  message: string;
  status: "New" | "Contacted" | "In Progress" | "Completed";
  created_at: string;
};

export type Testimonial = {
  id: string;
  customer_name: string;
  company: string | null;
  quote: string;
  rating: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type Profile = { id: string; email: string; role: string; created_at: string };

export type DiscountCode = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  amount: number;
  minimum_subtotal: number;
  maximum_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerDetails = {
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  updated_at: string;
};

export type OrderItem = {
  id?: string;
  product_id: string | null;
  product_name: string;
  brand: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type Order = {
  id: string;
  reference: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_address: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  notes: string | null;
  subtotal: number;
  discount_amount: number;
  discount_code: string | null;
  total: number;
  status: "Pending" | "WhatsApp Contacted" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  created_at: string;
  updated_at?: string;
  order_items?: OrderItem[];
};

export type Product = {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  category_id: string | null;
  price: number | null;
  availability: string;
  image_url: string | null;
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

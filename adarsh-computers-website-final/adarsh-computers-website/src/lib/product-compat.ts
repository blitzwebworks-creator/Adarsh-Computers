import type { Product } from "@/lib/types";

export const productFields = "id,name,brand,description,category_id,price,compare_at_price,stock_quantity,availability,image_url,image_urls,specifications,is_published,is_featured,created_at,updated_at,categories(name,slug)";
export const legacyProductFields = "id,name,brand,description,category_id,price,availability,image_url,is_published,is_featured,created_at,updated_at,categories(name,slug)";
export const productClientFields = "id,name,brand,description,category_id,price,compare_at_price,stock_quantity,availability,image_url,image_urls,specifications,is_published,is_featured,created_at,updated_at";
export const legacyProductClientFields = "id,name,brand,description,category_id,price,availability,image_url,is_published,is_featured,created_at,updated_at";

const optionalProductColumns = ["compare_at_price", "stock_quantity", "image_urls", "specifications"];

export function isMissingOptionalProductColumn(error: { code?: string | null; message?: string | null } | null | undefined) {
  if (!error || (error.code !== "42703" && error.code !== "PGRST204")) return false;
  const message = error.message?.toLowerCase() || "";
  return optionalProductColumns.some((column) => message.includes(column));
}

export function normalizeProductRow(row: Partial<Product> & Pick<Product, "id" | "name">): Product {
  return {
    ...row,
    compare_at_price: row.compare_at_price ?? null,
    stock_quantity: row.stock_quantity ?? null,
    image_urls: Array.isArray(row.image_urls) ? row.image_urls : [],
    specifications: row.specifications && typeof row.specifications === "object" ? row.specifications : {},
  } as Product;
}

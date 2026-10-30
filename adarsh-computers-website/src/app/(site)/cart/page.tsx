import type { Metadata } from "next";
import { CartPageClient } from "@/components/site/CartPageClient";

export const metadata: Metadata = { title: "Your Cart", description: "Review products and prepare an order with Adarsh Computers." };

export default function CartPage() {
  return <section className="cart-section"><div className="container"><CartPageClient /></div></section>;
}

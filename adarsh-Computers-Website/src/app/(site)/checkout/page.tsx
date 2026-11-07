import type { Metadata } from "next";
import { CheckoutClient } from "@/components/site/CheckoutClient";
import { requireCustomer } from "@/lib/auth";
import { getCustomerDetails } from "@/lib/data";

export const metadata: Metadata = { title: "Checkout", description: "Enter delivery details and prepare your Adarsh Computers order for WhatsApp." };
type SearchParams = Promise<{ discount?: string }>;

export default async function CheckoutPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { user } = await requireCustomer("/checkout" + (params.discount ? "?discount=" + encodeURIComponent(params.discount) : ""));
  const details = await getCustomerDetails(user.id);
  return <section className="checkout-section"><div className="container"><CheckoutClient initialDetails={details} initialDiscountCode={params.discount || ""} /></div></section>;
}

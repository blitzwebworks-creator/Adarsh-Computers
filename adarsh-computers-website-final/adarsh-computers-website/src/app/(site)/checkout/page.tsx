import type { Metadata } from "next";
import { CheckoutClient } from "@/components/site/CheckoutClient";
import { createClient } from "@/lib/supabase/server";
import { getCustomerDetails } from "@/lib/data";

export const metadata: Metadata = { title: "Checkout", description: "Enter delivery details and prepare your Adarsh Computers order for WhatsApp." };
type SearchParams = Promise<{ discount?: string }>;

export default async function CheckoutPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : null;
  const details = user && profile?.data?.role === "customer" ? await getCustomerDetails(user.id) : null;
  return <section className="checkout-section"><div className="container"><CheckoutClient initialDetails={details} initialDiscountCode={params.discount || ""} /></div></section>;
}

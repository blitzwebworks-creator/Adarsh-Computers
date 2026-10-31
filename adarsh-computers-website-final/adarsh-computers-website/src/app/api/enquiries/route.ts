import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30).refine((value) => value.replace(/\D/g, "").length >= 7),
  email: z.union([z.email(), z.literal("")]).optional(),
  interested_in: z.string().trim().max(160).optional(),
  message: z.string().trim().min(10).max(4000),
});

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid form submission." }, { status: 400 }); }
  if (body && typeof body === "object" && "website" in body && typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ success: true });
  }
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the form fields and try again." }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.from("enquiries").insert({
    name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
    interested_in: parsed.data.interested_in || null,
    message: parsed.data.message,
    status: "New",
  });
  if (error) return NextResponse.json({ error: "We could not save your enquiry. Please call the store instead." }, { status: 503 });
  return NextResponse.json({ success: true });
}

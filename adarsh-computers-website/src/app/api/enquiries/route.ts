import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { PRIVACY_NOTICE_VERSION } from "@/lib/privacy";
import { readJsonBody } from "@/lib/http";

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30).refine((value) => value.replace(/\D/g, "").length >= 7),
  email: z.union([z.email(), z.literal("")]).optional(),
  interested_in: z.string().trim().max(160).optional(),
  message: z.string().trim().min(10).max(4000),
  privacy_consent: z.literal("on"),
  privacy_notice_version: z.literal(PRIVACY_NOTICE_VERSION),
});

export async function POST(request: Request) {
  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
  const body = parsedBody.value;
  if (body && typeof body === "object" && "website" in body && typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ success: true });
  }
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the form fields and try again." }, { status: 400 });

  const clientKey = request.headers.get("x-real-ip")
    || request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown-client";
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.rpc("submit_adarsh_enquiry", {
      p_name: parsed.data.name,
      p_phone: parsed.data.phone,
      p_email: parsed.data.email || "",
      p_interested_in: parsed.data.interested_in || "",
      p_message: parsed.data.message,
      p_client_key: clientKey,
      p_privacy_consent: true,
      p_notice_version: parsed.data.privacy_notice_version,
    });
    if (error) {
      console.error("[enquiry] Intake failed:", error.code);
      return NextResponse.json({ error: "We could not save your enquiry. Please call the store instead." }, { status: 503 });
    }
    if (!data) return NextResponse.json({ error: "Too many enquiries from this connection. Please try again later." }, { status: 429 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "We could not save your enquiry. Please call the store instead." }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { PRIVACY_NOTICE_VERSION } from "@/lib/privacy";
import { readJsonBody } from "@/lib/http";

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  request_type: z.enum(["Access a copy", "Correct details", "Delete account or details", "Withdraw consent", "Other privacy concern"]),
  details: z.string().trim().min(10).max(2000),
  privacy_consent: z.literal("on"),
  privacy_notice_version: z.literal(PRIVACY_NOTICE_VERSION),
});

function clientKey(request: Request) {
  return request.headers.get("x-real-ip")
    || request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown-client";
}

export async function POST(request: Request) {
  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) return NextResponse.json({ error: "Please review the request form and try again." }, { status: 400 });
  const body = parsedBody.value;
  if (body && typeof body === "object" && "website" in body && typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ success: true });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please complete each required field." }, { status: 400 });

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.rpc("submit_adarsh_privacy_request", {
      p_full_name: parsed.data.full_name,
      p_email: parsed.data.email,
      p_request_type: parsed.data.request_type,
      p_details: parsed.data.details,
      p_client_key: clientKey(request),
      p_privacy_consent: true,
      p_notice_version: parsed.data.privacy_notice_version,
    });
    if (error) {
      console.error("[privacy-request] Intake failed:", error.code);
      return NextResponse.json({ error: "The request form is temporarily unavailable. Please contact the store." }, { status: 503 });
    }
    if (!data) return NextResponse.json({ error: "Too many requests from this connection. Please try again later." }, { status: 429 });
    return NextResponse.json({ success: true, request_id: data });
  } catch {
    return NextResponse.json({ error: "The request form is temporarily unavailable. Please contact the store." }, { status: 503 });
  }
}

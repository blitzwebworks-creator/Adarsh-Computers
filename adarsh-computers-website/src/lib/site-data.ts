import { createClient } from "@/lib/supabase/server";

export type BusinessSettings = {
  name?: string;
  owner?: string;
  email?: string;
  phone?: string;
  secondary_phone?: string;
  address?: string;
  gstin?: string;
  whatsapp?: string;
  brands?: string[];
  map_url?: string;
  logo_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
};
export type HomeSettings = { headline?: string; description?: string; tagline?: string };
export type AboutSettings = { description?: string; story?: string };
export type SiteSettings = { business: BusinessSettings | null; home: HomeSettings | null; about: AboutSettings | null };

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("site_settings").select("key,value").eq("is_public", true);
    if (error) return { business: null, home: null, about: null };
    const settings = Object.fromEntries((data || []).map((row) => [row.key, row.value])) as Record<string, unknown>;
    return {
      business: (settings.business as BusinessSettings) || null,
      home: (settings.home as HomeSettings) || null,
      about: (settings.about as AboutSettings) || null,
    };
  } catch {
    return { business: null, home: null, about: null };
  }
}



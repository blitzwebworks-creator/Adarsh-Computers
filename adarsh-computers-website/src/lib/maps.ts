import type { BusinessSettings } from "@/lib/site-data";

export const BUSINESS_MAP_URL = "https://maps.app.goo.gl/ys6mLm71Rk6hENJr9";
const previousBusinessMapUrl = "https://maps.google.com/?q=203%2C%20Osian%20Building%2C%2012%2C%20Nehru%20Place%2C%20New%20Delhi%20110019";

export function getBusinessMapUrl(business: BusinessSettings | null) {
  const savedUrl = business?.map_url?.trim();
  return !savedUrl || savedUrl === previousBusinessMapUrl ? BUSINESS_MAP_URL : savedUrl;
}

/** Use the current business record for the embed query; the shared link remains the authoritative place URL. */
export function getBusinessMapEmbedUrl(business: BusinessSettings | null) {
  const query = [business?.name, business?.address]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(", ");
  const params = new URLSearchParams({ output: "embed", q: query || getBusinessMapUrl(business) });
  return `https://www.google.com/maps?${params.toString()}`;
}

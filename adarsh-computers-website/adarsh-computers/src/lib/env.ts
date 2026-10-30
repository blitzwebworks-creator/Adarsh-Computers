export function getSupabaseEnv() {
  const url = process.env.https://gdxddzjzmceuogbktjgy.supabase.co;
  const key = process.env.sb_publishable_vqVbFPO_HH7HvmJfe_BTow_mOP57asu;
  if (!url || !key) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.");
  }
  return { url, key };
}

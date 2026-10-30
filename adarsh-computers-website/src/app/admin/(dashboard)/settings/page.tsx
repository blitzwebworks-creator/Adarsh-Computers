import { AdminNotice, AdminPageHeader, FormField } from "@/components/admin/AdminBits";
import { ImagePicker } from "@/components/site/ImagePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveSiteSettingsAction } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{ notice?: string; error?: string }>;
export default async function AdminSettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "business").maybeSingle();
  const business = (data?.value || {}) as Record<string, string | string[]>;
  const brands = Array.isArray(business.brands) ? business.brands.join(", ") : "";
  return <>
    <AdminPageHeader eyebrow="Business profile" title="Business settings" description="Update the business details used across your public website." />
    <AdminNotice notice={params.notice} error={params.error} />
    <section className="admin-panel surface admin-settings-panel"><form action={saveSiteSettingsAction} className="admin-form" encType="multipart/form-data">
      <input type="hidden" name="key" value="business" />
      <div className="admin-panel-heading"><div><span className="eyebrow">Public details</span><h2>Contact and identity</h2></div></div>
      <div className="admin-form-grid"><FormField label="Business name"><Input name="name" required maxLength={160} defaultValue={String(business.name || "")} /></FormField><FormField label="Owner"><Input name="owner" maxLength={120} defaultValue={String(business.owner || "")} /></FormField></div>
      <div className="admin-form-grid"><FormField label="Primary phone"><Input name="phone" type="tel" maxLength={30} defaultValue={String(business.phone || "")} /></FormField><FormField label="Alternate phone"><Input name="secondary_phone" type="tel" maxLength={30} defaultValue={String(business.secondary_phone || "")} /></FormField></div>
      <div className="admin-form-grid"><FormField label="Email"><Input name="email" type="email" maxLength={254} defaultValue={String(business.email || "")} /></FormField><FormField label="WhatsApp number"><Input name="whatsapp" type="tel" maxLength={30} defaultValue={String(business.whatsapp || "")} /></FormField></div>
      <FormField label="Business address"><Textarea name="address" maxLength={500} defaultValue={String(business.address || "")} /></FormField>
      <div className="admin-form-grid"><FormField label="Facebook URL"><Input name="facebook_url" type="url" maxLength={500} defaultValue={String(business.facebook_url || "")} /></FormField><FormField label="Instagram URL"><Input name="instagram_url" type="url" maxLength={500} defaultValue={String(business.instagram_url || "")} /></FormField><FormField label="LinkedIn URL"><Input name="linkedin_url" type="url" maxLength={500} defaultValue={String(business.linkedin_url || "")} /></FormField></div>
      <div className="admin-form-grid"><FormField label="GSTIN"><Input name="gstin" maxLength={20} defaultValue={String(business.gstin || "")} /></FormField><FormField label="Google Maps link"><Input name="map_url" type="url" maxLength={500} defaultValue={String(business.map_url || "")} /></FormField></div>
      <FormField label="Associated brands" hint="Separate each brand with a comma."><Input name="brands" maxLength={500} defaultValue={brands} /></FormField>
      <div className="admin-field"><span>Business logo</span><ImagePicker currentImage={String(business.logo_url || "") || null} /></div>
      <Button type="submit">Save business settings</Button>
    </form></section>
  </>;
}



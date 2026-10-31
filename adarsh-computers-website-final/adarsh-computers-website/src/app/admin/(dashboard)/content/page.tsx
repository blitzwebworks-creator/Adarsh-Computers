import { AdminNotice, AdminPageHeader, FormField } from "@/components/admin/AdminBits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveSiteSettingsAction } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{ notice?: string; error?: string }>;
export default async function AdminContentPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("key,value").in("key", ["home", "about"]);
  const settings = Object.fromEntries((data || []).map((item) => [item.key, item.value])) as Record<string, Record<string, string>>;
  const home = settings.home || {};
  const about = settings.about || {};
  return <>
    <AdminPageHeader eyebrow="Website" title="Website content" description="Edit the content used by your homepage and About page." />
    <AdminNotice notice={params.notice} error={params.error} />
    <div className="admin-form-grid admin-content-grid">
      <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">Homepage</span><h2>Hero content</h2></div></div>
        <form action={saveSiteSettingsAction} className="admin-form"><input type="hidden" name="key" value="home" /><FormField label="Headline"><Input name="headline" required maxLength={180} defaultValue={home.headline || ""} /></FormField><FormField label="Description"><Textarea name="description" required maxLength={700} defaultValue={home.description || ""} /></FormField><FormField label="Tagline"><Input name="tagline" maxLength={160} defaultValue={home.tagline || ""} /></FormField><Button type="submit">Save homepage content</Button></form>
      </section>
      <section className="admin-panel surface"><div className="admin-panel-heading"><div><span className="eyebrow">About</span><h2>Business introduction</h2></div></div>
        <form action={saveSiteSettingsAction} className="admin-form"><input type="hidden" name="key" value="about" /><FormField label="Short introduction"><Textarea name="description" required maxLength={700} defaultValue={about.description || ""} /></FormField><FormField label="About text"><Textarea name="story" required maxLength={2500} defaultValue={about.story || ""} /></FormField><Button type="submit">Save About content</Button></form>
      </section>
    </div>
  </>;
}

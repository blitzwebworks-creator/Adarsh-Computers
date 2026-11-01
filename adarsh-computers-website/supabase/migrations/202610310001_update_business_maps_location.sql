-- Update only the existing public business map URL; preserve every other setting.
update public.site_settings
set value = jsonb_set(
  value,
  '{map_url}',
  to_jsonb('https://maps.app.goo.gl/ys6mLm71Rk6hENJr9'::text),
  true
)
where key = 'business'
  and jsonb_typeof(value) = 'object'
  and value->>'map_url' is distinct from 'https://maps.app.goo.gl/ys6mLm71Rk6hENJr9';

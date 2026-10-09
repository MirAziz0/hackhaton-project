-- Growenta: demo seed data.
-- Run in the Supabase SQL editor AFTER supabase/migrations/0001_init.sql. Safe to re-run.
--
-- Demo login:  demo@launchlens.az  /  demo12345
-- All seeded users share the same password.

-- ---------------------------------------------------------------------------
-- 1. Demo auth users (the trigger on auth.users creates their profile rows)
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('demo12345', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', u.full_name), now(), now(),
  '', '', '', ''
from (values
  ('00000000-0000-4000-8000-000000000001'::uuid, 'demo@launchlens.az',    'Aysel Məmmədova'),
  ('00000000-0000-4000-8000-000000000002'::uuid, 'leyla@launchlens.az',   'Leyla Həsənova'),
  ('00000000-0000-4000-8000-000000000003'::uuid, 'rauf@launchlens.az',    'Rauf Əliyev'),
  ('00000000-0000-4000-8000-000000000004'::uuid, 'nigar@launchlens.az',   'Nigar Quliyeva'),
  ('00000000-0000-4000-8000-000000000005'::uuid, 'elvin@launchlens.az',   'Elvin Hüseynov'),
  ('00000000-0000-4000-8000-000000000006'::uuid, 'gunel@launchlens.az',   'Günel İsmayılova'),
  ('00000000-0000-4000-8000-000000000007'::uuid, 'tural@launchlens.az',   'Tural Babayev'),
  ('00000000-0000-4000-8000-000000000008'::uuid, 'sevinc@launchlens.az',  'Sevinc Rəhimova'),
  ('00000000-0000-4000-8000-000000000009'::uuid, 'kamran@launchlens.az',  'Kamran Nəsirov'),
  ('00000000-0000-4000-8000-000000000010'::uuid, 'fidan@launchlens.az',   'Fidan Abbasova'),
  ('00000000-0000-4000-8000-000000000011'::uuid, 'orxan@launchlens.az',   'Orxan Məlikov'),
  ('00000000-0000-4000-8000-000000000012'::uuid, 'aynur@launchlens.az',   'Aynur Kərimova')
) as u (id, email, full_name)
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now(), now(), now()
from auth.users u
where u.email like '%@launchlens.az'
on conflict (provider_id, provider) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Profiles
-- ---------------------------------------------------------------------------

insert into public.profiles (
  id, full_name, track, stage, city, budget_range, products, target_customer, bio,
  looking_for, onboarding_completed
)
values
  ('00000000-0000-4000-8000-000000000001', 'Aysel Məmmədova', 'cosmetics', 'operating', 'Bakı, Nəsimi', '20k_50k',
   'Təbii tərkibli üz kremləri, sabunlar və hədiyyə dəstləri',
   '20–40 yaş arası, təbii məhsullara üstünlük verən qadınlar',
   'Nur Cosmetics-in qurucusuyam. Yerli bitkilərdən təbii kosmetika hazırlayırıq.',
   '{supplier,investor}', true),
  ('00000000-0000-4000-8000-000000000002', 'Leyla Həsənova', 'cosmetics', 'operating', 'Bakı, Yasamal', '50k_100k',
   'Bitki yağları, efir yağları və kosmetik xammal topdan satışı',
   'Kiçik kosmetika istehsalçıları və salonlar',
   'Kosmetika xammalı idxalı və topdan satışı ilə 6 ildir məşğulam.',
   '{customers,partner}', true),
  ('00000000-0000-4000-8000-000000000003', 'Rauf Əliyev', 'cosmetics', 'plan_ready', 'Gəncə', '5k_20k',
   'Kişilər üçün saqqal və dəri baxım məhsulları',
   '22–45 yaş arası şəhərli kişilər',
   'Gəncədə kişi baxım brendi qurmağa hazırlaşıram, planım hazırdır.',
   '{investor,mentor}', true),
  ('00000000-0000-4000-8000-000000000004', 'Nigar Quliyeva', 'cosmetics', 'idea', 'Onlayn', 'under_5k',
   'Əl işi sabunlar və vanna bombaları',
   'Instagram istifadəçiləri, hədiyyə axtaranlar',
   'Evdə əl işi sabunlar hazırlayıram, bunu onlayn biznesə çevirmək istəyirəm.',
   '{mentor,supplier}', true),
  ('00000000-0000-4000-8000-000000000005', 'Elvin Hüseynov', 'food', 'operating', 'Bakı, Səbail', '50k_100k',
   'Spesialti qəhvə və səhər yeməyi menyusu',
   'Ofis işçiləri və tələbələr',
   'İçərişəhər yaxınlığında kiçik qəhvəxana işlədirəm, ikinci filial açmaq istəyirəm.',
   '{investor,partner}', true),
  ('00000000-0000-4000-8000-000000000006', 'Günel İsmayılova', 'food', 'idea', 'Sumqayıt', '5k_20k',
   'Sağlam qidalanma üçün hazır yemək çatdırılması',
   'İdmanla məşğul olan 25–40 yaşlı insanlar',
   'Dietoloqam, sağlam yemək çatdırılması xidməti qurmaq istəyirəm.',
   '{partner,mentor}', true),
  ('00000000-0000-4000-8000-000000000007', 'Tural Babayev', 'food', 'plan_ready', 'Şəki', '20k_50k',
   'Şəki halvası və milli şirniyyatların qablaşdırılmış satışı',
   'Turistlər və onlayn sifariş verənlər',
   'Ailə reseptlərimizi brendləşdirib bütün ölkəyə çatdırmaq istəyirəm.',
   '{investor,customers}', true),
  ('00000000-0000-4000-8000-000000000008', 'Sevinc Rəhimova', 'clothing', 'operating', 'Bakı, Nərimanov', '20k_50k',
   'Qadınlar üçün yerli istehsal gündəlik geyim',
   '18–35 yaş arası qadınlar',
   'Öz atelyem və kiçik mağazam var, onlayn satışı böyütmək istəyirəm.',
   '{customers,partner}', true),
  ('00000000-0000-4000-8000-000000000009', 'Kamran Nəsirov', 'clothing', 'idea', 'Onlayn', 'under_5k',
   'Çap edilmiş futbolka və hudilər',
   'Gənclər və korporativ sifarişçilər',
   'Dizaynerəm, öz geyim xəttimi başlamaq istəyirəm.',
   '{supplier,mentor}', true),
  ('00000000-0000-4000-8000-000000000010', 'Fidan Abbasova', 'it_services', 'operating', 'Bakı, Xətai', '5k_20k',
   'Kiçik bizneslər üçün veb-sayt, onlayn mağaza və SMM',
   'Onlayn satışa keçmək istəyən kiçik bizneslər',
   'Rəqəmsal agentliyimiz 40-dan çox yerli brendə onlayn mağaza qurub.',
   '{customers,partner}', true),
  ('00000000-0000-4000-8000-000000000011', 'Orxan Məlikov', 'it_services', 'plan_ready', 'Bakı, Yasamal', '20k_50k',
   'Restoranlar üçün sifariş və anbar idarəetmə proqramı',
   'Kafe və restoran sahibləri',
   'Proqramçıyam, HoReCa sektoru üçün SaaS məhsulu hazırlayıram.',
   '{investor,customers}', true),
  ('00000000-0000-4000-8000-000000000012', 'Aynur Kərimova', 'education', 'operating', 'Bakı, Nəsimi', '5k_20k',
   'Sahibkarlar üçün maliyyə savadlılığı və marketinq təlimləri',
   'Yeni başlayan sahibkarlar',
   '10 illik bank təcrübəsi olan biznes mentoruyam, KOB-lara məsləhət verirəm.',
   '{customers,partner}', true)
on conflict (id) do update set
  full_name = excluded.full_name,
  track = excluded.track,
  stage = excluded.stage,
  city = excluded.city,
  budget_range = excluded.budget_range,
  products = excluded.products,
  target_customer = excluded.target_customer,
  bio = excluded.bio,
  looking_for = excluded.looking_for,
  onboarding_completed = excluded.onboarding_completed;

-- ---------------------------------------------------------------------------
-- 3. Market data
--
-- !!! DEMO DATA !!!
-- These figures are illustrative placeholders, NOT real statistics.
-- Before the pitch, replace value / year / source_name / source_url with real
-- figures from stat.gov.az (State Statistical Committee) and the World Bank.
-- ---------------------------------------------------------------------------

delete from public.market_data where source_name like 'DEMO%';

insert into public.market_data (sector, region, metric, value, unit, year, source_name, source_url)
values
  -- cosmetics
  ('cosmetics', 'baku',    'Bazar həcmi',                      310,  'mln AZN',  2024, 'DEMO — stat.gov.az (əvəz edin)', 'https://www.stat.gov.az/'),
  ('cosmetics', 'baku',    'İllik artım tempi',                7.5,  '%',        2024, 'DEMO — stat.gov.az (əvəz edin)', 'https://www.stat.gov.az/'),
  ('cosmetics', 'baku',    'Orta kommersiya icarəsi',          45,   'AZN/m²/ay', 2024, 'DEMO — əmlak bazarı icmalı (əvəz edin)', 'https://example.com/replace-me'),
  ('cosmetics', 'baku',    'Orta çek',                         38,   'AZN',      2024, 'DEMO — sorğu nəticəsi (əvəz edin)', 'https://example.com/replace-me'),
  ('cosmetics', 'regions', 'Bazar həcmi',                      95,   'mln AZN',  2024, 'DEMO — stat.gov.az (əvəz edin)', 'https://www.stat.gov.az/'),
  ('cosmetics', 'regions', 'İllik artım tempi',                5.2,  '%',        2024, 'DEMO — stat.gov.az (əvəz edin)', 'https://www.stat.gov.az/'),
  ('cosmetics', 'regions', 'Orta kommersiya icarəsi',          14,   'AZN/m²/ay', 2024, 'DEMO — əmlak bazarı icmalı (əvəz edin)', 'https://example.com/replace-me'),
  ('cosmetics', 'online',  'Onlayn satışların payı',           12,   '%',        2024, 'DEMO — World Bank (əvəz edin)', 'https://data.worldbank.org/country/azerbaijan'),
  ('cosmetics', 'online',  'Onlayn satışların illik artımı',   21,   '%',        2024, 'DEMO — World Bank (əvəz edin)', 'https://data.worldbank.org/country/azerbaijan'),
  ('cosmetics', 'online',  'Orta çatdırılma xərci',            4,    'AZN',      2024, 'DEMO — sorğu nəticəsi (əvəz edin)', 'https://example.com/replace-me'),

  -- food
  ('food', 'baku',    'Bazar həcmi',                      2850, 'mln AZN',  2024, 'DEMO — stat.gov.az (əvəz edin)', 'https://www.stat.gov.az/'),
  ('food', 'baku',    'İllik artım tempi',                6.1,  '%',        2024, 'DEMO — stat.gov.az (əvəz edin)', 'https://www.stat.gov.az/'),
  ('food', 'baku',    'Orta kommersiya icarəsi',          55,   'AZN/m²/ay', 2024, 'DEMO — əmlak bazarı icmalı (əvəz edin)', 'https://example.com/replace-me'),
  ('food', 'baku',    'Orta çek',                         22,   'AZN',      2024, 'DEMO — sorğu nəticəsi (əvəz edin)', 'https://example.com/replace-me'),
  ('food', 'regions', 'Bazar həcmi',                      1400, 'mln AZN',  2024, 'DEMO — stat.gov.az (əvəz edin)', 'https://www.stat.gov.az/'),
  ('food', 'regions', 'İllik artım tempi',                4.3,  '%',        2024, 'DEMO — stat.gov.az (əvəz edin)', 'https://www.stat.gov.az/'),
  ('food', 'regions', 'Orta kommersiya icarəsi',          16,   'AZN/m²/ay', 2024, 'DEMO — əmlak bazarı icmalı (əvəz edin)', 'https://example.com/replace-me'),
  ('food', 'online',  'Onlayn sifarişlərin payı',         9,    '%',        2024, 'DEMO — World Bank (əvəz edin)', 'https://data.worldbank.org/country/azerbaijan'),
  ('food', 'online',  'Onlayn sifarişlərin illik artımı', 28,   '%',        2024, 'DEMO — World Bank (əvəz edin)', 'https://data.worldbank.org/country/azerbaijan'),
  ('food', 'online',  'Çatdırılma platforması komissiyası', 25, '%',        2024, 'DEMO — sorğu nəticəsi (əvəz edin)', 'https://example.com/replace-me'),

  -- clothing
  ('clothing', 'baku',    'Bazar həcmi',                    1250, 'mln AZN',  2024, 'DEMO — stat.gov.az (əvəz edin)', 'https://www.stat.gov.az/'),
  ('clothing', 'baku',    'İllik artım tempi',              4.8,  '%',        2024, 'DEMO — stat.gov.az (əvəz edin)', 'https://www.stat.gov.az/'),
  ('clothing', 'baku',    'Orta kommersiya icarəsi',        50,   'AZN/m²/ay', 2024, 'DEMO — əmlak bazarı icmalı (əvəz edin)', 'https://example.com/replace-me'),
  ('clothing', 'baku',    'Orta çek',                       65,   'AZN',      2024, 'DEMO — sorğu nəticəsi (əvəz edin)', 'https://example.com/replace-me'),
  ('clothing', 'regions', 'Bazar həcmi',                    520,  'mln AZN',  2024, 'DEMO — stat.gov.az (əvəz edin)', 'https://www.stat.gov.az/'),
  ('clothing', 'regions', 'İllik artım tempi',              3.4,  '%',        2024, 'DEMO — stat.gov.az (əvəz edin)', 'https://www.stat.gov.az/'),
  ('clothing', 'regions', 'Orta kommersiya icarəsi',        15,   'AZN/m²/ay', 2024, 'DEMO — əmlak bazarı icmalı (əvəz edin)', 'https://example.com/replace-me'),
  ('clothing', 'online',  'Onlayn satışların payı',         15,   '%',        2024, 'DEMO — World Bank (əvəz edin)', 'https://data.worldbank.org/country/azerbaijan'),
  ('clothing', 'online',  'Onlayn satışların illik artımı', 24,   '%',        2024, 'DEMO — World Bank (əvəz edin)', 'https://data.worldbank.org/country/azerbaijan'),
  ('clothing', 'online',  'Geri qaytarma nisbəti',          11,   '%',        2024, 'DEMO — sorğu nəticəsi (əvəz edin)', 'https://example.com/replace-me'),

  -- it_services
  ('it_services', 'baku',    'Bazar həcmi',                     980,  'mln AZN', 2024, 'DEMO — stat.gov.az (əvəz edin)', 'https://www.stat.gov.az/'),
  ('it_services', 'baku',    'İllik artım tempi',               13.5, '%',       2024, 'DEMO — stat.gov.az (əvəz edin)', 'https://www.stat.gov.az/'),
  ('it_services', 'baku',    'Orta aylıq əməkhaqqı',            2100, 'AZN',     2024, 'DEMO — stat.gov.az (əvəz edin)', 'https://www.stat.gov.az/'),
  ('it_services', 'baku',    'Orta ofis icarəsi',               30,   'AZN/m²/ay', 2024, 'DEMO — əmlak bazarı icmalı (əvəz edin)', 'https://example.com/replace-me'),
  ('it_services', 'regions', 'Bazar həcmi',                     110,  'mln AZN', 2024, 'DEMO — stat.gov.az (əvəz edin)', 'https://www.stat.gov.az/'),
  ('it_services', 'regions', 'İllik artım tempi',               9.0,  '%',       2024, 'DEMO — stat.gov.az (əvəz edin)', 'https://www.stat.gov.az/'),
  ('it_services', 'regions', 'Orta aylıq əməkhaqqı',            1100, 'AZN',     2024, 'DEMO — stat.gov.az (əvəz edin)', 'https://www.stat.gov.az/'),
  ('it_services', 'online',  'İnternet istifadəçilərinin payı', 88,   '%',       2024, 'DEMO — World Bank (əvəz edin)', 'https://data.worldbank.org/country/azerbaijan'),
  ('it_services', 'online',  'Xidmət ixracının illik artımı',   18,   '%',       2024, 'DEMO — World Bank (əvəz edin)', 'https://data.worldbank.org/country/azerbaijan'),
  ('it_services', 'online',  'Veb-saytı olan KOB-ların payı',   34,   '%',       2024, 'DEMO — sorğu nəticəsi (əvəz edin)', 'https://example.com/replace-me');

-- ---------------------------------------------------------------------------
-- 4. Demo business: Nur Cosmetics
-- ---------------------------------------------------------------------------

insert into public.businesses (id, owner_id, name, idea_text, plan, financial_forecast, locations, branding)
values (
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'Nur Cosmetics',
  'Azərbaycanın yerli bitkilərindən (nar, itburnu, çobanyastığı) hazırlanan təbii kosmetika brendi. Bakıda kiçik mağaza və onlayn satış.',
  $json${
    "summary": "Nur Cosmetics yerli bitkilərdən hazırlanan təbii dəri baxım məhsulları təklif edən butik brenddir. Bakının mərkəzində kiçik mağaza və Instagram üzərindən onlayn satışla fəaliyyət göstərir.",
    "products": [
      {"name": "Nar çəyirdəyi üz kremi", "description": "Nəmləndirici gündəlik krem, 50 ml", "price_azn": 32},
      {"name": "İtburnu yağı serumu", "description": "Qidalandırıcı gecə serumu, 30 ml", "price_azn": 45},
      {"name": "Çobanyastığı sabunu", "description": "Əl işi təbii sabun, 100 q", "price_azn": 9},
      {"name": "Hədiyyə dəsti", "description": "Krem, serum və sabundan ibarət qutu", "price_azn": 79}
    ],
    "target_audience": "Bakıda yaşayan, 20–40 yaş arası, təbii və yerli məhsullara üstünlük verən orta və yuxarı-orta gəlirli qadınlar.",
    "pricing_strategy": "Orta-premium seqment: idxal olunan təbii brendlərdən 15–20% ucuz, kütləvi bazar məhsullarından isə baha. Hədiyyə dəstləri ilə orta çek artırılır.",
    "marketing_plan": [
      "Instagram və TikTok-da məhsulun hazırlanma prosesini göstərən qısa videolar",
      "Yerli mikro-influenserlərlə əməkdaşlıq",
      "Mağazada pulsuz dəri tipi konsultasiyası",
      "Sadiqlik kartı: hər 5-ci alışda 20% endirim"
    ],
    "roadmap": [
      {"month": 1, "title": "Hazırlıq", "tasks": ["Sertifikatlaşdırma", "Təchizatçılarla müqavilələr", "Mağazanın təmiri"]},
      {"month": 2, "title": "Açılış", "tasks": ["Mağazanın açılışı", "Instagram kampaniyası", "İlk 100 müştəri"]},
      {"month": 3, "title": "Onlayn satış", "tasks": ["Onlayn sifariş sistemi", "Bakı daxili çatdırılma"]},
      {"month": 4, "title": "Çeşidin genişləndirilməsi", "tasks": ["Saç baxım xətti", "Hədiyyə dəstləri"]},
      {"month": 5, "title": "Tərəfdaşlıqlar", "tasks": ["Gözəllik salonları ilə əməkdaşlıq", "Korporativ hədiyyə sifarişləri"]},
      {"month": 6, "title": "Böyümə", "tasks": ["Regionlara çatdırılma", "İkinci satış nöqtəsinin araşdırılması"]}
    ],
    "extra_ideas": {
      "campaigns": ["8 Mart üçün xüsusi hədiyyə qutuları", "\"Boş qabı gətir, endirim qazan\" ekoloji kampaniyası"],
      "social_posts": ["Tərkib hissələrinin hekayəsi: Göyçay narı", "Müştəri rəyləri ilə \"əvvəl və sonra\" seriyası"],
      "popup_store": "Həftəsonları Dənizkənarı Milli Parkda və ticarət mərkəzlərində pop-up stend."
    }
  }$json$::jsonb,
  $json${
    "startup_costs": [
      {"item": "Mağazanın təmiri və avadanlıq", "amount": 9000},
      {"item": "İlkin mal ehtiyatı", "amount": 7000},
      {"item": "Sertifikatlaşdırma və qeydiyyat", "amount": 1500},
      {"item": "Brendinq və qablaşdırma", "amount": 2500},
      {"item": "Açılış marketinqi", "amount": 2000}
    ],
    "monthly_costs": [
      {"item": "İcarə", "amount": 1800},
      {"item": "Maaş", "amount": 2400},
      {"item": "Mal alışı", "amount": 2800},
      {"item": "Marketinq", "amount": 1000},
      {"item": "Kommunal", "amount": 230}
    ],
    "monthly_projection": [
      {"month": 1, "revenue": 9000,  "costs": 8230},
      {"month": 2, "revenue": 10500, "costs": 8230},
      {"month": 3, "revenue": 12000, "costs": 8430},
      {"month": 4, "revenue": 13000, "costs": 8630},
      {"month": 5, "revenue": 14000, "costs": 8830},
      {"month": 6, "revenue": 15000, "costs": 9030}
    ],
    "break_even_month": 6
  }$json$::jsonb,
  $json$[
    {"name": "Nizami küçəsi (Tarqovı)", "lat": 40.3725, "lng": 49.8370, "reason": "Yüksək piyada axını və turist sıxlığı, premium mövqeləndirmə üçün uyğundur.", "estimated_rent_azn": 3500, "fit_score": 82},
    {"name": "28 May ətrafı", "lat": 40.3795, "lng": 49.8486, "reason": "Metro və ticarət mərkəzinə yaxın, hədəf auditoriyanın gündəlik keçid nöqtəsi.", "estimated_rent_azn": 2000, "fit_score": 90},
    {"name": "Gənclik", "lat": 40.4003, "lng": 49.8514, "reason": "Gənc auditoriya, ticarət mərkəzi yaxınlığı və nisbətən aşağı icarə.", "estimated_rent_azn": 1600, "fit_score": 76}
  ]$json$::jsonb,
  $json${
    "name_ideas": ["Nur Cosmetics", "Nar & Nur", "Təbiət Nuru"],
    "slogans": ["Təbiətdən gələn parlaqlıq", "Dəriniz üçün yerli qayğı", "Saf tərkib, təmiz gözəllik"],
    "logo_urls": [],
    "banner_url": null
  }$json$::jsonb
)
on conflict (id) do update set
  name = excluded.name,
  idea_text = excluded.idea_text,
  plan = excluded.plan,
  financial_forecast = excluded.financial_forecast,
  locations = excluded.locations;

-- ---------------------------------------------------------------------------
-- 5. Six months of transactions for Nur Cosmetics.
-- month_offset 0 = current month, 5 = five months ago. Dates are relative to
-- today so the dashboard always has "this month" and "last month" data.
-- month_offset 2 is the deliberate dip: sales fall, marketing is cut, rent
-- rises and an oversized inventory purchase lands in the same month.
-- ---------------------------------------------------------------------------

delete from public.transactions where business_id = '10000000-0000-4000-8000-000000000001';

insert into public.transactions (business_id, date, type, category, amount, note)
select
  '10000000-0000-4000-8000-000000000001',
  (date_trunc('month', current_date) - make_interval(months => t.month_offset))::date
    + (least(t.day, case when t.month_offset = 0 then extract(day from current_date)::int else 28 end) - 1),
  t.type, t.category, t.amount, t.note
from (values
  -- 5 months ago
  (5,  7, 'income',  'Mağaza satışı', 3300, 'Həftəlik mağaza satışları'),
  (5, 16, 'income',  'Mağaza satışı', 3500, 'Həftəlik mağaza satışları'),
  (5, 26, 'income',  'Onlayn satış',  3000, 'Instagram sifarişləri'),
  (5,  1, 'expense', 'İcarə',         1800, 'Mağaza icarəsi'),
  (5,  5, 'expense', 'Maaş',          2400, '2 satış məsləhətçisi'),
  (5, 10, 'expense', 'Mal alışı',     2600, 'Xammal və qablaşdırma'),
  (5, 12, 'expense', 'Marketinq',      900, 'Instagram reklamı'),
  (5, 20, 'expense', 'Kommunal',       220, 'İşıq, su, internet'),
  -- 4 months ago
  (4,  7, 'income',  'Mağaza satışı', 3700, 'Həftəlik mağaza satışları'),
  (4, 16, 'income',  'Mağaza satışı', 3800, 'Həftəlik mağaza satışları'),
  (4, 26, 'income',  'Onlayn satış',  3400, 'Instagram sifarişləri'),
  (4,  1, 'expense', 'İcarə',         1800, 'Mağaza icarəsi'),
  (4,  5, 'expense', 'Maaş',          2400, '2 satış məsləhətçisi'),
  (4, 10, 'expense', 'Mal alışı',     2800, 'Xammal və qablaşdırma'),
  (4, 12, 'expense', 'Marketinq',     1000, 'Instagram və influenser reklamı'),
  (4, 20, 'expense', 'Kommunal',       230, 'İşıq, su, internet'),
  -- 3 months ago
  (3,  7, 'income',  'Mağaza satışı', 4000, 'Həftəlik mağaza satışları'),
  (3, 16, 'income',  'Mağaza satışı', 4100, 'Həftəlik mağaza satışları'),
  (3, 26, 'income',  'Onlayn satış',  3700, 'Instagram sifarişləri'),
  (3,  1, 'expense', 'İcarə',         1800, 'Mağaza icarəsi'),
  (3,  5, 'expense', 'Maaş',          2400, '2 satış məsləhətçisi'),
  (3, 10, 'expense', 'Mal alışı',     3000, 'Xammal və qablaşdırma'),
  (3, 12, 'expense', 'Marketinq',     1100, 'Instagram və influenser reklamı'),
  (3, 20, 'expense', 'Kommunal',       240, 'İşıq, su, internet'),
  -- 2 months ago: the dip
  (2,  7, 'income',  'Mağaza satışı', 2700, 'Həftəlik mağaza satışları'),
  (2, 16, 'income',  'Mağaza satışı', 2800, 'Həftəlik mağaza satışları'),
  (2, 26, 'income',  'Onlayn satış',  2100, 'Instagram sifarişləri (reklam dayandırılıb)'),
  (2,  1, 'expense', 'İcarə',         2000, 'Mağaza icarəsi (icarə artırıldı)'),
  (2,  5, 'expense', 'Maaş',          2400, '2 satış məsləhətçisi'),
  (2, 10, 'expense', 'Mal alışı',     4200, 'Yeni saç baxım xətti üçün böyük partiya'),
  (2, 12, 'expense', 'Marketinq',      400, 'Reklam büdcəsi azaldıldı'),
  (2, 20, 'expense', 'Kommunal',       260, 'İşıq, su, internet'),
  -- last month
  (1,  7, 'income',  'Mağaza satışı', 4200, 'Həftəlik mağaza satışları'),
  (1, 16, 'income',  'Mağaza satışı', 4300, 'Həftəlik mağaza satışları'),
  (1, 26, 'income',  'Onlayn satış',  3900, 'Instagram sifarişləri'),
  (1,  1, 'expense', 'İcarə',         2000, 'Mağaza icarəsi'),
  (1,  5, 'expense', 'Maaş',          2400, '2 satış məsləhətçisi'),
  (1, 10, 'expense', 'Mal alışı',     3000, 'Xammal və qablaşdırma'),
  (1, 12, 'expense', 'Marketinq',     1200, 'Instagram və influenser reklamı'),
  (1, 20, 'expense', 'Kommunal',       250, 'İşıq, su, internet'),
  -- current month (days are clamped to today)
  (0,  3, 'income',  'Mağaza satışı', 2300, 'Həftəlik mağaza satışları'),
  (0,  6, 'income',  'Onlayn satış',  1500, 'Instagram sifarişləri'),
  (0,  1, 'expense', 'İcarə',         2000, 'Mağaza icarəsi'),
  (0,  4, 'expense', 'Mal alışı',     1100, 'Xammal və qablaşdırma'),
  (0,  5, 'expense', 'Marketinq',      450, 'Instagram reklamı')
) as t (month_offset, day, type, category, amount, note);

-- ---------------------------------------------------------------------------
-- 6. Demo messages
-- ---------------------------------------------------------------------------

delete from public.messages
where sender_id::text like '00000000-0000-4000-8000-0000000000%'
  and receiver_id::text like '00000000-0000-4000-8000-0000000000%';

insert into public.messages (sender_id, receiver_id, content, read, created_at)
values
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001',
   'Salam Aysel xanım! Profilinizdə təchizatçı axtardığınızı gördüm. Bizdə itburnu və nar çəyirdəyi yağı topdan satılır.', true, now() - interval '2 days'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002',
   'Salam Leyla xanım, çox maraqlıdır. Qiymət siyahısını göndərə bilərsiniz?', true, now() - interval '2 days' + interval '20 minutes'),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001',
   'Əlbəttə. 10 litrdən yuxarı sifarişlərdə 12% endirim edirik. Sabah nümunələri göndərə bilərəm.', false, now() - interval '3 hours'),
  ('00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000001',
   'Salam! Kiçik bizneslər üçün maliyyə planlaması təlimimiz gələn həftə başlayır, sizə maraqlı ola bilər.', false, now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000010',
   'Salam Fidan xanım, Nur Cosmetics üçün onlayn mağaza qurmaq istəyirik. Qiymətləriniz necədir?', true, now() - interval '5 days');

-- =====================================================
-- MWAS — Mwinue Asimame : schéma de base de données
-- Toutes les tables ont RLS activé SANS politique publique :
-- seule l'API serveur (clé service_role) peut lire/écrire.
-- =====================================================

create extension if not exists pgcrypto;

-- Paramètres du site (coordonnées, réseaux, date de création, activité d'accueil…)
create table if not exists settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Utilisateurs de l'interface d'administration
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  pin_hash text,
  role text not null default 'communicator' check (role in ('admin','communicator')),
  permissions jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  pin_attempts int not null default 0,
  token_version int not null default 0,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Réalisations (activités)
create table if not exists realisations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  heading text,
  category text,
  image text,
  summary text,
  description text,
  intro jsonb not null default '[]'::jsonb,          -- ["paragraphe", ...]
  features_heading text,
  features jsonb not null default '[]'::jsonb,       -- [["titre","texte"], ...]
  process_heading text,
  steps jsonb not null default '[]'::jsonb,          -- [["titre","texte"], ...]
  faq_heading text,
  questions jsonb not null default '[]'::jsonb,      -- [["question","réponse"], ...]
  gallery jsonb not null default '[]'::jsonb,        -- ["url", ...]
  event_date date,
  location text,
  published boolean not null default true,
  featured boolean not null default false,
  sort int not null default 0,
  views int not null default 0,
  likes int not null default 0,
  author_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Actualités (articles)
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text,
  image text,
  alt text,
  excerpt text,
  intro text,
  paragraphs jsonb not null default '[]'::jsonb,
  takeaway text,
  tags jsonb not null default '[]'::jsonb,
  read_minutes int not null default 4,
  author_name text default 'Mwinue Asimame',
  published boolean not null default true,
  published_at timestamptz not null default now(),
  sort int not null default 0,
  views int not null default 0,
  likes int not null default 0,
  author_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Galerie
create table if not exists gallery (
  id uuid primary key default gen_random_uuid(),
  image text not null,
  category text not null default 'sante',
  label text,
  title text not null,
  alt text,
  description text,
  event_date date,
  theme text,
  tags jsonb not null default '[]'::jsonb,
  legacy_key text,
  published boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Équipe
create table if not exists team (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  photo text,
  bio text,
  socials jsonb not null default '{}'::jsonb,
  sort int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Partenaires
create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo text,
  url text,
  sort int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Témoignages
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  photo text,
  content text not null,
  rating int not null default 5,
  sort int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indicateurs d'impact (graphique + pourcentage)
create table if not exists impact_metrics (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value numeric not null default 0,
  target numeric not null default 100,
  unit text default '',
  color text default '#e83e8c',
  sort int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Commentaires (réalisations, actualités, livre d'or du site)
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('realisation','article','site')),
  target_id uuid,
  parent_id uuid references comments(id) on delete cascade,
  author_name text not null,
  author_email text,
  content text not null,
  status text not null default 'approved' check (status in ('approved','pending','hidden')),
  is_staff boolean not null default false,
  staff_user_id uuid references users(id) on delete set null,
  likes int not null default 0,
  visitor_id text,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index if not exists comments_target_idx on comments(target_type, target_id, created_at);

-- J'aime (1 par visiteur et par contenu)
create table if not exists likes (
  id bigint generated always as identity primary key,
  target_type text not null check (target_type in ('realisation','article','comment')),
  target_id uuid not null,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  unique (target_type, target_id, visitor_id)
);

-- Vues (1 par visiteur, par contenu et par jour)
create table if not exists views (
  id bigint generated always as identity primary key,
  target_type text not null check (target_type in ('realisation','article','page')),
  target_id text not null,
  visitor_id text not null,
  day date not null default current_date,
  created_at timestamptz not null default now(),
  unique (target_type, target_id, visitor_id, day)
);

-- Dons et paiements Mobile Money
create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  donor_name text,
  anonymous boolean not null default true,
  donor_email text,
  phone text not null,
  network text not null check (network in ('orange','mpesa','airtel')),
  amount numeric not null check (amount > 0),
  currency text not null default 'CDF' check (currency in ('CDF','USD')),
  purpose text,
  status text not null default 'pending' check (status in ('pending','success','failed','cancelled')),
  provider text not null default 'flexpay',
  provider_order text,
  provider_reference text,
  provider_message text,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists donations_status_idx on donations(status, created_at desc);

-- Messages du formulaire de contact
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  subject text,
  content text not null,
  read boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- Abonnés à la newsletter
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Journal d'activité de l'administration
create table if not exists audit_log (
  id bigint generated always as identity primary key,
  user_id uuid references users(id) on delete set null,
  user_name text,
  action text not null,
  entity text,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

-- Compteurs atomiques (vues / j'aime)
create or replace function bump_counter(p_table text, p_id uuid, p_column text, p_delta int)
returns int language plpgsql security definer set search_path = public as $$
declare v int;
begin
  if p_table not in ('realisations','articles','comments') or p_column not in ('views','likes') then
    raise exception 'invalid target';
  end if;
  execute format('update %I set %I = greatest(0, %I + $1) where id = $2 returning %I', p_table, p_column, p_column, p_column)
    into v using p_delta, p_id;
  return coalesce(v, 0);
end $$;
revoke all on function bump_counter(text, uuid, text, int) from public, anon, authenticated;
grant execute on function bump_counter(text, uuid, text, int) to service_role;

-- RLS : verrouillage complet (accès uniquement via la clé service_role côté serveur)
do $$
declare t text;
begin
  foreach t in array array['settings','users','realisations','articles','gallery','team','partners','testimonials',
    'impact_metrics','comments','likes','views','donations','messages','subscribers','audit_log']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on table %I from anon, authenticated', t);
  end loop;
end $$;

-- Stockage des médias (images publiques)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','video/mp4'])
on conflict (id) do update set public = true;

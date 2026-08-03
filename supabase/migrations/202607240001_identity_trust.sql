-- Fusion Risk OS Identity Trust and Customer Security schema.
-- Apply through Supabase migrations; do not edit production tables manually.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = timezone('utc', now()); return new; end;
$$;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  customer_id text not null unique,
  full_name text not null check (char_length(full_name) between 2 and 200),
  email text not null unique,
  mobile_number text not null check (char_length(mobile_number) between 7 and 32),
  account_number text not null unique,
  tenant_id text not null default 'TENANT_FUSB_001',
  app_id text not null default 'com.fusionbank.mobileapp',
  email_verified_at timestamptz,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','LOCKED','DISABLED')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.registered_devices (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  device_uuid text not null unique,
  device_fingerprint text not null,
  model text not null default 'unknown', manufacturer text not null default 'unknown',
  android_version text not null default 'unknown', sdk_version text not null default 'unknown',
  app_version text not null default 'unknown', root_detected boolean not null default false,
  emulator_detected boolean not null default false, known_device boolean not null default false,
  trust_score numeric(5,2) not null default 50 check (trust_score between 0 and 100),
  first_seen_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.active_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  device_id uuid references public.registered_devices(id) on delete set null,
  session_uuid uuid not null unique default gen_random_uuid(),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','SUSPICIOUS','REVOKED','ENDED')),
  risk_score numeric(5,2) not null default 0 check (risk_score between 0 and 100),
  threat_count integer not null default 0 check (threat_count >= 0),
  ip_address inet, country text, city text, isp text, network text,
  vpn_detected boolean not null default false,
  started_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.login_history (
  id uuid primary key default gen_random_uuid(), customer_id uuid references public.customers(id) on delete cascade,
  session_id uuid references public.active_sessions(id) on delete set null,
  device_id uuid references public.registered_devices(id) on delete set null,
  login_at timestamptz not null default timezone('utc', now()), success boolean not null default true,
  ip_address inet, country text, city text, isp text, network text, vpn_detected boolean not null default false,
  root_detected boolean not null default false, emulator_detected boolean not null default false,
  risk_score numeric(5,2) not null default 0 check (risk_score between 0 and 100),
  reasons jsonb not null default '[]'::jsonb, created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(), customer_id uuid references public.customers(id) on delete set null,
  session_id uuid references public.active_sessions(id) on delete set null, external_transaction_id text unique,
  amount numeric(18,2) not null default 0, currency text not null default 'INR', transaction_type text not null,
  beneficiary_id text, status text not null default 'PENDING', risk_score numeric(5,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_notifications (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.customers(id) on delete cascade,
  session_id uuid references public.active_sessions(id) on delete set null, notification_type text not null,
  channel text not null check (channel in ('IN_APP','EMAIL','PUSH')), severity text not null default 'INFO',
  title text not null, message text not null, risk_score numeric(5,2), status text not null default 'QUEUED',
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(), customer_id uuid references public.customers(id) on delete cascade,
  session_id uuid references public.active_sessions(id) on delete set null, device_id uuid references public.registered_devices(id) on delete set null,
  event_type text not null, severity text not null, confidence numeric(5,2) not null default 0,
  evidence jsonb not null default '{}'::jsonb, recommendation text, detected_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.risk_scores (
  id uuid primary key default gen_random_uuid(), customer_id uuid references public.customers(id) on delete cascade,
  session_id uuid references public.active_sessions(id) on delete cascade, score numeric(5,2) not null check (score between 0 and 100),
  device_score numeric(5,2), behaviour_score numeric(5,2), network_score numeric(5,2), threat_score numeric(5,2),
  transaction_score numeric(5,2), explanation jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default timezone('utc', now()), created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(), customer_id uuid references public.customers(id) on delete set null,
  session_id uuid references public.active_sessions(id) on delete set null, notification_id uuid references public.customer_notifications(id) on delete set null,
  recipient_email text not null, template_key text not null, subject text not null, provider text not null,
  provider_message_id text, status text not null, error_message text, sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.device_trust (
  id uuid primary key default gen_random_uuid(), device_id uuid not null references public.registered_devices(id) on delete cascade,
  session_id uuid references public.active_sessions(id) on delete set null, score numeric(5,2) not null check (score between 0 and 100),
  known_device boolean not null default false, factors jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default timezone('utc', now()), created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.behaviour_profiles (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null unique references public.customers(id) on delete cascade,
  preferred_countries text[] not null default '{}', preferred_cities text[] not null default '{}', preferred_networks text[] not null default '{}',
  login_count integer not null default 0, transaction_count integer not null default 0, baseline jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vpn_detection (
  id uuid primary key default gen_random_uuid(), customer_id uuid references public.customers(id) on delete cascade,
  session_id uuid references public.active_sessions(id) on delete cascade, ip_address inet, provider text, is_vpn boolean not null,
  is_proxy boolean not null default false, is_tor boolean not null default false, confidence numeric(5,2) not null default 0,
  evidence jsonb not null default '{}'::jsonb, detected_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.location_history (
  id uuid primary key default gen_random_uuid(), customer_id uuid references public.customers(id) on delete cascade,
  session_id uuid references public.active_sessions(id) on delete set null, ip_address inet, country text, city text,
  latitude numeric(9,6), longitude numeric(9,6), network text, isp text, observed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

do $$ declare t text; begin
  foreach t in array array['customers','registered_devices','active_sessions','login_history','transactions','customer_notifications','security_events','risk_scores','email_logs','device_trust','behaviour_profiles','vpn_detection','location_history'] loop
    -- Ensure created_at exists (e.g. if transactions table pre-existed)
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = 'created_at') then
      begin
        execute format('alter table public.%I add column created_at timestamptz not null default timezone(''utc'', now())', t);
      exception when others then
        raise notice 'Could not add created_at to table %', t;
      end;
    end if;

    -- Ensure updated_at exists
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = 'updated_at') then
      begin
        execute format('alter table public.%I add column updated_at timestamptz not null default timezone(''utc'', now())', t);
      exception when others then
        raise notice 'Could not add updated_at to table %', t;
      end;
    end if;

    execute format('drop trigger if exists %I_updated_at on public.%I', t, t);
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
    
    -- Check if customer_id exists before indexing
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = 'customer_id') then
      execute format('create index if not exists %I_customer_idx on public.%I(customer_id)', t, t);
    end if;

    -- Check if created_at exists before indexing
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = 'created_at') then
      execute format('create index if not exists %I_created_idx on public.%I(created_at desc)', t, t);
    end if;
  end loop;
end $$;

alter table public.customers enable row level security;
alter table public.registered_devices enable row level security;
alter table public.active_sessions enable row level security;
alter table public.login_history enable row level security;
alter table public.transactions enable row level security;
alter table public.customer_notifications enable row level security;
alter table public.security_events enable row level security;
alter table public.risk_scores enable row level security;
alter table public.email_logs enable row level security;
alter table public.device_trust enable row level security;
alter table public.behaviour_profiles enable row level security;
alter table public.vpn_detection enable row level security;
alter table public.location_history enable row level security;

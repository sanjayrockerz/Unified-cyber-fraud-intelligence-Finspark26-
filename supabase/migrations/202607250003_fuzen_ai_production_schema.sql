-- Fuzen AI Customer Database & Security Schema Migration
-- Apply through Supabase migrations; do not edit production tables manually.

create extension if not exists pgcrypto;

create or replace function public.set_fuzen_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = timezone('utc', now()); return new; end;
$$;

-- 1. Customers Table
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  customer_id text not null unique,
  full_name text not null check (char_length(full_name) between 2 and 200),
  email text not null unique,
  mobile_number text check (char_length(mobile_number) between 7 and 32),
  account_number text not null unique,
  tenant_id text not null default 'TENANT_FUZEN_001',
  app_id text not null default 'com.fuzenai.mobileapp',
  email_verified_at timestamptz,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','LOCKED','DISABLED')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- 2. Registered Devices Table
create table if not exists public.registered_devices (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  device_uuid text not null unique,
  device_fingerprint text not null,
  model text not null default 'unknown',
  manufacturer text not null default 'unknown',
  android_version text not null default 'unknown',
  sdk_version text not null default '1.0.0',
  app_version text not null default '1.0.0',
  root_detected boolean not null default false,
  emulator_detected boolean not null default false,
  known_device boolean not null default true,
  trust_score numeric(5,2) not null default 75.0 check (trust_score between 0 and 100),
  first_seen_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- 3. Sessions Table
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  device_id uuid references public.registered_devices(id) on delete set null,
  session_uuid uuid not null unique default gen_random_uuid(),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','SUSPICIOUS','REVOKED','CLOSED')),
  risk_score numeric(5,2) not null default 0 check (risk_score between 0 and 100),
  trust_score numeric(5,2) not null default 100.0 check (trust_score between 0 and 100),
  threat_count integer not null default 0 check (threat_count >= 0),
  ip_address inet,
  location_lat numeric(9,6),
  location_lng numeric(9,6),
  network text,
  vpn_detected boolean not null default false,
  started_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- 4. Login History Table
create table if not exists public.login_history (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  device_uuid text not null,
  session_uuid uuid references public.sessions(session_uuid) on delete set null,
  ip_address inet,
  vpn_detected boolean not null default false,
  unknown_device boolean not null default false,
  multi_session_detected boolean not null default false,
  login_status text not null default 'SUCCESS' check (login_status in ('SUCCESS','CHALLENGED','BLOCKED','FAILED')),
  risk_score numeric(5,2) not null default 0.0 check (risk_score between 0 and 100),
  timestamp timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

-- 5. Customer Notifications Table
create table if not exists public.customer_notifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  kind text not null check (kind in ('UNKNOWN_DEVICE_LOGIN','VPN_LOGIN','MULTIPLE_ACTIVE_SESSIONS','PASSWORD_RESET','HIGH_RISK_TRANSACTION','BEHAVIOUR_ANOMALY')),
  severity text not null default 'INFO' check (severity in ('INFO','WARNING','CRITICAL')),
  message text not null,
  read boolean not null default false,
  dispatched_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

-- 6. Email Logs Table
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  recipient_email text not null,
  email_subject text not null,
  email_kind text not null,
  body_text text not null,
  status text not null default 'DELIVERED' check (status in ('PENDING','DELIVERED','FAILED')),
  sent_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

-- 7. Device Trust Table
create table if not exists public.device_trust (
  id uuid primary key default gen_random_uuid(),
  device_uuid text not null unique,
  customer_id uuid not null references public.customers(id) on delete cascade,
  trust_score numeric(5,2) not null default 75.0 check (trust_score between 0 and 100),
  is_hardware_verified boolean not null default true,
  risk_level text not null default 'LOW' check (risk_level in ('LOW','MEDIUM','HIGH','CRITICAL')),
  last_evaluated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- 8. Behaviour Profiles Table
create table if not exists public.behaviour_profiles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null unique references public.customers(id) on delete cascade,
  normal_transfer_amount_avg numeric(12,2) not null default 5000.0,
  max_transfer_amount_observed numeric(12,2) not null default 50000.0,
  trusted_device_uuids text[] not null default '{}',
  trusted_beneficiary_accounts text[] not null default '{}',
  common_login_hours integer[] not null default '{8,9,10,11,12,13,14,15,16,17,18,19,20}',
  anomaly_sensitivity numeric(3,2) not null default 0.85 check (anomaly_sensitivity between 0 and 1),
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

-- Indexes for Fast Query Execution
create index if not exists idx_customers_email on public.customers (email);
create index if not exists idx_registered_devices_uuid on public.registered_devices (device_uuid);
create index if not exists idx_sessions_customer on public.sessions (customer_id);
create index if not exists idx_sessions_uuid on public.sessions (session_uuid);
create index if not exists idx_login_history_customer on public.login_history (customer_id);
create index if not exists idx_login_history_timestamp on public.login_history (timestamp);
create index if not exists idx_customer_notifications_cust on public.customer_notifications (customer_id);
create index if not exists idx_email_logs_recipient on public.email_logs (recipient_email);
create index if not exists idx_device_trust_uuid on public.device_trust (device_uuid);

-- Row Level Security (RLS) Policies
alter table public.customers enable row level security;
alter table public.registered_devices enable row level security;
alter table public.sessions enable row level security;
alter table public.login_history enable row level security;
alter table public.customer_notifications enable row level security;
alter table public.email_logs enable row level security;
alter table public.device_trust enable row level security;
alter table public.behaviour_profiles enable row level security;

-- Customers can view their own profile data
create policy customers_self_read on public.customers for select using (auth.uid() = auth_user_id);
create policy devices_self_read on public.registered_devices for select using (customer_id in (select id from public.customers where auth_user_id = auth.uid()));
create policy sessions_self_read on public.sessions for select using (customer_id in (select id from public.customers where auth_user_id = auth.uid()));

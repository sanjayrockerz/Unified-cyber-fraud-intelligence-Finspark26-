-- Fuzen AI — Supabase Database Migration
-- 1. Trigger to auto-confirm new users in auth.users
create or replace function public.auto_confirm_users()
returns trigger language plpgsql security definer as $$
begin
  new.email_confirmed_at = timezone('utc', now());
  new.confirmed_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  before insert on auth.users
  for each row execute function public.auto_confirm_users();

-- 2. Disable Row Level Security on all public tables to prevent RLS blocks for anon/auth users
alter table if exists public.customers disable row level security;
alter table if exists public.registered_devices disable row level security;
alter table if exists public.sessions disable row level security;
alter table if exists public.login_history disable row level security;
alter table if exists public.customer_notifications disable row level security;
alter table if exists public.email_logs disable row level security;
alter table if exists public.device_trust disable row level security;
alter table if exists public.behaviour_profiles disable row level security;
alter table if exists public.qr_pairing_sessions disable row level security;
alter table if exists public.password_reset_tokens disable row level security;
alter table if exists public.email_verification_tokens disable row level security;

-- 3. Add missing columns if they do not exist
alter table if exists public.customers add column if not exists tenant_id text not null default 'TENANT_FUZEN_001';
alter table if exists public.customers add column if not exists app_id text not null default 'com.fuzenai.mobileapp';

-- 4. Reload PostgREST schema cache
notify pgrst, 'reload schema';

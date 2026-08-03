# Supabase Schema

Migration: `supabase/migrations/202607240001_identity_trust.sql`

The migration is additive and versioned. It creates the normalized identity
security tables and foreign-key relationships, enables UUID primary keys,
UTC timestamps, update triggers, indexes, constraints, and row-level security.

The FastAPI service uses the Supabase service-role REST API server-side. The
service-role key must never be compiled into the dashboard or APK.

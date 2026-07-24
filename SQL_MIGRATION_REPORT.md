# SQL Migration Report

Migration added: `202607240001_identity_trust.sql`

It creates all required Identity Trust tables, UUID keys, UTC audit columns,
foreign keys, check constraints, indexes, update triggers, and row-level
security. It is safe to apply with Supabase CLI migration tooling and is
idempotent for table/trigger/index creation.

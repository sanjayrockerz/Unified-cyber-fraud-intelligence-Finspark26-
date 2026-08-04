# Architecture Operations Guide

The frozen runtime path is Android SDK or web client → FastAPI → policy/model/graph pipeline → SQLite and optional Neo4j/Supabase/Gemini providers → WebSocket and dashboard/report consumers. SQLite and policy evaluation remain the degraded operating path when optional providers are unavailable. The API container is the deployable backend unit; Vercel is the web/token-proxy surface.

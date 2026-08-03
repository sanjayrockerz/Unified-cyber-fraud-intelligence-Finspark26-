# Environment Matrix

| Variable | Local RC1 | Render/API | Vercel/Web | Android | Required |
|---|---|---|---|---|---|
| `JWT_SECRET_KEY` | 32+ random bytes | Secret | Not client-side | Not client-side | Yes |
| `DATABASE_URL` | SQLite URL | Persistent SQLite URL | N/A | N/A | Yes for API |
| `FUSION_BANK_USERS_JSON` | Configured users only | Secret | N/A | N/A | Yes for API |
| `FUSION_AUTH_CLIENTS_JSON` | Configured clients only | Secret | Server-side proxy credentials | N/A | Yes for API/dashboard |
| `VITE_API_BASE` | `http://localhost:8000` | Public HTTPS API | Public HTTPS API | Pairing response | Yes in production web |
| `VITE_WS_BASE` | `ws://localhost:8000` | `wss://` API | `wss://` API | Pairing response | Yes for realtime |
| `CORS_ORIGINS` | Explicit local origins | Explicit deployed origin | N/A | N/A | Yes in production |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Optional degraded mode | Provider secrets | N/A | Provider config | Provider-dependent |
| `NEO4J_URI` / credentials | Optional NetworkX fallback | Provider secrets | N/A | N/A | Provider-dependent |
| `GEMINI_API_KEY` | Optional policy fallback | Secret | N/A | N/A | Provider-dependent |

Startup fails closed when the API-required JWT, database, or banking-user configuration is absent or invalid.

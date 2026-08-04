# Fuzen AI — Phase 1 Architecture Audit

Audit date: 2026-08-03

Scope: read-only audit of the repository as found. The current implementation was treated as the source of truth. No application source code was modified during this audit; this report is the only artifact added by this audit.

## Executive summary

The repository is a substantial hackathon-oriented platform with a FastAPI backend, React/Vite web client, Android reference banking app, SDK-facing APIs, SQLite persistence, optional Supabase identity integration, optional Neo4j/NetworkX graph analysis, model-runtime code, synthetic data, reports, and a copilot.

The main release risks are integration consistency rather than a missing core feature:

1. Authentication routes and health probes do not match the current middleware public-path allowlist.
2. WebSocket authentication is incompatible between backend, browser, and Android clients.
3. The backend contains duplicate route groups and repeated SDK/threat/metrics definitions.
4. Tenant isolation is not a single enforced boundary: generic storage is tenant-aware, but several process-local engines and identifier-based routes still require endpoint-by-endpoint review.
5. Runtime configuration is inconsistent across config, .env.example, Render, browser defaults, Android defaults, and auth providers.
6. Demo/static values remain mixed into production-looking screens, graph fallbacks, engines, and responses.
7. SQLite state and several in-memory stores are process-local, which limits multi-worker and restart guarantees.

Recommended release posture: do not present the current tree as production-ready until the authentication/public-path contract, WebSocket contract, duplicate routes, tenant boundary, deployment environment, and live-versus-demo data path are reconciled.

## Repository overview

Top-level areas identified:

- api/: FastAPI application, route handlers, platform engines, persistence, authentication, graph, ML/runtime, copilot, reports, synthetic data, and integrations.
- web/: React/Vite dashboard and stakeholder-facing pages.
- fusion-reference-bank/: Android reference banking application, SDK flows, pairing, QR, offline queue, and realtime client.
- sdk/: SDK or integration assets and related runtime-facing code.
- graph/: offline graph construction/training utilities.
- ml/: model/runtime assets and training-related material; model artifacts are not reliably present in a clean checkout.
- reports/: generated reports and sample artifacts.
- synthetic_universe/: scenario and synthetic transaction generation.
- infra/deployment files: Render and environment configuration.
- root utilities/notebooks/tests: experiments, debug scripts, migration/refactor helpers, and test material.

Repository size observed during the audit: approximately 411 tracked/discoverable source and configuration files after excluding common generated directories and caches. The worktree was already substantially dirty before this audit, including source edits, database files, Android/frontend changes, and untracked reports. Those changes are not attributed to this audit.

## Dependency map

Primary runtime flow:

APK / Android app
  -> FusionApiService and FusionWebSocketManager
  -> FastAPI routes in api/main.py and included routers
  -> authentication/security middleware
  -> platform engines and api/core_platform/pipeline.py
  -> generic SQLite store in api/store.py
  -> dashboard/API consumers in web/

Transaction pipeline:

SDK ingest or transaction evaluation
  -> normalization and idempotency in core_platform/pipeline.py
  -> SDK ingest
  -> cyber threat engine
  -> graph runtime
  -> model runtime
  -> decision/trust logic
  -> event broker, notifications, reports, and response/SOAR paths

Identity/authentication:

- api/core_platform/security.py: JWT extraction, request middleware, WebSocket token extraction, public path handling.
- api/core_platform/config.py: environment-driven settings and fail-closed validation.
- api/core_platform/banking_auth.py: local banking-user authentication from FUSION_BANK_USERS_JSON.
- api/identity_trust/: identity/trust routes and Supabase adapter.
- api/gateway_integration.py: signed webhook integration.
- web/src/platformAuth.js: browser token acquisition, refresh, authenticated fetch, and WebSocket URL generation.
- Android FusionApiService.kt, SecureStorage.kt, and FusionWebSocketManager.kt: mobile auth/session/realtime clients.

Data and graph:

- api/store.py: existing SQLite persistence is a generic collection/key/value store, not a conventional table-per-domain repository.
- processed_requests is a physical SQLite table with a tenant/hash uniqueness constraint.
- api/core_platform/graph_runtime.py: optional Neo4j adapter with NetworkX fallback.
- graph/: separate offline graph build and GraphSAGE experimentation path.
- Supabase is used as an optional identity/trust REST integration, not as the primary transaction store.

## Current architecture and verified connections

The intended concept is:

APK -> SDK -> FastAPI -> threat engine -> adaptive trust/decision layer -> graph -> copilot/dashboard/reports.

The implemented connections are more distributed:

- APK calls the FastAPI API through Retrofit and maintains a separate WebSocket client.
- FastAPI includes several routers and also defines a large number of routes directly in api/main.py.
- The transaction path reaches the core pipeline and generic SQLite store.
- Threat, graph, trust, session, response, evidence, and notification functionality is split between persistent store records and process-local engines.
- Graph analysis can use Neo4j when configured, but NetworkX fallback behavior seeds a demo topology.
- The copilot route is backed by a Gemini integration with a large deterministic fallback.
- Reports and synthetic data are exposed through backend routes and frontend pages, but not all displayed values are guaranteed to originate from live records.

Verified or partially verified connections:

| Connection | Status | Finding |
|---|---|---|
| Android -> FastAPI REST | Partial | Route paths exist, but auth/token and identity route contracts are not uniform. |
| Android -> WebSocket | Broken contract | Android sends Authorization header; backend expects Bearer.<token> subprotocol or access_token cookie. |
| Browser -> FastAPI REST | Partial | Auth helper exists; dev token bootstrap and actual public-path rules conflict. |
| Browser -> WebSocket | Broken contract | Browser appends access_token query parameter; backend no longer accepts it. |
| FastAPI -> SQLite | Exists | api/store.py owns a generic SQLite store and processed_requests table. |
| FastAPI -> Neo4j | Optional | Adapter exists; fallback is NetworkX and includes seeded demo topology. |
| FastAPI -> Supabase | Optional/dual path | Identity adapter exists, but local banking auth can continue after Supabase errors. |
| Pipeline -> model runtime | Exists | Degraded response path exists, but model artifacts/configuration are external prerequisites. |
| Backend -> dashboard | Partial | Many endpoints are consumed; static/demo UI values remain. |
| Webhook -> pipeline | At risk | Signature verification exists, but current public-path allowlist does not include the webhook route. |

## API inventory and standards audit

Route families found include:

- auth/token and banking auth: login, register, refresh, logout, profile
- identity/trust: registration, login, password reset, security overview
- health/readiness/status
- device pairing, device registration, sessions, notifications, downloads
- graph analysis/topology
- transactions, pipeline evaluation, trust decisions, cases, customers, threats, alerts
- scenarios, synthetic universe, quantum trust, digital twin, timeline, investigation, burst/mule detection
- response, incidents, playbooks, evidence, audit
- SDK session/device/network/event/decision/behavior/telemetry/recovery/policies/passport/health/apps/error-codes
- metrics
- WebSocket /ws/stream
- copilot /chat
- gateway /webhook

Findings:

- Duplicate threat route groups exist in api/main.py, including repeated threat/session/device routes.
- SDK and metrics route blocks are repeated or overlap.
- The Copilot router is included more than once, creating a duplicate-registration risk.
- The current PUBLIC_PATHS allowlist contains only /health, /docs, /openapi.json, /redoc, /auth/login, /auth/refresh, and /auth/register, while actual handlers include /health/live, /health/ready, /auth/token, /banking/auth/*, /identity/*, and /gateway/webhook. This can reject legitimate health, login, identity, and signed webhook requests before their handlers run.
- API naming is inconsistent: /auth/token, /auth/login, /banking/auth/login, and /identity/login represent overlapping authentication concepts.
- Several handlers return raw dicts instead of consistent response models. Error payloads and status codes are not uniform; some paths encode errors in successful responses.
- Pagination is not universal. The generic store has SQL pagination for selected collection paths, but many list-like endpoints and process-local collections need independent limits and tenant filters.
- Filtering and sorting are not governed by one allowlist/validation layer. Dynamic SQL identifiers must remain constrained to known table/field names.
- Idempotency is implemented for the core transaction path through processed_requests, but request-wide retry safety is not established for every mutating endpoint.
- Endpoint-level ownership checks are not demonstrably centralized across all five requested business domains and all update/delete paths.
- Logging and exception behavior varies substantially between routers and engines.
- Rate limiting, replay protection, and abuse controls are not consistently visible on authentication, pairing, token, webhook, or high-cost analysis endpoints.

Priority API blockers:

1. Reconcile public routes with actual unauthenticated routes and health probes.
2. Define one canonical login/token/refresh contract and update all clients.
3. Remove duplicate route registration and generate an endpoint inventory from the final OpenAPI schema.
4. Apply a shared tenant/ownership dependency to every list, read-by-ID, update, delete, export, report, and WebSocket operation.
5. Standardize response models and error envelopes.

## Authentication and security findings

Critical:

- Backend WebSocket authentication expects a Sec-WebSocket-Protocol value shaped like Bearer.<token> or an access_token cookie. Browser code sends a query token and Android sends an Authorization header. Realtime authentication therefore fails or is not enforced consistently.
- The public-path policy does not cover the actual login and health route paths. This is both an availability defect and a security-policy drift defect.
- Runtime authentication has multiple identity sources: local SQLite/JSON banking users, identity/trust logic, Supabase, and development token paths. Their tenant and role semantics require a single documented authority.
- Render configuration uses stale/mismatched variable names and demo credentials. It sets JWT_SECRET rather than the configuration’s JWT_SECRET_KEY, uses FUZEN_AI_BANK_USERS_JSON rather than FUSION_BANK_USERS_JSON, and does not visibly provide DATABASE_URL required by current fail-closed validation.

High:

- Tenant context is available in middleware/dependencies, but process-local threat, session, broker, pairing, notification, and related engine state can bypass the persistent tenant boundary unless each call path receives and checks tenant_id.
- Arbitrary resource IDs, device IDs, session IDs, and case IDs are accepted by many routes; all identifier-based reads and mutations need ownership checks.
- Debug/default credentials and local-only development identities remain in browser and Android configuration paths. They must be unreachable in release builds and must not be accepted by production auth.
- CORS, cookies, origins, WebSocket origin policy, and token transport are not documented as one deployment contract.
- Sensitive financial, device, identity, and behavioral data can flow through broad dict payloads and logging paths. A field-level logging/redaction policy is not evident.

Medium:

- Copilot uses a deprecated google.generativeai import and deterministic fallback text. Provider errors, prompt/data boundaries, and secrets need a documented policy.
- No repository-wide security test suite was found that proves cross-tenant access denial for every route family.

## Database audit

The current persistence implementation is not a physical transaction/case/customer schema. api/store.py uses a generic SQLite table:

    store(collection, key, tenant_id, value)

The current store also includes:

    processed_requests(
      id,
      tenant_id,
      transaction_hash,
      processed_at,
      UNIQUE(tenant_id, transaction_hash)
    )

Positive findings:

- Tenant-aware collection/key storage exists.
- processed_requests provides persistent duplicate detection across process restarts for the paths that use it.
- SQL COUNT plus LIMIT/OFFSET pagination and tenant/timestamp indexes exist for the compatibility pagination path.
- Initialization/migration code creates required columns/indexes without assuming api/database.py exists.

Risks and inconsistencies:

- The generic JSON value store weakens schema enforcement, queryability, type validation, migration clarity, and reporting guarantees.
- DB_PATH selects the actual SQLite file, while DATABASE_URL is currently a validation prerequisite rather than the connection setting. This is a configuration contract mismatch.
- A process-global connection with a lock is not a multi-process database architecture. Uvicorn multi-worker deployments can use separate connections and separate in-memory state.
- Several engines retain state in Python dictionaries. Restart, scaling, and cross-worker behavior are therefore not uniform.
- Legacy rows with missing tenant_id are excluded by tenant-scoped reads, but the migration/repair policy for them is not documented.
- Pagination count/data reads are separate operations, so totals can change between queries under concurrent writes.
- Dynamic table/order/filter interpolation requires strict identifier allowlists; parameter binding cannot protect SQL identifiers.
- SQLite operational settings, backup strategy, WAL lifecycle, busy timeout, and migration versioning need release documentation.
- Room on Android uses fallbackToDestructiveMigration(), which can erase local queued/session data after schema changes.

Database release actions:

- Document the generic-store schema as intentional or define a bounded migration plan; do not assume domain tables exist.
- Add cross-tenant persistence tests for every collection and mutation path.
- Decide whether multi-worker operation is supported. If not, enforce one worker in deployment and document the limitation.
- Add migration versioning, backup/restore verification, and a non-destructive mobile migration strategy.

## Frontend audit

The React application contains dashboard, operations, cases, customers, investigation, reports, sessions, graph, synthetic lab, telemetry, banking, analytics, threat intelligence, developer platform, settings, and executive command-center surfaces.

Positive findings:

- DataTable includes loading, error, empty, abort, pagination, filtering, and sorting behavior.
- Shared platformAuth code centralizes authenticated fetch and refresh behavior.
- Many pages bind to backend endpoints rather than using only local fixtures.

Findings:

- WebSocket URL construction still appends access_token as a query parameter, incompatible with the current backend WebSocket authentication contract.
- Development token bootstrap uses hardcoded local-only credentials and /auth/token; this conflicts with the current public-path allowlist and must be explicitly isolated from production.
- UniversalSearch.jsx contains a mock database.
- Notification, Customer, and Case contexts contain static initial state that can look like live records.
- FATSDKDeveloperPortal.jsx contains a placeholder live key, static endpoint explorer content, and mock telemetry injection controls.
- Threat dashboard includes static news/feed content.
- Executive command center displays static compliance KPI content such as 100% Compliant.
- Session dashboard uses a default trust value of 95 and includes demo/security-injection controls.
- Sidebar and navigation contain static case/session identifiers.
- Several screens need a uniform refresh, loading, empty, stale-data, and permission-denied contract.
- API usage and route naming are not centralized enough to make backend path drift obvious at build time.
- The dashboard mixes operational live data with synthetic/demo views without a persistent visual/data-source distinction.

Frontend release test matrix:

- fresh unauthenticated load
- expired access token and refresh failure
- health/readiness while unauthenticated
- empty tenant with no records
- cross-tenant resource ID
- backend 403/404/409/503 rendering
- WebSocket reconnect and auth expiry
- slow API and abort navigation
- offline mode and stale cached data
- production build with no dev credentials or placeholder URLs

## Android audit

The Android reference app includes Compose screens for login, pairing/QR, registration, dashboard, accounts, beneficiary, bill payment, transfer, QR, trust, profile, and simulator paths. It includes Retrofit APIs, OkHttp WebSocket, Room offline queue, EncryptedSharedPreferences, and device attestation-related code.

Positive findings:

- Access and refresh tokens are stored using EncryptedSharedPreferences.
- Offline events are queued in Room and retried.
- WebSocket reconnect uses bounded increasing delays.
- QR/pairing and device registration flows are represented in the app.

Findings:

- FusionWebSocketManager sends Authorization: Bearer token, but backend expects a subprotocol Bearer.<token> or access_token cookie. This is a confirmed realtime integration break.
- FusionConfig.kt uses invalid placeholder production URLs and a fixed tenant default.
- Debug builds embed local-only credentials; release configuration has fallbacks that can become invalid runtime defaults.
- Offline queue stops on the first failed event and has no visible dead-letter/quarantine policy.
- Room fallbackToDestructiveMigration() can delete queued data on schema changes.
- Reconnect/session invalidation behavior needs explicit handling for 401/403/4403 and refresh-token expiry.
- QR pairing, device registration, attestation, tenant association, and session ownership need end-to-end server-side tests.
- Every screen needs verification that it binds to live API state rather than simulator/demo state.

## ML, graph, synthetic data, and copilot

ML:

- model_runtime.py has structured degraded results and logs unexpected tracebacks.
- Model files under ml/models are ignored/external prerequisites. A clean checkout may not be able to reproduce the model path.
- Training/evaluation evidence, calibration, drift monitoring, and a reproducible artifact manifest are not established in the repository.
- Model fallback policy must be visible to operators and must not be confused with a successful high-confidence prediction.

Graph:

- Neo4j integration is optional.
- NetworkX fallback seeds a default demo topology, which can produce plausible results without real tenant data.
- Offline GraphSAGE scripts are separate from runtime behavior and explicitly contain demo-oriented evaluation shortcuts.
- Tenant boundaries and graph projection filters need explicit tests; a graph query can leak relationships even when primary rows are scoped.

Synthetic data:

- Scenario and synthetic-universe engines contain fixed users, accounts, IPs, amounts, narratives, expected risks, and static confidence values.
- Synthetic mode is useful for the demo but needs a clearly visible environment/response marker and must be impossible to select accidentally in production.

Copilot:

- The copilot endpoint exists and the frontend calls it.
- It uses a deprecated Gemini client import and has a large deterministic fallback.
- Prompt grounding, tenant scoping, sensitive-field redaction, provider timeout/retry, and response provenance should be documented before release.

## Dead code, duplication, and repository hygiene

No files were deleted. The following are candidates for confirmation by import/reference analysis:

- api/risk_engine.py
- api/pipeline_engine.py
- api/trust_engine.py
- api/session_intelligence_engine.py
- api/rename_platform.py
- root debug.py and debug_part2.py
- patch*.py and refactor*.py utilities
- root test2.py, test3.py, test4.py, test_geo.py, test_persistence_1.py, test_persistence_2.py, test_pipeline.py
- notebooks and generated report artifacts

Confirmed duplication or overlap:

- repeated threat routes in api/main.py
- repeated/overlapping SDK routes
- repeated metrics routes
- duplicate Copilot router inclusion
- multiple authentication families and token endpoints
- multiple trust/risk/graph implementation paths
- duplicate DTO/model shapes represented as dicts across route modules and frontend
- static/mock contexts overlapping live API contexts

Repository hygiene risks:

- Root-level debug, patch, refactor, notebook, and generated report files make the production boundary unclear.
- Commented-out code, TODO/FIXME/DEBUG markers, and print/debug statements require a release-wide inventory and ownership decision.
- Generated database/WAL files and untracked artifacts are present in the worktree.

## Hardcoded values and demo data

The following categories contain hardcoded or deterministic demo values. This is an inventory, not a claim that every value is defective in a demo:

- Backend IDs: usr_abc, usr_demo_001, dev_9999, SESS_9921_CRITICAL, CASE-2026-8942, INC-2026-9912, and EVID_CASE-2026-8942_1001.
- Backend metrics: risk scores around 94/95, confidence 94/99, anomaly 0.94, thresholds 50/60, and fixed event/timeline records.
- Backend identity/location: Rajesh Kumar-style demo identity, fixed IP 192.168.1.99, fixed coordinates 77.5946, fixed device variations.
- Scenario/synthetic data: fixed accounts, amounts, IPs, narratives, and expected risk values.
- Graph fallback: seeded users/accounts/devices/transactions and static topology relationships.
- Investigation/quantum paths: fixed shell-account and legacy-ATM/simulation values.
- Frontend: mock search database, static context records, placeholder SDK key, static news, 100% compliance KPI, default trust 95, static case IDs, and demo injection controls.
- Android: fixed tenant default TENANT_FUSB_001, invalid placeholder URLs, simulator data, and debug credentials.
- Deployment: Render demo user/hash and stale environment variable names.

Release requirement: all demo values should be behind an explicit demo/synthetic mode, marked in the UI and API metadata, excluded from production credentials, and covered by a production-mode test.

## Broken or at-risk integrations

| Integration | Risk | Evidence |
|---|---|---|
| Browser WebSocket auth | Critical | Query token client versus subprotocol/cookie backend. |
| Android WebSocket auth | Critical | Authorization header client versus subprotocol/cookie backend. |
| Health probes | Critical | /health/live and /health/ready are not in the exact public allowlist. |
| Banking login | Critical | Actual /banking/auth/* routes are not in the exact public allowlist. |
| Identity login/register | High | /identity/* routes are not in the exact public allowlist. |
| Gateway webhook | High | Signature-only webhook is not in the exact public allowlist. |
| Render deployment | Critical | JWT_SECRET/FUZEN_AI_BANK_USERS_JSON mismatch; DATABASE_URL absent from visible config. |
| Model runtime | High | External/ignored artifacts and provider dependencies are not reproducible from a clean checkout. |
| Neo4j | Medium | Optional adapter falls back to seeded NetworkX demo topology. |
| Supabase/local auth | High | Supabase errors can be swallowed while local auth continues; identity authority is ambiguous. |
| Android production config | High | Invalid placeholder URL defaults can survive missing build properties. |
| Copilot provider | Medium | Deprecated Gemini client and deterministic fallback. |

## Technical debt

- Monolithic api/main.py makes route ownership, dependency enforcement, and duplicate detection difficult.
- Generic JSON persistence trades rapid iteration for weak schema and query guarantees.
- Multiple state authorities exist: SQLite, process-local dictionaries, Supabase, Neo4j, and frontend/Android local state.
- Authentication and tenant context are cross-cutting but not represented by a single enforced service boundary.
- Response DTOs and error envelopes are inconsistent.
- Runtime/demo mode is not consistently declared or surfaced.
- Deployment configuration does not match application validation.
- Tests are not yet a comprehensive contract suite across REST, WebSocket, tenant isolation, Android, and frontend.

## Risk register

| ID | Finding | Severity | Estimated effort |
|---|---|---:|---:|
| R1 | Public-path/auth/health route mismatch | Critical | 0.5–1 day |
| R2 | Browser and Android WebSocket auth mismatch | Critical | 0.5–1 day |
| R3 | Duplicate route/router registration | Critical | 0.5–1 day |
| R4 | Incomplete tenant enforcement across engines/routes | Critical | 2–5 days |
| R5 | Render/runtime environment mismatch | Critical | 0.5 day |
| R6 | Gateway webhook blocked by auth policy | High | 0.5 day |
| R7 | SQLite process-local connection/state and worker limitation | High | 1–3 days |
| R8 | Live and static/demo data mixed in UI and engines | High | 2–4 days |
| R9 | Missing/non-reproducible model and graph artifacts | High | 0.5–2 days |
| R10 | Divergent Supabase/local identity authorities | High | 2–5 days |
| R11 | Generic JSON schema and inconsistent response contracts | High | 2–4 days |
| R12 | Destructive Android Room migration | High | 0.5–1 day |
| R13 | Missing comprehensive contract/isolation tests | High | 2–5 days |
| R14 | Deprecated copilot provider client | Medium | 0.5–1 day |
| R15 | Legacy/debug/generated repository clutter | Medium | 1–3 days |

## Recommended remediation sequence

Phase 2 — release blockers:

1. Freeze the current route inventory and remove duplicate registrations.
2. Define canonical auth routes, public paths, health paths, token transport, cookie/subprotocol policy, and tenant claims.
3. Make browser and Android WebSocket clients conform to the same contract.
4. Correct Render and local environment names; validate from a clean environment.
5. Add cross-tenant REST and WebSocket negative tests.
6. Make gateway, health, auth, identity, and docs behavior explicit and testable.

Phase 3 — correctness and operability:

1. Apply ownership checks to every identifier-based route and every process-local engine.
2. Add response models, validation, consistent errors, pagination, filtering, limits, and retry/idempotency contracts.
3. Document SQLite worker limitations, migration/backup policy, and restart semantics.
4. Separate production and synthetic/demo data paths and label responses.
5. Pin/provision model, graph, and copilot dependencies/artifacts.

Phase 4 — cleanup:

1. Confirm unused files by import/reference graph and archive or remove only after approval.
2. Consolidate trust/risk/graph implementations and DTOs.
3. Replace static frontend contexts with API-backed state or explicit fixtures.
4. Replace destructive Android migration and add offline dead-letter handling.

## Audit verification

Checks performed or recorded:

- Repository file and directory inventory.
- Backend route and router inventory.
- Source-level search for TODO/FIXME/DEBUG/print, hardcoded demo values, duplicate route definitions, and mock/static frontend data.
- Inspection of SQLite initialization, store, pagination, idempotency, and connection behavior.
- Inspection of browser auth/WebSocket code and Android REST/WebSocket/session/offline code.
- Python compilation passed after the pre-existing changes.
- FastAPI import passed with valid environment overrides and exposed approximately 135 routes.
- Focused pagination tests passed.
- Frontend production build had previously passed.
- Full test execution was not completed within the available run window; it should be rerun as a release gate.

## Final audit conclusion

The platform has a credible demonstrable architecture and broad feature coverage. Its current risk is that several different “truths” coexist: multiple auth contracts, multiple route registrations, multiple persistence/state mechanisms, and live-looking demo data. The highest-value work is contract consolidation and negative testing, especially around authentication, WebSockets, tenant isolation, and deployment configuration.

This Phase 1 audit intentionally made no source-code fixes. The next change set should be scoped from the Critical findings above and verified with a clean-environment startup plus cross-tenant and realtime integration tests.

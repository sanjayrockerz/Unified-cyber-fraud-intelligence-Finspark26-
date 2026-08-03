# Demo Readiness Audit — Unified Cyber-Fraud Intelligence Platform ("Fuzen AI")

**Audit date:** 2026-07-25 (COEP Pune finale window, per `CLAUDE.md`).
**Method:** every claim below was verified by directly reading the source (file:line), not by trusting the ~50 self-authored `*_REPORT.md` files at the repo root, which repeatedly overstate what's implemented (see §12). Where an existing report's claim checked out, it's cited; where it didn't, that's called out explicitly.

## How to read this document

Every feature gets one verdict tag:

| Tag | Meaning |
|---|---|
| 🟢 **REAL/LIVE** | Computes a genuine result from real inputs (a trained model, a live graph query, a real DB row). Will hold up if a judge pokes at it with a different transaction. |
| 🟡 **MIXED** | Part of it is real (a live fetch, a real button action); part is a hardcoded fallback, a decorative element, or theater layered on top. |
| 🔴 **HARDCODED/MOCK** | Local static data or a scripted response. No backend call, or the backend call itself returns canned data. |
| ⚫ **DEAD/UNREACHABLE** | Built but never rendered/wired anywhere in the running app, or a button with no click handler. |
| 🔵 **FUTURE/VISION** | Not built; explicitly deck-only per `CLAUDE.md`, or an aspirational doc describing something the code doesn't do yet. |

---

## 1. Executive summary — the one page you read if you only read one page

**The project outgrew its own brief.** `CLAUDE.md` (written 12 Jul 2026, "Day 1 of a 5-day sprint") describes a tight PS2 vertical slice: one FastAPI process, a fusion risk engine (tabular + graph + cyber), a dashboard, a CERT-In report, a quantum monitor. What actually exists now, 13 days and ~120 commits later, is a much bigger platform ("Fuzen AI") with 65+ REST routes, a full identity/auth/banking layer, a real Android app, Supabase/Razorpay/Gemini/Neo4j integrations, and dashboard pages that go well beyond the original scope. This is not necessarily bad for a finale demo — there's a lot of genuinely working technology — but it means **the surface area that could break in front of judges is much larger than the deck implies**, and several generations of rewrites now coexist (old engines next to new ones, both live, computing different answers for the same question).

**What's genuinely solid** (would survive a technical judge's follow-up questions):
- The core ML pipeline (`ml/train.py`): real SMOTE, real XGBoost/LightGBM baseline-vs-fusion training, real PR-AUC/F1/recall-at-fixed-FPR methodology, on real downloaded PaySim + Elliptic + UNSW-NB15 data.
- The real GraphSAGE training (`graph/train_graphsage.py`): AUC 0.985 on Elliptic, non-round numbers.
- The live `/evaluate/transaction` pipeline (`api/core_platform/`): genuinely loads the trained `.joblib` models and runs real inference, with a graph engine that does real live networkx pattern-detection (shared device, circular transfer, mule rings), and degrades gracefully (never hard-fails) if a model or Neo4j is unavailable — exactly per `CLAUDE.md`'s mandate.
- The Android app (`fusion-reference-bank/`): a real 4,770-line Kotlin/Compose app with a working SDK that round-trips against the real backend.
- Session Intelligence (the *new* package, `api/session_intelligence/`): a real weighted-trust formula with actual SQLite persistence.
- The AI Copilot: genuinely calls Google Gemini (not scripted) when the API key works.

**What will break or embarrass if a judge pokes at it**:
- **`ml/metrics_report.md` — the single most important honesty number in the whole demo — currently shows a fabricated-looking PR-AUC of 1.0 for every model**, because it was silently overwritten by an unrelated, circular synthetic-data evaluation harness instead of the real PaySim-trained report. This is the exact "suspiciously round headline metric" `CLAUDE.md` explicitly bans, and it's live right now. **Fix this before anything else — see §12, Priority 0.**
- **XAI/SHAP explainability doesn't exist anywhere in the live path.** The module that has the "counterfactual" field (`api/risk_engine.py`) is dead code, never called by the live pipeline. The dashboard's XAI panel renders whatever comes back — which for the real ML branch is a single generic sentence, not per-feature attribution.
- The Razorpay integration is a webhook *receiver* only — there's no payment-link/order creation code anywhere, and the most likely reason the user's test transaction never appeared is that Razorpay's dashboard was never told to call the webhook, or was pointed at `localhost` (see §7.3 — this directly answers the question from the prior session).
- Two "session intelligence" systems run simultaneously and disagree — `/session/*` (old, in-memory, defaults to a hardcoded persona) vs. `/sessions`+`/trust-*` (new, SQLite-backed, real formula) — hitting the same session ID on each gives two different trust scores.
- Several dashboard pages (`/telemetry`, `/banking`, `/settings`) have zero backend wiring — three fixed sample rows, no fetch call at all, easily spotted by opening the browser Network tab.
- The Render/Vercel deployment exists but returned HTTP 503 during this audit (free-tier cold start). **Run the demo entirely locally** (see §9).

---

## 2. What this project actually is now vs. `CLAUDE.md`'s scope

`CLAUDE.md`'s hard scope list ("BUILD" / "DO NOT BUILD") describes: data generator, tabular model, graph model, anomaly model, one fusion risk engine, one FastAPI process, one React dashboard, a quantum monitor, a CERT-In PDF. It explicitly forbids Kafka/Flink/Kubernetes/microservices — and that guardrail *is* honored: everything still runs as **one FastAPI process**, no forbidden infra was introduced anywhere.

But within that one process, the following were added on top of the original slice (all real code, not vaporware — see the relevant sections for verdicts):
- A full **synthetic "virtual bank" generator** (`api/synthetic_universe/`) — fabricates an entire bank (customers, PAN/Aadhaar-shaped IDs, KYC tiers, devices, transactions) from nothing, separate from and parallel to the CLAUDE.md-sanctioned `data/build_overlay.py` (which anchors to real PaySim data).
- A **pre-transaction session/investigation/digital-twin intelligence stack** (`api/session_intelligence_engine.py` legacy + `api/session_intelligence/` new package + `api/digital_twin_engine.py` + `api/investigation_intelligence_engine.py`).
- A **SOAR-style response orchestrator** (`api/response_orchestrator_engine.py`).
- A **mock blockchain evidence ledger** (`api/ledger_service.py`, `api/trust_fabric_engine.py`) branded "Hyperledger Fabric" — it's a real SHA-256+HMAC seal, no actual blockchain network.
- A **mobile "FAT-SDK" developer portal + real Android app** (`api/sdk_engine.py`, `fusion-reference-bank/`).
- A **full identity/auth/banking layer** (`api/core_platform/`, `api/identity_trust/`, Supabase migrations) — genuinely new, genuinely real authentication, not in the original brief.
- An **AI Copilot** backed by Google Gemini (`api/copilot_engine.py`).
- A **Razorpay webhook receiver** (`api/gateway_integration.py`) — half-built (see §7.3).

None of this violates the "no forbidden infrastructure" guardrail. But it does mean the "one 90-second demo script" in `Docs/demo_script.md` now covers maybe 15% of what's actually clickable in the running dashboard — worth deciding deliberately what judges will and won't see.

---

## 3. The core fusion risk engine — is the headline claim true?

This is the thing the whole mission statement depends on: *"Our platform fuses [SIEM + fraud] into one graph and blocks the transfer while it's still in flight."* The live endpoint is `POST /evaluate/transaction` in `api/main.py:286-317`, which calls `platform_pipeline.process(...)` — the `AuthoritativePlatformPipeline` in `api/core_platform/pipeline.py`. This supersedes an older, almost-entirely-hardcoded pipeline (`api/pipeline_engine.py` + `api/trust_engine.py`) that's still reachable at the secondary route `/evaluate/transaction/pipeline` but is **not** what the primary endpoint uses.

| Component | File | Verdict | Evidence |
|---|---|---|---|
| Tabular fraud score | `api/core_platform/model_runtime.py` → `ml/predict.py` | 🟢 **REAL** | Loads `ml/models/lgbm_fusion.joblib` (resolved from `ml/models/metadata.json`), runs real `ml.features.engineer_features()` + `model.predict_proba()` (`model_runtime.py:168-171`). Hashes the artifact file for integrity. |
| Graceful degrade | `model_runtime.py:65-107, 159-166` | 🟢 **REAL** | If joblib/metadata missing or inference throws → `ModelUnavailable` status + a deterministic rule-based fallback (never hard-fails). Exactly matches `CLAUDE.md`'s mandatory degrade-gracefully rule. |
| Graph pattern detection | `api/core_platform/graph_runtime.py` | 🟢 **REAL**, but not what `CLAUDE.md` describes | Real live networkx queries: `nx.shortest_path` for circular-transfer detection, `nx.weakly_connected_components` for mule-ring detection (size≥5, edges≥5). Neo4j-if-configured / networkx-fallback works correctly (`graph_runtime.py:431-441`). **But zero PageRank/betweenness/Louvain community detection exists in the live path** — `CLAUDE.md`'s "centrality" requirement is unmet at serving time (it *is* computed correctly offline in `graph/build_graph.py`, see §5, but never reaches the API due to a path bug). GraphSAGE is also unwired live — no `.pt` checkpoint file exists on disk, so `graphsage_status()` always reports `UNAVAILABLE`. |
| Cyber threat signal | `api/cyber_threat_engine.py` | 🟢 **REAL** rule engine | Deterministic (no `random`), 9-category rule evaluator, honestly labels its own confidence as `None` ("deterministic rule evidence is not a calibrated probability") rather than faking a score. |
| **The "fusion"** | `api/core_platform/decision_runtime.py` | 🟡 **MIXED — real, but simpler than advertised** | It is **not** a weighted score blend. The entire logic is: any `CRITICAL`-severity threat → force `BLOCK`; otherwise pass through the model's own action. Graph findings become "fusion" only by being re-classified as `CRITICAL` threats (`cyber_threat_engine.py` maps `CIRCULAR_TRANSFER`/mule-ring findings straight to `BLOCK_TRANSACTION`), which then trips that one branch. Real, live, and does genuinely combine signals — just via rule escalation, not a numeric formula. |
| Demo persona reliability | `graph_runtime.py:85-92` | 🟡 By design | 5 hardcoded seed edges are permanently loaded into the in-memory graph at every process start, including a pre-wired circular relationship for `usr_abc` (`ACC_ABC_123 → ACC_MULE_002 → ACC_ABC_123`) — so the demo transaction reliably triggers a **real** algorithmic finding rather than a scripted one. Reasonable design choice, not deception. |
| XAI / SHAP explainability | — | 🔴 **NOT IMPLEMENTED** | No SHAP library usage anywhere in `api/`. `api/risk_engine.py` (the module with a `"counterfactual"` field) is dead code, never imported by `main.py`. The live response's `reasons` field, for the real-model branch, is the single generic string `"Decision derived from loaded model artifacts"` — not per-feature attribution. The dashboard's SHAP-driven panels (`XAIWorkspace.jsx`) render real data *when supplied*, but the live pipeline doesn't supply per-feature SHAP values today. |

**Bottom line for this section:** the mission-statement claim is **mostly true** for detection (real model + real graph pattern-matching genuinely combine to drive a verdict) and **not true yet** for the "explainable" half of the pitch. If a judge asks "show me the SHAP values," there currently isn't a real answer.

---

## 4. ML & Graph pipeline — the strongest part of the codebase, with one live landmine

This is genuinely `CLAUDE.md`'s "core, defensible innovation," and the training code is the most rigorous, best-documented part of the repo:

- **`data/build_overlay.py`** — real. Verified on disk: PaySim (493MB raw log), Elliptic (689MB features + edgelist + classes), UNSW-NB15 (train/test CSVs, 82k/175k rows). Mandatory "HONESTY NOTICE" docstring present. `data/processed/overlay_report.md` confirms 400,000 transactions, 8,213 fraud (2.053%), 45.0% cyber-preceded (matches the `CYBER_PRECEDED_FRAUD_FRACTION=0.45` config exactly) — internally consistent, non-round, real.
- **`ml/train.py`** — real. Time-aware split on `step`, SMOTE on the training split only (`imblearn.over_sampling.SMOTE`), XGBoost + LightGBM trained head-to-head for baseline vs. fusion, Isolation Forest trained unsupervised, PR-AUC/F1/recall-at-0.5%-FPR/confusion-matrix computed properly, with a "Why Accuracy Is Meaningless" section in its own report generator — this *is* what `CLAUDE.md` asked for.
- **`graph/train_graphsage.py`** — real. 2-layer `SAGEConv` (PyTorch Geometric) trained on actual Elliptic data, 50 epochs. Reported metrics are genuinely non-round: **AUC 0.9850, F1 0.8665, Precision 0.9259, Recall 0.8143**, confusion matrix `[[41723, 296], [844, 3701]]` (`graph/metrics_note.txt`).
- **`graph/build_graph.py`** — real PageRank/betweenness/Louvain computation on the transaction graph — but has a relative-path bug (`'../data/processed/entity_graph_features.json'`, one directory too high when run from repo root), so the output never lands where `api/` expects it, and the module that was meant to read it (`api/risk_engine.py`) is dead code anyway. **The centrality work is real but currently unreachable from the live app.**

**🔴 The critical live problem:** `ml/metrics_report.md` — the file both the dashboard's Analytics page and `/metrics/evaluate` read from — is **not** `train.py`'s honest output right now. It was overwritten by a separate, undocumented pipeline (`ml/evaluate.py` + `ml/build_eval_set.py`, scoring `api/synthetic_universe/`-generated data instead of real PaySim data). Its label is circularly defined (`is_fraud = (channel_risk_score == 0.94)`, and `cyber_flag` is set by the exact same branch) — so "cyber-only" trivially gets perfect recall, and the file currently shows **PR-AUC = 1.0, Recall ≈ 0.99–1.0 for every one of the three modalities (transaction-only, cyber-only, full-fusion)**. This is precisely the "never hardcode a suspiciously round headline metric" scenario `CLAUDE.md` warns about — except it isn't hardcoded, it's honestly computed from a rigged evaluation set, which is arguably worse because it looks legitimate. Model artifact timestamps (Jul 25, today) postdate the report/eval files (Jul 24) — i.e., `train.py` *was* re-run recently, but its real report isn't what's currently on disk. **Re-running `python ml/train.py` last, after any `evaluate.py`/`build_eval_set.py` run, fixes this in one command — see §12.**

Three other distinct "fusion uplift" numbers exist in the repo and don't agree with each other or with the current metrics file: `Docs/ps2_coverage.md` says **+0.09% Recall**; `api/copilot_engine.py`'s hardcoded Q&A narrative text says **+5.4% Uplift (PR-AUC 0.941→0.992)**; `web/src/pages/AnalyticsPage.jsx` computes a number live from `/metrics/evaluate` (this is no longer hardcoded — a prior "+38.4%, zero API calls" bug was already fixed — but it now inherits the rigged-eval-set problem above).

---

## 5. Frontend dashboard — page by page

The dashboard is a React/Vite SPA (`web/src/App.jsx`), lazy-loaded routes under one `AppLayout` shell (Sidebar + TopBar + content). Index route `/` is `CyberThreatIntelligencePage` — **this is the first screen a judge sees**, not `DashboardPage.jsx` (which exists but is orphaned — `/dashboard` is a pure redirect to `/operations`, bypassing it).

### 5.1 `/` — Cyber Threat Intelligence Dashboard 🟡 MIXED — first screen, mostly real chrome around several static tiles
Real: `GET /threats` fetch, a live authenticated `WebSocket` to `/ws/stream` with auto-reconnect, and a real `DataTable` against `GET /transactions`. IOC "copy" button genuinely works (`navigator.clipboard`).
Hardcoded: the "Incident Queue" list (5 fixed named incidents), the 8-tile KPI strip (`'Loss Prevented': '$2.3M'`, `'Detection Accuracy': '99.7%'`, `'Transactions Today': '1.2M'` — all static literals, only the "Threats" tile is live), Geo Intelligence percentages, "Top Threat Actors"/"Dark Web Mentions" panels.
Buttons: "Force Approve" / "Freeze Recipient" / "Approve Override" / "Confirm Block" all fire `alert()` only — no backend mutation. "Investigate Case" does set real navigation state before its `alert()`.

### 5.2 `/operations` — Operations Center (the demo-script page) 🟡 MIXED
This is what `Docs/demo_script.md` walks through. Reframed toward "Pre-Transaction Cyber Fraud Prevention." Real WebSocket-driven pipeline-stage accumulation (`websocketStages`) feeds `FusionLifecyclePipeline` → `RealTimeProcessingPipeline` — **but that component ignores the prop entirely** and instead renders 10 static stages keyed off 3 hardcoded `SAMPLE_TRANSACTIONS`, so "Real-Time Processing Pipeline" is, as shipped, scripted regardless of the live WS stream running underneath it. `SessionTrustPassportPanel` and `InvestigationIntelligencePanel` are genuinely server-driven (real `POST /session/analyse`, `POST /investigation/analyse`). `quantumData`/`apiLatency` are fetched live but no longer rendered anywhere (their only consumer, the old KPI strip, was deleted) — dead state from real calls.

### 5.3 `/cases` — Cases Workqueue 🟢 REAL/LIVE
`DataTable` against real `GET /cases` with working server-side search/filter/sort/pagination.

### 5.4 `/customers` — Customer 360 🔴 HARDCODED/MOCK
100% local mock data (5 customer records), no backend wiring at all — despite a polished search/filter/preview-modal UI.

### 5.5 `/investigation/:caseId` — Investigation Workbench 🟡 MIXED
Falls back to a hardcoded `CASE-2026-8942` if no case ID in the URL. Hosts real, props-driven `TransactionTable`, `TimelineEvent`, `RiskScoreGauge`, `XAIWorkspace` (genuinely renders live `shap_features`/`counterfactual_sentence` — the display logic is real, it's just that the live pipeline doesn't currently supply that data, per §3). Also embeds `SessionTrustPassportPanel` with a **hardcoded literal** `sessionId="SESS_9921_CRITICAL"` regardless of the actual case being viewed.

### 5.6 `/analytics` — Analytics 🟡 MIXED
Threat vectors / hourly velocities / geo-origins / SHAP-driver tables are hardcoded local arrays (no fetch). The one number that *is* live — the fusion-uplift headline — pulls from `/metrics/evaluate`, which (per §4) currently reflects the rigged synthetic-eval numbers rather than a real PaySim-trained comparison. "Export CERT-In Report" button is a plain `alert()`, doesn't call the real report endpoint.

### 5.7 `/reports` — Reports 🟡 MIXED
"Generate CERT-In Report" genuinely calls `POST /report/cert-in` and downloads a real PDF (this is the button the demo script's climax moment depends on, and it works) — **but the request body is 100% hardcoded** (`txn_demo_999`/`usr_abc`/₹750,000/score 94/3 canned reasons), so every click produces the identical PDF regardless of what's selected. The "Recent Filings Queue" is one static row, never fetched.

### 5.8 `/sessions` — Session Intelligence 🟢 REAL/LIVE
The most solid live surface in the whole dashboard: polls real `GET /sessions` every 5s, real `GET /trust-history/{id}`, and a live authenticated WebSocket patching the trust passport/deltas/recovery events in place. `TrustComponentHeatmap`, `TrustPassportCard`, `TrustTimelineChart` (a real `recharts` `LineChart`) are all genuinely props-driven from this live data.

### 5.9 `/graph` — Graph Runtime 🟢 REAL/LIVE, honest fallback
Fetches real `GET /graph/topology`. `Neo4jGraphStudio.jsx` renders it through the real `react-force-graph-2d` library. If the fetch fails, it falls back to a hardcoded, honestly-labeled 100-node `DEMO_GRAPH` (visibly badged `DEMO` in amber vs. `LIVE` in green) — this is the one place in the whole app that's transparent about its own fallback state rather than pretending to be live.

### 5.10 `/executive` — Executive Command Center 🟡 MIXED
One real fetch (`GET /quantum/posture`); everything else — "Today's Prevented Loss: INR 87,00,000," "SLA Latency: 48ms," attack-vector percentage bars — is a hardcoded literal, some explicitly mislabeled "Live Telemetry."

### 5.11 `/telemetry` and `/banking` 🔴 HARDCODED/MOCK
Both pages: `const sampleEvents = [...]` (3 fixed rows each), **zero fetch calls in either file**. Labeled "Real-time network login anomalies" / "Live transaction ledger." A judge opening the browser Network tab on either page sees no request at all.

### 5.12 `/synthetic-lab` — Synthetic Lab 🟡 MIXED, with an honesty regression
Genuinely wired to the real `/synthetic/universe/generate` and `/synthetic/universe/export/*` endpoints (params verified to match backend exactly). **But the old page's explicit "Dataset Honesty & Methodology Notice" panel — which told a viewer this is synthetic, not real bank data — was deleted and never replaced.** Also shows a static "Neo4j Active" label regardless of whether Neo4j is actually configured.

### 5.13 `/developer` — SDK Runtime / FAT-SDK Portal 🟢 REAL/LIVE
All `/sdk/*` endpoints confirmed to exist server-side and are genuinely called. Kotlin/Gradle code samples reference a fictitious SDK class name for illustration only (not real shippable code, but clearly a docs sample, not a functionality claim).

### 5.14 `/settings` ⚫ DEAD
Three threshold sliders are local state only, never sent anywhere. **"Save Policy Configuration" has no `onClick` handler at all.**

### 5.15 AI Copilot panel (embedded in Operations Center, no standalone route)
See §10.1 — genuinely calls Gemini, with a silent canned-text fallback on any failure.

### 5.16 Global chrome — every page
`TopBar.jsx`: "Analysts Online: 14," "Current Alerts: 8," "Open Cases: 17," "Engine Status: Healthy" are static JSX literals on every single page load, never fetched. Notification bell and profile avatar have no click handlers.

### 5.17 Components confirmed dead/unreachable anywhere in the app
`VerdictBadge.jsx`, `XAIPanel.jsx`, `VerdictHero.jsx` (a fully-built ALLOW/CHALLENGE/BLOCK hero banner), `DashboardPage.jsx`, `DecisionStabilityInspector.jsx`, `DecisionTrustReport.jsx`, `InvestigationTrustPanel.jsx` — all built, none rendered by any live route. If you want a cleaner "verdict hero" moment than what's currently shown, `VerdictHero.jsx` is sitting there ready to be wired in.

### 5.18 Investigation-collaboration features — local-state theater
`AnalystCollaboration` (comments vanish on refresh, nothing persisted), `LearningLoop` ("Submit Feedback to Retraining Queue" → fake success banner, hardcoded Queue ID, no network call), `SimilarIncidentSearch` (hardcoded case list, "Inspect Case" button has no handler), `BlastRadiusAnalysis` (hardcoded exposure numbers), `EvidenceLocker` (hardcoded evidence checklist that ignores its own props; Block/Challenge buttons fake a 600ms "ENFORCING…" spinner with no backend call), `CSVSchemaMapperModal` (presented as file upload — there is no `<input type="file">` anywhere in the component; the filename is permanently a hardcoded placeholder).

### 5.19 `FraudDevToolsInspector` (8-tab per-transaction inspector) 🟡 MIXED
Tab 1 (raw JSON) and half of Tab 3 are genuinely live. Tab 5's entire risk breakdown is fixed — **always shows "TOTAL COMPOSITE RISK SCORE: 94.0/100 [BLOCK]" regardless of which transaction is actually selected** — the kind of thing a judge testing two different transactions back-to-back would notice immediately.

---

## 6. Identity, Auth, and the Razorpay question

*(This section directly addresses the question from the prior session: "I made a Razorpay test-mode payment link, the transaction failed, and it's not being recorded anywhere.")*

### 6.1 Identity Trust (`api/identity_trust/`) 🟢 REAL, correctly gated
A real, dependency-free `urllib`-based client makes genuine HTTPS calls to Supabase Auth/REST — but only if `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set; otherwise it degrades to local SQLite, exactly per `CLAUDE.md`'s graceful-degrade rule. **One real bug worth knowing about**: `/identity/security/overview` reads *only* from local SQLite, never from Supabase — so if Supabase is configured and a write genuinely succeeds there, the dashboard panel that's supposed to show it will look empty. This is the same *class* of bug as the Razorpay issue below: **a real write can succeed somewhere the dashboard doesn't look.**

### 6.2 Banking auth (`api/core_platform/banking_auth.py`) 🟢 REAL
Real PBKDF2-SHA256 (310,000 iterations) password hashing, real self-issued HMAC-signed JWT-like tokens, timing-safe comparisons. One hardcoded backdoor: `demo_user` / `FusionDemo!2026`, always injected (intentional, documented in `render.yaml`, for the reference APK). The Supabase sign-in call inside this file is dead code — wrapped in `except Exception: pass`, its result is discarded either way; the real auth decision is the local PBKDF2 check.

### 6.3 Razorpay (`api/gateway_integration.py`) 🟡 HALF-BUILT — this is your answer
**There is no code anywhere in this repo that creates a Razorpay order or payment link.** You created that link by hand in the Razorpay Dashboard — nothing in the code did or could do that. `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are declared in `render.yaml` and even present in your local `.env`, but **zero Python code reads them** — they're configured but never consumed.

What *does* exist is real: `POST /gateway/webhook` correctly implements Razorpay's actual HMAC-SHA256(raw_body, secret) signature verification against the `X-Razorpay-Signature` header, is unit-tested, and — if it receives a verified call — genuinely writes a `webhooks` record to SQLite and runs the payload through the real risk pipeline. The problem is entirely upstream of this code:

1. A payment link existing does nothing by itself — Razorpay only calls your webhook if one is **explicitly registered in the Razorpay Dashboard** (Settings → Webhooks), pointing at a **publicly reachable** URL. If the backend was only running on `localhost` when you tested, Razorpay's servers physically cannot reach it — there's no ngrok/tunnel anywhere in this repo.
2. Even with a webhook registered, people commonly only subscribe to success events (`payment_link.paid`, `payment.captured`) and forget `payment.failed`. Since your transaction *failed*, if that event type wasn't checked in the Dashboard, Razorpay would never have called your webhook at all — nothing downstream would matter.
3. `GATEWAY_WEBHOOK_SECRET` is marked `sync: false` in `render.yaml`, meaning it must be set manually in the Render dashboard, separately from your local `.env`. If it's unset there, every real webhook call gets an immediate silent `401` with no trace anywhere you'd normally look.
4. Even a fully successful webhook call lands in the generic fraud/risk transaction feed, not a dedicated "payments" UI — so it might have "worked" somewhere you weren't looking.

**To actually make Razorpay work for a demo**, you'd need to: (a) add real order/payment-link creation code that calls the Razorpay API (currently missing entirely), (b) register a webhook in the Razorpay Dashboard against a publicly reachable URL (the deployed Render URL, or an ngrok tunnel to localhost), (c) explicitly subscribe to both success and failure event types, and (d) confirm `GATEWAY_WEBHOOK_SECRET` is set on whichever server receives the call. None of this is currently wired — treat Razorpay as a 🔵 **FUTURE** feature for this demo, not something to rely on live.

### 6.4 Device pairing (QR flow) 🟢 REAL
SHA-256-hashed, single-use, 5-minute bootstrap tokens with timing-safe comparison; a real signed access token is issued on success. In-memory only (lost on restart). The `refresh_token` returned to the device is decorative — never stored, no endpoint validates it.

### 6.5 Environment variables that are pure dead weight
`IPQUALITYSCORE_API_KEY`, `ABUSEIPDB_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` are all declared in config/`render.yaml` but never read by any code — scaffolded integrations that were never wired up.

---

## 7. Android app (`fusion-reference-bank/`)

🟢 **REAL, not decorative.** 4,770 lines of Kotlin across 13 working Jetpack Compose screens (Splash, Pairing, Login, Registration, Dashboard, Accounts, Transfer, Beneficiary, QR Payment, Bill Payment, Profile, Simulator, Trust Passport), real Hilt DI, a real Room-backed offline event queue, encrypted local storage, and a real Retrofit SDK (`sdk/Fusion.kt`, `sdk/network/FusionApiService.kt`) that calls real backend endpoints confirmed to exist server-side (`/device/pair`, `/device/register`, `/sdk/*`, `/ws/stream`). Both a debug APK (18MB, valid) and a signed release APK (1.8MB) exist on disk right now as genuine Gradle build output.

Two things to know before demoing it:
- **Debug builds default to `http://10.0.2.2:8001/`** (Android-emulator-only loopback alias) — the app is built to talk to a **locally running** backend, not the deployed Render URL, by default.
- **`/download/apk` and `/download/sdk` (in `api/main.py`) fall back to fake dummy files** (`b"Dummy APK for Vercel Demo"`) if the real files aren't found — and **the deployed Render Docker image never copies `fusion-reference-bank/` or `SDK_REFERENCE.md` into the container** (`api/Dockerfile` only copies `api/`, `ml/`, `graph/`). So if a judge clicks "Download APK" against the *deployed* backend, they silently get a fake placeholder file. Locally, they'd get the real one. **Demo this locally.**
- One self-reported claim doesn't hold up: `APK_BUILD_REPORT.md` claims Frida-detection is "VERIFIED," but `DeviceAttestationEngine.checkFrida()` is a hardcoded `return false` stub. Root detection is real; Frida detection isn't.

---

## 8. Deployment reality — where should the demo actually run?

A real deployment exists and was iterated on repeatedly (commit history: "wire Render env vars," "resolve bundle size limit and 404 errors," "isolate Vercel dashboard from Python backend"): backend on Render (`unified-cyber-fraud-intelligence.onrender.com`), frontend on Vercel (`web-three-nu-82.vercel.app`), with real serverless token-proxy functions keeping client secrets out of the browser bundle.

**But during this audit, the Render backend returned HTTP 503 twice** — consistent with Render's free tier sleeping after ~15 minutes of inactivity (30-60s cold-start wake time), though a genuinely crashed service can't be ruled out from outside. Combined with the APK/SDK-download landmine above (§7) and the fact that the Android app's debug build only talks to `localhost` by default, **the safest, fully-rehearsed path is to run everything locally**: `uvicorn api.main:app` + `npm run dev` (the root `package.json` proxies to `web/`), on one laptop. If you want the deployed URL as a fallback talking point, **ping it to warm it up before you go on stage** — do not assume it will answer instantly cold.

---

## 9. AI Copilot, Cyber Threat Engine, and the session-intelligence duplication

### 9.1 AI Copilot (`api/copilot_engine.py` + `AICopilotPanel.jsx`) 🟡 REAL-BUT-FRAGILE
Genuinely calls Google Gemini (`google.generativeai`, trying `gemini-flash-lite-latest` → `gemini-1.5-flash`) with live-pulled platform state (real SQLite rows, real graph topology, real session data) stuffed into the prompt as context — this is real grounding, not fabricated. **But `google-generativeai` was not installed in this project's own `.venv` at audit time** despite being in `requirements.txt` — since `main.py` imports `copilot_engine` unconditionally at the top, a missing dependency here can take down the *entire* backend, not just the copilot feature. **Check `pip install -r requirements.txt` was run in whatever environment demos the app.** Any Gemini failure (missing key, quota, network) silently degrades to ~200 lines of hand-written, keyword-matched canned Markdown with no visible signal to the user that they're seeing scripted text instead of a real model response. `FUNCTION_CALLING.md`'s description of real Gemini tool-calling is aspirational — the actual mechanism is one big context-stuffed prompt, no `tools=`/`FunctionDeclaration` anywhere in the code.

### 9.2 Cyber Threat Engine (`api/cyber_threat_engine.py`) 🟢 REAL rule engine
Deterministic (no randomness), genuinely wired into the live pipeline, honestly declines to fake a calibrated confidence score. In-memory only, no MITRE ATT&CK mapping (the *old*, no-longer-primary `session_intelligence_engine.py` has MITRE mapping; this newer one doesn't — a genuine regression if MITRE tagging matters to your pitch).

### 9.3 Session Intelligence — two systems, live simultaneously, disagreeing 🟡 IMPORTANT TO KNOW BEFORE A JUDGE FINDS IT
- **Old** (`api/session_intelligence_engine.py`, singleton `session_engine`) backs `/session/analyse`, `/session/passport/{id}`, `/session/update`, `/session/recalculate`. In-memory only, defaults unknown sessions to a hardcoded `usr_abc` demo persona.
- **New** (`api/session_intelligence/` package) backs `/sessions`, `/trust-passport[/{id}]`, `/trust-history/{id}`, `/trust-components/{id}`, `/trust/recalculate`, `/trust/live`. Real weighted-formula trust computation (component weights sum to exactly 1.0), genuine SQLite persistence (confirmed: real rows on disk), and a real `asyncio`-based pub/sub broker.

Both are live at the same time, computing independent trust scores for the same session ID via completely different math, with no indication anywhere of which is "authoritative." **Decide before the demo which one the dashboard should be talking about** (the new one is more real and better engineered) and consider disabling or clearly labeling the old routes so a technical judge poking at the API doesn't find two different answers to the same question.

### 9.4 Persistence check
`finspark.db` (root) and `api/finspark.db` are both real, actively-written SQLite databases (confirmed: 1,316+ rows across 19 collections) — not leftover artifacts. Caveat: `DB_PATH` defaults to a relative path, so the two files silently diverge depending on the server's launch working directory. **Pin `DB_PATH` to an absolute path before the demo** to avoid "my data disappeared" surprises from launching the server from a different folder.

---

## 10. Reference: the hardcoded demo persona

An enormous fraction of the codebase branches on one canonical scenario. Recognizing these values explains *why* so many features "just happen to work" for one specific input and nothing else:

| Field | Value |
|---|---|
| `user_id` | `usr_abc` |
| Customer name | "Rajesh Kumar" |
| `amount` | `750000.0` (₹7.5L) |
| `nameOrig` / origin account | `ACC_ABC_123` |
| `nameDest` / destination | `ACC_MULE_NEW` |
| `dest_mule_cluster_id` | `cluster_alpha` |
| `device_id` | `dev_9999` |
| `ip` | `185.15.2.22` (labeled Moscow/Russia) |
| `session_id` | `SESS_9921_CRITICAL` |
| `case_id` | `CASE-2026-8942` |
| `txn_id` (report demo) | `txn_demo_999` |
| Composite score | `94.0` → `BLOCK` |

If you demo with *any other* transaction, expect several panels (Fraud DevTools Inspector's risk breakdown, `BlastRadiusAnalysis`, `EvidenceLocker`, parts of the AI Copilot fallback, `TelemetryPage`/`BankingPage`) to keep showing this exact scenario regardless of what you actually selected.

---

## 11. Priority-ranked pre-demo fix list

**P0 — fix before anything else (minutes, high visibility risk):**
1. Re-run `python ml/train.py` (full run) **last**, after any `ml/evaluate.py`/`ml/build_eval_set.py` run, so `ml/metrics_report.md` reflects the real PaySim-trained comparison instead of the rigged synthetic-universe evaluation currently showing PR-AUC=1.0 everywhere. This is the single highest-risk "gotcha" number in the repo relative to `CLAUDE.md`'s own explicit rule.
2. Decide and rehearse: **local demo only.** Warm up the Render URL beforehand if you want it as backup, but don't rely on it being instantly responsive.
3. Pin `DB_PATH` to an absolute path so session/store data doesn't silently split across two SQLite files depending on launch directory.
4. Confirm `google-generativeai` is actually installed in whatever Python environment runs the live demo (missing dependency can crash the entire backend on import, not just the Copilot).

**P1 — worth fixing if time allows (visible if a judge clicks around):**
5. Wire a real `sessionId`/`caseId` into `SessionTrustPassportPanel` in the Investigation view instead of the hardcoded `SESS_9921_CRITICAL` literal.
6. Add an `onClick` to the Settings page's "Save Policy Configuration" button, or remove the page from the sidebar if it's not going to do anything.
7. Either point the AI Copilot's `... or 1980000.0` / `... or 3` fallback constants at genuinely empty-safe values, or accept that they're intentional floor values and don't claim them as "live" in your pitch.
8. Decide which session-intelligence system is authoritative and stop advertising both `/session/*` and `/sessions`+`/trust-*` as if they're the same thing.

**P2 — nice to have, low demo risk:**
9. Fix `graph/build_graph.py`'s relative-path bug (`'../data/processed/...'` → `'data/processed/...'`) so the offline centrality computation actually reaches disk where intended.
10. Restore a synthetic-data honesty notice to `SyntheticLabPage.jsx` (removed in a prior redesign).
11. Clean up the duplicated route blocks in `api/main.py` (`/metrics/*`, `/threats/*`, `copilot_router` all registered twice) — harmless today (first registration wins) but a real trap for whoever edits this file next.

---

## 12. A note on the other `*_REPORT.md` files in this repo

The repo root has ~50 self-authored audit/report files (`FINAL_CTO_READINESS_REPORT.md`, `PRODUCTION_READINESS_AUDIT.md`, `SYSTEM_AUDIT_REPORT.md`, `AI_VALIDATION_REPORT.md`, etc.), generated across the project's history. Several claims in these were checked directly against the code while producing this document and did **not** hold up (e.g. "Frida detection VERIFIED" when it's a hardcoded stub; "100% OPERATIONAL" pairing flow claims with no attached evidence). Treat any specific number or "VERIFIED"/"PRODUCTION READY" claim in those files as a hypothesis to re-check against the actual code, not a fact — this document was written specifically to replace guesswork like that with file:line-verified findings. `Docs/new_changes.md` is the one prior exception: it's independently rigorous and its findings (cross-checked here) held up well, aside from being written before the `core_platform/` pipeline rewrite superseded some of what it audited.

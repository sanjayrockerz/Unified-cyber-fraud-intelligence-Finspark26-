# api/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# libgomp1 provides libgomp.so.1 (GNU OpenMP), required at import time by the
# compiled lightgbm/xgboost shared libraries. python:3.11-slim doesn't ship it.
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies (trimmed: excludes torch/torch_geometric, which are
# training-only and never imported at request-serving time — see
# requirements-render.txt for why. Keeps the image inside Render's free tier.)
COPY requirements-render.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements-render.txt

# Copy API source
COPY api/ api/
# DB_PATH defaults to ./finspark.db, i.e. /app/finspark.db given WORKDIR above --
# a top-level file, not api/finspark.db. Without this the container starts with
# no file at that path, SQLite creates an empty one, and every list endpoint
# silently returns zero rows.
COPY finspark.db finspark.db
COPY ml/__init__.py ml/__init__.py
COPY ml/features.py ml/features.py
COPY ml/predict.py ml/predict.py
# Required by GET /cases/{case_id}/explain. Without it the import fails inside
# the container and the endpoint reports EXPLAINER_FAILED for every case.
COPY ml/explain.py ml/explain.py
# Read by GET /metrics/evaluate. Without it the Overview headline reads
# "Unavailable" in production even though the report is committed to the repo.
COPY ml/metrics_report.md ml/metrics_report.md
# Trained model binaries are gitignored on main but force-committed on the
# deploy branch specifically so this COPY has something to pick up. The
# explainer above needs them too: no artifacts means no TreeSHAP attributions.
COPY ml/models/ ml/models/
COPY graph/ graph/

# Expose port (default for local `docker run`; hosts that inject $PORT override it)
EXPOSE 8000

# Run FastAPI — shell form so $PORT (set by Railway/Render at runtime) is honored,
# falling back to 8000 for local `docker run` with no PORT set.
CMD uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}

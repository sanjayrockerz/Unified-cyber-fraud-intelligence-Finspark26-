from __future__ import annotations

import json
import os
import re
import sqlite3
import threading
from typing import Callable


_configured_db = os.environ.get("DB_PATH") or os.environ.get("DATABASE_URL") or "./finspark.db"
DB_PATH = _configured_db.removeprefix("sqlite:///")
_lock = threading.RLock()
_conn: sqlite3.Connection | None = None
_SAFE_SORT_KEY = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def get_conn() -> sqlite3.Connection:
    global _conn
    with _lock:
        if _conn is None:
            _conn = sqlite3.connect(DB_PATH, check_same_thread=False)
            _conn.row_factory = sqlite3.Row
            _init_db()
        return _conn


def _init_db() -> None:
    conn = _conn
    assert conn is not None
    with conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS store (
                collection TEXT NOT NULL,
                key TEXT NOT NULL,
                tenant_id TEXT,
                value TEXT NOT NULL,
                PRIMARY KEY (collection, key)
            )
            """
        )
        columns = {row[1] for row in conn.execute("PRAGMA table_info(store)")}
        if "tenant_id" not in columns:
            conn.execute("ALTER TABLE store ADD COLUMN tenant_id TEXT")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS processed_requests (
                id INTEGER PRIMARY KEY,
                tenant_id TEXT NOT NULL,
                transaction_hash TEXT NOT NULL,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (tenant_id, transaction_hash)
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_transactions_tenant_timestamp "
            "ON store(tenant_id, json_extract(value, '$.timestamp') DESC) "
            "WHERE collection = 'transactions'"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_cases_tenant_timestamp "
            "ON store(tenant_id, json_extract(value, '$.created_at') DESC) "
            "WHERE collection = 'cases'"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_customers_tenant_timestamp "
            "ON store(tenant_id, json_extract(value, '$.customer_id')) "
            "WHERE collection = 'customers'"
        )


def init_db_indexes() -> None:
    """Public startup hook for schema, indexes, and idempotency initialization."""
    with _lock:
        get_conn()


def paginate(
    table: str,
    tenant_id: str,
    page: int = 1,
    limit: int = 20,
    order_by: str = "timestamp DESC",
    filters: dict | None = None,
) -> dict:
    """Compatibility wrapper around tenant-scoped SQL pagination."""
    match = re.fullmatch(r"([A-Za-z_][A-Za-z0-9_]*)\s+(ASC|DESC)", order_by.strip(), re.IGNORECASE)
    sort_key = match.group(1) if match else "timestamp"
    sort_desc = not match or match.group(2).upper() == "DESC"
    filters = filters or {}
    items, total = list_paginated(
        table,
        page=page,
        page_size=limit,
        sort_key=sort_key,
        sort_desc=sort_desc,
        tenant_id=tenant_id,
        query=str(filters.pop("q", "")),
        status=filters.get("status"),
        severity=filters.get("severity"),
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 0,
    }


def put(collection: str, key: str, value: dict, tenant_id: str | None = None) -> None:
    payload = dict(value)
    effective_tenant = tenant_id or payload.get("tenant_id")
    if effective_tenant:
        payload["tenant_id"] = effective_tenant
    with _lock:
        conn = get_conn()
        with conn:
            conn.execute(
                "INSERT OR REPLACE INTO store (collection, key, tenant_id, value) VALUES (?, ?, ?, ?)",
                (collection, str(key), effective_tenant, json.dumps(payload)),
            )


def get(collection: str, key: str, tenant_id: str | None = None) -> dict | None:
    with _lock:
        conn = get_conn()
        if tenant_id is None:
            row = conn.execute(
                "SELECT value FROM store WHERE collection = ? AND key = ?",
                (collection, str(key)),
            ).fetchone()
        else:
            row = conn.execute(
                "SELECT value FROM store WHERE collection = ? AND key = ? AND tenant_id = ?",
                (collection, str(key), tenant_id),
            ).fetchone()
        return json.loads(row[0]) if row else None


def list_all(collection: str, tenant_id: str | None = None) -> list[dict]:
    with _lock:
        conn = get_conn()
        if tenant_id is None:
            rows = conn.execute("SELECT value FROM store WHERE collection = ?", (collection,)).fetchall()
        else:
            rows = conn.execute(
                "SELECT value FROM store WHERE collection = ? AND tenant_id = ?",
                (collection, tenant_id),
            ).fetchall()
        return [json.loads(row[0]) for row in rows]


def list_paginated(
    collection: str,
    page: int,
    page_size: int,
    sort_key: str | None = None,
    sort_desc: bool = True,
    filter_fn: Callable[[dict], bool] | None = None,
    tenant_id: str | None = None,
    query: str = "",
    status: str | None = None,
    severity: str | None = None,
) -> tuple[list[dict], int]:
    """Return a tenant-scoped page using SQL COUNT/LIMIT/OFFSET."""
    normalized_page = max(1, int(page))
    normalized_page_size = min(max(1, int(page_size)), 100)
    offset = (normalized_page - 1) * normalized_page_size
    conditions = ["collection = ?"]
    params: list[object] = [collection]
    if tenant_id is not None:
        conditions.append("tenant_id = ?")
        params.append(tenant_id)
    if query:
        conditions.append("LOWER(value) LIKE ?")
        params.append(f"%{query.casefold()}%")
    if status:
        conditions.append("LOWER(json_extract(value, '$.status')) = ?")
        params.append(status.casefold())
    if severity:
        conditions.append("LOWER(json_extract(value, '$.severity')) = ?")
        params.append(severity.casefold())
    where = " AND ".join(conditions)

    with _lock:
        conn = get_conn()
        total = conn.execute(f"SELECT COUNT(*) FROM store WHERE {where}", params).fetchone()[0]
        if filter_fn is not None:
            # Compatibility for non-HTTP callers; production routes use SQL filters.
            items = [item for item in list_all(collection, tenant_id) if filter_fn(item)]
            total = len(items)
            if sort_key:
                items.sort(key=lambda item: str(item.get(sort_key, "")).casefold(), reverse=sort_desc)
            return items[offset : offset + normalized_page_size], total

        safe_sort = sort_key if sort_key and _SAFE_SORT_KEY.fullmatch(sort_key) else "rowid"
        direction = "DESC" if sort_desc else "ASC"
        rows = conn.execute(
            f"SELECT value FROM store WHERE {where} "
            f"ORDER BY json_extract(value, '$.{safe_sort}') {direction} LIMIT ? OFFSET ?",
            [*params, normalized_page_size, offset],
        ).fetchall()
        return [json.loads(row[0]) for row in rows], total


def put_raw(collection: str, key: str, value: str) -> None:
    with _lock:
        conn = get_conn()
        with conn:
            conn.execute(
                "INSERT OR REPLACE INTO store (collection, key, tenant_id, value) VALUES (?, ?, NULL, ?)",
                (collection, str(key), value),
            )


def get_raw(collection: str, key: str) -> str | None:
    with _lock:
        row = get_conn().execute(
            "SELECT value FROM store WHERE collection = ? AND key = ?",
            (collection, str(key)),
        ).fetchone()
        return row[0] if row else None


def delete(collection: str, key: str, tenant_id: str | None = None) -> bool:
    with _lock:
        conn = get_conn()
        with conn:
            if tenant_id is None:
                cursor = conn.execute("DELETE FROM store WHERE collection = ? AND key = ?", (collection, str(key)))
            else:
                cursor = conn.execute(
                    "DELETE FROM store WHERE collection = ? AND key = ? AND tenant_id = ?",
                    (collection, str(key), tenant_id),
                )
        return cursor.rowcount > 0


def check_resource_ownership(collection: str, resource_id: str, tenant_id: str) -> bool:
    """Return whether a resource belongs to the tenant; callers should 403 otherwise."""
    with _lock:
        row = get_conn().execute(
            "SELECT tenant_id FROM store WHERE collection = ? AND key = ?",
            (collection, str(resource_id)),
        ).fetchone()
    return bool(row and row[0] == tenant_id)


def is_processed(tenant_id: str, transaction_hash: str) -> bool:
    with _lock:
        row = get_conn().execute(
            "SELECT EXISTS(SELECT 1 FROM processed_requests WHERE tenant_id = ? AND transaction_hash = ?)",
            (tenant_id, transaction_hash),
        ).fetchone()
    return bool(row[0])


def mark_processed(tenant_id: str, transaction_hash: str) -> bool:
    with _lock:
        conn = get_conn()
        with conn:
            cursor = conn.execute(
                "INSERT OR IGNORE INTO processed_requests (tenant_id, transaction_hash) VALUES (?, ?)",
                (tenant_id, transaction_hash),
            )
        return cursor.rowcount == 1


def unmark_processed(tenant_id: str, transaction_hash: str) -> None:
    with _lock:
        conn = get_conn()
        with conn:
            conn.execute(
                "DELETE FROM processed_requests WHERE tenant_id = ? AND transaction_hash = ?",
                (tenant_id, transaction_hash),
            )

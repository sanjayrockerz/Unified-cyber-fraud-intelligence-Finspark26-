import asyncio
import importlib


def load_isolated_store(tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "pagination-test.db"))
    from api import store

    if store._conn is not None:
        store._conn.close()
    return importlib.reload(store)


def test_list_paginated_sorts_filters_and_bounds_pages(tmp_path, monkeypatch):
    store = load_isolated_store(tmp_path, monkeypatch)
    store.put("transactions", "one", {"txn_id": "one", "timestamp": "2026-07-01", "amount": 100})
    store.put("transactions", "two", {"txn_id": "two", "timestamp": "2026-07-03", "amount": 300})
    store.put("transactions", "three", {"txn_id": "three", "timestamp": "2026-07-02", "amount": 200})

    items, total = store.list_paginated(
        "transactions",
        page=1,
        page_size=1,
        sort_key="timestamp",
        sort_desc=True,
        filter_fn=lambda item: item["amount"] >= 200,
    )

    assert total == 2
    assert items == [{"txn_id": "two", "timestamp": "2026-07-03", "amount": 300}]


def test_list_endpoints_return_a_standard_pagination_envelope(tmp_path, monkeypatch):
    store = load_isolated_store(tmp_path, monkeypatch)
    store.put("transactions", "one", {"txn_id": "txn-1", "timestamp": "2026-07-01", "amount": 100})
    store.put("cases", "one", {"case_id": "case-1", "status": "OPEN"})
    store.put("customers", "one", {"customer_id": "customer-1", "name": "Asha"})

    from api import main

    monkeypatch.setattr(main, "store", store, raising=False)
    transaction_page = asyncio.run(main.list_transactions(page=1, page_size=50, sort="-timestamp", q="txn"))
    cases_page = asyncio.run(main.list_cases(page=1, page_size=50, sort="case_id", q=""))
    customers_page = asyncio.run(main.list_customers(page=1, page_size=50, sort="customer_id", q=""))

    assert transaction_page == {
        "items": [{"txn_id": "txn-1", "timestamp": "2026-07-01", "amount": 100}],
        "page": 1,
        "page_size": 50,
        "total": 1,
        "total_pages": 1,
    }
    assert cases_page["items"] == [{"case_id": "case-1", "status": "OPEN"}]
    assert customers_page["items"] == [{"customer_id": "customer-1", "name": "Asha"}]

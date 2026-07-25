import json
import os

cells = [
    {
        "cell_type": "markdown",
        "metadata": {},
        "source": [
            "# Fuzen AI — Complete System Audit & Production Readiness Notebook\n",
            "\n",
            "This notebook provides an automated validation and visualization harness for **Fuzen AI** (Unified Cyber-Fraud Intelligence Platform).\n",
            "It checks system components, database tables, backend endpoints, ML model readiness, test suite integrity, and displays all generated audit reports.\n"
        ]
    },
    {
        "cell_type": "markdown",
        "metadata": {},
        "source": [
            "## 1. System Inventory & Audit Reports Validation\n",
            "Validate that all 12 required markdown audit reports exist and display their verification status.\n"
        ]
    },
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "import os\n",
            "from IPython.display import display, Markdown\n",
            "\n",
            "reports = [\n",
            "    \"SYSTEM_AUDIT_REPORT.md\",\n",
            "    \"BACKEND_VALIDATION_REPORT.md\",\n",
            "    \"DATABASE_HEALTH_REPORT.md\",\n",
            "    \"NEO4J_HEALTH_REPORT.md\",\n",
            "    \"ML_VALIDATION_REPORT.md\",\n",
            "    \"PIPELINE_VALIDATION_REPORT.md\",\n",
            "    \"FRONTEND_VALIDATION_REPORT.md\",\n",
            "    \"VERCEL_DEPLOYMENT_REPORT.md\",\n",
            "    \"PERFORMANCE_REPORT.md\",\n",
            "    \"SECURITY_AUDIT_REPORT.md\",\n",
            "    \"TEST_REPORT.md\",\n",
            "    \"GLOBAL_HACKATHON_READINESS_REPORT.md\"\n",
            "]\n",
            "\n",
            "print(f\"Checking {len(reports)} audit reports...\")\n",
            "for r in reports:\n",
            "    exists = os.path.exists(r)\n",
            "    size = os.path.getsize(r) if exists else 0\n",
            "    status = f\"EXISTS ({size} bytes)\" if exists else \"MISSING\"\n",
            "    print(f\"{r:<38} : {status}\")\n"
        ]
    },
    {
        "cell_type": "markdown",
        "metadata": {},
        "source": [
            "## 2. Automated Backend API Health Verification\n",
            "Query the live FastAPI backend server (`http://localhost:8000`) for system readiness and platform status.\n"
        ]
    },
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "import urllib.request\n",
            "import json\n",
            "\n",
            "endpoints = [\n",
            "    \"http://localhost:8000/health/live\",\n",
            "    \"http://localhost:8000/health/ready\",\n",
            "    \"http://localhost:8000/platform/status\",\n",
            "    \"http://localhost:8000/scenarios/list\"\n",
            "]\n",
            "\n",
            "for url in endpoints:\n",
            "    try:\n",
            "        req = urllib.request.urlopen(url, timeout=3)\n",
            "        data = json.loads(req.read().decode(\"utf-8\"))\n",
            "        print(f\"[OK] {url:<40} -> Status: {req.status}\")\n",
            "        print(f\"     Response: {json.dumps(data)[:100]}...\")\n",
            "    except Exception as e:\n",
            "        print(f\"[WARN] {url:<40} -> {e}\")\n"
        ]
    },
    {
        "cell_type": "markdown",
        "metadata": {},
        "source": [
            "## 3. Database Table & Store Inspection\n",
            "Inspect the local SQLite store (`finspark.db`) and memory store collections.\n"
        ]
    },
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "import sqlite3\n",
            "import os\n",
            "\n",
            "db_path = \"finspark.db\"\n",
            "if os.path.exists(db_path):\n",
            "    conn = sqlite3.connect(db_path)\n",
            "    cursor = conn.cursor()\n",
            "    cursor.execute(\"SELECT name FROM sqlite_master WHERE type='table';\")\n",
            "    tables = cursor.fetchall()\n",
            "    print(f\"Database {db_path} connected. Tables found: {len(tables)}\")\n",
            "    for (tbl,) in tables:\n",
            "        cursor.execute(f'SELECT COUNT(*) FROM \"{tbl}\";')\n",
            "        cnt = cursor.fetchone()[0]\n",
            "        print(f\"   - {tbl:<30} : {cnt} records\")\n",
            "    conn.close()\n",
            "else:\n",
            "    print(f\"{db_path} not found directly in current dir, checking store module...\")\n",
            "    from api.store import list_all\n",
            "    print(f\"   - Customers count: {len(list_all('customers'))}\")\n",
            "    print(f\"   - Transactions count: {len(list_all('transactions'))}\")\n"
        ]
    },
    {
        "cell_type": "markdown",
        "metadata": {},
        "source": [
            "## 4. Machine Learning & Risk Engine Inference Test\n",
            "Execute a live test transaction evaluation through `platform_pipeline`.\n"
        ]
    },
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "import asyncio\n",
            "from api.core_platform.pipeline import platform_pipeline\n",
            "\n",
            "test_txn = {\n",
            "    \"txn_id\": \"TXN_AUDIT_NOTEBOOK_001\",\n",
            "    \"session_id\": \"SESS_NOTEBOOK_TEST\",\n",
            "    \"event_type\": \"TRANSACTION_EVALUATION\",\n",
            "    \"user_id\": \"usr_abc\",\n",
            "    \"amount\": 750000.0,\n",
            "    \"nameOrig\": \"ACC_ABC_123\",\n",
            "    \"nameDest\": \"ACC_MULE_NEW\",\n",
            "    \"cyber_compromise_in_window\": True,\n",
            "    \"type\": \"TRANSFER\"\n",
            "}\n",
            "\n",
            "async def run_eval():\n",
            "    res = await platform_pipeline.process(test_txn, require_existing_session=False)\n",
            "    print(f\"Pre-transaction Pipeline Evaluation Result:\")\n",
            "    print(f\"   - Decision: {res.decision['decision']}\")\n",
            "    print(f\"   - Score: {res.inference['score']}/100\")\n",
            "    print(f\"   - Reasons: {res.inference['reasons']}\")\n",
            "    print(f\"   - Timings: {res.timings}\")\n",
            "\n",
            "asyncio.run(run_eval())\n"
        ]
    },
    {
        "cell_type": "markdown",
        "metadata": {},
        "source": [
            "## 5. Gemini AI Copilot Integration Test\n",
            "Test the Gemini AI Copilot chat handler with active candidate models.\n"
        ]
    },
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "from api.copilot_engine import chat_with_copilot, ChatRequest, ChatMessage\n",
            "\n",
            "async def run_copilot_test():\n",
            "    req = ChatRequest(messages=[ChatMessage(role=\"user\", content=\"Summarize platform health and active threats\")])\n",
            "    res = await chat_with_copilot(req)\n",
            "    print(\"Gemini Copilot Live Response:\")\n",
            "    print(res[\"response\"])\n",
            "\n",
            "asyncio.run(run_copilot_test())\n"
        ]
    },
    {
        "cell_type": "markdown",
        "metadata": {},
        "source": [
            "## 6. Global Hackathon Readiness Report Display\n",
            "Render the full **GLOBAL_HACKATHON_READINESS_REPORT.md** directly in markdown.\n"
        ]
    },
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "if os.path.exists(\"GLOBAL_HACKATHON_READINESS_REPORT.md\"):\n",
            "    with open(\"GLOBAL_HACKATHON_READINESS_REPORT.md\", \"r\", encoding=\"utf-8\") as f:\n",
            "        display(Markdown(f.read()))\n",
            "else:\n",
            "    print(\"GLOBAL_HACKATHON_READINESS_REPORT.md not found.\")\n"
        ]
    }
]

notebook = {
    "cells": cells,
    "metadata": {
        "language_info": {
            "name": "python"
        }
    },
    "nbformat": 4,
    "nbformat_minor": 2
}

base_path = r"C:\Users\motis\Downloads\fastapi\Unified-Cyber-Fraud-Intelligence-Platform"
nb_path = os.path.join(base_path, "audit_report.ipynb")

with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(notebook, f, indent=2)

print(f"Successfully generated Jupyter Notebook: {nb_path}")

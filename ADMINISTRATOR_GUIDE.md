# Administrator Guide

- Provision JWT, database, banking-user, auth-client, CORS, and signing-key secrets.
- Rotate JWT and refresh-token credentials using the approved secret-manager procedure.
- Confirm `/health/live` is live and `/health/ready` reflects provider state.
- Review structured request logs by request ID, tenant, endpoint, and status.
- Run SQLite backups before schema or artifact upgrades.
- Keep provider fallback enabled only when the institution accepts degraded graph/model operation.

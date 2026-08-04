# RC2 Backup and Restore Validation

The repository now includes `scripts/backup_sqlite.ps1` and `scripts/restore_sqlite.ps1`. The Compose deployment stores the database in a named volume. The scripts perform explicit file copy backup and restore and must be run with the API stopped or with an institution-approved SQLite snapshot procedure.

Rollback sequence:

1. Stop API traffic.
2. Capture the current database and configuration version.
3. Restore the selected verified backup.
4. Run schema/index initialization.
5. Start the API and verify liveness, readiness, authentication, tenant isolation, and idempotency.
6. Record the restore request ID and operator approval.

An actual production-volume restore was not executed in this workstation run; it requires an approved backup artifact and retention policy.

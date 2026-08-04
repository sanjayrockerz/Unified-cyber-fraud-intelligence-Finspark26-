# Report Pipeline Report

## Current path

Reports are requested by the existing frontend Reports page through the existing reports API. The page now handles loading, cached results, empty investigations, request timeout, retry, export failure, and 30-second refresh without discarding the last successful result.

## User-visible states

- `Generating report` while the request is active
- `Report ready` when report data is available
- `No investigations yet` when the backend returns no records
- `Service temporarily unavailable` with retry and automatic reconnect when the request fails

## Safety

The frontend does not fabricate report content when the API is unavailable. Existing backend tenant filtering remains the source of report scope. Export errors are presented as recoverable UI feedback.

## Remaining gap

Background server-side PDF job persistence and physical download testing were not introduced in this P0 pass because they would change the frozen report architecture. Validate the configured storage/PDF provider in the deployment environment before a production release.

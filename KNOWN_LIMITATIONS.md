# Known Limitations

1. Neo4j, Supabase, Gemini, and ML providers are optional in the local/demo configuration; their degraded states must be tested separately with production credentials.
2. SQLite remains appropriate for the frozen architecture and controlled demo, but multi-worker write contention and high-throughput production capacity are not established by this RC1 run.
3. Several legacy SOAR, graph, digital-twin, and synthetic scenario modules contain static fixtures. They are not on the verified canonical dashboard path and are tracked for post-RC1 cleanup.
4. Android device/runtime validation here is compile-level plus previously completed smoke coverage; physical-device reconnect and offline testing still need a device lab run.

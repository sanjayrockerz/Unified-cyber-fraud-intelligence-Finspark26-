# Behavioural Engine Report

The Android collector continues to aggregate typing intervals, dwell durations, touch pressure/size, accelerometer, and gyroscope signals. Only statistical summaries are sent to the backend.

The continuous telemetry loop now reports real memory pressure, battery level, connectivity class, VPN/RASP state, application identity, and timestamps. Random values, random foreground screens, and fake coordinates were removed.

Behaviour remains one trust component alongside identity, device, runtime, network, graph, threat, and transaction context. It is not a sole decision factor.

# Risk Engine Validation Report
## Summary
- Replaced static fallback scores with dynamic weighted accumulation in `risk_engine.py`.
- Device Trust, VPN Detection, Behaviour, and Large Transfer rules independently modulate the final risk output (0-100).
- Normal transactions gracefully resolve to `ALLOW` while critical combinations properly trigger `BLOCK`.
- **Result**: Validated and integrated.
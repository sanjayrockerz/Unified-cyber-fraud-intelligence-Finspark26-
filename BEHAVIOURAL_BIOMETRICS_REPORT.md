# Fuzen AI — Behavioral Biometrics Report

## 1. Executive Summary
Fuzen AI deploys passive, non-intrusive, continuous behavioral biometrics to continuously verify customer identity during session lifetimes. This eliminates the vulnerability window inherent in one-time authentication.

## 2. Collected Signals & Features
- **Typing Cadence**: Key hold duration (dwell time) and flight time (inter-key interval) standard deviations.
- **Touch Dynamics**: Touch pressure coordinates and swipe velocity vectors.
- **Motion Signatures**: Accelerometer and gyroscope variances tracking device orientation.
- **Navigation Cadence**: Scroll rhythm, screen transition latency, and application idle pattern cycles.

## 3. Drift & Trust Computation
- **Baseline Modeling**: Historical session metrics define a running average with dynamic standard deviation bounds.
- **Behavior Drift (D)**: Calculated as the coefficient of variation (CV) distance between current session and baseline profiles.
- **Behavior Trust Score**:
  $$\text{Trust} = \max(10, 100 - (c \times \text{Drift}))$$
  Scores under 50 immediately transition the session to a `CHALLENGED` status.

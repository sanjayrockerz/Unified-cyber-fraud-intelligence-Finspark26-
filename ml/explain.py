"""
Feature attribution and counterfactual reasoning for a single transaction.

Both functions below are computed from the trained artifacts in ml/models — no
value returned here is hardcoded or illustrative. SHAP contributions come from
LightGBM's native TreeSHAP (`pred_contrib=True`), which is exact rather than an
approximation, and needs no extra dependency beyond the model already loaded for
scoring.

The counterfactual answers the one question the whole fusion thesis rests on:
would this transaction still have been blocked without the cyber signal? It is
computed by re-scoring the same transaction with the cyber flag cleared, so the
sentence shown to an analyst is reproducible from this code.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from ml.predict import _get_fusion_model, _prepare_single, tabular_score


def shap_contributions(txn: dict, top_n: int = 8) -> dict:
    """
    Exact per-feature SHAP contributions for one transaction.

    Returns log-odds contributions ordered by absolute impact, plus the model's
    base value (the expected log-odds before any feature is considered). A
    positive impact pushed this transaction toward fraud.
    """
    from ml.features import FEATURE_COLS_FUSION, engineer_features

    model = _get_fusion_model()
    features = engineer_features(_prepare_single(txn))[FEATURE_COLS_FUSION]

    # LightGBM returns n_features + 1 columns; the trailing column is the base value.
    contributions = np.asarray(model.predict(features, pred_contrib=True))[0]
    base_value = float(contributions[-1])

    ranked = sorted(
        (
            {
                "feature": name,
                "impact": round(float(value), 6),
                "value": _readable(features.iloc[0][name]),
            }
            for name, value in zip(FEATURE_COLS_FUSION, contributions[:-1])
        ),
        key=lambda item: abs(item["impact"]),
        reverse=True,
    )

    return {
        "status": "EXECUTED",
        "method": "LIGHTGBM_TREE_SHAP",
        "units": "log-odds",
        "base_value": round(base_value, 6),
        "features": ranked[:top_n],
    }


def counterfactual(txn: dict, block_threshold: float, challenge_threshold: float) -> dict:
    """
    Re-score the transaction with the cyber compromise signal cleared.

    The thresholds are passed in rather than assumed so the sentence always
    agrees with whatever policy the platform is currently running.
    """
    factual_probability = float(tabular_score(txn, use_fusion=True))
    factual_score = factual_probability * 100.0

    if not txn.get("cyber_compromise_in_window"):
        return {
            "status": "NOT_APPLICABLE",
            "reason": "NO_CYBER_SIGNAL_IN_WINDOW",
            "sentence": (
                "No cyber compromise was observed in this window, so there is no "
                "cyber signal to remove — this score comes from transaction features alone."
            ),
            "factual_score": round(factual_score, 2),
        }

    counterfactual_txn = dict(txn)
    counterfactual_txn["cyber_compromise_in_window"] = False
    counterfactual_score = float(tabular_score(counterfactual_txn, use_fusion=True)) * 100.0

    factual_verdict = _verdict(factual_score, block_threshold, challenge_threshold)
    counterfactual_verdict = _verdict(counterfactual_score, block_threshold, challenge_threshold)

    if factual_verdict == counterfactual_verdict:
        sentence = (
            f"With no prior cyber compromise the score moves "
            f"{round(factual_score, 1)} → {round(counterfactual_score, 1)}, "
            f"which is still {counterfactual_verdict} — the transaction features "
            f"alone justify this decision."
        )
    else:
        sentence = (
            f"With no prior cyber compromise the score falls "
            f"{round(factual_score, 1)} → {round(counterfactual_score, 1)}, "
            f"which is {counterfactual_verdict}, not {factual_verdict}. "
            f"The cyber signal is what changed this decision."
        )

    return {
        "status": "EXECUTED",
        "factual_score": round(factual_score, 2),
        "factual_verdict": factual_verdict,
        "counterfactual_score": round(counterfactual_score, 2),
        "counterfactual_verdict": counterfactual_verdict,
        "decision_changed": factual_verdict != counterfactual_verdict,
        "sentence": sentence,
    }


def _verdict(score: float, block_threshold: float, challenge_threshold: float) -> str:
    if score >= block_threshold:
        return "BLOCK"
    if score >= challenge_threshold:
        return "CHALLENGE"
    return "ALLOW"


def _readable(value):
    """Numpy scalars are not JSON-serialisable; unwrap them."""
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return round(float(value), 6)
    if isinstance(value, (np.bool_,)):
        return bool(value)
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    return value

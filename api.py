"""
API bridge for Project Aesclepius simulation logic.

Run with:
    uvicorn api:app --reload --port 8000
"""

from __future__ import annotations

import os
import pickle
from typing import Any

import pandas as pd
import xgboost as xgb
from fastapi import FastAPI
from pydantic import BaseModel, Field

from app import load_data
from src.engine import BudgetAllocator


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
FORECAST_PATH = os.path.join(BASE_DIR, "2026_forecast.csv")


def load_models() -> tuple[xgb.Booster, dict[str, Any]]:
    """Load model artifacts using the same file paths as app.py."""
    xgb_path = os.path.join(MODELS_DIR, "xgb_mortality.json")
    cox_path = os.path.join(MODELS_DIR, "cox_models.pkl")

    booster = xgb.Booster()
    booster.load_model(xgb_path)

    with open(cox_path, "rb") as handle:
        cox_models = pickle.load(handle)

    return booster, cox_models


def synthesize_features(risk_score: float, department_name: str) -> pd.DataFrame:
    """
    Build synthetic patient features aligned with app.py risk heuristics.
    Cox models use Age_Numeric + Emergency_Flag.
    """
    if risk_score > 8:
        age_numeric, emergency_flag = 4, 1
    elif risk_score > 6:
        age_numeric, emergency_flag = 3, 1
    elif risk_score > 4:
        age_numeric, emergency_flag = 2, 0
    elif risk_score >= 3:
        age_numeric, emergency_flag = 1, 0
    else:
        age_numeric, emergency_flag = 1, 0

    if department_name == "Mental Health":
        emergency_flag = 0

    return pd.DataFrame(
        [
            {
                "Age_Numeric": age_numeric,
                "Emergency_Flag": emergency_flag,
            }
        ]
    )


def build_survival_curves(
    cox_models: dict[str, Any],
) -> list[dict[str, Any]]:
    """
    Return chart-ready survival points for each department and risk tier.
    """
    curves: list[dict[str, Any]] = []
    risk_tiers = [
        {"label": "low", "risk_score": 2},
        {"label": "medium", "risk_score": 5},
        {"label": "high", "risk_score": 8},
    ]

    for department, model in cox_models.items():
        for tier in risk_tiers:
            synth = synthesize_features(tier["risk_score"], department)
            sf = model.predict_survival_function(synth)
            points = [
                {"day": float(day), "survival_probability": float(value)}
                for day, value in sf.iloc[:, 0].items()
            ]
            curves.append(
                {
                    "department": department,
                    "risk_tier": tier["label"],
                    "risk_score": tier["risk_score"],
                    "points": points,
                }
            )

    return curves


class SimulationRequest(BaseModel):
    w_efficiency: float = Field(ge=0.0, le=1.0)
    w_humanity: float = Field(ge=0.0, le=1.0)
    budget: float = Field(gt=0.0)


app = FastAPI(title="Project Aesclepius API")

XGB_BOOSTER, COX_MODELS = load_models()


@app.post("/simulate")
def simulate(payload: SimulationRequest) -> dict[str, Any]:
    """
    Run one simulation pass and return KPI + survival curve data.
    """
    df = load_data(FORECAST_PATH)
    allocator = BudgetAllocator()
    result, remaining_budget = allocator.run_allocation(
        df,
        payload.budget,
        w_efficiency=payload.w_efficiency,
        w_humanity=payload.w_humanity,
    )

    total_lives_saved = int(result["People_Covered"].sum())
    total_patients = int(result["Projected_Volume"].sum())
    total_unmet_need = total_patients - total_lives_saved

    survival_curve_data = build_survival_curves(COX_MODELS)

    return {
        "total_lives_saved": total_lives_saved,
        "total_unmet_need": total_unmet_need,
        "remaining_budget": float(remaining_budget),
        "survival_curves": survival_curve_data,
    }

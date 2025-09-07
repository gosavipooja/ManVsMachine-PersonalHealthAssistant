from __future__ import annotations
import os
import math
import json
from typing import Dict, List, Optional, Any

import requests


class NutritionixClient:
    BASE_URL = "https://trackapi.nutritionix.com/v2/natural/nutrients"

    def __init__(self, app_id: Optional[str] = None, app_key: Optional[str] = None, timeout: int = 20):
        self.app_id = app_id or os.getenv("NUTRITIONIX_APP_ID")
        self.app_key = app_key or os.getenv("NUTRITIONIX_APP_KEY")
        if not self.app_id or not self.app_key:
            raise RuntimeError("Nutritionix credentials missing. Set NUTRITIONIX_APP_ID and NUTRITIONIX_APP_KEY.")
        self.timeout = timeout

    @staticmethod
    def _compose_query(name: str, quantity: Optional[float], unit: Optional[str]) -> str:
        # Map "count" to empty unit; otherwise include provided unit
        if unit is None or unit == "" or unit == "count":
            if quantity is not None:
                return f"{int(quantity) if quantity.is_integer() else quantity} {name}"
            return name
        # Some units Nutritionix expects in singular/plural; keep simple here
        qty_str = int(quantity) if (quantity is not None and float(quantity).is_integer()) else quantity
        return f"{qty_str} {unit} {name}".strip()

    def fetch_macros_for_items(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Calls Nutritionix natural language endpoint once with a combined query (batched).
        Returns items with macros and source_ref.
        """
        queries = [self._compose_query(it.get("name",""), it.get("quantity"), it.get("unit")) for it in items]
        query = " and ".join(q for q in queries if q)
        headers = {
            "x-app-id": self.app_id,
            "x-app-key": self.app_key,
            "Content-Type": "application/json"
        }
        body = {"query": query}

        resp = requests.post(self.BASE_URL, headers=headers, json=body, timeout=self.timeout)
        resp.raise_for_status()
        data = resp.json()

        # Nutritionix returns "foods": list with name, serving_qty/serving_unit, nf_* fields
        enriched: List[Dict[str, Any]] = []
        for it in items:
            # Find best match in returned foods by simple name containment heuristic
            match = _best_food_match(it, data.get("foods", []))
            macros = _macros_from_nx(match) if match else None
            enriched.append({
                **it,
                "macros": macros,
                "source_ref": {"provider": "Nutritionix", "id": match.get("tag_id") if match else None}
            })
        return enriched

def _best_food_match(item: Dict[str, Any], foods: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    target = (item.get("name") or "").lower()
    if not foods:
        return None
    # Prefer exact or startswith name, else first
    exact = [f for f in foods if f.get("food_name","").lower() == target]
    if exact:
        return exact[0]
    starts = [f for f in foods if f.get("food_name","").lower().startswith(target.split()[0])]
    if starts:
        return starts[0]
    return foods[0]

def _macros_from_nx(f: Dict[str, Any]) -> Optional[Dict[str, float]]:
    if not f:
        return None
    return {
        "calories": float(f.get("nf_calories") or 0.0),
        "carbs_g": float(f.get("nf_total_carbohydrate") or 0.0),
        "protein_g": float(f.get("nf_protein") or 0.0),
        "fat_g": float(f.get("nf_total_fat") or 0.0),
        "fiber_g": float(f.get("nf_dietary_fiber") or 0.0),
        "sugar_g": float(f.get("nf_sugars") or 0.0),
        "sodium_mg": float(f.get("nf_sodium") or 0.0),
    }

def enrich_food_items(items: List[Dict[str, Any]], nx: NutritionixClient) -> List[Dict[str, Any]]:
    """
    Returns new list with macros + source_ref for each food item.
    """
    if not items:
        return []
    return nx.fetch_macros_for_items(items)



# Baseline MET values (approximate). You can expand as needed.
BASE_MET = {
    "running": 9.8,             # ~6 mph
    "walking": 3.5,             # ~3 mph
    "cycling": 7.5,             # ~14-16 mph
    "swimming": 8.0,
    "rowing": 7.0,
    "yoga": 3.0,
    "hiit": 10.0,
    "hiking": 6.0,
    "elliptical": 5.0,
    "weight training": 6.0
}

# Effort multipliers
EFFORT_MULT = {
    "easy": 0.8,
    "moderate": 1.0,
    "vigorous": 1.2,
    "max": 1.35
}

def _effective_met(activity: str, effort_level: Optional[str]) -> float:
    base = BASE_MET.get(activity.lower(), 4.0)  # fallback general moderate
    mult = EFFORT_MULT.get((effort_level or "moderate").lower(), 1.0)
    return base * mult

def _calories_from_met(met: float, weight_kg: float, duration_min: float) -> float:
    hours = max(0.0, float(duration_min)) / 60.0
    return met * float(weight_kg) * hours

def calculate_exercise_calories(
    items: List[Dict[str, Any]],
    user_profile: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Adds 'met' and 'calories_burned' to each exercise item.
    user_profile expects at least 'weight' in kg.
    """
    weight = float(user_profile.get("weight") or 70.0)  # default 70kg if missing
    enriched: List[Dict[str, Any]] = []
    for it in items or []:
        activity = it.get("activity", "")
        duration = float(it.get("duration_min") or 0.0)
        effort = it.get("effort_level") or "moderate"
        met = _effective_met(activity, effort)
        cals = _calories_from_met(met, weight, duration)
        enriched.append({**it, "met": round(met, 2), "calories_burned": round(cals, 1)})
    return enriched


def enrich_payload(payload: Dict[str, Any], user_profile: Dict[str, Any], nx: Optional[NutritionixClient] = None) -> Dict[str, Any]:
    """
    Given a payload with:
      { "metadata": {...}, "proposed_logs": [ {type: "exercise"| "food", "items":[...] }, ... ] }
    return a new payload with macros (food) and calories_burned+met (exercise).

    If nx is None, food items are returned unchanged (no macros). Useful for offline dev.
    """
    out = json.loads(json.dumps(payload))  # deep copy
    for log in out.get("proposed_logs", []):
        if log.get("type") == "exercise":
            log["items"] = calculate_exercise_calories(log.get("items", []), user_profile)
        elif log.get("type") == "food":
            if nx is not None:
                log["items"] = enrich_food_items(log.get("items", []), nx)
    return out

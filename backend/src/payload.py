import os
import json
from loguru import logger
import argparse
from datetime import datetime, timezone
from typing import Dict, Any

from transcription import transcribe_audio
from classifier import parse_with_llm
from calculator import NutritionixClient, enrich_payload

ISO_FORMATS = [
    "%Y-%m-%dT%H:%M:%S.%fZ",
    "%Y-%m-%dT%H:%M:%SZ"
]

def _parse_ts(ts: str) -> datetime:
    for fmt in ISO_FORMATS:
        try:
            return datetime.strptime(ts, fmt).replace(tzinfo=timezone.utc)
        except Exception:
            continue
    # Last resort: let fromisoformat handle if possible
    try:
        return datetime.fromisoformat(ts.replace("Z","+00:00"))
    except Exception as e:
        raise ValueError(f"Unrecognized timestamp format: {ts}") from e

def pick_latest_log(logs: Dict[str, Any]) -> Dict[str, Any]:
    # logs is a dict of id -> record
    records = list(logs.values())

    def get_timestamp(record):
        # Use the top-level timestamp field
        ts = record.get("timestamp")
        if ts:
            return _parse_ts(ts)
        # If no timestamp found, return epoch
        return datetime.fromtimestamp(0, tz=timezone.utc)
    
    records.sort(key=get_timestamp, reverse=True)
    return records[0]

def load_profile(profiles: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    rec = profiles.get(user_id)
    if not rec:
        raise KeyError(f"Profile for user_id {user_id} not found")
    md = rec.get("metadata", {})
    return {
        "user_id": md.get("userId") or user_id,
        "age": md.get("age"),
        "gender": md.get("gender"),
        "height": md.get("height"),
        "weight": md.get("weight"),
        "activity_level": md.get("activity_level"),
        "name": md.get("name"),
    }

def build_payload(metadata: dict, parsed: dict) -> dict:
    return {
        **metadata,
        "proposed_logs": [
            {"type": "exercise", "items": parsed.get("exercise", {}).get("items", []), "parser_confidence": 0.9},
            {"type": "food", "items": parsed.get("food", {}).get("items", []), "parser_confidence": 0.9},
        ]
    }


def load_output_log(output_file: str) -> Dict[str, Any]:
    """Load existing output_log.json or return empty dict"""
    if os.path.exists(output_file):
        try:
            with open(output_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Could not load existing output_log.json: {e}")
    return {}


def save_output_log(output_file: str, output_data: Dict[str, Any]):
    """Save output_log.json with the new data"""
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--logs", required=True, help="Path to log.json (dict keyed by log id)")
    ap.add_argument("--profiles", required=True, help="Path to profile.json (dict keyed by userId)")
    ap.add_argument("--uploads-dir", default=".", help="Base directory where audio/photo files are stored")
    ap.add_argument("--output_log", required=True, help="Path to output_log.json (dict keyed by log id)")
    args = ap.parse_args()

    with open(args.logs, "r", encoding="utf-8") as f:
        logs = json.load(f)
    with open(args.profiles, "r", encoding="utf-8") as f:
        profiles = json.load(f)

    last_record = pick_latest_log(logs)
    md = last_record.get("metadata", {})

    user_id =  md.get("user_id")
    input_method = md.get("input_method")
    timestamp = md.get("timestamp")
    file_name = md.get("file_name")
    content_preview = md.get("content_preview")

    profile = load_profile(profiles, user_id)

    output_data = load_output_log(args.output_log)

    # Get transcript
    transcript = None
    if input_method == "voice":
        audio_path = os.path.join(args.uploads_dir, "audio", file_name) if file_name else None
        if not audio_path or not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found at {audio_path}.")
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY not set for transcription")
        transcript = transcribe_audio(audio_path, api_key)
    else: 
        transcript = content_preview or ""

    metadata = {
        "user_id": user_id,
        "timestamp": timestamp,
        "input_method": input_method,
        "id": last_record.get("id"),
        "file_name": file_name,
        "transcript": transcript,
    }

    # Parse with LLM
    parsed = parse_with_llm(transcript)
    if isinstance(parsed, str):
        parsed = json.loads(parsed)

    payload = build_payload(metadata, parsed)

    # Enrichment
    nx = None
    app_id = os.getenv("NUTRITIONIX_APP_ID")
    app_key = os.getenv("NUTRITIONIX_APP_KEY")
    if app_id and app_key:
        try:
            nx = NutritionixClient(app_id=app_id, app_key=app_key)
        except Exception as e:
            logger.warning(f"Warning: Nutritionix not initialized: {e}")

    enriched = enrich_payload(payload, profile, nx)

    record_id = last_record.get("id")
    output_data[record_id] = enriched

    save_output_log(args.output_log, output_data)

    logger.info("Completed extraction ")

if __name__ == "__main__":
    main()

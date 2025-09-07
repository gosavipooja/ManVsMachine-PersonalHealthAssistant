# llm_parser.py
import os, json
from typing import Dict, Any
from openai import OpenAI

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- Helpers --------------------------------------------------------------

def _safe_json(text: str) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except Exception:
        # harden: strip code fences, trailing commas
        cleaned = text.strip().strip("`")
        cleaned = cleaned.replace("\n", " ").replace("\r", " ")
        # naive trailing comma cleanup
        cleaned = cleaned.replace(", }", " }").replace(", ]", " ]")
        return json.loads(cleaned)

def _chat_json(messages, schema_hint: str) -> Dict[str, Any]:
    """
    Ask the model for strict JSON. We repeat the schema in the user message to
    minimize drift; then parse/clean the response.
    """
    completion = client.chat.completions.create(
        model=OPENAI_MODEL,
        temperature=0,
        response_format={"type": "json_object"},
        messages=messages + [
            {
                "role": "system",
                "content": (
                    "Return ONLY a single valid JSON object with no commentary. "
                    "Do not include code fences. Use the exact keys requested."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Output must match this JSON outline (keys & types). "
                    f"Do not include extra keys. {schema_hint}"
                ),
            },
        ],
    )
    content = completion.choices[0].message.content
    return _safe_json(content)

# --- 1) Lightweight classifier: Food vs Exercise -------------------------

def classify_intents_llm(transcript: str) -> Dict[str, Any]:
    """
    Splits a transcript into segments by intent: { food: [..], exercise: [..] }
    This is a *classification+segmenting* step only (no entity details yet).
    """
    schema = """
    {
      "food": [{"text": "string"}],
      "exercise": [{"text": "string"}]
    }
    """
    messages = [
        {
            "role": "system",
            "content": (
                "You are a precise classifier for fitness logs. "
                "Identify portions of the transcript that describe either FOOD intake or EXERCISE activity. "
                "Split multi-intent utterances into minimal segments."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Transcript: {transcript}\n"
                "Return JSON with keys 'food' and 'exercise', each an array of objects with a 'text' field. "
                "Include a segment in only one category; do not duplicate."
            ),
        },
    ]
    return _chat_json(messages, schema)

# --- 2) Entity extraction for each category ------------------------------

def extract_entities_llm(segment_text: str, intent: str) -> Dict[str, Any]:
    """
    Extracts structured items.
    - For 'food': name, quantity (number), unit.
    - For 'exercise': activity, duration_min (number), effort_level (easy|moderate|vigorous|max).
    """
    if intent == "food":
        schema = """
        { "items": [ { "name": "string", "quantity": "number", "unit": "string" } ] }
        """
        task = (
            "Extract food items with their quantities. If no quantity is stated, "
            "use 1.0. Unit defaults to 'count' unless stated (g, ml, slice, cup, tbsp, tsp, oz, lb, serving)."
        )
    elif intent == "exercise":
        schema = """
        { "items": [ { "activity": "string", "duration_min": "number", "effort_level": "easy|moderate|vigorous|max" } ] }
        """
        task = (
            "Extract exercise activities with duration in minutes and perceived effort level. "
            "If effort is unclear, choose 'moderate'."
        )
    else:
        raise ValueError("intent must be 'food' or 'exercise'")

    messages = [
        {
            "role": "system",
            "content": f"You are an extractor producing strict JSON for {intent} logs.",
        },
        {
            "role": "user",
            "content": (
                f"Text: {segment_text}\n"
                f"Task: {task}\n"
                "Return only the JSON object."
            ),
        },
    ]
    return _chat_json(messages, schema)

# --- 3) Single-pass parse (recommended) ----------------------------------

def parse_with_llm(transcript: str) -> Dict[str, Any]:
    """
    Single call that returns both categories and their entities in one shot.
    Output aligned to your earlier structure (no macros/calories yet):
    {
      "food": { "items": [ { name, quantity, unit } ] },
      "exercise": { "items": [ { activity, duration_min, effort_level } ] }
    }
    """
    schema = """
    {
      "food": { "items": [ { "name": "string", "quantity": "number", "unit": "string" } ] },
      "exercise": { "items": [ { "activity": "string", "duration_min": "number", "effort_level": "easy|moderate|vigorous|max" } ] }
    }
    """
    messages = [
        {
            "role": "system",
            "content": (
                "You are a precise parser for fitness logs. "
                "From the transcript, identify FOOD items and EXERCISE activities and extract entities. "
                "Quantities default to 1.0 and unit 'count' if unspecified. "
                "Effort defaults to 'moderate' if unspecified. "
                "Use numbers for quantity and duration; do not invent items."
            ),
        },
        {
            "role": "user",
            "content": f"Transcript: {transcript}",
        },
    ]
    return _chat_json(messages, schema)

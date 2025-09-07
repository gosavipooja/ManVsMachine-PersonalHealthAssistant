import os
from transcription import transcribe_audio
from classifier import parse_with_llm

def build_payload(metadata: dict, parsed: dict) -> dict:
    return {
        "metadata": metadata,
        "proposed_logs": [
            {"type": "exercise", "items": parsed["exercise"]["items"], "parser_confidence": 0.9},
            {"type": "food", "items": parsed["food"]["items"], "parser_confidence": 0.9},
        ]
    }


api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    print("ERROR: OPENAI_API_KEY environment variable is not set!")
    print("Please set it with: export OPENAI_API_KEY='your-api-key-here'")
    exit(1)

transcript = transcribe_audio("backend/uploads/audio/711ce200-9151-430e-a2d2-b74998e7e9f1.wav", api_key)
classifier_result = parse_with_llm(transcript)

print(classifier_result)

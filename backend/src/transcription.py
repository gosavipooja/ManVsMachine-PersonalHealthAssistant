import os
import sys
from openai import OpenAI
from loguru import logger
import click

def transcribe_audio(audio_path, api_key):
    """Transcribe audio file using OpenAI Whisper API"""
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio not found: {audio_path}")
    
    # Initialize OpenAI client with provided API key
    client = OpenAI(api_key=api_key)
    
    with open(audio_path, "rb") as audio_file:
        result = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="verbose_json"
        )
        logger.info(f"Transcription completed for: {audio_path}")
        return result.text

@click.command()
@click.argument('input_file')
@click.option('--api-key', help='OpenAI API key (or set OPENAI_API_KEY env var)')
@click.option('--verbose', '-v', is_flag=True, help='Enable verbose logging')
def main(input_file, api_key, verbose):
    """Transcribe audio using OpenAI Whisper API"""
    
    # Set up logging
    if verbose:
        logger.add(sys.stderr, level="DEBUG")
    else:
        logger.add(sys.stderr, level="INFO")
    
    try:
        # Get API key from argument or environment
        api_key = api_key or os.getenv('OPENAI_API_KEY')
        if not api_key:
            print("ERROR: OpenAI API key not provided!")
            print("Use --api-key argument or set OPENAI_API_KEY environment variable")
            print("Get your API key from: https://platform.openai.com/api-keys")
            sys.exit(1)
        
        # Check if audio file exists
        if not os.path.exists(input_file):
            print(f"ERROR: Audio file not found: {input_file}")
            sys.exit(1)
        
        print(f"Transcribing: {input_file}")
        transcript = transcribe_audio(input_file, api_key)
        print(f"\nTranscript:\n{transcript}")
        
    except Exception as e:
        logger.error(f"Error during transcription: {e}")
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

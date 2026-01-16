"""
Local Whisper Speech-to-Text Service
Runs on localhost with CUDA acceleration for fast, offline transcription.
Includes Ollama LLM integration for speech cleanup.
"""

import os
import sys
import json
import tempfile
import wave
import io
import requests
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import threading

# Check for faster-whisper
try:
    from faster_whisper import WhisperModel
except ImportError:
    print("ERROR: faster-whisper not installed. Run: pip install faster-whisper")
    sys.exit(1)

# Configuration
HOST = "127.0.0.1"
PORT = 5678
MODEL_SIZE = "tiny"  # Options: tiny (fastest), base, small, medium, large-v2, large-v3
DEVICE = "cuda"  # Use "cpu" if no GPU
COMPUTE_TYPE = "float16"  # Use "int8" for older GPUs, "float32" for CPU

# Ollama Cloud Configuration
OLLAMA_MODEL = "gpt-oss:120b"  # Cloud model from ollama.com
OLLAMA_API_KEY = os.environ.get("OLLAMA_API_KEY", "")  # Set via environment variable
ENABLE_LLM_CLEANUP = True  # Set to False to disable LLM cleanup

# Global model instance
model = None
model_lock = threading.Lock()


def load_model():
    """Load Whisper model with CUDA support."""
    global model
    print(f"Loading Whisper model '{MODEL_SIZE}' on {DEVICE}...")
    try:
        model = WhisperModel(
            MODEL_SIZE,
            device=DEVICE,
            compute_type=COMPUTE_TYPE,
            download_root=os.path.join(os.path.dirname(__file__), "whisper_models")
        )
        print(f"[OK] Model loaded successfully on {DEVICE.upper()}")
    except Exception as e:
        print(f"[WARN] CUDA failed, falling back to CPU: {e}")
        model = WhisperModel(
            MODEL_SIZE,
            device="cpu",
            compute_type="float32",
            download_root=os.path.join(os.path.dirname(__file__), "whisper_models")
        )
        print("[OK] Model loaded on CPU")


def cleanup_with_ollama(raw_text: str, api_key: str = "") -> str:
    """
    Use Ollama LLM to clean up transcribed speech.
    Removes self-corrections, filler words, and false starts while keeping natural tone.
    """
    if not ENABLE_LLM_CLEANUP or not raw_text.strip():
        return raw_text
    
    prompt = f"""You are a speech-to-text cleanup assistant. Your job is to clean up raw transcribed speech while preserving the speaker's natural voice and tone.

Rules:
1. Remove self-corrections (e.g., "wait no", "I mean", "actually")  
2. Keep only the FINAL corrected version of what they meant to say
3. Remove filler words like "um", "uh", "like" (when used as filler)
4. Fix obvious grammar issues but keep the casual/natural tone
5. Do NOT make it sound robotic or formal
6. Do NOT add information that wasn't there
7. Do NOT change the meaning or emotion
8. Keep it concise but natural

Raw transcription:
"{raw_text}"

Cleaned text (output ONLY the cleaned text, nothing else):"""

    try:
        # Import ollama library
        from ollama import Client
        
        # Use provided API key, or fall back to environment variable
        effective_key = api_key or OLLAMA_API_KEY
        
        # Create client with cloud host and auth
        client = Client(
            host="https://ollama.com",
            headers={'Authorization': f'Bearer {effective_key}'} if effective_key else {}
        )
        
        messages = [
            {'role': 'user', 'content': prompt}
        ]
        
        # Use chat (non-streaming for simplicity)
        response = client.chat(
            model=OLLAMA_MODEL,
            messages=messages,
            stream=False
        )
        
        cleaned = response.get('message', {}).get('content', '').strip()
        
        # Remove any quotes the LLM might have added
        if cleaned.startswith('"') and cleaned.endswith('"'):
            cleaned = cleaned[1:-1]
        
        print(f"[OK] LLM cleanup successful")
        return cleaned if cleaned else raw_text
            
    except ImportError:
        print("[WARN] Ollama library not installed. Run: pip install ollama")
        return raw_text
    except Exception as e:
        print(f"[WARN] Ollama cleanup failed: {e}")
        return raw_text


def transcribe_audio(audio_data: bytes, language: str = "en", api_key: str = "", enable_cleanup: bool = True) -> dict:
    """Transcribe audio bytes to text."""
    global model
    
    if model is None:
        return {"error": "Model not loaded"}
    
    # Save audio to temp file (faster-whisper needs file path)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(audio_data)
        temp_path = f.name
    
    try:
        with model_lock:
            segments, info = model.transcribe(
                temp_path,
                language=language if language else None,
                beam_size=1,  # Greedy decoding for speed (was 5)
                vad_filter=True,  # Filter out silence
                vad_parameters=dict(min_silence_duration_ms=300)  # Faster silence detection
            )
            
            # Collect all segments
            full_text = ""
            segment_list = []
            for segment in segments:
                full_text += segment.text
                segment_list.append({
                    "start": segment.start,
                    "end": segment.end,
                    "text": segment.text.strip()
                })
        
        raw_text = full_text.strip()
        
        # Clean up with Ollama LLM (removes self-corrections, filler words)
        if enable_cleanup and ENABLE_LLM_CLEANUP:
            cleaned_text = cleanup_with_ollama(raw_text, api_key)
        else:
            cleaned_text = raw_text
        
        return {
            "success": True,
            "text": cleaned_text,  # Cleaned version for display
            "raw_text": raw_text,  # Original transcription
            "segments": segment_list,
            "language": info.language,
            "language_probability": info.language_probability,
            "llm_cleaned": cleaned_text != raw_text  # Flag if LLM was used
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        # Clean up temp file
        try:
            os.unlink(temp_path)
        except:
            pass


class WhisperHandler(BaseHTTPRequestHandler):
    """HTTP handler for Whisper transcription requests."""
    
    def log_message(self, format, *args):
        """Suppress default logging."""
        pass
    
    def send_json(self, data: dict, status: int = 200):
        """Send JSON response."""
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Ollama-Api-Key, X-Enable-Cleanup")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_json({})
    
    def do_GET(self):
        """Health check endpoint."""
        if self.path == "/health":
            self.send_json({
                "status": "ok",
                "model": MODEL_SIZE,
                "device": DEVICE,
                "ready": model is not None
            })
        else:
            self.send_json({"error": "Not found"}, 404)
    
    def do_POST(self):
        """Handle transcription request."""
        if self.path == "/transcribe":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                audio_data = self.rfile.read(content_length)
                
                # Get language from query params
                query = parse_qs(urlparse(self.path).query)
                language = query.get("language", ["en"])[0]
                
                # Get API key and cleanup flag from headers
                api_key = self.headers.get("X-Ollama-Api-Key", "")
                enable_cleanup = self.headers.get("X-Enable-Cleanup", "1") == "1"
                
                # Transcribe
                result = transcribe_audio(audio_data, language, api_key, enable_cleanup)
                
                if "error" in result:
                    self.send_json(result, 500)
                else:
                    self.send_json(result)
                    
            except Exception as e:
                self.send_json({"error": str(e)}, 500)
        else:
            self.send_json({"error": "Not found"}, 404)


def main():
    """Start the Whisper service."""
    print("=" * 50)
    print("  Zenith Local Whisper Service (CUDA)")
    print("=" * 50)
    
    # Load model
    load_model()
    
    # Start HTTP server
    server = HTTPServer((HOST, PORT), WhisperHandler)
    print(f"\n[READY] Whisper service running at http://{HOST}:{PORT}")
    print("   POST /transcribe - Send audio for transcription")
    print("   GET /health - Check service status")
    print("\nPress Ctrl+C to stop.\n")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()


if __name__ == "__main__":
    main()

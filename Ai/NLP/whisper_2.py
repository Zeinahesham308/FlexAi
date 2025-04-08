import whisper
import pyaudio
import wave
import numpy as np
import tempfile
import os
from faster_whisper import WhisperModel
os.environ["KMP_DUPLICATE_LIB_OK"]="TRUE"

model_size = "small"
model = WhisperModel(model_size, device="cuda")
# Load the Whisper model (use "base", "small", "medium", or "large")

#  settings
SEC=4  # Recording time in seconds
CHUNK = 256  # Buffer size
FORMAT = pyaudio.paInt16  # Audio format
CHANNELS = 1  # Mono audio
RATE = 16000  # Sample rate (Whisper works best with 16kHz)

# Initialize PyAudio
audio = pyaudio.PyAudio()

# Start audio stream
stream = audio.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK)

print("Listening and transcribing in real-time... (Press Ctrl+C to stop)")

try:
    while True:
        frames = []
        
        for _ in range(0, int(RATE / CHUNK * SEC)):  
            data = stream.read(CHUNK)
            frames.append(data)

        # Save recorded audio to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
            wf = wave.open(tmp_file.name, "wb")
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(audio.get_sample_size(FORMAT))
            wf.setframerate(RATE)
            wf.writeframes(b''.join(frames))
            wf.close()
            audio_path = tmp_file.name

        # Transcribe with Faster Whisper
        segments, _ = model.transcribe(audio_path) #language="en"

        # Extract transcribed text from segments
        transcribed_text = " ".join(segment.text for segment in segments)

        print("You said:", transcribed_text)
        # Remove temporary file
        os.remove(audio_path)

except KeyboardInterrupt:
    print("Stopping transcription...")

finally:
    stream.stop_stream()
    stream.close()
    audio.terminate()

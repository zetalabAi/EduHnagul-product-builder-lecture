#!/bin/bash

# Create Cloud Storage bucket for TTS audio caching
# Bucket name: edu-hangul-tts-audio

echo "Setting up Cloud Storage bucket..."

# Create bucket (if not exists)
gsutil mb -p edu-hangul-mvp-af962 -c STANDARD -l us-central1 gs://edu-hangul-tts-audio/ 2>/dev/null || echo "Bucket already exists"

# Set lifecycle rules (auto-delete after 7 days)
cat > lifecycle.json << 'LIFECYCLE'
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 7}
      }
    ]
  }
}
LIFECYCLE

gsutil lifecycle set lifecycle.json gs://edu-hangul-tts-audio/
rm lifecycle.json

# Set CORS configuration (allow web access)
cat > cors.json << 'CORS'
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
CORS

gsutil cors set cors.json gs://edu-hangul-tts-audio/
rm cors.json

echo "✅ Storage bucket setup complete!"
echo "Bucket: gs://edu-hangul-tts-audio/"
echo "Lifecycle: Files auto-delete after 7 days"
echo "CORS: Enabled for web access"

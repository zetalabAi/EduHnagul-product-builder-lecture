import * as admin from "firebase-admin";
import * as crypto from "crypto";
import * as functions from "firebase-functions";
import axios from "axios";

// Lazy initialization
function getBucket() {
  return admin.storage().bucket("edu-hangul-tts-audio");
}

interface TTSOptions {
  text: string;
  voiceName?: string;
  temperature?: number;
  styleInstructions?: string;
}

/**
 * Preprocess text for better TTS quality
 * Remove special characters that might be read literally
 */
function preprocessText(text: string): string {
  return text
    // Remove excessive punctuation
    .replace(/!{2,}/g, "!")
    .replace(/\?{2,}/g, "?")
    .replace(/~{2,}/g, "~")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generate high-quality TTS using Gemini 2.5 Pro with Multimodal Live API
 * Uses natural, expressive Korean voice (Kore or Aoede)
 */
export async function generateGeminiTTS(options: TTSOptions): Promise<string> {
  const startTime = Date.now();

  const {
    text,
    voiceName = "Kore", // Gemini's natural Korean voice
    temperature = 1.5,
    styleInstructions = "친근하고 따뜻한 목소리로 자연스럽게 말해주세요.",
  } = options;

  // Preprocess text
  const cleanText = preprocessText(text);

  functions.logger.info("🎤 === Gemini TTS Generation Start ===");
  functions.logger.info(`📝 Text: ${cleanText.substring(0, 100)}...`);
  functions.logger.info(`🎵 Voice: ${voiceName}`);
  functions.logger.info(`🌡️ Temperature: ${temperature}`);
  functions.logger.info(`🎭 Style: ${styleInstructions}`);

  // Cache key
  const hash = crypto
    .createHash("sha256")
    .update(`${cleanText}-${voiceName}-${temperature}`)
    .digest("hex")
    .substring(0, 16);

  const fileName = `tts/gemini-${hash}.wav`;
  const bucket = getBucket();
  const file = bucket.file(fileName);

  // Check cache
  try {
    const [exists] = await file.exists();
    if (exists) {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      functions.logger.info(`✅ Cache hit: ${publicUrl}`);
      functions.logger.info(`⏱️ Cache lookup: ${Date.now() - startTime}ms`);
      return publicUrl;
    }
  } catch (error) {
    functions.logger.warn("⚠️ Cache check failed:", error);
  }

  functions.logger.info("🚀 Generating new Gemini TTS audio...");

  try {
    // Get API key from environment
    const apiKey = functions.config().google?.ai_api_key || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_AI_API_KEY not configured");
    }

    // Call Gemini Multimodal Live API for TTS
    // Documentation: https://ai.google.dev/api/multimodal-live
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: `You are a natural Korean voice assistant. Speak the following text with warmth and clarity.

Style instructions: ${styleInstructions}

Text to speak: ${cleanText}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: temperature,
          responseModalities: ["AUDIO"], // Request audio output
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName, // "Kore", "Aoede", "Charon", "Fenrir", "Puck"
              },
            },
          },
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 second timeout
      }
    );

    // Extract audio data from response
    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
      functions.logger.error("❌ No audio in Gemini response:", JSON.stringify(response.data));
      throw new Error("No audio content in Gemini response");
    }

    const audioBase64 = response.data.candidates[0].content.parts[0].inlineData.data;
    const audioBuffer = Buffer.from(audioBase64, "base64");

    functions.logger.info(`💾 Saving to Storage (${audioBuffer.length} bytes)...`);

    // Save to Cloud Storage
    await file.save(audioBuffer, {
      metadata: {
        contentType: "audio/wav",
        cacheControl: "public, max-age=604800", // 7 days
      },
    });

    // Make publicly readable
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    functions.logger.info("✅ === Gemini TTS Generation Complete ===");
    functions.logger.info(`🔗 URL: ${publicUrl}`);
    functions.logger.info(`⏱️ Total time: ${Date.now() - startTime}ms`);

    return publicUrl;
  } catch (error: any) {
    functions.logger.error("❌ === Gemini TTS Generation Failed ===");
    functions.logger.error("Error:", error.message);
    if (error.response) {
      functions.logger.error("Response data:", JSON.stringify(error.response.data));
    }
    throw new Error(`Gemini TTS generation failed: ${error.message}`);
  }
}

/**
 * Build style instructions from user settings
 */
export function buildStyleInstructions(settings: {
  persona: string;
  responseStyle: string;
  formalityLevel: string;
}): string {
  const instructions: string[] = [];

  // Persona
  const personaMap: Record<string, string> = {
    "same-sex-friend": "친구처럼 편안하고 즐거운 목소리로",
    "opposite-sex-friend": "친절하고 다정한 목소리로",
    boyfriend: "다정하고 애정 어린 남자친구 목소리로",
    girlfriend: "상큼하고 애교 있는 여자친구 목소리로",
    lover: "연인처럼 다정하고 애정 어린 목소리로",
    friend: "친구처럼 편안하고 즐거운 목소리로",
  };
  instructions.push(personaMap[settings.persona] || "친근한 목소리로");

  // Response Style
  const styleMap: Record<string, string> = {
    empathetic: "공감적이고 따뜻하게",
    enthusiastic: "활기차고 열정적으로",
    calm: "차분하고 안정적으로",
    balanced: "자연스럽고 균형있게",
    blunt: "명확하고 직설적으로",
  };
  instructions.push(styleMap[settings.responseStyle] || "자연스럽게");

  // Formality Level
  const formalityMap: Record<string, string> = {
    formal: "격식 있고 정중하게",
    polite: "존댓말을 사용하며",
    casual: "친근하고 편하게",
    intimate: "진짜 친구처럼 편안하게",
  };
  instructions.push(formalityMap[settings.formalityLevel] || "친근하게");

  return instructions.join(", ") + " 말해주세요.";
}

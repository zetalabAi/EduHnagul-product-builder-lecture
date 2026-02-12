import * as admin from "firebase-admin";
import * as crypto from "crypto";
import * as functions from "firebase-functions";
import {TextToSpeechClient} from "@google-cloud/text-to-speech";

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
 * Generate high-quality TTS using Google Cloud Text-to-Speech
 * Uses Journey voices (ko-KR-Neural2-A/C) for natural Korean speech
 */
export async function generateGeminiTTS(options: TTSOptions): Promise<string> {
  const startTime = Date.now();

  const {
    text,
    voiceName = "ko-KR-Neural2-C", // Female voice (Neural2-C) or Male (Neural2-A)
    styleInstructions = "친근하고 따뜻한 목소리로 자연스럽게 말해주세요.",
  } = options;

  // Preprocess text
  const cleanText = preprocessText(text);

  functions.logger.info("🎤 === Google Cloud TTS Generation Start ===");
  functions.logger.info(`📝 Text: ${cleanText.substring(0, 100)}...`);
  functions.logger.info(`🎵 Voice: ${voiceName}`);
  functions.logger.info(`🎭 Style: ${styleInstructions}`);

  // Cache key
  const hash = crypto
    .createHash("sha256")
    .update(`${cleanText}-${voiceName}`)
    .digest("hex")
    .substring(0, 16);

  const fileName = `tts/gcloud-${hash}.mp3`;
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

  functions.logger.info("🚀 Generating new Google Cloud TTS audio...");

  try {
    // Initialize Google Cloud TTS client
    const ttsClient = new TextToSpeechClient();

    // Construct the request
    const request = {
      input: {text: cleanText},
      voice: {
        languageCode: "ko-KR",
        name: voiceName, // ko-KR-Neural2-C (female) or ko-KR-Neural2-A (male)
      },
      audioConfig: {
        audioEncoding: "MP3" as const,
        speakingRate: 1.0,
        pitch: 0.0,
      },
    };

    // Perform the text-to-speech request
    const [response] = await ttsClient.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error("No audio content in Google Cloud TTS response");
    }

    const audioBuffer = Buffer.from(response.audioContent as Uint8Array);

    functions.logger.info(`💾 Saving to Storage (${audioBuffer.length} bytes)...`);

    // Save to Cloud Storage
    await file.save(audioBuffer, {
      metadata: {
        contentType: "audio/mpeg",
        cacheControl: "public, max-age=604800", // 7 days
      },
    });

    // Make publicly readable
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    functions.logger.info("✅ === Google Cloud TTS Generation Complete ===");
    functions.logger.info(`🔗 URL: ${publicUrl}`);
    functions.logger.info(`⏱️ Total time: ${Date.now() - startTime}ms`);

    return publicUrl;
  } catch (error: any) {
    functions.logger.error("❌ === Google Cloud TTS Generation Failed ===");
    functions.logger.error("Error:", error.message);
    if (error.code) {
      functions.logger.error("Error code:", error.code);
    }
    throw new Error(`Google Cloud TTS generation failed: ${error.message}`);
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

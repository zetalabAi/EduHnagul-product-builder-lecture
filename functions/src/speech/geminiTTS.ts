import {TextToSpeechClient} from "@google-cloud/text-to-speech";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import * as functions from "firebase-functions";

// Lazy initialization
function getBucket() {
  return admin.storage().bucket("edu-hangul-tts-audio");
}

const ttsClient = new TextToSpeechClient();

interface TTSOptions {
  text: string;
  voiceName?: string;
  temperature?: number;
  styleInstructions?: string;
}

/**
 * Preprocess text for better TTS quality
 * Remove or replace special characters that TTS reads literally
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
 * Generate high-quality TTS using Google Cloud Wavenet voices
 * Best quality available for Korean
 */
export async function generateGeminiTTS(options: TTSOptions): Promise<string> {
  const startTime = Date.now();

  const {
    text,
    voiceName = "ko-KR-Wavenet-A", // High-quality female voice
  } = options;

  // Preprocess text for better quality
  const cleanText = preprocessText(text);

  functions.logger.info("🎤 === TTS Generation Start ===");
  functions.logger.info(`📝 Text: ${cleanText.substring(0, 100)}...`);
  functions.logger.info(`🎵 Voice: ${voiceName}`);

  // 캐싱용 해시
  const hash = crypto
    .createHash("sha256")
    .update(`${cleanText}-${voiceName}`)
    .digest("hex")
    .substring(0, 16);

  const fileName = `tts/wavenet-${hash}.mp3`;
  const bucket = getBucket();
  const file = bucket.file(fileName);

  // 캐시 확인
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

  functions.logger.info("🚀 Generating new TTS audio...");

  try {
    // Use SSML for better control
    const ssmlText = `<speak><prosody rate="1.0" pitch="0st">${cleanText}</prosody></speak>`;

    const [response] = await ttsClient.synthesizeSpeech({
      input: {ssml: ssmlText},
      voice: {
        languageCode: "ko-KR",
        name: voiceName, // Wavenet-A: Most natural female voice
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 1.0,
        pitch: 0.0,
        // Use telephony profile for clearer speech
        effectsProfileId: ["telephony-class-application"],
      },
    });

    if (!response.audioContent) {
      throw new Error("No audio content in TTS response");
    }

    const audioBuffer = Buffer.from(response.audioContent);
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
    functions.logger.info("✅ === TTS Generation Complete ===");
    functions.logger.info(`🔗 URL: ${publicUrl}`);
    functions.logger.info(`⏱️ Total time: ${Date.now() - startTime}ms`);

    return publicUrl;
  } catch (error: any) {
    functions.logger.error("❌ === TTS Generation Failed ===");
    functions.logger.error("Error:", error);
    throw new Error(`TTS generation failed: ${error.message}`);
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

  // 대화 상대 (Persona)
  const personaMap: Record<string, string> = {
    "same-sex-friend": "친구처럼 편안하고 즐거운 목소리로",
    "opposite-sex-friend": "친절하고 다정한 목소리로",
    boyfriend: "다정하고 애정 어린 남자친구 목소리로",
    girlfriend: "상큼하고 애교 있는 여자친구 목소리로",
    lover: "연인처럼 다정하고 애정 어린 목소리로",
    friend: "친구처럼 편안하고 즐거운 목소리로",
  };
  instructions.push(personaMap[settings.persona] || "친근한 목소리로");

  // 응답 스타일 (Response Style)
  const styleMap: Record<string, string> = {
    empathetic: "공감적이고 따뜻하게",
    enthusiastic: "활기차고 열정적으로",
    calm: "차분하고 안정적으로",
    balanced: "자연스럽고 균형있게",
    blunt: "명확하고 직설적으로",
  };
  instructions.push(styleMap[settings.responseStyle] || "자연스럽게");

  // 격식 수준 (Formality Level)
  const formalityMap: Record<string, string> = {
    formal: "격식 있고 정중하게",
    polite: "존댓말을 사용하며",
    casual: "친근하고 편하게",
    intimate: "진짜 친구처럼 편안하게",
  };
  instructions.push(formalityMap[settings.formalityLevel] || "친근하게");

  return instructions.join(", ") + " 말해주세요.";
}

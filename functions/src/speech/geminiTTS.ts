import * as admin from "firebase-admin";
import * as crypto from "crypto";
import * as functions from "firebase-functions";
import {GoogleGenerativeAI} from "@google/generative-ai";
import {getGeminiApiKey} from "../ai/gemini";

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
 * Generate high-quality TTS using Gemini 2.5 Flash Preview TTS
 * Uses natural Korean voice with emotional expression
 */
export async function generateGeminiTTS(options: TTSOptions): Promise<string> {
  const startTime = Date.now();

  const {
    text,
    voiceName = "Kore", // Korean female voice
    temperature = 1.5,
    styleInstructions = "친근하고 따뜻한 목소리로 자연스럽게 말해주세요.",
  } = options;

  // Preprocess text
  const cleanText = preprocessText(text);

  functions.logger.info("🎙️ === Gemini TTS Generation Start ===");
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

  const fileNameWav = `tts/gemini-${hash}.wav`;
  const fileNameMp3 = `tts/gemini-${hash}.mp3`;
  const bucket = getBucket();

  // Check cache (wav first, then mp3)
  try {
    const wavFile = bucket.file(fileNameWav);
    const [wavExists] = await wavFile.exists();
    if (wavExists) {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileNameWav}`;
      functions.logger.info(`✅ Cache hit: ${publicUrl}`);
      functions.logger.info(`⏱️ Cache lookup: ${Date.now() - startTime}ms`);
      return publicUrl;
    }

    const mp3File = bucket.file(fileNameMp3);
    const [mp3Exists] = await mp3File.exists();
    if (mp3Exists) {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileNameMp3}`;
      functions.logger.info(`✅ Cache hit: ${publicUrl}`);
      functions.logger.info(`⏱️ Cache lookup: ${Date.now() - startTime}ms`);
      return publicUrl;
    }
  } catch (error) {
    functions.logger.warn("⚠️ Cache check failed:", error);
  }

  functions.logger.info("🚀 Generating new Gemini TTS audio...");

  try {
    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(getGeminiApiKey());

    // Try multiple model names to find the one that works
    const modelNames = [
      "gemini-2.5-flash-preview-tts", // Primary: TTS-specific model
      "models/gemini-2.5-flash-preview-tts",
      "gemini-2.0-flash-exp",
      "models/gemini-2.0-flash-exp",
    ];

    let model: any = null;
    let usedModelName = "";

    for (const modelName of modelNames) {
      try {
        functions.logger.info(`🔄 Trying model: ${modelName}`);
        model = genAI.getGenerativeModel({model: modelName});
        usedModelName = modelName;
        functions.logger.info(`✅ Model loaded successfully: ${modelName}`);
        break;
      } catch (error: any) {
        functions.logger.warn(`❌ Model load failed: ${modelName}`, error.message);
      }
    }

    if (!model) {
      throw new Error("❌ All Gemini TTS model names failed to load");
    }

    // Generate TTS with proper configuration
    // TTS models require responseModalities: ["AUDIO"] and speechConfig
    const request: any = {
      contents: [
        {
          role: "user",
          parts: [
            {text: styleInstructions},
            {text: cleanText},
          ],
        },
      ],
      generationConfig: {
        temperature: temperature,
        responseModalities: ["AUDIO"],
        speechConfig: {
          languageCode: "ko-KR",
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName, // "Kore" for Korean female
            },
          },
        },
      },
    };

    const result = await model.generateContent(request);

    functions.logger.info("📦 Gemini response received");

    // Debug: Log response structure
    functions.logger.info("Response type:", typeof result);
    functions.logger.info("Response keys:", Object.keys(result || {}));

    // Try ALL possible audioData locations
    let audioData: any = null;
    let audioDataPath = "";

    // Method 1: response.audioData (most likely)
    if (result.response?.audioData) {
      audioData = result.response.audioData;
      audioDataPath = "response.audioData";
      functions.logger.info("✅ Path 1 success: response.audioData");
    }

    // Method 2: response.candidates[0].content.parts[0].audioData
    else if (result.response?.candidates?.[0]?.content?.parts?.[0]?.audioData) {
      audioData = result.response.candidates[0].content.parts[0].audioData;
      audioDataPath = "candidates[0].content.parts[0].audioData";
      functions.logger.info("✅ Path 2 success: candidates[0].content.parts[0].audioData");
    }

    // Method 3: response.candidates[0].content.parts[0].inlineData.data
    else if (result.response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
      audioData = result.response.candidates[0].content.parts[0].inlineData.data;
      audioDataPath = "candidates[0].content.parts[0].inlineData.data";
      functions.logger.info("✅ Path 3 success: inlineData.data");
    }

    // Method 4: result.audioData (direct)
    else if ((result as any).audioData) {
      audioData = (result as any).audioData;
      audioDataPath = "result.audioData";
      functions.logger.info("✅ Path 4 success: result.audioData");
    }

    // Method 5: Check if it's text instead of audio (wrong model!)
    else if (result.response?.text) {
      functions.logger.error("❌ Gemini returned TEXT instead of AUDIO");
      functions.logger.error("Text:", result.response.text);
      functions.logger.error("→ This is NOT a TTS model - it's a text model!");
      throw new Error(`Gemini returned text instead of audio - wrong model? Used: ${usedModelName}`);
    }

    // No audioData found - detailed error
    if (!audioData) {
      functions.logger.error("❌❌❌ audioData NOT FOUND in response!");
      functions.logger.error("Full response structure:");
      functions.logger.error(JSON.stringify(result, null, 2));

      // Debug: Log candidates details
      if (result.response?.candidates) {
        functions.logger.error("Candidates count:", result.response.candidates.length);
        result.response.candidates.forEach((candidate: any, idx: number) => {
          functions.logger.error(`Candidate ${idx}:`, JSON.stringify(candidate, null, 2));
        });
      }

      throw new Error(`No audioData found in Gemini response (model: ${usedModelName})`);
    }

    functions.logger.info(`✅ audioData found at: ${audioDataPath}`);
    functions.logger.info("📊 audioData type:", typeof audioData);
    functions.logger.info("📊 audioData size:", audioData?.length || "N/A");

    // Convert audioData to Buffer
    let buffer: Buffer;

    try {
      if (typeof audioData === "string") {
        // Base64 string
        functions.logger.info("📝 Converting Base64 string... length:", audioData.length);
        buffer = Buffer.from(audioData, "base64");
      } else if (Buffer.isBuffer(audioData)) {
        // Already a Buffer
        functions.logger.info("📦 Already a Buffer");
        buffer = audioData;
      } else if (audioData instanceof Uint8Array) {
        // Uint8Array
        functions.logger.info("🔢 Converting Uint8Array... length:", audioData.length);
        buffer = Buffer.from(audioData);
      } else if (Array.isArray(audioData)) {
        // Array of numbers
        functions.logger.info("📋 Converting Number Array... length:", audioData.length);
        buffer = Buffer.from(new Uint8Array(audioData));
      } else {
        functions.logger.error("❌ Unsupported audioData type:", typeof audioData);
        functions.logger.error("audioData:", audioData);
        throw new Error(`Unsupported audioData type: ${typeof audioData}`);
      }

      functions.logger.info("✅ Buffer conversion complete");
      functions.logger.info("📊 Buffer size:", buffer.length, "bytes");

      // Validate buffer
      if (buffer.length === 0) {
        throw new Error("Buffer is empty (0 bytes)");
      }

      if (buffer.length < 1000) {
        functions.logger.warn("⚠️ Buffer size is small (<1KB) - audio may be incomplete");
      }
    } catch (error: any) {
      functions.logger.error("❌ Buffer conversion failed:", error);
      throw error;
    }

    // If raw PCM, wrap into WAV container for browser compatibility
    const finalized = finalizeAudioBuffer(buffer);

    // Save to Cloud Storage
    functions.logger.info(`💾 Saving to Storage (${finalized.buffer.length} bytes)...`);

    const fileName = finalized.contentType === "audio/mpeg" ? fileNameMp3 : fileNameWav;
    const file = bucket.file(fileName);

    await file.save(finalized.buffer, {
      metadata: {
        contentType: finalized.contentType,
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
    functions.logger.error("❌ === Gemini TTS Generation FAILED ===");
    functions.logger.error("Error:", error.message);
    if (error.code) {
      functions.logger.error("Error code:", error.code);
    }
    if (error.stack) {
      functions.logger.error("Stack:", error.stack);
    }
    throw new Error(`Gemini TTS generation failed: ${error.message}`);
  }
}

function isWav(buffer: Buffer): boolean {
  return buffer.subarray(0, 4).toString("ascii") === "RIFF";
}

function isMp3(buffer: Buffer): boolean {
  const header = buffer.subarray(0, 3).toString("ascii");
  return header === "ID3" || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
}

function finalizeAudioBuffer(buffer: Buffer): {buffer: Buffer; contentType: string} {
  if (isWav(buffer)) {
    return {buffer, contentType: "audio/wav"};
  }

  if (isMp3(buffer)) {
    return {buffer, contentType: "audio/mpeg"};
  }

  // Assume raw PCM (L16, 24kHz, mono) and wrap with WAV header
  const wavBuffer = pcmToWav(buffer, 24000, 1, 16);
  return {buffer: wavBuffer, contentType: "audio/wav"};
}

function pcmToWav(pcm: Buffer, sampleRate: number, channels: number, bitsPerSample: number): Buffer {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = pcm.length;
  const headerSize = 44;
  const fileSize = headerSize + dataSize - 8;

  const header = Buffer.alloc(headerSize);
  header.write("RIFF", 0);
  header.writeUInt32LE(fileSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]);
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

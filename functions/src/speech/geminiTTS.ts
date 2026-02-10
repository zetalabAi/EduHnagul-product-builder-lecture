import {GoogleGenerativeAI} from "@google/generative-ai";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import * as functions from "firebase-functions";

// Lazy initialization
function getBucket() {
  return admin.storage().bucket("edu-hangul-tts-audio");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

interface TTSOptions {
  text: string;
  voiceName?: string; // 'Kore', 'Aoede', 'Charon', 'Fenrir', 'Puck' 등
  temperature?: number; // 1.5-2.0 권장
  styleInstructions?: string; // 사용자 대화 설정
}

/**
 * Generate natural-sounding TTS using Gemini 2.5 Pro Preview TTS
 * Dramatically better quality than Google Cloud TTS
 */
export async function generateGeminiTTS(options: TTSOptions): Promise<string> {
  const {
    text,
    voiceName = "Kore", // 한국어 여성 목소리
    temperature = 1.5,
    styleInstructions = "따뜻하고 친근한 톤으로 읽어주세요",
  } = options;

  // 캐싱용 해시
  const hash = crypto
    .createHash("sha256")
    .update(`${text}-${voiceName}-${temperature}-${styleInstructions}`)
    .digest("hex");

  const fileName = `gemini-tts/${hash}.mp3`;
  const bucket = getBucket();
  const file = bucket.file(fileName);

  // 캐시 확인
  const [exists] = await file.exists();
  if (exists) {
    functions.logger.info(`Using cached Gemini TTS: ${fileName}`);
    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  }

  functions.logger.info("Generating new Gemini TTS...");

  // Gemini TTS 생성
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
  });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${styleInstructions}\n\n다음 텍스트를 읽어주세요:\n\n${text}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature,
    },
  });

  // 오디오 추출
  const response = result.response;
  if (!response || !response.candidates || response.candidates.length === 0) {
    throw new Error("No response from Gemini TTS");
  }

  // Note: The actual API may return audio data differently
  // This is a placeholder - need to adjust based on actual API response
  const audioData = (response as any).audioContent;

  if (!audioData) {
    functions.logger.warn("Gemini TTS not available, falling back to text response");
    throw new Error("Audio data not available from Gemini");
  }

  // Cloud Storage에 저장
  const audioBuffer = Buffer.isBuffer(audioData) ?
    audioData :
    Buffer.from(audioData, "base64");

  await file.save(audioBuffer, {
    metadata: {
      contentType: "audio/mpeg",
      cacheControl: "public, max-age=604800", // 7일
    },
  });

  // Make file publicly readable
  await file.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  functions.logger.info(`Generated new Gemini TTS: ${publicUrl}`);

  return publicUrl;
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

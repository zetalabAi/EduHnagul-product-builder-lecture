import * as functions from "firebase-functions";
import {verifyAuth} from "../auth/authMiddleware";
import {AppError} from "../utils/errors";
import {generateGeminiTTSBase64, TUTOR_VOICE_MAP, getSpeechStylePrompt} from "./geminiTTS";

// ⚠️ 절대 수정 금지 ⚠️
// 이 TTS 설정은 Gemini AI Studio 감정 음성 전용입니다.
// Standard 보이스, 기계음, 기본 TTS로 절대 변경하지 마세요.
// 튜터: jimin=Aoede(여성 감정 풍부), minjun=Puck(남성 자연스러움)

interface SynthesizeSpeechRequest {
  text: string;
  tutor?: "jimin" | "minjun";         // 튜터 (보이스 결정)
  speechStyle?: "formal" | "casual";  // 말투 (감정 프롬프트 결정)
  // Legacy params (무시됨 — 기계음 방지를 위해 Gemini TTS로 override)
  voiceName?: string;
  languageCode?: string;
}

/**
 * Synthesizes speech using Gemini AI Studio TTS.
 * ⚠️ 감정 실린 자연스러운 음성 — 절대 기계음으로 변경 금지
 */
export const synthesizeSpeech = functions.https.onCall(
  async (data: SynthesizeSpeechRequest, context) => {
    verifyAuth(context);

    const {
      text,
      tutor = "jimin",
      speechStyle = "formal",
    } = data;

    if (!text || text.trim().length === 0) {
      throw new AppError("INVALID_INPUT", "Text is required", 400);
    }

    if (text.length > 3000) {
      throw new AppError("INVALID_INPUT", "Text too long (max 3000 characters)", 400);
    }

    // ⭐ 튜터별 감정 보이스 선택
    const voiceName = TUTOR_VOICE_MAP[tutor] ?? "Aoede";

    // ⭐ 튜터 + 말투 기반 감정 스타일 프롬프트
    const styleInstructions = getSpeechStylePrompt(text.trim(), tutor, speechStyle);

    functions.logger.info(`🎙️ Gemini TTS: voice=${voiceName}, tutor=${tutor}, style=${speechStyle}`);

    try {
      // ⚠️ 반드시 Gemini TTS 사용 (Google Cloud TTS 절대 금지)
      const { data: audioBase64, mimeType } = await generateGeminiTTSBase64({
        text: text.trim(),
        voiceName,
        temperature: 1.5,
        styleInstructions,
      });

      functions.logger.info(`✅ Gemini TTS 완료 (${voiceName}, ${mimeType})`);

      return {
        audioContent: audioBase64,
        audioFormat: mimeType.includes("mpeg") ? "mp3" : "wav",
        mimeType,
        textLength: text.length,
        voiceUsed: voiceName,
      };
    } catch (error: any) {
      functions.logger.error("❌ Gemini TTS 실패:", error.message);
      throw new AppError(
        "TTS_ERROR",
        `Gemini TTS failed: ${error.message}`,
        500
      );
    }
  }
);

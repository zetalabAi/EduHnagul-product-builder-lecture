import * as functions from "firebase-functions";
import {TextToSpeechClient} from "@google-cloud/text-to-speech";
import {verifyAuth} from "../auth/authMiddleware";
import {AppError} from "../utils/errors";

const ttsClient = new TextToSpeechClient();

interface SynthesizeSpeechRequest {
  text: string;
  voiceName?: string;
  speakingRate?: number;
  pitch?: number;
}

/**
 * Synthesizes speech from text using Google Cloud Text-to-Speech Journey voices
 * with emotional expression.
 */
export const synthesizeSpeech = functions.https.onCall(
  async (data: SynthesizeSpeechRequest, context) => {
    // Verify authentication
    verifyAuth(context);

    const {text, voiceName, speakingRate, pitch} = data;

    if (!text || text.trim().length === 0) {
      throw new AppError("INVALID_INPUT", "Text is required", 400);
    }

    if (text.length > 5000) {
      throw new AppError("INVALID_INPUT", "Text too long (max 5000 characters)", 400);
    }

    try {
      // Use Journey voice for natural emotional expression
      const request = {
        input: {text: text.trim()},
        voice: {
          languageCode: "ko-KR",
          // Journey voices: ko-KR-Journey-F, ko-KR-Journey-M
          name: voiceName || "ko-KR-Journey-F",
        },
        audioConfig: {
          audioEncoding: "MP3" as const,
          speakingRate: speakingRate || 1.0,
          pitch: pitch || 0.0,
          // Enable effects for more natural sound
          effectsProfileId: ["small-bluetooth-speaker-class-device"],
        },
      };

      const [response] = await ttsClient.synthesizeSpeech(request);

      if (!response.audioContent) {
        throw new AppError("TTS_ERROR", "Failed to synthesize speech", 500);
      }

      // Return audio as base64 for direct playback
      const audioBase64 = response.audioContent.toString("base64");

      return {
        audioContent: audioBase64,
        audioFormat: "mp3",
        textLength: text.length,
      };
    } catch (error: any) {
      functions.logger.error("TTS synthesis error:", error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        "TTS_ERROR",
        `Failed to synthesize speech: ${error.message}`,
        500
      );
    }
  }
);

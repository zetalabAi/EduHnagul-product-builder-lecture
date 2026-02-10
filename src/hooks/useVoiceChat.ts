"use client";

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

interface VoiceChatRequest {
  sessionId: string;
  userMessage: string;
  userSpeakingDuration?: number;
  settings?: {
    persona: string;
    responseStyle: string;
    correctionStrength: string;
    formalityLevel: string;
  };
}

interface VoiceChatResponse {
  messageId: string;
  aiMessage: string;
  audioContent: string; // base64 MP3
  inputTokens: number;
  outputTokens: number;
  remainingMinutes: number;
}

export function useVoiceChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (
    request: VoiceChatRequest
  ): Promise<VoiceChatResponse | null> => {
    if (!functions) {
      setError("Firebase Functions not initialized");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("🔥 Calling voiceChat Cloud Function...");
      const voiceChatFn = httpsCallable<VoiceChatRequest, VoiceChatResponse>(
        functions,
        "voiceChat"
      );

      const result = await voiceChatFn(request);
      console.log("✅ Voice chat success:", result.data);
      return result.data;
    } catch (err: any) {
      console.error("❌ Voice chat error:", err);
      console.error("Error details:", {
        code: err.code,
        message: err.message,
        details: err.details,
      });
      setError(err.message || "Failed to send voice message");
      alert(`음성 채팅 오류:\n\n${err.message || "알 수 없는 오류"}\n\n${err.details || ""}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendMessage,
    isLoading,
    error,
  };
}

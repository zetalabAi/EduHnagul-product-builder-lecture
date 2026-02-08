"use client";

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

interface VoiceChatRequest {
  sessionId: string;
  userMessage: string;
  userSpeakingDuration?: number;
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
      const voiceChatFn = httpsCallable<VoiceChatRequest, VoiceChatResponse>(
        functions,
        "voiceChat"
      );

      const result = await voiceChatFn(request);
      return result.data;
    } catch (err: any) {
      console.error("Voice chat error:", err);
      setError(err.message || "Failed to send voice message");
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

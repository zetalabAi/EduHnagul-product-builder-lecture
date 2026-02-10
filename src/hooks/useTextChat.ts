import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

interface TextChatRequest {
  sessionId: string;
  userMessage: string;
  settings?: {
    persona: string;
    responseStyle: string;
    correctionStrength: string;
    formalityLevel: string;
  };
}

interface TextChatResponse {
  messageId: string;
  aiMessage: string;
  remainingMinutes: number;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export function useTextChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (request: TextChatRequest): Promise<TextChatResponse | null> => {
    if (!functions) {
      setError("Firebase not initialized");
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const textChatFn = httpsCallable<TextChatRequest, TextChatResponse>(
        functions,
        "textChat"
      );

      const result = await textChatFn(request);
      return result.data;
    } catch (err: any) {
      console.error("Text chat error:", err);
      setError(err.message || "Failed to send message");
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

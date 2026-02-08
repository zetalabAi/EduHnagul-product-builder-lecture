"use client";

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

interface Suggestion {
  text: string;
  translation: string;
  situation: string;
}

interface AssistantResponse {
  suggestions: Suggestion[];
  canUseAgain: boolean;
  usageInfo: string;
}

export function useAssistant() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageInfo, setUsageInfo] = useState<string>("");
  const [canUseAgain, setCanUseAgain] = useState(true);

  const getSuggestions = async (sessionId: string): Promise<boolean> => {
    if (!functions) {
      setError("Firebase Functions not initialized");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const assistantFn = httpsCallable<{ sessionId: string }, AssistantResponse>(
        functions,
        "getAssistantSuggestion"
      );

      const result = await assistantFn({ sessionId });

      setSuggestions(result.data.suggestions);
      setUsageInfo(result.data.usageInfo);
      setCanUseAgain(result.data.canUseAgain);

      return true;
    } catch (err: any) {
      console.error("Assistant error:", err);

      if (err.code === "functions/resource-exhausted") {
        setError("어시스턴트 사용 횟수를 모두 사용했어요. Pro로 업그레이드하세요!");
      } else {
        setError(err.message || "제안을 가져오는데 실패했습니다");
      }

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearSuggestions = () => {
    setSuggestions([]);
    setError(null);
  };

  return {
    suggestions,
    isLoading,
    error,
    usageInfo,
    canUseAgain,
    getSuggestions,
    clearSuggestions,
  };
}

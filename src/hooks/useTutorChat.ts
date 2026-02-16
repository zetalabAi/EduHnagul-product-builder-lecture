import { useState, useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { SocraticMessage, TutorPersona, Lesson } from "@/types/tutor";

interface UseTutorChatOptions {
  tutorPersona: TutorPersona;
  lesson: Lesson;
  sessionId: string;
}

/**
 * useTutorChat Hook
 * Tutor 채팅 로직 관리
 */
export function useTutorChat({
  tutorPersona,
  lesson,
  sessionId,
}: UseTutorChatOptions) {
  const [messages, setMessages] = useState<SocraticMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Send message to tutor
   */
  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isLoading) return;

      setIsLoading(true);
      setError(null);

      // Add user message immediately
      const userMsg: SocraticMessage = {
        id: `msg-${Date.now()}-user`,
        role: "student",
        content: userMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);

      try {
        // Call tutorChat function
        const tutorChatFn = httpsCallable<
          {
            sessionId: string;
            lessonId: string;
            tutorPersona: TutorPersona;
            userMessage: string;
            conversationHistory: Array<{
              role: "tutor" | "student";
              content: string;
            }>;
          },
          {
            message: string;
            options?: string[];
            hint?: string;
            culturalNote?: string;
            grammarTip?: string;
            dramaReference?: string;
            isCorrect?: boolean;
            encouragement?: string;
          }
        >(functions, "tutorChat");

        const conversationHistory = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const result = await tutorChatFn({
          sessionId,
          lessonId: lesson.id,
          tutorPersona,
          userMessage,
          conversationHistory,
        });

        const response = result.data;

        // Add tutor response
        const tutorMsg: SocraticMessage = {
          id: `msg-${Date.now()}-tutor`,
          role: "tutor",
          content: response.message,
          options: response.options,
          hint: response.hint,
          culturalNote: response.culturalNote,
          grammarTip: response.grammarTip,
          dramaReference: response.dramaReference,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, tutorMsg]);
      } catch (err: any) {
        console.error("Tutor chat error:", err);
        setError(err.message || "메시지 전송에 실패했습니다.");

        // Remove user message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== userMsg.id));
      } finally {
        setIsLoading(false);
      }
    },
    [tutorPersona, lesson, sessionId, messages, isLoading]
  );

  /**
   * Handle option selection
   */
  const selectOption = useCallback(
    (option: string) => {
      sendMessage(option);
    },
    [sendMessage]
  );

  /**
   * Start lesson (initial greeting)
   */
  const startLesson = useCallback(async () => {
    if (messages.length > 0) return; // Already started

    setIsLoading(true);

    try {
      // Call tutorChat with a special "start" message
      const tutorChatFn = httpsCallable(functions, "tutorChat");

      const result = await tutorChatFn({
        sessionId,
        lessonId: lesson.id,
        tutorPersona,
        userMessage: "[START_LESSON]",
        conversationHistory: [],
      });

      const response = result.data as any;

      // Add initial tutor message
      const tutorMsg: SocraticMessage = {
        id: `msg-${Date.now()}-tutor`,
        role: "tutor",
        content: response.message || `안녕하세요! ${lesson.title} 레슨을 시작합니다. 준비되셨나요?`,
        options: response.options,
        hint: response.hint,
        timestamp: new Date(),
      };

      setMessages([tutorMsg]);
    } catch (err: any) {
      console.error("Start lesson error:", err);
      setError(err.message || "레슨 시작에 실패했습니다.");

      // Fallback greeting
      const fallbackMsg: SocraticMessage = {
        id: `msg-${Date.now()}-tutor`,
        role: "tutor",
        content: `안녕하세요! ${lesson.title} 레슨을 시작합니다. 준비되셨나요? 😊`,
        timestamp: new Date(),
      };
      setMessages([fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [tutorPersona, lesson, sessionId, messages.length]);

  /**
   * Clear messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    selectOption,
    startLesson,
    clearMessages,
  };
}

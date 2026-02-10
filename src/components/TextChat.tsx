"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTextChat } from "@/hooks/useTextChat";
import { useAssistant } from "@/hooks/useAssistant";
import { useUserCredits } from "@/hooks/useUserCredits";
import { SessionSummary } from "./SessionSummary";
import { getMessagesBySession } from "@/lib/firestore";
import { auth, functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";

interface TextChatProps {
  sessionId: string;
  remainingMinutes: number;
  onMinutesUpdate: (minutes: number) => void;
  isPro?: boolean;
  subscriptionTier: "free" | "free+" | "pro" | "pro+";
  onMenuClick?: () => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  tokens?: {
    input: number;
    output: number;
  };
}

export function TextChat({
  sessionId,
  remainingMinutes,
  onMinutesUpdate,
  isPro = false,
  subscriptionTier,
  onMenuClick,
}: TextChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Session settings
  const [sessionSettings, setSessionSettings] = useState({
    persona: "friend",
    responseStyle: "balanced",
    correctionStrength: "minimal",
    formalityLevel: "casual",
  });

  const { sendMessage, isLoading, error } = useTextChat();
  const {
    suggestions,
    isLoading: assistantLoading,
    error: assistantError,
    usageInfo,
    canUseAgain,
    getSuggestions,
    clearSuggestions,
  } = useAssistant();

  // Get user credits for Korean level
  const { credits } = useUserCredits(auth.currentUser?.uid || null);
  const [koreanLevel, setKoreanLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");

  // Load korean level from credits
  useEffect(() => {
    if (credits?.koreanLevel) {
      setKoreanLevel(credits.koreanLevel);
    }
  }, [credits]);

  // Auto-scroll to bottom when new messages arrive
  // Load existing messages on mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          console.error("No user authenticated");
          return;
        }

        const msgs = await getMessagesBySession(sessionId, userId);
        setMessages(
          msgs.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.createdAt,
            tokens: m.inputTokens && m.outputTokens
              ? { input: m.inputTokens, output: m.outputTokens }
              : undefined,
          }))
        );
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    loadMessages();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText("");

    // Add user message to UI
    const tempUserMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    // Send to backend with current settings
    const response = await sendMessage({
      sessionId,
      userMessage,
      settings: sessionSettings,
    });

    if (response) {
      // Add AI message to UI
      const aiMessage: Message = {
        id: response.messageId,
        role: "assistant",
        content: response.aiMessage,
        timestamp: new Date(),
        tokens: {
          input: response.inputTokens,
          output: response.outputTokens,
        },
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Update remaining minutes
      onMinutesUpdate(response.remainingMinutes);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBackClick = () => {
    // Session is auto-saved, just navigate back
    window.history.back();
  };

  const handleEndConversation = () => {
    setShowEndConfirm(true);
  };

  const confirmEndConversation = () => {
    setMessages([]);
    setShowEndConfirm(false);
    window.location.href = "/";
  };

  const handleHelpClick = async () => {
    if (messages.length === 0) {
      toast("먼저 대화를 시작해주세요! 대화 내용을 바탕으로 문장을 제안해드립니다.");
      return;
    }

    const success = await getSuggestions(sessionId);
    if (!success && assistantError) {
      toast.error(assistantError || "제안을 가져오는데 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleUseSuggestion = (suggestionText: string) => {
    setInputText(suggestionText);
    clearSuggestions();
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-3">
          {/* Mobile: Menu button */}
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden text-gray-400 hover:text-white transition"
              title="메뉴"
            >
              ☰
            </button>
          )}
          {/* Back button - always visible */}
          <button
            onClick={handleBackClick}
            className="text-gray-400 hover:text-white transition"
            title="뒤로가기"
          >
            ← 뒤로
          </button>
          <h1 className="text-xl font-bold">💬 텍스트 대화</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(true)}
            disabled={isLoading}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium disabled:opacity-50"
            title="대화 설정"
          >
            ⚙️
          </button>
          <button
            onClick={handleHelpClick}
            disabled={assistantLoading || isLoading || !canUseAgain}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title="대화 도우미"
          >
            💡
          </button>
          <button
            onClick={() => setShowSummary(true)}
            disabled={isLoading}
            className="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium disabled:opacity-50"
            title="학습 분석"
          >
            📊
          </button>
          <button
            onClick={handleEndConversation}
            disabled={isLoading}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium disabled:opacity-50"
            title="대화 끝내기"
          >
            ✕
          </button>
          <div className="text-sm">
            <span className="text-gray-400">남은:</span>{" "}
            <span className="font-bold text-blue-400">
              {remainingMinutes < 0 ? "∞" : `${remainingMinutes}분`}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <p className="text-gray-500 mb-4">
                아래 입력창에 메시지를 입력하고<br />
                Enter를 눌러 대화를 시작하세요!
              </p>
              <p className="text-sm text-gray-600">
                💡 Tip: Shift + Enter로 줄바꿈
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] md:max-w-[60%] rounded-lg px-4 py-3 ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-100"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                <span>
                  {msg.timestamp.toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {msg.tokens && isPro && (
                  <span className="text-gray-400 ml-2">
                    {msg.tokens.input + msg.tokens.output} tokens
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-lg px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900 bg-opacity-50 rounded-lg px-4 py-3 text-red-200 text-sm">
            ⚠️ {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Assistant suggestions modal */}
      {suggestions.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">💡 이렇게 말해보세요!</h3>
              <button
                onClick={clearSuggestions}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">{usageInfo}</p>

            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => handleUseSuggestion(suggestion.text)}
                  className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 cursor-pointer transition"
                >
                  <p className="font-bold text-lg mb-2">{suggestion.text}</p>
                  <p className="text-sm text-gray-300 mb-2">
                    {suggestion.translation}
                  </p>
                  <p className="text-xs text-gray-400 italic">
                    💬 {suggestion.situation}
                  </p>
                </div>
              ))}
            </div>

            {assistantError && (
              <div className="mt-4 bg-red-900 bg-opacity-50 rounded-lg p-3">
                <p className="text-sm text-red-200">{assistantError}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지 입력... (Enter: 전송, Shift+Enter: 줄바꿈)"
              disabled={isLoading}
              rows={1}
              className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 min-h-[48px] max-h-32"
              style={{
                height: "auto",
                minHeight: "48px",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = target.scrollHeight + "px";
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-bold transition-colors min-w-[80px]"
            >
              {isLoading ? "..." : "전송"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            💬 키보드로 편하게 대화하세요 | 음성 대화는{" "}
            <a href="/voice" className="text-blue-400 hover:underline">
              여기
            </a>
          </p>
        </div>
      </div>

      {/* Session Summary Modal */}
      {showSummary && (
        <SessionSummary
          sessionId={sessionId}
          onClose={() => setShowSummary(false)}
          isPro={isPro}
          subscriptionTier={subscriptionTier}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">⚙️ 대화 설정</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Persona */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  👤 대화 상대 (Persona)
                </label>
                <select
                  value={sessionSettings.persona}
                  onChange={(e) =>
                    setSessionSettings({ ...sessionSettings, persona: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="friend">👥 친구 (Friend)</option>
                  <option value="lover">❤️ 연인 (Lover)</option>
                </select>
                <p className="mt-2 text-xs text-gray-400">
                  {sessionSettings.persona === "friend" && "친구처럼 편안한 대화"}
                  {sessionSettings.persona === "lover" && "연인처럼 다정한 대화"}
                </p>
              </div>

              {/* Response Style */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  💬 응답 스타일 (Response Style)
                </label>
                <select
                  value={sessionSettings.responseStyle}
                  onChange={(e) =>
                    setSessionSettings({ ...sessionSettings, responseStyle: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="empathetic">😊 공감적 (Empathetic)</option>
                  <option value="balanced">⚖️ 균형적 (Balanced)</option>
                  <option value="blunt">💭 직설적 (Blunt)</option>
                </select>
                <p className="mt-2 text-xs text-gray-400">
                  {sessionSettings.responseStyle === "empathetic" && "따뜻하고 공감적인 응답"}
                  {sessionSettings.responseStyle === "balanced" && "균형잡힌 자연스러운 응답"}
                  {sessionSettings.responseStyle === "blunt" && "솔직하고 직설적인 응답"}
                </p>
              </div>

              {/* Correction Strength */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  ✏️ 교정 강도 (Correction Strength)
                </label>
                <select
                  value={sessionSettings.correctionStrength}
                  onChange={(e) =>
                    setSessionSettings({ ...sessionSettings, correctionStrength: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="minimal">🟢 최소 (Minimal)</option>
                  <option value="strict">🔴 엄격 (Strict)</option>
                </select>
                <p className="mt-2 text-xs text-gray-400">
                  {sessionSettings.correctionStrength === "minimal" && "자연스러운 대화 우선, 큰 실수만 교정"}
                  {sessionSettings.correctionStrength === "strict" && "문법과 표현을 세밀하게 교정"}
                </p>
              </div>

              {/* Formality Level */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  🎭 격식 수준 (Formality Level)
                </label>
                <select
                  value={sessionSettings.formalityLevel}
                  onChange={(e) =>
                    setSessionSettings({ ...sessionSettings, formalityLevel: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="formal">📋 격식체 (Formal)</option>
                  <option value="polite">🙂 존댓말 (Polite)</option>
                  <option value="casual">😊 반말 (Casual)</option>
                  <option value="intimate">🔥 친근한 반말 (Intimate)</option>
                </select>
                <p className="mt-2 text-xs text-gray-400">
                  {sessionSettings.formalityLevel === "formal" && "격식있는 정중한 말투"}
                  {sessionSettings.formalityLevel === "polite" && "기본적인 존댓말"}
                  {sessionSettings.formalityLevel === "casual" && "친구같은 편한 반말"}
                  {sessionSettings.formalityLevel === "intimate" && "진짜 친구처럼 자연스러운 말투와 슬랭"}
                </p>
              </div>

              {/* Korean Level */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  📚 한국어 레벨 (Korean Level)
                </label>
                <select
                  value={koreanLevel}
                  onChange={async (e) => {
                    const newLevel = e.target.value as "beginner" | "intermediate" | "advanced";
                    setKoreanLevel(newLevel);

                    // Update user profile
                    if (functions) {
                      try {
                        const updateFn = httpsCallable(functions, "updateProfile");
                        await updateFn({ koreanLevel: newLevel });
                        toast.success("한국어 레벨이 업데이트되었습니다!");
                      } catch (error: any) {
                        console.error("Failed to update Korean level:", error);
                        toast.error("레벨 업데이트에 실패했습니다.");
                      }
                    }
                  }}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">🌱 초급 (Beginner)</option>
                  <option value="intermediate">🌿 중급 (Intermediate)</option>
                  <option value="advanced">🌳 고급 (Advanced)</option>
                </select>
                <p className="mt-2 text-xs text-gray-400">
                  {koreanLevel === "beginner" && "짧은 문장, 기본 어휘, 한 번에 1개 질문"}
                  {koreanLevel === "intermediate" && "자연스러운 대화, 일상 어휘, 한 번에 1-2개 질문"}
                  {koreanLevel === "advanced" && "원어민 수준, 다양한 표현, 질문 개수 제한 없음"}
                </p>
              </div>

              {/* Info box */}
              <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4 border border-blue-700">
                <p className="text-sm text-blue-200">
                  💡 설정을 변경하면 다음 대화부터 즉시 적용됩니다.
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowSettings(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold transition"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back Confirmation Dialog */}
      {showBackConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">⚠️ 대화 중지</h3>
            <p className="text-gray-300 mb-6">
              현재 대화를 중지하고 뒤로 가시겠습니까?
              <br />
              <span className="text-sm text-gray-400 mt-2 block">
                (대화 기록은 저장되지 않습니다)
              </span>
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowBackConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition"
              >
                계속 대화
              </button>
              <button
                onClick={() => window.history.back()}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition"
              >
                뒤로가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Conversation Confirmation Dialog */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">✕ 대화 끝내기</h3>
            <p className="text-gray-300 mb-6">
              대화를 종료하고 홈으로 돌아가시겠습니까?
              <br />
              <span className="text-sm text-gray-400 mt-2 block">
                (현재 세션 데이터는 서버에 저장됩니다)
              </span>
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition"
              >
                취소
              </button>
              <button
                onClick={confirmEndConversation}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition"
              >
                대화 끝내기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

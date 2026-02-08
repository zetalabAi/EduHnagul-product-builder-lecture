"use client";

import { useEffect, useRef, useState } from "react";
import { useTextChat } from "@/hooks/useTextChat";
import { useAssistant } from "@/hooks/useAssistant";
import { SessionSummary } from "./SessionSummary";

interface TextChatProps {
  sessionId: string;
  remainingMinutes: number;
  onMinutesUpdate: (minutes: number) => void;
  isPro?: boolean;
  subscriptionTier: "free" | "free+" | "pro" | "pro+";
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
}: TextChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { sendMessage, isLoading, error } = useTextChat();
  const {
    suggestions,
    isLoading: assistantLoading,
    error: assistantError,
    usageInfo,
    getSuggestions,
    clearSuggestions,
  } = useAssistant();

  // Auto-scroll to bottom when new messages arrive
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

    // Send to backend
    const response = await sendMessage({
      sessionId,
      userMessage,
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

  const handleHelpClick = async () => {
    await getSuggestions(sessionId);
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
        <h1 className="text-xl font-bold">💬 텍스트 대화</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleHelpClick}
            disabled={assistantLoading || isLoading}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium disabled:opacity-50"
            title="대화 도우미"
          >
            💡 도움
          </button>
          <button
            onClick={() => setShowSummary(true)}
            disabled={isLoading}
            className="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium disabled:opacity-50"
            title="대화 요약"
          >
            📊 요약
          </button>
          <div className="text-sm">
            <span className="text-gray-400">남은:</span>{" "}
            <span className="font-bold text-blue-400">
              {remainingMinutes === Infinity ? "∞" : `${remainingMinutes}분`}
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
    </div>
  );
}

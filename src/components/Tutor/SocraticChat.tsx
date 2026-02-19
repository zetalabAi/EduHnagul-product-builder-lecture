"use client";

import { memo, useRef, useEffect } from "react";
import { SocraticMessage } from "@/types/tutor";
import QuestionCard from "./QuestionCard";
import HintPanel from "./HintPanel";

interface SocraticChatProps {
  messages: SocraticMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onSelectOption?: (option: string) => void;
}

/**
 * SocraticChat Component
 * Socratic Method 대화 UI
 */
const SocraticChat = memo(function SocraticChat({
  messages,
  isLoading,
  onSendMessage,
  onSelectOption,
}: SocraticChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = inputRef.current;
    if (input && input.value.trim()) {
      onSendMessage(input.value.trim());
      input.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message) => {
          if (message.role === "tutor") {
            return (
              <div key={message.id}>
                <QuestionCard
                  question={message.content}
                  options={message.options}
                  onSelectOption={onSelectOption}
                />
                {(message.hint ||
                  message.culturalNote ||
                  message.grammarTip ||
                  message.dramaReference) && (
                  <HintPanel
                    hint={message.hint}
                    culturalNote={message.culturalNote}
                    grammarTip={message.grammarTip}
                    dramaReference={message.dramaReference}
                  />
                )}
              </div>
            );
          } else {
            // Student message
            return (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[80%]">
                  <div className="bg-primary-600 text-white rounded-2xl px-4 py-3">
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                    {message.timestamp.toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          }
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                T
              </div>
            </div>
            <div className="flex-1">
              <div className="bg-gray-100 dark:bg-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-white px-4 py-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="메시지를 입력하세요..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-100 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="p-3 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>

        {/* Tips */}
        <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
          💡 자유롭게 답변하거나 선택지를 골라보세요
        </div>
      </div>
    </div>
  );
});

export default SocraticChat;

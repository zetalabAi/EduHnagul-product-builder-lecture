"use client";

import { Message } from "@/types";
import { useEffect, useRef } from "react";

interface ChatProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  isStreaming: boolean;
}

export default function Chat({
  messages,
  onSendMessage,
  inputValue,
  setInputValue,
  isStreaming,
}: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isStreaming) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="text-5xl mb-4">👋</div>
              <p className="text-lg font-medium mb-2">Start a conversation</p>
              <p className="text-sm">
                Type a message below to begin learning Korean
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                  {message.isStreaming && (
                    <span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse" />
                  )}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    message.role === "user"
                      ? "text-blue-200"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isStreaming}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 text-gray-800 dark:text-gray-200"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isStreaming}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

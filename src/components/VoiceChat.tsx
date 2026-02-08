"use client";

import { useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { useAssistant } from "@/hooks/useAssistant";
import { SessionSummary } from "./SessionSummary";
import { AdBanner } from "./AdBanner";
import { AdInterstitial } from "./AdInterstitial";

interface VoiceChatProps {
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
  audioUrl?: string;
  timestamp: Date;
}

export function VoiceChat({
  sessionId,
  remainingMinutes,
  onMinutesUpdate,
  isPro = false,
  subscriptionTier,
}: VoiceChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [speakingStartTime, setSpeakingStartTime] = useState<number | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Ad system (Free tier only)
  const [showStartAd, setShowStartAd] = useState(subscriptionTier === "free");
  const [showBannerAd, setShowBannerAd] = useState(false);
  const [conversationStartTime, setConversationStartTime] = useState<number | null>(null);
  const bannerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { sendMessage, isLoading } = useVoiceChat();
  const {
    suggestions,
    isLoading: assistantLoading,
    error: assistantError,
    usageInfo,
    getSuggestions,
    clearSuggestions,
  } = useAssistant();

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition({
    lang: "ko-KR",
    continuous: true,
    onResult: (text, isFinal) => {
      if (isFinal) {
        console.log("Final transcript:", text);
      }
    },
  });

  const handleStartSpeaking = () => {
    setSpeakingStartTime(Date.now());
    resetTranscript();
    startListening();
  };

  const handleHelpClick = async () => {
    const success = await getSuggestions(sessionId);
    if (success) {
      // Suggestions will be shown in UI automatically
    }
  };

  const handleUseSuggestion = (suggestionText: string) => {
    // Fill in the transcript with the suggestion
    resetTranscript();
    // Trigger a voice input with this text
    // For now, we'll just show it to the user
    alert(`제안 문장을 사용하려면 다음과 같이 말해보세요:\n\n"${suggestionText}"`);
    clearSuggestions();
  };

  const handleStopSpeaking = async () => {
    stopListening();

    if (!transcript || transcript.trim().length === 0) {
      alert("음성이 인식되지 않았습니다. 다시 시도해주세요.");
      setSpeakingStartTime(null);
      return;
    }

    // Calculate speaking duration
    const duration = speakingStartTime
      ? Math.ceil((Date.now() - speakingStartTime) / 1000)
      : 0;

    // Add user message to chat
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: transcript,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Send to backend
    const response = await sendMessage({
      sessionId,
      userMessage: transcript,
      userSpeakingDuration: duration,
    });

    if (response) {
      // Add AI message
      const aiMessage: Message = {
        id: response.messageId,
        role: "assistant",
        content: response.aiMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Update remaining minutes
      onMinutesUpdate(response.remainingMinutes);

      // Play TTS audio
      playAudio(response.audioContent);
    }

    resetTranscript();
    setSpeakingStartTime(null);
  };

  const playAudio = (base64Audio: string) => {
    try {
      const audioBlob = base64ToBlob(base64Audio, "audio/mp3");
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsPlayingAudio(true);
      }
    } catch (error) {
      console.error("Failed to play audio:", error);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  useEffect(() => {
    // Cleanup audio URL on unmount
    return () => {
      if (audioRef.current?.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      if (bannerIntervalRef.current) {
        clearInterval(bannerIntervalRef.current);
      }
    };
  }, []);

  // Start conversation timer when first ad is closed (Free tier only)
  const handleStartAdClose = () => {
    setShowStartAd(false);
    if (subscriptionTier === "free") {
      setConversationStartTime(Date.now());
      // Show banner ad every 5 minutes
      bannerIntervalRef.current = setInterval(() => {
        setShowBannerAd(true);
      }, 5 * 60 * 1000); // 5 minutes
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">음성 인식 미지원</h2>
          <p className="text-gray-400">
            브라우저가 음성 인식을 지원하지 않습니다.
            <br />
            Chrome, Edge, Safari를 사용해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header with timer and buttons */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
        <h1 className="text-xl font-bold">음성 대화</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleHelpClick}
            disabled={assistantLoading || isLoading}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            💡
          </button>
          <button
            onClick={() => setShowSummary(true)}
            disabled={isLoading}
            className="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            📊
          </button>
          <div className="text-sm">
            <span className="text-gray-400">남은:</span>{" "}
            <span className="font-bold text-blue-400">
              {remainingMinutes === Infinity ? "∞" : `${remainingMinutes}분`}
            </span>
          </div>
        </div>
      </div>

      {/* Banner Ad (Free tier, every 5min) */}
      {showBannerAd && subscriptionTier === "free" && (
        <div className="bg-gray-800 px-6 py-3 border-b border-gray-700">
          <AdBanner />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-center">
              버튼을 눌러 대화를 시작하세요!
              <br />
              <span className="text-sm">
                🎤 말하기 버튼을 길게 누르고 한국어로 말해보세요
              </span>
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-3 ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-100"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {msg.timestamp.toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
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

      {/* Current transcript */}
      {isListening && transcript && (
        <div className="bg-gray-800 border-t border-gray-700 px-6 py-3">
          <p className="text-sm text-gray-400 mb-1">인식 중...</p>
          <p className="text-white">{transcript}</p>
        </div>
      )}

      {/* Speak button */}
      <div className="bg-gray-800 px-6 py-6 border-t border-gray-700">
        <button
          onMouseDown={handleStartSpeaking}
          onMouseUp={handleStopSpeaking}
          onTouchStart={handleStartSpeaking}
          onTouchEnd={handleStopSpeaking}
          disabled={isLoading || isPlayingAudio}
          className={`w-full py-4 rounded-full font-bold text-lg transition-all ${
            isListening
              ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/50 animate-pulse"
              : isLoading || isPlayingAudio
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isListening
            ? "🎤 듣고 있어요... (떼면 전송)"
            : isLoading
              ? "⏳ AI가 생각 중..."
              : isPlayingAudio
                ? "🔊 AI 응답 중..."
                : "🎤 길게 눌러 말하기"}
        </button>
      </div>

      {/* Hidden audio element for TTS playback */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        onError={() => setIsPlayingAudio(false)}
      />

      {/* Session Summary Modal */}
      {showSummary && (
        <SessionSummary
          sessionId={sessionId}
          onClose={() => setShowSummary(false)}
          isPro={isPro}
          subscriptionTier={subscriptionTier}
        />
      )}

      {/* Start Ad Interstitial (Free tier only) */}
      {showStartAd && subscriptionTier === "free" && (
        <AdInterstitial onClose={handleStartAdClose} countdown={5} />
      )}
    </div>
  );
}

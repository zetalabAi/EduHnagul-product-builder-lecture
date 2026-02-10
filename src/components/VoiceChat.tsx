"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { useAssistant } from "@/hooks/useAssistant";
import { SessionSummary } from "./SessionSummary";
import { AdBanner } from "./AdBanner";
import { AdInterstitial } from "./AdInterstitial";
import { getMessagesBySession } from "@/lib/firestore";
import { auth } from "@/lib/firebase";

interface VoiceChatProps {
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
  audioUrl?: string;
  timestamp: Date;
}

export function VoiceChat({
  sessionId,
  remainingMinutes,
  onMinutesUpdate,
  isPro = false,
  subscriptionTier,
  onMenuClick,
}: VoiceChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [speakingStartTime, setSpeakingStartTime] = useState<number | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Session settings
  const [sessionSettings, setSessionSettings] = useState({
    persona: "friend",
    responseStyle: "balanced",
    correctionStrength: "minimal",
    formalityLevel: "casual",
  });

  // Recording state
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Ad system (Free tier only)
  const [showStartAd, setShowStartAd] = useState(subscriptionTier === "free");
  const [showBannerAd, setShowBannerAd] = useState(false);
  const [conversationStartTime, setConversationStartTime] = useState<number | null>(null);
  const bannerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { sendMessage, isLoading } = useVoiceChat();
  const {
    suggestions,
    isLoading: assistantLoading,
    error: assistantError,
    usageInfo,
    canUseAgain,
    getSuggestions,
    clearSuggestions,
  } = useAssistant();

  // Memoize speech recognition callbacks to prevent re-initialization
  const handleSpeechResult = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      console.log("Final transcript:", text);
    }
  }, []);

  const handleSpeechError = useCallback((error: string) => {
    console.error("Speech recognition error:", error);
    toast.error(`음성 인식 오류: ${error}\n\n마이크 권한을 확인해주세요.`);
  }, []);

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
    onResult: handleSpeechResult,
    onError: handleSpeechError,
  });

  const handleToggleRecording = () => {
    console.log("🎤 Toggle recording clicked. isListening:", isListening);
    if (isListening) {
      // 녹음 종료
      console.log("⏹️ Stopping recording");
      handleStopRecording();
    } else {
      // 녹음 시작
      console.log("▶️ Starting recording");
      handleStartRecording();
    }
  };

  const handleStartRecording = () => {
    console.log("🎙️ handleStartRecording called. isSupported:", isSupported);
    try {
      setSpeakingStartTime(Date.now());
      setRecordingDuration(0);
      resetTranscript();

      console.log("📞 Calling startListening()");
      // Start listening - this will request microphone permission
      startListening();

      // Start recording duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Haptic feedback for mobile
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      console.log("✅ Recording setup complete");
    } catch (error) {
      console.error("❌ Failed to start recording:", error);
      toast.error("마이크 권한이 필요합니다. 브라우저 설정에서 마이크 접근을 허용해주세요.");
      setSpeakingStartTime(null);
      setRecordingDuration(0);
    }
  };

  const handleStopRecording = async () => {
    stopListening();

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (!transcript || transcript.trim().length === 0) {
      toast.error("음성이 인식되지 않았습니다. 다시 시도해주세요.");
      setSpeakingStartTime(null);
      setRecordingDuration(0);
      return;
    }

    await sendTranscript();
  };

  const handleBackClick = () => {
    // Session is auto-saved, just navigate back
    window.history.back();
  };

  const handleEndConversation = () => {
    setShowEndConfirm(true);
  };

  const confirmEndConversation = () => {
    // Clear all state and go home
    setMessages([]);
    resetTranscript();
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
    // Fill in the transcript with the suggestion
    resetTranscript();
    // Trigger a voice input with this text
    // For now, we'll just show it to the user
    toast.success(`제안 문장을 사용하려면 다음과 같이 말해보세요:\n\n"${suggestionText}"`, { duration: 6000 });
    clearSuggestions();
  };

  const handleCancelRecording = () => {
    stopListening();
    resetTranscript();
    setSpeakingStartTime(null);
    setRecordingDuration(0);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }
  };

  const sendTranscript = async () => {
    if (!transcript || transcript.trim().length === 0) {
      toast.error("녹음된 내용이 없습니다.");
      return;
    }

    // Stop listening immediately
    stopListening();

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

    console.log("📤 Sending message to backend:", {
      sessionId,
      userMessage: transcript,
      duration,
    });

    // Send to backend with current settings
    const response = await sendMessage({
      sessionId,
      userMessage: transcript,
      userSpeakingDuration: duration,
      settings: sessionSettings,
    });

    console.log("📥 Received response:", response);

    if (response) {
      console.log("✅ Adding AI message to chat");
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
      console.log("🔊 Playing TTS audio");
      playAudio(response.audioContent);
    } else {
      console.error("❌ No response received from backend");
      toast.error("AI 응답을 받지 못했습니다. 다시 시도해주세요.");
    }

    // Clean up recording state
    resetTranscript();
    setSpeakingStartTime(null);
    setRecordingDuration(0);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
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
            audioUrl: m.audioUrl || undefined,
            timestamp: m.createdAt,
          }))
        );
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    loadMessages();
  }, [sessionId]);

  useEffect(() => {
    // Cleanup audio URL on unmount
    return () => {
      if (audioRef.current?.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      if (bannerIntervalRef.current) {
        clearInterval(bannerIntervalRef.current);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
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
    <div className="relative flex flex-col h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Minimal Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-2">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition"
            >
              ☰
            </button>
          )}
          <button
            onClick={handleBackClick}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition"
          >
            ←
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition text-lg"
          >
            ⚙️
          </button>
          <button
            onClick={handleHelpClick}
            disabled={assistantLoading || isLoading || !canUseAgain}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition disabled:opacity-30 text-lg"
          >
            💡
          </button>
        </div>
      </div>

      {/* Main Content - Centered Microphone Button */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        {/* Status Text at Top */}
        <div className="absolute top-20 text-center">
          <div className="text-sm text-gray-400">
            {remainingMinutes === Infinity ? "무제한" : `${remainingMinutes}분 남음`}
          </div>
        </div>

        {/* Latest Message Display */}
        {messages.length > 0 && !isListening && (
          <div className="w-full max-w-2xl mb-8 space-y-4 max-h-[40vh] overflow-y-auto px-4">
            {messages.slice(-3).map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-100"
                  }`}
                >
                  <p className="text-base">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Large Centered Microphone Button */}
        <div className="flex flex-col items-center justify-center space-y-6">
          {isListening ? (
            // Recording State - Pulsing Mic Button
            <>
              {/* Transcript Display */}
              {transcript && (
                <div className="absolute top-1/4 w-full max-w-md px-6 text-center">
                  <div className="bg-gray-800 bg-opacity-90 rounded-2xl px-6 py-4 backdrop-blur-sm">
                    <p className="text-sm text-gray-400 mb-2">인식 중...</p>
                    <p className="text-lg text-white">{transcript}</p>
                  </div>
                </div>
              )}

              {/* Pulsing Microphone */}
              <div className="relative">
                {/* Outer Pulse Rings */}
                <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-ping"></div>
                <div className="absolute inset-0 rounded-full bg-red-500 opacity-30 animate-pulse"></div>

                {/* Main Button */}
                <button
                  onClick={handleToggleRecording}
                  className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-2xl transform hover:scale-105 transition-transform flex items-center justify-center"
                >
                  <span className="text-6xl md:text-7xl">🎤</span>
                </button>
              </div>

              {/* Recording Timer */}
              <div className="flex items-center space-x-2 text-red-500 font-mono text-2xl font-bold">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span>
                  {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 mt-4">
                <button
                  onClick={handleCancelRecording}
                  className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-full font-bold transition"
                >
                  취소
                </button>
                <button
                  onClick={sendTranscript}
                  disabled={!transcript || transcript.trim().length === 0 || isLoading}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  전송
                </button>
              </div>
            </>
          ) : (
            // Idle State - Large Mic Button
            <>
              <button
                onClick={handleToggleRecording}
                disabled={isLoading || isPlayingAudio}
                className={`relative w-40 h-40 md:w-48 md:h-48 rounded-full shadow-2xl transform hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center ${
                  isLoading || isPlayingAudio
                    ? "bg-gradient-to-br from-gray-600 to-gray-700 cursor-not-allowed"
                    : "bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 hover:shadow-blue-500/50"
                }`}
              >
                {/* Glow Effect */}
                {!isLoading && !isPlayingAudio && (
                  <div className="absolute inset-0 rounded-full bg-blue-400 opacity-30 blur-xl animate-pulse"></div>
                )}

                <span className="relative text-8xl md:text-9xl">
                  {isLoading ? "⏳" : isPlayingAudio ? "🔊" : "🎤"}
                </span>
              </button>

              {/* Instruction Text */}
              <p className="text-gray-400 text-center text-lg mt-6">
                {isLoading
                  ? "AI가 생각하는 중..."
                  : isPlayingAudio
                    ? "AI 응답 중..."
                    : messages.length === 0
                      ? "마이크를 눌러 대화 시작"
                      : "마이크를 눌러 계속 대화하기"}
              </p>
            </>
          )}
        </div>

        {/* Loading Animation */}
        {isLoading && (
          <div className="absolute bottom-32 flex space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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

      {/* Start Ad Interstitial (Free tier only) */}
      {showStartAd && subscriptionTier === "free" && (
        <AdInterstitial onClose={handleStartAdClose} countdown={5} />
      )}
    </div>
  );
}

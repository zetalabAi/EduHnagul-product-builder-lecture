"use client";

import { useEffect, useRef, useState } from "react";

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

/**
 * Hook for Web Speech API (Speech Recognition)
 * Converts user's speech to text in real-time
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { lang = "ko-KR", continuous = false, onResult, onError } = options;

  // Use refs for callbacks to prevent re-initialization
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const accumulatedFinalTranscriptRef = useRef<string>(""); // Accumulate final transcripts

  // Update refs when callbacks change
  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  useEffect(() => {
    // Check if Speech Recognition is supported
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    // Initialize recognition
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log("🎤 Speech recognition started - setting isListening to true");
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptPart = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }

      // Accumulate final transcripts with space separator
      if (finalTranscript) {
        if (accumulatedFinalTranscriptRef.current) {
          accumulatedFinalTranscriptRef.current += " " + finalTranscript;
        } else {
          accumulatedFinalTranscriptRef.current = finalTranscript;
        }
      }

      // Combine accumulated finals + current interim
      const currentTranscript = accumulatedFinalTranscriptRef.current +
        (interimTranscript ? (accumulatedFinalTranscriptRef.current ? " " : "") + interimTranscript : "");

      setTranscript(currentTranscript);

      if (onResultRef.current) {
        onResultRef.current(currentTranscript, !!finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);

      if (onErrorRef.current) {
        onErrorRef.current(event.error);
      }
    };

    recognition.onend = () => {
      console.log("⏹️ Speech recognition ended - setting isListening to false");
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [lang, continuous]);

  const startListening = () => {
    console.log("🔊 startListening called. recognitionRef:", !!recognitionRef.current, "isListening:", isListening);
    if (recognitionRef.current && !isListening) {
      try {
        console.log("🚀 Calling recognition.start()");
        recognitionRef.current.start();
        console.log("✅ recognition.start() called successfully");
      } catch (error: any) {
        console.error("❌ Failed to start recognition:", error);
        if (onErrorRef.current) {
          onErrorRef.current(error.message || "Failed to start speech recognition");
        }
      }
    } else {
      console.warn("⚠️ Cannot start: recognitionRef =", !!recognitionRef.current, ", isListening =", isListening);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const resetTranscript = () => {
    setTranscript("");
    accumulatedFinalTranscriptRef.current = ""; // Also reset accumulated finals
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  };
}

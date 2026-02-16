/**
 * useShadowSpeaking Hook
 * Shadow Speaking 시스템 - 오디오 재생, 녹음, 동기화
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { ShadowContent, ShadowDifficulty, ShadowSentence } from "@/types/shadow";

export function useShadowSpeaking(contentId: string, userId: string | null) {
  const [content, setContent] = useState<ShadowContent | null>(null);
  const [level, setLevel] = useState<ShadowDifficulty>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [userAudioBlob, setUserAudioBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // 콘텐츠 로드
  useEffect(() => {
    if (!userId) return;
    loadContent();
  }, [contentId, userId]);

  const loadContent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const functions = getFunctions();
      const getContentFn = httpsCallable(functions, "getShadowContent");
      const result = await getContentFn({ contentId });
      const data = result.data as { content: ShadowContent };
      setContent(data.content);
    } catch (err: any) {
      console.error("Content load error:", err);
      setError(err.message || "콘텐츠 로드 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const startShadowing = useCallback(async () => {
    if (!content) return;

    setIsPlaying(true);
    setCurrentTime(0);
    recordedChunksRef.current = [];

    try {
      // 1. AudioContext 초기화
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      // 2. 원본 오디오 로드
      const response = await fetch(content.audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer =
        await audioContextRef.current.decodeAudioData(arrayBuffer);

      // 3. 소스 노드 생성 및 설정
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;

      // 레벨에 따른 속도 조절
      const settings = content.settings[`level${level}`];
      source.playbackRate.value = settings.speed;

      // 연결 및 재생
      source.connect(audioContextRef.current.destination);
      sourceNodeRef.current = source;

      const startTime = Date.now();
      startTimeRef.current = startTime;

      source.start();

      // 4. 사용자 녹음 시작 (딜레이 후)
      setTimeout(() => {
        startRecording();
      }, settings.delay);

      // 5. 시간 추적
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setCurrentTime(elapsed);

        // 재생 종료 체크
        if (elapsed >= content.duration / settings.speed) {
          stopShadowing();
        }
      }, 100);

      // 6. 소스 종료 리스너
      source.onended = () => {
        stopShadowing();
      };
    } catch (err) {
      console.error("Shadowing start error:", err);
      setError("섀도잉 시작 실패");
      setIsPlaying(false);
    }
  }, [content, level]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();
    } catch (err) {
      console.error("Recording start error:", err);
    }
  };

  const stopShadowing = useCallback(async () => {
    setIsPlaying(false);

    // 재생 정지
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      sourceNodeRef.current = null;
    }

    // 시간 추적 정지
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // 녹음 정지
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();

      // 녹음 데이터 처리
      await new Promise<void>((resolve) => {
        mediaRecorderRef.current!.onstop = () => {
          const audioBlob = new Blob(recordedChunksRef.current, {
            type: "audio/webm",
          });
          setUserAudioBlob(audioBlob);

          // 마이크 스트림 정지
          mediaRecorderRef.current
            ?.stream.getTracks()
            .forEach((track) => track.stop());

          resolve();
        };
      });

      // 분석 시작
      await analyzeShadowPerformance();
    }
  }, []);

  const analyzeShadowPerformance = async () => {
    if (!userAudioBlob || !content) return;

    try {
      // Blob을 Base64로 변환
      const base64Audio = await blobToBase64(userAudioBlob);

      const functions = getFunctions();
      const analyzeRhythmFn = httpsCallable(functions, "analyzeRhythm");
      const result = await analyzeRhythmFn({
        contentId,
        userAudioData: base64Audio,
        level,
      });

      return result.data;
    } catch (err) {
      console.error("Analysis error:", err);
      return null;
    }
  };

  const getCurrentSentence = (): ShadowSentence | null => {
    if (!content) return null;

    for (const sentence of content.sentences) {
      if (currentTime >= sentence.startTime && currentTime <= sentence.endTime) {
        return sentence;
      }
    }

    return null;
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // "data:audio/webm;base64," 제거
        resolve(base64.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (e) {
          // Already stopped
        }
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    content,
    level,
    setLevel,
    isPlaying,
    currentTime,
    userAudioBlob,
    isLoading,
    error,
    startShadowing,
    stopShadowing,
    getCurrentSentence,
    analyzeShadowPerformance,
  };
}

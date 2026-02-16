/**
 * useDramaPlay Hook
 * 드라마 에피소드 플레이 로직 관리
 */

import { useState, useCallback, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useRouter } from "next/navigation";
import { Scene, Episode } from "@/types/drama";

export function useDramaPlay(episodeId: string, userId: string | null) {
  const router = useRouter();
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [sceneHistory, setSceneHistory] = useState<string[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [pronunciationScore, setPronunciationScore] = useState(1.0);
  const [grammarScore, setGrammarScore] = useState(1.0);
  const [choices, setChoices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 에피소드 로드
  useEffect(() => {
    if (!userId) return;
    loadEpisode();
  }, [episodeId, userId]);

  const loadEpisode = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const functions = getFunctions();
      const getEpisodeFn = httpsCallable(functions, "getEpisode");
      const result = await getEpisodeFn({ episodeId });
      const data = result.data as any;

      setEpisode(data.episode);
      setCurrentScene(data.firstScene);
    } catch (err: any) {
      console.error("Episode load error:", err);
      setError(err.message || "에피소드 로드 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoice = useCallback(
    async (choiceId: string) => {
      if (!currentScene || !episode) return;

      // 선택지 찾기
      const choice = currentScene.choices?.find((c) => c.id === choiceId);
      if (!choice) return;

      // 점수 추가
      setTotalScore((prev) => prev + choice.points);

      // 선택 기록
      setChoices((prev) => [...prev, choiceId]);
      setSceneHistory((prev) => [...prev, currentScene.id]);

      try {
        const functions = getFunctions();
        const processChoiceFn = httpsCallable(functions, "processChoice");
        const result = await processChoiceFn({
          episodeId,
          sceneId: currentScene.id,
          choiceId,
        });

        const data = result.data as any;

        if (data.ending) {
          // 엔딩 계산
          await calculateAndShowEnding();
        } else {
          // 다음 씬
          setCurrentScene(data.nextScene);
        }
      } catch (err) {
        console.error("Choice processing error:", err);
      }
    },
    [currentScene, episode, episodeId, totalScore, choices]
  );

  const handleVoiceInput = useCallback(
    async (text: string, audioBlob?: Blob) => {
      if (!currentScene) return;

      // 음성/텍스트 응답 분석
      const response = await analyzeUserResponse(
        text,
        currentScene.expectedResponses || [],
        audioBlob
      );

      // 발음 점수 업데이트
      if (response.pronunciationScore !== undefined) {
        setPronunciationScore(
          (prev) => (prev + response.pronunciationScore) / 2
        );
      }

      // 문법 점수 업데이트
      if (response.grammarScore !== undefined) {
        setGrammarScore((prev) => (prev + response.grammarScore) / 2);
      }

      // 점수 계산
      const points = calculatePoints(
        response.accuracy,
        response.pronunciationScore || 1.0
      );
      setTotalScore((prev) => prev + points);

      // 다음 씬으로
      if (response.accuracy > 0.5) {
        moveToNextScene(currentScene.nextScene);
      }

      return response;
    },
    [currentScene]
  );

  const moveToNextScene = (nextSceneId?: string) => {
    if (!nextSceneId || !episode) return;

    if (nextSceneId === "ending") {
      calculateAndShowEnding();
      return;
    }

    const nextScene = episode.scenes.find((s) => s.id === nextSceneId);
    if (nextScene) {
      setSceneHistory((prev) => [...prev, currentScene?.id || ""]);
      setCurrentScene(nextScene);
    }
  };

  const calculateAndShowEnding = async () => {
    try {
      const functions = getFunctions();
      const calculateEndingFn = httpsCallable(functions, "calculateEnding");
      const result = await calculateEndingFn({
        episodeId,
        totalScore,
        pronunciationScore,
        grammarScore,
        choices,
      });

      const data = result.data as any;

      // 엔딩 화면으로 이동
      router.push(
        `/drama/result?episodeId=${episodeId}&endingId=${data.ending.id}`
      );
    } catch (err) {
      console.error("Ending calculation error:", err);
    }
  };

  const analyzeUserResponse = async (
    text: string,
    expectedResponses: string[],
    audioBlob?: Blob
  ) => {
    // 정확도 계산 (간단 버전)
    const accuracy = calculateTextAccuracy(text, expectedResponses);

    // 발음 점수 (음성이 있을 경우)
    let pronunciationScore = 1.0;
    if (audioBlob) {
      // TODO: 실제 발음 분석 API 호출
      pronunciationScore = 0.85; // 임시값
    }

    // 문법 점수
    const grammarScore = 0.9; // 임시값

    return {
      accuracy,
      pronunciationScore,
      grammarScore,
    };
  };

  const calculateTextAccuracy = (
    text: string,
    expectedResponses: string[]
  ): number => {
    const lowerText = text.toLowerCase().trim();

    for (const expected of expectedResponses) {
      const lowerExpected = expected.toLowerCase().trim();
      if (lowerText === lowerExpected) return 1.0;
      if (lowerText.includes(lowerExpected) || lowerExpected.includes(lowerText))
        return 0.8;
    }

    return 0.3;
  };

  const calculatePoints = (
    accuracy: number,
    pronunciationScore: number
  ): number => {
    const basePoints = 20;
    return Math.round(basePoints * accuracy * pronunciationScore);
  };

  return {
    episode,
    currentScene,
    sceneHistory,
    totalScore,
    pronunciationScore,
    grammarScore,
    isLoading,
    error,
    handleChoice,
    handleVoiceInput,
    moveToNextScene,
  };
}

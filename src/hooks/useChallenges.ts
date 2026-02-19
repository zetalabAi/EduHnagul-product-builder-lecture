/**
 * useChallenges Hook
 * Challenge System Management
 */

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  or,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import type { Challenge } from "../types/social";

export function useChallenges(userId: string | null) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time challenges
  useEffect(() => {
    if (!userId) {
      setChallenges([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const challengesRef = collection(db, "challenges");
    const q = query(
      challengesRef,
      where("participants", "array-contains", userId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const challengesList: Challenge[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: data.type,
            createdBy: data.createdBy,
            createdByName: data.createdByName,
            participants: data.participants,
            participantNames: data.participantNames,
            status: data.status,
            startDate: data.startDate?.toDate() || new Date(),
            endDate: data.endDate?.toDate() || new Date(),
            goal: data.goal,
            progress: data.progress || {},
            winner: data.winner,
            createdAt: data.createdAt?.toDate() || new Date(),
            completedAt: data.completedAt?.toDate(),
          };
        });

        setChallenges(challengesList);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading challenges:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Create challenge
  const createChallenge = useCallback(
    async (params: {
      friendId: string;
      type: "streak" | "xp" | "lessons";
      goal: number;
      durationDays: number;
    }) => {
      try {
        const createChallengeFn = httpsCallable(functions, "createChallenge");
        const result = await createChallengeFn(params);
        return result.data;
      } catch (err: any) {
        console.error("Error creating challenge:", err);
        throw new Error(err.message || "챌린지 생성에 실패했습니다.");
      }
    },
    []
  );

  // Update challenge progress
  const updateChallengeProgress = useCallback(async (challengeId: string) => {
    try {
      const updateChallengeFn = httpsCallable(functions, "updateChallenge");
      const result = await updateChallengeFn({ challengeId });
      return result.data;
    } catch (err: any) {
      console.error("Error updating challenge:", err);
      throw new Error(err.message || "챌린지 업데이트에 실패했습니다.");
    }
  }, []);

  // Complete challenge (for expired challenges)
  const completeChallenge = useCallback(async (challengeId: string) => {
    try {
      const completeChallengeFn = httpsCallable(functions, "completeChallenge");
      const result = await completeChallengeFn({ challengeId });
      return result.data;
    } catch (err: any) {
      console.error("Error completing challenge:", err);
      throw new Error(err.message || "챌린지 완료 처리에 실패했습니다.");
    }
  }, []);

  // Send cheer message
  const sendCheerMessage = useCallback(
    async (params: {
      friendId: string;
      message: string;
      emoji: string;
    }) => {
      try {
        const sendCheerMessageFn = httpsCallable(
          functions,
          "sendCheerMessage"
        );
        const result = await sendCheerMessageFn(params);
        return result.data;
      } catch (err: any) {
        console.error("Error sending cheer message:", err);
        throw new Error(err.message || "응원 메시지 전송에 실패했습니다.");
      }
    },
    []
  );

  // Get active challenges
  const activeChallenges = challenges.filter(
    (challenge) => challenge.status === "active"
  );

  // Get completed challenges
  const completedChallenges = challenges.filter(
    (challenge) => challenge.status === "completed"
  );

  return {
    challenges,
    activeChallenges,
    completedChallenges,
    loading,
    error,
    createChallenge,
    updateChallengeProgress,
    completeChallenge,
    sendCheerMessage,
  };
}

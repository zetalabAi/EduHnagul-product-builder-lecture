import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

export interface WeeklyStats {
  weekId: string;
  xp: number;
  lessonsCompleted: number;
  chatMessages: number;
  voiceMinutes: number;
  mistakeCount: number;
  streakDays: number;
  activeDays: number;
}

export interface AIComment {
  comment: string;
  sentiment: "praise" | "encourage" | "neutral";
  timestamp: any;
}

export interface LearningTree {
  level: number;
  totalXP: number;
  nextLevelXP: number;
  lastUpdated: any;
}

export interface WeeklyAnalysis {
  weekId: string;
  thisWeekStats: WeeklyStats;
  lastWeekStats: WeeklyStats;
  analysis: {
    xpChange: number;
    lessonChange: number;
    mistakeChange: number;
    streakChange: number;
  };
  aiComment: AIComment;
}

export function useProgressGarden(userId: string | undefined | null) {
  const [latestComment, setLatestComment] = useState<AIComment | null>(null);
  const [thisWeek, setThisWeek] = useState<WeeklyStats | null>(null);
  const [lastWeek, setLastWeek] = useState<WeeklyStats | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<WeeklyAnalysis | null>(null);
  const [learningTree, setLearningTree] = useState<LearningTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Latest AI weekly comment
    const commentsQuery = query(
      collection(db, "users", userId, "progressGarden", "analysis", "weekly"),
      orderBy("aiComment.timestamp", "desc"),
      limit(1)
    );

    const unsubComments = onSnapshot(
      commentsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data() as WeeklyAnalysis;
          setLatestComment(data.aiComment ?? null);
          setThisWeek(data.thisWeekStats ?? null);
          setLastWeek(data.lastWeekStats ?? null);
          setLatestAnalysis(data);
        }
      },
      (err) => {
        console.error("Failed to load garden analysis:", err);
        setError("분석 데이터를 불러오지 못했습니다.");
      }
    );

    // Learning Tree
    const treeRef = doc(db, "users", userId, "progressGarden", "learningTree");

    const unsubTree = onSnapshot(
      treeRef,
      (snap) => {
        if (snap.exists()) {
          setLearningTree(snap.data() as LearningTree);
        } else {
          // Default tree for new users
          setLearningTree({ level: 1, totalXP: 0, nextLevelXP: 1000, lastUpdated: null });
        }
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load learning tree:", err);
        setLoading(false);
      }
    );

    return () => {
      unsubComments();
      unsubTree();
    };
  }, [userId]);

  return {
    latestComment,
    thisWeek,
    lastWeek,
    latestAnalysis,
    learningTree,
    loading,
    error,
  };
}

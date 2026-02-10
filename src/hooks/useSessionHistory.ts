"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Session } from "@/types";

export function useSessionHistory(userId: string | null, isVoiceSession: boolean = false) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId || !db) {
      setIsLoading(false);
      return;
    }

    const sessionsRef = collection(db, "sessions");
    // Filter by userId AND isVoiceSession to separate voice/text histories
    const q = query(
      sessionsRef,
      where("userId", "==", userId),
      where("isVoiceSession", "==", isVoiceSession),
      orderBy("lastMessageAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sessionList: Session[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "Untitled",
            lastMessage: data.lastMessagePreview || "",
            timestamp: data.lastMessageAt?.toDate() || new Date(),
            isPinned: data.isPinned || false,
          };
        });

        // Sort by pinned first, then by timestamp (client-side for now)
        sessionList.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return b.timestamp.getTime() - a.timestamp.getTime();
        });

        setSessions(sessionList);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching session history:", error);
        setSessions([]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { sessions, isLoading };
}

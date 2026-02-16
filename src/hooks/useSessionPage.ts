import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "@/lib/firebase";
import { useUserCredits } from "./useUserCredits";
import { useSessionHistory } from "./useSessionHistory";

interface CreateSessionResponse {
  sessionId: string;
}

interface UseSessionPageOptions {
  isVoiceSession: boolean;
}

/**
 * Common hook for chat and voice pages
 * Handles auth, session management, and UI state
 */
export function useSessionPage({ isVoiceSession }: UseSessionPageOptions) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [renameSession, setRenameSession] = useState<{ id: string; title: string } | null>(null);

  const { credits, isLoading: creditsLoading } = useUserCredits(user?.uid || null);
  const { sessions, isLoading: sessionsLoading } = useSessionHistory(user?.uid || null, isVoiceSession);

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/auth/signin");
      } else {
        setUser(currentUser);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Create new session
  const handleNewSession = async () => {
    if (!functions) return;

    try {
      setIsLoading(true);

      const createSessionFn = httpsCallable<
        {
          persona: string;
          responseStyle: string;
          correctionStrength: string;
          formalityLevel: string;
          isVoiceSession: boolean;
        },
        CreateSessionResponse
      >(functions, "createSession");

      const result = await createSessionFn({
        persona: "same-sex-friend",
        responseStyle: "balanced",
        correctionStrength: "minimal",
        formalityLevel: "casual",
        isVoiceSession,
      });

      setSessionId(result.data.sessionId);
      setShowSidebar(false);
    } catch (error) {
      console.error("Failed to create session:", error);
      toast.error("세션 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // Select existing session
  const handleSelectSession = (id: string) => {
    setSessionId(id);
    setShowSidebar(false);
  };

  // Rename session
  const handleRenameSession = (id: string) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
      setRenameSession({ id, title: session.title });
    }
  };

  // Save renamed session
  const handleSaveRename = async (newTitle: string) => {
    if (!functions || !renameSession) return;

    try {
      const renameSessionFn = httpsCallable(functions, "renameSession");
      await renameSessionFn({ sessionId: renameSession.id, title: newTitle });
      setRenameSession(null);
    } catch (error) {
      console.error("Failed to rename session:", error);
      toast.error("이름 변경에 실패했습니다.");
    }
  };

  // Pin/unpin session
  const handlePinSession = async (id: string) => {
    // Implementation would go here
    console.log("Pin session:", id);
  };

  // Delete session
  const handleDeleteSession = async (id: string) => {
    if (!functions) return;

    try {
      const deleteSessionFn = httpsCallable(functions, "deleteSession");
      await deleteSessionFn({ sessionId: id });

      if (sessionId === id) {
        setSessionId(null);
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
      toast.error("세션 삭제에 실패했습니다.");
    }
  };

  return {
    user,
    sessionId,
    isLoading,
    showSidebar,
    setShowSidebar,
    renameSession,
    setRenameSession,
    credits,
    creditsLoading,
    sessions,
    sessionsLoading,
    handleNewSession,
    handleSelectSession,
    handleRenameSession,
    handleSaveRename,
    handlePinSession,
    handleDeleteSession,
  };
}

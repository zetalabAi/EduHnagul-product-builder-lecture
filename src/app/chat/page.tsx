"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "@/lib/firebase";
import { TextChat } from "@/components/TextChat";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useSessionHistory } from "@/hooks/useSessionHistory";
import Sidebar from "@/components/Sidebar";
import RenameDialog from "@/components/RenameDialog";

interface CreateSessionResponse {
  sessionId: string;
}

export default function TextChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [renameSession, setRenameSession] = useState<{ id: string; title: string } | null>(null);

  const { credits, isLoading: creditsLoading } = useUserCredits(user?.uid || null);
  const { sessions, isLoading: sessionsLoading } = useSessionHistory(user?.uid || null, false); // false = text sessions only

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
        isVoiceSession: false,
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

  const handleSelectSession = (id: string) => {
    setSessionId(id);
    setShowSidebar(false);
  };

  const handleRenameSession = (id: string) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
      setRenameSession({ id, title: session.title });
    }
  };

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

  const handlePinSession = async (id: string) => {
    if (!functions) return;

    try {
      const togglePinFn = httpsCallable(functions, "togglePinSession");
      await togglePinFn({ sessionId: id });
    } catch (error) {
      console.error("Failed to pin session:", error);
      toast.error("고정 설정에 실패했습니다.");
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!functions) return;

    const confirmed = confirm("이 대화를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.");
    if (!confirmed) return;

    try {
      const deleteSessionFn = httpsCallable(functions, "deleteSession");
      await deleteSessionFn({ sessionId: id });

      // If deleting current session, clear it
      if (sessionId === id) {
        setSessionId(null);
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
      toast.error("삭제에 실패했습니다.");
    }
  };

  if (isLoading || creditsLoading || sessionsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-gray-900 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  // Check if user has credits
  if (credits && credits.remainingMinutes <= 0 && credits.subscriptionTier !== "pro" && credits.subscriptionTier !== "pro+") {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-center max-w-md px-6 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">⏰ 시간 소진</h2>
          <p className="text-gray-600 mb-2">이번 주 무료 시간을 모두 사용했어요!</p>
          <p className="text-sm text-gray-500 mb-6">
            다음 충전: {credits.weeklyResetAt?.toLocaleDateString("ko-KR")}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => router.push("/pricing")}
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-6 py-3 rounded-lg font-bold shadow-md"
            >
              Pro로 업그레이드 (무제한!)
            </button>
            {credits.subscriptionTier === "free+" && (
              <button
                onClick={() => toast("추가 구매 기능 준비 중")}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 px-6 py-3 rounded-lg font-medium"
              >
                추가 60분 구매 ($2)
              </button>
            )}
            <button
              onClick={() => router.push("/")}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 px-6 py-3 rounded-lg font-medium"
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If no session selected, show session selector
  if (!sessionId) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        {/* Desktop sidebar - always visible */}
        <div className="hidden lg:block">
          <Sidebar
            sessions={sessions}
            currentSessionId=""
            onSessionSelect={handleSelectSession}
            onNewSession={handleNewSession}
            onRenameSession={handleRenameSession}
            onPinSession={handlePinSession}
            onDeleteSession={handleDeleteSession}
          />
        </div>

        {/* Mobile/tablet view */}
        <div className="flex-1 flex items-center justify-center lg:hidden">
          <div className="text-center px-6">
            <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">텍스트 대화</h1>
            <p className="text-gray-600 mb-8">새 대화를 시작하거나 기존 대화를 선택하세요</p>
            <div className="space-y-4">
              <button
                onClick={handleNewSession}
                className="w-full max-w-xs bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-6 py-3 rounded-lg font-bold shadow-md"
              >
                💬 새 대화 시작
              </button>
              {sessions.length > 0 && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="w-full max-w-xs bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 px-6 py-3 rounded-lg font-medium"
                >
                  📚 대화 기록 보기 ({sessions.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop empty state */}
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">새 대화를 시작하세요</h2>
            <p className="text-gray-600 mb-6">
              왼쪽 사이드바에서 "New Session"을 클릭하거나<br />
              기존 대화를 선택하세요
            </p>
          </div>
        </div>

        {/* Mobile drawer */}
        {showSidebar && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowSidebar(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-white transform transition-transform shadow-2xl">
              <Sidebar
                sessions={sessions}
                currentSessionId=""
                onSessionSelect={handleSelectSession}
                onNewSession={handleNewSession}
                onRenameSession={handleRenameSession}
                onPinSession={handlePinSession}
                onDeleteSession={handleDeleteSession}
              />
            </div>
          </div>
        )}

        {/* Rename dialog */}
        {renameSession && (
          <RenameDialog
            currentTitle={renameSession.title}
            onSave={handleSaveRename}
            onCancel={() => setRenameSession(null)}
          />
        )}
      </div>
    );
  }

  // Session selected - show chat
  if (!credits) {
    return null;
  }

  const isPro = credits.subscriptionTier === "pro" || credits.subscriptionTier === "pro+";

  return (
    <div className="flex h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Desktop sidebar - always visible on large screens */}
      <div className="hidden lg:block">
        <Sidebar
          sessions={sessions}
          currentSessionId={sessionId}
          onSessionSelect={handleSelectSession}
          onNewSession={handleNewSession}
          onRenameSession={handleRenameSession}
          onPinSession={handlePinSession}
          onDeleteSession={handleDeleteSession}
        />
      </div>

      {/* Mobile drawer - shown when menu clicked */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSidebar(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white transform transition-transform shadow-2xl">
            <Sidebar
              sessions={sessions}
              currentSessionId={sessionId}
              onSessionSelect={handleSelectSession}
              onNewSession={handleNewSession}
              onRenameSession={handleRenameSession}
              onPinSession={handlePinSession}
              onDeleteSession={handleDeleteSession}
            />
          </div>
        </div>
      )}

      {/* Main chat - full width */}
      <div className="flex-1 w-full">
        <TextChat
          sessionId={sessionId}
          remainingMinutes={credits.remainingMinutes}
          onMinutesUpdate={() => {}}
          isPro={isPro}
          subscriptionTier={credits.subscriptionTier}
          onMenuClick={() => setShowSidebar(true)}
        />
      </div>

      {/* Rename dialog */}
      {renameSession && (
        <RenameDialog
          currentTitle={renameSession.title}
          onSave={handleSaveRename}
          onCancel={() => setRenameSession(null)}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "@/lib/firebase";
import { TutorPersona, Lesson } from "@/types/tutor";
import { useTutorChat } from "@/hooks/useTutorChat";

// Components
import TutorSelector from "@/components/Tutor/TutorSelector";
import LessonProgress from "@/components/Tutor/LessonProgress";
import SocraticChat from "@/components/Tutor/SocraticChat";

/**
 * AI Tutor Page
 * Socratic Method 기반 학습
 */
export default function TutorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Tutor & Lesson state
  const [selectedTutor, setSelectedTutor] = useState<TutorPersona | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [sessionId] = useState<string>(`tutor-${Date.now()}`);
  const [lessonProgress, setLessonProgress] = useState(0);
  const [isLessonLoading, setIsLessonLoading] = useState(false);

  // Chat hook
  const tutorChat = selectedTutor && currentLesson
    ? useTutorChat({
        tutorPersona: selectedTutor,
        lesson: currentLesson,
        sessionId,
      })
    : null;

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/auth/signin");
      } else {
        setUser(currentUser);
        setIsAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Load user's current lesson
  useEffect(() => {
    if (!user) return;

    const loadCurrentLesson = async () => {
      setIsLessonLoading(true);

      try {
        const getUserCurrentLessonFn = httpsCallable<
          {},
          {
            lesson: Lesson;
            isNewUser?: boolean;
            progress?: {
              currentLesson: number;
              lessonsCompleted: number[];
              totalXP: number;
            };
          }
        >(functions, "getUserCurrentLesson");

        const result = await getUserCurrentLessonFn({});
        setCurrentLesson(result.data.lesson);
      } catch (error) {
        console.error("Failed to load lesson:", error);

        // Fallback to lesson 1
        setCurrentLesson({
          id: "lesson-1",
          number: 1,
          title: "자기소개",
          topic: "Self Introduction",
          difficulty: 0.1,
          objectives: ["이름 말하기", "국적 말하기", "직업 소개하기"],
          estimatedMinutes: 15,
          xpReward: 50,
        });
      } finally {
        setIsLessonLoading(false);
      }
    };

    loadCurrentLesson();
  }, [user]);

  // Start lesson when tutor is selected
  useEffect(() => {
    if (selectedTutor && tutorChat && tutorChat.messages.length === 0) {
      tutorChat.startLesson();
    }
  }, [selectedTutor, tutorChat]);

  // Update progress based on message count
  useEffect(() => {
    if (tutorChat && tutorChat.messages.length > 0) {
      // Simple progress calculation: 10% per exchange
      const exchanges = Math.floor(tutorChat.messages.length / 2);
      const progress = Math.min(exchanges * 10, 100);
      setLessonProgress(progress);
    }
  }, [tutorChat?.messages]);

  // Handle complete lesson
  const handleCompleteLesson = async () => {
    if (!currentLesson) return;

    try {
      const completeLessonFn = httpsCallable<
        { lessonId: string },
        { success: boolean; xpEarned: number; nextLesson: Lesson | null }
      >(functions, "completeLesson");

      const result = await completeLessonFn({ lessonId: currentLesson.id });

      // Show success message
      alert(`🎉 레슨 완료! ${result.data.xpEarned} XP 획득!`);

      // Move to next lesson
      if (result.data.nextLesson) {
        setCurrentLesson(result.data.nextLesson);
        setLessonProgress(0);
        tutorChat?.clearMessages();
      } else {
        // All lessons completed
        alert("🎊 모든 레슨을 완료했습니다!");
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to complete lesson:", error);
      alert("레슨 완료 처리에 실패했습니다.");
    }
  };

  // Loading state
  if (isAuthLoading || isLessonLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            로딩 중...
          </p>
        </div>
      </div>
    );
  }

  // Tutor selection screen
  if (!selectedTutor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
        <TutorSelector
          onSelect={setSelectedTutor}
          selectedTutor={selectedTutor}
        />
      </div>
    );
  }

  // Lesson screen
  if (!currentLesson || !tutorChat) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            레슨을 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Lesson Progress Bar */}
      <LessonProgress
        lesson={currentLesson}
        progress={lessonProgress}
        onBack={() => {
          setSelectedTutor(null);
          tutorChat.clearMessages();
        }}
      />

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <SocraticChat
          messages={tutorChat.messages}
          isLoading={tutorChat.isLoading}
          onSendMessage={tutorChat.sendMessage}
          onSelectOption={tutorChat.selectOption}
        />
      </div>

      {/* Complete Lesson Button */}
      {lessonProgress >= 100 && (
        <div className="p-4 bg-white dark:bg-white border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCompleteLesson}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all duration-300"
          >
            🎉 레슨 완료하기
          </button>
        </div>
      )}

      {/* Error Display */}
      {tutorChat.error && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg">
          {tutorChat.error}
        </div>
      )}
    </div>
  );
}

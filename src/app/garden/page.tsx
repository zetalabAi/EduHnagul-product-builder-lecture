"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { useProgressGarden } from "@/hooks/useProgressGarden";
import { useGarden } from "@/hooks/useGarden";
import { Card, CardHeader } from "@/components/ui/Card";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import GardenGrid from "@/components/Garden/GardenGrid";

type Tab = "progress" | "mistakes";

const TREE_EMOJIS = ["🌱", "🌿", "🌳", "🏔️", "⭐", "🌟"];

function getTreeEmoji(level: number): string {
  return TREE_EMOJIS[Math.min(Math.floor((level - 1) / 5), TREE_EMOJIS.length - 1)];
}

function calculateChange(current = 0, previous = 0): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                        */
/* ------------------------------------------------------------------ */

function StatRow({
  label,
  current,
  previous,
  inverse = false,
}: {
  label: string;
  current: number | string;
  previous: number | string;
  inverse?: boolean;
}) {
  const cNum = typeof current === "number" ? current : 0;
  const pNum = typeof previous === "number" ? previous : 0;
  const change = calculateChange(cNum, pNum);
  const isPositive = inverse ? change < 0 : change > 0;

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-body-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-body-sm text-gray-400">{previous}</span>
        <span className="text-body font-semibold text-gray-900">{current}</span>
        {change !== 0 && (
          <span
            className={`text-caption font-medium ${
              isPositive ? "text-green-600" : "text-red-500"
            }`}
          >
            {isPositive ? "↑" : "↓"}{Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );
}

function SentimentBadge({ sentiment }: { sentiment?: "praise" | "encourage" | "neutral" }) {
  if (!sentiment) return null;
  const map = {
    praise: { label: "칭찬", variant: "success" as const },
    encourage: { label: "응원", variant: "secondary" as const },
    neutral: { label: "리포트", variant: "gray" as const },
  };
  const { label, variant } = map[sentiment];
  return <Badge variant={variant} dot>{label}</Badge>;
}

/* ------------------------------------------------------------------ */
/* Main Page                                                             */
/* ------------------------------------------------------------------ */

export default function GardenPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("progress");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/auth/signin");
      } else {
        setUser(currentUser);
        setIsAuthLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const { latestComment, thisWeek, lastWeek, learningTree, loading: gardenLoading } =
    useProgressGarden(user?.uid);

  const {
    plants,
    stats,
    isLoading: mistakeLoading,
    error: mistakeError,
    waterPlant,
  } = useGarden(user?.uid ?? null);

  const handleWaterPlant = useCallback(
    async (plantId: string, success: boolean) => {
      try {
        return await waterPlant(plantId, success);
      } catch (err) {
        console.error("Failed to water plant:", err);
        throw err;
      }
    },
    [waterPlant]
  );

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  const treeLevel = learningTree?.level ?? 1;
  const treeEmoji = getTreeEmoji(treeLevel);
  const xpPercent = learningTree
    ? Math.round((learningTree.totalXP / learningTree.nextLevelXP) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-body-sm font-medium">홈</span>
          </button>
          <h1 className="text-h3">🌳 성장 정원</h1>
          <div className="w-16" />
        </div>

        {/* Tab Bar */}
        <div className="max-w-2xl mx-auto px-4 pb-0 flex gap-0">
          {(["progress", "mistakes"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-3 text-body-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "progress" ? "📊 주간 성장" : "🌸 실수 정원"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* ──────────────── Progress Tab ──────────────── */}
          {activeTab === "progress" && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Learning Tree Card */}
              <Card variant="elevated" padding="lg">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="text-6xl leading-none mb-2"
                    >
                      {treeEmoji}
                    </motion.div>
                    <span className="text-caption text-gray-500">레벨 {treeLevel}</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-body font-semibold text-gray-900">
                        나의 학습 나무
                      </span>
                      <Badge variant="primary">{treeLevel}단계</Badge>
                    </div>
                    <div className="mb-2">
                      <ProgressBar
                        value={learningTree?.totalXP ?? 0}
                        max={learningTree?.nextLevelXP ?? 1000}
                        color="success"
                        height="md"
                      />
                    </div>
                    <div className="flex justify-between text-caption text-gray-400">
                      <span>{learningTree?.totalXP ?? 0} XP</span>
                      <span>다음 레벨: {learningTree?.nextLevelXP ?? 1000} XP ({xpPercent}%)</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* AI Comment */}
              {gardenLoading ? (
                <Card variant="flat" padding="md">
                  <div className="animate-pulse h-16 bg-gray-200 rounded-button" />
                </Card>
              ) : latestComment ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Card variant="gradient" padding="md">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">💬</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-body-sm font-semibold text-gray-800">AI의 한마디</span>
                          <SentimentBadge sentiment={latestComment.sentiment} />
                        </div>
                        <p className="text-body-sm text-gray-700 whitespace-pre-line leading-relaxed">
                          {latestComment.comment}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <Card variant="flat" padding="md">
                  <p className="text-body-sm text-gray-500 text-center">
                    첫 번째 주간 리포트는 다음 월요일에 도착해요! 📬
                  </p>
                </Card>
              )}

              {/* This Week vs Last Week */}
              {(thisWeek || lastWeek) && (
                <Card variant="elevated" padding="md">
                  <CardHeader
                    title="이번 주 vs 지난 주"
                    icon="📊"
                    subtitle="지난 주 대비 변화량"
                  />
                  <div className="space-y-0">
                    <StatRow
                      label="XP 획득"
                      current={thisWeek?.xp ?? 0}
                      previous={lastWeek?.xp ?? 0}
                    />
                    <StatRow
                      label="완료한 레슨"
                      current={thisWeek?.lessonsCompleted ?? 0}
                      previous={lastWeek?.lessonsCompleted ?? 0}
                    />
                    <StatRow
                      label="채팅 메시지"
                      current={thisWeek?.chatMessages ?? 0}
                      previous={lastWeek?.chatMessages ?? 0}
                    />
                    <StatRow
                      label="발생한 실수"
                      current={thisWeek?.mistakeCount ?? 0}
                      previous={lastWeek?.mistakeCount ?? 0}
                      inverse
                    />
                    <StatRow
                      label="연속 학습일"
                      current={`${thisWeek?.streakDays ?? 0}일`}
                      previous={`${lastWeek?.streakDays ?? 0}일`}
                    />
                  </div>
                </Card>
              )}

              {/* Tip */}
              <div className="rounded-card bg-primary-50 border border-primary-100 px-4 py-3">
                <p className="text-body-sm text-primary-700">
                  💡 <strong>팁:</strong> 매주 월요일에 AI가 지난 주 학습을 분석해서 피드백을 드려요.
                  꾸준히 학습하면 나무가 쑥쑥 자라요! 🌱
                </p>
              </div>
            </motion.div>
          )}

          {/* ──────────────── Mistakes Tab ──────────────── */}
          {activeTab === "mistakes" && (
            <motion.div
              key="mistakes"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {mistakeError ? (
                <div className="rounded-card bg-error-light border border-red-200 p-6 text-center">
                  <p className="text-body-sm text-red-600 font-medium">{mistakeError}</p>
                </div>
              ) : (
                <>
                  <GardenGrid
                    plants={plants}
                    stats={stats}
                    isLoading={mistakeLoading}
                    onWaterPlant={handleWaterPlant}
                  />
                  <div className="mt-4 rounded-card bg-garden-primary/10 border border-green-100 px-4 py-3">
                    <p className="text-body-sm text-green-800">
                      💡 <strong>팁:</strong> 실수를 10번 연습하면 완벽하게 숙달됩니다!
                      각 식물을 클릭하여 연습하세요.
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

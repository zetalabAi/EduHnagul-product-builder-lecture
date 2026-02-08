"use client";

import { Session } from "@/types";

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
}

export default function Sidebar({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewSession,
}: SidebarProps) {
  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
          Edu_Hangul
        </h2>
      </div>

      {/* New Session Button */}
      <div className="p-4">
        <button
          onClick={onNewSession}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          + New Session
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            No sessions yet
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSessionSelect(session.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  currentSessionId === session.id
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                <div className="font-medium text-sm truncate">{session.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                  {session.lastMessage}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

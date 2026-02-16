"use client";

import { useState, useRef, memo } from "react";
import { Session } from "@/types";
import ContextMenu from "./ContextMenu";

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onRenameSession: (sessionId: string) => void;
  onPinSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

const Sidebar = memo(function Sidebar({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onRenameSession,
  onPinSession,
  onDeleteSession,
}: SidebarProps) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    sessionId: string;
    isPinned: boolean;
  } | null>(null);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, session: Session) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      sessionId: session.id,
      isPinned: session.isPinned || false,
    });
  };

  const handleTouchStart = (e: React.TouchEvent, session: Session) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };

    longPressTimer.current = setTimeout(() => {
      if (touchStart.current) {
        setContextMenu({
          x: touchStart.current.x,
          y: touchStart.current.y,
          sessionId: session.id,
          isPinned: session.isPinned || false,
        });
      }
    }, 800);
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStart.current = null;
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStart.current = null;
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-700">
          Edu_Hangul
        </h2>
      </div>

      {/* New Session Button */}
      <div className="p-4">
        <button
          onClick={onNewSession}
          className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-medium transition-colors"
        >
          + New Session
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-500 text-sm">
            No sessions yet
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSessionSelect(session.id)}
                onContextMenu={(e) => handleContextMenu(e, session)}
                onTouchStart={(e) => handleTouchStart(e, session)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`w-full text-left p-3 rounded-lg transition-colors relative ${
                  currentSessionId === session.id
                    ? "bg-primary-50 text-primary-600 font-semibold border-l-4 border-primary-500"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  {session.isPinned && (
                    <span className="text-xs" title="Pinned">📌</span>
                  )}
                  <div className="font-medium text-sm truncate flex-1">{session.title}</div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">
                  {session.lastMessage}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isPinned={contextMenu.isPinned}
          onRename={() => onRenameSession(contextMenu.sessionId)}
          onPin={() => onPinSession(contextMenu.sessionId)}
          onDelete={() => onDeleteSession(contextMenu.sessionId)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
});

export default Sidebar;

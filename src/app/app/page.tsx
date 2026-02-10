"use client";

import { useState, useCallback, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import Sidebar from "@/components/Sidebar";
import Chat from "@/components/Chat";
import SettingsPanel from "@/components/SettingsPanel";
import MobileHeader from "@/components/MobileHeader";
import Drawer from "@/components/Drawer";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { functions } from "@/lib/firebase";
import {
  getSessionsByUser,
  getSession,
  createSessionInFirestore,
  updateSessionSettings,
  getMessagesBySession,
} from "@/lib/firestore";
import {
  Message,
  Session,
  ChatSettings,
} from "@/types";
import { SessionDocument, MessageDocument } from "@/types/backend";

export default function AppPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<SessionDocument | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    persona: "same-sex-friend",
    responseStyle: "balanced",
    correctionStrength: "minimal",
    formalityLevel: "casual",
  });

  // Mobile drawer states
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load sessions on mount
  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      loadSessionAndMessages(currentSessionId);
    }
  }, [currentSessionId]);

  const loadSessions = async () => {
    if (!user) return;

    try {
      const userSessions = await getSessionsByUser(user.uid);
      setSessions(userSessions);

      // Auto-select first session or create new one
      if (userSessions.length > 0 && !currentSessionId) {
        setCurrentSessionId(userSessions[0].id);
      } else if (userSessions.length === 0) {
        await handleNewSession();
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  };

  const loadSessionAndMessages = async (sessionId: string) => {
    try {
      const [session, sessionMessages] = await Promise.all([
        getSession(sessionId),
        getMessagesBySession(sessionId),
      ]);

      if (session) {
        setCurrentSession(session);
        setSettings({
          persona: session.persona,
          responseStyle: session.responseStyle,
          correctionStrength: session.correctionStrength,
          formalityLevel: session.formalityLevel,
        });
      }

      // Convert Firestore messages to UI messages
      const uiMessages: Message[] = sessionMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt instanceof Date ? msg.createdAt : (msg.createdAt as any).toDate(),
      }));

      setMessages(uiMessages);
    } catch (error) {
      console.error("Failed to load session:", error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!user || !currentSessionId || isStreaming || !functions) return;

    // Add user message immediately
    const userMessage: Message = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);

    try {
      // Call Cloud Function
      const chatStreamFn = httpsCallable(functions, "chatStream");
      const result = await chatStreamFn({
        sessionId: currentSessionId,
        message: content,
      });

      const data = result.data as any;

      // Add assistant message with streaming simulation
      const assistantMessageId = data.messageId;
      const fullContent = data.content;
      const chunks = data.chunks || [];

      // Simulate streaming by adding words progressively
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Simulate word-by-word streaming
      for (let i = 0; i < chunks.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: chunks.slice(0, i + 1).join("") }
              : msg
          )
        );
      }

      // Remove streaming indicator
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: fullContent, isStreaming: false }
            : msg
        )
      );

      // Reload sessions to update last message
      loadSessions();
    } catch (error: any) {
      console.error("Failed to send message:", error);

      // Show error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `Error: ${error.message || "Failed to get response. Please try again."}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleNewSession = async () => {
    if (!user) return;

    try {
      const sessionId = await createSessionInFirestore(user.uid, settings);
      setCurrentSessionId(sessionId);
      setMessages([]);
      setIsMenuOpen(false);

      // Reload sessions list
      loadSessions();
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsMenuOpen(false);
  };

  const handleSettingsChange = async (newSettings: ChatSettings) => {
    setSettings(newSettings);

    if (currentSessionId) {
      try {
        await updateSessionSettings(currentSessionId, newSettings);
      } catch (error) {
        console.error("Failed to update settings:", error);
      }
    }
  };

  const handleTranslateUser = async () => {
    if (!currentSessionId || !functions) return;

    try {
      const translateFn = httpsCallable(functions, "translateLast");
      const result = await translateFn({
        sessionId: currentSessionId,
        role: "user",
      });

      const data = result.data as any;
      alert(`Translation:\n\n${data.original}\n\n→\n\n${data.translated}`);
    } catch (error: any) {
      console.error("Translation failed:", error);
      alert(`Translation failed: ${error.message}`);
    }
  };

  const handleTranslateAssistant = async () => {
    if (!currentSessionId || !functions) return;

    try {
      const translateFn = httpsCallable(functions, "translateLast");
      const result = await translateFn({
        sessionId: currentSessionId,
        role: "assistant",
      });

      const data = result.data as any;
      alert(`Translation:\n\n${data.original}\n\n→\n\n${data.translated}`);
    } catch (error: any) {
      console.error("Translation failed:", error);
      alert(`Translation failed: ${error.message}`);
    }
  };

  const currentSettingsText = `${settings.persona} • ${settings.responseStyle}`;

  return (
    <AuthGuard>
      <div className="h-screen flex flex-col">
        {/* Mobile Header */}
        <MobileHeader
          onMenuClick={() => setIsMenuOpen(true)}
          onSettingsClick={() => setIsSettingsOpen(true)}
          currentSettings={currentSettingsText}
        />

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <Sidebar
              sessions={sessions}
              currentSessionId={currentSessionId || ""}
              onSessionSelect={handleSessionSelect}
              onNewSession={handleNewSession}
              onRenameSession={() => {}}
              onPinSession={() => {}}
              onDeleteSession={() => {}}
            />
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Desktop Settings Pill */}
            <div className="hidden lg:block bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 rounded-full text-sm">
                <span className="font-medium">{settings.persona}</span>
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>{settings.responseStyle}</span>
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>{settings.correctionStrength}</span>
              </div>
            </div>

            <Chat
              messages={messages}
              onSendMessage={handleSendMessage}
              inputValue={inputValue}
              setInputValue={setInputValue}
              isStreaming={isStreaming}
            />
          </div>

          {/* Desktop Settings Panel */}
          <div className="hidden lg:block">
            <SettingsPanel
              settings={settings}
              onSettingsChange={handleSettingsChange}
              onTranslateUser={handleTranslateUser}
              onTranslateAssistant={handleTranslateAssistant}
            />
          </div>
        </div>

        {/* Mobile Drawers */}
        <Drawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} side="left">
          <div className="p-4">
            <button
              onClick={handleNewSession}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors mb-4"
            >
              + New Session
            </button>
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSessionSelect(session.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentSessionId === session.id
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <div className="font-medium text-sm truncate">{session.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                    {session.lastMessage || "No messages yet"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Drawer>

        <Drawer
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          side="right"
        >
          <SettingsPanel
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onTranslateUser={handleTranslateUser}
            onTranslateAssistant={handleTranslateAssistant}
          />
        </Drawer>
      </div>
    </AuthGuard>
  );
}

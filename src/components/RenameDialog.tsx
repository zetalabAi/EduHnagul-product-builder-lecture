"use client";

import { useState, useEffect, useRef } from "react";

interface RenameDialogProps {
  currentTitle: string;
  onSave: (newTitle: string) => void;
  onCancel: () => void;
}

export default function RenameDialog({
  currentTitle,
  onSave,
  onCancel,
}: RenameDialogProps) {
  const [title, setTitle] = useState(currentTitle);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSave = () => {
    const trimmed = title.trim();

    if (!trimmed) {
      setError("제목을 입력해주세요");
      return;
    }

    if (trimmed.length > 100) {
      setError("제목은 100자 이내로 입력해주세요");
      return;
    }

    onSave(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onCancel}
      >
        {/* Dialog */}
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            대화 이름 변경
          </h2>

          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="대화 제목 입력"
            maxLength={100}
          />

          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}

          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {title.length} / 100
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

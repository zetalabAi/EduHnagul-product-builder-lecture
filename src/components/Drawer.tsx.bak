"use client";

import { useEffect } from "react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side: "left" | "right";
  children: React.ReactNode;
}

export default function Drawer({ isOpen, onClose, side, children }: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 ${side === "left" ? "left-0" : "right-0"} h-full bg-white dark:bg-gray-900 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen
            ? "translate-x-0"
            : side === "left"
            ? "-translate-x-full"
            : "translate-x-full"
        }`}
        style={{ width: "80vw", maxWidth: "320px" }}
      >
        {/* Close Button */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {side === "left" ? "Sessions" : "Settings"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-64px)]">{children}</div>
      </div>
    </>
  );
}

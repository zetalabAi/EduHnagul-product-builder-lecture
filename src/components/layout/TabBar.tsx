"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

interface TabItem {
  icon: string;
  label: string;
  href: string;
  exact?: boolean;
}

const TABS: TabItem[] = [
  { icon: "🏠", label: "홈", href: "/home", exact: true },
  { icon: "📚", label: "레슨", href: "/tutor" },
  { icon: "💬", label: "채팅", href: "/chat" },
  { icon: "🌳", label: "정원", href: "/garden" },
  { icon: "👤", label: "설정", href: "/settings" },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-1">
        {TABS.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-button",
                "transition-all duration-fast",
                isActive
                  ? "text-primary-500"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <span
                className={clsx(
                  "text-xl leading-none transition-transform duration-fast",
                  isActive && "scale-110"
                )}
              >
                {tab.icon}
              </span>
              <span
                className={clsx(
                  "text-caption leading-none",
                  isActive && "font-semibold"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

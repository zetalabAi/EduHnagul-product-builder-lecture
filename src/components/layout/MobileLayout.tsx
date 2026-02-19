import { ReactNode } from "react";
import { TabBar } from "./TabBar";

interface MobileLayoutProps {
  children: ReactNode;
  showTabBar?: boolean;
  /** Extra bottom padding to avoid content hiding behind tab bar */
  className?: string;
}

export function MobileLayout({
  children,
  showTabBar = true,
  className = "",
}: MobileLayoutProps) {
  return (
    <div className={`min-h-screen bg-bg-primary ${className}`}>
      {children}
      {showTabBar && <TabBar />}
    </div>
  );
}

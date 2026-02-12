"use client";

import { useEffect } from "react";

interface AdBannerProps {
  adSlot?: string;
  adFormat?: "auto" | "rectangle" | "vertical" | "horizontal";
}

/**
 * Google AdSense Banner Ad
 * Only shown to Free tier users
 */
export function AdBanner({ adSlot = "1234567890", adFormat = "auto" }: AdBannerProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  // For development: Show placeholder
  if (process.env.NODE_ENV === "development") {
    return (
      <div className="bg-gray-700 border-2 border-yellow-500 rounded-lg p-4 text-center">
        <p className="text-yellow-400 text-sm font-bold mb-1">📺 광고 영역</p>
        <p className="text-gray-400 text-xs">Google AdSense Banner</p>
      </div>
    );
  }

  return (
    <div className="ad-banner-container">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Replace with your AdSense ID
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}

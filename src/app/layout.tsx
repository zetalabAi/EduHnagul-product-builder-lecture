import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edu_Hangul - AI 한국어 학습",
  description: "K-drama와 K-pop으로 배우는 재미있는 한국어. AI 선생님과 함께 즐겁게!",
  manifest: process.env.NODE_ENV === "production" ? "/manifest.json" : undefined,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Edu_Hangul",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-152x152.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#D63000",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <meta name="application-name" content="Edu_Hangul" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Edu_Hangul" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        {process.env.NODE_ENV === "production" && (
          <link rel="manifest" href="/manifest.json" />
        )}
        {/* Pretendard Font */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="antialiased bg-[#F8F9FA]">
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#FFFFFF',
              color: '#1A1A2E',
              borderRadius: '12px',
              fontSize: '14px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
            },
            success: {
              iconTheme: { primary: '#D63000', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#fff' },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}

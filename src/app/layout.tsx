import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edu_Hangul - Learn Korean Naturally",
  description: "Chat-first Korean learning experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

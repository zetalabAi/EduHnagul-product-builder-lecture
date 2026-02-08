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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

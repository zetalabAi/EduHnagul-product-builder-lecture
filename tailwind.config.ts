import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#D63000",
          dark:    "#B32700",
          mid:     "#FF5722",
          light:   "#FFF0EB",
        },
        accent: {
          DEFAULT: "#FF8C00",
          light:   "#FFF8F0",
        },
        surface: "#F8F9FA",
        success: "#10B981",
        warning: "#F59E0B",
        error:   "#EF4444",
      },
      fontFamily: {
        sans: ["Pretendard", "Inter", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        pill: "9999px",
        card: "16px",
      },
      boxShadow: {
        card:       "0 4px 12px rgba(0,0,0,0.10)",
        "card-lg":  "0 8px 24px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;

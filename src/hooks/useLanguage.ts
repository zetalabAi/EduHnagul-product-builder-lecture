"use client";

import { useState, useEffect, useCallback } from "react";
import { t as translate } from "@/lib/i18n";

export function useLanguage() {
  const [lang, setLang] = useState<string>("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("appLanguage") ?? "en";
      setLang(stored);
    }
  }, []);

  const t = useCallback(
    (key: string) => translate(key, lang),
    [lang]
  );

  return { lang, t };
}

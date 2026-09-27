import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "gm_theme";

function readInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((previous) => {
      const next: Theme = previous === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* 忽略存储异常 */
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const root = document.documentElement;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (theme: Theme) => {
      const isDark = theme === "dark" || (theme === "system" && systemTheme.matches);
      root.classList.toggle("dark", isDark);
      root.style.colorScheme = isDark ? "dark" : "light";
    };

    const getTheme = (): Theme => {
      const stored = window.localStorage.getItem("theme");
      return stored === "light" || stored === "dark" ? stored : "system";
    };

    const onSystemThemeChange = () => {
      if (getTheme() === "system") applyTheme("system");
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

      if (
        event.defaultPrevented ||
        event.repeat ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.key.toLowerCase() !== "d" ||
        isTyping
      ) {
        return;
      }

      const nextTheme = root.classList.contains("dark") ? "light" : "dark";
      window.localStorage.setItem("theme", nextTheme);
      applyTheme(nextTheme);
    };

    applyTheme(getTheme());
    systemTheme.addEventListener("change", onSystemThemeChange);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      systemTheme.removeEventListener("change", onSystemThemeChange);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return <>{children}</>;
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "dark" | "light";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "malx-theme";

const ThemeContext = createContext<ThemeContextValue | null>(
  null,
);

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "dark" || value === "light";
}

function applyThemeToDocument(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setThemeState] =
    useState<ThemeMode>("dark");

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    applyThemeToDocument(nextTheme);

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        nextTheme,
      );
    } catch {
      // The theme still works when storage is unavailable.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  useEffect(() => {
    let initialTheme: ThemeMode = "dark";

    try {
      const storedTheme =
        window.localStorage.getItem(STORAGE_KEY);

      if (isThemeMode(storedTheme)) {
        initialTheme = storedTheme;
      } else {
        const documentTheme =
          document.documentElement.dataset.theme;

        if (isThemeMode(documentTheme)) {
          initialTheme = documentTheme;
        }
      }
    } catch {
      const documentTheme =
        document.documentElement.dataset.theme;

      if (isThemeMode(documentTheme)) {
        initialTheme = documentTheme;
      }
    }

    setThemeState(initialTheme);
    applyThemeToDocument(initialTheme);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used within ThemeProvider.",
    );
  }

  return context;
}

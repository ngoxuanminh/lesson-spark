import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "lumi:coachio-api-key";

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string>("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setApiKeyState(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    try {
      if (key) {
        localStorage.setItem(STORAGE_KEY, key);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const clearApiKey = useCallback(() => {
    setApiKeyState("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { apiKey, setApiKey, clearApiKey };
}

/** Utility to read the key outside of React (e.g. in fetch helpers) */
export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

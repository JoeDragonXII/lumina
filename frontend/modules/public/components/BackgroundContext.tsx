"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type BackgroundMode = "image" | "aurora";

interface BackgroundContextValue {
  mode: BackgroundMode;
  toggleMode: () => void;
}

const BackgroundContext = createContext<BackgroundContextValue | null>(null);
const STORAGE_KEY = "lumina-bg-mode";
const CHANGE_EVENT = "lumina-bg-mode-change";

function readMode(): BackgroundMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === "aurora" ? "aurora" : "image";
  } catch {
    return "image";
  }
}

function subscribeToMode(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(
    subscribeToMode,
    readMode,
    (): BackgroundMode => "image",
  );

  const toggleMode = useCallback(() => {
    const next: BackgroundMode = readMode() === "image" ? "aurora" : "image";
    try {
      localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // localStorage may be unavailable in privacy mode.
    }
  }, []);

  return (
    <BackgroundContext.Provider value={{ mode, toggleMode }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackgroundMode(): BackgroundContextValue {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error("useBackgroundMode must be used within a BackgroundProvider");
  }
  return context;
}

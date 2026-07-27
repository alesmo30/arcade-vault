"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { SessionUser } from "@/app/data";

const STORAGE_KEY = "av_user";
const listeners = new Set<() => void>();
let cachedUser: SessionUser | null = null;
let hydrated = false;

function readStoredUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

function getSnapshot(): SessionUser | null {
  if (!hydrated) {
    cachedUser = readStoredUser();
    hydrated = true;
  }
  return cachedUser;
}

function getServerSnapshot(): SessionUser | null {
  return null;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function setUser(next: SessionUser | null) {
  cachedUser = next;
  hydrated = true;
  if (next) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  listeners.forEach((listener) => listener());
}

type AuthContextValue = {
  user: SessionUser | null;
  signIn: (user: SessionUser | null) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <AuthContext.Provider value={{ user, signIn: setUser, signOut: () => setUser(null) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSession(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useSession must be used within AuthProvider");
  return ctx;
}

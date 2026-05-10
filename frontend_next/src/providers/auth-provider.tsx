"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { APIService } from "@/services/api";

interface AuthTokens {
  access: string;
  refresh: string;
}

interface AuthContextValue {
  authTokens: AuthTokens | null;
  user: Record<string, unknown> | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authTokens, setAuthTokens] = useState<AuthTokens | null>(null);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("authTokens");
    if (stored) {
      try {
        let tokens = JSON.parse(stored) as AuthTokens;
        const decoded = jwtDecode<{ exp: number }>(tokens.access);

        if (decoded.exp * 1000 < Date.now()) {
          refreshToken(tokens)
        } 

        setAuthTokens(tokens);
        setUser(decoded);
        
      } catch {
        localStorage.removeItem("authTokens");
      }
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setAuthTokens(null);
    setUser(null);
    localStorage.clear();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = await APIService.loginUser({ username, password });
    setAuthTokens(data);
    setUser(jwtDecode(data.access));
    localStorage.setItem("authTokens", JSON.stringify(data));
  }, []);

  const refreshToken = useCallback(async (authTokens: AuthTokens) => {
    try {
      const data = await APIService.refreshToken(authTokens.refresh);
      setAuthTokens(data);
      setUser(jwtDecode(data.access));
      localStorage.setItem("authTokens", JSON.stringify(data));
    } catch {
      logout();
    }
  }, []);

  // Token refresh interval
  useEffect(() => {
    if (!authTokens) return;

    // Refresh every 14 minutes
    const interval = setInterval(refreshToken, 1000 * 60 * 14);
    return () => clearInterval(interval);
  }, [authTokens, logout]);

  return (
    <AuthContext.Provider value={{ authTokens, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

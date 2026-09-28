import { useCallback, useMemo, useState, type ReactNode } from "react";
import { login as apiLogin, signup as apiSignup } from "../api/auth";
import { clearSession, loadSession, saveSession } from "../api/authStorage";
import type { AuthSession, UserRole } from "../types/auth";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession());

  const login = useCallback(async (email: string, password: string) => {
    const next = await apiLogin(email, password);
    saveSession(next);
    setSession(next);
  }, []);

  const signup = useCallback(async (email: string, password: string, role: UserRole) => {
    const next = await apiSignup(email, password, role);
    saveSession(next);
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: session !== null,
      role: session?.role ?? null,
      login,
      signup,
      logout,
    }),
    [session, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
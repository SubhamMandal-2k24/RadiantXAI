import { useCallback, useMemo, useState } from "react";
import { login as apiLogin, signup as apiSignup } from "../api/auth";
import { clearSession, loadSession, saveSession } from "../api/authStorage";
import { AuthContext } from "./auth-context";
export function AuthProvider({ children }) {
    const [session, setSession] = useState(() => loadSession());
    const login = useCallback(async (email, password) => {
        const next = await apiLogin(email, password);
        saveSession(next);
        setSession(next);
    }, []);
    const signup = useCallback(async (email, password, role) => {
        const next = await apiSignup(email, password, role);
        saveSession(next);
        setSession(next);
    }, []);
    const logout = useCallback(() => {
        clearSession();
        setSession(null);
    }, []);
    const value = useMemo(() => ({
        session,
        isAuthenticated: session !== null,
        role: session?.role ?? null,
        login,
        signup,
        logout,
    }), [session, login, signup, logout]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

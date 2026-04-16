import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { isAuthenticated, setToken, clearToken } from "@/lib/auth";

interface AuthContextValue {
  authenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated());

  const login = useCallback((token: string) => {
    setToken(token);
    setAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

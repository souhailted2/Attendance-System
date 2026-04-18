import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

interface AuthUser {
  id: string;
  username: string;
  role: string;
  allowedShifts: string[] | null;
  allowedWorkshopIds: string[] | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function parseJsonField(val: string | null | undefined): string[] | null {
  if (!val) return null;
  try { return JSON.parse(val); } catch { return null; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) { setUser(null); return; }
        setUser({
          id: data.id,
          username: data.username,
          role: data.role ?? "staff",
          allowedShifts: parseJsonField(data.allowedShifts),
          allowedWorkshopIds: parseJsonField(data.allowedWorkshopIds),
        });
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(username: string, password: string) {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "فشل تسجيل الدخول");
    setUser({
      id: data.id,
      username: data.username,
      role: data.role ?? "staff",
      allowedShifts: parseJsonField(data.allowedShifts),
      allowedWorkshopIds: parseJsonField(data.allowedWorkshopIds),
    });
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

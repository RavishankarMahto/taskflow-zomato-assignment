import React, { createContext, useContext, useMemo, useState } from "react";
import { api, getStoredUser, getToken, setStoredUser, setToken, type User } from "../lib/api";

type AuthState = {
  user: User | null;
  token: string | null;
  login(email: string, password: string): Promise<void>;
  register(name: string, email: string, password: string): Promise<void>;
  logout(): void;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTok] = useState<string | null>(getToken());
  const [user, setUsr] = useState<User | null>(getStoredUser());

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      async login(email, password) {
        const r = await api.login({ email, password });
        setToken(r.token);
        setStoredUser(r.user);
        setTok(r.token);
        setUsr(r.user);
      },
      async register(name, email, password) {
        const r = await api.register({ name, email, password });
        setToken(r.token);
        setStoredUser(r.user);
        setTok(r.token);
        setUsr(r.user);
      },
      logout() {
        setToken(null);
        setStoredUser(null);
        setTok(null);
        setUsr(null);
      },
    }),
    [token, user]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}


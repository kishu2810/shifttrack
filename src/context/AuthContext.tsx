import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api } from '@/api';
import { clearSession, loadSession, saveSession } from '@/storage/authStorage';
import type { LoginCredentials, Session } from '@/types/auth';

type AuthContextValue = {
  session: Session | null;
  isRestoring: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    loadSession()
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setIsRestoring(false));
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const nextSession = await api.login(credentials);
    await saveSession(nextSession);
    setSession(nextSession);
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, isRestoring, login, logout }), [session, isRestoring, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
